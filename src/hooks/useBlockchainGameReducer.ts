
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
      console.log('🎲 UI: Starting dice roll animation');
      return {
        ...state,
        diceValue: action.payload,
        isRolling: true,
        diceRolled: true,
      };

    case 'START_MOVING':
      console.log('🚶 UI: Starting player movement');
      return {
        ...state,
        isRolling: false,
        isMoving: true,
      };

    case 'MOVE_PLAYER': {
      const newPosition = Math.min(action.payload, 100);
      console.log('📍 UI: Moving player to position:', newPosition);
      
      return {
        ...state,
        playerPosition: newPosition,
        isMoving: false,
      };
    }

    case 'UPDATE_FROM_CONTRACT': {
      const { position, score, nunuEarned, hasFinished, diceValue } = action.payload;
      console.log('📊 UI: Updating from contract:', action.payload);
      
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
        isRolling: false, // Stop dice rolling when we get contract data
        isMoving: positionChanged,
        turnsPlayed: diceValue && positionChanged ? state.turnsPlayed + 1 : state.turnsPlayed,
      };
    }

    case 'UPDATE_BOARD_DATA': {
      const { giftTiles, detourTrapTiles, shortcutGateTiles } = action.payload;
      console.log('📋 UI: Updating board data:', {
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

    case 'COLLECT_GIFT': {
      console.log('🎁 UI: Gift collected at position:', action.payload.tileIndex);
      return {
        ...state,
        giftsCollected: state.giftsCollected + 1,
        isMoving: false,
      };
    }

    case 'TRIGGER_DETOUR_TRAP': {
      console.log('🚪❌ UI: Detour trap triggered at position:', action.payload.trapIndex);
      return {
        ...state,
        detourTrapsTriggered: state.detourTrapsTriggered + 1,
        isMoving: false,
      };
    }

    case 'TRIGGER_SHORTCUT_GATE': {
      console.log('🚪✅ UI: Shortcut gate triggered at position:', action.payload.gateIndex);
      return {
        ...state,
        shortcutGatesTriggered: state.shortcutGatesTriggered + 1,
        isMoving: false,
      };
    }

    case 'FINISH_TURN':
      console.log('✅ UI: Turn finished');
      return {
        ...state,
        isMoving: false,
        isRolling: false,
      };

    case 'WIN_GAME':
      console.log('🏆 UI: Game won!');
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
      console.log('🔄 UI: Resetting game state');
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
    startGame, 
    rollDice, 
    isConnected,
    fetchPlayerStatus,
    fetchBoardData
  } = useContract();

  // Track tile interactions
  const checkTileInteraction = useCallback((position: number) => {
    if (!boardData) {
      console.log('⚠️ No board data available for tile interaction check');
      return;
    }

    console.log('🔍 Checking tile interaction for position:', position);

    // Check for gift tiles
    const giftTile = boardData.giftTiles.find(tile => tile.index === position);
    if (giftTile) {
      console.log('🎁 Gift tile interaction:', giftTile);
      dispatch({ type: 'COLLECT_GIFT', payload: { tileIndex: position, points: giftTile.points } });
      return;
    }

    // Check for detour trap tiles
    const detourTrap = boardData.detourTrapTiles.find(tile => tile.index === position);
    if (detourTrap) {
      console.log('🚪❌ Detour trap interaction:', detourTrap);
      dispatch({ type: 'TRIGGER_DETOUR_TRAP', payload: { newPosition: position, penalty: detourTrap.moveBack, trapIndex: position } });
      return;
    }

    // Check for shortcut gate tiles
    const shortcutGate = boardData.shortcutGateTiles.find(tile => tile.index === position);
    if (shortcutGate) {
      console.log('🚪✅ Shortcut gate interaction:', shortcutGate);
      dispatch({ type: 'TRIGGER_SHORTCUT_GATE', payload: { newPosition: position, bonus: shortcutGate.moveForward, gateIndex: position } });
      return;
    }

    console.log('⚪ No special tile at position:', position);
  }, [boardData]);

  // Sync contract state with local state
  useEffect(() => {
    if (contractState) {
      const oldPosition = state.playerPosition;
      
      console.log('🔄 Syncing contract state to UI:', {
        oldPosition,
        newPosition: contractState.position,
        diceValue: contractState.diceValue,
        gameScore: contractState.gameScore
      });
      
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

      // Check for tile interactions when position changes and player moved forward
      if (oldPosition !== contractState.position && contractState.position > oldPosition) {
        console.log('📍 Player moved from', oldPosition, 'to', contractState.position);
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
      console.log('📋 Syncing board data to UI');
      dispatch({
        type: 'UPDATE_BOARD_DATA',
        payload: boardData
      });
    }
  }, [boardData]);

  // Enhanced roll dice function that interacts with contract
  const handleRollDice = async () => {
    if (!isConnected) {
      console.log('⚠️ Wallet not connected for dice roll');
      toast.error('Please connect your wallet to play');
      return;
    }

    if (state.isRolling || isLoading) {
      console.log('⚠️ Already rolling or loading, ignoring dice roll request');
      return;
    }

    try {
      console.log('🎲 Starting dice roll sequence...');
      
      // Start rolling animation with random value first
      dispatch({ type: 'ROLL_DICE', payload: Math.floor(Math.random() * 6) + 1 });
      
      // Call contract roll dice
      await rollDice(state.playerPosition);
      
    } catch (error) {
      console.error('❌ Error in dice roll sequence:', error);
      dispatch({ type: 'FINISH_TURN' });
    }
  };

  // Enhanced start game function
  const handleStartGame = async () => {
    if (!isConnected) {
      console.log('⚠️ Wallet not connected for game start');
      toast.error('Please connect your wallet to start a new game');
      return;
    }

    try {
      console.log('🎮 Starting new game sequence...');
      await startGame();
      dispatch({ type: 'RESET_GAME' });
      
      // Fetch board data after starting game
      setTimeout(async () => {
        console.log('📋 Fetching board data after game start...');
        await fetchBoardData();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error in start game sequence:', error);
      toast.error('Failed to start new game');
    }
  };

  // Initial data fetch when connected and board is generated
  useEffect(() => {
    if (isConnected && contractState?.boardGenerated && !boardData) {
      console.log('🔄 Initial fetch of board data on connection');
      fetchBoardData();
    }
  }, [isConnected, contractState?.boardGenerated, boardData, fetchBoardData]);

  return [
    {
      ...state,
      isRolling: state.isRolling || isLoading,
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
      CONTRACT_ADDRESS: '0x2a255fd23e3806f472ef68acba79adbc5c3ae3e8'
    }
  ] as const;
};
