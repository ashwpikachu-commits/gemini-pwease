export interface VocabItem {
  romaji: string;
  hiragana: string;
  english: string;
  imageUrl?: string;
  isParticle?: boolean;
}

export interface SentenceSegment {
  romaji: string;
  hiragana: string;
  english: string;
}

export interface SentenceItem {
  romaji: string;
  hiragana: string;
  english: string;
  segments?: SentenceSegment[];
}

export interface GrammarNote {
  title: string;
  body: string;
}

export interface DayCurriculum {
  day: number;
  title: string;
  focus: string;
  description: string;
  vocab: VocabItem[];
  sentences: SentenceItem[];
  grammarNotes: GrammarNote[];
  isCumulativeReview: boolean;
  isRegularTest?: boolean;
}

export const VOCAB_IMAGES: Record<string, string> = {
  water: "https://images.pexels.com/photos/10482146/pexels-photo-10482146.jpeg?auto=compress&cs=tinysrgb&h=350&w=350",
  sushi: "https://images.pexels.com/photos/7243416/pexels-photo-7243416.jpeg?auto=compress&cs=tinysrgb&h=650&w=650",
  tea: "https://images.pexels.com/photos/746383/pexels-photo-746383.jpeg?auto=compress&cs=tinysrgb&h=350&w=350",
  rice: "https://images.pexels.com/photos/31555431/pexels-photo-31555431.jpeg?auto=compress&cs=tinysrgb&h=350&w=350",
  book: "https://images.pexels.com/photos/4170628/pexels-photo-4170628.jpeg?auto=compress&cs=tinysrgb&h=350&w=350",
  station: "https://images.pexels.com/photos/32789263/pexels-photo-32789263.jpeg?auto=compress&cs=tinysrgb&h=350&w=350",
};

function img(key: keyof typeof VOCAB_IMAGES): string {
  return VOCAB_IMAGES[key];
}

