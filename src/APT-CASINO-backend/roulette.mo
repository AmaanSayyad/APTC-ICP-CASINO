import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Result "mo:base/Result";
import Option "mo:base/Option";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Random "mo:base/Random";
import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Text "mo:base/Text";
import Nat64 "mo:base/Nat64";
import Types "types";
import Utils "utils";

actor class RouletteGame(aptcTokenCanisterId : Principal) = self {

    // Constants
    private let APTC_TOKEN_CANISTER_ID = aptcTokenCanisterId;
    private let PLATFORM_FEE_RATE : Nat = 5; // 0.5% = 5/1000
    private let MIN_BET_COOLDOWN : Int = 1_000_000_000; // 1 second in nanoseconds
    private let MAX_BETS_PER_ROUND : Nat = 100;

    // Game state
    private stable var owner : Principal = Principal.fromText("aaaaa-aa");
    private stable var treasury : Principal = Principal.fromText("aaaaa-aa");
    private stable var minBet : Nat = 10_000_000; // 0.1 APTC (8 decimals)
    private stable var maxBet : Nat = 1_000_000_000_000; // 10,000 APTC
    private stable var currentRound : Nat = 1;
    private stable var lastSpinTime : Int = 0;
    private stable var totalVolume : Nat = 0;
    private stable var totalBets : Nat = 0;
    private stable var houseProfits : Nat = 0;
    private stable var isInitialized : Bool = false;
    private stable var gameActive : Bool = true;

    // Mappings
    private stable var userBalanceEntries : [(Principal, Nat)] = [];
    private stable var userStatsEntries : [(Principal, Types.UserStats)] = [];
    private stable var lastBetTimeEntries : [(Principal, Int)] = [];

    private var userBalances = HashMap.fromIter<Principal, Nat>(userBalanceEntries.vals(), 0, Principal.equal, Principal.hash);
    private var userStats = HashMap.fromIter<Principal, Types.UserStats>(userStatsEntries.vals(), 0, Principal.equal, Principal.hash);
    private var lastBetTimes = HashMap.fromIter<Principal, Int>(lastBetTimeEntries.vals(), 0, Principal.equal, Principal.hash);

    // Game data
    private stable var currentBetsArray : [Types.Bet] = [];
    private stable var betHistoryArray : [Types.BetResult] = [];
    private stable var recentNumbersArray : [Nat] = [];
    private stable var roundStatsArray : [Types.RoundStats] = [];

    // Red numbers in European roulette
    private let redNumbers : [Nat] = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

    // Random seed for better randomness
    private stable var randomSeed : Nat = 0;

    // System upgrade functions
    system func preupgrade() {
        userBalanceEntries := Iter.toArray(userBalances.entries());
        userStatsEntries := Iter.toArray(userStats.entries());
        lastBetTimeEntries := Iter.toArray(lastBetTimes.entries());
    };

    system func postupgrade() {
        userBalanceEntries := [];
        userStatsEntries := [];
        lastBetTimeEntries := [];
    };

    // APTC Token interface
    private let aptcToken = actor (Principal.toText(APTC_TOKEN_CANISTER_ID)) : actor {
        icrc1_balance_of : (Types.Account) -> async Nat;
        icrc1_transfer : (Types.TransferArgs) -> async Types.TransferResult;
        icrc2_transfer_from : (Types.TransferFromArgs) -> async Types.TransferFromResult;
        icrc2_allowance : (Types.AllowanceArgs) -> async Types.Allowance;
        icrc1_fee : () -> async Nat;
        mint : (Types.Account, Nat) -> async Types.TransferResult;
        burn : (Types.Account, Nat) -> async Types.TransferResult;
    };

    // ==== CORE GAME FUNCTIONS ====

    // Place a bet
    public shared (msg) func placeBet(
        betType : Types.BetType,
        betValue : Nat8,
        amount : Nat,
        numbers : [Nat],
    ) : async Result.Result<Text, Text> {
        let caller = msg.caller;
        let now = Time.now();

        // Basic validations
        if (not gameActive) {
            return #err("Game is currently inactive");
        };

        if (amount < minBet) {
            return #err("Bet amount below minimum: " # Nat.toText(minBet));
        };

        if (amount > maxBet) {
            return #err("Bet amount exceeds maximum: " # Nat.toText(maxBet));
        };

        if (currentBetsArray.size() >= MAX_BETS_PER_ROUND) {
            return #err("Maximum bets per round reached");
        };

        // Rate limiting
        switch (lastBetTimes.get(caller)) {
            case (?lastTime) {
                if (now - lastTime < MIN_BET_COOLDOWN) {
                    return #err("Please wait before placing another bet");
                };
            };
            case null {};
        };

        // Validate bet parameters
        switch (validateBet(betType, betValue, numbers)) {
            case (#err(msg)) { return #err(msg) };
            case (#ok(_)) {};
        };

        // Handle token transfer
        let caller_account = Utils.defaultAccount(caller);
        let this_canister_account = Utils.defaultAccount(Principal.fromActor(self));

        // Check user's token balance
        let userBalance = await aptcToken.icrc1_balance_of(caller_account);
        if (userBalance < amount) {
            return #err("Insufficient APTC token balance");
        };

        // Check allowance
        let allowance = await aptcToken.icrc2_allowance({
            account = caller_account;
            spender = this_canister_account;
        });

        if (allowance.allowance < amount) {
            return #err("Insufficient allowance. Please approve tokens first.");
        };

        // Transfer tokens from user to contract
        let transferArgs : Types.TransferFromArgs = {
            spender_subaccount = null;
            from = caller_account;
            to = this_canister_account;
            amount = amount;
            fee = null;
            memo = ?Text.encodeUtf8("Roulette bet placement");
            created_at_time = null;
        };

        switch (await aptcToken.icrc2_transfer_from(transferArgs)) {
            case (#Err(error)) {
                return #err("Token transfer failed: " # debugTransferFromError(error));
            };
            case (#Ok(_)) {};
        };

        // Create and store bet
        let bet : Types.Bet = {
            player = caller;
            amount = amount;
            betType = betType;
            betValue = betValue;
            numbers = numbers;
            round = currentRound;
            timestamp = now;
        };

        currentBetsArray := Array.append(currentBetsArray, [bet]);
        lastBetTimes.put(caller, now);

        // Update user stats
        updateUserStats(caller, amount, false, 0);

        // Auto-spin if we have bets and enough time has passed
        ignore await autoSpin();

        #ok("Bet placed successfully for round " # Nat.toText(currentRound));
    };

    // Spin the roulette wheel
    public func spinRoulette() : async Result.Result<Types.SpinResult, Text> {
        if (currentBetsArray.size() == 0) {
            return #err("No bets placed for this round");
        };

        let now = Time.now();

        // Generate truly random number using multiple entropy sources
        let randomBlob = await Random.blob();
        let randomBytes = Blob.toArray(randomBlob);

        var entropy : Nat = randomSeed;
        for (byte in randomBytes.vals()) {
            entropy := entropy + Nat8.toNat(byte) * 256;
        };

        entropy := entropy + Int.abs(now) + currentRound + totalBets;
        randomSeed := entropy;

        let winningNumber = entropy % 37; // 0-36

        // Process all bets and calculate results
        let roundResults = await processBetsForRound(winningNumber);

        // Update recent numbers
        recentNumbersArray := Array.append([winningNumber], recentNumbersArray);
        if (recentNumbersArray.size() > 20) {
            recentNumbersArray := Array.subArray(recentNumbersArray, 0, 20);
        };

        // Create round statistics
        let roundStats : Types.RoundStats = {
            round = currentRound;
            winningNumber = winningNumber;
            totalBets = currentBetsArray.size();
            totalWagered = Array.foldLeft<Types.Bet, Nat>(currentBetsArray, 0, func(acc, bet) = acc + bet.amount);
            totalPayout = Array.foldLeft<Types.BetResult, Nat>(roundResults, 0, func(acc, result) = acc + result.winnings);
            houseProfitThisRound = calculateHouseProfitForRound(roundResults);
            timestamp = now;
        };

        roundStatsArray := Array.append(roundStatsArray, [roundStats]);
        if (roundStatsArray.size() > 100) {
            roundStatsArray := Array.subArray(roundStatsArray, 0, 100);
        };

        // Clear current bets and advance round
        currentBetsArray := [];
        currentRound += 1;
        lastSpinTime := now;

        let spinResult : Types.SpinResult = {
            round = roundStats.round;
            winningNumber = winningNumber;
            results = roundResults;
            totalWagered = roundStats.totalWagered;
            totalPayout = roundStats.totalPayout;
            houseProfitThisRound = roundStats.houseProfitThisRound;
        };

        #ok(spinResult);
    };

    // Auto-spin mechanism
    private func autoSpin() : async Bool {
        let now = Time.now();
        let timeSinceLastSpin = now - lastSpinTime;

        // Auto-spin if there are bets and 30 seconds have passed since last spin
        if (currentBetsArray.size() > 0 and timeSinceLastSpin > 30_000_000_000) {
            switch (await spinRoulette()) {
                case (#ok(_)) { true };
                case (#err(_)) { false };
            };
        } else {
            false;
        };
    };

    // Process all bets for a round
    private func processBetsForRound(winningNumber : Nat) : async [Types.BetResult] {
        let treasury_account = Utils.defaultAccount(treasury);
        var results : [Types.BetResult] = [];

        for (bet in currentBetsArray.vals()) {
            let player_account = Utils.defaultAccount(bet.player);
            let (won, grossPayout) = calculateWinnings(bet, winningNumber);

            var actualPayout : Nat = 0;
            var platformFee : Nat = 0;

            if (won and grossPayout > 0) {
                // Calculate platform fee on winnings
                platformFee := (grossPayout * PLATFORM_FEE_RATE) / 1000;
                actualPayout := if (grossPayout > platformFee) {
                    grossPayout - platformFee;
                } else { 0 };

                // Transfer winnings to player
                if (actualPayout > 0) {
                    let transferToPlayer : Types.TransferArgs = {
                        from_subaccount = null;
                        to = player_account;
                        amount = actualPayout;
                        fee = null;
                        memo = ?Text.encodeUtf8("Roulette winnings");
                        created_at_time = null;
                    };
                    ignore await aptcToken.icrc1_transfer(transferToPlayer);

                    // Update user balance
                    let currentBalance = Option.get(userBalances.get(bet.player), 0);
                    userBalances.put(bet.player, currentBalance + actualPayout);
                };

                // Transfer platform fee to treasury
                if (platformFee > 0) {
                    let transferToTreasury : Types.TransferArgs = {
                        from_subaccount = null;
                        to = treasury_account;
                        amount = platformFee;
                        fee = null;
                        memo = ?Text.encodeUtf8("Platform fee");
                        created_at_time = null;
                    };
                    ignore await aptcToken.icrc1_transfer(transferToTreasury);
                };

                // Update user stats for win
                updateUserStats(bet.player, bet.amount, true, actualPayout);
            } else {
                // Lost bet - transfer to treasury
                let transferToTreasury : Types.TransferArgs = {
                    from_subaccount = null;
                    to = treasury_account;
                    amount = bet.amount;
                    fee = null;
                    memo = ?Text.encodeUtf8("House winnings");
                    created_at_time = null;
                };
                ignore await aptcToken.icrc1_transfer(transferToTreasury);

                houseProfits := houseProfits + bet.amount;
            };

            // Create bet result
            let result : Types.BetResult = {
                player = bet.player;
                amount = bet.amount;
                won = won;
                winnings = actualPayout;
                round = bet.round;
                number = winningNumber;
                timestamp = Time.now();
                betType = bet.betType;
                betValue = bet.betValue;
            };

            results := Array.append(results, [result]);
            betHistoryArray := Array.append(betHistoryArray, [result]);

            // Keep only last 1000 bet results
            if (betHistoryArray.size() > 1000) {
                betHistoryArray := Array.subArray(betHistoryArray, 0, 1000);
            };
        };

        // Update global stats
        totalBets := totalBets + currentBetsArray.size();
        totalVolume := totalVolume + Array.foldLeft<Types.Bet, Nat>(currentBetsArray, 0, func(acc, bet) = acc + bet.amount);

        results;
    };

    // Calculate winnings for a bet
    private func calculateWinnings(bet : Types.Bet, winningNumber : Nat) : (Bool, Nat) {
        switch (bet.betType) {
            case (#Number) {
                if (Nat8.toNat(bet.betValue) == winningNumber) {
                    (true, bet.amount * 36) // 35:1 + original bet
                } else { (false, 0) };
            };
            case (#Color) {
                if (winningNumber == 0) {
                    (false, 0) // Green 0
                } else {
                    let isRed = Utils.isRedNumber(winningNumber);
                    let betOnRed = bet.betValue == 1;
                    if (isRed == betOnRed) {
                        (true, bet.amount * 2) // 1:1 + original bet
                    } else { (false, 0) };
                };
            };
            case (#OddEven) {
                if (winningNumber == 0) {
                    (false, 0) // 0 is neither odd nor even
                } else {
                    let isEven = winningNumber % 2 == 0;
                    let betOnEven = bet.betValue == 1;
                    if (isEven == betOnEven) {
                        (true, bet.amount * 2) // 1:1 + original bet
                    } else { (false, 0) };
                };
            };
            case (#HighLow) {
                if (winningNumber == 0) {
                    (false, 0) // 0 is neither high nor low
                } else {
                    let isHigh = winningNumber >= 19;
                    let betOnHigh = bet.betValue == 1;
                    if (isHigh == betOnHigh) {
                        (true, bet.amount * 2) // 1:1 + original bet
                    } else { (false, 0) };
                };
            };
            case (#Dozen) {
                if (winningNumber == 0) { (false, 0) } else {
                    let dozen = if (winningNumber >= 1 and winningNumber <= 12) {
                        0;
                    } else if (winningNumber >= 13 and winningNumber <= 24) {
                        1;
                    } else { 2 };
                    if (dozen == Nat8.toNat(bet.betValue)) {
                        (true, bet.amount * 3) // 2:1 + original bet
                    } else { (false, 0) };
                };
            };
            case (#Column) {
                if (winningNumber == 0) { (false, 0) } else if (winningNumber >= 1 and winningNumber <= 36) {
                    // Calculate column safely: numbers 1,4,7... = column 0; 2,5,8... = column 1; 3,6,9... = column 2
                    let column = (winningNumber + 2) % 3; // Offset by 2 to get correct column mapping
                    if (column == Nat8.toNat(bet.betValue)) {
                        (true, bet.amount * 3) // 2:1 + original bet
                    } else { (false, 0) };
                } else { (false, 0) };
            };
            case (#Split) {
                if (Utils.containsNumber(bet.numbers, winningNumber)) {
                    (true, bet.amount * 18) // 17:1 + original bet
                } else { (false, 0) };
            };
            case (#Street) {
                if (Utils.containsNumber(bet.numbers, winningNumber)) {
                    (true, bet.amount * 12) // 11:1 + original bet
                } else { (false, 0) };
            };
            case (#Corner) {
                if (Utils.containsNumber(bet.numbers, winningNumber)) {
                    (true, bet.amount * 9) // 8:1 + original bet
                } else { (false, 0) };
            };
            case (#Line) {
                if (Utils.containsNumber(bet.numbers, winningNumber)) {
                    (true, bet.amount * 6) // 5:1 + original bet
                } else { (false, 0) };
            };
        };
    };

    // ==== UTILITY FUNCTIONS ====

    // Validate bet parameters
    private func validateBet(betType : Types.BetType, betValue : Nat8, numbers : [Nat]) : Result.Result<(), Text> {
        switch (betType) {
            case (#Number) {
                if (Nat8.toNat(betValue) > 36) {
                    #err("Number must be 0-36");
                } else { #ok() };
            };
            case (#Color or #OddEven or #HighLow) {
                if (Nat8.toNat(betValue) > 1) {
                    #err("Value must be 0 or 1");
                } else { #ok() };
            };
            case (#Dozen or #Column) {
                if (Nat8.toNat(betValue) > 2) {
                    #err("Value must be 0, 1, or 2");
                } else { #ok() };
            };
            case (#Split) {
                if (numbers.size() != 2) {
                    #err("Split bet requires exactly 2 numbers");
                } else { validateNumbers(numbers) };
            };
            case (#Street) {
                if (numbers.size() != 3) {
                    #err("Street bet requires exactly 3 numbers");
                } else { validateNumbers(numbers) };
            };
            case (#Corner) {
                if (numbers.size() != 4) {
                    #err("Corner bet requires exactly 4 numbers");
                } else { validateNumbers(numbers) };
            };
            case (#Line) {
                if (numbers.size() != 6) {
                    #err("Line bet requires exactly 6 numbers");
                } else { validateNumbers(numbers) };
            };
        };
    };

    // Validate numbers are within range
    private func validateNumbers(numbers : [Nat]) : Result.Result<(), Text> {
        for (number in numbers.vals()) {
            if (number > 36) {
                return #err("All numbers must be 0-36");
            };
        };
        #ok();
    };

    // Update user statistics
    private func updateUserStats(player : Principal, amount : Nat, won : Bool, winnings : Nat) {
        let currentStats = Option.get(
            userStats.get(player),
            {
                totalBets = 0;
                totalWagered = 0;
                totalWon = 0;
                totalLost = 0;
                biggestWin = 0;
                gamesPlayed = 0;
                lastGameTime = 0;
            },
        );

        let updatedStats : Types.UserStats = {
            totalBets = currentStats.totalBets + 1;
            totalWagered = currentStats.totalWagered + amount;
            totalWon = if (won) { currentStats.totalWon + winnings } else {
                currentStats.totalWon;
            };
            totalLost = if (not won) { currentStats.totalLost + amount } else {
                currentStats.totalLost;
            };
            biggestWin = if (winnings > currentStats.biggestWin) winnings else currentStats.biggestWin;
            gamesPlayed = currentStats.gamesPlayed + 1;
            lastGameTime = Time.now();
        };

        userStats.put(player, updatedStats);
    };

    // Calculate house profit for round
    private func calculateHouseProfitForRound(results : [Types.BetResult]) : Nat {
        Array.foldLeft<Types.BetResult, Nat>(
            results,
            0,
            func(acc, result) {
                if (result.won) {
                    0 // No profit on winning bets, they reduce house edge
                } else {
                    acc + result.amount;
                };
            },
        );
    };

    // Debug transfer errors
    private func debugTransferFromError(error : Types.TransferFromError) : Text {
        switch (error) {
            case (#BadFee(fee_info)) {
                "Bad fee: expected " # Nat.toText(fee_info.expected_fee);
            };
            case (#InsufficientFunds(balance_info)) {
                "Insufficient funds: balance " # Nat.toText(balance_info.balance);
            };
            case (#InsufficientAllowance(allowance_info)) {
                "Insufficient allowance: " # Nat.toText(allowance_info.allowance);
            };
            case (#TooOld) { "Transaction too old" };
            case (#CreatedInFuture(time_info)) {
                "Transaction created in future: " # Nat64.toText(time_info.ledger_time);
            };
            case (#Duplicate(dup_info)) {
                "Duplicate transaction: " # Nat.toText(dup_info.duplicate_of);
            };
            case (#TemporarilyUnavailable) { "Service temporarily unavailable" };
            case (#GenericError(generic_info)) {
                "Error " # Nat.toText(generic_info.error_code) # ": " # generic_info.message;
            };
            case _ { "Unknown error" };
        };
    };

    // ==== QUERY FUNCTIONS ====

    public query func getGameInfo() : async Types.GameInfo {
        {
            currentRound = currentRound;
            minBet = minBet;
            maxBet = maxBet;
            totalVolume = totalVolume;
            totalBets = totalBets;
            houseProfits = houseProfits;
            platformFeeRate = PLATFORM_FEE_RATE;
            gameActive = gameActive;
            lastSpinTime = lastSpinTime;
        };
    };

    public query func getCurrentBets() : async [Types.Bet] {
        currentBetsArray;
    };

    public query func getRecentNumbers() : async [Nat] {
        recentNumbersArray;
    };

    public query func getBetHistory(limit : ?Nat) : async [Types.BetResult] {
        let actualLimit = Option.get(limit, 50);
        if (actualLimit >= betHistoryArray.size()) {
            betHistoryArray;
        } else {
            Array.subArray(betHistoryArray, 0, actualLimit);
        };
    };

    public query func getUserStats(user : Principal) : async ?Types.UserStats {
        userStats.get(user);
    };

    public query func getUserBalance(user : Principal) : async Nat {
        Option.get(userBalances.get(user), 0);
    };

    public query func getRoundStats(limit : ?Nat) : async [Types.RoundStats] {
        let actualLimit = Option.get(limit, 20);
        if (actualLimit >= roundStatsArray.size()) {
            roundStatsArray;
        } else {
            Array.subArray(roundStatsArray, 0, actualLimit);
        };
    };

    public query func getRedNumbers() : async [Nat] {
        redNumbers;
    };

    // ==== ADMIN FUNCTIONS ====

    public shared (msg) func initializeOwner() : async Result.Result<Bool, Text> {
        let caller = msg.caller;

        if (isInitialized) {
            return #err("Contract already initialized");
        };

        if (not Principal.equal(owner, Principal.fromText("aaaaa-aa"))) {
            return #err("Owner already set");
        };

        owner := caller;
        treasury := caller;
        isInitialized := true;

        #ok(true);
    };

    public shared (msg) func setMinBet(newMinBet : Nat) : async Result.Result<Bool, Text> {
        if (not Principal.equal(msg.caller, owner)) {
            return #err("Only owner can set minimum bet");
        };

        minBet := newMinBet;
        #ok(true);
    };

    public shared (msg) func setMaxBet(newMaxBet : Nat) : async Result.Result<Bool, Text> {
        if (not Principal.equal(msg.caller, owner)) {
            return #err("Only owner can set maximum bet");
        };

        maxBet := newMaxBet;
        #ok(true);
    };

    public shared (msg) func setTreasury(newTreasury : Principal) : async Result.Result<Bool, Text> {
        if (not Principal.equal(msg.caller, owner)) {
            return #err("Only owner can set treasury");
        };

        treasury := newTreasury;
        #ok(true);
    };

    public shared (msg) func setGameActive(active : Bool) : async Result.Result<Bool, Text> {
        if (not Principal.equal(msg.caller, owner)) {
            return #err("Only owner can activate/deactivate game");
        };

        gameActive := active;
        #ok(true);
    };

    public shared (msg) func emergencyWithdraw(amount : Nat) : async Result.Result<Bool, Text> {
        if (not Principal.equal(msg.caller, owner)) {
            return #err("Only owner can emergency withdraw");
        };

        let owner_account = Utils.defaultAccount(owner);
        let transferArgs : Types.TransferArgs = {
            from_subaccount = null;
            to = owner_account;
            amount = amount;
            fee = null;
            memo = ?Text.encodeUtf8("Emergency withdrawal");
            created_at_time = null;
        };

        switch (await aptcToken.icrc1_transfer(transferArgs)) {
            case (#Err(_)) { #err("Emergency withdrawal failed") };
            case (#Ok(_)) { #ok(true) };
        };
    };

    // Manual spin (admin only)
    public shared (msg) func manualSpin() : async Result.Result<Types.SpinResult, Text> {
        if (not Principal.equal(msg.caller, owner)) {
            return #err("Only owner can manually spin");
        };

        return await spinRoulette();
    };

    public query func getOwner() : async Principal { owner };
    public query func getTreasury() : async Principal { treasury };
    public query func getAPTCCanisterId() : async Principal {
        APTC_TOKEN_CANISTER_ID;
    };
    public query func isContractInitialized() : async Bool { isInitialized };
};
