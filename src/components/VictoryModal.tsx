import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Gift, Target, TrendingDown, Coins, DoorClosed, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

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
  gameFinishBonus?: number;
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
  gameFinishBonus,
  isRestarting = false,
  isClaimRewardsPending = false,
  claimRewardsError = null,
  claimRewardsSuccess = false,
  canRestart = true, // Default to true for backwards compatibility
  onClose,
}: VictoryModalProps) => {
  const navigate = useNavigate();
  const [showGameEndFireworks, setShowGameEndFireworks] = useState(false);
  const [showClaimFireworks, setShowClaimFireworks] = useState(false);

  // Trigger game end fireworks when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowGameEndFireworks(true);
      // Stop game end fireworks after 4 seconds
      const timer = setTimeout(() => {
        setShowGameEndFireworks(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Trigger claim fireworks when claim is successful
  useEffect(() => {
    if (claimRewardsSuccess) {
      setShowClaimFireworks(true);
      // Stop claim fireworks after 3 seconds
      const timer = setTimeout(() => {
        setShowClaimFireworks(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [claimRewardsSuccess]);
  
  if (!isOpen) return null;

  // Use contract values if available, otherwise fall back to UI state
  const displayDiceRolls = diceRolls ?? turnsPlayed;
  const displayGifts = giftsCollected;
  const displayShortcuts = shortcuts ?? shortcutGatesTriggered;
  const displayDetours = detours ?? detourTrapsTriggered;
  const displayRuggedCount = ruggedCount ?? 0;
  const displayRewardWon = totalRewardWon ?? 0;

  const handleGoHome = () => {
    navigate('/');
  };

  // Enhanced Fireworks animation component
  const Fireworks = ({ type = 'game-end' }: { type?: 'game-end' | 'claim-success' }) => {
    const colors = type === 'game-end' 
      ? ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
      : ['#00FF88', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
    
    const positions = [
      { x: '20%', y: '30%' },
      { x: '80%', y: '25%' },
      { x: '50%', y: '20%' },
      { x: '15%', y: '40%' },
      { x: '85%', y: '35%' },
      { x: '70%', y: '15%' },
      { x: '30%', y: '10%' },
      { x: '60%', y: '45%' },
    ];

    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
        <AnimatePresence>
          {positions.map((pos, index) => (
            <motion.div
              key={`firework-${index}`}
              className="absolute"
              style={{ left: pos.x, top: pos.y }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                delay: index * 0.3,
                ease: "easeOut"
              }}
            >
              {/* Firework burst */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`particle-${index}-${i}`}
                  className="absolute w-1 h-1 rounded-full"
                  style={{ 
                    backgroundColor: colors[i % colors.length],
                    boxShadow: `0 0 6px ${colors[i % colors.length]}`
                  }}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0,
                    opacity: 1 
                  }}
                  animate={{ 
                    x: Math.cos((i * 30) * Math.PI / 180) * 60,
                    y: Math.sin((i * 30) * Math.PI / 180) * 60,
                    scale: [0, 1, 0],
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: index * 0.3 + 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
              
              {/* Secondary burst */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`secondary-${index}-${i}`}
                  className="absolute w-0.5 h-0.5 rounded-full"
                  style={{ 
                    backgroundColor: colors[(i + 6) % colors.length],
                    boxShadow: `0 0 4px ${colors[(i + 6) % colors.length]}`
                  }}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0,
                    opacity: 1 
                  }}
                  animate={{ 
                    x: Math.cos((i * 45) * Math.PI / 180) * 40,
                    y: Math.sin((i * 45) * Math.PI / 180) * 40,
                    scale: [0, 1, 0],
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 1.2,
                    delay: index * 0.3 + 0.3,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Floating sparkles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute w-1 h-1 rounded-full"
            style={{ 
              backgroundColor: colors[i % colors.length],
              boxShadow: `0 0 4px ${colors[i % colors.length]}`
            }}
            initial={{ 
              x: `${Math.random() * 100}%`, 
              y: '100%', 
              scale: 0,
              opacity: 0 
            }}
            animate={{ 
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 80}%`,
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 bg-surface/95 flex items-center justify-center z-50 p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Fireworks animations */}
      {showGameEndFireworks && <Fireworks type="game-end" />}
      {showClaimFireworks && <Fireworks type="claim-success" />}
      
      <motion.div
        className="bg-surface rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-glow border border-accent-main/20 relative z-50 my-4 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Confetti effect for game end */}
        {showGameEndFireworks && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={`confetti-${i}`}
                className="absolute w-2 h-2 rounded-sm"
                style={{
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 6],
                  left: `${Math.random() * 100}%`,
                  top: '-10px'
                }}
                initial={{ y: -10, rotate: 0, opacity: 1 }}
                animate={{ 
                  y: '100vh',
                  rotate: 360,
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  ease: "easeIn"
                }}
              />
            ))}
          </div>
        )}
        
        <div className="text-center mb-6 relative z-10">
          <motion.div
            className="inline-block p-3 bg-gradient-to-r from-accent-main to-success rounded-full mb-3"
            animate={{ 
              rotate: 360,
              scale: showGameEndFireworks ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              duration: 2, 
              ease: "easeInOut",
              scale: { duration: 0.5, repeat: showGameEndFireworks ? Infinity : 0, repeatType: "reverse" }
            }}
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h2 
            className="text-2xl font-bold text-text-high mb-1"
            animate={{ 
              scale: showGameEndFireworks ? [1, 1.05, 1] : 1,
              textShadow: showGameEndFireworks ? "0 0 20px rgba(255, 215, 0, 0.8)" : "none"
            }}
            transition={{ 
              duration: 0.5, 
              repeat: showGameEndFireworks ? Infinity : 0, 
              repeatType: "reverse" 
            }}
          >
            Congratulations!
          </motion.h2>
          <p className="text-text-low text-sm mb-1">You've reached tile 100!</p>
          <motion.p 
            className="text-accent-main font-bold text-base"
            animate={{ 
              scale: showGameEndFireworks ? [1, 1.1, 1] : 1,
              textShadow: showGameEndFireworks ? "0 0 15px rgba(0, 170, 255, 0.8)" : "none"
            }}
            transition={{ 
              duration: 0.8, 
              repeat: showGameEndFireworks ? Infinity : 0, 
              repeatType: "reverse" 
            }}
          >
            + {gameFinishBonus ?? 0} $ROLL Coins Bonus!
          </motion.p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Final Score Section - Compact */}
          <div className="bg-gradient-to-r from-accent-main/10 to-success/10 border border-accent-main/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-text-high">Final Score</span>
              <span className="text-2xl font-bold text-accent-main">{score}</span>
            </div>
            
            <div className="bg-surface/50 border border-accent-main/10 rounded-lg p-2">
              <div className="text-xs text-text-low">Game Score</div>
              <div className="text-base font-bold text-text-high">{gameScore}</div>
            </div>
          </div>

          {/* Game Statistics Section - Compact Grid */}
          <div className="bg-surface border border-accent-main/10 rounded-xl p-4">
            <h3 className="text-base font-semibold text-text-high mb-3">Game Statistics</h3>
            
            <div className="grid grid-cols-2 gap-2">
              {/* Players Rugged - Highlighted if > 0 */}
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                displayRuggedCount > 0 
                  ? 'bg-warning/10 border-warning/30 shadow-sm' 
                  : 'bg-surface/50 border-accent-main/10'
              }`}>
                <div className="flex items-center space-x-2">
                  <TrendingDown className={`w-4 h-4 ${displayRuggedCount > 0 ? 'text-warning' : 'text-accent-main'}`} />
                  <span className="text-xs font-medium text-text-high">Players Rugged</span>
                </div>
                <span className={`text-sm font-bold ${displayRuggedCount > 0 ? 'text-warning' : 'text-text-high'}`}>
                  {displayRuggedCount}
                </span>
              </div>

              {/* Total Reward Won - Highlighted if > 0 */}
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                displayRewardWon > 0 
                  ? 'bg-success/10 border-success/30 shadow-sm' 
                  : 'bg-surface/50 border-accent-main/10'
              }`}>
                <div className="flex items-center space-x-2">
                  <Coins className={`w-4 h-4 ${displayRewardWon > 0 ? 'text-success' : 'text-accent-main'}`} />
                  <span className="text-xs font-medium text-text-high">Reward Won</span>
                </div>
                <span className={`text-sm font-bold ${displayRewardWon > 0 ? 'text-success' : 'text-text-high'}`}>
                  {displayRewardWon ? (displayRewardWon / 1e18).toFixed(2) : 0} MON
                </span>
              </div>

              {/* $ROLL Coins - Highlighted if > 0 */}
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                nunuCoins > 0 
                  ? 'bg-accent-main/10 border-accent-main/30 shadow-sm' 
                  : 'bg-surface/50 border-accent-main/10'
              }`}>
                <div className="flex items-center space-x-2">
                  <Coins className={`w-4 h-4 ${nunuCoins > 0 ? 'text-accent-main' : 'text-accent-main'}`} />
                  <span className="text-xs font-medium text-text-high">$ROLL Coins</span>
                </div>
                <span className={`text-sm font-bold ${nunuCoins > 0 ? 'text-accent-main' : 'text-text-high'}`}>
                  {nunuCoins}
                </span>
              </div>

              {/* Dice Rolls */}
              <div className="p-2 bg-surface/50 border border-accent-main/10 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-accent-main" />
                  <span className="text-xs text-text-low">Dice Rolls</span>
                </div>
                <span className="text-sm font-semibold text-text-high">{displayDiceRolls}</span>
              </div>

              {/* Gifts */}
              <div className="p-2 bg-surface/50 border border-accent-main/10 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Gift className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-text-low">Gifts</span>
                </div>
                <span className="text-sm font-semibold text-text-high">{displayGifts}</span>
              </div>

              {/* Detours */}
              <div className="p-2 bg-surface/50 border border-accent-main/10 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DoorClosed className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-text-low">Detours</span>
                </div>
                <span className="text-sm font-semibold text-text-high">{displayDetours}</span>
              </div>

              {/* Shortcuts */}
              <div className="p-2 bg-surface/50 border border-accent-main/10 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DoorClosed className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-text-low">Shortcuts</span>
                </div>
                <span className="text-sm font-semibold text-text-high">{displayShortcuts}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <motion.button
            onClick={onRestart}
            className="w-full py-3 bg-gradient-to-r from-accent-main to-success text-white font-bold rounded-xl shadow-lg hover:from-accent-main/80 hover:to-success/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: (isRestarting || isClaimRewardsPending) ? 1 : 1.02 }}
            whileTap={{ scale: (isRestarting || isClaimRewardsPending) ? 1 : 0.98 }}
            disabled={isRestarting || !canRestart || isClaimRewardsPending}
          >
            <div className="flex items-center justify-center space-x-2">
              <RotateCcw className="w-4 h-4" />
              <span className="text-base">
                {isRestarting 
                  ? 'Starting New Game...' 
                  : !canRestart 
                    ? 'Claim Rewards First' 
                    : 'Play Again'
                }
              </span>
            </div>
          </motion.button>

          <motion.button
            onClick={handleGoHome}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:from-blue-500/80 hover:to-purple-600/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isClaimRewardsPending ? 1 : 1.02 }}
            whileTap={{ scale: isClaimRewardsPending ? 1 : 0.98 }}
            disabled={isClaimRewardsPending}
          >
            <div className="flex items-center justify-center space-x-2">
              <Home className="w-4 h-4" />
              <span className="text-base">Go to Home</span>
            </div>
          </motion.button>

          {/* Claim Rewards Status Display */}
          {isClaimRewardsPending && !claimRewardsSuccess && (
            <motion.div 
              className="w-full py-3 text-center text-accent-main font-semibold bg-accent-main/10 rounded-xl border border-accent-main/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-accent-main border-t-transparent rounded-full animate-spin"></div>
                <span className="text-base">Claiming Rewards...</span>
              </div>
              <p className="text-xs text-accent-main/70 mt-1">Please wait while we process your rewards</p>
            </motion.div>
          )}

          {claimRewardsSuccess && (
            <motion.div 
              className="w-full py-3 text-center text-success font-semibold bg-success/10 rounded-xl border border-success/20 relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              {/* Success sparkles */}
              {showClaimFireworks && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={`success-sparkle-${i}`}
                      className="absolute w-1 h-1 bg-success rounded-full"
                      style={{
                        left: `${20 + (i * 10)}%`,
                        top: '50%'
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        y: [-10, -20, -30]
                      }}
                      transition={{
                        duration: 1,
                        delay: i * 0.1,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-center space-x-2 relative z-10">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: showClaimFireworks ? [1, 1.2, 1] : 1
                  }}
                  transition={{ 
                    duration: 1, 
                    ease: "easeInOut",
                    scale: { duration: 0.3, repeat: showClaimFireworks ? Infinity : 0, repeatType: "reverse" }
                  }}
                >
                  <Coins className="w-4 h-4 text-success" />
                </motion.div>
                <motion.span
                  className="text-base"
                  animate={{ 
                    textShadow: showClaimFireworks ? "0 0 10px rgba(34, 197, 94, 0.8)" : "none"
                  }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: showClaimFireworks ? Infinity : 0, 
                    repeatType: "reverse" 
                  }}
                >
                  Rewards Claimed Successfully!
                </motion.span>
              </div>
              <p className="text-xs text-success/70 mt-1">Your tokens have been sent to your wallet</p>
            </motion.div>
          )}

          {claimRewardsError && !isClaimRewardsPending && !claimRewardsSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <div className="w-full py-3 text-center text-negative font-semibold bg-negative/10 rounded-xl border border-negative/20">
                <div className="flex items-center justify-center space-x-2">
                  <Coins className="w-4 h-4 text-negative" />
                  <span className="text-base">Claim Failed</span>
                </div>
                <p className="text-xs text-negative/70 mt-1">{claimRewardsError}</p>
              </div>
              
              <motion.button
                onClick={onClaimRewards}
                className="w-full py-3 bg-gradient-to-r from-success to-accent-main text-white font-bold rounded-xl shadow-lg hover:from-success/80 hover:to-accent-main/80 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Coins className="w-4 h-4" />
                  <span className="text-base">Try Claim Again</span>
                </div>
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VictoryModal;
