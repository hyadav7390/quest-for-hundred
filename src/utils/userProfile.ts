
import { UserProfile } from '@/types/game';

const USER_PROFILE_KEY = 'nunugames_user_profile';

export const getUserProfile = (): UserProfile => {
  try {
    const stored = localStorage.getItem(USER_PROFILE_KEY);
    if (stored) {
      const profile = JSON.parse(stored);
      // Migration: Convert old giftScore to nunuCoins if needed
      if (profile.totalGiftScore !== undefined && profile.totalNunuCoins === undefined) {
        profile.totalNunuCoins = profile.totalGiftScore;
        delete profile.totalGiftScore;
      }
      // Add totalGamesPlayed if it doesn't exist
      if (profile.totalGamesPlayed === undefined) {
        profile.totalGamesPlayed = 0;
      }
      return profile;
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
  
  return {
    totalGameScore: 0,
    totalNunuCoins: 0,
    totalGiftsCollected: 0,
    totalGamesPlayed: 0,
  };
};

export const updateUserProfile = (gameScore: number, nunuCoins: number, giftsCollected: number, gameCompleted: boolean = false): void => {
  try {
    const currentProfile = getUserProfile();
    const updatedProfile: UserProfile = {
      totalGameScore: currentProfile.totalGameScore + gameScore,
      totalNunuCoins: currentProfile.totalNunuCoins + nunuCoins,
      totalGiftsCollected: currentProfile.totalGiftsCollected + giftsCollected,
      totalGamesPlayed: currentProfile.totalGamesPlayed + (gameCompleted ? 1 : 0),
    };
    
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
    console.log('Profile updated:', {
      gameScoreAdded: gameScore,
      nunuCoinsAdded: nunuCoins,
      giftsCollectedAdded: giftsCollected,
      gameCompleted,
      newTotals: updatedProfile
    });
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
};
