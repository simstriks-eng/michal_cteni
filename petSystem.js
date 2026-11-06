/* ============================================================
   petSystem.js - Školácká Mise
   Modul: Aréna společníků (Pet RPG)
   - 4 unikátní petové (všichni zamčení do startu, odemykají se v Obchodě)
   - Každý pet se expí, leveluje a drží HP samostatně
   - Diamanty pouze za dokončení celého Levelu peta (za výhru krmivo + XP)
   - Denní limit zápasů + automatické noční uzdravení HP všech petů
   - Strikní filtrování čtecích úkolů pouze z aktivních písmenek v Adminu
   ============================================================ */

const PETS_DATABASE = [
  {
    id: 'pikachu',
    name: 'Pikachu',
    element: 'Elektrický ⚡',
    elementKey: 'electric',
    price: 8, // Všichni peti včetně Pikachu se musí odemknout
    baseHp: 100,
    lightAttackName: 'Bleskový Šok ⚡',
    heavyAttackName: 'Hromový Úder 🌩️',
    accentColor: '#eab308',
    cardBg: 'from-amber-400/20 via-yellow-300/15 to-amber-500/20',
    borderColor: 'border-amber-400',
    badgeClass: 'bg-amber-400 text-amber-950',
    description: 'Míšův bleskový parťák! Útočí jiskřivým bleskem a oslňuje protivníky.',
    svg: `
      <svg viewBox="0 0 120 120" class="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Ocas blesk -->
        <polygon points="88,78 106,62 98,58 114,40 94,46 100,52 82,68" fill="#eab308" stroke="#713f12" stroke-width="2.5" stroke-linejoin="round"/>
        <!-- Levé a pravé ucho -->
        <polygon points="28,10 44,38 28,44" fill="#facc15" stroke="#713f12" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="28,10 35,22 28,24" fill="#1e293b"/>
        <polygon points="92,10 76,38 92,44" fill="#facc15" stroke="#713f12" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="92,10 85,22 92,24" fill="#1e293b"/>
        <!-- Tělo -->
        <ellipse cx="60" cy="82" rx="26" ry="24" fill="#facc15" stroke="#713f12" stroke-width="2.5"/>
        <!-- Tlapky -->
        <ellipse cx="44" cy="103" rx="8" ry="5" fill="#eab308" stroke="#713f12" stroke-width="2"/>
        <ellipse cx="76" cy="103" rx="8" ry="5" fill="#eab308" stroke="#713f12" stroke-width="2"/>
        <!-- Hlava -->
        <circle cx="60" cy="54" r="26" fill="#facc15" stroke="#713f12" stroke-width="2.5"/>
        <!-- Oči -->
        <circle cx="48" cy="50" r="5" fill="#0f172a"/>
        <circle cx="49.5" cy="48.5" r="1.8" fill="#ffffff"/>
        <circle cx="72" cy="50" r="5" fill="#0f172a"/>
        <circle cx="73.5" cy="48.5" r="1.8" fill="#ffffff"/>
        <!-- Červené tvářičky -->
        <circle cx="39" cy="60" r="6" fill="#ef4444" opacity="0.9"/>
        <circle cx="81" cy="60" r="6" fill="#ef4444" opacity="0.9"/>
        <!-- Čumáček a úsměv -->
        <polygon points="58,55 62,55 60,57.5" fill="#713f12"/>
        <path d="M52 61 Q56 65 60 61 Q64 65 68 61" stroke="#713f12" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      </svg>
    `
  },
  {
    id: 'bulbasaur',
    name: 'Bulbasaur',
    element: 'Travní 🌿',
    elementKey: 'grass',
    price: 8,
    baseHp: 110,
    lightAttackName: 'Švih Liánou 🌿',
    heavyAttackName: 'Sluneční Bouře 🍃',
    accentColor: '#10b981',
    cardBg: 'from-emerald-400/20 via-green-300/15 to-teal-500/20',
    borderColor: 'border-emerald-400',
    badgeClass: 'bg-emerald-500 text-white',
    description: 'Odolný travní strážce s kouzelným poupětem na zádech a silnými liánami.',
    svg: `
      <svg viewBox="0 0 120 120" class="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Poupě na zádech -->
        <path d="M35 55 C35 24 85 24 85 55 Z" fill="#16a34a" stroke="#064e3b" stroke-width="2.5"/>
        <path d="M48 34 Q60 22 72 34 Q60 46 48 34 Z" fill="#22c55e" stroke="#064e3b" stroke-width="2"/>
        <!-- Tělo -->
        <ellipse cx="60" cy="76" rx="32" ry="22" fill="#2dd4bf" stroke="#0f766e" stroke-width="2.5"/>
        <!-- Skvrny -->
        <circle cx="42" cy="72" r="5" fill="#0d9488"/>
        <circle cx="78" cy="70" r="6" fill="#0d9488"/>
        <!-- Nohy -->
        <rect x="34" y="86" width="12" height="16" rx="5" fill="#2dd4bf" stroke="#0f766e" stroke-width="2.5"/>
        <rect x="74" y="86" width="12" height="16" rx="5" fill="#2dd4bf" stroke="#0f766e" stroke-width="2.5"/>
        <!-- Hlava -->
        <ellipse cx="60" cy="62" rx="26" ry="20" fill="#5eead4" stroke="#0f766e" stroke-width="2.5"/>
        <!-- Oči -->
        <ellipse cx="48" cy="58" rx="4.5" ry="5.5" fill="#dc2626"/>
        <circle cx="49" cy="56" r="1.8" fill="#ffffff"/>
        <ellipse cx="72" cy="58" rx="4.5" ry="5.5" fill="#dc2626"/>
        <circle cx="73" cy="56" r="1.8" fill="#ffffff"/>
        <!-- Úsměv -->
        <path d="M48 68 Q60 74 72 68" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      </svg>
    `
  },
  {
    id: 'sonic',
    name: 'Ježek Sonic',
    element: 'Rychlostní 🌀',
    elementKey: 'speed',
    price: 12,
    baseHp: 105,
    lightAttackName: 'Spin Dash 🌀',
    heavyAttackName: 'Supersonický Úder 💨',
    accentColor: '#3b82f6',
    cardBg: 'from-blue-500/20 via-sky-400/15 to-indigo-500/20',
    borderColor: 'border-blue-400',
    badgeClass: 'bg-blue-600 text-white',
    description: 'Nejrychlejší modrý ježek! Roztočí se do bleskové koule a prorazí každou obranu.',
    svg: `
      <svg viewBox="0 0 120 120" class="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Bodliny vzadu -->
        <polygon points="28,34 8,44 32,54" fill="#1d4ed8" stroke="#1e3a8a" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="26,50 4,64 32,70" fill="#2563eb" stroke="#1e3a8a" stroke-width="2.5" stroke-linejoin="round"/>
        <polygon points="30,66 12,82 38,82" fill="#1d4ed8" stroke="#1e3a8a" stroke-width="2.5" stroke-linejoin="round"/>
        <!-- Tělo a bříško -->
        <ellipse cx="62" cy="82" rx="20" ry="18" fill="#2563eb" stroke="#1e3a8a" stroke-width="2.5"/>
        <ellipse cx="64" cy="82" rx="12" ry="13" fill="#fed7aa"/>
        <!-- Červené tenisky -->
        <rect x="40" y="96" width="18" height="10" rx="5" fill="#dc2626" stroke="#7f1d1d" stroke-width="2"/>
        <rect x="46" y="96" width="4" height="10" fill="#ffffff"/>
        <rect x="66" y="96" width="18" height="10" rx="5" fill="#dc2626" stroke="#7f1d1d" stroke-width="2"/>
        <rect x="72" y="96" width="4" height="10" fill="#ffffff"/>
        <!-- Hlava -->
        <circle cx="64" cy="50" r="24" fill="#2563eb" stroke="#1e3a8a" stroke-width="2.5"/>
        <!-- Ouška -->
        <polygon points="48,30 54,16 62,28" fill="#2563eb" stroke="#1e3a8a" stroke-width="2.5"/>
        <polygon points="72,28 82,16 86,32" fill="#2563eb" stroke="#1e3a8a" stroke-width="2.5"/>
        <!-- Oči -->
        <ellipse cx="66" cy="48" rx="12" ry="10" fill="#ffffff" stroke="#1e3a8a" stroke-width="2"/>
        <ellipse cx="70" cy="48" rx="4" ry="6" fill="#16a34a"/>
        <circle cx="70" cy="48" r="2.2" fill="#0f172a"/>
        <circle cx="71" cy="46" r="1" fill="#ffffff"/>
        <!-- Čumák -->
        <ellipse cx="68" cy="60" rx="16" ry="9" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/>
        <ellipse cx="82" cy="57" rx="4" ry="2.5" fill="#0f172a"/>
        <path d="M62 63 Q70 67 76 62" stroke="#9a3412" stroke-width="2" stroke-linecap="round" fill="none"/>
      </svg>
    `
  },
  {
    id: 'charmander',
    name: 'Ohnivý Charmander',
    element: 'Ohnivý 🔥',
    elementKey: 'fire',
    price: 10,
    baseHp: 100,
    lightAttackName: 'Ohnivý Švih 🔥',
    heavyAttackName: 'Dračí Plamen 🌋',
    accentColor: '#f97316',
    cardBg: 'from-orange-500/20 via-red-400/15 to-amber-500/20',
    borderColor: 'border-orange-400',
    badgeClass: 'bg-orange-500 text-white',
    description: 'Ohnivý dráček s věčným plamenem na ocase! Spaluje překážky žhavou koulí.',
    svg: `
      <svg viewBox="0 0 120 120" class="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Ocas a plamen -->
        <path d="M80 86 Q102 82 104 62" stroke="#fb923c" stroke-width="10" stroke-linecap="round" fill="none"/>
        <path d="M104 60 C96 48 104 34 108 28 C114 36 118 48 104 60 Z" fill="#ef4444"/>
        <path d="M104 58 C100 50 104 42 107 38 C110 42 112 50 104 58 Z" fill="#facc15"/>
        <!-- Tělo a bříško -->
        <ellipse cx="58" cy="80" rx="24" ry="24" fill="#fb923c" stroke="#9a3412" stroke-width="2.5"/>
        <ellipse cx="58" cy="82" rx="15" ry="18" fill="#fef08a"/>
        <!-- Nohy -->
        <ellipse cx="42" cy="102" rx="8" ry="5" fill="#fb923c" stroke="#9a3412" stroke-width="2"/>
        <ellipse cx="74" cy="102" rx="8" ry="5" fill="#fb923c" stroke="#9a3412" stroke-width="2"/>
        <!-- Hlava -->
        <circle cx="58" cy="48" r="23" fill="#fb923c" stroke="#9a3412" stroke-width="2.5"/>
        <!-- Oči -->
        <circle cx="48" cy="45" r="4.5" fill="#0f172a"/>
        <circle cx="49.5" cy="43.5" r="1.6" fill="#ffffff"/>
        <circle cx="68" cy="45" r="4.5" fill="#0f172a"/>
        <circle cx="69.5" cy="43.5" r="1.6" fill="#ffffff"/>
        <!-- Úsměv s tesáky -->
        <path d="M48 56 Q58 63 68 56" stroke="#7c2d12" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <polygon points="51,57 53,61 55,58" fill="#ffffff"/>
        <polygon points="65,57 63,61 61,58" fill="#ffffff"/>
      </svg>
    `
  }
];

