import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useOneVOneGame } from '@/hooks/useOneVOneGame';
import { Copy, Dice6, Loader2, Share2, Timer, Users } from 'lucide-react';
import { useAccount } from 'wagmi';
import GameBoard from '@/components/GameBoard';
import Dice from '@/components/Dice';
import OneVOneResultModal from '@/components/OneVOneResultModal';

const shortAddress = (address?: string | null) => {
  if (!address) return '—';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getTimerStyle = (seconds: number) => {
  if (seconds >= 11) {
    return 'text-green-400';
  }
  return 'text-red-500';
};

const OneVOne = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const matchParam = searchParams.get('matchId');
  const inviteSecretParam = searchParams.get('secret');
  const overrideMatchId = matchParam ? BigInt(matchParam) : undefined;
  const { address } = useAccount();

  const {
    match,
    matchId,
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
    board,
    extraRollEvent,
    clearExtraRollEvent,
  } = useOneVOneGame(overrideMatchId);

  const [queueBet, setQueueBet] = useState('1.0');
  const [friendBet, setFriendBet] = useState('1.0');
  const [joinBet, setJoinBet] = useState('1.0');
  const [queueStats, setQueueStats] = useState<{ exact: bigint; lower: bigint; upper: bigint } | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isCopying, setIsCopying] = useState(false);
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [autoClaiming, setAutoClaiming] = useState(false);
  const [hasTriggeredClaim, setHasTriggeredClaim] = useState(false);
  const [winModalOpen, setWinModalOpen] = useState(false);
  const [loseModalOpen, setLoseModalOpen] = useState(false);
  const [winModalDismissed, setWinModalDismissed] = useState(false);
  const [loseModalDismissed, setLoseModalDismissed] = useState(false);
  const [extraRollToast, setExtraRollToast] = useState<string | null>(null);

  const totalPool = useMemo(() => (match ? match.stakes[0] + match.stakes[1] : 0n), [match]);
  const fee = useMemo(() => (match ? (totalPool * BigInt(match.platformFeeBps)) / 10_000n : 0n), [match, totalPool]);
  const payoutAmount = useMemo(() => (match ? totalPool - fee : 0n), [match, totalPool, fee]);

  const playerIndex = useMemo(() => {
    if (!match || !address) return -1;
    const lower = address.toLowerCase();
    if (match.players[0]?.toLowerCase() === lower) return 0;
    if (match.players[1]?.toLowerCase() === lower) return 1;
    return -1;
  }, [match, address]);

  const opponentIndex = playerIndex === 0 ? 1 : playerIndex === 1 ? 0 : -1;
  const playerPosition = match ? match.positions[playerIndex >= 0 ? playerIndex : 0] : 1;
  const opponentPosition = match && opponentIndex >= 0 ? match.positions[opponentIndex] : null;
  const isWinner = !!(match && address && match.winner?.toLowerCase() === address.toLowerCase());
  const isCreator = !!(match && address && match.players[0]?.toLowerCase() === address.toLowerCase());
  const opponentShort = opponentIndex >= 0 ? shortAddress(match?.players[opponentIndex]) : null;
  const targetPosition = playerIndex >= 0 && match ? match.positions[playerIndex] : null;
  const lastDiceValue = playerIndex >= 0 && match ? (match.lastDice?.[playerIndex] ?? 0) : 0;
  const [animatedPosition, setAnimatedPosition] = useState<number>(playerPosition);
  const [isAnimatingPath, setIsAnimatingPath] = useState(false);
  const prevPositionRef = useRef<number>(playerPosition);
  const [doorToast, setDoorToast] = useState<string | null>(null);
  const [doorHighlight, setDoorHighlight] = useState<{ position: number; type: 'red' | 'green' } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const stats = await getQueueSnapshot(queueBet);
      if (active) {
        setQueueStats(stats);
      }
    })();
    return () => {
      active = false;
    };
  }, [queueBet, getQueueSnapshot]);

  useEffect(() => {
    if (!match || match.state !== 'active' || !match.expiresAt || isRollingDice) {
      setRemainingSeconds(0);
      return;
    }
    const compute = () => {
      const now = Math.floor(Date.now() / 1000);
      const seconds = Math.max(0, match.expiresAt - now);
      setRemainingSeconds(seconds);
    };
    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [match, isRollingDice]);

  useEffect(() => {
    if (!match || playerIndex < 0) {
      setDiceValue(null);
      return;
    }
    const latest = match.lastDice?.[playerIndex] ?? 0;
    setDiceValue(latest > 0 ? latest : null);
  }, [match, playerIndex]);

  useEffect(() => {
    if (playerIndex < 0 || !match) {
      setAnimatedPosition(1);
      prevPositionRef.current = 1;
      setDoorToast(null);
      setDoorHighlight(null);
      setExtraRollToast(null);
      return;
    }
    const currentPos = match.positions[playerIndex];
    prevPositionRef.current = currentPos;
    setAnimatedPosition(currentPos);
    setDoorToast(null);
    setDoorHighlight(null);
    setExtraRollToast(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, playerIndex]);

  const inviteLink = useMemo(() => {
    if (!inviteSecret || !inviteMatchId) return null;
    if (typeof window === 'undefined') return null;
    const url = new URL(window.location.href);
    url.pathname = '/1v1';
    url.searchParams.set('matchId', inviteMatchId.toString());
    url.searchParams.set('secret', inviteSecret);
    return url.toString();
  }, [inviteSecret, inviteMatchId]);

  const handleJoinQueue = async () => {
    try {
      setIsJoiningQueue(true);
      await joinQueue(queueBet);
    } catch {
      // handled in hook
    } finally {
      setIsJoiningQueue(false);
    }
  };

  const handleLeaveQueue = async () => {
    try {
      await leaveQueue();
    } catch {
      // handled in hook
    }
  };

  const handleCreateInvite = async () => {
    try {
      await createInviteMatch(friendBet);
      toast({
        title: 'Invite ready',
        description: 'Share the link with your friend to let them join.',
      });
    } catch {
      // handled in hook
    }
  };

  const handleCancelInvite = async () => {
    if (!matchId || matchId === 0n) return;
    try {
      await cancelInvite(matchId);
    } catch {
      // handled in hook
    }
  };

  const handleJoinInvite = async () => {
    if (!matchParam || !inviteSecretParam) {
      toast({
        title: 'Missing invite details',
        description: 'Please provide both matchId and secret.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await joinInvite(BigInt(matchParam), joinBet, inviteSecretParam);
      navigate('/1v1');
    } catch {
      // handled in hook
    }
  };

  const handleRoll = async () => {
    if (!matchId || matchId === 0n) return;
    if (!isTurn) {
      toast({
        title: 'Hold tight',
        description: 'Wait for your opponent to finish their turn.',
      });
      return;
    }
    try {
      setIsRollingDice(true);
      await roll(matchId);
    } catch {
      // handled
    } finally {
      setIsRollingDice(false);
    }
  };

  const handleAutoRoll = async () => {
    if (!matchId || matchId === 0n) return;
    if (remainingSeconds > 0) {
      toast({
        title: 'Timer still running',
        description: 'Auto-roll is only available once the 30s timer expires.',
      });
      return;
    }
    try {
      setIsRollingDice(true);
      await autoRoll(matchId);
    } catch {
      // handled
    } finally {
      setIsRollingDice(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(inviteLink);
      toast({ title: 'Link copied', description: 'Invite link copied to clipboard.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Unable to copy. Copy manually instead.', variant: 'destructive' });
    } finally {
      setIsCopying(false);
    }
  };

  const isTurn =
    match &&
    match.state === 'active' &&
    address &&
    match.players[match.turn] &&
    match.players[match.turn].toLowerCase() === address.toLowerCase();

  const timerText = match?.state === 'active'
    ? `${remainingSeconds.toString().padStart(2, '0')}s`
    : '—';

  const turnText = match
    ? match.state === 'active'
      ? (isTurn ? 'Your turn to roll' : `Waiting on ${shortAddress(match.players[match.turn])}`)
      : match.state === 'waiting'
        ? 'Waiting for opponent to join'
        : match.state === 'completed'
          ? 'Match completed'
          : 'Match idle'
    : 'No active match';

  const queueCountsText = queueStats
    ? `${queueStats.exact} exact · ${queueStats.lower} within -0.5 · ${queueStats.upper} within +0.5`
    : 'Loading...';
  const showQueueCard = !match;
  const showInviteCreationCard = !match;
  const showFriendWaitingCard = match?.state === 'waiting';
  const payoutFormatted = formatEther(payoutAmount);
  const feeFormatted = formatEther(fee);

  useEffect(() => {
    if (match) {
      console.log('[1v1] match update', match);
    }
  }, [match]);

  useEffect(() => {
    setExtraRollToast(null);
    clearExtraRollEvent();
  }, [matchId, clearExtraRollEvent]);

  useEffect(() => {
    if (!extraRollEvent) return;
    if (!matchId || matchId === 0n || extraRollEvent.matchId !== matchId) return;

    const isSelf = address && extraRollEvent.player.toLowerCase() === address.toLowerCase();
    const message = isSelf
      ? `You rolled a 6! Extra turn unlocked (chain ${extraRollEvent.chainCount}).`
      : `${shortAddress(extraRollEvent.player)} rolled a 6 and gets another roll!`;

    setExtraRollToast(message);

    const timer = setTimeout(() => {
      setExtraRollToast(null);
      clearExtraRollEvent();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [extraRollEvent, matchId, address, clearExtraRollEvent]);

  useEffect(() => {
    if (!match || !matchId || matchId === 0n) {
      setAutoClaiming(false);
      setHasTriggeredClaim(false);
      setWinModalOpen(false);
      setLoseModalOpen(false);
      setWinModalDismissed(false);
      setLoseModalDismissed(false);
      return;
    }

    const winnerLower = match.winner?.toLowerCase?.();
    const meLower = address?.toLowerCase();

    if (match.state === 'completed') {
      if (winnerLower && winnerLower === meLower) {
        if (match.claimed) {
          setAutoClaiming(false);
          if (!winModalDismissed) {
            setWinModalOpen(true);
          }
        } else if (!hasTriggeredClaim) {
          setHasTriggeredClaim(true);
          setAutoClaiming(true);
          claim(matchId)
            .catch((error: any) => {
              const message = error?.shortMessage || error?.message || 'Failed to claim rewards';
              toast({
                title: 'Claim failed',
                description: message,
                variant: 'destructive',
              });
              setHasTriggeredClaim(false);
            })
            .finally(() => {
              setAutoClaiming(false);
            });
        }
      } else if (winnerLower && meLower && winnerLower !== meLower && playerIndex >= 0) {
        if (!loseModalDismissed) {
          setLoseModalOpen(true);
        }
      }
    } else {
      if (hasTriggeredClaim) {
        setHasTriggeredClaim(false);
      }
      setAutoClaiming(false);
      setWinModalOpen(false);
      setLoseModalOpen(false);
      if (winModalDismissed) {
        setWinModalDismissed(false);
      }
      if (loseModalDismissed) {
        setLoseModalDismissed(false);
      }
    }
  }, [
    match,
    matchId,
    address,
    claim,
    hasTriggeredClaim,
    toast,
    playerIndex,
    winModalDismissed,
    loseModalDismissed,
  ]);

  useEffect(() => {
    if (targetPosition === null || playerIndex < 0) return;

    const previousPosition = prevPositionRef.current;
    if (targetPosition === previousPosition) {
      return;
    }

    const direction = targetPosition > previousPosition ? 1 : -1;
    const path: number[] = [];
    for (let pos = previousPosition + direction; direction > 0 ? pos <= targetPosition : pos >= targetPosition; pos += direction) {
      path.push(pos);
    }

    if (path.length === 0) {
      prevPositionRef.current = targetPosition;
      setAnimatedPosition(targetPosition);
      return;
    }

    setIsAnimatingPath(true);
    setDoorToast(null);
    setDoorHighlight(null);

    let index = 0;
    const interval = setInterval(() => {
      setAnimatedPosition(path[index]);
      index += 1;

      if (index >= path.length) {
        clearInterval(interval);
        prevPositionRef.current = targetPosition;
        setAnimatedPosition(targetPosition);
        setIsAnimatingPath(false);

        if (lastDiceValue > 0) {
          const expectedRaw = previousPosition + lastDiceValue;
          const expected = Math.max(1, Math.min(100, expectedRaw));

          if (targetPosition > expected) {
            const jump = targetPosition - expected;
            setDoorToast(`Green door! Boosted forward ${jump} tile${jump > 1 ? 's' : ''}.`);
            setDoorHighlight({ position: targetPosition, type: 'green' });
          } else if (targetPosition < expected) {
            const drop = expected - targetPosition;
            setDoorToast(`Red door! Pulled back ${drop} tile${drop > 1 ? 's' : ''}.`);
            setDoorHighlight({ position: targetPosition, type: 'red' });
          } else {
            setDoorHighlight(null);
            setDoorToast(null);
          }
        } else {
          setDoorHighlight(null);
          setDoorToast(null);
        }
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [targetPosition, lastDiceValue, playerIndex, matchId]);

  useEffect(() => {
    if (!doorToast) return;
    const timer = setTimeout(() => setDoorToast(null), 4000);
    return () => clearTimeout(timer);
  }, [doorToast]);

  useEffect(() => {
    if (!doorHighlight) return;
    const timer = setTimeout(() => setDoorHighlight(null), 4000);
    return () => clearTimeout(timer);
  }, [doorHighlight]);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold text-white">1v1 Versus Mode</h1>
          <p className="text-white/70 mt-2">
            Race to tile 100. Exact bet matches or ±0.5 MON tolerance, 30 second turns, and auto-roll if time runs out.
          </p>
        </div>
        <Badge className="bg-accent-main/20 border border-accent-main/60 text-accent-main px-4 py-2">
          Native MON escrow
        </Badge>
      </div>

      {(showQueueCard || showInviteCreationCard || showFriendWaitingCard) ? (
        <div className={`grid gap-6 ${(Number(showQueueCard) + Number(showInviteCreationCard) + Number(showFriendWaitingCard)) > 1 ? 'lg:grid-cols-2' : ''}`}>
          {showQueueCard && (
            <Card className="bg-surface/60 border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5 text-accent-main" />
                  Quick Match Queue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs uppercase text-white/60">Bet Amount (MON)</label>
                  <Input
                    value={queueBet}
                    onChange={(e) => setQueueBet(e.target.value)}
                    className="mt-2 bg-black/30 border-white/10 text-white"
                    placeholder="1.0"
                    type="number"
                    min="1"
                    step="0.5"
                  />
                  <p className="text-xs text-white/50 mt-2">
                    Queue depth: {queueCountsText}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleJoinQueue} className="flex-1">
                    Join Queue
                  </Button>
                  <Button variant="outline" onClick={handleLeaveQueue} className="flex-1">
                    Leave Queue
                  </Button>
                </div>
                <p className="text-xs text-white/60">
                  Minimum bet 1.0 MON. Queue matching tolerates ±0.5 MON differences and refunds the excess immediately.
                </p>
              </CardContent>
            </Card>
          )}

          {showInviteCreationCard && (
            <Card className="bg-surface/60 border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Share2 className="w-5 h-5 text-accent-main" />
                  Play with a Friend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs uppercase text-white/60">Bet Amount (MON)</label>
                  <Input
                    value={friendBet}
                    onChange={(e) => setFriendBet(e.target.value)}
                    className="mt-2 bg-black/30 border-white/10 text-white"
                    placeholder="1.0"
                    type="number"
                    min="1"
                    step="0.1"
                  />
                </div>
                <Button onClick={handleCreateInvite} className="w-full">
                  Create Invite
                </Button>
              </CardContent>
            </Card>
          )}

          {showFriendWaitingCard && (
            <Card className="bg-surface/60 border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Share2 className="w-5 h-5 text-accent-main" />
                  Waiting for Opponent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/70 text-sm">
                  Share the invite link below or wait for your friend to join. The match will start as soon as both stakes are deposited.
                </p>

                {inviteLink && (
                  <div className="border border-accent-main/30 bg-accent-main/10 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-white/80">Invite link</p>
                    <div className="flex gap-2 items-center">
                      <Input value={inviteLink} readOnly className="bg-black/40 border-white/10 text-xs" />
                      <Button variant="ghost" onClick={copyInviteLink} disabled={isCopying}>
                        {isCopying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {inviteSecretParam && matchParam && (
                  <div className="border border-white/10 rounded-lg p-4 bg-black/30 space-y-3">
                    <div>
                      <label className="text-xs uppercase text-white/60">Your Stake (MON)</label>
                      <Input
                        value={joinBet}
                        onChange={(e) => setJoinBet(e.target.value)}
                        className="mt-2 bg-black/40 border-white/10 text-white"
                        type="number"
                        min="1"
                        step="0.1"
                      />
                    </div>
                    <Button onClick={handleJoinInvite} className="w-full">
                      Join Friend Match
                    </Button>
                    <p className="text-xs text-white/50">
                      You&apos;re joining match #{matchParam} using the shared secret.
                    </p>
                  </div>
                )}

                {isCreator && (
                  <Button
                    variant="outline"
                    onClick={handleCancelInvite}
                    className="w-full"
                  >
                    Cancel Invite
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="bg-surface/60 border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Match in Progress</CardTitle>
          </CardHeader>
          <CardContent className="text-white/70 space-y-3">
            <p>You&apos;re already locked into a match. Finish it before joining another queue or creating a new invite.</p>
            <p className="text-sm">Match ID: #{match?.id.toString()}</p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-surface/70 border border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Dice6 className="w-5 h-5 text-accent-main" />
            Match Status
            {match && (
              <Badge className="ml-3 bg-white/5 border border-white/20 text-white">
                {match.mode === 'queue' ? 'Queue Match' : 'Friend Match'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isMatchLoading && (
            <div className="flex items-center gap-3 text-white/70">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading match data...
            </div>
          )}

          {!isMatchLoading && !match && (
            <div className="text-white/70">
              You&apos;re not currently in a 1v1 match. Join the queue or create an invite to get started.
            </div>
          )}

          {match && (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase text-white/50">Match ID</p>
                  <p className="text-lg text-white font-semibold">#{match.id.toString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase text-white/50">Bet (each)</p>
                  <p className="text-lg text-white font-semibold">{formatEther(match.betAmount)} MON</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase text-white/50">Platform Fee</p>
                  <p className="text-lg text-white font-semibold">{match.platformFeeBps / 100}%</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[0, 1].map((index) => (
                  <div key={index} className={`rounded-xl p-4 border ${match.turn === index ? 'border-accent-main/60 bg-accent-main/10' : 'border-white/10 bg-black/20'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase text-white/50">Player {index + 1}</p>
                        <p className="text-white font-semibold text-lg">
                          {shortAddress(match.players[index])}
                        </p>
                      </div>
                      <Badge variant={match.turn === index ? 'default' : 'outline'}>
                        Tile {match.positions[index]}
                      </Badge>
                    </div>
                    <div className="mt-3 h-2 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-main to-blue-500"
                        style={{ width: `${(match.positions[index] / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-start md:items-center gap-4 rounded-xl bg-black/30 border border-white/10 p-4">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-accent-main" />
                  <span className={`text-2xl font-semibold ${getTimerStyle(remainingSeconds)}`}>
                    {timerText}
                  </span>
                </div>
                <div className="text-white/70 flex-1 min-w-[200px]">{turnText}</div>
                <div className="flex flex-wrap items-center gap-4 ml-auto">
                  <Dice
                    value={diceValue}
                    contractValue={diceValue}
                    isRolling={isRollingDice}
                    onRoll={handleRoll}
                    disabled={match.state !== 'active' || !isTurn || isRollingDice}
                    isWaitingForVRF={false}
                  />
                  <Button
                    onClick={handleAutoRoll}
                    disabled={match.state !== 'active' || remainingSeconds > 0}
                    variant="secondary"
                  >
                    Force Auto-roll
                  </Button>
                </div>
              </div>

              {extraRollToast && (
                <div className="w-full bg-accent-main/15 border border-accent-main/30 text-accent-main font-semibold text-sm rounded-xl px-4 py-2">
                  {extraRollToast}
                </div>
              )}
              {doorToast && (
                <div className="w-full bg-amber-500/15 border border-amber-400/30 text-amber-200 font-semibold text-sm rounded-xl px-4 py-2">
                  {doorToast}
                </div>
              )}

              {(match && match.state !== 'waiting') && (
                <div className="mt-6 bg-black/40 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Board</h3>
                    {isBoardLoading && (
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading board
                      </div>
                    )}
                  </div>
                  <GameBoard
                    playerPosition={playerPosition}
                    giftTiles={[]}
                    detourTrapTiles={board.detourTrapTiles}
                    shortcutGateTiles={board.shortcutGateTiles}
                    revealedTraps={[]}
                    revealedGates={[]}
                    isMoving={isAnimatingPath}
                    animatedPosition={animatedPosition}
                    peerPositions={opponentPosition ? { positions: [opponentPosition], counts: [1] } : undefined}
                    doorHighlight={doorHighlight}
                  />
                </div>
              )}

              {match.state === 'completed' && (
                <div className="rounded-2xl border-2 border-accent-main/60 bg-gradient-to-r from-accent-main/20 to-blue-500/20 p-6 text-center space-y-3">
                  <p className="text-sm uppercase tracking-wide text-white/70">Winner</p>
                  <p className="text-3xl font-heading font-bold text-white">
                    {shortAddress(match.winner)}
                  </p>
                  <p className="text-white/80">
                    Total pot: {formatEther(totalPool)} MON · Platform fee: {formatEther(fee)} MON
                  </p>
                  <p className="text-2xl font-semibold text-accent-main">
                    Payout: {formatEther(payoutAmount)} MON
                  </p>
                  <p className="text-sm text-white/70">
                    {match.claimed
                      ? 'Rewards delivered automatically.'
                      : isWinner
                        ? 'Claiming rewards...'
                        : 'Winnings are being routed to the winner.'}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isJoiningQueue} onOpenChange={() => {}}>
        <DialogContent className="bg-surface/95 border border-accent-main/20 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Setting up your match</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 text-white/70">
            <Loader2 className="w-5 h-5 animate-spin text-accent-main" />
            <p>We&apos;re pairing you with the next opponent. Hang tight!</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={autoClaiming} onOpenChange={() => {}}>
        <DialogContent className="bg-surface/95 border border-accent-main/20 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Claiming rewards</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 text-white/70">
            <Loader2 className="w-5 h-5 animate-spin text-accent-main" />
            <p>Finalizing your payout on-chain...</p>
          </div>
        </DialogContent>
      </Dialog>

      <OneVOneResultModal
        open={winModalOpen}
        onClose={() => {
          setWinModalOpen(false);
          setWinModalDismissed(true);
        }}
        variant="win"
        payoutFormatted={payoutFormatted}
        feeFormatted={feeFormatted}
        opponentAddress={opponentShort}
      />
      <OneVOneResultModal
        open={loseModalOpen}
        onClose={() => {
          setLoseModalOpen(false);
          setLoseModalDismissed(true);
        }}
        variant="lose"
        opponentAddress={opponentShort}
      />
    </div>
  );
};

export default OneVOne;
