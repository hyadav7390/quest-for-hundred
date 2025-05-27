
import { motion } from 'framer-motion';

interface CrawlingCharacterProps {
  isMoving: boolean;
}

const CrawlingCharacter = ({ isMoving }: CrawlingCharacterProps) => {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{
        y: isMoving ? [-1, 1, -1] : 0,
      }}
      transition={{
        duration: 0.6,
        repeat: isMoving ? Infinity : 0,
        ease: "easeInOut"
      }}
    >
      {/* Character Body */}
      <motion.div
        className="w-8 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-xl border-2 border-white shadow-lg relative overflow-hidden"
        animate={{
          scaleX: isMoving ? [1, 1.1, 1] : 1,
          scaleY: isMoving ? [1, 0.9, 1] : 1,
        }}
        transition={{
          duration: 0.4,
          repeat: isMoving ? Infinity : 0,
        }}
      >
        {/* Character Head */}
        <motion.div
          className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-b from-amber-200 to-amber-400 rounded-full border border-white"
          animate={{
            rotate: isMoving ? [0, 5, -5, 0] : 0,
          }}
          transition={{
            duration: 0.5,
            repeat: isMoving ? Infinity : 0,
          }}
        >
          {/* Eyes */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-black rounded-full"></div>
          <div className="absolute top-1 right-1 w-1 h-1 bg-black rounded-full"></div>
          
          {/* Mouth */}
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-0.5 bg-red-400 rounded-full"></div>
        </motion.div>

        {/* Character Arms */}
        <motion.div
          className="absolute top-1 -left-1 w-2 h-1 bg-amber-300 rounded"
          animate={{
            rotate: isMoving ? [0, 20, -10, 0] : 0,
          }}
          transition={{
            duration: 0.3,
            repeat: isMoving ? Infinity : 0,
          }}
        />
        <motion.div
          className="absolute top-1 -right-1 w-2 h-1 bg-amber-300 rounded"
          animate={{
            rotate: isMoving ? [0, -20, 10, 0] : 0,
          }}
          transition={{
            duration: 0.3,
            repeat: isMoving ? Infinity : 0,
            delay: 0.15,
          }}
        />

        {/* Character Legs */}
        <motion.div
          className="absolute bottom-0 left-1 w-1 h-2 bg-blue-700 rounded"
          animate={{
            rotate: isMoving ? [0, 15, -15, 0] : 0,
          }}
          transition={{
            duration: 0.4,
            repeat: isMoving ? Infinity : 0,
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1 w-1 h-2 bg-blue-700 rounded"
          animate={{
            rotate: isMoving ? [0, -15, 15, 0] : 0,
          }}
          transition={{
            duration: 0.4,
            repeat: isMoving ? Infinity : 0,
            delay: 0.2,
          }}
        />

        {/* Backpack */}
        <div className="absolute top-0.5 right-0.5 w-2 h-3 bg-gradient-to-b from-green-400 to-green-600 rounded border border-white"></div>
      </motion.div>

      {/* Crawling dust particles */}
      {isMoving && (
        <>
          <motion.div
            className="absolute -bottom-1 -left-2 w-1 h-1 bg-gray-400 rounded-full opacity-60"
            animate={{
              x: [0, -10, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
            }}
          />
          <motion.div
            className="absolute -bottom-1 -right-2 w-1 h-1 bg-gray-400 rounded-full opacity-60"
            animate={{
              x: [0, 10, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: 0.4,
            }}
          />
        </>
      )}
    </motion.div>
  );
};

export default CrawlingCharacter;
