// Wheel Game Integration for ICP Canister
import { Principal } from "@dfinity/principal";
import { Actor } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/wheel-game/wheel-game.did.js";
import { getCachedAgent, CANISTER_IDS } from "./backend-integration";

// Import token formatting utilities from mines-integration.js
import { formatAPTCAmount, parseAPTCAmount } from "./mines-integration";

// Format wheel game result
const formatGameResult = (result) => {
  if (!result) return null;

  const betAmount = result.betAmount.toString();
  const payout = result.payout.toString();

  // Calculate profit/loss
  const profit = BigInt(payout) - BigInt(betAmount);

  // Determine if this was a win or loss
  let transactionType = profit > 0 ? "CREDIT" : "DEBIT";
  let resultStatus = profit > 0 ? "WIN" : "LOSS";

  // Format amounts for display
  const formattedBetAmount = formatAPTCAmount(betAmount);
  const formattedPayout = formatAPTCAmount(payout);
  const formattedProfit = formatAPTCAmount(profit);

  // Create user-friendly date string
  const timestamp = Number(result.timestamp);
  const date = new Date(timestamp / 1000000);
  const formattedDate = date.toLocaleString();

  return {
    game_id: result.id,
    player: result.player.toString(),
    bet_amount: betAmount,
    formatted_bet_amount: formattedBetAmount,
    payout: payout,
    formatted_payout: formattedPayout,
    profit: profit.toString(),
    formatted_profit: formattedProfit,
    transaction_type: transactionType,
    result_status: resultStatus,
    risk_level: result.riskLevel,
    segment_count: result.segmentCount,
    position: result.result.position,
    multiplier: result.result.multiplier,
    timestamp: result.timestamp,
    formatted_timestamp: formattedDate,
    is_win: profit > 0,
  };
};

// Main Wheel client class that adapts the canister interface to the frontend
export class WheelClient {
  constructor(canisterId = CANISTER_IDS.WHEEL_GAME) {
    this.canisterId = canisterId;
    this.actor = null;
    this.isAuthenticated = false;
  }

  // Initialize the actor with an optional identity
  async init(identity = null) {
    try {
      console.log("🎮 Initializing Wheel client with identity:", !!identity);
      const agent = await getCachedAgent(
        identity,
        `wheel-${identity ? "auth" : "anon"}`
      );
      this.actor = Actor.createActor(idlFactory, {
        agent,
        canisterId: this.canisterId,
      });
      this.isAuthenticated = !!identity;
      console.log(
        `📊 Wheel client initialized (${
          this.isAuthenticated ? "authenticated" : "anonymous"
        }) with canister: ${this.canisterId}`
      );
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize Wheel client:", error);
      return false;
    }
  }

  // Check if an actor exists, initialize if not
  async ensureActor(identity = null) {
    if (!this.actor) {
      await this.init(identity);
    }
    if (!this.actor) {
      throw new Error("Wheel client not initialized");
    }
  }

  // Get the caller's principal (who am I)
  async whoami() {
    await this.ensureActor();

    try {
      // This function assumes there's a whoami method in the backend
      // If not, it will return the authenticated identity's principal
      if (this.isAuthenticated) {
        return Principal.fromText(this.actor._principal.toString());
      }
      return null;
    } catch (error) {
      console.error("❌ Error getting caller's principal:", error);
      return null;
    }
  }

