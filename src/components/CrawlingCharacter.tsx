
import { motion } from 'framer-motion';

interface CrawlingCharacterProps {
  isMoving: boolean;
}

const CrawlingCharacter = ({ isMoving }: CrawlingCharacterProps) => {
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
        <div className="w-8 h-7 bg-gradient-to-b from-amber-100 to-amber-300 rounded-full border-2 border-amber-400 shadow-lg relative">
          
          {/* Head */}
          <motion.div
            className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-b from-amber-50 to-amber-200 rounded-full border border-amber-300"
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
            className="absolute -top-4 left-1/2 transform -translate-x-1/2 -translate-x-1 w-2 h-4 bg-gradient-to-t from-amber-200 to-amber-100 rounded-full border border-amber-300"
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
            className="absolute -top-4 left-1/2 transform -translate-x-1/2 translate-x-1 w-2 h-4 bg-gradient-to-t from-amber-200 to-amber-100 rounded-full border border-amber-300"
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
            className="absolute top-2 -left-1.5 w-2 h-2 bg-amber-300 rounded-full border border-amber-400"
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
            className="absolute top-2 -right-1.5 w-2 h-2 bg-amber-300 rounded-full border border-amber-400"
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
            className="absolute bottom-1 -left-1 w-2.5 h-2 bg-amber-400 rounded-full border border-amber-500"
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
            className="absolute bottom-1 -right-1 w-2.5 h-2 bg-amber-400 rounded-full border border-amber-500"
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
            className="absolute -bottom-1 -right-2 w-3 h-3 bg-gradient-to-br from-white to-amber-100 rounded-full border border-amber-300"
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
