import { useState } from 'react';
import { Notebook, NotebookDocument } from '@/types';
import { Upload, Link2, Search, Trash2, FileText, Image, Music } from 'lucide-react';

interface Props {
  notebook: Notebook;
  onUpdateNotebook: (notebook: Notebook) => void;
}

export default function NotebookLeftPanelFull({ notebook, onUpdateNotebook }: Props) {
  const [uploadMode, setUploadMode] = useState<'file' | 'youtube' | 'web' | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [webSearch, setWebSearch] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target?.result as string;
        const type = file.type.startsWith('image/')
          ? 'image'
          : file.type === 'application/pdf'
          ? 'pdf'
          : 'document';

        const document: NotebookDocument = {
          id: `doc_${Date.now()}_${Math.random()}`,
          name: file.name,
          type: type as any,
          fileData,
          uploadedAt: new Date().toISOString(),
          size: file.size,
        };

        onUpdateNotebook({
          ...notebook,
          documents: [...notebook.documents, document],
        });
      };
      reader.readAsDataURL(file);
    }

    setUploadMode(null);
  };

  const handleAddYoutube = () => {
    if (!youtubeUrl.trim()) return;

    const document: NotebookDocument = {
      id: `youtube_${Date.now()}`,
      name: `YouTube: ${youtubeUrl.substring(0, 50)}`,
      type: 'document',
      fileData: youtubeUrl,
      uploadedAt: new Date().toISOString(),
      size: 0,
    };

    onUpdateNotebook({
      ...notebook,
      documents: [...notebook.documents, document],
    });

    setYoutubeUrl('');
    setUploadMode(null);
  };

  const handleAddWebSearch = () => {
    if (!webSearch.trim()) return;

    const document: NotebookDocument = {
      id: `web_${Date.now()}`,
      name: `Web: ${webSearch.substring(0, 50)}`,
      type: 'document',
      fileData: webSearch,
      uploadedAt: new Date().toISOString(),
      size: 0,
    };

    onUpdateNotebook({
      ...notebook,
      documents: [...notebook.documents, document],
    });

    setWebSearch('');
    setUploadMode(null);
  };

  const handleDeleteDocument = (docId: string) => {
    onUpdateNotebook({
      ...notebook,
      documents: notebook.documents.filter(d => d.id !== docId),
    });
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground mb-2">Fuentes</h3>
        <p className="text-xs text-muted-foreground">
          {notebook.documents.length} documento{notebook.documents.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Upload Buttons */}
      <div className="p-4 space-y-2 border-b border-border">
        <button
          onClick={() => setUploadMode(uploadMode === 'file' ? null : 'file')}
          className="w-full bg-accent/10 hover:bg-accent/20 text-accent rounded-lg px-4 py-2 font-semibold flex items-center justify-center gap-2 transition-all text-sm"
        >
          <Upload className="w-4 h-4" />
          Subir Archivo
        </button>

        <button
          onClick={() => setUploadMode(uploadMode === 'youtube' ? null : 'youtube')}
          className="w-full bg-accent/10 hover:bg-accent/20 text-accent rounded-lg px-4 py-2 font-semibold flex items-center justify-center gap-2 transition-all text-sm"
        >
          <Music className="w-4 h-4" />
          YouTube
        </button>

        <button
          onClick={() => setUploadMode(uploadMode === 'web' ? null : 'web')}
          className="w-full bg-accent/10 hover:bg-accent/20 text-accent rounded-lg px-4 py-2 font-semibold flex items-center justify-center gap-2 transition-all text-sm"
        >
          <Search className="w-4 h-4" />
          Buscar Web
        </button>
      </div>

      {/* Upload Forms */}
      {uploadMode === 'file' && (
        <div className="p-4 border-b border-border">
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="w-full text-xs"
          />
        </div>
      )}

      {uploadMode === 'youtube' && (
        <div className="p-4 border-b border-border space-y-2">
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="Pega el URL de YouTube"
            className="w-full bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          />
          <button
            onClick={handleAddYoutube}
            className="w-full bg-accent text-accent-foreground rounded-lg px-3 py-2 font-semibold text-sm transition-all hover:bg-accent/90"
          >
            Añadir
          </button>
        </div>
      )}

      {uploadMode === 'web' && (
        <div className="p-4 border-b border-border space-y-2">
          <input
            type="text"
            value={webSearch}
            onChange={(e) => setWebSearch(e.target.value)}
            placeholder="¿Qué quieres buscar?"
            className="w-full bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          />
          <button
            onClick={handleAddWebSearch}
            className="w-full bg-accent text-accent-foreground rounded-lg px-3 py-2 font-semibold text-sm transition-all hover:bg-accent/90"
          >
            Buscar
          </button>
        </div>
      )}

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {notebook.documents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            Sin documentos. Añade uno para comenzar.
          </p>
        ) : (
          notebook.documents.map(doc => (
            <div
              key={doc.id}
              className="bg-secondary rounded-lg p-3 flex items-start justify-between hover:bg-secondary/80 transition-colors group"
            >
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {doc.type === 'image' && <Image className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />}
                {doc.type === 'pdf' && <FileText className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />}
                {doc.type === 'document' && <Link2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteDocument(doc.id)}
                className="p-1 hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
