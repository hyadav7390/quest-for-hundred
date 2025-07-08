import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PopoverContent } from '@/components/ui/popover';
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
  <PopoverContent className="w-[90vw] max-w-xs sm:w-80 p-0" sideOffset={12} align="center">
    <Card className="shadow-none border-none bg-transparent">
      <CardHeader>
        <CardTitle>Wallet</CardTitle>
        <CardDescription>Manage your wallets and balances</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentWallet && (
          <div className="border rounded-lg p-5 bg-gray-800 relative">
            {/* Slider arrows */}
            {sortedWallets.length > 1 && (
              <>
                <button
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-700/80 rounded-full p-1 text-white hover:bg-purple-600 focus:outline-none"
                  onClick={() => setWalletIndex((walletIndex - 1 + sortedWallets.length) % sortedWallets.length)}
                  aria-label="Previous wallet"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-700/80 rounded-full p-1 text-white hover:bg-purple-600 focus:outline-none"
                  onClick={() => setWalletIndex((walletIndex + 1) % sortedWallets.length)}
                  aria-label="Next wallet"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">
                {currentWallet.connectorType === 'embedded' ? 'Embedded Wallet' : 'External Wallet'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:text-purple-400"
                onClick={() => handleCopy(currentWallet.address)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Input
              className="mb-2 text-xs font-mono bg-gray-900 border-gray-700 cursor-pointer text-white"
              value={currentWallet.address}
              readOnly
              onClick={() => handleCopy(currentWallet.address)}
              style={{ color: 'white' }}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-white font-medium">
                {formatMon(currentBalance)} MON
              </span>
              <Button
                size="sm"
                variant="outline"
                className="px-2 py-1 text-xs"
                onClick={() => setWithdrawModal({ open: true, address: currentWallet.address, token: 'MON' })}
              >
                Send
              </Button>
            </div>
            {/* NUNU Balance and Withdraw */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-purple-200 font-medium">
                {nunugtBalance} {NUNUGT_TOKEN.symbol}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="px-2 py-1 text-xs"
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
          className="w-full mt-1"
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
  </PopoverContent>
);

export default WalletPopover; 