  // Get player token balance
  async getPlayerTokenBalance(principal = null, options = {}) {
    await this.ensureActor();

    try {
      let principalId = principal;
      // Only attempt to use the principal if it's not null
      if (principal === null) {
        if (this.isAuthenticated) {
          // If the client is authenticated, use the caller's principal
          try {
            // Try to get the caller's principal directly from the authenticated actor
            const callerResult = await this.whoami();
            if (callerResult) {
              principalId = callerResult;
              console.log(
                "🔑 Using authenticated caller's principal:",
                principalId.toString()
              );
            } else {
              throw new Error("Could not determine caller's principal");
            }
          } catch (err) {
            console.warn(
              "Unable to get caller's principal, falling back to canister ID"
            );
            try {
              principalId = await this.actor.getGameCanisterPrincipal();
              console.log(
                "🔑 Using canister ID as principal:",
                principalId.toString()
              );
            } catch (err2) {
              console.warn(
                "Unable to get canister ID, using default principal"
              );
              // Provide a fallback to avoid null principal errors
              principalId = Principal.fromText(this.canisterId);
            }
          }
        } else {
          // For anonymous requests, use the canister ID as the principal
          principalId = Principal.fromText(this.canisterId);
          console.log(
            "🔑 Using canister ID for anonymous balance check:",
            principalId.toString()
          );
        }
      } else if (typeof principal === "string") {
        principalId = Principal.fromText(principal);
      }

      // Check if principalId is valid before proceeding
      if (!principalId) {
        throw new Error(
          "Could not determine a valid principal for balance check"
        );
      }

      const balance = await this.actor.getPlayerTokenBalance(principalId);

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

  // Spin the wheel
  async spinWheel(betAmount, riskLevel, segmentCount = 12) {
    if (!this.isAuthenticated) {
      throw new Error("Authentication required for this operation");
    }

    await this.ensureActor();

    try {
      console.log(
        `🎮 Spinning wheel with bet ${formatAPTCAmount(
          betAmount
        )}, risk level ${riskLevel}, and ${segmentCount} segments...`
      );

      // Get the user's principal first
      let userPrincipal;
      try {
        userPrincipal = await this.whoami();
        console.log(
          "🔑 User principal for balance check:",
          userPrincipal?.toString() || "Not available"
        );
      } catch (principalError) {
        console.warn(
          "Could not get user principal, continuing with default",
          principalError
        );
      }

      // Get balance before spinning wheel
      let balanceBefore, formattedBalanceBefore;
      try {
        balanceBefore = await this.getPlayerTokenBalance(userPrincipal);
        formattedBalanceBefore = formatAPTCAmount(balanceBefore);
        console.log(`💰 Initial balance: ${formattedBalanceBefore}`);
      } catch (balanceError) {
        console.warn(
          "Unable to get initial balance, continuing with wheel spin",
          balanceError
        );
        balanceBefore = 0;
        formattedBalanceBefore = "0.00 APTC";
      }

      // Prepare spin request
      // Make sure betAmount is in the correct format
      // It should be a BigInt for the backend call
      let normalizedBetAmount;

      // If betAmount is a string that looks like a large number with many zeros
      // it might already be in e8s format
      if (typeof betAmount === "string" && betAmount.length > 10) {
        console.log(
          "📊 Bet amount appears to be in e8s format already:",
          betAmount
        );
        normalizedBetAmount = BigInt(betAmount);
      } else if (typeof betAmount === "bigint") {
        console.log("📊 Bet amount is already a BigInt:", betAmount.toString());
        normalizedBetAmount = betAmount;
      } else {
        // Convert from number or string to BigInt in e8s format
        // Check if the value needs conversion
        if (betAmount < 100000000) {
          // Less than 100M, likely not in e8s
          console.log(
            `📊 Converting bet amount from ${betAmount} to e8s format`
          );
          const betAmountNumber = Number(betAmount);
          normalizedBetAmount = BigInt(
            Math.floor(betAmountNumber * Math.pow(10, 8))
          ); // 8 decimals for APTC token
        } else {
          // Already in e8s format
          normalizedBetAmount = BigInt(betAmount);
        }
      }

      console.log(
        `💰 Spinning wheel with bet amount: ${normalizedBetAmount.toString()} e8s (${formatAPTCAmount(
          normalizedBetAmount
        )}) and risk level: ${riskLevel}`
      );

      // Prepare spin request with normalized bet amount
      const request = {
        betAmount: normalizedBetAmount,
        riskLevel: riskLevel,
        segmentCount: segmentCount,
      };

      // Execute wheel spin
      const result = await this.actor.spinWheel(request);

      if ("Err" in result) {
        throw new Error(`Wheel spin failed: ${result.Err}`);
      }

      // Format game result
      const gameResult = formatGameResult(result.Ok);

      // Get balance after spinning wheel
      let balanceAfter = balanceBefore; // Default to previous balance
      let formattedBalanceAfter = formattedBalanceBefore;

      if (balanceBefore !== undefined) {
        try {
          // Use the same principal as before for consistency
          balanceAfter = await this.getPlayerTokenBalance(userPrincipal);
          formattedBalanceAfter = formatAPTCAmount(balanceAfter);
        } catch (balanceError) {
          console.warn(
            "Unable to get updated balance after wheel spin",
            balanceError
          );
        }
      }

      // Log successful spin
      console.log(`✅ Wheel spun with result: ${gameResult.result_status}`);
      console.log(
        `🎯 Position: ${gameResult.position}, Multiplier: ${gameResult.multiplier}x`
      );
      console.log(
        `💰 Balance update: ${formattedBalanceBefore} → ${formattedBalanceAfter}`
      );

      // Add transaction success metadata
      gameResult.transaction_success = true;
      gameResult.balance_before = balanceBefore?.toString() || "0";
      gameResult.formatted_balance_before =
        formattedBalanceBefore || "0.00 APTC";
      gameResult.balance_after = balanceAfter?.toString() || "0";
      gameResult.formatted_balance_after = formattedBalanceAfter || "0.00 APTC";
      gameResult.notification = {
        title: gameResult.is_win ? "You Won!" : "Better Luck Next Time",
        message: gameResult.is_win
          ? `You won ${gameResult.formatted_profit}!`
          : `You lost ${gameResult.formatted_bet_amount}.`,
        type: gameResult.is_win ? "success" : "info",
        icon: gameResult.is_win ? "🎉" : "🎮",
      };

      return gameResult;
    } catch (error) {
      console.error("❌ Error spinning wheel:", error);

      // Add transaction failure metadata
      const errorResult = {
        transaction_success: false,
        transaction_type: "SPIN_FAILED",
        error: error.message,
        notification: {
          title: "Wheel Spin Failed",
          message: error.message,
          type: "error",
          icon: "⚠️",
        },
      };

      throw Object.assign(error, errorResult);
    }
  }

  // Get wheel segments for a risk level
  async getWheelSegments(riskLevel, segmentCount = 12) {
    await this.ensureActor();

    try {
      const segments = await this.actor.getWheelSegments(
        riskLevel,
        segmentCount
      );
      return segments;
    } catch (error) {
      console.error("❌ Error getting wheel segments:", error);
      return [];
    }
  }

  // Get player's game history
  async getPlayerHistory(principal = null) {
    await this.ensureActor();

    try {
      let principalId = principal;
      if (typeof principal === "string") {
        principalId = Principal.fromText(principal);
      } else if (principal === null && this.isAuthenticated) {
        // Try to use the authenticated user's principal
        try {
          principalId = await this.whoami();
        } catch (err) {
          console.warn(
            "Unable to get user principal for history, continuing with null"
          );
        }
      }

      const history = await this.actor.getPlayerHistory(principalId);
      return history.map(formatGameResult);
    } catch (error) {
      console.error("❌ Error getting player history:", error);
      return [];
    }
  }

  // Get recent games for leaderboard/stats
  async getRecentGames(count = 10) {
    await this.ensureActor();

    try {
      const games = await this.actor.getRecentGames(count);
      return games.map(formatGameResult);
    } catch (error) {
      console.error("❌ Error getting recent games:", error);
      return [];
    }
  }

  // Get game stats
  async getGameStats() {
    await this.ensureActor();

    try {
      const stats = await this.actor.getGameStats();
      return {
        totalGames: stats.totalGames,
        totalVolume: stats.totalVolumeBet,
        houseProfits: stats.totalVolumeBet - stats.totalPayout,
        payout: stats.totalPayout,
      };
    } catch (error) {
      console.error("❌ Error getting game stats:", error);
      return {
        totalGames: 0,
        totalVolume: 0,
        houseProfits: 0,
        payout: 0,
      };
    }
  }
}

// Export default instance
export default WheelClient;
