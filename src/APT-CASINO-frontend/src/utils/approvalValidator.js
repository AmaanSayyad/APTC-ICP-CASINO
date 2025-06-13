// Agent and token approval validation utility
import { HttpAgent } from "@dfinity/agent";
import { getCachedAgent } from "../config/backend-integration";

/**
 * Validates agent certificate and checks for common issues
 * @param {HttpAgent} agent - The agent to validate
 * @returns {Promise<Object>} - Validation result
 */
export const validateAgentCertificate = async (agent) => {
  if (!agent) {
    return {
      valid: false,
      error: "No agent provided",
      errorType: "NULL_AGENT",
    };
  }

  try {
    // Try to fetch status to verify the agent is working
    const status = await agent.status();

    // Check if the agent has a certificate
    const hasCertificate =
      agent._certificationInfo && agent._certificationInfo.certificate;

    // Log detailed agent info for debugging
    console.log("🔍 Agent validation:", {
      hasCertificate,
      certExpiry: agent._certificationInfo
        ? new Date(agent._certificationInfo.expirationTime).toISOString()
        : "No expiry",
      delegationChainLength:
        agent._certificationInfo && agent._certificationInfo.delegationChain
          ? agent._certificationInfo.delegationChain.length
          : 0,
    });

    // Check if certificate is expired
    const now = Date.now();
    const isExpired =
      agent._certificationInfo &&
      agent._certificationInfo.expirationTime &&
      agent._certificationInfo.expirationTime < now;

    if (isExpired) {
      return {
        valid: false,
        error: "Agent certificate is expired",
        errorType: "EXPIRED_CERTIFICATE",
        expiryTime: new Date(
          agent._certificationInfo.expirationTime
        ).toISOString(),
        currentTime: new Date(now).toISOString(),
      };
    }

    return {
      valid: true,
      status,
      hasCertificate,
      expiryTime:
        agent._certificationInfo && agent._certificationInfo.expirationTime
          ? new Date(agent._certificationInfo.expirationTime).toISOString()
          : "No expiry",
    };
  } catch (error) {
    console.error("❌ Agent validation error:", error);
    return {
      valid: false,
      error: error.message || "Unknown agent validation error",
      errorType: error.name || "UNKNOWN_ERROR",
      errorDetails: error.toString(),
    };
  }
};

/**
 * Checks if token approval can be performed
 * @param {Object} identity - User identity
 * @param {string} principal - User principal
 * @param {string} spenderCanister - Canister that will spend tokens
 * @returns {Promise<Object>} - Approval readiness check results
 */
export const checkTokenApprovalReadiness = async (
  identity,
  principal,
  spenderCanister
) => {
  if (!identity || !principal) {
    return {
      ready: false,
      error: "User not authenticated",
      errorType: "NOT_AUTHENTICATED",
    };
  }

  try {
    // Create a fresh agent with forced refresh
    const agent = await getCachedAgent(
      identity,
      `approval-check-${Date.now()}`,
      true // Force fresh agent
    );

    // Validate the agent
    const agentValidation = await validateAgentCertificate(agent);

    if (!agentValidation.valid) {
      return {
        ready: false,
        error: `Agent validation failed: ${agentValidation.error}`,
        errorType: agentValidation.errorType,
        agentValidation,
      };
    }

    // If we got here, approval should be possible
    return {
      ready: true,
      agentValidation,
      principal,
      spenderCanister,
    };
  } catch (error) {
    console.error("❌ Approval readiness check failed:", error);
    return {
      ready: false,
      error: error.message || "Unknown error checking approval readiness",
      errorType: error.name || "UNKNOWN_ERROR",
    };
  }
};

export default {
  validateAgentCertificate,
  checkTokenApprovalReadiness,
};
