
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getUserProfile } from '@/utils/userProfile';

const UserProfile = () => {
  const [profile] = useState(getUserProfile());
  const totalScore = profile.totalGameScore + profile.totalGiftScore;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <User className="w-6 h-6" />
        </motion.button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Player Profile</h3>
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-300">Game Score</p>
              <p className="text-lg font-bold text-white">{profile.totalGameScore.toLocaleString()}</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-300">Gift Score</p>
              <p className="text-lg font-bold text-yellow-400">{profile.totalGiftScore.toLocaleString()}</p>
            </div>
            
            <div className="col-span-2 bg-gradient-to-r from-purple-700 to-blue-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-200">Total Score</p>
              <p className="text-xl font-bold text-white">{totalScore.toLocaleString()}</p>
            </div>
            
            <div className="col-span-2 bg-gray-700 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Gift className="w-4 h-4 text-yellow-400" />
                <p className="text-xs text-gray-300">Gifts Collected</p>
              </div>
              <p className="text-lg font-bold text-white">{profile.totalGiftsCollected}</p>
            </div>
          </div>
          
          <Button 
            disabled 
            className="w-full bg-gray-600 text-gray-400 cursor-not-allowed"
          >
            Redeem Gifts (Coming Soon)
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfile;
