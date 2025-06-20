
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from "./../../config";
import { WagmiProvider } from '@privy-io/wagmi';
import { PrivyProvider } from '@privy-io/react-auth';
import { monadTestnet } from './../../types/monadTestnet';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false
    },
  },
});

interface WalletProviderProps {
  children: React.ReactNode;
}

const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {

  return (
    <PrivyProvider 
      appId='cmc31fcqj012bjo0ljd8oog39' 
      config={{
        supportedChains: [monadTestnet],
        defaultChain: monadTestnet,
        appearance: {
          theme: 'dark',
          accentColor: '#8B5CF6',
          logo: 'https://your-logo-url.com/logo.png'
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
          noPromptOnSignature: true, // This enables auto-signing
        },
        loginMethods: ['email', 'wallet'],
        fundingMethodConfig: {
          moonpay: {
            useSandbox: true,
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};

export default WalletProvider;
