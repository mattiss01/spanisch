import { ArticleExercise, ArticleTopic } from './types';

// Curated catalog of German declension topics for Spanish-speaking learners
// (the `es_to_de` direction, i.e. Marina). Each topic groups several cloze
// items where the surrounding context forces a single correct article/pronoun.
// All hints and instructions are in Spanish.

export const ARTICLE_CATALOG: ArticleTopic[] = [
  // ── Bestimmte Artikel ───────────────────────────────────────────────────
  {
    id: 'def-nominativ',
    title: 'Bestimmte Artikel – Nominativ',
    title_es: 'Artículo definido – Nominativo (sujeto)',
    instruction: 'El sujeto de la frase va en nominativo. Elige der / die / das según el género.',
    explanation_es:
      'En nominativo (el sujeto que realiza la acción): masculino = der, femenino = die, neutro = das, plural = die.',
    items: [
      { before: 'Hier arbeitet ', answer: 'der', after: ' Mann.', options: ['der', 'die', 'das', 'den'], hint_es: 'Nominativo, masculino: der Mann' },
      { before: 'Dort liest ', answer: 'die', after: ' Frau.', options: ['der', 'die', 'das', 'den'], hint_es: 'Nominativo, femenino: die Frau' },
      { before: 'Im Garten spielt ', answer: 'das', after: ' Kind.', options: ['der', 'die', 'das', 'den'], hint_es: 'Nominativo, neutro: das Kind' },
      { before: 'Auf dem Sofa schläft ', answer: 'der', after: ' Hund.', options: ['der', 'die', 'das', 'den'], hint_es: 'Nominativo, masculino: der Hund' },
      { before: 'In der Schule sind ', answer: 'die', after: ' Kinder.', options: ['der', 'die', 'das', 'den'], hint_es: 'Nominativo, plural: die Kinder' },
      { before: 'Wo ist ', answer: 'das', after: ' Auto?', options: ['der', 'die', 'das', 'den'], hint_es: 'Nominativo, neutro: das Auto' },
    ],
  },
  {
    id: 'def-akkusativ',
    title: 'Bestimmte Artikel – Akkusativ',
    title_es: 'Artículo definido – Acusativo (objeto directo)',
    instruction: 'El objeto directo va en acusativo. Sólo el masculino cambia (der → den).',
    explanation_es:
      'En acusativo (el objeto directo): masculino = den, femenino = die, neutro = das, plural = die. ¡Sólo el masculino cambia respecto al nominativo!',
    items: [
      { before: 'Ich sehe ', answer: 'den', after: ' Mann.', options: ['der', 'den', 'die', 'das'], hint_es: 'Acusativo, masculino: den Mann' },
      { before: 'Sie kauft ', answer: 'die', after: ' Tasche.', options: ['der', 'den', 'die', 'das'], hint_es: 'Acusativo, femenino: die Tasche (no cambia)' },
      { before: 'Wir essen ', answer: 'das', after: ' Brot.', options: ['der', 'den', 'die', 'das'], hint_es: 'Acusativo, neutro: das Brot (no cambia)' },
      { before: 'Er liest ', answer: 'die', after: ' Zeitung.', options: ['der', 'den', 'die', 'das'], hint_es: 'Acusativo, femenino: die Zeitung' },
      { before: 'Ich besuche ', answer: 'den', after: ' Lehrer.', options: ['der', 'den', 'die', 'das'], hint_es: 'Acusativo, masculino: den Lehrer' },
      { before: 'Hast du ', answer: 'das', after: ' Auto gesehen?', options: ['der', 'den', 'die', 'das'], hint_es: 'Acusativo, neutro: das Auto' },
    ],
  },
  {
    id: 'def-dativ',
    title: 'Bestimmte Artikel – Dativ',
    title_es: 'Artículo definido – Dativo',
    instruction: 'El dativo aparece en el objeto indirecto y tras mit, zu, bei, aus, von… Elige dem / der / dem / den.',
    explanation_es:
      'En dativo: masculino = dem, femenino = der, neutro = dem, plural = den (+ -n en el sustantivo). Verbos como helfen, gehören y preposiciones como mit/aus/bei rigen dativo.',
    items: [
      { before: 'Ich gebe ', answer: 'dem', after: ' Mann das Buch.', options: ['dem', 'der', 'den', 'des'], hint_es: 'Dativo (objeto indirecto), masculino: dem Mann' },
      { before: 'Sie spricht mit ', answer: 'der', after: ' Frau.', options: ['dem', 'der', 'den', 'des'], hint_es: "Dativo tras 'mit', femenino: der Frau" },
      { before: 'Wir helfen ', answer: 'dem', after: ' Kind.', options: ['dem', 'der', 'den', 'des'], hint_es: 'Dativo, neutro: dem Kind (helfen rige dativo)' },
      { before: 'Er kommt aus ', answer: 'der', after: ' Stadt.', options: ['dem', 'der', 'den', 'des'], hint_es: "Dativo tras 'aus', femenino: der Stadt" },
      { before: 'Das Buch gehört ', answer: 'dem', after: ' Lehrer.', options: ['dem', 'der', 'den', 'des'], hint_es: 'Dativo, masculino: dem Lehrer (gehören rige dativo)' },
      { before: 'Ich fahre mit ', answer: 'den', after: ' Kindern.', options: ['dem', 'der', 'den', 'des'], hint_es: 'Dativo plural: den Kindern (+ -n)' },
    ],
  },
  {
    id: 'def-genitiv',
    title: 'Bestimmte Artikel – Genitiv',
    title_es: 'Artículo definido – Genitivo (posesión)',
    instruction: 'El genitivo expresa posesión (≈ "de…"). Elige des / der / des / der.',
    explanation_es:
      'En genitivo: masculino = des, femenino = der, neutro = des, plural = der. En masculino y neutro el sustantivo añade -s/-es (des Mannes, des Buches).',
    items: [
      { before: 'Das ist das Auto ', answer: 'des', after: ' Mannes.', options: ['des', 'der', 'dem', 'den'], hint_es: 'Genitivo, masculino: des Mannes (+ -es)' },
      { before: 'Die Farbe ', answer: 'der', after: ' Tür ist rot.', options: ['des', 'der', 'dem', 'den'], hint_es: 'Genitivo, femenino: der Tür' },
      { before: 'Der Titel ', answer: 'des', after: ' Buches ist lang.', options: ['des', 'der', 'dem', 'den'], hint_es: 'Genitivo, neutro: des Buches (+ -es)' },
      { before: 'Das Haus ', answer: 'der', after: ' Eltern ist groß.', options: ['des', 'der', 'dem', 'den'], hint_es: 'Genitivo, plural: der Eltern' },
      { before: 'Der Name ', answer: 'der', after: ' Frau ist Maria.', options: ['des', 'der', 'dem', 'den'], hint_es: 'Genitivo, femenino: der Frau' },
      { before: 'Die Tür ', answer: 'des', after: ' Hauses ist offen.', options: ['des', 'der', 'dem', 'den'], hint_es: 'Genitivo, neutro: des Hauses (+ -es)' },
    ],
  },

  // ── Possessivartikel ──────────────────────────────────────────────────────
  {
    id: 'poss-akkusativ',
    title: 'Possessivartikel – Akkusativ',
    title_es: 'Posesivos – Acusativo (mein, dein, sein…)',
    instruction: 'El sujeto indica el poseedor (ich → mein-, du → dein-…). Completa el posesivo en acusativo.',
    explanation_es:
      'Posesivos en acusativo: masculino = -en (meinen), femenino = -e (meine), neutro = sin terminación (mein), plural = -e (meine). Raíces: ich→mein, du→dein, er→sein, sie(ella)→ihr, wir→unser, ihr(vosotros)→euer.',
    items: [
      { before: 'Ich liebe ', answer: 'meine', after: ' Schwester.', options: ['mein', 'meine', 'meinen', 'meinem'], hint_es: 'ich → mein-; acusativo femenino: meine' },
      { before: 'Du suchst ', answer: 'deinen', after: ' Schlüssel.', options: ['dein', 'deine', 'deinen', 'deinem'], hint_es: 'du → dein-; acusativo masculino: deinen (+ -en)' },
      { before: 'Er besucht ', answer: 'seine', after: ' Eltern.', options: ['sein', 'seine', 'seinen', 'seinem'], hint_es: 'er → sein-; acusativo plural: seine' },
      { before: 'Sie liest ', answer: 'ihr', after: ' Buch.', options: ['ihr', 'ihre', 'ihren', 'ihrem'], hint_es: 'sie (ella) → ihr-; acusativo neutro: ihr (sin terminación)' },
      { before: 'Wir verkaufen ', answer: 'unser', after: ' Auto.', options: ['unser', 'unsere', 'unseren', 'unserem'], hint_es: 'wir → unser-; acusativo neutro: unser' },
      { before: 'Habt ihr ', answer: 'euren', after: ' Hund gefüttert?', options: ['euer', 'eure', 'euren', 'eurem'], hint_es: 'ihr (vosotros) → euer-; acusativo masculino: euren' },
    ],
  },
  {
    id: 'poss-dativ',
    title: 'Possessivartikel – Dativ',
    title_es: 'Posesivos – Dativo (mit meinem…)',
    instruction: 'Posesivos en dativo, tras preposiciones (mit, bei) o verbos de dativo (helfen, danken).',
    explanation_es:
      'Posesivos en dativo: masculino/neutro = -em (meinem), femenino = -er (meiner), plural = -en (meinen, + -n en el sustantivo).',
    items: [
      { before: 'Ich fahre mit ', answer: 'meinem', after: ' Bruder.', options: ['mein', 'meinem', 'meiner', 'meinen'], hint_es: "ich → mein-; dativo masculino: meinem (tras 'mit')" },
      { before: 'Du spielst mit ', answer: 'deiner', after: ' Schwester.', options: ['dein', 'deinem', 'deiner', 'deinen'], hint_es: 'du → dein-; dativo femenino: deiner' },
      { before: 'Er wohnt bei ', answer: 'seinen', after: ' Eltern.', options: ['sein', 'seinem', 'seiner', 'seinen'], hint_es: 'er → sein-; dativo plural: seinen (+ -n)' },
      { before: 'Sie hilft ', answer: 'ihrer', after: ' Mutter.', options: ['ihr', 'ihrem', 'ihrer', 'ihren'], hint_es: 'sie (ella) → ihr-; dativo femenino: ihrer (helfen + dativo)' },
      { before: 'Wir danken ', answer: 'unserem', after: ' Lehrer.', options: ['unser', 'unserem', 'unserer', 'unseren'], hint_es: 'wir → unser-; dativo masculino: unserem (danken + dativo)' },
      { before: 'Ich gebe ', answer: 'meinem', after: ' Kind ein Geschenk.', options: ['mein', 'meinem', 'meiner', 'meinen'], hint_es: 'ich → mein-; dativo neutro: meinem' },
    ],
  },

  // ── Personalpronomen ───────────────────────────────────────────────────────
  {
    id: 'pron-akkusativ',
    title: 'Personalpronomen – Akkusativ',
    title_es: 'Pronombres personales – Acusativo (mich, dich, ihn…)',
    instruction: 'Sustituye al objeto directo por el pronombre correcto en acusativo.',
    explanation_es:
      'Pronombres en acusativo: ich→mich, du→dich, er→ihn, sie(ella)→sie, es→es, wir→uns, ihr→euch, sie(ellos)→sie.',
    items: [
      { before: 'Kannst du ', answer: 'mich', after: ' hören?', options: ['mich', 'dich', 'ihn', 'uns'], hint_es: 'a mí: mich' },
      { before: 'Ich liebe ', answer: 'dich', after: '.', options: ['mich', 'dich', 'ihn', 'sie'], hint_es: 'a ti (du): dich' },
      { before: 'Peter? Ja, wir besuchen ', answer: 'ihn', after: ' morgen.', options: ['ihn', 'sie', 'es', 'ihm'], hint_es: 'a él (Peter): ihn' },
      { before: 'Maria ist nett. Ich mag ', answer: 'sie', after: '.', options: ['ihn', 'sie', 'es', 'ihr'], hint_es: 'a ella (Maria): sie' },
      { before: 'Das Buch ist gut. Ich lese ', answer: 'es', after: ' gern.', options: ['ihn', 'sie', 'es', 'ihm'], hint_es: 'lo (el libro, neutro): es' },
      { before: 'Wir rufen laut. Hört ihr ', answer: 'uns', after: '?', options: ['uns', 'euch', 'sie', 'mich'], hint_es: 'a nosotros: uns' },
    ],
  },
  {
    id: 'pron-dativ',
    title: 'Personalpronomen – Dativ',
    title_es: 'Pronombres personales – Dativo (mir, dir, ihm…)',
    instruction: 'Sustituye al objeto indirecto por el pronombre correcto en dativo.',
    explanation_es:
      'Pronombres en dativo: ich→mir, du→dir, er→ihm, sie(ella)→ihr, es→ihm, wir→uns, ihr→euch, sie(ellos)→ihnen.',
    items: [
      { before: 'Kannst du ', answer: 'mir', after: ' helfen?', options: ['mir', 'dir', 'ihm', 'uns'], hint_es: 'a mí (dativo): mir (helfen + dativo)' },
      { before: 'Ich gebe ', answer: 'dir', after: ' das Buch.', options: ['mir', 'dir', 'ihm', 'ihr'], hint_es: 'a ti (dativo): dir' },
      { before: 'Peter ist krank. Ich helfe ', answer: 'ihm', after: '.', options: ['ihm', 'ihr', 'ihnen', 'dir'], hint_es: 'a él (Peter), dativo: ihm' },
      { before: 'Maria fragt. Ich antworte ', answer: 'ihr', after: '.', options: ['ihm', 'ihr', 'ihnen', 'dir'], hint_es: 'a ella (Maria), dativo: ihr (antworten + dativo)' },
      { before: 'Das ist unser Haus. Es gehört ', answer: 'uns', after: '.', options: ['uns', 'euch', 'ihnen', 'mir'], hint_es: 'a nosotros, dativo: uns' },
      { before: 'Die Kinder weinen. Ich gebe ', answer: 'ihnen', after: ' Schokolade.', options: ['ihm', 'ihr', 'ihnen', 'uns'], hint_es: 'a ellos, dativo: ihnen' },
    ],
  },
];

