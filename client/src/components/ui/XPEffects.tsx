import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
];

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// Confetti Effect
export function ConfettiEffect({
  active,
  particleCount = 100,
  onComplete,
}: {
  active: boolean;
  particleCount?: number;
  onComplete?: () => void;
}) {
  const [particles, setParticles] = useState<ConfettiPiece[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!active || isActive) return;

    setIsActive(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newParticles: ConfettiPiece[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: canvas.width / 2,
        y: canvas.height / 2,
        rotation: Math.random() * 360,
        vx: randomRange(-15, 15),
        vy: randomRange(-20, -5),
        color: randomColor(),
        size: randomRange(6, 12),
        life: 1,
      });
    }
    setParticles(newParticles);

    const startTime = Date.now();
    const duration = 3000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        setParticles([]);
        setIsActive(false);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      newParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // gravity
        p.rotation += p.vx * 0.5;
        p.life = 1 - elapsed / duration;
        p.size *= 0.995;

        if (p.life > 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [active]);

  if (!active && particles.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}

// Glow Effect
export function GlowEffect({
  active,
  color = "#6366f1",
  children,
}: {
  active: boolean;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0, 0.8, 0],
          }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 rounded-full blur-xl"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </AnimatePresence>
  );
}

// Pulse Effect
export function PulseEffect({
  active,
  color = "#6366f1",
  children,
}: {
  active: boolean;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{
            scale: [1, 1.5],
            opacity: [0.5, 0],
          }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </AnimatePresence>
  );
}

// Shake Effect
export function ShakeEffect({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: [-5, 5, -5, 5, 0] }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      )}
      {!active && children}
    </AnimatePresence>
  );
}

// Bounce Effect
export function BounceEffect({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ scale: 1 }}
          animate={{
            scale: [1, 1.1, 1],
            y: [0, -10, 0],
          }}
          transition={{ duration: 0.5, type: "spring", stiffness: 500 }}
        >
          {children}
        </motion.div>
      )}
      {!active && children}
    </AnimatePresence>
  );
}

// Fireworks Effect
export function FireworksEffect({
  active,
  onComplete,
}: {
  active: boolean;
  onComplete?: () => void;
}) {
  const [fireworks, setFireworks] = useState<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Generar fuegos artificiales
    const newParticles: Particle[] = [];
    const positions = [
      { x: canvas.width * 0.3, y: canvas.height * 0.4 },
      { x: canvas.width * 0.7, y: canvas.height * 0.3 },
      { x: canvas.width * 0.5, y: canvas.height * 0.5 },
    ];

    let particleId = 0;
    positions.forEach(pos => {
      for (let i = 0; i < 60; i++) {
        const angle = (Math.PI * 2 * i) / 60;
        const speed = randomRange(2, 8);
        newParticles.push({
          id: particleId++,
          x: pos.x,
          y: pos.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: randomColor(),
          size: randomRange(2, 5),
        });
      }
    });

    setFireworks(newParticles);

    const startTime = Date.now();
    const duration = 2500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration || newParticles.every(p => p.life <= 0)) {
        setFireworks([]);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      newParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.life -= 0.015;

        if (p.life > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [active]);

  if (!active && fireworks.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}

// Shimmer Effect (loading)
export function ShimmerEffect({
  active = true,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden">
      {children}
      {active && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
      )}
    </div>
  );
}

// XP Float Effect (número XP flotando)
export function XPFloatEffect({
  active,
  amount = 100,
  onComplete,
}: {
  active: boolean;
  amount?: number;
  onComplete?: () => void;
}) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ y: 0, opacity: 1, scale: 0.5 }}
          animate={{ y: -80, opacity: 0, scale: 1.2 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="fixed pointer-events-none z-50 text-2xl font-bold text-accent"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          onAnimationComplete={onComplete}
        >
          +{amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Streak Flame Effect
export function StreakFlameEffect({
  active,
  days = 7,
  onComplete,
}: {
  active: boolean;
  days?: number;
  onComplete?: () => void;
}) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: [0, 1.5, 1], rotate: [180, 0] }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="fixed pointer-events-none z-50 text-6xl"
          style={{
            left: "50%",
            top: "40%",
            transform: "translate(-50%, -50%)",
          }}
          onAnimationComplete={onComplete}
        >
          🔥
        </motion.div>
      )}
    </AnimatePresence>
  );
}
