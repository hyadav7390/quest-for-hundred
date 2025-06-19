
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from "./../../config";
import { WagmiProvider } from '@privy-io/wagmi';
import { PrivyProvider } from '@privy-io/react-auth';

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
    <PrivyProvider appId='cmc31fcqj012bjo0ljd8oog39' config={{
      appearance: {
        // Defaults ['detected_wallets', 'metamask', 'coinbase_wallet', 'rainbow', 'wallet_connect']
        // walletList: ['metamask', 'rainbow', 'wallet_connect']
      },
      // Create embedded wallets for users who don't have a wallet
      // embeddedWallets: {
      //   ethereum: {
      //     createOnLogin: 'users-without-wallets'
      //   }
      // },
      
    }}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};

export default WalletProvider;