// Build a runtime exercise from a catalog topic (mirrors verbToExercise).
export function buildArticleExercise(topic: ArticleTopic): ArticleExercise {
  return {
    type: 'article',
    topicId: topic.id,
    title: topic.title,
    title_es: topic.title_es,
    instruction: topic.instruction,
    explanation_es: topic.explanation_es,
    items: topic.items,
  };
}

export function getArticleTopic(id: string): ArticleTopic | undefined {
  return ARTICLE_CATALOG.find(t => t.id === id);
}

// ── Generation foci ─────────────────────────────────────────────────────────
// Drives the "generate with AI" dropdown. `grammar_en` is injected into the Groq
// prompt to steer which case / word type the generated sentences should target.

export interface ArticleFocus {
  id: string;
  label_es: string;   // shown in the UI dropdown
  grammar_en: string; // instruction injected into the LLM prompt
}

export const ARTICLE_FOCUS: ArticleFocus[] = [
  { id: 'def-nom', label_es: 'Artículo definido – Nominativo', grammar_en: 'definite articles (der/die/das/die) in the NOMINATIVE case (the grammatical subject)' },
  { id: 'def-akk', label_es: 'Artículo definido – Acusativo', grammar_en: 'definite articles (den/die/das/die) in the ACCUSATIVE case (the direct object)' },
  { id: 'def-dat', label_es: 'Artículo definido – Dativo', grammar_en: 'definite articles (dem/der/dem/den) in the DATIVE case (indirect object, or after mit/zu/bei/aus/von, or after dative verbs like helfen/gehören)' },
  { id: 'def-gen', label_es: 'Artículo definido – Genitivo', grammar_en: 'definite articles (des/der/des/der) in the GENITIVE case (possession), adding -s/-es to masculine and neuter nouns' },
  { id: 'poss-akk', label_es: 'Posesivos – Acusativo', grammar_en: 'possessive articles (mein/dein/sein/ihr/unser/euer + endings) in the ACCUSATIVE case; the sentence subject must determine the possessor' },
  { id: 'poss-dat', label_es: 'Posesivos – Dativo', grammar_en: 'possessive articles (mein/dein/sein/ihr/unser/euer + endings) in the DATIVE case; the sentence subject must determine the possessor' },
  { id: 'pron-akk', label_es: 'Pronombres personales – Acusativo', grammar_en: 'personal pronouns in the ACCUSATIVE case (mich/dich/ihn/sie/es/uns/euch/sie), replacing a direct object' },
  { id: 'pron-dat', label_es: 'Pronombres personales – Dativo', grammar_en: 'personal pronouns in the DATIVE case (mir/dir/ihm/ihr/uns/euch/ihnen), replacing an indirect object' },
  { id: 'mixed', label_es: 'Casos mezclados', grammar_en: 'a MIX of definite articles, possessive articles and personal pronouns across the nominative, accusative and dative cases' },
];

export function getArticleFocus(id: string): ArticleFocus | undefined {
  return ARTICLE_FOCUS.find(f => f.id === id);
}
