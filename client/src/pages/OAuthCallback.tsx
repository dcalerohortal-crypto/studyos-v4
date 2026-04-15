import { useEffect, useState } from "react";
import { useSearchParams } from "wouter";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Conectando con Google...");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(`Error: ${error}`);
      return;
    }

    if (code) {
      // Send code to parent window
      window.opener?.postMessage({ type: "google_oauth_code", code }, "*");
      setStatus("success");
      setMessage("¡Conectado! Cerrando...");

      // Close popup after success
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      setStatus("error");
      setMessage("No se recibió código de autorización");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-foreground font-semibold">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500">{message}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
