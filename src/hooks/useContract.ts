import { useState, useEffect, useCallback } from 'react';
import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { toast } from 'sonner';
import { GAME_ABI } from '@/abi/gameABI';
import { monadTestnet } from '@/types/monadTestnet';

// Contract address - Replace with your actual contract address
// const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || '0x9d5c35e1a0db4db616211982a0e7b889e3df3b95';
const CONTRACT_ADDRESS = '0x57faf03d28c5e2da337386b467123e0a9347fa61';

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
  const { writeContract: writeStartGame, data: startGameHash, isPending: isStartGamePending, error: startGameError } = useWriteContract();
  const { writeContract: writeRollDice, data: rollDiceHash, isPending: isRollDicePending, error: rollDiceError } = useWriteContract();

  const { isLoading: isStartGameConfirming, isSuccess: isStartGameConfirmed, error: startGameReceiptError } = useWaitForTransactionReceipt({
    hash: startGameHash,
  });

  const { isLoading: isRollDiceConfirming, isSuccess: isRollDiceConfirmed, error: rollDiceReceiptError } = useWaitForTransactionReceipt({
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

  // Read contract data using useReadContract hooks
  const { data: playerStatusData, refetch: refetchPlayerStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getPlayerStatus',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: boardDataData, refetch: refetchBoardData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getBoard',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: gameStatsData, refetch: refetchGameStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getGameStats',
    query: {
      enabled: true,
    },
  });

  const { data: playerRankData, refetch: refetchPlayerRank } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getPlayerRank',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: leaderboardData, refetch: refetchLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getLeaderboard',
    query: {
      enabled: true,
    },
  });

  // Contract interactions
  const startGame = useCallback(async () => {
    if (!address || isStartGamePending || isStartGameConfirming) return;

    setIsLoadingStartGame(true);
    try {
      writeStartGame({
        address: CONTRACT_ADDRESS,
        abi: GAME_ABI,
        functionName: 'startGame',
        chain: monadTestnet,
        account: address,
        gas: 700000
      });
    } catch (error: any) {
      console.error('❌ [CONTRACT] Failed to start game:', error);
      toast.error(`Failed to start game: ${error?.message || 'Unknown error'}`, {
        position: 'top-right'
      });
    } finally {
      setIsLoadingStartGame(false);
    }
  }, [address, writeStartGame, isStartGamePending, isStartGameConfirming]);

  const rollDice = useCallback(async (currentPosition: number) => {
    if (!address || isRollDicePending || isRollDiceConfirming) return;

    setIsWaitingForVRF(true);
    try {
      writeRollDice({
        address: CONTRACT_ADDRESS,
        abi: GAME_ABI,
        functionName: 'rollDice',
        args: [currentPosition],
        value: BigInt('1000000000000000'), // 0.001 ETH in wei
        chain: monadTestnet,
        account: address,
        gas: 200000
      });
    } catch (error: any) {
      console.error('❌ [CONTRACT] Failed to roll dice:', error);
      toast.error(`Failed to roll dice: ${error?.message || 'Unknown error'}`, {
        position: 'top-right'
      });
    } finally {
      setIsWaitingForVRF(false);
    }
  }, [address, writeRollDice, isRollDicePending, isRollDiceConfirming]);

  // Auto claim rewards when game finishes
  const claimRewards = useCallback(async () => {
    if (!address || !gameState?.hasFinished) return;

    try {
      setClaimRewardsError(null);
      writeClaimRewards({
        address: CONTRACT_ADDRESS,
        abi: GAME_ABI,
        functionName: 'claimRewards',
        chain: monadTestnet,
        account: address,
        gas: 500000
      });
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
  }, [address, gameState?.hasFinished, writeClaimRewards]);

  // Handle claim rewards success
  useEffect(() => {
    if (isClaimRewardsConfirmed) {
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
      setGameStats({
        gamesCompleted: Number(gameStats[0]),
        totalNunuEarned: Number(gameStats[1]),
      });
    }
  }, [gameStatsData]);

  useEffect(() => {
    if (playerRankData) {
      setPlayerRank(Number(playerRankData));
    }
  }, [playerRankData]);

  useEffect(() => {
    if (leaderboardData) {
      const formattedLeaderboard = (leaderboardData as any[]).map((entry: any) => ({
        player: entry.player,
        score: Number(entry.score),
      }));
      setLeaderboard(formattedLeaderboard);
    }
  }, [leaderboardData]);

  // Fetch all game data function
  const fetchAllGameData = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      let result = await Promise.all([
        refetchPlayerStatus(),
        refetchBoardData(),
        refetchGameStats(),
        refetchPlayerRank(),
      ]);
      console.log('result', result);
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
    try {
      await refetchLeaderboard();
    } catch (error) {
      console.error('❌ [CONTRACT] Failed to fetch leaderboard:', error);
    }
  }, [refetchLeaderboard]);

  // Fetch initial data and set up polling
  useEffect(() => {
    if (address) {
      fetchAllGameData();
    }
  }, [address, fetchAllGameData]);

  // Update local state on contract events
  useEffect(() => {
    if (isStartGameConfirmed) {
      setIsLoading(true);
      toast.success('Game started successfully!', {
        position: 'top-right'
      });
      fetchAllGameData();
    }
  }, [isStartGameConfirmed, fetchAllGameData]);

  useEffect(() => {
    if (isRollDiceConfirmed) {
      setIsWaitingForVRF(false);
      setIsLoading(true);
      fetchAllGameData();
    }
  }, [isRollDiceConfirmed, fetchAllGameData]);

  // Auto-trigger claim rewards when player finishes game
  useEffect(() => {
    if (gameState?.hasFinished && gameState.nunuEarned > 0 && !claimRewardsError) {
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
    isLoadingStartGame,
    isWaitingForVRF,
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
