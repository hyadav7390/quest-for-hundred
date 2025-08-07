
import { motion } from 'framer-motion';
import { Play, Target, Gift, Zap, Trophy, X, MessageCircle, Send, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import CommunityProgress from '@/components/CommunityProgress';
import GameModeModal from '@/components/GameModeModal';
import { useState, useEffect } from 'react';
import { REWARD_TOKEN } from '@/configs';

const Home = () => {
  const navigate = useNavigate();
  const [showGameModeModal, setShowGameModeModal] = useState(false);

  const handlePlayNow = () => {
    setShowGameModeModal(true);
  };

  const handleSelectMode = (mode: 'single' | 'multi') => {
    setShowGameModeModal(false);
    navigate('/game', { state: { mode } });
  };

  const features = [
    {
      icon: <Target className="w-8 h-8 text-accent-main"/>,
      title: "Race to 100",
      description: "Navigate through 100 tiles in this thrilling board game adventure"
    },
    {
      icon: <Gift className="w-8 h-8 text-positive"/>,
      title: `Earn $${REWARD_TOKEN.symbol} Coins`,
      description: `Collect gifts to earn $${REWARD_TOKEN.symbol} coins (50-300 coins each)`
    },
    {
      icon: <Zap className="w-8 h-8 text-accent-main"/>,
      title: "Unpredictable Journey",
      description: "Face detour traps and find shortcut gates that change your path"
    }
  ];

  const socialLinks = [
    { icon: <img src="/x.png" alt="X" className="w-8 h-8" />, label: "X", href: "https://x.com/RuggRoll" },
    { icon: <img src="/discord.png" alt="Discord" className="w-8 h-8" />, label: "Discord", href: "https://discord.gg/eJjh8WNz" },
    // { icon: <img src="/telegram.png" alt="Telegram" className="w-8 h-8" />, label: "Telegram", href: "https://t.me/" }
  ];

  // Animated background elements component
  const AnimatedBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-accent-main rounded-full opacity-30"
          animate={{
            x: [0, Math.random() * 100],
            y: [0, Math.random() * 100],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl sm:text-8xl font-heading font-bold text-white mb-6">
              <span className="text-accent-main">RUGG ROLL</span>
            </h1>
            <p className="text-xl sm:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
              Roll the dice, collect gifts, avoid traps, and find shortcuts in this thrilling blockchain board game!
            </p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Button
                size="lg"
                onClick={handlePlayNow}
                className="px-12 py-6 text-xl font-bold rounded-2xl hover:shadow-glow hover:scale-105 transition-all duration-300"
              >
                🎲 Play Now
              </Button>
            </motion.div>
          </motion.div>
        </div>
        <AnimatedBackground />
      </div>

      {/* Community Progress */}
      <div className="relative overflow-hidden mb-20">
        <CommunityProgress />
        <AnimatedBackground />
      </div>

      {/* Game Features Section */}
      {/* <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <motion.h2
            className="text-heading-2 font-heading font-bold text-white text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Game Features
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="panel hover:shadow-[0_0_0_1px_theme(colors.accent-main/40)] transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <AnimatedBackground />
      </div> */}

      {/* RUGGROLL Ecosystem Section */}
      <div className="bg-gradient-to-br from-surface via-surface to-accent-main/5 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* <h2 className="text-heading-2 font-heading font-bold text-white mb-4">The RUGGROLL Ecosystem</h2>
            <p className="text-xl text-white/80 max-w-4xl mx-auto mb-16">
              We're not like those other projects... because we actually care about the community! 
              No funny business, just pure gaming and earning. 🎮💰
            </p> */}
            
            {/* Main Tokenomics Card */}
            <motion.div
              className="bg-gradient-to-r from-accent-main/10 to-blue-500/10 border-2 border-accent-main/30 rounded-2xl p-8 mb-2"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🔥</div>
                <h3 className="text-3xl font-heading font-bold text-white mb-4">Why RUGGROLL is Different</h3>
                <p className="text-lg text-white/80 mb-6">
                  We're doing what others only promise to do
                </p>
              </div>

              {/* Tokenomics Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div
                  className="bg-surface/50 border border-accent-main/20 rounded-xl p-4 text-center hover:border-accent-main/40 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-2xl mb-2">🚫</div>
                  <h4 className="font-semibold text-white mb-1">No Presale BS</h4>
                  <p className="text-sm text-white/70">We don't need your money upfront</p>
                </motion.div>

                <motion.div
                  className="bg-surface/50 border border-accent-main/20 rounded-xl p-4 text-center hover:border-accent-main/40 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-2xl mb-2">👥</div>
                  <h4 className="font-semibold text-white mb-1">No Team Dumps</h4>
                  <p className="text-sm text-white/70">We can't dump what we don't have</p>
                </motion.div>

                <motion.div
                  className="bg-surface/50 border border-accent-main/20 rounded-xl p-4 text-center hover:border-accent-main/40 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-2xl mb-2">🔒</div>
                  <h4 className="font-semibold text-white mb-1">No Insider Trading</h4>
                  <p className="text-sm text-white/70">Everyone starts at the same time</p>
                </motion.div>

                <motion.div
                  className="bg-surface/50 border border-accent-main/20 rounded-xl p-4 text-center hover:border-accent-main/40 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-2xl mb-2">🤖</div>
                  <h4 className="font-semibold text-white mb-1">No Bot Farms</h4>
                  <p className="text-sm text-white/70">Real humans only, sorry bots</p>
                </motion.div>

                <motion.div
                  className="bg-surface/50 border border-accent-main/20 rounded-xl p-4 text-center hover:border-accent-main/40 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-semibold text-white mb-1">100% Community</h4>
                  <p className="text-sm text-white/70">By degens, for degens</p>
                </motion.div>

                <motion.div
                  className="bg-surface/50 border border-accent-main/20 rounded-xl p-4 text-center hover:border-accent-main/40 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-2xl mb-2">💧</div>
                  <h4 className="font-semibold text-white mb-1">Auto Liquidity</h4>
                  <p className="text-sm text-white/70">Every roll = 0.001 MON to LP</p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Call to Action & Social Links */}
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-heading-2 font-heading font-bold text-white mb-8">Ready to RUGG? 🚀</h2>
          {/* <p className="text-xl text-white/80 mb-12">
            Join the revolution. Play the game. Earn the tokens.
          </p> */}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              onClick={handlePlayNow}
              className="px-12 py-6 text-xl font-bold rounded-2xl"
            >
              <Play className="w-6 h-6 mr-3" />
              Play Now
            </Button>
            {/* <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/game/leaderboard')}
              className="px-12 py-6 text-xl font-bold rounded-2xl"
            >
              <Trophy className="w-6 h-6 mr-3" />
              Leaderboard
            </Button> */}
          </div>

          <div className="flex justify-center space-x-4">
            {socialLinks.map((link, index) => (
              <motion.a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center rounded-xl bg-surface/20 border border-accent-main/10 hover:border-accent-main/30 hover:bg-surface/30 transition-all duration-300 min-w-[60px] p-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-accent-main/20 to-blue-500/20 border border-accent-main/30 group-hover:border-accent-main/50 transition-colors"> */}
                  {/* <div className="text-accent-main group-hover:text-white transition-colors"> */}
                    {link.icon}
                  {/* </div> */}
                {/* </div> */}
                {/* <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                  {link.label}
                </span> */}
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>

      {showGameModeModal && (
        <GameModeModal
          isOpen={showGameModeModal}
          onClose={() => setShowGameModeModal(false)}
          onSelectMode={handleSelectMode}
        />
      )}
    </div>
  );
};

export default Home;
