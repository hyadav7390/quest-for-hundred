
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

// Game statistics management in localStorage
const getGameStats = () => {
  try {
    const stats = localStorage.getItem('hundredthTileGameStats');
    return stats ? JSON.parse(stats) : {
      totalGamesPlayed: 0,
      totalDiceRolled: 0,
      totalGiftsCollected: 0,
      totalDetourTrapsTriggered: 0,
      totalShortcutGatesTriggered: 0
    };
  } catch {
    return {
      totalGamesPlayed: 0,
      totalDiceRolled: 0,
      totalGiftsCollected: 0,
      totalDetourTrapsTriggered: 0,
      totalShortcutGatesTriggered: 0
    };
  }
};

const updateGameStats = (key: string, increment: number = 1) => {
  try {
    const stats = getGameStats();
    stats[key] = (stats[key] || 0) + increment;
    localStorage.setItem('hundredthTileGameStats', JSON.stringify(stats));
  } catch (error) {
    console.error('❌ [STATS] Failed to update game stats:', error);
  }
};

const blockchainGameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_DICE_ANIMATION':
      console.log('🎲 [UI REDUCER] Starting dice animation');
      return {
        ...state,
        isRolling: true,
        diceValue: null,
      };

    case 'STOP_DICE_ANIMATION':
      console.log('🎲 [UI REDUCER] Stopping dice animation with value:', action.payload);
      updateGameStats('totalDiceRolled');
      return {
        ...state,
        isRolling: false,
        diceValue: action.payload,
      };

    case 'START_MOVING':
      console.log('🚶 [UI REDUCER] Starting player movement');
      return {
        ...state,
        isMoving: true,
      };

    case 'STOP_MOVING':
      console.log('🚶 [UI REDUCER] Stopping player movement');
      return {
        ...state,
        isMoving: false,
      };

    case 'UPDATE_FROM_CONTRACT': {
      const { position, score, nunuEarned, hasFinished, diceValue } = action.payload;
      console.log('📊 [UI REDUCER] Updating from contract:', action.payload);
      
      // Check if player moved to trigger animations
      const oldPosition = state.playerPosition;
      const newPosition = position;
      const positionChanged = oldPosition !== newPosition;
      
      // Check for special tiles at new position - but delay position update for door effects
      let triggeredGift = false;
      let triggeredDetour = false;
      let triggeredShortcut = false;
      let shouldDelayPositionUpdate = false;
      
      if (positionChanged && newPosition !== oldPosition) {
        // Check the tile we stepped on initially (before any door effect)
        const steppedPosition = oldPosition + (diceValue || 1);
        
        // Check if landed on a gift tile
        const giftTile = state.giftTiles.find(tile => tile.index === steppedPosition);
        if (giftTile) {
          triggeredGift = true;
          updateGameStats('totalGiftsCollected');
        }
        
        // Check if landed on a detour trap - compare with expected vs actual position
        const detourTile = state.detourTrapTiles.find(tile => tile.index === steppedPosition);
        if (detourTile && newPosition < steppedPosition) {
          triggeredDetour = true;
          shouldDelayPositionUpdate = true;
          updateGameStats('totalDetourTrapsTriggered');
        }
        
        // Check if landed on a shortcut gate - compare with expected vs actual position  
        const shortcutTile = state.shortcutGateTiles.find(tile => tile.index === steppedPosition);
        if (shortcutTile && newPosition > steppedPosition) {
          triggeredShortcut = true;
          shouldDelayPositionUpdate = true;
          updateGameStats('totalShortcutGatesTriggered');
        }
      }
      
      return {
        ...state,
        // Delay position update if door effect needs to show animation first
        playerPosition: shouldDelayPositionUpdate ? oldPosition : newPosition,
        score: score,
        diceValue: diceValue || state.diceValue,
        gameStatus: hasFinished ? 'won' : 'playing',
        isMoving: positionChanged,
        turnsPlayed: diceValue && positionChanged ? state.turnsPlayed + 1 : state.turnsPlayed,
        diceRolled: diceValue > 0,
        giftsCollected: triggeredGift ? state.giftsCollected + 1 : state.giftsCollected,
        detourTrapsTriggered: triggeredDetour ? state.detourTrapsTriggered + 1 : state.detourTrapsTriggered,
        shortcutGatesTriggered: triggeredShortcut ? state.shortcutGatesTriggered + 1 : state.shortcutGatesTriggered,
        // Store the final position for delayed update
        finalPosition: shouldDelayPositionUpdate ? newPosition : undefined,
      };
    }

    case 'UPDATE_BOARD_DATA': {
      const { giftTiles, detourTrapTiles, shortcutGateTiles } = action.payload;
      console.log('📋 [UI REDUCER] Updating board data from contract:', {
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
      console.log('🎉 [UI REDUCER] Game won!');
      return {
        ...state,
        gameStatus: 'won',
        isMoving: false,
        isRolling: false,
      };

    case 'TOGGLE_SOUND':
      console.log('🔊 [UI REDUCER] Toggling sound:', !state.isSoundMuted);
      return {
        ...state,
        isSoundMuted: !state.isSoundMuted,
      };

    case 'RESET_GAME': {
      console.log('🔄 [UI REDUCER] Resetting game');
      updateGameStats('totalGamesPlayed');
      return {
        ...initialState,
        isSoundMuted: state.isSoundMuted, // Preserve sound setting
      };
    }

    case 'COMPLETE_DOOR_ANIMATION':
      console.log('🚪 [UI REDUCER] Completing door animation');
      return {
        ...state,
        playerPosition: state.finalPosition || state.playerPosition,
        finalPosition: undefined,
        isMoving: false,
      };

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
    isLoadingStartGame,
    isWaitingForVRF,
    startGame, 
    rollDice, 
    isConnected,
    fetchAllGameData,
    playerRank,
    CONTRACT_ADDRESS,
  } = useContract();

  const contractInfo = {
    isConnected,
    contractState,
    isLoading,
    isLoadingStartGame,
    isWaitingForVRF,
    playerRank,
    CONTRACT_ADDRESS,
  };

  // Sync contract state with UI state
  useEffect(() => {
    if (contractState) {
      console.log('🔄 [UI REDUCER] Syncing contract state:', contractState);
      
      // Stop dice animation when we get actual dice value from contract
      if (contractState.diceValue > 0 && state.isRolling) {
        console.log('🎲 [UI REDUCER] Contract dice value received, stopping animation');
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
        console.log('🎉 [UI REDUCER] Game completed, triggering win animation');
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
      console.log('📋 [UI REDUCER] Syncing board data from contract');
      dispatch({
        type: 'UPDATE_BOARD_DATA',
        payload: boardData
      });
    }
  }, [boardData]);

  // Add effect to handle delayed position updates after door animations
  useEffect(() => {
    if (state.finalPosition) {
      const timer = setTimeout(() => {
        dispatch({ type: 'COMPLETE_DOOR_ANIMATION' });
      }, 2500); // Wait for splash animation to complete
      return () => clearTimeout(timer);
    }
  }, [state.finalPosition]);

  // Enhanced roll dice function that only handles UI animations
  const handleRollDice = useCallback(async () => {
    console.log('🎲 [UI REDUCER] Handle roll dice called', {
      isConnected,
      isRolling: state.isRolling,
      isLoading,
      isWaitingForVRF,
      boardGenerated: contractState?.boardGenerated
    });

    if (!isConnected) {
      toast.error('Please connect your wallet to play');
      return;
    }

    if (state.isRolling || isLoading || isWaitingForVRF || isLoadingStartGame) {
      console.log('🚫 [UI REDUCER] Roll dice blocked by loading states');
      return;
    }

    if (!contractState?.boardGenerated) {
      toast.error('Please start a new game first');
      return;
    }

    try {
      // Start UI dice animation immediately
      console.log('▶️ [UI REDUCER] Starting dice animation');
      dispatch({ type: 'START_DICE_ANIMATION' });
      
      // Call contract roll dice - this will trigger VRF and events
      await rollDice(contractState.position);
      
    } catch (error) {
      console.error('❌ [UI REDUCER] Error in dice roll:', error);
      dispatch({ type: 'STOP_DICE_ANIMATION', payload: 1 });
      toast.error('Failed to roll dice. Please try again.');
    }
  }, [isConnected, state.isRolling, isLoading, isWaitingForVRF, isLoadingStartGame, contractState, rollDice]);

  // Enhanced start game function
  const handleStartGame = useCallback(async () => {
    console.log('🎮 [UI REDUCER] Handle start game called', {
      isConnected,
      isLoadingStartGame,
      isLoading,
      isRolling: state.isRolling,
      isWaitingForVRF
    });

    if (!isConnected) {
      toast.error('Please connect your wallet to start a new game');
      return;
    }

    if (isLoadingStartGame || isLoading || state.isRolling || isWaitingForVRF) {
      console.log('🚫 [UI REDUCER] Start game blocked by loading states');
      return;
    }

    try {
      console.log('🔄 [UI REDUCER] Resetting game state');
      dispatch({ type: 'RESET_GAME' });
      await startGame();
      
    } catch (error) {
      console.error('❌ [UI REDUCER] Error starting game:', error);
      toast.error('Failed to start new game. Please try again.');
    }
  }, [isConnected, isLoadingStartGame, isLoading, state.isRolling, isWaitingForVRF, startGame]);

  return [
    {
      ...state,
      isRolling: state.isRolling || isWaitingForVRF,
      isMoving: state.isMoving,
      gameStats: getGameStats(), // Expose game stats
    },
    {
      dispatch,
      rollDice: handleRollDice,
      startGame: handleStartGame,
    },
    contractInfo
  ] as const;
};
