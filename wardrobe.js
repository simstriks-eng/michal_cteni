/* ============================================================
   wardrobe.js - Školácká Mise
   Modul pro 3D šatník a knihovnu odemčeného obsahu:
   - 3D otáčení avatara kolem osy Y (drag / touch / tlačítka)
   - Správa a okamžité nasazení vlastněných skinů, tapet a zvuků
   ============================================================ */

let wardrobeState = {
  activeTab: 'skins',
  rotationY: 0,
  isDragging: false,
  startX: 0,
  previewSkinId: null
};

function openWardrobeModal() {
  const modal = document.getElementById('player-skin-modal');
  if (!modal) return;

  wardrobeState.activeTab = 'skins';
  wardrobeState.rotationY = 0;
  wardrobeState.previewSkinId = (window.state && window.state.customizations) 
    ? window.state.customizations.activeSkin 
    : 'steve';

  updateWardrobe3DPreview();
  renderWardrobeGrid();
  initWardrobe3DDragEvents();

  modal.classList.remove('hidden');
  if (typeof playTone === 'function') playTone(540, 0.08, 'sine', 0.15);
}

function closeWardrobeModal() {
  const modal = document.getElementById('player-skin-modal');
  if (modal) modal.classList.add('hidden');
}

function switchWardrobeTab(tabKey) {
  wardrobeState.activeTab = tabKey;

  const btnSkins = document.getElementById('wardrobe-tab-skins');
  const btnThemes = document.getElementById('wardrobe-tab-themes');
  const btnSounds = document.getElementById('wardrobe-tab-sounds');
  const catPill = document.getElementById('wardrobe-active-category-pill');

  [btnSkins, btnThemes, btnSounds].forEach(b => {
    if (b) b.className = 'flex-1 py-1.5 px-2 rounded-xl font-black text-xs transition-all text-slate-700 hover:bg-white flex items-center justify-center gap-1';
  });

  if (tabKey === 'themes') {
    if (btnThemes) btnThemes.className = 'flex-1 py-1.5 px-2 rounded-xl font-black text-xs transition-all bg-indigo-600 text-white shadow-sm flex items-center justify-center gap-1';
    if (catPill) catPill.textContent = 'Tapeta Světa';
  } else if (tabKey === 'sounds') {
    if (btnSounds) btnSounds.className = 'flex-1 py-1.5 px-2 rounded-xl font-black text-xs transition-all bg-indigo-600 text-white shadow-sm flex items-center justify-center gap-1';
    if (catPill) catPill.textContent = 'Oslavný Zvuk';
  } else {
    if (btnSkins) btnSkins.className = 'flex-1 py-1.5 px-2 rounded-xl font-black text-xs transition-all bg-indigo-600 text-white shadow-sm flex items-center justify-center gap-1';
    if (catPill) catPill.textContent = 'Skin Avatara';
  }

  renderWardrobeGrid();
  if (typeof playTone === 'function') playTone(520, 0.08, 'sine', 0.12);
}

