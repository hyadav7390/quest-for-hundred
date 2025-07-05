import { useState, useEffect, useCallback } from 'react';
import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { toast } from 'sonner';
import { GAME_ABI } from '@/abi/gameABI';
import { usePublicClient } from 'wagmi';
import { getAddress } from 'viem';

// Contract address - Replace with your actual contract address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

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

export const useContract = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [playerRank, setPlayerRank] = useState<number>(0);

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

  // Read contracts
  const { data: fetchedGameState, refetch: refetchGameState } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getGameState',
    args: [address],
    enabled: !!address,
  });

  const { data: fetchedBoardData, refetch: refetchBoardData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getBoardData',
    args: [address],
    enabled: !!address,
  });

  const { data: fetchedGameStats, refetch: refetchGameStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getGameStats',
    enabled: true,
  });

  const { data: fetchedPlayerRank, refetch: refetchPlayerRank } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GAME_ABI,
    functionName: 'getPlayerRank',
    args: [address],
    enabled: !!address,
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

  // Contract interactions
  const startGame = useCallback(async () => {
    if (!address || isStartGamePending || isStartGameConfirming) return;

    setIsLoadingStartGame(true);
    try {
      await writeStartGame({
        address: CONTRACT_ADDRESS,
        abi: GAME_ABI,
        functionName: 'startGame',
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
      await writeRollDice({
        address: CONTRACT_ADDRESS,
        abi: GAME_ABI,
        functionName: 'rollDice',
        args: [currentPosition]
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
      await writeClaimRewards({
        address: CONTRACT_ADDRESS,
        abi: GAME_ABI,
        functionName: 'claimRewards',
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
      refetchGameState();
      refetchGameStats();
    }
  }, [isClaimRewardsConfirmed, refetchGameState, refetchGameStats]);

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

  // Fetch data from contract
  const fetchAllGameData = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const [gameStateData, boardDataData, gameStatsData, playerRankData] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: GAME_ABI,
          functionName: 'getGameState',
          args: [address],
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: GAME_ABI,
          functionName: 'getBoardData',
          args: [address],
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: GAME_ABI,
          functionName: 'getGameStats',
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: GAME_ABI,
          functionName: 'getPlayerRank',
          args: [address],
        })
      ]);

      // Ensure the data structure matches the types
      const gameState = gameStateData as any;
      const boardData = boardDataData as any;
      const gameStats = gameStatsData as any;
      const playerRank = playerRankData as any;

      setGameState({
        position: Number(gameState[0]),
        gameScore: Number(gameState[1]),
        nunuEarned: Number(gameState[2]),
        hasFinished: gameState[3],
        boardGenerated: gameState[4],
        diceValue: Number(gameState[5]),
        diceRolls: Number(gameState[6]),
        giftsCollected: Number(gameState[7]),
        shortcuts: Number(gameState[8]),
        detours: Number(gameState[9]),
      });

      setBoardData({
        giftTiles: (boardData[0] as any[]).map((tile: any) => ({ index: Number(tile[0]), points: Number(tile[1]) })),
        detourTrapTiles: (boardData[1] as any[]).map((tile: any) => ({ index: Number(tile[0]), moveBack: Number(tile[1]) })),
        shortcutGateTiles: (boardData[2] as any[]).map((tile: any) => ({ index: Number(tile[0]), moveForward: Number(tile[1]) })),
      });

      setGameStats({
        gamesCompleted: Number(gameStats[0]),
        totalNunuEarned: Number(gameStats[1]),
      });

      setPlayerRank(Number(playerRank));

    } catch (error) {
      console.error('❌ [CONTRACT] Failed to fetch game data:', error);
      toast.error(`Failed to fetch game data: ${error}`, {
        position: 'top-right'
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  const fetchPlayerRank = useCallback(async () => {
    if (!address) return;

    try {
      const playerRankData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: GAME_ABI,
        functionName: 'getPlayerRank',
        args: [address],
      });

      setPlayerRank(Number(playerRankData));
    } catch (error) {
      console.error('❌ [CONTRACT] Failed to fetch player rank:', error);
    }
  }, [address, publicClient]);

  // Fetch initial data and set up polling
  useEffect(() => {
    if (address) {
      fetchAllGameData();
      fetchPlayerRank();
    }
  }, [address, fetchAllGameData, fetchPlayerRank]);

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
    isLoading,
    isLoadingStartGame,
    isWaitingForVRF,
    startGame,
    rollDice,
    fetchAllGameData,
    fetchPlayerRank,
    isConnected: !!address,
    claimRewards,
    claimRewardsError,
    isClaimRewardsPending: isClaimRewardsPending || isClaimRewardsConfirming,
  };
};
