
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  totalScore: number;
  gameScore: number;
  nunuCoins: number;
  gamesPlayed: number;
}

const GameLeaderboard = () => {
  const navigate = useNavigate();

  // Dummy data for leaderboard
  const leaderboardData: LeaderboardEntry[] = [
    {
      rank: 1,
      wallet: "0x742d...a71A",
      totalScore: 15420,
      gameScore: 12200,
      nunuCoins: 3220,
      gamesPlayed: 24
    },
    {
      rank: 2,
      wallet: "0x8f3b...d92C",
      totalScore: 14850,
      gameScore: 11600,
      nunuCoins: 3250,
      gamesPlayed: 22
    },
    {
      rank: 3,
      wallet: "0x1a2b...e45F",
      totalScore: 13740,
      gameScore: 10890,
      nunuCoins: 2850,
      gamesPlayed: 19
    },
    {
      rank: 4,
      wallet: "0x9c8d...f23A",
      totalScore: 12980,
      gameScore: 10200,
      nunuCoins: 2780,
      gamesPlayed: 18
    },
    {
      rank: 5,
      wallet: "0x5e6f...b78C",
      totalScore: 12450,
      gameScore: 9850,
      nunuCoins: 2600,
      gamesPlayed: 17
    },
    {
      rank: 6,
      wallet: "0x2d4e...c91B",
      totalScore: 11890,
      gameScore: 9340,
      nunuCoins: 2550,
      gamesPlayed: 16
    },
    {
      rank: 7,
      wallet: "0x7f8a...d12E",
      totalScore: 11320,
      gameScore: 8920,
      nunuCoins: 2400,
      gamesPlayed: 15
    },
    {
      rank: 8,
      wallet: "0x4b5c...e67D",
      totalScore: 10750,
      gameScore: 8450,
      nunuCoins: 2300,
      gamesPlayed: 14
    },
    {
      rank: 9,
      wallet: "0x8a9b...f34C",
      totalScore: 10280,
      gameScore: 8080,
      nunuCoins: 2200,
      gamesPlayed: 13
    },
    {
      rank: 10,
      wallet: "0x3c4d...a56B",
      totalScore: 9820,
      gameScore: 7720,
      nunuCoins: 2100,
      gamesPlayed: 12
    }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Star className="w-6 h-6 text-blue-400" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "from-yellow-400 to-yellow-600";
      case 2:
        return "from-gray-300 to-gray-500";
      case 3:
        return "from-amber-500 to-amber-700";
      default:
        return "from-blue-400 to-blue-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <motion.button
          onClick={() => navigate('/games/hundredth-tile')}
          className="flex items-center text-gray-300 hover:text-white mb-8 transition-colors"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Game
        </motion.button>

        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🏆 The Hundredth Tile Leaderboard
          </h1>
          <p className="text-xl text-gray-300">
            Top players in the quest for tile 100
          </p>
        </motion.div>

        {/* Top 3 Podium */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {leaderboardData.slice(0, 3).map((player, index) => (
            <motion.div
              key={player.rank}
              className={`bg-gradient-to-br ${getRankColor(player.rank)} rounded-2xl p-6 text-center shadow-2xl`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="mb-4">
                {getRankIcon(player.rank)}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">#{player.rank}</h3>
              <p className="text-white font-mono text-lg mb-4">{player.wallet}</p>
              <div className="bg-black bg-opacity-20 rounded-lg p-4">
                <p className="text-3xl font-bold text-white">{player.totalScore.toLocaleString()}</p>
                <p className="text-white opacity-80">Total Score</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Full Leaderboard Table */}
        <motion.div
          className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-700"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">Full Rankings</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Wallet</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Total Score</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Game Score</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">NUNU Coins</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Games</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((player, index) => (
                  <motion.tr
                    key={player.rank}
                    className="border-b border-gray-700 hover:bg-gray-750 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {getRankIcon(player.rank)}
                        <span className="text-white font-bold">#{player.rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-mono">{player.wallet}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-yellow-400 font-bold text-lg">
                        {player.totalScore.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-blue-400 font-semibold">
                        {player.gameScore.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-400 font-semibold">
                        {player.nunuCoins.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-300">{player.gamesPlayed}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <p className="text-gray-400">
            Rankings are updated in real-time. Keep playing to climb the leaderboard!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default GameLeaderboard;
