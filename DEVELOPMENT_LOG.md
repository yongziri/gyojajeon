# 개발 이력 (Development Log)

> 2026-05-19 ~ 2026-05-31
> Phaser + PWA/Electron 픽셀 RPG · **P.E.A.C.E. — 통(通)하는 국제 분쟁 탐구하기**
> 제73회 경기도교육자료전 (사회·역사) 출품 — 공도중학교 염태철·이문호·이용빈

작은 데모에서 시작해 **3사건 통합 세계시민교육 RPG**로 발전한 전 과정 정리.

---

## 챕터 1 · 출발 — 기초 Phaser RPG 데모

**목표**: "쯔꾸르(RPG Maker) 풍 게임을 코드로 만들 수 있을까?" 실험.

- Electron + Phaser 3 + `pixelArt: true` 로 빈 프로젝트 셋업
- `MAP[][]` 2차원 배열로 타일 기반 월드 구현 (벽·바닥 충돌)
- 화살표 이동 + 4방향 캐릭터 (도트맵, 자체 제작)
- 흙바닥 (격자 없는 노이즈), 사암 벽
- 페르시아풍 모스크·미너렛·흙집·야자수·분수 (코드 도트)

## 챕터 2 · 첫 콘텐츠 — 슬라임 미연시

- VN(미연시) 스타일 **대화 엔진** 도입 (`src/dialogue.js`)
- 타자기 효과 + 선택지 분기 + 호감도(♥)
- "검을 뽑는다" 선택지로 **턴제 전투**(`BattleScene`)도 만들어 보았으나, 아이 캐릭터에 적합치 않아 후속 단계에서 제거

## 챕터 3 · 캐릭터 전환 — 슬라임 → 이슬람 아이 라일라

- 보라색 슬라임 → **히잡을 쓴 이슬람 아이** 도트 (자체 제작)
- 대화 톤·이름 변경 ("라일라"). 공격 선택지 삭제

## 챕터 4 · 역전재판식 현장 조사 — InvestigationScene

- 사용자 요청: "역전재판처럼 장소에서 단서 찾는 기능"
- `InvestigationScene` 신규
  - "조사한다" → 돋보기 커서, 사물 클릭으로 단서 발견
  - "이동한다" → 장소 간 이동
  - **법정 기록** 화면 — 모은 증거 일람
  - 데이터는 `src/cases.js` 분리

## 챕터 5 · 호르무즈 분쟁 콘텐츠

- "교육용 게임"으로 발전 — 분쟁·자원·인권 주제
- 라일라 대화 + 조사 3장소(항구·해협 감시소·시장) 전면 교체
- "호감도(♥)" → "**이해도(📘)**" 의미 전환

## 챕터 6 · 디자인 고급화

- 타이틀 화면 + `panel()` / `fancyButton()` 공통 UI
- 배경·캐릭터에 음영·하이라이트 추가
- 월드맵에 비네트(분위기) 오버레이

## 챕터 7 · 도트 아트로 전면 통일

- 사용자 요청: "지금까지의 게임을 도트로"
- **픽셀맵 헬퍼(`pxMap`)** 도입 — 문자열 배열로 도트 그리기
- 주인공(16x20)·라일라(16x16) 픽셀맵 6/2 프레임으로 재작성
- 땅·벽·건물(모스크·미너렛·집·야자수·분수)·소품·UI 전부 `fillRect` 만으로 재구성
- 사진 배경에 **`postFX.addPixelate`** 적용으로 통일감

## 챕터 8 · 호르무즈 → **아랄해**로 주제 전환 (디교연/교육자료전)

- 사용자 자료(`새로운 안건.txt` + `다문화사회의 세계시민교육 방안 연구`) 검토
- 정치적 첨예성 ↓ + 환경·인권·소비 의 통합 교재로 **아랄해** 선택
- UNESCO 세계시민교육 3대 영역에 맞춘 콘텐츠 재구성
  - 대화: 인지·정서·행동 매핑
  - 조사: 무이낙·옛 호수 지도실·소금먼지 마을 (10단서)
- 라일라 → **아이졸리(카라칼팍 아이)**

