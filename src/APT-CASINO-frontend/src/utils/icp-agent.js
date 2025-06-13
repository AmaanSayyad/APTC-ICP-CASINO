// Optimized HTTP Agent Configuration for ICP
import { HttpAgent } from "@dfinity/agent";
import { Buffer } from "buffer";

// Fix for the @noble/hashes issue with missing field hash
// This must be done before any HttpAgent is created
if (typeof window !== "undefined") {
  // Ensure Buffer is globally available for agent operations
  window.Buffer = Buffer;

  // Add global polyfill for hash field if needed by @noble/hashes
  // The error "Cannot find field hash _24860_" occurs when the library can't access the hash property
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    console.warn("Crypto subtle API not available - creating polyfill");
    globalThis.crypto = globalThis.crypto || {};
    globalThis.crypto.subtle = globalThis.crypto.subtle || {};
  }
}

// Max retries for certificate verification issues
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const MAX_BACKOFF_MS = 8000; // Maximum backoff time for retries

// List of common error patterns worth retrying
const RETRYABLE_ERROR_PATTERNS = [
  "400 Bad Request",
  "certificate verification failed",
  "Invalid delegation",
  "signature could not be verified",
  "Failed to fetch",
  "NetworkError",
  "network error",
  "timeout",
  "query rejected",
  "replica error",
];

/**
 * Creates an optimized HTTP agent with proper configuration
 * for certificate verification
 */
// Auto-detect DFX port from environment or dfx info
const getDefaultHost = () => {
  if (import.meta.env.DFX_NETWORK === "ic") {
    return "https://ic0.app";
  }

  // Try to get port from environment variables first
  const envPort = import.meta.env.DFX_PORT || process.env.DFX_PORT;
  if (envPort) {
    return `http://127.0.0.1:${envPort}`;
  }

  // Default to current DFX port from environment for local development
  return `http://127.0.0.1:${import.meta.env.DFX_PORT || "4943"}`;
};

export const createOptimizedAgent = async ({
  identity = null,
  host = getDefaultHost(),
  isLocal = true,
  fetchRootKey = true,
}) => {
  console.log(`🔧 Creating agent with host: ${host}, isLocal: ${isLocal}`);

  // Create agent with specified options
  const agent = new HttpAgent({
    identity,
    host,
    // Increase timeouts for local development
    ...(isLocal && {
      fetchOptions: {
        // Increase timeouts for local development
        timeout: 60000, // Doubled timeout for better reliability
      },
    }),
    // Disable signature verification for local development to avoid certificate issues
    ...(isLocal && {
      verifyQuerySignatures: false,
      disableOriginalPrincipalValidation: true, // Add this to further reduce verification issues
    }),
  });

  // For local development, fetch the root key with retries
  if (isLocal && fetchRootKey) {
    let retries = 0;
    let success = false;

    while (!success && retries < MAX_RETRIES) {
      try {
        console.log(
          `🔑 Fetching root key for local development (attempt ${
            retries + 1
          })...`
        );
        await agent.fetchRootKey();
        console.log("✅ Root key fetched successfully");
        success = true;
      } catch (error) {
        retries++;
        console.error(
          `❌ Failed to fetch root key (attempt ${retries}):`,
          error
        );

        if (retries < MAX_RETRIES) {
          console.log(`⏳ Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        } else {
          console.warn(
            "⚠️ Max retries reached. Continuing without root key..."
          );
          // Don't throw - try to continue with the agent anyway
        }
      }
    }
  }

  // Add middleware to handle certificate verification errors and 400 Bad Request errors
  const originalQueryFn = agent.query.bind(agent);
  agent.query = async (...args) => {
    let retries = 0;

    // Track and log specific errors for troubleshooting
    let lastErrorMessage = "";

    while (retries <= MAX_RETRIES) {
      try {
        // If we're retrying, add a small delay with exponential backoff
        if (retries > 0) {
          const delayTime = RETRY_DELAY_MS * Math.pow(1.5, retries - 1);
          console.log(
            `⏳ Retry attempt ${retries}/${MAX_RETRIES} after ${delayTime}ms delay...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayTime));
        }

        // Execute the query
        const result = await originalQueryFn(...args);

        // If we succeeded after retries, log it
        if (retries > 0) {
          console.log(`✅ Query succeeded after ${retries} retries`);
        }

        return result;
      } catch (error) {
        lastErrorMessage = error.message || "Unknown error";

        // Check for specific error conditions that warrant a retry
        const is400Error =
          error.message?.includes("400") ||
          error.message?.includes("Bad Request") ||
          (error.response && error.response.status === 400);

        const isCertificateError =
          error.message?.includes("certificate verification failed") ||
          error.message?.includes("Invalid delegation") ||
          error.message?.includes("signature could not be verified");

        const isNetworkError =
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("NetworkError") ||
          error.message?.includes("network error") ||
          error.message?.includes("timeout");

        // If it's a retryable error and we haven't exceeded max retries
        if (
          (is400Error || isCertificateError || isNetworkError) &&
          retries < MAX_RETRIES
        ) {
          retries++;
          console.warn(
            `⚠️ Error detected, retrying (${retries}/${MAX_RETRIES})...`
          );
          console.warn(`⚠️ Error details: ${lastErrorMessage}`);

          // For certificate errors, try to refresh the root key if in local development
          if (isCertificateError && isLocal && fetchRootKey) {
            try {
              console.log("🔄 Re-fetching root key during retry...");
              await agent
                .fetchRootKey()
                .catch((e) =>
                  console.warn("Root key fetch during retry failed:", e)
                );
            } catch (e) {
              // Ignore errors in root key fetching during retry
            }
          }
        } else {
          // If we've exhausted retries or it's not a retryable error
          if (retries >= MAX_RETRIES && (is400Error || isCertificateError)) {
            console.error(
              `❌ Max retries (${MAX_RETRIES}) reached for error: ${lastErrorMessage}`
            );
          }
          throw error;
        }
      }
    }
  };

  return agent;
};

