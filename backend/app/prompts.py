from app.schemas import LearningProfilePayload


def build_tts_prompt(
    text: str,
    voice_name: str,
    style_description: str,
    learning_mode: str,
    generation_type: str,
    profile: LearningProfilePayload | None,
) -> str:
    native_language = profile.native_language if profile else "English"
    target_language = profile.target_language if profile else "English"
    learning_context = (
        f"The learner's native language is {native_language}. "
        f"The target language is {target_language}. "
        f"The preferred tutoring style is {profile.preferred_voice_style if profile else 'Friendly'}."
    )

    mode_notes = {
        "Normal speed": "Speak at a natural conversational pace.",
        "Slow pronunciation": "Speak slowly and articulate each word very clearly.",
        "Word-by-word": "Pause slightly between words and over-articulate the pronunciation.",
        "Friendly tutor": "Speak like a warm tutor guiding a learner.",
        "Professional narrator": "Speak like a polished narrator with steady pacing.",
    }
    generation_notes = {
        "model_pronunciation": f"Read the target-language text exactly as provided: {text}",
        "explanation_audio": (
            f"Explain in {native_language} how to pronounce the following {target_language} text: {text}. "
            "Keep it concise and pedagogical."
        ),
        "minimal_pairs": (
            f"Create a short spoken minimal-pair style pronunciation drill in {target_language} related to this text: {text}. "
            f"Focus on likely learner challenges for a {native_language} speaker."
        ),
    }

    return (
        f"Audio Profile: {voice_name}. Director's Notes: The speaker is {style_description}. "
        f"{mode_notes.get(learning_mode, mode_notes['Normal speed'])} "
        f"{learning_context} {generation_notes.get(generation_type, generation_notes['model_pronunciation'])}"
    )


def build_stt_prompt(profile: LearningProfilePayload | None) -> str:
    native_language = profile.native_language if profile else "English"
    target_language = profile.target_language if profile else "English"
    level = profile.level if profile else "Intermediate"
    goal = profile.learning_goal if profile else "Daily Conversation"
    return (
        "Analyze the uploaded learner speech and return strict JSON only. "
        "If the audio is unclear, use '[unclear]' instead of inventing words. "
        f"The learner's native language is {native_language}. "
        f"The target language is {target_language}. "
        f"The learner level is {level}. The learning goal is {goal}. "
        f"Summarize in {native_language}. "
        "Return JSON with these keys: "
        "transcript, summary, keywords, tone, study_notes, vocabulary, difficult_words, suggested_practice, confidence. "
        "The vocabulary field must be an array of objects with term, translation, explanation. "
        "The difficult_words field must be an array of objects with word, explanation. "
        "The suggested_practice field must be an array of short target-language practice sentences. "
        "The confidence field must be an integer from 0 to 100 representing transcript confidence."
    )


def build_practice_generation_prompt(profile: LearningProfilePayload, scenario: str) -> str:
    weak_points = ", ".join(profile.weak_points) if profile.weak_points else "none yet"
    return (
        "Generate pronunciation practice material and return strict JSON only. "
        f"Generate practice sentences for a learner whose native language is {profile.native_language}, "
        f"learning {profile.target_language}, level {profile.level}, goal {profile.learning_goal}, "
        f"scenario {scenario}, preferred feedback style {profile.feedback_style}, weak points {weak_points}. "
        "Return JSON with keys: sentence, translation, difficulty, focus_points, "
        "expected_pronunciation_challenges, short_explanation."
    )


def build_practice_explain_prompt(profile: LearningProfilePayload, sentence: str, scenario: str) -> str:
    weak_points = ", ".join(profile.weak_points) if profile.weak_points else "none yet"
    return (
        "Analyze this learner practice sentence and return strict JSON only. "
        f"The learner native language is {profile.native_language}. "
        f"The target language is {profile.target_language}. "
        f"The level is {profile.level}. "
        f"The learning goal is {profile.learning_goal}. "
        f"The scenario is {scenario}. "
        f"The preferred feedback style is {profile.feedback_style}. "
        f"Known weak points: {weak_points}. "
        f"Sentence: {sentence} "
        "Return JSON with keys: sentence, translation, difficulty, focus_points, "
        "expected_pronunciation_challenges, short_explanation. "
        "The translation and short_explanation must be written in the learner's native language. "
        "Keep the explanation concise and practical."
    )


