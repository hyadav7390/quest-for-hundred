
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
    console.log('Profile updated:', {
      gameScoreAdded: gameScore,
      giftScoreAdded: giftScore,
      giftsCollectedAdded: giftsCollected,
      newTotals: updatedProfile
    });
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
};
