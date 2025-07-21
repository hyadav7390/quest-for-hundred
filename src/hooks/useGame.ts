import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { toast } from '@/hooks/use-toast';
import {
  SINGLE_PLAYER_GAME_ABI,
  REWARD_TOKEN_ABI,
  REWARD_TOKEN,
  SINGLE_PLAYER_CONTRACT_ADDRESS,
} from '@/configs';
import { monadTestnet } from '@/types/monadTestnet';
import { formatEther } from 'viem';

// Helper to handle contract errors and show user-friendly toast
function handleContractError(error: any, fallbackMessage = 'Transaction failed') {
  const errorMsg = error?.message || '';
  console.log('error', error.message);
  if (
    errorMsg.includes('insufficient balance') ||
    errorMsg.includes('Signer had insufficient balance') ||
    errorMsg.includes('insufficient funds')
  ) {
    toast({
      title: 'Insufficient Funds',
      description: 'You do not have enough MON to perform this action. Please add funds to your wallet.',
      variant: 'destructive',
    });
    return;
  }
}

export const useGame = () => {
  const { address } = useAccount();

  // Game state
  const [gameState, setGameState] = useState<any>(null);
  const [boardData, setBoardData] = useState<any>(null);
  const [gameStats, setGameStats] = useState<any>(null);
  const [playerRank, setPlayerRank] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStartGame, setIsLoadingStartGame] = useState(false);
  const [isWaitingForVRF, setIsWaitingForVRF] = useState(false);
  const [isClaimRewardsPending, setIsClaimRewardsPending] = useState(false);
  const [claimRewardsError, setClaimRewardsError] = useState<string | null>(null);
  const [isPlayerStatusLoaded, setIsPlayerStatusLoaded] = useState(false);

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
  } = useWaitForTransactionReceipt({ hash: startGameHash });
  const {
    isLoading: isRollDiceConfirming,
    isSuccess: isRollDiceConfirmed,
    error: rollDiceReceiptError
  } = useWaitForTransactionReceipt({ hash: rollDiceHash });
  const {
    writeContract: writeClaimRewards,
    data: claimRewardsHash,
    isPending: isClaimRewardsPendingWagmi,
    error: claimRewardsWriteError
  } = useWriteContract();
  const {
    isLoading: isClaimRewardsConfirming,
    isSuccess: isClaimRewardsConfirmed,
    error: claimRewardsReceiptError
  } = useWaitForTransactionReceipt({ hash: claimRewardsHash });

  // Reads with staleTime/refetchInterval
  // --- PLATFORM DATA ---
  const { data: gameStatsData, refetch: refetchGameStats } = useReadContract({
    address: SINGLE_PLAYER_CONTRACT_ADDRESS,
    abi: SINGLE_PLAYER_GAME_ABI,
    functionName: 'getGameStats',
    query: {
      enabled: true,
      refetchInterval: false,
      staleTime: 10000,
    },
  });
  const { data: totalSupplyData, refetch: refetchTotalSupply } = useReadContract({
    address: REWARD_TOKEN.address as `0x${string}`,
    abi: REWARD_TOKEN_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: true,
      refetchInterval: false,
      staleTime: 10000,
    },
  });
  const { data: maxSupplyData, refetch: refetchMaxSupply } = useReadContract({
    address: REWARD_TOKEN.address as `0x${string}`,
    abi: REWARD_TOKEN_ABI,
    functionName: 'getMaxSupply',
    query: {
      enabled: true,
      refetchInterval: false,
      staleTime: 10000,
    },
  });
  // --- PLAYER DATA ---
  const { data: playerStatusData, refetch: refetchPlayerStatus } = useReadContract({
    address: SINGLE_PLAYER_CONTRACT_ADDRESS,
    abi: SINGLE_PLAYER_GAME_ABI,
    functionName: 'getPlayerStatus',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: false,
      staleTime: 1000,
    },
  });
  const { data: boardDataData, refetch: refetchBoardData } = useReadContract({
    address: SINGLE_PLAYER_CONTRACT_ADDRESS,
    abi: SINGLE_PLAYER_GAME_ABI,
    functionName: 'getBoard',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: false,
      staleTime: 30000,
    },
  });
  const { data: playerRankData, refetch: refetchPlayerRank } = useReadContract({
    address: SINGLE_PLAYER_CONTRACT_ADDRESS,
    abi: SINGLE_PLAYER_GAME_ABI,
    functionName: 'getPlayerRank',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: false,
      staleTime: 5000,
    },
  });
  const { data: leaderboardData, refetch: refetchLeaderboard } = useReadContract({
    address: SINGLE_PLAYER_CONTRACT_ADDRESS,
    abi: SINGLE_PLAYER_GAME_ABI,
    functionName: 'getLeaderboard',
    query: {
      enabled: true,
      refetchInterval: false,
      staleTime: 15000,
    },
  });
  const { data: playerStatsData, refetch: refetchPlayerStats } = useReadContract({
    address: SINGLE_PLAYER_CONTRACT_ADDRESS,
    abi: SINGLE_PLAYER_GAME_ABI,
    functionName: 'getPlayerStats',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: false,
      staleTime: 1000,
    },
  });
  const { data: rollFeeData, refetch: refetchRollFee } = useReadContract({
    address: SINGLE_PLAYER_CONTRACT_ADDRESS,
    abi: SINGLE_PLAYER_GAME_ABI,
    functionName: 'ROLL_FEE',
    query: {
      enabled: true,
      refetchInterval: false,
      staleTime: 10000,
    },
  });

  // Contract interactions
  const startGame = useCallback(async () => {
    if (!address || isStartGamePending || isStartGameConfirming) {
      console.log('🚫 [CONTRACT] Start game blocked:', {
        address: !!address,
        isStartGamePending,
        isStartGameConfirming
      });
      return;
    }
    console.log('🎮 [CONTRACT] Starting new game...', { address, contractAddress: SINGLE_PLAYER_GAME_ABI });
    setIsLoadingStartGame(true);
    try {
      const txConfig = {
        address: SINGLE_PLAYER_CONTRACT_ADDRESS as `0x${string}`,
        abi: SINGLE_PLAYER_GAME_ABI,
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
    console.log('🎲 [CONTRACT] Rolling dice...', { address, currentPosition, contractAddress: SINGLE_PLAYER_CONTRACT_ADDRESS });
    setIsWaitingForVRF(true);
    try {
      const txConfig = {
        address: SINGLE_PLAYER_CONTRACT_ADDRESS as `0x${string}`,
        abi: SINGLE_PLAYER_GAME_ABI,
        functionName: 'rollDice' as const,
        args: [currentPosition] as const,
        value: BigInt(rollFee || 0),
        chain: monadTestnet,
        account: address,
        gas: 200000n,
      };
      console.log('📋 [CONTRACT] Roll dice transaction config:', txConfig);
      writeRollDice(txConfig);
    } catch (error: any) {
      console.error('❌ [CONTRACT] Failed to roll dice:', error);
      setIsWaitingForVRF(false);
    }
  }, [address, writeRollDice, isRollDicePending, isRollDiceConfirming]);

  const claimRewards = useCallback(async () => {
    if (!address || !gameState?.hasFinished) {
      console.log('🚫 [CONTRACT] Claim rewards blocked:', {
        address: !!address,
        hasFinished: gameState?.hasFinished
      });
      return;
    }
    console.log('💰 [CONTRACT] Claiming rewards...', { address, nunuEarned: gameState.nunuEarned });
    try {
      setClaimRewardsError(null);
      const txConfig = {
        address: SINGLE_PLAYER_CONTRACT_ADDRESS as `0x${string}`,
        abi: SINGLE_PLAYER_GAME_ABI,
        functionName: 'claimRewards' as const,
        chain: monadTestnet,
        account: address,
        gas: 500000n
      };
      console.log('📋 [CONTRACT] Claim rewards transaction config:', txConfig);
      writeClaimRewards(txConfig);
    } catch (error: any) {
      console.error('❌ [CONTRACT] Error claiming rewards:', error);
    }
  }, [address, gameState?.hasFinished, gameState?.nunuEarned, writeClaimRewards]);

  // Handle claim rewards success
  useEffect(() => {
    if (isClaimRewardsConfirmed) {
      console.log('✅ [CONTRACT] Rewards claimed successfully');
      toast({
        title: 'Success',
        description: 'Rewards claimed successfully!',
      });
      setClaimRewardsError(null);
      fetchAllGameData();
    }
  }, [isClaimRewardsConfirmed]);

  // Handle claim rewards errors
  useEffect(() => {
    if (claimRewardsReceiptError) {
      console.error('❌ [CONTRACT] Claim rewards error:', claimRewardsWriteError, claimRewardsReceiptError);
      const errorMessage = claimRewardsReceiptError?.message?.includes('finish first')
        ? 'Game not finished yet'
        : claimRewardsReceiptError?.message?.includes('no reward')
        ? 'No rewards to claim'
        : 'Transaction failed';
      setClaimRewardsError(errorMessage);
    }
  }, [claimRewardsReceiptError]);

  // Process contract data
  useEffect(() => {
    if (playerStatusData) {
      setGameState({
        position: Number(playerStatusData[0]),
        diceValue: Number(playerStatusData[1]),
        nunuEarned: Number(playerStatusData[2]),
        gameScore: Number(playerStatusData[3]),
        hasFinished: playerStatusData[4],
        boardGenerated: playerStatusData[5],
        diceRolls: Number(playerStatusData[6]),
        giftsCollected: Number(playerStatusData[7]),
        shortcuts: Number(playerStatusData[8]),
        detours: Number(playerStatusData[9]),
      });
      setIsPlayerStatusLoaded(true);
    }
  }, [playerStatusData]);

  useEffect(() => {
    if (boardDataData) {
      const board = boardDataData as any[];
      const giftTiles: { index: number; points: number }[] = [];
      const detourTrapTiles: { index: number; moveBack: number }[] = [];
      const shortcutGateTiles: { index: number; moveForward: number }[] = [];
      for (let i = 1; i <= 100; i++) {
        const tile = board[i];
        if (tile) {
          const giftValue = Number(tile.giftValue || 0);
          const doorOffset = Number(tile.doorOffset || 0);
          if (giftValue > 0) {
            giftTiles.push({ index: i, points: giftValue });
          } else if (doorOffset !== 0) {
            if (doorOffset > 0) {
              shortcutGateTiles.push({ index: i, moveForward: doorOffset });
            } else {
              detourTrapTiles.push({ index: i, moveBack: Math.abs(doorOffset) });
            }
          }
        }
      }
      setBoardData({ giftTiles, detourTrapTiles, shortcutGateTiles });
    }
  }, [boardDataData]);

  useEffect(() => {
    if (gameStatsData) {
      setGameStats({
        gamesCompleted: Number(gameStatsData[0]),
        totalNunuEarned: Number(gameStatsData[1]),
        totalPlayers: Number(gameStatsData[2]),
      });
    }
  }, [gameStatsData]);

  useEffect(() => {
    if (playerRankData) setPlayerRank(Number(playerRankData));
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

  useEffect(() => {
    if (playerStatsData) {
      setPlayerStats({
        totalNunuEarned: Number(playerStatsData[0]),
        highestScore: Number(playerStatsData[1]),
        gamesCompleted: Number(playerStatsData[2]),
      });
    }
  }, [playerStatsData]);

  // useEffect(() => {
  //   console.log('totalSupplyData', totalSupplyData);
  //   if (totalSupplyData) setTotalSupply(formatEther(BigInt(totalSupplyData as any)));
  // }, [totalSupplyData]);

  // useEffect(() => {
  //   console.log('maxSupplyData', maxSupplyData);
  //   if (maxSupplyData) setMaxSupply(formatEther(BigInt(maxSupplyData as any)));
  // }, [maxSupplyData]);

  // useEffect(() => {
  //   if (rollFeeData) setRollFee(BigInt(rollFeeData).toString());
  // }, [rollFeeData]);

  const rollFee = rollFeeData ? BigInt(rollFeeData).toString() : null;

  const totalSupply = totalSupplyData ? formatEther(BigInt(totalSupplyData as any)) : null;
  const maxSupply = maxSupplyData ? formatEther(BigInt(maxSupplyData as any)) : null;

  

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
        refetchPlayerStats(),
        refetchTotalSupply(),
        refetchMaxSupply(),
      ]);
      console.log('✅ [CONTRACT] All game data fetched successfully', result);
    } catch (error) {
      console.error('❌ [CONTRACT] Failed to fetch game data:', error);
      toast({
        title: 'Failed to fetch game data',
        description: error as string,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, refetchPlayerStatus, refetchBoardData, refetchGameStats, refetchPlayerRank, refetchPlayerStats, refetchTotalSupply, refetchMaxSupply]);

  // --- PLATFORM DATA FETCH ---
  const fetchPlatformData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        refetchGameStats(),
        refetchTotalSupply(),
        refetchMaxSupply(),
      ]);
    } catch (error) {
      console.error('❌ [CONTRACT] Failed to fetch platform data:', error);
      toast({
        title: 'Failed to fetch platform data',
        description: error as string,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [refetchGameStats, refetchTotalSupply, refetchMaxSupply]);

  // --- PLAYER DATA FETCH ---
  const fetchPlayerData = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      await Promise.all([
        refetchPlayerStatus(),
        refetchPlayerStats()
      ]);
    } catch (error) {
      console.error('❌ [CONTRACT] Failed to fetch player data:', error);
      toast({
        title: 'Failed to fetch player data',
        description: error as string,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, refetchPlayerStatus, refetchBoardData, refetchPlayerStats, refetchPlayerRank, refetchLeaderboard]);

  // --- Manual leaderboard fetch ---
  const fetchLeaderboard = useCallback(async () => {
    try {
      await refetchLeaderboard();
    } catch (error) {
      console.error('❌ [CONTRACT] Failed to fetch leaderboard:', error);
    }
  }, [refetchLeaderboard]);

  // --- ON MOUNT: Fetch platform data always ---
  useEffect(() => {
    fetchPlatformData();
    // Optionally, set up polling for platform data here if needed
  }, [fetchPlatformData]);

  // --- ON WALLET CONNECT: Fetch player data ---
  useEffect(() => {
    if (address) {
      fetchPlayerData();
    }
  }, [address, fetchPlayerData]);

  // --- ON DICE ROLL CONFIRM: Only refetch playerStatus and playerStats ---
  useEffect(() => {
    if (isRollDiceConfirmed) {
      setIsWaitingForVRF(false);
      setIsLoading(true);
      Promise.all([
        refetchPlayerStatus(),
        refetchPlayerStats(),
      ]).finally(() => setIsLoading(false));
    }
  }, [isRollDiceConfirmed, refetchPlayerStatus, refetchPlayerStats]);

  // --- ON START GAME CONFIRM: Fetch all player data ---
  useEffect(() => {
    if (isStartGameConfirmed) {
      setIsLoadingStartGame(false);
      setIsLoading(true);
      toast({
        title: 'Success',
        description: 'Game started successfully!',
      });
      fetchPlayerData();
    }
  }, [isStartGameConfirmed, fetchPlayerData]);

  // Handle transaction errors with proper loading state cleanup
  useEffect(() => {
    if (startGameError || startGameReceiptError) {
      console.error('❌ [CONTRACT] Start game error:', startGameError || startGameReceiptError);
      setIsLoadingStartGame(false);
      handleContractError(startGameError || startGameReceiptError, 'Failed to start game');
    }
  }, [startGameError, startGameReceiptError]);

  useEffect(() => {
    if (rollDiceError || rollDiceReceiptError) {
      console.error('❌ [CONTRACT] Roll dice error:', rollDiceError || rollDiceReceiptError);
      setIsWaitingForVRF(false);
      handleContractError(rollDiceError || rollDiceReceiptError, 'Failed to roll dice');
    }
  }, [rollDiceError, rollDiceReceiptError]);

  // Auto-trigger claim rewards when player finishes game
  useEffect(() => {
    if (gameState?.hasFinished && gameState.nunuEarned > 0 && !claimRewardsError) {
      console.log('🎉 [CONTRACT] Game finished, auto-claiming rewards...');
      const timer = setTimeout(() => {
        claimRewards();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.hasFinished, claimRewards]);

  return useMemo(() => ({
    address,
    isConnected: !!address,
    CONTRACT_ADDRESS: SINGLE_PLAYER_CONTRACT_ADDRESS,
    gameState,
    boardData,
    gameStats,
    playerRank,
    leaderboard,
    playerStats,
    totalSupply,
    maxSupply,
    rollFee,
    isLoading: isLoading || isStartGameConfirming || isRollDiceConfirming || isClaimRewardsConfirming,
    isLoadingStartGame: isLoadingStartGame || isStartGamePending || isStartGameConfirming,
    isWaitingForVRF: isWaitingForVRF || isRollDicePending || isRollDiceConfirming,
    isClaimRewardsPending: isClaimRewardsPending || isClaimRewardsConfirming || isClaimRewardsPendingWagmi,
    claimRewardsError,
    fetchPlatformData,
    fetchPlayerData,
    fetchLeaderboard,
    startGame,
    rollDice,
    claimRewards,
    refetchPlayerRank,
    isPlayerStatusLoaded,
  }), [
    address, gameState, boardData, gameStats, playerRank, leaderboard, playerStats, totalSupply, maxSupply, rollFee,
    isLoading, isStartGameConfirming, isRollDiceConfirming, isClaimRewardsConfirming,
    isLoadingStartGame, isStartGamePending,
    isWaitingForVRF, isRollDicePending,
    isClaimRewardsPending, isClaimRewardsPendingWagmi,
    claimRewardsError, fetchPlatformData, fetchPlayerData, fetchLeaderboard, startGame, rollDice, claimRewards, refetchPlayerRank, isPlayerStatusLoaded
  ]);
}; 