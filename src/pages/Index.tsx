import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameReducer } from '@/hooks/useGameReducer';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { updateUserProfile } from '@/utils/userProfile';
import GameBoard from '@/components/GameBoard';
import Dice from '@/components/Dice';
import ScoreBoard from '@/components/ScoreBoard';
import VictoryModal from '@/components/VictoryModal';
import UserProfile from '@/components/UserProfile';
import NewGameConfirmation from '@/components/NewGameConfirmation';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [gameState, dispatch] = useGameReducer();
  const { playSound } = useSoundEffects(gameState.isSoundMuted);
  const [showNewGameConfirmation, setShowNewGameConfirmation] = useState(false);
  const [currentGameGiftScore, setCurrentGameGiftScore] = useState(0);

  useEffect(() => {
    // Play start game sound
    playSound('start');
  }, []);

  // Handle consecutive tile effects
  const handleTileEffects = async (position: number, previousPosition: number): Promise<number> => {
    let currentPosition = position;
    
    // Check for gift tiles
    const gift = gameState.giftTiles.find(g => g.index === currentPosition);
    if (gift) {
      dispatch({ type: 'COLLECT_GIFT', payload: { tileIndex: currentPosition, points: gift.points } });
      setCurrentGameGiftScore(prev => prev + gift.points);
      playSound('gift');
      toast({
        title: "🎁 Gift Collected!",
        description: `You earned ${gift.points} bonus points!`,
        variant: "default",
      });
    }

    // Check for Detour Trap tiles
    const detourTrap = gameState.detourTrapTiles.find(dt => dt.index === currentPosition);
    if (detourTrap) {
      dispatch({ type: 'REVEAL_TRAP', payload: currentPosition });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPosition = Math.max(1, currentPosition - detourTrap.moveBack);
      dispatch({ 
        type: 'TRIGGER_DETOUR_TRAP', 
        payload: { newPosition, penalty: detourTrap.moveBack, trapIndex: currentPosition } 
      });
      playSound('detourTrap');
      toast({
        title: "🚪 Detour Trap!",
        description: `You went through the door and moved back ${detourTrap.moveBack} tiles to position ${newPosition}.`,
        variant: "destructive",
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recursively check the new position for more effects
      return handleTileEffects(newPosition, currentPosition);
    }

    // Check for Shortcut Gate tiles
    const shortcutGate = gameState.shortcutGateTiles.find(sg => sg.index === currentPosition);
    if (shortcutGate) {
      dispatch({ type: 'REVEAL_GATE', payload: currentPosition });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPosition = Math.min(100, currentPosition + shortcutGate.moveForward);
      dispatch({ 
        type: 'TRIGGER_SHORTCUT_GATE', 
        payload: { newPosition, bonus: shortcutGate.moveForward, gateIndex: currentPosition } 
      });
      playSound('gift'); // Use gift sound for positive effect
      toast({
        title: "🚀 Shortcut Gate!",
        description: `You found a shortcut and moved forward ${shortcutGate.moveForward} tiles to position ${newPosition}!`,
        variant: "default",
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recursively check the new position for more effects
      return handleTileEffects(newPosition, currentPosition);
    }
    
    return currentPosition;
  };

  const rollDice = () => {
    if (gameState.isRolling || gameState.isMoving) return;
    
    const diceValue = Math.floor(Math.random() * 6) + 1;
    dispatch({ type: 'ROLL_DICE', payload: diceValue });
    playSound('diceRoll');
    
    // Start movement after dice animation
    setTimeout(() => {
      dispatch({ type: 'START_MOVING' });
      handlePlayerMovement(diceValue);
    }, 1200);
  };

  const handlePlayerMovement = async (diceValue: number) => {
    const targetPosition = gameState.playerPosition + diceValue;
    const previousPosition = gameState.playerPosition;
    
    // Check if player would overshoot tile 100
    if (targetPosition > 100) {
      toast({
        title: "Can't move!",
        description: `You need exactly ${100 - gameState.playerPosition} to reach tile 100.`,
        variant: "default",
      });
      dispatch({ type: 'FINISH_TURN' });
      return;
    }

    // Move player
    dispatch({ type: 'MOVE_PLAYER', payload: targetPosition });
    playSound('move');
    
    // Small delay for movement animation
    setTimeout(async () => {
      // Check if player reached tile 100
      if (targetPosition === 100) {
        // Update user profile with final scores before winning
        updateUserProfile(gameState.score, currentGameGiftScore, gameState.giftsCollected);
        
        dispatch({ type: 'WIN_GAME' });
        playSound('win');
        toast({
          title: "🎉 Victory!",
          description: "Congratulations! You've reached tile 100!",
          variant: "default",
        });
        return;
      }

      // Handle tile effects (gifts, traps, gates) with consecutive logic
      await handleTileEffects(targetPosition, previousPosition);

      dispatch({ type: 'FINISH_TURN' });
      
      // Regenerate gift on previous position if it was a gift tile
      // const previousGift = gameState.giftTiles.find(g => g.index === previousPosition);
      // if (previousGift) {
      //   setTimeout(() => {
      //     dispatch({ type: 'REGENERATE_GIFT', payload: { index: previousPosition, points: previousGift.points } });
      //   }, 500);
      // }
    }, 500);
  };

  const handleNewGameClick = () => {
    if (gameState.diceRolled) {
      setShowNewGameConfirmation(true);
    } else {
      restartGame();
    }
  };

  const restartGame = () => {
    // Update user profile with current game data before resetting
    if (gameState.diceRolled) {
      updateUserProfile(gameState.score, currentGameGiftScore, gameState.giftsCollected);
    }
    
    dispatch({ type: 'RESET_GAME' });
    setCurrentGameGiftScore(0);
    playSound('start');
    setShowNewGameConfirmation(false);
    toast({
      title: "New Game Started!",
      description: "Good luck on your quest to tile 100!",
      variant: "default",
    });
  };

  const toggleSound = () => {
    dispatch({ type: 'TOGGLE_SOUND' });
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
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              🎮 NU GAMES
            </h1>
            <p className="text-lg sm:text-xl text-gray-300">
              Roll the dice, collect gifts, avoid detour traps, find shortcuts, and make your NUNU rise to 100!
            </p>
          </div>
          
          <div className="ml-4">
            <UserProfile />
          </div>
        </motion.div>

        {/* Mobile Layout */}
        <div className="block lg:hidden space-y-6">
          {/* Score Board - Top on mobile */}
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

          {/* Game Board */}
          <GameBoard
            playerPosition={gameState.playerPosition}
            giftTiles={gameState.giftTiles}
            detourTrapTiles={gameState.detourTrapTiles}
            shortcutGateTiles={gameState.shortcutGateTiles}
            revealedTraps={gameState.revealedTraps}
            revealedGates={gameState.revealedGates}
            isMoving={gameState.isMoving}
          />

          {/* Controls - Bottom on mobile */}
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
          {/* Game Board - Takes up more space */}
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

          {/* Side Panel */}
          <div className="lg:col-span-1 space-y-3">
            {/* Score Board */}
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

            {/* Dice Control */}
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

            {/* Reset Button */}
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

        {/* Victory Modal */}
        <VictoryModal
          isOpen={gameState.gameStatus === 'won'}
          score={gameState.score}
          turnsPlayed={gameState.turnsPlayed}
          giftsCollected={gameState.giftsCollected}
          detourTrapsTriggered={gameState.detourTrapsTriggered}
          shortcutGatesTriggered={gameState.shortcutGatesTriggered}
          gameScore={gameState.score - currentGameGiftScore}
          giftScore={currentGameGiftScore}
          onRestart={restartGame}
        />

        {/* New Game Confirmation */}
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
