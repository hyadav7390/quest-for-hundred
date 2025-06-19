
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
    console.log(`📊 [STATS] Updated ${key} to ${stats[key]}`);
  } catch (error) {
    console.error('❌ [STATS] Failed to update game stats:', error);
  }
};

const blockchainGameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_DICE_ANIMATION':
      console.log('🎲 [UI REDUCER] Starting dice roll animation');
      return {
        ...state,
        isRolling: true,
        diceValue: null,
      };

    case 'STOP_DICE_ANIMATION':
      console.log('🎲 [UI REDUCER] Stopping dice roll animation with value:', action.payload);
      updateGameStats('totalDiceRolled');
      return {
        ...state,
        isRolling: false,
        diceValue: action.payload,
      };

    case 'START_MOVING':
      console.log('🚶 [UI REDUCER] Starting player movement animation');
      return {
        ...state,
        isMoving: true,
      };

    case 'STOP_MOVING':
      console.log('🚶 [UI REDUCER] Stopping player movement animation');
      return {
        ...state,
        isMoving: false,
      };

    case 'UPDATE_FROM_CONTRACT': {
      const { position, score, nunuEarned, hasFinished, diceValue } = action.payload;
      console.log('📊 [UI REDUCER] Updating from contract data:', action.payload);
      
      // Check if player moved to trigger animations
      const oldPosition = state.playerPosition;
      const newPosition = position;
      const positionChanged = oldPosition !== newPosition;
      
      // Check for special tiles at new position
      let triggeredGift = false;
      let triggeredDetour = false;
      let triggeredShortcut = false;
      
      if (positionChanged && newPosition > oldPosition) {
        // Check if landed on a gift tile
        const giftTile = state.giftTiles.find(tile => tile.index === newPosition);
        if (giftTile) {
          triggeredGift = true;
          updateGameStats('totalGiftsCollected');
        }
        
        // Check if landed on a detour trap
        const detourTile = state.detourTrapTiles.find(tile => tile.index === oldPosition + 1 || tile.index === newPosition);
        if (detourTile && newPosition < oldPosition + (diceValue || 0)) {
          triggeredDetour = true;
          updateGameStats('totalDetourTrapsTriggered');
        }
        
        // Check if landed on a shortcut gate
        const shortcutTile = state.shortcutGateTiles.find(tile => tile.index === oldPosition + 1 || tile.index === newPosition);
        if (shortcutTile && newPosition > oldPosition + (diceValue || 0)) {
          triggeredShortcut = true;
          updateGameStats('totalShortcutGatesTriggered');
        }
      }
      
      return {
        ...state,
        playerPosition: newPosition,
        score: score,
        diceValue: diceValue || state.diceValue,
        gameStatus: hasFinished ? 'won' : 'playing',
        isMoving: positionChanged,
        turnsPlayed: diceValue && positionChanged ? state.turnsPlayed + 1 : state.turnsPlayed,
        diceRolled: diceValue > 0,
        giftsCollected: triggeredGift ? state.giftsCollected + 1 : state.giftsCollected,
        detourTrapsTriggered: triggeredDetour ? state.detourTrapsTriggered + 1 : state.detourTrapsTriggered,
        shortcutGatesTriggered: triggeredShortcut ? state.shortcutGatesTriggered + 1 : state.shortcutGatesTriggered,
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
      console.log('🏆 [UI REDUCER] Game won!');
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
      console.log('🔄 [UI REDUCER] Resetting game state');
      updateGameStats('totalGamesPlayed');
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

  console.log('contractState', contractState, isLoading,
    isWaitingForVRF);

  // Sync contract state with UI state
  useEffect(() => {
    if (contractState) {
      console.log('🔄 [SYNC] Syncing contract state to UI reducer:', contractState);
      
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
        console.log('🎉 [SYNC] Game completed, showing win state');
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
      console.log('📋 [SYNC] Syncing board data to UI reducer');
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
      console.log('🎲 [ACTION] Starting dice roll sequence from UI...');
      
      // Start UI dice animation immediately
      dispatch({ type: 'START_DICE_ANIMATION' });
      
      // Call contract roll dice - this will trigger VRF and events
      await rollDice(contractState.position);
      
    } catch (error) {
      console.error('❌ [ACTION] Error in dice roll sequence:', error);
      dispatch({ type: 'STOP_DICE_ANIMATION', payload: 1 });
      toast.error('Failed to roll dice. Please try again.');
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
      console.log('🎮 [ACTION] Starting new game sequence from UI...');
      dispatch({ type: 'RESET_GAME' });
      await startGame();
      
    } catch (error) {
      console.error('❌ [ACTION] Error in start game sequence:', error);
      toast.error('Failed to start new game. Please try again.');
    }
  }, [isConnected, startGame]);

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
    {
      contractState,
      isConnected,
      isLoading,
      isWaitingForVRF,
      playerRank,
      CONTRACT_ADDRESS: '0x525b71e2716a12eaec3378df9e0a1341e91fd75c'
    }
  ] as const;
};
