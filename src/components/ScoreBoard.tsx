
import { motion } from 'framer-motion';
import { Trophy, Target, Gift, RotateCcw } from 'lucide-react';

interface ScoreBoardProps {
  score: number;
  position: number;
  turnsPlayed: number;
  giftsCollected: number;
  bounceBacksTriggered: number;
}

const ScoreBoard = ({ 
  score, 
  position, 
  turnsPlayed, 
  giftsCollected, 
  bounceBacksTriggered 
}: ScoreBoardProps) => {
  return (
    <motion.div
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-600"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Game Stats</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-gray-300">Score</p>
          <p className="text-2xl font-bold text-white">{score}</p>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <p className="text-sm text-gray-300">Position</p>
          <p className="text-2xl font-bold text-white">{position}/100</p>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <Gift className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-gray-300">Gifts</p>
          <p className="text-2xl font-bold text-white">{giftsCollected}</p>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <RotateCcw className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-gray-300">BounceBack</p>
          <p className="text-2xl font-bold text-white">{bounceBacksTriggered}</p>
        </div>
      </div>
      
      <div className="mt-4 bg-gray-700 rounded-lg p-3 text-center">
        <p className="text-sm text-gray-300">Turns Played</p>
        <p className="text-xl font-bold text-white">{turnsPlayed}</p>
      </div>
    </motion.div>
  );
};

export default ScoreBoard;
