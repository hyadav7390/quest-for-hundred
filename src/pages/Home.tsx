
import { motion } from 'framer-motion';
import { Play, Gift, Zap, Target, Twitter, MessageCircle, Send, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import GlobalProgressTracker from '@/components/GlobalProgressTracker';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Target className="w-8 h-8" style={{color: 'hsl(var(--neon-purple))'}}/>,
      title: "Race to 100",
      description: "Navigate through 100 tiles in this thrilling board game adventure"
    },
    {
      icon: <Gift className="w-8 h-8" style={{color: 'hsl(var(--neon-yellow))'}}/>,
      title: "Earn NUNU Coins",
      description: "Collect gifts to earn NUNU coins (50-300 coins each)"
    },
    {
      icon: <Zap className="w-8 h-8" style={{color: 'hsl(var(--neon-green))'}}/>,
      title: "Unpredictable Journey",
      description: "Face detour traps and find shortcut gates that change your path"
    }
  ];

  const socialLinks = [
    { icon: <Twitter className="w-5 h-5" />, label: "Twitter", href: "https://twitter.com" },
    { icon: <MessageCircle className="w-5 h-5" />, label: "Discord", href: "https://discord.com" },
    { icon: <Send className="w-5 h-5" />, label: "Telegram", href: "https://telegram.org" }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl sm:text-8xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              🎮 NUNU GAMES
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Roll the dice, collect gifts, avoid traps, and find shortcuts in this thrilling blockchain board game!
            </p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Button
                size="lg"
                onClick={() => navigate('/game')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                <Play className="w-6 h-6 mr-3" />
                Play Now
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-30"
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
      </div>

      {/* Global Progress Tracker */}
      <GlobalProgressTracker />

      {/* Platform Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <motion.h2
          className="text-4xl font-bold text-white text-center mb-16"
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
              className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-purple-500 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* NUNU Ecosystem Section */}
      <div className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-8">The NUNU Ecosystem</h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-12">
              NUNU Games is building the future of blockchain gaming where players are rewarded for their time and skill. 
              Our ecosystem revolves around NUNU coins - earn them by collecting gifts, reaching tile 100, and 
              competing on the leaderboard in this thrilling board game adventure.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl p-6">
                <Gift className="w-12 h-12 text-white mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Earn NUNU Coins</h3>
                <p className="text-white opacity-90">Collect gifts and complete games to earn coins</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6">
                <div className="text-4xl mb-4">🎲</div>
                <h3 className="text-lg font-bold text-white mb-2">Blockchain Gaming</h3>
                <p className="text-white opacity-90">Provably fair dice rolls using Chainlink VRF</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-lg font-bold text-white mb-2">Community Rewards</h3>
                <p className="text-white opacity-90">Participate in global challenges and earn rare NFTs</p>
              </div>
            </div>

            <motion.div
              className="mt-12"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-xl"
              >
                <FileText className="w-5 h-5 mr-2" />
                Read Whitepaper
              </Button>
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
          <h2 className="text-4xl font-bold text-white mb-8">Ready to Start Gaming?</h2>
          <p className="text-xl text-gray-300 mb-12">
            Join thousands of players earning NUNU coins and racing to tile 100!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              onClick={() => navigate('/game')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              <Play className="w-6 h-6 mr-3" />
              Play Now
            </Button>
            <Button
              size="lg"
              onClick={() => navigate('/game/leaderboard')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              🏆 Leaderboard
            </Button>
          </div>

          <div className="flex justify-center space-x-6">
            {socialLinks.map((link, index) => (
              <motion.a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {link.icon}
                <span>{link.label}</span>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
