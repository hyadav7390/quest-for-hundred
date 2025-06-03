
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Gamepad2, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { 
      label: 'Home', 
      path: '/', 
      icon: <Home className="w-4 h-4" />,
      show: true
    },
    { 
      label: 'Games', 
      path: '/games', 
      icon: <Gamepad2 className="w-4 h-4" />,
      show: true
    },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <motion.header
      className="bg-gray-900 border-b border-gray-700 sticky top-0 z-40"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.button
            onClick={() => navigate('/')}
            className="text-2xl font-bold text-white hover:text-purple-400 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🎮 NUNU GAMES
          </motion.button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems
              .filter(item => item.show)
              .map((item) => (
                <Button
                  key={item.path}
                  variant={isActivePath(item.path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 ${
                    isActivePath(item.path)
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  } transition-all duration-200`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Button>
              ))}
          </nav>

          {/* Desktop Wallet Connection */}
          <div className="hidden md:block">
            <ConnectButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden border-t border-gray-700 py-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="flex flex-col space-y-2">
              {navigationItems
                .filter(item => item.show)
                .map((item) => (
                  <Button
                    key={item.path}
                    variant={isActivePath(item.path) ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-start space-x-2 w-full ${
                      isActivePath(item.path)
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    } transition-all duration-200`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Button>
                ))}
            </nav>
            
            {/* Mobile Wallet Connection */}
            <div className="pt-4 border-t border-gray-700 mt-4">
              <ConnectButton />
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;