const ARENA_MONSTERS_ROSTER = [
  {
    id: 'creeper_bot',
    name: 'Temný Creeper',
    title: 'Lesní Výbušník',
    color: '#22c55e',
    svg: `
      <svg viewBox="0 0 120 120" class="w-full h-full drop-shadow-md" fill="none">
        <rect x="24" y="18" width="72" height="72" rx="10" fill="#16a34a" stroke="#052e16" stroke-width="3.5"/>
        <rect x="36" y="34" width="16" height="16" fill="#052e16"/>
        <rect x="68" y="34" width="16" height="16" fill="#052e16"/>
        <rect x="52" y="50" width="16" height="22" fill="#052e16"/>
        <rect x="42" y="60" width="10" height="20" fill="#052e16"/>
        <rect x="68" y="60" width="10" height="20" fill="#052e16"/>
        <rect x="32" y="90" width="22" height="16" rx="4" fill="#15803d" stroke="#052e16" stroke-width="3"/>
        <rect x="66" y="90" width="22" height="16" rx="4" fill="#15803d" stroke="#052e16" stroke-width="3"/>
      </svg>
    `
  },
  {
    id: 'gengar_bot',
    name: 'Stínový Gengar',
    title: 'Pán Noční Mlhy',
    color: '#a855f7',
    svg: `
      <svg viewBox="0 0 120 120" class="w-full h-full drop-shadow-md" fill="none">
        <polygon points="24,18 44,36 22,42" fill="#7e22ce" stroke="#3b0764" stroke-width="3"/>
        <polygon points="96,18 76,36 98,42" fill="#7e22ce" stroke="#3b0764" stroke-width="3"/>
        <circle cx="60" cy="64" r="38" fill="#9333ea" stroke="#3b0764" stroke-width="3.5"/>
        <polygon points="36,48 54,56 38,60" fill="#ef4444"/>
        <polygon points="84,48 66,56 82,60" fill="#ef4444"/>
        <path d="M38 72 Q60 92 82 72 Z" fill="#ffffff" stroke="#3b0764" stroke-width="2.5"/>
        <line x1="50" y1="73" x2="50" y2="82" stroke="#3b0764" stroke-width="2.5"/>
        <line x1="60" y1="74" x2="60" y2="84" stroke="#3b0764" stroke-width="2.5"/>
        <line x1="70" y1="73" x2="70" y2="82" stroke="#3b0764" stroke-width="2.5"/>
      </svg>
    `
  },
  {
    id: 'eggman_bot',
    name: 'Robo-Drtič',
    title: 'Mechanický Golem',
    color: '#ef4444',
    svg: `
      <svg viewBox="0 0 120 120" class="w-full h-full drop-shadow-md" fill="none">
        <rect x="26" y="24" width="68" height="64" rx="14" fill="#475569" stroke="#0f172a" stroke-width="3.5"/>
        <rect x="36" y="38" width="48" height="16" rx="6" fill="#0f172a"/>
        <circle cx="48" cy="46" r="5" fill="#ef4444"/>
        <circle cx="72" cy="46" r="5" fill="#ef4444"/>
        <rect x="42" y="66" width="36" height="10" rx="3" fill="#eab308" stroke="#0f172a" stroke-width="2"/>
        <line x1="60" y1="10" x2="60" y2="24" stroke="#0f172a" stroke-width="4"/>
        <circle cx="60" cy="10" r="6" fill="#ef4444"/>
      </svg>
    `
  },
  {
    id: 'ender_dragon_bot',
    name: 'Ender Drak',
    title: 'Strážce Portálu',
    color: '#c084fc',
    svg: `
      <svg viewBox="0 0 120 120" class="w-full h-full drop-shadow-md" fill="none">
        <polygon points="10,40 36,30 32,68" fill="#1e1b4b" stroke="#a855f7" stroke-width="2.5"/>
        <polygon points="110,40 84,30 88,68" fill="#1e1b4b" stroke="#a855f7" stroke-width="2.5"/>
        <rect x="30" y="28" width="60" height="58" rx="12" fill="#0f172a" stroke="#9333ea" stroke-width="3.5"/>
        <rect x="38" y="46" width="16" height="8" rx="2" fill="#e879f9"/>
        <rect x="66" y="46" width="16" height="8" rx="2" fill="#e879f9"/>
        <path d="M44 72 L52 66 L60 72 L68 66 L76 72" stroke="#c084fc" stroke-width="3" fill="none"/>
      </svg>
    `
  },
  {
    id: 'magma_boss',
    name: 'Lávový Titán',
    title: 'Vládce Sopky',
    color: '#f97316',
    svg: `
      <svg viewBox="0 0 120 120" class="w-full h-full drop-shadow-md" fill="none">
        <rect x="22" y="22" width="76" height="72" rx="14" fill="#7c2d12" stroke="#431407" stroke-width="3.5"/>
        <path d="M26 42 H94 M26 68 H94" stroke="#f97316" stroke-width="4"/>
        <polygon points="36,48 54,54 38,58" fill="#fef08a"/>
        <polygon points="84,48 66,54 82,58" fill="#fef08a"/>
        <rect x="42" y="74" width="36" height="10" rx="4" fill="#fb923c"/>
      </svg>
    `
  }
];

