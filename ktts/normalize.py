"""Text normalisation for Kurdish speech synthesis.

A TTS model reads letters. Everything that is not a word in the target
language — digits, symbols, markup, URLs, emoji — is either spoken wrongly or
silently dropped by the tokenizer, and a dropped "2026" turns a date into a
gap. So before synthesis every number is written out in words, in the
dialect's own numerals, and the rest is cleaned.

Dialects: "kmr" (Kurmancî, Latin script) and "ckb" (Soranî, Arabic script).
"""
from __future__ import annotations

import re
import unicodedata

# ── numbers ──────────────────────────────────────────────────────────────────
_KMR = {
    "zero": "sifir", "and": " û ", "point": " xal ",
    "ones": ["", "yek", "du", "sê", "çar", "pênc", "şeş", "heft", "heşt", "neh"],
    "teens": ["deh", "yazdeh", "dwazdeh", "sêzdeh", "çardeh", "pazdeh", "şazdeh", "hevdeh", "hejdeh", "nozdeh"],
    "tens": ["", "", "bîst", "sî", "çil", "pêncî", "şêst", "heftê", "heştê", "nod"],
    "hundred": "sed", "thousand": "hezar", "million": "milyon", "billion": "milyar",
    "percent": "ji sedî ",
}
_CKB = {
    "zero": "سفر", "and": " و ", "point": " پۆینت ",
    "ones": ["", "یەک", "دوو", "سێ", "چوار", "پێنج", "شەش", "حەوت", "هەشت", "نۆ"],
    "teens": ["دە", "یازدە", "دوازدە", "سێزدە", "چواردە", "پازدە", "شازدە", "حەڤدە", "هەژدە", "نۆزدە"],
    "tens": ["", "", "بیست", "سی", "چل", "پەنجا", "شەست", "حەفتا", "هەشتا", "نەوەد"],
    "hundred": "سەد", "thousand": "هەزار", "million": "ملیۆن", "billion": "ملیار",
    "percent": "لەسەدا ",
}
NUMERALS = {"kmr": _KMR, "ckb": _CKB}


def _below_thousand(n: int, w: dict) -> list[str]:
    parts: list[str] = []
    h, rest = divmod(n, 100)
    if h:
        # "sed" alone for 100, "du sed" for 200 — one hundred is never "yek sed".
        parts.append(w["hundred"] if h == 1 else f"{w['ones'][h]} {w['hundred']}")
    if rest >= 20:
        t, o = divmod(rest, 10)
        parts.append(w["tens"][t] if not o else w["tens"][t] + w["and"] + w["ones"][o])
    elif rest >= 10:
        parts.append(w["teens"][rest - 10])
    elif rest:
        parts.append(w["ones"][rest])
    return parts


def number_to_words(n: int, dialect: str) -> str:
    """Write a non-negative integer in words, joined the way the dialect joins them."""
    w = NUMERALS[dialect]
    if n == 0:
        return w["zero"]
    groups = [(10**9, "billion"), (10**6, "million"), (1000, "thousand")]
    parts: list[str] = []
    for size, name in groups:
        q, n = divmod(n, size)
        if q:
            # "hezar" alone for 1000 ("du hezar" for 2000); a million is "yek milyon".
            head = "" if (q == 1 and name == "thousand") else w["and"].join(_below_thousand(q, w))
            parts.append((head + " " + w[name]).strip())
    if n:
        parts.extend(_below_thousand(n, w))
    joiner = w["and"]
    return re.sub(r"\s+", " ", joiner.join(parts)).strip()


# Eastern Arabic and Persian digits reach Soranî text as often as ASCII ones.
_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹", "01234567890123456789")
_NUM_RE = re.compile(r"(?<![\w.])(\d{1,3}(?:[.,]\d{3})+|\d+)(?:([.,])(\d+))?(\s?[%٪])?")
# "$5" is read "five dollars": the symbol moves behind the number.
_CUR_FIRST = re.compile(r"([$€£₺])\s?(\d[\d.,]*)")


