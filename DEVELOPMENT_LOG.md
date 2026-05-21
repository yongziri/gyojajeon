# 개발 이력 (Development Log)

> 2026-05-19 ~ 2026-05-21  
> Phaser + Electron 픽셀 RPG · 세계시민교육 컨셉으로 진화

작은 데모에서 시작해 **세계시민교육 RPG**로 발전한 전 과정 정리입니다.

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

## 챕터 16 · 배포 준비 (현재)

- `package.json` 메타데이터 정비
- `.gitignore` 추가 (node_modules·dist 제외)
- **`README.md`** — 다른 PC에서 실행하는 안내
- **`DEVELOPMENT_LOG.md`** — 본 문서

---

## 🧱 아키텍처 결정사항

### Scene 그래프

```
BootScene (preload·텍스처 생성·폰트 대기)
    ↓
TitleScene  ←─→  CreditsScene
    ↓
WorldScene  ←──┬─→ DialogueScene  (overlay, pause+launch)
               ├─→ QuizScene       (overlay, pause+launch)
               ├─→ InvestigationScene  (전체 화면 scene.start)
               └─→ LetterScene          (전체 화면 scene.start)

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

## 📊 통계

- **총 작업 단계**: 38개 (TaskCreate 기준)
- **씬 수**: 9 (Boot, Title, Credits, World, Dialogue, Investigation, Quiz, Letter, Battle[유휴])
- **데이터 파일**: 3 (dialogue.js, cases.js, quizzes.js)
- **에셋 팩**: 4 (Kenney Tiny Town/Dungeon/1-Bit/Pixel Platformer — 모두 CC0)
- **폰트**: 2 종 (NeoDunggeunmoPro, PFStardust × 3 굵기)
- **사진**: 1 (무이낙 픽셀아트)
- **`game.js` 크기**: 약 2,100 lines

---

## 🚧 다음 후보 (선택 작업)

1. 한국 측 발단 장면 (텃밭 흰 가루로 게임 시작)
2. 인과 사슬 정리 화면 (단서 모두 모이면 다이어그램)
3. 편지 결과물 PNG 저장 기능
4. 해협·시장 사진 교체 (시각 일관성)
5. **포터블 Windows .exe 빌드** (electron-builder)
6. 8비트 BGM·SFX 추가
7. 한국어 + 영어 다국어 지원
