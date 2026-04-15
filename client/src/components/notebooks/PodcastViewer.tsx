import { useState, useRef, useEffect } from "react";
import { GeneratedContent, PodcastSegment } from "@/types";
import { Play, Pause, RotateCcw, Volume2, Loader } from "lucide-react";

interface PodcastViewerProps {
  content: GeneratedContent;
  onClose: () => void;
}

interface AudioContent {
  audioUrl: string;
  script: {
    segments: PodcastSegment[];
  };
}

export default function PodcastViewer({
  content,
  onClose,
}: PodcastViewerProps) {
  const audioContent = content.content as AudioContent;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const segments = audioContent.script?.segments || [];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      const pct = (audio.currentTime / audio.duration) * 100;
      setProgress(pct);

      const segmentDuration = audio.duration / segments.length;
      const currentSeg = Math.floor(audio.currentTime / segmentDuration);
      setCurrentSegment(Math.min(currentSeg, segments.length - 1));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentSegment(0);
      setProgress(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [segments.length]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentSegment(0);
    setProgress(0);
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    return formatTime(seconds);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <audio ref={audioRef} src={audioContent.audioUrl} preload="metadata" />

      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {content.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Podcast educativo · {segments.length} segmentos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {segments.map((segment, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl transition-all duration-300 ${
                index === currentSegment && isPlaying
                  ? "bg-accent/20 border-2 border-accent scale-[1.02]"
                  : index === currentSegment
                    ? "bg-accent/10 border border-accent/40"
                    : "bg-secondary/50 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    segment.speaker === "host1" ? "bg-blue-500" : "bg-pink-500"
                  }`}
                />
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  {segment.speaker === "host1"
                    ? "Presentador 1"
                    : "Presentadora 2"}
                </span>
                {index === currentSegment && isPlaying && (
                  <span className="flex items-center gap-1 text-xs text-accent">
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    Reproduciendo
                  </span>
                )}
              </div>
              <p className="text-foreground leading-relaxed">{segment.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border-t border-border bg-card">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent/60 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>
                {audioRef.current
                  ? formatTime(audioRef.current.currentTime)
                  : "0:00"}
              </span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={restart}
              className="p-3 bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
              title="Reiniciar"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!isLoaded}
              className="p-5 bg-accent hover:bg-accent/90 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50"
            >
              {isLoaded ? (
                isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-0.5" />
                )
              ) : (
                <Loader className="w-6 h-6 text-white animate-spin" />
              )}
            </button>

            <div className="w-12" />
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Audio generado con Microsoft Edge TTS · Sin límites de uso
          </p>
        </div>
      </div>
    </div>
  );
}