export const CURRICULUM: DayCurriculum[] = [
  {
    day: 1,
    title: "Greetings & Food/Drink",
    focus: "Hiragana basics, daily greetings, and common food words",
    description:
      "Start your Japanese journey with essential greetings and food vocabulary you'll use every day.",
    vocab: [
      { romaji: "o ha yo u", hiragana: "おはよう", english: "Good morning" },
      { romaji: "ko n ni chi wa", hiragana: "こんにちは", english: "Hello / Good afternoon" },
      { romaji: "mi zu", hiragana: "みず", english: "Water", imageUrl: img("water") },
      { romaji: "su shi", hiragana: "すし", english: "Sushi", imageUrl: img("sushi") },
      { romaji: "o cha", hiragana: "おちゃ", english: "Tea", imageUrl: img("tea") },
      { romaji: "go ha n", hiragana: "ごはん", english: "Rice / Meal", imageUrl: img("rice") },
      { romaji: "ku da sa i", hiragana: "ください", english: "Please (request)" },
    ],
    sentences: [],
    grammarNotes: [],
    isCumulativeReview: false,
  },
  {
    day: 2,
    title: "Courtesy & Essentials",
    focus: "Yes/no responses, gratitude, polite partings, and the copula です",
    description:
      "Learn courtesy words and the fundamental sentence-ending particles です and か.",
    vocab: [
      { romaji: "ha i", hiragana: "はい", english: "Yes" },
      { romaji: "i i e", hiragana: "いいえ", english: "No" },
      { romaji: "a ri ga to u", hiragana: "ありがとう", english: "Thank you" },
      { romaji: "sa yo u na ra", hiragana: "さようなら", english: "Goodbye" },
      { romaji: "su mi ma se n", hiragana: "すみません", english: "Excuse me / Sorry" },
      { romaji: "de su", hiragana: "です", english: "to be / is / am / are (polite)", isParticle: true },
      { romaji: "ka", hiragana: "か", english: "question particle (spoken ?)", isParticle: true },
    ],
    sentences: [
      {
        romaji: "a ri ga to u go za i ma su",
        hiragana: "ありがとうございます",
        english: "Thank you very much (polite)",
        segments: [
          { romaji: "a ri ga to u go za i ma su", hiragana: "ありがとうございます", english: "Thank you very much" },
        ],
      },
      {
        romaji: "ko re wa su shi de su",
        hiragana: "これはすしです",
        english: "This is sushi",
        segments: [
          { romaji: "ko re", hiragana: "これ", english: "this" },
          { romaji: "wa", hiragana: "は", english: "topic marker" },
          { romaji: "su shi", hiragana: "すし", english: "sushi" },
          { romaji: "de su", hiragana: "です", english: "is" },
        ],
      },
      {
        romaji: "ko re wa su shi de su ka",
        hiragana: "これはすしですか",
        english: "Is this sushi?",
        segments: [
          { romaji: "ko re", hiragana: "これ", english: "this" },
          { romaji: "wa", hiragana: "は", english: "topic marker" },
          { romaji: "su shi", hiragana: "すし", english: "sushi" },
          { romaji: "de su ka", hiragana: "ですか", english: "is it?" },
        ],
      },
    ],
    grammarNotes: [
      {
        title: "です (desu) — The polite copula",
        body: "です is placed at the end of a sentence to make it polite, meaning 'It is...' or 'This is...'. For example, 'これはすしです' means 'This is sushi.'",
      },
      {
        title: "か (ka) — The question particle",
        body: "か is placed at the very end of a sentence to turn it into a question, acting like a spoken question mark (?). For example, 'これはすしですか' means 'Is this sushi?'",
      },
    ],
    isCumulativeReview: false,
  },
  {
    day: 3,
    title: "Describing Words & People",
    focus: "Pronouns, demonstratives, and expressing preferences",
    description:
      "Talk about yourself, point to things, and describe what you like.",
    vocab: [
      { romaji: "wa ta shi", hiragana: "わたし", english: "I / Me" },
      { romaji: "a na ta", hiragana: "あなた", english: "You" },
      { romaji: "ko re", hiragana: "これ", english: "This (near speaker)" },
      { romaji: "so re", hiragana: "それ", english: "That (near listener)" },
      { romaji: "o i shi i", hiragana: "おいしい", english: "Delicious" },
      { romaji: "su ki", hiragana: "すき", english: "Like / Fond of" },
      { romaji: "ga", hiragana: "が", english: "subject marker", isParticle: true },
    ],
    sentences: [
      {
        romaji: "ko re wa su shi de su",
        hiragana: "これはすしです",
        english: "This is sushi",
        segments: [
          { romaji: "ko re", hiragana: "これ", english: "this" },
          { romaji: "wa", hiragana: "は", english: "topic marker" },
          { romaji: "su shi", hiragana: "すし", english: "sushi" },
          { romaji: "de su", hiragana: "です", english: "is" },
        ],
      },
      {
        romaji: "su shi ga o i shi i de su",
        hiragana: "すしがおいしいです",
        english: "Sushi is delicious",
        segments: [
          { romaji: "su shi", hiragana: "すし", english: "sushi" },
          { romaji: "ga", hiragana: "が", english: "subject marker" },
          { romaji: "o i shi i", hiragana: "おいしい", english: "delicious" },
          { romaji: "de su", hiragana: "です", english: "is" },
        ],
      },
      {
        romaji: "wa ta shi wa su shi ga su ki de su",
        hiragana: "わたしはすしがすきです",
        english: "I like sushi",
        segments: [
          { romaji: "wa ta shi", hiragana: "わたし", english: "I" },
          { romaji: "wa", hiragana: "は", english: "topic marker" },
          { romaji: "su shi", hiragana: "すし", english: "sushi" },
          { romaji: "ga", hiragana: "が", english: "subject marker" },
          { romaji: "su ki", hiragana: "すき", english: "like" },
          { romaji: "de su", hiragana: "です", english: "is" },
        ],
      },
    ],
    grammarNotes: [],
    isCumulativeReview: false,
  },
  {
    day: 4,
    title: "Places & Directions",
    focus: "Locations, asking where things are, and the direction particle へ",
    description:
      "Navigate your surroundings — find the station, a book, and ask directions.",
    vocab: [
      { romaji: "ko ko", hiragana: "ここ", english: "Here" },
      { romaji: "so ko", hiragana: "そこ", english: "There (near listener)" },
      { romaji: "do ko", hiragana: "どこ", english: "Where" },
      { romaji: "e ki", hiragana: "えき", english: "Train station", imageUrl: img("station") },
      { romaji: "ho n", hiragana: "ほん", english: "Book", imageUrl: img("book") },
      { romaji: "ni", hiragana: "に", english: "location / direction particle", isParticle: true },
      { romaji: "he", hiragana: "へ", english: "direction particle (read 'e')", isParticle: true },
    ],
    sentences: [
      {
        romaji: "e ki wa do ko de su ka",
        hiragana: "えきはどこですか",
        english: "Where is the train station?",
        segments: [
          { romaji: "e ki", hiragana: "えき", english: "station" },
          { romaji: "wa", hiragana: "は", english: "topic marker" },
          { romaji: "do ko", hiragana: "どこ", english: "where" },
          { romaji: "de su ka", hiragana: "ですか", english: "is it?" },
        ],
      },
      {
        romaji: "ho n wa ko ko ni a ri ma su",
        hiragana: "ほんはここにあります",
        english: "The book is here",
        segments: [
          { romaji: "ho n", hiragana: "ほん", english: "book" },
          { romaji: "wa", hiragana: "は", english: "topic marker" },
          { romaji: "ko ko", hiragana: "ここ", english: "here" },
          { romaji: "ni", hiragana: "に", english: "location particle" },
          { romaji: "a ri ma su", hiragana: "あります", english: "is (exists)" },
        ],
      },
    ],
    grammarNotes: [
      {
        title: "に (ni) — Location and direction",
        body: "に marks a location or destination. In 'ほんはここにあります', it marks 'here' as the place where the book exists.",
      },
      {
        title: "へ (he → e) — Direction particle",
        body: "へ is read as 'e' when used as a direction particle, pointing toward a destination. It is written as へ but pronounced 'e'.",
      },
    ],
    isCumulativeReview: false,
  },
  {
    day: 5,
    title: "Numbers & Counting",
    focus: "Counting from one to ten in Japanese",
    description:
      "Master the numbers 1–10 — essential for shopping, time, and quantity.",
    vocab: [
      { romaji: "i chi", hiragana: "いち", english: "One" },
      { romaji: "ni", hiragana: "に", english: "Two" },
      { romaji: "sa n", hiragana: "さん", english: "Three" },
      { romaji: "yo n", hiragana: "よん", english: "Four" },
      { romaji: "go", hiragana: "ご", english: "Five" },
      { romaji: "ro ku", hiragana: "ろく", english: "Six" },
      { romaji: "na na", hiragana: "なな", english: "Seven" },
      { romaji: "ha chi", hiragana: "はち", english: "Eight" },
      { romaji: "kyu u", hiragana: "きゅう", english: "Nine" },
      { romaji: "ju u", hiragana: "じゅう", english: "Ten" },
      { romaji: "to", hiragana: "と", english: "and / with particle", isParticle: true },
    ],
    sentences: [
      {
        romaji: "mi zu to o cha o ku da sa i",
        hiragana: "みずとおちゃをください",
        english: "Water and tea, please",
        segments: [
          { romaji: "mi zu", hiragana: "みず", english: "water" },
          { romaji: "to", hiragana: "と", english: "and" },
          { romaji: "o cha", hiragana: "おちゃ", english: "tea" },
          { romaji: "o", hiragana: "を", english: "object marker" },
          { romaji: "ku da sa i", hiragana: "ください", english: "please" },
        ],
      },
      {
        romaji: "su shi o sa n ko ku da sa i",
        hiragana: "すしをさんこください",
        english: "Three sushi, please",
        segments: [
          { romaji: "su shi", hiragana: "すし", english: "sushi" },
          { romaji: "o", hiragana: "を", english: "object marker" },
          { romaji: "sa n", hiragana: "さん", english: "three" },
          { romaji: "ko", hiragana: "こ", english: "counter" },
          { romaji: "ku da sa i", hiragana: "ください", english: "please" },
        ],
      },
    ],
    grammarNotes: [
      {
        title: "と (to) — And / with",
        body: "と connects nouns in a list, meaning 'and'. For example, 'みずとおちゃ' means 'water and tea'.",
      },
    ],
    isCumulativeReview: false,
  },
  {
    day: 6,
    title: "Daily Sentences",
    focus: "Combining vocabulary into useful everyday sentences",
    description:
      "Put it all together — form sentences for ordering, describing, and asking.",
    vocab: [
      { romaji: "no mi ma su", hiragana: "のみます", english: "to drink" },
      { romaji: "a o", hiragana: "あお", english: "Blue" },
      { romaji: "o sa ke", hiragana: "おさけ", english: "Alcohol / Sake" },
      { romaji: "de", hiragana: "で", english: "means / location of action particle", isParticle: true },
    ],
    sentences: [
      {
        romaji: "ko re wa mi zu de su",
        hiragana: "これはみずです",
        english: "This is water",
        segments: [
          { romaji: "ko re", hiragana: "これ", english: "this" },
          { romaji: "wa", hiragana: "は", english: "topic marker" },
          { romaji: "mi zu", hiragana: "みず", english: "water" },
          { romaji: "de su", hiragana: "です", english: "is" },
        ],
      },
      {
        romaji: "su mi ma se n e ki wa do ko de su ka",
        hiragana: "すみませんえきはどこですか",
        english: "Excuse me, where is the station?",
        segments: [
          { romaji: "su mi ma se n", hiragana: "すみません", english: "excuse me" },
          { romaji: "e ki", hiragana: "えき", english: "station" },
          { romaji: "wa", hiragana: "は", english: "topic marker" },
          { romaji: "do ko", hiragana: "どこ", english: "where" },
          { romaji: "de su ka", hiragana: "ですか", english: "is it?" },
        ],
      },
      {
        romaji: "wa ta shi wa o cha ga su ki de su",
        hiragana: "わたしはおちゃがすきです",
        english: "I like tea",
        segments: [
          { romaji: "wa ta shi", hiragana: "わたし", english: "I" },
          { romaji: "wa", hiragana: "は", english: "topic marker" },
          { romaji: "o cha", hiragana: "おちゃ", english: "tea" },
          { romaji: "ga", hiragana: "が", english: "subject marker" },
          { romaji: "su ki", hiragana: "すき", english: "like" },
          { romaji: "de su", hiragana: "です", english: "is" },
        ],
      },
      {
        romaji: "o sa ke o no mi ma su ka",
        hiragana: "おさけをのみますか",
        english: "Will you drink sake?",
        segments: [
          { romaji: "o sa ke", hiragana: "おさけ", english: "sake" },
          { romaji: "o", hiragana: "を", english: "object marker" },
          { romaji: "no mi ma su", hiragana: "のみます", english: "drink" },
          { romaji: "ka", hiragana: "か", english: "question" },
        ],
      },
    ],
    grammarNotes: [
      {
        title: "で (de) — Means / location of action",
        body: "で marks the means by which an action is performed, or the location where it happens. For example, 'えきで' means 'at the station'.",
      },
    ],
    isCumulativeReview: false,
  },
  {
    day: 7,
    title: "Comprehensive 1-Week Cumulative Review Test",
    focus: "Everything from Days 1–6",
    description:
      "A comprehensive test covering all vocabulary and sentences from the week. Your performance feeds directly into the spaced-repetition research algorithm.",
    vocab: [
      { romaji: "o ha yo u", hiragana: "おはよう", english: "Good morning" },
      { romaji: "mi zu", hiragana: "みず", english: "Water", imageUrl: img("water") },
      { romaji: "su shi", hiragana: "すし", english: "Sushi", imageUrl: img("sushi") },
      { romaji: "o cha", hiragana: "おちゃ", english: "Tea", imageUrl: img("tea") },
      { romaji: "go ha n", hiragana: "ごはん", english: "Rice / Meal", imageUrl: img("rice") },
      { romaji: "a ri ga to u", hiragana: "ありがとう", english: "Thank you" },
      { romaji: "su mi ma se n", hiragana: "すみません", english: "Excuse me / Sorry" },
      { romaji: "wa ta shi", hiragana: "わたし", english: "I / Me" },
      { romaji: "ko re", hiragana: "これ", english: "This" },
      { romaji: "o i shi i", hiragana: "おいしい", english: "Delicious" },
      { romaji: "ho n", hiragana: "ほん", english: "Book", imageUrl: img("book") },
      { romaji: "e ki", hiragana: "えき", english: "Train station", imageUrl: img("station") },
      { romaji: "i chi", hiragana: "いち", english: "One" },
      { romaji: "ju u", hiragana: "じゅう", english: "Ten" },
    ],
    sentences: [
      {
        romaji: "mi zu o ku da sa i",
        hiragana: "みずをください",
        english: "Water, please",
        segments: [
          { romaji: "mi zu", hiragana: "みず", english: "water" },
          { romaji: "o", hiragana: "を", english: "object marker" },
          { romaji: "ku da sa i", hiragana: "ください", english: "please" },
        ],
      },
      {
        romaji: "su shi ga o i shi i de su",
        hiragana: "すしがおいしいです",
        english: "Sushi is delicious",
        segments: [
          { romaji: "su shi", hiragana: "すし", english: "sushi" },
          { romaji: "ga", hiragana: "が", english: "subject marker" },
          { romaji: "o i shi i", hiragana: "おいしい", english: "delicious" },
          { romaji: "de su", hiragana: "です", english: "is" },
        ],
      },
      {
        romaji: "e ki wa do ko de su ka",
        hiragana: "えきはどこですか",
        english: "Where is the train station?",
        segments: [
          { romaji: "e ki", hiragana: "えき", english: "station" },
          { romaji: "wa", hiragana: "は", english: "topic marker" },
          { romaji: "do ko", hiragana: "どこ", english: "where" },
          { romaji: "de su ka", hiragana: "ですか", english: "is it?" },
        ],
      },
      {
        romaji: "wa ta shi wa o cha ga su ki de su",
        hiragana: "わたしはおちゃがすきです",
        english: "I like tea",
        segments: [
          { romaji: "wa ta shi", hiragana: "わたし", english: "I" },
          { romaji: "wa", hiragana: "は", english: "topic marker" },
          { romaji: "o cha", hiragana: "おちゃ", english: "tea" },
          { romaji: "ga", hiragana: "が", english: "subject marker" },
          { romaji: "su ki", hiragana: "すき", english: "like" },
          { romaji: "de su", hiragana: "です", english: "is" },
        ],
      },
      {
        romaji: "ko re wa ho n de su",
        hiragana: "これはほんです",
        english: "This is a book",
        segments: [
          { romaji: "ko re", hiragana: "これ", english: "this" },
          { romaji: "wa", hiragana: "は", english: "topic marker" },
          { romaji: "ho n", hiragana: "ほん", english: "book" },
          { romaji: "de su", hiragana: "です", english: "is" },
        ],
      },
    ],
    grammarNotes: [],
    isCumulativeReview: true,
  },
];

