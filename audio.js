/* ============================================================
   audio.js - Školácká Mise
   Zvukový modul:
   - Web Audio API syntezátor (Pikachu, fanfáry, Sonic ring, Minecraft XP)
   - Pedagogická česká výslovnost pro 1. třídu ZŠ (TTS)
   ============================================================ */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq = 440, duration = 0.1, type = 'sine', gainVal = 0.15) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

/* ============================================================
   OSLAVNÉ A TÉMATICKÉ ZVUKOVÉ BALÍČKY
   ============================================================ */

function playCustomSuccessSound() {
  const currentSound = (window.state && window.state.customizations) 
    ? window.state.customizations.activeSound 
    : 'sound-classic';
  playSoundById(currentSound);
}

function playSoundById(soundId) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (soundId === 'sound-pikachu-voice') {
      // Pikachu radostný výkřik: Pi (vysoko) - Ka (střed) - Chúúú (vzestupný pískot)
      playTone(880, 0.08, 'sine', 0.22); // Pi-
      setTimeout(() => playTone(660, 0.09, 'triangle', 0.25), 90); // Ka-
      setTimeout(() => {
        // -chúúú (plynule stoupající tón s lehkou modulací)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1450, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.28, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }, 200);

    } else if (soundId === 'sound-royal-fanfare') {
      // Slavnostní královská fanfára (C-dur: C5, E5, G5, C6 s dozněním)
      const notes = [
        { f: 523.25, d: 0.12, w: 'triangle', t: 0 },
        { f: 523.25, d: 0.10, w: 'triangle', t: 120 },
        { f: 659.25, d: 0.12, w: 'triangle', t: 240 },
        { f: 783.99, d: 0.15, w: 'triangle', t: 360 },
        { f: 1046.50, d: 0.35, w: 'sine', t: 500 }
      ];
      notes.forEach(n => {
        setTimeout(() => playTone(n.f, n.d, n.w, 0.24), n.t);
      });

    } else if (soundId === 'sound-sonic-ring') {
      // Křišťálový zvuk sebrání Sonicova zlatého prstenu (B5 -> E6 zvonivý dozvuk)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.45);

    } else if (soundId === 'sound-mc-level') {
      // Minecraft zkušenostní ding s rychlým kmitáním
      playTone(784, 0.08, 'triangle', 0.2);
      setTimeout(() => playTone(988, 0.08, 'triangle', 0.22), 70);
      setTimeout(() => playTone(1318, 0.35, 'sine', 0.28), 140);

    } else {
      // Výchozí čistý tříkrokový akord
      soundSuccess();
    }
  } catch (e) {
    soundSuccess();
  }
}

function soundSuccess() {
  playTone(523.25, 0.1, 'triangle', 0.2);
  setTimeout(() => playTone(659.25, 0.1, 'triangle', 0.2), 100);
  setTimeout(() => playTone(783.99, 0.2, 'triangle', 0.25), 200);
}

function soundError() {
  playTone(250, 0.12, 'sawtooth', 0.2);
  setTimeout(() => playTone(180, 0.2, 'sawtooth', 0.2), 120);
}

function soundShuffle() {
  playTone(400, 0.08, 'sine', 0.15);
  setTimeout(() => playTone(300, 0.08, 'sine', 0.15), 60);
}

function soundPurchase() {
  playTone(587.33, 0.08, 'square', 0.15);
  setTimeout(() => playTone(880.00, 0.2, 'triangle', 0.25), 100);
}

function soundChestOpening() {
  for (let i = 0; i < 4; i++) {
    setTimeout(() => playTone(300 + i * 80, 0.09, 'sawtooth', 0.15), i * 140);
  }
}

/* ============================================================
   ČESKÁ VÝUKOVÁ VÝSLOVNOST (TTS)
   ============================================================ */

function sanitizeForCzechPedagogicalTTS(text) {
  if (!text) return '';
  let clean = text.trim();
  if (clean.includes(' ')) return clean.toLowerCase();

  if (clean.length === 1) {
    const singleLetterSounds = {
      'A': 'á', 'Á': 'á', 'B': 'bé', 'C': 'cé', 'Č': 'čé',
      'D': 'dé', 'Ď': 'ďé', 'E': 'é', 'É': 'é', 'Ě': 'je',
      'F': 'ef', 'G': 'gé', 'H': 'há', 'CH': 'chá', 'I': 'í',
      'Í': 'í', 'J': 'jé', 'K': 'ká', 'L': 'el', 'M': 'em',
      'N': 'en', 'Ň': 'eň', 'O': 'ó', 'Ó': 'ó', 'P': 'pé',
      'Q': 'kvé', 'R': 'er', 'Ř': 'eř', 'S': 'es', 'Š': 'eš',
      'T': 'té', 'Ť': 'ťé', 'U': 'ú', 'Ú': 'ú', 'Ů': 'ú',
      'V': 'vé', 'W': 'dvojité vé', 'X': 'iks', 'Y': 'ypsilon',
      'Ý': 'dlouhé ypsilon', 'Z': 'zet', 'Ž': 'žet'
    };
    const u = clean.toUpperCase();
    return singleLetterSounds[u] || clean.toLowerCase();
  }

  let phonetic = clean.toLowerCase();
  phonetic = phonetic.replace(/ů/g, 'ú');
  phonetic = phonetic
    .replace(/^dě/, 'ďe')
    .replace(/^tě/, 'ťe')
    .replace(/^ně/, 'ňe')
    .replace(/^di/, 'ďi')
    .replace(/^ti/, 'ťi')
    .replace(/^ni/, 'ňi')
    .replace(/^dí/, 'ďí')
    .replace(/^tí/, 'ťí')
    .replace(/^ní/, 'ňí');

  return phonetic;
}

function speakCzechWordWithCallback(text, rateModifier = 0.8, onEndCallback = null) {
  if (!('speechSynthesis' in window)) {
    if (onEndCallback) setTimeout(onEndCallback, 600);
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const speechText = sanitizeForCzechPedagogicalTTS(text);
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'cs-CZ';
    utterance.rate = rateModifier; 
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const czechVoice = voices.find(v => v.lang.startsWith('cs') || v.lang.includes('Czech') || v.lang.includes('cs_CZ'));
    if (czechVoice) utterance.voice = czechVoice;

    let handled = false;
    utterance.onend = () => {
      if (!handled) { handled = true; if (onEndCallback) onEndCallback(); }
    };
    utterance.onerror = () => {
      if (!handled) { handled = true; if (onEndCallback) onEndCallback(); }
    };
    window.speechSynthesis.speak(utterance);
    setTimeout(() => { if (!handled) { handled = true; if (onEndCallback) onEndCallback(); } }, 2500);
  } catch (e) {
    if (onEndCallback) onEndCallback();
  }
}

function speakCzechWord(text, rateModifier = 0.8) {
  speakCzechWordWithCallback(text, rateModifier, null);
}