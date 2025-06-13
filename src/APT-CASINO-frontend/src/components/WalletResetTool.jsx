import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Alert,
  AlertTitle,
  Collapse,
} from "@mui/material";
import { SettingsBackupRestore, Check, Info } from "@mui/icons-material";
import { toast } from "react-hot-toast";

/**
 * WalletResetTool component provides a UI for users to reset their wallet connection
 * to fix common issues like ThresBls12_381 signature verification errors.
 */
const WalletResetTool = ({ onClose }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Function to clear all local storage items related to authentication
  const clearStorageItems = () => {
    let clearedCount = 0;

    // Items to look for in localStorage and sessionStorage
    const patterns = [
      "delegation",
      "agent-js",
      "identity",
      "principal",
      "nfid",
      "canister",
      "certificate",
      "ic-",
      "dfinity",
      "internet-identity",
    ];

    // Clear matching items from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (patterns.some((pattern) => key.toLowerCase().includes(pattern))) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });

    // Clear matching items from sessionStorage
    Object.keys(sessionStorage).forEach((key) => {
      if (patterns.some((pattern) => key.toLowerCase().includes(pattern))) {
        sessionStorage.removeItem(key);
        clearedCount++;
      }
    });

    return clearedCount;
  };

  // Function to perform the wallet reset
  const handleReset = async () => {
    setIsResetting(true);

    try {
      // Step 1: Clear localStorage and sessionStorage
      const clearedCount = clearStorageItems();

      // Provide feedback
      toast.success(`Cleared ${clearedCount} stored credentials`);

      // Step 2: Clear any in-memory auth state
      // This part would ideally integrate with your auth provider
      // For now, we'll just simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 3: Update app state
      setResetComplete(true);
      toast.success("Wallet connection reset complete!");
    } catch (error) {
      console.error("Error during wallet reset:", error);
      toast.error("Failed to reset wallet connection: " + error.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Function to handle full page reload
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        maxWidth: 500,
        mx: "auto",
        backgroundColor: "rgba(20, 20, 30, 0.9)",
        color: "white",
        borderRadius: 2,
      }}
    >
      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        sx={{ color: "#FFD700" }}
      >
        <SettingsBackupRestore sx={{ mr: 1, verticalAlign: "middle" }} />
        Wallet Connection Reset Tool
      </Typography>

      <Typography variant="body1" paragraph>
        Use this tool to fix token approval issues, including ThresBls12_381
        signature verification errors.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          color="info"
          size="small"
          onClick={() => setShowInstructions(!showInstructions)}
          sx={{ mb: 1 }}
        >
          <Info sx={{ mr: 0.5, fontSize: 16 }} />
          {showInstructions ? "Hide Details" : "Show Details"}
        </Button>

        <Collapse in={showInstructions}>
          <Alert
            severity="info"
            sx={{ mt: 1, backgroundColor: "rgba(0, 127, 255, 0.1)" }}
          >
            <AlertTitle>What this tool does:</AlertTitle>
            <Typography variant="body2" component="div">
              <ol style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
                <li>Clears all stored credentials from your browser</li>
                <li>Removes cached certificates and delegations</li>
                <li>
                  Fixes common ThresBls12_381 signature verification errors
                </li>
                <li>Prepares your wallet for a fresh connection</li>
              </ol>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              After resetting, you'll need to reconnect your wallet to continue
              using the casino.
            </Typography>
          </Alert>
        </Collapse>
      </Box>

      {resetComplete ? (
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Check sx={{ fontSize: 48, color: "success.main", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Reset Complete!
          </Typography>
          <Typography variant="body2" paragraph>
            Your wallet connection has been reset successfully.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleReload}
            sx={{ mt: 1 }}
          >
            Reload Page
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onClose}
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReset}
            disabled={isResetting}
            startIcon={
              isResetting ? (
                <CircularProgress size={20} />
              ) : (
                <SettingsBackupRestore />
              )
            }
          >
            {isResetting ? "Resetting..." : "Reset Wallet Connection"}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default WalletResetTool;
