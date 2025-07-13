import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { NUNUGT_TOKEN } from '@/config';

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
  return address.slice(0, 8) + '....' + address.slice(-8);
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
  <Card className="rounded-lg shadow-lg bg-surface border border-accent-main/20">
    <CardHeader className="p-4 pb-2">
      <CardTitle className="text-text-high">Wallet</CardTitle>
      <CardDescription className="text-text-low">Manage your wallet and balances</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4 p-4 pt-2">
      {currentWallet ? (
        <div className="bg-surface border border-accent-main/10 rounded-lg p-4 text-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-low">Embedded Wallet</span>
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
            className="mb-2 text-xs font-mono bg-surface border-accent-main/20 cursor-pointer text-text-high text-center"
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
      ) : (
        <div className="text-center text-text-low py-4">No embedded wallet found. Please reconnect.</div>
      )}
      {/* Disconnect button */}
      <Button
        size="sm"
        variant="destructive"
        className="w-full mt-1 bg-danger/90 text-white hover:bg-danger"
        onClick={logout}
      >
        Disconnect
      </Button>
    </CardContent>
  </Card>
);

export default WalletPopover; 