import { useState } from 'react';
import { useNotebooksSupabase } from '@/hooks/useNotebooksSupabase';
import { SUBJECTS } from '@/../../shared/const';
import { Notebook } from '@/types';
import { Plus, Trash2, Calendar, FileText } from 'lucide-react';
import { useLocation } from 'wouter';

export default function NotebooksList() {
  const [, setLocation] = useLocation();
  const { notebooks, createNotebook, deleteNotebook } = useNotebooksSupabase();
  const [selectedSubject, setSelectedSubject] = useState<string>('matematicas');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');

  const subjectNotebooks = notebooks.filter(n => n.subjectId === selectedSubject);
  const currentSubject = SUBJECTS.find(s => s.id === selectedSubject);

  const handleCreateNotebook = () => {
    if (!newNotebookName.trim()) return;
    createNotebook(newNotebookName, selectedSubject);
    setNewNotebookName('');
    setShowNewDialog(false);
  };

  const handleDeleteNotebook = (notebookId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cuaderno?')) {
      deleteNotebook(notebookId);
    }
  };

  const handleOpenNotebook = (notebookId: string) => {
    setLocation(`/notebooks/${notebookId}/fullscreen`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Mis Cuadernos</h1>
        <p className="text-muted-foreground">Organiza tu estudio por asignatura</p>
      </div>

      {/* Subject Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {SUBJECTS.map(subject => (
          <button
            key={subject.id}
            onClick={() => setSelectedSubject(subject.id)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
              selectedSubject === subject.id
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            {subject.nombre}
          </button>
        ))}
      </div>

      {/* Create New Button */}
      <button
        onClick={() => setShowNewDialog(true)}
        className="mb-8 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-6 py-3 font-semibold flex items-center gap-2 transition-all"
      >
        <Plus className="w-5 h-5" />
        Nuevo Cuaderno
      </button>

      {/* Notebooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjectNotebooks.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay cuadernos en {currentSubject?.nombre}</p>
            <p className="text-sm text-muted-foreground mt-2">Crea uno para comenzar a estudiar</p>
          </div>
        ) : (
          subjectNotebooks.map(notebook => (
            <div
              key={notebook.id}
              onClick={() => handleOpenNotebook(notebook.id)}
              className="glass-card p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                    {notebook.name}
                  </h3>
                  {notebook.description && (
                    <p className="text-sm text-muted-foreground mt-1">{notebook.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotebook(notebook.id);
                  }}
                  className="p-2 hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-4 pb-4 border-b border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>{notebook.documents.length} documento{notebook.documents.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(notebook.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Documents Preview */}
              {notebook.documents.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Documentos:</p>
                  {notebook.documents.slice(0, 3).map(doc => (
                    <p key={doc.id} className="text-xs text-muted-foreground truncate">
                      • {doc.name}
                    </p>
                  ))}
                  {notebook.documents.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{notebook.documents.length - 3} más</p>
                  )}
                </div>
              )}

              {/* CTA */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-semibold text-accent">Abrir cuaderno →</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Notebook Dialog */}
      {showNewDialog && (
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
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateNotebook}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-4 py-2 font-semibold transition-all"
              >
                Crear
              </button>
              <button
                onClick={() => setShowNewDialog(false)}
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