def _spell_numbers(text: str, dialect: str) -> str:
    w = NUMERALS[dialect]

    def one(m: re.Match) -> str:
        whole, frac, pct = m.group(1), m.group(3), m.group(4)
        # "1.250.000" and "1,250,000" are thousands; "3,5" and "3.5" are decimals.
        if re.fullmatch(r"\d{1,3}(?:[.,]\d{3})+", whole):
            whole_n = int(re.sub(r"[.,]", "", whole))
        else:
            whole_n = int(whole)
        if len(whole) > 15:   # a phone number or an ID: read it digit by digit
            return " ".join(number_to_words(int(d), dialect) for d in whole)
        out = number_to_words(whole_n, dialect)
        if frac:
            out += w["point"] + " ".join(number_to_words(int(d), dialect) for d in frac) \
                if len(frac) > 2 else w["point"] + number_to_words(int(frac), dialect)
        if pct:
            out = w["percent"] + out
        # A suffix written onto the number ("2026an") stays on the word.
        nxt = m.string[m.end():m.end() + 1]
        return f" {out}" + ("" if nxt.isalpha() else " ")

    return _NUM_RE.sub(one, text.translate(_DIGITS))


# ── cleaning ─────────────────────────────────────────────────────────────────
_HTML_TAG = re.compile(r"<[^>]+>")
_URL = re.compile(r"https?://\S+|www\.\S+")
_HANDLE = re.compile(r"[#@][\w_]+")
_MD_LINK = re.compile(r"\[([^\]]+)\]\([^)]+\)")
_MD_IMG = re.compile(r"!\[[^\]]*\]\([^)]+\)")
_DASHES = re.compile(r"[—–―]")
_SPACE = re.compile(r"[ \t ]+")

_CURRENCY = {
    "kmr": {"$": " dolar ", "€": " euro ", "£": " sterlîn ", "₺": " lîre "},
    "ckb": {"$": " دۆلار ", "€": " یۆرۆ ", "£": " ستەرلینگ ", "₺": " لیرە "},
}


def clean(text: str, dialect: str) -> str:
    """Strip what a TTS model would misread, and spell out every number."""
    if not text:
        return ""
    t = unicodedata.normalize("NFC", text)
    t = _HTML_TAG.sub(" ", t)
    t = _MD_IMG.sub(" ", t)
    t = _MD_LINK.sub(r"\1", t)
    t = re.sub(r"^#{1,6}\s*", "", t, flags=re.M)
    t = re.sub(r"(\*\*|__|\*|_)(.+?)\1", r"\2", t)
    t = _URL.sub(" ", t)
    t = _HANDLE.sub(" ", t)
    t = _CUR_FIRST.sub(r"\2 \1", t)
    for sym, word in _CURRENCY[dialect].items():
        t = t.replace(sym, word)
    t = _DASHES.sub(", ", t)
    t = t.replace("…", ".")
    t = _spell_numbers(t, dialect)
    # Anything that is neither a letter, a mark, a space nor sentence punctuation goes.
    t = "".join(ch if (unicodedata.category(ch)[0] in "LMZ" or ch in ".,!?;:'’-\n،؛؟") else " " for ch in t)
    t = re.sub(r"([.,!?;:،؛؟])\1+", r"\1", t)
    t = re.sub(r"\s+([.,!?;:،؛؟])", r"\1", t)
    t = _SPACE.sub(" ", t)
    t = re.sub(r" *\n+ *", "\n", t)
    return t.strip()


# ── sentences ────────────────────────────────────────────────────────────────
_SENT_END = re.compile(r"(?<=[.!?؟])\s+|\n+")


def sentences(text: str, max_chars: int = 240) -> list[str]:
    """Split cleaned text into sentences no longer than max_chars.

    The model is fastest and most stable on short inputs (measured on the
    production box: one long input was 1.45x real time, the same text as
    sentences 0.6x), so a long sentence is cut again at commas, then at spaces.
    """
    out: list[str] = []
    for s in _SENT_END.split(text):
        s = s.strip()
        if not s:
            continue
        if len(s) <= max_chars:
            out.append(s)
            continue
        buf = ""
        for piece in re.split(r"(?<=[,،;؛:])\s+", s):
            while len(piece) > max_chars:
                cut = piece.rfind(" ", 0, max_chars)
                cut = cut if cut > 0 else max_chars
                if buf:
                    out.append(buf)
                    buf = ""
                out.append(piece[:cut].strip())
                piece = piece[cut:].strip()
            if buf and len(buf) + 1 + len(piece) > max_chars:
                out.append(buf)
                buf = piece
            else:
                buf = f"{buf} {piece}".strip()
        if buf:
            out.append(buf)
    return [s for s in out if any(ch.isalpha() for ch in s)]
