import { NotebookDocument } from "@/types";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Procesa documentos y extrae texto para análisis por IA
 */
export async function processDocument(
  document: NotebookDocument
): Promise<string> {
  if (document.type === "image") {
    return await extractTextFromImage(document);
  } else if (document.type === "pdf") {
    return await extractTextFromPDF(document);
  } else if (document.type === "document") {
    return await extractTextFromDocument(document);
  }
  return "";
}

/**
 * Extrae texto de imágenes usando OCR
 */
async function extractTextFromImage(
  document: NotebookDocument
): Promise<string> {
  try {
    if (
      document.data &&
      typeof document.data === "string" &&
      document.data.startsWith("data:image")
    ) {
      return `[Contenido de imagen: ${document.name}]\n\nNota: Para OCR real de imágenes, integra Google Vision API o Tesseract.js`;
    }
    return `[Imagen: ${document.name}]`;
  } catch (error) {
    console.error("Error extracting image text:", error);
    return "";
  }
}

/**
 * Extrae texto de PDFs usando pdf.js
 */
async function extractTextFromPDF(document: NotebookDocument): Promise<string> {
  try {
    let pdfData: ArrayBuffer | Uint8Array;

    if (document.data && typeof document.data === "string") {
      if (document.data.startsWith("data:")) {
        const base64 = document.data.split(",")[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        pdfData = bytes;
      } else {
        const binaryString = atob(document.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        pdfData = bytes;
      }
    } else if (document.data instanceof ArrayBuffer) {
      pdfData = new Uint8Array(document.data);
    } else if (document.data instanceof Uint8Array) {
      pdfData = document.data;
    } else {
      return `[PDF: ${document.name}] - Formato no reconocido`;
    }

    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }

    if (!fullText.trim()) {
      return `[PDF: ${document.name}] - No se pudo extraer texto. Puede ser un PDF escaneado o con imágenes.`;
    }

    return `[Contenido del PDF: ${document.name}]\n\n${fullText}`;
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    return `[PDF: ${document.name}] - Error al procesar: ${error instanceof Error ? error.message : "Error desconocido"}`;
  }
}

/**
 * Extrae texto de documentos
 */
async function extractTextFromDocument(
  document: NotebookDocument
): Promise<string> {
  try {
    if (document.data && typeof document.data === "string") {
      return document.data;
    }
    return `[Documento: ${document.name}]`;
  } catch (error) {
    console.error("Error extracting document text:", error);
    return "";
  }
}

/**
 * Obtiene el texto de todos los documentos de un cuaderno
 */
export async function getAllDocumentsText(
  documents: NotebookDocument[]
): Promise<string> {
  const texts = await Promise.all(documents.map(doc => processDocument(doc)));
  return texts.filter(t => t).join("\n\n---\n\n");
}
