// Backend Integration Configuration
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { idlFactory } from "../../../declarations/APTC-token/APTC-token.did.js";
import { createActor } from "../../../declarations/APTC-token/index.js";
import { idlFactory as rouletteIdl } from "../../../declarations/roulette-game/roulette-game.did.js";
// Environment variables and canister IDs
export const CANISTER_IDS = {
  APTC_TOKEN:
    process.env.CANISTER_ID_APTC_TOKEN || "be2us-64aaa-aaaaa-qaabq-cai",
  ROULETTE_GAME:
    process.env.CANISTER_ID_ROULETTE_GAME || "bw4dl-smaaa-aaaaa-qaacq-cai",
  MINES_GAME:
    process.env.CANISTER_ID_MINES_GAME || "be2us-64aaa-aaaaa-qaabq-cai",
  FRONTEND:
    process.env.CANISTER_ID_APT_CASINO_FRONTEND ||
    "be2us-64aaa-aaaaa-qaabq-cai",
};

// Network configuration - FORCE LOCAL DEVELOPMENT ONLY
const LOCAL_HOST = "http://localhost:4943"; // Default DFX replica port
const IC_HOST = "https://icp-api.io"; // Proper IC mainnet boundary node

export const getNetworkHost = () => {
  // Check if we're running in the browser or Node.js
  const isBrowser = typeof window !== "undefined";

  if (isBrowser) {
    // Use the DFX_PORT from environment if available, otherwise default to 4943
    const dfxPort = import.meta.env.DFX_PORT || "4943";
    const browserCompatibleHost = `http://127.0.0.1:${dfxPort}`;
    console.log(
      "🔧 Using browser-compatible local host:",
      browserCompatibleHost
    );
    return browserCompatibleHost;
  }

  // FORCE LOCAL DEVELOPMENT - use the DFX_PORT from environment if available
  const dfxPort = process.env.DFX_PORT || "4943";
  const localHost = `http://localhost:${dfxPort}`;
  console.log("🔧 Using local development mode on port", dfxPort);
  return localHost;
};

// Determine if we're in local development
export const isLocalDevelopment = () => {
  // ALWAYS return true for local development
  return true;
};

// // Certificate retry utility with exponential backoff
// const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       const isLastAttempt = attempt === maxRetries;
//       const isCertificateError =
//         error.message &&
//         (error.message.includes("threshold signature") ||
//           error.message.includes("certificate") ||
//           error.message.includes("Invalid canister signature") ||
//           error.message.includes("verification") ||
//           error.message.includes("ThresBls12_381") ||
//           error.message.includes("invalid delegation") ||
//           error.message.includes("signature could not be verified") ||
//           error.message.includes("IcCanisterSignature") ||
//           error.message.includes("gateway returned an error") ||
//           error.message.includes("400 bad request"));

//       if (isLastAttempt || !isCertificateError) {
//         throw error;
//       }

//       const delay = baseDelay * Math.pow(2, attempt - 1);
//       console.warn(
//         `🔄 Certificate verification failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`
//       );
//       await new Promise((resolve) => setTimeout(resolve, delay));
//     }
//   }
// };

// Enhanced agent creation with delegation certificate handling
export const createAgent = async (identity = null, forceRecreate = false) => {
  // const host = getNetworkHost();
  const host = "http://127.0.0.1:4943";

  const agentOptions = {
    host,
    identity,
    fetchOptions: {
      timeout: 60000, // 60 second timeout for network operations
    },
  };

  const agent = new HttpAgent(agentOptions);
  await agent.fetchRootKey();
  return agent;
};

// Agent cache with automatic recreation on certificate failures
const agentCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Export agentCache for direct access when needed
export const getAgentCache = () => agentCache;

