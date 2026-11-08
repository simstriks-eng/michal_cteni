/* ============================================================
   clocks.js - Školácká Mise
   Modul pro výuku ručičkových, digitálních hodin a představivosti o čase
   ============================================================ */

let clockState = {
  currentSubLevel: 1,      // 1 = celé, 2 = velká ruč., 3 = kombinace, 4 = představivost (Jak dlouho co trvá)
  subMode: 'basic',        // 'basic' nebo 'advanced'
  timeFilter: 'all',       // 'all', 'morning', 'forenoon', 'afternoon', 'evening', 'night'
  gameMode: 'training',    // 'training' nebo 'sharp'
  displayType: 'analog',   // 'analog' nebo 'digital'
  showComparison: true,    // U digitálek zapnuté srovnání
  sharpScore: 0,           // Počet správných odpovědí v ostrém režimu (0 až 10)
  targetHour: 12,
  targetMinute: 0,
  options: [],
  correctAnswer: "",
  isAnswerChecked: false,
  
  // Stav pro novou minihru "Představivost o čase"
  timeQuiz: {
    currentActivity: null,
    options: [],
    score: 0
  }
};

// Rozsáhlá databáze aktivit pro budování časové představivosti
const timeImaginationDatabase = [
  // Velmi krátký čas (sekundy / jednotky minut)
  { text: "Zavázání bot (tkaniček)", durationSec: 30, category: "krátké", hint: "Trvá to jen chvilku, než vyběhneš ven!" },
  { text: "Spolknutí vitamínu nebo léku", durationSec: 10, category: "krátké", hint: "Hned to je." },
  { text: "Jedno kolo v mobilní hře", durationSec: 90, category: "krátké", hint: "Rychlá akce." },
  { text: "Vyčištění zubů v koupelně", durationSec: 150, category: "krátké", hint: "Aby byly zoubky bílé a zdravé." },
  { text: "Oblékání bundy a bot", durationSec: 300, category: "krátké", hint: "Než jdeme do školy." },
  { text: "Uklizení kostek Lega do krabice", durationSec: 300, category: "krátké", hint: "Rychlý úklid hracího koutku." },
  { text: "Cesta autem k babičce (máme to kousek)", durationSec: 300, category: "krátké", hint: "Jenom 5 minut a jsi tam!" },

  // Střední čas (desítky minut až půl hodiny)
  { text: "Snězení večeře nebo oběda", durationSec: 1200, category: "střední", hint: "V klidu u rodinného stolu." },
  { text: "Pohádka v televizi před spaním", durationSec: 1500, category: "střední", hint: "Jeden hezký animovaný příběh." },
  { text: "Rychlá hra s míčem venku", durationSec: 1800, category: "střední", hint: "Předtím, než se půjde domů." },
  { text: "Hraní na tabletu (chvilka)", durationSec: 1800, category: "střední", hint: "Půl hodiny digitální zábavy." },
  { text: "Svačina a chvilka odpočinku po škole", durationSec: 1800, category: "střední", hint: "Doplnění energie." },

  // Delší čas (1 až 3 hodiny)
  { text: "Cesta autem do Olomouce", durationSec: 3600, category: "dlouhé", hint: "Výlet do jiného města." },
  { text: "Trénink džúdžitsu", durationSec: 3600, category: "dlouhé", hint: "Pořádné cvičení a chvaty." },
  { text: "Trénink plavání v bazénu", durationSec: 3600, category: "dlouhé", hint: "Skoky do vody a plavání." },
  { text: "Čtení knížek a časopisů", durationSec: 3600, category: "dlouhé", hint: "Listování příběhy." },
  { text: "Řádění na dětském hřišti", durationSec: 5400, category: "dlouhé", hint: "Houpačky, prolézačky a skluzavky." },
  { text: "Jízda na koloběžce na pumptracku", durationSec: 7200, category: "dlouhé", hint: "Parádní sportovní chvilky." },
  { text: "Rodinná nedělní procházka lesem", durationSec: 7200, category: "dlouhé", hint: "Výlet do přírody." },
  { text: "Návštěva kina na animovaný film", durationSec: 7200, category: "dlouhé", hint: "Film na velkém plátně s popcornem." },

  // Dlouhé celky (půl dne až den)
  { text: "Školní dopoledne (vyučování, přestávky, oběd)", durationSec: 20000, category: "celky", hint: "Ve škole s kamarády a paní učitelkou." },
  { text: "Celodenní rodinný výlet (aquapark / zoo)", durationSec: 25000, category: "celky", hint: "Zážitky na celý den." },
  { text: "Noční spinkání v postýlce", durationSec: 36000, category: "celky", hint: "Když celá noc uběhne ve snu." },
  { text: "Dlouhá cesta autem na dovolenou do Chorvatska", durationSec: 39600, category: "celky", hint: "Velká daleká cesta k moři." }
];

