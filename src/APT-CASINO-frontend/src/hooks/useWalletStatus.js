import { useState, useEffect } from "react";

const useWalletStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if wallet is connected
    const checkConnection = async () => {
      try {
        if (typeof window !== "undefined" && window.ethereum) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            setIsConnected(true);
            setAccount(accounts[0]);
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };

    checkConnection();
  }, []);

  const connect = async () => {
    try {
      setIsLoading(true);
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length > 0) {
          setIsConnected(true);
          setAccount(accounts[0]);
        }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAccount(null);
    setBalance("0");
  };

  return {
    isConnected,
    account,
    balance,
    isLoading,
    connect,
    disconnect,
  };
};

export default useWalletStatus;
