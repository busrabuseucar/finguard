// A hand-authored UI fixture, not a model evaluation or accuracy claim.
export const sampleText = "Sayın müşterimiz, kartınız askıya alınmıştır. Hemen bilgilerinizi güncelleyin: https://bank-guvenlik.example";
export const sampleAnalysis = {
  riskScore: 90,
  confidence: 85,
  threatType: "Banka kimliğine bürünme şüphesi",
  summary: "Örnek mesaj, hesap kısıtlaması ve aciliyet baskısıyla bilgi güncellemeye yönlendiriyor.",
  reasons: ["Hesabın askıya alındığı iddiasıyla aciliyet yaratılıyor.", "Mesaj bağlantısı resmi banka kanalı olarak doğrulanmış değil."],
  redFlags: ["Hemen işlem yapma baskısı", "Bağlantı üzerinden bilgi güncelleme talebi"],
  recommendedAction: "Mesajdaki bağlantıyı kullanmadan bankanın bildiğin resmi uygulamasından veya telefonundan doğrula."
};
