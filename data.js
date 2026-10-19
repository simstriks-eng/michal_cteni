/* ============================================================
   data.js - Školácká Mise
   Didaktická databáze pro 1. třídu ZŠ:
   Slovní zásoba, slabiky, věty, Pokémoni, odměny, TEST modul
   a synchronizační struktury
   ============================================================ */

const FULL_CZECH_ALPHABET = [
  'A', 'Á', 'B', 'C', 'Č', 'D', 'Ď', 'E', 'É', 'Ě', 
  'F', 'G', 'H', 'CH', 'I', 'Í', 'J', 'K', 'L', 'M', 
  'N', 'Ň', 'O', 'Ó', 'P', 'Q', 'R', 'Ř', 'S', 'Š', 
  'T', 'Ť', 'U', 'Ú', 'Ů', 'V', 'W', 'X', 'Y', 'Ý', 
  'Z', 'Ž'
];

const PRESETS = {
  base5: ['M', 'L', 'E', 'A', 'S'],
  diacritics5: ['M', 'L', 'E', 'É', 'A', 'Á', 'S', 'O', 'Ó'],
  autumn: ['M', 'L', 'S', 'P', 'T', 'A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'U', 'Ú', 'Y', 'Ý'],
  midGrade: [
    'A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'U', 'Ú', 'Ů', 'Y', 'Ý',
    'M', 'L', 'S', 'P', 'T', 'N', 'J', 'V', 'Z', 'D', 'K', 'C', 'B'
  ],
  all: [...FULL_CZECH_ALPHABET]
};

const NATURAL_VOWELS = ['A', 'Á', 'E', 'É', 'Ě', 'I', 'Í', 'O', 'Ó', 'U', 'Ú', 'Ů', 'Y', 'Ý'];

const NATURAL_CONSONANTS = [
  'M', 'L', 'S', 'Š', 'P', 'T', 'Ť', 'N', 'Ň', 'J', 'V', 'Z', 'Ž', 
  'D', 'Ď', 'K', 'C', 'Č', 'B', 'H', 'CH', 'R', 'Ř', 'F', 'G'
];

const MATH_EMOJIS = ['🍎', '🍐', '🚗', '⭐', '🎈', '🐶', '🐱', '⚽', '🍬', '🦊', '🚀'];

const DEFAULT_REWARDS = {
  questRate: 1.0,
  reading: { 1: 0.25, 2: 0.25, 3: 0.25, 4: 0.50, 5: 0.50, 6: 0.50, 7: 1.00, 8: 0.25 },
  math:    { 1: 0.25, 2: 0.25, 3: 0.25, 4: 0.50, 5: 0.50, 6: 1.00, 7: 0.00 }
};

// Výchozí konfigurace pro Výjimečnou / Legendární truhlu[cite: 12]
const DEFAULT_LEGENDARY_CHEST = {
  active: false,
  title: 'ZA VÝBORNÉ VÝSLEDKY VE ŠKOLE',
  diamonds: 10,
  claimed: false
};

// Výchozí konfigurace pro denní zkoušku (TEST)[cite: 12]
const DEFAULT_TEST_CONFIG = {
  taskCount: 8,
  thresholds: [
    { minPercent: 90, diamonds: 4, label: 'Výborně (1)' },
    { minPercent: 80, diamonds: 3, label: 'Chvalitebně (2)' },
    { minPercent: 65, diamonds: 2, label: 'Dobře (3)' },
    { minPercent: 50, diamonds: 1, label: 'Dostatečně (4)' },
    { minPercent: 0,  diamonds: 0, label: 'Zkus to znovu zítra' }
  ]
};

// Synchronizační verze a prefix pro rozpoznání platného řetězce
const SYNC_PROTOCOL_VERSION = 'SKOLAK_SYNC_V1';

const SVG_BENCH = `
  <svg class="bench-icon-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="42" width="70" height="9" rx="3" fill="#B45309" stroke="#78350F" stroke-width="2.5"/>
    <rect x="18" y="24" width="64" height="7" rx="2" fill="#D97706" stroke="#78350F" stroke-width="2"/>
    <rect x="18" y="32" width="64" height="7" rx="2" fill="#D97706" stroke="#78350F" stroke-width="2"/>
    <path d="M22 22 V50 M78 22 V50" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
    <path d="M22 50 L16 78 M27 50 L33 78" stroke="#1E293B" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M78 50 L72 78 M83 50 L89 78" stroke="#1E293B" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="14" y1="78" x2="35" y2="78" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="70" y1="78" x2="91" y2="78" stroke="#64748B" stroke-width="2.5" stroke-linecap="round"/>
  </svg>
`;

const SVG_SHOVEL = `
  <svg class="bench-icon-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="70" cy="25" r="9" stroke="#B45309" stroke-width="4" fill="none"/>
    <line x1="64" y1="31" x2="34" y2="61" stroke="#D97706" stroke-width="5" stroke-linecap="round"/>
    <path d="M34 61 L22 73 C19 76 20 80 24 81 L36 78 C39 77 41 74 39 70 Z" fill="#94A3B8" stroke="#334155" stroke-width="3"/>
  </svg>
`;

/* REVIDOVANÁ DATABÁZE HLÁSKOVÁNÍ[cite: 12] */
const SPELLING_WORDS_DATABASE = [
  { w: 'MÁMA', e: '👩', syllables: 2 }, { w: 'TÁTA', e: '👨', syllables: 2 },
  { w: 'LÍPA', e: '🌳', syllables: 2 }, { w: 'VODA', e: '💧', syllables: 2 },
  { w: 'KOLO', e: '🚲', syllables: 2 }, { w: 'RYBA', e: '🐟', syllables: 2 },
  { w: 'RUKA', e: '✋', syllables: 2 }, { w: 'NOHA', e: '🦵', syllables: 2 },
  { w: 'PUSA', e: '💋', syllables: 2 }, { w: 'ZIMA', e: '❄️', syllables: 2 },
  { w: 'LÉTO', e: '☀️', syllables: 2 }, { w: 'JARO', e: '🌱', syllables: 2 },
  { w: 'SOVA', e: '🦉', syllables: 2 }, { w: 'KOZA', e: '🐐', syllables: 2 },
  { w: 'HUSA', e: '🪿', syllables: 2 }, { w: 'ŽÁBA', e: '🐸', syllables: 2 },
  { w: 'SELE', e: '🐷', syllables: 2 }, { w: 'LAMA', e: '🦙', syllables: 2 },
  { w: 'POLE', e: '🌾', syllables: 2 }, { w: 'LANO', e: '🪢', syllables: 2 },
  { w: 'MÍSA', e: '🥣', syllables: 2 }, { w: 'VÁZA', e: '🏺', syllables: 2 },
  { w: 'KÁVA', e: '☕', syllables: 2 }, { w: 'BOTA', e: '👞', syllables: 2 },
  { w: 'MAPA', e: '🗺️', syllables: 2 }, { w: 'PILA', e: '🪚', syllables: 2 },
  { w: 'VANA', e: '🛁', syllables: 2 }, { w: 'LUPA', e: '🔍', syllables: 2 },
  { w: 'SÍLA', e: '💪', syllables: 2 }, { w: 'RŮŽE', e: '🌹', syllables: 2 },
  { w: 'DÍRA', e: '🕳️', syllables: 2 }, { w: 'HŮLKA', e: '🦯', syllables: 2 },
  { w: 'KOSA', e: '🌾', syllables: 2 }, { w: 'KŮRA', e: '🌲', syllables: 2 },
  { w: 'VÍLA', e: '🧚', syllables: 2 }, { w: 'VOSA', e: '🐝', syllables: 2 },
  { w: 'NULA', e: '0️⃣', syllables: 2 }, { w: 'ŽITO', e: '🌾', syllables: 2 },
  { w: 'OKNO', e: '🪟', syllables: 2 }, { w: 'ZUBY', e: '🦷', syllables: 2 },
  { w: 'MÁSLO', e: '🧈', syllables: 2 }, { w: 'KOČKA', e: '🐱', syllables: 2 },
  { w: 'PEJSEK', e: '🐶', syllables: 2 }, { w: 'ŠKOLA', e: '🏫', syllables: 2 },
  { w: 'TAŠKA', e: '🎒', syllables: 2 }, { w: 'KNIHA', e: '📖', syllables: 2 },
  { w: 'TUŽKA', e: '✏️', syllables: 2 }, { w: 'LOUKA', e: '🌼', syllables: 2 },
  { w: 'MOUKA', e: '🌾', syllables: 2 }, { w: 'BOUDA', e: '🐶', syllables: 2 },
  { w: 'KOULE', e: '⚪', syllables: 2 }, { w: 'HOUBA', e: '🍄', syllables: 2 },
  { w: 'LOUŽE', e: '🌧️', syllables: 2 }, { w: 'TRÁVA', e: '🌱', syllables: 2 },
  { w: 'STROM', e: '🌳', syllables: 1 }, { w: 'PTÁČEK', e: '🐦', syllables: 2 },
  { w: 'DÁREK', e: '🎁', syllables: 2 }, { w: 'LÍSTEK', e: '🍂', syllables: 2 },
  { w: 'ŠIŠKA', e: '🌲', syllables: 2 }, { w: 'SVETR', e: '🧶', syllables: 2 },
  { w: 'HNÍZDO', e: '🪹', syllables: 2 }, { w: 'STOPA', e: '🐾', syllables: 2 },
  { w: 'ZÁMEK', e: '🏰', syllables: 2 }, { w: 'LES', e: '🌲', syllables: 1 },
  { w: 'PES', e: '🐶', syllables: 1 }, { w: 'DŮM', e: '🏠', syllables: 1 },
  { w: 'MÁK', e: '🌺', syllables: 1 }, { w: 'LEV', e: '🦁', syllables: 1 },
  { w: 'RAK', e: '🦞', syllables: 1 }, { w: 'HAD', e: '🐍', syllables: 1 },
  { w: 'MYŠ', e: '🐭', syllables: 1 }, { w: 'KOS', e: '🐦', syllables: 1 },
  { w: 'MÍČ', e: '⚽', syllables: 1 }, { w: 'LED', e: '🧊', syllables: 1 },
  { w: 'MED', e: '🍯', syllables: 1 }, { w: 'SÝR', e: '🧀', syllables: 1 },
  { w: 'SŮL', e: '🧂', syllables: 1 }, { w: 'ZUB', e: '🦷', syllables: 1 },
  { w: 'NOS', e: '👃', syllables: 1 }, { w: 'NŮŽ', e: '🔪', syllables: 1 },
  { w: 'DAR', e: '🎁', syllables: 1 }, { w: 'DUB', e: '🌳', syllables: 1 },
  { w: 'ČAJ', e: '🍵', syllables: 1 }, { w: 'VLAK', e: '🚂', syllables: 1 },
  { w: 'HRAD', e: '🏰', syllables: 1 }, { w: 'MOST', e: '🌉', syllables: 1 },
  { w: 'KLÍČ', e: '🔑', syllables: 1 }, { w: 'MRAK', e: '☁️', syllables: 1 },
  { w: 'BLESK', e: '⚡', syllables: 1 }, { w: 'PEC', e: '🧱', syllables: 1 },
  { w: 'JABLÍČKO', e: '🍎', syllables: 3 }, { w: 'SLUNÍČKO', e: '☀️', syllables: 3 },
  { w: 'AUTÍČKO', e: '🚗', syllables: 3 }, { w: 'BABIČKA', e: '👵', syllables: 3 },
  { w: 'DĚDEČEK', e: '👴', syllables: 3 }, { w: 'CIBULE', e: '🧅', syllables: 3 },
  { w: 'JAHODA', e: '🍓', syllables: 3 }, { w: 'MALINA', e: '🫐', syllables: 3 },
  { w: 'LOPATA', svg: SVG_SHOVEL, syllables: 3 }, { w: 'KORUNA', e: '👑', syllables: 3 },
  { w: 'LETADLO', e: '✈️', syllables: 3 }, { w: 'HODINY', e: '⏰', syllables: 3 },
  { w: 'ČEPICE', e: '🧢', syllables: 3 }, { w: 'LAVIČKA', svg: SVG_BENCH, syllables: 3 },
  { w: 'KOŠÍČEK', e: '🧺', syllables: 3 }, { w: 'PANENKA', e: '🪆', syllables: 3 }
];

/* 3. ZÁLOŽKA: JEDNOSLABIČNÁ SMYSLUPLNÁ SLOVA (CVC)[cite: 12] */
const RAW_LEVEL_3_WORDS = [
  { t: 'LES', e: '🌲' }, { t: 'PES', e: '🐶' }, { t: 'PAS', e: '🛂' }, { t: 'PÁV', e: '🦚' },
  { t: 'PUK', e: '🏒' }, { t: 'PEC', e: '🧱' }, { t: 'POT', e: '💦' }, { t: 'PÍT', e: '🥛' },
  { t: 'PĚT', e: '🖐️' }, { t: 'PÁR', e: '👫' }, { t: 'PÁS', e: '🥋' }, { t: 'SÁM', e: '🧍' },
  { t: 'SEM', e: '👉' }, { t: 'SÁL', e: '🏛️' }, { t: 'MEL', e: '🥣' }, { t: 'LOM', e: '🪨' },
  { t: 'LOS', e: '🦌' }, { t: 'TOM', e: '👦' }, { t: 'TYP', e: '🏷️' }, { t: 'TÓN', e: '🎵' },
  { t: 'TAK', e: '👌' }, { t: 'NOS', e: '👃' }, { t: 'NOC', e: '🌙' }, { t: 'NŮŽ', e: '🔪' },
  { t: 'KOS', e: '🐦' }, { t: 'KUS', e: '🍰' }, { t: 'KŮŇ', e: '🐴' }, { t: 'KOŠ', e: '🧺' },
  { t: 'KOV', e: '⚙️' }, { t: 'DŮM', e: '🏠' }, { t: 'DAR', e: '🎁' }, { t: 'DUB', e: '🌳' },
  { t: 'DEN', e: '☀️' }, { t: 'DÝM', e: '💨' }, { t: 'SUP', e: '🦅' }, { t: 'SŮL', e: '🧂' },
  { t: 'SYN', e: '👦' }, { t: 'SÝR', e: '🧀' }, { t: 'SUD', e: '🛢️' }, { t: 'LEV', e: '🦁' },
  { t: 'LÉK', e: '💊' }, { t: 'LUK', e: '🏹' }, { t: 'LED', e: '🧊' }, { t: 'LET', e: '✈️' },
  { t: 'LOĎ', e: '🚢' }, { t: 'LOV', e: '🏹' }, { t: 'MÁK', e: '🌺' }, { t: 'MYŠ', e: '🐭' },
  { t: 'MŮJ', e: '✋' }, { t: 'MÍČ', e: '⚽' }, { t: 'MEČ', e: '⚔️' }, { t: 'MED', e: '🍯' },
  { t: 'MOL', e: '🦋' }, { t: 'ROK', e: '📅' }, { t: 'RAK', e: '🦞' }, { t: 'ROH', e: '📯' },
  { t: 'RÝČ', e: '⛏️' }, { t: 'HŮL', e: '🦯' }, { t: 'HAD', e: '🐍' }, { t: 'HRA', e: '🎮' },
  { t: 'ZUB', e: '🦷' }, { t: 'ZEĎ', e: '🧱' }, { t: 'BOK', e: '🧍' }, { t: 'BĚH', e: '🏃' },
  { t: 'BOJ', e: '⚔️' }, { t: 'BYT', e: '🏢' }, { t: 'BÝK', e: '🐂' }, { t: 'BOD', e: '📍' },
  { t: 'CÍL', e: '🎯' }, { t: 'ČAS', e: '⏰' }, { t: 'ČAJ', e: '🍵' }, { t: 'ČÁP', e: '🪶' },
  { t: 'KEŘ', e: '🌿' }, { t: 'ŠÍP', e: '🏹' }, { t: 'ŠÁL', e: '🧣' }, { t: 'VĚC', e: '📦' },
  { t: 'VÝR', e: '🦉' }, { t: 'VŮZ', e: '🚗' }, { t: 'ŽÁR', e: '🔥' }
];

/* 4. ZÁLOŽKA: DVOUSLABIČNÁ SKUTEČNÁ SLOVA[cite: 12] */
const RAW_LEVEL_4_WORDS = [
  { t: 'POLE', e: '🌾' }, { t: 'PUSA', e: '💋' }, { t: 'PÍŠE', e: '✍️' }, { t: 'PILA', e: '🪚' },
  { t: 'PATA', e: '🦶' }, { t: 'PÁRA', e: '💨' }, { t: 'PÁLÍ', e: '🔥' }, { t: 'PEPA', e: '👦' },
  { t: 'PŮDA', e: '🏠' }, { t: 'PÍSEK', e: '🏖️' }, { t: 'PANÍ', e: '👩' }, { t: 'PÁLKA', e: '🏓' },
  { t: 'PĚNA', e: '🧼' }, { t: 'PÁPEK', e: '🌭' }, { t: 'PAST', e: '🪤' }, { t: 'PIJE', e: '🥤' },
  { t: 'PĚJE', e: '🎤' }, { t: 'PÁVÍ', e: '🦚' }, { t: 'PÉČE', e: '🤲' }, { t: 'PEČE', e: '🥐' },
  { t: 'MÁMA', e: '👩' }, { t: 'MÁME', e: '🤝' }, { t: 'MELE', e: '⚙️' }, { t: 'MELA', e: '🌀' },
  { t: 'SELE', e: '🐷' }, { t: 'LAMA', e: '🦙' }, { t: 'LAMY', e: '🦙' }, { t: 'MASO', e: '🍖' },
  { t: 'LASO', e: '🪢' }, { t: 'MÁSLO', e: '🧈' }, { t: 'SLÁMA', e: '🌾' }, { t: 'SAMA', e: '🧍‍♀️' },
  { t: 'SÁRA', e: '👧' }, { t: 'LÁME', e: '🥖' }, { t: 'EMA', e: '👧' }, { t: 'ÁLA', e: '👧' },
  { t: 'MÍSA', e: '🥣' }, { t: 'MÍLA', e: '👦' }, { t: 'MOLO', e: '⚓' }, { t: 'OLEJ', e: '🛢️' },
  { t: 'TÁTA', e: '👨' }, { t: 'TETA', e: '👩' }, { t: 'KOLO', e: '🚲' }, { t: 'KOSA', e: '🌾' },
  { t: 'KŮRA', e: '🌲' }, { t: 'KÁVA', e: '☕' }, { t: 'KOZA', e: '🐐' }, { t: 'LÍPA', e: '🌳' },
  { t: 'LÉTO', e: '☀️' }, { t: 'LANO', e: '🪢' }, { t: 'LUPA', e: '🔍' }, { t: 'VODA', e: '💧' },
  { t: 'VÁZA', e: '🏺' }, { t: 'VANA', e: '🛁' }, { t: 'VÁHA', e: '⚖️' }, { t: 'VATA', e: '☁️' },
  { t: 'VÍLA', e: '🧚' }, { t: 'VOSA', e: '🐝' }, { t: 'ZIMA', e: '❄️' }, { t: 'ŽÁBA', e: '🐸' },
  { t: 'RYBA', e: '🐟' }, { t: 'RUKA', e: '✋' }, { t: 'RÁNO', e: '🌅' }, { t: 'RŮŽE', e: '🌹' },
  { t: 'SOVA', e: '🦉' }, { t: 'SENO', e: '🌾' }, { t: 'SÍLA', e: '💪' }, { t: 'ŠÁLA', e: '🧣' },
  { t: 'OKO', e: '👁️' }, { t: 'UCHO', e: '👂' }, { t: 'BOTA', e: '👞' }, { t: 'BÁBA', e: '👵' },
  { t: 'BÁRA', e: '👧' }, { t: 'BÍLÁ', e: '⚪' }, { t: 'CENA', e: '🏷️' }, { t: 'DÍRA', e: '🕳️' },
  { t: 'DOMA', e: '🏡' }, { t: 'HUSA', e: '🪿' }, { t: 'HORA', e: '⛰️' }, { t: 'JÁMA', e: '🕳️' },
  { t: 'JARO', e: '🌱' }, { t: 'MAPA', e: '🗺️' }, { t: 'MÍRA', e: '📏' }, { t: 'NOHA', e: '🦵' },
  { t: 'NULA', e: '0️⃣' }, { t: 'ŘEKA', e: '🌊' }, { t: 'ŽENA', e: '👩' }, { t: 'ŽITO', e: '🌾' }
];

/* 5. ZÁLOŽKA: SOUHLÁSKOVÉ SHLUKY A DVOJHLÁSKA OU[cite: 12] */
const RAW_LEVEL_5_WORDS = [
  { t: 'MÁSLO', e: '🧈' }, { t: 'AUTO', e: '🚗' }, { t: 'MOUKA', e: '🌾' }, { t: 'KOULE', e: '⚪' },
  { t: 'BOUDA', e: '🐶' }, { t: 'MOUCHA', e: '🪰' }, { t: 'FOUKÁ', e: '💨' }, { t: 'LOUKA', e: '🌼' },
  { t: 'MRAK', e: '☁️' }, { t: 'STŮL', e: '🪑' }, { t: 'VLAK', e: '🚂' }, { t: 'PLAVE', e: '🏊' },
  { t: 'SLOVO', e: '💬' }, { t: 'KROK', e: '👟' }, { t: 'BRATR', e: '👦' }, { t: 'ŠKOLA', e: '🏫' },
  { t: 'ZVON', e: '🔔' }, { t: 'VLK', e: '🐺' }, { t: 'PRST', e: '☝️' }, { t: 'KRK', e: '🦒' },
  { t: 'SMRK', e: '🌲' }, { t: 'HRAD', e: '🏰' }, { t: 'MOST', e: '🌉' }, { t: 'PLOT', e: '🪵' },
  { t: 'DRÁT', e: '🪢' }, { t: 'PTÁK', e: '🐦' }, { t: 'SKLO', e: '🥛' }, { t: 'KLUK', e: '👦' },
  { t: 'PARK', e: '🌳' }, { t: 'BLESK', e: '⚡' }, { t: 'KLÍČ', e: '🔑' }, { t: 'HOUBA', e: '🍄' },
  { t: 'LOUŽE', e: '🌧️' }, { t: 'KOUŘ', e: '💨' }, { t: 'BOUŘE', e: '⛈️' }, { t: 'SVETR', e: '🧶' },
  { t: 'STOPA', e: '🐾' }, { t: 'TRÁVA', e: '🌱' }, { t: 'STROM', e: '🌳' }
];

/* 6. ZÁLOŽKA: MĚKČENÉ HLÁSKY (DĚ, TĚ, NĚ, BĚ, PĚ, VĚ, MĚ)[cite: 12] */
const RAW_LEVEL_6_WORDS = [
  { t: 'DĚDA', e: '👴' }, { t: 'DĚTI', e: '🧒' }, { t: 'TĚLO', e: '🧍' }, { t: 'KOTĚ', e: '🐱' },
  { t: 'KONĚ', e: '🐎' }, { t: 'VĚTEV', e: '🌿' }, { t: 'MĚSTO', e: '🏙️' }, { t: 'BĚŽÍ', e: '🏃' },
  { t: 'PĚT', e: '5️⃣' }, { t: 'PĚJE', e: '🎤' }, { t: 'KŮZLE', e: '🐐' }, { t: 'KVĚT', e: '🌸' },
  { t: 'PĚNA', e: '🧼' }, { t: 'MEDVĚD', e: '🐻' }, { t: 'OBĚD', e: '🍲' }, { t: 'POUPĚ', e: '🌷' },
  { t: 'DEVĚT', e: '9️⃣' }, { t: 'SVĚTLO', e: '💡' }, { t: 'MĚSÍC', e: '🌙' }, { t: 'PAMĚŤ', e: '🧠' },
  { t: 'TĚSTO', e: '🥐' }, { t: 'ŠTĚNĚ', e: '🐶' }, { t: 'KUŘE', e: '🐥' }, { t: 'DOUPĚ', e: '🕳️' },
  { t: 'ZEMĚ', e: '🌍' }, { t: 'HNÍZDO', e: '🪹' }, { t: 'ŠIŠKA', e: '🌲' }, { t: 'ŽIDLE', e: '🪑' },
  { t: 'CIBULE', e: '🧅' }, { t: 'TICHO', e: '🤫' }
];

/* 7. ZÁLOŽKA: REVIDOVANÉ VĚTY ZE SLABIKÁŘE[cite: 12] */
const RAW_LEVEL_7_SENTENCES = [
  { t: 'EMA MÁ MÁSLO.', e: '👧🧈' }, { t: 'MÁMA MELE MASO.', e: '👩⚙️' },
  { t: 'EMA MÁ MASO.', e: '👧🥩' }, { t: 'ÁLA MELE MASO.', e: '👧🥣' },
  { t: 'MÁMA MÁ MÁSLO.', e: '👩🧈' }, { t: 'EMA MÁ MALÉ SELE.', e: '👧🐷' },
  { t: 'ÁLA MÁ LASO.', e: '👧🪢' }, { t: 'LAMA MÁ SENO.', e: '🦙🌾' },
  { t: 'MÁMA MÁ MÍSU.', e: '👩🥣' }, { t: 'EMA MÁ SELE.', e: '👧🐷' },
  { t: 'MÁMA MELE SELE.', e: '👩🥩' }, { t: 'ÁLA MÁ SELE.', e: '👧🐷' },
  { t: 'SÁRA MÁ LASO.', e: '👧🪢' }, { t: 'SÁRA MÁ SELE.', e: '👧🐷' },
  { t: 'MÁMA SOLÍ MASO.', e: '👩🧂' }, { t: 'MÁMA VOLÁ EMU.', e: '👩📢' },
  { t: 'PEPA MÁ PSA.', e: '👦🐶' }, { t: 'PES MÁ MASO.', e: '🐶🥩' },
  { t: 'TÁTA PÍŠE.', e: '👨✍️' }, { t: 'PEPA PÍŠE.', e: '👦✍️' },
  { t: 'TÁTA PÍŠE DOPIS.', e: '👨✉️' }, { t: 'MÁMA PEČE MASO.', e: '👩🍗' },
  { t: 'PES PIJE Z MISKY.', e: '🐶🥣' }, { t: 'PES LESEM BĚŽÍ.', e: '🐕🌲' },
  { t: 'PES JE V LESE.', e: '🐶🌲' }, { t: 'PES SPÍ U BOUDY.', e: '🐶🏠' },
  { t: 'PES STOJÍ U LESA.', e: '🐕🌲' }, { t: 'PES MÁ MALOU BOUDU.', e: '🐶🏠' },
  { t: 'PEPA PÁLÍ LISTÍ.', e: '👦🍂' }, { t: 'MÁMA PERE PRÁDLO.', e: '👩🧺' },
  { t: 'FILIP PÍŠE ÚKOL.', e: '👦✏️' }, { t: 'PEPA MÁ PUK.', e: '👦🏒' },
  { t: 'TÁTA MÁ PÁLKU.', e: '👨🏓' }, { t: 'NA POLI ROSTE MÁK.', e: '🌾🌺' },
  { t: 'PEPA PIJE TEPLÝ ČAJ.', e: '👦🍵' }, { t: 'PETR POUŠTÍ DRAKA.', e: '👦🪁' },
  { t: 'PETR MÁ NOVÝ MÍČ.', e: '👦⚽' }, { t: 'PES NESE MÍČEK.', e: '🐕🎾' },
  { t: 'V POTOCE PLAVE RYBA.', e: '🐟🌊' },
  { t: 'TÁTA MÁ KOLO.', e: '👨🚲' }, { t: 'TETA MÁ KOLO.', e: '👩🚲' },
  { t: 'OTA MÁ PSA.', e: '👦🐶' }, { t: 'MÍLA MÁ PSA.', e: '👦🐕' },
  { t: 'PES SE JMENUJE ALÍK.', e: '🐕✨' }, { t: 'TÁTA SEKÁ TRÁVU.', e: '👨🌾' },
  { t: 'NA LOUCE JE SELE.', e: '🌼🐷' }, { t: 'EMA MELE KÁVU.', e: '👧☕' },
  { t: 'MÁMA MÁ ČAJ.', e: '👩🍵' }, { t: 'BABIČKA PEČE KOLÁČ.', e: '👵🥧' },
  { t: 'DĚDEČEK ČTE KNIHU.', e: '👴📖' }, { t: 'NA VĚTVI SEDÍ KOS.', e: '🐦🌿' },
  { t: 'NA OBLOZE PLUJE MRAK.', e: '☁️🌤️' }, { t: 'VLAK JEDE DO MĚSTA.', e: '🚂🏙️' },
  { t: 'KOTĚ SPÍ V KOŠÍKU.', e: '🐱🧺' }, { t: 'JANA PIJE TEPLÝ ČAJ.', e: '👧🍵' },
  { t: 'PES HLÍDÁ NÁŠ DŮM.', e: '🐕🏡' }, { t: 'AUTO TROUBÍ NA CESTĚ.', e: '🚗📢' },
  { t: 'MALÉ KŮZLE SKÁČE.', e: '🐐🪨' }, { t: 'MÁMA NESE NÁKUP.', e: '👩🛍️' },
  { t: 'DĚTI SI HRAJÍ.', e: '🧒🎈' }, { t: 'V ZIMĚ PADÁ SNÍH.', e: '❄️⛄' },
  { t: 'HONZA STAVÍ HRAD.', e: '👦🏰' }, { t: 'SOVA HOUKÁ V NOCI.', e: '🦉🌙' },
  { t: 'MEDVĚD MÁ RÁD MED.', e: '🐻🍯' }, { t: 'LUCKA KRESLÍ DŮM.', e: '👧🎨' },
  { t: 'V ZAHRADĚ KVETE RŮŽE.', e: '🌹🪴' }, { t: 'HUSA CHODÍ PO DVORKU.', e: '🪿🏡' },
  { t: 'DĚDA PRACUJE V DÍLNĚ.', e: '👴🔨' }, { t: 'TÁTA OPRAVUJE AUTO.', e: '👨🔧' },
  { t: 'MYŠKA ŽVÝKÁ SÝR.', e: '🐭🧀' }, { t: 'ŽÁBA SKOČILA DO VODY.', e: '🐸🌊' }
];

const POKEMON_ROSTER = [
  { id: 25, name: 'Pikachu', color: '#FACC15', stroke: '#CA8A04' },
  { id: 4, name: 'Charmander', color: '#FB923C', stroke: '#C2410C' },
  { id: 1, name: 'Bulbasaur', color: '#4ADE80', stroke: '#15803D' },
  { id: 7, name: 'Squirtle', color: '#60A5FA', stroke: '#1D4ED8' },
  { id: 133, name: 'Eevee', color: '#C29B38', stroke: '#78350F' },
  { id: 143, name: 'Snorlax', color: '#2DD4BF', stroke: '#0F766E' },
  { id: 94, name: 'Gengar', color: '#A855F7', stroke: '#6B21A8' },
  { id: 39, name: 'Jigglypuff', color: '#F472B6', stroke: '#BE185D' },
  { id: 151, name: 'Mew', color: '#F9A8D4', stroke: '#DB2777' },
  { id: 175, name: 'Togepi', color: '#FEF08A', stroke: '#CA8A04' },
  { id: 54, name: 'Psyduck', color: '#FDE047', stroke: '#A16207' },
  { id: 6, name: 'Charizard', color: '#EA580C', stroke: '#9A3412' },
  { id: 9, name: 'Blastoise', color: '#38BDF8', stroke: '#0369A1' },
  { id: 3, name: 'Venusaur', color: '#34D399', stroke: '#065F46' },
  { id: 196, name: 'Espeon', color: '#C084FC', stroke: '#7E22CE' },
  { id: 197, name: 'Umbreon', color: '#475569', stroke: '#0F172A' },
  { id: 131, name: 'Lapras', color: '#38BDF8', stroke: '#0284C7' },
  { id: 149, name: 'Dragonite', color: '#F59E0B', stroke: '#B45309' },
  { id: 258, name: 'Mudkip', color: '#38BDF8', stroke: '#0369A1' },
  { id: 393, name: 'Piplup', color: '#60A5FA', stroke: '#1E40AF' },
  { id: 448, name: 'Lucario', color: '#0284C7', stroke: '#075985' },
  { id: 150, name: 'Mewtwo', color: '#E2E8F0', stroke: '#64748B' },
  { id: 252, name: 'Treecko', color: '#22C55E', stroke: '#15803D' },
  { id: 255, name: 'Torchic', color: '#FB923C', stroke: '#C2410C' }
];