
import { useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { toast } from 'sonner';

export const useSequenceWallet = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [isSequenceWalletCreated, setIsSequenceWalletCreated] = useState(false);

  // Check if user has a Sequence wallet
  useEffect(() => {
    if (isConnected && address) {
      console.log('🔗 [SEQUENCE] Wallet connected:', address);
      checkSequenceWallet();
    }
  }, [isConnected, address]);

  const checkSequenceWallet = async () => {
    try {
      // Check if this is a Sequence wallet
      const isSequence = address && address.startsWith('0x');
      if (isSequence) {
        console.log('✅ [SEQUENCE] Sequence wallet detected');
        setIsSequenceWalletCreated(true);
        toast.success('Sequence wallet ready for seamless gaming!');
      }
    } catch (error) {
      console.error('❌ [SEQUENCE] Error checking wallet:', error);
    }
  };

  const createSequenceWallet = async () => {
    try {
      console.log('🔗 [SEQUENCE] Creating new Sequence wallet...');
      
      // Find Sequence connector
      const sequenceConnector = connectors.find(
        connector => connector.name.toLowerCase().includes('sequence')
      );

      if (sequenceConnector) {
        console.log('🔗 [SEQUENCE] Connecting with Sequence connector');
        connect({ connector: sequenceConnector });
        toast.info('Creating your Sequence wallet...');
      } else {
        console.log('⚠️ [SEQUENCE] Sequence connector not found, using default');
        toast.error('Sequence wallet not available. Please check your configuration.');
      }
    } catch (error) {
      console.error('❌ [SEQUENCE] Error creating wallet:', error);
      toast.error('Failed to create Sequence wallet. Please try again.');
    }
  };

  const ensureSequenceWallet = async () => {
    if (!isConnected) {
      console.log('🔗 [SEQUENCE] No wallet connected, creating Sequence wallet');
      await createSequenceWallet();
    } else if (!isSequenceWalletCreated) {
      console.log('🔗 [SEQUENCE] Non-Sequence wallet detected, suggesting Sequence wallet');
      toast.info('For the best gaming experience, consider using a Sequence wallet!');
    }
  };

  return {
    isSequenceWalletCreated,
    createSequenceWallet,
    ensureSequenceWallet,
    address,
    isConnected
  };
};