## 챕터 9 · 실제 사진 배경 (무이낙 항구)

- 사용자가 보내준 픽셀아트 항구 사진을 `assets/port.png` 로
- `BootScene.preload` 에서 자동 로드, 사진 텍스처 우선 사용 + 폴백
- 조사 지점(4개) 좌표를 사진 구도에 맞춰 재배치
  - 유조선(HORMUZ STAR) → 녹슨 선체 / 부서진 조타실 / 옛 호수 바닥 / 텅 빈 수평선

## 챕터 10 · 한글 픽셀 폰트 적용

- 사용자 보유 ttf 4종을 `assets/fonts/` 에 번들 (오프라인 동작 보장)
  - **NeoDunggeunmoPro-Regular** — 본문
  - **PFStardust Regular/Bold/ExtraBold** — 제목·강조
- `index.html` `@font-face` 등록 + 숨김 프리로드
- `BootScene` 가 `document.fonts.load()` 대기 후 첫 씬 시작
- 게임 내 36곳 텍스트에 `fontFamily` 일괄 적용

## 챕터 11 · UN 편지 화면 — 행동적 역량 마무리

- 게임 흐름 4단계(원안)의 마지막 "UN 편지 보내기"
- **LetterScene** 신규
  - 받는 곳 선택 (UN 환경계획 / 유네스코 / 환경부)
  - 모은 단서 중 최대 3개 체크
  - 다짐 카드 5개 중 3개 체크
  - 미리보기 → 발송 → 캡처용 화면
- 월드맵에 **파란 UN 우편함** 배치 (도트맵으로 직접 그림)

## 챕터 12 · 무료 CC0 에셋 도입 (Kenney)

- **Kenney Tiny Town** 다운로드·추출 → 트리·덤불 4개씩 월드맵에 배치
- **Kenney Tiny Dungeon** 다운로드·추출 → 마을 주민 NPC 3명 (보조 데코)
- 모두 CC0 — 출처 명기 의무 없으나 매너상 명기
- **CreditsScene** 신규 — 폰트·스프라이트·엔진·교육 이론 출처를 한 화면에

## 챕터 13 · 8비트 톤 전면 적용

- CSS **CRT 스캔라인 + 비네트** (index.html)
- `image-rendering: pixelated` 보강
- 사진 `postFX.addPixelate(4 → 8)` 청크감 ↑
- UI 패널·버튼 NES 박스 스타일 (8픽셀 두께 외곽·이중 테두리)
- **Kenney 1-Bit Pack**, **Pixel Platformer** 추가 다운로드 (보조 활용)

## 챕터 14 · 게임 루프 확장 — 시민 + 퀴즈 + 핵심 단서

- 사용자 요청: 대화→조사→시민과 대화→문제 풀이→핵심 단서→편지
- **`src/quizzes.js`** 신규 — 시민 데이터 분리 (옛 어부 / 옷가게 상인 / 마을 의사)
- 시민 NPC 머리 위 **!** (미완료) / **✓** (완료) 표시
- **QuizScene** — 인트로 대사 → 객관식 3택 → 정답/오답 피드백 → ★ 핵심 단서 획득
- HUD 우상단 **🔑 핵심 단서 N/3** 실시간 표시
- 우편함 **게이팅**: 핵심 단서 부족 시 토스트 안내, 입장 차단

## 챕터 15 · RPG Maker 스타일 오버레이 대화

- 사용자가 보내준 게임 스크린샷 참고
- 대화창을 **월드 위 오버레이**로 변경
  - `scene.start` → **`scene.pause` + `scene.launch`** 패턴
  - DialogueScene·QuizScene 모두 투명 배경 + 어둡게 깔린 오버레이
  - 캐릭터 좌측 크게 (×10~12)
  - 하단 전체 너비 대사 박스 + **`[아이졸리]`** 형식 이름표
- WorldScene `events.on('resume')` 핸들러로 상태 동기화
  - 친구 됨 / 시민 풀이 완료 / 핵심 단서 HUD 갱신
  - 700ms 쿨다운으로 즉시 재발동 방지

## 챕터 16 · 배포 준비