export function getAllVocab(): VocabItem[] {
  return CURRICULUM.filter((d) => !d.isRegularTest).flatMap((d) => d.vocab);
}

export function getAllSentences(): SentenceItem[] {
  return CURRICULUM.filter((d) => !d.isRegularTest).flatMap((d) => d.sentences);
}

export function getVocabUpToDay(maxDay: number): VocabItem[] {
  return CURRICULUM.filter((d) => d.day <= maxDay && !d.isRegularTest).flatMap((d) => d.vocab);
}

export function getSentencesUpToDay(maxDay: number): SentenceItem[] {
  return CURRICULUM.filter((d) => d.day <= maxDay && !d.isRegularTest).flatMap((d) => d.sentences);
}

export interface HiraganaChar {
  char: string;
  romaji: string;
}

export function getHiraganaCharsUpToDay(maxDay: number): HiraganaChar[] {
  const seen = new Map<string, string>();
  for (const d of CURRICULUM) {
    if (d.day > maxDay) break;
    for (const v of d.vocab) {
      const rmParts = v.romaji.split(" ");
      let rmIdx = 0;
      for (let i = 0; i < v.hiragana.length; i++) {
        const ch = v.hiragana[i];
        if (/[ぁ-ゟ]/.test(ch) && !seen.has(ch)) {
          const rm = rmParts[rmIdx] ?? rmParts[rmParts.length - 1] ?? "";
          seen.set(ch, rm);
        }
        rmIdx++;
      }
    }
  }
  return Array.from(seen.entries()).map(([char, romaji]) => ({ char, romaji }));
}

