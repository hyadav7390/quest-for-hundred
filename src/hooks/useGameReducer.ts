import { useReducer, useEffect, useCallback, useState } from 'react';
import { GameState, GameAction } from '@/types/game';
import { useGame } from './useGame';
import { toast } from '@/hooks/use-toast';

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
  animatedPosition: 1, // Track animated position for tile-by-tile movement
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
      // console.log('📊 [UI REDUCER] Updating from contract:', action.payload);
      
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
        }
        
        // Check if landed on a detour trap - compare with expected vs actual position
        const detourTile = state.detourTrapTiles.find(tile => tile.index === steppedPosition);
        if (detourTile && newPosition < steppedPosition) {
          triggeredDetour = true;
          shouldDelayPositionUpdate = true;
        }
        
        // Check if landed on a shortcut gate - compare with expected vs actual position  
        const shortcutTile = state.shortcutGateTiles.find(tile => tile.index === steppedPosition);
        if (shortcutTile && newPosition > steppedPosition) {
          triggeredShortcut = true;
          shouldDelayPositionUpdate = true;
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
      // console.log('📋 [UI REDUCER] Updating board data from contract:', {
      //   gifts: giftTiles.length,
      //   detours: detourTrapTiles.length,
      //   shortcuts: shortcutGateTiles.length
      // });
      
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

    case 'START_TILE_ANIMATION':
      console.log('🎯 [UI REDUCER] Starting tile-by-tile animation from', action.payload.fromPosition, 'to', action.payload.toPosition);
      return {
        ...state,
        animatedPosition: action.payload.fromPosition,
        isMoving: true,
      };

    case 'UPDATE_ANIMATED_POSITION':
      return {
        ...state,
        animatedPosition: action.payload,
      };

    case 'COMPLETE_TILE_ANIMATION':
      console.log('🎯 [UI REDUCER] Completing tile-by-tile animation');
      return {
        ...state,
        isMoving: false,
      };

    default:
      return state;
  }
};

export const useGameReducer = (mode: 'single' | 'multi' = 'single') => {
  const [state, dispatch] = useReducer(blockchainGameReducer, initialState);
  const gameData = useGame(mode);
  
  // Track if this is the initial load to prevent unnecessary animation
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Sync contract state with UI state (from old code)
  useEffect(() => {
    if (gameData.gameState) {
      // Stop dice animation when we get actual dice value from contract
      if (gameData.gameState.diceValue > 0 && state.isRolling) {
        dispatch({ type: 'STOP_DICE_ANIMATION', payload: gameData.gameState.diceValue });
      }
      dispatch({
        type: 'UPDATE_FROM_CONTRACT',
        payload: gameData.gameState,
      });
      // Handle game completion
      if (gameData.gameState.hasFinished && state.gameStatus !== 'won') {
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
  }, [gameData.gameState, state.isRolling, state.gameStatus, state.isMoving]);

  // Handle tile-by-tile movement animation
  useEffect(() => {
    if (gameData.gameState && state.playerPosition !== gameData.gameState.position) {
      // Skip animation on initial load - just set positions directly
      if (isInitialLoad) {
        console.log('🎯 [UI REDUCER] Initial load - setting position directly without animation');
        dispatch({
          type: 'UPDATE_FROM_CONTRACT',
          payload: gameData.gameState,
        });
        dispatch({ type: 'UPDATE_ANIMATED_POSITION', payload: gameData.gameState.position });
        setIsInitialLoad(false);
        return;
      }

      const fromPosition = state.playerPosition;
      const toPosition = gameData.gameState.position;
      
      console.log('🎯 [UI REDUCER] Starting tile animation from', fromPosition, 'to', toPosition);
      
      // Start tile animation
      dispatch({ 
        type: 'START_TILE_ANIMATION', 
        payload: { fromPosition, toPosition } 
      });

      // Animate through tiles
      const animateTiles = () => {
        const distance = Math.abs(toPosition - fromPosition);
        const direction = toPosition > fromPosition ? 1 : -1;
        let currentTile = fromPosition;
        let step = 0;

        const animateStep = () => {
          if (step < distance) {
            currentTile += direction;
            step++;
            dispatch({ type: 'UPDATE_ANIMATED_POSITION', payload: currentTile });
            setTimeout(animateStep, 150); // 150ms per tile
          } else {
            // Animation complete - ensure we end at the correct contract position
            setTimeout(() => {
              dispatch({ type: 'UPDATE_ANIMATED_POSITION', payload: toPosition });
              dispatch({ type: 'COMPLETE_TILE_ANIMATION' });
            }, 300); // Brief pause at final position
          }
        };

        setTimeout(animateStep, 200); // Initial delay
      };

      animateTiles();
    }
  }, [gameData.gameState?.position, state.playerPosition, isInitialLoad]);

  // Sync board data from contract
  useEffect(() => {
    if (gameData.boardData) {
      dispatch({
        type: 'UPDATE_BOARD_DATA',
        payload: gameData.boardData,
      });
    }
  }, [gameData.boardData]);

  // Handle delayed position updates after door animations
  useEffect(() => {
    if (state.finalPosition) {
      const timer = setTimeout(() => {
        dispatch({ type: 'COMPLETE_DOOR_ANIMATION' });
      }, 2500); // Wait for splash animation to complete
      return () => clearTimeout(timer);
    }
  }, [state.finalPosition]);

  const handleRollDice = useCallback(async () => {
    if (state.isRolling || gameData.isWaitingForVRF || gameData.isLoadingStartGame) {
      return;
    }
    if (!gameData.isConnected) {
      toast({ title: 'Error', description: 'Please connect your wallet to play', variant: 'destructive' });
      return;
    }
    if (!gameData.gameState?.boardGenerated) {
      toast({ title: 'Error', description: 'Please start a new game first', variant: 'destructive' });
      return;
    }
    try {
      dispatch({ type: 'START_DICE_ANIMATION' });
      await gameData.rollDice();
    } catch (error) {
      dispatch({ type: 'STOP_DICE_ANIMATION', payload: 1 });
      toast({ title: 'Error', description: 'Failed to roll dice. Please try again.', variant: 'destructive' });
    }
  }, [state.isRolling, gameData]);

  const handleJoinGame = useCallback(async () => {
    if (gameData.isLoading || state.isRolling) {
      return;
    }
    if (!gameData.isConnected) {
      toast({ title: 'Error', description: 'Please connect your wallet to join the game', variant: 'destructive' });
      return;
    }
    try {
      await gameData.joinGame?.();
    } catch (error) {
      // The useGame hook will show a more specific error toast.
      console.error('[useGameReducer] Join game failed:', error);
    }
  }, [gameData]);

  const handleStartGame = useCallback(async () => {
    if (gameData.isLoadingStartGame || state.isRolling || gameData.isWaitingForVRF) {
      return;
    }
    if (!gameData.isConnected) {
      toast({ title: 'Error', description: 'Please connect your wallet to start a new game', variant: 'destructive' });
      return;
    }
    try {
      dispatch({ type: 'RESET_GAME' });
      await gameData.startGame();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to start new game. Please try again.', variant: 'destructive' });
    }
  }, [state.isRolling, gameData]);

  return [
    {
      ...state,
      isRolling: state.isRolling || gameData.isWaitingForVRF,
      isMoving: state.isMoving,
    },
    {
      dispatch,
      rollDice: handleRollDice,
      startGame: handleStartGame,
      claimRewards: gameData.claimRewards,
      joinGame: handleJoinGame,
      resetGame: gameData.resetGame,
    },
    gameData,
  ] as const;
};
