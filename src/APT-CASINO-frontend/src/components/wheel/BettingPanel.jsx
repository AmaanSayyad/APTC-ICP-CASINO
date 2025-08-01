"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaCoins,
  FaFire,
  FaSnowflake,
  FaBalanceScale,
  FaCog,
  FaPlus,
  FaMinus,
  FaRocket,
} from "react-icons/fa";

const BettingPanel = ({
  balance,
  betAmount,
  setBetAmount,
  risk,
  setRisk,
  noOfSegments,
  setSegments,
  manulBet,
  isSpinning,
  autoBet,
}) => {
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoSettings, setAutoSettings] = useState({
    numberOfBets: 10,
    winIncrease: 0,
    lossIncrease: 0,
    stopProfit: 0,
    stopLoss: 0,
  });

  const handleBetAmountChange = (value) => {
    // Ensure bet amount doesn't go below 1 or above balance
    const newAmount = Math.max(1, Math.min(balance, value));
    setBetAmount(newAmount);
  };

  const handleQuickBet = (multiplier) => {
    const newBet = Math.floor(balance * multiplier);
    handleBetAmountChange(newBet);
  };

  const handleAutoSettingChange = (setting, value) => {
    setAutoSettings({
      ...autoSettings,
      [setting]: value,
    });
  };

  const startAutoBet = () => {
    autoBet({
      ...autoSettings,
      betAmount,
      risk,
      noOfSegments,
    });
  };

  return (
    <div className="p-4 bg-gradient-to-b from-gray-900/70 to-gray-900/30 rounded-xl border border-gray-800 shadow-lg">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold bg-gradient-to-r from-red-300 to-amber-300 bg-clip-text text-transparent">
          Place Your Bet
        </h3>
      </div>

      {/* Balance Display */}
      <div className="mb-6 p-3 bg-black/40 rounded-lg border border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Balance</span>
          <span className="text-white font-bold">
            {balance.toLocaleString()} APTC
          </span>
        </div>
      </div>

      {/* Bet Amount */}
      <div className="mb-6">
        <label className="block text-gray-400 mb-2">Bet Amount</label>
        <div className="flex items-center">
          <button
            className="bg-red-900/50 hover:bg-red-900/70 p-2 rounded-l-lg border-r border-gray-800"
            onClick={() => handleBetAmountChange(betAmount - 10)}
            disabled={isSpinning}
          >
            <FaMinus />
          </button>
          <input
            type="number"
            value={betAmount}
            onChange={(e) =>
              handleBetAmountChange(parseInt(e.target.value) || 0)
            }
            className="flex-1 bg-black/40 text-center py-2 px-2 text-white"
            disabled={isSpinning}
          />
          <button
            className="bg-red-900/50 hover:bg-red-900/70 p-2 rounded-r-lg border-l border-gray-800"
            onClick={() => handleBetAmountChange(betAmount + 10)}
            disabled={isSpinning}
          >
            <FaPlus />
          </button>
        </div>

        {/* Quick bet buttons */}
        <div className="flex justify-between mt-2 gap-2">
          <button
            className="flex-1 text-xs bg-red-900/30 hover:bg-red-900/50 py-1 rounded"
            onClick={() => handleQuickBet(0.1)}
            disabled={isSpinning}
          >
            10%
          </button>
          <button
            className="flex-1 text-xs bg-red-900/30 hover:bg-red-900/50 py-1 rounded"
            onClick={() => handleQuickBet(0.25)}
            disabled={isSpinning}
          >
            25%
          </button>
          <button
            className="flex-1 text-xs bg-red-900/30 hover:bg-red-900/50 py-1 rounded"
            onClick={() => handleQuickBet(0.5)}
            disabled={isSpinning}
          >
            50%
          </button>
          <button
            className="flex-1 text-xs bg-red-900/30 hover:bg-red-900/50 py-1 rounded"
            onClick={() => handleQuickBet(1)}
            disabled={isSpinning}
          >
            MAX
          </button>
        </div>
      </div>

      {/* Risk Selection */}
      <div className="mb-6">
        <label className="block text-gray-400 mb-2">Risk Level</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            className={`flex flex-col items-center justify-center p-2 rounded ${
              risk === "low"
                ? "bg-blue-900/60 border border-blue-500/50"
                : "bg-black/40 border border-gray-800"
            }`}
            onClick={() => setRisk("low")}
            disabled={isSpinning}
          >
            <FaSnowflake className="text-blue-400 mb-1" />
            <span className="text-xs">Low</span>
          </button>
          <button
            className={`flex flex-col items-center justify-center p-2 rounded ${
              risk === "medium"
                ? "bg-purple-900/60 border border-purple-500/50"
                : "bg-black/40 border border-gray-800"
            }`}
            onClick={() => setRisk("medium")}
            disabled={isSpinning}
          >
            <FaBalanceScale className="text-purple-400 mb-1" />
            <span className="text-xs">Medium</span>
          </button>
          <button
            className={`flex flex-col items-center justify-center p-2 rounded ${
              risk === "high"
                ? "bg-red-900/60 border border-red-500/50"
                : "bg-black/40 border border-gray-800"
            }`}
            onClick={() => setRisk("high")}
            disabled={isSpinning}
          >
            <FaFire className="text-red-400 mb-1" />
            <span className="text-xs">High</span>
          </button>
        </div>
      </div>

      {/* Wheel Segments */}
      <div className="mb-6">
        <label className="block text-gray-400 mb-2">Wheel Segments</label>
        <input
          type="range"
          min="5"
          max="20"
          value={noOfSegments}
          onChange={(e) => setSegments(parseInt(e.target.value))}
          className="w-full accent-red-500"
          disabled={isSpinning}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>5</span>
          <span>{noOfSegments}</span>
          <span>20</span>
        </div>
      </div>

      {/* Betting Mode Switch */}
      <div className="mb-6">
        <div className="flex border border-gray-800 rounded overflow-hidden">
          <button
            className={`flex-1 py-2 text-center ${
              !isAutoMode
                ? "bg-red-900/60 text-white"
                : "bg-gray-900 text-gray-400"
            }`}
            onClick={() => setIsAutoMode(false)}
          >
            Manual
          </button>
          <button
            className={`flex-1 py-2 text-center ${
              isAutoMode
                ? "bg-red-900/60 text-white"
                : "bg-gray-900 text-gray-400"
            }`}
            onClick={() => setIsAutoMode(true)}
          >
            Auto
          </button>
        </div>
      </div>

      {/* Auto Betting Settings */}
      {isAutoMode && (
        <motion.div
          className="mb-6 p-3 bg-black/40 rounded-lg border border-gray-800"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <h4 className="font-semibold mb-3 flex items-center">
            <FaCog className="mr-2 text-gray-400" /> Auto Bet Settings
          </h4>

          <div className="mb-3">
            <label className="block text-gray-400 text-xs mb-1">
              Number of Bets
            </label>
            <input
              type="number"
              value={autoSettings.numberOfBets}
              onChange={(e) =>
                handleAutoSettingChange(
                  "numberOfBets",
                  parseInt(e.target.value) || 0
                )
              }
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
              min="1"
              max="100"
              disabled={isSpinning}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">
                On Win Increase %
              </label>
              <input
                type="number"
                value={autoSettings.winIncrease}
                onChange={(e) =>
                  handleAutoSettingChange(
                    "winIncrease",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                step="0.05"
                min="0"
                max="1"
                disabled={isSpinning}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">
                On Loss Increase %
              </label>
              <input
                type="number"
                value={autoSettings.lossIncrease}
                onChange={(e) =>
                  handleAutoSettingChange(
                    "lossIncrease",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                step="0.05"
                min="0"
                max="1"
                disabled={isSpinning}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">
                Stop Profit
              </label>
              <input
                type="number"
                value={autoSettings.stopProfit}
                onChange={(e) =>
                  handleAutoSettingChange(
                    "stopProfit",
                    parseInt(e.target.value) || 0
                  )
                }
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                min="0"
                disabled={isSpinning}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">
                Stop Loss
              </label>
              <input
                type="number"
                value={autoSettings.stopLoss}
                onChange={(e) =>
                  handleAutoSettingChange(
                    "stopLoss",
                    parseInt(e.target.value) || 0
                  )
                }
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                min="0"
                disabled={isSpinning}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Bet Button */}
      <button
        className={`w-full py-4 rounded-lg flex items-center justify-center transition-all ${
          isSpinning
            ? "bg-gray-800 cursor-not-allowed text-gray-400"
            : "bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white"
        }`}
        onClick={isAutoMode ? startAutoBet : manulBet}
        disabled={isSpinning || betAmount <= 0 || betAmount > balance}
      >
        {isAutoMode ? (
          <>
            <FaRocket className="mr-2" /> Start Auto Bet
          </>
        ) : (
          <>
            <FaCoins className="mr-2" />{" "}
            {isSpinning ? "Spinning..." : "Spin Wheel"}
          </>
        )}
      </button>
    </div>
  );
};

export default BettingPanel;
