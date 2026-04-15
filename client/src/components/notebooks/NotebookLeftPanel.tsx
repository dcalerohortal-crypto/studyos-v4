import { Notebook } from '@/types';
import { Trash2, FileText, Image, File } from 'lucide-react';

interface Props {
  notebooks: Notebook[];
  currentNotebook: Notebook | undefined;
  onSelectNotebook: (notebookId: string) => void;
  onDeleteNotebook: (notebookId: string) => void;
}

export default function NotebookLeftPanel({
  notebooks,
  currentNotebook,
  onSelectNotebook,
  onDeleteNotebook,
}: Props) {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'image':
        return <Image className="w-4 h-4 text-blue-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col overflow-hidden">
      {/* Notebooks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {notebooks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay cuadernos</p>
        ) : (
          notebooks.map(notebook => (
            <div
              key={notebook.id}
              onClick={() => onSelectNotebook(notebook.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                currentNotebook?.id === notebook.id
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-secondary hover:bg-secondary/80 text-foreground'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{notebook.name}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNotebook(notebook.id);
                  }}
                  className="p-1 hover:bg-black/20 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs opacity-70">{notebook.documents.length} documentos</p>

              {/* Documents Preview */}
              {notebook.documents.length > 0 && (
                <div className="mt-2 space-y-1">
                  {notebook.documents.slice(0, 3).map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 text-xs opacity-75">
                      {getFileIcon(doc.type)}
                      <span className="truncate">{doc.name}</span>
                    </div>
                  ))}
                  {notebook.documents.length > 3 && (
                    <p className="text-xs opacity-50">+{notebook.documents.length - 3} más</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
