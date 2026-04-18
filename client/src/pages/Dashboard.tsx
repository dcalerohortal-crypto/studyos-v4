import { useGameState, getLast7DaysXP } from "@/hooks/useGameState";
import { SUBJECTS, LEVEL_UP_THRESHOLD } from "@/../../shared/const";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Zap, Star, Flame } from "lucide-react";
import { StatsCard } from "@/components/ui/StatsCard";

export default function Dashboard() {
  const { profile, subjectsXP, activityLog } = useGameState();

  // Datos para la gráfica de XP por materia
  const subjectChartData = SUBJECTS.map(subject => ({
    name: subject.nombre.slice(0, 3),
    xp: subjectsXP[subject.id]?.xp_total || 0,
    color: subject.color,
  }));

  // Datos para la gráfica de actividad reciente (últimos 7 días)
  const activityData = getLast7DaysXP(activityLog);

  const xpToNextLevel =
    LEVEL_UP_THRESHOLD - (profile.xpTotal % LEVEL_UP_THRESHOLD);
  const xpProgress =
    ((profile.xpTotal % LEVEL_UP_THRESHOLD) / LEVEL_UP_THRESHOLD) * 100;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Hola, {profile.nombre}
        </h1>
        <p className="text-muted-foreground">{profile.curso}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="Nivel"
          value={profile.nivel}
          icon={Star}
          color="#6366f1"
        />
        <StatsCard
          title="XP Total"
          value={profile.xpTotal}
          icon={Zap}
          color="#3B82F6"
        />
        <StatsCard
          title="Racha"
          value={profile.racha}
          icon={Flame}
          color="#EF4444"
          trend={profile.racha > 0 ? { value: 10, positive: true } : undefined}
        />
      </div>

      {/* XP Progress */}
      <div className="glass-card p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Progreso al Siguiente Nivel
          </h2>
          <span className="text-sm text-muted-foreground">
            {xpToNextLevel} XP restantes
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* XP por Materia */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            XP por Materia
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectChartData}>
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
              <Bar dataKey="xp" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Actividad Reciente */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Actividad (Últimos 7 días)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
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
              <Line
                type="monotone"
                dataKey="xp"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6 mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Actividad Reciente
        </h2>
        <div className="space-y-3">
          {activityLog.slice(0, 5).map((activity, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 pb-3 border-b border-border last:border-0"
            >
              <div className="p-2 bg-accent/10 rounded-lg">
                <Zap className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-foreground text-sm">{activity.texto}</p>
                <p className="text-muted-foreground text-xs">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </p>
              </div>
              {activity.xpGanado && (
                <span className="text-accent font-semibold">
                  +{activity.xpGanado} XP
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