export const getCachedAgent = async (
  identity = null,
  cacheKey = "default",
  forceRefresh = false
) => {
  const now = Date.now();
  const cached = agentCache.get(cacheKey);

  // If forceRefresh is true or cached agent doesn't exist or is expired, create a new one
  if (forceRefresh || !cached || now - cached.timestamp > CACHE_TTL) {
    console.log(
      `🔄 Creating fresh agent with identity: ${
        identity ? "provided" : "none"
      }, cache key: ${cacheKey}`
    );

    // Create new agent
    const agent = await createAgent(identity);

    // Fetch root key for local development to ensure fresh state
    if (process.env.DFX_NETWORK !== "ic") {
      try {
        await agent.fetchRootKey();
        console.log("✅ Root key fetched successfully");
      } catch (e) {
        console.warn("⚠️ Failed to fetch root key:", e);
      }
    }

    // Validate the agent before caching
    try {
      const testCall = await agent.status();
      console.log("✅ Agent test call successful:", testCall);
    } catch (e) {
      console.error("❌ Agent validation failed:", e);
      // Still cache it, but log the error
    }

    // Cache the agent with a timestamp
    agentCache.set(cacheKey, { agent, timestamp: now });
    return agent;
  }

  // Return cached agent
  return cached.agent;
};

// Utility to recreate agent on certificate failures with delegation fallback
export const recreateAgentOnError = async (
  error,
  identity = null,
  cacheKey = "default"
) => {
  const isCertificateError =
    error &&
    error.message &&
    (error.message.includes("threshold signature") ||
      error.message.includes("certificate") ||
      error.message.includes("Invalid canister signature") ||
      error.message.includes("verification") ||
      error.message.includes("ThresBls12_381") ||
      error.message.includes("signature could not be verified") ||
      error.message.includes("IcCanisterSignature") ||
      error.message.includes("gateway returned an error") ||
      error.message.includes("400 bad request") ||
      error.message.includes("delegation"));

  if (isCertificateError) {
    console.log(
      "🔄 Certificate error detected, implementing delegation fallback..."
    );

    // Clear all certificate-related caches in browser storage
    if (typeof window !== "undefined") {
      try {
        // Clear localStorage entries
        if (window.localStorage) {
          Object.keys(window.localStorage).forEach((key) => {
            if (
              key.includes("certificate") ||
              key.includes("delegation") ||
              key.includes("agent") ||
              key.includes("identity") ||
              key.includes("auth") ||
              key.includes("principal") ||
              key.includes("canister")
            ) {
              window.localStorage.removeItem(key);
              console.log(`🗑️ Cleared localStorage: ${key}`);
            }
          });
        }

        // Clear session storage
        if (window.sessionStorage) {
          Object.keys(window.sessionStorage).forEach((key) => {
            if (
              key.includes("certificate") ||
              key.includes("delegation") ||
              key.includes("agent") ||
              key.includes("identity")
            ) {
              window.sessionStorage.removeItem(key);
              console.log(`🗑️ Cleared sessionStorage: ${key}`);
            }
          });
        }
      } catch (e) {
        console.warn("⚠️ Error clearing storage caches:", e);
      }
    }

    // Clear the cached agent
    agentCache.delete(cacheKey);

    // For local development with delegation issues, create anonymous agent as fallback
    if (isLocalDevelopment() && identity) {
      console.log("⚠️ Using anonymous agent fallback for local development");
      const fallbackAgent = await createAgent(null, true); // Force anonymous
      agentCache.set(cacheKey + "_fallback", {
        agent: fallbackAgent,
        timestamp: Date.now(),
      });
      return fallbackAgent;
    }

    // Create a fresh agent with force recreate
    const newAgent = await createAgent(identity, true);
    agentCache.set(cacheKey, { agent: newAgent, timestamp: Date.now() });

    return newAgent;
  }

  throw error; // Re-throw if not a certificate error
};

// Enhanced fallback agent getter
export const getFallbackAgent = async (
  identity = null,
  cacheKey = "default"
) => {
  // Check if we have a fallback agent cached
  const fallbackCached = agentCache.get(cacheKey + "_fallback");
  if (fallbackCached && Date.now() - fallbackCached.timestamp < CACHE_TTL) {
    console.log("🔄 Using cached fallback anonymous agent");
    return fallbackCached.agent;
  }

  // Create new anonymous fallback agent for local development
  if (isLocalDevelopment()) {
    console.log("🔧 Creating new fallback anonymous agent");
    const fallbackAgent = await createAgent(null, true);
    agentCache.set(cacheKey + "_fallback", {
      agent: fallbackAgent,
      timestamp: Date.now(),
    });
    return fallbackAgent;
  }

  // For non-local environments, return regular cached agent
  return await getCachedAgent(identity, cacheKey);
};

