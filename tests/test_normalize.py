"""Numbers are read as words in each dialect; nothing a model would misread survives."""
from ktts.normalize import clean, number_to_words, sentences


def test_numbers_kmr():
    assert number_to_words(0, "kmr") == "sifir"
    assert number_to_words(21, "kmr") == "bîst û yek"
    assert number_to_words(100, "kmr") == "sed"
    assert number_to_words(250, "kmr") == "du sed û pêncî"
    assert number_to_words(1000, "kmr") == "hezar"
    assert number_to_words(2026, "kmr") == "du hezar û bîst û şeş"
    assert number_to_words(1_250_000, "kmr") == "yek milyon û du sed û pêncî hezar"


def test_numbers_ckb():
    assert number_to_words(21, "ckb") == "بیست و یەک"
    assert number_to_words(2026, "ckb") == "دوو هەزار و بیست و شەش"


def test_clean():
    t = clean("Di sala 2026an de, **3,5%** zêde bû — $1.250.000! https://x.y #tag 😀", "kmr")
    assert "2026" not in t and "$" not in t and "http" not in t and "#" not in t and "😀" not in t
    assert "şeşan" in t                       # a suffix stays on the number's word
    assert "ji sedî sê xal pênc" in t
    assert t.endswith("dolar!")               # "$1.250.000" → "... hezar dolar"
    assert "چل و پێنج" in clean("٤٥٪", "ckb")   # Eastern digits and the Arabic percent sign


def test_sentences_are_bounded():
    s = sentences(clean("Yek. Du! " + "peyv " * 80 + ", dawî.", "kmr"), 60)
    assert s[:2] == ["Yek.", "Du!"] and all(len(x) <= 60 for x in s)
