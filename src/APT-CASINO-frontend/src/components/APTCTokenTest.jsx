// APTC Token Initialization Test Component
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useBackendIntegrationContext } from "../contexts/BackendIntegrationContext";

const APTCTokenTest = () => {
  const {
    isConnected,
    principal,
    balance,
    formatBalance,
    loading,
    error,
    setError,
    tokenInfo,
    actors,
    fetchBalance,
  } = useBackendIntegrationContext();

  const [tokenData, setTokenData] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Test token connection and fetch basic info
  const testTokenConnection = async () => {
    if (!actors.aptc || !isConnected) {
      setError("APTC token actor not available or not connected");
      return;
    }

    setIsInitializing(true);
    try {
      console.log("Testing APTC token connection...");

      // Fetch basic token information
      const [name, symbol, decimals, fee, totalSupply] = await Promise.all([
        actors.aptc.icrc1_name(),
        actors.aptc.icrc1_symbol(),
        actors.aptc.icrc1_decimals(),
        actors.aptc.icrc1_fee(),
        actors.aptc.icrc1_total_supply(),
      ]);

      setTokenData({
        name,
        symbol,
        decimals,
        fee: fee.toString(),
        totalSupply: totalSupply.toString(),
      });

      console.log("Token info:", { name, symbol, decimals, fee, totalSupply });

      // Fetch user balance
      await fetchBalance();
    } catch (err) {
      console.error("Token connection test failed:", err);
      setError(`Token test failed: ${err.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  // Test faucet claim (if available)
  const testFaucetClaim = async () => {
    if (!actors.aptc || !isConnected) {
      setError("APTC token actor not available");
      return;
    }

    setIsInitializing(true);
    try {
      console.log("Attempting to claim from faucet...");

      // Check if faucet method exists
      if (typeof actors.aptc.faucet_claim === "function") {
        const result = await actors.aptc.faucet_claim();

        if ("Ok" in result) {
          console.log("Faucet claim successful:", result.Ok);
          setError(null);
          // Refresh balance
          await fetchBalance();
        } else {
          console.error("Faucet claim failed:", result.Err);
          setError(`Faucet claim failed: ${result.Err}`);
        }
      } else {
        setError("Faucet method not available on this token");
      }
    } catch (err) {
      console.error("Faucet claim error:", err);
      setError(`Faucet error: ${err.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  // Auto-test connection when component mounts
  useEffect(() => {
    if (isConnected && actors.aptc) {
      testTokenConnection();
    }
  }, [isConnected, actors.aptc]);

  if (!isConnected) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          APTC Token Test
        </Typography>
        <Typography color="textSecondary">
          Please connect your wallet to test the APTC token
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, margin: "0 auto" }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ textAlign: "center", color: "#FFD700" }}
      >
        🪙 APTC Token Test
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading.actors && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Connecting to APTC token...</Typography>
        </Box>
      )}

      {/* Connection Status */}
      <Box sx={{ mb: 3, p: 2, backgroundColor: "#1a1a1a", borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Connection Status
        </Typography>
        <Typography>Principal: {principal || "Not connected"}</Typography>
        <Typography>
          APTC Actor: {actors.aptc ? "✅ Connected" : "❌ Not connected"}
        </Typography>
        <Typography>
          Token Info: {tokenInfo.name ? "✅ Loaded" : "❌ Not loaded"}
        </Typography>
      </Box>

      {/* Token Information */}
      {tokenData && (
        <Box sx={{ mb: 3, p: 2, backgroundColor: "#1a1a1a", borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Token Information
          </Typography>
          <Typography>Name: {tokenData.name}</Typography>
          <Typography>Symbol: {tokenData.symbol}</Typography>
          <Typography>Decimals: {tokenData.decimals}</Typography>
          <Typography>Fee: {tokenData.fee}</Typography>
          <Typography>
            Total Supply: {formatBalance(tokenData.totalSupply)}
          </Typography>
        </Box>
      )}

      {/* User Balance */}
      <Box sx={{ mb: 3, p: 2, backgroundColor: "#1a1a1a", borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Your Balance
        </Typography>
        <Typography variant="h4" sx={{ color: "#4caf50" }}>
          {formatBalance(balance)} {tokenInfo.symbol || "APTC"}
        </Typography>
        {loading.balance && <CircularProgress size={20} sx={{ ml: 1 }} />}
      </Box>

      {/* Test Actions */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          onClick={testTokenConnection}
          disabled={isInitializing || !actors.aptc}
        >
          {isInitializing ? <CircularProgress size={24} /> : "Test Connection"}
        </Button>

        <Button
          variant="outlined"
          onClick={testFaucetClaim}
          disabled={isInitializing || !actors.aptc}
        >
          {isInitializing ? <CircularProgress size={24} /> : "Claim Faucet"}
        </Button>

        <Button
          variant="outlined"
          onClick={fetchBalance}
          disabled={loading.balance || !actors.aptc}
        >
          {loading.balance ? <CircularProgress size={24} /> : "Refresh Balance"}
        </Button>
      </Box>

      {/* Canister IDs */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: "#1a1a1a", borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Canister IDs
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          APTC Token: be2us-64aaa-aaaaa-qaabq-cai
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          Roulette Game: bw4dl-smaaa-aaaaa-qaacq-cai
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          Mines Game: be2us-64aaa-aaaaa-qaabq-cai
        </Typography>
      </Box>
    </Box>
  );
};

export default APTCTokenTest;
