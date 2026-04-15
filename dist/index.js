// server/index.ts
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json());
  const agentChatHandler = async (req, res) => {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    const SYSTEM_PROMPT = `Eres el Agente IA de StudyOS, el asistente de estudio gamificado.
Tu misi\xF3n es ayudar al estudiante a organizar su estudio de forma inteligente.
Tienes acceso a estas skills:
1. sync_google_calendar - Sincronizar eventos de Google Calendar
2. organize_drive - Organizar archivos en Drive por materias  
3. send_daily_report - Enviar resumen diario por email
4. auto_track_study - Rastrear tiempo de estudio en cuadernos

Responde de forma \xFAtil y concisa.`;
    const response = `Entendido: "${message}". Como tu Agente IA, te ayudo a gestionar tu estudio. 

\xBFQu\xE9 te gustar\xEDa hacer?
- Consultar tu calendario
- Organizar tus archivos
- Recibir un resumen diario
- Rastrear tu tiempo de estudio

(T responde con las keywords: calendario, drive, reporte, tracking o ask para m\xE1s opciones)`;
    return res.json({ response, agent: "StudyOS Agent" });
  };
  app.post("/api/agent/chat", agentChatHandler);
  app.get("/api/agent/skills", (_req, res) => {
    return res.json({
      skills: [
        {
          name: "sync_google_calendar",
          description: "Sincroniza eventos de Google Calendar"
        },
        { name: "organize_drive", description: "Organiza Drive por materias" },
        {
          name: "send_daily_report",
          description: "Env\xEDa resumen diario por email"
        },
        { name: "auto_track_study", description: "Rastrea tiempo de estudio" }
      ]
    });
  });
  app.get("/api/skills/calendar/sync", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.replace("Bearer ", "");
      if (!accessToken) {
        const mockEvents = [
          {
            id: "1",
            title: "Math - Derivatives",
            start: (/* @__PURE__ */ new Date()).toISOString(),
            duration: 60
          },
          {
            id: "2",
            title: "Physics - Kinematics",
            start: new Date(Date.now() + 36e5).toISOString(),
            duration: 90
          },
          {
            id: "3",
            title: "English - Essay Review",
            start: new Date(Date.now() + 72e5).toISOString(),
            duration: 45
          }
        ];
        return res.json({
          success: true,
          events: mockEvents,
          count: mockEvents.length,
          demo: true
        });
      }
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/freeBusy?timeMin=${(/* @__PURE__ */ new Date()).toISOString()}&maxResults=10`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!response.ok) {
        throw new Error("Error fetching calendar");
      }
      const data = await response.json();
      const events = data.calendars?.primary?.busy?.map((e, i) => ({
        id: e.id || i,
        title: e.summary || "Evento",
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        duration: Math.round(
          (new Date(e.end?.dateTime).getTime() - new Date(e.start?.dateTime).getTime()) / 6e4
        )
      })) || [];
      return res.json({
        success: true,
        events,
        count: events.length,
        demo: false
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: "Error syncing calendar" });
    }
  });
  app.post("/api/skills/report/send", async (req, res) => {
    try {
      const { recipient, summary, accessToken } = req.body;
      if (!accessToken) {
        console.log(`[DEMO] Sending report to ${recipient}:`, summary);
        return res.json({
          success: true,
          message: "Reporte enviado (demo)",
          recipient,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          demo: true
        });
      }
      const emailContent = `To: ${recipient}\r
Subject: \u{1F4CA} Resumen Diario de Estudio - StudyOS\r
\r
${summary}`;
      const encodedEmail = Buffer.from(emailContent).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages.send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ raw: encodedEmail })
        }
      );
      if (!response.ok) {
        throw new Error("Error sending email");
      }
      return res.json({
        success: true,
        message: "Reporte enviado",
        recipient,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        demo: false
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: "Error sending report" });
    }
  });
  app.get("/api/skills/drive/organize", async (_req, res) => {
    try {
      const organized = [
        { folder: "Matem\xE1ticas", files: 12 },
        { folder: "F\xEDsica", files: 8 },
        { folder: "Qu\xEDmica", files: 6 },
        { folder: "Historia", files: 15 },
        { folder: "Ingl\xE9s", files: 10 }
      ];
      return res.json({ success: true, organized, total: 51 });
    } catch (error) {
      return res.status(500).json({ success: false, error: "Error organizing drive" });
    }
  });
  app.get("/api/skills/tracking/stats", async (_req, res) => {
    try {
      const stats = {
        today: { hours: 2.5, sessions: 3 },
        week: { hours: 15, sessions: 12 },
        month: { hours: 60, sessions: 45 },
        bySubject: {
          Matem\u00E1ticas: 5,
          F\u00EDsica: 4,
          Qu\u00EDmica: 3,
          Historia: 2,
          Ingl\u00E9s: 1
        }
      };
      return res.json({ success: true, stats });
    } catch (error) {
      return res.status(500).json({ success: false, error: "Error fetching tracking" });
    }
  });
  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
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
  const port = process.env.PORT || 3e3;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
