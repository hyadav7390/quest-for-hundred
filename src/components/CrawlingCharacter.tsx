import { motion } from 'framer-motion';

interface CrawlingCharacterProps {
  isMoving: boolean;
}

const CrawlingCharacter = ({ isMoving }: CrawlingCharacterProps) => {
  return (
    <motion.div
      className="relative flex items-center justify-center w-12 h-12"
      animate={{
        y: isMoving ? [0, -4, 0] : 0,
      }}
      transition={{
        duration: 0.8,
        repeat: isMoving ? Infinity : 0,
        ease: "easeInOut"
      }}
    >
      {/* Body */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-9 h-7 bg-gradient-to-b from-gray-100 to-gray-300 rounded-t-full rounded-b-md border-2 border-gray-400/50 shadow-inner"
        animate={{
          scaleY: isMoving ? [1, 0.95, 1] : 1,
          scaleX: isMoving ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 0.8,
          repeat: isMoving ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-6 h-4 bg-white/70 rounded-t-lg"></div>
      </motion.div>

      {/* Head */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-b from-white to-gray-200 rounded-full border-2 border-gray-300/80"
        animate={{
          rotate: isMoving ? [-2, 2, -2] : 0,
        }}
        transition={{
          duration: 1.2,
          repeat: isMoving ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        {/* Eye - Left */}
        <div className="absolute top-3 left-1 w-2.5 h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
        
        {/* Eye - Right */}
        <div className="absolute top-3 right-1 w-2.5 h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>

        {/* Blinking Animation */}
        <motion.div 
          className="absolute top-3 left-1 w-2.5 h-3 bg-gray-200 rounded-full"
          animate={{ scaleY: isMoving ? [0, 1, 0, 0, 0] : 0 }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeOut", times: [0, 0.05, 0.1, 0.9, 1] }}
        />
        <motion.div 
          className="absolute top-3 right-1 w-2.5 h-3 bg-gray-200 rounded-full"
          animate={{ scaleY: isMoving ? [0, 1, 0, 0, 0] : 0 }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeOut", times: [0, 0.05, 0.1, 0.9, 1], delay: 0.15 }}
        />

        {/* Nose & Mouth */}
        <div className="absolute bottom-[7px] left-1/2 -translate-x-1/2">
          <div className="w-1.5 h-1 bg-pink-300 rounded-t-sm rounded-b-sm"></div>
          <div className="absolute -bottom-1 left-[1px] w-px h-1 bg-gray-400"></div>
          <div className="absolute -bottom-1 right-[1px] w-px h-1 bg-gray-400"></div>
        </div>

        {/* Cheeks */}
        <div className="absolute bottom-1.5 left-0 w-3 h-3 bg-pink-400/20 rounded-full filter blur-sm"></div>
        <div className="absolute bottom-1.5 right-0 w-3 h-3 bg-pink-400/20 rounded-full filter blur-sm"></div>
      </motion.div>
      
      {/* Ears */}
      <motion.div 
        className="absolute top-0.5 left-1.5 w-3 h-7 bg-gray-200 rounded-t-full rounded-b-md border-2 border-gray-300/80 z-[-1]"
        style={{ transformOrigin: "bottom center" }}
        animate={{ rotate: isMoving ? -15 : -10 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      >
        <div className="mt-1 mx-auto w-1.5 h-5 bg-pink-200/80 rounded-t-full rounded-b-sm"></div>
      </motion.div>
      <motion.div 
        className="absolute top-0.5 right-1.5 w-3 h-7 bg-gray-200 rounded-t-full rounded-b-md border-2 border-gray-300/80 z-[-1]"
        style={{ transformOrigin: "bottom center" }}
        animate={{ rotate: isMoving ? 15 : 10 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.1 }}
      >
        <div className="mt-1 mx-auto w-1.5 h-5 bg-pink-200/80 rounded-t-full rounded-b-sm"></div>
      </motion.div>
      
      {/* Front Paws */}
      <motion.div 
        className="absolute bottom-1 left-0 w-3 h-3 bg-gray-100 rounded-full border-2 border-gray-300/80 z-10"
        animate={{ y: isMoving ? -1 : 0 }}
        transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1 right-0 w-3 h-3 bg-gray-100 rounded-full border-2 border-gray-300/80 z-10"
        animate={{ y: isMoving ? -1 : 0 }}
        transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.2 }}
      />
      
      {/* Back Paws */}
      <div className="absolute bottom-0 left-0 w-4 h-3 bg-gray-200 rounded-t-md rounded-br-md border-2 border-gray-300/80 z-[-1]"></div>
      <div className="absolute bottom-0 right-0 w-4 h-3 bg-gray-200 rounded-t-md rounded-bl-md border-2 border-gray-300/80 z-[-1]"></div>

      {/* Tail */}
      <motion.div 
        className="absolute bottom-6 right-[-8px] w-4 h-4 bg-gradient-to-br from-white to-gray-200 rounded-full border-2 border-gray-300 z-[-2]"
        animate={{ scale: isMoving ? 1.05 : 1 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
      />
    </motion.div>
  );
};

export default CrawlingCharacter;
