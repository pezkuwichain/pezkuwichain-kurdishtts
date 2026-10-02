# KurdishTTS — Donor consent text

**Consent version:** `train-only-2026-10-03` (equals `CONSENT_VERSION` in `ktts/donate.py`)
**Shown:** on `/bexsh`, before the first recording, and again whenever the version changes.
**Authoritative language:** English. Turkish, Kurmancî, Soranî, Persian and Arabic are translations.
**Kurmancî, Soranî, Persian and Arabic: NEEDS NATIVE-SPEAKER AND LEGAL REVIEW before publication.** The Turkish text should be checked by Turkish counsel for KVKK *açık rıza* wording.

## Implementation rules (for engineering — not shown to donors)

1. Show the paragraph, then **five separate checkboxes, all unticked**. The "Start" button stays disabled until all five are ticked, and the server rejects the profile unless it receives all five as `true`.
2. "Privacy Policy" links to the full policy in the same language. The Terms of Use link sits **below** the boxes as a plain link, not as a tick box: KVKK requires explicit consent to be separate from acceptance of terms.
3. Store for each consent: wallet address, consent version, UI language, the five values, and a timestamp. Store withdrawal or deletion time too, in a history table that is not overwritten.
4. Any change to this wording means a new version string, which makes every donor confirm again.
5. Never pre-tick, never hide a box behind "show more", and never combine boxes.

---

## English (authoritative)

**Before you record**

Your voice recordings are personal data. We use them, with the profile details you give (dialect, gender, age band, region), **only to train and test our own Kurdish speech models**. We never sell, share or publish them, and never use them to imitate your voice, identify you or advertise. Other donors hear them to check them, without seeing your wallet address. Details: [Privacy Policy].

- [ ] I am 18 or older.
- [ ] This is my own voice, and I record only for myself.
- [ ] I explicitly consent to this use of my recordings and profile.
- [ ] I can delete my recordings at any time: they are erased and excluded from all future training, but a model already trained on them cannot unlearn them.
- [ ] Trained models (never my recordings) may be offered as a service or published; a published model cannot be recalled.

[Terms of Use]

---

## Türkçe (çeviri — İngilizce metin esastır)

**Kayda başlamadan önce**

Ses kayıtların kişisel veridir. Onları, verdiğin profil bilgileriyle (lehçe, cinsiyet, yaş aralığı, bölge) birlikte **yalnızca kendi Kürtçe konuşma modellerimizi eğitmek ve test etmek için** kullanırız. Asla satmaz, paylaşmaz, yayımlamayız; sesini taklit etmek, seni tanımlamak veya reklam için kullanmayız. Kayıtlarını kontrol etmek için diğer bağışçılar dinler, ama cüzdan adresini asla görmezler. Ayrıntılar: [Gizlilik Politikası].

- [ ] 18 yaşında veya daha büyüğüm.
- [ ] Bu ses benim ve yalnızca kendim için kayıt yapıyorum.
- [ ] Kayıtlarımın ve profil bilgilerimin bu amaçla işlenmesine açıkça rıza veriyorum.
- [ ] Kayıtlarımı istediğim an silebilirim. Silinince yok edilir ve sonraki hiçbir eğitimde kullanılmaz; ama onlarla daha önce eğitilmiş bir model onları unutamaz.
- [ ] Eğitilen model — kayıtlarım asla — hizmet olarak sunulabilir veya yayımlanabilir. Yayımlanmış bir model geri çağrılamaz.

[Kullanım Koşulları]

---

## Kurmancî (wergerandin — NEEDS NATIVE/LEGAL REVIEW)

**Berî ku tu tomar bikî**

Tomarên dengê te daneyên kesane ne. Em wan, bi agahiyên profîla te re (zarava, zayend, koma temenî, herêm), **tenê ji bo perwerdekirin û ceribandina modelên me yên axaftina Kurdî** bi kar tînin. Em wan qet nafiroşin, bi kesî re parve nakin û naweşînin; ji bo teqlîdkirina dengê te, naskirina te an reklamê bi kar naynin. Bexşkerên din guh didin tomarên te da ku wan kontrol bikin, lê navnîşana cuzdana te qet nabînin. Hûrgilî: [Siyaseta Nepeniyê].

- [ ] Ez 18 salî an mezintir im.
- [ ] Ev deng yê min e, û ez tenê ji bo xwe tomar dikim.
- [ ] Ez bi eşkereyî razî me ku tomar û profîla min bi vî awayî bên bikaranîn.
- [ ] Ez dikarim tomarên xwe her dem jê bibim. Wê demê ew tên jêbirin û di tu perwerdeya pêşerojê de nayên bikaranîn; lê modelek ku berê bi wan hatiye perwerdekirin nikare wan ji bîr bike.
- [ ] Modela perwerdekirî — qet ne tomarên min — dikare wekî xizmet bê pêşkêşkirin an bê weşandin. Modelek weşandî nayê paşve kişandin.

[Mercên Bikaranînê]

---

## سۆرانی (وەرگێڕان — NEEDS NATIVE/LEGAL REVIEW)

**پێش ئەوەی تۆمار بکەیت**

تۆمارەکانی دەنگت داتای کەسین. ئێمە ئەوانە لەگەڵ زانیارییەکانی پرۆفایلەکەت (شێوەزار، ڕەگەز، مەودای تەمەن، ناوچە) **تەنها بۆ ڕاهێنان و تاقیکردنەوەی مۆدێلەکانی قسەکردنی کوردیی خۆمان** بەکار دەهێنین. هەرگیز نایانفرۆشین، لەگەڵ کەس بەشیان ناکەین و بڵاویان ناکەینەوە؛ بۆ لاساییکردنەوەی دەنگت، ناسینەوەت یان ڕیکلام بەکاریان ناهێنین. بەخشەرانی تر گوێ لە تۆمارەکانت دەگرن بۆ پشکنینیان، بەڵام هەرگیز ناونیشانی جزدانەکەت نابینن. وردەکاری: [سیاسەتی تایبەتمەندی].

