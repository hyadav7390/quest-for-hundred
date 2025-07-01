import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileMenuProps {
  navigationItems: { label: string; path: string; icon: React.ReactNode; show: boolean }[];
  isActivePath: (path: string) => boolean;
  navigate: (path: string) => void;
  setMobileMenuOpen: (open: boolean) => void;
  ready: boolean;
  authenticated: boolean;
  formatBalance: () => string;
  login: () => void;
  logout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  navigationItems,
  isActivePath,
  navigate,
  setMobileMenuOpen,
  ready,
  authenticated,
  formatBalance,
  login,
  logout
}) => (
  <motion.div
    className="md:hidden border-t border-gray-700 py-4"
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.2 }}
  >
    <nav className="flex flex-col space-y-2">
      {navigationItems.filter(item => item.show).map((item) => (
        <Button
          key={item.path}
          variant={isActivePath(item.path) ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            navigate(item.path);
            setMobileMenuOpen(false);
          }}
          className={`flex items-center justify-start space-x-2 w-full ${isActivePath(item.path)
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'text-gray-300 hover:text-white hover:bg-gray-800'
            } transition-all duration-200`}
        >
          {item.icon}
          <span>{item.label}</span>
        </Button>
      ))}
    </nav>
  </motion.div>
);

export default MobileMenu; 