export function getHiraganaUpToDay(maxDay: number): string[] {
  return getHiraganaCharsUpToDay(maxDay).map((c) => c.char);
}

// ---------- Full Gojūon chart data ----------

export interface GojuonRow {
  label: string;
  chars: { char: string; romaji: string }[];
}

export const GOJUON_PLAIN_ROWS: GojuonRow[] = [
  { label: "Vowels", chars: [
    { char: "あ", romaji: "a" }, { char: "い", romaji: "i" }, { char: "う", romaji: "u" }, { char: "え", romaji: "e" }, { char: "お", romaji: "o" },
  ]},
  { label: "K", chars: [
    { char: "か", romaji: "ka" }, { char: "き", romaji: "ki" }, { char: "く", romaji: "ku" }, { char: "け", romaji: "ke" }, { char: "こ", romaji: "ko" },
  ]},
  { label: "S", chars: [
    { char: "さ", romaji: "sa" }, { char: "し", romaji: "shi" }, { char: "す", romaji: "su" }, { char: "せ", romaji: "se" }, { char: "そ", romaji: "so" },
  ]},
  { label: "T", chars: [
    { char: "た", romaji: "ta" }, { char: "ち", romaji: "chi" }, { char: "つ", romaji: "tsu" }, { char: "て", romaji: "te" }, { char: "と", romaji: "to" },
  ]},
  { label: "N", chars: [
    { char: "な", romaji: "na" }, { char: "に", romaji: "ni" }, { char: "ぬ", romaji: "nu" }, { char: "ね", romaji: "ne" }, { char: "の", romaji: "no" },
  ]},
  { label: "H", chars: [
    { char: "は", romaji: "ha" }, { char: "ひ", romaji: "hi" }, { char: "ふ", romaji: "fu" }, { char: "へ", romaji: "he" }, { char: "ほ", romaji: "ho" },
  ]},
  { label: "M", chars: [
    { char: "ま", romaji: "ma" }, { char: "み", romaji: "mi" }, { char: "む", romaji: "mu" }, { char: "め", romaji: "me" }, { char: "も", romaji: "mo" },
  ]},
  { label: "Y", chars: [
    { char: "や", romaji: "ya" }, { char: "", romaji: "" }, { char: "ゆ", romaji: "yu" }, { char: "", romaji: "" }, { char: "よ", romaji: "yo" },
  ]},
  { label: "R", chars: [
    { char: "ら", romaji: "ra" }, { char: "り", romaji: "ri" }, { char: "る", romaji: "ru" }, { char: "れ", romaji: "re" }, { char: "ろ", romaji: "ro" },
  ]},
  { label: "W", chars: [
    { char: "わ", romaji: "wa" }, { char: "", romaji: "" }, { char: "", romaji: "" }, { char: "", romaji: "" }, { char: "を", romaji: "wo" },
  ]},
  { label: "Nn", chars: [
    { char: "ん", romaji: "n" }, { char: "", romaji: "" }, { char: "", romaji: "" }, { char: "", romaji: "" }, { char: "", romaji: "" },
  ]},
];

