/**
 * Get the host URL for the Internet Computer network
 * @returns {string} The host URL
 */
export function getIcHost() {
  if (import.meta.env.DFX_NETWORK === "ic") {
    return "https://ic0.app";
  }
  return `http://127.0.0.1:${import.meta.env.DFX_PORT || "4943"}`;
}

/**
 * Check if we're running in local development mode
 * @returns {boolean}
 */
export function isLocalDevelopment() {
  return import.meta.env.DFX_NETWORK !== "ic";
}

/**
 * Get the configuration for creating an agent
 * @returns {{ host: string, isLocal: boolean, fetchRootKey: boolean }}
 */
export function getAgentConfig() {
  const host = getIcHost();
  const isLocal = isLocalDevelopment();

  return {
    host,
    isLocal,
    fetchRootKey: isLocal,
  };
}
