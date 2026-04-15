import { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { UserProfile } from '@/types';
import { Save, Download, Trash2 } from 'lucide-react';

export default function Settings() {
  const { profile, setProfile } = useGameState();
  const [editedProfile, setEditedProfile] = useState(profile);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setProfile(editedProfile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = () => {
    const data = {
      profile: editedProfile,
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleResetData = () => {
    if (window.confirm('¿Estás seguro? Esto borrará todos tus datos.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Ajustes</h1>
        <p className="text-muted-foreground">Gestiona tu perfil y datos</p>
      </div>

      {/* Profile Settings */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-6">Perfil</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={editedProfile.nombre}
              onChange={(e) => setEditedProfile({ ...editedProfile, nombre: e.target.value })}
              className="w-full bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Curso
            </label>
            <input
              type="text"
              value={editedProfile.curso}
              onChange={(e) => setEditedProfile({ ...editedProfile, curso: e.target.value })}
              className="w-full bg-secondary text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Nivel
              </label>
              <div className="bg-secondary text-foreground rounded-lg px-4 py-3 border border-border">
                {editedProfile.nivel}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                XP Total
              </label>
              <div className="bg-secondary text-foreground rounded-lg px-4 py-3 border border-border">
                {editedProfile.xpTotal}
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              saved
                ? 'bg-green-500/20 text-green-400'
                : 'bg-accent hover:bg-accent/90 text-accent-foreground'
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? 'Guardado' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-6">Gestión de Datos</h2>
        
        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground transition-all"
          >
            <Download className="w-4 h-4" />
            Descargar Backup
          </button>

          <button
            onClick={handleResetData}
            className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Borrar Todos los Datos
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Información</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p><strong>Versión:</strong> StudyOS v3</p>
          <p><strong>Almacenamiento:</strong> Local (localStorage)</p>
          <p><strong>IA:</strong> Groq API (Gratuito)</p>
          <p><strong>Desarrollador:</strong> David (16 años, 4º ESO)</p>
        </div>
      </div>
    </div>
  );
}
