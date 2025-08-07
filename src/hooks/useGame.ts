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
  const [peerPositions, setPeerPositions] = useState<{ positions: number[]; counts: number[] }>({ positions: [], counts: [] });
  const [gameActivities, setGameActivities] = useState<any[]>([]);
  const [gameFinishBonus, setGameFinishBonus] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStartGame, setIsLoadingStartGame] = useState(false);
  const [isWaitingForVRF, setIsWaitingForVRF] = useState(false);
  const [isClaimRewardsPending, setIsClaimRewardsPending] = useState(false);
  const [claimRewardsError, setClaimRewardsError] = useState<string | null>(null);
  const [claimRewardsSuccess, setClaimRewardsSuccess] = useState(false);
  const [autoClaimTriggered, setAutoClaimTriggered] = useState(false); // Flag to prevent duplicate auto-claims
  
  // Use ref to track if we've already detected claimed rewards to prevent race conditions
  const alreadyClaimedDetectedRef = useRef(false);
  
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
      console.error('[useGame] Failed to join MULTIPLAYER game:', error);
      throw error; // Re-throw to be caught by the UI handler
    }
  }, [address, writeJoinGameAsync, memoizedMode, joinGameFee]);

  // After a successful join, refetch status to load the board.
  useEffect(() => {
    if (isJoinGameConfirmed) {
      toast({ title: "Joined Multiplayer Game!", description: "Loading the game board..." });
      console.log('[useGame] Join game confirmed. Refetching player status and board data...');
      // Fetch both status and board data to ensure the UI is complete.
      Promise.all([
        refetchPlayerStatus(),
        refetchBoardData(),
        refetchGameActivities(),
        refetchPeerPositions(),
      ]);
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
    if (!address || !gameState?.hasFinished) {
      return;
    }
    try {
      setClaimRewardsError(null);
      setClaimRewardsSuccess(false);
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
      // Use async version to allow awaiting in the UI
      await writeClaimRewards(txConfig);
    } catch (error: any) {
      console.error(`[useGame] Failed to claim rewards for ${memoizedMode} mode:`, error);
      throw error; // Re-throw to be caught by the UI handler
    }
  }, [address, gameState?.hasFinished, writeClaimRewards, memoizedMode]);

  // Auto-claim rewards for both single and multiplayer when game finishes
  useEffect(() => {
    if (gameState?.hasFinished && !autoClaimTriggered && !claimRewardsSuccess && !isClaimRewardsConfirming && !isClaimRewardsPendingWagmi && !claimRewardsError && !alreadyClaimedDetectedRef.current) {
      // Additional check: ensure position is actually 100 for single player
      if (memoizedMode === 'single' && gameState.position !== 100) {
        console.log('[useGame] Game marked as finished but position is not 100, skipping auto-claim');
        return;
      }
      
      // Additional check: ensure we have a valid address
      if (!address) {
        console.log('[useGame] No address available, skipping auto-claim');
        return;
      }
      setAutoClaimTriggered(true); // Mark that we've attempted to claim
      
      // Use a local function to avoid dependency issues
      const performClaim = async () => {
        try {
          // Add a small delay to ensure detection logic has run first
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Double-check that we haven't been detected as already claimed
          if (alreadyClaimedDetectedRef.current) {
            console.log('[useGame] Already claimed detected during delay, skipping auto-claim');
            return;
          }
          
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
          console.error('[useGame] Auto-claim failed:', error);
          // Don't set error state here - let the error useEffect handle it
        }
      };
      
      performClaim();
    }
  }, [gameState?.hasFinished, gameState?.position, autoClaimTriggered, claimRewardsSuccess, isClaimRewardsConfirming, isClaimRewardsPendingWagmi, claimRewardsError, memoizedMode, address, writeClaimRewards]);

  // Detect if rewards were already claimed (for page reloads) - run BEFORE auto-claim
  useEffect(() => {
    if (gameState?.hasFinished && !autoClaimTriggered && !claimRewardsSuccess && !claimRewardsError && !alreadyClaimedDetectedRef.current) {
      // Additional check: ensure position is actually 100 for single player
      if (memoizedMode === 'single' && gameState.position !== 100) {
        console.log('[useGame] Game marked as finished but position is not 100, skipping detection');
        return;
      }
      
      console.log('[useGame] Checking if rewards already claimed...', { mode: memoizedMode, nunuEarned: gameState.nunuEarned, playerStatusData: !!playerStatusData, isPlayerStatusFetched });
      
      // For single player: if nunuEarned is 0, rewards were already claimed
      if (memoizedMode === 'single' && gameState.nunuEarned === 0) {
        setClaimRewardsSuccess(true);
        setAutoClaimTriggered(true);
        alreadyClaimedDetectedRef.current = true; // Mark as detected to prevent auto-claim
        return; // Prevent auto-claim from running
      }
      // For multiplayer: if playerStatusData is null/undefined, player was deleted (rewards claimed)
      else if (memoizedMode === 'multi' && !playerStatusData && isPlayerStatusFetched) {
        setClaimRewardsSuccess(true);
        setAutoClaimTriggered(true);
        alreadyClaimedDetectedRef.current = true; // Mark as detected to prevent auto-claim
        return; // Prevent auto-claim from running
      }
    }
  }, [gameState?.hasFinished, gameState?.position, gameState?.nunuEarned, memoizedMode, playerStatusData, isPlayerStatusFetched, autoClaimTriggered, claimRewardsSuccess, claimRewardsError]);

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
    if (gameState && !gameState.hasFinished && gameState.position === 1 && (autoClaimTriggered || claimRewardsSuccess || claimRewardsError)) {
      console.log('[useGame] New game started (position 1), resetting all claim states');
      setAutoClaimTriggered(false);
      setClaimRewardsSuccess(false);
      setClaimRewardsError(null);
      alreadyClaimedDetectedRef.current = false; // Reset detection ref for new game
    }
  }, [gameState?.hasFinished, gameState?.position, autoClaimTriggered, claimRewardsSuccess, claimRewardsError]);

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
      const [positions, counts] = peerPositionsData as [number[], number[]];
      setPeerPositions({
        positions: positions.map(p => Number(p)),
        counts: counts.map(c => Number(c))
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
        ...(memoizedMode === 'multi' ? [refetchGameActivities(), refetchPeerPositions()] : []),
      ]).finally(() => setIsLoading(false));
    }
  }, [isRollDiceConfirmed, refetchPlayerStatus, refetchPlayerStats, refetchGameActivities, refetchPeerPositions, memoizedMode]);

  const resetGame = useCallback(() => {
    console.log('[useGame] Resetting game state for multiplayer.');
    setGameState(null);
    setClaimRewardsSuccess(false); // Reset claim success state
    setClaimRewardsError(null); // Reset claim error state
    setAutoClaimTriggered(false); // Reset auto-claim flag for new game
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
      handleContractError(joinGameError, 'Failed to join the game. Please try again.');
    }
  }, [joinGameError]);

  // Handle claim rewards write/receipt errors
  useEffect(() => {
    if (claimRewardsWriteError || claimRewardsReceiptError) {
      const errorMsg = (claimRewardsWriteError || claimRewardsReceiptError)?.message || '';
      setClaimRewardsSuccess(false);
      
      console.error('[useGame] Claim rewards error:', errorMsg);
      
      if (errorMsg.includes('NoRewardsToClaim') || errorMsg.includes('already claimed') || errorMsg.includes('No rewards to claim')) {
        const errorMessage = 'Rewards have already been claimed for this game.';
        setClaimRewardsError(errorMessage);
        setClaimRewardsSuccess(true); // Treat as success since rewards were already claimed
        toast({
          title: 'Already Claimed',
          description: errorMessage,
          variant: 'default',
        });
      } else if (errorMsg.includes('finish first')) {
        const errorMessage = 'Please finish the game first before claiming rewards.';
        setClaimRewardsError(errorMessage);
        toast({
          title: 'Game Not Finished',
          description: errorMessage,
          variant: 'destructive',
        });
      } else if (errorMsg.includes('User rejected the request')) {
        const errorMessage = 'You rejected the transaction in your wallet.';
        setClaimRewardsError(errorMessage);
        toast({
          title: 'Transaction Rejected',
          description: errorMessage,
          variant: 'destructive',
        });
      } else if (errorMsg.split('Details:').length > 1) {
        const errorMessage = errorMsg.split('Details:')[1].split('Version:')[0].trim();
        setClaimRewardsError(errorMessage);
        toast({
          title: 'Transaction Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        const errorMessage = 'Failed to claim rewards. Please try again.';
        setClaimRewardsError(errorMessage);
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
      
      // Refetch player stats to get updated ruggedCount and totalRewardWon
      if (memoizedMode === 'multi') {
        console.log('[useGame] Refetching player stats after successful claim');
        refetchPlayerStats();
      }
      
      toast({
        title: 'Rewards Claimed!',
        description: 'Your $ROLL tokens have been successfully claimed.',
        variant: 'default',
      });
    }
  }, [isClaimRewardsConfirmed, memoizedMode, refetchPlayerStats]);
  
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
      isLoading: isLoading || isStartGameConfirming || isRollDiceConfirming || isClaimRewardsConfirming || isJoinGamePending,
      isLoadingStartGame: isLoadingStartGame || isStartGamePending || isStartGameConfirming,
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
    isLoading, isStartGameConfirming, isRollDiceConfirming, isClaimRewardsConfirming, isJoinGamePending,
    isLoadingStartGame, isStartGamePending,
    isWaitingForVRF, isRollDicePending,
    isClaimRewardsConfirming, isClaimRewardsPendingWagmi,
    claimRewardsError, claimRewardsSuccess, fetchPlatformData, fetchPlayerData, fetchLeaderboard,
    startGame, joinGame, rollDice, claimRewards, isPlayerStatusFetched, playerStatusError, peerPositions, gameActivities, refetchGameActivities, refetchPeerPositions, gameFinishBonus
  ]);
}; 