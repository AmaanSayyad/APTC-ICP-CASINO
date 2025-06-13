import React, { useState, useEffect } from "react";
import useAPTCToken from "../../hooks/useAPTCToken";

const BettingPanel = ({
  onPlaceBet,
  minBet = 1,
  maxBet = 1000,
  gameType = "generic",
  disabled = false,
  customControls = null,
}) => {
  const {
    balance,
    canAffordBet,
    getFormattedBettingBalance,
    formatTokenAmount,
    loading,
    isConnected,
  } = useAPTCToken();

  const [betAmount, setBetAmount] = useState(minBet);
  const [betError, setBetError] = useState("");
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  // Preset bet amounts
  const presetAmounts = [1, 5, 10, 25, 50, 100];

  // Validate bet amount
  useEffect(() => {
    setBetError("");

    if (!isConnected) {
      setBetError("Please connect your wallet");
      return;
    }

    if (betAmount < minBet) {
      setBetError(`Minimum bet is ${minBet} APTC`);
      return;
    }

    if (betAmount > maxBet) {
      setBetError(`Maximum bet is ${maxBet} APTC`);
      return;
    }

    if (!canAffordBet(betAmount)) {
      setBetError(
        `Insufficient balance. You have ${getFormattedBettingBalance()} APTC`
      );
      return;
    }
  }, [
    betAmount,
    minBet,
    maxBet,
    canAffordBet,
    getFormattedBettingBalance,
    isConnected,
  ]);

  const handlePlaceBet = async () => {
    if (betError || disabled || isPlacingBet) return;

    try {
      setIsPlacingBet(true);
      await onPlaceBet(betAmount);
    } catch (error) {
      console.error("Failed to place bet:", error);
      setBetError(error.message || "Failed to place bet");
    } finally {
      setIsPlacingBet(false);
    }
  };

  const handleMaxBet = () => {
    const maxAffordable = Math.min(
      maxBet,
      parseFloat(getFormattedBettingBalance())
    );
    setBetAmount(Math.max(minBet, Math.floor(maxAffordable)));
  };

  const handlePresetBet = (amount) => {
    setBetAmount(amount);
  };

  const canPlaceBet = !betError && !disabled && !isPlacingBet && isConnected;

  return (
    <div className="betting-panel bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
      {/* Balance Display */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-sm">Available Balance</span>
          <span className="text-yellow-400 font-bold">
            {loading ? (
              <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
            ) : (
              `${getFormattedBettingBalance()} APTC`
            )}
          </span>
        </div>
      </div>

      {/* Bet Amount Input */}
      <div className="mb-4">
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Bet Amount (APTC)
        </label>
        <div className="relative">
          <input
            type="number"
            value={betAmount}
            onChange={(e) =>
              setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))
            }
            min={minBet}
            max={maxBet}
            step="0.1"
            disabled={disabled || !isConnected}
            className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white text-lg font-medium focus:outline-none focus:ring-2 transition-colors ${
              betError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-600 focus:ring-yellow-500"
            }`}
            placeholder={`Min: ${minBet} APTC`}
          />
          <button
            onClick={handleMaxBet}
            disabled={disabled || !isConnected}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-yellow-400 hover:text-yellow-300 text-sm font-medium disabled:opacity-50"
          >
            MAX
          </button>
        </div>
        {betError && <p className="mt-2 text-red-400 text-sm">{betError}</p>}
      </div>

      {/* Preset Bet Amounts */}
      <div className="mb-4">
        <div className="grid grid-cols-3 gap-2">
          {presetAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => handlePresetBet(amount)}
              disabled={disabled || !canAffordBet(amount) || !isConnected}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                betAmount === amount
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {amount}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Controls */}
      {customControls && <div className="mb-4">{customControls}</div>}

      {/* Place Bet Button */}
      <button
        onClick={handlePlaceBet}
        disabled={!canPlaceBet}
        className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-all ${
          canPlaceBet
            ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black transform hover:scale-105"
            : "bg-gray-600 text-gray-400 cursor-not-allowed"
        }`}
      >
        {isPlacingBet ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
            Placing Bet...
          </div>
        ) : (
          `Place Bet (${betAmount} APTC)`
        )}
      </button>

      {/* Game Info */}
      <div className="mt-4 text-center">
        <p className="text-gray-400 text-xs">
          Game: {gameType} • Min: {minBet} APTC • Max: {maxBet} APTC
        </p>
      </div>
    </div>
  );
};

export default BettingPanel;
