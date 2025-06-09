
import { WagmiProvider } from 'wagmi';
import { sepolia, mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { monadTestnet } from '@/types/monadTestnet';

import { config } from "./../../config";
import { SequenceConnect } from "@0xsequence/connect";

// Configure chains & providers
const projectId = '424572aa10a33929bbcbd6ec6184f296'; 

// Create wagmi config
// const config = getDefaultConfig({
//   chains: [sepolia, mainnet, polygon, optimism, arbitrum, base, monadTestnet],
//   appName: 'Nunu Games',
//   projectId,
// });



// Create a client for React Query
const queryClient = new QueryClient();

interface WalletProviderProps {
  children: React.ReactNode;
}

const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  return (
    // <WagmiProvider config={config}>
    //   <QueryClientProvider client={queryClient}>
    //     <RainbowKitProvider>
    //       {children}
    //     </RainbowKitProvider>
    //   </QueryClientProvider>
    // </WagmiProvider>


    <SequenceConnect config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SequenceConnect>
  );
};

export default WalletProvider;
