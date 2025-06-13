import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  Collapse,
  TextField,
} from "@mui/material";
import { ContentCopy, Code, Terminal } from "@mui/icons-material";
import { useNFID } from "../providers/NFIDProvider";

const LocalDevBettingGuide = ({ betAmount, betType }) => {
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const { principal } = useNFID();

  const isLocalDev =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("127.0.0.1"));

  // Calculate raw amount for the CLI command
  const rawAmount = betAmount ? Math.floor(betAmount * 100000000) : 500000000; // Default to 5 APTC if not provided

  // Generate the enhanced betting command
  const enhancedCommand = principal
    ? `./enhanced-local-betting.sh '${principal.toString()}' '${rawAmount}' '${
        betType || "red"
      }'`
    : "./enhanced-local-betting.sh <your-principal> <amount> <bet-type>";

  const cliCommands = [
    {
      title: "Navigate to project",
      command: "cd /Users/aditya/APT-CASINO",
    },
    {
      title: "Run enhanced betting script (recommended)",
      command: enhancedCommand,
      primary: true,
    },
    {
      title: "Run interactive betting",
      command: "./local-bet-cli.sh",
    },
    {
      title: "Example: Bet 5 APTC on red",
      command:
        'dfx canister call APTC-token icrc2_approve "(record { from_subaccount = null; spender = record { owner = principal \\"bw4dl-smaaa-aaaaa-qaacq-cai\\"; subaccount = null }; amount = 600_000_000; expected_allowance = null; expires_at = null; fee = null; memo = null; created_at_time = null })" && dfx canister call roulette-game placeBet "(variant { Color }, 1, 500_000_000, vec {})"',
    },
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isLocalDev) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Alert
        severity="info"
        sx={{
          backgroundColor: "rgba(255, 193, 7, 0.08)",
          color: "rgba(255, 255, 255, 0.9)",
          border: "1px solid rgba(255, 193, 7, 0.2)",
          borderRadius: "8px",
          fontSize: "0.875rem",
          "& .MuiAlert-icon": {
            color: "#ffc107",
            fontSize: "1.2rem",
          },
          "& .MuiAlert-message": {
            width: "100%",
            padding: "2px 0",
          },
        }}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => setShowGuide(!showGuide)}
            startIcon={<Terminal sx={{ fontSize: "16px" }} />}
            sx={{
              color: "#ffc107",
              fontSize: "0.8rem",
              minWidth: "auto",
              padding: "4px 8px",
              "&:hover": {
                backgroundColor: "rgba(255, 193, 7, 0.1)",
              },
            }}
          >
            {showGuide ? "Hide" : "CLI"}
          </Button>
        }
      >
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, fontSize: "0.85rem" }}
        >
          <strong>Local Dev Mode:</strong> Use CLI commands for reliable betting
          (NFID may have signature issues)
        </Typography>
      </Alert>

      <Collapse in={showGuide}>
        <Box
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: "rgba(0,0,0,0.8)",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Typography variant="h6" sx={{ color: "#ffc107", mb: 2 }}>
            💻 Enhanced CLI Betting Commands
          </Typography>

          <Alert
            severity="success"
            sx={{ mb: 2, backgroundColor: "rgba(46, 125, 50, 0.2)" }}
          >
            <Typography variant="body2">
              <strong>💡 New Feature:</strong> The enhanced betting script
              automatically handles ThresBls12_381 signature errors for you.
            </Typography>
          </Alert>

          {cliCommands.map((cmd, index) => (
            <Box
              key={index}
              sx={{
                mb: 2,
                border: cmd.primary
                  ? "1px solid rgba(255, 215, 0, 0.3)"
                  : "none",
                borderRadius: cmd.primary ? "8px" : "0",
                padding: cmd.primary ? "10px" : "0",
                backgroundColor: cmd.primary
                  ? "rgba(255, 215, 0, 0.05)"
                  : "transparent",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: cmd.primary ? "#ffd700" : "#ccc",
                  mb: 1,
                  fontWeight: cmd.primary ? "bold" : "normal",
                }}
              >
                {cmd.title}:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#000",
                  borderRadius: "4px",
                  p: 1,
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <code
                  style={{
                    color: cmd.primary ? "#ffeb3b" : "#00ff00",
                    flex: 1,
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    wordBreak: "break-all",
                  }}
                >
                  {cmd.command}
                </code>
                <Button
                  size="small"
                  variant={cmd.primary ? "contained" : "outlined"}
                  color={cmd.primary ? "primary" : "inherit"}
                  sx={{ ml: 1, minWidth: "auto" }}
                  onClick={() => copyToClipboard(cmd.command)}
                >
                  <ContentCopy fontSize="small" />
                </Button>
              </Box>
            </Box>
          ))}

          <Box
            sx={{
              mt: 2,
              p: 1,
              backgroundColor: "rgba(0,150,255,0.1)",
              borderRadius: "4px",
            }}
          >
            <Typography variant="caption" sx={{ color: "#00BFFF" }}>
              💡 <strong>Tip:</strong> The interactive script
              (./local-bet-cli.sh) provides a menu-driven interface for placing
              bets, checking game state, and triggering spins.
            </Typography>
          </Box>

          {copied && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Command copied to clipboard!
            </Alert>
          )}

          {principal && betAmount && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: "#ffc107", mb: 1 }}>
                Current Bet Details:
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "#ccc" }}>
                    Amount:
                  </Typography>
                  <TextField
                    size="small"
                    value={`${betAmount} APTC (${rawAmount})`}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        width: "200px",
                        backgroundColor: "rgba(0,0,0,0.5)",
                      },
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#ccc" }}>
                    Bet Type:
                  </Typography>
                  <TextField
                    size="small"
                    value={betType || "red"}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        width: "120px",
                        backgroundColor: "rgba(0,0,0,0.5)",
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default LocalDevBettingGuide;
