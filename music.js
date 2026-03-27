// music.js — chiptune soundtrack via Web Audio API (no audio files)
// Uses a look-ahead scheduler for sample-accurate timing.

const Music = (() => {
  const BPM           = 132;
  const STEP          = (60 / BPM) / 4;   // 16th note in seconds
  const PATTERN_STEPS = 32;
  const LOOK_AHEAD    = 0.12;             // seconds to schedule ahead
  const TICK_INTERVAL = 25;              // scheduler poll interval (ms)

  let mCtx = null, masterGain = null;
  let timerID = null;
  let nextTime = 0, step = 0;

  // ── Shared audio context ─────────────────────────────────────────────────
  function ctx() {
    if (!mCtx) {
      mCtx       = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = mCtx.createGain();
      masterGain.gain.value = 0.32;
      masterGain.connect(mCtx.destination);
    }
    return mCtx;
  }

  // ── Frequency table (A minor pentatonic + root extensions) ───────────────
  const F = {
    _:0,
    E2:82.41, G2:98.00, A2:110.00,
    C3:130.81, D3:146.83, E3:164.81, G3:196.00, A3:220.00,
    C4:261.63, D4:293.66, E4:329.63, G4:392.00, A4:440.00,
    C5:523.25, D5:587.33, E5:659.25, G5:783.99, A5:880.00,
  };

  // ── 32-step patterns (two bars of 16th notes) ────────────────────────────
  //    Melody: "Datacenter Dash" — A minor feel, loops cleanly
  const MELODY = [
    F.A4, 0,    0,    0,     F.E5, 0,    F.D5, 0,
    F.C5, 0,    F.A4, 0,     F.G4, 0,    F.A4, 0,
    F.E5, 0,    0,    0,     F.D5, 0,    F.C5, 0,
    F.A4, 0,    0,    0,     F.A4, 0,    0,    0,
  ];

  //    Bass: root + fifth pumping on the beat
  const BASS = [
    F.A2, 0,    0,    F.A3,  0,    0,    0,    0,
    F.G2, 0,    0,    F.G3,  0,    0,    0,    0,
    F.A2, 0,    0,    F.A3,  0,    0,    0,    0,
    F.E2, 0,    0,    F.E3,  0,    0,    0,    0,
  ];

  //    Arp: 16th-note arpeggios filling the space
  const ARP = [
    F.A4, F.C5, F.E5, 0,     F.A4, F.C5, F.E5, 0,
    F.G4, F.A4, F.C5, 0,     F.G4, F.A4, F.C5, 0,
    F.A4, F.C5, F.E5, 0,     F.A4, F.E5, F.A5, 0,
    F.D4, F.A4, F.D5, 0,     F.A3, F.E4, F.A4, 0,
  ];

  //    Drums: K=kick, S=snare, H=hihat (encoded as strings for clarity)
  const DRUMS = [
    'K','_','H','_', '_','_','H','S', 'K','_','H','_', 'K','_','H','_',
    'K','_','H','_', '_','_','H','S', 'K','_','H','K', '_','_','H','_',
  ];

  // ── Voice generators ─────────────────────────────────────────────────────
  function square(freq, t, dur, vol) {
    if (!freq) return;
    const a = ctx(), osc = a.createOscillator(), g = a.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol * 0.6, t + dur * 0.5);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  function triangle(freq, t, dur, vol) {
    if (!freq) return;
    const a = ctx(), osc = a.createOscillator(), g = a.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  function kick(t) {
    const a = ctx(), osc = a.createOscillator(), g = a.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.14);
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(g); g.connect(masterGain);
    osc.start(t); osc.stop(t + 0.22);
  }

  function noise(t, dur, vol, hpfFreq = 0) {
    const a   = ctx();
    const len = Math.ceil(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource();
    src.buffer = buf;
    const g = a.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (hpfFreq) {
      const hpf = a.createBiquadFilter();
      hpf.type = 'highpass'; hpf.frequency.value = hpfFreq;
      src.connect(hpf); hpf.connect(g);
    } else {
      src.connect(g);
    }
    g.connect(masterGain);
    src.start(t); src.stop(t + dur);
  }

  // ── Step scheduler ────────────────────────────────────────────────────────
  function scheduleStep(s, t) {
    const i = s % PATTERN_STEPS;
    square(MELODY[i], t, STEP * 1.9, 0.11);
    square(BASS[i],   t, STEP * 1.6, 0.17);
    triangle(ARP[i],  t, STEP * 0.85, 0.07);
    const d = DRUMS[i];
    if (d === 'K') kick(t);
    if (d === 'S') noise(t, 0.14, 0.22);
    if (d === 'H') noise(t, 0.035, 0.07, 7000);
  }

  function scheduler() {
    const a = ctx();
    while (nextTime < a.currentTime + LOOK_AHEAD) {
      scheduleStep(step, nextTime);
      nextTime += STEP;
      step++;
    }
    timerID = setTimeout(scheduler, TICK_INTERVAL);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    start() {
      if (timerID) return;
      const a = ctx();
      if (a.state === 'suspended') a.resume();
      nextTime = a.currentTime + 0.08;
      step     = 0;
      scheduler();
    },

    stop() {
      if (timerID) { clearTimeout(timerID); timerID = null; }
    },

    setVolume(v) {
      if (masterGain) masterGain.gain.value = Math.max(0, v);
    },

    isPlaying() { return timerID !== null; },
  };
})();