// Mines Game IDL - Updated to match backend
const minesIdl = ({ IDL }) => {
  const CellState = IDL.Variant({
    Hidden: IDL.Null,
    Revealed: IDL.Null,
    Mine: IDL.Null,
    Safe: IDL.Null,
  });

  const GameState = IDL.Variant({
    NotStarted: IDL.Null,
    InProgress: IDL.Null,
    Won: IDL.Null,
    Lost: IDL.Null,
    Cashed: IDL.Null,
  });

  const MinesGameSession = IDL.Record({
    player: IDL.Principal,
    betAmount: IDL.Nat,
    mineCount: IDL.Nat,
    gameState: GameState,
    grid: IDL.Vec(CellState),
    minePositions: IDL.Vec(IDL.Nat),
    revealedCells: IDL.Vec(IDL.Nat),
    multiplier: IDL.Float64,
    potentialWin: IDL.Nat,
    startTime: IDL.Int,
    endTime: IDL.Opt(IDL.Int),
  });

  const GameResult = IDL.Record({
    gameId: IDL.Nat,
    player: IDL.Principal,
    betAmount: IDL.Nat,
    winAmount: IDL.Nat,
    mineCount: IDL.Nat,
    revealedCells: IDL.Vec(IDL.Nat),
    minePositions: IDL.Vec(IDL.Nat),
    gameState: GameState,
    timestamp: IDL.Int,
  });

  const UserStats = IDL.Record({
    totalBets: IDL.Nat,
    totalWagered: IDL.Nat,
    totalWon: IDL.Nat,
    biggestWin: IDL.Nat,
    gamesPlayed: IDL.Nat,
  });

  const MinesError = IDL.Variant({
    NotAuthorized: IDL.Null,
    GameNotFound: IDL.Null,
    GameNotInProgress: IDL.Null,
    InvalidCellIndex: IDL.Null,
    CellAlreadyRevealed: IDL.Null,
    InsufficientBalance: IDL.Null,
    InvalidBetAmount: IDL.Null,
    InvalidMineCount: IDL.Null,
    TransferFailed: IDL.Text,
    GameNotStarted: IDL.Null,
    TooManyMines: IDL.Null,
    TooFewMines: IDL.Null,
    CooldownActive: IDL.Null,
    GameInactive: IDL.Null,
    NotInitialized: IDL.Null,
    TokenTransferError: IDL.Text,
    TokenApproveError: IDL.Text,
    TokenTransferFromError: IDL.Text,
    InsufficientAllowance: IDL.Null,
  });

  const MinesGameResult = IDL.Variant({
    Ok: MinesGameSession,
    Err: MinesError,
  });

  const CashOutResult = IDL.Variant({
    Ok: GameResult,
    Err: MinesError,
  });

  const GameStats = IDL.Record({
    totalGames: IDL.Nat,
    totalVolume: IDL.Nat,
    houseProfits: IDL.Nat,
    activeGamesCount: IDL.Nat,
  });

  const BetLimits = IDL.Record({
    minBet: IDL.Nat,
    maxBet: IDL.Nat,
  });

  return IDL.Service({
    // Game actions
    startGame: IDL.Func([IDL.Nat, IDL.Nat], [MinesGameResult], []),
    revealCell: IDL.Func([IDL.Nat], [MinesGameResult], []),
    cashOut: IDL.Func([], [CashOutResult], []),

    // Queries
    getActiveGame: IDL.Func(
      [IDL.Principal],
      [IDL.Opt(MinesGameSession)],
      ["query"]
    ),
    getGameHistory: IDL.Func(
      [IDL.Principal, IDL.Opt(IDL.Nat)],
      [IDL.Vec(GameResult)],
      ["query"]
    ),
    getUserBalance: IDL.Func([IDL.Principal], [IDL.Nat], ["query"]),
    getPlayerTokenBalance: IDL.Func([IDL.Principal], [IDL.Nat], []),
    getUserStats: IDL.Func([IDL.Principal], [IDL.Opt(UserStats)], ["query"]),
    getGameStats: IDL.Func([], [GameStats], ["query"]),
    getBetLimits: IDL.Func([], [BetLimits], ["query"]),
    isGameActive: IDL.Func([], [IDL.Bool], ["query"]),
    getMultiplierForMines: IDL.Func(
      [IDL.Nat, IDL.Nat],
      [IDL.Float64],
      ["query"]
    ),
  });
};

