import React, {
  useState,
  useReducer,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";
import { ThemeProvider, styled, createTheme } from "@mui/material/styles";
import InfoIcon from "@mui/icons-material/Info";
import ClearIcon from "@mui/icons-material/Clear";
import UndoIcon from "@mui/icons-material/Undo";
import Grid from "@mui/material/Grid";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import currency from "currency.js";
import TextFieldCurrency from "../TextFieldCurrency";
import Button from "../Button";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import GameDetail from "../GameDetail";
import { gameData, bettingTableData } from "./config/rouletteGameDetail";
import BettingHistory from "../BettingHistory";
import useAPTCToken from "../../hooks/useAPTCToken";
import { useNFID } from "../../providers/NFIDProvider";
import BettingPanel from "../betting/BettingPanel";
import GameResult from "../betting/GameResult";
import BettingHistoryComponent from "../betting/BettingHistory";
import {
  FaVolumeMute,
  FaVolumeUp,
  FaChartLine,
  FaCoins,
  FaTrophy,
  FaDice,
  FaBalanceScale,
  FaRandom,
  FaPercentage,
  FaPlayCircle,
  FaArrowRight,
  FaInfoCircle,
} from "react-icons/fa";
import {
  GiCardRandom,
  GiDiceTarget,
  GiRollingDices,
  GiPokerHand,
} from "react-icons/gi";
import { motion } from "framer-motion";

// Material-UI theme for dark casino styling
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#F1324D",
    },
    secondary: {
      main: "#4ECDC4",
    },
    background: {
      default: "#070005",
      paper: "#1A0015",
    },
    text: {
      primary: "#ffffff",
      secondary: "#ffffff80",
    },
  },
});

// Styled components
const TooltipWide = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: "1px solid #333",
    fontSize: 11,
    maxWidth: 300,
  },
}));

// Roulette numbers configuration
const rouletteNumbers = [
  { number: 0, color: "green" },
  { number: 32, color: "red" },
  { number: 15, color: "black" },
  { number: 19, color: "red" },
  { number: 4, color: "black" },
  { number: 21, color: "red" },
  { number: 2, color: "black" },
  { number: 25, color: "red" },
  { number: 17, color: "black" },
  { number: 34, color: "red" },
  { number: 6, color: "black" },
  { number: 27, color: "red" },
  { number: 13, color: "black" },
  { number: 36, color: "red" },
  { number: 11, color: "black" },
  { number: 30, color: "red" },
  { number: 8, color: "black" },
  { number: 23, color: "red" },
  { number: 10, color: "black" },
  { number: 5, color: "red" },
  { number: 24, color: "black" },
  { number: 16, color: "red" },
  { number: 33, color: "black" },
  { number: 1, color: "red" },
  { number: 20, color: "black" },
  { number: 14, color: "red" },
  { number: 31, color: "black" },
  { number: 9, color: "red" },
  { number: 22, color: "black" },
  { number: 18, color: "red" },
  { number: 29, color: "black" },
  { number: 7, color: "red" },
  { number: 28, color: "black" },
  { number: 12, color: "red" },
  { number: 35, color: "black" },
  { number: 3, color: "red" },
  { number: 26, color: "black" },
];

// Initial game state - Updated for APTC integration
const initialState = {
  bets: {},
  totalBet: 0,
  gameHistory: [],
  isSpinning: false,
  winningNumber: null,
  lastWin: 0,
  currentBetId: null,
};

