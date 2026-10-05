# KurdAi Voice — Gizlilik Politikası ve KVKK Aydınlatma Metni (kısa Türkçe sürüm)

**Çeviridir. İngilizce metin (`privacy.en.md`) esastır; farklılık olursa İngilizce metin geçerlidir.**
Sürüm: 2026-10-06 · Yürürlük: 2026-10-06

## 1. Veri sorumlusu
**Pez Kiwi Comp**, Georgia, Sagarejo Region, village Kvemo Lambalo, 4th street N2 · **privacy@dks.news**

## 2. Kısaca
- **Sesli okuma:** yazdığın metni saklamayız. Üretilen sesi en çok 7 gün önbellekte tutarız.
- **Ses bağışı:** kayıtlarını ve seçtiğin lehçeyi cüzdan adresine bağlı olarak saklarız. **Yalnızca kendi Kürtçe konuşma modellerimizi eğitmek ve test etmek için** kullanırız. Satmayız, proje dışına vermeyiz, yayımlamayız; sesini taklit etmek, seni tanımlamak veya reklam için kullanmayız.
- **"Kayıtlarımı sil"** düğmesiyle her an silebilirsin. **Önceden eğitilmiş bir model kayıtlarını "unutamaz"** (bkz. 5. bölüm).
- Reklam, ölçümleme veya takip çerezi yok. Zincire hiçbir şey yazılmaz.

## 3. İşlenen veriler, amaç, hukuki sebep, süre

| Amaç | Veri | Hukuki sebep (GDPR / KVKK) | Süre |
|---|---|---|---|
| Siteyi sunmak, güvenlik (sunucu kayıtları) | IP, zaman, adres, tarayıcı bilgisi | Meşru menfaat (GDPR 6/1-f; KVKK 5/2-f) | 14 gün |
| Kötüye kullanımı önleme (hız sınırı) | IP, istek zamanı | Meşru menfaat | Yalnız bellekte, ~1 dk |
| Sesli okuma | Metin, lehçe; üretilen ses | Talep ettiğin hizmetin sunulması (GDPR 6/1-b; KVKK 5/2-c) | Metin saklanmaz; ses ≤7 gün |
| dks.news haberlerini seslendirme | Yayımlanmış haber metni, iş kaydı | Meşru menfaat | Metin iş bitince silinir; kayıt 90 gün |
| Cüzdanla giriş | Cüzdan adresi, tek kullanımlık mesaj, oturum | Hizmetin sunulması | Mesaj 10 dk; oturum 30 gün; adres hesap silinene dek |
| Bağışçı profili | Yalnızca lehçe; 18+ beyanı | **Açık rıza** (GDPR 6/1-a + 9/2-a; KVKK 6) | Sen silene veya proje bitene dek |
| Ses kayıtları | FLAC kayıt, cümle, süre, ses düzeyi, durum | **Açık rıza** | Sen silene veya proje bitene dek; geçersiz kayıtlar 90 gün |
| Kayıt kontrolü (oylar) | Adres, kayıt, oy, zaman | Meşru menfaat (veri kalitesi) | Kayıt veya hesap durdukça |
| Model eğitimi ve testi | Geçerli kayıtların kopyaları ve lehçe; **cüzdan adresi yok**, rastgele kod | **Açık rıza** | Eğitim bitince silinir, en çok 30 gün |
| Rıza ve silme kanıtı | Adres (silmeden sonra tek yönlü özet), rıza sürümü ve dili, onaylar, zamanlar | Hukuki yükümlülük / meşru menfaat | Hesap silindikten sonra 3 yıl |
| Yedekler | — | — | **Şu an ayrı yedek tutulmuyor.** Eklenirse şifreli, AB'de ve en çok 35 gün |

## 4. Sesin neden "özel nitelikli" sayılıyor
Ses kaydı seni tanımlar. Ses tanıma için işlenen ses biyometrik veridir. Biz bunu yapmıyoruz, ama konu tartışmalıdır. Ayrıca lehçeyle birlikte ses **etnik kökeni** açığa çıkarabilir. Bu yüzden en güvenli yolu seçtik: kayıtları ve profili özel nitelikli veri sayıyoruz ve **yalnızca açık rızanla** işliyoruz. **Diğer bağışçılar kayıtlarını kontrol için dinler, ama cüzdan adresini görmez.** Kayıtları satmayız, vermeyiz, yayımlamayız. Yalnızca sözleşmeyle bağlı barındırma ve hesaplama (GPU) sağlayıcıları bizim adımıza işler.

> **Önceki kayıtlar:** 3 Ekim 2026'nden önce bağış sayfası kayıtları açık veri (CC0) olarak tanımlıyordu. Bu plan geri alındı. Hiçbir kayıt yayımlanmadı ve yayımlanmayacak.

