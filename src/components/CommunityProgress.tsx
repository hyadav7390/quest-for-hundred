
import { motion } from 'framer-motion';
import { Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CommunityProgress = () => {
  const navigate = useNavigate();
  
  // Mock data - in real app this would come from backend
  const totalProgress = 12847;
  const targetProgress = 1000000;
  const progressPercentage = (totalProgress / targetProgress) * 100;
  
  const milestones = [
    { level: 25, target: 250000, completed: false },
    { level: 50, target: 500000, completed: false },
    { level: 75, target: 750000, completed: false },
    { level: 100, target: 1000000, completed: false },
  ];

  const getProgressBarColor = () => {
    if (progressPercentage === 0) return 'bg-surface';
    if (progressPercentage >= 100) return 'bg-accent-main shadow-glow';
    return 'bg-accent-main/70';
  };

  return (
    <section className="panel max-w-4xl mx-auto mt-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <h2 className="font-heading text-heading-2 text-white">Community Quest Progress</h2>
          <div className="group relative">
            <Info className="w-5 h-5 text-white/60 hover:text-accent-main transition-colors cursor-help" />
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-surface border border-accent-main/30 rounded-lg p-3 text-sm text-white/90 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Community progress unlocks rewards for all players
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative mb-6">
          <div className="h-16 bg-surface rounded-lg border border-accent-main/20 overflow-hidden relative">
            <motion.div
              className={`h-full ${getProgressBarColor()} transition-all duration-1000`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            
            {/* Progress Percentage Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-heading text-4xl text-white font-bold">
                {Math.round(progressPercentage * 100) / 100}%
              </span>
            </div>
          </div>
          
          {/* Progress Text */}
          <div className="flex justify-between items-center mt-2 text-sm text-white/60">
            <span>{totalProgress.toLocaleString()} NUNU Coins</span>
            <span>{targetProgress.toLocaleString()} Target</span>
          </div>
        </div>

        {/* Milestone Chips */}
        <div className="flex flex-wrap gap-3 mb-8">
          {milestones.map((milestone, index) => {
            const isCompleted = totalProgress >= milestone.target;
            const isCurrent = !isCompleted && (index === 0 || totalProgress >= milestones[index - 1].target);
            
            return (
              <motion.div
                key={milestone.level}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-accent-main border-accent-main text-bg-primary' 
                    : isCurrent
                    ? 'bg-surface border-accent-main text-accent-main'
                    : 'bg-surface border-white/10 text-white/60'
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                {isCompleted && <CheckCircle className="w-4 h-4" />}
                <span className="text-sm font-medium">Level {milestone.level}</span>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Footer */}
        <div className="text-center">
          <p className="text-white/80 mb-4">Contribute by playing and earn NUNU coins!</p>
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
