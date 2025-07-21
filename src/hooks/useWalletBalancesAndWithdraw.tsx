import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt, useDisconnect, useReadContract, useWriteContract } from 'wagmi';
import { monadTestnet } from '@/types/monadTestnet';
import { toast } from '@/hooks/use-toast';
import { parseEther, formatEther } from 'viem/utils';
import { NATIVE_TOKEN, REWARD_TOKEN, TokenSymbol, REWARD_TOKEN_ABI } from '@/configs';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { Home, Gamepad2 } from 'lucide-react';

export function useWalletBalancesAndWithdraw() {
  // Privy hooks
  const { ready, user, authenticated, login, logout, exportWallet } = usePrivy();
  const { wallets } = useWallets();
  const { disconnect } = useDisconnect();
  const { setActiveWallet } = useSetActiveWallet();
  const { address } = useAccount();

  // Only track the embedded wallet
  const embeddedWalletObj = useMemo(() => wallets.find(w => w.connectorType === 'embedded') || null, [wallets]);

  // If no embedded wallet, treat as disconnected
  const isEmbeddedConnected = !!embeddedWalletObj;

  // Ensure embedded wallet is set as active on reload
  useEffect(() => {
    if (embeddedWalletObj?.address && (embeddedWalletObj && address?.toLowerCase() !== embeddedWalletObj.address.toLowerCase())) {
      setActiveWallet(embeddedWalletObj);
    }
  }, [embeddedWalletObj, address, setActiveWallet]);

  // Withdraw modal state
  const [withdrawModal, setWithdrawModal] = useState<{ open: boolean; address: string | null; token: TokenSymbol }>({ open: false, address: null, token: NATIVE_TOKEN.symbol });
  const withdrawWallet = embeddedWalletObj;

  // Balances for embedded wallet
  const balanceResult = useBalance({
    address: embeddedWalletObj?.address as `0x${string}` | undefined,
    chainId: monadTestnet.id,
  });
  const currentBalance = balanceResult.data;
  const refetchCurrentBalance = balanceResult.refetch;

  const nunugtBalanceResult = useReadContract({
    address: REWARD_TOKEN.address as `0x${string}`,
    abi: REWARD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: embeddedWalletObj?.address ? [embeddedWalletObj.address as `0x${string}`] : undefined,
    query: { enabled: !!embeddedWalletObj?.address },
  });
  const nunugtBalanceRaw = nunugtBalanceResult.data;
  const refetchNunugtBalance = nunugtBalanceResult.refetch;
  const { data: nunugtDecimals } = useReadContract({
    address: REWARD_TOKEN.address as `0x${string}`,
    abi: REWARD_TOKEN_ABI,
    functionName: 'decimals',
    query: { enabled: !!embeddedWalletObj?.address },
  });
  const nunugtBalance = useMemo(() => {
    if (!nunugtBalanceRaw || !nunugtDecimals) return '0';
    return (Number(nunugtBalanceRaw) / 10 ** Number(nunugtDecimals)).toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, [nunugtBalanceRaw, nunugtDecimals]);

  // Withdraw balances (same as embedded wallet)
  const { data: withdrawMonBalance } = useBalance({
    address: embeddedWalletObj?.address as `0x${string}` | undefined,
    chainId: monadTestnet.id,
  });
  const { data: withdrawNunugtBalanceRaw } = useReadContract({
    address: REWARD_TOKEN.address as `0x${string}`,
    abi: REWARD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: embeddedWalletObj?.address ? [embeddedWalletObj.address as `0x${string}`] : undefined,
    query: { enabled: !!embeddedWalletObj?.address },
  });
  const { data: withdrawNunugtDecimals } = useReadContract({
    address: REWARD_TOKEN.address as `0x${string}`,
    abi: REWARD_TOKEN_ABI,
    functionName: 'decimals',
    query: { enabled: !!embeddedWalletObj?.address },
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

  // Withdraw handler (only for embedded wallet)
  const handleSend = useCallback(
    (recipient: string, amount: string, token: TokenSymbol) => {
      if (!embeddedWalletObj) return;
      if (token === REWARD_TOKEN.symbol) {
        if (!nunugtDecimals) return;
        const value = BigInt(Math.floor(Number(amount) * 10 ** Number(nunugtDecimals)));
        writeNUNUGTTransfer({
          address: REWARD_TOKEN.address as `0x${string}`,
          abi: REWARD_TOKEN_ABI,
          functionName: 'transfer',
          args: [recipient, value],
          chain: monadTestnet,
          account: embeddedWalletObj.address as `0x${string}`,
        });
      } else {
        sendTransaction({ to: recipient as `0x${string}`, value: parseEther(amount) });
      }
    },
    [nunugtDecimals, writeNUNUGTTransfer, sendTransaction, embeddedWalletObj]
  );

  const handleWithdrawSend = useCallback(
    async (recipient: string, amount: string, token: TokenSymbol) => {
      if (!embeddedWalletObj) return;
      await handleSend(recipient, amount, token);
      setWithdrawModal({ open: false, address: null, token });
    },
    [handleSend, embeddedWalletObj]
  );

  // Export embedded wallet functionality
  const canExportEmbeddedWallet = ready && authenticated && !!embeddedWalletObj;

  const exportEmbeddedWallet = useCallback(async () => {
    if (!canExportEmbeddedWallet || !embeddedWalletObj?.address) return;
    try {
      await exportWallet({ address: embeddedWalletObj.address });
    } catch (err) {
      toast({
        title: 'Export failed',
        description: 'Could not export embedded wallet. Please try again.',
        variant: 'destructive',
      });
    }
  }, [canExportEmbeddedWallet, embeddedWalletObj, exportWallet]);

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
    embeddedWalletObj,
    handleCopy,
    ready,
    authenticated: authenticated && isEmbeddedConnected,
    login,
    logout,
    disconnect,
    setActiveWallet,
    nunugtDecimals,
    address: embeddedWalletObj?.address,
    navigationItems,
    isActivePath,
    mobileMenuOpen,
    setMobileMenuOpen,
    refetchCurrentBalance,
    refetchNunugtBalance,
    canExportEmbeddedWallet,
    exportEmbeddedWallet,
  };
} 