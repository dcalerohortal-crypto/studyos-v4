import { useState } from 'react';
import { useNotebook } from '@/hooks/useNotebook';
import { SUBJECTS } from '@/../../shared/const';
import { Plus, Trash2, FileUp, MessageSquare, Zap } from 'lucide-react';
import NotebookLeftPanel from '@/components/notebooks/NotebookLeftPanel';
import NotebookCenterPanel from '@/components/notebooks/NotebookCenterPanel';
import NotebookRightPanel from '@/components/notebooks/NotebookRightPanel';

export default function NotebooksNew() {
  const [selectedSubject, setSelectedSubject] = useState<string>('matematicas');
  const [showNewNotebookDialog, setShowNewNotebookDialog] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');

  const {
    notebooks,
    currentNotebook,
    setCurrentNotebookId,
    createNotebook,
    deleteNotebook,
  } = useNotebook(selectedSubject);

  const currentSubject = SUBJECTS.find(s => s.id === selectedSubject);

  const handleCreateNotebook = () => {
    if (!newNotebookName.trim()) return;
    createNotebook(newNotebookName);
    setNewNotebookName('');
    setShowNewNotebookDialog(false);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cuadernos</h1>
          <p className="text-sm text-muted-foreground">{currentSubject?.nombre}</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-secondary text-foreground rounded-lg px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {SUBJECTS.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.nombre}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowNewNotebookDialog(true)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-4 py-2 font-semibold flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cuaderno
          </button>
        </div>
      </div>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Notebooks & Documents */}
        <NotebookLeftPanel
          notebooks={notebooks}
          currentNotebook={currentNotebook}
          onSelectNotebook={setCurrentNotebookId}
          onDeleteNotebook={deleteNotebook}
        />

        {/* Center Panel - Chat */}
        {currentNotebook ? (
          <>
            <NotebookCenterPanel notebook={currentNotebook} />

            {/* Right Panel - Generation Tools */}
            <NotebookRightPanel notebook={currentNotebook} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Selecciona o crea un cuaderno para comenzar</p>
            </div>
          </div>
        )}
      </div>

      {/* New Notebook Dialog */}
      {showNewNotebookDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Nuevo Cuaderno</h2>
            <input
              type="text"
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              placeholder="Nombre del cuaderno (ej: Tema 1 - Álgebra)"
              className="w-full bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateNotebook()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateNotebook}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-4 py-2 font-semibold transition-all"
              >
                Crear
              </button>
              <button
                onClick={() => setShowNewNotebookDialog(false)}
                className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg px-4 py-2 font-semibold transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
