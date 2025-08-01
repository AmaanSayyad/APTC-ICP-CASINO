import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Iter "mo:base/Iter";
import Random "mo:base/Random";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";

actor WheelGame {
    // Types
    public type RiskLevel = {
        #low;
        #medium;
        #high;
        #custom;
    };

    public type WheelSegment = {
        multiplier : Float;
        color : Text;
    };

    public type SpinResult = {
        position : Nat;
        multiplier : Float;
        timestamp : Int;
    };

    public type GameResult = {
        id : Text;
        player : Principal;
        betAmount : Nat;
        riskLevel : Text;
        segmentCount : Nat;
        result : SpinResult;
        payout : Nat;
        timestamp : Int;
    };

    public type SpinRequest = {
        betAmount : Nat;
        riskLevel : Text;
        segmentCount : Nat;
    };

    public type SpinResponse = {
        #Ok : GameResult;
        #Err : Text;
    };

    // State variables
    private stable var gameCounter : Nat = 0;
    private stable var gameHistoryEntries : [(Text, GameResult)] = [];
    private var gameHistory = HashMap.fromIter<Text, GameResult>(
        gameHistoryEntries.vals(),
        10,
        Text.equal,
        Text.hash,
    );

    // Helper function to get multipliers for different risk levels
    private func getSegmentsForRiskLevel(riskLevel : Text, segmentCount : Nat) : [WheelSegment] {
        var segments = Buffer.Buffer<WheelSegment>(segmentCount);

        // Define different risk profiles
        switch (riskLevel) {
            case "low" {
                // Low risk: Smaller wins but higher probability
                // Multipliers between 0.8x and 2.0x
                for (i in Iter.range(0, segmentCount - 1)) {
                    let multiplier = if (i < segmentCount / 10) {
                        0.0 // 10% chance of losing (0x)
                    } else if (i < segmentCount / 5) {
                        0.5 // 10% chance of getting half back
                    } else if (i < segmentCount / 2) {
                        1.2 // 30% chance of small win
                    } else if (i < segmentCount * 4 / 5) {
                        1.5 // 30% chance of medium win
                    } else {
                        2.0 // 20% chance of bigger win
                    };

                    let color = if (multiplier == 0.0) {
                        "red";
                    } else if (multiplier < 1.0) {
                        "orange";
                    } else if (multiplier < 1.5) {
                        "blue";
                    } else {
                        "green";
                    };

                    segments.add({ multiplier; color });
                };
            };
            case "medium" {
                // Medium risk: Balanced risk/reward
                // Multipliers between 0x and 3.0x
                for (i in Iter.range(0, segmentCount - 1)) {
                    let multiplier = if (i < segmentCount / 5) {
                        0.0 // 20% chance of losing (0x)
                    } else if (i < segmentCount * 2 / 5) {
                        0.5 // 20% chance of getting half back
                    } else if (i < segmentCount * 3 / 5) {
                        1.5 // 20% chance of small win
                    } else if (i < segmentCount * 4 / 5) {
                        2.0 // 20% chance of medium win
                    } else {
                        3.0 // 20% chance of big win
                    };

                    let color = if (multiplier == 0.0) {
                        "red";
                    } else if (multiplier < 1.0) {
                        "orange";
                    } else if (multiplier < 2.0) {
                        "blue";
                    } else {
                        "green";
                    };

                    segments.add({ multiplier; color });
                };
            };
            case "high" {
                // High risk: Higher potential wins but more chances of losing
                // Multipliers between 0x and 10.0x
                for (i in Iter.range(0, segmentCount - 1)) {
                    let multiplier = if (i < segmentCount / 2) {
                        0.0 // 50% chance of losing (0x)
                    } else if (i < segmentCount * 3 / 4) {
                        1.5 // 25% chance of small win
                    } else if (i < segmentCount * 9 / 10) {
                        3.0 // 15% chance of medium win
                    } else {
                        10.0 // 10% chance of big win
                    };

                    let color = if (multiplier == 0.0) {
                        "red";
                    } else if (multiplier < 2.0) {
                        "blue";
                    } else if (multiplier < 5.0) {
                        "purple";
                    } else {
                        "gold";
                    };

                    segments.add({ multiplier; color });
                };
            };
            case "custom" {
                // Custom setup with more varied multipliers
                let multipliers : [Float] = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 5.0];
                let colors : [Text] = ["red", "orange", "yellow", "blue", "green", "purple", "teal", "gold"];

                for (i in Iter.range(0, segmentCount - 1)) {
                    let idx = i % multipliers.size();
                    segments.add({
                        multiplier = multipliers[idx];
                        color = colors[idx % colors.size()];
                    });
                };
            };
            case _ {
                // Default to medium risk if invalid risk level provided
                for (i in Iter.range(0, segmentCount - 1)) {
                    let multiplier = if (i < segmentCount / 5) {
                        0.0;
                    } else if (i < segmentCount * 2 / 5) {
                        0.5;
                    } else if (i < segmentCount * 3 / 5) {
                        1.5;
                    } else if (i < segmentCount * 4 / 5) {
                        2.0;
                    } else {
                        3.0;
                    };

                    let color = if (multiplier == 0.0) {
                        "red";
                    } else if (multiplier < 1.0) {
                        "orange";
                    } else if (multiplier < 2.0) {
                        "blue";
                    } else {
                        "green";
                    };

                    segments.add({ multiplier; color });
                };
            };
        };

        Buffer.toArray(segments);
    };

    // Generate cryptographically secure random number
    private func generateRandomNumber(max : Nat) : async Nat {
        let seed = await Random.blob();
        let random_bytes = Random.Finite(seed);

        let random_byte = switch (random_bytes.byte()) {
            case null { 0 };
            case (?byte) { Nat8.toNat(byte) };
        };

        return random_byte % max;
    };

    // Public function to spin the wheel
    public shared (msg) func spinWheel(request : SpinRequest) : async SpinResponse {
        let caller = msg.caller;

        // Validate bet amount
        if (request.betAmount == 0) {
            return #Err("Bet amount must be greater than 0");
        };

        // Get segments based on risk level
        let segments = getSegmentsForRiskLevel(request.riskLevel, request.segmentCount);

        // Generate random index
        let position = await generateRandomNumber(segments.size());

        // Get multiplier at the selected position
        let multiplier = segments[position].multiplier;

        // Calculate payout (multiplier * bet amount)
        let betAmountAsInt = request.betAmount; // Nat is a subtype of Int
        let payoutFloat = Float.fromInt(betAmountAsInt) * multiplier;
        let payout = if (payoutFloat < 0.0) { 0 } else {
            Int.abs(Float.toInt(payoutFloat));
        };

        // Create game result
        let timestamp = Time.now();
        let gameId = Int.toText(timestamp) # "-" # Principal.toText(caller);

        let result : GameResult = {
            id = gameId;
            player = caller;
            betAmount = request.betAmount;
            riskLevel = request.riskLevel;
            segmentCount = request.segmentCount;
            result = {
                position = position;
                multiplier = multiplier;
                timestamp = timestamp;
            };
            payout = payout;
            timestamp = timestamp;
        };

        // Store the result
        gameHistory.put(gameId, result);
        gameCounter += 1;

        // Return the result
        #Ok(result);
    };

    // Get segments/multipliers for a specific risk level
    public query func getWheelSegments(riskLevel : Text, segmentCount : Nat) : async [WheelSegment] {
        getSegmentsForRiskLevel(riskLevel, segmentCount);
    };

    // Get game history for a specific player
    public query func getPlayerHistory(player : Principal) : async [GameResult] {
        let results = Buffer.Buffer<GameResult>(0);

        for ((_, game) in gameHistory.entries()) {
            if (Principal.equal(game.player, player)) {
                results.add(game);
            };
        };

        Buffer.toArray(results);
    };

    // Get recent game results (for leaderboard/stats)
    public query func getRecentGames(count : Nat) : async [GameResult] {
        let results = Buffer.Buffer<GameResult>(0);
        var counter = 0;

        label l for ((_, game) in gameHistory.entries()) {
            results.add(game);
            counter += 1;
            if (counter >= count) {
                break l;
            };
        };

        Buffer.toArray(results);
    };

    // Get game statistics
    public query func getGameStats() : async {
        totalGames : Nat;
        totalVolumeBet : Nat;
        totalPayout : Nat;
    } {
        var totalVolumeBet = 0;
        var totalPayout = 0;

        for ((_, game) in gameHistory.entries()) {
            totalVolumeBet += game.betAmount;
            totalPayout += game.payout;
        };

        {
            totalGames = gameCounter;
            totalVolumeBet = totalVolumeBet;
            totalPayout = totalPayout;
        };
    };

    // System upgrades: Save state
    system func preupgrade() {
        gameHistoryEntries := Iter.toArray(gameHistory.entries());
    };

    // System upgrades: Restore state
    system func postupgrade() {
        gameHistoryEntries := [];
    };
};
