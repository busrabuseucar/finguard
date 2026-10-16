# İşletim ve sürüm doğrulama — Gemini destekli mesaj değerlendirme

Son inceleme: **16 Ekim 2026**. Bu belge kurulum, veri akışı, sürüm kapıları, geri dönüş ve doğrulama kapsamını birlikte kaydeder. Bir yayın adresinin açılması, tüm üretim koşullarının tamamlandığı anlamına gelmez.

## Sürüm kanıtı

- Denetlenen uygulama commit’i: `0652a93d94d264c3f798a5bb2474764624d8a697`.
- [Bu commit için başarılı CI kaydı](https://github.com/busrabuseucar/finguard/actions/runs/38894973350).
- Doğrulanan otomatik kapsam: 29 backend + 6 tarayıcı testi.
- Testlerin gerçek servis, veri veya donanım yerine taklit kullandığı noktalar aşağıda açıkça ayrılmıştır.

## Kurulum ve çalışma

Depo kökünde, README’deki çalışma zamanı sürümüyle:

```sh
npm ci
npm test
npm run build
npm run demo
```

Veri akışı: Onaylı metin → Express doğrulama/sınırlar → Gemini → şema kontrollü yanıt.

Yapılandırma: GEMINI_API_KEY ve GEMINI_MODEL yalnızca backend ortamında. HOST varsayılan loopback. Demo tek sabit örnektir ve model çağırmaz.

## Yayın ve geri dönüş

1. Temiz checkout ve kilitli bağımlılıklarla yukarıdaki kontrolleri çalıştır. İlgili CI başarısını commit SHA ile eşleştir.
2. Yayın paketine yalnızca çalışma zamanı dosyalarını koy. Secret, ham kullanıcı verisi, yerel veritabanı ve kişisel hazırlık notları pakete girmemeli.
3. Hedef proje, kaynak commit, ortam ve yayın sürümünü kaydet. Önceki çalışan sürüm kimliğini geri dönüş için koru.
4. Yayından sonra ana kullanıcı akışını, hata durumunu ve varsa kalıcılığı doğrula. Sunucu hatası/yanlış sonuçta yeni yazmaları durdur; önceki doğrulanmış yayını geri al.
5. Şema değiştiyse yalnızca kodu geri almak yeterli değildir. Yedekten ayrı ortamda doğrulama yapmadan canlı veri üzerine yazma.

## Veri saklama ve kurtarma

Uygulama mesajları saklamaz. Secret depoyu ayrı yönet; anahtarı istemci paketine veya destek kaydına koyma. Sağlayıcı saklama koşulları ayrıca geçerlidir.

## Gerçek servis, model ve cihaz doğrulaması

Bu ortamda yapılandırılmış Gemini anahtarı/modeli yok; gerçek çağrı yapılmadı. İnternete açık model API’si için kimlik doğrulama, paylaşımlı kota, TLS ve harcama sınırı gerekir. Risk skoru kalibre edilmiş olasılık değildir.

## Yayın sonrası gözlem

Önce küçük ve sentetik girdilerle temel akışı kontrol et. Beklenmeyen hata, boş ekran, yanlış hesap, yetkisiz erişim veya veri kaybında tarih, uygulama commit’i, ortam ve yeniden üretme adımlarını kaydet; kişisel veri ve secret ekleme. Statik araçlarda tarayıcı konsolu/ağ hatalarını; backend bulunan projelerde durum kodu, gecikme ve hata oranını incele. Bu belgede sürekli izleme veya otomatik geri dönüş kurulmuş olduğu iddia edilmez.

## Kabul kaydı

Her yeni sürümün kaydı; test komutu/sonucu, kaynak SHA, yayın sürümü, gerçek servis/model sürümü, cihaz/işletim sistemi, veri kümesi özeti ve geri dönüş denemesini içermeli. Erişim veya fiziksel donanım yoksa ilgili satır **çalıştırılmadı** olarak tutulur; otomatik test başarısı yerine geçirilmez.
