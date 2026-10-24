/* ============================================================
   data.js - Školácká Mise
   Didaktická databáze pro 1. třídu ZŠ:
   - Slovní úlohy s celočíselnou dělitelností, násobením i odčítáním bez zbytků
   - Vektorové skiny Minecraft, Pokémon & Sonic postaviček pro 3D šatník
   - Tapetová grafická témata (Minecraft, Pokémon, Sonic světy)
   - Fanfárové a melodické zvukové balíčky
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

const MATH_EMOJIS = ['🍎', '🍐', '🚗', '⭐', '🎈', '🐶', '🐱', '⚽', '🍬', '🦊', '🚀', '⛏️', '⚡', '💍'];

const DEFAULT_REWARDS = {
  questRate: 1.0,
  reading: { 1: 0.25, 2: 0.25, 3: 0.25, 4: 0.50, 5: 0.50, 6: 0.50, 7: 1.00, 8: 0.25 },
  math:    { 1: 0.25, 2: 0.25, 3: 0.25, 4: 0.50, 5: 0.50, 6: 1.00, 7: 0.00 }
};

const DEFAULT_LEGENDARY_CHEST = {
  active: false,
  title: 'ZA VÝBORNÉ VÝSLEDKY VE ŠKOLE',
  diamonds: 10,
  claimed: false
};

const DEFAULT_TEST_CONFIG = {
  taskCount: 8,
  thresholds: [
    { minPercent: 90, diamonds: 4, label: 'Výborně (1)' },
    { minPercent: 80, diamonds: 3, label: 'Chvalitebně (2)' },
    { minPercent: 65, diamonds: 2, label: 'Dobře (3)' },
    { minPercent: 50, diamonds: 1, label: 'Dostatečně (4)' },
    { minPercent: 0,  diamonds: 0, label: 'Zkus to znovu zítra' }
  ],
  enabledTopics: {
    reading_1: true,
    reading_2: true,
    reading_3: true,
    reading_4: true,
    reading_5: true,
    reading_6: true,
    reading_7: true,
    math_1: true,
    math_2: true,
    math_3: true,
    math_4: true,
    math_5: true,
    math_6: true
  }
};

/* ============================================================
   DIDAKTICKÁ DATABÁZE SLOVNÍCH ÚLOH S CELOČÍSELNÝM DĚLENÍM A NÁSOBENÍM
   Garantuje celá čísla pro limity: do 10, 20, 30, 40
   ============================================================ */

function getRandomDivisiblePair(maxLimit, minUnits = 2, maxUnits = 6) {
  const unitsCount = Math.floor(Math.random() * (maxUnits - minUnits + 1)) + minUnits;
  const validPrices = [2, 3, 4, 5, 6, 8, 10].filter(p => p * unitsCount <= maxLimit);
  const price = validPrices.length > 0 
    ? validPrices[Math.floor(Math.random() * validPrices.length)]
    : 2;
  const total = unitsCount * price;
  return { units: unitsCount, price: price, total: total };
}

const WORD_PROBLEMS_TEMPLATES = [
  // 1. NÁKUP BALENÍ / BONBÓNŮ (Dělení beze zbytku: celkem Kč / cena za kus)
  {
    type: 'division_purchase',
    make: (maxVal) => {
      const limit = Math.min(Math.max(10, maxVal), 40);
      const pair = getRandomDivisiblePair(limit, 2, limit >= 30 ? 6 : 4);
      return {
        story: `Eliška chtěla koupit bonbóny. Jeden bonbón stojí ${pair.price} Kč. Maminka jí dala do obchodu ${pair.total} Kč. Kolik bonbónů si mohla Eliška koupit?`,
        formula: `${pair.total} ÷ ${pair.price} = ?`,
        a: pair.total,
        b: pair.price,
        op: '÷',
        correctAnswer: pair.units.toString()
      };
    }
  },
  // 2. SPOČÍTÁNÍ BALÍČKŮ S NÁLEPKAMI
  {
    type: 'division_stickers',
    make: (maxVal) => {
      const limit = Math.min(Math.max(10, maxVal), 40);
      const pair = getRandomDivisiblePair(limit, 2, 5);
      return {
        story: `V papírnictví mají balíček Pokémon samolepek za ${pair.price} Kč. Míša má našetřeno přesně ${pair.total} Kč. Kolik balíčků si může koupit?`,
        formula: `${pair.total} ÷ ${pair.price} = ?`,
        a: pair.total,
        b: pair.price,
        op: '÷',
        correctAnswer: pair.units.toString()
      };
    }
  },
  // 3. ROZDĚLENÍ PŘEDMĚTŮ ROVNÝM DÍLEM (Dělení do skupin/kapes/truhel)
  {
    type: 'group_distribution',
    make: (maxVal) => {
      const limit = Math.min(Math.max(10, maxVal), 40);
      const pair = getRandomDivisiblePair(limit, 2, 4);
      return {
        story: `Steve vytěžil v dole ${pair.total} diamantů 💎 a chce je rozdělit rovným dílem do ${pair.units} svých truhel. Kolik diamantů dá do každé truhly?`,
        formula: `${pair.total} ÷ ${pair.units} = ?`,
        a: pair.total,
        b: pair.units,
        op: '÷',
        correctAnswer: pair.price.toString()
      };
    }
  },
  // 4. POKÉMON BALL ROZDĚLENÍ MEZI TRENÉRY
  {
    type: 'pokemon_division',
    make: (maxVal) => {
      const limit = Math.min(Math.max(10, maxVal), 40);
      const pair = getRandomDivisiblePair(limit, 2, 4);
      return {
        story: `Trenér Ash měl ${pair.total} Pokéballů a rozdělil je spravedlivě mezi ${pair.units} kamarády. Kolik Pokéballů dostal každý z nich?`,
        formula: `${pair.total} ÷ ${pair.units} = ?`,
        a: pair.total,
        b: pair.units,
        op: '÷',
        correctAnswer: pair.price.toString()
      };
    }
  },
  // 5. NÁSOBENÍ - KOUPI N KUSŮ ZA X KČ
  {
    type: 'multiplication_cost',
    make: (maxVal) => {
      const limit = Math.min(Math.max(10, maxVal), 40);
      const pair = getRandomDivisiblePair(limit, 2, 5);
      return {
        story: `Míša koupil do školy ${pair.units} sešity. Každý sešit stál ${pair.price} Kč. Kolik korun zaplatil u pokladny celkem?`,
        formula: `${pair.units} × ${pair.price} = ?`,
        a: pair.units,
        b: pair.price,
        op: '×',
        correctAnswer: pair.total.toString()
      };
    }
  },
  // 6. ODČÍTÁNÍ - KOLIK PENĚZ NEBO VĚCÍ ZBYLO
  {
    type: 'subtraction_change',
    make: (maxVal) => {
      const limit = Math.min(Math.max(10, maxVal), 40);
      const total = Math.floor(Math.random() * (limit - 6)) + 6;
      const spent = Math.floor(Math.random() * (total - 3)) + 2;
      return {
        story: `Eliška měla v peněžence ${total} Kč. V obchodě utratila za sladké lízátko ${spent} Kč. Kolik korun jí v peněžence zbylo?`,
        formula: `${total} − ${spent} = ?`,
        a: total,
        b: spent,
        op: '−',
        correctAnswer: (total - spent).toString()
      };
    }
  },
  // 7. POROVNÁVÁNÍ ROZDÍLEM (O kolik více / méně)
  {
    type: 'difference_comparison',
    make: (maxVal) => {
      const limit = Math.min(Math.max(10, maxVal), 40);
      const a = Math.floor(Math.random() * (limit - 8)) + 8;
      const b = Math.floor(Math.random() * (a - 3)) + 2;
      return {
        story: `Míša posbíral ve hře ${a} zlatých prstenů 💍 a táta posbíral ${b} prstenů. O kolik prstenů má Míša více než táta?`,
        formula: `${a} − ${b} = ?`,
        a: a,
        b: b,
        op: '−',
        correctAnswer: (a - b).toString()
      };
    }
  },
  // 8. MINECRAFT STAVBA (Sčítání na celek)
  {
    type: 'addition_building',
    make: (maxVal) => {
      const limit = Math.min(Math.max(10, maxVal), 40);
      const a = Math.floor(Math.random() * (limit - 5)) + 2;
      const b = Math.floor(Math.random() * (limit - a - 1)) + 1;
      return {
        story: `Alex položila na střechu ${a} kamenných bloků a ${b} dřevěných trámů. Kolik kostek použila na celou střechu?`,
        formula: `${a} + ${b} = ?`,
        a: a,
        b: b,
        op: '+',
        correctAnswer: (a + b).toString()
      };
    }
  }
];

/* ============================================================
   ROZŠÍŘENÁ DATABÁZE GRAFICKÝCH SKINŮ PRO 3D ŠATNÍK
   (Minecraft, Pokémon, Sonic)
   ============================================================ */

