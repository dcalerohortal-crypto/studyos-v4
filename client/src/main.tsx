import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Desregistrar Service Workers antiguos que puedan corromper el Fetch en Vercel
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
