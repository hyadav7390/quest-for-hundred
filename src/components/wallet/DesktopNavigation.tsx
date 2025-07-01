import { Button } from '@/components/ui/button';

interface DesktopNavigationProps {
  navigationItems: { label: string; path: string; icon: React.ReactNode; show: boolean }[];
  isActivePath: (path: string) => boolean;
  navigate: (path: string) => void;
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({ navigationItems, isActivePath, navigate }) => (
  <nav className="hidden md:flex items-center space-x-1">
    {navigationItems.filter(item => item.show).map((item) => (
      <Button
        key={item.path}
        variant={isActivePath(item.path) ? "default" : "ghost"}
        size="sm"
        onClick={() => navigate(item.path)}
        className={`flex items-center space-x-2 ${isActivePath(item.path)
          ? 'bg-purple-600 hover:bg-purple-700 text-white'
          : 'text-gray-300 hover:text-white hover:bg-gray-800'
        } transition-all duration-200`}
      >
        {item.icon}
        <span>{item.label}</span>
      </Button>
    ))}
  </nav>
);

export default DesktopNavigation; 