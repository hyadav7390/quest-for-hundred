import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  
  // Use ref to track if this instance has been initialized to prevent infinite re-initialization
  const initializedRef = useRef(false);
  
  // Memoize the mode to prevent unnecessary re-initialization
  const memoizedMode = useMemo(() => mode, [mode]);
  
  // Only log initialization once per instance
  if (!initializedRef.current) {
    console.log(`[useGame] Initializing for mode: ${memoizedMode}`);
    initializedRef.current = true;
  }

  // Game state
  const [gameState, setGameState] = useState<any>(null);
  const [boardData, setBoardData] = useState<any>(null);
  const [gameStats, setGameStats] = useState<any>(null);
  const [playerRank, setPlayerRank] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [peerPositions, setPeerPositions] = useState<{ positions: number[]; counts: number[]; ruggmates: number[] }>({ positions: [], counts: [], ruggmates: [] });
  const [gameActivities, setGameActivities] = useState<any[]>([]);
  const [gameFinishBonus, setGameFinishBonus] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStartGame, setIsLoadingStartGame] = useState(false);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);
  const [isJoinGameInProgress, setIsJoinGameInProgress] = useState(false);
  const [isWaitingForVRF, setIsWaitingForVRF] = useState(false);
  const [isClaimRewardsPending, setIsClaimRewardsPending] = useState(false);
  const [claimRewardsError, setClaimRewardsError] = useState<string | null>(null);
  const [claimRewardsSuccess, setClaimRewardsSuccess] = useState(false);
  
  // Single ref to track claim state to prevent race conditions
  const claimStateRef = useRef<'idle' | 'checking' | 'claiming' | 'claimed' | 'error'>('idle');
  
  // Add a ref to track the latest game state for claim operations
  const gameStateRef = useRef(gameState);
  
  // Add a ref to track the auto-claim timeout
  const autoClaimTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update the ref whenever gameState changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Contract selection - memoized to prevent recreation
  const { contractAddress, contractAbi } = useMemo(() => {
    if (memoizedMode === 'multi') {
      return { contractAddress: MULTI_PLAYER_CONTRACT_ADDRESS, contractAbi: MULTI_PLAYER_GAME_ABI };
    }
    return { contractAddress: SINGLE_PLAYER_CONTRACT_ADDRESS, contractAbi: SINGLE_PLAYER_GAME_ABI };
  }, [memoizedMode]);

  const rollFeeFunctionName = useMemo(() => (memoizedMode === 'multi' ? 'getRollFee' : 'ROLL_FEE'), [memoizedMode]);

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

  // Reads with staleTime/refetchInterval - optimized for performance
  const { data: gameStatsData, refetch: refetchGameStats } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractAbi,
    functionName: 'getGameStats',
    args: memoizedMode === 'multi' ? [1] : undefined, // gameId 1 for multiplayer
    query: {
      enabled: true,
      refetchInterval: false,
      staleTime: 60000, // 1 minute - game stats don't change frequently
    },
  });
  const { data: joinGameFeeData, refetch: refetchJoinGameFee } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractAbi,
    functionName: 'getJoinGameFee',
    query: {
      enabled: memoizedMode === 'multi',
      refetchInterval: false,
      staleTime: 300000, // 5 minutes - join fee rarely changes
    },
  });
  const { data: totalSupplyData, refetch: refetchTotalSupply } = useReadContract({
    address: REWARD_TOKEN.address as `0x${string}`,
    abi: REWARDS_TOKEN_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: true,
      refetchInterval: false,
      staleTime: 60000, // 1 minute - total supply changes slowly
    },
  });
  const { data: maxSupplyData, refetch: refetchMaxSupply } = useReadContract({
    address: REWARD_TOKEN.address as `0x${string}`,
    abi: REWARDS_TOKEN_ABI,
    functionName: 'getMaxSupply',
    query: {
      enabled: true,
      refetchInterval: false,
      staleTime: 300000, // 5 minutes - max supply rarely changes
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
      staleTime: 10000, // 10 seconds - increased to reduce network calls
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
      staleTime: 300000, // 5 minutes - board data doesn't change once generated
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
      staleTime: 30000, // 30 seconds - player stats change less frequently
    },
  });
  const { data: rollFeeData, refetch: refetchRollFee } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractAbi,
    functionName: rollFeeFunctionName,
    query: {
      enabled: true,
      refetchInterval: false,
      staleTime: 300000, // 5 minutes - roll fee rarely changes
    },
  });

  const { data: gameFinishBonusData, refetch: refetchGameFinishBonus } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractAbi,
    functionName: 'getGameFinishBonus',
    query: {
      enabled: true,
      refetchInterval: false,
      staleTime: 300000, // 5 minutes - game finish bonus rarely changes
    },
  });

  // Multiplayer-specific reads
  const { data: peerPositionsData, refetch: refetchPeerPositions } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractAbi,
    functionName: 'getPeerPositionsWithCounts',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && memoizedMode === 'multi',
      refetchInterval: 10000, // 10 seconds - refresh peer positions frequently
      staleTime: 5000, // 5 seconds - keep data fresh
    },
  });

  const { data: gameActivitiesData, refetch: refetchGameActivities } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractAbi,
    functionName: 'getGameActivities',
    args: [1, 0, 50], // gameId: 0, start: 0, count: 10 (latest 10 activities)
    query: {
      enabled: memoizedMode === 'multi',
      refetchInterval: 15000, // 15 seconds - refresh activities
      staleTime: 10000, // 10 seconds - keep data fresh
    },
  });

  const rollFee = rollFeeData ? BigInt(rollFeeData as any).toString() : null;
  const joinGameFee = joinGameFeeData ? BigInt(joinGameFeeData as any).toString() : null;
  const totalSupply = totalSupplyData ? formatEther(BigInt(totalSupplyData as any)) : null;
  const maxSupply = maxSupplyData ? formatEther(BigInt(maxSupplyData as any)) : null;

  // --- Start Game (Single Player ONLY) ---
  const startGame = useCallback(async () => {
    if (memoizedMode !== 'single' || !address || isStartGamePending || isStartGameConfirming) {
      return;
    }
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
  }, [address, writeStartGame, isStartGamePending, isStartGameConfirming, memoizedMode]);

  // --- Join Game (Multiplayer) ---
  const joinGame = useCallback(async () => {
    if (memoizedMode !== 'multi' || !address) {
      return;
    }
    try {
      setIsJoinGameInProgress(true);
      // Use dynamic join fee from contract
      const fee = joinGameFee ? BigInt(joinGameFee) : BigInt('100000000000000000'); // fallback to 0.1 ETH
      
      // Use async version to allow awaiting in the UI
      await writeJoinGameAsync({
        address: MULTI_PLAYER_CONTRACT_ADDRESS as `0x${string}`,
        abi: MULTI_PLAYER_GAME_ABI,
        functionName: 'joinGame',
        args: [1], // Join gameId 1
        value: fee,
        chain: monadTestnet,
        account: address,
      });
    } catch (error: any) {
      setIsJoinGameInProgress(false);
      console.error('[useGame] Failed to join MULTIPLAYER game:', error);
      throw error; // Re-throw to be caught by the UI handler
    }
  }, [address, writeJoinGameAsync, memoizedMode, joinGameFee]);

  // After a successful join, refetch status to load the board.
  useEffect(() => {
    if (isJoinGameConfirmed) {
      setIsLoadingBoard(true);
      toast({ title: "Joined Multiplayer Game!", description: "Loading the game board..." });
      console.log('[useGame] Join game confirmed. Refetching player status and board data...');
      // Fetch both status and board data to ensure the UI is complete.
      Promise.all([
        refetchPlayerStatus(),
        refetchBoardData(),
        refetchGameActivities(),
        refetchPeerPositions(),
      ]).finally(() => {
        // Give a small delay to ensure the data is processed
        setTimeout(() => {
          setIsLoadingBoard(false);
          setIsJoinGameInProgress(false); // Reset join game progress when board loading is complete
        }, 1000);
      });
    }
  }, [isJoinGameConfirmed, refetchPlayerStatus, refetchBoardData, refetchGameActivities, refetchPeerPositions]);


  // --- Roll Dice ---
  const rollDice = useCallback(async () => {
    if (!address || isRollDicePending || isRollDiceConfirming) {
      return;
    }
    if (!gameState || typeof gameState.position !== 'number') {
      toast({ title: 'Error', description: 'Game not ready or position unknown.', variant: 'destructive' });
      return;
    }
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
        gas: 400000n,
      });
    } catch (error: any) {
      setIsWaitingForVRF(false);
    }
  }, [address, writeRollDice, isRollDicePending, isRollDiceConfirming, contractAddress, contractAbi, rollFee, gameState]);

  // --- Claim Rewards ---
  const claimRewards = useCallback(async () => {
    if (!address) {
      return;
    }
    
    // Prevent multiple claim attempts
    if (claimStateRef.current === 'claiming' || claimStateRef.current === 'claimed') {
      console.log('[useGame] Claim already in progress or completed, skipping.');
      return;
    }

    // Get fresh game state to avoid stale closures
    const currentGameState = gameStateRef.current;
    if (!currentGameState?.hasFinished) {
      console.log('[useGame] Game not finished yet, skipping claim.');
      return;
    }

    // Check if rewards were already claimed
    if (memoizedMode === 'single' && currentGameState.nunuEarned === 0) {
      console.log('[useGame] Single player: nunuEarned is 0, rewards already claimed');
      claimStateRef.current = 'claimed';
      setClaimRewardsSuccess(true);
      setClaimRewardsError(null);
      return;
    }
    
    if (memoizedMode === 'multi' && !playerStatusData && isPlayerStatusFetched) {
      console.log('[useGame] Multiplayer: playerStatusData is null, rewards already claimed');
      claimStateRef.current = 'claimed';
      setClaimRewardsSuccess(true);
      setClaimRewardsError(null);
      return;
    }

    // Start claiming
    claimStateRef.current = 'claiming';
    console.log('[useGame] Starting claim process...');
    
    try {
      const txConfig = memoizedMode === 'multi'
        ? {
            address: MULTI_PLAYER_CONTRACT_ADDRESS as `0x${string}`,
            abi: MULTI_PLAYER_GAME_ABI,
            functionName: 'claimRewardV1' as const,
            args: [address as `0x${string}`],
            chain: monadTestnet,
            account: address,
            gas: 700000n
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
      await writeClaimRewards(txConfig);
    } catch (error: any) {
      console.error('[useGame] Claim failed:', error);
      claimStateRef.current = 'error';
      setClaimRewardsError('Failed to claim rewards. Please try again.');
      throw error; // Re-throw to be caught by the UI handler
    }
  }, [address, memoizedMode, playerStatusData, isPlayerStatusFetched, writeClaimRewards]); // Keep only essential dependencies

  // Auto-claim when game finishes - optimized to prevent multiple calls
  useEffect(() => {
    // Clear any existing timeout first
    if (autoClaimTimeoutRef.current) {
      clearTimeout(autoClaimTimeoutRef.current);
      autoClaimTimeoutRef.current = null;
    }
    
    // Early exit conditions
    if (!gameState?.hasFinished) {
      return;
    }
    
    // Don't auto-claim if already in progress, completed, or errored
    if (claimStateRef.current !== 'idle') {
      console.log('[useGame] Auto-claim skipped - claim state is:', claimStateRef.current);
      return;
    }
    
    // Don't auto-claim if wagmi is already processing a claim
    if (isClaimRewardsPendingWagmi || isClaimRewardsConfirming) {
      console.log('[useGame] Auto-claim skipped - wagmi claim already in progress');
      return;
    }
    
    console.log('[useGame] Game finished, scheduling auto-claim...');
    
    // Use a ref to track the timeout and prevent multiple timeouts
    autoClaimTimeoutRef.current = setTimeout(() => {
      // Triple-check state before claiming to prevent race conditions
      if (
        claimStateRef.current === 'idle' && 
        gameStateRef.current?.hasFinished &&
        !isClaimRewardsPendingWagmi &&
        !isClaimRewardsConfirming
      ) {
        console.log('[useGame] Executing auto-claim now');
        claimRewards();
      } else {
        console.log('[useGame] Auto-claim cancelled - state changed');
      }
      autoClaimTimeoutRef.current = null;
    }, 1500); // Increased delay slightly for more stability

    return () => {
      if (autoClaimTimeoutRef.current) {
        clearTimeout(autoClaimTimeoutRef.current);
        autoClaimTimeoutRef.current = null;
      }
    };
  }, [gameState?.hasFinished, isClaimRewardsPendingWagmi, isClaimRewardsConfirming]); // Added wagmi state dependencies for safety

  // Process contract data
  useEffect(() => {
    if (playerStatusData) {
      console.log('[useGame] Received playerStatusData:', playerStatusData);
      const data = memoizedMode === 'multi' ? {
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
        isRugged: playerStatusData[10],
        sameDicePeers: Number(playerStatusData[11]),
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
  }, [playerStatusData, memoizedMode]);

  // Handle claim state resets separately to avoid dependency loops
  useEffect(() => {
    if (gameState && !gameState.hasFinished && gameState.position === 1) {
      console.log('[useGame] New game started (position 1), resetting claim state');
      claimStateRef.current = 'idle';
      setClaimRewardsError(null);
      setClaimRewardsSuccess(false);
    }
  }, [gameState?.hasFinished, gameState?.position]);

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
      console.log('gameStatsData', gameStatsData);
      if (memoizedMode === 'multi') {
        // Multiplayer has additional fields
        setGameStats({
          gamesCompleted: Number(gameStatsData[0]),
          totalNunuEarned: Number(gameStatsData[1]),
          totalPlayers: Number(gameStatsData[2]),
          totalRewardsWon: Number(gameStatsData[3]),
          gameActivePlayers: Number(gameStatsData[4]),
          totalLiquidityAdded: Number(gameStatsData[5]),
        });
      } else {
        // Single player has original fields
        setGameStats({
          gamesCompleted: Number(gameStatsData[0]),
          totalNunuEarned: Number(gameStatsData[1]),
          totalPlayers: Number(gameStatsData[2]),
        });
      }
    }
  }, [gameStatsData, memoizedMode]);

  // Process game finish bonus data
  useEffect(() => {
    if (gameFinishBonusData) {
      console.log('gameFinishBonusData', gameFinishBonusData);
      setGameFinishBonus(Number(gameFinishBonusData));
    }
  }, [gameFinishBonusData]);

  useEffect(() => {
    if (playerStatsData) {
      console.log('playerStatsData', playerStatsData);
      setPlayerStats({
        totalNunuEarned: Number(playerStatsData[0]),
        highestScore: Number(playerStatsData[1]),
        gamesCompleted: Number(playerStatsData[2]),
        ruggedCount: Number(playerStatsData[3] ?? 0),
        totalRewardWon: Number(playerStatsData[4] ?? 0),
      });
    }
  }, [playerStatsData]);

  // Process peer positions data
  useEffect(() => {
    if (peerPositionsData && memoizedMode === 'multi') {
      const [positions, counts, ruggmates] = peerPositionsData as [number[], number[], number[]];
      setPeerPositions({
        positions: positions.map(p => Number(p)),
        counts: counts.map(c => Number(c)),
        ruggmates: ruggmates.map(r => Number(r))
      });
    }
  }, [peerPositionsData, memoizedMode]);

  // Process game activities data
  useEffect(() => {
    console.log('[useGame] Processing game activities data:', {
      gameActivitiesData,
      mode: memoizedMode,
      isMulti: memoizedMode === 'multi',
      dataExists: !!gameActivitiesData,
      dataType: typeof gameActivitiesData,
      isArray: Array.isArray(gameActivitiesData)
    });

    if (gameActivitiesData && memoizedMode === 'multi') {
      const activities = (gameActivitiesData as any[]).map(activity => ({
        actor: activity.actor,
        actionType: Number(activity.actionType),
        count: Number(activity.count),
        amount: Number(activity.amount),
        timestamp: Number(activity.timestamp)
      }));
      console.log('[useGame] Processed activities:', activities);
      setGameActivities(activities);
    } else {
      console.log('[useGame] Not processing activities - conditions not met');
      if (memoizedMode !== 'multi') {
        console.log('[useGame] Reason: Not in multiplayer mode');
      }
      if (!gameActivitiesData) {
        console.log('[useGame] Reason: No game activities data');
      }
    }
  }, [gameActivitiesData, memoizedMode]);

  // Fetch all game data function with logging - optimized to reduce calls
  const fetchAllGameData = useCallback(async () => {
    if (!address) return;
    console.log('[useGame] fetchAllGameData called');
    setIsLoading(true);
    try {
      await Promise.all([
        refetchPlayerStatus(),
        refetchBoardData(),
        refetchGameStats(),
        refetchPlayerStats(),
        refetchTotalSupply(),
        refetchMaxSupply(),
        ...(memoizedMode === 'multi' ? [refetchGameActivities(), refetchPeerPositions()] : []),
      ]);
      console.log('[useGame] fetchAllGameData completed successfully');
    } catch (error) {
      console.error('[useGame] fetchAllGameData failed:', error);
      toast({
        title: 'Failed to fetch game data',
        description: error as string,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, refetchPlayerStatus, refetchBoardData, refetchGameStats, refetchPlayerStats, refetchTotalSupply, refetchMaxSupply, refetchGameActivities, refetchPeerPositions, memoizedMode]);

  const fetchPlatformData = useCallback(async () => {
    console.log('[useGame] fetchPlatformData called');
    setIsLoading(true);
    try {
      await Promise.all([
        refetchGameStats(),
        refetchTotalSupply(),
        refetchMaxSupply(),
        ...(memoizedMode === 'multi' ? [refetchGameActivities()] : []),
      ]);
      console.log('[useGame] fetchPlatformData completed successfully');
    } catch (error) {
      console.error('[useGame] fetchPlatformData failed:', error);
      toast({
        title: 'Failed to fetch platform data',
        description: error as string,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [refetchGameStats, refetchTotalSupply, refetchMaxSupply, refetchGameActivities, memoizedMode]);

  const fetchPlayerData = useCallback(async () => {
    if (!address) return;
    console.log('[useGame] fetchPlayerData called');
    setIsLoading(true);
    try {
      await Promise.all([
        refetchPlayerStatus(),
        refetchBoardData(),
        refetchPlayerStats(),
        ...(memoizedMode === 'multi' ? [refetchGameActivities(), refetchPeerPositions()] : []),
      ]);
      console.log('[useGame] fetchPlayerData completed successfully');
    } catch (error) {
      console.error('[useGame] fetchPlayerData failed:', error);
      toast({
        title: 'Failed to fetch player data',
        description: error as string,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, refetchPlayerStatus, refetchBoardData, refetchPlayerStats, refetchGameActivities, refetchPeerPositions, memoizedMode]);

  const fetchLeaderboard = useCallback(async () => {
    // TODO: Implement leaderboard fetch for multiplayer if available
  }, []);



  // Optimize initial data fetching - only fetch once on mount
  useEffect(() => {
    let mounted = true;
    if (mounted) {
      fetchPlatformData();
    }
    return () => { mounted = false; };
  }, []); // Remove fetchPlatformData dependency to prevent re-runs

  useEffect(() => {
    let mounted = true;
    if (address && mounted) {
      fetchPlayerData();
    }
    return () => { mounted = false; };
  }, [address]); // Remove fetchPlayerData dependency to prevent re-runs

  useEffect(() => {
    if (isRollDiceConfirmed) {
      setIsWaitingForVRF(false);
      setIsLoading(true);
      console.log('[useGame] Roll dice confirmed, refetching player data');
      Promise.all([
        refetchPlayerStatus(),
        refetchPlayerStats(),
        refetchGameStats(),
        ...(memoizedMode === 'multi' ? [refetchGameActivities(), refetchPeerPositions()] : []),
      ]).finally(() => setIsLoading(false));
    }
  }, [isRollDiceConfirmed, refetchPlayerStatus, refetchPlayerStats, refetchGameActivities, refetchPeerPositions, memoizedMode]);

  const resetGame = useCallback(() => {
    console.log('[useGame] Resetting game state for multiplayer.');
    setGameState(null);
    setClaimRewardsSuccess(false); // Reset claim success state
    setClaimRewardsError(null); // Reset claim error state
    claimStateRef.current = 'idle'; // Reset claim state
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
      console.log('[useGame] Start game confirmed, refetching player data');
      // Only refetch player data, not all platform data
      Promise.all([
        refetchPlayerStatus(),
        refetchBoardData(),
        refetchPlayerStats(),
        ...(memoizedMode === 'multi' ? [refetchGameActivities(), refetchPeerPositions()] : []),
      ]).finally(() => setIsLoading(false));
    }
  }, [isStartGameConfirmed, refetchPlayerStatus, refetchBoardData, refetchPlayerStats, refetchGameActivities, refetchPeerPositions, memoizedMode]);

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
      setIsJoinGameInProgress(false); // Reset join game progress on error
      handleContractError(joinGameError, 'Failed to join the game. Please try again.');
    }
  }, [joinGameError]);

  // Handle claim rewards write/receipt errors
  useEffect(() => {
    if (claimRewardsWriteError || claimRewardsReceiptError) {
      const errorMsg = (claimRewardsWriteError || claimRewardsReceiptError)?.message || '';
      
      console.error('[useGame] Claim rewards error:', errorMsg);
      
      // Handle "Another transaction has higher priority" - this is not a real error
      if (errorMsg.includes('Another transaction has higher priority') || errorMsg.includes('txpool not responding')) {
        console.log('[useGame] Transaction priority issue detected, this is normal and will resolve automatically');
        // Don't set any error state - let the success handler take care of it if it works
        // Don't reset claim state - let it continue
        return; // Exit early to prevent error state from being set
      }
      
      // Handle already claimed scenarios
      if (errorMsg.includes('NoRewardsToClaim') || errorMsg.includes('already claimed') || errorMsg.includes('No rewards to claim') || errorMsg.includes('not in a game')) {
        const errorMessage = 'Rewards have already been claimed for this game.';
        setClaimRewardsError(errorMessage);
        setClaimRewardsSuccess(true); // Treat as success since rewards were already claimed
        claimStateRef.current = 'claimed'; // Mark as claimed
        toast({
          title: 'Already Claimed',
          description: errorMessage,
          variant: 'default',
        });
      } else if (errorMsg.includes('finish first')) {
        const errorMessage = 'Please finish the game first before claiming rewards.';
        setClaimRewardsError(errorMessage);
        claimStateRef.current = 'error'; // Mark as error
        toast({
          title: 'Game Not Finished',
          description: errorMessage,
          variant: 'destructive',
        });
      } else if (errorMsg.includes('User rejected the request')) {
        const errorMessage = 'You rejected the transaction in your wallet.';
        setClaimRewardsError(errorMessage);
        claimStateRef.current = 'error'; // Mark as error
        toast({
          title: 'Transaction Rejected',
          description: errorMessage,
          variant: 'destructive',
        });
      } else if (errorMsg.split('Details:').length > 1) {
        const errorMessage = errorMsg.split('Details:')[1].split('Version:')[0].trim();
        setClaimRewardsError(errorMessage);
        claimStateRef.current = 'error'; // Mark as error
        toast({
          title: 'Transaction Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        const errorMessage = 'Failed to claim rewards. Please try again.';
        setClaimRewardsError(errorMessage);
        claimStateRef.current = 'error'; // Mark as error for other errors
        toast({
          title: 'Transaction Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  }, [claimRewardsWriteError, claimRewardsReceiptError]);

  // Handle successful claim rewards
  useEffect(() => {
    if (isClaimRewardsConfirmed) {
      console.log('[useGame] Claim rewards confirmed successfully');
      setClaimRewardsSuccess(true);
      setClaimRewardsError(null);
      claimStateRef.current = 'claimed'; // Mark as claimed
      
      // Refetch player stats to get updated ruggedCount and totalRewardWon
      if (memoizedMode === 'multi') {
        console.log('[useGame] Refetching player stats after successful claim');
        refetchPlayerStats();
      }
      
      toast({
        title: 'Rewards Claimed!',
        description: `Your ${REWARD_TOKEN.symbol} tokens have been successfully claimed.`,
        variant: 'default',
      });
    }
  }, [isClaimRewardsConfirmed, memoizedMode, refetchPlayerStats]);
  
  // Cleanup auto-claim timeout on unmount
  useEffect(() => {
    return () => {
      if (autoClaimTimeoutRef.current) {
        console.log('[useGame] Cleaning up auto-claim timeout on unmount');
        clearTimeout(autoClaimTimeoutRef.current);
        autoClaimTimeoutRef.current = null;
      }
    };
  }, []);

  return useMemo(() => {
    // For multiplayer: player can only restart if rewards are claimed (player no longer in game)
    // For single player: player can restart anytime after finishing
    const canRestart = memoizedMode === 'multi' 
      ? (gameState?.hasFinished && claimRewardsSuccess) || isPlayerStatusError 
      : true;

    console.log('[useGame] Return object state:', {
      mode: memoizedMode,
      gameActivities: gameActivities,
      peerPositions: peerPositions,
      gameActivitiesLength: gameActivities?.length || 0,
      peerPositionsLength: peerPositions?.positions?.length || 0
    });

    return {
      address,
      isConnected: !!address,
      CONTRACT_ADDRESS: contractAddress,
      gameState,
      boardData,
      gameStats,
      playerRank,
      leaderboard,
      playerStats,
      peerPositions,
      gameActivities,
      gameFinishBonus,
      totalSupply,
      maxSupply,
      rollFee,
      joinGameFee,
      isLoading: isLoading || isStartGameConfirming || isRollDiceConfirming || isClaimRewardsConfirming || isJoinGamePending || isLoadingBoard || isJoinGameInProgress,
      isLoadingStartGame: isLoadingStartGame || isStartGamePending || isStartGameConfirming,
      isLoadingBoard,
      isWaitingForVRF: isWaitingForVRF || isRollDicePending || isRollDiceConfirming,
      isClaimRewardsPending: isClaimRewardsConfirming || isClaimRewardsPendingWagmi,
      claimRewardsError,
      claimRewardsSuccess,
      canRestart, // New property to control restart availability
      fetchPlatformData,
      fetchPlayerData,
      fetchLeaderboard,
      startGame: memoizedMode === 'single' ? startGame : undefined,
      joinGame: memoizedMode === 'multi' ? joinGame : undefined,
      rollDice,
      claimRewards,
      resetGame,
      refetchPlayerRank: () => {}, // Not implemented for multiplayer
      isPlayerStatusLoaded: isPlayerStatusFetched,
      isPlayerStatusError,
      playerStatusError,
      // Add refetch functions for debugging
      refetchGameActivities,
      refetchPeerPositions,
    };
  }, [
    memoizedMode, gameState, claimRewardsSuccess, isPlayerStatusError,
    address, boardData, gameStats, playerRank, leaderboard, playerStats, totalSupply, maxSupply, rollFee, joinGameFee,
    isLoading, isStartGameConfirming, isRollDiceConfirming, isClaimRewardsConfirming, isJoinGamePending, isLoadingBoard, isJoinGameInProgress,
    isLoadingStartGame, isStartGamePending, isLoadingBoard,
    isWaitingForVRF, isRollDicePending,
    isClaimRewardsConfirming, isClaimRewardsPendingWagmi,
    claimRewardsError, claimRewardsSuccess, fetchPlatformData, fetchPlayerData, fetchLeaderboard,
    startGame, joinGame, rollDice, claimRewards, isPlayerStatusFetched, playerStatusError, peerPositions, gameActivities, refetchGameActivities, refetchPeerPositions, gameFinishBonus
  ]);
}; 