import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameReducer } from '@/hooks/useGameReducer';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSplashAnimations } from '@/hooks/useSplashAnimations';
import GameBoard from '@/components/GameBoard';
import Dice from '@/components/Dice';
import ScoreBoard from '@/components/ScoreBoard';
import VictoryModal from '@/components/VictoryModal';
import NewGameConfirmation from '@/components/NewGameConfirmation';
import SplashAnimation from '@/components/SplashAnimation';
import GameRulesModal from '@/components/GameRulesModal';
import GameActivities from '@/components/GameActivities';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Wallet, RefreshCw, HelpCircle, Trophy } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccount, useBalance } from 'wagmi';
import { monadTestnet } from '@/types/monadTestnet';
import { useWalletBalancesAndWithdraw } from '@/hooks/useWalletBalancesAndWithdraw';
import { NATIVE_TOKEN, REWARD_TOKEN } from '@/configs';

// Helper components defined outside Index to prevent re-mounting on every render
const BalanceWarning = () => (
  <motion.div
    className="bg-negative/20 border border-negative/40 rounded-lg p-4 mb-6 text-center"
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center justify-center space-x-2">
      <Wallet className="w-5 h-5 text-negative" />
      <span className="text-negative">
        No balance detected. Please add MON tokens to your wallet to play the game.
      </span>
    </div>
  </motion.div>
);

const DiceSection = ({ gameState, isWaitingForVRF, rollDice, isDiceDisabled, contractValue, hasNoBalance, rollFee = null }) => (
  <motion.div
    className="panel flex flex-col items-center justify-center p-3 sm:p-4 text-center h-full"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.2 }}
  >
    <div className="flex-1 flex items-center justify-center">
      <Dice
        value={contractValue}
        isRolling={gameState.isRolling || isWaitingForVRF}
        onRoll={rollDice}
        disabled={isDiceDisabled}
        contractValue={contractValue}
        isWaitingForVRF={isWaitingForVRF}
        rollFee={rollFee}
      />
    </div>
    {hasNoBalance && (
      <p className="text-center text-negative text-xs sm:text-sm mt-2">
        ⚠️ Add MON tokens to play
      </p>
    )}
  </motion.div>
);

