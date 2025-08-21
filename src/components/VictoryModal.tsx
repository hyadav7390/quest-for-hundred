import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Gift, Target, TrendingDown, ArrowUp, TrendingUp, Coins, X, DoorClosed, Home } from 'lucide-react';
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

  // Determine which stats to highlight based on importance hierarchy
  const hasRuggedPlayers = displayRuggedCount > 0;
  const hasRewardWon = displayRewardWon > 0;
  const hasRollCoins = nunuCoins > 0;

  // Priority system: Rugged Players > Reward Won > $ROLL Coins
  const primaryHighlight = hasRuggedPlayers ? 'rugged' : hasRewardWon ? 'reward' : hasRollCoins ? 'coins' : null;
  const secondaryHighlight = hasRuggedPlayers && hasRewardWon ? 'reward' : 
                           hasRuggedPlayers && hasRollCoins ? 'coins' : 
                           hasRewardWon && hasRollCoins ? 'coins' : null;

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

  // Highlighted Stat Component
  const HighlightedStat = ({ 
    type, 
    value, 
    label, 
    icon: Icon, 
    isPrimary = false, 
    isSecondary = false 
  }: {
    type: 'rugged' | 'reward' | 'coins' | 'detours' | 'shortcuts';
    value: string | number;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isPrimary?: boolean;
    isSecondary?: boolean;
  }) => {
    const isHighlighted = isPrimary || isSecondary;
    const highlightLevel = isPrimary ? 'primary' : isSecondary ? 'secondary' : 'none';
    
    const getHighlightStyles = () => {
      if (!isHighlighted) return {};
      
      const baseStyles = {
        border: '2px solid',
        borderRadius: '12px',
        padding: '16px',
        position: 'relative' as const,
        overflow: 'hidden' as const,
      };

      if (highlightLevel === 'primary') {
        return {
          ...baseStyles,
          borderColor: type === 'rugged' ? '#f59e0b' : type === 'reward' ? '#10b981' : '#00aaff',
          background: type === 'rugged' 
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))'
            : type === 'reward'
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))'
            : 'linear-gradient(135deg, rgba(0, 170, 255, 0.1), rgba(0, 170, 255, 0.05))',
          boxShadow: type === 'rugged'
            ? '0 0 20px rgba(245, 158, 11, 0.3)'
            : type === 'reward'
            ? '0 0 20px rgba(16, 185, 129, 0.3)'
            : '0 0 20px rgba(0, 170, 255, 0.3)',
        };
      }

      if (highlightLevel === 'secondary') {
        return {
          ...baseStyles,
          borderColor: type === 'rugged' ? '#f59e0b' : type === 'reward' ? '#10b981' : '#00aaff',
          background: type === 'rugged' 
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02))'
            : type === 'reward'
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02))'
            : 'linear-gradient(135deg, rgba(0, 170, 255, 0.05), rgba(0, 170, 255, 0.02))',
          boxShadow: type === 'rugged'
            ? '0 0 15px rgba(245, 158, 11, 0.2)'
            : type === 'reward'
            ? '0 0 15px rgba(16, 185, 129, 0.2)'
            : '0 0 15px rgba(0, 170, 255, 0.2)',
        };
      }

      return {};
    };

    return (
      <motion.div
        className="relative"
        style={getHighlightStyles()}
        initial={{ scale: 1, opacity: 1 }}
        animate={{ 
          scale: isHighlighted ? [1, 1.02, 1] : 1,
          opacity: 1
        }}
        transition={{ 
          duration: 0.5, 
          repeat: isHighlighted ? Infinity : 0, 
          repeatType: "reverse" as const,
          repeatDelay: 1
        }}
      >
        {/* Glowing background effect for primary highlights */}
        {isPrimary && (
          <motion.div
            className="absolute inset-0 rounded-lg opacity-20"
            style={{
              background: type === 'rugged' 
                ? 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)'
                : type === 'reward'
                ? 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(0, 170, 255, 0.3) 0%, transparent 70%)'
            }}
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ 
                scale: isHighlighted ? [1, 1.2, 1] : 1,
                rotate: isHighlighted ? [0, 5, -5, 0] : 0
              }}
              transition={{ 
                duration: 0.8, 
                repeat: isHighlighted ? Infinity : 0, 
                repeatType: "reverse" as const 
              }}
            >
              <Icon className={`w-5 h-5 ${
                type === 'rugged' ? 'text-warning' : 
                type === 'reward' ? 'text-success' : 
                type === 'detours' ? 'text-red-500' :
                type === 'shortcuts' ? 'text-green-500' :
                'text-accent-main'
              }`} />
            </motion.div>
            <span className={`text-sm font-medium ${
              isHighlighted ? 'text-text-high' : 'text-text-low'
            }`}>
              {label}
            </span>
          </div>
          
          <motion.div
            className={`text-lg font-bold ${
              type === 'rugged' ? 'text-warning' : 
              type === 'reward' ? 'text-success' : 
              type === 'detours' ? 'text-red-500' :
              type === 'shortcuts' ? 'text-green-500' :
              'text-accent-main'
            }`}
            animate={{ 
              scale: isHighlighted ? [1, 1.1, 1] : 1,
              textShadow: isHighlighted ? 
                (type === 'rugged' ? '0 0 10px rgba(245, 158, 11, 0.8)' :
                 type === 'reward' ? '0 0 10px rgba(16, 185, 129, 0.8)' :
                 '0 0 10px rgba(0, 170, 255, 0.8)') : 'none'
            }}
            transition={{ 
              duration: 0.5, 
              repeat: isHighlighted ? Infinity : 0, 
              repeatType: "reverse" as const 
            }}
          >
            {value}
          </motion.div>
        </div>


      </motion.div>
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
        className="bg-surface rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-glow border border-accent-main/20 relative z-50 my-8"
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
            className="inline-block p-4 bg-gradient-to-r from-accent-main to-success rounded-full mb-4"
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
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>

          <motion.h2 
            className="text-3xl font-bold text-text-high mb-2"
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
          <p className="text-text-low">You've reached tile 100!</p>
          <motion.p 
            className="text-accent-main font-bold"
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

        <div className="space-y-6 mb-6">
          {/* Final Score Section */}
          <div className="bg-gradient-to-r from-accent-main/10 to-success/10 border border-accent-main/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold text-text-high">Final Score</span>
              <span className="text-3xl font-bold text-accent-main">{score}</span>
            </div>
            
            <div className="bg-surface/50 border border-accent-main/10 rounded-lg p-3">
              <div className="text-sm text-text-low mb-1">Game Score</div>
              <div className="text-lg font-bold text-text-high">{gameScore}</div>
            </div>
          </div>

          {/* Game Statistics Section */}
          <div className="bg-surface border border-accent-main/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-text-high mb-4">Game Statistics</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Players Rugged - Highest Priority */}
              <HighlightedStat 
                type="rugged" 
                value={displayRuggedCount} 
                label="Players Rugged" 
                icon={TrendingDown} 
                isPrimary={primaryHighlight === 'rugged'}
                isSecondary={false}
              />

              {/* Total Reward Won - Second Priority */}
              <HighlightedStat 
                type="reward" 
                value={`${displayRewardWon ? (displayRewardWon / 1e18).toFixed(2) : 0} MON`} 
                label="Total Reward Won" 
                icon={Coins} 
                isPrimary={primaryHighlight === 'reward'}
                isSecondary={secondaryHighlight === 'reward'}
              />

              {/* $ROLL Coins - Third Priority */}
              <HighlightedStat 
                type="coins" 
                value={nunuCoins} 
                label="$ROLL Coins Earned" 
                icon={Coins} 
                isPrimary={primaryHighlight === 'coins'}
                isSecondary={secondaryHighlight === 'coins'}
              />

              {/* Dice Rolls - Regular stat */}
              <div className="bg-surface/50 border border-accent-main/10 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-accent-main" />
                  <span className="text-sm text-text-low">Dice Rolls</span>
                </div>
                <span className="text-sm font-semibold text-text-high">{displayDiceRolls}</span>
              </div>

              {/* Gifts - Regular stat */}
              <div className="bg-surface/50 border border-accent-main/10 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Gift className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-text-low">Gifts</span>
                </div>
                <span className="text-sm font-semibold text-text-high">{displayGifts}</span>
              </div>

              {/* Detours - Regular stat */}
              <div className="bg-surface/50 border border-accent-main/10 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DoorClosed className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-text-low">Detours</span>
                </div>
                <span className="text-sm font-semibold text-text-high">{displayDetours}</span>
              </div>

              {/* Shortcuts - Regular stat */}
              <div className="bg-surface/50 border border-accent-main/10 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DoorClosed className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-text-low">Shortcuts</span>
                </div>
                <span className="text-sm font-semibold text-text-high">{displayShortcuts}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <motion.button
            onClick={onRestart}
            className="w-full py-4 bg-gradient-to-r from-accent-main to-success text-white font-bold rounded-xl shadow-lg hover:from-accent-main/80 hover:to-success/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: (isRestarting || isClaimRewardsPending) ? 1 : 1.02 }}
            whileTap={{ scale: (isRestarting || isClaimRewardsPending) ? 1 : 0.98 }}
            disabled={isRestarting || !canRestart || isClaimRewardsPending}
          >
            <div className="flex items-center justify-center space-x-3">
              <RotateCcw className="w-5 h-5" />
              <span className="text-lg">
                {isRestarting 
                  ? 'Starting...' 
                  : !canRestart 
                    ? 'Claim Rewards First' 
                    : 'Play Again'
                }
              </span>
            </div>
          </motion.button>

          <motion.button
            onClick={handleGoHome}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:from-blue-500/80 hover:to-purple-600/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isClaimRewardsPending ? 1 : 1.02 }}
            whileTap={{ scale: isClaimRewardsPending ? 1 : 0.98 }}
            disabled={isClaimRewardsPending}
          >
            <div className="flex items-center justify-center space-x-3">
              <Home className="w-5 h-5" />
              <span className="text-lg">{isClaimRewardsPending ? 'Claiming Rewards...' : 'Go to Home'}</span>
            </div>
          </motion.button>

          {/* Claim Rewards Status Display */}
          {isClaimRewardsPending && !claimRewardsSuccess && (
            <div className="w-full py-4 text-center text-accent-main font-semibold bg-accent-main/10 rounded-xl border border-accent-main/20">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-5 h-5 border-2 border-accent-main border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg">Claiming Rewards...</span>
              </div>
            </div>
          )}

          {claimRewardsSuccess && (
            <motion.div 
              className="w-full py-4 text-center text-success font-semibold bg-success/10 rounded-xl border border-success/20 relative overflow-hidden"
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
              
              <div className="flex items-center justify-center space-x-3 relative z-10">
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
                  <Coins className="w-5 h-5 text-success" />
                </motion.div>
                <motion.span
                  className="text-lg"
                  animate={{ 
                    textShadow: showClaimFireworks ? "0 0 10px rgba(34, 197, 94, 0.8)" : "none"
                  }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: showClaimFireworks ? Infinity : 0, 
                    repeatType: "reverse" 
                  }}
                >
                  Claimed Successfully!
                </motion.span>
              </div>
            </motion.div>
          )}

          {claimRewardsError && !isClaimRewardsPending && !claimRewardsSuccess && (
            <motion.button
              onClick={onClaimRewards}
              className="w-full py-4 bg-gradient-to-r from-success to-accent-main text-white font-bold rounded-xl shadow-lg hover:from-success/80 hover:to-accent-main/80 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-center space-x-3">
                <Coins className="w-5 h-5" />
                <span className="text-lg">Claim Rewards</span>
              </div>
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VictoryModal;
