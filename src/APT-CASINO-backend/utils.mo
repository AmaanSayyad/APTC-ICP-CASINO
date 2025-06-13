import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Types "types";

module {
    // Account utilities
    public func accountIdentifier(account : Types.Account) : Blob {
        // Convert ICRC-1 Account to AccountIdentifier (for compatibility)
        let principal_blob = Principal.toBlob(account.owner);
        let _subaccount_blob = switch (account.subaccount) {
            case (?sub) { sub };
            case null { Blob.fromArray(Array.freeze(Array.init<Nat8>(32, 0))) };
        };

        // This is a simplified implementation
        // In a production environment, you'd use proper SHA-224 hashing
        principal_blob;
    };

    public func defaultAccount(principal : Principal) : Types.Account {
        {
            owner = principal;
            subaccount = null;
        };
    };

    public func accountsEqual(a : Types.Account, b : Types.Account) : Bool {
        Principal.equal(a.owner, b.owner) and a.subaccount == b.subaccount
    };

    // Validation utilities
    public func validateTransfer(args : Types.TransferArgs, balance : Nat, fee : Nat) : Result.Result<(), Types.TransferError> {
        // Check if amount is greater than 0
        if (args.amount == 0) {
            return #err(#GenericError({ error_code = 1; message = "Amount must be greater than 0" }));
        };

        // Check fee
        switch (args.fee) {
            case (?provided_fee) {
                if (provided_fee != fee) {
                    return #err(#BadFee({ expected_fee = fee }));
                };
            };
            case null {};
        };

        // Check balance (including fee)
        let total_cost = args.amount + fee;
        if (balance < total_cost) {
            return #err(#InsufficientFunds({ balance = balance }));
        };

        // Check timestamp (prevent too old transactions)
        switch (args.created_at_time) {
            case (?timestamp) {
                let now = Nat64.fromNat(Int.abs(Time.now()));
                let max_age : Nat64 = 24 * 60 * 60 * 1_000_000_000; // 24 hours in nanoseconds
                if (now > timestamp + max_age) {
                    return #err(#TooOld);
                };
                if (timestamp > now + 60 * 1_000_000_000) {
                    // 1 minute in future
                    return #err(#CreatedInFuture({ ledger_time = now }));
                };
            };
            case null {};
        };

        #ok();
    };

    public func validateApprove(args : Types.ApproveArgs, balance : Nat, fee : Nat) : Result.Result<(), Types.ApproveError> {
        // Check fee
        switch (args.fee) {
            case (?provided_fee) {
                if (provided_fee != fee) {
                    return #err(#BadFee({ expected_fee = fee }));
                };
            };
            case null {};
        };

        // Check balance for fee
        if (balance < fee) {
            return #err(#InsufficientFunds({ balance = balance }));
        };

        // Check timestamp
        switch (args.created_at_time) {
            case (?timestamp) {
                let now = Nat64.fromNat(Int.abs(Time.now()));
                let max_age : Nat64 = 24 * 60 * 60 * 1_000_000_000; // 24 hours in nanoseconds
                if (now > timestamp + max_age) {
                    return #err(#TooOld);
                };
                if (timestamp > now + 60 * 1_000_000_000) {
                    // 1 minute in future
                    return #err(#CreatedInFuture({ ledger_time = now }));
                };
            };
            case null {};
        };

        #ok();
    };

    // Helper function to check if a number is red in roulette
    public func isRedNumber(number : Nat) : Bool {
        let redNumbers : [Nat] = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

        for (redNum in redNumbers.vals()) {
            if (redNum == number) {
                return true;
            };
        };
        false;
    };

    // Helper function to check if array contains a specific number
    public func containsNumber(numbers : [Nat], target : Nat) : Bool {
        for (number in numbers.vals()) {
            if (number == target) {
                return true;
            };
        };
        false;
    };

    // Generate a simple transaction ID
    public func generateTxId(from : Types.Account, to : Types.Account, amount : Nat, timestamp : Nat64) : Nat {
        // This is a simplified implementation
        // In production, you'd want a more robust transaction ID generation
        let from_blob = Principal.toBlob(from.owner);
        let to_blob = Principal.toBlob(to.owner);

        // Simple hash combination
        Nat64.toNat(timestamp) + amount + from_blob.size() + to_blob.size();
    };

    // Hash function for Nat (used in HashMaps)
    public func natHash(n : Nat) : Nat32 {
        // Simple hash function for Nat values
        let hash = n % (4294967295); // 2^32 - 1
        Nat32.fromNat(hash % 4294967295);
    };
};
