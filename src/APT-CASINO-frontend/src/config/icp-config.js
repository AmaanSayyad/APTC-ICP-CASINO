// ICP Configuration for APT Casino
import { Actor, HttpAgent } from "@dfinity/agent";
// AuthClient removed - using NFID instead
import { Principal } from "@dfinity/principal";

// Canister IDs - These will be set after deployment
export const CANISTER_IDS = {
  aptc_token:
    process.env.NEXT_PUBLIC_APTC_TOKEN_CANISTER_ID ||
    process.env.CANISTER_ID_APTC_TOKEN ||
    "be2us-64aaa-aaaaa-qaabq-cai",
  apt_token:
    process.env.NEXT_PUBLIC_APT_TOKEN_CANISTER_ID ||
    "rdmx6-jaaaa-aaaah-qcaiq-cai",
  roulette:
    process.env.NEXT_PUBLIC_ROULETTE_CANISTER_ID ||
    process.env.CANISTER_ID_ROULETTE_GAME ||
    "bw4dl-smaaa-aaaaa-qaacq-cai",
  mines:
    process.env.NEXT_PUBLIC_MINES_CANISTER_ID ||
    process.env.CANISTER_ID_MINES_GAME ||
    "be2us-64aaa-aaaaa-qaabq-cai",
  casino_frontend:
    process.env.NEXT_PUBLIC_CASINO_FRONTEND_CANISTER_ID ||
    process.env.CANISTER_ID_APT_CASINO_FRONTEND ||
    "rno2w-sqaaa-aaaah-qcmkq-cai",
};

// Network configuration
export const NETWORK_CONFIG = {
  local: {
    host: `http://127.0.0.1:${import.meta.env.DFX_PORT || "4943"}`,
    agent: null,
  },
  ic: {
    host: "https://icp0.io",
    agent: null,
  },
};

// Current network (local for development, ic for production)
export const CURRENT_NETWORK =
  process.env.NODE_ENV === "production" ? "ic" : "local";

// Internet Identity configuration removed - using NFID instead

// Create HTTP Agent
export const createAgent = async (identity = null) => {
  const agent = new HttpAgent({
    host: NETWORK_CONFIG[CURRENT_NETWORK].host,
    identity,
  });

  // Fetch root key for local development
  if (CURRENT_NETWORK === "local") {
    await agent.fetchRootKey();
  }

  return agent;
};

// APT Token Actor Factory (Legacy)
export const createTokenActor = async (identity = null) => {
  const agent = await createAgent(identity);

  return Actor.createActor(tokenIdl, {
    agent,
    canisterId: CANISTER_IDS.apt_token,
  });
};

// APTC Token Actor Factory (Primary Casino Token)
export const createAPTCTokenActor = async (identity = null) => {
  const agent = await createAgent(identity);

  return Actor.createActor(tokenIdl, {
    agent,
    canisterId: CANISTER_IDS.aptc_token,
  });
};

// Roulette Actor Factory
export const createRouletteActor = async (identity = null) => {
  const agent = await createAgent(identity);

  return Actor.createActor(rouletteIdl, {
    agent,
    canisterId: CANISTER_IDS.roulette,
  });
};

// ICRC-1 Token IDL (matching the Motoko backend)
const tokenIdl = ({ IDL }) => {
  const Subaccount = IDL.Vec(IDL.Nat8);
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(Subaccount),
  });

  const TransferArgs = IDL.Record({
    from_subaccount: IDL.Opt(Subaccount),
    to: Account,
    amount: IDL.Nat,
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
  });

  const TransferError = IDL.Variant({
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
    TooOld: IDL.Null,
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    TemporarilyUnavailable: IDL.Null,
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
  });

  const TransferResult = IDL.Variant({
    Ok: IDL.Nat,
    Err: TransferError,
  });

  const ApproveArgs = IDL.Record({
    from_subaccount: IDL.Opt(Subaccount),
    spender: Account,
    amount: IDL.Nat,
    expected_allowance: IDL.Opt(IDL.Nat),
    expires_at: IDL.Opt(IDL.Nat64),
    fee: IDL.Opt(IDL.Nat),
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
  });

  const ApproveError = IDL.Variant({
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
    AllowanceChanged: IDL.Record({ current_allowance: IDL.Nat }),
    Expired: IDL.Record({ ledger_time: IDL.Nat64 }),
    TooOld: IDL.Null,
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    TemporarilyUnavailable: IDL.Null,
    GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
  });

  const ApproveResult = IDL.Variant({
    Ok: IDL.Nat,
    Err: ApproveError,
  });

  const AllowanceArgs = IDL.Record({
    account: Account,
    spender: Account,
  });

  const Allowance = IDL.Record({
    allowance: IDL.Nat,
    expires_at: IDL.Opt(IDL.Nat64),
  });

  return IDL.Service({
    icrc1_name: IDL.Func([], [IDL.Text], ["query"]),
    icrc1_symbol: IDL.Func([], [IDL.Text], ["query"]),
    icrc1_decimals: IDL.Func([], [IDL.Nat8], ["query"]),
    icrc1_fee: IDL.Func([], [IDL.Nat], ["query"]),
    icrc1_total_supply: IDL.Func([], [IDL.Nat], ["query"]),
    icrc1_minting_account: IDL.Func([], [IDL.Opt(Account)], ["query"]),
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ["query"]),
    icrc1_transfer: IDL.Func([TransferArgs], [TransferResult], []),
    icrc2_approve: IDL.Func([ApproveArgs], [ApproveResult], []),
    icrc2_allowance: IDL.Func([AllowanceArgs], [Allowance], ["query"]),
  });
};

