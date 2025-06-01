
import React, { useState } from 'react';
import { useAccount, useBalance, useChainId, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { sepolia, mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { monadTestnet } from '@/types/monadTestnet';
import { ConnectButton, Chain } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowDown, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { parseEther } from 'viem/utils';

const Header: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address,
  });
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [showSendForm, setShowSendForm] = useState(false);
  
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
      setShowSendForm(false);
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
    <header className="w-full py-3 px-4 border-b bg-gradient-to-r from-indigo-500/10 to-purple-500/10 shadow-md">
      <div className="container mx-auto flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
            NUNU GAMES
          </Link>
          
          <Link to="/leaderboard" className="hidden sm:flex items-center gap-1 text-sm bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 px-3 py-1 rounded-full transition-all duration-300">
            <Trophy className="w-4 h-4 text-indigo-600" />
            <span className="text-indigo-700">Leaderboard</span>
          </Link>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Wallet Connection Button */}
          <ConnectButton />
          
          {/* Send MON Button (only visible when connected) */}
          {isConnected && (
            <Button 
              variant="outline"
              onClick={() => setShowSendForm(!showSendForm)}
              className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 px-3 py-1 rounded-full transition-all duration-300"
            >
              {showSendForm ? 'Hide' : 'Send MON'}
            </Button>
          )}
        </div>
        
        {/* Send MON Form */}
        {isConnected && showSendForm && (
          <Card className="w-full mt-4 border border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-indigo-700">Send Monad</CardTitle>
              <CardDescription>Transfer MONAD to another address on {getChainName(chainId)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient" className="text-indigo-700">Recipient Address</Label>
                <Input 
                  id="recipient"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="border-indigo-200 focus:border-indigo-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-indigo-700">Amount (MON)</Label>
                <Input 
                  id="amount"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="border-indigo-200 focus:border-indigo-400"
                />
              </div>
              
              <Button
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                onClick={handleSendMonad}
                disabled={isPending || isConfirming || !recipient || !amount}
              >
                {isPending || isConfirming ? (
                  <>
                    <ArrowDown className="animate-bounce h-4 w-4 mr-2" />
                    {isPending ? 'Confirm in Wallet' : 'Processing...'}
                  </>
                ) : (
                  'Send MON'
                )}
              </Button>
              
              {hash && (
                <div className="bg-indigo-50 p-3 rounded-md break-all border border-indigo-200">
                  <p className="text-sm font-medium text-indigo-700">Transaction Hash:</p>
                  <a 
                    href={`https://testnet.monvision.io/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 text-sm transition-colors"
                  >
                    {hash}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </header>
  );
};

export default Header;
