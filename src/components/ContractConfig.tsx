
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const ContractConfig = () => {
  const [contractAddress, setContractAddress] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load saved contract address from localStorage
    const saved = localStorage.getItem('contract_address');
    if (saved) {
      setContractAddress(saved);
    }
  }, []);

  const handleSave = () => {
    if (!contractAddress) {
      toast.error('Please enter a valid contract address');
      return;
    }

    if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    localStorage.setItem('contract_address', contractAddress);
    toast.success('Contract address saved! Please refresh the page.');
    setIsOpen(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied to clipboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white">Contract Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contract Address
            </label>
            <div className="flex space-x-2">
              <Input
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
              {contractAddress && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAddress}
                  className="border-gray-600 hover:border-gray-500"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="text-yellow-400 font-medium mb-2">Important Notes:</h4>
            <ul className="text-sm text-yellow-300 space-y-1">
              <li>• Make sure you're connected to the correct network</li>
              <li>• The contract must be deployed and verified</li>
              <li>• You'll need to refresh the page after saving</li>
              <li>• Keep some ETH for transaction fees</li>
            </ul>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
              Save Configuration
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractConfig;
