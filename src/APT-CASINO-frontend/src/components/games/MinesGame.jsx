import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../Button";
import Tabs from "../Tabs";
import DynamicForm from "./DynamicForm";
import GameDetail from "../GameDetail";
import useAPTCToken from "../../hooks/useAPTCToken";
import BettingPanel from "../betting/BettingPanel";
import BettingHistoryComponent from "../betting/BettingHistory";
import {
  gameData,
  bettingTableData,
  gameStatistics,
  winProbabilities,
} from "./config/minesGameDetail";
import { manualFormConfig, autoFormConfig } from "./config/minesFormConfig";
import {
  FaCrown,
  FaHistory,
  FaTrophy,
  FaInfoCircle,
  FaChartLine,
  FaBomb,
  FaDiscord,
  FaTelegram,
  FaTwitter,
  FaDice,
  FaCoins,
  FaChevronDown,
} from "react-icons/fa";
import {
  GiMining,
  GiDiamonds,
  GiCardRandom,
  GiMineExplosion,
  GiCrystalGrowth,
  GiChestArmor,
  GiGoldBar,
} from "react-icons/gi";
import {
  HiLightningBolt,
  HiOutlineTrendingUp,
  HiOutlineChartBar,
} from "react-icons/hi";
import confetti from "canvas-confetti";
import "./mines.css";

// Game constants
const GRID_SIZE = 25; // 5x5 grid
const DEFAULT_MINES = 5;
const DEFAULT_BET = 10;

// Tile states
const TILE_STATES = {
  HIDDEN: "hidden",
  REVEALED_SAFE: "safe",
  REVEALED_MINE: "mine",
  FLAGGED: "flagged",
};

// Calculate multiplier based on mines and revealed tiles
const calculateMultiplier = (mines, revealedCount) => {
  if (revealedCount === 0) return 1;

  const safeTiles = GRID_SIZE - mines;
  let multiplier = 1;

  for (let i = 0; i < revealedCount; i++) {
    multiplier *= (safeTiles - i) / (GRID_SIZE - mines - i);
  }

  return Math.max(1, multiplier);
};

// Generate mine positions
const generateMinePositions = (mineCount) => {
  const positions = new Set();
  while (positions.size < mineCount) {
    positions.add(Math.floor(Math.random() * GRID_SIZE));
  }
  return positions;
};