function renderClockSection() {
  const container = document.getElementById('content-grid-view');
  if (!container) return;

  cleanupHeaderDots();
  container.className = 'w-full flex flex-col items-center justify-center';

  document.getElementById('content-spelling-view').classList.add('hidden');
  document.getElementById('content-coloring-view').classList.add('hidden');
  document.getElementById('content-flash-view').classList.add('hidden');
  document.getElementById('content-empty-notice').classList.add('hidden');
  container.classList.remove('hidden');

  // Pokud je aktivní 4. záložka (Představivost o čase), vykreslíme speciální rozhraní
  if (clockState.currentSubLevel === 4) {
    renderTimeImaginationModule(container);
    return;
  }

  const activeSubClass = 'py-1 px-2.5 rounded-xl font-black text-xs transition-all bg-amber-500 text-white shadow-sm';
  const inactiveSubClass = 'py-1 px-2.5 rounded-xl font-black text-xs transition-all text-slate-700 hover:bg-slate-100';

  const activeDispClass = 'py-1 px-2.5 rounded-lg font-black text-xs transition-all bg-amber-500 text-white shadow-sm';
  const inactiveDispClass = 'py-1 px-2.5 rounded-lg font-black text-xs transition-all text-slate-700 hover:bg-amber-100';

  const getFilterClass = (key) => clockState.timeFilter === key
    ? 'py-1 px-2.5 rounded-xl bg-sky-600 text-white shadow-sm transition-all text-xs font-black text-center'
    : 'py-1 px-2 rounded-xl bg-white text-slate-700 hover:bg-sky-100 transition-all text-xs font-black text-center';

  // Standardní zobrazení hodin (záložky 1, 2, 3)
  container.innerHTML = `
    <div class="w-full max-w-7xl mx-auto flex flex-col gap-1.5 sm:gap-2 px-1 sm:px-2">
      
      <!-- HORNÍ LIŠTA: Úroveň + Přepínač Analog/Digitál -->
      <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-2 p-1.5 bg-white rounded-2xl border-2 border-amber-300 shadow-sm">
        <div class="w-full sm:w-auto flex items-center gap-1 flex-wrap">
          <button onclick="switchClockSubLevel(1)" id="clock-sub-btn-1" class="${clockState.currentSubLevel === 1 ? activeSubClass : inactiveSubClass}">
            ⏰ 1. Celé hodiny
          </button>
          <button onclick="switchClockSubLevel(2)" id="clock-sub-btn-2" class="${clockState.currentSubLevel === 2 ? activeSubClass : inactiveSubClass}">
            ⏱️ 2. Velká ruč.
          </button>
          <button onclick="switchClockSubLevel(3)" id="clock-sub-btn-3" class="${clockState.currentSubLevel === 3 ? activeSubClass : inactiveSubClass}">
            🎯 3. Kombinace
          </button>
          <button onclick="switchClockSubLevel(4)" id="clock-sub-btn-4" class="${clockState.currentSubLevel === 4 ? activeSubClass : inactiveSubClass}">
            🧠 4. Jak dlouho co trvá?
          </button>
        </div>

        <div class="flex items-center bg-slate-100 p-0.5 rounded-xl border-2 border-amber-300 shadow-inner flex-shrink-0">
          <button onclick="switchClockDisplayType('analog')" id="display-type-btn-analog" class="${clockState.displayType === 'analog' ? activeDispClass : inactiveDispClass}">
            ⏰ Ručičkové
          </button>
          <button onclick="switchClockDisplayType('digital')" id="display-type-btn-digital" class="${clockState.displayType === 'digital' ? activeDispClass : inactiveDispClass}">
            📱 Digitální
          </button>
        </div>
      </div>

      <!-- HORNÍ LIŠTA PRO FILTRY DENNÍ DOBY -->
      <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-1.5 px-2.5 py-1.5 bg-sky-50 rounded-2xl border-2 border-sky-200 shadow-sm text-xs font-black text-sky-950">
        <div class="flex items-center gap-1.5 px-1 flex-shrink-0">
          <span>🌅 Výběr denní doby:</span>
        </div>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-1 w-full sm:w-auto" id="clock-time-filters-bar">
          <button onclick="switchTimeFilter('all')" id="filter-btn-all" class="${getFilterClass('all')}">Vše</button>
          <button onclick="switchTimeFilter('morning')" id="filter-btn-morning" class="${getFilterClass('morning')}">🌅 Ráno</button>
          <button onclick="switchTimeFilter('forenoon')" id="filter-btn-forenoon" class="${getFilterClass('forenoon')}">☀️ Dopol.</button>
          <button onclick="switchTimeFilter('afternoon')" id="filter-btn-afternoon" class="${getFilterClass('afternoon')}">🌤️ Odpol.</button>
          <button onclick="switchTimeFilter('evening')" id="filter-btn-evening" class="${getFilterClass('evening')}">🌆 Večer</button>
          <button onclick="switchTimeFilter('night')" id="filter-btn-night" class="${getFilterClass('night')}">🌙 Noc</button>
        </div>
      </div>

      <!-- HLAVNÍ MŘÍŽKA -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-stretch w-full">
        
        <!-- LEVÝ PANEL -->
        <div class="md:col-span-3 flex flex-col gap-2">
          <div class="w-full flex flex-col gap-2 bg-white p-2.5 sm:p-3 rounded-2xl border-3 border-amber-300 shadow-md h-full justify-center">
            
            <div class="w-full flex flex-col gap-1 p-2.5 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl border-2 border-purple-300 text-xs font-black text-purple-950">
              <div class="flex items-center justify-between">
                <span>🎮 Režim:</span>
                <span id="sharp-counter-badge" class="hidden bg-cyan-600 text-white px-2 py-0.5 rounded-lg text-[11px] shadow-sm">Splněno: 0 / 10</span>
              </div>
              <div class="flex flex-col gap-1 mt-0.5">
                <button onclick="switchClockGameMode('training')" id="clock-mode-game-training" class="py-1.5 px-2 rounded-xl transition-all bg-indigo-600 text-white shadow-sm text-center text-xs">Trénink</button>
                <button onclick="switchClockGameMode('sharp')" id="clock-mode-game-sharp" class="py-1.5 px-2 rounded-xl transition-all text-purple-900 hover:bg-purple-100 text-center text-xs">🔥 Ostrá (2 💎)</button>
              </div>
            </div>

            <div id="clock-mode-toggle-container" class="w-full flex flex-col gap-1 px-2.5 py-2 bg-amber-100/85 rounded-xl border-2 border-amber-300 text-xs font-black text-amber-950">
              <span id="clock-mode-label">Režim zobrazení:</span>
              <div class="flex flex-col gap-1 mt-0.5">
                <button onclick="switchClockMode('basic')" id="clock-mode-btn-basic" class="py-1.5 px-2 rounded-xl transition-all ${clockState.subMode === 'basic' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-900 hover:bg-amber-100'} text-center text-xs">Čtvrt / Půl</button>
                <button onclick="switchClockMode('advanced')" id="clock-mode-btn-advanced" class="py-1.5 px-2 rounded-xl transition-all ${clockState.subMode === 'advanced' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-900 hover:bg-amber-100'} text-center text-xs">Minuty</button>
              </div>
            </div>

          </div>
        </div>

        <!-- PRAVÝ PANEL -->
        <div class="md:col-span-9 flex flex-col items-center justify-between bg-white p-2.5 sm:p-3.5 rounded-2xl border-3 border-amber-300 shadow-md w-full">
          <div id="clock-display-main-box" class="flex flex-col md:flex-row items-center justify-center gap-4 w-full min-h-[200px] sm:min-h-[220px] my-auto">
            <!-- Vykreslí se dynamicky -->
          </div>
          <div class="text-center mt-1.5">
            <div id="clock-context-pill" class="inline-flex items-center gap-1.5 text-sm font-black px-4 py-1 rounded-xl border-2 shadow-sm">
              <span>☀️</span> <span>RÁNO</span>
            </div>
          </div>
        </div>

      </div>

      <!-- MOŽNOSTI ODPOVĚDÍ -->
      <div class="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-4xl mx-auto mt-0.5" id="clock-options-container">
        <!-- Generováno dynamicky -->
      </div>
      
    </div>
  `;

  updateClockModeVisibility();
  updateGameModeUI();
  generateNewClockTask();
}