function renderWardrobeGrid() {
  const grid = document.getElementById('wardrobe-items-grid');
  if (!grid || !window.state) return;
  grid.innerHTML = '';

  const custom = window.state.customizations || DEFAULT_UNLOCKED_CUSTOMIZATIONS;

  if (wardrobeState.activeTab === 'skins') {
    AVATAR_SKINS_DATABASE.forEach(skin => {
      const isUnlocked = custom.unlockedSkins.includes(skin.id);
      const isActive = custom.activeSkin === skin.id;

      const card = document.createElement('div');
      card.className = `p-2.5 rounded-2xl border-3 flex flex-col items-center justify-between text-center transition-all ${
        isActive 
          ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300 shadow-md' 
          : isUnlocked 
            ? 'bg-white border-indigo-200 hover:border-indigo-400 cursor-pointer hover:scale-102' 
            : 'bg-slate-100 border-dashed border-slate-300 opacity-50 cursor-not-allowed'
      }`;

      card.onclick = () => {
        wardrobeState.previewSkinId = skin.id;
        updateWardrobe3DPreview();
        if (isUnlocked) {
          equipSkinDirect(skin.id);
        } else {
          if (typeof soundShuffle === 'function') soundShuffle();
        }
      };

      card.innerHTML = `
        <div class="w-12 h-12 flex items-center justify-center mb-1">
          ${skin.svg}
        </div>
        <h5 class="text-xs font-black text-slate-800 truncate w-full">${skin.name.split(' ')[0]}</h5>
        <div class="mt-1 w-full">
          ${isActive 
            ? `<span class="text-[9px] font-black uppercase text-amber-800 bg-amber-200/90 px-2 py-0.5 rounded-lg block">Nasazeno ⭐</span>`
            : isUnlocked 
              ? `<span class="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg block">Nasadit 👍</span>`
              : `<span class="text-[9px] font-black uppercase text-slate-400 bg-slate-200 px-2 py-0.5 rounded-lg block">V Obchodě 🔒</span>`
          }
        </div>
      `;
      grid.appendChild(card);
    });

  } else if (wardrobeState.activeTab === 'themes') {
    APP_THEMES_DATABASE.forEach(theme => {
      const isUnlocked = custom.unlockedThemes.includes(theme.id);
      const isActive = custom.activeTheme === theme.id;

      const card = document.createElement('div');
      card.className = `p-2.5 rounded-2xl border-3 flex flex-col items-center justify-between text-center transition-all ${
        isActive 
          ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300 shadow-md' 
          : isUnlocked 
            ? 'bg-white border-indigo-200 hover:border-indigo-400 cursor-pointer hover:scale-102' 
            : 'bg-slate-100 border-dashed border-slate-300 opacity-50 cursor-not-allowed'
      }`;

      card.onclick = () => {
        if (isUnlocked) {
          equipThemeDirect(theme.id);
        } else {
          if (typeof soundShuffle === 'function') soundShuffle();
        }
      };

      card.innerHTML = `
        <div class="w-full h-10 rounded-xl mb-1 shadow-inner border border-black/10 flex items-center justify-center text-[10px] font-black text-white" style="background: ${theme.previewGradient};">
          Svět
        </div>
        <h5 class="text-xs font-black text-slate-800 truncate w-full">${theme.name.split(' ')[0]}</h5>
        <div class="mt-1 w-full">
          ${isActive 
            ? `<span class="text-[9px] font-black uppercase text-amber-800 bg-amber-200/90 px-2 py-0.5 rounded-lg block">Aktivní 🌍</span>`
            : isUnlocked 
              ? `<span class="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg block">Nastavit 👍</span>`
              : `<span class="text-[9px] font-black uppercase text-slate-400 bg-slate-200 px-2 py-0.5 rounded-lg block">V Obchodě 🔒</span>`
          }
        </div>
      `;
      grid.appendChild(card);
    });

  } else if (wardrobeState.activeTab === 'sounds') {
    SOUND_PACKS_DATABASE.forEach(snd => {
      const isUnlocked = custom.unlockedSounds.includes(snd.id);
      const isActive = custom.activeSound === snd.id;

      const card = document.createElement('div');
      card.className = `p-2.5 rounded-2xl border-3 flex flex-col items-center justify-between text-center transition-all ${
        isActive 
          ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300 shadow-md' 
          : isUnlocked 
            ? 'bg-white border-indigo-200 hover:border-indigo-400 cursor-pointer hover:scale-102' 
            : 'bg-slate-100 border-dashed border-slate-300 opacity-50 cursor-not-allowed'
      }`;

      card.onclick = () => {
        if (isUnlocked) {
          equipSoundDirect(snd.id);
        } else {
          if (typeof soundShuffle === 'function') soundShuffle();
        }
      };

      card.innerHTML = `
        <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl mb-1">
          🔊
        </div>
        <h5 class="text-xs font-black text-slate-800 truncate w-full">${snd.name.split(' ')[0]}</h5>
        <div class="mt-1 w-full">
          ${isActive 
            ? `<span class="text-[9px] font-black uppercase text-amber-800 bg-amber-200/90 px-2 py-0.5 rounded-lg block">Aktivní 🔔</span>`
            : isUnlocked 
              ? `<span class="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg block">Zvolit 👍</span>`
              : `<span class="text-[9px] font-black uppercase text-slate-400 bg-slate-200 px-2 py-0.5 rounded-lg block">V Obchodě 🔒</span>`
          }
        </div>
      `;
      grid.appendChild(card);
    });
  }
}

