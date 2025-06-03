
import { motion } from 'framer-motion';
import { Play, Trophy, Gift, Zap, Target, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';

const GameDetail = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();

  // For now, we only have one game
  if (gameId !== 'hundredth-tile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Game Not Found</h1>
          <Button onClick={() => navigate('/games')}>Back to Games</Button>
        </div>
      </div>
    );
  }

  const gameFeatures = [
    {
      icon: <Target className="w-8 h-8 text-blue-400" />,
      title: "Race to 100",
      description: "Navigate through 100 tiles in this thrilling board game adventure"
    },
    {
      icon: <Gift className="w-8 h-8 text-yellow-400" />,
      title: "Collect Gifts",
      description: "Discover 12 hidden gifts with varying NUNU coin values (50-300 coins)"
    },
    {
      icon: <Zap className="w-8 h-8 text-green-400" />,
      title: "Unpredictable Journey",
      description: "Face detour traps and find shortcut gates that change your path"
    }
  ];

  const gameRules = [
    "Roll the dice to move forward on the board",
    "Collect gifts to earn NUNU coins (50-300 coins each)",
    "Avoid detour traps that move you backward (5-40 tiles)",
    "Find shortcut gates that jump you forward (5-20 tiles)",
    "Reach tile 100 to win and earn 1000 bonus NUNU coins",
    "Your total score includes movement points + gift coins + completion bonus"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <motion.button
          onClick={() => navigate('/games')}
          className="flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Games
        </motion.button>

        {/* Game Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-8xl mb-6">🎲</div>
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            The Hundredth Tile
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Roll the dice, collect gifts, avoid detour traps, find shortcuts, and make your NUNU rise to 100!
          </p>
        </motion.div>

        {/* Game Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">2,156</div>
            <div className="text-gray-400">Players Today</div>
          </motion.div>

          <motion.div
            className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Gift className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">8,542</div>
            <div className="text-gray-400">NUNU Coins Earned</div>
          </motion.div>

          <motion.div
            className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Trophy className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">1,023</div>
            <div className="text-gray-400">Games Completed</div>
          </motion.div>
        </div>

        {/* Launch Game Button */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Button
            size="lg"
            onClick={() => navigate('/game')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            <Play className="w-6 h-6 mr-3" />
            Launch Game
          </Button>
          
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/game/leaderboard')}
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-3"
            >
              <Trophy className="w-5 h-5 mr-2" />
              View Leaderboard
            </Button>
          </div>
        </motion.div>

        {/* Game Features */}
        <div className="mb-12">
          <motion.h2
            className="text-4xl font-bold text-white text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Game Features
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {gameFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-purple-500 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Game Rules */}
        <motion.div
          className="bg-gray-800 rounded-2xl p-8 border border-gray-700"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6 text-center">How to Play</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {gameRules.map((rule, index) => (
              <motion.div
                key={index}
                className="flex items-start space-x-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-300">{rule}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GameDetail;
