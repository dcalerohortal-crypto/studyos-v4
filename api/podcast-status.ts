import { getJob, cancelJob } from "./podcast-jobs";

interface ErrorResponse {
  error: string;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const jobId = url.searchParams.get("job_id");

  if (!jobId) {
    return Response.json(
      { error: "Missing job_id parameter" } as ErrorResponse,
      { status: 400 }
    );
  }

  if (req.method === "GET") {
    const job = getJob(jobId);

    if (!job) {
      return Response.json(
        { error: "Job not found or expired" } as ErrorResponse,
        { status: 404 }
      );
    }

    const response: {
      jobId: string;
      status: string;
      progress: number;
      audioUrl?: string;
      script?: unknown;
      error?: string;
      createdAt: string;
    } = {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
    };

    if (job.status === "completed") {
      response.audioUrl = job.audioUrl;
      response.script = job.script;
    }

    if (job.status === "error") {
      response.error = job.error;
    }

    return Response.json(response, { status: 200 });
  } else if (req.method === "DELETE") {
    const cancelled = cancelJob(jobId);

    if (!cancelled) {
      return Response.json({ error: "Job not found" } as ErrorResponse, {
        status: 404,
      });
    }

    return Response.json(
      {
        success: true,
        message: "Job cancelled",
      },
      { status: 200 }
    );
  } else {
    return Response.json({ error: "Method not allowed" } as ErrorResponse, {
      status: 405,
    });
  }
}
