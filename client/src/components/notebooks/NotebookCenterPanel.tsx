import { useState, useRef, useEffect } from 'react';
import { Notebook, ChatMessage } from '@/types';
import { Send, Loader2, Upload } from 'lucide-react';
import { chatWithGroq } from '@/lib/groqService';

interface Props {
  notebook: Notebook;
}

export default function NotebookCenterPanel({ notebook }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(notebook.chatHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Construir contexto con documentos
      const documentContext = notebook.documents
        .map(doc => `Documento: ${doc.name} (${doc.type})`)
        .join('\n');

      const systemPrompt = `Eres un asistente educativo inteligente. Tienes acceso a los siguientes documentos:\n${documentContext}\n\nAnaliza estos documentos y responde preguntas del estudiante basándote en su contenido.`;

      const response = await chatWithGroq(
        messages.map(m => ({ role: m.role, content: m.content })),
        input,
        systemPrompt
      );

      if (response.success && response.text) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.text,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-accent/10 rounded-full mb-4">
              <Upload className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Sube documentos para comenzar
            </h2>
            <p className="text-muted-foreground max-w-md">
              Carga PDFs, imágenes o documentos. La IA los analizará y podrás hacer preguntas sobre ellos.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-accent text-accent-foreground rounded-br-none'
                      : 'bg-secondary text-foreground rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-accent-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary p-4 rounded-2xl rounded-bl-none">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span className="text-muted-foreground text-sm">Analizando...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border p-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre los documentos..."
            disabled={loading}
            className="flex-1 bg-secondary text-foreground placeholder-muted-foreground rounded-xl px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground rounded-xl px-4 py-3 font-semibold flex items-center gap-2 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
