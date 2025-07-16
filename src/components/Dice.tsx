import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiceProps {
  value: number | null;
  isRolling: boolean;
  onRoll: () => void;
  disabled: boolean;
  contractValue?: number | null;
  isWaitingForVRF: boolean;
}

const Dice = ({ value, isRolling, onRoll, disabled, contractValue, isWaitingForVRF }: DiceProps) => {
  const [animationValue, setAnimationValue] = useState(1);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAnimationRunningRef = useRef(false);

  console.log('🎲 [DICE] Render state:', { 
    value, 
    isRolling, 
    disabled, 
    contractValue, 
    isWaitingForVRF,
    isAnimationRunning: isAnimationRunningRef.current
  });

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !disabled) {
        event.preventDefault();
        onRoll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onRoll]);

  // Handle dice animation start/stop
  useEffect(() => {
    if (isRolling && !isAnimationRunningRef.current) {
      isAnimationRunningRef.current = true;
      animationIntervalRef.current = setInterval(() => {
        setAnimationValue((prev) => {
          const next = Math.floor(Math.random() * 6) + 1;
          return next !== prev ? next : ((next % 6) + 1); // avoid same value
        });
      }, 100);
    } else if (!isRolling && isAnimationRunningRef.current) {
      isAnimationRunningRef.current = false;
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
      if (value) {
        setAnimationValue(value);
      } else if (contractValue) {
        setAnimationValue(contractValue);
      }
    }
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
      isAnimationRunningRef.current = false;
    };
  }, [isRolling, value, contractValue]);

  // Handle initial state when component mounts or value changes
  useEffect(() => {
    if (!isRolling && !isAnimationRunningRef.current) {
      const initialValue = value || contractValue || 1;
      setAnimationValue(initialValue);
    }
  }, [value, contractValue, isRolling]);

  // Dice dot patterns
  const getDiceDots = (num: number) => {
    const dotPatterns = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
    };

    return dotPatterns[num as keyof typeof dotPatterns] || [[1, 1]];
  };

  const getRollButtonText = () => {
    if (disabled && (isRolling || isWaitingForVRF)) return 'Rolling...';
    return 'Roll Dice';
  };

  const isCurrentlyAnimating = isRolling || isWaitingForVRF || isAnimationRunningRef.current;
  const dots = useMemo(() => getDiceDots(animationValue), [animationValue]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Enhanced Dice Container with 3D effects */}
      <div className="relative">
        <motion.div
          className="relative w-24 h-24 perspective-1000"
          style={{ perspective: '1000px' }}
        >
          <motion.div
            className="w-full h-full bg-gradient-to-br from-gray-100 via-white to-gray-200 rounded-2xl border-2 border-gray-300 relative shadow-2xl transform-gpu"
            animate={{
              rotateX: isCurrentlyAnimating ? [0, 360, 720, 1080] : 0,
              rotateY: isCurrentlyAnimating ? [0, 360, 720, 1080] : 0,
              rotateZ: isCurrentlyAnimating ? [0, 180, 360, 540] : 0,
              scale: isCurrentlyAnimating ? [1, 1.2, 0.9, 1.1, 1] : 1,
              boxShadow: isCurrentlyAnimating 
                ? [
                    '0 10px 25px rgba(0,0,0,0.3)',
                    '0 20px 40px rgba(0,0,0,0.4)',
                    '0 15px 30px rgba(0,0,0,0.35)',
                    '0 10px 25px rgba(0,0,0,0.3)'
                  ]
                : '0 8px 20px rgba(0,0,0,0.25)',
            }}
            transition={{
              duration: isCurrentlyAnimating ? 0.15 : 0.3,
              repeat: isCurrentlyAnimating ? Infinity : 0,
              ease: isCurrentlyAnimating ? "easeInOut" : "easeOut",
            }}
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Dice face with enhanced dots */}
            <div className="absolute inset-3 grid grid-cols-3 grid-rows-3 gap-1">
              {Array.from({ length: 9 }, (_, i) => {
                const row = Math.floor(i / 3);
                const col = i % 3;
                const hasDot = dots.some(([r, c]) => r === row && c === col);

                return (
                  <motion.div
                    key={i}
                    className={`flex items-center justify-center transition-all duration-200 ${
                      hasDot 
                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 rounded-full shadow-inner' 
                        : ''
                    }`}
                    animate={{
                      scale: hasDot ? [0.8, 1.2, 1] : 0.8,
                      opacity: hasDot ? 1 : 0,
                    }}
                    transition={{
                      duration: 0.3,
                      delay: hasDot ? i * 0.05 : 0,
                    }}
                  />
                );
              })}
            </div>

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-20 rounded-2xl"
              animate={{
                x: isCurrentlyAnimating ? [-100, 100] : 0,
                opacity: isCurrentlyAnimating ? [0, 0.3, 0] : 0.1,
              }}
              transition={{
                duration: 0.8,
                repeat: isCurrentlyAnimating ? Infinity : 0,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Glowing ring effect when rolling */}
          <AnimatePresence>
            {isCurrentlyAnimating && (
              <motion.div
                className="absolute inset-0 rounded-2xl border-4 border-purple-400"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.8, 0.3, 0.8],
                }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Floating sparkles when rolling */}
        <AnimatePresence>
          {isCurrentlyAnimating && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos(i * 60 * Math.PI / 180) * 60,
                    y: Math.sin(i * 60 * Math.PI / 180) * 60,
                  }}
                  exit={{ scale: 0 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Roll Button */}
      <motion.button
        onClick={onRoll}
        disabled={disabled}
        className="relative px-8 py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden"
        whileHover={{ 
          scale: disabled ? 1 : 1.05,
          boxShadow: disabled ? undefined : "0 20px 40px rgba(168, 85, 247, 0.4)"
        }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        animate={{
          backgroundPosition: isCurrentlyAnimating ? ['0% 50%', '100% 50%', '0% 50%'] : '0% 50%',
        }}
        transition={{
          backgroundPosition: {
            duration: 2,
            repeat: isCurrentlyAnimating ? Infinity : 0,
            ease: "linear"
          }
        }}
        style={{
          backgroundSize: '200% 100%',
        }}
      >
        {/* Button shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
          animate={{
            x: disabled ? 0 : [-200, 200],
          }}
          transition={{
            duration: 2,
            repeat: disabled ? 0 : Infinity,
            ease: "linear",
          }}
        />
        
        <span className="relative z-10 flex items-center justify-center space-x-2">
          <motion.span
            animate={{
              rotateY: isCurrentlyAnimating ? 360 : 0,
            }}
            transition={{
              duration: 0.6,
              repeat: isCurrentlyAnimating ? Infinity : 0,
            }}
          >
            🎲
          </motion.span>
          <span>{getRollButtonText()}</span>
        </span>
      </motion.button>

      {isWaitingForVRF && (
        <motion.p
          className="text-sm text-yellow-400 text-center flex items-center space-x-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            ⏳
          </motion.span>
          <span>Adding Liquidity of 0.1 MON</span>
        </motion.p>
      )}
    </div>
  );
};

export default React.memo(Dice);
