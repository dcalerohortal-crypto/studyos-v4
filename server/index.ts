import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(express.json());

  // API Routes
  const agentChatHandler = async (
    req: express.Request,
    res: express.Response
  ) => {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // System prompt para el agente
    const SYSTEM_PROMPT = `Eres el Agente IA de StudyOS, el asistente de estudio gamificado.
Tu misión es ayudar al estudiante a organizar su estudio de forma inteligente.
Tienes acceso a estas skills:
1. sync_google_calendar - Sincronizar eventos de Google Calendar
2. organize_drive - Organizar archivos en Drive por materias  
3. send_daily_report - Enviar resumen diario por email
4. auto_track_study - Rastrear tiempo de estudio en cuadernos

Responde de forma útil y concisa.`;

    // Simular respuesta del agente (en producción usaría Vercel AI SDK)
    const response = `Entendido: "${message}". Como tu Agente IA, te ayudo a gestionar tu estudio. 

¿Qué te gustaría hacer?
- Consultar tu calendario
- Organizar tus archivos
- Recibir un resumen diario
- Rastrear tu tiempo de estudio

(T responde con las keywords: calendario, drive, reporte, tracking o ask para más opciones)`;

    return res.json({ response, agent: "StudyOS Agent" });
  };

  // Route: POST /api/agent/chat
  app.post("/api/agent/chat", agentChatHandler);

  // Route: GET /api/agent/skills
  app.get("/api/agent/skills", (_req, res) => {
    return res.json({
      skills: [
        {
          name: "sync_google_calendar",
          description: "Sincroniza eventos de Google Calendar",
        },
        { name: "organize_drive", description: "Organiza Drive por materias" },
        {
          name: "send_daily_report",
          description: "Envía resumen diario por email",
        },
        { name: "auto_track_study", description: "Rastrea tiempo de estudio" },
      ],
    });
  });

  // Skill: sync_google_calendar (ahora con OAuth)
  app.get("/api/skills/calendar/sync", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.replace("Bearer ", "");

      if (!accessToken) {
        // Sin token - devolver datos demo
        const mockEvents = [
          {
            id: "1",
            title: "Math - Derivatives",
            start: new Date().toISOString(),
            duration: 60,
          },
          {
            id: "2",
            title: "Physics - Kinematics",
            start: new Date(Date.now() + 3600000).toISOString(),
            duration: 90,
          },
          {
            id: "3",
            title: "English - Essay Review",
            start: new Date(Date.now() + 7200000).toISOString(),
            duration: 45,
          },
        ];
        return res.json({
          success: true,
          events: mockEvents,
          count: mockEvents.length,
          demo: true,
        });
      }

      // Con token real - llamar a Google Calendar API
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/freeBusy?timeMin=${new Date().toISOString()}&maxResults=10`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        throw new Error("Error fetching calendar");
      }

      const data = await response.json();
      const events =
        data.calendars?.primary?.busy?.map((e: any, i: number) => ({
          id: e.id || i,
          title: e.summary || "Evento",
          start: e.start?.dateTime || e.start?.date,
          end: e.end?.dateTime || e.end?.date,
          duration: Math.round(
            (new Date(e.end?.dateTime).getTime() -
              new Date(e.start?.dateTime).getTime()) /
              60000
          ),
        })) || [];

      return res.json({
        success: true,
        events,
        count: events.length,
        demo: false,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, error: "Error syncing calendar" });
    }
  });

  // Skill: send_daily_report (ahora con OAuth)
  app.post("/api/skills/report/send", async (req, res) => {
    try {
      const { recipient, summary, accessToken } = req.body;

      if (!accessToken) {
        // Sin token - devolver demo
        console.log(`[DEMO] Sending report to ${recipient}:`, summary);
        return res.json({
          success: true,
          message: "Reporte enviado (demo)",
          recipient,
          timestamp: new Date().toISOString(),
          demo: true,
        });
      }

      // Con token real - enviar email
      const emailContent = `To: ${recipient}\r\nSubject: 📊 Resumen Diario de Estudio - StudyOS\r\n\r\n${summary}`;
      const encodedEmail = Buffer.from(emailContent)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages.send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: encodedEmail }),
        }
      );

      if (!response.ok) {
        throw new Error("Error sending email");
      }

      return res.json({
        success: true,
        message: "Reporte enviado",
        recipient,
        timestamp: new Date().toISOString(),
        demo: false,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, error: "Error sending report" });
    }
  });

  // Skill: organize_drive
  app.get("/api/skills/drive/organize", async (_req, res) => {
    try {
      // Simular organización - en prod usaría Google Drive API
      const organized = [
        { folder: "Matemáticas", files: 12 },
        { folder: "Física", files: 8 },
        { folder: "Química", files: 6 },
        { folder: "Historia", files: 15 },
        { folder: "Inglés", files: 10 },
      ];
      return res.json({ success: true, organized, total: 51 });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, error: "Error organizing drive" });
    }
  });

  // Skill: auto_track_study
  app.get("/api/skills/tracking/stats", async (_req, res) => {
    try {
      // Simular stats de tracking
      const stats = {
        today: { hours: 2.5, sessions: 3 },
        week: { hours: 15, sessions: 12 },
        month: { hours: 60, sessions: 45 },
        bySubject: {
          Matemáticas: 5,
          Física: 4,
          Química: 3,
          Historia: 2,
          Inglés: 1,
        },
      };
      return res.json({ success: true, stats });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, error: "Error fetching tracking" });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Google OAuth callback route
  app.get("/api/auth/callback", (req, res) => {
    const { code, state } = req.query;
    if (code) {
      res.send(`<script>
        window.opener.postMessage({ type: 'google_oauth_code', code: '${code}' }, '*');
        window.close();
      </script>`);
    } else {
      res.send("<script>window.close();</script>");
    }
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