// Vykreslení nového modulu pro představivost o čase (Záložka 4)
function renderTimeImaginationModule(container) {
  if (!clockState.timeQuiz.currentActivity) {
    generateNewTimeQuizQuestion();
  }

  const quiz = clockState.timeQuiz;
  const act = quiz.currentActivity;

  container.innerHTML = `
    <div class="w-full max-w-5xl mx-auto flex flex-col gap-2.5">
      
      <!-- HORNÍ LIŠTA ZÁLOŽEK -->
      <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-2 p-1.5 bg-white rounded-2xl border-2 border-amber-300 shadow-sm">
        <div class="w-full sm:w-auto flex items-center gap-1 flex-wrap">
          <button onclick="switchClockSubLevel(1)" class="py-1 px-2.5 rounded-xl font-black text-xs transition-all text-slate-700 hover:bg-slate-100">⏰ 1. Celé hodiny</button>
          <button onclick="switchClockSubLevel(2)" class="py-1 px-2.5 rounded-xl font-black text-xs transition-all text-slate-700 hover:bg-slate-100">⏱️ 2. Velká ruč.</button>
          <button onclick="switchClockSubLevel(3)" class="py-1 px-2.5 rounded-xl font-black text-xs transition-all text-slate-700 hover:bg-slate-100">🎯 3. Kombinace</button>
          <button onclick="switchClockSubLevel(4)" class="py-1 px-2.5 rounded-xl font-black text-xs transition-all bg-amber-500 text-white shadow-sm">🧠 4. Jak dlouho co trvá?</button>
        </div>
        <div class="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-300">
          🌟 Úspěchy: <span id="time-quiz-score">${quiz.score}</span> / 10
        </div>
      </div>

      <!-- HLAVNÍ KARTA KVÍZU PRO PŘEDSTAVIVOST -->
      <div class="w-full bg-white p-4 sm:p-5 rounded-3xl border-3 border-amber-300 shadow-lg flex flex-col items-center text-center gap-3.5">
        
        <div class="inline-flex items-center gap-2 bg-sky-100 text-sky-950 px-4 py-1.5 rounded-2xl border-2 border-sky-300 font-black text-xs sm:text-sm">
          <span>💡</span> <span>Jaká aktivita odpovídá tomuto čase?</span>
        </div>

        <div class="text-2xl sm:text-3xl font-black text-amber-950 bg-amber-50 px-6 py-3 rounded-2xl border-3 border-amber-300 shadow-inner">
          ⏱️ ${formatDurationText(act.durationSec)}
        </div>

        <p class="text-slate-600 font-bold text-xs sm:text-sm italic">
          Nápověda: „${act.hint}“
        </p>

        <!-- MOŽNOSTI VÝBĚRU -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-1">
          ${quiz.options.map(opt => `
            <button onclick="evaluateTimeQuizAnswer('${opt.text.replace(/'/g, "\\'")}')" class="game-button py-3.5 px-3 rounded-2xl bg-white border-3 border-amber-300 hover:border-amber-500 text-amber-950 font-black text-sm sm:text-base shadow-md transition-all flex items-center justify-center text-center">
              ${opt.text}
            </button>
          `).join('')}
        </div>

      </div>

    </div>
  `;
}

