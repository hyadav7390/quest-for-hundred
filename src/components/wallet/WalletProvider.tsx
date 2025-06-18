
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from "./../../config";
import { SequenceConnect } from "@0xsequence/connect";

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
  console.log('🔗 [WALLET] Initializing WalletProvider with Sequence config');
  
  return (
    <SequenceConnect config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SequenceConnect>
  );
};

export default WalletProvider;
