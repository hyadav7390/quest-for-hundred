import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiceProps {
  value: number | null;
  isRolling: boolean;
  onRoll: () => void;
  disabled: boolean;
  contractValue?: number | null;
  isWaitingForVRF: boolean;
  rollFee?: string | null;
}

const Dice = ({ value, isRolling, onRoll, disabled, contractValue, isWaitingForVRF, rollFee }: DiceProps) => {
  const [animationValue, setAnimationValue] = useState(1);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAnimationRunningRef = useRef(false);

  // console.log('🎲 [DICE] Render state:', { 
  //   value, 
  //   isRolling, 
  //   disabled, 
  //   contractValue, 
  //   isWaitingForVRF,
  //   isAnimationRunning: isAnimationRunningRef.current
  // });

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

  // --- 3D Dice Helpers ----------------------------------------------------

  const faceRotation: Record<number, { rotateX: number; rotateY: number }> = {
    1: { rotateX: 0, rotateY: 0 },
    2: { rotateX: -90, rotateY: 0 },
    3: { rotateX: 0, rotateY: 90 },
    4: { rotateX: 0, rotateY: -90 },
    5: { rotateX: 90, rotateY: 0 },
    6: { rotateX: 0, rotateY: 180 },
  };

  const getRollButtonText = () => {
    if (disabled && (isRolling || isWaitingForVRF)) return 'Rolling...';
    return 'Roll Dice';
  };

  const isCurrentlyAnimating = isRolling || isWaitingForVRF || isAnimationRunningRef.current;

  // Format roll fee (assume value is in wei, convert to MON)
  const formatRollFee = (fee: string | null | undefined) => {
    if (!fee) return '0.01';
    try {
      // 18 decimals for MON (like ETH)
      const mon = (Number(fee) / 1e18).toFixed(2);
      return mon;
    } catch {
      return '0.01';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Enhanced Dice Container with 3D effects */}
      <div className="relative">
        {/* 3D Dice Container */}
        <motion.div className="w-20 h-20 perspective-1000 m-auto" style={{ perspective: 800 }}>
          <motion.div
            className="relative w-full h-full transform-gpu"
            style={{ transformStyle: 'preserve-3d' }}
            animate={isCurrentlyAnimating
              ? {
                  rotateX: [0, 720],
                  rotateY: [0, 720],
                }
              : faceRotation[animationValue]}
            transition={isCurrentlyAnimating
              ? { duration: 1.2, repeat: Infinity, ease: 'linear' }
              : { duration: 0.6, ease: 'easeOut' }}
          >
            {/* Six faces */}
            {([1,2,3,4,5,6] as const).map((num) => (
              <div
                key={num}
                className={`absolute w-full h-full flex items-center justify-center text-4xl font-bold text-gray-800 bg-white rounded-2xl shadow-lg`}
                style={{
                  transform: (() => {
                   const dist = 40; // half of cube size (5rem=80px, adjust)
                   switch (num) {
                     case 1: return `rotateY(0deg) translateZ(${dist}px)`;
                     case 2: return `rotateX(90deg) translateZ(${dist}px)`;
                     case 3: return `rotateY(90deg) translateZ(${dist}px)`;
                     case 4: return `rotateY(-90deg) translateZ(${dist}px)`;
                     case 5: return `rotateX(-90deg) translateZ(${dist}px)`;
                     case 6: return `rotateY(180deg) translateZ(${dist}px)`;
                   }
                  })(),
                }}
              >
                {num}
              </div>
            ))}
          </motion.div>

          {/* No additional overlays during roll for cleaner look */}
        </motion.div>

        {/* Enhanced Roll Button */}
        <motion.button
          onClick={onRoll}
          disabled={disabled}
          className="relative px-8 py-3 mt-8 bg-gradient-to-r from-accent-main via-blue-600 to-accent-main text-white font-bold rounded-xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden"
          whileHover={{ 
            scale: disabled ? 1 : 1.05,
            boxShadow: disabled ? undefined : "0 20px 40px rgba(0, 170, 255, 0.4)"
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
            <span>Adding Liquidity of {formatRollFee(rollFee)} MON</span>
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default React.memo(Dice);