const AVATAR_SKINS_DATABASE = [
  {
    id: 'steve',
    name: 'Steve (Minecraft)',
    category: 'minecraft',
    price: 0,
    accentColor: '#0284c7',
    description: 'Klasický hrdina v tyrkysovém tričku z Minecraftu.',
    svg: `
      <svg class="w-full h-full" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="16" rx="3" fill="#0284c7"/>
        <rect x="4" y="2" width="8" height="8" fill="#c68b59"/>
        <rect x="4" y="2" width="8" height="2" fill="#452817"/>
        <rect x="4" y="2" width="2" height="4" fill="#452817"/>
        <rect x="10" y="2" width="2" height="4" fill="#452817"/>
        <rect x="4" y="5" width="2" height="1" fill="#ffffff"/>
        <rect x="5" y="5" width="1" height="1" fill="#4338ca"/>
        <rect x="10" y="5" width="2" height="1" fill="#ffffff"/>
        <rect x="10" y="5" width="1" height="1" fill="#4338ca"/>
        <rect x="7" y="6" width="2" height="1" fill="#99583b"/>
        <rect x="6" y="7" width="4" height="1" fill="#452817"/>
        <rect x="3" y="10" width="10" height="6" fill="#06b6d4"/>
      </svg>
    `
  },
  {
    id: 'alex',
    name: 'Alex (Minecraft)',
    category: 'minecraft',
    price: 5,
    accentColor: '#16a34a',
    description: 'Bojovnice se zrzavými vlasy a zeleným oblekem.',
    svg: `
      <svg class="w-full h-full" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="16" rx="3" fill="#15803d"/>
        <rect x="4" y="2" width="8" height="8" fill="#fbcfe8"/>
        <rect x="3" y="2" width="10" height="3" fill="#ea580c"/>
        <rect x="3" y="2" width="3" height="6" fill="#ea580c"/>
        <rect x="11" y="2" width="2" height="6" fill="#ea580c"/>
        <rect x="5" y="5" width="2" height="1" fill="#ffffff"/>
        <rect x="6" y="5" width="1" height="1" fill="#16a34a"/>
        <rect x="9" y="5" width="2" height="1" fill="#ffffff"/>
        <rect x="9" y="5" width="1" height="1" fill="#16a34a"/>
        <rect x="3" y="10" width="10" height="6" fill="#65a30d"/>
      </svg>
    `
  },
  {
    id: 'creeper',
    name: 'Creeper (Minecraft)',
    category: 'minecraft',
    price: 8,
    accentColor: '#22c55e',
    description: 'Zelený kamarád s pixelovým úsměvem.',
    svg: `
      <svg class="w-full h-full" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="16" rx="3" fill="#166534"/>
        <rect x="2" y="2" width="12" height="12" fill="#22c55e"/>
        <rect x="4" y="4" width="2" height="2" fill="#052e16"/>
        <rect x="10" y="4" width="2" height="2" fill="#052e16"/>
        <rect x="7" y="6" width="2" height="3" fill="#052e16"/>
        <rect x="6" y="7" width="4" height="4" fill="#052e16"/>
        <rect x="5" y="9" width="2" height="3" fill="#052e16"/>
        <rect x="9" y="9" width="2" height="3" fill="#052e16"/>
      </svg>
    `
  },
  {
    id: 'enderman',
    name: 'Enderman (Minecraft)',
    category: 'minecraft',
    price: 10,
    accentColor: '#a855f7',
    description: 'Tajemný noční tvor s fialovýma zářícíma očima.',
    svg: `
      <svg class="w-full h-full" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="16" rx="3" fill="#0b0f19"/>
        <rect x="2" y="2" width="12" height="12" fill="#090d16"/>
        <rect x="3" y="7" width="4" height="2" fill="#c084fc"/>
        <rect x="4" y="7" width="2" height="2" fill="#fdf4ff"/>
        <rect x="9" y="7" width="4" height="2" fill="#c084fc"/>
        <rect x="10" y="7" width="2" height="2" fill="#fdf4ff"/>
      </svg>
    `
  },
  {
    id: 'wolf_mc',
    name: 'Ochočený Vlk (Minecraft)',
    category: 'minecraft',
    price: 12,
    accentColor: '#ef4444',
    description: 'Věrný vlk s červeným obojkem.',
    svg: `
      <svg class="w-full h-full" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="16" rx="3" fill="#475569"/>
        <polygon points="3,2 5,5 3,5" fill="#cbd5e1"/>
        <polygon points="13,2 11,5 13,5" fill="#cbd5e1"/>
        <rect x="4" y="3" width="8" height="7" fill="#e2e8f0"/>
        <rect x="5" y="5" width="1.5" height="1.5" fill="#0f172a"/>
        <rect x="9.5" y="5" width="1.5" height="1.5" fill="#0f172a"/>
        <rect x="6.5" y="7" width="3" height="2" fill="#334155"/>
        <rect x="3" y="10" width="10" height="2" fill="#ef4444"/>
        <rect x="4" y="12" width="8" height="4" fill="#cbd5e1"/>
      </svg>
    `
  },
  {
    id: 'pikachu_avatar',
    name: 'Pikachu (Pokémon)',
    category: 'pokemon',
    price: 6,
    accentColor: '#facc15',
    description: 'Oblíbený bleskový parťák se žlutými oušky a červenými tvářičkami.',
    svg: `
      <svg class="w-full h-full" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="16" rx="3" fill="#ca8a04"/>
        <polygon points="2,1 5,5 3,6" fill="#eab308"/>
        <polygon points="2,1 3,3 2,3" fill="#0f172a"/>
        <polygon points="14,1 11,5 13,6" fill="#eab308"/>
        <polygon points="14,1 13,3 14,3" fill="#0f172a"/>
        <circle cx="8" cy="9" r="6" fill="#facc15"/>
        <circle cx="5" cy="8" r="1.2" fill="#0f172a"/>
        <circle cx="5.2" cy="7.8" r="0.4" fill="#ffffff"/>
        <circle cx="11" cy="8" r="1.2" fill="#0f172a"/>
        <circle cx="11.2" cy="7.8" r="0.4" fill="#ffffff"/>
        <circle cx="3.5" cy="10" r="1.4" fill="#ef4444"/>
        <circle cx="12.5" cy="10" r="1.4" fill="#ef4444"/>
        <circle cx="8" cy="9.2" r="0.5" fill="#713f12"/>
        <path d="M7 10.5 Q8 11.5 9 10.5" stroke="#713f12" stroke-width="0.8" fill="none"/>
      </svg>
    `
  },
  {
    id: 'eevee_avatar',
    name: 'Eevee (Pokémon)',
    category: 'pokemon',
    price: 8,
    accentColor: '#b45309',
    description: 'Roztomilý hnědý Pokémon s hebkým límečkem.',
    svg: `
      <svg class="w-full h-full" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="16" rx="3" fill="#78350f"/>
        <polygon points="1,2 6,5 2,6" fill="#92400e"/>
        <polygon points="15,2 10,5 14,6" fill="#92400e"/>
        <circle cx="8" cy="8.5" r="5.5" fill="#b45309"/>
        <circle cx="6" cy="8" r="1" fill="#0f172a"/>
        <circle cx="10" cy="8" r="1" fill="#0f172a"/>
        <circle cx="8" cy="9.5" r="0.5" fill="#0f172a"/>
        <ellipse cx="8" cy="13.5" rx="5" ry="2.5" fill="#fef08a"/>
      </svg>
    `
  },
  {
    id: 'squirtle_avatar',
    name: 'Squirtle (Pokémon)',
    category: 'pokemon',
    price: 9,
    accentColor: '#38bdf8',
    description: 'Vodní želvička s modrým krunýřem.',
    svg: `
      <svg class="w-full h-full" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="16" rx="3" fill="#0369a1"/>
        <circle cx="8" cy="8" r="6.5" fill="#7dd3fc"/>
        <ellipse cx="5.5" cy="7.5" rx="1" ry="1.5" fill="#7c2d12"/>
        <circle cx="5.5" cy="7" r="0.4" fill="#ffffff"/>
        <ellipse cx="10.5" cy="7.5" rx="1" ry="1.5" fill="#7c2d12"/>
        <circle cx="10.5" cy="7" r="0.4" fill="#ffffff"/>
        <path d="M6 10 Q8 11.5 10 10" stroke="#0369a1" stroke-width="1" fill="none"/>
      </svg>
    `
  },
  {
    id: 'gengar_avatar',
    name: 'Gengar (Pokémon)',
    category: 'pokemon',
    price: 11,
    accentColor: '#7e22ce',
    description: 'Fialový stínový rošťák se zubatým úsměvem.',
    svg: `
      <svg class="w-full h-full" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="16" rx="3" fill="#4c1d95"/>
        <polygon points="3,1 5,4 2,4" fill="#6b21a8"/>
        <polygon points="13,1 11,4 14,4" fill="#6b21a8"/>
        <circle cx="8" cy="8.5" r="6" fill="#7e22ce"/>
        <polygon points="4,6 7,7 5,8" fill="#ef4444"/>
        <polygon points="12,6 9,7 11,8" fill="#ef4444"/>
        <path d="M4 10 Q8 14 12 10 Z" fill="#ffffff"/>
        <line x1="6" y1="10" x2="6" y2="12" stroke="#4c1d95" stroke-width="0.8"/>
        <line x1="8" y1="10" x2="8" y2="12.5" stroke="#4c1d95" stroke-width="0.8"/>
        <line x1="10" y1="10" x2="10" y2="12" stroke="#4c1d95" stroke-width="0.8"/>
      </svg>
    `
  },
  {
    id: 'sonic_avatar',
    name: 'Ježek Sonic',
    category: 'sonic',
    price: 12,
    accentColor: '#2563eb',
    description: 'Nejrychlejší modrý ježek na světě.',
    svg: `
      <svg class="w-full h-full" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="16" rx="3" fill="#1e3a8a"/>
        <polygon points="2,1 6,4 2,5" fill="#2563eb"/>
        <polygon points="0,5 5,7 1,8" fill="#2563eb"/>
        <polygon points="1,9 5,10 1,12" fill="#2563eb"/>
        <circle cx="9" cy="8" r="6" fill="#2563eb"/>
        <ellipse cx="9" cy="7" rx="3.5" ry="3" fill="#ffffff"/>
        <ellipse cx="9" cy="7" rx="1.5" ry="2" fill="#0284c7"/>
        <circle cx="9" cy="7" r="0.8" fill="#0f172a"/>
        <ellipse cx="10" cy="10" rx="3.5" ry="2.5" fill="#fed7aa"/>
        <circle cx="12.5" cy="9.5" r="0.9" fill="#0f172a"/>
      </svg>
    `
  },
  {
    id: 'diamond_knight',
    name: 'Diamantový Rytíř',
    category: 'minecraft',
    price: 15,
    accentColor: '#06b6d4',
    description: 'Kompletní diamantové brnění s helmou!',
    svg: `
      <svg class="w-full h-full" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="16" height="16" rx="3" fill="#0e7490"/>
        <rect x="3" y="2" width="10" height="9" fill="#06b6d4"/>
        <rect x="5" y="4" width="6" height="2" fill="#083344"/>
        <rect x="7" y="6" width="2" height="3" fill="#083344"/>
        <rect x="2" y="11" width="12" height="5" fill="#22d3ee"/>
      </svg>
    `
  }
];

