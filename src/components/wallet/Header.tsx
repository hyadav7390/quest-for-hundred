
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Gamepad2, Menu, X } from 'lucide-react';
import React, { useState } from 'react';

import { useAccount, useBalance, useChainId, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { sepolia, mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { monadTestnet } from '@/types/monadTestnet';
import { toast } from 'sonner';
import { parseEther } from 'viem/utils';
import SendMonadModal from './Sendmodal';

import { useOpenConnectModal } from '@0xsequence/connect';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address,
  });

  const {setOpenConnectModal} = useOpenConnectModal();

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
      if (!recipient || !amount) {
        toast.error('Please enter recipient address and amount');
        return;
      }

      // Convert ETH to Wei and send transaction
      sendTransaction({
        to: recipient,
        value: parseEther(amount),
        chainId: monadTestnet.id,
      });
    } catch (error) {
      console.error('Error sending transaction:', error);
      toast.error('Transaction failed. Please try again.');
    }
  };

  // Show transaction confirmation
  React.useEffect(() => {
    if (isConfirmed && hash) {
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
            {isConnected && (
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
          <div className="hidden md:flex items-center space-x-2">
            <button
              className='text-gray-900 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-500'
              onClick={() => setOpenConnectModal(true)}>Connect</button>
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
              {isConnected && (
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
            <div className="pt-4 border-t border-gray-700 mt-4 flex items-center justify-center">
              <button
                className='text-gray-900 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-500'
                onClick={() => setOpenConnectModal(true)}>Connect</button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;
