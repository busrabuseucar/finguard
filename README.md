# FinGuard AI

Türkçe finans ve e-ticaret mesajlarındaki dolandırıcılık sinyallerini açıklamalarıyla gösteren React + Express prototipi. BTK Hackathon 2026 sırasında prototiplenmiştir.

Metin, backend üzerinden Gemini'ye gönderilir; gelen yapılandırılmış yanıt uygulama tarafından doğrulanır. Hatalı veya eksik yanıt için risk skoru üretilmez.

Önceki prototipin ekran görüntüsü (güncel demo uyarıları bu eski görselde yer almıyor):

![FinGuard önceki prototip ekranı](./finguard-ai-dashboard-screenshot.png)

## Anahtarsız inceleme

Node.js 22.12+ (22 veya 24 LTS) ve npm:

~~~bash
git clone https://github.com/busrabuseucar/finguard-ai.git
cd finguard-ai
npm ci
npm run build
npm run demo
~~~

http://127.0.0.1:5000 adresini aç. **Örnek Mesajı Doldur → Analiz Et** adımlarını kullan.

Demo yalnızca depodaki tek sabit örneği gösterir. Model çağrısı yapmaz; başka metinleri analiz etmez. Ekranda ve API yanıtında açıkça demo olarak işaretlenir. Örnek puanlar elle hazırlanmıştır; ölçülmüş doğruluk sonucu değildir.

## Canlı Gemini analizi

.env.example dosyasını .env olarak kopyala:

~~~dotenv
GEMINI_API_KEY=kendi_anahtarin
GEMINI_MODEL=hesabinda_erisilebilir_model_adi
PORT=5000
HOST=127.0.0.1
~~~

GEMINI_MODEL için hesabında erişebildiğin, generateContent ve yapılandırılmış JSON çıktısını destekleyen modelin gerçek adını yaz. Eski kodda sabitlenen model adına bağımlı değildir. Anahtarı hiçbir zaman VITE_ değişkenine koyma veya Git'e ekleme.

~~~bash
npm run build
npm start
~~~

Arayüz canlı modda metnin Google Gemini'ye gönderileceğini belirtir ve gönderim öncesi kullanıcı onayı ister. Şifre, kart numarası ve kişisel veri girilmemelidir. Uygulama metni diske kaydetmez veya loglamaz; sağlayıcının veri işleme koşulları ayrıca geçerlidir.

Geliştirmede iki terminal: npm run server ve npm run dev. Vite /api isteklerini yerel backend'e yönlendirir. Standart portu değiştirirsen vite.config.js içindeki proxy hedefini de güncelle. npm run preview yalnızca statik önizlemedir; tam uygulama için npm start kullan.

## Çıktı ve sınırlar

| Alan | Anlamı |
|---|---|
| riskScore | 0–100 arasında modelin sezgisel değerlendirmesi |
| riskLevel | Sunucunun skordan türettiği seviye: 0–34 Düşük, 35–59 Orta, 60–79 Yüksek, 80–100 Kritik |
| threatType / summary | Şüphe türü ve kısa açıklama |
| reasons / redFlags | Metinsel gerekçeler ve işaretler; string dizileri |
| recommendedAction | Önerilen doğrulama adımı |
| confidence | Modelin bildirdiği, kalibre edilmemiş güven puanı |
| mode | demo veya live |

Bağlantılar açılmaz, hedef siteler taranmaz, alan adı itibarı kontrol edilmez. Düşük skor güvenli site/mesaj garantisi değildir. Prompt injection için talimat ve kullanıcı verisi ayrılmıştır; bu, modelin manipüle edilemeyeceğini garanti etmez. Bağımsız etiketli veriyle ölçülmüş doğruluk, precision/recall veya finansal kaybı önleme iddiası yoktur.

## API

- GET /api/health: süreç durumu, mod ve yapılandırma varlığı. API anahtarının geçerliliğini veya sağlayıcı erişimini kanıtlamaz.
- POST /api/analyze: application/json gövdesi, örneğin {"text":"İncelenecek mesaj"}.
- Metin 5–5000 karakter; gövde 32 KiB; sağlayıcı zaman aşımı 20 saniye.
- Süreç başına dakikada 10 analiz isteği; aynı anda en fazla 4 işlem. Limiti aşanlara 429/503.
- Geçersiz girdi 400; yapılandırma eksikliği 503; bozuk/engellenmiş sağlayıcı cevabı 502; zaman aşımı 504.
- Hatalarda risk puanı, ham model çıktısı ve sağlayıcı hata ayrıntıları döndürülmez.

Varsayılan dinleme adresi yalnızca yerel bilgisayardır. Bu sürümde hesap/oturum sistemi yoktur. İnternete açık canlı servis için kimlik doğrulama, TLS, kullanıcı kotası, paylaşımlı hız sınırı ve harcama kontrolü gerekir. Mevcut süreç bazlı sınır birden fazla sunucu arasında paylaşılmaz.

## Testler

~~~bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
~~~

- Node testleri gerçek yerel HTTP sunucusunda girdi/çıktı sözleşmesi, hata gizliliği, oran/eşzamanlılık sınırı ve demo ayrımını kontrol eder.
- Sağlayıcı testleri Gemini HTTP yanıtlarını taklit eder: geçerli, bozuk, engellenmiş, kesilmiş ve zaman aşımı.
- Playwright masaüstü/mobilde gerçek demo backend'ini, eski sonuç temizliğini, hatalı yanıtı ve taklit canlı sonuçta onay akışını kontrol eder.
- Testler Gemini anahtarı kullanmaz; canlı model kalitesini veya gerçek sağlayıcı bağlantısını doğrulamaz.

Bağımlılıklar sürüm ve package-lock.json ile sabitlenmiştir. CI Node 22/24 üzerinde npm ci, testler, build ve tarayıcı testlerini çalıştırır.

[Teknik kararlar ve mülakat notları](docs/INTERVIEW.md) · [Önceki video demosu](https://youtu.be/V3h4kIcDiKU)

Gemini REST sözleşmesi: [resmî API referansı](https://ai.google.dev/api/generate-content). Canlı entegrasyon hesabındaki model ve kota ile ayrıca doğrulanmalıdır.
