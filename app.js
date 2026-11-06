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
      id: 'q_reading_all',
      title: 'Čtenářská Výzva (16× cvičení)',
      desc: 'Splň dohromady 16 jakýchkoliv cvičení z nabídky Čtení (písmenka, slabiky, slova, věty nebo hláskování).',
      icon: '📖',
      target: 16,
      progress: 0,
      claimed: false,
      isTrackerOnly: false,
      matches: (s, l) => s === 'reading' && l >= 1 && l <= 8
    },
    {
      id: 'q_math_all',
      title: 'Matematická Výzva (16× cvičení)',
      desc: 'Splň dohromady 16 jakýchkoliv cvičení z nabídky Matematiky (počty, porovnávání, řada, počítadlo, rozklad nebo slovní úlohy).',
      icon: '🔢',
      target: 16,
      progress: 0,
      claimed: false,
      isTrackerOnly: false,
      matches: (s, l) => s === 'math' && l >= 1 && l <= 6
    },
    {
      id: 'q_test',
      title: 'Denní TEST',
      desc: 'Dokonči dnešní velký denní test (odměna je přímo v testu).',
      icon: '📝',
      target: 1,
      progress: 0,
      claimed: false,
      isTrackerOnly: true,
      matches: (s) => s === 'test'
    },
    {
      id: 'q_arena',
      title: 'Boj s pety (5 zápasů)',
      desc: 'Odbojuj dnes 5 zápasů v Pet Aréně (odměna je přímo v boji).',
      icon: '⚔️',
      target: 5,
      progress: 0,
      claimed: false,
      isTrackerOnly: true,
      matches: (s) => s === 'arena'
    },
    {
      id: 'q_coloring',
      title: 'Vymalovánka',
      desc: 'Vybarvi dnes 1 celý obrázek Pokémona v omalovánce (odměna je přímo za vybarvení).',
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
  dailyEarnedDate: getTodayDateString(),
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
  letterCase: 'upper',
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
    minutesChance: 50,
    minutesMin: 0.5,
    minutesMax: 1.0,
    foodChance: 20,
    foodAmount: 1,
    reviveChance: 15,
    reviveAmount: 1,
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

window.state = state;

function getMaxDailyDirectLimit() {
  return 15.0 + (state.bonusMaxLimitMinutes || 0);
}

let spellingState = {
  unseenDeck: [],
  currentWordObj: null,
  letters: [],
  revealedCount: 0,
  isWordHidden: false,
  currentRepeatIndex: 0,
  totalRepeats: 3
};

function clearSpellingTimers() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
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
  wordDisplay.textContent = formatCase(wordObj.w);

  const catPill = document.getElementById('spelling-category-pill');
  catPill.textContent = `${wordObj.syllables} ${czechNounForm(wordObj.syllables, 'slabika', 'slabiky', 'slabik')} • ${wordObj.w.length} písmen`;

  const subInst = document.getElementById('spelling-subtitle-instructions');
  if (subInst) subInst.textContent = `Poslouchej ${spellingState.totalRepeats}× zřetelně přečtené slovo a pak ho vyhláskuj!`;

  document.getElementById('spelling-hint-count').textContent = `0/${spellingState.letters.length}`;
  renderSpellingLettersStrip();
  runSpellingSpeechCycle();
}

function runSpellingSpeechCycle() {
  if (spellingState.isWordHidden) return;
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
    if (spellingState.isWordHidden) return;
    if (spellingState.currentRepeatIndex < spellingState.totalRepeats) {
      setTimeout(() => { runSpellingSpeechCycle(); }, 320);
    } else {
      hideSpellingWord();
    }
  });
}

function repeatSpellingTTS() {
  if (spellingState.currentWordObj) {
    speakCzechWord(spellingState.currentWordObj.w, 0.75);
    playTone(600, 0.08, 'sine', 0.15);
  }
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

function saveState() {
  try {
    state.appVersion = APP_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Chyba při ukládání stavu:', e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const defaultQuests = createDefaultDailyQuests();

      if (parsed.quests && Array.isArray(parsed.quests)) {
        parsed.quests = defaultQuests.map(dq => {
          const saved = parsed.quests.find(q => q.id === dq.id);
          if (saved) {
            return { 
              ...dq, 
              ...saved, 
              isTrackerOnly: dq.isTrackerOnly,
              target: dq.target,
              matches: dq.matches 
            };
          }
          return dq;
        });
      }
      state = { ...state, ...parsed };
      if (!state.rewards) {
        state.rewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS));
      } else if (state.rewards.questRate === undefined || state.rewards.questRate === 1) {
        state.rewards.questRate = 4.0;
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
          minutesChance: 50,
          minutesMin: 0.5,
          minutesMax: 1.0,
          foodChance: 20,
          foodAmount: 1,
          reviveChance: 15,
          reviveAmount: 1,
          diaSmallChance: 5,
          diaSmallAmount: 2,
          diaMedChance: 0.9,
          diaMedAmount: 10,
          diaJackpotChance: 0.1,
          diaJackpotAmount: 20
        };
      }
    }
  } catch (e) {
    console.error('Chyba při načítání stavu:', e);
  }
  checkAndHandleDailyResets();
  applyCurrentTheme();
  updateTopAvatarDisplay();
  if (typeof ensurePetStateInitialized === 'function') ensurePetStateInitialized();
  if (typeof updateTopPetCompanionWidget === 'function') updateTopPetCompanionWidget();
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

  if (state.dailyEarnedDate !== today) {
    state.dailyEarnedDate = today;
    state.dailyEarnedToday = 0.0;

    if ((state.vaultBalance || 0) > 0) {
      const unlocked = state.vaultBalance;
      state.minutesBalance = Math.round((state.minutesBalance + unlocked) * 100) / 100;
      state.vaultBalance = 0.0;
      state.history.unshift({
        id: Date.now(),
        time: '00:01',
        date: new Date().toLocaleDateString('cs-CZ'),
        type: 'vault_unlocked',
        minutes: unlocked,
        note: `Noční trezor odemčen novým dnem (+${formatMinutes(unlocked)})`
      });
    }
  }

  if (typeof checkAndHandlePetDailyReset === 'function') {
    checkAndHandlePetDailyReset();
  }
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

function extractUniqueLetters(text) {
  const upper = text.toUpperCase();
  const letters = new Set();
  let i = 0;
  while (i < upper.length) {
    if (i < upper.length - 1 && upper.substring(i, i + 2) === 'CH') {
      letters.add('CH');
      i += 2;
      continue;
    }
    const char = upper[i];
    if (FULL_CZECH_ALPHABET.includes(char)) letters.add(char);
    i++;
  }
  return Array.from(letters);
}

const LEVEL_3_CVC_WORDS = RAW_LEVEL_3_WORDS.map(w => ({ text: w.t, emoji: w.e, letters: extractUniqueLetters(w.t) }));
const LEVEL_4_TWO_SYLLABLE_WORDS = RAW_LEVEL_4_WORDS.map(w => ({ text: w.t, emoji: w.e, letters: extractUniqueLetters(w.t) }));
const LEVEL_5_CLUSTERS = RAW_LEVEL_5_WORDS.map(w => ({ text: w.t, emoji: w.e, letters: extractUniqueLetters(w.t) }));
const LEVEL_6_SOFT = RAW_LEVEL_6_WORDS.map(w => ({ text: w.t, emoji: w.e, letters: extractUniqueLetters(w.t) }));
const LEVEL_7_SENTENCES = RAW_LEVEL_7_SENTENCES.map(s => ({ text: s.t, emoji: s.e, letters: extractUniqueLetters(s.t) }));

