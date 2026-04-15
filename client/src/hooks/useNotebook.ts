import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Notebook, NotebookDocument, GeneratedContent, ChatMessage } from '@/types';

export function useNotebook(subjectId: string) {
  const [notebooks, setNotebooks] = useLocalStorage<Notebook[]>('studyos_notebooks', []);
  const [currentNotebookId, setCurrentNotebookId] = useState<string | null>(null);

  const currentNotebook = notebooks.find(n => n.id === currentNotebookId && n.subjectId === subjectId);
  const subjectNotebooks = notebooks.filter(n => n.subjectId === subjectId);

  const createNotebook = useCallback((name: string, description?: string) => {
    const newNotebook: Notebook = {
      id: `notebook_${Date.now()}`,
      subjectId,
      name,
      description,
      documents: [],
      chatHistory: [],
      generatedContent: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotebooks([...notebooks, newNotebook]);
    setCurrentNotebookId(newNotebook.id);
    return newNotebook;
  }, [notebooks, setNotebooks, subjectId]);

  const deleteNotebook = useCallback((notebookId: string) => {
    setNotebooks(notebooks.filter(n => n.id !== notebookId));
    if (currentNotebookId === notebookId) {
      setCurrentNotebookId(null);
    }
  }, [notebooks, setNotebooks, currentNotebookId]);

  const addDocument = useCallback((document: NotebookDocument) => {
    if (!currentNotebook) return;

    const updated = notebooks.map(n => {
      if (n.id === currentNotebook.id) {
        return {
          ...n,
          documents: [...n.documents, document],
          updatedAt: new Date().toISOString(),
        };
      }
      return n;
    });

    setNotebooks(updated);
  }, [notebooks, setNotebooks, currentNotebook]);

  const removeDocument = useCallback((documentId: string) => {
    if (!currentNotebook) return;

    const updated = notebooks.map(n => {
      if (n.id === currentNotebook.id) {
        return {
          ...n,
          documents: n.documents.filter(d => d.id !== documentId),
          updatedAt: new Date().toISOString(),
        };
      }
      return n;
    });

    setNotebooks(updated);
  }, [notebooks, setNotebooks, currentNotebook]);

  const addChatMessage = useCallback((message: ChatMessage) => {
    if (!currentNotebook) return;

    const updated = notebooks.map(n => {
      if (n.id === currentNotebook.id) {
        return {
          ...n,
          chatHistory: [...n.chatHistory, message],
          updatedAt: new Date().toISOString(),
        };
      }
      return n;
    });

    setNotebooks(updated);
  }, [notebooks, setNotebooks, currentNotebook]);

  const addGeneratedContent = useCallback((content: GeneratedContent) => {
    if (!currentNotebook) return;

    const updated = notebooks.map(n => {
      if (n.id === currentNotebook.id) {
        return {
          ...n,
          generatedContent: [...n.generatedContent, content],
          updatedAt: new Date().toISOString(),
        };
      }
      return n;
    });

    setNotebooks(updated);
  }, [notebooks, setNotebooks, currentNotebook]);

  return {
    notebooks: subjectNotebooks,
    currentNotebook,
    setCurrentNotebookId,
    createNotebook,
    deleteNotebook,
    addDocument,
    removeDocument,
    addChatMessage,
    addGeneratedContent,
  };
}
