interface TTSRequest {
  text: string;
  voice?: string;
  model?: string;
}

interface TTSError {
  error: string;
}

interface TTSResponse {
  uuid?: string;
  status?: string;
  result_url?: string;
  error?: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" } as TTSError, {
      status: 405,
    });
  }

  try {
    const body = (await req.json()) as TTSRequest;
    const { text, voice = "af_sarah", model = "kokoro" } = body;

    if (!text) {
      return Response.json({ error: "Text is required" } as TTSError, {
        status: 400,
      });
    }

    const ttsAiKey = process.env.TTSAI_API_KEY;

    if (!ttsAiKey) {
      return Response.json(
        { error: "TTSAI_API_KEY not configured" } as TTSError,
        { status: 500 }
      );
    }

    // Make TTS request
    const ttsResponse = await fetch("https://api.tts.ai/v1/tts/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ttsAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        text: text,
        voice: voice,
        format: "wav",
      }),
    });

    const ttsData = (await ttsResponse.json()) as TTSResponse;

    if (!ttsResponse.ok || !ttsData.result_url) {
      console.error("TTS API error:", ttsData);
      return Response.json(
        {
          error: `TTS API error: ${ttsData.error || JSON.stringify(ttsData)}`,
        } as TTSError,
        { status: 500 }
      );
    }

    // Download the audio from result_url
    const audioResponse = await fetch(ttsData.result_url);

    if (!audioResponse.ok) {
      console.error("Failed to download audio from:", ttsData.result_url);
      return Response.json(
        { error: "Failed to download generated audio" } as TTSError,
        { status: 500 }
      );
    }

    const audioBuffer = await audioResponse.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Content-Disposition": "attachment; filename=audio.wav",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("TTS Error:", error);
    return Response.json({ error: "Internal server error" } as TTSError, {
      status: 500,
    });
  }
}
