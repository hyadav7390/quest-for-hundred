import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Gamepad2, Menu, X, Wallet, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useAccount, useBalance, useChainId, useSendTransaction, useWaitForTransactionReceipt, useDisconnect, useReadContract, useWriteContract } from 'wagmi';
import { usePublicClient } from 'wagmi';
import { sepolia, mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { monadTestnet } from '@/types/monadTestnet';
import { toast } from 'sonner';
import { parseEther, formatEther } from 'viem/utils';
import SendModal from './Sendmodal';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import LogoButton from './LogoButton';
import DesktopNavigation from './DesktopNavigation';
import WalletPopover from './WalletPopover';
import MobileMenuButton from './MobileMenuButton';
import MobileMenu from './MobileMenu';
import { NUNUGT_ABI } from '@/abi/nunugtABI';
import { NUNUGT_TOKEN, TOKEN_SYMBOLS, TokenSymbol } from '@/config';

const NUNUGT_ADDRESS = NUNUGT_TOKEN.address;
const TOKEN_SYMBOL = NUNUGT_TOKEN.symbol;


const Header = () => {
  console.log('🔄 [HEADER] Component rendering', NUNUGT_TOKEN);

  // Privy hooks
  const { ready, user, authenticated, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  // WAGMI hooks
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { setActiveWallet } = useSetActiveWallet();

  const [embeddedWallet, setEmbeddedWallet] = useState(null);

  // Set embedded wallet as active when available
  useEffect(() => {
    // console.log('🔄 [HEADER] Checking wallets:', { 
    //   walletsReady, 
    //   walletsCount: wallets.length, 
    //   authenticated 
    // });

    if (walletsReady && authenticated && wallets.length > 0) {
      // Find the embedded wallet
      const embedded = wallets.find((wallet) => wallet.connectorType === 'embedded');
      // console.log('🔍 [HEADER] Found embedded wallet:', embedded);

      if (embedded) {
        // console.log('✅ [HEADER] Setting embedded wallet as active');
        setActiveWallet(embedded);
        setEmbeddedWallet(embedded);
      } else {
        // If no embedded wallet, use the first available wallet
        console.log('⚠️ [HEADER] No embedded wallet found, using first wallet');
        setActiveWallet(wallets[0]);
      }
    }
  }, [wallets, walletsReady, authenticated, setActiveWallet]);

  // console.log('📊 [HEADER] Current state:', { 
  //   ready, 
  //   authenticated, 
  //   address, 
  //   isConnected,
  //   walletsCount: wallets.length,
  //   embeddedWallet: !!embeddedWallet
  // });

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
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isTxError } = useWaitForTransactionReceipt({ hash: pendingTxHash as `0x${string}` });

  // Track transaction status
  // const { isLoading: isConfirming, isSuccess: isConfirmed } =
  //   useWaitForTransactionReceipt({
  //     hash,
  //   });

  const publicClient = usePublicClient({ chainId: monadTestnet.id });

  // Sort wallets: embedded first
  const sortedWallets = [...wallets].sort((a, b) => (a.connectorType === 'embedded' ? -1 : 1));
  const [walletIndex, setWalletIndex] = useState(0);
  const currentWallet = sortedWallets[walletIndex] || null;

  const { data: currentBalance } = useBalance({
    address: currentWallet?.address as `0x${string}` | undefined,
    chainId: monadTestnet.id,
  });

  const { data: nunugtBalanceRaw } = useReadContract({
    address: NUNUGT_TOKEN.address as `0x${string}`,
    abi: NUNUGT_ABI,
    functionName: 'balanceOf',
    args: currentWallet?.address ? [currentWallet.address as `0x${string}`] : undefined,
    query: { enabled: !!currentWallet?.address },
  });
  const { data: nunugtDecimals } = useReadContract({
    address: NUNUGT_TOKEN.address as `0x${string}`,
    abi: NUNUGT_ABI,
    functionName: 'decimals',
    query: { enabled: !!currentWallet?.address },
  });
  const nunugtBalance = React.useMemo(() => {
    if (!nunugtBalanceRaw || !nunugtDecimals) return '0';
    return (Number(nunugtBalanceRaw) / 10 ** Number(nunugtDecimals)).toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, [nunugtBalanceRaw, nunugtDecimals]);
  const { writeContract: writeNUNUGTTransfer, data: nunugtTxHash } = useWriteContract();

  const handleSend = React.useCallback(
    (recipient: string, amount: string, token: TokenSymbol, fromAddress?: string) => {
      if (token === TOKEN_SYMBOLS.NUNUGT) {
        if (!nunugtDecimals || !fromAddress) return;
        const value = BigInt(Math.floor(Number(amount) * 10 ** Number(nunugtDecimals)));
        writeNUNUGTTransfer({
          address: NUNUGT_TOKEN.address as `0x${string}`,
          abi: NUNUGT_ABI,
          functionName: 'transfer',
          args: [recipient, value],
          chain: monadTestnet,
          account: fromAddress as `0x${string}`,
        });
      } else {
        sendTransaction({ to: recipient as `0x${string}`, value: parseEther(amount) });
      }
    },
    [nunugtDecimals, writeNUNUGTTransfer, sendTransaction]
  );

  // For MON
  useEffect(() => {
    if (hash) setPendingTxHash(hash);
  }, [hash]);

  // For NUNUGT
  useEffect(() => {
    if (nunugtTxHash) setPendingTxHash(nunugtTxHash);
  }, [nunugtTxHash]);

  // Show transaction confirmation
  React.useEffect(() => {
    if (isConfirmed && pendingTxHash) {
      toast.success(
        <div>
          <p>Transaction confirmed!</p>
          <a
            href={`https://testnet.monvision.io/tx/${pendingTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            View on Monvision
          </a>
        </div>
      );
      setPendingTxHash(null);
    }
    if (isTxError && pendingTxHash) {
      toast.error('Transaction failed. Please try again.');
      setPendingTxHash(null);
    }
  }, [isConfirmed, isTxError, pendingTxHash]);

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

  const [withdrawModal, setWithdrawModal] = useState<{ open: boolean; address: string | null; token: TokenSymbol }>({ open: false, address: null, token: TOKEN_SYMBOLS.MON });

  // Helper to format balance
  const formatMon = (data: any) =>
    data ? parseFloat(formatEther(data.value)).toFixed(4) : '0.0000';

  // Helper to copy address
  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied!');
  };

  // Find embedded wallet for later use
  const embeddedWalletObj = sortedWallets.find(w => w.connectorType === 'embedded');

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
          <LogoButton navigate={navigate} />
          {/* Desktop Navigation */}
          <DesktopNavigation navigationItems={navigationItems} isActivePath={isActivePath} navigate={navigate} />
          {/* Wallet Button & Popover (always visible) */}
          <div className="flex items-center space-x-3">
            {ready && authenticated ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2 px-3 py-2">
                    <Wallet className="w-4 h-4 text-purple-400" />
                    <span>Wallet</span>
                  </Button>
                </PopoverTrigger>
                <WalletPopover
                  currentWallet={currentWallet}
                  currentBalance={currentBalance}
                  sortedWallets={sortedWallets}
                  walletIndex={walletIndex}
                  setWalletIndex={setWalletIndex}
                  handleCopy={handleCopy}
                  setWithdrawModal={setWithdrawModal}
                  logout={logout}
                  disconnect={disconnect}
                  setActiveWallet={setActiveWallet}
                  authenticated={authenticated}
                  ready={ready}
                  formatMon={formatMon}
                  nunugtBalance={nunugtBalance}
                  onWithdrawNUNU={() => setWithdrawModal({ open: true, address: currentWallet?.address ?? null, token: TOKEN_SYMBOLS.NUNUGT })}
                />
              </Popover>
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
          {/* Mobile Menu Button */}
          <MobileMenuButton isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <MobileMenu
            navigationItems={navigationItems}
            isActivePath={isActivePath}
            navigate={navigate}
            setMobileMenuOpen={setMobileMenuOpen}
            ready={ready}
            authenticated={authenticated}
            formatBalance={formatBalance}
            login={login}
            logout={logout}
          />
        )}
        {/* Withdraw Modal (reuse SendMonadModal) */}
        {withdrawModal.open && (
          <SendModal
            isOpen={withdrawModal.open}
            onClose={() => setWithdrawModal({ open: false, address: null, token: withdrawModal.token })}
            onSend={async (recipient, amount, token) => {
              // Find the wallet being used for withdrawal
              const withdrawWallet = sortedWallets.find(w => w.address === withdrawModal.address) || currentWallet;
              let switched = false;
              if (withdrawWallet) {
                // If not already active, set as active and wait for context update
                if (address?.toLowerCase() !== withdrawWallet.address.toLowerCase()) {
                  await setActiveWallet(withdrawWallet);
                  switched = true;
                  // Wait for the wallet context to update
                  await new Promise<void>((resolve) => {
                    const check = () => {
                      const selected = typeof window !== 'undefined' && window.ethereum && typeof window.ethereum.selectedAddress === 'string'
                        ? window.ethereum.selectedAddress.toLowerCase()
                        : undefined;
                      if (
                        (selected === withdrawWallet.address.toLowerCase()) ||
                        (address?.toLowerCase() === withdrawWallet.address.toLowerCase())
                      ) {
                        resolve();
                      } else {
                        setTimeout(check, 100);
                      }
                    };
                    check();
                  });
                }
                // Send transaction, check balance for this wallet
                await handleSend(recipient, amount, token, withdrawWallet.address);
                // Always revert to embedded after a short delay for best UX
                if (embeddedWalletObj) {
                  setTimeout(() => setActiveWallet(embeddedWalletObj), 2000); // 2s delay to allow tx to propagate
                }
              } else {
                await handleSend(recipient, amount, token, currentWallet?.address);
                if (embeddedWalletObj) {
                  setTimeout(() => setActiveWallet(embeddedWalletObj), 2000);
                }
              }
              setWithdrawModal({ open: false, address: null, token });
            }}
            token={withdrawModal.token}
          />
        )}
      </div>
    </motion.header>
  );
};

export default Header;
