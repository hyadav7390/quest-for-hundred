import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface QuitAndRejoinConfirmationProps {
  isOpen: boolean;
  isRugged: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const QuitAndRejoinConfirmation = ({ isOpen, isRugged, onConfirm, onCancel }: QuitAndRejoinConfirmationProps) => {
  const getMessage = () => {
    if (isRugged) {
      return "Are you sure you want to quit and rejoin? You will lose your game reward tokens.";
    } else {
      return "Are you sure you want to quit and rejoin? You will lose your entry fee and the game reward tokens.";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Quit and Rejoin?</DialogTitle>
          <DialogDescription className="text-gray-300">
            {getMessage()}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          >
            Quit and Rejoin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuitAndRejoinConfirmation; 