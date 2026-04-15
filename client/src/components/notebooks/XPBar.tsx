import { NOTEBOOK_LEVELS } from "@/types";
import { Zap, Star } from "lucide-react";

interface XPBarProps {
  level: number;
  xp: number;
  currentSessionXP?: number;
  showSession?: boolean;
  compact?: boolean;
}

export default function XPBar({
  level,
  xp,
  currentSessionXP = 0,
  showSession = false,
  compact = false,
}: XPBarProps) {
  const currentLevelIndex = NOTEBOOK_LEVELS.findIndex(l => l.level === level);
  const currentLevel = NOTEBOOK_LEVELS[currentLevelIndex];
  const nextLevel = NOTEBOOK_LEVELS[currentLevelIndex + 1];

  const xpInLevel = xp - currentLevel.xpRequired;
  const xpForNextLevel = nextLevel
    ? nextLevel.xpRequired - currentLevel.xpRequired
    : xpInLevel;
  const percentage = nextLevel
    ? Math.min(100, (xpInLevel / xpForNextLevel) * 100)
    : 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-accent/20 rounded-lg">
          <Star className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-bold text-accent">Lv.{level}</span>
        </div>
        <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-foreground">
                Nivel {level}
              </span>
              <span className="text-xs text-muted-foreground">
                ({currentLevel.title})
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {nextLevel
                ? `${xpInLevel} / ${xpForNextLevel} XP para nivel ${level + 1}`
                : "Máximo nivel alcanzado"}
            </p>
          </div>
        </div>

        {showSession && currentSessionXP > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-accent/20 rounded-lg">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-bold text-accent">
              +{currentSessionXP}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Total XP */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-muted-foreground">Total: {xp} XP</span>
        {nextLevel && (
          <span className="text-xs text-muted-foreground">
            {nextLevel.xpRequired - xp} XP restantes
          </span>
        )}
      </div>
    </div>
  );
}
