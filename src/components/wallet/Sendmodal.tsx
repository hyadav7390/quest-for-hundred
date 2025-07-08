// src/components/SendMonadModal.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { parseEther } from 'viem/utils';
import { TOKEN_SYMBOLS, TokenSymbol } from '@/config';

interface SendMonadModalProps {
  onSend: (recipient: string, amount: string, token: TokenSymbol) => void;
  token: TokenSymbol;
  isOpen: boolean;
  onClose: () => void;
}

const SendModal: React.FC<SendMonadModalProps> = ({ isOpen, onClose, onSend, token }) => {
  const [recipient, setRecipient] = React.useState('');
  const [amount, setAmount] = React.useState('');

  const handleSend = () => {
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
            </div>
            <Button onClick={handleSend} className="w-full">
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