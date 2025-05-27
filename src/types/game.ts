
export interface GameState {
  playerPosition: number;
  score: number;
  diceValue: number | null;
  giftTiles: number[];
  bounceBackTiles: { index: number; moveBack: number }[];
  gameStatus: 'playing' | 'won';
  turnsPlayed: number;
  giftsCollected: number;
  bounceBacksTriggered: number;
  isRolling: boolean;
  isMoving: boolean;
}

export type GameAction =
  | { type: 'ROLL_DICE'; payload: number }
  | { type: 'START_MOVING' }
  | { type: 'MOVE_PLAYER'; payload: number }
  | { type: 'COLLECT_GIFT'; payload: number }
  | { type: 'TRIGGER_BOUNCEBACK'; payload: { newPosition: number; penalty: number } }
  | { type: 'FINISH_TURN' }
  | { type: 'WIN_GAME' }
  | { type: 'RESET_GAME' };
