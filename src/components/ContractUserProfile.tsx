
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Coins, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useContract } from '@/hooks/useContract';
import CrawlingCharacter from './CrawlingCharacter';

const ContractUserProfile = () => {
  const { gameState, gameStats } = useContract();
  
  // Get player's stats from contract - only the required ones
  const playerScore = gameState?.gameScore || 0;
  
  // Get global game stats
  const gamesCompleted = gameStats?.gamesCompleted || 0;
  const totalNunuEarned = gameStats?.totalNunuEarned || 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          className="p-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <CrawlingCharacter isMoving={false} />
        </motion.button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 bg-surface border border-accent-main/20">
        <div className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-text-high">On-Chain Profile</h3>
            <p className="text-xs text-text-low">Data from Smart Contract</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-surface border border-accent-main/10 rounded-lg p-4 text-center">
              <p className="text-sm text-text-low mb-2">Current Game Score</p>
              <p className="text-2xl font-bold text-accent-main">{playerScore.toLocaleString()}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface border border-accent-main/10 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Trophy className="w-4 h-4 text-success" />
                  <p className="text-xs text-text-low">Games Completed</p>
                </div>
                <p className="text-lg font-bold text-success">{gamesCompleted.toLocaleString()}</p>
              </div>
              
              <div className="bg-surface border border-accent-main/10 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Coins className="w-4 h-4 text-accent-main" />
                  <p className="text-xs text-text-low">Total NUNU Earned</p>
                </div>
                <p className="text-lg font-bold text-accent-main">{totalNunuEarned.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {gameState?.hasFinished && (
            <div className="bg-success/90 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-white">🎉 Game Completed!</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ContractUserProfile;
