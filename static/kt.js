/* KurdishTTS — the pages' behaviour: language, wallet sign-in, read-aloud,
   and the voice donation flow. No framework; the chain bundle (kt-chain.js)
   is loaded only when someone signs in. Every word a visitor sees is in T,
   in six languages; Kurmancî is the default (a Kurdish product opens in
   Kurdish). */
(function () {
  'use strict';

  var LANGS = ['kmr', 'ckb', 'tr', 'en', 'fa', 'ar'];
  // Where to get a wallet, for someone who has none. Both measured live (200).
  var STORE = {
    android: 'https://play.google.com/store/apps/details?id=io.pezkuwichain.wallet',
    extension: 'https://chromewebstore.google.com/detail/pezkuwi%7Bjs%7D-extension/fbnboicjjeebjhgnapneaeccpgjcdibn'
  };
  var RTL = { ckb: 1, fa: 1, ar: 1 };
  var T = {
    navSpeak:   { kmr: 'Bixwîne', ckb: 'بیخوێنەوە', tr: 'Seslendir', en: 'Read aloud', fa: 'خواندن', ar: 'اقرأ بصوت' },
    navDonate:  { kmr: 'Dengê xwe bexşîne', ckb: 'دەنگت ببەخشە', tr: 'Sesini bağışla', en: 'Donate your voice', fa: 'صدایت را اهدا کن', ar: 'تبرّع بصوتك' },
    signIn:     { kmr: 'Bi cuzdanê têkeve', ckb: 'بە جزدان بچۆ ژوورەوە', tr: 'Cüzdanla giriş', en: 'Sign in with wallet', fa: 'ورود با کیف پول', ar: 'الدخول بالمحفظة' },
    signOut:    { kmr: 'Derkeve', ckb: 'چوونەدەرەوە', tr: 'Çıkış', en: 'Sign out', fa: 'خروج', ar: 'خروج' },
    // read aloud
    speakTitle: { kmr: 'Nivîsa Kurdî bi deng bixwîne', ckb: 'دەقی کوردی بە دەنگ بخوێنەرەوە', tr: 'Kürtçe metni sesli oku', en: 'Read Kurdish text aloud', fa: 'متن کردی را با صدا بخوان', ar: 'اقرأ النص الكردي بصوت عالٍ' },
    speakLead:  { kmr: 'Kurmancî an Soranî binivîse, em ê bixwînin. Ev deng hîn ne yê me ye: dema ku têra xwe deng bên bexşîn, dengê neteweya Kurd dê bibe dengê vê malperê.',
                  ckb: 'بە کورمانجی یان سۆرانی بنووسە، ئێمە دەیخوێنینەوە. ئەم دەنگە هێشتا هی ئێمە نییە: کاتێک دەنگی پێویست ببەخشرێت، دەنگی نەتەوەی کورد دەبێتە دەنگی ئەم ماڵپەڕە.',
                  tr: 'Kurmancî ya da Soranî yazın, okuyalım. Bu ses henüz bizim değil: yeterince ses bağışlandığında Kurd ulusunun sesi bu sitenin sesi olacak.',
                  en: 'Write in Kurmancî or Soranî and we read it. This voice is not ours yet: once enough voices are donated, the Kurdish nation’s own voice becomes this site’s voice.',
                  fa: 'به کرمانجی یا سورانی بنویسید تا بخوانیم. این صدا هنوز از ما نیست: وقتی صدای کافی اهدا شود، صدای ملت کرد صدای این سایت می‌شود.',
                  ar: 'اكتب بالكرمانجية أو السورانية وسنقرؤه. هذا الصوت ليس صوتنا بعد: حين تُتبرَّع أصوات كافية يصبح صوت الأمة الكردية صوت هذا الموقع.' },
    dialect:    { kmr: 'Zarava', ckb: 'زاراوە', tr: 'Lehçe', en: 'Dialect', fa: 'گویش', ar: 'اللهجة' },
    kmr:        { kmr: 'Kurmancî', ckb: 'کورمانجی', tr: 'Kurmancî', en: 'Kurmanji', fa: 'کرمانجی', ar: 'الكرمانجية' },
    ckb:        { kmr: 'Soranî', ckb: 'سۆرانی', tr: 'Soranî', en: 'Sorani', fa: 'سورانی', ar: 'السورانية' },
    read:       { kmr: 'Bixwîne', ckb: 'بیخوێنەوە', tr: 'Oku', en: 'Read', fa: 'بخوان', ar: 'اقرأ' },
    reading:    { kmr: 'Tê xwendin…', ckb: 'دەخوێنرێتەوە…', tr: 'Okunuyor…', en: 'Reading…', fa: 'در حال خواندن…', ar: 'جارٍ القراءة…' },
    chars:      { kmr: 'tîp', ckb: 'پیت', tr: 'karakter', en: 'characters', fa: 'نویسه', ar: 'حرف' },
    sampleKmr:  { kmr: 'Ziman nasnameya me ye. Em ê wê biparêzin û bi hev re geş bikin.' },
    sampleCkb:  { kmr: 'زمان ناسنامەی ئێمەیە. پێکەوە دەیپارێزین و گەشەی پێدەدەین.' },
    // donate
    dTitle:     { kmr: 'Dengê xwe bexşî zimanê xwe bike', ckb: 'دەنگت بە زمانەکەت ببەخشە', tr: 'Sesini diline bağışla', en: 'Give your voice to your language', fa: 'صدایت را به زبانت هدیه کن', ar: 'امنح صوتك للغتك' },
    dLead:      { kmr: 'Hevokên kurt bi dengê xwe bixwîne. Her tomar dibe beşek ji dengê Kurdî yê pêşîn ku ji aliyê neteweya Kurd ve hatiye çêkirin, û tenê ji bo perwerdekirina dengê me yê Kurdî tê bikaranîn.',
                  ckb: 'ڕستەی کورت بە دەنگی خۆت بخوێنەوە. هەر تۆمارێک دەبێتە بەشێک لە یەکەم دەنگی کوردی کە نەتەوەی کورد خۆی دروستی دەکات، و تەنها بۆ ڕاهێنانی دەنگی کوردیی ئێمە بەکار دێت.',
                  tr: 'Kısa cümleleri kendi sesinle oku. Her kayıt, Kurd ulusunun kendi yaptığı ilk Kürtçe sesin parçası olur ve yalnızca Kürtçe sesimizi eğitmek için kullanılır.',
                  en: 'Read short sentences in your own voice. Every recording becomes part of the first Kurdish voice made by the Kurdish nation, used only to train our Kurdish voice.',
                  fa: 'جمله‌های کوتاه را با صدای خودت بخوان. هر ضبط بخشی از نخستین صدای کردی می‌شود که ملت کرد خود می‌سازد، و فقط برای آموزش صدای کردی ما به کار می‌رود.',
                  ar: 'اقرأ جملًا قصيرة بصوتك. يصبح كل تسجيل جزءًا من أول صوت كردي تصنعه الأمة الكردية، ويُستخدم فقط لتدريب صوتنا الكردي.' },
    hours:      { kmr: 'saet hatin tomarkirin', ckb: 'کاتژمێر تۆمارکراوە', tr: 'saat kaydedildi', en: 'hours recorded', fa: 'ساعت ضبط شده', ar: 'ساعة مسجّلة' },
    validHours: { kmr: 'saet hatin pejirandin', ckb: 'کاتژمێر پەسەندکراوە', tr: 'saat doğrulandı', en: 'hours validated', fa: 'ساعت تأیید شده', ar: 'ساعة مُتحقَّق منها' },
    speakers:   { kmr: 'bexşkar', ckb: 'بەخشەر', tr: 'bağışçı', en: 'donors', fa: 'اهداکننده', ar: 'متبرّع' },
    goal:       { kmr: 'Armanc', ckb: 'ئامانج', tr: 'Hedef', en: 'Goal', fa: 'هدف', ar: 'الهدف' },
    needSignIn: { kmr: 'Ji bo tomarkirinê bi cuzdana Pezkuwi têkeve. Mifteha te ji cuzdanê dernakeve; em tenê îmzeyekê dixwazin.',
                  ckb: 'بۆ تۆمارکردن بە جزدانی پەزکووی بچۆ ژوورەوە. کلیلەکەت لە جزدانەکە دەرناچێت؛ تەنها واژۆیەک داوا دەکەین.',
                  tr: 'Kayıt için Pezkuwi cüzdanıyla giriş yap. Anahtarın cüzdandan çıkmaz; yalnızca bir imza isteriz.',
                  en: 'Sign in with a Pezkuwi wallet to record. Your key never leaves the wallet; we only ask for one signature.',
                  fa: 'برای ضبط با کیف پول پزکووی وارد شوید. کلید شما از کیف پول خارج نمی‌شود؛ فقط یک امضا می‌خواهیم.',
                  ar: 'سجّل الدخول بمحفظة Pezkuwi للتسجيل. مفتاحك لا يغادر المحفظة؛ نطلب توقيعًا واحدًا فقط.' },
    profTitle:  { kmr: 'Berî destpêkirinê', ckb: 'پێش دەستپێکردن', tr: 'Başlamadan önce', en: 'Before you start', fa: 'پیش از شروع', ar: 'قبل أن تبدأ' },
    myDialect:  { kmr: 'Tu bi kîjan zaravayê diaxivî?', ckb: 'بە کام زاراوە قسە دەکەیت؟', tr: 'Hangi lehçeyi konuşuyorsun?', en: 'Which dialect do you speak?', fa: 'به کدام گویش صحبت می‌کنید؟', ar: 'بأي لهجة تتحدث؟' },
    start:      { kmr: 'Dest pê bike', ckb: 'دەست پێبکە', tr: 'Başla', en: 'Start', fa: 'شروع', ar: 'ابدأ' },
    tabRecord:  { kmr: 'Tomar bike', ckb: 'تۆمار بکە', tr: 'Kaydet', en: 'Record', fa: 'ضبط', ar: 'سجّل' },
    tabReview:  { kmr: 'Guhdarî bike û bipejirîne', ckb: 'گوێ بگرە و پەسەندی بکە', tr: 'Dinle ve doğrula', en: 'Listen and check', fa: 'گوش بده و تأیید کن', ar: 'استمع وتحقّق' },
    tapRecord:  { kmr: 'Bitikîne, hevokê bixwîne, dîsa bitikîne', ckb: 'دەست لێبدە، ڕستەکە بخوێنەوە، دووبارە دەست لێبدە', tr: 'Bas, cümleyi oku, tekrar bas', en: 'Tap, read the sentence, tap again', fa: 'بزن، جمله را بخوان، دوباره بزن', ar: 'اضغط، اقرأ الجملة، اضغط مجددًا' },
    again:      { kmr: 'Dîsa', ckb: 'دووبارە', tr: 'Tekrar', en: 'Again', fa: 'دوباره', ar: 'مرة أخرى' },
    send:       { kmr: 'Bişîne', ckb: 'بینێرە', tr: 'Gönder', en: 'Send', fa: 'ارسال', ar: 'أرسل' },
    skip:       { kmr: 'Derbas bike', ckb: 'تێپەڕێنە', tr: 'Geç', en: 'Skip', fa: 'رد شو', ar: 'تخطَّ' },
    thanks:     { kmr: 'Spas! Tomar hat wergirtin.', ckb: 'سوپاس! تۆمارەکە وەرگیرا.', tr: 'Teşekkürler! Kayıt alındı.', en: 'Thank you! Recording received.', fa: 'سپاس! ضبط دریافت شد.', ar: 'شكرًا! تم استلام التسجيل.' },
    matches:    { kmr: 'Rast e', ckb: 'ڕاستە', tr: 'Doğru', en: 'It matches', fa: 'درست است', ar: 'مطابق' },
    noMatch:    { kmr: 'Ne rast e', ckb: 'ڕاست نییە', tr: 'Yanlış', en: 'It does not', fa: 'درست نیست', ar: 'غير مطابق' },
    reviewHow:  { kmr: 'Guhdarî bike: gelo deng tam vê hevokê dixwîne?', ckb: 'گوێ بگرە: ئایا دەنگەکە ڕێک ئەم ڕستەیە دەخوێنێتەوە؟', tr: 'Dinle: ses bu cümleyi tam olarak okuyor mu?', en: 'Listen: does the voice read exactly this sentence?', fa: 'گوش بده: آیا صدا دقیقاً همین جمله را می‌خواند؟', ar: 'استمع: هل يقرأ الصوت هذه الجملة بالضبط؟' },
    nothingToReview: { kmr: 'Niha tiştek ji bo guhdarîkirinê tune. Paşê dîsa were.', ckb: 'ئێستا هیچ شتێک بۆ گوێگرتن نییە. دواتر بگەڕێوە.', tr: 'Şu an dinlenecek kayıt yok. Sonra tekrar gel.', en: 'Nothing to check right now. Come back later.', fa: 'فعلاً چیزی برای بررسی نیست. بعداً برگرد.', ar: 'لا شيء للتحقق الآن. عد لاحقًا.' },
    mine:       { kmr: 'Tomarên te', ckb: 'تۆمارەکانت', tr: 'Kayıtların', en: 'Your recordings', fa: 'ضبط‌های تو', ar: 'تسجيلاتك' },
    minutes:    { kmr: 'deqîqe', ckb: 'خولەک', tr: 'dakika', en: 'minutes', fa: 'دقیقه', ar: 'دقيقة' },
    votes:      { kmr: 'pejirandin', ckb: 'پەسەندکردن', tr: 'doğrulama', en: 'checks', fa: 'بررسی', ar: 'تحقّق' },
    micDenied:  { kmr: 'Destûra mîkrofonê nehat dayîn. Di mîhengên gerokê de destûrê bide.', ckb: 'ڕێگەی مایکرۆفۆن نەدرا. لە ڕێکخستنەکانی وێبگەڕدا ڕێگە بدە.', tr: 'Mikrofon izni verilmedi. Tarayıcı ayarlarından izin ver.', en: 'Microphone permission was refused. Allow it in your browser settings.', fa: 'اجازه میکروفون داده نشد. در تنظیمات مرورگر اجازه دهید.', ar: 'رُفض إذن الميكروفون. اسمح به من إعدادات المتصفح.' },
    // machine checks, by code
    TOO_SHORT:  { kmr: 'Tomar pir kurt e.', ckb: 'تۆمارەکە زۆر کورتە.', tr: 'Kayıt çok kısa.', en: 'The recording is too short.', fa: 'ضبط خیلی کوتاه است.', ar: 'التسجيل قصير جدًا.' },
    TOO_LONG:   { kmr: 'Tomar pir dirêj e.', ckb: 'تۆمارەکە زۆر درێژە.', tr: 'Kayıt çok uzun.', en: 'The recording is too long.', fa: 'ضبط خیلی طولانی است.', ar: 'التسجيل طويل جدًا.' },
    TOO_QUIET:  { kmr: 'Deng pir nizm e — nêzîkî mîkrofonê bibe.', ckb: 'دەنگەکە زۆر نزمە — لە مایکرۆفۆنەکە نزیک ببەوە.', tr: 'Ses çok kısık — mikrofona yaklaş.', en: 'Too quiet — move closer to the microphone.', fa: 'صدا خیلی آرام است — به میکروفون نزدیک‌تر شوید.', ar: 'الصوت خافت جدًا — اقترب من الميكروفون.' },
    SILENT:     { kmr: 'Tu deng nehat bihîstin.', ckb: 'هیچ دەنگێک نەبیسترا.', tr: 'Ses duyulmadı.', en: 'No voice was heard.', fa: 'صدایی شنیده نشد.', ar: 'لم يُسمع أي صوت.' },
    CLIPPING:   { kmr: 'Deng pir bilind e û xera bûye — hinekî dûr bikeve.', ckb: 'دەنگەکە زۆر بەرزە و تێکچووە — کەمێک دوور بکەوەوە.', tr: 'Ses çok yüksek ve bozulmuş — biraz uzaklaş.', en: 'Too loud and distorted — move back a little.', fa: 'صدا خیلی بلند و مخدوش است — کمی فاصله بگیرید.', ar: 'الصوت عالٍ ومشوّه — ابتعد قليلًا.' },
    PACE:       { kmr: 'Dirêjahiya tomarê li gorî hevokê nayê — tenê hevokê bixwîne.', ckb: 'درێژیی تۆمارەکە لەگەڵ ڕستەکە ناگونجێت — تەنها ڕستەکە بخوێنەوە.', tr: 'Kayıt süresi cümleye uymuyor — yalnızca cümleyi oku.', en: 'The length does not fit the sentence — read just the sentence.', fa: 'طول ضبط با جمله جور نیست — فقط جمله را بخوانید.', ar: 'المدة لا تناسب الجملة — اقرأ الجملة فقط.' },
    DAILY_LIMIT:{ kmr: 'Ji bo îro têra xwe! Sibê dîsa were.', ckb: 'بۆ ئەمڕۆ بەسە! سبەی بگەڕێوە.', tr: 'Bugünlük yeter! Yarın tekrar gel.', en: 'Enough for today! Come back tomorrow.', fa: 'برای امروز کافی است! فردا برگرد.', ar: 'يكفي لليوم! عد غدًا.' },
    FAILED:     { kmr: 'Tiştek xelet çû. Dîsa biceribîne.', ckb: 'هەڵەیەک ڕوویدا. دووبارە هەوڵ بدەرەوە.', tr: 'Bir şeyler ters gitti. Tekrar dene.', en: 'Something went wrong. Try again.', fa: 'مشکلی پیش آمد. دوباره تلاش کنید.', ar: 'حدث خطأ. حاول مجددًا.' },
    // wallet
    wTitle:     { kmr: 'Cuzdana Pezkuwi', ckb: 'جزدانی پەزکووی', tr: 'Pezkuwi Cüzdan', en: 'Pezkuwi Wallet', fa: 'کیف پول پزکووی', ar: 'محفظة Pezkuwi' },
    wExt:       { kmr: 'Berfirehkerê gerokê', ckb: 'ئێکستێنشنی وێبگەڕ', tr: 'Tarayıcı eklentisi', en: 'Browser extension', fa: 'افزونه مرورگر', ar: 'إضافة المتصفح' },
    wExtSub:    { kmr: 'Pezkuwi Wallet ji bo Chrome', ckb: 'Pezkuwi Wallet بۆ Chrome', tr: 'Chrome için Pezkuwi Wallet', en: 'Pezkuwi Wallet for Chrome', fa: 'Pezkuwi Wallet برای Chrome', ar: 'Pezkuwi Wallet لمتصفح Chrome' },
    wApp:       { kmr: 'Sepana Pezkuwi Wallet', ckb: 'ئەپی Pezkuwi Wallet', tr: 'Pezkuwi Wallet uygulaması', en: 'Pezkuwi Wallet app', fa: 'برنامه Pezkuwi Wallet', ar: 'تطبيق Pezkuwi Wallet' },
    wAppSub:    { kmr: 'Li telefonê an bi koda QR', ckb: 'لە مۆبایل یان بە کۆدی QR', tr: 'Telefonda ya da QR kodla', en: 'On your phone, or by QR code', fa: 'روی گوشی یا با کد QR', ar: 'على الهاتف أو برمز QR' },
    wNoExt:     { kmr: 'Berfirehker nehat dîtin.', ckb: 'ئێکستێنشن نەدۆزرایەوە.', tr: 'Eklenti bulunamadı.', en: 'No extension found.', fa: 'افزونه‌ای پیدا نشد.', ar: 'لم يُعثر على إضافة.' },
    wInstall:   { kmr: 'Saz bike', ckb: 'دایبمەزرێنە', tr: 'Yükle', en: 'Install', fa: 'نصب', ar: 'ثبّت' },
    wWaiting:   { kmr: 'Li benda pejirandina cuzdanê…', ckb: 'چاوەڕێی پەسەندکردنی جزدان…', tr: 'Cüzdanda onay bekleniyor…', en: 'Waiting for the wallet…', fa: 'در انتظار تأیید کیف پول…', ar: 'بانتظار المحفظة…' },
    wScan:      { kmr: 'Pezkuwi Wallet → WalletConnect → kodê bixwîne', ckb: 'Pezkuwi Wallet → WalletConnect → کۆدەکە بخوێنەوە', tr: 'Pezkuwi Wallet → WalletConnect → kodu okut', en: 'Pezkuwi Wallet → WalletConnect → scan the code', fa: 'Pezkuwi Wallet → WalletConnect → کد را اسکن کنید', ar: 'Pezkuwi Wallet ← WalletConnect ← امسح الرمز' },
    wOpenApp:   { kmr: 'Pezkuwi Wallet veke', ckb: 'Pezkuwi Wallet بکەرەوە', tr: 'Pezkuwi Wallet’ı aç', en: 'Open Pezkuwi Wallet', fa: 'Pezkuwi Wallet را باز کن', ar: 'افتح Pezkuwi Wallet' },
    wRejected:  { kmr: 'Te daxwaz red kir.', ckb: 'داواکارییەکەت ڕەتکردەوە.', tr: 'İsteği reddettin.', en: 'You declined the request.', fa: 'درخواست را رد کردید.', ar: 'رفضت الطلب.' },
    needDialect:{ kmr: 'Zaravayê xwe hilbijêre.', ckb: 'زاراوەکەت هەڵبژێرە.', tr: 'Lehçeni seç.', en: 'Choose your dialect.', fa: 'گویش خود را انتخاب کنید.', ar: 'اختر لهجتك.' },
    needConsent:{ kmr: 'Her pênc qutiyan nîşan bike.', ckb: 'هەر پێنج خانەکە نیشانە بکە.', tr: 'Beş kutunun hepsini işaretle.', en: 'Tick all five boxes.', fa: 'هر پنج گزینه را علامت بزنید.', ar: 'ضع علامة على الخانات الخمس.' },
    required:   { kmr: '(pêwîst)', ckb: '(پێویست)', tr: '(zorunlu)', en: '(required)', fa: '(الزامی)', ar: '(مطلوب)' },
    getWallet:  { kmr: 'Cuzdana te tune? Belaş daxe:', ckb: 'جزدانت نییە؟ بەخۆڕایی دایبەزێنە:', tr: 'Cüzdanın yok mu? Ücretsiz indir:', en: 'No wallet yet? Get it free:', fa: 'کیف پول ندارید؟ رایگان دانلود کنید:', ar: 'لا تملك محفظة؟ نزّلها مجانًا:' },
    dlAndroid:  { kmr: 'Pezkuwi Wallet — Android', ckb: 'Pezkuwi Wallet — ئەندرۆید', tr: 'Pezkuwi Wallet — Android', en: 'Pezkuwi Wallet — Android', fa: 'Pezkuwi Wallet — اندروید', ar: 'Pezkuwi Wallet — أندرويد' },
    dlExt:      { kmr: 'Pezkuwi Extension — Chrome', ckb: 'Pezkuwi Extension — Chrome', tr: 'Pezkuwi Extension — Chrome', en: 'Pezkuwi Extension — Chrome', fa: 'Pezkuwi Extension — Chrome', ar: 'Pezkuwi Extension — Chrome' },
    forget:     { kmr: 'Tomarên min jê bibe', ckb: 'تۆمارەکانم بسڕەوە', tr: 'Kayıtlarımı sil', en: 'Delete my recordings', fa: 'ضبط‌هایم را حذف کن', ar: 'احذف تسجيلاتي' },
    forgetAsk:  { kmr: 'Hemû tomar, nirxandin û profîla te dê bi temamî bên jêbirin. Ev nayê vegerandin. Bidomîne?',
                  ckb: 'هەموو تۆمار، هەڵسەنگاندن و پرۆفایلەکەت بە تەواوی دەسڕدرێنەوە. ناگەڕێتەوە. بەردەوام دەبیت؟',
                  tr: 'Tüm kayıtların, oyların ve profilin kalıcı olarak silinecek. Geri alınamaz. Devam edilsin mi?',
                  en: 'All your recordings, checks and profile will be permanently deleted. This cannot be undone. Continue?',
                  fa: 'همه ضبط‌ها، بررسی‌ها و نمایه شما برای همیشه حذف می‌شود. قابل بازگشت نیست. ادامه می‌دهید؟',
                  ar: 'ستُحذف جميع تسجيلاتك وتقييماتك وملفك نهائيًا. لا يمكن التراجع. هل تتابع؟' },
    forgotten:  { kmr: 'Hat jêbirin.', ckb: 'سڕایەوە.', tr: 'Silindi.', en: 'Deleted.', fa: 'حذف شد.', ar: 'تم الحذف.' },
    terms:      { kmr: 'Mercên bikaranînê', ckb: 'مەرجەکانی بەکارهێنان', tr: 'Kullanım Koşulları', en: 'Terms of Use', fa: 'شرایط استفاده', ar: 'شروط الاستخدام' },
    privacy:    { kmr: 'Nepenî', ckb: 'تایبەتمەندی', tr: 'Gizlilik', en: 'Privacy', fa: 'حریم خصوصی', ar: 'الخصوصية' },
    brandSub:   { kmr: 'Dengê Kurdî', ckb: 'دەنگی کوردی', tr: 'Kurdî ses', en: 'Kurdish voice', fa: 'صدای کردی', ar: 'الصوت الكردي' },
    yourText:   { kmr: 'Nivîsa te', ckb: 'دەقەکەت', tr: 'Metnin', en: 'Your text', fa: 'متن شما', ar: 'نصّك' },
    kmrSub:     { kmr: 'Bakur, bi tîpên latînî', ckb: 'باکوور، بە پیتی لاتینی', tr: 'Kuzey, Latin harfleriyle', en: 'Northern, in Latin script', fa: 'شمالی، با خط لاتین', ar: 'الشمالية، بالحروف اللاتينية' },
    ckbSub:     { kmr: 'Navîn, bi tîpên erebî', ckb: 'ناوەڕاست، بە پیتی عەرەبی', tr: 'Orta, Arap harfleriyle', en: 'Central, in Arabic script', fa: 'مرکزی، با خط عربی', ar: 'الوسطى، بالحروف العربية' },
    inviteTitle:{ kmr: 'Ev deng dê bibe dengê te', ckb: 'ئەم دەنگە دەبێتە دەنگی تۆ', tr: 'Bu ses senin sesin olacak', en: 'This voice will become yours', fa: 'این صدا صدای تو خواهد شد', ar: 'سيصبح هذا الصوت صوتك' },
    inviteText: { kmr: 'Çend hevokan bixwîne; dengê Kurdî yê pêşerojê bi dengê te tê perwerdekirin.', ckb: 'چەند ڕستەیەک بخوێنەوە؛ دەنگی کوردیی داهاتوو بە دەنگی تۆ ڕادەهێنرێت.', tr: 'Birkaç cümle oku; geleceğin Kürtçe sesi senin sesinle eğitilsin.', en: 'Read a few sentences; the Kurdish voice of the future is trained on yours.', fa: 'چند جمله بخوان؛ صدای کردیِ آینده با صدای تو آموزش می‌بیند.', ar: 'اقرأ بضع جمل؛ يتدرّب الصوت الكردي القادم على صوتك.' },
    s2:         { kmr: 'Zarava û razîbûn', ckb: 'زاراوە و ڕەزامەندی', tr: 'Lehçe ve onay', en: 'Dialect and consent', fa: 'گویش و رضایت', ar: 'اللهجة والموافقة' },
    s3:         { kmr: 'Hevokê bixwîne', ckb: 'ڕستەکە بخوێنەوە', tr: 'Cümleyi oku', en: 'Read the sentence', fa: 'جمله را بخوان', ar: 'اقرأ الجملة' },
    keyRec:     { kmr: 'tomar', ckb: 'تۆمار', tr: 'kayıt', en: 'record', fa: 'ضبط', ar: 'تسجيل' },
    keySend:    { kmr: 'bişîne', ckb: 'ناردن', tr: 'gönder', en: 'send', fa: 'ارسال', ar: 'إرسال' },
    keySkip:    { kmr: 'derbas', ckb: 'تێپەڕاندن', tr: 'geç', en: 'skip', fa: 'رد', ar: 'تخطٍّ' },
    playSub:    { kmr: 'Ji bo Android, li Google Play', ckb: 'بۆ ئەندرۆید، لە Google Play', tr: 'Android için, Google Play’de', en: 'For Android, on Google Play', fa: 'برای اندروید، در Google Play', ar: 'لأندرويد، على Google Play' },
    extSub:     { kmr: 'Ji bo Chrome, li Chrome Web Store', ckb: 'بۆ Chrome، لە Chrome Web Store', tr: 'Chrome için, Chrome Web Store’da', en: 'For Chrome, on the Chrome Web Store', fa: 'برای Chrome، در Chrome Web Store', ar: 'لـ Chrome، على Chrome Web Store' },
    clipsUnit:  { kmr: 'tomar', ckb: 'تۆمار', tr: 'kayıt', en: 'recordings', fa: 'ضبط', ar: 'تسجيل' },
    aboutTitle: { kmr: 'Ev proje çi ye?', ckb: 'ئەم پڕۆژەیە چییە؟', tr: 'Bu proje nedir?', en: 'What is this project?', fa: 'این پروژه چیست؟', ar: 'ما هذا المشروع؟' },
    aboutText:  { kmr: 'KurdishTTS projeyeke ne-bazirganî ya Dîjîtal Kurdistanê ye. Armanc ew e ku Kurdî jî, wekî zimanên mezin ên cîhanê, di teknolojiya îro de bi deng bijî: nûçe bi deng bên xwendin, pirtûk bên guhdarîkirin, sepan bi Kurdî biaxivin. Ji bo vê, em modela xwe ya zekaya çêkirî, KurdAI, bi dengên neteweya Kurd perwerde dikin.',
                  ckb: 'KurdishTTS پڕۆژەیەکی ناقازانجی کوردستانی دیجیتاڵە. ئامانجەکەی ئەوەیە کە کوردیش، وەک زمانە گەورەکانی جیهان، لە تەکنەلۆژیای ئەمڕۆدا بە دەنگ بژی: هەواڵ بە دەنگ بخوێنرێتەوە، کتێب گوێی لێ بگیرێت، ئەپەکان بە کوردی قسە بکەن. بۆ ئەمە، مۆدێلی زیرەکی دەستکردی خۆمان، KurdAI، بە دەنگی نەتەوەی کورد ڕادەهێنین.',
                  tr: 'KurdishTTS, Dijital Kurdistan’ın kâr amacı gütmeyen bir projesidir. Amacı, Kürtçenin de dünyanın büyük dilleri gibi bugünün teknolojisinde sesiyle yaşaması: haberler sesli okunsun, kitaplar dinlenebilsin, uygulamalar Kürtçe konuşsun. Bunun için kendi yapay zekâ modelimiz KurdAI’yi Kurd ulusunun sesleriyle eğitiyoruz.',
                  en: 'KurdishTTS is a non-profit project of Digital Kurdistan. Its aim is for Kurdish, like the world’s major languages, to live in today’s technology with a voice: news read aloud, books you can listen to, apps that speak Kurdish. To get there, we are training our own AI model, KurdAI, on the voices of the Kurdish nation.',
                  fa: 'KurdishTTS پروژه‌ای غیرانتفاعی از کردستان دیجیتال است. هدف آن است که زبان کردی نیز، مانند زبان‌های بزرگ جهان، در فناوری امروز با صدا زنده باشد: اخبار با صدا خوانده شود، کتاب‌ها شنیدنی باشند، برنامه‌ها کردی سخن بگویند. برای این، مدل هوش مصنوعی خودمان، KurdAI، را با صدای ملت کرد آموزش می‌دهیم.',
                  ar: 'KurdishTTS مشروع غير ربحي من كردستان الرقمية. هدفه أن تحيا الكردية، مثل لغات العالم الكبرى، في تقنيات اليوم بصوتها: أخبار تُقرأ بصوت، وكتب تُسمع، وتطبيقات تتكلم الكردية. ولهذا ندرّب نموذج الذكاء الاصطناعي الخاص بنا، KurdAI، على أصوات الأمة الكردية.' },
    how1T:      { kmr: 'Deng tên bexşîn', ckb: 'دەنگ دەبەخشرێن', tr: 'Sesler bağışlanır', en: 'Voices are donated', fa: 'صداها اهدا می‌شوند', ar: 'تُتبرَّع الأصوات' },
    how1D:      { kmr: 'Endamên neteweya Kurd hevokên kurt bi dengê xwe dixwînin.', ckb: 'ئەندامانی نەتەوەی کورد ڕستەی کورت بە دەنگی خۆیان دەخوێننەوە.', tr: 'Kurd ulusunun üyeleri kısa cümleleri kendi sesleriyle okur.', en: 'Members of the Kurdish nation read short sentences in their own voice.', fa: 'اعضای ملت کرد جمله‌های کوتاه را با صدای خود می‌خوانند.', ar: 'يقرأ أبناء الأمة الكردية جملًا قصيرة بأصواتهم.' },
    how2T:      { kmr: 'KurdAI tê perwerdekirin', ckb: 'KurdAI ڕادەهێنرێت', tr: 'KurdAI eğitilir', en: 'KurdAI is trained', fa: 'KurdAI آموزش می‌بیند', ar: 'يُدرَّب KurdAI' },
    how2D:      { kmr: 'Bi tomarên pejirandî, modela me Kurdî xwendin û axaftinê hîn dibe.', ckb: 'بە تۆمارە پەسەندکراوەکان، مۆدێلەکەمان خوێندنەوە و قسەکردنی کوردی فێر دەبێت.', tr: 'Doğrulanmış kayıtlarla modelimiz Kürtçe okumayı ve konuşmayı öğrenir.', en: 'From the checked recordings, our model learns to read and speak Kurdish.', fa: 'مدل ما با ضبط‌های تأییدشده خواندن و گفتن کردی را می‌آموزد.', ar: 'من التسجيلات المُتحقَّق منها يتعلّم نموذجنا قراءة الكردية والتحدث بها.' },
    how3T:      { kmr: 'Kurdî bi deng dibe', ckb: 'کوردی دەنگی دەبێت', tr: 'Kürtçe sese kavuşur', en: 'Kurdish gets a voice', fa: 'کردی صدا پیدا می‌کند', ar: 'تنال الكردية صوتها' },
    how3D:      { kmr: 'Nûçe, pirtûk, sepan û platformên dîjîtal dikarin Kurdî bi deng bixwînin.', ckb: 'هەواڵ، کتێب، ئەپ و پلاتفۆرمە دیجیتاڵەکان دەتوانن کوردی بە دەنگ بخوێننەوە.', tr: 'Haberler, kitaplar, uygulamalar ve dijital platformlar Kürtçeyi sesli okuyabilir.', en: 'News, books, apps and digital platforms can read Kurdish aloud.', fa: 'اخبار، کتاب‌ها، برنامه‌ها و پلتفرم‌های دیجیتال می‌توانند کردی را با صدا بخوانند.', ar: 'تستطيع الأخبار والكتب والتطبيقات والمنصّات الرقمية قراءة الكردية بصوت.' },
    kaiDoor:    { kmr: 'Belgeyan bi deng bixwîne, vîdyoyan bike Kurdî, platforma xwe bi Kurdî biaxivîne. Binêre ka çi tê.', ckb: 'بەڵگەنامە بە دەنگ بخوێنەوە، ڤیدیۆ بکە بە کوردی، پلاتفۆرمەکەت بە کوردی بدوێنە. ببینە چی دێت.', tr: 'Belgeleri sesli okut, videoları Kürtçeye çevir, platformunu Kürtçe konuştur. Neler geldiğine bak.', en: 'Read documents aloud, dub videos into Kurdish, make your platform speak Kurdish. See what is coming.', fa: 'اسناد را با صدا بخوان، ویدیوها را کردی کن، پلتفرمت را به کردی به سخن درآور. ببین چه در راه است.', ar: 'اقرأ المستندات بصوت، ودبلج الفيديوهات إلى الكردية، واجعل منصّتك تتكلم الكردية. اطّلع على ما هو قادم.' },
    kaiOpen:    { kmr: 'KurdAI veke', ckb: 'KurdAI بکەرەوە', tr: 'KurdAI’yi aç', en: 'Open KurdAI', fa: 'KurdAI را باز کن', ar: 'افتح KurdAI' },
    kaiLead:    { kmr: 'KurdAI zekaya çêkirî ya Kurdî ye, ku bi dengên neteweya Kurd tê perwerdekirin. Dema perwerdeya wê temam bibe, ev amûr dê ji her kesî re vebin.', ckb: 'KurdAI زیرەکی دەستکردی کوردییە کە بە دەنگی نەتەوەی کورد ڕادەهێنرێت. کاتێک ڕاهێنانەکەی تەواو بێت، ئەم ئامرازانە بۆ هەمووان دەکرێنەوە.', tr: 'KurdAI, Kurd ulusunun sesleriyle eğitilen Kürtçe yapay zekâdır. Eğitimi tamamlandığında bu araçlar herkese açılacak.', en: 'KurdAI is the Kurdish artificial intelligence, trained on the voices of the Kurdish nation. When its training is complete, these tools open to everyone.', fa: 'KurdAI هوش مصنوعی کردی است که با صدای ملت کرد آموزش می‌بیند. وقتی آموزشش کامل شود، این ابزارها برای همه باز می‌شوند.', ar: 'KurdAI هو الذكاء الاصطناعي الكردي الذي يتدرّب على أصوات الأمة الكردية. عند اكتمال تدريبه تُفتح هذه الأدوات للجميع.' },
    kaiTraining:{ kmr: 'Perwerdeya KurdAI', ckb: 'ڕاهێنانی KurdAI', tr: 'KurdAI’nin eğitimi', en: 'KurdAI’s training', fa: 'آموزش KurdAI', ar: 'تدريب KurdAI' },
    kaiTrainingNote: { kmr: 'Saetên tomarên pejirandî, Kurmancî û Soranî bi hev re. Her deng wê nêzîktir dike.', ckb: 'کاتژمێرەکانی تۆماری پەسەندکراو، کورمانجی و سۆرانی پێکەوە. هەر دەنگێک نزیکتری دەکاتەوە.', tr: 'Doğrulanmış kayıt saatleri, Kurmancî ve Soranî birlikte. Her ses onu yaklaştırır.', en: 'Hours of checked recordings, Kurmancî and Soranî together. Every voice brings it closer.', fa: 'ساعت‌های ضبطِ تأییدشده، کرمانجی و سورانی با هم. هر صدا آن را نزدیک‌تر می‌کند.', ar: 'ساعات التسجيلات المُتحقَّق منها، الكرمانجية والسورانية معًا. كل صوت يقرّبه.' },
    kaiSoon:    { kmr: 'Di rê de', ckb: 'لە ڕێگادایە', tr: 'Yakında', en: 'Coming', fa: 'به‌زودی', ar: 'قريبًا' },
    kaiDoc:     { kmr: 'Belgeyekê bi deng bixwîne', ckb: 'بەڵگەنامەیەک بە دەنگ بخوێنەوە', tr: 'Belgeni sesli okut', en: 'Read a document aloud', fa: 'سندی را با صدا بخوان', ar: 'اقرأ مستندًا بصوت' },
    kaiDocText: { kmr: 'PDF, Word an pelê nivîsê bar bike; KurdAI wê bi Kurmancî an Soranî dixwîne û wekî MP3 dide te.', ckb: 'PDF، Word یان فایلی دەق باربکە؛ KurdAI بە کورمانجی یان سۆرانی دەیخوێنێتەوە و وەک MP3 دەیداتە تۆ.', tr: 'PDF, Word ya da metin dosyası yükle; KurdAI onu Kurmancî ya da Soranî okusun, MP3 olarak indir.', en: 'Upload a PDF, Word or text file; KurdAI reads it in Kurmancî or Soranî and gives you an MP3.', fa: 'فایل PDF، Word یا متنی بارگذاری کن؛ KurdAI آن را به کرمانجی یا سورانی می‌خواند و MP3 به تو می‌دهد.', ar: 'ارفع ملف PDF أو Word أو نص؛ يقرؤه KurdAI بالكرمانجية أو السورانية ويعطيك ملف MP3.' },
    kaiDocBtn:  { kmr: 'Belge hilbijêre', ckb: 'بەڵگەنامە هەڵبژێرە', tr: 'Belge seç', en: 'Choose a document', fa: 'انتخاب سند', ar: 'اختر مستندًا' },
    kaiDub:     { kmr: 'Vîdyoyekê bike Kurdî', ckb: 'ڤیدیۆیەک بکە بە کوردی', tr: 'Videoyu Kürtçeye dublajla', en: 'Dub a video into Kurdish', fa: 'ویدیویی را به کردی دوبله کن', ar: 'دبلج فيديو إلى الكردية' },
    kaiDubText: { kmr: 'Vîdyoyeke bi her zimanî bar bike; KurdAI wê werdigerîne û bi dengê Kurdî dublaj dike.', ckb: 'ڤیدیۆیەک بە هەر زمانێک باربکە؛ KurdAI وەریدەگێڕێت و بە دەنگی کوردی دۆبلاژی دەکات.', tr: 'Herhangi bir dilde video yükle; KurdAI çevirsin ve Kürtçe seslendirsin.', en: 'Upload a video in any language; KurdAI translates it and voices it in Kurdish.', fa: 'ویدیویی به هر زبانی بارگذاری کن؛ KurdAI آن را ترجمه و به کردی دوبله می‌کند.', ar: 'ارفع فيديو بأي لغة؛ يترجمه KurdAI ويدبلجه بالكردية.' },
    kaiDubBtn:  { kmr: 'Vîdyo bar bike', ckb: 'ڤیدیۆ باربکە', tr: 'Video yükle', en: 'Upload a video', fa: 'بارگذاری ویدیو', ar: 'ارفع فيديو' },
    kaiVid:     { kmr: 'Ji wêneyê vîdyo çêke', ckb: 'لە وێنەوە ڤیدیۆ دروست بکە', tr: 'Görselden video üret', en: 'Make a video from an image', fa: 'از تصویر ویدیو بساز', ar: 'اصنع فيديو من صورة' },
    kaiVidText: { kmr: 'Wêneyek û çend peyv bide; KurdAI jê vîdyoyeke kurt çêdike, bi dengê Kurdî.', ckb: 'وێنەیەک و چەند وشەیەک بدە؛ KurdAI ڤیدیۆیەکی کورتی لێ دروست دەکات، بە دەنگی کوردی.', tr: 'Bir görsel ve birkaç kelime ver; KurdAI ondan Kürtçe sesli kısa bir video üretsin.', en: 'Give an image and a few words; KurdAI makes a short video from it, with a Kurdish voice.', fa: 'یک تصویر و چند کلمه بده؛ KurdAI از آن ویدیویی کوتاه با صدای کردی می‌سازد.', ar: 'قدّم صورة وبضع كلمات؛ يصنع منها KurdAI فيديو قصيرًا بصوت كردي.' },
    kaiVidBtn:  { kmr: 'Wêne bar bike', ckb: 'وێنە باربکە', tr: 'Görsel yükle', en: 'Upload an image', fa: 'بارگذاری تصویر', ar: 'ارفع صورة' },
    kaiApi:     { kmr: 'Mifteya API ji bo platforma xwe', ckb: 'کلیلی API بۆ پلاتفۆرمەکەت', tr: 'Platformun için API anahtarı', en: 'An API key for your platform', fa: 'کلید API برای پلتفرمت', ar: 'مفتاح API لمنصّتك' },
    kaiApiText: { kmr: 'Mifteya API şîfreyeke taybet e ku dihêle malper an sepana te bixwe bi KurdAI re biaxive: nûçeyên xwe bi deng bike, bersivan bi Kurdî bide. Wekî Enstîtuya Teknolojiyê ya Kurdistana Dîjîtal, em ê di demeke nêzîk de platformên dîjîtal bi KurdAI piştgirî bikin.',
                  ckb: 'کلیلی API وشەی نهێنییەکی تایبەتە کە ڕێگە دەدات ماڵپەڕ یان ئەپەکەت خۆی لەگەڵ KurdAI قسە بکات: هەواڵەکانت بە دەنگ بکات، بە کوردی وەڵام بداتەوە. وەک پەیمانگای تەکنەلۆژیای کوردستانی دیجیتاڵ، لە داهاتوویەکی نزیکدا پاڵپشتی پلاتفۆرمە دیجیتاڵەکان دەکەین بە KurdAI.',
                  tr: 'API anahtarı, web sitenin ya da uygulamanın KurdAI ile kendiliğinden konuşmasını sağlayan özel bir şifredir: haberlerini seslendirir, Kürtçe yanıt verir. Dijital Kurdistan Teknoloji Enstitüsü olarak yakın gelecekte dijital platformları KurdAI ile destekleyeceğiz.',
                  en: 'An API key is a private code that lets your website or app talk to KurdAI on its own: voice your news, answer in Kurdish. As the Digital Kurdistan Tech Institute, we will support digital platforms with KurdAI in the near future.',
                  fa: 'کلید API رمزی خصوصی است که به وب‌سایت یا برنامه‌ات اجازه می‌دهد خودکار با KurdAI گفت‌وگو کند: اخبارت را با صدا کند، به کردی پاسخ دهد. به‌عنوان مؤسسه فناوری کردستان دیجیتال، در آینده‌ای نزدیک پلتفرم‌های دیجیتال را با KurdAI پشتیبانی خواهیم کرد.',
                  ar: 'مفتاح API رمز خاص يتيح لموقعك أو تطبيقك أن يتواصل مع KurdAI تلقائيًا: يحوّل أخبارك إلى صوت ويجيب بالكردية. بصفتنا معهد التقنية في كردستان الرقمية، سندعم المنصّات الرقمية بـ KurdAI في المستقبل القريب.' },
    kaiApiBtn:  { kmr: 'Mifteyê çêke', ckb: 'کلیل دروست بکە', tr: 'Anahtar oluştur', en: 'Create a key', fa: 'ساخت کلید', ar: 'أنشئ مفتاحًا' },
    kaiWait:    { kmr: 'Ev amûr dema perwerdeya KurdAI temam bibe dê çalak bibe. Tu dikarî bi bexşa dengê xwe vê zûtir bikî.', ckb: 'ئەم ئامرازە کاتێک ڕاهێنانی KurdAI تەواو بێت چالاک دەبێت. دەتوانیت بە بەخشینی دەنگت خێراتری بکەیت.', tr: 'Bu araç KurdAI’nin eğitimi tamamlandığında etkinleşecek. Sesini bağışlayarak bunu hızlandırabilirsin.', en: 'This tool turns on when KurdAI’s training is complete. You can speed that up by donating your voice.', fa: 'این ابزار وقتی آموزش KurdAI کامل شود فعال می‌شود. می‌توانی با اهدای صدایت آن را جلو بیندازی.', ar: 'تُفعَّل هذه الأداة عند اكتمال تدريب KurdAI. يمكنك تسريع ذلك بالتبرع بصوتك.' },
    close:      { kmr: 'Bigire', ckb: 'داخستن', tr: 'Kapat', en: 'Close', fa: 'بستن', ar: 'إغلاق' },
    footer:     { kmr: 'Projeyeke ne-bazirganî ya Dîjîtal Kurdistanê. Deng: MMS (Meta, CC BY-NC 4.0).', ckb: 'پڕۆژەیەکی ناقازانجی کوردستانی دیجیتاڵ. دەنگ: MMS (Meta، CC BY-NC 4.0).', tr: 'Dijital Kurdistan’ın kâr amacı gütmeyen projesi. Ses: MMS (Meta, CC BY-NC 4.0).', en: 'A non-profit project of Digital Kurdistan. Voice: MMS (Meta, CC BY-NC 4.0).', fa: 'پروژه‌ای غیرانتفاعی از کردستان دیجیتال. صدا: MMS (Meta، CC BY-NC 4.0).', ar: 'مشروع غير ربحي من كردستان الرقمية. الصوت: MMS (Meta، CC BY-NC 4.0).' }
  };

  // ── language ──────────────────────────────────────────────────────────────
  var root = document.documentElement;
  function stored() { try { return localStorage.getItem('kt-lang'); } catch (e) { return null; } }
  var lang = LANGS.indexOf(stored()) >= 0 ? stored() : 'kmr';
  function say(k) { var e = T[k]; return e ? (e[lang] || e.en || e.kmr || '') : k; }
  function applyLang(l) {
    lang = l;
    try { localStorage.setItem('kt-lang', l); } catch (e) { /* private mode */ }
    root.lang = l === 'ckb' ? 'ckb' : l;
    root.dir = RTL[l] ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = say(el.getAttribute('data-t')); });
    document.querySelectorAll('[data-t-aria]').forEach(function (el) { el.setAttribute('aria-label', say(el.getAttribute('data-t-aria'))); });
    var sel = document.querySelector('.langsel');
    if (sel) sel.value = l;
    document.dispatchEvent(new Event('kt-lang'));
  }

  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function api(method, path, body, isForm) {
    var opt = { method: method, credentials: 'same-origin', headers: {} };
    if (session.csrf) opt.headers['X-CSRF'] = session.csrf;
    if (body && !isForm) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    if (isForm) opt.body = body;
    return fetch(path, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, json: j }; });
    });
  }

  // ── session and wallet ───────────────────────────────────────────────────
  var session = { addr: null, csrf: null, speaker: null };
  function loadScript(src) {
    return new Promise(function (res, rej) {
      if (document.querySelector('script[data-src="' + src + '"]')) return res();
      var s = document.createElement('script'); s.src = src; s.dataset.src = src;
      s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  function chain() {
    window.DKN_WC_SRC = '/static/kt-wc.js';
    return loadScript('/static/kt-chain.js').then(function () { return window.DknChain; });
  }
  function refresh() {
    return api('GET', '/api/c/me').then(function (r) {
      session.addr = r.json.addr || null; session.csrf = r.json.csrf || null; session.speaker = r.json.speaker || null;
      paintAcct();
      document.dispatchEvent(new Event('kt-session'));
    });
  }
  function short(a) { return a ? a.slice(0, 6) + '…' + a.slice(-4) : ''; }
  function paintAcct() {
    var b = document.querySelector('.acct');
    if (!b) return;
    b.textContent = '';
    if (session.addr) { b.appendChild(h('code', null, short(session.addr))); b.appendChild(h('span', null, '· ' + say('signOut'))); }
    else b.appendChild(h('span', null, say('signIn')));
  }

  /** "No wallet yet? Get it:" with the two store links, as a block. */
  var ICON = {
    android: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#1DB45F" d="M4 3.2v17.6c0 .5.5.8.9.6l9.4-9.4L4.9 2.6c-.4-.2-.9.1-.9.6z"/><path fill="#F6B930" d="M17.5 8.7 14.3 12l3.2 3.3 3.7-2.1c.8-.5.8-1.7 0-2.2z"/><path fill="#E5322A" d="M14.3 12 4.9 21.4c.2.1.5.1.8 0l11.8-6.1z"/><path fill="#3DA5F4" d="M14.3 12 17.5 8.7 5.7 2.6c-.3-.1-.6-.1-.8 0z"/></svg>',
    extension: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#1DB45F"/><path fill="#E5322A" d="M12 2a10 10 0 0 1 8.7 5H12a5 5 0 0 0-4.6 3L4.1 5.3A10 10 0 0 1 12 2z"/><path fill="#F6B930" d="M20.7 7A10 10 0 0 1 12 22l4.3-7.5A5 5 0 0 0 17 12a5 5 0 0 0-1-3z"/><circle cx="12" cy="12" r="4" fill="#fff"/><circle cx="12" cy="12" r="3" fill="#3DA5F4"/></svg>'
  };
  /** The two ways to get a Pezkuwi wallet, as rows with the store's mark. */
  function storeRows(into) {
    into.textContent = '';
    [['android', 'dlAndroid', 'playSub'], ['extension', 'dlExt', 'extSub']].forEach(function (x) {
      var a = h('a', 'store'); a.href = STORE[x[0]]; a.target = '_blank'; a.rel = 'noopener';
      var ic = h('span'); ic.innerHTML = ICON[x[0]]; a.appendChild(ic.firstChild);
      var t = h('span'); t.appendChild(h('b', null, say(x[1]))); t.appendChild(h('small', null, say(x[2]))); a.appendChild(t);
      into.appendChild(a);
    });
    return into;
  }
  function storeLinks() {
    var box = h('div');
    box.appendChild(h('p', 'stores__lead', say('getWallet')));
    box.appendChild(storeRows(h('div', 'stores')));
    return box;
  }

  var sheet = null;
  function openSheet() {
    if (!sheet) {
      sheet = h('div', 'sheet'); sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
      sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet && !sheet.hidden) closeSheet(); });
      document.body.appendChild(sheet);
    }
    sheet.hidden = false;
    renderSheet('pick');
  }
  function closeSheet() { if (sheet) sheet.hidden = true; }
  function frame() {
    sheet.textContent = '';
    var box = h('div', 'sheet__box');
    var head = h('div', 'sheet__head');
    head.appendChild(h('b', null, say('wTitle')));
    var x = h('button', 'x', '×'); x.setAttribute('aria-label', say('close')); x.onclick = closeSheet;
    head.appendChild(x); box.appendChild(head); sheet.appendChild(box);
    return box;
  }
  function renderSheet(state, data) {
    var box = frame();
    if (state === 'pick') {
      box.appendChild(h('p', 'note', say('needSignIn')));
      var ext = h('button', 'opt'); ext.appendChild(h('span', null, '🧩'));
      var t1 = h('span'); t1.appendChild(h('b', null, say('wExt'))); t1.appendChild(h('small', null, say('wExtSub'))); ext.appendChild(t1);
      ext.onclick = function () { viaExtension(); };
      var app = h('button', 'opt'); app.appendChild(h('span', null, '📱'));
      var t2 = h('span'); t2.appendChild(h('b', null, say('wApp'))); t2.appendChild(h('small', null, say('wAppSub'))); app.appendChild(t2);
      app.onclick = function () { viaApp(); };
      box.appendChild(ext); box.appendChild(app);
      box.appendChild(storeLinks());
      ext.focus();
    } else if (state === 'accounts') {
      data.forEach(function (a) {
        var b = h('button', 'opt');
        var t = h('span'); t.appendChild(h('b', null, a.name || short(a.address))); t.appendChild(h('small', null, a.address)); b.appendChild(t);
        b.onclick = function () { signIn(a); };
        box.appendChild(b);
      });
    } else if (state === 'qr') {
      box.appendChild(h('p', 'note', say('wScan')));
      var img = h('img', 'qr'); img.src = data.qrDataUrl; img.alt = 'QR'; box.appendChild(img);
      if (data.deepLink) { var a = h('a', 'btn', say('wOpenApp')); a.href = data.deepLink; box.appendChild(a); }
    } else if (state === 'wait') {
      box.appendChild(h('p', null, say('wWaiting')));
    } else if (state === 'error') {
      box.appendChild(h('p', 'msg msg--bad', data.text));
      if (data.install) box.appendChild(storeLinks());
      var back = h('button', 'btn btn--ghost', '←'); back.onclick = function () { renderSheet('pick'); }; box.appendChild(back);
    }
  }
  function viaExtension() {
    renderSheet('wait');
    chain().then(function (C) { return C.connect(); }).then(function (r) {
      if (r.error === 'NO_EXTENSION') return renderSheet('error', { text: say('wNoExt'), install: true });
      if (r.error) return renderSheet('error', { text: say(r.error === 'REJECTED' ? 'wRejected' : 'FAILED') });
      if (r.accounts.length === 1) return signIn(r.accounts[0]);
      renderSheet('accounts', r.accounts);
    }).catch(function () { renderSheet('error', { text: say('FAILED') }); });
  }
  function viaApp() {
    renderSheet('wait');
    chain().then(function (C) {
      return C.wcRestore().then(function (acc) {
        if (acc.length) return signIn(acc[0]);
        return C.wcStart().then(function (p) {
          if (p.error) return renderSheet('error', { text: say('FAILED') + (p.error === 'WC_TIMEOUT' ? ' (WalletConnect)' : '') });
          var phone = /Android|iPhone|iPad/i.test(navigator.userAgent);
          if (phone && p.deepLink) { location.href = p.deepLink; renderSheet('wait'); } else renderSheet('qr', p);
          return p.approval().then(function (accs) { renderSheet('wait'); return signIn(accs[0]); });
        });
      });
    }).catch(function () { renderSheet('error', { text: say('FAILED') }); });
  }
  function signIn(acc) {
    renderSheet('wait');
    var C = window.DknChain;
    api('POST', '/api/c/nonce').then(function (r) {
      if (!r.ok) throw new Error('FAILED');
      var ch = r.json;
      return C.signMessage(acc.address, ch.peyam).then(function (s) {
        if (s.error) throw new Error(s.error);
        return api('POST', '/api/c/login', { address: acc.address, signature: s.signature, nonce: ch.nonce, dem: ch.dem });
      });
    }).then(function (r) {
      if (!r.ok) throw new Error('FAILED');
      closeSheet();
      return refresh();
    }).catch(function (e) {
      renderSheet('error', { text: say(String(e && e.message) === 'REJECTED' ? 'wRejected' : 'FAILED') });
    });
  }
  function signOut() {
    api('POST', '/api/c/logout').then(function () {
      if (window.DknChain && window.DknChain.wcDisconnect) window.DknChain.wcDisconnect();
      return refresh();
    });
  }

  // ── page: read aloud ─────────────────────────────────────────────────────
  function speakPage() {
    var ta = document.getElementById('txt'), out = document.getElementById('out'), go = document.getElementById('go');
    var count = document.getElementById('count'), msg = document.getElementById('msg');
    var seg = document.querySelector('[data-dialect]'), dialect = 'kmr';
    var MAX = 600;
    function sample() { ta.value = dialect === 'kmr' ? T.sampleKmr.kmr : T.sampleCkb.kmr; ta.dir = dialect === 'ckb' ? 'rtl' : 'ltr'; upd(); }
    seg.querySelector('[data-v="kmr"]').setAttribute('aria-checked', 'true');
    function upd() { count.textContent = ta.value.length + ' / ' + MAX + ' ' + say('chars'); go.disabled = !ta.value.trim() || ta.value.length > MAX; }
    seg.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        dialect = b.dataset.v;
        seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
        sample();
      });
    });
    ta.addEventListener('input', upd);
    document.addEventListener('kt-lang', upd);
    go.addEventListener('click', function () {
      msg.hidden = true; go.disabled = true; go.textContent = say('reading');
      fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: ta.value, dialect: dialect }) })
        .then(function (r) { if (!r.ok) return r.json().then(function (j) { throw new Error(j.detail || r.status); }); return r.blob(); })
        .then(function (b) { out.src = URL.createObjectURL(b); out.hidden = false; out.play().catch(function () {}); })
        .catch(function (e) { msg.textContent = String(e.message || e); msg.hidden = false; })
        .then(function () { go.textContent = say('read'); upd(); });
    });
    sample();
  }

  // ── page: donate ─────────────────────────────────────────────────────────
  function donatePage() {
    var GOAL_H = 50;
    var gate = document.getElementById('gate'), prof = document.getElementById('profile'), work = document.getElementById('work');
    function stats() {
      api('GET', '/api/donate/stats').then(function (r) {
        ['kmr', 'ckb'].forEach(function (d) {
          var s = r.json[d]; if (!s) return;
          var el = document.querySelector('[data-stat="' + d + '"]');
          el.querySelector('[data-k="h"]').textContent = s.hours;
          el.querySelector('[data-k="v"]').textContent = s.valid_hours;
          el.querySelector('[data-k="s"]').textContent = s.speakers;
          el.querySelector('.meter__bar i').style.setProperty('--p', Math.min(100, s.valid_hours / GOAL_H * 100) + '%');
        });
        var me = document.getElementById('me');
        if (r.json.me) { me.hidden = false; me.querySelector('[data-k="c"]').textContent = r.json.me.clips;
          me.querySelector('[data-k="m"]').textContent = r.json.me.minutes; me.querySelector('[data-k="v"]').textContent = r.json.me.votes; }
      });
    }
    function show() {
      gate.hidden = !!session.addr;
      var ready = session.speaker && session.speaker.consent_version === prof.dataset.consent && session.speaker.dialect;
      prof.hidden = !session.addr || !!ready;
      work.hidden = !ready;
      if (ready && !work.dataset.started) { work.dataset.started = '1'; nextSentence(); }
      stats();
    }
    document.addEventListener('kt-session', show);
    document.getElementById('gateBtn').addEventListener('click', openSheet);
    var gateStores = document.querySelector('[data-stores]');
    storeRows(gateStores);
    document.addEventListener('kt-lang', function () { storeRows(gateStores); });

    // profile + consent
    var pdial = prof.querySelector('[data-dialect]'), pdialect = null;
    var hint = document.getElementById('startHint');
    function pick(v) {
      pdialect = v;
      pdial.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-checked', x.dataset.v === v ? 'true' : 'false'); });
    }
    // The dialect is required and was the one thing nobody saw they had to
    // choose: Start stayed grey with nothing saying why. It now starts on the
    // dialect of the page's language, and what is still missing is spelt out.
    pick(lang === 'ckb' ? 'ckb' : 'kmr');
    pdial.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { pick(b.dataset.v); check(); });
    });
    // The consent text is legal/consent.md, sent with the page: a paragraph and
    // five separate boxes, all unticked, every one required.
    var CONSENT = JSON.parse(document.getElementById('consentData').textContent);
    var startBtn = document.getElementById('startBtn'), boxes = [];
    function inline(el, text) {
      // **bold** and [Privacy Policy] are the only markup the text uses.
      el.textContent = '';
      text.split(/(\*\*[^*]+\*\*|\[[^\]]+\])/).forEach(function (part) {
        if (/^\*\*/.test(part)) el.appendChild(h('b', null, part.slice(2, -2)));
        else if (/^\[/.test(part)) { var a = h('a', null, part.slice(1, -1)); a.href = '/privacy' + (lang === 'tr' ? '?lang=tr' : ''); a.target = '_blank'; el.appendChild(a); }
        else if (part) el.appendChild(document.createTextNode(part));
      });
    }
    function paintConsent() {
      var c = CONSENT[lang] || CONSENT.en, wrap = document.getElementById('consentBoxes');
      var was = boxes.map(function (b) { return b.checked; });
      document.getElementById('consentTitle').textContent = c.title;
      inline(document.getElementById('consentPara'), c.para);
      var t = document.getElementById('consentTerms'); t.textContent = c.terms; t.href = '/terms' + (lang === 'tr' ? '?lang=tr' : '');
      wrap.textContent = ''; boxes = [];
      c.boxes.forEach(function (text, i) {
        var l = h('label', 'check'), cb = h('input'); cb.type = 'checkbox'; cb.checked = !!was[i];
        cb.addEventListener('change', check);
        l.appendChild(cb); l.appendChild(h('span', null, text)); wrap.appendChild(l); boxes.push(cb);
      });
      document.getElementById('consentBox').dir = RTL[lang] ? 'rtl' : 'ltr';
    }
    function check() {
      var missing = [];
      if (!pdialect) missing.push(say('needDialect'));
      if (boxes.length !== 5 || boxes.some(function (b) { return !b.checked; })) missing.push(say('needConsent'));
      startBtn.disabled = missing.length > 0;
      hint.textContent = missing.join(' ');
      hint.hidden = !missing.length;
    }
    document.addEventListener('kt-lang', function () { paintConsent(); check(); });
    paintConsent();
    check();
    startBtn.addEventListener('click', function () {
      api('POST', '/api/donate/profile', { dialect: pdialect,
        boxes: boxes.map(function (b) { return b.checked; }), lang: lang })
        .then(function (r) { if (r.ok) refresh(); });
    });

    // tabs
    var tabs = work.querySelectorAll('.tabs button');
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        tabs.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        document.getElementById('panelRecord').hidden = b.dataset.tab !== 'record';
        document.getElementById('panelReview').hidden = b.dataset.tab !== 'review';
        if (b.dataset.tab === 'review') nextReview();
      });
    });

    // recording
    var queue = [], current = null, rec = null, chunks = [], blob = null, stream = null, meterRaf = 0;
    var sEl = document.getElementById('sentence'), recBtn = document.getElementById('rec'), play = document.getElementById('play');
    var again = document.getElementById('again'), send = document.getElementById('send'), skip = document.getElementById('skip');
    var rmsg = document.getElementById('rmsg'), wave = document.getElementById('wave'), wctx = wave.getContext('2d');
    function note(text, ok) { rmsg.textContent = text; rmsg.className = 'msg ' + (ok ? 'msg--ok' : 'msg--bad'); rmsg.hidden = !text; }
    function nextSentence() {
      blob = null; play.hidden = true; again.hidden = true; send.hidden = true;
      if (queue.length) { current = queue.shift(); sEl.textContent = current.text; sEl.dir = current.text.match(/[؀-ۿ]/) ? 'rtl' : 'ltr'; return; }
      api('GET', '/api/donate/next').then(function (r) { queue = (r.json.sentences || []); if (queue.length) nextSentence(); });
    }
    function mime() {
      var c = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'];
      for (var i = 0; i < c.length; i++) if (window.MediaRecorder && MediaRecorder.isTypeSupported(c[i])) return c[i];
      return '';
    }
    // While recording: the voice drawn as a moving line, and the sun's rays
    // around the button opening with its loudness. It is the donor's own
    // proof that the microphone hears them.
    function drawFlat() {
      wctx.clearRect(0, 0, wave.width, wave.height);
      wctx.strokeStyle = 'rgba(122,130,153,.45)'; wctx.lineWidth = 3;
      wctx.beginPath(); wctx.moveTo(0, wave.height / 2); wctx.lineTo(wave.width, wave.height / 2); wctx.stroke();
    }
    function meter(s) {
      try {
        var ac = new (window.AudioContext || window.webkitAudioContext)(), an = ac.createAnalyser();
        ac.createMediaStreamSource(s).connect(an); an.fftSize = 1024; var buf = new Uint8Array(an.fftSize);
        (function loop() {
          an.getByteTimeDomainData(buf);
          var m = 0, W = wave.width, H = wave.height;
          wctx.clearRect(0, 0, W, H);
          var g = wctx.createLinearGradient(0, 0, W, 0);
          g.addColorStop(0, '#0E8A43'); g.addColorStop(.5, '#1DB45F'); g.addColorStop(1, '#F6B930');
          wctx.strokeStyle = g; wctx.lineWidth = 4; wctx.lineJoin = 'round'; wctx.beginPath();
          for (var i = 0; i < buf.length; i++) {
            var v = (buf[i] - 128) / 128; m = Math.max(m, Math.abs(v));
            var x = i / (buf.length - 1) * W, y = H / 2 + v * H * .9;
            if (i) wctx.lineTo(x, y); else wctx.moveTo(x, y);
          }
          wctx.stroke();
          recBtn.style.setProperty('--lvl', Math.min(1, m * 1.6).toFixed(3));
          meterRaf = requestAnimationFrame(loop);
        })();
        return ac;
      } catch (e) { return null; }
    }
    drawFlat();
    var ac = null;
    function startRec() {
      note('');
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: true, channelCount: 1 } })
        .then(function (s) {
          stream = s; chunks = []; ac = meter(s);
          var m = mime(); rec = new MediaRecorder(s, m ? { mimeType: m } : undefined);
          rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
          rec.onstop = function () {
            blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
            play.src = URL.createObjectURL(blob); play.hidden = false; again.hidden = false; send.hidden = false;
            stream.getTracks().forEach(function (t) { t.stop(); }); cancelAnimationFrame(meterRaf);
            recBtn.style.setProperty('--lvl', 0); drawFlat();
            if (ac) ac.close();
          };
          rec.start(); recBtn.setAttribute('aria-pressed', 'true');
          setTimeout(function () { if (rec && rec.state === 'recording') stopRec(); }, 14500);
        })
        .catch(function () { note(say('micDenied')); });
    }
    function stopRec() { if (rec && rec.state === 'recording') { rec.stop(); recBtn.setAttribute('aria-pressed', 'false'); } }
    recBtn.addEventListener('click', function () { if (rec && rec.state === 'recording') stopRec(); else startRec(); });
    again.addEventListener('click', function () { blob = null; play.hidden = true; again.hidden = true; send.hidden = true; startRec(); });
    skip.addEventListener('click', function () { note(''); nextSentence(); });
    send.addEventListener('click', function () {
      if (!blob || !current) return;
      send.disabled = true;
      var f = new FormData(); f.append('sentence_id', current.id); f.append('audio', blob, 'clip');
      api('POST', '/api/donate/clip', f, true).then(function (r) {
        send.disabled = false;
        if (r.ok) { note(say('thanks'), true); stats(); nextSentence(); }
        else note(say(T[r.json.detail] ? r.json.detail : 'FAILED'));
      });
    });
    document.addEventListener('keydown', function (e) {
      if (work.hidden || document.getElementById('panelRecord').hidden || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); recBtn.click(); }
      else if (e.key === 'Enter' && !send.hidden) { e.preventDefault(); send.click(); }
      else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); skip.click(); }
    });

    // review
    var cur = null, vS = document.getElementById('vsentence'), vA = document.getElementById('vaudio'), vEmpty = document.getElementById('vempty'), vBox = document.getElementById('vbox');
    function nextReview() {
      api('GET', '/api/donate/review').then(function (r) {
        cur = r.json.clip;
        vEmpty.hidden = !!cur; vBox.hidden = !cur;
        if (cur) { vS.textContent = cur.text; vS.dir = cur.text.match(/[؀-ۿ]/) ? 'rtl' : 'ltr'; vA.src = cur.audio; }
      });
    }
    function vote(v) { if (!cur) return; api('POST', '/api/donate/vote', { clip_id: cur.id, val: v }).then(function () { stats(); nextReview(); }); }
    document.getElementById('yes').addEventListener('click', function () { vote(1); });
    document.getElementById('no').addEventListener('click', function () { vote(-1); });
    document.getElementById('vskip').addEventListener('click', nextReview);
    document.getElementById('forget').addEventListener('click', function () {
      if (!window.confirm(say('forgetAsk'))) return;
      api('POST', '/api/donate/forget').then(function (r) {
        if (r.ok) { window.alert(say('forgotten')); location.reload(); }
      });
    });
    show();
  }

  // ── page: KurdAI (what is coming) ───────────────────────────────────────
  // The tools are shown so people know what their voices are for. None of
  // them takes a file or makes a key yet: a press says when it will, and how
  // to bring that day closer. Nothing is uploaded, nothing is collected.
  function kurdaiPage() {
    var GOAL_H = 100;
    api('GET', '/api/donate/stats').then(function (r) {
      var v = ((r.json.kmr || {}).valid_hours || 0) + ((r.json.ckb || {}).valid_hours || 0);
      document.querySelector('[data-k="v"]').textContent = Math.round(v * 10) / 10;
      document.querySelector('[data-k="bar"]').style.setProperty('--p', Math.min(100, v / GOAL_H * 100) + '%');
    });
    function wait(box) {
      box.textContent = say('kaiWait') + ' ';
      var a = h('a', null, say('navDonate')); a.href = '/bexsh'; box.appendChild(a);
    }
    document.querySelectorAll('[data-tool]').forEach(function (b) {
      b.addEventListener('click', function () {
        var box = document.querySelector('[data-wait="' + b.dataset.tool + '"]');
        wait(box); box.hidden = false;
      });
    });
    document.addEventListener('kt-lang', function () {
      document.querySelectorAll('[data-wait]').forEach(function (box) { if (!box.hidden) wait(box); });
    });
  }

  // ── boot ─────────────────────────────────────────────────────────────────
  var sel = document.querySelector('.langsel');
  if (sel) sel.addEventListener('change', function () { applyLang(sel.value); });
  var acct = document.querySelector('.acct');
  if (acct) acct.addEventListener('click', function () { if (session.addr) signOut(); else openSheet(); });
  applyLang(lang);
  var page = document.body.dataset.page;
  if (page === 'speak') speakPage();
  if (page === 'donate') donatePage();
  if (page === 'kurdai') kurdaiPage();
  refresh();
  document.addEventListener('kt-lang', paintAcct);
})();
