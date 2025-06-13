import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useBackendIntegrationContext } from "../contexts/BackendIntegrationContext";
import { CANISTER_IDS } from "../config/backend-integration";

// Bet types mapping to match Motoko backend
export const BetTypes = {
  NUMBER: "Number",
  COLOR: "Color",
  ODDEVEN: "OddEven",
  HIGHLOW: "HighLow",
  DOZEN: "Dozen",
  COLUMN: "Column",
  SPLIT: "Split",
  STREET: "Street",
  CORNER: "Corner",
  LINE: "Line",
};

// Color mappings for roulette
const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

// Helper function to detect delegation errors
const isDelegationError = (error) => {
  if (error?.isDelegationError === true) {
    return true;
  }

  const errorMessage = error?.message || error?.toString() || "";
  const lowercaseMessage = errorMessage.toLowerCase();

  return (
    lowercaseMessage.includes("delegation") ||
    lowercaseMessage.includes("local development delegation") ||
    lowercaseMessage.includes("nfid wallet certificates are incompatible") ||
    lowercaseMessage.includes("certificate") ||
    lowercaseMessage.includes("threshold signature") ||
    lowercaseMessage.includes("invalid canister signature") ||
    lowercaseMessage.includes("signature could not be verified") ||
    lowercaseMessage.includes("certificate verification failed") ||
    lowercaseMessage.includes("failed to verify threshold signature") ||
    lowercaseMessage.includes("invalid delegation") ||
    errorMessage.includes("IC0406") ||
    errorMessage.includes("IC0503") ||
    errorMessage.includes("IC0301")
  );
};

