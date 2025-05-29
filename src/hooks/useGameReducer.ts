
import { useReducer } from 'react';
import { GameState, GameAction } from '@/types/game';

const GIFT_DISTRIBUTION = [
  { points: 50, count: 3 },
  { points: 110, count: 2 },
  { points: 150, count: 2 },
  { points: 200, count: 2 },
  { points: 230, count: 1 },
  { points: 250, count: 1 },
  { points: 300, count: 1 },
];

const generateGiftTiles = (): { index: number; points: number }[] => {
  const gifts: { index: number; points: number }[] = [];
  const occupiedTiles = new Set<number>();
  
  // Create all 12 gifts based on distribution
  for (const giftType of GIFT_DISTRIBUTION) {
    for (let i = 0; i < giftType.count; i++) {
      let position;
      let attempts = 0;
      
      do {
        position = Math.floor(Math.random() * 98) + 2; // tiles 2-99
        attempts++;
      } while (occupiedTiles.has(position) && attempts < 100);
      
      if (attempts < 100) {
        gifts.push({ index: position, points: giftType.points });
        occupiedTiles.add(position);
      }
    }
  }
  
  return gifts;
};

const generateShortcutGateTiles = (occupiedTiles: Set<number>): { index: number; moveForward: number; revealed: boolean }[] => {
  const gates: { index: number; moveForward: number; revealed: boolean }[] = [];
  
  for (let i = 0; i < 4; i++) {
    const moveForward = Math.floor(Math.random() * 16) + 5; // 5-20 tiles forward
    let position;
    let attempts = 0;
    
    do {
      position = Math.floor(Math.random() * 80) + 2; // tiles 2-81 (so max forward is 99)
      attempts++;
    } while (occupiedTiles.has(position) && attempts < 100);
    
    if (attempts < 100) {
      gates.push({
        index: position,
        moveForward,
        revealed: false
      });
      occupiedTiles.add(position);
    }
  }
  
  return gates;
};

const generateDetourTrapTiles = (occupiedTiles: Set<number>): { index: number; moveBack: number; revealed: boolean }[] => {
  const detourTrapTiles: { index: number; moveBack: number; revealed: boolean }[] = [];
  
  // Generate 8 traps with strategic placement
  const penalties = [];
  for (let i = 0; i < 8; i++) {
    penalties.push(Math.floor(Math.random() * 46) + 5); // 5-50 tiles back
  }
  
  // Sort penalties in descending order (highest penalties first)
  penalties.sort((a, b) => b - a);
  
  for (const penalty of penalties) {
    // Calculate valid positions for this penalty
    const minPosition = penalty + 1; // Must have enough tiles before it
    const maxPosition = 99; // Can't be on tile 100
    
    if (minPosition > maxPosition) continue; // Skip if impossible
    
    let position;
    let attempts = 0;
    let wouldOverlap;
    
    do {
      position = Math.floor(Math.random() * (maxPosition - minPosition + 1)) + minPosition;
      
      // Check if this position would cause overlap with existing traps
      const backPosition = Math.max(1, position - penalty);
      wouldOverlap = detourTrapTiles.some(trap => backPosition === trap.index);
      
      attempts++;
    } while ((occupiedTiles.has(position) || wouldOverlap) && attempts < 100);
    
    // If we couldn't find a spot after 100 attempts, skip this trap
    if (attempts >= 100) continue;
    
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
const initialOccupiedTiles = new Set(initialGiftTiles.map(gift => gift.index));
const initialShortcutGateTiles = generateShortcutGateTiles(initialOccupiedTiles);
initialShortcutGateTiles.forEach(gate => initialOccupiedTiles.add(gate.index));
const initialDetourTrapTiles = generateDetourTrapTiles(initialOccupiedTiles);

const initialState: GameState = {
  playerPosition: 1,
  score: 0,
  diceValue: null,
  giftTiles: initialGiftTiles,
  detourTrapTiles: initialDetourTrapTiles,
  shortcutGateTiles: initialShortcutGateTiles,
  gameStatus: 'playing',
  turnsPlayed: 0,
  giftsCollected: 0,
  detourTrapsTriggered: 0,
  shortcutGatesTriggered: 0,
  isRolling: false,
  isMoving: false,
  isSoundMuted: false,
  revealedTraps: [],
  revealedGates: [],
  diceRolled: false,
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'ROLL_DICE':
      return {
        ...state,
        diceValue: action.payload,
        isRolling: true,
        diceRolled: true,
      };

    case 'START_MOVING':
      return {
        ...state,
        isRolling: false,
        isMoving: true,
        revealedTraps: [],
        revealedGates: [],
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
      const updatedGiftTiles = state.giftTiles.filter(gift => gift.index !== action.payload.tileIndex);
      
      return {
        ...state,
        score: state.score + action.payload.points,
        giftsCollected: state.giftsCollected + 1,
        giftTiles: updatedGiftTiles,
      };
    }

    case 'REGENERATE_GIFT': {
      const updatedGiftTiles = [...state.giftTiles];
      if (!updatedGiftTiles.some(gift => gift.index === action.payload.index)) {
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

    case 'REVEAL_GATE': {
      return {
        ...state,
        revealedGates: [...state.revealedGates, action.payload],
      };
    }

    case 'TRIGGER_DETOUR_TRAP': {
      return {
        ...state,
        playerPosition: action.payload.newPosition,
        detourTrapsTriggered: state.detourTrapsTriggered + 1,
      };
    }

    case 'TRIGGER_SHORTCUT_GATE': {
      return {
        ...state,
        playerPosition: action.payload.newPosition,
        shortcutGatesTriggered: state.shortcutGatesTriggered + 1,
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
        score: state.score + 1000, // Finish bonus
        isMoving: false,
      };

    case 'TOGGLE_SOUND':
      return {
        ...state,
        isSoundMuted: !state.isSoundMuted,
      };

    case 'RESET_GAME': {
      const newGiftTiles = generateGiftTiles();
      const newOccupiedTiles = new Set(newGiftTiles.map(gift => gift.index));
      const newShortcutGateTiles = generateShortcutGateTiles(newOccupiedTiles);
      newShortcutGateTiles.forEach(gate => newOccupiedTiles.add(gate.index));
      const newDetourTrapTiles = generateDetourTrapTiles(newOccupiedTiles);
      
      return {
        ...initialState,
        giftTiles: newGiftTiles,
        detourTrapTiles: newDetourTrapTiles,
        shortcutGateTiles: newShortcutGateTiles,
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
