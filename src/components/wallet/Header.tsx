
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Gamepad2, Menu, X, Wallet } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useAccount, useBalance, useChainId, useSendTransaction, useWaitForTransactionReceipt, useDisconnect } from 'wagmi';
import { sepolia, mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { monadTestnet } from '@/types/monadTestnet';
import { toast } from 'sonner';
import { parseEther, formatEther } from 'viem/utils';
import SendMonadModal from './Sendmodal';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';

const Header = () => {
  console.log('🔄 [HEADER] Component rendering');
  
  // Privy hooks
  const { ready, user, authenticated, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  // WAGMI hooks
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { setActiveWallet } = useSetActiveWallet();

  const [embeddedWallet, setEmbeddedWallet] = useState(null);

  // Force use of embedded wallet only
  useEffect(() => {
    console.log('🔄 [HEADER] Checking wallets:', { 
      walletsReady, 
      walletsCount: wallets.length, 
      authenticated 
    });
    
    if (walletsReady && authenticated && wallets.length > 0) {
      // Find and prioritize the embedded wallet
      const embedded = wallets.find((wallet) => wallet.connectorType === 'embedded');
      console.log('🔍 [HEADER] Found embedded wallet:', embedded);
      
      if (embedded) {
        console.log('✅ [HEADER] Setting embedded wallet as active');
        setActiveWallet(embedded);
        setEmbeddedWallet(embedded);
      } else {
        // If no embedded wallet found, disconnect everything and show error
        console.warn('⚠️ [HEADER] No embedded wallet found, logging out');
        logout();
        toast.error('Embedded wallet required. Please reconnect.');
      }
    }
  }, [wallets, walletsReady, authenticated, setActiveWallet, logout]);

  // Monitor address changes to ensure it's from embedded wallet
  useEffect(() => {
    if (isConnected && address && embeddedWallet) {
      const embeddedAddress = embeddedWallet.address;
      if (address !== embeddedAddress) {
        console.warn('⚠️ [HEADER] Address mismatch - not using embedded wallet');
        logout();
        toast.error('Please use the embedded wallet only.');
      }
    }
  }, [address, isConnected, embeddedWallet, logout]);

  console.log('📊 [HEADER] Current state:', { 
    ready, 
    authenticated, 
    address, 
    isConnected,
    walletsCount: wallets.length,
    embeddedWallet: !!embeddedWallet
  });

  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const chainId = useChainId();
  
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: monadTestnet.id,
  });

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigationItems = [
    {
      label: 'Home',
      path: '/',
      icon: <Home className="w-4 h-4" />,
      show: true
    },
    {
      label: 'Games',
      path: '/games',
      icon: <Gamepad2 className="w-4 h-4" />,
      show: true
    },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Send transaction hook
  const { data: hash, isPending, sendTransaction } = useSendTransaction();

  // Track transaction status
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handleSendMonad = () => {
    try {
      console.log('💸 [HEADER] Initiating send transaction:', { recipient, amount });
      
      if (!recipient || !amount) {
        toast.error('Please enter recipient address and amount');
        return;
      }

      // Check balance before sending
      if (balance && parseEther(amount) > balance.value) {
        toast.error('Insufficient balance for this transaction');
        return;
      }

      // Convert ETH to Wei and send transaction
      sendTransaction({
        to: recipient,
        value: parseEther(amount),
        chainId: monadTestnet.id,
      });
    } catch (error) {
      console.error('❌ [HEADER] Error sending transaction:', error);
      toast.error('Transaction failed. Please try again.');
    }
  };

  // Show transaction confirmation
  React.useEffect(() => {
    if (isConfirmed && hash) {
      console.log('✅ [HEADER] Transaction confirmed:', hash);
      toast.success(
        <div>
          <p>Transaction confirmed!</p>
          <a
            href={`https://testnet.monvision.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            View on Monvision
          </a>
        </div>
      );

      // Reset form
      setRecipient('');
      setAmount('');
      setIsModalOpen(false);
    }
  }, [isConfirmed, hash]);

  // Get chain name from chainId
  const getChainName = (id: number | undefined) => {
    if (!id) return 'Unknown';
    if (id === sepolia.id) return 'Sepolia';
    if (id === mainnet.id) return 'Ethereum';
    if (id === arbitrum.id) return 'Arbitrum';
    if (id === base.id) return 'Base';
    if (id === polygon.id) return 'Polygon';
    if (id === optimism.id) return 'Optimism';
    if (id === monadTestnet.id) return 'Monad';
    return 'Unknown Network';
  };

  // Format balance for display
  const formatBalance = () => {
    if (isBalanceLoading) return 'Loading...';
    if (!balance) return '0 MON';
    return `${parseFloat(formatEther(balance.value)).toFixed(4)} MON`;
  };

  const handleLogout = () => {
    console.log('🔌 [HEADER] Disconnecting wallet and clearing state');
    setEmbeddedWallet(null);
    logout();
    // Navigate to home to clear any game state
    navigate('/');
  };

  return (
    <motion.header
      className="bg-gray-900 border-b border-gray-700 sticky top-0 z-40"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.button
            onClick={() => navigate('/')}
            className="text-2xl font-bold text-white hover:text-purple-400 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🎮 NUNU GAMES
          </motion.button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems
              .filter(item => item.show)
              .map((item) => (
                <Button
                  key={item.path}
                  variant={isActivePath(item.path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 ${isActivePath(item.path)
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    } transition-all duration-200`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Button>
              ))}
            {isConnected && embeddedWallet && (
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 px-2 transition-all duration-300"
              >
                {'Send MON'}
              </Button>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {ready && authenticated && embeddedWallet ? (
              <>
                {/* Balance Display */}
                <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">{formatBalance()}</span>
                </div>
                
                {/* Address Display */}
                <div className="text-gray-300 text-sm">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'No Address'}
                </div>
                
                <button
                  className='text-gray-900 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-500'
                  onClick={handleLogout}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                className='text-gray-900 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-500'
                onClick={() => {
                  console.log('🔌 [HEADER] Connecting wallet');
                  login();
                }}
              >
                Connect Wallet
              </button>
            )}
          </div>

          <SendMonadModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSend={handleSendMonad}
          />

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden border-t border-gray-700 py-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="flex flex-col space-y-2">
              {navigationItems
                .filter(item => item.show)
                .map((item) => (
                  <Button
                    key={item.path}
                    variant={isActivePath(item.path) ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-start space-x-2 w-full ${isActivePath(item.path)
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      } transition-all duration-200`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Button>
                ))}

              {/* Send MON Button (only visible when connected) */}
              {isConnected && embeddedWallet && (
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 px-3 py-1 rounded-full transition-all duration-300"
                >
                  {'Send MON'}
                </Button>
              )}
            </nav>

            {/* Mobile Wallet Connection */}
            <div className="pt-4 border-t border-gray-700 mt-4 flex flex-col items-center space-y-2">
              {ready && authenticated && embeddedWallet ? (
                <>
                  {/* Mobile Balance Display */}
                  <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
                    <Wallet className="w-4 h-4 text-purple-400" />
                    <span className="text-white font-medium">{formatBalance()}</span>
                  </div>
                  
                  <button
                    className='text-gray-900 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-500'
                    onClick={handleLogout}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  className='text-gray-900 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-500'
                  onClick={login}
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;