/**
 * Handle ICP specific errors with better messaging and categorization
 * @param {Error} error - The error to handle
 * @returns {Object} Processed error with message, code, category, and original error
 */
/**
 * Tests connectivity to the Internet Computer
 * @param {Object} options - The test options
 * @param {string} options.host - The IC host to test
 * @param {boolean} options.isLocal - Whether this is a local replica
 * @returns {Promise<Object>} The test result
 */
export const testICPConnectivity = async ({
  host = import.meta.env.DFX_NETWORK === "ic"
    ? "https://ic0.app"
    : `http://127.0.0.1:${import.meta.env.DFX_PORT || "4943"}`,
  isLocal = true,
}) => {
  console.log(`🧪 Testing ICP connectivity to ${host}...`);
  const startTime = Date.now();
  const results = {
    success: false,
    errors: [],
    latency: 0,
    certificateValid: false,
    hostResponding: false,
  };

  // Test basic connectivity (network level)
  try {
    const response = await fetch(`${host}/_/`);
    results.hostResponding = response.ok;

    if (response.ok) {
      console.log(`✅ Host ${host} is responding`);
    } else {
      console.error(`❌ Host ${host} returned status: ${response.status}`);
      results.errors.push(`Host returned status: ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ Failed to connect to ${host}:`, error);
    results.errors.push(`Network error: ${error.message}`);
  }

  // Test agent creation and certificate verification
  try {
    const agent = await createOptimizedAgent({
      host,
      isLocal,
      fetchRootKey: true,
    });

    // Try a simple status call
    if (agent) {
      try {
        const status = await agent.status();
        results.certificateValid = true;
        console.log(`✅ Agent status check successful:`, status);
      } catch (statusError) {
        console.error(`❌ Agent status check failed:`, statusError);
        results.errors.push(`Agent status error: ${statusError.message}`);
      }
    }
  } catch (agentError) {
    console.error(`❌ Failed to create agent:`, agentError);
    results.errors.push(`Agent creation error: ${agentError.message}`);
  }

  // Calculate latency
  results.latency = Date.now() - startTime;
  results.success = results.hostResponding && results.certificateValid;

  console.log(
    `🏁 ICP connectivity test completed in ${results.latency}ms: ${
      results.success ? "SUCCESS" : "FAILED"
    }`
  );
  return results;
};

/**
 * Handle a 400 Bad Request error specifically
 * Attempts to provide more information and recovery steps
 *
 * @param {Error} error - The 400 error to analyze
 * @param {Object} agent - The HttpAgent instance for diagnostics
 * @returns {Promise<Object>} Detailed error information and recovery steps
 */
export const handle400Error = async (error, agent) => {
  console.error("🔍 Analyzing 400 Bad Request error:", error);

  const errorInfo = {
    originalMessage: error?.message || "Unknown 400 error",
    possibleCauses: [],
    recommendedActions: [
      "Retry the operation - many 400 errors are transient",
      "Check your Internet connection",
    ],
    diagnostics: {},
  };

  // Check response body for more details if available
  try {
    if (error.response && typeof error.response.text === "function") {
      const responseText = await error.response.text();
      errorInfo.diagnostics.responseBody = responseText;

      // Look for specific patterns in the response
      if (responseText.includes("certificate")) {
        errorInfo.possibleCauses.push("Certificate verification failure");
        errorInfo.recommendedActions.push(
          "Try refreshing the page to fetch a new root key"
        );
      }

      if (responseText.includes("subnet")) {
        errorInfo.possibleCauses.push("Subnet communication issue");
        errorInfo.recommendedActions.push(
          "The IC subnet may be experiencing issues - wait and retry"
        );
      }
    }
  } catch (e) {
    // Ignore errors in error handling
  }

  // Check if agent has valid identity
  if (agent) {
    try {
      errorInfo.diagnostics.hasIdentity = !!agent.identity;

      // Test basic connectivity
      const connectivityTest = await testICPConnectivity({
        host: agent._host,
        isLocal:
          agent._host.includes("localhost") ||
          agent._host.includes("127.0.0.1"),
      });

      errorInfo.diagnostics.connectivityTest = connectivityTest;

      if (!connectivityTest.hostResponding) {
        errorInfo.possibleCauses.push("Cannot reach Internet Computer host");
        errorInfo.recommendedActions.push(
          "Check if the IC host is accessible from your network"
        );
      }

      if (!connectivityTest.certificateValid) {
        errorInfo.possibleCauses.push("Certificate validation issues");
        errorInfo.recommendedActions.push(
          "Try refreshing your browser and clearing cache"
        );
      }
    } catch (e) {
      errorInfo.diagnostics.agentDiagnosticError = e.message;
    }
  }

  // If we couldn't determine specific causes, provide general ones
  if (errorInfo.possibleCauses.length === 0) {
    errorInfo.possibleCauses = [
      "Certificate verification failure",
      "Invalid request format",
      "Identity/principal validation issues",
      "Temporary IC network issue",
    ];
  }

  return errorInfo;
};

/**
 * Handle ICP specific errors with better messaging and categorization
 * @param {Error} error - The error to handle
 * @returns {Object} Processed error with message, code, category, and original error
 */
export const handleICPError = (error) => {
  console.error("❌ ICP Error:", error);

  // Extract useful information from the error
  let errorMessage = error?.message || "Unknown error occurred";
  let errorCode = null;
  let errorCategory = "UNKNOWN";

  // Try to extract error code if available
  try {
    if (error.response && error.response.status) {
      errorCode = error.response.status;
    } else if (typeof error === "object" && error.code) {
      errorCode = error.code;
    }
  } catch (e) {
    // Ignore errors in error handling
  }

  // Categorize the error based on message and code
  if (
    errorCode === 400 ||
    errorMessage.includes("400") ||
    errorMessage.includes("Bad Request")
  ) {
    errorCategory = "BAD_REQUEST";
    errorMessage =
      "Bad Request (400) - This may be due to certificate verification issues. Please try again.";
  }
  // Handle hash field errors (Noble hashes library issues)
  else if (
    errorMessage.includes("Cannot find field hash") ||
    errorMessage.includes("_24860_")
  ) {
    errorCategory = "HASH_FIELD_ERROR";
    errorMessage =
      "Internal verification issue detected. This is typically temporary - please try again.";
  }
  // Handle certificate verification errors
  else if (errorMessage.includes("certificate verification failed")) {
    errorCategory = "CERTIFICATE_ERROR";
    errorMessage =
      "Certificate verification failed. This might be due to root key issues.";
  }
  // Handle delegation signature errors
  else if (
    errorMessage.includes("Invalid delegation") ||
    errorMessage.includes("signature could not be verified")
  ) {
    errorCategory = "SIGNATURE_ERROR";
    errorMessage =
      "Authentication signature verification failed. Please try reconnecting your wallet.";
  }
  // Handle canister errors
  else if (
    errorMessage.includes("Canister") &&
    errorMessage.includes("trapped")
  ) {
    errorCategory = "CANISTER_ERROR";
    errorMessage = "The canister encountered an error processing your request.";
  }
  // Handle network errors
  else if (
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("NetworkError") ||
    errorMessage.includes("network error") ||
    errorMessage.includes("timeout")
  ) {
    errorCategory = "NETWORK_ERROR";
    errorMessage =
      "Network error occurred. Please check your connection and try again.";
  }
  // Handle replica errors
  else if (
    errorMessage.includes("Replica") ||
    errorMessage.includes("replica")
  ) {
    errorCategory = "REPLICA_ERROR";
    errorMessage =
      "The Internet Computer replica is having issues processing your request.";
  }
  // Handle query rejected errors
  else if (errorMessage.includes("query rejected")) {
    errorCategory = "QUERY_REJECTED";
    errorMessage =
      "Your query was rejected by the Internet Computer. Please try again.";
  }

  // Create a more useful error object
  return {
    message: errorMessage,
    code: errorCode,
    category: errorCategory,
    isRetryable: [
      "BAD_REQUEST",
      "CERTIFICATE_ERROR",
      "NETWORK_ERROR",
      "QUERY_REJECTED",
      "HASH_FIELD_ERROR",
    ].includes(errorCategory),
    originalError: error,
  };
};
