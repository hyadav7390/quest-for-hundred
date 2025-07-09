
import { motion } from 'framer-motion';
import { Info, Users, Gamepad2, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CommunityProgress = () => {
  const navigate = useNavigate();
  
  // Mock data - in real app this would come from backend
  const totalMinted = 12847000;
  const totalSupply = 1000000000;
  const progressPercentage = (totalMinted / totalSupply) * 100;
  
  // Community stats
  const stats = [
    { icon: <Users className="w-6 h-6" />, label: "Total Players", value: "2,847" },
    { icon: <Gamepad2 className="w-6 h-6" />, label: "Games Played", value: "15,942" },
    { icon: <Coins className="w-6 h-6" />, label: "NUNU Minted", value: totalMinted.toLocaleString() },
  ];

  const getProgressBarColor = () => {
    if (progressPercentage === 0) return 'bg-surface';
    if (progressPercentage >= 100) return 'bg-accent-main shadow-glow';
    return 'bg-accent-main/70';
  };

  return (
    <section className="panel max-w-6xl mx-auto mt-12">
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

        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">NUNU Token Supply</h3>
            <span className="text-sm text-white/60">
              {(progressPercentage).toFixed(4)}% Minted
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative mb-4">
            <div className="h-12 bg-surface rounded-lg border border-accent-main/20 overflow-hidden relative">
              <motion.div
                className={`h-full ${getProgressBarColor()} transition-all duration-1000`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              
              {/* Progress Percentage Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-heading text-2xl text-white font-bold">
                  {progressPercentage.toFixed(4)}%
                </span>
              </div>
            </div>
            
            {/* Progress Text */}
            <div className="flex justify-between items-center mt-2 text-sm text-white/60">
              <span>{totalMinted.toLocaleString()} NUNU Minted</span>
              <span>{totalSupply.toLocaleString()} Total Supply</span>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="text-center">
          <p className="text-white/80 mb-4">Start playing and earn NUNU coins today!</p>
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
