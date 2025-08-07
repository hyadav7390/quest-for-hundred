import { monadTestnet } from '@/types/monadTestnet';
import { http, createConfig } from 'wagmi';
import { sepolia, mainnet } from 'viem/chains';

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string;
export const supportedChains = [monadTestnet, sepolia, mainnet] as const;
export const defaultChain = monadTestnet;

export const wagmiConfig = createConfig({
  chains: supportedChains,
  transports: {
    [monadTestnet.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});

export const NATIVE_TOKEN = {
  name: 'Monad',
  symbol: 'MON',
  decimals: 18,
};

export const REWARD_TOKEN = {
  name: 'Rugg Roll Token',
  symbol: 'ROLL',
  decimals: 18,
  address: '0xf307322cd2e5e9889ad7933fe2a909e2b95dd5d3',
};

export const SINGLE_PLAYER_CONTRACT_ADDRESS = '0xc99d63935cbf0c36adb320bf860310225a4689b0';

// TODO: Replace with actual deployed multiplayer contract address
export const MULTI_PLAYER_CONTRACT_ADDRESS = '0xeae35f59e802fbfdb73965bf9fee57f0f2049569';

export type TokenSymbol = typeof NATIVE_TOKEN.symbol | typeof REWARD_TOKEN.symbol;