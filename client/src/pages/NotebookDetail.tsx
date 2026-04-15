import { useLocation, useRoute } from 'wouter';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Notebook } from '@/types';
import { ArrowLeft } from 'lucide-react';
import NotebookLeftPanel from '@/components/notebooks/NotebookLeftPanel';
import NotebookCenterPanel from '@/components/notebooks/NotebookCenterPanel';
import NotebookRightPanel from '@/components/notebooks/NotebookRightPanel';

export default function NotebookDetail() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/notebooks/:id');
  const [notebooks, setNotebooks] = useLocalStorage<Notebook[]>('studyos_notebooks', []);

  if (!match || !params?.id) {
    return <div>Cuaderno no encontrado</div>;
  }

  const notebook = notebooks.find(n => n.id === params.id);

  if (!notebook) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Cuaderno no encontrado</p>
          <button
            onClick={() => setLocation('/notebooks')}
            className="bg-accent text-accent-foreground rounded-lg px-6 py-2 font-semibold"
          >
            Volver a Cuadernos
          </button>
        </div>
      </div>
    );
  }

  const handleDeleteNotebook = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cuaderno?')) {
      setNotebooks(notebooks.filter(n => n.id !== notebook.id));
      setLocation('/notebooks');
    }
  };

  const handleUpdateNotebook = (updated: Notebook) => {
    setNotebooks(notebooks.map(n => (n.id === notebook.id ? updated : n)));
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation('/notebooks')}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{notebook.name}</h1>
            {notebook.description && (
              <p className="text-sm text-muted-foreground">{notebook.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Documents */}
        <NotebookLeftPanel
          notebooks={[notebook]}
          currentNotebook={notebook}
          onSelectNotebook={() => {}}
          onDeleteNotebook={handleDeleteNotebook}
        />

        {/* Center Panel - Chat */}
        <NotebookCenterPanel notebook={notebook} />

        {/* Right Panel - Generation Tools */}
        <NotebookRightPanel notebook={notebook} />
      </div>
    </div>
  );
}