function generateNewTimeQuizQuestion() {
  const db = timeImaginationDatabase;
  const correct = db[Math.floor(Math.random() * db.length)];
  
  let optionsSet = [correct];
  while (optionsSet.length < 3) {
    const rand = db[Math.floor(Math.random() * db.length)];
    if (!optionsSet.some(o => o.text === rand.text)) {
      optionsSet.push(rand);
    }
  }

  clockState.timeQuiz.currentActivity = correct;
  clockState.timeQuiz.options = shuffleArray(optionsSet);
}

function evaluateTimeQuizAnswer(selectedText) {
  const quiz = clockState.timeQuiz;
  if (selectedText === quiz.currentActivity.text) {
    playCustomSuccessSound();
    triggerConfetti();
    quiz.score++;
    
    if (quiz.score >= 10) {
      if (typeof state !== 'undefined') {
        state.goldDiamonds = (state.goldDiamonds || 0) + 1;
        if (typeof saveState === 'function') saveState();
        if (typeof updateBalanceUI === 'function') updateBalanceUI();
      }
      alertUserFeedback('🎉 ÚŽASNÉ! Zvládl jsi 10 správných odpovědí a získáváš +1 Modrý Diamant! 💎');
      quiz.score = 0;
    } else {
      alertUserFeedback('Správně! Úžasná představivost o čase! 🌟');
    }

    generateNewTimeQuizQuestion();
    renderClockSection();
  } else {
    soundError();
    alertUserFeedback('Tohle trvá jinak, zkuz to promyslet!');
  }
}

