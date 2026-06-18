export type ExerciseType =
  | 'fill_blank'
  | 'translation'
  | 'multiple_choice'
  | 'error_correction'
  | 'conjugation'
  | 'reading'
  | 'vocabulary'
  | 'conversation'
  | 'article';

export type Difficulty = 'B1' | 'B2';

export interface FillBlankItem {
  before: string;
  answer: string;
  after: string;
  hint?: string;
}

export interface FillBlankExercise {
  type: 'fill_blank';
  title: string;
  topic: string;
  instruction: string;
  items: FillBlankItem[];
  explanation: string;
}

export interface TranslationItem {
  source: string;
  answer: string;
  alternatives?: string[];
}

export interface TranslationExercise {
  type: 'translation';
  title: string;
  direction: 'de_to_es' | 'es_to_de';
  instruction: string;
  items: TranslationItem[];
  tips: string;
}

export interface MCItem {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface MultipleChoiceExercise {
  type: 'multiple_choice';
  title: string;
  instruction: string;
  items: MCItem[];
}

export interface ErrorCorrectionItem {
  incorrect: string;
  correct: string;
  errorType: string;
  explanation: string;
}

export interface ErrorCorrectionExercise {
  type: 'error_correction';
  title: string;
  instruction: string;
  items: ErrorCorrectionItem[];
}

export interface ConjugationSection {
  tense: string;
  tenseName_de: string;
  pronouns: string[];
  answers: string[];
  notes?: string;
}

export interface ConjugationExercise {
  type: 'conjugation';
  title: string;
  verb: string;
  instruction: string;
  sections: ConjugationSection[];
}

export interface ReadingQuestion {
  question: string;
  answer: string;
  type: 'open';
}

export interface ReadingExercise {
  type: 'reading';
  title: string;
  text: string;
  instruction: string;
  questions: ReadingQuestion[];
}

export interface VocabItem {
  word: string;
  gender?: 'm' | 'f';
  plural?: string;
  translation: string;
  example_es: string;
  example_de: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'expression' | 'adverb';
}

export interface VocabularyExercise {
  type: 'vocabulary';
  title: string;
  topic: string;
  instruction: string;
  items: VocabItem[];
}

export interface ConversationExercise {
  type: 'conversation';
  title: string;
  scenario: string;
  scenario_de: string;
  userRole: string;
  assistantRole: string;
  openingMessage: string;
  vocabularyHints: { word: string; translation: string }[];
}

export type Exercise =
  | FillBlankExercise
  | TranslationExercise
  | MultipleChoiceExercise
  | ErrorCorrectionExercise
  | ConjugationExercise
  | ReadingExercise
  | VocabularyExercise
  | ConversationExercise;

export type VocabStatus = 'wiederholen' | 'bekannt'; // kept for legacy migration reads

export interface VocabEntry {
  id: string;
  word: string;
  gender?: string;
  translation: string;
  example?: string;
  topic?: string;
  addedAt: string;
  reviewCount: number;
  lastReviewed?: string;
  status?: VocabStatus; // legacy — still read for migration, new writes use level/nextReview
  level?: number;       // 0 = new (unused in DB), 1–4 = learning, 5 = bekannt
  nextReview?: string;  // ISO date; when past (or absent) the word is due for review
}

export interface ProgressStats {
  exercisesCompleted: number;
  correctAnswers: number;
  totalAnswers: number;
  streak: number;
  lastActivity: string;
  exercisesByType: Partial<Record<ExerciseType, number>>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConjugationMistake {
  pronoun: string;
  correct: string;
  userAnswer: string;
}

export interface ConjugationSectionRecord {
  tense: string;
  tenseName_de: string;
  pronouns: string[];
  correctAnswers: string[];
  totalAttempts: number;
  totalCorrect: number;
  totalQuestions: number;
  recentMistakes: ConjugationMistake[];
}

export interface ConjugationRecord {
  id: string;           // verb infinitive
  verb: string;
  sections: ConjugationSectionRecord[];
  totalAttempts: number;
  lastAttempted: string;
  mastered: boolean;    // true when all sections had 0 mistakes in last attempt
}

// ─── Articles (German declension practice for es_to_de learners) ───────────────

export interface ArticleItem {
  before: string;          // sentence text before the blank
  answer: string;          // correct form, e.g. "dem"
  after: string;           // sentence text after the blank
  options: string[];       // 3–4 choices for multiple-choice mode (must include answer)
  alternatives?: string[]; // other accepted typed answers (only for genuine ambiguity)
  hint_es: string;         // short Spanish reason, e.g. "Dativo (objeto indirecto), masculino"
}

export interface ArticleExercise {
  type: 'article';
  topicId: string;
  title: string;           // German topic name
  title_es: string;        // Spanish topic name
  instruction: string;     // Spanish instruction
  explanation_es: string;  // Spanish grammar explanation (shown after checking)
  items: ArticleItem[];
}

// A practiceable topic: either curated (in article-catalog) or AI-generated and
// saved per-user. `generated` marks the latter so the UI can label them.
export interface ArticleTopic {
  id: string;
  title: string;           // German topic name
  title_es: string;        // Spanish topic name
  instruction: string;     // Spanish instruction shown above the items
  explanation_es: string;  // Spanish grammar explanation shown after checking
  items: ArticleItem[];
  generated?: boolean;
}

export interface ArticleMistake {
  prompt: string;          // the sentence with a "___" marking the blank
  correct: string;
  userAnswer: string;
}

export interface ArticleRecord {
  id: string;              // topicId
  topic: string;           // German name
  topic_es: string;        // Spanish name
  totalAttempts: number;
  totalCorrect: number;
  totalQuestions: number;
  recentMistakes: ArticleMistake[];
  lastAttempted: string;
  mastered: boolean;       // true when last attempt had 0 mistakes
}

// ─── The Race (cross-user competitive vocab leaderboard) ───────────────────────

// One global row (id='global'). Past-day counts can't be reconstructed from the
// vocab table (last_reviewed is overwritten), so we snapshot each day's live count
// and settle finished days into cumulative points lazily on read.
export interface RaceState {
  points: Record<string, number>;                       // cumulative per user_id (may be fractional)
  dailyCounts: Record<string, Record<string, number>>;  // 'YYYY-MM-DD' -> { user_id: count }
  settledDates: string[];                               // days already folded into points
}

export interface RaceRacer {
  id: string;
  name: string;
  points: number;       // cumulative
  todayCount: number;   // distinct words practiced today
  todayPoints: number;  // points they'd earn if the day ended now
}

export interface RaceResponse {
  goal: number;
  today: string;
  racers: RaceRacer[];  // sorted by points desc
  winnerId: string | null;
}
