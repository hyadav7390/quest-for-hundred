
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface NewGameConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const NewGameConfirmation = ({ isOpen, onConfirm, onCancel }: NewGameConfirmationProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Start New Game?</DialogTitle>
          <DialogDescription className="text-gray-300">
            You have already started playing this game. Starting a new game will lose your current progress and game state.
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
            className="bg-gradient-to-r from-accent-main to-blue-600 hover:from-accent-main/90 hover:to-blue-600/90"
          >
            Start New Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewGameConfirmation;
