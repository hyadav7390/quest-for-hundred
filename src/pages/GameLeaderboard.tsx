
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BlockchainLeaderboard from '@/components/BlockchainLeaderboard';

const GameLeaderboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/games/hundredth-tile')}
            className="text-white hover:text-purple-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Game
          </Button>
        </motion.div>

        <BlockchainLeaderboard />
      </div>
    </div>
  );
};

export default GameLeaderboard;
