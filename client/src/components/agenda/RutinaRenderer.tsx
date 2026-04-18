import { useState } from "react";
import { Rutina } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Zap, CheckCircle2, Clock, Dumbbell, BookOpen, Heart, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  rutina: Rutina;
}

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const CATEGORY_CONFIG: Record<string, { icon: typeof Zap; color: string; label: string }> = {
  deporte: { icon: Dumbbell, color: "#EF4444", label: "Deporte" },
  estudio: { icon: BookOpen, color: "#3B82F6", label: "Estudio" },
  salud: { icon: Heart, color: "#10B981", label: "Salud" },
  mente: { icon: Brain, color: "#F59E0B", label: "Mente" },
};

function distributeSteps(pasos: string[]): Record<string, string[]> {
  const schedule: Record<string, string[]> = {};
  DAYS.forEach((day) => (schedule[day] = []));

  pasos.forEach((paso, idx) => {
    const dayIndex = idx % DAYS.length;
    schedule[DAYS[dayIndex]].push(paso);
  });

  return schedule;
}

function estimateXP(paso: string): number {
  const lower = paso.toLowerCase();
  if (lower.includes("descanso") || lower.includes("estirar")) return 10;
  if (lower.includes("repas") || lower.includes("lectura")) return 25;
  if (lower.includes("ejercicio") || lower.includes("entrenamiento")) return 40;
  if (lower.includes("test") || lower.includes("examen")) return 50;
  return 20;
}

export default function RutinaRenderer({ rutina }: Props) {
  const [activated, setActivated] = useState(false);
  const [routines, setRoutines] = useLocalStorage<Rutina[]>(
    "studyos_routines",
    []
  );

  const config = CATEGORY_CONFIG[rutina.tipo] || CATEGORY_CONFIG.estudio;
  const CategoryIcon = config.icon;
  const schedule = distributeSteps(rutina.pasos);

  const chartData = DAYS.map((day) => ({
    day,
    tareas: schedule[day].length,
    xp: schedule[day].reduce((sum, paso) => sum + estimateXP(paso), 0),
  }));

  const totalXP = chartData.reduce((sum, d) => sum + d.xp, 0);

  const handleActivate = async () => {
    // Add to localStorage routines
    const exists = routines.some((r) => r.id === rutina.id);
    if (!exists) {
      setRoutines([...routines, rutina]);
    }

    setActivated(true);

    // Fire confetti
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3B82F6", "#6366f1", "#8B5CF6", "#10B981"],
      });
    } catch {
      // canvas-confetti not available, skip
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-5 space-y-4 mt-2"
      style={{ fontFamily: "Outfit, sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <CategoryIcon
              className="w-5 h-5"
              style={{ color: config.color }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-base">
              {rutina.nombre}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${config.color}20`,
                  color: config.color,
                }}
              >
                {config.label}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {rutina.duracion}
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                {totalXP} XP total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metodología */}
      <div className="text-xs text-muted-foreground bg-secondary/30 px-3 py-2 rounded-lg">
        <span className="font-medium text-foreground">Metodología:</span>{" "}
        {rutina.metodologia}
      </div>

      {/* Weekly Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="px-2 py-2 text-muted-foreground font-medium text-center border-b border-border"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {DAYS.map((day) => (
                <td
                  key={day}
                  className="px-1 py-2 align-top border-b border-border"
                >
                  <div className="space-y-1 min-h-[40px]">
                    {schedule[day].map((paso, idx) => (
                      <div
                        key={idx}
                        className="bg-secondary/50 rounded px-1.5 py-1 text-[10px] text-foreground leading-tight"
                      >
                        <span className="block truncate max-w-[80px]">
                          {paso.replace(/^Paso \d+:\s*/i, "")}
                        </span>
                        <span className="flex items-center gap-0.5 text-yellow-500 mt-0.5">
                          <Zap className="w-2.5 h-2.5" />
                          {estimateXP(paso)}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Chart */}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2">
          Carga de trabajo por día
        </h4>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
            <XAxis
              dataKey="day"
              stroke="#A1A1AA"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              stroke="#A1A1AA"
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181B",
                border: "1px solid #27272A",
                borderRadius: "8px",
                fontSize: "11px",
              }}
              labelStyle={{ color: "#F5F5F5" }}
              formatter={(value: number, name: string) =>
                name === "xp" ? [`${value} XP`, "XP"] : [value, "Tareas"]
              }
            />
            <Bar
              dataKey="xp"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              name="xp"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Activate Button */}
      <AnimatePresence mode="wait">
        {!activated ? (
          <motion.button
            key="activate"
            onClick={handleActivate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Activar rutina
          </motion.button>
        ) : (
          <motion.div
            key="activated"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full py-3 bg-green-500/20 text-green-400 font-semibold rounded-xl flex items-center justify-center gap-2 border border-green-500/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            Rutina activada
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
