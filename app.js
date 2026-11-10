/* ============================================================
   app.js - Školácká Mise
   Hlavní herní jádro:
   - Didaktické procvičování čtení a matematiky pro 1. třídu ZŠ
   - Skrývání a odkrývání nápovědného výpočtu u slovních úloh
   - Denní výzvy, streak, truhly, obchod za mince i diamanty
   - Administrace a modulární testování znalostí
   ============================================================ */

const APP_VERSION = '5.2';
const STORAGE_KEY = 'ctenarska_mise_v20_modular';
const USER_STORAGE_PREFIX = 'ctenarska_mise_v20_user_';
const LOCAL_ACCOUNTS_REGISTRY_KEY = 'ctenarska_mise_accounts_registry_v1';
const REMEMBERED_USER_KEY = 'ctenarska_mise_remembered_user_v1';
const SESSION_USER_KEY = 'ctenarska_mise_session_user_v1';
const GIST_ID = 'd7f00f126ab1aa7021d4ba47bddc7e8e';
const GIST_TOKEN_CODES = [106,108,117,101,85,74,77,59,77,107,78,58,85,75,117,75,109,56,105,61,81,123,119,56,89,92,110,124,94,86,102,55,123,54,58,109,76,85,86,104];
const GITHUB_TOKEN = GIST_TOKEN_CODES.map((code, idx) => String.fromCharCode(code - (idx % 5) - 3)).join('');
const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;
let cachedGistFilename = 'gistfile1.txt';

const BUILTIN_ACCOUNTS = {
  misa: {
    username: 'misa',
    password: 'misa18',
    displayName: 'ŠKOLÁK MÍŠA',
    cloudEnabled: true,
    isTestAccount: false
  },
  test: {
    username: 'test',
    password: 'test1',
    displayName: 'ŠKOLÁK TEST',
    cloudEnabled: true,
    isTestAccount: true
  }
};

let currentLoggedInUser = null; // { username, displayName, cloudEnabled, isTestAccount }
let cachedCloudEnvelope = null; // { updatedAt, users: { [username]: { username, password, displayName, updatedAt, progress, state } }, accounts: ... }

function normalizeAccountUsername(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_.-]/g, '');
}

function getLocalAccountsRegistry() {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_REGISTRY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
      misa: { ...BUILTIN_ACCOUNTS.misa },
      test: { ...BUILTIN_ACCOUNTS.test }
    };
  } catch (e) {
    return {
      misa: { ...BUILTIN_ACCOUNTS.misa },
      test: { ...BUILTIN_ACCOUNTS.test }
    };
  }
}

function saveLocalAccountToRegistry(accObj) {
  if (!accObj || !accObj.username) return;
  try {
    const reg = getLocalAccountsRegistry();
    reg[accObj.username] = {
      username: accObj.username,
      password: accObj.password,
      displayName: accObj.displayName || `ŠKOLÁK ${accObj.username.toUpperCase()}`,
      cloudEnabled: accObj.cloudEnabled !== false,
      isTestAccount: Boolean(accObj.isTestAccount)
    };
    localStorage.setItem(LOCAL_ACCOUNTS_REGISTRY_KEY, JSON.stringify(reg));
  } catch (e) {
    console.error('Chyba při ukládání registru účtů:', e);
  }
}

function isTestEnvironment() {
  if (!currentLoggedInUser) return true;
  return Boolean(currentLoggedInUser.isTestAccount || !currentLoggedInUser.cloudEnabled);
}

function getActiveStorageKey() {
  if (!currentLoggedInUser) return `${USER_STORAGE_PREFIX}guest`;
  if (currentLoggedInUser.username === 'misa') return STORAGE_KEY;
  return `${USER_STORAGE_PREFIX}${currentLoggedInUser.username}`;
}

function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#e11d48', '#06b6d4'];
  for (let i = 0; i < 65; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      alpha: 1
    });
  }

  let frames = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.rot += p.vRot;
      p.alpha -= 0.015;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    frames++;
    if (frames < 75) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function createDefaultDailyQuests() {
  return [
    {
      id: 'q_daily_all',
      title: 'Denní výzva',
      desc: '',
      icon: '🎯',
      target: 16,
      progress: 0,
      claimed: false,
      isTrackerOnly: false,
      matches: (s, l) => (s === 'reading' && l >= 1 && l <= 8) || (s === 'math' && l >= 1 && l <= 6)
    },
    {
      id: 'q_test',
      title: 'Denní test',
      desc: '',
      icon: '📝',
      target: 1,
      progress: 0,
      claimed: false,
      isTrackerOnly: true,
      matches: (s) => s === 'test'
    },
    {
      id: 'q_arena',
      title: 'Boj s pety',
      desc: '',
      icon: '⚔️',
      target: 5,
      progress: 0,
      claimed: false,
      isTrackerOnly: true,
      matches: (s) => s === 'arena'
    },
    {
      id: 'q_coloring',
      title: 'Omalovánka',
      desc: '',
      icon: '🎨',
      target: 1,
      progress: 0,
      claimed: false,
      isTrackerOnly: true,
      matches: (s, l) => s === 'math' && l === 7
    }
  ];
}

let state = {
  appVersion: APP_VERSION,
  subject: 'reading',
  minutesBalance: 0.0,
  dailyEarnedToday: 0.0,
  dailyReadingEarnedToday: 0.0,
  dailyMathEarnedToday: 0.0,
  dailyEarnedDate: getTodayDateString(),
  vouchersBoughtDate: getTodayDateString(),
  dailyStandardVoucherBought: null,
  dailyMaxVoucherBought: null,
  traceabilityHistory: [],
  vaultBalance: 0.0,
  goldDiamonds: 0,
  bonusMaxLimitMinutes: 0,
  diamondExchangeRate: 20,
  pokemonSegmentsCount: 12,
  tabletSecretPin: 'XXXX',
  activeLetters: ['M', 'L', 'E', 'É', 'A', 'Á', 'S', 'O', 'Ó'],
  currentLevel: 1,
  currentMathLevel: 1,
  mathMax: 10,
  coinMaxLimit: 20,
  coinHardMode: true,
  coinGameMode: 'compose',
  coinHideFormula: false,
  optimizeReadingTarget: 15,
  optimizeMathTarget: 15,
  letterCase: 'upper',
  level5SubMode: 'shluky',
  showSyllableArcs: false,
  spellingMode: 'classic',
  reverseSpellingSpeed: 1,
  ttsEngine: 'ai',
  aiVoiceName: 'Kore',
  preferredSystemVoiceURI: '',
  displayMode: 'grid',
  gridCardCount: 8,
  showImages: true,
  showSpeechButton: true,
  spellingRepeatCount: 3,
  rewards: JSON.parse(JSON.stringify(DEFAULT_REWARDS)),
  currentItems: [],
  flashcardIndex: 0,
  history: [],
  questsDate: getTodayDateString(),
  quests: createDefaultDailyQuests(4),
  customDailyLevelChoice: 4,
  boxDate: getTodayDateString(),
  boxClaimed: false,
  lastBoxReward: 0.0,
  lastBoxRewardText: '',
  dailyChestConfig: {
    minutesChance: 40,
    minutesMin: 0.5,
    minutesMax: 1.0,
    foodChance: 20,
    foodAmount: 1,
    reviveChance: 15,
    reviveAmount: 1,
    ticketChance: 10,
    ticketAmount: 1,
    diaSmallChance: 5,
    diaSmallAmount: 2,
    diaMedChance: 0.9,
    diaMedAmount: 10,
    diaJackpotChance: 0.1,
    diaJackpotAmount: 20
  },
  legendaryChest: JSON.parse(JSON.stringify(DEFAULT_LEGENDARY_CHEST)),
  testDate: getTodayDateString(),
  testDoneToday: false,
  testLastResult: null,
  testConfig: JSON.parse(JSON.stringify(DEFAULT_TEST_CONFIG)),
  streakDays: 0,
  streakLastActiveDate: '',
  streakTodayCompleted: false,
  streakClaimedDay7: false,
  customizations: JSON.parse(JSON.stringify(DEFAULT_UNLOCKED_CUSTOMIZATIONS)),
  itemPrices: {}
};

const INITIAL_CLEAN_STATE_JSON = JSON.stringify(state);
window.state = state;

function createCleanDefaultGameState() {
  const clean = JSON.parse(INITIAL_CLEAN_STATE_JSON);
  clean.quests = createDefaultDailyQuests(4);
  clean.rewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS));
  clean.customizations = JSON.parse(JSON.stringify(DEFAULT_UNLOCKED_CUSTOMIZATIONS));
  clean.legendaryChest = JSON.parse(JSON.stringify(DEFAULT_LEGENDARY_CHEST));
  clean.testConfig = JSON.parse(JSON.stringify(DEFAULT_TEST_CONFIG));
  clean.dailyEarnedDate = getTodayDateString();
  clean.vouchersBoughtDate = getTodayDateString();
  clean.questsDate = getTodayDateString();
  clean.boxDate = getTodayDateString();
  clean.testDate = getTodayDateString();
  return clean;
}

function applyTestAccountPerks(targetState) {
  if (!targetState) return;
  if ((Number(targetState.goldDiamonds) || 0) < 5000) {
    targetState.goldDiamonds = 5000;
  }
  if (!targetState.customizations) {
    targetState.customizations = JSON.parse(JSON.stringify(DEFAULT_UNLOCKED_CUSTOMIZATIONS));
  }
  if (typeof AVATAR_SKINS_DATABASE !== 'undefined' && Array.isArray(AVATAR_SKINS_DATABASE)) {
    targetState.customizations.unlockedSkins = AVATAR_SKINS_DATABASE.map(s => s.id);
  }
  if (typeof THEME_WALLPAPERS_DATABASE !== 'undefined' && Array.isArray(THEME_WALLPAPERS_DATABASE)) {
    targetState.customizations.unlockedThemes = THEME_WALLPAPERS_DATABASE.map(t => t.id);
  }
  if (typeof CELEBRATION_SOUNDS_DATABASE !== 'undefined' && Array.isArray(CELEBRATION_SOUNDS_DATABASE)) {
    targetState.customizations.unlockedSounds = CELEBRATION_SOUNDS_DATABASE.map(snd => snd.id);
  }
}

function getMaxDailyDirectLimit() {
  return 15.0 + (state.bonusMaxLimitMinutes || 0);
}

/**
 * Progresivní zdražování dokupu +1 minuty k dennímu limitu za diamanty:
 * 1. nákup (0 bonusových min) = 20 💎
 * 2. nákup (1 bonusová min)  = 24 💎 (+4)
 * 3. nákup (2 bonusové min)  = 29 💎 (+5)
 * 4. nákup (3 bonusové min)  = 35 💎 (+6)  <-- aktuální stav Míši (má již koupeno 3×, limit 18 min)
 * 5. nákup (4 bonusové min)  = 42 💎 (+7)
 * 6. nákup (5 bonusových min) = 50 💎 (+8)
 * 7. nákup (6 bonusových min) = 59 💎 (+9)
 * 8. nákup (7 bonusových min) = 69 💎 (+10)
 * atd. (zdražování roste o +4, +5, +6, +7, +8, +9, +10...)
 */
function getLimitExtensionCost(bonusCount = (state && state.bonusMaxLimitMinutes !== undefined ? state.bonusMaxLimitMinutes : 0)) {
  const n = Math.max(0, parseInt(bonusCount, 10) || 0);
  return 20 + Math.round((n * (n + 7)) / 2);
}

let spellingState = {
  mode: 'classic',
  unseenDeck: [],
  reverseDeck: [],
  currentWordObj: null,
  letters: [],
  revealedCount: 0,
  isWordHidden: false,
  currentRepeatIndex: 0,
  totalRepeats: 3,
  // Reverzní hláskování stav
  typedLetters: [],
  activeSpeakingSlotIdx: -1,
  reverseSpeechRunId: 0,
  reverseSolved: false,
  slotStatuses: [],
  isPeekingWord: false,
  peekListenersAttached: false
};

function clearSpellingTimers() {
  spellingState.reverseSpeechRunId++;
  spellingState.activeSpeakingSlotIdx = -1;
  spellingState.isPeekingWord = false;
  if (typeof stopAllTtsPlayback === 'function') {
    stopAllTtsPlayback();
  } else if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function startReverseSpellingPeek(e) {
  if (e && e.cancelable) {
    e.preventDefault();
  }
  if (!spellingState.currentWordObj || spellingState.isPeekingWord) return;
  spellingState.isPeekingWord = true;
  playTone(620, 0.05, 'sine', 0.1);
  updateReverseSpellingPeekUI();
}

function stopReverseSpellingPeek() {
  if (!spellingState.isPeekingWord) return;
  spellingState.isPeekingWord = false;
  updateReverseSpellingPeekUI();
}

function updateReverseSpellingPeekUI() {
  const peekBtn = document.getElementById('reverse-spelling-peek-btn');
  const peekIcon = document.getElementById('reverse-spelling-peek-icon');
  const peekLabel = document.getElementById('reverse-spelling-peek-label');
  const peekPreview = document.getElementById('reverse-spelling-peek-preview');
  const hiddenPlaceholder = document.getElementById('reverse-spelling-hidden-placeholder');
  const wordObj = spellingState.currentWordObj;

  if (spellingState.isPeekingWord && wordObj) {
    if (peekBtn) {
      peekBtn.className = 'game-button bg-amber-500 text-slate-950 border-b-4 border-amber-700 ring-4 ring-amber-200 px-6 py-2.5 rounded-2xl text-sm sm:text-base font-black flex items-center gap-2 shadow-lg select-none cursor-pointer transition-all scale-105';
    }
    if (peekIcon) peekIcon.textContent = '👀';
    if (peekLabel) peekLabel.textContent = 'Držíš (pusť pro skrytí)';
    if (hiddenPlaceholder) {
      hiddenPlaceholder.classList.add('hidden');
      hiddenPlaceholder.classList.remove('flex');
    }
    if (peekPreview) {
      peekPreview.classList.remove('hidden');
      peekPreview.classList.add('flex');
      const formattedHtml = renderReadingTextHtml(wordObj.w);
      const lettersBreakdown = (spellingState.letters || parseSpellingLetters(wordObj.w))
        .map((item, idx) => state.letterCase === 'mixed' ? (idx === 0 ? item.char.toUpperCase() : item.char.toLowerCase()) : item.char.toUpperCase())
        .join(' – ');
      peekPreview.innerHTML = `
        <div class="flex items-center justify-center gap-3">
          ${state.showImages ? `<span class="text-3xl sm:text-4xl">${wordObj.e || '✨'}</span>` : ''}
          <span class="text-3xl sm:text-5xl font-black text-amber-950 game-font tracking-wide">${formattedHtml}</span>
        </div>
        <div class="text-xs sm:text-sm font-black text-amber-900 bg-white/80 px-3 py-1 rounded-xl border border-amber-300">
          Hlásky: <span class="tracking-widest">${lettersBreakdown}</span>
        </div>
      `;
    }
  } else {
    if (peekBtn) {
      peekBtn.className = 'game-button bg-amber-400 hover:bg-amber-500 text-amber-950 border-b-4 border-amber-600 px-6 py-2.5 rounded-2xl text-sm sm:text-base font-black flex items-center gap-2 shadow-md select-none cursor-pointer transition-all';
    }
    if (peekIcon) peekIcon.textContent = '👁️';
    if (peekLabel) peekLabel.textContent = 'Podrž = ukázat slovo';
    if (hiddenPlaceholder) {
      hiddenPlaceholder.classList.remove('hidden');
      hiddenPlaceholder.classList.add('flex');
    }
    if (peekPreview) {
      peekPreview.classList.add('hidden');
      peekPreview.classList.remove('flex');
      peekPreview.innerHTML = '';
    }
  }
}

function attachReverseSpellingPeekListeners() {
  const peekBtn = document.getElementById('reverse-spelling-peek-btn');
  if (!peekBtn || peekBtn.dataset.peekBound === '1') return;
  peekBtn.dataset.peekBound = '1';

  peekBtn.addEventListener('pointerdown', (e) => startReverseSpellingPeek(e));
  peekBtn.addEventListener('touchstart', (e) => startReverseSpellingPeek(e), { passive: false });
  peekBtn.addEventListener('mousedown', (e) => startReverseSpellingPeek(e));

  peekBtn.addEventListener('pointerup', () => stopReverseSpellingPeek());
  peekBtn.addEventListener('pointercancel', () => stopReverseSpellingPeek());
  peekBtn.addEventListener('pointerleave', () => stopReverseSpellingPeek());
  peekBtn.addEventListener('touchend', () => stopReverseSpellingPeek());
  peekBtn.addEventListener('touchcancel', () => stopReverseSpellingPeek());
  peekBtn.addEventListener('mouseup', () => stopReverseSpellingPeek());
  peekBtn.addEventListener('mouseleave', () => stopReverseSpellingPeek());

  if (!spellingState.peekListenersAttached) {
    spellingState.peekListenersAttached = true;
    window.addEventListener('pointerup', () => stopReverseSpellingPeek());
    window.addEventListener('pointercancel', () => stopReverseSpellingPeek());
    window.addEventListener('touchend', () => stopReverseSpellingPeek());
    window.addEventListener('touchcancel', () => stopReverseSpellingPeek());
    window.addEventListener('mouseup', () => stopReverseSpellingPeek());
    window.addEventListener('blur', () => stopReverseSpellingPeek());
  }
}

function setSpellingMode(mode) {
  const normalized = mode === 'reverse' ? 'reverse' : 'classic';
  state.spellingMode = normalized;
  spellingState.mode = normalized;
  saveState();
  playTone(540, 0.08, 'sine', 0.15);
  initSpellingWord();
}

function updateSpellingModeUI() {
  const mode = (state.spellingMode === 'reverse') ? 'reverse' : 'classic';
  spellingState.mode = mode;

  const btnClassic = document.getElementById('spelling-mode-btn-classic');
  const btnReverse = document.getElementById('spelling-mode-btn-reverse');
  const classicBox = document.getElementById('spelling-classic-container');
  const reverseBox = document.getElementById('spelling-reverse-container');
  const mainTitle = document.getElementById('spelling-main-title');
  const subInst = document.getElementById('spelling-subtitle-instructions');
  const repeatBtn = document.getElementById('spelling-repeat-btn');
  const readingReviewPanel = document.getElementById('reading-review-panel');

  const activeBtnClass = 'px-2.5 py-1 rounded-lg text-xs font-black transition-all bg-purple-600 text-white shadow-sm';
  const inactiveBtnClass = 'px-2.5 py-1 rounded-lg text-xs font-black transition-all text-purple-900 hover:bg-purple-200';

  if (btnClassic) btnClassic.className = (mode === 'classic') ? activeBtnClass : inactiveBtnClass;
  if (btnReverse) btnReverse.className = (mode === 'reverse') ? activeBtnClass : inactiveBtnClass;

  if (readingReviewPanel && state.subject === 'reading' && state.currentLevel === 8) {
    readingReviewPanel.classList.remove('hidden');
  }

  if (mode === 'reverse') {
    if (classicBox) classicBox.classList.add('hidden');
    if (reverseBox) {
      reverseBox.classList.remove('hidden');
      reverseBox.classList.add('flex');
    }
    if (repeatBtn) repeatBtn.classList.add('hidden');
    if (mainTitle) mainTitle.textContent = 'Reverzní hláskování (Skládání slova ze sluchu)';
    if (subInst) subInst.textContent = 'Podrž tlačítko, vyhláskuj slovo synovi po písmenkách a syn nahlas řekne celé slovo!';
  } else {
    if (classicBox) classicBox.classList.remove('hidden');
    if (reverseBox) {
      reverseBox.classList.add('hidden');
      reverseBox.classList.remove('flex');
    }
    if (repeatBtn) repeatBtn.classList.remove('hidden');
    if (mainTitle) mainTitle.textContent = 'Rozklad slova na hlásky';
    if (subInst) subInst.textContent = `Poslouchej ${state.spellingRepeatCount || 3}× zřetelně přečtené slovo a pak ho vyhláskuj!`;
  }
}

function parseSpellingLetters(word) {
  const upper = word.toUpperCase();
  const res = [];
  let i = 0;
  while (i < upper.length) {
    if (i < upper.length - 1 && upper.substring(i, i + 2) === 'CH') {
      res.push({ char: 'CH', isVowel: false });
      i += 2;
      continue;
    }
    const char = upper[i];
    const isVowel = NATURAL_VOWELS.includes(char);
    res.push({ char: char, isVowel: isVowel });
    i++;
  }
  return res;
}

function buildReverseSpellingWordPool() {
  const candidates = [];
  const seen = new Set();

  const addCandidate = (w, e, svg, syllables) => {
    const cleanW = (w || '').trim().toUpperCase();
    if (!cleanW || cleanW.includes(' ') || seen.has(cleanW)) return;
    seen.add(cleanW);
    candidates.push({
      w: cleanW,
      e: e || '✨',
      svg: svg || null,
      syllables: syllables || splitCzechWordIntoSyllables(cleanW).length
    });
  };

  SPELLING_WORDS_DATABASE.forEach(item => addCandidate(item.w, item.e, item.svg, item.syllables));
  if (typeof RAW_LEVEL_3_WORDS !== 'undefined') {
    RAW_LEVEL_3_WORDS.forEach(item => addCandidate(item.t, item.e, null, 1));
  }
  if (typeof RAW_LEVEL_4_WORDS !== 'undefined') {
    RAW_LEVEL_4_WORDS.forEach(item => addCandidate(item.t, item.e, null, null));
  }
  if (typeof RAW_LEVEL_5_WORDS !== 'undefined') {
    RAW_LEVEL_5_WORDS.forEach(item => addCandidate(item.t, item.e, null, null));
  }
  if (typeof RAW_LEVEL_6_WORDS !== 'undefined') {
    RAW_LEVEL_6_WORDS.forEach(item => addCandidate(item.t, item.e, null, null));
  }

  return candidates;
}

function renderSpellingImage(wordObj, containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = '';
  if (!state.showImages) {
    containerEl.classList.add('hidden');
    return;
  }
  containerEl.classList.remove('hidden');

  if (wordObj.svg) {
    containerEl.innerHTML = wordObj.svg;
  } else {
    const span = document.createElement('span');
    span.className = 'text-5xl sm:text-6xl';
    span.textContent = wordObj.e || '✨';
    containerEl.appendChild(span);
  }
}

function updateSpellingRepeatDots(current, total) {
  const container = document.getElementById('spelling-countdown-dots');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 1; i <= total; i++) {
    const dot = document.createElement('span');
    const isActive = i <= current;
    dot.className = `w-3 h-3 rounded-full transition-all ${
      isActive ? 'bg-purple-600 scale-110 shadow-sm' : 'bg-purple-200 scale-90 opacity-60'
    }`;
    container.appendChild(dot);
  }
}

function initSpellingWord() {
  clearSpellingTimers();
  updateSpellingModeUI();

  const isReverse = (state.spellingMode === 'reverse');

  if (isReverse) {
    if (!spellingState.reverseDeck || spellingState.reverseDeck.length === 0) {
      spellingState.reverseDeck = shuffleArray(buildReverseSpellingWordPool());
    }
    const wordObj = spellingState.reverseDeck.pop();
    spellingState.currentWordObj = wordObj;
    spellingState.letters = parseSpellingLetters(wordObj.w);
    spellingState.isPeekingWord = false;

    const catPill = document.getElementById('reverse-spelling-category-pill');
    if (catPill) {
      const sylCount = wordObj.syllables || splitCzechWordIntoSyllables(wordObj.w).length;
      catPill.textContent = `${sylCount} ${czechNounForm(sylCount, 'slabika', 'slabiky', 'slabik')} • ${spellingState.letters.length} písmen`;
    }

    attachReverseSpellingPeekListeners();
    updateReverseSpellingPeekUI();
    return;
  }

  if (!spellingState.unseenDeck || spellingState.unseenDeck.length === 0) {
    spellingState.unseenDeck = shuffleArray([...SPELLING_WORDS_DATABASE]);
  }

  const wordObj = spellingState.unseenDeck.pop();
  spellingState.currentWordObj = wordObj;
  spellingState.letters = parseSpellingLetters(wordObj.w);
  spellingState.revealedCount = 0;
  spellingState.isWordHidden = false;
  spellingState.totalRepeats = state.spellingRepeatCount || 3;
  spellingState.currentRepeatIndex = 0;

  document.getElementById('spelling-visible-stage').classList.remove('hidden');
  document.getElementById('spelling-hidden-stage').classList.add('hidden');
  
  const imgContainer = document.getElementById('spelling-image-container');
  renderSpellingImage(wordObj, imgContainer);

  const wordDisplay = document.getElementById('spelling-word-display');
  wordDisplay.innerHTML = renderReadingTextHtml(wordObj.w);

  const catPill = document.getElementById('spelling-category-pill');
  catPill.textContent = `${wordObj.syllables} ${czechNounForm(wordObj.syllables, 'slabika', 'slabiky', 'slabik')} • ${wordObj.w.length} písmen`;

  const subInst = document.getElementById('spelling-subtitle-instructions');
  if (subInst) subInst.textContent = `Poslouchej ${spellingState.totalRepeats}× zřetelně přečtené slovo a pak ho vyhláskuj!`;

  document.getElementById('spelling-hint-count').textContent = `0/${spellingState.letters.length}`;
  renderSpellingLettersStrip();
  runSpellingSpeechCycle();
}

function runSpellingSpeechCycle() {
  if (spellingState.isWordHidden || state.spellingMode === 'reverse') return;
  spellingState.currentRepeatIndex++;
  const cur = spellingState.currentRepeatIndex;
  const total = spellingState.totalRepeats;

  const statusLabel = document.getElementById('spelling-timer-label');
  if (statusLabel) statusLabel.textContent = `Poslech slova: ${cur} / ${total}`;

  const audioStatus = document.getElementById('spelling-audio-status');
  if (audioStatus) audioStatus.textContent = `Řečník čte slovo (${cur}. z ${total})... 🎧`;

  const progressBar = document.getElementById('spelling-progress-bar');
  if (progressBar) {
    const pct = Math.round(((total - cur + 1) / total) * 100);
    progressBar.style.width = `${pct}%`;
  }

  updateSpellingRepeatDots(cur, total);

  speakCzechWordWithCallback(spellingState.currentWordObj.w, 0.75, () => {
    if (spellingState.isWordHidden || state.spellingMode === 'reverse') return;
    if (spellingState.currentRepeatIndex < spellingState.totalRepeats) {
      setTimeout(() => { runSpellingSpeechCycle(); }, 320);
    } else {
      hideSpellingWord();
    }
  });
}

function repeatSpellingTTS() {
  if (!spellingState.currentWordObj || state.spellingMode === 'reverse') return;
  speakCzechWord(spellingState.currentWordObj.w, 0.75);
  playTone(600, 0.08, 'sine', 0.15);
}

function hideSpellingWord() {
  spellingState.isWordHidden = true;
  document.getElementById('spelling-visible-stage').classList.add('hidden');
  document.getElementById('spelling-hidden-stage').classList.remove('hidden');
  document.getElementById('spelling-timer-label').textContent = 'Slovo doznělo! Teď ho vyhláskuj!';
  
  const progressBar = document.getElementById('spelling-progress-bar');
  if (progressBar) progressBar.style.width = '0%';
  
  updateSpellingRepeatDots(spellingState.totalRepeats, spellingState.totalRepeats);
  playTone(420, 0.12, 'triangle', 0.2);
}

function renderSpellingLettersStrip() {
  const container = document.getElementById('spelling-letters-strip');
  container.innerHTML = '';

  spellingState.letters.forEach((item, idx) => {
    const isRevealed = idx < spellingState.revealedCount;
    const box = document.createElement('div');
    const dotBg = item.isVowel ? 'bg-rose-500 ring-rose-300' : 'bg-sky-500 ring-sky-300';
    const textColor = item.isVowel ? 'text-rose-600' : 'text-sky-700';
    const cardBorder = item.isVowel ? 'border-rose-300' : 'border-sky-300';

    box.className = `w-14 sm:w-16 h-20 sm:h-24 rounded-2xl border-3 flex flex-col items-center justify-between p-2 transition-all transform duration-200 ${
      isRevealed ? `bg-white ${cardBorder} shadow-md scale-100` : 'bg-purple-100/60 border-dashed border-purple-300 scale-95 opacity-75'
    }`;

    box.innerHTML = `
      <div class="w-full flex items-center justify-between px-1">
        <span class="text-[10px] font-black text-slate-400 font-mono">#${idx + 1}</span>
        <span class="w-2.5 h-2.5 rounded-full ring-2 transition-all ${isRevealed ? dotBg : 'bg-slate-300 ring-slate-200'}"></span>
      </div>
      <div class="flex-grow flex items-center justify-center">
        <span class="text-3xl sm:text-4xl font-black game-font select-none ${isRevealed ? textColor : 'text-purple-300'}">
          ${isRevealed ? (state.letterCase === 'mixed' ? (idx === 0 ? formatCase(item.char) : item.char.toLowerCase()) : formatCase(item.char)) : '?'}
        </span>
      </div>
      <div class="w-full text-center">
        <span class="text-[9px] font-extrabold ${isRevealed ? (item.isVowel ? 'text-rose-400' : 'text-sky-400') : 'text-slate-300'}">
          ${isRevealed ? '•' : 'skryto'}
        </span>
      </div>
    `;
    container.appendChild(box);
  });

  document.getElementById('spelling-hint-count').textContent = `${spellingState.revealedCount}/${spellingState.letters.length}`;
}

function revealNextSpellingLetter() {
  if (spellingState.revealedCount < spellingState.letters.length) {
    spellingState.revealedCount++;
    renderSpellingLettersStrip();
    playTone(520, 0.08, 'sine', 0.15);
  }
}

function revealAllSpellingLetters() {
  spellingState.revealedCount = spellingState.letters.length;
  renderSpellingLettersStrip();
  playTone(580, 0.1, 'sine', 0.2);
}

let cloudAutoSaveTimer = null;
let isCloudSyncInFlight = false;
let pendingCloudSync = false;
let cloudToastHideTimer = null;
let isSuppressingAutoSave = false;

function updateEnvironmentBadgeUI() {
  const badge = document.getElementById('top-env-mode-badge');
  const titleEl = document.getElementById('player-title-display');
  if (titleEl && currentLoggedInUser) {
    titleEl.textContent = currentLoggedInUser.displayName || `ŠKOLÁK ${currentLoggedInUser.username.toUpperCase()}`;
  }
  if (!badge) return;

  if (!currentLoggedInUser) {
    badge.textContent = '🔒 NEPŘIHLÁŠEN';
    badge.className = 'cursor-pointer hover:brightness-95 active:scale-95 transition-all text-[11px] font-black uppercase tracking-wider px-2.5 h-[32px] rounded-xl border whitespace-nowrap flex items-center justify-center bg-slate-200 text-slate-700 border-slate-300';
    return;
  }

  if (currentLoggedInUser.isTestAccount) {
    badge.textContent = `🧪 ${currentLoggedInUser.username.toUpperCase()}`;
    badge.className = 'cursor-pointer hover:brightness-95 active:scale-95 transition-all text-[11px] font-black uppercase tracking-wider px-2.5 h-[32px] rounded-xl border whitespace-nowrap flex items-center justify-center bg-amber-100 text-amber-900 border-amber-300';
    badge.title = 'Testovací účet (5 000 💎, vše odemčeno) – ukládá se do vlastního profilu "test" v GitHub Gistu, Míšův účet "misa" je 100% oddělen a chráněn.';
  } else {
    badge.textContent = `🟢 ${currentLoggedInUser.username.toUpperCase()}`;
    badge.className = 'cursor-pointer hover:brightness-95 active:scale-95 transition-all text-[11px] font-black uppercase tracking-wider px-2.5 h-[32px] rounded-xl border whitespace-nowrap flex items-center justify-center bg-emerald-100 text-emerald-900 border-emerald-400';
    badge.title = `Hráčský účet "${currentLoggedInUser.username}" – automatické ukládání do localStorage i cloudu (GitHub Gist).`;
  }
}

function snapViewportToTop() {
  try {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  } catch (e) {}
}

function resetIPadViewportScroll() {
  try {
    if (document.activeElement && typeof document.activeElement.blur === 'function' && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    snapViewportToTop();
    setTimeout(snapViewportToTop, 80);
    setTimeout(snapViewportToTop, 220);
    setTimeout(snapViewportToTop, 420);
  } catch (e) {}
}

if (typeof window !== 'undefined' && window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const overlay = document.getElementById('auth-login-overlay');
    if (overlay && overlay.classList.contains('hidden')) {
      snapViewportToTop();
    }
  });
}

function showCloudSaveToast(message, icon = '💾', borderClass = 'border-emerald-400') {
  const toast = document.getElementById('cloud-save-toast');
  const card = document.getElementById('cloud-save-toast-card');
  const iconEl = document.getElementById('cloud-save-toast-icon');
  const textEl = document.getElementById('cloud-save-toast-text');
  if (!toast || !textEl) return;

  if (iconEl) iconEl.textContent = icon;
  textEl.textContent = message;
  if (card) {
    card.className = `center-popup-enter bg-gradient-to-b from-white via-emerald-50 to-teal-50 text-slate-800 border-4 ${borderClass} px-6 py-4 rounded-3xl shadow-2xl flex flex-col items-center text-center gap-1.5 max-w-xs w-full`;
  }
  toast.className = 'fixed inset-0 z-[85] pointer-events-none flex items-center justify-center p-4 bg-slate-950/25 backdrop-blur-[1px]';

  if (cloudToastHideTimer) clearTimeout(cloudToastHideTimer);
  cloudToastHideTimer = setTimeout(() => {
    if (card) card.classList.add('center-popup-exit');
    setTimeout(() => {
      toast.className = 'hidden fixed inset-0 z-[85] pointer-events-none items-center justify-center p-4';
    }, 200);
  }, 1900);
}

function isValidGameStateObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  return (
    typeof obj.minutesBalance === 'number' ||
    typeof obj.goldDiamonds === 'number' ||
    Array.isArray(obj.history) ||
    Array.isArray(obj.activeLetters) ||
    typeof obj.appVersion === 'string'
  );
}

function computeStateProgressScore(s) {
  if (!isValidGameStateObject(s)) return -1;
  let score = 0;
  score += (Array.isArray(s.history) ? s.history.length : 0) * 10;
  score += (Array.isArray(s.traceabilityHistory) ? s.traceabilityHistory.length : 0) * 25;
  score += Math.round((Number(s.minutesBalance) || 0) * 4);
  score += Math.round((Number(s.vaultBalance) || 0) * 4);
  score += Math.min(Number(s.goldDiamonds) || 0, 500) * 2;
  score += (Number(s.streakDays) || 0) * 15;
  score += (Number(s.bonusMaxLimitMinutes) || 0) * 25;
  score += Math.round((Number(s.dailyEarnedToday) || 0) * 5);
  if (s.petSystem && typeof s.petSystem === 'object') {
    score += (Number(s.petSystem.highestStage) || 0) * 20;
  }
  if (s.petState && Array.isArray(s.petState.ownedPets)) {
    score += s.petState.ownedPets.length * 20;
  }
  if (s.customizations && typeof s.customizations === 'object') {
    Object.values(s.customizations).forEach(arr => {
      if (Array.isArray(arr)) score += arr.length * 5;
    });
  }
  return score;
}

function isPollutedTestStateForRealAccount(s) {
  if (!s || typeof s !== 'object') return false;
  return (Number(s.goldDiamonds) || 0) > 2000;
}

function mergeLocalAndCloudStates(localObj, cloudObj, preferCloud = false) {
  if (!isValidGameStateObject(cloudObj)) return localObj;
  if (!isValidGameStateObject(localObj)) return JSON.parse(JSON.stringify(cloudObj));

  // Pokud lokální paměť (např. na PC z dřívějšího testování v AI Studiu) obsahuje testovací miliony diamantů (> 2000),
  // zatímco v cloudu jsou reálná data z iPadu, vždy použijeme čistý stav z cloudu!
  if (isPollutedTestStateForRealAccount(localObj) && !isPollutedTestStateForRealAccount(cloudObj)) {
    return JSON.parse(JSON.stringify(cloudObj));
  }

  const localScore = computeStateProgressScore(localObj);
  const cloudScore = computeStateProgressScore(cloudObj);
  const localTime = Number(localObj.lastSavedAt) || 0;
  const cloudTime = Number(cloudObj.lastSavedAt) || 0;

  if (localScore <= 30 && cloudScore > localScore) {
    return JSON.parse(JSON.stringify(cloudObj));
  }
  if (!preferCloud && cloudScore <= 30 && localScore > cloudScore) {
    return JSON.parse(JSON.stringify(localObj));
  }

  // Při přihlášení nebo startu aplikace (preferCloud = true) je primární vždy cloud (data uložená z tabletu přes disketu)
  let primary = cloudObj;
  let secondary = localObj;
  if (!preferCloud && localTime > cloudTime && cloudTime > 0) {
    primary = localObj;
    secondary = cloudObj;
  }

  const merged = JSON.parse(JSON.stringify(primary));

  if (Array.isArray(primary.history) || Array.isArray(secondary.history)) {
    const map = new Map();
    (secondary.history || []).forEach(item => {
      if (item && item.id !== undefined) map.set(String(item.id), item);
    });
    (primary.history || []).forEach(item => {
      if (item && item.id !== undefined) map.set(String(item.id), item);
    });
    merged.history = Array.from(map.values()).sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0)).slice(0, 150);
  }

  if (Array.isArray(primary.traceabilityHistory) || Array.isArray(secondary.traceabilityHistory)) {
    const tMap = new Map();
    (secondary.traceabilityHistory || []).forEach(day => {
      const dKey = day ? (day.dateIso || day.date) : null;
      if (dKey) tMap.set(dKey, day);
    });
    (primary.traceabilityHistory || []).forEach(day => {
      const dKey = day ? (day.dateIso || day.date) : null;
      if (dKey) {
        const existing = tMap.get(dKey);
        const pSec = (day.totalDurationSec !== undefined ? day.totalDurationSec : (day.totalSeconds || 0));
        const eSec = existing ? (existing.totalDurationSec !== undefined ? existing.totalDurationSec : (existing.totalSeconds || 0)) : -1;
        if (!existing || pSec >= eSec) {
          tMap.set(dKey, day);
        }
      }
    });
    merged.traceabilityHistory = Array.from(tMap.values()).sort((a, b) => {
      const da = a.dateIso || a.date || '';
      const db = b.dateIso || b.date || '';
      return db.localeCompare(da);
    });
  }

  if (primary.customizations && secondary.customizations) {
    merged.customizations = { ...secondary.customizations, ...primary.customizations };
    ['unlockedSkins', 'unlockedThemes', 'unlockedSounds', 'avatars', 'frames', 'themes', 'titles'].forEach(cat => {
      const a = Array.isArray(primary.customizations[cat]) ? primary.customizations[cat] : [];
      const b = Array.isArray(secondary.customizations[cat]) ? secondary.customizations[cat] : [];
      if (a.length || b.length) {
        merged.customizations[cat] = Array.from(new Set([...a, ...b]));
      }
    });
  }

  if (primary.petState && secondary.petState) {
    const pOwned = Array.isArray(primary.petState.ownedPets) ? primary.petState.ownedPets : [];
    const sOwned = Array.isArray(secondary.petState.ownedPets) ? secondary.petState.ownedPets : [];
    merged.petState.ownedPets = Array.from(new Set([...pOwned, ...sOwned]));
  }

  merged.lastSavedAt = preferCloud ? (cloudTime || Date.now()) : Math.max(localTime, cloudTime, Date.now());
  return merged;
}

function saveStateToLocalStorageOnly(preserveTimestamp = false) {
  if (!currentLoggedInUser) return;
  try {
    state.appVersion = APP_VERSION;
    if (!preserveTimestamp || !state.lastSavedAt) {
      state.lastSavedAt = Date.now();
    }
    const serialized = JSON.stringify(state);
    const userKey = `${USER_STORAGE_PREFIX}${currentLoggedInUser.username}`;
    localStorage.setItem(userKey, serialized);
    // U účtu 'misa' zároveň udržujeme i původní klíč STORAGE_KEY ('ctenarska_mise_v20_modular') pro 100% zpětnou kompatibilitu
    if (currentLoggedInUser.username === 'misa') {
      localStorage.setItem(STORAGE_KEY, serialized);
    }
  } catch (e) {
    console.error('Chyba při lokálním ukládání stavu:', e);
  }
}

function normalizeCloudEnvelope(rawRecord) {
  const envelope = {
    updatedAt: Date.now(),
    users: {},
    accounts: {}
  };

  if (!rawRecord || typeof rawRecord !== 'object') {
    return envelope;
  }

  const rawUsersMap = (rawRecord.users && typeof rawRecord.users === 'object' && !Array.isArray(rawRecord.users))
    ? rawRecord.users
    : (rawRecord.accounts && typeof rawRecord.accounts === 'object' && !Array.isArray(rawRecord.accounts))
      ? rawRecord.accounts
      : null;

  if (rawUsersMap) {
    Object.entries(rawUsersMap).forEach(([rawKey, acc]) => {
      const uname = normalizeAccountUsername(rawKey || (acc && acc.username) || '');
      if (!uname || !acc || typeof acc !== 'object') return;

      const builtin = BUILTIN_ACCOUNTS[uname] || null;
      const password = acc.password || (builtin ? builtin.password : '');
      const displayName = acc.displayName || (builtin ? builtin.displayName : `ŠKOLÁK ${uname.toUpperCase()}`);
      const envTime = Number(acc.updatedAt) || Number(rawRecord.updatedAt) || 0;

      let progressObj = null;
      if (acc.progress && typeof acc.progress === 'object' && !Array.isArray(acc.progress)) {
        progressObj = acc.progress;
      } else if (acc.state && typeof acc.state === 'object' && !Array.isArray(acc.state)) {
        progressObj = acc.state;
      }

      // Pokud má účet 'test' v Gistu jen výchozí zkrácený zápis { gems: 5000, unlockedEverything: true }, převedeme ho na plný herní stav
      if (uname === 'test' && progressObj && !isValidGameStateObject(progressObj)) {
        if (typeof progressObj.gems === 'number' || progressObj.unlockedEverything) {
          const fullTest = createCleanDefaultGameState();
          applyTestAccountPerks(fullTest);
          if (typeof progressObj.gems === 'number') {
            fullTest.goldDiamonds = progressObj.gems;
          }
          progressObj = fullTest;
        }
      }

      const validState = isValidGameStateObject(progressObj) ? progressObj : null;
      if (validState && envTime > (Number(validState.lastSavedAt) || 0)) {
        validState.lastSavedAt = envTime;
      }

      const normalizedEntry = {
        username: uname,
        password,
        displayName,
        updatedAt: envTime || (validState ? Number(validState.lastSavedAt) || 0 : 0),
        progress: validState || (progressObj || {}),
        state: validState
      };

      envelope.users[uname] = normalizedEntry;
      envelope.accounts[uname] = normalizedEntry;

      saveLocalAccountToRegistry({
        username: uname,
        password,
        displayName,
        cloudEnabled: true,
        isTestAccount: uname === 'test'
      });
    });
    return envelope;
  }

  // Zpětná kompatibilita: pokud je v cloudu uložen přímo Míšův herní stav z předchozí verze, přiřadíme ho účtu 'misa'
  if (isValidGameStateObject(rawRecord)) {
    const ts = Number(rawRecord.lastSavedAt) || Date.now();
    rawRecord.lastSavedAt = ts;
    const misaEntry = {
      username: 'misa',
      password: BUILTIN_ACCOUNTS.misa.password,
      displayName: BUILTIN_ACCOUNTS.misa.displayName,
      updatedAt: ts,
      progress: rawRecord,
      state: rawRecord
    };
    envelope.users.misa = misaEntry;
    envelope.accounts.misa = misaEntry;
  }

  return envelope;
}

async function fetchCloudEnvelopeFromGist() {
  const cacheBustUrl = `${GIST_API_URL}?t=${Date.now()}`;
  const response = await fetch(cacheBustUrl, {
    method: 'GET',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'vnd.github.v3+json'
    },
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error(`GitHub Gist GET HTTP ${response.status}`);
  }
  const gistData = await response.json();
  const files = (gistData && gistData.files && typeof gistData.files === 'object') ? gistData.files : {};
  const fileNames = Object.keys(files);
  const targetFileName = files['gistfile1.txt'] ? 'gistfile1.txt' : (fileNames[0] || 'gistfile1.txt');
  cachedGistFilename = targetFileName;

  const fileObj = files[targetFileName];
  let parsedContent = { users: {} };
  if (fileObj && typeof fileObj.content === 'string' && fileObj.content.trim()) {
    try {
      parsedContent = JSON.parse(fileObj.content);
    } catch (parseErr) {
      console.warn('Chyba při parsování JSON obsahu z GitHub Gistu:', parseErr);
    }
  }

  cachedCloudEnvelope = normalizeCloudEnvelope(parsedContent);
  return cachedCloudEnvelope;
}

// Zachováme alias pro všechna místa v kódu
const fetchCloudEnvelopeFromJsonBin = fetchCloudEnvelopeFromGist;

function buildGistUsersPayloadFromEnvelope(envelope) {
  const usersOut = {};
  const sourceMap = (envelope && envelope.users) ? envelope.users : (envelope && envelope.accounts ? envelope.accounts : {});
  Object.entries(sourceMap).forEach(([uname, entry]) => {
    if (!entry || typeof entry !== 'object') return;
    const progressData = isValidGameStateObject(entry.state)
      ? entry.state
      : (entry.progress && typeof entry.progress === 'object' ? entry.progress : {});
    usersOut[uname] = {
      username: uname,
      password: entry.password || (BUILTIN_ACCOUNTS[uname] ? BUILTIN_ACCOUNTS[uname].password : ''),
      displayName: entry.displayName || (BUILTIN_ACCOUNTS[uname] ? BUILTIN_ACCOUNTS[uname].displayName : `ŠKOLÁK ${uname.toUpperCase()}`),
      updatedAt: Number(entry.updatedAt) || Date.now(),
      progress: progressData
    };
  });
  return {
    updatedAt: Date.now(),
    users: usersOut
  };
}

async function pushStateToGist(isManual = false) {
  if (!currentLoggedInUser) return false;

  if (!currentLoggedInUser.cloudEnabled) {
    if (isManual) {
      showCloudSaveToast(`Uloženo lokálně! (Účet "${currentLoggedInUser.username}")`, '💾', 'border-amber-400');
    }
    return false;
  }

  if (!navigator.onLine) {
    pendingCloudSync = true;
    if (isManual) {
      showCloudSaveToast('Uloženo v zařízení (offline – do GitHub Gistu se nahraje po připojení)', '📦', 'border-amber-400');
    }
    return false;
  }

  if (isCloudSyncInFlight) {
    pendingCloudSync = true;
    return false;
  }

  isCloudSyncInFlight = true;
  const saveIcon = document.getElementById('top-cloud-save-icon');
  if (saveIcon && isManual) saveIcon.classList.add('animate-bounce');

  try {
    // Nejprve stáhneme aktuální stav Gistu, abychom vždy aktualizovali jen aktivní účet v objektu "users" a nikdy nepřepsali ostatní účty (např. "misa")
    try {
      await fetchCloudEnvelopeFromGist();
    } catch (fetchErr) {
      if (!cachedCloudEnvelope) {
        cachedCloudEnvelope = { updatedAt: Date.now(), users: {}, accounts: {} };
      }
    }

    const uname = currentLoggedInUser.username;
    const reg = getLocalAccountsRegistry();
    const accMeta = reg[uname] || currentLoggedInUser;
    const nowTs = Date.now();
    state.lastSavedAt = nowTs;
    const stateClone = JSON.parse(JSON.stringify(state));

    const updatedUserEntry = {
      username: uname,
      password: accMeta.password || (BUILTIN_ACCOUNTS[uname] ? BUILTIN_ACCOUNTS[uname].password : ''),
      displayName: accMeta.displayName || `ŠKOLÁK ${uname.toUpperCase()}`,
      updatedAt: nowTs,
      progress: stateClone,
      state: stateClone
    };

    if (!cachedCloudEnvelope.users) cachedCloudEnvelope.users = {};
    if (!cachedCloudEnvelope.accounts) cachedCloudEnvelope.accounts = {};
    cachedCloudEnvelope.updatedAt = nowTs;
    cachedCloudEnvelope.users[uname] = updatedUserEntry;
    cachedCloudEnvelope.accounts[uname] = updatedUserEntry;

    const gistPayload = buildGistUsersPayloadFromEnvelope(cachedCloudEnvelope);
    const targetFile = cachedGistFilename || 'gistfile1.txt';

    const response = await fetch(GIST_API_URL, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          [targetFile]: {
            content: JSON.stringify(gistPayload, null, 2)
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub Gist PATCH HTTP ${response.status}`);
    }

    pendingCloudSync = false;
    if (isManual) {
      showCloudSaveToast(`Progres účtu "${uname}" uložen do cloudu!`, '💾', 'border-emerald-400');
    }
    return true;
  } catch (err) {
    console.warn('Uložení na GitHub Gist se nezdařilo (data jsou v bezpečí v localStorage):', err);
    pendingCloudSync = true;
    if (isManual) {
      showCloudSaveToast('Uloženo v zařízení (GitHub Gist momentálně nedostupný)', '⚠️', 'border-amber-400');
    }
    return false;
  } finally {
    isCloudSyncInFlight = false;
    if (saveIcon) saveIcon.classList.remove('animate-bounce');
    if (pendingCloudSync && navigator.onLine && currentLoggedInUser && currentLoggedInUser.cloudEnabled) {
      pendingCloudSync = false;
      scheduleAutoCloudSave();
    }
  }
}

const pushStateToJsonBin = pushStateToGist;

function scheduleAutoCloudSave() {
  if (!currentLoggedInUser || !currentLoggedInUser.cloudEnabled) {
    return;
  }
  if (!navigator.onLine) {
    pendingCloudSync = true;
    return;
  }
  if (cloudAutoSaveTimer) clearTimeout(cloudAutoSaveTimer);
  cloudAutoSaveTimer = setTimeout(() => {
    pushStateToGist(false);
  }, 1500);
}

function saveState() {
  if (!currentLoggedInUser) return;
  if (isSuppressingAutoSave) return;
  saveStateToLocalStorageOnly(false);
  scheduleAutoCloudSave();
}

async function manualSaveProgress() {
  if (typeof playTone === 'function') playTone(660, 0.08, 'sine', 0.15);
  if (!currentLoggedInUser) return;
  if (cloudAutoSaveTimer) {
    clearTimeout(cloudAutoSaveTimer);
    cloudAutoSaveTimer = null;
  }
  saveStateToLocalStorageOnly();
  await pushStateToGist(true);
}

function applyParsedStateToRuntime(parsed) {
  if (!parsed || typeof parsed !== 'object') return;
  const defaultQuests = createDefaultDailyQuests();

  if (parsed.quests && Array.isArray(parsed.quests)) {
    const oldR = parsed.quests.find(q => q.id === 'q_reading_all');
    const oldM = parsed.quests.find(q => q.id === 'q_math_all');
    parsed.quests = defaultQuests.map(dq => {
      const saved = parsed.quests.find(q => q.id === dq.id);
      if (saved) {
        return {
          ...dq,
          ...saved,
          title: dq.title,
          desc: dq.desc,
          icon: dq.icon,
          isTrackerOnly: dq.isTrackerOnly,
          target: dq.target,
          matches: dq.matches
        };
      }
      if (dq.id === 'q_daily_all' && (oldR || oldM)) {
        const combinedProg = Math.min(dq.target, (oldR ? oldR.progress || 0 : 0) + (oldM ? oldM.progress || 0 : 0));
        const wasClaimed = Boolean((oldR && oldR.claimed) || (oldM && oldM.claimed));
        return {
          ...dq,
          progress: combinedProg,
          claimed: wasClaimed
        };
      }
      return dq;
    });
  }
  state = { ...state, ...parsed };
  const sumSubjEarned = Math.round(((state.dailyReadingEarnedToday || 0) + (state.dailyMathEarnedToday || 0)) * 100) / 100;
  if (sumSubjEarned > (state.dailyEarnedToday || 0)) {
    state.dailyEarnedToday = sumSubjEarned;
  }
  if (!state.rewards) {
    state.rewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS));
  } else {
    if (state.rewards.questRate === undefined || state.rewards.questRate === 1) {
      state.rewards.questRate = 3.0;
    }
    if (state.rewards.readingQuestRate === undefined) {
      state.rewards.readingQuestRate = state.rewards.questRate || 3.0;
    }
    if (state.rewards.mathQuestRate === undefined) {
      state.rewards.mathQuestRate = state.rewards.questRate || 3.0;
    }
  }
  window.state = state;

  if (!state.customizations) {
    state.customizations = JSON.parse(JSON.stringify(DEFAULT_UNLOCKED_CUSTOMIZATIONS));
  }
  if (!state.itemPrices) {
    state.itemPrices = {};
  }
  if (!state.dailyChestConfig) {
    state.dailyChestConfig = {
      minutesChance: 40,
      minutesMin: 0.5,
      minutesMax: 1.0,
      foodChance: 20,
      foodAmount: 1,
      reviveChance: 15,
      reviveAmount: 1,
      ticketChance: 10,
      ticketAmount: 1,
      diaSmallChance: 5,
      diaSmallAmount: 2,
      diaMedChance: 0.9,
      diaMedAmount: 10,
      diaJackpotChance: 0.1,
      diaJackpotAmount: 20
    };
  } else {
    if (state.dailyChestConfig.ticketChance === undefined) state.dailyChestConfig.ticketChance = 10;
    if (state.dailyChestConfig.ticketAmount === undefined) state.dailyChestConfig.ticketAmount = 1;
  }

  if (currentLoggedInUser && currentLoggedInUser.isTestAccount) {
    applyTestAccountPerks(state);
  }
}

function readLocalParsedStateForUser(username) {
  try {
    const uname = normalizeAccountUsername(username);
    if (!uname) return null;

    const userRaw = localStorage.getItem(`${USER_STORAGE_PREFIX}${uname}`);
    let userParsed = userRaw ? JSON.parse(userRaw) : null;

    // KLÍČOVÁ MIGRACE PRO MÍŠŮV ÚČET ('misa'):
    // Přečte stávající data z původního klíče STORAGE_KEY ('ctenarska_mise_v20_modular') a sloučí je s účtem 'misa',
    // ale ignoruje případná stará testovací data z PC prohlížeče (např. s > 2000 testovacími diamanty).
    if (uname === 'misa') {
      const legacyRaw = localStorage.getItem(STORAGE_KEY);
      let legacyParsed = legacyRaw ? JSON.parse(legacyRaw) : null;

      if (isPollutedTestStateForRealAccount(userParsed)) userParsed = null;
      if (isPollutedTestStateForRealAccount(legacyParsed)) legacyParsed = null;

      if (userParsed && legacyParsed) {
        return mergeLocalAndCloudStates(legacyParsed, userParsed);
      }
      return userParsed || legacyParsed || null;
    }

    return userParsed;
  } catch (e) {
    console.error('Chyba při čtení lokálního stavu účtu:', e);
    return null;
  }
}

function loadState() {
  const prevSuppress = isSuppressingAutoSave;
  isSuppressingAutoSave = true;
  try {
    state = createCleanDefaultGameState();
    window.state = state;

    if (currentLoggedInUser) {
      try {
        const parsed = readLocalParsedStateForUser(currentLoggedInUser.username);
        if (parsed) {
          applyParsedStateToRuntime(parsed);
        } else if (currentLoggedInUser.isTestAccount) {
          applyTestAccountPerks(state);
        }
      } catch (e) {
        console.error('Chyba při načítání stavu:', e);
      }
    }

    checkAndHandleDailyResets();
    applyCurrentTheme();
    updateTopAvatarDisplay();
    if (typeof ensurePetStateInitialized === 'function') ensurePetStateInitialized();
    if (typeof updateTopPetCompanionWidget === 'function') updateTopPetCompanionWidget();
  } finally {
    isSuppressingAutoSave = prevSuppress;
  }
}

function refreshAllUIAfterCloudSync() {
  const prevSuppress = isSuppressingAutoSave;
  isSuppressingAutoSave = true;
  try {
    checkAndHandleDailyResets();
    applyCurrentTheme();
    updateEnvironmentBadgeUI();
    updateTopAvatarDisplay();
    if (typeof ensurePetStateInitialized === 'function') ensurePetStateInitialized();
    if (typeof updateTopPetCompanionWidget === 'function') updateTopPetCompanionWidget();
    updateStopwatchUI();
    updateBalanceUI();
    updateTopBadges();
    updateDiamondMarketUI();
    renderStoreSkinsUI();
    if (typeof renderStorePetsUI === 'function') renderStorePetsUI();
    updateImageToggleUI();
    updateSpeechToggleUI();
    updateSyllableArcsToggleUI();
    setLetterCase(state.letterCase || 'upper');
    setSubject(state.subject || 'reading');
    setGridCount(state.gridCardCount || 8);
  } finally {
    isSuppressingAutoSave = prevSuppress;
  }
}

async function syncWithCloudOnStartup(forceCloudPriority = false) {
  updateEnvironmentBadgeUI();

  if (!currentLoggedInUser || !currentLoggedInUser.cloudEnabled) {
    return;
  }

  if (!navigator.onLine) {
    return;
  }

  const uname = currentLoggedInUser.username;
  const localParsed = readLocalParsedStateForUser(uname);

  try {
    const envelope = await fetchCloudEnvelopeFromGist();
    const usersMap = envelope.users || envelope.accounts || {};
    const cloudAccountEntry = usersMap[uname] || null;
    const cloudRecord = cloudAccountEntry && isValidGameStateObject(cloudAccountEntry.state)
      ? cloudAccountEntry.state
      : (cloudAccountEntry && isValidGameStateObject(cloudAccountEntry.progress) ? cloudAccountEntry.progress : null);

    if (isValidGameStateObject(cloudRecord)) {
      const cloudTime = Math.max(Number(cloudAccountEntry.updatedAt) || 0, Number(cloudRecord.lastSavedAt) || 0);
      cloudRecord.lastSavedAt = cloudTime;
      const localTime = localParsed ? (Number(localParsed.lastSavedAt) || 0) : 0;

      // Pokud nejde o čekající offline uložení (pendingCloudSync), má při startu a přihlášení vždy přednost stav z Gistu
      const preferCloud = forceCloudPriority || !pendingCloudSync;

      const merged = currentLoggedInUser.isTestAccount
        ? (!preferCloud && localTime > cloudTime && localParsed ? localParsed : cloudRecord)
        : mergeLocalAndCloudStates(localParsed, cloudRecord, preferCloud);

      if (cloudAutoSaveTimer) {
        clearTimeout(cloudAutoSaveTimer);
        cloudAutoSaveTimer = null;
      }

      applyParsedStateToRuntime(merged);
      saveStateToLocalStorageOnly(true);
      refreshAllUIAfterCloudSync();

      // Do Gistu při startu nahráváme pouze tehdy, pokud zařízení hrálo offline a čekalo na synchronizaci
      if (!preferCloud && pendingCloudSync && localTime > cloudTime && cloudTime > 0 && (currentLoggedInUser.isTestAccount || !isPollutedTestStateForRealAccount(localParsed))) {
        await pushStateToGist(false);
      }
    } else if (isValidGameStateObject(localParsed) && (currentLoggedInUser.isTestAccount || !isPollutedTestStateForRealAccount(localParsed))) {
      // V Gistu ještě tento účet nemá nahraný plný herní stav -> uložíme ho do Gistu!
      saveStateToLocalStorageOnly(true);
      await pushStateToGist(false);
    }
  } catch (err) {
    console.warn('Synchronizace účtu s GitHub Gistem selhala, pokračujeme z localStorage:', err);
  }
}

window.addEventListener('online', () => {
  if (currentLoggedInUser && currentLoggedInUser.cloudEnabled && pendingCloudSync) {
    pushStateToGist(false);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && currentLoggedInUser && currentLoggedInUser.cloudEnabled && navigator.onLine && !pendingCloudSync && !isCloudSyncInFlight) {
    syncWithCloudOnStartup(true);
  }
});

/* ============================================================
   PŘIHLAŠOVACÍ OBRAZOVKA (LOG IN & REGISTRACE VÍCE ÚČTŮ)
   ============================================================ */

function switchAuthOverlayTab(tab) {
  const loginPanel = document.getElementById('auth-panel-login');
  const regPanel = document.getElementById('auth-panel-register');
  const loginBtn = document.getElementById('auth-tab-login-btn');
  const regBtn = document.getElementById('auth-tab-register-btn');
  const loginErr = document.getElementById('auth-login-error');
  const regErr = document.getElementById('auth-reg-error');

  if (loginErr) loginErr.classList.add('hidden');
  if (regErr) regErr.classList.add('hidden');

  if (tab === 'register') {
    if (loginPanel) loginPanel.classList.add('hidden');
    if (regPanel) regPanel.classList.remove('hidden');
    if (regBtn) regBtn.className = 'py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition-all bg-indigo-600 text-white shadow-sm flex items-center justify-center gap-1.5';
    if (loginBtn) loginBtn.className = 'py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition-all text-slate-600 hover:bg-white flex items-center justify-center gap-1.5';
  } else {
    if (regPanel) regPanel.classList.add('hidden');
    if (loginPanel) loginPanel.classList.remove('hidden');
    if (loginBtn) loginBtn.className = 'py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition-all bg-sky-500 text-white shadow-sm flex items-center justify-center gap-1.5';
    if (regBtn) regBtn.className = 'py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition-all text-slate-600 hover:bg-white flex items-center justify-center gap-1.5';
  }
}

function toggleAuthPasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

function showAuthError(elementId, msg) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  if (typeof soundError === 'function') soundError();
}

async function activateUserAccountSession(accountObj, rememberOnDevice = false, isNewRegistration = false) {
  currentLoggedInUser = {
    username: accountObj.username,
    password: accountObj.password || '',
    displayName: accountObj.displayName || (accountObj.username === 'misa' ? 'ŠKOLÁK MÍŠA' : accountObj.username === 'test' ? 'ŠKOLÁK TEST' : `ŠKOLÁK ${accountObj.username.toUpperCase()}`),
    cloudEnabled: accountObj.cloudEnabled !== false,
    isTestAccount: Boolean(accountObj.isTestAccount || accountObj.username === 'test')
  };

  saveLocalAccountToRegistry(currentLoggedInUser);

  try {
    sessionStorage.setItem(SESSION_USER_KEY, currentLoggedInUser.username);
    if (rememberOnDevice) {
      localStorage.setItem(REMEMBERED_USER_KEY, currentLoggedInUser.username);
    } else {
      localStorage.removeItem(REMEMBERED_USER_KEY);
    }
  } catch (e) {}

  const overlay = document.getElementById('auth-login-overlay');
  if (overlay) overlay.classList.add('hidden');
  resetIPadViewportScroll();
  setTimeout(resetIPadViewportScroll, 80);
  setTimeout(resetIPadViewportScroll, 280);

  if (cloudAutoSaveTimer) {
    clearTimeout(cloudAutoSaveTimer);
    cloudAutoSaveTimer = null;
  }

  if (isNewRegistration) {
    state = createCleanDefaultGameState();
    window.state = state;
    if (currentLoggedInUser.isTestAccount) {
      applyTestAccountPerks(state);
    }
    saveStateToLocalStorageOnly(false);
    refreshAllUIAfterCloudSync();
    if (currentLoggedInUser.cloudEnabled) {
      await pushStateToGist(false);
    }
    showCloudSaveToast(`Vítej! Nový účet "${currentLoggedInUser.username}" byl vytvořen!`, '✨', 'border-indigo-400');
  } else {
    loadState();
    refreshAllUIAfterCloudSync();
    await syncWithCloudOnStartup(true);
    saveStateToLocalStorageOnly(true);
    if (currentLoggedInUser.isTestAccount) {
      showCloudSaveToast('Přihlášen testovací účet "test" (5 000 💎, vše odemčeno, vlastní profil v Gistu)', '🧪', 'border-amber-400');
    } else {
      showCloudSaveToast(`Vítej zpět, ${currentLoggedInUser.displayName}! Data načtena z cloudu.`, '🎒', 'border-emerald-400');
    }
  }
}

async function submitAccountLogin() {
  const userInp = document.getElementById('auth-login-username');
  const passInp = document.getElementById('auth-login-password');
  const remInp = document.getElementById('auth-remember-me');
  const submitBtn = document.getElementById('auth-login-submit-btn');

  const uname = normalizeAccountUsername(userInp ? userInp.value : '');
  const pass = (passInp ? passInp.value : '').trim();
  const remember = Boolean(remInp && remInp.checked);

  if (!uname) {
    showAuthError('auth-login-error', '⚠️ Zadej prosím přihlašovací jméno!');
    return;
  }
  if (!pass) {
    showAuthError('auth-login-error', '⚠️ Zadej prosím heslo!');
    return;
  }

  let matchedAccount = null;

  // 1. Při přihlášení vždy nejprve stáhneme čerstvý JSON z GitHub Gistu (pokud je zařízení online) a ověříme přihlašovací údaje
  if (navigator.onLine) {
    if (submitBtn) submitBtn.disabled = true;
    try {
      const env = await fetchCloudEnvelopeFromGist();
      const usersMap = (env && env.users) ? env.users : (env && env.accounts ? env.accounts : {});
      if (usersMap[uname]) {
        const cloudAcc = usersMap[uname];
        matchedAccount = {
          username: uname,
          password: cloudAcc.password || (BUILTIN_ACCOUNTS[uname] ? BUILTIN_ACCOUNTS[uname].password : ''),
          displayName: cloudAcc.displayName || (BUILTIN_ACCOUNTS[uname] ? BUILTIN_ACCOUNTS[uname].displayName : `ŠKOLÁK ${uname.toUpperCase()}`),
          cloudEnabled: true,
          isTestAccount: uname === 'test'
        };
      }
    } catch (e) {
      console.warn('Nelze ověřit účet v GitHub Gistu, použiji lokální registr:', e);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  // 2. Fallback na lokální registr účtů (pro offline režim nebo výchozí účty)
  if (!matchedAccount) {
    const localReg = getLocalAccountsRegistry();
    matchedAccount = localReg[uname] || null;
  }

  if (!matchedAccount) {
    showAuthError('auth-login-error', `❌ Účet "${uname}" nebyl nalezen. Můžeš si ho založit v záložce "Vytvořit účet"!`);
    return;
  }

  if (matchedAccount.password.toLowerCase() !== pass.toLowerCase()) {
    showAuthError('auth-login-error', '❌ Nesprávné heslo! Zkus to prosím znovu.');
    return;
  }

  if (typeof playTone === 'function') playTone(620, 0.1, 'sine', 0.18);
  await activateUserAccountSession(matchedAccount, remember, false);
}

async function submitAccountRegister() {
  const userInp = document.getElementById('auth-reg-username');
  const passInp = document.getElementById('auth-reg-password');
  const submitBtn = document.getElementById('auth-reg-submit-btn');

  const uname = normalizeAccountUsername(userInp ? userInp.value : '');
  const pass = (passInp ? passInp.value : '').trim();

  if (!uname || uname.length < 2) {
    showAuthError('auth-reg-error', '⚠️ Jméno účtu musí mít alespoň 2 písmena nebo čísla!');
    return;
  }
  if (!pass || pass.length < 2) {
    showAuthError('auth-reg-error', '⚠️ Zadej prosím heslo (alespoň 2 znaky)!');
    return;
  }

  const localReg = getLocalAccountsRegistry();
  if (localReg[uname]) {
    showAuthError('auth-reg-error', `⚠️ Účet "${uname}" už existuje! Přepni se na "Přihlásit se".`);
    return;
  }

  if (navigator.onLine) {
    if (submitBtn) submitBtn.disabled = true;
    try {
      const env = await fetchCloudEnvelopeFromGist();
      const usersMap = (env && env.users) ? env.users : (env && env.accounts ? env.accounts : {});
      if (usersMap[uname]) {
        showAuthError('auth-reg-error', `⚠️ Účet "${uname}" už v GitHub Gistu existuje! Přepni se na "Přihlásit se".`);
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
    } catch (e) {
      console.warn('Nelze zkontrolovat existenci účtu v GitHub Gistu, zakládám lokálně:', e);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  const newAcc = {
    username: uname,
    password: pass,
    displayName: `ŠKOLÁK ${uname.toUpperCase()}`,
    cloudEnabled: true,
    isTestAccount: false
  };

  if (typeof playTone === 'function') playTone(700, 0.12, 'sine', 0.2);
  await activateUserAccountSession(newAcc, true, true);
}

function logoutCurrentAccount() {
  if (currentLoggedInUser) {
    saveStateToLocalStorageOnly();
  }
  currentLoggedInUser = null;
  try {
    sessionStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(REMEMBERED_USER_KEY);
  } catch (e) {}

  updateEnvironmentBadgeUI();
  const loginPass = document.getElementById('auth-login-password');
  if (loginPass) loginPass.value = '';
  const loginErr = document.getElementById('auth-login-error');
  if (loginErr) loginErr.classList.add('hidden');
  switchAuthOverlayTab('login');

  const overlay = document.getElementById('auth-login-overlay');
  if (overlay) overlay.classList.remove('hidden');
  if (typeof playTone === 'function') playTone(440, 0.08, 'sine', 0.15);
}

function renderCloudEnvModalUI() {
  const statusBox = document.getElementById('cloud-env-status-box');
  if (!statusBox) return;

  if (!currentLoggedInUser) {
    statusBox.className = 'p-3.5 rounded-2xl border-2 bg-slate-50 border-slate-300 text-xs font-bold text-slate-700 leading-relaxed';
    statusBox.innerHTML = 'Žádný účet není přihlášen.';
    return;
  }

  if (currentLoggedInUser.isTestAccount) {
    statusBox.className = 'p-3.5 rounded-2xl border-2 bg-amber-50 border-amber-300 text-xs font-bold text-amber-950 leading-relaxed';
    statusBox.innerHTML = `
      <div class="font-black text-sm text-amber-900 mb-1">🧪 Aktivní účet: ${currentLoggedInUser.username.toUpperCase()} (${currentLoggedInUser.displayName})</div>
      <div>Tento testovací účet má <b>5 000 💎</b> a odemčené všechny možnosti k testování.</div>
      <div class="mt-1.5 text-[11px] text-amber-800">🔒 Zapisuje pouze do svého odděleného profilu <b>"test"</b> v GitHub Gistu – Míšův účet <b>"misa"</b> je 100% oddělený a chráněný.</div>
    `;
  } else {
    statusBox.className = 'p-3.5 rounded-2xl border-2 bg-emerald-50 border-emerald-400 text-xs font-bold text-emerald-950 leading-relaxed';
    statusBox.innerHTML = `
      <div class="font-black text-sm text-emerald-900 mb-1">🟢 Aktivní účet: ${currentLoggedInUser.username.toUpperCase()} (${currentLoggedInUser.displayName})</div>
      <div>Progres tohoto účtu se automaticky ukládá jak do <b>localStorage</b> tohoto zařízení, tak pod vlastní profil <b>"${currentLoggedInUser.username}"</b> v cloudu (GitHub Gist).</div>
      <div class="mt-1.5 text-[11px] text-emerald-800">☁️ Ostatní účty (např. synovec nebo test) mají svá vlastní oddělená data a tento účet nikdy nepřepíší.</div>
    `;
  }
}

function openCloudEnvModal() {
  const modal = document.getElementById('cloud-env-modal');
  if (!modal) return;
  renderCloudEnvModalUI();
  modal.classList.remove('hidden');
}

function closeCloudEnvModal() {
  const modal = document.getElementById('cloud-env-modal');
  if (modal) modal.classList.add('hidden');
}

function checkAndHandleDailyResets() {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  if (state.streakLastActiveDate && state.streakLastActiveDate !== today && state.streakLastActiveDate !== yesterday) {
    state.streakDays = 0;
    state.streakTodayCompleted = false;
    state.streakClaimedDay7 = false;
  } else if (state.streakLastActiveDate !== today) {
    state.streakTodayCompleted = false;
  }

  if (state.questsDate !== today) {
    state.questsDate = today;
    state.quests = createDefaultDailyQuests(state.customDailyLevelChoice || 4);
  }

  if (state.boxDate !== today) {
    state.boxDate = today;
    state.boxClaimed = false;
    state.lastBoxReward = 0.0;
    state.lastBoxRewardText = '';
  }

  if (state.testDate !== today) {
    state.testDate = today;
    state.testDoneToday = false;
  }

  if ((state.vaultBalance || 0) > 0) {
    const unlocked = state.vaultBalance;
    state.minutesBalance = Math.round((state.minutesBalance + unlocked) * 100) / 100;
    state.vaultBalance = 0.0;
  }

  if (state.dailyEarnedDate !== today) {
    state.dailyEarnedDate = today;
    state.dailyEarnedToday = 0.0;
    state.dailyReadingEarnedToday = 0.0;
    state.dailyMathEarnedToday = 0.0;
  }

  if (state.vouchersBoughtDate !== today) {
    state.vouchersBoughtDate = today;
    state.dailyStandardVoucherBought = null;
    state.dailyMaxVoucherBought = null;
  }

  if (!Array.isArray(state.traceabilityHistory)) {
    state.traceabilityHistory = [];
  }
  if (typeof state.dailyReadingEarnedToday !== 'number') state.dailyReadingEarnedToday = 0.0;
  if (typeof state.dailyMathEarnedToday !== 'number') state.dailyMathEarnedToday = 0.0;

  if (typeof checkAndHandlePetDailyReset === 'function') {
    checkAndHandlePetDailyReset();
  }
}

/* ============================================================
   STOPKY V HLAVIČCE (3S HOLD-TO-STOP) & TRACEABILITA TRÉNINKU
   ============================================================ */

let stopwatchState = {
  status: 'idle', // 'idle' | 'running' | 'paused'
  elapsedSec: 0,
  sessionStartTimeStr: '',
  lastTickMs: 0,
  intervalId: null,
  holdAnimFrame: null,
  holdStartMs: 0,
  holdListenersAttached: false
};

function formatStopwatchMMSS(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remSec = sec % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
}

function formatDurationHuman(totalSeconds) {
  const sec = Math.max(0, Math.round(totalSeconds || 0));
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remSec = sec % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${remSec}s`;
  }
  if (mins > 0) {
    return `${mins}m ${String(remSec).padStart(2, '0')}s`;
  }
  return `${remSec}s`;
}

let traceabilityExpandedDate = null;
let traceabilitySubView = 'table'; // 'table' | 'chart'
let traceabilityChartFilters = {
  duration: true,
  minutes: true,
  diamonds: true
};

function ensureTodayTraceabilityRecord() {
  if (!Array.isArray(state.traceabilityHistory)) {
    state.traceabilityHistory = [];
  }
  const todayIso = getTodayDateString();
  const todayDisplay = new Date().toLocaleDateString('cs-CZ');
  let rec = state.traceabilityHistory.find(r => r.dateIso === todayIso);
  if (!rec) {
    rec = {
      dateIso: todayIso,
      dateDisplay: todayDisplay,
      totalDurationSec: 0,
      earnedMinutes: 0,
      earnedDiamonds: 0,
      lessonsCount: 0,
      dailyQuestsCompleted: 0,
      sessions: [],
      stats: {
        letters: 0,
        syllables: 0,
        words: 0,
        sentences: 0,
        spelling: 0,
        coins: 0,
        comparisons: 0,
        sequences: 0,
        examples: 0,
        decompositions: 0,
        wordProblems: 0,
        coloring: 0
      }
    };
    state.traceabilityHistory.unshift(rec);
  }
  if (!rec.stats) rec.stats = {};
  if (rec.earnedDiamonds === undefined) rec.earnedDiamonds = 0;
  if (!Array.isArray(rec.sessions)) rec.sessions = [];
  const completedQuestsCount = Array.isArray(state.quests)
    ? state.quests.filter(q => q.claimed || q.progress >= q.target).length
    : 0;
  rec.dailyQuestsCompleted = Math.max(rec.dailyQuestsCompleted || 0, completedQuestsCount);
  return rec;
}

function isStopwatchSessionActive() {
  return stopwatchState.status === 'running' || stopwatchState.status === 'paused';
}

function recordTraceabilityPractice(statKey, count = 1, isLesson = true) {
  if (!isStopwatchSessionActive()) return;
  const rec = ensureTodayTraceabilityRecord();
  if (isLesson) {
    rec.lessonsCount = (rec.lessonsCount || 0) + 1;
  }
  if (statKey) {
    rec.stats[statKey] = (rec.stats[statKey] || 0) + (Number(count) || 1);
  }
  saveState();
}

function recordTraceabilityMinutes(minutesAmount) {
  if (!isStopwatchSessionActive()) return;
  const num = Number(minutesAmount) || 0;
  if (num <= 0) return;
  const rec = ensureTodayTraceabilityRecord();
  rec.earnedMinutes = Math.round(((rec.earnedMinutes || 0) + num) * 100) / 100;
}

function recordTraceabilityDiamonds(count = 1) {
  if (!isStopwatchSessionActive()) return;
  const num = Number(count) || 0;
  if (num <= 0) return;
  const rec = ensureTodayTraceabilityRecord();
  rec.earnedDiamonds = (rec.earnedDiamonds || 0) + num;
  saveState();
}

function syncTraceabilityQuestsIfActive() {
  if (!Array.isArray(state.traceabilityHistory)) return;
  const todayIso = getTodayDateString();
  const rec = state.traceabilityHistory.find(r => r.dateIso === todayIso);
  if (rec && Array.isArray(state.quests)) {
    const completedQuestsCount = state.quests.filter(q => q.claimed || q.progress >= q.target).length;
    rec.dailyQuestsCompleted = Math.max(rec.dailyQuestsCompleted || 0, completedQuestsCount);
  }
}

function updateStopwatchUI() {
  const dotEl = document.getElementById('stopwatch-status-dot');
  const timeEl = document.getElementById('stopwatch-time-display');
  const playPauseBtn = document.getElementById('stopwatch-playpause-btn');
  const stopBtn = document.getElementById('stopwatch-stop-btn');

  if (timeEl) {
    timeEl.textContent = formatStopwatchMMSS(stopwatchState.elapsedSec);
  }

  if (stopwatchState.status === 'running') {
    if (dotEl) dotEl.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0';
    if (playPauseBtn) {
      playPauseBtn.textContent = '⏸';
      playPauseBtn.title = 'Pozastavit stopky';
      playPauseBtn.className = 'w-6 h-6 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-90 text-white flex items-center justify-center text-[10px] font-black shadow-xs transition-all';
    }
    if (stopBtn) stopBtn.classList.remove('hidden');
  } else if (stopwatchState.status === 'paused') {
    if (dotEl) dotEl.className = 'w-2 h-2 rounded-full bg-amber-400 shrink-0';
    if (playPauseBtn) {
      playPauseBtn.textContent = '▶';
      playPauseBtn.title = 'Pokračovat v měření';
      playPauseBtn.className = 'w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-90 text-white flex items-center justify-center text-[10px] font-black shadow-xs transition-all animate-pulse';
    }
    if (stopBtn) stopBtn.classList.remove('hidden');
  } else {
    if (dotEl) dotEl.className = 'w-2 h-2 rounded-full bg-slate-400 shrink-0';
    if (playPauseBtn) {
      playPauseBtn.textContent = '▶';
      playPauseBtn.title = 'Spustit stopky tréninku';
      playPauseBtn.className = 'w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-90 text-white flex items-center justify-center text-[10px] font-black shadow-xs transition-all';
    }
    if (stopBtn) stopBtn.classList.add('hidden');
  }
}

function toggleStopwatchPlayPause() {
  attachStopwatchStopHoldListeners();

  if (stopwatchState.status === 'idle') {
    stopwatchState.status = 'running';
    stopwatchState.elapsedSec = 0;
    stopwatchState.sessionStartTimeStr = new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
    stopwatchState.lastTickMs = Date.now();
    ensureTodayTraceabilityRecord();
    saveState();

    if (stopwatchState.intervalId) clearInterval(stopwatchState.intervalId);
    stopwatchState.intervalId = setInterval(() => {
      if (stopwatchState.status === 'running') {
        const now = Date.now();
        const deltaSec = (now - stopwatchState.lastTickMs) / 1000;
        stopwatchState.lastTickMs = now;
        stopwatchState.elapsedSec += deltaSec;
        const timeEl = document.getElementById('stopwatch-time-display');
        if (timeEl) timeEl.textContent = formatStopwatchMMSS(stopwatchState.elapsedSec);
      }
    }, 250);

    playTone(660, 0.08, 'sine', 0.15);
    alertUserFeedback('⏱️ Stopky spuštěny! Trénink a statistiky se nyní zapisují.');
  } else if (stopwatchState.status === 'running') {
    const now = Date.now();
    stopwatchState.elapsedSec += (now - stopwatchState.lastTickMs) / 1000;
    stopwatchState.status = 'paused';
    playTone(480, 0.08, 'sine', 0.15);
  } else if (stopwatchState.status === 'paused') {
    stopwatchState.lastTickMs = Date.now();
    stopwatchState.status = 'running';
    playTone(620, 0.08, 'sine', 0.15);
  }

  updateStopwatchUI();
}

function completeStopwatchStop() {
  if (stopwatchState.intervalId) {
    clearInterval(stopwatchState.intervalId);
    stopwatchState.intervalId = null;
  }
  if (stopwatchState.holdAnimFrame) {
    cancelAnimationFrame(stopwatchState.holdAnimFrame);
    stopwatchState.holdAnimFrame = null;
  }
  stopwatchState.holdStartMs = 0;

  const ringEl = document.getElementById('stopwatch-stop-ring');
  if (ringEl) ringEl.style.strokeDashoffset = '81.68';

  const durationSec = Math.max(1, Math.round(stopwatchState.elapsedSec || 1));
  const endTimeStr = new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  const startTimeStr = stopwatchState.sessionStartTimeStr || endTimeStr;

  const rec = ensureTodayTraceabilityRecord();
  rec.sessions.push({
    start: startTimeStr,
    end: endTimeStr,
    durationSec: durationSec
  });
  rec.totalDurationSec = (rec.totalDurationSec || 0) + durationSec;
  syncTraceabilityQuestsIfActive();

  stopwatchState.status = 'idle';
  stopwatchState.elapsedSec = 0;
  stopwatchState.sessionStartTimeStr = '';

  saveState();
  updateStopwatchUI();
  if (typeof renderAdminTraceabilityUI === 'function') renderAdminTraceabilityUI();
  playCustomSuccessSound();
  alertUserFeedback(`⏹ Stopky vypnuty (${formatDurationHuman(durationSec)}). Záznam byl uložen do Traceability!`);
}

function attachStopwatchStopHoldListeners() {
  if (stopwatchState.holdListenersAttached) return;
  const stopBtn = document.getElementById('stopwatch-stop-btn');
  if (!stopBtn) return;
  stopwatchState.holdListenersAttached = true;

  const RING_CIRCUMFERENCE = 81.68;
  const HOLD_DURATION_MS = 3000;

  const startHold = (e) => {
    if (stopwatchState.status === 'idle') return;
    if (e && e.cancelable) e.preventDefault();
    if (stopwatchState.holdAnimFrame) cancelAnimationFrame(stopwatchState.holdAnimFrame);

    stopwatchState.holdStartMs = performance.now();
    playTone(420, 0.05, 'sine', 0.1);

    const step = (now) => {
      if (!stopwatchState.holdStartMs) return;
      const elapsed = now - stopwatchState.holdStartMs;
      const progress = Math.min(1, elapsed / HOLD_DURATION_MS);
      const ringEl = document.getElementById('stopwatch-stop-ring');
      if (ringEl) {
        ringEl.style.strokeDashoffset = (RING_CIRCUMFERENCE * (1 - progress)).toFixed(2);
      }
      if (progress >= 1) {
        completeStopwatchStop();
      } else {
        stopwatchState.holdAnimFrame = requestAnimationFrame(step);
      }
    };

    stopwatchState.holdAnimFrame = requestAnimationFrame(step);
  };

  const cancelHold = () => {
    if (!stopwatchState.holdStartMs) return;
    const heldMs = performance.now() - stopwatchState.holdStartMs;
    stopwatchState.holdStartMs = 0;
    if (stopwatchState.holdAnimFrame) {
      cancelAnimationFrame(stopwatchState.holdAnimFrame);
      stopwatchState.holdAnimFrame = null;
    }
    const ringEl = document.getElementById('stopwatch-stop-ring');
    if (ringEl) {
      ringEl.style.strokeDashoffset = String(RING_CIRCUMFERENCE);
    }
    if (heldMs > 80 && heldMs < HOLD_DURATION_MS && stopwatchState.status !== 'idle') {
      alertUserFeedback('Pro úplné vypnutí stopek podrž tlačítko ⏹ po dobu 3 sekund.');
    }
  };

  stopBtn.addEventListener('pointerdown', startHold);
  stopBtn.addEventListener('pointerup', cancelHold);
  stopBtn.addEventListener('pointerleave', cancelHold);
  stopBtn.addEventListener('pointercancel', cancelHold);
  stopBtn.addEventListener('contextmenu', (e) => e.preventDefault());
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isItemFormedByActive(lettersArray) {
  if (!lettersArray || !lettersArray.length) return false;
  return lettersArray.every(l => state.activeLetters.includes(l));
}

function generatePedagogicalOpenSyllables() {
  const syllables = [];
  const SOFT_CONSONANTS = ['Ž', 'Š', 'Č', 'Ř', 'C', 'J', 'Ď', 'Ť', 'Ň'];
  const HARD_CONSONANTS = ['H', 'CH', 'K', 'R', 'D', 'T', 'N'];
  const SYLLABLE_VOWELS = ['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'U', 'Ú', 'Y', 'Ý'];

  const activeConsonants = NATURAL_CONSONANTS.filter(c => state.activeLetters.includes(c));
  const activeVowels = SYLLABLE_VOWELS.filter(v => state.activeLetters.includes(v));

  activeConsonants.forEach(c => {
    activeVowels.forEach(v => {
      if (SOFT_CONSONANTS.includes(c) && (v === 'Y' || v === 'Ý')) return;
      if (['H', 'CH', 'K', 'R'].includes(c) && (v === 'I' || v === 'Í')) return;
      if (['Ď', 'Ť', 'Ň'].includes(c) && ['I', 'Í', 'E', 'É'].includes(v)) return;

      const syllableText = c + v;
      if (state.activeLetters.includes(c) && state.activeLetters.includes(v)) {
        syllables.push({ text: syllableText, emoji: '', letters: [c, v] });
      }
    });

    if (state.activeLetters.includes('Ě')) {
      if (['D', 'T', 'N', 'B', 'P', 'V', 'M'].includes(c)) {
        syllables.push({ text: c + 'Ě', emoji: '', letters: [c, 'Ě'] });
      }
    }
  });

  return syllables;
}

function formatMinutes(val) {
  const num = Number(val);
  if (isNaN(num)) return '0 min';
  const rounded = Math.round(num * 100) / 100;
  return `${rounded.toString().replace('.', ',')} min`;
}

function czechNounForm(n, one, twoToFour, fivePlus) {
  const absN = Math.abs(n);
  if (absN === 1) return one;
  if (absN >= 2 && absN <= 4) return twoToFour;
  return fivePlus;
}

const CZECH_VOWEL_SET = new Set(['A', 'Á', 'E', 'É', 'Ě', 'I', 'Í', 'O', 'Ó', 'U', 'Ú', 'Ů', 'Y', 'Ý']);
const CZECH_CONSONANT_SET = new Set([
  'B', 'C', 'Č', 'D', 'Ď', 'F', 'G', 'H', 'CH', 'J', 'K', 'L', 'M',
  'N', 'Ň', 'P', 'Q', 'R', 'Ř', 'S', 'Š', 'T', 'Ť', 'V', 'W', 'X', 'Z', 'Ž'
]);

// Vyloučení slov, kde se O a U potkávají na švu předpony a kořene (po-u..., do-u..., samo-uk) a netvoří dvojhlásku OU v jedné slabice
const NON_DIPHTHONG_OU_PREFIX_PATTERNS = /^(NE)?(POUČ|POUKÁZ|POUKAZ|POULIČ|POUMÝ|POUSM|POUŽI|POUŽÍ|POUVAŽ|POUZAV|POUZD|DOUČ|DOUPRAV|DOUZOV|PROUČ|SAMOUK)/i;

function tokenizeCzechWord(text) {
  if (!text || typeof text !== 'string') return [];
  const upper = text.trim().toUpperCase();
  const tokens = [];
  let i = 0;
  while (i < upper.length) {
    if (i < upper.length - 1 && upper.substring(i, i + 2) === 'CH') {
      tokens.push('CH');
      i += 2;
      continue;
    }
    const ch = upper[i];
    if (FULL_CZECH_ALPHABET.includes(ch)) {
      tokens.push(ch);
    }
    i++;
  }
  return tokens;
}

function extractUniqueLetters(text) {
  return Array.from(new Set(tokenizeCzechWord(text)));
}

/**
 * 1. Pravidla pro kategorii „Shluky“ (Souhláskové shluky):
 * Spojení dvou nebo více souhlásek stojících těsně vedle sebe v rámci jednoho slova
 * bez samohlásky (a, á, e, é, ě, i, í, o, ó, u, ú, ů, y, ý) mezi nimi.
 * Pokud slovo obsahuje pouze střídající se souhlásky a samohlásky (např. pa-la-ta), vrací false.
 */
function hasConsonantCluster(word) {
  if (!word || typeof word !== 'string') return false;
  const clean = word.trim().toUpperCase();
  if (!clean || clean.includes(' ')) return false;

  const tokens = tokenizeCzechWord(clean);
  if (tokens.length < 2) return false;

  let consecutiveConsonants = 0;
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (CZECH_VOWEL_SET.has(tk)) {
      consecutiveConsonants = 0;
    } else if (CZECH_CONSONANT_SET.has(tk)) {
      consecutiveConsonants++;
      if (consecutiveConsonants >= 2) {
        return true;
      }
    } else {
      consecutiveConsonants = 0;
    }
  }
  return false;
}

/**
 * 2. Pravidla pro kategorii „OU“ (Dvojhláska OU):
 * Slovo musí obsahovat dvojhlásku „ou“ (O bezprostředně následované U v jedné slabice,
 * např. kocour, louka, zoubek, ouško). Slova s odděleným O a U nebo na švu předpony po-u/do-u vrací false.
 */
function hasDiphthongOU(word) {
  if (!word || typeof word !== 'string') return false;
  const clean = word.trim().toUpperCase();
  if (!clean || clean.includes(' ')) return false;
  if (NON_DIPHTHONG_OU_PREFIX_PATTERNS.test(clean)) return false;

  const tokens = tokenizeCzechWord(clean);
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i] === 'O' && tokens[i + 1] === 'U') {
      return true;
    }
  }
  return false;
}

/**
 * 3. Společné pravidlo: Omezení výhradně na povolená písmena v admin módu.
 */
function isWordAllowedByAdminLetters(word, activeLetters = state.activeLetters) {
  if (!word || typeof word !== 'string') return false;
  if (!Array.isArray(activeLetters) || activeLetters.length === 0) return false;
  const activeSet = new Set(activeLetters.map(l => String(l).trim().toUpperCase()));
  const tokens = tokenizeCzechWord(word);
  if (tokens.length === 0) return false;
  return tokens.every(tk => activeSet.has(tk));
}

function buildStrictLevel5Pools() {
  const allCandidateSources = [
    ...(typeof RAW_LEVEL_5_SHLUKY_WORDS !== 'undefined' ? RAW_LEVEL_5_SHLUKY_WORDS : []),
    ...(typeof RAW_LEVEL_5_OU_WORDS !== 'undefined' ? RAW_LEVEL_5_OU_WORDS : []),
    ...(typeof RAW_LEVEL_5_WORDS !== 'undefined' ? RAW_LEVEL_5_WORDS : []),
    ...(typeof RAW_LEVEL_4_WORDS !== 'undefined' ? RAW_LEVEL_4_WORDS : []),
    ...(typeof RAW_LEVEL_6_WORDS !== 'undefined' ? RAW_LEVEL_6_WORDS : []),
    ...(typeof SPELLING_WORDS_DATABASE !== 'undefined'
      ? SPELLING_WORDS_DATABASE.map(item => ({ t: item.w, e: item.e }))
      : [])
  ];

  const seenWords = new Set();
  const uniqueEntries = [];

  allCandidateSources.forEach(entry => {
    const cleanText = (entry && entry.t ? String(entry.t) : '').trim().toUpperCase();
    if (!cleanText || cleanText.includes(' ') || seenWords.has(cleanText)) return;
    seenWords.add(cleanText);
    uniqueEntries.push({
      text: cleanText,
      emoji: entry.e || '',
      letters: extractUniqueLetters(cleanText),
      isShluk: hasConsonantCluster(cleanText),
      isOU: hasDiphthongOU(cleanText)
    });
  });

  const shlukyWords = uniqueEntries.filter(w => w.isShluk);
  const ouWords = uniqueEntries.filter(w => w.isOU);
  const combinedWords = uniqueEntries.filter(w => w.isShluk || w.isOU);

  return { shlukyWords, ouWords, combinedWords };
}

const LEVEL_3_CVC_WORDS = RAW_LEVEL_3_WORDS.map(w => ({ text: w.t, emoji: w.e, letters: extractUniqueLetters(w.t) }));
const LEVEL_4_TWO_SYLLABLE_WORDS = RAW_LEVEL_4_WORDS.map(w => ({ text: w.t, emoji: w.e, letters: extractUniqueLetters(w.t) }));
const STRICT_LEVEL_5_POOLS = buildStrictLevel5Pools();
const LEVEL_5_SHLUKY_WORDS = STRICT_LEVEL_5_POOLS.shlukyWords;
const LEVEL_5_OU_WORDS = STRICT_LEVEL_5_POOLS.ouWords;
const LEVEL_5_CLUSTERS = STRICT_LEVEL_5_POOLS.combinedWords;
const LEVEL_6_SOFT = RAW_LEVEL_6_WORDS.map(w => ({ text: w.t, emoji: w.e, letters: extractUniqueLetters(w.t) }));
const LEVEL_7_SENTENCES = RAW_LEVEL_7_SENTENCES.map(s => ({ text: s.t, emoji: s.e, letters: extractUniqueLetters(s.t) }));

function getFilteredLevel5Pool(subMode = state.level5SubMode || 'shluky', activeLetters = state.activeLetters) {
  const normalizedMode = (subMode === 'ou' || subMode === 'all') ? subMode : 'shluky';
  if (normalizedMode === 'shluky') {
    return LEVEL_5_SHLUKY_WORDS.filter(w =>
      hasConsonantCluster(w.text) &&
      isWordAllowedByAdminLetters(w.text, activeLetters) &&
      isItemFormedByActive(w.letters)
    );
  }
  if (normalizedMode === 'ou') {
    return LEVEL_5_OU_WORDS.filter(w =>
      hasDiphthongOU(w.text) &&
      isWordAllowedByAdminLetters(w.text, activeLetters) &&
      isItemFormedByActive(w.letters)
    );
  }
  return LEVEL_5_CLUSTERS.filter(w =>
    (hasConsonantCluster(w.text) || hasDiphthongOU(w.text)) &&
    isWordAllowedByAdminLetters(w.text, activeLetters) &&
    isItemFormedByActive(w.letters)
  );
}

let coloringState = {
  pokemon: null,
  segments: [],
  selectedSegmentIndex: null
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const CZECH_COINS_DATA = [
  { value: 1, label: '1 Kč', img: 'https://i.imgur.com/8MWmsAA.png', sizeClass: 'w-12 h-12 sm:w-14 sm:h-14' },
  { value: 2, label: '2 Kč', img: 'https://i.imgur.com/oKqEc7n.png', sizeClass: 'w-12 h-12 sm:w-14 sm:h-14' },
  { value: 5, label: '5 Kč', img: 'https://i.imgur.com/HJs6OGE.png', sizeClass: 'w-13 h-13 sm:w-15 sm:h-15' },
  { value: 10, label: '10 Kč', img: 'https://i.imgur.com/QaJdnKN.jpeg', sizeClass: 'w-13 h-13 sm:w-15 sm:h-15' },
  { value: 20, label: '20 Kč', img: 'https://i.imgur.com/cs9z8Qa.png', sizeClass: 'w-14 h-14 sm:w-16 sm:h-16' },
  { value: 50, label: '50 Kč', img: 'https://i.imgur.com/DFTA2V3.png', sizeClass: 'w-14 h-14 sm:w-16 sm:h-16' }
];

let coinGameState = {
  mode: 'compose',
  targetAmount: 20,
  priceAmount: 32,
  paidAmount: 50,
  forbiddenCoin: null,
  placedCoins: [],
  isSolved: false,
  dragGhostEl: null,
  draggingCoinVal: null,
  draggingPlacedIdx: null,
  startX: 0,
  startY: 0,
  hasMoved: false,
  pointerListenersAttached: false
};

function setCoinGameMode(mode) {
  const nextMode = mode === 'change' ? 'change' : 'compose';
  state.coinGameMode = nextMode;
  coinGameState.mode = nextMode;
  // When switching to Vracení peněz, if limit is below 20, bump to at least 50 so shopping scenarios are rich
  if (nextMode === 'change' && (state.coinMaxLimit || 20) < 20) {
    state.coinMaxLimit = 50;
  }
  saveState();
  updateCoinModeButtonsUI();
  playTone(nextMode === 'change' ? 600 : 520, 0.08, 'sine', 0.16);
  initCoinGameTask();
}

function updateCoinModeButtonsUI() {
  const mode = state.coinGameMode === 'change' ? 'change' : 'compose';
  coinGameState.mode = mode;
  const btnCompose = document.getElementById('coin-mode-btn-compose');
  const btnChange = document.getElementById('coin-mode-btn-change');
  const promptCompose = document.getElementById('coin-prompt-compose');
  const promptChange = document.getElementById('coin-prompt-change');

  if (btnCompose) {
    btnCompose.className = mode === 'compose'
      ? 'px-3 py-1 rounded-xl text-xs sm:text-sm font-black transition-all bg-amber-500 text-white shadow-sm flex items-center gap-1'
      : 'px-3 py-1 rounded-xl text-xs sm:text-sm font-black transition-all text-slate-700 hover:bg-amber-100 flex items-center gap-1';
  }
  if (btnChange) {
    btnChange.className = mode === 'change'
      ? 'px-3 py-1 rounded-xl text-xs sm:text-sm font-black transition-all bg-indigo-600 text-white shadow-sm flex items-center gap-1'
      : 'px-3 py-1 rounded-xl text-xs sm:text-sm font-black transition-all text-slate-700 hover:bg-amber-100 flex items-center gap-1';
  }
  if (promptCompose) {
    if (mode === 'compose') promptCompose.classList.remove('hidden');
    else promptCompose.classList.add('hidden');
  }
  if (promptChange) {
    if (mode === 'change') promptChange.classList.remove('hidden');
    else promptChange.classList.add('hidden');
  }
}

function previewCoinSliderLimit(val) {
  const label = document.getElementById('coin-limit-slider-label');
  if (label) {
    label.textContent = `${val} Kč`;
  }
}

function setCoinGameMaxLimit(limit) {
  const clamped = Math.max(10, Math.min(100, parseInt(limit, 10) || 20));
  state.coinMaxLimit = clamped;
  saveState();
  updateCoinLimitButtonsUI();
  playTone(540, 0.08, 'sine', 0.15);
  initCoinGameTask();
}

function toggleCoinChangeFormula() {
  state.coinHideFormula = !state.coinHideFormula;
  saveState();
  updateCoinFormulaVisibilityUI();
  playTone(state.coinHideFormula ? 420 : 540, 0.07, 'sine', 0.14);
}

function updateCoinFormulaVisibilityUI() {
  const formulaBadge = document.getElementById('coin-change-formula-badge');
  const toggleBtn = document.getElementById('coin-formula-toggle-btn');
  const isHidden = !!state.coinHideFormula;

  if (formulaBadge) {
    if (isHidden) {
      formulaBadge.classList.add('hidden');
    } else {
      formulaBadge.classList.remove('hidden');
      const answerPart = coinGameState.isSolved ? `${coinGameState.targetAmount} Kč` : '? Kč';
      formulaBadge.textContent = `${coinGameState.paidAmount} Kč − ${coinGameState.priceAmount} Kč = ${answerPart}`;
    }
  }
  if (toggleBtn) {
    toggleBtn.innerHTML = isHidden ? '👁️ Zobrazit výpočet' : '🙈 Skrýt výpočet';
  }
}

function toggleCoinHardMode() {
  state.coinHardMode = state.coinHardMode === false ? true : false;
  saveState();
  updateCoinHardModeUI();
  playTone(state.coinHardMode ? 620 : 420, 0.09, 'sine', 0.18);

  if (state.coinHardMode) {
    if (coinGameState.targetAmount < 4) {
      initCoinGameTask();
      return;
    }
    coinGameState.forbiddenCoin = pickForbiddenCoinForTarget(coinGameState.targetAmount);
    coinGameState.placedCoins = coinGameState.placedCoins.filter(v => v !== coinGameState.forbiddenCoin);
  } else {
    coinGameState.forbiddenCoin = null;
  }

  updateCoinConditionBadgeUI();
  renderCoinTray();
  renderCoinDropZoneItems();
  updateCoinFeedbackBanner();
}

function updateCoinHardModeUI() {
  const isHard = state.coinHardMode !== false;
  const btn = document.getElementById('coin-hard-mode-btn');
  const label = document.getElementById('coin-hard-mode-label');
  if (btn) {
    if (isHard) {
      btn.className = 'game-button px-3 py-1 rounded-2xl text-xs font-black border-2 transition-all flex items-center gap-1 shadow-sm bg-rose-500 hover:bg-rose-600 text-white border-rose-700';
    } else {
      btn.className = 'game-button px-3 py-1 rounded-2xl text-xs font-black border-2 transition-all flex items-center gap-1 shadow-sm bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300';
    }
  }
  if (label) {
    label.textContent = isHard ? 'Ztížení: ZAP' : 'Ztížení: VYP';
  }
}

function pickForbiddenCoinForTarget(target) {
  const usable = [50, 20, 10, 5, 2, 1].filter(c => c < target);
  let rem = target;
  const greedyUsed = new Set();
  for (const c of usable) {
    while (rem >= c) {
      if (c >= 2) greedyUsed.add(c);
      rem -= c;
    }
  }

  const greedyCandidates = Array.from(greedyUsed);
  // When target > 50, keep 50 Kč available most of the time so the child can practice using the 50 Kč coin!
  if (target > 50) {
    const nonFiftyHigher = greedyCandidates.filter(c => c >= 5 && c !== 50);
    if (nonFiftyHigher.length > 0 && Math.random() < 0.85) {
      return nonFiftyHigher[Math.floor(Math.random() * nonFiftyHigher.length)];
    }
    const nonFiftyAny = greedyCandidates.filter(c => c !== 50);
    if (nonFiftyAny.length > 0 && Math.random() < 0.85) {
      return nonFiftyAny[Math.floor(Math.random() * nonFiftyAny.length)];
    }
  }

  const higherCandidates = greedyCandidates.filter(c => c >= 5);
  if (higherCandidates.length > 0 && Math.random() < 0.85) {
    return higherCandidates[Math.floor(Math.random() * higherCandidates.length)];
  }
  if (greedyCandidates.length > 0) {
    return greedyCandidates[Math.floor(Math.random() * greedyCandidates.length)];
  }
  return 2;
}

function updateCoinConditionBadgeUI() {
  const badge = document.getElementById('coin-condition-badge');
  const textEl = document.getElementById('coin-condition-text');
  if (!badge || !textEl) return;

  if (state.coinHardMode !== false && coinGameState.forbiddenCoin) {
    badge.classList.remove('hidden');
    badge.classList.add('inline-flex');
    textEl.textContent = `Bez mince ${coinGameState.forbiddenCoin} Kč`;
  } else {
    badge.classList.add('hidden');
    badge.classList.remove('inline-flex');
  }
}

function updateCoinLimitButtonsUI() {
  const currentLimit = Math.max(10, Math.min(100, state.coinMaxLimit || 20));
  const slider = document.getElementById('coin-limit-slider');
  const sliderLabel = document.getElementById('coin-limit-slider-label');
  if (slider) slider.value = currentLimit.toString();
  if (sliderLabel) sliderLabel.textContent = `${currentLimit} Kč`;

  [20, 50, 100].forEach(lim => {
    const btn = document.getElementById(`coin-limit-btn-${lim}`);
    if (btn) {
      if (lim === currentLimit) {
        btn.className = 'px-1.5 py-0.5 rounded-lg text-[11px] font-black transition-all bg-amber-500 text-white shadow-sm';
      } else {
        btn.className = 'px-1.5 py-0.5 rounded-lg text-[11px] font-black transition-all text-amber-900 hover:bg-amber-200';
      }
    }
  });
}

function updateCoinFeedbackBanner() {
  const feedbackEl = document.getElementById('coin-game-feedback');
  if (!feedbackEl) return;

  if (coinGameState.mode === 'change') {
    if (coinGameState.forbiddenCoin) {
      feedbackEl.innerHTML = `Přetáhni do pole mince, které vrátíš zákazníkovi zpět – <span class="text-rose-700 font-black">🚫 bez použití mince ${coinGameState.forbiddenCoin} Kč</span>!`;
    } else {
      feedbackEl.innerHTML = `Přetáhni do pole mince, které dohromady dají částku k vrácení zákazníkovi!`;
    }
  } else {
    if (coinGameState.forbiddenCoin) {
      feedbackEl.innerHTML = `Přetáhni mince do pole a poskládej <strong>${coinGameState.targetAmount} Kč</strong> – <span class="text-rose-700 font-black">🚫 bez použití mince ${coinGameState.forbiddenCoin} Kč</span>!`;
    } else {
      feedbackEl.innerHTML = `Přetáhni mince do pole tak, abys poskládal částku <strong>${coinGameState.targetAmount} Kč</strong>!`;
    }
  }
}

function initCoinGameTask() {
  const maxLimit = Math.max(10, Math.min(100, state.coinMaxLimit || 20));
  const isHard = state.coinHardMode !== false;
  const mode = state.coinGameMode === 'change' ? 'change' : 'compose';
  coinGameState.mode = mode;

  updateCoinModeButtonsUI();
  updateCoinLimitButtonsUI();
  updateCoinHardModeUI();

  const minTarget = isHard ? 6 : 2;

  if (mode === 'change') {
    // Vracení peněz (Making Change): pick paidAmount and priceAmount so difference is targetAmount
    const candidatePaidAmounts = [20, 30, 40, 50, 60, 70, 80, 90, 100].filter(p => p <= maxLimit && p >= minTarget + 2);
    // Prefer realistic round banknote/coin payments (20, 50, 100)
    const preferredPaid = [20, 50, 100].filter(p => p <= maxLimit && p >= minTarget + 2);
    let paid = maxLimit;
    let price = 10;
    let diff = 10;
    let attempts = 0;

    do {
      if (preferredPaid.length > 0 && Math.random() < 0.78) {
        // Prefer the upper available realistic banknotes (e.g. 50 or 100 when slider is high)
        const upperPreferred = preferredPaid.filter(p => p >= Math.min(50, maxLimit));
        const pool = (upperPreferred.length > 0 && Math.random() < 0.75) ? upperPreferred : preferredPaid;
        paid = pool[Math.floor(Math.random() * pool.length)];
      } else if (candidatePaidAmounts.length > 0) {
        paid = candidatePaidAmounts[Math.floor(Math.random() * candidatePaidAmounts.length)];
      } else {
        paid = Math.max(10, maxLimit);
      }

      const maxDiff = paid - 2;
      if (paid > 50 && Math.random() < 0.55) {
        // Generate change > 50 Kč so the child uses the 50 Kč coin when returning change from 100 Kč!
        diff = randomInt(51, Math.max(52, paid - 5));
      } else {
        diff = randomInt(minTarget, Math.max(minTarget, maxDiff));
      }
      price = paid - diff;
      attempts++;
    } while ((diff === coinGameState.targetAmount || price <= 0) && attempts < 18);

    coinGameState.paidAmount = paid;
    coinGameState.priceAmount = price;
    coinGameState.targetAmount = diff;

    const storyEl = document.getElementById('coin-change-story-text');
    if (storyEl) {
      storyEl.innerHTML = `Nákup stál <strong class="text-rose-700 text-sm sm:text-base">${price} Kč</strong>, zákazník zaplatil <strong class="text-emerald-700 text-sm sm:text-base">${paid} Kč</strong>. Kolik Kč vrátíš zpět?`;
    }
  } else {
    // Skládání mincí (Compose Amount) up to 100 Kč
    const favoriteTargets = [
      6, 7, 8, 9, 10, 12, 13, 15, 17, 18, 20, 22, 23, 25, 27, 30, 34, 37, 40, 43, 47, 50,
      52, 54, 55, 57, 58, 60, 62, 65, 67, 70, 72, 75, 78, 80, 83, 85, 88, 90, 93, 95, 98, 100
    ].filter(v => v >= minTarget && v <= maxLimit);

    const overFiftyTargets = favoriteTargets.filter(v => v > 50);
    let nextTarget = 20;
    let attempts = 0;

    do {
      if (maxLimit > 50 && Math.random() < 0.68) {
        // Ensure frequent examples over 50 Kč when slider is above 50 Kč so 50 Kč coin can be used!
        if (overFiftyTargets.length > 0 && Math.random() < 0.6) {
          nextTarget = overFiftyTargets[Math.floor(Math.random() * overFiftyTargets.length)];
        } else {
          nextTarget = randomInt(51, maxLimit);
        }
      } else if (Math.random() < 0.5 && favoriteTargets.length > 0) {
        nextTarget = favoriteTargets[Math.floor(Math.random() * favoriteTargets.length)];
      } else {
        nextTarget = randomInt(minTarget, maxLimit);
      }
      attempts++;
    } while (nextTarget === coinGameState.targetAmount && attempts < 15);

    coinGameState.targetAmount = nextTarget;
  }

  coinGameState.forbiddenCoin = isHard ? pickForbiddenCoinForTarget(coinGameState.targetAmount) : null;
  coinGameState.placedCoins = [];
  coinGameState.isSolved = false;

  const targetBadge = document.getElementById('coin-target-amount-badge');
  if (targetBadge) {
    targetBadge.textContent = `${coinGameState.targetAmount} Kč`;
  }

  updateCoinFormulaVisibilityUI();
  updateCoinConditionBadgeUI();
  updateCoinFeedbackBanner();

  const dropZone = document.getElementById('coin-drop-zone');
  if (dropZone) {
    dropZone.className = 'w-full min-h-[135px] sm:min-h-[155px] bg-gradient-to-b from-amber-50/70 to-sky-50/70 border-4 border-dashed border-amber-400 rounded-3xl p-2.5 sm:p-3 flex flex-col justify-between relative transition-all select-none';
  }

  ensureCoinPointerListeners();
  renderCoinTray();
  renderCoinDropZoneItems();
}

function clearCoinDropZone() {
  if (coinGameState.isSolved) return;
  coinGameState.placedCoins = [];
  playTone(360, 0.08, 'sine', 0.15);
  renderCoinDropZoneItems();
  updateCoinFeedbackBanner();
}

function renderCoinTray() {
  const tray = document.getElementById('coin-tray-container');
  if (!tray) return;
  tray.innerHTML = '';

  CZECH_COINS_DATA.forEach(coin => {
    const isForbidden = (state.coinHardMode !== false) && (coinGameState.forbiddenCoin === coin.value);
    const item = document.createElement('div');
    item.className = isForbidden
      ? 'relative flex flex-col items-center justify-center gap-1 p-1.5 rounded-2xl bg-rose-50/90 border-2 border-rose-400 opacity-65 cursor-not-allowed select-none w-full'
      : 'relative flex flex-col items-center justify-center gap-1 p-1.5 rounded-2xl bg-white hover:bg-amber-50 border-2 border-amber-300 shadow-sm cursor-grab active:cursor-grabbing transition-transform hover:scale-105 select-none w-full';
    item.style.touchAction = 'none';

    item.innerHTML = `
      ${isForbidden ? `<span class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"><span class="bg-rose-600/95 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow border border-white">🚫 ZAKÁZÁNO</span></span>` : ''}
      <div class="${coin.sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-amber-50 shadow-inner pointer-events-none p-0.5 ${isForbidden ? 'grayscale-[50%]' : ''}">
        <img src="${coin.img}" alt="${coin.label}" referrerpolicy="no-referrer" draggable="false" class="w-full h-full object-contain rounded-full pointer-events-none select-none" />
      </div>
      <span class="text-xs sm:text-sm font-black ${isForbidden ? 'text-rose-900 bg-rose-200/90 border-rose-400 line-through' : 'text-amber-950 bg-amber-200/90 border-amber-400'} px-2.5 py-0.5 rounded-full border leading-none pointer-events-none">${coin.label}</span>
    `;

    item.addEventListener('pointerdown', (e) => startCoinDragFromTray(e, coin));
    tray.appendChild(item);
  });
}

function renderCoinDropZoneItems() {
  const container = document.getElementById('coin-drop-zone-items');
  const countLabel = document.getElementById('coin-drop-count-label');
  if (!container) return;

  if (countLabel) {
    countLabel.textContent = coinGameState.placedCoins.length > 0
      ? `V poli: ${coinGameState.placedCoins.length} ${coinGameState.placedCoins.length === 1 ? 'mince' : (coinGameState.placedCoins.length < 5 ? 'mince' : 'mincí')} (klepnutím odebereš ✕)`
      : 'Klepnutím na minci v poli ji odebereš ✕';
  }

  container.innerHTML = '';

  if (coinGameState.placedCoins.length === 0) {
    container.innerHTML = `
      <div class="text-slate-400 font-black text-xs sm:text-sm text-center py-4 pointer-events-none select-none">
        👇 Chytni minci dole prstem a přetáhni ji sem do pole!
      </div>
    `;
    return;
  }

  coinGameState.placedCoins.forEach((val, idx) => {
    const coinMeta = CZECH_COINS_DATA.find(c => c.value === val) || CZECH_COINS_DATA[0];
    const chip = document.createElement('div');
    chip.className = 'relative flex flex-col items-center justify-center p-1 rounded-2xl bg-white/95 border-2 border-amber-400 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform select-none';
    chip.style.touchAction = 'none';
    chip.title = 'Klepni nebo přetáhni ven pro odebrání mince';

    chip.innerHTML = `
      <span class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm pointer-events-none">✕</span>
      <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex items-center justify-center bg-amber-50 pointer-events-none p-0.5">
        <img src="${coinMeta.img}" alt="${coinMeta.label}" referrerpolicy="no-referrer" draggable="false" class="w-full h-full object-contain rounded-full pointer-events-none select-none" />
      </div>
      <span class="text-[11px] font-black text-amber-950 mt-0.5 leading-none pointer-events-none">${coinMeta.label}</span>
    `;

    chip.addEventListener('pointerdown', (e) => startCoinDragFromPlaced(e, idx, coinMeta));
    container.appendChild(chip);
  });
}

function createCoinDragGhost(coinMeta, x, y) {
  removeCoinDragGhost();
  const ghost = document.createElement('div');
  ghost.style.position = 'fixed';
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
  ghost.style.transform = 'translate(-50%, -50%) scale(1.18)';
  ghost.style.zIndex = '9999';
  ghost.style.pointerEvents = 'none';
  ghost.className = 'flex flex-col items-center justify-center p-1.5 rounded-full bg-white/95 border-3 border-amber-400 shadow-2xl';
  ghost.innerHTML = `
    <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden flex items-center justify-center">
      <img src="${coinMeta.img}" alt="${coinMeta.label}" referrerpolicy="no-referrer" draggable="false" class="w-full h-full object-contain rounded-full" />
    </div>
    <span class="text-xs font-black bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full -mt-1 border border-amber-600 shadow-sm">${coinMeta.label}</span>
  `;
  document.body.appendChild(ghost);
  coinGameState.dragGhostEl = ghost;
}

function removeCoinDragGhost() {
  if (coinGameState.dragGhostEl && coinGameState.dragGhostEl.parentNode) {
    coinGameState.dragGhostEl.parentNode.removeChild(coinGameState.dragGhostEl);
  }
  coinGameState.dragGhostEl = null;
}

function isPointInsideDropZone(x, y, tolerance = 22) {
  const dropZone = document.getElementById('coin-drop-zone');
  if (!dropZone) return false;
  const rect = dropZone.getBoundingClientRect();
  return (
    x >= rect.left - tolerance &&
    x <= rect.right + tolerance &&
    y >= rect.top - tolerance &&
    y <= rect.bottom + tolerance
  );
}

function startCoinDragFromTray(e, coinMeta) {
  if (coinGameState.isSolved) return;
  e.preventDefault();

  if (state.coinHardMode !== false && coinGameState.forbiddenCoin === coinMeta.value) {
    soundError();
    const feedbackEl = document.getElementById('coin-game-feedback');
    if (feedbackEl) {
      feedbackEl.innerHTML = `<span class="text-rose-700 font-black">🚫 Ztížení: Minci ${coinMeta.label} v tomto příkladu nesmíš použít! Použij jiné mince.</span>`;
    }
    return;
  }

  coinGameState.draggingCoinVal = coinMeta.value;
  coinGameState.draggingPlacedIdx = null;
  coinGameState.startX = e.clientX;
  coinGameState.startY = e.clientY;
  coinGameState.hasMoved = false;

  createCoinDragGhost(coinMeta, e.clientX, e.clientY);
  playTone(520, 0.04, 'sine', 0.1);

  const dropZone = document.getElementById('coin-drop-zone');
  if (dropZone) {
    dropZone.classList.add('border-indigo-400', 'bg-indigo-50/40');
  }
}

function startCoinDragFromPlaced(e, idx, coinMeta) {
  if (coinGameState.isSolved) return;
  e.preventDefault();
  e.stopPropagation();
  coinGameState.draggingCoinVal = null;
  coinGameState.draggingPlacedIdx = idx;
  coinGameState.startX = e.clientX;
  coinGameState.startY = e.clientY;
  coinGameState.hasMoved = false;

  createCoinDragGhost(coinMeta, e.clientX, e.clientY);
}

function ensureCoinPointerListeners() {
  if (coinGameState.pointerListenersAttached) return;
  coinGameState.pointerListenersAttached = true;

  window.addEventListener('pointermove', (e) => {
    if (coinGameState.draggingCoinVal === null && coinGameState.draggingPlacedIdx === null) return;

    const dx = e.clientX - coinGameState.startX;
    const dy = e.clientY - coinGameState.startY;
    if (Math.hypot(dx, dy) > 8) {
      coinGameState.hasMoved = true;
    }

    if (coinGameState.dragGhostEl) {
      coinGameState.dragGhostEl.style.left = `${e.clientX}px`;
      coinGameState.dragGhostEl.style.top = `${e.clientY}px`;
    }

    const dropZone = document.getElementById('coin-drop-zone');
    if (dropZone && coinGameState.draggingCoinVal !== null) {
      if (isPointInsideDropZone(e.clientX, e.clientY, 25)) {
        dropZone.classList.add('border-emerald-500', 'bg-emerald-50/60');
        dropZone.classList.remove('border-amber-400', 'border-indigo-400');
      } else {
        dropZone.classList.remove('border-emerald-500', 'bg-emerald-50/60');
        dropZone.classList.add('border-indigo-400');
      }
    }
  }, { passive: false });

  const handlePointerEnd = (e) => {
    if (coinGameState.draggingCoinVal === null && coinGameState.draggingPlacedIdx === null) return;

    const dropZone = document.getElementById('coin-drop-zone');
    if (dropZone) {
      dropZone.classList.remove('border-indigo-400', 'bg-indigo-50/40', 'border-emerald-500', 'bg-emerald-50/60');
      if (!coinGameState.isSolved) {
        dropZone.classList.add('border-amber-400');
      }
    }

    if (coinGameState.draggingCoinVal !== null) {
      const val = coinGameState.draggingCoinVal;
      const draggedUpward = (coinGameState.startY - e.clientY) > 35;
      const droppedInZone = isPointInsideDropZone(e.clientX, e.clientY, 28) || draggedUpward;

      if (droppedInZone && !(state.coinHardMode !== false && coinGameState.forbiddenCoin === val)) {
        coinGameState.placedCoins.push(val);
        playTone(700, 0.06, 'triangle', 0.18);
        setTimeout(() => playTone(960, 0.08, 'sine', 0.15), 40);
        renderCoinDropZoneItems();
      }
    } else if (coinGameState.draggingPlacedIdx !== null) {
      const idx = coinGameState.draggingPlacedIdx;
      const droppedOutside = !isPointInsideDropZone(e.clientX, e.clientY, 0);
      if (!coinGameState.hasMoved || droppedOutside) {
        coinGameState.placedCoins.splice(idx, 1);
        playTone(380, 0.07, 'sine', 0.15);
        renderCoinDropZoneItems();
      }
    }

    removeCoinDragGhost();
    coinGameState.draggingCoinVal = null;
    coinGameState.draggingPlacedIdx = null;
    coinGameState.hasMoved = false;
  };

  window.addEventListener('pointerup', handlePointerEnd);
  window.addEventListener('pointercancel', handlePointerEnd);
}

function evaluateCoinGame() {
  if (coinGameState.isSolved) return;

  const target = coinGameState.targetAmount;
  const coins = coinGameState.placedCoins;
  const feedbackEl = document.getElementById('coin-game-feedback');
  const dropZone = document.getElementById('coin-drop-zone');
  const isChangeMode = coinGameState.mode === 'change';

  if (!coins || coins.length === 0) {
    if (feedbackEl) {
      feedbackEl.innerHTML = '<span class="text-amber-700 font-black">⚠️ Nejprve přetáhni mince z nabídky dole do herního pole!</span>';
    }
    soundShuffle();
    return;
  }

  if (state.coinHardMode !== false && coinGameState.forbiddenCoin && coins.includes(coinGameState.forbiddenCoin)) {
    if (feedbackEl) {
      feedbackEl.innerHTML = `<span class="text-rose-700 font-black">🚫 V poli máš zakázanou minci ${coinGameState.forbiddenCoin} Kč! Odeber ji a zkus jinou kombinaci.</span>`;
    }
    soundError();
    return;
  }

  const sum = coins.reduce((acc, v) => acc + v, 0);

  if (!isChangeMode && sum === target && coins.length === 1 && target > 1) {
    if (feedbackEl) {
      feedbackEl.innerHTML = `<span class="text-indigo-700 font-black">💡 To je jedna mince ${target} Kč! Zkus částku ${target} Kč poskládat z více menších mincí (alespoň ze 2 mincí)!</span>`;
    }
    soundShuffle();
    return;
  }

  if (sum === target) {
    coinGameState.isSolved = true;
    updateCoinFormulaVisibilityUI();
    const formulaStr = coins.join(' + ') + ' = ' + target + ' Kč';
    if (feedbackEl) {
      if (isChangeMode) {
        feedbackEl.innerHTML = `<span class="text-emerald-700 font-black">✅ Správně vráceno ${target} Kč! (${coinGameState.paidAmount} − ${coinGameState.priceAmount} = ${target} Kč | mince: ${formulaStr}) 🎉</span>`;
      } else {
        feedbackEl.innerHTML = `<span class="text-emerald-700 font-black">✅ Správně! (${formulaStr}) Skvělá práce! 🎉</span>`;
      }
    }
    if (dropZone) {
      dropZone.classList.remove('border-amber-400', 'border-rose-400');
      dropZone.classList.add('border-emerald-500', 'bg-emerald-50/70');
    }

    const reward = getLevelReward('math', 1);
    const noteText = isChangeMode
      ? `Matematika: Vracení peněz (${coinGameState.paidAmount} − ${coinGameState.priceAmount} = ${target} Kč)`
      : `Matematika: Skládání mincí (${target} Kč)`;
    recordTraceabilityPractice('coins', 1, true);
    creditRewardMinutes(reward, noteText, 'math');
    updateDailyQuestsProgress('math', 1);
    saveState();
    playCustomSuccessSound();
    triggerConfetti();

    setTimeout(() => {
      if (state.subject === 'math' && state.currentMathLevel === 1) {
        initCoinGameTask();
      }
    }, 1600);
  } else {
    if (feedbackEl) {
      if (isChangeMode) {
        feedbackEl.innerHTML = `<span class="text-rose-600 font-black">❌ Zatím to nesedí! V poli máš ${sum} Kč, ale zákazníkovi máš vrátit jinou částku. Zkus to přepočítat!</span>`;
      } else {
        feedbackEl.innerHTML = `<span class="text-rose-600 font-black">❌ Zatím to nesedí! V poli máš ${sum} Kč, ale potřebuješ poskládat ${target} Kč. Zkus mince upravit!</span>`;
      }
    }
    if (dropZone) {
      dropZone.classList.remove('border-amber-400', 'border-emerald-500');
      dropZone.classList.add('border-rose-400', 'bg-rose-50/40');
    }
    soundError();
  }
}

function generateMathLevel2(maxVal) {
  const pool = [];
  for (let i = 0; i < 20; i++) {
    let a = randomInt(0, maxVal);
    let b = (Math.random() < 0.25) ? a : randomInt(0, maxVal);
    if (a === b && Math.random() > 0.5 && a < maxVal) b = a + 1;
    const sign = a < b ? '<' : (a > b ? '>' : '=');
    pool.push({
      type: 'compare',
      leftVal: a,
      rightVal: b,
      htmlRow: `<span class="text-3xl sm:text-4xl font-black text-sky-800">${a}</span> <span class="mx-3 text-slate-300 font-black text-2xl">⭕</span> <span class="text-3xl sm:text-4xl font-black text-sky-800">${b}</span>`,
      correctAnswer: sign
    });
  }
  return pool;
}

function generateMathLevel3(maxVal) {
  const pool = [];
  const step = maxVal >= 50 && Math.random() > 0.5 ? 5 : (maxVal === 100 && Math.random() > 0.5 ? 10 : 1);
  for (let i = 0; i < 20; i++) {
    const start = randomInt(0, Math.max(0, maxVal - (step * 3)));
    const seq = [start, start + step, start + (step * 2), start + (step * 3)];
    const missingIdx = randomInt(0, 3);
    const correct = seq[missingIdx];
    const rowParts = seq.map((val, idx) => {
      if (idx === missingIdx) {
        return `<span class="inline-block px-3 py-0.5 bg-amber-100 text-amber-800 rounded-xl border-2 border-dashed border-amber-400 font-black">?</span>`;
      }
      return `<span class="font-black text-sky-800">${val}</span>`;
    }).join(' <span class="text-slate-300 mx-1">,</span> ');

    pool.push({
      type: 'input',
      htmlRow: `<div class="text-2xl sm:text-3xl whitespace-nowrap">${rowParts}</div>`,
      correctAnswer: correct.toString()
    });
  }
  return pool;
}

function generateMathLevel4(maxVal) {
  const pool = [];
  for (let i = 0; i < 24; i++) {
    const isPlus = Math.random() > 0.45;
    if (isPlus) {
      let a, b;
      if (maxVal > 20 && Math.random() > 0.4) {
        a = randomInt(1, Math.floor(maxVal / 10) - 1) * 10;
        b = randomInt(1, Math.floor((maxVal - a) / 10)) * 10;
      } else {
        a = randomInt(0, Math.floor(maxVal * 0.7));
        b = randomInt(1, maxVal - a);
      }
      pool.push({
        type: 'input',
        htmlRow: `<span class="text-3xl sm:text-4xl font-black text-sky-800">${a}</span> <span class="text-2xl sm:text-3xl text-amber-500 font-black mx-2">+</span> <span class="text-3xl sm:text-4xl font-black text-sky-800">${b}</span> <span class="text-2xl sm:text-3xl text-slate-400 font-black mx-2">=</span>`,
        correctAnswer: (a + b).toString()
      });
    } else {
      let a, b;
      if (maxVal > 20 && Math.random() > 0.4) {
        a = randomInt(2, Math.floor(maxVal / 10)) * 10;
        b = randomInt(1, Math.floor(a / 10) - 1) * 10;
      } else {
        a = randomInt(2, maxVal);
        b = randomInt(1, a - 1);
      }
      pool.push({
        type: 'input',
        htmlRow: `<span class="text-3xl sm:text-4xl font-black text-sky-800">${a}</span> <span class="text-2xl sm:text-3xl text-rose-500 font-black mx-2">−</span> <span class="text-3xl sm:text-4xl font-black text-sky-800">${b}</span> <span class="text-2xl sm:text-3xl text-slate-400 font-black mx-2">=</span>`,
        correctAnswer: (a - b).toString()
      });
    }
  }
  return pool;
}

function generateMathLevel5(maxVal) {
  const pool = [];
  const topMax = Math.min(maxVal, 20);
  for (let i = 0; i < 20; i++) {
    const topNum = randomInt(2, topMax);
    const leftNum = randomInt(0, topNum);
    const rightNum = topNum - leftNum;
    const missingSide = Math.random() > 0.5 ? 'right' : 'left';
    const expected = missingSide === 'right' ? rightNum : leftNum;
    pool.push({
      type: 'decomposition',
      topNum: topNum,
      leftNum: leftNum,
      rightNum: rightNum,
      missingSide: missingSide,
      correctAnswer: expected.toString()
    });
  }
  return pool;
}

function generateMathLevel6(maxVal) {
  const pool = [];
  const templates = [...WORD_PROBLEMS_TEMPLATES];
  const shuffled = shuffleArray(templates);

  shuffled.forEach(tmpl => {
    const data = tmpl.make(maxVal || 10);
    pool.push({
      type: 'input',
      isWordProblem: true,
      story: data.story,
      formula: data.formula,
      a: data.a,
      b: data.b,
      op: data.op,
      correctAnswer: data.correctAnswer
    });
  });

  return pool;
}

function toggleWordProblemFormula(index) {
  const el = document.getElementById(`word-problem-formula-${index}`);
  const btn = document.getElementById(`formula-toggle-btn-${index}`);
  if (!el || !btn) return;

  if (el.classList.contains('hidden')) {
    el.classList.remove('hidden');
    btn.innerHTML = '🙈 Skrýt příklad';
    playTone(520, 0.06, 'sine', 0.12);
  } else {
    el.classList.add('hidden');
    btn.innerHTML = '👁️ Zobrazit příklad';
    playTone(420, 0.06, 'sine', 0.12);
  }
}

function generateSingleMathTask() {
  const maxVal = state.mathMax || 10;
  const taskType = randomInt(1, 4);

  if (taskType === 1) {
    const isPlus = Math.random() > 0.45;
    if (isPlus) {
      const a = randomInt(1, Math.max(1, maxVal - 2));
      const b = randomInt(1, maxVal - a);
      return { kind: 'arithmetic', op: '+', a: a, b: b, correctAnswer: (a + b).toString() };
    } else {
      const a = randomInt(2, maxVal);
      const b = randomInt(1, a - 1);
      return { kind: 'arithmetic', op: '−', a: a, b: b, correctAnswer: (a - b).toString() };
    }
  }

  if (taskType === 2) {
    let a = randomInt(0, maxVal);
    let b = (Math.random() < 0.3) ? a : randomInt(0, maxVal);
    const sign = a < b ? '<' : (a > b ? '>' : '=');
    return { kind: 'compare', left: a, right: b, correctAnswer: sign };
  }

  if (taskType === 3) {
    const start = randomInt(0, Math.max(0, maxVal - 3));
    const seq = [start, start + 1, start + 2, start + 3];
    const missingIdx = randomInt(0, 3);
    return { kind: 'sequence', seq: seq, missingIdx: missingIdx, correctAnswer: seq[missingIdx].toString() };
  }

  const topNum = randomInt(2, Math.min(maxVal, 10));
  const leftNum = randomInt(0, topNum);
  const rightNum = topNum - leftNum;
  const missingSide = Math.random() > 0.5 ? 'right' : 'left';
  return {
    kind: 'decomposition',
    topNum: topNum,
    leftNum: leftNum,
    rightNum: rightNum,
    missingSide: missingSide,
    correctAnswer: (missingSide === 'right' ? rightNum : leftNum).toString()
  };
}

function initPokemonColoring() {
  const pIndex = Math.floor(Math.random() * POKEMON_ROSTER.length);
  const poke = POKEMON_ROSTER[pIndex];
  coloringState.pokemon = poke;

  document.getElementById('coloring-pokemon-number').textContent = `Pokémon #${poke.id}`;
  document.getElementById('coloring-pokemon-name').textContent = poke.name;

  const segCount = state.pokemonSegmentsCount || 12;
  coloringState.segments = [];
  coloringState.selectedSegmentIndex = null;

  const cols = Math.ceil(Math.sqrt(segCount));
  const rows = Math.ceil(segCount / cols);
  const w = 400 / cols;
  const h = 400 / rows;

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (idx >= segCount) break;
      const x = c * w;
      const y = r * h;
      const polyPoints = `${x},${y} ${x + w},${y} ${x + w},${y + h} ${x},${y + h}`;

      coloringState.segments.push({
        index: idx,
        x: x,
        y: y,
        w: w,
        h: h,
        points: polyPoints,
        colored: false,
        task: generateSingleMathTask()
      });
      idx++;
    }
  }

  renderPokemonSvg();
  updateColoringUI();
  document.getElementById('coloring-prompt-message').classList.remove('hidden');
  document.getElementById('coloring-widget-container').classList.add('hidden');
  document.getElementById('coloring-complete-overlay').classList.add('hidden');
}

function renderPokemonSvg() {
  const svgEl = document.getElementById('pokemon-svg');
  svgEl.innerHTML = '';
  const pokeImgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${coloringState.pokemon.id}.png`;

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const clipAll = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
  clipAll.setAttribute('id', 'colored-segments-clip');

  coloringState.segments.forEach(seg => {
    if (seg.colored) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', seg.x);
      rect.setAttribute('y', seg.y);
      rect.setAttribute('width', seg.w);
      rect.setAttribute('height', seg.h);
      clipAll.appendChild(rect);
    }
  });
  defs.appendChild(clipAll);
  svgEl.appendChild(defs);

  coloringState.segments.forEach((seg) => {
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', seg.x);
    bgRect.setAttribute('y', seg.y);
    bgRect.setAttribute('width', seg.w);
    bgRect.setAttribute('height', seg.h);
    bgRect.setAttribute('fill', seg.colored ? '#F1F5F9' : '#FFFFFF');
    svgEl.appendChild(bgRect);
  });

  const baseGhostImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  baseGhostImg.setAttribute('href', pokeImgUrl);
  baseGhostImg.setAttribute('x', '30');
  baseGhostImg.setAttribute('y', '30');
  baseGhostImg.setAttribute('width', '340');
  baseGhostImg.setAttribute('height', '340');
  baseGhostImg.setAttribute('style', 'filter: grayscale(100%) contrast(150%); opacity: 0.18;');
  baseGhostImg.setAttribute('pointer-events', 'none');
  svgEl.appendChild(baseGhostImg);

  const coloredPokeImg = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  coloredPokeImg.setAttribute('href', pokeImgUrl);
  coloredPokeImg.setAttribute('x', '30');
  coloredPokeImg.setAttribute('y', '30');
  coloredPokeImg.setAttribute('width', '340');
  coloredPokeImg.setAttribute('height', '340');
  coloredPokeImg.setAttribute('clip-path', 'url(#colored-segments-clip)');
  coloredPokeImg.setAttribute('pointer-events', 'none');
  svgEl.appendChild(coloredPokeImg);

  coloringState.segments.forEach((seg, i) => {
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', seg.points);
    poly.setAttribute('class', `poly-segment ${coloringState.selectedSegmentIndex === i ? 'selected' : ''}`);
    poly.setAttribute('fill', 'transparent');
    poly.setAttribute('stroke', '#CBD5E1');
    poly.setAttribute('stroke-width', '2.5');

    poly.onclick = () => selectColoringSegment(i);
    svgEl.appendChild(poly);

    const coords = seg.points.split(' ')[0].split(',');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', parseFloat(coords[0]) + 15);
    text.setAttribute('y', parseFloat(coords[1]) + 25);
    text.setAttribute('font-size', '14');
    text.setAttribute('font-weight', '900');
    text.setAttribute('fill', seg.colored ? '#94A3B8' : '#475569');
    text.setAttribute('pointer-events', 'none');
    text.textContent = (i + 1).toString();
    svgEl.appendChild(text);
  });
}

function selectColoringSegment(idx) {
  const seg = coloringState.segments[idx];
  if (seg.colored) return;

  coloringState.selectedSegmentIndex = idx;
  renderPokemonSvg();

  const promptMsg = document.getElementById('coloring-prompt-message');
  const widgetContainer = document.getElementById('coloring-widget-container');
  promptMsg.classList.add('hidden');
  widgetContainer.classList.remove('hidden');

  renderColoringWidget(seg.task);
  playTone(480, 0.08, 'sine', 0.15);
}

function renderColoringWidget(task) {
  const container = document.getElementById('coloring-widget-container');
  container.innerHTML = '';

  if (task.kind === 'compare') {
    const card = document.createElement('div');
    card.className = 'w-full max-w-xl bg-white border-4 border-amber-300 rounded-3xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3';
    card.innerHTML = `
      <div class="flex items-center text-3xl sm:text-4xl font-black text-sky-900 font-baloo select-none pl-2 sm:pl-4">
        <span>${task.left}</span>
        <span class="mx-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-4 border-rose-500 bg-white inline-block"></span>
        <span>${task.right}</span>
      </div>
      <div class="flex items-center gap-2 pr-1 sm:pr-2">
        <button onclick="submitColoringChoice('<')" class="w-12 h-12 rounded-2xl bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 border-2 border-amber-300 text-2xl font-black flex items-center justify-center transition-transform">&lt;</button>
        <button onclick="submitColoringChoice('=')" class="w-12 h-12 rounded-2xl bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 border-2 border-amber-300 text-2xl font-black flex items-center justify-center transition-transform">=</button>
        <button onclick="submitColoringChoice('>')" class="w-12 h-12 rounded-2xl bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 border-2 border-amber-300 text-2xl font-black flex items-center justify-center transition-transform">&gt;</button>
      </div>
    `;
    container.appendChild(card);
    return;
  }

  if (task.kind === 'sequence') {
    const card = document.createElement('div');
    card.className = 'w-full max-w-xl bg-white border-4 border-amber-300 rounded-3xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3';
    const seqHtml = task.seq.map((num, i) => {
      if (i === task.missingIdx) {
        return `<span class="inline-flex items-center justify-center w-11 h-11 bg-amber-100 text-amber-900 font-black rounded-2xl border-3 border-dashed border-amber-400 text-2xl">?</span>`;
      }
      return `<span class="text-3xl sm:text-4xl font-black text-sky-900 font-baloo">${num}</span>`;
    }).join(' <span class="text-slate-300 font-black text-2xl mx-1">,</span> ');

    card.innerHTML = `
      <div class="flex items-center gap-2 select-none pl-2 sm:pl-4 overflow-x-auto">${seqHtml}</div>
      <div class="flex items-center gap-2 pr-1 sm:pr-2">
        <input type="number" id="coloring-inline-input" placeholder="?" class="w-16 h-12 text-center text-2xl font-black rounded-2xl border-3 border-amber-400 bg-amber-50 focus:bg-white focus:outline-none text-indigo-950 shadow-inner">
        <button onclick="submitColoringInput()" class="game-button bg-emerald-500 hover:bg-emerald-600 text-white font-black px-4 py-3 rounded-2xl border-b-4 border-emerald-700 text-sm">Vybarvit 🎨</button>
      </div>
    `;
    container.appendChild(card);
    setTimeout(() => {
      const inp = document.getElementById('coloring-inline-input');
      if (inp) { inp.focus(); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitColoringInput(); }); }
    }, 50);
    return;
  }

  if (task.kind === 'decomposition') {
    const card = document.createElement('div');
    card.className = 'w-full max-w-sm bg-white border-4 border-amber-300 rounded-3xl p-4 shadow-sm flex flex-col items-center justify-center';
    card.innerHTML = `
      <div class="w-16 h-16 rounded-2xl border-4 border-slate-700 bg-amber-50 flex items-center justify-center text-3xl font-black text-slate-800 shadow-sm font-baloo">
        ${task.topNum}
      </div>
      <svg class="w-28 h-8" viewBox="0 0 100 30">
        <line x1="50" y1="0" x2="20" y2="30" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
        <line x1="50" y1="0" x2="80" y2="30" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
      </svg>
      <div class="flex items-center gap-5 mt-0.5">
        ${task.missingSide === 'left' ? `
          <input type="number" id="coloring-inline-input" placeholder="?" class="w-14 h-14 text-center text-2xl font-black rounded-2xl border-4 border-dashed border-amber-400 bg-amber-50 focus:bg-white text-indigo-900 focus:outline-none">
        ` : `
          <div class="w-14 h-14 rounded-2xl border-4 border-slate-700 bg-white flex items-center justify-center text-2xl font-black text-slate-800 font-baloo">${task.leftNum}</div>
        `}
        ${task.missingSide === 'right' ? `
          <input type="number" id="coloring-inline-input" placeholder="?" class="w-14 h-14 text-center text-2xl font-black rounded-2xl border-4 border-dashed border-amber-400 bg-amber-50 focus:bg-white text-indigo-900 focus:outline-none">
        ` : `
          <div class="w-14 h-14 rounded-2xl border-4 border-slate-700 bg-white flex items-center justify-center text-2xl font-black text-slate-800 font-baloo">${task.rightNum}</div>
        `}
      </div>
      <button onclick="submitColoringInput()" class="game-button mt-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-2.5 rounded-2xl border-b-4 border-emerald-700 text-sm">
        Vybarvit dílek 🎨
      </button>
    `;
    container.appendChild(card);
    setTimeout(() => {
      const inp = document.getElementById('coloring-inline-input');
      if (inp) { inp.focus(); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitColoringInput(); }); }
    }, 50);
    return;
  }

  const card = document.createElement('div');
  card.className = 'w-full max-w-xl bg-white border-4 border-amber-300 rounded-3xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3';
  card.innerHTML = `
    <div class="flex items-center text-3xl sm:text-4xl font-black text-sky-900 font-baloo select-none pl-2 sm:pl-4">
      <span>${task.a}</span>
      <span class="mx-2 ${task.op === '+' ? 'text-amber-500' : 'text-rose-500'}">${task.op}</span>
      <span>${task.b}</span>
      <span class="mx-2 text-slate-400">=</span>
    </div>
    <div class="flex items-center gap-2 pr-1 sm:pr-2">
      <input type="number" id="coloring-inline-input" placeholder="?" class="w-16 h-12 text-center text-2xl font-black rounded-2xl border-3 border-amber-400 bg-amber-50 focus:bg-white focus:outline-none text-indigo-950 shadow-inner">
      <button onclick="submitColoringInput()" class="game-button bg-emerald-500 hover:bg-emerald-600 text-white font-black px-4 py-3 rounded-2xl border-b-4 border-emerald-700 text-sm">Vybarvit 🎨</button>
    </div>
  `;
  container.appendChild(card);
  setTimeout(() => {
    const inp = document.getElementById('coloring-inline-input');
    if (inp) { inp.focus(); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitColoringInput(); }); }
  }, 50);
}

function submitColoringChoice(choice) { evaluateColoringAnswer(choice); }
function submitColoringInput() {
  const inp = document.getElementById('coloring-inline-input');
  if (inp) evaluateColoringAnswer(inp.value.trim());
}

function evaluateColoringAnswer(answer) {
  const idx = coloringState.selectedSegmentIndex;
  if (idx === null) return;
  const seg = coloringState.segments[idx];

  if (answer === seg.task.correctAnswer) {
    seg.colored = true;
    coloringState.selectedSegmentIndex = null;
    playTone(660, 0.12, 'triangle', 0.25);
    renderPokemonSvg();
    updateColoringUI();

    const widgetContainer = document.getElementById('coloring-widget-container');
    const promptMsg = document.getElementById('coloring-prompt-message');
    widgetContainer.classList.add('hidden');
    promptMsg.classList.remove('hidden');
    promptMsg.textContent = '✅ Správně! Vyber další bílý dílek.';

    const allDone = coloringState.segments.every(s => s.colored);
    if (allDone) handlePokemonCompleted();
  } else {
    soundError();
    const promptMsg = document.getElementById('coloring-prompt-message');
    promptMsg.textContent = '❌ Zkus to znovu!';
    const inp = document.getElementById('coloring-inline-input');
    if (inp) { inp.value = ''; inp.focus(); }
  }
}

function handlePokemonCompleted() {
  state.goldDiamonds = (state.goldDiamonds || 0) + 1;
  recordTraceabilityDiamonds(1);
  recordTraceabilityPractice('coloring', 1, true);
  updateDailyQuestsProgress('math', 7);
  saveState();

  playCustomSuccessSound();
  triggerConfetti();
  document.getElementById('coloring-complete-overlay').classList.remove('hidden');
  updateTopBadges();
  updateDiamondMarketUI();
  alertUserFeedback(`Získal jsi +1 Modrý Diamant! Celkem máš: ${state.goldDiamonds} 💎`);
}

function updateColoringUI() {
  const coloredCount = coloringState.segments.filter(s => s.colored).length;
  const total = coloringState.segments.length;
  document.getElementById('coloring-progress-badge').textContent = `Vybarveno: ${coloredCount} / ${total}`;
}

function selectStrictBatch(pool, desiredCount, subject, level) {
  if (!pool || pool.length === 0) return { items: [], totalAvailable: 0 };
  const uniquePool = shuffleArray([...pool]);
  const totalAvailable = uniquePool.length;

  if (subject === 'reading' && level === 1 && totalAvailable < desiredCount) {
    let picked = shuffleArray([...uniquePool]);
    while (picked.length < desiredCount) {
      picked.push(...shuffleArray([...uniquePool]).slice(0, desiredCount - picked.length));
    }
    return { items: picked, totalAvailable };
  }
  return { items: uniquePool.slice(0, desiredCount), totalAvailable };
}

function updateMathCategoryHeader() {
  const tab1Title = document.getElementById('math-tab-1-title');
  if (tab1Title) {
    tab1Title.textContent = '🪙 1. Skládání mincí';
  }
}

function getLevelReward(subj, lvl) {
  if (!state.rewards) return 0.25;
  if (subj === 'reading') {
    return (state.rewards.reading && state.rewards.reading[lvl] !== undefined) ? state.rewards.reading[lvl] : (DEFAULT_REWARDS.reading[lvl] || 0.25);
  } else {
    return (state.rewards.math && state.rewards.math[lvl] !== undefined) ? state.rewards.math[lvl] : (DEFAULT_REWARDS.math[lvl] || 0.25);
  }
}

function updateNavTabRewardLabels() {
  for (let i = 1; i <= 8; i++) {
    const b = document.getElementById(`reading-lvl-badge-${i}`);
    if (b) {
      const r = getLevelReward('reading', i);
      b.textContent = `+${r.toString().replace('.', ',')} min`;
    }
  }
  for (let i = 1; i <= 6; i++) {
    const b = document.getElementById(`math-lvl-badge-${i}`);
    if (b) {
      const r = getLevelReward('math', i);
      b.textContent = `+${r.toString().replace('.', ',')} min`;
    }
  }
}

function generateLessonItems() {
  const subj = state.subject;
  const lvl = (subj === 'reading') ? state.currentLevel : state.currentMathLevel;

  const emptyNotice = document.getElementById('content-empty-notice');
  const readingReviewPanel = document.getElementById('reading-review-panel');
  const mathEvalPanel = document.getElementById('math-eval-panel');
  const generalControlBar = document.getElementById('general-control-bar');
  const coloringView = document.getElementById('content-coloring-view');
  const coinsView = document.getElementById('content-coins-view');
  const spellingView = document.getElementById('content-spelling-view');
  const gridView = document.getElementById('content-grid-view');
  const flashView = document.getElementById('content-flash-view');

  updateMathCategoryHeader();
  updateNavTabRewardLabels();
  clearSpellingTimers();

  if (subj === 'math' && lvl === 1) {
    readingReviewPanel.classList.add('hidden');
    mathEvalPanel.classList.add('hidden');
    generalControlBar.classList.add('hidden');
    gridView.classList.add('hidden');
    flashView.classList.add('hidden');
    spellingView.classList.add('hidden');
    coloringView.classList.add('hidden');
    emptyNotice.classList.add('hidden');
    if (coinsView) coinsView.classList.remove('hidden');

    initCoinGameTask();
    updateReviewButtonLabel();
    return;
  }

  if (coinsView) coinsView.classList.add('hidden');

  if (subj === 'math' && lvl === 7) {
    readingReviewPanel.classList.add('hidden');
    mathEvalPanel.classList.add('hidden');
    generalControlBar.classList.add('hidden');
    gridView.classList.add('hidden');
    flashView.classList.add('hidden');
    spellingView.classList.add('hidden');
    emptyNotice.classList.add('hidden');
    coloringView.classList.remove('hidden');

    initPokemonColoring();
    updateReviewButtonLabel();
    return;
  }

  if (subj === 'reading' && lvl === 8) {
    coloringView.classList.add('hidden');
    gridView.classList.add('hidden');
    flashView.classList.add('hidden');
    emptyNotice.classList.add('hidden');
    mathEvalPanel.classList.add('hidden');
    generalControlBar.classList.add('hidden');
    spellingView.classList.remove('hidden');
    readingReviewPanel.classList.remove('hidden');

    document.getElementById('reading-review-prompt').textContent = 'Hodnocení rodiče (Poslechni si hláskování syna):';
    document.getElementById('reading-retry-subtitle').textContent = 'Nové slovo na hláskování';
    document.getElementById('reading-success-title').textContent = 'VYHLÁSKOVÁNO SPRÁVNĚ!';

    initSpellingWord();
    updateReviewButtonLabel();
    return;
  }

  spellingView.classList.add('hidden');
  coloringView.classList.add('hidden');
  state.displayMode = 'grid';
  document.getElementById('reading-review-prompt').textContent = 'Hodnocení rodiče (Poslechni si čtení syna):';
  document.getElementById('reading-retry-subtitle').textContent = 'Nová sada slov';
  document.getElementById('reading-success-title').textContent = 'PŘEČTENO SPRÁVNĚ!';

  let pool = [];
  if (subj === 'reading') {
    generalControlBar.classList.remove('hidden');
    readingReviewPanel.classList.remove('hidden');
    mathEvalPanel.classList.add('hidden');

    syncReadingTileCountUI();
    syncLevel5SubModeUI();

    if (lvl === 1) pool = state.activeLetters.map(letter => ({ text: letter, emoji: '' }));
    else if (lvl === 2) pool = generatePedagogicalOpenSyllables();
    else if (lvl === 3) pool = LEVEL_3_CVC_WORDS.filter(w => isItemFormedByActive(w.letters) && isWordAllowedByAdminLetters(w.text));
    else if (lvl === 4) pool = LEVEL_4_TWO_SYLLABLE_WORDS.filter(w => isItemFormedByActive(w.letters) && isWordAllowedByAdminLetters(w.text));
    else if (lvl === 5) pool = getFilteredLevel5Pool(state.level5SubMode || 'shluky', state.activeLetters);
    else if (lvl === 6) pool = LEVEL_6_SOFT.filter(w => isItemFormedByActive(w.letters) && isWordAllowedByAdminLetters(w.text));
    else if (lvl === 7) pool = LEVEL_7_SENTENCES.filter(sen => isItemFormedByActive(sen.letters));
  } else {
    generalControlBar.classList.add('hidden');
    readingReviewPanel.classList.add('hidden');
    mathEvalPanel.classList.remove('hidden');

    const maxVal = state.mathMax || 10;
    if (lvl === 2) pool = generateMathLevel2(maxVal);
    else if (lvl === 3) pool = generateMathLevel3(maxVal);
    else if (lvl === 4) pool = generateMathLevel4(maxVal);
    else if (lvl === 5) pool = generateMathLevel5(maxVal);
    else if (lvl === 6) pool = generateMathLevel6(maxVal);
  }

  if (!pool || pool.length === 0) {
    gridView.classList.add('hidden');
    flashView.classList.add('hidden');
    readingReviewPanel.classList.add('hidden');
    updateEmptyNoticeForContext(subj, lvl);
    emptyNotice.classList.remove('hidden');
    state.currentItems = [];
    return;
  } else {
    emptyNotice.classList.add('hidden');
  }

  const desiredCount = (subj === 'reading') 
    ? (state.gridCardCount || 8) 
    : (lvl === 6 ? 3 : 4);

  const { items } = selectStrictBatch(pool, desiredCount, subj, lvl);
  state.currentItems = items;
  state.flashcardIndex = 0;

  renderCurrentContent();
  updateActiveSummaryBadge();
  updateReviewButtonLabel();
  document.getElementById('math-eval-status').textContent = 'Vypočítej všechny příklady výše.';
}

function updateReviewButtonLabel() {
  const subj = state.subject;
  const lvl = (subj === 'reading') ? state.currentLevel : state.currentMathLevel;
  const reward = getLevelReward(subj, lvl);
  const label = document.getElementById('btn-review-reward-label');
  if (label) {
    label.textContent = `+${reward.toString().replace('.', ',')} MINUTY NA HRANÍ`;
  }
}

function formatCase(text) {
  if (!text) return '';
  if (state.subject === 'math') return text;

  let cleaned = text.trim();
  const isSentence = cleaned.includes(' ');

  if (state.letterCase === 'mixed') {
    let res = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    if (isSentence) {
      res = res
        .replace(/\bemu\b/g, 'Emu')
        .replace(/\bema\b/g, 'Ema')
        .replace(/\bpepu\b/g, 'Pepu')
        .replace(/\bpepa\b/g, 'Pepa')
        .replace(/\balík\b/g, 'Alík')
        .replace(/\bmíla\b/g, 'Míla')
        .replace(/\bela\b/g, 'Ela')
        .replace(/\bola\b/g, 'Ola')
        .replace(/\bála\b/g, 'Ála')
        .replace(/\bota\b/g, 'Ota')
        .replace(/\btom\b/g, 'Tom')
        .replace(/\bjana\b/g, 'Jana')
        .replace(/\bsára\b/g, 'Sára')
        .replace(/\bfilip\b/g, 'Filip')
        .replace(/\bpetr\b/g, 'Petr')
        .replace(/\bhonza\b/g, 'Honza')
        .replace(/\blucka\b/g, 'Lucka');
    }
    if (isSentence && !/[.!?]$/.test(res)) {
      res += '.';
    }
    return res;
  }

  let upperRes = cleaned.toUpperCase();
  if (isSentence && !/[.!?]$/.test(upperRes)) {
    upperRes += '.';
  }
  return upperRes;
}

/* ============================================================
   DĚLENÍ ČESKÝCH SLOV NA SLABIKY A OBLOUČKY POD SLABIKAMI (◡◡)
   ============================================================ */

function splitCzechWordIntoSyllables(word) {
  if (!word) return [''];
  const clean = word.trim();
  if (clean.length <= 2) return [clean];

  // Tokenizace na fonetické jednotky (CH = 1 souhláska, OU/AU/EU = 1 samohláskové jádro)
  const tokens = [];
  let i = 0;
  while (i < clean.length) {
    const twoUpper = clean.slice(i, i + 2).toUpperCase();
    if (twoUpper === 'CH') {
      tokens.push({ text: clean.slice(i, i + 2), type: 'C', upper: 'CH' });
      i += 2;
      continue;
    }
    if (twoUpper === 'OU' || twoUpper === 'AU' || twoUpper === 'EU') {
      tokens.push({ text: clean.slice(i, i + 2), type: 'V', upper: twoUpper });
      i += 2;
      continue;
    }
    const ch = clean[i];
    const isV = /[AEIOUYÁÉÍÓÚŮÝĚ]/i.test(ch);
    tokens.push({ text: ch, type: isV ? 'V' : 'C', upper: ch.toUpperCase() });
    i++;
  }

  // Slabikotvorné R a L (pokud stojí za souhláskou a nejsou vedle samohlásky, např. SVE-TR)
  for (let t = 0; t < tokens.length; t++) {
    if (tokens[t].type === 'C' && (tokens[t].upper === 'R' || tokens[t].upper === 'L')) {
      const prevIsC = t > 0 && tokens[t - 1].type === 'C';
      const nextIsNotV = (t === tokens.length - 1) || (tokens[t + 1].type === 'C');
      if (prevIsC && nextIsNotV) {
        tokens[t].type = 'V';
      }
    }
  }

  const vowelIndices = [];
  tokens.forEach((tk, idx) => {
    if (tk.type === 'V') vowelIndices.push(idx);
  });

  if (vowelIndices.length <= 1) {
    return [clean];
  }

  // Určení hranic slabik mezi sousedními samohláskovými jádry
  const splitAfterTokenIndices = [];
  const inseparableOnsets = new Set(['DL', 'TL', 'KN', 'PR', 'BR', 'BL', 'PL', 'TR', 'DR', 'KR', 'KL', 'HR', 'HL', 'VR', 'VL', 'MR', 'ML', 'CV', 'ČT', 'ŠT', 'SK', 'SP', 'ST']);

  for (let v = 0; v < vowelIndices.length - 1; v++) {
    const v1 = vowelIndices[v];
    const v2 = vowelIndices[v + 1];
    const consCount = v2 - v1 - 1;

    if (consCount <= 1) {
      // 0 nebo 1 souhláska mezi samohláskami -> souhláska patří k následující slabice (MÁ-MA, E-MA, PE-PA)
      splitAfterTokenIndices.push(v1);
    } else if (consCount === 2) {
      const pair = tokens[v1 + 1].upper + tokens[v1 + 2].upper;
      if (['DL', 'TL', 'KN', 'PR', 'BR', 'BL', 'PL', 'KR', 'TR', 'DR'].includes(pair)) {
        splitAfterTokenIndices.push(v1);
      } else {
        splitAfterTokenIndices.push(v1 + 1);
      }
    } else {
      // 3 a více souhlásek (např. JABLÍČKO -> JAB-LÍČ-KO, STROMEČEK -> STRO-ME-ČEK)
      const lastTwo = tokens[v2 - 2].upper + tokens[v2 - 1].upper;
      if (inseparableOnsets.has(lastTwo)) {
        splitAfterTokenIndices.push(v2 - 3);
      } else {
        splitAfterTokenIndices.push(v1 + 1);
      }
    }
  }

  const syllables = [];
  let startIdx = 0;
  splitAfterTokenIndices.forEach(splitIdx => {
    const sylStr = tokens.slice(startIdx, splitIdx + 1).map(tk => tk.text).join('');
    syllables.push(sylStr);
    startIdx = splitIdx + 1;
  });
  syllables.push(tokens.slice(startIdx).map(tk => tk.text).join(''));

  return syllables.filter(Boolean);
}

function renderWordWithSyllableArcsHtml(formattedWord, arcStrokeColor = '#0284c7') {
  if (!formattedWord) return '';
  const match = formattedWord.match(/^(.+?)([.,!?]+)?$/);
  const coreWord = match ? match[1] : formattedWord;
  const trailingPunct = (match && match[2]) ? match[2] : '';

  const syllables = splitCzechWordIntoSyllables(coreWord);
  const syllablesHtml = syllables.map(syl => `
    <span class="inline-flex flex-col items-center justify-end px-[2px] sm:px-[3px]">
      <span class="leading-none">${syl}</span>
      <svg class="w-full h-[9px] sm:h-[12px] -mt-[1px] overflow-visible pointer-events-none select-none" viewBox="0 0 100 26" preserveAspectRatio="none">
        <path d="M 0,2 Q 50,25 100,2" fill="none" stroke="${arcStrokeColor}" stroke-width="6.5" stroke-linecap="round" />
      </svg>
    </span>
  `).join('');

  return `<span class="inline-flex items-baseline whitespace-nowrap">${syllablesHtml}${trailingPunct ? `<span class="leading-none ml-[1px]">${trailingPunct}</span>` : ''}</span>`;
}

function renderReadingTextHtml(rawText, options = {}) {
  const formatted = formatCase(rawText);
  if (!formatted) return '';

  const isSingleLetterLevel = (state.subject === 'reading' && state.currentLevel === 1 && !options.forceEnableArcs);
  const showArcs = options.forceEnableArcs !== undefined ? options.forceEnableArcs : !!state.showSyllableArcs;

  if (!showArcs || isSingleLetterLevel) {
    return formatted;
  }

  const arcColor = options.arcColor || '#e11d48';
  const words = formatted.split(/\s+/).filter(Boolean);
  return words.map(w => renderWordWithSyllableArcsHtml(w, arcColor)).join(' <span class="inline-block w-1.5 sm:w-2.5"></span> ');
}

function toggleSyllableArcs() {
  state.showSyllableArcs = !state.showSyllableArcs;
  saveState();
  updateSyllableArcsToggleUI();
  renderCurrentContent();
  if (state.subject === 'reading' && state.currentLevel === 8 && spellingState.currentWordObj) {
    const wordDisplay = document.getElementById('spelling-word-display');
    if (wordDisplay) wordDisplay.innerHTML = renderReadingTextHtml(spellingState.currentWordObj.w);
  }
  playTone(550, 0.08, 'sine', 0.15);
}

function updateSyllableArcsToggleUI() {
  const btn = document.getElementById('toggle-syllables-btn');
  const text = document.getElementById('toggle-syllables-text');
  if (!btn || !text) return;

  if (state.showSyllableArcs) {
    btn.className = 'game-button px-2.5 py-0.5 rounded-xl text-xs font-black transition-all bg-rose-500 hover:bg-rose-600 text-white shadow-sm flex items-center gap-1 ml-1';
    text.textContent = 'Slabiky: ZAP';
  } else {
    btn.className = 'game-button px-2.5 py-0.5 rounded-xl text-xs font-black transition-all bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm flex items-center gap-1 ml-1';
    text.textContent = 'Slabiky: VYP';
  }
}

function updateActiveSummaryBadge() {
  const summaryEl = document.getElementById('active-summary-badge');
  if (!summaryEl) return;
  if (state.subject === 'reading') {
    summaryEl.textContent = `Aktivní písmena: ${state.activeLetters.join(', ')}`;
  } else {
    summaryEl.textContent = `Matematika rozsah: Do ${state.mathMax || 10}`;
  }
}

function toggleImages() {
  state.showImages = !state.showImages;
  saveState();
  updateImageToggleUI();
  renderCurrentContent();
  playTone(520, 0.09, 'sine', 0.15);
}

function updateImageToggleUI() {
  const btn = document.getElementById('toggle-images-btn');
  const text = document.getElementById('toggle-images-text');
  const icon = document.getElementById('toggle-images-icon');

  if (state.showImages) {
    btn.className = 'game-button px-2.5 py-1 rounded-xl text-xs font-black transition-all bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex items-center gap-1';
    text.textContent = 'Obrázky: ZAP';
    icon.textContent = '🖼️';
  } else {
    btn.className = 'game-button px-2.5 py-1 rounded-xl text-xs font-black transition-all bg-slate-300 hover:bg-slate-400 text-slate-700 shadow-sm flex items-center gap-1';
    text.textContent = 'Obrázky: VYP';
    icon.textContent = '🚫';
  }
}

function toggleSpeech() {
  state.showSpeechButton = !state.showSpeechButton;
  saveState();
  updateSpeechToggleUI();
  renderCurrentContent();
  playTone(540, 0.09, 'sine', 0.15);
}

function updateSpeechToggleUI() {
  const btn = document.getElementById('toggle-speech-btn');
  const text = document.getElementById('toggle-speech-text');
  const icon = document.getElementById('toggle-speech-icon');

  if (state.showSpeechButton) {
    btn.className = 'game-button px-2.5 py-1 rounded-xl text-xs font-black transition-all bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-1';
    text.textContent = 'Výslovnost: ZAP';
    icon.textContent = '🔊';
  } else {
    btn.className = 'game-button px-2.5 py-1 rounded-xl text-xs font-black transition-all bg-slate-300 hover:bg-slate-400 text-slate-700 shadow-sm flex items-center gap-1';
    text.textContent = 'Výslovnost: VYP';
    icon.textContent = '🔇';
  }
}

function speakCardItem(event, text) {
  if (event) event.stopPropagation();
  speakCzechWord(text, 0.8);
  playTone(600, 0.08, 'sine', 0.15);
}

function speakCurrentCard(event) {
  if (event) event.stopPropagation();
  if (!state.currentItems || !state.currentItems.length) return;
  const cur = state.currentItems[state.flashcardIndex];
  if (cur && cur.text) {
    speakCzechWord(cur.text, 0.8);
  }
}

function setSubject(newSubj) {
  state.subject = newSubj;
  if (typeof saveState === 'function') saveState();

  const btnReading = document.getElementById('subject-btn-reading');
  const btnMath = document.getElementById('subject-btn-math');
  const btnClocks = document.getElementById('subject-btn-clocks');
  const btnTest = document.getElementById('subject-btn-test');
  
  const readingTabs = document.getElementById('reading-tabs-container');
  const mathTabs = document.getElementById('math-tabs-container');
  const generalControlBar = document.getElementById('general-control-bar');
  const readingReviewPanel = document.getElementById('reading-review-panel');
  const mathEvalPanel = document.getElementById('math-eval-panel');

  // Všechna tlačítka hodíme do výchozího stavu
  if (btnReading) btnReading.className = 'h-full min-w-[58px] sm:min-w-[64px] px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 text-slate-600 hover:bg-slate-200 whitespace-nowrap';
  if (btnMath) btnMath.className = 'h-full min-w-[58px] sm:min-w-[64px] px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 text-slate-600 hover:bg-slate-200 whitespace-nowrap';
  if (btnClocks) btnClocks.className = 'h-full min-w-[58px] sm:min-w-[64px] px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 text-slate-600 hover:bg-slate-200 whitespace-nowrap';
  if (btnTest) btnTest.className = 'h-full min-w-[58px] sm:min-w-[64px] px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 text-purple-700 hover:bg-purple-100 relative whitespace-nowrap';

  if (newSubj === 'reading') {
    if (btnReading) btnReading.className = 'h-full min-w-[58px] sm:min-w-[64px] px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 bg-sky-500 text-white shadow-sm whitespace-nowrap';
    if (readingTabs) readingTabs.classList.remove('hidden');
    if (mathTabs) mathTabs.classList.add('hidden');
    if (generalControlBar) generalControlBar.classList.remove('hidden');
    if (readingReviewPanel) readingReviewPanel.classList.remove('hidden');
    if (mathEvalPanel) mathEvalPanel.classList.add('hidden');
  } else {
    if (btnMath) btnMath.className = 'h-full min-w-[58px] sm:min-w-[64px] px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 bg-amber-500 text-white shadow-sm whitespace-nowrap';
    if (mathTabs) mathTabs.classList.remove('hidden');
    if (readingTabs) readingTabs.classList.add('hidden');
    if (generalControlBar) generalControlBar.classList.add('hidden');
    if (mathEvalPanel) mathEvalPanel.classList.remove('hidden');
    if (readingReviewPanel) readingReviewPanel.classList.add('hidden');
  }

  const clockContainer = document.getElementById('content-grid-view');
  if (typeof showView === 'function') showView('learn');
  const boardFrame = document.getElementById('main-game-board-frame');
  if (boardFrame) boardFrame.setAttribute('data-board-mode', newSubj === 'math' ? 'math' : 'reading');
  if (typeof generateLessonItems === 'function') generateLessonItems();
}

function setClockView() {
  const btnReading = document.getElementById('subject-btn-reading');
  const btnMath = document.getElementById('subject-btn-math');
  const btnClocks = document.getElementById('subject-btn-clocks');
  const btnTest = document.getElementById('subject-btn-test');

  if (btnReading) btnReading.className = 'h-full min-w-[58px] sm:min-w-[64px] px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 text-slate-600 hover:bg-slate-200 whitespace-nowrap';
  if (btnMath) btnMath.className = 'h-full min-w-[58px] sm:min-w-[64px] px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 text-slate-600 hover:bg-slate-200 whitespace-nowrap';
  if (btnClocks) btnClocks.className = 'h-full min-w-[58px] sm:min-w-[64px] px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 bg-amber-500 text-white shadow-sm whitespace-nowrap';
  if (btnTest) btnTest.className = 'h-full min-w-[58px] sm:min-w-[64px] px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 text-purple-700 hover:bg-purple-100 relative whitespace-nowrap';

  if (typeof showView === 'function') showView('learn');
  const boardFrame = document.getElementById('main-game-board-frame');
  if (boardFrame) boardFrame.setAttribute('data-board-mode', 'clocks');
  
  const readingTabs = document.getElementById('reading-tabs-container');
  const mathTabs = document.getElementById('math-tabs-container');
  const generalControlBar = document.getElementById('general-control-bar');
  const readingReviewPanel = document.getElementById('reading-review-panel');
  const mathEvalPanel = document.getElementById('math-eval-panel');

  const coinsView = document.getElementById('content-coins-view');
  const coloringView = document.getElementById('content-coloring-view');
  const spellingView = document.getElementById('content-spelling-view');
  if (readingTabs) readingTabs.classList.add('hidden');
  if (mathTabs) mathTabs.classList.add('hidden');
  if (generalControlBar) generalControlBar.classList.add('hidden');
  if (readingReviewPanel) readingReviewPanel.classList.add('hidden');
  if (mathEvalPanel) mathEvalPanel.classList.add('hidden');
  if (coinsView) coinsView.classList.add('hidden');
  if (coloringView) coloringView.classList.add('hidden');
  if (spellingView) spellingView.classList.add('hidden');

  const gridView = document.getElementById('content-grid-view');
  if (gridView) {
    gridView.classList.remove('hidden');
    gridView.className = 'w-full flex flex-col items-center justify-center';
  }

  if (typeof renderClockSection === 'function') {
    renderClockSection();
  }
}

function switchLevel(lvl) {
  state.currentLevel = lvl;
  saveState();

  [1, 2, 3, 4, 5, 6, 7, 8].forEach(i => {
    const btn = document.getElementById(`lvl-btn-${i}`);
    if (btn) {
      if (i === lvl) {
        btn.className = 'lvl-btn h-[44px] py-1 px-1.5 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-0.5 transition-all bg-sky-500 text-white shadow-game-btn border-b-4 border-sky-700 min-w-[115px] sm:min-w-0 flex-shrink-0 whitespace-nowrap';
        btn.querySelector('span:last-child').className = 'text-[9px] font-bold text-amber-200 leading-tight';
      } else {
        const borderClass = (i === 8) ? 'border-2 border-purple-300' : 'border-2 border-slate-200';
        btn.className = `lvl-btn h-[44px] py-1 px-1.5 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-0.5 transition-all bg-white text-slate-700 hover:bg-sky-50 ${borderClass} min-w-[115px] sm:min-w-0 flex-shrink-0 whitespace-nowrap`;
        btn.querySelector('span:last-child').className = 'text-[9px] font-bold text-amber-600 leading-tight';
      }
    }
  });

  playTone(500, 0.1, 'sine', 0.15);
  generateLessonItems();
}

function switchMathLevel(lvl) {
  state.currentMathLevel = lvl;
  saveState();

  [1, 2, 3, 4, 5, 6, 7].forEach(i => {
    const btn = document.getElementById(`math-lvl-btn-${i}`);
    if (btn) {
      if (i === lvl) {
        btn.className = 'math-lvl-btn h-[44px] py-1 px-1.5 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-0.5 transition-all bg-amber-500 text-white shadow-game-btn border-b-4 border-amber-700 min-w-[125px] sm:min-w-0 flex-shrink-0 whitespace-nowrap';
        btn.querySelector('span:last-child').className = 'text-[9px] font-bold text-amber-200 leading-tight';
      } else {
        btn.className = 'math-lvl-btn h-[44px] py-1 px-1.5 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-0.5 transition-all bg-white text-slate-700 hover:bg-amber-50 border-2 border-slate-200 min-w-[125px] sm:min-w-0 flex-shrink-0 whitespace-nowrap';
        btn.querySelector('span:last-child').className = (i === 7)
          ? 'text-[9px] font-bold text-cyan-600 leading-tight'
          : 'text-[9px] font-bold text-amber-600 leading-tight';
      }
    }
  });

  playTone(500, 0.1, 'sine', 0.15);
  generateLessonItems();
}

function setLetterCase(caseMode) {
  const normalized = (caseMode === 'mixed') ? 'mixed' : 'upper';
  state.letterCase = normalized;
  saveState();

  const upperBtn = document.getElementById('case-btn-upper');
  const mixedBtn = document.getElementById('case-btn-mixed');

  const activeClass = 'px-2 py-0.5 rounded-lg text-xs font-black transition-all bg-amber-500 text-white shadow-sm';
  const inactiveClass = 'px-2 py-0.5 rounded-lg text-xs font-black transition-all text-amber-900 hover:bg-amber-200';

  if (upperBtn) upperBtn.className = (normalized === 'upper') ? activeClass : inactiveClass;
  if (mixedBtn) mixedBtn.className = (normalized === 'mixed') ? activeClass : inactiveClass;

  renderCurrentContent();
  if (state.subject === 'reading' && state.currentLevel === 8) {
    if (state.spellingMode === 'reverse') {
      updateReverseSpellingPeekUI();
    } else {
      renderSpellingLettersStrip();
    }
  }
}

function setDisplayMode(mode) {
  state.displayMode = 'grid';
  saveState();
  renderCurrentContent();
}

function syncReadingTileCountUI() {
  const isSentence = (state.subject === 'reading' && state.currentLevel === 7);
  const btn4 = document.getElementById('count-btn-4');
  const btn6 = document.getElementById('count-btn-6');
  const btn8 = document.getElementById('count-btn-8');
  const btn10 = document.getElementById('count-btn-10');

  if (btn4) {
    if (isSentence) {
      btn4.classList.remove('hidden');
    } else {
      btn4.classList.add('hidden');
    }
  }

  const validCounts = isSentence ? [4, 6, 8, 10] : [6, 8, 10];
  if (!validCounts.includes(state.gridCardCount)) {
    state.gridCardCount = isSentence ? 4 : 6;
  }

  const activeClass = 'px-2 py-0.5 rounded-lg text-xs font-black transition-all bg-emerald-500 text-white shadow-sm';
  const inactiveClass = 'px-2 py-0.5 rounded-lg text-xs font-black transition-all text-emerald-900 hover:bg-emerald-200';

  if (btn4 && isSentence) {
    btn4.className = (state.gridCardCount === 4) ? activeClass : inactiveClass;
  }
  if (btn6) btn6.className = (state.gridCardCount === 6) ? activeClass : inactiveClass;
  if (btn8) btn8.className = (state.gridCardCount === 8) ? activeClass : inactiveClass;
  if (btn10) btn10.className = (state.gridCardCount === 10) ? activeClass : inactiveClass;
}

function syncLevel5SubModeUI() {
  const wrapper = document.getElementById('control-level5-submode-wrapper');
  if (!wrapper) return;

  const isLevel5Reading = (state.subject === 'reading' && state.currentLevel === 5);
  if (isLevel5Reading) {
    wrapper.classList.remove('hidden');
    wrapper.classList.add('flex');
  } else {
    wrapper.classList.add('hidden');
    wrapper.classList.remove('flex');
  }

  const mode = (state.level5SubMode === 'ou' || state.level5SubMode === 'all') ? state.level5SubMode : 'shluky';
  state.level5SubMode = mode;

  const btnShluky = document.getElementById('lvl5-submode-shluky');
  const btnOu = document.getElementById('lvl5-submode-ou');
  const btnAll = document.getElementById('lvl5-submode-all');

  const activeClass = 'px-2.5 py-0.5 rounded-lg text-xs font-black transition-all bg-sky-500 text-white shadow-sm';
  const inactiveClass = 'px-2.5 py-0.5 rounded-lg text-xs font-black transition-all text-sky-900 hover:bg-sky-200';

  if (btnShluky) btnShluky.className = (mode === 'shluky') ? activeClass : inactiveClass;
  if (btnOu) btnOu.className = (mode === 'ou') ? activeClass : inactiveClass;
  if (btnAll) btnAll.className = (mode === 'all') ? activeClass : inactiveClass;
}

function setLevel5SubMode(mode) {
  const normalized = (mode === 'ou' || mode === 'all') ? mode : 'shluky';
  state.level5SubMode = normalized;
  saveState();
  syncLevel5SubModeUI();
  playTone(540, 0.08, 'sine', 0.15);
  generateLessonItems();
}

function updateEmptyNoticeForContext(subj, lvl) {
  const titleEl = document.getElementById('content-empty-title');
  const descEl = document.getElementById('content-empty-desc');
  if (!titleEl || !descEl) return;

  const activeListText = (Array.isArray(state.activeLetters) && state.activeLetters.length > 0)
    ? state.activeLetters.join(', ')
    : 'žádná';

  if (subj === 'reading' && lvl === 5) {
    const mode = state.level5SubMode || 'shluky';
    if (mode === 'shluky') {
      titleEl.textContent = 'Pro tato písmena zatím nejsou k dispozici žádné shluky.';
      descEl.textContent = `Aktivní písmena (${activeListText}) zatím neumožňují sestavit smysluplné české slovo se souhláskovým shlukem. Povol další písmenka v Rodičovské správě.`;
    } else if (mode === 'ou') {
      titleEl.textContent = 'Pro tato písmena zatím nejsou k dispozici žádné slova s OU.';
      descEl.textContent = `Aktivní písmena (${activeListText}) zatím neumožňují sestavit smysluplné české slovo s dvojhláskou OU. Povol písmena O, U a další souhlásky v Rodičovské správě.`;
    } else {
      titleEl.textContent = 'Pro tato písmena zatím nejsou k dispozici žádné shluky / slova s OU.';
      descEl.textContent = `Aktivní písmena (${activeListText}) zatím neumožňují sestavit žádné slovo se souhláskovým shlukem ani s dvojhláskou OU.`;
    }
    return;
  }

  titleEl.textContent = 'Chybí podklady pro procvičení';
  descEl.textContent = 'V rodičovském nastavení zapni další písmenka nebo uprav rozsah matematiky.';
}

function setGridCount(count) {
  const isSentence = (state.subject === 'reading' && state.currentLevel === 7);
  const validCounts = isSentence ? [4, 6, 8, 10] : [6, 8, 10];
  state.gridCardCount = validCounts.includes(count) ? count : 8;
  saveState();

  syncReadingTileCountUI();

  playTone(550, 0.08, 'sine', 0.15);
  generateLessonItems();
}

function renderCurrentContent() {
  const gridContainer = document.getElementById('content-grid-view');
  const flashContainer = document.getElementById('content-flash-view');

  if (!state.currentItems || state.currentItems.length === 0) return;
  const isMath = state.subject === 'math';

  state.displayMode = 'grid';
  gridContainer.classList.remove('hidden');
  if (flashContainer) flashContainer.classList.add('hidden');
  gridContainer.innerHTML = '';

  if (isMath) {
    if (state.currentMathLevel === 5) {
      gridContainer.className = 'w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-4xl mx-auto py-0.5';
    } else {
      gridContainer.className = 'w-full flex flex-col gap-1.5 sm:gap-2 max-w-3xl mx-auto';
    }

    state.currentItems.forEach((item, index) => {
      const card = document.createElement('div');
      card.id = `math-card-${index}`;

      if (item.type === 'decomposition') {
        card.className = 'math-row-card bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 border-3 border-amber-300 shadow-game-card flex flex-col items-center justify-center';
        card.innerHTML = `
          <div class="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl border-3 sm:border-4 border-slate-700 bg-amber-50 flex items-center justify-center text-xl sm:text-2xl font-black text-slate-800 shadow-sm font-baloo">
            ${item.topNum}
          </div>
          <svg class="w-20 sm:w-24 h-6 sm:h-7" viewBox="0 0 100 30">
            <line x1="50" y1="0" x2="20" y2="30" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
            <line x1="50" y1="0" x2="80" y2="30" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
          </svg>
          <div class="flex items-center gap-3 sm:gap-5 mt-0.5">
            ${item.missingSide === 'left' ? `
              <input type="number" id="math-input-${index}" inputmode="numeric" placeholder="?" class="w-11 sm:w-12 h-11 sm:h-12 text-center text-lg sm:text-xl font-black rounded-xl border-3 border-dashed border-amber-400 bg-amber-50 focus:bg-white text-indigo-900 focus:outline-none">
            ` : `
              <div class="w-11 sm:w-12 h-11 sm:h-12 rounded-xl border-3 border-slate-700 bg-white flex items-center justify-center text-lg sm:text-xl font-black text-slate-800">${item.leftNum}</div>
            `}
            ${item.missingSide === 'right' ? `
              <input type="number" id="math-input-${index}" inputmode="numeric" placeholder="?" class="w-11 sm:w-12 h-11 sm:h-12 text-center text-lg sm:text-xl font-black rounded-xl border-3 border-dashed border-amber-400 bg-amber-50 focus:bg-white text-indigo-900 focus:outline-none">
            ` : `
              <div class="w-11 sm:w-12 h-11 sm:h-12 rounded-xl border-3 border-slate-700 bg-white flex items-center justify-center text-lg sm:text-xl font-black text-slate-800">${item.rightNum}</div>
            `}
          </div>
          <span id="math-feedback-${index}" class="text-lg mt-1 h-4"></span>
        `;
      } else if (item.type === 'compare') {
        card.className = 'math-row-card bg-white rounded-2xl py-2 px-3 sm:py-2.5 sm:px-4 border-3 border-amber-300 shadow-game-card flex flex-nowrap items-center justify-between gap-2 overflow-x-auto';
        card.innerHTML = `
          <div class="flex items-center whitespace-nowrap select-none font-baloo text-2xl sm:text-3xl">${item.htmlRow}</div>
          <div class="flex items-center gap-1.5 whitespace-nowrap ml-auto">
            <button type="button" onclick="selectCompareOption(${index}, '<')" id="cmp-${index}-lt" class="cmp-btn text-lg sm:text-xl font-black w-9 sm:w-11 h-9 sm:h-11 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300">&lt;</button>
            <button type="button" onclick="selectCompareOption(${index}, '=')" id="cmp-${index}-eq" class="cmp-btn text-lg sm:text-xl font-black w-9 sm:w-11 h-9 sm:h-11 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300">=</button>
            <button type="button" onclick="selectCompareOption(${index}, '>')" id="cmp-${index}-gt" class="cmp-btn text-lg sm:text-xl font-black w-9 sm:w-11 h-9 sm:h-11 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300">&gt;</button>
            <input type="hidden" id="math-input-${index}" value="">
            <span id="math-feedback-${index}" class="text-lg ml-1 w-5 text-center"></span>
          </div>
        `;
      } else if (item.isWordProblem) {
        const formulaText = item.formula || `${item.a} ${item.op} ${item.b} = ?`;

        card.className = 'math-row-card bg-white rounded-2xl py-2.5 px-3 sm:py-3 sm:px-4 border-3 border-amber-400 shadow-game-card flex flex-col items-center justify-center text-center gap-1.5 w-full';
        card.innerHTML = `
          <div class="flex items-center justify-center gap-2 flex-wrap">
            <span class="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full">Slovní Úloha</span>
            <button type="button" onclick="toggleWordProblemFormula(${index})" id="formula-toggle-btn-${index}" class="text-[10px] font-black uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full border border-slate-300 transition-colors">
              👁️ Zobrazit příklad
            </button>
          </div>
          <p class="text-sm sm:text-base font-black text-slate-800 leading-snug font-nunito max-w-2xl mx-auto">${item.story}</p>
          <div id="word-problem-formula-${index}" class="hidden text-xs font-black text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-xl inline-block">
            Zápis příkladu: <strong>${formulaText}</strong>
          </div>
          <div class="flex items-center justify-center gap-2 mt-0.5">
            <span class="text-xs font-black text-slate-600">Výsledek:</span>
            <input type="number" id="math-input-${index}" inputmode="numeric" placeholder="?" class="w-14 sm:w-16 h-9 sm:h-10 text-center text-xl font-black rounded-xl border-3 border-amber-400 bg-amber-50 focus:bg-white focus:outline-none text-indigo-900 shadow-inner">
            <span id="math-feedback-${index}" class="text-lg ml-1 w-5 text-center"></span>
          </div>
        `;
      } else {
        card.className = 'math-row-card bg-white rounded-2xl py-2 px-3 sm:py-2.5 sm:px-4 border-3 border-amber-300 shadow-game-card flex flex-nowrap items-center justify-between gap-2 overflow-x-auto';
        card.innerHTML = `
          <div class="flex items-center whitespace-nowrap select-none overflow-x-auto font-baloo text-2xl sm:text-3xl">${item.htmlRow}</div>
          <div class="flex items-center gap-1.5 whitespace-nowrap ml-auto">
            <input type="number" id="math-input-${index}" inputmode="numeric" placeholder="?" class="w-13 sm:w-15 h-9 sm:h-11 text-center text-lg sm:text-xl font-black rounded-xl border-3 border-amber-400 bg-amber-50 focus:bg-white focus:outline-none text-indigo-900 shadow-inner">
            <span id="math-feedback-${index}" class="text-lg ml-1 w-5 text-center"></span>
          </div>
        `;
      }
      gridContainer.appendChild(card);
    });

  } else {
    const isSentence = state.currentLevel === 7;
    if (isSentence) {
      gridContainer.className = 'w-full grid grid-cols-1 md:grid-cols-2 gap-2.5 py-0.5';
    } else if (state.gridCardCount === 6) {
      gridContainer.className = 'w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-0.5';
    } else if (state.gridCardCount === 10) {
      gridContainer.className = 'w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 py-0.5';
    } else {
      gridContainer.className = 'w-full grid grid-cols-2 sm:grid-cols-4 gap-2 py-0.5';
    }

    state.currentItems.forEach((item, index) => {
      const card = document.createElement('div');
      const padClass = isSentence ? 'p-2 sm:p-2.5 min-h-[72px]' : 'p-2 sm:p-2.5 min-h-[86px] sm:min-h-[92px]';
      card.className = `letter-card bg-white rounded-2xl ${padClass} border-3 border-amber-300 shadow-game-card flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-amber-400 relative`;

      const textDisplayHtml = renderReadingTextHtml(item.text);
      let emojiHtml = '';
      if (state.showImages && item.emoji) {
        emojiHtml = `<div class="h-5 sm:h-6 flex items-center justify-center mb-0.5 text-xl sm:text-2xl select-none leading-none">${item.emoji}</div>`;
      } else if (state.showImages && item.svg) {
        emojiHtml = `<div class="h-5 sm:h-6 flex items-center justify-center mb-0.5 select-none leading-none">${item.svg}</div>`;
      }

      let speakerBtnHtml = '';
      if (state.showSpeechButton) {
        speakerBtnHtml = `
          <button onclick="speakCardItem(event, '${item.text.replace(/'/g, "\\'")}')" class="absolute top-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-50 hover:bg-sky-100 text-sky-600 border border-slate-200 shadow-sm flex items-center justify-center text-[10px]" title="Výslovnost">
            🔊
          </button>
        `;
      }

      card.innerHTML = `
        ${speakerBtnHtml}
        ${emojiHtml}
        <div class="w-full flex items-center justify-center px-1">
          <span class="text-xl sm:text-3xl md:text-4xl font-black text-sky-800 game-font leading-tight select-none text-center flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            ${textDisplayHtml}
          </span>
        </div>
      `;

      card.addEventListener('click', () => {
        playTone(400 + (index % 8) * 45, 0.09, 'sine', 0.15);
        card.classList.add('scale-105', 'border-emerald-400', 'bg-emerald-50/50');
        setTimeout(() => card.classList.remove('scale-105', 'border-emerald-400', 'bg-emerald-50/50'), 220);
      });
      gridContainer.appendChild(card);
    });
  }
}

function selectCompareOption(index, sign) {
  document.getElementById(`math-input-${index}`).value = sign;
  const lt = document.getElementById(`cmp-${index}-lt`);
  const eq = document.getElementById(`cmp-${index}-eq`);
  const gt = document.getElementById(`cmp-${index}-gt`);

  [lt, eq, gt].forEach(b => {
    b.className = 'cmp-btn text-xl sm:text-2xl font-black w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300';
  });

  const selected = sign === '<' ? lt : (sign === '=' ? eq : gt);
  selected.className = 'cmp-btn text-xl sm:text-2xl font-black w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-600 text-white border-2 border-indigo-700 shadow-md';
  playTone(520, 0.08, 'sine', 0.15);
}

const DAILY_TOTAL_MAX_MINUTES = 30.0;

function detectRewardSubject(note, subjectHint) {
  if (subjectHint === 'reading' || subjectHint === 'math') return subjectHint;
  const text = String(note || '').toLowerCase();
  if (text.includes('čtení') || text.includes('hláskování') || text.includes('písmen') || text.includes('slabik') || text.includes('vět') || text.includes('ostrov čtení')) {
    return 'reading';
  }
  if (text.includes('matematika') || text.includes('minc') || text.includes('počt') || text.includes('úloh') || text.includes('ostrov počtů')) {
    return 'math';
  }
  return 'other';
}

function creditRewardMinutes(amount, note, subjectHint = '') {
  checkAndHandleDailyResets();
  const numAmount = Math.max(0, Math.round((Number(amount) || 0) * 100) / 100);
  if (numAmount <= 0) {
    updateBalanceUI();
    return;
  }

  recordTraceabilityMinutes(numAmount);

  const subj = detectRewardSubject(note, subjectHint);
  const currentEarnedToday = Math.max(0, Number(state.dailyEarnedToday) || 0);

  state.dailyEarnedToday = Math.round((currentEarnedToday + numAmount) * 100) / 100;
  if (subj === 'reading') {
    state.dailyReadingEarnedToday = Math.round(((state.dailyReadingEarnedToday || 0) + numAmount) * 100) / 100;
  } else if (subj === 'math') {
    state.dailyMathEarnedToday = Math.round(((state.dailyMathEarnedToday || 0) + numAmount) * 100) / 100;
  }

  state.minutesBalance = Math.round((state.minutesBalance + numAmount) * 100) / 100;
  state.vaultBalance = 0.0;

  state.history.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('cs-CZ'),
    type: 'earned',
    minutes: numAmount,
    note: `${note} (+${formatMinutes(numAmount)})`
  });

  updateBalanceUI();
}

function evaluateMathTasks() {
  let allFilled = true;
  let allCorrect = true;
  let correctCount = 0;

  state.currentItems.forEach((item, index) => {
    const inputEl = document.getElementById(`math-input-${index}`);
    const feedbackEl = document.getElementById(`math-feedback-${index}`);
    const cardEl = document.getElementById(`math-card-${index}`);
    const val = inputEl ? inputEl.value.trim() : '';

    if (val === '') allFilled = false;

    if (val === item.correctAnswer) {
      correctCount++;
      feedbackEl.textContent = '✅';
      cardEl.classList.remove('border-amber-300', 'border-amber-400', 'border-rose-400');
      cardEl.classList.add('border-emerald-400', 'bg-emerald-50/40');
    } else {
      allCorrect = false;
      if (val !== '') {
        feedbackEl.textContent = '❌';
        cardEl.classList.remove('border-amber-300', 'border-amber-400', 'border-emerald-400');
        cardEl.classList.add('border-rose-400', 'bg-rose-50/40');
      } else {
        feedbackEl.textContent = '';
      }
    }
  });

  const statusEl = document.getElementById('math-eval-status');
  if (!allFilled) {
    statusEl.innerHTML = '<span class="text-amber-600 font-bold">Vyplň nejdříve všechny příklady!</span>';
    soundShuffle();
    return;
  }

  if (allCorrect) {
    statusEl.innerHTML = '<span class="text-emerald-600 font-black">Všechno správně! Skvělá práce! 🎉</span>';
    const lvl = state.currentMathLevel;
    const reward = getLevelReward('math', lvl);
    const catNames = ['Skládání mincí', 'Porovnávání', 'Číselná řada', 'Počítadlo', 'Rozklad čísel', 'Slovní úlohy'];
    const mathStatKeyMap = {
      1: 'coins',
      2: 'comparisons',
      3: 'sequences',
      4: 'examples',
      5: 'decompositions',
      6: 'wordProblems'
    };
    recordTraceabilityPractice(mathStatKeyMap[lvl] || 'examples', 1, true);
    creditRewardMinutes(reward, `Matematika: ${catNames[lvl - 1]}`, 'math');
    updateDailyQuestsProgress('math', lvl);
    saveState();
    playCustomSuccessSound();
    triggerConfetti();

    setTimeout(() => { generateLessonItems(); }, 1600);
  } else {
    statusEl.innerHTML = `<span class="text-rose-600 font-bold">Správně máš ${correctCount} z ${state.currentItems.length}. Zkus opravit chyby!</span>`;
    soundError();
  }
}

function updateFlashcardDisplay() {
  if (!state.currentItems.length) return;
  const current = state.currentItems[state.flashcardIndex];
  const badge = document.getElementById('flash-badge');
  const text = document.getElementById('flash-text');
  const img = document.getElementById('flash-image');
  const speakBtn = document.getElementById('flash-speak-btn');

  if (speakBtn) speakBtn.classList.toggle('hidden', !state.showSpeechButton);
  badge.textContent = `Karta ${state.flashcardIndex + 1} z ${state.currentItems.length}`;
  text.innerHTML = renderReadingTextHtml(current.text);
  
  if (img) {
    if (!state.showImages) img.innerHTML = '';
    else if (current.svg) img.innerHTML = current.svg;
    else img.textContent = current.emoji || '';
  }

  text.className = (state.currentLevel === 7)
    ? 'text-2xl sm:text-4xl md:text-5xl font-black text-sky-800 tracking-normal game-font my-2 leading-relaxed break-words flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2'
    : 'text-4xl sm:text-6xl md:text-7xl font-black text-sky-700 tracking-normal game-font my-2 flex flex-wrap items-center justify-center';
}

function prevFlashcard() {
  if (state.flashcardIndex > 0) {
    state.flashcardIndex--;
    playTone(380, 0.08, 'sine', 0.1);
    updateFlashcardDisplay();
  }
}

function nextFlashcard() {
  if (state.flashcardIndex < state.currentItems.length - 1) {
    state.flashcardIndex++;
    playTone(480, 0.08, 'sine', 0.1);
    updateFlashcardDisplay();
  }
}

function getReadingStatKeyForLevel(lvl) {
  if (lvl === 1) return 'letters';
  if (lvl === 2) return 'syllables';
  if (lvl === 7) return 'sentences';
  if (lvl === 8) return 'spelling';
  return 'words';
}

function parentReview(isSuccess) {
  clearSpellingTimers();

  if (isSuccess) {
    const lvl = state.currentLevel;
    const reward = getLevelReward('reading', lvl);
    const catNames = ['Písmena', 'Slabiky', 'Jednoslabičná', 'Dvouslabičná', 'Shluky/OU', 'DĚ/TĚ/NĚ', 'Věty', 'Hláskování'];
    const statKey = getReadingStatKeyForLevel(lvl);

    recordTraceabilityPractice(statKey, 1, true);
    creditRewardMinutes(reward, `Čtení: ${catNames[lvl - 1]}`, 'reading');
    updateDailyQuestsProgress('reading', lvl);
    saveState();
    playCustomSuccessSound();
    triggerConfetti();
    setTimeout(() => { generateLessonItems(); }, 500);
  } else {
    soundShuffle();
    generateLessonItems();
  }
}

/* ============================================================
   HODNOCENÍ ČTENÍ: POUZE DO DENNÍCH MISÍ (BEZ MINUT)
   ============================================================ */

function parentReviewOnlyQuest() {
  clearSpellingTimers();

  const lvl = state.currentLevel;
  const statKey = getReadingStatKeyForLevel(lvl);

  recordTraceabilityPractice(statKey, 1, true);
  updateDailyQuestsProgress('reading', lvl);
  saveState();
  playCustomSuccessSound();
  triggerConfetti();
  alertUserFeedback('Započteno do denních úkolů! 👍 (0 min)');
  setTimeout(() => { generateLessonItems(); }, 500);
}

/* ============================================================
   DENNÍ ŘADA (STREAK)
   ============================================================ */

function syncTrackerQuestsWithState() {
  if (!state.quests || !Array.isArray(state.quests)) return;
  const qTest = state.quests.find(q => q.id === 'q_test');
  if (qTest) {
    if (state.testDoneToday) {
      qTest.progress = 1;
      qTest.claimed = true;
    } else {
      qTest.progress = 0;
      qTest.claimed = false;
    }
  }
  const qArena = state.quests.find(q => q.id === 'q_arena');
  if (qArena && state.petSystem && typeof state.petSystem.battlesToday === 'number') {
    qArena.progress = Math.min(qArena.target, Math.max(qArena.progress || 0, state.petSystem.battlesToday));
    if (qArena.progress >= qArena.target) {
      qArena.claimed = true;
    }
  }
  const qColor = state.quests.find(q => q.id === 'q_coloring');
  if (qColor && qColor.progress >= qColor.target) {
    qColor.claimed = true;
  }
}

function checkStreakStatus() {
  syncTrackerQuestsWithState();
  const mainQuest = state.quests.find(q => q.id === 'q_daily_all' || !q.isTrackerOnly);
  const isMainDone = mainQuest && mainQuest.claimed;
  const today = getTodayDateString();

  if (isMainDone && !state.streakTodayCompleted) {
    state.streakTodayCompleted = true;
    state.streakLastActiveDate = today;
    state.streakDays = (state.streakDays || 0) + 1;
    
    const currentDayInCycle = ((state.streakDays - 1) % 7) + 1;
    if (currentDayInCycle === 7) {
      state.streakClaimedDay7 = false;
    }

    alertUserFeedback(`🔥 Denní řada započtena! Pokračuješ na ${state.streakDays} ${czechNounForm(state.streakDays, 'den', 'dny', 'dní')}!`);
    playCustomSuccessSound();
    triggerConfetti();
    saveState();
  }
  updateTopBadges();
  renderStreakView();
}

function claimStreakDiamondDay7() {
  const days = state.streakDays || 0;
  const currentDayInCycle = days > 0 ? (((days - 1) % 7) + 1) : 0;

  if (currentDayInCycle !== 7) {
    soundError();
    alertUserFeedback('K zisku diamantu potřebuješ dokončit plnou 7-denní řadu!');
    return;
  }

  if (state.streakClaimedDay7) {
    soundShuffle();
    alertUserFeedback('Diamant za tuto 7-denní řadu už máš vyzvednutý!');
    return;
  }

  state.streakClaimedDay7 = true;
  state.goldDiamonds = (state.goldDiamonds || 0) + 1;
  recordTraceabilityDiamonds(1);

  state.history.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('cs-CZ'),
    type: 'streak_diamond',
    minutes: 0,
    note: `Vyzvednut diamant za 7. den v řadě (+1 💎)`
  });

  saveState();
  playCustomSuccessSound();
  triggerConfetti();
  updateBalanceUI();
  updateTopBadges();
  updateDiamondMarketUI();
  renderStreakView();
  alertUserFeedback('💎 Paráda! 1 Modrý Diamant byl připsán na tvůj účet!');
}

function showStreakTab() {
  showView('quests');
  switchQuestsSubTab('streak');
}

function switchQuestsSubTab(subTabKey) {
  const btnTasks = document.getElementById('subtab-btn-tasks');
  const btnStreak = document.getElementById('subtab-btn-streak');
  const contentTasks = document.getElementById('subtab-content-tasks');
  const contentStreak = document.getElementById('subtab-content-streak');

  if (subTabKey === 'streak') {
    btnStreak.className = 'flex-1 py-1.5 px-2.5 rounded-xl font-black text-xs sm:text-sm transition-all bg-orange-500 text-white shadow-sm flex items-center justify-center gap-1.5';
    btnTasks.className = 'flex-1 py-1.5 px-2.5 rounded-xl font-black text-xs sm:text-sm transition-all text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1.5';
    contentTasks.classList.add('hidden');
    contentStreak.classList.remove('hidden');
    renderStreakView();
  } else {
    btnTasks.className = 'flex-1 py-1.5 px-2.5 rounded-xl font-black text-xs sm:text-sm transition-all bg-indigo-600 text-white shadow-sm flex items-center justify-center gap-1.5';
    btnStreak.className = 'flex-1 py-1.5 px-2.5 rounded-xl font-black text-xs sm:text-sm transition-all text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1.5';
    contentStreak.classList.add('hidden');
    contentTasks.classList.remove('hidden');
    renderDailyQuests();
  }
  playTone(520, 0.08, 'sine', 0.12);
}

function renderStreakView() {
  const days = state.streakDays || 0;
  const heroDays = document.getElementById('streak-hero-days');
  const heroDesc = document.getElementById('streak-hero-desc');
  const largeFlame = document.getElementById('streak-large-flame');
  const weekTrack = document.getElementById('streak-week-track');

  if (heroDays) heroDays.textContent = `${days} ${czechNounForm(days, 'DEN', 'DNY', 'DNÍ')}`;

  const mainQuest = state.quests.find(q => q.id === 'q_daily_all' || !q.isTrackerOnly);
  const mainProg = mainQuest ? mainQuest.progress : 0;

  if (heroDesc) {
    if (state.streakTodayCompleted) {
      heroDesc.innerHTML = '🎉 <strong class="text-yellow-200">Dnešní den je splněn!</strong> Řada je v bezpečí.';
      largeFlame.className = 'text-6xl sm:text-7xl select-none flame-active scale-110';
    } else {
      heroDesc.innerHTML = `Splň dnes <strong class="text-white underline">16× cvičení (Čtení nebo Matematika)</strong> (${mainProg}/16) a získej alespoň 15 min odměn k započtení dneška!`;
      largeFlame.className = 'text-6xl sm:text-7xl select-none opacity-80';
    }
  }

  if (weekTrack) {
    weekTrack.innerHTML = '';
    const currentDayInCycle = days > 0 ? (((days - 1) % 7) + 1) : 0;

    for (let i = 1; i <= 7; i++) {
      const isPast = days > 0 && i < currentDayInCycle;
      const isCurrent = days > 0 && i === currentDayInCycle;
      const isDiamondDay = i === 7;

      const dayCard = document.createElement('div');
      
      if (isDiamondDay) {
        const canClaimDiamond = (isCurrent && !state.streakClaimedDay7);
        const alreadyClaimed = state.streakClaimedDay7;

        dayCard.className = `p-1.5 sm:p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${
          canClaimDiamond 
            ? 'cursor-pointer bg-gradient-to-tr from-cyan-400 to-blue-500 text-white border-yellow-300 shadow-xl scale-105 ring-4 ring-yellow-300 animate-pulse'
            : alreadyClaimed
              ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
              : 'bg-slate-50 border-cyan-200 text-slate-400'
        }`;

        if (canClaimDiamond) {
          dayCard.onclick = () => claimStreakDiamondDay7();
        }

        dayCard.innerHTML = `
          <span class="text-[9px] sm:text-[10px] font-black uppercase">7. den</span>
          <span class="text-2xl sm:text-3xl my-0.5 select-none ${canClaimDiamond ? 'animate-bounce' : ''}">${alreadyClaimed ? '✅' : '💎'}</span>
          <span class="text-[8px] sm:text-[9px] font-black uppercase ${canClaimDiamond ? 'text-yellow-200 underline' : ''}">
            ${alreadyClaimed ? 'Vyzvednuto' : canClaimDiamond ? 'KLIKNI ZDE!' : '+1 💎'}
          </span>
        `;
      } else {
        dayCard.className = `p-1.5 sm:p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${
          isCurrent ? 'bg-orange-500 border-amber-300 text-white shadow-lg scale-105 ring-2 ring-orange-300' : isPast ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
        }`;

        dayCard.innerHTML = `
          <span class="text-[9px] sm:text-[10px] font-black uppercase">${i}. den</span>
          <span class="text-xl sm:text-2xl my-0.5 select-none">${isPast || isCurrent ? '🔥' : '⚪'}</span>
          <span class="text-[8px] sm:text-[9px] font-black uppercase">${isPast ? 'Hotovo' : (isCurrent ? 'Dnes' : 'Čeká')}</span>
        `;
      }

      weekTrack.appendChild(dayCard);
    }
  }
}

function updateDailyQuestsProgress(subj, completedLvl) {
  checkAndHandleDailyResets();
  let questCompletedNow = false;

  state.quests.forEach(q => {
    if (!q.claimed) {
      const matchedThisStep = Boolean(q.matches && q.matches(subj, completedLvl));
      if (matchedThisStep && q.progress < q.target) {
        q.progress++;
      }

      if (q.progress >= q.target) {
        if (q.isTrackerOnly) {
          questCompletedNow = true;
          q.claimed = true;
        } else if (matchedThisStep) {
          const qRate = getQuestRewardRate(q.id);
          const totalWithQuest = Math.round(((state.dailyEarnedToday || 0) + qRate) * 100) / 100;
          if (totalWithQuest >= 15) {
            questCompletedNow = true;
            q.claimed = true;
            creditRewardMinutes(qRate, `Denní úkol: ${q.title}`);
            alertUserFeedback(`🎯 Splněn denní úkol "${q.title}"! Získáváš +${formatMinutes(qRate)} ⭐`);
          } else {
            const missingMin = Math.max(0, Math.round((15 - totalWithQuest) * 100) / 100);
            alertUserFeedback(`Máš 16/16 cvičení! Pro splnění denního úkolu získej ještě ${formatMinutes(missingMin)} odměn za hraní (podmínka alespoň 15 min).`);
          }
        }
      }
    }
  });

  syncTrackerQuestsWithState();
  syncTraceabilityQuestsIfActive();

  if (questCompletedNow) playTone(900, 0.25, 'triangle', 0.3);
  saveState();
  updateBalanceUI();
  checkStreakStatus();
  updateTopBadges();
}

/* ============================================================
   HERNÍ OBCHOD (LÍSTKY, SKINY, TAPETY, ZVUKY)
   ============================================================ */

function getItemPrice(category, id, defaultPrice) {
  const key = `${category}_${id}`;
  if (state.itemPrices && state.itemPrices[key] !== undefined) {
    return state.itemPrices[key];
  }
  return defaultPrice;
}

function setItemPrice(category, id, newPrice) {
  if (!state.itemPrices) state.itemPrices = {};
  state.itemPrices[`${category}_${id}`] = Math.max(0, parseInt(newPrice, 10) || 0);
  saveState();
  renderStoreSkinsUI();
  updateAdminSkinsUI();
}

function showStoreTab(tabKey) {
  showView('store');
  switchStoreTab(tabKey);
}

function switchStoreTab(tabKey) {
  const tabs = ['tickets', 'skins', 'pets', 'themes', 'sounds', 'diamonds'];
  const activeGradients = {
    tickets: 'bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white shadow-lg border-2 border-amber-300',
    skins: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md',
    pets: 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md',
    themes: 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md',
    sounds: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md',
    diamonds: 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
  };

  const targetKey = tabs.includes(tabKey) ? tabKey : 'tickets';

  tabs.forEach(key => {
    const btn = document.getElementById(`store-tab-btn-${key}`);
    const content = document.getElementById(`store-tab-content-${key}`);
    if (btn) {
      if (key === 'tickets') {
        if (key === targetKey) {
          btn.className = `w-full py-3.5 px-3.5 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-start gap-2.5 text-left whitespace-nowrap ${activeGradients.tickets}`;
        } else {
          btn.className = 'w-full py-3.5 px-3.5 rounded-2xl font-black text-sm sm:text-base transition-all bg-amber-50/90 text-amber-950 border-2 border-amber-300 hover:bg-amber-100 shadow-sm flex items-center justify-start gap-2.5 text-left whitespace-nowrap';
        }
      } else if (key === targetKey) {
        btn.className = `w-full py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-start gap-2.5 text-left whitespace-nowrap ${activeGradients[key]}`;
      } else {
        btn.className = 'w-full py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all text-slate-600 hover:bg-white hover:shadow-sm flex items-center justify-start gap-2.5 text-left whitespace-nowrap';
      }
    }
    if (content) {
      if (key === targetKey) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    }
  });

  if (targetKey === 'pets') {
    if (typeof renderStorePetsUI === 'function') renderStorePetsUI();
  } else if (targetKey === 'skins' || targetKey === 'themes' || targetKey === 'sounds') {
    renderStoreSkinsUI();
  } else if (targetKey === 'diamonds' || targetKey === 'tickets') {
    updateDiamondMarketUI();
  }
  playTone(520, 0.08, 'sine', 0.12);
}

function switchSkinsCategory(subCat) {
  if (subCat === 'themes') {
    switchStoreTab('themes');
  } else if (subCat === 'sounds') {
    switchStoreTab('sounds');
  } else {
    switchStoreTab('skins');
  }
}

function renderStoreSkinsUI() {
  const diaCounter = document.getElementById('skins-diamonds-counter');
  if (diaCounter) diaCounter.textContent = (state.goldDiamonds || 0).toString();

  const custom = state.customizations || DEFAULT_UNLOCKED_CUSTOMIZATIONS;

  const avatarsContainer = document.getElementById('store-avatars-grid');
  if (avatarsContainer) {
    avatarsContainer.innerHTML = '';
    AVATAR_SKINS_DATABASE.forEach(skin => {
      const price = getItemPrice('skin', skin.id, skin.price);
      const isUnlocked = custom.unlockedSkins.includes(skin.id);
      const isActive = custom.activeSkin === skin.id;

      const card = document.createElement('div');
      const frameMod = isActive
        ? 'store-card-frame--active'
        : isUnlocked
          ? 'store-card-frame--emerald'
          : 'store-card-frame--indigo';
      card.className = `store-card-frame ${frameMod} p-3 flex flex-col justify-between text-center`;

      card.innerHTML = `
        <div>
          <div class="w-16 h-16 mx-auto mb-2 flex items-center justify-center rounded-2xl bg-white/90 border-2 border-slate-200/80 shadow-inner">
            ${skin.svg}
          </div>
          <h4 class="text-xs sm:text-sm font-black text-slate-800">${skin.name}</h4>
        </div>
        <div class="mt-2.5">
          ${
            isActive 
              ? `<span class="text-xs font-black text-amber-800 bg-amber-300/80 border border-amber-400 px-2.5 py-1.5 rounded-xl block">NASAZENO ⭐</span>`
              : isUnlocked 
                ? `<button onclick="equipSkin('${skin.id}')" class="game-button w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-1.5 rounded-xl border-b-4 border-emerald-700 text-xs shadow-sm">Nasadit skin</button>`
                : `<button onclick="buySkinAction('${skin.id}')" class="game-button w-full bg-gradient-to-b from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 text-white font-black py-1.5 rounded-xl border-b-4 border-sky-800 text-xs shadow-sm flex items-center justify-center gap-1"><span>${price}</span> 💎</button>`
          }
        </div>
      `;
      avatarsContainer.appendChild(card);
    });
  }

  const themesContainer = document.getElementById('store-themes-grid');
  if (themesContainer) {
    themesContainer.innerHTML = '';
    APP_THEMES_DATABASE.forEach(theme => {
      const price = getItemPrice('theme', theme.id, theme.price);
      const isUnlocked = custom.unlockedThemes.includes(theme.id);
      const isActive = custom.activeTheme === theme.id;

      const card = document.createElement('div');
      const frameMod = isActive
        ? 'store-card-frame--active'
        : isUnlocked
          ? 'store-card-frame--emerald'
          : 'store-card-frame--purple';
      card.className = `store-card-frame ${frameMod} p-3 flex flex-col justify-between text-center`;

      card.innerHTML = `
        <div>
          <div class="w-full h-14 rounded-xl mb-2 shadow-inner border-2 border-white/60 flex items-center justify-center text-xs font-black text-white" style="background: ${theme.previewGradient};">
            ${theme.name}
          </div>
        </div>
        <div class="mt-2">
          ${
            isActive 
              ? `<span class="text-xs font-black text-amber-800 bg-amber-300/80 border border-amber-400 px-2.5 py-1.5 rounded-xl block">AKTIVNÍ TAPETA 🌍</span>`
              : isUnlocked 
                ? `<button onclick="equipTheme('${theme.id}')" class="game-button w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-1.5 rounded-xl border-b-4 border-emerald-700 text-xs shadow-sm">Nastavit tapetu</button>`
                : `<button onclick="buyThemeAction('${theme.id}')" class="game-button w-full bg-gradient-to-b from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 text-white font-black py-1.5 rounded-xl border-b-4 border-sky-800 text-xs shadow-sm flex items-center justify-center gap-1"><span>${price}</span> 💎</button>`
          }
        </div>
      `;
      themesContainer.appendChild(card);
    });
  }

  const soundsContainer = document.getElementById('store-sounds-grid');
  if (soundsContainer) {
    soundsContainer.innerHTML = '';
    SOUND_PACKS_DATABASE.forEach(snd => {
      const price = getItemPrice('sound', snd.id, snd.price);
      const isUnlocked = custom.unlockedSounds.includes(snd.id);
      const isActive = custom.activeSound === snd.id;

      const card = document.createElement('div');
      const frameMod = isActive
        ? 'store-card-frame--active'
        : isUnlocked
          ? 'store-card-frame--emerald'
          : 'store-card-frame--sky';
      card.className = `store-card-frame ${frameMod} p-3 flex flex-col justify-between text-center`;

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="w-9 h-9 rounded-xl bg-white/90 border border-sky-200 flex items-center justify-center text-lg shadow-inner">🔔</span>
            <button onclick="playSoundById('${snd.id}')" class="game-button bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-200 px-2.5 py-1 rounded-xl text-xs font-bold" title="Poslechnout zvuk">
              🔊
            </button>
          </div>
          <h4 class="text-xs sm:text-sm font-black text-slate-800">${snd.name}</h4>
        </div>
        <div class="mt-2.5">
          ${
            isActive 
              ? `<span class="text-xs font-black text-amber-800 bg-amber-300/80 border border-amber-400 px-2.5 py-1.5 rounded-xl block">AKTIVNÍ ZVUK 🔊</span>`
              : isUnlocked 
                ? `<button onclick="equipSound('${snd.id}')" class="game-button w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-1.5 rounded-xl border-b-4 border-emerald-700 text-xs shadow-sm">Zvolit zvuk</button>`
                : `<button onclick="buySoundAction('${snd.id}')" class="game-button w-full bg-gradient-to-b from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 text-white font-black py-1.5 rounded-xl border-b-4 border-sky-800 text-xs shadow-sm flex items-center justify-center gap-1"><span>${price}</span> 💎</button>`
          }
        </div>
      `;
      soundsContainer.appendChild(card);
    });
  }
}

function buySkinAction(skinId) {
  const skin = AVATAR_SKINS_DATABASE.find(s => s.id === skinId);
  if (!skin) return;
  const price = getItemPrice('skin', skin.id, skin.price);

  if ((state.goldDiamonds || 0) < price) {
    soundError();
    alertUserFeedback(`Potřebuješ ${price} diamantů 💎 (máš jen ${state.goldDiamonds || 0}).`);
    return;
  }

  state.goldDiamonds -= price;
  if (!state.customizations.unlockedSkins.includes(skinId)) {
    state.customizations.unlockedSkins.push(skinId);
  }
  state.customizations.activeSkin = skinId;

  saveState();
  soundPurchase();
  triggerConfetti();
  updateBalanceUI();
  updateTopBadges();
  updateTopAvatarDisplay();
  renderStoreSkinsUI();
  alertUserFeedback(`Skin "${skin.name}" odemčen a nasazen! 🥳`);
}

function equipSkin(skinId) {
  state.customizations.activeSkin = skinId;
  saveState();
  updateTopAvatarDisplay();
  renderStoreSkinsUI();
  playTone(600, 0.1, 'sine', 0.15);
  alertUserFeedback('Skin nasazen!');
}

function buyThemeAction(themeId) {
  const theme = APP_THEMES_DATABASE.find(t => t.id === themeId);
  if (!theme) return;
  const price = getItemPrice('theme', theme.id, theme.price);

  if ((state.goldDiamonds || 0) < price) {
    soundError();
    alertUserFeedback(`Potřebuješ ${price} diamantů 💎 (máš jen ${state.goldDiamonds || 0}).`);
    return;
  }

  state.goldDiamonds -= price;
  if (!state.customizations.unlockedThemes.includes(themeId)) {
    state.customizations.unlockedThemes.push(themeId);
  }
  state.customizations.activeTheme = themeId;

  saveState();
  applyCurrentTheme();
  soundPurchase();
  triggerConfetti();
  updateBalanceUI();
  updateTopBadges();
  renderStoreSkinsUI();
  alertUserFeedback(`Tapeta "${theme.name}" odemčena a nastavena! 🌌`);
}

function equipTheme(themeId) {
  state.customizations.activeTheme = themeId;
  applyCurrentTheme();
  saveState();
  renderStoreSkinsUI();
  playTone(600, 0.1, 'sine', 0.15);
  alertUserFeedback('Tapeta nastavena!');
}

function buySoundAction(soundId) {
  const snd = SOUND_PACKS_DATABASE.find(s => s.id === soundId);
  if (!snd) return;
  const price = getItemPrice('sound', snd.id, snd.price);

  if ((state.goldDiamonds || 0) < price) {
    soundError();
    alertUserFeedback(`Potřebuješ ${price} diamantů 💎 (máš jen ${state.goldDiamonds || 0}).`);
    return;
  }

  state.goldDiamonds -= price;
  if (!state.customizations.unlockedSounds.includes(soundId)) {
    state.customizations.unlockedSounds.push(soundId);
  }
  state.customizations.activeSound = soundId;

  saveState();
  playSoundById(soundId);
  soundPurchase();
  triggerConfetti();
  updateBalanceUI();
  updateTopBadges();
  renderStoreSkinsUI();
  alertUserFeedback(`Zvuk "${snd.name}" odemčen! 🔔`);
}

function equipSound(soundId) {
  state.customizations.activeSound = soundId;
  playSoundById(soundId);
  saveState();
  renderStoreSkinsUI();
  alertUserFeedback('Oslavný zvuk aktivován!');
}

function applyCurrentTheme() {
  const body = document.getElementById('app-body');
  if (!body) return;
  const current = state.customizations ? state.customizations.activeTheme : 'theme-sky';
  
  body.classList.remove(
    'theme-sky', 'theme-gold', 'theme-space', 
    'theme-wallpaper-minecraft', 'theme-wallpaper-pokemon', 'theme-wallpaper-sonic'
  );
  body.classList.add(current);
}

function updateTopAvatarDisplay() {
  const container = document.getElementById('top-avatar-display');
  if (!container) return;

  const activeId = state.customizations ? state.customizations.activeSkin : 'steve';
  const skin = AVATAR_SKINS_DATABASE.find(s => s.id === activeId) || AVATAR_SKINS_DATABASE[0];

  container.innerHTML = skin.svg;
}

function updateAdminSkinsUI() {
  const custom = state.customizations || DEFAULT_UNLOCKED_CUSTOMIZATIONS;

  const skinsList = document.getElementById('admin-skins-list-container');
  if (skinsList) {
    skinsList.innerHTML = '';
    AVATAR_SKINS_DATABASE.forEach(s => {
      const price = getItemPrice('skin', s.id, s.price);
      const isUnlocked = custom.unlockedSkins.includes(s.id);

      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-2 rounded-xl bg-white border border-pink-200 text-xs font-bold';
      row.innerHTML = `
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 flex items-center justify-center">${s.svg}</div>
          <span class="truncate max-w-[120px] text-slate-800">${s.name}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <input type="number" min="0" max="100" value="${price}" onchange="setItemPrice('skin', '${s.id}', this.value)" class="w-12 text-center font-black py-0.5 px-1 border border-pink-300 rounded-lg bg-pink-50 text-indigo-950 text-xs">
          <span class="text-xs">💎</span>
          <button onclick="adminToggleUnlockItem('skin', '${s.id}')" class="px-2 py-0.5 rounded-lg text-[10px] font-black ${isUnlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
            ${isUnlocked ? 'Odemčeno' : 'Zamčeno'}
          </button>
        </div>
      `;
      skinsList.appendChild(row);
    });
  }

  const themesList = document.getElementById('admin-themes-list-container');
  if (themesList) {
    themesList.innerHTML = '';
    APP_THEMES_DATABASE.forEach(t => {
      const price = getItemPrice('theme', t.id, t.price);
      const isUnlocked = custom.unlockedThemes.includes(t.id);

      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-2 rounded-xl bg-white border border-pink-200 text-xs font-bold';
      row.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full border border-black/20" style="background: ${t.previewGradient}"></span>
          <span class="truncate max-w-[120px] text-slate-800">${t.name}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <input type="number" min="0" max="100" value="${price}" onchange="setItemPrice('theme', '${t.id}', this.value)" class="w-12 text-center font-black py-0.5 px-1 border border-pink-300 rounded-lg bg-pink-50 text-indigo-950 text-xs">
          <span class="text-xs">💎</span>
          <button onclick="adminToggleUnlockItem('theme', '${t.id}')" class="px-2 py-0.5 rounded-lg text-[10px] font-black ${isUnlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
            ${isUnlocked ? 'Odemčeno' : 'Zamčeno'}
          </button>
        </div>
      `;
      themesList.appendChild(row);
    });
  }

  const soundsList = document.getElementById('admin-sounds-list-container');
  if (soundsList) {
    soundsList.innerHTML = '';
    SOUND_PACKS_DATABASE.forEach(snd => {
      const price = getItemPrice('sound', snd.id, snd.price);
      const isUnlocked = custom.unlockedSounds.includes(snd.id);

      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-2 rounded-xl bg-white border border-pink-200 text-xs font-bold';
      row.innerHTML = `
        <div class="flex items-center gap-1">
          <span>🔊</span>
          <span class="truncate max-w-[120px] text-slate-800">${snd.name}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <input type="number" min="0" max="100" value="${price}" onchange="setItemPrice('sound', '${snd.id}', this.value)" class="w-12 text-center font-black py-0.5 px-1 border border-pink-300 rounded-lg bg-pink-50 text-indigo-950 text-xs">
          <span class="text-xs">💎</span>
          <button onclick="adminToggleUnlockItem('sound', '${snd.id}')" class="px-2 py-0.5 rounded-lg text-[10px] font-black ${isUnlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
            ${isUnlocked ? 'Odemčeno' : 'Zamčeno'}
          </button>
        </div>
      `;
      soundsList.appendChild(row);
    });
  }
}

function adminToggleUnlockItem(category, id) {
  if (!state.customizations) state.customizations = JSON.parse(JSON.stringify(DEFAULT_UNLOCKED_CUSTOMIZATIONS));
  let list = [];
  if (category === 'skin') list = state.customizations.unlockedSkins;
  else if (category === 'theme') list = state.customizations.unlockedThemes;
  else if (category === 'sound') list = state.customizations.unlockedSounds;

  if (list.includes(id)) {
    if (list.length > 1) {
      const idx = list.indexOf(id);
      list.splice(idx, 1);
    }
  } else {
    list.push(id);
  }

  saveState();
  updateAdminSkinsUI();
  renderStoreSkinsUI();
  playTone(550, 0.08, 'sine', 0.15);
}

function adminUnlockAllSkinsForTest(unlockAll = true) {
  if (!state.customizations) state.customizations = JSON.parse(JSON.stringify(DEFAULT_UNLOCKED_CUSTOMIZATIONS));
  if (unlockAll) {
    state.customizations.unlockedSkins = AVATAR_SKINS_DATABASE.map(s => s.id);
    state.customizations.unlockedThemes = APP_THEMES_DATABASE.map(t => t.id);
    state.customizations.unlockedSounds = SOUND_PACKS_DATABASE.map(s => s.id);
    alertUserFeedback('Všechny skiny, tapety i zvuky odemčeny pro test! 🚀');
  }
  saveState();
  updateAdminSkinsUI();
  renderStoreSkinsUI();
  playTone(660, 0.15, 'triangle', 0.25);
}

function updateDiamondMarketUI() {
  const diamondsCount = document.getElementById('store-diamonds-count');
  if (diamondsCount) diamondsCount.textContent = (state.goldDiamonds || 0).toString();

  const diamondsTopBadge = document.getElementById('store-diamonds-badge-top');
  if (diamondsTopBadge) diamondsTopBadge.textContent = (state.goldDiamonds || 0).toString();

  const maxLimit = getMaxDailyDirectLimit();
  const maxLimitDisplay = document.getElementById('store-current-max-limit-display');
  if (maxLimitDisplay) maxLimitDisplay.textContent = `${maxLimit} min`;

  const vaultLimitLabel = document.getElementById('vault-direct-limit-label');
  if (vaultLimitLabel) vaultLimitLabel.textContent = `${maxLimit} min`;

  const nextCost = getLimitExtensionCost();
  const rateBadge = document.getElementById('diamond-rate-badge');
  if (rateBadge) rateBadge.textContent = `${nextCost} 💎`;

  const dynTitle = document.getElementById('dynamic-package-title');
  const dynCost = document.getElementById('dynamic-package-cost');
  if (dynTitle) dynTitle.textContent = `${maxLimit} MINUT`;
  if (dynCost) dynCost.textContent = `${maxLimit} ⭐`;

  const pinDesc = document.getElementById('pin-card-description');
  if (state.goldDiamonds >= 50) {
    if (pinDesc) pinDesc.innerHTML = `<span class="text-yellow-300 font-black">Máš 50 diamantů! PIN je připraven k odemčení:</span>`;
  } else {
    if (pinDesc) pinDesc.textContent = `Nasbírej 50 diamantů k odemčení tajného PINu tabletu (zbývá ${50 - state.goldDiamonds} 💎).`;
  }

  updateVoucherStoreUI();
}

function updateVoucherStoreUI() {
  checkAndHandleDailyResets();
  const stdBought = state.dailyStandardVoucherBought;
  const maxBought = state.dailyMaxVoucherBought;

  const defaultTicketFrame = {
    5: 'store-card-frame--sky',
    10: 'store-card-frame--emerald',
    15: 'store-card-frame--purple'
  };

  [5, 10, 15].forEach(m => {
    const cardEl = document.getElementById(`voucher-card-${m}`);
    const badgeEl = document.getElementById(`voucher-badge-${m}`);
    const btnEl = document.getElementById(`voucher-btn-${m}`);

    if (stdBought === m) {
      if (cardEl) {
        cardEl.className = 'store-card-frame store-card-frame--emerald p-4 flex flex-col justify-between text-center relative';
      }
      if (badgeEl) {
        badgeEl.textContent = '✅ KOUPENO DNES';
        badgeEl.className = 'mb-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs inline-block mx-auto';
      }
      if (btnEl) {
        btnEl.textContent = `✅ Koupeno (${m} min)`;
        btnEl.className = 'w-full bg-emerald-600 text-white font-black py-2.5 rounded-xl border-b-4 border-emerald-800 text-xs sm:text-sm cursor-not-allowed opacity-95';
      }
    } else if (stdBought !== null) {
      if (cardEl) {
        cardEl.className = 'store-card-frame store-card-frame--disabled p-4 flex flex-col justify-between text-center opacity-75 relative';
      }
      if (badgeEl) {
        badgeEl.textContent = `🔒 Vyčerpáno`;
        badgeEl.className = 'mb-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-300 text-slate-700 inline-block mx-auto';
      }
      if (btnEl) {
        btnEl.textContent = '🔒 Limit vyčerpán';
        btnEl.className = 'w-full bg-slate-400 text-white font-black py-2.5 rounded-xl border-b-4 border-slate-500 text-xs cursor-not-allowed';
      }
    } else {
      if (cardEl) {
        cardEl.className = `store-card-frame ${defaultTicketFrame[m] || 'store-card-frame--amber'} p-4 flex flex-col justify-between text-center relative`;
      }
      if (badgeEl) {
        badgeEl.className = 'hidden mb-1 text-[10px] font-black px-2 py-0.5 rounded-full';
      }
      if (btnEl) {
        btnEl.textContent = 'Koupit lístek 🎟️';
        btnEl.className = m === 15
          ? 'game-button w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-2.5 rounded-xl border-b-4 border-orange-700 text-xs sm:text-sm shadow-game-btn'
          : 'game-button w-full bg-amber-400 hover:bg-amber-500 text-indigo-950 font-black py-2.5 rounded-xl border-b-4 border-amber-600 text-xs sm:text-sm shadow-game-btn';
      }
    }
  });

  const cardMax = document.getElementById('voucher-card-max');
  const badgeMax = document.getElementById('voucher-badge-max');
  const btnMax = document.getElementById('voucher-btn-max');

  if (maxBought !== null) {
    if (cardMax) {
      cardMax.className = 'store-card-frame store-card-frame--emerald p-4 flex flex-col justify-between text-center relative text-slate-800';
    }
    if (badgeMax) {
      badgeMax.textContent = `✅ KOUPENO DNES`;
      badgeMax.className = 'mt-1 mb-0.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs inline-block mx-auto';
    }
    if (btnMax) {
      btnMax.textContent = '✅ Koupeno dnes!';
      btnMax.className = 'w-full bg-emerald-600 text-white font-black py-2.5 rounded-xl border-b-4 border-emerald-800 text-xs sm:text-sm cursor-not-allowed';
    }
  } else {
    if (cardMax) {
      cardMax.className = 'store-card-frame store-card-frame--max p-4 flex flex-col justify-between text-center relative text-white';
    }
    if (badgeMax) {
      badgeMax.className = 'hidden mt-1 mb-0.5 text-[10px] font-black px-2 py-0.5 rounded-full';
    }
    if (btnMax) {
      btnMax.textContent = 'Koupit MAX lístek 🚀';
      btnMax.className = 'game-button w-full bg-emerald-400 hover:bg-emerald-300 text-indigo-950 font-black py-2.5 rounded-xl border-b-4 border-emerald-600 text-xs sm:text-sm shadow-game-btn';
    }
  }
}

function buyLimitExtension() {
  const currentCost = getLimitExtensionCost();
  if ((state.goldDiamonds || 0) < currentCost) {
    soundError();
    alertUserFeedback(`Potřebuješ ${currentCost} modrých diamantů 💎 (máš jen ${state.goldDiamonds || 0}).`);
    return;
  }

  state.goldDiamonds -= currentCost;
  state.bonusMaxLimitMinutes = (state.bonusMaxLimitMinutes || 0) + 1;
  const newMax = getMaxDailyDirectLimit();
  const nextCost = getLimitExtensionCost();

  state.history.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('cs-CZ'),
    type: 'limit_extended',
    minutes: 0,
    note: `Nákup za ${currentCost} 💎: Denní limit zvýšen na ${newMax} min!`
  });

  saveState();
  soundPurchase();
  triggerConfetti();
  updateBalanceUI();
  updateTopBadges();
  updateDiamondMarketUI();
  if (typeof updateAdminDiamondUI === 'function') updateAdminDiamondUI();
  alertUserFeedback(`Denní limit navýšen na ${newMax} minut! Další nákup bude za ${nextCost} 💎.`);
}

function revealSecretPinAction() {
  if ((state.goldDiamonds || 0) < 50) {
    soundError();
    alertUserFeedback(`K odemčení PINu potřebuješ 50 diamantů (máš ${state.goldDiamonds || 0} 💎).`);
    return;
  }
  soundSuccess();
  triggerConfetti();
  const pin = state.tabletSecretPin || 'XXXX';
  alertUserFeedback(`🎉 TAJNÝ PIN K TABLETU JE: ${pin}`);
}

function buyTimePackage(minutes, isMaxPackage = false) {
  checkAndHandleDailyResets();

  if (isMaxPackage) {
    if (state.dailyMaxVoucherBought !== null && state.dailyMaxVoucherBought !== undefined) {
      soundError();
      alertUserFeedback(`Dnes už byl MAXIMÁLNÍ poukaz (${state.dailyMaxVoucherBought} min) koupen! Další lze koupit po půlnoci. 🌙`);
      return;
    }
  } else {
    if (state.dailyStandardVoucherBought !== null && state.dailyStandardVoucherBought !== undefined) {
      soundError();
      alertUserFeedback(`Dnes už byl koupen poukaz na ${state.dailyStandardVoucherBought} min! Z kategorie 5/10/15 min lze koupit max 1 denně (reset o půlnoci). 🌙`);
      return;
    }
  }

  if (state.minutesBalance < minutes) {
    soundError();
    alertUserFeedback(`Máš ${formatMinutes(state.minutesBalance)}. Potřebuješ ${minutes} minut ⭐!`);
    return;
  }

  state.minutesBalance = Math.round((state.minutesBalance - minutes) * 100) / 100;
  state.vouchersBoughtDate = getTodayDateString();
  if (isMaxPackage) {
    state.dailyMaxVoucherBought = minutes;
  } else {
    state.dailyStandardVoucherBought = minutes;
  }

  state.history.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('cs-CZ'),
    type: 'spent',
    minutes: -minutes,
    note: `Vyzvednut ${isMaxPackage ? 'MAX ' : ''}poukaz: ${minutes} min na tabletu`
  });

  saveState();
  soundPurchase();
  triggerConfetti();

  const voucherModal = document.getElementById('voucher-modal');
  const voucherText = document.getElementById('voucher-text');
  if (voucherText) voucherText.textContent = `LÍSTEK NA ${minutes} MINUT HRANÍ JE TVŮJ! 🎮`;
  if (voucherModal) voucherModal.classList.remove('hidden');
  updateBalanceUI();
  updateVoucherStoreUI();
}

function buyDynamicTimePackage() {
  const currentMax = getMaxDailyDirectLimit();
  buyTimePackage(currentMax, true);
}

function closeVoucher() {
  const voucherModal = document.getElementById('voucher-modal');
  if (voucherModal) voucherModal.classList.add('hidden');
}

function showView(viewName) {
  clearSpellingTimers();

  const learnView = document.getElementById('view-learn');
  const storeView = document.getElementById('view-store');
  const questsView = document.getElementById('view-quests');
  const testView = document.getElementById('view-test');
  const arenaView = document.getElementById('view-arena');

  if (learnView) learnView.classList.add('hidden');
  if (storeView) storeView.classList.add('hidden');
  if (questsView) questsView.classList.add('hidden');
  if (testView) testView.classList.add('hidden');
  if (arenaView) arenaView.classList.add('hidden');

  const boardFrame = document.getElementById('main-game-board-frame');

  if (viewName === 'store') {
    if (storeView) storeView.classList.remove('hidden');
    if (boardFrame) boardFrame.setAttribute('data-board-mode', 'store');
    const storeBalEl = document.getElementById('store-balance-display');
    if (storeBalEl) storeBalEl.textContent = formatMinutes(state.minutesBalance).replace(' min', '');
    const vaultEl = document.getElementById('vault-display');
    if (vaultEl) vaultEl.textContent = formatMinutes(state.vaultBalance || 0);
    updateDiamondMarketUI();
    renderStoreSkinsUI();
    if (typeof renderStorePetsUI === 'function') renderStorePetsUI();
  } else if (viewName === 'quests') {
    if (questsView) questsView.classList.remove('hidden');
    if (boardFrame) boardFrame.setAttribute('data-board-mode', 'quests');
    switchQuestsSubTab('tasks');
  } else if (viewName === 'test') {
    if (testView) testView.classList.remove('hidden');
    if (boardFrame) boardFrame.setAttribute('data-board-mode', 'test');
  } else if (viewName === 'arena') {
    if (arenaView) arenaView.classList.remove('hidden');
    if (boardFrame) boardFrame.setAttribute('data-board-mode', 'arena');
    if (typeof renderArenaMainUI === 'function') renderArenaMainUI();
  } else {
    if (learnView) learnView.classList.remove('hidden');
    if (boardFrame) boardFrame.setAttribute('data-board-mode', state.subject === 'math' ? 'math' : 'reading');
  }
  updateBalanceUI();
  if (typeof updateTopPetCompanionWidget === 'function') updateTopPetCompanionWidget();
}

function formatCapNum(val) {
  const rounded = Math.round((Number(val) || 0) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace('.', ',');
}

function updateBalanceUI() {
  const displayTop = document.getElementById('top-balance-display');
  const displayStore = document.getElementById('store-balance-display');
  const displayAdmin = document.getElementById('admin-balance-display');
  const minutesDirectInp = document.getElementById('admin-minutes-direct-input');

  if (displayTop) displayTop.textContent = formatMinutes(state.minutesBalance).replace(' min', '');
  if (displayStore) displayStore.textContent = formatMinutes(state.minutesBalance).replace(' min', '');
  if (displayAdmin) displayAdmin.textContent = formatMinutes(state.minutesBalance);
  if (minutesDirectInp && document.activeElement !== minutesDirectInp) {
    minutesDirectInp.value = (Math.round((state.minutesBalance || 0) * 100) / 100).toString();
  }

  const mainQuest = Array.isArray(state.quests)
    ? state.quests.find(q => q.id === 'q_daily_all' || !q.isTrackerOnly)
    : null;
  const qProg = mainQuest ? Math.min(16, mainQuest.progress || 0) : 0;
  const qTarget = mainQuest ? (mainQuest.target || 16) : 16;
  const qDone = Boolean(mainQuest && (mainQuest.claimed || qProg >= qTarget));
  const totalEarnedToday = Math.min(30, Math.round((state.dailyEarnedToday || 0) * 100) / 100);

  const topReadingCapEl = document.getElementById('top-reading-cap-display');
  const topMathCapEl = document.getElementById('top-math-cap-display');
  if (topReadingCapEl) {
    topReadingCapEl.textContent = `${qProg}/${qTarget}`;
    topReadingCapEl.className = qDone ? 'text-emerald-700 font-black' : 'text-slate-900 font-black';
  }
  if (topMathCapEl) {
    topMathCapEl.textContent = `${formatCapNum(totalEarnedToday)}/30`;
    topMathCapEl.className = totalEarnedToday >= 30 ? 'text-emerald-700 font-black' : 'text-slate-900 font-black';
  }

  const diamondsTop = document.getElementById('top-diamonds-display');
  if (diamondsTop) diamondsTop.textContent = (state.goldDiamonds || 0).toString();

  const diamondsStoreBadge = document.getElementById('store-diamonds-badge-top');
  if (diamondsStoreBadge) diamondsStoreBadge.textContent = (state.goldDiamonds || 0).toString();
}

function updateTopBadges() {
  checkAndHandleDailyResets();
  syncTrackerQuestsWithState();
  
  const topStreakCount = document.getElementById('top-streak-count');
  if (topStreakCount) topStreakCount.textContent = (state.streakDays || 0).toString();

  const streakSubBadge = document.getElementById('streak-subtab-badge');
  if (streakSubBadge) streakSubBadge.textContent = `${state.streakDays || 0} dní`;

  const boxBadge = document.getElementById('top-box-badge');
  const boxBtn = document.getElementById('top-box-btn');
  const hasLegendaryWaiting = (state.legendaryChest && state.legendaryChest.active && !state.legendaryChest.claimed);
  const hasDailyWaiting = !state.boxClaimed;

  if (hasDailyWaiting || hasLegendaryWaiting) {
    boxBadge.classList.remove('hidden');
    boxBtn.classList.add('chest-ready');
    boxBadge.textContent = (hasDailyWaiting && hasLegendaryWaiting) ? '2' : '1';
  } else {
    boxBadge.classList.add('hidden');
    boxBtn.classList.remove('chest-ready');
  }

  const questsBadge = document.getElementById('top-quests-badge');
  const totalQuests = state.quests.length;
  const completedCount = state.quests.filter(q => q.claimed || q.progress >= q.target).length;
  const readyToClaimCount = state.quests.filter(q => !q.claimed && q.progress >= q.target).length;
  
  questsBadge.textContent = `${completedCount}/${totalQuests}`;
  const subQuestsBadge = document.getElementById('quests-subtab-badge');
  if (subQuestsBadge) subQuestsBadge.textContent = `${completedCount}/${totalQuests}`;

  if (readyToClaimCount > 0) {
    questsBadge.className = 'absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-black px-1.5 min-w-[20px] h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce';
  } else {
    questsBadge.className = 'absolute -top-1.5 -right-1.5 bg-amber-400 text-indigo-950 text-[10px] font-black px-1.5 min-w-[20px] h-5 rounded-full flex items-center justify-center border-2 border-white';
  }

  const diamondsTop = document.getElementById('top-diamonds-display');
  if (diamondsTop) diamondsTop.textContent = (state.goldDiamonds || 0).toString();

  const navTestBadge = document.getElementById('nav-test-badge');
  if (navTestBadge) navTestBadge.classList.toggle('hidden', state.testDoneToday);
}

function openDailyBoxModal() {
  checkAndHandleDailyResets();
  const modal = document.getElementById('daily-box-modal');
  const hasLegendary = (state.legendaryChest && state.legendaryChest.active && !state.legendaryChest.claimed);
  if (hasLegendary && state.boxClaimed) switchChestSubTab('legendary');
  else switchChestSubTab('daily');

  modal.classList.remove('hidden');
  playTone(600, 0.08, 'sine', 0.15);
}

function closeDailyBoxModal() {
  document.getElementById('daily-box-modal').classList.add('hidden');
}

function switchChestSubTab(tabKey) {
  const btnDaily = document.getElementById('chest-tab-btn-daily');
  const btnLegend = document.getElementById('chest-tab-btn-legendary');
  const contentDaily = document.getElementById('chest-tab-content-daily');
  const contentLegend = document.getElementById('chest-tab-content-legendary');
  const legendBadge = document.getElementById('legendary-chest-badge');

  const hasLegendary = (state.legendaryChest && state.legendaryChest.active && !state.legendaryChest.claimed);
  if (legendBadge) legendBadge.classList.toggle('hidden', !hasLegendary);

  if (tabKey === 'legendary') {
    btnLegend.className = 'flex-1 py-1 px-2 rounded-xl font-black text-xs transition-all bg-cyan-600 text-white shadow-sm flex items-center justify-center gap-1.5';
    btnDaily.className = 'flex-1 py-1 px-2 rounded-xl font-black text-xs transition-all text-amber-950 hover:bg-amber-200 flex items-center justify-center gap-1.5';
    contentDaily.classList.add('hidden');
    contentLegend.classList.remove('hidden');
    renderLegendaryChestTab();
  } else {
    btnDaily.className = 'flex-1 py-1 px-2 rounded-xl font-black text-xs transition-all bg-amber-500 text-white shadow-sm flex items-center justify-center gap-1.5';
    btnLegend.className = 'flex-1 py-1 px-2 rounded-xl font-black text-xs transition-all text-amber-950 hover:bg-amber-200 flex items-center justify-center gap-1.5';
    contentLegend.classList.add('hidden');
    contentDaily.classList.remove('hidden');
    renderDailyChestTab();
  }
  playTone(520, 0.08, 'sine', 0.12);
}

function getDailyChestConfig() {
  if (!state.dailyChestConfig) {
    state.dailyChestConfig = {
      minutesChance: 40,
      minutesMin: 0.5,
      minutesMax: 1.0,
      foodChance: 20,
      foodAmount: 1,
      reviveChance: 15,
      reviveAmount: 1,
      ticketChance: 10,
      ticketAmount: 1,
      diaSmallChance: 5,
      diaSmallAmount: 2,
      diaMedChance: 0.9,
      diaMedAmount: 10,
      diaJackpotChance: 0.1,
      diaJackpotAmount: 20
    };
  }
  if (state.dailyChestConfig.ticketChance === undefined) state.dailyChestConfig.ticketChance = 10;
  if (state.dailyChestConfig.ticketAmount === undefined) state.dailyChestConfig.ticketAmount = 1;
  return state.dailyChestConfig;
}

const DAILY_CHEST_IMG_URL = 'https://i.imgur.com/t1cvXEh.png';
const RARE_CHEST_IMG_URL = 'https://i.imgur.com/E6kB6Sg.png';

function triggerChestLootBurst(layerId, mainIcon, mainLabel, isRare = false) {
  const layer = document.getElementById(layerId);
  if (!layer) return;
  layer.innerHTML = '';

  // 1. Dvojitá tlaková vlna ze středu truhlice
  for (let r = 0; r < 2; r++) {
    const ring = document.createElement('div');
    ring.className = 'chest-shockwave-ring';
    ring.style.border = isRare ? '5px solid #22d3ee' : '5px solid #fbbf24';
    ring.style.boxShadow = isRare ? '0 0 24px #06b6d4' : '0 0 24px #f59e0b';
    ring.style.animationDelay = `${r * 0.14}s`;
    layer.appendChild(ring);
  }

  // 2. Gejzír pokladů stříkající z truhlice do všech stran
  const particlePool = isRare
    ? ['💎', '✨', '👑', '💎', '⭐', mainIcon]
    : [mainIcon, '✨', '🪙', '⭐', '💎', mainIcon, '✨'];

  const count = 18;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'loot-burst-particle text-2xl sm:text-3xl select-none drop-shadow-md';
    p.textContent = particlePool[i % particlePool.length];

    const spreadX = (Math.random() - 0.5) * 250;
    const peakY = -(75 + Math.random() * 95);
    const endY = peakY + (35 + Math.random() * 65);
    const rot = (Math.random() - 0.5) * 540;

    p.style.setProperty('--tx', `${Math.round(spreadX)}px`);
    p.style.setProperty('--ty-peak', `${Math.round(peakY)}px`);
    p.style.setProperty('--ty-end', `${Math.round(endY)}px`);
    p.style.setProperty('--rot', `${Math.round(rot)}deg`);
    p.style.animationDelay = `${(i % 5) * 0.035}s`;
    layer.appendChild(p);
  }

  // 3. Hlavní výhra, která prudce vyprskne z truhlice nahoru
  const mainPrize = document.createElement('div');
  mainPrize.className = `loot-prize-erupt-badge px-4 py-1.5 rounded-2xl border-3 font-black font-baloo text-base sm:text-lg whitespace-nowrap shadow-2xl flex items-center gap-1.5 ${
    isRare
      ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-white border-white ring-4 ring-cyan-300'
      : 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-amber-950 border-white ring-4 ring-amber-400'
  }`;
  mainPrize.innerHTML = `<span class="text-2xl">${mainIcon}</span><span>${mainLabel}</span>`;
  layer.appendChild(mainPrize);
}

function renderDailyChestTab() {
  const chest = document.getElementById('chest-graphic');
  const statusText = document.getElementById('chest-status-text');
  const rewardReveal = document.getElementById('chest-reward-reveal');
  const burstLayer = document.getElementById('daily-chest-burst-layer');
  if (rewardReveal) rewardReveal.classList.add('hidden');
  if (burstLayer) burstLayer.innerHTML = '';

  chest.innerHTML = `<img src="${DAILY_CHEST_IMG_URL}" referrerpolicy="no-referrer" alt="Denní truhla s pokladem" class="w-full h-full object-contain drop-shadow-xl">`;

  if (state.boxClaimed) {
    chest.className = 'w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center select-none opacity-60 grayscale-[25%] relative z-10';
    chest.style.pointerEvents = 'none';
    const wonLabel = state.lastBoxRewardText || `+${formatMinutes(state.lastBoxReward || 0.5)}`;
    statusText.innerHTML = `Truhlice už byla dnes otevřena! 🌟<br><span class="text-[11px] text-slate-500">Dnešní poklad: <strong>${wonLabel}</strong>. Další zítra.</span>`;
  } else {
    chest.className = 'cursor-pointer w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center select-none transition-transform duration-300 chest-ready hover:scale-110 active:scale-95 relative z-10';
    chest.style.pointerEvents = 'auto';
    statusText.textContent = 'Klepni na truhlici pro otevření! 👆';
  }
}

let isOpeningChest = false;

function rollDailyChestReward() {
  const cfg = getDailyChestConfig();
  const wJackpot = Math.max(0, Number(cfg.diaJackpotChance) ?? 0.1);
  const wMed = Math.max(0, Number(cfg.diaMedChance) ?? 0.9);
  const wSmall = Math.max(0, Number(cfg.diaSmallChance) ?? 5);
  const wTicket = Math.max(0, Number(cfg.ticketChance !== undefined ? cfg.ticketChance : 10));
  const wRevive = Math.max(0, Number(cfg.reviveChance) ?? 15);
  const wFood = Math.max(0, Number(cfg.foodChance) ?? 20);
  const wMinutes = Math.max(0, Number(cfg.minutesChance) ?? 40);

  const sumWeights = wJackpot + wMed + wSmall + wTicket + wRevive + wFood + wMinutes;
  if (sumWeights <= 0) {
    return { type: 'minutes', amount: 0.5 };
  }

  const totalScale = (wMinutes > 0 && sumWeights <= 100) ? 100 : sumWeights;
  const r = Math.random() * totalScale;

  let cursor = wJackpot;
  if (r < cursor) {
    return { type: 'diamonds_jackpot', amount: Math.max(1, Math.round(cfg.diaJackpotAmount || 20)) };
  }
  cursor += wMed;
  if (r < cursor) {
    return { type: 'diamonds_med', amount: Math.max(1, Math.round(cfg.diaMedAmount || 10)) };
  }
  cursor += wSmall;
  if (r < cursor) {
    return { type: 'diamonds_small', amount: Math.max(1, Math.round(cfg.diaSmallAmount || 2)) };
  }
  cursor += wTicket;
  if (r < cursor) {
    return { type: 'ticket', amount: Math.max(1, Math.round(cfg.ticketAmount || 1)) };
  }
  cursor += wRevive;
  if (r < cursor) {
    return { type: 'revive', amount: Math.max(1, Math.round(cfg.reviveAmount || 1)) };
  }
  cursor += wFood;
  if (r < cursor) {
    return { type: 'food', amount: Math.max(1, Math.round(cfg.foodAmount || 1)) };
  }

  const minVal = Math.max(0.25, Number(cfg.minutesMin) || 0.5);
  const maxVal = Math.max(minVal, Number(cfg.minutesMax) || 1.0);
  const steps = [];
  for (let v = minVal; v <= maxVal + 0.001; v += 0.5) {
    steps.push(Math.round(v * 100) / 100);
  }
  const chosenMin = steps.length > 0 ? steps[Math.floor(Math.random() * steps.length)] : minVal;
  return { type: 'minutes', amount: chosenMin };
}

function openChestAction() {
  checkAndHandleDailyResets();
  if (state.boxClaimed || isOpeningChest) return;
  isOpeningChest = true;

  const chest = document.getElementById('chest-graphic');
  const statusText = document.getElementById('chest-status-text');
  const rewardReveal = document.getElementById('chest-reward-reveal');
  const rewardAmount = document.getElementById('chest-reward-amount');
  const rewardIcon = document.getElementById('chest-reward-icon');
  const rewardSubtext = document.getElementById('chest-reward-subtext');

  chest.style.pointerEvents = 'none';
  chest.classList.remove('chest-ready');
  chest.classList.add('chest-shaking');
  statusText.textContent = 'Otevírám truhlici... ✨';
  soundChestOpening();

  setTimeout(() => {
    chest.classList.remove('chest-shaking');
    chest.classList.add('scale-110');
    chest.style.filter = 'drop-shadow(0 0 28px rgba(251, 191, 36, 0.98))';

    const drop = rollDailyChestReward();
    state.boxClaimed = true;

    if (typeof ensurePetStateInitialized === 'function') ensurePetStateInitialized();

    let burstIcon = '⭐';
    let burstShortLabel = '';

    if (drop.type === 'minutes') {
      burstIcon = '⭐';
      burstShortLabel = `+${formatMinutes(drop.amount)}`;
      if (rewardIcon) rewardIcon.textContent = '⭐';
      state.lastBoxReward = drop.amount;
      state.lastBoxRewardText = `+${formatMinutes(drop.amount)} ⭐`;
      creditRewardMinutes(drop.amount, 'Denní Truhla');
      rewardAmount.textContent = `+${formatMinutes(drop.amount)}!`;
      if (rewardSubtext) rewardSubtext.textContent = 'Připsáno na tvůj účet tabletu.';
    } else if (drop.type === 'food') {
      burstIcon = '🍖';
      burstShortLabel = `+${drop.amount}× Krmivo`;
      if (rewardIcon) rewardIcon.textContent = '🍖';
      if (state.petSystem) {
        state.petSystem.petFoodCount = (state.petSystem.petFoodCount || 0) + drop.amount;
      }
      state.lastBoxReward = 0;
      state.lastBoxRewardText = `+${drop.amount}× Krmivo pro peta 🍖`;
      rewardAmount.textContent = `+${drop.amount}× Krmivo pro peta!`;
      if (rewardSubtext) rewardSubtext.textContent = 'Uloženo do batohu pro tvého bojového parťáka.';
      state.history.unshift({
        id: Date.now(),
        time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('cs-CZ'),
        type: 'daily_chest_item',
        minutes: 0,
        note: `Denní Truhla: +${drop.amount}× Krmivo pro peta 🍖`
      });
    } else if (drop.type === 'revive') {
      burstIcon = '❤️‍🔥';
      burstShortLabel = `+${drop.amount}× Oživení`;
      if (rewardIcon) rewardIcon.textContent = '❤️‍🔥';
      if (state.petSystem) {
        state.petSystem.revivePotionsCount = (state.petSystem.revivePotionsCount || 0) + drop.amount;
      }
      state.lastBoxReward = 0;
      state.lastBoxRewardText = `+${drop.amount}× Kámen oživení ❤️‍🔥`;
      rewardAmount.textContent = `+${drop.amount}× Kámen oživení!`;
      if (rewardSubtext) rewardSubtext.textContent = 'Vzácný úlovek! Probouzí peta v Aréně na 100 % HP.';
      state.history.unshift({
        id: Date.now(),
        time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('cs-CZ'),
        type: 'daily_chest_item',
        minutes: 0,
        note: `Denní Truhla: +${drop.amount}× Kámen oživení ❤️‍🔥`
      });
    } else if (drop.type === 'ticket') {
      burstIcon = '🎟️';
      burstShortLabel = `+${drop.amount}× Lístek`;
      if (rewardIcon) rewardIcon.textContent = '🎟️';
      if (state.petSystem) {
        state.petSystem.battleTicketsCount = (state.petSystem.battleTicketsCount || 0) + drop.amount;
      }
      state.lastBoxReward = 0;
      state.lastBoxRewardText = `+${drop.amount}× Lístek do Arény 🎟️`;
      rewardAmount.textContent = `+${drop.amount}× Lístek do Arény!`;
      if (rewardSubtext) rewardSubtext.textContent = 'Umožní tvému petovi okamžitě spustit další zápas v Aréně!';
      state.history.unshift({
        id: Date.now(),
        time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('cs-CZ'),
        type: 'daily_chest_item',
        minutes: 0,
        note: `Denní Truhla: +${drop.amount}× Lístek do Arény 🎟️`
      });
    } else {
      const isJackpot = drop.type === 'diamonds_jackpot';
      burstIcon = isJackpot ? '👑' : '💎';
      burstShortLabel = `+${drop.amount} 💎`;
      if (rewardIcon) rewardIcon.textContent = burstIcon;
      state.goldDiamonds = (state.goldDiamonds || 0) + drop.amount;
      recordTraceabilityDiamonds(drop.amount);
      state.lastBoxReward = 0;
      state.lastBoxRewardText = `+${drop.amount} Diamantů 💎`;
      rewardAmount.textContent = `+${drop.amount} Modrých Diamantů!`;
      if (rewardSubtext) rewardSubtext.textContent = isJackpot ? 'MEGA JACKPOT! Připsáno k tvým drahokamům!' : 'Připsáno k tvým modrým drahokamům!';
      state.history.unshift({
        id: Date.now(),
        time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('cs-CZ'),
        type: 'daily_chest_diamonds',
        minutes: 0,
        note: `Denní Truhla: +${drop.amount} 💎`
      });
    }

    // Spustíme animaci vyprsknutí pokladu přímo z truhlice
    triggerChestLootBurst('daily-chest-burst-layer', burstIcon, burstShortLabel, false);

    rewardReveal.classList.remove('hidden');
    statusText.textContent = 'Poklad vyprskl z truhlice! 🎉';

    saveState();
    triggerConfetti();
    playCustomSuccessSound();
    updateBalanceUI();
    updateTopBadges();
    updateDiamondMarketUI();
    if (typeof updateTopPetCompanionWidget === 'function') updateTopPetCompanionWidget();
    updateAdminLegendaryUI();
    isOpeningChest = false;
  }, 950);
}

function renderLegendaryChestTab() {
  const activeBox = document.getElementById('legend-chest-active-box');
  const emptyBox = document.getElementById('legend-chest-empty-box');
  const displayTitle = document.getElementById('legend-chest-display-title');
  const chestGraphic = document.getElementById('legend-chest-graphic');
  const statusText = document.getElementById('legend-chest-status-text');
  const rewardReveal = document.getElementById('legend-chest-reward-reveal');
  const noteEl = document.getElementById('legend-chest-note');
  const burstLayer = document.getElementById('legend-chest-burst-layer');

  if (rewardReveal) rewardReveal.classList.add('hidden');
  if (burstLayer) burstLayer.innerHTML = '';

  const leg = state.legendaryChest;
  const isAvailable = (leg && leg.active && !leg.claimed);

  if (isAvailable) {
    activeBox.classList.remove('hidden');
    emptyBox.classList.add('hidden');
    displayTitle.textContent = leg.title || 'Výjimečná Truhla';
    noteEl.textContent = `Odměna uvnitř: ${leg.diamonds || 10} modrých diamantů 💎`;
    chestGraphic.innerHTML = `<img src="${RARE_CHEST_IMG_URL}" referrerpolicy="no-referrer" alt="Výjimečná truhla" class="w-full h-full object-contain drop-shadow-xl">`;
    chestGraphic.className = 'cursor-pointer w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center select-none transition-transform duration-300 chest-legend-ready hover:scale-110 active:scale-95 relative z-10';
    chestGraphic.style.pointerEvents = 'auto';
    chestGraphic.style.filter = '';
    statusText.textContent = 'Klepni na vzácnou truhlici! 👆';
  } else {
    activeBox.classList.add('hidden');
    emptyBox.classList.remove('hidden');
    displayTitle.textContent = 'Výjimečná Truhla';
  }
}

let isOpeningLegendaryChest = false;

function openLegendaryChestAction() {
  const leg = state.legendaryChest;
  if (!leg || !leg.active || leg.claimed || isOpeningLegendaryChest) return;
  isOpeningLegendaryChest = true;

  const chest = document.getElementById('legend-chest-graphic');
  const statusText = document.getElementById('legend-chest-status-text');
  const rewardReveal = document.getElementById('legend-chest-reward-reveal');
  const rewardAmount = document.getElementById('legend-chest-reward-amount');

  chest.style.pointerEvents = 'none';
  chest.classList.remove('chest-legend-ready');
  chest.classList.add('chest-shaking');
  statusText.textContent = 'Otevírám vzácnou truhlici... ✨';
  soundChestOpening();

  setTimeout(() => {
    chest.classList.remove('chest-shaking');
    chest.classList.add('scale-110');
    chest.style.filter = 'drop-shadow(0 0 30px rgba(34, 211, 238, 0.98))';

    const awardedDiamonds = leg.diamonds || 10;
    leg.claimed = true;
    leg.active = false;
    state.goldDiamonds = (state.goldDiamonds || 0) + awardedDiamonds;

    state.history.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('cs-CZ'),
      type: 'legendary_chest',
      minutes: 0,
      note: `Výjimečná truhla (${leg.title}): +${awardedDiamonds} 💎`
    });

    // Efekt vyprsknutí diamantů z vzácné truhlice
    triggerChestLootBurst('legend-chest-burst-layer', '💎', `+${awardedDiamonds} 💎`, true);

    rewardAmount.textContent = `+${awardedDiamonds} Modrých Diamantů!`;
    rewardReveal.classList.remove('hidden');
    statusText.textContent = 'Mimořádný poklad vyprskl z truhlice! 💎🎉';

    saveState();
    triggerConfetti();
    playCustomSuccessSound();
    updateBalanceUI();
    updateTopBadges();
    updateDiamondMarketUI();
    updateAdminLegendaryUI();

    setTimeout(() => {
      isOpeningLegendaryChest = false;
      renderLegendaryChestTab();
    }, 2800);
  }, 950);
}

function saveAdminDailyChestConfig() {
  const cfg = getDailyChestConfig();
  const getNum = (id, fallback) => {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const val = parseFloat(el.value.replace(',', '.'));
    return isNaN(val) ? fallback : Math.max(0, val);
  };

  cfg.minutesChance = getNum('admin-dchest-chance-minutes', 40);
  cfg.minutesMin = Math.max(0.5, getNum('admin-dchest-min-minutes', 0.5));
  cfg.minutesMax = Math.max(cfg.minutesMin, getNum('admin-dchest-max-minutes', 1.0));
  cfg.foodChance = getNum('admin-dchest-chance-food', 20);
  cfg.foodAmount = Math.max(1, Math.round(getNum('admin-dchest-amt-food', 1)));
  cfg.reviveChance = getNum('admin-dchest-chance-revive', 15);
  cfg.reviveAmount = Math.max(1, Math.round(getNum('admin-dchest-amt-revive', 1)));
  cfg.ticketChance = getNum('admin-dchest-chance-ticket', 10);
  cfg.ticketAmount = Math.max(1, Math.round(getNum('admin-dchest-amt-ticket', 1)));
  cfg.diaSmallChance = getNum('admin-dchest-chance-diasmall', 5);
  cfg.diaSmallAmount = Math.max(1, Math.round(getNum('admin-dchest-amt-diasmall', 2)));
  cfg.diaMedChance = getNum('admin-dchest-chance-diamed', 0.9);
  cfg.diaMedAmount = Math.max(1, Math.round(getNum('admin-dchest-amt-diamed', 10)));
  cfg.diaJackpotChance = getNum('admin-dchest-chance-diajackpot', 0.1);
  cfg.diaJackpotAmount = Math.max(1, Math.round(getNum('admin-dchest-amt-diajackpot', 20)));

  saveState();
  updateAdminLegendaryUI();
  playTone(580, 0.08, 'sine', 0.15);
}

function adminResetDailyChestDefaults() {
  state.dailyChestConfig = {
    minutesChance: 40,
    minutesMin: 0.5,
    minutesMax: 1.0,
    foodChance: 20,
    foodAmount: 1,
    reviveChance: 15,
    reviveAmount: 1,
    ticketChance: 10,
    ticketAmount: 1,
    diaSmallChance: 5,
    diaSmallAmount: 2,
    diaMedChance: 0.9,
    diaMedAmount: 10,
    diaJackpotChance: 0.1,
    diaJackpotAmount: 20
  };
  saveState();
  updateAdminLegendaryUI();
  playTone(640, 0.12, 'triangle', 0.2);
  alertUserFeedback('Šance a odměny denní truhly vráceny na výchozí hodnoty!');
}

function adminApplyLegendaryChest() {
  const titleInput = document.getElementById('admin-legendary-title-input');
  const diamondsInput = document.getElementById('admin-legendary-diamonds-input');
  const title = (titleInput.value.trim() || 'ZA VÝBORNÉ VÝSLEDKY VE ŠKOLE').toUpperCase();
  const diamonds = Math.max(1, parseInt(diamondsInput.value, 10) || 10);

  state.legendaryChest = { active: true, title: title, diamonds: diamonds, claimed: false };
  saveState();
  updateTopBadges();
  updateAdminLegendaryUI();
  playTone(660, 0.15, 'triangle', 0.25);
  alertUserFeedback(`Vzácná truhla připravena: "${title}" (${diamonds} 💎)!`);
}

function adminCancelLegendaryChest() {
  if (!state.legendaryChest) return;
  state.legendaryChest.active = false;
  state.legendaryChest.claimed = true;
  saveState();
  updateTopBadges();
  updateAdminLegendaryUI();
  playTone(400, 0.1, 'sine', 0.15);
  alertUserFeedback('Vzácná truhla zrušena.');
}

function updateAdminLegendaryUI() {
  const cfg = getDailyChestConfig();
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  setVal('admin-dchest-chance-minutes', cfg.minutesChance);
  setVal('admin-dchest-min-minutes', cfg.minutesMin);
  setVal('admin-dchest-max-minutes', cfg.minutesMax);
  setVal('admin-dchest-chance-food', cfg.foodChance);
  setVal('admin-dchest-amt-food', cfg.foodAmount);
  setVal('admin-dchest-chance-revive', cfg.reviveChance);
  setVal('admin-dchest-amt-revive', cfg.reviveAmount);
  setVal('admin-dchest-chance-ticket', cfg.ticketChance !== undefined ? cfg.ticketChance : 10);
  setVal('admin-dchest-amt-ticket', cfg.ticketAmount !== undefined ? cfg.ticketAmount : 1);
  setVal('admin-dchest-chance-diasmall', cfg.diaSmallChance);
  setVal('admin-dchest-amt-diasmall', cfg.diaSmallAmount);
  setVal('admin-dchest-chance-diamed', cfg.diaMedChance);
  setVal('admin-dchest-amt-diamed', cfg.diaMedAmount);
  setVal('admin-dchest-chance-diajackpot', cfg.diaJackpotChance);
  setVal('admin-dchest-amt-diajackpot', cfg.diaJackpotAmount);

  const sumLabel = document.getElementById('admin-daily-chest-sum-label');
  if (sumLabel) {
    const ticketChance = cfg.ticketChance !== undefined ? cfg.ticketChance : 10;
    const total = Math.round((cfg.minutesChance + cfg.foodChance + cfg.reviveChance + ticketChance + cfg.diaSmallChance + cfg.diaMedChance + cfg.diaJackpotChance) * 100) / 100;
    sumLabel.textContent = `Součet šancí: ${total.toString().replace('.', ',')} %`;
  }

  const dailyStatusLabel = document.getElementById('admin-daily-chest-status-label');
  if (dailyStatusLabel) {
    if (state.boxClaimed) {
      dailyStatusLabel.innerHTML = `⚪ Dnes již otevřena (${state.lastBoxRewardText || `+${formatMinutes(state.lastBoxReward || 0.5)}`})`;
    } else {
      dailyStatusLabel.innerHTML = `🟢 Dnes připravena k otevření`;
    }
  }

  const statusLabel = document.getElementById('admin-legendary-status-label');
  if (!statusLabel) return;

  const leg = state.legendaryChest;
  if (leg && leg.active && !leg.claimed) {
    statusLabel.innerHTML = `🟢 <strong class="text-emerald-800">AKTIVNÍ:</strong> Truhla "${leg.title}" s ${leg.diamonds} 💎 čeká na otevření.`;
  } else {
    statusLabel.innerHTML = `⚪ <span class="text-slate-600">Stav: Žádná aktivní vzácná truhla nečeká.</span>`;
  }

  const titleInp = document.getElementById('admin-legendary-title-input');
  const diaInp = document.getElementById('admin-legendary-diamonds-input');
  if (titleInp && leg && leg.title) titleInp.value = leg.title;
  if (diaInp && leg && leg.diamonds) diaInp.value = leg.diamonds;
}

/* ============================================================
   TESTOVACÍ MODUL (OPRAVA: UNIKÁTNOST POLOŽEK V JEDNOM TESTU)
   ============================================================ */

let testState = { tasks: [], currentIndex: 0, answers: [] };

function openTestView() {
  checkAndHandleDailyResets();
  showView('test');

  const btnReading = document.getElementById('subject-btn-reading');
  const btnMath = document.getElementById('subject-btn-math');
  const btnClocks = document.getElementById('subject-btn-clocks');
  const btnTest = document.getElementById('subject-btn-test');

  if (btnReading) btnReading.className = 'h-full min-w-[58px] sm:min-w-[64px] px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 text-slate-600 hover:bg-slate-200 whitespace-nowrap';
  if (btnMath) btnMath.className = 'h-full min-w-[58px] sm:min-w-[64px] px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 text-slate-600 hover:bg-slate-200 whitespace-nowrap';
  if (btnClocks) btnClocks.className = 'h-full min-w-[58px] sm:min-w-[64px] px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 text-slate-600 hover:bg-slate-200 whitespace-nowrap';
  if (btnTest) btnTest.className = 'h-full min-w-[58px] sm:min-w-[64px] px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm relative whitespace-nowrap';

  const introBox = document.getElementById('test-intro-box');
  const runnerBox = document.getElementById('test-runner-box');
  const resultsBox = document.getElementById('test-results-box');
  const alreadyDoneBox = document.getElementById('test-already-done-box');

  introBox.classList.add('hidden');
  runnerBox.classList.add('hidden');
  resultsBox.classList.add('hidden');
  alreadyDoneBox.classList.add('hidden');

  const count = (state.testConfig && state.testConfig.taskCount) ? state.testConfig.taskCount : 8;
  const introCountText = document.getElementById('test-intro-task-count-text');
  if (introCountText) {
    introCountText.innerHTML = `Čeká tě celkem <strong>${count} úloh</strong> (mix čtení i matematiky dle nastavení rodiče). Výsledky se vyhodnotí až na konci.`;
  }

  if (state.testDoneToday) {
    alreadyDoneBox.classList.remove('hidden');
    const res = state.testLastResult || { score: count, total: count, percent: 100, diamonds: 4 };
    document.getElementById('test-saved-score-label').textContent = `${res.percent} % (${res.score}/${res.total})`;
    document.getElementById('test-saved-diamonds-label').textContent = `Odměna: +${res.diamonds} Diamantů 💎`;
  } else {
    introBox.classList.remove('hidden');
  }
}

function generateRandomReadingTaskForLevel(level) {
  let item = null;
  const activeLetters = (state.activeLetters && state.activeLetters.length > 0) ? state.activeLetters : ['M', 'A', 'L', 'E', 'S', 'O'];
  const sylls = generatePedagogicalOpenSyllables();

  if (level === 1) {
    if (!activeLetters.length) return null;
    const char = activeLetters[Math.floor(Math.random() * activeLetters.length)];
    item = { text: char, label: 'Písmeno' };
  } else if (level === 2) {
    if (!sylls.length) return null;
    item = { text: sylls[Math.floor(Math.random() * sylls.length)].text, label: 'Slabika' };
  } else if (level === 3) {
    const list = LEVEL_3_CVC_WORDS.filter(w => isItemFormedByActive(w.letters) && isWordAllowedByAdminLetters(w.text, activeLetters));
    if (!list.length) return null;
    item = { text: list[Math.floor(Math.random() * list.length)].text, label: 'Jednoslabičné slovo' };
  } else if (level === 4) {
    const list = LEVEL_4_TWO_SYLLABLE_WORDS.filter(w => isItemFormedByActive(w.letters) && isWordAllowedByAdminLetters(w.text, activeLetters));
    if (!list.length) return null;
    item = { text: list[Math.floor(Math.random() * list.length)].text, label: 'Dvouslabičné slovo' };
  } else if (level === 5) {
    const list = getFilteredLevel5Pool('all', activeLetters);
    if (!list.length) return null;
    const chosen = list[Math.floor(Math.random() * list.length)];
    const subLabel = (hasConsonantCluster(chosen.text) && hasDiphthongOU(chosen.text))
      ? 'Shluk + OU'
      : (hasDiphthongOU(chosen.text) ? 'Slovo s OU' : 'Souhláskový shluk');
    item = { text: chosen.text, label: subLabel };
  } else if (level === 6) {
    const list = LEVEL_6_SOFT.filter(w => isItemFormedByActive(w.letters) && isWordAllowedByAdminLetters(w.text, activeLetters));
    if (!list.length) return null;
    item = { text: list[Math.floor(Math.random() * list.length)].text, label: 'Měkčení DĚ/TĚ/NĚ' };
  } else {
    const list = LEVEL_7_SENTENCES.filter(sen => isItemFormedByActive(sen.letters));
    if (!list.length) return null;
    item = { text: list[Math.floor(Math.random() * list.length)].text, label: 'Celá věta' };
  }

  return { 
    category: 'reading', 
    subLabel: item.label, 
    questionText: item.text, 
    emoji: '', 
    correctAnswer: item.text,
    uniqueKey: `reading_${level}_${item.text}`
  };
}

function generateRandomMathTaskForLevel(level) {
  const maxVal = state.mathMax || 10;
  if (level === 1) {
    const coinMax = state.coinMaxLimit || 20;
    const allowedCoins = CZECH_COINS_DATA.filter(c => c.value <= Math.min(20, coinMax));
    const count = randomInt(2, 4);
    const picked = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const c = allowedCoins[Math.floor(Math.random() * allowedCoins.length)];
      if (sum + c.value <= coinMax) {
        picked.push(c);
        sum += c.value;
      }
    }
    if (picked.length < 2) {
      picked.push(CZECH_COINS_DATA[0], CZECH_COINS_DATA[1]);
      sum = picked.reduce((a, b) => a + b.value, 0);
    }
    const coinsHtml = picked.map(c => `<img src="${c.img}" alt="${c.label}" referrerpolicy="no-referrer" class="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-contain inline-block border border-amber-300 bg-white p-0.5 shadow-sm">`).join(' <span class="text-amber-500 font-black text-2xl mx-1">+</span> ');
    return {
      category: 'math',
      subLabel: 'Skládání mincí (Kč)',
      renderType: 'html',
      htmlContent: `<div class="flex items-center justify-center flex-wrap gap-1">${coinsHtml} <span class="text-slate-400 font-black text-2xl mx-1">=</span></div>`,
      correctAnswer: sum.toString(),
      uniqueKey: `math_1_coins_${picked.map(p => p.value).join('_')}_${sum}`
    };
  } else if (level === 2) {
    const tasks = generateMathLevel2(maxVal);
    const t = tasks[Math.floor(Math.random() * tasks.length)];
    return { category: 'math', subLabel: 'Porovnávání (<, =, >)', renderType: 'compare', left: t.leftVal, right: t.rightVal, correctAnswer: t.correctAnswer, uniqueKey: `math_2_${t.leftVal}_${t.rightVal}` };
  } else if (level === 3) {
    const tasks = generateMathLevel3(maxVal);
    const t = tasks[Math.floor(Math.random() * tasks.length)];
    return { category: 'math', subLabel: 'Číselná řada', renderType: 'html', htmlContent: t.htmlRow, correctAnswer: t.correctAnswer, uniqueKey: `math_3_${t.htmlRow}` };
  } else if (level === 4) {
    const tasks = generateMathLevel4(maxVal);
    const t = tasks[Math.floor(Math.random() * tasks.length)];
    return { category: 'math', subLabel: 'Počítadlo (+/-)', renderType: 'html', htmlContent: t.htmlRow, correctAnswer: t.correctAnswer, uniqueKey: `math_4_${t.htmlRow}` };
  } else if (level === 5) {
    const tasks = generateMathLevel5(maxVal);
    const t = tasks[Math.floor(Math.random() * tasks.length)];
    return { category: 'math', subLabel: 'Rozklad čísel', renderType: 'decomposition', topNum: t.topNum, leftNum: t.leftNum, rightNum: t.rightNum, missingSide: t.missingSide, correctAnswer: t.correctAnswer, uniqueKey: `math_5_${t.topNum}_${t.leftNum}_${t.missingSide}` };
  } else {
    const tasks = generateMathLevel6(maxVal);
    const t = tasks[Math.floor(Math.random() * tasks.length)];
    return { 
      category: 'math', 
      subLabel: 'Slovní úloha', 
      renderType: 'story', 
      story: t.story, 
      a: t.a, 
      b: t.b, 
      op: t.op, 
      correctAnswer: t.correctAnswer,
      uniqueKey: `math_6_${t.story}`
    };
  }
}

function startDailyTest() {
  checkAndHandleDailyResets();
  
  const config = state.testConfig || DEFAULT_TEST_CONFIG;
  const topics = config.enabledTopics || DEFAULT_TEST_CONFIG.enabledTopics;
  const targetCount = config.taskCount || 8;

  const activeReadingLevels = [];
  for (let i = 1; i <= 7; i++) {
    if (topics[`reading_${i}`]) activeReadingLevels.push(i);
  }

  const activeMathLevels = [];
  for (let i = 1; i <= 6; i++) {
    if (topics[`math_${i}`]) activeMathLevels.push(i);
  }

  if (activeReadingLevels.length === 0 && activeMathLevels.length === 0) {
    soundError();
    alertUserFeedback('V administraci nemáš vybrané žádné okruhy pro test!');
    return;
  }

  const generators = [];
  activeReadingLevels.forEach(lvl => {
    generators.push(() => generateRandomReadingTaskForLevel(lvl));
  });
  activeMathLevels.forEach(lvl => {
    generators.push(() => generateRandomMathTaskForLevel(lvl));
  });

  const taskList = [];
  const seenKeys = new Set();
  let safetyCounter = 0;

  while (taskList.length < targetCount && safetyCounter < 300) {
    safetyCounter++;
    const pickGen = generators[Math.floor(Math.random() * generators.length)];
    const task = pickGen();
    
    if (task && !seenKeys.has(task.uniqueKey)) {
      seenKeys.add(task.uniqueKey);
      taskList.push(task);
    }
  }

  if (taskList.length === 0) {
    soundError();
    if (activeReadingLevels.includes(5) && activeReadingLevels.length === 1 && activeMathLevels.length === 0) {
      alertUserFeedback('Pro tato písmena zatím nejsou k dispozici žádné shluky / slova s OU.');
    } else {
      alertUserFeedback('Pro tato písmena zatím nejsou k dispozici žádné úlohy pro vybrané okruhy.');
    }
    return;
  }

  testState.tasks = taskList;
  testState.currentIndex = 0;
  testState.answers = [];

  document.getElementById('test-intro-box').classList.add('hidden');
  document.getElementById('test-results-box').classList.add('hidden');
  document.getElementById('test-runner-box').classList.remove('hidden');

  playTone(550, 0.1, 'sine', 0.15);
  renderCurrentTestTask();
}

function renderCurrentTestTask() {
  const cur = testState.tasks[testState.currentIndex];
  const total = testState.tasks.length;
  const idx = testState.currentIndex;

  document.getElementById('test-step-label').textContent = `Otázka ${idx + 1} z ${total}`;
  document.getElementById('test-task-category-pill').textContent = cur.category === 'reading' ? `Čtení: ${cur.subLabel}` : `Matematika: ${cur.subLabel}`;
  
  const pct = Math.round(((idx + 1) / total) * 100);
  document.getElementById('test-step-progress-bar').style.width = `${pct}%`;

  const area = document.getElementById('test-task-interactive-area');
  area.innerHTML = '';

  const readingEvalBar = document.getElementById('test-reading-eval-bar');
  const mathEvalBar = document.getElementById('test-math-eval-bar');

  if (cur.category === 'reading') {
    readingEvalBar.classList.remove('hidden');
    mathEvalBar.classList.add('hidden');

    const arcsActive = !!state.showSyllableArcs;
    const isSingleChar = cur.questionText.trim().length <= 1;
    const renderedQuestion = renderReadingTextHtml(cur.questionText, { forceEnableArcs: arcsActive && !isSingleChar, arcColor: '#e11d48' });

    const card = document.createElement('div');
    card.className = 'flex flex-col items-center justify-center p-3 max-w-xl w-full relative';
    card.innerHTML = `
      ${!isSingleChar ? `
        <div class="mb-2">
          <button type="button" onclick="toggleTestSyllableArcs()" class="game-button px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm ${arcsActive ? 'bg-rose-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'}">
            <span>◡◡</span>
            <span>${arcsActive ? 'Slabiky: ZAP' : 'Slabiky: VYP'}</span>
          </button>
        </div>
      ` : ''}
      <h2 class="text-3xl sm:text-5xl font-black text-indigo-950 font-baloo tracking-wide leading-tight my-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        ${renderedQuestion}
      </h2>
      <p class="text-xs font-bold text-slate-500 mt-2">Přečti nahlas tátovi! 🗣️</p>
    `;
    area.appendChild(card);
  } else {
    readingEvalBar.classList.add('hidden');
    mathEvalBar.classList.remove('hidden');

    if (cur.renderType === 'compare') {
      const card = document.createElement('div');
      card.className = 'flex flex-col items-center justify-center gap-3';
      card.innerHTML = `
        <div class="flex items-center text-3xl sm:text-5xl font-black text-sky-900 font-baloo select-none">
          <span>${cur.left}</span>
          <span class="mx-3 text-slate-300">⭕</span>
          <span>${cur.right}</span>
        </div>
        <div class="flex items-center gap-2.5 mt-1">
          <button type="button" onclick="selectTestCompareOption('<')" id="test-cmp-lt" class="test-cmp-btn w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300 text-2xl font-black flex items-center justify-center">&lt;</button>
          <button type="button" onclick="selectTestCompareOption('=')" id="test-cmp-eq" class="test-cmp-btn w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300 text-2xl font-black flex items-center justify-center">=</button>
          <button type="button" onclick="selectTestCompareOption('>')" id="test-cmp-gt" class="test-cmp-btn w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300 text-2xl font-black flex items-center justify-center">&gt;</button>
          <input type="hidden" id="test-math-input" value="">
        </div>
      `;
      area.appendChild(card);
    } else if (cur.renderType === 'decomposition') {
      const card = document.createElement('div');
      card.className = 'flex flex-col items-center justify-center';
      card.innerHTML = `
        <div class="w-14 h-14 rounded-2xl border-3 border-slate-700 bg-amber-50 flex items-center justify-center text-2xl font-black text-slate-800 shadow-sm font-baloo">
          ${cur.topNum}
        </div>
        <svg class="w-24 h-7" viewBox="0 0 100 30">
          <line x1="50" y1="0" x2="20" y2="30" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
          <line x1="50" y1="0" x2="80" y2="30" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
        </svg>
        <div class="flex items-center gap-4 mt-0.5">
          ${cur.missingSide === 'left' ? `
            <input type="number" id="test-math-input" placeholder="?" class="w-14 h-14 text-center text-2xl font-black rounded-2xl border-3 border-dashed border-amber-400 bg-amber-50 focus:bg-white text-indigo-900 focus:outline-none shadow-inner">
          ` : `
            <div class="w-14 h-14 rounded-2xl border-3 border-slate-700 bg-white flex items-center justify-center text-xl font-black text-slate-800">${cur.leftNum}</div>
          `}
          ${cur.missingSide === 'right' ? `
            <input type="number" id="test-math-input" placeholder="?" class="w-14 h-14 text-center text-2xl font-black rounded-2xl border-3 border-dashed border-amber-400 bg-amber-50 focus:bg-white text-indigo-900 focus:outline-none shadow-inner">
          ` : `
            <div class="w-14 h-14 rounded-2xl border-3 border-slate-700 bg-white flex items-center justify-center text-xl font-black text-slate-800">${cur.rightNum}</div>
          `}
        </div>
      `;
      area.appendChild(card);
      setTimeout(() => {
        const inp = document.getElementById('test-math-input');
        if (inp) { inp.focus(); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitTestMathAnswer(); }); }
      }, 50);
    } else if (cur.renderType === 'story') {
      const card = document.createElement('div');
      card.className = 'flex flex-col items-center justify-center text-center max-w-xl mx-auto gap-4 py-2 w-full';
      card.innerHTML = `
        <span class="text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-900 px-3 py-1 rounded-full">Slovní Úloha v Testu</span>
        <p class="text-base sm:text-2xl font-black text-indigo-950 leading-relaxed font-nunito px-2">${cur.story}</p>
        <div class="flex items-center justify-center gap-2.5 mt-2">
          <span class="text-xs sm:text-sm font-black text-slate-600">Výsledek:</span>
          <input type="number" id="test-math-input" placeholder="?" class="w-20 h-12 text-center text-2xl font-black rounded-2xl border-3 border-amber-400 bg-amber-50 focus:bg-white focus:outline-none text-indigo-900 shadow-inner">
        </div>
      `;
      area.appendChild(card);
      setTimeout(() => {
        const inp = document.getElementById('test-math-input');
        if (inp) { inp.focus(); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitTestMathAnswer(); }); }
      }, 50);
    } else {
      const card = document.createElement('div');
      card.className = 'flex flex-col items-center justify-center max-w-lg';
      card.innerHTML = `
        <div class="flex items-center whitespace-nowrap overflow-x-auto select-none font-baloo mb-3 text-2xl sm:text-3xl">
          ${cur.htmlContent}
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-black text-slate-500">Výsledek:</span>
          <input type="number" id="test-math-input" placeholder="?" class="w-16 h-11 text-center text-2xl font-black rounded-2xl border-3 border-amber-400 bg-amber-50 focus:bg-white focus:outline-none text-indigo-900 shadow-inner">
        </div>
      `;
      area.appendChild(card);
      setTimeout(() => {
        const inp = document.getElementById('test-math-input');
        if (inp) { inp.focus(); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitTestMathAnswer(); }); }
      }, 50);
    }
  }
}

function selectTestCompareOption(sign) {
  const input = document.getElementById('test-math-input');
  if (input) input.value = sign;
  const lt = document.getElementById('test-cmp-lt');
  const eq = document.getElementById('test-cmp-eq');
  const gt = document.getElementById('test-cmp-gt');

  [lt, eq, gt].forEach(b => {
    if (b) b.className = 'test-cmp-btn w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300 text-2xl font-black flex items-center justify-center';
  });

  const selected = sign === '<' ? lt : (sign === '=' ? eq : gt);
  if (selected) selected.className = 'test-cmp-btn w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-indigo-600 text-white border-2 border-indigo-700 shadow-md text-2xl font-black flex items-center justify-center';
  playTone(520, 0.08, 'sine', 0.15);
}

function submitTestReadingAnswer(isOk) {
  const cur = testState.tasks[testState.currentIndex];
  testState.answers.push({
    task: cur,
    userAnswer: isOk ? 'Správně přečteno' : 'Chyba ve čtení',
    isCorrect: isOk,
    expectedAnswer: cur.correctAnswer
  });
  playTone(isOk ? 600 : 300, 0.08, 'sine', 0.15);
  advanceTestStep();
}

function submitTestMathAnswer() {
  const cur = testState.tasks[testState.currentIndex];
  const inp = document.getElementById('test-math-input');
  const userVal = inp ? inp.value.trim() : '';

  if (userVal === '') {
    soundShuffle();
    alertUserFeedback('Zadej výsledek příkladu!');
    return;
  }

  const isOk = (userVal === cur.correctAnswer);
  testState.answers.push({
    task: cur,
    userAnswer: userVal,
    isCorrect: isOk,
    expectedAnswer: cur.correctAnswer
  });

  playTone(520, 0.08, 'sine', 0.15);
  advanceTestStep();
}

function advanceTestStep() {
  testState.currentIndex++;
  if (testState.currentIndex < testState.tasks.length) {
    renderCurrentTestTask();
  } else {
    finishDailyTest();
  }
}

function calculateTestRewardDiamonds(percent) {
  const config = state.testConfig || DEFAULT_TEST_CONFIG;
  const thresholds = config.thresholds || DEFAULT_TEST_CONFIG.thresholds;
  for (let t of thresholds) {
    if (percent >= t.minPercent) return t.diamonds;
  }
  return 0;
}

function finishDailyTest() {
  const total = testState.answers.length;
  const correctCount = testState.answers.filter(a => a.isCorrect).length;
  const percent = Math.round((correctCount / total) * 100);
  const diamondsAwarded = calculateTestRewardDiamonds(percent);

  state.testDoneToday = true;
  state.testLastResult = {
    date: getTodayDateString(),
    score: correctCount,
    total: total,
    percent: percent,
    diamonds: diamondsAwarded,
    answers: testState.answers
  };

  if (diamondsAwarded > 0) {
    state.goldDiamonds = (state.goldDiamonds || 0) + diamondsAwarded;
    recordTraceabilityDiamonds(diamondsAwarded);
    state.history.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('cs-CZ'),
      type: 'test_reward',
      minutes: 0,
      note: `Denní Test (${percent} %): +${diamondsAwarded} 💎`
    });
  }

  updateDailyQuestsProgress('test', 1);
  saveState();
  updateBalanceUI();
  updateTopBadges();
  updateDiamondMarketUI();

  if (diamondsAwarded >= 3) {
    playCustomSuccessSound();
    triggerConfetti();
  } else if (diamondsAwarded > 0) {
    playCustomSuccessSound();
  } else {
    soundShuffle();
  }

  renderTestResults(correctCount, total, percent, diamondsAwarded, testState.answers);
}

function renderTestResults(correct, total, percent, diamonds, answers) {
  document.getElementById('test-runner-box').classList.add('hidden');
  document.getElementById('test-results-box').classList.remove('hidden');

  const headline = document.getElementById('test-result-headline');
  const percentEl = document.getElementById('test-result-percent');
  const summaryEl = document.getElementById('test-result-summary');
  const diamondsLabel = document.getElementById('test-awarded-diamonds-label');
  const iconEl = document.getElementById('test-result-icon');
  const badgeCounter = document.getElementById('test-score-counter-badge');

  percentEl.textContent = `${percent} %`;
  badgeCounter.textContent = `${correct} / ${total} správně`;
  summaryEl.textContent = `Správně vyřešeno ${correct} z ${total} úloh.`;

  if (percent >= 90) { headline.textContent = 'Fantastický výsledek! 🌟'; iconEl.textContent = '🏆'; }
  else if (percent >= 80) { headline.textContent = 'Velmi pěkná práce! 👏'; iconEl.textContent = '🎉'; }
  else if (percent >= 65) { headline.textContent = 'Dobrá práce! 👍'; iconEl.textContent = '⭐'; }
  else if (percent >= 50) { headline.textContent = 'Zvládl jsi to! 🙂'; iconEl.textContent = '💪'; }
  else { headline.textContent = 'Nevadí, zítra to zvládneš lépe!'; iconEl.textContent = '📚'; }

  if (diamonds > 0) {
    diamondsLabel.textContent = `Získáváš +${diamonds} ${czechNounForm(diamonds, 'Diamant', 'Diamanty', 'Diamantů')} 💎!`;
  } else {
    diamondsLabel.textContent = 'Tentokrát bez diamantů (potřeba aspoň 50 %).';
  }

  const reviewList = document.getElementById('test-review-items-list');
  reviewList.innerHTML = '';

  answers.forEach((ans, i) => {
    const item = document.createElement('div');
    const isOk = ans.isCorrect;
    item.className = `p-2.5 rounded-2xl border-2 flex items-center justify-between gap-2.5 text-xs font-bold ${
      isOk ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'
    }`;

    let taskDesc = '';
    if (ans.task.category === 'reading') {
      taskDesc = `📖 ${ans.task.subLabel}: "${ans.task.questionText}"`;
    } else {
      if (ans.task.renderType === 'compare') taskDesc = `🔢 Porovnání: ${ans.task.left} vs ${ans.task.right}`;
      else if (ans.task.renderType === 'decomposition') taskDesc = `🔢 Rozklad čísla ${ans.task.topNum}`;
      else if (ans.task.renderType === 'story') taskDesc = `📖 Slovní úloha`;
      else taskDesc = `🔢 Početní příklad`;
    }

    item.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-lg">${isOk ? '✅' : '❌'}</span>
        <div>
          <div class="font-black text-slate-800">${i + 1}. ${taskDesc}</div>
          <div class="text-[10px] ${isOk ? 'text-emerald-700' : 'text-rose-700'}">
            ${isOk ? 'Zvládnuto bez chyby' : `Tvoje odpověď: <span class="line-through font-black">${ans.userAnswer}</span> • Správně: <strong class="underline">${ans.expectedAnswer}</strong>`}
          </div>
        </div>
      </div>
      <span class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-lg ${isOk ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'}">
        ${isOk ? 'OK' : 'CHYBA'}
      </span>
    `;
    reviewList.appendChild(item);
  });
}

function showTestReviewAgain() {
  if (state.testLastResult && state.testLastResult.answers) {
    const res = state.testLastResult;
    document.getElementById('test-already-done-box').classList.add('hidden');
    renderTestResults(res.score, res.total, res.percent, res.diamonds, res.answers);
  }
}

function adminResetTestToday() {
  state.testDoneToday = false;
  state.testDate = getTodayDateString();
  state.testLastResult = null;
  syncTrackerQuestsWithState();
  saveState();
  updateTopBadges();
  updateAdminTestUI();
  playTone(600, 0.1, 'sine', 0.2);
  alertUserFeedback('Dnešní test byl resetován!');
}

function updateAdminTestUI() {
  const config = state.testConfig || DEFAULT_TEST_CONFIG;
  const topics = config.enabledTopics || DEFAULT_TEST_CONFIG.enabledTopics;

  for (let i = 1; i <= 7; i++) {
    const cb = document.getElementById(`test-topic-reading_${i}`);
    if (cb) cb.checked = !!topics[`reading_${i}`];
  }

  for (let i = 1; i <= 6; i++) {
    const cb = document.getElementById(`test-topic-math_${i}`);
    if (cb) cb.checked = !!topics[`math_${i}`];
  }

  const countInp = document.getElementById('admin-test-task-count-input');
  if (countInp) countInp.value = config.taskCount || 8;

  const rCount = [1,2,3,4,5,6,7].filter(i => topics[`reading_${i}`]).length;
  const mCount = [1,2,3,4,5,6].filter(i => topics[`math_${i}`]).length;
  const rBadge = document.getElementById('admin-test-reading-count-badge');
  const mBadge = document.getElementById('admin-test-math-count-badge');
  if (rBadge) rBadge.textContent = `${rCount} vybráno`;
  if (mBadge) mBadge.textContent = `${mCount} vybráno`;

  const container = document.getElementById('admin-test-thresholds-container');
  if (container) {
    container.innerHTML = '';
    config.thresholds.forEach((th, idx) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold';
      row.innerHTML = `
        <span class="w-28 truncate text-slate-700 text-[11px]">${th.label}:</span>
        <div class="flex items-center gap-1">
          <span class="text-slate-500 text-[10px]">Od:</span>
          <input type="number" min="0" max="100" value="${th.minPercent}" onchange="saveAdminTestThreshold(${idx}, 'minPercent', this.value)" class="w-12 text-center font-black text-slate-900 py-0.5 px-1 border border-purple-300 rounded-lg bg-white text-xs">
          <span class="text-slate-500 text-[10px]">%</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-slate-500 text-[10px]">Odměna:</span>
          <input type="number" min="0" max="20" value="${th.diamonds}" onchange="saveAdminTestThreshold(${idx}, 'diamonds', this.value)" class="w-10 text-center font-black py-0.5 px-1 border border-cyan-300 rounded-lg bg-white text-cyan-800 text-xs">
          <span class="text-xs">💎</span>
        </div>
      `;
      container.appendChild(row);
    });
  }

  const statusLabel = document.getElementById('admin-test-status-label');
  if (statusLabel) {
    statusLabel.textContent = state.testDoneToday ? 'Stav: Dnešní test byl dnes již dokončen.' : 'Stav: Test je dnes připraven k absolvování.';
  }
}

function saveAdminTestTopic(topicKey, isChecked) {
  if (!state.testConfig) state.testConfig = JSON.parse(JSON.stringify(DEFAULT_TEST_CONFIG));
  if (!state.testConfig.enabledTopics) state.testConfig.enabledTopics = JSON.parse(JSON.stringify(DEFAULT_TEST_CONFIG.enabledTopics));
  
  state.testConfig.enabledTopics[topicKey] = isChecked;
  saveState();
  updateAdminTestUI();
  playTone(550, 0.08, 'sine', 0.15);
}

function toggleAllTestTopics(selectVal) {
  if (!state.testConfig) state.testConfig = JSON.parse(JSON.stringify(DEFAULT_TEST_CONFIG));
  if (!state.testConfig.enabledTopics) state.testConfig.enabledTopics = {};

  for (let i = 1; i <= 7; i++) state.testConfig.enabledTopics[`reading_${i}`] = selectVal;
  for (let i = 1; i <= 6; i++) state.testConfig.enabledTopics[`math_${i}`] = selectVal;

  saveState();
  updateAdminTestUI();
  playTone(600, 0.1, 'sine', 0.2);
}

function saveAdminTestTaskCount(val) {
  const count = Math.max(4, Math.min(25, parseInt(val, 10) || 8));
  if (!state.testConfig) state.testConfig = JSON.parse(JSON.stringify(DEFAULT_TEST_CONFIG));
  state.testConfig.taskCount = count;
  saveState();
  playTone(550, 0.08, 'sine', 0.15);
}

function saveAdminTestThreshold(index, field, val) {
  if (!state.testConfig) state.testConfig = JSON.parse(JSON.stringify(DEFAULT_TEST_CONFIG));
  const num = parseInt(val, 10) || 0;
  state.testConfig.thresholds[index][field] = num;
  saveState();
  playTone(550, 0.08, 'sine', 0.15);
}

/* ============================================================
   SYNCHRONIZACE MEZI ZAŘÍZENÍMI (PROTOKOL SM2)
   ============================================================ */

function exportCurrentSyncPayload() {
  const lettersShort = state.activeLetters.join(',');
  const legActive = (state.legendaryChest && state.legendaryChest.active && !state.legendaryChest.claimed) ? 1 : 0;
  const legDia = (state.legendaryChest ? state.legendaryChest.diamonds : 10);
  const legTitle = (state.legendaryChest ? (state.legendaryChest.title || '') : '').replace(/[|:~]/g, ' ');

  const tDone = state.testDoneToday ? 1 : 0;
  const tScore = (state.testLastResult && state.testLastResult.score !== undefined) ? state.testLastResult.score : 0;
  const tTotal = (state.testLastResult && state.testLastResult.total !== undefined) ? state.testLastResult.total : 8;
  const tPercent = (state.testLastResult && state.testLastResult.percent !== undefined) ? state.testLastResult.percent : 0;
  const tDiamonds = (state.testLastResult && state.testLastResult.diamonds !== undefined) ? state.testLastResult.diamonds : 0;

  const custom = state.customizations || DEFAULT_UNLOCKED_CUSTOMIZATIONS;
  const activeSkin = custom.activeSkin || 'steve';
  const activeTheme = custom.activeTheme || 'theme-sky';
  const activeSound = custom.activeSound || 'sound-classic';
  const unlockedSkinsStr = (custom.unlockedSkins || []).join(',');
  const unlockedThemesStr = (custom.unlockedThemes || []).join(',');
  const unlockedSoundsStr = (custom.unlockedSounds || []).join(',');

  const parts = [
    'SM2',
    state.minutesBalance,
    state.dailyEarnedToday,
    state.vaultBalance,
    state.goldDiamonds,
    state.bonusMaxLimitMinutes,
    state.tabletSecretPin || '1234',
    state.streakDays || 0,
    state.boxClaimed ? 1 : 0,
    tDone,
    tScore,
    tTotal,
    tPercent,
    tDiamonds,
    state.mathMax || 10,
    state.pokemonSegmentsCount || 12,
    legActive,
    legDia,
    legTitle,
    lettersShort,
    activeSkin,
    activeTheme,
    activeSound,
    unlockedSkinsStr,
    unlockedThemesStr,
    unlockedSoundsStr
  ];

  return parts.join('~');
}

function importSyncPayload(rawStr) {
  try {
    const text = rawStr.trim();
    if (!text.startsWith('SM1~') && !text.startsWith('SM2~')) {
      throw new Error('Neplatný formát kódu.');
    }

    const p = text.split('~');

    if (text.startsWith('SM2~')) {
      state.minutesBalance = parseFloat(p[1]) || 0;
      state.dailyEarnedToday = parseFloat(p[2]) || 0;
      state.vaultBalance = parseFloat(p[3]) || 0;
      state.goldDiamonds = parseInt(p[4], 10) || 0;
      state.bonusMaxLimitMinutes = parseInt(p[5], 10) || 0;
      state.tabletSecretPin = p[6] || 'XXXX';
      state.streakDays = parseInt(p[7], 10) || 0;
      state.boxClaimed = (p[8] === '1');
      state.testDoneToday = (p[9] === '1');
      
      const tScore = parseInt(p[10], 10) || 0;
      const tTotal = parseInt(p[11], 10) || 8;
      const tPercent = parseInt(p[12], 10) || 0;
      const tDiamonds = parseInt(p[13], 10) || 0;

      if (state.testDoneToday) {
        state.testLastResult = {
          date: getTodayDateString(),
          score: tScore,
          total: tTotal,
          percent: tPercent,
          diamonds: tDiamonds,
          answers: (state.testLastResult && state.testLastResult.answers) ? state.testLastResult.answers : []
        };
      } else {
        state.testLastResult = null;
      }

      state.mathMax = parseInt(p[14], 10) || 10;
      state.pokemonSegmentsCount = parseInt(p[15], 10) || 12;

      const legActive = (p[16] === '1');
      const legDia = parseInt(p[17], 10) || 10;
      const legTitle = p[18] || 'ZA VÝBORNÉ VÝSLEDKY VE ŠKOLE';

      state.legendaryChest = {
        active: legActive,
        diamonds: legDia,
        title: legTitle,
        claimed: !legActive
      };

      if (p[19]) {
        const ltrs = p[19].split(',').filter(x => x.length > 0);
        if (ltrs.length > 0) state.activeLetters = ltrs;
      }

      if (p[20]) {
        if (!state.customizations) state.customizations = JSON.parse(JSON.stringify(DEFAULT_UNLOCKED_CUSTOMIZATIONS));
        state.customizations.activeSkin = p[20] || 'steve';
        state.customizations.activeTheme = p[21] || 'theme-sky';
        state.customizations.activeSound = p[22] || 'sound-classic';

        if (p[23]) state.customizations.unlockedSkins = p[23].split(',');
        if (p[24]) state.customizations.unlockedThemes = p[24].split(',');
        if (p[25]) state.customizations.unlockedSounds = p[25].split(',');
      }
    }

    state.history.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('cs-CZ'),
      type: 'synced',
      minutes: 0,
      note: 'Stav načten z druhého zařízení'
    });

    saveState();
    applyCurrentTheme();
    updateTopAvatarDisplay();
    updateBalanceUI();
    updateTopBadges();
    updateDiamondMarketUI();
    updateAdminDiamondUI();
    updateAdminLegendaryUI();
    updateAdminTestUI();
    renderAlphabetGrid();
    renderRewardInputs();
    generateLessonItems();

    const testView = document.getElementById('view-test');
    if (testView && !testView.classList.contains('hidden')) {
      openTestView();
    }

    playCustomSuccessSound();
    triggerConfetti();
    alertUserFeedback('Synchronizace hotova! 🚀');
    return true;
  } catch (err) {
    console.error('Chyba importu:', err);
    soundError();
    alertUserFeedback('Chyba: Kód je neplatný!');
    return false;
  }
}

function generateSyncQRModal() {
  const modal = document.getElementById('sync-export-modal');
  const qrContainer = document.getElementById('sync-qrcode-display');
  const textInput = document.getElementById('sync-export-text-input');

  const payload = exportCurrentSyncPayload();
  textInput.value = payload;
  qrContainer.innerHTML = '';

  let rendered = false;

  if (typeof QRCode !== 'undefined') {
    try {
      new QRCode(qrContainer, {
        text: payload,
        width: 195,
        height: 195,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      rendered = true;
    } catch (e) {
      console.warn('QRCode JS error:', e);
    }
  }

  if (!rendered) {
    const img = document.createElement('img');
    img.src = `https://quickchart.io/qr?text=${encodeURIComponent(payload)}&size=195&ecLevel=M&margin=1`;
    img.alt = 'QR Kód';
    img.className = 'w-[195px] h-[195px] mx-auto block rounded-xl shadow-md border-2 border-slate-200';
    qrContainer.appendChild(img);
  }

  modal.classList.remove('hidden');
  playTone(600, 0.1, 'sine', 0.2);
}

function closeSyncExportModal() {
  document.getElementById('sync-export-modal').classList.add('hidden');
}

function copySyncCodeAction() {
  const input = document.getElementById('sync-export-text-input');
  input.select();
  input.setSelectionRange(0, 99999);
  try {
    navigator.clipboard.writeText(input.value);
    alertUserFeedback('Kód zkopírován! 📋');
  } catch (e) {
    document.execCommand('copy');
    alertUserFeedback('Kód zkopírován! 📋');
  }
}

let html5QrScannerInstance = null;

function openCameraScanModal() {
  const modal = document.getElementById('sync-camera-modal');
  const statusEl = document.getElementById('sync-camera-status');
  modal.classList.remove('hidden');
  statusEl.textContent = 'Spouštím kameru... 🎥';

  if (html5QrScannerInstance) {
    try { html5QrScannerInstance.stop().catch(() => {}); } catch (e) {}
  }

  if (typeof Html5Qrcode === 'undefined') {
    statusEl.innerHTML = '<span class="text-rose-600">Kamerový modul není načten. Použijte ruční kód.</span>';
    return;
  }

  html5QrScannerInstance = new Html5Qrcode("sync-camera-scanner-view");
  const config = { fps: 12, qrbox: { width: 230, height: 230 } };

  html5QrScannerInstance.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      statusEl.textContent = 'Kód načten! 🚀';
      playTone(650, 0.15, 'triangle', 0.25);
      
      html5QrScannerInstance.stop().then(() => {
        closeCameraScanModal();
        importSyncPayload(decodedText);
      }).catch(() => {
        closeCameraScanModal();
        importSyncPayload(decodedText);
      });
    },
    () => {}
  ).catch(() => {
    statusEl.innerHTML = `<span class="text-rose-600">Nelze spustit kameru. Povolte přístup nebo použijte kód.</span>`;
  });
}

function closeCameraScanModal() {
  if (html5QrScannerInstance) {
    try { html5QrScannerInstance.stop().catch(() => {}); } catch (e) {}
  }
  document.getElementById('sync-camera-modal').classList.add('hidden');
}

function openManualCodeModal() {
  const modal = document.getElementById('sync-manual-modal');
  document.getElementById('sync-manual-textarea').value = '';
  modal.classList.remove('hidden');
  playTone(550, 0.08, 'sine', 0.15);
}

function closeManualCodeModal() {
  document.getElementById('sync-manual-modal').classList.add('hidden');
}

function submitManualSyncCode() {
  const text = document.getElementById('sync-manual-textarea').value.trim();
  if (!text) {
    alertUserFeedback('Vložte kód!');
    return;
  }
  const ok = importSyncPayload(text);
  if (ok) closeManualCodeModal();
}

function goToQuestLevel(questId) {
  if (questId === 'q_daily_all' || questId === 'q_reading_all') {
    showView('learn');
  } else if (questId === 'q_math_all') {
    setSubject('math');
    const mathLvl = (state.currentMathLevel && state.currentMathLevel <= 6) ? state.currentMathLevel : 1;
    switchMathLevel(mathLvl);
    showView('learn');
  } else if (questId === 'q_test') {
    showView('test');
  } else if (questId === 'q_arena') {
    showView('arena');
  } else if (questId === 'q_coloring') {
    setSubject('math');
    switchMathLevel(7);
    showView('learn');
  } else {
    showView('learn');
  }
  playTone(500, 0.1, 'sine', 0.15);
}

function getQuestRewardRate(questId) {
  if (!state.rewards) return 3.0;
  if (state.rewards.questRate !== undefined) {
    return state.rewards.questRate;
  }
  if (questId === 'q_reading_all' && state.rewards.readingQuestRate !== undefined) {
    return state.rewards.readingQuestRate;
  }
  if (questId === 'q_math_all' && state.rewards.mathQuestRate !== undefined) {
    return state.rewards.mathQuestRate;
  }
  return 3.0;
}

function renderDailyQuests() {
  checkAndHandleDailyResets();
  syncTrackerQuestsWithState();
  const container = document.getElementById('quests-list-container');
  const dateDisplay = document.getElementById('quests-date-display');
  
  const todayFormatted = new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'numeric' });
  dateDisplay.textContent = todayFormatted;

  container.innerHTML = '';

  const cleanQuestTitles = {
    q_daily_all: 'Denní výzva',
    q_test: 'Denní test',
    q_arena: 'Boj s pety',
    q_coloring: 'Omalovánka'
  };

  state.quests.forEach(quest => {
    const qTitle = cleanQuestTitles[quest.id] || quest.title;
    const qRate = getQuestRewardRate(quest.id);
    const isTracker = !!quest.isTrackerOnly;
    const totalWithQuest = Math.round(((state.dailyEarnedToday || 0) + (quest.claimed ? 0 : qRate)) * 100) / 100;
    const meetsMinPlayReward = isTracker || quest.claimed || totalWithQuest >= 15;
    const isDone = quest.claimed || (quest.progress >= quest.target && meetsMinPlayReward);
    const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100));

    const card = document.createElement('div');
    card.className = `p-3 sm:p-3.5 rounded-2xl border-2 shadow-sm flex items-center justify-between gap-3 transition-all ${
      quest.claimed || (isTracker && isDone)
        ? 'bg-emerald-50/60 border-emerald-300 opacity-90' 
        : isDone 
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-400 ring-2 ring-emerald-300 shadow-md' 
          : isTracker
            ? 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:shadow-sm cursor-pointer'
            : 'bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-md cursor-pointer'
    }`;

    if (!isDone) {
      card.onclick = () => goToQuestLevel(quest.id);
    }

    let actionHtml = '';
    if (isTracker) {
      if (isDone) {
        actionHtml = `
          <div class="flex items-center gap-1.5 text-emerald-800 font-black text-xs bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl flex-shrink-0">
            <span>✅</span> Hotovo
          </div>
        `;
      } else {
        actionHtml = `
          <button onclick="event.stopPropagation(); goToQuestLevel('${quest.id}')" class="game-button text-xs font-black bg-slate-700 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1 flex-shrink-0">
            Přejít ➡️
          </button>
        `;
      }
    } else if (quest.claimed) {
      actionHtml = `
        <div class="flex items-center gap-1.5 text-emerald-700 font-black text-xs bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl flex-shrink-0">
          <span>✅</span> +${formatMinutes(qRate)} ⭐
        </div>
      `;
    } else if (isDone) {
      actionHtml = `
        <button onclick="event.stopPropagation(); claimQuestReward('${quest.id}')" class="game-button bg-emerald-500 hover:bg-emerald-600 text-white font-black px-3.5 py-2 rounded-xl border-b-4 border-emerald-700 text-xs shadow-game-btn flex items-center gap-1.5 flex-shrink-0 animate-bounce">
          <span>🎁</span> +${formatMinutes(qRate)}
        </button>
      `;
    } else {
      actionHtml = `
        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-[11px] font-black text-indigo-900 bg-amber-200 border border-amber-400 px-2.5 py-1 rounded-xl whitespace-nowrap">
            +${formatMinutes(qRate)} ⭐ + 🔥
          </span>
          <button onclick="event.stopPropagation(); goToQuestLevel('${quest.id}')" class="game-button text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1 whitespace-nowrap">
            Trénovat ➡️
          </button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="flex items-center gap-3 flex-grow min-w-0">
        <span class="text-2xl ${isTracker ? 'bg-slate-100 border-slate-200' : 'bg-indigo-50 border-indigo-100'} p-2 rounded-xl border flex-shrink-0">${quest.icon}</span>
        <div class="flex-grow min-w-0">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <h4 class="font-black text-slate-800 text-sm sm:text-base truncate">${qTitle}</h4>
            <span class="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg flex-shrink-0">
              ${quest.progress}/${quest.target}
            </span>
          </div>
          <div class="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300">
            <div class="bg-gradient-to-r ${isDone ? 'from-emerald-500 to-teal-500' : 'from-indigo-500 to-purple-500'} h-full rounded-full transition-all duration-500" style="width: ${percent}%;"></div>
          </div>
        </div>
      </div>
      ${actionHtml}
    `;

    container.appendChild(card);
  });
}

function claimQuestReward(questId) {
  checkAndHandleDailyResets();
  const quest = state.quests.find(q => q.id === questId);
  if (!quest || quest.claimed || quest.progress < quest.target) return;

  if (!quest.isTrackerOnly) {
    const qRate = getQuestRewardRate(questId);
    const totalWithQuest = Math.round(((state.dailyEarnedToday || 0) + qRate) * 100) / 100;
    if (totalWithQuest < 15) {
      const missingMin = Math.max(0, Math.round((15 - totalWithQuest) * 100) / 100);
      soundError();
      alertUserFeedback(`Pro splnění 16 úkolů je nutné získat alespoň 15 min odměn za hraní (chybí ještě ${formatMinutes(missingMin)})!`);
      return;
    }
    quest.claimed = true;
    creditRewardMinutes(qRate, `Denní úkol: ${quest.title}`);
  } else {
    quest.claimed = true;
  }

  syncTraceabilityQuestsIfActive();
  saveState();
  updateBalanceUI();
  playCustomSuccessSound();
  triggerConfetti();
  checkStreakStatus();
  renderDailyQuests();
  updateTopBadges();
}

function saveDiamondRate(val) {
  const rate = Math.max(1, parseInt(val, 10) || 20);
  state.diamondExchangeRate = rate;
  saveState();
  updateDiamondMarketUI();
  playTone(550, 0.08, 'sine', 0.15);
  alertUserFeedback(`Kurz: 1 minuta = ${rate} diamantů 💎`);
}

function adminAdjustBonusMinutes(delta) {
  state.bonusMaxLimitMinutes = Math.max(0, (state.bonusMaxLimitMinutes || 0) + delta);
  saveState();
  updateAdminDiamondUI();
  updateDiamondMarketUI();
  playTone(600, 0.1, 'sine', 0.15);
}

function adminAdjustDiamonds(delta) {
  state.goldDiamonds = Math.max(0, (state.goldDiamonds || 0) + delta);
  saveState();
  updateBalanceUI();
  updateTopBadges();
  updateAdminDiamondUI();
  updateDiamondMarketUI();
  if (typeof renderStorePetsUI === 'function') renderStorePetsUI();
  if (typeof renderArenaView === 'function') renderArenaView();
  playTone(600, 0.1, 'sine', 0.15);
}

function adminSetDiamondsDirect(val) {
  const num = Math.max(0, parseInt(val, 10) || 0);
  state.goldDiamonds = num;
  saveState();
  updateBalanceUI();
  updateTopBadges();
  updateAdminDiamondUI();
  updateDiamondMarketUI();
  if (typeof renderStorePetsUI === 'function') renderStorePetsUI();
  if (typeof renderArenaView === 'function') renderArenaView();
  playTone(600, 0.1, 'sine', 0.15);
  alertUserFeedback(`Počet diamantů nastaven na ${num} 💎`);
}

function updateAdminDiamondUI() {
  const bonusLabel = document.getElementById('admin-bonus-minutes-label');
  if (bonusLabel) bonusLabel.textContent = `+${state.bonusMaxLimitMinutes || 0} min`;

  const diamondsIndicator = document.getElementById('admin-diamonds-indicator');
  if (diamondsIndicator) diamondsIndicator.textContent = `${state.goldDiamonds || 0} 💎`;

  const diamondsDirectInp = document.getElementById('admin-diamonds-direct-input');
  if (diamondsDirectInp) diamondsDirectInp.value = (state.goldDiamonds || 0).toString();

  const rateInput = document.getElementById('admin-diamond-rate-input');
  if (rateInput) rateInput.value = getLimitExtensionCost();
}

function adminAdjustStreak(delta) {
  state.streakDays = Math.max(0, (state.streakDays || 0) + delta);
  if (state.streakDays > 0) state.streakLastActiveDate = getTodayDateString();
  saveState();
  updateTopBadges();
  renderStreakView();
  document.getElementById('admin-streak-display').textContent = `${state.streakDays} dní`;
  playTone(600, 0.1, 'sine', 0.2);
  alertUserFeedback(`Denní řada upravena na ${state.streakDays} dní!`);
}

function adminFreezeStreak() {
  state.streakTodayCompleted = true;
  state.streakLastActiveDate = getTodayDateString();
  saveState();
  updateTopBadges();
  renderStreakView();
  playTone(650, 0.12, 'triangle', 0.2);
  alertUserFeedback('Dnešek byl omluven! 🛡️');
}

function adminResetQuests() {
  state.quests = createDefaultDailyQuests(state.customDailyLevelChoice || 4);
  state.questsDate = getTodayDateString();
  saveState();
  playTone(700, 0.15, 'sine', 0.2);
  renderDailyQuests();
  updateBalanceUI();
  updateTopBadges();
  alertUserFeedback('Denní úkoly resetovány!');
}

function adminResetChest() {
  state.boxClaimed = false;
  state.boxDate = getTodayDateString();
  state.lastBoxReward = 0.0;
  state.lastBoxRewardText = '';
  isOpeningChest = false;
  saveState();
  playTone(700, 0.15, 'sine', 0.2);
  updateTopBadges();
  updateAdminLegendaryUI();
  alertUserFeedback('Denní truhla znovu připravena!');
}

function adminResetDailyDirectLimit() {
  state.dailyEarnedToday = 0.0;
  state.dailyReadingEarnedToday = 0.0;
  state.dailyMathEarnedToday = 0.0;
  state.dailyEarnedDate = getTodayDateString();
  state.vouchersBoughtDate = getTodayDateString();
  state.dailyStandardVoucherBought = null;
  state.dailyMaxVoucherBought = null;
  saveState();
  updateBalanceUI();
  updateVoucherStoreUI();
  playTone(700, 0.15, 'sine', 0.2);
  alertUserFeedback('Dnešní limity (30 min i poukazy v obchodě) byly vynulovány!');
}

function adminTransferCustomVault() {
  const input = document.getElementById('vault-transfer-input');
  const val = parseFloat(input.value.replace(',', '.'));
  const available = state.vaultBalance || 0;

  if (isNaN(val) || val <= 0) {
    alertUserFeedback('Zadej platný počet minut k převodu.');
    return;
  }
  if (val > available) {
    alertUserFeedback(`V trezoru je pouze ${formatMinutes(available)}.`);
    return;
  }

  state.vaultBalance = Math.round((available - val) * 100) / 100;
  state.minutesBalance = Math.round((state.minutesBalance + val) * 100) / 100;

  state.history.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('cs-CZ'),
    type: 'admin_transfer',
    minutes: val,
    note: `Převod z trezoru (+${formatMinutes(val)})`
  });

  input.value = '';
  saveState();
  updateBalanceUI();
  renderHistoryLog();
  playTone(620, 0.12, 'triangle', 0.2);
  alertUserFeedback(`Z trezoru převedeno +${formatMinutes(val)}!`);
}

function adminUnlockVaultNow() {
  if ((state.vaultBalance || 0) <= 0) {
    alertUserFeedback('V nočním trezoru nejsou žádné uložené minuty.');
    return;
  }
  const val = state.vaultBalance;
  state.minutesBalance = Math.round((state.minutesBalance + val) * 100) / 100;
  state.vaultBalance = 0.0;
  
  state.history.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('cs-CZ'),
    type: 'admin_transfer_all',
    minutes: val,
    note: `Kompletní převod z trezoru (+${formatMinutes(val)})`
  });

  saveState();
  updateBalanceUI();
  renderHistoryLog();
  playTone(650, 0.15, 'triangle', 0.25);
  alertUserFeedback(`Celý trezor převeden (+${formatMinutes(val)})!`);
}

let activeFeedbackPopupTimer = null;

function alertUserFeedback(msg) {
  const existing = document.getElementById('center-feedback-popup-overlay');
  if (existing) existing.remove();
  if (activeFeedbackPopupTimer) {
    clearTimeout(activeFeedbackPopupTimer);
    activeFeedbackPopupTimer = null;
  }

  const rawText = String(msg || '').trim();
  const lower = rawText.toLowerCase();

  const isWarningOrLimit =
    lower.includes('potřebuješ') ||
    lower.includes('dnes už byl') ||
    lower.includes('nebylo úplně správně') ||
    lower.includes('chyba') ||
    lower.includes('nelze') ||
    lower.includes('chybí') ||
    lower.includes('došly') ||
    lower.includes('nejsou') ||
    lower.includes('zadej') ||
    lower.includes('vložte') ||
    lower.includes('musí zůstat');

  let badgeIcon = '🎉';
  if (rawText.includes('💎')) badgeIcon = '💎';
  else if (rawText.includes('⭐') || rawText.includes('🌟')) badgeIcon = '⭐';
  else if (rawText.includes('🐾')) badgeIcon = '🐾';
  else if (rawText.includes('🔥')) badgeIcon = '🔥';
  else if (rawText.includes('🌙')) badgeIcon = '🌙';
  else if (rawText.includes('⏱️') || rawText.includes('⏹')) badgeIcon = '⏱️';
  else if (rawText.includes('🚀')) badgeIcon = '🚀';
  else if (isWarningOrLimit) badgeIcon = '💡';

  const frameTheme = isWarningOrLimit
    ? 'store-card-frame--amber'
    : rawText.includes('💎')
      ? 'store-card-frame--sky'
      : 'store-card-frame--emerald';

  const iconBoxBg = isWarningOrLimit
    ? 'from-amber-400 to-orange-500 border-amber-200'
    : rawText.includes('💎')
      ? 'from-cyan-400 to-blue-600 border-cyan-200'
      : 'from-emerald-400 to-teal-500 border-emerald-200';

  const btnBg = isWarningOrLimit
    ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 border-amber-600'
    : rawText.includes('💎')
      ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-700'
      : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-700';

  const overlay = document.createElement('div');
  overlay.id = 'center-feedback-popup-overlay';
  overlay.className = 'fixed inset-0 z-[95] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px] cursor-pointer';

  const card = document.createElement('div');
  card.className = `store-card-frame ${frameTheme} center-popup-enter max-w-sm w-full p-5 text-center flex flex-col items-center gap-2.5 cursor-default`;
  card.onclick = (e) => e.stopPropagation();

  const closePopup = () => {
    if (activeFeedbackPopupTimer) {
      clearTimeout(activeFeedbackPopupTimer);
      activeFeedbackPopupTimer = null;
    }
    card.classList.remove('center-popup-enter');
    card.classList.add('center-popup-exit');
    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
    }, 210);
  };

  overlay.onclick = closePopup;

  card.innerHTML = `
    <div class="w-16 h-16 rounded-3xl bg-gradient-to-tr ${iconBoxBg} border-2 shadow-lg flex items-center justify-center text-3xl select-none center-popup-icon-anim">
      ${badgeIcon}
    </div>
    <div class="text-base sm:text-lg font-black text-slate-800 font-baloo leading-snug px-1">
      ${rawText}
    </div>
    <button type="button" class="game-button mt-1 px-6 py-2 rounded-2xl font-black text-xs sm:text-sm border-b-4 shadow-sm ${btnBg}">
      ${isWarningOrLimit ? 'Rozumím 👍' : 'Paráda! 👍'}
    </button>
  `;

  const btn = card.querySelector('button');
  if (btn) btn.onclick = closePopup;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  activeFeedbackPopupTimer = setTimeout(closePopup, 2800);
}

function openParentModal() {
  const modal = document.getElementById('parent-pin-modal');
  const challenge = document.getElementById('math-challenge');
  const err = document.getElementById('pin-error');
  const input = document.getElementById('pin-input');
  if (challenge) challenge.classList.add('hidden');
  if (err) err.classList.add('hidden');
  if (input) input.value = '';

  if (modal) modal.classList.remove('hidden');
  setTimeout(() => { if (input) input.focus(); }, 150);
}

function closeParentModal() {
  document.getElementById('parent-pin-modal').classList.add('hidden');
}

function verifyParentPin() {
  const input = document.getElementById('pin-input').value.trim();
  const err = document.getElementById('pin-error');

  if (input === '2552') {
    closeParentModal();
    openAdminPanel();
  } else {
    if (err) err.classList.remove('hidden');
    soundError();
  }
}

function switchAdminTab(tabKey) {
  const btnGeneral = document.getElementById('admin-tab-btn-general');
  const btnTrace = document.getElementById('admin-tab-btn-traceability');
  const btnAccounts = document.getElementById('admin-tab-btn-accounts');
  const btnSkins = document.getElementById('admin-tab-btn-skins_admin');
  const btnPets = document.getElementById('admin-tab-btn-pets_admin');
  const btnTest = document.getElementById('admin-tab-btn-test');
  const btnLegend = document.getElementById('admin-tab-btn-legendary');
  const btnMath = document.getElementById('admin-tab-btn-math');
  const btnReading = document.getElementById('admin-tab-btn-reading');

  const contentGeneral = document.getElementById('admin-tab-content-general');
  const contentTrace = document.getElementById('admin-tab-content-traceability');
  const contentAccounts = document.getElementById('admin-tab-content-accounts');
  const contentSkins = document.getElementById('admin-tab-content-skins_admin');
  const contentPets = document.getElementById('admin-tab-content-pets_admin');
  const contentTest = document.getElementById('admin-tab-content-test');
  const contentLegend = document.getElementById('admin-tab-content-legendary');
  const contentMath = document.getElementById('admin-tab-content-math');
  const contentReading = document.getElementById('admin-tab-content-reading');

  [btnGeneral, btnTrace, btnAccounts, btnSkins, btnPets, btnTest, btnLegend, btnMath, btnReading].forEach(b => {
    if (b) b.className = 'w-full py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all text-slate-700 hover:bg-slate-200 flex items-center gap-2 text-left';
  });

  if (contentGeneral) contentGeneral.classList.add('hidden');
  if (contentTrace) contentTrace.classList.add('hidden');
  if (contentAccounts) contentAccounts.classList.add('hidden');
  if (contentSkins) contentSkins.classList.add('hidden');
  if (contentPets) contentPets.classList.add('hidden');
  if (contentTest) contentTest.classList.add('hidden');
  if (contentLegend) contentLegend.classList.add('hidden');
  if (contentMath) contentMath.classList.add('hidden');
  if (contentReading) contentReading.classList.add('hidden');

  if (tabKey === 'traceability') {
    if (btnTrace) btnTrace.className = 'w-full py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all bg-emerald-600 text-white shadow-sm flex items-center gap-2 text-left';
    if (contentTrace) contentTrace.classList.remove('hidden');
    renderAdminTraceabilityUI();
  } else if (tabKey === 'accounts') {
    if (btnAccounts) btnAccounts.className = 'w-full py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all bg-sky-600 text-white shadow-sm flex items-center gap-2 text-left';
    if (contentAccounts) contentAccounts.classList.remove('hidden');
    renderAdminAccountsList(true);
  } else if (tabKey === 'skins_admin') {
    if (btnSkins) btnSkins.className = 'w-full py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all bg-pink-600 text-white shadow-sm flex items-center gap-2 text-left';
    if (contentSkins) contentSkins.classList.remove('hidden');
    updateAdminSkinsUI();
  } else if (tabKey === 'pets_admin') {
    if (btnPets) btnPets.className = 'w-full py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all bg-rose-600 text-white shadow-sm flex items-center gap-2 text-left';
    if (contentPets) contentPets.classList.remove('hidden');
    if (typeof updateAdminPetsUI === 'function') updateAdminPetsUI();
  } else if (tabKey === 'test') {
    if (btnTest) btnTest.className = 'w-full py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all bg-purple-700 text-white shadow-sm flex items-center gap-2 text-left';
    if (contentTest) contentTest.classList.remove('hidden');
    updateAdminTestUI();
  } else if (tabKey === 'legendary') {
    if (btnLegend) btnLegend.className = 'w-full py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all bg-cyan-600 text-white shadow-sm flex items-center gap-2 text-left';
    if (contentLegend) contentLegend.classList.remove('hidden');
    updateAdminLegendaryUI();
  } else if (tabKey === 'math') {
    if (btnMath) btnMath.className = 'w-full py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all bg-amber-500 text-white shadow-sm flex items-center gap-2 text-left';
    if (contentMath) contentMath.classList.remove('hidden');
  } else if (tabKey === 'reading') {
    if (btnReading) btnReading.className = 'w-full py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all bg-sky-500 text-white shadow-sm flex items-center gap-2 text-left';
    if (contentReading) contentReading.classList.remove('hidden');
  } else {
    if (btnGeneral) btnGeneral.className = 'w-full py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all bg-indigo-600 text-white shadow-sm flex items-center gap-2 text-left';
    if (contentGeneral) contentGeneral.classList.remove('hidden');
  }
  playTone(520, 0.08, 'sine', 0.12);
}

async function renderAdminAccountsList(fetchFromCloud = false) {
  const container = document.getElementById('admin-accounts-list-container');
  if (!container) return;

  if ((fetchFromCloud || !cachedCloudEnvelope) && navigator.onLine) {
    container.innerHTML = `
      <div class="p-4 text-center text-xs font-bold text-slate-500 bg-white rounded-2xl border border-slate-200">
        🔄 Načítám aktuální stav účtů z cloudu (GitHub Gist)...
      </div>
    `;
    try {
      await fetchCloudEnvelopeFromGist();
    } catch (e) {
      console.warn('Nelze stáhnout seznam účtů z GitHub Gistu:', e);
    }
  }

  const localReg = getLocalAccountsRegistry();
  const cloudAccounts = (cachedCloudEnvelope && cachedCloudEnvelope.users)
    ? cachedCloudEnvelope.users
    : ((cachedCloudEnvelope && cachedCloudEnvelope.accounts) ? cachedCloudEnvelope.accounts : {});

  // Sjednotíme všechny klíče účtů (misa, test + jakékoliv vytvořené účty lokálně či v Gistu)
  const allUsernames = Array.from(new Set([
    'misa',
    'test',
    ...Object.keys(localReg),
    ...Object.keys(cloudAccounts)
  ]));

  container.innerHTML = allUsernames.map(uname => {
    const localMeta = localReg[uname] || null;
    const cloudMeta = cloudAccounts[uname] || null;
    const displayName = (localMeta && localMeta.displayName) || (cloudMeta && cloudMeta.displayName) || `ŠKOLÁK ${uname.toUpperCase()}`;
    const password = (localMeta && localMeta.password) || (cloudMeta && cloudMeta.password) || '—';
    const isCurrent = Boolean(currentLoggedInUser && currentLoggedInUser.username === uname);

    const isMisa = uname === 'misa';
    const isTest = uname === 'test';

    // Zjistíme uložený stav účtu: přednost má čerstvý stav z GitHub Gistu
    const localState = readLocalParsedStateForUser(uname);
    const cloudState = cloudMeta && isValidGameStateObject(cloudMeta.state)
      ? cloudMeta.state
      : (cloudMeta && isValidGameStateObject(cloudMeta.progress) ? cloudMeta.progress : null);

    let bestState = null;
    if (cloudState) {
      const cloudTime = Math.max(Number(cloudMeta.updatedAt) || 0, Number(cloudState.lastSavedAt) || 0);
      const localTime = localState ? (Number(localState.lastSavedAt) || 0) : 0;
      bestState = (isCurrent && pendingCloudSync && localState && localTime > cloudTime)
        ? localState
        : cloudState;

      // Aktualizujeme lokální paměť tohoto zařízení podle Gistu, aby v ní nezůstávala stará testovací data
      try {
        const serializedCloud = JSON.stringify(bestState);
        localStorage.setItem(`${USER_STORAGE_PREFIX}${uname}`, serializedCloud);
        if (isMisa) {
          localStorage.setItem(STORAGE_KEY, serializedCloud);
        }
      } catch (e) {}
    } else if (isTest) {
      bestState = isCurrent ? state : (localState || { minutesBalance: 0, goldDiamonds: 5000, streakDays: 0 });
    } else {
      bestState = isCurrent ? state : localState;
    }

    const mins = bestState ? formatMinutes(bestState.minutesBalance || 0) : '0 min';
    const dias = bestState ? (bestState.goldDiamonds !== undefined ? bestState.goldDiamonds : (bestState.gems || 0)) : (isTest ? 5000 : 0);
    const streak = bestState ? (bestState.streakDays || 0) : 0;

    let badgeHtml = '';
    if (isMisa) {
      badgeHtml = '<span class="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">🛡️ Hlavní účet Míši</span>';
    } else if (isTest) {
      badgeHtml = '<span class="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">🧪 Vestavěný testovací účet</span>';
    } else {
      badgeHtml = '<span class="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">👤 Vytvořený účet</span>';
    }

    const activeBadgeHtml = isCurrent
      ? '<span class="bg-sky-100 text-sky-900 border border-sky-300 text-[10px] font-black px-2 py-0.5 rounded-lg">✨ Právě přihlášen</span>'
      : '';

    let actionBtnHtml = '';
    if (isMisa) {
      actionBtnHtml = `
        <span class="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          🔒 Chráněný účet (nelze smazat)
        </span>
      `;
    } else if (isTest) {
      actionBtnHtml = `
        <button type="button" onclick="resetTestAccountFromAdmin()" class="game-button bg-amber-500 hover:bg-amber-600 text-white font-black px-3 py-1.5 rounded-xl text-xs border-b-2 border-amber-700 shadow-xs flex items-center gap-1">
          <span>🔄</span> <span>Resetovat test (5 000 💎)</span>
        </button>
      `;
    } else {
      actionBtnHtml = `
        <button type="button" onclick="deleteUserAccountFromAdmin('${uname}')" class="game-button bg-rose-500 hover:bg-rose-600 text-white font-black px-3.5 py-1.5 rounded-xl text-xs border-b-2 border-rose-700 shadow-xs flex items-center gap-1.5">
          <span>🗑️</span> <span>Smazat účet</span>
        </button>
      `;
    }

    return `
      <div class="bg-white border-2 ${isCurrent ? 'border-sky-400 ring-2 ring-sky-100' : 'border-slate-200'} rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm sm:text-base font-black text-slate-900 font-mono">${uname}</span>
            <span class="text-xs font-extrabold text-slate-500">(${displayName})</span>
            ${badgeHtml}
            ${activeBadgeHtml}
          </div>
          <div class="flex items-center gap-3 text-xs font-bold text-slate-600 flex-wrap mt-0.5">
            <span>🔑 Heslo: <strong class="font-mono text-slate-800">${password}</strong></span>
            <span>⭐ Kredit: <strong class="text-amber-700">${mins}</strong></span>
            <span>💎 Diamanty: <strong class="text-cyan-700">${dias}</strong></span>
            <span>🔥 Řada: <strong class="text-orange-600">${streak} dní</strong></span>
            <span>💾 Úložiště: <strong>${cloudMeta ? 'Lokální + GitHub Gist' : 'Lokální'}</strong></span>
          </div>
        </div>
        <div class="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
          ${actionBtnHtml}
        </div>
      </div>
    `;
  }).join('');
}

async function resetTestAccountFromAdmin() {
  try {
    const cleanTest = createCleanDefaultGameState();
    applyTestAccountPerks(cleanTest);
    cleanTest.lastSavedAt = Date.now();
    localStorage.setItem(`${USER_STORAGE_PREFIX}test`, JSON.stringify(cleanTest));

    if (currentLoggedInUser && currentLoggedInUser.username === 'test') {
      state = cleanTest;
      window.state = state;
      saveStateToLocalStorageOnly();
      refreshAllUIAfterCloudSync();
      await pushStateToGist(false);
    } else if (navigator.onLine) {
      try {
        await fetchCloudEnvelopeFromGist();
        if (cachedCloudEnvelope && cachedCloudEnvelope.users) {
          cachedCloudEnvelope.users.test = {
            username: 'test',
            password: BUILTIN_ACCOUNTS.test.password,
            displayName: BUILTIN_ACCOUNTS.test.displayName,
            updatedAt: Date.now(),
            progress: cleanTest,
            state: cleanTest
          };
          cachedCloudEnvelope.accounts.test = cachedCloudEnvelope.users.test;
          const gistPayload = buildGistUsersPayloadFromEnvelope(cachedCloudEnvelope);
          const targetFile = cachedGistFilename || 'gistfile1.txt';
          await fetch(GIST_API_URL, {
            method: 'PATCH',
            headers: {
              'Authorization': `token ${GITHUB_TOKEN}`,
              'Accept': 'vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              files: {
                [targetFile]: {
                  content: JSON.stringify(gistPayload, null, 2)
                }
              }
            })
          });
        }
      } catch (err) {
        console.warn('Chyba při resetu test účtu v Gistu:', err);
      }
    }
    renderAdminAccountsList(false);
    alertUserFeedback('Testovací účet "test" byl vyčištěn a nastaven na 5 000 💎!');
  } catch (e) {
    console.error('Chyba při resetu test účtu:', e);
  }
}

async function deleteUserAccountFromAdmin(username) {
  const uname = normalizeAccountUsername(username);
  if (!uname || uname === 'misa' || uname === 'test') {
    alertUserFeedback('Tento výchozí účet nelze smazat.');
    return;
  }

  // 1. Odstraníme z lokálního registru účtů a lokálního úložiště
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_REGISTRY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object') {
      delete parsed[uname];
      localStorage.setItem(LOCAL_ACCOUNTS_REGISTRY_KEY, JSON.stringify(parsed));
    }
    localStorage.removeItem(`${USER_STORAGE_PREFIX}${uname}`);
    if (localStorage.getItem(REMEMBERED_USER_KEY) === uname) {
      localStorage.removeItem(REMEMBERED_USER_KEY);
    }
  } catch (e) {
    console.error('Chyba při mazání lokálního účtu:', e);
  }

  // 2. Odstraníme i z GitHub Gistu, pokud je zařízení online
  if (navigator.onLine) {
    try {
      await fetchCloudEnvelopeFromGist();
      if (cachedCloudEnvelope) {
        if (cachedCloudEnvelope.users) delete cachedCloudEnvelope.users[uname];
        if (cachedCloudEnvelope.accounts) delete cachedCloudEnvelope.accounts[uname];
        cachedCloudEnvelope.updatedAt = Date.now();
        const gistPayload = buildGistUsersPayloadFromEnvelope(cachedCloudEnvelope);
        const targetFile = cachedGistFilename || 'gistfile1.txt';
        await fetch(GIST_API_URL, {
          method: 'PATCH',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            files: {
              [targetFile]: {
                content: JSON.stringify(gistPayload, null, 2)
              }
            }
          })
        });
      }
    } catch (err) {
      console.warn('Chyba při mazání účtu z GitHub Gistu:', err);
    }
  }

  if (typeof playTone === 'function') playTone(500, 0.1, 'sine', 0.18);
  alertUserFeedback(`Účet "${uname}" byl kompletně odstraněn!`);

  // Pokud jsme smazali právě přihlášený účet, odhlásíme se na úvodní obrazovku
  if (currentLoggedInUser && currentLoggedInUser.username === uname) {
    closeAdminPanel();
    logoutCurrentAccount();
  } else {
    renderAdminAccountsList(false);
  }
}

function switchTraceabilitySubView(viewKey) {
  traceabilitySubView = (viewKey === 'chart') ? 'chart' : 'table';
  const btnTable = document.getElementById('traceability-subtab-btn-table');
  const btnChart = document.getElementById('traceability-subtab-btn-chart');
  const viewTable = document.getElementById('traceability-subview-table');
  const viewChart = document.getElementById('traceability-subview-chart');

  if (traceabilitySubView === 'chart') {
    if (btnTable) btnTable.className = 'px-3 py-1 rounded-lg text-xs font-black transition-all text-emerald-950 hover:bg-emerald-100';
    if (btnChart) btnChart.className = 'px-3 py-1 rounded-lg text-xs font-black transition-all bg-emerald-600 text-white shadow-xs';
    if (viewTable) viewTable.classList.add('hidden');
    if (viewChart) viewChart.classList.remove('hidden');
    renderTraceabilityChart();
  } else {
    if (btnTable) btnTable.className = 'px-3 py-1 rounded-lg text-xs font-black transition-all bg-emerald-600 text-white shadow-xs';
    if (btnChart) btnChart.className = 'px-3 py-1 rounded-lg text-xs font-black transition-all text-emerald-950 hover:bg-emerald-100';
    if (viewTable) viewTable.classList.remove('hidden');
    if (viewChart) viewChart.classList.add('hidden');
    renderAdminTraceabilityUI();
  }
  playTone(520, 0.06, 'sine', 0.1);
}

function toggleTraceabilityChartFilter(metricKey) {
  if (!traceabilityChartFilters) {
    traceabilityChartFilters = { duration: true, minutes: true, diamonds: true };
  }
  const currentVal = !!traceabilityChartFilters[metricKey];
  const activeCount = Object.values(traceabilityChartFilters).filter(Boolean).length;
  if (currentVal && activeCount <= 1) {
    alertUserFeedback('Musí zůstat zapnutá alespoň jedna metrika.');
    return;
  }
  traceabilityChartFilters[metricKey] = !currentVal;

  const btnDuration = document.getElementById('trace-filter-btn-duration');
  const btnMinutes = document.getElementById('trace-filter-btn-minutes');
  const btnDiamonds = document.getElementById('trace-filter-btn-diamonds');

  if (btnDuration) {
    btnDuration.className = traceabilityChartFilters.duration
      ? 'px-2.5 py-1 rounded-lg text-xs font-black transition-all border-2 flex items-center gap-1.5 bg-indigo-600 text-white border-indigo-700 shadow-xs'
      : 'px-2.5 py-1 rounded-lg text-xs font-black transition-all border-2 flex items-center gap-1.5 bg-slate-100 text-slate-500 border-slate-300 opacity-60';
  }
  if (btnMinutes) {
    btnMinutes.className = traceabilityChartFilters.minutes
      ? 'px-2.5 py-1 rounded-lg text-xs font-black transition-all border-2 flex items-center gap-1.5 bg-amber-500 text-white border-amber-600 shadow-xs'
      : 'px-2.5 py-1 rounded-lg text-xs font-black transition-all border-2 flex items-center gap-1.5 bg-slate-100 text-slate-500 border-slate-300 opacity-60';
  }
  if (btnDiamonds) {
    btnDiamonds.className = traceabilityChartFilters.diamonds
      ? 'px-2.5 py-1 rounded-lg text-xs font-black transition-all border-2 flex items-center gap-1.5 bg-cyan-600 text-white border-cyan-700 shadow-xs'
      : 'px-2.5 py-1 rounded-lg text-xs font-black transition-all border-2 flex items-center gap-1.5 bg-slate-100 text-slate-500 border-slate-300 opacity-60';
  }

  playTone(560, 0.05, 'sine', 0.1);
  renderTraceabilityChart();
}

function toggleTraceabilityRowDetail(dateIso) {
  traceabilityExpandedDate = (traceabilityExpandedDate === dateIso) ? null : dateIso;
  renderAdminTraceabilityUI();
  playTone(480, 0.05, 'sine', 0.08);
}

function renderAdminTraceabilityUI() {
  const listEl = document.getElementById('admin-traceability-list');
  if (!listEl) return;

  syncTraceabilityQuestsIfActive();
  const records = Array.isArray(state.traceabilityHistory) ? state.traceabilityHistory : [];

  if (traceabilitySubView === 'chart') {
    renderTraceabilityChart();
    return;
  }

  if (records.length === 0) {
    listEl.innerHTML = `
      <div class="bg-white/80 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center">
        <div class="text-3xl mb-1">⏱️</div>
        <div class="text-sm font-black text-slate-700">Zatím žádná zaznamenaná historie tréninku.</div>
        <div class="text-xs font-bold text-slate-500 mt-1">Spusť stopky v horní liště (▶) během učení. Po vypnutí stopek (podržením ⏹ na 3 sekundy) se zde zobrazí jednořádkový denní přehled i detailní rozpis.</div>
      </div>
    `;
    return;
  }

  const todayIso = getTodayDateString();
  const totalQuestsCount = Array.isArray(state.quests) ? state.quests.length : 6;

  const statLabels = [
    { key: 'letters', label: '🔤 Písmena' },
    { key: 'syllables', label: '🗣️ Slabiky' },
    { key: 'words', label: '📖 Slova' },
    { key: 'sentences', label: '📝 Věty' },
    { key: 'spelling', label: '🐝 Hláskování' },
    { key: 'coins', label: '🪙 Mince / Vracení' },
    { key: 'examples', label: '➕ Příklady' },
    { key: 'comparisons', label: '⚖️ Porovnávání' },
    { key: 'sequences', label: '🔢 Číselné řady' },
    { key: 'decompositions', label: '🔺 Rozklady čísel' },
    { key: 'wordProblems', label: '📘 Slovní úlohy' },
    { key: 'coloringSegments', label: '🎨 Dílky omalovánky' }
  ];

  listEl.innerHTML = records.map(rec => {
    const isToday = rec.dateIso === todayIso;
    const isRunning = isToday && isStopwatchSessionActive();
    const activeExtraSec = isRunning ? Math.floor(stopwatchState.elapsedSec || 0) : 0;
    const totalSec = (rec.totalDurationSec || 0) + activeExtraSec;
    const sessions = Array.isArray(rec.sessions) ? rec.sessions : [];
    const st = rec.stats || {};
    const isExpanded = traceabilityExpandedDate === rec.dateIso;

    // Sloupec B: Časové intervaly procvičení v kompaktní podobě
    const intervalsText = sessions.length > 0
      ? sessions.map(s => `${s.start}–${s.end} (${formatDurationHuman(s.durationSec)})`).join(', ')
      : (isRunning ? `Měří: ${formatDurationHuman(activeExtraSec)}` : 'Žádný interval');

    // Detailní rozpis aktivních jednotkových statistik pro rozbalený detail
    const activeStatsBadges = statLabels
      .filter(item => (st[item.key] || 0) > 0)
      .map(item => `
        <span class="inline-flex items-center gap-1.5 bg-white border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 shadow-2xs">
          <span>${item.label}:</span>
          <strong class="text-indigo-700 font-black text-sm">${st[item.key]}×</strong>
        </span>
      `).join('');

    const sessionsDetailHtml = sessions.length > 0
      ? sessions.map((s, idx) => `
          <div class="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-950 px-2.5 py-1 rounded-xl text-xs font-bold shadow-2xs">
            <span class="font-black text-emerald-700">#${idx + 1}</span>
            <span>${s.start} – ${s.end}</span>
            <span class="bg-emerald-600 text-white px-1.5 py-0.5 rounded-md text-[10px] font-black">${formatDurationHuman(s.durationSec)}</span>
          </div>
        `).join('')
      : '<span class="text-xs text-slate-400 italic font-bold">Stopky zatím nebyly ukončeny (běží nebo čekají na uložení).</span>';

    return `
      <div class="rounded-2xl border-2 transition-all ${isToday ? 'border-emerald-400 bg-emerald-50/40 shadow-xs' : 'border-slate-200 bg-white hover:border-emerald-300 shadow-xs'} overflow-hidden">
        <!-- Hlavní jednořádkový panel (Sloupec A až F) -->
        <div onclick="toggleTraceabilityRowDetail('${rec.dateIso}')" class="p-2.5 sm:p-3 cursor-pointer select-none hover:bg-emerald-50/50 transition-colors flex flex-col md:grid md:grid-cols-12 gap-2 md:items-center">
          
          <!-- Sloupec A: Datum -->
          <div class="md:col-span-2 flex items-center gap-1.5">
            <span class="text-sm font-black text-slate-900">${rec.dateDisplay || rec.dateIso}</span>
            ${isToday ? '<span class="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">Dnes</span>' : ''}
            ${isRunning ? '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping" title="Stopky aktivní"></span>' : ''}
          </div>

          <!-- Sloupec B: Intervaly procvičení -->
          <div class="md:col-span-3 text-xs text-slate-600 font-medium truncate" title="${intervalsText}">
            <span class="md:hidden font-black text-slate-700 mr-1">Intervaly:</span>
            <span class="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700 font-mono text-[11px]">${intervalsText}</span>
          </div>

          <!-- Sloupec C: Čas trénování -->
          <div class="md:col-span-2 flex md:justify-center items-center gap-1 text-xs">
            <span class="md:hidden font-black text-slate-700 mr-1">Čas:</span>
            <span class="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-950 font-black px-2 py-0.5 rounded-lg">
              ⏱️ ${formatDurationHuman(totalSec)}
            </span>
          </div>

          <!-- Sloupec D: Získané minuty -->
          <div class="md:col-span-2 flex md:justify-center items-center gap-1 text-xs">
            <span class="md:hidden font-black text-slate-700 mr-1">Minuty:</span>
            <span class="inline-flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-950 font-black px-2 py-0.5 rounded-lg">
              ⭐ +${formatMinutes(rec.earnedMinutes || 0)} min
            </span>
          </div>

          <!-- Sloupec E: Mise -->
          <div class="md:col-span-1 flex md:justify-center items-center gap-1 text-xs">
            <span class="md:hidden font-black text-slate-700 mr-1">Mise:</span>
            <span class="inline-flex items-center gap-0.5 bg-sky-50 border border-sky-200 text-sky-950 font-black px-1.5 py-0.5 rounded-lg text-[11px]">
              🎯 ${rec.dailyQuestsCompleted || 0}/${totalQuestsCount}
            </span>
          </div>

          <!-- Sloupec F: Drahokamy + Šipka -->
          <div class="md:col-span-2 flex items-center justify-between md:justify-center gap-2 text-xs">
            <div class="flex items-center gap-1">
              <span class="md:hidden font-black text-slate-700 mr-1">Diamanty:</span>
              <span class="inline-flex items-center gap-1 bg-cyan-50 border border-cyan-300 text-cyan-950 font-black px-2 py-0.5 rounded-lg">
                💎 +${rec.earnedDiamonds || 0}
              </span>
            </div>
            <span class="text-xs text-slate-400 font-black ml-auto md:ml-1 transition-transform ${isExpanded ? 'rotate-180 text-emerald-700' : ''}">
              ▼
            </span>
          </div>

        </div>

        <!-- Rozbalovací detail po kliknutí na řádek -->
        ${isExpanded ? `
          <div class="border-t-2 border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/30 p-3 sm:p-4 space-y-3">
            <div>
              <div class="text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <span>⏱️</span> <span>Časové intervaly stopek v tomto dni:</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                ${sessionsDetailHtml}
              </div>
            </div>

            <div>
              <div class="text-[11px] font-black text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <span>📚</span> <span>Procvičené lekce za celý den (jednotkový počet splnění):</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                ${activeStatsBadges || '<span class="text-xs text-slate-400 italic font-bold">V tomto dni nebyly zaznamenány žádné procvičené lekce při spuštěných stopkách.</span>'}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function renderTraceabilityChart() {
  const container = document.getElementById('traceability-chart-container');
  if (!container) return;

  const records = Array.isArray(state.traceabilityHistory) ? [...state.traceabilityHistory] : [];
  if (records.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10">
        <div class="text-3xl mb-1">📈</div>
        <div class="text-sm font-black text-slate-700">Graf zatím nemá dostatek dat.</div>
        <div class="text-xs font-bold text-slate-500 mt-1">Po ukončení prvního tréninku se stopkami se zde vykreslí vývoj v čase.</div>
      </div>
    `;
    return;
  }

  // Zobrazujeme chronologicky (od nejstaršího po nejnovější)
  records.sort((a, b) => (a.dateIso || '').localeCompare(b.dateIso || ''));
  // Maximálně posledních 14 dnů pro přehlednost
  const displayRecords = records.slice(-14);

  const filters = traceabilityChartFilters || { duration: true, minutes: true, diamonds: true };

  // Data pro každý den
  const chartData = displayRecords.map(rec => {
    const isToday = rec.dateIso === getTodayDateString();
    const activeExtraSec = (isToday && isStopwatchSessionActive()) ? Math.floor(stopwatchState.elapsedSec || 0) : 0;
    const totalSec = (rec.totalDurationSec || 0) + activeExtraSec;
    const durationMin = Math.round((totalSec / 60) * 10) / 10;
    const earnedMin = Math.round((rec.earnedMinutes || 0) * 100) / 100;
    const earnedDiamonds = rec.earnedDiamonds || 0;

    // Krátký popisek data (např. 9.11.)
    const dateParts = (rec.dateIso || '').split('-');
    const shortLabel = dateParts.length === 3 ? `${parseInt(dateParts[2], 10)}.${parseInt(dateParts[1], 10)}.` : (rec.dateDisplay || rec.dateIso);

    return {
      dateIso: rec.dateIso,
      shortLabel,
      durationMin,
      earnedMin,
      earnedDiamonds
    };
  });

  // Určení maximální hodnoty pro škálu Y
  let maxVal = 5;
  chartData.forEach(d => {
    if (filters.duration && d.durationMin > maxVal) maxVal = d.durationMin;
    if (filters.minutes && d.earnedMin > maxVal) maxVal = d.earnedMin;
    if (filters.diamonds && d.earnedDiamonds > maxVal) maxVal = d.earnedDiamonds;
  });
  // Přidáme 15% rezervu nahoru pro popisky
  maxVal = Math.ceil(maxVal * 1.15) || 5;

  const svgWidth = Math.max(500, chartData.length * 68 + 80);
  const svgHeight = 260;
  const chartTop = 30;
  const chartBottom = svgHeight - 40;
  const chartHeight = chartBottom - chartTop;
  const chartLeft = 50;
  const chartRight = svgWidth - 20;
  const chartPlotWidth = chartRight - chartLeft;

  const dayWidth = chartPlotWidth / chartData.length;

  // Počet aktivních sloupců na den
  const activeSeries = [];
  if (filters.duration) activeSeries.push({ key: 'durationMin', color: '#6366f1', label: 'Čas (min)' });
  if (filters.minutes) activeSeries.push({ key: 'earnedMin', color: '#f59e0b', label: 'Minuty' });
  if (filters.diamonds) activeSeries.push({ key: 'earnedDiamonds', color: '#06b6d4', label: 'Diamanty' });

  const barWidth = Math.min(18, Math.max(8, (dayWidth - 14) / (activeSeries.length || 1)));

  // Horizontální vodicí linky (4 úrovně)
  const gridSteps = 4;
  let gridLinesSvg = '';
  for (let i = 0; i <= gridSteps; i++) {
    const yVal = Math.round((maxVal / gridSteps) * i * 10) / 10;
    const yPos = chartBottom - (i / gridSteps) * chartHeight;
    gridLinesSvg += `
      <line x1="${chartLeft}" y1="${yPos}" x2="${chartRight}" y2="${yPos}" stroke="#e2e8f0" stroke-dasharray="4 4" stroke-width="1" />
      <text x="${chartLeft - 8}" y="${yPos + 4}" fill="#64748b" font-size="11" font-weight="700" text-anchor="end">${yVal}</text>
    `;
  }

  // Sloupce pro jednotlivé dny
  let barsSvg = '';
  chartData.forEach((day, dayIndex) => {
    const dayCenterX = chartLeft + dayIndex * dayWidth + dayWidth / 2;
    const totalBarsWidth = activeSeries.length * barWidth;
    const startX = dayCenterX - totalBarsWidth / 2;

    activeSeries.forEach((series, sIdx) => {
      const val = day[series.key] || 0;
      const barH = maxVal > 0 ? (val / maxVal) * chartHeight : 0;
      const barX = startX + sIdx * barWidth;
      const barY = chartBottom - barH;

      // Zaoblení nahoře
      barsSvg += `
        <rect x="${barX + 1}" y="${barY}" width="${Math.max(1, barWidth - 2)}" height="${Math.max(2, barH)}" rx="3" fill="${series.color}" opacity="0.9" />
        ${val > 0 ? `
          <text x="${barX + barWidth / 2}" y="${Math.max(chartTop - 6, barY - 4)}" fill="${series.color}" font-size="10" font-weight="900" text-anchor="middle">
            ${val}
          </text>
        ` : ''}
      `;
    });

    // Popisek data na ose X
    barsSvg += `
      <text x="${dayCenterX}" y="${chartBottom + 18}" fill="#334155" font-size="11" font-weight="800" text-anchor="middle">
        ${day.shortLabel}
      </text>
    `;
  });

  container.innerHTML = `
    <div class="w-full flex flex-col items-center">
      <svg width="${svgWidth}" height="${svgHeight}" class="max-w-full overflow-visible">
        <!-- Vodící mřížka -->
        ${gridLinesSvg}

        <!-- Osy -->
        <line x1="${chartLeft}" y1="${chartBottom}" x2="${chartRight}" y2="${chartBottom}" stroke="#94a3b8" stroke-width="2" />
        <line x1="${chartLeft}" y1="${chartTop}" x2="${chartLeft}" y2="${chartBottom}" stroke="#94a3b8" stroke-width="2" />

        <!-- Sloupce dat -->
        ${barsSvg}
      </svg>

      <!-- Legenda barev pod grafem -->
      <div class="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-slate-200 text-xs font-black flex-wrap">
        ${filters.duration ? '<div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-md bg-indigo-500 inline-block"></span><span class="text-indigo-950">⏱️ Celkový čas (minuty)</span></div>' : ''}
        ${filters.minutes ? '<div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-md bg-amber-500 inline-block"></span><span class="text-amber-950">⭐ Získané minuty</span></div>' : ''}
        ${filters.diamonds ? '<div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-md bg-cyan-500 inline-block"></span><span class="text-cyan-950">💎 Počet diamantů</span></div>' : ''}
      </div>
    </div>
  `;
}

function clearTraceabilityHistory() {
  state.traceabilityHistory = [];
  saveState();
  renderAdminTraceabilityUI();
  playTone(450, 0.1, 'sine', 0.15);
  alertUserFeedback('Historie traceability byla vymazána.');
}

function openAdminPanel() {
  const panel = document.getElementById('admin-panel-modal');
  updateBalanceUI();
  renderAlphabetGrid();
  renderHistoryLog();
  renderAdminMathSteps();
  updateAdminMathUI();
  renderRewardInputs();
  updateAdminDiamondUI();
  updateAdminLegendaryUI();
  updateAdminTestUI();
  updateAdminSkinsUI();
  updateAdminVoiceSettingsUI();
  renderAdminTraceabilityUI();
  if (typeof updateAdminPetsUI === 'function') updateAdminPetsUI();

  const verTag = document.getElementById('admin-version-tag');
  if (verTag) verTag.textContent = `Verze: ${APP_VERSION}`;

  document.getElementById('admin-segments-slider').value = state.pokemonSegmentsCount || 12;
  document.getElementById('admin-segments-count-label').textContent = (state.pokemonSegmentsCount || 12).toString();
  document.getElementById('admin-secret-pin-input').value = state.tabletSecretPin || 'XXXX';
  document.getElementById('admin-spelling-repeats-label').textContent = `${state.spellingRepeatCount || 3}×`;
  document.getElementById('admin-streak-display').textContent = `${state.streakDays || 0} dní`;

  switchAdminTab('general');
  panel.classList.remove('hidden');
}

function closeAdminPanel() {
  document.getElementById('admin-panel-modal').classList.add('hidden');
  updateNavTabRewardLabels();
  generateLessonItems();
}

function updateOptimizerSummariesUI() {
  if (!state.rewards) return;
  const qBonus = getQuestRewardRate('q_daily_all');

  const rVals = [1, 2, 3, 4, 5, 6, 7, 8].map(i => Number(state.rewards.reading?.[i] ?? 0.75));
  const mVals = [1, 2, 3, 4, 5, 6].map(i => Number(state.rewards.math?.[i] ?? 0.75));
  const allVals = [...rVals, ...mVals];

  const minTask = Math.min(...allVals);
  const maxTask = Math.max(...allVals);

  const totalMin = Math.round(((16 * minTask) + qBonus) * 100) / 100;
  const totalMax = Math.round(((16 * maxTask) + qBonus) * 100) / 100;

  const summaryEl = document.getElementById('optimize-all-summary');
  if (summaryEl) {
    const rangeStr = minTask === maxTask ? `${maxTask} min` : `${minTask}–${maxTask} min`;
    const totalStr = totalMin === totalMax ? `${totalMax} min` : `${totalMin}–${totalMax} min`;
    summaryEl.innerHTML = `Aktuálně: 16× cvičení (<strong>${rangeStr}</strong>) + denní úkol <strong>${qBonus} min</strong> = celkem <strong class="text-indigo-800">${totalStr}</strong> (podmínka min. 15 min)`;
  }

  const targetInput = document.getElementById('optimize-all-target-input');
  if (targetInput) {
    targetInput.value = Math.max(15, state.optimizeAllTarget || state.optimizeReadingTarget || 15);
  }
}

function optimizeAllRewards() {
  if (!state.rewards) state.rewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS));
  const inputEl = document.getElementById('optimize-all-target-input');
  const rawVal = inputEl ? parseFloat(inputEl.value.replace(',', '.')) : 15;

  if (isNaN(rawVal) || rawVal < 15) {
    if (inputEl) inputEl.value = '15';
    alertUserFeedback('Podmínka: 16 úkolů je vždy podmíněno získáním alespoň 15 min odměn za hraní! Nastavuji minimum 15 min.');
  }

  const targetTotal = Math.max(15, Math.round((isNaN(rawVal) ? 15 : rawVal) * 100) / 100);
  if (inputEl) inputEl.value = String(targetTotal);

  // Rozdělíme targetTotal mezi 16 cvičení (80 % = 16/20) a bonus za denní úkol (20 % = 4/20)
  // tak, aby 16 * perTask + questBonus === targetTotal (a vždy >= 15 min)
  const perTask = Math.max(0.75, Math.floor((targetTotal / 20) * 100) / 100);
  const questBonus = Math.max(0, Math.round((targetTotal - (16 * perTask)) * 100) / 100);

  state.optimizeAllTarget = targetTotal;
  state.optimizeReadingTarget = targetTotal;
  state.optimizeMathTarget = targetTotal;

  for (let i = 1; i <= 8; i++) {
    state.rewards.reading[i] = perTask;
  }
  for (let i = 1; i <= 6; i++) {
    state.rewards.math[i] = perTask;
  }
  state.rewards.questRate = questBonus;
  state.rewards.readingQuestRate = questBonus;
  state.rewards.mathQuestRate = questBonus;

  saveState();
  renderRewardInputs();
  updateNavTabRewardLabels();
  updateReviewButtonLabel();
  renderDailyQuests();
  updateBalanceUI();
  playTone(660, 0.12, 'triangle', 0.22);

  alertUserFeedback(`Čtení, Matematika i Denní úkol optimalizovány na ${targetTotal} min (16× ${perTask} min + denní úkol ${questBonus} min)!`);
}

function optimizeSubjectRewards() {
  optimizeAllRewards();
}

function renderRewardInputs() {
  if (!state.rewards) state.rewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS));
  const qRateInput = document.getElementById('reward-quest-rate');
  if (qRateInput) qRateInput.value = getQuestRewardRate('q_daily_all');

  const readingBox = document.getElementById('rewards-reading-inputs');
  readingBox.innerHTML = '';
  const rNames = ['1. Písmena', '2. Slabiky', '3. Jednoslabičná', '4. Dvouslabičná', '5. Shluky/OU', '6. DĚ/TĚ/NĚ', '7. Celé věty', '8. Hláskování'];
  
  for (let i = 1; i <= 8; i++) {
    const val = (state.rewards.reading && state.rewards.reading[i] !== undefined) ? state.rewards.reading[i] : DEFAULT_REWARDS.reading[i];
    const item = document.createElement('div');
    item.className = 'bg-white p-2 rounded-xl border border-emerald-200 flex flex-col justify-between';
    item.innerHTML = `
      <span class="text-[10px] font-black text-slate-700 truncate mb-0.5">${rNames[i - 1]}</span>
      <div class="flex items-center gap-1">
        <input type="number" step="0.05" min="0.0" max="20" value="${val}" onchange="saveRewardRate('reading', ${i}, this.value)" class="w-full text-center font-black text-indigo-900 bg-emerald-50 border border-emerald-300 rounded-lg py-0.5 text-xs">
        <span class="text-[9px] font-bold text-slate-500">min</span>
      </div>
    `;
    readingBox.appendChild(item);
  }

  const mathBox = document.getElementById('rewards-math-inputs');
  mathBox.innerHTML = '';
  const mNames = ['1. Skládání mincí', '2. Porovnávání', '3. Číselná řada', '4. Počítadlo', '5. Rozklad čísel', '6. Slovní úlohy'];

  for (let i = 1; i <= 6; i++) {
    const val = (state.rewards.math && state.rewards.math[i] !== undefined) ? state.rewards.math[i] : DEFAULT_REWARDS.math[i];
    const item = document.createElement('div');
    item.className = 'bg-white p-2 rounded-xl border border-emerald-200 flex flex-col justify-between';
    item.innerHTML = `
      <span class="text-[10px] font-black text-slate-700 truncate mb-0.5">${mNames[i - 1]}</span>
      <div class="flex items-center gap-1">
        <input type="number" step="0.05" min="0.0" max="20" value="${val}" onchange="saveRewardRate('math', ${i}, this.value)" class="w-full text-center font-black text-indigo-900 bg-emerald-50 border border-emerald-300 rounded-lg py-0.5 text-xs">
        <span class="text-[9px] font-bold text-slate-500">min</span>
      </div>
    `;
    mathBox.appendChild(item);
  }

  updateOptimizerSummariesUI();
}

function saveRewardRate(category, level, valStr) {
  const num = Math.max(0, Math.round((parseFloat(valStr.replace(',', '.')) || 0) * 100) / 100);
  if (!state.rewards) state.rewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS));

  if (category === 'quest') {
    state.rewards.questRate = num;
    state.rewards.readingQuestRate = num;
    state.rewards.mathQuestRate = num;
  } else if (category === 'reading_quest') {
    state.rewards.readingQuestRate = num;
  } else if (category === 'math_quest') {
    state.rewards.mathQuestRate = num;
  } else if (category === 'reading') {
    state.rewards.reading[level] = num;
  } else if (category === 'math') {
    state.rewards.math[level] = num;
  }

  saveState();
  updateNavTabRewardLabels();
  updateReviewButtonLabel();
  updateOptimizerSummariesUI();
  renderDailyQuests();
  playTone(550, 0.08, 'sine', 0.15);
}

function resetDefaultRewards() {
  state.rewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS));
  saveState();
  renderRewardInputs();
  updateNavTabRewardLabels();
  updateReviewButtonLabel();
  renderDailyQuests();
  playTone(600, 0.1, 'sine', 0.2);
  alertUserFeedback('Odměny obnoveny na výchozí hodnoty!');
}

function adjustSpellingRepeats(delta) {
  const cur = state.spellingRepeatCount || 3;
  const next = Math.max(1, Math.min(5, cur + delta));
  state.spellingRepeatCount = next;
  document.getElementById('admin-spelling-repeats-label').textContent = `${next}×`;
  saveState();
  playTone(580, 0.08, 'sine', 0.15);
}

const MATH_STEP_VALUES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function renderAdminMathSteps() {
  const container = document.getElementById('slider-steps-container');
  container.innerHTML = '';
  const current = state.mathMax || 10;

  MATH_STEP_VALUES.forEach(val => {
    const btn = document.createElement('button');
    const isActive = val === current;
    btn.className = `py-1.5 rounded-xl text-xs sm:text-sm font-black border-2 transition-all flex flex-col items-center justify-center ${
      isActive ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-105' : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100'
    }`;
    btn.innerHTML = `<span>${val}</span>`;
    btn.onclick = () => { setMathMaxVal(val); };
    container.appendChild(btn);
  });
}

function setMathMaxVal(val) {
  state.mathMax = val;
  saveState();
  renderAdminMathSteps();
  updateAdminMathUI();
  playTone(550, 0.08, 'sine', 0.15);
}

function updateAdminMathUI() {
  const badge = document.getElementById('admin-math-max-badge');
  const val = state.mathMax || 10;
  if (badge) badge.textContent = `Do ${val}`;
}

function changeSegmentsCount(val) {
  state.pokemonSegmentsCount = parseInt(val, 10);
  document.getElementById('admin-segments-count-label').textContent = val;
  saveState();
}

function saveSecretPin(val) {
  state.tabletSecretPin = val.trim();
  saveState();
  alertUserFeedback(`Tajný PIN nastaven na: ${val}`);
}

function renderAlphabetGrid() {
  const container = document.getElementById('alphabet-grid-container');
  container.innerHTML = '';

  const headerBar = document.createElement('div');
  headerBar.className = 'col-span-full flex items-center justify-between pb-2 mb-1 border-b border-slate-200';
  headerBar.innerHTML = `
    <span class="text-xs font-black text-slate-700">Aktivní písmena pro čtení:</span>
    <button onclick="unselectAllLetters()" class="game-button bg-rose-100 hover:bg-rose-200 text-rose-800 font-black px-2.5 py-1 rounded-xl text-xs transition-colors flex items-center gap-1 shadow-sm">
      <span>❌</span> Odznačit vše
    </button>
  `;
  container.appendChild(headerBar);

  FULL_CZECH_ALPHABET.forEach(char => {
    const isChecked = state.activeLetters.includes(char);
    const item = document.createElement('div');
    item.className = `p-1.5 rounded-xl border text-center font-black cursor-pointer transition-all select-none ${
      isChecked ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm scale-100' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 opacity-60'
    }`;
    item.innerHTML = `<span class="text-sm sm:text-base block game-font">${char}</span>`;

    item.addEventListener('click', () => {
      if (state.activeLetters.includes(char)) {
        if (state.activeLetters.length > 1) state.activeLetters = state.activeLetters.filter(l => l !== char);
      } else {
        state.activeLetters.push(char);
      }
      saveState();
      renderAlphabetGrid();
    });
    container.appendChild(item);
  });
}

function unselectAllLetters() {
  state.activeLetters = [];
  saveState();
  renderAlphabetGrid();
  playTone(400, 0.1, 'sine', 0.15);
  alertUserFeedback('Všechna písmenka byla odznačena.');
}

function applyPreset(presetKey) {
  if (PRESETS[presetKey]) {
    state.activeLetters = [...PRESETS[presetKey]];
    saveState();
    renderAlphabetGrid();
    playTone(600, 0.1, 'sine', 0.2);
  }
}

function adjustMinutes(delta, note) {
  checkAndHandleDailyResets();
  state.minutesBalance = Math.max(0, Math.round((state.minutesBalance + delta) * 100) / 100);

  if (delta < 0) {
    const deduction = Math.abs(delta);
    state.dailyEarnedToday = Math.max(0, Math.round(((state.dailyEarnedToday || 0) - deduction) * 100) / 100);
  }

  state.history.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('cs-CZ'),
    type: delta >= 0 ? 'admin_add' : 'admin_deduct',
    minutes: delta,
    note: note || (delta > 0 ? `Přidáno +${formatMinutes(delta)}` : `Odečteno ${formatMinutes(delta)}`)
  });

  saveState();
  renderHistoryLog();
  updateBalanceUI();
  const minutesDirectInp = document.getElementById('admin-minutes-direct-input');
  if (minutesDirectInp) minutesDirectInp.value = (Math.round((state.minutesBalance || 0) * 100) / 100).toString();
  playTone(550, 0.2, 'sine', 0.2);
}

function adminSetMinutesDirect(val) {
  checkAndHandleDailyResets();
  const parsed = parseFloat(String(val ?? '0').replace(',', '.'));
  const num = Math.max(0, Math.round((isNaN(parsed) ? 0 : parsed) * 100) / 100);
  const prev = Math.max(0, Math.round((state.minutesBalance || 0) * 100) / 100);
  const diff = Math.round((num - prev) * 100) / 100;

  state.minutesBalance = num;
  if (diff < 0) {
    state.dailyEarnedToday = Math.max(0, Math.round(((state.dailyEarnedToday || 0) + diff) * 100) / 100);
  }

  if (diff !== 0) {
    state.history.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('cs-CZ'),
      type: diff >= 0 ? 'admin_add' : 'admin_deduct',
      minutes: diff,
      note: `Ruční nastavení kreditu rodičem na ${formatMinutes(num)}`
    });
  }

  saveState();
  renderHistoryLog();
  updateBalanceUI();
  const minutesDirectInp = document.getElementById('admin-minutes-direct-input');
  if (minutesDirectInp) minutesDirectInp.value = num.toString();
  playTone(600, 0.1, 'sine', 0.15);
  alertUserFeedback(`Kredit na tabletu nastaven na ${formatMinutes(num)} ⭐`);
}

function renderHistoryLog() {
  const log = document.getElementById('history-log-container');
  if (!state.history || state.history.length === 0) {
    log.innerHTML = '<p class="text-slate-400 italic text-center py-2 font-bold">Zatím žádná historie minut.</p>';
    return;
  }
  log.innerHTML = state.history.slice(0, 30).map(h => `
    <div class="flex items-center justify-between p-1.5 rounded-xl bg-white border border-slate-200">
      <div>
        <div class="font-bold text-slate-800 text-[11px]">${h.note}</div>
        <div class="text-[9px] text-slate-400 font-bold">${h.date} v ${h.time}</div>
      </div>
      <div class="font-black text-xs ${h.minutes > 0 ? 'text-emerald-600' : 'text-rose-600'}">
        ${h.minutes > 0 ? `+${formatMinutes(h.minutes)}` : formatMinutes(h.minutes)}
      </div>
    </div>
  `).join('');
}

function clearHistory() {
  state.history = [];
  saveState();
  renderHistoryLog();
}

function resetAllData() {
  clearSpellingTimers();
  if (stopwatchState && stopwatchState.intervalId) {
    clearInterval(stopwatchState.intervalId);
    stopwatchState.intervalId = null;
  }
  stopwatchState.status = 'idle';
  stopwatchState.elapsedSec = 0;

  state = {
    appVersion: APP_VERSION,
    subject: 'reading',
    minutesBalance: 0.0,
    dailyEarnedToday: 0.0,
    dailyReadingEarnedToday: 0.0,
    dailyMathEarnedToday: 0.0,
    dailyEarnedDate: getTodayDateString(),
    vouchersBoughtDate: getTodayDateString(),
    dailyStandardVoucherBought: null,
    dailyMaxVoucherBought: null,
    traceabilityHistory: [],
    vaultBalance: 0.0,
    goldDiamonds: 0,
    bonusMaxLimitMinutes: 0,
    diamondExchangeRate: 20,
    pokemonSegmentsCount: 12,
    tabletSecretPin: 'XXXX',
    activeLetters: ['M', 'L', 'E', 'É', 'A', 'Á', 'S', 'O', 'Ó'],
    currentLevel: 1,
    currentMathLevel: 1,
    mathMax: 10,
    coinMaxLimit: 20,
    coinHardMode: true,
    coinGameMode: 'compose',
    coinHideFormula: false,
    optimizeReadingTarget: 15,
    optimizeMathTarget: 15,
    letterCase: 'upper',
    showSyllableArcs: false,
    spellingMode: 'classic',
    reverseSpellingSpeed: 1,
    ttsEngine: 'ai',
    aiVoiceName: 'Kore',
    preferredSystemVoiceURI: '',
    displayMode: 'grid',
    gridCardCount: 8,
    level5SubMode: 'shluky',
    showImages: true,
    showSpeechButton: true,
    spellingRepeatCount: 3,
    rewards: JSON.parse(JSON.stringify(DEFAULT_REWARDS)),
    currentItems: [],
    flashcardIndex: 0,
    history: [],
    questsDate: getTodayDateString(),
    quests: createDefaultDailyQuests(4),
    customDailyLevelChoice: 4,
    boxDate: getTodayDateString(),
    boxClaimed: false,
    lastBoxReward: 0.0,
    legendaryChest: JSON.parse(JSON.stringify(DEFAULT_LEGENDARY_CHEST)),
    testDate: getTodayDateString(),
    testDoneToday: false,
    testLastResult: null,
    testConfig: JSON.parse(JSON.stringify(DEFAULT_TEST_CONFIG)),
    streakDays: 0,
    streakLastActiveDate: '',
    streakTodayCompleted: false,
    streakClaimedDay7: false,
    customizations: JSON.parse(JSON.stringify(DEFAULT_UNLOCKED_CUSTOMIZATIONS)),
    itemPrices: {}
  };
  window.state = state;
  if (typeof ensurePetStateInitialized === 'function') ensurePetStateInitialized();
  saveState();
  closeAdminPanel();
  applyCurrentTheme();
  updateTopAvatarDisplay();
  updateStopwatchUI();
  if (typeof updateTopPetCompanionWidget === 'function') updateTopPetCompanionWidget();
  setSubject('reading');
  setGridCount(8);
  switchLevel(1);
  updateBalanceUI();
  updateTopBadges();
  updateSpeechToggleUI();
  updateImageToggleUI();
  updateSyllableArcsToggleUI();
  updateDiamondMarketUI();
  renderStoreSkinsUI();
  if (typeof renderStorePetsUI === 'function') renderStorePetsUI();
}

function updateAdminVoiceSettingsUI() {
  const engine = state.ttsEngine || 'ai';
  const aiVoice = state.aiVoiceName || 'Kore';

  const btnAi = document.getElementById('admin-tts-engine-btn-ai');
  const btnSys = document.getElementById('admin-tts-engine-btn-system');
  const aiBox = document.getElementById('admin-ai-voice-options');

  const activeEngineClass = 'px-2.5 py-1 rounded-lg text-xs font-black transition-all bg-indigo-600 text-white shadow-xs';
  const inactiveEngineClass = 'px-2.5 py-1 rounded-lg text-xs font-black transition-all text-indigo-900 hover:bg-indigo-100';

  if (btnAi) btnAi.className = (engine === 'ai') ? activeEngineClass : inactiveEngineClass;
  if (btnSys) btnSys.className = (engine === 'system') ? activeEngineClass : inactiveEngineClass;
  if (aiBox) {
    aiBox.style.opacity = (engine === 'ai') ? '1' : '0.6';
  }

  const voicesList = [
    { id: 'Kore', label: '👩‍🏫 Kore (Učitelka)' },
    { id: 'Zephyr', label: '👩 Zephyr (Jemný)' },
    { id: 'Puck', label: '🧒 Puck (Veselý)' },
    { id: 'Charon', label: '👨‍🏫 Charon (Učitel)' }
  ];
  voicesList.forEach(v => {
    const el = document.getElementById(`admin-ai-voice-${v.id}`);
    if (el) {
      el.className = (aiVoice === v.id)
        ? 'px-2.5 py-1 rounded-lg text-xs font-black border transition-all bg-indigo-600 text-white border-indigo-700 shadow-xs'
        : 'px-2.5 py-1 rounded-lg text-xs font-black border transition-all bg-white text-slate-700 border-slate-300 hover:bg-indigo-50';
    }
  });

  // Naplnění seznamu systémových českých hlasů v zařízení
  const selectEl = document.getElementById('admin-system-voice-select');
  if (selectEl && 'speechSynthesis' in window) {
    const allVoices = window.speechSynthesis.getVoices() || [];
    const czechVoices = allVoices.filter(v =>
      v.lang.toLowerCase().startsWith('cs') ||
      v.lang.toLowerCase().includes('czech') ||
      v.name.toLowerCase().includes('zuzana') ||
      v.name.toLowerCase().includes('iveta') ||
      v.name.toLowerCase().includes('vlasta') ||
      v.name.toLowerCase().includes('antonin') ||
      v.name.toLowerCase().includes('antonín')
    );

    const currentPref = state.preferredSystemVoiceURI || '';
    selectEl.innerHTML = `<option value="">✨ Automaticky nejlepší dostupný český hlas</option>`;
    czechVoices.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.voiceURI || v.name;
      const isEnhanced = /enhanced|premium|natural|neural|vylepšen/i.test(v.name + ' ' + v.voiceURI);
      opt.textContent = `${isEnhanced ? '⭐ ' : ''}${v.name} (${v.lang})`;
      if (opt.value === currentPref) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }
}

function setAdminTtsEngine(engine) {
  state.ttsEngine = (engine === 'system') ? 'system' : 'ai';
  saveState();
  updateAdminVoiceSettingsUI();
  playTone(560, 0.07, 'sine', 0.14);
}

function setAdminAiVoice(voiceName) {
  state.aiVoiceName = voiceName || 'Kore';
  state.ttsEngine = 'ai';
  saveState();
  updateAdminVoiceSettingsUI();
  speakCzechWord('Ahoj školáku, jdeme číst!', 0.95);
}

function setAdminSystemVoiceURI(uri) {
  state.preferredSystemVoiceURI = uri || '';
  saveState();
  updateAdminVoiceSettingsUI();
  speakCzechWord('Máma má mísu.', 0.9);
}

function testAdminTtsVoice() {
  speakCzechWord('Máma mele maso. Hlásky ááá, čé, eř.', 0.95);
}

async function exportPregeneratedAiTtsFile() {
  const statusEl = document.getElementById('admin-export-tts-status');
  const btn = document.getElementById('admin-export-tts-btn');
  const voiceName = state.aiVoiceName || 'Kore';

  if (statusEl) {
    statusEl.classList.remove('hidden');
    statusEl.textContent = `⏳ Generuji český AI hlas pro všechna písmena (A–Ž) a slovní zásobu... Chvilku strpení.`;
  }
  if (btn) btn.disabled = true;

  try {
    const itemsToGenerate = [
      ...FULL_CZECH_ALPHABET.map(ch => sanitizeForCzechPedagogicalTTS(ch)),
      ...SPELLING_WORDS_DATABASE.map(item => sanitizeForCzechPedagogicalTTS(item.w))
    ];
    const uniqueItems = Array.from(new Set(itemsToGenerate.filter(Boolean)));
    const exportedMap = { ...(window.PREGENERATED_AI_TTS_DATA || {}) };
    const missingItems = uniqueItems.filter(speechText => !exportedMap[speechText]);

    const chunkSize = 8;
    for (let i = 0; i < missingItems.length; i += chunkSize) {
      const slice = missingItems.slice(i, i + chunkSize);
      if (statusEl) {
        statusEl.textContent = `🎙️ Generuji AI nahrávky (${Math.min(i + chunkSize, missingItems.length)} / ${missingItems.length})...`;
      }
      const resp = await fetch('/api/tts/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: slice, voiceName })
      });
      if (!resp.ok) {
        let errDetail = `HTTP ${resp.status}`;
        try {
          const errJson = await resp.json();
          if (errJson && errJson.error) errDetail = errJson.error;
        } catch (e) {}
        throw new Error(errDetail);
      }
      const data = await resp.json();
      const results = (data && data.results) || {};
      Object.entries(results).forEach(([speechText, base64Audio]) => {
        if (base64Audio) {
          exportedMap[speechText] = base64Audio;
          saveTtsClipToIdb(speechText, base64Audio);
        }
      });
    }

    window.PREGENERATED_AI_TTS_DATA = exportedMap;

    // Uložíme ttsData.js také přímo na server do projektu (aby byl rovnou součástí ZIP exportu z AI Studia)
    try {
      await fetch('/api/tts/save-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataMap: exportedMap, voiceName })
      });
    } catch (e) {}

    const jsContent = `/* Předgenerované AI hlasy pro Školáckou Misi (GitHub Pages / Offline) */\nwindow.PREGENERATED_AI_TTS_DATA = ${JSON.stringify(exportedMap)};\n`;
    const blob = new Blob([jsContent], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ttsData.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    if (statusEl) {
      statusEl.innerHTML = `✅ Hotovo! Soubor <b>ttsData.js</b> (${Object.keys(exportedMap).length} českých AI nahrávek) byl uložen přímo do projektu i stažen do počítače.`;
    }
    playCustomSuccessSound();
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = `⚠️ Nepodařilo se vygenerovat balíček (${err.message || 'server nedostupný'}).`;
    }
    soundError();
  } finally {
    if (btn) btn.disabled = false;
  }
}

function toggleTestSyllableArcs() {
  state.showSyllableArcs = !state.showSyllableArcs;
  saveState();
  updateSyllableArcsToggleUI();
  renderCurrentTestTask();
  playTone(550, 0.08, 'sine', 0.15);
}

function initSkolackaMiseApp() {
  // Inicializace přihlašovací obrazovky a případného zapamatovaného účtu
  const loginUserInp = document.getElementById('auth-login-username');
  const loginPassInp = document.getElementById('auth-login-password');
  const regUserInp = document.getElementById('auth-reg-username');
  const regPassInp = document.getElementById('auth-reg-password');

  [loginUserInp, loginPassInp].forEach(el => {
    if (el) {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitAccountLogin();
      });
    }
  });

  [regUserInp, regPassInp].forEach(el => {
    if (el) {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitAccountRegister();
      });
    }
  });

  try {
    const sessionUser = normalizeAccountUsername(sessionStorage.getItem(SESSION_USER_KEY) || '');
    const rememberedUser = normalizeAccountUsername(localStorage.getItem(REMEMBERED_USER_KEY) || '');
    const autoUser = sessionUser || rememberedUser;
    if (autoUser) {
      const reg = getLocalAccountsRegistry();
      if (reg[autoUser]) {
        currentLoggedInUser = reg[autoUser];
        const overlay = document.getElementById('auth-login-overlay');
        if (overlay) overlay.classList.add('hidden');
        const remCheck = document.getElementById('auth-remember-me');
        if (remCheck && rememberedUser) remCheck.checked = true;
      }
    }
  } catch (e) {}

  updateEnvironmentBadgeUI();
  isSuppressingAutoSave = true;
  try {
    loadState();
    if (typeof ensurePetStateInitialized === 'function') ensurePetStateInitialized();
    if (typeof updateTopPetCompanionWidget === 'function') updateTopPetCompanionWidget();
    attachStopwatchStopHoldListeners();
    updateStopwatchUI();
    updateBalanceUI();
    updateTopBadges();
    updateDiamondMarketUI();
    renderStoreSkinsUI();
    if (typeof renderStorePetsUI === 'function') renderStorePetsUI();
    if (!state.gridCardCount) state.gridCardCount = 8;
    if (state.showImages === undefined) state.showImages = true;
    if (state.showSpeechButton === undefined) state.showSpeechButton = true;
    if (state.showSyllableArcs === undefined) state.showSyllableArcs = false;
    if (!state.spellingMode) state.spellingMode = 'classic';
    if (!state.reverseSpellingSpeed) state.reverseSpellingSpeed = 1;
    if (!state.ttsEngine) state.ttsEngine = 'ai';
    if (!state.aiVoiceName) state.aiVoiceName = 'Kore';
    if (state.preferredSystemVoiceURI === undefined) state.preferredSystemVoiceURI = '';
    if (!state.spellingRepeatCount) state.spellingRepeatCount = 3;
    if (!state.mathMax) state.mathMax = 10;
    if (!state.coinMaxLimit) state.coinMaxLimit = 20;
    if (state.coinHardMode === undefined) state.coinHardMode = true;
    if (!state.goldDiamonds) state.goldDiamonds = 0;
    if (!state.bonusMaxLimitMinutes) state.bonusMaxLimitMinutes = 0;
    if (!state.diamondExchangeRate) state.diamondExchangeRate = 20;
    if (!state.pokemonSegmentsCount) state.pokemonSegmentsCount = 12;
    if (!state.tabletSecretPin) state.tabletSecretPin = 'XXXX';
    if (!state.customDailyLevelChoice) state.customDailyLevelChoice = 4;
    if (state.streakDays === undefined) state.streakDays = 0;
    if (state.letterCase === 'lower') state.letterCase = 'upper';

    updateImageToggleUI();
    updateSpeechToggleUI();
    updateSyllableArcsToggleUI();
    setLetterCase(state.letterCase || 'upper');
    setSubject(state.subject || 'reading');
    setGridCount(state.gridCardCount);
  } finally {
    isSuppressingAutoSave = false;
  }

  if (currentLoggedInUser) {
    syncWithCloudOnStartup(true);
  } else if (navigator.onLine) {
    fetchCloudEnvelopeFromGist().catch(err => {
      console.warn('Nelze přednačíst účty z GitHub Gistu při startu:', err);
    });
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
      updateAdminVoiceSettingsUI();
    };
  }

  const pinInput = document.getElementById('pin-input');
  if (pinInput) {
    pinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') verifyParentPin();
    });
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initSkolackaMiseApp);
} else {
  initSkolackaMiseApp();
}