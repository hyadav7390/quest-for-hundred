
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

export interface LeaderboardEntry {
  player: string;
  score: bigint;
}

export const useContract = () => {
  const { address, isConnected, chain } = useAccount();
  const [gameState, setGameState] = useState<ContractGameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get contract address from localStorage or use fallback
  const getContractAddress = (): `0x${string}` => {
    const saved = localStorage.getItem('contract_address');
    return (saved && saved.startsWith('0x') && saved.length === 42) 
      ? saved as `0x${string}` 
      : '0x0000000000000000000000000000000000000000';
  };

  const CONTRACT_ADDRESS = getContractAddress();
  
  // Contract write operations
  const { writeContract: writeStartGame, isPending: isStartingGame } = useWriteContract();
  const { writeContract: writeRollDice, isPending: isRollingDice } = useWriteContract();

  // Read player status
  const { data: playerStatus, refetch: refetchPlayerStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPlayerStatus',
    args: address ? [address] : undefined,
    query: { enabled: !!address && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' }
  });

  // Read game stats
  const { data: gameStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getGameStats',
    query: { enabled: isConnected && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' }
  });

  // Read leaderboard
  const { data: leaderboard, refetch: refetchLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getLeaderboard',
    query: { enabled: isConnected && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' }
  });

  // Watch for contract events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'GameStarted',
    onLogs: (logs) => {
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog) {
        toast.success('Game started successfully!');
        refetchPlayerStatus();
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
        toast.success(`Rolled ${dice}! Moved to position ${newPosition}${nunuEarned > 0 ? `. Earned ${formatEther(nunuEarned)} NUNU coins!` : ''}`);
        refetchPlayerStatus();
        refetchLeaderboard();
      }
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'RewardsClaimed',
    onLogs: (logs) => {
      const playerLog = logs.find(log => log.args.player === address);
      if (playerLog && playerLog.args) {
        toast.success(`Rewards claimed: ${formatEther(playerLog.args.amount)} NUNU tokens!`);
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

  // Update game state when player status changes
  useEffect(() => {
    if (playerStatus && gameStats) {
      const [position, diceValue, nunuEarned, gameScore, hasFinished, boardGenerated] = playerStatus;
      const [, , rollFee] = gameStats;
      
      setGameState({
        position: Number(position),
        diceValue: Number(diceValue),
        nunuEarned: Number(formatEther(nunuEarned)),
        gameScore: Number(gameScore),
        hasFinished,
        boardGenerated,
        rollFee
      });
    }
  }, [playerStatus, gameStats]);

  // Contract interaction functions
  const startGame = async () => {
    if (!isConnected || !chain || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      toast.error('Please configure contract address first');
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

    if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      toast.error('Please configure contract address first');
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
    } catch (error) {
      console.error('Error rolling dice:', error);
      toast.error('Failed to roll dice');
      setIsLoading(false);
    }
  };

  const getTile = async (position: number): Promise<ContractTile | null> => {
    if (!address) return null;

    try {
      // This would need to be implemented as a separate read contract call
      // For now, return null as we'd need to restructure how tiles are handled
      return null;
    } catch (error) {
      console.error('Error getting tile:', error);
      return null;
    }
  };

  const getLeaderboardData = (): LeaderboardEntry[] => {
    return (leaderboard as LeaderboardEntry[]) || [];
  };

  return {
    // State
    gameState,
    isLoading: isLoading || isStartingGame || isRollingDice,
    isConnected,
    leaderboard: getLeaderboardData(),
    
    // Actions
    startGame,
    rollDice,
    getTile,
    
    // Utils
    refetchPlayerStatus,
    refetchLeaderboard,
    CONTRACT_ADDRESS
  };
};
