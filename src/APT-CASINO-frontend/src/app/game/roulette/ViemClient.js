// ViemClient.js - Viem client configuration for Web3 functionality
import { createPublicClient, createWalletClient, http } from "viem";
import { mainnet, sepolia } from "viem/chains";

// Create public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

// Create public client for Sepolia testnet
export const sepoliaPublicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

// Wallet client will be created dynamically with the user's wallet
export const createWalletClientForChain = (chain, account, transport) => {
  return createWalletClient({
    account,
    chain,
    transport,
  });
};

// Export chain configurations
export { mainnet, sepolia };