/* ============================================================
   GRAFICKÁ TÉMATA A TAPETY NA POZADÍ (3 NOVÉ SVĚTY)
   ============================================================ */

const APP_THEMES_DATABASE = [
  {
    id: 'theme-sky',
    name: 'Modrá Obloha (Základní)',
    price: 0,
    class: 'theme-sky',
    previewGradient: 'linear-gradient(180deg, #7dd3fc, #fef3c7)',
    description: 'Příjemné čisté denní světlo s jemným přechodem.'
  },
  {
    id: 'theme-wallpaper-minecraft',
    name: 'Minecraft Svět (Tapeta) 🟩',
    price: 10,
    class: 'theme-wallpaper-minecraft',
    previewGradient: 'linear-gradient(135deg, #1e3f17 0%, #2e5324 50%, #15803d 100%)',
    description: 'Kvalitní zelená tapeta s rudami diamantů, Creeperem, Endermanem a kostkami.'
  },
  {
    id: 'theme-wallpaper-pokemon',
    name: 'Pokémon Svět (Tapeta) ⚡',
    price: 10,
    class: 'theme-wallpaper-pokemon',
    previewGradient: 'linear-gradient(135deg, #bfdbfe 0%, #dbeafe 50%, #fef08a 100%)',
    description: 'Jemná tapeta s Poké bally, siluetou Pikachu, blesky a Great bally.'
  },
  {
    id: 'theme-wallpaper-sonic',
    name: 'Sonicův Modrý Svět (Tapeta) 🌀',
    price: 12,
    class: 'theme-wallpaper-sonic',
    previewGradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #38bdf8 100%)',
    description: 'Modrá stylová tapeta se zlatými prsteny (rings), Sonicem a bleskovou stopou.'
  },
  {
    id: 'theme-space',
    name: 'Hluboký Noční Vesmír',
    price: 10,
    class: 'theme-space',
    previewGradient: 'radial-gradient(circle, #1e1b4b, #020617)',
    description: 'Tmavé pozadí pro večerní čtení bez oslnění.'
  },
  {
    id: 'theme-gold',
    name: 'Zlatý Šampionský Palác',
    price: 10,
    class: 'theme-gold',
    previewGradient: 'linear-gradient(180deg, #fde047, #d97706)',
    description: 'Zlaté luxusní téma pro nejlepší počtáře.'
  }
];

/* ============================================================
   SPECIÁLNÍ ZVUKOVÉ BALÍČKY A FANFÁRY
   ============================================================ */

const SOUND_PACKS_DATABASE = [
  {
    id: 'sound-classic',
    name: 'Jemný Fanfárový Tón',
    price: 0,
    description: 'Příjemné trojtónové cinknutí při správném řešení.'
  },
  {
    id: 'sound-pikachu-voice',
    name: 'Pikachu Pika-Pika! ⚡',
    price: 8,
    description: 'Radostný hlas Pikachu s jiskřivým akordem.'
  },
  {
    id: 'sound-royal-fanfare',
    name: 'Královská Pochvalná Fanfára 🎺',
    price: 8,
    description: 'Slavnostní trubková fanfára pro velké úspěchy.'
  },
  {
    id: 'sound-sonic-ring',
    name: 'Sonic Ring & Rychlost 💍',
    price: 7,
    description: 'Křišťálový zvuk sebrání zlatého prstýnku ježka Sonica.'
  },
  {
    id: 'sound-mc-level',
    name: 'Minecraft Level-Up Ding 🔔',
    price: 7,
    description: 'Ikonické cinknutí zkušeností a získání nového levelu.'
  }
];

const DEFAULT_UNLOCKED_CUSTOMIZATIONS = {
  activeSkin: 'steve',
  activeTheme: 'theme-sky',
  activeSound: 'sound-classic',
  unlockedSkins: ['steve'],
  unlockedThemes: ['theme-sky'],
  unlockedSounds: ['sound-classic']
};

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