export const GOJUON_DAKUTEN_ROWS: GojuonRow[] = [
  { label: "G", chars: [
    { char: "が", romaji: "ga" }, { char: "ぎ", romaji: "gi" }, { char: "ぐ", romaji: "gu" }, { char: "げ", romaji: "ge" }, { char: "ご", romaji: "go" },
  ]},
  { label: "Z", chars: [
    { char: "ざ", romaji: "za" }, { char: "じ", romaji: "ji" }, { char: "ず", romaji: "zu" }, { char: "ぜ", romaji: "ze" }, { char: "ぞ", romaji: "zo" },
  ]},
  { label: "D", chars: [
    { char: "だ", romaji: "da" }, { char: "ぢ", romaji: "ji" }, { char: "づ", romaji: "zu" }, { char: "で", romaji: "de" }, { char: "ど", romaji: "do" },
  ]},
  { label: "B", chars: [
    { char: "ば", romaji: "ba" }, { char: "び", romaji: "bi" }, { char: "ぶ", romaji: "bu" }, { char: "べ", romaji: "be" }, { char: "ぼ", romaji: "bo" },
  ]},
  { label: "P", chars: [
    { char: "ぱ", romaji: "pa" }, { char: "ぴ", romaji: "pi" }, { char: "ぷ", romaji: "pu" }, { char: "ぺ", romaji: "pe" }, { char: "ぽ", romaji: "po" },
  ]},
];

