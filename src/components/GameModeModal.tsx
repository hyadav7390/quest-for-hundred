import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Users, Play, Target, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'single' | 'multi') => void;
}

const GameModeModal = ({ isOpen, onClose, onSelectMode }: GameModeModalProps) => {
  const modes = [
    {
      id: 'single' as const,
      title: 'Single Player',
      description: 'Play solo and build your own adventure',
      icon: <User className="w-8 h-8" />,
      features: [
        'Your own private game board',
        'No time pressure',
        'Perfect for beginners',
        'Earn $ROLL tokens'
      ],
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-500/30'
    },
    {
      id: 'multi' as const,
      title: 'Multiplayer',
      description: 'Compete with players worldwide',
      icon: <Users className="w-8 h-8" />,
      features: [
        'Rug other players!',
        'Unlimited chances',
        'Win MONAD',
        'Global competition'
      ],
      color: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-500/30'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-surface border border-accent-main/20 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-heading font-bold text-white mb-2">
                  Choose Your Game Mode
                </h2>
                <p className="text-white/70">
                  Select how you want to play RUGGROLL
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Game Modes Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {modes.map((mode) => (
                <motion.div
                  key={mode.id}
                  className={`relative p-6 rounded-xl border-2 ${mode.borderColor} bg-surface hover:border-accent-main/50 transition-all duration-300 cursor-pointer group`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectMode(mode.id)}
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${mode.color} mb-4`}>
                      <div className="text-white">
                        {mode.icon}
                      </div>
                    </div>

                    {/* Title and Description */}
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {mode.title}
                    </h3>
                    <p className="text-white/70 mb-4">
                      {mode.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      {mode.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-white/80">
                          <div className="w-1.5 h-1.5 bg-accent-main rounded-full mr-3" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Select Button */}
                    <Button
                      className={`w-full bg-gradient-to-r ${mode.color} hover:shadow-lg transition-all duration-300`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Select {mode.title}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center pt-6 border-t border-accent-main/20">
              <p className="text-white/60 text-sm">
                Let's RUGG!
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameModeModal; 