const useRouletteGame = () => {
  const {
    isConnected,
    principal,
    balance,
    tokenInfo,
    loading: backendLoading,
    error: backendError,
    roulette,
    transferTokens,
    approveTokens,
    formatBalance: formatTokenBalance,
    parseAmount,
  } = useBackendIntegrationContext();

  const [gameState, setGameState] = useState({
    currentRound: 0,
    minBet: 0,
    maxBet: 0,
    userBalance: 0,
    recentNumbers: [],
    currentBets: [],
    lastSpinTime: 0,
    tokenBalance: BigInt(0),
  });

  const [loading, setLoading] = useState(false);

  // Fetch game state using the hybrid backend integration
  const fetchGameState = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching roulette game state...");

      // Get basic game info using anonymous actors (reliable)
      const [gameInfo, recentNumbers] = await Promise.all([
        roulette.getGameInfo(),
        roulette.getRecentNumbers(),
      ]);

      // Initialize game state with anonymous data
      let newGameState = {
        currentRound: Number(gameInfo.currentRound),
        minBet: Number(gameInfo.minBet),
        maxBet: Number(gameInfo.maxBet),
        userBalance: 0,
        recentNumbers: recentNumbers.map((n) => Number(n)),
        currentBets: [],
        lastSpinTime: Number(gameInfo.lastSpinTime),
        tokenBalance: balance, // Use balance from backend integration
      };

      // If user is connected, fetch their specific data
      if (isConnected) {
        try {
          const currentBets = await roulette.getCurrentBets();
          newGameState.currentBets = currentBets;
        } catch (error) {
          console.warn("Could not fetch current bets:", error);
        }
      }

      console.log("✅ Game state updated:", newGameState);
      setGameState(newGameState);
    } catch (error) {
      console.error("❌ Error fetching game state:", error);

      // Extract error message for better debugging
      const getErrorMessage = (err) => {
        if (typeof err === "string") return err;
        if (err.message) return err.message;
        if (err.toString && err.toString() !== "[object Object]")
          return err.toString();
        if (err.error) return err.error;
        if (err.body) return JSON.stringify(err.body);
        return JSON.stringify(err);
      };

      const errorMessage = getErrorMessage(error);
      console.log("❌ Game state error message:", errorMessage);

      toast.error(`Failed to load game data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [roulette, balance, isConnected]);

  // Place a bet using the hybrid backend integration
  const placeBet = useCallback(
    async (betType, betValue, amount, numbers = []) => {
      // 🚨 INITIAL STATE DEBUGGING
      console.log("🎰 STARTING BET PLACEMENT - FULL STATE ANALYSIS:");
      console.log("📊 Input Parameters:", {
        betType,
        betValue,
        amount,
        numbers,
        timestamp: new Date().toISOString(),
      });

      console.log("🔗 Connection State:", {
        isConnected,
        principal: principal?.toString(),
      });

      console.log("🎮 Backend Integration State:", {
        approveTokens: typeof approveTokens,
        roulette: !!roulette,
        tokenInfo: tokenInfo,
        CANISTER_IDS: CANISTER_IDS,
      });

      if (!isConnected) {
        console.log("❌ Not connected - early return");
        toast.error("Please connect your wallet first");
        return false;
      }

      try {
        setLoading(true);
        console.log("🎰 Placing roulette bet...", {
          betType,
          betValue,
          amount,
          numbers,
        });

        console.log("🔍 Context values:", {
          approveTokens: typeof approveTokens,
          roulette: !!roulette,
          CANISTER_IDS: CANISTER_IDS,
        });

        // Validate parameters
        if (!Object.values(BetTypes).includes(betType)) {
          toast.error(`Invalid bet type: ${betType}`);
          return false;
        }

        const validBetValue = Number(betValue);
        if (isNaN(validBetValue) || validBetValue < 0 || validBetValue > 255) {
          toast.error("Invalid bet value. Must be a number between 0 and 255.");
          return false;
        }

        // Convert bet type to variant format expected by Motoko backend
        let betTypeVariant;
        switch (betType) {
          case BetTypes.NUMBER:
            betTypeVariant = { Number: null };
            break;
          case BetTypes.COLOR:
            betTypeVariant = { Color: null };
            break;
          case BetTypes.ODDEVEN:
            betTypeVariant = { OddEven: null };
            break;
          case BetTypes.HIGHLOW:
            betTypeVariant = { HighLow: null };
            break;
          case BetTypes.DOZEN:
            betTypeVariant = { Dozen: null };
            break;
          case BetTypes.COLUMN:
            betTypeVariant = { Column: null };
            break;
          case BetTypes.SPLIT:
            betTypeVariant = { Split: null };
            break;
          case BetTypes.STREET:
            betTypeVariant = { Street: null };
            break;
          case BetTypes.CORNER:
            betTypeVariant = { Corner: null };
            break;
          case BetTypes.LINE:
            betTypeVariant = { Line: null };
            break;
          default:
            betTypeVariant = { Number: null };
        }

        // Convert amount to smallest token units first
        const tokenAmount = parseAmount(amount);
        console.log("🎰 Converting bet amount:", {
          originalAmount: amount,
          tokenAmount: tokenAmount.toString(),
          decimals: tokenInfo?.decimals,
        });

        // FIXED: Use backend integration's placeBet method which handles approval and conversion
        console.log("🎰 Calling backend integration placeBet with params:", {
          betType: betTypeVariant,
          betValue: validBetValue,
          amount: amount, // Pass original amount, backend integration will handle conversion
          numbers: numbers.map((n) => Number(n)),
        });

        const result = await roulette.placeBet(
          betTypeVariant,
          validBetValue,
          amount, // Backend integration expects original amount, it handles conversion internally
          numbers.map((n) => Number(n))
        );

        console.log("✅ Backend placeBet success:", result);

        toast.success("🎰 Bet placed successfully!");
        await fetchGameState(); // Refresh game state
        return true;
      } catch (error) {
        console.error("❌ Bet placement error:", error);

        // 🚨 COMPREHENSIVE ERROR DEBUGGING - CAPTURE EVERYTHING
        console.log("🔍 DETAILED ERROR ANALYSIS:", {
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          errorMessage: error?.message,
          errorToString: error?.toString(),
          errorStack: error?.stack,
          fullError: error,
          isDelegationErrorFlag: error?.isDelegationError,
          isConnected,
          rouletteAgent: !!roulette,
          timestamp: new Date().toISOString(),
        });

        // Also log every property of the error object
        console.log("🔍 ERROR OBJECT PROPERTIES:");
        try {
          for (const key in error) {
            console.log(`  ${key}:`, error[key]);
          }
          console.log("🔍 Object.keys(error):", Object.keys(error));
          console.log(
            "🔍 Object.getOwnPropertyNames(error):",
            Object.getOwnPropertyNames(error)
          );
        } catch (debugError) {
          console.log("🔍 Error while analyzing error object:", debugError);
        }

        // Extract error message from various error types
        const getErrorMessage = (err) => {
          if (typeof err === "string") return err;
          if (err.message) return err.message;
          if (err.toString && err.toString() !== "[object Object]")
            return err.toString();
          if (err.error) return err.error;
          if (err.body) return JSON.stringify(err.body);
          return JSON.stringify(err);
        };

        const errorMessage = getErrorMessage(error);
        console.log("❌ Extracted error message:", errorMessage);

        // Check for delegation certificate issues first - re-throw these for frontend handling
        if (isDelegationError(error)) {
          console.log(
            "🔐 Delegation error detected, re-throwing for frontend handling"
          );
          throw error; // Re-throw delegation errors so the frontend can handle them properly
        } else if (
          errorMessage.includes("Insufficient") ||
          errorMessage.includes("insufficient")
        ) {
          toast.error("Insufficient balance to place this bet");
        } else if (
          errorMessage.includes("network") ||
          errorMessage.includes("fetch") ||
          errorMessage.includes("Network") ||
          errorMessage.includes("Failed to fetch")
        ) {
          toast.error(
            "Network error. Please check your connection and try again"
          );
        } else if (
          errorMessage.includes("400") ||
          errorMessage.includes("Bad Request")
        ) {
          toast.error(
            "Invalid request. Please check your bet amount and try again"
          );
        } else if (
          errorMessage.includes("Unauthorized") ||
          errorMessage.includes("401")
        ) {
          toast.error("Authentication error. Please reconnect your wallet");
        } else {
          toast.error(
            `Failed to place bet: ${errorMessage || "Unknown error occurred"}`
          );
        }
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, roulette, fetchGameState, parseAmount, tokenInfo]
  );

  // Spin the roulette
  const spin = useCallback(async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return false;
    }

    try {
      setLoading(true);
      // Backend integration provides spin() method that calls spinRoulette() internally
      const result = await roulette.spin();
      toast.success("🎰 Roulette spun successfully!");
      await fetchGameState(); // Refresh game state
      return true;
    } catch (error) {
      console.error("❌ Spin error:", error);

      // Extract error message for better debugging
      const getErrorMessage = (err) => {
        if (typeof err === "string") return err;
        if (err.message) return err.message;
        if (err.toString && err.toString() !== "[object Object]")
          return err.toString();
        if (err.error) return err.error;
        if (err.body) return JSON.stringify(err.body);
        return JSON.stringify(err);
      };

      const errorMessage = getErrorMessage(error);
      console.log("❌ Spin error message:", errorMessage);

      toast.error(
        `Failed to spin roulette: ${errorMessage || "Unknown error occurred"}`
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [isConnected, roulette, fetchGameState]);

  // Withdraw user balance
  const withdraw = useCallback(
    async (amount) => {
      if (!isConnected) {
        toast.error("Please connect your wallet first");
        return false;
      }

      try {
        setLoading(true);
        const result = await roulette.withdraw(amount);
        toast.success("Withdrawal successful!");
        await fetchGameState();
        return true;
      } catch (error) {
        console.error("Withdrawal error:", error);
        toast.error("Failed to withdraw");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isConnected, roulette, fetchGameState]
  );

  // Initialize game state when roulette integration is ready
  useEffect(() => {
    if (roulette && roulette.getGameInfo) {
      fetchGameState();

      // Set up periodic state updates every 30 seconds
      const interval = setInterval(() => {
        fetchGameState();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [roulette, fetchGameState]);

  // Helper function to format balance for display
  const formatBalance = useCallback(
    (balance) => {
      if (!balance) return "0";
      return formatTokenBalance(balance);
    },
    [formatTokenBalance]
  );

  // Convenience functions for specific bet types
  const placeStraightBet = useCallback(
    (number, amount) => {
      return placeBet(BetTypes.NUMBER, number, amount, []);
    },
    [placeBet]
  );

  const placeColorBet = useCallback(
    (isRed, amount) => {
      return placeBet(BetTypes.COLOR, isRed ? 1 : 0, amount, []);
    },
    [placeBet]
  );

  const placeOddEvenBet = useCallback(
    (isOdd, amount) => {
      return placeBet(BetTypes.ODDEVEN, isOdd ? 1 : 0, amount, []);
    },
    [placeBet]
  );

  const placeHighLowBet = useCallback(
    (isHigh, amount) => {
      return placeBet(BetTypes.HIGHLOW, isHigh ? 1 : 0, amount, []);
    },
    [placeBet]
  );

  const placeDozenBet = useCallback(
    (dozen, amount) => {
      if (dozen < 0 || dozen > 2) {
        toast.error("Invalid dozen value. Must be 0, 1, or 2.");
        return false;
      }
      return placeBet(BetTypes.DOZEN, dozen, amount, []);
    },
    [placeBet]
  );

  const placeColumnBet = useCallback(
    (column, amount) => {
      if (column < 0 || column > 2) {
        toast.error("Invalid column value. Must be 0, 1, or 2.");
        return false;
      }
      return placeBet(BetTypes.COLUMN, column, amount, []);
    },
    [placeBet]
  );

  // Complex bet functions
  const placeSplitBet = useCallback(
    (number1, number2, amount) => {
      if (number1 < 0 || number1 > 36 || number2 < 0 || number2 > 36) {
        toast.error("Invalid numbers for split bet. Must be between 0-36.");
        return false;
      }
      return placeBet(BetTypes.SPLIT, 0, amount, [number1, number2]);
    },
    [placeBet]
  );

  const placeStreetBet = useCallback(
    (row, amount) => {
      if (row < 0 || row > 11) {
        toast.error("Invalid row number for street bet.");
        return false;
      }
      const startNumber = row * 3 + 1;
      const numbers = [startNumber, startNumber + 1, startNumber + 2];
      return placeBet(BetTypes.STREET, row, amount, numbers);
    },
    [placeBet]
  );

  const placeCornerBet = useCallback(
    (corner, amount) => {
      if (corner < 0 || corner > 22) {
        toast.error("Invalid corner number.");
        return false;
      }
      const row = Math.floor(corner / 2);
      const col = corner % 2;
      const baseNumber = row * 3 + 1 + col;
      const numbers = [
        baseNumber,
        baseNumber + 1,
        baseNumber + 3,
        baseNumber + 4,
      ];
      return placeBet(BetTypes.CORNER, corner, amount, numbers);
    },
    [placeBet]
  );

  const placeLineBet = useCallback(
    (line, amount) => {
      if (line < 0 || line > 10) {
        toast.error("Invalid line number.");
        return false;
      }
      const startRow = line * 3 + 1;
      const numbers = [
        startRow,
        startRow + 1,
        startRow + 2,
        startRow + 3,
        startRow + 4,
        startRow + 5,
      ];
      return placeBet(BetTypes.LINE, line, amount, numbers);
    },
    [placeBet]
  );

  // Helper function to detect delegation certificate errors
  const isDelegationError = useCallback((error) => {
    const errorMessage = error?.message || error?.toString() || "";
    return (
      errorMessage.includes("delegation") ||
      errorMessage.includes("certificate") ||
      errorMessage.includes("Invalid canister signature") ||
      errorMessage.includes(
        "IcCanisterSignature signature could not be verified"
      ) ||
      errorMessage.includes("threshold signature") ||
      errorMessage.includes("signature could not be verified") ||
      errorMessage.includes("certificate verification failed") ||
      errorMessage.includes("failed to verify threshold signature") ||
      errorMessage.includes("Invalid delegation") ||
      errorMessage.includes("400 Bad Request")
    );
  }, []);

  // Helper function to handle delegation certificate refresh
  const handleDelegationError = useCallback(() => {
    // Clear any stored delegation data that might be stale
    try {
      ["ic-delegation", "ic-identity", "nfid-delegation", "delegation"].forEach(
        (key) => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        }
      );

      // Clear NFID specific storage
      Object.keys(localStorage).forEach((key) => {
        if (
          key.includes("nfid") ||
          key.includes("delegation") ||
          key.includes("identity")
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("Could not clear delegation storage:", e);
    }

    toast.error(
      "🔐 Authentication session expired!\n\n📋 Please:\n1. Disconnect your wallet\n2. Refresh the page\n3. Reconnect your wallet\n4. Try your bet again",
      {
        duration: 10000,
        style: {
          maxWidth: "400px",
          fontSize: "14px",
          lineHeight: "1.4",
        },
      }
    );
  }, []);

  return {
    gameState,
    loading: loading || backendLoading,
    formatBalance,
    fetchGameState,
    placeBet,
    placeStraightBet,
    placeColorBet,
    placeOddEvenBet,
    placeHighLowBet,
    placeDozenBet,
    placeColumnBet,
    placeSplitBet,
    placeStreetBet,
    placeCornerBet,
    placeLineBet,
    spin,
    withdraw,
    isDelegationError,
    handleDelegationError,
  };
};

export default useRouletteGame;
