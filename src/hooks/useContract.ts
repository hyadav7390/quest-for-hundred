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
const CONTRACT_ADDRESS: `0x${string}` = '0x525b71e2716a12eaec3378df9e0a1341e91fd75c';

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
    data: startGameHash,
    error: startGameError
  } = useWriteContract();
  
  const { 
    writeContract: writeRollDice, 
    isPending: isRollingDice, 
    data: rollDiceHash,
    error: rollDiceError
  } = useWriteContract();

  // Wait for transaction receipts
  const { isLoading: isStartGameConfirming } = useWaitForTransactionReceipt({
    hash: startGameHash,
  });

  const { isLoading: isRollDiceConfirming } = useWaitForTransactionReceipt({
    hash: rollDiceHash,
  });

  // Handle transaction errors
  useEffect(() => {
    if (startGameError) {
      console.error('❌ [BLOCKCHAIN ERROR] Start game failed:', startGameError);
      toast.error('Failed to start game: ' + (startGameError.message || 'Unknown error'));
      setIsLoading(false);
    }
  }, [startGameError]);

  useEffect(() => {
    if (rollDiceError) {
      console.error('❌ [BLOCKCHAIN ERROR] Roll dice failed:', rollDiceError);
      toast.error('Failed to roll dice: ' + (rollDiceError.message || 'Unknown error'));
      setIsLoading(false);
      setIsWaitingForVRF(false);
    }
  }, [rollDiceError]);

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
      return;
    }
    const giftTiles: { index: number; points: number }[] = [];
    const detourTrapTiles: { index: number; moveBack: number }[] = [];
    const shortcutGateTiles: { index: number; moveForward: number }[] = [];

    // Process each tile - contract uses 0-based indexing in array but 1-based for game logic
    boardTiles.forEach((tile, arrayIndex) => {
      if (arrayIndex === 0) return; // Skip index 0 as it's not used in the game
      
      if (tile.giftValue > 0) {
        const points = Number(formatEther(tile.giftValue));
        giftTiles.push({ index: arrayIndex, points });
      } else if (tile.doorOffset !== 0) {
        if (tile.doorOffset < 0) {
          const moveBack = Math.abs(tile.doorOffset);
          detourTrapTiles.push({ index: arrayIndex, moveBack });
        } else {
          const moveForward = tile.doorOffset;
          shortcutGateTiles.push({ index: arrayIndex, moveForward });
        }
      }
    });

    const processedBoardData = {
      giftTiles,
      detourTrapTiles,
      shortcutGateTiles
    };
    
    setBoardData(processedBoardData);
  }, []);

  // Manual fetch functions with improved error handling
  const fetchPlayerStatus = useCallback(async () => {
    if (!address) {
      return null;
    }

    try {
      const result = await refetchPlayerStatus();
      if (result.isSuccess) {
        const [position, diceValue, nunuEarned, gameScore, hasFinished, boardGenerated] = result.data;
        const rollFee = 1000000; // rollFee is third element
        
        const newGameState = {
          position: Number(position),
          diceValue: Number(diceValue),
          nunuEarned: Number(formatEther(nunuEarned)),
          gameScore: Number(gameScore),
          hasFinished,
          boardGenerated,
          rollFee
        };

        // setGameState(newGameState);
        setGameState({
          ...gameState,
          position: Number(position),
          diceValue: Number(diceValue),
          nunuEarned: Number(formatEther(nunuEarned)),
          gameScore: Number(gameScore),
          hasFinished,
          boardGenerated,
        })
        return newGameState;
      }
      
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
      const result = await refetchBoard();
      
      if (result.data) {
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
      const result = await refetchLeaderboard();
      
      if (result.data) {
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
      const result = await refetchPlayerRank();
      
      if (result.data) {
        const rank = Number(result.data);
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
      const result = await refetchGameStats();
      
      if (result.data) {
        setGameStats(result.data);
      }
      
      return result;
    } catch (error) {
      console.error('❌ [BLOCKCHAIN READ] Error fetching game stats:', error);
      return null;
    }
  }, [refetchGameStats]);

  const fetchAllGameData = useCallback(async () => {
    
    // First fetch game stats as other functions depend on it
    await fetchGameStats();
    
    // Then fetch other data in parallel
    await Promise.all([
      fetchPlayerStatus(),
      fetchBoardData(),
      fetchLeaderboard(),
      fetchPlayerRank()
    ]);
  }, [fetchGameStats, fetchPlayerStatus, fetchBoardData, fetchLeaderboard, fetchPlayerRank]);

  // Manual polling after transactions with improved timing
  const pollAfterTransaction = useCallback(async (action: string, maxAttempts = 3) => {
    
    // for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // console.log(`📊 [POLLING] Attempt ${attempt}/${maxAttempts} for ${action}`);
      
      // Wait longer between attempts to allow VRF to complete
      // await new Promise(resolve => setTimeout(resolve, action === 'rollDice' ? 5000 : 3000));
      
      const oldState = gameState;
      await fetchAllGameData();
      
      // Check if state has changed significantly
      if (action === 'startGame' && gameState?.boardGenerated && !oldState?.boardGenerated) {
        setIsLoading(false);
        toast.success('Game started successfully! Board generated on-chain.');
        // break;
      } else if (action === 'rollDice' && gameState?.diceValue && gameState.diceValue !== oldState?.diceValue) {
        setIsWaitingForVRF(false);
        setIsLoading(false);
        toast.success(`🎲 Rolled ${gameState.diceValue}! Moved to position ${gameState.position}.`);
        // break;
      }
      setIsLoading(false);
      setIsWaitingForVRF(false);

      // if (attempt === maxAttempts) {
      //   console.log(`⚠️ [POLLING] Max attempts reached for ${action}`);
      //   setIsLoading(false);
      //   setIsWaitingForVRF(false);
      //   if (action === 'rollDice') {
      //     toast.error('Dice roll result not received. Please check your transaction.');
      //   }
      // }
    // }
  }, [gameState, fetchAllGameData]);

  // Watch for transaction confirmations
  useEffect(() => {
    if (startGameHash && !isStartGameConfirming) {
      pollAfterTransaction('startGame');
    }
  }, [startGameHash, isStartGameConfirming]);

  useEffect(() => {
    if (rollDiceHash && !isRollDiceConfirming) {
      pollAfterTransaction('rollDice');
    }
  }, [rollDiceHash, isRollDiceConfirming]);

  // Contract interaction functions with improved logging and error handling
  const startGame = async () => {
    if (!isConnected || !chain || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      const result = await writeStartGame({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'startGame',
        chain,
        account: address
      });
    } catch (error) {
      console.error('❌ [BLOCKCHAIN WRITE] Error starting game:', error);
      toast.error('Failed to start game: ' + (error.message || 'Unknown error'));
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
      setIsWaitingForVRF(true);
      const rollFee = gameStats[2]; // rollFee is third element in gameStats
      
      const result = await writeRollDice({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'rollDice',
        args: [expectedPosition],
        value: rollFee,
        chain,
        account: address
      });
    } catch (error) {
      console.error('❌ [BLOCKCHAIN WRITE] Error rolling dice:', error);
      toast.error('Failed to roll dice: ' + (error.message || 'Unknown error'));
      setIsLoading(false);
      setIsWaitingForVRF(false);
    }
  };

  // Initialize game data when connected - only once
  useEffect(() => {
    if (isConnected && address && !gameState) {
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
