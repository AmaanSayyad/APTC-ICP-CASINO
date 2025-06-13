import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "react-spring";
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
} from "./config/plinkoGameDetail";
import { manualFormConfig, autoFormConfig } from "./config/plinkoFormConfig";
import {
  FaPlay,
  FaStop,
  FaHistory,
  FaTrophy,
  FaChartLine,
  FaCoins,
  FaCog,
} from "react-icons/fa";
import { GiPinball, GiTreasureMap, GiDiamonds } from "react-icons/gi";
import confetti from "canvas-confetti";

// Plinko board configuration
const BOARD_WIDTH = 600;
const BOARD_HEIGHT = 800;
const PEG_ROWS = 16;
const MULTIPLIERS = [
  1000, 130, 26, 9, 4, 2, 2, 1, 0.2, 1, 2, 2, 4, 9, 26, 130, 1000,
];
const BALL_SIZE = 12;
const PEG_SIZE = 8;

// Physics constants
const GRAVITY = 0.5;
const BOUNCE = 0.7;
const FRICTION = 0.98;

// Ball class for physics simulation
class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = 0;
    this.radius = BALL_SIZE / 2;
    this.bounces = 0;
    this.finished = false;
    this.slot = -1;
  }

  update(pegs, slots) {
    if (this.finished) return;

    // Apply gravity
    this.vy += GRAVITY;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Apply friction
    this.vx *= FRICTION;

    // Check collision with pegs
    pegs.forEach((peg) => {
      const dx = this.x - peg.x;
      const dy = this.y - peg.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.radius + peg.radius) {
        // Collision with peg
        const angle = Math.atan2(dy, dx);
        const targetX = peg.x + Math.cos(angle) * (this.radius + peg.radius);
        const targetY = peg.y + Math.sin(angle) * (this.radius + peg.radius);

        this.x = targetX;
        this.y = targetY;

        // Bounce
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.vx = Math.cos(angle) * speed * BOUNCE;
        this.vy = Math.sin(angle) * speed * BOUNCE;

        // Add some randomness
        this.vx += (Math.random() - 0.5) * 2;
        this.bounces++;
      }
    });

    // Check if ball reached bottom
    if (this.y > BOARD_HEIGHT - 100) {
      // Determine which slot the ball landed in
      const slotWidth = BOARD_WIDTH / MULTIPLIERS.length;
      const slotIndex = Math.floor(this.x / slotWidth);
      this.slot = Math.max(0, Math.min(MULTIPLIERS.length - 1, slotIndex));
      this.finished = true;
    }

    // Boundary checks
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx *= -BOUNCE;
    }
    if (this.x > BOARD_WIDTH - this.radius) {
      this.x = BOARD_WIDTH - this.radius;
      this.vx *= -BOUNCE;
    }
  }
}

// Generate peg positions
const generatePegs = () => {
  const pegs = [];
  for (let row = 0; row < PEG_ROWS; row++) {
    const pegCount = row + 3;
    const rowY = 100 + row * 40;
    const startX = (BOARD_WIDTH - (pegCount - 1) * 40) / 2;

    for (let col = 0; col < pegCount; col++) {
      pegs.push({
        x: startX + col * 40,
        y: rowY,
        radius: PEG_SIZE / 2,
      });
    }
  }
  return pegs;
};

