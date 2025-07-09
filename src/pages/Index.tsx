import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useBlockchainGameReducer } from '@/hooks/useBlockchainGameReducer';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSplashAnimations } from '@/hooks/useSplashAnimations';
import GameBoard from '@/components/GameBoard';
import Dice from '@/components/Dice';
import ScoreBoard from '@/components/ScoreBoard';
import VictoryModal from '@/components/VictoryModal';
import ContractUserProfile from '@/components/ContractUserProfile';
import NewGameConfirmation from '@/components/NewGameConfirmation';
import SplashAnimation from '@/components/SplashAnimation';
import GameRulesModal from '@/components/GameRulesModal';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Wallet, RefreshCw, HelpCircle, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useBalance } from 'wagmi';
import { monadTestnet } from '@/types/monadTestnet';
import { useContract } from '@/hooks/useContract';
import { useWalletBalancesAndWithdraw } from '@/hooks/useWalletBalancesAndWithdraw';

// Helper components defined outside Index to prevent re-mounting on every render
const BalanceWarning = () => (
  <motion.div
    className="bg-danger/20 border border-danger/40 rounded-lg p-4 mb-6 text-center"
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center justify-center space-x-2">
      <Wallet className="w-5 h-5 text-danger" />
      <span className="text-danger">
        No balance detected. Please add MON tokens to your wallet to play the game.
      </span>
    </div>
  </motion.div>
);

const VRFWaitingIndicator = () => (
  <motion.div
    className="bg-warn/20 border border-warn/40 rounded-lg p-4 mb-6 text-center"
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center justify-center space-x-2">
      <RefreshCw className="w-5 h-5 animate-spin text-warn" />
      <span className="text-warn">
        Waiting for Chainlink VRF result... This may take a few moments.
      </span>
    </div>
  </motion.div>
);

const DiceSection = ({ gameState, isWaitingForVRF, rollDice, isDiceDisabled, contractState, hasNoBalance }) => (
  <motion.div
    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-600"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.2 }}
  >
    <Dice
      value={gameState.diceValue}
      isRolling={gameState.isRolling || isWaitingForVRF}
      onRoll={rollDice}
      disabled={isDiceDisabled}
      contractValue={contractState?.diceValue}
      isWaitingForVRF={isWaitingForVRF}
    />
    {/* {isWaitingForVRF && (
      <p className="text-center text-yellow-400 text-sm mt-2">
        ⏳ Waiting for blockchain randomness...
      </p>
    )} */}
    {hasNoBalance && (
      <p className="text-center text-red-400 text-sm mt-2">
        ⚠️ Add MON tokens to play
      </p>
    )}
  </motion.div>
);

const NewGameButton = ({ handleNewGameClick, isNewGameDisabled, isStartingGame }) => (
  <motion.button
    onClick={handleNewGameClick}
    className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-lg shadow-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
    whileHover={{ scale: isNewGameDisabled ? 1 : 1.02 }}
    whileTap={{ scale: isNewGameDisabled ? 1 : 0.98 }}
    disabled={isNewGameDisabled}
  >
    {isStartingGame ? 'Starting Game...' : 'New Game'}
  </motion.button>
);

