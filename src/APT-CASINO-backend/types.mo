import Principal "mo:base/Principal";

module {
    // ICRC-1 Standard Types
    public type Subaccount = Blob;

    public type Account = {
        owner : Principal;
        subaccount : ?Subaccount;
    };

    public type TransferArgs = {
        from_subaccount : ?Subaccount;
        to : Account;
        amount : Nat;
        fee : ?Nat;
        memo : ?Blob;
        created_at_time : ?Nat64;
    };

    public type TransferError = {
        #BadFee : { expected_fee : Nat };
        #BadBurn : { min_burn_amount : Nat };
        #InsufficientFunds : { balance : Nat };
        #TooOld;
        #CreatedInFuture : { ledger_time : Nat64 };
        #TemporarilyUnavailable;
        #Duplicate : { duplicate_of : Nat };
        #GenericError : { error_code : Nat; message : Text };
    };

    public type TransferResult = {
        #Ok : Nat;
        #Err : TransferError;
    };

    // ICRC-2 Standard Types (for approve/transfer_from)
    public type ApproveArgs = {
        from_subaccount : ?Subaccount;
        spender : Account;
        amount : Nat;
        expected_allowance : ?Nat;
        expires_at : ?Nat64;
        fee : ?Nat;
        memo : ?Blob;
        created_at_time : ?Nat64;
    };

    public type ApproveError = {
        #BadFee : { expected_fee : Nat };
        #InsufficientFunds : { balance : Nat };
        #AllowanceChanged : { current_allowance : Nat };
        #Expired : { ledger_time : Nat64 };
        #TooOld;
        #CreatedInFuture : { ledger_time : Nat64 };
        #Duplicate : { duplicate_of : Nat };
        #TemporarilyUnavailable;
        #GenericError : { error_code : Nat; message : Text };
    };

    public type ApproveResult = {
        #Ok : Nat;
        #Err : ApproveError;
    };

    public type TransferFromArgs = {
        spender_subaccount : ?Subaccount;
        from : Account;
        to : Account;
        amount : Nat;
        fee : ?Nat;
        memo : ?Blob;
        created_at_time : ?Nat64;
    };

    public type TransferFromError = {
        #BadFee : { expected_fee : Nat };
        #BadBurn : { min_burn_amount : Nat };
        #InsufficientFunds : { balance : Nat };
        #InsufficientAllowance : { allowance : Nat };
        #TooOld;
        #CreatedInFuture : { ledger_time : Nat64 };
        #Duplicate : { duplicate_of : Nat };
        #TemporarilyUnavailable;
        #GenericError : { error_code : Nat; message : Text };
    };

    public type TransferFromResult = {
        #Ok : Nat;
        #Err : TransferFromError;
    };

    public type AllowanceArgs = {
        account : Account;
        spender : Account;
    };

    public type Allowance = {
        allowance : Nat;
        expires_at : ?Nat64;
    };

    // Roulette-specific types
    public type BetType = {
        #Number; // Single number (0-36) - 35:1 payout
        #Color; // Red or Black - 2:1 payout
        #OddEven; // Odd or Even - 2:1 payout
        #HighLow; // 1-18 or 19-36 - 2:1 payout
        #Dozen; // 1st, 2nd, 3rd dozen - 3:1 payout
        #Column; // Column bets - 3:1 payout
        #Split; // Two adjacent numbers - 17:1 payout
        #Street; // Three numbers in a row - 11:1 payout
        #Corner; // Four numbers - 8:1 payout
        #Line; // Six numbers - 5:1 payout
    };

    public type Bet = {
        player : Principal;
        amount : Nat;
        betType : BetType;
        betValue : Nat8; // 0 or 1 for simple bets, 0-2 for dozens/columns, number for single
        numbers : [Nat]; // For complex bets like split, street, corner, line
        round : Nat;
        timestamp : Int;
    };

    public type BetResult = {
        player : Principal;
        amount : Nat;
        won : Bool;
        winnings : Nat;
        round : Nat;
        number : Nat;
        timestamp : Int;
        betType : BetType; // Added for better tracking
        betValue : Nat8; // Added for better tracking
    };

    // Enhanced types for new roulette features
    public type UserStats = {
        totalBets : Nat;
        totalWagered : Nat;
        totalWon : Nat;
        totalLost : Nat;
        biggestWin : Nat;
        gamesPlayed : Nat;
        lastGameTime : Int;
    };

    public type RoundStats = {
        round : Nat;
        winningNumber : Nat;
        totalBets : Nat;
        totalWagered : Nat;
        totalPayout : Nat;
        houseProfitThisRound : Nat;
        timestamp : Int;
    };

    public type GameInfo = {
        currentRound : Nat;
        minBet : Nat;
        maxBet : Nat;
        totalVolume : Nat;
        totalBets : Nat;
        houseProfits : Nat;
        platformFeeRate : Nat;
        gameActive : Bool;
        lastSpinTime : Int;
    };

    public type SpinResult = {
        round : Nat;
        winningNumber : Nat;
        results : [BetResult];
        totalWagered : Nat;
        totalPayout : Nat;
        houseProfitThisRound : Nat;
    };

    // Token metadata
    public type MetadataValue = {
        #Text : Text;
        #Blob : Blob;
        #Nat : Nat;
        #Int : Int;
    };

    public type StandardRecord = {
        name : Text;
        url : Text;
    };
};