function formatDurationText(sec) {
  if (sec < 60) return `${sec} sekund`;
  const mins = Math.round(sec / 60);
  if (mins < 60) {
    if (mins === 30) return "půl hodiny (30 minut)";
    return `${mins} minut`;
  }
  const hours = Math.round(mins / 60);
  if (hours === 1) return "1 hodina";
  if (hours >= 2 && hours <= 4) return `${hours} hodiny`;
  return `${hours} hodin`;
}

function cleanupHeaderDots() {
  const headers = document.querySelectorAll('header, div');
  headers.forEach(el => {
    if (el.innerHTML && el.innerHTML.includes('......')) {
      el.innerHTML = el.innerHTML.replace(/\.{3,}/g, '');
    }
  });
}

function switchClockDisplayType(type) {
  clockState.displayType = type;
  const btnAnalog = document.getElementById('display-type-btn-analog');
  const btnDigital = document.getElementById('display-type-btn-digital');

  if (type === 'digital') {
    btnDigital.className = 'py-1.5 px-3 rounded-lg font-black text-xs transition-all bg-amber-500 text-white shadow-sm';
    btnAnalog.className = 'py-1.5 px-3 rounded-lg font-black text-xs transition-all text-slate-700 hover:bg-amber-100';
  } else {
    btnAnalog.className = 'py-1.5 px-3 rounded-lg font-black text-xs transition-all bg-amber-500 text-white shadow-sm';
    btnDigital.className = 'py-1.5 px-3 rounded-lg font-black text-xs transition-all text-slate-700 hover:bg-amber-100';
  }

  playTone(520, 0.08, 'sine', 0.15);
  updateClockDisplayArea();
}

function updateClockDisplayArea() {
  const mainBox = document.getElementById('clock-display-main-box');
  if (!mainBox) return;

  if (clockState.displayType === 'digital') {
    mainBox.innerHTML = `
      <div class="flex flex-col items-center justify-center p-3.5 sm:p-4 bg-slate-900 border-4 border-amber-400 rounded-2xl shadow-lg select-none">
        <span class="text-[11px] font-black tracking-widest text-amber-400 uppercase mb-1">Digitální čas (24h)</span>
        <div class="text-5xl sm:text-6xl font-black font-mono text-emerald-400 tracking-wider drop-shadow-[0_0_20px_rgba(52,211,153,0.7)] px-4 py-2">
          ${String(clockState.targetHour).padStart(2, '0')}:${String(clockState.targetMinute).padStart(2, '0')}
        </div>
      </div>
      <div class="flex flex-col items-center justify-center bg-amber-50/80 p-3 rounded-2xl border-2 border-amber-300 shadow-inner">
        <span class="text-[11px] font-black text-amber-900 uppercase mb-1">💡 Srovnání na ručičkách</span>
        <div class="relative w-44 h-44 sm:w-52 sm:h-52 bg-gradient-to-tr from-amber-50 to-white border-4 border-amber-400 rounded-full shadow-md flex items-center justify-center select-none">
          ${generateClockSvgMarkup(clockState.targetHour, clockState.targetMinute)}
        </div>
      </div>
    `;
  } else {
    mainBox.innerHTML = `
      <div class="relative w-52 h-52 sm:w-60 sm:h-60 md:w-[245px] md:h-[245px] bg-gradient-to-tr from-amber-50 to-white border-5 border-amber-400 rounded-full shadow-lg flex items-center justify-center my-0.5 select-none" id="clock-face-container">
        ${generateClockSvgMarkup(clockState.targetHour, clockState.targetMinute)}
      </div>
    `;
  }
}

