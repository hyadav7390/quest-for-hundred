
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, DoorClosed, DoorOpen, ArrowUp } from 'lucide-react';
import { TileType } from '@/types/game';
import CrawlingCharacter from './CrawlingCharacter';

interface GameBoardProps {
  playerPosition: number;
  giftTiles: { index: number; points: number }[];
  detourTrapTiles: { index: number; moveBack: number; revealed: boolean }[];
  shortcutGateTiles: { index: number; moveForward: number; revealed: boolean }[];
  revealedTraps: number[];
  revealedGates: number[];
  isMoving: boolean;
}

const GameBoard = ({ 
  playerPosition, 
  giftTiles, 
  detourTrapTiles, 
  shortcutGateTiles,
  revealedTraps,
  revealedGates,
  isMoving 
}: GameBoardProps) => {
  const getTileNumber = (row: number, col: number): number => {
    const isEvenRow = row % 2 === 0;
    if (isEvenRow) {
      return row * 10 + col + 1;
    } else {
      return row * 10 + (10 - col);
    }
  };

  const getTileType = (tileNumber: number): TileType => {
    const gift = giftTiles.find(g => g.index === tileNumber);
    if (gift) return { type: 'gift', points: gift.points };
    
    const detourTrap = detourTrapTiles.find(dt => dt.index === tileNumber);
    if (detourTrap) {
      return { 
        type: 'detour-trap', 
        moveBack: detourTrap.moveBack,
        revealed: revealedTraps.includes(tileNumber)
      };
    }
    
    const shortcutGate = shortcutGateTiles.find(sg => sg.index === tileNumber);
    if (shortcutGate) {
      return {
        type: 'shortcut-gate',
        moveForward: shortcutGate.moveForward,
        revealed: revealedGates.includes(tileNumber)
      };
    }
    
    return { type: 'normal' };
  };

  const getTileStyles = (tileNumber: number, tileType: TileType) => {
    let baseStyles = "w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg relative border-2 transition-all duration-300";
    
    if (tileNumber === playerPosition) {
      baseStyles += " ring-4 ring-yellow-400 ring-opacity-75";
    }

    if (tileType.type === 'gift') {
      return baseStyles + " bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-600 shadow-lg";
    } else if (tileType.type === 'detour-trap') {
      return baseStyles + " bg-gradient-to-br from-red-500 to-orange-600 border-red-700 shadow-lg";
    } else if (tileType.type === 'shortcut-gate') {
      return baseStyles + " bg-gradient-to-br from-green-400 to-emerald-500 border-green-600 shadow-lg";
    } else if (tileNumber === 100) {
      return baseStyles + " bg-gradient-to-br from-purple-400 to-blue-500 border-purple-600 shadow-lg";
    } else {
      return baseStyles + " bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:border-gray-500";
    }
  };

  return (
    <div className="bg-gray-900 p-3 sm:p-6 rounded-2xl shadow-2xl">
      <div className="grid grid-cols-10 gap-1 sm:gap-2">
        {Array.from({ length: 100 }, (_, index) => {
          const row = Math.floor(index / 10);
          const col = index % 10;
          const tileNumber = getTileNumber(9 - row, col);
          const tileType = getTileType(tileNumber);
          
          return (
            <motion.div
              key={tileNumber}
              className={getTileStyles(tileNumber, tileType)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01, duration: 0.3 }}
            >
              {/* Tile Number */}
              <span className="text-xs font-bold text-white absolute top-0.5 left-1">
                {tileNumber}
              </span>
              
              {/* Player Avatar */}
              {tileNumber === playerPosition && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <CrawlingCharacter isMoving={isMoving} />
                </motion.div>
              )}
              
              {/* Gift Icon with Points */}
              {tileType.type === 'gift' && tileNumber !== playerPosition && (
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </motion.div>
                  <span className="text-xs text-white font-bold">{tileType.points}</span>
                </div>
              )}
              
              {/* Detour Trap Door */}
              {tileType.type === 'detour-trap' && (
                <div className="flex flex-col items-center">
                  <AnimatePresence mode="wait">
                    {tileNumber === playerPosition ? (
                      <motion.div
                        key="open-door"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <DoorOpen className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="closed-door"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <DoorClosed className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Show penalty number only when revealed */}
                  <AnimatePresence>
                    {tileType.revealed && (
                      <motion.span
                        className="text-xs text-white font-bold mt-1"
                        initial={{ opacity: 0, y: 10, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.5 }}
                        transition={{ duration: 0.5, type: "spring" }}
                      >
                        -{tileType.moveBack}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Shortcut Gate */}
              {tileType.type === 'shortcut-gate' && (
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      y: [0, -2, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <ArrowUp className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </motion.div>
                  
                  {/* Show bonus number only when revealed */}
                  <AnimatePresence>
                    {tileType.revealed && (
                      <motion.span
                        className="text-xs text-white font-bold mt-1"
                        initial={{ opacity: 0, y: 10, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.5 }}
                        transition={{ duration: 0.5, type: "spring" }}
                      >
                        +{tileType.moveForward}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Goal Flag */}
              {tileNumber === 100 && tileNumber !== playerPosition && (
                <span className="text-xl sm:text-2xl">🏁</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GameBoard;
