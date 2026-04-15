import { X, Loader2, Mic, AlertCircle, CheckCircle } from "lucide-react";
import { PodcastSegment } from "@/types";

interface PodcastQueueProps {
  jobId: string;
  status: string;
  progress: number;
  onCancel: () => void;
  onComplete: (audioUrl: string, script: PodcastSegment[]) => void;
  onError: (error: string) => void;
  notebookName: string;
}

const STATUS_LABELS: Record<string, string> = {
  queued: "En cola...",
  extracting: "Extrayendo contenido...",
  "generating-script": "Generando guión...",
  "generating-audio": "Generando audio...",
  completed: "Completado",
  error: "Error",
  cancelled: "Cancelado",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  queued: <Loader2 className="w-5 h-5 animate-spin" />,
  extracting: <Loader2 className="w-5 h-5 animate-spin" />,
  "generating-script": <Loader2 className="w-5 h-5 animate-spin" />,
  "generating-audio": <Loader2 className="w-5 h-5 animate-spin" />,
  completed: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  cancelled: <X className="w-5 h-5 text-gray-400" />,
};

export default function PodcastQueue({
  jobId,
  status,
  progress,
  onCancel,
  onComplete,
  onError,
  notebookName,
}: PodcastQueueProps) {
  const isProcessing = [
    "queued",
    "extracting",
    "generating-script",
    "generating-audio",
  ].includes(status);
  const isComplete = status === "completed";
  const isError = status === "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">
                {isComplete
                  ? "Podcast listo!"
                  : isError
                    ? "Error"
                    : "Generando podcast"}
              </h2>
              <p className="text-sm text-gray-400 truncate">{notebookName}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              {STATUS_ICONS[status] || STATUS_ICONS.queued}
              <span className="text-sm text-gray-300">
                {STATUS_LABELS[status] || status}
              </span>
              {isProcessing && (
                <span className="ml-auto text-sm font-medium text-indigo-400">
                  {progress}%
                </span>
              )}
            </div>

            {isProcessing && (
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {isComplete && (
              <div className="text-sm text-green-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Audio generado correctamente
              </div>
            )}

            {isError && (
              <div className="text-sm text-red-400">
                Ha habido un problema. Inténtalo de nuevo.
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {isProcessing && (
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium transition-colors"
              >
                Cancelar
              </button>
            )}
            {isComplete && (
              <button
                onClick={() => onComplete("", [])}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium transition-all shadow-lg shadow-indigo-500/25"
              >
                Ver podcast
              </button>
            )}
            {isError && (
              <button
                onClick={() => onError("")}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium transition-colors"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-700/50">
          <p className="text-xs text-gray-500 text-center">
            Puedes cerrar esta ventana. El podcast se seguirá generando.
          </p>
        </div>
      </div>
    </div>
  );
}
