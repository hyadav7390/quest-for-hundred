
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { useContract, LeaderboardEntry } from '@/hooks/useContract';
import { formatEther } from 'viem';

const BlockchainLeaderboard = () => {
  const { leaderboard, fetchLeaderboard } = useContract();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchLeaderboard();
      setIsLoading(false);
    };
    fetchData();
  }, [fetchLeaderboard]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Trophy className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-gray-300 mt-2">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            The Hundredth Tile Leaderboard
          </h2>
          <button
            onClick={() => fetchLeaderboard()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-xl text-gray-300">No games completed yet</p>
            <p className="text-gray-500">Be the first to reach tile 100!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.slice(0, 50).map((entry: LeaderboardEntry, index: number) => (
              <motion.div
                key={entry.player}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  index < 3
                    ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                    : 'bg-gray-700/50 border-gray-600'
                } hover:border-purple-500/50 transition-all duration-200`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-white">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-gray-300">
                        {formatAddress(entry.player)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-white">
                    {Number(entry.score).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">
                    Game Score
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BlockchainLeaderboard;