/* 1. DATABÁZE HLÁSKOVÁNÍ (ZÁLOŽKA 8) */
const SPELLING_WORDS_DATABASE = [
  // --- Jednoslabičná slova ---
  { w: 'LES', e: '🌲', syllables: 1 }, { w: 'PES', e: '🐶', syllables: 1 },
  { w: 'PAS', e: '🛂', syllables: 1 }, { w: 'LOM', e: '🪨', syllables: 1 },
  { w: 'LOS', e: '🦌', syllables: 1 }, { w: 'MOL', e: '🦋', syllables: 1 },
  { w: 'SUP', e: '🦅', syllables: 1 }, { w: 'SŮL', e: '🧂', syllables: 1 },
  { w: 'SÁM', e: '🧍', syllables: 1 }, { w: 'SÁL', e: '🏛️', syllables: 1 },
  { w: 'PÁS', e: '🥋', syllables: 1 }, { w: 'POT', e: '💦', syllables: 1 },
  { w: 'LET', e: '✈️', syllables: 1 }, { w: 'SÝR', e: '🧀', syllables: 1 },
  { w: 'SYN', e: '👦', syllables: 1 }, { w: 'NOS', e: '👃', syllables: 1 },
  { w: 'SEN', e: '💭', syllables: 1 }, { w: 'LEV', e: '🦁', syllables: 1 },
  { w: 'LOV', e: '🏹', syllables: 1 }, { w: 'VŮZ', e: '🚗', syllables: 1 },
  { w: 'DŮM', e: '🏠', syllables: 1 }, { w: 'DAR', e: '🎁', syllables: 1 },
  { w: 'DUB', e: '🌳', syllables: 1 }, { w: 'DEN', e: '☀️', syllables: 1 },
  { w: 'DÝM', e: '💨', syllables: 1 }, { w: 'LED', e: '🧊', syllables: 1 },
  { w: 'MED', e: '🍯', syllables: 1 }, { w: 'HAD', e: '🐍', syllables: 1 },
  { w: 'SUD', e: '🛢️', syllables: 1 }, { w: 'ZUB', e: '🦷', syllables: 1 },
  { w: 'MÁK', e: '🌺', syllables: 1 }, { w: 'LÉK', e: '💊', syllables: 1 },
  { w: 'LUK', e: '🏹', syllables: 1 }, { w: 'PUK', e: '🏒', syllables: 1 },
  { w: 'KOS', e: '🐦', syllables: 1 }, { w: 'KOŠ', e: '🧺', syllables: 1 },
  { w: 'KŮŇ', e: '🐴', syllables: 1 }, { w: 'RAK', e: '🦞', syllables: 1 },
  { w: 'ROK', e: '📅', syllables: 1 }, { w: 'ROH', e: '📯', syllables: 1 },
  { w: 'HŮL', e: '🦯', syllables: 1 }, { w: 'MYŠ', e: '🐭', syllables: 1 },
  { w: 'MÍČ', e: '⚽', syllables: 1 }, { w: 'MEČ', e: '⚔️', syllables: 1 },
  { w: 'ČAJ', e: '🍵', syllables: 1 }, { w: 'ČÁP', e: '🪶', syllables: 1 },
  { w: 'ŠÍP', e: '🏹', syllables: 1 }, { w: 'ŠÁL', e: '🧣', syllables: 1 },
  { w: 'NŮŽ', e: '🔪', syllables: 1 }, { w: 'PEC', e: '🧱', syllables: 1 },
  { w: 'NOC', e: '🌙', syllables: 1 }, { w: 'VLAK', e: '🚂', syllables: 1 },
  { w: 'HRAD', e: '🏰', syllables: 1 }, { w: 'MOST', e: '🌉', syllables: 1 },
  { w: 'KLÍČ', e: '🔑', syllables: 1 }, { w: 'MRAK', e: '☁️', syllables: 1 },
  { w: 'BLESK', e: '⚡', syllables: 1 }, { w: 'STROM', e: '🌳', syllables: 1 },

  // --- Dvouslabičná slova ---
  { w: 'MÁMA', e: '👩', syllables: 2 }, { w: 'TÁTA', e: '👨', syllables: 2 },
  { w: 'EMA', e: '👧', syllables: 2 }, { w: 'ÁLA', e: '👧', syllables: 2 },
  { w: 'PEPA', e: '👦', syllables: 2 }, { w: 'MÍLA', e: '👦', syllables: 2 },
  { w: 'LAMA', e: '🦙', syllables: 2 }, { w: 'SELE', e: '🐷', syllables: 2 },
  { w: 'POLE', e: '🌾', syllables: 2 }, { w: 'MASO', e: '🍖', syllables: 2 },
  { w: 'LASO', e: '🪢', syllables: 2 }, { w: 'MÍSA', e: '🥣', syllables: 2 },
  { w: 'MAPA', e: '🗺️', syllables: 2 }, { w: 'LUPA', e: '🔍', syllables: 2 },
  { w: 'PILA', e: '🪚', syllables: 2 }, { w: 'PUSA', e: '💋', syllables: 2 },
  { w: 'LÍPA', e: '🌳', syllables: 2 }, { w: 'SÍLA', e: '💪', syllables: 2 },
  { w: 'MOLO', e: '⚓', syllables: 2 }, { w: 'MÁSLO', e: '🧈', syllables: 2 },
  { w: 'SLÁMA', e: '🌾', syllables: 2 }, { w: 'LÉTO', e: '☀️', syllables: 2 },
  { w: 'PATA', e: '🦶', syllables: 2 }, { w: 'TETA', e: '👩', syllables: 2 },
  { w: 'AUTO', e: '🚗', syllables: 2 }, { w: 'LANO', e: '🪢', syllables: 2 },
  { w: 'SENO', e: '🌾', syllables: 2 }, { w: 'NULA', e: '0️⃣', syllables: 2 },
  { w: 'VODA', e: '💧', syllables: 2 }, { w: 'VANA', e: '🛁', syllables: 2 },
  { w: 'VÁZA', e: '🏺', syllables: 2 }, { w: 'VÍLA', e: '🧚', syllables: 2 },
  { w: 'VOSA', e: '🐝', syllables: 2 }, { w: 'SOVA', e: '🦉', syllables: 2 },
  { w: 'ZIMA', e: '❄️', syllables: 2 }, { w: 'KOZA', e: '🐐', syllables: 2 },
  { w: 'KOLO', e: '🚲', syllables: 2 }, { w: 'KÁVA', e: '☕', syllables: 2 },
  { w: 'KOSA', e: '🌾', syllables: 2 }, { w: 'KŮRA', e: '🌲', syllables: 2 },
  { w: 'OKNO', e: '🪟', syllables: 2 }, { w: 'RYBA', e: '🐟', syllables: 2 },
  { w: 'RUKA', e: '✋', syllables: 2 }, { w: 'RŮŽE', e: '🌹', syllables: 2 },
  { w: 'JARO', e: '🌱', syllables: 2 }, { w: 'NOHA', e: '🦵', syllables: 2 },
  { w: 'HUSA', e: '🪿', syllables: 2 }, { w: 'HORA', e: '⛰️', syllables: 2 },
  { w: 'BOTA', e: '👞', syllables: 2 }, { w: 'ŽÁBA', e: '🐸', syllables: 2 },
  { w: 'DÍRA', e: '🕳️', syllables: 2 }, { w: 'ZUBY', e: '🦷', syllables: 2 },
  { w: 'KOČKA', e: '🐱', syllables: 2 }, { w: 'PEJSEK', e: '🐶', syllables: 2 },
  { w: 'ŠKOLA', e: '🏫', syllables: 2 }, { w: 'TAŠKA', e: '🎒', syllables: 2 },
  { w: 'KNIHA', e: '📖', syllables: 2 }, { w: 'TUŽKA', e: '✏️', syllables: 2 },
  { w: 'LOUKA', e: '🌼', syllables: 2 }, { w: 'MOUKA', e: '🌾', syllables: 2 },
  { w: 'BOUDA', e: '🐶', syllables: 2 }, { w: 'KOULE', e: '⚪', syllables: 2 },
  { w: 'HOUBA', e: '🍄', syllables: 2 }, { w: 'LOUŽE', e: '🌧️', syllables: 2 },
  { w: 'TRÁVA', e: '🌱', syllables: 2 }, { w: 'PTÁČEK', e: '🐦', syllables: 2 },
  { w: 'DÁREK', e: '🎁', syllables: 2 }, { w: 'LÍSTEK', e: '🍂', syllables: 2 },
  { w: 'ŠIŠKA', e: '🌲', syllables: 2 }, { w: 'SVETR', e: '🧶', syllables: 2 },
  { w: 'HNÍZDO', e: '🪹', syllables: 2 }, { w: 'STOPA', e: '🐾', syllables: 2 },
  { w: 'ZÁMEK', e: '🏰', syllables: 2 }, { w: 'HŮLKA', e: '🦯', syllables: 2 },

  // --- Trojslabičná slova ---
  { w: 'MALINA', e: '🫐', syllables: 3 }, { w: 'JAHODA', e: '🍓', syllables: 3 },
  { w: 'JABLÍČKO', e: '🍎', syllables: 3 }, { w: 'SLUNÍČKO', e: '☀️', syllables: 3 },
  { w: 'MĚSÍČEK', e: '🌙', syllables: 3 }, { w: 'HVĚZDIČKA', e: '⭐', syllables: 3 },
  { w: 'AUTÍČKO', e: '🚗', syllables: 3 }, { w: 'LETADLO', e: '✈️', syllables: 3 },
  { w: 'MAŠINKA', e: '🚂', syllables: 3 }, { w: 'BABIČKA', e: '👵', syllables: 3 },
  { w: 'DĚDEČEK', e: '👴', syllables: 3 }, { w: 'MAMINKA', e: '👩', syllables: 3 },
  { w: 'TATÍNEK', e: '👨', syllables: 3 }, { w: 'MIMINKO', e: '👶', syllables: 3 },
  { w: 'CIBULE', e: '🧅', syllables: 3 }, { w: 'OKURKA', e: '🥒', syllables: 3 },
  { w: 'PAPRIKA', e: '🫑', syllables: 3 }, { w: 'BRAMBORA', e: '🥔', syllables: 3 },
  { w: 'LOPATA', svg: SVG_SHOVEL, syllables: 3 }, { w: 'LAVIČKA', svg: SVG_BENCH, syllables: 3 },
  { w: 'KORUNA', e: '👑', syllables: 3 }, { w: 'HODINY', e: '⏰', syllables: 3 },
  { w: 'ČEPICE', e: '🧢', syllables: 3 }, { w: 'KOŠÍČEK', e: '🧺', syllables: 3 },
  { w: 'PANENKA', e: '🪆', syllables: 3 }, { w: 'VEVERKA', e: '🐿️', syllables: 3 },
  { w: 'BERUŠKA', e: '🐞', syllables: 3 }, { w: 'VČELIČKA', e: '🐝', syllables: 3 },
  { w: 'MOTÝLEK', e: '🦋', syllables: 3 }, { w: 'ŽABIČKA', e: '🐸', syllables: 3 },
  { w: 'RYBIČKA', e: '🐟', syllables: 3 }, { w: 'KOČIČKA', e: '🐱', syllables: 3 },
  { w: 'MEDVÍDEK', e: '🐻', syllables: 3 }, { w: 'KRÁLÍČEK', e: '🐰', syllables: 3 },
  { w: 'OVEČKA', e: '🐑', syllables: 3 }, { w: 'SLEPIČKA', e: '🐔', syllables: 3 },
  { w: 'KUŘÁTKO', e: '🐥', syllables: 3 }, { w: 'PRASÁTKO', e: '🐷', syllables: 3 },
  { w: 'DOMEČEK', e: '🏠', syllables: 3 }, { w: 'STROMEČEK', e: '🌲', syllables: 3 },
  { w: 'KYTIČKA', e: '🌼', syllables: 3 }, { w: 'PASTELKA', e: '✏️', syllables: 3 },
  { w: 'AKTOVKA', e: '🎒', syllables: 3 }, { w: 'ČÍTANKA', e: '📖', syllables: 3 },
  { w: 'ZVONEČEK', e: '🔔', syllables: 3 }, { w: 'SNĚHULÁK', e: '⛄', syllables: 3 },
  { w: 'BALÓNEK', e: '🎈', syllables: 3 }, { w: 'KYTARA', e: '🎸', syllables: 3 },
  { w: 'DEŠTNÍČEK', e: '☂️', syllables: 3 }, { w: 'BOTIČKY', e: '👟', syllables: 3 },
  { w: 'PONOŽKY', e: '🧦', syllables: 3 }
];

