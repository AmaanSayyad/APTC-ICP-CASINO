// Mines Game Integration for ICP Canister
import { Principal } from "@dfinity/principal";
import { Actor } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/mines-game/mines-game.did.js";
import { getCachedAgent, CANISTER_IDS } from "./backend-integration";

// Token formatting utilities
const APTC_DECIMALS = 8;

// Format APTC token amount from raw value to human readable form
export const formatAPTCAmount = (rawAmount, options = {}) => {
  const {
    decimals = 2,
    includeSymbol = true,
    withCommas = true,
    compactNotation = false,
  } = options;

  if (!rawAmount && rawAmount !== 0)
    return includeSymbol ? "0.00 APTC" : "0.00";

  // Convert to string and handle BigInt
  const amountStr = rawAmount.toString();

  // Calculate value by dividing by 10^APTC_DECIMALS
  const value = Number(amountStr) / Math.pow(10, APTC_DECIMALS);

  // Format options
  let formatted;
  if (compactNotation && value >= 1000) {
    // Use compact notation for large numbers
    formatted = new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  } else {
    // Format with specified decimals
    formatted = value.toFixed(decimals);

    // Add commas for thousands if requested
    if (withCommas) {
      const parts = formatted.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      formatted = parts.join(".");
    }
  }

  return includeSymbol ? `${formatted} APTC` : formatted;
};

// Parse human readable amount to raw token amount
export const parseAPTCAmount = (formattedAmount) => {
  if (!formattedAmount) return 0;

  // Remove APTC symbol and commas, and convert to number
  const cleanAmount = formattedAmount.replace(/[^0-9.]/g, "");
  const value = parseFloat(cleanAmount);

  if (isNaN(value)) return 0;

  // Convert to raw token amount (multiply by 10^APTC_DECIMALS)
  return BigInt(Math.floor(value * Math.pow(10, APTC_DECIMALS)));
};

// Utility functions for converting between frontend and backend types
const convertCellState = (cellState) => {
  if ("Hidden" in cellState) return { type: "Hidden" };
  if ("Mine" in cellState) return { type: "Mine" };
  if ("Safe" in cellState) return { type: "Safe" };
  if ("Revealed" in cellState) return { type: "Revealed" };
  return { type: "Hidden" }; // Default
};

const convertGameState = (gameState) => {
  if (!gameState || typeof gameState !== "object") return "NotStarted";

  if ("NotStarted" in gameState) return "NotStarted";
  if ("InProgress" in gameState) return "InProgress";
  if ("Won" in gameState) return "Won";
  if ("Lost" in gameState) return "Lost";
  if ("Cashed" in gameState) return "Cashed";
  return "NotStarted"; // Default
};

