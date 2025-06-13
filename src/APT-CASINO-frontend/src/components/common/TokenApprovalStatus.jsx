// Token Approval Status Component
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  CheckCircle,
  Warning,
  Error,
  HourglassEmpty,
} from "@mui/icons-material";
import { useBackendIntegrationContext } from "../../contexts/BackendIntegrationContext";

const TokenApprovalStatus = ({
  gameType,
  betAmount,
  onApprovalComplete,
  disabled = false,
}) => {
  const { mines, formatBalance, tokenInfo, loading } =
    useBackendIntegrationContext();
  const [approvalStatus, setApprovalStatus] = useState({
    checking: false,
    sufficient: false,
    current: BigInt(0),
    required: BigInt(0),
    shortfall: BigInt(0),
  });
  const [approving, setApproving] = useState(false); // Check approval status
  const checkApprovalStatus = async () => {
    if (!betAmount || !mines || gameType !== "mines") return;

    setApprovalStatus((prev) => ({ ...prev, checking: true }));

    try {
      const status = await mines.checkSufficientAllowance(betAmount);
      setApprovalStatus({
        checking: false,
        sufficient: status.sufficient,
        current: status.current,
        required: status.required,
        shortfall: status.shortfall,
      });
    } catch (error) {
      console.error("Error checking approval status:", error);
      setApprovalStatus((prev) => ({
        ...prev,
        checking: false,
        sufficient: false,
      }));
    }
  };

  // Effect to check status when betAmount changes
  useEffect(() => {
    if (betAmount && parseFloat(betAmount) > 0) {
      checkApprovalStatus();
    }
  }, [betAmount, mines]);

  // Periodic refresh of approval status (every 30 seconds)
  useEffect(() => {
    if (!betAmount || parseFloat(betAmount) <= 0) return;

    const interval = setInterval(() => {
      checkApprovalStatus();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [betAmount, mines]);

  // Handle approval
  const handleApprove = async () => {
    if (!mines || gameType !== "mines") return;

    setApproving(true);
    try {
      // Get the game canister principal for approval
      const gameCanisterPrincipal = await mines.getGameCanisterPrincipal();

      // Approve the required amount
      const approvalAmount = formatBalance(approvalStatus.required);
      await mines.approveTokens(
        gameCanisterPrincipal.toString(),
        approvalAmount
      );

      // Recheck status after a short delay to allow blockchain to update
      setTimeout(async () => {
        await checkApprovalStatus();

        if (onApprovalComplete) {
          onApprovalComplete();
        }
      }, 2000);
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setApproving(false);
    }
  };

  // Render status icon
  const renderStatusIcon = () => {
    if (approvalStatus.checking || loading.mines) {
      return <HourglassEmpty color="action" />;
    }

    if (approvalStatus.sufficient) {
      return <CheckCircle color="success" />;
    }

    return <Warning color="warning" />;
  };

  // Render status message
  const renderStatusMessage = () => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      return "Enter bet amount to check approval status";
    }

    if (approvalStatus.checking || loading.mines) {
      return "Checking token approval status...";
    }

    if (approvalStatus.sufficient) {
      return `✓ Sufficient allowance (${formatBalance(
        approvalStatus.current
      )} ${tokenInfo.symbol})`;
    }

    const shortfallFormatted = formatBalance(approvalStatus.shortfall);
    return `Need approval for ${shortfallFormatted} ${tokenInfo.symbol}`;
  };

  // Don't render if no bet amount
  if (!betAmount || parseFloat(betAmount) <= 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Alert
        severity={approvalStatus.sufficient ? "success" : "warning"}
        icon={renderStatusIcon()}
        action={
          !approvalStatus.sufficient && !disabled ? (
            <Button
              color="inherit"
              size="small"
              onClick={handleApprove}
              disabled={approving || approvalStatus.checking || loading.mines}
              startIcon={approving ? <CircularProgress size={16} /> : null}
            >
              {approving ? "Approving..." : "Approve Tokens"}
            </Button>
          ) : null
        }
      >
        <Typography variant="body2">{renderStatusMessage()}</Typography>

        {!approvalStatus.sufficient && approvalStatus.shortfall > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Current allowance: {formatBalance(approvalStatus.current)}{" "}
              {tokenInfo.symbol}
              <br />
              Required: {formatBalance(approvalStatus.required)}{" "}
              {tokenInfo.symbol}
              <br />
              <strong>
                Need to approve: {formatBalance(approvalStatus.shortfall)}{" "}
                {tokenInfo.symbol}
              </strong>
            </Typography>
          </Box>
        )}

        {approvalStatus.sufficient && (
          <Box sx={{ mt: 1 }}>
            <Chip
              label="Ready to play!"
              color="success"
              size="small"
              icon={<CheckCircle />}
            />
          </Box>
        )}
      </Alert>
    </Box>
  );
};

export default TokenApprovalStatus;