function getPetTodayDateStr() {
  if (typeof getTodayDateString === 'function') return getTodayDateString();
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function createDefaultPetSystemState() {
  const petsObj = {};
  PETS_DATABASE.forEach((p) => {
    petsObj[p.id] = {
      unlocked: false, // Všichni peti včetně Pikachu jsou na startu zamčení
      level: 1,
      xp: 0,
      currentHp: p.baseHp,
      isKnockedOut: false,
      wins: 0,
      losses: 0,
      customPrice: p.price
    };
  });

  return {
    activePetId: null,
    lockedByDefaultMigratedV2: true,
    lastArenaDate: getPetTodayDateStr(),
    battlesToday: 0,
    petFoodCount: 2,
    revivePotionsCount: 1,
    pets: petsObj,
    config: {
      monsterBaseHp: 100,
      monsterHpPerLevel: 22,
      monsterBaseDmg: 20,
      xpPerWin: 35,
      xpCurveMultiplier: 1.45,
      reviveCostDiamonds: 2,
      foodCostDiamonds: 1,
      diamondsPerLevelUp: 3,
      foodPerWin: 1,
      maxDailyBattles: 5,
      taskSubjectMode: 'mixed' // 'mixed', 'reading', 'math'
    }
  };
}

let arenaBattleState = {
  inProgress: false,
  monster: null,
  monsterLevel: 1,
  monsterMaxHp: 100,
  monsterCurrentHp: 100,
  selectedAttackType: 'light', // 'light' | 'heavy'
  activeTask: null,
  turnLocked: false,
  battleLog: 'Vyber útok a odpověz správně!'
};

function getFirstUnlockedPetId() {
  if (!window.state || !window.state.petSystem || !window.state.petSystem.pets) return null;
  for (const p of PETS_DATABASE) {
    const pData = window.state.petSystem.pets[p.id];
    if (pData && pData.unlocked) return p.id;
  }
  return null;
}

function ensurePetStateInitialized() {
  if (!window.state) return;
  if (!window.state.petSystem) {
    window.state.petSystem = createDefaultPetSystemState();
  } else {
    const ps = window.state.petSystem;
    const def = createDefaultPetSystemState();
    if (!ps.config) ps.config = def.config;
    else ps.config = { ...def.config, ...ps.config };

    if (!ps.pets) ps.pets = def.pets;
    else {
      PETS_DATABASE.forEach(p => {
        if (!ps.pets[p.id]) {
          ps.pets[p.id] = def.pets[p.id];
        }
      });
    }

    // Migrace: pokud byl Pikachu automaticky odemčený z minulé verze bez jediného zápasu, zamkneme ho
    if (!ps.lockedByDefaultMigratedV2) {
      ps.lockedByDefaultMigratedV2 = true;
      const pik = ps.pets['pikachu'];
      if (pik && (pik.wins || 0) === 0 && (pik.xp || 0) === 0 && (pik.level || 1) === 1) {
        pik.unlocked = false;
        if (!pik.customPrice || pik.customPrice === 0) pik.customPrice = 8;
      }
    }

    if (ps.battlesToday === undefined) ps.battlesToday = 0;

    // Ověříme, že activePetId ukazuje pouze na skutečně odemčeného peta
    if (!ps.activePetId || !ps.pets[ps.activePetId] || !ps.pets[ps.activePetId].unlocked) {
      ps.activePetId = getFirstUnlockedPetId();
    }
  }
  checkAndHandlePetDailyReset();
}

/* ============================================================
   NOČNÍ OBNOVA HP VŠECH PETŮ A RESET DENNÍHO LIMITU ZÁPASŮ
   ============================================================ */

function checkAndHandlePetDailyReset() {
  if (!window.state || !window.state.petSystem) return;
  const ps = window.state.petSystem;
  const today = getPetTodayDateStr();

  if (ps.lastArenaDate !== today) {
    ps.lastArenaDate = today;
    ps.battlesToday = 0;

    // Přes noc se automaticky obnoví HP všem petům na 100 % a zruší se K.O.
    PETS_DATABASE.forEach(p => {
      const petData = ps.pets[p.id];
      if (petData) {
        const baseDef = PETS_DATABASE.find(x => x.id === p.id) || PETS_DATABASE[0];
        const lvl = petData.level || 1;
        const maxHp = baseDef.baseHp + (lvl - 1) * 18;
        petData.currentHp = maxHp;
        petData.isKnockedOut = false;
      }
    });

    if (typeof saveState === 'function') saveState();
  }
}

/* ============================================================
   EXPONENCIÁLNÍ KŘIVKA XP A VÝPOČTY STATISTIK PETA
   ============================================================ */

function getXpRequiredForNextLevel(level) {
  ensurePetStateInitialized();
  const mult = (window.state.petSystem.config.xpCurveMultiplier) || 1.45;
  return Math.round(100 * Math.pow(mult, Math.max(0, level - 1)));
}

function getPetMaxHp(petId) {
  ensurePetStateInitialized();
  const baseDef = PETS_DATABASE.find(p => p.id === petId) || PETS_DATABASE[0];
  const petData = window.state.petSystem.pets[petId];
  const lvl = petData ? petData.level : 1;
  return baseDef.baseHp + (lvl - 1) * 18;
}

function getPetAttackDamage(petId, attackType) {
  ensurePetStateInitialized();
  const petData = window.state.petSystem.pets[petId];
  const lvl = petData ? petData.level : 1;
  if (attackType === 'heavy') {
    const base = 46 + (lvl - 1) * 9;
    return base + Math.floor(Math.random() * 7);
  } else {
    const base = 30 + (lvl - 1) * 6;
    return base + Math.floor(Math.random() * 5);
  }
}

function getPetPrice(petId) {
  ensurePetStateInitialized();
  const baseDef = PETS_DATABASE.find(p => p.id === petId);
  const pState = window.state.petSystem.pets[petId];
  if (pState && pState.customPrice !== undefined) return pState.customPrice;
  return baseDef ? baseDef.price : 8;
}

/* ============================================================
   HORNÍ LIŠTA: ŽIVÝ ANIMOVANÝ PET VEDLE „ŠKOLÁK MÍŠA“
   ============================================================ */

function updateTopPetCompanionWidget() {
  ensurePetStateInitialized();
  const badgeContainer = document.getElementById('top-pet-companion-widget');
  if (!badgeContainer) return;

  const activeId = window.state.petSystem.activePetId;
  const petData = activeId ? window.state.petSystem.pets[activeId] : null;

  if (!activeId || !petData || !petData.unlocked) {
    badgeContainer.innerHTML = `
      <div class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-amber-100 text-lg">
        🐾
      </div>
      <div class="hidden xl:flex flex-col leading-none pr-1">
        <span class="text-[11px] font-black text-slate-800">Aréna</span>
        <span class="text-[9px] font-bold text-amber-700">🔒 Odemkni peta</span>
      </div>
    `;
    return;
  }

  const petDef = PETS_DATABASE.find(p => p.id === activeId) || PETS_DATABASE[0];
  const isKo = petData.isKnockedOut;
  const lvl = petData.level || 1;
  const maxHp = getPetMaxHp(activeId);

  badgeContainer.innerHTML = `
    <div class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center pet-float-anim ${isKo ? 'grayscale opacity-60' : ''}">
      ${petDef.svg}
    </div>
    <div class="hidden xl:flex flex-col leading-none pr-1">
      <div class="flex items-center gap-1">
        <span class="text-[11px] font-black text-slate-800">${petDef.name.split(' ')[0]}</span>
        <span class="text-[9px] font-black px-1.5 py-0.5 rounded-full ${isKo ? 'bg-rose-500 text-white' : 'bg-amber-400 text-amber-950'}">
          ${isKo ? 'K.O.' : `Lv.${lvl}`}
        </span>
      </div>
      <span class="text-[9px] font-bold ${isKo ? 'text-rose-600' : 'text-emerald-600'}">
        ${isKo ? 'Oživit v Aréně' : `${petData.currentHp}/${maxHp} HP`}
      </span>
    </div>
  `;
}

/* ============================================================
   OTEVŘENÍ OBRAZOVKY ARÉNY A INICIALIZACE SOUBOJE
   ============================================================ */

function openArenaView() {
  ensurePetStateInitialized();
  if (typeof showView === 'function') showView('arena');

  if (!arenaBattleState.inProgress && window.state.petSystem.activePetId) {
    spawnNewArenaMonster();
  }
  renderArenaView();
  if (typeof playTone === 'function') playTone(520, 0.09, 'sine', 0.15);
}

function spawnNewArenaMonster() {
  ensurePetStateInitialized();
  const activeId = window.state.petSystem.activePetId;
  const petData = activeId ? window.state.petSystem.pets[activeId] : null;
  const petLvl = petData ? petData.level : 1;
  const cfg = window.state.petSystem.config;

  const randomMonster = ARENA_MONSTERS_ROSTER[Math.floor(Math.random() * ARENA_MONSTERS_ROSTER.length)];
  const mLevel = petLvl;
  const maxHp = (cfg.monsterBaseHp || 100) + (mLevel - 1) * (cfg.monsterHpPerLevel || 22);

  arenaBattleState = {
    inProgress: true,
    monster: randomMonster,
    monsterLevel: mLevel,
    monsterMaxHp: maxHp,
    monsterCurrentHp: maxHp,
    selectedAttackType: 'light',
    activeTask: null,
    turnLocked: false,
    battleLog: `Soupeř: ${randomMonster.name} (Lv.${mLevel})`
  };
}

function selectActivePetInArena(petId) {
  ensurePetStateInitialized();
  const petData = window.state.petSystem.pets[petId];
  if (!petData || !petData.unlocked) {
    if (typeof soundError === 'function') soundError();
    if (typeof alertUserFeedback === 'function') alertUserFeedback('Tohoto peta si nejdříve odemkni v Obchodě! 🛍️');
    return;
  }

  window.state.petSystem.activePetId = petId;
  const maxHp = getPetMaxHp(petId);
  if (!petData.isKnockedOut && (petData.currentHp === undefined || petData.currentHp <= 0)) {
    petData.currentHp = maxHp;
  }

  if (typeof saveState === 'function') saveState();
  updateTopPetCompanionWidget();
  spawnNewArenaMonster();
  renderArenaView();
  if (typeof playTone === 'function') playTone(580, 0.08, 'sine', 0.15);
}

function renderArenaView() {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const activeId = ps.activePetId;
  const maxDaily = ps.config.maxDailyBattles ?? 5;
  const battlesToday = ps.battlesToday || 0;

  // Aktualizace horního přehledu surovin v Aréně
  const foodEl = document.getElementById('arena-food-count');
  const potionEl = document.getElementById('arena-potion-count');
  const diaEl = document.getElementById('arena-diamonds-count');
  const dailyBadge = document.getElementById('arena-daily-battles-badge');

  if (foodEl) foodEl.textContent = (ps.petFoodCount || 0).toString();
  if (potionEl) potionEl.textContent = (ps.revivePotionsCount || 0).toString();
  if (diaEl) diaEl.textContent = (window.state.goldDiamonds || 0).toString();
  if (dailyBadge) {
    dailyBadge.textContent = `⚔️ Dnes: ${battlesToday} / ${maxDaily}`;
    dailyBadge.className = `px-3 py-1 rounded-2xl border-2 text-xs font-black flex items-center gap-1 ${
      battlesToday >= maxDaily
        ? 'bg-rose-100 border-rose-300 text-rose-900'
        : 'bg-indigo-100 border-indigo-300 text-indigo-900'
    }`;
  }

  // Přepínač vlastněných petů (každý pet má svůj vlastní level a XP)
  const rosterBar = document.getElementById('arena-pet-roster-bar');
  if (rosterBar) {
    rosterBar.innerHTML = '';
    PETS_DATABASE.forEach(p => {
      const pState = ps.pets[p.id];
      const isSelected = p.id === activeId;
      const isUnlocked = pState && pState.unlocked;
      const isKo = pState && pState.isKnockedOut;
      const pReqXp = getXpRequiredForNextLevel(pState ? pState.level : 1);

      const btn = document.createElement('button');
      btn.onclick = () => selectActivePetInArena(p.id);
      btn.className = `flex items-center gap-2 px-3 py-1.5 rounded-2xl border-2 font-black text-xs transition-all ${
        isSelected
          ? 'bg-white text-slate-900 border-amber-400 shadow-md scale-105 ring-2 ring-amber-300'
          : isUnlocked
            ? 'bg-white/75 hover:bg-white text-slate-700 border-slate-200'
            : 'bg-slate-200/60 text-slate-400 border-dashed border-slate-300 opacity-75'
      }`;
      btn.innerHTML = `
        <div class="w-7 h-7 flex items-center justify-center ${!isUnlocked || isKo ? 'grayscale' : ''}">${p.svg}</div>
        <div class="text-left leading-tight">
          <div class="text-xs font-black">${p.name.split(' ')[0]}</div>
          <div class="text-[9px] font-bold ${!isUnlocked ? 'text-slate-500' : isKo ? 'text-rose-600' : 'text-indigo-600'}">
            ${!isUnlocked ? `🔒 ${getPetPrice(p.id)} 💎` : isKo ? '💀 K.O.' : `Lv.${pState.level} (${pState.xp}/${pReqXp} XP)`}
          </div>
        </div>
      `;
      rosterBar.appendChild(btn);
    });
  }

  const lockedEmptyState = document.getElementById('arena-locked-empty-state');
  const battleStage = document.getElementById('arena-battle-stage');

  // Pokud syn ještě nemá odemčeného žádného peta
  if (!activeId || !ps.pets[activeId] || !ps.pets[activeId].unlocked) {
    if (lockedEmptyState) lockedEmptyState.classList.remove('hidden');
    if (battleStage) battleStage.classList.add('hidden');
    return;
  }

  if (lockedEmptyState) lockedEmptyState.classList.add('hidden');
  if (battleStage) battleStage.classList.remove('hidden');

  if (!arenaBattleState.inProgress || !arenaBattleState.monster) {
    spawnNewArenaMonster();
  }

  const petDef = PETS_DATABASE.find(p => p.id === activeId) || PETS_DATABASE[0];
  const petData = ps.pets[activeId];

  const maxHp = getPetMaxHp(activeId);
  if (petData.currentHp > maxHp) petData.currentHp = maxHp;
  if (petData.isKnockedOut) petData.currentHp = 0;

  const xpNeeded = getXpRequiredForNextLevel(petData.level);
  const xpPct = Math.min(100, Math.round((petData.xp / xpNeeded) * 100));
  const petHpPct = Math.max(0, Math.min(100, Math.round((petData.currentHp / maxHp) * 100)));

  const m = arenaBattleState.monster || ARENA_MONSTERS_ROSTER[0];
  const mHpPct = Math.max(0, Math.min(100, Math.round((arenaBattleState.monsterCurrentHp / arenaBattleState.monsterMaxHp) * 100)));

  // Karta Peta (vlevo)
  const petNameEl = document.getElementById('arena-pet-name');
  const petElementEl = document.getElementById('arena-pet-element');
  const petLvlBadge = document.getElementById('arena-pet-level-badge');
  const petHpText = document.getElementById('arena-pet-hp-text');
  const petHpBar = document.getElementById('arena-pet-hp-bar');
  const petXpText = document.getElementById('arena-pet-xp-text');
  const petXpBar = document.getElementById('arena-pet-xp-bar');
  const petSpriteBox = document.getElementById('arena-pet-sprite-box');
  const feedBtn = document.getElementById('arena-feed-btn');

  if (petNameEl) petNameEl.textContent = petDef.name;
  if (petElementEl) {
    petElementEl.textContent = petDef.element;
    petElementEl.className = `text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${petDef.badgeClass}`;
  }
  if (petLvlBadge) petLvlBadge.textContent = `LEVEL ${petData.level}`;
  if (petHpText) petHpText.textContent = `${petData.currentHp} / ${maxHp} HP`;
  if (petHpBar) {
    petHpBar.style.width = `${petHpPct}%`;
    petHpBar.className = `h-full rounded-full transition-all duration-300 ${
      petHpPct > 50 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : petHpPct > 25 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-rose-600 to-red-500'
    }`;
  }
  if (petXpText) {
    const lvlDia = ps.config.diamondsPerLevelUp ?? 3;
    petXpText.textContent = `XP: ${petData.xp} / ${xpNeeded} (Další Lvl: +${lvlDia} 💎)`;
  }
  if (petXpBar) petXpBar.style.width = `${xpPct}%`;
  if (petSpriteBox) {
    petSpriteBox.innerHTML = petDef.svg;
    petSpriteBox.className = `w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center transition-transform duration-300 ${
      petData.isKnockedOut ? 'grayscale opacity-50 rotate-12' : 'pet-float-anim'
    }`;
  }

  // Tlačítko krmení: neaktivní pokud má pet plné HP nebo je K.O.
  if (feedBtn) {
    const isFullHp = petData.currentHp >= maxHp;
    if (isFullHp || petData.isKnockedOut || (ps.petFoodCount || 0) <= 0) {
      feedBtn.className = 'px-3 py-1 rounded-xl font-black text-xs border border-slate-600 bg-slate-700/60 text-slate-400 cursor-not-allowed flex items-center gap-1';
      feedBtn.title = isFullHp ? 'Pet má plné HP!' : 'Nelze nakrmit';
    } else {
      feedBtn.className = 'game-button bg-amber-400 hover:bg-amber-500 text-amber-950 px-3 py-1 rounded-xl font-black text-xs border-b-2 border-amber-600 flex items-center gap-1';
      feedBtn.title = 'Doplnit HP krmivem';
    }
  }

  // Karta Monstra (vpravo)
  const monsterNameEl = document.getElementById('arena-monster-name');
  const monsterTitleEl = document.getElementById('arena-monster-title');
  const monsterLvlBadge = document.getElementById('arena-monster-level-badge');
  const monsterHpText = document.getElementById('arena-monster-hp-text');
  const monsterHpBar = document.getElementById('arena-monster-hp-bar');
  const monsterSpriteBox = document.getElementById('arena-monster-sprite-box');

  if (monsterNameEl) monsterNameEl.textContent = m.name;
  if (monsterTitleEl) monsterTitleEl.textContent = m.title;
  if (monsterLvlBadge) monsterLvlBadge.textContent = `LEVEL ${arenaBattleState.monsterLevel}`;
  if (monsterHpText) monsterHpText.textContent = `${arenaBattleState.monsterCurrentHp} / ${arenaBattleState.monsterMaxHp} HP`;
  if (monsterHpBar) monsterHpBar.style.width = `${mHpPct}%`;
  if (monsterSpriteBox) {
    monsterSpriteBox.innerHTML = m.svg;
    monsterSpriteBox.className = 'w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center transition-transform duration-300 pet-float-anim';
  }

  // Bojový deník a přepínání panelů (K.O. / Denní limit / Útoky)
  const logEl = document.getElementById('arena-battle-log');
  if (logEl) logEl.textContent = arenaBattleState.battleLog;

  const koOverlay = document.getElementById('arena-ko-panel');
  const dailyLimitPanel = document.getElementById('arena-daily-limit-panel');
  const attackControls = document.getElementById('arena-attack-controls');
  const lightBtnLabel = document.getElementById('arena-btn-light-name');
  const heavyBtnLabel = document.getElementById('arena-btn-heavy-name');
  const reviveCostSpan = document.getElementById('arena-revive-cost-label');

  if (lightBtnLabel) lightBtnLabel.textContent = petDef.lightAttackName;
  if (heavyBtnLabel) heavyBtnLabel.textContent = petDef.heavyAttackName;
  if (reviveCostSpan) reviveCostSpan.textContent = `${ps.config.reviveCostDiamonds ?? 2} 💎`;

  if (petData.isKnockedOut) {
    if (koOverlay) koOverlay.classList.remove('hidden');
    if (dailyLimitPanel) dailyLimitPanel.classList.add('hidden');
    if (attackControls) attackControls.classList.add('hidden');
  } else if (battlesToday >= maxDaily) {
    if (koOverlay) koOverlay.classList.add('hidden');
    if (dailyLimitPanel) dailyLimitPanel.classList.remove('hidden');
    if (attackControls) attackControls.classList.add('hidden');
  } else {
    if (koOverlay) koOverlay.classList.add('hidden');
    if (dailyLimitPanel) dailyLimitPanel.classList.add('hidden');
    if (attackControls) attackControls.classList.remove('hidden');
  }
}

/* ============================================================
   KRMENÍ A OŽIVENÍ PETA (PLNÉ HP BLOKUJE SPOTŘEBU KRMIVA)
   ============================================================ */

function feedActivePetAction() {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const activeId = ps.activePetId;
  if (!activeId || !ps.pets[activeId]) return;
  const petData = ps.pets[activeId];

  if (petData.isKnockedOut) {
    if (typeof soundError === 'function') soundError();
    if (typeof alertUserFeedback === 'function') alertUserFeedback('Pet je v K.O. stavu! Nejdříve ho musíš oživit. 💖');
    return;
  }

  const maxHp = getPetMaxHp(activeId);
  if (petData.currentHp >= maxHp) {
    if (typeof soundError === 'function') soundError();
    if (typeof alertUserFeedback === 'function') alertUserFeedback('Pet má plné HP! Krmivo nebylo spotřebováno. 💚');
    return;
  }

  if ((ps.petFoodCount || 0) <= 0) {
    if (typeof soundError === 'function') soundError();
    if (typeof alertUserFeedback === 'function') alertUserFeedback('Nemáš žádné krmivo 🍖! Vyhraj souboj nebo ho kup v Obchodě.');
    return;
  }

  ps.petFoodCount--;
  petData.currentHp = Math.min(maxHp, petData.currentHp + 45);

  if (typeof saveState === 'function') saveState();
  if (typeof playTone === 'function') playTone(640, 0.12, 'triangle', 0.2);
  updateTopPetCompanionWidget();
  renderArenaView();
  if (typeof alertUserFeedback === 'function') alertUserFeedback(`Mňam! Doplněno zdraví (${petData.currentHp}/${maxHp} HP)! 🍖`);
}

function reviveActivePetAction() {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const activeId = ps.activePetId;
  if (!activeId || !ps.pets[activeId]) return;
  const petData = ps.pets[activeId];
  const reviveCost = ps.config.reviveCostDiamonds ?? 2;

  if (!petData.isKnockedOut) {
    if (typeof alertUserFeedback === 'function') alertUserFeedback('Tvůj pet nepotřebuje oživení!');
    return;
  }

  if ((ps.revivePotionsCount || 0) > 0) {
    ps.revivePotionsCount--;
  } else if ((window.state.goldDiamonds || 0) >= reviveCost) {
    window.state.goldDiamonds -= reviveCost;
  } else {
    if (typeof soundError === 'function') soundError();
    if (typeof alertUserFeedback === 'function') alertUserFeedback(`Nemáš Kámen oživení ani dostatek diamantů (potřebuješ ${reviveCost} 💎)!`);
    return;
  }

  petData.isKnockedOut = false;
  petData.currentHp = getPetMaxHp(activeId);
  arenaBattleState.battleLog = 'Parťák je oživen v plné síle!';

  if (typeof saveState === 'function') saveState();
  if (typeof updateBalanceUI === 'function') updateBalanceUI();
  if (typeof updateTopBadges === 'function') updateTopBadges();
  updateTopPetCompanionWidget();
  renderArenaView();
  if (typeof playCustomSuccessSound === 'function') playCustomSuccessSound();
  if (typeof alertUserFeedback === 'function') alertUserFeedback('💖 Pet je oživen a připraven k boji!');
}

/* ============================================================
   STRIKTNÍ GENEROVÁNÍ ÚKOLŮ POUZE Z AKTIVNÍCH PÍSMEN V ADMINU
   ============================================================ */

function getStrictArenaReadingTask(attackType) {
  const activeLetters = (window.state && Array.isArray(window.state.activeLetters) && window.state.activeLetters.length > 0)
    ? window.state.activeLetters
    : ['M', 'A', 'L', 'E', 'S', 'O'];

  const canForm = (lettersArr) => {
    if (!lettersArr || !lettersArr.length) return false;
    return lettersArr.every(ch => activeLetters.includes(ch));
  };

  const syllables = typeof generatePedagogicalOpenSyllables === 'function'
    ? generatePedagogicalOpenSyllables()
    : [];

  const poolLvl3 = (typeof LEVEL_3_CVC_WORDS !== 'undefined') ? LEVEL_3_CVC_WORDS.filter(w => canForm(w.letters)) : [];
  const poolLvl4 = (typeof LEVEL_4_TWO_SYLLABLE_WORDS !== 'undefined') ? LEVEL_4_TWO_SYLLABLE_WORDS.filter(w => canForm(w.letters)) : [];
  const poolLvl5 = (typeof LEVEL_5_CLUSTERS !== 'undefined') ? LEVEL_5_CLUSTERS.filter(w => canForm(w.letters)) : [];
  const poolLvl6 = (typeof LEVEL_6_SOFT !== 'undefined') ? LEVEL_6_SOFT.filter(w => canForm(w.letters)) : [];
  const poolLvl7 = (typeof LEVEL_7_SENTENCES !== 'undefined') ? LEVEL_7_SENTENCES.filter(s => canForm(s.letters)) : [];

  if (attackType === 'heavy') {
    // Silný útok: bereme pouze z dostupných slov/vět složených 100% z povolených písmen
    const heavyPools = [
      { list: poolLvl7, label: 'Celá věta' },
      { list: poolLvl6, label: 'Měkčení' },
      { list: poolLvl5, label: 'Slovo' },
      { list: poolLvl4, label: 'Dvouslabičné slovo' },
      { list: poolLvl3, label: 'Slovo' }
    ].filter(p => p.list.length > 0);

    if (heavyPools.length > 0) {
      const chosenPool = heavyPools[Math.floor(Math.random() * heavyPools.length)];
      const item = chosenPool.list[Math.floor(Math.random() * chosenPool.list.length)];
      return {
        subject: 'reading',
        difficultyLabel: 'Silný útok • Čtení',
        promptText: item.text,
        subLabel: chosenPool.label
      };
    }

    // Pokud z navolených písmen zatím nelze složit žádné slovo v databázi, složíme 2 aktivní slabiky nebo 3 aktivní písmena
    if (syllables.length >= 2) {
      const s1 = syllables[Math.floor(Math.random() * syllables.length)].text;
      const s2 = syllables[Math.floor(Math.random() * syllables.length)].text;
      return {
        subject: 'reading',
        difficultyLabel: 'Silný útok • Čtení',
        promptText: `${s1} ${s2}`,
        subLabel: 'Spojení slabik'
      };
    } else if (syllables.length === 1) {
      return {
        subject: 'reading',
        difficultyLabel: 'Silný útok • Čtení',
        promptText: syllables[0].text,
        subLabel: 'Slabika'
      };
    } else {
      const pick = [];
      for (let i = 0; i < Math.min(3, activeLetters.length); i++) {
        pick.push(activeLetters[Math.floor(Math.random() * activeLetters.length)]);
      }
      return {
        subject: 'reading',
        difficultyLabel: 'Silný útok • Čtení',
        promptText: pick.join(' '),
        subLabel: 'Písmena'
      };
    }
  } else {
    // Lehký útok: Písmena, Slabiky, nebo Jednoslabičná slova (pouze z povolených písmen)
    const lightPools = [];
    if (activeLetters.length > 0) {
      lightPools.push({
        label: 'Písmeno',
        getText: () => activeLetters[Math.floor(Math.random() * activeLetters.length)]
      });
    }
    if (syllables.length > 0) {
      lightPools.push({
        label: 'Slabika',
        getText: () => syllables[Math.floor(Math.random() * syllables.length)].text
      });
    }
    if (poolLvl3.length > 0) {
      lightPools.push({
        label: 'Slovo',
        getText: () => poolLvl3[Math.floor(Math.random() * poolLvl3.length)].text
      });
    }

    const chosen = lightPools[Math.floor(Math.random() * lightPools.length)];
    return {
      subject: 'reading',
      difficultyLabel: 'Lehký útok • Čtení',
      promptText: chosen.getText(),
      subLabel: chosen.label
    };
  }
}

function chooseArenaTaskSubject() {
  ensurePetStateInitialized();
  const mode = window.state.petSystem.config.taskSubjectMode || 'mixed';
  if (mode === 'reading') return 'reading';
  if (mode === 'math') return 'math';
  return Math.random() < 0.5 ? 'reading' : 'math';
}

function generateArenaBattleTask(attackType) {
  const subj = chooseArenaTaskSubject();
  const maxVal = (window.state && window.state.mathMax) ? window.state.mathMax : 10;

  if (subj === 'reading') {
    return getStrictArenaReadingTask(attackType);
  } else {
    // Matematika
    if (attackType === 'light') {
      const lightMax = Math.min(maxVal, 10);
      const isPlus = Math.random() > 0.4;
      if (isPlus) {
        const a = randomInt(1, Math.max(1, lightMax - 2));
        const b = randomInt(1, Math.max(1, lightMax - a));
        return {
          subject: 'math',
          difficultyLabel: 'Lehký útok • Počty',
          mathKind: 'input',
          questionHtml: `${a} + ${b} = ?`,
          correctAnswer: (a + b).toString()
        };
      } else {
        const a = randomInt(2, lightMax);
        const b = randomInt(1, a - 1);
        return {
          subject: 'math',
          difficultyLabel: 'Lehký útok • Počty',
          mathKind: 'input',
          questionHtml: `${a} − ${b} = ?`,
          correctAnswer: (a - b).toString()
        };
      }
    } else {
      const useStory = Math.random() < 0.5 && typeof generateMathLevel6 === 'function';
      if (useStory) {
        const stories = generateMathLevel6(maxVal);
        const st = stories[0];
        return {
          subject: 'math',
          difficultyLabel: 'Silný útok • Slovní úloha',
          mathKind: 'story',
          storyText: st.story,
          correctAnswer: st.correctAnswer
        };
      } else {
        const isPlus = Math.random() > 0.45;
        if (isPlus) {
          const a = randomInt(Math.max(2, Math.floor(maxVal * 0.3)), Math.max(3, Math.floor(maxVal * 0.7)));
          const b = randomInt(2, Math.max(2, maxVal - a));
          return {
            subject: 'math',
            difficultyLabel: 'Silný útok • Počítadlo',
            mathKind: 'input',
            questionHtml: `${a} + ${b} = ?`,
            correctAnswer: (a + b).toString()
          };
        } else {
          const a = randomInt(Math.max(5, Math.floor(maxVal * 0.5)), maxVal);
          const b = randomInt(2, a - 1);
          return {
            subject: 'math',
            difficultyLabel: 'Silný útok • Počítadlo',
            mathKind: 'input',
            questionHtml: `${a} − ${b} = ?`,
            correctAnswer: (a - b).toString()
          };
        }
      }
    }
  }
}

/* ============================================================
   SPUŠTĚNÍ TAHU A VYSKAKOVACÍ BOJOVÉ OKNO S ÚKOLEM
   ============================================================ */

function triggerArenaAttackModal(attackType) {
  ensurePetStateInitialized();
  if (arenaBattleState.turnLocked) return;

  const ps = window.state.petSystem;
  const maxDaily = ps.config.maxDailyBattles ?? 5;
  if ((ps.battlesToday || 0) >= maxDaily) {
    if (typeof soundError === 'function') soundError();
    if (typeof alertUserFeedback === 'function') alertUserFeedback('Dnešní limit zápasů v Aréně je již vyčerpán! 🌙');
    renderArenaView();
    return;
  }

  const activeId = ps.activePetId;
  const petData = activeId ? ps.pets[activeId] : null;
  if (!petData || !petData.unlocked || petData.isKnockedOut) {
    if (typeof soundError === 'function') soundError();
    return;
  }

  arenaBattleState.selectedAttackType = attackType;
  const task = generateArenaBattleTask(attackType);
  arenaBattleState.activeTask = task;

  const modal = document.getElementById('arena-task-modal');
  const badge = document.getElementById('arena-modal-difficulty-badge');
  const body = document.getElementById('arena-modal-task-body');

  if (!modal || !body) return;

  badge.textContent = task.difficultyLabel;
  badge.className = `text-xs font-black uppercase px-3 py-1 rounded-full ${
    attackType === 'heavy' ? 'bg-orange-500 text-white' : 'bg-sky-500 text-white'
  }`;

  if (task.subject === 'reading') {
    const formatted = typeof formatCase === 'function' ? formatCase(task.promptText) : task.promptText;
    body.innerHTML = `
      <div class="text-xs font-bold text-slate-400 uppercase mb-1">${task.subLabel || 'Čtení'}</div>
      <div class="bg-slate-50 border-3 border-indigo-200 rounded-3xl p-5 my-2 relative">
        <button onclick="speakCzechWord('${task.promptText.replace(/'/g, "\\'")}', 0.8)" class="absolute top-3 right-3 w-9 h-9 rounded-xl bg-teal-100 hover:bg-teal-200 text-teal-800 flex items-center justify-center text-base shadow-sm" title="Přehrát výslovnost">
          🔊
        </button>
        <div class="text-3xl sm:text-5xl font-black text-indigo-950 game-font tracking-wide break-words py-2">
          ${formatted}
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 w-full mt-4">
        <button onclick="resolveArenaTaskTurn(false)" class="game-button bg-rose-500 hover:bg-rose-600 text-white font-black py-3 rounded-2xl border-b-4 border-rose-700 text-sm">
          ❌ Chyba
        </button>
        <button onclick="resolveArenaTaskTurn(true)" class="game-button bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-2xl border-b-4 border-emerald-700 text-sm">
          ✅ Přečteno! ⚡
        </button>
      </div>
    `;
  } else {
    const promptMarkup = task.mathKind === 'story'
      ? `<p class="text-base sm:text-xl font-black text-slate-800 leading-relaxed mb-3">${task.storyText}</p>`
      : `<div class="text-4xl sm:text-5xl font-black text-indigo-950 font-baloo mb-3">${task.questionHtml}</div>`;

    body.innerHTML = `
      <div class="bg-amber-50/70 border-3 border-amber-300 rounded-3xl p-5 my-2">
        ${promptMarkup}
        <div class="flex items-center justify-center gap-2 mt-2">
          <input type="number" id="arena-math-answer-input" inputmode="numeric" placeholder="?" class="w-24 h-14 text-center text-3xl font-black rounded-2xl border-3 border-amber-400 bg-white text-indigo-950 focus:outline-none shadow-inner">
        </div>
      </div>
      <div class="flex gap-3 w-full mt-4">
        <button onclick="closeArenaTaskModal()" class="w-1/3 py-3 rounded-2xl bg-slate-200 text-slate-700 font-black text-xs sm:text-sm">Zrušit</button>
        <button onclick="submitArenaMathTask()" class="game-button w-2/3 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-2xl border-b-4 border-emerald-700 text-sm sm:text-base">
          ⚔️ ZAÚTOČIT!
        </button>
      </div>
    `;

    setTimeout(() => {
      const inp = document.getElementById('arena-math-answer-input');
      if (inp) {
        inp.focus();
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') submitArenaMathTask();
        });
      }
    }, 60);
  }

  modal.classList.remove('hidden');
  if (typeof playTone === 'function') playTone(540, 0.08, 'sine', 0.15);
}

