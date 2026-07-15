# entwerfen.

Ein kleiner KI-Bildgenerator für Architektur-Visualisierungen: Bildgeometrie (Skizze/Foto) hochladen, Prompt schreiben, Bild generieren.

## Nutzung

`index.html` direkt im Browser öffnen, kein Build-Schritt nötig.

- `index.html` – Struktur
- `styles.css` – Design
- `app.js` – Formular-Logik, Bildgenerierung, Verlauf

Die eigentliche Bilderzeugung läuft über [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) (FLUX-Modelle), direkt aus dem Browser mit einem eigenen Hugging-Face-Zugriffstoken. Das Token wird nur lokal in `localStorage` gespeichert und ausschließlich an huggingface.co gesendet.

Ein Token mit "Inference Providers"-Berechtigung lässt sich hier erstellen: https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained

Hinweis: Ein direkter Aufruf clientseitig ohne eigenen Server funktioniert bei Hugging Face, aber nicht bei OpenAI oder Google – deren APIs blockieren Cross-Origin-Anfragen aus dem Browser (CORS).