export const PARTICLE_EXCEPTIONS: Record<string, string> = {
  "は": "Note: は is read as 'wa' when used as a topic particle.",
  "を": "Note: を is read as 'o' when used as a direct object particle.",
  "へ": "Note: へ is read as 'e' when used as a direction particle.",
};

// ---------- Particles reference ----------

export interface ParticleEntry {
  hiragana: string;
  romaji: string;
  useCase: string;
  exampleHiragana: string;
  exampleRomaji: string;
  exampleEnglish: string;
}

export const PARTICLES_REFERENCE: ParticleEntry[] = [
  { hiragana: "は", romaji: "wa", useCase: "Topic Marker", exampleHiragana: "これはすしです", exampleRomaji: "ko re wa su shi de su", exampleEnglish: "This is sushi" },
  { hiragana: "が", romaji: "ga", useCase: "Subject Marker", exampleHiragana: "すしがおいしいです", exampleRomaji: "su shi ga o i shi i de su", exampleEnglish: "Sushi is delicious" },
  { hiragana: "を", romaji: "o", useCase: "Direct Object Marker", exampleHiragana: "みずをください", exampleRomaji: "mi zu o ku da sa i", exampleEnglish: "Water, please" },
  { hiragana: "に", romaji: "ni", useCase: "Location / Direction", exampleHiragana: "ほんはここにあります", exampleRomaji: "ho n wa ko ko ni a ri ma su", exampleEnglish: "The book is here" },
  { hiragana: "で", romaji: "de", useCase: "Means / Location of Action", exampleHiragana: "えきで", exampleRomaji: "e ki de", exampleEnglish: "at the station" },
  { hiragana: "と", romaji: "to", useCase: "And / With", exampleHiragana: "みずとおちゃ", exampleRomaji: "mi zu to o cha", exampleEnglish: "water and tea" },
  { hiragana: "か", romaji: "ka", useCase: "Question Marker", exampleHiragana: "これはすしですか", exampleRomaji: "ko re wa su shi de su ka", exampleEnglish: "Is this sushi?" },
  { hiragana: "へ", romaji: "e", useCase: "Direction Particle", exampleHiragana: "えきへ", exampleRomaji: "e ki e", exampleEnglish: "to the station" },
];
