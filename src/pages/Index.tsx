import { useEffect, useState } from 'react';
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
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Wallet, RefreshCw } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { monadTestnet } from '@/types/monadTestnet';

// Helper components defined outside Index to prevent re-mounting on every render
const BalanceWarning = () => (
  <motion.div
    className="bg-red-600/20 border border-red-600/40 rounded-lg p-4 mb-6 text-center"
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center justify-center space-x-2">
      <Wallet className="w-5 h-5 text-red-400" />
      <span className="text-red-200">
        No balance detected. Please add MON tokens to your wallet to play the game.
      </span>
    </div>
  </motion.div>
);

const VRFWaitingIndicator = () => (
  <motion.div
    className="bg-yellow-600/20 border border-yellow-600/40 rounded-lg p-4 mb-6 text-center"
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center justify-center space-x-2">
      <RefreshCw className="w-5 h-5 animate-spin text-yellow-400" />
      <span className="text-yellow-200">
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
  const [gameState, gameActions, contractInfo] = useBlockchainGameReducer();
  const { playSound } = useSoundEffects(gameState.isSoundMuted);
  const { splash, hideSplash, triggerGiftSplash, triggerDetourSplash, triggerShortcutSplash } = useSplashAnimations();
  const [showNewGameConfirmation, setShowNewGameConfirmation] = useState(false);

  const { isConnected, contractState, isLoading, isLoadingStartGame, isWaitingForVRF, playerRank } = contractInfo;
  const { address } = useAccount();
  
  // Get balance for validation
  const { data: balance } = useBalance({
    address,
    chainId: monadTestnet.id,
  });

  // Play start sound on mount
  useEffect(() => {
    playSound('start');
  }, [playSound]);

  // Handle tile interactions for splash animations
  useEffect(() => {
    if (!contractState || gameState.playerPosition === contractState.position) return;
    
    const currentPosition = contractState.position;
    
    // Check for gift tiles
    const giftTile = gameState.giftTiles.find(tile => tile.index === currentPosition);
    if (giftTile) {
      triggerGiftSplash(giftTile.points);
      playSound('gift');
    }
    
    // Check for detour traps
    const detourTile = gameState.detourTrapTiles.find(tile => tile.index === currentPosition);
    if (detourTile) {
      triggerDetourSplash(detourTile.moveBack);
      playSound('detourTrap');
    }
    
    // Check for shortcut gates
    const shortcutTile = gameState.shortcutGateTiles.find(tile => tile.index === currentPosition);
    if (shortcutTile) {
      triggerShortcutSplash(shortcutTile.moveForward);
      playSound('gift');
    }
  }, [contractState?.position, gameState.playerPosition, gameState.giftTiles, gameState.detourTrapTiles, gameState.shortcutGateTiles, triggerGiftSplash, triggerDetourSplash, triggerShortcutSplash, playSound]);

  // Validation helpers
  const hasNoBalance = balance && balance.value === 0n;
  const isOperationInProgress = gameState.isRolling || isLoading || isWaitingForVRF;

  // Handle dice roll
  const rollDice = async () => {
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

    await gameActions.rollDice();
    playSound('diceRoll');
  };

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
      await restartGame();
    }
  };

  // Restart game
  const restartGame = async () => {
    setShowNewGameConfirmation(false);
    
    try {
      await gameActions.startGame();
      playSound('start');
      toast({
        title: "New Game Started!",
        description: "Your game board is being generated on-chain. Please wait...",
        variant: "default",
      });
    } catch (error) {
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

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[60vh]">
            <motion.div
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-xl border border-gray-600 text-center max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Wallet className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
              <p className="text-gray-300 mb-6">
                To play The Hundredth Tile on-chain, you need to connect your wallet. 
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[60vh]">
            <motion.div
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-xl border border-gray-600 text-center max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-white mb-4">Start Your Game</h2>
              <p className="text-gray-300 mb-6">
                Ready to begin your journey to tile 100? Your game board will be generated on-chain 
                with unique gifts and challenges using Chainlink VRF for randomness.
              </p>
              {hasNoBalance && (
                <div className="bg-red-600/20 border border-red-600/40 rounded-lg p-3 mb-4">
                  <p className="text-red-200 text-sm">
                    ⚠️ You need MON tokens to pay for transaction fees. Please add funds to your wallet.
                  </p>
                </div>
              )}
              <Button
                onClick={restartGame}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex justify-between items-center mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">The Hundredth Tile</h1>
            <p className="text-lg sm:text-xl text-gray-300">
              Roll the dice, collect NUNU tokens, and reach tile 100 on-chain!
            </p>
            {contractState && (
              <div className="text-sm text-purple-400 mt-2 space-y-1">
                <p>On-chain game • Contract: {contractInfo.CONTRACT_ADDRESS}</p>
                {playerRank > 0 && (
                  <p className="text-yellow-400">🏅 Your Rank: #{playerRank}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="ml-4">
            <ContractUserProfile />
          </div>
        </motion.div>

        {/* Balance Warning */}
        {hasNoBalance && <BalanceWarning />}

        {/* VRF Waiting Indicator */}
        {isWaitingForVRF && <VRFWaitingIndicator />}

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

        {/* Victory Modal */}
        <VictoryModal
          isOpen={gameState.gameStatus === 'won'}
          score={gameState.score}
          turnsPlayed={gameState.turnsPlayed}
          giftsCollected={gameState.giftsCollected}
          detourTrapsTriggered={gameState.detourTrapsTriggered}
          shortcutGatesTriggered={gameState.shortcutGatesTriggered}
          gameScore={gameState.score}
          nunuCoins={contractState?.nunuEarned || 0}
          onRestart={restartGame}
          diceRolls={contractState?.diceRolls}
          shortcuts={contractState?.shortcuts}
          detours={contractState?.detours}
        />

        <NewGameConfirmation
          isOpen={showNewGameConfirmation}
          onConfirm={restartGame}
          onCancel={() => setShowNewGameConfirmation(false)}
        />
      </div>
    </div>
  );
};

export default Index;