- `package.json` 메타데이터 정비
- `.gitignore` 추가 (node_modules·dist 제외)
- **`README.md`** — 다른 PC에서 실행하는 안내
- **`DEVELOPMENT_LOG.md`** — 본 문서

## 챕터 17 · 4단계 학습 시스템 + 교사 실시간 대시보드

- 사용자 요청: "인식·관찰·탐구·실천 4단계로 세분화"
- **`stage` 레지스트리 변수** + `checkStageAdvance()` 4단계 로직
  - 1→2: 라일라와 첫 대화 종료(enemyDefeated)
  - 2→3: 조사 단서 ≥3 수집
  - 3→4: 핵심 단서 3개(TOTAL_CITIZENS) 획득
  - 4: UN 보고서 송부
- **HUD 4단계 칩** + 단계별 목표 문구 4종 (refreshObjective)
- **`showStageTransition`** — 단계 전환 시 페이드인 카드 (5초/클릭 자동 닫힘)
- 게이트 통합 — `stage` 변수 대신 **실제 조건**(enemyDefeated·evidence·coreClues 개수) 검사

### MQTT 교사 대시보드
- `mqtt.js` (브라우저 빌드) + 무료 공용 브로커 `broker.emqx.io`
- **`src/telemetry.js`** — 진행도 발행 모듈 (fail-silent: 네트워크 차단 시 무시)
- `index.html` 상단 **참가번호·교실 코드 cfgBar** (Title/Credits에서만 표시)
- 게임 4단계 분기·단서 변동·송부 시점에 자동 `Telemetry.update()` 훅
- **`dashboard.html`** — 별도 브라우저 페이지
  - 학생별 카드(참가번호·단계 칩·단서/핵심 진행 막대)
  - retain 메시지로 새 교사가 들어와도 즉시 복원

## 챕터 19 · P.E.A.C.E. 학습 모델 통합

박미정(2022) 「다문화사회의 세계시민교육 방안 연구」의 PEACE 모델
(Perceiving·Exploring·Analyzing·Connecting·Enacting)을 게임 4단계에 매핑.

- HUD 단계 칩 "탐구" → "성찰"로 변경 (PEACE의 C 활동)
- `checkStageAdvance` 게이팅: 2→3은 단서 ≥3 + 핵심 단서 = 3 (E·A 모두 완료),
  3→4는 `reflectionDone === true` (성찰 마침)
- 단계 전환 카드에 PEACE 약자 + 메타인지 발문
- 새 씬 **ReflectionScene** — 🪞 성찰의 의자
  - 인과 사슬 3슬롯 (원인 → 중간 → 결과)
  - 자기성찰 5개 카드 중 1개 선택
  - registry에 `reflection: { chain, statement }` 저장
- WorldScene에 "성찰의 의자" 트리거 추가 (! 마커 + 게이팅)
- LetterScene 보고서 본문에 인과 사슬·자기성찰 자동 인용
- **PEACE_학습모델_매핑.txt** 신규 — 7개 섹션 종합 정리

## 챕터 20 · 자기조절학습(SRL) 사이클 완성

자기주도성을 게임 메커닉으로 시각화. Zimmerman SRL 4단계 적용.

- **B 단서별 감정 태그** (자기 모니터링)
  InvestigationScene `askThoughtTag` — 단서 발견 직후 5택
  (충격적/안타깝다/인상적/화가 난다/나중에)
- **C 임무 회고 루브릭** (자기 평가)
  LetterScene `buildReview` — ★ 3슬라이더 + "더 알고 싶은 것" 선택
  보고서 본문에 점수 자동 인용
- **D 학습 트리** (포트폴리오)
  **LearningTreeScene** 신규 — 완료 사건별 인과 사슬·자기성찰·평가 누적
- **H 뱃지 시스템 6종**
  ★단서 마스터 / 🎯인터뷰 통달 / 💭공감 기록자 /
  🔗인과 분석가 / 📊자기 성찰 / 🌐균형 시민
  `computeBadges()`로 보고서 송부 시점에 자동 산정,
  학습 트리 카드 우상단에 뱃지 칩 + 호버 라벨

