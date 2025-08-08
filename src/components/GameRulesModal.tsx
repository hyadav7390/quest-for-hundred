
import { motion } from 'framer-motion';
import { X, Trophy, Gift, Zap, Target, Users, Crown, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'single' | 'multi';
  gameFinishBonus?: number;
  rollFee?: string | null;
}

const GameRulesModal = ({ isOpen, onClose, mode = 'single', gameFinishBonus, rollFee }: GameRulesModalProps) => {
  // Format roll fee (assume value is in wei, convert to MON)
  const formatRollFee = (fee: string | null | undefined) => {
    if (!fee) return '0.001';
    try {
      // 18 decimals for MON (like ETH)
      const mon = (Number(fee) / 1e18).toFixed(2);
      return mon;
    } catch {
      return '0.001';
    }
  };

  const singlePlayerRules = [
    "Roll the dice to move forward on the board",
    "Collect gifts to earn $ROLL coins (50-300 coins each)",
    "Avoid detour traps that move you backward (5-40 tiles)",
    "Find shortcut gates that jump you forward (5-20 tiles)",
    "Reach tile 100 to win and earn 1000 bonus $ROLL coins",
    "Your total score includes movement points + gift coins + completion bonus"
  ];

  const multiplayerRules = [
    "Roll the dice to move forward on the board",
    "Collect gifts to earn $ROLL coins (50-300 coins each)",
    "Avoid detour traps that move you backward (5-40 tiles)",
    "Find shortcut gates that jump you forward (5-20 tiles)",
    "Be the first to reach tile 100 to win the round",
    "If you reach tile 100 first, you 'rugg' all slower players",
    "Rugged players lose their entry fee to the winner",
    `Each dice roll adds ${formatRollFee(rollFee)} MON to $ROLL liquidity pool`
  ];

  const gameRules = mode === 'multi' ? multiplayerRules : singlePlayerRules;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-bg-primary border border-accent-main/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-heading font-bold text-center mb-6 text-accent-main">
            🎲 How to Play {mode === 'multi' ? 'Multiplayer' : 'Single Player'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Game Rules */}
          <div className="panel">
            <h3 className="text-2xl font-heading font-bold text-white mb-6 text-center">
              {mode === 'multi' ? 'Multiplayer Rules' : 'Game Rules'}
            </h3>
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
            {mode === 'single' ? (
              <>
                <div className="bg-surface rounded-xl p-4 text-center border border-positive/30">
                  <Trophy className="w-6 h-6 text-positive mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">{gameFinishBonus ?? 1000}</div>
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
              </>
            ) : (
              <>
                <div className="bg-surface rounded-xl p-4 text-center border border-positive/30">
                  <Crown className="w-6 h-6 text-positive mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">Prize Pool</div>
                  <div className="text-white/60 text-sm">Entry Fees</div>
                </div>
                <div className="bg-surface rounded-xl p-4 text-center border border-accent-main/30">
                  <Coins className="w-6 h-6 text-accent-main mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">{formatRollFee(rollFee)} MON</div>
                  <div className="text-white/60 text-sm">Per Dice Roll</div>
                </div>
                <div className="bg-surface rounded-xl p-4 text-center border border-accent-main/30">
                  <Users className="w-6 h-6 text-accent-main mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">Global</div>
                  <div className="text-white/60 text-sm">Competition</div>
                </div>
              </>
            )}
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
