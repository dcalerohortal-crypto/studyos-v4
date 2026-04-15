import {
  createJob,
  updateJob,
  getJob,
  PodcastConfig,
  PodcastSegment,
} from "./podcast-jobs";
import { generateParsedScript, PodcastFormat } from "./podcast-stream";

interface SubmitRequest {
  config: PodcastConfig;
  documentText: string;
  notebookName: string;
}

interface ErrorResponse {
  error: string;
}

async function generatePodcastScript(
  documentText: string,
  notebookName: string,
  config: PodcastConfig
): Promise<{ segments: PodcastSegment[] }> {
  const segments = await generateParsedScript(
    documentText,
    notebookName,
    config
  );
  return { segments };
}

async function generateAudioSegment(
  text: string,
  voice: string = "af_sarah"
): Promise<ArrayBuffer> {
  const ttsAiKey = process.env.TTSAI_API_KEY;

  if (!ttsAiKey) {
    throw new Error("TTSAI_API_KEY not configured");
  }

  const response = await fetch("https://api.tts.ai/v1/tts/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ttsAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "kokoro",
      text: text,
      voice: voice,
      format: "wav",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TTS API error: ${error}`);
  }

  const data = (await response.json()) as {
    result_url?: string;
    status?: string;
  };

  if (data.result_url) {
    const maxWait = 60000;
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      await new Promise(r => setTimeout(r, 2000));

      const checkResponse = await fetch("https://api.tts.ai/v1/tts/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ttsAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "kokoro",
          text: "placeholder",
          voice: voice,
        }),
      });

      const checkData = (await checkResponse.json()) as {
        status?: string;
        result_url?: string;
      };

      if (checkData.status === "completed" && checkData.result_url) {
        const audioResponse = await fetch(checkData.result_url);
        return audioResponse.arrayBuffer();
      }
    }

    throw new Error("TTS timeout waiting for audio");
  }

  const buffer = await response.arrayBuffer();
  return buffer;
}

async function processPodcastJob(jobId: string) {
  const job = getJob(jobId);
  if (!job) {
    return;
  }

  try {
    updateJob(jobId, { status: "extracting", progress: 5 });

    await new Promise(r => setTimeout(r, 1000));

    const currentJob = getJob(jobId);
    if (!currentJob || (currentJob.status as string) === "cancelled") return;
    updateJob(jobId, { status: "generating-script", progress: 10 });

    const script = await generatePodcastScript(
      job.documentText,
      job.notebookName,
      job.config
    );

    if (!script.segments || script.segments.length === 0) {
      throw new Error("No segments generated");
    }

    updateJob(jobId, {
      status: "generating-audio",
      progress: 40,
      script: script.segments,
    });

    const audioChunks: ArrayBuffer[] = [];
    const totalSegments = script.segments.length;

    for (let i = 0; i < script.segments.length; i++) {
      const checkJob = getJob(jobId);
      if (!checkJob || (checkJob.status as string) === "cancelled") return;

      const segment = script.segments[i];
      const progress = 40 + ((i + 1) / totalSegments) * 55;
      updateJob(jobId, { progress: Math.round(progress) });

      try {
        const voice = (segment as any).voice || "af_sarah";
        const audioBuffer = await generateAudioSegment(segment.text, voice);
        audioChunks.push(audioBuffer);
      } catch (error) {
        console.error(`Error generating audio for segment ${i}:`, error);
        const silence = new ArrayBuffer(44100);
        audioChunks.push(silence);
      }
    }

    const finalJob = getJob(jobId);
    if (!finalJob || (finalJob.status as string) === "cancelled") return;

    const totalLength = audioChunks.reduce(
      (acc, buf) => acc + buf.byteLength,
      0
    );
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunks) {
      combined.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    const base64Audio = Buffer.from(combined).toString("base64");
    const audioUrl = `data:audio/wav;base64,${base64Audio}`;

    updateJob(jobId, {
      status: "completed",
      progress: 100,
      audioUrl,
    });
  } catch (error) {
    console.error("Podcast job error:", error);
    updateJob(jobId, {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" } as ErrorResponse, {
      status: 405,
    });
  }

  try {
    const body = (await req.json()) as SubmitRequest;
    const { config, documentText, notebookName } = body;

    if (!config || !documentText || !notebookName) {
      return Response.json(
        {
          error: "Missing required fields: config, documentText, notebookName",
        } as ErrorResponse,
        { status: 400 }
      );
    }

    if (!config.format || !config.language || !config.duration) {
      return Response.json(
        {
          error: "Invalid config: format, language, and duration are required",
        } as ErrorResponse,
        { status: 400 }
      );
    }

    const job = createJob(config, documentText, notebookName);

    setImmediate(() => {
      processPodcastJob(job.id).catch(console.error);
    });

    return Response.json(
      {
        jobId: job.id,
        status: job.status,
        message: "Podcast job created",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Submit error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      } as ErrorResponse,
      { status: 500 }
    );
  }
}
