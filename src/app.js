import express from "express";
import { MAX_INPUT, validateAnalysis } from "./contract.js";
import { sampleText, sampleAnalysis } from "./example.js";
import { AnalysisError } from "./provider.js";

export function createApp({analyze, demo = false, configured = true, distDir, rateMax = 10}) {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.set({"X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY", "Cache-Control": "no-store"});
    next();
  });
  app.get("/api/health", (req, res) => res.json({status: "ok", mode: demo ? "demo" : "live", configured: demo || configured}));
  // One process-wide bucket bounds demo/provider cost and memory usage.
  // A shared gateway limiter is required for multiple server instances.
  let windowStart = Date.now();
  let requests = 0;
  app.use("/api/analyze", (req, res, next) => {
    if (Date.now() - windowStart >= 60000) { windowStart = Date.now(); requests = 0; }
    if (++requests > rateMax) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((60000 - (Date.now() - windowStart)) / 1000))));
      return res.status(429).json({error: "Çok fazla istek. Bir dakika sonra tekrar dene.", code: "RATE_LIMIT"});
    }
    next();
  });
  app.use("/api", (req, res, next) => {
    // Reject cross-site browser calls; no permissive CORS. CLI requests have no Origin.
    if (req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.headers.host) throw new Error();
      } catch {
        return res.status(403).json({error: "Bu kaynaktan istek kabul edilmiyor.", code: "ORIGIN_REJECTED"});
      }
    }
    next();
  });
  app.use(express.json({limit: "32kb"}));
  let active = 0;
  app.post("/api/analyze", async (req, res) => {
    if (!req.is("application/json")) return res.status(415).json({error: "JSON gövdesi gerekli.", code: "CONTENT_TYPE"});
    const text = req.body?.text;
    if (typeof text !== "string" || text.trim().length < 5 || text.length > MAX_INPUT) {
      return res.status(400).json({error: "5–5000 karakterlik mesaj veya bağlantı gir.", code: "INVALID_INPUT"});
    }
    if (active >= 4) return res.status(503).json({error: "Sunucu meşgul. Biraz sonra tekrar dene.", code: "BUSY"});
    active++;
    try {
      if (demo && text.trim() !== sampleText) throw new AnalysisError(400, "DEMO_SAMPLE_ONLY", "Demo yalnızca Örnek Mesajı Doldur düğmesindeki sabit örneği gösterir.");
      const result = validateAnalysis(demo ? sampleAnalysis : await analyze(text.trim()));
      res.json({...result, mode: demo ? "demo" : "live"});
    } catch (error) {
      const known = error instanceof AnalysisError;
      res.status(known ? error.status : 502).json({
        error: known ? error.message : "Geçerli analiz alınamadı. Risk puanı üretilmedi.",
        code: known ? error.code : "INVALID_ANALYSIS"
      });
    } finally { active--; }
  });
  app.use("/api", (req, res) => res.status(404).json({error: "API yolu bulunamadı.", code: "NOT_FOUND"}));
  if (distDir) app.use(express.static(distDir));
  app.use((error, req, res, next) => {
    const large = error.type === "entity.too.large";
    res.status(large ? 413 : 400).json({error: large ? "İstek boyutu sınırı aşıldı." : "Geçersiz istek gövdesi.", code: large ? "BODY_TOO_LARGE" : "INVALID_JSON"});
  });
  return app;
}
