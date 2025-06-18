
import { motion } from 'framer-motion';
import { Play, Lock, Star, Users, Trophy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { GameInfo } from '@/types/game';

const Games = () => {
  const navigate = useNavigate();

  const games: GameInfo[] = [
    {
      id: 'hundredth-tile',
      title: 'The Hundredth Tile',
      description: 'Race to tile 100! Roll dice, collect gifts, avoid traps, and find shortcuts in this thrilling board game.',
      thumbnail: '🎲',
      isAvailable: true,
    },
    {
      id: 'coming-soon',
      title: 'Mystery Game',
      description: 'An exciting new adventure is coming soon to the NUNU Games platform. Stay tuned!',
      thumbnail: '🎮',
      isAvailable: false,
      comingSoon: true,
    },
  ];

  const handleGameClick = (game: GameInfo) => {
    if (game.isAvailable) {
      navigate(`/games/${game.id}`);
    }
  };

  const handleLaunchGame = (gameId: string) => {
    if (gameId === 'hundredth-tile') {
      navigate('/game');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🎮 Select Game
          </h1>
          <p className="text-xl text-gray-300">
            Choose your adventure and start earning NUNU coins!
          </p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">3,291</div>
            <div className="text-gray-400">Active Players</div>
          </motion.div>

          <motion.div
            className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">12,847</div>
            <div className="text-gray-400">NUNU Coins Earned</div>
          </motion.div>

          <motion.div
            className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Star className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">1 / 2</div>
            <div className="text-gray-400">Games Available</div>
          </motion.div>
        </div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              className={`bg-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-700 ${
                game.isAvailable ? 'hover:border-purple-500' : 'opacity-75'
              } transition-all duration-300`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={game.isAvailable ? { scale: 1.02 } : {}}
            >
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{game.thumbnail}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{game.title}</h3>
                  <p className="text-gray-300">{game.description}</p>
                </div>

                <div className="flex gap-3 justify-center">
                  {game.isAvailable ? (
                    <>
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 font-bold rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunchGame(game.id);
                        }}
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        Launch Game
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-purple-500 text-purple-400 hover:bg-purple-500/10 px-6 py-3 font-bold rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGameClick(game);
                        }}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        View Details
                      </Button>
                    </>
                  ) : (
                    <Button
                      disabled
                      size="lg"
                      className="bg-gray-600 text-gray-400 cursor-not-allowed px-8 py-3 font-bold rounded-xl"
                    >
                      <Lock className="w-5 h-5 mr-2" />
                      Coming Soon
                    </Button>
                  )}
                </div>

                {game.comingSoon && (
                  <div className="mt-4 text-center">
                    <span className="inline-block bg-yellow-600 text-yellow-100 px-3 py-1 rounded-full text-sm font-medium">
                      🚀 Coming Soon
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-gray-400">
            More exciting games are coming to the NUNU platform. Stay tuned!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Games;
