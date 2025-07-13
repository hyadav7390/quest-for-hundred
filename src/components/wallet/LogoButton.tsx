import { motion } from 'framer-motion';

interface LogoButtonProps {
  navigate: (path: string) => void;
}

const LogoButton: React.FC<LogoButtonProps> = ({ navigate }) => (
  <motion.button
    onClick={() => navigate('/')}
    className="text-2xl font-bold text-white hover:text-purple-400 transition-colors"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <img src="./logo.png" className="h-32 pt-1" />
  </motion.button>
);

export default LogoButton; 