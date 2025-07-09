
import { motion } from 'framer-motion';
import { X, Trophy, Gift, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GameRulesModal = ({ isOpen, onClose }: GameRulesModalProps) => {
  const gameRules = [
    "Roll the dice to move forward on the board",
    "Collect gifts to earn NUNU coins (50-300 coins each)",
    "Avoid detour traps that move you backward (5-40 tiles)",
    "Find shortcut gates that jump you forward (5-20 tiles)",
    "Reach tile 100 to win and earn 1000 bonus NUNU coins",
    "Your total score includes movement points + gift coins + completion bonus"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-bg-primary border border-accent-main/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-heading font-bold text-center mb-6 text-accent-main">
            🎲 How to Play
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Game Rules */}
          <div className="panel">
            <h3 className="text-2xl font-heading font-bold text-white mb-6 text-center">Game Rules</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {gameRules.map((rule, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="bg-accent-main text-bg-primary rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-white/80 text-sm">{rule}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface rounded-xl p-4 text-center border border-positive/30">
              <Trophy className="w-6 h-6 text-positive mx-auto mb-2" />
              <div className="text-lg font-bold text-white">1,000</div>
              <div className="text-white/60 text-sm">Completion Bonus</div>
            </div>
            <div className="bg-surface rounded-xl p-4 text-center border border-accent-main/30">
              <Gift className="w-6 h-6 text-accent-main mx-auto mb-2" />
              <div className="text-lg font-bold text-white">50-300</div>
              <div className="text-white/60 text-sm">Gift Values</div>
            </div>
            <div className="bg-surface rounded-xl p-4 text-center border border-accent-main/30">
              <div className="text-2xl mb-2">🎲</div>
              <div className="text-lg font-bold text-white">100</div>
              <div className="text-white/60 text-sm">Tiles to Victory</div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <Button
            onClick={onClose}
            className="btn-primary px-8 py-3 font-bold rounded-xl"
          >
            Got It!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameRulesModal;
