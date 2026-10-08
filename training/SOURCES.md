# What our voice is trained on

KurdAi's own voice is trained only on speech we may use for a model that is
published, offered through an API, or sold: public domain (CC0), attribution
(CC BY) and share-alike (CC BY-SA) licences, plus the voices donated to KurdAi
Voice under its consent. Anything without such a licence stays out however large
it is. `tools/open_data.py` downloads and prepares what is listed here; checked
on 2026-10-08.

## Used

| id | Dialect | Hours | Speakers | Licence | Where |
|---|---|---|---|---|---|
| `cv-kmr` | Kurmancî | 111.3 (79.4 validated) | 709 | CC0-1.0 | Mozilla Common Voice 27.0, via the Mozilla Data Collective |
| `cv-ckb` | Soranî | 196.1 (139.1 validated) | 2,069 | CC0-1.0 | same |
| `cv-zza` | Zazakî | 2.7 (2.0 validated) | 25 | CC0-1.0 | same |
| `cv-sps-hac` | Hewramî | 421 answers | 19 | CC0-1.0 | Common Voice Spontaneous Speech 5.0, Gorani |
| `unimelb-ckb` | Soranî | 2.3 | 1 | CC-BY-4.0 | University of Melbourne, Central Kurdish TTS 1.0 (Data Collective) |
| `unimelb-hac` | Hewramî | 5.25 | 1 | CC-BY-4.0 | University of Melbourne, Hawrami Kurdish TTS 1.0 (Data Collective) |
| `fleurs-ckb` | Soranî | 14.7 (measured) | many | CC-BY-4.0 | Google FLEURS, `ckb_iq` (Hugging Face) |
| `openbible-ckb` | Soranî | 85.4 | 1 | CC-BY-SA-4.0 | OpenBibleTTS, from open.bible (Hugging Face) |
| `genc-zza` | Zazakî | 2.5 (measured) | 1 | CC0-1.0 | Genç Zazaki teaching recordings (Hugging Face) |
| donations | Kurmancî, Soranî | grows | grows | our consent | KurdAi Voice, clips two other donors confirmed |

The two Melbourne sets were each recorded by their own speaker from texts free
to read: Aso Mahmudi (Soranî; Ahmad Mukhtar Jaff's *Mesele-y Wijdan*, public
domain, and web texts) and Ako Marani (Hewramî; his own two books). Their cards
name no licence; the licence is the one their publisher, the University of
Melbourne, gives on the Data Collective: CC BY 4.0. Hewramî comes in three
spellings; we train on the first (the speaker's own) and keep the third (the
nearest to the standard Sorani alphabet) beside it.

Only Common Voice's `validated.tsv` is used: clips other speakers have listened
to and confirmed. In all, about 430 hours: Soranî about 300, Kurmancî about 80
validated, Zazakî about 5, Hewramî about 6.

**For a voice (TTS)** the one-speaker studio sets matter most: OpenBible (85 h,
Soranî), Melbourne (2.3 h Soranî, 5.25 h Hewramî), Genç (2.5 h Zazakî).
**Kurmancî has no open one-speaker set**: its voice will come from donations, or
from a voice actor we record ourselves.

**For recognition (ASR)** the many-speaker sets matter most: Common Voice, FLEURS.

### What the licences ask of us

- **CC0** — nothing; we credit Common Voice anyway.
- **CC BY** — credit (FLEURS, Melbourne): `tools/open_data.py attribution` writes it.
- **CC BY-SA** (OpenBible) — credit, and anything we derive from it and share
  (a cleaned copy of the data, for instance) is shared under CC BY-SA too. Whether
  model weights count as derived is unsettled; we credit it in the model card and
  do not republish the audio.
- **Mozilla Data Collective's terms** — a free account, each dataset's terms
  accepted once on its page, an API key, at most 30 downloads a day. The files
  are not re-hosted anywhere, and no one tries to find out who a speaker is.
- **Donations** — only to train our own models; never published; a donor who
  deletes their recordings is gone from the next export (`open_data.py donations`
  rebuilds the set from the database every time).

## Left out

| What | Size | Why |
|---|---|---|
| Rudaw / Sterk TV recordings (`aranemini/northern-kurdish-raw-audio`) | 2,000+ h Kurmancî | gathered from broadcasters without a licence; "for research purposes" |
| Sorani audiobooks (`aranemini/central-kurdish-audiobook-raw`) | 4,300 h | same: the books and the narrations belong to others |
| Pseudo-labelled Sorani (`aranemini/central-kurdish-pseudolabel`) | 3,200 h | licence: unknown, built from the above |
| `razhan/yt-ckb` | 775k clips | third-party YouTube videos; the card itself says reuse is constrained |
| Meta MMS-ulab, `mms_ulab_v2` | — | CC BY-NC-SA: no commercial use |
| WorldSpeech | — | CC BY-NC |
| `central-kurdish-tts4all`, `southern-kurdish-asr` | — | CC BY-NC-ND |
| `farmanOthman/kurdish-voice-dataset` | — | CC BY-NC |
| AsoSoft Speech Corpus | ~30 h | research and non-commercial use only |
| KASET (LDC2024S01) | 147 h | LDC licence, paid |
| `UKH-AIIC-KA/KurFemTTS`, `PawanKrd/*`, `akam-ot/*`, `TTS4ALL/Kurdish_TTS` | — | no licence stated: worth asking their authors |
| SoraniTTS (Mendeley `jmtn248cc9`) | 19 h | CC BY 4.0, but only the text is published, not the audio: ask the authors |
| YODAS2 `ku000` | 8 h | CC BY, but what is labelled Kurdish is Arabic and English (checked) |
| Mazdek AI | — | its terms forbid training a competing model on its output |

The MMS models our site speaks with today (`facebook/mms-tts-kmr-script_latin`,
`razhan/mms-tts-ckb`) are themselves CC BY-NC: a stop-gap until our own voice
replaces them, and no reason to start our own from them.