let coloringState = {
  pokemon: null,
  segments: [],
  selectedSegmentIndex: null
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function renderEmojiRow(count, emo) {
  return Array(count).fill(emo).join(' ');
}

function generateMathLevel1(maxVal) {
  const pool = [];
  if (maxVal <= 10) {
    for (let i = 0; i < 20; i++) {
      const emo = MATH_EMOJIS[Math.floor(Math.random() * MATH_EMOJIS.length)];
      const isPlus = Math.random() > 0.4;
      if (isPlus) {
        const a = randomInt(1, 9);
        const b = randomInt(1, 10 - a);
        pool.push({
          type: 'input',
          htmlRow: `<span class="tracking-wide text-2xl sm:text-3xl">${renderEmojiRow(a, emo)}</span> <span class="text-amber-500 font-black text-2xl sm:text-3xl mx-2">+</span> <span class="tracking-wide text-2xl sm:text-3xl">${renderEmojiRow(b, emo)}</span> <span class="text-slate-400 font-black text-2xl sm:text-3xl mx-2">=</span>`,
          correctAnswer: (a + b).toString()
        });
      } else {
        const a = randomInt(2, 10);
        const b = randomInt(1, a - 1);
        pool.push({
          type: 'input',
          htmlRow: `<span class="tracking-wide text-2xl sm:text-3xl">${renderEmojiRow(a, emo)}</span> <span class="text-rose-500 font-black text-2xl sm:text-3xl mx-2">−</span> <span class="tracking-wide text-2xl sm:text-3xl">${renderEmojiRow(b, emo)}</span> <span class="text-slate-400 font-black text-2xl sm:text-3xl mx-2">=</span>`,
          correctAnswer: (a - b).toString()
        });
      }
    }
  } else {
    const maxTens = Math.floor(maxVal / 10);
    for (let i = 0; i < 20; i++) {
      const isPlus = Math.random() > 0.5;
      if (isPlus) {
        const tensA = randomInt(1, Math.max(1, maxTens - 1));
        const tensB = randomInt(1, maxTens - tensA);
        const a = tensA * 10;
        const b = tensB * 10;
        pool.push({
          type: 'input',
          htmlRow: `<span class="text-3xl sm:text-4xl font-black text-sky-800">${a}</span> <span class="text-2xl sm:text-3xl text-amber-500 font-black mx-2">+</span> <span class="text-3xl sm:text-4xl font-black text-sky-800">${b}</span> <span class="text-2xl sm:text-3xl text-slate-400 font-black mx-2">=</span>`,
          correctAnswer: (a + b).toString()
        });
      } else {
        const tensA = randomInt(2, maxTens);
        const tensB = randomInt(1, tensA - 1);
        const a = tensA * 10;
        const b = tensB * 10;
        pool.push({
          type: 'input',
          htmlRow: `<span class="text-3xl sm:text-4xl font-black text-sky-800">${a}</span> <span class="text-2xl sm:text-3xl text-rose-500 font-black mx-2">−</span> <span class="text-3xl sm:text-4xl font-black text-sky-800">${b}</span> <span class="text-2xl sm:text-3xl text-slate-400 font-black mx-2">=</span>`,
          correctAnswer: (a - b).toString()
        });
      }
    }
  }
  return pool;
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
    tab1Title.textContent = ((state.mathMax || 10) <= 10) ? '🍎 1. Obrázkové počty' : '🔟 1. Celé desítky';
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
  const spellingView = document.getElementById('content-spelling-view');
  const gridView = document.getElementById('content-grid-view');
  const flashView = document.getElementById('content-flash-view');

  updateMathCategoryHeader();
  updateNavTabRewardLabels();
  clearSpellingTimers();

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
  generalControlBar.classList.remove('hidden');
  document.getElementById('reading-review-prompt').textContent = 'Hodnocení rodiče (Poslechni si čtení syna):';
  document.getElementById('reading-retry-subtitle').textContent = 'Nová sada slov';
  document.getElementById('reading-success-title').textContent = 'PŘEČTENO SPRÁVNĚ!';

  let pool = [];
  if (subj === 'reading') {
    readingReviewPanel.classList.remove('hidden');
    mathEvalPanel.classList.add('hidden');

    if (lvl === 1) pool = state.activeLetters.map(letter => ({ text: letter, emoji: '' }));
    else if (lvl === 2) pool = generatePedagogicalOpenSyllables();
    else if (lvl === 3) pool = LEVEL_3_CVC_WORDS.filter(w => isItemFormedByActive(w.letters));
    else if (lvl === 4) pool = LEVEL_4_TWO_SYLLABLE_WORDS.filter(w => isItemFormedByActive(w.letters));
    else if (lvl === 5) pool = LEVEL_5_CLUSTERS.filter(w => isItemFormedByActive(w.letters));
    else if (lvl === 6) pool = LEVEL_6_SOFT.filter(w => isItemFormedByActive(w.letters));
    else if (lvl === 7) pool = LEVEL_7_SENTENCES.filter(sen => isItemFormedByActive(sen.letters));
  } else {
    readingReviewPanel.classList.add('hidden');
    mathEvalPanel.classList.remove('hidden');

    const maxVal = state.mathMax || 10;
    if (lvl === 1) pool = generateMathLevel1(maxVal);
    else if (lvl === 2) pool = generateMathLevel2(maxVal);
    else if (lvl === 3) pool = generateMathLevel3(maxVal);
    else if (lvl === 4) pool = generateMathLevel4(maxVal);
    else if (lvl === 5) pool = generateMathLevel5(maxVal);
    else if (lvl === 6) pool = generateMathLevel6(maxVal);
  }

  if (!pool || pool.length === 0) {
    gridView.classList.add('hidden');
    flashView.classList.add('hidden');
    emptyNotice.classList.remove('hidden');
    state.currentItems = [];
    return;
  } else {
    emptyNotice.classList.add('hidden');
  }

  const desiredCount = (subj === 'reading') 
    ? (state.gridCardCount || 8) 
    : (lvl === 5 ? 4 : (lvl === 6 ? 3 : 4));

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
  if (state.letterCase === 'lower') return text.toLowerCase();
  if (state.letterCase === 'mixed') {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  return text.toUpperCase();
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
  if (btnReading) btnReading.className = 'h-full px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 text-slate-600 hover:bg-slate-200';
  if (btnMath) btnMath.className = 'h-full px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 text-slate-600 hover:bg-slate-200';
  if (btnClocks) btnClocks.className = 'h-full px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 text-slate-600 hover:bg-slate-200';
  if (btnTest) btnTest.className = 'h-full px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 text-purple-700 hover:bg-purple-100 relative';

  if (newSubj === 'reading') {
    if (btnReading) btnReading.className = 'h-full px-2.5 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 bg-sky-500 text-white shadow-sm';
    if (readingTabs) readingTabs.classList.remove('hidden');
    if (mathTabs) mathTabs.classList.add('hidden');
    if (generalControlBar) generalControlBar.classList.remove('hidden');
    if (readingReviewPanel) readingReviewPanel.classList.remove('hidden');
    if (mathEvalPanel) mathEvalPanel.classList.add('hidden');
  } else {
    if (btnMath) btnMath.className = 'h-full px-2.5 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 bg-amber-500 text-white shadow-sm';
    if (mathTabs) mathTabs.classList.remove('hidden');
    if (readingTabs) readingTabs.classList.add('hidden');
    if (generalControlBar) generalControlBar.classList.remove('hidden');
    if (mathEvalPanel) mathEvalPanel.classList.remove('hidden');
    if (readingReviewPanel) readingReviewPanel.classList.add('hidden');
  }

  // Ujistíme se, že grid pro hodiny je schovaný, když jsme v čtení/matematice
  const clockContainer = document.getElementById('content-grid-view');
  // Poznámka: pokud nejde o hodiny, renderClockSection se nespouští, ale zajistíme čistý stav
  if (typeof showView === 'function') showView('learn');
  if (typeof generateLessonItems === 'function') generateLessonItems();
}

function setClockView() {
  const btnReading = document.getElementById('subject-btn-reading');
  const btnMath = document.getElementById('subject-btn-math');
  const btnClocks = document.getElementById('subject-btn-clocks');
  const btnTest = document.getElementById('subject-btn-test');

  // Správné rozsvícení tlačítka Hodiny v horní liště
  if (btnReading) btnReading.className = 'h-full px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 text-slate-600 hover:bg-slate-200';
  if (btnMath) btnMath.className = 'h-full px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 text-slate-600 hover:bg-slate-200';
  if (btnClocks) btnClocks.className = 'h-full px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 bg-amber-500 text-white shadow-sm';
  if (btnTest) btnTest.className = 'h-full px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 text-purple-700 hover:bg-purple-100 relative';

  if (typeof showView === 'function') showView('learn');
  
  const readingTabs = document.getElementById('reading-tabs-container');
  const mathTabs = document.getElementById('math-tabs-container');
  const generalControlBar = document.getElementById('general-control-bar');
  const readingReviewPanel = document.getElementById('reading-review-panel');
  const mathEvalPanel = document.getElementById('math-eval-panel');

  // Schováme všechny panely z Čtení a Matematiky
  if (readingTabs) readingTabs.classList.add('hidden');
  if (mathTabs) mathTabs.classList.add('hidden');
  if (generalControlBar) generalControlBar.classList.add('hidden');
  if (readingReviewPanel) readingReviewPanel.classList.add('hidden');
  if (mathEvalPanel) mathEvalPanel.classList.add('hidden');

  // KLÍČOVÉ: Úplně vyčistíme hlavní kontejner od zděděných grid tříd ze čtení
  const gridView = document.getElementById('content-grid-view');
  if (gridView) {
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
        btn.className = 'lvl-btn py-1.5 px-2.5 rounded-2xl font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition-all bg-sky-500 text-white shadow-game-btn border-b-4 border-sky-700 min-w-[125px] sm:min-w-0 flex-shrink-0';
        btn.querySelector('span:last-child').className = 'text-[10px] font-bold text-amber-200';
      } else {
        btn.className = 'lvl-btn py-1.5 px-2.5 rounded-2xl font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition-all bg-white text-slate-700 hover:bg-sky-50 border-2 border-slate-200 min-w-[125px] sm:min-w-0 flex-shrink-0';
        btn.querySelector('span:last-child').className = 'text-[10px] font-bold text-amber-600';
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
        btn.className = 'math-lvl-btn py-1.5 px-2.5 rounded-2xl font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition-all bg-amber-500 text-white shadow-game-btn border-b-4 border-amber-700 min-w-[135px] sm:min-w-0 flex-shrink-0';
        btn.querySelector('span:last-child').className = 'text-[10px] font-bold text-amber-200';
      } else {
        btn.className = 'math-lvl-btn py-1.5 px-2.5 rounded-2xl font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition-all bg-white text-slate-700 hover:bg-amber-50 border-2 border-slate-200 min-w-[135px] sm:min-w-0 flex-shrink-0';
        btn.querySelector('span:last-child').className = 'text-[10px] font-bold text-amber-600';
      }
    }
  });

  playTone(500, 0.1, 'sine', 0.15);
  generateLessonItems();
}