## 챕터 21 · 결과물 인쇄 & 사운드 & 패키징

### 인쇄 가능 보고서 두 종
- 학생용 — index.html `#printReport` + LetterScene `printReport()` + @media print CSS
  A4 1쪽 학생 보고서 + 자기 평가 + 뱃지 자동 인용 → PDF 저장 가능
- 교사용 — dashboard.html `#printPanel` + `buildPrintPanel()`
  학급 전체 진행 요약 + 감정 분포 + 학생별 학습 흔적 표

### 8비트 칩튠 SFX
- **src/audio.js 신규** — Web Audio API로 SFX 8종 코드 생성 (외부 파일 0)
  click·hover·evidence(★ 아르페지오)·success·fail·stage(팡파레)·send·talk
- ADSR envelope + square/triangle/sawtooth 파형 + 노이즈 burst
- cfgBar 우측 🔊 토글 (localStorage 저장)
- fancyButton·단서 입수·단계 전환·퀴즈 정·오답·송부·대화 시작에 자동 연결

### 사건 선택 시스템 (확장 대비)
- **CaseSelectScene** 신규 — 오버워치2 임무 선택 스타일
  Wikimedia Commons 세계지도 (Public Domain, color invert로 다크 UI에 합성)
  심플 마커 + 호버 라벨 + 카드 ★ 완료 배지
- **BriefingScene** 신규 — 임무 브리핑 + 페이드 + 로딩 진행바
- 사건 데이터를 CASE_LIST 배열로 분리 — 향후 사건 추가 시 한 줄로 확장

### 도움말 & 교사 안내
- **HelpScene** 신규 — 타이틀의 ❓ 버튼 또는 ESC로 호출
  좌(조작법) + 우(게임 흐름·아이콘 의미)
- **TeacherGuideScene** — 학습 프레임 텍스트를 PEACE로 갱신
- **CurriculumScene** — PEACE ↔ 게임 매핑표 추가

### 데스크톱 패키징
- **electron-builder 25.1.8** 도입
- `package.json` build 설정 + `npm run dist` 스크립트
- `VanishedSea.exe` (188MB) + 의존 파일 폴더
- 배포 ZIP 약 130MB → 받는 사람은 압축 풀고 .exe 더블클릭

## 챕터 18 · 교육자료전 출품 마무리

연구대회·교육자료전 심사 기준 5개(자료 적절성·창의성·완성도·교육 기여도·일반화 가능성)에 맞춰 점검·보강.

### UNESCO GCED 영역 태깅
- 모든 단서(10개) + 핵심 단서(3개)에 `area: 'cognitive' | 'emotional' | 'behavioral'` 필드
- **AREA_INFO** 헬퍼: { 인지 ■ 파랑 / 정서 ■ 주황 / 행동 ■ 초록 }
- 단서 기록 화면 + 보고서 작성 화면에 **색상 배지·스트라이프** 표시 → 학생이 학습 목표를 시각적으로 인식

### 교사용 가이드·교육과정 연계 화면
- **TeacherGuideScene** — 좌(학습 프레임 4단계·UNESCO 3영역) / 우(권장 학년·교과·수업 절차·평가)
- **CurriculumScene** — 2022 개정 성취기준 매핑 + UNESCO GCED 학습 성과 + SDG 연계 + 출처 표기
- TitleScene 3버튼 레이아웃: `▶ 시작하기` (중앙 상단 강조) / `🎓 교사용 가이드` / `에셋·라이선스`

### 메타인지 발문 (Reflection prompt)
- 단계 전환 카드에 **푸른 인용 박스**로 학생 스스로의 사고를 점검하는 한 문장
  - 1→2: "라일라의 이야기에서 가장 마음에 남은 한 마디는?"
  - 2→3: "왜 이렇게 됐을까?를 가장 잘 설명하는 단서는?"
  - 3→4: "멀리 한국에 사는 내가 할 수 있는 일은?"
- 카드 자동 닫힘 시간 5초 → 7초 (발문 읽을 시간 확보)

