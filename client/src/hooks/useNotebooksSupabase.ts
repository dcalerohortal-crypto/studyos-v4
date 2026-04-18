import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  Notebook,
  NotebookDocument,
  GeneratedContent,
  ChatMessage,
  URLSource,
} from "@/types";

const LOCAL_STORAGE_KEY = "studyos_notebooks";

interface SupabaseNotebook {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  documents: any;
  generated_content: any;
  url_sources: any;
  chat_history: any;
  created_at: string;
  updated_at: string;
}

function toNotebook(row: SupabaseNotebook): Notebook {
  return {
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    description: row.description || undefined,
    documents: Array.isArray(row.documents) ? row.documents : [],
    generatedContent: Array.isArray(row.generated_content)
      ? row.generated_content
      : [],
    chatHistory: Array.isArray(row.chat_history) ? row.chat_history : [],
    urlSources: Array.isArray(row.url_sources) ? row.url_sources : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSupabaseRow(notebook: Notebook, userId: string) {
  return {
    id: notebook.id,
    user_id: userId,
    subject_id: notebook.subjectId,
    name: notebook.name,
    description: notebook.description || null,
    documents: notebook.documents || [],
    generated_content: notebook.generatedContent || [],
    url_sources: notebook.urlSources || [],
    chat_history: notebook.chatHistory || [],
    updated_at: new Date().toISOString(),
  };
}

export function useNotebooksSupabase() {
  const { user } = useAuthContext();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [migrated, setMigrated] = useState(false);

  // Load notebooks from Supabase
  const fetchNotebooks = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("notebooks")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching notebooks:", fetchError);
        setError(fetchError.message);
        // Fallback to localStorage
        fallbackToLocalStorage();
        return;
      }

      const mapped = (data || []).map(toNotebook);
      setNotebooks(mapped);
      setError(null);
    } catch (err) {
      console.error("Error fetching notebooks:", err);
      fallbackToLocalStorage();
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fallback to localStorage if Supabase is not available
  const fallbackToLocalStorage = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Notebook[];
        setNotebooks(parsed);
      }
    } catch {
      setNotebooks([]);
    }
  };

  // Migrate localStorage data to Supabase on first login
  const migrateFromLocalStorage = useCallback(async () => {
    if (!user?.id || migrated) return;

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) {
        setMigrated(true);
        return;
      }

      const localNotebooks = JSON.parse(stored) as Notebook[];
      if (localNotebooks.length === 0) {
        setMigrated(true);
        return;
      }

      // Check if user already has notebooks in Supabase
      const { data: existing } = await supabase
        .from("notebooks")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        // User already has notebooks, skip migration
        setMigrated(true);
        return;
      }

      // Migrate each notebook
      const rows = localNotebooks.map((nb) => toSupabaseRow(nb, user.id));

      const { error: insertError } = await supabase
        .from("notebooks")
        .upsert(rows, { onConflict: "id" });

      if (insertError) {
        console.error("Migration error:", insertError);
        // Keep localStorage as fallback
      } else {
        console.log(
          `✅ Migrados ${localNotebooks.length} cuadernos a Supabase`
        );
        // Don't remove localStorage yet — keep as backup
      }

      setMigrated(true);
    } catch (err) {
      console.error("Migration error:", err);
      setMigrated(true);
    }
  }, [user?.id, migrated]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      migrateFromLocalStorage().then(() => fetchNotebooks());
    } else {
      fallbackToLocalStorage();
      setLoading(false);
    }
  }, [user?.id]);

  // Also sync to localStorage as backup
  const syncToLocalStorage = (nbs: Notebook[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nbs));
    } catch {}
  };

  const createNotebook = useCallback(
    async (name: string, subjectId: string, description?: string) => {
      const newNotebook: Notebook = {
        id: `notebook_${Date.now()}`,
        subjectId,
        name,
        description,
        documents: [],
        chatHistory: [],
        generatedContent: [],
        urlSources: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update
      const updated = [newNotebook, ...notebooks];
      setNotebooks(updated);
      syncToLocalStorage(updated);

      if (user?.id) {
        const { error: insertError } = await supabase
          .from("notebooks")
          .insert(toSupabaseRow(newNotebook, user.id));

        if (insertError) {
          console.error("Error creating notebook:", insertError);
          setError(insertError.message);
        }
      }

      return newNotebook;
    },
    [notebooks, user?.id]
  );

  const updateNotebook = useCallback(
    async (updated: Notebook) => {
      const newNotebooks = notebooks.map((n) =>
        n.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : n
      );
      setNotebooks(newNotebooks);
      syncToLocalStorage(newNotebooks);

      if (user?.id) {
        const { error: updateError } = await supabase
          .from("notebooks")
          .update(toSupabaseRow(updated, user.id))
          .eq("id", updated.id)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error updating notebook:", updateError);
        }
      }
    },
    [notebooks, user?.id]
  );

  const deleteNotebook = useCallback(
    async (notebookId: string) => {
      const filtered = notebooks.filter((n) => n.id !== notebookId);
      setNotebooks(filtered);
      syncToLocalStorage(filtered);

      if (user?.id) {
        const { error: deleteError } = await supabase
          .from("notebooks")
          .delete()
          .eq("id", notebookId)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("Error deleting notebook:", deleteError);
        }
      }
    },
    [notebooks, user?.id]
  );

  return {
    notebooks,
    loading,
    error,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    refresh: fetchNotebooks,
  };
}