/* 3. ZÁLOŽKA: JEDNOSLABIČNÁ SLOVA (CVC) */
const RAW_LEVEL_3_WORDS = [
  // Raná fáze (M, L, S, P + samohlásky)
  { t: 'LES', e: '🌲' }, { t: 'PES', e: '🐶' }, { t: 'PAS', e: '🛂' }, { t: 'LOM', e: '🪨' },
  { t: 'LOS', e: '🦌' }, { t: 'MOL', e: '🦋' }, { t: 'SUP', e: '🦅' }, { t: 'SŮL', e: '🧂' },
  { t: 'PŮL', e: '🌗' }, { t: 'ÚL', e: '🐝' },  { t: 'SÁM', e: '🧍' }, { t: 'SÁL', e: '🏛️' },
  { t: 'PÁS', e: '🥋' }, { t: 'SEM', e: '👉' },

  // Střední fáze (+ T, J, N, V, Z, Y, Ý)
  { t: 'POT', e: '💦' }, { t: 'PÍT', e: '🥛' }, { t: 'LET', e: '✈️' }, { t: 'MÝT', e: '🧼' },
  { t: 'SÝR', e: '🧀' }, { t: 'SYN', e: '👦' }, { t: 'TOM', e: '👦' }, { t: 'TÓN', e: '🎵' },
  { t: 'NOS', e: '👃' }, { t: 'SEN', e: '💭' }, { t: 'VEN', e: '🚪' }, { t: 'LEV', e: '🦁' },
  { t: 'LOV', e: '🏹' }, { t: 'VŮZ', e: '🚗' }, { t: 'VŮL', e: '🐂' }, { t: 'MŮJ', e: '✋' },
  { t: 'MÁJ', e: '🌸' }, { t: 'JÍT', e: '🚶' }, { t: 'ZEM', e: '🌍' }, { t: 'PÁV', e: '🦚' },

  // Pokročilá fáze (+ D, K, B, R, H, C, Č, Š, Ž, Ř, CH)
  { t: 'DŮM', e: '🏠' }, { t: 'DŮL', e: '⛏️' }, { t: 'DAR', e: '🎁' }, { t: 'DUB', e: '🌳' },
  { t: 'DEN', e: '☀️' }, { t: 'DÝM', e: '💨' }, { t: 'LED', e: '🧊' }, { t: 'MED', e: '🍯' },
  { t: 'HAD', e: '🐍' }, { t: 'SUD', e: '🛢️' }, { t: 'BOD', e: '📍' }, { t: 'RÁD', e: '😊' },
  { t: 'PÁD', e: '🍂' }, { t: 'KUS', e: '🍰' }, { t: 'KOS', e: '🐦' }, { t: 'KOŠ', e: '🧺' },
  { t: 'KŮŇ', e: '🐴' }, { t: 'KŮL', e: '🪵' }, { t: 'KOV', e: '⚙️' }, { t: 'MÁK', e: '🌺' },
  { t: 'LÉK', e: '💊' }, { t: 'LUK', e: '🏹' }, { t: 'PUK', e: '🏒' }, { t: 'BOK', e: '🧍' },
  { t: 'BÝK', e: '🐂' }, { t: 'BYT', e: '🏢' }, { t: 'BOJ', e: '⚔️' }, { t: 'BÁL', e: '💃' },
  { t: 'ZUB', e: '🦷' }, { t: 'ROK', e: '📅' }, { t: 'RAK', e: '🦞' }, { t: 'ROH', e: '📯' },
  { t: 'RÝČ', e: '⛏️' }, { t: 'RÁM', e: '🖼️' }, { t: 'MÍR', e: '🕊️' }, { t: 'VÝR', e: '🦉' },
  { t: 'PÁR', e: '👫' }, { t: 'ŽÁR', e: '🔥' }, { t: 'KEŘ', e: '🌿' }, { t: 'HŮL', e: '🦯' },
  { t: 'HÁJ', e: '🌳' }, { t: 'HÁK', e: '🪝' }, { t: 'MECH', e: '🌿' }, { t: 'DECH', e: '💨' },
  { t: 'PEC', e: '🧱' }, { t: 'NOC', e: '🌙' }, { t: 'CÍL', e: '🎯' }, { t: 'ČAS', e: '⏰' },
  { t: 'ČAJ', e: '🍵' }, { t: 'ČÁP', e: '🪶' }, { t: 'MÍČ', e: '⚽' }, { t: 'MEČ', e: '⚔️' },
  { t: 'MYŠ', e: '🐭' }, { t: 'ŠÍP', e: '🏹' }, { t: 'ŠÁL', e: '🧣' }, { t: 'NŮŽ', e: '🔪' },
  { t: 'MUŽ', e: '👨' }, { t: 'LOĎ', e: '🚢' }, { t: 'ZEĎ', e: '🧱' }, { t: 'PĚT', e: '🖐️' },
  { t: 'BĚH', e: '🏃' }, { t: 'VĚC', e: '📦' }
];

/* 4. ZÁLOŽKA: DVOUSLABIČNÁ A TROJSLABIČNÁ SKUTEČNÁ SLOVA */
const RAW_LEVEL_4_WORDS = [
  // 1. Z Míšových současných písmen (A, E, É, I, Í, O, Ó, U, Ú, Ů, M, L, S, P + Á)
  { t: 'EMA', e: '👧' },   { t: 'ELA', e: '👧' },   { t: 'OLA', e: '👧' },   { t: 'ÁLA', e: '👧' },
  { t: 'PEPA', e: '👦' },  { t: 'MÍLA', e: '👦' },  { t: 'MÁMA', e: '👩' },  { t: 'MÁME', e: '🤝' },
  { t: 'LAMA', e: '🦙' },  { t: 'SAMA', e: '🧍‍♀️' }, { t: 'SELE', e: '🐷' },  { t: 'POLE', e: '🌾' },
  { t: 'MASO', e: '🍖' },  { t: 'LASO', e: '🪢' },  { t: 'MÍSA', e: '🥣' },  { t: 'MAPA', e: '🗺️' },
  { t: 'LUPA', e: '🔍' },  { t: 'PILA', e: '🪚' },  { t: 'PÍPA', e: '🚰' },  { t: 'PUSA', e: '💋' },
  { t: 'LÍPA', e: '🌳' },  { t: 'SÍLA', e: '💪' },  { t: 'MOLO', e: '⚓' },  { t: 'MELE', e: '⚙️' },
  { t: 'LÁME', e: '🥖' },  { t: 'PÁLÍ', e: '🔥' },  { t: 'SOLÍ', e: '🧂' },  { t: 'MUSÍ', e: '❗' },
  { t: 'LEPÍ', e: '🩹' },  { t: 'PASE', e: '🐑' },  { t: 'MALÁ', e: '👧' },  { t: 'MALÉ', e: '🐣' },
  { t: 'MILÁ', e: '😊' },  { t: 'MILÉ', e: '💛' },  { t: 'MILÍ', e: '👫' },  { t: 'SAMI', e: '👬' },
  { t: 'MÁSLO', e: '🧈' }, { t: 'SLÁMA', e: '🌾' }, { t: 'SALÁM', e: '🥩' },

  // 2. S přidáním T, Y, Ý, J, N, V, Z
  { t: 'TÁTA', e: '👨' },  { t: 'TETA', e: '👩' },  { t: 'OTA', e: '👦' },   { t: 'LÉTO', e: '☀️' },
  { t: 'PATA', e: '🦶' },  { t: 'VATA', e: '☁️' },  { t: 'NOTA', e: '🎵' },  { t: 'SÍTO', e: '🥣' },
  { t: 'TADY', e: '📍' },  { t: 'TOTO', e: '👉' },  { t: 'SYPE', e: '⏳' },  { t: 'PIJE', e: '🥤' },
  { t: 'MYJE', e: '🧽' },  { t: 'JÁMA', e: '🕳️' },  { t: 'JANA', e: '👧' },  { t: 'MOJE', e: '🙋‍♂️' },
  { t: 'OLEJ', e: '🛢️' },  { t: 'LANO', e: '🪢' },  { t: 'SENO', e: '🌾' },  { t: 'VÍNO', e: '🍇' },
  { t: 'NULA', e: '0️⃣' },  { t: 'VANA', e: '🛁' },  { t: 'PANÍ', e: '👩' },  { t: 'NOSÍ', e: '🎒' },
  { t: 'NESE', e: '📦' },  { t: 'TONÍK', e: '👦' }, { t: 'SLONI', e: '🐘' }, { t: 'MALINA', e: '🫐' },
  { t: 'SLANINA', e: '🥓' },{ t: 'LOPATA', e: '🪣' },{ t: 'VODA', e: '💧' },  { t: 'VÁZA', e: '🏺' },
  { t: 'VÍLA', e: '🧚' },  { t: 'VOSA', e: '🐝' },  { t: 'SOVA', e: '🦉' },  { t: 'VOLÁ', e: '📢' },
  { t: 'MÁVÁ', e: '👋' },  { t: 'NOVÁ', e: '✨' },  { t: 'NOVÉ', e: '🆕' },  { t: 'NOVÝ', e: '🌟' },
  { t: 'ZIMA', e: '❄️' },

  // 3. S přidáním D, K, B, R, H, C, Č, Š, Ž, Ř, CH
  { t: 'DOMA', e: '🏡' },  { t: 'DÍRA', e: '🕳️' },  { t: 'PŮDA', e: '🏠' },  { t: 'DUHA', e: '🌈' },
  { t: 'DÁMA', e: '👑' },  { t: 'DÁREK', e: '🎁' }, { t: 'DOMEK', e: '🏠' }, { t: 'PADÁ', e: '🍂' },
  { t: 'JEDE', e: '🚗' },  { t: 'VEDE', e: '🦮' },  { t: 'JAHODA', e: '🍓' },{ t: 'HODINY', e: '⏰' },
  { t: 'RODINA', e: '👨‍👩‍👧‍👦' },{ t: 'KOLO', e: '🚲' },  { t: 'KOSA', e: '🌾' },  { t: 'KŮRA', e: '🌲' },
  { t: 'KÁVA', e: '☕' },  { t: 'KOZA', e: '🐐' },  { t: 'KUNA', e: '🦦' },  { t: 'KINO', e: '🎬' },
  { t: 'OKO', e: '👁️' },   { t: 'OKNO', e: '🪟' },  { t: 'RUKA', e: '✋' },  { t: 'PÍSEK', e: '🏖️' },
  { t: 'PÁLKA', e: '🏓' }, { t: 'PÁREK', e: '🌭' }, { t: 'KOČKA', e: '🐱' }, { t: 'TAŠKA', e: '🎒' },
  { t: 'TUŽKA', e: '✏️' }, { t: 'ŠIŠKA', e: '🌲' }, { t: 'LIŠKA', e: '🦊' }, { t: 'KNIHA', e: '📖' },
  { t: 'KOLÁČ', e: '🥧' }, { t: 'KOŠÍK', e: '🧺' }, { t: 'KORUNA', e: '👑' },{ t: 'OKURKA', e: '🥒' },
  { t: 'KYTARA', e: '🎸' },{ t: 'BOTA', e: '👞' },  { t: 'BÁBA', e: '👵' },  { t: 'BÁRA', e: '👧' },
  { t: 'BÍLÁ', e: '⚪' },  { t: 'RYBA', e: '🐟' },  { t: 'ŽÁBA', e: '🐸' },  { t: 'ZUBY', e: '🦷' },
  { t: 'CHYBA', e: '❌' }, { t: 'BABIČKA', e: '👵' },{ t: 'BERUŠKA', e: '🐞' },{ t: 'CIBULE', e: '🧅' },
  { t: 'RÁNO', e: '🌅' },  { t: 'RŮŽE', e: '🌹' },  { t: 'SÁRA', e: '👧' },  { t: 'PÁRA', e: '💨' },
  { t: 'MÍRA', e: '📏' },  { t: 'HORA', e: '⛰️' },  { t: 'JARO', e: '🌱' },  { t: 'PERO', e: '🪶' },
  { t: 'ŘEKA', e: '🌊' },  { t: 'ŘEPA', e: '🌱' },  { t: 'MOŘE', e: '🏖️' },  { t: 'KUŘE', e: '🐥' },
  { t: 'HUSA', e: '🪿' },  { t: 'NOHA', e: '🦵' },  { t: 'VÁHA', e: '⚖️' },  { t: 'UCHO', e: '👂' },
  { t: 'TICHO', e: '🤫' }, { t: 'CHATA', e: '🛖' }, { t: 'CENA', e: '🏷️' },  { t: 'CESTA', e: '🛣️' },
  { t: 'ČEPICE', e: '🧢' },{ t: 'PÉČE', e: '🤲' },  { t: 'PEČE', e: '🥐' },  { t: 'TEČE', e: '🚰' },
  { t: 'PÍŠE', e: '✍️' },  { t: 'ŠÁLA', e: '🧣' },  { t: 'ŽENA', e: '👩' },  { t: 'ŽITO', e: '🌾' }
];

