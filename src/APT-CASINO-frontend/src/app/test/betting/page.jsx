import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Alert,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import { useAuth } from "../../../contexts/AuthContext";
import { useActors } from "../../../contexts/ActorContext";
import { useToken } from "../../../hooks/useToken";
import ComprehensiveBettingPanel from "../../../components/roulette/ComprehensiveBettingPanel";

const BettingTestPage = () => {
  const { isAuthenticated, principal } = useAuth();
  const { actors } = useActors();
  const { balance, fetchBalance } = useToken();
  const [gameInfo, setGameInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && actors?.roulette) {
      loadGameInfo();
      fetchBalance();
    }
  }, [isAuthenticated, actors, fetchBalance]);

  const loadGameInfo = async () => {
    try {
      setLoading(true);
      const info = await actors.roulette.getGameInfo();
      setGameInfo(info);
    } catch (error) {
      console.error("Failed to load game info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceUpdate = () => {
    fetchBalance();
    loadGameInfo();
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Please connect your wallet to test enhanced betting functionality.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading game information...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" align="center" gutterBottom>
          🎰 Enhanced Betting Test Environment
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          gutterBottom
        >
          Complete testing suite for all roulette betting types
        </Typography>
      </Box>

      {/* Connection Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔗 Connection Status
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Alert severity="success" sx={{ flex: 1, minWidth: 200 }}>
              ✅ Wallet Connected: {principal?.toString().slice(0, 12)}...
            </Alert>
            <Alert severity="info" sx={{ flex: 1, minWidth: 200 }}>
              💰 APTC Balance:{" "}
              {balance
                ? `${(Number(balance) / 1e8).toFixed(4)} APTC`
                : "Loading..."}
            </Alert>
            {gameInfo && (
              <Alert severity="info" sx={{ flex: 1, minWidth: 200 }}>
                🎲 Round: {gameInfo.currentRound.toString()} | Active:{" "}
                {gameInfo.gameActive ? "✅" : "❌"}
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Game Status */}
      {gameInfo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🎮 Game Information
            </Typography>
            <Box
              display="grid"
              gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
              gap={2}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Current Round
                </Typography>
                <Typography variant="h6">
                  {gameInfo.currentRound.toString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Game Active
                </Typography>
                <Typography variant="h6">
                  {gameInfo.gameActive ? "✅ Yes" : "❌ No"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Min Bet
                </Typography>
                <Typography variant="h6">
                  {(Number(gameInfo.minBet) / 1e8).toFixed(2)} APTC
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Max Bet
                </Typography>
                <Typography variant="h6">
                  {(Number(gameInfo.maxBet) / 1e8).toFixed(2)} APTC
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Bets
                </Typography>
                <Typography variant="h6">
                  {gameInfo.totalBets.toString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Volume
                </Typography>
                <Typography variant="h6">
                  {(Number(gameInfo.totalVolume) / 1e8).toFixed(2)} APTC
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Betting Panel */}
      <ComprehensiveBettingPanel
        balance={balance}
        onBalanceUpdate={handleBalanceUpdate}
      />

      {/* Development Notes */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔧 Development Notes
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Local Development:</strong> If you encounter delegation
              issues, the system will automatically suggest using the enhanced
              local betting script with your specific parameters.
            </Typography>
          </Alert>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Testing Tips:</strong> Start with small amounts (0.1-1
              APTC) to test the functionality. The system includes automatic
              token approval and comprehensive error handling.
            </Typography>
          </Alert>
          <Alert severity="success">
            <Typography variant="body2">
              <strong>Production Ready:</strong> This enhanced betting system is
              ready for IC testnet/mainnet deployment with full wallet
              integration.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
        <Button variant="outlined" onClick={handleBalanceUpdate} size="large">
          🔄 Refresh Game State & Balance
        </Button>
      </Box>
    </Container>
  );
};

export default BettingTestPage;