const formatGameSession = (session) => {
  console.log(
    "🔄 Formatting game session from data:",
    JSON.stringify(session, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );

  // Check if this is an error response - don't try to format errors as game sessions
  if (session && (session.err || session.Err)) {
    console.error("❌ Cannot format error response as game session:", session);
    throw new Error("Received error response instead of game session");
  }

  // Default empty session if null is passed
  const defaultSession = {
    player: "",
    bet_amount: "0",
    formatted_bet_amount: "0.00 APTC",
    mine_count: 1,
    game_status: { NotStarted: true },
    transaction_type: "NEUTRAL",
    grid: Array(25).fill({ type: "Hidden" }),
    mine_positions: [],
    revealed_cells: [],
    multiplier: 1.0,
    potential_win: "0",
    formatted_potential_win: "0.00 APTC",
    potential_profit: "0",
    formatted_potential_profit: "0.00 APTC",
    start_time: 0,
    end_time: null,
    formatted_start_time: new Date().toLocaleString(),
    formatted_end_time: null,
  };

  if (!session) {
    console.log("⚠️ Empty session data, returning default session");
    return defaultSession;
  }

  // Debug object types for troubleshooting
  console.log("📊 Session object structure:", {
    minePositionsType: session.minePositions
      ? `${typeof session.minePositions} (${
          Array.isArray(session.minePositions) ? "array" : "not array"
        })`
      : "undefined",
    revealedCellsType: session.revealedCells
      ? `${typeof session.revealedCells} (${
          Array.isArray(session.revealedCells) ? "array" : "not array"
        })`
      : "undefined",
    gameStateType: session.gameState
      ? `${typeof session.gameState}`
      : "undefined",
    betAmountType: session.betAmount
      ? `${typeof session.betAmount}`
      : "undefined",
  });

  // Handle case where the session might be nested in an 'Ok' or 'ok' field
  if (session.Ok && typeof session.Ok === "object") {
    console.log("📦 Unwrapping session from Ok variant");
    return formatGameSession(session.Ok);
  }

  if (session.ok && typeof session.ok === "object") {
    console.log("📦 Unwrapping session from ok variant");
    return formatGameSession(session.ok);
  }

  try {
    const gameState = convertGameState(session.gameState);

    // Convert amounts ensuring they're handled as strings to prevent BigInt issues
    const betAmount =
      typeof session.betAmount === "bigint"
        ? session.betAmount.toString()
        : (session.betAmount || "0").toString();

    const potentialWin =
      typeof session.potentialWin === "bigint"
        ? session.potentialWin.toString()
        : (session.potentialWin || "0").toString();

    console.log("💰 Amount conversions:", {
      originalBetAmount: session.betAmount,
      convertedBetAmount: betAmount,
      originalPotentialWin: session.potentialWin,
      convertedPotentialWin: potentialWin,
    });

    // Add formatted amounts for display
    const formattedBetAmount = formatAPTCAmount(betAmount);
    const formattedPotentialWin = formatAPTCAmount(potentialWin);

    // Determine transaction type based on game state
    const transactionType = "DEBIT"; // Always a debit for bet amount in a game session

    // Calculate potential profit with safe BigInt conversion
    let potentialProfit;
    try {
      potentialProfit = BigInt(potentialWin) - BigInt(betAmount);
    } catch (e) {
      console.error("⚠️ BigInt conversion error:", e);
      potentialProfit = BigInt(0);
    }
    const formattedPotentialProfit = formatAPTCAmount(
      potentialProfit.toString()
    );

    // Ensure arrays are properly handled and BigInt values are converted
    let minePositions = [];
    if (session.minePositions) {
      if (Array.isArray(session.minePositions)) {
        minePositions = session.minePositions.map((pos) =>
          typeof pos === "bigint" ? Number(pos) : pos
        );
      } else {
        console.warn(
          "⚠️ minePositions is not an array:",
          session.minePositions
        );
      }
    }

    let revealedCells = [];
    if (session.revealedCells) {
      if (Array.isArray(session.revealedCells)) {
        revealedCells = session.revealedCells.map((cell) =>
          typeof cell === "bigint" ? Number(cell) : cell
        );
      } else {
        console.warn(
          "⚠️ revealedCells is not an array:",
          session.revealedCells
        );
      }
    }

    console.log("🎮 Processed arrays:", {
      minePositions,
      revealedCells,
    });

    return {
      player: session.player?.toString() || "",
      bet_amount: betAmount,
      formatted_bet_amount: formattedBetAmount,
      mine_count: session.mineCount || 1,
      game_status: {
        [gameState]: true,
      },
      transaction_type: transactionType,
      grid:
        session.grid?.map(convertCellState) ||
        Array(25).fill({ type: "Hidden" }),
      mine_positions: minePositions,
      revealed_cells: revealedCells,
      multiplier: Number(session.multiplier || 1),
      potential_win: potentialWin,
      formatted_potential_win: formattedPotentialWin,
      potential_profit: potentialProfit.toString(),
      formatted_potential_profit: formattedPotentialProfit,
      start_time: session.startTime || 0,
      end_time: session.endTime?.[0] || null,
      // Add human-readable timestamps for UI
      formatted_start_time: session.startTime
        ? new Date(Number(session.startTime) / 1000000).toLocaleString()
        : new Date().toLocaleString(),
      formatted_end_time: session.endTime?.[0]
        ? new Date(Number(session.endTime[0]) / 1000000).toLocaleString()
        : null,
    };
  } catch (error) {
    console.error("Error formatting game session:", error);
    return defaultSession;
  }
};

const formatGameResult = (result) => {
  console.log("🔄 Formatting game result from data:", result);

  if (!result) {
    console.warn("⚠️ Null/undefined game result data");
    return null;
  }

  // Handle case where the result might be nested in an 'Ok' field
  if (result.Ok && typeof result.Ok === "object") {
    console.log("📦 Unwrapping result from Ok variant");
    return formatGameResult(result.Ok);
  }

  // Safe access to properties with defaults
  const gameState = convertGameState(result.gameState || "unknown");
  const betAmount = (result.betAmount || "0").toString();
  const winAmount = (result.winAmount || "0").toString();

  // Calculate profit/loss
  const profit = BigInt(winAmount) - BigInt(betAmount);

  // Determine if this was a win, loss, or cashout
  let transactionType = "NEUTRAL";
  let resultStatus = "";

  if (gameState === "Won" || gameState === "Cashed") {
    transactionType = "CREDIT";
    resultStatus = profit > 0 ? "WIN" : "BREAK_EVEN";
  } else if (gameState === "Lost") {
    transactionType = "DEBIT";
    resultStatus = "LOSS";
  }

  // Format amounts for display
  const formattedBetAmount = formatAPTCAmount(betAmount);
  const formattedWinAmount = formatAPTCAmount(winAmount);
  const formattedProfit = formatAPTCAmount(profit);

  // Create user-friendly date string
  const date = new Date(Number(result.timestamp) / 1000000);
  const formattedDate = date.toLocaleString();

  return {
    game_id: result.gameId,
    player: result.player.toString(),
    bet_amount: betAmount,
    formatted_bet_amount: formattedBetAmount,
    win_amount: winAmount,
    formatted_win_amount: formattedWinAmount,
    profit: profit.toString(),
    formatted_profit: formattedProfit,
    transaction_type: transactionType,
    result_status: resultStatus,
    mine_count: result.mineCount,
    revealed_cells: result.revealedCells,
    mine_positions: result.minePositions,
    game_status: {
      [gameState]: true,
    },
    timestamp: result.timestamp,
    formatted_timestamp: formattedDate,
    is_withdrawal: gameState === "Cashed", // Explicitly indicate if this was a withdrawal/cashout
    is_win: profit > 0, // Explicitly indicate if this was a win
  };
};

// Main Mines client class that adapts the canister interface to the frontend
export class MinesClient {
  constructor(canisterId = CANISTER_IDS.MINES_GAME) {
    // Make sure we have a valid canister ID
    console.log("🎲 Initializing Mines client with canister ID:", canisterId);

    // Verify the canister ID against the known value from .env
    const expectedCanisterId = "bw4dl-smaaa-aaaaa-qaacq-cai"; // From .env
    if (canisterId !== expectedCanisterId) {
      console.warn(
        `⚠️ Provided canister ID ${canisterId} doesn't match expected ID ${expectedCanisterId}`
      );
      // Use the expected ID from .env to ensure consistency
      this.canisterId = expectedCanisterId;
      console.log(
        "✅ Using expected mines canister ID instead:",
        this.canisterId
      );
    } else {
      this.canisterId = canisterId;
    }

    this.actor = null;
    this.isAuthenticated = false;
  }

  // Initialize the actor with an optional identity
  async init(identity = null) {
    try {
      console.log("🎮 Initializing Mines client with identity:", !!identity);
      console.log("🎲 Mines canister ID:", this.canisterId);

      // IMPORTANT FIX: Store the identity for future use
      this.identity = identity;

      // Ensure we have the correct imports
      const { getCachedAgent, CANISTER_IDS } = await import(
        "./backend-integration"
      );

      // Validate canister ID again
      if (this.canisterId !== CANISTER_IDS.MINES_GAME) {
        console.warn(
          `⚠️ Canister ID mismatch: ${this.canisterId} vs ${CANISTER_IDS.MINES_GAME}`
        );
        // Use the one from backend-integration for consistency
        this.canisterId = CANISTER_IDS.MINES_GAME;
        console.log("✅ Updated mines canister ID:", this.canisterId);
      }

      // Create both authenticated and anonymous actors for different operations

      // Anonymous actor for public queries
      console.log("🔑 Creating anonymous actor for public queries...");
      const anonymousAgent = await getCachedAgent(null, "mines-anon");

      if (!anonymousAgent) {
        throw new Error("Failed to create anonymous agent");
      }

      this.anonymousActor = Actor.createActor(idlFactory, {
        agent: anonymousAgent,
        canisterId: this.canisterId,
      });

      // Authenticated actor for updates and private queries
      console.log("🔑 Creating authenticated actor for transactions...");
      const authAgent = await getCachedAgent(identity, "mines-auth");

      if (!authAgent) {
        throw new Error("Failed to create authenticated agent");
      }

      this.actor = Actor.createActor(idlFactory, {
        agent: authAgent,
        canisterId: this.canisterId,
      });

      this.isAuthenticated = !!identity;

      // Store the principal directly if we have an identity
      if (identity && typeof identity.getPrincipal === "function") {
        try {
          this.userPrincipal = identity.getPrincipal();
          console.log(
            "✅ Stored user principal during initialization:",
            this.userPrincipal.toString()
          );
        } catch (principalError) {
          console.warn(
            "⚠️ Failed to get principal from identity during init",
            principalError
          );
        }
      }

      console.log(
        `📊 Mines client initialized (${
          this.isAuthenticated ? "authenticated" : "anonymous"
        }) with canister: ${this.canisterId}`
      );
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize Mines client:", error);
      return false;
    }
  }

  // Check if an actor exists, initialize if not
  async ensureActor(identity = null) {
    if (!this.actor) {
      await this.init(identity);
    }
    if (!this.actor) {
      throw new Error("Mines client not initialized");
    }
  }

  // Get active game for a user
  async getActiveGame(principal = null) {
    await this.ensureActor();

    try {
      let principalId = principal;

      // If no principal is provided and we're authenticated, try to get the caller's principal
      if (principal === null && this.isAuthenticated) {
        try {
          principalId = await this.whoami();
          console.log(
            "🔑 Using authenticated user's principal for active game check:",
            principalId?.toString() || "Not available"
          );
        } catch (err) {
          console.warn(
            "Unable to get user principal for active game, using provided principal"
          );
        }
      } else if (typeof principal === "string") {
        principalId = Principal.fromText(principal);
      }

      console.log(
        "🎮 Fetching active game for principal:",
        principalId?.toString() || "null"
      );

      // Add retry logic in case of network issues
      let retries = 0;
      const maxRetries = 3;
      let gameSession;

      while (retries < maxRetries) {
        try {
          gameSession = await this.actor.getActiveGame(principalId);
          break; // Success, exit retry loop
        } catch (e) {
          retries++;
          console.warn(
            `🔄 Retry ${retries}/${maxRetries} for active game failed:`,
            e.message
          );
          if (retries >= maxRetries) throw e;

          // Wait 500ms before retrying
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      console.log(
        "🎲 Raw active game response:",
        JSON.stringify(gameSession, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );

      // Enhanced validation of response
      if (!gameSession || !Array.isArray(gameSession) || !gameSession[0]) {
        console.log("ℹ️ No active game found");
        return [];
      }

      // Format the session with proper BigInt handling
      try {
        const formattedSession = formatGameSession(gameSession[0]);
        console.log("🎮 Formatted active game:", formattedSession);
        return [formattedSession];
      } catch (formatError) {
        console.error("❌ Error formatting game session:", formatError);
        // Return the raw session if formatting fails
        console.log("⚠️ Returning raw session as fallback");
        return [gameSession[0]];
      }
    } catch (error) {
      console.error("❌ Error getting active game:", error);
      return [];
    }
  }

  // Get game history
  async getGameHistory(principal = null, limit = 10) {
    await this.ensureActor();

    try {
      let principalId = principal;

      // If no principal is provided and we're authenticated, try to get the caller's principal
      if (principal === null && this.isAuthenticated) {
        try {
          principalId = await this.whoami();
          console.log(
            "🔑 Using authenticated user's principal for game history:",
            principalId?.toString() || "Not available"
          );
        } catch (err) {
          console.warn(
            "Unable to get user principal for game history, using provided principal"
          );
        }
      } else if (typeof principal === "string") {
        principalId = Principal.fromText(principal);
      }

      // Ensure we have a valid principal before making the call
      if (!principalId) {
        console.warn(
          "No valid principal for getGameHistory, returning empty array"
        );
        return [];
      }

      const history = await this.actor.getGameHistory(principalId, [limit]);
      return history.map(formatGameResult);
    } catch (error) {
      console.error("❌ Error getting game history:", error);
      return [];
    }
  }

  // Get multiplier for mines configuration
  async getMultiplierForMines(mineCount, revealedCount) {
    await this.ensureActor();

    try {
      const multiplier = await this.actor.getMultiplierForMines(
        mineCount,
        revealedCount
      );
      return multiplier;
    } catch (error) {
      console.error("❌ Error getting multiplier:", error);
      return 1.0;
    }
  }

  // Get player token balance - simplified implementation
  async getPlayerTokenBalance(principal = null, options = {}) {
    await this.ensureActor();

    try {
      let principalId = principal;

      // If no principal provided, try to get the authenticated user's principal
      if (principal === null) {
        // Use our whoami method which centralizes principal resolution
        principalId = await this.whoami();

        if (!principalId && this.isAuthenticated) {
          throw new Error(
            "Could not determine user principal for balance check"
          );
        } else if (!principalId) {
          // For anonymous requests, we need to specify a principal
          principalId = Principal.fromText(this.canisterId);
          console.log(
            "🔑 Using canister ID for anonymous balance check:",
            principalId.toString()
          );
        }
      }
      // Convert string principal to Principal type
      else if (typeof principal === "string") {
        principalId = Principal.fromText(principal);
      }

      // Try to use the anonymous actor for public data first
      let balance;
      try {
        if (this.anonymousActor) {
          balance = await this.anonymousActor.getPlayerTokenBalance(
            principalId
          );
        } else {
          balance = await this.actor.getPlayerTokenBalance(principalId);
        }
      } catch (balanceError) {
        // If anonymous actor fails, try authenticated actor as fallback
        balance = await this.actor.getPlayerTokenBalance(principalId);
      }

      // Return formatted balance if requested
      if (options.formatted) {
        return {
          raw: balance,
          formatted: formatAPTCAmount(balance, options.formatOptions || {}),
        };
      }

      return balance;
    } catch (error) {
      console.error("❌ Error getting player token balance:", error);
      return options.formatted ? { raw: 0, formatted: "0.00 APTC" } : 0;
    }
  }

  // Get required approval amount
  async getRequiredApprovalAmount(betAmount) {
    await this.ensureActor();

    try {
      const amount = await this.actor.getRequiredApprovalAmount(betAmount);
      return amount;
    } catch (error) {
      console.error("❌ Error getting required approval amount:", error);
      return BigInt(betAmount) + BigInt(1000); // Add default fee
    }
  }

  // Get player allowance
  async getPlayerAllowance() {
    if (!this.isAuthenticated) {
      console.log("⚠️ Authentication required for allowance check");
      throw new Error("Authentication required for this operation");
    }

    await this.ensureActor();

    try {
      console.log("🔍 Checking player allowance...");
      const allowance = await this.actor.getPlayerAllowance();
      console.log("💰 Player allowance:", allowance.toString());
      return allowance;
    } catch (error) {
      console.error("❌ Error getting player allowance:", error);
      return 0;
    }
  }

  // Start game - Simplified and optimized implementation
  async startGame(betAmount, mineCount) {
    if (!this.isAuthenticated) {
      throw new Error("Authentication required for this operation");
    }

    // Sanity check for extremely large bet amounts (likely a data conversion issue)
    if (typeof betAmount === "bigint" && betAmount > BigInt(1000000000000000)) {
      console.warn(
        "⚠️ Extremely large bet amount detected, normalizing to standard value:",
        betAmount.toString()
      );
      // If bet amount is unreasonably large, normalize to a reasonable value (25 APTC)
      betAmount = 25;
    }

    await this.ensureActor();

    // Declare variables outside try block so they're accessible in catch block
    let userPrincipal;
    let balanceBefore;
    let normalizedBetAmount;
    let formattedBalanceBefore;

    try {
      console.log(
        `🎮 Starting new game with bet ${formatAPTCAmount(
          betAmount
        )} and ${mineCount} mines...`
      );

      // Get user principal through a simplified approach
      if (this.identity) {
        try {
          userPrincipal = this.identity.getPrincipal();
          console.log(
            "✅ Using principal from provided identity:",
            userPrincipal.toString()
          );
        } catch (identityError) {
          console.warn(
            "⚠️ Error getting principal from identity:",
            identityError
          );
        }
      }

      // Fallback to stored principal if identity method failed
      if (!userPrincipal && this.userPrincipal) {
        userPrincipal = this.userPrincipal;
        console.log(
          "✅ Using stored user principal:",
          userPrincipal.toString()
        );
      }

      // Last resort - try to get from agent
      if (!userPrincipal && this.actor?._agent?.identity?.getPrincipal) {
        try {
          userPrincipal = await this.actor._agent.identity.getPrincipal();
          console.log(
            "✅ Got principal from agent identity:",
            userPrincipal.toString()
          );
        } catch (agentError) {
          console.warn("⚠️ Error getting principal from agent:", agentError);
        }
      }

      if (!userPrincipal) {
        throw new Error(
          "Could not determine user principal. Please reconnect your wallet."
        );
      }

      // Get user balance before starting game with multiple attempts for accuracy
      let balanceAttempts = 0;
      const maxBalanceAttempts = 3;

      while (balanceAttempts < maxBalanceAttempts) {
        try {
          balanceBefore = await this.getPlayerTokenBalance(userPrincipal);
          console.log(
            `💰 Balance check attempt ${
              balanceAttempts + 1
            }: ${formatAPTCAmount(balanceBefore)}`
          );

          // If balance is 0, wait a moment and retry
          if (balanceBefore === 0 || balanceBefore === BigInt(0)) {
            balanceAttempts++;
            if (balanceAttempts < maxBalanceAttempts) {
              console.log("⏳ Balance is 0, retrying in 1 second...");
              await new Promise((resolve) => setTimeout(resolve, 1000));
              continue;
            }
          }
          break;
        } catch (balanceError) {
          balanceAttempts++;
          console.warn(
            `⚠️ Balance check attempt ${balanceAttempts} failed:`,
            balanceError
          );
          if (balanceAttempts >= maxBalanceAttempts) {
            throw new Error(
              "Could not retrieve current balance after multiple attempts"
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      formattedBalanceBefore = formatAPTCAmount(balanceBefore);
      console.log(`💰 Final balance before game: ${formattedBalanceBefore}`);
      console.log(
        `📊 Raw bet amount received: ${betAmount} (${typeof betAmount})`
      );
      console.log(
        `📊 Raw balance received: ${balanceBefore} (${typeof balanceBefore})`
      );

      // Normalize bet amount in a simplified way

      // Handle different bet amount formats with special handling for extreme values
      if (typeof betAmount === "bigint") {
        // If the betAmount is already extremely large (likely already in e8s format)
        if (betAmount > BigInt(1000000000000)) {
          // More than 10,000 APTC
          console.log(
            "⚠️ Detected extremely large BigInt bet amount, treating as raw e8s value"
          );
          normalizedBetAmount = BigInt(25 * Math.pow(10, APTC_DECIMALS)); // Default to 25 APTC
        } else {
          normalizedBetAmount = betAmount;
        }
      } else if (typeof betAmount === "string") {
        // If it looks like e8s format (very large number)
        if (betAmount.length > 8) {
          console.log(
            "⚠️ Detected extremely large string bet amount, treating as raw e8s value"
          );
          normalizedBetAmount = BigInt(25 * Math.pow(10, APTC_DECIMALS)); // Default to 25 APTC
        } else {
          // Convert from human-readable to e8s
          normalizedBetAmount = BigInt(
            Math.floor(Number(betAmount) * Math.pow(10, APTC_DECIMALS))
          );
        }
      } else {
        // Handle number type - convert to e8s format if needed
        // Check for unreasonably large values that shouldn't be multiplied
        if (betAmount > 1000000) {
          // If input is already very large
          console.log(
            "⚠️ Detected extremely large number bet amount, treating as raw e8s value"
          );
          normalizedBetAmount = BigInt(25 * Math.pow(10, APTC_DECIMALS)); // Default to 25 APTC
        } else {
          // Normal case - convert to e8s format
          normalizedBetAmount = BigInt(
            Math.floor(betAmount * Math.pow(10, APTC_DECIMALS))
          );
        }
      }

      // Ensure bet amount is within reasonable limits
      if (normalizedBetAmount > BigInt(100000000000)) {
        // > 1000 APTC
        normalizedBetAmount = BigInt(100000000000); // Cap at 1000 APTC
      } else if (normalizedBetAmount < BigInt(10000000)) {
        // < 0.1 APTC
        normalizedBetAmount = BigInt(10000000); // Minimum 0.1 APTC
      }

      console.log(
        `💰 Normalized bet amount: ${formatAPTCAmount(normalizedBetAmount)}`
      );

      // Check balance is sufficient - ensure we're comparing BigInts properly
      const balanceBeforeBigInt =
        typeof balanceBefore === "bigint"
          ? balanceBefore
          : BigInt(balanceBefore.toString());
      console.log(
        `🧮 Balance comparison: ${balanceBeforeBigInt.toString()} vs ${normalizedBetAmount.toString()}`
      );

      if (balanceBeforeBigInt < normalizedBetAmount) {
        throw new Error(
          `Insufficient balance: You have ${formatAPTCAmount(
            balanceBeforeBigInt
          )} but need ${formatAPTCAmount(normalizedBetAmount)}`
        );
      }

      // Note: Token allowance and approval is handled by useBackendIntegration.js
      // The backend integration will approve tokens before calling this method
      console.log("� Balance check passed, proceeding with game start...");
      console.log(
        "🔐 Skipping allowance check - handled by backend integration"
      );

      // Make the startGame call with enhanced debugging
      console.log("🎮 Making startGame call to backend...");
      console.log("📊 Backend call parameters:", {
        betAmount: normalizedBetAmount.toString(),
        betAmountType: typeof normalizedBetAmount,
        mineCount,
        userPrincipal: userPrincipal.toString(),
        currentBalance: balanceBefore.toString(),
        balanceCheck: `${balanceBefore.toString()} >= ${normalizedBetAmount.toString()} = ${
          balanceBefore >= normalizedBetAmount
        }`,
      });

      const result = await this.actor.startGameWithProxy(
        userPrincipal,
        normalizedBetAmount,
        mineCount
      );

      console.log(
        "📊 Backend startGame result:",
        JSON.stringify(result, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );

      // Process the result - handle both "Err" and "err" cases
      if ("Err" in result || "err" in result) {
        const errorContainer = result.Err || result.err;
        const errorType = Object.keys(errorContainer)[0];
        const errorMsg =
          errorType === "TransferFailed"
            ? errorContainer.TransferFailed
            : errorType;

        console.error("❌ Backend returned error:", errorType, errorContainer);

        // Handle specific error types with better context
        if (errorType === "InsufficientBalance") {
          // Add current balance information to error
          const currentBalance = await this.getPlayerTokenBalance(
            userPrincipal
          ).catch(() => BigInt(0));
          const balanceFormatted = formatAPTCAmount(currentBalance);
          const betFormatted = formatAPTCAmount(normalizedBetAmount);

          console.error("💰 Balance Details:", {
            currentBalance: currentBalance.toString(),
            requiredAmount: normalizedBetAmount.toString(),
            difference: (currentBalance - normalizedBetAmount).toString(),
            currentBalanceFormatted: balanceFormatted,
            requiredAmountFormatted: betFormatted,
          });

          throw new Error(
            `Insufficient balance: You have ${balanceFormatted} but need ${betFormatted}. Please ensure your wallet has enough tokens and try again.`
          );
        } else if (errorType === "InvalidBetAmount") {
          throw new Error("Invalid bet amount. Please try a different amount.");
        } else if (errorType === "InsufficientAllowance") {
          throw new Error(
            "Token approval is insufficient. Please approve tokens first."
          );
        } else if (errorType === "NotAuthorized") {
          throw new Error(
            "Not authorized. Please reconnect your wallet and try again."
          );
        } else {
          throw new Error(`Game start failed: ${errorMsg}`);
        }
      }

      // Format the successful result - handle both "Ok" and "ok" cases
      let gameSession;
      if ("Ok" in result) {
        gameSession = formatGameSession(result.Ok);
      } else if ("ok" in result) {
        gameSession = formatGameSession(result.ok);
      } else {
        gameSession = formatGameSession(result);
      }

      // Add balance info to game session
      let balanceAfter;
      try {
        balanceAfter = await this.getPlayerTokenBalance(userPrincipal);
        const formattedBalanceAfter = formatAPTCAmount(balanceAfter);
        console.log(
          `💰 Balance update: ${formattedBalanceBefore} → ${formattedBalanceAfter}`
        );

        // Add balance info to game session
        gameSession.balance_before = balanceBefore.toString();
        gameSession.formatted_balance_before = formattedBalanceBefore;
        gameSession.balance_after = balanceAfter.toString();
        gameSession.formatted_balance_after = formattedBalanceAfter;

        // Log the successful deduction
        const deducted = balanceBefore - balanceAfter;
        console.log(
          `✅ Successfully deducted ${formatAPTCAmount(deducted)} from balance`
        );
      } catch (balanceError) {
        console.warn("⚠️ Could not get updated balance:", balanceError);
        // Add fallback balance info
        gameSession.balance_before = balanceBefore.toString();
        gameSession.formatted_balance_before = formattedBalanceBefore;
      }

      // Add transaction success metadata
      gameSession.transaction_success = true;
      gameSession.notification = {
        title: "Bet Placed",
        message: `${gameSession.formatted_bet_amount} bet placed successfully`,
        type: "info",
        icon: "🎮",
      };

      return gameSession;
    } catch (error) {
      console.error("❌ Error starting game:", error);

      // Create a more user-friendly error message
      let userMessage = error.message;

      // Check for common error cases and provide more helpful messages
      if (error.message.includes("Insufficient balance")) {
        // Use the variables that are now accessible from outer scope
        const actualBetAmount = normalizedBetAmount || betAmount;
        const actualBalance = balanceBefore || 0;

        userMessage = `Insufficient balance. You have ${formatAPTCAmount(
          actualBalance
        )} but need ${formatAPTCAmount(
          actualBetAmount
        )}. Please ensure your wallet has enough tokens and try again.`;
        console.log("💰 Balance error details:", {
          userBalance: formatAPTCAmount(actualBalance),
          betAmount: formatAPTCAmount(actualBetAmount),
          rawUserBalance: actualBalance.toString(),
          rawBetAmount: actualBetAmount.toString(),
          normalizedBetAmountDefined: !!normalizedBetAmount,
          balanceBeforeDefined: !!balanceBefore,
          originalBetAmount: betAmount,
          originalBetAmountType: typeof betAmount,
        });
      }

      // Add transaction failure metadata
      const errorResult = {
        transaction_success: false,
        transaction_type: "BET_FAILED",
        error: userMessage,
        notification: {
          title: "Bet Failed",
          message: userMessage,
          type: "error",
          icon: "⚠️",
        },
      };

      throw Object.assign(error, errorResult);
    }
  }

  // Reveal cell
  async revealCell(cellIndex) {
    if (!this.isAuthenticated) {
      throw new Error("Authentication required for this operation");
    }

    await this.ensureActor();

    try {
      console.log(
        `🎲 Mines Integration: Revealing cell ${cellIndex} (${typeof cellIndex})`
      );

      // Ensure cellIndex is a number/Nat as expected by the backend
      let cellIndexNat = cellIndex;

      // Convert to number if BigInt or string
      if (typeof cellIndex === "bigint") {
        cellIndexNat = Number(cellIndex);
        console.log(
          `🔄 Converted cell index from BigInt to number: ${cellIndexNat}`
        );
      } else if (typeof cellIndex === "string") {
        cellIndexNat = parseInt(cellIndex, 10);
        console.log(
          `🔄 Converted cell index from string to number: ${cellIndexNat}`
        );
      }

      // Validate the cell index
      if (isNaN(cellIndexNat) || cellIndexNat < 0 || cellIndexNat >= 25) {
        throw new Error(
          `Invalid cell index: ${cellIndex}. Must be between 0 and 24.`
        );
      }

      console.log(
        `📊 Final cell index to send to backend: ${cellIndexNat} (${typeof cellIndexNat})`
      );

      // Call the actor with proper number
      const result = await this.actor.revealCell(cellIndexNat);
      console.log(
        `📊 Raw reveal result:`,
        JSON.stringify(result, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );

      // Check for error response (handle both Err and err variants)
      if (result && (result.Err || result.err)) {
        const errorObj = result.Err || result.err;
        const errorType = Object.keys(errorObj)[0];
        const errorMsg =
          errorType === "TransferFailed" ? errorObj.TransferFailed : errorType;
        console.error(`❌ Backend reveal error: ${errorMsg}`, errorObj);
        throw new Error(`Reveal failed: ${errorMsg}`);
      }

      // Handle the case when result is valid but Ok/ok might be null or undefined
      if (!result || (!result.Ok && !result.ok)) {
        console.error("❌ Invalid response from backend:", result);
        // Get the current active game as a fallback
        console.log("🔍 Attempting to fetch current game state as fallback");
        const activeGame = await this.getActiveGame(null);
        if (activeGame && activeGame.length > 0) {
          console.log("✅ Retrieved fallback game state");
          return activeGame[0];
        } else {
          throw new Error(
            "Unable to reveal cell: Invalid response from backend"
          );
        }
      }

      const formattedResult = formatGameSession(result.Ok || result.ok);
      console.log(`✅ Formatted reveal result:`, formattedResult);
      return formattedResult;
    } catch (error) {
      console.error("❌ Error revealing cell:", error);
      throw error;
    }
  }

  // Cash out
  async cashOut() {
    if (!this.isAuthenticated) {
      throw new Error("Authentication required for this operation");
    }

    await this.ensureActor();

    try {
      console.log("💰 Processing cashout request...");

      // Get active game first to calculate potential payout for notifications
      const activeGameBefore = await this.actor.getActiveGame(null);
      let potentialPayout = null;

      if (activeGameBefore[0]) {
        const formattedGame = formatGameSession(activeGameBefore[0]);
        potentialPayout = formattedGame.formatted_potential_win;
        console.log(
          `🎮 Found active game with potential win of ${potentialPayout}`
        );
      }

      // Execute the cashout
      const result = await this.actor.cashOut();

      if ("Err" in result) {
        const errorType = Object.keys(result.Err)[0];
        const errorMsg =
          errorType === "TransferFailed"
            ? result.Err.TransferFailed
            : errorType;
        throw new Error(`Cash out failed: ${errorMsg}`);
      }

      const gameResult = formatGameResult(result.Ok);

      // Log successful withdrawal
      console.log(
        `✅ Successfully cashed out: ${gameResult.formatted_win_amount}`
      );
      console.log(
        `💸 Withdrawal processed: ${gameResult.is_win ? "WIN" : "BREAK_EVEN"}`
      );

      // Add transaction success metadata
      gameResult.transaction_success = true;
      gameResult.transaction_type = "WITHDRAWAL";
      gameResult.notification = {
        title: "Successful Withdrawal",
        message: `You've successfully withdrawn ${gameResult.formatted_win_amount}`,
        type: "success",
        icon: "💸",
      };

      return gameResult;
    } catch (error) {
      console.error("❌ Error cashing out:", error);

      // Add transaction failure metadata
      const errorResult = {
        transaction_success: false,
        transaction_type: "WITHDRAWAL_FAILED",
        error: error.message,
        notification: {
          title: "Cashout Failed",
          message: error.message,
          type: "error",
          icon: "⚠️",
        },
      };

      throw Object.assign(error, errorResult);
    }
  }

  // Check if game is active
  async isGameActive() {
    await this.ensureActor();

    try {
      const active = await this.actor.isGameActive();
      return active;
    } catch (error) {
      console.error("❌ Error checking if game is active:", error);
      return false;
    }
  }

  // Get bet limits
  async getBetLimits() {
    await this.ensureActor();

    try {
      const limits = await this.actor.getBetLimits();
      return limits;
    } catch (error) {
      console.error("❌ Error getting bet limits:", error);
      return { minBet: 10_000_000, maxBet: 1_000_000_000_000 };
    }
  }

  // Get game canister principal
  async getGameCanisterPrincipal() {
    await this.ensureActor();

    try {
      const principal = await this.actor.getGameCanisterPrincipal();
      return principal;
    } catch (error) {
      console.error("❌ Error getting game canister principal:", error);
      return this.canisterId;
    }
  }

  // Get the caller's principal (who am I) - simplified implementation
  async whoami() {
    await this.ensureActor();

    try {
      // First check stored principal from initialization
      if (this.userPrincipal) {
        return this.userPrincipal;
      }

      // Try to get principal from identity if available
      if (this.identity && typeof this.identity.getPrincipal === "function") {
        try {
          const principal = this.identity.getPrincipal();
          console.log("🔑 Got principal from identity:", principal.toString());
          return principal;
        } catch (identityError) {
          console.warn(
            "⚠️ Error getting principal from identity:",
            identityError
          );
        }
      }

      // Try to get principal from agent
      if (this.actor?._agent?.identity?.getPrincipal) {
        try {
          const principal = await this.actor._agent.identity.getPrincipal();
          console.log(
            "🔑 Got principal from agent identity:",
            principal.toString()
          );
          return principal;
        } catch (agentError) {
          console.warn("⚠️ Error getting principal from agent:", agentError);
        }
      }

      // For authenticated users, try the backend method if available
      if (this.isAuthenticated && typeof this.actor.whoami === "function") {
        try {
          const principal = await this.actor.whoami();
          if (principal) {
            console.log("🔑 Got principal from backend:", principal.toString());
            return principal;
          }
        } catch (backendError) {
          console.warn(
            "⚠️ Error getting principal from backend:",
            backendError
          );
        }
      }

      console.log("⚠️ Could not determine user principal");
      return null;
    } catch (error) {
      console.error("❌ Error getting user principal:", error);
      return null;
    }
  }

  // Get user stats
  async getUserStats(principal = null) {
    await this.ensureActor();

    try {
      let principalId = principal;

      // If no principal is provided and we're authenticated, try to get the caller's principal
      if (principal === null && this.isAuthenticated) {
        try {
          principalId = await this.whoami();
          console.log(
            "🔑 Using authenticated user's principal for stats:",
            principalId?.toString() || "Not available"
          );
        } catch (err) {
          console.warn(
            "Unable to get user principal for stats, using provided principal"
          );
        }
      } else if (typeof principal === "string") {
        principalId = Principal.fromText(principal);
      }

      // Ensure we have a valid principal before making the call
      if (!principalId) {
        console.warn("No valid principal for getUserStats, returning null");
        return null;
      }

      const stats = await this.actor.getUserStats(principalId);
      return stats[0] || null;
    } catch (error) {
      console.error("❌ Error getting user stats:", error);
      return null;
    }
  }

  // Get game stats
  async getGameStats() {
    await this.ensureActor();

    try {
      const stats = await this.actor.getGameStats();
      return stats;
    } catch (error) {
      console.error("❌ Error getting game stats:", error);
      return {
        totalGames: 0,
        totalVolume: 0,
        houseProfits: 0,
        activeGamesCount: 0,
      };
    }
  }
}

// Export default instance
export default MinesClient;
