
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Star } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  totalScore: number;
  gameScore: number;
  giftScore: number;
  gamesPlayed: number;
}

const Leaderboard = () => {
  // Dummy data for leaderboard
  const leaderboardData: LeaderboardEntry[] = [
    {
      rank: 1,
      wallet: "0x742d...a71A",
      totalScore: 15420,
      gameScore: 12200,
      giftScore: 3220,
      gamesPlayed: 24
    },
    {
      rank: 2,
      wallet: "0x8f3b...d92C",
      totalScore: 14850,
      gameScore: 11600,
      giftScore: 3250,
      gamesPlayed: 22
    },
    {
      rank: 3,
      wallet: "0x1a2b...e45F",
      totalScore: 13740,
      gameScore: 10890,
      giftScore: 2850,
      gamesPlayed: 19
    },
    {
      rank: 4,
      wallet: "0x9c8d...f23A",
      totalScore: 12980,
      gameScore: 10200,
      giftScore: 2780,
      gamesPlayed: 18
    },
    {
      rank: 5,
      wallet: "0x5e6f...b78C",
      totalScore: 12450,
      gameScore: 9850,
      giftScore: 2600,
      gamesPlayed: 17
    },
    {
      rank: 6,
      wallet: "0x2d4e...c91B",
      totalScore: 11890,
      gameScore: 9340,
      giftScore: 2550,
      gamesPlayed: 16
    },
    {
      rank: 7,
      wallet: "0x7f8a...d12E",
      totalScore: 11320,
      gameScore: 8920,
      giftScore: 2400,
      gamesPlayed: 15
    },
    {
      rank: 8,
      wallet: "0x4b5c...e67D",
      totalScore: 10750,
      gameScore: 8450,
      giftScore: 2300,
      gamesPlayed: 14
    },
    {
      rank: 9,
      wallet: "0x8a9b...f34C",
      totalScore: 10280,
      gameScore: 8080,
      giftScore: 2200,
      gamesPlayed: 13
    },
    {
      rank: 10,
      wallet: "0x3c4d...a56B",
      totalScore: 9820,
      gameScore: 7720,
      giftScore: 2100,
      gamesPlayed: 12
    }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-accent-main" />;
      case 2:
        return <Medal className="w-6 h-6 text-accent-main/70" />;
      case 3:
        return <Award className="w-6 h-6 text-accent-main/50" />;
      default:
        return <Star className="w-6 h-6 text-white/40" />;
    }
  };

  const getRankStyling = (rank: number) => {
    switch (rank) {
      case 1:
        return "ring-2 ring-accent-main bg-accent-main/10";
      case 2:
        return "ring-2 ring-accent-main/70 bg-accent-main/5";
      case 3:
        return "ring-2 ring-accent-main/50 bg-accent-main/5";
      default:
        return "border border-white/10";
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-heading font-bold text-white mb-4">
            🏆 <span className="text-accent-main">Leaderboard</span>
          </h1>
          <p className="text-xl text-white/80">
            Top players in the quest for tile 100
          </p>
        </motion.div>

        {/* Top 3 Podium */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {leaderboardData.slice(0, 3).map((player, index) => (
            <motion.div
              key={player.rank}
              className={`panel text-center ${getRankStyling(player.rank)}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="mb-4 flex justify-center">
                {getRankIcon(player.rank)}
              </div>
              <h3 className="text-2xl font-heading font-bold text-white mb-2">#{player.rank}</h3>
              <p className="text-white/80 font-mono text-lg mb-4">{player.wallet}</p>
              <div className="bg-surface rounded-lg p-4">
                <p className="text-3xl font-heading font-bold text-accent-main">{player.totalScore.toLocaleString()}</p>
                <p className="text-white/60">Total Score</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Full Leaderboard Table */}
        <motion.div
          className="panel"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-heading font-bold text-white">Full Rankings</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/80">Wallet</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/80">Total Score</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/80">Game Score</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/80">Gift Score</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white/80">Games</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((player, index) => (
                  <motion.tr
                    key={player.rank}
                    className={`border-b border-white/10 hover:bg-surface/50 transition-colors ${
                      index % 2 === 0 ? 'bg-surface/20' : 'bg-transparent'
                    }`}
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
                    <td className="px-6 py-4 text-right">
                      <span className="text-accent-main font-bold text-lg">
                        {player.totalScore.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-positive font-semibold">
                        {player.gameScore.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-accent-main font-semibold">
                        {player.giftScore.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-white/80">{player.gamesPlayed}</span>
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
          <p className="text-white/60">
            Rankings are updated in real-time. Keep playing to climb the leaderboard!
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Leaderboard;
