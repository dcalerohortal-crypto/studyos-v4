import { NotebookDocument } from "@/types";
import * as pdfjsLib from "pdfjs-dist";
import { getDocument } from "pdfjs-dist";
import Tesseract from "tesseract.js";
import mammoth from "mammoth";
import TranscriptClient from "youtube-transcript-api";

import PdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

export interface ProcessingResult {
  success: boolean;
  text: string;
  source: string;
  error?: string;
  wasFallback?: boolean;
}

export interface ExtractionResult {
  source: string;
  type: string;
  status: "success" | "failed" | "fallback";
  textLength: number;
  preview: string;
  error?: string;
}

export interface ContentSource {
  type: "pdf" | "image" | "document" | "youtube" | "url" | "text";
  name: string;
  data?: string | ArrayBuffer | Uint8Array;
  url?: string;
}

const MAX_PREVIEW_LENGTH = 500;

function createPreview(text: string): string {
  if (!text || text.length === 0) return "";
  const trimmed = text.trim().substring(0, MAX_PREVIEW_LENGTH);
  return trimmed.length < text.length ? trimmed + "..." : trimmed;
}

export async function processDocument(
  document: ContentSource,
  onProgress?: (source: string, status: string) => void
): Promise<ProcessingResult> {
  const sourceName = document.name || "Documento desconocido";

  try {
    onProgress?.(sourceName, "Procesando...");

    switch (document.type) {
      case "pdf":
        return await extractTextFromPDF(document, onProgress);
      case "image":
        return await extractTextFromImage(document, onProgress);
      case "document":
        return await extractTextFromDocument(document, onProgress);
      case "youtube":
        return await extractTextFromYouTube(document, onProgress);
      case "url":
        return await extractTextFromURL(document, onProgress);
      case "text":
        return {
          success: true,
          text: (document.data as string) || "",
          source: sourceName,
        };
      default:
        onProgress?.(sourceName, "Tipo no soportado");
        return {
          success: false,
          text: "",
          source: sourceName,
          error: "Tipo de documento no soportado",
        };
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Error desconocido";
    onProgress?.(sourceName, `Error: ${errorMsg}`);
    return {
      success: false,
      text: "",
      source: sourceName,
      error: errorMsg,
    };
  }
}

async function extractTextFromPDF(
  document: ContentSource,
  onProgress?: (source: string, status: string) => void
): Promise<ProcessingResult> {
  const sourceName = document.name || "PDF";

  try {
    onProgress?.(sourceName, "Convirtiendo PDF...");

    let pdfData: ArrayBuffer | Uint8Array;

    if (document.data && typeof document.data === "string") {
      if (document.data.startsWith("data:")) {
        const base64 = document.data.split(",")[1];
        pdfData = base64ToUint8Array(base64);
      } else {
        pdfData = base64ToUint8Array(document.data);
      }
    } else if (document.data instanceof ArrayBuffer) {
      pdfData = new Uint8Array(document.data);
    } else if (document.data instanceof Uint8Array) {
      pdfData = document.data;
    } else {
      return {
        success: false,
        text: "",
        source: sourceName,
        error: "Formato de PDF no reconocido",
      };
    }

    const loadingTask = getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;

    onProgress?.(sourceName, `Extrayendo texto de ${pdf.numPages} páginas...`);

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }

    if (fullText.trim().length < 50) {
      onProgress?.(sourceName, "PDF parece escaneado, intentando OCR...");
      const fallbackResult = await extractTextFromPDFWithOCR(
        document,
        onProgress
      );
      if (fallbackResult.success) {
        return { ...fallbackResult, wasFallback: true };
      }
      return {
        success: false,
        text: "",
        source: sourceName,
        error:
          "No se pudo extraer texto del PDF. Puede ser un PDF escaneado. Prueba a subir una imagen del documento.",
      };
    }

    onProgress?.(sourceName, `Extraído: ${fullText.length} caracteres`);
    return { success: true, text: fullText, source: sourceName };
  } catch (error) {
    onProgress?.(sourceName, "Intentando OCR como alternativa...");
    const fallbackResult = await extractTextFromPDFWithOCR(
      document,
      onProgress
    );
    if (fallbackResult.success) {
      return { ...fallbackResult, wasFallback: true };
    }
    return {
      success: false,
      text: "",
      source: sourceName,
      error:
        error instanceof Error
          ? `Error al procesar PDF: ${error.message}`
          : "Error al procesar PDF",
    };
  }
}

