
import { useReducer, useEffect } from 'react';
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
      
      return {
        ...state,
        playerPosition: position,
        score: score,
        diceValue: diceValue || state.diceValue,
        gameStatus: hasFinished ? 'won' : 'playing',
        isRolling: false,
        isMoving: false,
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
  const { gameState: contractState, isLoading, startGame, rollDice, isConnected } = useContract();

  // Sync contract state with local state
  useEffect(() => {
    if (contractState) {
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

      if (contractState.hasFinished && state.gameStatus !== 'won') {
        dispatch({ type: 'WIN_GAME' });
      }
    }
  }, [contractState, state.gameStatus]);

  // Enhanced roll dice function that interacts with contract
  const handleRollDice = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to play');
      return;
    }

    if (state.isRolling || isLoading) return;

    try {
      dispatch({ type: 'ROLL_DICE', payload: Math.floor(Math.random() * 6) + 1 });
      
      // Call contract roll dice
      await rollDice(state.playerPosition);
      
    } catch (error) {
      console.error('Error rolling dice:', error);
      // Reset rolling state on error
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
      ...dispatch,
      rollDice: handleRollDice,
      startGame: handleStartGame,
    },
    {
      contractState,
      isConnected,
      CONTRACT_ADDRESS: '0x0000000000000000000000000000000000000000' // TODO: Update with actual address
    }
  ] as const;
};