/* 5. ZÁLOŽKA: SOUHLÁSKOVÉ SHLUKY A DVOJHLÁSKY OU / AU */
const RAW_LEVEL_5_WORDS = [
  // Shluky z raných písmen (M, L, S, P, T, N, V)
  { t: 'MÁSLO', e: '🧈' }, { t: 'SLÁMA', e: '🌾' }, { t: 'SLOVO', e: '💬' }, { t: 'SLANÝ', e: '🧂' },
  { t: 'SLEPÝ', e: '🕶️' }, { t: 'SLONI', e: '🐘' }, { t: 'PLAVE', e: '🏊' }, { t: 'PLUJE', e: '⛵' },
  { t: 'PLÁN', e: '🗺️' },  { t: 'PLOT', e: '🪵' },  { t: 'SPÍ', e: '😴' },   { t: 'SPOLU', e: '🤝' },
  { t: 'SPONA', e: '📎' }, { t: 'STŮL', e: '🪑' },  { t: 'STOPA', e: '🐾' }, { t: 'STÍN', e: '👤' },
  { t: 'STOJÍ', e: '🧍' }, { t: 'STÁDO', e: '🐑' }, { t: 'SMŮLA', e: '🖤' }, { t: 'SVETR', e: '🧶' },
  { t: 'PAST', e: '🪤' },  { t: 'MOST', e: '🌉' },  { t: 'LIST', e: '🍃' },  { t: 'LESK', e: '✨' },

  // Další shluky souhlásek
  { t: 'STROM', e: '🌳' }, { t: 'MRAK', e: '☁️' },  { t: 'VLAK', e: '🚂' },  { t: 'VLK', e: '🐺' },
  { t: 'VLNA', e: '🌊' },  { t: 'VLASY', e: '💇' }, { t: 'KROK', e: '👟' },  { t: 'KRK', e: '🦒' },
  { t: 'KRÁL', e: '👑' },  { t: 'KRÁVA', e: '🐮' }, { t: 'KLUK', e: '👦' },  { t: 'KLÍČ', e: '🔑' },
  { t: 'KLAS', e: '🌾' },  { t: 'KLEC', e: '🐦' },  { t: 'SKLO', e: '🥛' },  { t: 'SKÁLA', e: '🪨' },
  { t: 'SKOK', e: '🦘' },  { t: 'ŠKOLA', e: '🏫' }, { t: 'TRÁVA', e: '🌱' }, { t: 'TRN', e: '🌹' },
  { t: 'TRUBKA', e: '🎺' },{ t: 'PRST', e: '☝️' },  { t: 'PRACH', e: '💨' }, { t: 'PRÁDLO', e: '🧺' },
  { t: 'PRASE', e: '🐷' }, { t: 'PRŠÍ', e: '🌧️' },  { t: 'BRATR', e: '👦' }, { t: 'BRÁNA', e: '⛩️' },
  { t: 'BRADA', e: '🧔' }, { t: 'HRAD', e: '🏰' },  { t: 'HRÁCH', e: '🫛' }, { t: 'HŘIB', e: '🍄' },
  { t: 'SMRK', e: '🌲' },  { t: 'DRÁT', e: '🪢' },  { t: 'DRAK', e: '🪁' },  { t: 'DRÁHA', e: '🛤️' },
  { t: 'DŘEVO', e: '🪵' }, { t: 'PTÁK', e: '🐦' },  { t: 'ZVON', e: '🔔' },  { t: 'ZVUK', e: '🔊' },
  { t: 'ZVÍŘE', e: '🦌' }, { t: 'BLESK', e: '⚡' }, { t: 'BLÁTO', e: '🥾' }, { t: 'MLÉKO', e: '🥛' },
  { t: 'MLHA', e: '🌫️' },  { t: 'MLÝN', e: '⚙️' },  { t: 'PARK', e: '🌳' },

  // Dvojhlásky OU a AU
  { t: 'AUTO', e: '🚗' },   { t: 'AUTOBUS', e: '🚌' }, { t: 'LOUKA', e: '🌼' }, { t: 'MOUKA', e: '🌾' },
  { t: 'KOULE', e: '⚪' },  { t: 'BOUDA', e: '🐶' },   { t: 'HOUBA', e: '🍄' }, { t: 'LOUŽE', e: '🌧️' },
  { t: 'MOUCHA', e: '🪰' }, { t: 'FOUKÁ', e: '💨' },   { t: 'KOUKÁ', e: '👀' }, { t: 'HOUPÁ', e: '🎠' },
  { t: 'LOUPÁ', e: '🍌' },  { t: 'KOUŘ', e: '💨' },    { t: 'BOUŘE', e: '⛈️' }, { t: 'KOUZLO', e: '🪄' },
  { t: 'PAVOUK', e: '🕷️' }, { t: 'KOHOUT', e: '🐓' },  { t: 'KOCOUR', e: '🐈' }, { t: 'DLOUHÝ', e: '📏' }
];