## 5. Silme — ve silmenin yapamadığı
`/bexsh` sayfasında **"Kayıtlarımı sil"** düğmesine bas ya da bize yaz. Kimliğini cüzdanınla imza attırarak doğrularız.
- **Hemen:** kayıtların, ölçümler, lehçe bilgin, oyların ve oturumların sunucudan silinir. Talepten sonra başlayan hiçbir eğitim veya testte kullanılmaz.
- **En çok 35 gün içinde:** yedeklerdeki ve sürmekte olan eğitimdeki kopyalar da silinir.
- **Silmenin yapamadığı:** bir model, kayıtları dosya olarak içermez. Ama **önceden eğitilmiş bir model bir kaydı pratikte "unutamaz"**; o modelden katkını çıkaramayız. Sonraki modeller kayıtlarını hiç kullanmaz. Bunu kayıttan önce söylüyoruz ki rızan bilgilendirilmiş olsun.

## 6. Modeller
Eğitilen modeller — kayıtların asla — hizmet olarak sunulabilir veya yayımlanabilir. **Yayımlanmış bir model geri çağrılamaz.** Hiçbir bağışçının sesini seçilebilir ses olarak sunmayız. Ayrıca onayı olmadan ağırlıkla tek bir kişinin kayıtlarından oluşan bir ses yayımlamayız.

## 7. Üçüncü taraf hizmetler ve yurt dışına aktarım
- **Barındırma:** Contabo GmbH (Almanya); sunucu AB'de (Lauterbourg, Fransa).
- **WalletConnect / Reown:** Yalnızca telefonla cüzdan bağlarsan IP ve şifreli eşleşme mesajları gider; WalletConnect'in kullanım raporlaması bu sitede kapalıdır.
- **PezkuwiChain RPC düğümü:** Girişte IP adresin bu düğüme görünür.
- **GPU sağlayıcısı:** Eğitim kopyaları gider, cüzdan adresi gitmez (ilk eğitimden önce burada adıyla belirtilecek).

AB dışına aktarımda yeterlilik kararı veya standart sözleşme maddeleri kullanılır.

## 8. Çerezler
Yalnızca **`kt_ses`** oturum çerezi kullanılır: girişte kurulur; HttpOnly, Secure, SameSite=Lax özelliklidir; 30 gün sonra veya çıkışta silinir. Tarayıcının yerel deposunda yalnızca **`kt-lang`** (dil seçimi) ve telefonla bağlandıysan WalletConnect oturumu tutulur. Ölçümleme veya reklam çerezi yoktur.

## 9. Hakların (KVKK md. 11 / GDPR)
Verilerine erişme ve kopyasını alma, düzeltme, silme, işlemeyi kısıtlama, taşınabilirlik (talep üzerine), meşru menfaate itiraz ve rızanı her an geri alma hakkın vardır. Başvuru: silme düğmesi veya **privacy@dks.news**. En geç **30 gün** içinde yanıt veririz.

Şikâyet:
- Türkiye'de önce bize başvurduktan sonra **Kişisel Verileri Koruma Kurulu**'na;
- AB'de yaşadığın ülkenin veri koruma otoritesine;
- Gürcistan'da **Kişisel Verilerin Korunması Servisi**'ne.

**KVKK notu:** Bu metin KVKK md. 10 uyarınca aydınlatma metnidir. Kayıttan önce verdiğin onay, bundan **ayrı** bir açık rızadır.

## 10. Reşit olmayanlar
Ses bağışı **yalnızca 18 yaş ve üstü** içindir. 18 yaş altına ait olduğu anlaşılan kayıtlar silinir.

## 11. Güvenlik ve risk altındaki bağışçılar
Bağlantılar şifrelidir. Kayıtlar, web sunucusu sürecinin okuyamadığı bir dizindedir ve sunucuya erişim anahtarla sınırlıdır. **Sesin tanınabilir.** Kürtçe bir projeyle ilişkilendirilmek yaşadığın yerde seni tehlikeye atabilecekse dikkatli düşün. İsteğe bağlı alanları boş bırak ve kimliğine bağlı olmayan bir cüzdan kullan. Verileri yalnızca bize uygulanan hukuk zorunlu kıldığında açıklarız. Hukuken geçersiz taleplere itiraz ederiz. Hukuk izin veriyorsa seni bilgilendiririz.

## 12. Değişiklikler
Değişiklikleri burada tarihiyle yayımlarız. **Bağışlanan kayıtların kullanımını değiştiren bir değişiklik, yeni onayın olmadan kayıtlarına uygulanmaz.**
