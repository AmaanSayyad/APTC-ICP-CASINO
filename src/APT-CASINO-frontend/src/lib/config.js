// "use client";
// import { http } from "wagmi";
// import {
//   mainnet,
//   polygon,
//   mantleSepoliaTestnet,
// } from "wagmi/chains";
// import {
//   getDefaultConfig,
// } from "@rainbow-me/rainbowkit";
// const projectId = `64df6621925fa7d0680ba510ac3788df`;

// export const nibiChain = {
//   id: 5115,
//   name: "Nibiru Testnet-1",
//   nativeCurrency: { name: "Nibiru Testnet-1", symbol: "NIBI", decimals: 18 },
//   rpcUrls: {
//     default: { http: ["https://evm-rpc.testnet-1.nibiru.fi"] },
//   },
//   blockExplorers: {
//     default: { name: "Nibiru Testnet-1", url: "" },
//   },
// };
// const supportedChains = [mainnet, polygon, nibiChain, mantleSepoliaTestnet];
// export const config = getDefaultConfig({
//   appName: "APT-Casino",
//   projectId,
//   multiInjectedProviderDiscovery: false,
//   chains: supportedChains,
//   ssr: true,
//   transports: supportedChains.reduce(
//     (obj, chain) => ({ ...obj, [chain.id]: http() }),
//     {}
//   ),
// });
