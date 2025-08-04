
import { motion, AnimatePresence } from 'framer-motion';
import { User, Coins, Trophy, Sparkles, Star } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGame } from '@/hooks/useGame';
import CrawlingCharacter from './CrawlingCharacter';

interface ContractUserProfileProps {
  mode?: 'single' | 'multi';
}

const ContractUserProfile = ({ mode = 'single' }: ContractUserProfileProps) => {
  const { gameState, playerStats } = useGame(mode);
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

          {/* Stats Section (Lifetime) */}
          <div className="grid grid-cols-1 gap-4 px-6 py-5">
            <div className="grid grid-cols-1 gap-4">
              <motion.div
                className="flex flex-col items-center bg-gradient-to-br from-blue-500/10 to-surface border-2 border-accent-main/30 rounded-xl py-4 shadow-glow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Coins className="w-5 h-5 text-accent-main mb-1 animate-pulse" />
                <span className="text-xs text-text-low">Total $ROLL Earned</span>
                <span className="text-lg font-bold text-accent-main font-heading">{playerStats ? playerStats.totalNunuEarned.toLocaleString() : '-'}</span>
              </motion.div>
              <motion.div
                className="flex flex-col items-center bg-gradient-to-br from-purple-500/10 to-surface border-2 border-purple-500/30 rounded-xl py-4 shadow-glow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Star className="w-5 h-5 text-purple-400 mb-1 animate-pulse" />
                <span className="text-xs text-text-low">Highest Score</span>
                <span className="text-lg font-bold text-purple-400 font-heading">{playerStats ? playerStats.highestScore.toLocaleString() : '-'}</span>
              </motion.div>
              <motion.div
                className="flex flex-col items-center bg-gradient-to-br from-green-500/10 to-surface border-2 border-green-500/30 rounded-xl py-4 shadow-glow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Trophy className="w-5 h-5 text-green-400 mb-1 animate-pulse" />
                <span className="text-xs text-text-low">Games Completed</span>
                <span className="text-lg font-bold text-green-400 font-heading">{playerStats ? playerStats.gamesCompleted.toLocaleString() : '-'}</span>
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
