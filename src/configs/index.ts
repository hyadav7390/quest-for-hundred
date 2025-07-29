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
  address: '0x9a80c12a72991e74e652fd52ec325ae07dffa950',
};

export const SINGLE_PLAYER_CONTRACT_ADDRESS = '0x22ea5b45f8209c2fd7e9baba1ee2559194f48e12';

// TODO: Replace with actual deployed multiplayer contract address
export const MULTI_PLAYER_CONTRACT_ADDRESS = '0x5d50aa7c176212915b859c83dca32d10b54a8f83';

export type TokenSymbol = typeof NATIVE_TOKEN.symbol | typeof REWARD_TOKEN.symbol;