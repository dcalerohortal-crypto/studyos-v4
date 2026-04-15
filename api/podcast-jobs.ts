export interface PodcastJob {
  id: string;
  status:
    | "queued"
    | "extracting"
    | "generating-script"
    | "generating-audio"
    | "completed"
    | "error"
    | "cancelled";
  progress: number;
  config: PodcastConfig;
  documentText: string;
  notebookName: string;
  audioUrl?: string;
  script?: PodcastSegment[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PodcastConfig {
  format:
    | "detailed"
    | "brief"
    | "critical"
    | "debate"
    | "tutorial"
    | "entrevista"
    | "tecnico";
  language: "ES" | "EN" | "CA" | "GL" | "EU";
  duration: number;
  focus: string;
}

export interface PodcastSegment {
  speaker: string;
  text: string;
  duration?: number;
}

const jobs = new Map<string, PodcastJob>();
const JOB_TTL_MS = 60 * 60 * 1000;

function cleanOldJobs() {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    const age = now - new Date(job.updatedAt).getTime();
    if (age > JOB_TTL_MS || job.status === "cancelled") {
      jobs.delete(id);
    }
  }
}

setInterval(cleanOldJobs, 5 * 60 * 1000);

export function createJob(
  config: PodcastConfig,
  documentText: string,
  notebookName: string
): PodcastJob {
  const id = `podcast_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  const job: PodcastJob = {
    id,
    status: "queued",
    progress: 0,
    config,
    documentText,
    notebookName,
    createdAt: now,
    updatedAt: now,
  };

  jobs.set(id, job);
  return job;
}

export function getJob(id: string): PodcastJob | undefined {
  const job = jobs.get(id);
  if (job) {
    const age = Date.now() - new Date(job.updatedAt).getTime();
    if (age > JOB_TTL_MS || job.status === "cancelled") {
      jobs.delete(id);
      return undefined;
    }
  }
  return job;
}

export function updateJob(
  id: string,
  updates: Partial<PodcastJob>
): PodcastJob | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;

  const updated: PodcastJob = {
    ...job,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  jobs.set(id, updated);
  return updated;
}

export function cancelJob(id: string): boolean {
  const job = jobs.get(id);
  if (!job) return false;

  job.status = "cancelled";
  job.updatedAt = new Date().toISOString();
  jobs.set(id, job);
  return true;
}

export function getAllJobs(): PodcastJob[] {
  cleanOldJobs();
  return Array.from(jobs.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
