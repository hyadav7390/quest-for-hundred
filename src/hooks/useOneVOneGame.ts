import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from 'wagmi';
import { toast } from '@/hooks/use-toast';
import {
  ONE_V_ONE_CONTRACT_ADDRESS,
} from '@/configs';
import { ONE_V_ONE_GAME_ABI } from '@/abi/oneVOneGameABI';
import { keccak256, parseEther, stringToBytes } from 'viem';

export type MatchState = 'none' | 'waiting' | 'active' | 'completed' | 'canceled';
export type MatchMode = 'queue' | 'friend';

export interface OneVOneMatch {
  id: bigint;
  players: [string, string];
  stakes: [bigint, bigint];
  betAmount: bigint;
  platformFeeBps: number;
  state: MatchState;
  mode: MatchMode;
  turn: number;
  expiresAt: number;
  winner: string;
  claimed: boolean;
  positions: [number, number];
  lastDice: [number, number];
  createdAt: bigint;
}

export interface OneVOneBoardData {
  detourTrapTiles: { index: number; moveBack: number; revealed: boolean }[];
  shortcutGateTiles: { index: number; moveForward: number; revealed: boolean }[];
}

const CONTRACT_ADDRESS = ONE_V_ONE_CONTRACT_ADDRESS as `0x${string}`;

const stateMap: Record<number, MatchState> = {
  0: 'none',
  1: 'waiting',
  2: 'active',
  3: 'completed',
  4: 'canceled',
};

const modeMap: Record<number, MatchMode> = {
  0: 'queue',
  1: 'friend',
};