const Index = () => {
  const navigate = useNavigate();
  const [gameState, gameActions, contractInfo] = useBlockchainGameReducer();
  const { playSound } = useSoundEffects(gameState.isSoundMuted);
  const { splash, hideSplash, triggerGiftSplash, triggerDetourSplash, triggerShortcutSplash } = useSplashAnimations();
  const [showNewGameConfirmation, setShowNewGameConfirmation] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(true);
  const [showBoardLoader, setShowBoardLoader] = useState(false);
  const [showGameRules, setShowGameRules] = useState(false);

  const { 
    isConnected, 
    contractState, 
    isLoading, 
    isLoadingStartGame, 
    isWaitingForVRF, 
    playerRank, 
    CONTRACT_ADDRESS,
  } = contractInfo;

  // Get claimRewards and claimRewardsError directly from useContract
  const { claimRewards, claimRewardsError } = useContract();
  const { embeddedWalletObj, setActiveWallet, address: embeddedWalletAddress } = useWalletBalancesAndWithdraw();
  // Get balance for validation
  const { data: balance } = useBalance({
    address: embeddedWalletAddress,
    chainId: monadTestnet.id,
  });

  // Track previous player position for overshoot detection
  const prevPlayerPositionRef = useRef(gameState.playerPosition);

  // Show VictoryModal only when gameStatus transitions from not-won to 'won'
  const prevGameStatusRef = useRef(gameState.gameStatus);
  useEffect(() => {
    if (prevGameStatusRef.current !== 'won' && gameState.gameStatus === 'won') {
      setShowVictoryModal(true);
    }
    prevGameStatusRef.current = gameState.gameStatus;
  }, [gameState.gameStatus]);

  // Play start sound on mount
  useEffect(() => {
    playSound('start');
  }, [playSound]);

  // Handle tile interactions for splash animations and overshoot warning
  useEffect(() => {
    if (!contractState) return;
    const prevPosition = prevPlayerPositionRef.current;
    const newPosition = contractState.position;
    const diceValue = contractState.diceValue;
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
    if (!contractState.hasFinished) {
      prevPlayerPositionRef.current = newPosition;
    }
  }, [contractState?.position, contractState?.diceValue, contractState?.hasFinished, gameState.giftTiles, gameState.detourTrapTiles, gameState.shortcutGateTiles, triggerGiftSplash, triggerDetourSplash, triggerShortcutSplash, playSound, toast]);

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

  // Handle dice roll
  const rollDice = useCallback(async () => {
    if (isOperationInProgress) return;
    
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to play on-chain",
        variant: "destructive",
      });
      return;
    }

    if (!contractState?.boardGenerated) {
      toast({
        title: "Game Not Started",
        description: "Please start a new game first",
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

    await ensureEmbeddedWalletActive();
    await gameActions.rollDice();
    playSound('diceRoll');
  }, [isOperationInProgress, isConnected, contractState?.boardGenerated, hasNoBalance, gameActions, playSound, ensureEmbeddedWalletActive]);

  // Handle new game
  const handleNewGameClick = async () => {
    if (isLoading || gameState.isRolling || isWaitingForVRF) return;
    
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
      await restartGame();
    }
  };

  // Restart game
  const restartGame = async () => {
    setShowNewGameConfirmation(false);
    setShowVictoryModal(false);
    setShowBoardLoader(true);
    try {
      await ensureEmbeddedWalletActive();
      await gameActions.startGame();
      playSound('start');
      toast({
        title: "New Game Started!",
        description: "Your game board is being generated on-chain. Please wait...",
        variant: "default",
      });
    } catch (error) {
      setShowBoardLoader(false);
      setShowVictoryModal(true);
      console.error('Error restarting game:', error);
    }
  };

  const toggleSound = () => {
    gameActions.dispatch({ type: 'TOGGLE_SOUND' });
  };

  // Disable conditions
  const isDiceDisabled = isOperationInProgress ||
           gameState.gameStatus === 'won' || 
           !contractState?.boardGenerated ||
           hasNoBalance;

  const isNewGameDisabled = isLoading || gameState.isRolling || isWaitingForVRF || hasNoBalance;

  // Handle manual claim rewards
  const handleClaimRewards = async () => {
    try {
      await ensureEmbeddedWalletActive();
      await claimRewards();
    } catch (error) {
      console.error('Error claiming rewards:', error);
    }
  };

  // Hide loader and show modal when new game is confirmed
  useEffect(() => {
    if (isLoadingStartGame === false && showBoardLoader) {
      setShowBoardLoader(false);
      setShowVictoryModal(true);
    }
    if (gameState.gameStatus !== 'won' && showVictoryModal) {
      setShowVictoryModal(false);
    }
  }, [isLoadingStartGame, gameState.gameStatus]);

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-bg-primary p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[60vh]">
            <motion.div
              className="card-surface text-center max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Wallet className="w-16 h-16 text-accent-main mx-auto mb-4" />
              <h2 className="text-2xl font-heading font-bold text-text-high mb-4">Connect Your Wallet</h2>
              <p className="text-text-low mb-6">
                To play NUNU Games on-chain, you need to connect your wallet. 
                Your progress will be stored on the blockchain and you'll earn real NUNU tokens!
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Show game start prompt if game not started
  if (contractState && !contractState.boardGenerated) {
    return (
      <div className="min-h-screen bg-bg-primary p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[60vh]">
            <motion.div
              className="card-surface text-center max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-heading font-bold text-text-high mb-4">Start Your Game</h2>
              <p className="text-text-low mb-6">
                Ready to begin your journey to tile 100? Your game board will be generated on-chain 
                with unique gifts and challenges using Chainlink VRF for randomness.
              </p>
              {hasNoBalance && (
                <div className="bg-danger/20 border border-danger/40 rounded-lg p-3 mb-4">
                  <p className="text-danger text-sm">
                    ⚠️ You need MON tokens to pay for transaction fees. Please add funds to your wallet.
                  </p>
                </div>
              )}
              <Button
                onClick={restartGame}
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
    <div className="min-h-screen bg-bg-primary p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex justify-between items-center mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center flex-1">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-text-high mb-2">🎲 NUNU Games</h1>
            <p className="text-lg sm:text-xl text-text-low">
              Roll the dice, collect NUNU tokens, and reach tile 100 on-chain!
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGameRules(true)}
                className="border-accent-main text-accent-main hover:bg-accent-main/10 hover:text-accent-main focus:text-accent-main"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Game Rules
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/game/leaderboard')}
                className="border-success text-success hover:bg-success/10 hover:text-success focus:text-success"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
            </div>
            {contractState && (
              <div className="text-sm text-accent-main mt-2 space-y-1">
                {playerRank > 0 && (
                  <p className="text-success">🏅 Your Rank: #{playerRank}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="ml-4">
            <ContractUserProfile />
          </div>
        </motion.div>

        {/* Balance Warning */}
        {hasNoBalance && (
          <motion.div
            className="bg-danger/20 border border-danger/40 rounded-lg p-4 mb-6 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center space-x-2">
              <Wallet className="w-5 h-5 text-danger" />
              <span className="text-danger">
                No balance detected. Please add MON tokens to your wallet to play the game.
              </span>
            </div>
          </motion.div>
        )}

        {/* VRF Waiting Indicator */}
        {isWaitingForVRF && (
          <motion.div
            className="bg-warn/20 border border-warn/40 rounded-lg p-4 mb-6 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin text-warn" />
              <span className="text-warn">
                Waiting for Chainlink VRF result... This may take a few moments.
              </span>
            </div>
          </motion.div>
        )}

        {/* Mobile Layout */}
        <div className="block lg:hidden space-y-6">
          <ScoreBoard
            score={gameState.score}
            position={gameState.playerPosition}
            turnsPlayed={gameState.turnsPlayed}
            giftsCollected={gameState.giftsCollected}
            detourTrapsTriggered={gameState.detourTrapsTriggered}
            shortcutGatesTriggered={gameState.shortcutGatesTriggered}
            isSoundMuted={gameState.isSoundMuted}
            onToggleSound={toggleSound}
            diceRolls={contractState?.diceRolls}
            shortcuts={contractState?.shortcuts}
            detours={contractState?.detours}
          />

          <GameBoard
            playerPosition={gameState.playerPosition}
            giftTiles={gameState.giftTiles}
            detourTrapTiles={gameState.detourTrapTiles}
            shortcutGateTiles={gameState.shortcutGateTiles}
            revealedTraps={gameState.revealedTraps}
            revealedGates={gameState.revealedGates}
            isMoving={gameState.isMoving}
          />

          <div className="space-y-4">
            <DiceSection 
              gameState={gameState}
              isWaitingForVRF={isWaitingForVRF}
              rollDice={rollDice}
              isDiceDisabled={isDiceDisabled}
              contractState={contractState}
              hasNoBalance={hasNoBalance}
            />
            <NewGameButton 
              handleNewGameClick={handleNewGameClick}
              isNewGameDisabled={isNewGameDisabled}
              isStartingGame={isLoadingStartGame}
            />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <GameBoard
              playerPosition={gameState.playerPosition}
              giftTiles={gameState.giftTiles}
              detourTrapTiles={gameState.detourTrapTiles}
              shortcutGateTiles={gameState.shortcutGateTiles}
              revealedTraps={gameState.revealedTraps}
              revealedGates={gameState.revealedGates}
              isMoving={gameState.isMoving}
            />
          </div>

          <div className="lg:col-span-1 space-y-3">
            <ScoreBoard
              score={gameState.score}
              position={gameState.playerPosition}
              turnsPlayed={gameState.turnsPlayed}
              giftsCollected={gameState.giftsCollected}
              detourTrapsTriggered={gameState.detourTrapsTriggered}
              shortcutGatesTriggered={gameState.shortcutGatesTriggered}
              isSoundMuted={gameState.isSoundMuted}
              onToggleSound={toggleSound}
              diceRolls={contractState?.diceRolls}
              shortcuts={contractState?.shortcuts}
              detours={contractState?.detours}
            />

            <DiceSection 
              gameState={gameState}
              isWaitingForVRF={isWaitingForVRF}
              rollDice={rollDice}
              isDiceDisabled={isDiceDisabled}
              contractState={contractState}
              hasNoBalance={hasNoBalance}
            />
            <NewGameButton 
              handleNewGameClick={handleNewGameClick}
              isNewGameDisabled={isNewGameDisabled}
              isStartingGame={isLoadingStartGame}
            />
          </div>
        </div>

        {/* Splash Animation */}
        <SplashAnimation
          {...splash}
          onComplete={hideSplash}
        />

        {showBoardLoader && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-bg-primary/80 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <RefreshCw className="w-10 h-10 text-accent-main animate-spin mb-4" />
              <span className="text-text-high text-lg font-semibold">Generating new game board...</span>
            </div>
          </div>
        )}

        <VictoryModal
          isOpen={showVictoryModal && gameState.gameStatus === 'won'}
          score={gameState.score}
          turnsPlayed={gameState.turnsPlayed}
          giftsCollected={contractState?.giftsCollected ?? 0}
          detourTrapsTriggered={gameState.detourTrapsTriggered}
          shortcutGatesTriggered={gameState.shortcutGatesTriggered}
          gameScore={gameState.score}
          nunuCoins={contractState?.nunuEarned || 0}
          onRestart={restartGame}
          onClaimRewards={handleClaimRewards}
          diceRolls={contractState?.diceRolls}
          shortcuts={contractState?.shortcuts}
          detours={contractState?.detours}
          isRestarting={showBoardLoader}
          isClaimRewardsPending={contractInfo.isClaimRewardsPending}
          claimRewardsError={claimRewardsError}
        />

        <NewGameConfirmation
          isOpen={showNewGameConfirmation}
          onConfirm={restartGame}
          onCancel={() => setShowNewGameConfirmation(false)}
        />

        <GameRulesModal
          isOpen={showGameRules}
          onClose={() => setShowGameRules(false)}
        />
      </div>
    </div>
  );
};

export default Index;
