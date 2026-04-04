/**
 * Chess.com-style move sounds using pre-rendered AudioBuffers.
 *
 * Each sound is rendered once via OfflineAudioContext (layered noise bursts +
 * tonal body) and cached. Playback is instant via a shared AudioContext.
 */

let ctx = null
const cache = {}
let ready = false
let initPromise = null

function getCtx() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/* ---------- helpers for offline rendering ---------- */

function noise(offline, dur) {
  const len = offline.sampleRate * dur
  const buf = offline.createBuffer(1, len, offline.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return buf
}

async function render(duration, fn) {
  const sr = 44100
  const offline = new OfflineAudioContext(1, sr * duration, sr)
  fn(offline, duration)
  return offline.startRendering()
}

/* ---------- individual sound recipes ---------- */

// Move — short wooden "thock", piece placed on board
function buildMove(off, dur) {
  // Layer 1: filtered noise impact
  const n1 = off.createBufferSource()
  n1.buffer = noise(off, dur)
  const bp1 = off.createBiquadFilter()
  bp1.type = 'bandpass'
  bp1.frequency.value = 1100
  bp1.Q.value = 1.2
  const g1 = off.createGain()
  g1.gain.setValueAtTime(0.55, 0)
  g1.gain.exponentialRampToValueAtTime(0.001, 0.06)
  n1.connect(bp1).connect(g1).connect(off.destination)
  n1.start(0)

  // Layer 2: low-mid body thump
  const o1 = off.createOscillator()
  o1.type = 'sine'
  o1.frequency.setValueAtTime(480, 0)
  o1.frequency.exponentialRampToValueAtTime(200, 0.04)
  const g2 = off.createGain()
  g2.gain.setValueAtTime(0.3, 0)
  g2.gain.exponentialRampToValueAtTime(0.001, 0.045)
  o1.connect(g2).connect(off.destination)
  o1.start(0)

  // Layer 3: high-freq click transient
  const n2 = off.createBufferSource()
  n2.buffer = noise(off, dur)
  const hp = off.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 3000
  const g3 = off.createGain()
  g3.gain.setValueAtTime(0.2, 0)
  g3.gain.exponentialRampToValueAtTime(0.001, 0.015)
  n2.connect(hp).connect(g3).connect(off.destination)
  n2.start(0)
}

// Capture — louder, crunchier hit, two pieces colliding
function buildCapture(off, dur) {
  // Layer 1: wide-band impact
  const n1 = off.createBufferSource()
  n1.buffer = noise(off, dur)
  const bp1 = off.createBiquadFilter()
  bp1.type = 'bandpass'
  bp1.frequency.value = 700
  bp1.Q.value = 0.7
  const g1 = off.createGain()
  g1.gain.setValueAtTime(0.8, 0)
  g1.gain.exponentialRampToValueAtTime(0.01, 0.09)
  g1.gain.exponentialRampToValueAtTime(0.001, dur)
  n1.connect(bp1).connect(g1).connect(off.destination)
  n1.start(0)

  // Layer 2: bass body
  const o1 = off.createOscillator()
  o1.type = 'sine'
  o1.frequency.setValueAtTime(350, 0)
  o1.frequency.exponentialRampToValueAtTime(120, 0.06)
  const g2 = off.createGain()
  g2.gain.setValueAtTime(0.45, 0)
  g2.gain.exponentialRampToValueAtTime(0.001, 0.07)
  o1.connect(g2).connect(off.destination)
  o1.start(0)

  // Layer 3: second impact (piece knocked over feel)
  const n2 = off.createBufferSource()
  n2.buffer = noise(off, dur)
  const bp2 = off.createBiquadFilter()
  bp2.type = 'bandpass'
  bp2.frequency.value = 1300
  bp2.Q.value = 1.5
  const g3 = off.createGain()
  g3.gain.setValueAtTime(0.001, 0)
  g3.gain.setValueAtTime(0.35, 0.02)
  g3.gain.exponentialRampToValueAtTime(0.001, 0.07)
  n2.connect(bp2).connect(g3).connect(off.destination)
  n2.start(0)

  // Layer 4: high click
  const n3 = off.createBufferSource()
  n3.buffer = noise(off, dur)
  const hp = off.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 4000
  const g4 = off.createGain()
  g4.gain.setValueAtTime(0.25, 0)
  g4.gain.exponentialRampToValueAtTime(0.001, 0.012)
  n3.connect(hp).connect(g4).connect(off.destination)
  n3.start(0)
}

// Check — move sound + metallic ring
function buildCheck(off, dur) {
  // Base move sound
  buildMove(off, dur)

  // Metallic ring overtone
  const o1 = off.createOscillator()
  o1.type = 'sine'
  o1.frequency.value = 1800
  const g1 = off.createGain()
  g1.gain.setValueAtTime(0.12, 0.01)
  g1.gain.exponentialRampToValueAtTime(0.001, 0.18)
  o1.connect(g1).connect(off.destination)
  o1.start(0)

  const o2 = off.createOscillator()
  o2.type = 'sine'
  o2.frequency.value = 2700
  const g2 = off.createGain()
  g2.gain.setValueAtTime(0.06, 0.01)
  g2.gain.exponentialRampToValueAtTime(0.001, 0.12)
  o2.connect(g2).connect(off.destination)
  o2.start(0)
}

// Castle — two rapid wooden clicks
function buildCastle(off, dur) {
  // First click (king)
  const n1 = off.createBufferSource()
  n1.buffer = noise(off, dur)
  const bp1 = off.createBiquadFilter()
  bp1.type = 'bandpass'
  bp1.frequency.value = 1000
  bp1.Q.value = 1.2
  const g1 = off.createGain()
  g1.gain.setValueAtTime(0.5, 0)
  g1.gain.exponentialRampToValueAtTime(0.001, 0.05)
  n1.connect(bp1).connect(g1).connect(off.destination)
  n1.start(0)

  const o1 = off.createOscillator()
  o1.type = 'sine'
  o1.frequency.setValueAtTime(450, 0)
  o1.frequency.exponentialRampToValueAtTime(200, 0.035)
  const g1b = off.createGain()
  g1b.gain.setValueAtTime(0.25, 0)
  g1b.gain.exponentialRampToValueAtTime(0.001, 0.04)
  o1.connect(g1b).connect(off.destination)
  o1.start(0)

  // Second click (rook) — delayed 90ms
  const delay = 0.09
  const n2 = off.createBufferSource()
  n2.buffer = noise(off, dur)
  const bp2 = off.createBiquadFilter()
  bp2.type = 'bandpass'
  bp2.frequency.value = 1200
  bp2.Q.value = 1.3
  const g2 = off.createGain()
  g2.gain.setValueAtTime(0.001, 0)
  g2.gain.setValueAtTime(0.45, delay)
  g2.gain.exponentialRampToValueAtTime(0.001, delay + 0.05)
  n2.connect(bp2).connect(g2).connect(off.destination)
  n2.start(0)

  const o2 = off.createOscillator()
  o2.type = 'sine'
  o2.frequency.setValueAtTime(520, delay)
  o2.frequency.exponentialRampToValueAtTime(220, delay + 0.035)
  const g2b = off.createGain()
  g2b.gain.setValueAtTime(0.001, 0)
  g2b.gain.setValueAtTime(0.22, delay)
  g2b.gain.exponentialRampToValueAtTime(0.001, delay + 0.04)
  o2.connect(g2b).connect(off.destination)
  o2.start(0)
}

// Game end — low resonant tone
function buildGameEnd(off, dur) {
  const o1 = off.createOscillator()
  o1.type = 'sine'
  o1.frequency.value = 300
  const g1 = off.createGain()
  g1.gain.setValueAtTime(0.2, 0)
  g1.gain.exponentialRampToValueAtTime(0.001, dur)
  o1.connect(g1).connect(off.destination)
  o1.start(0)

  const o2 = off.createOscillator()
  o2.type = 'sine'
  o2.frequency.value = 450
  const g2 = off.createGain()
  g2.gain.setValueAtTime(0.15, 0.05)
  g2.gain.exponentialRampToValueAtTime(0.001, dur)
  o2.connect(g2).connect(off.destination)
  o2.start(0)

  const n = off.createBufferSource()
  n.buffer = noise(off, dur)
  const lp = off.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 500
  const g3 = off.createGain()
  g3.gain.setValueAtTime(0.15, 0)
  g3.gain.exponentialRampToValueAtTime(0.001, 0.15)
  n.connect(lp).connect(g3).connect(off.destination)
  n.start(0)
}

// Puzzle correct — bright ascending chime
function buildPuzzleCorrect(off, dur) {
  const notes = [523, 659, 784] // C5, E5, G5
  notes.forEach((freq, i) => {
    const t = i * 0.07
    const o = off.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq
    const g = off.createGain()
    g.gain.setValueAtTime(0.001, 0)
    g.gain.setValueAtTime(0.18, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    o.connect(g).connect(off.destination)
    o.start(0)
  })
}

// Puzzle wrong — short low buzz
function buildPuzzleWrong(off, dur) {
  const o1 = off.createOscillator()
  o1.type = 'sawtooth'
  o1.frequency.value = 180
  const g1 = off.createGain()
  g1.gain.setValueAtTime(0.2, 0)
  g1.gain.exponentialRampToValueAtTime(0.001, 0.18)
  const lp = off.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 600
  o1.connect(lp).connect(g1).connect(off.destination)
  o1.start(0)
}

// Puzzle solved — triumphant two-note fanfare
function buildPuzzleSolved(off, dur) {
  const pairs = [[392, 0], [523, 0.12]] // G4, C5
  pairs.forEach(([freq, t]) => {
    const o = off.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq
    const g = off.createGain()
    g.gain.setValueAtTime(0.001, 0)
    g.gain.setValueAtTime(0.22, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
    o.connect(g).connect(off.destination)
    o.start(0)

    // Add harmonic shimmer
    const o2 = off.createOscillator()
    o2.type = 'sine'
    o2.frequency.value = freq * 2
    const g2 = off.createGain()
    g2.gain.setValueAtTime(0.001, 0)
    g2.gain.setValueAtTime(0.08, t)
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
    o2.connect(g2).connect(off.destination)
    o2.start(0)
  })
}

/* ---------- init + playback ---------- */

async function init() {
  cache.move = await render(0.12, buildMove)
  cache.capture = await render(0.18, buildCapture)
  cache.check = await render(0.25, buildCheck)
  cache.castle = await render(0.22, buildCastle)
  cache.gameEnd = await render(0.5, buildGameEnd)
  cache.puzzleCorrect = await render(0.35, buildPuzzleCorrect)
  cache.puzzleWrong = await render(0.25, buildPuzzleWrong)
  cache.puzzleSolved = await render(0.5, buildPuzzleSolved)
  ready = true
}

function play(name) {
  const c = getCtx()
  const buf = cache[name]
  if (!buf) return
  const src = c.createBufferSource()
  src.buffer = buf
  src.connect(c.destination)
  src.start()
}

function ensureInit() {
  if (ready) return Promise.resolve()
  if (!initPromise) initPromise = init()
  return initPromise
}

export function playPuzzleSound(type) {
  ensureInit().then(() => play(type))
}

export function playMoveSound(moveInfo) {
  if (!moveInfo) return

  ensureInit().then(() => {
    const san = moveInfo.san || ''

    if (san.includes('#')) {
      play('capture')
      setTimeout(() => play('gameEnd'), 120)
    } else if (san.includes('+')) {
      play('check')
    } else if (moveInfo.captured) {
      play('capture')
    } else if (san === 'O-O' || san === 'O-O-O') {
      play('castle')
    } else {
      play('move')
    }
  })
}
