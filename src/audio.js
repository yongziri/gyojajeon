// ══════════════════════════════════════════════════════════════
//  8비트 칩튠 효과음 — Web Audio API 코드 생성 (외부 파일 0개)
//  ────────────────────────────────────────────────────────────
//  · NES 풍 square/triangle 파형 + ADSR envelope으로 SFX 8종 생성
//  · 외부 라이브러리 없음, 오프라인 동작, 라이선스 문제 없음
//  · 사용: window.SFX.play('click') 같이 호출
//  · 음소거: window.SFX.toggleMute()  (localStorage 저장)
//
//  지원 키: click, hover, evidence, success, fail, stage, send, talk
// ══════════════════════════════════════════════════════════════

(function () {
  if (typeof window === 'undefined') return;

  let ctx = null;       // AudioContext (사용자 입력 후 초기화)
  let muted = false;    // 음소거 상태 (localStorage 동기화)
  try {
    muted = localStorage.getItem('aral_muted') === '1';
  } catch (e) { /* ignored */ }

  // 사용자 인터랙션 후에야 AudioContext 생성 가능 (Chrome 정책)
  function ensureCtx() {
    if (ctx) return ctx;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  // 단일 톤 — freq(Hz), dur(s), type(square/triangle/sawtooth/sine), vol(0~1)
  function tone(freq, dur, type, vol, delay) {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    type = type || 'square';
    vol  = vol  != null ? vol : 0.08;
    delay = delay || 0;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    // ADSR — Attack 5ms, Decay 25ms, Sustain vol*0.6, Release dur
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.005);
    g.gain.linearRampToValueAtTime(vol * 0.6, t0 + 0.03);
    g.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  // 주파수 스윕(피치 변화) 톤 — 단서 입수·송부 같은 동적 효과
  function sweep(freqStart, freqEnd, dur, type, vol, delay) {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    type = type || 'square';
    vol  = vol  != null ? vol : 0.08;
    delay = delay || 0;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freqStart, t0);
    o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.005);
    g.gain.linearRampToValueAtTime(0, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  // 짧은 노이즈 버스트 (오답 같은 거친 효과음)
  function noise(dur, vol) {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    vol = vol != null ? vol : 0.05;
    const t0 = c.currentTime;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = c.createBufferSource();
    const g = c.createGain();
    src.buffer = buf;
    g.gain.value = vol;
    src.connect(g); g.connect(c.destination);
    src.start(t0);
  }

  // ── 효과음 8종 (NES 풍) ────────────────────────────────────
  const SFX = {
    // UI 클릭 — 짧고 명확한 한 음
    click: () => tone(800, 0.05, 'square', 0.07),
    // 호버 — 더 짧고 작게 (반복 호출 부담 ↓)
    hover: () => tone(1100, 0.025, 'triangle', 0.04),
    // 단서 입수 — 상승 아르페지오 ★ (도-미-솔)
    evidence: () => {
      tone(523, 0.07, 'square', 0.08, 0.00);   // C5
      tone(659, 0.07, 'square', 0.08, 0.07);   // E5
      tone(784, 0.14, 'square', 0.09, 0.14);   // G5
    },
    // 퀴즈 정답 — 밝은 상승 펜타톤
    success: () => {
      tone(659, 0.08, 'square', 0.09, 0.00);
      tone(880, 0.16, 'square', 0.10, 0.08);
    },
    // 퀴즈 오답 — 어두운 하강 + 노이즈
    fail: () => {
      tone(330, 0.12, 'sawtooth', 0.07, 0.00);
      tone(220, 0.18, 'sawtooth', 0.07, 0.08);
      noise(0.10, 0.04);
    },
    // 단계 전환 카드 — 화려한 트라이톤 팡파레
    stage: () => {
      tone(523, 0.10, 'square', 0.09, 0.00);   // C
      tone(659, 0.10, 'square', 0.09, 0.10);   // E
      tone(784, 0.10, 'square', 0.09, 0.20);   // G
      tone(1047, 0.24, 'square', 0.10, 0.30);  // C (옥타브)
    },
    // 보고서 송부 — 부드러운 상승 스윕 + 마지막 톤
    send: () => {
      sweep(440, 880, 0.30, 'triangle', 0.09, 0.00);
      tone(1047, 0.20, 'square', 0.09, 0.30);
    },
    // 시민·NPC 대화 시작 — 부드러운 두 음
    talk: () => {
      tone(587, 0.05, 'triangle', 0.06, 0.00);
      tone(740, 0.07, 'triangle', 0.06, 0.05);
    },
  };

  // 공개 API
  window.SFX = {
    play(key) {
      const fn = SFX[key];
      if (typeof fn === 'function') {
        try { fn(); } catch (e) { /* ignored */ }
      }
    },
    isMuted() { return muted; },
    setMuted(m) {
      muted = !!m;
      try { localStorage.setItem('aral_muted', muted ? '1' : '0'); } catch (e) {}
    },
    toggleMute() {
      this.setMuted(!muted);
      return muted;
    },
  };
})();
