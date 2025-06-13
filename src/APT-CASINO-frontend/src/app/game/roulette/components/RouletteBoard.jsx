import React from "react";
import { Box, Typography, useMediaQuery, useTheme, Chip } from "@mui/material";

// Constants
const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

const RouletteBoard = ({
  onNumberClick,
  betAmount = 1,
  loading,
  isConnected,
  placedBets = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Debug logging
  console.log("RouletteBoard props:", { betAmount, isConnected, placedBets });

  // Function to get bets for a specific number
  const getBetsForNumber = (number) => {
    return placedBets.filter(
      (bet) =>
        (bet.betType === "number" && bet.betValue === number) ||
        (bet.betType === "red" && RED_NUMBERS.includes(number)) ||
        (bet.betType === "black" &&
          !RED_NUMBERS.includes(number) &&
          number !== 0) ||
        (bet.betType === "odd" && number % 2 === 1 && number !== 0) ||
        (bet.betType === "even" && number % 2 === 0 && number !== 0) ||
        (bet.betType === "low" && number >= 1 && number <= 18) ||
        (bet.betType === "high" && number >= 19 && number <= 36) ||
        (bet.betType === "dozen" &&
          ((bet.betValue === 0 && number >= 1 && number <= 12) ||
            (bet.betValue === 1 && number >= 13 && number <= 24) ||
            (bet.betValue === 2 && number >= 25 && number <= 36))) ||
        (bet.betType === "column" &&
          ((bet.betValue === 0 &&
            [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(number)) ||
            (bet.betValue === 1 &&
              [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(number)) ||
            (bet.betValue === 2 &&
              [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(number))))
    );
  };

  // Function to render bet chips
  const renderBetChips = (number) => {
    const bets = getBetsForNumber(number);
    if (bets.length === 0) return null;

    const totalAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);

    return (
      <Box
        sx={{
          position: "absolute",
          top: "2px",
          right: "2px",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <Chip
          label={`${totalAmount}`}
          size="small"
          sx={{
            height: "18px",
            fontSize: "0.7rem",
            fontWeight: "bold",
            backgroundColor: "#FFD700",
            color: "#000",
            border: "1px solid rgba(0,0,0,0.2)",
            "& .MuiChip-label": {
              px: 0.5,
            },
          }}
        />
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="h6"
        sx={{
          color: "white",
          mb: 2,
          textAlign: "center",
          fontWeight: "600",
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
        }}
      >
        Place Your Bets{" "}
        {placedBets.length > 0 && `(${placedBets.length} active)`}
      </Typography>

      <Box
        sx={{
          width: "100%",
          maxWidth: "1200px",
          mx: "auto",
          border: "2px solid rgba(255,215,0,0.3)",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow:
            "0 5px 15px rgba(0,0,0,0.5), 0 0 30px rgba(104, 29, 219, 0.2)",
          background: "linear-gradient(to bottom, #080008, #120909)",
          transform: loading ? "scale(0.99)" : "scale(1)",
          transition: "transform 0.3s ease",
          opacity: loading ? 0.8 : 1,
        }}
      >
        {/* Roulette Table Layout */}
        <Box
          sx={{
            display: "flex",
          }}
        >
          {/* Green Zero on left with triangular diamond shape */}
          <Box
            sx={{
              width: { xs: "50px", sm: "60px", md: "70px" },
              height: { xs: "120px", sm: "150px", md: "180px" },
              backgroundColor: "#228B22",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: { xs: "1.4rem", sm: "1.6rem", md: "1.8rem" },
              cursor: isConnected ? "pointer" : "default",
              opacity: isConnected ? 1 : 0.7,
              "&:hover": isConnected
                ? {
                    backgroundColor: "rgba(34, 139, 34, 0.8)",
                    boxShadow: "inset 0 0 15px rgba(255,255,255,0.3)",
                    transform: "scale(0.98)",
                  }
                : {},
              userSelect: "none",
              transition: "all 0.2s ease",
              position: "relative",
              // Simple triangular diamond shape pointing right
              clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)",
              border: "2px solid white",
              zIndex: 1,
            }}
            onClick={() => isConnected && onNumberClick("number", 0, betAmount)}
          >
            0{renderBetChips(0)}
          </Box>

          {/* Main numbers grid */}
          <Box sx={{ flexGrow: 1 }}>
            {/* First row: 3, 6, 9, etc. */}
            <Box sx={{ display: "flex" }}>
              {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map((number) => {
                const isRed = RED_NUMBERS.includes(number);
                return (
                  <Box
                    key={number}
                    sx={{
                      flex: 1,
                      height: { xs: "40px", sm: "50px", md: "60px" },
                      backgroundColor: isRed ? "#DC143C" : "#000",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                      borderRight: "2px solid white",
                      borderBottom: "2px solid white",
                      cursor: isConnected ? "pointer" : "default",
                      opacity: isConnected ? 1 : 0.7,
                      "&:hover": isConnected
                        ? {
                            opacity: 0.8,
                            boxShadow: "inset 0 0 15px rgba(255,255,255,0.2)",
                            transform: "scale(0.98)",
                          }
                        : {},
                      userSelect: "none",
                      transition: "all 0.15s ease",
                      position: "relative",
                    }}
                    onClick={() =>
                      isConnected && onNumberClick("number", number, betAmount)
                    }
                  >
                    {number}
                    {renderBetChips(number)}
                  </Box>
                );
              })}
              <Box
                sx={{
                  width: { xs: "40px", sm: "50px", md: "60px" },
                  height: { xs: "40px", sm: "50px", md: "60px" },
                  backgroundColor: "#333",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.9rem" },
                  cursor: isConnected ? "pointer" : "default",
                  opacity: isConnected ? 1 : 0.7,
                  "&:hover": isConnected
                    ? {
                        backgroundColor: "#444",
                        boxShadow: "inset 0 0 10px rgba(255,255,255,0.2)",
                      }
                    : {},
                  userSelect: "none",
                  borderBottom: "2px solid white",
                  borderLeft: "2px solid white",
                  transition: "all 0.15s ease",
                }}
                onClick={() =>
                  isConnected && onNumberClick("column", 0, betAmount)
                }
              >
                2:1
              </Box>
            </Box>

            {/* Second row: 2, 5, 8, etc. */}
            <Box sx={{ display: "flex" }}>
              {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map((number) => {
                const isRed = RED_NUMBERS.includes(number);
                return (
                  <Box
                    key={number}
                    sx={{
                      flex: 1,
                      height: { xs: "40px", sm: "50px", md: "60px" },
                      backgroundColor: isRed ? "#DC143C" : "#000",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                      borderRight: "2px solid white",
                      borderBottom: "2px solid white",
                      cursor: isConnected ? "pointer" : "default",
                      opacity: isConnected ? 1 : 0.7,
                      "&:hover": isConnected
                        ? {
                            opacity: 0.8,
                            boxShadow: "inset 0 0 15px rgba(255,255,255,0.2)",
                            transform: "scale(0.98)",
                          }
                        : {},
                      userSelect: "none",
                      transition: "all 0.15s ease",
                      position: "relative",
                    }}
                    onClick={() =>
                      isConnected && onNumberClick("number", number, betAmount)
                    }
                  >
                    {number}
                    {renderBetChips(number)}
                  </Box>
                );
              })}
              <Box
                sx={{
                  width: { xs: "40px", sm: "50px", md: "60px" },
                  height: { xs: "40px", sm: "50px", md: "60px" },
                  backgroundColor: "#333",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.9rem" },
                  cursor: isConnected ? "pointer" : "default",
                  opacity: isConnected ? 1 : 0.7,
                  "&:hover": isConnected
                    ? {
                        backgroundColor: "#444",
                        boxShadow: "inset 0 0 10px rgba(255,255,255,0.2)",
                      }
                    : {},
                  userSelect: "none",
                  borderBottom: "2px solid white",
                  borderLeft: "2px solid white",
                  transition: "all 0.15s ease",
                }}
                onClick={() =>
                  isConnected && onNumberClick("column", 1, betAmount)
                }
              >
                2:1
              </Box>
            </Box>

            {/* Third row: 1, 4, 7, etc. */}
            <Box sx={{ display: "flex" }}>
              {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map((number) => {
                const isRed = RED_NUMBERS.includes(number);
                return (
                  <Box
                    key={number}
                    sx={{
                      flex: 1,
                      height: { xs: "40px", sm: "50px", md: "60px" },
                      backgroundColor: isRed ? "#DC143C" : "#000",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                      borderRight: "2px solid white",
                      cursor: isConnected ? "pointer" : "default",
                      opacity: isConnected ? 1 : 0.7,
                      "&:hover": isConnected
                        ? {
                            opacity: 0.8,
                            boxShadow: "inset 0 0 15px rgba(255,255,255,0.2)",
                            transform: "scale(0.98)",
                          }
                        : {},
                      userSelect: "none",
                      transition: "all 0.15s ease",
                      position: "relative",
                    }}
                    onClick={() =>
                      isConnected && onNumberClick("number", number, betAmount)
                    }
                  >
                    {number}
                    {renderBetChips(number)}
                  </Box>
                );
              })}
              <Box
                sx={{
                  width: { xs: "40px", sm: "50px", md: "60px" },
                  height: { xs: "40px", sm: "50px", md: "60px" },
                  backgroundColor: "#333",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.9rem" },
                  cursor: isConnected ? "pointer" : "default",
                  opacity: isConnected ? 1 : 0.7,
                  "&:hover": isConnected
                    ? {
                        backgroundColor: "#444",
                        boxShadow: "inset 0 0 10px rgba(255,255,255,0.2)",
                      }
                    : {},
                  userSelect: "none",
                  borderLeft: "2px solid white",
                  transition: "all 0.15s ease",
                }}
                onClick={() =>
                  isConnected && onNumberClick("column", 2, betAmount)
                }
              >
                2:1
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Bottom section with dozen bets */}
        <Box
          sx={{
            display: "flex",
            height: { xs: "45px", sm: "55px", md: "60px" },
          }}
        >
          <Box
            sx={{
              flex: 1,
              backgroundColor: "#333",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
              borderRight: "2px solid white",
              borderTop: "2px solid white",
              cursor: isConnected ? "pointer" : "default",
              opacity: isConnected ? 1 : 0.7,
              "&:hover": isConnected
                ? {
                    backgroundColor: "#444",
                    boxShadow: "inset 0 0 15px rgba(255,255,255,0.1)",
                  }
                : {},
              userSelect: "none",
              transition: "all 0.15s ease",
            }}
            onClick={() => isConnected && onNumberClick("dozen", 0, betAmount)}
          >
            1st 12
          </Box>
          <Box
            sx={{
              flex: 1,
              backgroundColor: "#333",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
              borderRight: "2px solid white",
              borderTop: "2px solid white",
              cursor: isConnected ? "pointer" : "default",
              opacity: isConnected ? 1 : 0.7,
              "&:hover": isConnected
                ? {
                    backgroundColor: "#444",
                    boxShadow: "inset 0 0 15px rgba(255,255,255,0.1)",
                  }
                : {},
              userSelect: "none",
              transition: "all 0.15s ease",
            }}
            onClick={() => isConnected && onNumberClick("dozen", 1, betAmount)}
          >
            2nd 12
          </Box>
          <Box
            sx={{
              flex: 1,
              backgroundColor: "#333",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
              borderTop: "2px solid white",
              cursor: isConnected ? "pointer" : "default",
              opacity: isConnected ? 1 : 0.7,
              "&:hover": isConnected
                ? {
                    backgroundColor: "#444",
                    boxShadow: "inset 0 0 15px rgba(255,255,255,0.1)",
                  }
                : {},
              userSelect: "none",
              transition: "all 0.15s ease",
            }}
            onClick={() => isConnected && onNumberClick("dozen", 2, betAmount)}
          >
            3rd 12
          </Box>
        </Box>

        {/* Bottom betting section matching the image layout */}
        <Box
          sx={{
            display: "flex",
            height: { xs: "50px", sm: "60px", md: "65px" },
          }}
        >
          {/* 1 to 18 */}
          <Box
            sx={{
              flex: 1,
              backgroundColor: "#333",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
              borderRight: "2px solid white",
              borderTop: "2px solid white",
              cursor: isConnected ? "pointer" : "default",
              opacity: isConnected ? 1 : 0.7,
              "&:hover": isConnected
                ? {
                    backgroundColor: "#444",
                    boxShadow: "inset 0 0 15px rgba(255,255,255,0.1)",
                  }
                : {},
              userSelect: "none",
              transition: "all 0.15s ease",
            }}
            onClick={() => isConnected && onNumberClick("low", 0, betAmount)}
          >
            1 to 18
          </Box>

          {/* EVEN */}
          <Box
            sx={{
              flex: 1,
              backgroundColor: "#333",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
              borderRight: "2px solid white",
              borderTop: "2px solid white",
              cursor: isConnected ? "pointer" : "default",
              opacity: isConnected ? 1 : 0.7,
              "&:hover": isConnected
                ? {
                    backgroundColor: "#444",
                    boxShadow: "inset 0 0 15px rgba(255,255,255,0.1)",
                  }
                : {},
              userSelect: "none",
              transition: "all 0.15s ease",
            }}
            onClick={() => isConnected && onNumberClick("even", 0, betAmount)}
          >
            EVEN
          </Box>

          {/* RED Diamond */}
          <Box
            sx={{
              flex: 1,
              backgroundColor: "#DC143C",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
              borderRight: "2px solid white",
              borderTop: "2px solid white",
              cursor: isConnected ? "pointer" : "default",
              opacity: isConnected ? 1 : 0.7,
              "&:hover": isConnected
                ? {
                    opacity: 0.9,
                    boxShadow: "inset 0 0 15px rgba(255,255,255,0.2)",
                  }
                : {},
              userSelect: "none",
              transition: "all 0.15s ease",
              position: "relative",
              "& > .diamond": {
                width: "20px",
                height: "20px",
                backgroundColor: "#DC143C",
                transform: "rotate(45deg)",
                border: "2px solid white",
              },
            }}
            onClick={() => isConnected && onNumberClick("red", 1, betAmount)}
          >
            <Box className="diamond" />
          </Box>

          {/* BLACK Diamond */}
          <Box
            sx={{
              flex: 1,
              backgroundColor: "#000",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
              borderRight: "2px solid white",
              borderTop: "2px solid white",
              cursor: isConnected ? "pointer" : "default",
              opacity: isConnected ? 1 : 0.7,
              "&:hover": isConnected
                ? {
                    opacity: 0.9,
                    boxShadow: "inset 0 0 15px rgba(255,255,255,0.2)",
                  }
                : {},
              userSelect: "none",
              transition: "all 0.15s ease",
              position: "relative",
              "& > .diamond": {
                width: "20px",
                height: "20px",
                backgroundColor: "#000",
                transform: "rotate(45deg)",
                border: "2px solid white",
              },
            }}
            onClick={() => isConnected && onNumberClick("black", 0, betAmount)}
          >
            <Box className="diamond" />
          </Box>

          {/* ODD */}
          <Box
            sx={{
              flex: 1,
              backgroundColor: "#333",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
              borderRight: "2px solid white",
              borderTop: "2px solid white",
              cursor: isConnected ? "pointer" : "default",
              opacity: isConnected ? 1 : 0.7,
              "&:hover": isConnected
                ? {
                    backgroundColor: "#444",
                    boxShadow: "inset 0 0 15px rgba(255,255,255,0.1)",
                  }
                : {},
              userSelect: "none",
              transition: "all 0.15s ease",
            }}
            onClick={() => isConnected && onNumberClick("odd", 1, betAmount)}
          >
            ODD
          </Box>

          {/* 19 to 36 */}
          <Box
            sx={{
              flex: 1,
              backgroundColor: "#333",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
              borderTop: "2px solid white",
              cursor: isConnected ? "pointer" : "default",
              opacity: isConnected ? 1 : 0.7,
              "&:hover": isConnected
                ? {
                    backgroundColor: "#444",
                    boxShadow: "inset 0 0 15px rgba(255,255,255,0.1)",
                  }
                : {},
              userSelect: "none",
              transition: "all 0.15s ease",
            }}
            onClick={() => isConnected && onNumberClick("high", 1, betAmount)}
          >
            19 to 36
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RouletteBoard;
