"use client";
import React, { useState, useEffect } from "react";
import GradientBorderButton from "./GradientBorderButton";
import GradientBgButton from "./GradientBgButton";
import { useNotification } from "./NotificationSystem";
import { useNFID } from "../providers/NFIDProvider";

const BorrowCard = ({ asset }) => {
  const [borrowAmount, setBorrowAmount] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [nativeBalance, setNativeBalance] = useState({
    symbol: "",
    formatted: "0",
  });
  const [isPending, setIsPending] = useState(false);
  const isDev = process.env.NODE_ENV === "development";
  const notification = useNotification();

  // Mock data for development
  const markets = [];
  const userPositions = { supplied: [], borrowed: [] };
  const portfolioStats = { borrowLimit: 0, totalBorrowed: 0 };
  const loading = false;
  const error = null;
  const aptcBalance = 0;

  // ICP only mode - use NFID provider
  const { isConnected, connect } = useNFID();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get market data for this asset
  const marketData = markets.find((m) => m.symbol === asset.symbol);
  const currentAPY = marketData?.borrowAPY || asset.defaultAPY || 7.5;

  // Get user positions for this asset
  const existingBorrow = userPositions.borrowed.find(
    (pos) => pos.asset === asset.symbol
  );
  const existingSupply = userPositions.supplied.find(
    (pos) => pos.asset === asset.symbol
  );

  // Calculate max borrowable amount based on collateral and health factor
  function calculateMaxBorrowable() {
    // Return 0 since lending is not implemented
    return 0;
  }

  const maxBorrowable = calculateMaxBorrowable();

  const handleConnectWallet = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      notification.error("Failed to connect wallet");
    }
  };

  const handleBorrow = async () => {
    notification.info("Borrowing functionality is not yet implemented");
  };

  const handleRepay = async () => {
    notification.info("Repay functionality is not yet implemented");
  };

  const handleMaxClick = () => {
    setBorrowAmount(maxBorrowable.toFixed(6));
  };

  if (!isClient) {
    return (
      <div className="bg-gradient-to-r p-[1px] from-red-magic to-blue-magic rounded-xl">
        <div className="bg-[#1A0015] rounded-xl p-6 h-full">
          <div className="animate-pulse">
            <div className="h-6 w-32 bg-white/10 rounded mb-6"></div>
            <div className="h-10 w-full bg-white/10 rounded mb-6"></div>
            <div className="h-20 w-full bg-white/10 rounded mb-6"></div>
            <div className="flex justify-end">
              <div className="h-10 w-24 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r p-[1px] from-red-magic to-blue-magic rounded-xl">
      <div className="bg-[#1A0015] rounded-xl p-6 h-full">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <div
              className="mr-2 w-6 h-6 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: asset.iconColor }}
            >
              <span className="text-xs font-bold">
                {asset.symbol.charAt(0)}
              </span>
            </div>
            <h3 className="text-lg font-medium">{asset.name}</h3>
          </div>

          {isDev && (
            <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-1 rounded">
              Dev Mode
            </span>
          )}
        </div>

        <div className="mb-6">
          <p className="text-sm text-white/70 mb-1">Current Balance</p>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">
              {isConnected
                ? asset.symbol === nativeBalance?.symbol
                  ? nativeBalance?.formatted || "0"
                  : "0"
                : "0"}
            </span>
            <span className="ml-2 text-sm text-white/50">{asset.symbol}</span>
          </div>
        </div>

        {/* Borrowed amount (if any) */}
        {existingBorrow && (
          <div className="mb-6 p-3 bg-[#250020] rounded-lg">
            <p className="text-sm text-white/70 mb-1">Borrowed Amount</p>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline">
                <span className="text-xl font-bold text-red-400">
                  {existingBorrow.amount?.toFixed(6) || "0"}
                </span>
                <span className="ml-2 text-sm text-white/50">
                  {asset.symbol}
                </span>
              </div>
              <span className="text-sm text-red-400">{currentAPY}% APY</span>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Value: ${existingBorrow.value?.toFixed(2) || "0.00"}
            </p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm text-white/70 mb-2">
            Amount to Borrow
          </label>
          <div className="p-[1px] rounded-md bg-gradient-to-r from-red-magic to-blue-magic">
            <div className="flex bg-[#250020] rounded-md overflow-hidden">
              <input
                type="text"
                placeholder="0.00"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                className="bg-transparent flex-1 p-3 focus:outline-none text-white"
                disabled={!isConnected || isPending}
              />
              <button
                className="bg-[#1A0015] px-4 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleMaxClick}
                disabled={!isConnected || isPending || maxBorrowable <= 0}
              >
                MAX
              </button>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-white/50">
              Max borrowable: {maxBorrowable.toFixed(6)}
            </p>
            <p className="text-xs text-white/50">
              Current APR: {parseFloat(currentAPY).toFixed(2)}%
            </p>
          </div>

          {!isConnected && !isDev && (
            <p className="text-xs text-white/70 mt-2">
              Connect your wallet to borrow {asset.symbol}
            </p>
          )}
          {isDev && (
            <p className="text-xs text-yellow-400/70 mt-2">
              Dev Mode: Simulated borrowing available
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <GradientBorderButton
            onClick={handleRepay}
            disabled={!isConnected || !existingBorrow || isPending}
          >
            {isPending && existingBorrow ? (
              <span className="flex items-center">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
                Processing...
              </span>
            ) : (
              "Repay"
            )}
          </GradientBorderButton>
          {isConnected ? (
            <GradientBgButton
              onClick={handleBorrow}
              disabled={
                !borrowAmount || parseFloat(borrowAmount) <= 0 || isPending
              }
            >
              {isPending && !existingBorrow ? (
                <span className="flex items-center">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
                  Processing...
                </span>
              ) : (
                "Borrow"
              )}
            </GradientBgButton>
          ) : (
            <GradientBgButton onClick={handleConnectWallet}>
              Connect Wallet
            </GradientBgButton>
          )}
        </div>

        {/* Debug notification buttons - only visible in development mode */}
        {isDev && (
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-white/50 mb-2">Test Notifications:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => notification.success("Success message test")}
                className="px-2 py-1 text-xs bg-green-600/30 text-green-400 rounded"
              >
                Test Success
              </button>
              <button
                onClick={() => notification.error("Error message test")}
                className="px-2 py-1 text-xs bg-red-600/30 text-red-400 rounded"
              >
                Test Error
              </button>
              <button
                onClick={() => notification.warning("Warning message test")}
                className="px-2 py-1 text-xs bg-yellow-600/30 text-yellow-400 rounded"
              >
                Test Warning
              </button>
              <button
                onClick={() => notification.info("Info message test")}
                className="px-2 py-1 text-xs bg-blue-600/30 text-blue-400 rounded"
              >
                Test Info
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowCard;