export const useOneVOneGame = (overrideMatchId?: bigint) => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [inviteSecret, setInviteSecret] = useState<string | null>(null);
  const [inviteMatchId, setInviteMatchId] = useState<bigint | null>(null);
  const [extraRollEvent, setExtraRollEvent] = useState<{
    matchId: bigint;
    player: `0x${string}`;
    chainCount: number;
  } | null>(null);

  const {
    data: playerMatchRaw,
    refetch: refetchPlayerMatch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ONE_V_ONE_GAME_ABI,
    functionName: 'playerMatch',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const resolvedMatchId = useMemo(() => {
    if (overrideMatchId && overrideMatchId > 0n) {
      return overrideMatchId;
    }
    const pm = playerMatchRaw as unknown as bigint | undefined;
    if (typeof pm === 'bigint' && pm > 0n) {
      return pm;
    }
    return 0n;
  }, [overrideMatchId, playerMatchRaw]);

  const {
    data: rawMatchData,
    refetch: refetchMatch,
    isLoading: isMatchLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ONE_V_ONE_GAME_ABI,
    functionName: 'getMatch',
    args: [resolvedMatchId],
    query: {
      enabled: resolvedMatchId > 0n,
      refetchInterval: 10_000,
    },
  });
  const match: OneVOneMatch | null = useMemo(() => {
    if (!rawMatchData) return null;

    const decoded = rawMatchData as unknown as {
      id: bigint;
      players: [string, string];
      stakes: [bigint, bigint];
      betAmount: bigint;
      platformFeeBps: number;
      state: number;
      mode: number;
      turn: number;
      expiresAt: number;
      winner: string;
      claimed: boolean;
      positions: [number, number];
      lastDice: [number, number];
      createdAt: bigint;
    };

    return {
      id: decoded.id,
      players: decoded.players,
      stakes: decoded.stakes,
      betAmount: decoded.betAmount,
      platformFeeBps: decoded.platformFeeBps,
      state: stateMap[decoded.state] ?? 'none',
      mode: modeMap[decoded.mode] ?? 'queue',
      turn: decoded.turn,
      expiresAt: decoded.expiresAt,
      winner: decoded.winner,
      claimed: decoded.claimed,
      positions: decoded.positions,
      lastDice: decoded.lastDice,
      createdAt: decoded.createdAt,
    };
  }, [rawMatchData]);

  const {
    data: rawBoardData,
    isLoading: isBoardLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ONE_V_ONE_GAME_ABI,
    functionName: 'getBoard',
    args: resolvedMatchId > 0n ? [resolvedMatchId] : undefined,
    query: {
      enabled: resolvedMatchId > 0n,
      refetchInterval: false,
    },
  });
  const board: OneVOneBoardData = useMemo(() => {
    if (!rawBoardData) {
      return { detourTrapTiles: [], shortcutGateTiles: [] };
    }

    const tiles = rawBoardData as unknown as { doorOffset: bigint }[];
    const detours: { index: number; moveBack: number; revealed: boolean }[] = [];
    const shortcuts: { index: number; moveForward: number; revealed: boolean }[] = [];

    tiles.forEach((tile, idx) => {
      if (idx === 0) return;
      const offset = Number(tile.doorOffset ?? 0n);
      if (offset > 0) {
        shortcuts.push({ index: idx, moveForward: offset, revealed: false });
      } else if (offset < 0) {
        detours.push({ index: idx, moveBack: Math.abs(offset), revealed: false });
      }
    });

    return { detourTrapTiles: detours, shortcutGateTiles: shortcuts };
  }, [rawBoardData]);

  useEffect(() => {
    if (!publicClient || resolvedMatchId === 0n) return;

    const stop = publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: ONE_V_ONE_GAME_ABI,
      eventName: 'ExtraRollAwarded',
      args: { matchId: resolvedMatchId },
      onLogs: (logs) => {
        logs.forEach((log) => {
          const { matchId, player, chainCount } = log.args as {
            matchId: bigint;
            player: `0x${string}`;
            chainCount: bigint;
          };
          setExtraRollEvent({
            matchId,
            player,
            chainCount: Number(chainCount),
          });
        });
        refetchMatch();
      },
    });

    return () => {
      if (typeof stop === 'function') stop();
    };
  }, [publicClient, resolvedMatchId, refetchMatch]);

  const clearExtraRollEvent = useCallback(() => {
    setExtraRollEvent(null);
  }, []);

  const getQueueSnapshot = useCallback(
    async (betAmount: string) => {
      if (!publicClient) return null;
      if (!betAmount || Number(betAmount) <= 0) return null;
      const value = parseEther(betAmount);
      try {
        const [exact, lower, upper] = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: ONE_V_ONE_GAME_ABI,
          functionName: 'getQueueSnapshot',
          args: [value],
        }) as unknown as [bigint, bigint, bigint];
        return { exact, lower, upper };
      } catch (error: any) {
        const message = error?.shortMessage || error?.message || 'Failed to load queue data';
        toast({
          title: 'Queue lookup failed',
          description: message,
          variant: 'destructive',
        });
        return null;
      }
    },
    [publicClient],
  );

  const sendTx = useCallback(
    async (config: any, successMessage?: string) => {
      try {
        if (!publicClient) throw new Error('RPC client unavailable');
        const hash = await writeContractAsync(config);
        await publicClient.waitForTransactionReceipt({ hash });
        await Promise.allSettled([
          refetchPlayerMatch(),
          refetchMatch(),
        ]);
        if (successMessage) {
          toast({
            title: successMessage,
          });
        }
      } catch (error: any) {
        const message = error?.shortMessage || error?.message || 'Transaction failed';
        toast({
          title: 'Transaction failed',
          description: message,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [publicClient, writeContractAsync, refetchMatch, refetchPlayerMatch],
  );

  const joinQueue = useCallback(
    async (betAmount: string) => {
      const value = parseEther(betAmount);
      await sendTx(
        {
          address: CONTRACT_ADDRESS,
          abi: ONE_V_ONE_GAME_ABI,
          functionName: 'joinQueue',
          args: [value],
          value,
        },
        'Joined 1v1 queue',
      );
    },
    [sendTx],
  );

  const leaveQueue = useCallback(async () => {
    await sendTx(
      {
        address: CONTRACT_ADDRESS,
        abi: ONE_V_ONE_GAME_ABI,
        functionName: 'leaveQueue',
        args: [],
      },
      'Left queue',
    );
  }, [sendTx]);

  const createInviteMatch = useCallback(
    async (betAmount: string) => {
      const value = parseEther(betAmount);
      const secret = crypto.randomUUID();
      const secretBytes = stringToBytes(secret);
      const inviteHash = keccak256(secretBytes);

      await sendTx(
        {
          address: CONTRACT_ADDRESS,
          abi: ONE_V_ONE_GAME_ABI,
          functionName: 'createMatch',
          args: [value, inviteHash],
          value,
        },
        'Invite created',
      );

      setInviteSecret(secret);
      const updated = await refetchPlayerMatch();
      if (typeof updated?.data === 'bigint' && updated.data > 0n) {
        setInviteMatchId(updated.data as bigint);
      }
    },
    [sendTx, refetchPlayerMatch],
  );

  const cancelInvite = useCallback(
    async (matchId: bigint) => {
      await sendTx(
        {
          address: CONTRACT_ADDRESS,
          abi: ONE_V_ONE_GAME_ABI,
          functionName: 'cancelUnmatched',
          args: [matchId],
        },
        'Invite canceled',
      );
      setInviteSecret(null);
      setInviteMatchId(null);
    },
    [sendTx],
  );

  const joinInvite = useCallback(
    async (matchId: bigint, betAmount: string, secret: string) => {
      const value = parseEther(betAmount);
      const secretBytes = stringToBytes(secret);
      await sendTx(
        {
          address: CONTRACT_ADDRESS,
          abi: ONE_V_ONE_GAME_ABI,
          functionName: 'joinMatch',
          args: [matchId, secretBytes],
          value,
        },
        'Joined match',
      );
    },
    [sendTx],
  );

  const roll = useCallback(
    async (matchId: bigint) => {
      await sendTx(
        {
          address: CONTRACT_ADDRESS,
          abi: ONE_V_ONE_GAME_ABI,
          functionName: 'roll',
          args: [matchId],
          gas: 100000n,
        },
        'Dice rolled',
      );
    },
    [sendTx],
  );

  const autoRoll = useCallback(
    async (matchId: bigint) => {
      await sendTx(
        {
          address: CONTRACT_ADDRESS,
          abi: ONE_V_ONE_GAME_ABI,
          functionName: 'autoRoll',
          args: [matchId],
        },
        'Auto-roll executed',
      );
    },
    [sendTx],
  );

  const claim = useCallback(
    async (matchId: bigint) => {
      await sendTx(
        {
          address: CONTRACT_ADDRESS,
          abi: ONE_V_ONE_GAME_ABI,
          functionName: 'claim',
          args: [matchId],
        },
        'Rewards claimed',
      );
    },
    [sendTx],
  );

  useEffect(() => {
    if (resolvedMatchId === 0n) {
      setInviteMatchId(null);
    }
  }, [resolvedMatchId]);

  useEffect(() => {
    if (!publicClient || !address) return;

    const lower = address.toLowerCase();

    const stop = publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: ONE_V_ONE_GAME_ABI,
      eventName: 'MatchStarted',
      onLogs: (logs) => {
        let shouldRefetch = false;
        logs.forEach((log) => {
          const { player0, player1 } = log.args as {
            player0: `0x${string}`;
            player1: `0x${string}`;
          };
          if (
            player0?.toLowerCase() === lower ||
            player1?.toLowerCase() === lower
          ) {
            shouldRefetch = true;
          }
        });
        if (shouldRefetch) {
          refetchPlayerMatch();
          refetchMatch();
        }
      },
    });

    return () => {
      if (typeof stop === 'function') stop();
    };
  }, [publicClient, address, refetchPlayerMatch, refetchMatch]);

  return {
    match,
    matchId: resolvedMatchId,
    isMatchLoading,
    isBoardLoading,
    inviteSecret,
    inviteMatchId,
    getQueueSnapshot,
    joinQueue,
    leaveQueue,
    createInviteMatch,
    cancelInvite,
    joinInvite,
    roll,
    autoRoll,
    claim,
    refetchMatch,
    refetchPlayerMatch,
    board,
    extraRollEvent,
    clearExtraRollEvent,
  };
};
