// 게임 화면 안내문/토스트 — 자주 보이는 텍스트 점진적 외부화
// (대화 에디터 editor.html 로 갱신됨)
//
// placeholder 표기: {guide} {place} {ev} {co} {need}
//   fmtString(STRINGS.foo, { guide:'한센', ev:2 }) 로 치환
//
// 새 텍스트를 외부화할 때:
//   1) 여기 STRINGS에 키·placeholder 포함 텍스트 추가
//   2) game.js 호출처에서 fmtString(STRINGS.foo.bar, {...}) 호출
//   3) editor.html은 자동으로 새 키를 표시

const STRINGS = {

  // ── 화면 하단 목표 안내 (단계별, refreshObjective) ──────────
  objective: {
    perceive:        '🎯 인식 (P) — 안내인 {guide}에게 다가가 상황을 파악하세요',
    exploreFirst:    '🎯 관찰 (E·탐색) — 노란 표지판으로 {place}을(를) 조사해 단서 {ev}/3 이상 모으세요',
    analyzeCitizens: '🎯 관찰 (A·분석) — 시민(!)을 인터뷰해 핵심 단서 {co}/{need}개를 얻으세요',
    reflect:         '🎯 성찰 (C) — 🪞 성찰의 의자에 앉아 인과 사슬과 자기성찰을 마치세요',
    enact:           '🎯 실천 (E) — 파란 우편함으로 가서 UN 조사 보고서를 송부하세요',
  },

  // ── 잠금 토스트 (showLockToast) ────────────────────────────
  lockToast: {
    needGuideFirst: '먼저 {guide}와 만나 상황을 파악하세요\n(1단계 · 인식)',
    needCluesFirst: '먼저 {place}을(를) 조사해 단서를 모으세요\n(2단계 · 관찰 / 단서 {ev}/3)',
  },

};

// ── 헬퍼 — {key} placeholder 치환 ──────────────────────────────
function fmtString(tmpl, vars) {
  if (!tmpl) return '';
  if (!vars) return tmpl;
  return tmpl.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}
