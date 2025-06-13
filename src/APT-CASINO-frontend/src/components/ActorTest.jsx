import React, { useState, useEffect } from "react";
import {
  createAPTCTokenActor,
  createRouletteActor,
} from "../config/aptc-config";

const ActorTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message, type = "info") => {
    setTestResults((prev) => [
      ...prev,
      { message, type, timestamp: new Date().toISOString() },
    ]);
  };

  const testActorCreation = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      addResult("🔄 Starting actor creation tests...", "info");

      // Test APTC Token Actor
      addResult("Creating APTC token actor...", "info");
      const tokenActor = await createAPTCTokenActor();
      addResult("✅ APTC token actor created successfully", "success");

      // List available methods
      const tokenMethods = Object.getOwnPropertyNames(tokenActor).filter(
        (name) => typeof tokenActor[name] === "function"
      );
      addResult(`Token actor methods: ${tokenMethods.join(", ")}`, "info");

      // Test a simple method call
      try {
        const tokenName = await tokenActor.icrc1_name();
        addResult(`✅ Token name: ${tokenName}`, "success");
      } catch (err) {
        addResult(`❌ Failed to get token name: ${err.message}`, "error");
      }

      // Test Roulette Actor
      addResult("Creating roulette actor...", "info");
      const rouletteActor = await createRouletteActor();
      addResult("✅ Roulette actor created successfully", "success");

      // List available methods
      const rouletteMethods = Object.getOwnPropertyNames(rouletteActor).filter(
        (name) => typeof rouletteActor[name] === "function"
      );
      addResult(
        `Roulette actor methods: ${rouletteMethods.join(", ")}`,
        "info"
      );

      // Test the getGameInfo method specifically
      try {
        const gameInfo = await rouletteActor.getGameInfo();
        addResult(
          `✅ getGameInfo() works! Data: ${JSON.stringify(gameInfo)}`,
          "success"
        );
      } catch (err) {
        addResult(`❌ getGameInfo() failed: ${err.message}`, "error");
      }

      // Test other methods
      const methodsToTest = ["getRecentNumbers", "getCurrentBets"];
      for (const method of methodsToTest) {
        try {
          if (typeof rouletteActor[method] === "function") {
            const result = await rouletteActor[method]();
            addResult(
              `✅ ${method}() works! Data: ${JSON.stringify(result)}`,
              "success"
            );
          } else {
            addResult(`⚠️ ${method}() method not found`, "warning");
          }
        } catch (err) {
          addResult(`❌ ${method}() failed: ${err.message}`, "error");
        }
      }

      addResult("🎉 Actor tests completed!", "success");
    } catch (error) {
      addResult(`❌ Actor creation failed: ${error.message}`, "error");
      console.error("Actor test error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getResultColor = (type) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-gray-700";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Actor Creation Test</h2>

      <button
        onClick={testActorCreation}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Actor Creation"}
      </button>

      <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        {testResults.length === 0 ? (
          <p className="text-gray-500">
            Click "Test Actor Creation" to run tests
          </p>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`text-sm ${getResultColor(result.type)}`}
              >
                <span className="text-gray-400 text-xs">
                  [{new Date(result.timestamp).toLocaleTimeString()}]
                </span>{" "}
                {result.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActorTest;
