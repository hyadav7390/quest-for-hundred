import { useState, useEffect, useCallback, useRef } from 'react';
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
    "inputs": [{ "internalType": "uint8", "name": "expectedPosition", "type": "uint8" }],
    "name": "rollDice",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
    "name": "getPlayerStatus",
    "outputs": [
      { "internalType": "uint8", "name": "position", "type": "uint8" },
      { "internalType": "uint8", "name": "diceValue", "type": "uint8" },
      { "internalType": "uint256", "name": "nunuEarned", "type": "uint256" },
      { "internalType": "uint256", "name": "gameScore", "type": "uint256" },
      { "internalType": "bool", "name": "hasFinished", "type": "bool" },
      { "internalType": "bool", "name": "boardGenerated", "type": "bool" },
      {
        "internalType": "uint8",
        "name": "diceRolls",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "giftsCollected",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "shortcuts",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "detours",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
    "name": "getBoard",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "giftValue", "type": "uint256" },
          { "internalType": "int16", "name": "doorOffset", "type": "int16" }
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
          { "internalType": "address", "name": "player", "type": "address" },
          { "internalType": "uint256", "name": "score", "type": "uint256" }
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
      { "internalType": "uint256", "name": "_totalMinted", "type": "uint256" },
      { "internalType": "uint256", "name": "_totalMonCollected", "type": "uint256" },
      { "internalType": "uint256", "name": "rollFee", "type": "uint256" },
      { "internalType": "uint256", "name": "finishBonus", "type": "uint256" },
      { "internalType": "uint16", "name": "boardSize", "type": "uint16" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "who", "type": "address" }],
    "name": "getPlayerRank",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Hardcoded contract address