// Actor creation functions with optional agent parameter for certificate handling
export const createAPTCTokenActor = async (identity = null, agent = null) => {
  try {
    // const effectiveAgent = await createAgent(identity);
    return createActor(CANISTER_IDS.APTC_TOKEN, { agentOptions: { identity } });
  } catch (err) {
    console.error("Failed to create APTC token actor:", err);
    throw err;
  }
};

export const createRouletteActor = async (identity = null, agent = null) => {
  try {
    const effectiveAgent = agent || (await createAgent(identity));
    return Actor.createActor(rouletteIdl, {
      agent: effectiveAgent,
      canisterId: CANISTER_IDS.ROULETTE_GAME,
    });
  } catch (err) {
    console.error("Failed to create Roulette actor:", err);
    throw err;
  }
};

export const createMinesActor = async (identity = null, agent = null) => {
  try {
    const effectiveAgent = agent || (await createAgent(identity));
    return Actor.createActor(minesIdl, {
      agent: effectiveAgent,
      canisterId: CANISTER_IDS.MINES_GAME,
    });
  } catch (err) {
    console.error("Failed to create Mines actor:", err);
    throw err;
  }
};

// Utility functions for token amounts - Using simple Number format like Number(bet.winnings) / 100000000
export const parseTokenAmount = (amount, decimals = 8) => {
  if (!amount) return BigInt(0);
  return BigInt(Math.floor(Number(amount) * 100000000));
};

export const formatTokenAmount = (amount, decimals = 8) => {
  if (!amount) return 0;
  return Number(amount) / 100000000;
};

// Bet creation helpers for roulette
export const createRouletteBet = {
  number: (number, amount) => ({
    betType: { Number: null },
    betValue: number,
    amount: parseTokenAmount(amount),
    numbers: [],
  }),

  color: (isRed, amount) => ({
    betType: { Color: null },
    betValue: isRed ? 1 : 0, // 1 for red, 0 for black
    amount: parseTokenAmount(amount),
    numbers: [],
  }),

  oddEven: (isOdd, amount) => ({
    betType: { OddEven: null },
    betValue: isOdd ? 1 : 0, // 1 for odd, 0 for even
    amount: parseTokenAmount(amount),
    numbers: [],
  }),

  highLow: (isHigh, amount) => ({
    betType: { HighLow: null },
    betValue: isHigh ? 1 : 0, // 1 for high (19-36), 0 for low (1-18)
    amount: parseTokenAmount(amount),
    numbers: [],
  }),

  dozen: (dozen, amount) => ({
    betType: { Dozen: null },
    betValue: dozen, // 0, 1, or 2 for first, second, third dozen
    amount: parseTokenAmount(amount),
    numbers: [],
  }),

  column: (column, amount) => ({
    betType: { Column: null },
    betValue: column, // 0, 1, or 2 for first, second, third column
    amount: parseTokenAmount(amount),
    numbers: [],
  }),
};

// Game constants
export const ROULETTE_CONSTANTS = {
  RED_NUMBERS: [
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ],
  BLACK_NUMBERS: [
    2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
  ],
  MIN_NUMBER: 0,
  MAX_NUMBER: 36,
};

export const getNumberColor = (number) => {
  if (number === 0) return "green";
  return ROULETTE_CONSTANTS.RED_NUMBERS.includes(number) ? "red" : "black";
};

export const MINES_CONSTANTS = {
  GRID_SIZE: 25, // 5x5 grid
  MIN_MINES: 1,
  MAX_MINES: 24,
};
