import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ShieldAlert, ScanSearch, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import "./style.css";

import { MAX_INPUT, validateAnalysis } from "./contract.js";
import { sampleText } from "./example.js";
const API_URL = "/api/analyze";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [service, setService] = useState(null);
  const [consent, setConsent] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/health", {signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)])})
      .then(async response => {
        if (!response.ok) throw new Error();
        const health = await response.json();
        if (!["demo", "live"].includes(health.mode) || typeof health.configured !== "boolean") throw new Error();
        setService(health);
      }).catch(err => { if (err.name !== "AbortError") setError("Sunucuya ulaşılamadı. Backend'in çalıştığını kontrol et."); });
    return () => controller.abort();
  }, []);

  function updateText(value) {
    setText(value);
    setResult(null);
    setError("");
  }

  async function analyze() {
    setError("");
    setResult(null);

    if (text.trim().length < 5 || text.length > MAX_INPUT) {
      setError("5–5000 karakterlik mesaj veya bağlantı gir.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(25000)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analiz yapılamadı.");
      }

      if (!["demo", "live"].includes(data.mode)) throw new Error("Geçersiz analiz yanıtı.");
      setResult({...validateAnalysis(data), mode: data.mode});
    } catch (err) {
      setError(err.name === "TimeoutError" ? "İstek zaman aşımına uğradı. Tekrar deneyebilirsin." : err instanceof SyntaxError ? "Sunucu geçerli JSON döndürmedi." : err.message === "Failed to fetch" ? "Sunucuya ulaşılamadı." : err.message);
    } finally {
      setLoading(false);
    }
  }

  const riskScore = Number(result?.riskScore ?? 0);
  const scoreClass =
    riskScore >= 80 ? "critical" : riskScore >= 60 ? "high" : riskScore >= 35 ? "medium" : "low";

  return (
    <main className="page">
      <section className="hero">
        <div className="badge">
          <ShieldAlert size={18} />
          Finans & E-Ticaret Güvenliği
        </div>

        <h1>FinGuard AI</h1>
        <p>
          Şüpheli ödeme mesajlarını, sahte kampanya metinlerini ve dolandırıcılık sinyali taşıyan linkleri
          Gemini destekli analiz motoru ile değerlendirir.
        </p>
        <p className="notice" role="status">
          {service?.mode === "demo" ? "ÖRNEK DEMO — Sabit örnek sonuç gösterilir; canlı analiz yapılmaz." :
           service?.configured ? "Canlı analiz: metin Google Gemini servisine gönderilir. Şifre, kart numarası ve kişisel bilgi girme." :
           service ? "Canlı analiz yapılandırılmamış. API anahtarı ve model sunucuda tanımlanmalı; anahtarsız inceleme için demo modu kullanılabilir." :
           "Sunucu bağlantısı kontrol ediliyor…"}
        </p>
        <p className="notice">Bağlantılar açılmaz veya site güvenliği taranmaz. Risk ve güven puanları ölçülmüş dolandırıcılık olasılığı değildir; düşük puan güvenlik garantisi vermez.</p>
      </section>

      <section className="grid">
        <div className="card input-card">
          <div className="card-title">
            <ScanSearch size={22} />
            <h2>Mesaj / Link Analizi</h2>
          </div>

          <label htmlFor="message">İncelenecek mesaj</label>
          <textarea
            id="message"
            maxLength={MAX_INPUT}
            disabled={loading}
            value={text}
            onChange={(e) => updateText(e.target.value)}
            placeholder="Şüpheli mesajı veya linki buraya yapıştır..."
          />

          <small>{text.length} / {MAX_INPUT} karakter</small>
          {service?.mode === "live" && <label className="consent">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} disabled={loading} />
            Metnin analiz için Google Gemini'ye gönderilmesini kabul ediyorum.
          </label>}
          <div className="actions">
            <button className="secondary" onClick={() => updateText(sampleText)} disabled={loading}>
              Örnek Mesajı Doldur
            </button>

            <button className="primary" onClick={analyze} disabled={loading || !service?.configured || (service.mode === "live" && !consent)}>
              {loading ? (
                <>
                  <Loader2 className="spin" size={18} />
                  Analiz ediliyor
                </>
              ) : (
                "Analiz Et"
              )}
            </button>
          </div>

          {error && <div className="error" role="alert">{error}</div>}
        </div>

        <div className="card result-card">
          {!result ? (
            <div className="empty">
              <AlertTriangle size={42} />
              <h2>Sonuç burada görünecek</h2>
              <p>Analiz sonrası risk skoru, tehdit türü ve önerilen aksiyon listelenecek.</p>
            </div>
          ) : (
            <div className="result" aria-live="polite">
              {result.mode === "demo" && <p className="notice">Sabit örnek sonuç — canlı model çıktısı değildir.</p>}
              <div className={`score ${scoreClass}`}>
                <span>{riskScore}</span>
                <small>/100 Risk Skoru</small>
              </div>

              <div className="result-header">
                <h2>{result.riskLevel} Risk</h2>
                <p>{result.threatType}</p>
              </div>

              <div className="summary">{result.summary}</div>

              <div className="section">
                <h3>Risk Nedenleri</h3>
                <ul>
                  {(result.reasons || []).map((item, index) => (
                    <li key={`reason-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="section">
                <h3>Kırmızı Bayraklar</h3>
                <ul>
                  {(result.redFlags || []).length ? (
                    result.redFlags.map((item, index) => <li key={`flag-${index}`}>{item}</li>)
                  ) : (
                    <li>Belirgin kırmızı bayrak bulunamadı.</li>
                  )}
                </ul>
              </div>

              <div className="recommendation">
                <CheckCircle2 size={20} />
                <span>{result.recommendedAction}</span>
              </div>

              <div className="confidence">Modelin bildirdiği güven: %{result.confidence} (kalibre edilmemiş)</div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