def build_pronunciation_prompt(
    target_text: str,
    profile: LearningProfilePayload | None,
) -> str:
    profile = profile or LearningProfilePayload()
    weak_points = ", ".join(profile.weak_points) if profile.weak_points else "none yet"
    return (
        "Act as a professional phonetics coach and return strict JSON only. "
        "Do not use markdown. If the learner audio is unclear, write '[unclear]' where needed and keep scoring cautious. "
        f"The learner's native language is {profile.native_language}. "
        f"The target language is {profile.target_language}. "
        f"The learner level is {profile.level}. The learning goal is {profile.learning_goal}. "
        f"The preferred feedback style is {profile.feedback_style}. "
        f"Known weak points: {weak_points}. "
        f"Compare the learner audio against this target sentence: {target_text}. "
        f"Write feedback in {profile.interface_language or profile.native_language}. "
        "Include native-language-specific and target-language-specific advice. "
        "Return this JSON shape exactly: "
        "{"
        "\"transcription\":\"...\","
        "\"score\":0,"
        "\"fluency\":0,"
        "\"accuracy\":0,"
        "\"pronunciation\":0,"
        "\"rhythm\":0,"
        "\"missing_words\":[],"
        "\"wrong_words\":[],"
        "\"correct_words\":[],"
        "\"weak_points\":[],"
        "\"native_language_feedback\":\"...\","
        "\"target_language_tip\":\"...\","
        "\"contrastive_tip\":\"...\","
        "\"improvement_tips\":[],"
        "\"next_recommended_exercise\":\"...\","
        "\"encouragement\":\"...\","
        "\"contrastive_insight\": {"
        "\"issue\":\"...\","
        "\"why_it_happens\":\"...\","
        "\"how_to_practice\":\"...\","
        "\"example\":\"...\""
        "}"
        "}"
    )


def build_scenario_prompt(profile: LearningProfilePayload, scenario: str) -> str:
    return (
        "Create a mini dialogue for language learning and return strict JSON only. "
        f"The learner native language is {profile.native_language}. "
        f"The target language is {profile.target_language}. "
        f"The level is {profile.level}. "
        f"The goal is {profile.learning_goal}. "
        f"The scenario is {scenario}. "
        f"Explain support notes in {profile.native_language}. "
        "Return JSON with keys: title, context, dialogue, pronunciation_focus, practice_line_indices, coach_note. "
        "The dialogue field must be an array of objects with speaker, line, translation."
    )


def build_translation_prompt(
    text: str,
    native_language: str,
    target_language: str,
    word_by_word: bool,
    vocabulary: bool,
    explanations: bool,
) -> str:
    return (
        "You are a multilingual learning assistant. Return strict JSON only and do not use markdown. "
        "Translate the learner content naturally, not word-for-word, unless a word-by-word breakdown is requested. "
        "Avoid complex grammar lectures. If any part of the source text is unclear, preserve it as '[unclear]'. "
        f"The source content is mainly in {target_language}. "
        f"Translate everything into {native_language}. "
        f"Source text: {text} "
        "Return exactly these JSON keys: translation, word_by_word, vocabulary, explanations. "
        "The translation field must be a clear learner-friendly translation in the native language. "
        f"The word_by_word field must be {'a useful array of objects with word and meaning' if word_by_word else 'an empty array'} "
        "and should only include meaningful units, not punctuation. "
        f"The vocabulary field must be {'an array of objects with word, meaning, example' if vocabulary else 'an empty array'} "
        "with short simple examples in the target language. "
        f"The explanations field must be {'a short learner-friendly explanation in the native language' if explanations else 'an empty string'}."
    )
