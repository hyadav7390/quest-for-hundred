import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt, useDisconnect, useReadContract, useWriteContract } from 'wagmi';
import { usePublicClient } from 'wagmi';
import { monadTestnet } from '@/types/monadTestnet';
import { toast } from '@/hooks/use-toast';
import { parseEther, formatEther } from 'viem/utils';
import { NUNUGT_ABI } from '@/abi/nunugtABI';
import { NUNUGT_TOKEN, TOKEN_SYMBOLS, TokenSymbol } from '@/config';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import WalletPopover from '@/components/wallet/WalletPopover';
import DesktopNavigation from '@/components/wallet/DesktopNavigation';
import MobileMenu from '@/components/wallet/MobileMenu';
import MobileMenuButton from '@/components/wallet/MobileMenuButton';
import SendModal from '@/components/wallet/Sendmodal';
import { Home, Gamepad2 } from 'lucide-react';

export function useWalletBalancesAndWithdraw() {
  // Privy hooks
  const { ready, user, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { disconnect } = useDisconnect();
  const { setActiveWallet } = useSetActiveWallet();
  const { address } = useAccount();

  // Wallet sorting and state
  const sortedWallets = useMemo(() => [...wallets].sort((a, b) => (a.connectorType === 'embedded' ? -1 : 1)), [wallets]);
  const [walletIndex, setWalletIndex] = useState(0);
  const currentWallet = sortedWallets[walletIndex] || null;
  const embeddedWalletObj = sortedWallets.find(w => w.connectorType === 'embedded');

  // Withdraw modal state
  const [withdrawModal, setWithdrawModal] = useState<{ open: boolean; address: string | null; token: TokenSymbol }>({ open: false, address: null, token: TOKEN_SYMBOLS.MON });
  const withdrawWallet = withdrawModal.open
    ? sortedWallets.find(w => w.address === withdrawModal.address) || currentWallet
    : currentWallet;

  // Balances for current and withdraw wallets
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
  const nunugtBalance = useMemo(() => {
    if (!nunugtBalanceRaw || !nunugtDecimals) return '0';
    return (Number(nunugtBalanceRaw) / 10 ** Number(nunugtDecimals)).toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, [nunugtBalanceRaw, nunugtDecimals]);

  const { data: withdrawMonBalance } = useBalance({
    address: withdrawWallet?.address as `0x${string}` | undefined,
    chainId: monadTestnet.id,
  });
  const { data: withdrawNunugtBalanceRaw } = useReadContract({
    address: NUNUGT_TOKEN.address as `0x${string}`,
    abi: NUNUGT_ABI,
    functionName: 'balanceOf',
    args: withdrawWallet?.address ? [withdrawWallet.address as `0x${string}`] : undefined,
    query: { enabled: !!withdrawWallet?.address },
  });
  const { data: withdrawNunugtDecimals } = useReadContract({
    address: NUNUGT_TOKEN.address as `0x${string}`,
    abi: NUNUGT_ABI,
    functionName: 'decimals',
    query: { enabled: !!withdrawWallet?.address },
  });
  const withdrawNunugtBalance = useMemo(() => {
    if (!withdrawNunugtBalanceRaw || !withdrawNunugtDecimals) return '0';
    return (Number(withdrawNunugtBalanceRaw) / 10 ** Number(withdrawNunugtDecimals)).toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, [withdrawNunugtBalanceRaw, withdrawNunugtDecimals]);

  // Transaction logic
  const { data: hash, sendTransaction } = useSendTransaction();
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const { isSuccess: isConfirmed, isError: isTxError } = useWaitForTransactionReceipt({ hash: pendingTxHash as `0x${string}` });
  const { writeContract: writeNUNUGTTransfer, data: nunugtTxHash } = useWriteContract();

  // For MON
  useEffect(() => {
    if (hash) setPendingTxHash(hash);
  }, [hash]);
  // For NUNUGT
  useEffect(() => {
    if (nunugtTxHash) setPendingTxHash(nunugtTxHash);
  }, [nunugtTxHash]);
  // Show transaction confirmation
  useEffect(() => {
    if (isConfirmed && pendingTxHash) {
      toast({
        title: 'Transaction confirmed!',
        description: (
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
        ),
      });
      setPendingTxHash(null);
    }
    if (isTxError && pendingTxHash) {
      toast({
        title: 'Transaction failed',
        description: 'Transaction failed. Please try again.',
        variant: 'destructive',
      });
      setPendingTxHash(null);
    }
  }, [isConfirmed, isTxError, pendingTxHash]);

  // Format helpers
  const formatMon = useCallback((data: any) =>
    data ? parseFloat(formatEther(data.value)).toFixed(4) : '0.0000',
  [],);
  const handleCopy = useCallback((address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: 'Address copied!',
      description: 'Address copied!',
    });
  }, []);

  // Navigation
  const navigationItems = useMemo(() => ([
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
  ]), []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isActivePath = useCallback((path: string) => {
    if (path === '/') {
      return window.location.pathname === '/';
    }
    return window.location.pathname.startsWith(path);
  }, []);

  // Withdraw handler
  const handleSend = useCallback(
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

  const handleWithdrawSend = useCallback(
    async (recipient: string, amount: string, token: TokenSymbol) => {
      const withdrawWalletIdx = sortedWallets.findIndex(w => w.address === withdrawModal.address);
      if (withdrawWalletIdx !== -1) {
        if (address?.toLowerCase() !== sortedWallets[withdrawWalletIdx].address.toLowerCase()) {
          await setActiveWallet(sortedWallets[withdrawWalletIdx]);
          await new Promise<void>((resolve) => {
            const check = () => {
              const selected = typeof window !== 'undefined' && window.ethereum && typeof window.ethereum.selectedAddress === 'string'
                ? window.ethereum.selectedAddress.toLowerCase()
                : undefined;
              if (
                (selected === sortedWallets[withdrawWalletIdx].address.toLowerCase()) ||
                (address?.toLowerCase() === sortedWallets[withdrawWalletIdx].address.toLowerCase())
              ) {
                resolve();
              } else {
                setTimeout(check, 100);
              }
            };
            check();
          });
        }
        await handleSend(recipient, amount, token, sortedWallets[withdrawWalletIdx].address);
        if (embeddedWalletObj) {
          setTimeout(() => setActiveWallet(embeddedWalletObj), 2000);
        }
      } else {
        await handleSend(recipient, amount, token, currentWallet?.address);
        if (embeddedWalletObj) {
          setTimeout(() => setActiveWallet(embeddedWalletObj), 2000);
        }
      }
      setWithdrawModal({ open: false, address: null, token });
    },
    [withdrawModal.address, sortedWallets, address, setActiveWallet, currentWallet, handleSend, embeddedWalletObj]
  );

  return {
    currentBalance,
    nunugtBalance,
    withdrawMonBalance,
    withdrawNunugtBalance,
    handleWithdrawSend,
    formatMon,
    pendingTxHash,
    isConfirmed,
    isTxError,
    setWithdrawModal,
    withdrawModal,
    sortedWallets,
    walletIndex,
    setWalletIndex,
    currentWallet,
    embeddedWalletObj,
    handleCopy,
    ready,
    authenticated,
    login,
    logout,
    disconnect,
    setActiveWallet,
    nunugtDecimals,
    address,
    navigationItems,
    isActivePath,
    mobileMenuOpen,
    setMobileMenuOpen,
  };
} 