function switchClockGameMode(mode) {
  clockState.gameMode = mode;
  clockState.sharpScore = 0;
  updateGameModeUI();
  playTone(550, 0.1, 'sine', 0.2);
  generateNewClockTask();
}

function updateGameModeUI() {
  const btnTraining = document.getElementById('clock-mode-game-training');
  const btnSharp = document.getElementById('clock-mode-game-sharp');
  const counterBadge = document.getElementById('sharp-counter-badge');

  if (clockState.gameMode === 'sharp') {
    if (btnSharp) btnSharp.className = 'py-1.5 px-2 rounded-xl transition-all bg-purple-600 text-white shadow-sm text-center text-xs';
    if (btnTraining) btnTraining.className = 'py-1.5 px-2 rounded-xl transition-all text-purple-900 hover:bg-purple-100 text-center text-xs';
    if (counterBadge) {
      counterBadge.classList.remove('hidden');
      counterBadge.textContent = `Splněno: ${clockState.sharpScore} / 10`;
    }
  } else {
    if (btnTraining) btnTraining.className = 'py-1.5 px-2 rounded-xl transition-all bg-indigo-600 text-white shadow-sm text-center text-xs';
    if (btnSharp) btnSharp.className = 'py-1.5 px-2 rounded-xl transition-all text-purple-900 hover:bg-purple-100 text-center text-xs';
    if (counterBadge) counterBadge.classList.add('hidden');
  }
}

function switchTimeFilter(filterKey) {
  clockState.timeFilter = filterKey;
  const filters = ['all', 'morning', 'forenoon', 'afternoon', 'evening', 'night'];
  
  filters.forEach(f => {
    const btn = document.getElementById(`filter-btn-${f}`);
    if (btn) {
      if (f === filterKey) {
        btn.className = 'py-1.5 px-3 rounded-xl bg-sky-600 text-white shadow-sm transition-all text-xs font-black text-center';
      } else {
        btn.className = 'py-1.5 px-2 rounded-xl bg-white text-slate-700 hover:bg-sky-100 transition-all text-xs font-black text-center';
      }
    }
  });

  playTone(500, 0.08, 'sine', 0.15);
  generateNewClockTask();
}

function updateClockModeVisibility() {
  const toggleContainer = document.getElementById('clock-mode-toggle-container');
  const modeLabel = document.getElementById('clock-mode-label');
  const btnBasic = document.getElementById('clock-mode-btn-basic');
  const btnAdvanced = document.getElementById('clock-mode-btn-advanced');

  if (clockState.currentSubLevel === 1 || clockState.currentSubLevel === 4) {
    if (toggleContainer) toggleContainer.classList.add('hidden');
  } else {
    if (toggleContainer) toggleContainer.classList.remove('hidden');
    if (clockState.currentSubLevel === 2) {
      if (modeLabel) modeLabel.textContent = 'Velká ručička:';
      if (btnBasic) btnBasic.textContent = 'Čtvrt / Půl';
      if (btnAdvanced) btnAdvanced.textContent = 'Minuty';
    } else {
      if (modeLabel) modeLabel.textContent = 'Kombinace:';
      if (btnBasic) btnBasic.textContent = 'Základní';
      if (btnAdvanced) btnAdvanced.textContent = 'Minuty';
    }
  }
}

function switchClockMode(mode) {
  clockState.subMode = mode;
  const btnBasic = document.getElementById('clock-mode-btn-basic');
  const btnAdvanced = document.getElementById('clock-mode-btn-advanced');

  if (mode === 'basic') {
    btnBasic.className = 'py-1.5 px-2 rounded-xl transition-all bg-amber-500 text-white shadow-sm text-center text-xs';
    btnAdvanced.className = 'py-1.5 px-2 rounded-xl transition-all text-amber-900 hover:bg-amber-100 text-center text-xs';
  } else {
    btnAdvanced.className = 'py-1.5 px-2 rounded-xl transition-all bg-amber-500 text-white shadow-sm text-center text-xs';
    btnBasic.className = 'py-1.5 px-2 rounded-xl transition-all text-amber-900 hover:bg-amber-100 text-center text-xs';
  }

  playTone(520, 0.08, 'sine', 0.15);
  generateNewClockTask();
}