export default function PlinkoGame() {
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
  const [balls, setBalls] = useState([]);
  const [gameState, setGameState] = useState("idle"); // idle, playing, autoplay
  const [betAmount, setBetAmount] = useState(10);
  const [risk, setRisk] = useState("medium"); // low, medium, high
  const [rows, setRows] = useState(16);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("game");
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayCount, setAutoPlayCount] = useState(0);
  const [maxAutoBets, setMaxAutoBets] = useState(10);
  const [currentBetId, setCurrentBetId] = useState(null);

  // Refs
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const pegsRef = useRef(generatePegs());

  // Statistics
  const [stats, setStats] = useState({
    totalGames: 0,
    totalWon: 0,
    totalLost: 0,
    biggestWin: 0,
    currentStreak: 0,
    bestStreak: 0,
  });

  // Animation loop
  const animate = useCallback(() => {
    setBalls((currentBalls) => {
      const updatedBalls = currentBalls.map((ball) => {
        if (!ball.finished) {
          ball.update(pegsRef.current, MULTIPLIERS);
        }
        return ball;
      });

      // Check for finished balls and process APTC payouts
      const finishedBalls = updatedBalls.filter(
        (ball) => ball.finished && !ball.processed
      );

      finishedBalls.forEach(async (ball) => {
        ball.processed = true;
        const multiplier = MULTIPLIERS[ball.slot];
        const winAmount = betAmount * multiplier;

        // Process APTC bet result
        if (ball.betId) {
          const isWin = winAmount > betAmount;
          await processBetResult(ball.betId, isWin, multiplier);
        }

        setTotalWinnings((prev) => prev + winAmount - betAmount);

        // Add to history
        setGameHistory((prev) => [
          {
            id: Date.now() + Math.random(),
            bet: betAmount,
            multiplier: multiplier,
            winnings: winAmount,
            slot: ball.slot,
            timestamp: new Date(),
            result: winAmount > betAmount ? "win" : "loss",
          },
          ...prev.slice(0, 99),
        ]); // Keep last 100 games

        // Show confetti for big wins
        if (multiplier >= 26) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      });

      // Remove old finished balls
      return updatedBalls.filter((ball) => !ball.finished || !ball.processed);
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [betAmount]);

  // Start animation loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  // Drop a ball with APTC integration
  const dropBall = useCallback(async () => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      // Place APTC bet
      const betRecord = await placeAPTCBet(
        betAmount,
        "plinko",
        `plinko-${Date.now()}`,
        { risk, rows }
      );

      const newBall = new Ball(
        BOARD_WIDTH / 2 + (Math.random() - 0.5) * 20,
        20
      );
      newBall.betId = betRecord.id; // Store bet ID with the ball
      setBalls((prev) => [...prev, newBall]);
      setCurrentBetId(betRecord.id);
    } catch (error) {
      alert(error.message || "Failed to place bet");
    }
  }, [betAmount, isConnected, placeAPTCBet, risk, rows]);

  // Handle manual form submission
  const handleManualBetting = (formData) => {
    setBetAmount(Number(formData.betAmount) || 10);
    setRisk(formData.risk || "medium");
    setRows(Number(formData.rows) || 16);

    if (formData.autoDrop) {
      setIsAutoPlay(true);
      setMaxAutoBets(Number(formData.numberOfBets) || 10);
      setAutoPlayCount(0);
      setGameState("autoplay");
    } else {
      dropBall();
      setGameState("playing");
    }
  };

  // Handle auto form submission
  const handleAutoBetting = (formData) => {
    setBetAmount(Number(formData.betAmount) || 10);
    setRisk(formData.risk || "medium");
    setRows(Number(formData.rows) || 16);
    setMaxAutoBets(Number(formData.numberOfBets) || 10);
    setAutoPlayCount(0);
    setIsAutoPlay(true);
    setGameState("autoplay");
  };

  // Auto play effect
  useEffect(() => {
    if (
      isAutoPlay &&
      autoPlayCount < maxAutoBets &&
      balance >= betAmount &&
      isConnected
    ) {
      const timer = setTimeout(() => {
        dropBall();
        setAutoPlayCount((prev) => prev + 1);
      }, 1000); // Drop a ball every second

      return () => clearTimeout(timer);
    } else if (
      autoPlayCount >= maxAutoBets ||
      balance < betAmount ||
      !isConnected
    ) {
      setIsAutoPlay(false);
      setGameState("idle");
    }
  }, [
    isAutoPlay,
    autoPlayCount,
    maxAutoBets,
    balance,
    betAmount,
    dropBall,
    isConnected,
  ]);

  // Stop auto play
  const stopAutoPlay = () => {
    setIsAutoPlay(false);
    setGameState("idle");
  };

  // Render multiplier color
  const getMultiplierColor = (multiplier) => {
    if (multiplier >= 1000) return "text-purple-500";
    if (multiplier >= 100) return "text-red-500";
    if (multiplier >= 10) return "text-orange-500";
    if (multiplier >= 2) return "text-yellow-500";
    if (multiplier >= 1) return "text-green-500";
    return "text-gray-500";
  };

  const tabs = [
    {
      label: "Manual",
      content: (
        <div className="space-y-4">
          <BettingPanel
            balance={balance}
            onPlaceBet={dropBall}
            isGameActive={gameState === "playing" || gameState === "autoplay"}
            gameType="plinko"
            customBetControls={
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Risk Level
                  </label>
                  <select
                    value={risk}
                    onChange={(e) => setRisk(e.target.value)}
                    disabled={gameState === "autoplay"}
                    className="w-full bg-[#2A1B3D] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Rows
                  </label>
                  <select
                    value={rows}
                    onChange={(e) => setRows(Number(e.target.value))}
                    disabled={gameState === "autoplay"}
                    className="w-full bg-[#2A1B3D] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  >
                    {[8, 12, 16].map((num) => (
                      <option key={num} value={num}>
                        {num} Rows
                      </option>
                    ))}
                  </select>
                </div>
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
          disabled={gameState === "autoplay"}
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
            <GiPinball className="text-4xl text-blue-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Plinko
            </h1>
          </div>
          <p className="text-white/70 text-lg">
            Drop the ball and watch it bounce to victory
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
            <p className="text-white/60 text-sm">Total P&L</p>
            <p
              className={`text-xl font-bold ${
                totalWinnings >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {totalWinnings >= 0 ? "+" : ""}
              {formatTokenAmount(totalWinnings)} APTC
            </p>
          </div>
          <div className="bg-[#1A0015] rounded-lg p-4 text-center">
            <FaTrophy className="text-purple-500 text-2xl mx-auto mb-2" />
            <p className="text-white/60 text-sm">Best Win</p>
            <p className="text-xl font-bold">{stats.biggestWin.toFixed(2)}</p>
          </div>
          <div className="bg-[#1A0015] rounded-lg p-4 text-center">
            <FaChartLine className="text-green-500 text-2xl mx-auto mb-2" />
            <p className="text-white/60 text-sm">Games</p>
            <p className="text-xl font-bold">{stats.totalGames}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto">
          {[
            { id: "game", label: "Game", icon: GiPinball },
            { id: "history", label: "History", icon: FaHistory },
            { id: "stats", label: "Statistics", icon: FaChartLine },
            { id: "leaderboard", label: "Leaderboard", icon: FaTrophy },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === id
                  ? "text-white border-b-2 border-blue-400"
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
                  <FaCog className="text-blue-400" />
                  Game Controls
                </h3>
                <Tabs tabs={tabs} />
              </div>

              {/* Betting History */}
              <div className="bg-[#1A0015] rounded-xl p-6 mb-6">
                <BettingHistoryComponent gameType="plinko" />
              </div>

              {/* Quick Actions */}
              <div className="bg-[#1A0015] rounded-xl p-6 mb-6">
                <h4 className="font-bold mb-4">Quick Actions</h4>
                <div className="flex flex-col gap-3">
                  {gameState !== "autoplay" ? (
                    <Button
                      onClick={dropBall}
                      disabled={!isConnected || balance < betAmount}
                      className="w-full bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600"
                    >
                      <FaPlay className="mr-2" />
                      Drop Ball (Bet: {formatTokenAmount(betAmount)} APTC)
                    </Button>
                  ) : (
                    <Button
                      onClick={stopAutoPlay}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    >
                      <FaStop className="mr-2" />
                      Stop Auto ({autoPlayCount}/{maxAutoBets})
                    </Button>
                  )}
                </div>
              </div>

              {/* Auto Play Progress */}
              {isAutoPlay && (
                <div className="bg-[#1A0015] rounded-xl p-6">
                  <h4 className="font-bold mb-4">Auto Play Progress</h4>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>
                        {autoPlayCount}/{maxAutoBets}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(autoPlayCount / maxAutoBets) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    Next ball in {isAutoPlay ? "1" : "0"} second
                    {isAutoPlay ? "" : "s"}
                  </p>
                </div>
              )}
            </div>

            {/* Game Board */}
            <div className="lg:col-span-2">
              <div className="bg-[#1A0015] rounded-xl p-8">
                {/* Plinko Board Visualization */}
                <div
                  className="relative mx-auto bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden"
                  style={{
                    width: `${BOARD_WIDTH}px`,
                    height: `${BOARD_HEIGHT}px`,
                    maxWidth: "100%",
                  }}
                >
                  {/* Pegs */}
                  {pegsRef.current.map((peg, index) => (
                    <div
                      key={index}
                      className="absolute bg-white rounded-full"
                      style={{
                        left: `${peg.x - peg.radius}px`,
                        top: `${peg.y - peg.radius}px`,
                        width: `${peg.radius * 2}px`,
                        height: `${peg.radius * 2}px`,
                      }}
                    />
                  ))}

                  {/* Balls */}
                  <AnimatePresence>
                    {balls.map((ball, index) => (
                      <motion.div
                        key={index}
                        className="absolute bg-yellow-400 rounded-full border-2 border-yellow-300 shadow-lg"
                        style={{
                          left: `${ball.x - ball.radius}px`,
                          top: `${ball.y - ball.radius}px`,
                          width: `${ball.radius * 2}px`,
                          height: `${ball.radius * 2}px`,
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Multiplier Slots */}
                  <div className="absolute bottom-0 left-0 right-0 flex">
                    {MULTIPLIERS.map((multiplier, index) => (
                      <div
                        key={index}
                        className={`flex-1 text-center py-3 text-xs font-bold border-l border-gray-600 ${getMultiplierColor(
                          multiplier
                        )}`}
                        style={{ minHeight: "60px" }}
                      >
                        {multiplier}x
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drop Zone */}
                <div className="text-center mt-4">
                  <div className="inline-block px-6 py-2 bg-yellow-400 text-black rounded-full font-bold">
                    ↓ DROP ZONE ↓
                  </div>
                </div>
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
                        Multiplier
                      </th>
                      <th className="py-3 px-4 text-white/70 font-medium">
                        Winnings
                      </th>
                      <th className="py-3 px-4 text-white/70 font-medium">
                        Profit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameHistory.slice(0, 20).map((game) => (
                      <tr
                        key={game.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4 text-white/70">
                          {game.timestamp.toLocaleTimeString()}
                        </td>
                        <td className="py-4 px-4">{game.bet.toFixed(2)}</td>
                        <td
                          className={`py-4 px-4 font-bold ${getMultiplierColor(
                            game.multiplier
                          )}`}
                        >
                          {game.multiplier}x
                        </td>
                        <td className="py-4 px-4">
                          {game.winnings.toFixed(2)}
                        </td>
                        <td
                          className={`py-4 px-4 ${
                            game.winnings > game.bet
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {game.winnings > game.bet ? "+" : ""}
                          {(game.winnings - game.bet).toFixed(2)}
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
                <FaChartLine className="text-green-500" />
                Win Rate
              </h4>
              <div className="text-3xl font-bold text-green-500 mb-2">
                {stats.totalGames > 0
                  ? `${((stats.totalWon / stats.totalGames) * 100).toFixed(1)}%`
                  : "0%"}
              </div>
              <p className="text-white/60 text-sm">
                {stats.totalWon} wins out of {stats.totalGames} games
              </p>
            </div>

            <div className="bg-[#1A0015] rounded-xl p-6">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <FaTrophy className="text-yellow-500" />
                Best Streak
              </h4>
              <div className="text-3xl font-bold text-yellow-500 mb-2">
                {stats.bestStreak}
              </div>
              <p className="text-white/60 text-sm">
                Current: {stats.currentStreak}
              </p>
            </div>

            <div className="bg-[#1A0015] rounded-xl p-6">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <GiDiamonds className="text-purple-500" />
                Net Profit
              </h4>
              <div
                className={`text-3xl font-bold mb-2 ${
                  totalWinnings >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {totalWinnings >= 0 ? "+" : ""}
                {totalWinnings.toFixed(2)}
              </div>
              <p className="text-white/60 text-sm">Total profit/loss</p>
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