export default function MinesGame() {
  // APTC Token integration
  const {
    balance,
    placeBet: placeAPTCBet,
    processBetResult,
    cancelBet,
    formatTokenAmount,
    isConnected,
    getFormattedBettingBalance,
  } = useAPTCToken();

  // Game state
  const [gameState, setGameState] = useState("idle"); // idle, playing, ended
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill(TILE_STATES.HIDDEN));
  const [minePositions, setMinePositions] = useState(new Set());
  const [revealedTiles, setRevealedTiles] = useState(0);
  const [betAmount, setBetAmount] = useState(DEFAULT_BET);
  const [mineCount, setMineCount] = useState(DEFAULT_MINES);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [gameResult, setGameResult] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("game");
  const [showStats, setShowStats] = useState(false);
  const [currentBetId, setCurrentBetId] = useState(null);

  // Auto betting state
  const [isAutoBetting, setIsAutoBetting] = useState(false);
  const [autoBetSettings, setAutoBetSettings] = useState({
    numberOfBets: 10,
    stopOnWin: false,
    stopOnLoss: false,
    increaseOnWin: 0,
    increaseOnLoss: 0,
  });

  // AI features
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiModal, setShowAiModal] = useState(false);

  // Update multiplier when revealed tiles change
  useEffect(() => {
    if (gameState === "playing") {
      setCurrentMultiplier(calculateMultiplier(mineCount, revealedTiles));
    }
  }, [revealedTiles, mineCount, gameState]);

  // Start new game with APTC integration
  const startGame = useCallback(async () => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      // Place APTC bet
      const betRecord = await placeAPTCBet(
        betAmount,
        "mines",
        `mines-${Date.now()}`,
        { mineCount, gridSize: GRID_SIZE }
      );

      const mines = generateMinePositions(mineCount);
      setMinePositions(mines);
      setGrid(Array(GRID_SIZE).fill(TILE_STATES.HIDDEN));
      setRevealedTiles(0);
      setGameState("playing");
      setCurrentMultiplier(1);
      setGameResult(null);
      setCurrentBetId(betRecord.id);

      // Generate AI suggestions
      generateAiSuggestions(mines);
    } catch (error) {
      alert(error.message || "Failed to place bet");
    }
  }, [betAmount, mineCount, isConnected, placeAPTCBet]);

  // Generate AI suggestions for safe tiles
  const generateAiSuggestions = (mines) => {
    const safeTiles = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      if (!mines.has(i)) {
        safeTiles.push(i);
      }
    }

    // Suggest 3-5 random safe tiles
    const suggestions = safeTiles
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(5, safeTiles.length));

    setAiSuggestions(suggestions);
  };

  // Reveal tile with APTC integration
  const revealTile = useCallback(
    async (index) => {
      if (gameState !== "playing" || grid[index] !== TILE_STATES.HIDDEN) {
        return;
      }

      const newGrid = [...grid];

      if (minePositions.has(index)) {
        // Hit a mine - game over
        newGrid[index] = TILE_STATES.REVEALED_MINE;
        setGrid(newGrid);
        setGameState("ended");
        setGameResult({
          type: "loss",
          message: "💣 BOOM! You hit a mine!",
          winnings: 0,
        });

        // Process APTC bet result (loss)
        if (currentBetId) {
          await processBetResult(currentBetId, false, 0);
        }

        // Reveal all mines
        setTimeout(() => {
          const finalGrid = [...newGrid];
          minePositions.forEach((pos) => {
            if (finalGrid[pos] === TILE_STATES.HIDDEN) {
              finalGrid[pos] = TILE_STATES.REVEALED_MINE;
            }
          });
          setGrid(finalGrid);
        }, 500);

        // Add to history
        setGameHistory((prev) => [
          {
            id: Date.now(),
            bet: betAmount,
            mines: mineCount,
            revealed: revealedTiles,
            result: "loss",
            winnings: 0,
            timestamp: new Date(),
          },
          ...prev.slice(0, 9),
        ]);
      } else {
        // Safe tile
        newGrid[index] = TILE_STATES.REVEALED_SAFE;
        setGrid(newGrid);
        setRevealedTiles((prev) => prev + 1);

        // Check if won (revealed all safe tiles)
        const newRevealedCount = revealedTiles + 1;
        const maxSafeTiles = GRID_SIZE - mineCount;

        if (newRevealedCount === maxSafeTiles) {
          // Won the game!
          const finalMultiplier = calculateMultiplier(
            mineCount,
            newRevealedCount
          );
          const winnings = betAmount * finalMultiplier;

          setGameState("ended");
          setGameResult({
            type: "win",
            message: `🎉 Perfect! You found all safe tiles!`,
            winnings: winnings,
          });

          // Process APTC bet result (win)
          if (currentBetId) {
            await processBetResult(currentBetId, true, finalMultiplier);
          }

          // Celebrate with confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });

          // Add to history
          setGameHistory((prev) => [
            {
              id: Date.now(),
              bet: betAmount,
              mines: mineCount,
              revealed: newRevealedCount,
              result: "win",
              winnings: winnings,
              timestamp: new Date(),
            },
            ...prev.slice(0, 9),
          ]);
        }
      }
    },
    [
      gameState,
      grid,
      minePositions,
      revealedTiles,
      betAmount,
      mineCount,
      currentBetId,
      processBetResult,
    ]
  );

  // Cash out with APTC integration
  const cashOut = useCallback(async () => {
    if (gameState !== "playing" || revealedTiles === 0) return;

    const winnings = betAmount * currentMultiplier;
    setGameState("ended");
    setGameResult({
      type: "cashout",
      message: `💰 Cashed out successfully!`,
      winnings: winnings,
    });

    // Process APTC bet result (cashout win)
    if (currentBetId) {
      await processBetResult(currentBetId, true, currentMultiplier);
    }

    // Add to history
    setGameHistory((prev) => [
      {
        id: Date.now(),
        bet: betAmount,
        mines: mineCount,
        revealed: revealedTiles,
        result: "cashout",
        winnings: winnings,
        timestamp: new Date(),
      },
      ...prev.slice(0, 9),
    ]);
  }, [
    gameState,
    revealedTiles,
    betAmount,
    currentMultiplier,
    mineCount,
    currentBetId,
    processBetResult,
  ]);

  // Reset game with APTC integration
  const resetGame = useCallback(async () => {
    // Cancel pending bet if exists
    if (currentBetId && gameState === "playing") {
      try {
        await cancelBet(currentBetId);
      } catch (error) {
        console.error("Failed to cancel bet:", error);
      }
    }

    setGameState("idle");
    setGrid(Array(GRID_SIZE).fill(TILE_STATES.HIDDEN));
    setMinePositions(new Set());
    setRevealedTiles(0);
    setCurrentMultiplier(1);
    setGameResult(null);
    setAiSuggestions([]);
    setCurrentBetId(null);
  }, [currentBetId, gameState, cancelBet]);

  // Handle form submission for manual betting
  const handleManualBetting = (formData) => {
    setBetAmount(Number(formData.betAmount) || DEFAULT_BET);
    setMineCount(Number(formData.mines) || DEFAULT_MINES);
    startGame();
  };

  // Handle form submission for auto betting
  const handleAutoBetting = (formData) => {
    setBetAmount(Number(formData.betAmount) || DEFAULT_BET);
    setMineCount(Number(formData.mines) || DEFAULT_MINES);
    setAutoBetSettings({
      numberOfBets: Number(formData.numberOfBets) || 10,
      stopOnWin: formData.stopOnWin || false,
      stopOnLoss: formData.stopOnLoss || false,
      increaseOnWin: Number(formData.increaseOnWin) || 0,
      increaseOnLoss: Number(formData.increaseOnLoss) || 0,
    });
    setIsAutoBetting(true);
    startGame();
  };

  // Render tile
  const renderTile = (index) => {
    const tileState = grid[index];
    const isAiSuggested = aiSuggestions.includes(index);

    let tileContent = "";
    let tileClass = "mines-tile";

    switch (tileState) {
      case TILE_STATES.HIDDEN:
        tileClass += " mines-tile-hidden";
        if (isAiSuggested && gameState === "playing") {
          tileClass += " mines-tile-ai-suggested";
          tileContent = "🤖";
        }
        break;
      case TILE_STATES.REVEALED_SAFE:
        tileClass += " mines-tile-safe";
        tileContent = "💎";
        break;
      case TILE_STATES.REVEALED_MINE:
        tileClass += " mines-tile-mine";
        tileContent = "💣";
        break;
    }

    return (
      <motion.button
        key={index}
        className={tileClass}
        onClick={() => revealTile(index)}
        disabled={gameState !== "playing" || tileState !== TILE_STATES.HIDDEN}
        whileHover={{ scale: gameState === "playing" ? 1.05 : 1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.01 }}
      >
        {tileContent}
      </motion.button>
    );
  };

  const tabs = [
    {
      label: "Manual",
      content: (
        <div className="space-y-4">
          <BettingPanel
            balance={balance}
            onPlaceBet={startGame}
            isGameActive={gameState === "playing"}
            gameType="mines"
            customBetControls={
              <div className="mt-4">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Number of Mines
                </label>
                <select
                  value={mineCount}
                  onChange={(e) => setMineCount(Number(e.target.value))}
                  disabled={gameState === "playing"}
                  className="w-full bg-[#2A1B3D] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} Mine{num > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            }
            onBetAmountChange={setBetAmount}
            betAmount={betAmount}
          />
        </div>
      ),
    },
    {
      label: "Auto",
      content: (
        <DynamicForm
          config={autoFormConfig}
          onSubmit={handleAutoBetting}
          disabled={gameState === "playing"}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sharp-black to-[#150012] text-white">
      <div className="container mx-auto px-4 lg:px-8 pt-32 pb-16">
        {/* Game Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GiMining className="text-4xl text-yellow-500" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              Mines
            </h1>
          </div>
          <p className="text-white/70 text-lg">
            Find the diamonds while avoiding the mines
          </p>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A0015] rounded-lg p-4 text-center">
            <FaCoins className="text-yellow-500 text-2xl mx-auto mb-2" />
            <p className="text-white/60 text-sm">APTC Balance</p>
            <p className="text-xl font-bold">
              {formatTokenAmount(balance)} APTC
            </p>
          </div>
          <div className="bg-[#1A0015] rounded-lg p-4 text-center">
            <GiDiamonds className="text-blue-400 text-2xl mx-auto mb-2" />
            <p className="text-white/60 text-sm">Revealed</p>
            <p className="text-xl font-bold">{revealedTiles}</p>
          </div>
          <div className="bg-[#1A0015] rounded-lg p-4 text-center">
            <HiLightningBolt className="text-purple-500 text-2xl mx-auto mb-2" />
            <p className="text-white/60 text-sm">Multiplier</p>
            <p className="text-xl font-bold">{currentMultiplier.toFixed(2)}x</p>
          </div>
          <div className="bg-[#1A0015] rounded-lg p-4 text-center">
            <FaBomb className="text-red-500 text-2xl mx-auto mb-2" />
            <p className="text-white/60 text-sm">Mines</p>
            <p className="text-xl font-bold">{mineCount}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto">
          {[
            { id: "game", label: "Game", icon: GiMining },
            { id: "history", label: "History", icon: FaHistory },
            { id: "stats", label: "Statistics", icon: FaChartLine },
            { id: "leaderboard", label: "Leaderboard", icon: FaTrophy },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === id
                  ? "text-white border-b-2 border-yellow-500"
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
            {/* Control Panel */}
            <div className="lg:col-span-1">
              <div className="bg-[#1A0015] rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FaCoins className="text-yellow-500" />
                  Game Controls
                </h3>
                <Tabs tabs={tabs} />
              </div>

              {/* Betting History */}
              <div className="bg-[#1A0015] rounded-xl p-6 mb-6">
                <BettingHistoryComponent gameType="mines" />
              </div>

              {/* Game Actions */}
              {gameState === "playing" && (
                <div className="bg-[#1A0015] rounded-xl p-6 mb-6">
                  <div className="flex flex-col gap-3">
                    <div className="text-center">
                      <p className="text-sm text-white/60 mb-1">
                        Potential Win
                      </p>
                      <p className="text-2xl font-bold text-green-500">
                        {formatTokenAmount(betAmount * currentMultiplier)} APTC
                      </p>
                    </div>
                    <Button
                      onClick={cashOut}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      disabled={revealedTiles === 0}
                    >
                      💰 Cash Out ({currentMultiplier.toFixed(2)}x)
                    </Button>
                  </div>
                </div>
              )}

              {/* Game Result */}
              <AnimatePresence>
                {gameResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`bg-[#1A0015] rounded-xl p-6 mb-6 text-center ${
                      gameResult.type === "win"
                        ? "border-2 border-green-500"
                        : gameResult.type === "loss"
                        ? "border-2 border-red-500"
                        : "border-2 border-yellow-500"
                    }`}
                  >
                    <p className="text-lg mb-2">{gameResult.message}</p>
                    {gameResult.winnings > 0 && (
                      <p className="text-2xl font-bold text-green-500">
                        +{formatTokenAmount(gameResult.winnings)} APTC
                      </p>
                    )}
                    <Button
                      onClick={resetGame}
                      className="mt-4 bg-gradient-to-r from-blue-magic to-purple-magic"
                    >
                      Play Again
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && gameState === "playing" && (
                <div className="bg-[#1A0015] rounded-xl p-6">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    🤖 AI Suggestions
                  </h4>
                  <p className="text-sm text-white/70 mb-3">
                    Tiles marked with 🤖 are AI-suggested safe spots
                  </p>
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Learn more about AI assistance
                  </button>
                </div>
              )}
            </div>

            {/* Game Grid */}
            <div className="lg:col-span-2">
              <div className="bg-[#1A0015] rounded-xl p-8">
                <div className="grid grid-cols-5 gap-3 max-w-md mx-auto">
                  {Array.from({ length: GRID_SIZE }, (_, index) =>
                    renderTile(index)
                  )}
                </div>

                {gameState === "idle" && (
                  <div className="text-center mt-8">
                    <p className="text-white/70 mb-4">
                      Configure your bet and start playing!
                    </p>
                    <GiMining className="text-6xl text-yellow-500/30 mx-auto" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-[#1A0015] rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FaHistory className="text-blue-400" />
              Game History
            </h3>
            {gameHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-3 px-4 text-white/70 font-medium">
                        Time
                      </th>
                      <th className="py-3 px-4 text-white/70 font-medium">
                        Bet
                      </th>
                      <th className="py-3 px-4 text-white/70 font-medium">
                        Mines
                      </th>
                      <th className="py-3 px-4 text-white/70 font-medium">
                        Revealed
                      </th>
                      <th className="py-3 px-4 text-white/70 font-medium">
                        Result
                      </th>
                      <th className="py-3 px-4 text-white/70 font-medium">
                        Winnings
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameHistory.map((game) => (
                      <tr
                        key={game.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4 text-white/70">
                          {game.timestamp.toLocaleTimeString()}
                        </td>
                        <td className="py-4 px-4">{game.bet}</td>
                        <td className="py-4 px-4">{game.mines}</td>
                        <td className="py-4 px-4">{game.revealed}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs capitalize ${
                              game.result === "win"
                                ? "bg-green-500/20 text-green-500"
                                : game.result === "loss"
                                ? "bg-red-500/20 text-red-500"
                                : "bg-yellow-500/20 text-yellow-500"
                            }`}
                          >
                            {game.result}
                          </span>
                        </td>
                        <td
                          className={`py-4 px-4 ${
                            game.winnings > 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {game.winnings > 0 ? `+${game.winnings}` : "0"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaHistory className="text-4xl text-white/30 mx-auto mb-4" />
                <p className="text-white/50">No games played yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#1A0015] rounded-xl p-6">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <FaChartLine className="text-blue-400" />
                Win Rate
              </h4>
              <div className="text-3xl font-bold text-green-500 mb-2">
                {gameHistory.length > 0
                  ? `${(
                      (gameHistory.filter((g) => g.result === "win").length /
                        gameHistory.length) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}
              </div>
              <p className="text-white/60 text-sm">
                {gameHistory.filter((g) => g.result === "win").length} wins out
                of {gameHistory.length} games
              </p>
            </div>

            <div className="bg-[#1A0015] rounded-xl p-6">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <FaTrophy className="text-yellow-500" />
                Best Win
              </h4>
              <div className="text-3xl font-bold text-yellow-500 mb-2">
                {gameHistory.length > 0
                  ? Math.max(...gameHistory.map((g) => g.winnings)).toFixed(0)
                  : "0"}
              </div>
              <p className="text-white/60 text-sm">Highest single game win</p>
            </div>

            <div className="bg-[#1A0015] rounded-xl p-6">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <GiDiamonds className="text-purple-500" />
                Total Profit
              </h4>
              <div
                className={`text-3xl font-bold mb-2 ${
                  gameHistory.reduce((sum, g) => sum + g.winnings - g.bet, 0) >=
                  0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {gameHistory
                  .reduce((sum, g) => sum + g.winnings - g.bet, 0)
                  .toFixed(0)}
              </div>
              <p className="text-white/60 text-sm">Net profit/loss</p>
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="bg-[#1A0015] rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FaTrophy className="text-yellow-500" />
              Leaderboard
            </h3>
            <div className="text-center py-12">
              <FaTrophy className="text-4xl text-white/30 mx-auto mb-4" />
              <p className="text-white/50 mb-2">Leaderboard coming soon!</p>
              <p className="text-white/30 text-sm">
                Connect to ICP to see global rankings
              </p>
            </div>
          </div>
        )}

        {/* Game Information */}
        <div className="mt-12">
          <GameDetail gameData={gameData} bettingTableData={bettingTableData} />
        </div>
      </div>
    </div>
  );
}
