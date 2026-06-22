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
    notes: 'Highly irregular',
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
    notes: 'Modal verb — ich/er/sie identical',
  },
  {
    infinitive: 'müssen',
    es: 'tener que / deber',
    praesens: ['muss', 'musst', 'muss', 'müssen', 'müsst', 'müssen'],
    notes: 'Modal verb',
  },
  {
    infinitive: 'wollen',
    es: 'querer',
    praesens: ['will', 'willst', 'will', 'wollen', 'wollt', 'wollen'],
    notes: 'Modal verb',
  },
  {
    infinitive: 'dürfen',
    es: 'poder (permiso) / tener permitido',
    praesens: ['darf', 'darfst', 'darf', 'dürfen', 'dürft', 'dürfen'],
    notes: 'Modal verb',
  },
  {
    infinitive: 'sollen',
    es: 'deber (obligación ajena)',
    praesens: ['soll', 'sollst', 'soll', 'sollen', 'sollt', 'sollen'],
    notes: 'Modal verb',
  },
  {
    infinitive: 'mögen',
    es: 'gustar / querer',
    praesens: ['mag', 'magst', 'mag', 'mögen', 'mögt', 'mögen'],
    notes: 'Modal verb',
  },
  {
    infinitive: 'möchten',
    es: 'quisiera / me gustaría',
    praesens: ['möchte', 'möchtest', 'möchte', 'möchten', 'möchtet', 'möchten'],
    notes: 'Konjunktiv II of mögen',
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
    notes: 'Vowel change a → ä (du/er)',
  },
  {
    infinitive: 'laufen',
    es: 'correr / caminar',
    praesens: ['laufe', 'läufst', 'läuft', 'laufen', 'lauft', 'laufen'],
    notes: 'Vowel change au → äu (du/er)',
  },
  {
    infinitive: 'sehen',
    es: 'ver',
    praesens: ['sehe', 'siehst', 'sieht', 'sehen', 'seht', 'sehen'],
    notes: 'Vowel change e → ie (du/er)',
  },
  {
    infinitive: 'lesen',
    es: 'leer',
    praesens: ['lese', 'liest', 'liest', 'lesen', 'lest', 'lesen'],
    notes: 'Vowel change e → ie (du/er)',
  },
  {
    infinitive: 'sprechen',
    es: 'hablar',
    praesens: ['spreche', 'sprichst', 'spricht', 'sprechen', 'sprecht', 'sprechen'],
    notes: 'Vowel change e → i (du/er)',
  },
  {
    infinitive: 'essen',
    es: 'comer',
    praesens: ['esse', 'isst', 'isst', 'essen', 'esst', 'essen'],
    notes: 'Vowel change e → i (du/er)',
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
    notes: 'Vowel change e → i (du/er)',
  },
  {
    infinitive: 'nehmen',
    es: 'tomar / coger',
    praesens: ['nehme', 'nimmst', 'nimmt', 'nehmen', 'nehmt', 'nehmen'],
    notes: 'Vowel change e → i, mm (du/er)',
  },
  {
    infinitive: 'helfen',
    es: 'ayudar',
    praesens: ['helfe', 'hilfst', 'hilft', 'helfen', 'helft', 'helfen'],
    notes: 'Vowel change e → i (du/er)',
  },
  {
    infinitive: 'schlafen',
    es: 'dormir',
    praesens: ['schlafe', 'schläfst', 'schläft', 'schlafen', 'schlaft', 'schlafen'],
    notes: 'Vowel change a → ä (du/er)',
  },
  {
    infinitive: 'tragen',
    es: 'llevar / cargar',
    praesens: ['trage', 'trägst', 'trägt', 'tragen', 'tragt', 'tragen'],
    notes: 'Vowel change a → ä (du/er)',
  },
  {
    infinitive: 'waschen',
    es: 'lavar',
    praesens: ['wasche', 'wäschst', 'wäscht', 'waschen', 'wascht', 'waschen'],
    notes: 'Vowel change a → ä (du/er)',
  },
  {
    infinitive: 'fallen',
    es: 'caer',
    praesens: ['falle', 'fällst', 'fällt', 'fallen', 'fallt', 'fallen'],
    notes: 'Vowel change a → ä (du/er)',
  },
  {
    infinitive: 'wissen',
    es: 'saber',
    praesens: ['weiß', 'weißt', 'weiß', 'wissen', 'wisst', 'wissen'],
    notes: 'Highly irregular',
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
    notes: 'Vowel change e → i (du/er)',
  },
  {
    infinitive: 'werfen',
    es: 'lanzar / tirar',
    praesens: ['werfe', 'wirfst', 'wirft', 'werfen', 'werft', 'werfen'],
    notes: 'Vowel change e → i (du/er)',
  },
  {
    infinitive: 'wachsen',
    es: 'crecer',
    praesens: ['wachse', 'wächst', 'wächst', 'wachsen', 'wachst', 'wachsen'],
    notes: 'Vowel change a → ä (du/er)',
  },

  // ── Trennbare Verben ──────────────────────────────────────────────────────
  {
    infinitive: 'aufstehen',
    es: 'levantarse',
    praesens: ['stehe auf', 'stehst auf', 'steht auf', 'stehen auf', 'steht auf', 'stehen auf'],
    notes: 'Separable verb: prefix moves to end of clause',
  },
  {
    infinitive: 'anfangen',
    es: 'empezar / comenzar',
    praesens: ['fange an', 'fängst an', 'fängt an', 'fangen an', 'fangt an', 'fangen an'],
    notes: 'Separable + vowel change a → ä',
  },
  {
    infinitive: 'anrufen',
    es: 'llamar (por teléfono)',
    praesens: ['rufe an', 'rufst an', 'ruft an', 'rufen an', 'ruft an', 'rufen an'],
    notes: 'Separable verb',
  },
  {
    infinitive: 'einkaufen',
    es: 'hacer la compra / comprar',
    praesens: ['kaufe ein', 'kaufst ein', 'kauft ein', 'kaufen ein', 'kauft ein', 'kaufen ein'],
    notes: 'Separable verb',
  },
  {
    infinitive: 'mitkommen',
    es: 'venir también / acompañar',
    praesens: ['komme mit', 'kommst mit', 'kommt mit', 'kommen mit', 'kommt mit', 'kommen mit'],
    notes: 'Separable verb',
  },
  {
    infinitive: 'abfahren',
    es: 'salir (en vehículo) / partir',
    praesens: ['fahre ab', 'fährst ab', 'fährt ab', 'fahren ab', 'fahrt ab', 'fahren ab'],
    notes: 'Separable + vowel change a → ä',
  },
  {
    infinitive: 'aufmachen',
    es: 'abrir',
    praesens: ['mache auf', 'machst auf', 'macht auf', 'machen auf', 'macht auf', 'machen auf'],
    notes: 'Separable verb',
  },
  {
    infinitive: 'vorstellen',
    es: 'presentar / imaginarse',
    praesens: ['stelle vor', 'stellst vor', 'stellt vor', 'stellen vor', 'stellt vor', 'stellen vor'],
    notes: 'Separable verb',
  },
  {
    infinitive: 'einladen',
    es: 'invitar',
    praesens: ['lade ein', 'lädst ein', 'lädt ein', 'laden ein', 'ladet ein', 'laden ein'],
    notes: 'Trennbar + Vowel change a → ä (du/er)',
  },
  {
    infinitive: 'zurückkommen',
    es: 'volver / regresar',
    praesens: ['komme zurück', 'kommst zurück', 'kommt zurück', 'kommen zurück', 'kommt zurück', 'kommen zurück'],
    notes: 'Separable verb',
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
    notes: 'e-insertion for du/er/ihr (stem ends in -t)',
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
    notes: 'Mixed verb (irregular preterite, regular present)',
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
    notes: 'e-insertion (stem ends in -n)',
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
    notes: 'e-insertion (stem ends in -nd)',
  },

  // ── Weitere häufige Verben ────────────────────────────────────────────────
  { infinitive: 'bleiben', es: 'quedarse', praesens: ['bleibe', 'bleibst', 'bleibt', 'bleiben', 'bleibt', 'bleiben'] },
  { infinitive: 'bringen', es: 'traer', praesens: ['bringe', 'bringst', 'bringt', 'bringen', 'bringt', 'bringen'] },
  { infinitive: 'brauchen', es: 'necesitar', praesens: ['brauche', 'brauchst', 'braucht', 'brauchen', 'braucht', 'brauchen'] },
  { infinitive: 'bezahlen', es: 'pagar', praesens: ['bezahle', 'bezahlst', 'bezahlt', 'bezahlen', 'bezahlt', 'bezahlen'] },
  { infinitive: 'bestellen', es: 'pedir / encargar', praesens: ['bestelle', 'bestellst', 'bestellt', 'bestellen', 'bestellt', 'bestellen'] },
  { infinitive: 'beginnen', es: 'empezar', praesens: ['beginne', 'beginnst', 'beginnt', 'beginnen', 'beginnt', 'beginnen'] },
  { infinitive: 'bekommen', es: 'recibir', praesens: ['bekomme', 'bekommst', 'bekommt', 'bekommen', 'bekommt', 'bekommen'] },
  { infinitive: 'verstehen', es: 'entender', praesens: ['verstehe', 'verstehst', 'versteht', 'verstehen', 'versteht', 'verstehen'] },
  { infinitive: 'vergessen', es: 'olvidar', praesens: ['vergesse', 'vergisst', 'vergisst', 'vergessen', 'vergesst', 'vergessen'], notes: 'Stamm e→i' },
  { infinitive: 'verlieren', es: 'perder', praesens: ['verliere', 'verlierst', 'verliert', 'verlieren', 'verliert', 'verlieren'] },
  { infinitive: 'gewinnen', es: 'ganar', praesens: ['gewinne', 'gewinnst', 'gewinnt', 'gewinnen', 'gewinnt', 'gewinnen'] },
  { infinitive: 'gefallen', es: 'gustar', praesens: ['gefalle', 'gefällst', 'gefällt', 'gefallen', 'gefallt', 'gefallen'], notes: 'Stamm a→ä' },
  { infinitive: 'gehören', es: 'pertenecer', praesens: ['gehöre', 'gehörst', 'gehört', 'gehören', 'gehört', 'gehören'] },
  { infinitive: 'erklären', es: 'explicar', praesens: ['erkläre', 'erklärst', 'erklärt', 'erklären', 'erklärt', 'erklären'] },
  { infinitive: 'erzählen', es: 'contar', praesens: ['erzähle', 'erzählst', 'erzählt', 'erzählen', 'erzählt', 'erzählen'] },
  { infinitive: 'antworten', es: 'responder', praesens: ['antworte', 'antwortest', 'antwortet', 'antworten', 'antwortet', 'antworten'], notes: 'Stamm auf -t → -est/-et' },
  { infinitive: 'bedeuten', es: 'significar', praesens: ['bedeute', 'bedeutest', 'bedeutet', 'bedeuten', 'bedeutet', 'bedeuten'] },
  { infinitive: 'benutzen', es: 'usar', praesens: ['benutze', 'benutzt', 'benutzt', 'benutzen', 'benutzt', 'benutzen'] },
  { infinitive: 'besuchen', es: 'visitar', praesens: ['besuche', 'besuchst', 'besucht', 'besuchen', 'besucht', 'besuchen'] },
  { infinitive: 'reisen', es: 'viajar', praesens: ['reise', 'reist', 'reist', 'reisen', 'reist', 'reisen'], notes: 'Stamm auf -s → du reist' },
  { infinitive: 'putzen', es: 'limpiar', praesens: ['putze', 'putzt', 'putzt', 'putzen', 'putzt', 'putzen'] },
  { infinitive: 'tanzen', es: 'bailar', praesens: ['tanze', 'tanzt', 'tanzt', 'tanzen', 'tanzt', 'tanzen'] },
  { infinitive: 'rauchen', es: 'fumar', praesens: ['rauche', 'rauchst', 'raucht', 'rauchen', 'raucht', 'rauchen'] },
  { infinitive: 'lachen', es: 'reír', praesens: ['lache', 'lachst', 'lacht', 'lachen', 'lacht', 'lachen'] },
  { infinitive: 'weinen', es: 'llorar', praesens: ['weine', 'weinst', 'weint', 'weinen', 'weint', 'weinen'] },
  { infinitive: 'lächeln', es: 'sonreír', praesens: ['lächle', 'lächelst', 'lächelt', 'lächeln', 'lächelt', 'lächeln'], notes: '-eln → ich lächle' },
  { infinitive: 'schenken', es: 'regalar', praesens: ['schenke', 'schenkst', 'schenkt', 'schenken', 'schenkt', 'schenken'] },
  { infinitive: 'schicken', es: 'enviar', praesens: ['schicke', 'schickst', 'schickt', 'schicken', 'schickt', 'schicken'] },
  { infinitive: 'holen', es: 'traer / ir a buscar', praesens: ['hole', 'holst', 'holt', 'holen', 'holt', 'holen'] },
  { infinitive: 'verkaufen', es: 'vender', praesens: ['verkaufe', 'verkaufst', 'verkauft', 'verkaufen', 'verkauft', 'verkaufen'] },
  { infinitive: 'mieten', es: 'alquilar', praesens: ['miete', 'mietest', 'mietet', 'mieten', 'mietet', 'mieten'] },
  { infinitive: 'studieren', es: 'estudiar', praesens: ['studiere', 'studierst', 'studiert', 'studieren', 'studiert', 'studieren'] },
  { infinitive: 'probieren', es: 'probar', praesens: ['probiere', 'probierst', 'probiert', 'probieren', 'probiert', 'probieren'] },
  { infinitive: 'telefonieren', es: 'telefonear', praesens: ['telefoniere', 'telefonierst', 'telefoniert', 'telefonieren', 'telefoniert', 'telefonieren'] },
  { infinitive: 'reparieren', es: 'reparar', praesens: ['repariere', 'reparierst', 'repariert', 'reparieren', 'repariert', 'reparieren'] },
  { infinitive: 'diskutieren', es: 'discutir', praesens: ['diskutiere', 'diskutierst', 'diskutiert', 'diskutieren', 'diskutiert', 'diskutieren'] },
  { infinitive: 'liegen', es: 'estar tumbado', praesens: ['liege', 'liegst', 'liegt', 'liegen', 'liegt', 'liegen'] },
  { infinitive: 'sitzen', es: 'estar sentado', praesens: ['sitze', 'sitzt', 'sitzt', 'sitzen', 'sitzt', 'sitzen'] },
  { infinitive: 'stellen', es: 'poner (de pie)', praesens: ['stelle', 'stellst', 'stellt', 'stellen', 'stellt', 'stellen'] },
  { infinitive: 'legen', es: 'poner (acostado)', praesens: ['lege', 'legst', 'legt', 'legen', 'legt', 'legen'] },
  { infinitive: 'setzen', es: 'sentar / colocar', praesens: ['setze', 'setzt', 'setzt', 'setzen', 'setzt', 'setzen'] },
  { infinitive: 'bauen', es: 'construir', praesens: ['baue', 'baust', 'baut', 'bauen', 'baut', 'bauen'] },
  { infinitive: 'zeigen', es: 'mostrar', praesens: ['zeige', 'zeigst', 'zeigt', 'zeigen', 'zeigt', 'zeigen'] },
  { infinitive: 'glauben', es: 'creer', praesens: ['glaube', 'glaubst', 'glaubt', 'glauben', 'glaubt', 'glauben'] },
  { infinitive: 'fliegen', es: 'volar', praesens: ['fliege', 'fliegst', 'fliegt', 'fliegen', 'fliegt', 'fliegen'] },
  { infinitive: 'schwimmen', es: 'nadar', praesens: ['schwimme', 'schwimmst', 'schwimmt', 'schwimmen', 'schwimmt', 'schwimmen'] },
  { infinitive: 'singen', es: 'cantar', praesens: ['singe', 'singst', 'singt', 'singen', 'singt', 'singen'] },
  { infinitive: 'ziehen', es: 'tirar / mudarse', praesens: ['ziehe', 'ziehst', 'zieht', 'ziehen', 'zieht', 'ziehen'] },
  { infinitive: 'schließen', es: 'cerrar', praesens: ['schließe', 'schließt', 'schließt', 'schließen', 'schließt', 'schließen'], notes: 'Stamm auf -ß → du schließt' },
  { infinitive: 'scheinen', es: 'brillar / parecer', praesens: ['scheine', 'scheinst', 'scheint', 'scheinen', 'scheint', 'scheinen'] },
  { infinitive: 'steigen', es: 'subir', praesens: ['steige', 'steigst', 'steigt', 'steigen', 'steigt', 'steigen'] },
  { infinitive: 'verbringen', es: 'pasar (tiempo)', praesens: ['verbringe', 'verbringst', 'verbringt', 'verbringen', 'verbringt', 'verbringen'] },
  { infinitive: 'mitnehmen', es: 'llevarse', praesens: ['nehme mit', 'nimmst mit', 'nimmt mit', 'nehmen mit', 'nehmt mit', 'nehmen mit'], notes: 'trennbar; Stamm e→i' },
  { infinitive: 'fernsehen', es: 'ver la televisión', praesens: ['sehe fern', 'siehst fern', 'sieht fern', 'sehen fern', 'seht fern', 'sehen fern'], notes: 'trennbar; Stamm e→ie' },
  { infinitive: 'vorbereiten', es: 'preparar', praesens: ['bereite vor', 'bereitest vor', 'bereitet vor', 'bereiten vor', 'bereitet vor', 'bereiten vor'], notes: 'trennbar' },
  { infinitive: 'ausgehen', es: 'salir (de fiesta)', praesens: ['gehe aus', 'gehst aus', 'geht aus', 'gehen aus', 'geht aus', 'gehen aus'], notes: 'trennbar' },
  { infinitive: 'umsteigen', es: 'hacer transbordo', praesens: ['steige um', 'steigst um', 'steigt um', 'steigen um', 'steigt um', 'steigen um'], notes: 'trennbar' },
];

export function germanVerbToExercise(verb: GermanCatalogVerb): ConjugationExercise {
  return {
    type: 'conjugation',
    title: `${verb.infinitive} — ${verb.es}`,
    verb: verb.infinitive,
    instruction: `Conjugate the verb „${verb.infinitive}" (${verb.es}) in the present tense.`,
    sections: [
      {
        tense: 'praesens',
        tenseName_de: 'Present tense',
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
