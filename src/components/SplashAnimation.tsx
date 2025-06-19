
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
        return <Gift className="w-16 h-16 text-white drop-shadow-lg" />;
      case 'shortcut':
        return <TrendingUp className="w-16 h-16 text-white drop-shadow-lg" />;
      case 'detour':
        return <TrendingDown className="w-16 h-16 text-white drop-shadow-lg" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'gift':
        return {
          gradient: 'from-amber-400 via-yellow-400 to-orange-500',
          glow: 'shadow-amber-400/50',
          particles: 'bg-amber-300'
        };
      case 'shortcut':
        return {
          gradient: 'from-emerald-400 via-green-400 to-teal-500',
          glow: 'shadow-emerald-400/50',
          particles: 'bg-emerald-300'
        };
      case 'detour':
        return {
          gradient: 'from-red-400 via-orange-400 to-red-600',
          glow: 'shadow-red-400/50',
          particles: 'bg-red-300'
        };
      default:
        // Fallback colors to prevent undefined
        return {};
    }
  };

  const getText = () => {
    switch (type) {
      case 'gift':
        return `🎁 GIFT COLLECTED! +${value} Points!`;
      case 'shortcut':
        return `🚀 SHORTCUT FOUND! +${value} tiles forward!`;
      case 'detour':
        return `⚠️ DETOUR TRAP! -${value} tiles back!`;
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Dark overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => {
              setTimeout(onComplete, 2500);
            }}
          >
            {/* Expanding ring effects */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-32 h-32 rounded-full bg-gradient-to-r ${colors?.gradient} opacity-20`}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{
                  scale: [0, 3, 6],
                  opacity: [0.6, 0.3, 0]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  ease: "easeOut"
                }}
              />
            ))}

            {/* Central burst effect */}
            <motion.div
              className="absolute"
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: [0, 1.2, 1], rotate: 360 }}
              transition={{ duration: 0.8, times: [0, 0.6, 1] }}
            >
              {/* Star burst rays */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-1 bg-gradient-to-r ${colors.gradient} rounded-full ${colors.glow} shadow-lg`}
                  style={{
                    height: '60px',
                    top: '50%',
                    left: '50%',
                    transformOrigin: 'bottom center',
                    transform: `translate(-50%, -100%) rotate(${i * 45}deg)`,
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{
                    scaleY: [0, 1.5, 0.8],
                    opacity: [0, 1, 0.7]
                  }}
                  transition={{
                    duration: 1.2,
                    delay: 0.3 + i * 0.05,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.div>

            {/* Main content card */}
            <motion.div
              className={`relative z-10 bg-gradient-to-br ${colors.gradient} p-8 rounded-3xl ${colors.glow} shadow-2xl border-2 border-white/20 backdrop-blur-sm`}
              initial={{ scale: 0, y: 50, rotateY: 180 }}
              animate={{ scale: 1, y: 0, rotateY: 0 }}
              exit={{ scale: 0, y: -50, rotateY: 180 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2
              }}
            >
              <div className="text-center">
                <motion.div
                  className="mb-6"
                  animate={{
                    rotateY: [0, 360],
                    scale: [1, 1.3, 1]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: 1,
                    ease: "easeInOut"
                  }}
                >
                  {getIcon()}
                </motion.div>

                <motion.h2
                  className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {getText()}
                </motion.h2>
              </div>
            </motion.div>

            {/* Floating particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-3 h-3 rounded-full ${colors.particles} shadow-lg`}
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
                  scale: [0, 1, 0.5, 0],
                  x: (Math.cos(i * 18 * Math.PI / 180) * (150 + Math.random() * 100)),
                  y: (Math.sin(i * 18 * Math.PI / 180) * (150 + Math.random() * 100)),
                  opacity: [1, 0.8, 0.3, 0],
                  rotate: 360
                }}
                transition={{
                  duration: 2,
                  delay: 0.6 + i * 0.03,
                  ease: "easeOut"
                }}
              />
            ))}

            {/* Sparkle effects */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute text-white text-xl"
                style={{
                  top: `${40 + Math.random() * 20}%`,
                  left: `${30 + Math.random() * 40}%`,
                }}
                initial={{ scale: 0, opacity: 0, rotate: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: 180
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.8 + Math.random() * 0.5,
                  ease: "easeInOut"
                }}
              >
                ✨
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SplashAnimation;