function closeArenaTaskModal() {
  const modal = document.getElementById('arena-task-modal');
  if (modal) modal.classList.add('hidden');
}

function submitArenaMathTask() {
  const inp = document.getElementById('arena-math-answer-input');
  const val = inp ? inp.value.trim() : '';
  if (val === '') {
    if (typeof soundShuffle === 'function') soundShuffle();
    return;
  }
  const task = arenaBattleState.activeTask;
  const isCorrect = (val === task.correctAnswer);
  resolveArenaTaskTurn(isCorrect);
}

/* ============================================================
   VYHODNOCENÍ TAHU, ANIMACE ÚTOKU A PROTIÚTOK MONSTRA
   ============================================================ */

function resolveArenaTaskTurn(isCorrect) {
  closeArenaTaskModal();
  ensurePetStateInitialized();

  const ps = window.state.petSystem;
  const activeId = ps.activePetId;
  const petDef = PETS_DATABASE.find(p => p.id === activeId) || PETS_DATABASE[0];
  const attackType = arenaBattleState.selectedAttackType;

  arenaBattleState.turnLocked = true;

  if (isCorrect) {
    const dmg = getPetAttackDamage(activeId, attackType);
    const attackTitle = attackType === 'heavy' ? petDef.heavyAttackName : petDef.lightAttackName;
    arenaBattleState.battleLog = `💥 ${petDef.name}: ${attackTitle} (−${dmg} HP)!`;
    renderArenaView();

    playPetAttackCanvasAnimation(petDef.elementKey, attackType, () => {
      arenaBattleState.monsterCurrentHp = Math.max(0, arenaBattleState.monsterCurrentHp - dmg);
      showFloatingDamage('monster', `-${dmg} HP`, attackType === 'heavy' ? 'text-amber-300 text-3xl' : 'text-white text-2xl');
      triggerMonsterHitShake(attackType === 'heavy');
      renderArenaView();

      if (arenaBattleState.monsterCurrentHp <= 0) {
        setTimeout(() => handleArenaVictory(), 650);
      } else {
        setTimeout(() => executeMonsterCounterAttack(false), 750);
      }
    });
  } else {
    if (typeof soundError === 'function') soundError();
    arenaBattleState.battleLog = `❌ Minul jsi! ${arenaBattleState.monster.name} útočí!`;
    showFloatingDamage('monster', 'VEDLE! 0', 'text-slate-300 text-xl');
    renderArenaView();

    setTimeout(() => executeMonsterCounterAttack(true), 800);
  }
}

