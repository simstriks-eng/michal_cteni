/* ============================================================
   petSystem.js - Školácká Mise
   Modul: Aréna společníků (Pet RPG - Slayer Stage Progression)
   - 4 unikátní petové (odemykají se v Obchodě, přepínají přes modální okno „Vyměň PETA“)
   - Externí obrázky postav (HERO_SPRITES) načítané přes new Image() a vykreslované přes ctx.drawImage()
   - Stage / Patra (1, 2, 3...): každé 10. patro je BOSS (vyžaduje 4 Silné útoky a 0 chyb!)
   - Dynamické škálování HP a DMG tak, aby běžný boj trval max. 4 úkoly a Boss byl výzva
   - Zákaz duplicitních otázek v jednom boji + striktní dělení Lehký vs. Silný útok
   - Potvrzovací okno před oživením peta za diamanty, když dojdou Kameny oživení
   - Loot z poražených botů: 15% šance na Kámen oživení (❤️‍🔥) a 10% šance na Bojový lístek (🎟️ +1 zápas dnes)
   ============================================================ */

const HERO_SPRITES = {
  pikachu: 'https://i.imgur.com/OBC4oXQ.png',
  bulbasaur: 'https://i.imgur.com/maOZCLM.png',
  charmander: 'https://i.imgur.com/tozUhUD.png',
  sonic: 'https://i.imgur.com/hojYJWT.png',
  mewtwo: 'https://i.imgur.com/BbmRwrL.png',
  daily_chest: 'https://i.imgur.com/t1cvXEh.png',
  rare_chest: 'https://i.imgur.com/E6kB6Sg.png'
};

const HERO_IMAGES = {};

function preloadHeroSprites() {
  Object.keys(HERO_SPRITES).forEach((heroId) => {
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      refreshAllHeroCanvases();
    };
    img.src = HERO_SPRITES[heroId];
    HERO_IMAGES[heroId] = img;
  });
}

function getHeroImage(heroId) {
  if (!HERO_SPRITES[heroId]) return null;
  if (!HERO_IMAGES[heroId]) {
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      refreshAllHeroCanvases();
    };
    img.src = HERO_SPRITES[heroId];
    HERO_IMAGES[heroId] = img;
  }
  return HERO_IMAGES[heroId];
}

