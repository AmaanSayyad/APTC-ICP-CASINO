import React, { useState, useEffect } from "react";
import GameWheel from "../../../components/wheel/GameWheel";
import BettingPanel from "../../../components/wheel/BettingPanel";
import GameHistory from "../../../components/wheel/GameHistory";
import { calculateResult } from "../../../lib/gameLogic";
import { motion } from "framer-motion";
import {
  FaHistory,
  FaTrophy,
  FaInfoCircle,
  FaChartLine,
  FaCoins,
  FaChevronDown,
  FaPercentage,
  FaBalanceScale,
} from "react-icons/fa";
import {
  GiCardRandom,
  GiWheelbarrow,
  GiSpinningBlades,
  GiTrophyCup,
} from "react-icons/gi";
import { HiOutlineTrendingUp, HiOutlineChartBar } from "react-icons/hi";
import useWalletStatus from "../../../hooks/useWalletStatus";
import ConnectWalletButton from "../../../components/ConnectWalletButton";
import TokenBalance from "../../../components/TokenBalance";
import WheelInfoTabs from "./components/WheelInfoTabs";
import WheelClient from "../../../config/wheel-integration";

// Renamed component to be compatible with standard React
const WheelGame = () => {
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [risk, setRisk] = useState("medium");
  const [noOfSegments, setSegments] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [gameMode, setGameMode] = useState("manual");
  const [currentMultiplier, setCurrentMultiplier] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [targetMultiplier, setTargetMultiplier] = useState(null);
  const [wheelPosition, setWheelPosition] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState("medium");
  const [result, setResult] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // Wallet connection
  const { isConnected, address } = useWalletStatus();

  // Initialize wheel client and fetch wheel segments when component mounts
  useEffect(() => {
    const initializeWheelGame = async () => {
      try {
        console.log("🎡 Initializing wheel game client...");
        const wheelClient = new WheelClient();
        await wheelClient.ensureActor();

        // Fetch wheel segments for current risk level
        console.log(`🎮 Fetching wheel segments for risk level: ${risk}`);
        const segments = await wheelClient.getWheelSegments(risk, noOfSegments);
        console.log("✅ Wheel segments:", segments);

        // Fetch player history if connected
        if (isConnected) {
          try {
            console.log("📜 Fetching player history...");
            const history = await wheelClient.getPlayerHistory();

            if (history && history.length > 0) {
              console.log("✅ Player history:", history);
              // Convert history to our format and update state
              const formattedHistory = history.map((item) => ({
                id: item.id || Date.now(),
                game: "Wheel",
                time: new Date(
                  Number(item.timestamp) / 1000000
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                betAmount: Number(item.betAmount) / 100000000, // Convert from e8s
                multiplier: `${item.result.multiplier.toFixed(2)}x`,
                payout: Number(item.payout) / 100000000, // Convert from e8s
              }));

              setGameHistory(formattedHistory);
            }
          } catch (historyError) {
            console.warn("⚠️ Error fetching player history:", historyError);
          }
        }
      } catch (error) {
        console.error("❌ Error initializing wheel game:", error);
      }
    };

    initializeWheelGame();
  }, [risk, noOfSegments, isConnected]);

  // Scroll to section function
  const scrollToElement = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      const yOffset = -100; // Adjust this value for proper scroll position
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Handle token approval for the wheel game
  const handleTokenApproval = async (amount) => {
    try {
      console.log("🔍 Processing token approval for wheel game:", amount);

      // Dispatch token approval event
      window.dispatchEvent(
        new CustomEvent("tokenApproved", {
          detail: {
            game: "wheel",
            amount: amount,
            operation: "approve",
          },
        })
      );

      return true;
    } catch (error) {
      console.error("❌ Error in wheel token approval:", error);
      return false;
    }
  };

  const manulBet = async () => {
    if (betAmount <= 0 || betAmount > balance || isSpinning) return;

    setIsSpinning(true);
    setHasSpun(false);

    // 0. Handle token approval first
    const approvalSuccess = await handleTokenApproval(betAmount);
    if (!approvalSuccess) {
      setIsSpinning(false);
      alert("Failed to approve tokens for the game.");
      return;
    }

    // 1. Dispatch bet placed event to update token balance UI immediately
    window.dispatchEvent(
      new CustomEvent("betPlaced", {
        detail: { amount: betAmount, game: "wheel" },
      })
    );

    // 2. Update local balance for UI responsiveness
    setBalance((prev) => prev - betAmount);

    // 3. Ensure token balance is refreshed after bet is placed
    setTimeout(() => {
      if (typeof window.refreshTokenBalance === "function") {
        window.refreshTokenBalance(true);
      }
    }, 300);

    try {
      // 3. Initialize the wheel client
      const wheelClient = new WheelClient();

      console.log(
        `🎮 Starting wheel spin with bet amount ${betAmount} and risk ${risk}`
      );

      // 4. Call the backend via WheelClient integration
      const result = await wheelClient.spinWheel(betAmount, risk, noOfSegments);

      console.log("✅ Wheel spin result:", result);

      // 5. Start wheel animation
      setTimeout(() => {
        // Extract multiplier and position from the result
        const multiplier = result.result.multiplier;
        const position = result.result.position;

        setCurrentMultiplier(multiplier);
        setWheelPosition(position);

        // 6. Show results after animation completes
        setTimeout(() => {
          const winAmount = Number(result.payout) / 100000000; // Convert from e8s to APTC

          // 7. Update local balance for UI
          setBalance((prev) => prev + winAmount);

          // 8. Dispatch game result event to refresh token balance
          window.dispatchEvent(
            new CustomEvent("gameResult", {
              detail: {
                game: "wheel",
                bet: betAmount,
                multiplier: multiplier,
                payout: winAmount,
              },
            })
          );

          const newHistoryItem = {
            id: result.id || Date.now(),
            game: "Wheel",
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            betAmount: betAmount,
            multiplier: `${multiplier.toFixed(2)}x`,
            payout: winAmount,
          };

          setGameHistory((prev) => [newHistoryItem, ...prev]);
          setIsSpinning(false);
          setHasSpun(true);

          // 9. Ensure token balance is refreshed after win
          if (typeof window.refreshTokenBalance === "function") {
            window.refreshTokenBalance(true);
          }
        }, 1000);
      }, 3000);
    } catch (error) {
      console.error("❌ Error in spinning wheel:", error);
      setIsSpinning(false);

      // Show error to user
      alert(`Error spinning the wheel: ${error.message || "Unknown error"}`);

      // Refund the bet amount in UI only
      setBalance((prev) => prev + betAmount);
    }
  };

  const autoBet = async ({
    numberOfBets,
    winIncrease = 0,
    lossIncrease = 0,
    stopProfit = 0,
    stopLoss = 0,
    betAmount: initialBetAmount,
    risk,
    noOfSegments,
  }) => {
    if (isSpinning) return; // Prevent overlapping spins

    let currentBet = initialBetAmount;
    let totalProfit = 0;

    try {
      for (let i = 0; i < numberOfBets; i++) {
        setIsSpinning(true);
        setHasSpun(false);

        // Handle token approval first
        const approvalSuccess = await handleTokenApproval(currentBet);
        if (!approvalSuccess) {
          setIsSpinning(false);
          alert("Failed to approve tokens for auto-betting.");
          break;
        }

        // Dispatch bet placed event for token balance update with game info
        window.dispatchEvent(
          new CustomEvent("betPlaced", {
            detail: { amount: currentBet, game: "wheel" },
          })
        );

        // Update local balance for UI
        setBalance((prev) => prev - currentBet);

        // Ensure token balance is refreshed after bet is placed
        setTimeout(() => {
          if (typeof window.refreshTokenBalance === "function") {
            window.refreshTokenBalance(true);
          }
        }, 300);

        // Call backend to get result with current bet amount
        const result = await calculateResult(risk, noOfSegments, currentBet);

        // Simulate spin delay
        await new Promise((r) => setTimeout(r, 3000)); // spin animation time

        setCurrentMultiplier(result.multiplier);
        setWheelPosition(result.position);

        setIsSpinning(false);
        setHasSpun(true);

        // Wait 2 seconds to show the result
        await new Promise((r) => setTimeout(r, 2000));

        // Calculate win amount
        const winAmount = currentBet * result.multiplier;

        // Update local balance for UI
        setBalance((prev) => prev + winAmount);

        // Dispatch game result event to refresh token balance
        window.dispatchEvent(
          new CustomEvent("gameResult", {
            detail: {
              game: "wheel",
              bet: currentBet,
              multiplier: result.multiplier,
              payout: winAmount,
            },
          })
        );

        // Ensure token balance is refreshed after win
        if (typeof window.refreshTokenBalance === "function") {
          window.refreshTokenBalance(true);
        }

        // Update total profit
        const profit = winAmount - currentBet;
        totalProfit += profit;

        // Store history entry
        const newHistoryItem = {
          id: Date.now() + i, // unique id per bet
          game: "Wheel",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          betAmount: currentBet,
          multiplier: `${result.multiplier.toFixed(2)}x`,
          payout: winAmount,
        };

        setGameHistory((prev) => [newHistoryItem, ...prev]);

        // Adjust bet for next round based on win/loss increase
        if (result.multiplier > 1) {
          currentBet = Math.floor(currentBet + currentBet * winIncrease);
        } else {
          currentBet = Math.floor(currentBet + currentBet * lossIncrease);
        }

        // Clamp bet to balance
        if (currentBet > balance) currentBet = balance;
        if (currentBet <= 0) currentBet = initialBetAmount;

        // Stop conditions
        if (stopProfit > 0 && totalProfit >= stopProfit) break;
        if (stopLoss > 0 && totalProfit <= -stopLoss) break;
      }
    } catch (error) {
      console.error("Error in auto-betting:", error);
      // Show error to user
      alert("Error during auto betting. Please try again.");
    } finally {
      setIsSpinning(false);
      setBetAmount(currentBet); // update bet amount in panel
    }
  };

  const handleSelectMultiplier = (value) => {
    setTargetMultiplier(value);
  };

  // Header Section
  const renderHeader = () => {
    // Sample statistics
    const gameStatistics = {
      totalBets: "1,856,342",
      totalVolume: "8.3M APTC",
      maxWin: "243,500 APTC",
    };

    return (
      <div className="relative text-white px-4 md:px-8 lg:px-20 mb-8 pt-20 md:pt-24 mt-4">
        {/* Background Elements */}
        <div className="absolute top-5 -right-32 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-28 left-1/3 w-32 h-32 bg-green-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-20 left-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl"></div>

        <div className="relative">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            {/* Left Column - Game Info */}
            <div className="md:w-1/2">
              <div className="flex items-center">
                <div className="mr-3 p-3 bg-gradient-to-br from-red-900/40 to-red-700/10 rounded-lg shadow-lg shadow-red-900/10 border border-red-800/20">
                  <GiWheelbarrow className="text-3xl text-red-300" />
                </div>
                <div>
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-gray-400 font-sans">
                      Games / Wheel
                    </p>
                    <span className="text-xs px-2 py-0.5 bg-red-900/30 rounded-full text-red-300 font-display">
                      Classic
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-green-900/30 rounded-full text-green-300 font-display">
                      Live
                    </span>
                  </motion.div>
                  <motion.h1
                    className="text-3xl md:text-4xl font-bold font-display bg-gradient-to-r from-red-300 to-amber-300 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    Fortune Wheel
                  </motion.h1>
                </div>
              </div>
              <motion.p
                className="text-white/70 mt-2 max-w-xl font-sans"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Place your bets and experience the thrill of the spinning wheel.
                From simple risk levels to customizable segments, the choice is
                yours.
              </motion.p>

              {/* Game highlights */}
              <motion.div
                className="flex flex-wrap gap-4 mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center text-sm bg-gradient-to-r from-red-900/30 to-red-800/10 px-3 py-1.5 rounded-full">
                  <FaPercentage className="mr-1.5 text-amber-400" />
                  <span className="font-sans">2.7% house edge</span>
                </div>
                <div className="flex items-center text-sm bg-gradient-to-r from-red-900/30 to-red-800/10 px-3 py-1.5 rounded-full">
                  <GiSpinningBlades className="mr-1.5 text-blue-400" />
                  <span className="font-sans">Multiple risk levels</span>
                </div>
                <div className="flex items-center text-sm bg-gradient-to-r from-red-900/30 to-red-800/10 px-3 py-1.5 rounded-full">
                  <FaBalanceScale className="mr-1.5 text-green-400" />
                  <span className="font-sans">Provably fair gaming</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Stats and Controls */}
            <div className="md:w-1/2">
              <div className="bg-gradient-to-br from-red-900/20 to-red-800/5 rounded-xl p-4 border border-red-800/20 shadow-lg shadow-red-900/10">
                {/* Quick stats in top row */}
                <motion.div
                  className="grid grid-cols-3 gap-2 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 mb-1">
                      <FaChartLine className="text-blue-400" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">
                      Total Bets
                    </div>
                    <div className="text-white font-display text-sm md:text-base">
                      {gameStatistics.totalBets}
                    </div>
                  </div>

                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600/20 mb-1">
                      <FaCoins className="text-yellow-400" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">
                      Volume
                    </div>
                    <div className="text-white font-display text-sm md:text-base">
                      {gameStatistics.totalVolume}
                    </div>
                  </div>

                  <div className="flex flex-col items-center p-2 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600/20 mb-1">
                      <FaTrophy className="text-yellow-500" />
                    </div>
                    <div className="text-xs text-white/50 font-sans text-center">
                      Max Win
                    </div>
                    <div className="text-white font-display text-sm md:text-base">
                      {gameStatistics.maxWin}
                    </div>
                  </div>
                </motion.div>

                {/* Quick actions */}
                <motion.div
                  className="flex flex-wrap justify-between gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <button
                    onClick={() => scrollToElement("strategy-guide")}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-800/40 to-red-900/20 rounded-lg text-white font-medium text-sm hover:from-red-700/40 hover:to-red-800/20 transition-all duration-300"
                  >
                    <GiCardRandom className="mr-2" />
                    Strategy Guide
                  </button>
                  <button
                    onClick={() => scrollToElement("probability")}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-800/40 to-blue-900/20 rounded-lg text-white font-medium text-sm hover:from-blue-700/40 hover:to-blue-800/20 transition-all duration-300"
                  >
                    <HiOutlineChartBar className="mr-2" />
                    Probabilities
                  </button>
                  <button
                    onClick={() => scrollToElement("history")}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-800/40 to-purple-900/20 rounded-lg text-white font-medium text-sm hover:from-purple-700/40 hover:to-purple-800/20 transition-all duration-300"
                  >
                    <FaChartLine className="mr-2" />
                    Game History
                  </button>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="w-full h-0.5 bg-gradient-to-r from-red-600 via-blue-500/30 to-transparent mt-6"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#070005] text-white pb-20">
      {/* Header */}
      {renderHeader()}

      {/* Main Game Section */}
      <div className="px-4 md:px-8 lg:px-20">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3">
            <GameWheel
              risk={risk}
              isSpinning={isSpinning}
              noOfSegments={noOfSegments}
              currentMultiplier={currentMultiplier}
              targetMultiplier={targetMultiplier}
              handleSelectMultiplier={handleSelectMultiplier}
              wheelPosition={wheelPosition}
              hasSpun={hasSpun}
            />
          </div>
          <div className="w-full lg:w-1/3">
            <BettingPanel
              balance={balance}
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              risk={risk}
              setRisk={setRisk}
              noOfSegments={noOfSegments}
              setSegments={setSegments}
              manulBet={manulBet}
              isSpinning={isSpinning}
              autoBet={autoBet}
            />
          </div>
        </div>
      </div>

      {/* Info Tabs Section */}
      <WheelInfoTabs />
    </div>
  );
};

export default WheelGame;