### 디자인·UX 일관성
- FONT_TITLE 일관성 — 패널·전환 카드·헤더 모두 PFStardust로 통일
- HUD `🌐 UN 조사관` 라벨 단축 + 위치 조정 → 단계 칩과 겹침 해소
- 게임 진행 중 상단 cfgBar 자동 숨김 → 화면 영역 100% 확보

### 배포 산출물
- `C:\Users\USER\Desktop\교육자료전2\사라진바다\` 폴더에 게임 사본 배치 (`node_modules/` 제외, 7.6MB)
- `실행방법.txt` — 심사위원용 1쪽 안내
- **README.md** 보강 — 4단계 흐름·교사 활용 50분 수업안·평가 루브릭·교육과정 연계표·대시보드 사용법

---

## 🧱 아키텍처 결정사항

### Scene 그래프

```
BootScene (preload·텍스처 생성·폰트 대기)
    ↓
TitleScene  ←─→  CreditsScene
    ↓        ←─→  TeacherGuideScene  ←─→  CurriculumScene
    ↓
WorldScene  ←──┬─→ DialogueScene  (overlay, pause+launch)
               ├─→ QuizScene       (overlay, pause+launch)
               ├─→ InvestigationScene  (전체 화면 scene.start)
               └─→ LetterScene          (전체 화면 scene.start)

별도 브라우저 페이지: dashboard.html  (MQTT 구독 → 학급 진행도 시각화)

(BattleScene 은 dialogue.js에서 battle: true 시 호출되도록 등록되어 있으나 현재 콘텐츠에선 미사용)
```

- 대화/퀴즈 = **오버레이**(월드 보존) — RPG Maker 풍
- 조사/편지 = **전체 화면**(컨텍스트 전환) — 의도적 분리

### 데이터-코드 분리 원칙

게임의 모든 **텍스트·문제·증거**는 `src/` 의 **3개 데이터 파일**에 있고,
게임 로직(렌더링·진행·UI)은 `game.js` 에 있다.

→ 출품 후에도 코드 안 건드리고 콘텐츠만 수정/확장 가능.

### Phaser 기능 활용

- `pixelArt: true` — 모든 텍스처 nearest-neighbor 스케일
- `postFX.addPixelate(8)` — 실사 사진을 도트화
- `scene.pause / launch / stop / resume` — 오버레이 대화 패턴
- `registry` — 씬 간 영구 상태 (`evidence`, `coreClues`, `quizSolved`, `enemyDefeated`)

---

## 📊 통계 (v84 기준, 2026-05-31)

- **총 작업 단계**: 100+ 개 (TaskCreate 기준)
- **사건**: 3 (아랄해 환경 / 우크라이나 전쟁 / 팔레스타인·이스라엘)
- **씬 수**: 16 (Boot, Title, Help, Credits, TeacherGuide, Curriculum, CaseSelect, LearningTree, Briefing, World, Dialogue, Investigation, Quiz, Reflection, Letter, **Speech**) — BattleScene 제거됨
- **데이터 파일**: 3 (dialogue.js / cases.js / quizzes.js) — 사건별 분기 객체 구조 + UNESCO area 태깅
- **에셋**: Kenney Tiny Town/Dungeon/1-Bit (CC0), 자체 NPC 일러스트 13장, 배경 사진 9장, MonaS 폰트(SIL OFL)
- **외부 모듈**: phaser.min.js, mqtt.js (브라우저 빌드)
- **`game.js` 크기**: 약 6,700 lines
- **SW 캐시 버전**: v84
- **PWA·APK 배포**: GitHub Pages + PWABuilder TWA

---

## 🚧 다음 후보 (출품 직전 권장)

1. e2e 테스트 — 우크라/팔레스타인 실제 완주 (정적 검증 완료, 손 검증 미완)
2. 계획서 PDF 본문 Ⅴ~Ⅶ 작성 (자료 특징·활용방법·활용결과)
3. 출품 폴더(`교육자료전2/사라진바다`) PC v1.0 → 모바일 PWA 동기화
4. PWABuilder APK 재빌드 (앱 이름 P.E.A.C.E. 반영)
5. 첫 진입 튜토리얼 모달
6. 저장/이어하기 (localStorage)
7. 8비트 BGM·환경음 + 시연 영상