function drawHeroSpriteToCanvas(canvasEl, heroId, x = 0, y = 0, width = 120, height = 120) {
  if (!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  if (!ctx) return;

  const img = getHeroImage(heroId);
  if (!img) return;

  const renderNow = () => {
    ctx.clearRect(x, y, width, height);
    const natW = img.naturalWidth || width;
    const natH = img.naturalHeight || height;
    const scale = Math.min(width / natW, height / natH);
    const drawW = natW * scale;
    const drawH = natH * scale;
    const drawX = x + (width - drawW) / 2;
    const drawY = y + (height - drawH) / 2;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  };

  if (img.complete && img.naturalWidth > 0) {
    renderNow();
  } else {
    img.addEventListener('load', renderNow, { once: true });
  }
}

function refreshAllHeroCanvases() {
  if (typeof document === 'undefined') return;
  const canvases = document.querySelectorAll('canvas[data-hero-canvas]');
  canvases.forEach((canvasEl) => {
    const heroId = canvasEl.getAttribute('data-hero-canvas');
    const w = canvasEl.width || 120;
    const h = canvasEl.height || 120;
    drawHeroSpriteToCanvas(canvasEl, heroId, 0, 0, w, h);
  });
}

function createHeroCanvasMarkup(heroId) {
  return `<canvas data-hero-canvas="${heroId}" width="120" height="120" class="w-full h-full drop-shadow-md object-contain"></canvas>`;
}

preloadHeroSprites();

if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    refreshAllHeroCanvases();
    const observer = new MutationObserver(() => {
      refreshAllHeroCanvases();
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
}

const PETS_DATABASE = [
  {
    id: 'pikachu',
    name: 'Pikachu',
    element: 'Elektrický ⚡',
    elementKey: 'electric',
    price: 8,
    baseHp: 100,
    lightAttackName: 'Bleskový Šok ⚡',
    heavyAttackName: 'Hromový Úder 🌩️',
    accentColor: '#eab308',
    cardBg: 'from-amber-400/20 via-yellow-300/15 to-amber-500/20',
    borderColor: 'border-amber-400',
    badgeClass: 'bg-amber-400 text-amber-950',
    description: 'Míšův bleskový parťák! Útočí jiskřivým bleskem a oslňuje protivníky.',
    spriteUrl: HERO_SPRITES.pikachu,
    svg: createHeroCanvasMarkup('pikachu')
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
    spriteUrl: HERO_SPRITES.bulbasaur,
    svg: createHeroCanvasMarkup('bulbasaur')
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
    spriteUrl: HERO_SPRITES.sonic,
    svg: createHeroCanvasMarkup('sonic')
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
    spriteUrl: HERO_SPRITES.charmander,
    svg: createHeroCanvasMarkup('charmander')
  },
  {
    id: 'mewtwo',
    name: 'Mewtwo',
    element: 'Mystický 🔮',
    elementKey: 'mythic',
    isMythic: true,
    price: 25,
    baseHp: 110,
    lightAttackName: 'Psychická Vlna 🔮',
    heavyAttackName: 'Mystický Psystrike 🌌',
    accentColor: '#a855f7',
    cardBg: 'from-purple-600/25 via-fuchsia-500/20 to-indigo-600/25',
    borderColor: 'border-purple-400',
    badgeClass: 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-600 text-white',
    description: 'Mystický psychický Pokémon! Během útoku se mu rozzáří oči a sešle epický dimenzionální úder.',
    spriteUrl: HERO_SPRITES.mewtwo,
    svg: createHeroCanvasMarkup('mewtwo')
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
    isBossCandidate: true,
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
    isBossCandidate: true,
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
      unlocked: false,
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
    bonusBattlesToday: 0,
    battleTicketsCount: 0,
    currentStage: 1,
    highestStage: 1,
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
      taskSubjectMode: 'mixed'
    }
  };
}

let arenaBattleState = {
  inProgress: false,
  monster: null,
  monsterLevel: 1,
  stage: 1,
  isBoss: false,
  monsterMaxHp: 100,
  monsterCurrentHp: 100,
  selectedAttackType: 'light',
  activeTask: null,
  usedTaskSignatures: [],
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

function getEffectiveMaxDailyBattles() {
  if (!window.state || !window.state.petSystem) return 5;
  const ps = window.state.petSystem;
  const baseMax = (ps.config && ps.config.maxDailyBattles !== undefined) ? ps.config.maxDailyBattles : 5;
  const bonus = ps.bonusBattlesToday || 0;
  return baseMax + bonus;
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

    if (!ps.lockedByDefaultMigratedV2) {
      ps.lockedByDefaultMigratedV2 = true;
      const pik = ps.pets['pikachu'];
      if (pik && (pik.wins || 0) === 0 && (pik.xp || 0) === 0 && (pik.level || 1) === 1) {
        pik.unlocked = false;
        if (!pik.customPrice || pik.customPrice === 0) pik.customPrice = 8;
      }
    }

    if (ps.battlesToday === undefined) ps.battlesToday = 0;
    if (ps.bonusBattlesToday === undefined) ps.bonusBattlesToday = 0;
    if (ps.battleTicketsCount === undefined) ps.battleTicketsCount = 0;
    if (!ps.currentStage || ps.currentStage < 1) ps.currentStage = 1;
    if (!ps.highestStage || ps.highestStage < ps.currentStage) ps.highestStage = ps.currentStage;

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
    ps.bonusBattlesToday = 0;

    PETS_DATABASE.forEach(p => {
      const petData = ps.pets[p.id];
      if (petData) {
        petData.currentHp = getPetMaxHp(p.id);
        petData.isKnockedOut = false;
      }
    });

    if (typeof saveState === 'function') saveState();
  }
}

/* ============================================================
   MATEMATIKA ŠKÁLOVÁNÍ (SLAYER STAGE PROGRESSION)
   - Běžné patro (1–9): Soupeř má 2.0× až 3.0× HeavyDMG HP -> boj vždy max. na 3–4 úkoly!
   - Každé 10. patro = BOSS (10, 20, 30...):
     * Boss má přesně 4.0× HeavyDMG HP -> vyžaduje 4 Silné útoky!
     * Lehký útok (0.7× HeavyDMG) na zabití včas nestačí!
     * Boss dává za tah 30 % MaxHP peta (po 3 tazích = 90 % HP, 4. tah Bosse zabije).
     * Při chybě dává Boss kritický úder 45 % MaxHP -> při 1 chybě nelze Bosse přežít!
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
  const lvl = petData ? (petData.level || 1) : 1;
  return Math.round(baseDef.baseHp * Math.pow(1.12, lvl - 1) + (lvl - 1) * 18);
}

function getPetHeavyAttackBaseDamage(level) {
  const lvl = Math.max(1, level || 1);
  return Math.round(35 * Math.pow(1.12, lvl - 1) + (lvl - 1) * 6);
}

function getPetAttackDamage(petId, attackType) {
  ensurePetStateInitialized();
  const petData = window.state.petSystem.pets[petId];
  const lvl = petData ? (petData.level || 1) : 1;
  const heavyDmg = getPetHeavyAttackBaseDamage(lvl);
  if (attackType === 'heavy') {
    return heavyDmg;
  } else {
    return Math.round(heavyDmg * 0.70);
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
   HORNÍ LIŠTA: STATICKÝ PET VEDLE „ŠKOLÁK MÍŠA“ + ČERVENÁ DIODKA
   ============================================================ */

function updateTopPetCompanionWidget() {
  ensurePetStateInitialized();
  const badgeContainer = document.getElementById('top-pet-companion-widget');
  if (!badgeContainer) return;

  const ps = window.state.petSystem;
  const activeId = ps.activePetId;
  const petData = activeId ? ps.pets[activeId] : null;
  const maxDaily = getEffectiveMaxDailyBattles();
  const battlesToday = ps.battlesToday || 0;
  const hasBattlesAvailable = battlesToday < maxDaily;

  if (!activeId || !petData || !petData.unlocked) {
    badgeContainer.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-base flex-shrink-0">
        🐾
      </div>
      <div class="flex flex-col justify-center leading-none pr-0.5">
        <span class="text-xs sm:text-sm font-black text-slate-800 font-baloo leading-none">ARÉNA PETŮ</span>
        <span class="text-[9px] font-bold text-amber-700 leading-none mt-1">🔒 Odemkni peta</span>
      </div>
    `;
    return;
  }

  const petDef = PETS_DATABASE.find(p => p.id === activeId) || PETS_DATABASE[0];
  const isKo = petData.isKnockedOut;
  const lvl = petData.level || 1;
  const maxHp = getPetMaxHp(activeId);
  const showRedDiode = hasBattlesAvailable && !isKo;

  badgeContainer.innerHTML = `
    ${showRedDiode ? `
      <span class="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 z-10" title="Zbývá zápasů dnes: ${maxDaily - battlesToday}">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80"></span>
        <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600 border-2 border-white shadow-sm"></span>
      </span>
    ` : ''}
    <div class="w-8 h-8 rounded-xl bg-amber-100/80 border-2 border-amber-400 flex items-center justify-center p-0.5 flex-shrink-0 ${isKo ? 'grayscale opacity-60' : ''}">
      ${petDef.svg}
    </div>
    <div class="flex flex-col justify-center leading-none pr-0.5">
      <div class="flex items-center gap-1">
        <span class="text-xs sm:text-sm font-black text-slate-800 font-baloo leading-none">${petDef.name.split(' ')[0]}</span>
        <span class="text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none ${isKo ? 'bg-rose-500 text-white' : 'bg-amber-400 text-amber-950'}">
          ${isKo ? 'K.O.' : `Lv.${lvl}`}
        </span>
      </div>
      <span class="text-[9px] font-bold leading-none mt-1 ${isKo ? 'text-rose-600' : 'text-emerald-600'}">
        ${isKo ? 'Oživit v Aréně' : `${petData.currentHp}/${maxHp} HP`}
      </span>
    </div>
  `;
  refreshAllHeroCanvases();
}

/* ============================================================
   OTEVŘENÍ OBRAZOVKY ARÉNY A INICIALIZACE SOUBOJE DLE PATRA
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
  const ps = window.state.petSystem;
  const activeId = ps.activePetId;
  const petData = activeId ? ps.pets[activeId] : null;
  const petLvl = petData ? (petData.level || 1) : 1;

  const stage = Math.max(1, ps.currentStage || 1);
  const isBoss = (stage % 10 === 0);
  const subStage = stage % 10; // 1..9 pro běžná patra, 0 pro Boss patro

  // Výběr monstra (na Boss patře vybíráme prioritně Boss draka / titána)
  let chosenMonster;
  if (isBoss) {
    const bossPool = ARENA_MONSTERS_ROSTER.filter(m => m.isBossCandidate);
    chosenMonster = bossPool[(Math.floor(stage / 10) - 1) % bossPool.length] || ARENA_MONSTERS_ROSTER[ARENA_MONSTERS_ROSTER.length - 1];
  } else {
    const normalPool = ARENA_MONSTERS_ROSTER;
    chosenMonster = normalPool[(stage - 1) % normalPool.length];
  }

  // Referenční síla: škáluje se podle levelu peta, ale pokud hráč stoupá do vysokých pater,
  // každých 5 pater vyžaduje aspoň odpovídající minimální sílu
  const minExpectedLvlForStage = Math.max(1, Math.floor((stage - 1) / 4) + 1);
  const effectiveScaleLvl = Math.max(petLvl, minExpectedLvlForStage);
  const refHeavyDmg = getPetHeavyAttackBaseDamage(effectiveScaleLvl);

  let maxHp;
  if (isBoss) {
    // BOSS PATRO: Přesně 4 Silné útoky!
    maxHp = refHeavyDmg * 4;
  } else {
    // BĚŽNÉ PATRO (1..9): Postupně roste od 2.0× do 2.8× HeavyDMG (vždy na 3 Silné nebo 3–4 Lehké útoky, max. 4 úkoly!)
    const hitsMultiplier = 2.0 + (subStage - 1) * 0.10;
    maxHp = Math.round(refHeavyDmg * hitsMultiplier);
  }

  arenaBattleState = {
    inProgress: true,
    monster: chosenMonster,
    monsterLevel: effectiveScaleLvl,
    stage: stage,
    isBoss: isBoss,
    monsterMaxHp: maxHp,
    monsterCurrentHp: maxHp,
    selectedAttackType: isBoss ? 'heavy' : 'light',
    activeTask: null,
    usedTaskSignatures: [],
    turnLocked: false,
    battleLog: isBoss
      ? `🔥 BOSS PATRO ${stage}: ${chosenMonster.name}! Útoč jen SILNÝM útokem a nesmíš udělat chybu!`
      : `🏰 Patro ${stage} • Soupeř: ${chosenMonster.name} (Lv.${effectiveScaleLvl})`
  };
}

/* ============================================================
   MODÁLNÍ OKNO „VYMĚŇ PETA“
   ============================================================ */

function openArenaPetSwitchModal() {
  ensurePetStateInitialized();
  const modal = document.getElementById('arena-pet-switch-modal');
  if (!modal) return;
  renderArenaPetSwitchModal();
  modal.classList.remove('hidden');
  if (typeof playTone === 'function') playTone(540, 0.08, 'sine', 0.15);
}

function closeArenaPetSwitchModal() {
  const modal = document.getElementById('arena-pet-switch-modal');
  if (modal) modal.classList.add('hidden');
}

function renderArenaPetSwitchModal() {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const activeId = ps.activePetId;
  const grid = document.getElementById('arena-pet-switch-grid');
  if (!grid) return;

  grid.innerHTML = '';
  PETS_DATABASE.forEach(pet => {
    const pState = ps.pets[pet.id];
    const isUnlocked = pState && pState.unlocked;
    const isSelected = isUnlocked && pet.id === activeId;
    const isKo = pState && pState.isKnockedOut;
    const lvl = pState ? (pState.level || 1) : 1;
    const reqXp = getXpRequiredForNextLevel(lvl);
    const maxHp = getPetMaxHp(pet.id);
    const curHp = isKo ? 0 : Math.min(maxHp, pState ? pState.currentHp : maxHp);
    const price = getPetPrice(pet.id);
    const lightDmg = getPetAttackDamage(pet.id, 'light');
    const heavyDmg = getPetAttackDamage(pet.id, 'heavy');

    const card = document.createElement('div');
    card.className = `p-4 rounded-3xl border-3 bg-gradient-to-b ${pet.cardBg} bg-white flex flex-col justify-between transition-all ${
      isSelected
        ? `${pet.borderColor} ring-4 ring-amber-300 shadow-lg`
        : isUnlocked
          ? 'border-indigo-200 hover:border-indigo-400 shadow-sm'
          : 'border-dashed border-slate-300 opacity-80'
    }`;

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${pet.badgeClass}">${pet.element}</span>
          <span class="text-xs font-black ${!isUnlocked ? 'text-slate-500' : isKo ? 'text-rose-600' : 'text-indigo-900'}">
            ${!isUnlocked ? `🔒 ${price} 💎` : isKo ? '💀 K.O.' : `LEVEL ${lvl} (${pState.xp}/${reqXp} XP)`}
          </span>
        </div>

        <div class="flex items-center gap-3 my-2">
          <div class="w-16 h-16 rounded-2xl bg-white/80 border border-slate-200 p-1 flex items-center justify-center flex-shrink-0 ${!isUnlocked || isKo ? 'grayscale' : ''}">
            ${pet.svg}
          </div>
          <div class="text-left flex-grow">
            <h4 class="text-base font-black text-slate-800 font-baloo leading-tight">${pet.name}</h4>
            <div class="text-xs font-black ${isKo ? 'text-rose-600' : 'text-emerald-700'} mt-0.5">
              ❤️ HP: ${curHp} / ${maxHp}
            </div>
            <div class="text-[11px] font-bold text-slate-600 mt-0.5">
              ⚡ Lehký: ${lightDmg} DMG • 🔥 Silný: ${heavyDmg} DMG
            </div>
          </div>
        </div>
      </div>

      <div class="mt-3">
        ${
          isSelected
            ? `<button onclick="closeArenaPetSwitchModal()" class="game-button w-full bg-amber-400 text-amber-950 font-black py-2 rounded-xl text-xs border-b-3 border-amber-600">✅ Právě v Aréně</button>`
            : isUnlocked
              ? `<button onclick="selectActivePetInArena('${pet.id}'); closeArenaPetSwitchModal();" class="game-button w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 rounded-xl text-xs border-b-3 border-indigo-800 shadow-sm">⚔️ Nasadit do Arény</button>`
              : `<button onclick="closeArenaPetSwitchModal(); showStoreTab('pets');" class="game-button w-full bg-cyan-500 hover:bg-cyan-600 text-white font-black py-2 rounded-xl text-xs border-b-3 border-cyan-700 shadow-sm">🛍️ Odemknout v Obchodě (${price} 💎)</button>`
        }
      </div>
    `;
    grid.appendChild(card);
  });

  refreshAllHeroCanvases();
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

/* ============================================================
   POUŽITÍ BOJOVÉHO LÍSTKU (+1 ZÁPAS DNES JAKO V SHAKES & FIDGET)
   ============================================================ */

function useArenaBattleTicketAction() {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;

  if ((ps.battleTicketsCount || 0) <= 0) {
    if (typeof soundError === 'function') soundError();
    if (typeof alertUserFeedback === 'function') {
      alertUserFeedback('Nemáš žádný Bojový lístek 🎟️! Padá s 10% šancí za poražení soupeře v Aréně.');
    }
    return;
  }

  ps.battleTicketsCount--;
  ps.bonusBattlesToday = (ps.bonusBattlesToday || 0) + 1;

  if (typeof saveState === 'function') saveState();
  if (typeof playCustomSuccessSound === 'function') playCustomSuccessSound();
  updateTopPetCompanionWidget();
  renderArenaView();
  if (typeof alertUserFeedback === 'function') {
    alertUserFeedback(`🎟️ Bojový lístek použit! Dnešní limit zápasů navýšen na ${getEffectiveMaxDailyBattles()}! ⚔️`);
  }
}

/* ============================================================
   VYKRESLENÍ ARÉNY
   ============================================================ */

function renderArenaView() {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const activeId = ps.activePetId;
  const maxDaily = getEffectiveMaxDailyBattles();
  const battlesToday = ps.battlesToday || 0;
  const stage = ps.currentStage || 1;
  const isBossStage = (stage % 10 === 0);

  // Aktualizace horního přehledu surovin v Aréně
  const foodEl = document.getElementById('arena-food-count');
  const potionEl = document.getElementById('arena-potion-count');
  const ticketsEl = document.getElementById('arena-tickets-count');
  const ticketBtn = document.getElementById('arena-ticket-btn');
  const dailyBadge = document.getElementById('arena-daily-battles-badge');
  const stageBadge = document.getElementById('arena-stage-badge');
  const switchBtnIcon = document.getElementById('arena-switch-btn-pet-icon');

  if (foodEl) foodEl.textContent = (ps.petFoodCount || 0).toString();
  if (potionEl) potionEl.textContent = (ps.revivePotionsCount || 0).toString();
  if (ticketsEl) ticketsEl.textContent = (ps.battleTicketsCount || 0).toString();

  if (ticketBtn) {
    const hasTickets = (ps.battleTicketsCount || 0) > 0;
    ticketBtn.className = hasTickets
      ? 'game-button bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3 py-1.5 rounded-2xl border-2 border-emerald-400 border-b-3 border-b-emerald-800 text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap shadow-md animate-pulse'
      : 'bg-slate-800/80 border-2 border-slate-600 text-slate-300 font-black px-3 py-1.5 rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap';
  }

  if (stageBadge) {
    if (isBossStage) {
      stageBadge.textContent = `🔥 BOSS PATRO ${stage}`;
      stageBadge.className = 'px-3 py-1.5 rounded-2xl border-2 text-xs font-black flex items-center gap-1.5 whitespace-nowrap bg-rose-600 border-amber-300 text-white shadow-md animate-pulse';
    } else {
      stageBadge.textContent = `🏰 Patro ${stage}`;
      stageBadge.className = 'px-3 py-1.5 rounded-2xl border-2 text-xs font-black flex items-center gap-1.5 whitespace-nowrap bg-amber-500/20 border-amber-400 text-amber-200 shadow-inner';
    }
  }

  if (dailyBadge) {
    dailyBadge.textContent = `⚔️ Dnes: ${battlesToday} / ${maxDaily}`;
    dailyBadge.className = `px-3 py-1.5 rounded-2xl border-2 text-xs font-black flex items-center gap-1.5 whitespace-nowrap shadow-inner ${
      battlesToday >= maxDaily
        ? 'bg-rose-950/90 border-rose-400 text-rose-200'
        : 'bg-indigo-900/90 border-indigo-400 text-indigo-100'
    }`;
  }

  if (switchBtnIcon) {
    const activePetDef = PETS_DATABASE.find(p => p.id === activeId);
    switchBtnIcon.innerHTML = activePetDef ? activePetDef.svg : '🐾';
  }

  const lockedEmptyState = document.getElementById('arena-locked-empty-state');
  const battleStage = document.getElementById('arena-battle-stage');

  // Pokud syn ještě nemá odemčeného žádného peta
  if (!activeId || !ps.pets[activeId] || !ps.pets[activeId].unlocked) {
    if (lockedEmptyState) lockedEmptyState.classList.remove('hidden');
    if (battleStage) battleStage.classList.add('hidden');
    refreshAllHeroCanvases();
    return;
  }

  if (lockedEmptyState) lockedEmptyState.classList.add('hidden');
  if (battleStage) battleStage.classList.remove('hidden');

  if (!arenaBattleState.inProgress || !arenaBattleState.monster || arenaBattleState.stage !== stage) {
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
      feedBtn.className = 'px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm border-2 border-slate-600 bg-slate-800/80 text-slate-400 cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap';
      feedBtn.title = isFullHp ? 'Pet má plné HP!' : 'Nelze nakrmit';
    } else {
      feedBtn.className = 'game-button bg-amber-400 hover:bg-amber-500 text-amber-950 px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm border-b-3 border-amber-600 flex items-center gap-1.5 shadow-md whitespace-nowrap';
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

  if (monsterNameEl) {
    monsterNameEl.textContent = arenaBattleState.isBoss ? `👑 BOSS: ${m.name}` : m.name;
  }
  if (monsterTitleEl) {
    monsterTitleEl.textContent = arenaBattleState.isBoss ? `🔥 BOSS PATRA ${stage}` : m.title;
    monsterTitleEl.className = arenaBattleState.isBoss
      ? 'text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 animate-pulse'
      : 'text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-600 text-white';
  }
  if (monsterLvlBadge) {
    monsterLvlBadge.textContent = `PATRO ${stage} • LV.${arenaBattleState.monsterLevel}`;
  }
  if (monsterHpText) monsterHpText.textContent = `${arenaBattleState.monsterCurrentHp} / ${arenaBattleState.monsterMaxHp} HP`;
  if (monsterHpBar) monsterHpBar.style.width = `${mHpPct}%`;
  if (monsterSpriteBox) {
    monsterSpriteBox.innerHTML = m.svg;
    monsterSpriteBox.className = `w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center transition-transform duration-300 pet-float-anim ${
      arenaBattleState.isBoss ? 'scale-110 drop-shadow-[0_0_16px_rgba(244,63,94,0.75)]' : ''
    }`;
  }

  // Bojový deník a přepínání panelů (K.O. / Denní limit / Útoky)
  const logEl = document.getElementById('arena-battle-log');
  if (logEl) logEl.textContent = arenaBattleState.battleLog;

  const koOverlay = document.getElementById('arena-ko-panel');
  const dailyLimitPanel = document.getElementById('arena-daily-limit-panel');
  const dailyLimitTicketBox = document.getElementById('arena-daily-limit-ticket-box');
  const attackControls = document.getElementById('arena-attack-controls');
  const lightBtnLabel = document.getElementById('arena-btn-light-name');
  const heavyBtnLabel = document.getElementById('arena-btn-heavy-name');
  const reviveCostSpan = document.getElementById('arena-revive-cost-label');
  const koReviveBtn = document.getElementById('arena-ko-revive-btn');
  const koDesc = document.getElementById('arena-ko-description');

  const lightDmg = getPetAttackDamage(activeId, 'light');
  const heavyDmg = getPetAttackDamage(activeId, 'heavy');
  const reviveCost = ps.config.reviveCostDiamonds ?? 2;
  const stonesOwned = ps.revivePotionsCount || 0;

  if (lightBtnLabel) lightBtnLabel.textContent = `${petDef.lightAttackName} (${lightDmg} DMG)`;
  if (heavyBtnLabel) heavyBtnLabel.textContent = `${petDef.heavyAttackName} (${heavyDmg} DMG)`;
  if (reviveCostSpan) reviveCostSpan.textContent = `${reviveCost} 💎`;

  if (koDesc && koReviveBtn) {
    if (stonesOwned > 0) {
      koDesc.innerHTML = `Máš v batohu <strong>${stonesOwned}× Kámen oživení ❤️‍🔥</strong>! Můžeš parťáka ihned zdarma oživit:`;
      koReviveBtn.innerHTML = `❤️‍🔥 Oživit Kamenem oživení (máš ${stonesOwned} ks)`;
    } else {
      koDesc.innerHTML = `Nemáš žádný Kámen oživení (❤️‍🔥). Oživení stojí <strong class="underline text-amber-300">${reviveCost} 💎</strong>, nebo počkej do zítřka!`;
      koReviveBtn.innerHTML = `💎 Oživit Peta za ${reviveCost} Diamanty`;
    }
  }

  if (dailyLimitTicketBox) {
    if ((ps.battleTicketsCount || 0) > 0) {
      dailyLimitTicketBox.classList.remove('hidden');
    } else {
      dailyLimitTicketBox.classList.add('hidden');
    }
  }

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

  refreshAllHeroCanvases();
}

/* ============================================================
   KRMENÍ A OŽIVENÍ PETA (S POTVRZENÍM PŘI PLATBĚ DIAMANTY)
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
  const healAmount = Math.max(45, Math.round(maxHp * 0.45));
  petData.currentHp = Math.min(maxHp, petData.currentHp + healAmount);

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

  // Pokud má hráč Kámen oživení, použije se ihned
  if ((ps.revivePotionsCount || 0) > 0) {
    ps.revivePotionsCount--;
    completePetRevive('❤️‍🔥 Pet byl oživen Kamenem oživení a je připraven k boji!');
    return;
  }

  // Pokud nemá Kámen oživení, NEBEREME diamanty automaticky — zobrazíme varovné modální okno!
  const confirmModal = document.getElementById('arena-revive-confirm-modal');
  const costEl = document.getElementById('arena-confirm-revive-cost');
  const balanceEl = document.getElementById('arena-confirm-revive-balance');

  if (costEl) costEl.textContent = `${reviveCost} 💎`;
  if (balanceEl) balanceEl.textContent = (window.state.goldDiamonds || 0).toString();

  if (confirmModal) {
    confirmModal.classList.remove('hidden');
    if (typeof playTone === 'function') playTone(420, 0.1, 'sine', 0.18);
  }
}

function closeArenaReviveConfirmModal() {
  const confirmModal = document.getElementById('arena-revive-confirm-modal');
  if (confirmModal) confirmModal.classList.add('hidden');
}

function confirmReviveWithDiamondsAction() {
  ensurePetStateInitialized();
  const ps = window.state.petSystem;
  const reviveCost = ps.config.reviveCostDiamonds ?? 2;

  if ((window.state.goldDiamonds || 0) < reviveCost) {
    closeArenaReviveConfirmModal();
    if (typeof soundError === 'function') soundError();
    if (typeof alertUserFeedback === 'function') {
      alertUserFeedback(`Nemáš dostatek diamantů (potřebuješ ${reviveCost} 💎, máš ${window.state.goldDiamonds || 0} 💎)!`);
    }
    return;
  }

  window.state.goldDiamonds -= reviveCost;
  closeArenaReviveConfirmModal();
  completePetRevive(`💎 Pet byl oživen za ${reviveCost} diamanty a má 100 % HP!`);
}

function completePetRevive(feedbackMsg) {
  const ps = window.state.petSystem;
  const activeId = ps.activePetId;
  if (!activeId || !ps.pets[activeId]) return;
  const petData = ps.pets[activeId];

  petData.isKnockedOut = false;
  petData.currentHp = getPetMaxHp(activeId);
  arenaBattleState.battleLog = 'Parťák je oživen v plné síle!';

  if (typeof saveState === 'function') saveState();
  if (typeof updateBalanceUI === 'function') updateBalanceUI();
  if (typeof updateTopBadges === 'function') updateTopBadges();
  updateTopPetCompanionWidget();
  renderArenaView();
  if (typeof playCustomSuccessSound === 'function') playCustomSuccessSound();
  if (typeof alertUserFeedback === 'function') alertUserFeedback(feedbackMsg);
}

/* ============================================================
   STRIKTNÍ DĚLENÍ LEHKÝ vs. SILNÝ ÚTOK + ZÁKAZ DUPLICIT V BOJI
   - Lehký útok (Čtení): Písmeno, Slabika, Jednoslabičné slovo (např. KŮŇ, LES, MYŠ)
   - Silný útok (Čtení): POUZE Dvouslabičná/víceslabičná slova a Celé věty!
   - Lehký útok (Matematika): Lehčí sčítání a odčítání do 10
   - Silný útok (Matematika): Slovní úlohy a těžší sčítání/odčítání
   ============================================================ */

function countCzechSyllables(word) {
  if (!word) return 0;
  const cleaned = word.trim().toUpperCase();
  // Samohlásky a dvojhlásky (OU, AU, EU počítáme jako 1 slabikotvorné jádro)
  const normalized = cleaned.replace(/OU|AU|EU/g, 'A');
  const vowelMatches = normalized.match(/[AEIOUYÁÉÍÓÚŮÝĚ]/g);
  return vowelMatches ? vowelMatches.length : 1;
}

function buildReadingCandidatesForAttack(attackType) {
  const activeLetters = (window.state && Array.isArray(window.state.activeLetters) && window.state.activeLetters.length > 0)
    ? window.state.activeLetters
    : ['M', 'A', 'L', 'E', 'S', 'O'];

  const canForm = (lettersArr) => {
    if (!lettersArr || !lettersArr.length) return false;
    return lettersArr.every(ch => activeLetters.includes(ch));
  };

  const poolLvl3 = (typeof LEVEL_3_CVC_WORDS !== 'undefined') ? LEVEL_3_CVC_WORDS.filter(w => canForm(w.letters)) : [];
  const poolLvl4 = (typeof LEVEL_4_TWO_SYLLABLE_WORDS !== 'undefined') ? LEVEL_4_TWO_SYLLABLE_WORDS.filter(w => canForm(w.letters)) : [];
  const poolLvl5 = (typeof LEVEL_5_CLUSTERS !== 'undefined') ? LEVEL_5_CLUSTERS.filter(w => canForm(w.letters)) : [];
  const poolLvl6 = (typeof LEVEL_6_SOFT !== 'undefined') ? LEVEL_6_SOFT.filter(w => canForm(w.letters)) : [];
  const poolLvl7 = (typeof LEVEL_7_SENTENCES !== 'undefined') ? LEVEL_7_SENTENCES.filter(s => canForm(s.letters)) : [];

  // Unikátní logická slova z data.js filtrovaná podle aktivních písmen v Admin módu
  const seenTexts = new Set();
  const dedupWords = (arr) => arr.filter(w => {
    if (!w || !w.text || seenTexts.has(w.text)) return false;
    seenTexts.add(w.text);
    return true;
  });

  const allLogicalWords = dedupWords([...poolLvl3, ...poolLvl4, ...poolLvl5, ...poolLvl6]);
  const oneSyllableWords = allLogicalWords.filter(w => countCzechSyllables(w.text) <= 1);
  const multiSyllableWords = allLogicalWords.filter(w => countCzechSyllables(w.text) >= 2);

  const candidates = [];

  if (attackType === 'heavy') {
    // SILNÝ ÚTOK: Logická dvouslabičná/víceslabičná slova a celé věty z data.js (podle aktivních písmen)
    multiSyllableWords.forEach(w => {
      candidates.push({
        subject: 'reading',
        difficultyLabel: 'Silný útok • Čtení',
        promptText: w.text,
        subLabel: 'Dvouslabičné slovo',
        signature: `reading:${w.text}`
      });
    });

    poolLvl7.forEach(s => {
      candidates.push({
        subject: 'reading',
        difficultyLabel: 'Silný útok • Čtení',
        promptText: s.text,
        subLabel: 'Celá věta',
        signature: `reading:${s.text}`
      });
    });

    // Pokud z povolených písmen zatím nelze složit víceslabičné slovo ani větu, použijeme logická jednoslabičná slova z data.js
    if (candidates.length === 0) {
      oneSyllableWords.forEach(w => {
        candidates.push({
          subject: 'reading',
          difficultyLabel: 'Silný útok • Čtení',
          promptText: w.text,
          subLabel: 'Jednoslabičné slovo',
          signature: `reading:${w.text}`
        });
      });
    }

    // Nouzová pojistka pokud rodič vypnul téměř všechna písmena: pouze reálná slova z LEVEL_4_TWO_SYLLABLE_WORDS
    if (candidates.length === 0 && typeof LEVEL_4_TWO_SYLLABLE_WORDS !== 'undefined') {
      LEVEL_4_TWO_SYLLABLE_WORDS.slice(0, 15).forEach(w => {
        candidates.push({
          subject: 'reading',
          difficultyLabel: 'Silný útok • Čtení',
          promptText: w.text,
          subLabel: 'Dvouslabičné slovo',
          signature: `reading:${w.text}`
        });
      });
    }
  } else {
    // LEHKÝ ÚTOK: Logická jednoslabičná a dvouslabičná slova z data.js (podle aktivních písmen)
    oneSyllableWords.forEach(w => {
      candidates.push({
        subject: 'reading',
        difficultyLabel: 'Lehký útok • Čtení',
        promptText: w.text,
        subLabel: 'Jednoslabičné slovo',
        signature: `reading:${w.text}`
      });
    });

    // Přidáme i základní dvouslabičná slova z 4. kategorie, pokud je jednoslabičných málo
    if (candidates.length < 6) {
      poolLvl4.forEach(w => {
        if (!candidates.some(c => c.promptText === w.text)) {
          candidates.push({
            subject: 'reading',
            difficultyLabel: 'Lehký útok • Čtení',
            promptText: w.text,
            subLabel: 'Dvouslabičné slovo',
            signature: `reading:${w.text}`
          });
        }
      });
    }

    // Nouzová pojistka pokud rodič vypnul téměř všechna písmena: pouze reálná slova z LEVEL_3_CVC_WORDS
    if (candidates.length === 0 && typeof LEVEL_3_CVC_WORDS !== 'undefined') {
      LEVEL_3_CVC_WORDS.slice(0, 15).forEach(w => {
        candidates.push({
          subject: 'reading',
          difficultyLabel: 'Lehký útok • Čtení',
          promptText: w.text,
          subLabel: 'Jednoslabičné slovo',
          signature: `reading:${w.text}`
        });
      });
    }
  }

  return candidates;
}

function generateSingleMathCandidate(attackType) {
  const maxVal = (window.state && window.state.mathMax) ? window.state.mathMax : 10;

  if (attackType === 'light') {
    // LEHKÝ ÚTOK: Lehčí sčítání a odčítání s menšími čísly
    const lightMax = Math.min(maxVal, 10);
    const isPlus = Math.random() > 0.45;
    if (isPlus) {
      const a = randomInt(1, Math.max(1, lightMax - 1));
      const b = randomInt(1, Math.max(1, lightMax - a));
      const q = `${a} + ${b} = ?`;
      return {
        subject: 'math',
        difficultyLabel: 'Lehký útok • Počty',
        mathKind: 'input',
        questionHtml: q,
        correctAnswer: (a + b).toString(),
        signature: `math:${q}`
      };
    } else {
      const a = randomInt(2, lightMax);
      const b = randomInt(1, a - 1);
      const q = `${a} − ${b} = ?`;
      return {
        subject: 'math',
        difficultyLabel: 'Lehký útok • Počty',
        mathKind: 'input',
        questionHtml: q,
        correctAnswer: (a - b).toString(),
        signature: `math:${q}`
      };
    }
  } else {
    // SILNÝ ÚTOK: Slovní úlohy nebo těžší sčítání / odčítání
    const useStory = Math.random() < 0.5 && typeof generateMathLevel6 === 'function';
    if (useStory) {
      const stories = generateMathLevel6(maxVal);
      const st = stories[Math.floor(Math.random() * stories.length)] || stories[0];
      return {
        subject: 'math',
        difficultyLabel: 'Silný útok • Slovní úloha',
        mathKind: 'story',
        storyText: st.story,
        correctAnswer: st.correctAnswer,
        signature: `math:${st.story}`
      };
    } else {
      const isPlus = Math.random() > 0.45;
      if (isPlus) {
        const minA = Math.max(3, Math.floor(maxVal * 0.35));
        const maxA = Math.max(minA + 1, Math.floor(maxVal * 0.75));
        const a = randomInt(minA, maxA);
        const b = randomInt(Math.max(2, maxVal - a - 2), Math.max(2, maxVal - a));
        const q = `${a} + ${b} = ?`;
        return {
          subject: 'math',
          difficultyLabel: 'Silný útok • Počítadlo',
          mathKind: 'input',
          questionHtml: q,
          correctAnswer: (a + b).toString(),
          signature: `math:${q}`
        };
      } else {
        const minA = Math.max(5, Math.floor(maxVal * 0.55));
        const a = randomInt(minA, Math.max(minA, maxVal));
        const b = randomInt(2, Math.max(2, a - 2));
        const q = `${a} − ${b} = ?`;
        return {
          subject: 'math',
          difficultyLabel: 'Silný útok • Počítadlo',
          mathKind: 'input',
          questionHtml: q,
          correctAnswer: (a - b).toString(),
          signature: `math:${q}`
        };
      }
    }
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
  if (!Array.isArray(arenaBattleState.usedTaskSignatures)) {
    arenaBattleState.usedTaskSignatures = [];
  }
  const used = arenaBattleState.usedTaskSignatures;
  const subj = chooseArenaTaskSubject();

  if (subj === 'reading') {
    const allCandidates = buildReadingCandidatesForAttack(attackType);
    // Odfiltrujeme již použité otázky v tomto boji
    const unused = allCandidates.filter(c => !used.includes(c.signature));
    const pool = unused.length > 0 ? unused : allCandidates;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    if (chosen && chosen.signature) {
      used.push(chosen.signature);
    }
    return chosen;
  } else {
    let chosen = null;
    for (let attempt = 0; attempt < 25; attempt++) {
      const candidate = generateSingleMathCandidate(attackType);
      if (!used.includes(candidate.signature)) {
        chosen = candidate;
        break;
      }
      chosen = candidate;
    }
    if (chosen && chosen.signature) {
      used.push(chosen.signature);
    }
    return chosen;
  }
}

/* ============================================================
   SPUŠTĚNÍ TAHU A VYSKAKOVACÍ BOJOVÉ OKNO S ÚKOLEM
   ============================================================ */

function triggerArenaAttackModal(attackType) {
  ensurePetStateInitialized();
  if (arenaBattleState.turnLocked) return;

  const ps = window.state.petSystem;
  const maxDaily = getEffectiveMaxDailyBattles();
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
    arenaBattleState.battleLog = arenaBattleState.isBoss
      ? `❌ CHYBA PROTI BOSSOVI! ${arenaBattleState.monster.name} trestá drtivým úderem!`
      : `❌ Minul jsi! ${arenaBattleState.monster.name} útočí!`;
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
  const maxPetHp = getPetMaxHp(activeId);

  let rawDmg;
  if (arenaBattleState.isBoss) {
    // BOSS MATEMATIKA:
    // Při bezchybném boji na 4 Silné útoky stihne Boss zaútočit 3× (po 1., 2. a 3. tahu):
    // 3 × 30 % = 90 % MaxHP -> pet přežije s ~10 % HP!
    // Pokud dá hráč Lehký útok (Boss přežije 4. tah) nebo udělá chybu (45 % HP), pet padne!
    if (wasPlayerMiss) {
      rawDmg = Math.ceil(maxPetHp * 0.45);
    } else {
      rawDmg = Math.ceil(maxPetHp * 0.30);
    }
  } else {
    const subStage = (ps.currentStage || 1) % 10;
    const pct = 0.14 + subStage * 0.008 + (wasPlayerMiss ? 0.08 : 0);
    rawDmg = Math.max(8, Math.round(maxPetHp * pct));
  }

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

  const petBox = document.getElementById('arena-pet-sprite-box');
  if (petBox) {
    petBox.classList.add('brightness-125');
    setTimeout(() => petBox.classList.remove('brightness-125'), 260);
  }

  if (petData.currentHp <= 0) {
    petData.isKnockedOut = true;
    petData.losses = (petData.losses || 0) + 1;
    ps.battlesToday = (ps.battlesToday || 0) + 1;
    if (typeof updateDailyQuestsProgress === 'function') updateDailyQuestsProgress('arena', 1);
    arenaBattleState.turnLocked = false;
    arenaBattleState.battleLog = `💀 ${petData.name || 'Parťák'} padl v Patře ${ps.currentStage || 1}! Oživ ho nebo se přes noc uzdraví.`;
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
   SAMOSTATNÉ EXPENÍ PETA, LOOT (15% KÁMEN, 10% LÍSTEK) & POSTUP DO DALŠÍHO PATRA
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

  const clearedStage = ps.currentStage || 1;
  const wasBoss = (clearedStage % 10 === 0);

  petData.wins = (petData.wins || 0) + 1;
  ps.battlesToday = (ps.battlesToday || 0) + 1;
  if (typeof updateDailyQuestsProgress === 'function') updateDailyQuestsProgress('arena', 1);

  // Postup do vyššího patra (Slayer Stage Progression)
  ps.currentStage = clearedStage + 1;
  if (ps.currentStage > (ps.highestStage || 1)) {
    ps.highestStage = ps.currentStage;
  }

  const baseXp = ps.config.xpPerWin ?? 35;
  const xpGain = wasBoss ? Math.round(baseXp * 2) : Math.round(baseXp * (1 + (clearedStage - 1) * 0.05));
  const foodGain = wasBoss ? (ps.config.foodPerWin ?? 1) + 1 : (ps.config.foodPerWin ?? 1);

  ps.petFoodCount = (ps.petFoodCount || 0) + foodGain;

  // LOOT DROP #1: 15% šance na Kámen oživení (❤️‍🔥)
  const droppedReviveStone = Math.random() < 0.15;
  if (droppedReviveStone) {
    ps.revivePotionsCount = (ps.revivePotionsCount || 0) + 1;
  }

  // LOOT DROP #2: 10% šance na Bojový lístek (🎟️ +1 zápas dnes)
  const droppedBattleTicket = Math.random() < 0.10;
  if (droppedBattleTicket) {
    ps.battleTicketsCount = (ps.battleTicketsCount || 0) + 1;
  }

  // Diamanty za celý dokončený Level Up peta
  const { levelsGained, diamondsAwarded } = GrantPetXp(activeId, xpGain);
  arenaBattleState.turnLocked = false;

  const reqNextXp = getXpRequiredForNextLevel(petData.level);

  const lootNotes = [];
  if (droppedReviveStone) lootNotes.push('+1 ❤️‍🔥 Kámen oživení');
  if (droppedBattleTicket) lootNotes.push('+1 🎟️ Bojový lístek');

  window.state.history.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('cs-CZ'),
    type: 'arena_win',
    minutes: 0,
    note: `Aréna (Patro ${clearedStage}${wasBoss ? ' BOSS' : ''}): ${petDef.name} Lv.${petData.level} (+${foodGain} 🍖, +${xpGain} XP${levelsGained > 0 ? `, +${diamondsAwarded} 💎` : ''}${lootNotes.length ? `, Loot: ${lootNotes.join(', ')}` : ''})`
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
        Pokoril jsi <strong>${wasBoss ? `🔥 BOSSE PATRA ${clearedStage}` : `Patro ${clearedStage}`} (${arenaBattleState.monster.name})</strong>!<br>
        <span class="text-xs font-black text-indigo-700">Postupuješ do Patra ${ps.currentStage}! 🏰</span>
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
      ${droppedReviveStone ? `
        <div class="mt-2.5 p-3 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 font-black text-xs flex items-center justify-center gap-2 shadow-sm">
          <span class="text-xl">❤️‍🔥</span>
          <span>VZÁCNÝ LOOT (15%): Padl ti <strong>+1 Kámen oživení</strong>!</span>
        </div>
      ` : ''}
      ${droppedBattleTicket ? `
        <div class="mt-2.5 p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 font-black text-xs flex items-center justify-center gap-2 shadow-sm">
          <span class="text-xl">🎟️</span>
          <span>BONUSOVÝ LOOT (10%): Padl ti <strong>+1 Bojový lístek</strong> na extra zápas!</span>
        </div>
      ` : ''}
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
  if (monsterBox) {
    monsterBox.classList.add('scale-110', 'brightness-125');
    setTimeout(() => monsterBox.classList.remove('scale-110', 'brightness-125'), 280);
  }
}

function playPetAttackCanvasAnimation(elementKey, attackType, onComplete) {
  const canvas = document.getElementById('arena-fx-canvas');
  const petBox = document.getElementById('arena-pet-sprite-box');

  if (elementKey === 'mythic') {
    if (petBox) {
      petBox.style.transition = 'transform 0.35s ease, filter 0.35s ease';
      petBox.style.filter = 'drop-shadow(0 0 22px #e879f9) drop-shadow(0 0 40px #a855f7) brightness(1.18)';
      petBox.classList.add('-translate-y-3', 'scale-115');
      setTimeout(() => {
        petBox.style.filter = '';
        petBox.classList.remove('-translate-y-3', 'scale-115');
      }, 950);
    }

    if (typeof playTone === 'function') {
      // Mystický psychický zvuk: probuzení očí -> telekinetická rezonance -> kosmický úder
      playTone(310, 0.22, 'sine', 0.24);
      setTimeout(() => playTone(620, 0.22, 'triangle', 0.26), 110);
      setTimeout(() => playTone(930, 0.25, 'sine', 0.28), 220);
      setTimeout(() => playTone(1480, 0.30, 'sawtooth', 0.22), 360);
      setTimeout(() => playTone(180, 0.35, 'triangle', 0.32), 540);
    }

    if (!canvas) {
      setTimeout(onComplete, 850);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 600;
    canvas.height = rect.height || 320;
    const ctx = canvas.getContext('2d');

    const startX = canvas.width * 0.23;
    const startY = canvas.height * 0.48;
    const endX = canvas.width * 0.77;
    const endY = canvas.height * 0.48;

    const activeId = (window.state && window.state.petSystem) ? window.state.petSystem.activePetId : 'mewtwo';
    const heroImg = getHeroImage(activeId);

    const totalFrames = attackType === 'heavy' ? 56 : 44;
    let frame = 0;

    // Vygenerujeme částice pro psychickou spirálu a supernovu
    const orbs = Array.from({ length: attackType === 'heavy' ? 28 : 18 }, (_, idx) => ({
      angleOffset: (idx / 14) * Math.PI * 2,
      radiusOffset: 16 + (idx % 4) * 9,
      size: (attackType === 'heavy' ? 6 : 4.5) + (idx % 3) * 2.5,
      color: ['#e879f9', '#a855f7', '#38bdf8', '#f0abfc', '#fde047'][idx % 5]
    }));

    function drawGlowingEye(cx, cy, intensity, isHeavyAttack) {
      ctx.save();
      // Vnější psychická záře oka
      const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, 22 * intensity);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, isHeavyAttack ? '#38bdf8' : '#e879f9');
      grad.addColorStop(0.6, '#a855f7');
      grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 22 * intensity, 0, Math.PI * 2);
      ctx.fill();

      // Ostré světelné paprsky z očí (křížový záblesk)
      ctx.strokeStyle = isHeavyAttack ? '#bae6fd' : '#f5d0fe';
      ctx.lineWidth = 2.5 * intensity;
      ctx.shadowColor = '#e879f9';
      ctx.shadowBlur = 14;
      const rayLen = (isHeavyAttack ? 28 : 20) * intensity;
      ctx.beginPath();
      ctx.moveTo(cx - rayLen, cy);
      ctx.lineTo(cx + rayLen, cy);
      ctx.moveTo(cx, cy - rayLen * 0.65);
      ctx.lineTo(cx, cy + rayLen * 0.65);
      ctx.stroke();

      // Jádro oka
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 5.5 * intensity, 3.2 * intensity, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function stepMythic() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = frame / totalFrames;

      // Jemné mystické zatmění arény během kouzlení
      const bgAlpha = Math.sin(t * Math.PI) * (attackType === 'heavy' ? 0.38 : 0.22);
      ctx.save();
      const bgGrad = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.5, 20,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.7
      );
      bgGrad.addColorStop(0, `rgba(88, 28, 135, ${bgAlpha})`);
      bgGrad.addColorStop(1, `rgba(15, 23, 42, ${bgAlpha * 1.2})`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Levitující astrální projekce Mewtwoa s planoucíma očima
      const levitateY = -Math.sin(t * Math.PI) * 18;
      const spriteSize = attackType === 'heavy' ? 118 : 102;
      const petCenterX = startX;
      const petCenterY = startY + levitateY;

      // Telekinetická aura kolem Mewtwoa
      ctx.save();
      for (let r = 0; r < 3; r++) {
        const ringProgress = ((t * 2.5 + r * 0.33) % 1);
        const ringRadius = 24 + ringProgress * (attackType === 'heavy' ? 75 : 55);
        ctx.beginPath();
        ctx.arc(petCenterX, petCenterY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = r % 2 === 0
          ? `rgba(232, 121, 249, ${(1 - ringProgress) * 0.75})`
          : `rgba(56, 189, 248, ${(1 - ringProgress) * 0.65})`;
        ctx.lineWidth = 3 * (1 - ringProgress);
        ctx.stroke();
      }
      ctx.restore();

      if (heroImg && heroImg.complete && heroImg.naturalWidth > 0) {
        ctx.save();
        ctx.shadowColor = '#e879f9';
        ctx.shadowBlur = 28;
        ctx.drawImage(
          heroImg,
          petCenterX - spriteSize / 2,
          petCenterY - spriteSize / 2,
          spriteSize,
          spriteSize
        );
        ctx.restore();
      }

      // FÁZE 1 & 2: ROZSVÍCENÉ OČI MEWTWOA (intenzivní záře v prvních 75 % animace)
      if (t < 0.82) {
        const eyePulse = t < 0.3
          ? (t / 0.3) * 1.25
          : 1.0 + 0.25 * Math.sin(frame * 0.7);
        const leftEyeX = petCenterX - spriteSize * 0.09;
        const rightEyeX = petCenterX + spriteSize * 0.07;
        const eyesY = petCenterY - spriteSize * 0.21;

        drawGlowingEye(leftEyeX, eyesY, eyePulse, attackType === 'heavy');
        drawGlowingEye(rightEyeX, eyesY, eyePulse, attackType === 'heavy');
      }

      // FÁZE 2: EPICKÝ PSYCHICKÝ PAPRSEK A SPIRÁLA (t od 0.22 do 0.88)
      if (t >= 0.20) {
        const strikeT = Math.min(1, (t - 0.20) / 0.55);
        const headX = startX + (endX - startX) * strikeT;
        const headY = startY + (endY - startY) * strikeT;

        // Hlavní dimenzionální paprsek (Psystrike Beam)
        if (attackType === 'heavy') {
          ctx.save();
          const beamWidth = 22 * Math.sin(Math.min(1, (t - 0.2) / 0.7) * Math.PI);
          const beamGrad = ctx.createLinearGradient(startX, startY, headX, headY);
          beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
          beamGrad.addColorStop(0.5, 'rgba(232, 121, 249, 0.95)');
          beamGrad.addColorStop(1, 'rgba(255, 255, 255, 1)');

          ctx.beginPath();
          ctx.moveTo(startX, petCenterY);
          ctx.lineTo(headX, headY);
          ctx.strokeStyle = beamGrad;
          ctx.lineWidth = Math.max(4, beamWidth);
          ctx.lineCap = 'round';
          ctx.shadowColor = '#d946ef';
          ctx.shadowBlur = 25;
          ctx.stroke();

          // Vnitřní bílé jádro paprsku
          ctx.beginPath();
          ctx.moveTo(startX, petCenterY);
          ctx.lineTo(headX, headY);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(2, beamWidth * 0.38);
          ctx.stroke();

          // Psychické blesky křižující paprsek
          ctx.beginPath();
          const segs = 7;
          for (let s = 0; s <= segs; s++) {
            const st = s / segs;
            const bx = startX + (headX - startX) * st;
            const by = petCenterY + (headY - petCenterY) * st + (s === 0 || s === segs ? 0 : (Math.random() - 0.5) * 34);
            if (s === 0) ctx.moveTo(bx, by);
            else ctx.lineTo(bx, by);
          }
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.restore();
        }

        // Rotující galaktické/psychické energetické koule letící k cíli
        ctx.save();
        orbs.forEach((orb, idx) => {
          const orbLag = (idx / orbs.length) * 0.35;
          const localT = Math.max(0, Math.min(1, (strikeT - orbLag) / (1 - orbLag)));
          if (localT <= 0) return;

          const angle = frame * 0.28 + orb.angleOffset;
          const spiralRadius = orb.radiusOffset * Math.sin(localT * Math.PI);
          const ox = startX + (endX - startX) * localT + Math.cos(angle) * spiralRadius * 0.5;
          const oy = petCenterY + (endY - petCenterY) * localT + Math.sin(angle) * spiralRadius;

          ctx.beginPath();
          ctx.arc(ox, oy, orb.size, 0, Math.PI * 2);
          ctx.fillStyle = orb.color;
          ctx.shadowColor = orb.color;
          ctx.shadowBlur = 16;
          ctx.fill();
        });

        // Hlavní psychická sféra v čele útoku
        const coreRadius = (attackType === 'heavy' ? 30 : 20) * (1 + 0.25 * Math.sin(frame * 0.8));
        const sphereGrad = ctx.createRadialGradient(headX, headY, 2, headX, headY, coreRadius);
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.35, '#e879f9');
        sphereGrad.addColorStop(0.75, '#7e22ce');
        sphereGrad.addColorStop(1, 'rgba(126, 34, 206, 0)');
        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(headX, headY, coreRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // FÁZE 3: SUPERNOVA EXPLOZE NA CÍLI (t >= 0.68)
      if (t >= 0.68) {
        const impactT = (t - 0.68) / 0.32;
        const maxBlast = attackType === 'heavy' ? 115 : 75;
        const blastRadius = impactT * maxBlast;

        ctx.save();
        // Tlaková vlna #1 (Fuchsia/Violet)
        ctx.beginPath();
        ctx.arc(endX, endY, blastRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 121, 249, ${Math.max(0, 1 - impactT)})`;
        ctx.lineWidth = (attackType === 'heavy' ? 12 : 7) * (1 - impactT);
        ctx.shadowColor = '#e879f9';
        ctx.shadowBlur = 24;
        ctx.stroke();

        // Tlaková vlna #2 (Neon Cyan)
        ctx.beginPath();
        ctx.arc(endX, endY, blastRadius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 1 - impactT)})`;
        ctx.lineWidth = 6 * (1 - impactT);
        ctx.stroke();

        // Záblesk v místě dopadu
        const flashGrad = ctx.createRadialGradient(endX, endY, 2, endX, endY, blastRadius * 0.85);
        flashGrad.addColorStop(0, `rgba(255, 255, 255, ${Math.max(0, 0.95 - impactT)})`);
        flashGrad.addColorStop(0.45, `rgba(217, 70, 239, ${Math.max(0, 0.75 - impactT * 0.8)})`);
        flashGrad.addColorStop(1, 'rgba(88, 28, 135, 0)');
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(endX, endY, blastRadius * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      frame++;
      if (frame <= totalFrames) {
        requestAnimationFrame(stepMythic);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onComplete) onComplete();
      }
    }

    requestAnimationFrame(stepMythic);
    return;
  }

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

  const activeId = (window.state && window.state.petSystem) ? window.state.petSystem.activePetId : 'pikachu';
  const heroImg = getHeroImage(activeId);

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

    if (heroImg && heroImg.complete && heroImg.naturalWidth > 0) {
      const spriteSize = attackType === 'heavy' ? 96 : 80;
      const lungeOffset = Math.sin(t * Math.PI) * 28;
      ctx.save();
      ctx.globalAlpha = 0.85 * (1 - t * 0.4);
      ctx.drawImage(
        heroImg,
        startX - spriteSize / 2 + lungeOffset,
        startY - spriteSize / 2,
        spriteSize,
        spriteSize
      );
      ctx.restore();
    }

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
      ctx.clearRect(0, 0, canvas.width, canvas.width);
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
        <div class="w-24 h-24 mx-auto my-2 flex items-center justify-center ${!isUnlocked ? ' opacity-85' : ''}">
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

  refreshAllHeroCanvases();
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

  setVal('admin-pet-current-stage', ps.currentStage ?? 1);
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
    battlesLabel.textContent = `${ps.battlesToday || 0} / ${getEffectiveMaxDailyBattles()}`;
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

  refreshAllHeroCanvases();
}

function adminSetArenaStage(val) {
  ensurePetStateInitialized();
  const stageNum = Math.max(1, parseInt(val, 10) || 1);
  window.state.petSystem.currentStage = stageNum;
  if (stageNum > (window.state.petSystem.highestStage || 1)) {
    window.state.petSystem.highestStage = stageNum;
  }
  if (typeof saveState === 'function') saveState();
  spawnNewArenaMonster();
  updateAdminPetsUI();
  renderArenaView();
  if (typeof playTone === 'function') playTone(580, 0.08, 'sine', 0.15);
}

function adminResetDailyArenaBattles() {
  ensurePetStateInitialized();
  window.state.petSystem.battlesToday = 0;
  window.state.petSystem.lastArenaDate = getPetTodayDateStr();
  if (typeof saveState === 'function') saveState();
  updateTopPetCompanionWidget();
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
  updateTopPetCompanionWidget();
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
  spawnNewArenaMonster();
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
