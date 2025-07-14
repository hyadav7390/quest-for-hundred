import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Copy, AlertTriangle, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { REWARD_TOKEN } from '@/config';

interface WalletPopoverProps {
  currentWallet: any;
  currentBalance: any;
  handleCopy: (address: string) => void;
  setWithdrawModal: (v: { open: boolean; address: string | null; token: 'MON' | 'NUNUGT' }) => void;
  logout: () => void;
  disconnect: () => void;
  authenticated: boolean;
  ready: boolean;
  formatMon: (data: any) => string;
  nunugtBalance: string;
  onWithdrawNUNU: () => void;
}

const shortenAddress = (address: string) => {
  if (!address) return '';
  return address.slice(0, 6) + '....' + address.slice(-6);
};

const WalletPopover: React.FC<WalletPopoverProps> = ({
  currentWallet,
  currentBalance,
  handleCopy,
  setWithdrawModal,
  logout,
  disconnect,
  authenticated,
  ready,
  formatMon,
  nunugtBalance,
  onWithdrawNUNU
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="rounded-2xl shadow-2xl border-2 border-accent-main/40 bg-gradient-to-br from-surface via-surface to-accent-main/10 p-0 overflow-hidden">
      <div className="flex flex-col items-center py-6 border-b border-accent-main/20 bg-surface/80">
        <motion.div
          className="flex items-center gap-2 mb-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Wallet className="w-6 h-6 text-accent-main animate-pulse" />
          <h3 className="text-xl font-heading font-bold text-accent-main drop-shadow-glow tracking-wide animate-glow">Your Wallet</h3>
        </motion.div>
        <p className="text-xs text-text-low">Manage your wallet and balances</p>
      </div>
      <div className="p-6 space-y-4">
        <AnimatePresence>
          {currentWallet ? (
            <motion.div
              className="flex flex-col gap-4 items-center bg-gradient-to-br from-accent-main/10 to-surface border-2 border-accent-main/30 rounded-xl py-4 px-3 shadow-glow w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {/* Address Row */}
              <div className="flex items-center w-full justify-between mb-2 gap-2">
                <Input
                  className="text-[11px] font-mono bg-surface border-accent-main/20 cursor-pointer text-text-high text-left rounded-lg shadow-inner focus:border-accent-main focus:shadow-glow transition-all px-2 py-1 h-7 flex-1"
                  value={shortenAddress(currentWallet.address)}
                  readOnly
                  onClick={() => handleCopy(currentWallet.address)}
                  style={{ color: 'inherit' }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-text-high hover:text-accent-main ml-1"
                  onClick={() => handleCopy(currentWallet.address)}
                  aria-label="Copy address"
                  asChild={false}
                >
                  <motion.span
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.15 }}
                  >
                    <Copy className="w-4 h-4" />
                  </motion.span>
                </Button>
              </div>
              {/* Balances */}
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1 text-sm text-text-high font-medium bg-accent-main/10 px-3 py-1 rounded-full">
                    <Coins className="w-4 h-4 text-accent-main" />
                    {formatMon(currentBalance)} MON
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-2 py-1 text-xs hover:bg-accent-main/10 hover:text-accent-main focus:text-accent-main rounded-full"
                    onClick={() => setWithdrawModal({ open: true, address: currentWallet.address, token: 'MON' })}
                  >
                    Send
                  </Button>
                </div>
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1 text-sm text-accent-main font-medium bg-accent-main/10 px-3 py-1 rounded-full">
                    <Coins className="w-4 h-4 text-accent-main" />
                    {nunugtBalance} {REWARD_TOKEN.symbol}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-2 py-1 text-xs hover:bg-accent-main/10 hover:text-accent-main focus:text-accent-main rounded-full"
                    onClick={onWithdrawNUNU}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center gap-2 py-8 text-center text-text-low"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <AlertTriangle className="w-8 h-8 text-negative mb-2 animate-bounce" />
              <span className="font-bold text-lg">No embedded wallet found</span>
              <span className="text-xs">Please reconnect to continue</span>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Disconnect button */}
        <Button
          size="sm"
          variant="destructive"
          className="w-full mt-1 bg-danger/90 text-white hover:bg-danger rounded-lg shadow-glow"
          onClick={logout}
        >
          Disconnect
        </Button>
      </div>
    </Card>
  </motion.div>
);

export default WalletPopover; 