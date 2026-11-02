from app.schemas import Language

LANGUAGE_NAMES: dict[Language, str] = {
    Language.ENGLISH: "English",
    Language.HINDI: "Hindi (Devanagari script)",
}


def language_name(language: Language) -> str:
    return LANGUAGE_NAMES[language]
