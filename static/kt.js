/* KurdAi Voice — the pages' behaviour: language, wallet sign-in, read-aloud,
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
    speakTitle:  { kmr: 'Biceribîne: bila zekaya çêkirî nivîsa te bixwîne', ckb: 'تاقی بکەرەوە: با زیرەکی دەستکرد دەقەکەت بخوێنێتەوە', tr: 'Dene: yazdığın metni yapay zekâ seslendirsin', en: 'Try it: let the AI read your text aloud', fa: 'امتحان کن: بگذار هوش مصنوعی متنت را بخواند', ar: 'جرّب: دع الذكاء الاصطناعي يقرأ نصّك' },
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
    hours:      { kmr: 'deqîqe hatin tomarkirin', ckb: 'خولەک تۆمارکراوە', tr: 'dakika kaydedildi', en: 'minutes recorded', fa: 'دقیقه ضبط شده', ar: 'دقيقة مسجّلة' },
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
    again:       { kmr: '↺ Ji nû ve bixwîne', ckb: '↺ دووبارە بیخوێنەوە', tr: '↺ Yeniden oku', en: '↺ Read it again', fa: '↺ دوباره بخوان', ar: '↺ اقرأها مجددًا' },
    send:        { kmr: '✓ Bişîne', ckb: '✓ بینێرە', tr: '✓ Gönder', en: '✓ Send', fa: '✓ ارسال', ar: '✓ أرسل' },
    skip:       { kmr: 'Derbas bike', ckb: 'تێپەڕێنە', tr: 'Geç', en: 'Skip', fa: 'رد شو', ar: 'تخطَّ' },
    thanks:     { kmr: 'Spas! Tomar hat wergirtin.', ckb: 'سوپاس! تۆمارەکە وەرگیرا.', tr: 'Teşekkürler! Kayıt alındı.', en: 'Thank you! Recording received.', fa: 'سپاس! ضبط دریافت شد.', ar: 'شكرًا! تم استلام التسجيل.' },
    matches:    { kmr: 'Rast e', ckb: 'ڕاستە', tr: 'Doğru', en: 'It matches', fa: 'درست است', ar: 'مطابق' },
    noMatch:    { kmr: 'Ne rast e', ckb: 'ڕاست نییە', tr: 'Yanlış', en: 'It does not', fa: 'درست نیست', ar: 'غير مطابق' },
    reviewHow:  { kmr: 'Guhdarî bike: gelo deng tam vê hevokê dixwîne?', ckb: 'گوێ بگرە: ئایا دەنگەکە ڕێک ئەم ڕستەیە دەخوێنێتەوە؟', tr: 'Dinle: ses bu cümleyi tam olarak okuyor mu?', en: 'Listen: does the voice read exactly this sentence?', fa: 'گوش بده: آیا صدا دقیقاً همین جمله را می‌خواند؟', ar: 'استمع: هل يقرأ الصوت هذه الجملة بالضبط؟' },
    nothingToReview: { kmr: 'Niha tiştek ji bo guhdarîkirinê tune. Paşê dîsa were.', ckb: 'ئێستا هیچ شتێک بۆ گوێگرتن نییە. دواتر بگەڕێوە.', tr: 'Şu an dinlenecek kayıt yok. Sonra tekrar gel.', en: 'Nothing to check right now. Come back later.', fa: 'فعلاً چیزی برای بررسی نیست. بعداً برگرد.', ar: 'لا شيء للتحقق الآن. عد لاحقًا.' },
    mine:       { kmr: 'Tomarên te', ckb: 'تۆمارەکانت', tr: 'Kayıtların', en: 'Your recordings', fa: 'ضبط‌های تو', ar: 'تسجيلاتك' },
    minutes:    { kmr: 'deqîqe', ckb: 'خولەک', tr: 'dakika', en: 'minutes', fa: 'دقیقه', ar: 'دقيقة' },
    votes:      { kmr: 'pejirandin', ckb: 'پەسەندکردن', tr: 'doğrulama', en: 'checks', fa: 'بررسی', ar: 'تحقّق' },
    micDenied:   { kmr: 'Mîkrofon hat astengkirin. Li kêleka navnîşanê nîşana qeflê (🔒) bitikîne → Mîkrofon → Destûr bide. Paşê rûpelê nû bike.', ckb: 'مایکرۆفۆن بلۆک کراوە. نیشانەی قوفڵ (🔒) لە تەنیشت ناونیشانەکە دابگرە ← مایکرۆفۆن ← ڕێگە بدە. پاشان پەڕەکە نوێ بکەرەوە.', tr: 'Mikrofon engellendi. Adres çubuğundaki kilit (🔒) simgesine bas → Mikrofon → İzin ver. Sonra sayfayı yenile.', en: 'The microphone is blocked. Tap the lock (🔒) next to the address → Microphone → Allow. Then reload the page.', fa: 'میکروفون مسدود است. نماد قفل (🔒) کنار نشانی را بزن ← میکروفون ← اجازه. سپس صفحه را دوباره بارگذاری کن.', ar: 'الميكروفون محظور. اضغط القفل (🔒) بجانب العنوان ← الميكروفون ← سماح. ثم أعد تحميل الصفحة.' },
    // machine checks, by code
    TOO_SHORT:   { kmr: 'Pir kurt bû — hevokê hemûyî bixwîne, paşê bitikîne.', ckb: 'زۆر کورت بوو — هەموو ڕستەکە بخوێنەوە، پاشان دابگرە.', tr: 'Çok kısa oldu — cümlenin tamamını oku, sonra bas.', en: 'Too short — read the whole sentence, then tap.', fa: 'خیلی کوتاه بود — کل جمله را بخوان، بعد بزن.', ar: 'قصير جدًا — اقرأ الجملة كاملة ثم اضغط.' },
    TOO_LONG:    { kmr: 'Pir dirêj bû — gava hevok qediya, yekser bitikîne.', ckb: 'زۆر درێژ بوو — کە ڕستەکە تەواو بوو، یەکسەر دابگرە.', tr: 'Çok uzun oldu — cümle bitince hemen bas.', en: 'Too long — tap as soon as you finish the sentence.', fa: 'خیلی طولانی بود — به محض تمام شدن جمله بزن.', ar: 'طويل جدًا — اضغط فور انتهاء الجملة.' },
    TOO_QUIET:   { kmr: 'Dengê te pir nizm e — telefonê nêzîkî devê xwe bike û dîsa biceribîne.', ckb: 'دەنگت زۆر نزمە — مۆبایلەکە لە دەمت نزیک بکەرەوە و دووبارە هەوڵ بدەرەوە.', tr: 'Sesin çok kısık — telefonu ağzına yaklaştır ve tekrar dene.', en: 'Too quiet — hold the phone closer to your mouth and try again.', fa: 'صدایت خیلی آرام است — گوشی را به دهانت نزدیک کن و دوباره امتحان کن.', ar: 'صوتك خافت جدًا — قرّب الهاتف من فمك وحاول مجددًا.' },
    SILENT:      { kmr: 'Tu deng nehat bihîstin — bitikîne û bi dengekî bilind bixwîne.', ckb: 'هیچ دەنگێک نەبیسترا — دابگرە و بە دەنگی بەرز بخوێنەوە.', tr: 'Hiç ses duyulmadı — düğmeye bas ve yüksek sesle oku.', en: 'No voice was heard — tap the button and read out loud.', fa: 'صدایی شنیده نشد — دکمه را بزن و بلند بخوان.', ar: 'لم يُسمع صوت — اضغط الزر واقرأ بصوت عالٍ.' },
    CLIPPING:    { kmr: 'Deng pir bilind bû û xera bû — telefonê hinekî dûr bike û dîsa biceribîne.', ckb: 'دەنگەکە زۆر بەرز بوو و تێکچوو — مۆبایلەکە کەمێک دوور بخەرەوە و دووبارە هەوڵ بدەرەوە.', tr: 'Ses çok yüksek, bozuldu — telefonu biraz uzaklaştır ve tekrar dene.', en: 'Too loud and distorted — hold the phone a little further away and try again.', fa: 'صدا خیلی بلند و مخدوش شد — گوشی را کمی دورتر بگیر و دوباره امتحان کن.', ar: 'الصوت عالٍ ومشوّه — أبعد الهاتف قليلًا وحاول مجددًا.' },
    PACE:        { kmr: 'Tomar li hevokê nayê — tenê vê hevokê bixwîne, paşê yekser bitikîne.', ckb: 'تۆمارەکە لەگەڵ ڕستەکە ناگونجێت — تەنها ئەم ڕستەیە بخوێنەوە، پاشان یەکسەر دابگرە.', tr: 'Kayıt cümleye uymuyor — yalnızca bu cümleyi oku, sonra hemen bas.', en: 'The recording does not fit the sentence — read only this sentence, then tap right away.', fa: 'ضبط با جمله جور نیست — فقط همین جمله را بخوان، بعد فوراً بزن.', ar: 'التسجيل لا يناسب الجملة — اقرأ هذه الجملة فقط ثم اضغط فورًا.' },
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
    aboutText:  { kmr: 'KurdAi Voice projeyeke ne-bazirganî ya Dîjîtal Kurdistanê ye. Armanc ew e ku Kurdî jî, wekî zimanên mezin ên cîhanê, di teknolojiya îro de bi deng bijî: nûçe bi deng bên xwendin, pirtûk bên guhdarîkirin, sepan bi Kurdî biaxivin. Ji bo vê, em modela xwe ya zekaya çêkirî, KurdAi, bi dengên neteweya Kurd perwerde dikin.',
                  ckb: 'KurdAi Voice پڕۆژەیەکی ناقازانجی کوردستانی دیجیتاڵە. ئامانجەکەی ئەوەیە کە کوردیش، وەک زمانە گەورەکانی جیهان، لە تەکنەلۆژیای ئەمڕۆدا بە دەنگ بژی: هەواڵ بە دەنگ بخوێنرێتەوە، کتێب گوێی لێ بگیرێت، ئەپەکان بە کوردی قسە بکەن. بۆ ئەمە، مۆدێلی زیرەکی دەستکردی خۆمان، KurdAi، بە دەنگی نەتەوەی کورد ڕادەهێنین.',
                  tr: 'KurdAi Voice, Dijital Kurdistan’ın kâr amacı gütmeyen bir projesidir. Amacı, Kürtçenin de dünyanın büyük dilleri gibi bugünün teknolojisinde sesiyle yaşaması: haberler sesli okunsun, kitaplar dinlenebilsin, uygulamalar Kürtçe konuşsun. Bunun için kendi yapay zekâ modelimiz KurdAi’yi Kurd ulusunun sesleriyle eğitiyoruz.',
                  en: 'KurdAi Voice is a non-profit project of Digital Kurdistan. Its aim is for Kurdish, like the world’s major languages, to live in today’s technology with a voice: news read aloud, books you can listen to, apps that speak Kurdish. To get there, we are training our own AI model, KurdAi, on the voices of the Kurdish nation.',
                  fa: 'KurdAi Voice پروژه‌ای غیرانتفاعی از کردستان دیجیتال است. هدف آن است که زبان کردی نیز، مانند زبان‌های بزرگ جهان، در فناوری امروز با صدا زنده باشد: اخبار با صدا خوانده شود، کتاب‌ها شنیدنی باشند، برنامه‌ها کردی سخن بگویند. برای این، مدل هوش مصنوعی خودمان، KurdAi، را با صدای ملت کرد آموزش می‌دهیم.',
                  ar: 'KurdAi Voice مشروع غير ربحي من كردستان الرقمية. هدفه أن تحيا الكردية، مثل لغات العالم الكبرى، في تقنيات اليوم بصوتها: أخبار تُقرأ بصوت، وكتب تُسمع، وتطبيقات تتكلم الكردية. ولهذا ندرّب نموذج الذكاء الاصطناعي الخاص بنا، KurdAi، على أصوات الأمة الكردية.' },
    how1T:      { kmr: 'Deng tên bexşîn', ckb: 'دەنگ دەبەخشرێن', tr: 'Sesler bağışlanır', en: 'Voices are donated', fa: 'صداها اهدا می‌شوند', ar: 'تُتبرَّع الأصوات' },
    how1D:      { kmr: 'Endamên neteweya Kurd hevokên kurt bi dengê xwe dixwînin.', ckb: 'ئەندامانی نەتەوەی کورد ڕستەی کورت بە دەنگی خۆیان دەخوێننەوە.', tr: 'Kurd ulusunun üyeleri kısa cümleleri kendi sesleriyle okur.', en: 'Members of the Kurdish nation read short sentences in their own voice.', fa: 'اعضای ملت کرد جمله‌های کوتاه را با صدای خود می‌خوانند.', ar: 'يقرأ أبناء الأمة الكردية جملًا قصيرة بأصواتهم.' },
    how2T:      { kmr: 'KurdAi tê perwerdekirin', ckb: 'KurdAi ڕادەهێنرێت', tr: 'KurdAi eğitilir', en: 'KurdAi is trained', fa: 'KurdAi آموزش می‌بیند', ar: 'يُدرَّب KurdAi' },
    how2D:      { kmr: 'Bi tomarên pejirandî, modela me Kurdî xwendin û axaftinê hîn dibe.', ckb: 'بە تۆمارە پەسەندکراوەکان، مۆدێلەکەمان خوێندنەوە و قسەکردنی کوردی فێر دەبێت.', tr: 'Doğrulanmış kayıtlarla modelimiz Kürtçe okumayı ve konuşmayı öğrenir.', en: 'From the checked recordings, our model learns to read and speak Kurdish.', fa: 'مدل ما با ضبط‌های تأییدشده خواندن و گفتن کردی را می‌آموزد.', ar: 'من التسجيلات المُتحقَّق منها يتعلّم نموذجنا قراءة الكردية والتحدث بها.' },
    how3T:      { kmr: 'Kurdî bi deng dibe', ckb: 'کوردی دەنگی دەبێت', tr: 'Kürtçe sese kavuşur', en: 'Kurdish gets a voice', fa: 'کردی صدا پیدا می‌کند', ar: 'تنال الكردية صوتها' },
    how3D:      { kmr: 'Nûçe, pirtûk, sepan û platformên dîjîtal dikarin Kurdî bi deng bixwînin.', ckb: 'هەواڵ، کتێب، ئەپ و پلاتفۆرمە دیجیتاڵەکان دەتوانن کوردی بە دەنگ بخوێننەوە.', tr: 'Haberler, kitaplar, uygulamalar ve dijital platformlar Kürtçeyi sesli okuyabilir.', en: 'News, books, apps and digital platforms can read Kurdish aloud.', fa: 'اخبار، کتاب‌ها، برنامه‌ها و پلتفرم‌های دیجیتال می‌توانند کردی را با صدا بخوانند.', ar: 'تستطيع الأخبار والكتب والتطبيقات والمنصّات الرقمية قراءة الكردية بصوت.' },
    kaiDoor:    { kmr: 'Belgeyan bi deng bixwîne, vîdyoyan bike Kurdî, platforma xwe bi Kurdî biaxivîne. Binêre ka çi tê.', ckb: 'بەڵگەنامە بە دەنگ بخوێنەوە، ڤیدیۆ بکە بە کوردی، پلاتفۆرمەکەت بە کوردی بدوێنە. ببینە چی دێت.', tr: 'Belgeleri sesli okut, videoları Kürtçeye çevir, platformunu Kürtçe konuştur. Neler geldiğine bak.', en: 'Read documents aloud, dub videos into Kurdish, make your platform speak Kurdish. See what is coming.', fa: 'اسناد را با صدا بخوان، ویدیوها را کردی کن، پلتفرمت را به کردی به سخن درآور. ببین چه در راه است.', ar: 'اقرأ المستندات بصوت، ودبلج الفيديوهات إلى الكردية، واجعل منصّتك تتكلم الكردية. اطّلع على ما هو قادم.' },
    kaiOpen:    { kmr: 'KurdAi veke', ckb: 'KurdAi بکەرەوە', tr: 'KurdAi’yi aç', en: 'Open KurdAi', fa: 'KurdAi را باز کن', ar: 'افتح KurdAi' },
    kaiLead:    { kmr: 'KurdAi zekaya çêkirî ya Kurdî ye, ku bi dengên neteweya Kurd tê perwerdekirin. Dema perwerdeya wê temam bibe, ev amûr dê ji her kesî re vebin.', ckb: 'KurdAi زیرەکی دەستکردی کوردییە کە بە دەنگی نەتەوەی کورد ڕادەهێنرێت. کاتێک ڕاهێنانەکەی تەواو بێت، ئەم ئامرازانە بۆ هەمووان دەکرێنەوە.', tr: 'KurdAi, Kurd ulusunun sesleriyle eğitilen Kürtçe yapay zekâdır. Eğitimi tamamlandığında bu araçlar herkese açılacak.', en: 'KurdAi is the Kurdish artificial intelligence, trained on the voices of the Kurdish nation. When its training is complete, these tools open to everyone.', fa: 'KurdAi هوش مصنوعی کردی است که با صدای ملت کرد آموزش می‌بیند. وقتی آموزشش کامل شود، این ابزارها برای همه باز می‌شوند.', ar: 'KurdAi هو الذكاء الاصطناعي الكردي الذي يتدرّب على أصوات الأمة الكردية. عند اكتمال تدريبه تُفتح هذه الأدوات للجميع.' },
    kaiTraining:{ kmr: 'Perwerdeya KurdAi', ckb: 'ڕاهێنانی KurdAi', tr: 'KurdAi’nin eğitimi', en: 'KurdAi’s training', fa: 'آموزش KurdAi', ar: 'تدريب KurdAi' },
    kaiTrainingNote: { kmr: 'Saetên tomarên pejirandî, Kurmancî û Soranî bi hev re. Her deng wê nêzîktir dike.', ckb: 'کاتژمێرەکانی تۆماری پەسەندکراو، کورمانجی و سۆرانی پێکەوە. هەر دەنگێک نزیکتری دەکاتەوە.', tr: 'Doğrulanmış kayıt saatleri, Kurmancî ve Soranî birlikte. Her ses onu yaklaştırır.', en: 'Hours of checked recordings, Kurmancî and Soranî together. Every voice brings it closer.', fa: 'ساعت‌های ضبطِ تأییدشده، کرمانجی و سورانی با هم. هر صدا آن را نزدیک‌تر می‌کند.', ar: 'ساعات التسجيلات المُتحقَّق منها، الكرمانجية والسورانية معًا. كل صوت يقرّبه.' },
    kaiSoon:    { kmr: 'Di rê de', ckb: 'لە ڕێگادایە', tr: 'Yakında', en: 'Coming', fa: 'به‌زودی', ar: 'قريبًا' },
    kaiDoc:     { kmr: 'Belgeyekê bi deng bixwîne', ckb: 'بەڵگەنامەیەک بە دەنگ بخوێنەوە', tr: 'Belgeni sesli okut', en: 'Read a document aloud', fa: 'سندی را با صدا بخوان', ar: 'اقرأ مستندًا بصوت' },
    kaiDocText: { kmr: 'PDF, Word an pelê nivîsê bar bike; KurdAi wê bi Kurmancî an Soranî dixwîne û wekî MP3 dide te.', ckb: 'PDF، Word یان فایلی دەق باربکە؛ KurdAi بە کورمانجی یان سۆرانی دەیخوێنێتەوە و وەک MP3 دەیداتە تۆ.', tr: 'PDF, Word ya da metin dosyası yükle; KurdAi onu Kurmancî ya da Soranî okusun, MP3 olarak indir.', en: 'Upload a PDF, Word or text file; KurdAi reads it in Kurmancî or Soranî and gives you an MP3.', fa: 'فایل PDF، Word یا متنی بارگذاری کن؛ KurdAi آن را به کرمانجی یا سورانی می‌خواند و MP3 به تو می‌دهد.', ar: 'ارفع ملف PDF أو Word أو نص؛ يقرؤه KurdAi بالكرمانجية أو السورانية ويعطيك ملف MP3.' },
    kaiDocBtn:  { kmr: 'Belge hilbijêre', ckb: 'بەڵگەنامە هەڵبژێرە', tr: 'Belge seç', en: 'Choose a document', fa: 'انتخاب سند', ar: 'اختر مستندًا' },
    kaiDub:     { kmr: 'Vîdyoyekê bike Kurdî', ckb: 'ڤیدیۆیەک بکە بە کوردی', tr: 'Videoyu Kürtçeye dublajla', en: 'Dub a video into Kurdish', fa: 'ویدیویی را به کردی دوبله کن', ar: 'دبلج فيديو إلى الكردية' },
    kaiDubText: { kmr: 'Vîdyoyeke bi her zimanî bar bike; KurdAi wê werdigerîne û bi dengê Kurdî dublaj dike.', ckb: 'ڤیدیۆیەک بە هەر زمانێک باربکە؛ KurdAi وەریدەگێڕێت و بە دەنگی کوردی دۆبلاژی دەکات.', tr: 'Herhangi bir dilde video yükle; KurdAi çevirsin ve Kürtçe seslendirsin.', en: 'Upload a video in any language; KurdAi translates it and voices it in Kurdish.', fa: 'ویدیویی به هر زبانی بارگذاری کن؛ KurdAi آن را ترجمه و به کردی دوبله می‌کند.', ar: 'ارفع فيديو بأي لغة؛ يترجمه KurdAi ويدبلجه بالكردية.' },
    kaiDubBtn:  { kmr: 'Vîdyo bar bike', ckb: 'ڤیدیۆ باربکە', tr: 'Video yükle', en: 'Upload a video', fa: 'بارگذاری ویدیو', ar: 'ارفع فيديو' },
    kaiVid:     { kmr: 'Ji wêneyê vîdyo çêke', ckb: 'لە وێنەوە ڤیدیۆ دروست بکە', tr: 'Görselden video üret', en: 'Make a video from an image', fa: 'از تصویر ویدیو بساز', ar: 'اصنع فيديو من صورة' },
    kaiVidText: { kmr: 'Wêneyek û çend peyv bide; KurdAi jê vîdyoyeke kurt çêdike, bi dengê Kurdî.', ckb: 'وێنەیەک و چەند وشەیەک بدە؛ KurdAi ڤیدیۆیەکی کورتی لێ دروست دەکات، بە دەنگی کوردی.', tr: 'Bir görsel ve birkaç kelime ver; KurdAi ondan Kürtçe sesli kısa bir video üretsin.', en: 'Give an image and a few words; KurdAi makes a short video from it, with a Kurdish voice.', fa: 'یک تصویر و چند کلمه بده؛ KurdAi از آن ویدیویی کوتاه با صدای کردی می‌سازد.', ar: 'قدّم صورة وبضع كلمات؛ يصنع منها KurdAi فيديو قصيرًا بصوت كردي.' },
    kaiVidBtn:  { kmr: 'Wêne bar bike', ckb: 'وێنە باربکە', tr: 'Görsel yükle', en: 'Upload an image', fa: 'بارگذاری تصویر', ar: 'ارفع صورة' },
    kaiApi:     { kmr: 'Mifteya API ji bo platforma xwe', ckb: 'کلیلی API بۆ پلاتفۆرمەکەت', tr: 'Platformun için API anahtarı', en: 'An API key for your platform', fa: 'کلید API برای پلتفرمت', ar: 'مفتاح API لمنصّتك' },
    kaiApiText: { kmr: 'Mifteya API şîfreyeke taybet e ku dihêle malper an sepana te bixwe bi KurdAi re biaxive: nûçeyên xwe bi deng bike, bersivan bi Kurdî bide. Wekî Enstîtuya Teknolojiyê ya Kurdistana Dîjîtal, em ê di demeke nêzîk de platformên dîjîtal bi KurdAi piştgirî bikin.',
                  ckb: 'کلیلی API وشەی نهێنییەکی تایبەتە کە ڕێگە دەدات ماڵپەڕ یان ئەپەکەت خۆی لەگەڵ KurdAi قسە بکات: هەواڵەکانت بە دەنگ بکات، بە کوردی وەڵام بداتەوە. وەک پەیمانگای تەکنەلۆژیای کوردستانی دیجیتاڵ، لە داهاتوویەکی نزیکدا پاڵپشتی پلاتفۆرمە دیجیتاڵەکان دەکەین بە KurdAi.',
                  tr: 'API anahtarı, web sitenin ya da uygulamanın KurdAi ile kendiliğinden konuşmasını sağlayan özel bir şifredir: haberlerini seslendirir, Kürtçe yanıt verir. Dijital Kurdistan Teknoloji Enstitüsü olarak yakın gelecekte dijital platformları KurdAi ile destekleyeceğiz.',
                  en: 'An API key is a private code that lets your website or app talk to KurdAi on its own: voice your news, answer in Kurdish. As the Digital Kurdistan Tech Institute, we will support digital platforms with KurdAi in the near future.',
                  fa: 'کلید API رمزی خصوصی است که به وب‌سایت یا برنامه‌ات اجازه می‌دهد خودکار با KurdAi گفت‌وگو کند: اخبارت را با صدا کند، به کردی پاسخ دهد. به‌عنوان مؤسسه فناوری کردستان دیجیتال، در آینده‌ای نزدیک پلتفرم‌های دیجیتال را با KurdAi پشتیبانی خواهیم کرد.',
                  ar: 'مفتاح API رمز خاص يتيح لموقعك أو تطبيقك أن يتواصل مع KurdAi تلقائيًا: يحوّل أخبارك إلى صوت ويجيب بالكردية. بصفتنا معهد التقنية في كردستان الرقمية، سندعم المنصّات الرقمية بـ KurdAi في المستقبل القريب.' },
    kaiApiBtn:  { kmr: 'Mifteyê çêke', ckb: 'کلیل دروست بکە', tr: 'Anahtar oluştur', en: 'Create a key', fa: 'ساخت کلید', ar: 'أنشئ مفتاحًا' },
    kaiWait:    { kmr: 'Ev amûr dema perwerdeya KurdAi temam bibe dê çalak bibe. Tu dikarî bi bexşa dengê xwe vê zûtir bikî.', ckb: 'ئەم ئامرازە کاتێک ڕاهێنانی KurdAi تەواو بێت چالاک دەبێت. دەتوانیت بە بەخشینی دەنگت خێراتری بکەیت.', tr: 'Bu araç KurdAi’nin eğitimi tamamlandığında etkinleşecek. Sesini bağışlayarak bunu hızlandırabilirsin.', en: 'This tool turns on when KurdAi’s training is complete. You can speed that up by donating your voice.', fa: 'این ابزار وقتی آموزش KurdAi کامل شود فعال می‌شود. می‌توانی با اهدای صدایت آن را جلو بیندازی.', ar: 'تُفعَّل هذه الأداة عند اكتمال تدريب KurdAi. يمكنك تسريع ذلك بالتبرع بصوتك.' },
    close:      { kmr: 'Bigire', ckb: 'داخستن', tr: 'Kapat', en: 'Close', fa: 'بستن', ar: 'إغلاق' },
    footer:     { kmr: 'Projeyeke ne-bazirganî ya Dîjîtal Kurdistanê. Deng: MMS (Meta, CC BY-NC 4.0).', ckb: 'پڕۆژەیەکی ناقازانجی کوردستانی دیجیتاڵ. دەنگ: MMS (Meta، CC BY-NC 4.0).', tr: 'Dijital Kurdistan’ın kâr amacı gütmeyen projesi. Ses: MMS (Meta, CC BY-NC 4.0).', en: 'A non-profit project of Digital Kurdistan. Voice: MMS (Meta, CC BY-NC 4.0).', fa: 'پروژه‌ای غیرانتفاعی از کردستان دیجیتال. صدا: MMS (Meta، CC BY-NC 4.0).', ar: 'مشروع غير ربحي من كردستان الرقمية. الصوت: MMS (Meta، CC BY-NC 4.0).' },
    // ── navigation and footer (2026-10) ──
    navDev:     { kmr: 'API', ckb: 'API', tr: 'API', en: 'API', fa: 'API', ar: 'API' },
    navDevLong: { kmr: 'Ji bo pêşdebiran', ckb: 'بۆ گەشەپێدەران', tr: 'Geliştiriciler için', en: 'For developers', fa: 'برای توسعه‌دهندگان', ar: 'للمطوّرين' },
    navAbout:   { kmr: 'Derbarê me de', ckb: 'دەربارەی ئێمە', tr: 'Hakkımızda', en: 'About', fa: 'درباره ما', ar: 'من نحن' },
    navFaq:     { kmr: 'Pirsên pir tên kirin', ckb: 'پرسیارە باوەکان', tr: 'Sık sorulanlar', en: 'FAQ', fa: 'پرسش‌های رایج', ar: 'الأسئلة الشائعة' },
    footBlurb:  { kmr: 'Teknolojiya axaftina Kurdî, ji aliyê neteweya Kurd ve, ji bo neteweya Kurd.', ckb: 'تەکنەلۆژیای ئاخاوتنی کوردی، لەلایەن نەتەوەی کوردەوە، بۆ نەتەوەی کورد.', tr: 'Kürtçe konuşma teknolojisi; Kurd ulusu tarafından, Kurd ulusu için.', en: 'Kurdish speech technology, made by the Kurdish nation, for the Kurdish nation.', fa: 'فناوری گفتار کردی، ساختهٔ ملت کرد، برای ملت کرد.', ar: 'تقنية النطق الكردي، تصنعها الأمة الكردية من أجل الأمة الكردية.' },
    footProduct:{ kmr: 'Berhem', ckb: 'بەرهەم', tr: 'Ürün', en: 'Product', fa: 'محصول', ar: 'المنتج' },
    footRes:    { kmr: 'Çavkanî', ckb: 'سەرچاوەکان', tr: 'Kaynaklar', en: 'Resources', fa: 'منابع', ar: 'الموارد' },
    footSource: { kmr: 'Koda çavkaniyê', ckb: 'کۆدی سەرچاوە', tr: 'Kaynak kod', en: 'Source code', fa: 'کد منبع', ar: 'الشيفرة المصدرية' },
    footLegal:  { kmr: 'Hiqûqî', ckb: 'یاسایی', tr: 'Yasal', en: 'Legal', fa: 'حقوقی', ar: 'قانوني' },
    // ── home: what you can do ──
    featEyebrow:{ kmr: 'Tu dikarî çi bikî', ckb: 'دەتوانیت چی بکەیت', tr: 'Neler yapabilirsin', en: 'What you can do', fa: 'چه کارهایی می‌توانی بکنی', ar: 'ماذا يمكنك أن تفعل' },
    featTitle:  { kmr: 'Kurdî, bi deng û bi rastî', ckb: 'کوردی، بە دەنگ و بە ڕاستی', tr: 'Kürtçe, sesli ve gerçek', en: 'Kurdish, spoken — for real', fa: 'کردی، با صدا و واقعی', ar: 'الكردية، منطوقةً وحقيقية' },
    featLead:   { kmr: 'Tiştên ku îro dixebitin — ne sozên vala. Her taybetmendî li vir dikare were ceribandin.', ckb: 'ئەوەی ئەمڕۆ کار دەکات — نەک بەڵێنی بەتاڵ. هەر تایبەتمەندییەک لێرە تاقی دەکرێتەوە.', tr: 'Bugün gerçekten çalışanlar — boş vaatler değil. Her özelliği burada deneyebilirsin.', en: 'What works today — not empty promises. Every feature here can be tried.', fa: 'آنچه امروز کار می‌کند — نه وعدهٔ توخالی. هر قابلیتی را اینجا می‌توان آزمود.', ar: 'ما يعمل اليوم — لا وعود فارغة. يمكنك تجربة كل ميزة هنا.' },
    f1T:        { kmr: 'Nivîsê bi deng bixwîne', ckb: 'دەق بە دەنگ بخوێنەرەوە', tr: 'Metni sesli okut', en: 'Read text aloud', fa: 'متن را با صدا بخوان', ar: 'اقرأ النص بصوت' },
    f1D:        { kmr: 'Kurmancî bi tîpên latînî, Soranî bi tîpên erebî. Hejmar û kurtenivîs bi peyvan tên xwendin.', ckb: 'کورمانجی بە پیتی لاتینی، سۆرانی بە پیتی عەرەبی. ژمارە و کورتکراوەکان بە وشە دەخوێنرێنەوە.', tr: 'Latin harfli Kurmancî, Arap harfli Soranî. Sayılar ve kısaltmalar kelimeyle okunur.', en: 'Kurmancî in Latin script, Soranî in Arabic script. Numbers and abbreviations are read as words.', fa: 'کرمانجی با خط لاتین، سورانی با خط عربی. اعداد و اختصارها به صورت کلمه خوانده می‌شوند.', ar: 'الكرمانجية بالحرف اللاتيني والسورانية بالحرف العربي. تُقرأ الأرقام والاختصارات كلماتٍ.' },
    f1Tag:      { kmr: '2 zarava', ckb: '٢ زاراوە', tr: '2 lehçe', en: '2 dialects', fa: '۲ گویش', ar: 'لهجتان' },
    f2T:        { kmr: 'Dengê xwe bexşîne', ckb: 'دەنگت ببەخشە', tr: 'Sesini bağışla', en: 'Donate your voice', fa: 'صدایت را اهدا کن', ar: 'تبرّع بصوتك' },
    f2D:        { kmr: 'Hevokên kurt bixwîne; dengê Kurdî yê pêşerojê bi dengê te tê perwerdekirin.', ckb: 'ڕستەی کورت بخوێنەوە؛ دەنگی کوردیی داهاتوو بە دەنگی تۆ ڕادەهێنرێت.', tr: 'Kısa cümleler oku; geleceğin Kürtçe sesi senin sesinle eğitilir.', en: 'Read short sentences; the Kurdish voice of the future is trained on yours.', fa: 'جمله‌های کوتاه بخوان؛ صدای کردی آینده با صدای تو آموزش می‌بیند.', ar: 'اقرأ جملًا قصيرة؛ يُدرَّب الصوت الكردي القادم على صوتك.' },
    f2Tag:      { kmr: '18+', ckb: '18+', tr: '18+', en: '18+', fa: '18+', ar: '18+' },
    f3T:        { kmr: 'API ji bo pêşdebiran', ckb: 'API بۆ گەشەپێدەران', tr: 'Geliştiriciler için API', en: 'Developer API', fa: 'API برای توسعه‌دهندگان', ar: 'واجهة برمجية للمطوّرين' },
    f3D:        { kmr: 'Bila malper û sepana te bi Kurdî biaxive. dks.news gotarên xwe bi vê API-yê dixwîne.', ckb: 'با ماڵپەڕ و ئەپەکەت بە کوردی بدوێت. dks.news وتارەکانی بەم API‌یە دەخوێنێتەوە.', tr: 'Siten ve uygulaman Kürtçe konuşsun. dks.news makalelerini bu API ile seslendiriyor.', en: 'Make your site or app speak Kurdish. dks.news voices its articles with this API.', fa: 'بگذار سایت و برنامه‌ات کردی حرف بزند. dks.news مقاله‌هایش را با همین API می‌خواند.', ar: 'اجعل موقعك أو تطبيقك يتكلم الكردية. يقرأ dks.news مقالاته بهذه الواجهة.' },
    f4T:        { kmr: 'Bi zimanê te', ckb: 'بە زمانی تۆ', tr: 'Senin dilinde', en: 'In your language', fa: 'به زبان تو', ar: 'بلغتك' },
    f4D:        { kmr: 'Rûpel bi Kurmancî, Soranî, Tirkî, Îngilîzî, Farisî û Erebî ye.', ckb: 'ماڵپەڕەکە بە کورمانجی، سۆرانی، تورکی، ئینگلیزی، فارسی و عەرەبییە.', tr: 'Arayüz Kurmancî, Soranî, Türkçe, İngilizce, Farsça ve Arapça.', en: 'The interface speaks Kurmancî, Soranî, Turkish, English, Persian and Arabic.', fa: 'رابط کاربری به کرمانجی، سورانی، ترکی، انگلیسی، فارسی و عربی است.', ar: 'الواجهة بالكرمانجية والسورانية والتركية والإنجليزية والفارسية والعربية.' },
    f5T:        { kmr: 'Çavkaniya vekirî', ckb: 'سەرچاوەی کراوە', tr: 'Açık kaynak', en: 'Open source', fa: 'متن‌باز', ar: 'مفتوح المصدر' },
    f5D:        { kmr: 'Koda vê malperê li ber çavan e: her kes dikare kontrol bike ka em çi dikin.', ckb: 'کۆدی ئەم ماڵپەڕە ئاشکرایە: هەرکەس دەتوانێت بپشکنێت چی دەکەین.', tr: 'Bu sitenin kodu açık: ne yaptığımızı herkes denetleyebilir.', en: 'The code behind this site is public: anyone can check what we do.', fa: 'کد این سایت عمومی است: هر کس می‌تواند بررسی کند ما چه می‌کنیم.', ar: 'شيفرة هذا الموقع علنية: يمكن لأي أحد أن يتحقق مما نفعل.' },
    f6T:        { kmr: 'Bê şopandin', ckb: 'بێ شوێنکەوتن', tr: 'Takip yok', en: 'No tracking', fa: 'بدون ردیابی', ar: 'بلا تتبّع' },
    f6D:        { kmr: 'Ne reklam, ne analîtîk, ne çerezên şopandinê. Nivîsa te nayê tomarkirin.', ckb: 'نە ڕیکلام، نە شیکاری، نە کوکیی شوێنکەوتن. دەقەکەت پاشەکەوت ناکرێت.', tr: 'Reklam, analitik ya da izleme çerezi yok. Yazdığın metin saklanmaz.', en: 'No ads, no analytics, no tracking cookies. The text you type is not stored.', fa: 'نه تبلیغ، نه آنالیتیکس، نه کوکی ردیابی. متنی که می‌نویسی ذخیره نمی‌شود.', ar: 'لا إعلانات ولا تحليلات ولا ملفات تتبّع. لا يُحفظ النص الذي تكتبه.' },
    f6Tag:      { kmr: 'Nepenî', ckb: 'تایبەتمەندی', tr: 'Gizlilik', en: 'Privacy', fa: 'حریم خصوصی', ar: 'الخصوصية' },
    // ── home: who it is for ──
    whoEyebrow: { kmr: 'Ji bo kê ye', ckb: 'بۆ کێیە', tr: 'Kimin için', en: 'Who it is for', fa: 'برای چه کسانی', ar: 'لمن هو' },
    whoTitle:   { kmr: 'Her kesê ku Kurdî dixwîne, dinivîse an fêr dibe', ckb: 'هەرکەسێک کە کوردی دەخوێنێتەوە، دەنووسێت یان فێر دەبێت', tr: 'Kürtçe okuyan, yazan ya da öğrenen herkes', en: 'Everyone who reads, writes or learns Kurdish', fa: 'هر کسی که کردی می‌خواند، می‌نویسد یا یاد می‌گیرد', ar: 'كل من يقرأ الكردية أو يكتبها أو يتعلّمها' },
    u1T:        { kmr: 'Perwerde', ckb: 'پەروەردە', tr: 'Eğitim', en: 'Education', fa: 'آموزش', ar: 'التعليم' },
    u1D:        { kmr: 'Mamosteyek dersa xwendinê dike deng, da ku xwendekar li malê dîsa guhdarî bikin û bilêvkirinê fêr bibin.', ckb: 'مامۆستایەک وانەی خوێندنەوە دەکاتە دەنگ، تا قوتابیان لە ماڵەوە دووبارە گوێی لێ بگرن و گۆکردن فێر بن.', tr: 'Bir öğretmen okuma dersini sese çevirir; öğrenciler evde tekrar dinler, telaffuzu öğrenir.', en: 'A teacher turns a reading lesson into audio, so students can replay it at home and learn how the words sound.', fa: 'معلمی درس خواندن را به صدا تبدیل می‌کند تا دانش‌آموزان در خانه دوباره بشنوند و تلفظ را یاد بگیرند.', ar: 'يحوّل المعلّم درس القراءة إلى صوت، فيعيد الطلاب الاستماع في البيت ويتعلّمون النطق.' },
    u2T:        { kmr: 'Rojnamegerî', ckb: 'ڕۆژنامەگەری', tr: 'Gazetecilik', en: 'Journalism', fa: 'روزنامه‌نگاری', ar: 'الصحافة' },
    u2D:        { kmr: 'Nûçe ji bo kesên ku guhdarî dikin — wekî ku dks.news îro dike.', ckb: 'هەواڵ بۆ ئەوانەی گوێ دەگرن — وەک ئەوەی dks.news ئەمڕۆ دەیکات.', tr: 'Dinlemeyi seçenler için haber — dks.news’in bugün yaptığı gibi.', en: 'News for those who listen — as dks.news does today.', fa: 'خبر برای کسانی که گوش می‌دهند — همان کاری که dks.news امروز می‌کند.', ar: 'أخبار لمن يفضّل الاستماع — كما يفعل dks.news اليوم.' },
    u3T:        { kmr: 'Pêşdebir', ckb: 'گەشەپێدەران', tr: 'Geliştiriciler', en: 'Developers', fa: 'توسعه‌دهندگان', ar: 'المطوّرون' },
    u3D:        { kmr: 'Bi çend rêzên kodê, sepan an malpera xwe bi Kurdî biaxivîne.', ckb: 'بە چەند دێڕێک کۆد، ئەپ یان ماڵپەڕەکەت بە کوردی بدوێنە.', tr: 'Birkaç satır kodla uygulamanı ya da siteni Kürtçe konuştur.', en: 'A few lines of code make your app or site speak Kurdish.', fa: 'با چند خط کد، برنامه یا سایتت را به کردی به سخن درآور.', ar: 'ببضعة أسطر من الشيفرة يتكلم تطبيقك أو موقعك الكردية.' },
    u4T:        { kmr: 'Gihîştin', ckb: 'دەستڕاگەیشتن', tr: 'Erişilebilirlik', en: 'Accessibility', fa: 'دسترس‌پذیری', ar: 'إمكانية الوصول' },
    u4D:        { kmr: 'Ji bo kesên ku nikarin bixwînin an guhdarîkirinê tercîh dikin, Kurdî jî dibe deng.', ckb: 'بۆ ئەوانەی ناتوانن بخوێننەوە یان گوێگرتن هەڵدەبژێرن، کوردیش دەبێتە دەنگ.', tr: 'Okuyamayan ya da dinlemeyi tercih edenler için Kürtçe de sese dönüşür.', en: 'For people who cannot read the screen or would rather listen, Kurdish becomes sound too.', fa: 'برای کسانی که نمی‌توانند بخوانند یا شنیدن را ترجیح می‌دهند، کردی هم صدا می‌شود.', ar: 'لمن لا يستطيع القراءة أو يفضّل الاستماع، تصير الكردية صوتًا أيضًا.' },
    // ── home: numbers ──
    numEyebrow: { kmr: 'Bi hejmaran — zindî', ckb: 'بە ژمارە — ڕاستەوخۆ', tr: 'Rakamlarla — canlı', en: 'By the numbers — live', fa: 'به عدد — زنده', ar: 'بالأرقام — مباشرة' },
    numTitle:   { kmr: 'Dengê Kurdî, saet bi saet tê avakirin', ckb: 'دەنگی کوردی، کاتژمێر بە کاتژمێر بنیات دەنرێت', tr: 'Kürtçe ses, saat saat inşa ediliyor', en: 'A Kurdish voice, built hour by hour', fa: 'صدای کردی، ساعت به ساعت ساخته می‌شود', ar: 'صوت كردي يُبنى ساعةً بعد ساعة' },
    numHours:   { kmr: 'deqîqe deng hatin bexşîn', ckb: 'خولەک دەنگ بەخشراوە', tr: 'dakika ses bağışlandı', en: 'minutes of voice donated', fa: 'دقیقه صدا اهدا شده', ar: 'دقيقة من الصوت المتبرَّع به' },
    numValid:   { kmr: 'deqîqe hatin pejirandin', ckb: 'خولەک پەسەندکراوە', tr: 'dakika doğrulandı', en: 'minutes checked and valid', fa: 'دقیقه بررسی و تأیید شده', ar: 'دقيقة تم التحقق منها' },
    numDonors:  { kmr: 'bexşkar', ckb: 'بەخشەر', tr: 'bağışçı', en: 'donors', fa: 'اهداکننده', ar: 'متبرّعًا' },
    numSentences:{ kmr: 'hevok amade ne ji bo xwendinê', ckb: 'ڕستە ئامادەن بۆ خوێندنەوە', tr: 'cümle okunmayı bekliyor', en: 'sentences ready to be read', fa: 'جمله آمادهٔ خواندن', ar: 'جملة جاهزة للقراءة' },
    numNote:    { kmr: 'Ji databasa bexşê, di her serdanê de tê hesibandin. Ne texmîn e.', ckb: 'لە داتابەیسی بەخشین، لە هەر سەردانێکدا دەژمێردرێت. خەمڵاندن نییە.', tr: 'Bağış veritabanından, her ziyarette sayılır. Tahmin değil.', en: 'Counted from the donation database on every visit. Not an estimate.', fa: 'در هر بازدید از پایگاه دادهٔ اهدا شمرده می‌شود. تخمین نیست.', ar: 'تُحسب من قاعدة بيانات التبرّع في كل زيارة. ليست تقديرًا.' },
    howEyebrow: { kmr: 'Çawa dixebite', ckb: 'چۆن کار دەکات', tr: 'Nasıl çalışır', en: 'How it works', fa: 'چگونه کار می‌کند', ar: 'كيف يعمل' },
    // ── home: mission and closing ──
    misEyebrow: { kmr: 'Armanca me', ckb: 'ئامانجمان', tr: 'Amacımız', en: 'Our mission', fa: 'مأموریت ما', ar: 'رسالتنا' },
    misText:    { kmr: 'Zimanek ku di teknolojiyê de bê deng bimîne, di jiyana rojane de jî bêdeng dibe. Em dixwazin Kurdî bi dengê xwe bijî — bi dengê neteweya xwe.', ckb: 'زمانێک کە لە تەکنەلۆژیادا بێدەنگ بمێنێتەوە، لە ژیانی ڕۆژانەشدا بێدەنگ دەبێت. دەمانەوێت کوردی بە دەنگی خۆی بژی — بە دەنگی نەتەوەکەی.', tr: 'Teknolojide sessiz kalan bir dil, gündelik hayatta da sessizleşir. Kürtçenin kendi sesiyle — kendi ulusunun sesiyle — yaşamasını istiyoruz.', en: 'A language that stays silent in technology grows silent in daily life. We want Kurdish to live in its own voice — the voice of its own nation.', fa: 'زبانی که در فناوری خاموش بماند، در زندگی روزمره هم خاموش می‌شود. می‌خواهیم کردی با صدای خودش زنده بماند — با صدای ملت خودش.', ar: 'اللغة التي تبقى صامتة في التقنية تصمت في الحياة اليومية أيضًا. نريد للكردية أن تحيا بصوتها — بصوت أمّتها.' },
    misBy:      { kmr: 'Dîjîtal Kurdistan · KurdAi', ckb: 'کوردستانی دیجیتاڵ · KurdAi', tr: 'Dijital Kurdistan · KurdAi', en: 'Digital Kurdistan · KurdAi', fa: 'کردستان دیجیتال · KurdAi', ar: 'كردستان الرقمية · KurdAi' },
    ctaTitle:   { kmr: 'Kurdî bi gotinên xwe bibihîze.', ckb: 'کوردی بە وشەکانی خۆت ببیستە.', tr: 'Kürtçeyi kendi sözlerinle dinle.', en: 'Hear Kurdish in your own words.', fa: 'کردی را با کلمات خودت بشنو.', ar: 'اسمع الكردية بكلماتك أنت.' },
    ctaText:    { kmr: 'Belaş e. Ne hesab, ne qeyd.', ckb: 'بێبەرامبەرە. نە هەژمار، نە تۆمارکردن.', tr: 'Ücretsiz. Hesap da kayıt da gerekmez.', en: 'Free. No account, no sign-up.', fa: 'رایگان. بدون حساب و ثبت‌نام.', ar: 'مجاني. بلا حساب ولا تسجيل.' },
    ctaTry:     { kmr: 'Niha biceribîne', ckb: 'ئێستا تاقی بکەرەوە', tr: 'Şimdi dene', en: 'Try it now', fa: 'همین حالا امتحان کن', ar: 'جرّبه الآن' },
    // ── developers ──
    devEyebrow: { kmr: 'Ji bo pêşdebiran', ckb: 'بۆ گەشەپێدەران', tr: 'Geliştiriciler için', en: 'For developers', fa: 'برای توسعه‌دهندگان', ar: 'للمطوّرين' },
    devTitle:   { kmr: 'API-ya axaftina Kurdî', ckb: 'API ـی ئاخاوتنی کوردی', tr: 'Kürtçe konuşma API’si', en: 'The Kurdish speech API', fa: 'API گفتار کردی', ar: 'واجهة النطق الكردي البرمجية' },
    devLead:    { kmr: 'Nivîsa Kurmancî an Soranî bişîne, MP3 werbigire. Nivîsa kurt bê mifte; nivîsa dirêj wekî kar di rêzê de, bi mifteya API.', ckb: 'دەقی کورمانجی یان سۆرانی بنێرە، MP3 وەربگرە. دەقی کورت بێ کلیل؛ دەقی درێژ وەک کارێک لە ڕیز، بە کلیلی API.', tr: 'Kurmancî ya da Soranî metin gönder, MP3 al. Kısa metin anahtarsız; uzun metin kuyruğa alınan iş olarak, API anahtarıyla.', en: 'Send Kurmancî or Soranî text, get MP3 back. Short text needs no key; long text runs as a queued job with an API key.', fa: 'متن کرمانجی یا سورانی بفرست و MP3 بگیر. متن کوتاه بدون کلید؛ متن بلند به‌صورت کار صف‌شده با کلید API.', ar: 'أرسل نصًا بالكرمانجية أو السورانية واستلم MP3. النص القصير بلا مفتاح؛ والطويل مهمةٌ في طابور بمفتاح API.' },
    devQuickT:  { kmr: 'Destpêka bilez', ckb: 'دەستپێکی خێرا', tr: 'Hızlı başlangıç', en: 'Quick start', fa: 'شروع سریع', ar: 'بداية سريعة' },
    devQuickD:  { kmr: 'Heta 600 tîpan, bê mifte. Bersiv rasterast pelê MP3 ye.', ckb: 'تا ٦٠٠ پیت، بێ کلیل. وەڵامەکە ڕاستەوخۆ فایلی MP3 ـە.', tr: '600 karaktere kadar, anahtarsız. Yanıt doğrudan MP3 dosyasıdır.', en: 'Up to 600 characters, no key. The response is the MP3 itself.', fa: 'تا ۶۰۰ نویسه، بدون کلید. پاسخ خودِ فایل MP3 است.', ar: 'حتى 600 حرف، بلا مفتاح. الردّ هو ملف MP3 نفسه.' },
    devJobsT:   { kmr: 'Nivîsa dirêj: kar', ckb: 'دەقی درێژ: کار', tr: 'Uzun metin: işler', en: 'Long text: jobs', fa: 'متن بلند: کارها', ar: 'النص الطويل: المهام' },
    devJobsD:   { kmr: 'Gotarek tevahî (heta 60 000 tîpan) wekî kar bişîne, rewşê bipirse, dema ku “done” be MP3-yê bîne. Kar piştî ji nû ve destpêkirina serverê jî namînin.', ckb: 'وتارێکی تەواو (تا ٦٠٬٠٠٠ پیت) وەک کار بنێرە، دۆخەکە بپرسە، کاتێک «done» بوو MP3 وەربگرە. کارەکان دوای دەستپێکردنەوەی سێرڤەریش دەمێننەوە.', tr: 'Bütün bir makaleyi (60.000 karaktere kadar) iş olarak gönder, durumu sorgula, “done” olunca MP3’ü indir. İşler sunucu yeniden başlasa da kaybolmaz.', en: 'Send a whole article (up to 60,000 characters) as a job, poll its status, and fetch the MP3 when it is “done”. Jobs survive a server restart.', fa: 'یک مقالهٔ کامل (تا ۶۰٬۰۰۰ نویسه) را به‌صورت کار بفرست، وضعیت را بپرس و وقتی «done» شد MP3 را بگیر. کارها پس از راه‌اندازی دوبارهٔ سرور هم می‌مانند.', ar: 'أرسل مقالًا كاملًا (حتى 60,000 حرف) كمهمّة، واستعلم عن حالتها، وحمّل MP3 حين تصبح «done». تبقى المهام حتى بعد إعادة تشغيل الخادم.' },
    devRefT:    { kmr: 'Referans', ckb: 'سەرچاوە', tr: 'Başvuru', en: 'Reference', fa: 'مرجع', ar: 'المرجع' },
    devLimitsT: { kmr: 'Sînor û şaşî', ckb: 'سنوور و هەڵەکان', tr: 'Sınırlar ve hatalar', en: 'Limits and errors', fa: 'محدودیت‌ها و خطاها', ar: 'الحدود والأخطاء' },
    devLim1:    { kmr: 'tîp herî zêde, bê mifte', ckb: 'زۆرترین پیت، بێ کلیل', tr: 'karakter sınırı, anahtarsız', en: 'characters at most, without a key', fa: 'حداکثر نویسه، بدون کلید', ar: 'حرفًا كحدّ أقصى، بلا مفتاح' },
    devLim2:    { kmr: 'daxwaz ji her navnîşana IP', ckb: 'داواکاری بۆ هەر ناونیشانی IP', tr: 'istek, IP adresi başına', en: 'requests per IP address, without a key', fa: 'درخواست برای هر نشانی IP', ar: 'طلبات لكل عنوان IP' },
    devLim3:    { kmr: 'tîp herî zêde ji bo karekî', ckb: 'زۆرترین پیت بۆ هەر کارێک', tr: 'karakter, iş başına', en: 'characters per job, with a key', fa: 'حداکثر نویسه برای هر کار', ar: 'حرفًا لكل مهمّة' },
    devLim4:    { kmr: 'derketin; deng 7 rojan tê girtin', ckb: 'دەرچوون؛ دەنگ ٧ ڕۆژ هەڵدەگیرێت', tr: 'çıktı; ses 7 gün önbellekte', en: 'output; audio is cached for 7 days', fa: 'خروجی؛ صدا ۷ روز در حافظه می‌ماند', ar: 'المخرَج؛ يُخزَّن الصوت 7 أيام' },
    devErrors:  { kmr: 'Şaşî wekî JSON bi zeviya “detail” tên vegerandin:', ckb: 'هەڵەکان وەک JSON لەگەڵ خانەی «detail» دەگەڕێنەوە:', tr: 'Hatalar “detail” alanlı JSON olarak döner:', en: 'Errors come back as JSON with a “detail” field:', fa: 'خطاها به‌صورت JSON با فیلد «detail» برمی‌گردند:', ar: 'تعود الأخطاء بصيغة JSON مع حقل «detail»:' },
    devKeyT:    { kmr: 'Mifteya API bistîne', ckb: 'کلیلی API وەربگرە', tr: 'API anahtarı al', en: 'Get an API key', fa: 'کلید API بگیر', ar: 'احصل على مفتاح API' },
    devKeyD:    { kmr: 'Mifte ji bo karên ne-bazirganî tên dayîn. Ji me re binivîse: kî yî, projeya te çi ye û bi texmînî çiqas nivîs. Mifte tenê carekê tê nîşandan; em tenê hash-a wê digirin.', ckb: 'کلیلەکان بۆ بەکارهێنانی ناقازانجی دەدرێن. بۆمان بنووسە: کێیت، پڕۆژەکەت چییە و نزیکەی چەند دەق. کلیلەکە تەنها جارێک پیشان دەدرێت؛ تەنها hash ـەکەی هەڵدەگرین.', tr: 'Anahtarlar ticari olmayan kullanım için verilir. Bize yaz: kimsin, projen ne ve yaklaşık ne kadar metin. Anahtar yalnızca bir kez gösterilir; biz sadece özetini (hash) saklarız.', en: 'Keys are issued for non-commercial use. Write to us: who you are, what your project is, and roughly how much text. The key is shown once; we keep only its hash.', fa: 'کلیدها برای استفادهٔ غیرتجاری داده می‌شوند. برایمان بنویس: کیستی، پروژه‌ات چیست و تقریباً چه مقدار متن. کلید فقط یک بار نمایش داده می‌شود؛ ما فقط هش آن را نگه می‌داریم.', ar: 'تُمنح المفاتيح للاستخدام غير التجاري. اكتب لنا: من أنت، وما مشروعك، وكم من النص تقريبًا. يُعرض المفتاح مرة واحدة؛ ولا نحتفظ إلا ببصمته (hash).' },
    devKeyBtn:  { kmr: 'Ji bo mifteyê binivîse', ckb: 'بۆ کلیل بنووسە', tr: 'Anahtar için yaz', en: 'Request a key', fa: 'درخواست کلید', ar: 'اطلب مفتاحًا' },
    devLicT:    { kmr: 'Lîsans: ne-bazirganî', ckb: 'مۆڵەت: ناقازانجی', tr: 'Lisans: ticari olmayan', en: 'Licence: non-commercial', fa: 'مجوز: غیرتجاری', ar: 'الترخيص: غير تجاري' },
    devLicD:    { kmr: 'Dengê niha modelên MMS ên Meta ne (CC BY-NC 4.0). Deng tenê ji bo karên ne-bazirganî tê bikaranîn û divê çavkanî were nivîsandin. Dema ku dengê me yê xwe amade bibe, ev beş dê were nûkirin.', ckb: 'دەنگی ئێستا مۆدێلەکانی MMS ـی Meta ـن (CC BY-NC 4.0). دەنگەکە تەنها بۆ کاری ناقازانجی بەکاردێت و دەبێت سەرچاوە بنووسرێت. کاتێک دەنگی خۆمان ئامادە بوو، ئەم بەشە نوێ دەکرێتەوە.', tr: 'Şu anki ses Meta’nın MMS modelleri (CC BY-NC 4.0). Ses yalnızca ticari olmayan amaçlarla kullanılabilir ve kaynak belirtilmelidir. Kendi sesimiz hazır olduğunda bu bölüm güncellenecek.', en: 'The current voice is Meta’s MMS models (CC BY-NC 4.0). Audio may be used for non-commercial purposes only, with credit. When our own voice is ready, this section will change.', fa: 'صدای فعلی مدل‌های MMS متا است (CC BY-NC 4.0). صدا فقط برای مقاصد غیرتجاری و با ذکر منبع قابل استفاده است. وقتی صدای خودمان آماده شود، این بخش تغییر می‌کند.', ar: 'الصوت الحالي هو نماذج MMS من Meta (CC BY-NC 4.0). يُستخدم الصوت لأغراض غير تجارية فقط مع ذكر المصدر. حين يصبح صوتنا جاهزًا سيتغيّر هذا القسم.' },
    // ── about ──
    abTitle:    { kmr: 'Dengek ji bo zimanekî ku nehatiye bêdengkirin', ckb: 'دەنگێک بۆ زمانێک کە بێدەنگ نەکرا', tr: 'Susturulamamış bir dile bir ses', en: 'A voice for a language that was never silenced', fa: 'صدایی برای زبانی که هرگز خاموش نشد', ar: 'صوتٌ للغةٍ لم تُسكَت قط' },
    abLead:     { kmr: 'KurdAi Voice projeyeke ne-bazirganî ya Dîjîtal Kurdistanê ye û malpereke xwişk a dks.news e.', ckb: 'KurdAi Voice پڕۆژەیەکی ناقازانجی کوردستانی دیجیتاڵە و ماڵپەڕێکی خوشکی dks.news ـە.', tr: 'KurdAi Voice, Dijital Kurdistan’ın kâr amacı gütmeyen bir projesi ve dks.news’in kardeş sitesidir.', en: 'KurdAi Voice is a non-profit project of Digital Kurdistan and a sister site of dks.news.', fa: 'KurdAi Voice پروژه‌ای غیرانتفاعی از کردستان دیجیتال و سایت خواهر dks.news است.', ar: 'KurdAi Voice مشروع غير ربحي من كردستان الرقمية، وموقع شقيق لـ dks.news.' },
    abWhyT:     { kmr: 'Çima', ckb: 'بۆچی', tr: 'Neden', en: 'Why', fa: 'چرا', ar: 'لماذا' },
    abWhyD:     { kmr: 'Bi deh milyonan mirov bi Kurdî diaxivin, lê teknolojiya axaftinê ya Kurdî hîn kêm e. Pirtûk, nûçe û sepan ji bo zimanên mezin bi deng in; ji bo Kurdî pir caran ne. Em dixwazin vê valahiyê bigirin.', ckb: 'دەیان ملیۆن کەس بە کوردی قسە دەکەن، بەڵام تەکنەلۆژیای ئاخاوتنی کوردی هێشتا کەمە. کتێب و هەواڵ و ئەپ بۆ زمانە گەورەکان دەنگیان هەیە؛ بۆ کوردی زۆرجار نا. دەمانەوێت ئەم بۆشاییە پڕ بکەینەوە.', tr: 'On milyonlarca insan Kürtçe konuşuyor, ama Kürtçe konuşma teknolojisi hâlâ az. Büyük diller için kitaplar, haberler, uygulamalar sesli; Kürtçe için çoğu zaman değil. Bu boşluğu kapatmak istiyoruz.', en: 'Tens of millions of people speak Kurdish, yet Kurdish speech technology is still scarce. Books, news and apps have a voice in the major languages; in Kurdish they often do not. We want to close that gap.', fa: 'ده‌ها میلیون نفر کردی حرف می‌زنند، اما فناوری گفتار کردی هنوز کمیاب است. کتاب، خبر و برنامه برای زبان‌های بزرگ صدا دارند؛ برای کردی اغلب نه. می‌خواهیم این شکاف را پر کنیم.', ar: 'يتكلّم الكردية عشرات الملايين، ومع ذلك ما تزال تقنية النطق الكردي نادرة. للكتب والأخبار والتطبيقات صوتٌ في اللغات الكبرى؛ وفي الكردية غالبًا لا. نريد أن نسدّ هذه الفجوة.' },
    abNowT:     { kmr: 'Îro', ckb: 'ئەمڕۆ', tr: 'Bugün', en: 'Today', fa: 'امروز', ar: 'اليوم' },
    abNowD:     { kmr: 'Xwendina bi deng bi modelên vekirî yên MMS ên Meta dixebite — çareseriyeke demkî. Gotarên dks.news bi heman API-yê tên xwendin. Bexşa deng vekirî ye ji bo her mezinekî ku bi Kurmancî an Soranî diaxive.', ckb: 'خوێندنەوە بە دەنگ بە مۆدێلە کراوەکانی MMS ـی Meta کار دەکات — چارەسەرێکی کاتی. وتارەکانی dks.news بە هەمان API دەخوێنرێنەوە. بەخشینی دەنگ کراوەیە بۆ هەر گەورەساڵێک کە بە کورمانجی یان سۆرانی قسە دەکات.', tr: 'Sesli okuma şu an Meta’nın açık MMS modelleriyle çalışıyor — geçici bir çözüm. dks.news makaleleri aynı API ile seslendiriliyor. Ses bağışı, Kurmancî ya da Soranî konuşan her yetişkine açık.', en: 'Read-aloud runs on Meta’s open MMS models today — a stop-gap. dks.news articles are voiced through the same API. Voice donation is open to every adult who speaks Kurmancî or Soranî.', fa: 'خواندن با صدا امروز با مدل‌های باز MMS متا کار می‌کند — راه‌حلی موقت. مقاله‌های dks.news با همین API خوانده می‌شوند. اهدای صدا برای هر بزرگسالی که کرمانجی یا سورانی حرف می‌زند باز است.', ar: 'تعمل القراءة بصوت اليوم بنماذج MMS المفتوحة من Meta — حلٌّ مؤقت. تُقرأ مقالات dks.news عبر الواجهة نفسها. والتبرّع بالصوت مفتوح لكل بالغ يتكلّم الكرمانجية أو السورانية.' },
    abNextT:    { kmr: 'Pêşî', ckb: 'داهاتوو', tr: 'Sırada ne var', en: 'Next', fa: 'گام بعدی', ar: 'التالي' },
    abNextD:    { kmr: 'Dema ku têra xwe deng bên bexşîn û pejirandin, em ê modela xwe, KurdAi, perwerde bikin. Wê demê dengê vê malperê dê dengê neteweya Kurd be — û em ê bikaribin wê bêyî sînorê ne-bazirganî pêşkêş bikin.', ckb: 'کاتێک دەنگی پێویست ببەخشرێت و پەسەند بکرێت، مۆدێلی خۆمان، KurdAi، ڕادەهێنین. ئەوکات دەنگی ئەم ماڵپەڕە دەنگی نەتەوەی کورد دەبێت — و دەتوانین بێ سنووری ناقازانجی پێشکەشی بکەین.', tr: 'Yeterince ses bağışlanıp doğrulandığında kendi modelimizi, KurdAi’yi eğiteceğiz. O zaman bu sitenin sesi Kurd ulusunun sesi olacak — ve onu ticari olmayan kullanım sınırı olmadan sunabileceğiz.', en: 'Once enough voices are donated and checked, we will train our own model, KurdAi. Then this site’s voice will be the voice of the Kurdish nation — and we will be able to offer it without the non-commercial limit.', fa: 'وقتی صدای کافی اهدا و بررسی شود، مدل خودمان، KurdAi، را آموزش می‌دهیم. آن‌گاه صدای این سایت صدای ملت کرد خواهد بود — و می‌توانیم آن را بدون محدودیت غیرتجاری ارائه کنیم.', ar: 'حين تُتبرَّع أصوات كافية ويُتحقَّق منها، سندرّب نموذجنا الخاص، KurdAi. عندها يصير صوت هذا الموقع صوتَ الأمة الكردية — وسنستطيع تقديمه دون قيد الاستخدام غير التجاري.' },
    abWhoT:     { kmr: 'Kî me', ckb: 'ئێمە کێین', tr: 'Biz kimiz', en: 'Who we are', fa: 'ما که هستیم', ar: 'من نحن' },
    abWhoD:     { kmr: 'Proje ji aliyê Pez Kiwi Comp (Gurcistan) ve, di nav însiyatîfa Dîjîtal Kurdistan / PezkuwiChain de tê birêvebirin. Kod vekirî ye; daneyên te li gorî siyaseta nepeniyê tên parastin.', ckb: 'پڕۆژەکە لەلایەن Pez Kiwi Comp (جۆرجیا) لە چوارچێوەی دەستپێشخەری کوردستانی دیجیتاڵ / PezkuwiChain بەڕێوە دەبرێت. کۆدەکە کراوەیە؛ داتاکانت بەپێی سیاسەتی تایبەتمەندی دەپارێزرێن.', tr: 'Proje, Dijital Kurdistan / PezkuwiChain girişimi bünyesinde Pez Kiwi Comp (Gürcistan) tarafından işletilir. Kod açıktır; verilerin gizlilik politikasına göre korunur.', en: 'The project is operated by Pez Kiwi Comp (Georgia) within the Digital Kurdistan / PezkuwiChain initiative. The code is open; your data is protected as the privacy policy describes.', fa: 'این پروژه را Pez Kiwi Comp (گرجستان) در چارچوب ابتکار کردستان دیجیتال / PezkuwiChain اداره می‌کند. کد باز است؛ داده‌هایت مطابق سیاست حریم خصوصی محافظت می‌شوند.', ar: 'تُشغّل المشروعَ شركةُ Pez Kiwi Comp (جورجيا) ضمن مبادرة كردستان الرقمية / PezkuwiChain. الشيفرة مفتوحة، وتُحمى بياناتك كما تصف سياسة الخصوصية.' },
    abContactT: { kmr: 'Têkilî', ckb: 'پەیوەندی', tr: 'İletişim', en: 'Contact', fa: 'تماس', ar: 'اتصل بنا' },
    abMailGeneral:{ kmr: 'Giştî, hiqûqî û nepenî', ckb: 'گشتی، یاسایی و تایبەتمەندی', tr: 'Genel, yasal ve gizlilik', en: 'General, legal and privacy', fa: 'عمومی، حقوقی و حریم خصوصی', ar: 'عام وقانوني وخصوصية' },
    abMailSec:  { kmr: 'Ewlehî', ckb: 'ئاسایش', tr: 'Güvenlik', en: 'Security', fa: 'امنیت', ar: 'الأمان' },
    abCode:     { kmr: 'Kod', ckb: 'کۆد', tr: 'Kod', en: 'Code', fa: 'کد', ar: 'الشيفرة' },
    // ── faq ──
    faqTitle:   { kmr: 'Pirsên pir tên kirin', ckb: 'پرسیارە باوەکان', tr: 'Sık sorulan sorular', en: 'Frequently asked questions', fa: 'پرسش‌های رایج', ar: 'الأسئلة الشائعة' },
    faqLead:    { kmr: 'Bersivên kurt û rast. Ya ku li vir tune, ji me bipirse.', ckb: 'وەڵامی کورت و ڕاست. ئەوەی لێرە نییە، لێمان بپرسە.', tr: 'Kısa ve dürüst cevaplar. Burada olmayanı bize sor.', en: 'Short, honest answers. Ask us anything that is not here.', fa: 'پاسخ‌های کوتاه و صادقانه. هرچه اینجا نیست از ما بپرس.', ar: 'إجابات قصيرة وصادقة. اسألنا عمّا ليس هنا.' },
    q1:         { kmr: 'Kîjan zarava tên piştgirîkirin?', ckb: 'کام زاراوانە پشتگیری دەکرێن؟', tr: 'Hangi lehçeler destekleniyor?', en: 'Which dialects are supported?', fa: 'کدام گویش‌ها پشتیبانی می‌شوند؟', ar: 'ما اللهجات المدعومة؟' },
    a1:         { kmr: 'Kurmancî (bi tîpên latînî) û Soranî (bi tîpên erebî). Ji bo Badînî û Zazakî hîn modeleke me tune; em li şûna derewîn tiştekî nîşan bidin, wan nîşan nadin.', ckb: 'کورمانجی (بە پیتی لاتینی) و سۆرانی (بە پیتی عەرەبی). بۆ بادینی و زازاکی هێشتا مۆدێلمان نییە؛ لەبری ئەوەی شتێکی ساختە پیشان بدەین، پیشانیان نادەین.', tr: 'Kurmancî (Latin harfleriyle) ve Soranî (Arap harfleriyle). Badînî ve Zazaca için henüz modelimiz yok; sahte bir seçenek koymak yerine göstermiyoruz.', en: 'Kurmancî (Latin script) and Soranî (Arabic script). We do not have a model for Badînî or Zazakî yet, so rather than offer a fake option we do not show them.', fa: 'کرمانجی (با خط لاتین) و سورانی (با خط عربی). برای بادینی و زازاکی هنوز مدلی نداریم؛ به‌جای گزینهٔ ساختگی، آن‌ها را نشان نمی‌دهیم.', ar: 'الكرمانجية (بالحرف اللاتيني) والسورانية (بالحرف العربي). لا نملك بعدُ نموذجًا للبادينية أو الزازاكية، فبدل خيارٍ زائف لا نعرضهما.' },
    q2:         { kmr: 'Dengê niha yê kê ye?', ckb: 'دەنگی ئێستا هی کێیە؟', tr: 'Şu anki ses kimin?', en: 'Whose voice is it now?', fa: 'صدای فعلی از کیست؟', ar: 'صوتُ مَن هذا الآن؟' },
    a2:         { kmr: 'Modelên vekirî yên MMS ên Meta (Kurmancî) û razhan/mms-tts-ckb (Soranî). Ew çareseriyeke demkî ne, heta ku modela me ya ku bi dengên bexşkirî tê perwerdekirin amade bibe.', ckb: 'مۆدێلە کراوەکانی MMS ـی Meta (کورمانجی) و razhan/mms-tts-ckb (سۆرانی). چارەسەرێکی کاتین، تا مۆدێلەکەمان کە بە دەنگە بەخشراوەکان ڕادەهێنرێت ئامادە دەبێت.', tr: 'Meta’nın açık MMS modelleri (Kurmancî) ve razhan/mms-tts-ckb (Soranî). Bağışlanan seslerle eğitilecek kendi modelimiz hazır olana kadar geçici bir çözüm.', en: 'Meta’s open MMS model (Kurmancî) and razhan/mms-tts-ckb (Soranî). They are a stop-gap until our own model, trained on donated voices, is ready.', fa: 'مدل باز MMS متا (کرمانجی) و razhan/mms-tts-ckb (سورانی). این‌ها راه‌حلی موقت‌اند تا مدل خودمان که با صداهای اهدایی آموزش می‌بیند آماده شود.', ar: 'نموذج MMS المفتوح من Meta (الكرمانجية) وrazhan/mms-tts-ckb (السورانية). حلٌّ مؤقت إلى أن يجهز نموذجنا المدرَّب على الأصوات المتبرَّع بها.' },
    q3:         { kmr: 'Ez dikarim dengê çêkirî bazirganî bikar bînim?', ckb: 'دەتوانم دەنگە دروستکراوەکە بە بازرگانی بەکاربهێنم؟', tr: 'Üretilen sesi ticari olarak kullanabilir miyim?', en: 'Can I use the audio commercially?', fa: 'آیا می‌توانم از صدای تولیدشده تجاری استفاده کنم؟', ar: 'هل يمكنني استخدام الصوت تجاريًا؟' },
    a3:         { kmr: 'Na, hîn na. Lîsansa modelên niha (CC BY-NC 4.0) bazirganiyê qedexe dike. Ji bo perwerde, rojnamegerî û karên kesane azad e — tenê çavkaniyê binivîse. Dema dengê me amade bibe, em ê vê biguherînin.', ckb: 'نا، هێشتا نا. مۆڵەتی مۆدێلەکانی ئێستا (CC BY-NC 4.0) بازرگانی قەدەغە دەکات. بۆ پەروەردە و ڕۆژنامەگەری و کاری کەسی ئازادە — تەنها سەرچاوە بنووسە. کاتێک دەنگی خۆمان ئامادە بوو، ئەمە دەگۆڕین.', tr: 'Hayır, henüz değil. Şu anki modellerin lisansı (CC BY-NC 4.0) ticari kullanımı yasaklıyor. Eğitim, gazetecilik ve kişisel kullanım serbest — yeter ki kaynak belirt. Kendi sesimiz hazır olunca bunu değiştireceğiz.', en: 'No, not yet. The licence of the current models (CC BY-NC 4.0) forbids commercial use. Education, journalism and personal use are fine — just credit the source. When our own voice is ready, this will change.', fa: 'نه، هنوز نه. مجوز مدل‌های فعلی (CC BY-NC 4.0) استفادهٔ تجاری را ممنوع می‌کند. آموزش، روزنامه‌نگاری و استفادهٔ شخصی آزاد است — فقط منبع را ذکر کن. وقتی صدای خودمان آماده شود، این تغییر می‌کند.', ar: 'لا، ليس بعد. ترخيص النماذج الحالية (CC BY-NC 4.0) يمنع الاستخدام التجاري. التعليم والصحافة والاستخدام الشخصي مسموح — مع ذكر المصدر. حين يجهز صوتنا سيتغيّر ذلك.' },
    q4:         { kmr: 'Belaş e?', ckb: 'بێبەرامبەرە؟', tr: 'Ücretsiz mi?', en: 'Is it free?', fa: 'رایگان است؟', ar: 'هل هو مجاني؟' },
    a4:         { kmr: 'Erê. Proje ne-bazirganî ye. Xwendina giştî heta 600 tîpan û 8 daxwazan di deqîqeyê de ye, da ku server ji her kesî re bimîne.', ckb: 'بەڵێ. پڕۆژەکە ناقازانجییە. خوێندنەوەی گشتی تا ٦٠٠ پیت و ٨ داواکاری لە خولەکێکدایە، تا سێرڤەرەکە بۆ هەمووان بمێنێتەوە.', tr: 'Evet. Proje kâr amacı gütmüyor. Herkese açık okuma 600 karakter ve dakikada 8 istekle sınırlı; sunucu herkese yetsin diye.', en: 'Yes. The project is non-profit. Public read-aloud is limited to 600 characters and 8 requests a minute, so the server stays available to everyone.', fa: 'بله. پروژه غیرانتفاعی است. خواندن عمومی به ۶۰۰ نویسه و ۸ درخواست در دقیقه محدود است تا سرور برای همه در دسترس بماند.', ar: 'نعم. المشروع غير ربحي. القراءة العامة محدودة بـ600 حرف و8 طلبات في الدقيقة، كي يبقى الخادم متاحًا للجميع.' },
    q5:         { kmr: 'Nivîsa ku ez dinivîsim tê tomarkirin?', ckb: 'ئەو دەقەی دەینووسم پاشەکەوت دەکرێت؟', tr: 'Yazdığım metin saklanıyor mu?', en: 'Is the text I type stored?', fa: 'آیا متنی که می‌نویسم ذخیره می‌شود؟', ar: 'هل يُحفظ النص الذي أكتبه؟' },
    a5:         { kmr: 'Na. Nivîs di bîrê de tê xebitandin û tê avêtin. Tenê deng heta 7 rojan bi şopa (hash) nivîsê tê girtin, da ku ji nû ve neyê çêkirin.', ckb: 'نا. دەقەکە لە بیرگەدا کاری لەسەر دەکرێت و فڕێ دەدرێت. تەنها دەنگەکە تا ٧ ڕۆژ بە پەنجەمۆری (hash) دەقەکە هەڵدەگیرێت، تا دووبارە دروست نەکرێتەوە.', tr: 'Hayır. Metin bellekte işlenip atılır. Yalnızca ses, yeniden üretilmesin diye metnin parmak iziyle (hash) en fazla 7 gün önbellekte tutulur.', en: 'No. The text is processed in memory and discarded. Only the audio is cached for up to 7 days, under a fingerprint (hash) of the text, so it need not be made again.', fa: 'نه. متن در حافظه پردازش و دور ریخته می‌شود. فقط صدا تا ۷ روز با اثرانگشت (هش) متن نگه داشته می‌شود تا دوباره ساخته نشود.', ar: 'لا. يُعالَج النص في الذاكرة ثم يُتخلّص منه. لا يُخزَّن إلا الصوت حتى 7 أيام ببصمة (hash) النص، كي لا يُعاد توليده.' },
    q6:         { kmr: 'Bexşa deng çawa dixebite?', ckb: 'بەخشینی دەنگ چۆن کار دەکات؟', tr: 'Ses bağışı nasıl işliyor?', en: 'How does voice donation work?', fa: 'اهدای صدا چگونه کار می‌کند؟', ar: 'كيف يعمل التبرّع بالصوت؟' },
    a6:         { kmr: 'Divê tu 18 salî an mezintir bî. Bê cuzdan bi kodekê an bi cuzdanê dest pê bike, razîbûnê bide, hevokên kurt bixwîne. Bexşkarên bi cuzdan tomaran kontrol dikin; du dengên hevgirtî tomarekê derbasdar dikin.', ckb: 'دەبێت تەمەنت ١٨ ساڵ یان زیاتر بێت. بێ جزدان بە کۆدێک یان بە جزدان دەست پێبکە، ڕەزامەندی بدە، ڕستەی کورت بخوێنەوە. بەخشەرانی خاوەن جزدان تۆمارەکان دەپشکنن؛ دوو دەنگی هاوڕا تۆمارێک پەسەند دەکەن.', tr: '18 yaşında ya da daha büyük olmalısın. Cüzdansız bir kodla ya da cüzdanla başla, onay ver, kısa cümleler oku. Cüzdanlı bağışçılar kayıtları kontrol eder; iki uyuşan oy bir kaydı geçerli kılar.', en: 'You must be 18 or older. Start without a wallet, with a code, or with a wallet; give your consent; read short sentences. Donors with a wallet check the recordings; two agreeing votes make a recording valid.', fa: 'باید ۱۸ ساله یا بزرگ‌تر باشی. بدون کیف پول با یک کد یا با کیف پول شروع کن، رضایت بده و جمله‌های کوتاه بخوان. اهداکنندگان دارای کیف پول ضبط‌ها را بررسی می‌کنند؛ دو رأی هم‌نظر یک ضبط را معتبر می‌کند.', ar: 'يجب أن تكون في الثامنة عشرة أو أكبر. ابدأ بلا محفظة برمز، أو بمحفظة؛ وامنح موافقتك، واقرأ جملًا قصيرة. يراجع المتبرّعون ذوو المحافظ التسجيلات؛ وصوتان متوافقان يجعلان التسجيل صالحًا.' },
    q7:         { kmr: 'Cuzdan pêwîst e?', ckb: 'جزدان پێویستە؟', tr: 'Cüzdan şart mı?', en: 'Do I need a wallet?', fa: 'آیا کیف پول لازم است؟', ar: 'هل أحتاج إلى محفظة؟' },
    a7:         { kmr: 'Na. Tu dikarî bi kodekê bexş bikî: ne nav, ne e-name. Kodê hilîne — ew tenê rê ye ku tu vegerî an tomarên xwe jê bibî; em tenê şopa wê digirin, ji ber vê yekê koda windabûyî nayê vegerandin. Ji bo kontrolkirina tomarên kesên din cuzdan pêwîst e, da ku kes nikaribe bi gelek kodan dengan bide.', ckb: 'نا. دەتوانیت بە کۆدێک ببەخشیت: نە ناو، نە ئیمەیڵ. کۆدەکە هەڵبگرە — تاکە ڕێگەیە بۆ گەڕانەوە یان سڕینەوەی تۆمارەکانت؛ تەنها پەنجەمۆرەکەی هەڵدەگرین، بۆیە کۆدی ونبوو ناگەڕێتەوە. بۆ پشکنینی تۆماری کەسانی تر جزدان پێویستە، تا کەس نەتوانێت بە چەندین کۆد دەنگ بدات.', tr: 'Hayır. Bir kodla bağış yapabilirsin: isim de e-posta da gerekmez. Kodu sakla — geri dönmenin ya da kayıtlarını silmenin tek yolu o; biz yalnızca parmak izini tutarız, kaybolan kod geri getirilemez. Başkalarının kayıtlarını kontrol etmek için cüzdan gerekir; böylece kimse çok sayıda kodla oy veremez.', en: 'No. You can donate with a code: no name, no e-mail. Keep the code — it is the only way back in, and the only way to delete your recordings; we keep just its fingerprint, so a lost code cannot be recovered. Checking other people’s recordings needs a wallet, so that nobody can vote with many codes.', fa: 'نه. می‌توانی با یک کد اهدا کنی: بدون نام و ایمیل. کد را نگه دار — تنها راه بازگشت و حذف ضبط‌هایت است؛ ما فقط اثرانگشت آن را نگه می‌داریم، پس کد گم‌شده بازیابی نمی‌شود. بررسی ضبط‌های دیگران کیف پول می‌خواهد تا کسی نتواند با کدهای زیاد رأی بدهد.', ar: 'لا. يمكنك التبرّع برمز: بلا اسم ولا بريد. احفظ الرمز — فهو الطريق الوحيد للعودة ولحذف تسجيلاتك؛ لا نحتفظ إلا ببصمته، فلا يمكن استعادة رمز مفقود. مراجعة تسجيلات الآخرين تتطلّب محفظة، كي لا يصوّت أحد برموز كثيرة.' },
    q8:         { kmr: 'Ez dikarim tomarên xwe jê bibim?', ckb: 'دەتوانم تۆمارەکانم بسڕمەوە؟', tr: 'Kayıtlarımı silebilir miyim?', en: 'Can I delete my recordings?', fa: 'می‌توانم ضبط‌هایم را حذف کنم؟', ar: 'هل يمكنني حذف تسجيلاتي؟' },
    a8:         { kmr: 'Erê, her dem, bi bişkoka “Tomarên min jê bibe”. Modeleke ku berê hatiye perwerdekirin nikare wan “ji bîr bike”; modelên nû êdî wan bikar naynin.', ckb: 'بەڵێ، هەر کاتێک، بە دوگمەی «تۆمارەکانم بسڕەوە». مۆدێلێک کە پێشتر ڕاهێنراوە ناتوانێت «لەبیریان بکات»؛ مۆدێلە نوێکان چیتر بەکاریان ناهێنن.', tr: 'Evet, istediğin zaman “Kayıtlarımı sil” düğmesiyle. Daha önce eğitilmiş bir model onları “unutamaz”; yeni modeller artık kullanmaz.', en: 'Yes, at any time, with the “Delete my recordings” button. A model already trained cannot “unlearn” them; new models will not use them.', fa: 'بله، هر زمان، با دکمهٔ «حذف ضبط‌های من». مدلی که پیش‌تر آموزش دیده نمی‌تواند آن‌ها را «فراموش کند»؛ مدل‌های تازه دیگر از آن‌ها استفاده نمی‌کنند.', ar: 'نعم، في أي وقت، بزر «احذف تسجيلاتي». النموذج المدرَّب سابقًا لا يستطيع «نسيانها»؛ والنماذج الجديدة لن تستخدمها.' },
    q9:         { kmr: 'Ez çawa mifteya API distînim?', ckb: 'چۆن کلیلی API وەردەگرم؟', tr: 'API anahtarını nasıl alırım?', en: 'How do I get an API key?', fa: 'چگونه کلید API بگیرم؟', ar: 'كيف أحصل على مفتاح API؟' },
    a9:         { kmr: 'Ji privacy@dks.news re binivîse (mijar: “API key”) û projeya xwe bi kurtî rave bike. Mifte ji bo karên ne-bazirganî tên dayîn.', ckb: 'بۆ privacy@dks.news بنووسە (بابەت: «API key») و بە کورتی پڕۆژەکەت ڕوون بکەرەوە. کلیل بۆ کاری ناقازانجی دەدرێت.', tr: 'privacy@dks.news adresine “API key” konusuyla yaz ve projeni kısaca anlat. Anahtarlar ticari olmayan kullanım için verilir.', en: 'Write to privacy@dks.news (subject “API key”) and describe your project briefly. Keys are issued for non-commercial use.', fa: 'به privacy@dks.news با موضوع «API key» بنویس و پروژه‌ات را کوتاه توضیح بده. کلیدها برای استفادهٔ غیرتجاری داده می‌شوند.', ar: 'اكتب إلى privacy@dks.news (الموضوع: «API key») وصِف مشروعك باختصار. تُمنح المفاتيح للاستخدام غير التجاري.' },
    faqMoreT:   { kmr: 'Pirsa te li vir nîne?', ckb: 'پرسیارەکەت لێرە نییە؟', tr: 'Sorun burada yok mu?', en: 'Your question is not here?', fa: 'پرسشت اینجا نیست؟', ar: 'سؤالك ليس هنا؟' },
    faqMoreD:   { kmr: 'Ji me re binivîse; em bi Kurdî, Tirkî an Îngilîzî bersiv didin.', ckb: 'بۆمان بنووسە؛ بە کوردی، تورکی یان ئینگلیزی وەڵام دەدەینەوە.', tr: 'Bize yaz; Kürtçe, Türkçe ya da İngilizce yanıt veririz.', en: 'Write to us; we answer in Kurdish, Turkish or English.', fa: 'برایمان بنویس؛ به کردی، ترکی یا انگلیسی پاسخ می‌دهیم.', ar: 'اكتب لنا؛ نجيب بالكردية أو التركية أو الإنجليزية.' },
    // ── donate: anonymous, with a code (2026-10-06) ──
    howStart:   { kmr: 'Çawa dest pê dikî?', ckb: 'چۆن دەست پێدەکەیت؟', tr: 'Nasıl başlamak istersin?', en: 'How would you like to start?', fa: 'چگونه می‌خواهی شروع کنی؟', ar: 'كيف تريد أن تبدأ؟' },
    anonT:      { kmr: 'Bê cuzdan, bi kodekê', ckb: 'بێ جزدان، بە کۆدێک', tr: 'Cüzdansız, bir kodla', en: 'No wallet — with a code', fa: 'بدون کیف پول، با یک کد', ar: 'بلا محفظة — برمز' },
    anonD:      { kmr: 'Ne nav, ne e-name, ne cuzdan. Em kodekê didin te; bi wê tu dikarî paşê vegerî û tomarên xwe jê bibî.', ckb: 'نە ناو، نە ئیمەیڵ، نە جزدان. کۆدێکت پێدەدەین؛ بەوە دەتوانیت دواتر بگەڕێیتەوە و تۆمارەکانت بسڕیتەوە.', tr: 'İsim, e-posta ya da cüzdan yok. Sana bir kod veriyoruz; onunla sonra geri dönebilir ve kayıtlarını silebilirsin.', en: 'No name, no e-mail, no wallet. We give you a code; with it you can come back later and delete your recordings.', fa: 'نه نام، نه ایمیل، نه کیف پول. یک کد به تو می‌دهیم؛ با آن می‌توانی بعداً برگردی و ضبط‌هایت را حذف کنی.', ar: 'لا اسم ولا بريد ولا محفظة. نعطيك رمزًا؛ تستطيع به العودة لاحقًا وحذف تسجيلاتك.' },
    anonBtn:    { kmr: 'Bê cuzdan dest pê bike', ckb: 'بێ جزدان دەست پێبکە', tr: 'Cüzdansız başla', en: 'Start without a wallet', fa: 'بدون کیف پول شروع کن', ar: 'ابدأ بلا محفظة' },
    walletT:    { kmr: 'Bi cuzdana Pezkuwi', ckb: 'بە جزدانی پەزکووی', tr: 'Pezkuwi cüzdanıyla', en: 'With a Pezkuwi wallet', fa: 'با کیف پول پزکووی', ar: 'بمحفظة Pezkuwi' },
    walletD:    { kmr: 'Bi îmzeyekê têkeve. Wekî din tu dikarî tomarên bexşkarên din jî kontrol bikî.', ckb: 'بە واژۆیەک بچۆ ژوورەوە. هەروەها دەتوانیت تۆماری بەخشەرانی تریش بپشکنیت.', tr: 'Bir imzayla giriş yap. Ayrıca diğer bağışçıların kayıtlarını da kontrol edebilirsin.', en: 'Sign in with one signature. You can also check other donors’ recordings.', fa: 'با یک امضا وارد شو. همچنین می‌توانی ضبط‌های اهداکنندگان دیگر را بررسی کنی.', ar: 'سجّل الدخول بتوقيع واحد. ويمكنك أيضًا مراجعة تسجيلات المتبرّعين الآخرين.' },
    haveCode:   { kmr: 'Kodeke te heye? Pê vegere:', ckb: 'کۆدت هەیە؟ پێی بگەڕێوە:', tr: 'Kodun var mı? Onunla geri dön:', en: 'Already have a code? Come back with it:', fa: 'کد داری؟ با آن برگرد:', ar: 'لديك رمز؟ عُد به:' },
    codeGo:     { kmr: 'Bi kodê vegere', ckb: 'بە کۆد بگەڕێوە', tr: 'Kodla devam et', en: 'Continue with code', fa: 'ادامه با کد', ar: 'تابع بالرمز' },
    codeTitle:  { kmr: 'Koda te ya bexşê', ckb: 'کۆدی بەخشینت', tr: 'Bağış kodun', en: 'Your donation code', fa: 'کد اهدای تو', ar: 'رمز تبرّعك' },
    codeLead:   { kmr: 'Vê kodê li cihekî ewle hilîne. Ew tenê rê ye ku tu dîsa têkevî an tomarên xwe jê bibî. Em kodê bi xwe nagirin, tenê şopa wê (hash).', ckb: 'ئەم کۆدە لە شوێنێکی پارێزراو هەڵبگرە. تاکە ڕێگەیە بۆ ئەوەی دووبارە بچیتە ژوورەوە یان تۆمارەکانت بسڕیتەوە. خودی کۆدەکە هەڵناگرین، تەنها پەنجەمۆرەکەی (hash).', tr: 'Bu kodu güvenli bir yerde sakla. Tekrar girmenin ya da kayıtlarını silmenin tek yolu bu. Kodun kendisini saklamıyoruz, yalnızca parmak izini (hash).', en: 'Keep this code somewhere safe. It is the only way to sign back in or delete your recordings. We do not keep the code itself, only its fingerprint (hash).', fa: 'این کد را جای امنی نگه دار. تنها راه ورود دوباره یا حذف ضبط‌هایت است. خودِ کد را نگه نمی‌داریم، فقط اثرانگشت (هش) آن را.', ar: 'احفظ هذا الرمز في مكان آمن. إنه الطريق الوحيد للعودة أو لحذف تسجيلاتك. لا نحتفظ بالرمز نفسه، بل ببصمته (hash) فقط.' },
    codeCopy:   { kmr: 'Kopî bike', ckb: 'لەبەرگرتنەوە', tr: 'Kopyala', en: 'Copy', fa: 'کپی', ar: 'نسخ' },
    codeCopied: { kmr: 'Hate kopîkirin ✓', ckb: 'لەبەرگیرایەوە ✓', tr: 'Kopyalandı ✓', en: 'Copied ✓', fa: 'کپی شد ✓', ar: 'تم النسخ ✓' },
    codeDownload:{ kmr: 'Wekî pel daxe', ckb: 'وەک فایل دابەزێنە', tr: 'Dosya olarak indir', en: 'Download as a file', fa: 'دانلود به‌صورت فایل', ar: 'نزّل كملف' },
    codeWarn:   { kmr: 'Heke tu vê kodê winda bikî, em nikarin bibînin ka kîjan tomar yên te ne — ji ber ku em nizanin tu kî yî. Mafê jêbirinê yê te dimîne, lê bê kod kes nikare tomarên te bibîne.', ckb: 'ئەگەر ئەم کۆدە ون بکەیت، ناتوانین بزانین کام تۆمار هی تۆن — چونکە نازانین تۆ کێیت. مافی سڕینەوەت دەمێنێت، بەڵام بێ کۆد کەس ناتوانێت تۆمارەکانت بدۆزێتەوە.', tr: 'Bu kodu kaybedersen hangi kayıtların senin olduğunu bulamayız — çünkü kim olduğunu bilmiyoruz. Silme hakkın sende kalır, ama kod olmadan kimse kayıtlarını bulamaz.', en: 'If you lose this code we cannot tell which recordings are yours — because we do not know who you are. Your right to delete stays yours, but without the code nobody can find your recordings.', fa: 'اگر این کد را گم کنی، نمی‌توانیم بفهمیم کدام ضبط‌ها از توست — چون نمی‌دانیم تو کیستی. حق حذف برای تو می‌ماند، اما بدون کد هیچ‌کس نمی‌تواند ضبط‌هایت را پیدا کند.', ar: 'إن فقدت هذا الرمز فلن نستطيع معرفة أيّ التسجيلات لك — لأننا لا نعرف من أنت. يبقى حقّك في الحذف قائمًا، لكن بلا الرمز لا يستطيع أحد إيجاد تسجيلاتك.' },
    codeKept:   { kmr: 'Min kod hilanî.', ckb: 'کۆدەکەم هەڵگرت.', tr: 'Kodu sakladım.', en: 'I have saved the code.', fa: 'کد را ذخیره کردم.', ar: 'حفظتُ الرمز.' },
    codeNext:   { kmr: 'Berdewam bike', ckb: 'بەردەوام بە', tr: 'Devam et', en: 'Continue', fa: 'ادامه', ar: 'تابع' },
    showCode:   { kmr: 'Koda min nîşan bide', ckb: 'کۆدەکەم پیشان بدە', tr: 'Kodumu göster', en: 'Show my code', fa: 'کدم را نشان بده', ar: 'اعرض رمزي' },
    anonAcct:   { kmr: 'Bexşkarê bênav', ckb: 'بەخشەری بێناو', tr: 'Anonim bağışçı', en: 'Anonymous donor', fa: 'اهداکنندهٔ ناشناس', ar: 'متبرّع مجهول' },
    anonNoReview:{ kmr: 'Kontrolkirina tomaran bi cuzdanê ye: kod bi hêsanî tên çêkirin, deng nabe ku wisa bin. Tu dikarî bi tomarkirinê alîkariyê bidomînî.', ckb: 'پشکنینی تۆمارەکان بە جزدانە: کۆد بە ئاسانی دروست دەکرێت، دەنگدان نابێت وا بێت. دەتوانیت بە تۆمارکردن یارمەتی بدەیت.', tr: 'Kayıtları kontrol etmek cüzdan ister: kodlar kolayca üretilir, oylar öyle olmamalı. Kayıt yaparak katkı vermeye devam edebilirsin.', en: 'Checking recordings needs a wallet: codes are easy to make, votes must not be. You can keep helping by recording.', fa: 'بررسی ضبط‌ها کیف پول می‌خواهد: کد به‌آسانی ساخته می‌شود، رأی نباید چنین باشد. با ضبط کردن می‌توانی همچنان کمک کنی.', ar: 'مراجعة التسجيلات تتطلّب محفظة: الرموز سهلة الإنشاء، والأصوات يجب ألا تكون كذلك. يمكنك مواصلة المساعدة بالتسجيل.' },
    anonSignOutAsk:{ kmr: 'Te kod hilaniye? Bê wê tu nikarî vegerî an tomarên xwe jê bibî.', ckb: 'کۆدەکەت هەڵگرتووە؟ بەبێ ئەو ناتوانیت بگەڕێیتەوە یان تۆمارەکانت بسڕیتەوە.', tr: 'Kodunu sakladın mı? O olmadan geri dönemez, kayıtlarını silemezsin.', en: 'Have you saved your code? Without it you cannot come back or delete your recordings.', fa: 'کدت را ذخیره کرده‌ای؟ بدون آن نمی‌توانی برگردی یا ضبط‌هایت را حذف کنی.', ar: 'هل حفظت رمزك؟ بدونه لا تستطيع العودة أو حذف تسجيلاتك.' },
    CODE:       { kmr: 'Ev kod nayê naskirin. Kontrol bike û dîsa biceribîne.', ckb: 'ئەم کۆدە نەناسرایەوە. بیپشکنە و دووبارە هەوڵ بدەرەوە.', tr: 'Bu kod tanınmadı. Kontrol edip tekrar dene.', en: 'This code is not recognised. Check it and try again.', fa: 'این کد شناخته نشد. بررسی کن و دوباره امتحان کن.', ar: 'لم يُتعرَّف على هذا الرمز. تحقّق منه وحاول مجددًا.' },
    RATE:       { kmr: 'Pir hewl hatin dayîn. Piştî demekê dîsa biceribîne.', ckb: 'هەوڵی زۆر درا. دوای ماوەیەک دووبارە هەوڵ بدەرەوە.', tr: 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.', en: 'Too many attempts. Try again a little later.', fa: 'تلاش‌های زیادی شد. کمی بعد دوباره امتحان کن.', ar: 'محاولات كثيرة جدًا. حاول مجددًا بعد قليل.' },
    WALLET_NEEDED:{ kmr: 'Ji bo vê cuzdan pêwîst e.', ckb: 'بۆ ئەمە جزدان پێویستە.', tr: 'Bunun için cüzdan gerekiyor.', en: 'This needs a wallet.', fa: 'این کار کیف پول می‌خواهد.', ar: 'هذا يتطلّب محفظة.' },
    wPreparing: { kmr: 'Girêdan tê amadekirin…', ckb: 'پەیوەندی ئامادە دەکرێت…', tr: 'Bağlantı hazırlanıyor…', en: 'Preparing the connection…', fa: 'در حال آماده‌سازی اتصال…', ar: 'جارٍ تجهيز الاتصال…' },
    // the way in, made plain (2026-10-07)
    giveTitle:   { kmr: 'Dengê xwe bexşîne', ckb: 'دەنگت ببەخشە', tr: 'Sesini bağışla', en: 'Donate your voice', fa: 'صدایت را اهدا کن', ar: 'تبرّع بصوتك' },
    giveLead:    { kmr: '3 gav, 2 deqîqe. Çend hevokan bixwîne; em dengê Kurdî yê zekaya çêkirî bi hev re ava bikin.', ckb: '٣ هەنگاو، ٢ خولەک. چەند ڕستەیەک بخوێنەوە؛ پێکەوە دەنگی کوردیی زیرەکی دەستکرد بنیات دەنێین.', tr: '3 adım, 2 dakika. Birkaç cümle oku; Kürtçenin yapay zekâ sesini birlikte kuralım.', en: '3 steps, 2 minutes. Read a few sentences and help build the Kurdish AI voice.', fa: '۳ گام، ۲ دقیقه. چند جمله بخوان؛ با هم صدای کردیِ هوش مصنوعی را بسازیم.', ar: '٣ خطوات، دقيقتان. اقرأ بضع جمل ولنبنِ معًا الصوت الكردي للذكاء الاصطناعي.' },
    giveGo:      { kmr: 'Dest pê bike →', ckb: 'دەست پێبکە ←', tr: 'Başla →', en: 'Start →', fa: 'شروع ←', ar: 'ابدأ ←' },
    toolNote:    { kmr: 'Ev amûreke xwendinê ye: tiştê tu dinivîsî zekaya çêkirî dixwîne, li vir tomar nayê kirin. Ji bo bexşandina dengê xwe, bişkoka kesk a li jor bitikîne.', ckb: 'ئەمە ئامرازێکی خوێندنەوەیە: ئەوەی دەینووسیت زیرەکی دەستکرد دەیخوێنێتەوە، لێرە تۆمار ناکرێت. بۆ بەخشینی دەنگت، دوگمە سەوزەکەی سەرەوە دابگرە.', tr: 'Bu bir okuma aracıdır: yazdığını yapay zekâ okur, burada kayıt yapılmaz. Sesini bağışlamak için yukarıdaki yeşil düğmeye bas.', en: 'This is a reading tool: the AI reads what you type, nothing is recorded here. To donate your voice, press the green button above.', fa: 'این یک ابزار خواندن است: هوش مصنوعی آنچه می‌نویسی را می‌خواند و اینجا چیزی ضبط نمی‌شود. برای اهدای صدایت، دکمهٔ سبز بالا را بزن.', ar: 'هذه أداة قراءة: يقرأ الذكاء الاصطناعي ما تكتبه، ولا يُسجَّل شيء هنا. للتبرّع بصوتك اضغط الزر الأخضر في الأعلى.' },
    stepStart:   { kmr: 'Dest pê bike', ckb: 'دەستپێک', tr: 'Başla', en: 'Start', fa: 'شروع', ar: 'البدء' },
    stepConsent: { kmr: 'Razîbûn', ckb: 'ڕەزامەندی', tr: 'Onay', en: 'Consent', fa: 'رضایت', ar: 'الموافقة' },
    stepRead:    { kmr: 'Bixwîne', ckb: 'بخوێنەوە', tr: 'Oku', en: 'Read', fa: 'بخوان', ar: 'اقرأ' },
    micWhy:      { kmr: 'Ji bo tomarê mîkrofon pêwîst e. Telefon dê destûrê bixwaze: “Destûr bide” bitikîne.', ckb: 'بۆ تۆمارکردن مایکرۆفۆن پێویستە. مۆبایلەکەت ڕێگە داوا دەکات: «ڕێگە بدە» دابگرە.', tr: 'Kayıt için mikrofon gerekiyor. Telefonun izin isteyecek: “İzin ver”e bas.', en: 'Recording needs the microphone. Your phone will ask: press “Allow”.', fa: 'برای ضبط به میکروفون نیاز است. گوشی اجازه می‌خواهد: «اجازه دادن» را بزن.', ar: 'التسجيل يحتاج إلى الميكروفون. سيطلب هاتفك الإذن: اضغط «سماح».' },
    micAllow:    { kmr: '🎙 Destûra mîkrofonê bide', ckb: '🎙 ڕێگە بە مایکرۆفۆن بدە', tr: '🎙 Mikrofona izin ver', en: '🎙 Allow the microphone', fa: '🎙 اجازه به میکروفون', ar: '🎙 اسمح بالميكروفون' },
    micReady:    { kmr: '✓ Mîkrofon amade ye', ckb: '✓ مایکرۆفۆن ئامادەیە', tr: '✓ Mikrofon hazır', en: '✓ Microphone ready', fa: '✓ میکروفون آماده است', ar: '✓ الميكروفون جاهز' },
    needMic:     { kmr: 'Destûra mîkrofonê bide.', ckb: 'ڕێگە بە مایکرۆفۆن بدە.', tr: 'Mikrofona izin ver.', en: 'Allow the microphone.', fa: 'به میکروفون اجازه بده.', ar: 'اسمح بالميكروفون.' },
    micUnsupported: { kmr: 'Ev gerok nikare tomar bike. Rûpelê di Chrome an Safariyê de veke.', ckb: 'ئەم وێبگەڕە ناتوانێت تۆمار بکات. پەڕەکە لە Chrome یان Safari بکەرەوە.', tr: 'Bu tarayıcı kayıt yapamıyor. Sayfayı Chrome ya da Safari’de aç.', en: 'This browser cannot record. Open the page in Chrome or Safari.', fa: 'این مرورگر نمی‌تواند ضبط کند. صفحه را در Chrome یا Safari باز کن.', ar: 'هذا المتصفح لا يستطيع التسجيل. افتح الصفحة في Chrome أو Safari.' },
    recNow:      { kmr: 'Tê tomarkirin', ckb: 'تۆمار دەکرێت', tr: 'Kayıt yapılıyor', en: 'Recording', fa: 'در حال ضبط', ar: 'جارٍ التسجيل' },
    recGo:       { kmr: 'Bitikîne û bixwîne', ckb: 'دابگرە و بخوێنەوە', tr: 'Bas ve konuş', en: 'Tap and speak', fa: 'بزن و بخوان', ar: 'اضغط وتكلّم' },
    recStop:     { kmr: 'Dema qediya bitikîne', ckb: 'کە تەواو بوو دابگرە', tr: 'Bitince bas', en: 'Tap when done', fa: 'تمام شد؟ بزن', ar: 'اضغط عند الانتهاء' },
    sayIdle:     { kmr: 'Pêşî bişkokê bitikîne, paşê hevoka li jor bi dengekî bilind bixwîne.', ckb: 'سەرەتا دوگمەکە دابگرە، پاشان ڕستەکەی سەرەوە بە دەنگی بەرز بخوێنەوە.', tr: 'Önce düğmeye bas, sonra yukarıdaki cümleyi yüksek sesle oku.', en: 'First tap the button, then read the sentence above out loud.', fa: 'اول دکمه را بزن، بعد جملهٔ بالا را بلند بخوان.', ar: 'اضغط الزر أولًا، ثم اقرأ الجملة أعلاه بصوت عالٍ.' },
    sayRec:      { kmr: 'Niha bixwîne. Dema qediya, bişkoka sor bitikîne.', ckb: 'ئێستا بخوێنەوە. کە تەواو بوو، دوگمە سوورەکە دابگرە.', tr: 'Şimdi oku. Bitince kırmızı düğmeye bas.', en: 'Read now. When you finish, tap the red button.', fa: 'حالا بخوان. وقتی تمام شد، دکمهٔ قرمز را بزن.', ar: 'اقرأ الآن. عند الانتهاء اضغط الزر الأحمر.' },
    sayDone:     { kmr: 'Tomara te amade ye. Guhdarî bike; heke baş e, bişîne.', ckb: 'تۆمارەکەت ئامادەیە. گوێی لێ بگرە؛ ئەگەر باشە، بینێرە.', tr: 'Kaydın hazır. Dinle, beğendiysen gönder.', en: 'Your recording is ready. Listen, and send it if it sounds right.', fa: 'ضبطت آماده است. گوش بده و اگر خوب است بفرست.', ar: 'تسجيلك جاهز. استمع إليه، وأرسله إن كان جيدًا.' },
    saySending:  { kmr: 'Tê şandin…', ckb: 'دەنێردرێت…', tr: 'Gönderiliyor…', en: 'Sending…', fa: 'در حال ارسال…', ar: 'جارٍ الإرسال…' },
    thanksN:     { kmr: '✓ Spas! Te {n} hevok xwendin. Ya din li jor e.', ckb: '✓ سوپاس! {n} ڕستەت خوێندەوە. دانەی داهاتوو لە سەرەوەیە.', tr: '✓ Teşekkürler! {n} cümle okudun. Sıradaki yukarıda.', en: '✓ Thank you! You have read {n} sentences. The next one is above.', fa: '✓ سپاس! {n} جمله خواندی. جملهٔ بعدی بالاست.', ar: '✓ شكرًا! قرأت {n} جملة. الجملة التالية في الأعلى.' },
    skipSentence: { kmr: 'Vê hevokê derbas bike', ckb: 'ئەم ڕستەیە تێپەڕێنە', tr: 'Bu cümleyi atla', en: 'Skip this sentence', fa: 'از این جمله بگذر', ar: 'تخطَّ هذه الجملة' },
    // campaign and sharing (2026-10-08)
    campTitle:   { kmr: 'Kampanya: dengê xwe bexşîne', ckb: 'هەڵمەت: دەنگت ببەخشە', tr: 'Kampanya: sesini bağışla', en: 'Campaign: donate your voice', fa: 'کارزار: صدایت را اهدا کن', ar: 'حملة: تبرّع بصوتك' },
    campLeft:    { kmr: '{n} roj maye', ckb: '{n} ڕۆژ ماوە', tr: '{n} gün kaldı', en: '{n} days left', fa: '{n} روز مانده', ar: 'بقي {n} أيام' },
    campLast:    { kmr: 'Roja dawî!', ckb: 'دوا ڕۆژ!', tr: 'Son gün!', en: 'Last day!', fa: 'روز آخر!', ar: 'اليوم الأخير!' },
    campOf:      { kmr: '{x} / {y} saet', ckb: '{x} / {y} کاتژمێر', tr: '{x} / {y} saat', en: '{x} / {y} hours', fa: '{x} / {y} ساعت', ar: '{x} / {y} ساعة' },
    campDone:    { kmr: 'Armanc hat bidestxistin! Spas.', ckb: 'ئامانج بەدەستهات! سوپاس.', tr: 'Hedefe ulaşıldı! Teşekkürler.', en: 'Goal reached! Thank you.', fa: 'به هدف رسیدیم! سپاس.', ar: 'تحقّق الهدف! شكرًا.' },
    shareBtn:    { kmr: '📣 Hevalên xwe vexwîne', ckb: '📣 هاوڕێکانت بانگهێشت بکە', tr: '📣 Arkadaşlarını çağır', en: '📣 Invite your friends', fa: '📣 دوستانت را دعوت کن', ar: '📣 ادعُ أصدقاءك' },
    shareText:   { kmr: 'Min dengê xwe bexşî zimanê xwe. Tu jî çend hevokan bixwîne: em dengê Kurdî yê zekaya çêkirî bi hev re ava dikin.', ckb: 'من دەنگی خۆمم بە زمانەکەم بەخشی. تۆش چەند ڕستەیەک بخوێنەوە: پێکەوە دەنگی کوردیی زیرەکی دەستکرد بنیات دەنێین.', tr: 'Sesimi dilime bağışladım. Sen de birkaç cümle oku: Kürtçenin yapay zekâ sesini birlikte kuruyoruz.', en: 'I gave my voice to my language. Read a few sentences too: together we are building the Kurdish AI voice.', fa: 'من صدایم را به زبانم اهدا کردم. تو هم چند جمله بخوان: با هم صدای کردیِ هوش مصنوعی را می‌سازیم.', ar: 'منحتُ صوتي للغتي. اقرأ أنت أيضًا بضع جمل: معًا نبني الصوت الكردي للذكاء الاصطناعي.' },
    shareCopied: { kmr: 'Lînk hat kopîkirin', ckb: 'بەستەر لەبەرگیرایەوە', tr: 'Bağlantı kopyalandı', en: 'Link copied', fa: 'پیوند کپی شد', ar: 'تم نسخ الرابط' },
    retry:      { kmr: 'Dîsa biceribîne', ckb: 'دووبارە هەوڵ بدەرەوە', tr: 'Tekrar dene', en: 'Try again', fa: 'دوباره امتحان کن', ar: 'حاول مجددًا' }
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
  var session = { addr: null, csrf: null, speaker: null, anon: false };
  var CODE_KEY = 'kt-anon-code';
  function keptCode() { try { return localStorage.getItem(CODE_KEY); } catch (e) { return null; } }
  function keepCode(c) { try { if (c) localStorage.setItem(CODE_KEY, c); else localStorage.removeItem(CODE_KEY); } catch (e) { /* private mode: the code is still on screen */ } }
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
      session.addr = r.json.addr || null; session.csrf = r.json.csrf || null; session.speaker = r.json.speaker || null; session.anon = !!r.json.anon;
      paintAcct();
      document.dispatchEvent(new Event('kt-session'));
    });
  }
  // Donated voice is shown in minutes: in hours the first weeks all read "0".
  function sec(o, s, h) { return o[s] != null ? o[s] : (o[h] || 0) * 3600; }
  function mins(seconds) { return (Math.round(seconds / 6) / 10).toLocaleString('en-US', { maximumFractionDigits: 1 }); }
  function short(a) { return a ? a.slice(0, 6) + '…' + a.slice(-4) : ''; }
  function paintAcct() {
    var b = document.querySelector('.acct');
    if (!b) return;
    b.textContent = '';
    if (session.addr) { b.appendChild(session.anon ? h('span', null, say('anonAcct')) : h('code', null, short(session.addr))); b.appendChild(h('span', null, '· ' + say('signOut'))); }
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
    // A phone has no browser extension to offer: it goes straight to the
    // wallet app, as app.pezkuwichain.io does (WalletModal: !isMobile).
    if (isPhone()) viaApp(); else renderSheet('pick');
  }
  function isPhone() {
    var ua = navigator.userAgent || '';
    return /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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
    } else if (state === 'prep') {
      // Before anything has reached the wallet: the code that talks to it is
      // still loading. Saying "waiting for the wallet" here sent people to
      // their phone to look for a request that was not there yet.
      box.appendChild(h('p', 'note', say('wPreparing')));
      box.appendChild(h('span', 'spin'));
    } else if (state === 'wait') {
      box.appendChild(h('p', null, say('wWaiting')));
    } else if (state === 'error') {
      box.appendChild(h('p', 'msg msg--bad', data.text));
      if (data.install) box.appendChild(storeLinks());
      // On a phone there is nothing to go back to choose: try the wallet again.
      var back = h('button', 'btn btn--ghost', isPhone() ? say('retry') : '←');
      back.onclick = function () { if (isPhone()) viaApp(); else renderSheet('pick'); };
      box.appendChild(back);
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
  // The WalletConnect bundle is fetched at the same time as the chain one, not
  // after it: it is asked for by the chain bundle only once that has loaded and
  // run, and the two downloads used to follow each other.
  function preloadWC() {
    if (document.querySelector('link[data-wc]')) return;
    var l = document.createElement('link');
    l.rel = 'preload'; l.as = 'script'; l.href = '/static/kt-wc.js'; l.dataset.wc = '1';
    document.head.appendChild(l);
  }
  function viaApp() {
    renderSheet('prep');
    preloadWC();
    chain().then(function (C) {
      return C.wcRestore().then(function (acc) {
        if (acc.length) return signIn(acc[0]);
        return C.wcStart().then(function (p) {
          if (p.error) return renderSheet('error', { text: say('FAILED') + (p.error === 'WC_TIMEOUT' ? ' (WalletConnect)' : '') });
          var phone = isPhone();
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
    // An anonymous donor who signs out comes back only with the code.
    if (session.anon && !window.confirm(say('anonSignOutAsk'))) return;
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

  // ── how far people get, counted per day and step and nothing else ──────
  // Once per step per tab; see /api/funnel. A lost count is no loss. The ?k=
  // of a campaign link (k=telegram) is kept for the tab, so the counts can say
  // which channel brought people who went on to record.
  var REF = (function () {
    var ok = /^[a-z0-9-]{1,24}$/, k = (new URLSearchParams(location.search).get('k') || '').toLowerCase();
    try {
      if (ok.test(k)) sessionStorage.setItem('kt-ref', k);
      return sessionStorage.getItem('kt-ref');
    } catch (e) { return ok.test(k) ? k : null; }
  })();
  function track(step) {
    try { if (sessionStorage.getItem('kt-f-' + step)) return; sessionStorage.setItem('kt-f-' + step, '1'); } catch (e) { /* private mode */ }
    var body = JSON.stringify(REF ? { step: step, ref: REF } : { step: step });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon('/api/funnel', new Blob([body], { type: 'application/json' }))) return;
      fetch('/api/funnel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
    } catch (e) { /* never in the way of a donation */ }
  }

  // ── a campaign's goal, from /api/donate/stats; nothing shows without one ──
  var lastStats = null;
  function paintCampaign(j) {
    var box = document.getElementById('camp');
    if (!box) return;
    lastStats = j;
    var c = j && j.campaign;
    if (!c || c.now >= c.ends_at) { box.hidden = true; return; }
    var days = Math.ceil((c.ends_at - c.now) / 86400);
    box.querySelector('[data-k="left"]').textContent = days <= 1 ? say('campLast') : say('campLeft').replace('{n}', days);
    var rows = box.querySelector('.camp__rows');
    rows.textContent = '';
    Object.keys(c.goals).forEach(function (d) {
      var got = (c.seconds[d] || 0) / 3600, goal = c.goals[d];
      var row = h('div', 'camp__row' + (got >= goal ? ' camp__row--done' : ''));
      var top = h('div', 'meter__top');
      top.appendChild(h('b', null, say(d)));
      top.appendChild(h('span', null, got >= goal ? say('campDone')
        : say('campOf').replace('{x}', got.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })).replace('{y}', goal)));
      var bar = h('div', 'meter__bar'), fill = h('i');
      fill.style.setProperty('--p', Math.min(100, got / goal * 100) + '%');
      bar.appendChild(fill);
      row.appendChild(top); row.appendChild(bar); rows.appendChild(row);
    });
    box.hidden = false;
  }
  document.addEventListener('kt-lang', function () { if (lastStats) paintCampaign(lastStats); });

  // ── page: donate ─────────────────────────────────────────────────────────
  function donatePage() {
    var GOAL_H = 50;
    var gate = document.getElementById('gate'), prof = document.getElementById('profile'), work = document.getElementById('work');
    function stats() {
      api('GET', '/api/donate/stats').then(function (r) {
        paintCampaign(r.json);
        ['kmr', 'ckb'].forEach(function (d) {
          var s = r.json[d]; if (!s) return;
          var el = document.querySelector('[data-stat="' + d + '"]');
          el.querySelector('[data-k="h"]').textContent = mins(s.seconds != null ? s.seconds : s.hours * 3600);
          el.querySelector('[data-k="v"]').textContent = s.valid_hours;
          el.querySelector('[data-k="s"]').textContent = s.speakers;
          el.querySelector('.meter__bar i').style.setProperty('--p', Math.min(100, s.valid_hours / GOAL_H * 100) + '%');
        });
        var me = document.getElementById('me');
        if (r.json.me) { me.hidden = false; me.querySelector('[data-k="c"]').textContent = r.json.me.clips;
          me.querySelector('[data-k="m"]').textContent = r.json.me.minutes; me.querySelector('[data-k="v"]').textContent = r.json.me.votes; }
      });
    }
    var codeCard = document.getElementById('codeCard'), pendingCode = null, steps = document.getElementById('steps');
    var canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
    track('visit');
    function show() {
      codeCard.hidden = !pendingCode;
      gate.hidden = !!session.addr || !!pendingCode;
      var ready = session.speaker && session.speaker.consent_version === prof.dataset.consent && session.speaker.dialect;
      prof.hidden = !session.addr || !!ready || !!pendingCode;
      work.hidden = !ready || !!pendingCode;
      steps.dataset.at = ready && !pendingCode ? '3' : session.addr && !pendingCode ? '2' : '1';
      document.getElementById('showCode').hidden = !(session.anon && keptCode());
      if (ready && !work.dataset.started) { work.dataset.started = '1'; nextSentence(); }
      stats();
    }
    document.addEventListener('kt-session', show);
    document.getElementById('gateBtn').addEventListener('click', function () { track('start'); openSheet(); });

    // ── the anonymous way in: a code instead of a wallet ──
    // The code is shown once by the server and kept in this browser for
    // convenience only; the donor is asked to keep it themselves, because
    // a cleared browser forgets it and we only ever had its hash.
    function codeError(el, r) {
      el.textContent = say(r.status === 429 ? 'RATE' : (r.json && r.json.detail === 'CODE') ? 'CODE' : 'FAILED');
      el.hidden = false;
    }
    function showCodeCard(code) {
      pendingCode = code;
      document.getElementById('codeText').textContent = code;
      var kept = document.getElementById('codeKept'); kept.checked = false;
      document.getElementById('codeNext').disabled = true;
      show();
      codeCard.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
    document.getElementById('anonBtn').addEventListener('click', function () {
      var b = this, msg = document.getElementById('anonMsg');
      b.disabled = true; msg.hidden = true; track('start');
      api('POST', '/api/c/anon/start').then(function (r) {
        b.disabled = false;
        if (!r.ok) return codeError(msg, r);
        keepCode(r.json.code);
        session.csrf = r.json.csrf;
        showCodeCard(r.json.code);
        refresh();
      });
    });
    document.getElementById('codeKept').addEventListener('change', function () {
      document.getElementById('codeNext').disabled = !this.checked;
    });
    document.getElementById('codeNext').addEventListener('click', function () { pendingCode = null; show(); });
    document.getElementById('codeCopy').addEventListener('click', function () {
      var b = this, done = function () { b.textContent = say('codeCopied'); setTimeout(function () { b.textContent = say('codeCopy'); }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(pendingCode).then(done, function () {});
    });
    document.getElementById('codeSave').addEventListener('click', function () {
      var text = 'KurdAi Voice — ' + say('codeTitle') + '\n\n' + pendingCode + '\n\n' + say('codeLead') + '\n\nhttps://kurdishtts.dks.news/bexsh\n';
      var a = h('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      a.download = 'kurdai-voice-code.txt'; document.body.appendChild(a); a.click(); a.remove();
    });
    document.getElementById('showCode').addEventListener('click', function () { if (keptCode()) showCodeCard(keptCode()); });
    document.getElementById('haveCode').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('codeIn'), msg = document.getElementById('codeMsg');
      msg.hidden = true;
      api('POST', '/api/c/anon/login', { code: input.value }).then(function (r) {
        if (!r.ok) return codeError(msg, r);
        keepCode(input.value.trim().toUpperCase()); input.value = '';
        refresh();
      });
    });
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
      if (!micOk) missing.push(say('needMic'));
      startBtn.disabled = missing.length > 0;
      hint.textContent = missing.join(' ');
      hint.hidden = !missing.length;
    }
    // The sixth step under the five boxes: the microphone. Not a box to tick
    // and not part of the consent record (still five answers), but asked here
    // so that the first press on the record button records instead of opening
    // a permission prompt, and so a refusal is explained before step 3.
    var micRow = document.getElementById('micRow'), micHelp = document.getElementById('micHelp'), micOk = false;
    function micState(st) {
      micOk = st === 'ok';
      micRow.dataset.state = st;
      micHelp.textContent = say(st === 'none' ? 'micUnsupported' : 'micDenied');
      micHelp.hidden = st !== 'denied' && st !== 'none';
      check();
    }
    document.getElementById('micBtn').addEventListener('click', function () {
      if (!canRecord) return micState('none');
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
        s.getTracks().forEach(function (t) { t.stop(); });
        micState('ok');
      }, function () { micState('denied'); });
    });
    if (!canRecord) micState('none');
    else if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' }).then(function (p) {
        if (p.state === 'granted') micState('ok'); else if (p.state === 'denied') micState('denied');
      }, function () { /* not asked yet, or the browser cannot tell */ });
    }
    document.addEventListener('kt-lang', function () { paintConsent(); micState(micRow.dataset.state); });
    paintConsent();
    check();
    startBtn.addEventListener('click', function () {
      api('POST', '/api/donate/profile', { dialect: pdialect,
        boxes: boxes.map(function (b) { return b.checked; }), lang: lang })
        .then(function (r) { if (r.ok) { track('consent'); refresh(); } });
    });

    // tabs
    var tabs = work.querySelectorAll('.tabs button');
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        tabs.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        document.getElementById('panelRecord').hidden = b.dataset.tab !== 'record';
        document.getElementById('panelReview').hidden = b.dataset.tab !== 'review';
        if (b.dataset.tab === 'review') {
          // Checking needs a wallet: codes are free to make, votes must not be.
          document.getElementById('anonNoReview').hidden = !session.anon;
          if (session.anon) { vEmpty.hidden = true; vBox.hidden = true; return; }
          nextReview();
        }
      });
    });

    // recording: one big button and four states. Every state says on the
    // button and above it what to do next, because people did not see where
    // to start and stop. idle → recording → recorded → sending → idle.
    var queue = [], current = null, rec = null, chunks = [], blob = null, stream = null, meterRaf = 0, clock = 0, cutoff = 0, sent = 0;
    var sEl = document.getElementById('sentence'), recBtn = document.getElementById('rec'), play = document.getElementById('play');
    var again = document.getElementById('again'), send = document.getElementById('send'), skip = document.getElementById('skip');
    var studio = document.getElementById('studio'), studioSay = document.getElementById('studioSay');
    var recLabel = document.getElementById('recLabel'), timer = document.getElementById('timer');
    var rmsg = document.getElementById('rmsg'), wave = document.getElementById('wave'), wctx = wave.getContext('2d');
    var SAY = { idle: 'sayIdle', recording: 'sayRec', recorded: 'sayDone', sending: 'saySending' };
    // What the server refuses a recording for: the fix is to read it again.
    var RETAKE = ['TOO_SHORT', 'TOO_LONG', 'TOO_QUIET', 'SILENT', 'CLIPPING', 'PACE'];
    function note(text, ok) { rmsg.textContent = text; rmsg.className = 'msg ' + (ok ? 'msg--ok' : 'msg--bad'); rmsg.hidden = !text; }
    function setState(st) {
      studio.dataset.state = st;
      studioSay.textContent = say(SAY[st]);
      recLabel.textContent = say(st === 'recording' ? 'recStop' : 'recGo');
      recBtn.setAttribute('aria-pressed', st === 'recording' ? 'true' : 'false');
      play.hidden = !(st === 'recorded' || st === 'sending');
      send.disabled = st === 'sending';
    }
    document.addEventListener('kt-lang', function () { setState(studio.dataset.state); });
    function tick(t0) {
      var s = Math.floor((Date.now() - t0) / 1000);
      timer.textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);
    }
    function nextSentence() {
      blob = null; setState('idle');
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
    setState('idle');
    var ac = null;
    function startRec() {
      note('');
      if (!canRecord) return note(say('micUnsupported'));
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: true, channelCount: 1 } })
        .then(function (s) {
          stream = s; chunks = []; ac = meter(s);
          var m = mime(); rec = new MediaRecorder(s, m ? { mimeType: m } : undefined);
          rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
          rec.onstop = function () {
            blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
            play.src = URL.createObjectURL(blob);
            clearInterval(clock); setState('recorded'); track('first_rec');
            stream.getTracks().forEach(function (t) { t.stop(); }); cancelAnimationFrame(meterRaf);
            recBtn.style.setProperty('--lvl', 0); drawFlat();
            if (ac) ac.close();
          };
          rec.start(); setState('recording');
          var t0 = Date.now(); tick(t0); clearInterval(clock); clock = setInterval(function () { tick(t0); }, 250);
          // The server takes at most 15 s; stop just before. A timer left from an
          // earlier take must not cut this one short.
          clearTimeout(cutoff); cutoff = setTimeout(function () { if (rec && rec.state === 'recording') stopRec(); }, 14500);
        })
        .catch(function () { note(say('micDenied')); });
    }
    function stopRec() { if (rec && rec.state === 'recording') rec.stop(); }
    recBtn.addEventListener('click', function () {
      if (studio.dataset.state === 'sending') return;
      if (rec && rec.state === 'recording') stopRec(); else startRec();
    });
    again.addEventListener('click', function () { blob = null; note(''); startRec(); });
    skip.addEventListener('click', function () { note(''); nextSentence(); });
    send.addEventListener('click', function () {
      if (!blob || !current) return;
      setState('sending'); note('');
      var f = new FormData(); f.append('sentence_id', current.id); f.append('audio', blob, 'clip');
      api('POST', '/api/donate/clip', f, true).then(function (r) {
        var d = r.json && r.json.detail;
        if (r.ok) { sent++; note(say('thanksN').replace('{n}', sent), true); track('sent'); shareBtn.hidden = false; stats(); nextSentence(); }
        else if (d === 'ALREADY_RECORDED') nextSentence();
        else if (RETAKE.indexOf(d) >= 0 || d === 'DAILY_LIMIT') { blob = null; setState('idle'); note(say(d)); }
        else { setState('recorded'); note(say(T[d] ? d : 'FAILED')); }
      }, function () { setState('recorded'); note(say('FAILED')); });
    });
    // After a first recording: one press to bring someone else. The link carries
    // k=paylas, so the counts show how many came this way.
    var shareBtn = document.getElementById('shareBtn');
    shareBtn.addEventListener('click', function () {
      var url = location.origin + '/bexsh?k=paylas', text = say('shareText');
      track('share');
      if (navigator.share) { navigator.share({ title: 'KurdAi Voice', text: text, url: url }).catch(function () {}); return; }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text + ' ' + url).then(function () {
          shareBtn.textContent = say('shareCopied');
          setTimeout(function () { shareBtn.textContent = say('shareBtn'); }, 2500);
        }, function () {});
      }
    });
    document.addEventListener('keydown', function (e) {
      if (work.hidden || document.getElementById('panelRecord').hidden || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); recBtn.click(); }
      else if (e.key === 'Enter' && studio.dataset.state === 'recorded') { e.preventDefault(); send.click(); }
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
        if (r.ok) { keepCode(null); window.alert(say('forgotten')); location.reload(); }
      });
    });
    show();
  }

  // ── page: KurdAi (what is coming) ───────────────────────────────────────
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

  // ── home: the numbers, read from the donation database on every visit ──
  // Nothing here is a claim: a section that showed "3,000+" without a source
  // would be the one thing on the page a reader could not check.
  function homeNumbers() {
    var cells = document.querySelectorAll('[data-s]');
    if (!cells.length) return;
    api('GET', '/api/donate/stats').then(function (r) {
      if (!r.ok) return;
      paintCampaign(r.json);
      var k = r.json.kmr || {}, c = r.json.ckb || {};
      function n(x, d) { return Number(x || 0).toLocaleString('en-US', { maximumFractionDigits: d || 0 }); }
      var v = {
        hours: mins(sec(k, 'seconds', 'hours') + sec(c, 'seconds', 'hours')),
        valid: mins(sec(k, 'valid_seconds', 'valid_hours') + sec(c, 'valid_seconds', 'valid_hours')),
        donors: n(r.json.donors != null ? r.json.donors : (k.speakers || 0) + (c.speakers || 0)),
        sentences: n((k.sentences || 0) + (c.sentences || 0))
      };
      cells.forEach(function (el) { el.textContent = v[el.dataset.s]; });
    });
  }

  // ── boot ─────────────────────────────────────────────────────────────────
  var sel = document.querySelector('.langsel');
  if (sel) sel.addEventListener('change', function () { applyLang(sel.value); });
  var acct = document.querySelector('.acct');
  if (acct) acct.addEventListener('click', function () { if (session.addr) signOut(); else openSheet(); });
  applyLang(lang);
  var page = document.body.dataset.page;
  if (page === 'speak') { speakPage(); homeNumbers(); }
  if (page === 'donate') donatePage();
  if (page === 'kurdai') kurdaiPage();
  refresh();
  document.addEventListener('kt-lang', paintAcct);
})();