// Game state reducer - Updated for APTC integration
function gameReducer(state, action) {
  switch (action.type) {
    case "PLACE_BET":
      const newBets = { ...state.bets };
      const betKey = action.payload.type;
      newBets[betKey] = (newBets[betKey] || 0) + action.payload.amount;

      return {
        ...state,
        bets: newBets,
        totalBet: state.totalBet + action.payload.amount,
        currentBetId: action.payload.betId,
      };

    case "CLEAR_BETS":
      return {
        ...state,
        bets: {},
        totalBet: 0,
        currentBetId: null,
      };

    case "UNDO_BET":
      // Simplified undo - just clear last bet for now
      return {
        ...state,
        bets: {},
        totalBet: 0,
        currentBetId: null,
      };

    case "START_SPIN":
      return {
        ...state,
        isSpinning: true,
        winningNumber: null,
      };

    case "END_SPIN":
      const winnings = calculateWinnings(
        state.bets,
        action.payload.winningNumber
      );
      return {
        ...state,
        isSpinning: false,
        winningNumber: action.payload.winningNumber,
        lastWin: winnings,
        gameHistory: [
          {
            number: action.payload.winningNumber,
            timestamp: new Date(),
            bets: state.bets,
            winnings,
          },
          ...state.gameHistory.slice(0, 9), // Keep last 10 games
        ],
        bets: {},
        totalBet: 0,
        currentBetId: null,
      };

    default:
      return state;
  }
}

