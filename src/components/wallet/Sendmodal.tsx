// src/components/SendMonadModal.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { parseEther } from 'viem/utils';
import { TOKEN_SYMBOLS, TokenSymbol } from '@/config';

interface SendMonadModalProps {
  onSend: (recipient: string, amount: string, token: TokenSymbol) => void;
  token: TokenSymbol;
  isOpen: boolean;
  onClose: () => void;
  maxBalance: string;
}

const SendModal: React.FC<SendMonadModalProps> = ({ isOpen, onClose, onSend, token, maxBalance }) => {
  const [recipient, setRecipient] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const parsedMax = parseFloat(maxBalance.replace(/,/g, ''));
  const parsedAmount = parseFloat(amount);
  const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= parsedMax;

  React.useEffect(() => {
    if (amount === '') {
      setError(null);
    } else if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount');
    } else if (parsedAmount > parsedMax) {
      setError('Amount exceeds available balance');
    } else {
      setError(null);
    }
  }, [amount, parsedAmount, parsedMax]);

  const handleSend = () => {
    if (!isAmountValid) return;
    onSend(recipient, amount, token);
    onClose(); // Close the modal after sending
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Send {token}</CardTitle>
          <CardDescription>Transfer {token} to another address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-xs text-gray-400 mb-2">
              Available: <span className="font-mono text-white">{maxBalance} {token}</span>
            </div>
            <div>
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount ({token})</Label>
              <Input
                id="amount"
                type="number"
                step="0.001"
                min="0"
                placeholder="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
            </div>
            <Button onClick={handleSend} className="w-full" disabled={!isAmountValid || !recipient}>
              Send {token}
            </Button>
          </div>
        </CardContent>
        <div className="flex justify-end p-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SendModal;