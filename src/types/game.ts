export interface GameState {
  playerPosition: number;
  score: number;
  diceValue: number | null;
  giftTiles: { index: number; points: number }[];
  detourTrapTiles: { index: number; moveBack: number; revealed: boolean }[];
  shortcutGateTiles: { index: number; moveForward: number; revealed: boolean }[];
  gameStatus: 'playing' | 'won';
  turnsPlayed: number;
  giftsCollected: number;
  detourTrapsTriggered: number;
  shortcutGatesTriggered: number;
  isRolling: boolean;
  isMoving: boolean;
  isSoundMuted: boolean;
  revealedTraps: number[];
  revealedGates: number[];
  diceRolled: boolean;
  finalPosition?: number; // For delayed position updates after door animations
}

export type GameAction =
  | { type: 'START_DICE_ANIMATION' }
  | { type: 'STOP_DICE_ANIMATION'; payload: number }
  | { type: 'START_MOVING' }
  | { type: 'STOP_MOVING' }
  | { type: 'WIN_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'UPDATE_FROM_CONTRACT'; payload: { position: number; score: number; nunuEarned: number; hasFinished: boolean; diceValue?: number } }
  | { type: 'UPDATE_BOARD_DATA'; payload: { giftTiles: { index: number; points: number }[]; detourTrapTiles: { index: number; moveBack: number }[]; shortcutGateTiles: { index: number; moveForward: number }[] } }
  | { type: 'COMPLETE_DOOR_ANIMATION' };

export interface TileType {
  type: 'gift' | 'detour-trap' | 'shortcut-gate' | 'normal';
  moveBack?: number;
  moveForward?: number;
  points?: number;
  revealed?: boolean;
}

export interface UserProfile {
  totalGameScore: number;
  totalNunuCoins: number;
  totalGiftsCollected: number;
  totalGamesPlayed: number;
}

export interface GameInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  isAvailable: boolean;
  comingSoon?: boolean;
}
