// Synthesized game sounds using Web Audio API — no external deps needed

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3, detune = 0) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playCoinSound() {
  playTone(880, 0.1, 'sine', 0.2);
  setTimeout(() => playTone(1174, 0.15, 'sine', 0.2), 80);
}

export function playUpgradeSound() {
  playTone(523, 0.1, 'triangle', 0.25);
  setTimeout(() => playTone(659, 0.1, 'triangle', 0.25), 100);
  setTimeout(() => playTone(784, 0.1, 'triangle', 0.25), 200);
  setTimeout(() => playTone(1047, 0.2, 'triangle', 0.2), 300);
}

export function playChallengeWinSound() {
  playTone(523, 0.12, 'square', 0.15);
  setTimeout(() => playTone(659, 0.12, 'square', 0.15), 100);
  setTimeout(() => playTone(784, 0.12, 'square', 0.15), 200);
  setTimeout(() => playTone(1047, 0.3, 'square', 0.12), 300);
  setTimeout(() => playTone(1318, 0.4, 'sine', 0.15), 400);
}

export function playChallengeLoseSound() {
  playTone(400, 0.2, 'sawtooth', 0.12);
  setTimeout(() => playTone(300, 0.2, 'sawtooth', 0.12), 150);
  setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.1), 300);
}

export function playButtonClick() {
  playTone(600, 0.05, 'sine', 0.1);
}

export function playAttackStart() {
  playTone(200, 0.15, 'sawtooth', 0.15);
  setTimeout(() => playTone(300, 0.1, 'sawtooth', 0.15), 100);
  setTimeout(() => playTone(500, 0.15, 'square', 0.1), 180);
}

export function playCollectReward() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => playTone(800 + i * 150, 0.1, 'sine', 0.15), i * 60);
  }
}

export function playDailyReward() {
  const notes = [523, 659, 784, 1047, 784, 1047, 1318];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.15, 'triangle', 0.18), i * 120);
  });
}

// Background music - ambient loop using Web Audio
let bgmNodes: { oscs: OscillatorNode[]; gain: GainNode } | null = null;
let bgmPlaying = false;

export function startBGM() {
  if (bgmPlaying) return;
  const ctx = getCtx();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.06;
  masterGain.connect(ctx.destination);

  const oscs: OscillatorNode[] = [];

  // Pad chord - Am7 (ambient Middle Eastern feel)
  const frequencies = [220, 261.63, 329.63, 392];
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = Math.random() * 6 - 3; // slight detuning for richness

    const oscGain = ctx.createGain();
    // Slow LFO-like volume modulation
    const period = 4 + i * 1.5;
    const now = ctx.currentTime;
    for (let t = 0; t < 600; t += period) {
      oscGain.gain.setValueAtTime(0.3, now + t);
      oscGain.gain.linearRampToValueAtTime(0.8, now + t + period / 2);
      oscGain.gain.linearRampToValueAtTime(0.3, now + t + period);
    }

    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start();
    oscs.push(osc);
  });

  bgmNodes = { oscs, gain: masterGain };
  bgmPlaying = true;
}

export function stopBGM() {
  if (!bgmNodes) return;
  const ctx = getCtx();
  bgmNodes.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
  const nodes = bgmNodes;
  setTimeout(() => {
    nodes.oscs.forEach(o => { try { o.stop(); } catch { return; } });
    nodes.gain.disconnect();
  }, 1100);
  bgmNodes = null;
  bgmPlaying = false;
}

export function toggleBGM(): boolean {
  if (bgmPlaying) {
    stopBGM();
    return false;
  } else {
    startBGM();
    return true;
  }
}

export function isBGMPlaying() {
  return bgmPlaying;
}
