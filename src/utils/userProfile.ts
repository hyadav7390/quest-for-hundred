
import { UserProfile } from '@/types/game';

const USER_PROFILE_KEY = 'nunugames_user_profile';

export const getUserProfile = (): UserProfile => {
  try {
    const stored = localStorage.getItem(USER_PROFILE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
  
  return {
    totalGameScore: 0,
    totalGiftScore: 0,
    totalGiftsCollected: 0,
  };
};

export const updateUserProfile = (gameScore: number, giftScore: number, giftsCollected: number): void => {
  try {
    const currentProfile = getUserProfile();
    const updatedProfile: UserProfile = {
      totalGameScore: currentProfile.totalGameScore + gameScore,
      totalGiftScore: currentProfile.totalGiftScore + giftScore,
      totalGiftsCollected: currentProfile.totalGiftsCollected + giftsCollected,
    };
    
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
    console.log('Profile updated:', updatedProfile);
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
};

export const getGiftScoreFromState = (gameState: any): number => {
  // Calculate gift score from collected gifts
  const initialGiftTiles = [
    { points: 50, count: 3 },
    { points: 110, count: 2 },
    { points: 150, count: 2 },
    { points: 200, count: 2 },
    { points: 230, count: 1 },
    { points: 250, count: 1 },
    { points: 300, count: 1 },
  ];
  
  const totalInitialGifts = initialGiftTiles.reduce((sum, gift) => sum + gift.count, 0);
  const remainingGifts = gameState.giftTiles.length;
  const collectedGiftsCount = totalInitialGifts - remainingGifts;
  
  // This is a simplified calculation - in a real scenario, we'd track exact gifts collected
  return collectedGiftsCount * 150; // Average gift value
};