function executeMonsterCounterAttack(wasPlayerMiss) {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const activeId = ps.activePetId;
  const petData = ps.pets[activeId];
  const m = arenaBattleState.monster;

  const baseBotDmg = ps.config.monsterBaseDmg || 20;
  const lvlScale = (arenaBattleState.monsterLevel - 1) * 4;
  const rawDmg = baseBotDmg + lvlScale + (wasPlayerMiss ? 10 : 0) + Math.floor(Math.random() * 6);

  const monsterBox = document.getElementById('arena-monster-sprite-box');
  if (monsterBox) {
    monsterBox.classList.add('-translate-x-10', 'scale-110');
    setTimeout(() => monsterBox.classList.remove('-translate-x-10', 'scale-110'), 280);
  }

  if (typeof playTone === 'function') {
    playTone(190, 0.16, 'sawtooth', 0.25);
  }

  petData.currentHp = Math.max(0, petData.currentHp - rawDmg);
  showFloatingDamage('pet', `-${rawDmg} HP`, 'text-rose-400 text-2xl');

  const stage = document.getElementById('arena-battle-stage');
  if (stage) {
    stage.classList.add('arena-shake-anim');
    setTimeout(() => stage.classList.remove('arena-shake-anim'), 380);
  }

  if (petData.currentHp <= 0) {
    petData.isKnockedOut = true;
    petData.losses = (petData.losses || 0) + 1;
    ps.battlesToday = (ps.battlesToday || 0) + 1;
    arenaBattleState.turnLocked = false;
    arenaBattleState.battleLog = `💀 ${petData.name || 'Parťák'} padl! Oživ ho nebo se přes noc uzdraví.`;
    if (typeof saveState === 'function') saveState();
    updateTopPetCompanionWidget();
    renderArenaView();
  } else {
    arenaBattleState.turnLocked = false;
    arenaBattleState.battleLog = `⚔️ ${m.name} udeřil za −${rawDmg} HP! Jsi na řadě!`;
    if (typeof saveState === 'function') saveState();
    updateTopPetCompanionWidget();
    renderArenaView();
  }
}

