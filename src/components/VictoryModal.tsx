import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Gift, Target, TrendingDown, ArrowUp, TrendingUp, Coins } from 'lucide-react';

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
  onClaimRewards?: () => void;
  showClaimButton?: boolean;
  // New props from contract
  diceRolls?: number;
  shortcuts?: number;
  detours?: number;
  isRestarting?: boolean;
  isClaimRewardsPending?: boolean;
  claimRewardsError?: string | null;
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
  isRestarting = false,
  isClaimRewardsPending = false,
  claimRewardsError = null,
}: VictoryModalProps) => {
  if (!isOpen) return null;

  // Use contract values if available, otherwise fall back to UI state
  const displayDiceRolls = diceRolls ?? turnsPlayed;
  const displayGifts = giftsCollected;
  const displayShortcuts = shortcuts ?? shortcutGatesTriggered;
  const displayDetours = detours ?? detourTrapsTriggered;

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
          <p className="text-yellow-400 font-bold">+ 1000 NUNU Coins Bonus!</p>
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
                <div className="text-xs text-gray-300">NUNU Coins</div>
                <div className="text-yellow-400 font-bold">{nunuCoins}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">Dice Rolls: {displayDiceRolls}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">Gifts: {displayGifts}</span>
              </div>

              <div className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-gray-300">Detours: {displayDetours}</span>
              </div>

              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Shortcuts: {displayShortcuts}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <motion.button
            onClick={onRestart}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
            whileHover={{ scale: isRestarting ? 1 : 1.02 }}
            whileTap={{ scale: isRestarting ? 1 : 0.98 }}
            disabled={isRestarting}
          >
            <div className="flex items-center justify-center space-x-2">
              <RotateCcw className="w-4 h-4" />
              <span>{isRestarting ? 'Starting...' : 'Play Again'}</span>
            </div>
          </motion.button>

          {isClaimRewardsPending && (
            <div className="w-full py-3 text-center text-yellow-400 font-semibold bg-yellow-900/20 rounded-lg">
              Claiming rewards in progress...
            </div>
          )}

          {claimRewardsError && onClaimRewards && !isClaimRewardsPending && (
            <motion.button
              onClick={onClaimRewards}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
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
