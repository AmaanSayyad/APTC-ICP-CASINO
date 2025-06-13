"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeaderText from "../../components/HeaderText";
import StatsOverview from "../../components/StatsOverview";
import UniswapWidget from "../../components/UniswapWidget";
import LendingTable from "../../components/LendingTable";
import { useNFID } from "../../providers/NFIDProvider";
import { useAPTCToken } from "../../hooks/useAPTCToken";
import {
  FaChartLine,
  FaHistory,
  FaInfoCircle,
  FaExchangeAlt,
  FaCoins,
  FaWallet,
  FaLock,
  FaUnlock,
  FaSpinner,
  FaCheckCircle,
  FaCopy,
} from "react-icons/fa";

// Assets for borrowing by network
const BORROW_ASSETS = {
  5003: [
    {
      symbol: "MNT",
      name: "Mantle Sepolia",
      iconColor: "#2196F3",
      address: null, // Native token
    },
  ],
  50002: [
    {
      symbol: "PHR",
      name: "Pharos Devnet",
      iconColor: "#34C759",
      address: null, // Native token
    },
  ],
  // Fallback for other networks
  default: [
    {
      symbol: "ETH",
      name: "Ethereum",
      iconColor: "#627EEA",
      address: null, // Native token
    },
  ],
};

// Mock transaction history
const MOCK_TRANSACTIONS = [
  {
    type: "deposit",
    token: "APTC",
    amount: "120.5",
    date: new Date(Date.now() - 86400000 * 2),
    status: "completed",
  },
  {
    type: "borrow",
    token: "MNT",
    amount: "0.3",
    date: new Date(Date.now() - 86400000),
    status: "completed",
  },
  {
    type: "swap",
    tokenFrom: "MNT",
    tokenTo: "APTC",
    amountFrom: "0.2",
    amountTo: "98.32",
    date: new Date(),
    status: "completed",
  },
];

// Animated number component for stats
const AnimatedNumber = ({
  value,
  prefix = "",
  suffix = "",
  duration = 2000,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startValue = displayValue;
    const endValue = parseFloat(value);
    const startTime = Date.now();

    const updateValue = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      if (elapsed >= duration) {
        setDisplayValue(endValue);
        return;
      }

      const progress = elapsed / duration;
      const currentValue = startValue + progress * (endValue - startValue);
      setDisplayValue(currentValue);
      requestAnimationFrame(updateValue);
    };

    const animationFrame = requestAnimationFrame(updateValue);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration, displayValue]);

  return (
    <span>
      {prefix}
      {typeof displayValue === "number"
        ? displayValue.toFixed(2)
        : displayValue}
      {suffix}
    </span>
  );
};

// Helper functions
// Helper function to calculate health factor after borrowing - moved outside of component
const getHealthFactorAfterBorrow = (
  portfolioStats,
  markets,
  selectedBorrowAsset,
  borrowAmount
) => {
  if (!portfolioStats || !markets || !selectedBorrowAsset || !borrowAmount) {
    return portfolioStats?.healthFactor || 0;
  }

  const market = markets.find((m) => m.symbol === selectedBorrowAsset);
  if (!market) return portfolioStats.healthFactor || 0;

  const newBorrowValue = parseFloat(borrowAmount) * market.price;
  const totalBorrowed = portfolioStats.totalBorrowed + newBorrowValue;

  if (totalBorrowed === 0) return Infinity;
  return (portfolioStats.totalSupplied * 0.75) / totalBorrowed;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Bank error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-300 mb-4">
            The bank is temporarily unavailable. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap the Bank component with the error boundary
export default function BankWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <Bank />
    </ErrorBoundary>
  );
}

