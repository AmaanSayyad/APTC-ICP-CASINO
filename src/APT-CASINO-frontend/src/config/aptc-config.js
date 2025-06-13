// APTC Configuration for APT Casino
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

// Add BigInt serialization support globally
if (typeof BigInt !== "undefined" && !BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

// Canister IDs - These will be set after deployment
export const CANISTER_IDS = {
  aptc_token:
    process.env.NEXT_PUBLIC_APTC_TOKEN_CANISTER_ID ||
    process.env.CANISTER_ID_APTC_TOKEN ||
    "be2us-64aaa-aaaaa-qaabq-cai",
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
    "be2us-64aaa-aaaaa-qaabq-cai",
};

// Network configuration
export const NETWORK_CONFIG = {
  local: {
    host: `http://127.0.0.1:${process.env.DFX_PORT || "4943"}`,
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

// Create HTTP Agent
export const createAgent = async (identity = null) => {
  // For local development, make sure we're using the right port
  const localHost = `http://127.0.0.1:${process.env.DFX_PORT || "4943"}`;

  // Determine host based on network and environment
  const host =
    CURRENT_NETWORK === "local"
      ? localHost
      : NETWORK_CONFIG[CURRENT_NETWORK].host;

  console.log(`🌐 Creating HTTP agent for host: ${host}`);

  const agent = new HttpAgent({
    host,
    identity,
    // Increase timeout for local development
    fetchOptions: CURRENT_NETWORK === "local" ? { timeout: 30000 } : undefined,
  });

  // Fetch root key for local development
  if (CURRENT_NETWORK === "local") {
    try {
      console.log("🔑 Fetching root key for local development...");
      await agent.fetchRootKey().catch((e) => {
        console.warn("⚠️ Could not fetch root key, proceeding anyway...", e);
      });
      console.log("✅ Root key fetch complete");
    } catch (err) {
      console.warn("⚠️ Unable to fetch root key. Check your local replica.");
      console.error(err);
      // Continue anyway - in local development this might still work
    }
  }

  return agent;
};

// APTC Token Interface
export const aptcTokenIdl = {
  idlFactory: ({ IDL }) => {
    return IDL.Service({
      icrc1_name: IDL.Func([], [IDL.Text], ["query"]),
      icrc1_symbol: IDL.Func([], [IDL.Text], ["query"]),
      icrc1_decimals: IDL.Func([], [IDL.Nat8], ["query"]),
      icrc1_fee: IDL.Func([], [IDL.Nat], ["query"]),
      icrc1_total_supply: IDL.Func([], [IDL.Nat], ["query"]),
      icrc1_balance_of: IDL.Func(
        [
          IDL.Record({
            owner: IDL.Principal,
            subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
          }),
        ],
        [IDL.Nat],
        ["query"]
      ),
      icrc2_allowance: IDL.Func(
        [
          IDL.Record({
            account: IDL.Record({
              owner: IDL.Principal,
              subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
            }),
            spender: IDL.Record({
              owner: IDL.Principal,
              subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
            }),
          }),
        ],
        [
          IDL.Record({
            allowance: IDL.Nat,
            expires_at: IDL.Opt(IDL.Nat64),
          }),
        ],
        ["query"]
      ),
      icrc2_approve: IDL.Func(
        [
          IDL.Record({
            from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
            spender: IDL.Record({
              owner: IDL.Principal,
              subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
            }),
            amount: IDL.Nat,
            expected_allowance: IDL.Opt(IDL.Nat),
            expires_at: IDL.Opt(IDL.Nat64),
            fee: IDL.Opt(IDL.Nat),
            memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
            created_at_time: IDL.Opt(IDL.Nat64),
          }),
        ],
        [
          IDL.Variant({
            Ok: IDL.Nat,
            Err: IDL.Variant({
              InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
              AllowanceChanged: IDL.Record({ current_allowance: IDL.Nat }),
              BadFee: IDL.Record({ expected_fee: IDL.Nat }),
              Expired: IDL.Record({ ledger_time: IDL.Nat64 }),
              TooOld: IDL.Null,
              CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
              Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
              TemporarilyUnavailable: IDL.Null,
              GenericError: IDL.Record({
                error_code: IDL.Nat,
                message: IDL.Text,
              }),
            }),
          }),
        ],
        []
      ),
      faucet_claim: IDL.Func(
        [],
        [IDL.Variant({ Ok: IDL.Nat, Err: IDL.Text })],
        []
      ),
      icrc1_transfer: IDL.Func(
        [
          IDL.Record({
            to: IDL.Record({
              owner: IDL.Principal,
              subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
            }),
            amount: IDL.Nat,
            fee: IDL.Opt(IDL.Nat),
            memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
            from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
            created_at_time: IDL.Opt(IDL.Nat64),
          }),
        ],
        [IDL.Variant({ Ok: IDL.Nat, Err: IDL.Text })],
        []
      ),
    });
  },
};

// Roulette Game Interface
export const rouletteIdl = {
  idlFactory: ({ IDL }) => {
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

    return IDL.Service({
      getGameInfo: IDL.Func(
        [],
        [
          IDL.Record({
            currentRound: IDL.Nat,
            minBet: IDL.Nat,
            maxBet: IDL.Nat,
            lastSpinTime: IDL.Int,
          }),
        ],
        ["query"]
      ),
      getRecentNumbers: IDL.Func([], [IDL.Vec(IDL.Nat)], ["query"]),
      getUserBalance: IDL.Func([IDL.Principal], [IDL.Nat], ["query"]),
      getCurrentBets: IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              player: IDL.Principal,
              amount: IDL.Nat,
              betType: BetType,
              betValue: IDL.Nat8,
              numbers: IDL.Vec(IDL.Nat),
              round: IDL.Nat,
              timestamp: IDL.Int,
            })
          ),
        ],
        ["query"]
      ),
      placeBet: IDL.Func(
        [BetType, IDL.Nat8, IDL.Nat, IDL.Vec(IDL.Nat)],
        [IDL.Variant({ Ok: IDL.Text, Err: IDL.Text })],
        []
      ),
      spinRoulette: IDL.Func(
        [],
        [IDL.Variant({ Ok: IDL.Text, Err: IDL.Text })],
        []
      ),
      withdraw: IDL.Func(
        [IDL.Nat],
        [IDL.Variant({ Ok: IDL.Text, Err: IDL.Text })],
        []
      ),
    });
  },
};