async function extractTextFromPDFWithOCR(
  document: ContentSource,
  onProgress?: (source: string, status: string) => void
): Promise<ProcessingResult> {
  const sourceName = document.name || "PDF";

  try {
    onProgress?.(sourceName, "Convirtiendo PDF a imagen para OCR...");

    let pdfData: ArrayBuffer | Uint8Array;

    if (document.data && typeof document.data === "string") {
      const base64 = document.data.includes(",")
        ? document.data.split(",")[1]
        : document.data;
      pdfData = base64ToUint8Array(base64);
    } else if (document.data instanceof ArrayBuffer) {
      pdfData = new Uint8Array(document.data);
    } else {
      pdfData = document.data as Uint8Array;
    }

    const loadingTask = getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;

    const page = await pdf.getPage(1);
    const scale = 2;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const imageData = canvas.toDataURL("image/png");

    onProgress?.(
      sourceName,
      "Reconociendo texto con OCR (español + inglés)..."
    );

    const result = await Tesseract.recognize(imageData, "spa+eng", {
      logger: m => {
        if (m.status === "recognizing text") {
          onProgress?.(sourceName, `OCR: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const text = result.data.text.trim();

    if (!text || text.length < 20) {
      return {
        success: false,
        text: "",
        source: sourceName,
        error: "OCR no detectó texto. El PDF puede no tener contenido legible.",
      };
    }

    onProgress?.(sourceName, `OCR completado: ${text.length} caracteres`);
    return { success: true, text, source: sourceName, wasFallback: true };
  } catch {
    return {
      success: false,
      text: "",
      source: sourceName,
      error: "OCR fallback falló",
    };
  }
}

async function extractTextFromImage(
  document: ContentSource,
  onProgress?: (source: string, status: string) => void
): Promise<ProcessingResult> {
  const sourceName = document.name || "Imagen";

  try {
    let imageData: string = "";

    if (document.data && typeof document.data === "string") {
      if (document.data.startsWith("data:image")) {
        imageData = document.data;
      } else if (document.data.startsWith("http")) {
        imageData = document.data;
      } else {
        imageData = `data:image/jpeg;base64,${document.data}`;
      }
    } else if (document.url) {
      imageData = document.url;
    } else {
      return {
        success: false,
        text: "",
        source: sourceName,
        error: "No se encontró imagen para procesar",
      };
    }

    onProgress?.(sourceName, "Reconociendo texto con OCR...");

    const result = await Tesseract.recognize(imageData, "spa+eng", {
      logger: m => {
        if (m.status === "recognizing text") {
          onProgress?.(sourceName, `OCR: ${Math.round(m.progress * 100)}%`);
        } else if (m.status) {
          onProgress?.(sourceName, `Procesando imagen... ${m.status}`);
        }
      },
    });

    const text = result.data.text.trim();

    if (!text || text.length < 5) {
      return {
        success: false,
        text: "",
        source: sourceName,
        error:
          "No se detectó texto en la imagen. Asegúrate de que la imagen sea legible y contenga texto.",
      };
    }

    onProgress?.(sourceName, `Extraído: ${text.length} caracteres`);
    return { success: true, text, source: sourceName };
  } catch (error) {
    return {
      success: false,
      text: "",
      source: sourceName,
      error:
        error instanceof Error
          ? `Error en OCR: ${error.message}`
          : "Error en OCR",
    };
  }
}

async function extractTextFromDocument(
  document: ContentSource,
  onProgress?: (source: string, status: string) => void
): Promise<ProcessingResult> {
  const sourceName = document.name || "Documento";

  try {
    if (!document.data) {
      return {
        success: false,
        text: "",
        source: sourceName,
        error: "No hay datos del documento",
      };
    }

    const fileName = (document.name || "").toLowerCase();
    onProgress?.(sourceName, `Procesando ${fileName}...`);

    if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      return await extractTextFromDocx(document, onProgress);
    }

    if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      if (typeof document.data === "string") {
        onProgress?.(
          sourceName,
          `Extraído: ${document.data.length} caracteres`
        );
        return { success: true, text: document.data, source: sourceName };
      }
    }

    if (fileName.endsWith(".pptx")) {
      return {
        success: false,
        text: "",
        source: sourceName,
        error:
          "PowerPoint no soportado directamente. Copia el texto del archivo o usa una URL.",
      };
    }

    if (typeof document.data === "string") {
      onProgress?.(sourceName, `Extraído: ${document.data.length} caracteres`);
      return { success: true, text: document.data, source: sourceName };
    }

    return {
      success: false,
      text: "",
      source: sourceName,
      error: "Formato de documento no soportado o datos inválidos",
    };
  } catch (error) {
    return {
      success: false,
      text: "",
      source: sourceName,
      error:
        error instanceof Error
          ? `Error al procesar documento: ${error.message}`
          : "Error al procesar documento",
    };
  }
}

async function extractTextFromDocx(
  document: ContentSource,
  onProgress?: (source: string, status: string) => void
): Promise<ProcessingResult> {
  const sourceName = document.name || "Documento Word";

  try {
    let arrayBuffer: ArrayBuffer;

    if (typeof document.data === "string") {
      const binaryString = atob(document.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
    } else if (document.data instanceof ArrayBuffer) {
      arrayBuffer = document.data;
    } else if (document.data instanceof Uint8Array) {
      arrayBuffer = document.data.buffer;
    } else {
      return {
        success: false,
        text: "",
        source: sourceName,
        error: "Formato de Word no soportado",
      };
    }

    onProgress?.(sourceName, "Extrayendo texto de Word...");
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;

    if (!text || text.trim().length < 10) {
      return {
        success: false,
        text: "",
        source: sourceName,
        error:
          "El documento Word parece estar vacío o no contiene texto extraíble",
      };
    }

    onProgress?.(sourceName, `Extraído: ${text.length} caracteres`);
    return { success: true, text, source: sourceName };
  } catch (error) {
    return {
      success: false,
      text: "",
      source: sourceName,
      error:
        error instanceof Error
          ? `Error al procesar Word: ${error.message}`
          : "Error al procesar documento Word",
    };
  }
}

async function extractTextFromYouTube(
  document: ContentSource,
  onProgress?: (source: string, status: string) => void
): Promise<ProcessingResult> {
  const sourceName = document.name || "YouTube";

  try {
    if (!document.url) {
      return {
        success: false,
        text: "",
        source: sourceName,
        error: "No se proporcionó URL de YouTube",
      };
    }

    const videoId = extractYouTubeVideoId(document.url);
    if (!videoId) {
      return {
        success: false,
        text: "",
        source: sourceName,
        error: "URL de YouTube no válida",
      };
    }

    onProgress?.(sourceName, "Obteniendo transcripción...");

    const client = new TranscriptClient();
    await client.ready;
    const transcript = await client.getTranscript(videoId);

    const text = transcript
      .map((entry: { text: string }) => entry.text)
      .join(" ");

    if (!text.trim()) {
      return {
        success: false,
        text: "",
        source: sourceName,
        error:
          "Este video no tiene subtítulos disponibles. Prueba con otro video que tenga subtítulos.",
      };
    }

    onProgress?.(sourceName, `Transcripción: ${text.length} caracteres`);
    return {
      success: true,
      text: `[Transcripción del video: ${sourceName}]\n\n${text}`,
      source: sourceName,
    };
  } catch (error) {
    console.error("Error YouTube:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Error desconocido";
    let userMessage = "No se pudo obtener la transcripción.";

    if (errorMsg.includes("Could not retrieve")) {
      userMessage =
        "El video no tiene subtítulos disponibles. Prueba con otro video.";
    } else if (errorMsg.includes("Video unavailable")) {
      userMessage = "El video no está disponible o es privado.";
    }

    onProgress?.(sourceName, `Error: ${userMessage}`);
    return {
      success: false,
      text: "",
      source: sourceName,
      error: userMessage,
    };
  }
}

async function extractTextFromURL(
  document: ContentSource,
  onProgress?: (source: string, status: string) => void
): Promise<ProcessingResult> {
  const sourceName = document.name || "URL";

  try {
    if (!document.url) {
      return {
        success: false,
        text: "",
        source: sourceName,
        error: "No se proporcionó URL",
      };
    }

    onProgress?.(sourceName, "Obteniendo contenido web...");

    const response = await fetch(document.url);

    if (!response.ok) {
      return {
        success: false,
        text: "",
        source: sourceName,
        error: `Error al obtener la página: ${response.status} ${response.statusText}`,
      };
    }

    const html = await response.text();
    const text = extractTextFromHTML(html);

    if (!text.trim() || text.length < 50) {
      return {
        success: false,
        text: "",
        source: sourceName,
        error:
          "No se pudo extraer texto de la página. Puede ser una página que requiere JavaScript.",
      };
    }

    onProgress?.(sourceName, `Extraído: ${text.length} caracteres`);
    return {
      success: true,
      text: `[Contenido de: ${sourceName}]\n\n${text}`,
      source: sourceName,
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Error desconocido";
    let userMessage = "No se pudo obtener el contenido de la URL.";

    if (errorMsg.includes("Failed to fetch")) {
      userMessage =
        "No se pudo acceder a la URL. Verifica que la dirección sea correcta y accesible.";
    } else if (errorMsg.includes("CORS")) {
      userMessage =
        "Error de CORS. Esta web no permite ser accedida desde un navegador.";
    }

    onProgress?.(sourceName, `Error: ${userMessage}`);
    return {
      success: false,
      text: "",
      source: sourceName,
      error: userMessage,
    };
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function extractTextFromHTML(html: string): string {
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  return text.substring(0, 15000);
}

export async function getAllDocumentsText(
  documents: ContentSource[],
  onProgress?: (source: string, status: string) => void
): Promise<{ text: string; results: ExtractionResult[] }> {
  const extractionResults: ExtractionResult[] = [];
  const successfulTexts: string[] = [];

  for (const doc of documents) {
    const result = await processDocument(doc, onProgress);

    extractionResults.push({
      source: result.source,
      type: doc.type,
      status: result.wasFallback
        ? "fallback"
        : result.success
          ? "success"
          : "failed",
      textLength: result.text.length,
      preview: createPreview(result.text),
      error: result.error,
    });

    if (result.success && result.text.trim()) {
      successfulTexts.push(`[Fuente: ${result.source}]\n\n${result.text}`);
    }
  }

  const combinedText = successfulTexts.join("\n\n---\n\n");

  return { text: combinedText, results: extractionResults };
}

export function isYouTubeURL(text: string): boolean {
  return /youtube\.com|youtu\.be/.test(text);
}

export function isURL(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

export function classifyContent(
  name: string,
  data?: string | ArrayBuffer | Uint8Array
): ContentSource["type"] {
  const lowerName = name.toLowerCase();

  if (/\.pdf$/.test(lowerName)) return "pdf";
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(lowerName)) return "image";
  if (/\.(docx?|txt|md)$/.test(lowerName)) return "document";

  if (data && typeof data === "string") {
    if (isYouTubeURL(data)) return "youtube";
    if (isURL(data)) return "url";
  }

  return "document";
}

export function formatExtractionResults(results: ExtractionResult[]): {
  success: string;
  failed: string;
  totalChars: number;
} {
  const success = results.filter(r => r.status !== "failed");
  const failed = results.filter(r => r.status === "failed");
  const totalChars = results.reduce((sum, r) => sum + r.textLength, 0);

  return {
    success: `${success.length}/${results.length} fuentes procesadas`,
    failed: failed.length > 0 ? `${failed.length} fallidas` : "",
    totalChars,
  };
}
