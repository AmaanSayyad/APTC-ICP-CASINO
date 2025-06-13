"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Modal,
  Container,
  Paper,
  Chip,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ClearIcon from "@mui/icons-material/Clear";
import Button from "../../../components/Button";
import { muiStyles } from "./styles";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
// Backend Integration - Use the main backend integration hook
import useBackendIntegration from "../../../hooks/useBackendIntegration";
import { formatTokenAmount } from "../../../config/aptc-config";
import { FaPlayCircle, FaHistory, FaChartLine, FaTrophy } from "react-icons/fa";
import { motion } from "framer-motion";
import RouletteLeaderboard from "./components/RouletteLeaderboard";
import StrategyGuide from "./components/StrategyGuide";
import RoulettePayout from "./components/RoulettePayout";
import WinProbabilities from "./components/WinProbabilities";
import RouletteHistory from "./components/RouletteHistory";
import RouletteBoard from "./components/RouletteBoard";
import GameControls from "./components/GameControls";
import FeaturedPromotions from "./components/FeaturedPromotions";
import LiveGames from "./components/LiveGames";
import { useNFID } from "../../../providers/NFIDProvider";
import NFIDConnectButton from "../../../components/NFIDConnectButton";
import LocalDevBettingGuide from "../../../components/LocalDevBettingGuide";
// Import WalletResetTool
import WalletResetTool from "../../../components/WalletResetTool";
import RefreshIcon from "@mui/icons-material/Refresh";
// Import tutorials
import {
  rouletteTutorial,
  rouletteOdds,
  showRouletteTutorial,
  getBetTypeExplanation,
} from "./tutorials";

// Constants
const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

// Helper functions
const getNumberColor = (number) => {
  if (number === 0) return "green";
  return RED_NUMBERS.includes(number) ? "red" : "black";
};

// Helper functions for backend data conversion
const convertMotokoBetTypeToString = (betType) => {
  if (!betType || typeof betType !== "object") return "unknown";
  const key = Object.keys(betType)[0];
  if (!key) return "unknown";

  switch (key) {
    case "Number":
      return "number";
    case "Color":
      return "color";
    case "OddEven":
      return "oddeven";
    case "HighLow":
      return "highlow";
    case "Dozen":
      return "dozen";
    case "Column":
      return "column";
    case "Split":
      return "split";
    case "Street":
      return "street";
    case "Corner":
      return "corner";
    case "Line":
      return "line";
    default:
      return key.toLowerCase();
  }
};

// Enhanced helper function to format bet explanation from bet result with proper display names
const formatBetResultExplanation = (betResult) => {
  if (!betResult || !betResult.betType) {
    return "Unknown bet";
  }

  const betTypeString = convertMotokoBetTypeToString(betResult.betType);
  const betValue = betResult.betValue || 0;

  switch (betTypeString) {
    case "number":
      return `Number ${betValue}`;
    case "color":
      return betValue === 1 ? "Red" : "Black";
    case "oddeven":
      return betValue === 1 ? "Odd" : "Even";
    case "highlow":
      return betValue === 1 ? "High (19-36)" : "Low (1-18)";
    case "dozen":
      const dozenNames = [
        "1st Dozen (1-12)",
        "2nd Dozen (13-24)",
        "3rd Dozen (25-36)",
      ];
      return dozenNames[betValue] || `Dozen ${betValue + 1}`;
    case "column":
      return `Column ${betValue + 1}`;
    case "split":
      return "Split Bet";
    case "street":
      return "Street Bet";
    case "corner":
      return "Corner Bet";
    case "line":
      return "Line Bet";
    default:
      return "Unknown Bet";
  }
};

// Helper function to calculate win multiplier
const calculateMultiplier = (betType, amount, winnings) => {
  if (!winnings || amount === 0) return 0;
  return (winnings / amount).toFixed(2);
};

// Helper function to format time display
const formatTimeDisplay = (timestamp) => {
  try {
    // Handle nanosecond timestamps from backend
    const date = new Date(Number(timestamp) / 1000000);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  } catch (error) {
    return "Unknown";
  }
};

// Enhanced function to get win/loss statistics
const calculateBetStatistics = (betHistory) => {
  if (!betHistory || betHistory.length === 0) {
    return {
      totalBets: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalWagered: 0,
      totalWon: 0,
      netProfit: 0,
    };
  }

  const stats = betHistory.reduce(
    (acc, bet) => {
      const amount = Number(bet.amount) / 100000000; // Convert from smallest unit
      const winnings = bet.won ? Number(bet.winnings) / 100000000 : 0;

      return {
        totalBets: acc.totalBets + 1,
        wins: acc.wins + (bet.won ? 1 : 0),
        losses: acc.losses + (bet.won ? 0 : 1),
        totalWagered: acc.totalWagered + amount,
        totalWon: acc.totalWon + winnings,
      };
    },
    { totalBets: 0, wins: 0, losses: 0, totalWagered: 0, totalWon: 0 }
  );

  return {
    ...stats,
    winRate:
      stats.totalBets > 0
        ? Math.round((stats.wins / stats.totalBets) * 100)
        : 0,
    netProfit: stats.totalWon - stats.totalWagered,
  };
};

// Helper function to get the result number color
const getResultNumberColor = (number) => {
  if (number === 0) return "#14D854"; // Green for 0
  const redNumbers = [
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ];
  return redNumbers.includes(number) ? "#d82633" : "#333"; // Red or Black
};

