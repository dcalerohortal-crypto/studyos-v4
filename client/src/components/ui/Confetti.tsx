"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPiece {
  id: number;
  x: number;
  rotation: number;
  color: string;
  delay: number;
}

interface ConfettiProps {
  trigger: number;
  colors?: string[];
  particleCount?: number;
  duration?: number;
  onComplete?: () => void;
}

const DEFAULT_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#3b82f6", // blue-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
];

export function Confetti({
  trigger,
  colors = DEFAULT_COLORS,
  particleCount = 50,
  duration = 3000,
  onComplete,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  const spawnConfetti = useCallback(() => {
    const newPieces: ConfettiPiece[] = Array.from(
      { length: particleCount },
      (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100 - 50,
        rotation: Math.random() * 360 - 180,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.3,
      })
    );
    setPieces(newPieces);
  }, [colors, particleCount]);

  useEffect(() => {
    if (trigger > 0) {
      spawnConfetti();
      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, spawnConfetti, duration, onComplete]);

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {pieces.map((piece, index) => (
            <motion.div
              key={piece.id}
              initial={{
                x: `50vw`,
                y: `-10vh`,
                rotate: 0,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                x: [`50vw`, `${piece.x + Math.random() * 30 - 15}vw`],
                y: ["120vh", `120vh`],
                rotate: piece.rotation * 3,
                opacity: [1, 1, 0],
                scale: [1, 1, 0.8],
              }}
              transition={{
                duration: duration / 1000,
                delay: piece.delay,
                ease: "linear",
              }}
              className="absolute w-3 h-3 rounded-sm"
              style={{ backgroundColor: piece.color }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

export function useConfetti() {
  const [trigger, setTrigger] = useState(0);

  const fire = useCallback(() => {
    setTrigger(prev => prev + 1);
  }, []);

  return {
    trigger,
    fire,
    ConfettiWrapper: (
      <Confetti trigger={trigger} onComplete={() => setTrigger(0)} />
    ),
  };
}

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  shimmerColor?: string;
}

export function ShimmerButton({
  children,
  isLoading,
  shimmerColor = "rgba(255,255,255,0.4)",
  className,
  disabled,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 transition-all hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
        }}
        initial={{ x: "-100%" }}
        animate={isLoading ? { x: "100%" } : { x: "-100%" }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 0.5,
          ease: "easeInOut",
        }}
      />
      {/* Button content */}
      <span className={isLoading ? "opacity-0" : "opacity-100"}>
        {children}
      </span>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
    </button>
  );
}

interface GlowBadgeProps {
  children: React.ReactNode;
  isActive?: boolean;
  color?: string;
}

export function GlowBadge({
  children,
  isActive = false,
  color = "#3b82f6",
}: GlowBadgeProps) {
  return (
    <motion.div
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
        isActive ? "text-white" : "bg-secondary text-muted-foreground"
      }`}
      style={isActive ? { backgroundColor: color } : {}}
      animate={
        isActive
          ? {
              boxShadow: [
                `0 0 0 0 ${color}40`,
                `0 0 20px 4px ${color}40`,
                `0 0 0 0 ${color}40`,
              ],
            }
          : {}
      }
      transition={{ duration: 2, repeat: Infinity }}
    >
      {children}
    </motion.div>
  );
}

interface PulseDotProps {
  isActive?: boolean;
  activeColor?: string;
  inactiveColor?: string;
}

export function PulseDot({
  isActive = false,
  activeColor = "#22c55e",
  inactiveColor = "#6b7280",
}: PulseDotProps) {
  return (
    <motion.div
      className="w-2 h-2 rounded-full"
      style={{ backgroundColor: isActive ? activeColor : inactiveColor }}
      animate={
        isActive
          ? {
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }
          : {}
      }
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
}
