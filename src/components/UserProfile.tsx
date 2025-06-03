
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Gift, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getUserProfile } from '@/utils/userProfile';
import CrawlingCharacter from './CrawlingCharacter';

const UserProfile = () => {
  const [profile, setProfile] = useState(getUserProfile());
  const totalScore = profile.totalGameScore + profile.totalNunuCoins;

  // Refresh profile data when component is opened
  const refreshProfile = () => {
    setProfile(getUserProfile());
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          className="p-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={refreshProfile}
        >
          <CrawlingCharacter isMoving={false} />
        </motion.button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-300">Game Score</p>
              <p className="text-lg font-bold text-white">{profile.totalGameScore.toLocaleString()}</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-300">NUNU Coins</p>
              <p className="text-lg font-bold text-yellow-400">{profile.totalNunuCoins.toLocaleString()}</p>
            </div>
            
            <div className="col-span-2 bg-gradient-to-r from-purple-700 to-blue-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-200">Total Score</p>
              <p className="text-xl font-bold text-white">{totalScore.toLocaleString()}</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Gift className="w-4 h-4 text-yellow-400" />
                <p className="text-xs text-gray-300">Gifts Collected</p>
              </div>
              <p className="text-lg font-bold text-white">{profile.totalGiftsCollected}</p>
            </div>

            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Gamepad2 className="w-4 h-4 text-blue-400" />
                <p className="text-xs text-gray-300">Games Played</p>
              </div>
              <p className="text-lg font-bold text-white">{profile.totalGamesPlayed}</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfile;