// Calculate winnings based on bets and winning number
function calculateWinnings(bets, winningNumber) {
  let totalWinnings = 0;
  const winningColor = rouletteNumbers.find(
    (n) => n.number === winningNumber
  )?.color;

  Object.entries(bets).forEach(([betType, amount]) => {
    let multiplier = 0;

    switch (betType) {
      case `number-${winningNumber}`:
        multiplier = 35; // Straight up bet
        break;
      case winningColor:
        multiplier = 1; // Color bet
        break;
      case "even":
        if (winningNumber !== 0 && winningNumber % 2 === 0) multiplier = 1;
        break;
      case "odd":
        if (winningNumber !== 0 && winningNumber % 2 === 1) multiplier = 1;
        break;
      case "low":
        if (winningNumber >= 1 && winningNumber <= 18) multiplier = 1;
        break;
      case "high":
        if (winningNumber >= 19 && winningNumber <= 36) multiplier = 1;
        break;
      case "dozen1":
        if (winningNumber >= 1 && winningNumber <= 12) multiplier = 2;
        break;
      case "dozen2":
        if (winningNumber >= 13 && winningNumber <= 24) multiplier = 2;
        break;
      case "dozen3":
        if (winningNumber >= 25 && winningNumber <= 36) multiplier = 2;
        break;
      case "column1":
        if (
          [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(winningNumber)
        )
          multiplier = 2;
        break;
      case "column2":
        if (
          [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(winningNumber)
        )
          multiplier = 2;
        break;
      case "column3":
        if (
          [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(winningNumber)
        )
          multiplier = 2;
        break;
    }

    if (multiplier > 0) {
      totalWinnings += amount * (multiplier + 1); // Include original bet
    }
  });

  return totalWinnings;
}

export default function RouletteGame() {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);
  const [activeTab, setActiveTab] = useState("game");
  const [isMuted, setIsMuted] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("info");
  const [selectedBetType, setSelectedBetType] = useState(null);
  const [showGameResult, setShowGameResult] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  // NFID and APTC Token integration
  const { isConnected, principal } = useNFID();
  const {
    balance,
    loading: balanceLoading,
    error: balanceError,
    formatBalance,
    getBalance,
    placeBet: placeAPTCBet,
    processBetResult,
    cancelBet,
    formatTokenAmount,
    getFormattedBettingBalance,
  } = useAPTCToken();

  const wheelRef = useRef(null);
  const ballRef = useRef(null);

  // Place bet function with APTC integration
  const placeBet = useCallback(
    async (betType, betAmount) => {
      if (gameState.isSpinning) return;

      if (!isConnected) {
        setAlertMessage("Please connect your wallet first!");
        setAlertSeverity("error");
        setShowAlert(true);
        return;
      }

      try {
        // Place APTC bet
        const betRecord = await placeAPTCBet(
          betAmount,
          "roulette",
          `roulette-${Date.now()}`,
          { betType }
        );

        dispatch({
          type: "PLACE_BET",
          payload: {
            type: betType,
            amount: betAmount,
            betId: betRecord.id,
          },
        });

        setAlertMessage(`Bet placed: ${betAmount} APTC on ${betType}`);
        setAlertSeverity("success");
        setShowAlert(true);
      } catch (error) {
        setAlertMessage(error.message || "Failed to place bet");
        setAlertSeverity("error");
        setShowAlert(true);
      }
    },
    [gameState.isSpinning, isConnected, placeAPTCBet]
  );

  // Handle betting panel bet placement
  const handleBettingPanelBet = useCallback(
    async (betAmount) => {
      if (!selectedBetType) {
        setAlertMessage("Please select a bet type first!");
        setAlertSeverity("warning");
        setShowAlert(true);
        return;
      }

      await placeBet(selectedBetType, betAmount);
    },
    [selectedBetType, placeBet]
  );

  // Spin wheel function with APTC integration
  const spinWheel = useCallback(async () => {
    if (gameState.totalBet === 0) {
      setAlertMessage("Please place a bet first!");
      setAlertSeverity("warning");
      setShowAlert(true);
      return;
    }

    if (!gameState.currentBetId) {
      setAlertMessage("No active bet found!");
      setAlertSeverity("error");
      setShowAlert(true);
      return;
    }

    dispatch({ type: "START_SPIN" });

    // Simulate wheel spin with animation
    const winningNumber = Math.floor(Math.random() * 37); // 0-36

    // Add spinning animation
    if (wheelRef.current) {
      wheelRef.current.style.transform = "rotate(1800deg)";
      wheelRef.current.style.transition = "transform 3s ease-out";
    }

    setTimeout(async () => {
      dispatch({
        type: "END_SPIN",
        payload: { winningNumber },
      });

      if (wheelRef.current) {
        wheelRef.current.style.transition = "none";
        wheelRef.current.style.transform = "rotate(0deg)";
      }

      // Calculate winnings and process bet result
      const winnings = calculateWinnings(gameState.bets, winningNumber);
      const isWin = winnings > 0;
      const multiplier = isWin ? winnings / gameState.totalBet : 0;

      // Process APTC bet result
      try {
        await processBetResult(
          gameState.currentBetId,
          isWin,
          multiplier,
          isWin ? winnings : null
        );

        // Show game result
        setGameResult({
          isWin,
          betAmount: BigInt(gameState.totalBet),
          winAmount: isWin ? BigInt(winnings) : null,
          multiplier: isWin ? multiplier : null,
          message: `Number ${winningNumber} (${
            rouletteNumbers.find((n) => n.number === winningNumber)?.color
          }) came up!`,
        });
        setShowGameResult(true);
      } catch (error) {
        console.error("Failed to process bet result:", error);
        setAlertMessage("Failed to process bet result");
        setAlertSeverity("error");
        setShowAlert(true);
      }
    }, 3000);
  }, [
    gameState.totalBet,
    gameState.bets,
    gameState.currentBetId,
    processBetResult,
  ]);

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="min-h-screen bg-gradient-to-b from-sharp-black to-[#150012] text-white">
        <div className="container mx-auto px-4 lg:px-8 pt-32 pb-16">
          {/* Game Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <GiRollingDices className="text-4xl text-red-magic" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-magic to-blue-magic bg-clip-text text-transparent">
                Roulette
              </h1>
            </div>
            <p className="text-white/70 text-lg">
              Place your bets and spin the wheel of fortune
            </p>
          </div>

          {/* Token Balance Display - Enhanced Version */}
          <div className="max-w-4xl mx-auto mb-8">
            {/* Token Balance Display - Show when connected */}
            {isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-6 rounded-xl border border-purple-800/30 shadow-lg mb-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-gradient-to-br from-yellow-600/40 to-yellow-700/30 mr-4 border border-yellow-800/30">
                      <FaCoins className="text-yellow-400 text-xl" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-lg">
                        Your APTC Balance
                      </h4>
                      <p className="text-white/60 text-sm">
                        Available tokens for betting
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {balanceLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400 mr-3"></div>
                        <span className="text-white/70 text-lg">
                          Loading...
                        </span>
                      </div>
                    ) : balanceError ? (
                      <div className="flex items-center">
                        <span className="text-red-400 text-lg mr-3">
                          Error loading balance
                        </span>
                        <button
                          onClick={() => getBalance && getBalance(true)}
                          className="p-2 rounded bg-red-600/20 hover:bg-red-600/30 transition-colors"
                          title="Retry loading balance"
                        >
                          <FaArrowRight className="text-red-400 text-sm transform rotate-45" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="text-white font-bold text-2xl flex items-center mr-3">
                          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            {balance && balance > BigInt(0)
                              ? formatBalance(balance)
                              : "0"}{" "}
                            APTC
                          </span>
                        </div>
                        <button
                          onClick={() => getBalance && getBalance(true)}
                          className="p-2 rounded bg-purple-600/20 hover:bg-purple-600/30 transition-colors"
                          title="Refresh balance"
                        >
                          <FaArrowRight className="text-purple-400 text-sm transform rotate-45" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Not Connected Message */}
            {!isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-red-900/20 to-orange-900/10 p-6 rounded-xl border border-red-800/30 mb-6"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-gradient-to-br from-red-600/40 to-red-700/30 mr-4 border border-red-800/30">
                    <FaInfoCircle className="text-red-400 text-xl" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg">
                      Wallet Not Connected
                    </h4>
                    <p className="text-white/60 text-sm">
                      Connect your NFID wallet to view balance and place
                      roulette bets
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1A0015] rounded-lg p-4 text-center">
              <FaCoins className="text-yellow-500 text-2xl mx-auto mb-2" />
              <p className="text-white/60 text-sm">APTC Balance</p>
              <p className="text-xl font-bold">
                {getFormattedBettingBalance()}
              </p>
            </div>
            <div className="bg-[#1A0015] rounded-lg p-4 text-center">
              <FaDice className="text-blue-magic text-2xl mx-auto mb-2" />
              <p className="text-white/60 text-sm">Total Bet</p>
              <p className="text-xl font-bold">{gameState.totalBet} APTC</p>
            </div>
            <div className="bg-[#1A0015] rounded-lg p-4 text-center">
              <FaTrophy className="text-green-500 text-2xl mx-auto mb-2" />
              <p className="text-white/60 text-sm">Last Win</p>
              <p className="text-xl font-bold">{gameState.lastWin} APTC</p>
            </div>
            <div className="bg-[#1A0015] rounded-lg p-4 text-center">
              <FaChartLine className="text-purple-500 text-2xl mx-auto mb-2" />
              <p className="text-white/60 text-sm">Games Played</p>
              <p className="text-xl font-bold">
                {gameState.gameHistory.length}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-white/10 mb-8 overflow-x-auto">
            {[
              { id: "game", label: "Game", icon: FaPlayCircle },
              { id: "history", label: "History", icon: FaChartLine },
              { id: "leaderboard", label: "Leaderboard", icon: FaTrophy },
              { id: "strategy", label: "Strategy", icon: FaBalanceScale },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === id
                    ? "text-white border-b-2 border-blue-magic"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <Icon /> {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "game" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Betting Panel */}
              <div className="lg:col-span-1">
                <BettingPanel
                  onPlaceBet={handleBettingPanelBet}
                  minBet={1}
                  maxBet={1000}
                  gameType="roulette"
                  disabled={gameState.isSpinning}
                  customControls={
                    <div className="space-y-4">
                      {/* Bet Type Selection */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          Select Bet Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {
                              type: "red",
                              label: "Red",
                              color: "bg-red-600",
                              payout: "1:1",
                            },
                            {
                              type: "black",
                              label: "Black",
                              color: "bg-gray-800",
                              payout: "1:1",
                            },
                            {
                              type: "even",
                              label: "Even",
                              color: "bg-blue-600",
                              payout: "1:1",
                            },
                            {
                              type: "odd",
                              label: "Odd",
                              color: "bg-purple-600",
                              payout: "1:1",
                            },
                            {
                              type: "low",
                              label: "Low (1-18)",
                              color: "bg-green-600",
                              payout: "1:1",
                            },
                            {
                              type: "high",
                              label: "High (19-36)",
                              color: "bg-orange-600",
                              payout: "1:1",
                            },
                          ].map(({ type, label, color, payout }) => (
                            <button
                              key={type}
                              onClick={() => setSelectedBetType(type)}
                              disabled={gameState.isSpinning}
                              className={`p-3 rounded-lg font-medium transition-all text-sm ${color} ${
                                selectedBetType === type
                                  ? "ring-2 ring-yellow-400 transform scale-105"
                                  : "hover:opacity-80"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <div>{label}</div>
                              <div className="text-xs opacity-75">{payout}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Number Betting Grid */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          Or Pick a Number (35:1)
                        </label>
                        <div className="grid grid-cols-6 gap-1 max-h-32 overflow-y-auto">
                          {[
                            0,
                            ...Array.from({ length: 36 }, (_, i) => i + 1),
                          ].map((number) => {
                            const numberData = rouletteNumbers.find(
                              (n) => n.number === number
                            );
                            const color = numberData?.color || "green";
                            const bgColor =
                              color === "red"
                                ? "bg-red-600"
                                : color === "black"
                                ? "bg-gray-800"
                                : "bg-green-600";

                            return (
                              <button
                                key={number}
                                onClick={() =>
                                  setSelectedBetType(`number-${number}`)
                                }
                                disabled={gameState.isSpinning}
                                className={`p-2 rounded text-xs font-medium transition-all ${bgColor} ${
                                  selectedBetType === `number-${number}`
                                    ? "ring-2 ring-yellow-400 transform scale-110"
                                    : "hover:opacity-80"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {number}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  }
                />

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <Button
                    onClick={spinWheel}
                    disabled={gameState.isSpinning || gameState.totalBet === 0}
                    className="w-full bg-gradient-to-r from-red-magic to-blue-magic text-lg py-4"
                  >
                    {gameState.isSpinning ? (
                      <>
                        <CircularProgress size={20} className="mr-2" />
                        Spinning...
                      </>
                    ) : (
                      <>
                        <FaPlayCircle className="mr-2" />
                        Spin the Wheel
                      </>
                    )}
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        dispatch({ type: "CLEAR_BETS" });
                        if (gameState.currentBetId) {
                          cancelBet(gameState.currentBetId);
                        }
                      }}
                      variant="secondary"
                      disabled={gameState.isSpinning}
                      className="flex-1"
                    >
                      <ClearIcon className="mr-1" />
                      Clear Bets
                    </Button>
                    <Button
                      onClick={() => {
                        dispatch({ type: "UNDO_BET" });
                        if (gameState.currentBetId) {
                          cancelBet(gameState.currentBetId);
                        }
                      }}
                      variant="secondary"
                      disabled={gameState.isSpinning}
                      className="flex-1"
                    >
                      <UndoIcon className="mr-1" />
                      Undo
                    </Button>
                  </div>
                </div>

                {/* Current Bets */}
                {Object.keys(gameState.bets).length > 0 && (
                  <div className="mt-6 bg-gray-800 rounded-xl p-4">
                    <h4 className="font-bold mb-3 text-white">Current Bets</h4>
                    {Object.entries(gameState.bets).map(([betType, amount]) => (
                      <div
                        key={betType}
                        className="flex justify-between py-1 text-gray-300"
                      >
                        <span className="capitalize">
                          {betType.replace("-", " ")}
                        </span>
                        <span className="text-yellow-400">{amount} APTC</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-600 mt-2 pt-2 font-bold text-white">
                      Total:{" "}
                      <span className="text-yellow-400">
                        {gameState.totalBet} APTC
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Roulette Wheel */}
              <div className="lg:col-span-2">
                <div className="bg-[#1A0015] rounded-xl p-8 text-center">
                  <div className="relative mx-auto w-80 h-80 mb-6">
                    {/* Wheel */}
                    <div
                      ref={wheelRef}
                      className="w-full h-full rounded-full bg-gradient-to-br from-green-600 via-red-600 to-black border-8 border-yellow-500 flex items-center justify-center relative overflow-hidden"
                    >
                      {/* Numbers around the wheel */}
                      {rouletteNumbers.map((num, index) => {
                        const angle = (index * 360) / rouletteNumbers.length;
                        return (
                          <div
                            key={num.number}
                            className="absolute text-white font-bold text-sm"
                            style={{
                              transform: `rotate(${angle}deg) translateY(-120px) rotate(-${angle}deg)`,
                            }}
                          >
                            {num.number}
                          </div>
                        );
                      })}

                      {/* Center */}
                      <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center">
                        <GiRollingDices className="text-2xl text-black" />
                      </div>
                    </div>

                    {/* Ball */}
                    <div
                      ref={ballRef}
                      className="absolute w-4 h-4 bg-white rounded-full shadow-lg"
                      style={{
                        top: "10px",
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                    />
                  </div>

                  {/* Winning Number Display */}
                  {gameState.winningNumber !== null && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-center"
                    >
                      <p className="text-lg mb-2">Winning Number:</p>
                      <div
                        className={`text-6xl font-bold ${
                          gameState.winningNumber === 0
                            ? "text-green-500"
                            : rouletteNumbers.find(
                                (n) => n.number === gameState.winningNumber
                              )?.color === "red"
                            ? "text-red-500"
                            : "text-white"
                        }`}
                      >
                        {gameState.winningNumber}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Game History
                </h3>
                <BettingHistoryComponent gameType="roulette" />
              </div>

              {/* Recent Numbers */}
              <div className="bg-[#1A0015] rounded-xl p-6">
                <h4 className="text-xl font-bold text-white mb-4">
                  Recent Numbers
                </h4>
                {gameState.gameHistory.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {gameState.gameHistory
                      .slice(-20)
                      .reverse()
                      .map((result, index) => {
                        const numberData = rouletteNumbers.find(
                          (n) => n.number === result.number
                        );
                        const color = numberData?.color || "green";
                        const bgColor =
                          color === "red"
                            ? "bg-red-600"
                            : color === "black"
                            ? "bg-gray-800"
                            : "bg-green-600";

                        return (
                          <div
                            key={index}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold border-2 border-gray-600 ${bgColor}`}
                          >
                            {result.number}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-gray-400">No games played yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "leaderboard" && (
            <Box sx={{ p: 2, textAlign: "center", color: "white" }}>
              <Typography variant="h6">Leaderboard</Typography>
              <Typography variant="body2" color="text.secondary">
                Coming Soon
              </Typography>
            </Box>
          )}

          {activeTab === "strategy" && (
            <Box sx={{ p: 2, textAlign: "center", color: "white" }}>
              <Typography variant="h6">Strategy Guide</Typography>
              <Typography variant="body2" color="text.secondary">
                Coming Soon
              </Typography>
            </Box>
          )}

          {/* Game Information */}
          <div className="mt-12">
            <GameDetail
              gameData={gameData}
              bettingTableData={bettingTableData}
            />
          </div>
        </div>

        {/* Alert Snackbar */}
        <Snackbar
          open={showAlert}
          autoHideDuration={4000}
          onClose={() => setShowAlert(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <MuiAlert
            onClose={() => setShowAlert(false)}
            severity={alertSeverity}
            variant="filled"
          >
            {alertMessage}
          </MuiAlert>
        </Snackbar>

        {/* Game Result Modal */}
        {gameResult && (
          <GameResult
            isVisible={showGameResult}
            isWin={gameResult.isWin}
            betAmount={gameResult.betAmount}
            winAmount={gameResult.winAmount}
            multiplier={gameResult.multiplier}
            message={gameResult.message}
            onClose={() => {
              setShowGameResult(false);
              setGameResult(null);
            }}
            autoCloseDelay={5000}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
