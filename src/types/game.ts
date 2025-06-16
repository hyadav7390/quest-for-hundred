
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
}

export type GameAction =
  | { type: 'ROLL_DICE'; payload: number }
  | { type: 'START_MOVING' }
  | { type: 'MOVE_PLAYER'; payload: number }
  | { type: 'COLLECT_GIFT'; payload: { tileIndex: number; points: number } }
  | { type: 'REGENERATE_GIFT'; payload: { index: number; points: number } }
  | { type: 'TRIGGER_DETOUR_TRAP'; payload: { newPosition: number; penalty: number; trapIndex: number } }
  | { type: 'TRIGGER_SHORTCUT_GATE'; payload: { newPosition: number; bonus: number; gateIndex: number } }
  | { type: 'REVEAL_TRAP'; payload: number }
  | { type: 'REVEAL_GATE'; payload: number }
  | { type: 'FINISH_TURN' }
  | { type: 'WIN_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'UPDATE_FROM_CONTRACT'; payload: { position: number; score: number; nunuEarned: number; hasFinished: boolean; diceValue?: number } }
  | { type: 'UPDATE_BOARD_DATA'; payload: { giftTiles: { index: number; points: number }[]; detourTrapTiles: { index: number; moveBack: number }[]; shortcutGateTiles: { index: number; moveForward: number }[] } };

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
