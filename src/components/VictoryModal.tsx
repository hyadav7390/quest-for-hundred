
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Gift, Target, DoorClosed, ArrowUp } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  score: number;
  turnsPlayed: number;
  giftsCollected: number;
  detourTrapsTriggered: number;
  shortcutGatesTriggered: number;
  gameScore: number;
  giftScore: number;
  onRestart: () => void;
}

const VictoryModal = ({ 
  isOpen, 
  score, 
  turnsPlayed, 
  giftsCollected, 
  detourTrapsTriggered,
  shortcutGatesTriggered,
  gameScore,
  giftScore,
  onRestart 
}: VictoryModalProps) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-600"
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="text-center mb-6">
          <motion.div
            className="inline-block p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-white mb-2">Congratulations!</h2>
          <p className="text-gray-300">You've reached tile 100!</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-white">Final Score</span>
              <span className="text-2xl font-bold text-yellow-400">{score}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-600 rounded p-2">
                <div className="text-xs text-gray-300">Game Score</div>
                <div className="text-white font-bold">{gameScore}</div>
              </div>
              
              <div className="bg-gray-600 rounded p-2">
                <div className="text-xs text-gray-300">Gift Score</div>
                <div className="text-yellow-400 font-bold">{giftScore}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">Turns: {turnsPlayed}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">Gifts: {giftsCollected}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <DoorClosed className="w-4 h-4 text-red-400" />
                <span className="text-gray-300">Traps: {detourTrapsTriggered}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <ArrowUp className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Gates: {shortcutGatesTriggered}</span>
              </div>
            </div>
          </div>
        </div>

        <motion.button
          onClick={onRestart}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Play Again
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default VictoryModal;