function Bank() {
  // Initialize states first
  const [isClient, setIsClient] = useState(false);
  const [isClientInitialized, setIsClientInitialized] = useState(false);

  // ICP Integration
  const { isConnected, principal, connect } = useNFID();
  const {
    balance: aptcBalance,
    loading: aptcLoading,
    error: aptcError,
    tokenInfo,
    getBalance,
    transfer,
    formatTokenAmount,
    parseTokenAmount,
  } = useAPTCToken();

  // Mock lending market data since the hook is removed
  const markets = [];
  const userPositions = { supplied: [], borrowed: [] };
  const portfolioStats = {
    totalSupplied: 0,
    totalBorrowed: 0,
    netWorth: 0,
    healthFactor: 0,
    borrowLimit: 0,
    borrowLimitUsed: 0,
  };
  const lendingTransactions = [];
  const lendingLoading = false;
  const lendingError = null;
  const supplyAsset = async () => ({
    success: false,
    message: "Not implemented",
  });
  const withdrawAsset = async () => ({
    success: false,
    message: "Not implemented",
  });
  const borrowAsset = async () => ({
    success: false,
    message: "Not implemented",
  });
  const repayAsset = async () => ({
    success: false,
    message: "Not implemented",
  });
  const refreshMarkets = async () => {};
  const fetchMarkets = async () => {};
  const fetchUserPositions = async () => {};
  const fetchTransactionHistory = async () => {};

  // Local state management
  const [chainId, setChainId] = useState(5003);
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("wallet");
  const [transactions, setTransactions] = useState([]);
  const [showNetworkBanner, setShowNetworkBanner] = useState(true);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [marketTrends, setMarketTrends] = useState({
    aptcPrice: 2.83,
    aptc24hChange: 12.5,
    marketCap: 18500000,
    totalLocked: 3200000,
  });

  const [lendingPositions, setLendingPositions] = useState([]);
  const [borrowingPositions, setBorrowingPositions] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalEarned: 0,
    totalBorrowed: 0,
    avgAPY: 0,
    portfolioValue: 0,
    monthlyEarnings: [],
    transactionVolume: 0,
  });

  const [transactionFilter, setTransactionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7d");
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [lendAmount, setLendAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [selectedLendAsset, setSelectedLendAsset] = useState("APTC");
  const [selectedBorrowAsset, setSelectedBorrowAsset] = useState("MNT");
  const [collateralRatio, setCollateralRatio] = useState(0);
  const [liquidationPrice, setLiquidationPrice] = useState(0);
  const [earnedRewards, setEarnedRewards] = useState(0);
  const [txFilter, setTxFilter] = useState({ type: "", time: "" });

  // Hooks and derived state (all useMemo hooks must be declared here)
  const isDev = process.env.NODE_ENV === "development";

  // Combine all transactions - using useMemo for derived state
  const allTransactions = useMemo(() => {
    return [...(lendingTransactions || []), ...(transactions || [])];
  }, [lendingTransactions, transactions]);

  // Filter transactions based on user filters - using useMemo for derived state
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      if (txFilter.type && tx.type !== txFilter.type) return false;

      if (txFilter.time) {
        const now = new Date();
        const txDate = new Date(tx.date);
        if (txFilter.time === "7d" && now - txDate > 7 * 24 * 60 * 60 * 1000)
          return false;
        if (txFilter.time === "30d" && now - txDate > 30 * 24 * 60 * 60 * 1000)
          return false;
        if (txFilter.time === "90d" && now - txDate > 90 * 24 * 60 * 60 * 1000)
          return false;
      }

      return true;
    });
  }, [allTransactions, txFilter]);

  // Format currency with dollar sign
  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  // Format large numbers with commas
  const formatNumber = useCallback((value) => {
    return new Intl.NumberFormat("en-US").format(value);
  }, []);

  // Enhanced functionality for analytics
  const calculateAnalytics = useCallback(() => {
    if (!isConnected || aptcBalance === undefined) return;

    const portfolioValue =
      parseFloat(formatTokenAmount(aptcBalance)) * marketTrends.aptcPrice;
    const monthlyEarnings = Array(12)
      .fill(0)
      .map((_, i) => ({
        month: new Date(
          Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000
        ).toLocaleDateString("en-US", { month: "short" }),
        earnings: Math.random() * 100 + 50,
      }));

    setAnalytics({
      totalEarned: portfolioValue * 0.125,
      totalBorrowed: portfolioValue * 0.3,
      avgAPY: 12.5,
      portfolioValue,
      monthlyEarnings,
      transactionVolume: transactions.reduce(
        (sum, tx) => sum + parseFloat(tx.amount || tx.amountTo || 0),
        0
      ),
    });
  }, [isConnected, aptcBalance, marketTrends.aptcPrice, transactions]);

  // Separate useEffect to call calculateAnalytics when needed
  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  // Calculate health factor effect when borrow amount changes
  const calculateHealthFactor = useCallback(
    (borrowAmt) => {
      if (!portfolioStats || !markets || !selectedBorrowAsset) return 0;

      const market = markets.find((m) => m.symbol === selectedBorrowAsset);
      if (!market) return 0;

      const newBorrowValue = (parseFloat(borrowAmt) || 0) * market.price;
      const totalBorrowed = portfolioStats.totalBorrowed + newBorrowValue;

      if (totalBorrowed === 0) return Infinity;
      return (portfolioStats.totalSupplied * 0.75) / totalBorrowed;
    },
    [portfolioStats, markets, selectedBorrowAsset]
  );

  // All client-side initialization combined in one useEffect
  useEffect(() => {
    // Set client flags
    setIsClient(true);
    setIsClientInitialized(true);

    // Return early if not client-side yet
    if (!isClient) return;

    // Load market data if connected or use mock data in dev mode
    if (isConnected && aptcBalance !== undefined) {
      const aptcBalanceFormatted = formatTokenAmount(aptcBalance);
      const aptcUSDValue = (
        parseFloat(aptcBalanceFormatted) * marketTrends.aptcPrice
      ).toFixed(2);

      setAssets([
        {
          symbol: "APTC",
          name: "APT Casino Token",
          iconColor: "#F1324D",
          address:
            import.meta.env.CANISTER_ID_APTC_TOKEN ||
            "be2us-64aaa-aaaaa-qaabq-cai",
          apr: "12.5%",
          balance: aptcBalanceFormatted,
          balanceUSD: `$${aptcUSDValue}`,
          totalDeposited: "$240,000",
          available: "$120,000",
        },
      ]);

      // Initialize lending market data if principal is available
      if (principal) {
        const initLendingMarket = async () => {
          try {
            await fetchMarkets();
            await fetchUserPositions(principal);
            await fetchTransactionHistory(principal);
          } catch (error) {
            console.error("Failed to initialize lending market:", error);
          }
        };

        initLendingMarket();
      }
    } else if (isDev) {
      // Development mode mock data
      setAssets([
        {
          symbol: "APTC",
          name: "APT Casino Token",
          iconColor: "#F1324D",
          address:
            import.meta.env.CANISTER_ID_APTC_TOKEN ||
            "be2us-64aaa-aaaaa-qaabq-cai",
          apr: "12.5%",
          balance: "1,234.56",
          balanceUSD: "$3,493.86",
          totalDeposited: "$240,000",
          available: "$120,000",
        },
      ]);
      setTransactions(MOCK_TRANSACTIONS);
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      // No specific cleanup needed
    };
  }, [
    isClient,
    isConnected,
    aptcBalance,
    tokenInfo?.TOKEN_CANISTER_ID,
    marketTrends.aptcPrice,
    principal,
    isDev,
  ]);

  // Effect to update health factor when borrow amount changes
  useEffect(() => {
    if (!borrowAmount || !portfolioStats || !markets || !selectedBorrowAsset)
      return;

    const healthFactor = calculateHealthFactor(borrowAmount);
    if (healthFactor) {
      setCollateralRatio(healthFactor);
    }
  }, [
    borrowAmount,
    calculateHealthFactor,
    portfolioStats,
    markets,
    selectedBorrowAsset,
  ]);

  // Show loading state for initial client-side render
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-purple-600" />
      </div>
    );
  }

  // Get appropriate borrow assets for the current chain
  const borrowAssets = BORROW_ASSETS[chainId] || BORROW_ASSETS.default;

  // APTC Token Transfer
  const handleTransfer = async () => {
    if (!transferAmount || !transferTo) {
      alert("Please enter amount and recipient");
      return;
    }

    try {
      setTransferLoading(true);
      const amount = parseTokenAmount(transferAmount);
      await transfer(transferTo, amount);

      // Clear form and refresh balance
      setTransferAmount("");
      setTransferTo("");
      await getBalance(true);

      alert("Transfer successful!");
    } catch (error) {
      console.error("Transfer failed:", error);
      alert(`Transfer failed: ${error.message}`);
    } finally {
      setTransferLoading(false);
    }
  };

  // Copy principal to clipboard
  const copyPrincipal = () => {
    if (principal) {
      navigator.clipboard.writeText(principal);
      alert("Principal copied to clipboard!");
    }
  };

  // Calculate health factor after borrowing using the helper function
  const currentHealthFactorAfterBorrow = getHealthFactorAfterBorrow(
    portfolioStats,
    markets,
    selectedBorrowAsset,
    borrowAmount
  );

  // Show loading state until everything is initialized
  if (!isClientInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-4xl text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sharp-black to-[#150012] text-white">
      <div className="container mx-auto px-4 lg:px-8 pt-32 pb-16">
        {/* Network banner moved inside the container and positioned after the navbar */}
        {showNetworkBanner && (
          <div className="bg-gradient-to-r from-red-magic/80 to-blue-magic/80 py-2 px-4 text-center relative mb-8 rounded-lg">
            <p className="text-white text-sm">
              Connected to{" "}
              {chainId === 5003
                ? "Mantle Sepolia Testnet"
                : chainId === 50002
                ? "Pharos Devnet"
                : "Unknown Network"}
              .<button className="underline ml-2">Switch Network</button>
            </p>
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white"
              onClick={() => setShowNetworkBanner(false)}
            >
              ✕
            </button>
          </div>
        )}

        <div className="mb-10 text-center">
          <HeaderText
            header="APT Casino Bank"
            description="Manage your assets, deposit collateral, and borrow tokens to play your favorite casino games"
          />
        </div>

        {/* Main Tabs */}
        <div className="mb-8">
          <div className="flex border-b border-white/10 overflow-x-auto custom-scrollbar">
            <button
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === "wallet"
                  ? "text-white border-b-2 border-blue-magic"
                  : "text-white/50 hover:text-white/80"
              }`}
              onClick={() => setActiveTab("wallet")}
            >
              <FaWallet /> Wallet
            </button>
            <button
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === "swap"
                  ? "text-white border-b-2 border-blue-magic"
                  : "text-white/50 hover:text-white/80"
              }`}
              onClick={() => setActiveTab("swap")}
            >
              <FaExchangeAlt /> Swap
            </button>
            <button
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === "borrow"
                  ? "text-white border-b-2 border-blue-magic"
                  : "text-white/50 hover:text-white/80"
              }`}
              onClick={() => setActiveTab("borrow")}
            >
              <FaUnlock /> Borrow
            </button>
            <button
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === "lend"
                  ? "text-white border-b-2 border-blue-magic"
                  : "text-white/50 hover:text-white/80"
              }`}
              onClick={() => setActiveTab("lend")}
            >
              <FaLock /> Lend
            </button>
            <button
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === "history"
                  ? "text-white border-b-2 border-blue-magic"
                  : "text-white/50 hover:text-white/80"
              }`}
              onClick={() => setActiveTab("history")}
            >
              <FaHistory /> History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-12">
          {activeTab === "wallet" && (
            <>
              {/* Wallet Connection Status */}
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-gradient-to-r p-[1px] from-red-magic/50 to-blue-magic/50 rounded-xl">
                  <div className="bg-[#1A0015] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <FaWallet className="text-blue-magic mr-3 text-xl" />
                        <h2 className="text-xl font-display font-medium">
                          NFID Wallet
                        </h2>
                      </div>
                      <div className="flex items-center space-x-3">
                        {isConnected ? (
                          <div className="flex items-center text-green-400">
                            <FaCheckCircle className="mr-2" />
                            <span>Connected</span>
                          </div>
                        ) : (
                          <button
                            onClick={connect}
                            className="px-4 py-2 bg-gradient-to-r from-red-magic to-blue-magic rounded-lg font-medium hover:shadow-lg transition-all"
                          >
                            Connect NFID
                          </button>
                        )}
                      </div>
                    </div>

                    {isConnected && principal && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[#250020] rounded-lg">
                          <div>
                            <p className="text-white/70 text-sm mb-1">
                              Principal ID
                            </p>
                            <p className="text-white font-mono text-sm break-all">
                              {principal}
                            </p>
                          </div>
                          <button
                            onClick={copyPrincipal}
                            className="p-2 hover:bg-[#350030] rounded-lg transition-colors"
                          >
                            <FaCopy className="text-blue-magic" />
                          </button>
                        </div>

                        {/* Enhanced Portfolio Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-[#250020] rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white/70 text-sm">
                                APTC Balance
                              </span>
                              {aptcLoading && (
                                <FaSpinner className="animate-spin text-blue-magic" />
                              )}
                            </div>
                            <div className="flex items-baseline">
                              <span className="text-2xl font-bold text-white">
                                {aptcLoading
                                  ? "..."
                                  : formatTokenAmount(aptcBalance)}
                              </span>
                              <span className="text-white/70 ml-2">APTC</span>
                            </div>
                            {!aptcLoading && (
                              <div className="text-sm text-white/50 mt-1">
                                ≈ $
                                {(
                                  parseFloat(formatTokenAmount(aptcBalance)) *
                                    marketTrends.aptcPrice || 0
                                ).toFixed(2)}
                              </div>
                            )}
                          </div>

                          <div className="p-4 bg-[#250020] rounded-lg">
                            <div className="text-white/70 text-sm mb-2">
                              Total Portfolio Value
                            </div>
                            <div className="text-2xl font-bold text-green-500">
                              ${analytics.portfolioValue.toFixed(2)}
                            </div>
                            <div className="text-sm text-white/50 mt-1">
                              +{analytics.avgAPY}% APY
                            </div>
                          </div>

                          <div className="p-4 bg-[#250020] rounded-lg">
                            <div className="text-white/70 text-sm mb-2">
                              Total Earned
                            </div>
                            <div className="text-2xl font-bold text-blue-magic">
                              ${analytics.totalEarned.toFixed(2)}
                            </div>
                            <div className="text-sm text-green-500 mt-1">
                              +
                              {(
                                (analytics.totalEarned /
                                  analytics.portfolioValue) *
                                  100 || 0
                              ).toFixed(1)}
                              %
                            </div>
                          </div>
                        </div>

                        {/* Analytics Toggle */}
                        <div className="flex justify-center">
                          <button
                            onClick={() =>
                              setShowAdvancedAnalytics(!showAdvancedAnalytics)
                            }
                            className="px-4 py-2 bg-[#250020] hover:bg-[#350030] rounded-lg transition-colors text-sm flex items-center gap-2"
                          >
                            <FaChartLine />
                            {showAdvancedAnalytics ? "Hide" : "Show"} Advanced
                            Analytics
                          </button>
                        </div>

                        {/* Advanced Analytics Dashboard */}
                        <AnimatePresence>
                          {showAdvancedAnalytics && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-6 bg-[#250020] rounded-lg space-y-6">
                                <h3 className="text-lg font-bold mb-4">
                                  Portfolio Analytics
                                </h3>

                                {/* Monthly Earnings Chart */}
                                <div className="mb-6">
                                  <h4 className="text-sm font-medium text-white/70 mb-3">
                                    Monthly Earnings (APTC)
                                  </h4>
                                  <div className="grid grid-cols-12 gap-2 h-32">
                                    {analytics.monthlyEarnings.map(
                                      (data, index) => (
                                        <div
                                          key={index}
                                          className="flex flex-col items-center"
                                        >
                                          <div className="flex-1 w-full bg-[#1A0015] rounded-sm relative overflow-hidden">
                                            <motion.div
                                              className="absolute bottom-0 w-full bg-gradient-to-t from-blue-magic to-purple-500"
                                              initial={{ height: 0 }}
                                              animate={{
                                                height: `${
                                                  (data.earnings / 150) * 100
                                                }%`,
                                              }}
                                              transition={{
                                                delay: index * 0.1,
                                              }}
                                            />
                                          </div>
                                          <span className="text-xs text-white/50 mt-1">
                                            {data.month}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>

                                {/* Performance Metrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-green-500">
                                      {analytics.avgAPY.toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-white/70">
                                      Average APY
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-magic">
                                      ${analytics.transactionVolume.toFixed(0)}
                                    </div>
                                    <div className="text-xs text-white/70">
                                      Transaction Volume
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-500">
                                      {lendingPositions.length}
                                    </div>
                                    <div className="text-xs text-white/70">
                                      Active Positions
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-500">
                                      {(
                                        ((analytics.portfolioValue -
                                          analytics.totalBorrowed) /
                                          analytics.portfolioValue) *
                                          100 || 0
                                      ).toFixed(0)}
                                      %
                                    </div>
                                    <div className="text-xs text-white/70">
                                      Health Ratio
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Transfer Section */}
                        <div className="p-6 bg-[#250020] rounded-lg">
                          <h3 className="text-lg font-medium mb-4">
                            Transfer APTC Tokens
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm text-white/70 mb-2">
                                Recipient Principal
                              </label>
                              <input
                                type="text"
                                value={transferTo}
                                onChange={(e) => setTransferTo(e.target.value)}
                                placeholder="Enter principal ID..."
                                className="w-full p-3 bg-[#1A0015] border border-white/10 rounded-lg text-white focus:border-blue-magic focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-white/70 mb-2">
                                Amount
                              </label>
                              <input
                                type="number"
                                value={transferAmount}
                                onChange={(e) =>
                                  setTransferAmount(e.target.value)
                                }
                                placeholder="0.00"
                                step="0.00000001"
                                min="0"
                                className="w-full p-3 bg-[#1A0015] border border-white/10 rounded-lg text-white focus:border-blue-magic focus:outline-none"
                              />
                            </div>
                          </div>
                          <button
                            onClick={handleTransfer}
                            disabled={
                              transferLoading || !transferAmount || !transferTo
                            }
                            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-red-magic to-blue-magic rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {transferLoading ? (
                              <div className="flex items-center">
                                <FaSpinner className="animate-spin mr-2" />
                                Transferring...
                              </div>
                            ) : (
                              "Transfer Tokens"
                            )}
                          </button>
                        </div>

                        {aptcError && (
                          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <p className="text-red-400 text-sm">{aptcError}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "swap" && (
            <>
              <div className="max-w-2xl mx-auto mb-12">
                <div className="bg-gradient-to-r p-[1px] from-red-magic to-blue-magic rounded-xl">
                  <UniswapWidget />
                </div>
              </div>

              {/* Market Trends - Only shown in swap tab */}
              <div className="mb-12 p-[1px] bg-gradient-to-r from-red-magic/50 to-blue-magic/50 rounded-xl">
                <div className="bg-[#1A0015] rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <FaChartLine className="text-blue-magic mr-2" />
                    <h2 className="text-xl font-display font-medium">
                      Market Trends
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#250020] p-4 rounded-lg hover:bg-[#350030] transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white/70 text-sm">
                          APTC Price
                        </span>
                        <div className="flex items-center">
                          <div className="h-2 w-16 bg-[#120010] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-magic to-blue-magic"
                              style={{
                                width: `${Math.min(
                                  Math.abs(marketTrends.aptc24hChange),
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold">
                          <AnimatedNumber
                            value={marketTrends.aptcPrice}
                            prefix="$"
                          />
                        </span>
                        <span
                          className={`ml-2 text-sm ${
                            marketTrends.aptc24hChange >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {marketTrends.aptc24hChange >= 0 ? "↑" : "↓"}{" "}
                          {Math.abs(marketTrends.aptc24hChange)}%
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#250020] p-4 rounded-lg hover:bg-[#350030] transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white/70 text-sm">
                          Market Cap
                        </span>
                        <FaInfoCircle className="text-white/40 hover:text-white/70 transition-colors cursor-help" />
                      </div>
                      <div className="text-2xl font-bold">
                        <AnimatedNumber
                          value={marketTrends.marketCap / 1000000}
                          suffix="M"
                          prefix="$"
                        />
                      </div>
                    </div>

                    <div className="bg-[#250020] p-4 rounded-lg hover:bg-[#350030] transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white/70 text-sm">
                          Total Value Locked
                        </span>
                        <FaInfoCircle className="text-white/40 hover:text-white/70 transition-colors cursor-help" />
                      </div>
                      <div className="text-2xl font-bold">
                        <AnimatedNumber
                          value={marketTrends.totalLocked / 1000000}
                          suffix="M"
                          prefix="$"
                        />
                      </div>
                    </div>

                    <div className="bg-[#250020] p-4 rounded-lg hover:bg-[#350030] transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white/70 text-sm">APY Range</span>
                        <FaInfoCircle className="text-white/40 hover:text-white/70 transition-colors cursor-help" />
                      </div>
                      <div className="text-2xl font-bold">4.8% - 12.5%</div>
                      <div className="text-white/60 text-xs mt-1">
                        Updated 5 min ago
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Overview - Only shown in swap tab */}
              <div className="mb-12">
                <StatsOverview />
              </div>
            </>
          )}

          {activeTab === "borrow" && (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Borrowing Interface */}
                <div className="bg-gradient-to-r p-[1px] from-red-magic/50 to-purple-500/50 rounded-xl">
                  <div className="bg-[#1A0015] rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center">
                      <FaUnlock className="mr-2 text-purple-500" />
                      Borrow Assets
                    </h2>

                    {lendingLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <FaSpinner className="animate-spin text-purple-500 text-2xl" />
                        <span className="ml-2">Loading market data...</span>
                      </div>
                    ) : (
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-sm text-white/70 mb-2">
                            Collateral Available
                          </label>
                          <div className="p-3 bg-[#2A0020] rounded-lg">
                            <div className="flex justify-between">
                              <span className="text-white/70">
                                Total Supplied:
                              </span>
                              <span className="text-white font-medium">
                                $
                                {portfolioStats?.totalSupplied?.toFixed(2) ||
                                  "0.00"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/70">
                                Borrow Limit:
                              </span>
                              <span className="text-green-500 font-medium">
                                $
                                {portfolioStats?.borrowLimit?.toFixed(2) ||
                                  "0.00"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/70">
                                Borrow Utilization:
                              </span>
                              <span
                                className={`font-medium ${
                                  portfolioStats?.borrowLimitUsed > 80
                                    ? "text-red-500"
                                    : portfolioStats?.borrowLimitUsed > 60
                                    ? "text-yellow-500"
                                    : "text-green-500"
                                }`}
                              >
                                {portfolioStats?.borrowLimitUsed?.toFixed(2) ||
                                  "0.00"}
                                %
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/70">
                                Health Factor:
                              </span>
                              <span
                                className={`font-medium ${
                                  portfolioStats?.healthFactor < 1.2
                                    ? "text-red-500"
                                    : portfolioStats?.healthFactor < 1.5
                                    ? "text-yellow-500"
                                    : "text-green-500"
                                }`}
                              >
                                {portfolioStats?.healthFactor?.toFixed(2) ||
                                  "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-white/70 mb-2">
                            Asset to Borrow
                          </label>
                          <select
                            value={selectedBorrowAsset}
                            onChange={(e) =>
                              setSelectedBorrowAsset(e.target.value)
                            }
                            className="w-full p-3 bg-[#2A0020] border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                          >
                            {markets.map((market) => (
                              <option key={market.symbol} value={market.symbol}>
                                {market.symbol} - {market.borrowAPY.toFixed(2)}%
                                Interest
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-white/70 mb-2">
                            Amount to Borrow
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={borrowAmount}
                              onChange={(e) => setBorrowAmount(e.target.value)}
                              placeholder="0.00"
                              step="0.00000001"
                              min="0"
                              max={portfolioStats?.borrowLimit || 0}
                              className="w-full p-3 bg-[#2A0020] border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none pr-20"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70">
                              {selectedBorrowAsset}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">
                              Interest Rate:
                            </span>
                            <span className="text-red-400">
                              {markets
                                .find((m) => m.symbol === selectedBorrowAsset)
                                ?.borrowAPY.toFixed(2)}
                              % APR
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">
                              New Health Factor:
                            </span>
                            <span
                              className={`${
                                currentHealthFactorAfterBorrow < 1.2
                                  ? "text-red-500"
                                  : currentHealthFactorAfterBorrow < 1.5
                                  ? "text-yellow-500"
                                  : "text-green-500"
                              }`}
                            >
                              {currentHealthFactorAfterBorrow.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/70">
                              Liquidation at:
                            </span>
                            <span className="text-white/90">
                              Health Factor &lt; 1.0
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() =>
                        borrowAsset(
                          selectedBorrowAsset,
                          parseFloat(borrowAmount)
                        )
                      }
                      disabled={
                        !isConnected ||
                        lendingLoading ||
                        !borrowAmount ||
                        parseFloat(borrowAmount) <= 0 ||
                        getHealthFactorAfterBorrow() < 1.0
                      }
                      className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-blue-magic rounded-lg text-white font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {lendingLoading ? (
                        <span className="flex items-center justify-center">
                          <FaSpinner className="animate-spin mr-2" />
                          Processing...
                        </span>
                      ) : (
                        "Borrow Asset"
                      )}
                    </button>
                  </div>
                </div>

                {/* Borrowing Portfolio */}
                <div className="bg-gradient-to-r p-[1px] from-red-magic/50 to-purple-500/50 rounded-xl">
                  <div className="bg-[#1A0015] rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center">
                      <FaChartLine className="mr-2 text-purple-500" />
                      Your Borrowed Assets
                    </h2>

                    {lendingLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <FaSpinner className="animate-spin text-purple-500 text-2xl" />
                        <span className="ml-2">Loading portfolio data...</span>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-6 grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-4 rounded-lg">
                            <div className="text-sm text-white/70">
                              Total Borrowed
                            </div>
                            <div className="text-xl font-bold text-white">
                              $
                              {portfolioStats?.totalBorrowed?.toFixed(2) ||
                                "0.00"}
                            </div>
                          </div>
                          <div className="bg-white/5 p-4 rounded-lg">
                            <div className="text-sm text-white/70">
                              Available to Borrow
                            </div>
                            <div className="text-xl font-bold text-white">
                              $
                              {Math.max(
                                0,
                                (portfolioStats?.borrowLimit || 0) -
                                  (portfolioStats?.totalBorrowed || 0)
                              ).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <h3 className="text-lg font-semibold mb-3">
                          Borrowed Assets
                        </h3>
                        {userPositions?.borrowed?.length > 0 ? (
                          <div className="space-y-3 mb-6">
                            {userPositions.borrowed.map((position, index) => (
                              <div
                                key={index}
                                className="bg-white/5 p-3 rounded-lg"
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-medium">
                                      {position.asset}
                                    </div>
                                    <div className="text-sm text-white/70">
                                      {position.amount.toFixed(2)} (~$
                                      {position.value.toFixed(2)})
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-red-400">
                                      {position.apy.toFixed(2)}% APR
                                    </div>
                                    <div className="text-sm text-white/70">
                                      Interest: {position.interest.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2 flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedBorrowAsset(position.asset);
                                      setActiveTab("borrow");
                                      setBorrowAmount("");
                                    }}
                                    className="text-xs px-3 py-1 bg-purple-500/20 text-purple-500 rounded-md hover:bg-purple-500/30"
                                  >
                                    Borrow More
                                  </button>
                                  <button
                                    onClick={() =>
                                      repayAsset(
                                        position.asset,
                                        position.amount
                                      )
                                    }
                                    className="text-xs px-3 py-1 bg-white/10 text-white/90 rounded-md hover:bg-white/20"
                                  >
                                    Repay
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white/5 p-4 rounded-lg text-center text-white/70 mb-6">
                            You haven't borrowed any assets yet.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                  <h2 className="text-xl font-medium mb-2">
                    Transaction History
                  </h2>
                  <p className="text-white/70">
                    Your transaction history in the APT Casino Bank. All
                    transactions are recorded on the blockchain for
                    transparency.
                  </p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                  <select
                    value={txFilter.type}
                    onChange={(e) =>
                      setTxFilter({ ...txFilter, type: e.target.value })
                    }
                    className="px-3 py-2 bg-[#250020] border border-white/10 rounded-lg text-white text-sm focus:border-blue-magic focus:outline-none"
                  >
                    <option value="">All Types</option>
                    <option value="deposit">Deposits</option>
                    <option value="supply">Supplies</option>
                    <option value="borrow">Borrows</option>
                    <option value="repay">Repayments</option>
                    <option value="withdraw">Withdrawals</option>
                    <option value="swap">Swaps</option>
                    <option value="transfer">Transfers</option>
                  </select>
                  <select
                    value={txFilter.time}
                    onChange={(e) =>
                      setTxFilter({ ...txFilter, time: e.target.value })
                    }
                    className="px-3 py-2 bg-[#250020] border border-white/10 rounded-lg text-white text-sm focus:border-blue-magic focus:outline-none"
                  >
                    <option value="">All Time</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                </div>
              </div>

              <div className="bg-gradient-to-r p-[1px] from-purple-500/30 to-blue-magic/30 rounded-xl">
                <div className="bg-[#1A0015] rounded-xl p-6">
                  {allTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-white/70 border-b border-white/10">
                            <th className="pb-3 font-medium px-2">Type</th>
                            <th className="pb-3 font-medium px-2">Asset</th>
                            <th className="pb-3 font-medium px-2">Amount</th>
                            <th className="pb-3 font-medium px-2">Value</th>
                            <th className="pb-3 font-medium px-2">Date</th>
                            <th className="pb-3 font-medium px-2">Status</th>
                            <th className="pb-3 font-medium px-2">Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTransactions.map((tx, i) => (
                            <tr
                              key={`${tx.source}-${tx.id || i}`}
                              className="border-b border-white/5 hover:bg-white/5"
                            >
                              <td className="py-3 px-2">
                                <span className="capitalize">{tx.type}</span>
                              </td>
                              <td className="py-3 px-2">
                                {tx.tokenFrom && tx.tokenTo ? (
                                  <span>
                                    {tx.tokenFrom} → {tx.tokenTo}
                                  </span>
                                ) : (
                                  <span>{tx.token || tx.asset}</span>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                {tx.amountFrom && tx.amountTo ? (
                                  <span>
                                    {tx.amountFrom} → {tx.amountTo}
                                  </span>
                                ) : (
                                  <span>
                                    {typeof tx.amount === "number"
                                      ? tx.amount.toFixed(2)
                                      : tx.amount}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                {typeof tx.value === "number"
                                  ? `$${tx.value.toFixed(2)}`
                                  : "—"}
                              </td>
                              <td className="py-3 px-2">
                                {tx.date.toLocaleDateString()}{" "}
                                {tx.date.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="py-3 px-2">
                                <span
                                  className={`inline-block px-2 py-1 rounded-full text-xs ${
                                    tx.status === "completed" ||
                                    tx.status === "confirmed"
                                      ? "bg-green-500/20 text-green-500"
                                      : tx.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-500"
                                      : "bg-red-500/20 text-red-500"
                                  }`}
                                >
                                  {tx.status.charAt(0).toUpperCase() +
                                    tx.status.slice(1)}
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                <span className="capitalize">{tx.source}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="text-center mt-4 text-white/70 text-sm">
                        Showing {filteredTransactions.length} of{" "}
                        {allTransactions.length} transactions
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-white/70">
                      No transactions found. Start by depositing or borrowing
                      assets.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-[1px] bg-gradient-to-r from-red-magic/30 to-blue-magic/30 rounded-xl hover:from-red-magic hover:to-blue-magic transition-all duration-300">
            <div className="bg-[#1A0015] rounded-xl p-6 h-full">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-[#250020] flex items-center justify-center mr-3">
                  <FaCoins className="text-yellow-500" />
                </div>
                <h3 className="text-lg font-medium">Earn Interest</h3>
              </div>
              <p className="text-white/70 mb-4">
                Deposit your tokens to earn competitive interest rates. APT
                Casino Bank offers some of the highest APYs in DeFi.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex justify-between">
                  <span className="text-white/60">APTC</span>
                  <span className="text-green-500">12.5% APY</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-white/60">USDC</span>
                  <span className="text-green-500">8.2% APY</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-white/60">MNT</span>
                  <span className="text-green-500">4.8% APY</span>
                </li>
              </ul>
              <button
                onClick={() => setActiveTab("lend")}
                className="text-sm bg-[#250020] hover:bg-[#350030] transition-colors py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <FaLock /> Deposit Now
              </button>
            </div>
          </div>

          <div className="p-[1px] bg-gradient-to-r from-red-magic/30 to-blue-magic/30 rounded-xl hover:from-red-magic hover:to-blue-magic transition-all duration-300">
            <div className="bg-[#1A0015] rounded-xl p-6 h-full">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-[#250020] flex items-center justify-center mr-3">
                  <FaWallet className="text-blue-magic" />
                </div>
                <h3 className="text-lg font-medium">How It Works</h3>
              </div>
              <ol className="space-y-4 mb-6">
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#250020] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Deposit Collateral</h4>
                    <p className="text-white/60 text-sm">
                      Deposit supported tokens as collateral to earn interest.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#250020] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Borrow Tokens</h4>
                    <p className="text-white/60 text-sm">
                      Borrow up to 70% of your collateral value in other tokens.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#250020] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Play & Win</h4>
                    <p className="text-white/60 text-sm">
                      Use borrowed tokens to play games and win big.
                    </p>
                  </div>
                </li>
              </ol>
              <div className="text-center">
                <button className="bg-gradient-to-r from-red-magic to-blue-magic hover:from-blue-magic hover:to-red-magic transition-all text-white px-4 py-2 rounded-lg font-medium text-sm">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
