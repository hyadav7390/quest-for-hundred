
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BlockchainLeaderboard from '@/components/BlockchainLeaderboard';

const GameLeaderboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary p-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button - always above the panel, centered on mobile */}
        <div className="mb-4 flex justify-center sm:justify-start">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/game')}
            className="text-white hover:text-accent-main transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Game
          </Button>
        </div>

        {/* Leaderboard Panel */}
        <BlockchainLeaderboard />
      </div>
    </div>
  );
};

export default GameLeaderboard;
