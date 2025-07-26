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
    data: joinGameHash,
    isPending: isJoinGamePending,
    error: joinGameError
  } = useWriteContract();

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

  // --- Single Player ---
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

  const { isSuccess: isJoinGameConfirmed } = useWaitForTransactionReceipt({ hash: joinGameHash });

  // --- Multiplayer: Auto-join and start game flow ---
  useEffect(() => {
    console.log('[useGame] Multiplayer effect triggered.', {
      mode,
      address,
      isPlayerStatusFetched,
      isPlayerStatusError,
      playerStatusData,
    });

    if (mode === 'multi' && address && isPlayerStatusFetched) {
      const isNotInGame = isPlayerStatusError && playerStatusError?.message.includes("Player not in a game");

      // Case 1: Player is not in a game yet.
      if (isNotInGame) {
        console.log('[useGame] Player not in game. Attempting to join...');
        writeJoinGame({
          address: MULTI_PLAYER_CONTRACT_ADDRESS as `0x${string}`,
          abi: MULTI_PLAYER_GAME_ABI,
          functionName: 'joinGame',
          args: [1],
          value: BigInt('100000000000000000'), // 0.1 ETH
          chain: monadTestnet,
          account: address,
        });
      }
      // Case 2: Player is in a game, but the board hasn't been generated.
      else if (playerStatusData && !playerStatusData[6]) { // CORRECTED INDEX: boardGenerated is at index 6 for multi-player
        console.log('[useGame] Player in game, but board not generated. Attempting to start game...');
        writeStartGame({
          address: MULTI_PLAYER_CONTRACT_ADDRESS as `0x${string}`,
          abi: MULTI_PLAYER_GAME_ABI,
          functionName: 'startGame',
          args: [1],
          chain: monadTestnet,
          account: address,
        });
      } else if (playerStatusData && playerStatusData[6]) { // CORRECTED INDEX
        console.log('[useGame] Player in game and board is generated. Ready to play.');
      } else if (isPlayerStatusError) {
        console.error('[useGame] getPlayerStatus failed with an unexpected error:', playerStatusError);
        toast({ title: 'Network Error', description: 'Could not check game status. Please try again later.', variant: 'destructive' });
      }
    }
  }, [mode, address, isPlayerStatusFetched, playerStatusData, isPlayerStatusError, playerStatusError, writeJoinGame, writeStartGame]);
  
  // After a successful join, refetch status to trigger board generation.
  useEffect(() => {
    if (isJoinGameConfirmed) {
      toast({ title: "Joined Multiplayer Game!", description: "The game board is now being set up." });
      console.log('[useGame] Join game confirmed. Refetching player status...');
      refetchPlayerStatus();
    }
  }, [isJoinGameConfirmed, refetchPlayerStatus]);


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
    try {
      setClaimRewardsError(null);
      const txConfig = mode === 'multi'
        ? {
            address: MULTI_PLAYER_CONTRACT_ADDRESS as `0x${string}`,
            abi: MULTI_PLAYER_GAME_ABI,
            functionName: 'claimRewards' as const,
            args: [1],
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
      writeClaimRewards(txConfig);
    } catch (error: any) {
      //
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
      console.log('[useGame] playerStatusData is null/undefined, clearing gameState.');
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
    if (gameState?.hasFinished && gameState.nunuEarned > 0 && !claimRewardsError) {
      const timer = setTimeout(() => {
        claimRewards();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.hasFinished, claimRewards]);

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
    isLoading: isLoading || isStartGameConfirming || isRollDiceConfirming || isClaimRewardsConfirming,
    isLoadingStartGame: isLoadingStartGame || isStartGamePending || isStartGameConfirming,
    isWaitingForVRF: isWaitingForVRF || isRollDicePending || isRollDiceConfirming,
    isClaimRewardsPending: isClaimRewardsPending || isClaimRewardsConfirming || isClaimRewardsPendingWagmi,
    claimRewardsError,
    fetchPlatformData,
    fetchPlayerData,
    fetchLeaderboard,
    startGame: mode === 'single' ? startGame : undefined,
    rollDice,
    claimRewards,
    refetchPlayerRank: () => {}, // Not implemented for multiplayer
    isPlayerStatusLoaded: isPlayerStatusFetched,
  }), [
    address, gameState, boardData, gameStats, playerRank, leaderboard, playerStats, totalSupply, maxSupply, rollFee,
    isLoading, isStartGameConfirming, isRollDiceConfirming, isClaimRewardsConfirming,
    isLoadingStartGame, isStartGamePending,
    isWaitingForVRF, isRollDicePending,
    isClaimRewardsPending, isClaimRewardsConfirming, isClaimRewardsPendingWagmi,
    claimRewardsError, fetchPlatformData, fetchPlayerData, fetchLeaderboard,
    startGame, rollDice, claimRewards, isPlayerStatusFetched, mode
  ]);
}; 