const CONTRACT_ADDRESS: `0x${string}` = '0xb68f8307f54a7695de5bf1270665b6ae8dac803c';

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

  // State management
  const [gameState, setGameState] = useState<ContractGameState | null>(null);
  const [boardData, setBoardData] = useState<ContractBoardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isWaitingForVRF, setIsWaitingForVRF] = useState(false);
  const [playerRank, setPlayerRank] = useState<number>(0);
  const [gameStats, setGameStats] = useState<any>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  // Ref for gameState to avoid dependency cycles in callbacks
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Contract write operations
  const {
    writeContract: writeStartGame,
    isPending: isStartingGame,
    data: startGameHash,
    error: startGameError,
    reset: resetStartGame
  } = useWriteContract();

  const {
    writeContract: writeRollDice,
    isPending: isRollingDice,
    data: rollDiceHash,
    error: rollDiceError,
    reset: resetRollDice
  } = useWriteContract();

  // Transaction receipt watchers
  const {
    isLoading: isStartGameConfirming,
    isSuccess: isStartGameSuccess,
    isError: isStartGameFailed
  } = useWaitForTransactionReceipt({ hash: startGameHash });

  const {
    isLoading: isRollDiceConfirming,
    isSuccess: isRollDiceSuccess,
    isError: isRollDiceFailed
  } = useWaitForTransactionReceipt({ hash: rollDiceHash });

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

  // Process board data from contract
  const processBoardData = useCallback((boardTiles: readonly { giftValue: bigint; doorOffset: number; }[]) => {
    if (!boardTiles || !Array.isArray(boardTiles)) return;

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

    setBoardData({ giftTiles, detourTrapTiles, shortcutGateTiles });
  }, []);

  // Manual fetch functions
  const fetchPlayerStatus = useCallback(async () => {
    if (!address) return null;

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

        setGameState(newGameState);
        return newGameState;
      }
      return null;
    } catch (error) {
      console.error('Error fetching player status:', error);
      return null;
    }
  }, [address, refetchPlayerStatus, gameStats]);

  const fetchBoardData = useCallback(async () => {
    if (!address) return null;

    try {
      const result = await refetchBoard();
      if (result.data) {
        processBoardData(result.data);
      }
      return result;
    } catch (error) {
      console.error('Error fetching board data:', error);
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
      console.error('Error fetching leaderboard:', error);
      return null;
    }
  }, [refetchLeaderboard]);

  const fetchPlayerRank = useCallback(async () => {
    if (!address) return null;

    try {
      const result = await refetchPlayerRank();
      if (result.data) {
        setPlayerRank(Number(result.data));
      }
      return result;
    } catch (error) {
      console.error('Error fetching player rank:', error);
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
      console.error('Error fetching game stats:', error);
      return null;
    }
  }, [refetchGameStats]);

  const fetchAllGameData = useCallback(async () => {
    if (!address || !isConnected) return;

    // First fetch game stats as other functions depend on it
    await fetchGameStats();

    // Then fetch other data in parallel
    await Promise.all([
      fetchPlayerStatus(),
      fetchBoardData(),
      fetchLeaderboard(),
      fetchPlayerRank()
    ]);
  }, [fetchGameStats, fetchPlayerStatus, fetchBoardData, fetchLeaderboard, fetchPlayerRank, address, isConnected]);

  // Poll after transactions
  const pollAfterTransaction = useCallback(async (action: 'startGame' | 'rollDice') => {
    setIsLoading(true);
    if (action === 'rollDice') setIsWaitingForVRF(true);

    const isDiceRoll = action === 'rollDice';
    const pollInterval = isDiceRoll ? 1000 : 2000; // Poll faster for dice rolls
    const maxAttempts = isDiceRoll ? 30 : 15; // Keep timeout around 30s

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const oldState = gameStateRef.current;
      const newState = await fetchPlayerStatus();

      if (!newState) continue;

      const hasStarted = newState.boardGenerated && !oldState?.boardGenerated;
      const hasRolled = newState.diceValue !== oldState?.diceValue && newState.diceValue !== 0;

      if (action === 'startGame' && hasStarted) {
        toast.success('Game started successfully!');
        await fetchAllGameData(); // Fetch rest of data now board is generated
        setIsLoading(false);
        return;
      }

      if (action === 'rollDice' && hasRolled) {
        toast.success(`🎲 Rolled ${newState.diceValue}!`);
        setIsLoading(false);
        setIsWaitingForVRF(false);
        return;
      }
    }

    // Timeout logic
    toast.error('Transaction timed out. The network may be busy. Please refresh to see the result.');
    setIsLoading(false);
    setIsWaitingForVRF(false);
  }, [fetchPlayerStatus, fetchAllGameData]);

  // Handle transaction errors
  useEffect(() => {
    const handleError = (error: any, action: string) => {
      const errorMessage = `Failed to ${action}: ${error.message || 'Unknown error'}`;
      setTransactionError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
      if (action === 'roll dice') setIsWaitingForVRF(false);
    };

    if (startGameError) handleError(startGameError, 'start game');
    if (rollDiceError) handleError(rollDiceError, 'roll dice');
  }, [startGameError, rollDiceError]);

  // Handle transaction failures
  useEffect(() => {
    const handleFailure = (action: string) => {
      const errorMessage = `Transaction failed: ${action} transaction was reverted`;
      setTransactionError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
      if (action === 'roll dice') setIsWaitingForVRF(false);
    };

    if (isStartGameFailed) handleFailure('start game');
    if (isRollDiceFailed) handleFailure('roll dice');
  }, [isStartGameFailed, isRollDiceFailed]);

  // Refs to track if polling has been triggered for a given transaction hash
  const startGameTxHashRef = useRef<`0x${string}` | undefined>();
  const rollDiceTxHashRef = useRef<`0x${string}` | undefined>();

  // Watch for transaction confirmations
  useEffect(() => {
    if (startGameHash && isStartGameSuccess && startGameTxHashRef.current !== startGameHash) {
      startGameTxHashRef.current = startGameHash;
      setTransactionError(null);
      pollAfterTransaction('startGame');
    }
  }, [startGameHash, isStartGameSuccess, pollAfterTransaction]);

  useEffect(() => {
    if (rollDiceHash && isRollDiceSuccess && rollDiceTxHashRef.current !== rollDiceHash) {
      rollDiceTxHashRef.current = rollDiceHash;
      setTransactionError(null);
      pollAfterTransaction('rollDice');
    }
  }, [rollDiceHash, isRollDiceSuccess, pollAfterTransaction]);

  // Clear game state when wallet disconnects
  useEffect(() => {
    if (!isConnected || !address) {
      setGameState(null);
      setBoardData(null);
      setLeaderboard([]);
      setPlayerRank(0);
      setGameStats(null);
      setIsLoading(false);
      setIsWaitingForVRF(false);
      setTransactionError(null);
    }
  }, [isConnected, address]);

  // Initialize game data when connected
  useEffect(() => {
    if (isConnected && address && !gameState) {
      fetchAllGameData();
    }
  }, [isConnected, address, gameState, fetchAllGameData]);

  // Contract interaction functions
  const startGame = async () => {
    if (!isConnected || !chain || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      setTransactionError(null);
      resetStartGame();
      startGameTxHashRef.current = undefined; // Reset for new transaction

      const result = await writeStartGame({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'startGame',
        chain,
        account: address
      });
    } catch (error: any) {
      const errorMessage = error.message?.includes('insufficient funds')
        ? 'Insufficient balance to pay for transaction fees. Please add funds to your wallet.'
        : `Failed to start game: ${error.message || 'Unknown error'}`;

      setTransactionError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const rollDice = async (expectedPosition: number) => {
    if (!isConnected || !chain || !address || !gameStats) {
      toast.error('Please connect your wallet and ensure game is loaded');
      return;
    }

    try {
      setIsLoading(true);
      setIsWaitingForVRF(true);
      setTransactionError(null);
      resetRollDice();
      rollDiceTxHashRef.current = undefined; // Reset for new transaction

      const rollFee = gameStats[2]; // rollFee is third element in gameStats

      const result = await writeRollDice({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'rollDice',
        args: [expectedPosition],
        // value: rollFee,
        chain,
        account: address
      });
    } catch (error: any) {
      const errorMessage = error.message?.includes('insufficient funds')
        ? 'Insufficient balance to pay for dice roll fee. Please add funds to your wallet.'
        : `Failed to roll dice: ${error.message || 'Unknown error'}`;

      toast.error(errorMessage);
      setIsLoading(false);
      setIsWaitingForVRF(false);
    }
  };

  return {
    // State
    gameState,
    boardData,
    isLoading: isLoading || isStartingGame || isRollingDice || isStartGameConfirming || isRollDiceConfirming,
    isLoadingStartGame: isStartingGame || isStartGameConfirming,
    isWaitingForVRF,
    isConnected,
    leaderboard,
    playerRank,
    transactionError,

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
