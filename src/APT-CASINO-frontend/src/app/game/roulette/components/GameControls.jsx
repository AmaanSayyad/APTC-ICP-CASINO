import React from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { FaPlayCircle, FaSync, FaLock } from "react-icons/fa";

const GameControls = ({
  onSpin,
  onRefresh,
  isSpinning,
  isLoading,
  isConnected,
}) => {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "900px",
        mx: "auto",
        mt: 4,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {!isConnected && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: "white",
            backgroundColor: "rgba(0,0,0,0.4)",
            p: 2,
            borderRadius: 2,
            mb: 2,
            width: "100%",
            justifyContent: "center",
            gap: 1,
            border: "1px solid rgba(255, 99, 71, 0.3)",
          }}
        >
          <FaLock size={18} color="#ff6347" />
          <Typography>
            Connect your wallet to place bets and spin the wheel
          </Typography>
        </Box>
      )}

      <Button
        variant="contained"
        onClick={onSpin}
        disabled={isSpinning || isLoading || !isConnected}
        startIcon={
          isSpinning ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <FaPlayCircle size={20} />
          )
        }
        sx={{
          px: { xs: 3, md: 6 },
          py: { xs: 1.2, md: 1.8 },
          fontSize: { xs: "0.9rem", md: "1.1rem" },
          fontWeight: "bold",
          borderRadius: "8px",
          background: "linear-gradient(45deg, #FF416C, #FF4B2B)",
          boxShadow: "0 4px 15px rgba(255, 75, 43, 0.4)",
          flexGrow: { xs: 1, sm: 0 },
          width: { xs: "100%", sm: "auto" },
          "&:hover": {
            background: "linear-gradient(45deg, #FF416C, #FF4B2B)",
            boxShadow: "0 6px 20px rgba(255, 75, 43, 0.6)",
            transform: "translateY(-2px)",
          },
          "&:disabled": {
            background: "linear-gradient(45deg, #888, #666)",
            color: "rgba(255,255,255,0.6)",
          },
          transition: "all 0.3s ease",
          textTransform: "none",
        }}
      >
        {isSpinning ? "Spinning..." : "Spin the Wheel"}
      </Button>

      <Button
        variant="outlined"
        onClick={onRefresh}
        disabled={isLoading || !isConnected}
        startIcon={
          isLoading ? <CircularProgress size={18} /> : <FaSync size={16} />
        }
        sx={{
          px: { xs: 3, md: 4 },
          py: { xs: 1.2, md: 1.8 },
          fontSize: { xs: "0.8rem", md: "0.9rem" },
          fontWeight: "bold",
          borderRadius: "8px",
          borderColor: "#6a11cb",
          color: "#6a11cb",
          flexGrow: { xs: 1, sm: 0 },
          width: { xs: "100%", sm: "auto" },
          "&:hover": {
            borderColor: "#6a11cb",
            backgroundColor: "rgba(106, 17, 203, 0.05)",
            transform: "translateY(-2px)",
          },
          transition: "all 0.3s ease",
          textTransform: "none",
        }}
      >
        Refresh Game
      </Button>
    </Box>
  );
};

export default GameControls;
