import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Gift, Target, TrendingDown, ArrowUp, TrendingUp, Coins, X, DoorClosed } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  score: number;
  turnsPlayed: number;
  giftsCollected: number;
  detourTrapsTriggered: number;
  shortcutGatesTriggered: number;
  gameScore: number;
  nunuCoins: number;
  onRestart: () => void;
  onClaimRewards: () => void;
  showClaimButton?: boolean;
  // New props from contract
  diceRolls?: number;
  shortcuts?: number;
  detours?: number;
  ruggedCount?: number;
  totalRewardWon?: number;
  isRestarting?: boolean;
  isClaimRewardsPending?: boolean;
  claimRewardsError?: string | null;
  claimRewardsSuccess?: boolean;
  canRestart?: boolean; // New prop to control restart availability
  onClose: () => void;
}

const VictoryModal = ({
  isOpen,
  score,
  turnsPlayed,
  giftsCollected,
  detourTrapsTriggered,
  shortcutGatesTriggered,
  gameScore,
  nunuCoins,
  onRestart,
  onClaimRewards,
  showClaimButton = false,
  diceRolls,
  shortcuts,
  detours,
  ruggedCount,
  totalRewardWon,
  isRestarting = false,
  isClaimRewardsPending = false,
  claimRewardsError = null,
  claimRewardsSuccess = false,
  canRestart = true, // Default to true for backwards compatibility
  onClose,
}: VictoryModalProps) => {
  if (!isOpen) return null;

  // Use contract values if available, otherwise fall back to UI state
  const displayDiceRolls = diceRolls ?? turnsPlayed;
  const displayGifts = giftsCollected;
  const displayShortcuts = shortcuts ?? shortcutGatesTriggered;
  const displayDetours = detours ?? detourTrapsTriggered;
  const displayRuggedCount = ruggedCount ?? 0;
  const displayRewardWon = totalRewardWon ?? 0;

  return (
    <motion.div
      className="fixed inset-0 bg-surface/95 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-surface rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-glow border border-accent-main/20 relative"
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Close (X) Button */}
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent-main/10 focus:outline-none focus:ring-2 focus:ring-accent-main"
        >
          <X className="w-5 h-5 text-text-high" />
        </button>
        <div className="text-center mb-6">
          <motion.div
            className="inline-block p-4 bg-gradient-to-r from-accent-main to-success rounded-full mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>

          <h2 className="text-3xl font-bold text-text-high mb-2">Congratulations!</h2>
          <p className="text-text-low">You've reached tile 100!</p>
          <p className="text-accent-main font-bold">+ 1000 NUNU Coins Bonus!</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-surface border border-accent-main/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-text-high">Final Score</span>
              <span className="text-2xl font-bold text-accent-main">{score}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-surface border border-accent-main/10 rounded p-2">
                <div className="text-xs text-text-low">Game Score</div>
                <div className="text-text-high font-bold">{gameScore}</div>
              </div>

              <div className="bg-surface border border-accent-main/10 rounded p-2">
                <div className="text-xs text-text-low">NUNU Coins</div>
                <div className="text-accent-main font-bold">{nunuCoins}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-accent-main" />
                <span className="text-text-low">Dice Rolls: {displayDiceRolls}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4 text-yellow-400" />
                <span className="text-text-low">Gifts: {displayGifts}</span>
              </div>

              <div className="flex items-center space-x-2">
                <DoorClosed className="w-4 h-4 text-red-500" />
                <span className="text-text-low">Detours: {displayDetours}</span>
              </div>

              <div className="flex items-center space-x-2">
                <DoorClosed className="w-4 h-4 text-green-500" />
                <span className="text-text-low">Shortcuts: {displayShortcuts}</span>
              </div>

              {displayRuggedCount > 0 && (
                <div className="flex items-center space-x-2 col-span-2 mt-2">
                  <TrendingDown className="w-4 h-4 text-warning" />
                  <span className="text-text-low">Players Rugged: {displayRuggedCount}</span>
                </div>
              )}

              {displayRewardWon > 0 && (
                <div className="flex items-center space-x-2 col-span-2">
                  <Coins className="w-4 h-4 text-success" />
                  <span className="text-text-low">Reward Won: {displayRewardWon} MON</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <motion.button
            onClick={onRestart}
            className="w-full py-3 bg-gradient-to-r from-accent-main to-success text-white font-bold rounded-lg shadow-lg hover:from-accent-main/80 hover:to-success/80 transition-all duration-200 disabled:opacity-50"
            whileHover={{ scale: isRestarting ? 1 : 1.02 }}
            whileTap={{ scale: isRestarting ? 1 : 0.98 }}
            disabled={isRestarting || !canRestart}
          >
            <div className="flex items-center justify-center space-x-2">
              <RotateCcw className="w-4 h-4" />
              <span>
                {isRestarting 
                  ? 'Starting...' 
                  : !canRestart 
                    ? 'Claim Rewards First' 
                    : 'Play Again'
                }
              </span>
            </div>
          </motion.button>

          {/* Claim Rewards Status Display */}
          {isClaimRewardsPending && !claimRewardsSuccess && (
            <div className="w-full py-3 text-center text-accent-main font-semibold bg-accent-main/10 rounded-lg border border-accent-main/20">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-accent-main border-t-transparent rounded-full animate-spin"></div>
                <span>Claiming Rewards...</span>
              </div>
            </div>
          )}

          {claimRewardsSuccess && (
            <div className="w-full py-3 text-center text-success font-semibold bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center justify-center space-x-2">
                <Coins className="w-4 h-4 text-success" />
                <span>Claimed Successfully!</span>
              </div>
            </div>
          )}

          {claimRewardsError && !isClaimRewardsPending && !claimRewardsSuccess && (
            <motion.button
              onClick={onClaimRewards}
              className="w-full py-3 bg-gradient-to-r from-success to-accent-main text-white font-bold rounded-lg shadow-lg hover:from-success/80 hover:to-accent-main/80 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-center space-x-2">
                <Coins className="w-4 h-4" />
                <span>Claim Rewards</span>
              </div>
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VictoryModal;
