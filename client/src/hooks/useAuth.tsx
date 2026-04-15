import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthError {
  message: string;
}

interface SignUpData {
  email: string;
  password: string;
  nombre?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(
    async ({
      email,
      password,
      nombre,
    }: SignUpData): Promise<{ success: boolean; error?: string }> => {
      setLoading(true);
      setError(null);

      const sanitizedEmail = email.trim().toLowerCase();
      if (!sanitizedEmail.includes("@")) {
        setError("Email inválido");
        setLoading(false);
        return { success: false, error: "Email inválido" };
      }

      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        setLoading(false);
        return {
          success: false,
          error: "La contraseña debe tener al menos 6 caracteres",
        };
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: {
            nombre: nombre || "Estudiante",
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return { success: false, error: authError.message };
      }

      if (data.user) {
        setUser(data.user);
      }

      setLoading(false);
      return { success: true };
    },
    []
  );

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      setLoading(true);
      setError(null);

      const sanitizedEmail = email.trim().toLowerCase();
      if (!sanitizedEmail.includes("@")) {
        setError("Email inválido");
        setLoading(false);
        return { success: false, error: "Email inválido" };
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: sanitizedEmail,
          password,
        }
      );

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return { success: false, error: authError.message };
      }

      if (data.user) {
        setUser(data.user);
      }

      setLoading(false);
      return { success: true };
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    clearError,
    isAuthenticated: !!user,
  };
}
