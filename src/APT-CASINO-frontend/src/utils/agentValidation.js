// Agent validation and troubleshooting utility

export const validateAgent = async (agent) => {
  if (!agent) {
    console.error("❌ Agent is null or undefined");
    return {
      valid: false,
      error: "Agent is null or undefined",
    };
  }

  try {
    // Check if agent has a fetch method
    if (!agent.fetchRootKey || typeof agent.fetchRootKey !== "function") {
      console.error("❌ Agent does not have a fetchRootKey method");
      return {
        valid: false,
        error: "Agent missing required methods",
      };
    }

    // Test a basic call to the IC management canister
    const managementCanisterId = "aaaaa-aa";
    const status = await agent.status();

    console.log("✅ Agent status check:", status);

    return {
      valid: true,
      status,
    };
  } catch (error) {
    console.error("❌ Agent validation failed:", error);
    return {
      valid: false,
      error: error.message || "Unknown agent error",
    };
  }
};

export const isAgentConfigError = (error) => {
  if (!error) return false;

  const errorMsg = error.message || "";
  return (
    errorMsg.includes("agent") ||
    errorMsg.includes("certificate") ||
    errorMsg.includes("fetch") ||
    errorMsg.includes("connection") ||
    errorMsg.includes("timeout") ||
    errorMsg.includes("network") ||
    errorMsg.includes("identity") ||
    errorMsg.includes("authentication")
  );
};

export const resetAgentCache = async () => {
  try {
    // Clear all agent-related items from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (
        key.includes("agent-js") ||
        key.includes("identity") ||
        key.includes("delegation") ||
        key.includes("principal")
      ) {
        localStorage.removeItem(key);
      }
    });

    return true;
  } catch (error) {
    console.error("Failed to reset agent cache:", error);
    return false;
  }
};
