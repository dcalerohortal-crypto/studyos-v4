export default function handler(): Response {
  return new Response(
    JSON.stringify({
      groqKey: process.env.GROQ_API_KEY ? "set" : "not set",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
