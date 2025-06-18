
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
    "inputs": [
      {"internalType": "address", "name": "player", "type": "address"},
      {"internalType": "uint8", "name": "idx", "type": "uint8"}
    ],
    "name": "getTile",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "giftValue", "type": "uint256"},
          {"internalType": "int16", "name": "doorOffset", "type": "int16"}
        ],
        "internalType": "struct NGame.Tile",
        "name": "",
        "type": "tuple"
      }
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
    "inputs": [],
    "name": "TransfersEnabled",
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
  
  // Contract write operations
  const { writeContract: writeStartGame, isPending: isStartingGame } = useWriteContract();
  const { writeContract: writeRollDice, isPending: isRollingDice } = useWriteContract();

  // Read game stats - only fetch when needed
  const { data: gameStats, refetch: refetchGameStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getGameStats',
    query: { 
      enabled: false
    }
  });

  // Manual read operations - all disabled auto-fetch
  const { refetch: refetchPlayerStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPlayerStatus',
    args: address ? [address] : undefined,
    query: { 
      enabled: false
    }
  });

  const { refetch: refetchBoard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getBoard',
    args: address ? [address] : undefined,
    query: { 
      enabled: false
    }
  });

  const { refetch: refetchLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getLeaderboard',
    query: { 
      enabled: false
    }
  });

  const { refetch: refetchPlayerRank } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPlayerRank',
    args: address ? [address] : undefined,
    query: { 
      enabled: false
    }
  });

  // Event listeners for contract events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'GameStarted',
    onLogs: (logs) => {
      console.log('🎮 [CONTRACT EVENT] GameStarted:', logs);
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog) {
        console.log('✅ [GAME STARTED] Game started for current player');
        toast.success('Game started successfully! Board generated on-chain.');
        setIsLoading(false);
        
        // Fetch initial game data
        setTimeout(() => {
          console.log('📋 [FETCH] Fetching initial game data after start...');
          fetchAllGameData();
        }, 1000);
      }
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'RollInitiated',
    onLogs: (logs) => {
      console.log('🎲 [CONTRACT EVENT] RollInitiated:', logs);
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog) {
        console.log('⏳ [ROLL INITIATED] VRF request sent, waiting for result...');
        setIsWaitingForVRF(true);
        toast.info('Dice roll initiated! Waiting for blockchain result...');
      }
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'VRFRequestedLog',
    onLogs: (logs) => {
      console.log('🔮 [CONTRACT EVENT] VRFRequestedLog:', logs);
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog) {
        console.log('🔮 [VRF REQUESTED] Chainlink VRF request sent, waiting for randomness...');
        toast.info('Waiting for Chainlink VRF result...', { duration: 5000 });
      }
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'RollApplied',
    onLogs: (logs) => {
      console.log('🎯 [CONTRACT EVENT] RollApplied:', logs);
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
          console.log('📊 [FETCH] Fetching updated game state after roll...');
          fetchPlayerStatus();
        }, 500);
      }
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'RollFailed',
    onLogs: (logs) => {
      console.log('❌ [CONTRACT EVENT] RollFailed:', logs);
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog && playerLog.args) {
        console.log('🚫 [ROLL FAILED] Roll failed for current player:', playerLog.args.reason);
        toast.error(`Roll failed: ${playerLog.args.reason}`);
        setIsLoading(false);
        setIsWaitingForVRF(false);
      }
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'RewardsClaimed',
    onLogs: (logs) => {
      console.log('🎁 [CONTRACT EVENT] RewardsClaimed:', logs);
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
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'TransfersEnabled',
    onLogs: (logs) => {
      console.log('🔓 [CONTRACT EVENT] TransfersEnabled:', logs);
      toast.success('🔓 NUNU token transfers are now enabled! Max supply reached.');
    }
  });

  // Process board data from contract
  const processBoardData = useCallback((boardTiles: readonly { giftValue: bigint; doorOffset: number; }[]) => {
    if (!boardTiles || !Array.isArray(boardTiles)) {
      console.log('⚠️ [BOARD] No valid board tiles received');
      return;
    }

    console.log('📋 [BOARD] Processing board tiles:', boardTiles.length, 'tiles');
    const giftTiles: { index: number; points: number }[] = [];
    const detourTrapTiles: { index: number; moveBack: number }[] = [];
    const shortcutGateTiles: { index: number; moveForward: number }[] = [];

    // Convert readonly array to mutable array for processing
    const mutableBoardTiles = [...boardTiles];
    
    mutableBoardTiles.forEach((tile, index) => {
      if (index === 0) return; // Skip index 0 as contract uses 1-based indexing
      
      if (tile.giftValue > 0) {
        const points = Number(formatEther(tile.giftValue));
        giftTiles.push({ index, points });
        console.log(`🎁 [TILE] Gift tile at position ${index}: ${points} NUNU tokens`);
      } else if (tile.doorOffset !== 0) {
        if (tile.doorOffset < 0) {
          const moveBack = Math.abs(tile.doorOffset);
          detourTrapTiles.push({ index, moveBack });
          console.log(`🚪❌ [TILE] Detour trap at position ${index}: move back ${moveBack}`);
        } else {
          const moveForward = tile.doorOffset;
          shortcutGateTiles.push({ index, moveForward });
          console.log(`🚪✅ [TILE] Shortcut gate at position ${index}: move forward ${moveForward}`);
        }
      }
    });

    const processedBoardData = {
      giftTiles,
      detourTrapTiles,
      shortcutGateTiles
    };

    console.log('✅ [BOARD] Board data processed:', {
      gifts: giftTiles.length,
      detours: detourTrapTiles.length,
      shortcuts: shortcutGateTiles.length
    });
    
    setBoardData(processedBoardData);
  }, []);

  // Manual fetch functions
  const fetchPlayerStatus = useCallback(async () => {
    if (!address) {
      console.log('⚠️ [FETCH] No address available for player status fetch');
      return null;
    }

    try {
      console.log('📊 [FETCH] Fetching player status...');
      const result = await refetchPlayerStatus();
      
      if (result.data && gameStats) {
        const [position, diceValue, nunuEarned, gameScore, hasFinished, boardGenerated] = result.data;
        const [, , rollFee] = gameStats;
        
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
      }
      
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
      console.log('📋 [FETCH] Fetching board data...');
      const result = await refetchBoard();
      
      if (result.data) {
        processBoardData(result.data);
      }
      
      return result;
    } catch (error) {
      console.error('❌ [FETCH] Error fetching board data:', error);
      return null;
    }
  }, [address, refetchBoard, processBoardData]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      console.log('🏆 [FETCH] Fetching leaderboard...');
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
      console.log('🏅 [FETCH] Fetching player rank...');
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
      console.log('📈 [FETCH] Fetching game stats...');
      const result = await refetchGameStats();
      return result;
    } catch (error) {
      console.error('❌ [FETCH] Error fetching game stats:', error);
      return null;
    }
  }, [refetchGameStats]);

  const fetchAllGameData = useCallback(async () => {
    console.log('🔄 [FETCH] Fetching all game data...');
    await Promise.all([
      fetchGameStats(),
      fetchPlayerStatus(),
      fetchBoardData(),
      fetchLeaderboard(),
      fetchPlayerRank()
    ]);
    console.log('✅ [FETCH] All game data fetched');
  }, [fetchGameStats, fetchPlayerStatus, fetchBoardData, fetchLeaderboard, fetchPlayerRank]);

  // Contract interaction functions
  const startGame = async () => {
    if (!isConnected || !chain || !address) {
      console.log('⚠️ [ACTION] Wallet not connected for game start');
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      console.log('🎮 [ACTION] Starting new game...');
      setIsLoading(true);
      await writeStartGame({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'startGame',
        chain,
        account: address
      });
      console.log('✅ [ACTION] Start game transaction sent');
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
      console.log('🎲 [ACTION] Rolling dice with expected position:', expectedPosition);
      setIsLoading(true);
      const [, , rollFee] = gameStats;
      
      await writeRollDice({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'rollDice',
        args: [expectedPosition],
        value: rollFee,
        chain,
        account: address
      });
      console.log('✅ [ACTION] Roll dice transaction sent');
    } catch (error) {
      console.error('❌ [ACTION] Error rolling dice:', error);
      toast.error('Failed to roll dice');
      setIsLoading(false);
      setIsWaitingForVRF(false);
    }
  };

  // Initialize game data when connected
  useEffect(() => {
    if (isConnected && address) {
      console.log('🔄 [INIT] Wallet connected, fetching initial game data...');
      fetchAllGameData();
    }
  }, [isConnected, address, fetchAllGameData]);

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
