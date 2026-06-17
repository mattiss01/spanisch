export type ExerciseType =
  | 'fill_blank'
  | 'translation'
  | 'multiple_choice'
  | 'error_correction'
  | 'conjugation'
  | 'reading'
  | 'vocabulary'
  | 'conversation';

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