function setLetterCase(caseMode) {
  state.letterCase = caseMode;
  saveState();

  const upperBtn = document.getElementById('case-btn-upper');
  const lowerBtn = document.getElementById('case-btn-lower');
  const mixedBtn = document.getElementById('case-btn-mixed');

  const activeClass = 'px-2 py-0.5 rounded-lg text-xs font-black transition-all bg-amber-500 text-white shadow-sm';
  const inactiveClass = 'px-2 py-0.5 rounded-lg text-xs font-black transition-all text-amber-900 hover:bg-amber-200';

  if (upperBtn) upperBtn.className = (caseMode === 'upper') ? activeClass : inactiveClass;
  if (lowerBtn) lowerBtn.className = (caseMode === 'lower') ? activeClass : inactiveClass;
  if (mixedBtn) mixedBtn.className = (caseMode === 'mixed') ? activeClass : inactiveClass;

  renderCurrentContent();
}

function setDisplayMode(mode) {
  state.displayMode = mode;
  saveState();

  const gridBtn = document.getElementById('mode-btn-grid');
  const flashBtn = document.getElementById('mode-btn-flash');

  if (mode === 'grid') {
    gridBtn.className = 'px-2 py-0.5 rounded-lg text-xs font-black transition-all bg-sky-500 text-white shadow-sm';
    flashBtn.className = 'px-2 py-0.5 rounded-lg text-xs font-black transition-all text-sky-900 hover:bg-sky-200';
  } else {
    flashBtn.className = 'px-2 py-0.5 rounded-lg text-xs font-black transition-all bg-sky-500 text-white shadow-sm';
    gridBtn.className = 'px-2 py-0.5 rounded-lg text-xs font-black transition-all text-sky-900 hover:bg-sky-200';
  }
  renderCurrentContent();
}

function setGridCount(count) {
  state.gridCardCount = count;
  saveState();

  const btn8 = document.getElementById('count-btn-8');
  const btn10 = document.getElementById('count-btn-10');
  if (count === 8) {
    btn8.className = 'px-2 py-0.5 rounded-lg text-xs font-black transition-all bg-emerald-500 text-white shadow-sm';
    btn10.className = 'px-2 py-0.5 rounded-lg text-xs font-black transition-all text-emerald-900 hover:bg-emerald-200';
  } else {
    btn10.className = 'px-2 py-0.5 rounded-lg text-xs font-black transition-all bg-emerald-500 text-white shadow-sm';
    btn8.className = 'px-2 py-0.5 rounded-lg text-xs font-black transition-all text-emerald-900 hover:bg-emerald-200';
  }

  playTone(550, 0.08, 'sine', 0.15);
  generateLessonItems();
}

