
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useWatchContractEvent } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'sonner';

// Contract ABI - only the functions we need
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "startGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint8", "name": "expectedPosition", "type": "uint8"}],
    "name": "rollDice",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "getPlayerStatus",
    "outputs": [
      {"internalType": "uint8", "name": "position", "type": "uint8"},
      {"internalType": "uint8", "name": "diceValue", "type": "uint8"},
      {"internalType": "uint256", "name": "nunuEarned", "type": "uint256"},
      {"internalType": "uint256", "name": "gameScore", "type": "uint256"},
      {"internalType": "bool", "name": "hasFinished", "type": "bool"},
      {"internalType": "bool", "name": "boardGenerated", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "getBoard",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "giftValue", "type": "uint256"},
          {"internalType": "int16", "name": "doorOffset", "type": "int16"}
        ],
        "internalType": "struct NGame.Tile[]",
        "name": "board",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLeaderboard",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "player", "type": "address"},
          {"internalType": "uint256", "name": "score", "type": "uint256"}
        ],
        "internalType": "struct NGame.LeaderboardEntry[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getGameStats",
    "outputs": [
      {"internalType": "uint256", "name": "_totalMinted", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalMonCollected", "type": "uint256"},
      {"internalType": "uint256", "name": "rollFee", "type": "uint256"},
      {"internalType": "uint256", "name": "finishBonus", "type": "uint256"},
      {"internalType": "uint16", "name": "boardSize", "type": "uint16"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "who", "type": "address"}],
    "name": "getPlayerRank",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "address", "name": "player", "type": "address"}],
    "name": "GameStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
      {"indexed": false, "internalType": "uint8", "name": "expectedPosition", "type": "uint8"},
      {"indexed": false, "internalType": "uint256", "name": "sentValue", "type": "uint256"}
    ],
    "name": "RollInitiated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
      {"indexed": false, "internalType": "uint8", "name": "dice", "type": "uint8"},
      {"indexed": false, "internalType": "uint8", "name": "newPosition", "type": "uint8"},
      {"indexed": false, "internalType": "uint256", "name": "nunuEarned", "type": "uint256"}
    ],
    "name": "RollApplied",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "reason", "type": "string"}
    ],
    "name": "RollFailed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "RewardsClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "requestId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"}
    ],
    "name": "VRFRequestedLog",
    "type": "event"
  }
] as const;

// Hardcoded contract address
const CONTRACT_ADDRESS: `0x${string}` = '0x2a255fd23e3806f472ef68acba79adbc5c3ae3e8';

export interface ContractGameState {
  position: number;
  diceValue: number;
  nunuEarned: number;
  gameScore: number;
  hasFinished: boolean;
  boardGenerated: boolean;
  rollFee: bigint;
}

export interface ContractTile {
  giftValue: bigint;
  doorOffset: number;
}

export interface ContractBoardData {
  giftTiles: { index: number; points: number }[];
  detourTrapTiles: { index: number; moveBack: number }[];
  shortcutGateTiles: { index: number; moveForward: number }[];
}

export interface LeaderboardEntry {
  player: string;
  score: bigint;
}

