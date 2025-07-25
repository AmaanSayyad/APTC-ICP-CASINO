import React, { useState, useEffect, useMemo } from "react";
import Tabs from "../../../components/Tabs";
import DynamicForm from "./Form";
import Game from "./game";
import MinesGameDetail from "./components/MinesGameDetail.jsx";
import MinesBettingTable from "./components/MinesBettingTable.jsx";
import MinesProbability from "./components/MinesProbability.jsx";
import MinesHistory from "./components/MinesHistory.jsx";
import MinesLeaderboard from "./components/MinesLeaderboard.jsx";
import {
  gameData,
  bettingTableData,
  gameStatistics,
  winProbabilities,
} from "./config/gameDetail.jsx";
import { manualFormConfig, autoFormConfig } from "./config/formConfig.jsx";
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
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import { useNFID } from "../../../providers/NFIDProvider";
import { useAPTCToken } from "../../../hooks/useAPTCToken";
import "./mines.css";
import GameDetail from "../../../components/GameDetail";
import AIAutoBetting from "./components/AIAutoBetting";
import AISettingsModal from "./components/AISettingsModal";

export default function Mines() {
  // ICP Integration
  const { isConnected, principal, connect } = useNFID();
  const {
    balance: aptcBalance,
    loading: aptcLoading,
    formatTokenAmount,
    parseTokenAmount,
  } = useAPTCToken();

  console.log("my balance:", aptcBalance);

  // Game State
  const [betSettings, setBetSettings] = useState({});
  const [activeTab, setActiveTab] = useState("Manual");
  const [gameInstance, setGameInstance] = useState(1); // Force re-render on new game
  const [showTutorial, setShowTutorial] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  // AI Auto Betting State
  const [isAIActive, setIsAIActive] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiSettings, setAISettings] = useState({
    strategy: "balanced",
    maxBet: 100,
    stopLoss: 500,
    targetProfit: 1000,
    riskFactors: {
      adaptToHistory: true,
      maxConsecutiveLosses: 3,
      increaseOnWin: false,
      decreaseOnLoss: true,
    },
    tiles: {
      min: 3,
      max: 8,
    },
    mines: {
      min: 3,
      max: 10,
    },
  });

  // Theme
  const { theme } = useTheme();

  // Handle AI activation/deactivation
  const handleAIToggle = () => {
    if (!isAIActive) {
      // When activating AI, generate some random settings based on AI strategy
      const { strategy, tiles, mines } = aiSettings;

      // Choose random mines count within AI settings range
      const minesCount =
        Math.floor(Math.random() * (mines.max - mines.min + 1)) + mines.min;

      // Choose random tiles to reveal within AI settings range
      const tilesToReveal =
        Math.floor(Math.random() * (tiles.max - tiles.min + 1)) + tiles.min;

      // Generate a random bet amount based on strategy
      let betAmount = 50; // default
      if (strategy === "conservative") {
        betAmount = [10, 25, 50][Math.floor(Math.random() * 3)];
      } else if (strategy === "balanced") {
        betAmount = [50, 100, 250][Math.floor(Math.random() * 3)];
      } else if (strategy === "aggressive") {
        betAmount = [100, 250, 500][Math.floor(Math.random() * 3)];
      }

      // Create AI auto betting settings
      const aiAutoSettings = {
        betAmount,
        mines: minesCount,
        tilesToReveal,
        isAutoBetting: true,
        aiAssist: true, // Add aiAssist flag to trigger AI behavior
      };

      // Update bet settings to activate auto betting
      setBetSettings(aiAutoSettings);

      // Force game component to re-render with new settings
      setGameInstance((prev) => prev + 1);
    }

    // Toggle AI active state
    setIsAIActive(!isAIActive);
  };

  // Handle betting form submission
  const handleFormSubmit = (formData) => {
    // Disable AI if manual form is submitted
    if (isAIActive) {
      setIsAIActive(false);
    }

    // Determine if using auto betting by checking if the form contains tilesToReveal field
    // This is more reliable than checking activeTab since it's based on the actual form data
    const isAutoBetting = formData.hasOwnProperty("tilesToReveal");

    console.log("Form submitted:", formData, "Auto betting:", isAutoBetting);

    // Update bet settings which will be passed to the game component
    setBetSettings({
      ...formData,
      isAutoBetting,
    });

    // Force game component to re-render with new settings
    setGameInstance((prev) => prev + 1);
  };

  // Handle AI settings save
  const handleAISettingsSave = (newSettings) => {
    setAISettings(newSettings);

    // If AI is currently active, update the game with new settings
    if (isAIActive) {
      const { strategy, tiles, mines } = newSettings;

      // Choose random mines count within AI settings range
      const minesCount =
        Math.floor(Math.random() * (mines.max - mines.min + 1)) + mines.min;

      // Choose random tiles to reveal within AI settings range
      const tilesToReveal =
        Math.floor(Math.random() * (tiles.max - tiles.min + 1)) + tiles.min;

      // Generate a random bet amount based on strategy
      let betAmount = 50; // default
      if (strategy === "conservative") {
        betAmount = [10, 25, 50][Math.floor(Math.random() * 3)];
      } else if (strategy === "balanced") {
        betAmount = [50, 100, 250][Math.floor(Math.random() * 3)];
      } else if (strategy === "aggressive") {
        betAmount = [100, 250, 500][Math.floor(Math.random() * 3)];
      }

      // Update bet settings
      setBetSettings({
        betAmount,
        mines: minesCount,
        tilesToReveal,
        isAutoBetting: true,
        aiAssist: true, // Add aiAssist flag to trigger AI behavior
      });

      // Force game component to re-render with new settings
      setGameInstance((prev) => prev + 1);
    }
  };

  // Tab configuration - memoized to prevent unnecessary re-renders
  const tabs = useMemo(
    () => [
      {
        label: "Manual",
        content: (
          <DynamicForm config={manualFormConfig} onSubmit={handleFormSubmit} />
        ),
      },
      {
        label: "Auto",
        content: (
          <DynamicForm config={autoFormConfig} onSubmit={handleFormSubmit} />
        ),
      },
    ],
    []
  );

  // Handle tab change
  const handleTabChange = (tabLabel) => {
    setActiveTab(tabLabel);
  };

  // Function to scroll to a specific element
  const scrollToElement = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      console.warn(`Element with id '${elementId}' not found.`);
    }
  };

  // Header Section
  const renderHeader = () => (
    <div className="relative text-white px-4 md:px-8 lg:px-20 mb-8 pt-8 md:pt-10 mt-4">
      {/* Background Elements */}
      <div className="absolute top-5 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-28 left-1/3 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-20 left-1/4 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl"></div>

      <div className="relative">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          {/* Left Column - Game Info */}
          <div className="md:w-3/4">
            <div className="flex items-center">
              <div className="mr-3 p-3 bg-gradient-to-br from-purple-900/40 to-purple-700/10 rounded-lg shadow-lg shadow-purple-900/10 border border-purple-800/20">
                <GiMineExplosion className="text-3xl text-purple-300" />
              </div>
              <div>
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm text-gray-400 font-sans">
                    Games / Mines
                  </p>
                  <span className="text-xs px-2 py-0.5 bg-purple-900/30 rounded-full text-purple-300 font-display">
                    Popular
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-green-900/30 rounded-full text-green-300 font-display">
                    Live
                  </span>
                </motion.div>
                <motion.h1
                  className="text-3xl md:text-4xl font-bold font-display bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  Mines
                </motion.h1>
              </div>
            </div>
            <motion.p
              className="text-white/70 mt-2 max-w-xl font-sans"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Unearth hidden gems while avoiding mines. Higher risk means higher
              rewards - can you beat the odds?
            </motion.p>

            {/* Game highlights */}
            <motion.div
              className="flex flex-wrap gap-3 mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center text-sm bg-gradient-to-r from-purple-900/30 to-purple-800/10 px-3 py-1.5 rounded-full">
                <FaBomb className="mr-1.5 text-red-400" />
                <span className="font-sans">Up to 24 mines</span>
              </div>
              <div className="flex items-center text-sm bg-gradient-to-r from-purple-900/30 to-purple-800/10 px-3 py-1.5 rounded-full">
                <GiDiamonds className="mr-1.5 text-blue-400" />
                <span className="font-sans">Customizable game grid</span>
              </div>
              <div className="flex items-center text-sm bg-gradient-to-r from-purple-900/30 to-purple-800/10 px-3 py-1.5 rounded-full">
                <GiCrystalGrowth className="mr-1.5 text-green-400" />
                <span className="font-sans">Provably fair gaming</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Stats and Controls */}
          <div className="md:w-3/4">
            <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/5 rounded-xl p-3 border border-purple-800/20 shadow-lg shadow-purple-900/10">
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
                    <GiGoldBar className="text-yellow-400" />
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
                  className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-800/40 to-purple-900/20 rounded-lg text-white font-medium text-sm hover:from-purple-700/40 hover:to-purple-800/20 transition-all duration-300"
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
                  className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-pink-800/40 to-pink-900/20 rounded-lg text-white font-medium text-sm hover:from-pink-700/40 hover:to-pink-800/20 transition-all duration-300"
                >
                  <FaHistory className="mr-2" />
                  Game History
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="w-full h-0.5 bg-gradient-to-r from-purple-600 via-blue-500/30 to-transparent mt-6"></div>
      </div>
    </div>
  );

  // Main Content Section
  const renderMainContent = () => (
    <div className="flex flex-col lg:flex-row gap-4 px-4 md:px-8 lg:px-20">
      {/* Sidebar/Tabs */}
      <div className="w-full lg:w-1/3 xl:w-1/4">
        <motion.div
          className="rounded-xl border-2 border-purple-700/30 bg-gradient-to-br from-[#290023]/80 to-[#150012]/90 backdrop-blur-sm p-5 shadow-xl shadow-purple-900/20"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs tabs={tabs} onTabChange={handleTabChange} />
        </motion.div>
      </div>

      {/* Game Area */}
      <motion.div
        className="w-full lg:w-2/3 xl:w-3/4 rounded-xl border-2 border-purple-700/30 bg-gradient-to-br from-[#290023]/80 to-[#150012]/90 backdrop-blur-sm p-6 md:p-8 shadow-xl shadow-purple-900/20 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-pink-500/5 rounded-full blur-2xl -z-10 animate-pulse"></div>

        <motion.div
          key={gameInstance}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          <Game
            betSettings={betSettings}
            isWalletConnected={isConnected}
            walletPrincipal={principal}
            aptcBalance={aptcBalance}
          />
        </motion.div>
      </motion.div>
    </div>
  );

  // Game Info Section
  const renderGameInfo = () => (
    <div className="mt-10 px-4 md:px-8 lg:px-20">
      {/* Enhanced Game Detail */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <MinesGameDetail gameData={gameData} />
      </motion.div>

      {/* Tutorial Video Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-purple-900/80 to-[#290023]/90 rounded-xl p-3 w-full max-w-7xl border-2 border-purple-500/30 shadow-xl shadow-purple-900/20"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white font-display flex items-center">
                  <GiMineExplosion className="mr-3 text-purple-400 text-3xl" />
                  How to Play Mines
                </h3>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="text-white/70 hover:text-white bg-purple-800/30 p-2 rounded-full hover:bg-purple-700/40 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-3/4">
                  <div
                    className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg shadow-purple-900/30 border border-purple-600/20"
                    style={{ paddingTop: "56.25%" }}
                  >
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src="https://www.youtube.com/embed/Aqz5C7GPrvQ?si=9F38e0aJvMv1K2PO"
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>

                <div className="md:w-1/4">
                  <div className="text-white/80 text-sm h-full flex flex-col">
                    <p className="font-display text-lg text-white mb-3">
                      Mines
                    </p>
                    <div className="space-y-3 pr-1">
                      <p>
                        Select mines on a 5x5 grid – more mines mean higher
                        rewards but greater risk.
                      </p>

                      <p>
                        Uncover gems while avoiding mines to increase your
                        multiplier. Cash out anytime or keep going for bigger
                        rewards.
                      </p>

                      <p>
                        With provably fair gameplay and instant payouts, Mines
                        offers the perfect blend of strategy and luck.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-900/20 flex items-center"
                  onClick={() => setShowTutorial(false)}
                >
                  <span>Got it!</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {typeof MinesBettingTable === "function" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <MinesBettingTable bettingTableData={bettingTableData} />
          </motion.div>
        )}
        {typeof MinesProbability === "function" && (
          <motion.div
            id="probability"
            className="scroll-mt-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <MinesProbability
              id="probability"
              className="scroll-mt-24"
              winProbabilities={winProbabilities}
            />
          </motion.div>
        )}
      </div>

      <motion.div
        id="history"
        className="mt-6 scroll-mt-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {typeof MinesHistory === "function" && <MinesHistory />}
      </motion.div>

      <motion.div
        id="leaderboard"
        className="mt-6 scroll-mt-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {typeof MinesLeaderboard === "function" && <MinesLeaderboard />}
      </motion.div>

      {/* Strategy Tips Section */}
      <motion.div
        id="strategy-guide"
        className="mt-8 bg-gradient-to-br from-[#290023]/80 to-[#150012]/90 border-2 border-purple-700/30 rounded-xl p-6 backdrop-blur-sm shadow-xl shadow-purple-900/20 scroll-mt-24 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-purple-600/5 rounded-full blur-3xl -z-1"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-600/5 rounded-full blur-3xl -z-1"></div>
        <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-pink-500/5 rounded-full blur-2xl -z-1"></div>

        {/* Header with shimmer effect */}
        <div className="relative overflow-hidden mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white font-display flex items-center">
              <div className="p-2.5 rounded-full bg-gradient-to-br from-yellow-600/30 to-yellow-800/20 mr-3 border border-yellow-600/30 shadow-lg shadow-yellow-900/10">
                <GiChestArmor className="text-yellow-400 text-xl" />
              </div>
              <span className="bg-gradient-to-r from-white to-yellow-300 bg-clip-text text-transparent">
                Strategy Guide
              </span>
            </h3>
            <button
              onClick={() => setIsStatsExpanded(!isStatsExpanded)}
              className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 px-4 py-1.5 rounded-full text-sm text-white/80 hover:text-white flex items-center gap-2 border border-purple-800/30 hover:border-purple-700/40 transition-all duration-300 shadow-md"
            >
              {isStatsExpanded ? (
                <>
                  <span>Show Less</span>
                  <motion.div
                    animate={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FaChevronDown className="text-purple-400" size={12} />
                  </motion.div>
                </>
              ) : (
                <>
                  <span>Show More</span>
                  <FaChevronDown className="text-purple-400" size={12} />
                </>
              )}
            </button>
          </div>

          {/* Animated underline */}
          <div className="h-px mt-4 bg-gradient-to-r from-yellow-600/50 via-purple-600/30 to-transparent relative overflow-hidden">
            <motion.div
              className="h-full w-20 bg-gradient-to-r from-transparent via-white/70 to-transparent absolute"
              animate={{
                x: ["0%", "100%"],
                opacity: [0, 1, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "linear",
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <motion.div
            className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/5 rounded-xl p-5 border border-yellow-800/30 relative overflow-hidden hover:shadow-xl transition-all duration-300 group"
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-yellow-500/10 rounded-full blur-xl group-hover:w-20 group-hover:h-20 transition-all"></div>
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center font-display relative z-10">
              <div className="p-2 bg-gradient-to-br from-yellow-700/40 to-yellow-900/20 rounded-full mr-3 border border-yellow-700/30 shadow-inner">
                <HiLightningBolt className="text-yellow-400" />
              </div>
              <span className="bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                Beginner Strategy
              </span>
            </h4>
            <p className="text-white/80 text-sm font-sans relative z-10">
              Start with 1-3 mines and aim to uncover 5-8 tiles before cashing
              out. This offers a good balance of risk and reward while you learn
              the game.
            </p>

            <ul className="mt-3 space-y-2 text-sm text-white/70 relative z-10">
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-yellow-900/30 border border-yellow-800/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <span className="text-yellow-400 text-[10px]">✓</span>
                </div>
                <span>Safe option for newcomers</span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-yellow-900/30 border border-yellow-800/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <span className="text-yellow-400 text-[10px]">✓</span>
                </div>
                <span>Focus on consistent small wins</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-blue-900/20 to-blue-800/5 rounded-xl p-5 border border-blue-800/30 relative overflow-hidden hover:shadow-xl transition-all duration-300 group"
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:w-20 group-hover:h-20 transition-all"></div>
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center font-display relative z-10">
              <div className="p-2 bg-gradient-to-br from-blue-700/40 to-blue-900/20 rounded-full mr-3 border border-blue-700/30 shadow-inner">
                <HiOutlineTrendingUp className="text-blue-400" />
              </div>
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Risk Management
              </span>
            </h4>
            <p className="text-white/80 text-sm font-sans relative z-10">
              Set a target multiplier before starting each game and cash out
              when you reach it. Consistency is key to long-term success.
            </p>

            <ul className="mt-3 space-y-2 text-sm text-white/70 relative z-10">
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-blue-900/30 border border-blue-800/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <span className="text-blue-400 text-[10px]">✓</span>
                </div>
                <span>Set a goal of 2x-3x per game</span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-blue-900/30 border border-blue-800/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <span className="text-blue-400 text-[10px]">✓</span>
                </div>
                <span>Don't chase losses with bigger bets</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-green-900/20 to-green-800/5 rounded-xl p-5 border border-green-800/30 relative overflow-hidden hover:shadow-xl transition-all duration-300 group"
            whileHover={{ y: -5, scale: 1.02 }}
          >
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-green-500/10 rounded-full blur-xl group-hover:w-20 group-hover:h-20 transition-all"></div>
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center font-display relative z-10">
              <div className="p-2 bg-gradient-to-br from-green-700/40 to-green-900/20 rounded-full mr-3 border border-green-700/30 shadow-inner">
                <HiOutlineChartBar className="text-green-400" />
              </div>
              <span className="bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                Bankroll Management
              </span>
            </h4>
            <p className="text-white/80 text-sm font-sans relative z-10">
              Never bet more than 5% of your total bankroll on a single game.
              This helps ensure you can recover from losing streaks.
            </p>

            <ul className="mt-3 space-y-2 text-sm text-white/70 relative z-10">
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-green-900/30 border border-green-800/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <span className="text-green-400 text-[10px]">✓</span>
                </div>
                <span>Divide bankroll into 20+ units</span>
              </li>
              <li className="flex items-start">
                <div className="w-4 h-4 rounded-full bg-green-900/30 border border-green-800/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <span className="text-green-400 text-[10px]">✓</span>
                </div>
                <span>Take regular profits off the table</span>
              </li>
            </ul>
          </motion.div>
        </div>

        <AnimatePresence>
          {isStatsExpanded && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 20 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="bg-gradient-to-br from-purple-900/20 to-purple-800/5 rounded-xl p-5 border border-purple-800/30 relative overflow-hidden hover:shadow-xl transition-all duration-300 group"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-purple-500/10 rounded-full blur-xl group-hover:w-20 group-hover:h-20 transition-all"></div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center font-display relative z-10">
                  <div className="p-2 bg-gradient-to-br from-purple-700/40 to-purple-900/20 rounded-full mr-3 border border-purple-700/30 shadow-inner">
                    <FaChartLine className="text-blue-400" />
                  </div>
                  <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    Advanced Pattern Play
                  </span>
                  <span className="ml-2 text-xs px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded-full border border-blue-800/30">
                    Pro Tip
                  </span>
                </h4>
                <p className="text-white/80 text-sm font-sans relative z-10">
                  While mines are placed randomly, some players develop personal
                  systems like "edge-first" or "center-out" strategies. Remember
                  that each reveal is statistically independent.
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-black/30 rounded-lg p-3 border border-purple-800/20">
                    <h5 className="text-sm font-medium text-white/90 mb-1.5 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-purple-900/50 text-purple-300 text-xs flex items-center justify-center mr-1.5">
                        1
                      </span>
                      Edge-first
                    </h5>
                    <p className="text-xs text-white/70">
                      Reveal tiles along the edges first
                    </p>
                  </div>

                  <div className="bg-black/30 rounded-lg p-3 border border-purple-800/20">
                    <h5 className="text-sm font-medium text-white/90 mb-1.5 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-purple-900/50 text-purple-300 text-xs flex items-center justify-center mr-1.5">
                        2
                      </span>
                      Center-out
                    </h5>
                    <p className="text-xs text-white/70">
                      Start from center and work outward
                    </p>
                  </div>

                  <div className="bg-black/30 rounded-lg p-3 border border-purple-800/20">
                    <h5 className="text-sm font-medium text-white/90 mb-1.5 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-purple-900/50 text-purple-300 text-xs flex items-center justify-center mr-1.5">
                        3
                      </span>
                      Diagonal
                    </h5>
                    <p className="text-xs text-white/70">
                      Reveal tiles in diagonal patterns
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-black/20 p-3 rounded-lg border border-purple-800/20 text-xs text-white/70">
                  <div className="flex items-start">
                    <FaInfoCircle className="text-purple-400 mt-0.5 mr-2 flex-shrink-0" />
                    <p>
                      Remember that each mine placement is random and
                      independent of previous games. Pattern play is purely
                      psychological, not mathematical.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-red-900/20 to-red-800/5 rounded-xl p-5 border border-red-800/30 relative overflow-hidden hover:shadow-xl transition-all duration-300 group"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-red-500/10 rounded-full blur-xl group-hover:w-20 group-hover:h-20 transition-all"></div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center font-display relative z-10">
                  <div className="p-2 bg-gradient-to-br from-red-700/40 to-red-900/20 rounded-full mr-3 border border-red-700/30 shadow-inner">
                    <FaTrophy className="text-yellow-500" />
                  </div>
                  <span className="bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">
                    High-Risk Strategies
                  </span>
                  <span className="ml-2 text-xs px-2 py-0.5 bg-red-900/30 text-red-300 rounded-full border border-red-800/30">
                    Expert
                  </span>
                </h4>
                <p className="text-white/80 text-sm font-sans relative z-10">
                  For those seeking the biggest wins, playing with 10+ mines can
                  offer enormous multipliers. Be aware that these strategies
                  have a high failure rate.
                </p>

                <div className="mt-4 bg-black/30 rounded-lg p-3 border border-red-800/20 backdrop-blur-sm">
                  <h5 className="text-sm font-medium text-white/90 mb-2 flex items-center">
                    <FaBomb className="text-red-400 mr-2" /> High-Risk Setups
                  </h5>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white/50 border-b border-red-900/30">
                        <th className="text-left py-2 px-2">Mines</th>
                        <th className="text-left py-2 px-2">Safe Reveals</th>
                        <th className="text-right py-2 px-2">Multiplier</th>
                        <th className="text-right py-2 px-2">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/80">
                      <tr className="border-b border-red-900/20">
                        <td className="py-2 px-2 flex items-center">
                          <span className="w-6 h-6 rounded-full bg-red-900/30 border border-red-800/30 flex items-center justify-center mr-2 text-xs">
                            10
                          </span>
                        </td>
                        <td className="py-2 px-2">10</td>
                        <td className="text-right py-2 px-2 text-yellow-400 font-medium">
                          71.33x
                        </td>
                        <td className="text-right py-2 px-2 text-red-400">
                          18.4%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 flex items-center">
                          <span className="w-6 h-6 rounded-full bg-red-900/30 border border-red-800/30 flex items-center justify-center mr-2 text-xs">
                            15
                          </span>
                        </td>
                        <td className="py-2 px-2">5</td>
                        <td className="text-right py-2 px-2 text-yellow-400 font-medium">
                          23.8x
                        </td>
                        <td className="text-right py-2 px-2 text-red-400">
                          12.6%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center mt-4 p-3 bg-black/20 rounded-lg border border-red-800/20">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-700/40 to-red-900/20 flex items-center justify-center mr-3 border border-red-800/30">
                    <FaInfoCircle className="text-red-400" />
                  </div>
                  <p className="text-xs text-white/70">
                    <span className="text-red-400 font-medium">Warning:</span>{" "}
                    High-risk strategies can result in rapid bankroll depletion.
                    Only use with money you can afford to lose.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );

  // We don't need this function anymore as we've added IDs directly to the components

  return (
    <div className="min-h-screen bg-[#070005] bg-gradient-to-b from-[#070005] to-[#0e0512] pb-20 text-white mines-bg custom-scrollbar">
      <div className="pt-16">
        {renderHeader()}
        {renderMainContent()}
        {renderGameInfo()}
      </div>

      {/* AI Auto Betting Panel */}
      <AIAutoBetting
        isActive={isAIActive}
        onActivate={handleAIToggle}
        onSettings={() => setShowAISettings(true)}
      />

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
        onSave={handleAISettingsSave}
        currentSettings={aiSettings}
      />

      {/* Diamond particles container */}
      <div
        id="diamond-particles"
        className="fixed inset-0 pointer-events-none z-0"
      ></div>

      {/* Customized scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(75, 30, 150, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
