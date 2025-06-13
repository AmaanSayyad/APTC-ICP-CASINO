import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";

const ErrorContainer = styled(Paper)(({ theme }) => ({
  padding: "2rem",
  margin: "2rem auto",
  maxWidth: "600px",
  background:
    "linear-gradient(135deg, rgba(220, 38, 51, 0.1), rgba(220, 38, 51, 0.05))",
  border: "1px solid rgba(220, 38, 51, 0.2)",
  borderRadius: "16px",
  textAlign: "center",
}));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now() + "-" + Math.random().toString(36).substr(2, 9),
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error("❌ Error Boundary caught an error:", error);
    console.error("📍 Error Info:", errorInfo);

    // Store error details in state
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log to external error reporting service if available
    if (typeof window !== "undefined" && window.reportError) {
      window.reportError(error, errorInfo);
    }
  }

  handleReload = () => {
    // Clear error state and try to recover
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    // Force a page reload as last resort
    if (
      this.state.error?.message?.includes("chunk") ||
      this.state.error?.message?.includes("Loading")
    ) {
      window.location.reload();
    }
  };

  handleClearStorage = () => {
    try {
      // Clear potentially corrupted data
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();

        // Clear IndexedDB if it exists
        if ("indexedDB" in window) {
          indexedDB.deleteDatabase("aptc-casino-cache");
        }
      }

      // Reload after clearing
      window.location.reload();
    } catch (err) {
      console.error("Failed to clear storage:", err);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes("chunk") ||
        this.state.error?.message?.includes("Loading chunk");

      const isReferenceError =
        this.state.error?.message?.includes("is not defined") ||
        this.state.error instanceof ReferenceError;

      return (
        <ErrorContainer elevation={3}>
          <Typography variant="h4" color="error" sx={{ mb: 2 }}>
            🚨 Something went wrong
          </Typography>

          <Typography variant="h6" sx={{ mb: 2, color: "white" }}>
            {isChunkError
              ? "Loading Error"
              : isReferenceError
              ? "Component Error"
              : "Application Error"}
          </Typography>

          <Typography
            variant="body1"
            sx={{ mb: 3, color: "rgba(255,255,255,0.8)" }}
          >
            {isChunkError
              ? "Failed to load application resources. This usually happens after an app update."
              : isReferenceError
              ? "A component failed to load properly. This is usually a temporary issue."
              : "The application encountered an unexpected error."}
          </Typography>

          {/* Error Details (for development) */}
          {process.env.NODE_ENV === "development" && this.state.error && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                background: "rgba(0,0,0,0.3)",
                borderRadius: 2,
                textAlign: "left",
                fontSize: "0.875rem",
                fontFamily: "monospace",
                maxHeight: "200px",
                overflow: "auto",
              }}
            >
              <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                Error Details:
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                {this.state.error.toString()}
              </Typography>
              {this.state.errorInfo?.componentStack && (
                <Typography
                  variant="body2"
                  color="rgba(255,255,255,0.5)"
                  sx={{ mt: 1 }}
                >
                  Component Stack:{" "}
                  {this.state.errorInfo.componentStack.slice(0, 500)}...
                </Typography>
              )}
            </Box>
          )}

          {/* Recovery Actions */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              onClick={this.handleReload}
              sx={{
                backgroundColor: "#681DDB",
                "&:hover": { backgroundColor: "#5a17c9" },
              }}
            >
              {isChunkError ? "Reload App" : "Try Again"}
            </Button>

            <Button
              variant="outlined"
              onClick={this.handleClearStorage}
              sx={{
                borderColor: "#DC2633",
                color: "#DC2633",
                "&:hover": {
                  borderColor: "#b91c28",
                  backgroundColor: "rgba(220, 38, 51, 0.1)",
                },
              }}
            >
              Clear Cache & Reload
            </Button>

            <Button
              variant="text"
              onClick={() => (window.location.href = "/")}
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              Go Home
            </Button>
          </Box>

          {/* Error ID for support */}
          <Typography
            variant="caption"
            sx={{
              mt: 3,
              display: "block",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Error ID: {this.state.errorId}
          </Typography>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
