
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
  
  console.log('🎮 [CONTRACT] Hook initialized with address:', address);
  
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
  const { isLoading: isStartGameConfirming, isSuccess: isStartGameSuccess } = useWaitForTransactionReceipt({
    hash: startGameHash,
  });

  const { isLoading: isRollDiceConfirming, isSuccess: isRollDiceSuccess } = useWaitForTransactionReceipt({
    hash: rollDiceHash,
  });

  // Handle transaction errors
  useEffect(() => {
    if (startGameError) {
      console.error('❌ [CONTRACT ERROR] Start game failed:', startGameError);
      toast.error(`Failed to start game: ${startGameError.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  }, [startGameError]);

  useEffect(() => {
    if (rollDiceError) {
      console.error('❌ [CONTRACT ERROR] Roll dice failed:', rollDiceError);
      toast.error(`Failed to roll dice: ${rollDiceError.message || 'Unknown error'}`);
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
    console.log('🏗️ [CONTRACT] Processing board data:', boardTiles);
    
    if (!boardTiles || !Array.isArray(boardTiles)) {
      console.warn('⚠️ [CONTRACT] Invalid board tiles data');
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
        console.log(`🎁 [CONTRACT] Gift tile at position ${arrayIndex}: ${points} points`);
      } else if (tile.doorOffset !== 0) {
        if (tile.doorOffset < 0) {
          const moveBack = Math.abs(tile.doorOffset);
          detourTrapTiles.push({ index: arrayIndex, moveBack });
          console.log(`🚪 [CONTRACT] Detour trap at position ${arrayIndex}: move back ${moveBack}`);
        } else {
          const moveForward = tile.doorOffset;
          shortcutGateTiles.push({ index: arrayIndex, moveForward });
          console.log(`⚡ [CONTRACT] Shortcut gate at position ${arrayIndex}: move forward ${moveForward}`);
        }
      }
    });

    const processedBoardData = {
      giftTiles,
      detourTrapTiles,
      shortcutGateTiles
    };
    
    console.log('✅ [CONTRACT] Board data processed:', processedBoardData);
    setBoardData(processedBoardData);
  }, []);

  // Manual fetch functions with improved error handling and logging
  const fetchPlayerStatus = useCallback(async () => {
    if (!address) {
      console.log('⚠️ [CONTRACT] No address for player status fetch');
      return null;
    }

    console.log('📊 [CONTRACT] Fetching player status for:', address);
    
    try {
      const result = await refetchPlayerStatus();
      if (result.isSuccess && result.data) {
        const [position, diceValue, nunuEarned, gameScore, hasFinished, boardGenerated] = result.data;
        
        const newGameState = {
          position: Number(position),
          diceValue: Number(diceValue),
          nunuEarned: Number(formatEther(nunuEarned)),
          gameScore: Number(gameScore),
          hasFinished,
          boardGenerated,
          rollFee: gameStats ? gameStats[2] : BigInt(0)
        };

        console.log('✅ [CONTRACT] Player status fetched:', newGameState);
        setGameState(newGameState);
        return newGameState;
      }
      
      console.log('⚠️ [CONTRACT] Player status fetch unsuccessful:', result);
      return result;
    } catch (error) {
      console.error('❌ [CONTRACT] Error fetching player status:', error);
      return null;
    }
  }, [address, refetchPlayerStatus, gameStats]);

  const fetchBoardData = useCallback(async () => {
    if (!address) {
      console.log('⚠️ [CONTRACT] No address for board data fetch');
      return null;
    }

    console.log('🏗️ [CONTRACT] Fetching board data for:', address);
    
    try {
      const result = await refetchBoard();
      
      if (result.data) {
        console.log('✅ [CONTRACT] Board data fetched successfully');
        processBoardData(result.data);
      } else {
        console.log('⚠️ [CONTRACT] Board data fetch completed but no data received');
      }
      
      return result;
    } catch (error) {
      console.error('❌ [CONTRACT] Error fetching board data:', error);
      return null;
    }
  }, [address, refetchBoard, processBoardData]);

  const fetchLeaderboard = useCallback(async () => {
    console.log('🏆 [CONTRACT] Fetching leaderboard');
    
    try {
      const result = await refetchLeaderboard();
      
      if (result.data) {
        console.log('✅ [CONTRACT] Leaderboard fetched:', result.data);
        setLeaderboard(result.data as LeaderboardEntry[]);
      }
      
      return result;
    } catch (error) {
      console.error('❌ [CONTRACT] Error fetching leaderboard:', error);
      return null;
    }
  }, [refetchLeaderboard]);

  const fetchPlayerRank = useCallback(async () => {
    if (!address) return null;

    console.log('🏅 [CONTRACT] Fetching player rank for:', address);
    
    try {
      const result = await refetchPlayerRank();
      
      if (result.data) {
        const rank = Number(result.data);
        console.log('✅ [CONTRACT] Player rank fetched:', rank);
        setPlayerRank(rank);
      }
      
      return result;
    } catch (error) {
      console.error('❌ [CONTRACT] Error fetching player rank:', error);
      return null;
    }
  }, [address, refetchPlayerRank]);

  const fetchGameStats = useCallback(async () => {
    console.log('📈 [CONTRACT] Fetching game stats');
    
    try {
      const result = await refetchGameStats();
      
      if (result.data) {
        console.log('✅ [CONTRACT] Game stats fetched:', result.data);
        setGameStats(result.data);
      }
      
      return result;
    } catch (error) {
      console.error('❌ [CONTRACT] Error fetching game stats:', error);
      return null;
    }
  }, [refetchGameStats]);

  const fetchAllGameData = useCallback(async () => {
    console.log('🔄 [CONTRACT] Fetching all game data');
    
    // First fetch game stats as other functions depend on it
    await fetchGameStats();
    
    // Then fetch other data in parallel
    await Promise.all([
      fetchPlayerStatus(),
      fetchBoardData(),
      fetchLeaderboard(),
      fetchPlayerRank()
    ]);
    
    console.log('✅ [CONTRACT] All game data fetched');
  }, [fetchGameStats, fetchPlayerStatus, fetchBoardData, fetchLeaderboard, fetchPlayerRank]);

  // Manual polling after transactions with improved timing and logging
  const pollAfterTransaction = useCallback(async (action: string, maxAttempts = 5) => {
    console.log(`🔄 [CONTRACT] Starting polling for ${action} (max ${maxAttempts} attempts)`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`📊 [CONTRACT] Polling attempt ${attempt}/${maxAttempts} for ${action}`);
      
      // Wait longer between attempts to allow VRF to complete
      await new Promise(resolve => setTimeout(resolve, action === 'rollDice' ? 3000 : 2000));
      
      const oldState = gameState;
      await fetchAllGameData();
      
      // Check if state has changed significantly
      if (action === 'startGame' && gameState?.boardGenerated && !oldState?.boardGenerated) {
        console.log('✅ [CONTRACT] Start game polling successful - board generated');
        setIsLoading(false);
        toast.success('Game started successfully! Board generated on-chain.');
        break;
      } else if (action === 'rollDice' && gameState?.diceValue && gameState.diceValue !== oldState?.diceValue) {
        console.log(`✅ [CONTRACT] Roll dice polling successful - dice value: ${gameState.diceValue}`);
        setIsWaitingForVRF(false);
        setIsLoading(false);
        toast.success(`🎲 Rolled ${gameState.diceValue}! Moved to position ${gameState.position}.`);
        break;
      }

      if (attempt === maxAttempts) {
        console.log(`⚠️ [CONTRACT] Max polling attempts reached for ${action}`);
        setIsLoading(false);
        setIsWaitingForVRF(false);
        if (action === 'rollDice') {
          toast.error('Dice roll result not received. Please refresh and try again.');
        } else {
          toast.error('Transaction completed but state update not confirmed. Please refresh.');
        }
      }
    }
  }, [gameState, fetchAllGameData]);

  // Watch for transaction confirmations with logging
  useEffect(() => {
    if (startGameHash && isStartGameSuccess) {
      console.log('✅ [CONTRACT] Start game transaction confirmed:', startGameHash);
      pollAfterTransaction('startGame');
    }
  }, [startGameHash, isStartGameSuccess, pollAfterTransaction]);

  useEffect(() => {
    if (rollDiceHash && isRollDiceSuccess) {
      console.log('✅ [CONTRACT] Roll dice transaction confirmed:', rollDiceHash);
      pollAfterTransaction('rollDice');
    }
  }, [rollDiceHash, isRollDiceSuccess, pollAfterTransaction]);

  // Contract interaction functions with improved logging and error handling
  const startGame = async () => {
    console.log('🎮 [CONTRACT] Starting game transaction');
    
    if (!isConnected || !chain || !address) {
      console.error('❌ [CONTRACT] Not connected - cannot start game');
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      console.log('📤 [CONTRACT] Sending start game transaction');
      
      const result = await writeStartGame({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'startGame',
        chain,
        account: address
      });
      
      console.log('✅ [CONTRACT] Start game transaction sent:', result);
    } catch (error: any) {
      console.error('❌ [CONTRACT] Error starting game:', error);
      
      // Check for insufficient balance
      if (error.message?.includes('insufficient funds') || error.message?.includes('not enough balance')) {
        toast.error('Insufficient balance to pay for transaction fees. Please add funds to your wallet.');
      } else {
        toast.error(`Failed to start game: ${error.message || 'Unknown error'}`);
      }
      
      setIsLoading(false);
    }
  };

  const rollDice = async (expectedPosition: number) => {
    console.log(`🎲 [CONTRACT] Rolling dice from position ${expectedPosition}`);
    
    if (!isConnected || !chain || !address || !gameStats) {
      console.error('❌ [CONTRACT] Not ready for dice roll');
      toast.error('Please connect your wallet and ensure game is loaded');
      return;
    }

    try {
      setIsLoading(true);
      setIsWaitingForVRF(true);
      const rollFee = gameStats[2]; // rollFee is third element in gameStats
      
      console.log('📤 [CONTRACT] Sending roll dice transaction with fee:', rollFee);
      
      const result = await writeRollDice({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'rollDice',
        args: [expectedPosition],
        value: rollFee,
        chain,
        account: address
      });
      
      console.log('✅ [CONTRACT] Roll dice transaction sent:', result);
    } catch (error: any) {
      console.error('❌ [CONTRACT] Error rolling dice:', error);
      
      // Check for insufficient balance
      if (error.message?.includes('insufficient funds') || error.message?.includes('not enough balance')) {
        toast.error('Insufficient balance to pay for dice roll fee. Please add funds to your wallet.');
      } else {
        toast.error(`Failed to roll dice: ${error.message || 'Unknown error'}`);
      }
      
      setIsLoading(false);
      setIsWaitingForVRF(false);
    }
  };

  // Initialize game data when connected - only once
  useEffect(() => {
    if (isConnected && address && !gameState) {
      console.log('🔄 [CONTRACT] Initializing game data for connected user');
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
