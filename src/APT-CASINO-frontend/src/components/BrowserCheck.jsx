import React, { useState, useEffect } from "react";
import { Alert, Snackbar, Button } from "@mui/material";

const BrowserCheck = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [isCompatible, setIsCompatible] = useState(true);

  useEffect(() => {
    const checkBrowserCompatibility = () => {
      // Check for modern features
      const hasES6 = typeof Symbol !== "undefined";
      const hasAsyncAwait = typeof (async () => {}) === "function";
      const hasPromise = typeof Promise !== "undefined";
      const hasFetch = typeof fetch !== "undefined";
      const hasWebGL = (() => {
        try {
          const canvas = document.createElement("canvas");
          return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext("webgl") ||
              canvas.getContext("experimental-webgl"))
          );
        } catch (e) {
          return false;
        }
      })();

      // Browser detection
      const userAgent = navigator.userAgent;
      const isIE =
        userAgent.indexOf("MSIE") !== -1 || userAgent.indexOf("Trident") !== -1;
      const isOldChrome = (() => {
        const match = userAgent.match(/Chrome\/(\d+)/);
        return match && parseInt(match[1]) < 70;
      })();
      const isOldFirefox = (() => {
        const match = userAgent.match(/Firefox\/(\d+)/);
        return match && parseInt(match[1]) < 65;
      })();
      const isOldSafari = (() => {
        const match = userAgent.match(/Version\/(\d+).*Safari/);
        return match && parseInt(match[1]) < 12;
      })();

      const compatible =
        hasES6 && hasAsyncAwait && hasPromise && hasFetch && hasWebGL;
      const modernBrowser =
        !isIE && !isOldChrome && !isOldFirefox && !isOldSafari;

      setIsCompatible(compatible && modernBrowser);

      if (!compatible || !modernBrowser) {
        setShowWarning(true);
      }
    };

    checkBrowserCompatibility();
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const handleClose = () => {
    setShowWarning(false);
  };

  if (!isCompatible) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0A0A",
          color: "white",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "600px" }}>
          <h1 style={{ color: "#d82633", marginBottom: "20px" }}>
            Browser Compatibility Issue
          </h1>
          <p
            style={{
              marginBottom: "20px",
              fontSize: "16px",
              lineHeight: "1.6",
            }}
          >
            Your browser may not be compatible with this application. For the
            best experience, please use:
          </p>
          <ul style={{ textAlign: "left", marginBottom: "30px" }}>
            <li>Google Chrome 70+ or Chromium-based browsers</li>
            <li>Mozilla Firefox 65+</li>
            <li>Safari 12+</li>
            <li>Microsoft Edge 79+</li>
          </ul>
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={handleReload}
              style={{
                backgroundColor: "#d82633",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Try Reloading
            </button>
            <button
              onClick={() => setIsCompatible(true)}
              style={{
                backgroundColor: "transparent",
                color: "#681DDB",
                border: "2px solid #681DDB",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Continue Anyway
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <Snackbar
        open={showWarning}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
          severity="warning"
          variant="filled"
          action={
            <Button color="inherit" size="small" onClick={handleReload}>
              RELOAD
            </Button>
          }
        >
          If this page appears broken, try reloading. Chrome or Firefox are
          recommended.
        </Alert>
      </Snackbar>
    </>
  );
};

export default BrowserCheck;
