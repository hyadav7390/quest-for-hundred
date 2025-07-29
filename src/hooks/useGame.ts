import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { toast } from '@/hooks/use-toast';
import { SINGLE_PLAYER_GAME_ABI } from '@/abi/singlePlayerGameABI';
import { MULTI_PLAYER_GAME_ABI } from '@/abi/multiPlayerGameABI';
import { REWARDS_TOKEN_ABI } from '@/abi/rewardTokenABI';
import { SINGLE_PLAYER_CONTRACT_ADDRESS, MULTI_PLAYER_CONTRACT_ADDRESS, REWARD_TOKEN } from '@/configs';
import { monadTestnet } from '@/types/monadTestnet';
import { formatEther } from 'viem';

function handleContractError(error: any, fallbackMessage = 'Transaction failed') {
  console.error('[handleContractError]', { error, message: error?.message });
  const errorMsg = error?.message || '';
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

  // Fallback for other common errors.
  let description = fallbackMessage;
  if (errorMsg.includes('User rejected the request')) {
    description = 'You rejected the transaction in your wallet.';
  } else if (errorMsg.split('Details:').length > 1) {
    description = errorMsg.split('Details:')[1].split('Version:')[0].trim();
  }

  toast({
    title: 'Transaction Failed',
    description,
    variant: 'destructive'
  });
}

