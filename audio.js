// audio.js — procedural Web Audio sound effects (no files needed)

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null;
let muted = false;

function ensureAudio() {
  if (!actx) actx = new AudioCtx();
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

function tone(freq, dur, type = 'square', vol = 0.25, freqEnd = null, delayMs = 0) {
  if (muted) return;
  setTimeout(() => {
    try {
      const a   = ensureAudio();
      const osc = a.createOscillator();
      const gain = a.createGain();
      osc.connect(gain);
      gain.connect(a.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, a.currentTime);
      if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, a.currentTime + dur);
      gain.gain.setValueAtTime(vol, a.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      osc.start(a.currentTime);
      osc.stop(a.currentTime + dur);
    } catch (_) {}
  }, delayMs);
}

// ─── Sound events ─────────────────────────────────────────────────────────────

function sfxJump() {
  tone(280, 0.14, 'square', 0.18, 560);
}

function sfxLand() {
  tone(90, 0.07, 'square', 0.28, 45);
}

function sfxCollect() {
  tone(700, 0.06, 'sine', 0.18);
  tone(1050, 0.10, 'sine', 0.18, null, 60);
}

function sfxStomp() {
  tone(220, 0.05, 'square', 0.35, 60);
  tone(60,  0.12, 'square', 0.35, 30, 50);
}

function sfxDeath() {
  tone(380, 0.09, 'square', 0.28, 120);
  tone(200, 0.12, 'square', 0.25, 90,  90);
  tone(100, 0.18, 'square', 0.22, 50, 210);
}

function sfxGoal() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.22, null, i * 110));
}

function sfxPause() {
  tone(440, 0.06, 'sine', 0.12, 880);
}

// ─── Mute toggle ──────────────────────────────────────────────────────────────
function toggleMute() {
  muted = !muted;
  return muted;
}
