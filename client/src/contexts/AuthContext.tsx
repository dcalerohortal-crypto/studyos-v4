import { createContext, useContext, type ReactNode } from "react";
import { useAuth, type useAuth as useAuthType } from "@/hooks/useAuth";

interface AuthContextType {
  user: ReturnType<typeof useAuthType>["user"];
  session: ReturnType<typeof useAuthType>["session"];
  loading: boolean;
  error: string | null;
  signUp: ReturnType<typeof useAuthType>["signUp"];
  signIn: ReturnType<typeof useAuthType>["signIn"];
  signOut: ReturnType<typeof useAuthType>["signOut"];
  clearError: ReturnType<typeof useAuthType>["clearError"];
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