/* 6. ZÁLOŽKA: MĚKČENÉ HLÁSKY (DĚ, TĚ, NĚ, BĚ, PĚ, VĚ, MĚ, DI, TI, NI) */
const RAW_LEVEL_6_WORDS = [
  { t: 'PĚNA', e: '🧼' },   { t: 'PĚT', e: '5️⃣' },    { t: 'PĚJE', e: '🎤' },   { t: 'OPĚT', e: '🔄' },
  { t: 'POUPĚ', e: '🌷' },  { t: 'DOUPĚ', e: '🕳️' },  { t: 'MĚSTO', e: '🏙️' },  { t: 'MĚSÍC', e: '🌙' },
  { t: 'PAMĚŤ', e: '🧠' },  { t: 'ÚSMĚV', e: '😊' },  { t: 'ZEMĚ', e: '🌍' },   { t: 'TĚLO', e: '🧍' },
  { t: 'TĚSTO', e: '🥐' },  { t: 'TĚŠÍ', e: '🤩' },   { t: 'KOTĚ', e: '🐱' },   { t: 'DÍTĚ', e: '👶' },
  { t: 'KOŠTĚ', e: '🧹' },  { t: 'ŠTĚNĚ', e: '🐶' },  { t: 'SOUTĚŽ', e: '🏆' }, { t: 'KONĚ', e: '🐎' },
  { t: 'VŮNĚ', e: '🌸' },   { t: 'SÁNĚ', e: '🛷' },   { t: 'PÍSNĚ', e: '🎶' },  { t: 'TŘEŠNĚ', e: '🍒' },
  { t: 'SNĚŽÍ', e: '❄️' },  { t: 'SNĚHULÁK', e: '⛄' },{ t: 'DĚDA', e: '👴' },   { t: 'DĚTI', e: '🧒' },
  { t: 'NEDĚLE', e: '📅' }, { t: 'LODĚ', e: '⛵' },    { t: 'MLÁDĚ', e: '🐣' },  { t: 'OBĚD', e: '🍲' },
  { t: 'MEDVĚD', e: '🐻' }, { t: 'BĚŽÍ', e: '🏃' },   { t: 'BĚH', e: '👟' },    { t: 'HŘÍBĚ', e: '🐴' },
  { t: 'VĚTEV', e: '🌿' },  { t: 'VĚC', e: '📦' },    { t: 'VĚŽ', e: '🗼' },    { t: 'VĚDRO', e: '🪣' },
  { t: 'KVĚT', e: '🌸' },   { t: 'KVĚTINA', e: '🌺' },{ t: 'SVĚT', e: '🌍' },   { t: 'SVĚTLO', e: '💡' },
  { t: 'HVĚZDA', e: '⭐' }, { t: 'DEVĚT', e: '9️⃣' },  { t: 'ČLOVĚK', e: '🧍' },
  { t: 'DÍVKA', e: '👧' },  { t: 'RODINA', e: '👨‍👩‍👧' }, { t: 'HODINY', e: '⏰' }, { t: 'DIVADLO', e: '🎭' },
  { t: 'BUDÍK', e: '⏰' },  { t: 'VIDÍ', e: '👀' },   { t: 'SEDÍ', e: '🪑' },   { t: 'CHODÍ', e: '🚶' },
  { t: 'TICHO', e: '🤫' },  { t: 'TISÍC', e: '🔢' },  { t: 'TALÍŘ', e: '🍽️' },  { t: 'SVÍTÍ', e: '☀️' },
  { t: 'LETÍ', e: '🦅' },   { t: 'ČISTÍ', e: '🪥' },  { t: 'NÍZKÝ', e: '📏' },  { t: 'NIT', e: '🧵' },
  { t: 'KNIHA', e: '📖' },  { t: 'HNÍZDO', e: '🪹' }, { t: 'SNÍH', e: '❄️' },   { t: 'SNÍDANĚ', e: '🥐' },
  { t: 'SLUNÍČKO', e: '☀️' },{ t: 'KONÍK', e: '🐴' }, { t: 'CHODNÍK', e: '🚶' },{ t: 'ŠIŠKA', e: '🌲' },
  { t: 'ŽIDLE', e: '🪑' },  { t: 'CIBULE', e: '🧅' }, { t: 'KUŘE', e: '🐥' }
];

