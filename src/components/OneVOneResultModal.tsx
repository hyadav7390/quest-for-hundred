import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Trophy, Frown, Sparkles } from 'lucide-react';

interface OneVOneResultModalProps {
  open: boolean;
  onClose: () => void;
  variant: 'win' | 'lose';
  payoutFormatted?: string;
  feeFormatted?: string;
  opponentAddress?: string | null;
}

const OneVOneResultModal = ({
  open,
  onClose,
  variant,
  payoutFormatted,
  feeFormatted,
  opponentAddress,
}: OneVOneResultModalProps) => {
  const isWin = variant === 'win';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-surface border border-accent-main/25 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-heading">
            {isWin ? (
              <motion.span
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-r from-accent-main to-blue-500"
              >
                <Trophy className="w-8 h-8 text-white" />
              </motion.span>
            ) : (
              <motion.span
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-r from-red-500 to-rose-500"
              >
                <Frown className="w-8 h-8 text-white" />
              </motion.span>
            )}
            {isWin ? 'Victory!' : 'Defeat'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <p className="text-white/80">
            {isWin
              ? 'You reached the finish first. Rewards are on their way!'
              : 'Tough luck this time. Regroup and try another match.'}
          </p>

          {opponentAddress && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-3 text-sm">
              <p className="text-white/60">Opponent</p>
              <p className="text-white font-semibold">{opponentAddress}</p>
            </div>
          )}

          {isWin && (
            <div className="bg-black/30 border border-accent-main/30 rounded-lg p-4 space-y-3">
              <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="text-white/70 text-sm">Payout (after fee)</span>
                <span className="text-xl font-bold text-accent-main">{payoutFormatted} MON</span>
              </motion.div>
              {feeFormatted && (
                <motion.div
                  className="flex items-center justify-between text-sm text-white/60"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <span>Platform fee</span>
                  <span>{feeFormatted} MON</span>
                </motion.div>
              )}
              <motion.div
                className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/60"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-3 h-3 text-accent-main" />
                Rewards sent automatically to your wallet
              </motion.div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm font-semibold"
          >
            {isWin ? 'Awesome!' : 'Rematch'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OneVOneResultModal;