export const useGame = (mode: 'single' | 'multi' = 'single') => {
  const { address } = useAccount();
  console.log(`[useGame] Initializing for mode: ${mode}`);

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
  
  // Contract selection
  const { contractAddress, contractAbi } = useMemo(() => {
    if (mode === 'multi') {
      console.log('[useGame] Using MULTIPLAYER contracts');
      return { contractAddress: MULTI_PLAYER_CONTRACT_ADDRESS, contractAbi: MULTI_PLAYER_GAME_ABI };
    }
    console.log('[useGame] Using SINGLE_PLAYER contracts');
    return { contractAddress: SINGLE_PLAYER_CONTRACT_ADDRESS, contractAbi: SINGLE_PLAYER_GAME_ABI };
  }, [mode]);

  const rollFeeFunctionName = useMemo(() => (mode === 'multi' ? 'getRollFee' : 'ROLL_FEE'), [mode]);
  console.log(`[useGame] Roll fee function name: ${rollFeeFunctionName}`);

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
  // Multiplayer: join game
  const {
    writeContract: writeJoinGame,
    writeContractAsync: writeJoinGameAsync,
    data: joinGameHash,
    isPending: isJoinGamePending,
    error: joinGameError
  } = useWriteContract();

  const { isSuccess: isJoinGameConfirmed } = useWaitForTransactionReceipt({ hash: joinGameHash });

  // Reads with staleTime/refetchInterval
  const { data: gameStatsData, refetch: refetchGameStats } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractAbi,
    functionName: 'getGameStats',
    query: {
      enabled: true,
      refetchInterval: false,
      staleTime: 10000,
    },
  });
  const { data: totalSupplyData, refetch: refetchTotalSupply } = useReadContract({
    address: REWARD_TOKEN.address as `0x${string}`,
    abi: REWARDS_TOKEN_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: true,
      refetchInterval: false,
      staleTime: 10000,
    },
  });
  const { data: maxSupplyData, refetch: refetchMaxSupply } = useReadContract({
    address: REWARD_TOKEN.address as `0x${string}`,
    abi: REWARDS_TOKEN_ABI,
    functionName: 'getMaxSupply',
    query: {
      enabled: true,
      refetchInterval: false,
      staleTime: 10000,
    },
  });
  const { 
    data: playerStatusData, 
    refetch: refetchPlayerStatus,
    isFetched: isPlayerStatusFetched,
    isError: isPlayerStatusError,
    error: playerStatusError,
  } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractAbi,
    functionName: 'getPlayerStatus',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      retry: (failureCount, error) => {
        // Don't retry if the error is "Player not in a game", as it's an expected state
        if (error.message.includes('Player not in a game')) {
          return false;
        }
        return failureCount < 3;
      },
      refetchInterval: false,
      staleTime: 1000,
    },
  });
  const { data: boardDataData, refetch: refetchBoardData } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractAbi,
    functionName: 'getBoard',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: false,
      staleTime: 30000,
    },
  });
  const { data: playerStatsData, refetch: refetchPlayerStats } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractAbi,
    functionName: 'getPlayerStats',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: false,
      staleTime: 1000,
    },
  });
  const { data: rollFeeData, refetch: refetchRollFee } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractAbi,
    functionName: rollFeeFunctionName,
    query: {
      enabled: true,
      refetchInterval: false,
      staleTime: 10000,
    },
  });

  const rollFee = rollFeeData ? BigInt(rollFeeData as any).toString() : null;
  const totalSupply = totalSupplyData ? formatEther(BigInt(totalSupplyData as any)) : null;
  const maxSupply = maxSupplyData ? formatEther(BigInt(maxSupplyData as any)) : null;

  // --- Start Game (Single Player ONLY) ---
  const startGame = useCallback(async () => {
    if (mode !== 'single' || !address || isStartGamePending || isStartGameConfirming) {
      return;
    }
    console.log('[useGame] Attempting to start SINGLE player game...');
    setIsLoadingStartGame(true);
    try {
      writeStartGame({
        address: SINGLE_PLAYER_CONTRACT_ADDRESS as `0x${string}`,
        abi: SINGLE_PLAYER_GAME_ABI,
        functionName: 'startGame',
        args: [],
        chain: monadTestnet,
        account: address,
        gas: 1000000n
      });
    } catch (error: any) {
      console.error('[useGame] Failed to start SINGLE player game:', error);
      setIsLoadingStartGame(false);
    }
  }, [address, writeStartGame, isStartGamePending, isStartGameConfirming, mode]);

  // --- Join Game (Multiplayer) ---
  const joinGame = useCallback(async () => {
    if (mode !== 'multi' || !address) {
      return;
    }
    console.log('[useGame] Attempting to join MULTIPLAYER game...');
    try {
      // Use async version to allow awaiting in the UI
      await writeJoinGameAsync({
        address: MULTI_PLAYER_CONTRACT_ADDRESS as `0x${string}`,
        abi: MULTI_PLAYER_GAME_ABI,
        functionName: 'joinGame',
        args: [1], // Join gameId 1
        value: BigInt('100000000000000000'), // 0.1 ETH
        chain: monadTestnet,
        account: address,
      });
    } catch (error: any) {
      console.error('[useGame] Failed to join MULTIPLAYER game:', error);
      throw error; // Re-throw to be caught by the UI handler
    }
  }, [address, writeJoinGameAsync, mode]);

  // After a successful join, refetch status to load the board.
  useEffect(() => {
    if (isJoinGameConfirmed) {
      toast({ title: "Joined Multiplayer Game!", description: "Loading the game board..." });
      console.log('[useGame] Join game confirmed. Refetching player status and board data...');
      // Fetch both status and board data to ensure the UI is complete.
      Promise.all([
        refetchPlayerStatus(),
        refetchBoardData(),
      ]);
    }
  }, [isJoinGameConfirmed, refetchPlayerStatus, refetchBoardData]);


  // --- Roll Dice ---
  const rollDice = useCallback(async () => {
    if (!address || isRollDicePending || isRollDiceConfirming) {
      return;
    }
    if (!gameState || typeof gameState.position !== 'number') {
      toast({ title: 'Error', description: 'Game not ready or position unknown.', variant: 'destructive' });
      return;
    }
    console.log(`[useGame] Rolling dice for position ${gameState.position} with fee ${rollFee}`);
    setIsWaitingForVRF(true);
    try {
      writeRollDice({
        address: contractAddress as `0x${string}`,
        abi: contractAbi,
        functionName: 'rollDice',
        args: [gameState.position],
        value: BigInt(rollFee || 0),
        chain: monadTestnet,
        account: address,
        gas: 200000n,
      });
    } catch (error: any) {
      setIsWaitingForVRF(false);
    }
  }, [address, writeRollDice, isRollDicePending, isRollDiceConfirming, contractAddress, contractAbi, rollFee, gameState]);

  // --- Claim Rewards ---
  const claimRewards = useCallback(async () => {
    if (!address || !gameState?.hasFinished) {
      return;
    }
    console.log(`[useGame] Manually triggering claimRewards for ${mode} mode...`);
    try {
      const txConfig = mode === 'multi'
        ? {
            address: MULTI_PLAYER_CONTRACT_ADDRESS as `0x${string}`,
            abi: MULTI_PLAYER_GAME_ABI,
            functionName: 'claimRewardV1' as const,
            args: address ? [address] : undefined,
            chain: monadTestnet,
            account: address,
            gas: 500000n
          }
        : {
            address: SINGLE_PLAYER_CONTRACT_ADDRESS as `0x${string}`,
            abi: SINGLE_PLAYER_GAME_ABI,
            functionName: 'claimRewards' as const,
            args: [],
            chain: monadTestnet,
            account: address,
            gas: 500000n
          };
      // Use async version to allow awaiting in the UI
      await writeClaimRewards(txConfig);
    } catch (error: any) {
      console.error(`[useGame] Failed to claim rewards for ${mode} mode:`, error);
      throw error; // Re-throw to be caught by the UI handler
    }
  }, [address, gameState?.hasFinished, writeClaimRewards, mode]);

  // Process contract data
  useEffect(() => {
    if (playerStatusData) {
      console.log('[useGame] Received playerStatusData:', playerStatusData);
      const data = mode === 'multi' ? {
        position: Number(playerStatusData[1]),
        diceValue: Number(playerStatusData[2]),
        nunuEarned: Number(playerStatusData[3]),
        gameScore: Number(playerStatusData[4]),
        hasFinished: playerStatusData[5],
        boardGenerated: playerStatusData[6],
        diceRolls: Number(playerStatusData[7]),
        giftsCollected: Number(playerStatusData[8]),
        shortcuts: Number(playerStatusData[9]),
        detours: Number(playerStatusData[10]),
      } : {
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
      };
      setGameState(data);
    } else {
      setGameState(null);
    }
  }, [playerStatusData, mode]);

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
    if (playerStatsData) {
      setPlayerStats({
        totalNunuEarned: Number(playerStatsData[0]),
        highestScore: Number(playerStatsData[1]),
        gamesCompleted: Number(playerStatsData[2]),
      });
    }
  }, [playerStatsData]);

  // Fetch all game data function with logging
  const fetchAllGameData = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      await Promise.all([
        refetchPlayerStatus(),
        refetchBoardData(),
        refetchGameStats(),
        refetchPlayerStats(),
        refetchTotalSupply(),
        refetchMaxSupply(),
      ]);
    } catch (error) {
      toast({
        title: 'Failed to fetch game data',
        description: error as string,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, refetchPlayerStatus, refetchBoardData, refetchGameStats, refetchPlayerStats, refetchTotalSupply, refetchMaxSupply]);

  const fetchPlatformData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        refetchGameStats(),
        refetchTotalSupply(),
        refetchMaxSupply(),
      ]);
    } catch (error) {
      toast({
        title: 'Failed to fetch platform data',
        description: error as string,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [refetchGameStats, refetchTotalSupply, refetchMaxSupply]);

  const fetchPlayerData = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      await Promise.all([
        refetchPlayerStatus(),
        refetchBoardData(),
        refetchPlayerStats(),
      ]);
    } catch (error) {
      toast({
        title: 'Failed to fetch player data',
        description: error as string,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, refetchPlayerStatus, refetchBoardData, refetchPlayerStats]);

  const fetchLeaderboard = useCallback(async () => {
    // TODO: Implement leaderboard fetch for multiplayer if available
  }, []);

  useEffect(() => {
    fetchPlatformData();
  }, [fetchPlatformData]);

  useEffect(() => {
    if (address) {
      fetchPlayerData();
    }
  }, [address, fetchPlayerData]);

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

  const resetGame = useCallback(() => {
    console.log('[useGame] Resetting game state for multiplayer.');
    setGameState(null);
    // After resetting, we should refetch to get the 'not in game' status to show the join button.
    refetchPlayerStatus();
  }, [refetchPlayerStatus]);

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

  useEffect(() => {
    if (startGameError || startGameReceiptError) {
      setIsLoadingStartGame(false);
      handleContractError(startGameError || startGameReceiptError, 'Failed to start game');
    }
  }, [startGameError, startGameReceiptError]);

  useEffect(() => {
    if (rollDiceError || rollDiceReceiptError) {
      setIsWaitingForVRF(false);
      handleContractError(rollDiceError || rollDiceReceiptError, 'Failed to roll dice');
    }
  }, [rollDiceError, rollDiceReceiptError]);

  useEffect(() => {
    if (joinGameError) {
      console.log('[useGame] Join game error detected.');
      handleContractError(joinGameError, 'Failed to join the game. Please try again.');
    }
  }, [joinGameError]);

  useEffect(() => {
    if (claimRewardsWriteError || claimRewardsReceiptError) {
      const errorMsg = (claimRewardsWriteError || claimRewardsReceiptError)?.message || '';
      if (errorMsg.includes('insufficient balance') || errorMsg.includes('Signer had insufficient balance') || errorMsg.includes('insufficient funds')) {
        toast({
          title: 'Insufficient Funds',
          description: 'You do not have enough MON to perform this action. Please add funds to your wallet.',
          variant: 'destructive',
        });
      } else if (errorMsg.includes('User rejected the request')) {
        toast({
          title: 'Transaction Rejected',
          description: 'You rejected the transaction in your wallet.',
          variant: 'destructive',
        });
      } else if (errorMsg.split('Details:').length > 1) {
        toast({
          title: 'Transaction Failed',
          description: errorMsg.split('Details:')[1].split('Version:')[0].trim(),
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Transaction Failed',
          description: 'Failed to claim rewards. Please try again.',
          variant: 'destructive',
        });
      }
    }
  }, [claimRewardsWriteError, claimRewardsReceiptError]);
  
  return useMemo(() => ({
    address,
    isConnected: !!address,
    CONTRACT_ADDRESS: contractAddress,
    gameState,
    boardData,
    gameStats,
    playerRank,
    leaderboard,
    playerStats,
    totalSupply,
    maxSupply,
    rollFee,
    isLoading: isLoading || isStartGameConfirming || isRollDiceConfirming || isClaimRewardsConfirming || isJoinGamePending,
    isLoadingStartGame: isLoadingStartGame || isStartGamePending || isStartGameConfirming,
    isWaitingForVRF: isWaitingForVRF || isRollDicePending || isRollDiceConfirming,
    isClaimRewardsPending: isClaimRewardsConfirming || isClaimRewardsPendingWagmi,
    claimRewardsError,
    fetchPlatformData,
    fetchPlayerData,
    fetchLeaderboard,
    startGame: mode === 'single' ? startGame : undefined,
    joinGame: mode === 'multi' ? joinGame : undefined,
    rollDice,
    claimRewards,
    resetGame,
    refetchPlayerRank: () => {}, // Not implemented for multiplayer
    isPlayerStatusLoaded: isPlayerStatusFetched,
    isPlayerStatusError,
    playerStatusError,
  }), [
    address, gameState, boardData, gameStats, playerRank, leaderboard, playerStats, totalSupply, maxSupply, rollFee,
    isLoading, isStartGameConfirming, isRollDiceConfirming, isClaimRewardsConfirming, isJoinGamePending,
    isLoadingStartGame, isStartGamePending,
    isWaitingForVRF, isRollDicePending,
    isClaimRewardsConfirming, isClaimRewardsPendingWagmi,
    claimRewardsError, fetchPlatformData, fetchPlayerData, fetchLeaderboard,
    startGame, joinGame, rollDice, claimRewards, isPlayerStatusFetched, mode, isPlayerStatusError, playerStatusError
  ]);
}; 