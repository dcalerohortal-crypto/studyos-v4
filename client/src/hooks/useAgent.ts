import { useState, useCallback } from "react";
import { chatWithAI } from "@/lib/apiClient";

export interface AgentSkill {
  name: string;
  id: string;
  description: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  duration: number;
}

export interface TrackingStats {
  today: { hours: number; sessions: number };
  week: { hours: number; sessions: number };
  month: { hours: number; sessions: number };
  bySubject: Record<string, number>;
}

export interface DriveStats {
  folder: string;
  files: number;
}

export interface ReportResult {
  success: boolean;
  message: string;
  recipient?: string;
  timestamp?: string;
}

export function useAgent(accessToken?: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get available skills
  const getSkills = useCallback(async (): Promise<AgentSkill[]> => {
    try {
      const res = await fetch("/api/agent/skills");
      const data = await res.json();
      return data.skills || [];
    } catch (err) {
      console.error("Error fetching skills:", err);
      return [];
    }
  }, []);

  // Chat with agent
  const chat = useCallback(
    async (message: string, context?: Record<string, any>) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, context }),
        });
        const data = await res.json();
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error en el agente");
        return { error };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Skill: sync_google_calendar
  const syncCalendar = useCallback(async (): Promise<CalendarEvent[]> => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch("/api/skills/calendar/sync", { headers });
      const data = await res.json();
      if (data.success) {
        return data.events;
      }
      throw new Error(data.error);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error sincronizando calendario"
      );
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Skill: send_daily_report
  const sendReport = useCallback(
    async (recipient: string, summary?: string): Promise<ReportResult> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/skills/report/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipient, summary, accessToken }),
        });
        const data = await res.json();
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error enviando reporte");
        return { success: false, message: "Error enviando reporte" };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Skill: organize_drive
  const organizeDrive = useCallback(async (): Promise<DriveStats[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/skills/drive/organize");
      const data = await res.json();
      if (data.success) {
        return data.organized;
      }
      throw new Error(data.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error organizando Drive");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Skill: auto_track_study
  const getTrackingStats =
    useCallback(async (): Promise<TrackingStats | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/skills/tracking/stats");
        const data = await res.json();
        if (data.success) {
          return data.stats;
        }
        throw new Error(data.error);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error obteniendo stats");
        return null;
      } finally {
        setLoading(false);
      }
    }, []);

  return {
    loading,
    error,
    getSkills,
    chat,
    syncCalendar,
    sendReport,
    organizeDrive,
    getTrackingStats,
  };
}
