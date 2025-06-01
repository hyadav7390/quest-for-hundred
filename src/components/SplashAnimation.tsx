
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, TrendingUp, TrendingDown } from 'lucide-react';

interface SplashAnimationProps {
  isVisible: boolean;
  type: 'gift' | 'shortcut' | 'detour';
  value: number;
  onComplete: () => void;
}

const SplashAnimation = ({ isVisible, type, value, onComplete }: SplashAnimationProps) => {
  const getIcon = () => {
    switch (type) {
      case 'gift':
        return <Gift className="w-16 h-16 text-yellow-400" />;
      case 'shortcut':
        return <TrendingUp className="w-16 h-16 text-green-400" />;
      case 'detour':
        return <TrendingDown className="w-16 h-16 text-red-400" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'gift':
        return 'from-yellow-400 to-amber-500';
      case 'shortcut':
        return 'from-green-400 to-emerald-500';
      case 'detour':
        return 'from-red-400 to-red-600';
    }
  };

  const getText = () => {
    switch (type) {
      case 'gift':
        return `+${value} Points!`;
      case 'shortcut':
        return `Shortcut +${value}!`;
      case 'detour':
        return `Detour -${value}!`;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            setTimeout(onComplete, 1000);
          }}
        >
          {/* Burst effect */}
          <motion.div
            className="absolute"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{ duration: 0.6, times: [0, 0.6, 1] }}
          >
            {/* Radiating circles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-32 h-32 rounded-full bg-gradient-to-r ${getColors()} opacity-30`}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ scale: 0, rotate: i * 60 }}
                animate={{ 
                  scale: [0, 2, 0], 
                  rotate: i * 60 + 360,
                  opacity: [0.3, 0.1, 0] 
                }}
                transition={{ 
                  duration: 1, 
                  delay: i * 0.1,
                  ease: "easeOut" 
                }}
              />
            ))}
          </motion.div>

          {/* Main content */}
          <motion.div
            className="text-center z-10"
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <motion.div
              className="mb-4"
              animate={{ 
                rotateY: [0, 360],
                scale: [1, 1.2, 1] 
              }}
              transition={{ 
                duration: 0.8, 
                repeat: 1,
                ease: "easeInOut" 
              }}
            >
              {getIcon()}
            </motion.div>
            
            <motion.h2
              className={`text-4xl font-bold bg-gradient-to-r ${getColors()} bg-clip-text text-transparent`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {getText()}
            </motion.h2>
          </motion.div>

          {/* Particle effects */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 rounded-full bg-gradient-to-r ${getColors()}`}
              style={{
                top: '50%',
                left: '50%',
              }}
              initial={{ 
                scale: 0,
                x: 0,
                y: 0,
                opacity: 1
              }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos(i * 30 * Math.PI / 180) * 200,
                y: Math.sin(i * 30 * Math.PI / 180) * 200,
                opacity: [1, 0.5, 0]
              }}
              transition={{
                duration: 1,
                delay: 0.4 + i * 0.05,
                ease: "easeOut"
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashAnimation;
