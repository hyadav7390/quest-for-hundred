
import { motion } from 'framer-motion';
import { Info, Users, Gamepad2, Coins, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/hooks/useGame';
import { useEffect, useMemo, useState } from 'react';
import GameModeModal from '@/components/GameModeModal';

interface CommunityProgressProps {
  mode?: 'single' | 'multi';
}

const CommunityProgress = ({ mode }: CommunityProgressProps) => {
  const navigate = useNavigate();
  const [showGameModeModal, setShowGameModeModal] = useState(false);
  
  // Fetch data from both contracts
  const singlePlayerData = useGame('single');
  const multiplayerData = useGame('multi');
  
  useEffect(() => {
    singlePlayerData.fetchPlatformData();
    multiplayerData.fetchPlatformData();
  }, [singlePlayerData.fetchPlatformData, multiplayerData.fetchPlatformData]);

  // Combine stats from both contracts
  const combinedStats = useMemo(() => {
    const singleGames = singlePlayerData.gameStats?.gamesCompleted ?? 0;
    const multiGames = multiplayerData.gameStats?.gamesCompleted ?? 0;
    const totalGames = singleGames + multiGames;

    const singlePlayers = singlePlayerData.gameStats?.totalPlayers ?? 0;
    const multiPlayers = multiplayerData.gameStats?.totalPlayers ?? 0;
    const totalPlayers = singlePlayers + multiPlayers;

    // Use single player contract for total supply (both contracts should have same total supply)
    const nunuMinted = singlePlayerData.totalSupply ? parseFloat(singlePlayerData.totalSupply) : 0;

    // Get multiplayer-specific stats
    const totalRewardsWon = multiplayerData.gameStats?.totalRewardsWon ?? 0;
    const totalLiquidityAdded = multiplayerData.gameStats?.totalLiquidityAdded ?? 0;

    return {
      gamesPlayed: totalGames,
      totalPlayers: totalPlayers,
      nunuMinted: nunuMinted,
      nunuTotalSupply: singlePlayerData.maxSupply ? parseFloat(singlePlayerData.maxSupply) : 0,
      totalRewardsWon: totalRewardsWon,
      totalLiquidityAdded: totalLiquidityAdded
    };
  }, [
    singlePlayerData.gameStats?.gamesCompleted,
    multiplayerData.gameStats?.gamesCompleted,
    singlePlayerData.gameStats?.totalPlayers,
    multiplayerData.gameStats?.totalPlayers,
    singlePlayerData.totalSupply,
    singlePlayerData.maxSupply,
    multiplayerData.gameStats?.totalRewardsWon,
    multiplayerData.gameStats?.totalLiquidityAdded
  ]);

  // Check if data is still loading
  const isLoading = singlePlayerData.isLoading || multiplayerData.isLoading;

  const stats = [
    { 
      icon: <Gamepad2 className="w-6 h-6" />, 
      label: "Games Played", 
      value: isLoading ? '...' : combinedStats.gamesPlayed.toLocaleString() 
    },
    { 
      icon: <Coins className="w-6 h-6" />, 
      label: "$ROLL Minted", 
      value: isLoading ? '...' : (combinedStats.nunuMinted ? combinedStats.nunuMinted.toLocaleString() : '-') 
    },
    { 
      icon: <Users className="w-6 h-6" />, 
      label: "Total Players", 
      value: isLoading ? '...' : combinedStats.totalPlayers.toLocaleString() 
    },
    { 
      icon: <Trophy className="w-6 h-6" />, 
      label: "Total Rewards Won", 
      value: isLoading ? '...' : (combinedStats.totalRewardsWon ? `${(combinedStats.totalRewardsWon / 1e18).toFixed(2)} MON` : '-') 
    },
    { 
      icon: <TrendingUp className="w-6 h-6" />, 
      label: "Total Liquidity Added", 
      value: isLoading ? '...' : (combinedStats.totalLiquidityAdded ? `${(combinedStats.totalLiquidityAdded / 1e18).toFixed(2)} MON` : '-') 
    }
  ];

  const progressPercentage = combinedStats.nunuMinted && combinedStats.nunuTotalSupply > 0 
    ? (combinedStats.nunuMinted / combinedStats.nunuTotalSupply) * 100 
    : 0;

  const handlePlayNow = () => {
    setShowGameModeModal(true);
  };

  const handleSelectMode = (mode: 'single' | 'multi') => {
    setShowGameModeModal(false);
    navigate('/game', { state: { mode } });
  };

  return (
    <>
      <section className="panel max-w-6xl mx-4 mt-12 mb-2 xl:mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <h2 className="font-heading text-heading-2 text-white">Community Progress</h2>
            <div className="group relative">
              <Info className="w-5 h-5 text-white/60 hover:text-accent-main transition-colors cursor-help" />
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-surface border border-accent-main/30 rounded-lg p-3 text-sm text-white/90 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                Community progress tracks total $ROLL tokens minted
              </div>
            </div>
          </div>

          {/* Highlighted Progress Bar Section */}
          <div className="bg-gradient-to-r from-accent-main/10 to-blue-500/10 border border-accent-main/30 rounded-xl p-6 mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-heading font-bold text-white mb-2">
                $ROLL Token Progress
              </h3>
              <p className="text-white/70">
                Track the community's progress in minting $ROLL tokens
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold text-white">$ROLL Minted</span>
                <span className="text-lg font-bold text-accent-main">
                  {isLoading ? '...' : `${progressPercentage.toFixed(2)}%`}
                </span>
              </div>
              <div className="w-full h-6 bg-surface border-2 border-accent-main/30 rounded-full overflow-hidden shadow-lg">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-main to-blue-500 shadow-lg"
                  initial={{ width: 0 }}
                  animate={{ width: `${isLoading ? 0 : progressPercentage}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-sm text-white/70 mt-2 font-medium">
                <span>{isLoading ? '...' : (combinedStats.nunuMinted ? combinedStats.nunuMinted.toLocaleString() : '-')} minted</span>
                <span>{isLoading ? '...' : (combinedStats.nunuTotalSupply ? combinedStats.nunuTotalSupply.toLocaleString() : '-')} total supply</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="bg-surface rounded-lg p-4 text-center border border-accent-main/20 hover:border-accent-main/40 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-center text-accent-main mb-2">
                  {stat.icon}
                </div>
                <div className="text-2xl font-heading font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* CTA Footer */}
          <div className="text-center">
            <p className="text-white/80 mb-4">Every roll adds MONAD liquidity. Every gift mints $ROLL.</p>
            <Button 
              onClick={handlePlayNow}
              className="btn-primary px-8 py-3 text-lg font-semibold hover:scale-105 transition-transform"
            >
              Start Playing
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Game Mode Modal */}
      {showGameModeModal && (
        <GameModeModal
          isOpen={showGameModeModal}
          onClose={() => setShowGameModeModal(false)}
          onSelectMode={handleSelectMode}
        />
      )}
    </>
  );
};

export default CommunityProgress;
