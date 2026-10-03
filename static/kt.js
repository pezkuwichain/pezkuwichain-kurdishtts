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
    gender:     { kmr: 'Zayend (ne mecbûrî)', ckb: 'ڕەگەز (ئارەزوومەندانە)', tr: 'Cinsiyet (isteğe bağlı)', en: 'Gender (optional)', fa: 'جنسیت (اختیاری)', ar: 'الجنس (اختياري)' },
    female:     { kmr: 'Jin', ckb: 'ژن', tr: 'Kadın', en: 'Female', fa: 'زن', ar: 'أنثى' },
    male:       { kmr: 'Mêr', ckb: 'پیاو', tr: 'Erkek', en: 'Male', fa: 'مرد', ar: 'ذكر' },
    other:      { kmr: 'Din', ckb: 'تر', tr: 'Diğer', en: 'Other', fa: 'دیگر', ar: 'آخر' },
    none:       { kmr: '—', ckb: '—', tr: '—', en: '—', fa: '—', ar: '—' },
    age:        { kmr: 'Temen (ne mecbûrî)', ckb: 'تەمەن (ئارەزوومەندانە)', tr: 'Yaş (isteğe bağlı)', en: 'Age (optional)', fa: 'سن (اختیاری)', ar: 'العمر (اختياري)' },
    region:     { kmr: 'Herêm / bajar (ne mecbûrî)', ckb: 'ناوچە / شار (ئارەزوومەندانە)', tr: 'Bölge / şehir (isteğe bağlı)', en: 'Region / city (optional)', fa: 'منطقه / شهر (اختیاری)', ar: 'المنطقة / المدينة (اختياري)' },
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
  function storeLinks() {
    var box = h('div', 'getwallet');
    box.appendChild(h('span', 'note', say('getWallet')));
    var row = h('div', 'row');
    [['android', 'dlAndroid'], ['extension', 'dlExt']].forEach(function (x) {
      var a = h('a', 'btn btn--ghost btn--sm', say(x[1]));
      a.href = STORE[x[0]]; a.target = '_blank'; a.rel = 'noopener';
      row.appendChild(a);
    });
    box.appendChild(row);
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
          el.querySelector('.bar i').style.setProperty('--p', Math.min(100, s.valid_hours / GOAL_H * 100) + '%');
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
      api('POST', '/api/donate/profile', { dialect: pdialect, gender: document.getElementById('gender').value,
        age_band: document.getElementById('ageband').value, region: document.getElementById('region').value,
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
    var rmsg = document.getElementById('rmsg'), level = document.querySelector('.level i');
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
    function meter(s) {
      try {
        var ac = new (window.AudioContext || window.webkitAudioContext)(), an = ac.createAnalyser();
        ac.createMediaStreamSource(s).connect(an); an.fftSize = 512; var buf = new Uint8Array(an.fftSize);
        (function loop() {
          an.getByteTimeDomainData(buf); var m = 0; for (var i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i] - 128));
          level.style.width = Math.min(100, m / 128 * 140) + '%'; meterRaf = requestAnimationFrame(loop);
        })();
        return ac;
      } catch (e) { return null; }
    }
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
            stream.getTracks().forEach(function (t) { t.stop(); }); cancelAnimationFrame(meterRaf); level.style.width = 0;
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

  // ── boot ─────────────────────────────────────────────────────────────────
  var sel = document.querySelector('.langsel');
  if (sel) sel.addEventListener('change', function () { applyLang(sel.value); });
  var acct = document.querySelector('.acct');
  if (acct) acct.addEventListener('click', function () { if (session.addr) signOut(); else openSheet(); });
  applyLang(lang);
  var page = document.body.dataset.page;
  if (page === 'speak') speakPage();
  if (page === 'donate') donatePage();
  refresh();
  document.addEventListener('kt-lang', paintAcct);
})();
