
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, TrendingUp, TrendingDown, DoorClosed, DoorOpen } from 'lucide-react';
import CrawlingCharacter from './CrawlingCharacter';

interface SplashAnimationProps {
  isVisible: boolean;
  type: 'gift' | 'shortcut' | 'detour' | 'rug';
  value: number;
  onComplete: () => void;
}

const SplashAnimation = ({ isVisible, type, value, onComplete }: SplashAnimationProps) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'gift':
        return 'bg-gradient-to-br from-amber-400 to-yellow-500';
      case 'shortcut':
        return 'bg-gradient-to-br from-emerald-400 to-green-500';
      case 'detour':
        return 'bg-gradient-to-br from-red-400 to-orange-500';
      case 'rug':
        return 'bg-gradient-to-br from-red-500 to-red-700';
      default:
        return 'bg-gradient-to-br from-gray-400 to-gray-600';
    }
  };

  const getText = () => {
    switch (type) {
      case 'gift':
        return `+${value} $ROLL Coins!`;
      case 'shortcut':
        return `🚀 Yay, Found a SHORTCUT of +${value} tiles!`;
      case 'detour':
        return `⚠️ Oh, I got a DETOUR of -${value} tiles!`;
      case 'rug':
        return `💀 You've been RUGGED! Prize pool rewards are gone!`;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={() => {
            setTimeout(onComplete, type === 'gift' ? 3500 : type === 'rug' ? 5500 : 3000);
          }}
        >
          {/* Semi-transparent dark overlay so board is still visible */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Animation stage - bounded area roughly matching board */}
          <div className="relative w-[90%] max-w-[460px] aspect-square flex items-center justify-center rounded-3xl overflow-visible">
            {/* Gift Animation */}
            {type === 'gift' && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Gift Box Opening Animation */}
                <motion.div
                  className="absolute left-1/4"
                  initial={{ scale: 0.5, rotate: 0 }}
                  animate={{ scale: [0.5, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  {/* Gift Box */}
                  <motion.div
                    className="relative w-32 h-32 bg-gradient-to-br from-amber-300 to-yellow-400 rounded-lg border-4 border-yellow-600 shadow-2xl"
                    initial={{ y: 0 }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.5, repeat: 1 }}
                  >
                    {/* Gift Ribbon */}
                    <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-4 bg-red-500 shadow-lg"></div>
                    <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-4 bg-red-500 shadow-lg"></div>
                    
                    {/* Gift Bow */}
                    <motion.div
                      className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-6 bg-red-600 rounded-full"
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.3, delay: 1, repeat: 2 }}
                    />
                    
                    {/* Opening Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-0"
                      animate={{ opacity: [0, 0.8, 0] }}
                      transition={{ duration: 0.5, delay: 1.5 }}
                    />
                  </motion.div>

                  {/* Coins Flying Out */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-6 h-6 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full border-2 border-yellow-600 shadow-lg"
                      style={{
                        top: '50%',
                        left: '50%',
                      }}
                      initial={{ 
                        scale: 0, 
                        x: 0, 
                        y: 0, 
                        opacity: 0,
                        rotate: 0
                      }}
                      animate={{
                        scale: [0, 1, 0.8],
                        x: [0, Math.cos(i * 45 * Math.PI / 180) * 120, 180],
                        y: [0, Math.sin(i * 45 * Math.PI / 180) * 120, 0],
                        opacity: [0, 1, 0], 
                        rotate: [0, 360, 720]
                      }}
                      transition={{
                        duration: 1.5,
                        delay: 1.5 + i * 0.1,
                        ease: "easeOut"
                      }}
                    >
                      {/* Coin Shine Effect */}
                      <motion.div
                        className="absolute inset-1 bg-gradient-to-br from-white to-transparent rounded-full opacity-60"
                        animate={{ rotate: [0, 180] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Character Dancing */}
                <motion.div
                  className="absolute right-1/4"
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ 
                    // Normal dance then a pop-up when coins reach the character
                    scale: [0.8, 1.2, 1, 3.5, 1.8],
                    y: [20, -10, 0, -8, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    delay: 1,
                    ease: "easeOut",
                    times: [0, 0.2, 0.5, 0.8, 1]
                  }}
                >
                  <CrawlingCharacter isMoving={true} />
                  
                  {/* Happy particles around character */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-2xl"
                      style={{
                        top: `${20 + Math.random() * 60}%`,
                        left: `${20 + Math.random() * 60}%`,
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        y: [0, -20, -40]
                      }}
                      transition={{
                        duration: 1.5,
                        delay: 2.5 + i * 0.2,
                        ease: "easeOut"
                      }}
                    >
                      {['✨', '💫', '⭐', '🎉'][i % 4]}
                    </motion.div>
                  ))}
                </motion.div>

                {/* Text */}
                <motion.div
                  className="absolute bottom-1/4 text-center"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.5, duration: 0.5 }}
                >
                  <h2 className="text-4xl font-bold text-white drop-shadow-2xl">
                    {getText()}
                  </h2>
                </motion.div>
              </div>
            )}

            {/* Door Animation (Shortcut/Detour) */}
            {(type === 'shortcut' || type === 'detour') && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Door */}
                <motion.div
                  className="relative"
                  initial={{ scale: 1.5 }}
                  animate={{ scale: [1.5, 1] }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  {/* Door Opening Animation */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="door-sequence"
                      className="relative"
                    >
                      {/* Closed Door */}
                      <motion.div
                        initial={{ opacity: 1, rotateY: 0 }}
                        animate={{ 
                          opacity: [1, 1, 0],
                          rotateY: [0, 0, -90]
                        }}
                        transition={{ 
                          duration: 1.5,
                          times: [0, 0.6, 1],
                          ease: "easeInOut"
                        }}
                      >
                        <DoorClosed 
                          className={`w-48 h-48 ${type === 'detour' ? 'text-red-300' : 'text-green-300'} drop-shadow-2xl`} 
                        />
                      </motion.div>
                      
                      {/* Open Door */}
                      <motion.div
                        className="absolute inset-0"
                        initial={{ opacity: 0, rotateY: -90 }}
                        animate={{ 
                          opacity: [0, 0, 1],
                          rotateY: [-90, -90, 0]
                        }}
                        transition={{ 
                          duration: 1.5,
                          times: [0, 0.6, 1],
                          ease: "easeInOut"
                        }}
                      >
                        <DoorOpen 
                          className={`w-48 h-48 ${type === 'detour' ? 'text-red-300' : 'text-green-300'} drop-shadow-2xl`} 
                        />
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Character Movement Sequence */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 1, x: -200, opacity: 1 }}
                    animate={{ 
                      scale: [1, 0.8, 0.4, 0.2, 0.1],
                      x: [-200, -100, 0, 50, 100],
                      opacity: [1, 1, 1, 0.5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      delay: 0.5,
                      ease: "easeInOut"
                    }}
                  >
                    <CrawlingCharacter isMoving={true} />
                  </motion.div>

                  {/* Character Falling/Rocketing Effect */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0.1, x: 100, y: 0, opacity: 0 }}
                    animate={{ 
                      scale: type === 'shortcut' ? [0.6, 0.8, 0.6] : [0.6, 0.8, 0.6],
                      x: [100, 150, 200],
                      y: type === 'shortcut' ? [0, -300, -600] : [0, 300, 600],
                      opacity: [0, 1, 0],
                      rotate: type === 'shortcut' ? [0, -45, -90] : [0, 180, 360]
                    }}
                    transition={{ 
                      duration: 1.5,
                      delay: 2.5,
                      ease: type === 'shortcut' ? "easeOut" : "easeIn"
                    }}
                  >
                    <CrawlingCharacter isMoving={true} />
                    
                    {/* Trail Effect */}
                    {type === 'shortcut' && (
                      <motion.div
                        className="absolute inset-0 -z-10"
                        animate={{
                          background: [
                            'radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, transparent 70%)',
                            'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 50%)',
                            'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 30%)'
                          ]
                        }}
                        transition={{ duration: 1.5, delay: 2.5 }}
                      />
                    )}
                    
                    {type === 'detour' && (
                      <motion.div
                        className="absolute inset-0 -z-10"
                        animate={{
                          background: [
                            'radial-gradient(circle, rgba(239, 68, 68, 0.8) 0%, transparent 70%)',
                            'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 50%)',
                            'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 30%)'
                          ]
                        }}
                        transition={{ duration: 1.5, delay: 2.5 }}
                      />
                    )}
                  </motion.div>

                  {/* Impact Effect */}
                  {type === 'shortcut' && (
                    <motion.div
                      className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-20"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 2, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 0.6,
                        delay: 3.5
                      }}
                    >
                      <div className="text-6xl">💥</div>
                    </motion.div>
                  )}

                  {type === 'detour' && (
                    <motion.div
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-20"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 2, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 0.6,
                        delay: 3.5
                      }}
                    >
                      <div className="text-6xl">💥</div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Text */}
                <motion.div
                  className="absolute bottom-8 text-center w-full"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 1.5 }}
                >
                  <h2 className="text-4xl font-bold text-white drop-shadow-2xl">
                    {getText()}
                  </h2>
                </motion.div>
              </div>
            )}

            {/* Rug Animation */}
            {type === 'rug' && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Large Single Rug */}
                <motion.div
                  className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-48 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-lg border-2 border-red-700 shadow-lg"
                  initial={{ x: 0, rotate: 0, scale: 1 }}
                  animate={{ 
                    // Phase 1: Static rug while characters play (0-40%)
                    // Phase 2: Rug gets pulled (60-80%)
                    x: [0, 0, 0, -80, -160],
                    rotate: [0, 0, 0, -15, -30],
                    scale: [1, 1, 1, 0.95, 0.9]
                  }}
                  transition={{ 
                    duration: 5.5,
                    times: [0, 0.4, 0.6, 0.7, 0.8],
                    ease: "easeIn"
                  }}
                >
                  {/* Rug Pattern */}
                  <div className="absolute inset-3 border border-red-300 rounded"></div>
                  <div className="absolute inset-6 border border-red-200 rounded"></div>
                  <div className="absolute inset-9 border border-red-100 rounded"></div>
                </motion.div>

                {/* Character 1 (The one who will be rugged) */}
                <motion.div
                  className="absolute bottom-1/3 left-1/4 transform -translate-x-1/2"
                  initial={{ scale: 0.8, y: 0, x: 0, rotate: 0 }}
                  animate={{ 
                    // Phase 1: Playing on rug (0-40%)
                    // Phase 2: Still on rug (40-60%)
                    // Phase 3: Falling as rug is pulled (60-80%)
                    // Phase 4: Fallen (80-100%)
                    scale: [0.8, 1, 0.8, 0.8, 0.8, 0.6, 0.4],
                    y: [0, -8, 0, 0, 0, 20, 60],
                    x: [0, 0, 0, 0, 0, -5, -15],
                    rotate: [0, 0, 0, 0, 0, 45, 90]
                  }}
                  transition={{ 
                    duration: 5.5,
                    times: [0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8],
                    ease: "easeInOut"
                  }}
                >
                  <CrawlingCharacter isMoving={true} />
                </motion.div>

                {/* Character 2 (The one who pulls the rug) */}
                <motion.div
                  className="absolute bottom-1/3 right-1/4 transform translate-x-1/2"
                  initial={{ scale: 0.8, y: 0, x: 0 }}
                  animate={{ 
                    // Phase 1: Playing on rug (0-40%)
                    // Phase 2: Steps off rug (40-60%)
                    // Phase 3: Stays off rug (60-80%)
                    // Phase 4: Laughs (80-100%)
                    scale: [0.8, 1, 0.8, 0.8, 0.8, 0.8, 1.2, 0.8],
                    y: [0, -8, 0, 0, 0, 0, -10, 0],
                    x: [0, 0, 0, 15, 30, 30, 30, 30]
                  }}
                  transition={{ 
                    duration: 5.5,
                    times: [0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 1],
                    ease: "easeInOut"
                  }}
                >
                  <CrawlingCharacter isMoving={true} />
                </motion.div>

                {/* Death Effect - Skull */}
                <motion.div
                  className="absolute bottom-1/3 left-1/4 transform -translate-x-1/2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 0, 0, 0, 0, 0, 0, 2, 0],
                    opacity: [0, 0, 0, 0, 0, 0, 0, 1, 0]
                  }}
                  transition={{ 
                    duration: 5.5,
                    times: [0, 0.8, 0.85, 0.9, 0.95, 1],
                    ease: "easeInOut"
                  }}
                >
                  <div className="text-6xl">💀</div>
                </motion.div>

                {/* Laughing Effect - Devil */}
                <motion.div
                  className="absolute bottom-1/3 right-1/4 transform translate-x-1/2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
                    opacity: [0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0]
                  }}
                  transition={{ 
                    duration: 5.5,
                    times: [0, 0.8, 0.85, 0.9, 0.95, 1],
                    ease: "easeInOut"
                  }}
                >
                  <div className="text-4xl">😈</div>
                </motion.div>

                {/* Text */}
                <motion.div
                  className="absolute bottom-8 text-center w-full"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 1 }}
                >
                  <h2 className="text-4xl font-bold text-white drop-shadow-2xl">
                    {getText()}
                  </h2>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashAnimation;
