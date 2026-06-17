import { ConjugationExercise } from './types';

export interface GermanCatalogVerb {
  infinitive: string;
  es: string; // Spanish translation
  praesens: [string, string, string, string, string, string];
  notes?: string;
}

export const DE_PRONOUNS = ['ich', 'du', 'er / sie / es', 'wir', 'ihr', 'sie / Sie'] as const;

export const VERB_CATALOG_DE: GermanCatalogVerb[] = [
  // ── Hilfsverben ───────────────────────────────────────────────────────────
  {
    infinitive: 'sein',
    es: 'ser / estar',
    praesens: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'],
    notes: 'Stark unregelmäßig',
  },
  {
    infinitive: 'haben',
    es: 'tener / haber',
    praesens: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'],
  },
  {
    infinitive: 'werden',
    es: 'volverse / convertirse (también auxiliar de futuro)',
    praesens: ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'],
  },

  // ── Modalverben ───────────────────────────────────────────────────────────
  {
    infinitive: 'können',
    es: 'poder',
    praesens: ['kann', 'kannst', 'kann', 'können', 'könnt', 'können'],
    notes: 'Modalverb – ich/er/sie identisch',
  },
  {
    infinitive: 'müssen',
    es: 'tener que / deber',
    praesens: ['muss', 'musst', 'muss', 'müssen', 'müsst', 'müssen'],
    notes: 'Modalverb',
  },
  {
    infinitive: 'wollen',
    es: 'querer',
    praesens: ['will', 'willst', 'will', 'wollen', 'wollt', 'wollen'],
    notes: 'Modalverb',
  },
  {
    infinitive: 'dürfen',
    es: 'poder (permiso) / tener permitido',
    praesens: ['darf', 'darfst', 'darf', 'dürfen', 'dürft', 'dürfen'],
    notes: 'Modalverb',
  },
  {
    infinitive: 'sollen',
    es: 'deber (obligación ajena)',
    praesens: ['soll', 'sollst', 'soll', 'sollen', 'sollt', 'sollen'],
    notes: 'Modalverb',
  },
  {
    infinitive: 'mögen',
    es: 'gustar / querer',
    praesens: ['mag', 'magst', 'mag', 'mögen', 'mögt', 'mögen'],
    notes: 'Modalverb',
  },
  {
    infinitive: 'möchten',
    es: 'quisiera / me gustaría',
    praesens: ['möchte', 'möchtest', 'möchte', 'möchten', 'möchtet', 'möchten'],
    notes: 'Konjunktiv II von mögen',
  },

  // ── Starke Verben (Vokalwechsel) ──────────────────────────────────────────
  {
    infinitive: 'gehen',
    es: 'ir / caminar',
    praesens: ['gehe', 'gehst', 'geht', 'gehen', 'geht', 'gehen'],
  },
  {
    infinitive: 'kommen',
    es: 'venir / llegar',
    praesens: ['komme', 'kommst', 'kommt', 'kommen', 'kommt', 'kommen'],
  },
  {
    infinitive: 'fahren',
    es: 'ir (en vehículo) / conducir',
    praesens: ['fahre', 'fährst', 'fährt', 'fahren', 'fahrt', 'fahren'],
    notes: 'Vokalwechsel a → ä (du/er)',
  },
  {
    infinitive: 'laufen',
    es: 'correr / caminar',
    praesens: ['laufe', 'läufst', 'läuft', 'laufen', 'lauft', 'laufen'],
    notes: 'Vokalwechsel au → äu (du/er)',
  },
  {
    infinitive: 'sehen',
    es: 'ver',
    praesens: ['sehe', 'siehst', 'sieht', 'sehen', 'seht', 'sehen'],
    notes: 'Vokalwechsel e → ie (du/er)',
  },
  {
    infinitive: 'lesen',
    es: 'leer',
    praesens: ['lese', 'liest', 'liest', 'lesen', 'lest', 'lesen'],
    notes: 'Vokalwechsel e → ie (du/er)',
  },
  {
    infinitive: 'sprechen',
    es: 'hablar',
    praesens: ['spreche', 'sprichst', 'spricht', 'sprechen', 'sprecht', 'sprechen'],
    notes: 'Vokalwechsel e → i (du/er)',
  },
  {
    infinitive: 'essen',
    es: 'comer',
    praesens: ['esse', 'isst', 'isst', 'essen', 'esst', 'essen'],
    notes: 'Vokalwechsel e → i (du/er)',
  },
  {
    infinitive: 'trinken',
    es: 'beber',
    praesens: ['trinke', 'trinkst', 'trinkt', 'trinken', 'trinkt', 'trinken'],
  },
  {
    infinitive: 'geben',
    es: 'dar',
    praesens: ['gebe', 'gibst', 'gibt', 'geben', 'gebt', 'geben'],
    notes: 'Vokalwechsel e → i (du/er)',
  },
  {
    infinitive: 'nehmen',
    es: 'tomar / coger',
    praesens: ['nehme', 'nimmst', 'nimmt', 'nehmen', 'nehmt', 'nehmen'],
    notes: 'Vokalwechsel e → i + mm (du/er)',
  },
  {
    infinitive: 'helfen',
    es: 'ayudar',
    praesens: ['helfe', 'hilfst', 'hilft', 'helfen', 'helft', 'helfen'],
    notes: 'Vokalwechsel e → i (du/er)',
  },
  {
    infinitive: 'schlafen',
    es: 'dormir',
    praesens: ['schlafe', 'schläfst', 'schläft', 'schlafen', 'schlaft', 'schlafen'],
    notes: 'Vokalwechsel a → ä (du/er)',
  },
  {
    infinitive: 'tragen',
    es: 'llevar / cargar',
    praesens: ['trage', 'trägst', 'trägt', 'tragen', 'tragt', 'tragen'],
    notes: 'Vokalwechsel a → ä (du/er)',
  },
  {
    infinitive: 'waschen',
    es: 'lavar',
    praesens: ['wasche', 'wäschst', 'wäscht', 'waschen', 'wascht', 'waschen'],
    notes: 'Vokalwechsel a → ä (du/er)',
  },
  {
    infinitive: 'fallen',
    es: 'caer',
    praesens: ['falle', 'fällst', 'fällt', 'fallen', 'fallt', 'fallen'],
    notes: 'Vokalwechsel a → ä (du/er)',
  },
  {
    infinitive: 'wissen',
    es: 'saber',
    praesens: ['weiß', 'weißt', 'weiß', 'wissen', 'wisst', 'wissen'],
    notes: 'Stark unregelmäßig',
  },
  {
    infinitive: 'schreiben',
    es: 'escribir',
    praesens: ['schreibe', 'schreibst', 'schreibt', 'schreiben', 'schreibt', 'schreiben'],
  },
  {
    infinitive: 'stehen',
    es: 'estar de pie',
    praesens: ['stehe', 'stehst', 'steht', 'stehen', 'steht', 'stehen'],
  },
  {
    infinitive: 'treffen',
    es: 'encontrar / quedar con',
    praesens: ['treffe', 'triffst', 'trifft', 'treffen', 'trefft', 'treffen'],
    notes: 'Vokalwechsel e → i (du/er)',
  },
  {
    infinitive: 'werfen',
    es: 'lanzar / tirar',
    praesens: ['werfe', 'wirfst', 'wirft', 'werfen', 'werft', 'werfen'],
    notes: 'Vokalwechsel e → i (du/er)',
  },
  {
    infinitive: 'wachsen',
    es: 'crecer',
    praesens: ['wachse', 'wächst', 'wächst', 'wachsen', 'wachst', 'wachsen'],
    notes: 'Vokalwechsel a → ä (du/er)',
  },

  // ── Trennbare Verben ──────────────────────────────────────────────────────
  {
    infinitive: 'aufstehen',
    es: 'levantarse',
    praesens: ['stehe auf', 'stehst auf', 'steht auf', 'stehen auf', 'steht auf', 'stehen auf'],
    notes: 'Trennbares Verb: Präfix steht am Satzende',
  },
  {
    infinitive: 'anfangen',
    es: 'empezar / comenzar',
    praesens: ['fange an', 'fängst an', 'fängt an', 'fangen an', 'fangt an', 'fangen an'],
    notes: 'Trennbar + Vokalwechsel a → ä',
  },
  {
    infinitive: 'anrufen',
    es: 'llamar (por teléfono)',
    praesens: ['rufe an', 'rufst an', 'ruft an', 'rufen an', 'ruft an', 'rufen an'],
    notes: 'Trennbares Verb',
  },
  {
    infinitive: 'einkaufen',
    es: 'hacer la compra / comprar',
    praesens: ['kaufe ein', 'kaufst ein', 'kauft ein', 'kaufen ein', 'kauft ein', 'kaufen ein'],
    notes: 'Trennbares Verb',
  },
  {
    infinitive: 'mitkommen',
    es: 'venir también / acompañar',
    praesens: ['komme mit', 'kommst mit', 'kommt mit', 'kommen mit', 'kommt mit', 'kommen mit'],
    notes: 'Trennbares Verb',
  },
  {
    infinitive: 'abfahren',
    es: 'salir (en vehículo) / partir',
    praesens: ['fahre ab', 'fährst ab', 'fährt ab', 'fahren ab', 'fahrt ab', 'fahren ab'],
    notes: 'Trennbar + Vokalwechsel a → ä',
  },
  {
    infinitive: 'aufmachen',
    es: 'abrir',
    praesens: ['mache auf', 'machst auf', 'macht auf', 'machen auf', 'macht auf', 'machen auf'],
    notes: 'Trennbares Verb',
  },
  {
    infinitive: 'vorstellen',
    es: 'presentar / imaginarse',
    praesens: ['stelle vor', 'stellst vor', 'stellt vor', 'stellen vor', 'stellt vor', 'stellen vor'],
    notes: 'Trennbares Verb',
  },
  {
    infinitive: 'einladen',
    es: 'invitar',
    praesens: ['lade ein', 'lädst ein', 'lädt ein', 'laden ein', 'ladet ein', 'laden ein'],
    notes: 'Trennbar + Vokalwechsel a → ä (du/er)',
  },
  {
    infinitive: 'zurückkommen',
    es: 'volver / regresar',
    praesens: ['komme zurück', 'kommst zurück', 'kommt zurück', 'kommen zurück', 'kommt zurück', 'kommen zurück'],
    notes: 'Trennbares Verb',
  },

  // ── Schwache Verben (regelmäßig) ──────────────────────────────────────────
  {
    infinitive: 'machen',
    es: 'hacer',
    praesens: ['mache', 'machst', 'macht', 'machen', 'macht', 'machen'],
  },
  {
    infinitive: 'sagen',
    es: 'decir',
    praesens: ['sage', 'sagst', 'sagt', 'sagen', 'sagt', 'sagen'],
  },
  {
    infinitive: 'fragen',
    es: 'preguntar',
    praesens: ['frage', 'fragst', 'fragt', 'fragen', 'fragt', 'fragen'],
  },
  {
    infinitive: 'kaufen',
    es: 'comprar',
    praesens: ['kaufe', 'kaufst', 'kauft', 'kaufen', 'kauft', 'kaufen'],
  },
  {
    infinitive: 'spielen',
    es: 'jugar / tocar (instrumento)',
    praesens: ['spiele', 'spielst', 'spielt', 'spielen', 'spielt', 'spielen'],
  },
  {
    infinitive: 'lernen',
    es: 'aprender',
    praesens: ['lerne', 'lernst', 'lernt', 'lernen', 'lernt', 'lernen'],
  },
  {
    infinitive: 'arbeiten',
    es: 'trabajar',
    praesens: ['arbeite', 'arbeitest', 'arbeitet', 'arbeiten', 'arbeitet', 'arbeiten'],
    notes: 'e-Einschub bei du/er/ihr wegen Stamm auf -t',
  },
  {
    infinitive: 'wohnen',
    es: 'vivir / residir',
    praesens: ['wohne', 'wohnst', 'wohnt', 'wohnen', 'wohnt', 'wohnen'],
  },
  {
    infinitive: 'hören',
    es: 'escuchar / oír',
    praesens: ['höre', 'hörst', 'hört', 'hören', 'hört', 'hören'],
  },
  {
    infinitive: 'kochen',
    es: 'cocinar',
    praesens: ['koche', 'kochst', 'kocht', 'kochen', 'kocht', 'kochen'],
  },
  {
    infinitive: 'denken',
    es: 'pensar / creer',
    praesens: ['denke', 'denkst', 'denkt', 'denken', 'denkt', 'denken'],
  },
  {
    infinitive: 'kennen',
    es: 'conocer',
    praesens: ['kenne', 'kennst', 'kennt', 'kennen', 'kennt', 'kennen'],
    notes: 'Mischverb (unr. Präteritum, aber regelmäßiges Präsens)',
  },
  {
    infinitive: 'lieben',
    es: 'amar / querer',
    praesens: ['liebe', 'liebst', 'liebt', 'lieben', 'liebt', 'lieben'],
  },
  {
    infinitive: 'leben',
    es: 'vivir',
    praesens: ['lebe', 'lebst', 'lebt', 'leben', 'lebt', 'leben'],
  },
  {
    infinitive: 'warten',
    es: 'esperar',
    praesens: ['warte', 'wartest', 'wartet', 'warten', 'wartet', 'warten'],
    notes: 'e-Einschub wegen Stamm auf -t',
  },
  {
    infinitive: 'öffnen',
    es: 'abrir',
    praesens: ['öffne', 'öffnest', 'öffnet', 'öffnen', 'öffnet', 'öffnen'],
    notes: 'e-Einschub wegen Stamm auf -n',
  },
  {
    infinitive: 'suchen',
    es: 'buscar',
    praesens: ['suche', 'suchst', 'sucht', 'suchen', 'sucht', 'suchen'],
  },
  {
    infinitive: 'finden',
    es: 'encontrar',
    praesens: ['finde', 'findest', 'findet', 'finden', 'findet', 'finden'],
    notes: 'e-Einschub wegen Stamm auf -nd',
  },
];

export function germanVerbToExercise(verb: GermanCatalogVerb): ConjugationExercise {
  return {
    type: 'conjugation',
    title: `${verb.infinitive} — ${verb.es}`,
    verb: verb.infinitive,
    instruction: `Konjugiere das Verb „${verb.infinitive}" (${verb.es}) im Präsens.`,
    sections: [
      {
        tense: 'praesens',
        tenseName_de: 'Präsens',
        pronouns: [...DE_PRONOUNS],
        answers: [...verb.praesens],
        notes: verb.notes,
      },
    ],
  };
}

export function pickNextGermanVerb(knownVerbs: string[]): GermanCatalogVerb {
  const known = new Set(knownVerbs.map(v => v.toLowerCase()));
  const unseen = VERB_CATALOG_DE.filter(v => !known.has(v.infinitive.toLowerCase()));
  const pool = unseen.length > 0 ? unseen : VERB_CATALOG_DE;
  return pool[Math.floor(Math.random() * Math.min(pool.length, 5))];
}

export function findGermanVerb(infinitive: string): GermanCatalogVerb | null {
  return VERB_CATALOG_DE.find(v => v.infinitive.toLowerCase() === infinitive.toLowerCase()) ?? null;
}
