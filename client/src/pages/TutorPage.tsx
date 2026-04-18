import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Beaker } from "lucide-react";
import { motion } from "framer-motion";

export default function TutorPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/tutor/:id");
  const notebookId = params?.id;

  if (!match || !notebookId) {
    return <div>Tutor no encontrado</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 flex flex-col items-center justify-center max-w-md w-full text-center relative z-10 border border-border/50 shadow-2xl"
      >
        <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-accent/20">
          <Beaker className="w-10 h-10 text-accent" />
        </div>
        
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
          Tutor en Construcción
        </h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Estamos afinando los últimos detalles del motor conversacional. Muy pronto tendrás un tutor personal dedicado a este cuaderno.
        </p>

        <button
          onClick={() => setLocation(`/notebooks/${notebookId}/fullscreen`)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl font-medium transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al cuaderno
        </button>
      </motion.div>
    </div>
  );
}
