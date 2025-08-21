
import { motion } from 'framer-motion';
import { Trophy, Target, Gift, Dices, Volume2, VolumeX, DoorClosed, TrendingUp, Info, Users } from 'lucide-react';

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
  peers?: number;
  mode?: 'single' | 'multi';
  // New multiplayer stats
  activePlayers?: number;
  joinGameFee?: string;
  peerPositions?: { positions: number[]; counts: number[]; ruggmates: number[] };
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
  detours,
  peers,
  mode = 'single',
  activePlayers,
  joinGameFee,
  peerPositions,
}: ScoreBoardProps) => {
  // Use contract values if available, otherwise fall back to UI state
  const displayDiceRolls = diceRolls ?? turnsPlayed;
  const displayGifts = giftsCollected;
  const displayShortcuts = shortcuts ?? shortcutGatesTriggered;
  const displayDetours = detours ?? detourTrapsTriggered;
  const displayActivePlayers = activePlayers ?? 0;
  const displayJoinGameFee = joinGameFee ? parseFloat(joinGameFee) / 1e18 : 0;

  // Calculate ruggmates from peerPositions data
  const ruggmatesCount = peerPositions?.ruggmates?.reduce((sum, isRuggmate, index) => {
    return sum + (isRuggmate === 1 ? (peerPositions.counts[index] || 0) : 0);
  }, 0) ?? 0;
  
  // Use ruggmates count for potential rewards calculation
  const potentialReward = ruggmatesCount * displayJoinGameFee;
  const totalPrizePool = displayActivePlayers * displayJoinGameFee;

  // Ruggmate messaging system
  const getPeerMessage = (ruggmateCount: number) => {
    if (ruggmateCount === 0) return "No Ruggmates yet. You're rolling solo. 🎲";
    if (ruggmateCount === 1) return "You've got 1 Ruggmate! 🤝";
    if (ruggmateCount === 2) return "2 Ruggmates spotted! 💚";
    return `${ruggmateCount}+ Ruggmates! It's a ruggstorm out there! 🌪️`;
  };

  // Tooltip content
  const tooltips = {
    score: "Total points earned based on dice, gifts, rugs, etc.",
    diceRolled: "More rolls = more chaos",
    position: "Your spot on the board",
    gifts: "Rewards picked up",
    detours: "Lost turns or setbacks",
    shortcuts: "Boost tiles hit",
    ruggmates: "Your ruggmates - players you can share rewards with",
    potentialWin: "Your current eligible prize",
    activePlayers: "Still in the game",
    prizePool: "Total $MON up for grabs"
  };

  const StatCard = ({ icon, label, value, tooltip }: { icon: React.ReactNode; label: string; value: string | number; tooltip: string }) => (
    <div className="group relative bg-surface rounded-lg p-2 sm:p-3 text-center border border-accent-main/20 hover:border-accent-main/40 transition-colors">
      <div className="flex items-center justify-center text-accent-main mb-1 sm:mb-2">
        {icon}
      </div>
      <div className="text-base sm:text-lg font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-white/60 flex items-center justify-center">
        {label}
        <Info className="w-3 h-3 ml-1 text-white/40 group-hover:text-accent-main transition-colors" />
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-surface border border-accent-main/30 rounded-lg text-xs text-white/90 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 max-w-48 text-center">
        {tooltip}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-surface"></div>
      </div>
    </div>
  );

  return (
    <motion.div
      className="panel h-full p-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-base font-heading font-bold text-white">Game Stats</h2>
        <motion.button
          onClick={onToggleSound}
          className="p-1.5 rounded-lg bg-surface hover:bg-surface/80 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSoundMuted ? (
            <VolumeX className="w-3 h-3 text-white/60" />
          ) : (
            <Volume2 className="w-3 h-3 text-accent-main" />
          )}
        </motion.button>
      </div>

      {/* Multiplayer stats */}
      {mode === 'multi' && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3">
            <StatCard 
              icon={<img src='./Monad_Logo.webp' className="w-5 h-5 sm:w-6 sm:h-6 text-accent-main" />} 
              label="Potential Win" 
              value={`${potentialReward} MON`} 
              tooltip={tooltips.potentialWin} 
            />
            <StatCard 
              icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-positive" />} 
              label="Active Players" 
              value={displayActivePlayers} 
              tooltip={tooltips.activePlayers} 
            />
          </div>
          <div className="mt-3 p-3 bg-gradient-to-r from-accent-main/10 to-blue-500/10 border border-accent-main/20 rounded-lg">
            <p className="text-sm text-white/90 text-center font-medium">
              {getPeerMessage(ruggmatesCount)}
            </p>
          </div>
        </>
      )}

      {/* Stats Grid - Different layouts for single vs multiplayer */}
      {mode === 'single' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-3 mt-3">
          <StatCard 
            icon={<Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-positive" />} 
            label="Score" 
            value={score} 
            tooltip={tooltips.score} 
          />
          <StatCard 
            icon={<Dices className="w-5 h-5 sm:w-6 sm:h-6 text-accent-main" />} 
            label="Dice Rolled" 
            value={displayDiceRolls} 
            tooltip={tooltips.diceRolled} 
          />
          <StatCard 
            icon={<Target className="w-5 h-5 sm:w-6 sm:h-6 text-accent-main" />} 
            label="Position" 
            value={`${position}/100`} 
            tooltip={tooltips.position} 
          />
          <StatCard 
            icon={<Gift className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />} 
            label="Gifts" 
            value={displayGifts} 
            tooltip={tooltips.gifts} 
          />
          <StatCard 
            icon={<DoorClosed className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />} 
            label="Detours" 
            value={displayDetours} 
            tooltip={tooltips.detours} 
          />
          <StatCard 
            icon={<DoorClosed className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />} 
            label="Shortcuts" 
            value={displayShortcuts} 
            tooltip={tooltips.shortcuts} 
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-3 mt-3">
          <StatCard 
            icon={<Dices className="w-5 h-5 sm:w-6 sm:h-6 text-accent-main" />} 
            label="Rolled" 
            value={displayDiceRolls} 
            tooltip={tooltips.diceRolled} 
          />
          <StatCard 
            icon={<DoorClosed className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />} 
            label="Detours" 
            value={displayDetours} 
            tooltip={tooltips.detours} 
          />
          <StatCard 
            icon={<DoorClosed className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />} 
            label="Shortcuts" 
            value={displayShortcuts} 
            tooltip={tooltips.shortcuts} 
          />
        </div>
      )}
    </motion.div>
  );
};

export default ScoreBoard;