function switchClockSubLevel(lvl) {
  clockState.currentSubLevel = lvl;
  clockState.subMode = 'basic';
  clockState.sharpScore = 0;

  playTone(500, 0.08, 'sine', 0.15);
  renderClockSection();
}

function getDayContextConfig(hour) {
  if (hour >= 5 && hour <= 9) return { emoji: '🌅', label: 'RÁNO', bg: 'bg-amber-100 text-amber-950 border-amber-300' };
  if (hour >= 10 && hour <= 11) return { emoji: '☀️', label: 'DOPOLEDNE', bg: 'bg-sky-100 text-sky-950 border-sky-300' };
  if (hour === 12) return { emoji: '🕛', label: 'POLEDNE', bg: 'bg-yellow-100 text-yellow-950 border-yellow-300' };
  if (hour >= 13 && hour <= 17) return { emoji: '🌤️', label: 'ODPOLEDNE', bg: 'bg-emerald-100 text-emerald-950 border-emerald-300' };
  if (hour >= 18 && hour <= 21) return { emoji: '🌆', label: 'VEČER', bg: 'bg-indigo-100 text-indigo-950 border-indigo-300' };
  return { emoji: '🌙', label: 'NOC', bg: 'bg-purple-100 text-purple-950 border-purple-300' };
}

function getRandomHourByFilter(filterKey) {
  let allowedHours = [];
  switch (filterKey) {
    case 'morning': allowedHours = [5, 6, 7, 8, 9]; break;
    case 'forenoon': allowedHours = [10, 11]; break;
    case 'afternoon': allowedHours = [12, 13, 14, 15, 16, 17]; break;
    case 'evening': allowedHours = [18, 19, 20, 21]; break;
    case 'night': allowedHours = [22, 23, 0, 1, 2, 3, 4]; break;
    default: allowedHours = Array.from({length: 24}, (_, i) => i); break;
  }
  return allowedHours[Math.floor(Math.random() * allowedHours.length)];
}

function generateNewClockTask() {
  if (clockState.currentSubLevel === 4) return;

  const sub = clockState.currentSubLevel;
  const mode = clockState.subMode;
  let h = 12;
  let m = 0;

  if (sub === 1) {
    h = getRandomHourByFilter(clockState.timeFilter);
    m = 0;
  } else if (sub === 2) {
    h = getRandomHourByFilter(clockState.timeFilter);
    if (mode === 'basic') {
      m = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    } else {
      m = Math.floor(Math.random() * 60);
    }
  } else {
    h = getRandomHourByFilter(clockState.timeFilter);
    if (mode === 'basic') {
      m = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    } else {
      m = Math.floor(Math.random() * 60);
    }
  }

  clockState.targetHour = h;
  clockState.targetMinute = m;
  clockState.isAnswerChecked = false;

  clockState.correctAnswer = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const pill = document.getElementById('clock-context-pill');
  if (pill) {
    const ctx = getDayContextConfig(h);
    pill.innerHTML = `<span class="text-xl sm:text-2xl">${ctx.emoji}</span> <span class="tracking-wider">${ctx.label}</span>`;
    pill.className = `inline-flex items-center gap-2 text-sm sm:text-base font-black px-5 py-1.5 rounded-2xl border-2 shadow-sm ${ctx.bg}`;
  }

  let optionsSet = new Set([clockState.correctAnswer]);
  while (optionsSet.size < 3) {
    let randH = getRandomHourByFilter(clockState.timeFilter);
    let randM = (mode === 'basic') ? [0, 15, 30, 45][Math.floor(Math.random() * 4)] : Math.floor(Math.random() * 60);
    optionsSet.add(`${String(randH).padStart(2, '0')}:${String(randM).padStart(2, '0')}`);
  }

  clockState.options = shuffleArray(Array.from(optionsSet));
  
  updateClockDisplayArea();
  renderClockOptions();
}

