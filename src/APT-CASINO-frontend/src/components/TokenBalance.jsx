import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Tooltip,
  Fade,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNFID } from "../providers/NFIDProvider";
import useAPTCToken from "../hooks/useAPTCToken";
import ErrorBoundary from "./ErrorBoundary";

const BalanceContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: "8px 16px",
  background: "rgba(198, 157, 242, 0.1)",
  borderRadius: "12px",
  border: "1px solid rgba(198, 157, 242, 0.2)",
  backdropFilter: "blur(10px)",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "rgba(198, 157, 242, 0.15)",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 20px rgba(198, 157, 242, 0.15)",
  },
}));

const TokenContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  position: "relative",
});

const TokenBalance = () => {
  const { isConnected, principal } = useNFID();

  // Add error handling for the hook
  let hookData;
  try {
    hookData = useAPTCToken();
  } catch (error) {
    console.error("❌ Error in useAPTCToken hook:", error);
    // Return a fallback UI when hook fails
    return (
      <BalanceContainer sx={{ opacity: 0.7 }}>
        <Typography
          sx={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.875rem",
            color: "#DC2633",
            fontWeight: 500,
          }}
        >
          Error loading balance
        </Typography>
      </BalanceContainer>
    );
  }

  const { balance, loading, error, formatBalance, getBalance } = hookData;

  const [selectedToken, setSelectedToken] = useState("APTC");
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Format balance with proper number formatting
  const formatDisplayBalance = (balance) => {
    if (!balance || balance === BigInt(0)) return "0.00";

    try {
      // Convert BigInt to number for formatting
      const balanceNum = Number(balance) / 100000000;

      // Format with appropriate decimal places and thousand separators
      if (balanceNum >= 1000000) {
        return (
          (balanceNum / 1000000).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) + "M"
        );
      } else if (balanceNum >= 1000) {
        return (
          (balanceNum / 1000).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) + "K"
        );
      } else if (balanceNum >= 1) {
        return balanceNum.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      } else if (balanceNum >= 0.01) {
        return balanceNum.toLocaleString("en-US", {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        });
      } else {
        return balanceNum.toLocaleString("en-US", {
          minimumFractionDigits: 6,
          maximumFractionDigits: 8,
        });
      }
    } catch (err) {
      console.error("Error formatting balance:", err);
      return "0.00";
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Enhanced balance refresh function with instant updates
  const refreshBalance = async (showLoader = false) => {
    if (!isConnected || !principal || !getBalance) return;

    if (showLoader) {
      setIsRefreshing(true);
    }

    try {
      const newBalance = await getBalance(true);
      console.log(
        "💰 Balance refreshed instantly:",
        newBalance?.toString?.() || String(newBalance)
      );
    } catch (err) {
      console.error("❌ Failed to refresh balance:", err);
    } finally {
      if (showLoader) {
        setIsRefreshing(false);
      }
    }
  };

  // Set up global balance refresh function
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.refreshTokenBalance = refreshBalance;
    }

    return () => {
      if (typeof window !== "undefined") {
        delete window.refreshTokenBalance;
      }
    };
  }, [refreshBalance]);

  // Listen for game result events and transaction events
  useEffect(() => {
    const handleGameResult = (event) => {
      console.log(
        "🎮 Game result event received, refreshing balance instantly"
      );
      refreshBalance(false);
    };

    const handleTokenTransfer = (event) => {
      console.log(
        "💸 Token transfer event received, refreshing balance instantly"
      );
      refreshBalance(false);
    };

    const handleBetPlaced = (event) => {
      console.log("🎯 Bet placed event received, refreshing balance instantly");
      refreshBalance(false);
    };

    // Listen for various transaction events
    window.addEventListener("gameResult", handleGameResult);
    window.addEventListener("tokenTransfer", handleTokenTransfer);
    window.addEventListener("betPlaced", handleBetPlaced);
    window.addEventListener("tokenSpent", handleTokenTransfer);
    window.addEventListener("tokenReceived", handleTokenTransfer);

    return () => {
      window.removeEventListener("gameResult", handleGameResult);
      window.removeEventListener("tokenTransfer", handleTokenTransfer);
      window.removeEventListener("betPlaced", handleBetPlaced);
      window.removeEventListener("tokenSpent", handleTokenTransfer);
      window.removeEventListener("tokenReceived", handleTokenTransfer);
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("💰 TokenBalance Debug:", {
      isConnected,
      principal,
      balanceType: typeof balance,
      balance: balance?.toString?.() || String(balance),
      loading,
      error,
      mounted,
    });
  }, [isConnected, principal, balance, loading, error, mounted]);

  // Refresh balance when connected with immediate update
  useEffect(() => {
    if (isConnected && principal && getBalance) {
      console.log(
        "🔄 TokenBalance: Refreshing balance for connected user with principal:",
        principal
      );

      // Immediate refresh
      refreshBalance(true);

      // Set up periodic refreshes every 15 seconds (more frequent)
      const interval = setInterval(() => {
        refreshBalance(false);
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [isConnected, principal, getBalance]);

  // Toggle between tokens (future feature for multiple tokens)
  const toggleToken = () => {
    setSelectedToken((prev) => (prev === "APTC" ? "ICP" : "APTC"));
  };

  if (!mounted) {
    return null;
  }

  // Not connected, but still show component with message
  if (!isConnected) {
    return (
      <BalanceContainer sx={{ opacity: 0.7 }}>
        <Typography
          sx={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.875rem",
            color: "#E0E0E0",
            fontWeight: 500,
          }}
        >
          Connect wallet to view balance
        </Typography>
      </BalanceContainer>
    );
  }

  // Handle error state
  if (error) {
    return (
      <BalanceContainer>
        <Typography
          sx={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.875rem",
            color: "#E0E0E0",
            fontWeight: 500,
          }}
        >
          Error loading balance
        </Typography>
      </BalanceContainer>
    );
  }

  // Get formatted balance with improved error handling
  const displayBalance = (() => {
    if (loading || isRefreshing) return "Loading...";
    if (error) return "Error";
    if (!balance) return "0.00";

    // Use custom formatting or fallback to hook's formatBalance
    try {
      return formatBalance
        ? formatBalance(balance)
        : formatDisplayBalance(balance);
    } catch (err) {
      console.error("Balance formatting error:", err);
      return formatDisplayBalance(balance);
    }
  })();

  return (
    <ErrorBoundary>
      <Tooltip
        title={`Click to toggle between tokens • Balance: ${displayBalance} ${selectedToken}`}
        arrow
        placement="bottom"
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 600 }}
      >
        <BalanceContainer onClick={toggleToken}>
          <Typography
            sx={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.875rem",
              color: "#E0E0E0",
              mr: 1,
              fontWeight: 500,
            }}
          >
            Balance:
          </Typography>
          {loading || isRefreshing ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={14} sx={{ color: "#c69df2" }} />
              <Typography
                sx={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.875rem",
                  color: "#B0B0B0",
                  fontWeight: 500,
                }}
              >
                {isRefreshing ? "Updating..." : "Loading..."}
              </Typography>
            </Box>
          ) : (
            <TokenContainer>
              <Typography
                sx={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "1rem",
                  fontWeight: 600,
                  background: error
                    ? "linear-gradient(90deg, #ff6b6b 0%, #ee5a5a 100%)"
                    : "linear-gradient(90deg, #c69df2 0%, #a67de0 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.01em",
                  minWidth: "60px",
                  textAlign: "right",
                  transition: "all 0.3s ease",
                }}
              >
                {displayBalance} {selectedToken}
              </Typography>
            </TokenContainer>
          )}
        </BalanceContainer>
      </Tooltip>
    </ErrorBoundary>
  );
};

export default TokenBalance;