function renderCurrentContent() {
  const gridContainer = document.getElementById('content-grid-view');
  const flashContainer = document.getElementById('content-flash-view');

  if (!state.currentItems || state.currentItems.length === 0) return;
  const isMath = state.subject === 'math';

  if (!isMath && state.displayMode === 'flash') {
    gridContainer.classList.add('hidden');
    flashContainer.classList.remove('hidden');
    updateFlashcardDisplay();
    return;
  }

  gridContainer.classList.remove('hidden');
  flashContainer.classList.add('hidden');
  gridContainer.innerHTML = '';

  if (isMath) {
    if (state.currentMathLevel === 5) {
      gridContainer.className = 'w-full grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto py-1';
    } else {
      gridContainer.className = 'w-full flex flex-col gap-2.5 max-w-3xl mx-auto';
    }

    state.currentItems.forEach((item, index) => {
      const card = document.createElement('div');
      card.id = `math-card-${index}`;

      if (item.type === 'decomposition') {
        card.className = 'math-row-card bg-white rounded-3xl p-3.5 sm:p-5 border-3 border-amber-300 shadow-game-card flex flex-col items-center justify-center';
        card.innerHTML = `
          <div class="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl border-4 border-slate-700 bg-amber-50 flex items-center justify-center text-2xl sm:text-3xl font-black text-slate-800 shadow-sm font-baloo">
            ${item.topNum}
          </div>
          <svg class="w-24 sm:w-28 h-7 sm:h-8" viewBox="0 0 100 30">
            <line x1="50" y1="0" x2="20" y2="30" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
            <line x1="50" y1="0" x2="80" y2="30" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
          </svg>
          <div class="flex items-center gap-4 sm:gap-6 mt-0.5">
            ${item.missingSide === 'left' ? `
              <input type="number" id="math-input-${index}" inputmode="numeric" placeholder="?" class="w-12 sm:w-14 h-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-2xl border-3 border-dashed border-amber-400 bg-amber-50 focus:bg-white text-indigo-900 focus:outline-none">
            ` : `
              <div class="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl border-3 sm:border-4 border-slate-700 bg-white flex items-center justify-center text-xl sm:text-2xl font-black text-slate-800">${item.leftNum}</div>
            `}
            ${item.missingSide === 'right' ? `
              <input type="number" id="math-input-${index}" inputmode="numeric" placeholder="?" class="w-12 sm:w-14 h-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-2xl border-3 border-dashed border-amber-400 bg-amber-50 focus:bg-white text-indigo-900 focus:outline-none">
            ` : `
              <div class="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl border-3 sm:border-4 border-slate-700 bg-white flex items-center justify-center text-xl sm:text-2xl font-black text-slate-800">${item.rightNum}</div>
            `}
          </div>
          <span id="math-feedback-${index}" class="text-xl mt-1.5 h-5"></span>
        `;
      } else if (item.type === 'compare') {
        card.className = 'math-row-card bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border-3 border-amber-300 shadow-game-card flex flex-nowrap items-center justify-between gap-2.5 overflow-x-auto';
        card.innerHTML = `
          <div class="flex items-center whitespace-nowrap select-none font-baloo text-2xl sm:text-4xl">${item.htmlRow}</div>
          <div class="flex items-center gap-1.5 whitespace-nowrap ml-auto">
            <button type="button" onclick="selectCompareOption(${index}, '<')" id="cmp-${index}-lt" class="cmp-btn text-xl sm:text-2xl font-black w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300">&lt;</button>
            <button type="button" onclick="selectCompareOption(${index}, '=')" id="cmp-${index}-eq" class="cmp-btn text-xl sm:text-2xl font-black w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300">=</button>
            <button type="button" onclick="selectCompareOption(${index}, '>')" id="cmp-${index}-gt" class="cmp-btn text-xl sm:text-2xl font-black w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300">&gt;</button>
            <input type="hidden" id="math-input-${index}" value="">
            <span id="math-feedback-${index}" class="text-xl ml-1.5 w-6 text-center"></span>
          </div>
        `;
      } else if (item.isWordProblem) {
        const formulaText = item.formula || `${item.a} ${item.op} ${item.b} = ?`;

        card.className = 'math-row-card bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-3 border-amber-400 shadow-game-card flex flex-col items-center justify-center text-center gap-3 w-full';
        card.innerHTML = `
          <div class="flex items-center justify-center gap-2 mb-1 flex-wrap">
            <span class="text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full">Slovní Úloha</span>
            <button type="button" onclick="toggleWordProblemFormula(${index})" id="formula-toggle-btn-${index}" class="text-[10px] font-black uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-300 transition-colors">
              👁️ Zobrazit příklad
            </button>
          </div>
          <p class="text-base sm:text-xl font-black text-slate-800 leading-relaxed font-nunito max-w-2xl mx-auto">${item.story}</p>
          <div id="word-problem-formula-${index}" class="hidden text-xs font-black text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-xl inline-block mt-1">
            Zápis příkladu: <strong>${formulaText}</strong>
          </div>
          <div class="flex items-center justify-center gap-2 mt-2">
            <span class="text-xs sm:text-sm font-black text-slate-600">Výsledek:</span>
            <input type="number" id="math-input-${index}" inputmode="numeric" placeholder="?" class="w-16 sm:w-20 h-11 sm:h-12 text-center text-2xl font-black rounded-2xl border-3 border-amber-400 bg-amber-50 focus:bg-white focus:outline-none text-indigo-900 shadow-inner">
            <span id="math-feedback-${index}" class="text-xl ml-1 w-6 text-center"></span>
          </div>
        `;
      } else {
        card.className = 'math-row-card bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border-3 border-amber-300 shadow-game-card flex flex-nowrap items-center justify-between gap-2.5 overflow-x-auto';
        card.innerHTML = `
          <div class="flex items-center whitespace-nowrap select-none overflow-x-auto font-baloo text-2xl sm:text-4xl">${item.htmlRow}</div>
          <div class="flex items-center gap-2 whitespace-nowrap ml-auto">
            <input type="number" id="math-input-${index}" inputmode="numeric" placeholder="?" class="w-14 sm:w-16 h-10 sm:h-12 text-center text-xl sm:text-2xl font-black rounded-2xl border-3 border-amber-400 bg-amber-50 focus:bg-white focus:outline-none text-indigo-900 shadow-inner">
            <span id="math-feedback-${index}" class="text-xl ml-1 w-6 text-center"></span>
          </div>
        `;
      }
      gridContainer.appendChild(card);
    });

  } else {
    const isSentence = state.currentLevel === 7;
    gridContainer.className = isSentence 
      ? 'w-full grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 py-1'
      : (state.gridCardCount === 10 ? 'w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-2.5 py-1' : 'w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 py-1');

    state.currentItems.forEach((item, index) => {
      const card = document.createElement('div');
      const padClass = isSentence ? 'p-2.5 sm:p-3.5 min-h-[85px]' : 'p-2 sm:p-3 min-h-[110px]';
      card.className = `letter-card bg-white rounded-2xl sm:rounded-3xl ${padClass} border-3 border-amber-300 shadow-game-card flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-amber-400 relative`;

      const textDisplay = formatCase(item.text);
      let emojiHtml = '';
      if (state.showImages && item.emoji) {
        emojiHtml = `<div class="h-6 sm:h-7 flex items-center justify-center mb-0.5 text-2xl sm:text-3xl select-none leading-none">${item.emoji}</div>`;
      } else if (state.showImages && item.svg) {
        emojiHtml = `<div class="h-6 sm:h-7 flex items-center justify-center mb-0.5 select-none leading-none">${item.svg}</div>`;
      }

      let speakerBtnHtml = '';
      if (state.showSpeechButton) {
        speakerBtnHtml = `
          <button onclick="speakCardItem(event, '${item.text.replace(/'/g, "\\'")}')" class="absolute top-1.5 right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-50 hover:bg-sky-100 text-sky-600 border border-slate-200 shadow-sm flex items-center justify-center text-xs" title="Výslovnost">
            🔊
          </button>
        `;
      }

      card.innerHTML = `
        ${speakerBtnHtml}
        ${emojiHtml}
        <div class="w-full flex items-center justify-center px-1">
          <span class="text-2xl sm:text-4xl md:text-5xl font-black text-sky-800 game-font leading-tight select-none text-center">
            ${textDisplay}
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

function creditRewardMinutes(amount, note) {
  checkAndHandleDailyResets();
  const currentEarnedToday = state.dailyEarnedToday || 0;
  const maxDailyDirect = getMaxDailyDirectLimit();

  if (currentEarnedToday + amount <= maxDailyDirect) {
    state.dailyEarnedToday = Math.round((currentEarnedToday + amount) * 100) / 100;
    state.minutesBalance = Math.round((state.minutesBalance + amount) * 100) / 100;
    state.history.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('cs-CZ'),
      type: 'earned',
      minutes: amount,
      note: `${note} (+${formatMinutes(amount)})`
    });
  } else {
    const directPart = Math.max(0, maxDailyDirect - currentEarnedToday);
    const vaultPart = Math.round((amount - directPart) * 100) / 100;

    if (directPart > 0) {
      state.dailyEarnedToday = maxDailyDirect;
      state.minutesBalance = Math.round((state.minutesBalance + directPart) * 100) / 100;
      state.history.unshift({
        id: Date.now(),
        time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('cs-CZ'),
        type: 'earned',
        minutes: directPart,
        note: `${note} (+${formatMinutes(directPart)})`
      });
    }

    state.dailyEarnedToday = maxDailyDirect;
    state.vaultBalance = Math.round(((state.vaultBalance || 0) + vaultPart) * 100) / 100;
    state.history.unshift({
      id: Date.now() + 1,
      time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('cs-CZ'),
      type: 'vault_saved',
      minutes: vaultPart,
      note: `Dnešní limit ${maxDailyDirect} min dosažen. Uloženo do Trezoru (+${formatMinutes(vaultPart)})`
    });
    alertUserFeedback(`Dnešní limit ${maxDailyDirect} min dosažen! +${formatMinutes(vaultPart)} uloženo do Trezoru! 🏦`);
  }
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
    const catNames = ['Počty/Desítky', 'Porovnávání', 'Číselná řada', 'Počítadlo', 'Rozklad čísel', 'Slovní úlohy'];

    creditRewardMinutes(reward, `Matematika: ${catNames[lvl - 1]}`);
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
  text.textContent = formatCase(current.text);
  
  if (img) {
    if (!state.showImages) img.innerHTML = '';
    else if (current.svg) img.innerHTML = current.svg;
    else img.textContent = current.emoji || '';
  }

  text.className = (state.currentLevel === 7)
    ? 'text-2xl sm:text-4xl md:text-5xl font-black text-sky-800 tracking-normal game-font my-2 leading-relaxed break-words'
    : 'text-4xl sm:text-6xl md:text-7xl font-black text-sky-700 tracking-normal game-font my-2';
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

function parentReview(isSuccess) {
  clearSpellingTimers();

  if (isSuccess) {
    const lvl = state.currentLevel;
    const reward = getLevelReward('reading', lvl);
    const catNames = ['Písmena', 'Slabiky', 'Jednoslabičná', 'Dvouslabičná', 'Shluky/OU', 'DĚ/TĚ/NĚ', 'Věty', 'Hláskování'];

    creditRewardMinutes(reward, `Čtení: ${catNames[lvl - 1]}`);
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
  const readingQuest = state.quests.find(q => q.id === 'q_reading_all');
  const mathQuest = state.quests.find(q => q.id === 'q_math_all');
  const isReadingDone = readingQuest && (readingQuest.claimed || readingQuest.progress >= readingQuest.target);
  const isMathDone = mathQuest && (mathQuest.claimed || mathQuest.progress >= mathQuest.target);
  const today = getTodayDateString();

  if ((isReadingDone || isMathDone) && !state.streakTodayCompleted) {
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

  const readingQuest = state.quests.find(q => q.id === 'q_reading_all');
  const mathQuest = state.quests.find(q => q.id === 'q_math_all');
  const rProg = readingQuest ? readingQuest.progress : 0;
  const mProg = mathQuest ? mathQuest.progress : 0;

  if (heroDesc) {
    if (state.streakTodayCompleted) {
      heroDesc.innerHTML = '🎉 <strong class="text-yellow-200">Dnešní den je splněn!</strong> Řada je v bezpečí.';
      largeFlame.className = 'text-6xl sm:text-7xl select-none flame-active scale-110';
    } else {
      heroDesc.innerHTML = `Splň dnes <strong class="text-white underline">16× Čtení</strong> (${rProg}/16) NEBO <strong class="text-white underline">16× Matematiku</strong> (${mProg}/16) k započtení dneška!`;
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
  const qRate = (state.rewards && state.rewards.questRate) ? state.rewards.questRate : 4.0;

  state.quests.forEach(q => {
    if (!q.claimed && q.progress < q.target) {
      if (q.matches && q.matches(subj, completedLvl)) {
        q.progress++;
        if (q.progress >= q.target) {
          questCompletedNow = true;
          q.claimed = true;
          if (!q.isTrackerOnly) {
            creditRewardMinutes(qRate, `Denní úkol: ${q.title}`);
            alertUserFeedback(`🎯 Splněn denní úkol "${q.title}"! Získáváš +${formatMinutes(qRate)} ⭐`);
          }
        }
      }
    }
  });

  syncTrackerQuestsWithState();

  if (questCompletedNow) playTone(900, 0.25, 'triangle', 0.3);
  saveState();
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
      card.className = `p-3 rounded-2xl border-3 flex flex-col justify-between text-center transition-all ${
        isActive 
          ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300 shadow-md' 
          : isUnlocked 
            ? 'bg-white border-emerald-300' 
            : 'bg-white border-slate-200'
      }`;

      card.innerHTML = `
        <div>
          <div class="w-14 h-14 mx-auto mb-2 flex items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 shadow-inner">
            ${skin.svg}
          </div>
          <h4 class="text-xs sm:text-sm font-black text-slate-800">${skin.name}</h4>
          <p class="text-[10px] text-slate-500 font-bold mt-0.5 line-clamp-2">${skin.description}</p>
        </div>
        <div class="mt-3">
          ${
            isActive 
              ? `<span class="text-xs font-black text-amber-700 bg-amber-200/80 px-2.5 py-1 rounded-xl block">NASAZENO ⭐</span>`
              : isUnlocked 
                ? `<button onclick="equipSkin('${skin.id}')" class="game-button w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-1.5 rounded-xl text-xs shadow-sm">Nasadit skin</button>`
                : `<button onclick="buySkinAction('${skin.id}')" class="game-button w-full bg-cyan-500 hover:bg-cyan-600 text-white font-black py-1.5 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1"><span>Koupit za ${price}</span> 💎</button>`
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
      card.className = `p-3 rounded-2xl border-3 flex flex-col justify-between text-center transition-all ${
        isActive 
          ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300 shadow-md' 
          : isUnlocked 
            ? 'bg-white border-emerald-300' 
            : 'bg-white border-slate-200'
      }`;

      card.innerHTML = `
        <div>
          <div class="w-full h-12 rounded-xl mb-2 shadow-inner border border-black/10 flex items-center justify-center text-xs font-black text-white" style="background: ${theme.previewGradient};">
            Náhled tapety
          </div>
          <h4 class="text-xs sm:text-sm font-black text-slate-800">${theme.name}</h4>
          <p class="text-[10px] text-slate-500 font-bold mt-0.5 line-clamp-2">${theme.description}</p>
        </div>
        <div class="mt-3">
          ${
            isActive 
              ? `<span class="text-xs font-black text-amber-700 bg-amber-200/80 px-2.5 py-1 rounded-xl block">AKTIVNÍ TAPETA 🌍</span>`
              : isUnlocked 
                ? `<button onclick="equipTheme('${theme.id}')" class="game-button w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-1.5 rounded-xl text-xs shadow-sm">Nastavit tapetu</button>`
                : `<button onclick="buyThemeAction('${theme.id}')" class="game-button w-full bg-cyan-500 hover:bg-cyan-600 text-white font-black py-1.5 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1"><span>Koupit za ${price}</span> 💎</button>`
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
      card.className = `p-3 rounded-2xl border-3 flex flex-col justify-between text-center transition-all ${
        isActive 
          ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300 shadow-md' 
          : isUnlocked 
            ? 'bg-white border-emerald-300' 
            : 'bg-white border-slate-200'
      }`;

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-xl">🔔</span>
            <button onclick="playSoundById('${snd.id}')" class="game-button bg-indigo-100 hover:bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-lg text-xs font-bold" title="Poslechnout zvuk">
              Poslech 🔊
            </button>
          </div>
          <h4 class="text-xs sm:text-sm font-black text-slate-800">${snd.name}</h4>
          <p class="text-[10px] text-slate-500 font-bold mt-0.5">${snd.description}</p>
        </div>
        <div class="mt-3">
          ${
            isActive 
              ? `<span class="text-xs font-black text-amber-700 bg-amber-200/80 px-2.5 py-1 rounded-xl block">AKTIVNÍ ZVUK 🔊</span>`
              : isUnlocked 
                ? `<button onclick="equipSound('${snd.id}')" class="game-button w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-1.5 rounded-xl text-xs shadow-sm">Zvolit zvuk</button>`
                : `<button onclick="buySoundAction('${snd.id}')" class="game-button w-full bg-cyan-500 hover:bg-cyan-600 text-white font-black py-1.5 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1"><span>Koupit za ${price}</span> 💎</button>`
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

  const rateBadge = document.getElementById('diamond-rate-badge');
  if (rateBadge) rateBadge.textContent = `Cena: ${state.diamondExchangeRate || 20} 💎`;

  const dynTitle = document.getElementById('dynamic-package-title');
  const dynCost = document.getElementById('dynamic-package-cost');
  if (dynTitle) dynTitle.textContent = `${maxLimit} MINUT`;
  if (dynCost) dynCost.textContent = `Cena: ${maxLimit} hvězd ⭐`;

  const pinDesc = document.getElementById('pin-card-description');
  if (state.goldDiamonds >= 50) {
    if (pinDesc) pinDesc.innerHTML = `<span class="text-yellow-300 font-black">Máš 50 diamantů! PIN je připraven k odemčení:</span>`;
  } else {
    if (pinDesc) pinDesc.textContent = `Nasbírej 50 diamantů k odemčení tajného PINu tabletu (zbývá ${50 - state.goldDiamonds} 💎).`;
  }
}

function buyLimitExtension() {
  const rate = state.diamondExchangeRate || 20;
  if ((state.goldDiamonds || 0) < rate) {
    soundError();
    alertUserFeedback(`Potřebuješ ${rate} modrých diamantů 💎 (máš jen ${state.goldDiamonds || 0}).`);
    return;
  }

  state.goldDiamonds -= rate;
  state.bonusMaxLimitMinutes = (state.bonusMaxLimitMinutes || 0) + 1;
  const newMax = getMaxDailyDirectLimit();

  state.history.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('cs-CZ'),
    type: 'limit_extended',
    minutes: 0,
    note: `Nákup za ${rate} 💎: Denní limit zvýšen na ${newMax} min!`
  });

  saveState();
  soundPurchase();
  triggerConfetti();
  updateBalanceUI();
  updateTopBadges();
  updateDiamondMarketUI();
  alertUserFeedback(`Denní limit navýšen na ${newMax} minut! 🚀`);
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

function buyTimePackage(minutes) {
  if (state.minutesBalance < minutes) {
    soundError();
    alertUserFeedback(`Máš ${formatMinutes(state.minutesBalance)}. Potřebuješ ${minutes} minut ⭐!`);
    return;
  }

  state.minutesBalance = Math.round((state.minutesBalance - minutes) * 100) / 100;
  state.history.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('cs-CZ'),
    type: 'spent',
    minutes: -minutes,
    note: `Vyzvednut poukaz: ${minutes} min na tabletu`
  });

  saveState();
  soundPurchase();
  triggerConfetti();

  const voucherModal = document.getElementById('voucher-modal');
  const voucherText = document.getElementById('voucher-text');
  if (voucherText) voucherText.textContent = `LÍSTEK NA ${minutes} MINUT HRANÍ JE TVŮJ! 🎮`;
  if (voucherModal) voucherModal.classList.remove('hidden');
  updateBalanceUI();
}

function buyDynamicTimePackage() {
  const currentMax = getMaxDailyDirectLimit();
  buyTimePackage(currentMax);
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

  if (viewName === 'store') {
    if (storeView) storeView.classList.remove('hidden');
    const storeBalEl = document.getElementById('store-balance-display');
    if (storeBalEl) storeBalEl.textContent = formatMinutes(state.minutesBalance).replace(' min', '');
    const vaultEl = document.getElementById('vault-display');
    if (vaultEl) vaultEl.textContent = formatMinutes(state.vaultBalance || 0);
    updateDiamondMarketUI();
    renderStoreSkinsUI();
    if (typeof renderStorePetsUI === 'function') renderStorePetsUI();
  } else if (viewName === 'quests') {
    if (questsView) questsView.classList.remove('hidden');
    switchQuestsSubTab('tasks');
  } else if (viewName === 'test') {
    if (testView) testView.classList.remove('hidden');
  } else if (viewName === 'arena') {
    if (arenaView) arenaView.classList.remove('hidden');
    if (typeof renderArenaMainUI === 'function') renderArenaMainUI();
  } else {
    if (learnView) learnView.classList.remove('hidden');
  }
  updateBalanceUI();
  if (typeof updateTopPetCompanionWidget === 'function') updateTopPetCompanionWidget();
}

function updateBalanceUI() {
  const displayTop = document.getElementById('top-balance-display');
  const displayStore = document.getElementById('store-balance-display');
  const displayAdmin = document.getElementById('admin-balance-display');
  const vaultStore = document.getElementById('vault-display');
  const vaultAdmin = document.getElementById('admin-vault-indicator');

  if (displayTop) displayTop.textContent = formatMinutes(state.minutesBalance);
  if (displayStore) displayStore.textContent = formatMinutes(state.minutesBalance).replace(' min', '');
  if (displayAdmin) displayAdmin.textContent = formatMinutes(state.minutesBalance);
  if (vaultStore) vaultStore.textContent = formatMinutes(state.vaultBalance || 0);
  if (vaultAdmin) vaultAdmin.textContent = formatMinutes(state.vaultBalance || 0);

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
      minutesChance: 50,
      minutesMin: 0.5,
      minutesMax: 1.0,
      foodChance: 20,
      foodAmount: 1,
      reviveChance: 15,
      reviveAmount: 1,
      diaSmallChance: 5,
      diaSmallAmount: 2,
      diaMedChance: 0.9,
      diaMedAmount: 10,
      diaJackpotChance: 0.1,
      diaJackpotAmount: 20
    };
  }
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
  const wRevive = Math.max(0, Number(cfg.reviveChance) ?? 15);
  const wFood = Math.max(0, Number(cfg.foodChance) ?? 20);
  const wMinutes = Math.max(0, Number(cfg.minutesChance) ?? 50);

  const sumWeights = wJackpot + wMed + wSmall + wRevive + wFood + wMinutes;
  if (sumWeights <= 0) {
    return { type: 'minutes', amount: 0.5 };
  }

  // Pokud je součet <= 100 a minuty jsou povoleny, zachováme přesné procentuální šance vzácných odměn (0,1 %, 0,9 %, 5 %, 15 %, 20 %)
  // a zbytek padne na minuty; pokud rodič nastaví součet > 100 nebo 0 % na minuty, losujeme poměrově podle součtu vah.
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
    } else {
      const isJackpot = drop.type === 'diamonds_jackpot';
      burstIcon = isJackpot ? '👑' : '💎';
      burstShortLabel = `+${drop.amount} 💎`;
      if (rewardIcon) rewardIcon.textContent = burstIcon;
      state.goldDiamonds = (state.goldDiamonds || 0) + drop.amount;
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

  cfg.minutesChance = getNum('admin-dchest-chance-minutes', 50);
  cfg.minutesMin = Math.max(0.5, getNum('admin-dchest-min-minutes', 0.5));
  cfg.minutesMax = Math.max(cfg.minutesMin, getNum('admin-dchest-max-minutes', 1.0));
  cfg.foodChance = getNum('admin-dchest-chance-food', 20);
  cfg.foodAmount = Math.max(1, Math.round(getNum('admin-dchest-amt-food', 1)));
  cfg.reviveChance = getNum('admin-dchest-chance-revive', 15);
  cfg.reviveAmount = Math.max(1, Math.round(getNum('admin-dchest-amt-revive', 1)));
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
    minutesChance: 50,
    minutesMin: 0.5,
    minutesMax: 1.0,
    foodChance: 20,
    foodAmount: 1,
    reviveChance: 15,
    reviveAmount: 1,
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
  setVal('admin-dchest-chance-diasmall', cfg.diaSmallChance);
  setVal('admin-dchest-amt-diasmall', cfg.diaSmallAmount);
  setVal('admin-dchest-chance-diamed', cfg.diaMedChance);
  setVal('admin-dchest-amt-diamed', cfg.diaMedAmount);
  setVal('admin-dchest-chance-diajackpot', cfg.diaJackpotChance);
  setVal('admin-dchest-amt-diajackpot', cfg.diaJackpotAmount);

  const sumLabel = document.getElementById('admin-daily-chest-sum-label');
  if (sumLabel) {
    const total = Math.round((cfg.minutesChance + cfg.foodChance + cfg.reviveChance + cfg.diaSmallChance + cfg.diaMedChance + cfg.diaJackpotChance) * 100) / 100;
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

  if (btnReading) btnReading.className = 'h-full px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 text-slate-600 hover:bg-slate-200';
  if (btnMath) btnMath.className = 'h-full px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 text-slate-600 hover:bg-slate-200';
  if (btnClocks) btnClocks.className = 'h-full px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 text-slate-600 hover:bg-slate-200';
  if (btnTest) btnTest.className = 'h-full px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm relative';

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

  const pickStrictFallback = () => {
    const pools = [
      { list: LEVEL_7_SENTENCES.filter(s => isItemFormedByActive(s.letters)), label: 'Celá věta' },
      { list: LEVEL_6_SOFT.filter(w => isItemFormedByActive(w.letters)), label: 'Měkčení DĚ/TĚ/NĚ' },
      { list: LEVEL_5_CLUSTERS.filter(w => isItemFormedByActive(w.letters)), label: 'Shluk / Dvojhláska' },
      { list: LEVEL_4_TWO_SYLLABLE_WORDS.filter(w => isItemFormedByActive(w.letters)), label: 'Dvouslabičné slovo' },
      { list: LEVEL_3_CVC_WORDS.filter(w => isItemFormedByActive(w.letters)), label: 'Jednoslabičné slovo' }
    ].filter(p => p.list.length > 0);

    if (pools.length > 0) {
      const p = pools[0];
      const chosen = p.list[Math.floor(Math.random() * p.list.length)];
      return { text: chosen.text, label: p.label };
    }
    if (sylls.length > 0) {
      const s = sylls[Math.floor(Math.random() * sylls.length)];
      return { text: s.text, label: 'Slabika' };
    }
    const ch = activeLetters[Math.floor(Math.random() * activeLetters.length)];
    return { text: ch, label: 'Písmeno' };
  };

  if (level === 1) {
    const char = activeLetters[Math.floor(Math.random() * activeLetters.length)];
    item = { text: char, label: 'Písmeno' };
  } else if (level === 2) {
    item = sylls.length ? { text: sylls[Math.floor(Math.random() * sylls.length)].text, label: 'Slabika' } : pickStrictFallback();
  } else if (level === 3) {
    const list = LEVEL_3_CVC_WORDS.filter(w => isItemFormedByActive(w.letters));
    item = list.length ? { text: list[Math.floor(Math.random() * list.length)].text, label: 'Jednoslabičné slovo' } : pickStrictFallback();
  } else if (level === 4) {
    const list = LEVEL_4_TWO_SYLLABLE_WORDS.filter(w => isItemFormedByActive(w.letters));
    item = list.length ? { text: list[Math.floor(Math.random() * list.length)].text, label: 'Dvouslabičné slovo' } : pickStrictFallback();
  } else if (level === 5) {
    const list = LEVEL_5_CLUSTERS.filter(w => isItemFormedByActive(w.letters));
    item = list.length ? { text: list[Math.floor(Math.random() * list.length)].text, label: 'Shluk / Dvojhláska' } : pickStrictFallback();
  } else if (level === 6) {
    const list = LEVEL_6_SOFT.filter(w => isItemFormedByActive(w.letters));
    item = list.length ? { text: list[Math.floor(Math.random() * list.length)].text, label: 'Měkčení DĚ/TĚ/NĚ' } : pickStrictFallback();
  } else {
    const list = LEVEL_7_SENTENCES.filter(sen => isItemFormedByActive(sen.letters));
    item = list.length ? { text: list[Math.floor(Math.random() * list.length)].text, label: 'Celá věta' } : pickStrictFallback();
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
    const tasks = generateMathLevel1(maxVal);
    const t = tasks[Math.floor(Math.random() * tasks.length)];
    return { category: 'math', subLabel: 'Počty', renderType: 'html', htmlContent: t.htmlRow, correctAnswer: t.correctAnswer, uniqueKey: `math_1_${t.htmlRow}` };
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

    const card = document.createElement('div');
    card.className = 'flex flex-col items-center justify-center p-3 max-w-lg';
    card.innerHTML = `
      <h2 class="text-3xl sm:text-5xl font-black text-indigo-950 font-baloo tracking-wide leading-tight my-2">
        ${formatCase(cur.questionText)}
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
          <input type="number" min="0" max="100" value="${th.minPercent}" onchange="saveAdminTestThreshold(${idx}, 'minPercent', this.value)" class="w-12 text-center font-black py-0.5 px-1 border border-purple-300 rounded-lg bg-white text-xs">
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
  if (questId === 'q_reading_all') {
    setSubject('reading');
    switchLevel(state.currentLevel || 1);
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

function renderDailyQuests() {
  checkAndHandleDailyResets();
  syncTrackerQuestsWithState();
  const container = document.getElementById('quests-list-container');
  const dateDisplay = document.getElementById('quests-date-display');
  
  const todayFormatted = new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'numeric' });
  dateDisplay.textContent = todayFormatted;

  container.innerHTML = '';
  const qRate = (state.rewards && state.rewards.questRate) ? state.rewards.questRate : 4.0;

  state.quests.forEach(quest => {
    const isDone = quest.progress >= quest.target || quest.claimed;
    const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100));
    const isTracker = !!quest.isTrackerOnly;

    const card = document.createElement('div');
    card.className = `p-3 sm:p-4 rounded-3xl border-3 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
      quest.claimed || (isTracker && isDone)
        ? 'bg-emerald-50/60 border-emerald-300 opacity-90' 
        : isDone 
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-400 ring-2 ring-emerald-300 shadow-lg' 
          : isTracker
            ? 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer'
            : 'bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-lg cursor-pointer'
    }`;

    if (!isDone) {
      card.onclick = () => goToQuestLevel(quest.id);
    }

    let actionHtml = '';
    if (isTracker) {
      if (isDone) {
        actionHtml = `
          <div class="flex items-center gap-1.5 text-emerald-800 font-black text-xs sm:text-sm bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-2xl self-start sm:self-auto">
            <span>✅</span> SPLNĚNO DNES
          </div>
        `;
      } else {
        actionHtml = `
          <div class="flex flex-col sm:items-end gap-1 self-start sm:self-auto">
            <span class="text-[10px] font-extrabold text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded-xl block">
              📋 Přehled aktivity
            </span>
            <button onclick="event.stopPropagation(); goToQuestLevel('${quest.id}')" class="game-button text-xs font-black bg-slate-700 hover:bg-slate-800 text-white px-3 py-1 rounded-xl shadow-sm flex items-center gap-1">
              Přejít ➡️
            </button>
          </div>
        `;
      }
    } else if (quest.claimed) {
      actionHtml = `
        <div class="flex items-center gap-1.5 text-emerald-700 font-black text-xs sm:text-sm bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-2xl self-start sm:self-auto">
          <span>✅</span> SPLNĚNO (+${formatMinutes(qRate)} ⭐ & 🔥)
        </div>
      `;
    } else if (isDone) {
      actionHtml = `
        <button onclick="event.stopPropagation(); claimQuestReward('${quest.id}')" class="game-button bg-emerald-500 hover:bg-emerald-600 text-white font-black px-4 py-2 rounded-2xl border-b-4 border-emerald-700 text-xs sm:text-sm shadow-game-btn flex items-center gap-1.5 self-start sm:self-auto animate-bounce">
          <span>🎁</span> VYZVEDNOUT +${formatMinutes(qRate)}!
        </button>
      `;
    } else {
      actionHtml = `
        <div class="flex flex-col sm:items-end gap-1 self-start sm:self-auto">
          <span class="text-[11px] font-black text-indigo-900 bg-amber-200 border border-amber-400 px-2.5 py-0.5 rounded-xl block">
            Odměna: +${formatMinutes(qRate)} ⭐ + 🔥 Řada
          </span>
          <button onclick="event.stopPropagation(); goToQuestLevel('${quest.id}')" class="game-button text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-xl shadow-sm flex items-center gap-1">
            Trénovat ➡️
          </button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="flex items-start gap-3 flex-grow">
        <span class="text-3xl ${isTracker ? 'bg-slate-100 border-slate-200' : 'bg-indigo-50 border-indigo-100'} p-1.5 rounded-2xl border">${quest.icon}</span>
        <div class="flex-grow">
          <div class="flex items-center flex-wrap gap-2">
            <h4 class="font-black text-slate-800 text-sm sm:text-base">${quest.title}</h4>
            ${isDone ? '<span class="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Hotovo!</span>' : '<span class="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Chybí splnit</span>'}
          </div>
          <p class="text-[11px] text-slate-600 font-bold mt-0.5">${quest.desc}</p>
          <div class="mt-1.5 w-full max-w-md bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300">
            <div class="bg-gradient-to-r ${isDone ? 'from-emerald-500 to-teal-500' : 'from-indigo-500 to-purple-500'} h-full rounded-full transition-all duration-500" style="width: ${percent}%;"></div>
          </div>
          <div class="text-[10px] font-extrabold text-slate-500 mt-0.5">
            Postup: <span class="text-indigo-700">${quest.progress} / ${quest.target}</span> (${percent}%)
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

  quest.claimed = true;
  if (!quest.isTrackerOnly) {
    const qRate = (state.rewards && state.rewards.questRate) ? state.rewards.questRate : 4.0;
    creditRewardMinutes(qRate, `Denní úkol: ${quest.title}`);
  }

  saveState();
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
  if (rateInput) rateInput.value = state.diamondExchangeRate || 20;
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
  state.dailyEarnedDate = getTodayDateString();
  saveState();
  playTone(700, 0.15, 'sine', 0.2);
  alertUserFeedback('Dnešní limit vynulován!');
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

function alertUserFeedback(msg) {
  const el = document.createElement('div');
  el.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-2xl z-50 animate-bounce text-center max-w-sm';
  el.textContent = `✅ ${msg}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

let currentMathAnswer = null;

function openParentModal() {
  const modal = document.getElementById('parent-pin-modal');
  const challenge = document.getElementById('math-challenge');
  const err = document.getElementById('pin-error');
  const input = document.getElementById('pin-input');
  err.classList.add('hidden');
  input.value = '';

  const n1 = Math.floor(Math.random() * 5) + 6;
  const n2 = Math.floor(Math.random() * 6) + 4;
  currentMathAnswer = n1 * n2;
  challenge.textContent = `Kolik je: ${n1} × ${n2} ?`;

  modal.classList.remove('hidden');
  setTimeout(() => input.focus(), 150);
}

function closeParentModal() {
  document.getElementById('parent-pin-modal').classList.add('hidden');
}

function verifyParentPin() {
  const input = document.getElementById('pin-input').value.trim();
  const err = document.getElementById('pin-error');

  if (parseInt(input) === currentMathAnswer || input === '1234') {
    closeParentModal();
    openAdminPanel();
  } else {
    err.classList.remove('hidden');
    soundError();
  }
}

function switchAdminTab(tabKey) {
  const btnGeneral = document.getElementById('admin-tab-btn-general');
  const btnSkins = document.getElementById('admin-tab-btn-skins_admin');
  const btnPets = document.getElementById('admin-tab-btn-pets_admin');
  const btnTest = document.getElementById('admin-tab-btn-test');
  const btnLegend = document.getElementById('admin-tab-btn-legendary');
  const btnMath = document.getElementById('admin-tab-btn-math');
  const btnReading = document.getElementById('admin-tab-btn-reading');

  const contentGeneral = document.getElementById('admin-tab-content-general');
  const contentSkins = document.getElementById('admin-tab-content-skins_admin');
  const contentPets = document.getElementById('admin-tab-content-pets_admin');
  const contentTest = document.getElementById('admin-tab-content-test');
  const contentLegend = document.getElementById('admin-tab-content-legendary');
  const contentMath = document.getElementById('admin-tab-content-math');
  const contentReading = document.getElementById('admin-tab-content-reading');

  [btnGeneral, btnSkins, btnPets, btnTest, btnLegend, btnMath, btnReading].forEach(b => {
    if (b) b.className = 'w-full py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all text-slate-700 hover:bg-slate-200 flex items-center gap-2 text-left';
  });

  if (contentGeneral) contentGeneral.classList.add('hidden');
  if (contentSkins) contentSkins.classList.add('hidden');
  if (contentPets) contentPets.classList.add('hidden');
  if (contentTest) contentTest.classList.add('hidden');
  if (contentLegend) contentLegend.classList.add('hidden');
  if (contentMath) contentMath.classList.add('hidden');
  if (contentReading) contentReading.classList.add('hidden');

  if (tabKey === 'skins_admin') {
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

function renderRewardInputs() {
  if (!state.rewards) state.rewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS));
  const qRateInput = document.getElementById('reward-quest-rate');
  if (qRateInput) qRateInput.value = state.rewards.questRate || 1.0;

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
        <input type="number" step="0.25" min="0.0" max="10" value="${val}" onchange="saveRewardRate('reading', ${i}, this.value)" class="w-full text-center font-black text-indigo-900 bg-emerald-50 border border-emerald-300 rounded-lg py-0.5 text-xs">
        <span class="text-[9px] font-bold text-slate-500">min</span>
      </div>
    `;
    readingBox.appendChild(item);
  }

  const mathBox = document.getElementById('rewards-math-inputs');
  mathBox.innerHTML = '';
  const mNames = ['1. Počty/Desítky', '2. Porovnávání', '3. Číselná řada', '4. Počítadlo', '5. Rozklad čísel', '6. Slovní úlohy'];

  for (let i = 1; i <= 6; i++) {
    const val = (state.rewards.math && state.rewards.math[i] !== undefined) ? state.rewards.math[i] : DEFAULT_REWARDS.math[i];
    const item = document.createElement('div');
    item.className = 'bg-white p-2 rounded-xl border border-emerald-200 flex flex-col justify-between';
    item.innerHTML = `
      <span class="text-[10px] font-black text-slate-700 truncate mb-0.5">${mNames[i - 1]}</span>
      <div class="flex items-center gap-1">
        <input type="number" step="0.25" min="0.0" max="10" value="${val}" onchange="saveRewardRate('math', ${i}, this.value)" class="w-full text-center font-black text-indigo-900 bg-emerald-50 border border-emerald-300 rounded-lg py-0.5 text-xs">
        <span class="text-[9px] font-bold text-slate-500">min</span>
      </div>
    `;
    mathBox.appendChild(item);
  }
}

function saveRewardRate(category, level, valStr) {
  const num = Math.max(0, parseFloat(valStr.replace(',', '.')) || 0);
  if (!state.rewards) state.rewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS));

  if (category === 'quest') state.rewards.questRate = num;
  else if (category === 'reading') state.rewards.reading[level] = num;
  else if (category === 'math') state.rewards.math[level] = num;

  saveState();
  updateNavTabRewardLabels();
  updateReviewButtonLabel();
  playTone(550, 0.08, 'sine', 0.15);
}

function resetDefaultRewards() {
  state.rewards = JSON.parse(JSON.stringify(DEFAULT_REWARDS));
  saveState();
  renderRewardInputs();
  updateNavTabRewardLabels();
  updateReviewButtonLabel();
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
  playTone(550, 0.2, 'sine', 0.2);
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
  state = {
    appVersion: APP_VERSION,
    subject: 'reading',
    minutesBalance: 0.0,
    dailyEarnedToday: 0.0,
    dailyEarnedDate: getTodayDateString(),
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
    letterCase: 'upper',
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
  if (typeof updateTopPetCompanionWidget === 'function') updateTopPetCompanionWidget();
  setSubject('reading');
  setGridCount(8);
  switchLevel(1);
  updateBalanceUI();
  updateTopBadges();
  updateSpeechToggleUI();
  updateImageToggleUI();
  updateDiamondMarketUI();
  renderStoreSkinsUI();
  if (typeof renderStorePetsUI === 'function') renderStorePetsUI();
}

window.addEventListener('DOMContentLoaded', () => {
  loadState();
  if (typeof ensurePetStateInitialized === 'function') ensurePetStateInitialized();
  if (typeof updateTopPetCompanionWidget === 'function') updateTopPetCompanionWidget();
  updateBalanceUI();
  updateTopBadges();
  updateDiamondMarketUI();
  renderStoreSkinsUI();
  if (typeof renderStorePetsUI === 'function') renderStorePetsUI();
  if (!state.gridCardCount) state.gridCardCount = 8;
  if (state.showImages === undefined) state.showImages = true;
  if (state.showSpeechButton === undefined) state.showSpeechButton = true;
  if (!state.spellingRepeatCount) state.spellingRepeatCount = 3;
  if (!state.mathMax) state.mathMax = 10;
  if (!state.goldDiamonds) state.goldDiamonds = 0;
  if (!state.bonusMaxLimitMinutes) state.bonusMaxLimitMinutes = 0;
  if (!state.diamondExchangeRate) state.diamondExchangeRate = 20;
  if (!state.pokemonSegmentsCount) state.pokemonSegmentsCount = 12;
  if (!state.tabletSecretPin) state.tabletSecretPin = 'XXXX';
  if (!state.customDailyLevelChoice) state.customDailyLevelChoice = 4;
  if (state.streakDays === undefined) state.streakDays = 0;

  updateImageToggleUI();
  updateSpeechToggleUI();
  setLetterCase(state.letterCase || 'upper');
  setSubject(state.subject || 'reading');
  setGridCount(state.gridCardCount);

  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  document.getElementById('pin-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyParentPin();
  });
});