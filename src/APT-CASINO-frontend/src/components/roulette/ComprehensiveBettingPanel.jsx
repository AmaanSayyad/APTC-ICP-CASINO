import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import useEnhancedRouletteBetting from "../../hooks/useEnhancedRouletteBetting";

const ComprehensiveBettingPanel = ({ balance, onBalanceUpdate }) => {
  const [betAmount, setBetAmount] = useState("1");
  const [selectedNumber, setSelectedNumber] = useState("1");
  const [selectedDozen, setSelectedDozen] = useState(1);
  const [selectedColumn, setSelectedColumn] = useState(1);

  const {
    isPlacing,
    pendingApproval,
    lastBetResult,
    // Basic bet types
    placeStraightBet,
    placeColorBet,
    placeOddEvenBet,
    placeHighLowBet,
    // Advanced bet types
    placeDozenBet,
    placeColumnBet,
    placeSplitBet,
    placeStreetBet,
    placeCornerBet,
    placeLineBet,
    validateBetAmount,
    formatAmount,
  } = useEnhancedRouletteBetting();

  const handleBet = async (betFunction) => {
    try {
      const validation = validateBetAmount(betAmount);
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }

      await betFunction();

      // Refresh balance after successful bet
      if (onBalanceUpdate) {
        setTimeout(() => onBalanceUpdate(), 1000);
      }
    } catch (error) {
      console.error("Betting error:", error);
      alert(`Betting failed: ${error.message}`);
    }
  };

  const isDisabled = isPlacing || pendingApproval;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
      <Typography variant="h4" gutterBottom align="center">
        🎰 Enhanced Roulette Betting Panel
      </Typography>

      {/* Bet Amount Input */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💰 Bet Amount
          </Typography>
          <TextField
            fullWidth
            label="Amount (APTC)"
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            disabled={isDisabled}
            inputProps={{ min: 0.1, step: 0.1 }}
            helperText={`Balance: ${formatAmount(balance)} APTC`}
          />
        </CardContent>
      </Card>

      {/* Betting Status */}
      {(isPlacing || pendingApproval) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={20} />
            {pendingApproval ? "Approving tokens..." : "Placing your bet..."}
          </Box>
        </Alert>
      )}

      {/* Last Bet Result */}
      {lastBetResult && (
        <Alert
          severity={lastBetResult.success ? "success" : "error"}
          sx={{ mb: 3 }}
        >
          {lastBetResult.success
            ? `✅ Bet placed successfully! ${lastBetResult.result}`
            : `❌ Bet failed: ${lastBetResult.error}`}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Basic Bets - 1:1 Payout */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Basic Bets (1:1 Payout)
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    disabled={isDisabled}
                    onClick={() =>
                      handleBet(() => placeColorBet(true, betAmount))
                    }
                  >
                    Red
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ bgcolor: "black", color: "white" }}
                    disabled={isDisabled}
                    onClick={() =>
                      handleBet(() => placeColorBet(false, betAmount))
                    }
                  >
                    Black
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled={isDisabled}
                    onClick={() =>
                      handleBet(() => placeOddEvenBet(true, betAmount))
                    }
                  >
                    Odd
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled={isDisabled}
                    onClick={() =>
                      handleBet(() => placeOddEvenBet(false, betAmount))
                    }
                  >
                    Even
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled={isDisabled}
                    onClick={() =>
                      handleBet(() => placeHighLowBet(false, betAmount))
                    }
                  >
                    Low (1-18)
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled={isDisabled}
                    onClick={() =>
                      handleBet(() => placeHighLowBet(true, betAmount))
                    }
                  >
                    High (19-36)
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 2:1 Payout Bets */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎲 2:1 Payout Bets
              </Typography>

              {/* Dozens */}
              <Typography variant="subtitle2" gutterBottom>
                Dozens:
              </Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {[1, 2, 3].map((dozen) => (
                  <Grid item xs={4} key={dozen}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      disabled={isDisabled}
                      onClick={() =>
                        handleBet(() => placeDozenBet(dozen, betAmount))
                      }
                    >
                      {dozen === 1 ? "1-12" : dozen === 2 ? "13-24" : "25-36"}
                    </Button>
                  </Grid>
                ))}
              </Grid>

              {/* Columns */}
              <Typography variant="subtitle2" gutterBottom>
                Columns:
              </Typography>
              <Grid container spacing={1}>
                {[1, 2, 3].map((column) => (
                  <Grid item xs={4} key={column}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      disabled={isDisabled}
                      onClick={() =>
                        handleBet(() => placeColumnBet(column, betAmount))
                      }
                    >
                      Col {column}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Straight Number Bet */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Straight Number (35:1)
              </Typography>

              <Box display="flex" gap={2} alignItems="end">
                <TextField
                  label="Number (0-36)"
                  type="number"
                  value={selectedNumber}
                  onChange={(e) => setSelectedNumber(e.target.value)}
                  disabled={isDisabled}
                  inputProps={{ min: 0, max: 36 }}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  disabled={isDisabled}
                  onClick={() =>
                    handleBet(() =>
                      placeStraightBet(parseInt(selectedNumber), betAmount)
                    )
                  }
                >
                  Bet Number
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Advanced Bets */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏆 Advanced Bets
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    disabled={isDisabled}
                    onClick={() =>
                      handleBet(() => placeSplitBet(1, 2, betAmount))
                    }
                  >
                    Split (17:1)
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    disabled={isDisabled}
                    onClick={() =>
                      handleBet(() => placeStreetBet(1, betAmount))
                    }
                  >
                    Street (11:1)
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    disabled={isDisabled}
                    onClick={() =>
                      handleBet(() => placeCornerBet(1, betAmount))
                    }
                  >
                    Corner (8:1)
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    disabled={isDisabled}
                    onClick={() => handleBet(() => placeLineBet(1, betAmount))}
                  >
                    Line (5:1)
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Instructions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 How to Use Enhanced Betting
          </Typography>
          <Typography variant="body2" component="div">
            <ol>
              <li>Set your bet amount (minimum varies by game settings)</li>
              <li>Choose your bet type - each has different payouts</li>
              <li>
                Click the bet button - tokens will be approved automatically
              </li>
              <li>Wait for bet confirmation and result</li>
              <li>Your balance will update automatically</li>
            </ol>

            <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: "bold" }}>
              Payout Information:
            </Typography>
            <ul>
              <li>Straight Number: 35:1 (highest payout)</li>
              <li>Split: 17:1 (two adjacent numbers)</li>
              <li>Street: 11:1 (three numbers in a row)</li>
              <li>Corner: 8:1 (four numbers in a square)</li>
              <li>Line: 5:1 (six numbers, two streets)</li>
              <li>Dozen/Column: 2:1 (12 numbers each)</li>
              <li>Color/Odd-Even/High-Low: 1:1 (18 numbers each)</li>
            </ul>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ComprehensiveBettingPanel;
