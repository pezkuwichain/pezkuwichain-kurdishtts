/* KurdîTV shared i18n — 6 languages (en, ku=Soranî, kmr=Kurmancî, tr, fa, ar).
   Standard mirrors pezkuwichain-landing. Three RTL locales: ku, fa, ar. */
(function () {
  "use strict";

  var KURD_FLAG = "/static/kurdistan.svg";
  var LANGS = [
    { code: "en",  name: "English",        flag: "🇬🇧", dir: "ltr" },
    { code: "ku",  name: "کوردیی سۆرانی",  flag: "", flagImg: KURD_FLAG, dir: "rtl" },
    { code: "kmr", name: "Kurmancî",       flag: "", flagImg: KURD_FLAG, dir: "ltr" },
    { code: "tr",  name: "Türkçe",         flag: "🇹🇷", dir: "ltr" },
    { code: "fa",  name: "فارسی",          flag: "🇮🇷", dir: "rtl" },
    { code: "ar",  name: "العربية",        flag: "🌍", dir: "rtl" }
  ];
  function flagHtml(conf) {
    return conf.flagImg
      ? '<img class="fimg" src="' + conf.flagImg + '" alt="" />'
      : '<span>' + conf.flag + '</span>';
  }

  var I18N = {
    en: {
      brand_sub: "Kurdish Auto-Dubbing",
      nav_create: "Create videos", nav_contribute: "Contribute", nav_apps: "Go to apps",
      foot_back: "← Back to dubbing",
      dub_hero_1: "Dub any video into", dub_hero_hl: "Kurdish",
      dub_hero_p: "Upload audio or video in any language and get a Kurdish voice-over — transcribed with Whisper, translated with NLLB and spoken with Meta MMS.",
      dub_step1: "1 · Your file",
      dub_drop_b: "Drop a file or click to browse",
      dub_drop_s: "Video or audio, any language · max {mb} MB · up to {sec}s",
      dub_step2: "2 · Kurdish dialect",
      dia_kmr_t: "Kurmancî", dia_kmr_s: "Northern · Latin script",
      dia_ckb_t: "Soranî", dia_ckb_s: "Central · Arabic script",
      dub_go: "Dub into Kurdish", dub_working: "Working…",
      dub_cpu_note: "CPU-only — this can take a few minutes for longer clips.",
      dub_result: "Your Kurdish dub", dub_dl: "Download", dub_again: "Dub another",
      dub_transcript: "Show transcript & translation",
      js_uploading: "Uploading…", js_starting: "Starting…", js_working: "Working…",
      js_upload_failed: "Upload failed.", js_upload_rejected: "Upload rejected.",
      js_processing_failed: "Processing failed.", js_from: "from",
      p_queued: "Queued…", p_starting: "Starting…", p_extracting: "Extracting audio…",
      p_transcribing: "Transcribing…", p_translating: "Translating to Kurdish…",
      p_synthesizing: "Synthesizing Kurdish voice…", p_aligning: "Aligning & mixing audio…",
      p_rendering: "Rendering final video…", p_done: "Done.",
      p_sending_veo: "Sending to Veo…", p_generating: "Generating video…", p_downloading: "Downloading…",
      c_hero_1: "Build Kurdish AI", c_hero_hl: "together",
      c_hero_p: "This is a non-profit, community project for the Kurdish language. Lend your voice to train the text-to-speech engine, or support development with HEZ.",
      c_voice_badge: "VOICE", c_voice_title: "Donate your voice",
      c_voice_sub: "Read the Kurdish sentence below out loud and record (or upload) it. Your recordings help us build better, more natural Kurdish voices. By submitting you allow us to use the recording to train and improve the TTS models.",
      c_read_label: "Read this aloud", c_another: "↻ Another sentence",
      c_snum: "Sentence {n} of {total}",
      c_name_label: "Your name or alias", c_optional: "(optional)",
      c_name_ph: "e.g. Azad from Amed", c_rec_label: "Record or upload",
      c_record: "Record", c_stop: "Stop", c_upload: "⬆ Upload audio", c_or: "or",
      c_submit: "Submit recording", c_uploading: "Uploading…",
      c_ok: "🙏 Spas! Your voice was received. Record another sentence to help even more.",
      c_mic_denied: "Microphone access denied. You can upload a file instead.",
      c_upload_failed: "Upload failed",
      c_hez_badge: "HEZ", c_hez_title: "Support development",
      c_hez_sub: "Servers, GPUs and model training cost money. Send HEZ to help keep KurdîTV free and growing. This address belongs to the project development fund.",
      c_hez_label: "HEZ / Pezkuwichain address", c_copy: "Copy", c_copied: "Copied ✓",
      c_net1: "Network: Pezkuwichain (SS58)", c_net2: "Token: HEZ",
      c_net3: "Every contribution funds free Kurdish AI",
      c_wallet: "Download Pezkuwi Wallet", c_wallet_sub: "Hold HEZ on your phone — on Google Play",
      c_ext: "Get the Pezkuwi Extension", c_ext_sub: "Browser wallet — on the Chrome Web Store",
      v_hero_1: "Create a video from an", v_hero_hl: "image + prompt",
      v_hero_p: "Upload a picture (optional) and describe the scene. Our AI turns it into a short video for you. Generation usually takes 1–3 minutes.",
      v_img_label: "Image", v_img_opt: "(optional — animates your picture)",
      v_drop_b: "Drop an image or click to browse", v_drop_s: "PNG, JPG or WEBP · up to 12 MB",
      v_prompt_label: "Prompt",
      v_prompt_ph: "Describe the video — e.g. 'A Kurdish shepherd walking through green mountains at sunrise, camera slowly panning, cinematic.'",
      v_hint: "Tip: mention motion, camera movement, lighting and mood for the best results.",
      v_aspect_label: "Aspect ratio", v_land: "Landscape", v_vert: "Vertical / Reels",
      v_go: "✨ Generate video", v_sending: "Sending to Veo…",
      v_render_note: "Veo is rendering your video. You can keep this tab open — it takes a couple of minutes.",
      v_dl: "⬇ Download", v_again: "Create another",
      v_err_prompt: "Please write a prompt describing the video.",
      v_err_img: "Image must be PNG, JPG or WEBP.",
      v_working: "Working…", v_lost: "Lost the job.", v_gen_failed: "Generation failed.",
      v_starting: "Starting…"
    },

    ku: {
      brand_sub: "دۆبلاژی خۆکاری کوردی",
      nav_create: "دروستکردنی ڤیدیۆ", nav_contribute: "بەشداری بکە", nav_apps: "بڕۆ بۆ ئەپەکان",
      foot_back: "← گەڕانەوە بۆ دۆبلاژ",
      dub_hero_1: "هەر ڤیدیۆیەک دۆبلاژ بکە بۆ", dub_hero_hl: "کوردی",
      dub_hero_p: "دەنگ یان ڤیدیۆ بە هەر زمانێک باربکە و دەنگگێڕانی کوردی وەربگرە — بە Whisper نووسراوەتەوە، بە NLLB وەرگێڕدراوە و بە Meta MMS قسە دەکرێت.",
      dub_step1: "١ · فایلەکەت",
      dub_drop_b: "فایلێک دابنێ یان کلیک بکە بۆ هەڵبژاردن",
      dub_drop_s: "ڤیدیۆ یان دەنگ، هەر زمانێک · زۆرترین {mb} MB · تا {sec} چرکە",
      dub_step2: "٢ · شێوەزاری کوردی",
      dia_kmr_t: "کورمانجی", dia_kmr_s: "باکوور · ئەلفوبێی لاتینی",
      dia_ckb_t: "سۆرانی", dia_ckb_s: "ناوەند · ئەلفوبێی عەرەبی",
      dub_go: "دۆبلاژ بکە بۆ کوردی", dub_working: "کار دەکات…",
      dub_cpu_note: "تەنها CPU — بۆ کلیپی درێژتر چەند خولەکێک دەخایەنێت.",
      dub_result: "دۆبلاژە کوردییەکەت", dub_dl: "داگرتن", dub_again: "دۆبلاژێکی تر",
      dub_transcript: "پیشاندانی دەق و وەرگێڕان",
      js_uploading: "بارکردن…", js_starting: "دەستپێکردن…", js_working: "کار دەکات…",
      js_upload_failed: "بارکردن سەرکەوتوو نەبوو.", js_upload_rejected: "بارکردن ڕەتکرایەوە.",
      js_processing_failed: "پرۆسێسکردن سەرکەوتوو نەبوو.", js_from: "لە",
      p_queued: "لە ڕیزدا…", p_starting: "دەستپێکردن…", p_extracting: "دەرهێنانی دەنگ…",
      p_transcribing: "نووسینەوەی دەنگ…", p_translating: "وەرگێڕان بۆ کوردی…",
      p_synthesizing: "دروستکردنی دەنگی کوردی…", p_aligning: "ڕێکخستن و تێکەڵکردنی دەنگ…",
      p_rendering: "ئامادەکردنی ڤیدیۆی کۆتایی…", p_done: "تەواو بوو.",
      p_sending_veo: "ناردن بۆ Veo…", p_generating: "دروستکردنی ڤیدیۆ…", p_downloading: "داگرتن…",
      c_hero_1: "زیرەکی دەستکردی کوردی دروست بکەین", c_hero_hl: "پێکەوە",
      c_hero_p: "ئەمە پڕۆژەیەکی کۆمەڵایەتی و بێ قازانجە بۆ زمانی کوردی. دەنگت ببەخشە بۆ ڕاهێنانی بزوێنەری دەنگ، یان بە HEZ پاڵپشتی گەشەپێدان بکە.",
      c_voice_badge: "دەنگ", c_voice_title: "دەنگت ببەخشە",
      c_voice_sub: "ڕستە کوردییەکەی خوارەوە بە دەنگی بەرز بخوێنەوە و تۆماری بکە (یان باری بکە). تۆمارەکانت یارمەتیمان دەدەن دەنگی کوردی باشتر و سروشتیتر دروست بکەین. بە ناردنی، ڕێگەمان دەدەیت تۆمارەکە بۆ ڕاهێنان و باشترکردنی مۆدێلەکان بەکاربهێنین.",
      c_read_label: "ئەمە بە دەنگی بەرز بخوێنەوە", c_another: "↻ ڕستەیەکی تر",
      c_snum: "ڕستەی {n} لە {total}",
      c_name_label: "ناو یان نازناوت", c_optional: "(ئارەزوومەندانە)",
      c_name_ph: "نموونە: ئازاد لە ئامەد", c_rec_label: "تۆمار بکە یان باری بکە",
      c_record: "تۆمار", c_stop: "وەستان", c_upload: "⬆ بارکردنی دەنگ", c_or: "یان",
      c_submit: "ناردنی تۆمار", c_uploading: "بارکردن…",
      c_ok: "🙏 سوپاس! دەنگت وەرگیرا. ڕستەیەکی تر تۆمار بکە بۆ یارمەتی زیاتر.",
      c_mic_denied: "ڕێگە بە مایکرۆفۆن نەدرا. دەتوانیت لەجیاتی فایلێک باربکەیت.",
      c_upload_failed: "بارکردن سەرکەوتوو نەبوو",
      c_hez_badge: "HEZ", c_hez_title: "پاڵپشتی گەشەپێدان",
      c_hez_sub: "سێرڤەر، GPU و ڕاهێنانی مۆدێل پارەی دەوێت. HEZ بنێرە بۆ ئەوەی KurdîTV بەخۆڕایی و گەشەسەندوو بمێنێتەوە. ئەم ناونیشانە هی سندوقی گەشەپێدانی پڕۆژەیە.",
      c_hez_label: "ناونیشانی HEZ / Pezkuwichain", c_copy: "کۆپی", c_copied: "کۆپی کرا ✓",
      c_net1: "تۆڕ: Pezkuwichain (SS58)", c_net2: "تۆکن: HEZ",
      c_net3: "هەر بەخشینێک زیرەکی کوردی بەخۆڕایی دەخوازێت",
      c_wallet: "جزدانی Pezkuwi دابگرە", c_wallet_sub: "HEZ لەسەر مۆبایلەکەت — لە Google Play",
      c_ext: "ئێکستێنشنی Pezkuwi دابگرە", c_ext_sub: "جزدانی وێبگەڕ — لە Chrome Web Store",
      v_hero_1: "ڤیدیۆیەک دروست بکە لە", v_hero_hl: "وێنە + داواکاری",
      v_hero_p: "وێنەیەک باربکە (ئارەزوومەندانە) و دیمەنەکە باس بکە. زیرەکی دەستکردمان دەیکات بە ڤیدیۆیەکی کورت. دروستکردن زۆرجار ١–٣ خولەک دەخایەنێت.",
      v_img_label: "وێنە", v_img_opt: "(ئارەزوومەندانە — وێنەکەت جوڵە پێدەکات)",
      v_drop_b: "وێنەیەک دابنێ یان کلیک بکە", v_drop_s: "PNG، JPG یان WEBP · تا ١٢ MB",
      v_prompt_label: "داواکاری",
      v_prompt_ph: "ڤیدیۆکە باس بکە — نموونە: 'شوانێکی کورد بەناو چیای سەوزدا لە کاتی بەرەبەیان دەڕوات، کامێرا بەهێواشی دەسوڕێتەوە، سینەمایی.'",
      v_hint: "ئامۆژگاری: بۆ باشترین ئەنجام، جوڵە، جوڵەی کامێرا، ڕووناکی و کەشوهەوا باس بکە.",
      v_aspect_label: "ڕێژەی ڕووکار", v_land: "پانیی", v_vert: "ستوونی / ڕیلز",
      v_go: "✨ دروستکردنی ڤیدیۆ", v_sending: "دەنێردرێت بۆ Veo…",
      v_render_note: "Veo ڤیدیۆکەت دروست دەکات. دەتوانیت ئەم تابە بکەیتەوە — چەند خولەکێک دەخایەنێت.",
      v_dl: "⬇ داگرتن", v_again: "دروستکردنی یەکێکی تر",
      v_err_prompt: "تکایە داواکارییەک بنووسە کە ڤیدیۆکە باس بکات.",
      v_err_img: "وێنە دەبێت PNG، JPG یان WEBP بێت.",
      v_working: "کار دەکات…", v_lost: "کارەکە ون بوو.", v_gen_failed: "دروستکردن سەرکەوتوو نەبوو.",
      v_starting: "دەستپێکردن…"
    },

    kmr: {
      brand_sub: "Dûblajkirina Kurdî ya Xweber",
      nav_create: "Vîdyoyan çêke", nav_contribute: "Beşdar bibe", nav_apps: "Biçe sepanan",
      foot_back: "← Vegere dûblajê",
      dub_hero_1: "Her vîdyoyê dûblaj bike bo", dub_hero_hl: "Kurdî",
      dub_hero_p: "Deng an vîdyoyê bi her zimanî bar bike û dengê Kurdî bistîne — bi Whisper hatiye nivîsîn, bi NLLB hatiye wergerandin û bi Meta MMS tê axaftin.",
      dub_step1: "1 · Pelê te",
      dub_drop_b: "Pelekê dakêşe an bitikîne bo hilbijartinê",
      dub_drop_s: "Vîdyo an deng, her ziman · herî zêde {mb} MB · heta {sec} ç",
      dub_step2: "2 · Zaravayê Kurdî",
      dia_kmr_t: "Kurmancî", dia_kmr_s: "Bakur · Tîpên Latînî",
      dia_ckb_t: "Soranî", dia_ckb_s: "Navend · Tîpên Erebî",
      dub_go: "Dûblaj bike bo Kurdî", dub_working: "Dixebite…",
      dub_cpu_note: "Tenê CPU — ji bo klîpên dirêjtir dikare çend deqîqe bigire.",
      dub_result: "Dûblaja te ya Kurdî", dub_dl: "Daxe", dub_again: "Yekî din dûblaj bike",
      dub_transcript: "Nivîs û wergerê nîşan bide",
      js_uploading: "Tê barkirin…", js_starting: "Destpêkirin…", js_working: "Dixebite…",
      js_upload_failed: "Barkirin têk çû.", js_upload_rejected: "Barkirin hat redkirin.",
      js_processing_failed: "Pêvajo têk çû.", js_from: "ji",
      p_queued: "Di rêzê de…", p_starting: "Destpêkirin…", p_extracting: "Deng tê derxistin…",
      p_transcribing: "Nivîsandina deng…", p_translating: "Werger bo Kurdî…",
      p_synthesizing: "Çêkirina dengê Kurdî…", p_aligning: "Rêkxistin û tevlihevkirina deng…",
      p_rendering: "Amadekirina vîdyoya dawî…", p_done: "Qediya.",
      p_sending_veo: "Tê şandin bo Veo…", p_generating: "Vîdyo tê çêkirin…", p_downloading: "Tê daxistin…",
      c_hero_1: "Em zîrekiya Kurdî ava bikin", c_hero_hl: "bi hev re",
      c_hero_p: "Ev projeyeke civakî û bê qezenc e ji bo zimanê Kurdî. Dengê xwe bibexşe ji bo perwerdekirina motora dengî, an bi HEZ piştgiriya pêşxistinê bike.",
      c_voice_badge: "DENG", c_voice_title: "Dengê xwe bibexşe",
      c_voice_sub: "Hevoka Kurdî ya jêrîn bi dengekî bilind bixwîne û tomar bike (an bar bike). Tomarên te alîkariya me dikin ku em dengên Kurdî baştir û xwezayîtir ava bikin. Bi şandinê, tu destûrê didî me ku tomarê ji bo perwerde û baştirkirina modelan bi kar bînin.",
      c_read_label: "Vê bi dengekî bilind bixwîne", c_another: "↻ Hevokeke din",
      c_snum: "Hevok {n} ji {total}",
      c_name_label: "Nav an navê te yê veşartî", c_optional: "(bi dilxwazî)",
      c_name_ph: "mînak: Azad ji Amedê", c_rec_label: "Tomar bike an bar bike",
      c_record: "Tomar", c_stop: "Rawestîne", c_upload: "⬆ Deng bar bike", c_or: "an",
      c_submit: "Tomarê bişîne", c_uploading: "Tê barkirin…",
      c_ok: "🙏 Spas! Dengê te hat girtin. Hevokeke din tomar bike ji bo alîkariya zêdetir.",
      c_mic_denied: "Destûr ji mîkrofonê re nehat dayîn. Tu dikarî li şûna wê pelekê bar bikî.",
      c_upload_failed: "Barkirin têk çû",
      c_hez_badge: "HEZ", c_hez_title: "Piştgiriya pêşxistinê",
      c_hez_sub: "Server, GPU û perwerdekirina modelan pere dixwazin. HEZ bişîne da ku KurdîTV belaş û geşbûyî bimîne. Ev navnîşan ji sindoqa pêşxistinê ya projeyê ye.",
      c_hez_label: "Navnîşana HEZ / Pezkuwichain", c_copy: "Kopî bike", c_copied: "Hat kopîkirin ✓",
      c_net1: "Tor: Pezkuwichain (SS58)", c_net2: "Token: HEZ",
      c_net3: "Her bexşîn zîrekiya Kurdî ya belaş fînanse dike",
      c_wallet: "Pezkuwi Wallet daxe", c_wallet_sub: "HEZ li ser telefona te — li Google Play",
      c_ext: "Pezkuwi Extension bistîne", c_ext_sub: "Berdesteya gerokê — li Chrome Web Store",
      v_hero_1: "Vîdyoyekê çêke ji", v_hero_hl: "wêne + daxwaz",
      v_hero_p: "Wêneyekê bar bike (bi dilxwazî) û dîmenê rave bike. Zîrekiya me ya çêkirî wê dike vîdyoyeke kurt. Çêkirin bi gelemperî 1–3 deqîqe digire.",
      v_img_label: "Wêne", v_img_opt: "(bi dilxwazî — wêneyê te tevdigerîne)",
      v_drop_b: "Wêneyekê dakêşe an bitikîne", v_drop_s: "PNG, JPG an WEBP · heta 12 MB",
      v_prompt_label: "Daxwaz",
      v_prompt_ph: "Vîdyoyê rave bike — mînak: 'Şivanekî Kurd di çiyayên kesk de li berbangê dimeşe, kamera hêdî hêdî dizivire, sînemayî.'",
      v_hint: "Şîret: ji bo encamên çêtirîn, tevger, livîna kamerayê, ronahî û rewşê rave bike.",
      v_aspect_label: "Rêjeya dirêjî-firehî", v_land: "Berwar", v_vert: "Stûnî / Reels",
      v_go: "✨ Vîdyoyê çêke", v_sending: "Tê şandin bo Veo…",
      v_render_note: "Veo vîdyoya te çêdike. Tu dikarî vê tabê vekirî bihêlî — çend deqîqe digire.",
      v_dl: "⬇ Daxe", v_again: "Yekî din çêke",
      v_err_prompt: "Ji kerema xwe daxwazekê binivîse ku vîdyoyê rave dike.",
      v_err_img: "Wêne divê PNG, JPG an WEBP be.",
      v_working: "Dixebite…", v_lost: "Kar winda bû.", v_gen_failed: "Çêkirin têk çû.",
      v_starting: "Destpêkirin…"
    },

    tr: {
      brand_sub: "Kürtçe Otomatik Dublaj",
      nav_create: "Video oluştur", nav_contribute: "Katkıda bulun", nav_apps: "Uygulamalara git",
      foot_back: "← Dublaja dön",
      dub_hero_1: "Herhangi bir videoyu", dub_hero_hl: "Kürtçeye",
      dub_hero_p: "Herhangi bir dilde ses veya video yükleyin, Kürtçe seslendirme alın — Whisper ile yazıya döküldü, NLLB ile çevrildi ve Meta MMS ile seslendirildi.",
      dub_step1: "1 · Dosyanız",
      dub_drop_b: "Dosya bırakın veya seçmek için tıklayın",
      dub_drop_s: "Video veya ses, her dil · en fazla {mb} MB · {sec} sn'ye kadar",
      dub_step2: "2 · Kürtçe lehçesi",
      dia_kmr_t: "Kurmancî", dia_kmr_s: "Kuzey · Latin alfabesi",
      dia_ckb_t: "Soranî", dia_ckb_s: "Merkez · Arap alfabesi",
      dub_go: "Kürtçeye dublajla", dub_working: "Çalışıyor…",
      dub_cpu_note: "Yalnızca CPU — uzun klipler birkaç dakika sürebilir.",
      dub_result: "Kürtçe dublajınız", dub_dl: "İndir", dub_again: "Yeni dublaj",
      dub_transcript: "Metin ve çeviriyi göster",
      js_uploading: "Yükleniyor…", js_starting: "Başlatılıyor…", js_working: "Çalışıyor…",
      js_upload_failed: "Yükleme başarısız.", js_upload_rejected: "Yükleme reddedildi.",
      js_processing_failed: "İşleme başarısız.", js_from: "kaynak",
      p_queued: "Sırada…", p_starting: "Başlatılıyor…", p_extracting: "Ses çıkarılıyor…",
      p_transcribing: "Sese metne dönüştürülüyor…", p_translating: "Kürtçeye çevriliyor…",
      p_synthesizing: "Kürtçe ses sentezleniyor…", p_aligning: "Ses hizalanıyor ve karıştırılıyor…",
      p_rendering: "Son video oluşturuluyor…", p_done: "Tamamlandı.",
      p_sending_veo: "Veo'ya gönderiliyor…", p_generating: "Video oluşturuluyor…", p_downloading: "İndiriliyor…",
      c_hero_1: "Kürtçe yapay zekâyı", c_hero_hl: "birlikte inşa edelim",
      c_hero_p: "Bu, Kürt dili için kâr amacı gütmeyen bir topluluk projesidir. Metin-konuşma motorunu eğitmek için sesinizi bağışlayın veya HEZ ile geliştirmeyi destekleyin.",
      c_voice_badge: "SES", c_voice_title: "Sesinizi bağışlayın",
      c_voice_sub: "Aşağıdaki Kürtçe cümleyi yüksek sesle okuyup kaydedin (veya yükleyin). Kayıtlarınız daha iyi ve doğal Kürtçe sesler oluşturmamıza yardımcı olur. Göndererek, kaydı modelleri eğitmek ve geliştirmek için kullanmamıza izin vermiş olursunuz.",
      c_read_label: "Bunu yüksek sesle okuyun", c_another: "↻ Başka cümle",
      c_snum: "Cümle {n} / {total}",
      c_name_label: "Adınız veya takma adınız", c_optional: "(isteğe bağlı)",
      c_name_ph: "örn. Amed'den Azad", c_rec_label: "Kaydedin veya yükleyin",
      c_record: "Kaydet", c_stop: "Durdur", c_upload: "⬆ Ses yükle", c_or: "veya",
      c_submit: "Kaydı gönder", c_uploading: "Yükleniyor…",
      c_ok: "🙏 Spas! Sesiniz alındı. Daha fazla yardım için başka bir cümle kaydedin.",
      c_mic_denied: "Mikrofon erişimi reddedildi. Bunun yerine bir dosya yükleyebilirsiniz.",
      c_upload_failed: "Yükleme başarısız",
      c_hez_badge: "HEZ", c_hez_title: "Geliştirmeyi destekleyin",
      c_hez_sub: "Sunucular, GPU'lar ve model eğitimi para gerektirir. KurdîTV'nin ücretsiz ve gelişen kalması için HEZ gönderin. Bu adres proje geliştirme fonuna aittir.",
      c_hez_label: "HEZ / Pezkuwichain adresi", c_copy: "Kopyala", c_copied: "Kopyalandı ✓",
      c_net1: "Ağ: Pezkuwichain (SS58)", c_net2: "Token: HEZ",
      c_net3: "Her katkı ücretsiz Kürtçe yapay zekâyı finanse eder",
      c_wallet: "Pezkuwi Cüzdanını indir", c_wallet_sub: "HEZ'i cebinde taşı — Google Play'de",
      c_ext: "Pezkuwi Uzantısını edin", c_ext_sub: "Tarayıcı cüzdanı — Chrome Web Store'da",
      v_hero_1: "Bir görsel ve istemle", v_hero_hl: "video oluşturun",
      v_hero_p: "Bir resim yükleyin (isteğe bağlı) ve sahneyi anlatın. Yapay zekâmız bunu sizin için kısa bir videoya dönüştürür. Oluşturma genellikle 1–3 dakika sürer.",
      v_img_label: "Görsel", v_img_opt: "(isteğe bağlı — resminizi hareketlendirir)",
      v_drop_b: "Görsel bırakın veya tıklayın", v_drop_s: "PNG, JPG veya WEBP · en fazla 12 MB",
      v_prompt_label: "İstem",
      v_prompt_ph: "Videoyu anlatın — örn. 'Gün doğumunda yeşil dağlarda yürüyen bir Kürt çoban, kamera yavaşça kayıyor, sinematik.'",
      v_hint: "İpucu: en iyi sonuç için hareket, kamera hareketi, ışık ve atmosferi belirtin.",
      v_aspect_label: "En boy oranı", v_land: "Yatay", v_vert: "Dikey / Reels",
      v_go: "✨ Video oluştur", v_sending: "Veo'ya gönderiliyor…",
      v_render_note: "Veo videonuzu oluşturuyor. Bu sekmeyi açık tutabilirsiniz — birkaç dakika sürer.",
      v_dl: "⬇ İndir", v_again: "Yeni oluştur",
      v_err_prompt: "Lütfen videoyu anlatan bir istem yazın.",
      v_err_img: "Görsel PNG, JPG veya WEBP olmalıdır.",
      v_working: "Çalışıyor…", v_lost: "İş kaybedildi.", v_gen_failed: "Oluşturma başarısız.",
      v_starting: "Başlatılıyor…"
    },

    fa: {
      brand_sub: "دوبله خودکار کردی",
      nav_create: "ساخت ویدیو", nav_contribute: "مشارکت", nav_apps: "رفتن به برنامه‌ها",
      foot_back: "← بازگشت به دوبله",
      dub_hero_1: "هر ویدیویی را دوبله کنید به", dub_hero_hl: "کردی",
      dub_hero_p: "صدا یا ویدیو را به هر زبانی بارگذاری کنید و صداگذاری کردی دریافت کنید — با Whisper رونویسی، با NLLB ترجمه و با Meta MMS گفته می‌شود.",
      dub_step1: "۱ · فایل شما",
      dub_drop_b: "فایلی را رها کنید یا برای انتخاب کلیک کنید",
      dub_drop_s: "ویدیو یا صدا، هر زبانی · حداکثر {mb} مگابایت · تا {sec} ثانیه",
      dub_step2: "۲ · گویش کردی",
      dia_kmr_t: "کرمانجی", dia_kmr_s: "شمالی · خط لاتین",
      dia_ckb_t: "سورانی", dia_ckb_s: "مرکزی · خط عربی",
      dub_go: "دوبله به کردی", dub_working: "در حال کار…",
      dub_cpu_note: "فقط CPU — برای کلیپ‌های بلندتر ممکن است چند دقیقه طول بکشد.",
      dub_result: "دوبله کردی شما", dub_dl: "دانلود", dub_again: "دوبله دیگر",
      dub_transcript: "نمایش متن و ترجمه",
      js_uploading: "در حال بارگذاری…", js_starting: "در حال شروع…", js_working: "در حال کار…",
      js_upload_failed: "بارگذاری ناموفق بود.", js_upload_rejected: "بارگذاری رد شد.",
      js_processing_failed: "پردازش ناموفق بود.", js_from: "از",
      p_queued: "در صف…", p_starting: "در حال شروع…", p_extracting: "در حال استخراج صدا…",
      p_transcribing: "در حال رونویسی صدا…", p_translating: "در حال ترجمه به کردی…",
      p_synthesizing: "در حال ساخت صدای کردی…", p_aligning: "در حال هم‌ترازی و میکس صدا…",
      p_rendering: "در حال ساخت ویدیوی نهایی…", p_done: "انجام شد.",
      p_sending_veo: "در حال ارسال به Veo…", p_generating: "در حال ساخت ویدیو…", p_downloading: "در حال دانلود…",
      c_hero_1: "هوش مصنوعی کردی را بسازیم", c_hero_hl: "با هم",
      c_hero_p: "این یک پروژه اجتماعی و غیرانتفاعی برای زبان کردی است. صدای خود را برای آموزش موتور گفتار اهدا کنید یا با HEZ از توسعه پشتیبانی کنید.",
      c_voice_badge: "صدا", c_voice_title: "صدای خود را اهدا کنید",
      c_voice_sub: "جمله کردی زیر را با صدای بلند بخوانید و ضبط کنید (یا بارگذاری کنید). ضبط‌های شما به ما کمک می‌کند صداهای کردی بهتر و طبیعی‌تری بسازیم. با ارسال، به ما اجازه می‌دهید از ضبط برای آموزش و بهبود مدل‌ها استفاده کنیم.",
      c_read_label: "این را با صدای بلند بخوانید", c_another: "↻ جمله دیگر",
      c_snum: "جمله {n} از {total}",
      c_name_label: "نام یا نام مستعار شما", c_optional: "(اختیاری)",
      c_name_ph: "مثلاً آزاد از آمد", c_rec_label: "ضبط کنید یا بارگذاری کنید",
      c_record: "ضبط", c_stop: "توقف", c_upload: "⬆ بارگذاری صدا", c_or: "یا",
      c_submit: "ارسال ضبط", c_uploading: "در حال بارگذاری…",
      c_ok: "🙏 سپاس! صدای شما دریافت شد. برای کمک بیشتر جمله دیگری ضبط کنید.",
      c_mic_denied: "دسترسی به میکروفون رد شد. می‌توانید به جای آن یک فایل بارگذاری کنید.",
      c_upload_failed: "بارگذاری ناموفق بود",
      c_hez_badge: "HEZ", c_hez_title: "از توسعه پشتیبانی کنید",
      c_hez_sub: "سرورها، GPUها و آموزش مدل هزینه دارند. HEZ بفرستید تا KurdîTV رایگان و در حال رشد بماند. این آدرس متعلق به صندوق توسعه پروژه است.",
      c_hez_label: "آدرس HEZ / Pezkuwichain", c_copy: "کپی", c_copied: "کپی شد ✓",
      c_net1: "شبکه: Pezkuwichain (SS58)", c_net2: "توکن: HEZ",
      c_net3: "هر مشارکت، هوش مصنوعی کردی رایگان را تأمین می‌کند",
      c_wallet: "دانلود کیف‌پول Pezkuwi", c_wallet_sub: "HEZ را روی گوشی خود نگه دارید — در Google Play",
      c_ext: "افزونه Pezkuwi را دریافت کنید", c_ext_sub: "کیف‌پول مرورگر — در Chrome Web Store",
      v_hero_1: "یک ویدیو بسازید از", v_hero_hl: "تصویر + متن",
      v_hero_p: "یک تصویر بارگذاری کنید (اختیاری) و صحنه را توصیف کنید. هوش مصنوعی ما آن را به یک ویدیوی کوتاه تبدیل می‌کند. ساخت معمولاً ۱ تا ۳ دقیقه طول می‌کشد.",
      v_img_label: "تصویر", v_img_opt: "(اختیاری — تصویر شما را متحرک می‌کند)",
      v_drop_b: "تصویری را رها کنید یا کلیک کنید", v_drop_s: "PNG، JPG یا WEBP · تا ۱۲ مگابایت",
      v_prompt_label: "متن",
      v_prompt_ph: "ویدیو را توصیف کنید — مثلاً: 'چوپانی کرد در کوه‌های سبز هنگام طلوع آفتاب راه می‌رود، دوربین آرام می‌چرخد، سینمایی.'",
      v_hint: "نکته: برای بهترین نتیجه، حرکت، حرکت دوربین، نور و حال‌وهوا را ذکر کنید.",
      v_aspect_label: "نسبت ابعاد", v_land: "افقی", v_vert: "عمودی / ریلز",
      v_go: "✨ ساخت ویدیو", v_sending: "در حال ارسال به Veo…",
      v_render_note: "Veo در حال ساخت ویدیوی شماست. می‌توانید این تب را باز نگه دارید — چند دقیقه طول می‌کشد.",
      v_dl: "⬇ دانلود", v_again: "ساخت دیگری",
      v_err_prompt: "لطفاً متنی بنویسید که ویدیو را توصیف کند.",
      v_err_img: "تصویر باید PNG، JPG یا WEBP باشد.",
      v_working: "در حال کار…", v_lost: "کار گم شد.", v_gen_failed: "ساخت ناموفق بود.",
      v_starting: "در حال شروع…"
    },

    ar: {
      brand_sub: "الدبلجة الكردية التلقائية",
      nav_create: "إنشاء فيديو", nav_contribute: "ساهم", nav_apps: "اذهب إلى التطبيقات",
      foot_back: "← العودة إلى الدبلجة",
      dub_hero_1: "دبلج أي فيديو إلى", dub_hero_hl: "الكردية",
      dub_hero_p: "ارفع صوتًا أو فيديو بأي لغة واحصل على تعليق صوتي كردي — منسوخ بـ Whisper، ومترجم بـ NLLB، ومنطوق بـ Meta MMS.",
      dub_step1: "١ · ملفك",
      dub_drop_b: "أفلت ملفًا أو انقر للتصفح",
      dub_drop_s: "فيديو أو صوت، أي لغة · بحد أقصى {mb} ميجابايت · حتى {sec} ثانية",
      dub_step2: "٢ · اللهجة الكردية",
      dia_kmr_t: "الكرمانجية", dia_kmr_s: "الشمالية · الأبجدية اللاتينية",
      dia_ckb_t: "السورانية", dia_ckb_s: "الوسطى · الأبجدية العربية",
      dub_go: "دبلج إلى الكردية", dub_working: "جارٍ العمل…",
      dub_cpu_note: "وحدة المعالجة فقط — قد يستغرق المقاطع الأطول بضع دقائق.",
      dub_result: "دبلجتك الكردية", dub_dl: "تنزيل", dub_again: "دبلجة أخرى",
      dub_transcript: "إظهار النص والترجمة",
      js_uploading: "جارٍ الرفع…", js_starting: "جارٍ البدء…", js_working: "جارٍ العمل…",
      js_upload_failed: "فشل الرفع.", js_upload_rejected: "تم رفض الرفع.",
      js_processing_failed: "فشلت المعالجة.", js_from: "من",
      p_queued: "في قائمة الانتظار…", p_starting: "جارٍ البدء…", p_extracting: "جارٍ استخراج الصوت…",
      p_transcribing: "جارٍ تحويل الصوت إلى نص…", p_translating: "جارٍ الترجمة إلى الكردية…",
      p_synthesizing: "جارٍ توليد الصوت الكردي…", p_aligning: "جارٍ محاذاة ومزج الصوت…",
      p_rendering: "جارٍ إنشاء الفيديو النهائي…", p_done: "تم.",
      p_sending_veo: "جارٍ الإرسال إلى Veo…", p_generating: "جارٍ إنشاء الفيديو…", p_downloading: "جارٍ التنزيل…",
      c_hero_1: "لنبنِ الذكاء الاصطناعي الكردي", c_hero_hl: "معًا",
      c_hero_p: "هذا مشروع مجتمعي غير ربحي للغة الكردية. تبرّع بصوتك لتدريب محرك تحويل النص إلى كلام، أو ادعم التطوير بـ HEZ.",
      c_voice_badge: "صوت", c_voice_title: "تبرّع بصوتك",
      c_voice_sub: "اقرأ الجملة الكردية أدناه بصوت عالٍ وسجّلها (أو ارفعها). تساعدنا تسجيلاتك على بناء أصوات كردية أفضل وأكثر طبيعية. بالإرسال، تسمح لنا باستخدام التسجيل لتدريب النماذج وتحسينها.",
      c_read_label: "اقرأ هذا بصوت عالٍ", c_another: "↻ جملة أخرى",
      c_snum: "الجملة {n} من {total}",
      c_name_label: "اسمك أو لقبك", c_optional: "(اختياري)",
      c_name_ph: "مثال: آزاد من آمد", c_rec_label: "سجّل أو ارفع",
      c_record: "تسجيل", c_stop: "إيقاف", c_upload: "⬆ رفع صوت", c_or: "أو",
      c_submit: "إرسال التسجيل", c_uploading: "جارٍ الرفع…",
      c_ok: "🙏 شكرًا! تم استلام صوتك. سجّل جملة أخرى للمساعدة أكثر.",
      c_mic_denied: "تم رفض الوصول إلى الميكروفون. يمكنك رفع ملف بدلاً من ذلك.",
      c_upload_failed: "فشل الرفع",
      c_hez_badge: "HEZ", c_hez_title: "ادعم التطوير",
      c_hez_sub: "الخوادم ووحدات معالجة الرسومات وتدريب النماذج تكلّف مالًا. أرسل HEZ لإبقاء KurdîTV مجانيًا ومتناميًا. هذا العنوان يخص صندوق تطوير المشروع.",
      c_hez_label: "عنوان HEZ / Pezkuwichain", c_copy: "نسخ", c_copied: "تم النسخ ✓",
      c_net1: "الشبكة: Pezkuwichain (SS58)", c_net2: "الرمز: HEZ",
      c_net3: "كل مساهمة تموّل ذكاءً اصطناعيًا كرديًا مجانيًا",
      c_wallet: "تنزيل محفظة Pezkuwi", c_wallet_sub: "احتفظ بـ HEZ على هاتفك — على Google Play",
      c_ext: "احصل على إضافة Pezkuwi", c_ext_sub: "محفظة المتصفح — على Chrome Web Store",
      v_hero_1: "أنشئ فيديو من", v_hero_hl: "صورة + وصف",
      v_hero_p: "ارفع صورة (اختياري) وصِف المشهد. يحوّلها ذكاؤنا الاصطناعي إلى فيديو قصير لك. تستغرق عملية الإنشاء عادة من ١ إلى ٣ دقائق.",
      v_img_label: "صورة", v_img_opt: "(اختياري — يحرّك صورتك)",
      v_drop_b: "أفلت صورة أو انقر للتصفح", v_drop_s: "PNG أو JPG أو WEBP · حتى ١٢ ميجابايت",
      v_prompt_label: "الوصف",
      v_prompt_ph: "صِف الفيديو — مثال: 'راعٍ كردي يمشي في الجبال الخضراء عند الشروق، الكاميرا تتحرك ببطء، سينمائي.'",
      v_hint: "نصيحة: للحصول على أفضل النتائج، اذكر الحركة وحركة الكاميرا والإضاءة والأجواء.",
      v_aspect_label: "نسبة العرض إلى الارتفاع", v_land: "أفقي", v_vert: "عمودي / ريلز",
      v_go: "✨ إنشاء فيديو", v_sending: "جارٍ الإرسال إلى Veo…",
      v_render_note: "يقوم Veo بإنشاء الفيديو. يمكنك إبقاء هذه النافذة مفتوحة — تستغرق بضع دقائق.",
      v_dl: "⬇ تنزيل", v_again: "إنشاء آخر",
      v_err_prompt: "يرجى كتابة وصف للفيديو.",
      v_err_img: "يجب أن تكون الصورة PNG أو JPG أو WEBP.",
      v_working: "جارٍ العمل…", v_lost: "فُقدت المهمة.", v_gen_failed: "فشل الإنشاء.",
      v_starting: "جارٍ البدء…"
    }
  };

  var KEY = "kurditv_lang";
  function current() {
    var s = localStorage.getItem(KEY);
    if (s && I18N[s]) return s;
    var n = (navigator.language || "en").toLowerCase();
    if (n.indexOf("ckb") === 0) return "ku";
    if (n.indexOf("ku") === 0) return "kmr";
    if (n.indexOf("tr") === 0) return "tr";
    if (n.indexOf("fa") === 0 || n.indexOf("pe") === 0) return "fa";
    if (n.indexOf("ar") === 0) return "ar";
    return "en";
  }

  function t(key) {
    var l = window.KLANG || "en";
    return (I18N[l] && I18N[l][key]) || I18N.en[key] || key;
  }

  function apply(code) {
    if (!I18N[code]) code = "en";
    window.KLANG = code;
    localStorage.setItem(KEY, code);
    var conf = LANGS.filter(function (x) { return x.code === code; })[0];
    var html = document.documentElement;
    html.setAttribute("lang", code === "ku" ? "ckb" : code);
    html.setAttribute("dir", conf.dir);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var s = t(el.getAttribute("data-i18n"));
      Object.keys(el.dataset).forEach(function (k) {
        if (k !== "i18n" && k !== "i18nPh" && k !== "i18nHtml")
          s = s.replace("{" + k + "}", el.dataset[k]);
      });
      el.textContent = s;
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    // active state on the switcher
    var cur = document.getElementById("langcur");
    if (cur && conf) cur.innerHTML = flagHtml(conf) + " " + (code === "en" ? "EN" : code.toUpperCase());
    document.querySelectorAll(".langmenu a").forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("data-l") === code);
    });
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: code } }));
  }

  function buildSwitcher() {
    var host = document.getElementById("langsel");
    if (!host) return;
    var btn = document.createElement("button");
    btn.className = "langbtn";
    btn.type = "button";
    btn.innerHTML = '🌐 <span id="langcur">EN</span> <span style="opacity:.6">▾</span>';
    var menu = document.createElement("div");
    menu.className = "langmenu";
    LANGS.forEach(function (l) {
      var a = document.createElement("a");
      a.href = "#";
      a.setAttribute("data-l", l.code);
      a.innerHTML = flagHtml(l) + '<span>' + l.name + '</span>';
      a.onclick = function (e) { e.preventDefault(); apply(l.code); menu.classList.remove("open"); };
      menu.appendChild(a);
    });
    btn.onclick = function (e) { e.stopPropagation(); menu.classList.toggle("open"); };
    document.addEventListener("click", function () { menu.classList.remove("open"); });
    host.appendChild(btn);
    host.appendChild(menu);
  }

  function injectCss() {
    var css = ""
      + "#langsel{position:relative}"
      + ".fimg{width:18px;height:12px;border-radius:2px;object-fit:cover;vertical-align:middle;display:inline-block}"
      + ".langbtn{display:inline-flex;align-items:center;gap:6px;background:#0f111a;border:1px solid var(--line);"
      + "color:var(--txt2);font-size:13px;font-weight:600;border-radius:10px;padding:8px 11px;cursor:pointer;font-family:inherit}"
      + ".langbtn:hover{color:var(--txt);border-color:var(--kesk)}"
      + ".langmenu{position:absolute;top:calc(100% + 6px);inset-inline-end:0;background:var(--card);border:1px solid var(--line);"
      + "border-radius:12px;padding:6px;min-width:180px;z-index:50;display:none;box-shadow:0 12px 40px rgba(0,0,0,.5)}"
      + ".langmenu.open{display:block}"
      + ".langmenu a{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:9px;color:var(--txt2);"
      + "text-decoration:none;font-size:14px;font-weight:600}"
      + ".langmenu a:hover{background:#0f111a;color:var(--txt)}"
      + ".langmenu a.on{color:var(--pos);background:rgba(47,200,100,.08)}"
      + "[dir=rtl] .hero h2,[dir=rtl] .hero p{direction:rtl}"
      + "[dir=rtl] .read{border-left:none;border-right:3px solid var(--kesk)}";
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
  }

  window.t = t;
  window.setLang = apply;

  function init() {
    injectCss();
    buildSwitcher();
    apply(current());
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
