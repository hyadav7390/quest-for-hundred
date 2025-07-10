import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { NUNUGT_TOKEN } from '@/config';

interface WalletPopoverProps {
  currentWallet: any;
  currentBalance: any;
  sortedWallets: any[];
  walletIndex: number;
  setWalletIndex: (i: number) => void;
  handleCopy: (address: string) => void;
  setWithdrawModal: (v: { open: boolean; address: string | null; token: 'MON' | 'NUNUGT' }) => void;
  logout: () => void;
  disconnect: () => void;
  setActiveWallet: (w: any) => void;
  authenticated: boolean;
  ready: boolean;
  formatMon: (data: any) => string;
  nunugtBalance: string;
  onWithdrawNUNU: () => void;
}

const shortenAddress = (address: string) => {
  if (!address) return '';
  return address.slice(0, 8) + '....' + address.slice(-8);
};

const WalletPopover: React.FC<WalletPopoverProps> = ({
  currentWallet,
  currentBalance,
  sortedWallets,
  walletIndex,
  setWalletIndex,
  handleCopy,
  setWithdrawModal,
  logout,
  disconnect,
  setActiveWallet,
  authenticated,
  ready,
  formatMon,
  nunugtBalance,
  onWithdrawNUNU
}) => (
  <Card className="rounded-lg shadow-lg bg-surface border border-accent-main/20">
    <CardHeader className="p-2">
      <CardTitle className="text-text-high">Wallet{ sortedWallets.length > 1 && ` (2)`}</CardTitle>
      <CardDescription className="text-text-low">Manage your wallets and balances</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4 p-2">
      {currentWallet && (
        <div className="border border-accent-main/10 rounded-lg p-2 bg-surface relative">
          {/* Slider arrows */}
          {sortedWallets.length > 1 && (
            <>
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-bg-primary/80 rounded-full p-1 text-text-high hover:bg-accent-main focus:outline-none"
                onClick={() => setWalletIndex((walletIndex - 1 + sortedWallets.length) % sortedWallets.length)}
                aria-label="Previous wallet"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-bg-primary/80 rounded-full p-1 text-text-high hover:bg-accent-main focus:outline-none"
                onClick={() => setWalletIndex((walletIndex + 1) % sortedWallets.length)}
                aria-label="Next wallet"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-low">
              {currentWallet.connectorType === 'embedded' ? 'Embedded Wallet' : 'External Wallet'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-text-high hover:text-accent-main"
              onClick={() => handleCopy(currentWallet.address)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <Input
            className="mb-2 text-xs font-mono bg-surface border-accent-main/20 cursor-pointer text-text-high"
            value={shortenAddress(currentWallet.address)}
            readOnly
            onClick={() => handleCopy(currentWallet.address)}
            style={{ color: 'inherit' }}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-high font-medium">
              {formatMon(currentBalance)} MON
            </span>
            <Button
              size="sm"
              variant="outline"
              className="px-2 py-1 text-xs hover:bg-accent-main/10 hover:text-accent-main focus:text-accent-main"
              onClick={() => setWithdrawModal({ open: true, address: currentWallet.address, token: 'MON' })}
            >
              Send
            </Button>
          </div>
          {/* NUNU Balance and Withdraw */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-accent-main font-medium">
              {nunugtBalance} {NUNUGT_TOKEN.symbol}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="px-2 py-1 text-xs hover:bg-accent-main/10 hover:text-accent-main focus:text-accent-main"
              onClick={onWithdrawNUNU}
            >
              Send
            </Button>
          </div>
        </div>
      )}
      {/* Common Disconnect button */}
      <Button
        size="sm"
        variant="destructive"
        className="w-full mt-1 bg-danger/90 text-white hover:bg-danger"
        onClick={() => {
          if (currentWallet?.connectorType === 'embedded') {
            logout();
          } else {
            disconnect();
            setActiveWallet(null);
          }
        }}
      >
        Disconnect
      </Button>
    </CardContent>
  </Card>
);

export default WalletPopover; 