// src/components/SendMonadModal.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { parseEther } from 'viem/utils';

interface SendMonadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (recipient: string, amount: string) => void;
}

const SendMonadModal: React.FC<SendMonadModalProps> = ({ isOpen, onClose, onSend }) => {
  const [recipient, setRecipient] = React.useState('');
  const [amount, setAmount] = React.useState('');

  const handleSendMonad = () => {
    // console.log('recipient', recipient, amount);
    // if (!recipient || !amount) {
    //   toast.error('Please enter recipient address and amount');
    //   return;
    // }
    onSend(recipient, amount);
    onClose(); // Close the modal after sending
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Send Monad</CardTitle>
          <CardDescription>Transfer MONAD to another address</CardDescription>
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
              <Label htmlFor="amount">Amount (MON)</Label>
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
            <Button onClick={handleSendMonad} className="w-full">
              Send MON
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

export default SendMonadModal;