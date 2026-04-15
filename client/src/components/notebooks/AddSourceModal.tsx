import { useState } from "react";
import { Link, Youtube, Globe, Loader } from "lucide-react";
import { isYouTubeURL, isURL } from "@/lib/contentProcessor";
import { URLSource } from "@/types";

interface AddSourceModalProps {
  onAdd: (source: URLSource) => void;
  onClose: () => void;
}

export default function AddSourceModal({
  onAdd,
  onClose,
}: AddSourceModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError("Introduce una URL");
      return;
    }

    const trimmedUrl = url.trim();

    if (!isURL(trimmedUrl)) {
      setError("URL no válida");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let type: URLSource["type"] = "url";
      let name = trimmedUrl;

      if (isYouTubeURL(trimmedUrl)) {
        type = "youtube";
        const videoId = extractYouTubeVideoId(trimmedUrl);
        name = `YouTube: ${videoId || "Video"}`;
      } else {
        try {
          const urlObj = new URL(trimmedUrl);
          name = urlObj.hostname + urlObj.pathname;
        } catch {
          name = trimmedUrl;
        }
      }

      onAdd({
        id: `url_${Date.now()}`,
        type,
        name,
        url: trimmedUrl,
        addedAt: new Date().toISOString(),
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar URL");
    } finally {
      setLoading(false);
    }
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Añadir fuente de contenido
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              URL (YouTube, web, etc.)
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-secondary text-foreground rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Ejemplos:</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500" />
                <span>https://www.youtube.com/watch?v=...</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <span>https://es.wikipedia.org/wiki/...</span>
              </div>
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-green-500" />
                <span>Cualquier página web con contenido</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !url.trim()}
            className="flex-1 px-4 py-2 bg-accent hover:bg-accent/80 text-accent-foreground rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}
