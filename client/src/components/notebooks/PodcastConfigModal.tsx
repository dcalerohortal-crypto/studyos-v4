import { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Mic,
  Save,
  Clock,
  Languages,
  Target,
  Volume2,
  Zap,
  MessageCircle,
  BookOpen,
  Users,
  GraduationCap,
  Code,
  FileText,
} from "lucide-react";

export type PodcastFormat =
  | "detailed"
  | "brief"
  | "critical"
  | "debate"
  | "tutorial"
  | "entrevista"
  | "tecnico";

export type PodcastLanguage = "es" | "en" | "ca" | "gl" | "eu";

export interface PodcastConfig {
  format: PodcastFormat;
  language: PodcastLanguage;
  duration: number;
  focus: string;
}

export interface PodcastPreset {
  id: string;
  name: string;
  config: PodcastConfig;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: PodcastConfig) => void;
  initialConfig?: PodcastConfig;
}

const FORMAT_OPTIONS: {
  id: PodcastFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: "detailed",
    label: "Información detallada",
    description:
      "Conversación animada que analiza y conecta temas en profundidad",
    icon: <FileText className="w-5 h-5" />,
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "brief",
    label: "Breve",
    description: "Resumen rápido para captar las ideas principales",
    icon: <Zap className="w-5 h-5" />,
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "critical",
    label: "Crítica",
    description: "Revisión experta con comentarios constructivos",
    icon: <MessageCircle className="w-5 h-5" />,
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "debate",
    label: "Debate",
    description: "Dos presentadores con perspectivas opuestas",
    icon: <Users className="w-5 h-5" />,
    color: "from-red-500 to-pink-500",
  },
  {
    id: "tutorial",
    label: "Tutorial",
    description: "Explicación paso a paso para aprender procesos",
    icon: <GraduationCap className="w-5 h-5" />,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "entrevista",
    label: "Entrevista",
    description: "Un presentador entrevista al otro sobre el tema",
    icon: <Mic className="w-5 h-5" />,
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "tecnico",
    label: "Técnico",
    description: "Análisis profundo nivel universitario o profesional",
    icon: <Code className="w-5 h-5" />,
    color: "from-gray-600 to-gray-700",
  },
];

const LANGUAGE_OPTIONS: { id: PodcastLanguage; label: string }[] = [
  { id: "es", label: "Español" },
  { id: "en", label: "English" },
  { id: "ca", label: "Català" },
  { id: "gl", label: "Galego" },
  { id: "eu", label: "Euskara" },
];

const PRESETS_KEY = "studyos_podcast_presets";

const DEFAULT_CONFIG: PodcastConfig = {
  format: "detailed",
  language: "es",
  duration: 5,
  focus: "",
};

