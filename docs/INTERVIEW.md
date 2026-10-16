# FinGuard — Teknik kararlar

## Problem ve mimari

Amaç, kullanıcıya bir finansal mesajın hangi ifadeler yüzünden şüpheli göründüğünü açıklamak. Bu sürüm bir sınıflandırma prototipidir; antivirüs, URL tarayıcısı veya doğruluğu ölçülmüş dolandırıcılık motoru değildir.

React → aynı kaynak /api → Express → Gemini REST → şema doğrulaması → risk bandı → React. Model çağrısı yalnızca sunucudadır. SDK yerine Node'un fetch ve AbortSignal API'leri kullanılır.

## Düzeltmelerin nedeni

- Backend bağımlılıkları ve çalıştırma komutları eksikti: tek paket ve lockfile ile kurulum tekrar üretilebilir hale getirildi.
- Sabit localhost URL'si dağıtımda yanlış bilgisayarı hedefliyordu: göreli /api yolu ve geliştirme proxy'si kullanıldı.
- JSON.parse yeterli değildi: sayı aralıkları, alan türleri, string uzunlukları ve dizi elemanları hem sunucuda hem istemcide kontrol ediliyor.
- Bozuk model cevabı için önceki 50 risk / 45 güven fallback'i kaldırıldı. Başarısız analiz hata olarak gösterilir.
- Risk seviyesi artık skorla aynı eşiklerden türetilir; modelin çelişen seviye metnine güvenilmez.
- Hata nesneleri, ham model çıktısı ve anahtar istemciye veya uygulama loglarına taşınmaz.
- Bağımlılıklar latest yerine kesin sürümlere ve lockfile'a bağlıdır.

## Güven sınırları

Kullanıcı metni güvenilmeyen veridir. Model talimatları ayrı systemInstruction alanındadır. Model çıktısı da güvenilmeyen veridir: doğrulanır ve React tarafından düz metin olarak render edilir. Bu kontroller anlamsal doğruluğu kanıtlamaz.

CORS herkese açık değildir; farklı Origin taşıyan tarayıcı çağrıları reddedilir. Origin denetimi kimlik doğrulama değildir: komut satırı istemcisi Origin göndermeyebilir. Yerel bind adresi varsayılandır; canlı internete açılmadan oturum/kota/harcama kontrolleri gerekir.

Bir süreçte 10 istek/dakika ve 4 eşzamanlı işlem sınırı maliyet ve kaynak tüketimini sınırlar. Süreç yeniden başladığında sayaç sıfırlanır; çoklu instance için paylaşımlı store/gateway gerekir. 20 saniyelik zaman aşımı istemcinin sonsuza kadar beklemesini önler; sağlayıcının faturalanmasını kesin olarak durdurma garantisi değildir.

## Demo ve ölçüm ayrımı

Demo sabit bir fixture'dır, başka metni reddeder ve API anahtarına ihtiyaç duymaz. Bu sayede inceleyen kişi kurulum ve arayüzü deneyebilir; sabit çıktı canlı analiz gibi sunulmaz.

Otomatik test başarısı yazılım sözleşmesinin kontrolüdür. Sahte/gerçek mesajlardan oluşan bağımsız etiketli test kümesi bulunmadığı için model doğruluk iddiası yapılmaz. Sonraki adım: veri kökeni, yanlış pozitif/negatif maliyeti, prompt injection örnekleri ve model sürümü kayıtlı bir değerlendirme seti.

## Mülakatta gösterilecek akış

1. Temiz kurulum ve demo örneği.
2. Farklı metinde demo reddi; başarısızlıkta puan oluşmaması.
3. Bozuk reasons türünü yakalayan test.
4. Anahtarın frontend paketine girmediği mimari.
5. Gerçek Gemini doğrulamasının ve sınıflandırma benchmark'ının ayrı açık işler olduğu.
