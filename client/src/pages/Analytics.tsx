import { useGameState, getLast7DaysXP } from "@/hooks/useGameState";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SUBJECTS, LEVEL_UP_THRESHOLD } from "@/../../shared/const";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { TrendingUp, Target, Zap, Flame } from "lucide-react";
import { StatsCard } from "@/components/ui/StatsCard";
import { Habit } from "@/types";

export default function Analytics() {
  const { profile, subjectsXP, activityLog } = useGameState();
  const [habits] = useLocalStorage<Habit[]>("studyos_habits", []);

  // Radar Chart data - Habilidades por materia
  const radarData = SUBJECTS.map(subject => ({
    subject: subject.nombre,
    xp: subjectsXP[subject.id]?.xp_total || 0,
    nivel: subjectsXP[subject.id]?.nivel || 1,
    fill: subject.color,
  }));

  // Datos para gráfica de XP por materia
  const subjectData = SUBJECTS.map(subject => ({
    name: subject.nombre,
    xp: subjectsXP[subject.id]?.xp_total || 0,
    fill: subject.color,
  }));

  // Datos para gráfica de distribución de XP
  const totalXP = Object.values(subjectsXP).reduce(
    (sum, s) => sum + (s?.xp_total || 0),
    0
  );
  const distributionData = SUBJECTS.map(subject => ({
    name: subject.nombre,
    value: subjectsXP[subject.id]?.xp_total || 0,
    fill: subject.color,
  })).filter(d => d.value > 0);

  // Datos de tendencia semanal (reales)
  const weeklyData = getLast7DaysXP(activityLog);

  // Estadísticas
  const stats = [
    {
      label: "XP Esta Semana",
      value: weeklyData.reduce((sum, d) => sum + d.xp, 0),
      icon: Zap,
      color: "text-blue-500",
    },
    {
      label: "Promedio Diario",
      value: Math.round(weeklyData.reduce((sum, d) => sum + d.xp, 0) / 7),
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Materia Líder",
      value:
        SUBJECTS.find(
          s =>
            s.id ===
            Object.entries(subjectsXP).sort(
              ([, a], [, b]) => (b?.xp_total || 0) - (a?.xp_total || 0)
            )[0]?.[0]
        )?.nombre || "N/A",
      icon: Target,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Estadísticas
        </h1>
        <p className="text-muted-foreground">
          Análisis detallado de tu progreso
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="XP Esta Semana"
          value={weeklyData.reduce((sum, d) => sum + d.xp, 0)}
          icon={Zap}
          color="#3B82F6"
        />
        <StatsCard
          title="Promedio Diario"
          value={Math.round(weeklyData.reduce((sum, d) => sum + d.xp, 0) / 7)}
          icon={TrendingUp}
          color="#10B981"
        />
        <StatsCard
          title="Materia Líder"
          value={
            SUBJECTS.find(
              s =>
                s.id ===
                Object.entries(subjectsXP).sort(
                  ([, a], [, b]) => (b?.xp_total || 0) - (a?.xp_total || 0)
                )[0]?.[0]
            )?.nombre || "N/A"
          }
          icon={Target}
          color="#8B5CF6"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* XP por Materia - Bar Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            XP Acumulado por Materia
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
              <XAxis dataKey="name" stroke="#A1A1AA" />
              <YAxis stroke="#A1A1AA" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181B",
                  border: "1px solid #27272A",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#F5F5F5" }}
              />
              <Bar dataKey="xp" radius={[8, 8, 0, 0]}>
                {subjectData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución de XP - Pie Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Distribución de XP
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181B",
                  border: "1px solid #27272A",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#F5F5F5" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tendencia Semanal */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Tendencia Semanal
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
            <XAxis dataKey="day" stroke="#A1A1AA" />
            <YAxis stroke="#A1A1AA" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181B",
                border: "1px solid #27272A",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#F5F5F5" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="xp"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: "#3B82F6", r: 4 }}
              activeDot={{ r: 6 }}
              name="XP Ganado"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Radar Chart - Habilidades + Heatmap Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Radar Chart - Habilidades por materia */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Radar de Habilidades
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#27272A" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#A1A1AA", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, "auto"]}
                tick={{ fill: "#A1A1AA", fontSize: 10 }}
              />
              <Radar
                name="XP"
                dataKey="xp"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181B",
                  border: "1px solid #27272A",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#F5F5F5" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Habit Heatmap */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Hábit Heatmap
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tu actividad de hábitos en los últimos 30 días
            </p>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i));
                const dateStr = date.toISOString().split("T")[0];
                const completedCount = habits.filter(h =>
                  h.completedDates.includes(dateStr)
                ).length;
                const maxCount = habits.length || 1;
                const intensity = completedCount / maxCount;

                let bgClass = "bg-secondary";
                if (intensity > 0.75) bgClass = "bg-accent";
                else if (intensity > 0.5) bgClass = "bg-accent/70";
                else if (intensity > 0.25) bgClass = "bg-accent/40";
                else if (intensity > 0) bgClass = "bg-accent/20";

                return (
                  <div
                    key={i}
                    className={`h-6 w-6 rounded-sm ${bgClass} cursor-pointer hover:ring-2 hover:ring-accent transition-all`}
                    title={`${dateStr}: ${completedCount}/${habits.length} hábitos`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
              <span>Menos</span>
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-sm bg-secondary" />
                <div className="h-3 w-3 rounded-sm bg-accent/20" />
                <div className="h-3 w-3 rounded-sm bg-accent/40" />
                <div className="h-3 w-3 rounded-sm bg-accent/70" />
                <div className="h-3 w-3 rounded-sm bg-accent" />
              </div>
              <span>Más</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="glass-card p-6 mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          📊 Insights
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            • Tu materia más fuerte es{" "}
            <strong className="text-foreground">
              {
                SUBJECTS.find(
                  s =>
                    s.id ===
                    Object.entries(subjectsXP).sort(
                      ([, a], [, b]) => (b?.xp_total || 0) - (a?.xp_total || 0)
                    )[0]?.[0]
                )?.nombre
              }
            </strong>
          </p>
          <p>
            • Necesitas{" "}
            <strong className="text-foreground">
              {LEVEL_UP_THRESHOLD - (profile.xpTotal % LEVEL_UP_THRESHOLD)} XP
            </strong>{" "}
            para el siguiente nivel
          </p>
          <p>
            • Tu promedio diario es de{" "}
            <strong className="text-foreground">
              {Math.round(weeklyData.reduce((sum, d) => sum + d.xp, 0) / 7)} XP
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}
