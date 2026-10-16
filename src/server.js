import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { createGeminiAnalyzer } from "./provider.js";

const demo = process.argv.includes("--demo");
const port = Number(process.env.PORT || 5000);
const host = process.env.HOST || "127.0.0.1";
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be 1–65535");
const configured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL);
const app = createApp({
  demo, configured,
  analyze: createGeminiAnalyzer({apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL}),
  distDir: process.argv.includes("--serve") || demo ? fileURLToPath(new URL("../dist", import.meta.url)) : undefined
});
const server = app.listen(port, host, () => console.log("FinGuard: http://" + host + ":" + port + " (" + (demo ? "demo" : "live") + ")"));
server.on("error", error => { console.error(error.code === "EADDRINUSE" ? "Port kullanımda. PORT değerini değiştir." : "Sunucu başlatılamadı."); process.exitCode = 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close());
