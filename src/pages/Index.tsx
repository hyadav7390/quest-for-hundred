
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameReducer } from '@/hooks/useGameReducer';
import GameBoard from '@/components/GameBoard';
import Dice from '@/components/Dice';
import ScoreBoard from '@/components/ScoreBoard';
import VictoryModal from '@/components/VictoryModal';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [gameState, dispatch] = useGameReducer();

  const rollDice = () => {
    if (gameState.isRolling || gameState.isMoving) return;
    
    const diceValue = Math.floor(Math.random() * 6) + 1;
    dispatch({ type: 'ROLL_DICE', payload: diceValue });
    
    // Start movement after dice animation
    setTimeout(() => {
      dispatch({ type: 'START_MOVING' });
      handlePlayerMovement(diceValue);
    }, 1200);
  };

  const handlePlayerMovement = async (diceValue: number) => {
    const targetPosition = gameState.playerPosition + diceValue;
    
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
    
    // Small delay for movement animation
    setTimeout(() => {
      // Check if player reached tile 100
      if (targetPosition === 100) {
        dispatch({ type: 'WIN_GAME' });
        toast({
          title: "🎉 Victory!",
          description: "Congratulations! You've reached tile 100!",
          variant: "default",
        });
        return;
      }

      // Check for gift tiles
      if (gameState.giftTiles.includes(targetPosition)) {
        const giftPoints = Math.floor(Math.random() * 51) + 50;
        dispatch({ type: 'COLLECT_GIFT', payload: targetPosition });
        toast({
          title: "🎁 Gift Collected!",
          description: `You earned ${giftPoints} bonus points!`,
          variant: "default",
        });
      }

      // Check for BounceBack tiles
      const bounceBackTile = gameState.bounceBackTiles.find(bt => bt.index === targetPosition);
      if (bounceBackTile) {
        const newPosition = Math.max(1, targetPosition - bounceBackTile.moveBack);
        dispatch({ 
          type: 'TRIGGER_BOUNCEBACK', 
          payload: { newPosition, penalty: bounceBackTile.moveBack } 
        });
        toast({
          title: "🔄 BounceBack!",
          description: `You moved back ${bounceBackTile.moveBack} tiles to position ${newPosition}.`,
          variant: "destructive",
        });
      }

      dispatch({ type: 'FINISH_TURN' });
    }, 500);
  };

  const restartGame = () => {
    dispatch({ type: 'RESET_GAME' });
    toast({
      title: "New Game Started!",
      description: "Good luck on your quest to tile 100!",
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🎮 GiftQuest100
          </h1>
          <p className="text-xl text-gray-300">
            Roll the dice, collect gifts, avoid BounceBack tiles, and reach tile 100!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Board - Takes up more space */}
          <div className="lg:col-span-3">
            <GameBoard
              playerPosition={gameState.playerPosition}
              giftTiles={gameState.giftTiles}
              bounceBackTiles={gameState.bounceBackTiles}
            />
          </div>

          {/* Side Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Score Board */}
            <ScoreBoard
              score={gameState.score}
              position={gameState.playerPosition}
              turnsPlayed={gameState.turnsPlayed}
              giftsCollected={gameState.giftsCollected}
              bounceBacksTriggered={gameState.bounceBacksTriggered}
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
              onClick={restartGame}
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
          bounceBacksTriggered={gameState.bounceBacksTriggered}
          onRestart={restartGame}
        />
      </div>
    </div>
  );
};

export default Index;
