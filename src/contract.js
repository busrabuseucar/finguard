export const MAX_INPUT = 5000;
export const riskLevelFor = score => score >= 80 ? "Kritik" : score >= 60 ? "Yüksek" : score >= 35 ? "Orta" : "Düşük";

const stringFields = ["threatType", "summary", "recommendedAction"];
const arrayFields = ["reasons", "redFlags"];
export const outputSchema = {
  type: "object",
  properties: {
    riskScore: {type: "number", minimum: 0, maximum: 100},
    confidence: {type: "number", minimum: 0, maximum: 100},
    threatType: {type: "string"},
    summary: {type: "string"},
    recommendedAction: {type: "string"},
    reasons: {type: "array", items: {type: "string"}},
    redFlags: {type: "array", items: {type: "string"}}
  },
  required: ["riskScore", "confidence", ...stringFields, ...arrayFields],
  additionalProperties: false
};

export function validateAnalysis(data) {
  const invalid = () => { throw new Error("Geçersiz analiz yanıtı."); };
  if (!data || typeof data !== "object" || Array.isArray(data)) invalid();
  for (const field of ["riskScore", "confidence"]) {
    if (typeof data[field] !== "number" || !Number.isFinite(data[field]) || data[field] < 0 || data[field] > 100) invalid();
  }
  const validString = v => typeof v === "string" && v.trim().length > 0 && v.length <= 2000;
  for (const field of stringFields) if (!validString(data[field])) invalid();
  for (const field of arrayFields) {
    if (!Array.isArray(data[field]) || data[field].length > 12 || !data[field].every(validString)) invalid();
  }
  if (!data.reasons.length) invalid();
  return Object.fromEntries([
    ...outputSchema.required.map(field => [field, data[field]]),
    ["riskLevel", riskLevelFor(data.riskScore)]
  ]);
}