// Create Token Actor
export const createAPTCTokenActor = async (identity = null) => {
  try {
    const agent = await createAgent(identity);

    // Instead of dynamic import, use the direct IDL factory with static imports
    // This is more reliable in certain build environments
    const { idlFactory } = aptcTokenIdl;

    return Actor.createActor(idlFactory, {
      agent,
      canisterId: CANISTER_IDS.aptc_token,
    });
  } catch (err) {
    console.error("Failed to create APTC token actor:", err);
    throw err;
  }
};

// Create Roulette Actor
export const createRouletteActor = async (identity = null) => {
  try {
    const agent = await createAgent(identity);

    // Instead of dynamic import, use the direct IDL factory with static imports
    // This is more reliable in certain build environments
    const { idlFactory } = rouletteIdl;

    return Actor.createActor(idlFactory, {
      agent,
      canisterId: CANISTER_IDS.roulette,
    });
  } catch (err) {
    console.error("Failed to create Roulette actor:", err);
    throw err;
  }
};

// Format token amount - Using simple Number format like Number(bet.winnings) / 100000000
export const formatTokenAmount = (amount, decimals = 8) => {
  if (!amount) return 0;
  return Number(amount) / 100000000;
};

// Parse token amount
export const parseTokenAmount = (amount, decimals = 8) => {
  if (!amount) return 0;
  return Math.floor(Number(amount) * 100000000);
};