- [ ] من ١٨ ساڵ یان زیاترم.
- [ ] ئەم دەنگە هی خۆمە، و تەنها بۆ خۆم تۆمار دەکەم.
- [ ] بە ئاشکرا ڕەزامەندم کە تۆمار و پرۆفایلەکەم بەم شێوەیە بەکار بهێنرێن.
- [ ] دەتوانم هەر کاتێک تۆمارەکانم بسڕمەوە. ئەوکات دەسڕدرێنەوە و لە هیچ ڕاهێنانێکی داهاتوودا بەکار ناهێنرێن؛ بەڵام مۆدێلێک کە پێشتر پێیان ڕاهێنراوە ناتوانێت لەبیریان بکات.
- [ ] مۆدێلی ڕاهێنراو — هەرگیز تۆمارەکانم نا — دەکرێت وەک خزمەتگوزاری پێشکەش بکرێت یان بڵاو بکرێتەوە. مۆدێلێکی بڵاوکراوە ناکرێت بگەڕێندرێتەوە.

[مەرجەکانی بەکارهێنان]

---

## فارسی (ترجمه — NEEDS NATIVE/LEGAL REVIEW)

**پیش از ضبط**

ضبط‌های صدای شما داده‌های شخصی هستند. ما آن‌ها را همراه با اطلاعات نمایه‌تان (گویش، جنسیت، بازهٔ سنی، منطقه) **فقط برای آموزش و آزمودن مدل‌های گفتار کردیِ خودمان** به کار می‌بریم. هرگز آن‌ها را نمی‌فروشیم، با کسی به اشتراک نمی‌گذاریم و منتشر نمی‌کنیم؛ و برای تقلید صدای شما، شناسایی شما یا تبلیغات از آن‌ها استفاده نمی‌کنیم. اهداکنندگان دیگر برای بررسی، ضبط‌های شما را می‌شنوند، اما هرگز نشانی کیف پول شما را نمی‌بینند. جزئیات: [سیاست حریم خصوصی].

- [ ] من ۱۸ سال یا بیشتر دارم.
- [ ] این صدای خود من است و فقط برای خودم ضبط می‌کنم.
- [ ] صریحاً رضایت می‌دهم که ضبط‌ها و نمایه‌ام به این شکل به کار رود.
- [ ] می‌توانم هر زمان ضبط‌هایم را حذف کنم. در آن صورت پاک می‌شوند و در هیچ آموزش بعدی به کار نمی‌روند؛ اما مدلی که پیش‌تر با آن‌ها آموزش دیده نمی‌تواند آن‌ها را فراموش کند.
- [ ] مدل آموزش‌دیده — و هرگز ضبط‌های من — ممکن است به‌صورت خدمت ارائه یا منتشر شود. مدل منتشرشده را نمی‌توان پس گرفت.

[شرایط استفاده]

---

## العربية (ترجمة — NEEDS NATIVE/LEGAL REVIEW)

**قبل أن تسجّل**

تسجيلات صوتك بيانات شخصية. نستخدمها مع بيانات ملفك (اللهجة، الجنس، الفئة العمرية، المنطقة) **فقط لتدريب نماذجنا الخاصة للكلام الكردي واختبارها**. لا نبيعها ولا نشاركها مع أحد ولا ننشرها أبدًا، ولا نستخدمها لتقليد صوتك أو للتعرّف على هويتك أو للإعلان. يستمع متبرعون آخرون إلى تسجيلاتك للتحقق منها، لكنهم لا يرون عنوان محفظتك أبدًا. التفاصيل: [سياسة الخصوصية].

- [ ] عمري 18 عامًا أو أكثر.
- [ ] هذا صوتي أنا، وأسجّل لنفسي فقط.
- [ ] أوافق صراحةً على استخدام تسجيلاتي وبيانات ملفي على هذا النحو.
- [ ] يمكنني حذف تسجيلاتي في أي وقت. عندها تُمحى ولا تُستخدم في أي تدريب لاحق، لكن النموذج الذي دُرِّب عليها سابقًا لا يستطيع أن ينساها.
- [ ] قد يُقدَّم النموذج المدرَّب — وليس تسجيلاتي أبدًا — كخدمة أو يُنشر. النموذج المنشور لا يمكن استرجاعه.

[شروط الاستخدام]

---

## Why each box exists (drafting rationale)

| Box | Legal function |
|---|---|
| 18+ | Minors excluded (GDPR Art. 8 is not relied on; consent from minors to special-category processing is avoided entirely). |
| Own voice | Prevents processing of a third party's voice without their consent; supports the donor warranty in Terms §5.2. |
| Explicit consent | The Art. 9(2)(a) GDPR / KVKK Art. 6 explicit consent: a separate, affirmative, specific statement. The paragraph above names the purpose, the data, and the disclosure to peer reviewers. |
| Deletion + unlearning | Art. 7(3) information that withdrawal is possible, plus a plain disclosure of its limit. This makes the consent *informed* about the one thing deletion cannot do. |
| Model service/release | Discloses the downstream use of models and that release cannot be undone. It covers model weights without promising more than can be kept. See notes Q7 for the "optional box" alternative. |
