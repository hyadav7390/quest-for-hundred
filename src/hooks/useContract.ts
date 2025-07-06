
import { useState, useEffect, useCallback } from 'react';
import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { toast } from 'sonner';
import { GAME_ABI } from '@/abi/gameABI';
import { monadTestnet } from '@/types/monadTestnet';

// Contract address - Replace with your actual contract address
// const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || '0x9d5c35e1a0db4db616211982a0e7b889e3df3b95';
const CONTRACT_ADDRESS = '0xbd6e9a2dd90a75187c85f99c89779a56b5f729ea';

interface BoardData {
  giftTiles: { index: number; points: number }[];
  detourTrapTiles: { index: number; moveBack: number }[];
  shortcutGateTiles: { index: number; moveForward: number }[];
}

interface GameState {
  position: number;
  gameScore: number;
  nunuEarned: number;
  hasFinished: boolean;
  boardGenerated: boolean;
  diceValue: number;
  diceRolls: number;
  giftsCollected: number;
  shortcuts: number;
  detours: number;
}

interface GameStats {
  gamesCompleted: number;
  totalNunuEarned: number;
}

export interface LeaderboardEntry {
  player: string;
  score: number;
}

export const useContract = () => {
  const { address } = useAccount();

  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [playerRank, setPlayerRank] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStartGame, setIsLoadingStartGame] = useState(false);
  const [isWaitingForVRF, setIsWaitingForVRF] = useState(false);

  // Add state for claim rewards
  const [claimRewardsError, setClaimRewardsError] = useState<string | null>(null);

  // Contract calls
  const { 
    writeContract: writeStartGame, 
    data: startGameHash, 
    isPending: isStartGamePending, 
    error: startGameError 
  } = useWriteContract();
  
  const { 
    writeContract: writeRollDice, 
    data: rollDiceHash, 
    isPending: isRollDicePending, 
    error: rollDiceError 
  } = useWriteContract();

  const { 
    isLoading: isStartGameConfirming, 
    isSuccess: isStartGameConfirmed, 
    error: startGameReceiptError 
  } = useWaitForTransactionReceipt({
    hash: startGameHash,
  });

  const { 
    isLoading: isRollDiceConfirming, 
    isSuccess: isRollDiceConfirmed, 
    error: rollDiceReceiptError 
  } = useWaitForTransactionReceipt({
    hash: rollDiceHash,
  });

  // Add claimRewards contract call
  const { 
    writeContract: writeClaimRewards, 
    data: claimRewardsHash,
    isPending: isClaimRewardsPending,
    error: claimRewardsWriteError
  } = useWriteContract();

  const { 
    isLoading: isClaimRewardsConfirming,
    isSuccess: isClaimRewardsConfirmed,
    error: claimRewardsReceiptError
  } = useWaitForTransactionReceipt({
    hash: claimRewardsHash,
  });

  // Read contract data using useReadContract hooks with optimized queries
  const { data: playerStatusData, refetch: refetchPlayerStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getPlayerStatus',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: false, // Only refetch on demand
      staleTime: 1000, // Cache for 1 second
    },
  });

  const { data: boardDataData, refetch: refetchBoardData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getBoard',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: false, // Only refetch on demand
      staleTime: 30000, // Cache board data for 30 seconds (rarely changes)
    },
  });

  const { data: gameStatsData, refetch: refetchGameStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getGameStats',
    query: {
      enabled: true,
      refetchInterval: false, // Only refetch on demand
      staleTime: 10000, // Cache for 10 seconds
    },
  });

  const { data: playerRankData, refetch: refetchPlayerRank } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getPlayerRank',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: false, // Only refetch on demand
      staleTime: 5000, // Cache for 5 seconds
    },
  });

  const { data: leaderboardData, refetch: refetchLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getLeaderboard',
    query: {
      enabled: true,
      refetchInterval: false, // Only refetch on demand
      staleTime: 15000, // Cache for 15 seconds
    },
  });

  // Contract interactions with comprehensive logging
  const startGame = useCallback(async () => {
    if (!address || isStartGamePending || isStartGameConfirming) {
      console.log('🚫 [CONTRACT] Start game blocked:', { 
        address: !!address, 
        isStartGamePending, 
        isStartGameConfirming 
      });
      return;
    }

    console.log('🎮 [CONTRACT] Starting new game...', { 
      address, 
      contractAddress: CONTRACT_ADDRESS 
    });
    
    setIsLoadingStartGame(true);
    try {
      const txConfig = {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: GAME_ABI,
        functionName: 'startGame' as const,
        chain: monadTestnet,
        account: address,
        gas: 1000000n
      };
      
      console.log('📋 [CONTRACT] Start game transaction config:', txConfig);
      writeStartGame(txConfig);
      
    } catch (error: any) {
      console.error('❌ [CONTRACT] Failed to start game:', error);
      setIsLoadingStartGame(false);
      toast.error(`Failed to start game: ${error?.message || 'Unknown error'}`, {
        position: 'top-right'
      });
    }
  }, [address, writeStartGame, isStartGamePending, isStartGameConfirming]);

  const rollDice = useCallback(async (currentPosition: number) => {
    if (!address || isRollDicePending || isRollDiceConfirming) {
      console.log('🚫 [CONTRACT] Roll dice blocked:', { 
        address: !!address, 
        isRollDicePending, 
        isRollDiceConfirming 
      });
      return;
    }

    console.log('🎲 [CONTRACT] Rolling dice...', { 
      address, 
      currentPosition, 
      contractAddress: CONTRACT_ADDRESS 
    });

    setIsWaitingForVRF(true);
    try {
      const txConfig = {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: GAME_ABI,
        functionName: 'rollDice' as const,
        args: [currentPosition] as const,
        value: BigInt('1000000000000000'), // 0.001 ETH in wei
        chain: monadTestnet,
        account: address,
        gas: 200000n
      };
      
      console.log('📋 [CONTRACT] Roll dice transaction config:', txConfig);
      writeRollDice(txConfig);
      
    } catch (error: any) {
      console.error('❌ [CONTRACT] Failed to roll dice:', error);
      setIsWaitingForVRF(false);
      toast.error(`Failed to roll dice: ${error?.message || 'Unknown error'}`, {
        position: 'top-right'
      });
    }
  }, [address, writeRollDice, isRollDicePending, isRollDiceConfirming]);

  // Auto claim rewards when game finishes
  const claimRewards = useCallback(async () => {
    if (!address || !gameState?.hasFinished) {
      console.log('🚫 [CONTRACT] Claim rewards blocked:', { 
        address: !!address, 
        hasFinished: gameState?.hasFinished 
      });
      return;
    }

    console.log('💰 [CONTRACT] Claiming rewards...', { 
      address, 
      nunuEarned: gameState.nunuEarned 
    });

    try {
      setClaimRewardsError(null);
      const txConfig = {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: GAME_ABI,
        functionName: 'claimRewards' as const,
        chain: monadTestnet,
        account: address,
        gas: 500000n
      };
      
      console.log('📋 [CONTRACT] Claim rewards transaction config:', txConfig);
      writeClaimRewards(txConfig);
      
    } catch (error: any) {
      console.error('❌ [CONTRACT] Error claiming rewards:', error);
      const errorMessage = error?.message?.includes('finish first') 
        ? 'Game not finished yet'
        : error?.message?.includes('no reward')
        ? 'No rewards to claim'
        : 'Failed to claim rewards';
      
      setClaimRewardsError(errorMessage);
      toast.error(`Claim Rewards Failed: ${errorMessage}`, {
        position: 'top-right'
      });
    }
  }, [address, gameState?.hasFinished, gameState?.nunuEarned, writeClaimRewards]);

  // Handle claim rewards success
  useEffect(() => {
    if (isClaimRewardsConfirmed) {
      console.log('✅ [CONTRACT] Rewards claimed successfully');
      toast.success('Rewards claimed successfully!', {
        position: 'top-right'
      });
      setClaimRewardsError(null);
      // Refresh game data
      fetchAllGameData();
    }
  }, [isClaimRewardsConfirmed]);

  // Handle claim rewards errors
  useEffect(() => {
    if (claimRewardsWriteError || claimRewardsReceiptError) {
      const error = claimRewardsWriteError || claimRewardsReceiptError;
      console.error('❌ [CONTRACT] Claim rewards error:', error);
      
      const errorMessage = error?.message?.includes('finish first') 
        ? 'Game not finished yet'
        : error?.message?.includes('no reward')
        ? 'No rewards to claim'
        : 'Transaction failed';
      
      setClaimRewardsError(errorMessage);
      toast.error(`Claim Rewards Failed: ${errorMessage}`, {
        position: 'top-right'
      });
    }
  }, [claimRewardsWriteError, claimRewardsReceiptError]);

  // Process contract data when it changes
  useEffect(() => {
    if (playerStatusData) {
      const playerStatus = playerStatusData as any;
      console.log('📊 [CONTRACT] Player status updated:', playerStatus);
      
      setGameState({
        position: Number(playerStatus[0]),
        diceValue: Number(playerStatus[1]),
        nunuEarned: Number(playerStatus[2]),
        gameScore: Number(playerStatus[3]),
        hasFinished: playerStatus[4],
        boardGenerated: playerStatus[5],
        diceRolls: Number(playerStatus[6]),
        giftsCollected: Number(playerStatus[7]),
        shortcuts: Number(playerStatus[8]),
        detours: Number(playerStatus[9]),
      });
    }
  }, [playerStatusData]);

  useEffect(() => {
    if (boardDataData) {
      console.log('🎯 [CONTRACT] Board data updated');
      const board = boardDataData as any[];
      const giftTiles: { index: number; points: number }[] = [];
      const detourTrapTiles: { index: number; moveBack: number }[] = [];
      const shortcutGateTiles: { index: number; moveForward: number }[] = [];

      // Parse the board array (index 0 is unused, start from 1)
      for (let i = 1; i <= 100; i++) {
        const tile = board[i];
        if (tile) {
          const giftValue = Number(tile.giftValue || 0);
          const doorOffset = Number(tile.doorOffset || 0);

          if (giftValue > 0) {
            giftTiles.push({ index: i, points: giftValue });
          } else if (doorOffset !== 0) {
            if (doorOffset > 0) {
              // Green door (shortcut)
              shortcutGateTiles.push({ index: i, moveForward: doorOffset });
            } else {
              // Red door (detour)
              detourTrapTiles.push({ index: i, moveBack: Math.abs(doorOffset) });
            }
          }
        }
      }

      console.log('🎯 [CONTRACT] Parsed board:', {
        gifts: giftTiles.length,
        detours: detourTrapTiles.length,
        shortcuts: shortcutGateTiles.length
      });

      setBoardData({
        giftTiles,
        detourTrapTiles,
        shortcutGateTiles,
      });
    }
  }, [boardDataData]);

  useEffect(() => {
    if (gameStatsData) {
      const gameStats = gameStatsData as any;
      console.log('📈 [CONTRACT] Game stats updated:', gameStats);
      setGameStats({
        gamesCompleted: Number(gameStats[0]),
        totalNunuEarned: Number(gameStats[1]),
      });
    }
  }, [gameStatsData]);

  useEffect(() => {
    if (playerRankData) {
      console.log('🏆 [CONTRACT] Player rank updated:', Number(playerRankData));
      setPlayerRank(Number(playerRankData));
    }
  }, [playerRankData]);

  useEffect(() => {
    if (leaderboardData) {
      const formattedLeaderboard = (leaderboardData as any[]).map((entry: any) => ({
        player: entry.player,
        score: Number(entry.score),
      }));
      console.log('🏅 [CONTRACT] Leaderboard updated:', formattedLeaderboard.length, 'entries');
      setLeaderboard(formattedLeaderboard);
    }
  }, [leaderboardData]);

  // Fetch all game data function with logging
  const fetchAllGameData = useCallback(async () => {
    if (!address) {
      console.log('🚫 [CONTRACT] Cannot fetch data - no address');
      return;
    }

    console.log('🔄 [CONTRACT] Fetching all game data...');
    setIsLoading(true);
    try {
      const result = await Promise.all([
        refetchPlayerStatus(),
        refetchBoardData(),
        refetchGameStats(),
        refetchPlayerRank(),
      ]);
      console.log('✅ [CONTRACT] All game data fetched successfully');
    } catch (error) {
      console.error('❌ [CONTRACT] Failed to fetch game data:', error);
      toast.error(`Failed to fetch game data: ${error}`, {
        position: 'top-right'
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, refetchPlayerStatus, refetchBoardData, refetchGameStats, refetchPlayerRank]);

  const fetchLeaderboard = useCallback(async () => {
    console.log('🔄 [CONTRACT] Fetching leaderboard...');
    try {
      await refetchLeaderboard();
      console.log('✅ [CONTRACT] Leaderboard fetched successfully');
    } catch (error) {
      console.error('❌ [CONTRACT] Failed to fetch leaderboard:', error);
    }
  }, [refetchLeaderboard]);

  // Fetch initial data and set up polling
  useEffect(() => {
    if (address) {
      console.log('👤 [CONTRACT] Address connected, fetching initial data...');
      fetchAllGameData();
    }
  }, [address, fetchAllGameData]);

  // Update local state on contract events with proper loading state management
  useEffect(() => {
    if (isStartGameConfirmed) {
      console.log('✅ [CONTRACT] Start game transaction confirmed');
      setIsLoadingStartGame(false);
      setIsLoading(true);
      toast.success('Game started successfully!', {
        position: 'top-right'
      });
      fetchAllGameData();
    }
  }, [isStartGameConfirmed, fetchAllGameData]);

  useEffect(() => {
    if (isRollDiceConfirmed) {
      console.log('✅ [CONTRACT] Roll dice transaction confirmed');
      setIsWaitingForVRF(false);
      setIsLoading(true);
      fetchAllGameData();
    }
  }, [isRollDiceConfirmed, fetchAllGameData]);

  // Handle transaction errors with proper loading state cleanup
  useEffect(() => {
    if (startGameError || startGameReceiptError) {
      console.error('❌ [CONTRACT] Start game error:', startGameError || startGameReceiptError);
      setIsLoadingStartGame(false);
    }
  }, [startGameError, startGameReceiptError]);

  useEffect(() => {
    if (rollDiceError || rollDiceReceiptError) {
      console.error('❌ [CONTRACT] Roll dice error:', rollDiceError || rollDiceReceiptError);
      setIsWaitingForVRF(false);
    }
  }, [rollDiceError, rollDiceReceiptError]);

  // Auto-trigger claim rewards when player finishes game
  useEffect(() => {
    if (gameState?.hasFinished && gameState.nunuEarned > 0 && !claimRewardsError) {
      console.log('🎉 [CONTRACT] Game finished, auto-claiming rewards...');
      // Small delay to ensure UI animations complete
      const timer = setTimeout(() => {
        claimRewards();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.hasFinished, gameState?.nunuEarned, claimRewards, claimRewardsError]);

  return {
    CONTRACT_ADDRESS,
    gameState,
    boardData,
    gameStats,
    playerRank,
    leaderboard,
    isLoading,
    isLoadingStartGame: isLoadingStartGame || isStartGamePending || isStartGameConfirming,
    isWaitingForVRF: isWaitingForVRF || isRollDicePending || isRollDiceConfirming,
    startGame,
    rollDice,
    fetchAllGameData,
    fetchLeaderboard,
    isConnected: !!address,
    claimRewards,
    claimRewardsError,
    isClaimRewardsPending: isClaimRewardsPending || isClaimRewardsConfirming,
  };
};
