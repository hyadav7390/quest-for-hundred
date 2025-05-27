
import { motion } from 'framer-motion';
import { Gift, RotateCcw } from 'lucide-react';

interface GameBoardProps {
  playerPosition: number;
  giftTiles: number[];
  bounceBackTiles: { index: number; moveBack: number }[];
}

const GameBoard = ({ playerPosition, giftTiles, bounceBackTiles }: GameBoardProps) => {
  const getTileNumber = (row: number, col: number): number => {
    const isEvenRow = row % 2 === 0;
    if (isEvenRow) {
      return row * 10 + col + 1;
    } else {
      return row * 10 + (10 - col);
    }
  };

  const getTileType = (tileNumber: number) => {
    if (giftTiles.includes(tileNumber)) return 'gift';
    const bounceBack = bounceBackTiles.find(bt => bt.index === tileNumber);
    if (bounceBack) return { type: 'bounceback', moveBack: bounceBack.moveBack };
    return 'normal';
  };

  const getTileStyles = (tileNumber: number, tileType: any) => {
    let baseStyles = "w-16 h-16 flex items-center justify-center rounded-lg relative border-2 transition-all duration-300";
    
    if (tileNumber === playerPosition) {
      baseStyles += " ring-4 ring-yellow-400 ring-opacity-75";
    }

    if (tileType === 'gift') {
      return baseStyles + " bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-600 shadow-lg";
    } else if (tileType.type === 'bounceback') {
      return baseStyles + " bg-gradient-to-br from-red-500 to-orange-600 border-red-700 shadow-lg";
    } else if (tileNumber === 100) {
      return baseStyles + " bg-gradient-to-br from-green-400 to-emerald-500 border-green-600 shadow-lg";
    } else {
      return baseStyles + " bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:border-gray-500";
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-2xl">
      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: 100 }, (_, index) => {
          const row = Math.floor(index / 10);
          const col = index % 10;
          const tileNumber = getTileNumber(9 - row, col); // Reverse row for bottom-up layout
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
                  className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <span className="text-white text-xs font-bold">P</span>
                </motion.div>
              )}
              
              {/* Gift Icon */}
              {tileType === 'gift' && tileNumber !== playerPosition && (
                <Gift className="w-6 h-6 text-white" />
              )}
              
              {/* BounceBack Icon and Value */}
              {tileType.type === 'bounceback' && tileNumber !== playerPosition && (
                <div className="flex flex-col items-center">
                  <RotateCcw className="w-4 h-4 text-white" />
                  <span className="text-xs text-white font-bold">-{tileType.moveBack}</span>
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
