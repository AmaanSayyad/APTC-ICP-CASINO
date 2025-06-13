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
import Float "mo:base/Float";
import Buffer "mo:base/Buffer";
import Types "types";
import Utils "utils";

actor class MinesGame(aptcTokenCanisterId : Principal) = self {

    // ICRC-1 & ICRC-2 Token Interface
    private type TokenActor = actor {
        icrc1_transfer : (Types.TransferArgs) -> async Types.TransferResult;
        icrc1_balance_of : (Types.Account) -> async Nat;
        icrc1_fee : () -> async Nat;
        icrc2_approve : (Types.ApproveArgs) -> async Types.ApproveResult;
        icrc2_allowance : (Types.AllowanceArgs) -> async Types.Allowance;
        icrc2_transfer_from : (Types.TransferFromArgs) -> async Types.TransferFromResult;
    };

    // Constants
    private let _APTC_TOKEN_CANISTER_ID = aptcTokenCanisterId;
    private let tokenActor : TokenActor = actor (Principal.toText(aptcTokenCanisterId));
    private let PLATFORM_FEE_RATE : Nat = 5; // 0.5% = 5/1000
    private let MIN_BET_COOLDOWN : Int = 1_000_000_000; // 1 second in nanoseconds
    private let _HOUSE_EDGE : Float = 0.05; // 5% house edge
    private let GRID_SIZE : Nat = 25; // 5x5 grid
    private let MIN_MINES : Nat = 1;
    private let MAX_MINES : Nat = 24;

    // Game Types
    public type CellState = {
        #Hidden;
        #Revealed;
        #Mine;
        #Safe;
    };

    public type GameState = {
        #NotStarted;
        #InProgress;
        #Won;
        #Lost;
        #Cashed;
    };

    public type MinesGameSession = {
        player : Principal;
        betAmount : Nat;
        mineCount : Nat;
        gameState : GameState;
        grid : [CellState];
        minePositions : [Nat];
        revealedCells : [Nat];
        multiplier : Float;
        potentialWin : Nat;
        startTime : Int;
        endTime : ?Int;
    };

    public type GameResult = {
        gameId : Nat;
        player : Principal;
        betAmount : Nat;
        winAmount : Nat;
        mineCount : Nat;
        revealedCells : [Nat];
        minePositions : [Nat];
        gameState : GameState;
        timestamp : Int;
    };

    public type MinesError = {
        #NotAuthorized;
        #GameNotFound;
        #GameNotInProgress;
        #InvalidCellIndex;
        #CellAlreadyRevealed;
        #InsufficientBalance;
        #InvalidBetAmount;
        #InvalidMineCount;
        #TransferFailed : Text;
        #GameNotStarted;
        #TooManyMines;
        #TooFewMines;
        #CooldownActive;
        #GameInactive;
        #NotInitialized;
        #TokenTransferError : Types.TransferError;
        #TokenApproveError : Types.ApproveError;
        #TokenTransferFromError : Types.TransferFromError;
        #InsufficientAllowance;
    };

    // Game state
    private stable var owner : Principal = Principal.fromText("7pzmj-kzief-vhpwj-r4bqz-o2zkd-wwggj-zhmpi-ua5pe-zrafv-3et3r-sae");
    private stable var treasury : Principal = Principal.fromText("7pzmj-kzief-vhpwj-r4bqz-o2zkd-wwggj-zhmpi-ua5pe-zrafv-3et3r-sae");
    private stable var minBet : Nat = 10_000_000; // 0.1 APTC (8 decimals)
    private stable var maxBet : Nat = 1_000_000_000_000; // 10,000 APTC
    private stable var currentGameId : Nat = 1;
    private stable var totalVolume : Nat = 0;
    private stable var totalGames : Nat = 0;
    private stable var houseProfits : Nat = 0;
    private stable var isInitialized : Bool = true; // Set to true by default
    private stable var gameActive : Bool = true;
    private stable var transferFee : Nat = 1000; // 0.00001 APTC default fee

    // Mappings (removed user balances since we use token directly)
    private stable var userStatsEntries : [(Principal, Types.UserStats)] = [];
    private stable var lastBetTimeEntries : [(Principal, Int)] = [];
    private stable var activeGamesEntries : [(Principal, MinesGameSession)] = [];
    private stable var gameHistoryEntries : [(Nat, GameResult)] = [];

    private var userStats = HashMap.fromIter<Principal, Types.UserStats>(userStatsEntries.vals(), 0, Principal.equal, Principal.hash);
    private var lastBetTimes = HashMap.fromIter<Principal, Int>(lastBetTimeEntries.vals(), 0, Principal.equal, Principal.hash);
    private var activeGames = HashMap.fromIter<Principal, MinesGameSession>(activeGamesEntries.vals(), 0, Principal.equal, Principal.hash);
    private var gameHistory = HashMap.fromIter<Nat, GameResult>(gameHistoryEntries.vals(), 0, Nat.equal, Utils.natHash);

    // Multiplier calculation table for different mine counts
    private let MULTIPLIER_TABLE : [(Nat, [Float])] = [
        (1, [1.01, 1.03, 1.05, 1.08, 1.12, 1.16, 1.22, 1.29, 1.37, 1.46, 1.57, 1.69, 1.84, 2.01, 2.23, 2.49, 2.81, 3.22, 3.74, 4.42, 5.32, 6.54, 8.26, 10.86, 15.18]),
        (2, [1.03, 1.07, 1.11, 1.17, 1.23, 1.31, 1.40, 1.51, 1.64, 1.80, 1.99, 2.22, 2.51, 2.87, 3.32, 3.91, 4.69, 5.73, 7.16, 9.21, 12.23, 17.06, 25.30, 41.04]),
        (3, [1.05, 1.11, 1.18, 1.26, 1.35, 1.47, 1.60, 1.76, 1.96, 2.20, 2.50, 2.87, 3.35, 3.96, 4.76, 5.82, 7.27, 9.30, 12.29, 16.87, 24.47, 37.77, 63.28]),
        (4, [1.07, 1.15, 1.25, 1.36, 1.49, 1.65, 1.84, 2.07, 2.36, 2.72, 3.17, 3.76, 4.52, 5.52, 6.86, 8.69, 11.25, 15.00, 20.74, 29.87, 45.15, 73.87]),
        (5, [1.10, 1.20, 1.32, 1.47, 1.65, 1.87, 2.13, 2.46, 2.87, 3.39, 4.06, 4.93, 6.07, 7.61, 9.73, 12.70, 17.00, 23.50, 33.51, 50.27, 79.65]),
    ];

    // System upgrade hooks
    system func preupgrade() {
        userStatsEntries := Iter.toArray(userStats.entries());
        lastBetTimeEntries := Iter.toArray(lastBetTimes.entries());
        activeGamesEntries := Iter.toArray(activeGames.entries());
        gameHistoryEntries := Iter.toArray(gameHistory.entries());
    };

    system func postupgrade() {
        userStatsEntries := [];
        lastBetTimeEntries := [];
        activeGamesEntries := [];
        gameHistoryEntries := [];
    };

    // Admin functions
    public shared (msg) func initialize(treasuryAddr : Principal) : async Result.Result<Text, MinesError> {
        if (msg.caller != owner) {
            return #err(#NotAuthorized);
        };

        owner := msg.caller;
        treasury := treasuryAddr;
        isInitialized := true;

        #ok("Mines game initialized successfully");
    };

    public shared (msg) func setGameActive(active : Bool) : async Result.Result<Text, MinesError> {
        if (msg.caller != owner) {
            return #err(#NotAuthorized);
        };
        gameActive := active;
        #ok(if (active) "Game activated" else "Game deactivated");
    };

    public shared (msg) func setBetLimits(minBetAmount : Nat, maxBetAmount : Nat) : async Result.Result<Text, MinesError> {
        if (msg.caller != owner) {
            return #err(#NotAuthorized);
        };
        minBet := minBetAmount;
        maxBet := maxBetAmount;
        #ok("Bet limits updated");
    };

    // Utility functions
    private func generateMinePositions(mineCount : Nat, seed : Blob) : [Nat] {
        let positions = Buffer.Buffer<Nat>(mineCount);
        let used = HashMap.HashMap<Nat, Bool>(GRID_SIZE, Nat.equal, Utils.natHash);

        // Simple deterministic mine placement based on seed
        let seedBytes = Blob.toArray(seed);
        var generated = 0;
        var seedIndex = 0;

        while (generated < mineCount and generated < GRID_SIZE) {
            let byteValue = if (seedIndex < seedBytes.size()) {
                Nat8.toNat(seedBytes[seedIndex]);
            } else {
                Int.abs(Time.now() + generated) % 256;
            };
            let pos = byteValue % GRID_SIZE;

            if (not Option.isSome(used.get(pos))) {
                used.put(pos, true);
                positions.add(pos);
                generated += 1;
            };

            seedIndex := (seedIndex + 1) % (if (seedBytes.size() > 0) seedBytes.size() else 1);
        };

        Buffer.toArray(positions);
    };

    private func calculateMultiplier(mineCount : Nat, revealedCount : Nat) : Float {
        if (revealedCount == 0) return 1.0;

        // Find the multiplier table for the given mine count
        for ((mines, multipliers) in MULTIPLIER_TABLE.vals()) {
            if (mines == mineCount and revealedCount <= multipliers.size()) {
                return multipliers[revealedCount - 1];
            };
        };

        // Fallback calculation if not in table
        let safeSpots = Float.fromInt(GRID_SIZE - mineCount);
        let revealedFloat = Float.fromInt(revealedCount);
        let baseMultiplier = 1.0 + (revealedFloat / safeSpots) * 0.5;
        let riskMultiplier = 1.0 + (Float.fromInt(mineCount) / 24.0) * 2.0;
        baseMultiplier * riskMultiplier;
    };

    private func isMineAtPosition(minePositions : [Nat], position : Nat) : Bool {
        for (minePos in minePositions.vals()) {
            if (minePos == position) return true;
        };
        false;
    };

    private func isValidBetAmount(amount : Nat) : Bool {
        amount >= minBet and amount <= maxBet
    };

    private func isValidMineCount(count : Nat) : Bool {
        count >= MIN_MINES and count <= MAX_MINES
    };

    private func checkCooldown(caller : Principal) : Bool {
        let currentTime = Time.now();
        switch (lastBetTimes.get(caller)) {
            case (?lastTime) {
                currentTime - lastTime >= MIN_BET_COOLDOWN;
            };
            case null { true };
        };
    };

    // Token utility functions
    private func getTokenFee() : async Nat {
        try {
            await tokenActor.icrc1_fee();
        } catch (_error) {
            transferFee; // Use cached fee as fallback
        };
    };

    private func getUserTokenBalance(user : Principal) : async Nat {
        try {
            let account = Utils.defaultAccount(user);
            await tokenActor.icrc1_balance_of(account);
        } catch (_error) {
            0;
        };
    };

    private func _transferTokensFromPlayer(player : Principal, amount : Nat) : async Result.Result<Nat, MinesError> {
        try {
            let fee = await getTokenFee();
            let _playerAccount = Utils.defaultAccount(player);
            let _gameAccount = Utils.defaultAccount(Principal.fromActor(self));

            let transferArgs : Types.TransferArgs = {
                from_subaccount = null;
                to = _gameAccount;
                amount = amount;
                fee = ?fee;
                memo = null;
                created_at_time = null;
            };

            // Note: This would need to be called by the player, not the game
            // In practice, you'd use ICRC-2 approve/transfer_from pattern
            let result = await tokenActor.icrc1_transfer(transferArgs);
            switch (result) {
                case (#Ok(blockIndex)) { #ok(blockIndex) };
                case (#Err(error)) { #err(#TokenTransferError(error)) };
            };
        } catch (_error) {
            #err(#TransferFailed("Failed to transfer tokens from player"));
        };
    };

    private func transferTokensToPlayer(player : Principal, amount : Nat) : async Result.Result<Nat, MinesError> {
        try {
            let fee = await getTokenFee();
            let playerAccount = Utils.defaultAccount(player);
            let _gameAccount = Utils.defaultAccount(Principal.fromActor(self));

            let transferArgs : Types.TransferArgs = {
                from_subaccount = null;
                to = playerAccount;
                amount = amount;
                fee = ?fee;
                memo = null;
                created_at_time = null;
            };

            let result = await tokenActor.icrc1_transfer(transferArgs);
            switch (result) {
                case (#Ok(blockIndex)) { #ok(blockIndex) };
                case (#Err(error)) { #err(#TokenTransferError(error)) };
            };
        } catch (_error) {
            #err(#TransferFailed("Failed to transfer tokens to player"));
        };
    };

    private func transferTokensToTreasury(amount : Nat) : async Result.Result<Nat, MinesError> {
        try {
            let fee = await getTokenFee();
            let treasuryAccount = Utils.defaultAccount(treasury);
            let _gameAccount = Utils.defaultAccount(Principal.fromActor(self));

            let transferArgs : Types.TransferArgs = {
                from_subaccount = null;
                to = treasuryAccount;
                amount = amount;
                fee = ?fee;
                memo = null;
                created_at_time = null;
            };

            let result = await tokenActor.icrc1_transfer(transferArgs);
            switch (result) {
                case (#Ok(blockIndex)) { #ok(blockIndex) };
                case (#Err(error)) { #err(#TokenTransferError(error)) };
            };
        } catch (_error) {
            #err(#TransferFailed("Failed to transfer tokens to treasury"));
        };
    };

    // ICRC-2 utility functions for approve/transfer_from pattern
    private func getAllowance(owner : Principal, spender : Principal) : async Nat {
        try {
            let ownerAccount = Utils.defaultAccount(owner);
            let spenderAccount = Utils.defaultAccount(spender);
            let allowanceArgs : Types.AllowanceArgs = {
                account = ownerAccount;
                spender = spenderAccount;
            };
            let result = await tokenActor.icrc2_allowance(allowanceArgs);
            result.allowance;
        } catch (_error) {
            0;
        };
    };

    private func transferFromPlayer(player : Principal, amount : Nat) : async Result.Result<Nat, MinesError> {
        try {
            let fee = await getTokenFee();
            let playerAccount = Utils.defaultAccount(player);
            let gameAccount = Utils.defaultAccount(Principal.fromActor(self));

            let transferFromArgs : Types.TransferFromArgs = {
                spender_subaccount = null;
                from = playerAccount;
                to = gameAccount;
                amount = amount;
                fee = ?fee;
                memo = null;
                created_at_time = null;
            };

            let result = await tokenActor.icrc2_transfer_from(transferFromArgs);
            switch (result) {
                case (#Ok(blockIndex)) { #ok(blockIndex) };
                case (#Err(error)) { #err(#TokenTransferFromError(error)) };
            };
        } catch (_error) {
            #err(#TransferFailed("Failed to transfer tokens from player"));
        };
    };

    private func checkPlayerAllowance(player : Principal, requiredAmount : Nat) : async Bool {
        let gameCanister = Principal.fromActor(self);
        let allowance = await getAllowance(player, gameCanister);
        allowance >= requiredAmount;
    };

    private func updateUserStats(user : Principal, betAmount : Nat, winAmount : Nat, isWin : Bool) {
        let currentStats = switch (userStats.get(user)) {
            case (?stats) { stats };
            case null {
                {
                    totalBets = 0;
                    totalWagered = 0;
                    totalWon = 0;
                    totalLost = 0;
                    biggestWin = 0;
                    gamesPlayed = 0;
                    lastGameTime = 0;
                };
            };
        };

        let newStats = {
            totalBets = currentStats.totalBets + 1;
            totalWagered = currentStats.totalWagered + betAmount;
            totalWon = if (isWin) currentStats.totalWon + winAmount else currentStats.totalWon;
            totalLost = if (not isWin) currentStats.totalLost + betAmount else currentStats.totalLost;
            biggestWin = if (winAmount > currentStats.biggestWin) winAmount else currentStats.biggestWin;
            gamesPlayed = currentStats.gamesPlayed + 1;
            lastGameTime = Time.now();
        };

        userStats.put(user, newStats);
    };

    // Public ICRC-2 utility functions for frontend integration
    public shared (msg) func getPlayerAllowance() : async Nat {
        let gameCanister = Principal.fromActor(self);
        await getAllowance(msg.caller, gameCanister);
    };

    public shared (_msg) func getRequiredApprovalAmount(betAmount : Nat) : async Nat {
        let fee = await getTokenFee();
        betAmount + fee;
    };

    public query func getGameCanisterPrincipal() : async Principal {
        Principal.fromActor(self);
    };

    // Game functions
    public shared (msg) func startGame(betAmount : Nat, mineCount : Nat) : async Result.Result<MinesGameSession, MinesError> {
        // Note: isInitialized check removed since we initialize by default

        if (not gameActive) {
            return #err(#GameInactive);
        };

        if (not checkCooldown(msg.caller)) {
            return #err(#CooldownActive);
        };

        if (not isValidBetAmount(betAmount)) {
            return #err(#InvalidBetAmount);
        };

        if (not isValidMineCount(mineCount)) {
            return #err(#InvalidMineCount);
        };

        // Check player's token balance
        let userBalance = await getUserTokenBalance(msg.caller);
        if (userBalance < betAmount) {
            return #err(#InsufficientBalance);
        };

        // Check if user already has an active game
        switch (activeGames.get(msg.caller)) {
            case (?existingGame) {
                if (existingGame.gameState == #InProgress) {
                    return #err(#GameNotFound); // Game already in progress
                };
            };
            case null {};
        };

        // Check if player has approved enough tokens for the game canister
        let hasAllowance = await checkPlayerAllowance(msg.caller, betAmount);
        if (not hasAllowance) {
            return #err(#InsufficientAllowance);
        };

        // Transfer bet amount from player to game canister using ICRC-2 transfer_from
        switch (await transferFromPlayer(msg.caller, betAmount)) {
            case (#err(error)) { return #err(error) };
            case (#ok(_blockIndex)) {
                // Transfer successful, continue with game creation
            };
        };

        // Generate mine positions
        let seed = await Random.blob();
        let minePositions = generateMinePositions(mineCount, seed);

        // Initialize grid
        let grid = Array.init<CellState>(GRID_SIZE, #Hidden);

        // Create game session
        let gameSession : MinesGameSession = {
            player = msg.caller;
            betAmount = betAmount;
            mineCount = mineCount;
            gameState = #InProgress;
            grid = Array.freeze(grid);
            minePositions = minePositions;
            revealedCells = [];
            multiplier = 1.0;
            potentialWin = betAmount;
            startTime = Time.now();
            endTime = null;
        };

        // Store active game
        activeGames.put(msg.caller, gameSession);

        // Update statistics
        lastBetTimes.put(msg.caller, Time.now());
        totalVolume := totalVolume + betAmount;
        totalGames := totalGames + 1;

        #ok(gameSession);
    };

    public shared (msg) func revealCell(cellIndex : Nat) : async Result.Result<MinesGameSession, MinesError> {
        // Note: isInitialized check removed since we initialize by default

        if (not gameActive) {
            return #err(#GameInactive);
        };

        if (cellIndex >= GRID_SIZE) {
            return #err(#InvalidCellIndex);
        };

        switch (activeGames.get(msg.caller)) {
            case (?gameSession) {
                if (gameSession.gameState != #InProgress) {
                    return #err(#GameNotInProgress);
                };

                // Check if cell is already revealed
                for (revealedCell in gameSession.revealedCells.vals()) {
                    if (revealedCell == cellIndex) {
                        return #err(#CellAlreadyRevealed);
                    };
                };

                // Check if cell contains a mine
                if (isMineAtPosition(gameSession.minePositions, cellIndex)) {
                    // Game over - hit a mine
                    let endedGame = {
                        gameSession with
                        gameState = #Lost;
                        endTime = ?Time.now();
                    };

                    // Store game result
                    let gameResult : GameResult = {
                        gameId = currentGameId;
                        player = msg.caller;
                        betAmount = gameSession.betAmount;
                        winAmount = 0;
                        mineCount = gameSession.mineCount;
                        revealedCells = gameSession.revealedCells;
                        minePositions = gameSession.minePositions;
                        gameState = #Lost;
                        timestamp = Time.now();
                    };

                    gameHistory.put(currentGameId, gameResult);
                    currentGameId := currentGameId + 1;

                    // Remove from active games
                    activeGames.delete(msg.caller);

                    // Update user stats
                    updateUserStats(msg.caller, gameSession.betAmount, 0, false);

                    // Update house profits
                    houseProfits := houseProfits + gameSession.betAmount;

                    return #ok(endedGame);
                } else {
                    // Safe cell - update game state
                    let newRevealedCells = Array.append(gameSession.revealedCells, [cellIndex]);
                    let revealedCount = newRevealedCells.size();
                    let newMultiplier = calculateMultiplier(gameSession.mineCount, revealedCount);
                    let newPotentialWin = Int.abs(Float.toInt(Float.fromInt(gameSession.betAmount) * newMultiplier));

                    let updatedGame = {
                        gameSession with
                        revealedCells = newRevealedCells;
                        multiplier = newMultiplier;
                        potentialWin = newPotentialWin;
                    };

                    // Update active game
                    activeGames.put(msg.caller, updatedGame);

                    return #ok(updatedGame);
                };
            };
            case null {
                return #err(#GameNotFound);
            };
        };
    };

    public shared (msg) func cashOut() : async Result.Result<GameResult, MinesError> {
        // Note: isInitialized check removed since we initialize by default

        if (not gameActive) {
            return #err(#GameInactive);
        };

        switch (activeGames.get(msg.caller)) {
            case (?gameSession) {
                if (gameSession.gameState != #InProgress) {
                    return #err(#GameNotInProgress);
                };

                if (gameSession.revealedCells.size() == 0) {
                    return #err(#GameNotStarted);
                };

                let winAmount = gameSession.potentialWin;
                let platformFee = (winAmount * PLATFORM_FEE_RATE) / 1000;
                let netWinAmount = Int.abs(winAmount - platformFee);

                // Transfer winnings to player
                let transferResult = await transferTokensToPlayer(msg.caller, netWinAmount);
                switch (transferResult) {
                    case (#err(error)) { return #err(error) };
                    case (#ok(_)) {};
                };

                // Transfer platform fee to treasury
                if (platformFee > 0) {
                    let feeResult = await transferTokensToTreasury(platformFee);
                    switch (feeResult) {
                        case (#err(_error)) {
                            // Even if fee transfer fails, we continue with game completion
                            // In production, you'd want to handle this more carefully
                        };
                        case (#ok(_)) {};
                    };
                };

                // Create game result
                let gameResult : GameResult = {
                    gameId = currentGameId;
                    player = msg.caller;
                    betAmount = gameSession.betAmount;
                    winAmount = netWinAmount;
                    mineCount = gameSession.mineCount;
                    revealedCells = gameSession.revealedCells;
                    minePositions = gameSession.minePositions;
                    gameState = #Cashed;
                    timestamp = Time.now();
                };

                // Store game result
                gameHistory.put(currentGameId, gameResult);
                currentGameId := currentGameId + 1;

                // Remove from active games
                activeGames.delete(msg.caller);

                // Update user stats
                updateUserStats(msg.caller, gameSession.betAmount, netWinAmount, true);

                // Update house profits (subtract win amount and add platform fee)
                if (winAmount > gameSession.betAmount) {
                    let houseLoss = Int.abs(winAmount - gameSession.betAmount);
                    houseProfits := if (houseProfits >= houseLoss) {
                        Int.abs(houseProfits - houseLoss) + platformFee;
                    } else {
                        platformFee;
                    };
                } else {
                    houseProfits := houseProfits + platformFee;
                };

                #ok(gameResult);
            };
            case null {
                return #err(#GameNotFound);
            };
        };
    };

    // Query functions
    public query func getActiveGame(player : Principal) : async ?MinesGameSession {
        activeGames.get(player);
    };

    public query func getGameHistory(player : Principal, limit : ?Nat) : async [GameResult] {
        let maxResults = switch (limit) {
            case (?l) { l };
            case null { 50 };
        };

        let results = Buffer.Buffer<GameResult>(maxResults);
        var count = 0;

        for ((gameId, result) in gameHistory.entries()) {
            if (result.player == player and count < maxResults) {
                results.add(result);
                count := count + 1;
            };
        };

        Buffer.toArray(results);
    };

    public query func getUserBalance(_user : Principal) : async Nat {
        // This now requires an async call to get token balance
        // We'll return 0 for query calls and provide a separate async function
        0;
    };

    public func getPlayerTokenBalance(user : Principal) : async Nat {
        await getUserTokenBalance(user);
    };

    public query func getUserStats(user : Principal) : async ?Types.UserStats {
        userStats.get(user);
    };

    public query func getGameStats() : async {
        totalGames : Nat;
        totalVolume : Nat;
        houseProfits : Nat;
        activeGamesCount : Nat;
    } {
        {
            totalGames = totalGames;
            totalVolume = totalVolume;
            houseProfits = houseProfits;
            activeGamesCount = activeGames.size();
        };
    };

    public query func getBetLimits() : async { minBet : Nat; maxBet : Nat } {
        { minBet = minBet; maxBet = maxBet };
    };

    public query func isGameActive() : async Bool {
        gameActive;
    };

    public query func getMultiplierForMines(mineCount : Nat, revealedCount : Nat) : async Float {
        calculateMultiplier(mineCount, revealedCount);
    };

    // Deposit/Withdraw functions (for testing - in production would use ICRC-1 transfers)
    // Note: These functions are deprecated since we now use APTC tokens directly
    // Players interact with tokens through the APTC token canister
    public shared (_msg) func deposit(_amount : Nat) : async Result.Result<Text, MinesError> {
        #err(#TransferFailed("Deposit not supported - use APTC token canister directly"));
    };

    public shared (_msg) func withdraw(_amount : Nat) : async Result.Result<Text, MinesError> {
        #err(#TransferFailed("Withdraw not supported - tokens are managed directly by APTC canister"));
    };
};
