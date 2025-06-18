
import { useReducer, useEffect, useCallback } from 'react';
import { GameState, GameAction } from '@/types/game';
import { useContract } from './useContract';
import { toast } from 'sonner';

// Pure UI state - no game logic, just UI animations and display
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
    case 'START_DICE_ANIMATION':
      console.log('🎲 [UI] Starting dice roll animation');
      return {
        ...state,
        isRolling: true,
        diceValue: null,
      };

    case 'STOP_DICE_ANIMATION':
      console.log('🎲 [UI] Stopping dice roll animation with value:', action.payload);
      return {
        ...state,
        isRolling: false,
        diceValue: action.payload,
      };

    case 'START_MOVING':
      console.log('🚶 [UI] Starting player movement animation');
      return {
        ...state,
        isMoving: true,
      };

    case 'STOP_MOVING':
      console.log('🚶 [UI] Stopping player movement animation');
      return {
        ...state,
        isMoving: false,
      };

    case 'UPDATE_FROM_CONTRACT': {
      const { position, score, nunuEarned, hasFinished, diceValue } = action.payload;
      console.log('📊 [UI] Updating from contract:', action.payload);
      
      // Check if player moved to trigger animations
      const oldPosition = state.playerPosition;
      const newPosition = position;
      const positionChanged = oldPosition !== newPosition;
      
      // Calculate UI stats based on contract data
      const giftTilesOnPath = state.giftTiles.filter(
        tile => tile.index > oldPosition && tile.index <= newPosition
      );
      const detourTrapsOnPath = state.detourTrapTiles.filter(
        trap => trap.index > oldPosition && trap.index <= newPosition
      );
      const shortcutGatesOnPath = state.shortcutGateTiles.filter(
        gate => gate.index > oldPosition && gate.index <= newPosition
      );
      
      return {
        ...state,
        playerPosition: newPosition,
        score: score,
        diceValue: diceValue || state.diceValue,
        gameStatus: hasFinished ? 'won' : 'playing',
        isMoving: positionChanged,
        turnsPlayed: diceValue && positionChanged ? state.turnsPlayed + 1 : state.turnsPlayed,
        giftsCollected: state.giftsCollected + giftTilesOnPath.length,
        detourTrapsTriggered: state.detourTrapsTriggered + detourTrapsOnPath.length,
        shortcutGatesTriggered: state.shortcutGatesTriggered + shortcutGatesOnPath.length,
        diceRolled: diceValue > 0,
      };
    }

    case 'UPDATE_BOARD_DATA': {
      const { giftTiles, detourTrapTiles, shortcutGateTiles } = action.payload;
      console.log('📋 [UI] Updating board data:', {
        gifts: giftTiles.length,
        detours: detourTrapTiles.length,
        shortcuts: shortcutGateTiles.length
      });
      
      return {
        ...state,
        giftTiles,
        detourTrapTiles: detourTrapTiles.map(trap => ({ ...trap, revealed: false })),
        shortcutGateTiles: shortcutGateTiles.map(gate => ({ ...gate, revealed: false })),
      };
    }

    case 'WIN_GAME':
      console.log('🏆 [UI] Game won!');
      return {
        ...state,
        gameStatus: 'won',
        isMoving: false,
        isRolling: false,
      };

    case 'TOGGLE_SOUND':
      return {
        ...state,
        isSoundMuted: !state.isSoundMuted,
      };

    case 'RESET_GAME': {
      console.log('🔄 [UI] Resetting game state');
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
  const { 
    gameState: contractState, 
    boardData,
    isLoading,
    isWaitingForVRF,
    startGame, 
    rollDice, 
    isConnected,
    fetchAllGameData,
    playerRank
  } = useContract();

  // Sync contract state with UI state
  useEffect(() => {
    if (contractState) {
      console.log('🔄 [SYNC] Syncing contract state to UI:', contractState);
      
      // Stop dice animation when we get actual dice value from contract
      if (contractState.diceValue > 0 && state.isRolling) {
        dispatch({ type: 'STOP_DICE_ANIMATION', payload: contractState.diceValue });
      }
      
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

      // Handle game completion
      if (contractState.hasFinished && state.gameStatus !== 'won') {
        setTimeout(() => {
          dispatch({ type: 'WIN_GAME' });
        }, 2000); // Wait for animations to complete
      }

      // Stop movement animation after some time
      if (state.isMoving) {
        setTimeout(() => {
          dispatch({ type: 'STOP_MOVING' });
        }, 2000);
      }
    }
  }, [contractState, state.isRolling, state.gameStatus, state.isMoving]);

  // Sync board data from contract
  useEffect(() => {
    if (boardData) {
      console.log('📋 [SYNC] Syncing board data to UI');
      dispatch({
        type: 'UPDATE_BOARD_DATA',
        payload: boardData
      });
    }
  }, [boardData]);

  // Enhanced roll dice function that only handles UI animations
  const handleRollDice = useCallback(async () => {
    if (!isConnected) {
      console.log('⚠️ [ACTION] Wallet not connected for dice roll');
      toast.error('Please connect your wallet to play');
      return;
    }

    if (state.isRolling || isLoading || isWaitingForVRF) {
      console.log('⚠️ [ACTION] Already rolling or loading, ignoring dice roll request');
      return;
    }

    if (!contractState?.boardGenerated) {
      console.log('⚠️ [ACTION] Game not started');
      toast.error('Please start a game first');
      return;
    }

    try {
      console.log('🎲 [ACTION] Starting dice roll sequence...');
      
      // Start UI dice animation immediately
      dispatch({ type: 'START_DICE_ANIMATION' });
      
      // Call contract roll dice - this will trigger VRF and events
      await rollDice(contractState.position);
      
    } catch (error) {
      console.error('❌ [ACTION] Error in dice roll sequence:', error);
      dispatch({ type: 'STOP_DICE_ANIMATION', payload: 1 });
    }
  }, [isConnected, state.isRolling, isLoading, isWaitingForVRF, contractState, rollDice]);

  // Enhanced start game function
  const handleStartGame = useCallback(async () => {
    if (!isConnected) {
      console.log('⚠️ [ACTION] Wallet not connected for game start');
      toast.error('Please connect your wallet to start a new game');
      return;
    }

    try {
      console.log('🎮 [ACTION] Starting new game sequence...');
      dispatch({ type: 'RESET_GAME' });
      await startGame();
      
    } catch (error) {
      console.error('❌ [ACTION] Error in start game sequence:', error);
      toast.error('Failed to start new game');
    }
  }, [isConnected, startGame]);

  return [
    {
      ...state,
      isRolling: state.isRolling || isWaitingForVRF,
      isMoving: state.isMoving,
    },
    {
      dispatch,
      rollDice: handleRollDice,
      startGame: handleStartGame,
    },
    {
      contractState,
      isConnected,
      isLoading,
      isWaitingForVRF,
      playerRank,
      CONTRACT_ADDRESS: '0x2a255fd23e3806f472ef68acba79adbc5c3ae3e8'
    }
  ] as const;
};
