
export interface GameState {
  playerPosition: number;
  score: number;
  diceValue: number | null;
  giftTiles: number[];
  detourTrapTiles: { index: number; moveBack: number; revealed: boolean }[];
  gameStatus: 'playing' | 'won';
  turnsPlayed: number;
  giftsCollected: number;
  detourTrapsTriggered: number;
  isRolling: boolean;
  isMoving: boolean;
  isSoundMuted: boolean;
  revealedTraps: number[];
}

export type GameAction =
  | { type: 'ROLL_DICE'; payload: number }
  | { type: 'START_MOVING' }
  | { type: 'MOVE_PLAYER'; payload: number }
  | { type: 'COLLECT_GIFT'; payload: number }
  | { type: 'REGENERATE_GIFT'; payload: number }
  | { type: 'TRIGGER_DETOUR_TRAP'; payload: { newPosition: number; penalty: number; trapIndex: number } }
  | { type: 'REVEAL_TRAP'; payload: number }
  | { type: 'FINISH_TURN' }
  | { type: 'WIN_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'TOGGLE_SOUND' };

export interface TileType {
  type: 'gift' | 'detour-trap' | 'normal';
  moveBack?: number;
  revealed?: boolean;
}
