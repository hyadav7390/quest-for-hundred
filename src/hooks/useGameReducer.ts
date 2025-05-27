
import { useReducer } from 'react';
import { GameState, GameAction } from '@/types/game';

const generateGiftTiles = (): number[] => {
  const count = Math.floor(Math.random() * 3) + 10; // 10-12 gifts
  const tiles = new Set<number>();
  
  while (tiles.size < count) {
    const tile = Math.floor(Math.random() * 99) + 2; // tiles 2-100
    tiles.add(tile);
  }
  
  return Array.from(tiles);
};

const generateBounceBackTiles = (giftTiles: number[]): { index: number; moveBack: number }[] => {
  const bounceBackTiles: { index: number; moveBack: number }[] = [];
  const occupiedTiles = new Set(giftTiles);
  
  while (bounceBackTiles.length < 8) {
    const tile = Math.floor(Math.random() * 99) + 2; // tiles 2-100
    if (!occupiedTiles.has(tile)) {
      const moveBack = Math.floor(Math.random() * 46) + 5; // 5-50 tiles back
      bounceBackTiles.push({ index: tile, moveBack });
      occupiedTiles.add(tile);
    }
  }
  
  return bounceBackTiles;
};

const initialGiftTiles = generateGiftTiles();
const initialBounceBackTiles = generateBounceBackTiles(initialGiftTiles);

const initialState: GameState = {
  playerPosition: 1,
  score: 0,
  diceValue: null,
  giftTiles: initialGiftTiles,
  bounceBackTiles: initialBounceBackTiles,
  gameStatus: 'playing',
  turnsPlayed: 0,
  giftsCollected: 0,
  bounceBacksTriggered: 0,
  isRolling: false,
  isMoving: false,
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'ROLL_DICE':
      return {
        ...state,
        diceValue: action.payload,
        isRolling: true,
      };

    case 'START_MOVING':
      return {
        ...state,
        isRolling: false,
        isMoving: true,
      };

    case 'MOVE_PLAYER': {
      const newPosition = Math.min(action.payload, 100);
      const movementPoints = (newPosition - state.playerPosition) * 10;
      
      return {
        ...state,
        playerPosition: newPosition,
        score: state.score + Math.max(0, movementPoints),
      };
    }

    case 'COLLECT_GIFT': {
      const giftPoints = Math.floor(Math.random() * 51) + 50; // 50-100 points
      const updatedGiftTiles = state.giftTiles.filter(tile => tile !== action.payload);
      
      return {
        ...state,
        score: state.score + giftPoints,
        giftTiles: updatedGiftTiles,
        giftsCollected: state.giftsCollected + 1,
      };
    }

    case 'TRIGGER_BOUNCEBACK': {
      return {
        ...state,
        playerPosition: action.payload.newPosition,
        bounceBacksTriggered: state.bounceBacksTriggered + 1,
      };
    }

    case 'FINISH_TURN':
      const newTurns = state.turnsPlayed + 1;
      return {
        ...state,
        turnsPlayed: newTurns,
        isMoving: false,
      };

    case 'WIN_GAME':
      return {
        ...state,
        gameStatus: 'won',
        score: state.score + 100, // Finish bonus
        isMoving: false,
      };

    case 'RESET_GAME': {
      const newGiftTiles = generateGiftTiles();
      const newBounceBackTiles = generateBounceBackTiles(newGiftTiles);
      
      return {
        ...initialState,
        giftTiles: newGiftTiles,
        bounceBackTiles: newBounceBackTiles,
      };
    }

    default:
      return state;
  }
};

export const useGameReducer = () => {
  return useReducer(gameReducer, initialState);
};
