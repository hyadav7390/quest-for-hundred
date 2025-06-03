
import { motion } from 'framer-motion';
import { Gift, Users, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const GlobalProgressTracker = () => {
  // Mock data - in real app this would come from backend
  const totalGiftsCollected = 12847;
  const totalPlayers = 3291;
  const nextUnlockTarget = 15000;
  const progressPercentage = (totalGiftsCollected / nextUnlockTarget) * 100;

  return (
    <div className="bg-gray-800 py-20 border-y border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">Community Achievement</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Join thousands of players collecting gifts and unlocking rewards for the entire community!
          </p>
          
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-600 shadow-2xl">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {totalPlayers.toLocaleString()}
                </div>
                <div className="text-gray-400">Total Players</div>
              </motion.div>
              
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {totalGiftsCollected.toLocaleString()}
                </div>
                <div className="text-gray-400">Gifts Collected</div>
              </motion.div>
              
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {Math.round(progressPercentage)}%
                </div>
                <div className="text-gray-400">To Next Unlock</div>
              </motion.div>
            </div>
            
            {/* Progress Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-white">
                <span className="text-lg font-semibold">Community Progress</span>
                <span className="text-sm text-gray-300">
                  {totalGiftsCollected.toLocaleString()} / {nextUnlockTarget.toLocaleString()}
                </span>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                viewport={{ once: true }}
                className="relative"
              >
                <Progress 
                  value={progressPercentage} 
                  className="h-4 bg-gray-700 rounded-full overflow-hidden"
                />
                
                {/* Animated glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </motion.div>
              
              <div className="text-center">
                <p className="text-gray-300 text-sm mb-2">
                  Next reward unlocks at {nextUnlockTarget.toLocaleString()} gifts!
                </p>
                <div className="flex justify-center space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < Math.floor(progressPercentage / 20) 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                          : 'bg-gray-600'
                      }`}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
                      viewport={{ once: true }}
                      animate={
                        i < Math.floor(progressPercentage / 20)
                          ? {
                              scale: [1, 1.2, 1],
                            }
                          : {}
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Reward Preview */}
            <motion.div
              className="mt-8 p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-center space-x-3">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  🎁
                </motion.div>
                <span className="text-white font-medium">
                  Next Community Reward: Exclusive NFT Collection
                </span>
                <motion.div
                  animate={{
                    rotate: [0, -10, 10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  🏆
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GlobalProgressTracker;
