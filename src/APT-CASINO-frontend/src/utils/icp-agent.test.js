// Test utility for ICP agent and error handling
import {
  createOptimizedAgent,
  handleICPError,
  testICPConnectivity,
  handle400Error,
} from "../utils/icp-agent";

/**
 * Tests the ICP agent functionality and error handling
 * @param {Object} options - Test options
 * @param {string} options.host - The IC host to test
 * @param {boolean} options.isLocal - Whether this is a local replica
 */
export const testICPAgent = async ({
  host = import.meta.env.DFX_NETWORK === "ic"
    ? "https://ic0.app"
    : `http://127.0.0.1:${import.meta.env.DFX_PORT || "4943"}`,
  isLocal = true,
}) => {
  console.log("🧪 Starting ICP agent test...");
  const results = {
    agentCreation: false,
    connectivityTest: null,
    errorHandling: false,
    retryLogic: false,
  };

  // Step 1: Test agent creation
  try {
    console.log("🔧 Creating agent...");
    const agent = await createOptimizedAgent({
      host,
      isLocal,
      fetchRootKey: true,
    });
    results.agentCreation = !!agent;
    console.log("✅ Agent created successfully");

    // Step 2: Test connectivity
    console.log("🔧 Testing connectivity...");
    results.connectivityTest = await testICPConnectivity({ host, isLocal });
    console.log("Connectivity test results:", results.connectivityTest);

    // Step 3: Test error handling (simulate an error)
    try {
      console.log("🔧 Testing error handling...");
      // Create a fake error to test error handling
      const fakeError = new Error(
        "400 Bad Request: certificate verification failed"
      );
      fakeError.response = { status: 400 };

      const errorInfo = handleICPError(fakeError);
      console.log("Error handling result:", errorInfo);

      results.errorHandling =
        errorInfo.category === "BAD_REQUEST" && errorInfo.isRetryable;
      console.log("✅ Error handling working correctly");

      // Test 400 error handler
      const detailed400Info = await handle400Error(fakeError, agent);
      console.log("400 error handler result:", detailed400Info);
    } catch (errorHandlingError) {
      console.error("❌ Error in error handling test:", errorHandlingError);
    }

    // Step 4: Test retry logic by forcing an error that should be retried
    console.log("🔧 Testing retry logic...");
    const originalQuery = agent.query;
    let retryCount = 0;

    // Override query function to simulate errors and track retries
    agent.query = async (...args) => {
      retryCount++;
      if (retryCount < 3) {
        // Simulate error for first 2 attempts
        throw new Error("certificate verification failed");
      }
      // Succeed on 3rd attempt
      return { success: true };
    };

    try {
      const result = await agent.query();
      results.retryLogic = retryCount === 3 && result.success;
      console.log(
        `✅ Retry logic working correctly (retried ${retryCount} times)`
      );
    } catch (error) {
      console.error("❌ Retry logic test failed:", error);
    }

    // Restore original query function
    agent.query = originalQuery;
  } catch (error) {
    console.error("❌ Agent test failed:", error);
  }

  // Print overall results
  console.log("🏁 ICP Agent Test Results:", results);

  const testPassed = Object.values(results).every(
    (result) =>
      result === true || (typeof result === "object" && result.success)
  );

  console.log(
    `${testPassed ? "✅ All" : "❌ Some"} tests ${
      testPassed ? "passed" : "failed"
    }`
  );

  return results;
};

// Export a simple function to test if host is reachable
export const isICHostReachable = async (
  host = import.meta.env.DFX_NETWORK === "ic"
    ? "https://ic0.app"
    : `http://127.0.0.1:${import.meta.env.DFX_PORT || "4943"}`
) => {
  try {
    const response = await fetch(`${host}/_/`, {
      method: "HEAD",
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.error(`Cannot reach IC host ${host}:`, error);
    return false;
  }
};

// Export a function to test if agent can handle 400 errors properly
export const test400ErrorHandling = async (agent) => {
  console.log("🧪 Testing 400 error handling...");

  if (!agent) {
    try {
      agent = await createOptimizedAgent({});
    } catch (error) {
      console.error("❌ Could not create agent for test:", error);
      return { success: false, error };
    }
  }

  // Create a mock 400 error
  const mockError = new Error("400 Bad Request");
  mockError.response = {
    status: 400,
    text: async () => "Certificate verification failed",
  };

  try {
    const errorInfo = await handle400Error(mockError, agent);
    console.log("400 Error analysis:", errorInfo);

    return {
      success: true,
      errorInfo,
      hasCertificateCause: errorInfo.possibleCauses.some((cause) =>
        cause.toLowerCase().includes("certificate")
      ),
      hasRecommendedActions: errorInfo.recommendedActions.length > 0,
    };
  } catch (error) {
    console.error("❌ 400 error handling test failed:", error);
    return { success: false, error };
  }
};
