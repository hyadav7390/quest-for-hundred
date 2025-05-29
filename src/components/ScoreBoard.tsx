
import { motion } from 'framer-motion';
import { Trophy, Target, Gift, DoorClosed, Dices, Volume2, VolumeX } from 'lucide-react';

interface ScoreBoardProps {
  score: number;
  position: number;
  turnsPlayed: number;
  giftsCollected: number;
  detourTrapsTriggered: number;
  shortcutGatesTriggered: number;
  isSoundMuted: boolean;
  onToggleSound: () => void;
}

const ScoreBoard = ({ 
  score, 
  position, 
  turnsPlayed, 
  giftsCollected, 
  detourTrapsTriggered,
  shortcutGatesTriggered,
  isSoundMuted,
  onToggleSound
}: ScoreBoardProps) => {
  return (
    <motion.div
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-600"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-white">Game Stats</h2>
        <motion.button
          onClick={onToggleSound}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSoundMuted ? (
            <VolumeX className="w-5 h-5 text-gray-400" />
          ) : (
            <Volume2 className="w-5 h-5 text-blue-400" />
          )}
        </motion.button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-gray-300">Score</p>
          <p className="text-2xl font-bold text-white">{score}</p>
        </div>

        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <Dices className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-gray-300">Dice Rolled</p>
          <p className="text-2xl font-bold text-white">{turnsPlayed}</p>
        </div>

        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <Gift className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-gray-300">Gifts</p>
          <p className="text-2xl font-bold text-white">{giftsCollected}</p>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <Target className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-gray-300">Position</p>
          <p className="text-2xl font-bold text-white">{position}/100</p>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <DoorClosed className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-gray-300">Detour Traps</p>
          <p className="text-2xl font-bold text-white">{detourTrapsTriggered}</p>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <DoorClosed className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-gray-300">Shortcut Gates</p>
          <p className="text-2xl font-bold text-white">{shortcutGatesTriggered}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ScoreBoard;
