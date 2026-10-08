import type { DayCurriculum, VocabItem, SentenceItem } from "./curriculum";
import { CURRICULUM, getAllVocab, getAllSentences, getVocabUpToDay, getSentencesUpToDay } from "./curriculum";

export type QuestionType = "image" | "translate_jp_en" | "translate_en_jp" | "listen" | "sentence_jp_en" | "sentence_en_jp" | "hiragana_romaji" | "romaji_hiragana" | "romaji_input";

export interface LessonQuestion {
  id: string;
  type: QuestionType;
  directionLabel: string;
  prompt: string;
  romaji: string;
  hiragana: string;
  english: string;
  imageUrl?: string;
  choices: string[];
  choiceRomaji?: string[];
  choiceHiragana?: string[];
  correctIndex: number;
  showAudio: boolean;
  concealPrompt: boolean;
  hintTooltip?: string;
  answerText?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function pickDistractors<T>(pool: T[], correct: T, count: number, keyFn: (v: T) => string): T[] {
  const filtered = pool.filter((p) => keyFn(p) !== keyFn(correct));
  return shuffle(filtered).slice(0, count);
}

/** Ensure all 4 image URLs are unique — never repeating. */
function pickUniqueImageDistractors(allVocab: VocabItem[], correct: VocabItem, count: number): VocabItem[] {
  const imageVocab = allVocab.filter(
    (v) => v.imageUrl && v.imageUrl !== correct.imageUrl && v.english !== correct.english
  );
  const shuffled = shuffle(imageVocab);
  const seen = new Set<string>();
  const result: VocabItem[] = [];
  for (const v of shuffled) {
    if (result.length >= count) break;
    if (seen.has(v.imageUrl!)) continue;
    seen.add(v.imageUrl!);
    result.push(v);
  }
  return result;
}

function makeImageQuestion(vocab: VocabItem, allVocab: VocabItem[]): LessonQuestion {
  const distractors = pickUniqueImageDistractors(allVocab, vocab, 3);
  const choices = shuffle([vocab, ...distractors]);
  return {
    id: uid("img"),
    type: "image",
    directionLabel: "Select the correct image",
    prompt: "Which image matches this word?",
    romaji: vocab.romaji,
    hiragana: vocab.hiragana,
    english: vocab.english,
    choices: choices.map((c) => c.imageUrl!),
    correctIndex: choices.findIndex((c) => c.english === vocab.english),
    showAudio: true,
    concealPrompt: false,
  };
}

function makeTranslateJpEn(vocab: VocabItem, allVocab: VocabItem[]): LessonQuestion {
  const distractors = pickDistractors(allVocab, vocab, 3, (v) => v.english);
  const choices = shuffle([vocab, ...distractors]);
  return {
    id: uid("tje"),
    type: "translate_jp_en",
    directionLabel: "Translate into English",
    prompt: "Translation: What does this word mean?",
    romaji: vocab.romaji,
    hiragana: vocab.hiragana,
    english: vocab.english,
    choices: choices.map((c) => c.english),
    correctIndex: choices.findIndex((c) => c.english === vocab.english),
    showAudio: true,
    concealPrompt: false,
    hintTooltip: vocab.english,
  };
}

function makeTranslateEnJp(vocab: VocabItem, availableVocab: VocabItem[]): LessonQuestion {
  const distractors = pickDistractors(availableVocab, vocab, 3, (v) => v.hiragana);
  const choices = shuffle([vocab, ...distractors]);
  return {
    id: uid("tej"),
    type: "translate_en_jp",
    directionLabel: "Translate into Japanese",
    prompt: `Translation: How do you say "${vocab.english}" in Japanese?`,
    romaji: vocab.romaji,
    hiragana: vocab.hiragana,
    english: vocab.english,
    choices: choices.map((c) => c.hiragana),
    choiceRomaji: choices.map((c) => c.romaji),
    choiceHiragana: choices.map((c) => c.hiragana),
    correctIndex: choices.findIndex((c) => c.hiragana === vocab.hiragana),
    showAudio: false,
    concealPrompt: false,
  };
}

function makeListenQuestion(vocab: VocabItem, allVocab: VocabItem[]): LessonQuestion {
  const distractors = pickDistractors(allVocab, vocab, 3, (v) => v.hiragana);
  const choices = shuffle([vocab, ...distractors]);
  return {
    id: uid("lsn"),
    type: "listen",
    directionLabel: "Tap what you hear",
    prompt: "Listen to the audio and select what you hear.",
    romaji: vocab.romaji,
    hiragana: vocab.hiragana,
    english: vocab.english,
    choices: choices.map((c) => c.hiragana),
    choiceRomaji: choices.map((c) => c.romaji),
    choiceHiragana: choices.map((c) => c.hiragana),
    correctIndex: choices.findIndex((c) => c.hiragana === vocab.hiragana),
    showAudio: true,
    concealPrompt: true,
  };
}

function makeSentenceJpEn(sentence: SentenceItem, allSentences: SentenceItem[]): LessonQuestion {
  const distractors = pickDistractors(allSentences, sentence, 3, (s) => s.english);
  const choices = shuffle([sentence, ...distractors]);
  return {
    id: uid("sje"),
    type: "sentence_jp_en",
    directionLabel: "Translate into English",
    prompt: "Translation: What does this sentence mean?",
    romaji: sentence.romaji,
    hiragana: sentence.hiragana,
    english: sentence.english,
    choices: choices.map((c) => c.english),
    correctIndex: choices.findIndex((c) => c.english === sentence.english),
    showAudio: true,
    concealPrompt: false,
    hintTooltip: sentence.english,
  };
}

function makeSentenceEnJp(sentence: SentenceItem, allSentences: SentenceItem[]): LessonQuestion {
  const distractors = pickDistractors(allSentences, sentence, 3, (s) => s.hiragana);
  const choices = shuffle([sentence, ...distractors]);
  return {
    id: uid("sej"),
    type: "sentence_en_jp",
    directionLabel: "Translate into Japanese",
    prompt: `Translation: How do you say this in Japanese?\n"${sentence.english}"`,
    romaji: sentence.romaji,
    hiragana: sentence.hiragana,
    english: sentence.english,
    choices: choices.map((c) => c.hiragana),
    choiceRomaji: choices.map((c) => c.romaji),
    choiceHiragana: choices.map((c) => c.hiragana),
    correctIndex: choices.findIndex((c) => c.hiragana === sentence.hiragana),
    showAudio: false,
    concealPrompt: false,
  };
}

function makeHiraganaRomaji(char: string, romaji: string, allChars: { char: string; romaji: string }[]): LessonQuestion {
  const distractors = pickDistractors(allChars, { char, romaji }, 3, (c) => c.romaji);
  const choices = shuffle([{ char, romaji }, ...distractors]);
  return {
    id: uid("hr"),
    type: "hiragana_romaji",
    directionLabel: "Hiragana → Romaji",
    prompt: "What is the pronunciation (romaji) of this character?",
    romaji: romaji,
    hiragana: char,
    english: romaji,
    choices: choices.map((c) => c.romaji),
    correctIndex: choices.findIndex((c) => c.romaji === romaji),
    showAudio: true,
    concealPrompt: false,
  };
}

function makeRomajiInput(char: string, romaji: string): LessonQuestion {
  return {
    id: uid("rmi"),
    type: "romaji_input",
    directionLabel: "Type the Romaji",
    prompt: "Type the exact Romaji pronunciation.",
    romaji,
    hiragana: char,
    english: romaji,
    choices: [romaji],
    correctIndex: 0,
    showAudio: true,
    concealPrompt: false,
    answerText: romaji,
  };
}

function makeRomajiHiragana(char: string, romaji: string, allChars: { char: string; romaji: string }[]): LessonQuestion {
  const distractors = pickDistractors(allChars, { char, romaji }, 3, (c) => c.char);
  const choices = shuffle([{ char, romaji }, ...distractors]);
  return {
    id: uid("rh"),
    type: "romaji_hiragana",
    directionLabel: "Romaji → Hiragana",
    prompt: `Which hiragana character is pronounced "${romaji}"?`,
    romaji: romaji,
    hiragana: char,
    english: romaji,
    choices: choices.map((c) => c.char),
    correctIndex: choices.findIndex((c) => c.char === char),
    showAudio: false,
    concealPrompt: false,
  };
}

/** Build a map of unique hiragana characters to their romaji for drill questions. */
function buildHiraganaCharMap(maxDay: number): { char: string; romaji: string }[] {
  const seen = new Map<string, string>();
  for (const d of CURRICULUM) {
    if (d.day > maxDay) break;
    for (const v of d.vocab) {
      for (let i = 0; i < v.hiragana.length; i++) {
        const ch = v.hiragana[i];
        const rm = v.romaji.split(" ")[i] ?? "";
        if (/[ぁ-ゟ]/.test(ch) && !seen.has(ch)) {
          seen.set(ch, rm);
        }
      }
    }
  }
  return Array.from(seen.entries()).map(([char, romaji]) => ({ char, romaji }));
}

export function generateLessonQuestions(
  day: DayCurriculum,
  targetCount = 22
): LessonQuestion[] {
  const allVocab = getAllVocab();
  const allSentences = getAllSentences();
  const availableVocab = getVocabUpToDay(day.day);
  const availableSentences = getSentencesUpToDay(day.day);

  const imageVocab = day.vocab.filter((v) => v.imageUrl);
  const questions: LessonQuestion[] = [];

  for (const v of shuffle(imageVocab)) {
    questions.push(makeImageQuestion(v, allVocab));
  }

  for (const v of shuffle(day.vocab)) {
    questions.push(makeTranslateJpEn(v, allVocab));
  }

  for (const v of shuffle(day.vocab)) {
    questions.push(makeTranslateEnJp(v, availableVocab));
  }

  for (const v of shuffle(day.vocab)) {
    questions.push(makeListenQuestion(v, allVocab));
  }

  for (const s of shuffle(day.sentences)) {
    questions.push(makeSentenceJpEn(s, allSentences));
  }

  for (const s of shuffle(day.sentences)) {
    questions.push(makeSentenceEnJp(s, availableSentences));
  }

  if (day.day >= 2) {
    const earlierVocab = CURRICULUM.filter((d) => d.day < day.day).flatMap((d) => d.vocab);
    const reviewCount = day.isCumulativeReview ? 7 : 5;
    for (const v of shuffle(earlierVocab).slice(0, reviewCount)) {
      questions.push(makeTranslateJpEn(v, allVocab));
    }
  }

  return shuffle(questions).slice(0, targetCount);
}

export function practiceQuestionCount(dayCount: number): number {
  if (dayCount < 3) return 10 + 4 * dayCount;
  if (dayCount < 5) return 10 + 3 * dayCount;
  return 10 + 2 * dayCount;
}

export function generatePracticeQuestions(
  maxDay: number,
  targetCount = 20,
  missedKeys: string[] = [],
  selectedDays?: number[]
): LessonQuestion[] {
  const allVocab = getAllVocab();
  const scopedDays = selectedDays?.length
    ? CURRICULUM.filter((d) => selectedDays.includes(d.day))
    : CURRICULUM.filter((d) => d.day <= maxDay);
  const availableVocab = scopedDays.flatMap((d) => d.vocab);
  const availableSentences = scopedDays.flatMap((d) => d.sentences);
  const missedVocab = availableVocab.filter((v) => missedKeys.includes(v.hiragana));
  const allSentences = getAllSentences();
  const questions: LessonQuestion[] = [];

  const imageVocab = availableVocab.filter((v) => v.imageUrl);
  for (const v of shuffle(imageVocab)) {
    questions.push(makeImageQuestion(v, allVocab));
  }

  for (const v of shuffle(availableVocab)) {
    questions.push(makeTranslateJpEn(v, allVocab));
  }

  for (const v of shuffle(missedVocab).slice(0, 2)) {
    questions.push(makeTranslateEnJp(v, availableVocab));
  }

  for (const v of shuffle(availableVocab)) {
    questions.push(makeTranslateEnJp(v, availableVocab));
  }

  for (const v of shuffle(availableVocab)) {
    questions.push(makeListenQuestion(v, allVocab));
  }

  for (const s of shuffle(availableSentences)) {
    questions.push(makeSentenceJpEn(s, allSentences));
  }

  for (const s of shuffle(availableSentences)) {
    questions.push(makeSentenceEnJp(s, availableSentences));
  }

  // Hiragana drills
  const charMap = buildHiraganaCharMap(maxDay);
  if (charMap.length >= 4) {
    for (const c of shuffle(charMap).slice(0, Math.max(4, Math.ceil(targetCount / 6)))) {
      questions.push(makeHiraganaRomaji(c.char, c.romaji, charMap));
      questions.push(makeRomajiInput(c.char, c.romaji));
    }
  }

  return shuffle(questions).slice(0, targetCount);
}

export function scoreLesson(
  questions: LessonQuestion[],
  answers: Record<string, number>,
  skippedIds?: Set<string>
): { correct: number; total: number; percentage: number; sm2Score: number } {
  let correct = 0;
  let total = 0;
  const skipped = skippedIds ?? new Set<string>();
  for (const q of questions) {
    if (skipped.has(q.id)) continue;
    total++;
    if (answers[q.id] === q.correctIndex) correct++;
  }
  const percentage = total > 0 ? (correct / total) * 100 : 0;
  const sm2Score = Math.min(5, Math.max(0, Math.round((percentage / 100) * 5)));
  return { correct, total, percentage, sm2Score };
}