function updateWardrobe3DPreview() {
  const container = document.getElementById('avatar-3d-object');
  const nameLabel = document.getElementById('wardrobe-preview-name');
  if (!container) return;

  const previewId = wardrobeState.previewSkinId || (window.state && window.state.customizations ? window.state.customizations.activeSkin : 'steve');
  const skin = AVATAR_SKINS_DATABASE.find(s => s.id === previewId) || AVATAR_SKINS_DATABASE[0];

  container.innerHTML = skin.svg;
  container.style.transform = `rotateY(${wardrobeState.rotationY}deg)`;
  if (nameLabel) nameLabel.textContent = skin.name;
}

function rotateAvatarPreview(deltaDeg) {
  wardrobeState.rotationY = (wardrobeState.rotationY + deltaDeg) % 360;
  const container = document.getElementById('avatar-3d-object');
  if (container) {
    container.style.transform = `rotateY(${wardrobeState.rotationY}deg)`;
  }
  if (typeof playTone === 'function') playTone(450, 0.05, 'sine', 0.1);
}

function initWardrobe3DDragEvents() {
  const viewport = document.getElementById('avatar-3d-viewport');
  if (!viewport || viewport.dataset.dragInit === 'true') return;
  viewport.dataset.dragInit = 'true';

  const onStart = (clientX) => {
    wardrobeState.isDragging = true;
    wardrobeState.startX = clientX;
  };

  const onMove = (clientX) => {
    if (!wardrobeState.isDragging) return;
    const deltaX = clientX - wardrobeState.startX;
    wardrobeState.rotationY = (wardrobeState.rotationY + deltaX * 1.5) % 360;
    wardrobeState.startX = clientX;
    const container = document.getElementById('avatar-3d-object');
    if (container) {
      container.style.transform = `rotateY(${wardrobeState.rotationY}deg)`;
    }
  };

  const onEnd = () => {
    wardrobeState.isDragging = false;
  };

  viewport.addEventListener('mousedown', (e) => onStart(e.clientX));
  window.addEventListener('mousemove', (e) => onMove(e.clientX));
  window.addEventListener('mouseup', onEnd);

  viewport.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) onStart(e.touches[0].clientX);
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) onMove(e.touches[0].clientX);
  }, { passive: true });
  window.addEventListener('touchend', onEnd);
}

function equipSkinDirect(skinId) {
  if (!window.state) return;
  window.state.customizations.activeSkin = skinId;
  wardrobeState.previewSkinId = skinId;
  if (typeof saveState === 'function') saveState();
  if (typeof updateTopAvatarDisplay === 'function') updateTopAvatarDisplay();
  updateWardrobe3DPreview();
  renderWardrobeGrid();
  if (typeof playTone === 'function') playTone(600, 0.1, 'sine', 0.15);
  if (typeof alertUserFeedback === 'function') alertUserFeedback('Skin nasazen!');
}

function equipThemeDirect(themeId) {
  if (!window.state) return;
  window.state.customizations.activeTheme = themeId;
  if (typeof applyCurrentTheme === 'function') applyCurrentTheme();
  if (typeof saveState === 'function') saveState();
  renderWardrobeGrid();
  if (typeof playTone === 'function') playTone(600, 0.1, 'sine', 0.15);
  if (typeof alertUserFeedback === 'function') alertUserFeedback('Herní svět nastaven!');
}

function equipSoundDirect(soundId) {
  if (!window.state) return;
  window.state.customizations.activeSound = soundId;
  if (typeof playSoundById === 'function') playSoundById(soundId);
  if (typeof saveState === 'function') saveState();
  renderWardrobeGrid();
  if (typeof alertUserFeedback === 'function') alertUserFeedback('Oslavný zvuk aktivován!');
}