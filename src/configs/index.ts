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
  name: 'Nunu Game Token',
  symbol: 'NUNU',
  decimals: 18,
  address: '0xdae511d02ae7c9017edd634142f7a0e8e24c8fcd',
};

export const SINGLE_PLAYER_CONTRACT_ADDRESS = '0xb912e50ebc241200108e92de3e8a1bf5baf50a0a';

// TODO: Replace with actual deployed multiplayer contract address
export const MULTI_PLAYER_CONTRACT_ADDRESS = '0x6b4e1416261ee8a4d106cfcd382f73b2dcd99b8e';

export type TokenSymbol = typeof NATIVE_TOKEN.symbol | typeof REWARD_TOKEN.symbol;