export default function GameRoulette() {
  // Backend Integration - Use main backend integration hook
  const {
    roulette,
    balance: aptcBalance,
    formatBalance: formatTokenBalance,
    loading,
    error,
    isConnected: backendConnected,
    principal,
    fetchBalance,
  } = useBackendIntegration();

  // NFID Authentication
  const { isConnected } = useNFID();

  // Game State from Backend
  const [gameInfo, setGameInfo] = useState(null);
  const [currentBets, setCurrentBets] = useState([]);
  const [recentNumbers, setRecentNumbers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [roundStats, setRoundStats] = useState([]);
  const [lastSpinResult, setLastSpinResult] = useState(null);
  const [userBetHistory, setUserBetHistory] = useState([]);

  // Enhanced UI State
  const [betAmount, setBetAmount] = useState(1);
  const [placedBets, setPlacedBets] = useState([]); // Track visual bets
  const [currentRound, setCurrentRound] = useState({
    roundId: null,
    status: "waiting", // 'betting', 'spinning', 'completed'
    timeRemaining: 0,
    totalBets: 0,
    totalPayout: 0,
  });
  const [recentBets, setRecentBets] = useState([]); // Recent bet history
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [isSpinning, setIsSpinning] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [showSpinResult, setShowSpinResult] = useState(false);

  // State for showing CLI guidance
  const [showCLIGuidance, setShowCLIGuidance] = useState(false);

  // State for auto-spin and result display
  const [autoSpinEnabled, setAutoSpinEnabled] = useState(false); // Disabled by default
  const [showBetResult, setShowBetResult] = useState(false);
  const [betResultData, setBetResultData] = useState(null);
  const [pendingAutoSpin, setPendingAutoSpin] = useState(false);

  // Auto-close bet result modal after 8 seconds
  useEffect(() => {
    if (showBetResult) {
      const timer = setTimeout(() => {
        setShowBetResult(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showBetResult]);

  // State for wallet reset modal
  const [showWalletReset, setShowWalletReset] = useState(false);

  // State for tutorial modal
  const [showTutorial, setShowTutorial] = useState(false);

  // Create theme
  const theme = createTheme(muiStyles["dark"]);

  // Fetch game state from backend
  const fetchGameState = useCallback(async () => {
    if (!roulette || !backendConnected) {
      console.log("❌ Cannot fetch game state - missing dependencies", {
        roulette: !!roulette,
        backendConnected,
      });
      return;
    }

    setGameLoading(true);
    try {
      console.log("🎰 Fetching game state from backend...");

      // Fetch all game data in parallel
      const [gameInfoData, currentBetsData, recentNumbersData, roundStatsData] =
        await Promise.all([
          roulette.getGameInfo(),
          roulette.getCurrentBets(),
          roulette.getRecentNumbers(),
          roulette.getRoundStats(10), // Get last 10 rounds
        ]);

      console.log("📊 Raw data from backend:", {
        gameInfoData,
        currentBetsData: currentBetsData?.length || 0,
        recentNumbersData,
        recentNumbersLength: recentNumbersData?.length || 0,
        roundStatsData: roundStatsData?.length || 0,
      });

      console.log("🔍 Detailed recentNumbersData:", recentNumbersData);

      setGameInfo(gameInfoData);
      setCurrentBets(currentBetsData);
      // Convert string array to number array for proper display logic
      setRecentNumbers(
        recentNumbersData ? recentNumbersData.map((num) => Number(num)) : []
      );
      setRoundStats(roundStatsData);

      // Fetch user-specific data if connected
      if (isConnected && principal) {
        try {
          const [userStatsData, betHistoryData] = await Promise.all([
            roulette.getUserStats().catch((err) => {
              console.warn("Could not fetch user stats:", err);
              return null;
            }),
            roulette.getBetHistory(20).catch((err) => {
              console.warn("Could not fetch bet history:", err);
              return [];
            }),
          ]);
          setUserStats(userStatsData);

          // Filter and format bet history for current user
          if (betHistoryData && Array.isArray(betHistoryData)) {
            const userBets = betHistoryData.filter(
              (bet) => bet.player?.toString() === principal.toString()
            );
            setUserBetHistory(userBets);
          } else {
            setUserBetHistory([]);
          }
        } catch (err) {
          console.warn("Could not fetch user data:", err);
          setUserStats(null);
          setUserBetHistory([]);
        }
      } else {
        // Clear user data when not connected
        setUserStats(null);
        setUserBetHistory([]);
      }

      console.log("✅ Game state fetched successfully:", {
        gameInfo: gameInfoData,
        currentBets: currentBetsData.length,
        recentNumbers: recentNumbersData.length,
        roundStats: roundStatsData.length,
      });
    } catch (err) {
      console.error("❌ Failed to fetch game state:", err);
      setNotification({
        open: true,
        message: `Failed to fetch game state: ${err.message}`,
        severity: "error",
      });
    } finally {
      setGameLoading(false);
    }
  }, [roulette, backendConnected, isConnected, principal]);

  // Enhanced bet validation function
  const validateBet = useCallback(
    (betType, betValue, amount) => {
      // Check if connected
      if (!isConnected || !backendConnected) {
        return { valid: false, error: "Please connect your wallet first" };
      }

      // Check bet amount
      if (!amount || amount <= 0) {
        return { valid: false, error: "Please enter a valid bet amount" };
      }

      // Check balance
      if (aptcBalance && parseFloat(formatTokenBalance(aptcBalance)) < amount) {
        return {
          valid: false,
          error: `Insufficient balance. You have ${formatTokenBalance(
            aptcBalance
          )} APTC but need ${amount} APTC`,
        };
      }

      // Validate bet type and value ranges
      switch (betType) {
        case "number":
          if (betValue < 0 || betValue > 36) {
            return { valid: false, error: "Number must be between 0 and 36" };
          }
          break;
        case "dozen":
          if (betValue < 0 || betValue > 2) {
            return { valid: false, error: "Invalid dozen selection" };
          }
          break;
        case "column":
          if (betValue < 0 || betValue > 2) {
            return { valid: false, error: "Invalid column selection" };
          }
          break;
        case "red":
        case "black":
        case "odd":
        case "even":
        case "high":
        case "low":
          // These are valid as-is
          break;
        default:
          return { valid: false, error: "Invalid bet type" };
      }

      return { valid: true };
    },
    [isConnected, backendConnected, aptcBalance, formatTokenBalance]
  );

  // Enhanced bet placement function with visual feedback
  const placeBet = useCallback(
    async (betType, betValue, amount) => {
      // Debug logging
      console.log("placeBet called with:", { betType, betValue, amount });

      // Validate bet first
      const validation = validateBet(betType, betValue, amount);
      if (!validation.valid) {
        setNotification({
          open: true,
          message: validation.error,
          severity: "warning",
        });
        return;
      }

      // Create visual bet immediately for better UX
      const visualBet = {
        id: Date.now(),
        betType,
        betValue,
        amount,
        timestamp: new Date(),
        status: "pending",
      };

      // Add to placed bets for visual feedback
      setPlacedBets((prev) => [...prev, visualBet]);

      // Show immediate feedback
      setNotification({
        open: true,
        message: `🎯 Placing ${amount} APTC bet on ${getBetTypeExplanation(
          betType,
          betValue
        )}...`,
        severity: "info",
      });

      try {
        console.log("🎲 Placing bet:", { betType, betValue, amount });

        // Place bet using backend integration
        const result = await roulette.placeBet(betType, betValue, amount, []);

        console.log("🎲 Bet placement result:", result);

        // Update visual bet status
        setPlacedBets((prev) =>
          prev.map((bet) =>
            bet.id === visualBet.id ? { ...bet, status: "confirmed" } : bet
          )
        );

        // Add to recent bets
        setRecentBets((prev) => [
          {
            ...visualBet,
            status: "confirmed",
            explanation: getBetTypeExplanation(betType, betValue),
          },
          ...prev.slice(0, 9), // Keep last 10 bets
        ]);

        // Update current round
        setCurrentRound((prev) => ({
          ...prev,
          status: "betting",
          totalBets: prev.totalBets + amount,
          roundId: prev.roundId || Date.now(),
        }));

        setNotification({
          open: true,
          message: `✅ Bet placed successfully: ${amount} APTC on ${getBetTypeExplanation(
            betType,
            betValue
          )}`,
          severity: "success",
        });

        // Refresh game state and balance
        await Promise.all([fetchGameState(), fetchBalance()]);

        // Auto-spin logic: if enabled and this is the first bet of the round
        if (autoSpinEnabled && !pendingAutoSpin && placedBets.length === 0) {
          setPendingAutoSpin(true);
          setNotification({
            open: true,
            message:
              "🎰 Auto-spin enabled: Will spin in 10 seconds (place more bets quickly!)",
            severity: "info",
          });

          // Trigger auto-spin after delay to allow multiple bets
          setTimeout(async () => {
            try {
              // Only auto-spin if there are still pending bets and no manual spin occurred
              if (pendingAutoSpin) {
                await handleAutoSpinAndShowResult();
              }
            } catch (error) {
              console.error("Auto-spin error:", error);
              setPendingAutoSpin(false);
            }
          }, 10000); // 10 seconds delay
        }

        // Check if we can auto-spin
        if (currentBets.length === 0) {
          setNotification({
            open: true,
            message:
              "🎰 Round starting soon! You can spin manually or wait for auto-spin.",
            severity: "info",
          });
        }
      } catch (error) {
        console.error("❌ Bet placement error:", error);

        // Remove failed bet from visual bets
        setPlacedBets((prev) => prev.filter((bet) => bet.id !== visualBet.id));

        // Enhanced error handling with user-friendly messages
        let errorMessage = "Failed to place bet";
        let severity = "error";

        if (
          error?.message?.includes("invalid delegation expiry") ||
          error?.message?.includes("delegation has expired")
        ) {
          errorMessage =
            "🔐 Wallet delegation expired. Please reconnect your wallet.";
          severity = "warning";
        } else if (error?.message?.includes("Insufficient balance")) {
          errorMessage = `❌ Insufficient APTC balance. You need ${amount} APTC plus fees.`;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        setNotification({
          open: true,
          message: errorMessage,
          severity,
        });
      }
    },
    [validateBet, roulette, fetchGameState, fetchBalance, currentBets.length]
  );

  // Enhanced manual spin function
  const handleManualSpin = async () => {
    if (!isConnected) {
      setNotification({
        open: true,
        message: "Please connect your wallet first!",
        severity: "warning",
      });
      return;
    }

    // Cancel pending auto-spin if user manually spins
    if (pendingAutoSpin) {
      setPendingAutoSpin(false);
    }

    // Check if there are any bets placed (both local and backend)
    const hasLocalBets = placedBets.length > 0;
    const hasBackendBets = currentBets.length > 0;

    if (!hasLocalBets && !hasBackendBets) {
      setNotification({
        open: true,
        message: "Please place at least one bet before spinning!",
        severity: "warning",
      });
      return;
    }

    // If we have local bets but no backend bets, there might be a sync issue
    if (hasLocalBets && !hasBackendBets) {
      setNotification({
        open: true,
        message:
          "⏳ Waiting for bets to be confirmed on the blockchain. Please wait a moment and try again.",
        severity: "info",
      });

      // Try to refresh game state and wait a bit
      try {
        await fetchGameState();
        // Wait a moment for state to update
        setTimeout(async () => {
          if (currentBets.length > 0) {
            await performSpinAndShowResult(false);
          } else {
            setNotification({
              open: true,
              message:
                "❌ Bets are still being processed. Please wait a bit longer before spinning.",
              severity: "warning",
            });
          }
        }, 2000);
      } catch (error) {
        console.error("Failed to refresh game state:", error);
      }
      return;
    }

    await performSpinAndShowResult(false);
  };

  // Auto-spin with result display
  const handleAutoSpinAndShowResult = async () => {
    if (!pendingAutoSpin) {
      return; // Don't auto-spin if it was cancelled
    }
    setPendingAutoSpin(false);
    await performSpinAndShowResult(true);
  };

  // Core spin function that handles both manual and auto spins
  const performSpinAndShowResult = async (isAutoSpin = false) => {
    setIsSpinning(true);
    setCurrentRound((prev) => ({ ...prev, status: "spinning" }));

    try {
      console.log(`🎰 Starting ${isAutoSpin ? "auto" : "manual"} spin...`);

      // Double-check for bets before spinning
      console.log("🔍 Checking for bets before spinning:", {
        placedBets: placedBets.length,
        currentBets: currentBets.length,
        principal: principal?.toString(),
      });

      // Refresh current bets from backend to ensure we have the latest state
      try {
        const latestBets = await roulette.getCurrentBets();
        console.log("📊 Latest bets from backend:", latestBets);
        setCurrentBets(latestBets || []);

        if (!latestBets || latestBets.length === 0) {
          throw new Error(
            "No bets found on the blockchain. Please place a bet first and wait for confirmation before spinning."
          );
        }
      } catch (error) {
        console.error("❌ Failed to fetch current bets:", error);
        throw new Error(
          "Failed to verify bets. Please ensure your bets are confirmed before spinning."
        );
      }

      // Check what methods are available on the roulette object
      console.log(
        "🔍 Available roulette methods:",
        Object.getOwnPropertyNames(roulette)
      );

      let spinResult;
      try {
        // Try the standard spin method first
        if (typeof roulette.spin === "function") {
          console.log("🎰 Using roulette.spin() method");
          spinResult = await roulette.spin();
        } else if (typeof roulette.spinWheel === "function") {
          console.log("🎰 Using roulette.spinWheel() method");
          spinResult = await roulette.spinWheel();
        } else if (typeof roulette.performSpin === "function") {
          console.log("🎰 Using roulette.performSpin() method");
          spinResult = await roulette.performSpin();
        } else if (typeof roulette.manualSpin === "function") {
          console.log("🎰 Using roulette.manualSpin() method");
          spinResult = await roulette.manualSpin();
        } else {
          // List available methods for debugging
          const availableMethods = Object.getOwnPropertyNames(roulette).filter(
            (prop) => typeof roulette[prop] === "function"
          );
          console.log(
            "❌ No spin method found. Available methods:",
            availableMethods
          );
          throw new Error(
            "No spin method available on roulette canister. Available methods: " +
              availableMethods.join(", ")
          );
        }
      } catch (error) {
        console.error("❌ Spin method error:", error);

        // If the error is about no bets, provide helpful guidance
        if (error.message && error.message.includes("No bets placed")) {
          throw new Error(
            "No bets found for this round. Please:\n1. Place a bet\n2. Wait for confirmation (check the game state)\n3. Then spin the wheel"
          );
        }

        throw error;
      }

      console.log("🎲 Raw spin result:", spinResult);

      // Handle different result formats and extract winning number
      if (spinResult && typeof spinResult === "object") {
        let actualResult;
        let winningNumber = null;

        // Handle Result<SpinResult, Text> from backend
        if (spinResult.ok) {
          actualResult = spinResult.ok;
          console.log("✅ Spin result (Ok format):", actualResult);
        } else if (spinResult.err) {
          throw new Error(spinResult.err);
        } else if (spinResult.winningNumber !== undefined) {
          // Handle direct SpinResult object (not wrapped in Result)
          actualResult = spinResult;
          console.log("✅ Spin result (direct format):", actualResult);
        } else {
          throw new Error(
            "Invalid spin result format: " + JSON.stringify(spinResult)
          );
        }

        // Extract winning number with multiple fallbacks
        if (actualResult.winningNumber !== undefined) {
          winningNumber = Number(actualResult.winningNumber);
        } else if (actualResult.number !== undefined) {
          winningNumber = Number(actualResult.number);
        } else if (actualResult.result !== undefined) {
          winningNumber = Number(actualResult.result);
        } else if (typeof actualResult === "number") {
          winningNumber = Number(actualResult);
        } else {
          // Default to a random number for demo purposes if we can't extract it
          winningNumber = Math.floor(Math.random() * 37);
          console.warn(
            "⚠️ Could not extract winning number, using random:",
            winningNumber
          );
        }

        console.log("🎯 Extracted winning number:", winningNumber);

        // Validate winning number is within valid range
        if (winningNumber < 0 || winningNumber > 36) {
          console.warn(
            "⚠️ Invalid winning number, defaulting to 0:",
            winningNumber
          );
          winningNumber = 0;
        }

        // Update recent numbers
        setRecentNumbers((prev) => [winningNumber, ...prev.slice(0, 9)]);

        // Calculate results for visual feedback
        const userResults =
          actualResult.results?.filter(
            (result) => result.player.toString() === principal.toString()
          ) || [];

        const totalWinnings = userResults.reduce(
          (sum, result) => sum + (result.winnings || 0),
          0
        );

        // Update current round with results
        setCurrentRound((prev) => ({
          ...prev,
          status: "completed",
          winningNumber: winningNumber,
          totalPayout: totalWinnings,
        }));

        // Clear placed bets
        setPlacedBets([]);

        // Trigger balance refresh immediately after spin
        console.log("🔄 Triggering balance refresh after spin");

        // Method 1: Use global function if available
        if (typeof window !== "undefined" && window.refreshTokenBalance) {
          window.refreshTokenBalance();
        }

        // Method 2: Dispatch custom event
        const gameResultEvent = new CustomEvent("gameResult", {
          detail: {
            winningNumber: winningNumber,
            totalWinnings,
            isAutoSpin,
          },
        });
        window.dispatchEvent(gameResultEvent);

        // Always show result modal with winning number, even if user has no bets
        const betResultInfo = {
          winningNumber: winningNumber,
          isWin: totalWinnings > 0,
          totalWinnings,
          userBets: userResults.map((result) => ({
            amount: result.amount || 0,
            winnings: result.winnings || 0,
            betType: result.betType,
            betValue: result.betValue,
            multiplier:
              result.winnings && result.amount
                ? (result.winnings / result.amount).toFixed(2)
                : "0.00",
          })),
          spinType: isAutoSpin ? "Auto" : "Manual",
          hadBets: userResults.length > 0, // Track if user had bets
        };

        console.log("🎊 Bet result info with winning number:", betResultInfo);

        // Show detailed result modal
        setBetResultData(betResultInfo);
        setShowBetResult(true);

        // Show result notification
        if (totalWinnings > 0) {
          setNotification({
            open: true,
            message: `🎉 Number ${winningNumber} wins! You won ${formatTokenAmount(
              totalWinnings,
              8
            )} APTC! (${isAutoSpin ? "Auto" : "Manual"} Spin)`,
            severity: "success",
          });
        } else if (userResults.length > 0) {
          setNotification({
            open: true,
            message: `😔 Number ${winningNumber} came up. Better luck next time! (${
              isAutoSpin ? "Auto" : "Manual"
            } Spin)`,
            severity: "info",
          });
        } else {
          // Show notification even if no bets were placed
          setNotification({
            open: true,
            message: `🎲 Number ${winningNumber} came up! (${
              isAutoSpin ? "Auto" : "Manual"
            } Spin)`,
            severity: "info",
          });
        }

        // Reset for next round after delay
        setTimeout(() => {
          setCurrentRound({
            roundId: null,
            status: "waiting",
            timeRemaining: 0,
            totalBets: 0,
            totalPayout: 0,
          });
        }, 5000);

        // Refresh game state and balance with delay to ensure transaction is processed
        setTimeout(async () => {
          await Promise.all([fetchGameState(), fetchBalance()]);
        }, 1000);
      } else {
        throw new Error("No spin result received or invalid format");
      }
    } catch (error) {
      console.error("❌ Spin error:", error);
      setCurrentRound((prev) => ({ ...prev, status: "waiting" }));

      // Enhanced error messages
      let errorMessage = "Failed to spin";
      if (error.message.includes("No spin method available")) {
        errorMessage =
          "⚠️ Spin functionality not available. Please contact support.";
      } else if (
        error.message.includes("No bets placed") ||
        error.message.includes("No bets found")
      ) {
        errorMessage =
          "❌ No bets found for this round. Please place a bet and wait for confirmation before spinning.";
      } else if (error.message.includes("delegation")) {
        errorMessage = "🔐 Wallet connection expired. Please reconnect.";
      } else if (error.message.includes("Failed to verify bets")) {
        errorMessage =
          "⏳ Bets are still being processed. Please wait a moment and try again.";
      } else {
        errorMessage = `❌ ${error.message}`;
      }

      setNotification({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setIsSpinning(false);

      // Final balance refresh
      setTimeout(() => {
        if (typeof window !== "undefined" && window.refreshTokenBalance) {
          window.refreshTokenBalance();
        }
      }, 2000);
    }
  };

  // Refresh game state function
  const handleRefreshGameState = async () => {
    try {
      await fetchGameState();
      await fetchBalance();
      setNotification({
        open: true,
        message: "Game state refreshed successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Refresh error:", error);
      setNotification({
        open: true,
        message: `Failed to refresh: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Enhanced game state check function
  const checkGameState = useCallback(async () => {
    if (!roulette) return;

    try {
      const [gameInfo, currentBetsData] = await Promise.all([
        roulette.getGameInfo(),
        roulette.getCurrentBets(),
      ]);

      console.log("🎮 Game State Check:", {
        currentBets: currentBetsData?.length || 0,
        gameInfo: gameInfo,
        hasActiveBets: currentBetsData && currentBetsData.length > 0,
      });

      // Update local state
      setCurrentBets(currentBetsData || []);
      setGameInfo(gameInfo);

      // Check if auto-spin should be triggered (for informational purposes)
      if (currentBetsData && currentBetsData.length > 0) {
        console.log("🎰 Bets detected, auto-spin mechanism active on backend");
      }
    } catch (error) {
      console.warn("⚠️ Game state check failed:", error);
    }
  }, [roulette]);

  // Fetch game state when component mounts or connection changes
  useEffect(() => {
    console.log("🔄 UseEffect triggered - checking connections:", {
      backendConnected,
      roulette: !!roulette,
    });

    if (backendConnected && roulette) {
      console.log(
        "✅ Both backend and roulette available, fetching game state..."
      );
      fetchGameState();

      // Set up periodic refresh every 10 seconds for game state
      const interval = setInterval(() => {
        console.log("🔄 Periodic refresh of game state...");
        fetchGameState();
      }, 10000);

      return () => {
        console.log("🧹 Cleaning up game state refresh interval");
        clearInterval(interval);
      };
    } else {
      console.log(
        "⏳ Waiting for backend connection or roulette initialization..."
      );
    }
  }, [backendConnected, roulette, fetchGameState]);

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
          py: 4,
          background: "linear-gradient(180deg, #0D0415 0%, #1F0B2C 100%)",
          overflow: "hidden",
        }}
      >
        {/* Main Game Container - Full Width */}
        <Box sx={{ width: "100%", px: { xs: 2, md: 4 }, marginTop: "110px" }}>
          {/* Game Title */}
          <Typography
            variant="h3"
            sx={{
              textAlign: "center",
              mb: 4,
              color: "white",
              textShadow: "0 4px 8px rgba(0,0,0,0.6)",
              fontWeight: "bold",
              background: "linear-gradient(90deg, #FFF, #d82633)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            European Roulette
          </Typography>

          {/* Current Round Status */}
          <Box sx={{ maxWidth: "1400px", mx: "auto", mb: 3 }}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                borderRadius: 2,
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(104, 29, 219, 0.2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="h6" color="white">
                  Round Status:
                </Typography>
                <Chip
                  label={
                    currentRound.status === "waiting"
                      ? "Waiting for Bets"
                      : currentRound.status === "betting"
                      ? "Betting Open"
                      : currentRound.status === "spinning"
                      ? "Spinning..."
                      : "Round Complete"
                  }
                  color={
                    currentRound.status === "betting"
                      ? "success"
                      : currentRound.status === "spinning"
                      ? "warning"
                      : currentRound.status === "completed"
                      ? "info"
                      : "default"
                  }
                  sx={{ fontWeight: "bold" }}
                />
                {currentRound.winningNumber !== undefined && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography color="white">Winning Number:</Typography>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        backgroundColor:
                          currentRound.winningNumber === 0
                            ? "#14D854"
                            : [
                                1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25,
                                27, 30, 32, 34, 36,
                              ].includes(currentRound.winningNumber)
                            ? "#d82633"
                            : "#333",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        border: "2px solid rgba(255,255,255,0.3)",
                      }}
                    >
                      {currentRound.winningNumber}
                    </Box>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    color="rgba(255,255,255,0.7)"
                    sx={{ fontWeight: "medium" }}
                  >
                    Total Bets
                  </Typography>
                  <Typography
                    variant="h6"
                    color="#14D854"
                    fontWeight="bold"
                    sx={{ lineHeight: 1 }}
                  >
                    {currentRound.totalBets} APTC
                  </Typography>
                </Box>
                {currentRound.totalPayout > 0 && (
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="caption"
                      color="rgba(255,255,255,0.7)"
                      sx={{ fontWeight: "medium" }}
                    >
                      Your Winnings
                    </Typography>
                    <Typography
                      variant="h6"
                      color="#FFD700"
                      fontWeight="bold"
                      sx={{ lineHeight: 1 }}
                    >
                      {currentRound.totalPayout} APTC
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>

          {/* Roulette Board Section - Full Width */}
          <Box
            sx={{
              mb: 5,
              maxWidth: "1400px",
              mx: "auto",
              backgroundColor: "rgba(0,0,0,0.4)",
              borderRadius: "16px",
              p: { xs: 2, md: 4 },
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              border: "1px solid rgba(104, 29, 219, 0.2)",
            }}
          >
            {/* Game Board */}
            <RouletteBoard
              onNumberClick={placeBet}
              betAmount={betAmount}
              loading={gameLoading || isSpinning}
              isConnected={isConnected}
              placedBets={placedBets}
            />

            {/* Active Bets Display */}
            {placedBets.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" color="white" sx={{ mb: 2 }}>
                  Your Active Bets ({placedBets.length}):
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {placedBets.map((bet) => (
                    <Chip
                      key={bet.id}
                      label={`${bet.amount} APTC on ${getBetTypeExplanation(
                        bet.betType,
                        bet.betValue
                      )}`}
                      color={bet.status === "confirmed" ? "success" : "warning"}
                      size="small"
                      sx={{
                        fontWeight: "bold",
                        "& .MuiChip-label": {
                          fontSize: "0.75rem",
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Bet Amount Controls */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 3,
                mb: 2,
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: "white",
                  alignSelf: "center",
                  mr: 2,
                }}
              >
                Bet Amount:
              </Typography>
              {[1, 5, 10, 25, 50, 100].map((amount) => (
                <Button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  variant={betAmount === amount ? "contained" : "outlined"}
                  sx={{
                    minWidth: "60px",
                    bgcolor: betAmount === amount ? "#681DDB" : "transparent",
                    borderColor: "#681DDB",
                    color: betAmount === amount ? "white" : "#681DDB",
                    "&:hover": {
                      bgcolor:
                        betAmount === amount
                          ? "#681DDB"
                          : "rgba(104, 29, 219, 0.1)",
                    },
                    borderRadius: "8px",
                    boxShadow:
                      betAmount === amount
                        ? "0 4px 10px rgba(104, 29, 219, 0.5)"
                        : "none",
                    transition: "all 0.2s ease",
                    transform:
                      betAmount === amount ? "scale(1.05)" : "scale(1)",
                    fontWeight: "bold",
                  }}
                >
                  {amount}
                </Button>
              ))}
            </Box>

            {/* Game Controls */}
            <GameControls
              onSpin={handleManualSpin}
              onRefresh={handleRefreshGameState}
              isSpinning={isSpinning}
              isLoading={gameLoading}
              isConnected={isConnected}
            />

            {/* Status Indicator */}
            {isConnected && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(104, 29, 219, 0.2)",
                  textAlign: "center",
                }}
              >
                <Typography variant="body1" color="white">
                  {isSpinning
                    ? "🎰 Spinning the wheel..."
                    : placedBets.length > 0
                    ? "✅ Bets placed! Click 'Spin the Wheel' to play"
                    : "🎯 Click numbers on the board to place bets"}
                </Typography>
                {placedBets.length > 0 && !isSpinning && (
                  <Typography
                    variant="body2"
                    color="rgba(255,255,255,0.7)"
                    sx={{ mt: 1 }}
                  >
                    Total bets:{" "}
                    {placedBets.reduce((sum, bet) => sum + bet.amount, 0)} APTC
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Auto-Spin Settings */}
          <Box sx={{ maxWidth: "1400px", mx: "auto", mb: 3 }}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                borderRadius: 2,
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(104, 29, 219, 0.2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="h6" color="white">
                  Auto-Spin Settings:
                </Typography>
                <Chip
                  label={autoSpinEnabled ? "Enabled" : "Disabled"}
                  color={autoSpinEnabled ? "success" : "error"}
                  onClick={() => setAutoSpinEnabled(!autoSpinEnabled)}
                  sx={{
                    fontWeight: "bold",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: autoSpinEnabled
                        ? "rgba(76, 175, 80, 0.2)"
                        : "rgba(244, 67, 54, 0.2)",
                    },
                  }}
                />
                {pendingAutoSpin && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} color="primary" />
                    <Typography variant="body2" color="white">
                      Auto-spinning soon...
                    </Typography>
                  </Box>
                )}
              </Box>

              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                {autoSpinEnabled
                  ? "🎰 Wheel will spin automatically after placing bets"
                  : "⏸️ Manual spin required after placing bets"}
              </Typography>
            </Paper>
          </Box>

          {/* Game Statistics & Info Section */}
          <Grid
            container
            spacing={4}
            sx={{ mb: 6, maxWidth: "1600px", mx: "auto" }}
          >
            {/* Recent Bets & Bet History */}
            <Grid item xs={12} md={6} lg={3}>
              <Paper
                elevation={5}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: "rgba(9, 0, 5, 0.8)",
                  border: "1px solid rgba(104, 29, 219, 0.2)",
                  height: "100%",
                }}
              >
                <Typography variant="h6" color="white" sx={{ mb: 2 }}>
                  Bet History
                </Typography>

                {/* Show recent local bets first (pending/confirmed) */}
                {recentBets.length > 0 && (
                  <>
                    <Typography
                      variant="subtitle2"
                      color="rgba(255,255,255,0.8)"
                      sx={{ mb: 1 }}
                    >
                      Current Session ({recentBets.length})
                    </Typography>
                    <Box sx={{ maxHeight: 150, overflow: "auto", mb: 2 }}>
                      {recentBets.map((bet, index) => (
                        <Box
                          key={bet.id}
                          sx={{
                            p: 1.5,
                            mb: 1,
                            borderRadius: 1,
                            background:
                              bet.status === "confirmed"
                                ? "rgba(20, 216, 84, 0.1)"
                                : "rgba(255, 193, 7, 0.1)",
                            border:
                              bet.status === "confirmed"
                                ? "1px solid rgba(20, 216, 84, 0.2)"
                                : "1px solid rgba(255, 193, 7, 0.2)",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              variant="body2"
                              color="white"
                              fontWeight="bold"
                            >
                              {bet.amount} APTC
                            </Typography>
                            <Chip
                              label={
                                bet.status === "confirmed"
                                  ? "Confirmed"
                                  : "Pending"
                              }
                              size="small"
                              color={
                                bet.status === "confirmed"
                                  ? "success"
                                  : "warning"
                              }
                              sx={{ fontSize: "0.6rem", height: "16px" }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            color="rgba(255,255,255,0.7)"
                          >
                            {bet.explanation}
                          </Typography>
                          <Typography
                            variant="caption"
                            display="block"
                            color="rgba(255,255,255,0.5)"
                          >
                            {bet.timestamp.toLocaleTimeString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}

                {/* Enhanced Historical Bet Results from Backend */}
                {userBetHistory && userBetHistory.length > 0 ? (
                  <>
                    <Typography
                      variant="subtitle2"
                      color="rgba(255,255,255,0.8)"
                      sx={{
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <FaHistory size={12} />
                      Bet History ({userBetHistory.length})
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                      {userBetHistory.map((betResult, index) => {
                        const explanation =
                          formatBetResultExplanation(betResult);
                        const isWin = betResult.won;
                        const amount = Number(betResult.amount) / 100000000;
                        const winnings = isWin
                          ? Number(betResult.winnings) / 100000000
                          : 0;
                        const multiplier =
                          isWin && amount > 0
                            ? calculateMultiplier(
                                betResult.betType,
                                amount,
                                winnings
                              )
                            : 0;
                        const resultColor = getResultNumberColor(
                          betResult.number
                        );

                        return (
                          <Box
                            key={`${betResult.round}-${index}`}
                            sx={{
                              p: 1.5,
                              mb: 1,
                              borderRadius: 1,
                              background: isWin
                                ? "linear-gradient(135deg, rgba(20, 216, 84, 0.15), rgba(20, 216, 84, 0.08))"
                                : "linear-gradient(135deg, rgba(220, 38, 51, 0.15), rgba(220, 38, 51, 0.08))",
                              border: isWin
                                ? "1px solid rgba(20, 216, 84, 0.3)"
                                : "1px solid rgba(220, 38, 51, 0.3)",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                transform: "translateY(-1px)",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                              },
                            }}
                          >
                            {/* Header Row */}
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 0.5,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  color="white"
                                  fontWeight="bold"
                                >
                                  {amount.toFixed(2)} APTC
                                </Typography>
                                {isWin && multiplier > 0 && (
                                  <Chip
                                    label={`${multiplier}x`}
                                    size="small"
                                    sx={{
                                      backgroundColor: "#FFD700",
                                      color: "#000",
                                      fontSize: "0.6rem",
                                      height: "16px",
                                      fontWeight: "bold",
                                    }}
                                  />
                                )}
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                {/* Result Number */}
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    backgroundColor: resultColor,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    mr: 0.5,
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    fontWeight="bold"
                                    color="white"
                                    sx={{ fontSize: "0.7rem" }}
                                  >
                                    {betResult.number}
                                  </Typography>
                                </Box>
                                {/* Win/Loss Indicator */}
                                {isWin ? (
                                  <Chip
                                    icon={<FaTrophy size={10} />}
                                    label={`+${winnings.toFixed(2)}`}
                                    size="small"
                                    sx={{
                                      backgroundColor: "#14D854",
                                      color: "white",
                                      fontSize: "0.6rem",
                                      height: "20px",
                                      fontWeight: "bold",
                                      "& .MuiChip-icon": {
                                        color: "white",
                                        fontSize: "10px",
                                      },
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    icon={
                                      <ClearIcon
                                        sx={{ fontSize: "10px !important" }}
                                      />
                                    }
                                    label="LOSS"
                                    size="small"
                                    sx={{
                                      backgroundColor: "#DC2633",
                                      color: "white",
                                      fontSize: "0.6rem",
                                      height: "20px",
                                      fontWeight: "bold",
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>

                            {/* Bet Details */}
                            <Typography
                              variant="caption"
                              color="rgba(255,255,255,0.8)"
                              display="block"
                              sx={{ fontWeight: "medium" }}
                            >
                              {explanation}
                            </Typography>

                            {/* Time and Round Info */}
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mt: 0.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="rgba(255,255,255,0.5)"
                              >
                                Round #{betResult.round}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="rgba(255,255,255,0.5)"
                              >
                                {formatTimeDisplay(betResult.timestamp)}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </>
                ) : (
                  recentBets.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 3 }}>
                      <Typography
                        color="rgba(255,255,255,0.7)"
                        variant="body2"
                        sx={{ mb: 1 }}
                      >
                        No bet history yet
                      </Typography>
                      <Typography
                        color="rgba(255,255,255,0.5)"
                        variant="caption"
                      >
                        Start betting to see your results here!
                      </Typography>
                    </Box>
                  )
                )}

                {/* Enhanced Summary Statistics */}
                {(userStats || userBetHistory) && (
                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="rgba(255,255,255,0.8)"
                      sx={{
                        mb: 1.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <FaChartLine size={12} />
                      Session Statistics
                    </Typography>

                    {/* Calculate statistics from bet history */}
                    {(() => {
                      const stats = userBetHistory
                        ? calculateBetStatistics(userBetHistory)
                        : null;
                      const sessionStats = userStats || stats;

                      if (!sessionStats) return null;

                      return (
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: 1.5,
                            mb: 1.5,
                          }}
                        >
                          {/* Total Bets */}
                          <Box
                            sx={{
                              textAlign: "center",
                              p: 1.5,
                              borderRadius: 1,
                              background: "rgba(104, 29, 219, 0.1)",
                              border: "1px solid rgba(104, 29, 219, 0.2)",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="rgba(255,255,255,0.7)"
                              display="block"
                            >
                              Total Bets
                            </Typography>
                            <Typography
                              variant="h6"
                              color="#681DDB"
                              fontWeight="bold"
                            >
                              {sessionStats.totalBets || stats?.totalBets || 0}
                            </Typography>
                          </Box>

                          {/* Win Rate */}
                          <Box
                            sx={{
                              textAlign: "center",
                              p: 1.5,
                              borderRadius: 1,
                              background: "rgba(20, 216, 84, 0.1)",
                              border: "1px solid rgba(20, 216, 84, 0.2)",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="rgba(255,255,255,0.7)"
                              display="block"
                            >
                              Win Rate
                            </Typography>
                            <Typography
                              variant="h6"
                              color="#14D854"
                              fontWeight="bold"
                            >
                              {stats?.winRate ||
                                (sessionStats.totalBets > 0
                                  ? Math.round(
                                      ((sessionStats.totalWon || 0) /
                                        sessionStats.totalBets) *
                                        100
                                    )
                                  : 0)}
                              %
                            </Typography>
                          </Box>

                          {/* Total Wagered */}
                          <Box
                            sx={{
                              textAlign: "center",
                              p: 1.5,
                              borderRadius: 1,
                              background: "rgba(255, 193, 7, 0.1)",
                              border: "1px solid rgba(255, 193, 7, 0.2)",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="rgba(255,255,255,0.7)"
                              display="block"
                            >
                              Wagered
                            </Typography>
                            <Typography
                              variant="h6"
                              color="#FFC107"
                              fontWeight="bold"
                            >
                              {stats?.totalWagered?.toFixed(2) ||
                                formatTokenAmount(
                                  sessionStats.totalWagered || 0,
                                  8
                                )}
                            </Typography>
                          </Box>

                          {/* Net Profit/Loss */}
                          <Box
                            sx={{
                              textAlign: "center",
                              p: 1.5,
                              borderRadius: 1,
                              background:
                                stats?.netProfit >= 0
                                  ? "rgba(20, 216, 84, 0.1)"
                                  : "rgba(220, 38, 51, 0.1)",
                              border:
                                stats?.netProfit >= 0
                                  ? "1px solid rgba(20, 216, 84, 0.2)"
                                  : "1px solid rgba(220, 38, 51, 0.2)",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="rgba(255,255,255,0.7)"
                              display="block"
                            >
                              Net P&L
                            </Typography>
                            <Typography
                              variant="h6"
                              color={
                                stats?.netProfit >= 0 ? "#14D854" : "#DC2633"
                              }
                              fontWeight="bold"
                            >
                              {stats?.netProfit >= 0 ? "+" : ""}
                              {stats?.netProfit?.toFixed(2) ||
                                formatTokenAmount(
                                  (sessionStats.totalWon || 0) -
                                    (sessionStats.totalWagered || 0),
                                  8
                                )}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })()}

                    {/* Additional Stats Row for Recent Performance */}
                    {userBetHistory && userBetHistory.length > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          p: 1,
                          background: "rgba(0,0,0,0.2)",
                          borderRadius: 1,
                          fontSize: "0.7rem",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="rgba(255,255,255,0.6)"
                        >
                          Last 10:{" "}
                          {
                            userBetHistory.slice(0, 10).filter((bet) => bet.won)
                              .length
                          }
                          W -{" "}
                          {
                            userBetHistory
                              .slice(0, 10)
                              .filter((bet) => !bet.won).length
                          }
                          L
                        </Typography>
                        <Typography
                          variant="caption"
                          color="rgba(255,255,255,0.6)"
                        >
                          Biggest Win:{" "}
                          {Math.max(
                            ...userBetHistory
                              .filter((bet) => bet.won)
                              .map((bet) => Number(bet.winnings) / 100000000),
                            0
                          ).toFixed(2)}{" "}
                          APTC
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Recent Numbers */}
            <Grid item xs={12} md={6} lg={3}>
              <RouletteHistory recentNumbers={recentNumbers} />
            </Grid>

            {/* Leaderboard */}
            <Grid item xs={12} md={6} lg={3}>
              <RouletteLeaderboard />
            </Grid>

            {/* Payout Table */}
            <Grid item xs={12} md={6} lg={3}>
              <RoulettePayout />
            </Grid>
          </Grid>

          {/* Additional Content Sections */}
          <Grid
            container
            spacing={4}
            sx={{ mb: 6, maxWidth: "1600px", mx: "auto" }}
          >
            {/* Win Probabilities */}
            <Grid item xs={12} md={6}>
              <WinProbabilities />
            </Grid>

            {/* Featured Promotions */}
            <Grid item xs={12} md={6}>
              <FeaturedPromotions />
            </Grid>
          </Grid>

          {/* Live Games Section */}
          <Box sx={{ maxWidth: "1600px", mx: "auto", mb: 4 }}>
            <LiveGames />
          </Box>
        </Box>

        {/* Bet Result Modal */}
        <Modal
          open={showBetResult}
          onClose={() => setShowBetResult(false)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              background:
                "linear-gradient(135deg, rgba(9, 0, 5, 0.95), rgba(25, 5, 30, 0.95))",
              border: betResultData?.isWin
                ? "2px solid #14D854"
                : "2px solid #DC2633",
              borderRadius: 4,
              p: 4,
              maxWidth: "500px",
              width: "90%",
              mx: 2,
              textAlign: "center",
              backdropFilter: "blur(20px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            {betResultData && (
              <>
                {/* Result Icon and Title */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: "4rem",
                      mb: 2,
                      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                    }}
                  >
                    {betResultData.isWin
                      ? "🎉"
                      : betResultData.hadBets
                      ? "😞"
                      : "🎲"}
                  </Typography>
                  <Typography
                    variant="h4"
                    color={
                      betResultData.isWin
                        ? "#14D854"
                        : betResultData.hadBets
                        ? "#DC2633"
                        : "#FFC107"
                    }
                    fontWeight="bold"
                    sx={{ mb: 1 }}
                  >
                    {betResultData.isWin
                      ? "You Won!"
                      : betResultData.hadBets
                      ? "Better Luck Next Time!"
                      : "Spin Complete!"}
                  </Typography>
                  <Typography variant="body1" color="rgba(255,255,255,0.8)">
                    {betResultData.spinType} Spin Result
                  </Typography>
                </Box>

                {/* Winning Number Display - Always show with proper value */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" color="white" sx={{ mb: 2 }}>
                    Winning Number
                  </Typography>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      backgroundColor: getResultNumberColor(
                        betResultData.winningNumber !== undefined
                          ? betResultData.winningNumber
                          : 0
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "2rem",
                      fontWeight: "bold",
                      mx: "auto",
                      border: "3px solid rgba(255,255,255,0.3)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
                      animation: "pulse 2s infinite",
                      "@keyframes pulse": {
                        "0%": { transform: "scale(1)" },
                        "50%": { transform: "scale(1.05)" },
                        "100%": { transform: "scale(1)" },
                      },
                    }}
                  >
                    {betResultData.winningNumber !== undefined
                      ? betResultData.winningNumber
                      : "?"}
                  </Box>
                  <Typography
                    variant="body2"
                    color="rgba(255,255,255,0.7)"
                    sx={{ mt: 1 }}
                  >
                    {betResultData.winningNumber === 0
                      ? "Green"
                      : [
                          1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30,
                          32, 34, 36,
                        ].includes(betResultData.winningNumber)
                      ? "Red"
                      : "Black"}
                  </Typography>
                </Box>

                {/* Bet Details - Only show if user had bets */}
                {betResultData.hadBets && betResultData.userBets.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="white" sx={{ mb: 2 }}>
                      Your Bets
                    </Typography>
                    {betResultData.userBets.map((bet, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 2,
                          mb: 2,
                          borderRadius: 2,
                          background: betResultData.isWin
                            ? "rgba(20, 216, 84, 0.1)"
                            : "rgba(220, 38, 51, 0.1)",
                          border: betResultData.isWin
                            ? "1px solid rgba(20, 216, 84, 0.3)"
                            : "1px solid rgba(220, 38, 51, 0.3)",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="rgba(255,255,255,0.8)"
                          >
                            Bet Amount:
                          </Typography>
                          <Typography
                            variant="body2"
                            color="white"
                            fontWeight="bold"
                          >
                            {formatTokenAmount(bet.amount, 8)} APTC
                          </Typography>
                        </Box>

                        {betResultData.isWin && bet.winnings > 0 && (
                          <>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 1,
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="rgba(255,255,255,0.8)"
                              >
                                Winnings:
                              </Typography>
                              <Typography
                                variant="body2"
                                color="#14D854"
                                fontWeight="bold"
                              >
                                +{formatTokenAmount(bet.winnings, 8)} APTC
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="rgba(255,255,255,0.8)"
                              >
                                Multiplier:
                              </Typography>
                              <Typography
                                variant="body2"
                                color="#FFD700"
                                fontWeight="bold"
                              >
                                {bet.multiplier}x
                              </Typography>
                            </Box>
                          </>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {/* No Bets Message */}
                {!betResultData.hadBets && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" color="rgba(255,255,255,0.7)">
                      You didn't place any bets on this spin.
                    </Typography>
                    <Typography
                      variant="body2"
                      color="rgba(255,255,255,0.5)"
                      sx={{ mt: 1 }}
                    >
                      Place bets before spinning to win APTC!
                    </Typography>
                  </Box>
                )}

                {/* Total Result - Only show if user had winning bets */}
                {betResultData.isWin && betResultData.totalWinnings > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" color="#14D854" fontWeight="bold">
                      Total Winnings: +
                      {formatTokenAmount(betResultData.totalWinnings, 8)} APTC
                    </Typography>
                  </Box>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                  <Button
                    variant="contained"
                    onClick={() => setShowBetResult(false)}
                    sx={{
                      px: 4,
                      py: 1.5,
                      backgroundColor: betResultData.isWin
                        ? "#14D854"
                        : "#681DDB",
                      "&:hover": {
                        backgroundColor: betResultData.isWin
                          ? "#0ea846"
                          : "#5a17c9",
                      },
                      fontWeight: "bold",
                    }}
                  >
                    {betResultData.hadBets
                      ? "Continue Playing"
                      : "Place Bets & Spin Again"}
                  </Button>

                  {betResultData.isWin && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setShowBetResult(false);
                        // Could add share functionality here
                      }}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderColor: "#14D854",
                        color: "#14D854",
                        "&:hover": {
                          borderColor: "#0ea846",
                          backgroundColor: "rgba(20, 216, 84, 0.1)",
                        },
                        fontWeight: "bold",
                      }}
                    >
                      🎉 Share Win
                    </Button>
                  )}
                </Box>
              </>
            )}
          </Box>
        </Modal>

        {/* Notifications */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <MuiAlert
            elevation={6}
            variant="filled"
            onClose={() => setNotification({ ...notification, open: false })}
            severity={notification.severity}
            sx={{ width: "100%" }}
          >
            {notification.message}
          </MuiAlert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
