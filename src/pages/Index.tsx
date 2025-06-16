
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useBlockchainGameReducer } from '@/hooks/useBlockchainGameReducer';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import GameBoard from '@/components/GameBoard';
import Dice from '@/components/Dice';
import ScoreBoard from '@/components/ScoreBoard';
import VictoryModal from '@/components/VictoryModal';
import ContractUserProfile from '@/components/ContractUserProfile';
import NewGameConfirmation from '@/components/NewGameConfirmation';
import SplashAnimation from '@/components/SplashAnimation';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

const Index = () => {
  const [gameState, gameActions, contractInfo] = useBlockchainGameReducer();
  const { playSound } = useSoundEffects(gameState.isSoundMuted);
  const [showNewGameConfirmation, setShowNewGameConfirmation] = useState(false);
  const [splash, setSplash] = useState<{
    isVisible: boolean;
    type: 'gift' | 'shortcut' | 'detour';
    value: number;
  }>({
    isVisible: false,
    type: 'gift',
    value: 0
  });

  const { isConnected, contractState } = contractInfo;

  useEffect(() => {
    playSound('start');
  }, []);

  // Handle tile interactions for splash animations
  useEffect(() => {
    if (gameState.giftsCollected > 0) {
      showSplash('gift', 10); // Show gift animation
    }
  }, [gameState.giftsCollected]);

  useEffect(() => {
    if (gameState.detourTrapsTriggered > 0) {
      showSplash('detour', 5); // Show detour animation
    }
  }, [gameState.detourTrapsTriggered]);

  useEffect(() => {
    if (gameState.shortcutGatesTriggered > 0) {
      showSplash('shortcut', 3); // Show shortcut animation
    }
  }, [gameState.shortcutGatesTriggered]);

  const showSplash = (type: 'gift' | 'shortcut' | 'detour', value: number) => {
    setSplash({ isVisible: true, type, value });
  };

  const hideSplash = () => {
    setSplash({ isVisible: false, type: 'gift', value: 0 });
  };

  const rollDice = () => {
    if (gameState.isRolling || gameState.isMoving) return;
    
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to play on-chain",
        variant: "destructive",
      });
      return;
    }

    gameActions.rollDice();
    playSound('diceRoll');
  };

  const handleNewGameClick = () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to start a new game",
        variant: "destructive",
      });
      return;
    }

    if (gameState.diceRolled) {
      setShowNewGameConfirmation(true);
    } else {
      restartGame();
    }
  };

  const restartGame = async () => {
    await gameActions.startGame();
    playSound('start');
    setShowNewGameConfirmation(false);
    toast({
      title: "New Game Started!",
      description: "Good luck on your quest to tile 100!",
      variant: "default",
    });
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
              <p className="text-sm text-gray-400">
                Use the "Connect" button in the header to get started.
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
                with unique gifts and challenges.
              </p>
              <Button
                onClick={restartGame}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                disabled={gameState.isRolling}
              >
                {gameState.isRolling ? 'Starting Game...' : 'Start New Game'}
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
              <p className="text-sm text-purple-400 mt-2">
                On-chain game • Contract: {contractInfo.CONTRACT_ADDRESS}
              </p>
            )}
          </div>
          
          <div className="ml-4">
            <ContractUserProfile />
          </div>
        </motion.div>

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
                isRolling={gameState.isRolling}
                onRoll={rollDice}
                disabled={gameState.isRolling || gameState.isMoving || gameState.gameStatus === 'won'}
              />
            </motion.div>

            <motion.button
              onClick={handleNewGameClick}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-lg shadow-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              New Game
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
                isRolling={gameState.isRolling}
                onRoll={rollDice}
                disabled={gameState.isRolling || gameState.isMoving || gameState.gameStatus === 'won'}
              />
            </motion.div>

            <motion.button
              onClick={handleNewGameClick}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-lg shadow-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              New Game
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
