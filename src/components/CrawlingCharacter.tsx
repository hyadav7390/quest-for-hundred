
import { motion } from 'framer-motion';

interface CrawlingCharacterProps {
  isMoving: boolean;
  isOtherPlayer?: boolean; // New prop to distinguish other players
  isRuggmate?: boolean; // New prop to distinguish ruggmates from other peers
}

const CrawlingCharacter = ({ isMoving, isOtherPlayer = false, isRuggmate = false }: CrawlingCharacterProps) => {
  // Different color scheme for other players and ruggmates
  const bodyColor = isOtherPlayer 
    ? (isRuggmate ? "from-green-100 to-green-300" : "from-blue-100 to-blue-300") 
    : "from-amber-100 to-amber-300";
  const borderColor = isOtherPlayer 
    ? (isRuggmate ? "border-green-400" : "border-blue-400") 
    : "border-amber-400";
  const headColor = isOtherPlayer 
    ? (isRuggmate ? "from-green-50 to-green-200" : "from-blue-50 to-blue-200") 
    : "from-amber-50 to-amber-200";
  const headBorderColor = isOtherPlayer 
    ? (isRuggmate ? "border-green-300" : "border-blue-300") 
    : "border-amber-300";
  const earColor = isOtherPlayer 
    ? (isRuggmate ? "from-green-200 to-green-100" : "from-blue-200 to-blue-100") 
    : "from-amber-200 to-amber-100";
  const earBorderColor = isOtherPlayer 
    ? (isRuggmate ? "border-green-300" : "border-blue-300") 
    : "border-amber-300";
  const pawColor = isOtherPlayer 
    ? (isRuggmate ? "bg-green-300" : "bg-blue-300") 
    : "bg-amber-300";
  const pawBorderColor = isOtherPlayer 
    ? (isRuggmate ? "border-green-400" : "border-blue-400") 
    : "border-amber-400";
  const backPawColor = isOtherPlayer 
    ? (isRuggmate ? "bg-green-400" : "bg-blue-400") 
    : "bg-amber-400";
  const backPawBorderColor = isOtherPlayer 
    ? (isRuggmate ? "border-green-500" : "border-blue-500") 
    : "border-amber-500";
  const tailColor = isOtherPlayer 
    ? (isRuggmate ? "from-white to-green-100" : "from-white to-blue-100") 
    : "from-white to-amber-100";
  const tailBorderColor = isOtherPlayer 
    ? (isRuggmate ? "border-green-300" : "border-blue-300") 
    : "border-amber-300";
  
  // Smaller size for other players
  const sizeClass = isOtherPlayer ? "w-6 h-6" : "w-8 h-7";
  const headSizeClass = isOtherPlayer ? "w-4 h-4" : "w-6 h-6";
  const earSizeClass = isOtherPlayer ? "w-1.5 h-3" : "w-2 h-4";
  const pawSizeClass = isOtherPlayer ? "w-1.5 h-1.5" : "w-2 h-2";
  const backPawSizeClass = isOtherPlayer ? "w-2 h-1.5" : "w-2.5 h-2";
  const tailSizeClass = isOtherPlayer ? "w-2 h-2" : "w-3 h-3";

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{
        y: isMoving ? [-2, 2, -2] : 0,
      }}
      transition={{
        duration: 0.5,
        repeat: isMoving ? Infinity : 0,
        ease: "easeInOut"
      }}
    >
      {/* Rabbit Body */}
      <motion.div
        className="relative"
        animate={{
          scaleX: isMoving ? [1, 1.1, 0.9, 1] : 1,
          scaleY: isMoving ? [1, 0.9, 1.1, 1] : 1,
        }}
        transition={{
          duration: 0.6,
          repeat: isMoving ? Infinity : 0,
        }}
      >
        {/* Main Body */}
        <div className={`${sizeClass} bg-gradient-to-b ${bodyColor} rounded-full border-2 ${borderColor} shadow-lg relative`}>
          
          {/* Head */}
          <motion.div
            className={`absolute -top-2 left-1/2 transform -translate-x-1/2 ${headSizeClass} bg-gradient-to-b ${headColor} rounded-full border ${headBorderColor}`}
            animate={{
              rotate: isMoving ? [0, 3, -3, 0] : 0,
            }}
            transition={{
              duration: 0.4,
              repeat: isMoving ? Infinity : 0,
            }}
          >
            {/* Eyes */}
            <div className="absolute top-1.5 left-1 w-1.5 h-1.5 bg-black rounded-full"></div>
            <div className="absolute top-1.5 right-1 w-1.5 h-1.5 bg-black rounded-full"></div>
            
            {/* Nose */}
            <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-pink-400 rounded-full"></div>
            
            {/* Whiskers */}
            <div className="absolute top-2 -left-1 w-2 h-0.5 bg-gray-600 rounded"></div>
            <div className="absolute top-2.5 -left-1 w-2 h-0.5 bg-gray-600 rounded"></div>
            <div className="absolute top-2 -right-1 w-2 h-0.5 bg-gray-600 rounded"></div>
            <div className="absolute top-2.5 -right-1 w-2 h-0.5 bg-gray-600 rounded"></div>
          </motion.div>

          {/* Ears */}
          <motion.div
            className={`absolute -top-4 left-1/2 transform -translate-x-1/2 -translate-x-1 ${earSizeClass} bg-gradient-to-t ${earColor} rounded-full border ${earBorderColor}`}
            animate={{
              rotate: isMoving ? [0, -5, 5, 0] : 0,
            }}
            transition={{
              duration: 0.3,
              repeat: isMoving ? Infinity : 0,
            }}
          >
            <div className="w-1 h-2 bg-pink-200 rounded-full absolute top-1 left-1/2 transform -translate-x-1/2"></div>
          </motion.div>
          <motion.div
            className={`absolute -top-4 left-1/2 transform -translate-x-1/2 translate-x-1 ${earSizeClass} bg-gradient-to-t ${earColor} rounded-full border ${earBorderColor}`}
            animate={{
              rotate: isMoving ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              duration: 0.3,
              repeat: isMoving ? Infinity : 0,
              delay: 0.1,
            }}
          >
            <div className="w-1 h-2 bg-pink-200 rounded-full absolute top-1 left-1/2 transform -translate-x-1/2"></div>
          </motion.div>

          {/* Front Paws */}
          <motion.div
            className={`absolute top-2 -left-1.5 ${pawSizeClass} ${pawColor} rounded-full border ${pawBorderColor}`}
            animate={{
              x: isMoving ? [0, -2, 2, 0] : 0,
              rotate: isMoving ? [0, 15, -15, 0] : 0,
            }}
            transition={{
              duration: 0.4,
              repeat: isMoving ? Infinity : 0,
            }}
          />
          <motion.div
            className={`absolute top-2 -right-1.5 ${pawSizeClass} ${pawColor} rounded-full border ${pawBorderColor}`}
            animate={{
              x: isMoving ? [0, 2, -2, 0] : 0,
              rotate: isMoving ? [0, -15, 15, 0] : 0,
            }}
            transition={{
              duration: 0.4,
              repeat: isMoving ? Infinity : 0,
              delay: 0.2,
            }}
          />

          {/* Back Paws */}
          <motion.div
            className={`absolute bottom-1 -left-1 ${backPawSizeClass} ${backPawColor} rounded-full border ${backPawBorderColor}`}
            animate={{
              scaleX: isMoving ? [1, 1.2, 0.8, 1] : 1,
              x: isMoving ? [0, -1, 1, 0] : 0,
            }}
            transition={{
              duration: 0.3,
              repeat: isMoving ? Infinity : 0,
            }}
          />
          <motion.div
            className={`absolute bottom-1 -right-1 ${backPawSizeClass} ${backPawColor} rounded-full border ${backPawBorderColor}`}
            animate={{
              scaleX: isMoving ? [1, 0.8, 1.2, 1] : 1,
              x: isMoving ? [0, 1, -1, 0] : 0,
            }}
            transition={{
              duration: 0.3,
              repeat: isMoving ? Infinity : 0,
              delay: 0.15,
            }}
          />

          {/* Tail */}
          <motion.div
            className={`absolute -bottom-1 -right-2 ${tailSizeClass} bg-gradient-to-br ${tailColor} rounded-full border ${tailBorderColor}`}
            animate={{
              rotate: isMoving ? [0, 20, -10, 0] : 0,
              scale: isMoving ? [1, 1.1, 0.9, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: isMoving ? Infinity : 0,
            }}
          />

          {/* Belly Spot */}
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-white rounded-full opacity-60"></div>
        </div>

        {/* Movement Dust Particles */}
        {isMoving && (
          <>
            <motion.div
              className="absolute -bottom-2 -left-3 w-1 h-1 bg-amber-600 rounded-full opacity-40"
              animate={{
                x: [0, -8, 0],
                y: [0, -4, 0],
                opacity: [0, 0.4, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
              }}
            />
            <motion.div
              className="absolute -bottom-2 -right-3 w-1 h-1 bg-amber-600 rounded-full opacity-40"
              animate={{
                x: [0, 8, 0],
                y: [0, -4, 0],
                opacity: [0, 0.4, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: 0.3,
              }}
            />
            <motion.div
              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-gray-400 rounded-full opacity-30"
              animate={{
                y: [0, -6, 0],
                opacity: [0, 0.3, 0],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: 0.1,
              }}
            />
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CrawlingCharacter;
