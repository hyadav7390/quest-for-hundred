
import { motion, AnimatePresence } from 'framer-motion';
import { User, Coins, Trophy, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useContract } from '@/hooks/useContract';
import CrawlingCharacter from './CrawlingCharacter';

const ContractUserProfile = () => {
  const { gameState, gameStats } = useContract();
  const playerScore = gameState?.gameScore || 0;
  const gamesCompleted = gameStats?.gamesCompleted || 0;
  const totalNunuEarned = gameStats?.totalNunuEarned || 0;
  const hasFinished = gameState?.hasFinished;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          className="p-2 rounded-full bg-surface shadow-glow border-2 border-accent-main/60 hover:shadow-[0_0_16px_4px_#00aaff99] transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.97 }}
        >
          <CrawlingCharacter isMoving={false} />
        </motion.button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-surface border-2 border-accent-main/40 rounded-2xl shadow-2xl p-0 overflow-hidden animate-glow">
        <div className="relative bg-gradient-to-br from-surface via-surface to-accent-main/10 p-0">
          {/* Glowing Header */}
          <motion.div
            className="flex flex-col items-center py-6 border-b border-accent-main/20 bg-surface/80"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-6 h-6 text-accent-main animate-pulse" />
              <h3 className="text-xl font-heading font-bold text-accent-main drop-shadow-glow tracking-wide animate-glow">On-Chain Profile</h3>
            </div>
            <p className="text-xs text-text-low">Data from Smart Contract</p>
          </motion.div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 gap-4 px-6 py-5">
            <motion.div
              className="flex flex-col items-center bg-gradient-to-br from-accent-main/10 to-surface border-2 border-accent-main/30 rounded-xl py-4 shadow-glow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="text-sm text-text-low mb-1">Current Game Score</span>
              <motion.span
                className="text-3xl font-bold text-accent-main font-heading drop-shadow-glow"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {playerScore.toLocaleString()}
              </motion.span>
            </motion.div>
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                className="flex flex-col items-center bg-gradient-to-br from-green-500/10 to-surface border-2 border-green-500/30 rounded-xl py-3 shadow-glow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Trophy className="w-5 h-5 text-green-400 mb-1 animate-pulse" />
                <span className="text-xs text-text-low">Games Completed</span>
                <span className="text-lg font-bold text-green-400 font-heading">{gamesCompleted.toLocaleString()}</span>
              </motion.div>
              <motion.div
                className="flex flex-col items-center bg-gradient-to-br from-blue-500/10 to-surface border-2 border-accent-main/30 rounded-xl py-3 shadow-glow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Coins className="w-5 h-5 text-accent-main mb-1 animate-pulse" />
                <span className="text-xs text-text-low">Total NUNU Earned</span>
                <span className="text-lg font-bold text-accent-main font-heading">{totalNunuEarned.toLocaleString()}</span>
              </motion.div>
            </div>
          </div>

          {/* Game Completed Banner */}
          <AnimatePresence>
            {hasFinished && (
              <motion.div
                className="bg-gradient-to-r from-green-400/90 to-accent-main/80 rounded-b-2xl py-4 px-6 text-center border-t-2 border-accent-main/30 flex flex-col items-center gap-2 shadow-glow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4 }}
              >
                <Trophy className="w-6 h-6 text-white animate-bounce mb-1" />
                <span className="text-base font-bold text-white drop-shadow-glow">🎉 Game Completed!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ContractUserProfile;
