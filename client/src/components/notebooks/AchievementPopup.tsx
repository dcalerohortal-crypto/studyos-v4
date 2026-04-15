import { Achievement } from "@/types";
import { Trophy, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AchievementPopupProps {
  achievement: Achievement | null;
  show: boolean;
  onDismiss: () => void;
}

export default function AchievementPopup({
  achievement,
  show,
  onDismiss,
}: AchievementPopupProps) {
  return (
    <AnimatePresence>
      {show && achievement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onDismiss}
          />

          {/* Popup */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="relative glass-card p-8 max-w-sm w-full text-center"
          >
            {/* Confetti decoration */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="flex gap-1">
                {["⭐", "🏆", "✨", "🎉", "⭐"].map((emoji, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-2xl"
                  >
                    {emoji}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Trophy Icon */}
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-4xl">{achievement.icon}</span>
            </div>

            {/* Title */}
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-bold text-foreground mb-2"
            >
              ¡LOGRO DESBLOQUEADO!
            </motion.h2>

            {/* Achievement Name */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-4"
            >
              <p className="text-2xl font-bold text-accent">
                {achievement.icon} {achievement.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {achievement.description}
              </p>
            </motion.div>

            {/* XP Bonus */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full mb-6"
            >
              <span className="text-accent font-bold">
                +{achievement.xpBonus} XP
              </span>
            </motion.div>

            {/* Dismiss Button */}
            <button
              onClick={onDismiss}
              className="w-full py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-foreground font-medium transition-colors"
            >
              Continuar estudiando
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
