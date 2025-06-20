
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DiceProps {
  value: number | null;
  isRolling: boolean;
  onRoll: () => void;
  disabled: boolean;
  contractValue?: number | null; // New prop for contract result
}

const Dice = ({ value, isRolling, onRoll, disabled, contractValue }: DiceProps) => {
  const [animationValue, setAnimationValue] = useState(1);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !disabled) {
        onRoll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [disabled, onRoll]);

  useEffect(() => {
    if (isRolling) {
      // If we already have a contract value, show it immediately
      if (contractValue && contractValue > 0) {
        console.log('🎲 [DICE] Contract value received, showing:', contractValue);
        setAnimationValue(contractValue);
      } else {
        // Show random animation while waiting for contract result
        console.log('🎲 [DICE] Starting rolling animation');
        const interval = setInterval(() => {
          setAnimationValue(Math.floor(Math.random() * 6) + 1);
        }, 100);

        return () => clearInterval(interval);
      }
    } else if (contractValue && contractValue > 0) {
      // When not rolling but we have a contract value, show it
      console.log('🎲 [DICE] Stopped rolling, showing contract value:', contractValue);
      setAnimationValue(contractValue);
    } else if (value) {
      // Fallback to UI value
      setAnimationValue(value);
    }
  }, [isRolling, value, contractValue]);

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
    if (disabled && isRolling) return 'Rolling...';
    if (disabled) return 'Roll Dice';
    return 'Roll Dice';
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <motion.div
        className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-300 rounded-xl border-2 border-gray-400 relative shadow-lg"
        animate={{
          rotateX: isRolling && !contractValue ? 360 : 0,
          rotateY: isRolling && !contractValue ? 360 : 0,
          scale: isRolling && !contractValue ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: isRolling && !contractValue ? 0.3 : 0,
          repeat: isRolling && !contractValue ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <div className="absolute inset-2 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }, (_, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const dots = getDiceDots(animationValue);
            const hasDot = dots.some(([r, c]) => r === row && c === col);
            
            return (
              <div
                key={i}
                className={`flex items-center justify-center transition-all duration-150 ${
                  hasDot ? 'bg-gray-800 rounded-full' : ''
                }`}
              />
            );
          })}
        </div>
      </motion.div>
      
      <motion.button
        onClick={onRoll}
        disabled={disabled}
        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        {getRollButtonText()}
      </motion.button>
      
      {isRolling && !contractValue && (
        <p className="text-sm text-yellow-400 text-center">
          🎲 Waiting for blockchain result...
        </p>
      )}
      
      {contractValue && contractValue > 0 && (
        <p className="text-sm text-green-400 text-center">
          🎯 Rolled: {contractValue}
        </p>
      )}
    </div>
  );
};

export default Dice;
