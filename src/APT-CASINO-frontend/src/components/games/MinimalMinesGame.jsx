// Minimal Mines Game Component for debugging
import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Dark theme for casino styling
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#FFD700" },
    secondary: { main: "#FF6B35" },
    background: { default: "#0a0a0a", paper: "#1a1a1a" },
  },
});

const MinimalMinesGame = () => {
  console.log("🎮 MinimalMinesGame component rendering...");

  const [debugInfo, setDebugInfo] = useState("Component loaded successfully");

  useEffect(() => {
    console.log("🚀 MinimalMinesGame mounted!");
    setDebugInfo("Component mounted and useEffect triggered");
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        className="minimal-mines-game"
        sx={{ p: 3, minHeight: "100vh", backgroundColor: "#0a0a0a" }}
      >
        <Typography
          variant="h3"
          gutterBottom
          sx={{ textAlign: "center", color: "#FFD700" }}
        >
          💎 Mines (Minimal Debug Version)
        </Typography>

        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Alert severity="info" sx={{ mb: 3, maxWidth: 600, mx: "auto" }}>
            Debug Info: {debugInfo}
          </Alert>

          <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
            This is a minimal version to test if the component can render
            without backend dependencies.
          </Typography>

          <Button
            variant="contained"
            sx={{ bgcolor: "#FFD700", color: "#000", m: 1 }}
            onClick={() =>
              setDebugInfo(
                "Button clicked at " + new Date().toLocaleTimeString()
              )
            }
          >
            Test Button
          </Button>

          <Box
            sx={{
              mt: 4,
              p: 3,
              backgroundColor: "#1a1a1a",
              borderRadius: 2,
              maxWidth: 600,
              mx: "auto",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Component Status
            </Typography>
            <Typography variant="body1">
              ✅ React component rendering
              <br />
              ✅ Material-UI theme applied
              <br />
              ✅ State management working
              <br />✅ Event handlers working
            </Typography>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default MinimalMinesGame;
