
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, DoorClosed, DoorOpen } from 'lucide-react';
import { TileType } from '@/types/game';

interface GameBoardProps {
  playerPosition: number;
  giftTiles: number[];
  detourTrapTiles: { index: number; moveBack: number; revealed: boolean }[];
  revealedTraps: number[];
  isMoving: boolean;
}

const GameBoard = ({ 
  playerPosition, 
  giftTiles, 
  detourTrapTiles, 
  revealedTraps,
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
    if (giftTiles.includes(tileNumber)) return { type: 'gift' };
    const detourTrap = detourTrapTiles.find(dt => dt.index === tileNumber);
    if (detourTrap) {
      return { 
        type: 'detour-trap', 
        moveBack: detourTrap.moveBack,
        revealed: revealedTraps.includes(tileNumber)
      };
    }
    return { type: 'normal' };
  };

  const getTileStyles = (tileNumber: number, tileType: TileType) => {
    let baseStyles = "w-16 h-16 flex items-center justify-center rounded-lg relative border-2 transition-all duration-300";
    
    if (tileNumber === playerPosition) {
      baseStyles += " ring-4 ring-yellow-400 ring-opacity-75";
    }

    if (tileType.type === 'gift') {
      return baseStyles + " bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-600 shadow-lg";
    } else if (tileType.type === 'detour-trap') {
      return baseStyles + " bg-gradient-to-br from-red-500 to-orange-600 border-red-700 shadow-lg";
    } else if (tileNumber === 100) {
      return baseStyles + " bg-gradient-to-br from-green-400 to-emerald-500 border-green-600 shadow-lg";
    } else {
      return baseStyles + " bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:border-gray-500";
    }
  };

  const CrawlingCharacter = () => (
    <motion.div
      className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center relative"
      animate={{
        y: isMoving ? [-2, 2, -2] : 0,
        rotate: isMoving ? [0, 5, -5, 0] : 0,
      }}
      transition={{
        duration: 0.5,
        repeat: isMoving ? Infinity : 0,
        ease: "easeInOut"
      }}
    >
      <motion.div
        className="w-3 h-3 bg-white rounded-full"
        animate={{
          scale: isMoving ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 0.3,
          repeat: isMoving ? Infinity : 0,
        }}
      />
      {/* Crawling legs animation */}
      <motion.div
        className="absolute -bottom-1 -left-1 w-1 h-2 bg-blue-300 rounded"
        animate={{
          rotate: isMoving ? [0, 20, -20, 0] : 0,
        }}
        transition={{
          duration: 0.4,
          repeat: isMoving ? Infinity : 0,
        }}
      />
      <motion.div
        className="absolute -bottom-1 -right-1 w-1 h-2 bg-blue-300 rounded"
        animate={{
          rotate: isMoving ? [0, -20, 20, 0] : 0,
        }}
        transition={{
          duration: 0.4,
          repeat: isMoving ? Infinity : 0,
          delay: 0.2,
        }}
      />
    </motion.div>
  );

  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-2xl">
      <div className="grid grid-cols-10 gap-2">
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
                  <CrawlingCharacter />
                </motion.div>
              )}
              
              {/* Gift Icon */}
              {tileType.type === 'gift' && tileNumber !== playerPosition && (
                <Gift className="w-6 h-6 text-white" />
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
                        <DoorOpen className="w-6 h-6 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="closed-door"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <DoorClosed className="w-6 h-6 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Show penalty number only when revealed */}
                  <AnimatePresence>
                    {tileType.revealed && (
                      <motion.span
                        className="text-xs text-white font-bold mt-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                      >
                        -{tileType.moveBack}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Goal Flag */}
              {tileNumber === 100 && tileNumber !== playerPosition && (
                <span className="text-2xl">🏁</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GameBoard;
