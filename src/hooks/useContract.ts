
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
  
  // Contract write operations
  const { writeContract: writeStartGame, isPending: isStartingGame } = useWriteContract();
  const { writeContract: writeRollDice, isPending: isRollingDice } = useWriteContract();

  // Read player status - only when manually triggered
  const { data: playerStatus, refetch: refetchPlayerStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPlayerStatus',
    args: address ? [address] : undefined,
    query: { enabled: false } // Don't auto-fetch
  });

  // Read game stats
  const { data: gameStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getGameStats',
    query: { enabled: isConnected }
  });

  // Read board data - only when manually triggered
  const { data: boardTiles, refetch: refetchBoard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getBoard',
    args: address ? [address] : undefined,
    query: { enabled: false } // Don't auto-fetch
  });

  // Read leaderboard - only when manually triggered
  const { data: leaderboardData, refetch: refetchLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getLeaderboard',
    query: { enabled: false } // Don't auto-fetch
  });

  // Watch for contract events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'GameStarted',
    onLogs: (logs) => {
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog) {
        console.log('Game started event received');
        toast.success('Game started successfully!');
        setIsLoading(false);
        // Fetch board data after game starts
        setTimeout(() => {
          refetchBoard();
          refetchPlayerStatus();
        }, 1000);
      }
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'RollApplied',
    onLogs: (logs) => {
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog && playerLog.args) {
        const { dice, newPosition, nunuEarned } = playerLog.args;
        console.log('Roll applied event:', { dice, newPosition, nunuEarned });
        
        setIsLoading(false);
        toast.success(`Rolled ${dice}! Moved to position ${newPosition}${nunuEarned > 0 ? `. Earned ${formatEther(nunuEarned)} NUNU coins!` : ''}`);
        
        // Fetch updated player status after dice roll
        setTimeout(() => {
          refetchPlayerStatus();
        }, 500);
      }
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'RollFailed',
    onLogs: (logs) => {
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog && playerLog.args) {
        toast.error(`Roll failed: ${playerLog.args.reason}`);
        setIsLoading(false);
      }
    }
  });

  // Process board data from contract when it changes
  useEffect(() => {
    if (boardTiles && Array.isArray(boardTiles)) {
      console.log('Processing board tiles:', boardTiles);
      const giftTiles: { index: number; points: number }[] = [];
      const detourTrapTiles: { index: number; moveBack: number }[] = [];
      const shortcutGateTiles: { index: number; moveForward: number }[] = [];

      boardTiles.forEach((tile, index) => {
        if (index === 0) return; // Skip index 0 as contract uses 1-based indexing
        
        if (tile.giftValue > 0) {
          giftTiles.push({
            index,
            points: Number(formatEther(tile.giftValue))
          });
        } else if (tile.doorOffset !== 0) {
          if (tile.doorOffset < 0) {
            // Detour trap (red door)
            detourTrapTiles.push({
              index,
              moveBack: Math.abs(tile.doorOffset)
            });
          } else {
            // Shortcut gate (green door)
            shortcutGateTiles.push({
              index,
              moveForward: tile.doorOffset
            });
          }
        }
      });

      const processedBoardData = {
        giftTiles,
        detourTrapTiles,
        shortcutGateTiles
      };

      console.log('Processed board data:', processedBoardData);
      setBoardData(processedBoardData);
    }
  }, [boardTiles]);

  // Update game state when player status changes
  useEffect(() => {
    if (playerStatus && gameStats) {
      const [position, diceValue, nunuEarned, gameScore, hasFinished, boardGenerated] = playerStatus;
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

      console.log('Updated game state:', newGameState);
      setGameState(newGameState);
    }
  }, [playerStatus, gameStats]);

  // Update leaderboard when data changes
  useEffect(() => {
    if (leaderboardData) {
      setLeaderboard(leaderboardData as LeaderboardEntry[]);
    }
  }, [leaderboardData]);

  // Contract interaction functions
  const startGame = async () => {
    if (!isConnected || !chain || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      await writeStartGame({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'startGame',
        chain,
        account: address
      });
      console.log('Start game transaction sent');
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game');
      setIsLoading(false);
    }
  };

  const rollDice = async (expectedPosition: number) => {
    if (!isConnected || !chain || !address || !gameStats) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
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
      console.log('Roll dice transaction sent');
    } catch (error) {
      console.error('Error rolling dice:', error);
      toast.error('Failed to roll dice');
      setIsLoading(false);
    }
  };

  // Manual fetch functions
  const fetchPlayerStatus = async () => {
    if (address) {
      const result = await refetchPlayerStatus();
      return result;
    }
  };

  const fetchBoardData = async () => {
    if (address) {
      const result = await refetchBoard();
      return result;
    }
  };

  const fetchLeaderboard = async () => {
    const result = await refetchLeaderboard();
    return result;
  };

  return {
    // State
    gameState,
    boardData,
    isLoading: isLoading || isStartingGame || isRollingDice,
    isConnected,
    leaderboard,
    
    // Actions
    startGame,
    rollDice,
    
    // Manual fetch functions
    fetchPlayerStatus,
    fetchBoardData,
    fetchLeaderboard,
    
    // Utils
    CONTRACT_ADDRESS
  };
};
