import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Actor } from "@dfinity/agent";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import {
  createActor as createAPTCTokenActor,
  idlFactory as aptcIdlFactory,
} from "../../../declarations/APTC-token/index";
import {
  createActor as createRouletteActor,
  idlFactory as rouletteIdlFactory,
} from "../../../declarations/roulette-game/index";
import {
  createActor as createMinesActor,
  idlFactory as minesIdlFactory,
} from "../../../declarations/mines-game/index";

const AuthContext = createContext(null);

const defaultOptions = {
  createOptions: {
    idleOptions: {
      idleTimeout: 1000 * 60 * 30, // set to 30 minutes
      disableDefaultIdleCallback: true, // disable default reload behavior
    },
  },
  loginOptions: {
    identityProvider:
      process.env.DFX_NETWORK === "ic"
        ? "https://identity.ic0.app/#authorize"
        : `http://by6od-j4aaa-aaaaa-qaadq-cai.localhost:4943`,
  },
};

// Custom hook to manage authentication with Internet Identity
export const useAuthClient = (options = defaultOptions) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountIdString, setAccountIdString] = useState("");
  const [stringPrincipal, setStringPrincipal] = useState(null);
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [aptcTokenActor, setAptcTokenActor] = useState(null);
  const [rouletteActor, setRouletteActor] = useState(null);
  const [minesActor, setMinesActor] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Create AuthClient
    AuthClient.create(options.createOptions).then(async (client) => {
      setAuthClient(client);
      // Check if already authenticated
      if (await client.isAuthenticated()) {
        updateClient(client);
      }
    });
  }, []);

  useEffect(() => {
    if (authClient) {
      updateClient(authClient);
    }
  }, [authClient]);

  // Helper function to convert binary data to a hex string
  const toHexString = (byteArray) => {
    return Array.from(byteArray, (byte) =>
      ("0" + (byte & 0xff).toString(16)).slice(-2)
    ).join("");
  };

  const createLedgerActor = async (canisterId, idlFactory) => {
    try {
      const agent = new HttpAgent({ identity });

      if (process.env.DFX_NETWORK !== "ic") {
        agent.fetchRootKey().catch((err) => {
          console.warn(
            "Unable to fetch root key. Check to ensure that your local replica is running"
          );
          console.error(err);
        });
      }

      return Actor.createActor(idlFactory, { agent, canisterId });
    } catch (err) {
      console.error("Error creating ledger actor:", err);
    }
  };

  const login = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        setIsLoading(true);
        setError(null);

        if (
          authClient.isAuthenticated() &&
          !(await authClient.getIdentity().getPrincipal().isAnonymous())
        ) {
          // If already authenticated and not anonymous, update and resolve
          updateClient(authClient);
          setIsAuthenticated(true);
          resolve(authClient);
        } else {
          // Handle Internet Identity login
          authClient.login({
            ...options.loginOptions,
            onError: (error) => {
              console.error("Login error:", error);
              setError(
                error.message || "Failed to connect to Internet Identity"
              );
              setIsLoading(false);
              reject(error);
            },
            onSuccess: () => {
              updateClient(authClient);
              setIsAuthenticated(true);
              setIsLoading(false);
              resolve(authClient);
            },
          });
        }
      } catch (error) {
        console.error("Login error:", error);
        setError(error.message || "Failed to connect to Internet Identity");
        setIsLoading(false);
        reject(error);
      }
    });
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authClient.logout();
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
      setStringPrincipal(null);
      setAptcTokenActor(null);
      setRouletteActor(null);
      setMinesActor(null);
      setAccountId(null);
      setAccountIdString("");
      setError(null);
      setIsLoading(false);
    } catch (error) {
      console.error("Logout error:", error);
      setError(error.message || "Failed to logout");
      setIsLoading(false);
    }
  };

  const updateClient = async (client) => {
    try {
      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);

      if (isAuthenticated) {
        const identity = client.getIdentity();
        setIdentity(identity);

        const principal = identity.getPrincipal();
        setPrincipal(principal.toString());
        setStringPrincipal(principal.toString());

        const accountId = AccountIdentifier.fromPrincipal({ principal });
        setAccountId(toHexString(accountId.bytes));
        setAccountIdString(toHexString(accountId.bytes));

        // Create actors for the canisters
        const agent = new HttpAgent({ identity });

        if (process.env.DFX_NETWORK !== "ic") {
          agent.fetchRootKey().catch((err) => {
            console.warn(
              "Unable to fetch root key. Check to ensure that your local replica is running"
            );
            console.error(err);
          });
        }

        // Create APTC Token Actor
        const aptcActor = createAPTCTokenActor(
          process.env.CANISTER_ID_APTC_TOKEN,
          { agent }
        );
        setAptcTokenActor(aptcActor);

        // Create Roulette Actor
        const rouletteActor = createRouletteActor(
          process.env.CANISTER_ID_ROULETTE_GAME,
          { agent }
        );
        setRouletteActor(rouletteActor);

        // Create Mines Actor (with error handling)
        try {
          const minesActor = createMinesActor(
            process.env.CANISTER_ID_MINES_GAME,
            { agent }
          );
          setMinesActor(minesActor);
        } catch (error) {
          console.warn("Failed to create mines actor:", error);
          setMinesActor(null);
        }

        console.log("🔑 Internet Identity connected:", {
          principal: principal.toString(),
          accountId: toHexString(accountId.bytes),
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error("Authentication update error:", error);
      setError(error.message || "Failed to update authentication");
    }
  };

  const reloadLogin = async () => {
    try {
      if (
        authClient &&
        authClient.isAuthenticated() &&
        !(await authClient.getIdentity().getPrincipal().isAnonymous())
      ) {
        updateClient(authClient);
      }
    } catch (error) {
      console.error("Reload login error:", error);
    }
  };

  return {
    isAuthenticated,
    login,
    logout,
    updateClient,
    authClient,
    identity,
    principal,
    stringPrincipal,
    aptcTokenActor,
    rouletteActor,
    minesActor,
    accountId,
    accountIdString,
    createLedgerActor,
    reloadLogin,
    error,
    isLoading,
    // Legacy compatibility for existing code
    isConnected: isAuthenticated,
    connect: login,
    disconnect: logout,
  };
};

// Authentication provider component - Legacy naming for compatibility
export const AuthProvider = ({ children }) => {
  const auth = useAuthClient();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

// Hook to access authentication context - Legacy naming for compatibility
export const useAuth = () => useContext(AuthContext);

// Legacy naming for compatibility with existing code
export const useNFID = () => useContext(AuthContext);

export function NFIDProvider({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

// Wrapper component that provides Internet Identity configuration
export function NFIDAuthProvider({ children }) {
  return <NFIDProvider>{children}</NFIDProvider>;
}
