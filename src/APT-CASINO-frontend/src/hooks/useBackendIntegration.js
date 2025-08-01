// Backend Integration Hook
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNFID } from "../providers/NFIDProvider";
import {
  createAPTCTokenActor,
  createRouletteActor,
  createMinesActor,
  parseTokenAmount,
  formatTokenAmount,
  createRouletteBet,
  CANISTER_IDS,
  getCachedAgent,
  recreateAgentOnError,
  getFallbackAgent,
  getNetworkHost,
  getAgentCache,
} from "../config/backend-integration";
import { Principal } from "@dfinity/principal";
import { HttpAgent, Actor } from "@dfinity/agent";
import { approveICRCToken } from "../utils/tokenApproval";
import { idlFactory as tokenIdl } from "../../../declarations/APTC-token/APTC-token.did.js";

// Constants for mines game
const MINES_CONSTANTS = {
  MIN_MINES: 1,
  MAX_MINES: 24,
  BOARD_SIZE: 25,
};

// Enhanced error detection for certificate and delegation issues
const isCertificateError = (error) => {
  if (!error) return false;

  const errorMessage = (
    error?.message ||
    error?.toString() ||
    ""
  ).toLowerCase();

  // Check for common certificate and authentication-related errors
  return (
    errorMessage.includes("delegation") ||
    errorMessage.includes("certificate") ||
    errorMessage.includes("invalid canister signature") ||
    errorMessage.includes("threshold signature") ||
    errorMessage.includes("signature could not be verified") ||
    errorMessage.includes("certificate verification failed") ||
    errorMessage.includes("verification") ||
    errorMessage.includes("bls") ||
    errorMessage.includes("public key") ||
    errorMessage.includes("thresblsl2_381") ||
    errorMessage.includes("thresblsl2_381 signature could not be verified") ||
    errorMessage.includes("iccanistersignature") ||
    errorMessage.includes("gateway returned an error") ||
    errorMessage.includes("400 bad request") ||
    errorMessage.includes("invalid delegation") ||
    errorMessage.includes("invalid combined threshold signature") ||
    errorMessage.includes("authentication") ||
    errorMessage.includes("auth") ||
    errorMessage.includes("identity") ||
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("permission") ||
    errorMessage.includes("access denied") ||
    errorMessage.includes("expired") ||
    errorMessage.includes("reject") ||
    errorMessage.includes("not allowed") ||
    errorMessage.includes("principal") ||
    (error.name && error.name.includes("Agent"))
  );
};

// Utility function to detect agent configuration errors
const isAgentConfigError = (error) => {
  const errorMessage = (
    error?.message ||
    error?.toString() ||
    ""
  ).toLowerCase();
  return (
    errorMessage.includes("400 bad request") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("network") ||
    errorMessage.includes("agent") ||
    errorMessage.includes("unable to fetch root key") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("gateway returned an error") ||
    errorMessage.includes("certificate verification failed") ||
    errorMessage.includes("invalid delegation") ||
    errorMessage.includes("bls") ||
    errorMessage.includes("thresblsl2_381") ||
    errorMessage.includes("signature could not be verified") ||
    errorMessage.includes("iccanistersignature") ||
    errorMessage.includes("validation") ||
    errorMessage.includes("signature") ||
    errorMessage.includes("code: 400") ||
    errorMessage.includes("agentqueryerror")
  );
};

// Utility function to detect delegation expiry errors
const isDelegationExpiryError = (error) => {
  // Check the error object and all nested error messages
  const errorMessages = [
    error?.message,
    error?.toString(),
    error?.error?.message,
    error?.error?.toString(),
    error?.cause?.message,
    error?.cause?.toString(),
    JSON.stringify(error),
  ].filter(Boolean);

  // Check all possible error message variations
  const expiryPatterns = [
    "invalid delegation expiry",
    "delegation has expired",
    "specified sender delegation has expired",
    "delegation expiry",
    "delegation expired",
    "provided expiry",
    "local replica time",
    "delegation certificate has expired",
    "delegation certificate is expired",
    "certificate has expired",
    "certificate is expired",
  ];

  // Check if any error message contains any expiry pattern
  return errorMessages.some((msg) => {
    if (!msg || typeof msg !== "string") return false;
    const lowerMsg = msg.toLowerCase();
    return (
      expiryPatterns.some((pattern) =>
        lowerMsg.includes(pattern.toLowerCase())
      ) ||
      // Also check for the specific pattern from your logs
      (lowerMsg.includes("expiry") && lowerMsg.includes("delegation")) ||
      (lowerMsg.includes("provided expiry") &&
        lowerMsg.includes("local replica time"))
    );
  });
};

