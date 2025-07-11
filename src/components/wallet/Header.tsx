import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { TOKEN_SYMBOLS } from '@/config';
import { formatEther } from 'viem/utils';
import { useWalletBalancesAndWithdraw } from '@/hooks/useWalletBalancesAndWithdraw';
import LogoButton from './LogoButton';
import ContractUserProfile from '@/components/ContractUserProfile';
import WalletPopover from './WalletPopover';
import SendModal from './Sendmodal';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const Header = () => {
  // Use the custom hook for all wallet, balance, withdrawal, and modal logic
  const hookResult = useWalletBalancesAndWithdraw();
  const {
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
    setMobileMenuOpen
  } = hookResult;

  const navigate = useNavigate();
  const location = useLocation();

  // Format balance for display (for MobileMenu)
  const formatBalance = () => {
    if (!currentBalance) return '0 MON';
    return `${parseFloat(currentBalance.value ? formatEther(currentBalance.value) : '0').toFixed(4)} MON`;
  };

  return (
    <motion.header
      className="bg-surface border-b border-gray-700 sticky top-0 z-40"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <LogoButton navigate={navigate} />
          {/* Desktop Navigation */}
          {/* <DesktopNavigation navigationItems={navigationItems} isActivePath={isActivePath} navigate={navigate} /> */}
          {/* Wallet Button & Popover (always visible) */}
          <div className="flex items-center space-x-3">
            {ready && authenticated ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2 px-3 py-2">
                    <Wallet className="w-4 h-4 text-accent-main" />
                    <span>Wallet</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
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
                </PopoverContent>
              </Popover>
            ) : (
              <button
                className='text-gray-900 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-500'
                onClick={login}
              >
                Connect Wallet
              </button>
            )}
            {/* Contract Profile (desktop and mobile) */}
            <div className="ml-2">
              <ContractUserProfile />
            </div>
          </div>
        </div>
        {/* Withdraw Modal (reuse SendMonadModal) */}
        {withdrawModal.open && (
          <SendModal
            isOpen={withdrawModal.open}
            onClose={() => setWithdrawModal({ open: false, address: null, token: withdrawModal.token })}
            onSend={handleWithdrawSend}
            token={withdrawModal.token}
            maxBalance={withdrawModal.token === TOKEN_SYMBOLS.MON
              ? (withdrawMonBalance ? parseFloat(formatEther(withdrawMonBalance.value)).toFixed(4) : '0.0000')
              : withdrawNunugtBalance}
          />
        )}
      </div>
    </motion.header>
  );
};

export default Header;
