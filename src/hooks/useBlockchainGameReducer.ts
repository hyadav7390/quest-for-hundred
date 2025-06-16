import { useReducer, useEffect, useCallback } from 'react';
import { GameState, GameAction } from '@/types/game';
import { useContract } from './useContract';
import { toast } from 'sonner';

// Modified initial state for blockchain integration
const initialState: GameState = {
  playerPosition: 1,
  score: 0,
  diceValue: null,
  giftTiles: [],
  detourTrapTiles: [],
  shortcutGateTiles: [],
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

const blockchainGameReducer = (state: GameState, action: GameAction): GameState => {
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
      };

    case 'MOVE_PLAYER': {
      const newPosition = Math.min(action.payload, 100);
      
      return {
        ...state,
        playerPosition: newPosition,
        isMoving: false,
      };
    }

    case 'UPDATE_FROM_CONTRACT': {
      const { position, score, nunuEarned, hasFinished, diceValue } = action.payload;
      
      // Check if player moved to trigger animations
      const oldPosition = state.playerPosition;
      const newPosition = position;
      const positionChanged = oldPosition !== newPosition;
      
      return {
        ...state,
        playerPosition: newPosition,
        score: score,
        diceValue: diceValue || state.diceValue,
        gameStatus: hasFinished ? 'won' : 'playing',
        isRolling: false,
        isMoving: positionChanged,
        turnsPlayed: diceValue && positionChanged ? state.turnsPlayed + 1 : state.turnsPlayed,
      };
    }

    case 'COLLECT_GIFT': {
      return {
        ...state,
        giftsCollected: state.giftsCollected + 1,
      };
    }

    case 'TRIGGER_DETOUR_TRAP': {
      return {
        ...state,
        detourTrapsTriggered: state.detourTrapsTriggered + 1,
      };
    }

    case 'TRIGGER_SHORTCUT_GATE': {
      return {
        ...state,
        shortcutGatesTriggered: state.shortcutGatesTriggered + 1,
      };
    }

    case 'FINISH_TURN':
      const newTurns = state.turnsPlayed + 1;
      return {
        ...state,
        turnsPlayed: newTurns,
        isMoving: false,
        isRolling: false,
      };

    case 'WIN_GAME':
      return {
        ...state,
        gameStatus: 'won',
        isMoving: false,
      };

    case 'TOGGLE_SOUND':
      return {
        ...state,
        isSoundMuted: !state.isSoundMuted,
      };

    case 'RESET_GAME': {
      return {
        ...initialState,
        isSoundMuted: state.isSoundMuted, // Preserve sound setting
      };
    }

    default:
      return state;
  }
};

export const useBlockchainGameReducer = () => {
  const [state, dispatch] = useReducer(blockchainGameReducer, initialState);
  const { gameState: contractState, boardData, isLoading, startGame, rollDice, isConnected } = useContract();

  // Track tile interactions
  const checkTileInteraction = useCallback((position: number) => {
    if (!boardData) return;

    // Check for gift tiles
    const giftTile = boardData.giftTiles.find(tile => tile.index === position);
    if (giftTile) {
      dispatch({ type: 'COLLECT_GIFT', payload: { tileIndex: position, points: giftTile.points } });
      return;
    }

    // Check for detour trap tiles
    const detourTrap = boardData.detourTrapTiles.find(tile => tile.index === position);
    if (detourTrap) {
      dispatch({ type: 'TRIGGER_DETOUR_TRAP', payload: { newPosition: position, penalty: detourTrap.moveBack, trapIndex: position } });
      return;
    }

    // Check for shortcut gate tiles
    const shortcutGate = boardData.shortcutGateTiles.find(tile => tile.index === position);
    if (shortcutGate) {
      dispatch({ type: 'TRIGGER_SHORTCUT_GATE', payload: { newPosition: position, bonus: shortcutGate.moveForward, gateIndex: position } });
      return;
    }
  }, [boardData]);

  // Sync contract state with local state
  useEffect(() => {
    if (contractState) {
      const oldPosition = state.playerPosition;
      
      dispatch({
        type: 'UPDATE_FROM_CONTRACT',
        payload: {
          position: contractState.position,
          score: contractState.gameScore,
          nunuEarned: contractState.nunuEarned,
          hasFinished: contractState.hasFinished,
          diceValue: contractState.diceValue
        }
      });

      // Check for tile interactions when position changes
      if (oldPosition !== contractState.position && contractState.position > 1) {
        setTimeout(() => {
          checkTileInteraction(contractState.position);
          dispatch({ type: 'FINISH_TURN' });
        }, 1500); // Give time for movement animation
      }

      if (contractState.hasFinished && state.gameStatus !== 'won') {
        dispatch({ type: 'WIN_GAME' });
      }
    }
  }, [contractState, checkTileInteraction, state.gameStatus, state.playerPosition]);

  // Sync board data from contract
  useEffect(() => {
    if (boardData) {
      dispatch({
        type: 'UPDATE_BOARD_DATA',
        payload: boardData
      });
    }
  }, [boardData]);

  // Enhanced roll dice function that interacts with contract
  const handleRollDice = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to play');
      return;
    }

    if (state.isRolling || isLoading) return;

    try {
      // Start rolling animation with random value first
      dispatch({ type: 'ROLL_DICE', payload: Math.floor(Math.random() * 6) + 1 });
      
      // Call contract roll dice
      await rollDice(state.playerPosition);
      
    } catch (error) {
      console.error('Error rolling dice:', error);
      dispatch({ type: 'FINISH_TURN' });
    }
  };

  // Enhanced start game function
  const handleStartGame = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to start a new game');
      return;
    }

    try {
      await startGame();
      dispatch({ type: 'RESET_GAME' });
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start new game');
    }
  };

  return [
    {
      ...state,
      isRolling: state.isRolling || isLoading,
      isMoving: state.isMoving || isLoading,
    },
    {
      dispatch,
      rollDice: handleRollDice,
      startGame: handleStartGame,
    },
    {
      contractState,
      isConnected,
      CONTRACT_ADDRESS: '0x2a255fd23e3806f472ef68acba79adbc5c3ae3e8'
    }
  ] as const;
};
