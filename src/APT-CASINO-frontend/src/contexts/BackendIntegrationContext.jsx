import React, { createContext, useContext } from "react";
import useBackendIntegration from "../hooks/useBackendIntegration";

// Create the context
const BackendIntegrationContext = createContext(null);

// Provider component
export const BackendIntegrationProvider = ({ children }) => {
  const backendIntegration = useBackendIntegration();

  return (
    <BackendIntegrationContext.Provider value={backendIntegration}>
      {children}
    </BackendIntegrationContext.Provider>
  );
};

// Custom hook to use the context
export const useBackendIntegrationContext = () => {
  const context = useContext(BackendIntegrationContext);
  if (!context) {
    throw new Error(
      "useBackendIntegrationContext must be used within a BackendIntegrationProvider"
    );
  }
  return context;
};

export default BackendIntegrationProvider;
