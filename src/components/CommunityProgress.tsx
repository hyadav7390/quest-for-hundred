
import { motion } from 'framer-motion';
import { Info, Users, Gamepad2, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useContract } from '@/hooks/useContract';

const CommunityProgress = () => {
  const navigate = useNavigate();
  
  // Get contract stats
  const { gameStats } = useContract();
  const gamesPlayed = gameStats?.gamesCompleted ?? null;
  const nunuMinted = gameStats?.totalNunuEarned ?? null;
  // Community stats from contract
  const stats = [
    { icon: <Gamepad2 className="w-6 h-6" />, label: "Games Played", value: gamesPlayed !== null ? gamesPlayed.toLocaleString() : '-' },
    { icon: <Coins className="w-6 h-6" />, label: "NUNU Minted", value: nunuMinted !== null ? nunuMinted.toLocaleString() : '-' },
    { icon: <Users className="w-6 h-6" />, label: "Total Players", value: 99 }
  ];

  const nunuTotalSupply = 1_000_000;
  const progressPercentage = nunuMinted && nunuTotalSupply > 0 ? (nunuMinted / nunuTotalSupply) * 100 : 0;

  // Remove progress bar color logic since progressPercentage is not available
  const getProgressBarColor = () => 'bg-accent-main/70';

  return (
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
              Community progress tracks total NUNU tokens minted
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="bg-surface rounded-lg p-4 text-center border border-accent-main/20"
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

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-white/70 font-medium">NUNU Minted</span>
            <span className="text-xs text-white/50">{progressPercentage.toFixed(2)}%</span>
          </div>
          <div className="w-full h-4 bg-surface border border-accent-main/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-main/70 transition-all duration-700"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/50 mt-1">
            <span>{nunuMinted !== null ? nunuMinted.toLocaleString() : '-'}</span>
            <span>{nunuTotalSupply.toLocaleString()}</span>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="text-center">
          <p className="text-white/80 mb-4">Every roll adds MONAD liquidity. Every gift mints NUNU.</p>
          <Button 
            onClick={() => navigate('/game')}
            className="btn-primary px-8 py-3"
          >
            Start Playing
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

export default CommunityProgress;
