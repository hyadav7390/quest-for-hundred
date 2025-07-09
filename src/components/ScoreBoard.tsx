
import { motion } from 'framer-motion';
import { Trophy, Target, Gift, DoorClosed, Dices, Volume2, VolumeX, TrendingUp, TrendingDown } from 'lucide-react';

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
      className="card-surface"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-heading font-bold text-text-high">Game Stats</h2>
        <motion.button
          onClick={onToggleSound}
          className="p-2 rounded-lg bg-surface-2 hover:bg-accent-main/20 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSoundMuted ? (
            <VolumeX className="w-5 h-5 text-text-low" />
          ) : (
            <Volume2 className="w-5 h-5 text-accent-main" />
          )}
        </motion.button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-2 rounded-lg p-3 text-center border border-accent-main/20">
          <Trophy className="w-8 h-8 text-success mx-auto mb-3" />
          <p className="text-sm text-text-low">Score</p>
          <p className="text-2xl font-bold text-text-high">{score}</p>
        </div>

        <div className="bg-surface-2 rounded-lg p-3 text-center border border-accent-main/20">
          <Dices className="w-8 h-8 text-danger mx-auto mb-3" />
          <p className="text-sm text-text-low">Dice Rolled</p>
          <p className="text-2xl font-bold text-text-high">{displayDiceRolls}</p>
        </div>

        <div className="bg-surface-2 rounded-lg p-3 text-center border border-accent-main/20">
          <Gift className="w-8 h-8 text-success mx-auto mb-3" />
          <p className="text-sm text-text-low">Gifts</p>
          <p className="text-2xl font-bold text-text-high">{displayGifts}</p>
        </div>
        
        <div className="bg-surface-2 rounded-lg p-3 text-center border border-accent-main/20">
          <Target className="w-8 h-8 text-warn mx-auto mb-3" />
          <p className="text-sm text-text-low">Position</p>
          <p className="text-2xl font-bold text-text-high">{position}/100</p>
        </div>
        
        <div className="bg-surface-2 rounded-lg p-3 text-center border border-accent-main/20">
          <TrendingDown className="w-8 h-8 text-danger mx-auto mb-3" />
          <p className="text-sm text-text-low">Detours</p>
          <p className="text-2xl font-bold text-text-high">{displayDetours}</p>
        </div>
        
        <div className="bg-surface-2 rounded-lg p-3 text-center border border-accent-main/20">
          <TrendingUp className="w-8 h-8 text-success mx-auto mb-3" />
          <p className="text-sm text-text-low">Shortcuts</p>
          <p className="text-2xl font-bold text-text-high">{displayShortcuts}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ScoreBoard;
