
import { useState, useEffect } from 'react';
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
    "anonymous": false,
    "inputs": [{"indexed": true, "internalType": "address", "name": "player", "type": "address"}],
    "name": "GameStarted",
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
    "name": "DiceRolled",
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
  const [isPlayerStatusFetching, setIsPlayerStatusFetching] = useState(false);
  
  // Contract write operations
  const { writeContract: writeStartGame, isPending: isStartingGame } = useWriteContract();
  const { writeContract: writeRollDice, isPending: isRollingDice } = useWriteContract();

  // Read game stats - only auto-fetch this once
  const { data: gameStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getGameStats',
    query: { 
      enabled: isConnected,
      staleTime: 60000, // Cache for 1 minute
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  });

  // Manual read operations - all disabled auto-fetch
  const { refetch: refetchPlayerStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPlayerStatus',
    args: address ? [address] : undefined,
    query: { 
      enabled: false // Completely disable auto-fetch
    }
  });

  const { refetch: refetchBoard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getBoard',
    args: address ? [address] : undefined,
    query: { 
      enabled: false // Completely disable auto-fetch
    }
  });

  const { refetch: refetchLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getLeaderboard',
    query: { 
      enabled: false // Completely disable auto-fetch
    }
  });

  // Watch for contract events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'GameStarted',
    onLogs: (logs) => {
      console.log('🎮 GameStarted event received:', logs);
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog) {
        console.log('✅ Game started for current player');
        toast.success('Game started successfully!');
        setIsLoading(false);
        
        // Fetch board data after game starts
        setTimeout(() => {
          console.log('📋 Fetching board data after game start...');
          fetchBoardData();
          fetchPlayerStatus();
        }, 1000);
      }
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'RollApplied',
    onLogs: (logs) => {
      console.log('🎲 RollApplied event received:', logs);
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog && playerLog.args) {
        const { dice, newPosition, nunuEarned } = playerLog.args;
        console.log('✅ Roll applied for current player:', { dice, newPosition, nunuEarned });
        
        toast.success(`Rolled ${dice}! Moved to position ${newPosition}${nunuEarned > 0 ? `. Earned ${formatEther(nunuEarned)} NUNU coins!` : ''}`);
        
        // Fetch updated player status after dice roll
        console.log('📊 Fetching player status after dice roll...');
        setTimeout(() => {
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
      console.log('❌ RollFailed event received:', logs);
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog && playerLog.args) {
        console.log('🚫 Roll failed for current player:', playerLog.args.reason);
        toast.error(`Roll failed: ${playerLog.args.reason}`);
        setIsLoading(false);
      }
    }
  });

  // Process board data from contract when it changes
  const processBoardData = (boardTiles: readonly { giftValue: bigint; doorOffset: number; }[]) => {
    if (!boardTiles || !Array.isArray(boardTiles)) {
      console.log('⚠️ No valid board tiles received');
      return;
    }

    console.log('📋 Processing board tiles:', boardTiles.length, 'tiles');
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
        console.log(`🎁 Gift tile at position ${index}: ${points} points`);
      } else if (tile.doorOffset !== 0) {
        if (tile.doorOffset < 0) {
          const moveBack = Math.abs(tile.doorOffset);
          detourTrapTiles.push({ index, moveBack });
          console.log(`🚪❌ Detour trap at position ${index}: move back ${moveBack}`);
        } else {
          const moveForward = tile.doorOffset;
          shortcutGateTiles.push({ index, moveForward });
          console.log(`🚪✅ Shortcut gate at position ${index}: move forward ${moveForward}`);
        }
      }
    });

    const processedBoardData = {
      giftTiles,
      detourTrapTiles,
      shortcutGateTiles
    };

    console.log('✅ Board data processed:', {
      gifts: giftTiles.length,
      detours: detourTrapTiles.length,
      shortcuts: shortcutGateTiles.length
    });
    
    setBoardData(processedBoardData);
  };

  // Manual fetch functions
  const fetchPlayerStatus = async () => {
    if (!address) {
      console.log('⚠️ No address available for player status fetch');
      return null;
    }

    try {
      console.log('📊 Fetching player status...');
      setIsPlayerStatusFetching(true);
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

        console.log('✅ Player status updated:', newGameState);
        setGameState(newGameState);
        setIsLoading(false); // Stop loading when we get the status
      }
      
      setIsPlayerStatusFetching(false);
      return result;
    } catch (error) {
      console.error('❌ Error fetching player status:', error);
      setIsPlayerStatusFetching(false);
      setIsLoading(false);
      return null;
    }
  };

  const fetchBoardData = async () => {
    if (!address) {
      console.log('⚠️ No address available for board data fetch');
      return null;
    }

    try {
      console.log('📋 Fetching board data...');
      const result = await refetchBoard();
      
      if (result.data) {
        processBoardData(result.data);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching board data:', error);
      return null;
    }
  };

  const fetchLeaderboard = async () => {
    try {
      console.log('🏆 Fetching leaderboard...');
      const result = await refetchLeaderboard();
      
      if (result.data) {
        console.log('✅ Leaderboard updated:', result.data.length, 'entries');
        setLeaderboard(result.data as LeaderboardEntry[]);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching leaderboard:', error);
      return null;
    }
  };

  // Contract interaction functions
  const startGame = async () => {
    if (!isConnected || !chain || !address) {
      console.log('⚠️ Wallet not connected for game start');
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      console.log('🎮 Starting new game...');
      setIsLoading(true);
      await writeStartGame({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'startGame',
        chain,
        account: address
      });
      console.log('✅ Start game transaction sent');
    } catch (error) {
      console.error('❌ Error starting game:', error);
      toast.error('Failed to start game');
      setIsLoading(false);
    }
  };

  const rollDice = async (expectedPosition: number) => {
    if (!isConnected || !chain || !address || !gameStats) {
      console.log('⚠️ Wallet not connected or game stats not available for dice roll');
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      console.log('🎲 Rolling dice with expected position:', expectedPosition);
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
      console.log('✅ Roll dice transaction sent');
    } catch (error) {
      console.error('❌ Error rolling dice:', error);
      toast.error('Failed to roll dice');
      setIsLoading(false);
    }
  };

  return {
    // State
    gameState,
    boardData,
    isLoading: isLoading || isStartingGame || isRollingDice || isPlayerStatusFetching,
    isConnected,
    leaderboard,
    
    // Actions
    startGame,
    rollDice,
    
    // Manual fetch functions
    fetchPlayerStatus,
    fetchBoardData,
    fetchLeaderboard,
    refetchLeaderboard: fetchLeaderboard, // Add this for backward compatibility
    
    // Utils
    CONTRACT_ADDRESS
  };
};
