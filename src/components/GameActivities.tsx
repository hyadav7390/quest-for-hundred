import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, Coins, Clock, TrendingUp, Trophy, Users, DoorClosed, DoorOpen, Gift } from 'lucide-react';

interface GameActivity {
  actor: string;
  actionType: number;
  count: number;
  amount: number;
  timestamp: number;
}

interface GameActivitiesProps {
  activities: GameActivity[];
  compact?: boolean; // For mobile layout
}

const GameActivities = ({ activities, compact = false }: GameActivitiesProps) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: number) => {
    return (amount / 1e18).toFixed(2);
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getActivityIcon = (actionType: number) => {
    switch (actionType) {
      case 0: // Rug
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 1:
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Users className="w-4 h-4 text-sky-500" />;
      case 3:
        return <Gift className="w-4 h-4 text-yellow-500" />;
      case 4:
        return <DoorClosed className="w-4 h-4 text-red-500" />;
      case 5:
        return <DoorOpen className="w-4 h-4 text-green-500" />;
      default:
        return <Coins className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getActivityText = (activity: GameActivity) => {
    switch (activity.actionType) {
      case 0: // Won
        return `Rugged ${activity.count} players and Won ${formatAmount(activity.amount)} MON`;
      case 1: // Game Finish
        return `reached 100`;
      case 2: // Join
        return `joined the game.`;
      case 3: // Gift
        return `collected a gift and got ${formatAmount(activity.amount)} $ROLL`;
      case 4: // Detour
        return `took a detour of -${formatAmount(activity.amount)} tiles`;
      case 5: // Shortcut
        return `took a shortcut of +${formatAmount(activity.amount)} tiles`;
      default:
        return `Won ${formatAmount(activity.amount)} MON`;
    }
  };

  return (
    <motion.div
      className={`bg-surface border border-accent-main/10 rounded-lg ${compact ? 'p-2' : 'p-4'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-semibold text-text-high mb-2 flex items-center`}>
        <TrendingDown className={`${compact ? 'w-3 h-3' : 'w-5 h-5'} text-red-500 mr-1`} />
        Live Game Activities
      </h3>
      
      <div className={`space-y-2 ${compact ? 'max-h-24' : 'max-h-64'} overflow-y-auto`}>
        <AnimatePresence>
          {activities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-text-low py-2"
            >
              <Clock className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} mx-auto mb-1 text-accent-main/50`} />
              <p className={`${compact ? 'text-xs' : 'text-sm'}`}>No recent activities</p>
            </motion.div>
          ) : (
            activities.map((activity, index) => (
              <motion.div
                key={`${activity.actor}-${activity.timestamp}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`bg-surface border border-accent-main/5 rounded-lg ${compact ? 'p-1.5' : 'p-3'} hover:border-accent-main/20 transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getActivityIcon(activity.actionType)}
                    <div>
                      <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-text-high`}>
                        {formatAddress(activity.actor)}
                      </p>
                      <p className={`${compact ? 'text-xs' : 'text-xs'} text-text-low`}>
                        {getActivityText(activity)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`${compact ? 'text-xs' : 'text-xs'} text-text-low`}>
                      {formatTimestamp(activity.timestamp)}
                    </p>
                    {activity.amount > 0 && (
                      <p className={`${compact ? 'text-xs' : 'text-xs'} font-medium text-success`}>
                        +{formatAmount(activity.amount)} MON
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default GameActivities; 