import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useBlockchainGameReducer } from '@/hooks/useBlockchainGameReducer';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSplashAnimations } from '@/hooks/useSplashAnimations';
import { useSequenceWallet } from '@/hooks/useSequenceWallet';
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

const Index = () => {
  const [gameState, gameActions, contractInfo] = useBlockchainGameReducer();
  const { playSound } = useSoundEffects(gameState.isSoundMuted);
  const { splash, hideSplash, triggerGiftSplash, triggerDetourSplash, triggerShortcutSplash } = useSplashAnimations();
  const { ensureSequenceWallet, isSequenceWalletCreated } = useSequenceWallet();
  const [showNewGameConfirmation, setShowNewGameConfirmation] = useState(false);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

  const { isConnected, contractState, isLoading, isWaitingForVRF, playerRank } = contractInfo;

  useEffect(() => {
    playSound('start');
    // Ensure Sequence wallet on app load
    ensureSequenceWallet();
  }, []);

  useEffect(() => {
    setIsDiceRolling(false);
  }, [gameState.playerPosition])

  // Handle tile interactions for splash animations based on position changes
  useEffect(() => {
    if (contractState && gameState.playerPosition !== contractState.position) {
      const currentPosition = contractState.position;
      
      // Check for gift tiles
      const giftTile = gameState.giftTiles.find(tile => tile.index === currentPosition);
      if (giftTile) {
        console.log('🎁 [SPLASH] Triggered gift splash at position', currentPosition);
        triggerGiftSplash(giftTile.points);
        playSound('gift');
      }
      
      // Check for detour traps
      const detourTile = gameState.detourTrapTiles.find(tile => tile.index === currentPosition);
      if (detourTile) {
        console.log('🚪❌ [SPLASH] Triggered detour splash at position', currentPosition);
        triggerDetourSplash(detourTile.moveBack);
        playSound('detourTrap');
      }
      
      // Check for shortcut gates
      const shortcutTile = gameState.shortcutGateTiles.find(tile => tile.index === currentPosition);
      if (shortcutTile) {
        console.log('🚪✅ [SPLASH] Triggered shortcut splash at position', currentPosition);
        triggerShortcutSplash(shortcutTile.moveForward);
        playSound('gift');
      }
    }
  }, [contractState?.position, gameState.giftTiles, gameState.detourTrapTiles, gameState.shortcutGateTiles]);

  const rollDice = async () => {
    console.log('🎲 [UI] Roll dice button clicked');
    
    // Prevent accidental double clicks
    if (isDiceRolling || isLoading || isWaitingForVRF || isStartingGame) {
      console.log('⚠️ [UI] Dice roll blocked - operation in progress');
      return;
    }
    
    if (!isConnected) {
      console.log('⚠️ [UI] Dice roll blocked - wallet not connected');
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to play on-chain",
        variant: "destructive",
      });
      return;
    }

    if (!contractState?.boardGenerated) {
      console.log('⚠️ [UI] Dice roll blocked - game not started');
      toast({
        title: "Game Not Started",
        description: "Please start a new game first",
        variant: "destructive",
      });
      return;
    }

    setIsDiceRolling(true);
    await gameActions.rollDice();
    playSound('diceRoll');
    
    // Reset dice rolling state after animation
    setTimeout(() => {
      setIsDiceRolling(false);
    }, 5000); // Increased timeout for VRF
  };

  const handleNewGameClick = async () => {
    console.log('🎮 [UI] New game button clicked');
    
    // Prevent accidental double clicks
    if (isStartingGame || isLoading || isDiceRolling) {
      console.log('⚠️ [UI] New game blocked - operation in progress');
      return;
    }
    
    if (!isConnected) {
      console.log('⚠️ [UI] New game blocked - wallet not connected');
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to start a new game",
        variant: "destructive",
      });
      return;
    }

    if (gameState.diceRolled && gameState.gameStatus === 'playing') {
      console.log('🤔 [UI] Game in progress, showing confirmation');
      setShowNewGameConfirmation(true);
    } else {
      await restartGame();
    }
  };

  const restartGame = async () => {
    console.log('🔄 [UI] Restarting game...');
    setIsStartingGame(true);
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
      console.error('❌ [UI] Error restarting game:', error);
    } finally {
      setTimeout(() => {
        setIsStartingGame(false);
      }, 8000); // Increased timeout for contract interaction
    }
  };

  const toggleSound = () => {
    gameActions.dispatch({ type: 'TOGGLE_SOUND' });
  };

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
              <p className="text-sm text-gray-400 mb-4">
                We recommend using Sequence wallet for the best gaming experience - no transaction popups!
              </p>
              <Button
                onClick={ensureSequenceWallet}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                Connect Sequence Wallet
              </Button>
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
              {isSequenceWalletCreated && (
                <p className="text-sm text-green-400 mb-4">
                  ✅ Sequence wallet ready - seamless gameplay ahead!
                </p>
              )}
              <Button
                onClick={restartGame}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                disabled={isStartingGame || isLoading}
              >
                {isStartingGame || isLoading ? (
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

  const isDiceDisabled = () => {
    console.log('isDiceRolling,isLoading,isWaitingForVRF, isStartingGame, gameState, contractState', isDiceRolling,isLoading,isWaitingForVRF, isStartingGame, gameState, contractState);
    return isDiceRolling || 
           isLoading || 
           isWaitingForVRF || 
           isStartingGame ||
           gameState.gameStatus === 'won' || 
           !contractState?.boardGenerated;
  };

  const isNewGameDisabled = () => {
    return isStartingGame || isLoading || isDiceRolling;
  };

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
                {isSequenceWalletCreated && (
                  <p className="text-green-400">✅ Sequence wallet active</p>
                )}
              </div>
            )}
          </div>
          
          <div className="ml-4">
            <ContractUserProfile />
          </div>
        </motion.div>

        {/* VRF Waiting Indicator */}
        {isWaitingForVRF && (
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
                disabled={isDiceDisabled()}
                contractValue={contractState?.diceValue}
              />
              {isWaitingForVRF && (
                <p className="text-center text-yellow-400 text-sm mt-2">
                  ⏳ Waiting for blockchain randomness...
                </p>
              )}
            </motion.div>

            <motion.button
              onClick={handleNewGameClick}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-lg shadow-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
              whileHover={{ scale: isNewGameDisabled() ? 1 : 1.02 }}
              whileTap={{ scale: isNewGameDisabled() ? 1 : 0.98 }}
              disabled={isNewGameDisabled()}
            >
              {isStartingGame || isLoading ? 'Starting Game...' : 'New Game'}
            </motion.button>
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
            />

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
                disabled={isDiceDisabled()}
                contractValue={contractState?.diceValue}
              />
              {isWaitingForVRF && (
                <p className="text-center text-yellow-400 text-sm mt-2">
                  ⏳ Waiting for blockchain randomness...
                </p>
              )}
            </motion.div>

            <motion.button
              onClick={handleNewGameClick}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-lg shadow-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
              whileHover={{ scale: isNewGameDisabled() ? 1 : 1.02 }}
              whileTap={{ scale: isNewGameDisabled() ? 1 : 0.98 }}
              disabled={isNewGameDisabled()}
            >
              {isStartingGame || isLoading ? 'Starting Game...' : 'New Game'}
            </motion.button>
          </div>
        </div>

        {/* Splash Animation */}
        <SplashAnimation
          isVisible={splash.isVisible}
          type={splash.type}
          value={splash.value}
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