/* 7. ZÁLOŽKA: SMYSLUPLNÉ VĚTY ZE SLABIKÁŘE */
const RAW_LEVEL_7_SENTENCES = [
  // FÁZE 1A: Čistě z Míšových současných písmen BEZ Á
  { t: 'EMA MELE MASO.', e: '👧⚙️' },
  { t: 'EMA MELE SŮL.', e: '👧🧂' },
  { t: 'ELA MELE MASO.', e: '👧🍖' },
  { t: 'MÍLA MELE MASO.', e: '👦⚙️' },
  { t: 'PEPA MELE MASO.', e: '👦⚙️' },
  { t: 'EMA SOLÍ MASO.', e: '👧🧂' },
  { t: 'ELA SOLÍ MASO.', e: '👧🍖' },
  { t: 'MÍLA SOLÍ MASO.', e: '👦🧂' },
  { t: 'PEPA SOLÍ MASO.', e: '👦🧂' },
  { t: 'PES SPÍ.', e: '🐶😴' },
  { t: 'PES SPÍ U LESA.', e: '🐶🌲' },
  { t: 'PES SPÍ U MOLA.', e: '🐶⚓' },
  { t: 'LAMA SPÍ U LESA.', e: '🦙🌲' },
  { t: 'SELE SPÍ U LESA.', e: '🐷🌲' },
  { t: 'LAMA SE PASE.', e: '🦙🌾' },
  { t: 'SELE SE PASE.', e: '🐷🌾' },
  { t: 'LAMA SE PASE U LESA.', e: '🦙🌲' },
  { t: 'SELE SE PASE U LESA.', e: '🐷🌲' },
  { t: 'PEPA LEPÍ MAPU.', e: '👦🗺️' },
  { t: 'EMA LEPÍ MAPU.', e: '👧🗺️' },
  { t: 'ELA LEPÍ MAPU.', e: '👧🗺️' },
  { t: 'MÍLA LEPÍ MAPU.', e: '👦🗺️' },
  { t: 'OLA LEPÍ MAPU.', e: '👧🗺️' },
  { t: 'U LESA SPÍ PES.', e: '🌲🐶' },
  { t: 'U MOLA SPÍ PES.', e: '⚓🐶' },

  // FÁZE 1B: Míšova současná písmena + Á
  { t: 'MÁMA MÁ MASO.', e: '👩🍖' },
  { t: 'MÁMA MÁ MÁSLO.', e: '👩🧈' },
  { t: 'MÁMA MÁ MÍSU.', e: '👩🥣' },
  { t: 'MÁMA MÁ MAPU.', e: '👩🗺️' },
  { t: 'MÁMA MÁ LUPU.', e: '👩🔍' },
  { t: 'MÁMA MÁ PILU.', e: '👩🪚' },
  { t: 'MÁMA MÁ LASO.', e: '👩🪢' },
  { t: 'MÁMA MÁ SELE.', e: '👩🐷' },
  { t: 'MÁMA MÁ LAMU.', e: '👩🦙' },
  { t: 'MÁMA MÁ PSA.', e: '👩🐶' },
  { t: 'MÁMA MÁ SŮL.', e: '👩🧂' },
  { t: 'MÁMA MELE MASO.', e: '👩⚙️' },
  { t: 'MÁMA SOLÍ MASO.', e: '👩🧂' },
  { t: 'MÁMA SPÍ.', e: '👩😴' },
  { t: 'EMA MÁ MÁMU.', e: '👧👩' },
  { t: 'EMA MÁ MASO.', e: '👧🥩' },
  { t: 'EMA MÁ MÁSLO.', e: '👧🧈' },
  { t: 'EMA MÁ SELE.', e: '👧🐷' },
  { t: 'EMA MÁ MALÉ SELE.', e: '👧🐷' },
  { t: 'EMA MÁ MALOU MÍSU.', e: '👧🥣' },
  { t: 'EMA MÁ MALOU MAPU.', e: '👧🗺️' },
  { t: 'EMA MÁ MALOU LUPU.', e: '👧🔍' },
  { t: 'ELA MÁ LASO.', e: '👧🪢' },
  { t: 'ÁLA MÁ LASO.', e: '👧🪢' },
  { t: 'ÁLA MÁ SELE.', e: '👧🐷' },
  { t: 'ÁLA MÁ LAMU.', e: '👧🦙' },
  { t: 'ÁLA MÁ MÍSU.', e: '👧🥣' },
  { t: 'ÁLA MELE MASO.', e: '👧🥣' },
  { t: 'MÍLA MÁ PSA.', e: '👦🐕' },
  { t: 'MÍLA MÁ LASO.', e: '👦🪢' },
  { t: 'MÍLA MÁ MAPU.', e: '👦🗺️' },
  { t: 'PEPA MÁ PSA.', e: '👦🐶' },
  { t: 'PEPA MÁ PAS.', e: '👦🛂' },
  { t: 'PEPA MÁ PILU.', e: '👦🪚' },
  { t: 'PEPA MÁ LUPU.', e: '👦🔍' },
  { t: 'PEPA MÁ MAPU.', e: '👦🗺️' },
  { t: 'PEPA MÁ MÍSU.', e: '👦🥣' },
  { t: 'PEPA MÁ LASO.', e: '👦🪢' },
  { t: 'PEPA MÁ SELE.', e: '👦🐷' },
  { t: 'PEPA MÁ SLÁMU.', e: '👦🌾' },
  { t: 'PEPA PÁLÍ SLÁMU.', e: '👦🔥' },
  { t: 'PES MÁ MASO.', e: '🐶🥩' },
  { t: 'PES MÁ MÍSU.', e: '🐶🥣' },
  { t: 'LAMA MÁ SLÁMU.', e: '🦙🌾' },
  { t: 'SELE MÁ SLÁMU.', e: '🐷🌾' },

  // FÁZE 2: Po přidání T, Y, Ý
  { t: 'TÁTA MÁ PSA.', e: '👨🐶' },
  { t: 'TÁTA MÁ PILU.', e: '👨🪚' },
  { t: 'TÁTA MÁ MAPU.', e: '👨🗺️' },
  { t: 'TÁTA MÁ AUTO.', e: '👨🚗' },
  { t: 'TÁTA MELE MASO.', e: '👨⚙️' },
  { t: 'TÁTA PÁLÍ SLÁMU.', e: '👨🔥' },
  { t: 'TÁTA LEPÍ MAPU.', e: '👨🗺️' },
  { t: 'TÁTA SPÍ.', e: '👨😴' },
  { t: 'TETA MÁ MÍSU.', e: '👩🥣' },
  { t: 'TETA MÁ MÁSLO.', e: '👩🧈' },
  { t: 'TETA MÁ LAMU.', e: '👩🦙' },
  { t: 'TETA MÁ SELE.', e: '👩🐷' },
  { t: 'TETA SOLÍ MASO.', e: '👩🧂' },
  { t: 'OTA MÁ PSA.', e: '👦🐶' },
  { t: 'OTA MÁ AUTO.', e: '👦🚗' },
  { t: 'OTA MÁ MAPU.', e: '👦🗺️' },
  { t: 'TOM MÁ PSA.', e: '👦🐕' },
  { t: 'TOM MÁ AUTO.', e: '👦🚗' },
  { t: 'TADY SPÍ PES.', e: '📍🐶' },
  { t: 'TADY SE PASE SELE.', e: '📍🐷' },
  { t: 'TADY SE PASE LAMA.', e: '📍🦙' },
  { t: 'MY MÁME PSA.', e: '👨‍👩‍👦🐶' },
  { t: 'MY MÁME AUTO.', e: '👨‍👩‍👦🚗' },
  { t: 'U LÍPY SPÍ PES.', e: '🌳🐶' },

  // FÁZE 3: Po přidání J, N, V, Z
  { t: 'JANA MÁ PSA.', e: '👧🐶' },
  { t: 'JANA MÁ MÍSU.', e: '👧🥣' },
  { t: 'PEPA PIJE.', e: '👦🥤' },
  { t: 'TÁTA PIJE.', e: '👨🥤' },
  { t: 'MÁMA PIJE.', e: '👩🥤' },
  { t: 'PES PIJE.', e: '🐶💧' },
  { t: 'LAMA MÁ SENO.', e: '🦙🌾' },
  { t: 'SELE MÁ SENO.', e: '🐷🌾' },
  { t: 'PES JE V LESE.', e: '🐶🌲' },
  { t: 'PES STOJÍ U LESA.', e: '🐕🌲' },
  { t: 'V LESE JE LOS.', e: '🌲🦌' },
  { t: 'V LESE JE LEV.', e: '🌲🦁' },
  { t: 'LAMA JE NA POLI.', e: '🦙🌾' },
  { t: 'SELE JE NA POLI.', e: '🐷🌾' },
  { t: 'TÁTA JE NA POLI.', e: '👨🌾' },
  { t: 'MÁMA VOLÁ EMU.', e: '👩📢' },
  { t: 'MÁMA VOLÁ PEPU.', e: '👩👦' },
  { t: 'MÁMA VOLÁ TÁTU.', e: '👩👨' },
  { t: 'TÁTA VOLÁ PSA.', e: '👨🐕' },
  { t: 'OLA MÁ NOVÉ AUTO.', e: '👧🚗' },
  { t: 'TÁTA MÁ NOVÉ AUTO.', e: '👨🚗' },
  { t: 'PES NESE MASO.', e: '🐶🥩' },
  { t: 'MÁMA NESE MÍSU.', e: '👩🥣' },
  { t: 'TÁTA NESE PILU.', e: '👨🪚' },
  { t: 'PEPA NESE MAPU.', e: '👦🗺️' },
  { t: 'VOSA LETÍ.', e: '🐝💨' },
  { t: 'SOVA LETÍ.', e: '🦉🌙' },

  // FÁZE 4: Plný Slabikář (+ D, K, B, R, H, C, Č, Š, Ž, Ř, CH, Ě)
  { t: 'SÁRA MÁ LASO.', e: '👧🪢' },
  { t: 'SÁRA MÁ SELE.', e: '👧🐷' },
  { t: 'TÁTA PÍŠE.', e: '👨✍️' },
  { t: 'PEPA PÍŠE.', e: '👦✍️' },
  { t: 'TÁTA PÍŠE DOPIS.', e: '👨✉️' },
  { t: 'FILIP PÍŠE ÚKOL.', e: '👦✏️' },
  { t: 'PEPA PÁLÍ LISTÍ.', e: '👦🍂' },
  { t: 'PEPA MÁ PUK.', e: '👦🏒' },
  { t: 'TÁTA MÁ PÁLKU.', e: '👨🏓' },
  { t: 'TÁTA MÁ KOLO.', e: '👨🚲' },
  { t: 'TETA MÁ KOLO.', e: '👩🚲' },
  { t: 'MÁMA PEČE MASO.', e: '👩🍗' },
  { t: 'MÁMA PERE PRÁDLO.', e: '👩🧺' },
  { t: 'EMA MELE KÁVU.', e: '👧☕' },
  { t: 'MÁMA MÁ ČAJ.', e: '👩🍵' },
  { t: 'PEPA PIJE TEPLÝ ČAJ.', e: '👦🍵' },
  { t: 'JANA PIJE TEPLÝ ČAJ.', e: '👧🍵' },
  { t: 'BABIČKA PEČE KOLÁČ.', e: '👵🥧' },
  { t: 'DĚDEČEK ČTE KNIHU.', e: '👴📖' },
  { t: 'PES PIJE Z MISKY.', e: '🐶🥣' },
  { t: 'PES LESEM BĚŽÍ.', e: '🐕🌲' },
  { t: 'PES SPÍ U BOUDY.', e: '🐶🏠' },
  { t: 'PES MÁ MALOU BOUDU.', e: '🐶🏠' },
  { t: 'PES NESE MÍČEK.', e: '🐕🎾' },
  { t: 'PES SE JMENUJE ALÍK.', e: '🐕✨' },
  { t: 'PES HLÍDÁ NÁŠ DŮM.', e: '🐕🏡' },
  { t: 'KOTĚ SPÍ V KOŠÍKU.', e: '🐱🧺' },
  { t: 'MYŠKA ŽVÝKÁ SÝR.', e: '🐭🧀' },
  { t: 'NA POLI ROSTE MÁK.', e: '🌾🌺' },
  { t: 'NA LOUCE JE SELE.', e: '🌼🐷' },
  { t: 'TÁTA SEKÁ TRÁVU.', e: '👨🌾' },
  { t: 'V POTOCE PLAVE RYBA.', e: '🐟🌊' },
  { t: 'ŽÁBA SKOČILA DO VODY.', e: '🐸🌊' },
  { t: 'NA VĚTVI SEDÍ KOS.', e: '🐦🌿' },
  { t: 'SOVA HOUKÁ V NOCI.', e: '🦉🌙' },
  { t: 'HUSA CHODÍ PO DVORKU.', e: '🪿🏡' },
  { t: 'MALÉ KŮZLE SKÁČE.', e: '🐐🪨' },
  { t: 'MEDVĚD MÁ RÁD MED.', e: '🐻🍯' },
  { t: 'V ZAHRADĚ KVETE RŮŽE.', e: '🌹🪴' },
  { t: 'NA OBLOZE PLUJE MRAK.', e: '☁️🌤️' },
  { t: 'VLAK JEDE DO MĚSTA.', e: '🚂🏙️' },
  { t: 'AUTO TROUBÍ NA CESTĚ.', e: '🚗📢' },
  { t: 'MÁMA NESE NÁKUP.', e: '👩🛍️' },
  { t: 'DĚDA PRACUJE V DÍLNĚ.', e: '👴🔨' },
  { t: 'TÁTA OPRAVUJE AUTO.', e: '👨🔧' },
  { t: 'PETR POUŠTÍ DRAKA.', e: '👦🪁' },
  { t: 'PETR MÁ NOVÝ MÍČ.', e: '👦⚽' },
  { t: 'HONZA STAVÍ HRAD.', e: '👦🏰' },
  { t: 'LUCKA KRESLÍ DŮM.', e: '👧🎨' },
  { t: 'DĚTI SI HRAJÍ.', e: '🧒🎈' },
  { t: 'V ZIMĚ PADÁ SNÍH.', e: '❄️⛄' }
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
  { id: 6, name: 'Charizard', color: '#EA580C', stroke: '#9A3412' }
];