/* ============================================================
   SAMOSTATNÉ EXPENÍ PETA & DIAMANTY POUZE ZA DOKONČENÝ LEVEL UP
   ============================================================ */

function GrantPetXp(petId, xpAmount) {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const petData = ps.pets[petId];
  if (!petData) return { levelsGained: 0, diamondsAwarded: 0 };

  petData.xp += xpAmount;
  let levelsGained = 0;
  let req = getXpRequiredForNextLevel(petData.level);

  while (petData.xp >= req) {
    petData.xp -= req;
    petData.level++;
    levelsGained++;
    petData.currentHp = getPetMaxHp(petId);
    req = getXpRequiredForNextLevel(petData.level);
  }

  let diamondsAwarded = 0;
  if (levelsGained > 0) {
    const diaPerLvl = ps.config.diamondsPerLevelUp ?? 3;
    diamondsAwarded = levelsGained * diaPerLvl;
    window.state.goldDiamonds = (window.state.goldDiamonds || 0) + diamondsAwarded;
  }

  return { levelsGained, diamondsAwarded };
}

function handleArenaVictory() {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const activeId = ps.activePetId;
  const petDef = PETS_DATABASE.find(p => p.id === activeId) || PETS_DATABASE[0];
  const petData = ps.pets[activeId];

  petData.wins = (petData.wins || 0) + 1;
  ps.battlesToday = (ps.battlesToday || 0) + 1;

  const xpGain = ps.config.xpPerWin ?? 35;
  const foodGain = ps.config.foodPerWin ?? 1;

  ps.petFoodCount = (ps.petFoodCount || 0) + foodGain;

  // Diamanty se dávají POUZE za celý dokončený Level Up peta!
  const { levelsGained, diamondsAwarded } = GrantPetXp(activeId, xpGain);
  arenaBattleState.turnLocked = false;

  const reqNextXp = getXpRequiredForNextLevel(petData.level);

  window.state.history.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('cs-CZ'),
    type: 'arena_win',
    minutes: 0,
    note: levelsGained > 0
      ? `Aréna: ${petDef.name} LEVEL UP na Lv.${petData.level}! (+${diamondsAwarded} 💎, +${foodGain} 🍖, +${xpGain} XP)`
      : `Aréna: Výhra (${petDef.name} Lv.${petData.level}): +${foodGain} 🍖, +${xpGain} XP`
  });

  if (typeof saveState === 'function') saveState();
  if (typeof updateBalanceUI === 'function') updateBalanceUI();
  if (typeof updateTopBadges === 'function') updateTopBadges();
  updateTopPetCompanionWidget();

  if (typeof playCustomSuccessSound === 'function') playCustomSuccessSound();
  if (typeof triggerConfetti === 'function') triggerConfetti();

  const winModal = document.getElementById('arena-victory-modal');
  const winSummary = document.getElementById('arena-victory-summary');
  if (winSummary) {
    winSummary.innerHTML = `
      <div class="text-sm font-bold text-slate-600 mb-3">
        Porazil jsi <strong>${arenaBattleState.monster.name}</strong>!
      </div>
      <div class="grid grid-cols-2 gap-3 text-center my-2">
        <div class="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3">
          <div class="text-2xl">🍖</div>
          <div class="text-base font-black text-amber-900">+${foodGain}</div>
          <div class="text-[11px] font-bold text-amber-700">Krmivo</div>
        </div>
        <div class="bg-purple-50 border-2 border-purple-300 rounded-2xl p-3">
          <div class="text-2xl">⭐</div>
          <div class="text-base font-black text-purple-900">+${xpGain} XP</div>
          <div class="text-[11px] font-bold text-purple-700">${petData.xp} / ${reqNextXp} XP</div>
        </div>
      </div>
      ${levelsGained > 0 ? `
        <div class="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-200 border-3 border-amber-500 text-indigo-950 font-black text-sm shadow-md animate-bounce">
          🎉 LEVEL UP! ${petDef.name} je na LEVELU ${petData.level}!<br>
          <span class="text-base text-cyan-900">Odměna za nový level: +${diamondsAwarded} 💎!</span>
        </div>
      ` : `
        <div class="mt-2 text-xs font-bold text-slate-500">
          Do dalšího levelu a odměny <strong>+${ps.config.diamondsPerLevelUp ?? 3} 💎</strong> zbývá <strong>${reqNextXp - petData.xp} XP</strong>!
        </div>
      `}
    `;
  }
  if (winModal) winModal.classList.remove('hidden');
  renderArenaView();
}

