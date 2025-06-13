// Utility to handle errors from Internet Computer
export const handleAPTCError = (error) => {
  let message = "An unknown error occurred";
  let errorType = "unknown";

  // Attempt to parse the error
  try {
    if (typeof error === "string") {
      message = error;
    } else if (error.message) {
      message = error.message;

      // Detect specific error types
      if (message.includes("certificate verification")) {
        errorType = "certificate";
      } else if (message.includes("Cannot find field hash")) {
        errorType = "hash-field";
      } else if (message.includes("Bad Request")) {
        errorType = "bad-request";
      }
    } else if (error.reject_message) {
      message = error.reject_message;
    } else if (error.error_message) {
      message = error.error_message;
    } else if (error.Err) {
      message = error.Err;
    } else {
      // Try to stringify the error if it's an object
      message = JSON.stringify(error);
    }
  } catch (err) {
    message = "Failed to parse error message";
  }

  console.error("APTC Error:", message);

  return {
    message,
    errorType,
    original: error,
  };
};

// Helper function to create agent with appropriate certificate settings
export const createAgentWithCertOptions = (options = {}) => {
  const { host, identity } = options;

  const agentOptions = {
    host:
      host ||
      (import.meta.env.DFX_NETWORK === "ic"
        ? "https://ic0.app"
        : `http://127.0.0.1:${import.meta.env.DFX_PORT || "4943"}`),
    ...(identity && { identity }),
  };

  // On the IC mainnet, we need to handle certificate verification differently
  if (import.meta.env.DFX_NETWORK === "ic") {
    // Set this to false for query calls to avoid certificate errors
    // This is a workaround for the "400 Bad Request" error
    agentOptions.verifyQuerySignatures = false;

    // Some operations might need to retry with different certificate settings
    agentOptions.retryTimes = 3;
  }

  return agentOptions;
};

// Helper to handle hash field errors
export const handleHashFieldError = async (operation, retryFn) => {
  try {
    return await operation();
  } catch (error) {
    const { errorType } = handleAPTCError(error);

    if (errorType === "hash-field" && retryFn) {
      console.log("🔄 Hash field error detected, retrying with workaround...");
      // Wait a short delay before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await retryFn();
    }

    throw error;
  }
};
