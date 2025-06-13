// Test page for ICP Agent
"use client";

import { useState, useEffect } from "react";
import {
  createOptimizedAgent,
  testICPConnectivity,
  handleICPError,
} from "../../utils/icp-agent";
import {
  testICPAgent,
  isICHostReachable,
  test400ErrorHandling,
} from "../../utils/icp-agent.test";

export default function AgentTestPage() {
  const [testResults, setTestResults] = useState(null);
  const [connectivityResults, setConnectivityResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [host, setHost] = useState("https://ic0.app");
  const [isLocal, setIsLocal] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setError(null);

    try {
      // Test basic connectivity first
      const isReachable = await isICHostReachable(host);
      if (!isReachable) {
        setError(
          `Cannot reach host ${host}. Please check the URL and your network connection.`
        );
        setLoading(false);
        return;
      }

      // Run connectivity test
      const connectivity = await testICPConnectivity({ host, isLocal });
      setConnectivityResults(connectivity);

      // Run full agent tests
      const results = await testICPAgent({ host, isLocal });
      setTestResults(results);
    } catch (err) {
      setError(err.message || "An unknown error occurred");
      console.error("Test error:", err);
    } finally {
      setLoading(false);
    }
  };

  const runSpecific400Test = async () => {
    setLoading(true);
    setError(null);

    try {
      let agent;
      try {
        agent = await createOptimizedAgent({ host, isLocal });
      } catch (agentError) {
        setError(`Failed to create agent: ${agentError.message}`);
        setLoading(false);
        return;
      }

      const result = await test400ErrorHandling(agent);
      setTestResults({
        ...testResults,
        specificTest400: result,
      });
    } catch (err) {
      setError(err.message || "An unknown error occurred");
      console.error("400 Test error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">ICP Agent Test Page</h1>

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Test Configuration</h2>
        <div className="flex flex-col space-y-2">
          <div>
            <label className="block mb-1">IC Host:</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isLocal"
              checked={isLocal}
              onChange={(e) => setIsLocal(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isLocal">
              Local Development (localhost/127.0.0.1)
            </label>
          </div>
        </div>
      </div>

      <div className="flex space-x-2 mb-6">
        <button
          onClick={runTests}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? "Running Tests..." : "Run All Tests"}
        </button>

        <button
          onClick={runSpecific400Test}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          Test 400 Error Handling
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded">
          <h3 className="text-lg font-semibold text-red-700">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {connectivityResults && (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Connectivity Results</h2>
          <div className="overflow-x-auto">
            <pre className="bg-gray-100 p-3 rounded">
              {JSON.stringify(connectivityResults, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {testResults && (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Test Results</h2>
          <div className="overflow-x-auto">
            <pre className="bg-gray-100 p-3 rounded">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Common Issues</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>400 Bad Request errors</strong> - Often related to
            certificate verification failures. Our agent now includes automatic
            retries and proper error handling.
          </li>
          <li>
            <strong>Certificate verification failures</strong> - For local
            development, we've disabled signature verification and principal
            validation.
          </li>
          <li>
            <strong>Timeout issues</strong> - We've increased the timeout from
            30s to 60s for better reliability.
          </li>
          <li>
            <strong>Network connectivity problems</strong> - Use the
            connectivity test to verify your connection to the IC.
          </li>
        </ul>
      </div>

      <div className="p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Documentation</h2>
        <p>
          For more information about ICP error handling, please see the{" "}
          <a
            href="/docs/ICP_ERROR_HANDLING.md"
            className="text-blue-500 hover:underline"
          >
            ICP Error Handling Guide
          </a>
          .
        </p>
      </div>
    </div>
  );
}