function nextArenaOpponentAction() {
  const winModal = document.getElementById('arena-victory-modal');
  if (winModal) winModal.classList.add('hidden');
  spawnNewArenaMonster();
  renderArenaView();
}

/* ============================================================
   CANVAS EFEKTY A ANIMACE ÚTOKŮ V ARÉNĚ
   ============================================================ */

function showFloatingDamage(target, text, colorClasses) {
  const containerId = target === 'monster' ? 'arena-monster-dmg-anchor' : 'arena-pet-dmg-anchor';
  const anchor = document.getElementById(containerId);
  if (!anchor) return;

  const el = document.createElement('div');
  el.className = `pointer-events-none font-black font-baloo drop-shadow-md animate-bounce ${colorClasses}`;
  el.textContent = text;
  anchor.innerHTML = '';
  anchor.appendChild(el);
  setTimeout(() => {
    if (anchor.contains(el)) el.remove();
  }, 1100);
}

function triggerMonsterHitShake(isHeavy) {
  const monsterBox = document.getElementById('arena-monster-sprite-box');
  const stage = document.getElementById('arena-battle-stage');
  if (monsterBox) {
    monsterBox.classList.add('scale-125', 'brightness-150');
    setTimeout(() => monsterBox.classList.remove('scale-125', 'brightness-150'), 320);
  }
  if (isHeavy && stage) {
    stage.classList.add('arena-shake-anim');
    setTimeout(() => stage.classList.remove('arena-shake-anim'), 420);
  }
}

function playPetAttackCanvasAnimation(elementKey, attackType, onComplete) {
  const canvas = document.getElementById('arena-fx-canvas');
  const petBox = document.getElementById('arena-pet-sprite-box');

  if (petBox) {
    petBox.classList.add('translate-x-8', 'scale-110');
    setTimeout(() => petBox.classList.remove('translate-x-8', 'scale-110'), 350);
  }

  if (typeof playTone === 'function') {
    if (elementKey === 'electric') {
      playTone(880, 0.08, 'sawtooth', 0.2);
      setTimeout(() => playTone(1320, 0.15, 'triangle', 0.25), 90);
    } else if (elementKey === 'fire') {
      playTone(320, 0.12, 'sawtooth', 0.25);
      setTimeout(() => playTone(520, 0.18, 'square', 0.22), 100);
    } else if (elementKey === 'speed') {
      playTone(620, 0.08, 'sine', 0.22);
      setTimeout(() => playTone(980, 0.16, 'triangle', 0.25), 80);
    } else {
      playTone(440, 0.1, 'triangle', 0.22);
      setTimeout(() => playTone(660, 0.15, 'sine', 0.25), 90);
    }
  }

  if (!canvas) {
    setTimeout(onComplete, 350);
    return;
  }

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width || 600;
  canvas.height = rect.height || 260;
  const ctx = canvas.getContext('2d');

  const startX = canvas.width * 0.24;
  const startY = canvas.height * 0.52;
  const endX = canvas.width * 0.76;
  const endY = canvas.height * 0.48;

  const colorsMap = {
    electric: ['#facc15', '#fef08a', '#38bdf8'],
    grass: ['#10b981', '#4ade80', '#a3e635'],
    speed: ['#3b82f6', '#38bdf8', '#facc15'],
    fire: ['#ef4444', '#f97316', '#facc15']
  };
  const palette = colorsMap[elementKey] || colorsMap.electric;
  const totalFrames = attackType === 'heavy' ? 28 : 20;
  let frame = 0;

  function step() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = frame / totalFrames;
    const curX = startX + (endX - startX) * t;
    const curY = startY + (endY - startY) * t - Math.sin(t * Math.PI) * 30;

    const radius = (attackType === 'heavy' ? 24 : 15) * (1 + 0.3 * Math.sin(frame * 0.6));
    ctx.save();
    ctx.beginPath();
    ctx.arc(curX, curY, radius, 0, Math.PI * 2);
    ctx.fillStyle = palette[0];
    ctx.shadowColor = palette[1];
    ctx.shadowBlur = 20;
    ctx.fill();

    for (let i = 0; i < (attackType === 'heavy' ? 12 : 7); i++) {
      const px = curX - i * 8 + (Math.random() - 0.5) * 18;
      const py = curY + (Math.random() - 0.5) * 22;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(3, radius * (1 - i / 14)), 0, Math.PI * 2);
      ctx.fillStyle = palette[i % palette.length];
      ctx.fill();
    }
    ctx.restore();

    frame++;
    if (frame <= totalFrames) {
      requestAnimationFrame(step);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (onComplete) onComplete();
    }
  }
  requestAnimationFrame(step);
}

/* ============================================================
   OBCHOD: SEKCE „PETI & LEKTVARY“
   ============================================================ */