function generateClockSvgMarkup(hour, minute) {
  const minuteAngle = minute * 6;
  const hourForAngle = hour % 12;
  const hourAngle = hourForAngle * 30 + minute * 0.5;

  let ticksMarkup = '';
  let innerNumbersMarkup = '';

  for (let i = 1; i <= 12; i++) {
    const angle = i * 30;
    
    ticksMarkup += `
      <g transform="rotate(${angle} 100 100)">
        <line x1="100" y1="7" x2="100" y2="15" stroke="#78350F" stroke-width="3" stroke-linecap="round"/>
        <text x="100" y="24" font-family="'Baloo 2', cursive" font-weight="900" font-size="15" fill="#78350F" text-anchor="middle" dominant-baseline="central" transform="rotate(-${angle} 100 ${24})">${i}</text>
      </g>
    `;

    const val24 = i === 12 ? '00' : (i + 12).toString();
    const innerAngleRad = ((angle - 90) * Math.PI) / 180;
    const cx = 100 + 44 * Math.cos(innerAngleRad);
    const cy = 100 + 44 * Math.sin(innerAngleRad);

    innerNumbersMarkup += `
      <text x="${cx}" y="${cy}" font-family="'Nunito', sans-serif" font-weight="900" font-size="11" fill="#0284c7" text-anchor="middle" dominant-baseline="central">${val24}</text>
    `;
  }

  let minuteTicks = '';
  for (let i = 0; i < 60; i++) {
    if (i % 5 !== 0) {
      const angle = i * 6;
      minuteTicks += `<line x1="100" y1="7" x2="100" y2="11" stroke="#B45309" stroke-width="1.5" transform="rotate(${angle} 100 100)" opacity="0.6"/>`;
    }
  }

  return `
    <svg class="w-full h-full" viewBox="0 0 200 200">
      ${minuteTicks}
      ${ticksMarkup}
      <g transform="rotate(${hourAngle} 100 100)">
        <rect x="96.5" y="66" width="7" height="35" rx="3.5" fill="#1E293B" stroke="#FFFFFF" stroke-width="1"/>
      </g>
      <g transform="rotate(${minuteAngle} 100 100)">
        <rect x="98.5" y="36" width="3" height="65" rx="1.5" fill="#0284C7" stroke="#FFFFFF" stroke-width="1"/>
      </g>
      <circle cx="100" cy="100" r="5.5" fill="#D97706" stroke="#FFFFFF" stroke-width="2"/>
      ${innerNumbersMarkup}
    </svg>
  `;
}

function renderClockOptions() {
  const container = document.getElementById('clock-options-container');
  if (!container) return;
  container.innerHTML = '';

  clockState.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'game-button py-2 px-3 rounded-2xl bg-white border-3 border-amber-300 hover:border-amber-500 text-amber-950 font-black text-xl sm:text-2xl shadow-md transition-all flex items-center justify-center';
    btn.textContent = opt;
    btn.onclick = () => evaluateClockAnswer(opt);
    container.appendChild(btn);
  });
}

function evaluateClockAnswer(selectedOpt) {
  if (clockState.isAnswerChecked) return;
  clockState.isAnswerChecked = true;

  if (selectedOpt === clockState.correctAnswer) {
    playCustomSuccessSound();
    triggerConfetti();

    if (clockState.gameMode === 'sharp') {
      clockState.sharpScore++;
      const counterBadge = document.getElementById('sharp-counter-badge');
      if (counterBadge) counterBadge.textContent = `Splněno: ${clockState.sharpScore} / 10`;

      if (clockState.sharpScore >= 10) {
        state.goldDiamonds = (state.goldDiamonds || 0) + 2;
        saveState();
        updateBalanceUI();

        state.history.unshift({
          id: Date.now(),
          time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString('cs-CZ'),
          type: 'sharp_clocks',
          minutes: 0,
          note: `Ostrá verze hodin (10/10): +2 diamanty 💎`
        });

        alertUserFeedback('🎉 ÚŽASNÉ! Zvládl jsi 10/10 a získáváš +2 Modré Diamanty! 💎💎');
        clockState.sharpScore = 0;
        updateGameModeUI();
      } else {
        alertUserFeedback(`Správně! (${clockState.sharpScore}/10) 🌟`);
      }
    } else {
      alertUserFeedback('Správně! Úžasná práce! 🌟');
    }
    
    setTimeout(() => {
      generateNewClockTask();
    }, 1400);
  } else {
    soundError();
    alertUserFeedback('Tohle nebylo úplně správně, zkus to znovu!');
    clockState.isAnswerChecked = false;
  }
}