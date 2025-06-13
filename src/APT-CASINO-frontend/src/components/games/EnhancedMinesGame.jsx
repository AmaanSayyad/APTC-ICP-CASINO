// Enhanced Mines Game Component with Backend Integration
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { useBackendIntegrationContext } from "../../contexts/BackendIntegrationContext";
import TokenApprovalStatus from "../common/TokenApprovalStatus";
// MINES_CONSTANTS moved to useBackendIntegration hook
import { FaBomb, FaTrophy, FaCoins } from "react-icons/fa";
import { GiMining, GiDiamonds, GiMineExplosion } from "react-icons/gi";
import confetti from "canvas-confetti";
import "./mines.css";

// Dark theme for casino styling
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#FFD700" },
    secondary: { main: "#FF6B35" },
    background: { default: "#0a0a0a", paper: "#1a1a1a" },
  },
});

const EnhancedMinesGame = () => {
  const {
    isConnected,
    principal,
    balance,
    formatBalance,
    loading,
    error,
    setError,
    mines,
    tokenInfo,
  } = useBackendIntegrationContext();

  // Game state
  const [activeGame, setActiveGame] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);

  // UI state
  const [betAmount, setBetAmount] = useState("1");
  const [mineCount, setMineCount] = useState(5);
  const [selectedCells, setSelectedCells] = useState([]);
  const [revealedCells, setRevealedCells] = useState([]);
  const [gameGrid, setGameGrid] = useState(Array(25).fill("hidden"));
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [potentialWin, setPotentialWin] = useState(0);

  // Fetch game data
  const fetchGameData = useCallback(async () => {
    if (!isConnected || !mines) return;

    try {
      const [activeGame, gameHistory] = await Promise.all([
        mines.getActiveGame(),
        mines.getGameHistory(20),
      ]);

      setActiveGame(activeGame?.[0] || null);
      setGameHistory(gameHistory);

      // Update UI state based on active game
      if (activeGame?.[0]) {
        const game = activeGame[0];
        setRevealedCells(game.revealedCells.map((n) => Number(n)));
        setCurrentMultiplier(game.multiplier);
        setPotentialWin(Number(game.potentialWin));

        // Update grid state
        const newGrid = Array(25).fill("hidden");
        game.revealedCells.forEach((cellIndex) => {
          newGrid[Number(cellIndex)] = "safe";
        });

        // If game is over, show mines
        if (
          game.gameState.Lost ||
          game.gameState.Won ||
          game.gameState.Cashed
        ) {
          game.minePositions.forEach((mineIndex) => {
            newGrid[Number(mineIndex)] = "mine";
          });
        }

        setGameGrid(newGrid);
      } else {
        // Reset grid if no active game
        setGameGrid(Array(25).fill("hidden"));
        setRevealedCells([]);
        setCurrentMultiplier(1.0);
        setPotentialWin(0);
      }
    } catch (err) {
      console.error("Failed to fetch game data:", err);
      setError(`Failed to load game data: ${err.message}`);
    }
  }, [isConnected, mines, setError]);

  // Fetch data on component mount and when connected
  useEffect(() => {
    fetchGameData();
  }, [fetchGameData]);

  // Auto-refresh game data every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchGameData, 5000);
    return () => clearInterval(interval);
  }, [fetchGameData]);

  // Calculate multiplier based on revealed cells and mine count
  const calculateMultiplier = useCallback((revealedCount, mines) => {
    if (revealedCount === 0) return 1.0;

    const safeCells = 25 - mines;
    let multiplier = 1.0;

    for (let i = 0; i < revealedCount; i++) {
      multiplier *= (safeCells - i) / (25 - mines - i);
    }

    return multiplier;
  }, []);

  // Handle starting a new game
  const handleStartGame = useCallback(async () => {
    if (!isConnected) {
      setNotification({
        open: true,
        message: "Please connect your wallet to start a game",
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

    if (mineCount < 1 || mineCount > 24) {
      setNotification({
        open: true,
        message: `Mine count must be between 1 and 24`,
        severity: "warning",
      });
      return;
    }

    // Check if user has sufficient balance
    const betAmountParsed = parseFloat(betAmount);
    const userBalance = parseFloat(formatBalance());

    if (betAmountParsed > userBalance) {
      setNotification({
        open: true,
        message: `Insufficient balance. You have ${formatBalance()} ${
          tokenInfo.symbol
        }, but need ${betAmount} ${tokenInfo.symbol}`,
        severity: "error",
      });
      return;
    }

    try {
      // Show approval notification
      setNotification({
        open: true,
        message: "Checking token approval and starting game...",
        severity: "info",
      });

      const result = await mines.startGame(betAmount, mineCount);

      setNotification({
        open: true,
        message: `New game started! Bet: ${betAmount} ${tokenInfo.symbol}, Mines: ${mineCount}`,
        severity: "success",
      });

      // Reset UI state
      setSelectedCells([]);
      setRevealedCells([]);
      setGameGrid(Array(25).fill("hidden"));
      setCurrentMultiplier(1.0);
      setPotentialWin(0);

      // Refresh game data
      await fetchGameData();
    } catch (err) {
      console.error("Failed to start game:", err);

      // Provide specific error messages based on error type
      let errorMessage = err.message;

      if (err.message.includes("Insufficient token balance")) {
        errorMessage = `Insufficient balance. Please ensure you have at least ${betAmount} ${tokenInfo.symbol}`;
      } else if (err.message.includes("Insufficient token allowance")) {
        errorMessage =
          "Token approval failed. Please try again or check your wallet connection.";
      } else if (err.message.includes("Token transfer failed")) {
        errorMessage =
          "Token transfer failed. Please check your balance and try again.";
      } else if (err.message.includes("Game already active")) {
        errorMessage =
          "You already have an active game. Please finish it before starting a new one.";
      } else if (err.message.includes("Not connected")) {
        errorMessage = "Please connect your wallet and try again.";
      }

      setNotification({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  }, [
    isConnected,
    betAmount,
    mineCount,
    mines,
    tokenInfo.symbol,
    formatBalance,
    fetchGameData,
  ]);

  // Handle revealing a cell
  const handleRevealCell = useCallback(
    async (cellIndex) => {
      if (!activeGame || !mines) return;

      // Check if cell is already revealed
      if (revealedCells.includes(cellIndex)) return;

      // Check if game is still in progress
      if (!activeGame.gameState.InProgress) {
        setNotification({
          open: true,
          message: "Game is not in progress",
          severity: "warning",
        });
        return;
      }

      try {
        const result = await mines.revealCell(cellIndex);
        const game = result;

        if (game.gameState.Lost) {
          // Hit a mine
          setNotification({
            open: true,
            message: "💥 You hit a mine! Game over.",
            severity: "error",
          });

          // Show explosion animation
          const newGrid = [...gameGrid];
          newGrid[cellIndex] = "mine";
          setGameGrid(newGrid);
        } else if (game.gameState.Won) {
          // Won the game (all safe cells revealed)
          setNotification({
            open: true,
            message: `🎉 You won! Payout: ${formatBalance(game.potentialWin)} ${
              tokenInfo.symbol
            }`,
            severity: "success",
          });

          // Trigger confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } else {
          // Safe cell revealed
          setNotification({
            open: true,
            message: `💎 Safe! Multiplier: ${game.multiplier.toFixed(2)}x`,
            severity: "success",
          });
        }

        // Update game state
        setCurrentMultiplier(game.multiplier);
        setPotentialWin(Number(game.potentialWin));
        setRevealedCells(game.revealedCells.map((n) => Number(n)));

        // Update grid
        const newGrid = [...gameGrid];
        newGrid[cellIndex] = "safe";
        setGameGrid(newGrid);

        // Refresh game data
        await fetchGameData();
      } catch (err) {
        console.error("Failed to reveal cell:", err);
        setNotification({
          open: true,
          message: `Failed to reveal cell: ${err.message}`,
          severity: "error",
        });
      }
    },
    [
      activeGame,
      mines,
      revealedCells,
      gameGrid,
      formatBalance,
      tokenInfo.symbol,
      fetchGameData,
    ]
  );

  // Handle cashing out
  const handleCashOut = useCallback(async () => {
    if (!activeGame || !mines) return;

    if (!activeGame.gameState.InProgress) {
      setNotification({
        open: true,
        message: "No active game to cash out",
        severity: "warning",
      });
      return;
    }

    try {
      const result = await mines.cashOut();

      setNotification({
        open: true,
        message: `💰 Cashed out! You won: ${formatBalance(
          result.potentialWin
        )} ${tokenInfo.symbol}`,
        severity: "success",
      });

      // Trigger confetti
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
      });

      // Refresh game data
      await fetchGameData();
    } catch (err) {
      console.error("Failed to cash out:", err);
      setNotification({
        open: true,
        message: `Failed to cash out: ${err.message}`,
        severity: "error",
      });
    }
  }, [activeGame, mines, formatBalance, tokenInfo.symbol, fetchGameData]);

  // Render game controls
  const renderGameControls = () => (
    <Box
      className="game-controls"
      sx={{ mb: 4, p: 3, backgroundColor: "#1a1a1a", borderRadius: 2 }}
    >
      <Typography variant="h6" gutterBottom>
        Game Settings
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="body2" gutterBottom>
            Bet Amount ({tokenInfo.symbol})
          </Typography>
          <TextField
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            disabled={activeGame?.gameState.InProgress}
            fullWidth
            inputProps={{ min: 0, step: 0.1 }}
            sx={{ backgroundColor: "#2a2a2a" }}
          />
        </Box>

        <Box>
          <Typography variant="body2" gutterBottom>
            Number of Mines
          </Typography>
          <TextField
            type="number"
            value={mineCount}
            onChange={(e) => setMineCount(parseInt(e.target.value) || 1)}
            disabled={activeGame?.gameState.InProgress}
            fullWidth
            inputProps={{
              min: 1,
              max: 24,
            }}
            sx={{ backgroundColor: "#2a2a2a" }}
          />
        </Box>
      </Box>

      {/* Token Approval Status */}
      <TokenApprovalStatus
        gameType="mines"
        betAmount={betAmount}
        onApprovalComplete={() => {
          setNotification({
            open: true,
            message: "Token approval completed successfully!",
            severity: "success",
          });
        }}
        disabled={activeGame?.gameState.InProgress}
      />

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          onClick={handleStartGame}
          disabled={loading.mines || activeGame?.gameState.InProgress}
          startIcon={<GiMining />}
        >
          {loading.mines ? <CircularProgress size={24} /> : "Start New Game"}
        </Button>

        {activeGame?.gameState.InProgress && (
          <Button
            variant="contained"
            color="success"
            onClick={handleCashOut}
            disabled={loading.mines || revealedCells.length === 0}
            startIcon={<FaCoins />}
          >
            Cash Out ({formatBalance(potentialWin)} {tokenInfo.symbol})
          </Button>
        )}
      </Box>
    </Box>
  );

  // Render game grid
  const renderGameGrid = () => (
    <Box className="mines-grid" sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Game Grid
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 1,
          maxWidth: 400,
          margin: "0 auto",
        }}
      >
        {gameGrid.map((cellState, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: cellState === "hidden" ? 1.05 : 1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outlined"
              onClick={() => handleRevealCell(index)}
              disabled={
                loading.mines ||
                !activeGame?.gameState.InProgress ||
                cellState !== "hidden"
              }
              sx={{
                width: 60,
                height: 60,
                minWidth: 60,
                backgroundColor:
                  cellState === "hidden"
                    ? "#2a2a2a"
                    : cellState === "safe"
                    ? "#4caf50"
                    : "#f44336",
                color: "white",
                border: "2px solid #444",
                "&:hover": {
                  backgroundColor:
                    cellState === "hidden"
                      ? "#3a3a3a"
                      : cellState === "safe"
                      ? "#4caf50"
                      : "#f44336",
                },
                "&:disabled": {
                  backgroundColor:
                    cellState === "safe"
                      ? "#4caf50"
                      : cellState === "mine"
                      ? "#f44336"
                      : "#1a1a1a",
                },
              }}
            >
              {cellState === "safe" && <GiDiamonds size={24} />}
              {cellState === "mine" && <FaBomb size={20} />}
              {cellState === "hidden" && "?"}
            </Button>
          </motion.div>
        ))}
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

        {activeGame && (
          <>
            <Box sx={{ p: 2, backgroundColor: "#2a2a2a", borderRadius: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Current Bet
              </Typography>
              <Typography variant="h6">
                {formatBalance(activeGame.betAmount)} {tokenInfo.symbol}
              </Typography>
            </Box>

            <Box sx={{ p: 2, backgroundColor: "#2a2a2a", borderRadius: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Mines Count
              </Typography>
              <Typography variant="h6">
                {activeGame.mineCount.toString()}
              </Typography>
            </Box>

            <Box sx={{ p: 2, backgroundColor: "#2a2a2a", borderRadius: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Multiplier
              </Typography>
              <Typography variant="h6" sx={{ color: "#4caf50" }}>
                {currentMultiplier.toFixed(2)}x
              </Typography>
            </Box>

            <Box sx={{ p: 2, backgroundColor: "#2a2a2a", borderRadius: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Potential Win
              </Typography>
              <Typography variant="h6" sx={{ color: "#FFD700" }}>
                {formatBalance(potentialWin)} {tokenInfo.symbol}
              </Typography>
            </Box>

            <Box sx={{ p: 2, backgroundColor: "#2a2a2a", borderRadius: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Cells Revealed
              </Typography>
              <Typography variant="h6">
                {revealedCells.length} / {25 - Number(activeGame.mineCount)}
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );

  // Render game history
  const renderGameHistory = () => (
    <Box className="game-history" sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Recent Games
      </Typography>

      {gameHistory.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          No games played yet
        </Typography>
      ) : (
        <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
          {gameHistory.slice(0, 10).map((game, index) => (
            <Box
              key={index}
              sx={{
                p: 2,
                backgroundColor: "#2a2a2a",
                borderRadius: 2,
                mb: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="body2">
                  Game #{game.gameId.toString()} | Mines:{" "}
                  {game.mineCount.toString()} | Bet:{" "}
                  {formatBalance(game.betAmount)} {tokenInfo.symbol}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Cells Revealed: {game.revealedCells.length}
                </Typography>
              </Box>

              <Box sx={{ textAlign: "right" }}>
                <Typography
                  variant="body2"
                  sx={{
                    color:
                      game.gameState.Won || game.gameState.Cashed
                        ? "#4caf50"
                        : game.gameState.Lost
                        ? "#f44336"
                        : "#ffa726",
                  }}
                >
                  {game.gameState.Won && "Won"}
                  {game.gameState.Lost && "Lost"}
                  {game.gameState.Cashed && "Cashed Out"}
                  {game.gameState.InProgress && "In Progress"}
                </Typography>
                <Typography variant="body2" sx={{ color: "#FFD700" }}>
                  {formatBalance(game.winAmount)} {tokenInfo.symbol}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
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
            Please connect your wallet to play Mines
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        className="enhanced-mines-game"
        sx={{ p: 3, minHeight: "100vh", backgroundColor: "#0a0a0a" }}
      >
        <Typography
          variant="h3"
          gutterBottom
          sx={{ textAlign: "center", color: "#FFD700" }}
        >
          💎 Mines
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
        {renderGameControls()}
        {renderGameGrid()}
        {renderGameHistory()}

        {/* Notification snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
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

export default EnhancedMinesGame;