// Roulette IDL (matching the Motoko backend)
const rouletteIdl = ({ IDL }) => {
  const BetType = IDL.Variant({
    Number: IDL.Null,
    Color: IDL.Null,
    OddEven: IDL.Null,
    HighLow: IDL.Null,
    Dozen: IDL.Null,
    Column: IDL.Null,
    Split: IDL.Null,
    Street: IDL.Null,
    Corner: IDL.Null,
    Line: IDL.Null,
  });

  const Bet = IDL.Record({
    player: IDL.Principal,
    amount: IDL.Nat,
    betType: BetType,
    betValue: IDL.Nat8,
    numbers: IDL.Vec(IDL.Nat),
    round: IDL.Nat,
    timestamp: IDL.Int,
  });

  const BetResult = IDL.Record({
    player: IDL.Principal,
    amount: IDL.Nat,
    won: IDL.Bool,
    winnings: IDL.Nat,
    round: IDL.Nat,
    number: IDL.Nat,
    timestamp: IDL.Int,
  });

  const Result_1 = IDL.Variant({
    Ok: IDL.Text,
    Err: IDL.Text,
  });

  const BoolResult = IDL.Variant({
    Ok: IDL.Bool,
    Err: IDL.Text,
  });

  return IDL.Service({
    // Betting functions
    placeBet: IDL.Func(
      [BetType, IDL.Nat8, IDL.Nat, IDL.Vec(IDL.Nat)],
      [Result_1],
      []
    ),
    spinRoulette: IDL.Func([], [Result_1], []),
    withdraw: IDL.Func([IDL.Nat], [BoolResult], []),

    // Query functions
    getMinBet: IDL.Func([], [IDL.Nat], ["query"]),
    getMaxBet: IDL.Func([], [IDL.Nat], ["query"]),
    getCurrentRound: IDL.Func([], [IDL.Nat], ["query"]),
    getUserBalance: IDL.Func([IDL.Principal], [IDL.Nat], ["query"]),
    getRecentNumbers: IDL.Func([], [IDL.Vec(IDL.Nat)], ["query"]),
    getRecentResults: IDL.Func([IDL.Nat], [IDL.Vec(BetResult)], ["query"]),
    getCurrentBets: IDL.Func([], [IDL.Vec(Bet)], ["query"]),
    getLastSpinTime: IDL.Func([], [IDL.Int], ["query"]),
    getOwner: IDL.Func([], [IDL.Principal], ["query"]),
    getTreasury: IDL.Func([], [IDL.Principal], ["query"]),
    getPlatformFeeRate: IDL.Func([], [IDL.Nat], ["query"]),
    getTokenCanisterId: IDL.Func([], [IDL.Principal], ["query"]),

    // Admin functions
    setMinBet: IDL.Func([IDL.Nat], [BoolResult], []),
    setMaxBet: IDL.Func([IDL.Nat], [BoolResult], []),
    setTreasury: IDL.Func([IDL.Principal], [BoolResult], []),
    setOwner: IDL.Func([IDL.Principal], [BoolResult], []),
    emergencyWithdraw: IDL.Func([IDL.Nat], [BoolResult], []),
  });
};

// Auth Client removed - using NFID instead

// Format token amount (8 decimals for APTC) - Using simple Number format
export const formatTokenAmount = (amount, decimals = 8) => {
  return Number(amount) / 100000000;
};

// Parse token amount (8 decimals for APTC)
export const parseTokenAmount = (amount, decimals = 8) => {
  return Math.floor(Number(amount) * 100000000);
};

// Create default account for a principal
export const createAccount = (principal, subaccount = null) => {
  return {
    owner: Principal.fromText(principal),
    subaccount: subaccount ? [subaccount] : [],
  };
};
