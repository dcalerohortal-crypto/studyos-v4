import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SUBJECTS } from '@/../../shared/const';
import { useGameState } from '@/hooks/useGameState';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface Note {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function Notebooks() {
  const [notes, setNotes] = useLocalStorage<Note[]>('studyos_notes', []);
  const [selectedSubject, setSelectedSubject] = useState<string>('matematicas');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const { addXP } = useGameState();

  const subjectNotes = notes.filter(n => n.subjectId === selectedSubject);
  const currentSubject = SUBJECTS.find(s => s.id === selectedSubject);

  const addNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const note: Note = {
      id: `note_${Date.now()}`,
      subjectId: selectedSubject,
      title: newNoteTitle,
      content: newNoteContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes([...notes, note]);
    setNewNoteTitle('');
    setNewNoteContent('');
    addXP(50, selectedSubject, `Nota creada: ${newNoteTitle}`);
  };

  const updateNote = (noteId: string) => {
    setNotes(notes.map(n => {
      if (n.id === noteId) {
        return {
          ...n,
          title: editTitle,
          content: editContent,
          updatedAt: new Date().toISOString(),
        };
      }
      return n;
    }));
    setEditingNote(null);
    setEditTitle('');
    setEditContent('');
  };

  const deleteNote = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId));
  };

  const startEdit = (note: Note) => {
    setEditingNote(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Mis Cuadernos</h1>
        <p className="text-muted-foreground">Organiza tus apuntes por materia</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Note Form */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Nueva Nota</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Título de la nota"
              className="w-full bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Contenido de la nota..."
              rows={6}
              className="w-full bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <button
              onClick={addNote}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-4 py-3 font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Crear Nota
            </button>
          </div>
        </div>

        {/* Notes List */}
        <div className="lg:col-span-2 space-y-4">
          {subjectNotes.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-muted-foreground">No hay notas en {currentSubject?.nombre}. ¡Crea la primera!</p>
            </div>
          ) : (
            subjectNotes.map(note => (
              <div key={note.id} className="glass-card p-6">
                {editingNote === note.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-secondary text-foreground rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={6}
                      className="w-full bg-secondary text-foreground rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateNote(note.id)}
                        className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-4 py-2 font-semibold flex items-center justify-center gap-2 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingNote(null)}
                        className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg px-4 py-2 font-semibold flex items-center justify-center gap-2 transition-all"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{note.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(note)}
                          className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-accent" />
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap text-sm">{note.content}</p>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