const NewGameButton = ({ handleNewGameClick, isNewGameDisabled, isStartingGame }) => (
  <motion.button
    onClick={handleNewGameClick}
    className="w-full py-3 bg-gradient-to-r from-accent-main to-blue-600 text-white font-bold rounded-lg shadow-lg hover:from-accent-main/90 hover:to-blue-600/90 transition-all duration-200 disabled:opacity-50"
    whileHover={{ scale: isNewGameDisabled ? 1 : 1.02 }}
    whileTap={{ scale: isNewGameDisabled ? 1 : 0.98 }}
    disabled={isNewGameDisabled}
  >
    {isStartingGame ? 'Starting Game...' : 'New Game'}
  </motion.button>
);

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Read mode from location.state (from homepage), default to 'single'
  const mode = location.state?.mode === 'multi' ? 'multi' : 'single';
  const { splash, hideSplash, triggerGiftSplash, triggerDetourSplash, triggerShortcutSplash, triggerRugSplash } = useSplashAnimations();
  const [gameState, gameActions, contractInfo] = useGameReducer(mode, triggerRugSplash);
  const { playSound } = useSoundEffects(gameState.isSoundMuted);
  const [showNewGameConfirmation, setShowNewGameConfirmation] = useState(false);
  const [showBoardLoader, setShowBoardLoader] = useState(false);
  const [showGameRules, setShowGameRules] = useState(false);

  const { 
    isLoading, 
    isLoadingStartGame, 
    isLoadingBoard,
    isWaitingForVRF, 
    playerRank, 
    CONTRACT_ADDRESS,
    isPlayerStatusLoaded,
    isPlayerStatusError,
  } = contractInfo;

  const { rollDice, startGame, claimRewards, joinGame, resetGame } = gameActions;
  const { claimRewardsError, claimRewardsSuccess, canRestart } = contractInfo;
  const { embeddedWalletObj, setActiveWallet, address: embeddedWalletAddress, ready, authenticated } = useWalletBalancesAndWithdraw();
  
  // Check if wallet is connected
  const isConnected = ready && authenticated;
  
  // Get balance for validation
  const { data: balance } = useBalance({
    address: embeddedWalletAddress as `0x${string}` | undefined,
    chainId: monadTestnet.id,
  });

  // Track previous player position for overshoot detection
  const prevPlayerPositionRef = useRef(gameState.playerPosition);

  // Show VictoryModal directly based on contract state for reliability.
  const showVictoryModal = contractInfo.gameState?.hasFinished ?? false;
  
  useEffect(() => {
    if (showVictoryModal) {
      console.log('🏆 [Index.tsx] Victory condition met (hasFinished is true). Showing VictoryModal.');
    }
  }, [showVictoryModal]);

  // Play start sound on mount
  useEffect(() => {
    playSound('start');
  }, [playSound]);

  // Handle tile interactions for splash animations and overshoot warning
  useEffect(() => {
    if (!contractInfo.gameState) return;
    const prevPosition = prevPlayerPositionRef.current;
    const newPosition = contractInfo.gameState.position;
    const diceValue = contractInfo.gameState.diceValue;
    const needed = 100 - prevPosition;
    // Only show warning if position did not change and diceValue overshoots
    if (
      diceValue > 0 &&
      prevPosition < 100 &&
      diceValue > needed &&
      newPosition === prevPosition
    ) {
      toast({
        title: 'Dice Overshoot',
        description: `⚠️ You need exactly ${needed}`,
        variant: 'default',
      });
    }

    const expectedPosition = prevPosition + (diceValue || 1);
    // Only trigger gift animation if the player has actually rolled the dice (not on initial game load)
    if (prevPosition !== newPosition && diceValue > 0) {
      const giftTile = gameState.giftTiles.find(tile => tile.index === expectedPosition);
      if (giftTile) {
        triggerGiftSplash(giftTile.points);
        playSound('gift');
      }
    }
    // Check for detour traps - triggered when actual position is less than expected
    const detourTile = gameState.detourTrapTiles.find(tile => tile.index === expectedPosition);
    if (detourTile && newPosition < expectedPosition) {
      triggerDetourSplash(Math.abs(newPosition - expectedPosition));
      playSound('detourTrap');
    }
    // Check for shortcut gates - triggered when actual position is more than expected
    const shortcutTile = gameState.shortcutGateTiles.find(tile => tile.index === expectedPosition);
    if (shortcutTile && newPosition > expectedPosition) {
      triggerShortcutSplash(newPosition - expectedPosition);
      playSound('gift');
    }
    // Only update previous position if game is not finished
    if (!contractInfo.gameState.hasFinished) {
      prevPlayerPositionRef.current = newPosition;
    }
  }, [contractInfo.gameState, gameState.giftTiles, gameState.detourTrapTiles, gameState.shortcutGateTiles, playSound, triggerDetourSplash, triggerGiftSplash, triggerShortcutSplash]);

  // Stop dice animation as soon as contract diceValue is received and isRolling is true
  useEffect(() => {
    if (contractInfo.gameState && contractInfo.gameState.diceValue > 0 && gameState.isRolling) {
      gameActions.dispatch({ type: 'STOP_DICE_ANIMATION', payload: contractInfo.gameState.diceValue });
    }
  }, [contractInfo.gameState, gameState.isRolling, gameActions.dispatch]);

  // Add after gameState/gameActions/contractInfo are defined
  useEffect(() => {
    if (contractInfo.gameState?.position === 100 && contractInfo.gameState?.hasFinished) {
      contractInfo.refetchPlayerRank();
    }
  }, [contractInfo.gameState?.position, contractInfo.gameState?.hasFinished, contractInfo]);

  // Helper to ensure embedded wallet is active before game actions
  const ensureEmbeddedWalletActive = async () => {
    if (embeddedWalletObj && embeddedWalletAddress?.toLowerCase() !== embeddedWalletObj.address.toLowerCase()) {
      await setActiveWallet(embeddedWalletObj);
      // Wait for wallet switch
      await new Promise<void>((resolve) => {
        const check = () => {
          const selected = typeof window !== 'undefined' && window.ethereum && typeof window.ethereum.selectedAddress === 'string'
            ? window.ethereum.selectedAddress.toLowerCase()
            : undefined;
          if (
            (selected === embeddedWalletObj.address.toLowerCase()) ||
            (embeddedWalletAddress?.toLowerCase() === embeddedWalletObj.address.toLowerCase())
          ) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    }
  };

  // Validation helpers
  const hasNoBalance = balance && balance.value === 0n;
  const isOperationInProgress = gameState.isRolling || isLoading || isWaitingForVRF;

  // Disable conditions
  const isDiceDisabled = gameState.isRolling || isWaitingForVRF || !contractInfo.gameState?.boardGenerated || isLoadingBoard || hasNoBalance || contractInfo.gameState?.hasFinished;
  const isNewGameDisabled = gameState.isRolling || isWaitingForVRF || isLoadingBoard || hasNoBalance;

  // Handle new game (match old code: use only reducer/UI state)
  const handleNewGameClick = async () => {
    if (isLoading || isLoadingBoard || gameState.isRolling || isWaitingForVRF) return;
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to start a new game",
        variant: "destructive",
      });
      return;
    }
    if (hasNoBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You need MON tokens to pay for transaction fees. Please add funds to your wallet.",
        variant: "destructive",
      });
      return;
    }
    if (gameState.diceRolled && gameState.gameStatus === 'playing') {
      setShowNewGameConfirmation(true);
    } else {
      await ensureEmbeddedWalletActive();
      await startGame();
    }
  };

  // Restart game
  const restartGame = async () => {
    setShowNewGameConfirmation(false);
    setShowBoardLoader(true);

    if (mode === 'single') {
      try {
        await ensureEmbeddedWalletActive();
        await startGame();
        playSound('start');
        toast({
          title: "New Game Started!",
          description: "Your game board is being generated on-chain. Please wait...",
          variant: "default",
        });
      } catch (error) {
        console.error('Error restarting single player game:', error);
      } finally {
        setShowBoardLoader(false);
      }
    } else {
      // For multi-player, rewards have already been claimed when canRestart is true
      try {
        playSound('start');
        
        toast({
          title: "Joining New Game",
          description: "Get ready to play!",
          variant: "default",
        });
        
        // Since rewards are already claimed, we can directly join a new game
        await joinGame();
        
        console.log('[Index.tsx] Successfully joined new multiplayer game');
      } catch (error) {
        console.error('Error during multiplayer restart process:', error);
        // Error will be shown via the handleContractError toast
      } finally {
        setShowBoardLoader(false);
      }
    }
  };

  const toggleSound = () => {
    gameActions.dispatch({ type: 'TOGGLE_SOUND' });
  };

  // Handle manual claim rewards
  const handleClaimRewards = async () => {
    try {
      await ensureEmbeddedWalletActive();
      await claimRewards();
    } catch (error) {
      console.error('Error claiming rewards:', error);
    }
  };

  // Hide loader when new game is confirmed
  useEffect(() => {
    if (isLoadingStartGame === false && isLoadingBoard === false && showBoardLoader) {
      setShowBoardLoader(false);
    }
  }, [isLoadingStartGame, isLoadingBoard]);

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-bg-primary p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[60vh]">
            <motion.div
              className="panel text-center max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Wallet className="w-16 h-16 text-accent-main mx-auto mb-4" />
              <h2 className="text-2xl font-heading font-bold text-white mb-4">Connect Your Wallet</h2>
              <p className="text-white/70 mb-6">
                To play RUGGROLL on-chain, you need to connect your wallet. 
                Your progress will be stored on the blockchain and you'll earn real ${REWARD_TOKEN.symbol} tokens!
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Show a loading spinner while we check the player's status for the first time.
  if (!isPlayerStatusLoaded && !isPlayerStatusError) {
    return (
      <div className="min-h-screen bg-bg-primary p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[60vh]">
            <RefreshCw className="w-10 h-10 text-accent-main animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Check if player is not in a game
  const isNotInGame = isPlayerStatusError && contractInfo.playerStatusError?.message.includes("Player not in a game");

  // Show loading while gameState is being fetched (prevents flash of Join/Start banner)
  if (!contractInfo.gameState && !showVictoryModal && !isNotInGame) {
    return (
      <div className="min-h-screen bg-bg-primary p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[60vh]">
            <RefreshCw className="w-10 h-10 text-accent-main animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Show game start prompt if player is not in a game.
  if (isNotInGame) {
    return (
      <div className="min-h-screen bg-bg-primary p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[60vh]">
            <motion.div
              className="panel text-center max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-heading font-bold text-white mb-4">
                {mode === 'multi' ? 'Join Global Game' : 'Start Your Game'}
              </h2>
              <p className="text-white/70 mb-6">
                {mode === 'multi' 
                  ? "Join the global multiplayer game. The board is already running!"
                  : "Ready to begin your journey to tile 100? Your game board will be generated on-chain with unique gifts and challenges."
                }
              </p>
              {hasNoBalance && (
                <div className="bg-negative/20 border border-negative/40 rounded-lg p-3 mb-4">
                  <p className="text-negative text-sm">
                    ⚠️ You need MON tokens to pay for transaction fees. Please add funds to your wallet.
                  </p>
                </div>
              )}
              {mode === 'single' && (
                <Button
                  onClick={handleNewGameClick}
                  className="btn-primary w-full py-3 rounded-lg shadow-lg"
                  disabled={isLoadingStartGame || hasNoBalance}
                >
                  {isLoadingStartGame ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Starting Game...
                    </>
                  ) : (
                    'Start New Game'
                  )}
                </Button>
              )}
              {mode === 'multi' && (
                <>
                  <div className="text-center mb-4">
                    <p className="text-white/70 text-sm mb-2">Entry Fee</p>
                    <p className="text-accent-main font-bold text-lg">
                      {contractInfo.joinGameFee ? `${(parseInt(contractInfo.joinGameFee) / 1e18)} ${NATIVE_TOKEN.symbol}` : 'Loading...'}
                    </p>
                  </div>
                  <Button
                    onClick={joinGame}
                    className="btn-primary w-full py-3 rounded-lg shadow-lg"
                    disabled={isLoading || isLoadingBoard || hasNoBalance}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Joining Game...
                      </>
                    ) : isLoadingBoard ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Loading Board...
                      </>
                    ) : (
                      'Join Game'
                    )}
                  </Button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    );
  }
  
  // This screen is intentionally removed for multiplayer as the board is generated on join.
  if (mode === 'single' && contractInfo.gameState && !contractInfo.gameState.boardGenerated) {
    return (
      <div className="min-h-screen bg-bg-primary p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[60vh]">
            <motion.div
              className="panel text-center max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-heading font-bold text-white mb-4">
                Start Your Game
              </h2>
              <p className="text-white/70 mb-6">
                Ready to begin your journey to tile 100? Your game board will be generated on-chain with unique gifts and challenges.
              </p>
              {hasNoBalance && (
                <div className="bg-negative/20 border border-negative/40 rounded-lg p-3 mb-4">
                  <p className="text-negative text-sm">
                    ⚠️ You need MON tokens to pay for transaction fees. Please add funds to your wallet.
                  </p>
                </div>
              )}
              <Button
                onClick={handleNewGameClick}
                className="btn-primary w-full py-3 rounded-lg shadow-lg"
                disabled={isLoadingStartGame || hasNoBalance}
              >
                {isLoadingStartGame ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Starting Game...
                  </>
                ) : (
                  'Start New Game'
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Compact Professional Header */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center sm:text-left mb-3 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-white mb-1">🎲 RUGGROLL</h1>
            <p className="text-sm sm:text-base text-white/70">
              Roll the dice to collect ${REWARD_TOKEN.symbol} tokens and race to 100!
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGameRules(true)}
              className="border-accent-main text-accent-main hover:bg-accent-main/10 text-xs sm:text-sm"
            >
              <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Rules
            </Button>
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/game/leaderboard')}
              className="border-positive text-positive hover:bg-positive/10 text-xs sm:text-sm"
            >
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Leaderboard
            </Button> */}
            {playerRank > 0 && (
              <div className="text-xs sm:text-sm text-positive font-semibold bg-positive/10 px-2 py-1 rounded">
                🏅 #{playerRank}
              </div>
            )}
          </div>
        </motion.div>

        {/* Balance Warning */}
        {hasNoBalance && <BalanceWarning />}

        {/* Main Game Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-6">
          {/* Game Board */}
          <div className="lg:col-span-3 relative">
            <GameBoard
              playerPosition={contractInfo.gameState?.position ?? gameState.playerPosition}
              giftTiles={gameState.giftTiles}
              detourTrapTiles={gameState.detourTrapTiles}
              shortcutGateTiles={gameState.shortcutGateTiles}
              revealedTraps={gameState.revealedTraps}
              revealedGates={gameState.revealedGates}
              isMoving={gameState.isMoving}
              animatedPosition={gameState.animatedPosition}
              peerPositions={contractInfo.peerPositions}
            />
            <SplashAnimation {...splash} onComplete={hideSplash} />
          </div>

          {/* Controls Section */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="flex-1 flex flex-col gap-4">
              <DiceSection 
                gameState={gameState}
                isWaitingForVRF={isWaitingForVRF}
                rollDice={rollDice}
                isDiceDisabled={isDiceDisabled}
                contractValue={contractInfo.gameState?.diceValue}
                hasNoBalance={hasNoBalance}
                rollFee={contractInfo.rollFee}
              />

              <ScoreBoard
                score={contractInfo.gameState?.gameScore ?? gameState.score}
                position={contractInfo.gameState?.position ?? gameState.playerPosition}
                turnsPlayed={gameState.turnsPlayed}
                giftsCollected={contractInfo.gameState?.giftsCollected ?? 0}
                detourTrapsTriggered={gameState.detourTrapsTriggered}
                shortcutGatesTriggered={gameState.shortcutGatesTriggered}
                isSoundMuted={gameState.isSoundMuted}
                onToggleSound={toggleSound}
                diceRolls={contractInfo.gameState?.diceRolls}
                shortcuts={contractInfo.gameState?.shortcuts}
                detours={contractInfo.gameState?.detours}
                peers={contractInfo.gameState?.sameDicePeers}
                mode={mode}
                activePlayers={contractInfo.gameStats?.gameActivePlayers}
                joinGameFee={contractInfo.joinGameFee}
                peerPositions={contractInfo.peerPositions}
              />

              {/* Game Activities - Only for multiplayer */}
              {mode === 'multi' && (
                <GameActivities activities={contractInfo.gameActivities || []} compact={true} />
              )}

              {mode === 'single' && (
                <NewGameButton 
                  handleNewGameClick={handleNewGameClick}
                  isNewGameDisabled={isNewGameDisabled}
                  isStartingGame={isLoadingStartGame}
                />
              )}
            </div>
          </div>
        </div>

        {showBoardLoader && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-bg-primary/80 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <RefreshCw className="w-10 h-10 text-accent-main animate-spin mb-4" />
              <span className="text-white text-lg font-semibold">Generating new game board...</span>
            </div>
          </div>
        )}

        {/* Modals */}
        <VictoryModal
          isOpen={showVictoryModal}
          score={gameState.score}
          turnsPlayed={gameState.turnsPlayed}
          giftsCollected={contractInfo.gameState?.giftsCollected ?? 0}
          detourTrapsTriggered={gameState.detourTrapsTriggered}
          shortcutGatesTriggered={gameState.shortcutGatesTriggered}
          gameScore={contractInfo.gameState?.gameScore ?? 0}
          nunuCoins={contractInfo.gameState?.nunuEarned || 0}
          ruggedCount={contractInfo.playerStats?.ruggedCount}
          totalRewardWon={contractInfo.playerStats?.totalRewardWon}
          gameFinishBonus={contractInfo.gameFinishBonus}
          onRestart={restartGame}
          onClaimRewards={handleClaimRewards}
          diceRolls={contractInfo.gameState?.diceRolls}
          shortcuts={contractInfo.gameState?.shortcuts}
          detours={contractInfo.gameState?.detours}
          isRestarting={isLoadingStartGame || isLoadingBoard || showBoardLoader}
          isClaimRewardsPending={contractInfo.isClaimRewardsPending}
          claimRewardsError={contractInfo.claimRewardsError}
          claimRewardsSuccess={contractInfo.claimRewardsSuccess}
          onClose={() => { /* Victory modal is now controlled by gameState */ }}
          canRestart={canRestart}
        />

        <NewGameConfirmation
          isOpen={showNewGameConfirmation}
          onConfirm={restartGame}
          onCancel={() => setShowNewGameConfirmation(false)}
        />

        <GameRulesModal
          isOpen={showGameRules}
          onClose={() => setShowGameRules(false)}
          mode={mode}
          gameFinishBonus={contractInfo.gameFinishBonus}
          rollFee={contractInfo.rollFee}
        />
      </div>
    </div>
  );
};

export default Index;
