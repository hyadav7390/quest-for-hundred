import { motion } from 'framer-motion';
import { X, Trophy, Gift, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GameRulesModal = ({ isOpen, onClose }: GameRulesModalProps) => {
  const gameFeatures = [
    {
      icon: <Target className="w-8 h-8 text-blue-400" />,
      title: "Race to 100",
      description: "Navigate through 100 tiles in this thrilling board game adventure"
    },
    {
      icon: <Gift className="w-8 h-8 text-yellow-400" />,
      title: "Collect Gifts",
      description: "Discover 12 hidden gifts with varying NUNU coin values (50-300 coins)"
    },
    {
      icon: <Zap className="w-8 h-8 text-green-400" />,
      title: "Unpredictable Journey",
      description: "Face detour traps and find shortcut gates that change your path"
    }
  ];

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🎲 How to Play
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Game Features */}
          <div>
            <h3 className="text-2xl font-bold text-white text-center mb-6">Game Features</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {gameFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h4 className="text-lg font-bold text-white mb-2">{feature.title}</h4>
                  <p className="text-gray-300 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Game Rules */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Game Rules</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {gameRules.map((rule, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-gray-300 text-sm">{rule}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <Trophy className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">1,000</div>
              <div className="text-gray-400 text-sm">Completion Bonus</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <Gift className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">50-300</div>
              <div className="text-gray-400 text-sm">Gift Values</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
              <div className="text-2xl mb-2">🎲</div>
              <div className="text-lg font-bold text-white">100</div>
              <div className="text-gray-400 text-sm">Tiles to Victory</div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 font-bold rounded-xl"
          >
            Got It!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameRulesModal;