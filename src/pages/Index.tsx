
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

const Index = () => {
  console.log('🏠 [INDEX] Component rendering');
  
  const [gameState, gameActions, contractInfo] = useBlockchainGameReducer();
  const { playSound } = useSoundEffects(gameState.isSoundMuted);
  const { splash, hideSplash, triggerGiftSplash, triggerDetourSplash, triggerShortcutSplash } = useSplashAnimations();
  const [showNewGameConfirmation, setShowNewGameConfirmation] = useState(false);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

  const { isConnected, contractState, isLoading, isWaitingForVRF, playerRank, transactionError } = contractInfo;
  const { address } = useAccount();
  
  // Get balance for validation
  const { data: balance } = useBalance({
    address,
    chainId: monadTestnet.id,
  });

  useEffect(() => {
    console.log('🎵 [INDEX] Playing start sound');
    playSound('start');
  }, []);

  useEffect(() => {
    console.log('🎲 [INDEX] Dice rolling state changed:', isDiceRolling);
    setIsDiceRolling(false);
  }, [gameState.playerPosition])

  // Handle tile interactions for splash animations based on position changes
  useEffect(() => {
    if (contractState && gameState.playerPosition !== contractState.position) {
      const currentPosition = contractState.position;
      console.log(`🎯 [INDEX] Player moved to position ${currentPosition}`);
      
      // Check for gift tiles
      const giftTile = gameState.giftTiles.find(tile => tile.index === currentPosition);
      if (giftTile) {
        console.log(`🎁 [INDEX] Triggered gift splash: ${giftTile.points} points`);
        triggerGiftSplash(giftTile.points);
        playSound('gift');
      }
      
      // Check for detour traps
      const detourTile = gameState.detourTrapTiles.find(tile => tile.index === currentPosition);
      if (detourTile) {
        console.log(`🚪 [INDEX] Triggered detour splash: move back ${detourTile.moveBack}`);
        triggerDetourSplash(detourTile.moveBack);
        playSound('detourTrap');
      }
      
      // Check for shortcut gates
      const shortcutTile = gameState.shortcutGateTiles.find(tile => tile.index === currentPosition);
      if (shortcutTile) {
        console.log(`⚡ [INDEX] Triggered shortcut splash: move forward ${shortcutTile.moveForward}`);
        triggerShortcutSplash(shortcutTile.moveForward);
        playSound('gift');
      }
    }
  }, [contractState?.position, gameState.giftTiles, gameState.detourTrapTiles, gameState.shortcutGateTiles]);

  // Show error when transaction fails
  useEffect(() => {
    if (transactionError) {
      console.error('❌ [INDEX] Transaction error:', transactionError);
      setIsDiceRolling(false);
      setIsStartingGame(false);
    }
  }, [transactionError]);

  const rollDice = async () => {
    console.log('🎲 [INDEX] Roll dice button clicked');
    
    // Prevent accidental double clicks
    if (isDiceRolling || isLoading || isWaitingForVRF || isStartingGame) {
      console.log('⚠️ [INDEX] Dice roll blocked - operation in progress');
      return;
    }
    
    if (!isConnected) {
      console.log('❌ [INDEX] Not connected - showing wallet prompt');
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to play on-chain",
        variant: "destructive",
      });
      return;
    }

    if (!contractState?.boardGenerated) {
      console.log('❌ [INDEX] Game not started - showing prompt');
      toast({
        title: "Game Not Started",
        description: "Please start a new game first",
        variant: "destructive",
      });
      return;
    }

    // Check balance for transaction fees
    if (balance && balance.value === 0n) {
      console.log('❌ [INDEX] No balance for transaction fees');
      toast({
        title: "Insufficient Balance",
        description: "You need MON tokens to pay for transaction fees. Please add funds to your wallet.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ [INDEX] Proceeding with dice roll');
    setIsDiceRolling(true);
    try {
      await gameActions.rollDice();
      playSound('diceRoll');
    } catch (error) {
      console.error('❌ [INDEX] Error during dice roll:', error);
      setIsDiceRolling(false);
    }
    
    // Reset dice rolling state after longer timeout to account for VRF
    setTimeout(() => {
      setIsDiceRolling(false);
    }, 15000);
  };

  const handleNewGameClick = async () => {
    console.log('🆕 [INDEX] New game button clicked');
    
    // Prevent accidental double clicks
    if (isStartingGame || isLoading || isDiceRolling) {
      console.log('⚠️ [INDEX] New game blocked - operation in progress');
      return;
    }
    
    if (!isConnected) {
      console.log('❌ [INDEX] Not connected for new game');
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to start a new game",
        variant: "destructive",
      });
      return;
    }

    // Check balance for transaction fees
    if (balance && balance.value === 0n) {
      console.log('❌ [INDEX] No balance for new game');
      toast({
        title: "Insufficient Balance",
        description: "You need MON tokens to pay for transaction fees. Please add funds to your wallet.",
        variant: "destructive",
      });
      return;
    }

    if (gameState.diceRolled && gameState.gameStatus === 'playing') {
      console.log('⚠️ [INDEX] Game in progress - showing confirmation');
      setShowNewGameConfirmation(true);
    } else {
      console.log('✅ [INDEX] Starting new game directly');
      await restartGame();
    }
  };

  const restartGame = async () => {
    console.log('🔄 [INDEX] Restarting game');
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
      console.error('❌ [INDEX] Error restarting game:', error);
      setIsStartingGame(false);
    }
    
    // Reset state after longer timeout for contract interaction
    setTimeout(() => {
      setIsStartingGame(false);
    }, 12000);
  };

  const toggleSound = () => {
    console.log('🔊 [INDEX] Toggling sound');
    gameActions.dispatch({ type: 'TOGGLE_SOUND' });
  };

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    console.log('🔌 [INDEX] Showing wallet connection prompt');
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
    console.log('🎮 [INDEX] Showing game start prompt');
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
              {balance && balance.value === 0n && (
                <div className="bg-red-600/20 border border-red-600/40 rounded-lg p-3 mb-4">
                  <p className="text-red-200 text-sm">
                    ⚠️ You need MON tokens to pay for transaction fees. Please add funds to your wallet.
                  </p>
                </div>
              )}
              {transactionError && (
                <div className="bg-red-600/20 border border-red-600/40 rounded-lg p-3 mb-4">
                  <p className="text-red-200 text-sm">
                    ❌ {transactionError}
                  </p>
                </div>
              )}
              <Button
                onClick={restartGame}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                disabled={isStartingGame || isLoading || (balance && balance.value === 0n)}
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
    return isDiceRolling || 
           isLoading || 
           isWaitingForVRF || 
           isStartingGame ||
           gameState.gameStatus === 'won' || 
           !contractState?.boardGenerated ||
           (balance && balance.value === 0n);
  };

  const isNewGameDisabled = () => {
    return isStartingGame || isLoading || isDiceRolling || (balance && balance.value === 0n);
  };

  console.log('🎮 [INDEX] Rendering main game interface');
  
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
        {balance && balance.value === 0n && (
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
        )}

        {/* Transaction Error Display */}
        {transactionError && (
          <motion.div
            className="bg-red-600/20 border border-red-600/40 rounded-lg p-4 mb-6 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-red-200">
                ❌ {transactionError}
              </span>
            </div>
          </motion.div>
        )}

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
              {balance && balance.value === 0n && (
                <p className="text-center text-red-400 text-sm mt-2">
                  ⚠️ Add MON tokens to play
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
              {balance && balance.value === 0n && (
                <p className="text-center text-red-400 text-sm mt-2">
                  ⚠️ Add MON tokens to play
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
