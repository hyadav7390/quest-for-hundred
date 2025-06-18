
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
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
  
  // Contract write operations with transaction receipt waiting
  const { 
    writeContract: writeStartGame, 
    isPending: isStartingGame, 
    data: startGameHash 
  } = useWriteContract();
  
  const { 
    writeContract: writeRollDice, 
    isPending: isRollingDice, 
    data: rollDiceHash 
  } = useWriteContract();

  // Wait for transaction receipts
  const { isLoading: isStartGameConfirming } = useWaitForTransactionReceipt({
    hash: startGameHash,
  });

  const { isLoading: isRollDiceConfirming } = useWaitForTransactionReceipt({
    hash: rollDiceHash,
  });

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
      if (arrayIndex === 0) return; // Skip index 0 as it's not used in the game
      
      if (tile.giftValue > 0) {
        const points = Number(formatEther(tile.giftValue));
        giftTiles.push({ index: arrayIndex, points });
        console.log(`🎁 [TILE] Gift tile at position ${arrayIndex}: ${points} NUNU tokens`);
      } else if (tile.doorOffset !== 0) {
        if (tile.doorOffset < 0) {
          const moveBack = Math.abs(tile.doorOffset);
          detourTrapTiles.push({ index: arrayIndex, moveBack });
          console.log(`🚪❌ [TILE] Detour trap at position ${arrayIndex}: move back ${moveBack}`);
        } else {
          const moveForward = tile.doorOffset;
          shortcutGateTiles.push({ index: arrayIndex, moveForward });
          console.log(`🚪✅ [TILE] Shortcut gate at position ${arrayIndex}: move forward ${moveForward}`);
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
      console.log('📊 [BLOCKCHAIN READ] Starting fetchPlayerStatus...');
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

        console.log('✅ [BLOCKCHAIN READ] Player status updated:', newGameState);
        setGameState(newGameState);
        return newGameState;
      }
      
      console.log('⚠️ [BLOCKCHAIN READ] Player status fetch completed but no valid data');
      return result;
    } catch (error) {
      console.error('❌ [BLOCKCHAIN READ] Error fetching player status:', error);
      return null;
    }
  }, [address, refetchPlayerStatus, gameStats]);

  const fetchBoardData = useCallback(async () => {
    if (!address) {
      console.log('⚠️ [FETCH] No address available for board data fetch');
      return null;
    }

    try {
      console.log('📋 [BLOCKCHAIN READ] Starting fetchBoardData...');
      const result = await refetchBoard();
      
      if (result.data) {
        console.log('📋 [BLOCKCHAIN READ] Board data received from contract, processing...');
        processBoardData(result.data);
      } else {
        console.log('⚠️ [BLOCKCHAIN READ] Board data fetch completed but no data received');
      }
      
      return result;
    } catch (error) {
      console.error('❌ [BLOCKCHAIN READ] Error fetching board data:', error);
      return null;
    }
  }, [address, refetchBoard, processBoardData]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      console.log('🏆 [BLOCKCHAIN READ] Starting fetchLeaderboard...');
      const result = await refetchLeaderboard();
      
      if (result.data) {
        console.log('✅ [BLOCKCHAIN READ] Leaderboard updated:', result.data.length, 'entries');
        setLeaderboard(result.data as LeaderboardEntry[]);
      }
      
      return result;
    } catch (error) {
      console.error('❌ [BLOCKCHAIN READ] Error fetching leaderboard:', error);
      return null;
    }
  }, [refetchLeaderboard]);

  const fetchPlayerRank = useCallback(async () => {
    if (!address) return null;

    try {
      console.log('🏅 [BLOCKCHAIN READ] Starting fetchPlayerRank...');
      const result = await refetchPlayerRank();
      
      if (result.data) {
        const rank = Number(result.data);
        console.log('✅ [BLOCKCHAIN READ] Player rank updated:', rank);
        setPlayerRank(rank);
      }
      
      return result;
    } catch (error) {
      console.error('❌ [BLOCKCHAIN READ] Error fetching player rank:', error);
      return null;
    }
  }, [address, refetchPlayerRank]);

  const fetchGameStats = useCallback(async () => {
    try {
      console.log('📈 [BLOCKCHAIN READ] Starting fetchGameStats...');
      const result = await refetchGameStats();
      
      if (result.data) {
        console.log('✅ [BLOCKCHAIN READ] Game stats updated:', result.data);
        setGameStats(result.data);
      }
      
      return result;
    } catch (error) {
      console.error('❌ [BLOCKCHAIN READ] Error fetching game stats:', error);
      return null;
    }
  }, [refetchGameStats]);

  const fetchAllGameData = useCallback(async () => {
    console.log('🔄 [BLOCKCHAIN READ] Starting fetchAllGameData...');
    
    // First fetch game stats as other functions depend on it
    await fetchGameStats();
    
    // Then fetch other data in parallel
    await Promise.all([
      fetchPlayerStatus(),
      fetchBoardData(),
      fetchLeaderboard(),
      fetchPlayerRank()
    ]);
    
    console.log('✅ [BLOCKCHAIN READ] All game data fetched complete');
  }, [fetchGameStats, fetchPlayerStatus, fetchBoardData, fetchLeaderboard, fetchPlayerRank]);

  // Manual polling after transactions
  const pollAfterTransaction = useCallback(async (action: string, maxAttempts = 10) => {
    console.log(`🔄 [POLLING] Starting polling after ${action}...`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`📊 [POLLING] Attempt ${attempt}/${maxAttempts} for ${action}`);
      
      // Wait a bit before each attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const oldState = gameState;
      await fetchAllGameData();
      
      // Check if state has changed significantly
      if (action === 'startGame' && gameState?.boardGenerated && !oldState?.boardGenerated) {
        console.log('✅ [POLLING] Game started successfully detected');
        setIsLoading(false);
        toast.success('Game started successfully! Board generated on-chain.');
        break;
      } else if (action === 'rollDice' && gameState?.diceValue && gameState.diceValue !== oldState?.diceValue) {
        console.log('✅ [POLLING] Dice roll result detected');
        setIsWaitingForVRF(false);
        setIsLoading(false);
        toast.success(`🎲 Rolled ${gameState.diceValue}! Moved to position ${gameState.position}.`);
        break;
      }
      
      if (attempt === maxAttempts) {
        console.log(`⚠️ [POLLING] Max attempts reached for ${action}`);
        setIsLoading(false);
        setIsWaitingForVRF(false);
      }
    }
  }, [gameState, fetchAllGameData]);

  // Watch for transaction confirmations
  useEffect(() => {
    if (startGameHash && !isStartGameConfirming) {
      console.log('✅ [BLOCKCHAIN WRITE] Start game transaction confirmed');
      pollAfterTransaction('startGame');
    }
  }, [startGameHash, isStartGameConfirming, pollAfterTransaction]);

  useEffect(() => {
    if (rollDiceHash && !isRollDiceConfirming) {
      console.log('✅ [BLOCKCHAIN WRITE] Roll dice transaction confirmed');
      pollAfterTransaction('rollDice');
    }
  }, [rollDiceHash, isRollDiceConfirming, pollAfterTransaction]);

  // Contract interaction functions with improved logging
  const startGame = async () => {
    if (!isConnected || !chain || !address) {
      console.log('⚠️ [BLOCKCHAIN WRITE] Wallet not connected for game start');
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      console.log('🎮 [BLOCKCHAIN WRITE] Starting startGame transaction...');
      setIsLoading(true);
      
      await writeStartGame({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'startGame',
        chain,
        account: address
      });
      
      console.log('✅ [BLOCKCHAIN WRITE] Start game transaction sent successfully');
    } catch (error) {
      console.error('❌ [BLOCKCHAIN WRITE] Error starting game:', error);
      toast.error('Failed to start game');
      setIsLoading(false);
    }
  };

  const rollDice = async (expectedPosition: number) => {
    if (!isConnected || !chain || !address || !gameStats) {
      console.log('⚠️ [BLOCKCHAIN WRITE] Wallet not connected or game stats not available for dice roll');
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      console.log('🎲 [BLOCKCHAIN WRITE] Starting rollDice transaction with expected position:', expectedPosition);
      setIsLoading(true);
      setIsWaitingForVRF(true);
      const rollFee = gameStats[2]; // rollFee is third element in gameStats
      
      console.log('💰 [BLOCKCHAIN WRITE] Roll fee required:', formatEther(rollFee), 'ETH');
      
      await writeRollDice({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'rollDice',
        args: [expectedPosition],
        value: rollFee,
        chain,
        account: address
      });
      
      console.log('✅ [BLOCKCHAIN WRITE] Roll dice transaction sent successfully');
    } catch (error) {
      console.error('❌ [BLOCKCHAIN WRITE] Error rolling dice:', error);
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
    isLoading: isLoading || isStartingGame || isRollingDice || isStartGameConfirming || isRollDiceConfirming,
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
