import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, PublicRoute } from "./components/auth/ProtectedRoute";
import LoginPage from "./components/auth/LoginPage";
import Dashboard from "./pages/Dashboard";
import AIChat from "./pages/AIChat";
import HabitsTracker from "./pages/HabitsTracker";
import DailyChallenges from "./pages/DailyChallenges";
import NotebooksList from "./pages/NotebooksList";
import NotebookDetail from "./pages/NotebookDetail";
import NotebookFullscreen from "./pages/NotebookFullscreen";
import Analytics from "./pages/Analytics";
import Flashcards from "./pages/Flashcards";
import SettingsPage from "./pages/Settings";
import NotFound from "@/pages/NotFound";
import {
  Menu,
  X,
  Home,
  MessageSquare,
  CheckSquare2,
  Settings,
  Zap,
  BookOpen,
  BarChart3,
  Brain,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useAuthContext } from "./contexts/AuthContext";
import { toast } from "sonner";

function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const [location] = useLocation();
  const { signOut } = useAuthContext();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/challenges", label: "Retos", icon: Zap },
    { path: "/notebooks", label: "Cuadernos", icon: BookOpen },
    { path: "/flashcards", label: "Flashcards", icon: Brain },
    { path: "/habits", label: "Hábitos", icon: CheckSquare2 },
    { path: "/analytics", label: "Estadísticas", icon: BarChart3 },
    { path: "/chat", label: "IA Chat", icon: MessageSquare },
    { path: "/settings", label: "Ajustes", icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
    toast.success("Sesión cerrada");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-card border-r border-border transform transition-transform duration-300 z-50 md:relative md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-accent-foreground font-bold">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">StudyOS</h1>
              <p className="text-xs text-muted-foreground">v3</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-foreground hover:bg-secondary transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function ProtectedRouter() {
  return (
    <ProtectedRoute>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/challenges" component={DailyChallenges} />
        <Route path="/notebooks" component={NotebooksList} />
        <Route path="/notebooks/:id" component={NotebookDetail} />
        <Route
          path="/notebooks/:id/fullscreen"
          component={NotebookFullscreen}
        />
        <Route path="/flashcards" component={Flashcards} />
        <Route path="/habits" component={HabitsTracker} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/chat" component={AIChat} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </ProtectedRoute>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, loading } = useAuthContext();

  const isFullscreen = location.includes("/fullscreen");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {!isFullscreen && (
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isFullscreen && (
          <div className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between">
            <h1 className="font-bold text-foreground">StudyOS</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <ProtectedRouter />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