export default function PodcastConfigModal({
  isOpen,
  onClose,
  onConfirm,
  initialConfig,
}: Props) {
  const [config, setConfig] = useState<PodcastConfig>(
    initialConfig || DEFAULT_CONFIG
  );
  const [presetName, setPresetName] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [presets, setPresets] = useState<PodcastPreset[]>([]);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(PRESETS_KEY);
      if (saved) {
        try {
          setPresets(JSON.parse(saved));
        } catch {
          setPresets([]);
        }
      }
      if (initialConfig) {
        setConfig(initialConfig);
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(config);
    onClose();
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert("Introduce un nombre para el preset");
      return;
    }
    const newPreset: PodcastPreset = {
      id: `preset_${Date.now()}`,
      name: presetName.trim(),
      config: { ...config },
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
    setPresetName("");
    alert(`Preset "${newPreset.name}" guardado`);
  };

  const handleLoadPreset = (preset: PodcastPreset) => {
    setConfig(preset.config);
    setShowPresets(false);
  };

  const handleDeletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
  };

  const handleClose = () => {
    setPresetName("");
    setShowPresets(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  const updateConfig = <K extends keyof PodcastConfig>(
    key: K,
    value: PodcastConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const durationQuickButtons = [
    { label: "2 min", value: 2 },
    { label: "5 min", value: 5 },
    { label: "10 min", value: 10 },
    { label: "15 min", value: 15 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border bg-gradient-to-r from-orange-500/10 to-transparent flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Mic className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  Configurar Podcast
                </h2>
                <p className="text-xs text-muted-foreground">
                  Personaliza el formato, duración y enfoque
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Presets Section */}
          {presets.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="w-full px-4 py-3 bg-secondary/30 hover:bg-secondary/50 flex items-center justify-between text-sm font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Presets guardados ({presets.length})
                </span>
                <span className="text-muted-foreground">
                  {showPresets ? "▲" : "▼"}
                </span>
              </button>
              {showPresets && (
                <div className="divide-y divide-border">
                  {presets.map(preset => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between px-4 py-2 hover:bg-secondary/20"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{preset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {
                            FORMAT_OPTIONS.find(
                              f => f.id === preset.config.format
                            )?.label
                          }{" "}
                          • {preset.config.duration} min
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadPreset(preset)}
                          className="px-3 py-1 text-xs bg-accent text-accent-foreground rounded hover:bg-accent/80 transition-colors"
                        >
                          Usar
                        </button>
                        <button
                          onClick={() => handleDeletePreset(preset.id)}
                          className="px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Format Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <Volume2 className="w-4 h-4" />
              Formato del podcast
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FORMAT_OPTIONS.map(format => (
                <button
                  key={format.id}
                  onClick={() => updateConfig("format", format.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    config.format === format.id
                      ? `border-transparent bg-gradient-to-r ${format.color} text-white`
                      : "border-border bg-secondary/30 hover:bg-secondary/50 hover:border-accent/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={
                        config.format === format.id
                          ? "text-white"
                          : "text-accent"
                      }
                    >
                      {format.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-semibold text-sm ${config.format === format.id ? "" : "text-foreground"}`}
                      >
                        {format.label}
                      </p>
                      <p
                        className={`text-xs mt-0.5 line-clamp-2 ${config.format === format.id ? "text-white/80" : "text-muted-foreground"}`}
                      >
                        {format.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <Languages className="w-4 h-4" />
              Idioma
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => updateConfig("language", lang.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    config.language === lang.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary/50 hover:bg-secondary text-foreground"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <Clock className="w-4 h-4" />
              Duración estimada
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={config.duration}
                  onChange={e =>
                    updateConfig("duration", parseInt(e.target.value))
                  }
                  className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <span className="w-16 text-center font-semibold text-accent">
                  {config.duration} min
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {durationQuickButtons.map(btn => (
                  <button
                    key={btn.value}
                    onClick={() => updateConfig("duration", btn.value)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                      config.duration === btn.value
                        ? "bg-orange-500 text-white"
                        : "bg-secondary/50 hover:bg-secondary text-muted-foreground"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Focus Text */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <Target className="w-4 h-4" />
              Enfoque personalizado (opcional)
            </label>
            <textarea
              value={config.focus}
              onChange={e => updateConfig("focus", e.target.value)}
              placeholder="Ej: Enfócate en la fotosíntesis y el ciclo de Krebs. Explica con ejemplos cotidianos..."
              className="w-full h-24 px-4 py-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none transition-all"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {config.focus ? (
                <span className="text-accent/80">
                  Podcast enfocado en: <strong>"{config.focus}"</strong>
                </span>
              ) : (
                "Deja vacío para un resumen general del contenido"
              )}
            </p>
          </div>

          {/* Save Preset */}
          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <Save className="w-4 h-4" />
              Guardar como preset
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                placeholder="Nombre del preset..."
                className="flex-1 px-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                onKeyDown={e => e.key === "Enter" && handleSavePreset()}
              />
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 text-sm font-medium bg-secondary hover:bg-secondary/80 disabled:opacity-50 rounded-lg transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border bg-secondary/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {FORMAT_OPTIONS.find(f => f.id === config.format)?.label}
              </span>
              {" • "}
              <span>
                {LANGUAGE_OPTIONS.find(l => l.id === config.language)?.label}
              </span>
              {" • "}
              <span>{config.duration} min</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Sparkles className="w-4 h-4" />
                Generar Podcast
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
