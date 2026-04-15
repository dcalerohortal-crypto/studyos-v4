import { useRef, useState } from 'react';
import { NotebookDocument } from '@/types';
import { Upload, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (document: NotebookDocument) => void;
}

export default function FileUploadDialog({ isOpen, onClose, onUpload }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      try {
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

          onUpload(document);
        };

        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    setUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-card p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Subir Archivos</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-accent mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">Arrastra archivos aquí</p>
          <p className="text-muted-foreground text-sm">o haz clic para seleccionar</p>
          <p className="text-xs text-muted-foreground mt-3">
            PDF, imágenes, documentos (máx. 10MB)
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />

        <button
          onClick={onClose}
          className="w-full mt-4 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg px-4 py-2 font-semibold transition-all"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
