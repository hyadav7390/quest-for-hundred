
import { motion } from 'framer-motion';
import { Trophy, Target, Gift, TrendingDown, Dices, Volume2, VolumeX, TrendingUp } from 'lucide-react';

interface ScoreBoardProps {
  score: number;
  position: number;
  turnsPlayed: number;
  giftsCollected: number;
  detourTrapsTriggered: number;
  shortcutGatesTriggered: number;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  // New props from contract
  diceRolls?: number;
  shortcuts?: number;
  detours?: number;
}

const ScoreBoard = ({ 
  score, 
  position, 
  turnsPlayed, 
  giftsCollected, 
  detourTrapsTriggered,
  shortcutGatesTriggered,
  isSoundMuted,
  onToggleSound,
  diceRolls,
  shortcuts,
  detours
}: ScoreBoardProps) => {
  // Use contract values if available, otherwise fall back to UI state
  const displayDiceRolls = diceRolls ?? turnsPlayed;
  const displayGifts = giftsCollected;
  const displayShortcuts = shortcuts ?? shortcutGatesTriggered;
  const displayDetours = detours ?? detourTrapsTriggered;

  return (
    <motion.div
      className="panel"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-bold text-white">Game Stats</h2>
        <motion.button
          onClick={onToggleSound}
          className="p-2 rounded-lg bg-surface hover:bg-surface/80 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSoundMuted ? (
            <VolumeX className="w-5 h-5 text-white/60" />
          ) : (
            <Volume2 className="w-5 h-5 text-accent-main" />
          )}
        </motion.button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-lg p-3 text-center border border-accent-main/20">
          <Trophy className="w-8 h-8 text-positive mx-auto mb-2" />
          <p className="text-xs text-white/60">Score</p>
          <p className="text-xl font-bold text-white">{score}</p>
        </div>

        <div className="bg-surface rounded-lg p-3 text-center border border-accent-main/20">
          <Dices className="w-8 h-8 text-accent-main mx-auto mb-2" />
          <p className="text-xs text-white/60">Dice Rolled</p>
          <p className="text-xl font-bold text-white">{displayDiceRolls}</p>
        </div>

        <div className="bg-surface rounded-lg p-3 text-center border border-accent-main/20">
          <Gift className="w-8 h-8 text-positive mx-auto mb-2" />
          <p className="text-xs text-white/60">Gifts</p>
          <p className="text-xl font-bold text-white">{displayGifts}</p>
        </div>
        
        <div className="bg-surface rounded-lg p-3 text-center border border-accent-main/20">
          <Target className="w-8 h-8 text-accent-main mx-auto mb-2" />
          <p className="text-xs text-white/60">Position</p>
          <p className="text-xl font-bold text-white">{position}/100</p>
        </div>
        
        <div className="bg-surface rounded-lg p-3 text-center border border-accent-main/20">
          <TrendingDown className="w-8 h-8 text-negative mx-auto mb-2" />
          <p className="text-xs text-white/60">Detours</p>
          <p className="text-xl font-bold text-white">{displayDetours}</p>
        </div>
        
        <div className="bg-surface rounded-lg p-3 text-center border border-accent-main/20">
          <TrendingUp className="w-8 h-8 text-positive mx-auto mb-2" />
          <p className="text-xs text-white/60">Shortcuts</p>
          <p className="text-xl font-bold text-white">{displayShortcuts}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ScoreBoard;