// Enhanced error handling with certificate retry logic and delegation fallback
const handleCertificateError = async (error, identity, retryCallback) => {
  if (isCertificateError(error)) {
    console.log(
      "🔄 Certificate error detected, attempting delegation fallback...",
      error.message
    );

    try {
      // For ThresBls12_381 signature issues, which are common in local development
      // with token approval operations
      if (error.message && error.message.includes("ThresBls12_381")) {
        console.log(
          "🔍 ThresBls12_381 signature verification issue detected, applying specialized fix..."
        );

        // Clear all local storage related to delegation and certificates
        if (typeof window !== "undefined" && window.localStorage) {
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

        // Force agent recreation with fresh root key
        const newAgent = new HttpAgent({
          host: "http://127.0.0.1:4943",
          identity: identity,
          disableOriginalPrincipalValidation: true,
        });

        // Always fetch root key for ThresBls12_381 issues
        await newAgent.fetchRootKey().catch((e) => {
          console.warn("⚠️ Root key fetch warning during recovery:", e);
        });

        console.log(
          "🔄 Created fresh agent with new root key for ThresBls12_381 signature issue"
        );

        // Store the agent to replace the old one
        if (identity) {
          const agentCache = getAgentCache();
          agentCache.set(identity.getPrincipal().toString(), newAgent);
        }

        // If we have a retry callback, retry immediately with the new agent
        if (retryCallback) {
          console.log(
            "🔄 Retrying operation with fresh agent after ThresBls12_381 fix..."
          );
          return await retryCallback();
        }
      }

      // For other delegation issues, provide clear error message
      if (error.message && error.message.includes("delegation")) {
        console.log(
          "🔄 Delegation certificate corrupted, trying fallback agent..."
        );

        // Use fallback anonymous agent for local development
        const fallbackAgent = await getFallbackAgent(null);

        // This won't work for authenticated operations, but will show user a clearer error
        console.log(
          "⚠️ Using anonymous fallback - authenticated operations will fail gracefully"
        );

        // Enhanced error message for delegation issues
        return new Error(
          "🔐 NFID Wallet Connection Issue\n\n" +
            "Your wallet's delegation certificate has expired or become invalid.\n\n" +
            "💡 Quick Fix:\n" +
            "1. Open browser developer tools (F12)\n" +
            "2. Go to Application → Storage → Local Storage\n" +
            "3. Clear data for localhost:5173\n" +
            "4. Refresh page and reconnect your NFID wallet\n\n" +
            "Alternative: Disconnect wallet, wait 5 seconds, then reconnect."
        );
      }

      // Try to recreate the agent and retry the operation
      await recreateAgentOnError(error, identity);

      if (retryCallback) {
        console.log("🔄 Retrying operation with new agent...");
        return await retryCallback();
      }

      // If no retry callback, return a generic certificate error
      return new Error(
        "🔐 Authentication certificate error. Please reconnect your wallet and try again."
      );
    } catch (retryError) {
      console.error("❌ Failed to recreate agent:", retryError);
      return new Error(
        "🔐 Authentication session has expired. Please disconnect and reconnect your NFID wallet to continue."
      );
    }
  }

  if (isAgentConfigError(error)) {
    return new Error(
      "🌐 Connection issue with Internet Computer network. Please check your connection and try again."
    );
  }

  // For any other errors, ensure we have a meaningful message
  if (!error.message || error.message.trim() === "") {
    return new Error("An unexpected error occurred. Please try again.");
  }

  return error;
};

// Enhanced retry wrapper with certificate error handling
const retryActorCall = async (
  actorCall,
  identity = null,
  maxRetries = 3,
  delay = 1000
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await actorCall();
    } catch (error) {
      console.warn(`Actor call attempt ${i + 1} failed:`, error.message);

      if (i === maxRetries - 1) {
        // On final attempt, try certificate recreation if it's a certificate error
        const handledError = await handleCertificateError(
          error,
          identity,
          i === maxRetries - 1 ? null : actorCall
        );
        throw handledError instanceof Error ? handledError : error;
      }

      // Try certificate recreation on certificate errors
      if (isCertificateError(error)) {
        try {
          console.log(
            `🔄 Certificate error on attempt ${i + 1}, recreating agent...`
          );
          await recreateAgentOnError(error, identity);
          // Continue to next iteration to retry with new agent
        } catch (recreateError) {
          console.error("❌ Failed to recreate agent:", recreateError);
          // If we can't recreate, continue with normal retry logic
        }
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

const useBackendIntegration = () => {
  const { identity, isConnected, principal } = useNFID();

  // Actors state
  const [actors, setActors] = useState({
    aptc: null,
    roulette: null,
    mines: null,
  });

  // Loading states
  const [loading, setLoading] = useState({
    actors: true, // Start as true since actors need to be initialized
    balance: false,
    roulette: false,
    mines: false,
  });

  // Data state
  const [balance, setBalance] = useState(BigInt(0));
  const [tokenInfo, setTokenInfo] = useState({
    name: "",
    symbol: "",
    decimals: 8,
    fee: BigInt(0),
  });

  // Error state
  const [error, setError] = useState(null);

  // Initialize actors using hybrid approach - anonymous for queries, authenticated on-demand for transactions
  const initializeActors = useCallback(async () => {
    setLoading((prev) => ({ ...prev, actors: true }));
    setError(null);

    try {
      console.log("🔧 Initializing backend actors (anonymous mode)...");

      // Always use anonymous actors for reliable queries with enhanced retry logic
      const [aptcActor, rouletteActor, minesActor] = await retryActorCall(
        async () => {
          // Use cached agent for better performance and stability
          const agent = await getCachedAgent();
          return await Promise.all([
            createAPTCTokenActor(null, agent), // Anonymous with cached agent
            createRouletteActor(null, agent), // Anonymous with cached agent
            createMinesActor(null, agent), // Anonymous with cached agent
          ]);
        },
        null, // No identity for anonymous calls
        3, // Max retries
        1000 // Base delay
      );

      console.log("✅ Backend actors initialized successfully");

      setActors({
        aptc: aptcActor,
        roulette: rouletteActor,
        mines: minesActor,
      });

      // Fetch token info using anonymous actor (reliable) with enhanced retry
      console.log("📡 Fetching token information...");
      const [name, symbol, decimals, fee] = await retryActorCall(
        async () =>
          await Promise.all([
            aptcActor.icrc1_name(),
            aptcActor.icrc1_symbol(),
            aptcActor.icrc1_decimals(),
            aptcActor.icrc1_fee(),
          ]),
        null, // No identity for anonymous calls
        3, // Max retries
        1000 // Base delay
      );

      // Ensure fee is converted to BigInt
      const feeBigInt = typeof fee === "bigint" ? fee : BigInt(fee);
      setTokenInfo({ name, symbol, decimals, fee: feeBigInt });
      console.log(
        `✅ Token info loaded: ${name} (${symbol}), ${decimals} decimals, fee: ${feeBigInt.toString()}`
      );
    } catch (err) {
      console.error("❌ Failed to initialize actors:", err);
      const friendlyError = await handleCertificateError(err, null);
      setError(
        `Failed to connect to backend: ${friendlyError.message || err.message}`
      );
    } finally {
      setLoading((prev) => ({ ...prev, actors: false }));
    }
  }, []);

  // Create authenticated actors on-demand for transactions with certificate error handling
  const createAuthenticatedActors = useCallback(async () => {
    if (!isConnected || !identity || !principal) {
      throw new Error("User not authenticated");
    }

    // Create a fresh agent for each transaction to avoid stale certificates
    return await retryActorCall(
      async () => {
        console.log("🔐 Creating authenticated actors for transaction...");

        // Force a fresh agent with the user's identity (avoid caching issues)
        const agent = await getCachedAgent(
          identity,
          `user-${principal.toString()}-${Date.now()}`,
          true // Force fresh agent creation
        );

        // Explicitly fetch root key for local development
        if (
          window.location.hostname.includes("localhost") ||
          window.location.hostname.includes("127.0.0.1")
        ) {
          try {
            await agent.fetchRootKey();
            console.log("✅ Root key refreshed for authenticated call");
          } catch (e) {
            console.warn("⚠️ Failed to refresh root key:", e);
          }
        }

        const [authAptcActor, authRouletteActor, authMinesActor] =
          await Promise.all([
            createAPTCTokenActor(identity, agent),
            createRouletteActor(identity, agent),
            createMinesActor(identity, agent),
          ]);

        console.log("✅ Authenticated actors created successfully");
        return {
          authAptcActor,
          authRouletteActor,
          authMinesActor,
        };
      },
      identity, // Pass identity for certificate error handling
      3, // Increased retries for authentication issues
      2000 // Longer delay to handle network latency
    );
  }, [isConnected, identity, principal]);

  // Fetch user balance using anonymous actor (reliable)
  const fetchBalance = useCallback(async () => {
    if (!actors.aptc || !principal) return;

    setLoading((prev) => ({ ...prev, balance: true }));
    setError(null);

    try {
      console.log(`💰 Fetching balance for principal: ${principal.toString()}`);

      const account = {
        owner: Principal.fromText(principal),
        subaccount: [],
      };

      const balanceResult = await retryActorCall(
        async () => await actors.aptc.icrc1_balance_of(account),
        null, // No identity for anonymous calls
        3, // Max retries
        1000 // Base delay
      );

      setBalance(balanceResult);
      console.log(
        `✅ Balance fetched: ${formatTokenAmount(
          balanceResult,
          tokenInfo.decimals
        )} ${tokenInfo.symbol}`
      );
    } catch (err) {
      console.error("❌ Failed to fetch balance:", err);
      const friendlyError = await handleCertificateError(err, null);
      setError(
        `Failed to fetch balance: ${friendlyError.message || err.message}`
      );
    } finally {
      setLoading((prev) => ({ ...prev, balance: false }));
    }
  }, [actors.aptc, principal, tokenInfo.decimals, tokenInfo.symbol]);

  // Initialize actors on mount (always use anonymous actors)
  useEffect(() => {
    initializeActors();
  }, []); // Empty dependency array - only run once on mount

  // Fetch balance when actors are ready (only when actors change, not when fetchBalance changes)
  useEffect(() => {
    if (actors.aptc && principal) {
      fetchBalance();
    }
  }, [actors.aptc, principal]); // Removed fetchBalance from dependencies to prevent loops

  // Token operations using on-demand authenticated actors
  const transferTokens = useCallback(
    async (to, amount) => {
      if (!principal) {
        throw new Error("Not connected");
      }

      try {
        console.log(`🔄 Initiating token transfer to ${to}...`);
        const { authAptcActor } = await createAuthenticatedActors();

        // Get the current fee from the token actor to ensure it's up-to-date
        console.log("📊 Fetching current token fee...");
        const currentFee = await authAptcActor.icrc1_fee();
        const tokenFee =
          typeof currentFee === "bigint" ? currentFee : BigInt(currentFee);
        console.log(`🪙 Using token fee: ${tokenFee.toString()} for transfer`);

        const transferArgs = {
          from_subaccount: [],
          to: {
            owner: Principal.fromText(to),
            subaccount: [],
          },
          amount: parseTokenAmount(amount, tokenInfo.decimals),
          fee: [tokenFee], // Pass fee as an array with the current fee value
          memo: [],
          created_at_time: [],
        };

        console.log("📝 Transfer args:", transferArgs);

        // Use retry logic for transfer
        const result = await retryActorCall(
          async () => {
            console.log("💸 Executing token transfer...");
            return await authAptcActor.icrc1_transfer(transferArgs);
          },
          identity,
          3, // More retries for token transfers
          1500 // Longer delay between retries
        );

        if ("Err" in result) {
          console.error("❌ Transfer returned an error:", result.Err);
          throw new Error(`Transfer failed: ${JSON.stringify(result.Err)}`);
        }

        console.log("✅ Token transfer successful");
        await fetchBalance(); // Refresh balance
        return result.Ok;
      } catch (err) {
        console.error("❌ Token transfer error:", err);

        // Handle certificate errors with helpful message
        if (isCertificateError(err)) {
          console.log(
            "🔄 Certificate error in transfer, providing guidance..."
          );
          throw new Error(
            "Authentication error during token transfer. Please try:\n" +
              "1. Disconnect your wallet\n" +
              "2. Clear browser cache/cookies\n" +
              "3. Reconnect your wallet\n" +
              "4. Try again"
          );
        }

        throw err;
      }
    },
    [createAuthenticatedActors, principal, tokenInfo, fetchBalance, identity]
  );

  const formatTokenMetaData = (arr) => {
    const resultObject = {};
    arr.forEach((item) => {
      const key = item[0];
      const value = item[1][Object.keys(item[1])[0]];
      resultObject[key] = value;
    });
    return resultObject;
  };

  const fetchMetadataAndBalance = async (tokenActor, ownerPrincipal) => {
    try {
      const [metadata, balance] = await Promise.all([
        tokenActor.icrc1_metadata(),
        tokenActor.icrc1_balance_of({
          owner: ownerPrincipal,
          subaccount: [],
        }),
      ]);
      return { metadata, balance };
    } catch (err) {
      console.error("Error fetching metadata and balance:", err);
      throw err;
    }
  };

  const approveTokens = useCallback(
    async (spender, amount) => {
      if (!principal) {
        throw new Error("Not connected");
      }

      // Validate spender parameter
      if (!spender || typeof spender !== "string") {
        throw new Error(
          `Invalid spender parameter: expected string, got ${typeof spender}. Value: ${spender}`
        );
      }

      try {
        console.log("🔐 Creating authenticated actor for token approval...");

        // Verify the user's identity and principal before proceeding
        if (!identity) {
          console.error("❌ Missing identity for token approval");
          throw new Error(
            "Authentication required for token approval. Please reconnect your wallet."
          );
        }

        // Verify that we're using the correct principal for this operation
        const identityPrincipal = identity.getPrincipal().toString();
        if (identityPrincipal !== principal.toString()) {
          console.error(
            `❌ Identity principal (${identityPrincipal}) doesn't match user principal (${principal.toString()})`
          );
          throw new Error(
            "Identity mismatch. Please disconnect and reconnect your wallet."
          );
        }

        console.log(
          `✅ Verified identity principal matches user principal: ${principal.toString()}`
        );

        // Force a completely fresh agent to ensure we have valid delegations
        const agent = await getCachedAgent(
          identity,
          `approval-${principal.toString()}-${Date.now()}`,
          true // Force fresh agent creation
        );

        // For local development, explicitly fetch the root key
        if (
          window.location.hostname.includes("localhost") ||
          window.location.hostname.includes("127.0.0.1")
        ) {
          try {
            await agent.fetchRootKey();
            console.log("✅ Root key refreshed for token approval");
          } catch (e) {
            console.warn("⚠️ Failed to refresh root key:", e);
          }
        }

        // Create actor with the fresh agent
        console.log("bhai meri identity : ", identity.getPrincipal());
        const authAptcActor = await createAPTCTokenActor(identity, agent);
        console.log("`authAptcActor` : ", authAptcActor);

        const currentFee = await authAptcActor.icrc1_fee();
        console.log("currentFee : ", currentFee);

        const { metadata } = await fetchMetadataAndBalance(
          authAptcActor,
          identity.getPrincipal()
        );
        const currentMetaData = formatTokenMetaData(metadata);
        const sendableAmount = parseInt(0.1 * Math.pow(10, 8));
        const approvalAmount =
          sendableAmount + parseInt(currentMetaData["icrc1:fee"]);

        const approveArgs = {
          from_subaccount: [],
          spender: {
            owner: Principal.fromText(process.env.CANISTER_ID_ROULETTE_GAME),
            subaccount: [],
          },
          amount: approvalAmount, // Include fee in the approval amount
          expected_allowance: [],
          expires_at: [],
          fee: [currentMetaData["icrc1:fee"]], // Pass fee as an array with the value from current fee
          memo: [],
          created_at_time: [],
        };

        console.log("📝 Approval @@@@@@@@@@@:", approveArgs);

        // Attempt approval with retry logic for certificate errors
        const result = await authAptcActor.icrc2_approve(approveArgs);
        console.log("result $$$$$$$$$$$$$$$$$$: ", result);
        return result.Ok;
      } catch (err) {
        console.error("❌ Token approval error:", err);
        throw err;
      }
    },
    [createAuthenticatedActors, principal, tokenInfo, identity]
  );

  // Special token approval function with enhanced error handling specifically for ThresBls12_381 errors
  // Special token approval function with enhanced error handling specifically for ThresBls12_381 errors
  const approveTokensWithFallback = async (spender, amount) => {
    console.log("aa gya bhai....................................");
    await approveTokens(spender, amount);
  };
  const parseAmount = useCallback(
    (amount) => {
      return parseTokenAmount(amount, tokenInfo.decimals);
    },
    [tokenInfo.decimals]
  );

  // Helper function to convert bet type and value to human-readable string for CLI
  const getBetTypeString = (betType, betValue) => {
    if (betType?.Number !== undefined) {
      return betValue.toString();
    } else if (betType?.Color !== undefined) {
      return betValue === 1 ? "red" : "black";
    } else if (betType?.OddEven !== undefined) {
      return betValue === 1 ? "odd" : "even";
    } else if (betType?.HighLow !== undefined) {
      return betValue === 1 ? "high" : "low";
    } else if (betType?.Dozen !== undefined) {
      return `dozen${betValue}`;
    } else if (betType?.Column !== undefined) {
      return `column${betValue}`;
    }
    return "red"; // Default fallback
  };

  // Create proper bet type objects for Motoko backend
  const createMotokoBetType = (betTypeString) => {
    switch (betTypeString) {
      case "number":
        return { Number: null };
      case "red":
      case "black":
        return { Color: null };
      case "odd":
      case "even":
        return { OddEven: null };
      case "high":
      case "low":
        return { HighLow: null };
      case "dozen":
        return { Dozen: null };
      case "column":
        return { Column: null };
      case "split":
        return { Split: null };
      case "street":
        return { Street: null };
      case "corner":
        return { Corner: null };
      case "line":
        return { Line: null };
      default:
        return { Color: null }; // Default fallback
    }
  };

  // Convert bet type string to appropriate bet value for Motoko
  const getMotokoBetValue = (betTypeString, numberValue = 0) => {
    switch (betTypeString) {
      case "number":
        return numberValue;
      case "red":
        return 1; // true for red
      case "black":
        return 0; // false for black
      case "odd":
        return 1; // true for odd
      case "even":
        return 0; // false for even
      case "high":
        return 1; // true for high (19-36)
      case "low":
        return 0; // false for low (1-18)
      case "dozen":
        return numberValue; // 0, 1, or 2 for dozen (corrected to 0-based)
      case "column":
        return numberValue; // 0, 1, or 2 for column (corrected to 0-based)
      case "split":
      case "street":
      case "corner":
      case "line":
        return 0; // For complex bets, value is in numbers array
      default:
        return 0;
    }
  };

  // Roulette game operations
  const roulette = useMemo(
    () => ({
      // Get game info (anonymous - read-only)
      getGameInfo: async () => {
        if (!actors.roulette) throw new Error("Roulette actor not initialized");
        return await retryActorCall(async () => {
          return await actors.roulette.getGameInfo();
        });
      },

      // Get current bets (anonymous - read-only)
      getCurrentBets: async () => {
        if (!actors.roulette) throw new Error("Roulette actor not initialized");
        return await retryActorCall(async () => {
          return await actors.roulette.getCurrentBets();
        });
      },

      // Get recent numbers (anonymous - read-only)
      getRecentNumbers: async () => {
        if (!actors.roulette) throw new Error("Roulette actor not initialized");
        return await retryActorCall(async () => {
          return await actors.roulette.getRecentNumbers();
        });
      },

      // Get bet history for user (anonymous - read-only)
      getBetHistory: async (limit = null) => {
        if (!principal) throw new Error("Not connected");
        if (!actors.roulette) throw new Error("Roulette actor not initialized");

        return await retryActorCall(async () => {
          return await actors.roulette.getBetHistory(limit ? [limit] : []);
        });
      },

      // Get user stats (anonymous - read-only)
      getUserStats: async () => {
        if (!principal) throw new Error("Not connected");
        if (!actors.roulette) throw new Error("Roulette actor not initialized");

        return await retryActorCall(async () => {
          const principalObj = Principal.fromText(principal);
          return await actors.roulette.getUserStats(principalObj);
        });
      },

      // Get round stats (anonymous - read-only)
      getRoundStats: async (limit = null) => {
        if (!actors.roulette) throw new Error("Roulette actor not initialized");
        return await retryActorCall(async () => {
          return await actors.roulette.getRoundStats(limit ? [limit] : []);
        });
      },

      // Check if contract is initialized
      isContractInitialized: async () => {
        if (!actors.roulette) throw new Error("Roulette actor not initialized");
        return await retryActorCall(async () => {
          return await actors.roulette.isContractInitialized();
        });
      },

      // Place bet using authenticated actors with proper Motoko types
      placeBet: async (betTypeString, betValueNumber, amount, numbers = []) => {
        console.log("🎰 Placing bet with:", {
          betTypeString,
          betValueNumber,
          amount,
          numbers,
        });

        if (!actors.roulette) throw new Error("Roulette actor not initialized");

        setLoading((prev) => ({ ...prev, roulette: true }));
        try {
          console.log("🎰 Starting bet placement process...");

          // Check for delegation certificate issues early
          if (!identity || !principal) {
            throw new Error("🔐 Please connect your NFID wallet to place bets");
          }

          // Immediately update balance for instant UI feedback
          const betAmount = parseTokenAmount(amount, tokenInfo.decimals);
          setBalance((prev) => prev - betAmount);

          // Dispatch immediate balance update event
          const balanceUpdateEvent = new CustomEvent("tokenSpent", {
            detail: {
              amount: betAmount,
              gameType: "roulette",
              betType: betTypeString,
              betValue: betValueNumber,
            },
          });
          window.dispatchEvent(balanceUpdateEvent);

          // Trigger global balance refresh
          if (typeof window !== "undefined" && window.refreshTokenBalance) {
            window.refreshTokenBalance();
          }

          // Create proper Motoko bet type and value
          const motokoBetType = createMotokoBetType(betTypeString);
          const motokoBetValue = getMotokoBetValue(
            betTypeString,
            betValueNumber
          );

          console.log("🎯 Motoko bet type:", motokoBetType);
          console.log("🎯 Motoko bet value:", motokoBetValue);

          // Convert Motoko bet value to Nat8 for the backend
          const betValueNat8 = motokoBetValue;

          // Attempt betting with authenticated actors
          const result = await retryActorCall(
            async () => {
              // Create authenticated actors for the transaction
              const { authAptcActor, authRouletteActor } =
                await createAuthenticatedActors();

              // Get the current fee from the token actor to ensure it's up-to-date
              const currentFee = await authAptcActor.icrc1_fee();
              const tokenFee =
                typeof currentFee === "bigint"
                  ? currentFee
                  : BigInt(currentFee);

              // Add a buffer plus the token fee to ensure sufficient approval
              const approvalAmount = betAmount + BigInt(10_000_000) + tokenFee;

              const approveArgs = {
                from_subaccount: [],
                spender: {
                  owner: Principal.fromText(CANISTER_IDS.ROULETTE_GAME),
                  subaccount: [],
                },
                amount: approvalAmount,
                expected_allowance: [],
                expires_at: [],
                fee: [tokenFee],
                memo: [],
                created_at_time: [],
              };

              console.log(
                "🔑 Attempting token approval with args:",
                approveArgs
              );
              const approvalResult = await authAptcActor.icrc2_approve(
                approveArgs
              );
              console.log("✅ Approval result:", approvalResult);

              if ("Err" in approvalResult) {
                throw new Error(
                  `Token approval failed: ${JSON.stringify(approvalResult.Err)}`
                );
              }

              // Place the bet with proper Motoko types matching the backend signature
              console.log("🎲 Placing bet with authenticated actor...");
              console.log("🎲 Final bet details:", {
                betType: motokoBetType,
                betValue: betValueNat8,
                amount: betAmount.toString(),
                numbers: numbers,
              });

              const betResult = await authRouletteActor.placeBet(
                motokoBetType,
                betValueNat8,
                betAmount,
                numbers
              );

              if ("Err" in betResult) {
                throw new Error(
                  `Bet placement failed: ${JSON.stringify(betResult.Err)}`
                );
              }

              console.log("✅ Bet placed successfully:", betResult.Ok);
              return betResult.Ok;
            },
            identity,
            2, // Retries
            1000
          );

          // Dispatch bet placed event
          const betPlacedEvent = new CustomEvent("betPlaced", {
            detail: {
              amount: betAmount,
              gameType: "roulette",
              betType: betTypeString,
              betValue: betValueNumber,
              result: result,
            },
          });
          window.dispatchEvent(betPlacedEvent);

          // Refresh balance after successful bet
          setTimeout(async () => {
            await fetchBalance();
            // Trigger global balance refresh
            if (typeof window !== "undefined" && window.refreshTokenBalance) {
              window.refreshTokenBalance();
            }
          }, 1000);

          return result;
        } catch (err) {
          // Restore balance on error
          const betAmount = parseTokenAmount(amount, tokenInfo.decimals);
          setBalance((prev) => prev + betAmount);

          // Handle delegation certificate errors specifically
          if (isCertificateError(err)) {
            console.error("🔐 Delegation issue detected during bet placement");

            // Create proper Motoko bet type and value for error message
            const motokoBetType = createMotokoBetType(betTypeString);
            const motokoBetValue = getMotokoBetValue(
              betTypeString,
              betValueNumber
            );

            // Create enhanced error for local development
            const localDevMessage =
              "🔧 Local Development: NFID delegation incompatible with DFX replica.\n\n" +
              "💡 SOLUTION: Use the enhanced local betting script:\n" +
              `   ./enhanced-local-betting.sh '${principal}' '${parseTokenAmount(
                amount,
                tokenInfo.decimals
              )}' '${getBetTypeString(motokoBetType, motokoBetValue)}'\n\n` +
              "This script will place your bet using real token transfers.";

            console.error(localDevMessage);

            const enhancedError = new Error(
              "🔧 Local Development: NFID delegation incompatible.\n\n" +
                "💡 Run this command: ./enhanced-local-betting.sh"
            );
            enhancedError.isDelegationError = true;
            enhancedError.localDevSolution = `./enhanced-local-betting.sh '${principal}' '${parseTokenAmount(
              amount,
              tokenInfo.decimals
            )}' '${getBetTypeString(motokoBetType, motokoBetValue)}'`;
            throw enhancedError;
          }

          console.error("❌ Failed to place bet:", err);

          if (err.isDelegationError) {
            throw err;
          }

          const handledError = await handleCertificateError(err, identity);
          throw handledError instanceof Error
            ? handledError
            : new Error(err.message || "Bet placement failed");
        } finally {
          setLoading((prev) => ({ ...prev, roulette: false }));
        }
      },

      // Spin roulette (for manual spinning) using authenticated actor
      spin: async () => {
        if (!actors.roulette) throw new Error("Roulette actor not initialized");

        setLoading((prev) => ({ ...prev, roulette: true }));
        try {
          console.log(
            "🎲 Initiating spin - checking for current bets first..."
          );

          // First, verify there are bets to spin
          const currentBetsCheck = await actors.roulette.getCurrentBets();
          console.log("📊 Current bets before spin:", currentBetsCheck);

          if (!currentBetsCheck || currentBetsCheck.length === 0) {
            throw new Error(
              "No bets found for this round. Please place a bet first and ensure it's confirmed before spinning."
            );
          }

          const { authRouletteActor } = await createAuthenticatedActors();
          const result = await retryActorCall(async () => {
            console.log("🎰 Calling spinRoulette on authenticated actor...");
            return await authRouletteActor.spinRoulette();
          }, identity);

          console.log("🎲 Raw spin result from backend:", result);

          // Handle Motoko Result type - check for 'err' and 'ok' properties (lowercase)
          if (result && typeof result === "object") {
            if ("err" in result) {
              console.error("❌ Spin returned error:", result.err);

              // Provide more specific error messages
              if (result.err.includes("No bets")) {
                throw new Error(
                  "No bets placed for this round. Please place a bet and wait for confirmation before spinning."
                );
              } else if (
                result.err.includes("already spinning") ||
                result.err.includes("game in progress")
              ) {
                throw new Error(
                  "A spin is already in progress. Please wait for it to complete."
                );
              } else {
                throw new Error(`Spin failed: ${result.err}`);
              }
            }
            if ("ok" in result) {
              console.log("✅ Spin completed successfully:", result.ok);
              return result.ok;
            }
          }

          // If neither err nor ok, it might be the result directly
          console.log(
            "✅ Spin completed successfully (direct result):",
            result
          );
          return result;
        } catch (error) {
          console.error("❌ Spin method error:", error);

          // Re-throw with more context
          if (
            error.message.includes("No bets placed") ||
            error.message.includes("No bets found")
          ) {
            throw new Error(
              "No bets found for this round. This can happen if:\n1. No bets were placed\n2. Bets are still being confirmed\n3. Previous round was already spun\n\nPlease place a new bet and try again."
            );
          }

          throw error;
        } finally {
          setLoading((prev) => ({ ...prev, roulette: false }));
        }
      },

      // Manual spin (admin only)
      manualSpin: async () => {
        if (!actors.roulette) throw new Error("Roulette actor not initialized");

        setLoading((prev) => ({ ...prev, roulette: true }));
        try {
          const { authRouletteActor } = await createAuthenticatedActors();
          const result = await retryActorCall(async () => {
            return await authRouletteActor.manualSpin();
          }, identity);

          console.log("🎲 Raw manual spin result from backend:", result);

          // Handle Motoko Result type - check for 'err' and 'ok' properties (lowercase)
          if (result && typeof result === "object") {
            if ("err" in result) {
              throw new Error(`Manual spin failed: ${result.err}`);
            }
            if ("ok" in result) {
              console.log("✅ Manual spin completed successfully:", result.ok);
              return result.ok;
            }
          }

          // If neither err nor ok, it might be the result directly
          console.log(
            "✅ Manual spin completed successfully (direct result):",
            result
          );
          return result;
        } finally {
          setLoading((prev) => ({ ...prev, roulette: false }));
        }
      },
    }),
    [
      actors.roulette,
      principal,
      createAuthenticatedActors,
      fetchBalance,
      tokenInfo,
      identity,
    ]
  );

  // Mines game operations
  const mines = useMemo(
    () => ({
      // Get active game (use anonymous actor for reliability)
      getActiveGame: async () => {
        if (!principal) throw new Error("Not connected");
        if (!actors.mines) throw new Error("Mines actor not initialized");

        return await retryActorCall(async () => {
          const principalObj = Principal.fromText(principal);
          return await actors.mines.getActiveGame(principalObj);
        });
      },

      // Get game history (use anonymous actor for reliability)
      getGameHistory: async (limit = null) => {
        if (!principal) throw new Error("Not connected");
        if (!actors.mines) throw new Error("Mines actor not initialized");

        return await retryActorCall(async () => {
          const principalObj = Principal.fromText(principal);
          return await actors.mines.getGameHistory(
            principalObj,
            limit ? [limit] : []
          );
        });
      },

      // Get user stats (use anonymous actor for reliability)
      getUserStats: async () => {
        if (!principal) throw new Error("Not connected");
        if (!actors.mines) throw new Error("Mines actor not initialized");

        return await retryActorCall(async () => {
          const principalObj = Principal.fromText(principal);
          return await actors.mines.getUserStats(principalObj);
        });
      },

      // Get game stats (anonymous - read-only)
      getGameStats: async () => {
        if (!actors.mines) throw new Error("Mines actor not initialized");
        return await actors.mines.getGameStats();
      },

      // Get bet limits (anonymous - read-only)
      getBetLimits: async () => {
        if (!actors.mines) throw new Error("Mines actor not initialized");
        return await actors.mines.getBetLimits();
      },

      // Check if game is active (use anonymous actor for reliability)
      isGameActive: async () => {
        if (!principal) throw new Error("Not connected");
        if (!actors.mines) throw new Error("Mines actor not initialized");

        return await retryActorCall(async () => {
          const principalObj = Principal.fromText(principal);
          return await actors.mines.isGameActive(principalObj);
        });
      },

      // Get multiplier for specific mine count and revealed cells (anonymous - read-only)
      getMultiplierForMines: async (mineCount, revealedCount) => {
        if (!actors.mines) throw new Error("Mines actor not initialized");
        return await actors.mines.getMultiplierForMines(
          mineCount,
          revealedCount
        );
      },

      // Get player token balance (use anonymous actor for reliability)
      getPlayerTokenBalance: async () => {
        if (!principal) throw new Error("Not connected");
        if (!actors.mines) throw new Error("Mines actor not initialized");

        return await retryActorCall(async () => {
          const principalObj = Principal.fromText(principal);
          return await actors.mines.getPlayerTokenBalance(principalObj);
        });
      },

      // Start new game with ICRC-2 approval workflow using authenticated actors
      startGame: async (betAmount, mineCount) => {
        if (!principal) throw new Error("Not connected");

        setLoading((prev) => ({ ...prev, mines: true }));
        try {
          // Create authenticated actors on-demand for the transaction
          const { authAptcActor, authMinesActor } =
            await createAuthenticatedActors();

          // First, approve tokens for the mines canister
          console.log(
            `Approving ${betAmount} ${tokenInfo.symbol} for mines game...`
          );

          const betAmountValue = parseAmount(betAmount);
          console.log("💰 Parsed bet amount:", betAmountValue.toString());

          // Get the current fee from the token actor to ensure it's up-to-date
          const currentFee = await authAptcActor.icrc1_fee();
          const tokenFee =
            typeof currentFee === "bigint" ? currentFee : BigInt(currentFee);
          console.log("💸 Current token fee:", tokenFee.toString());

          // Add the token fee to ensure sufficient approval
          const approvalAmount = betAmountValue + tokenFee;
          console.log("🔐 Total approval amount:", approvalAmount.toString());

          // Check current balance before approval
          const currentBalance = await authAptcActor.icrc1_balance_of({
            owner: identity.getPrincipal(),
            subaccount: [],
          });
          console.log(
            "💰 Current balance before approval:",
            currentBalance.toString()
          );
          console.log("🧮 Balance vs approval check:", {
            balance: currentBalance.toString(),
            needed: approvalAmount.toString(),
            sufficient: currentBalance >= approvalAmount,
          });

          const approveArgs = {
            from_subaccount: [],
            spender: {
              owner: Principal.fromText(CANISTER_IDS.MINES_GAME),
              subaccount: [],
            },
            amount: approvalAmount, // Include fee in the approval amount
            expected_allowance: [],
            expires_at: [],
            fee: [tokenFee], // Pass fee as an array with the current fee value
            memo: [],
            created_at_time: [],
          };

          const approvalResult = await authAptcActor.icrc2_approve(approveArgs);
          console.log(
            "🔐 Approval result:",
            JSON.stringify(approvalResult, (key, value) =>
              typeof value === "bigint" ? value.toString() : value
            )
          );

          if ("Err" in approvalResult) {
            throw new Error(
              `Token approval failed: ${JSON.stringify(approvalResult.Err)}`
            );
          }

          // Add a brief delay after approval to ensure backend sees the allowance
          console.log(
            "⏳ Brief delay after approval for backend synchronization..."
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Verify the allowance was set correctly
          const allowanceCheck = await authAptcActor.icrc2_allowance({
            account: { owner: identity.getPrincipal(), subaccount: [] },
            spender: {
              owner: Principal.fromText(CANISTER_IDS.MINES_GAME),
              subaccount: [],
            },
          });
          console.log(
            "🔍 Allowance verification:",
            allowanceCheck.allowance.toString()
          );

          // Pre-flight check: ensure backend has current balance by calling getPlayerTokenBalance
          console.log("🔄 Pre-flight balance check to sync backend state...");
          try {
            const backendBalanceCheck =
              await authMinesActor.getPlayerTokenBalance(
                identity.getPrincipal()
              );
            console.log(
              "💰 Backend balance pre-flight:",
              backendBalanceCheck.toString()
            );
          } catch (preflightError) {
            console.warn("⚠️ Pre-flight balance check failed:", preflightError);
          }

          // Start the game (backend will use transfer_from to get the tokens)
          console.log("🎮 Calling backend startGame with:", {
            betAmount: parseAmount(betAmount).toString(),
            mineCount,
            playerPrincipal: identity.getPrincipal().toString(),
          });

          const result = await authMinesActor.startGame(
            parseAmount(betAmount),
            mineCount
          );

          console.log(
            "📊 Backend startGame response:",
            JSON.stringify(result, (key, value) =>
              typeof value === "bigint" ? value.toString() : value
            )
          );

          if ("Err" in result) {
            // Parse error for better user feedback
            let errorMessage = "Game start failed";
            const error = result.Err;

            if (error.InsufficientBalance) {
              // Retry once after a delay if we get InsufficientBalance
              // This could be due to backend balance check timing issues
              console.log(
                "⚠️ InsufficientBalance error detected, retrying after delay..."
              );
              await new Promise((resolve) => setTimeout(resolve, 2000));

              console.log("🔄 Retrying startGame call...");
              const retryResult = await authMinesActor.startGame(
                parseAmount(betAmount),
                mineCount
              );

              console.log(
                "📊 Retry result:",
                JSON.stringify(retryResult, (key, value) =>
                  typeof value === "bigint" ? value.toString() : value
                )
              );

              if ("Err" in retryResult && retryResult.Err.InsufficientBalance) {
                errorMessage =
                  "Insufficient token balance - please ensure you have enough tokens";
              } else if ("Err" in retryResult) {
                // Handle other retry errors
                const retryError = retryResult.Err;
                if (retryError.InsufficientAllowance) {
                  errorMessage =
                    "Insufficient token allowance. Please approve tokens first.";
                } else if (retryError.TokenTransferFromError) {
                  errorMessage =
                    "Token transfer failed. Please check your balance and allowance.";
                } else {
                  errorMessage = `Game start failed on retry: ${JSON.stringify(
                    retryError
                  )}`;
                }
              } else {
                // Retry succeeded
                return retryResult.Ok || retryResult;
              }
            } else if (error.InsufficientAllowance) {
              errorMessage =
                "Insufficient token allowance. Please approve tokens first.";
            } else if (error.TokenTransferFromError) {
              errorMessage =
                "Token transfer failed. Please check your balance and allowance.";
            } else if (error.GameAlreadyActive) {
              errorMessage =
                "You already have an active game. Please finish it first.";
            } else if (error.InvalidBetAmount) {
              errorMessage = "Invalid bet amount. Please check the bet limits.";
            } else if (error.InvalidMineCount) {
              errorMessage = `Invalid mine count. Must be between ${MINES_CONSTANTS.MIN_MINES} and ${MINES_CONSTANTS.MAX_MINES}.`;
            } else if (error.GameInactive) {
              errorMessage =
                "Game is currently inactive. Please try again later.";
            } else if (error.CooldownActive) {
              errorMessage = "Please wait a moment before starting a new game.";
            } else if (error.TransferFailed) {
              errorMessage = `Transfer failed: ${error.TransferFailed}`;
            }

            throw new Error(errorMessage);
          }

          await fetchBalance(); // Refresh balance
          return result.Ok || result.ok || result;
        } finally {
          setLoading((prev) => ({ ...prev, mines: false }));
        }
      },

      // Reveal cell using authenticated actor
      revealCell: async (cellIndex) => {
        if (!principal) throw new Error("Not connected");

        setLoading((prev) => ({ ...prev, mines: true }));
        try {
          const { authMinesActor } = await createAuthenticatedActors();
          const result = await authMinesActor.revealCell(cellIndex);

          if ("Err" in result) {
            let errorMessage = "Cell reveal failed";
            const error = result.Err;

            if (error.GameNotFound) {
              errorMessage = "No active game found. Please start a new game.";
            } else if (error.GameAlreadyEnded) {
              errorMessage = "Game has already ended.";
            } else if (error.CellAlreadyRevealed) {
              errorMessage = "This cell has already been revealed.";
            } else if (error.InvalidCellIndex) {
              errorMessage = "Invalid cell selection.";
            }

            throw new Error(errorMessage);
          }

          return result.Ok || result.ok;
        } finally {
          setLoading((prev) => ({ ...prev, mines: false }));
        }
      },

      // Cash out using authenticated actor
      cashOut: async () => {
        if (!principal) throw new Error("Not connected");

        setLoading((prev) => ({ ...prev, mines: true }));
        try {
          const { authMinesActor } = await createAuthenticatedActors();
          const result = await authMinesActor.cashOut();

          if ("Err" in result) {
            let errorMessage = "Cash out failed";
            const error = result.Err;

            if (error.GameNotFound) {
              errorMessage = "No active game found.";
            } else if (error.GameAlreadyEnded) {
              errorMessage = "Game has already ended.";
            } else if (error.TransferFailed) {
              errorMessage = `Payout transfer failed: ${error.TransferFailed}`;
            }

            throw new Error(errorMessage);
          }

          await fetchBalance(); // Refresh balance
          return result.Ok || result.ok;
        } finally {
          setLoading((prev) => ({ ...prev, mines: false }));
        }
      },

      // Get required approval amount for token approval
      getRequiredApprovalAmount: async (betAmount) => {
        if (!actors.mines) throw new Error("Mines actor not initialized");

        return await retryActorCall(async () => {
          return await actors.mines.getRequiredApprovalAmount(betAmount);
        });
      },

      // Get player allowance (requires authentication)
      getPlayerAllowance: async () => {
        if (!principal) throw new Error("Not connected");

        const { authMinesActor } = await createAuthenticatedActors();
        return await authMinesActor.getPlayerAllowance();
      },

      // Get game canister principal
      getGameCanisterPrincipal: async () => {
        if (!actors.mines) throw new Error("Mines actor not initialized");

        return await retryActorCall(async () => {
          return await actors.mines.getGameCanisterPrincipal();
        });
      },
    }),
    [
      actors.mines,
      principal,
      createAuthenticatedActors,
      fetchBalance,
      tokenInfo,
      parseAmount,
    ]
  );

  // Utility functions
  const formatBalance = useCallback(
    (amount = balance) => {
      return formatTokenAmount(amount, tokenInfo.decimals);
    },
    [balance, tokenInfo.decimals]
  );

  // Place bet with enhanced token approval
  const placeBetWithEnhancedApproval = async (
    betType,
    betValue,
    amount,
    numbers = []
  ) => {
    if (!actors.roulette) throw new Error("Roulette actor not initialized");

    setLoading((prev) => ({ ...prev, roulette: true }));
    try {
      console.log("🎰 Starting enhanced bet placement:", {
        betType,
        betValue,
        amount,
        principal: principal?.toString(),
      });

      // Check for delegation certificate issues early
      if (!identity || !principal) {
        throw new Error("🔐 Please connect your wallet to place bets");
      }

      // Convert amount to token units
      const betAmount = parseTokenAmount(amount, tokenInfo.decimals);
      console.log("✅ Bet amount validated:", betAmount.toString());

      // First approve tokens using the enhanced approval method
      console.log("🔑 Approving tokens:", {
        spender: CANISTER_IDS.ROULETTE_GAME,
        amount: ((betAmount * BigInt(120)) / BigInt(100)).toString(), // 120% to cover fees
      });

      // Use enhanced token approval with fallback mechanisms
      console.log("🛡️ Using enhanced token approval with fallback mechanisms");
      await approveICRCToken(
        identity,
        CANISTER_IDS.ROULETTE_GAME,
        (betAmount * BigInt(120)) / BigInt(100), // 120% to cover fees
        CANISTER_IDS.APTC_TOKEN,
        tokenIdl
      );

      // Create authenticated roulette actor for the bet
      console.log("🎲 Creating authenticated roulette actor");
      const { authRouletteActor } = await createAuthenticatedActors();

      // Place the bet with enhanced error handling
      console.log("🎲 Placing bet with authenticated actor");
      const betResult = await authRouletteActor.placeBet(
        betType,
        betValue,
        betAmount,
        numbers
      );

      if ("Err" in betResult) {
        throw new Error(
          `Bet placement failed: ${JSON.stringify(betResult.Err)}`
        );
      }

      console.log("✅ Bet placed successfully:", betResult.Ok);

      // Refresh balance after successful bet
      await fetchBalance();

      return betResult.Ok;
    } catch (err) {
      console.error("❌ Enhanced betting error:", err);
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, roulette: false }));
    }
  };

  return {
    // Connection state
    isConnected: !!actors.aptc, // Connected when anonymous actors are available
    principal,

    // Actors
    actors,

    // Loading states
    loading,

    // Error state
    error,
    setError,

    // Token info
    tokenInfo,
    balance,
    formatBalance,
    parseAmount,
    parseTokenAmount: parseAmount, // Alias for compatibility

    // Token operations (will use authenticated actors on-demand)
    transferTokens,
    approveTokens,
    approveTokensWithFallback, // Special fallback for ThresBls12_381 errors
    fetchBalance,

    // Game operations (hybrid: anonymous for queries, authenticated for transactions)
    roulette,
    mines,

    // Utilities
    createRouletteBet,
    createAuthenticatedActors,
    CANISTER_IDS,

    // Refresh functions
    refresh: fetchBalance,
    initializeActors,

    // Certificate error troubleshooting
    clearDelegationCache: () => {
      console.log("🧹 Clearing delegation cache from local storage...");
      try {
        // Clear all agent-related caches from local storage
        Object.keys(localStorage).forEach((key) => {
          if (
            key.includes("agent-js") ||
            key.includes("identity") ||
            key.includes("delegation") ||
            key.includes("auth") ||
            key.includes("ic-") ||
            key.includes("canister") ||
            key.includes("principal")
          ) {
            console.log(`🗑️ Removing ${key} from local storage`);
            localStorage.removeItem(key);
          }
        });
        console.log(
          "✅ Delegation cache cleared. Please reconnect your wallet."
        );
        return true;
      } catch (err) {
        console.error("❌ Failed to clear delegation cache:", err);
        return false;
      }
    },

    // Complete wallet reset and reconnection helper
    resetWalletConnection: async () => {
      console.log("🔄 Performing complete wallet reset...");
      try {
        // Clear all related storage
        Object.keys(localStorage).forEach((key) => {
          if (
            key.includes("agent-js") ||
            key.includes("identity") ||
            key.includes("delegation") ||
            key.includes("auth") ||
            key.includes("ic-") ||
            key.includes("canister") ||
            key.includes("principal") ||
            key.includes("nfid") ||
            key.includes("wallet")
          ) {
            console.log(`🗑️ Removing ${key} from local storage`);
            localStorage.removeItem(key);
          }
        });

        // Clear session storage as well
        Object.keys(sessionStorage).forEach((key) => {
          if (
            key.includes("agent-js") ||
            key.includes("identity") ||
            key.includes("delegation") ||
            key.includes("auth") ||
            key.includes("ic-") ||
            key.includes("nfid") ||
            key.includes("wallet")
          ) {
            console.log(`🗑️ Removing ${key} from session storage`);
            sessionStorage.removeItem(key);
          }
        });

        // Clear all cookies related to Internet Identity or NFID
        document.cookie.split(";").forEach((cookie) => {
          const [name] = cookie.trim().split("=");
          if (
            name.includes("identity") ||
            name.includes("delegation") ||
            name.includes("nfid") ||
            name.includes("ic")
          ) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            console.log(`🗑️ Removing cookie: ${name}`);
          }
        });

        console.log("✅ All wallet data cleared");

        // Re-initialize actors with fresh state
        await initializeActors();

        console.log("✅ Wallet reset complete. Please reconnect your wallet.");
        return true;
      } catch (err) {
        console.error("❌ Failed to reset wallet connection:", err);
        return false;
      }
    },
  };
};

// Utility function to clear delegation data
export const clearDelegationCache = () => {
  console.log("🧹 Clearing delegation cache from local storage...");
  try {
    // Clear all agent-related caches from local storage
    Object.keys(localStorage).forEach((key) => {
      if (
        key.includes("agent-js") ||
        key.includes("identity") ||
        key.includes("delegation") ||
        key.includes("auth")
      ) {
        console.log(`🗑️ Removing ${key} from local storage`);
        localStorage.removeItem(key);
      }
    });
    console.log("✅ Delegation cache cleared. Please reconnect your wallet.");
    return true;
  } catch (err) {
    console.error("❌ Failed to clear delegation cache:", err);
    return false;
  }
};

export default useBackendIntegration;
