import { createConfig } from "@privy-io/wagmi";
import { monadTestnet } from "./types/monadTestnet";

import {mainnet, sepolia} from 'viem/chains';
import {http} from 'wagmi';


const projectAccessKey = "AQAAAAAAAKUVp0tvbJ2zQGZzZn4uGBb__mo"
const waasConfigKey = "eyJwcm9qZWN0SWQiOjQyMjYxLCJycGNTZXJ2ZXIiOiJodHRwczovL3dhYXMuc2VxdWVuY2UuYXBwIn0=" // Pass in your waasConfigKey
const enableConfirmationModal = true // change to your preference
const walletConnectProjectId = '424572aa10a33929bbcbd6ec6184f296' // Pass in your WalletConnect Project ID



// export const config: any = createConfig("waas", {
//     projectAccessKey,
//     position: "center",
//     defaultTheme: "dark",
//     signIn: {
//         projectName: "NUNU GAMES",
//     },
//     defaultChainId: 10143,
//     chainIds: [1, 10, 40, 41, 56, 97, 100, 137, 1101, 1284, 1287, 1868, 1946, 1993, 6283, 7668, 7672, 8333, 8453, 10143, 11690, 19011, 33111, 33139, 40875, 42161, 42170, 42793, 43113, 43114, 50312, 62850, 80002, 81457, 84532, 128123, 421614, 660279, 11155111, 11155420, 21000000, 37084624, 168587773, 1482601649, 37714555429],
//     appName: "NUNU GAMES",
//     waasConfigKey,
//     google: false,
//     apple: false,
//     walletConnect: {
//         projectId: walletConnectProjectId
//     },
//     coinbase: false,
//     metaMask: true,
//     wagmiConfig: {
//         multiInjectedProviderDiscovery: true,
//     },
//     enableConfirmationModal
// });

export const config = createConfig({
    chains: [mainnet, sepolia, monadTestnet], // Pass your required chains as an array
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [monadTestnet.id]: http()
      // For each of your required chains, add an entry to `transports` with
      // a key of the chain's `id` and a value of `http()`
    },
});

export const NUNUGT_TOKEN = {
  address: '0x9a80c12a72991e74e652fd52ec325ae07dffa950',
  symbol: 'NUNUGT',
};

export const TOKEN_SYMBOLS = {
  MON: 'MON',
  NUNUGT: 'NUNUGT',
} as const;
export type TokenSymbol = typeof TOKEN_SYMBOLS[keyof typeof TOKEN_SYMBOLS];