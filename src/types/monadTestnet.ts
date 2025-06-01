import { defineChain } from 'viem';

export const monadTestnet = defineChain({
  id: 10143, // Chain ID for Monad Testnet
  name: 'Monad Testnet',
  iconUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/30495.png',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'], // RPC URL
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com', // Block explorer URL
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11', // Common address, verify for Monad
      blockCreated: 0, // Verify the correct block number
    },
  },
  testnet: true,
});