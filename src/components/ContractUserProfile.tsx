
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Gift, Gamepad2, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useContract } from '@/hooks/useContract';
import { formatEther } from 'viem';
import CrawlingCharacter from './CrawlingCharacter';

const ContractUserProfile = () => {
  const { gameState, leaderboard } = useContract();
  
  // Get player's stats from contract
  const playerScore = gameState?.gameScore || 0;
  const nunuCoins = gameState?.nunuEarned || 0;
  const hasFinished = gameState?.hasFinished || false;
  
  // Get total games played from leaderboard (simplified)
  const totalGamesPlayed = hasFinished ? 1 : 0;
  
  const totalScore = playerScore + nunuCoins;

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
      
      <PopoverContent className="w-80 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600">
        <div className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-white">On-Chain Profile</h3>
            <p className="text-xs text-gray-400">Data from Smart Contract</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-300">Game Score</p>
              <p className="text-lg font-bold text-white">{playerScore.toLocaleString()}</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins className="w-3 h-3 text-yellow-400" />
                <p className="text-xs text-gray-300">NUNU Coins</p>
              </div>
              <p className="text-lg font-bold text-yellow-400">{nunuCoins.toLocaleString()}</p>
            </div>
            
            <div className="col-span-2 bg-gradient-to-r from-purple-700 to-blue-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-200">Total Score</p>
              <p className="text-xl font-bold text-white">{totalScore.toLocaleString()}</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Gamepad2 className="w-4 h-4 text-blue-400" />
                <p className="text-xs text-gray-300">Games Finished</p>
              </div>
              <p className="text-lg font-bold text-white">{totalGamesPlayed}</p>
            </div>

            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-300">Position</p>
              <p className="text-lg font-bold text-white">{gameState?.position || 1}/100</p>
            </div>
          </div>
          
          {gameState?.hasFinished && (
            <div className="bg-green-700 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-white">🎉 Game Completed!</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ContractUserProfile;
