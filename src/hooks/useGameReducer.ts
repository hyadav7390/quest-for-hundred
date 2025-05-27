import { useReducer } from 'react';
import { GameState, GameAction } from '@/types/game';

const generateGiftTiles = (): number[] => {
  const count = Math.floor(Math.random() * 3) + 10; // 10-12 gifts
  const tiles = new Set<number>();
  
  while (tiles.size < count) {
    const tile = Math.floor(Math.random() * 98) + 2; // tiles 2-99 (exclude 1 and 100)
    tiles.add(tile);
  }
  
  return Array.from(tiles);
};

const generateDetourTrapTiles = (giftTiles: number[]): { index: number; moveBack: number; revealed: boolean }[] => {
  const detourTrapTiles: { index: number; moveBack: number; revealed: boolean }[] = [];
  const occupiedTiles = new Set(giftTiles);
  
  // Generate 8 traps with random penalties
  for (let i = 0; i < 8; i++) {
    const penalty = Math.floor(Math.random() * 46) + 5; // 5-50 tiles back
    
    // Calculate minimum position for this penalty (must have enough tiles before it)
    const minPosition = penalty + 1;
    const maxPosition = 99; // Can't be on tile 100
    
    // Find a valid position for this trap
    let attempts = 0;
    let position;
    
    do {
      position = Math.floor(Math.random() * (maxPosition - minPosition + 1)) + minPosition;
      attempts++;
    } while (occupiedTiles.has(position) && attempts < 50);
    
    // If we couldn't find a spot after 50 attempts, skip this trap
    if (attempts >= 50) continue;
    
    detourTrapTiles.push({
      index: position,
      moveBack: penalty,
      revealed: false
    });
    occupiedTiles.add(position);
  }
  
  return detourTrapTiles;
};

const initialGiftTiles = generateGiftTiles();
const initialDetourTrapTiles = generateDetourTrapTiles(initialGiftTiles);

const initialState: GameState = {
  playerPosition: 1,
  score: 0,
  diceValue: null,
  giftTiles: initialGiftTiles,
  detourTrapTiles: initialDetourTrapTiles,
  gameStatus: 'playing',
  turnsPlayed: 0,
  giftsCollected: 0,
  detourTrapsTriggered: 0,
  isRolling: false,
  isMoving: false,
  isSoundMuted: false,
  revealedTraps: [],
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
        revealedTraps: [], // Hide all revealed traps when starting new movement
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
        giftsCollected: state.giftsCollected + 1,
        giftTiles: updatedGiftTiles,
      };
    }

    case 'REGENERATE_GIFT': {
      const updatedGiftTiles = [...state.giftTiles];
      if (!updatedGiftTiles.includes(action.payload)) {
        updatedGiftTiles.push(action.payload);
      }
      
      return {
        ...state,
        giftTiles: updatedGiftTiles,
      };
    }

    case 'REVEAL_TRAP': {
      return {
        ...state,
        revealedTraps: [...state.revealedTraps, action.payload],
      };
    }

    case 'TRIGGER_DETOUR_TRAP': {
      return {
        ...state,
        playerPosition: action.payload.newPosition,
        detourTrapsTriggered: state.detourTrapsTriggered + 1,
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

    case 'TOGGLE_SOUND':
      return {
        ...state,
        isSoundMuted: !state.isSoundMuted,
      };

    case 'RESET_GAME': {
      const newGiftTiles = generateGiftTiles();
      const newDetourTrapTiles = generateDetourTrapTiles(newGiftTiles);
      
      return {
        ...initialState,
        giftTiles: newGiftTiles,
        detourTrapTiles: newDetourTrapTiles,
        isSoundMuted: state.isSoundMuted, // Preserve sound setting
      };
    }

    default:
      return state;
  }
};

export const useGameReducer = () => {
  return useReducer(gameReducer, initialState);
};