function renderStorePetsUI() {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const grid = document.getElementById('store-pets-grid');
  const diaCounter = document.getElementById('store-pets-diamonds-counter');
  const revivePriceLabel = document.getElementById('store-revive-price-label');
  const foodPriceLabel = document.getElementById('store-food-price-label');

  if (diaCounter) diaCounter.textContent = (window.state.goldDiamonds || 0).toString();
  if (revivePriceLabel) revivePriceLabel.textContent = `${ps.config.reviveCostDiamonds ?? 2} 💎`;
  if (foodPriceLabel) foodPriceLabel.textContent = `${ps.config.foodCostDiamonds ?? 1} 💎`;

  if (!grid) return;
  grid.innerHTML = '';

  PETS_DATABASE.forEach(pet => {
    const pState = ps.pets[pet.id];
    const price = getPetPrice(pet.id);
    const isUnlocked = pState && pState.unlocked;
    const isActive = isUnlocked && ps.activePetId === pet.id;
    const reqXp = getXpRequiredForNextLevel(pState ? pState.level : 1);

    const card = document.createElement('div');
    card.className = `p-4 rounded-3xl border-3 bg-gradient-to-b ${pet.cardBg} bg-white flex flex-col justify-between text-center shadow-md transition-all ${
      isActive ? `${pet.borderColor} ring-4 ring-amber-300` : isUnlocked ? 'border-emerald-300' : 'border-slate-200'
    }`;

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${pet.badgeClass}">${pet.element}</span>
          <span class="text-xs font-black text-slate-700">${isUnlocked ? `Lv.${pState.level} (${pState.xp}/${reqXp} XP)` : `🔒 ${price} 💎`}</span>
        </div>
        <div class="w-24 h-24 mx-auto my-2 flex items-center justify-center pet-float-anim ${!isUnlocked ? ' opacity-85' : ''}">
          ${pet.svg}
        </div>
        <h4 class="text-base font-black text-slate-800 font-baloo">${pet.name}</h4>
        <p class="text-[11px] text-slate-600 font-bold mt-1">${pet.description}</p>
        <div class="mt-2 text-[10px] font-black text-indigo-900 bg-white/80 rounded-xl py-1 px-2 border border-indigo-100">
          ⚡ ${pet.lightAttackName} • 🔥 ${pet.heavyAttackName}
        </div>
      </div>
      <div class="mt-3">
        ${
          isActive
            ? `<button onclick="openArenaView()" class="game-button w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-black py-2 rounded-xl text-xs shadow-sm">⚔️ VSTOUPIT DO ARÉNY</button>`
            : isUnlocked
              ? `<button onclick="equipPetFromStore('${pet.id}')" class="game-button w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2 rounded-xl text-xs shadow-sm">Zvolit parťáka (Lv.${pState.level})</button>`
              : `<button onclick="buyPetFromStore('${pet.id}')" class="game-button w-full bg-cyan-500 hover:bg-cyan-600 text-white font-black py-2 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1"><span>Odemknout za ${price}</span> 💎</button>`
        }
      </div>
    `;
    grid.appendChild(card);
  });
}

function buyPetFromStore(petId) {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const petDef = PETS_DATABASE.find(p => p.id === petId);
  if (!petDef) return;

  const price = getPetPrice(petId);
  if ((window.state.goldDiamonds || 0) < price) {
    if (typeof soundError === 'function') soundError();
    if (typeof alertUserFeedback === 'function') alertUserFeedback(`Potřebuješ ${price} diamantů 💎 (máš ${window.state.goldDiamonds || 0}).`);
    return;
  }

  window.state.goldDiamonds -= price;
  ps.pets[petId].unlocked = true;
  ps.pets[petId].currentHp = getPetMaxHp(petId);
  ps.pets[petId].isKnockedOut = false;
  ps.activePetId = petId;

  if (typeof saveState === 'function') saveState();
  if (typeof soundPurchase === 'function') soundPurchase();
  if (typeof triggerConfetti === 'function') triggerConfetti();
  if (typeof updateBalanceUI === 'function') updateBalanceUI();
  if (typeof updateTopBadges === 'function') updateTopBadges();
  updateTopPetCompanionWidget();
  renderStorePetsUI();
  if (typeof alertUserFeedback === 'function') alertUserFeedback(`Nový parťák ${petDef.name} je odemčen! 🐾🎉`);
}

function equipPetFromStore(petId) {
  ensurePetStateInitialized();
  const pData = window.state.petSystem.pets[petId];
  if (!pData || !pData.unlocked) return;
  window.state.petSystem.activePetId = petId;
  if (typeof saveState === 'function') saveState();
  updateTopPetCompanionWidget();
  renderStorePetsUI();
  if (typeof playTone === 'function') playTone(600, 0.1, 'sine', 0.15);
  if (typeof alertUserFeedback === 'function') alertUserFeedback('Parťák nasazen!');
}

function buyRevivePotionFromStore() {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const cost = ps.config.reviveCostDiamonds ?? 2;

  if ((window.state.goldDiamonds || 0) < cost) {
    if (typeof soundError === 'function') soundError();
    if (typeof alertUserFeedback === 'function') alertUserFeedback(`Potřebuješ ${cost} 💎 na Kámen oživení!`);
    return;
  }

  window.state.goldDiamonds -= cost;
  ps.revivePotionsCount = (ps.revivePotionsCount || 0) + 1;

  const activePet = ps.activePetId ? ps.pets[ps.activePetId] : null;
  if (activePet && activePet.isKnockedOut) {
    ps.revivePotionsCount--;
    activePet.isKnockedOut = false;
    activePet.currentHp = getPetMaxHp(ps.activePetId);
    if (typeof alertUserFeedback === 'function') alertUserFeedback('💖 Kámen oživení koupen a tvůj pet je ihned oživen!');
  } else {
    if (typeof alertUserFeedback === 'function') alertUserFeedback('💖 Kámen oživení přidán do batohu!');
  }

  if (typeof saveState === 'function') saveState();
  if (typeof soundPurchase === 'function') soundPurchase();
  if (typeof updateBalanceUI === 'function') updateBalanceUI();
  updateTopPetCompanionWidget();
  renderStorePetsUI();
}

function buyPetFoodFromStore() {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const cost = ps.config.foodCostDiamonds ?? 1;

  if ((window.state.goldDiamonds || 0) < cost) {
    if (typeof soundError === 'function') soundError();
    if (typeof alertUserFeedback === 'function') alertUserFeedback(`Potřebuješ ${cost} 💎 na Krmivo pro pety!`);
    return;
  }

  window.state.goldDiamonds -= cost;
  ps.petFoodCount = (ps.petFoodCount || 0) + 2;

  if (typeof saveState === 'function') saveState();
  if (typeof soundPurchase === 'function') soundPurchase();
  if (typeof updateBalanceUI === 'function') updateBalanceUI();
  renderStorePetsUI();
  if (typeof alertUserFeedback === 'function') alertUserFeedback('🍖 Koupeno +2× Krmivo pro pety!');
}

/* ============================================================
   ADMINISTRACE: ZÁLOŽKA „PETI & ARÉNA“
   ============================================================ */

function updateAdminPetsUI() {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const cfg = ps.config;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  setVal('admin-pet-monster-hp', cfg.monsterBaseHp ?? 100);
  setVal('admin-pet-monster-hp-lvl', cfg.monsterHpPerLevel ?? 22);
  setVal('admin-pet-xp-win', cfg.xpPerWin ?? 35);
  setVal('admin-pet-revive-cost', cfg.reviveCostDiamonds ?? 2);
  setVal('admin-pet-levelup-diamonds', cfg.diamondsPerLevelUp ?? 3);
  setVal('admin-pet-max-daily-battles', cfg.maxDailyBattles ?? 5);
  setVal('admin-pet-win-food', cfg.foodPerWin ?? 1);
  setVal('admin-pet-subject-mode', cfg.taskSubjectMode || 'mixed');

  const battlesLabel = document.getElementById('admin-arena-battles-today-label');
  if (battlesLabel) {
    battlesLabel.textContent = `${ps.battlesToday || 0} / ${cfg.maxDailyBattles ?? 5}`;
  }

  const listContainer = document.getElementById('admin-pets-stats-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  PETS_DATABASE.forEach(pet => {
    const pState = ps.pets[pet.id];
    const reqXp = getXpRequiredForNextLevel(pState.level);
    const maxHp = getPetMaxHp(pet.id);
    const price = getPetPrice(pet.id);

    const card = document.createElement('div');
    card.className = 'bg-white p-3 rounded-2xl border-2 border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs';
    card.innerHTML = `
      <div class="flex items-center gap-2.5">
        <div class="w-11 h-11 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-1">
          ${pet.svg}
        </div>
        <div>
          <div class="font-black text-slate-800 text-sm flex items-center gap-1.5">
            <span>${pet.name}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900">Lv.${pState.level}</span>
            ${pState.isKnockedOut ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white">K.O.</span>' : ''}
          </div>
          <div class="text-[11px] font-bold text-slate-500">
            Samostatné XP: <strong>${pState.xp}/${reqXp}</strong> • HP: <strong>${pState.currentHp}/${maxHp}</strong> • Výhry: <strong>${pState.wins || 0}</strong>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
        <div class="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
          <span class="text-[10px] font-bold text-slate-500">Cena:</span>
          <input type="number" min="0" max="200" value="${price}" onchange="adminSetPetPrice('${pet.id}', this.value)" class="w-11 text-center font-black bg-white border border-slate-300 rounded px-1 py-0.5 text-xs">
          <span>💎</span>
        </div>
        <button onclick="adminAdjustPetLevel('${pet.id}', 1)" class="bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-black px-2 py-1 rounded-lg text-[10px]">+1 Lvl</button>
        <button onclick="adminAdjustPetLevel('${pet.id}', -1)" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black px-2 py-1 rounded-lg text-[10px]">-1 Lvl</button>
        <button onclick="adminHealAndRevivePet('${pet.id}')" class="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-2.5 py-1 rounded-lg text-[10px]">Uzdravit 💖</button>
        <button onclick="adminTogglePetUnlock('${pet.id}')" class="px-2.5 py-1 rounded-lg text-[10px] font-black ${pState.unlocked ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-600'}">
          ${pState.unlocked ? 'Odemčeno' : 'Zamčeno'}
        </button>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

function adminResetDailyArenaBattles() {
  ensurePetStateInitialized();
  window.state.petSystem.battlesToday = 0;
  window.state.petSystem.lastArenaDate = getPetTodayDateStr();
  if (typeof saveState === 'function') saveState();
  updateAdminPetsUI();
  renderArenaView();
  if (typeof playTone === 'function') playTone(620, 0.1, 'sine', 0.2);
  if (typeof alertUserFeedback === 'function') alertUserFeedback('Dnešní počet zápasů v Aréně byl vynulován! ⚔️');
}

function saveAdminPetConfig(key, rawValue) {
  ensurePetStateInitialized();
  const cfg = window.state.petSystem.config;
  if (key === 'taskSubjectMode') {
    cfg.taskSubjectMode = rawValue;
  } else {
    cfg[key] = Math.max(0, parseFloat(rawValue) || 0);
  }
  if (typeof saveState === 'function') saveState();
  spawnNewArenaMonster();
  updateAdminPetsUI();
  renderArenaView();
  renderStorePetsUI();
  if (typeof playTone === 'function') playTone(550, 0.08, 'sine', 0.15);
}

function adminSetPetPrice(petId, val) {
  ensurePetStateInitialized();
  window.state.petSystem.pets[petId].customPrice = Math.max(0, parseInt(val, 10) || 0);
  if (typeof saveState === 'function') saveState();
  renderStorePetsUI();
}

function adminAdjustPetLevel(petId, delta) {
  ensurePetStateInitialized();
  const pState = window.state.petSystem.pets[petId];
  pState.level = Math.max(1, pState.level + delta);
  pState.xp = 0;
  pState.currentHp = getPetMaxHp(petId);
  pState.isKnockedOut = false;
  if (typeof saveState === 'function') saveState();
  updateTopPetCompanionWidget();
  updateAdminPetsUI();
  renderArenaView();
}

function adminHealAndRevivePet(petId) {
  ensurePetStateInitialized();
  const pState = window.state.petSystem.pets[petId];
  pState.isKnockedOut = false;
  pState.currentHp = getPetMaxHp(petId);
  if (typeof saveState === 'function') saveState();
  updateTopPetCompanionWidget();
  updateAdminPetsUI();
  renderArenaView();
  if (typeof alertUserFeedback === 'function') alertUserFeedback('Pet uzdraven na 100 % HP! 💖');
}

function adminTogglePetUnlock(petId) {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const pState = ps.pets[petId];
  pState.unlocked = !pState.unlocked;
  if (pState.unlocked && !ps.activePetId) {
    ps.activePetId = petId;
  } else if (!pState.unlocked && ps.activePetId === petId) {
    ps.activePetId = getFirstUnlockedPetId();
  }
  if (typeof saveState === 'function') saveState();
  updateTopPetCompanionWidget();
  updateAdminPetsUI();
  renderStorePetsUI();
  renderArenaView();
}

function renderArenaMainUI() {
  ensurePetStateInitialized();
  if (!arenaBattleState.inProgress && window.state.petSystem.activePetId) {
    spawnNewArenaMonster();
  }
  renderArenaView();
}
