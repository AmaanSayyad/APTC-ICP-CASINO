// Enhanced Roulette Game Component with Backend Integration
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { useBackendIntegrationContext } from "../../contexts/BackendIntegrationContext";
import {
  createRouletteBet,
  getNumberColor,
  ROULETTE_CONSTANTS,
} from "../../config/backend-integration";
import BettingPanel from "../betting/BettingPanel";
import GameResult from "../betting/GameResult";
import BettingHistoryComponent from "../betting/BettingHistory";
import "./roulette.css";

// Dark theme for casino styling
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#FFD700" },
    secondary: { main: "#FF6B35" },
    background: { default: "#0a0a0a", paper: "#1a1a1a" },
  },
});

// Roulette wheel numbers in order
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const EnhancedRouletteGame = () => {
  const {
    isConnected,
    principal,
    balance,
    formatBalance,
    loading,
    error,
    setError,
    roulette,
    tokenInfo,
  } = useBackendIntegrationContext();

  // Game state
  const [gameInfo, setGameInfo] = useState(null);
  const [currentBets, setCurrentBets] = useState([]);
  const [recentNumbers, setRecentNumbers] = useState([]);
  const [betHistory, setBetHistory] = useState([]);
  const [userStats, setUserStats] = useState(null);

  // UI state
  const [selectedBets, setSelectedBets] = useState([]);
  const [betAmount, setBetAmount] = useState("1");
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWinningNumber, setLastWinningNumber] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Fetch game data
  const fetchGameData = useCallback(async () => {
    if (!isConnected || !roulette) return;

    try {
      const [gameInfo, currentBets, recentNumbers, betHistory, userStats] =
        await Promise.all([
          roulette.getGameInfo(),
          roulette.getCurrentBets(),
          roulette.getRecentNumbers(),
          roulette.getBetHistory(50),
          roulette.getUserStats(),
        ]);

      setGameInfo(gameInfo);
      setCurrentBets(currentBets);
      setRecentNumbers(recentNumbers);
      setBetHistory(betHistory);
      setUserStats(userStats?.[0] || null);
    } catch (err) {
      console.error("Failed to fetch game data:", err);
      setError(`Failed to load game data: ${err.message}`);
    }
  }, [isConnected, roulette, setError]);

  // Fetch data on component mount and when connected
  useEffect(() => {
    fetchGameData();
  }, [fetchGameData]);

  // Auto-refresh game data every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchGameData, 10000);
    return () => clearInterval(interval);
  }, [fetchGameData]);

  // Handle placing bets
  const handlePlaceBet = useCallback(
    async (betType, betValue, numbers = []) => {
      if (!isConnected) {
        setNotification({
          open: true,
          message: "Please connect your wallet to place bets",
          severity: "warning",
        });
        return;
      }

      if (!betAmount || parseFloat(betAmount) <= 0) {
        setNotification({
          open: true,
          message: "Please enter a valid bet amount",
          severity: "warning",
        });
        return;
      }

      try {
        await roulette.placeBet(betType, betValue, betAmount, numbers);

        setNotification({
          open: true,
          message: `Bet placed: ${betAmount} ${tokenInfo.symbol}`,
          severity: "success",
        });

        // Refresh game data
        await fetchGameData();
      } catch (err) {
        console.error("Failed to place bet:", err);
        setNotification({
          open: true,
          message: `Failed to place bet: ${err.message}`,
          severity: "error",
        });
      }
    },
    [isConnected, betAmount, roulette, tokenInfo.symbol, fetchGameData]
  );

  // Handle spinning the wheel (for manual spins)
  const handleSpin = useCallback(async () => {
    if (!isConnected || !roulette) return;

    setIsSpinning(true);
    try {
      const result = await roulette.spin();
      setNotification({
        open: true,
        message: `Wheel spun! Result: ${result}`,
        severity: "info",
      });

      // Refresh game data to get the latest results
      await fetchGameData();
    } catch (err) {
      console.error("Failed to spin:", err);
      setNotification({
        open: true,
        message: `Failed to spin: ${err.message}`,
        severity: "error",
      });
    } finally {
      setIsSpinning(false);
    }
  }, [isConnected, roulette, fetchGameData]);

  // Generate betting options
  const bettingOptions = useMemo(() => {
    const options = [];

    // Number bets (0-36)
    for (let i = 0; i <= 36; i++) {
      options.push({
        type: "number",
        value: i,
        label: i.toString(),
        payout: "35:1",
        color: getNumberColor(i),
        onClick: () => handlePlaceBet({ Number: null }, i, []),
      });
    }

    // Color bets
    options.push(
      {
        type: "color",
        value: "red",
        label: "Red",
        payout: "1:1",
        color: "red",
        onClick: () => handlePlaceBet({ Color: null }, 1, []),
      },
      {
        type: "color",
        value: "black",
        label: "Black",
        payout: "1:1",
        color: "black",
        onClick: () => handlePlaceBet({ Color: null }, 0, []),
      }
    );

    // Odd/Even bets
    options.push(
      {
        type: "oddeven",
        value: "odd",
        label: "Odd",
        payout: "1:1",
        onClick: () => handlePlaceBet({ OddEven: null }, 1, []),
      },
      {
        type: "oddeven",
        value: "even",
        label: "Even",
        payout: "1:1",
        onClick: () => handlePlaceBet({ OddEven: null }, 0, []),
      }
    );

    // High/Low bets
    options.push(
      {
        type: "highlow",
        value: "low",
        label: "1-18",
        payout: "1:1",
        onClick: () => handlePlaceBet({ HighLow: null }, 0, []),
      },
      {
        type: "highlow",
        value: "high",
        label: "19-36",
        payout: "1:1",
        onClick: () => handlePlaceBet({ HighLow: null }, 1, []),
      }
    );

    // Dozen bets
    options.push(
      {
        type: "dozen",
        value: "first",
        label: "1st 12",
        payout: "2:1",
        onClick: () => handlePlaceBet({ Dozen: null }, 0, []),
      },
      {
        type: "dozen",
        value: "second",
        label: "2nd 12",
        payout: "2:1",
        onClick: () => handlePlaceBet({ Dozen: null }, 1, []),
      },
      {
        type: "dozen",
        value: "third",
        label: "3rd 12",
        payout: "2:1",
        onClick: () => handlePlaceBet({ Dozen: null }, 2, []),
      }
    );

    return options;
  }, [handlePlaceBet]);

  // Render roulette wheel
  const renderRouletteWheel = () => (
    <Box
      className="roulette-wheel-container"
      sx={{ position: "relative", mb: 4 }}
    >
      <motion.div
        className={`roulette-wheel ${isSpinning ? "spinning" : ""}`}
        animate={{ rotate: isSpinning ? 360 * 5 : 0 }}
        transition={{ duration: 3, ease: "easeOut" }}
        style={{
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `conic-gradient(${WHEEL_NUMBERS.map((num, i) => {
            const color =
              getNumberColor(num) === "red"
                ? "#ff0000"
                : getNumberColor(num) === "black"
                ? "#000000"
                : "#00ff00";
            const startAngle = (i / WHEEL_NUMBERS.length) * 360;
            const endAngle = ((i + 1) / WHEEL_NUMBERS.length) * 360;
            return `${color} ${startAngle}deg ${endAngle}deg`;
          }).join(", ")})`,
          border: "4px solid #FFD700",
          position: "relative",
          margin: "0 auto",
        }}
      >
        {/* Center indicator */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: "#FFD700",
            zIndex: 2,
          }}
        />
        {/* Last winning number display */}
        {lastWinningNumber !== null && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "white",
              fontWeight: "bold",
              fontSize: "18px",
              zIndex: 3,
            }}
          >
            {lastWinningNumber}
          </Box>
        )}
      </motion.div>

      {/* Spin button */}
      <Button
        variant="contained"
        onClick={handleSpin}
        disabled={isSpinning || loading.roulette || !isConnected}
        sx={{ mt: 2, display: "block", mx: "auto" }}
      >
        {isSpinning ? <CircularProgress size={24} /> : "Spin Wheel"}
      </Button>
    </Box>
  );

  // Render betting board
  const renderBettingBoard = () => (
    <Box className="betting-board" sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Place Your Bets
      </Typography>

      {/* Bet amount input */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          Bet Amount ({tokenInfo.symbol})
        </Typography>
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          min="0"
          step="0.1"
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #444",
            backgroundColor: "#2a2a2a",
            color: "white",
            width: "150px",
          }}
        />
      </Box>

      {/* Number grid */}
      <Box
        className="number-grid"
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(13, 1fr)",
          gap: 1,
          mb: 2,
        }}
      >
        {/* Zero */}
        <Button
          variant="outlined"
          onClick={() => handlePlaceBet({ Number: null }, 0, [])}
          disabled={loading.roulette}
          sx={{
            gridColumn: "span 1",
            backgroundColor: "#00ff00",
            color: "white",
            "&:hover": { backgroundColor: "#00dd00" },
          }}
        >
          0
        </Button>

        {/* Numbers 1-36 */}
        {Array.from({ length: 36 }, (_, i) => i + 1).map((num) => (
          <Button
            key={num}
            variant="outlined"
            onClick={() => handlePlaceBet({ Number: null }, num, [])}
            disabled={loading.roulette}
            sx={{
              backgroundColor:
                getNumberColor(num) === "red" ? "#ff0000" : "#000000",
              color: "white",
              "&:hover": {
                backgroundColor:
                  getNumberColor(num) === "red" ? "#dd0000" : "#333333",
              },
            }}
          >
            {num}
          </Button>
        ))}
      </Box>

      {/* Outside bets */}
      <Box
        className="outside-bets"
        sx={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 1 }}
      >
        <Button
          variant="outlined"
          onClick={() => handlePlaceBet({ Color: null }, 1, [])}
          disabled={loading.roulette}
          sx={{ backgroundColor: "#ff0000", color: "white" }}
        >
          Red (1:1)
        </Button>
        <Button
          variant="outlined"
          onClick={() => handlePlaceBet({ Color: null }, 0, [])}
          disabled={loading.roulette}
          sx={{ backgroundColor: "#000000", color: "white" }}
        >
          Black (1:1)
        </Button>
        <Button
          variant="outlined"
          onClick={() => handlePlaceBet({ OddEven: null }, 1, [])}
          disabled={loading.roulette}
        >
          Odd (1:1)
        </Button>
        <Button
          variant="outlined"
          onClick={() => handlePlaceBet({ OddEven: null }, 0, [])}
          disabled={loading.roulette}
        >
          Even (1:1)
        </Button>
        <Button
          variant="outlined"
          onClick={() => handlePlaceBet({ HighLow: null }, 0, [])}
          disabled={loading.roulette}
        >
          1-18 (1:1)
        </Button>
        <Button
          variant="outlined"
          onClick={() => handlePlaceBet({ HighLow: null }, 1, [])}
          disabled={loading.roulette}
        >
          19-36 (1:1)
        </Button>
      </Box>

      {/* Dozen bets */}
      <Box
        className="dozen-bets"
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1,
          mt: 1,
        }}
      >
        <Button
          variant="outlined"
          onClick={() => handlePlaceBet({ Dozen: null }, 0, [])}
          disabled={loading.roulette}
        >
          1st 12 (2:1)
        </Button>
        <Button
          variant="outlined"
          onClick={() => handlePlaceBet({ Dozen: null }, 1, [])}
          disabled={loading.roulette}
        >
          2nd 12 (2:1)
        </Button>
        <Button
          variant="outlined"
          onClick={() => handlePlaceBet({ Dozen: null }, 2, [])}
          disabled={loading.roulette}
        >
          3rd 12 (2:1)
        </Button>
      </Box>
    </Box>
  );

  // Render game stats
  const renderGameStats = () => (
    <Box className="game-stats" sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Game Statistics
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 2,
        }}
      >
        <Box sx={{ p: 2, backgroundColor: "#2a2a2a", borderRadius: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Your Balance
          </Typography>
          <Typography variant="h6">
            {formatBalance()} {tokenInfo.symbol}
          </Typography>
        </Box>

        {gameInfo && (
          <>
            <Box sx={{ p: 2, backgroundColor: "#2a2a2a", borderRadius: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Current Round
              </Typography>
              <Typography variant="h6">
                #{gameInfo.currentRound.toString()}
              </Typography>
            </Box>

            <Box sx={{ p: 2, backgroundColor: "#2a2a2a", borderRadius: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Min Bet
              </Typography>
              <Typography variant="h6">
                {formatBalance(gameInfo.minBet)} {tokenInfo.symbol}
              </Typography>
            </Box>

            <Box sx={{ p: 2, backgroundColor: "#2a2a2a", borderRadius: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Max Bet
              </Typography>
              <Typography variant="h6">
                {formatBalance(gameInfo.maxBet)} {tokenInfo.symbol}
              </Typography>
            </Box>
          </>
        )}

        {userStats && (
          <>
            <Box sx={{ p: 2, backgroundColor: "#2a2a2a", borderRadius: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Total Wagered
              </Typography>
              <Typography variant="h6">
                {formatBalance(userStats.totalWagered)} {tokenInfo.symbol}
              </Typography>
            </Box>

            <Box sx={{ p: 2, backgroundColor: "#2a2a2a", borderRadius: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Total Won
              </Typography>
              <Typography variant="h6">
                {formatBalance(userStats.totalWon)} {tokenInfo.symbol}
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );

  // Render recent numbers
  const renderRecentNumbers = () => (
    <Box className="recent-numbers" sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Recent Numbers
      </Typography>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {recentNumbers.slice(0, 10).map((num, index) => (
          <Box
            key={index}
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor:
                getNumberColor(Number(num)) === "red"
                  ? "#ff0000"
                  : getNumberColor(Number(num)) === "black"
                  ? "#000000"
                  : "#00ff00",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            {num.toString()}
          </Box>
        ))}
      </Box>
    </Box>
  );

  if (!isConnected) {
    return (
      <ThemeProvider theme={darkTheme}>
        <Box sx={{ textAlign: "center", p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Connect Your Wallet
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Please connect your wallet to play Roulette
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        className="enhanced-roulette-game"
        sx={{ p: 3, minHeight: "100vh", backgroundColor: "#0a0a0a" }}
      >
        <Typography
          variant="h3"
          gutterBottom
          sx={{ textAlign: "center", color: "#FFD700" }}
        >
          🎰 Roulette
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading.actors && (
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Connecting to game...</Typography>
          </Box>
        )}

        {renderGameStats()}
        {renderRouletteWheel()}
        {renderRecentNumbers()}
        {renderBettingBoard()}

        {/* Current bets */}
        {currentBets.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Current Bets
            </Typography>
            {currentBets.map((bet, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  backgroundColor: "#2a2a2a",
                  borderRadius: 2,
                  mb: 1,
                }}
              >
                <Typography>
                  Player: {bet.player.toString().slice(0, 8)}... | Amount:{" "}
                  {formatBalance(bet.amount)} {tokenInfo.symbol} | Type:{" "}
                  {Object.keys(bet.betType)[0]}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Bet history */}
        {betHistory.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Recent Results
            </Typography>
            {betHistory.slice(0, 5).map((result, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  backgroundColor: "#2a2a2a",
                  borderRadius: 2,
                  mb: 1,
                }}
              >
                <Typography>
                  Round #{result.round.toString()} | Winning Number:{" "}
                  {result.winningNumber.toString()} | Payout:{" "}
                  {formatBalance(result.payout)} {tokenInfo.symbol}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Notification snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert
            severity={notification.severity}
            onClose={() => setNotification({ ...notification, open: false })}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default EnhancedRouletteGame;
