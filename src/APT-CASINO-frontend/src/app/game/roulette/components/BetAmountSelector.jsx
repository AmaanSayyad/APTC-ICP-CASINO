import React from "react";
import { Box, Typography, Button } from "@mui/material";

const BetAmountSelector = ({ betAmount, setBetAmount }) => {
  const predefinedAmounts = [1, 5, 10, 25, 50, 100];

  return (
    <Box
      sx={{
        maxWidth: "800px",
        mx: "auto",
        mb: 4,
        backgroundColor: "rgba(0,0,0,0.4)",
        borderRadius: "12px",
        p: 2,
        border: "1px solid rgba(255,215,0,0.2)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          color: "#FFD700",
          mb: 2,
          textAlign: "center",
          fontWeight: "600",
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="#FFD700" strokeWidth="2" />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FFD700"
            fontSize="10"
            dy=".1em"
          >
            $
          </text>
        </svg>
        Bet Amount: {betAmount} APTC
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 1.5,
          mt: 2,
        }}
      >
        {predefinedAmounts.map((amount) => (
          <Button
            key={amount}
            onClick={() => setBetAmount(amount)}
            variant={betAmount === amount ? "contained" : "outlined"}
            sx={{
              minWidth: "60px",
              fontWeight: "bold",
              backgroundColor:
                betAmount === amount ? "rgba(255,215,0,0.8)" : "transparent",
              color: betAmount === amount ? "#000" : "#FFD700",
              borderColor: "#FFD700",
              "&:hover": {
                backgroundColor:
                  betAmount === amount
                    ? "rgba(255,215,0,0.9)"
                    : "rgba(255,215,0,0.2)",
                borderColor: "#FFD700",
                color: betAmount === amount ? "#000" : "#FFD700",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              },
              transition: "all 0.2s ease",
              borderRadius: "6px",
              px: 2,
              py: 1,
            }}
          >
            {amount}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default BetAmountSelector;