export const useContract = () => {
  const { address, isConnected, chain } = useAccount();
  const [gameState, setGameState] = useState<ContractGameState | null>(null);
  const [boardData, setBoardData] = useState<ContractBoardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isWaitingForVRF, setIsWaitingForVRF] = useState(false);
  const [playerRank, setPlayerRank] = useState<number>(0);
  const [gameStats, setGameStats] = useState<any>(null);
  
  // Contract write operations
  const { writeContract: writeStartGame, isPending: isStartingGame } = useWriteContract();
  const { writeContract: writeRollDice, isPending: isRollingDice } = useWriteContract();

  // Manual read operations - all disabled auto-fetch to prevent excessive calls
  const { refetch: refetchPlayerStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPlayerStatus',
    args: address ? [address] : undefined,
    query: { 
      enabled: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  });

  const { refetch: refetchBoard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getBoard',
    args: address ? [address] : undefined,
    query: { 
      enabled: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  });

  const { refetch: refetchLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getLeaderboard',
    query: { 
      enabled: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  });

  const { refetch: refetchPlayerRank } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPlayerRank',
    args: address ? [address] : undefined,
    query: { 
      enabled: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  });

  const { refetch: refetchGameStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getGameStats',
    query: { 
      enabled: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  });

  // Event listeners for contract events with improved logging
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'GameStarted',
    onLogs: (logs) => {
      console.log('🎮 [CONTRACT EVENT] GameStarted received:', logs);
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog) {
        console.log('✅ [GAME STARTED] Game started for current player');
        toast.success('Game started successfully! Board generated on-chain.');
        setIsLoading(false);
        
        // Fetch game data after a short delay to ensure contract state is updated
        setTimeout(() => {
          console.log('📋 [FETCH] Fetching game data after GameStarted event...');
          fetchAllGameData();
        }, 2000);
      }
    },
    onError: (error) => {
      console.error('❌ [EVENT ERROR] GameStarted event error:', error);
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'RollInitiated',
    onLogs: (logs) => {
      console.log('🎲 [CONTRACT EVENT] RollInitiated received:', logs);
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog) {
        console.log('⏳ [ROLL INITIATED] VRF request sent, waiting for result...');
        setIsWaitingForVRF(true);
        toast.info('Dice roll initiated! Waiting for blockchain result...');
      }
    },
    onError: (error) => {
      console.error('❌ [EVENT ERROR] RollInitiated event error:', error);
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'VRFRequestedLog',
    onLogs: (logs) => {
      console.log('🔮 [CONTRACT EVENT] VRFRequestedLog received:', logs);
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog) {
        console.log('🔮 [VRF REQUESTED] Chainlink VRF request sent, waiting for randomness...');
        toast.info('Waiting for Chainlink VRF result...', { duration: 5000 });
      }
    },
    onError: (error) => {
      console.error('❌ [EVENT ERROR] VRFRequestedLog event error:', error);
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'RollApplied',
    onLogs: (logs) => {
      console.log('🎯 [CONTRACT EVENT] RollApplied received:', logs);
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog && playerLog.args) {
        const { dice, newPosition, nunuEarned } = playerLog.args;
        console.log('✅ [ROLL APPLIED] Roll applied for current player:', { dice, newPosition, nunuEarned });
        
        setIsWaitingForVRF(false);
        setIsLoading(false);
        
        const earnedTokens = Number(formatEther(nunuEarned));
        if (earnedTokens > 0) {
          toast.success(`🎲 Rolled ${dice}! Moved to position ${newPosition}. Earned ${earnedTokens.toFixed(2)} NUNU tokens!`);
        } else {
          toast.success(`🎲 Rolled ${dice}! Moved to position ${newPosition}.`);
        }
        
        // Fetch updated game state
        setTimeout(() => {
          console.log('📊 [FETCH] Fetching updated game state after RollApplied...');
          fetchPlayerStatus();
        }, 1000);
      }
    },
    onError: (error) => {
      console.error('❌ [EVENT ERROR] RollApplied event error:', error);
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'RollFailed',
    onLogs: (logs) => {
      console.log('❌ [CONTRACT EVENT] RollFailed received:', logs);
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog && playerLog.args) {
        console.log('🚫 [ROLL FAILED] Roll failed for current player:', playerLog.args.reason);
        toast.error(`Roll failed: ${playerLog.args.reason}`);
        setIsLoading(false);
        setIsWaitingForVRF(false);
      }
    },
    onError: (error) => {
      console.error('❌ [EVENT ERROR] RollFailed event error:', error);
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'RewardsClaimed',
    onLogs: (logs) => {
      console.log('🎁 [CONTRACT EVENT] RewardsClaimed received:', logs);
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog && playerLog.args) {
        const amount = Number(formatEther(playerLog.args.amount));
        console.log('💰 [REWARDS CLAIMED] Rewards claimed:', amount);
        toast.success(`🎉 Congratulations! You earned ${amount.toFixed(2)} NUNU tokens!`);
        
        // Update leaderboard and rank
        setTimeout(() => {
          fetchLeaderboard();
          fetchPlayerRank();
        }, 1000);
      }
    },
    onError: (error) => {
      console.error('❌ [EVENT ERROR] RewardsClaimed event error:', error);
    }
  });

  // Process board data from contract with better validation
  const processBoardData = useCallback((boardTiles: readonly { giftValue: bigint; doorOffset: number; }[]) => {
    if (!boardTiles || !Array.isArray(boardTiles)) {
      console.log('⚠️ [BOARD] No valid board tiles received');
      return;
    }

    console.log('📋 [BOARD] Processing board tiles from contract. Total tiles:', boardTiles.length);
    const giftTiles: { index: number; points: number }[] = [];
    const detourTrapTiles: { index: number; moveBack: number }[] = [];
    const shortcutGateTiles: { index: number; moveForward: number }[] = [];

    // Process each tile - contract uses 0-based indexing in array but 1-based for game logic
    boardTiles.forEach((tile, arrayIndex) => {
      const gameIndex = arrayIndex; // Use array index directly since contract returns full board
      
      if (gameIndex === 0) return; // Skip index 0 as it's not used in the game
      
      if (tile.giftValue > 0) {
        const points = Number(formatEther(tile.giftValue));
        giftTiles.push({ index: gameIndex, points });
        console.log(`🎁 [TILE] Gift tile at position ${gameIndex}: ${points} NUNU tokens`);
      } else if (tile.doorOffset !== 0) {
        if (tile.doorOffset < 0) {
          const moveBack = Math.abs(tile.doorOffset);
          detourTrapTiles.push({ index: gameIndex, moveBack });
          console.log(`🚪❌ [TILE] Detour trap at position ${gameIndex}: move back ${moveBack}`);
        } else {
          const moveForward = tile.doorOffset;
          shortcutGateTiles.push({ index: gameIndex, moveForward });
          console.log(`🚪✅ [TILE] Shortcut gate at position ${gameIndex}: move forward ${moveForward}`);
        }
      }
    });

    const processedBoardData = {
      giftTiles,
      detourTrapTiles,
      shortcutGateTiles
    };

    console.log('✅ [BOARD] Board data processed from contract:', {
      gifts: giftTiles.length,
      detours: detourTrapTiles.length,
      shortcuts: shortcutGateTiles.length
    });
    
    setBoardData(processedBoardData);
  }, []);

  // Manual fetch functions with improved error handling
  const fetchPlayerStatus = useCallback(async () => {
    if (!address) {
      console.log('⚠️ [FETCH] No address available for player status fetch');
      return null;
    }

    try {
      console.log('📊 [FETCH] Starting fetchPlayerStatus...');
      const result = await refetchPlayerStatus();
      
      if (result.data && gameStats) {
        const [position, diceValue, nunuEarned, gameScore, hasFinished, boardGenerated] = result.data;
        const rollFee = gameStats[2]; // rollFee is third element
        
        const newGameState = {
          position: Number(position),
          diceValue: Number(diceValue),
          nunuEarned: Number(formatEther(nunuEarned)),
          gameScore: Number(gameScore),
          hasFinished,
          boardGenerated,
          rollFee
        };

        console.log('✅ [FETCH] Player status updated:', newGameState);
        setGameState(newGameState);
        return newGameState;
      }
      
      console.log('⚠️ [FETCH] Player status fetch completed but no valid data');
      return result;
    } catch (error) {
      console.error('❌ [FETCH] Error fetching player status:', error);
      return null;
    }
  }, [address, refetchPlayerStatus, gameStats]);

  const fetchBoardData = useCallback(async () => {
    if (!address) {
      console.log('⚠️ [FETCH] No address available for board data fetch');
      return null;
    }

    try {
      console.log('📋 [FETCH] Starting fetchBoardData...');
      const result = await refetchBoard();
      
      if (result.data) {
        console.log('📋 [FETCH] Board data received from contract, processing...');
        processBoardData(result.data);
      } else {
        console.log('⚠️ [FETCH] Board data fetch completed but no data received');
      }
      
      return result;
    } catch (error) {
      console.error('❌ [FETCH] Error fetching board data:', error);
      return null;
    }
  }, [address, refetchBoard, processBoardData]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      console.log('🏆 [FETCH] Starting fetchLeaderboard...');
      const result = await refetchLeaderboard();
      
      if (result.data) {
        console.log('✅ [FETCH] Leaderboard updated:', result.data.length, 'entries');
        setLeaderboard(result.data as LeaderboardEntry[]);
      }
      
      return result;
    } catch (error) {
      console.error('❌ [FETCH] Error fetching leaderboard:', error);
      return null;
    }
  }, [refetchLeaderboard]);

  const fetchPlayerRank = useCallback(async () => {
    if (!address) return null;

    try {
      console.log('🏅 [FETCH] Starting fetchPlayerRank...');
      const result = await refetchPlayerRank();
      
      if (result.data) {
        const rank = Number(result.data);
        console.log('✅ [FETCH] Player rank updated:', rank);
        setPlayerRank(rank);
      }
      
      return result;
    } catch (error) {
      console.error('❌ [FETCH] Error fetching player rank:', error);
      return null;
    }
  }, [address, refetchPlayerRank]);

  const fetchGameStats = useCallback(async () => {
    try {
      console.log('📈 [FETCH] Starting fetchGameStats...');
      const result = await refetchGameStats();
      
      if (result.data) {
        console.log('✅ [FETCH] Game stats updated:', result.data);
        setGameStats(result.data);
      }
      
      return result;
    } catch (error) {
      console.error('❌ [FETCH] Error fetching game stats:', error);
      return null;
    }
  }, [refetchGameStats]);

  const fetchAllGameData = useCallback(async () => {
    console.log('🔄 [FETCH] Starting fetchAllGameData...');
    
    // First fetch game stats as other functions depend on it
    await fetchGameStats();
    
    // Then fetch other data in parallel
    await Promise.all([
      fetchPlayerStatus(),
      fetchBoardData(),
      fetchLeaderboard(),
      fetchPlayerRank()
    ]);
    
    console.log('✅ [FETCH] All game data fetched complete');
  }, [fetchGameStats, fetchPlayerStatus, fetchBoardData, fetchLeaderboard, fetchPlayerRank]);

  // Contract interaction functions with improved logging
  const startGame = async () => {
    if (!isConnected || !chain || !address) {
      console.log('⚠️ [ACTION] Wallet not connected for game start');
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      console.log('🎮 [ACTION] Starting startGame transaction...');
      setIsLoading(true);
      
      await writeStartGame({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'startGame',
        chain,
        account: address
      });
      
      console.log('✅ [ACTION] Start game transaction sent successfully');
    } catch (error) {
      console.error('❌ [ACTION] Error starting game:', error);
      toast.error('Failed to start game');
      setIsLoading(false);
    }
  };

  const rollDice = async (expectedPosition: number) => {
    if (!isConnected || !chain || !address || !gameStats) {
      console.log('⚠️ [ACTION] Wallet not connected or game stats not available for dice roll');
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      console.log('🎲 [ACTION] Starting rollDice transaction with expected position:', expectedPosition);
      setIsLoading(true);
      const rollFee = gameStats[2]; // rollFee is third element in gameStats
      
      console.log('💰 [ACTION] Roll fee required:', formatEther(rollFee), 'ETH');
      
      await writeRollDice({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'rollDice',
        args: [expectedPosition],
        value: rollFee,
        chain,
        account: address
      });
      
      console.log('✅ [ACTION] Roll dice transaction sent successfully');
    } catch (error) {
      console.error('❌ [ACTION] Error rolling dice:', error);
      toast.error('Failed to roll dice');
      setIsLoading(false);
      setIsWaitingForVRF(false);
    }
  };

  // Initialize game data when connected - only once
  useEffect(() => {
    if (isConnected && address && !gameState) {
      console.log('🔄 [INIT] Wallet connected, fetching initial game data...');
      fetchAllGameData();
    }
  }, [isConnected, address]); // Removed fetchAllGameData and gameState from deps to prevent loops

  return {
    // State
    gameState,
    boardData,
    isLoading: isLoading || isStartingGame || isRollingDice,
    isWaitingForVRF,
    isConnected,
    leaderboard,
    playerRank,
    
    // Actions
    startGame,
    rollDice,
    
    // Manual fetch functions
    fetchPlayerStatus,
    fetchBoardData,
    fetchLeaderboard,
    fetchPlayerRank,
    fetchAllGameData,
    
    // Utils
    CONTRACT_ADDRESS
  };
};
