// 기초 Phaser RPG 데모 (캐릭터 그래픽 버전)
// - 코드로 픽셀 캐릭터 / 타일 / 몬스터 텍스처를 생성
// - 4방향 걷기 애니메이션
// - 벽 충돌, 적과 부딪히면 턴제 전투

const TILE = 40;

// ── 게임 캔버스 사이즈 — 16:10 비율 (태블릿·폰 가로 모드에 fit) ───
//  이전(800x600, 4:3) → 현재(960x600, 16:10)
//  · 가운데 정렬: x = GAME_W / 2 = 480
//  · 풀스크린 사각형: (0, 0, GAME_W, GAME_H)
//  · 우측 HUD: GAME_W - margin
//  · 월드맵은 좌우 80px씩 자연스럽게 늘어남 (배경 빈 영역 추가)
const GAME_W = 960;
const GAME_H = 600;

// ── 폰트 (대회 출품용 픽셀 한글) ───────────────────────────────
//  · MonaS (Monad ABXY, SIL OFL): 12px 픽셀 한글·영문 모두 지원
//  · 본문 = Regular weight, 제목·강조 = Bold weight
const FONT = 'MonaS, "Malgun Gothic", sans-serif';
const FONT_TITLE = 'MonaS, "Malgun Gothic", sans-serif';

// 0 = 바닥, 1 = 벽
const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,0,0,1,0,0,0,1,1,1,0,0,0,1,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,1,1,0,0,1],
  [1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// NPC 머리 위 ! / ✓ 마커 — 안내인·시민·향후 추가 NPC 전부 통일 적용
// 새 NPC를 만들 때는 반드시 이 두 상수를 그대로 add.text 의 style 인자로 전달.
const MARKER_STYLE_ACTIVE = {
  fontFamily: 'MonaS, "Malgun Gothic", sans-serif',
  fontSize: '18px', color: '#ffe082',
  stroke: '#000000', strokeThickness: 3
};
const MARKER_STYLE_SOLVED = {
  fontFamily: 'MonaS, "Malgun Gothic", sans-serif',
  fontSize: '16px', color: '#7fd07f',
  stroke: '#000000', strokeThickness: 3
};

// 색상 팔레트
const C = {
  skin:  0xf2c79b,
  hair:  0x5d3a1a,
  shirt: 0xe0552b,
  pants: 0x32406b,
  shoe:  0x222233,
  outline: 0x1a1228,
  kidSkin: 0xeebf94,
  kidSkinSh: 0xd49f72,
  hijab: 0x2f8a76,
  hijabDark: 0x1f5e50,
  hijabLite: 0x49b39a,
  dress: 0x2e7b68,
  dressDark: 0x1f5848,
  cheek: 0xe79a78,
  eye:   0x231a2a,
};

// ── 도트(픽셀) 헬퍼 ─────────────────────────────────────────────
// 문자열 픽셀맵을 그래픽에 그립니다. 각 문자는 scale x scale 블록.
function pxMap(g, lines, palette, scale, ox, oy) {
  scale = scale || 2;
  ox = ox || 0;
  oy = oy || 0;
  for (let r = 0; r < lines.length; r++) {
    const row = lines[r];
    for (let c = 0; c < row.length; c++) {
      const color = palette[row[c]];
      if (color == null) continue;
      g.fillStyle(color, 1);
      g.fillRect(ox + c * scale, oy + r * scale, scale, scale);
    }
  }
}

// ── 주인공 픽셀 데이터 ──────────────────────────────────────────
const HERO_PAL = {
  '.': null, ' ': null,
  H: 0x5d3a1a, // 머리카락
  s: 0xf2c79b, // 피부
  E: 0x1a1228, // 눈
  m: 0xb35a3c, // 입
  C: 0xe0552b, // 셔츠
  c: 0xa23d1c, // 셔츠 음영
  p: 0x32406b, // 바지
  B: 0x222233, // 신발
};

const HERO_MAPS = {
  down_0: [
    '................',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '...HssssssssH...',
    '...HssssssssH...',
    '...HsEssssEsH...',
    '...HssssssssH...',
    '....sssmmsss....',
    '.....ssssss.....',
    '......ssss......',
    '...sCCCCCCCCs...',
    '...sCCccccCCs...',
    '...sCCCCCCCCs...',
    '....CCCCCCCC....',
    '....pppppppp....',
    '....pp....pp....',
    '....pp....pp....',
    '....pp....pp....',
    '....BB....BB....',
    '....BB....BB....',
  ],
  down_1: [
    '................',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '...HssssssssH...',
    '...HssssssssH...',
    '...HsEssssEsH...',
    '...HssssssssH...',
    '....sssmmsss....',
    '.....ssssss.....',
    '......ssss......',
    '...sCCCCCCCCs...',
    '...sCCccccCCs...',
    '...sCCCCCCCCs...',
    '....CCCCCCCC....',
    '....pppppppp....',
    '....ppp..pp.....',
    '....pp...pp.....',
    '....pp...pp.....',
    '....BBB..BB.....',
    '....BB...BB.....',
  ],
  up_0: [
    '................',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '....HHHHHHHH....',
    '.....ssssss.....',
    '......ssss......',
    '...sCCCCCCCCs...',
    '...sCCccccCCs...',
    '...sCCCCCCCCs...',
    '....CCCCCCCC....',
    '....pppppppp....',
    '....pp....pp....',
    '....pp....pp....',
    '....pp....pp....',
    '....BB....BB....',
    '....BB....BB....',
  ],
  up_1: [
    '................',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '....HHHHHHHH....',
    '.....ssssss.....',
    '......ssss......',
    '...sCCCCCCCCs...',
    '...sCCccccCCs...',
    '...sCCCCCCCCs...',
    '....CCCCCCCC....',
    '....pppppppp....',
    '....ppp..pp.....',
    '....pp...pp.....',
    '....pp...pp.....',
    '....BBB..BB.....',
    '....BB...BB.....',
  ],
  side_0: [
    '................',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '....HsssssssH...',
    '....HssssssssH..',
    '....HssssEssss..',
    '....HssssssssH..',
    '.....sssmmss....',
    '......ssssss....',
    '......ssssss....',
    '....sCCCCCCCs...',
    '...sCCccccCCss..',
    '....sCCCCCCCs...',
    '.....CCCCCCC....',
    '.....pppppp.....',
    '....pp..pp......',
    '....pp..pp......',
    '....pp..pp......',
    '....BB..BB......',
    '....BB..BB......',
  ],
  side_1: [
    '................',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '....HsssssssH...',
    '....HssssssssH..',
    '....HssssEssss..',
    '....HssssssssH..',
    '.....sssmmss....',
    '......ssssss....',
    '......ssssss....',
    '....sCCCCCCCs...',
    '...sCCccccCCss..',
    '....sCCCCCCCss..',
    '.....CCCCCCC....',
    '.....pppppp.....',
    '.....pp..pp.....',
    '....pp..pp......',
    '....pp..pp......',
    '....BB..BB......',
    '...BB...BB......',
  ],
};

function drawHero(g, dir, frame) {
  g.clear();
  // 발 밑 블록 그림자
  g.fillStyle(0x000000, 0.22);
  g.fillRect(8, 36, 16, 4);
  const map = HERO_MAPS[dir + '_' + frame];
  if (map) pxMap(g, map, HERO_PAL, 2);
}

// ── 아이졸리(아이) 픽셀 데이터 ──────────────────────────────────
const KID_PAL = {
  '.': null, ' ': null,
  H: 0x2f8a76, // 히잡
  h: 0x1f5e50, // 히잡 음영
  L: 0x49b39a, // 히잡 하이라이트
  s: 0xeebf94, // 피부
  E: 0x231a2a, // 눈
  W: 0xffffff, // 눈 흰자
  D: 0x2e7b68, // 원피스
  d: 0x1f5848, // 원피스 음영
  c: 0xe79a78, // 볼
  m: 0xc9694a, // 입
};

const KID_MAPS = {
  k0: [
    '................',
    '....HHHHHHHH....',
    '...HHLHHHHHHH...',
    '..HHssssssssHH..',
    '..HsssssssssHH..',
    '..HsWEssssWEsH..',
    '..HsssccccssscH.',
    '..HsssmmmmsssH..',
    '..HHssssssssHH..',
    '.hhDDDDDDDDDDhh.',
    '.hDDDDDDDDDDDDh.',
    '.hDDdddddddDDDh.',
    '.hDDDDDDDDDDDDh.',
    '.hDDDDDDDDDDDDh.',
    '.hDDDDDDDDDDDDh.',
    '.hhhhhhhhhhhhhh.',
  ],
  k1: [
    '................',
    '....HHHHHHHH....',
    '...HHLHHHHHHH...',
    '..HHssssssssHH..',
    '..HsssssssssHH..',
    '..HsEEsssssEEsH.',
    '..HsssccccssscH.',
    '..HsssmmmmsssH..',
    '..HHssssssssHH..',
    '.hhDDDDDDDDDDhh.',
    '.hDDDDDDDDDDDDh.',
    '.hDDdddddddDDDh.',
    '.hDDDDDDDDDDDDh.',
    '.hDDDDDDDDDDDDh.',
    '.hDDDDDDDDDDDDh.',
    '.hhhhhhhhhhhhhh.',
  ],
};

function drawChild(g, frame) {
  g.clear();
  // 그림자
  g.fillStyle(0x000000, 0.22);
  g.fillRect(8, 28, 16, 4);
  pxMap(g, frame === 1 ? KID_MAPS.k1 : KID_MAPS.k0, KID_PAL, 2);
}

// ── 땅: 이음새 없는 블록 노이즈 (도트) ──────────────────────────
function drawGround(g, w, h) {
  g.clear();
  g.fillStyle(0xc6a066, 1); g.fillRect(0, 0, w, h);

  let s = 12345;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

  const tones = [0xb38c52, 0xc89c5a, 0xa9824a, 0xd9b072, 0xbe9559];
  // 4x4 블록 패치
  for (let i = 0; i < 220; i++) {
    g.fillStyle(tones[i % tones.length], 1);
    const bx = Math.floor(rnd() * (w / 4)) * 4;
    const by = Math.floor(rnd() * (h / 4)) * 4;
    const bw = (1 + Math.floor(rnd() * 5)) * 4;
    const bh = (1 + Math.floor(rnd() * 4)) * 4;
    g.fillRect(bx, by, bw, bh);
  }
  // 2x2 잔돌
  g.fillStyle(0x8f6a39, 1);
  for (let i = 0; i < 360; i++)
    g.fillRect(Math.floor(rnd() * (w / 2)) * 2, Math.floor(rnd() * (h / 2)) * 2, 2, 2);
  g.fillStyle(0xe6c890, 1);
  for (let i = 0; i < 240; i++)
    g.fillRect(Math.floor(rnd() * (w / 2)) * 2, Math.floor(rnd() * (h / 2)) * 2, 2, 2);
}

// ── 키이우 거리 바닥: 회색 보도 + 부서진 콘크리트 패치 ──────────
function drawConcrete(g, w, h) {
  g.clear();
  // 기본 회색 콘크리트
  g.fillStyle(0x6e7480, 1); g.fillRect(0, 0, w, h);
  let s = 24680;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  // 보도블록 격자 (40x40)
  g.fillStyle(0x55606c, 1);
  for (let y = 0; y < h; y += 40) g.fillRect(0, y, w, 1);
  for (let x = 0; x < w; x += 40) g.fillRect(x, 0, 1, h);
  // 잔금·균열
  const dark = [0x5a626d, 0x4e5660, 0x3d434c];
  for (let i = 0; i < 280; i++) {
    g.fillStyle(dark[i % dark.length], 1);
    const bx = Math.floor(rnd() * (w / 4)) * 4;
    const by = Math.floor(rnd() * (h / 4)) * 4;
    const bw = (1 + Math.floor(rnd() * 4)) * 4;
    const bh = (1 + Math.floor(rnd() * 2)) * 4;
    g.fillRect(bx, by, bw, bh);
  }
  // 잔해 부스러기 (밝은 잿빛 + 검은 점)
  g.fillStyle(0x8c93a0, 1);
  for (let i = 0; i < 200; i++)
    g.fillRect(Math.floor(rnd() * (w / 2)) * 2, Math.floor(rnd() * (h / 2)) * 2, 2, 2);
  g.fillStyle(0x2a3038, 1);
  for (let i = 0; i < 140; i++)
    g.fillRect(Math.floor(rnd() * (w / 2)) * 2, Math.floor(rnd() * (h / 2)) * 2, 2, 2);
  // 폭격 그을음 — 옅게 깔아 분위기만, 거대한 색차로 보이지 않도록 톤다운
  g.fillStyle(0x2a2a30, 0.18);
  g.fillEllipse(220, 280, 130, 70);
  g.fillEllipse(620, 380, 160, 80);
  g.fillEllipse(820, 180, 100, 60);
}

// ── 우크라이나 데코 sprite (각 32x40 정도) ──────────────────────
// 모래주머니 — 바리케이드용 (32x24)
function drawSandbag(g) {
  g.clear();
  // 4개 자루 더미
  g.fillStyle(0x9a7a4a, 1); g.fillRect(2, 8, 28, 14);
  g.fillStyle(0xb8966a, 1); g.fillRect(2, 8, 28, 4);
  g.fillStyle(0xa68856, 1); g.fillRect(6, 0, 20, 10);
  g.fillStyle(0xc8aa78, 1); g.fillRect(6, 0, 20, 3);
  // 자루 사이 그림자
  g.fillStyle(0x6a4a2a, 1);
  g.fillRect(0, 22, 32, 2); g.fillRect(15, 0, 2, 8);
  // 매듭
  g.fillStyle(0x5a3a1a, 1);
  g.fillRect(14, 9, 4, 3); g.fillRect(10, 1, 3, 2); g.fillRect(20, 1, 3, 2);
}

// 부서진 벤치 (40x24)
function drawBrokenBench(g) {
  g.clear();
  // 좌측 다리·시트 (정상)
  g.fillStyle(0x5a4a32, 1); g.fillRect(2, 14, 6, 10);    // 좌측 다리
  g.fillStyle(0x8a6a3a, 1); g.fillRect(0, 10, 22, 4);    // 시트 (왼쪽 반)
  g.fillStyle(0x6a4f2a, 1); g.fillRect(0, 12, 22, 2);    // 시트 그림자
  // 우측 (부서진)
  g.fillStyle(0x8a6a3a, 1); g.fillRect(24, 12, 10, 4);   // 시트 조각
  g.fillStyle(0x5a4a32, 1);
  g.fillRect(28, 18, 6, 6);   // 비스듬한 다리 조각
  g.fillRect(34, 20, 4, 4);   // 떨어진 조각
}

// 우크라이나 국기 (24x32)
function drawUkraineFlag(g) {
  g.clear();
  // 깃대
  g.fillStyle(0x6a5a3a, 1); g.fillRect(2, 0, 3, 32);
  // 깃발 배경 (파랑·노랑)
  g.fillStyle(0x4a9adf, 1); g.fillRect(5, 2, 18, 10);
  g.fillStyle(0xffd24a, 1); g.fillRect(5, 12, 18, 10);
  // 음영
  g.fillStyle(0x2a6acf, 1); g.fillRect(5, 2, 18, 2);
  g.fillStyle(0xe7b840, 1); g.fillRect(5, 20, 18, 2);
}

// 평화 비둘기 동상 (40x40, 받침대 위 비둘기)
function drawPeaceDove(g) {
  g.clear();
  // 받침대
  g.fillStyle(0x6e7480, 1); g.fillRect(8, 30, 24, 10);
  g.fillStyle(0x8c93a0, 1); g.fillRect(8, 30, 24, 2);
  g.fillStyle(0x4e5660, 1); g.fillRect(8, 38, 24, 2);
  // 명판 (Peace)
  g.fillStyle(0x3a4350, 1); g.fillRect(11, 33, 18, 4);
  // 비둘기 몸 (흰)
  g.fillStyle(0xeae6d8, 1); g.fillRect(12, 14, 18, 10);
  g.fillRect(18, 8, 10, 8);  // 머리
  g.fillStyle(0xffffff, 1); g.fillRect(13, 14, 14, 3);
  // 날개
  g.fillStyle(0xcfcbbb, 1); g.fillRect(10, 16, 8, 5);
  // 부리·눈
  g.fillStyle(0xffa84a, 1); g.fillRect(28, 11, 4, 2);
  g.fillStyle(0x1a1a1a, 1); g.fillRect(24, 11, 2, 2);
  // 올리브 가지 (부리에)
  g.fillStyle(0x6a8a4a, 1); g.fillRect(32, 11, 6, 2); g.fillRect(34, 9, 2, 2);
}

// UN 텐트 (40x36)
function drawUNTent(g) {
  g.clear();
  // 텐트 본체 (흰)
  g.fillStyle(0xdfe5ea, 1); g.fillRect(2, 12, 36, 22);
  // 지붕 (계단 삼각형)
  g.fillRect(4, 8, 32, 4);
  g.fillRect(8, 4, 24, 4);
  g.fillRect(14, 0, 12, 4);
  // 텐트 바닥 그림자
  g.fillStyle(0x9aa6ad, 1); g.fillRect(2, 32, 36, 2);
  // UN 파란 라벨
  g.fillStyle(0x4a9adf, 1); g.fillRect(10, 14, 20, 10);
  // UN 흰 글자
  g.fillStyle(0xffffff, 1);
  g.fillRect(13, 16, 2, 6); g.fillRect(15, 20, 2, 2); g.fillRect(17, 16, 2, 6);  // U
  g.fillRect(22, 16, 2, 6); g.fillRect(24, 18, 2, 2); g.fillRect(26, 16, 2, 6);  // N
  // 입구 (검은 사각)
  g.fillStyle(0x14202c, 1); g.fillRect(16, 26, 8, 8);
}

// 부서진 차량 (40x24)
function drawBrokenCar(g) {
  g.clear();
  // 차체
  g.fillStyle(0x4a4a52, 1); g.fillRect(2, 8, 36, 12);
  g.fillStyle(0x5a5a62, 1); g.fillRect(2, 8, 36, 3);
  // 지붕 (한쪽 찌그러진)
  g.fillStyle(0x5a5a62, 1); g.fillRect(10, 2, 20, 8);
  g.fillRect(28, 4, 4, 4);  // 찌그러진 부분
  // 창문 (깨진)
  g.fillStyle(0x2a3a4a, 1); g.fillRect(12, 4, 6, 4);
  g.fillStyle(0x1a1a1a, 1); g.fillRect(20, 4, 4, 4);  // 깨진 창
  // 바퀴 (한쪽 빠짐)
  g.fillStyle(0x1a1a1a, 1); g.fillRect(6, 18, 6, 6);
  g.fillStyle(0x6a5a4a, 1); g.fillRect(28, 19, 6, 4);  // 부서진 바퀴 잔해
  // 연료 새는 흔적
  g.fillStyle(0x4a3a2a, 0.6); g.fillRect(20, 22, 18, 2);
}

// 폭격 자국 (크레이터, 40x16)
function drawCrater(g) {
  g.clear();
  // 어두운 타원 모양 패치
  g.fillStyle(0x1a1a1a, 1); g.fillEllipse(20, 8, 36, 12);
  g.fillStyle(0x2a2a30, 1); g.fillEllipse(20, 8, 28, 8);
  // 가장자리 돌무더기
  g.fillStyle(0x5a626d, 1);
  g.fillRect(2, 6, 4, 4); g.fillRect(34, 6, 4, 4);
  g.fillRect(8, 1, 3, 3); g.fillRect(28, 1, 3, 3);
  g.fillRect(12, 12, 3, 3); g.fillRect(24, 13, 3, 3);
}

// ── 벽: 사암 + 청록 타일 띠 (도트, 40x40) ───────────────────────
const WALL_PAL = {
  '.': null,
  w: 0xc09a60, W: 0xd5ad75, d: 0x8a6a32, k: 0x523915,
  T: 0x2f8a76, t: 0x216857, L: 0x49b39a, Y: 0xefe2b6,
};

const WALL_MAP = [
  'WWWWWWWWWWWWWWWWWWWW',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwwwwwww',
  'kkkkkkkkkkkkkkkkkkkk',
  'TTTTTTTTTTTTTTTTTTTT',
  'TtTYTTtTYTTTtTYTTtTT',
  'TtTYTTtTYTTTtTYTTtTT',
  'TTTTTTTTTTTTTTTTTTTT',
  'kkkkkkkkkkkkkkkkkkkk',
  'wwwwwwwwwwwwwwwwwwww',
  'WWWWWWWWWWWWWWWWWWWW',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwkkkwwwwwwwkkkkwww',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwwwwwww',
  'kkkkkkkkkkkkkkkkkkkk',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwwkkkwwwwwwwkkkww',
  'wwwwwwwwwwwwwwwwwwww',
  'dddddddddddddddddddd',
];

function drawWall(g) {
  g.clear();
  pxMap(g, WALL_MAP, WALL_PAL, 2);
}

// ── intro(UN 본부 사무실) 전용 벽 — 책장(책 등이 꽂힌 목재 책장), 40x40 ──
//   기존 'wall'(나무 블록)이 사무실 느낌이 아니라는 피드백 반영. intro에서만 사용.
function drawWallOffice(g) {
  g.clear();
  // 짙은 목재 프레임 + 안쪽 칸
  g.fillStyle(0x4a3318, 1); g.fillRect(0, 0, 40, 40);
  g.fillStyle(0x6b4a28, 1); g.fillRect(3, 3, 34, 34);
  g.fillStyle(0x83602f, 1); g.fillRect(3, 3, 34, 2);    // 윗면 하이라이트
  g.fillStyle(0x2e2010, 1); g.fillRect(0, 38, 40, 2); g.fillRect(38, 0, 2, 40);  // 그림자
  g.fillStyle(0x3a2812, 1); g.fillRect(3, 20, 34, 3);   // 가운데 선반(2단)
  // 책 등 — 색색의 세로 책 (윗칸 y5~19, 아랫칸 y24~37). 결정적 패턴.
  const COLORS = [0xb23a3a, 0x3a6ea5, 0xcaa23a, 0x4a8a5a, 0x8a4a8a, 0xc06a2a, 0x3a7a9a, 0xa86a2a];
  const shelf = (bottom, top, seed) => {
    let x = 5, i = seed;
    while (x < 35) {
      const w = 3 + (i % 2);
      const h = (bottom - top) - (i % 3);
      g.fillStyle(COLORS[i % COLORS.length], 1);
      g.fillRect(x, bottom - h, w, h);
      x += w + 1; i++;
    }
  };
  shelf(19, 5, 0);
  shelf(37, 24, 3);
}

// ── intro 외벽(테두리) — 사무실 벽(블루그레이 패널, UN 톤). 책장과 구분. 40x40 ──
function drawWallPanel(g) {
  g.clear();
  g.fillStyle(0x3f5a73, 1); g.fillRect(0, 0, 40, 40);   // 블루그레이 벽
  g.fillStyle(0x49667f, 1); g.fillRect(2, 2, 36, 36);   // 안쪽 면
  g.fillStyle(0x5b7a93, 1); g.fillRect(2, 2, 36, 2);    // 상단 하이라이트
  g.fillStyle(0x2c4054, 1);                              // 외곽 음영
  g.fillRect(0, 0, 40, 2); g.fillRect(0, 38, 40, 2);
  g.fillRect(0, 0, 2, 40); g.fillRect(38, 0, 2, 40);
  g.fillStyle(0x37516a, 1); g.fillRect(19, 6, 2, 28);   // 가운데 패널 분할
}

// ── 외벽 (우크라이나): 회색 콘크리트 + 균열, 40x40 ────────────
function drawWallKyiv(g) {
  g.clear();
  // 기본 회색 콘크리트
  g.fillStyle(0x6e7480, 1); g.fillRect(0, 0, 40, 40);
  // 밝은 윗면 (반사광)
  g.fillStyle(0x8c93a0, 1); g.fillRect(0, 0, 40, 4);
  // 벽돌 격자 — 윗줄/아랫줄 어긋남
  g.fillStyle(0x4e5660, 1);
  g.fillRect(0, 19, 40, 2);  // 가로 줄눈
  g.fillRect(19, 0, 2, 19);  // 윗단 세로 줄눈 (중앙)
  g.fillRect(9, 21, 2, 18);  // 아랫단 세로 줄눈 (어긋)
  g.fillRect(29, 21, 2, 18);
  // 어두운 그림자
  g.fillStyle(0x3a3a40, 1);
  g.fillRect(0, 38, 40, 2); g.fillRect(38, 0, 2, 40);
  // 균열·금
  g.fillStyle(0x2a2a30, 1);
  g.fillRect(6, 7, 6, 1); g.fillRect(12, 8, 4, 1);
  g.fillRect(26, 12, 8, 1); g.fillRect(14, 28, 5, 1);
  g.fillRect(30, 30, 6, 1);
  // 콘크리트 얼룩
  g.fillStyle(0x5a5e68, 1);
  g.fillRect(4, 12, 4, 4); g.fillRect(24, 4, 6, 3); g.fillRect(14, 24, 8, 4);
}

// 현장 배경 (800 x 440)
const BG_W = 960, BG_H = 440;

// ── 항구(폴백): 도트 풍경 ───────────────────────────────────────
function drawPort(g) {
  g.clear();
  // 하늘 단계 (그라데이션 대신 색 띠)
  const bands = [
    [0,   60,  0x3a4a6a],
    [60,  60,  0x6c5a7a],
    [120, 60,  0xc78060],
    [180, 50,  0xe49a5e],
  ];
  bands.forEach(([y, h, c]) => { g.fillStyle(c, 1); g.fillRect(0, y, BG_W, h); });
  // 해 (블록 8각)
  g.fillStyle(0xf8dca0, 1);
  g.fillRect(640, 140, 40, 20); g.fillRect(630, 150, 60, 8);
  g.fillRect(648, 130, 24, 8);  g.fillRect(648, 162, 24, 8);
  // 먼 산 (계단)
  g.fillStyle(0x6a4f6a, 1);
  for (let i = 0; i < 6; i++) g.fillRect(40 + i*30, 200 - i*14, 124 - i*16, 40);
  for (let i = 0; i < 6; i++) g.fillRect(380 + i*30, 200 - i*12, 124 - i*16, 40);
  // 바다
  g.fillStyle(0x2a607a, 1); g.fillRect(0, 230, BG_W, 140);
  g.fillStyle(0x356f8a, 1);
  for (let i = 0; i < 32; i++) g.fillRect((i*53) % BG_W, 250 + (i*23 % 100), 28, 4);
  // 부두
  g.fillStyle(0x6a5b42, 1); g.fillRect(0, 370, BG_W, 70);
  g.fillStyle(0x594c36, 1);
  for (let i = 0; i < 20; i++) g.fillRect(i*42, 370, 4, 70);
  // 유조선
  g.fillStyle(0x2c3a48, 1); g.fillRect(240, 286, 300, 78);
  g.fillStyle(0x39495a, 1); g.fillRect(240, 286, 300, 12);
  g.fillStyle(0x9a3b3b, 1); g.fillRect(240, 352, 300, 12);
  g.fillStyle(0xdfe5ea, 1); g.fillRect(470, 250, 56, 42);
  g.fillStyle(0x9aa6ad, 1); g.fillRect(492, 232, 6, 20);
  g.fillStyle(0xe7b066, 1);
  for (let i = 0; i < 6; i++) g.fillRect(270 + i*45, 304, 22, 18);
  // 저장 탱크 (블록 원통)
  [[610, 240, 70, 100], [690, 256, 56, 84]].forEach(([x, y, w, h]) => {
    g.fillStyle(0xcfcbbb, 1); g.fillRect(x, y, w, h);
    g.fillStyle(0xb6b1a0, 1); g.fillRect(x + Math.floor(w*0.6), y, Math.floor(w*0.3), h);
    g.fillStyle(0x8f8a78, 1); g.fillRect(x, y, w, 4); g.fillRect(x, y+h-4, w, 4);
  });
  // 어선
  g.fillStyle(0x7a5326, 1); g.fillRect(55, 320, 135, 42);
  g.fillStyle(0x5a3d1c, 1); g.fillRect(115, 280, 6, 42);
  g.fillStyle(0xeae0cf, 1);
  for (let i = 0; i < 5; i++) g.fillRect(121, 280 + i*8, 47 - i*9, 8);
  // 부두 위 흩어진 소금 결정 (흰 점들)
  g.fillStyle(0xeae6d8, 1);
  for (let i = 0; i < 36; i++) g.fillRect((i*47) % BG_W, 376 + (i*9 % 56), 3, 3);
  // 깨진 닻 (좌측 부두)
  g.fillStyle(0x2a3a4a, 1);
  g.fillRect(210, 384, 4, 30); g.fillRect(196, 410, 32, 4);
  g.fillRect(196, 408, 4, 8); g.fillRect(224, 408, 4, 8);
  // 멀리 마을 주민 실루엣 (부두 끝)
  g.fillStyle(0x1a1a1a, 1);
  g.fillRect(750, 354, 4, 12); g.fillRect(751, 346, 2, 8);
  g.fillRect(770, 358, 4, 10); g.fillRect(771, 350, 2, 8);
  // 떠다니는 모래 먼지 (수평선 위)
  g.fillStyle(0xc89866, 0.4);
  for (let i = 0; i < 14; i++) g.fillEllipse(60 + i*70, 210 + (i*7 % 12), 50, 6);
}

// ── 해협 감시소: 도트 ──────────────────────────────────────────
function drawStrait(g) {
  g.clear();
  g.fillStyle(0x2b465f, 1); g.fillRect(0, 0, BG_W, 290);
  g.fillStyle(0x1a2735, 1); g.fillRect(0, 290, BG_W, 150);
  g.fillStyle(0x223445, 1);
  for (let i = 0; i < 10; i++) g.fillRect(i*80, 290, 76, 4);
  // 창
  g.fillStyle(0x355f78, 1); g.fillRect(470, 70, 290, 150);
  g.fillStyle(0x244557, 1); g.fillRect(470, 150, 290, 70);
  g.fillStyle(0x0e1626, 1);
  g.fillRect(466, 66, 298, 6); g.fillRect(466, 218, 298, 6);
  g.fillRect(466, 66, 6, 158); g.fillRect(758, 66, 6, 158);
  // 해도
  g.fillStyle(0xefe6cc, 1); g.fillRect(56, 84, 250, 190);
  g.fillStyle(0xcaa572, 1); g.fillRect(66, 94, 230, 58); g.fillRect(66, 212, 230, 56);
  g.fillStyle(0x4a8597, 1); g.fillRect(66, 150, 230, 64);
  g.fillStyle(0xb23b3b, 1);
  for (let i = 0; i < 28; i++) g.fillRect(78 + i*8, 180, 4, 4);
  g.fillRect(290, 178, 8, 8);
  g.fillStyle(0x8a99a0, 1);
  for (let j = 1; j < 5; j++) for (let i = 0; i < 28; i++)
    g.fillRect(72 + i*8, 94 + j*36, 4, 2);
  // 등대
  g.fillStyle(0xe7dfca, 1); g.fillRect(388, 80, 42, 200);
  g.fillStyle(0xb23b3b, 1); g.fillRect(388, 112, 42, 20); g.fillRect(388, 168, 42, 20);
  g.fillStyle(0x2b343a, 1); g.fillRect(384, 76, 50, 10);
  g.fillStyle(0xfff0b0, 1); g.fillRect(398, 60, 24, 16); g.fillRect(402, 56, 16, 4);
  // 빛줄기 (블록)
  g.fillStyle(0xf2e7a8, 0.16);
  for (let i = 0; i < 24; i++) g.fillRect(420 + i*14, 60 + i*4, 16, 8);
  // 군함
  g.fillStyle(0x46545d, 1); g.fillRect(540, 300, 220, 48);
  g.fillStyle(0x394650, 1); g.fillRect(600, 270, 80, 32);
  g.fillStyle(0x2b343a, 1); g.fillRect(632, 244, 8, 28);
  g.fillStyle(0x5a6770, 1);
  g.fillRect(540, 348, 220, 4); g.fillRect(560, 352, 200, 4);
  // 해도 위 1960·1990·2020 연도 마커 (작은 사각, 흰)
  g.fillStyle(0xffe9b8, 1);
  g.fillRect(82, 100, 12, 3); g.fillRect(82, 158, 12, 3); g.fillRect(82, 216, 12, 3);
  // 노트 (해도 위, 펼친 책)
  g.fillStyle(0xeae6d8, 1); g.fillRect(118, 218, 50, 36);
  g.fillStyle(0xcfcbbb, 1); g.fillRect(118, 218, 50, 4);
  g.fillStyle(0x8a99a0, 1);
  for (let i = 0; i < 5; i++) g.fillRect(124, 226 + i*5, 38, 1);
  // 연필
  g.fillStyle(0xc89866, 1); g.fillRect(170, 236, 24, 4);
  g.fillStyle(0x2a2a2a, 1); g.fillRect(192, 236, 4, 4);
  // 등대 빛 더 진하게 + 추가 빛줄기
  g.fillStyle(0xfff0b0, 0.25);
  for (let i = 0; i < 18; i++) g.fillRect(420 + i*16, 75 + i*6, 18, 6);
  // 인물 실루엣 (지도실 한쪽)
  g.fillStyle(0x1a1a1a, 1);
  g.fillRect(330, 280, 8, 24); g.fillRect(330, 264, 12, 18);
}

// ── 마을 시장: 도트 ────────────────────────────────────────────
function drawMarket(g) {
  g.clear();
  g.fillStyle(0xd9a866, 1); g.fillRect(0, 0, BG_W, 200);
  g.fillStyle(0xc8a05f, 1); g.fillRect(0, 200, BG_W, 100);
  g.fillStyle(0xb6904f, 1);
  for (let i = 0; i < 10; i++) g.fillRect(i*84, 0, 2, 300);
  g.fillStyle(0xb88c4d, 1); g.fillRect(0, 300, BG_W, 140);
  g.fillStyle(0x9c7639, 1);
  for (let i = 0; i < 100; i++)
    g.fillRect((i*71) % BG_W, 320 + (i*13 % 100), 4, 4);
  // 천막 (블록 계단 지붕)
  for (let i = 0; i < 6; i++) {
    const x = i*145;
    g.fillStyle(i%2 ? 0xc0392b : 0xe7dcc0, 1);
    g.fillRect(x, 110, 145, 8);
    g.fillRect(x+8, 118, 130, 6);
    g.fillRect(x+18, 124, 110, 6);
    g.fillRect(x+32, 130, 80, 6);
    g.fillRect(x+50, 136, 44, 6);
    g.fillStyle(0x6a5326, 1); g.fillRect(x+60, 120, 5, 50);
  }
  g.fillStyle(0x000000, 0.12); g.fillRect(0, 168, BG_W, 16);
  // 기름값 안내판
  g.fillStyle(0x6a5326, 1); g.fillRect(148, 350, 22, 70);
  g.fillStyle(0x1b232c, 1); g.fillRect(86, 168, 150, 192);
  g.fillStyle(0xe8b86a, 1);
  g.fillRect(86, 168, 150, 4); g.fillRect(86, 356, 150, 4);
  g.fillRect(86, 168, 4, 192); g.fillRect(232, 168, 4, 192);
  g.fillStyle(0xff6b3d, 1); g.fillRect(102, 190, 118, 30);
  g.fillStyle(0xffd24a, 1); g.fillRect(102, 232, 118, 30);
  g.fillStyle(0x9ad0ff, 1); g.fillRect(102, 274, 118, 30);
  g.fillStyle(0xe7332b, 1);
  g.fillRect(196, 312, 14, 4); g.fillRect(200, 308, 6, 4); g.fillRect(202, 304, 4, 4);
  // 주민들 (블록 캐릭터)
  [[378, 220, 0x46395a], [430, 232, 0x574968], [332, 236, 0x3e3350]]
    .forEach(([x, y, c]) => {
      g.fillStyle(c, 1);
      g.fillRect(x-16, y-16, 32, 32);
      g.fillRect(x-20, y+16, 40, 100);
    });
  // 라디오
  g.fillStyle(0x6b4f2a, 1); g.fillRect(576, 236, 158, 116);
  g.fillStyle(0x4a3719, 1); g.fillRect(576, 236, 158, 14);
  g.fillStyle(0x1b232c, 1); g.fillRect(598, 274, 32, 32);
  g.fillStyle(0x8a99a0, 1); g.fillRect(606, 282, 16, 16);
  g.fillStyle(0xcfcbbb, 1); g.fillRect(656, 258, 60, 56);
  g.fillStyle(0x2b343a, 1); g.fillRect(700, 200, 4, 40);
  g.fillStyle(0xffe9a8, 1); g.fillRect(696, 192, 12, 12);
  // 면화 자루 (시장 한쪽, "Made in Cotton" 무역의 흔적)
  g.fillStyle(0xeae6d8, 1);
  g.fillRect(800, 320, 40, 50); g.fillRect(820, 290, 40, 40);
  g.fillStyle(0xcfcbbb, 1); g.fillRect(800, 320, 40, 4); g.fillRect(820, 290, 40, 4);
  g.fillStyle(0x6a4a2a, 1); g.fillRect(810, 332, 20, 2);  // 매듭
  g.fillRect(830, 302, 20, 2);
  // 옷 진열대 (오른쪽 끝, 청바지·티셔츠)
  g.fillStyle(0x4a6a8a, 1); g.fillRect(880, 270, 24, 36);
  g.fillStyle(0xc0392b, 1); g.fillRect(908, 268, 22, 32);
  g.fillStyle(0x6a8a4a, 1); g.fillRect(932, 274, 24, 30);
  // 진료소 십자 마크 (좌측 위)
  g.fillStyle(0xc0392b, 1);
  g.fillRect(140, 76, 24, 6); g.fillRect(149, 64, 6, 30);
  // 멀리 의사·환자 실루엣
  g.fillStyle(0x1a1a1a, 1);
  g.fillRect(166, 220, 5, 14); g.fillRect(167, 212, 3, 8);   // 의사
  g.fillRect(180, 226, 5, 12); g.fillRect(181, 218, 3, 8);   // 환자
  // 소금 먼지 흩날림 (시장 전체)
  g.fillStyle(0xeae6d8, 0.5);
  for (let i = 0; i < 28; i++) g.fillRect((i*49) % BG_W, 100 + (i*11 % 200), 2, 2);
}

// ── 우크라이나 1: 폭격받은 학교 ───────────────────────────────
function drawSchool(g) {
  g.clear();
  // 흐린 회색 하늘 (전쟁의 우울)
  g.fillStyle(0x4a5566, 1); g.fillRect(0, 0, BG_W, 80);
  g.fillStyle(0x5a6678, 1); g.fillRect(0, 80, BG_W, 60);
  g.fillStyle(0x6b7a8c, 1); g.fillRect(0, 140, BG_W, 60);
  // 검게 그을린 연기 자국
  g.fillStyle(0x2a2a2a, 0.4);
  for (let i = 0; i < 6; i++) g.fillRect(120 + i*120, 30, 60, 50 + i*10);
  // 부서진 학교 외벽 (벽돌 + 구멍)
  g.fillStyle(0x8a6b54, 1); g.fillRect(0, 200, BG_W, 180);
  g.fillStyle(0x6a4b34, 1);
  for (let y = 200; y < 380; y += 20) {
    for (let x = (y/20 % 2) * 30; x < BG_W; x += 60) g.fillRect(x, y, 58, 2);
  }
  // 큰 구멍 (폭격 자국) — 중앙 + 우측
  g.fillStyle(0x14202c, 1);
  g.fillRect(380, 220, 140, 100);
  g.fillRect(750, 240, 100, 80);
  // 구멍 가장자리 부서진 벽돌
  g.fillStyle(0x6a4b34, 1);
  for (let i = 0; i < 8; i++) g.fillRect(370 + i*8, 320 + (i%2)*4, 6, 6);
  for (let i = 0; i < 6; i++) g.fillRect(745 + i*8, 320 + (i%2)*4, 6, 6);
  // 좌측 칠판 (남은 흔적, 우크라이나어 "...мир..." 평화)
  g.fillStyle(0x2a3a30, 1); g.fillRect(40, 220, 280, 130);
  g.fillStyle(0x8c6a44, 1); g.fillRect(38, 218, 284, 4); g.fillRect(38, 350, 284, 4);
  g.fillStyle(0x38493e, 1); g.fillRect(40, 220, 280, 6);
  // 칠판 위 분필 글자 — мир (평화)
  g.fillStyle(0xeae6d8, 0.85);
  // м
  g.fillRect(80, 260, 4, 30); g.fillRect(100, 260, 4, 30); g.fillRect(84, 264, 4, 4); g.fillRect(92, 268, 4, 4); g.fillRect(96, 264, 4, 4);
  // и
  g.fillRect(120, 260, 4, 30); g.fillRect(140, 260, 4, 30); g.fillRect(124, 282, 4, 4); g.fillRect(132, 274, 4, 4);
  // р
  g.fillRect(160, 260, 4, 40); g.fillRect(164, 260, 16, 4); g.fillRect(176, 260, 4, 16); g.fillRect(164, 276, 16, 4);
  // 칠판 끝에 점점점
  g.fillStyle(0xeae6d8, 0.5); g.fillRect(220, 280, 4, 4); g.fillRect(230, 280, 4, 4); g.fillRect(240, 280, 4, 4);
  // 흩어진 책상·의자 (전경, 부서진)
  g.fillStyle(0x6a4f2a, 1);
  g.fillRect(540, 360, 40, 22); g.fillRect(550, 348, 4, 14);  // 책상 1
  g.fillRect(610, 370, 36, 16); g.fillRect(620, 362, 4, 10);  // 의자 1 (쓰러진)
  g.fillRect(680, 360, 32, 22); g.fillRect(700, 348, 4, 14);  // 책상 2
  // 작은 신발 (빨강) — 슬픈 디테일
  g.fillStyle(0xc0392b, 1); g.fillRect(870, 386, 18, 8); g.fillRect(870, 380, 12, 6);
  // 우크라이나 국기 잔재 — 무너진 깃대 + 노랑·파랑 천 조각
  g.fillStyle(0x6a4b34, 1); g.fillRect(450, 80, 4, 110);
  g.fillStyle(0x4a9adf, 1); g.fillRect(440, 96, 30, 14);
  g.fillStyle(0xffd24a, 1); g.fillRect(440, 110, 30, 14);
  // 바닥 파편
  g.fillStyle(0x8a6b54, 1);
  for (let i = 0; i < 30; i++) g.fillRect((i*53) % BG_W, 400 + (i*13 % 30), 6, 4);
  // 멀리 보이는 작은 인물 실루엣 (남은 주민/구조대원)
  g.fillStyle(0x2a2a2a, 1);
  g.fillRect(800, 200, 6, 12); g.fillRect(802, 192, 4, 8);   // 인물 1
  g.fillRect(150, 100, 5, 10); g.fillRect(151, 92, 3, 8);    // 인물 2 (좌측 멀리)
  // 잔해 위 유리 파편 (반짝임)
  g.fillStyle(0xeae6d8, 0.7);
  for (let i = 0; i < 14; i++) g.fillRect(40 + (i*60) % 880, 376 + (i*7 % 24), 2, 2);
  // 우크라이나어 'УКРАЇНА' 벽 흔적 (스텐실 풍, 좌측 외벽)
  g.fillStyle(0x4a9adf, 0.45);
  g.fillRect(38, 360, 4, 4); g.fillRect(46, 360, 4, 4); g.fillRect(54, 360, 4, 4);
  g.fillRect(38, 366, 4, 4); g.fillRect(46, 366, 4, 4); g.fillRect(54, 366, 4, 4);
  // 연기 기둥 (구멍에서 올라옴)
  g.fillStyle(0x4a4a52, 0.35);
  for (let i = 0; i < 8; i++) {
    g.fillEllipse(450 + (i % 2) * 8, 170 - i*18, 60 + i*4, 22);
  }
}

// ── 우크라이나 2: 오데사 곡물 항구 ────────────────────────────
function drawGrainPort(g) {
  g.clear();
  // 흑해 노을·구름 하늘
  g.fillStyle(0x3a3a4a, 1); g.fillRect(0, 0, BG_W, 60);
  g.fillStyle(0x5a4a5a, 1); g.fillRect(0, 60, BG_W, 60);
  g.fillStyle(0x7a5a4a, 1); g.fillRect(0, 120, BG_W, 50);
  g.fillStyle(0xa07050, 1); g.fillRect(0, 170, BG_W, 30);
  // 갈매기
  g.fillStyle(0xffffff, 1);
  [[120, 60], [240, 90], [380, 50], [720, 80], [840, 70]].forEach(([x, y]) => {
    g.fillRect(x, y, 8, 2); g.fillRect(x-2, y+2, 12, 2);
  });
  // 흑해 (어두운 물)
  g.fillStyle(0x1a2a3a, 1); g.fillRect(0, 200, BG_W, 130);
  g.fillStyle(0x2a3a4a, 1);
  for (let i = 0; i < 40; i++) g.fillRect((i*37) % BG_W, 220 + (i*17 % 100), 22, 3);
  // 부두 (콘크리트)
  g.fillStyle(0x5a5a5a, 1); g.fillRect(0, 330, BG_W, 110);
  g.fillStyle(0x4a4a4a, 1);
  for (let i = 0; i < 24; i++) g.fillRect(i*42, 330, 4, 110);
  // 멈춘 곡물선 (큰 회색 컨테이너 선박)
  g.fillStyle(0x3a4a5a, 1); g.fillRect(180, 250, 480, 90);
  g.fillStyle(0x4a5a6a, 1); g.fillRect(180, 250, 480, 14);
  g.fillStyle(0xc0392b, 1); g.fillRect(180, 326, 480, 14);  // 하단 빨간 줄
  // 선실 (선수)
  g.fillStyle(0xdfe5ea, 1); g.fillRect(550, 200, 80, 52);
  g.fillStyle(0x9aa6ad, 1); g.fillRect(570, 178, 8, 24);
  g.fillStyle(0x14202c, 1);
  g.fillRect(560, 214, 16, 12); g.fillRect(584, 214, 16, 12); g.fillRect(608, 214, 16, 12);
  // 컨테이너 (선상에 색색)
  const cont = [0xc89866, 0x4a9adf, 0xc0392b, 0xe7c168, 0x6a8a4a, 0xc89866];
  cont.forEach((c, i) => {
    g.fillStyle(c, 1);
    g.fillRect(200 + i*55, 220, 50, 30);
  });
  // 곡물 자루 산 (우측 부두 위)
  g.fillStyle(0xb88a4e, 1);
  g.fillRect(700, 290, 60, 40); g.fillRect(720, 270, 50, 24);
  g.fillRect(740, 250, 36, 24); g.fillRect(750, 234, 24, 18);
  g.fillStyle(0xe7c168, 1);
  g.fillRect(704, 296, 10, 8); g.fillRect(722, 276, 10, 8); g.fillRect(746, 256, 8, 8);
  // 가격 게시판 (좌측, 가격이 치솟는 그래프)
  g.fillStyle(0x6a5326, 1); g.fillRect(78, 350, 18, 70);
  g.fillStyle(0x1b232c, 1); g.fillRect(40, 260, 130, 100);
  g.fillStyle(0xe8b86a, 1);
  g.fillRect(40, 260, 130, 3); g.fillRect(40, 357, 130, 3);
  g.fillRect(40, 260, 3, 100); g.fillRect(167, 260, 3, 100);
  // 그래프 — 가파르게 상승
  g.fillStyle(0xc0392b, 1);
  const pts = [[50, 340], [62, 332], [74, 326], [86, 314], [98, 300], [110, 288], [122, 276], [134, 268], [146, 266]];
  pts.forEach(([x, y]) => g.fillRect(x, y, 8, 4));
  // 빈 항구 식당 (배경 우측 끝)
  g.fillStyle(0x4a3a2a, 1); g.fillRect(870, 280, 80, 50);
  g.fillStyle(0xffd24a, 0.4); g.fillRect(884, 296, 22, 16);
  // 갈매기 추가 (더 풍부하게)
  g.fillStyle(0xffffff, 1);
  [[60, 140], [200, 150], [320, 130], [560, 110], [640, 150], [900, 130]].forEach(([x, y]) => {
    g.fillRect(x, y, 8, 2); g.fillRect(x-2, y+2, 12, 2);
  });
  // 항구 노동자 실루엣 (부두 위, 멀리)
  g.fillStyle(0x1a1a1a, 1);
  g.fillRect(120, 318, 5, 12); g.fillRect(121, 310, 3, 8);   // 인물 1 (좌측)
  g.fillRect(820, 320, 5, 12); g.fillRect(821, 312, 3, 8);   // 인물 2 (우측, 식당 옆)
  // 가격 게시판에 'WHEAT $/T' 라벨 흔적
  g.fillStyle(0xe8b86a, 0.8);
  g.fillRect(55, 270, 3, 6); g.fillRect(60, 270, 3, 6); g.fillRect(65, 270, 3, 6);   // W H E
  g.fillRect(55, 280, 3, 6); g.fillRect(60, 280, 3, 6); g.fillRect(65, 280, 3, 6);   // A T
  // 곡식 자루에 떨어진 알갱이 (부두 바닥)
  g.fillStyle(0xe7c168, 1);
  for (let i = 0; i < 24; i++) g.fillRect(700 + (i*7) % 80, 332 + (i*5 % 8), 2, 2);
  // 멀리 배 한 척 (수평선 너머)
  g.fillStyle(0x2a2a3a, 1); g.fillRect(20, 195, 28, 6);
  g.fillRect(28, 188, 4, 8);
}

// ── 우크라이나 3: 키이우 지하철 대피소 ────────────────────────
function drawShelter(g) {
  g.clear();
  // 어두운 지하 배경
  g.fillStyle(0x14202c, 1); g.fillRect(0, 0, BG_W, BG_H);
  // 천장 (둥근 아치 흉내)
  g.fillStyle(0x2a3a4a, 1); g.fillRect(0, 0, BG_W, 50);
  for (let i = 0; i < BG_W; i += 40) g.fillRect(i, 40, 36, 6);
  // 형광등 (밝은 사각 + 빛)
  g.fillStyle(0xfff0b0, 1);
  [80, 280, 480, 680, 880].forEach(x => {
    g.fillRect(x, 20, 60, 8);
    g.fillStyle(0xfff0b0, 0.15); g.fillRect(x-10, 28, 80, 30); g.fillStyle(0xfff0b0, 1);
  });
  // 타일 벽 (밝은 회색, 격자)
  g.fillStyle(0xdfe5ea, 1); g.fillRect(0, 60, BG_W, 220);
  g.fillStyle(0x9aa6ad, 1);
  for (let y = 60; y < 280; y += 30) g.fillRect(0, y, BG_W, 2);
  for (let x = 0; x < BG_W; x += 50) g.fillRect(x, 60, 2, 220);
  // 플랫폼 가장자리 (안전선 노랑)
  g.fillStyle(0xffd24a, 1); g.fillRect(0, 280, BG_W, 6);
  // 플랫폼 바닥 (어두운 콘크리트)
  g.fillStyle(0x4a4a4a, 1); g.fillRect(0, 286, BG_W, 154);
  g.fillStyle(0x3a3a3a, 1);
  for (let i = 0; i < 20; i++) g.fillRect((i*47) % BG_W, 300 + (i*23 % 100), 10, 4);
  // 매트·이불 더미 (좌측, 파랑 담요)
  g.fillStyle(0x6fb7d6, 1); g.fillRect(60, 360, 140, 60);
  g.fillStyle(0x4a8597, 1); g.fillRect(60, 360, 140, 8);
  g.fillStyle(0xeae6d8, 1); g.fillRect(80, 340, 50, 22);  // 베개
  g.fillStyle(0xc89866, 1); g.fillRect(150, 350, 24, 16); // 작은 곰인형
  g.fillStyle(0x4a3a2a, 1); g.fillRect(154, 354, 4, 4); g.fillRect(166, 354, 4, 4); // 눈
  // 공습 경보 게시판 (중앙, 빨간 점·지도)
  g.fillStyle(0x1b232c, 1); g.fillRect(310, 110, 200, 130);
  g.fillStyle(0xe8b86a, 1);
  g.fillRect(310, 110, 200, 3); g.fillRect(310, 237, 200, 3);
  g.fillRect(310, 110, 3, 130); g.fillRect(507, 110, 3, 130);
  // 지도 + 빨간 점
  g.fillStyle(0x2a3a4a, 1); g.fillRect(322, 130, 174, 92);
  g.fillStyle(0xc0392b, 1);
  [[340, 150], [380, 170], [420, 160], [460, 190], [480, 175], [355, 200], [400, 210]].forEach(([x, y]) =>
    g.fillRect(x, y, 6, 6));
  // UN/NGO 구호 박스 (우측 중앙)
  g.fillStyle(0xc8a05f, 1); g.fillRect(600, 200, 100, 80);
  g.fillStyle(0xa8804f, 1); g.fillRect(600, 200, 100, 8);
  g.fillStyle(0x4a9adf, 1); g.fillRect(620, 224, 60, 36);  // 파란 UN 라벨
  g.fillStyle(0xffffff, 1);
  // UN 글자
  g.fillRect(628, 232, 4, 20); g.fillRect(636, 232, 4, 4); g.fillRect(636, 244, 4, 8);
  g.fillRect(648, 232, 4, 20); g.fillRect(652, 244, 4, 4); g.fillRect(656, 232, 4, 20);
  g.fillRect(668, 232, 4, 20); g.fillRect(672, 236, 4, 4); g.fillRect(676, 240, 4, 4); g.fillRect(680, 244, 4, 4);
  // 어린이 그림 (우측 벽, 종이 4장 + 비둘기·태양 패턴)
  [[770, 90], [840, 90], [770, 160], [840, 160]].forEach(([x, y]) => {
    g.fillStyle(0xeae6d8, 1); g.fillRect(x, y, 56, 56);
    g.fillStyle(0xffd24a, 1); g.fillRect(x+8, y+8, 12, 12);  // 태양
    g.fillStyle(0xffffff, 1); g.fillRect(x+24, y+24, 24, 6); g.fillRect(x+30, y+18, 12, 6); // 비둘기 몸+머리
    g.fillStyle(0xc89866, 1); g.fillRect(x+42, y+22, 4, 4); // 부리
  });
  // 앉아 있는 피난민 실루엣 (매트 옆, 무릎 안고 앉은 모습)
  g.fillStyle(0x3a4a5a, 1);
  g.fillRect(210, 340, 16, 24);          // 몸통
  g.fillRect(212, 326, 12, 14);          // 머리
  g.fillStyle(0x2a3a4a, 1);
  g.fillRect(206, 350, 24, 8);           // 어깨/팔 더 넓게
  // 책가방 (매트 옆)
  g.fillStyle(0xc0392b, 1); g.fillRect(240, 380, 22, 22);
  g.fillStyle(0x8a2a1a, 1); g.fillRect(240, 380, 22, 4);    // 어깨끈 흔적
  g.fillRect(244, 392, 4, 6);                                // 버클
  // 우크라이나어 슬로건 포스터 'МИР·PEACE·평화' — 좌측 벽 상단
  g.fillStyle(0xeae6d8, 1); g.fillRect(80, 110, 110, 36);
  g.fillStyle(0x4a9adf, 1); g.fillRect(80, 110, 110, 4);
  g.fillStyle(0xffd24a, 1); g.fillRect(80, 142, 110, 4);
  g.fillStyle(0x1a1a1a, 1);
  // M И P  (МИР)
  g.fillRect(96, 122, 3, 14); g.fillRect(116, 122, 3, 14); g.fillRect(100, 124, 3, 3); g.fillRect(108, 128, 3, 3); g.fillRect(112, 124, 3, 3);
  g.fillRect(124, 122, 3, 14); g.fillRect(140, 122, 3, 14); g.fillRect(128, 130, 12, 3);
  g.fillRect(148, 122, 3, 14); g.fillRect(152, 122, 12, 3); g.fillRect(160, 122, 3, 8); g.fillRect(152, 130, 12, 3);
  // 평화 비둘기 작은 모형 (매트 위)
  g.fillStyle(0xffffff, 1);
  g.fillRect(120, 342, 12, 4); g.fillRect(126, 338, 6, 4);
  g.fillStyle(0xffa84a, 1); g.fillRect(132, 339, 3, 2);
  // 천장에서 떨어지는 먼지 (공습 진동 흔적)
  g.fillStyle(0xdfe5ea, 0.5);
  for (let i = 0; i < 18; i++) g.fillRect((i*53) % BG_W, 70 + (i*7 % 80), 2, 2);
}

// ── 입구 표지판 (40x40) ─────────────────────────────────────────
const PORTAL_PAL = {
  '.': null, Y: 0xf4c542, y: 0x7a5b10, w: 0xffffff, k: 0x2a1a06,
};
const PORTAL_MAP = [
  'YYYYYYYYYYYYYYYYYYYY',
  'YyyyyyyyyyyyyyyyyyyY',
  'YyykkkkkkkyyyyyyyyyY',
  'YykkwwwwwkkyyyyyyyyY',
  'YykwwwwwwwkyyyyyyyyY',
  'YykwwwWwwwkyyyyyyyyY',
  'YykwwwwwwwkyyyyyyyyY',
  'YykwwwwwwwkyyyyyyyyY',
  'YykkwwwwwkkyyyyyyyyY',
  'YyykkkkkkkkyyyyyyyyY',
  'YyyyyyyyykkkyyyyyyyY',
  'YyyyyyyyyyykkkyyyyyY',
  'YyyyyyyyyyyyykkkyyyY',
  'YyyyyyyyyyyyyyykkkyY',
  'YyyyyyyyyyyyyyyykkkY',
  'YyyyyyyyyyyyyyyyykkY',
  'YyyyyyyyyyyyyyyyyykY',
  'YyyyyyyyyyyyyyyyyyyY',
  'YyyyyyyyyyyyyyyyyyyY',
  'YYYYYYYYYYYYYYYYYYYY',
];
function drawPortal(g) {
  g.clear();
  pxMap(g, PORTAL_MAP, PORTAL_PAL, 2);
}

// ── 조사 커서 (40x40) — 돋보기 ─────────────────────────────────
// 렌즈(흰 외곽 + 갈색 테두리 + 옅은 유리 + 반사) + 우하향 갈색 손잡이
function drawMagnifier(g) {
  g.clear();
  const cx = 16, cy = 16; // 렌즈 중심을 좌상단 쪽으로 — 손잡이 공간 확보
  const r = 11;

  // 손잡이 (우하향 대각선) — 흰 외곽 + 갈색 본체
  g.lineStyle(5, 0xffffff, 1);
  g.lineBetween(cx + r - 1, cy + r - 1, 35, 35);
  g.lineStyle(3, 0x5a3a1a, 1);
  g.lineBetween(cx + r - 1, cy + r - 1, 35, 35);

  // 렌즈 외곽 흰 링 (어두운 배경에서도 잘 보임)
  g.lineStyle(3, 0xffffff, 1);
  g.strokeCircle(cx, cy, r + 1.5);
  // 렌즈 테두리 갈색
  g.lineStyle(2.5, 0x5a3a1a, 1);
  g.strokeCircle(cx, cy, r);
  // 렌즈 유리 (반투명 하늘색)
  g.fillStyle(0xb8e0ff, 0.4);
  g.fillCircle(cx, cy, r - 1);
  // 반사 하이라이트 (상단 좌측)
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx - 4, cy - 4, 2.5);
}

// ── UN 우편함 (40x52) — 학생이 편지 쓰러 가는 입구 ─────────────
const MAILBOX_PAL = {
  '.': null,
  B: 0x1e4a8a, // UN 블루
  b: 0x122e57,
  W: 0xffffff,
  y: 0xf0c542, // 우편물 노랑
  k: 0x1a1228,
  s: 0x6a4f2a, // 기둥
};
const MAILBOX_MAP = [
  // 20 cols x 26 rows, scale 2 = 40x52
  '....BBBBBBBBBBBB....',
  '...BWWWWWWWWWWWWB...',
  '..BWWWWWWWWWWWWWWB..',
  '..BWWBBWWWWWWBBWWB..',
  '..BWBBBBWWWWBBBBWB..',
  '..BWBBBBWWWWBBBBWB..',
  '..BWWBBWWWWWWBBWWB..',
  '..BWWWWWWWWWWWWWWB..',
  '.BBBBBBBBBBBBBBBBBB.',
  '.ByyyyyyyykkyyyyyyB.',  // 우편 슬롯
  '.ByyyyyyyykkyyyyyyB.',
  '.BBBBBBBBBBBBBBBBBB.',
  '.BWWWUUUUUUUUUUWWWB.',  // UN 글자 자리 (지폐 같은 띠)
  '.BWWWWWWWWWWWWWWWWB.',
  '.BWWWWWWWWWWWWWWWWB.',
  '.BBBBBBBBBBBBBBBBBB.',
  '......ssssssss......',
  '......ssssssss......',
  '......ssssssss......',
  '......ssssssss......',
  '......ssssssss......',
  '......ssssssss......',
  '.....ssssssssss.....',
  '....ssssssssssss....',
  '...ssssssssssssss...',
  '..kkkkkkkkkkkkkkkk..',
];
// U 문자를 W로 매핑(노란색 띠) — 단순 처리
function drawMailbox(g) {
  g.clear();
  pxMap(g, MAILBOX_MAP, Object.assign({}, MAILBOX_PAL, { U: 0xf0c542 }), 2);
}

// ── 모스크 (130x150) ────────────────────────────────────────────
function drawMosque(g) {
  g.clear();
  // 본체
  g.fillStyle(0xc9a36b, 1); g.fillRect(18, 78, 94, 70);
  g.fillStyle(0xb38c52, 1); g.fillRect(18, 78, 94, 6);
  g.fillStyle(0xa97f3f, 1); g.fillRect(18, 144, 94, 4);
  // 옆 작은 탑
  g.fillStyle(0xc9a36b, 1);
  g.fillRect(22, 60, 16, 88); g.fillRect(92, 60, 16, 88);
  g.fillStyle(0xb38c52, 1); g.fillRect(22, 60, 16, 4); g.fillRect(92, 60, 16, 4);
  // 옆 돔 (계단형)
  [[22, 48], [92, 48]].forEach(([x, ytop]) => {
    g.fillStyle(0x2f8a76, 1);
    g.fillRect(x, ytop + 8, 16, 12);
    g.fillRect(x + 2, ytop + 4, 12, 8);
    g.fillRect(x + 4, ytop, 8, 8);
    g.fillStyle(0x49b39a, 1); g.fillRect(x + 4, ytop + 4, 4, 6);
  });
  // 중앙 큰 돔
  g.fillStyle(0xc9a36b, 1); g.fillRect(50, 66, 30, 14);
  g.fillStyle(0x2f8a76, 1);
  g.fillRect(40, 50, 50, 16);
  g.fillRect(44, 38, 42, 12);
  g.fillRect(50, 28, 30, 10);
  g.fillRect(56, 20, 18, 8);
  g.fillStyle(0x49b39a, 1);
  g.fillRect(46, 38, 8, 12); g.fillRect(52, 28, 6, 10); g.fillRect(58, 20, 4, 8);
  g.fillStyle(0x216857, 1);
  g.fillRect(78, 50, 12, 16); g.fillRect(76, 38, 10, 12); g.fillRect(72, 28, 8, 10);
  // 금빛 첨탑
  g.fillStyle(0xe8c45a, 1);
  g.fillRect(62, 8, 6, 14); g.fillRect(58, 4, 14, 6);
  g.fillStyle(0xb88e2e, 1); g.fillRect(64, 4, 4, 6);
  // 아치 문
  g.fillStyle(0x4a3a22, 1);
  g.fillRect(58, 116, 14, 32); g.fillRect(56, 112, 18, 6);
  g.fillStyle(0x2a1f10, 1); g.fillRect(56, 110, 18, 4);
  // 창들
  g.fillStyle(0x6fa8a6, 1);
  g.fillRect(32, 100, 12, 16); g.fillRect(86, 100, 12, 16);
  g.fillStyle(0x456e6d, 1);
  g.fillRect(32, 100, 12, 2); g.fillRect(86, 100, 12, 2);
}

// ── 미너렛 (44x152) ─────────────────────────────────────────────
function drawMinaret(g) {
  g.clear();
  g.fillStyle(0xc9a36b, 1); g.fillRect(14, 18, 16, 132);
  g.fillStyle(0xb38c52, 1); g.fillRect(14, 18, 4, 132);
  g.fillStyle(0x2f8a76, 1);
  for (let y = 30; y < 140; y += 26) g.fillRect(14, y, 16, 6);
  // 발코니
  g.fillStyle(0x2f8a76, 1); g.fillRect(8, 40, 28, 7);
  g.fillStyle(0x216857, 1); g.fillRect(8, 47, 28, 2);
  // 캡(계단형 돔)
  g.fillStyle(0xc9a36b, 1); g.fillRect(16, 14, 12, 6);
  g.fillStyle(0x2f8a76, 1);
  g.fillRect(12, 8, 20, 8); g.fillRect(14, 4, 16, 4); g.fillRect(18, 0, 8, 4);
  // 첨탑
  g.fillStyle(0xe8c45a, 1); g.fillRect(20, 0, 4, 4);
}

// ── 흙집 (100x100) ──────────────────────────────────────────────
function drawHouse(g) {
  g.clear();
  g.fillStyle(0xcaa470, 1); g.fillRect(10, 42, 80, 56);
  g.fillStyle(0xb38c52, 1); g.fillRect(10, 42, 80, 6);
  g.fillStyle(0xa97f3f, 1); g.fillRect(10, 94, 80, 4);
  // 작은 돔 (계단)
  g.fillStyle(0xc9a36b, 1); g.fillRect(38, 26, 24, 16);
  g.fillStyle(0x2f8a76, 1);
  g.fillRect(30, 18, 40, 8);
  g.fillRect(34, 10, 32, 8);
  g.fillRect(40, 4, 20, 6);
  g.fillStyle(0x49b39a, 1); g.fillRect(38, 10, 4, 8); g.fillRect(44, 4, 4, 6);
  // 아치 문
  g.fillStyle(0x4a3a22, 1); g.fillRect(42, 70, 16, 28); g.fillRect(40, 66, 20, 6);
  // 창
  g.fillStyle(0x6fa8a6, 1); g.fillRect(18, 58, 13, 13); g.fillRect(69, 58, 13, 13);
  g.fillStyle(0x456e6d, 1); g.fillRect(18, 58, 13, 2); g.fillRect(69, 58, 13, 2);
}

// ── 야자수 (60x86) ──────────────────────────────────────────────
function drawPalm(g) {
  g.clear();
  // 줄기 (마디진 사각 픽셀)
  g.fillStyle(0x6b4a26, 1); g.fillRect(26, 36, 8, 48);
  g.fillStyle(0x5a3d1f, 1);
  for (let y = 40; y < 84; y += 6) g.fillRect(26, y, 8, 2);
  g.fillStyle(0x4a3219, 1); g.fillRect(26, 36, 2, 48);
  // 잎 (계단형 블록)
  g.fillStyle(0x2f6d33, 1);
  g.fillRect(10, 30, 16, 4); g.fillRect(6, 26, 14, 4); g.fillRect(4, 22, 10, 4);
  g.fillRect(34, 30, 16, 4); g.fillRect(40, 26, 14, 4); g.fillRect(46, 22, 10, 4);
  g.fillRect(22, 16, 16, 4); g.fillRect(24, 12, 12, 4); g.fillRect(26, 8, 8, 4);
  g.fillRect(18, 38, 24, 4);
  // 잎 하이라이트
  g.fillStyle(0x4d9c4f, 1);
  g.fillRect(28, 14, 2, 18); g.fillRect(12, 28, 6, 2); g.fillRect(40, 28, 6, 2);
}

// ── 분수 (80x56) ────────────────────────────────────────────────
function drawFountain(g) {
  g.clear();
  // 그림자
  g.fillStyle(0x000000, 0.20); g.fillRect(8, 48, 64, 6);
  // 수반 (계단형 타원 근사)
  g.fillStyle(0xc9a36b, 1);
  g.fillRect(4, 34, 72, 16);
  g.fillRect(8, 30, 64, 6);
  g.fillRect(12, 26, 56, 4);
  g.fillStyle(0xb38c52, 1); g.fillRect(4, 46, 72, 4);
  // 물
  g.fillStyle(0x2f9bc4, 1); g.fillRect(14, 30, 52, 14);
  g.fillStyle(0x7fd4ec, 1); g.fillRect(14, 30, 52, 2);
  g.fillRect(20, 36, 8, 2); g.fillRect(40, 38, 12, 2);
  // 기둥
  g.fillStyle(0xc9a36b, 1); g.fillRect(36, 12, 8, 18);
  g.fillStyle(0xb38c52, 1); g.fillRect(36, 12, 2, 18);
  // 물줄기
  g.fillStyle(0x7fd4ec, 1);
  g.fillRect(38, 4, 4, 8);
  g.fillRect(30, 14, 4, 6); g.fillRect(46, 14, 4, 6);
  g.fillRect(28, 22, 2, 4); g.fillRect(50, 22, 2, 4);
}

// (옛 draw 함수들은 도트 버전으로 위에 이미 정의되어 있음)

// ── 부팅: 모든 텍스처/애니메이션 생성 ────────────────────────────
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // (옛 photo_port/strait/market 등록은 실제로는 assets/photos/* 아래에 있으므로
    //  중복 등록을 제거. 새 경로는 아래 portraits/photos 블록에서 처리.)
    // Kenney CC0 스프라이트시트 (16x16, 1px 간격)
    this.load.spritesheet('tiny_town',
      'assets/sprites/kenney_tiny_town/Tilemap/tilemap.png',
      { frameWidth: 16, frameHeight: 16, spacing: 1 });
    this.load.spritesheet('tiny_dungeon',
      'assets/sprites/kenney_tiny_dungeon/Tilemap/tilemap.png',
      { frameWidth: 16, frameHeight: 16, spacing: 1 });
    // 캐릭터 초상 일러스트 (있으면 대화창에서 우선 사용)
    this.load.image('portrait_fisher',   'assets/portraits/fisher.png');
    this.load.image('portrait_merchant', 'assets/portraits/merchant.png');
    this.load.image('portrait_doctor',   'assets/portraits/doctor.png');
    this.load.image('portrait_aijoli',   'assets/portraits/aijoli.png');
    this.load.image('portrait_kateryna', 'assets/portraits/kateryna.png');
    // 우크라이나 시민 일러스트
    this.load.image('portrait_teacher',   'assets/portraits/teacher.png');
    this.load.image('portrait_farmer',    'assets/portraits/farmer.png');
    this.load.image('portrait_volunteer', 'assets/portraits/volunteer.png');
    // 팔레스타인 안내인·시민 일러스트
    this.load.image('portrait_karim',     'assets/portraits/karim.png');
    this.load.image('portrait_abbas',     'assets/portraits/abbas.png');
    this.load.image('portrait_rachel',    'assets/portraits/rachel.png');
    this.load.image('portrait_hana',      'assets/portraits/hana.png');
    // 인트로(튜토리얼) 일러스트 — 추후 제공. 미존재 시 fallback 자동
    this.load.image('portrait_hansen',    'assets/portraits/hansen.png');
    this.load.image('portrait_james',     'assets/portraits/james.png');
    // UN 깃발 아이콘 (CaseSelectScene intro 카드)
    this.load.image('flag_un',            'assets/icons/flag_un.png');
    // 주인공 일러스트 (있으면 도트 generateTexture 대신 사용)
    this.load.image('hero_down_0', 'assets/character/hero_down_0.png');
    this.load.image('hero_down_1', 'assets/character/hero_down_1.png');
    this.load.image('hero_up_0',   'assets/character/hero_up_0.png');
    this.load.image('hero_up_1',   'assets/character/hero_up_1.png');
    this.load.image('hero_side_0', 'assets/character/hero_side_0.png');
    this.load.image('hero_side_1', 'assets/character/hero_side_1.png');
    // 타이틀 화면 배경 (UN 본부 픽셀 아트)
    this.load.image('title_bg', 'assets/maps/title_bg.png');
    // 아랄해 조사 장소 배경 사진 (Flow 픽셀 아트)
    this.load.image('photo_un_hq',  'assets/photos/photo_un_hq.png');
    this.load.image('photo_port',   'assets/photos/photo_port.png');
    this.load.image('photo_strait', 'assets/photos/photo_strait.png');
    this.load.image('photo_market', 'assets/photos/photo_market.png');
    // 우크라이나 조사 장소 배경 사진
    this.load.image('photo_school',     'assets/photos/photo_school.png');
    this.load.image('photo_grain_port', 'assets/photos/photo_grain_port.png');
    this.load.image('photo_shelter',    'assets/photos/photo_shelter.png');
    // 팔레스타인 조사 장소 배경 사진
    this.load.image('photo_olive',   'assets/photos/photo_olive.png');
    this.load.image('photo_oldcity', 'assets/photos/photo_oldcity.png');
    this.load.image('photo_unrwa',   'assets/photos/photo_unrwa.png');
    // 사건 선택 화면용 세계 지도 (Wikimedia Commons, Public Domain)
    // — invert 처리해 "흰 대륙 + 투명 바다" 형태. 다크 UI에 그대로 합성.
    this.load.image('world_map', 'assets/maps/world.png');
    this.load.on('loaderror', () => { /* 누락 파일은 그냥 건너뜀 */ });
  }

  create() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // hero_* 텍스처: PNG 일러스트가 로드됐으면 그대로 사용, 없으면 도트 fallback
    ['down', 'up', 'side'].forEach(dir => {
      for (let f = 0; f < 2; f++) {
        const key = `hero_${dir}_${f}`;
        if (!this.textures.exists(key)) {
          drawHero(g, dir, f);
          g.generateTexture(key, 32, 40);
        }
      }
    });

    for (let f = 0; f < 2; f++) {
      drawChild(g, f);
      g.generateTexture(`kid_${f}`, 32, 32);
    }

    // ground 텍스처는 16:10 캔버스(960x600) 전체로 생성
    // — 옛 MH(=520)는 4:3 잔재로 하단 80px이 빈 캔버스로 노출되던 문제 해결
    drawGround(g, GAME_W, GAME_H);
    g.generateTexture('ground', GAME_W, GAME_H);
    // 우크라이나 사건용 회색 콘크리트 바닥
    drawConcrete(g, GAME_W, GAME_H);
    g.generateTexture('ground_concrete', GAME_W, GAME_H);
    drawWall(g);
    g.generateTexture('wall', TILE, TILE);
    // intro(UN 본부) 전용 책장 벽(내부 블록) + 사무실 벽(테두리)
    drawWallOffice(g);
    g.generateTexture('wall_office', TILE, TILE);
    drawWallPanel(g);
    g.generateTexture('wall_office_panel', TILE, TILE);
    // 우크라이나 사건용 외벽 (회색 콘크리트 + 균열)
    drawWallKyiv(g);
    g.generateTexture('wall_kyiv', TILE, TILE);

    // 우크라이나 데코 sprite (사건 2 WorldScene 용)
    g.clear(); drawSandbag(g);      g.generateTexture('sandbag', 32, 24);
    g.clear(); drawBrokenBench(g);  g.generateTexture('broken_bench', 40, 24);
    g.clear(); drawUkraineFlag(g);  g.generateTexture('ua_flag', 24, 32);
    g.clear(); drawPeaceDove(g);    g.generateTexture('peace_dove', 40, 40);
    g.clear(); drawUNTent(g);       g.generateTexture('un_tent', 40, 36);
    g.clear(); drawBrokenCar(g);    g.generateTexture('broken_car', 40, 24);
    g.clear(); drawCrater(g);       g.generateTexture('crater', 40, 16);

    // 우측 16:10 영역용 도트 데코 — 사라진 바다 주제
    // (1) 녹슨 작은 보트 — 사막에 박힌 옛 어선
    g.clear();
    g.fillStyle(0x6a4a32, 1); g.fillRect(2, 14, 28, 4);    // 선체 바닥
    g.fillStyle(0x8a6634, 1); g.fillRect(0, 10, 32, 4);    // 선체 위
    g.fillStyle(0x4a2e16, 1); g.fillRect(4, 18, 24, 4);    // 그림자
    g.fillStyle(0x8b5a2e, 1); g.fillRect(14, 2, 2, 12);    // 돛대
    g.fillStyle(0xb88a4e, 1); g.fillRect(8, 4, 8, 6);      // 찢어진 돛
    g.fillStyle(0xffffff, 0.3); g.fillRect(2, 12, 4, 2);   // 하이라이트
    g.generateTexture('rusty_boat', 32, 24);

    // (2) 말라붙은 우물 — 둥근 돌담, 안은 비어 어두움
    g.clear();
    g.fillStyle(0x5a4a3a, 1); g.fillRect(4, 8, 24, 18);    // 우물 본체
    g.fillStyle(0x4a3a2a, 1); g.fillRect(4, 8, 24, 4);     // 윗 테두리
    g.fillStyle(0x0a0a0a, 1); g.fillRect(8, 12, 16, 12);   // 내부 어둠
    g.fillStyle(0x7a6a5a, 1);                              // 돌 무늬
    g.fillRect(6, 14, 2, 2); g.fillRect(10, 18, 2, 2);
    g.fillRect(20, 16, 2, 2); g.fillRect(24, 20, 2, 2);
    g.fillStyle(0x4a3a2a, 1); g.fillRect(2, 24, 28, 4);    // 그림자
    g.generateTexture('dry_well', 32, 28);

    // (3) 모래 더미 — 작은 둔덕
    g.clear();
    g.fillStyle(0xd9a866, 1);
    g.fillRect(4, 10, 24, 8); g.fillRect(8, 6, 16, 4); g.fillRect(12, 4, 8, 2);
    g.fillStyle(0xc89866, 1);
    g.fillRect(6, 14, 20, 4); g.fillRect(10, 10, 12, 2);
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(10, 6, 4, 1); g.fillRect(16, 4, 2, 1);      // 햇빛 반사
    g.generateTexture('sand_pile', 32, 20);

    drawPort(g);   g.generateTexture('bg_port', BG_W, BG_H);
    drawStrait(g); g.generateTexture('bg_strait', BG_W, BG_H);
    drawMarket(g); g.generateTexture('bg_market', BG_W, BG_H);
    // 우크라이나 사건 배경 3종 (사건 2 — 깨어진 평화)
    drawSchool(g);    g.generateTexture('bg_school', BG_W, BG_H);
    drawGrainPort(g); g.generateTexture('bg_grain_port', BG_W, BG_H);
    drawShelter(g);   g.generateTexture('bg_shelter', BG_W, BG_H);
    drawMosque(g);   g.generateTexture('mosque', 130, 150);
    drawMinaret(g);  g.generateTexture('minaret', 44, 152);
    drawHouse(g);    g.generateTexture('house', 100, 100);
    drawPalm(g);     g.generateTexture('palm', 60, 86);
    drawFountain(g); g.generateTexture('fountain', 80, 56);
    drawPortal(g); g.generateTexture('portal', 40, 40);
    drawMailbox(g); g.generateTexture('mailbox', 40, 52);
    drawMagnifier(g); g.generateTexture('magnifier', 40, 40);
    g.destroy();

    const mk = (key, frames, rate) => this.anims.create({
      key,
      frames: frames.map(t => ({ key: t })),
      frameRate: rate,
      repeat: -1
    });
    mk('walk_down', ['hero_down_0', 'hero_down_1'], 7);
    mk('walk_up', ['hero_up_0', 'hero_up_1'], 7);
    mk('walk_side', ['hero_side_0', 'hero_side_1'], 7);
    mk('kid_idle', ['kid_0', 'kid_1'], 2);

    // 교사 대시보드용 텔레메트리 연결 시도 (실패해도 게임은 정상)
    if (window.Telemetry) {
      try { window.Telemetry.init(); } catch (e) { /* 무시 */ }
    }

    // 폰트가 로드된 뒤에 첫 씬을 시작 (한글 글리프 누락 방지)
    const startNext = () => this.scene.start('TitleScene');
    if (document.fonts && document.fonts.ready) {
      Promise.all([
        document.fonts.load('20px MonaS'),
        document.fonts.load('bold 32px MonaS'),
      ]).then(startNext).catch(startNext);
    } else {
      startNext();
    }
  }
}

// ── 타이틀 화면 ─────────────────────────────────────────────────
class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    // 디버그 — ?scene=SceneName&case=caseId&loc=locId 로 진입 (헤드리스 캡처용)
    const m  = /[?&]scene=([A-Za-z]+)/.exec(location.search || '');
    const cm = /[?&]case=([a-z]+)/.exec(location.search || '');
    const lm = /[?&]loc=([a-z_]+)/.exec(location.search || '');
    if (cm) {
      this.registry.set('caseId', cm[1]);
      try { setCase(cm[1]); setStory(cm[1]); setCitizens(cm[1]); } catch (e) { /* 데이터 없는 사건이면 default */ }
    }
    if (lm) { this.registry.set('invLoc', lm[1]); }
    if (m) { this.scene.start(m[1].endsWith('Scene') ? m[1] : m[1] + 'Scene'); return; }
    setCfgBarVisible(true);   // 타이틀에선 참가 설정 바 표시
    this.cameras.main.fadeIn(320, 0, 0, 0);  // 부드러운 페이드인
    const W = GAME_W, H = GAME_H;

    // 배경 — UN 본부 픽셀 아트 (PNG가 있으면 사용, 없으면 그라데이션 fallback)
    if (this.textures.exists('title_bg')) {
      this.add.image(W / 2, H / 2, 'title_bg').setDisplaySize(W, H).setDepth(0);
    } else {
      // Fallback — 옛 노을 그라데이션 + 도시 실루엣
      const sky = this.add.graphics();
      sky.fillGradientStyle(0x1b2a4a, 0x1b2a4a, 0xe8915a, 0xf2b56b, 1);
      sky.fillRect(0, 0, W, 360);
      sky.fillStyle(0xf6d79b, 1); sky.fillCircle(400, 320, 70);
      sky.fillStyle(0xf2b56b, 0.5); sky.fillCircle(400, 320, 110);
      sky.fillStyle(0x214b63, 1); sky.fillRect(0, 360, W, 240);
      sky.fillStyle(0xf6d79b, 0.25);
      for (let i = 0; i < 26; i++)
        sky.fillRect((i * 71) % W, 380 + (i * 53 % 200), 36, 3);
      sky.fillStyle(0x141d33, 1);
      for (let i = 0; i < 13; i++)
        sky.fillRect(i * 76, 300 - (i * 47 % 90), 64, 130);
      sky.fillRect(150, 180, 14, 180);
      sky.fillCircle(157, 178, 12);
      sky.fillRect(640, 200, 70, 160);
      sky.fillCircle(675, 200, 38);
      sky.fillRect(870, 220, 12, 140);
      sky.fillCircle(876, 218, 10);
      sky.fillStyle(0x0e1626, 1);
      sky.fillRect(550, 430, 200, 34);
      sky.fillRect(640, 408, 36, 22);
    }

    // 타이틀 패널
    panel(this, 480, 150, 560, 150, 0x10202e, 0xe8b86a);
    // 메인 타이틀 — 계획서 공식 제목 그대로 (P.E.A.C.E. 로 통하는 국제 분쟁 탐구)
    this.add.text(480, 118, 'P.E.A.C.E.', {
      fontFamily: FONT_TITLE, fontSize: '52px', color: '#ffe9b8', fontStyle: 'bold',
      stroke: '#3a2410', strokeThickness: 8
    }).setOrigin(0.5);
    this.add.text(480, 180, '— 통(通)하는 국제 분쟁 탐구하기 —', {
      fontFamily: FONT, fontSize: '20px', color: '#f0c98a'
    }).setOrigin(0.5);

    // (옛 아이졸리 도트 캐릭터는 새 UN 본부 배경과 톤이 달라 제거)

    const start = this.add.text(480, 560, '▶  클릭하여 시작', {
      fontFamily: FONT, fontSize: '24px', color: '#ffffff',
      backgroundColor: '#0008', padding: { x: 16, y: 8 }
    }).setOrigin(0.5);
    this.tweens.add({
      targets: start, alpha: 0.35, duration: 700,
      yoyo: true, repeat: -1
    });

    // 새 게임 / 이어하기 — localStorage 세이브 여부에 따라 분기
    let started = false;
    // 새 게임 본 흐름 — 입력 모달 확인 후 또는 폴백
    const startNewGameFlow = () => {
      if (started) return;
      started = true;
      if (window.SFX) window.SFX.stopBGM();   // 메인화면 BGM 정지
      // 새 게임은 옛 세이브 삭제 — 사건 선택 시 새로운 진행 시작
      clearGameState();
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('CaseSelectScene');
      });
    };
    const newGame = () => {
      if (started) return;
      // HTML 입력 모달 사용 (window.PEACE.openNewGameModal) — 학생 이름·교실 입력
      if (window.PEACE && typeof window.PEACE.openNewGameModal === 'function') {
        window.PEACE.openNewGameModal(() => startNewGameFlow());
      } else {
        // 폴백 — 모달 없으면 그냥 진행
        startNewGameFlow();
      }
    };
    const resumeGame = () => {
      if (started) return;
      started = true;
      if (window.SFX) window.SFX.stopBGM();   // 메인화면 BGM 정지
      const save = loadGameState();
      if (!save) { started = false; newGame(); return; }
      // registry 복원 후 곧장 WorldScene으로 진입 (BriefingScene 건너뜀)
      restoreRegistryFromSave(this.registry, save);
      // 활성 사건 데이터 동기화 — caseId 기반으로 cases.js·dialogue.js·quizzes.js 재설정
      // (이 호출이 빠지면 default 'aralsea' 데이터로 NPC·단서가 표시되는 버그 발생)
      const cid = this.registry.get('caseId');
      if (cid) {
        try { setCase(cid); } catch (e) {}
        try { setStory(cid); } catch (e) {}
        try { setCitizens(cid); } catch (e) {}
      }
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('WorldScene');
      });
    };

    // 시작 버튼 — 항상 "새 게임 / 이어하기" 두 버튼을 함께 표시.
    // 세이브가 없으면 이어하기는 흐리게 + 클릭 시 안내 토스트.
    const canResume = hasResumableSave();
    // 짧은 안내 토스트
    const titleToast = (msg) => {
      const tx = this.add.text(480, 470, msg, {
        fontFamily: FONT, fontSize: '15px', color: '#ffe9b8',
        backgroundColor: '#000000bb', padding: { x: 12, y: 7 }
      }).setOrigin(0.5).setDepth(5000);
      this.tweens.add({ targets: tx, alpha: 0, delay: 1200, duration: 600,
        onComplete: () => tx.destroy() });
    };
    // 좌: 새 게임 (항상 활성)
    fancyButton(this, 310, 525, 240, 44, '🔄  새 게임', newGame,
      { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' });
    // 우: 이어하기 (세이브 있을 때만 활성)
    if (canResume) {
      const save = loadGameState();
      const SHORT_TITLES = {
        intro:     '튜토리얼',
        aralsea:   '아랄해',
        ukraine:   '우크라이나',
        palestine: '팔레스타인',
      };
      const caseLabel = (save && SHORT_TITLES[save.caseId]) || '진행 중';
      const stageNum = (save && save.stage) || 1;
      fancyButton(this, 620, 525, 300, 44,
        '▶  이어하기 · ' + caseLabel + ' · ' + stageNum + '단계',
        resumeGame,
        { base: 0x3a5a7a, hover: 0x4c6f93, edge: 0x6fb7d6, text: '#dff1ff' });
    } else {
      // 세이브 없음 — 흐린 이어하기 (클릭 시 안내)
      fancyButton(this, 620, 525, 300, 44, '▶  이어하기',
        () => titleToast('저장된 게임이 없어요 — 먼저 새 게임을 시작하세요'),
        { base: 0x2a3138, hover: 0x353d45, edge: 0x55626c, text: '#8a96a0' });
    }
    // 사운드 토글 — 우상단 (클릭 시 음향 설정: 음소거 + BGM·효과음 음량)
    addMuteToggle(this, 936, 24);

    // 메인화면 배경음 (루프) — 자동재생 차단 시 첫 클릭/키 입력에서 시작
    if (window.SFX) window.SFX.playBGM(BGM_TITLE);

    // Space/Enter 만 허용 — Shift/Caps 등 사고 방지
    this.input.keyboard.once('keydown-SPACE', newGame);
    this.input.keyboard.once('keydown-ENTER', newGame);
    start.setVisible(false);
    // (옛 모달 튜토리얼은 HHH-4에서 제거됨 —
    //  지금은 CaseSelectScene의 "튜토리얼 — UN 본부" 카드 → BriefingScene → WorldScene(caseId='intro')이 그 역할을 대신함)
  }
}

// ══════════════════════════════════════════════════════════════
//  Credits / 라이선스 출처 화면 — 대회 출품 필수
// ══════════════════════════════════════════════════════════════
class CreditsScene extends Phaser.Scene {
  constructor() { super('CreditsScene'); }

  create() {
    setCfgBarVisible(true);
    this.cameras.main.setBackgroundColor('#10202e');

    panel(this, 480, 60, 880, 80, 0x1a2a3a, 0xe8b86a);
    this.add.text(480, 60, '에셋·라이선스 출처', {
      fontFamily: FONT_TITLE, fontSize: '28px', color: '#ffe9b8',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    panel(this, 480, 330, 900, 450, 0x101a26, 0xc9a36b);

    // 좌측 단 — 게임·폰트·스프라이트
    const left = [
      '【게임】',
      '  P.E.A.C.E.',
      '  — 통(通)하는 국제 분쟁 탐구하기',
      '  교육 주제: UNESCO 세계시민교육',
      '  (인지·정서·행동) 3대 영역',
      '',
      '【폰트】',
      '  MonaS (Monad ABXY)',
      '   · MonaS12TextKR — 본문',
      '   · MonaS12-Bold — 제목·강조',
      '   · 라이선스: SIL OFL',
      '',
      '【스프라이트 — Kenney.nl, CC0】',
      '  Tiny Town — 환경 데코',
      '  Tiny Dungeon — 마을 주민',
      '  1-Bit Pack — 8비트 보조',
      '  Pixel Platformer — 보조',
      '  출처: kenney.nl (CC0)',
    ].join('\n');

    // 우측 단 — 사진·엔진·이론·제작
    const right = [
      '【사진】',
      '  무이낙(Moynaq) 픽셀아트',
      '  이미지 (학습자료용)',
      '  세계지도: Wikimedia',
      '  Commons (Public Domain)',
      '',
      '【사운드】',
      '  Web Audio API로 코드 생성',
      '  8비트 칩튠 효과음 8종',
      '  (외부 파일 없음, 라이선스 0)',
      '',
      '【게임 엔진】',
      '  Phaser 3 (MIT License)',
      '  Electron (MIT License)',
      '',
      '【교육 이론 참고】',
      '  UNESCO, Global Citizenship',
      '  Education (2015)',
      '  박미정(2022), 다문화사회의',
      '  세계시민교육 방안 연구',
      '',
      '【제작】',
      '  공도중학교 — 안성교육지원청',
      '  대표  염태철 교사',
      '  공동  이문호 교사',
      '  공동  이용빈 교사',
      '',
      '【출품】',
      '  제73회 경기도교육자료전',
      '  사회(역사) 분야',
    ].join('\n');

    this.add.text(110, 134, left, {
      fontFamily: FONT, fontSize: '15px', color: '#f3ece0', lineSpacing: 6
    });
    this.add.text(540, 134, right, {
      fontFamily: FONT, fontSize: '15px', color: '#f3ece0', lineSpacing: 6
    });

    fancyButton(this, 480, 560, 240, 44, '← 처음으로',
      () => this.scene.start('TitleScene'),
      { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' });
  }
}

// ══════════════════════════════════════════════════════════════
//  사건 선택 화면 (CaseSelectScene)
//  — 오버워치2 임무 선택 스타일: 좌측 사건 리스트 + 우측 세계 지도
//  — 향후 러우전쟁·팔레스타인 콘텐츠가 추가되면 CASE_LIST만 갱신
// ══════════════════════════════════════════════════════════════
// 위경도 → 화면 좌표 (지도 표시 영역 기준, equirectangular 근사)
// 지도 패널: x=360, y=118(헤더 아래), w=420, h=274 (원본 1280x836 비율 유지)
//   x = mapLeft + (lng + 180) * mapW / 360
//   y = mapTop  + (90  - lat) * mapH / 180
// 미리 계산해 mapX/mapY로 박아 둠. (대략적 좌표로 시각화 OK)
// 현재 활성 사건의 안내자 이름 (없으면 '안내인'). hardcoded 텍스트 분기용
function getGuideName(registry) {
  const id = (registry && registry.get && registry.get('caseId')) || 'aralsea';
  const c = (typeof CASE_LIST !== 'undefined') ? CASE_LIST.find(x => x.id === id) : null;
  return (c && c.guide && c.guide.name) || '안내인';
}

// 현재 활성 사건의 첫 조사 장소 이름 (예: '옛 항구 무이낙', '폭격받은 학교').
// 락 토스트·HUD 목표 메시지 등 학생에게 노출되는 모든 안내 텍스트의 통일 출처.
function getFirstLocationName(registry) {
  const id = (registry && registry.get && registry.get('caseId')) || 'aralsea';
  // CASES는 cases.js 글로벌. setCase()와 별개로 직접 lookup (모달 등 비활성 사건 안전)
  const c = (typeof CASES !== 'undefined') ? CASES[id] : null;
  if (!c || !c.locations || !c.start) return '첫 장소';
  const loc = c.locations[c.start];
  return (loc && loc.name) || '첫 장소';
}

// 현재 활성 사건의 짧은 통칭 (예: '아랄해', '키이우', '팔레스타인').
// 인쇄 보고서 헤더·자기평가 문항 등에 사용.
function getCaseShortName(registry) {
  const id = (registry && registry.get && registry.get('caseId')) || 'aralsea';
  const SHORT = { intro: 'UN 본부 (튜토리얼)', aralsea: '아랄해', ukraine: '우크라이나', palestine: '팔레스타인' };
  return SHORT[id] || '현장';
}

// ══════════════════════════════════════════════════════════════════
//  저장·이어하기 (localStorage)
//  · 핵심 진행 상태(registry)를 'peace_save_v1' 키에 저장.
//  · reportProgress() 호출 시마다 자동 저장 (모든 단계 전환점).
//  · TitleScene에 "이어하기" 버튼 노출 — 세이브가 있고 현재 사건이
//    아직 완료 안 됐을 때.
//  · "새 게임"으로 시작하면 세이브 삭제.
// ══════════════════════════════════════════════════════════════════
const SAVE_KEY = 'peace_save_v1';
const SAVE_FIELDS = [
  'caseId', 'stage', 'enemyDefeated', 'evidence', 'coreClues',
  'quizSolved', 'slimeLove', 'invLoc', 'reportSent', 'reflectionDone',
  'reflection', 'speech', 'completedCases', 'caseBadges', 'caseReviews',
  'learningReview', 'evidenceTags', 'locationTags', 'userPledge', 'userReflection',
];
function saveGameState(registry) {
  if (typeof localStorage === 'undefined') return;
  try {
    const state = { ts: Date.now(), version: 1 };
    SAVE_FIELDS.forEach(k => {
      const v = registry.get(k);
      if (v !== undefined) state[k] = v;
    });
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) { /* quota exceeded 등 무시 */ }
}
function loadGameState() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.version !== 1) return null;
    return s;
  } catch (e) { return null; }
}
function restoreRegistryFromSave(registry, state) {
  if (!state) return;
  SAVE_FIELDS.forEach(k => {
    if (state[k] !== undefined) registry.set(k, state[k]);
  });
}
function clearGameState() {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}
// 세이브가 "이어할 가치"가 있는지 (현재 사건이 진행 중인지) 판별.
function hasResumableSave() {
  const s = loadGameState();
  if (!s || !s.caseId) return false;
  const done = (s.completedCases || []).includes(s.caseId);
  // 완료되지 않았고 단계가 ≥1 이면 이어하기 노출
  return !done && (s.stage || 1) >= 1 &&
         ((s.enemyDefeated) || (s.evidence && s.evidence.length > 0));
}

// 사건별 UN 보고서 템플릿 — 수신처 후보·다짐 목록·헤더·권고 단락
// LetterScene이 caseId를 기준으로 적절한 세트를 선택해 본문 구성.
const LETTER_TEMPLATES = {
  intro: {
    header: '《 P.E.A.C.E. 에이전시 · 신입 조사관 수습 보고서 》',
    recipients: [
      { short: '디렉터 한센',         long: '디렉터 한센 귀하에게' },
      { short: 'UN 사무총장실',       long: 'UN 사무총장실 귀하에게' },
      { short: '나의 학교 선생님',    long: '저희 학교 선생님께' },
    ],
    pledges: [
      '본 임무에 임할 때 사람들의 이야기를 먼저 듣겠습니다.',
      '단서를 모을 때 한쪽 시각에만 치우치지 않겠습니다.',
      '배운 것을 친구·가족에게 전하겠습니다.',
      '국제 협력의 작은 사례에도 관심을 갖겠습니다.',
      '오늘 익힌 P.E.A.C.E. 다섯 단계를 본 임무에서 실천하겠습니다.',
      '실패해도 다시 한 번 더 시도하겠습니다.',
    ],
    footer:
      '오늘 디렉터 한센의 가르침으로 P.E.A.C.E. 다섯 단계를\n' +
      '체험했습니다. 이제 본 임무로 출발할 준비가 되었습니다.\n' +
      '관심·연대·실천 — 이 세 가지를 마음에 새기겠습니다.',
    signature: '— UN P.E.A.C.E. 에이전시 신입 조사관 —',
  },
  aralsea: {
    header: '《 UN 환경계획 · 아랄해 현지 조사 보고서 》',
    recipients: [
      { short: 'UN 환경계획(UNEP)', long: 'UN 환경계획(UNEP) 귀하에게' },
      { short: '유네스코(UNESCO)',  long: '유네스코(UNESCO) 귀하에게' },
      { short: '대한민국 환경부',    long: '대한민국 환경부 귀하에게' },
    ],
    pledges: [
      '옷을 오래 입고 꼭 필요한 것만 사겠습니다.',
      '환경·물 관련 뉴스에 꾸준히 관심을 갖겠습니다.',
      '친구들과 가족에게 이 이야기를 알리겠습니다.',
      '학교에서 환경 동아리·캠페인에 참여하겠습니다.',
      '재활용·물 절약 습관을 작은 것부터 실천하겠습니다.',
      '국제기구·NGO 활동에 응원과 작은 후원을 보내겠습니다.',
    ],
    footer:
      '이 문제는 멀리 떨어진 우리의 소비와도 연결됩니다.\n' +
      '국제사회·정부·시민이 협력해 재발을 막고, 훼손된\n' +
      '생태계의 회복을 위해 노력할 것을 권고합니다.',
    signature: '— UN 환경계획 파견 조사관 —',
  },
  ukraine: {
    header: '《 UN 인도주의업무조정국 · 우크라이나 현지 조사 보고서 》',
    recipients: [
      { short: 'UN 인도주의(OCHA)', long: 'UN 인도주의업무조정국(OCHA) 귀하에게' },
      { short: '유네스코(UNESCO)',  long: '유네스코(UNESCO) 귀하에게' },
      { short: '대한민국 외교부',    long: '대한민국 외교부 귀하에게' },
    ],
    pledges: [
      '식량·에너지 가격 뉴스에 꾸준히 관심을 갖겠습니다.',
      '평화 교육·국제이해 수업에 적극 참여하겠습니다.',
      '친구들과 가족에게 이 이야기를 알리겠습니다.',
      '학교에서 평화·인권 동아리·캠페인에 참여하겠습니다.',
      '에너지 절약을 작은 것부터 실천하겠습니다.',
      'UN·적십자·NGO 인도주의 활동에 응원과 작은 후원을 보내겠습니다.',
    ],
    footer:
      '전쟁의 영향은 멀리 떨어진 우리 식탁·난방까지 닿습니다.\n' +
      '국제사회·정부·시민이 협력해 민간인 보호, 식량 안보,\n' +
      '그리고 평화 교육에 힘쓸 것을 권고합니다.',
    signature: '— UN 인도주의 파견 조사관 —',
  },
  palestine: {
    header: '《 UN 팔레스타인 난민구호기관 · 현지 조사 보고서 》',
    recipients: [
      { short: 'UN 안전보장이사회', long: 'UN 안전보장이사회 귀하에게' },
      { short: 'UNRWA',             long: 'UN 팔레스타인 난민구호기관(UNRWA) 귀하에게' },
      { short: '대한민국 외교부',    long: '대한민국 외교부 귀하에게' },
    ],
    pledges: [
      '분쟁 지역의 어린이와 학교 소식에 꾸준히 관심을 갖겠습니다.',
      '평화 교육·세 종교 공존에 대해 더 배우겠습니다.',
      '친구들과 가족에게 이 이야기를 알리겠습니다.',
      '학교에서 평화·인권 동아리·캠페인에 참여하겠습니다.',
      '편견 없는 시각으로 양쪽 사람들의 목소리를 함께 듣겠습니다.',
      'UN·UNRWA·적신월 인도주의 활동에 응원과 작은 후원을 보내겠습니다.',
    ],
    footer:
      '오래된 갈등의 한가운데에도 평범한 사람들의 일상이 있습니다.\n' +
      '국제사회·종교 공동체·시민이 협력해 인도주의 통로 확보,\n' +
      '아동 보호, 평화 교육에 힘쓸 것을 권고합니다.',
    signature: '— UN 인도주의 파견 조사관 —',
  },
};
function getLetterTemplate(registry) {
  const id = (registry && registry.get && registry.get('caseId')) || 'aralsea';
  return LETTER_TEMPLATES[id] || LETTER_TEMPLATES.aralsea;
}

// ── 게임 내부 BGM (사건별 4곡 + 조사 1곡) ──────────────────────
// WorldScene 진입 시 caseId 기반 자동 재생. 대화·퀴즈 진입 시 pause,
// 종료 시 resume (currentTime 유지로 이어듣기). InvestigationScene은
// 맵 BGM pause → 조사 BGM 시작 → 종료 시 반대.
const BGM_BY_CASE = {
  intro:     'assets/audio/bgm_intro.mp3',
  aralsea:   'assets/audio/bgm_aralsea.mp3',
  ukraine:   'assets/audio/bgm_ukraine.mp3',
  palestine: 'assets/audio/bgm_palestine.mp3',
};
const BGM_INVESTIGATION = 'assets/audio/bgm_investigation.mp3';
const BGM_TITLE         = 'assets/audio/Mandate_of_Peace.mp3';
const BGM_CASESELECT    = 'assets/audio/bgm_caseselect.mp3';

const CASE_LIST = [
  {
    // 사건 0 — 튜토리얼. CaseSelectScene 카드 맨 위.
    // 완료 전엔 다른 3사건 잠금. id='intro', completedCases에 'intro' 들어가면 잠금 해제.
    id: 'intro',
    title: '신입 교육',
    subtitle: 'UN 본부 — 디렉터 한센',
    region: '북미 · 뉴욕 맨해튼',
    status: 'available',
    accent: 0xffd96a,
    guide: { name: '한센' },
    // 뉴욕 — 사용자 디버그 모드(?debug=1) 클릭으로 측정한 정확 좌표
    mapX: 520, mapY: 208,
    mission: [
      '오늘은 자네의 첫 출근일.',
      'UN 본부 P.E.A.C.E. 에이전시에서',
      '디렉터 한센과 인사하고, 우리가 일하는',
      '다섯 단계 — P·E·A·C·E — 를 직접 체험할 것.',
      '',
      '튜토리얼을 끝내야 본 임무가 잠금 해제된다.',
    ],
    code: 'CASE-000  ORIENTATION',
  },
  {
    id: 'aralsea',
    title: '사라진 바다',
    subtitle: '아랄해 — 환경 분쟁과 세계시민',
    region: '중앙아시아 · 카라칼팍스탄',
    status: 'available',
    accent: 0xe8b86a,
    guide: { name: '아이졸리' },
    // 무이낙 (43.8°N, 59.5°E) — 사용자 지정 정확 좌표
    mapX: 727, mapY: 204,
    // 임무 브리핑 본문 (현장 이동 전 화면)
    mission: [
      '한때 세계 4번째로 컸던 호수가',
      '60년 만에 면적의 90%가 사라졌다.',
      '',
      '안내인 아이졸리와 만나 마을·항구·시장을',
      '조사하고, 사라진 바다의 진실을 모아',
      'UN에 조사 보고서를 송부할 것.',
    ],
    code: 'CASE-001  ARAL-SEA',
  },
  {
    id: 'ukraine',
    title: '깨어진 평화',
    subtitle: '러시아·우크라이나 전쟁',
    region: '동유럽 · 우크라이나',
    status: 'available',
    accent: 0x6fb7d6,
    guide: { name: '카테리나' },
    // 키이우 (50.4°N, 30.5°E) — 사용자 지정 정확 좌표
    mapX: 685, mapY: 196,
    mission: [
      '평화는 어떻게 깨지는가.',
      '카테리나의 안내로 폭격받은 학교, 흑해 곡물 항구,',
      '그리고 지하철 대피소를 조사할 것.',
      '',
      '식량·에너지 위기와 평화 교육의 의미를',
      'UN에 보고서로 정리해 송부하라.',
    ],
    code: 'CASE-002  UKRAINE',
  },
  {
    id: 'palestine',
    title: '오래된 갈등',
    subtitle: '팔레스타인 — 평화와 인도주의',
    region: '서아시아 · 가자/요르단강 서안',
    status: 'available',
    accent: 0xc9a3ff,
    // 예루살렘/가자 (31.8°N, 35.2°E) — 사용자 지정 정확 좌표
    mapX: 691, mapY: 225,
    mission: [
      '천 년 넘게 세 종교가 함께 살아온 땅,',
      '지금은 가장 오래된 갈등의 한복판.',
      '',
      '안내인 카림과 만나 올리브 농장·예루살렘 골목·UN 캠프를',
      '조사하고, 평화와 인도주의의 길을',
      'UN에 보고서로 송부할 것.',
    ],
    code: 'CASE-003  PALESTINE',
  },
];

class CaseSelectScene extends Phaser.Scene {
  constructor() { super('CaseSelectScene'); }

  create() {
    setCfgBarVisible(false);
    this.leaving = false;   // 빠른 다중 클릭으로 fadeOut 중복 방지
    const W = GAME_W, H = GAME_H;

    // 부드러운 페이드인 — 타이틀/엔딩 등 어디서 들어와도 자연스럽게
    this.cameras.main.fadeIn(320, 0, 0, 0);

    // 임무 선택 화면 BGM (임무 받는 느낌) — 사건 진입 시 WorldScene이 사건별 BGM으로 전환
    if (window.SFX) window.SFX.playBGM(BGM_CASESELECT);

    // ── 배경: 어두운 코발트 그라데이션 + 격자 (오버워치 풍) ───
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x07111f, 0x07111f, 0x122842, 0x0c1c30, 1);
    bg.fillRect(0, 0, W, H);
    // 미세 격자 (네트워크 느낌)
    bg.lineStyle(1, 0x1a3a5c, 0.35);
    for (let x = 0; x < W; x += 40) { bg.lineBetween(x, 0, x, H); }
    for (let y = 0; y < H; y += 40) { bg.lineBetween(0, y, W, y); }

    // ── 상단 헤더 ──────────────────────────────────────────────
    // 좌측 강조 바
    const headBar = this.add.graphics();
    headBar.fillStyle(0xe8b86a, 1); headBar.fillRect(0, 22, 6, 38);
    this.add.text(20, 22, '임무 선택', {
      fontFamily: FONT_TITLE, fontSize: '28px', color: '#ffe9b8',
      fontStyle: 'bold'
    });
    this.add.text(20, 56, 'MISSION  SELECT  —  UN 조사관 임무 브리핑', {
      fontFamily: FONT, fontSize: '12px', color: '#7aa6c8'
    });
    // 우측 식별 칩
    const idChip = this.add.graphics();
    idChip.fillStyle(0x0e2238, 1); idChip.fillRect(780, 22, 160, 38);
    idChip.lineStyle(2, 0x2a5a82, 1); idChip.strokeRect(780, 22, 160, 38);
    this.add.text(860, 33, 'UN INSPECTOR', {
      fontFamily: FONT, fontSize: '12px', color: '#cfe9ff'
    }).setOrigin(0.5);
    this.add.text(860, 49, '🌐  GLOBAL  CITIZEN', {
      fontFamily: FONT, fontSize: '10px', color: '#7aa6c8'
    }).setOrigin(0.5);

    // ── 좌측 패널: 사건 리스트 ─────────────────────────────────
    const listX = 20, listY = 90, listW = 320, listH = 490;
    const lg = this.add.graphics();
    lg.fillStyle(0x0a1828, 0.92); lg.fillRect(listX, listY, listW, listH);
    lg.lineStyle(2, 0x2a5a82, 1); lg.strokeRect(listX, listY, listW, listH);
    // 패널 헤더
    lg.fillStyle(0x122842, 1); lg.fillRect(listX, listY, listW, 32);
    lg.lineStyle(2, 0x2a5a82, 1);
    lg.lineBetween(listX, listY + 32, listX + listW, listY + 32);
    this.add.text(listX + 12, listY + 16, '이야기 임무 · 챕터', {
      fontFamily: FONT, fontSize: '13px', color: '#cfe9ff'
    }).setOrigin(0, 0.5);
    // 우측 카운터: 완료 / 진입가능 / 전체
    const completedCount = (this.registry.get('completedCases') || []).length;
    const availCount = CASE_LIST.filter(c => c.status === 'available').length;
    this.add.text(listX + listW - 12, listY + 16,
      '★ ' + completedCount + '  ·  진입 ' + availCount + ' / ' + CASE_LIST.length, {
      fontFamily: FONT, fontSize: '11px', color: '#7aa6c8'
    }).setOrigin(1, 0.5);

    // 각 사건 카드 — listH(490) 안에 4개 fit
    // 계산: listY(90) + 헤더(44) + 4*(cardH+gap) - gap ≤ listY + listH(580)
    //   → 4*cardH + 3*gap ≤ 446. cardH=104, gap=6 → 416+18=434 ✓ (안전 마진 12)
    const cardH = 104, gap = 6;
    this.cards = [];
    CASE_LIST.forEach((c, i) => {
      const cy = listY + 44 + i * (cardH + gap);
      const card = this.buildCaseCard(listX + 10, cy, listW - 20, cardH, c);
      this.cards.push(card);
    });

    // ── 우측: 세계 지도 패널 (실제 세계지도 이미지) ────────────
    const mapPanelX = 360, mapPanelY = 90, mapPanelW = 580, mapPanelH = 302;
    this.drawWorldMap(mapPanelX, mapPanelY, mapPanelW, mapPanelH);

    // 지도 위에 사건 마커 (3개)
    this.markers = [];
    CASE_LIST.forEach((c) => {
      const m = this.drawCaseMarker(c.mapX, c.mapY, c);
      this.markers.push(m);
    });

    // ── 하단: 설명/조작 안내 ───────────────────────────────────
    const infoX = 360, infoY = 404, infoW = 580, infoH = 146;
    const ig = this.add.graphics();
    ig.fillStyle(0x0a1828, 0.92); ig.fillRect(infoX, infoY, infoW, infoH);
    ig.lineStyle(2, 0x2a5a82, 1); ig.strokeRect(infoX, infoY, infoW, infoH);
    // 패널 헤더
    ig.fillStyle(0x122842, 1); ig.fillRect(infoX, infoY, infoW, 26);
    ig.lineStyle(2, 0x2a5a82, 1);
    ig.lineBetween(infoX, infoY + 26, infoX + infoW, infoY + 26);
    this.add.text(infoX + 12, infoY + 13, 'ⓘ  브리핑', {
      fontFamily: FONT, fontSize: '12px', color: '#cfe9ff'
    }).setOrigin(0, 0.5);

    // hover-out 시 복원할 기본 안내문
    const introDone = (this.registry.get('completedCases') || []).includes('intro');
    this.defaultInfo = introDone
      ? ('좌측 임무 카드 위에 커서를 올리면 사건의 위치와\n' +
         '간략 설명을 볼 수 있습니다.\n\n' +
         '· 「사라진 바다 — 아랄해」 환경 분쟁\n' +
         '· 「깨어진 평화」 러시아·우크라이나 전쟁\n' +
         '· 「오래된 갈등」 팔레스타인 — 평화·인도주의')
      : ('🎓 먼저 「신입 교육 — UN 본부」를 마쳐야\n' +
         '본 임무 세 가지가 잠금 해제됩니다.\n\n' +
         '디렉터 한센과 만나 P.E.A.C.E. 5단계 —\n' +
         '인식 · 탐색 · 분석 · 연결 · 실천 — 을\n' +
         '직접 체험하세요.');
    this.infoText = this.add.text(infoX + 14, infoY + 38, this.defaultInfo, {
      fontFamily: FONT, fontSize: '12px', color: '#a8c4dc', lineSpacing: 4
    });

    // ── 🛠 DEBUG 모드 (URL ?debug=1) — 마커 좌표 픽커 ────────────
    // 사용법: 1) 게임 URL에 ?debug=1 추가 (예: /gyojajeon/?debug=1)
    //        2) 지도에서 원하는 위치 클릭 → 우상단에 좌표 표시 + 콘솔 출력
    //        3) 좌표를 알려주면 cases.js / game.js CASE_LIST에 반영
    if (/[?&]debug=1\b/.test(location.search || '')) {
      // 우상단 — 디버그 안내 + 마지막 클릭 좌표
      const debugInfo = this.add.text(940, 60,
        '🛠 DEBUG MODE\nClick anywhere on map to get coordinates',
        {
          fontFamily: FONT, fontSize: '11px', color: '#ffe082',
          backgroundColor: '#000000bb', padding: { x: 8, y: 4 },
          align: 'right'
        }).setOrigin(1, 0).setDepth(200);

      // 지도 패널 안 클릭 zone
      const dbgZone = this.add.zone(mapPanelX, mapPanelY, mapPanelW, mapPanelH)
        .setOrigin(0, 0).setInteractive().setDepth(150);
      dbgZone.on('pointerdown', (pointer) => {
        const px = Math.round(pointer.x), py = Math.round(pointer.y);
        debugInfo.setText('🛠 DEBUG MODE\nLast click: mapX=' + px + ', mapY=' + py);
        console.log('[DEBUG] mapX:', px, '  mapY:', py);
        // 클릭한 위치에 시각 표시 (작은 노란 점)
        const dot = this.add.circle(px, py, 3, 0xffe082, 1).setDepth(180);
        this.tweens.add({
          targets: dot, alpha: 0, duration: 1500, ease: 'Sine.in',
          onComplete: () => dot.destroy()
        });
      });

      // 각 마커 옆에 현재 좌표 라벨
      CASE_LIST.forEach(cc => {
        this.add.text(cc.mapX + 12, cc.mapY - 8,
          cc.id + ' (' + cc.mapX + ',' + cc.mapY + ')',
          {
            fontFamily: FONT, fontSize: '9px', color: '#ffe082',
            backgroundColor: '#000000aa', padding: { x: 3, y: 1 }
          }).setOrigin(0, 1).setDepth(180);
      });
    }

    // 하단 우측 — 타이틀 복귀 / 학습 트리 (브리핑 패널 아래)
    // 좌측 카드 영역(x=20~340)을 침범하지 않도록 우측으로 이동
    fancyButton(this, 580, 575, 140, 30, '← 타이틀',
      () => {
        if (this.leaving) return;
        this.leaving = true;
        this.cameras.main.fadeOut(260, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete',
          () => this.scene.start('TitleScene'));
      },
      { base: 0x2b3a52, hover: 0x3c5170, edge: 0x6fb7d6, text: '#dff1ff' });
    fancyButton(this, 770, 575, 170, 30, '🌳 학습 트리',
      () => {
        if (this.leaving) return;
        this.leaving = true;
        this.cameras.main.fadeOut(260, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete',
          () => this.scene.start('LearningTreeScene'));
      },
      { base: 0x2e5a3a, hover: 0x3e7a4a, edge: 0x7fd07f, text: '#dfffdf' });
  }

  // 좌측 패널의 사건 카드 1개를 그린다
  buildCaseCard(x, y, w, h, c) {
    // 송부 완료된 사건은 ✓ 표시 (다시 진입 가능)
    const completed = (this.registry.get('completedCases') || []).includes(c.id);
    // 튜토리얼(intro)이 끝나야 본 3사건 잠금 해제. intro 자체는 항상 열림.
    const introDone = (this.registry.get('completedCases') || []).includes('intro');
    const isIntro = (c.id === 'intro');
    const lockedByIntro = !isIntro && !introDone;
    const available = (c.status === 'available') && !lockedByIntro;
    // 잠금 종류 — 'tutorial' = 튜토리얼 미완료, 'soon' = 콘텐츠 준비중
    const lockKind = lockedByIntro ? 'tutorial' : (!available ? 'soon' : null);

    const g = this.add.graphics();
    const drawCard = (hover) => {
      g.clear();
      // 배경
      g.fillStyle(hover && available ? 0x163455 : 0x102238, 1);
      g.fillRect(x, y, w, h);
      // 좌측 강조 스트라이프 (사건별 색)
      g.fillStyle(c.accent, available ? 1 : 0.4);
      g.fillRect(x, y, 5, h);
      // 외곽
      g.lineStyle(2, hover && available ? c.accent : 0x244668, 1);
      g.strokeRect(x, y, w, h);
    };
    drawCard(false);

    // 아이콘 박스 (좌측)
    const ig = this.add.graphics();
    ig.fillStyle(0x0a1828, 1); ig.fillRect(x + 16, y + 16, 48, 48);
    ig.lineStyle(2, c.accent, available ? 1 : 0.5);
    ig.strokeRect(x + 16, y + 16, 48, 48);
    // 아이콘 — 작은 도형으로 (지구본/물결/평화)
    this.drawCaseIcon(ig, x + 40, y + 40, c);

    // 제목
    const titleText = this.add.text(x + 78, y + 14, c.title, {
      fontFamily: FONT_TITLE, fontSize: '17px',
      color: available ? '#ffe9b8' : '#7a8a98', fontStyle: 'bold'
    });
    // 부제
    this.add.text(x + 78, y + 38, c.subtitle, {
      fontFamily: FONT, fontSize: '12px',
      color: available ? '#cfe9ff' : '#6e7a86'
    });
    // 지역
    this.add.text(x + 78, y + 56, '📍 ' + c.region, {
      fontFamily: FONT, fontSize: '11px',
      color: available ? '#a8c4dc' : '#5a6470'
    });

    // 상태 배지 (우상단) — 진입/준비중/완료
    const badgeX = x + w - 16, badgeY = y + 14;
    const bg2 = this.add.graphics();
    if (completed) {
      // 완료된 사건 — 황금색 배지
      bg2.fillStyle(0x3a2e10, 1); bg2.fillRect(badgeX - 64, badgeY, 64, 20);
      bg2.lineStyle(1, 0xffd96a, 1); bg2.strokeRect(badgeX - 64, badgeY, 64, 20);
      this.add.text(badgeX - 32, badgeY + 10, '★  완료', {
        fontFamily: FONT, fontSize: '11px', color: '#ffd96a'
      }).setOrigin(0.5);
    } else if (available) {
      bg2.fillStyle(0x2e6b58, 1); bg2.fillRect(badgeX - 60, badgeY, 60, 20);
      bg2.lineStyle(1, 0x7fd07f, 1); bg2.strokeRect(badgeX - 60, badgeY, 60, 20);
      this.add.text(badgeX - 30, badgeY + 10, '✓  진입', {
        fontFamily: FONT, fontSize: '11px', color: '#d7ffe0'
      }).setOrigin(0.5);
    } else {
      bg2.fillStyle(0x4a3a22, 1); bg2.fillRect(badgeX - 80, badgeY, 80, 20);
      bg2.lineStyle(1, 0xc9a36b, 1); bg2.strokeRect(badgeX - 80, badgeY, 80, 20);
      this.add.text(badgeX - 40, badgeY + 10,
        lockKind === 'tutorial' ? '🔒  튜토리얼' : '🔒  준비중', {
        fontFamily: FONT, fontSize: '11px', color: '#ffe9b8'
      }).setOrigin(0.5);
    }

    // 하단 — intro(튜토리얼)는 P.E.A.C.E. 5단계 배지. 본 사건은 별도 표기 없음
    if (available && isIntro) {
      const tg = this.add.graphics();
      tg.fillStyle(0xffd96a, 0.9);
      tg.fillRect(x + 16, y + 80, w - 32, 20);
      tg.lineStyle(1, 0xb88a3a, 1);
      tg.strokeRect(x + 16, y + 80, w - 32, 20);
      this.add.text(x + w / 2, y + 90, '🎓  P.E.A.C.E. 5단계 — 인식·탐색·분석·연결·실천', {
        fontFamily: FONT, fontSize: '10px', color: '#3a2410', fontStyle: 'bold'
      }).setOrigin(0.5);
    } else if (!available) {
      this.add.text(x + 78, y + 85,
        '— 후속 업데이트 예정', {
        fontFamily: FONT, fontSize: '11px', color: '#6e7a86', fontStyle: 'italic'
      });
    }
    // (본 사건의 인지/정서/행동 3색 배지는 제거됨 — UNESCO 3영역은 단서별
    //  배지로 충분히 표시되어 사건 카드에는 중복이라 노이즈)

    // 상호작용 zone — 잠금이라도 클릭은 받아서 토스트 안내
    const zone = this.add.zone(x + w / 2, y + h / 2, w, h)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      drawCard(true);
      if (available) titleText.setColor('#ffffff');
      // 우측 지도 마커 강조 + 하단 정보 갱신
      this.highlightMarker(c.id, true);
      let info;
      if (available) {
        info = '▶  ' + c.title + '\n   ' + c.subtitle + '\n   지역: ' + c.region;
      } else if (lockKind === 'tutorial') {
        info = '🔒  ' + c.title + '\n   먼저 「신입 교육 — UN 본부」를 마치세요.\n   디렉터 한센과 P.E.A.C.E. 5단계 체험.';
      } else {
        info = '🔒  ' + c.title + ' — 준비 중\n   ' + c.subtitle + '\n   다음 업데이트에서 만날 수 있어요.';
      }
      this.infoText.setText(info);
    });
    zone.on('pointerout', () => {
      drawCard(false);
      if (available) titleText.setColor('#ffe9b8');
      this.highlightMarker(c.id, false);
      // 기본 안내문 복원 (다른 카드 위에 다시 호버되면 거기서 갱신)
      if (this.infoText && this.defaultInfo) {
        this.infoText.setText(this.defaultInfo);
      }
    });
    zone.on('pointerdown', () => {
      // 이미 다른 카드 클릭으로 fadeOut 진행 중이면 무시 (다중 호출 방지)
      if (this.leaving) return;
      if (!available) {
        if (lockKind === 'tutorial') {
          this.flashToast('🔒  먼저 「신입 교육 — UN 본부」를 마치세요.');
        } else {
          this.flashToast('🔒  이 사건은 준비 중입니다 — 다음 업데이트에서 만나요!');
        }
        return;
      }
      this.leaving = true;
      // 사건 ID를 registry에 저장. intro는 cases.js/dialogue.js의
      // setCase/setCitizens는 호출 안 함 (해당 데이터가 없으므로 default 유지).
      this.registry.set('caseId', c.id);
      // intro도 본 사건과 동일하게 setCase/setStory/setCitizens (cases.js·quizzes.js에 intro 데이터 있음)
      try { setCase(c.id); setStory(c.id); setCitizens(c.id); } catch (e) { /* 데이터 없는 사건이면 default 유지 */ }
      this.registry.set('stage', 1);
      this.registry.set('enemyDefeated', false);
      this.registry.set('evidence', []);
      this.registry.set('coreClues', []);
      this.registry.set('quizSolved', {});
      this.registry.set('slimeLove', 0);
      this.registry.set('invLoc', undefined);
      this.registry.set('reportSent', false);
      this.registry.set('reflectionDone', false);
      this.registry.set('reflection', null);
      this.registry.set('evidenceTags', {});
      this.registry.set('locationTags', {});
      this.registry.set('learningReview', null);
      // 페이드 아웃 후 BriefingScene으로 — intro도 다른 사건과 동일 흐름
      this.cameras.main.fadeOut(380, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('BriefingScene');
      });
    });

    return { id: c.id, drawCard, titleText, zone };
  }

  // 카드 아이콘 — 사건별 단순 도형
  drawCaseIcon(g, cx, cy, c) {
    // intro(튜토리얼) — UN 깃발 이미지 (사용자 제공 PNG)
    if (c.id === 'intro') {
      if (this.textures.exists('flag_un')) {
        this.add.image(cx, cy, 'flag_un').setDisplaySize(34, 22).setDepth(g.depth + 1);
      } else {
        // fallback — 코드 그림
        const w = 34, h = 22;
        const x = cx - w / 2, y = cy - h / 2;
        g.fillStyle(0x5b92e5, 1); g.fillRect(x, y, w, h);
        g.fillStyle(0xffffff, 1); g.fillCircle(cx, cy, 7);
      }
      return;
    }
    // 사건 발생국 국기 (단순화 픽셀 도트)
    const w = 34, h = 22;
    const x = cx - w / 2, y = cy - h / 2;
    const band = h / 3;
    if (c.id === 'aralsea') {
      // 우즈베키스탄 — 파랑/흰/녹 3색 + 빨간 가는 분리선
      g.fillStyle(0x0099b5, 1); g.fillRect(x, y, w, band);
      g.fillStyle(0xffffff, 1); g.fillRect(x, y + band, w, band);
      g.fillStyle(0x1eb53a, 1); g.fillRect(x, y + 2 * band, w, band);
      g.fillStyle(0xce1126, 1);
      g.fillRect(x, y + band - 1, w, 1);
      g.fillRect(x, y + 2 * band, w, 1);
    } else if (c.id === 'ukraine') {
      // 우크라이나 — 파랑/노랑 2색
      g.fillStyle(0x0057b8, 1); g.fillRect(x, y, w, h / 2);
      g.fillStyle(0xffd500, 1); g.fillRect(x, y + h / 2, w, h / 2);
    } else if (c.id === 'palestine') {
      // 팔레스타인 — 검정/흰/녹 3색 + 좌측 빨간 삼각형
      g.fillStyle(0x000000, 1); g.fillRect(x, y, w, band);
      g.fillStyle(0xffffff, 1); g.fillRect(x, y + band, w, band);
      g.fillStyle(0x007a3d, 1); g.fillRect(x, y + 2 * band, w, band);
      g.fillStyle(0xce1126, 1);
      g.fillTriangle(x, y, x + 12, y + h / 2, x, y + h);
    }
    // 깃발 테두리
    g.lineStyle(1, 0x000000, 0.5); g.strokeRect(x, y, w, h);
  }

  // 세계 지도 (Wikimedia Commons Public Domain "흰 대륙 + 투명 바다" PNG)
  drawWorldMap(x, y, w, h) {
    const headerH = 28;
    const g = this.add.graphics();
    // 패널 배경
    g.fillStyle(0x081628, 0.95); g.fillRect(x, y, w, h);
    g.lineStyle(2, 0x2a5a82, 1); g.strokeRect(x, y, w, h);
    // 헤더
    g.fillStyle(0x122842, 1); g.fillRect(x, y, w, headerH);
    g.lineStyle(2, 0x2a5a82, 1);
    g.lineBetween(x, y + headerH, x + w, y + headerH);
    this.add.text(x + 12, y + headerH / 2, '🌍  WORLD MAP', {
      fontFamily: FONT, fontSize: '12px', color: '#cfe9ff'
    }).setOrigin(0, 0.5);
    this.add.text(x + w - 12, y + headerH / 2, 'Equirectangular · PD', {
      fontFamily: FONT, fontSize: '10px', color: '#7aa6c8'
    }).setOrigin(1, 0.5);

    // 격자 (위경도 라인 — 미세하게)
    g.lineStyle(1, 0x1c4068, 0.45);
    const bodyTop = y + headerH;
    for (let gx = x + 35; gx < x + w; gx += 35) g.lineBetween(gx, bodyTop, gx, y + h);
    for (let gy = bodyTop + 30; gy < y + h; gy += 30) g.lineBetween(x, gy, x + w, gy);
    // 적도 강조선
    const equatorY = bodyTop + (90 - 0) * (h - headerH) / 180;
    g.lineStyle(1, 0x3a7ab0, 0.6);
    g.lineBetween(x, equatorY, x + w, equatorY);
    // 본초자오선 강조선
    const primeX = x + (0 + 180) * w / 360;
    g.lineBetween(primeX, bodyTop, primeX, y + h);

    // 세계 지도 이미지 (흰 대륙) — 패널 본문에 정확히 맞춤
    const img = this.add.image(x, bodyTop, 'world_map').setOrigin(0, 0);
    // 원본 1280x836 비율(1.531) → 표시 영역 420x274 (h-headerH=274 일 때 정확히 일치)
    const dispW = w, dispH = h - headerH;
    img.setDisplaySize(dispW, dispH);
    // 다크 청회색 톤으로 tint, 살짝 투명하게 → 격자 위에 자연스럽게 떠 보임
    img.setTint(0x8fb6d4);
    img.setAlpha(0.78);

    // 마스크: 지도가 패널 본문 밖으로 나가지 않도록
    const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(x, bodyTop, dispW, dispH);
    img.setMask(maskShape.createGeometryMask());

    // 패널 본문에 약한 비네트 (모서리 어둡게)
    const vig = this.add.graphics();
    vig.fillStyle(0x000000, 0.35);
    vig.fillRect(x, bodyTop, dispW, 8);
    vig.fillRect(x, y + h - 8, dispW, 8);
    vig.fillRect(x, bodyTop, 8, dispH);
    vig.fillRect(x + dispW - 8, bodyTop, 8, dispH);
  }

  // 사건 위치 마커 — 심플(빨간 외곽 링 + 흰 점), 라벨은 호버 시에만
  drawCaseMarker(mx, my, c) {
    // 끊임없이 도는 펄스 링 (작고 부드럽게)
    const pulse = this.add.circle(mx, my, 5, 0xff4040, 0).setDepth(99);
    pulse.setStrokeStyle(2, 0xff5050, 0.85);
    this.tweens.add({
      targets: pulse, radius: 14, alpha: 0,
      duration: 1500, repeat: -1, ease: 'Sine.out'
    });

    // 마커 본체 — 외곽 링 + 내부 점
    const marker = this.add.graphics().setDepth(101);
    const drawMarker = (active) => {
      marker.clear();
      // 외곽 흰 링
      marker.lineStyle(2, 0xffffff, 0.95);
      marker.strokeCircle(mx, my, active ? 7 : 5);
      // 빨간 본체
      marker.fillStyle(active ? 0xff7070 : 0xff4040, 1);
      marker.fillCircle(mx, my, active ? 5 : 3.5);
      // 가운데 흰 점 (포커스용)
      marker.fillStyle(0xffffff, 1);
      marker.fillCircle(mx, my, active ? 1.5 : 1);
    };
    drawMarker(false);

    // 라벨 — 기본 숨김, 호버 시 표시
    const lblPadX = 6, lblPadY = 3;
    const lblBg = this.add.graphics().setDepth(102).setVisible(false);
    const lbl = this.add.text(mx + 12, my - 8, c.title, {
      fontFamily: FONT, fontSize: '11px', color: '#ffffff'
    }).setDepth(103).setVisible(false);
    const drawLblBg = () => {
      const tw = lbl.width, th = lbl.height;
      lblBg.clear();
      lblBg.fillStyle(0x000000, 0.85);
      lblBg.fillRect(lbl.x - lblPadX, lbl.y - lblPadY, tw + lblPadX * 2, th + lblPadY * 2);
      lblBg.lineStyle(1, 0xff5050, 0.9);
      lblBg.strokeRect(lbl.x - lblPadX, lbl.y - lblPadY, tw + lblPadX * 2, th + lblPadY * 2);
      // 마커와 라벨 사이 짧은 연결선
      lblBg.lineStyle(1, 0xff5050, 0.7);
      lblBg.lineBetween(mx, my, lbl.x - lblPadX, my);
    };
    drawLblBg();

    const setLabel = (visible) => {
      lbl.setVisible(visible);
      lblBg.setVisible(visible);
    };

    return { id: c.id, marker, drawMarker, pulse, lbl, lblBg, setLabel };
  }

  highlightMarker(id, on) {
    const m = this.markers.find(x => x.id === id);
    if (!m) return;
    m.drawMarker(on);
    m.setLabel(on);
  }

  // 임시 안내 토스트
  flashToast(msg) {
    if (this.toast && this.toast.active) this.toast.destroy();
    this.toast = this.add.text(480, 540, msg, {
      fontFamily: FONT, fontSize: '13px', color: '#ffe9b8',
      backgroundColor: '#000000cc', padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setDepth(5000);
    this.time.delayedCall(1800, () => {
      if (this.toast) { this.toast.destroy(); this.toast = null; }
    });
  }
}

// ══════════════════════════════════════════════════════════════
//  학습 트리 (LearningTreeScene)
//  — 자기조절학습의 "포트폴리오" 단계.
//  — 학생이 완료한 사건마다 자신의 학습 흔적(인과 사슬·자기성찰·
//    자기 평가 점수)을 한 화면에 누적해 본다.
// ══════════════════════════════════════════════════════════════
class LearningTreeScene extends Phaser.Scene {
  constructor() { super('LearningTreeScene'); }

  create() {
    setCfgBarVisible(false);
    this.cameras.main.fadeIn(280, 0, 0, 0);
    this.leaving = false;

    // 배경: 숲처럼 따뜻한 다크 그린-블루
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a1818, 0x0a1818, 0x122422, 0x081a28, 1);
    bg.fillRect(0, 0, 960, 600);
    bg.lineStyle(1, 0x1a3a3a, 0.3);
    for (let x = 0; x < GAME_W; x += 40) bg.lineBetween(x, 0, x, GAME_H);
    for (let y = 0; y < GAME_H; y += 40) bg.lineBetween(0, y, GAME_W, y);

    // 상단 타이틀 — 도전 진행 카운트 추가
    const completed = this.registry.get('completedCases') || [];
    const reviews = this.registry.get('caseReviews') || {};
    const reflection = this.registry.get('reflection') || null;
    const _treeCases = CASE_LIST.filter(c => c.id !== 'intro');
    const _compCount = completed.filter(id => id !== 'intro').length;

    panel(this, 480, 40, 920, 56, 0x1a2a2a, 0x7fd07f);
    this.add.text(380, 30, '🏆  나의 학습 트리  ·  Learning Portfolio', {
      fontFamily: FONT_TITLE, fontSize: '18px', color: '#dfffdf',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(380, 54, '내가 정복한 사건들의 학습 흔적', {
      fontFamily: FONT, fontSize: '12px', color: '#a8d4b0'
    }).setOrigin(0.5);
    // 우상단 — 트로피 진열대 (도전 진행도)
    const trophyBg = this.add.graphics();
    trophyBg.fillStyle(0x2a2010, 0.85);
    trophyBg.fillRect(680, 18, 240, 44);
    trophyBg.lineStyle(2, 0xffd96a, 1);
    trophyBg.strokeRect(680, 18, 240, 44);
    this.add.text(800, 32, '🏆 정복 진행도', {
      fontFamily: FONT_TITLE, fontSize: '13px', color: '#ffd96a',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(800, 50, _compCount + ' / ' + _treeCases.length + '  사건', {
      fontFamily: FONT, fontSize: '12px', color: '#fff8d0'
    }).setOrigin(0.5);

    // 사건별 카드 (본 사건 3개만 표시 — 미완료는 회색)
    // intro(튜토리얼)는 학습 트리에서 제외
    // 새 layout: cardH=140, gap=6 → 3*146-6=432 (startY 90 ~ end 522, list 안 fit)
    const cardH = 140, cardW = 880, gap = 6;
    const startY = 90;
    const treeCases = CASE_LIST.filter(c => c.id !== 'intro');
    treeCases.forEach((c, i) => {
      const y = startY + i * (cardH + gap);
      const done = completed.includes(c.id);
      // 카드 배경
      const cg = this.add.graphics();
      cg.fillStyle(done ? 0x0e2228 : 0x0a1418, 0.92);
      cg.fillRect(40, y, cardW, cardH);
      cg.lineStyle(2, done ? c.accent : 0x2a4a4a, done ? 1 : 0.6);
      cg.strokeRect(40, y, cardW, cardH);
      // 좌측 강조 스트라이프
      cg.fillStyle(c.accent, done ? 1 : 0.4);
      cg.fillRect(40, y, 6, cardH);

      // 제목 + 상태 배지
      this.add.text(60, y + 14, c.title, {
        fontFamily: FONT_TITLE, fontSize: '17px',
        color: done ? '#ffe9b8' : '#7a8a98', fontStyle: 'bold'
      });
      this.add.text(60, y + 38, c.subtitle, {
        fontFamily: FONT, fontSize: '12px',
        color: done ? '#cfe9ff' : '#6e7a86'
      });
      // 우상단 — 도전 상태 메달 (도전과제 느낌 강화)
      if (done) {
        // 🥇 황금 메달 — 정복 완료
        const sg = this.add.graphics();
        sg.fillStyle(0x3a2e10, 1); sg.fillRect(cardW - 90, y + 14, 106, 28);
        sg.lineStyle(2, 0xffd96a, 1); sg.strokeRect(cardW - 90, y + 14, 106, 28);
        sg.fillStyle(0xffd96a, 0.2); sg.fillCircle(cardW - 76, y + 28, 9);
        this.add.text(cardW - 76, y + 28, '🥇', {
          fontFamily: 'sans-serif', fontSize: '15px'
        }).setOrigin(0.5);
        this.add.text(cardW - 20, y + 28, '정복 완료', {
          fontFamily: FONT, fontSize: '12px', color: '#ffd96a',
          fontStyle: 'bold'
        }).setOrigin(0.5);
        // 메달 좌측 — 안내인 대화 다시 보기 버튼
        const replayBtn = fancyButton(this, cardW - 230, y + 28, 130, 24,
          '💬 대화 다시 보기',
          () => this.showDialogueReplay(c.id, c.title),
          { base: 0x2b3a52, hover: 0x3c5170, edge: 0xc9a36b, text: '#ffe9b8' });
        if (replayBtn.t) replayBtn.t.setFontSize(11);
      } else if (c.status === 'available') {
        // 🏅 도전 가능 — 미완료지만 해제됨
        const sg = this.add.graphics();
        sg.fillStyle(0x103a2a, 1); sg.fillRect(cardW - 90, y + 14, 106, 28);
        sg.lineStyle(2, 0x7fd07f, 1); sg.strokeRect(cardW - 90, y + 14, 106, 28);
        this.add.text(cardW - 76, y + 28, '🏅', {
          fontFamily: 'sans-serif', fontSize: '15px'
        }).setOrigin(0.5);
        this.add.text(cardW - 20, y + 28, '도전 가능', {
          fontFamily: FONT, fontSize: '12px', color: '#7fd07f',
          fontStyle: 'bold'
        }).setOrigin(0.5);
      } else {
        // 🔒 잠금
        const sg = this.add.graphics();
        sg.fillStyle(0x1a1a22, 1); sg.fillRect(cardW - 90, y + 14, 106, 28);
        sg.lineStyle(1, 0x55626c, 1); sg.strokeRect(cardW - 90, y + 14, 106, 28);
        this.add.text(cardW - 76, y + 28, '🔒', {
          fontFamily: 'sans-serif', fontSize: '14px'
        }).setOrigin(0.5);
        this.add.text(cardW - 20, y + 28, '잠금', {
          fontFamily: FONT, fontSize: '12px', color: '#7a8a98'
        }).setOrigin(0.5);
      }

      // 학습 흔적 본문 (완료 사건만)
      if (done) {
        const rv = reviews[c.id];
        // 인과 사슬 (현재 사건만 reflection이 살아있음 — 사건별 누적은 향후 확장)
        const refl = (c.id === (this.registry.get('caseId') || ''))
          ? reflection : null;
        const sx = 60, sy = y + 64;
        if (refl && refl.chainNames && refl.chainNames.length === 3) {
          this.add.text(sx, sy, '🔗 인과 사슬', {
            fontFamily: FONT, fontSize: '11px', color: '#a8d4b0', fontStyle: 'bold'
          });
          this.add.text(sx + 80, sy,
            refl.chainNames.join('  →  '), {
            fontFamily: FONT, fontSize: '11px', color: '#dfffdf'
          });
        }
        if (refl && refl.statementText) {
          this.add.text(sx, sy + 18, '💭 자기성찰', {
            fontFamily: FONT, fontSize: '11px', color: '#a8d4b0', fontStyle: 'bold'
          });
          this.add.text(sx + 80, sy + 18,
            '"' + refl.statementText + '"', {
            fontFamily: FONT, fontSize: '11px', color: '#cfe9ff',
            wordWrap: { width: cardW - 160 }
          });
        }
        // 학생 본인이 쓴 한 문장 (선택 입력)
        if (refl && refl.userStatement) {
          this.add.text(sx, sy + 36, '✍ 내 생각', {
            fontFamily: FONT, fontSize: '11px', color: '#ffd96a', fontStyle: 'bold'
          });
          this.add.text(sx + 80, sy + 36,
            '"' + refl.userStatement + '"', {
            fontFamily: FONT, fontSize: '11px', color: '#fff8d0',
            wordWrap: { width: cardW - 160 }, fontStyle: 'italic'
          });
        }
        // 🕊 UN 연설문 (선택) — SpeechScene에서 작성한 본문 한 줄 인용 (50자)
        const speech = (c.id === (this.registry.get('caseId') || ''))
          ? this.registry.get('speech') : null;
        if (speech && speech.fullText) {
          this.add.text(sx, sy + 56, '🕊 UN 연설', {
            fontFamily: FONT, fontSize: '11px', color: '#a8d4b0', fontStyle: 'bold'
          });
          const snippet = speech.fullText.length > 60
            ? speech.fullText.slice(0, 60) + '…'
            : speech.fullText;
          this.add.text(sx + 80, sy + 56, '"' + snippet + '"', {
            fontFamily: FONT, fontSize: '11px', color: '#cfe9ff',
            wordWrap: { width: cardW - 160 }, fontStyle: 'italic'
          });
        }
        // 학생 본인이 쓴 다짐 (선택 입력) — 보고서 송부 직후 살아있음
        const userPledge = (c.id === (this.registry.get('caseId') || ''))
          ? (this.registry.get('userPledge') || '').trim() : '';
        if (userPledge) {
          this.add.text(sx, sy + 92, '✍ 내 다짐', {
            fontFamily: FONT, fontSize: '11px', color: '#ffd96a', fontStyle: 'bold'
          });
          this.add.text(sx + 80, sy + 92,
            '"' + userPledge + '"', {
            fontFamily: FONT, fontSize: '11px', color: '#fff8d0',
            wordWrap: { width: cardW - 160 }, fontStyle: 'italic'
          });
        }
        // 자기 평가 점수
        if (rv) {
          const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
          const avg = ((rv.goalMet + rv.factConf + rv.actionConf) / 3).toFixed(1);
          this.add.text(sx, sy + 56, '📊 자기 평가', {
            fontFamily: FONT, fontSize: '11px', color: '#a8d4b0', fontStyle: 'bold'
          });
          this.add.text(sx + 80, sy + 56,
            '평균 ' + avg + ' / 5.0   ·   목표 ' + stars(rv.goalMet) +
            '   사실 ' + stars(rv.factConf) +
            '   실천 ' + stars(rv.actionConf), {
            fontFamily: FONT, fontSize: '11px', color: '#ffd96a'
          });
          if (rv.wantNextLabel) {
            this.add.text(sx, sy + 74,
              '🔍 다음에 알고 싶은 것: ' + rv.wantNextLabel, {
              fontFamily: FONT, fontSize: '11px', color: '#cfe9ff'
            });
          }
        }
        // 🆕 P.E.A.C.E. 종합 평가 — 계획서 5차원 자동 산출
        // (현재는 caseId 기준 1건만 실시간 반영. 사건별 누적은 향후 확장)
        if (c.id === (this.registry.get('caseId') || '')) {
          const sc = computePeaceScores(this.registry);
          const gradeColor = sc.grade === 'S' ? '#ffd96a'
                           : sc.grade === 'A' ? '#7fd07f'
                           : sc.grade === 'B' ? '#cfe9ff' : '#a8c4dc';
          this.add.text(sx, sy + 94, '📌 P.E.A.C.E. 종합', {
            fontFamily: FONT, fontSize: '11px', color: '#a8d4b0', fontStyle: 'bold'
          });
          this.add.text(sx + 100, sy + 94,
            '[ ' + sc.grade + ' ]   ' + sc.total + ' / ' + sc.max, {
            fontFamily: FONT_TITLE, fontSize: '12px',
            color: gradeColor, fontStyle: 'bold'
          });
          // 5차원 — 한 줄 압축
          let dx = sx;
          PEACE_DIMS.forEach(d => {
            const v = sc.dims[d.key];
            const txt = this.add.text(dx, sy + 116,
              d.icon + ' ' + d.label + '  ' + '★'.repeat(v) + '☆'.repeat(3 - v), {
              fontFamily: FONT, fontSize: '11px', color: d.color
            });
            dx += txt.width + 14;
          });
        }
        // 뱃지 칩 — 사건 완료 시 자동 산정된 6종
        const allBadges = this.registry.get('caseBadges') || {};
        const badges = allBadges[c.id];
        if (badges) {
          const badgeDefs = [
            { key: 'collector', icon: '★', label: '단서 마스터',  color: '#ffd96a' },
            { key: 'sage',      icon: '🎯', label: '인터뷰 통달', color: '#7fd07f' },
            { key: 'empath',    icon: '💭', label: '공감 기록자', color: '#e79a78' },
            { key: 'thinker',   icon: '🔗', label: '인과 분석가', color: '#6fb7d6' },
            { key: 'reflector', icon: '📊', label: '자기 성찰',   color: '#c9a36b' },
            { key: 'balanced',  icon: '🌐', label: '균형 시민',   color: '#cfe9ff' },
          ];
          // 카드 우측 상단에 뱃지 모음 (한 줄)
          let bx = x + 360, by = y + 38;
          badgeDefs.forEach(bd => {
            if (!badges[bd.key]) return;
            this.add.text(bx, by, bd.icon, {
              fontFamily: FONT_TITLE, fontSize: '15px', color: bd.color
            }).setOrigin(1, 0);
            // 호버 시 라벨 표시
            const zone = this.add.zone(bx - 8, by + 8, 18, 18)
              .setInteractive({ useHandCursor: false });
            const tooltip = this.add.text(bx, by + 18,
              bd.icon + ' ' + bd.label, {
              fontFamily: FONT, fontSize: '10px', color: bd.color,
              backgroundColor: '#00000099', padding: { x: 4, y: 2 }
            }).setOrigin(1, 0).setVisible(false).setDepth(20);
            zone.on('pointerover', () => tooltip.setVisible(true));
            zone.on('pointerout',  () => tooltip.setVisible(false));
            bx -= 24;
          });
        }
      } else if (c.status === 'available') {
        // 도전 보상 미리보기 — 학생 동기부여
        this.add.text(60, y + 70, '🎯 도전 보상', {
          fontFamily: FONT_TITLE, fontSize: '13px', color: '#7fd07f',
          fontStyle: 'bold'
        });
        this.add.text(60, y + 92,
          '  🥇 정복 메달   ·   📊 5차원 평가 점수   ·   🏆 트로피 진열대 +1', {
          fontFamily: FONT, fontSize: '11px', color: '#a8d4b0'
        });
        this.add.text(60, y + 112,
          '— 이 사건을 마치면 학습 흔적과 보상이 여기 누적됩니다.', {
          fontFamily: FONT, fontSize: '11px', color: '#5a6470', fontStyle: 'italic'
        });
      } else {
        this.add.text(60, y + 96,
          '🔒 후속 업데이트 예정', {
          fontFamily: FONT, fontSize: '11px', color: '#5a6470', fontStyle: 'italic'
        });
      }
    });

    // 하단 종합 요약 — 완료 개수 + 평균 평가 (카드 영역 끝 532 이후)
    const ftY = 540;
    // intro(튜토리얼)는 학습 트리 카운트에서 제외 — 본 사건 완료만 표시
    const compCount = completed.filter(id => id !== 'intro').length;
    const reviewVals = Object.values(reviews);
    let avgAll = '-';
    if (reviewVals.length) {
      const sum = reviewVals.reduce((acc, r) =>
        acc + r.goalMet + r.factConf + r.actionConf, 0);
      avgAll = (sum / (reviewVals.length * 3)).toFixed(1);
    }
    // 본 사건 3개 기준 (intro 튜토리얼은 학습 트리 카운트에서 제외)
    const tCases = CASE_LIST.filter(c => c.id !== 'intro');
    this.add.text(40, ftY,
      '★ 완료 ' + compCount + ' / ' + tCases.length +
      '     ·     📊 전체 자기 평가 평균 ' + avgAll + ' / 5.0', {
      fontFamily: FONT, fontSize: '12px', color: '#dfffdf'
    });

    // 하단 — (좌) UN 연설하기(통합·1회)  (우) 사건 선택
    const goCaseSelect = () => {
      if (this.leaving) return;
      this.leaving = true;
      this.cameras.main.fadeOut(260, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete',
        () => this.scene.start('CaseSelectScene'));
    };
    if (compCount >= 1) {
      const sp = this.registry.get('speech');
      const spDone = !!(sp && sp.fullText);
      fancyButton(this, 470, 575, 240, 30,
        spDone ? '🕊  UN 연설문 (작성됨 · 보기/수정)' : '🕊  UN 연설하기 (조사 마무리)',
        () => {
          if (this.leaving) return;
          this.leaving = true;
          this.cameras.main.fadeOut(260, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete',
            () => this.scene.start('SpeechScene'));
        },
        { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' });
      fancyButton(this, 750, 575, 150, 30, '← 임무 선택', goCaseSelect,
        { base: 0x2b3a52, hover: 0x3c5170, edge: 0x6fb7d6, text: '#dff1ff' });
    } else {
      fancyButton(this, 700, 575, 160, 30, '← 임무 선택', goCaseSelect,
        { base: 0x2b3a52, hover: 0x3c5170, edge: 0x6fb7d6, text: '#dff1ff' });
    }
  }

  // 안내인 대화 다시 보기 — STORIES[cid] 노드를 start부터 순서대로 따라가며
  // 모달에 표시. 선택지가 있는 노드는 모든 선택지를 함께 보여주되 흐름은
  // 첫 번째 선택지를 따라가 outro/end까지.
  showDialogueReplay(cid, caseTitle) {
    if (this.replayOpen) return;
    this.replayOpen = true;
    const story = (typeof STORIES !== 'undefined') ? STORIES[cid] : null;
    if (!story || !story.start) {
      this.replayOpen = false;
      return;
    }

    const dim = this.add.rectangle(480, 300, 960, 600, 0x000000, 0.7)
      .setDepth(4500).setInteractive().setAlpha(0);
    this.tweens.add({ targets: dim, alpha: 0.7, duration: 180 });

    const cx = 480, cy = 300, cw = 720, ch = 520;
    const card = this.add.graphics().setDepth(4501);
    card.fillStyle(0x000000, 0.6); card.fillRect(cx - cw / 2 + 8, cy - ch / 2 + 8, cw, ch);
    card.fillStyle(0x10202e, 1); card.fillRect(cx - cw / 2, cy - ch / 2, cw, ch);
    card.fillStyle(0xe8b86a, 1); card.fillRect(cx - cw / 2, cy - ch / 2, cw, 4);
    card.fillStyle(0x000000, 1);
    card.fillRect(cx - cw / 2, cy - ch / 2, cw, 3);
    card.fillRect(cx - cw / 2, cy + ch / 2 - 3, cw, 3);
    card.fillRect(cx - cw / 2, cy - ch / 2, 3, ch);
    card.fillRect(cx + cw / 2 - 3, cy - ch / 2, 3, ch);

    // 헤더
    const head = this.add.text(cx, cy - ch / 2 + 22,
      '💬  ' + caseTitle + ' — 안내인 대화 다시 보기', {
      fontFamily: FONT_TITLE, fontSize: '16px', color: '#ffe082',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(4502);

    // 대화 흐름 따라가기 — start → next → ... → end/befriend
    const lines = [];
    let nodeKey = 'start';
    const visited = new Set();
    while (nodeKey && !visited.has(nodeKey)) {
      visited.add(nodeKey);
      const node = story[nodeKey];
      if (!node) break;
      // 화자 + 대사
      if (node.text) {
        const speaker = node.speaker || '(나레이션)';
        const prefix  = node.speaker ? speaker + ': ' : '';
        lines.push(prefix + node.text);
      }
      // 선택지 (있다면 모두 표시 — 학생이 어떤 답변을 들었는지 다시 볼 수 있게)
      if (node.choices && node.choices.length > 0) {
        node.choices.forEach((ch, i) => {
          lines.push('  └ [선택지 ' + (i + 1) + '] ' + ch.label);
        });
        nodeKey = node.choices[0].next;   // 첫 분기 따라감
      } else {
        nodeKey = node.next;
      }
      if (node.end || node.befriend) break;
    }

    const body = this.add.text(cx - cw / 2 + 22, cy - ch / 2 + 54,
      lines.join('\n\n'), {
      fontFamily: FONT, fontSize: '12px', color: '#dfefff',
      wordWrap: { width: cw - 44 }, lineSpacing: 4
    }).setDepth(4502);

    // 닫기 버튼
    const closeBtn = fancyButton(this, cx, cy + ch / 2 - 30, 140, 32, '← 닫기',
      () => closeReplay(),
      { base: 0x2b3a52, hover: 0x3c5170, edge: 0x6fb7d6, text: '#dff1ff' });
    if (closeBtn.g)    closeBtn.g.setDepth(4503);
    if (closeBtn.t)    closeBtn.t.setDepth(4504);
    if (closeBtn.zone) closeBtn.zone.setDepth(4505);

    const closeReplay = () => {
      dim.destroy(); card.destroy(); head.destroy(); body.destroy();
      if (closeBtn.g)    closeBtn.g.destroy();
      if (closeBtn.t)    closeBtn.t.destroy();
      if (closeBtn.zone) closeBtn.zone.destroy();
      this.replayOpen = false;
    };
    dim.on('pointerdown', closeReplay);
  }
}

// ══════════════════════════════════════════════════════════════
//  임무 브리핑 / 로딩 화면 (BriefingScene)
//  — CaseSelectScene 에서 사건 선택 직후 진입.
//  — 사건 요약·진행 바를 보여주고 자동 또는 클릭 시 WorldScene 으로.
// ══════════════════════════════════════════════════════════════
class BriefingScene extends Phaser.Scene {
  constructor() { super('BriefingScene'); }

  create() {
    setCfgBarVisible(false);
    const W = GAME_W, H = GAME_H;
    const id = this.registry.get('caseId') || 'aralsea';
    const c = CASE_LIST.find(x => x.id === id) || CASE_LIST[0];

    // ── 배경: 어두운 코발트 + 격자 (선택 화면과 톤 일치) ───────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x040a14, 0x040a14, 0x0e2238, 0x081628, 1);
    bg.fillRect(0, 0, W, H);
    bg.lineStyle(1, 0x1a3a5c, 0.25);
    for (let x = 0; x < W; x += 40) bg.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) bg.lineBetween(0, y, W, y);

    // ── 상단: CLASSIFIED 헤더 (첩보 톤) ────────────────────────
    const head = this.add.graphics();
    head.fillStyle(c.accent, 1); head.fillRect(40, 60, 4, 28);
    this.add.text(56, 60, '✦  CLASSIFIED  ✦', {
      fontFamily: FONT, fontSize: '13px', color: '#a8c4dc'
    });
    this.add.text(56, 80, '임무 브리핑  ·  MISSION  BRIEFING', {
      fontFamily: FONT, fontSize: '13px', color: '#7aa6c8'
    });
    // 우상단 사건 코드 — 박스와 텍스트 가운데를 맞춤(x=820 ↔ 박스 720~920)
    const codeBox = this.add.graphics();
    codeBox.fillStyle(0x0e2238, 1); codeBox.fillRect(720, 56, 200, 36);
    codeBox.lineStyle(2, 0x2a5a82, 1); codeBox.strokeRect(720, 56, 200, 36);
    this.add.text(820, 74, c.code, {
      fontFamily: FONT, fontSize: '12px', color: '#cfe9ff'
    }).setOrigin(0.5);

    // ── 중앙 메인 패널 ─────────────────────────────────────────
    const panelX = 50, panelY = 120, panelW = 860, panelH = 360;
    const pg = this.add.graphics();
    pg.fillStyle(0x0a1828, 0.9); pg.fillRect(panelX, panelY, panelW, panelH);
    pg.lineStyle(2, c.accent, 0.8); pg.strokeRect(panelX, panelY, panelW, panelH);
    // 좌측 강조 줄
    pg.fillStyle(c.accent, 1); pg.fillRect(panelX, panelY, 6, panelH);

    // 사건 제목 — 크고 강조
    const title = this.add.text(panelX + 30, panelY + 30, c.title, {
      fontFamily: FONT_TITLE, fontSize: '46px', color: '#ffe9b8',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 4
    }).setAlpha(0);
    // 부제
    const sub = this.add.text(panelX + 32, panelY + 92, c.subtitle, {
      fontFamily: FONT, fontSize: '17px', color: '#cfe9ff'
    }).setAlpha(0);
    // 지역
    const region = this.add.text(panelX + 32, panelY + 122,
      '📍  ' + c.region, {
      fontFamily: FONT, fontSize: '14px', color: '#a8c4dc'
    }).setAlpha(0);

    // 구분선
    const divider = this.add.graphics().setAlpha(0);
    divider.lineStyle(1, 0x2a5a82, 1);
    divider.lineBetween(panelX + 30, panelY + 158, panelX + panelW - 30, panelY + 158);

    // 임무 요약 헤더
    const briefHdr = this.add.text(panelX + 32, panelY + 172,
      '🎯  임무 요약', {
      fontFamily: FONT_TITLE, fontSize: '16px',
      color: '#ffd96a', fontStyle: 'bold'
    }).setAlpha(0);

    // 임무 본문 — 좌측 절반에만 차도록 wordWrap (지도 영역 침범 방지)
    const briefBody = this.add.text(panelX + 32, panelY + 200,
      c.mission.join('\n'), {
      fontFamily: FONT, fontSize: '14px', color: '#e6efff',
      lineSpacing: 6, wordWrap: { width: 420 }
    }).setAlpha(0);

    // ── 우측 — 사건별 현장 미니 지도 (실제 world_map 줌인) ────
    // 패널 우측 상단으로 끌어올림 — 사건 제목 같은 라인 시작
    const mapX = panelX + 470, mapY = panelY + 20;
    const mapW = 360, mapH = 220;
    const mapG = this.add.graphics().setAlpha(0);
    // 박스 외곽
    mapG.fillStyle(0x081628, 0.95); mapG.fillRect(mapX, mapY, mapW, mapH);
    mapG.lineStyle(2, 0x2a5a82, 1); mapG.strokeRect(mapX, mapY, mapW, mapH);
    // 헤더 띠
    mapG.fillStyle(0x122842, 1); mapG.fillRect(mapX, mapY, mapW, 24);
    mapG.lineStyle(1, 0x2a5a82, 1);
    mapG.lineBetween(mapX, mapY + 24, mapX + mapW, mapY + 24);

    const mapHdr = this.add.text(mapX + 10, mapY + 12,
      '📡  현장 지도  ·  SECTOR MAP', {
      fontFamily: FONT, fontSize: '11px', color: '#cfe9ff'
    }).setOrigin(0, 0.5).setAlpha(0);
    const mapMeta = this.add.text(mapX + mapW - 10, mapY + 12,
      'Equirectangular · PD', {
      fontFamily: FONT, fontSize: '9px', color: '#7aa6c8'
    }).setOrigin(1, 0.5).setAlpha(0);

    // 사건별 라벨 (위치는 CASE_LIST.mapX/mapY 직접 사용 — CaseSelectScene과
    // 동일 좌표계라 사용자가 디버그 픽커로 보정한 정확 위치 자동 반영)
    const EVENT_LABELS = {
      intro:     { label: 'UN HQ · NYC',       name: 'North America'   },
      aralsea:   { label: 'Moynaq',            name: 'Aral Sea Region' },
      ukraine:   { label: 'Kyiv',              name: 'Ukraine'         },
      palestine: { label: 'Jerusalem / Gaza',  name: 'Palestine'       },
    };
    const ev = EVENT_LABELS[c.id] || EVENT_LABELS.aralsea;

    // 미니맵 내부 본문 영역 (헤더 24px 제외)
    const bodyY = mapY + 24, bodyH = mapH - 24;

    // world_map 원본 사이즈 (BootScene preload에 있는 PD 세계지도 1280x836)
    const WORLD_ORIG_W = 1280, WORLD_ORIG_H = 836;
    // CaseSelectScene 지도 패널 사이즈 (580x274, 이미지 origin (360, 118))
    const CASE_SCALE_X = 580 / WORLD_ORIG_W;
    const CASE_SCALE_Y = 274 / WORLD_ORIG_H;
    // 사건 위치 → 원본 픽셀 좌표 (mapX/mapY 역변환)
    // 이미지 위경도 변환이 부정확하므로 CaseSelectScene과 동일한 좌표계 사용
    const evXorig = (c.mapX - 360) / CASE_SCALE_X;
    const evYorig = (c.mapY - 118) / CASE_SCALE_Y;
    // 미니맵 줌 — CaseSelectScene 표시 비율 대비 약 2배 확대 (지역 디테일)
    const worldScale = CASE_SCALE_X * 2;
    const dispW = WORLD_ORIG_W * worldScale;
    const dispH = WORLD_ORIG_H * worldScale;
    // 미니맵 본문 가운데에 사건 위치 오도록 이미지 좌상단 좌표 계산
    const cx = mapX + mapW / 2, cy = bodyY + bodyH / 2;
    const imgX = cx - evXorig * worldScale;
    const imgY = cy - evYorig * worldScale;

    // 세계지도 이미지 (다크 청회색 톤)
    const worldImg = this.add.image(imgX, imgY, 'world_map').setOrigin(0, 0);
    worldImg.setDisplaySize(dispW, dispH);
    worldImg.setTint(0x8fb6d4);
    worldImg.setAlpha(0);
    // 마스크 — 미니맵 본문 밖으로 안 나가도록
    const mask = this.make.graphics({ add: false });
    mask.fillStyle(0xffffff, 1);
    mask.fillRect(mapX + 2, bodyY + 1, mapW - 4, bodyH - 2);
    worldImg.setMask(mask.createGeometryMask());

    // 펄스 링 + 빨간 핑 마커 (사건 위치)
    const pulse = this.add.circle(cx, cy, 5, 0xff4040, 0).setAlpha(0);
    pulse.setStrokeStyle(2, 0xff5050, 0.9);
    this.tweens.add({
      targets: pulse, radius: 14, alpha: 0,
      duration: 1500, repeat: -1, ease: 'Sine.out'
    });
    const dot = this.add.graphics().setAlpha(0);
    dot.lineStyle(2, 0xffffff, 1); dot.strokeCircle(cx, cy, 5);
    dot.fillStyle(0xff4040, 1); dot.fillCircle(cx, cy, 3.5);
    dot.fillStyle(0xffffff, 1); dot.fillCircle(cx, cy, 1.2);

    // 마커 라벨 — 가독성 위해 어두운 박스 + 흰 텍스트
    const labelBg = this.add.graphics().setAlpha(0);
    const labelText = '▼  ' + ev.label;
    const lblW = labelText.length * 7 + 12;
    labelBg.fillStyle(0x000000, 0.75);
    labelBg.fillRect(cx + 10, cy - 12, lblW, 18);
    const labelTx = this.add.text(cx + 16, cy - 3, labelText, {
      fontFamily: FONT, fontSize: '11px', color: '#ff8a8a'
    }).setOrigin(0, 0.5).setAlpha(0);

    // 지역명 (좌상단 본문 안)
    const regionLbl = this.add.text(mapX + 12, bodyY + 10, ev.name, {
      fontFamily: FONT, fontSize: '11px', color: '#cfe9ff',
      backgroundColor: '#00000099', padding: { x: 4, y: 2 }
    }).setAlpha(0);

    const mapLabels = [worldImg, pulse, dot, labelBg, labelTx, regionLbl];

    // 학습 영역 배지 (아랄해만 표시)
    const tagY = panelY + 318;
    let tagObjs = [];
    if (c.id === 'aralsea') {
      const tags = [
        { label: '인지', color: 0x6fb7d6 },
        { label: '정서', color: 0xe79a78 },
        { label: '행동', color: 0x7fd07f },
      ];
      // 학습 영역 라벨 + 배지 3개를 패널 가운데로 정렬
      const badgeW = 54, badgeGap = 8;
      const totalW = 78 /* "학습 영역" 라벨 폭 */
                   + 12 /* 라벨↔첫 배지 간격 */
                   + badgeW * 3 + badgeGap * 2;
      const groupStartX = panelX + (panelW - totalW) / 2;
      this.add.text(groupStartX, tagY,
        '학습 영역', {
        fontFamily: FONT, fontSize: '11px', color: '#7aa6c8'
      });
      tags.forEach((t, i) => {
        const tx = groupStartX + 90 + i * (badgeW + badgeGap);
        const tg = this.add.graphics();
        tg.fillStyle(t.color, 0.9); tg.fillRect(tx, tagY - 4, badgeW, 22);
        const txt = this.add.text(tx + badgeW / 2, tagY + 7, t.label, {
          fontFamily: FONT, fontSize: '11px', color: '#0a1828'
        }).setOrigin(0.5);
        tg.setAlpha(0); txt.setAlpha(0);
        tagObjs.push(tg, txt);
      });
    }

    // ── 하단: 진행 바 + 안내 (16:10 가운데 정렬) ───────────────
    const barW = 800, barH = 12;
    const barX = (GAME_W - barW) / 2;   // = 80, 자연스럽게 양 끝 80px 마진
    const barY = 510;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x10202e, 1); barBg.fillRect(barX, barY, barW, barH);
    barBg.lineStyle(1, 0x2a5a82, 1); barBg.strokeRect(barX, barY, barW, barH);
    // 진행 막대 (애니메이션으로 채워짐)
    const bar = this.add.graphics();
    const fillBar = (pct) => {
      bar.clear();
      bar.fillStyle(c.accent, 1);
      bar.fillRect(barX + 1, barY + 1, (barW - 2) * pct, barH - 2);
      // 머리 부분 하이라이트
      bar.fillStyle(0xffffff, 0.4);
      bar.fillRect(barX + 1, barY + 1, Math.max(1, (barW - 2) * pct - 4), 2);
    };
    fillBar(0);

    const loadingText = this.add.text(480, 540, '현장으로 이동 중', {
      fontFamily: FONT, fontSize: '14px', color: '#cfe9ff'
    }).setOrigin(0.5);
    const skipText = this.add.text(480, 565, '클릭하여 건너뛰기  ·  SPACE / ENTER', {
      fontFamily: FONT, fontSize: '11px', color: '#5a7894'
    }).setOrigin(0.5);

    // ── 페이드 인 + 순차 등장 + 진행 바 ───────────────────────
    this.cameras.main.fadeIn(360, 0, 0, 0);

    // 텍스트 순차 등장 (단계별 delay)
    const fadeIn = (obj, delay, dy = 8) => {
      obj.y += dy;
      this.tweens.add({
        targets: obj, alpha: 1, y: obj.y - dy,
        duration: 320, delay, ease: 'Sine.out'
      });
    };
    fadeIn(title, 200);
    fadeIn(sub, 400);
    fadeIn(region, 520);
    fadeIn(divider, 700);
    fadeIn(briefHdr, 800);
    fadeIn(briefBody, 950);
    fadeIn(mapG, 850);
    fadeIn(mapHdr, 900);
    fadeIn(mapMeta, 920);
    mapLabels.forEach((lbl, i) => fadeIn(lbl, 1050 + i * 60));
    tagObjs.forEach((o, i) => fadeIn(o, 1100 + i * 60));

    // 로딩 점 애니메이션 (현장으로 이동 중...)
    let dots = 0;
    this.dotTimer = this.time.addEvent({
      delay: 380, loop: true,
      callback: () => {
        dots = (dots + 1) % 4;
        loadingText.setText('현장으로 이동 중' + '.'.repeat(dots));
      }
    });

    // 진행 바: 3.2초에 걸쳐 채워짐. 다 차도 자동 진입 안 함 — 사용자 입력 대기.
    const totalMs = 3200;
    this.briefDone = false;
    this.barReady = false;
    this.tweens.add({
      targets: { v: 0 }, v: 1, duration: totalMs, ease: 'Sine.inOut',
      onUpdate: (tw, tgt) => fillBar(tgt.v),
      onComplete: () => {
        // 자동 진행 대신 사용자 입력 대기 — 안내문·점 애니메이션 멈춤
        this.barReady = true;
        if (this.dotTimer) { this.dotTimer.remove(); this.dotTimer = null; }
        loadingText.setText('▶  클릭하여 현장 진입');
        loadingText.setColor('#ffe9b8');
        this.tweens.add({
          targets: loadingText, alpha: 0.6, duration: 700,
          yoyo: true, repeat: -1, ease: 'Sine.inOut'
        });
      },
    });

    // 클릭/Space/Enter — 진행 바 차기 전엔 즉시 진입(건너뛰기), 다 찬 후엔 진입
    const skip = () => this.proceed();
    this.input.on('pointerdown', skip);
    this.input.keyboard.on('keydown-SPACE', skip);
    this.input.keyboard.on('keydown-ENTER', skip);
  }

  proceed() {
    if (this.briefDone) return;
    this.briefDone = true;
    if (this.dotTimer) this.dotTimer.remove();
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('WorldScene');
    });
  }
}

// UNESCO 세계시민교육 3영역 — 단서·핵심단서에 색상 배지로 표시
const AREA_INFO = {
  cognitive:   { label: '인지',  color: 0x6fb7d6, hex: '#6fb7d6' },
  emotional:   { label: '정서',  color: 0xe79a78, hex: '#e79a78' },
  behavioral:  { label: '행동',  color: 0x7fd07f, hex: '#7fd07f' },
};
function getArea(ev) {
  return ev && ev.area && AREA_INFO[ev.area] ? AREA_INFO[ev.area] : null;
}

// ══════════════════════════════════════════════════════════════
//  P.E.A.C.E. 종합 평가 — 계획서 평가 루브릭(5항목 x 3점 = 15점)
//  · 각 차원은 registry에 누적된 학습 데이터로부터 자동 산출
//  · 학습 트리 카드 · 인쇄 보고서 · 교사 대시보드에서 공통 사용
// ══════════════════════════════════════════════════════════════
const PEACE_DIMS = [
  { key: 'empathy',     label: '공감',       en: 'Empathy',     color: '#e79a78', icon: '🤝' },
  { key: 'cognition',   label: '사실 이해',  en: 'Cognition',   color: '#6fb7d6', icon: '🧠' },
  { key: 'connection',  label: '연결 의식',  en: 'Connection',  color: '#7fd07f', icon: '🔗' },
  { key: 'action',      label: '실천 다짐',  en: 'Action',      color: '#ffd96a', icon: '✊' },
  { key: 'cooperation', label: '국제 협력',  en: 'Cooperation', color: '#c9a3ff', icon: '🌍' },
];

function computePeaceScores(registry) {
  const love = registry.get('slimeLove') || 0;
  const evidence = registry.get('evidence') || [];
  const cores = registry.get('coreClues') || [];
  const refl = registry.get('reflection') || null;
  const speech = registry.get('speech') || null;
  const completedCases = registry.get('completedCases') || [];
  const caseId = registry.get('caseId') || 'aralsea';
  const letterSent = completedCases.includes(caseId);
  const review = registry.get('learningReview') || null;

  // 공감 (Empathy) — 안내인과의 대화 깊이(이해도 누적)
  let empathy = 0;
  if (love >= 8) empathy = 3;
  else if (love >= 5) empathy = 2;
  else if (love >= 2) empathy = 1;

  // 사실 이해 (Cognition) — 현장 단서 + 핵심 단서 수집량
  // intro는 단서가 3개뿐(본 사건은 12개)이라 임계값 별도
  const evTotal = evidence.length + cores.length;
  let cognition = 0;
  if (caseId === 'intro') {
    if (evTotal >= 4) cognition = 3;   // 단서 3 + 핵심 1 = 만점
    else if (evTotal >= 3) cognition = 2;
    else if (evTotal >= 1) cognition = 1;
  } else {
    if (evTotal >= 12) cognition = 3;
    else if (evTotal >= 9) cognition = 2;
    else if (evTotal >= 5) cognition = 1;
  }

  // 연결 의식 (Connection) — 인과 사슬 + 자기성찰
  let connection = 0;
  if (refl && refl.chainNames && refl.chainNames.length === 3) {
    connection = 2;
    if (refl.statementText) connection = 3;
  }

  // 실천 다짐 (Action) — UN 보고서 + UN 연설문
  let action = 0;
  if (letterSent) action = 2;
  if (letterSent && speech && speech.fullText) action = 3;

  // 국제 협력 (Cooperation) — 사건별 "국제 협력의 손길" 단서 두 개
  //   아랄해 : restore(코카랄 댐) + action(UN·국제기구)
  //   우크라이나: corridor(흑해 곡물 협정) + aid(UN·NGO 구호)
  //   팔레스타인: aid_alliance(UN·적신월·NGO) + shared_water(공동 식수 탱크)
  const COOP_IDS = {
    intro:     ['past_records', 'mission_brief'],   // 튜토리얼은 단서 2개 모두 수집하면 만점
    aralsea:   ['restore', 'action'],
    ukraine:   ['corridor', 'aid'],
    palestine: ['aid_alliance', 'shared_water'],
  };
  const coopIds = COOP_IDS[caseId] || COOP_IDS.aralsea;
  const hasA = evidence.some(e => e.id === coopIds[0]);
  const hasB = evidence.some(e => e.id === coopIds[1]);
  let cooperation = 0;
  if (hasA && hasB) {
    cooperation = 2;
    if (letterSent) cooperation = 3;
  } else if (hasA || hasB) cooperation = 1;

  const dims = { empathy, cognition, connection, action, cooperation };
  const total = empathy + cognition + connection + action + cooperation;
  const max = 15;
  // 등급: 13+ S(우수), 10+ A(좋음), 7+ B(보통), 그 외 C(시작)
  let grade = 'C';
  if (total >= 13) grade = 'S';
  else if (total >= 10) grade = 'A';
  else if (total >= 7) grade = 'B';
  return { dims, total, max, grade };
}

// 상단 참가설정 바 — Title/Credits 에서만 보이고 게임 중엔 숨김
function setCfgBarVisible(visible) {
  if (typeof document === 'undefined') return;
  const bar = document.getElementById('cfgBar');
  if (bar) bar.style.display = visible ? 'flex' : 'none';
}

// 교사 대시보드로 현재 진행도 발행 (Telemetry 없거나 미연결이면 무시)
function reportProgress(scene, extra) {
  // 자동 저장 — MQTT 연결 여부와 무관하게 매 단계 전환점에서 호출됨
  try { saveGameState(scene.registry); } catch (e) { /* 무시 */ }
  if (!window.Telemetry) return;
  try {
    const r = scene.registry;
    const caseId = r.get('caseId') || 'aralsea';
    const completed = r.get('completedCases') || [];

    // 자기주도성 데이터 — 본문이 짧으므로 그대로 발행
    const refl = r.get('reflection') || null;
    const review = r.get('learningReview') || null;
    const tags = r.get('evidenceTags') || {};

    // 감정 태그 분포 집계 (어떤 감정을 몇 번 골랐는지) — 학급 통계에 사용
    const tagCount = {};
    Object.values(tags).forEach(t => {
      if (t && t.id) tagCount[t.id] = (tagCount[t.id] || 0) + 1;
    });

    // P.E.A.C.E. 5차원 점수 자동 산출 (대시보드에 전송)
    let peace = null;
    try { peace = computePeaceScores(r); } catch (e) { /* 무시 */ }

    const state = {
      caseId,                                       // 현재 진행 중 사건
      completedCases: completed.length,             // 완료 사건 개수
      stage: r.get('stage') || 1,
      evidence: (r.get('evidence') || []).length,
      cores: (r.get('coreClues') || []).length,
      reportSent: !!r.get('reportSent'),
      reflectionDone: !!r.get('reflectionDone'),
      // 자기주도성 메타데이터 (학생 본인의 사고 흔적)
      reflection: refl ? {
        chainNames: refl.chainNames || [],
        statement: refl.statementText || '',
        userStatement: refl.userStatement || '',  // 학생이 직접 쓴 한 문장
      } : null,
      userPledge: (r.get('userPledge') || '').trim(),
      review: review ? {
        goalMet:    review.goalMet,
        factConf:   review.factConf,
        actionConf: review.actionConf,
        wantNext:   review.wantNextLabel || '',
      } : null,
      tagCount,                                     // { custom: N } (RRRRR-1 자유 입력 후엔 의미 작음)
      tagsCount: Object.keys(tags).length,          // 부착된 태그 총 개수
      // 학생이 단서마다 직접 쓴 한 문장 (자유 입력 — 대시보드에서 학습 흔적 표시)
      tags: Object.fromEntries(
        Object.entries(tags).map(([eid, t]) => [
          eid, { label: (t && t.label) || '' }
        ])
      ),
      peace,                                        // { dims, total, max, grade }
    };
    if (extra) Object.assign(state, extra);
    window.Telemetry.update(state);
  } catch (e) { /* 무시 */ }
}

// 공통: 픽셀(도트) 패널 — 각진 모서리 + 블록 그림자 + 이중 테두리
function panel(scene, cx, cy, w, h, fill, border) {
  const g = scene.add.graphics();
  const x = Math.round(cx - w / 2), y = Math.round(cy - h / 2);
  // 블록 그림자 (8비트 두께)
  g.fillStyle(0x000000, 0.55); g.fillRect(x + 8, y + 8, w, h);
  // 본체
  g.fillStyle(fill, 1); g.fillRect(x, y, w, h);
  // 외곽 — NES 박스 스타일 (8픽셀 검정 외곽 + 4픽셀 컬러)
  g.fillStyle(0x000000, 1);
  g.fillRect(x, y, w, 4); g.fillRect(x, y + h - 4, w, 4);
  g.fillRect(x, y, 4, h); g.fillRect(x + w - 4, y, 4, h);
  // 안쪽 컬러 테두리 (4픽셀)
  g.fillStyle(border, 1);
  g.fillRect(x + 4, y + 4, w - 8, 4); g.fillRect(x + 4, y + h - 8, w - 8, 4);
  g.fillRect(x + 4, y + 4, 4, h - 8); g.fillRect(x + w - 8, y + 4, 4, h - 8);
  // 상단 하이라이트 줄
  g.fillStyle(0xffffff, 0.18);
  g.fillRect(x + 8, y + 8, w - 16, 2);
  return g;
}

// ── 공통: 사운드 토글 (음소거 버튼) ─────────────────────────────
// 우상단·타이틀 등 어디서나 호출 가능. window.SFX.toggleMute() 연동
// + localStorage 자동 저장 (audio.js 내부). 라벨: 🔊 (음 켜짐) / 🔇 (음소거)
function addMuteToggle(scene, x, y, r) {
  r = r || 14;
  const bg = scene.add.graphics().setDepth(2000);
  const label = scene.add.text(x, y, '', {
    fontFamily: 'sans-serif', fontSize: '17px'
  }).setOrigin(0.5).setDepth(2001);

  const redraw = () => {
    const m = (window.SFX && window.SFX.isMuted()) ? true : false;
    bg.clear();
    bg.fillStyle(0x000000, 0.55);
    bg.fillCircle(x, y, r);
    bg.lineStyle(1.5, m ? 0x886666 : 0xe8b86a, 1);
    bg.strokeCircle(x, y, r);
    label.setText(m ? '🔇' : '🔊');
    label.setAlpha(m ? 0.7 : 1);
  };
  redraw();

  const zone = scene.add.circle(x, y, r, 0, 0)
    .setInteractive({ useHandCursor: true }).setDepth(2002);
  zone.on('pointerover', () => label.setScale(1.12));
  zone.on('pointerout',  () => label.setScale(1.0));
  // 클릭 → 음향 설정 패널 (전체 음소거 + BGM·효과음 음량 슬라이더)
  zone.on('pointerdown', () => {
    if (!window.SFX) return;
    openSoundSettings(scene, redraw);
  });
  return { bg, label, zone, redraw };
}

// ── 슬라이더 (0~1 값, 드래그 + 트랙 클릭) ───────────────────────
function makeSlider(scene, cx, cy, w, init, depth, onChange) {
  const h = 12, x0 = Math.round(cx - w / 2);
  let val = Math.max(0, Math.min(1, init));
  let dim = false;
  const g = scene.add.graphics().setDepth(depth);
  const knob = scene.add.circle(x0 + w * val, cy, 12, 0xffe9b8)
    .setStrokeStyle(3, 0x1a0e08).setDepth(depth + 2);
  const pct = scene.add.text(cx + w / 2 + 24, cy, Math.round(val * 100) + '%', {
    fontFamily: FONT, fontSize: '15px', color: '#dff1ff'
  }).setOrigin(0, 0.5).setDepth(depth + 1);
  const draw = () => {
    g.clear();
    g.fillStyle(0x0d161f, 1); g.fillRect(x0, cy - h / 2, w, h);
    g.fillStyle(dim ? 0x44505a : 0x3e8b73, 1);
    g.fillRect(x0, cy - h / 2, Math.round(w * val), h);
    g.lineStyle(2, 0x55626c, 1); g.strokeRect(x0, cy - h / 2, w, h);
    knob.x = x0 + w * val;
    knob.setFillStyle(dim ? 0x8a96a0 : 0xffe9b8);
    pct.setText(Math.round(val * 100) + '%');
    pct.setColor(dim ? '#8a96a0' : '#dff1ff');
  };
  draw();
  const setFromX = (px) => {
    val = Math.max(0, Math.min(1, (px - x0) / w));
    draw(); if (onChange) onChange(val);
  };
  const track = scene.add.zone(cx, cy, w + 24, 42)
    .setInteractive({ useHandCursor: true }).setDepth(depth + 1);
  track.on('pointerdown', (p) => setFromX(p.x));
  knob.setInteractive({ draggable: true, useHandCursor: true });
  scene.input.setDraggable(knob);
  knob.on('drag', (p, dragX) => setFromX(dragX));
  return {
    setDim(d) { dim = d; draw(); },
    setValue(v) { val = Math.max(0, Math.min(1, v)); draw(); },
    getValue() { return val; },
    objects: [g, knob, pct, track],
  };
}

// ── 음향 설정 모달 — 전체 음소거 + BGM·효과음 음량 슬라이더 ──────
function openSoundSettings(scene, onClose) {
  if (scene._soundPanelOpen) return;
  scene._soundPanelOpen = true;
  const D = 6000;
  const items = [];
  const reg = (o) => { items.push(o); return o; };
  const sliders = [];
  const dbtn = (b) => {
    b.g.setDepth(D + 2); b.t.setDepth(D + 3); b.zone.setDepth(D + 3);
    reg(b.g); reg(b.t); reg(b.zone); return b;
  };

  reg(scene.add.rectangle(480, 300, 960, 600, 0x000000, 0.62)
    .setDepth(D).setInteractive());
  reg(panel(scene, 480, 300, 470, 340, 0x14202c, 0xe8b86a).setDepth(D + 1));
  reg(scene.add.text(480, 165, '🔊  음향 설정', {
    fontFamily: FONT_TITLE, fontSize: '22px', color: '#ffe9b8', fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(D + 3));

  const isMuted = () => !!(window.SFX && window.SFX.isMuted());
  const muteText = () => isMuted() ? '🔇  전체 음소거 : ON' : '🔊  전체 음소거 : OFF';
  const applyDim = () => { const m = isMuted(); sliders.forEach((s) => s.setDim(m)); };

  const muteBtn = dbtn(fancyButton(scene, 480, 222, 360, 42, muteText(), () => {
    const m = window.SFX.toggleMute();
    muteBtn.t.setText(muteText());
    applyDim();
    if (!m) window.SFX.play('click');
    if (typeof onClose === 'function') onClose();   // 상단 아이콘 즉시 갱신
  }, { base: 0x2b3a52, hover: 0x3c5170, edge: 0xffd96a, text: '#ffe9b8' }));

  // 배경음 음량
  reg(scene.add.text(288, 285, '🎵  배경음', {
    fontFamily: FONT, fontSize: '16px', color: '#dff1ff'
  }).setOrigin(0, 0.5).setDepth(D + 3));
  const bgmS = makeSlider(scene, 505, 312, 270,
    window.SFX ? window.SFX.getBgmVolume() : 0.5, D + 2,
    (v) => { if (window.SFX) window.SFX.setBgmVolume(v); });
  sliders.push(bgmS); bgmS.objects.forEach(reg);

  // 효과음 음량 (조절 시 미리듣기 클릭음)
  reg(scene.add.text(288, 360, '🔔  효과음', {
    fontFamily: FONT, fontSize: '16px', color: '#dff1ff'
  }).setOrigin(0, 0.5).setDepth(D + 3));
  let sfxThrottle = 0;
  const sfxS = makeSlider(scene, 505, 387, 270,
    window.SFX ? window.SFX.getSfxVolume() : 0.85, D + 2,
    (v) => {
      if (!window.SFX) return;
      window.SFX.setSfxVolume(v);
      const now = Date.now();
      if (now - sfxThrottle > 140) { sfxThrottle = now; window.SFX.play('click'); }
    });
  sliders.push(sfxS); sfxS.objects.forEach(reg);

  applyDim();

  const close = () => {
    items.forEach((o) => { try { o.destroy(); } catch (e) {} });
    scene._soundPanelOpen = false;
    if (typeof onClose === 'function') onClose();
  };
  dbtn(fancyButton(scene, 480, 444, 132, 34, '✓ 닫기', close,
    { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' }));
  if (scene.input && scene.input.keyboard) {
    scene.input.keyboard.once('keydown-ESC', close);
  }
}

// 공통: 픽셀 버튼 — 각진 모서리, 블록 그림자, 도트풍 베벨
function fancyButton(scene, x, y, w, h, label, cb, theme) {
  theme = theme || { base: 0x2b3a52, hover: 0x3c5170, edge: 0xe8b86a, text: '#ffe9b8' };
  const g = scene.add.graphics();
  const lx = Math.round(x - w / 2), ly = Math.round(y - h / 2);
  const draw = (c) => {
    g.clear();
    // 8비트 두께 블록 그림자
    g.fillStyle(0x000000, 0.55); g.fillRect(lx + 6, ly + 6, w, h);
    g.fillStyle(c, 1); g.fillRect(lx, ly, w, h);
    // 검정 외곽 (3픽셀)
    g.fillStyle(0x000000, 1);
    g.fillRect(lx, ly, w, 3); g.fillRect(lx, ly + h - 3, w, 3);
    g.fillRect(lx, ly, 3, h); g.fillRect(lx + w - 3, ly, 3, h);
    // 컬러 테두리 (3픽셀)
    g.fillStyle(theme.edge, 1);
    g.fillRect(lx + 3, ly + 3, w - 6, 3); g.fillRect(lx + 3, ly + h - 6, w - 6, 3);
    g.fillRect(lx + 3, ly + 3, 3, h - 6); g.fillRect(lx + w - 6, ly + 3, 3, h - 6);
    // 위쪽 하이라이트, 아래쪽 음영
    g.fillStyle(0xffffff, 0.25); g.fillRect(lx + 6, ly + 6, w - 12, 2);
    g.fillStyle(0x000000, 0.35); g.fillRect(lx + 6, ly + h - 8, w - 12, 2);
  };
  draw(theme.base);
  // 터치 친화: 모바일에서는 hit area를 사방으로 10px 씩 확장 (시각은 그대로)
  // 손가락 평균 너비 9-12mm → 작은 버튼이 잘 안 눌리는 문제 완화
  const padTouch = window.IS_MOBILE ? 10 : 0;
  const zone = scene.add.zone(x, y, w + padTouch * 2, h + padTouch * 2)
    .setInteractive({ useHandCursor: true });
  const t = scene.add.text(x, y, label, {
    fontFamily: FONT, fontSize: '18px', color: theme.text
  }).setOrigin(0.5);
  zone.on('pointerover', () => {
    draw(theme.hover);
    if (window.SFX) window.SFX.play('hover');
  });
  zone.on('pointerout', () => draw(theme.base));
  zone.on('pointerdown', () => {
    if (window.SFX) window.SFX.play('click');
    cb();
  });
  return { g, zone, t };
}

class WorldScene extends Phaser.Scene {
  constructor() { super('WorldScene'); }

  create() {
    setCfgBarVisible(false);   // 게임 중엔 참가 설정 바 숨김

    // 부드러운 페이드-인 — 브리핑/조사/편지 등 어디서 돌아와도 자연스럽게
    this.cameras.main.fadeIn(280, 0, 0, 0);

    // ⚠️ 플래그 리셋 — InvestigationScene/LetterScene에서 scene.start('WorldScene')로
    // 돌아오면 클래스 인스턴스는 재사용되어 'entering=true'가 남아있을 수 있다.
    // 이 잠금이 풀리지 않으면 NPC overlap 콜백이 항상 차단된다(대화창이 안 뜸).
    this.talking = false;
    this.entering = false;
    this.cardOpen = false;
    // 입장 직후 짧은 쿨다운 — 돌아온 위치가 NPC와 겹쳐있을 수 있어 즉시 발동 방지
    this.cooldown = true;
    this.time.delayedCall(450, () => { this.cooldown = false; });

    // 바닥(16:10 폭 GAME_W=960으로 통째로 채움) + 벽만 타일
    // ── 사건별 분기 ──
    //  aralsea   : 사막 흙 (카라칼팍 마을)
    //  ukraine   : 회색 콘크리트 보도 (키이우 거리)
    //  palestine : 사막 흙 톤 재사용 (석회암·올리브 분위기는 데코로)
    const caseId = this.registry.get('caseId') || 'aralsea';
    const isUkraine = (caseId === 'ukraine');
    const isPalestine = (caseId === 'palestine');
    const isIntro = (caseId === 'intro');
    if (isIntro) {
      // 사무실 마룻바닥 — graphics로 직접 그림 (ground_concrete의 보도블록 격자가 사무실에 부적절)
      const floorG = this.add.graphics().setDepth(0);
      // 베이스 갈색 (오크 마루)
      floorG.fillStyle(0x6a4a26, 1);
      floorG.fillRect(0, 0, GAME_W, GAME_H);
      // 마루 결 — 가로 줄무늬
      floorG.lineStyle(2, 0x4a3018, 0.55);
      for (let y = 40; y < GAME_H; y += 40) {
        floorG.lineBetween(0, y, GAME_W, y);
      }
      // 마루판 짧은 세로 분리 (오프셋 격자)
      floorG.lineStyle(1, 0x4a3018, 0.45);
      for (let y = 0; y < GAME_H; y += 40) {
        const off = (Math.floor(y / 40) % 2) * 80;
        for (let x = off; x < GAME_W; x += 160) {
          floorG.lineBetween(x, y, x, y + 40);
        }
      }
    } else {
      this.add.image(0, 0, isUkraine ? 'ground_concrete' : 'ground').setOrigin(0, 0);
    }
    this.walls = this.physics.add.staticGroup();
    // intro: 외벽(테두리)=사무실 벽(패널), 내부 블록=책장. 그 외는 'wall'/콘크리트.
    const wallKey = isUkraine ? 'wall_kyiv' : (isIntro ? 'wall_office' : 'wall');
    const borderKey = isIntro ? 'wall_office_panel' : wallKey;
    const isBorderCell = (r, c) => (r === 0 || r === MAP.length - 1 || c === 0 || c === MAP[r].length - 1);
    const lastCol = MAP[0].length - 1;            // 옛 4:3 우측 끝(c=19)
    for (let r = 0; r < MAP.length; r++) {
      for (let c = 0; c < MAP[r].length; c++) {
        if (MAP[r][c] === 1) {
          // 16:10 확장 시 옛 우측 외벽(c=19, 중간 행)이 새 우측 외벽(c=23)과
          // 이중 벽처럼 보여 사이가 빈 통로로 노출되는 문제를 해결.
          // 상·하단 외벽은 그대로 두고, 중간 행의 옛 우측 외벽만 스킵.
          if (c === lastCol && r > 0 && r < MAP.length - 1) continue;
          const key = isBorderCell(r, c) ? borderKey : wallKey;
          const wall = this.add.image(
            c * TILE + TILE / 2, r * TILE + TILE / 2, key);
          this.walls.add(wall);
        }
      }
    }
    // MAP은 4:3(20열) 기준이라 16:10(24열)로 확장 시 우측 외벽 단절.
    // 상단·하단 외벽 + 우측 끝 외벽을 동적으로 보강한다.
    const colMax = Math.floor(GAME_W / TILE);   // 24
    for (let c = MAP[0].length; c < colMax; c++) {
      // 상단 외벽 연장
      this.walls.add(this.add.image(c * TILE + TILE/2, 0 + TILE/2, borderKey));
      // 하단 외벽 연장
      this.walls.add(this.add.image(c * TILE + TILE/2,
        (MAP.length - 1) * TILE + TILE/2, borderKey));
    }
    // 우측 끝 (c=23) 세로 외벽 — 모든 행에 추가
    const rightC = colMax - 1;
    for (let r = 1; r < MAP.length - 1; r++) {
      this.walls.add(this.add.image(rightC * TILE + TILE/2,
        r * TILE + TILE/2, borderKey));
    }

    // 플레이어 — intro(사무실)는 사무실 가운데 입구 spawn
    // (portal=4*TILE, mailbox=12*TILE이라 둘 사이 8*TILE에 두면 양쪽 trigger 안 됨)
    const spawnX = isIntro ? 8 * TILE : 3 * TILE;
    const spawnY = isIntro ? 10 * TILE : 2 * TILE;
    this.player = this.physics.add.sprite(spawnX, spawnY, 'hero_down_0');
    // 일러스트 PNG라면(키>60px) 키 ~64px로 표시 + 발 부근 body 재계산
    const heroSrc = this.textures.get('hero_down_0').getSourceImage();
    if (heroSrc && heroSrc.height > 60) {
      const sc = 64 / heroSrc.height;
      this.player.setScale(sc);
      const bw = Math.round(14 / sc), bh = Math.round(10 / sc);
      this.player.body.setSize(bw, bh).setOffset(
        Math.round((heroSrc.width - bw) / 2),
        Math.round(heroSrc.height - bh - 4)
      );
    } else {
      this.player.body.setSize(16, 14).setOffset(8, 22);
    }
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);
    this.facing = 'down';

    // 아이졸리/카테리나 (안내인 — 1단계의 핵심 NPC)
    if (!this.registry.get('enemyDefeated')) {
      // physics body는 기존 도트 sprite로 유지 (충돌·overlap 감지용)
      this.enemy = this.physics.add.sprite(15 * TILE, 9 * TILE, 'kid_0');
      this.enemy.body.setSize(20, 16).setOffset(6, 14);
      this.enemy.setDepth(this.enemy.y);
      // 사건별 안내인 일러스트가 있으면 도트를 숨기고 일러스트로 시각화
      const guidePortraitKey =
        caseId === 'ukraine'   ? 'portrait_kateryna' :
        caseId === 'palestine' ? 'portrait_karim'    :
        caseId === 'intro'     ? 'portrait_hansen'   :
        'portrait_aijoli';
      if (this.textures.exists(guidePortraitKey)) {
        this.enemy.setVisible(false);
        this.enemyArt = this.add.image(15 * TILE, 9 * TILE + 14, guidePortraitKey)
          .setOrigin(0.5, 1).setDepth(this.enemy.y);
        const tex = this.textures.get(guidePortraitKey).getSourceImage();
        this.enemyArt.setScale(70 / tex.height);   // 화면 키 ~70px (시민 NPC와 균형)
        // 가만히 떠 있는 듯한 미세 부유 애니메이션
        this.tweens.add({
          targets: this.enemyArt, y: this.enemyArt.y - 4,
          duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut'
        });
      } else {
        this.enemy.play('kid_idle');
      }

      // 머리 위 ! 표시 (시민·모든 NPC와 통일 스타일 — MARKER_STYLE_ACTIVE)
      // 일러스트 적용 시 키 ~70px에 맞춰 마커 위치 조정
      const markerY0 = this.enemyArt ? (9 * TILE - 70) : (9 * TILE - 50);
      this.enemyMarker = this.add.text(15 * TILE, markerY0, '!', MARKER_STYLE_ACTIVE)
        .setOrigin(0.5).setDepth(9 * TILE + 1);
      this.tweens.add({
        targets: this.enemyMarker, y: markerY0 - 6, duration: 500,
        yoyo: true, repeat: -1, ease: 'Sine.inOut'
      });

      // 발 아래 이름 라벨 — enemyLabel로 저장해서 친구 됨 시 destroy 가능하도록
      const guideName = getGuideName(this.registry);
      this.enemyLabel = this.add.text(15 * TILE, 9 * TILE + 18, guideName, {
        fontFamily: FONT, fontSize: '11px', color: '#ffd96a',
        backgroundColor: '#000000aa', padding: { x: 5, y: 2 }
      }).setOrigin(0.5, 0).setDepth(2100);

      // 가까이 가면 '💬 대화' 버튼이 떠야 시작 (자동 trigger 안 함)
      this.physics.add.overlap(this.player, this.enemy, () => {
        if (this.talking || this.cooldown || this.cardOpen) return;
        this.requestTalkPrompt('guide',
          15 * TILE, 9 * TILE - 100,
          guideName + '와 대화',
          () => {
            this.talking = true;
            this.scene.pause();
            this.scene.launch('DialogueScene');
          });
      });
    }

    // 옛 항구 조사 입구 (노란 표지판) — scale 고정 (꿈틀 제거)
    // intro(튜토리얼)에선 조사 화면 사용 안 함 → 화면 밖으로 (학생이 닿을 수 없음)
    const portalX = isIntro ? -500 : 4 * TILE;
    const portalY = isIntro ? -500 : 11 * TILE;
    this.portal = this.physics.add.staticImage(portalX, portalY, 'portal');
    this.portal.setDepth(this.portal.y);
    if (isIntro) this.portal.setVisible(false);
    const portalLabel = isUkraine ? '키이우 조사'
                      : isPalestine ? '팔레스타인 조사'
                      : '아랄해 조사';
    // 라벨은 NPC 명찰과 동일하게 물체 아래에 표시 (시각 통일)
    this.add.text(portalX, portalY + 22, portalLabel, {
      fontFamily: FONT, fontSize: '12px', color: '#ffe082',
      backgroundColor: '#00000088', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(2000).setVisible(!isIntro);
    this.physics.add.overlap(this.player, this.portal, () => {
      if (this.entering || this.cooldown || this.cardOpen) return;
      // 실제 조건으로 검사 — 안내인과 친구가 됐는가
      if (!this.registry.get('enemyDefeated')) {
        this.showLockToast('먼저 ' + getGuideName(this.registry) + '와 만나 상황을 파악하세요\n(1단계 · 인식)');
        return;
      }
      // 모든 단서를 이미 다 모았으면 InvestigationScene 재진입 방지
      // (intro: 단서 3개 / 본 사건: 12개. 모든 spot이 evidence collected면 잠금)
      try {
        const collected = this.registry.get('evidence') || [];
        const allSpots = [];
        if (typeof CASE !== 'undefined' && CASE && CASE.locations) {
          Object.values(CASE.locations).forEach(loc => {
            (loc.spots || []).forEach(s => { if (s.evidence) allSpots.push(s.evidence.id); });
          });
        }
        if (allSpots.length > 0 && allSpots.every(id => collected.find(c => c.id === id))) {
          this.showLockToast('✓ 모든 단서를 이미 모았습니다.\n다음 단계로 진행하세요.');
          return;
        }
      } catch (e) { /* fail-safe — 잠금 검사 실패해도 진입 허용 */ }
      this.entering = true;
      this.scene.start('InvestigationScene');
    });

    // UN 우편함 (편지 쓰기 입구) — scale 고정 (꿈틀 제거)
    // intro에선 보고서 송부 없음 (제임스 정답이 자동 완료) → 화면 밖
    const mailX = isIntro ? -500 : 12 * TILE;
    const mailY = isIntro ? -500 : 11 * TILE;
    this.mailbox = this.physics.add.staticImage(mailX, mailY, 'mailbox');
    this.mailbox.setDepth(this.mailbox.y);
    if (isIntro) this.mailbox.setVisible(false);
    this.add.text(mailX, mailY + 22, '보고서 송부', {
      fontFamily: FONT, fontSize: '12px', color: '#cfe9ff',
      backgroundColor: '#00000088', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(2000).setVisible(!isIntro);
    this.physics.add.overlap(this.player, this.mailbox, () => {
      if (this.entering || this.cardOpen) return;
      // 실제 조건으로 검사 (stage 변수 지연과 무관하게 동작)
      const cores = (this.registry.get('coreClues') || []).length;
      const ev = (this.registry.get('evidence') || []).length;
      const refl = !!this.registry.get('reflectionDone');
      const need = (typeof TOTAL_CITIZENS !== 'undefined') ? TOTAL_CITIZENS : 3;
      const NEED_EV = 3;
      if (cores < need || ev < NEED_EV) {
        this.showLockToast(
          '보고서를 작성하려면 조사·인터뷰가 더 필요합니다.\n' +
          '🔑 시민 인터뷰  ' + cores + ' / ' + need + '       ' +
          '📋 현장 단서  ' + ev + ' / ' + NEED_EV + ' 이상');
        return;
      }
      if (!refl) {
        this.showLockToast(
          '먼저 🪞 성찰의 의자에 앉아 인과 사슬과\n' +
          '자기성찰을 마쳐야 보고서를 쓸 수 있어요\n(3단계 · 성찰)');
        return;
      }
      // 조건 충족 — 단계를 4(실천)로 동기화
      if ((this.registry.get('stage') || 1) < 4) {
        this.registry.set('stage', 4);
      }
      this.entering = true;
      this.scene.start('LetterScene');
    });

    // ── 🪞 성찰의 의자 (PEACE의 C단계) ───────────────────────────
    // 위치: 우하단 빈 자리 (포털·우편함·의자 3등분 배치, NPC와 거리 확보)
    //       시각적으로는 작은 갈색 원(의자) + 반짝이는 거울 아이콘 + 텍스트 라벨.
    // intro에선 성찰 의자 사용 안 함 (대화 + 퀴즈로 완료) → 화면 밖
    const chairX = isIntro ? -500 : 16 * TILE + 16;
    const chairY = isIntro ? -500 : 11 * TILE + 8;
    const chairG = this.add.graphics().setDepth(chairY);
    // 의자 등판
    chairG.fillStyle(0x6a4a26, 1);
    chairG.fillRect(chairX - 12, chairY - 18, 24, 16);
    // 의자 시트
    chairG.fillStyle(0x8a6634, 1);
    chairG.fillRect(chairX - 14, chairY - 4, 28, 8);
    // 좌측 다리
    chairG.fillStyle(0x4a2e16, 1);
    chairG.fillRect(chairX - 12, chairY + 4, 4, 8);
    chairG.fillRect(chairX + 8, chairY + 4, 4, 8);
    // 등판 하이라이트
    chairG.fillStyle(0xffffff, 0.18);
    chairG.fillRect(chairX - 11, chairY - 17, 22, 2);

    // 라벨
    this.add.text(chairX, chairY + 28, '🪞 성찰의 의자', {
      fontFamily: FONT, fontSize: '11px', color: '#ffe9b8',
      backgroundColor: '#00000088', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(2000);

    // 머리 위 ! 마커 — 시민 인터뷰 완료 직후 등장 (E·A 끝났을 때)
    this.chairMarker = this.add.text(chairX, chairY - 50, '!', {
      fontFamily: FONT_TITLE, fontSize: '18px', color: '#ffd96a',
      stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(chairY + 1).setVisible(false);
    this.refreshChairMarker();   // 진입 시점에 한 번

    // 트리거 영역
    this.chair = this.add.rectangle(chairX, chairY, 36, 36, 0, 0);
    this.physics.add.existing(this.chair, true);
    this.physics.add.overlap(this.player, this.chair, () => {
      if (this.entering || this.cooldown || this.cardOpen) return;
      // 이미 성찰 마쳤다면 안내 (다시 들어가도 OK)
      const reflDone = !!this.registry.get('reflectionDone');
      // 시민 인터뷰까지 끝나야 의미 있음 (E·A 완료 = stage 2 → 3 조건)
      const ev = (this.registry.get('evidence') || []).length;
      const co = (this.registry.get('coreClues') || []).length;
      const need = (typeof TOTAL_CITIZENS !== 'undefined') ? TOTAL_CITIZENS : 3;
      if (ev < 3 || co < need) {
        if (!reflDone) {
          this.showLockToast(
            '먼저 현장 조사·시민 인터뷰를 마쳐야 해요\n' +
            '📋 단서 ' + ev + '/3 이상,  🔑 인터뷰 ' + co + '/' + need);
          return;
        }
      }
      this.entering = true;
      this.scene.start('ReflectionScene');
    });

    // 사건별 건물·조경
    this.solids = [];
    const building = (key, x, baseY, bw, bh) => {
      this.add.image(x, baseY, key).setOrigin(0.5, 1).setDepth(baseY);
      const body = this.add.rectangle(x, baseY - bh / 2, bw, bh, 0, 0);
      this.physics.add.existing(body, true);
      this.solids.push(body);
    };
    const prop = (key, x, baseY, scale) => {
      const img = this.add.image(x, baseY, key).setOrigin(0.5, 1).setDepth(baseY);
      if (scale) img.setScale(scale);
      return img;
    };

    // Kenney Tiny Town(CC0) 데코 — 트리·덤불 (16x16 → 스케일 2 = 32x32)
    const tinyProp = (frame, x, baseY, solid, footW, footH) => {
      this.add.image(x, baseY, 'tiny_town', frame)
        .setOrigin(0.5, 1).setDepth(baseY).setScale(2);
      if (solid) {
        const body = this.add.rectangle(x, baseY - footH / 2, footW, footH, 0, 0);
        this.physics.add.existing(body, true);
        this.solids.push(body);
      }
    };

    if (isIntro) {
      // ─────────── 사건 0 — UN 본부 사무실 (간소화) ───────────
      // 핵심만 — 뒷벽 띠 + 칠판 + 좌측 세계지도 + 한센 책상
      // 창문·UN 깃발 제거 (튜토리얼 화면 비우기).

      // 뒷벽 띠 (UN 블루) — 천장과 마룻바닥 사이 시각적 구분
      const wallBg = this.add.graphics().setDepth(0.5);
      wallBg.fillStyle(0x1a3a5c, 1);
      wallBg.fillRect(TILE, TILE, GAME_W - TILE * 2, TILE * 3);
      // 걸레받이
      wallBg.fillStyle(0x3a2410, 1);
      wallBg.fillRect(TILE, TILE * 4 - 4, GAME_W - TILE * 2, 6);

      // 칠판 (우측 뒷벽 아래 — 인과 사슬용)
      const boardG = this.add.graphics().setDepth(1);
      boardG.fillStyle(0x1a3a2a, 1); boardG.fillRect(620, 175, 260, 56);
      boardG.lineStyle(4, 0x6a4f2a, 1); boardG.strokeRect(620, 175, 260, 56);
      boardG.fillStyle(0xefe6cc, 0.7);
      boardG.fillRect(636, 192, 36, 4); boardG.fillRect(680, 192, 36, 4);
      boardG.fillRect(724, 192, 36, 4); boardG.fillRect(768, 192, 36, 4);
      this.add.text(750, 220, '🪞 인과 사슬 칠판', {
        fontFamily: FONT, fontSize: '10px', color: '#a8d4b0'
      }).setOrigin(0.5).setDepth(2);

      // 좌측 세계지도 (벽에 걸린 보드)
      const mapG = this.add.graphics().setDepth(1);
      mapG.fillStyle(0x3a2410, 1); mapG.fillRect(80, 175, 220, 60);
      mapG.lineStyle(3, 0x1a1008, 1); mapG.strokeRect(80, 175, 220, 60);
      mapG.fillStyle(0xefe6cc, 1); mapG.fillRect(86, 181, 208, 48);
      mapG.fillStyle(0x6a8a6a, 1);
      mapG.fillRect(96, 192, 32, 12); mapG.fillRect(134, 188, 30, 18);
      mapG.fillRect(170, 195, 24, 12); mapG.fillRect(200, 192, 30, 14);
      mapG.fillRect(238, 196, 22, 14); mapG.fillRect(96, 212, 22, 12);
      mapG.fillRect(124, 215, 28, 10); mapG.fillRect(160, 212, 24, 12);
      mapG.fillRect(196, 216, 30, 10);
      // 빨간 핀 (3분쟁 지점)
      mapG.fillStyle(0xff3a3a, 1);
      mapG.fillCircle(180, 196, 3);
      mapG.fillCircle(210, 200, 3);
      mapG.fillCircle(245, 204, 3);
      this.add.text(190, 220, '🗺 세계 분쟁 지도', {
        fontFamily: FONT, fontSize: '9px', color: '#cfe9ff'
      }).setOrigin(0.5).setDepth(2);

      // 디렉터 책상 (한센 NPC 앞 — 한센 위치는 15*TILE=600, 9*TILE=360)
      // 책상은 한센 발 앞쪽(y=400~440)에 좁게 — 주인공이 옆으로 접근 가능하도록
      const deskG = this.add.graphics().setDepth(400);
      deskG.fillStyle(0x6a4f2a, 1); deskG.fillRect(520, 405, 160, 55);
      deskG.lineStyle(3, 0x3a2410, 1); deskG.strokeRect(520, 405, 160, 55);
      // 책상 다리
      deskG.fillStyle(0x4a3a22, 1);
      deskG.fillRect(528, 450, 14, 10); deskG.fillRect(660, 450, 14, 10);
      // 책상 위 소품 — 노트북 + 서류만 (간소화)
      deskG.fillStyle(0x1a1a2e, 1); deskG.fillRect(530, 414, 50, 28);
      deskG.fillStyle(0x5b92e5, 1); deskG.fillRect(532, 416, 46, 24);
      deskG.fillStyle(0xfff8d0, 1); deskG.fillRect(594, 416, 56, 22);
      deskG.lineStyle(1, 0x3a2410, 1); deskG.strokeRect(594, 416, 56, 22);
      deskG.fillStyle(0xa0282e, 1); deskG.fillRect(660, 418, 14, 18);  // 작은 머그
      // 책상 충돌 (얇게 — 한센 앞은 통과 가능)
      const deskBody = this.add.rectangle(600, 452, 160, 14, 0, 0);
      this.physics.add.existing(deskBody, true);
      this.solids.push(deskBody);

    } else if (isUkraine) {
      // ─────────── 사건 2 — 키이우 거리 ───────────
      // 안전 영역: x 40~880, baseY 40~470
      // 데코·NPC가 가운데·하단에 몰리지 않도록 4분면 균등 분포 의도
      // 평화 비둘기 동상 (가운데 위 — 광장의 중심)
      prop('peace_dove', 600, 180, 2);
      // UN 텐트 (좌하단 — 구호 거점)
      prop('un_tent', 280, 420, 2);
      this.add.text(280, 424, 'UN', {
        fontFamily: FONT, fontSize: '10px', color: '#dff1ff',
        backgroundColor: '#00000088', padding: { x: 3, y: 1 }
      }).setOrigin(0.5).setDepth(2000);
      // 우크라이나 국기 (좌상·우상 두 곳)
      prop('ua_flag', 280, 140, 1.5);
      prop('ua_flag', 700, 180, 1.5);
      // 모래주머니 — 입구 좌하단 일렬(축소) + 우상단 2개 분리
      prop('sandbag', 70,  450, 1.5);
      prop('sandbag', 120, 450, 1.5);
      prop('sandbag', 760, 200, 1.5);
      prop('sandbag', 730, 380, 1.5);
      // 부서진 벤치 (가운데 약간 좌측 · 우하단)
      prop('broken_bench', 520, 380, 1.5);
      prop('broken_bench', 380, 460, 1.5);
      // 부서진 차량 (우상단 도로 옆)
      prop('broken_car', 820, 260, 1.5);
      // 폭격 자국 (좌중·가운데하단·우하단으로 분산)
      this.add.image(210, 320, 'crater').setOrigin(0.5, 0.5).setDepth(0).setScale(1.5);
      this.add.image(550, 440, 'crater').setOrigin(0.5, 0.5).setDepth(0).setScale(1.4);
      this.add.image(870, 430, 'crater').setOrigin(0.5, 0.5).setDepth(0).setScale(1.2);
      // 도시 가로수 (4분면 골고루)
      tinyProp(4,  60,  180, true, 16, 10);
      tinyProp(4,  430, 110, true, 16, 10);
      tinyProp(4,  840, 110, true, 16, 10);
      tinyProp(4,  640, 460, true, 16, 10);
      tinyProp(16, 230, 280, true, 16, 10);
      tinyProp(16, 880, 360, true, 16, 10);
      // 덤불 (도시 화단 — 빈 공간 메움)
      tinyProp(5,  80,  340, false);
      tinyProp(17, 460, 280, false);
      tinyProp(5,  720, 140, false);
    } else if (isPalestine) {
      // ─────────── 사건 3 — 팔레스타인·이스라엘 ───────────
      // 안전 영역: x 40~880, baseY 40~470
      // 컨셉: 돌담·올리브 농장·UN 텐트의 평화로운 광장
      // 평화 비둘기 상징 (가운데 위)
      prop('peace_dove', 600, 180, 2);
      // UN 텐트 (좌하단 — 구호 거점)
      prop('un_tent', 280, 420, 2);
      this.add.text(280, 424, 'UN', {
        fontFamily: FONT, fontSize: '10px', color: '#dff1ff',
        backgroundColor: '#00000088', padding: { x: 3, y: 1 }
      }).setOrigin(0.5).setDepth(2000);
      // 건물 (모스크·집·분수 — 옛 예루살렘 분위기)
      building('mosque', 720, 132, 86, 26);
      building('minaret', 640, 132, 18, 24);
      building('house', 520, 470, 74, 24);
      building('fountain', 320, 360, 62, 16);
      // 올리브 나무 (palm 재사용 — 잎이 무성한 분위기)
      prop('palm', 160, 200);
      prop('palm', 480, 460);
      prop('palm', 760, 470);
      // 침엽수 = 사이프러스 (지중해성, 4분면 골고루)
      tinyProp(4,  60,  150, true, 16, 10);
      tinyProp(4,  400, 100, true, 16, 10);
      tinyProp(4,  840, 200, true, 16, 10);
      tinyProp(16, 880, 380, true, 16, 10);
      // 덤불 (통과 가능)
      tinyProp(5,  100, 320, false);
      tinyProp(17, 460, 160, false);
      tinyProp(17, 700, 410, false);
      tinyProp(5,  820, 460, false);
    } else {
      // ─────────── 사건 1 — 카라칼팍 사막 마을 ───────────
      // 건물 (4분면 골고루)
      building('mosque', 690, 132, 86, 26);
      building('minaret', 610, 132, 18, 24);
      building('house', 560, 470, 74, 24);
      building('fountain', 300, 360, 62, 16);
      // 야자수 (가운데 두 곳 → 좌측 + 우측 분산)
      prop('palm', 260, 196);
      prop('palm', 540, 470);
      // 침엽수 (4분면 골고루)
      tinyProp(4,  60,  140, true, 16, 10);
      tinyProp(4,  400, 90,  true, 16, 10);
      tinyProp(4,  520, 280, true, 16, 10);
      tinyProp(16, 720, 290, true, 16, 10);
      // 덤불 (통과 가능)
      tinyProp(5,  440, 140, false);
      tinyProp(17, 220, 450, false);
      tinyProp(17, 130, 320, false);
      tinyProp(5,  660, 410, false);

      // ── 16:10 우측 영역(700~880) 데코 — 사라진 바다 주제 ─────
      // 우측에 몰리지 않도록 거리 두고 분산
      this.add.image(820, 180, 'rusty_boat')
        .setOrigin(0.5, 1).setDepth(180).setScale(2);
      this.add.image(870, 360, 'dry_well')
        .setOrigin(0.5, 1).setDepth(360).setScale(2);
      this.add.image(770, 440, 'sand_pile')
        .setOrigin(0.5, 1).setDepth(440).setScale(2);
      this.add.image(850, 460, 'sand_pile')
        .setOrigin(0.5, 1).setDepth(460).setScale(2);
      tinyProp(16, 800, 250, true, 16, 10);
      tinyProp(17, 730, 220, false);
    }

    // 시민 NPC (Kenney Tiny Dungeon CC0 도트 + 일러스트 portrait overlay) — 상호작용 + 퀴즈
    const solved = this.registry.get('quizSolved') || {};
    this.citizenObjs = [];
    CITIZENS.forEach(cz => {
      const npc = this.add.image(cz.x, cz.y, cz.sprite, cz.frame)
        .setOrigin(0.5, 1).setDepth(cz.y).setScale(2);

      // 일러스트 portrait이 있으면 도트를 숨기고 일러스트로 시각화 (안내인과 동일 방식)
      let citizenArt = null;
      const hasArt = cz.portrait && this.textures.exists(cz.portrait);
      if (hasArt) {
        npc.setVisible(false);
        citizenArt = this.add.image(cz.x, cz.y, cz.portrait)
          .setOrigin(0.5, 1).setDepth(cz.y);
        const tex = this.textures.get(cz.portrait).getSourceImage();
        citizenArt.setScale(70 / tex.height);   // 안내인과 동일 키 ~70px
      }
      // 부유 애니메이션 — 도트면 도트, 일러스트면 일러스트 대상
      const floatTarget = citizenArt || npc;
      this.tweens.add({
        targets: floatTarget, y: cz.y - 2, duration: 800 + Math.random() * 400,
        yoyo: true, repeat: -1, ease: 'Sine.inOut'
      });

      // 머리 위 상태 표시: ! (미완료) 또는 ✓ (완료)
      // 일러스트(~70px)는 도트(~32px)보다 키가 크므로 마커 y를 더 위로
      // 스타일은 안내인·향후 NPC와 모두 동일하게 MARKER_STYLE_* 상수 사용
      const markerY0 = hasArt ? (cz.y - 80) : (cz.y - 50);
      const marker = this.add.text(cz.x, markerY0,
        solved[cz.id] ? '✓' : '!',
        solved[cz.id] ? MARKER_STYLE_SOLVED : MARKER_STYLE_ACTIVE
      ).setOrigin(0.5).setDepth(cz.y + 1);
      if (!solved[cz.id]) {
        this.tweens.add({
          targets: marker, y: markerY0 - 6, duration: 500,
          yoyo: true, repeat: -1, ease: 'Sine.inOut'
        });
      }

      // 발 아래 이름 라벨 — 누구인지 한눈에 (depth 2100: 데코·외벽보다 항상 위)
      const nameColor = solved[cz.id] ? '#7fd07f' : '#ffe9b8';
      this.add.text(cz.x, cz.y + 6, cz.name, {
        fontFamily: FONT, fontSize: '11px', color: nameColor,
        backgroundColor: '#000000aa', padding: { x: 5, y: 2 }
      }).setOrigin(0.5, 0).setDepth(2100);

      // overlap — 자동 진입 대신 '💬 인터뷰' 버튼 표시 (학생이 직접 누름)
      // intro(튜토리얼)에선 사무실 어디서든 제임스에 접근하면 인터뷰 가능
      // (학생이 정확히 어디로 가야 할지 헤매지 않도록 trigger 영역 확대)
      const introCase = (this.registry.get('caseId') === 'intro');
      const trigW = introCase ? 240 : 36;
      const trigH = introCase ? 240 : 36;
      const trigger = this.add.rectangle(cz.x, cz.y - 16, trigW, trigH, 0, 0);
      this.physics.add.existing(trigger, true);
      this.physics.add.overlap(this.player, trigger, () => {
        if (this.entering || this.cooldown || this.cardOpen) return;
        const sv = this.registry.get('quizSolved') || {};
        if (sv[cz.id]) return;
        // 게이팅 검사는 즉시 (잠금 토스트는 그대로 자동)
        // 텍스트는 src/strings.js의 STRINGS.lockToast (editor.html로 편집)
        const LS = (typeof STRINGS !== 'undefined') ? STRINGS.lockToast : null;
        if (!this.registry.get('enemyDefeated')) {
          const g = getGuideName(this.registry);
          this.showLockToast(LS
            ? fmtString(LS.needGuideFirst, { guide: g })
            : '먼저 ' + g + '와 만나 상황을 파악하세요\n(1단계 · 인식)');
          return;
        }
        // intro(튜토리얼)는 단서 조사 단계 생략 — 한센 → 제임스 바로 인터뷰
        const introCase = (this.registry.get('caseId') === 'intro');
        const ev = (this.registry.get('evidence') || []).length;
        if (!introCase && ev < 3) {
          const p = getFirstLocationName(this.registry);
          this.showLockToast(LS
            ? fmtString(LS.needCluesFirst, { place: p, ev })
            : '먼저 ' + p + '을(를) 조사해 단서를 모으세요\n(2단계 · 관찰 / 단서 ' + ev + '/3)');
          return;
        }
        // 게이팅 통과 시에만 버튼 표시
        this.requestTalkPrompt('cz:' + cz.id,
          cz.x, cz.y - 100,
          cz.name + ' 인터뷰',
          () => {
            this.entering = true;
            this.registry.set('quizCitizenId', cz.id);
            this.scene.pause();
            this.scene.launch('QuizScene');
          });
      });
      this.citizenObjs.push({ npc, art: citizenArt, marker, trigger, cz });
    });
    // 초기 ▼ 배치 — 다음 차례 1명만 강조, 그 외 미해결은 마커 숨김
    this.updateCitizenMarkers();

    this.physics.add.collider(this.player, this.solids);

    // 분위기: 따뜻한 빛 + 비네트
    // 16:10 캔버스 전체에 비네트 적용 (옛 4:3=800x520 잔재 제거)
    const W = GAME_W, H = GAME_H;
    const mood = this.add.graphics().setDepth(1500);
    mood.fillStyle(0xffd9a0, 0.10); mood.fillRect(0, 0, W, H);
    mood.fillStyle(0x1a1430, 0.30);
    mood.fillRect(0, 0, W, 24); mood.fillRect(0, H - 24, W, 24);
    mood.fillRect(0, 0, 24, H); mood.fillRect(W - 24, 0, 24, H);
    mood.fillStyle(0x1a1430, 0.18);
    mood.fillRect(0, 24, W, 14); mood.fillRect(0, H - 38, W, 14);

    this.cursors = this.input.keyboard.createCursorKeys();
    // 모바일/터치 환경에서만 가상 D-Pad 표시 (PC는 키보드 사용)
    this.touchDir = { left: false, right: false, up: false, down: false };
    if (window.IS_MOBILE) {
      this.buildDPad();
    }

    // 좌상단 — 조사관 정체성 + 현재 사건명 (사건 확장 대비 시각 일관성)
    this.add.text(10, 8, '🌐 UN 조사관', {
      fontFamily: FONT, fontSize: '12px', color: '#cfe9ff',
      backgroundColor: '#00000088', padding: { x: 6, y: 3 }
    }).setDepth(2000);
    // caseId 는 create() 상단에서 이미 선언됨
    const curCase = (typeof CASE_LIST !== 'undefined')
      ? CASE_LIST.find(x => x.id === caseId) : null;
    if (curCase) {
      this.add.text(10, 32, '📁 ' + curCase.title, {
        fontFamily: FONT, fontSize: '11px', color: '#ffe082',
        backgroundColor: '#00000088', padding: { x: 6, y: 3 }
      }).setDepth(2000);
    }

    // (좌상단 큰 사건 선택 버튼 제거 — 우상단 🏠 원형 아이콘으로 이동, 시선 분산 최소화)

    // 우상단 — 핵심 단서 카운터 (관찰 단계부터 의미)
    this.coreHud = this.add.text(950, 8, '', {
      fontFamily: FONT, fontSize: '13px', color: '#ffe082',
      backgroundColor: '#00000088', padding: { x: 6, y: 3 }
    }).setOrigin(1, 0).setDepth(2000);
    this.refreshCoreHud();

    // ── 사운드 토글 (음소거) — 핵심 단서 카운터 바로 아래 우상단 ──
    addMuteToggle(this, 936, 46);

    // ── 사건 선택 돌아가기 — 사운드 토글 옆(좌측) 우상단 ──
    // 작은 🏠 원형 아이콘 (학생 시선 분산 최소화). 진행도는 그대로 유지.
    // 위치 가로 정렬: [🏠 사건선택] [🔊 사운드] -- y=46
    // 클릭 시 확인 모달 표시 (실수 방지)
    {
      const hX = 892, hY = 46, hR = 14;
      const bg = this.add.graphics().setDepth(2000);
      bg.fillStyle(0x000000, 0.55);
      bg.fillCircle(hX, hY, hR);
      bg.lineStyle(1.5, 0x6fb7d6, 1);
      bg.strokeCircle(hX, hY, hR);
      const lbl = this.add.text(hX, hY, '🏠', {
        fontFamily: 'sans-serif', fontSize: '15px'
      }).setOrigin(0.5).setDepth(2001);
      // 클릭 영역 확대 (40x40 rectangle zone) — 모바일 손가락·작은 영역 픽스
      const zone = this.add.zone(hX, hY, 40, 40)
        .setInteractive({ useHandCursor: true }).setDepth(2002);
      zone.on('pointerover', () => lbl.setScale(1.12));
      zone.on('pointerout',  () => lbl.setScale(1.0));
      zone.on('pointerdown', () => {
        if (this.leaving || this.exitConfirmOpen) return;
        if (window.SFX) window.SFX.play('click');
        this.showExitConfirm();
      });
    }

    // 상단 중앙 — 인식·관찰·실천 단계 칩
    this.buildStageHud();

    // 하단 — 현재 목표 (단계별 자동 갱신)
    this.objective = this.add.text(480, 580, '', {
      fontFamily: FONT, fontSize: '14px', color: '#ffe082',
      backgroundColor: '#000000bb', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(2000);
    this.refreshObjective();

    // 다른 씬(오버레이)에서 돌아올 때 상태 동기화 + 단계 점검
    this.events.on('resume', () => this.onResume());

    // 시작 시 단계 점검 (편의)
    this.time.delayedCall(50, () => {
      this.checkStageAdvance();
      reportProgress(this);   // 교사 대시보드로 현재 진행도 발행
    });

    // ── 🛠 DEBUG 모드 (?debug=1) — NPC/물체 좌표 시각화 ──────────
    // 사용법: URL ?debug=1 추가 → 모든 NPC(안내인 도트+일러스트, 시민 도트+
    //        일러스트), 포털, 우편함 위치를 노란 박스 + 좌표 라벨로 표시.
    //        클릭 시 콘솔/하단에 좌표 출력. setVisible(false)된 도트도 박스로
    //        시각화 → 숨김 작동 여부 검증 가능.
    if (/[?&]debug=1\b/.test(location.search || '')) {
      const dbg = this.add.graphics().setDepth(5000);

      const labelObj = (obj, name, color = 0xffe082) => {
        if (!obj || !obj.scene) return;
        const x = obj.x, y = obj.y;
        const w = obj.displayWidth  || 24;
        const h = obj.displayHeight || 24;
        // origin (0.5, 1) sprite는 발 좌표 → 위로 박스
        const oy = (obj.originY !== undefined) ? obj.originY : 0.5;
        const top = y - h * oy;
        const visTag = (obj.visible === false) ? ' [hidden]' : '';
        dbg.lineStyle(2, color, 1);
        dbg.strokeRect(x - w / 2, top, w, h);
        dbg.fillStyle(color, 1);
        dbg.fillCircle(x, y, 3);
        this.add.text(x, top - 4,
          name + ' (' + Math.round(x) + ',' + Math.round(y) + ')' + visTag, {
          fontFamily: FONT, fontSize: '10px', color: '#ffe082',
          backgroundColor: '#000000cc', padding: { x: 3, y: 1 }
        }).setOrigin(0.5, 1).setDepth(5001);
      };

      labelObj(this.enemy,     '안내인·도트', 0xff8080);
      labelObj(this.enemyArt,  '안내인·일러스트', 0xffe082);
      labelObj(this.portal,    '포털',  0x80ff80);
      labelObj(this.mailbox,   '우편함', 0x80ff80);
      if (this.citizenObjs) {
        this.citizenObjs.forEach((co, i) => {
          labelObj(co.npc,        '시민' + (i + 1) + '·도트',     0xff8080);
          if (co.art) labelObj(co.art, '시민' + (i + 1) + '·일러스트', 0xffe082);
        });
      }

      // 화면 좌측 하단 — 마지막 클릭 좌표
      const dbgInfo = this.add.text(8, 596,
        '🛠 DEBUG — 화면 클릭 시 좌표 출력', {
        fontFamily: FONT, fontSize: '11px', color: '#ffe082',
        backgroundColor: '#000000cc', padding: { x: 6, y: 3 }
      }).setOrigin(0, 1).setDepth(5002);

      this.input.on('pointerdown', (p) => {
        const x = Math.round(p.worldX), y = Math.round(p.worldY);
        console.log('[DEBUG][world] x:', x, '  y:', y);
        dbgInfo.setText('🛠 DEBUG · last click: x=' + x + ', y=' + y);
      });
    }

    // ── 🛠 DEV 모드 (?dev=1) — 단계 건너뛰기 패널 ─────────────
    // 사용법: URL ?dev=1 추가 → 우상단 🛠 버튼 → 액션 패널.
    // 출품 빌드에선 ?dev=1 없으면 자동 숨김. 학생에게 노출 안 됨.
    if (/[?&]dev=1\b/.test(location.search || '')) {
      this.addDevPanel();
    }

    // ── 사건별 맵 BGM 시작 (대화·조사 진입 시 audio.js가 pause 처리) ──
    if (window.SFX) {
      const cid = caseId || 'aralsea';
      const bgmSrc = BGM_BY_CASE[cid];
      if (bgmSrc) window.SFX.playBGM(bgmSrc);
    }
  }

  // ── 개발자 패널 — 단계 건너뛰기 (출품 시 ?dev=1 쿼리로만 진입) ──
  addDevPanel() {
    // 사운드 토글(936, 46) 바로 아래 정렬
    const btnX = 936, btnY = 80, btnR = 14;
    const bg = this.add.graphics().setDepth(2000);
    bg.fillStyle(0x4a1a1a, 0.85);
    bg.fillCircle(btnX, btnY, btnR);
    bg.lineStyle(2, 0xff6a6a, 1);
    bg.strokeCircle(btnX, btnY, btnR);
    const label = this.add.text(btnX, btnY, '🛠', {
      fontFamily: 'sans-serif', fontSize: '15px'
    }).setOrigin(0.5).setDepth(2001);
    const zone = this.add.circle(btnX, btnY, btnR, 0, 0)
      .setInteractive({ useHandCursor: true }).setDepth(2002);
    zone.on('pointerover', () => label.setScale(1.15));
    zone.on('pointerout',  () => label.setScale(1.0));
    zone.on('pointerdown', () => this.openDevMenu());
  }

  openDevMenu() {
    if (this.devMenuOpen) return;
    this.devMenuOpen = true;
    const layer = [];

    const dim = this.add.rectangle(480, 300, 960, 600, 0x000000, 0.7)
      .setDepth(5000).setInteractive().setAlpha(0);
    this.tweens.add({ targets: dim, alpha: 0.7, duration: 180 });
    layer.push(dim);

    const cx = 480, cy = 300, cw = 560, ch = 470;
    const card = this.add.graphics().setDepth(5001);
    card.fillStyle(0x000000, 0.6); card.fillRect(cx - cw / 2 + 8, cy - ch / 2 + 8, cw, ch);
    card.fillStyle(0x10202e, 1); card.fillRect(cx - cw / 2, cy - ch / 2, cw, ch);
    card.fillStyle(0xff6a6a, 1); card.fillRect(cx - cw / 2, cy - ch / 2, cw, 4);
    card.fillStyle(0x000000, 1);
    card.fillRect(cx - cw / 2, cy - ch / 2, cw, 3);
    card.fillRect(cx - cw / 2, cy + ch / 2 - 3, cw, 3);
    card.fillRect(cx - cw / 2, cy - ch / 2, 3, ch);
    card.fillRect(cx + cw / 2 - 3, cy - ch / 2, 3, ch);
    layer.push(card);

    const head = this.add.text(cx, cy - ch / 2 + 22,
      '🛠  개발자 패널  ·  단계 건너뛰기', {
      fontFamily: FONT_TITLE, fontSize: '17px', color: '#ff8a8a',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5002);
    layer.push(head);

    const sub = this.add.text(cx, cy - ch / 2 + 46,
      '?dev=1 쿼리로만 진입 · 학생에겐 노출 안 됨', {
      fontFamily: FONT, fontSize: '11px', color: '#a8c4dc'
    }).setOrigin(0.5).setDepth(5002);
    layer.push(sub);

    // 액션 버튼 — 6개 (3열×2행)
    const actions = [
      { label: '⏭ 1→2 (P 통과)',  desc: '안내인 친구 + 단계 2',          run: () => this.devSkipToStage(2) },
      { label: '⏭ 1→3 (+ E·A)',  desc: '단서·인터뷰 자동 + 단계 3',    run: () => this.devSkipToStage(3) },
      { label: '⏭ 1→4 (+ C)',    desc: '성찰 더미 + 단계 4',           run: () => this.devSkipToStage(4) },
      { label: '🏁 사건 완료',     desc: '보고서 송부 + 완료 처리',      run: () => this.devCompleteCase() },
      { label: '🌳 학습 트리',     desc: '학습 트리 화면 즉시 진입',     run: () => this.devGoLearningTree() },
      { label: '🖨 송부 화면',     desc: '인쇄 보고서 화면 즉시 진입',   run: () => this.devGoSent() },
    ];

    const closeAll = () => {
      layer.forEach(o => { if (o && o.destroy) o.destroy(); });
      this.devMenuOpen = false;
    };

    actions.forEach((a, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const bx = cx - 130 + col * 260;
      const by = cy - 110 + row * 78;

      const btn = fancyButton(this, bx, by, 240, 50, a.label,
        () => { closeAll(); a.run(); },
        { base: 0x4a2a2a, hover: 0x6a3e3e, edge: 0xff8a8a, text: '#ffe9e9' });
      if (btn.g)    btn.g.setDepth(5003);
      if (btn.t)    { btn.t.setDepth(5004); btn.t.setFontSize(14); }
      if (btn.zone) btn.zone.setDepth(5005);
      layer.push(btn.g, btn.t, btn.zone);

      const descT = this.add.text(bx, by + 30, a.desc, {
        fontFamily: FONT, fontSize: '10px', color: '#a8c4dc'
      }).setOrigin(0.5).setDepth(5004);
      layer.push(descT);
    });

    // 닫기
    const closeBtn = fancyButton(this, cx, cy + ch / 2 - 32, 140, 32, '← 닫기',
      closeAll,
      { base: 0x2b3a52, hover: 0x3c5170, edge: 0x6fb7d6, text: '#dff1ff' });
    if (closeBtn.g)    closeBtn.g.setDepth(5003);
    if (closeBtn.t)    closeBtn.t.setDepth(5004);
    if (closeBtn.zone) closeBtn.zone.setDepth(5005);
    layer.push(closeBtn.g, closeBtn.t, closeBtn.zone);

    dim.on('pointerdown', closeAll);
  }

  // 단계 N까지 통과 — 데이터 가득 채우고 checkStageAdvance() 호출
  devSkipToStage(targetStage) {
    const caseId = this.registry.get('caseId') || 'aralsea';

    if (targetStage >= 2) {
      // 1단계 통과 — 안내인 친구 (공감 만점)
      this.registry.set('enemyDefeated', true);
      this.registry.set('slimeLove', 8);
    }

    if (targetStage >= 3) {
      // 2단계 통과 — 모든 현장 단서 + 핵심 단서 (시민 인터뷰 통과)
      const allEv = [];
      if (typeof CASE !== 'undefined' && CASE.locations) {
        Object.values(CASE.locations).forEach(loc => {
          (loc.spots || []).forEach(s => { if (s.evidence) allEv.push(s.evidence); });
        });
      }
      this.registry.set('evidence', allEv);
      const allCores = [];
      const solved = {};
      if (typeof CITIZENS !== 'undefined') {
        CITIZENS.forEach(c => {
          if (c.quiz && c.quiz.reward) allCores.push(c.quiz.reward);
          solved[c.id] = true;
        });
      }
      this.registry.set('coreClues', allCores);
      this.registry.set('quizSolved', solved);
    }

    if (targetStage >= 4) {
      // 3단계 통과 — 성찰 더미
      const evs = this.registry.get('evidence') || [];
      const chainNames = evs.slice(0, 3).map(e => e.name);
      this.registry.set('reflection', {
        chainNames,
        statementText: '[개발자 모드] 자동 생성 자기성찰',
      });
      this.registry.set('reflectionDone', true);
    }

    // HUD·objective 갱신 + 즉시 단계 자동 산정
    this.checkStageAdvance();
    this.refreshCoreHud();
    this.flashToast('🛠 DEV: 단계 ' + targetStage + '로 점프');
  }

  // 사건 완료 — 모든 단계 + 송부 처리
  devCompleteCase() {
    this.devSkipToStage(4);
    const caseId = this.registry.get('caseId') || 'aralsea';
    const completed = this.registry.get('completedCases') || [];
    if (!completed.includes(caseId)) completed.push(caseId);
    this.registry.set('completedCases', completed);
    // 자기평가 더미
    this.registry.set('learningReview', {
      goalMet: 5, factConf: 5, actionConf: 5,
      wantNext: null, wantNextLabel: ''
    });
    const allReviews = this.registry.get('caseReviews') || {};
    allReviews[caseId] = this.registry.get('learningReview');
    this.registry.set('caseReviews', allReviews);
    this.flashToast('🛠 DEV: 사건 완료 처리됨');
  }

  devGoLearningTree() {
    this.scene.start('LearningTreeScene');
  }

  devGoSent() {
    this.devSkipToStage(4);
    this.scene.start('LetterScene');
  }

  update() {
    const p = this.player;
    if (!p || !p.body) return;
    const speed = 150;
    p.body.setVelocity(0);

    let moving = false;
    let dir = this.facing;

    // 단계 전환 카드가 열려 있는 동안엔 이동 잠금
    if (this.cardOpen) {
      p.anims.stop();
      p.setTexture('hero_' + this.facing + '_0');
      p.setDepth(p.y);
      return;
    }

    // 키보드 또는 가상 D-Pad — 어느 쪽이든 눌리면 이동
    const td = this.touchDir || {};
    const left  = this.cursors.left.isDown  || td.left;
    const right = this.cursors.right.isDown || td.right;
    const up    = this.cursors.up.isDown    || td.up;
    const down  = this.cursors.down.isDown  || td.down;
    if (left) {
      p.body.setVelocityX(-speed); dir = 'side'; p.setFlipX(true); moving = true;
    } else if (right) {
      p.body.setVelocityX(speed); dir = 'side'; p.setFlipX(false); moving = true;
    }
    if (up) {
      p.body.setVelocityY(-speed); dir = 'up'; moving = true;
    } else if (down) {
      p.body.setVelocityY(speed); dir = 'down'; moving = true;
    }

    if (moving) {
      this.facing = dir;
      p.anims.play('walk_' + dir, true);
    } else {
      p.anims.stop();
      p.setTexture('hero_' + this.facing + '_0');
    }
    p.setDepth(p.y); // 건물 앞/뒤 정렬

    // 대화 버튼 자동 숨김 — overlap이 끝나면(매 프레임 호출 안 되면) 사라짐
    if (this._talkPrompt && this.time.now - this._talkPromptLastTime > 220) {
      this.hideTalkPrompt();
    }
  }

  // ── NPC 대화 버튼 (overlap 시 머리 위에 떠서 클릭해야 시작) ───
  //  자동 대화 시작이 아닌 '학생이 명시적으로 누르는' UX.
  //  overlap 콜백에서 매 프레임 호출되므로 _talkPromptLastTime을 갱신,
  //  update()에서 일정 시간 이상 호출 안 되면 자동 숨김.
  requestTalkPrompt(key, x, y, label, onTalk) {
    this._talkPromptLastTime = this.time.now;
    if (this._talkPromptKey === key) return;   // 같은 NPC면 중복 생성 안 함
    this.hideTalkPrompt();
    this._talkPromptKey = key;

    const bgW = Math.max(140, label.length * 12 + 70), bgH = 36;
    const bx = x, by = y;
    const bg = this.add.graphics().setDepth(2500);
    bg.fillStyle(0x000000, 0.85);
    bg.fillRoundedRect(bx - bgW/2, by - bgH/2, bgW, bgH, 8);
    bg.lineStyle(2, 0xffe082, 1);
    bg.strokeRoundedRect(bx - bgW/2, by - bgH/2, bgW, bgH, 8);
    const tx = this.add.text(bx, by, '💬  ' + label, {
      fontFamily: FONT, fontSize: '13px', color: '#ffe082',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2501);
    const zone = this.add.zone(bx, by, bgW, bgH)
      .setInteractive({ useHandCursor: true }).setDepth(2502);
    zone.on('pointerdown', () => {
      this.hideTalkPrompt();
      if (typeof onTalk === 'function') onTalk();
    });
    // 부유 애니메이션
    const tw = this.tweens.add({
      targets: [bg, tx, zone], y: '-=4',
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut'
    });
    this._talkPrompt = [bg, tx, zone, tw];
  }

  hideTalkPrompt() {
    if (!this._talkPrompt) return;
    this._talkPrompt.forEach(o => { if (o && o.destroy) o.destroy(); });
    this._talkPrompt = null;
    this._talkPromptKey = null;
  }

  // ── 모바일 가상 D-Pad ─────────────────────────────────────
  //  화면 좌하단에 네 방향 버튼을 십자형으로 배치.
  //  각 버튼은 setInteractive + pointerdown/up + setScrollFactor(0)으로
  //  화면 고정. update()에서 this.touchDir 플래그를 cursors와 함께 검사.
  buildDPad() {
    // 좌하단 모서리에 작게 밀착 — 게임 화면 가림 최소화
    const cx = 85, cy = 520;            // D-pad 중심 (좌하단 모서리)
    const r  = 48;                       // 중심에서 각 버튼까지 거리
    const btnR = 22;                     // 각 버튼 반지름
    // 터치 hit-area는 보이는 도형보다 약간 크게 (작은 버튼 잘 안 눌리는 문제 완화)
    const hitR = btnR + 8;
    const mk = (dx, dy, label, key) => {
      const x = cx + dx, y = cy + dy;
      // 버튼 도형 (반투명, 게임 화면 살짝 보이게)
      const circle = this.add.circle(x, y, btnR, 0x1a2a3a, 0.5)
        .setStrokeStyle(2, 0xffd96a, 0.75)
        .setScrollFactor(0).setDepth(4000);
      const txt = this.add.text(x, y, label, {
        fontFamily: FONT_TITLE, fontSize: '18px', color: '#ffe9b8',
        fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(4001);

      // 별도 hit zone — 보이는 버튼보다 큰 영역으로 터치 정확도 확보
      const zone = this.add.zone(x, y, hitR * 2, hitR * 2)
        .setScrollFactor(0).setDepth(4002)
        .setInteractive({ useHandCursor: true });

      const press   = () => {
        this.touchDir[key] = true;
        circle.setFillStyle(0x3a5a82, 0.7);
      };
      const release = () => {
        this.touchDir[key] = false;
        circle.setFillStyle(0x1a2a3a, 0.5);
      };

      zone.on('pointerdown', press);
      zone.on('pointerup',   release);
      zone.on('pointerout',  release);
      zone.on('pointerupoutside', release);
      return { circle, txt, zone };
    };

    this.dpad = [
      mk(0,  -r, '▲', 'up'),
      mk(0,   r, '▼', 'down'),
      mk(-r,  0, '◀', 'left'),
      mk( r,  0, '▶', 'right'),
    ];

    // 가운데 작은 점
    const center = this.add.circle(cx, cy, 6, 0x000000, 0.35)
      .setScrollFactor(0).setDepth(3999);
    this.dpad.push({ circle: center });
  }

  refreshCoreHud() {
    if (!this.coreHud) return;
    const cores = (this.registry.get('coreClues') || []).length;
    const total = (typeof TOTAL_CITIZENS !== 'undefined') ? TOTAL_CITIZENS : 3;
    this.coreHud.setText('🔑 핵심 단서 ' + cores + ' / ' + total);
  }

  // 성찰의 의자 ! 마커: E·A가 끝났고 아직 성찰 미완료면 표시
  refreshChairMarker() {
    if (!this.chairMarker) return;
    const ev = (this.registry.get('evidence') || []).length;
    const co = (this.registry.get('coreClues') || []).length;
    const need = (typeof TOTAL_CITIZENS !== 'undefined') ? TOTAL_CITIZENS : 3;
    const refl = !!this.registry.get('reflectionDone');
    const showMark = (ev >= 3 && co >= need && !refl);
    this.chairMarker.setVisible(showMark);
    // 이전 tween 정리 후 새 tween 시작 (중복 방지)
    if (this.chairMarkerTween) {
      this.chairMarkerTween.stop(); this.chairMarkerTween = null;
    }
    if (showMark) {
      const baseY = this.chairMarker.y;
      this.chairMarkerTween = this.tweens.add({
        targets: this.chairMarker, y: baseY - 6, duration: 500,
        yoyo: true, repeat: -1, ease: 'Sine.inOut'
      });
    }
  }

  // ── 인식·관찰·성찰·실천 단계 시스템 ───────────────────────
  buildStageHud() {
    const stages = [
      { num: '1', name: '인식' },
      { num: '2', name: '관찰' },
      { num: '3', name: '성찰' },
      { num: '4', name: '실천' },
    ];
    const chipW = 74, chipH = 28, gap = 5;
    const totalW = chipW * stages.length + gap * (stages.length - 1);
    const startX = 400 - totalW / 2;
    this.stageChips = [];
    stages.forEach((s, i) => {
      const x = Math.round(startX + i * (chipW + gap));
      const g = this.add.graphics().setDepth(2000);
      const t = this.add.text(x + chipW / 2, 8 + chipH / 2, s.num + '·' + s.name, {
        fontFamily: FONT_TITLE, fontSize: '13px', color: '#9aa6ad',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(2001);
      // 클릭 시 단계 설명 모달
      const zone = this.add.rectangle(x + chipW / 2, 8 + chipH / 2, chipW, chipH, 0, 0)
        .setInteractive({ useHandCursor: true }).setDepth(2002);
      zone.on('pointerdown', () => this.showStageInfoModal(i + 1));
      this.stageChips.push({ g, t, zone, x, y: 8, w: chipW, h: chipH, idx: i + 1 });
    });
    // ── 반짝 효과 — 활성 칩 둘레 글로우 (별 표시 제거됨) ──
    this.stageGlow = this.add.graphics().setDepth(1999);
    this.stageGlowTween = null;
    this.refreshStageHud();
  }

  refreshStageHud() {
    const stage = this.registry.get('stage') || 1;
    let activeChip = null;
    this.stageChips.forEach(c => {
      c.g.clear();
      const active = c.idx === stage;
      const done = c.idx < stage;
      // 그림자
      c.g.fillStyle(0x000000, 0.5); c.g.fillRect(c.x + 2, c.y + 2, c.w, c.h);
      // 본체
      c.g.fillStyle(active ? 0xe8b86a : (done ? 0x2e6b58 : 0x14202c), 1);
      c.g.fillRect(c.x, c.y, c.w, c.h);
      // 검정 외곽
      c.g.fillStyle(0x000000, 1);
      c.g.fillRect(c.x, c.y, c.w, 2); c.g.fillRect(c.x, c.y + c.h - 2, c.w, 2);
      c.g.fillRect(c.x, c.y, 2, c.h); c.g.fillRect(c.x + c.w - 2, c.y, 2, c.h);
      c.t.setColor(active ? '#1a0e08' : (done ? '#dff1ff' : '#9aa6ad'));
      if (active) activeChip = c;
    });

    // ── 활성 칩 반짝 효과 ─────────────────────────────────────
    if (!this.stageGlow) return;
    if (activeChip) {
      // 글로우 외곽 (밝은 노랑 stroke, 두 겹)
      this.stageGlow.clear();
      this.stageGlow.lineStyle(3, 0xffe082, 1);
      this.stageGlow.strokeRect(activeChip.x - 3, activeChip.y - 3,
                                activeChip.w + 6, activeChip.h + 6);
      this.stageGlow.lineStyle(1, 0xffffff, 0.8);
      this.stageGlow.strokeRect(activeChip.x - 1, activeChip.y - 1,
                                activeChip.w + 2, activeChip.h + 2);
      if (this.stageGlowTween) this.stageGlowTween.stop();
      this.stageGlow.setAlpha(1);
      this.stageGlowTween = this.tweens.add({
        targets: this.stageGlow,
        alpha: { from: 0.35, to: 1 },
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut'
      });
    } else {
      // 활성 칩 없음 (안전 폴백) — 효과 숨김
      this.stageGlow.clear();
      if (this.stageGlowTween) this.stageGlowTween.stop();
    }
  }

  refreshObjective() {
    if (!this.objective) return;
    const stage = this.registry.get('stage') || 1;
    const ev = (this.registry.get('evidence') || []).length;
    const co = (this.registry.get('coreClues') || []).length;
    const need = (typeof TOTAL_CITIZENS !== 'undefined') ? TOTAL_CITIZENS : 3;

    // PEACE — 단계 안의 두 활동(E·A)을 evidence/coreClues 진행도로 분기
    // 텍스트는 src/strings.js의 STRINGS.objective (editor.html로 편집)
    const S = (typeof STRINGS !== 'undefined') ? STRINGS.objective : null;
    const guide = getGuideName(this.registry);
    const place = getFirstLocationName(this.registry);
    const isIntroCase = (this.registry.get('caseId') === 'intro');
    let text;
    if (stage === 1) {
      text = S ? fmtString(S.perceive, { guide })
               : '🎯 인식 (P) — 안내인 ' + guide + '에게 다가가 상황을 파악하세요';
    } else if (stage === 2) {
      // intro(튜토리얼)는 단서 조사 단계 생략 — 곧장 시민 인터뷰 안내
      if (!isIntroCase && ev < 3) {
        text = S ? fmtString(S.exploreFirst, { place, ev })
                 : '🎯 관찰 (E·탐색) — 노란 표지판으로 ' + place + '을(를) 조사해 단서 ' + ev + '/3 이상 모으세요';
      } else if (isIntroCase) {
        text = '🎯 관찰 (A·분석) — 동기 제임스(!)에게 다가가 한 문제를 풀어보세요';
      } else {
        text = S ? fmtString(S.analyzeCitizens, { co, need })
                 : '🎯 관찰 (A·분석) — 시민(!)을 인터뷰해 핵심 단서 ' + co + '/' + need + '개를 얻으세요';
      }
    } else if (stage === 3) {
      text = S ? S.reflect
               : '🎯 성찰 (C) — 🪞 성찰의 의자에 앉아 인과 사슬과 자기성찰을 마치세요';
    } else {
      text = S ? S.enact
               : '🎯 실천 (E) — 파란 우편함으로 가서 UN 조사 보고서를 송부하세요';
    }
    this.objective.setText(text);
  }

  // PEACE 4단계 자동 진입
  //   1(P 인식)  → 2: 사건 안내인과 친구 됨 (enemyDefeated)
  //   2(E·A 관찰)→ 3: 현장 단서 ≥3  AND  핵심 단서 = 시민 수 (E·A 모두 완료)
  //   3(C 성찰)  → 4: reflectionDone === true (인과 사슬 + 자기성찰 마침)
  // 단계가 실제로 오른 경우에만 카드를 띄움. HUD는 매번 갱신.
  checkStageAdvance() {
    const stage = this.registry.get('stage') || 1;
    let newStage = stage;
    const def = this.registry.get('enemyDefeated');
    const ev = (this.registry.get('evidence') || []).length;
    const co = (this.registry.get('coreClues') || []).length;
    const refl = !!this.registry.get('reflectionDone');
    // intro(튜토리얼)는 단서 조사 단계 생략 — 한센 친구 → 제임스 정답으로 즉시 완료
    const isIntroCase = (this.registry.get('caseId') === 'intro');
    if (stage === 1 && def) newStage = 2;
    else if (stage === 2 && co >= TOTAL_CITIZENS && (isIntroCase || ev >= 3)) newStage = 3;
    else if (stage === 3 && refl) newStage = 4;
    if (newStage !== stage) {
      this.registry.set('stage', newStage);
      this.showStageTransition(newStage);
    }
    this.refreshStageHud();
    this.refreshObjective();
    this.refreshChairMarker();   // ! 마커 등장/숨김 동기화
  }

  // 단계 칩 클릭 시 — 학생이 단계 의미를 잊었을 때 즉시 확인
  // 🏠 사건 선택 돌아가기 확인 모달 (실수 방지)
  showExitConfirm() {
    if (this.exitConfirmOpen) return;
    this.exitConfirmOpen = true;
    const layer = [];

    const dim = this.add.rectangle(480, 300, 960, 600, 0x000000, 0.7)
      .setDepth(5500).setInteractive().setAlpha(0);
    this.tweens.add({ targets: dim, alpha: 0.7, duration: 180 });
    layer.push(dim);

    const cx = 480, cy = 270, cw = 480, ch = 230;
    const card = this.add.graphics().setDepth(5501);
    card.fillStyle(0x000000, 0.6); card.fillRect(cx - cw / 2 + 8, cy - ch / 2 + 8, cw, ch);
    card.fillStyle(0x10202e, 1); card.fillRect(cx - cw / 2, cy - ch / 2, cw, ch);
    card.fillStyle(0x6fb7d6, 1); card.fillRect(cx - cw / 2, cy - ch / 2, cw, 4);
    card.fillStyle(0x000000, 1);
    card.fillRect(cx - cw / 2, cy - ch / 2, cw, 3);
    card.fillRect(cx - cw / 2, cy + ch / 2 - 3, cw, 3);
    card.fillRect(cx - cw / 2, cy - ch / 2, 3, ch);
    card.fillRect(cx + cw / 2 - 3, cy - ch / 2, 3, ch);
    layer.push(card);

    const head = this.add.text(cx, cy - 55, '🏠  임무 선택으로 돌아가기', {
      fontFamily: FONT_TITLE, fontSize: '19px', color: '#dff1ff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5502);
    layer.push(head);

    const msg = this.add.text(cx, cy - 12,
      '임무 선택 화면으로 돌아가시겠습니까?\n진행도는 그대로 저장됩니다.', {
      fontFamily: FONT, fontSize: '13px', color: '#a8c4dc',
      align: 'center', lineSpacing: 5
    }).setOrigin(0.5).setDepth(5502);
    layer.push(msg);

    const collectBtn = (btn) => {
      if (btn.g)    { btn.g.setDepth(5503);    layer.push(btn.g); }
      if (btn.t)    { btn.t.setDepth(5504);    layer.push(btn.t); }
      if (btn.zone) { btn.zone.setDepth(5505); layer.push(btn.zone); }
    };

    const closeAll = () => {
      layer.forEach(o => { if (o && o.destroy) o.destroy(); });
      this.exitConfirmOpen = false;
    };

    const noBtn = fancyButton(this, cx - 110, cy + 55, 180, 42, '← 계속 진행',
      () => closeAll(),
      { base: 0x4a3a22, hover: 0x6a5a3a, edge: 0xc9a36b, text: '#ffe9b8' });
    collectBtn(noBtn);

    const yesBtn = fancyButton(this, cx + 110, cy + 55, 180, 42, '🏠  돌아가기',
      () => {
        closeAll();
        if (this.leaving) return;
        this.leaving = true;
        if (window.SFX) window.SFX.play('click');
        this.cameras.main.fadeOut(280, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete',
          () => this.scene.start('CaseSelectScene'));
      },
      { base: 0x2b3a52, hover: 0x3c5170, edge: 0x6fb7d6, text: '#dff1ff' });
    collectBtn(yesBtn);

    // dim 클릭 시 취소
    dim.on('pointerdown', closeAll);
  }

  showStageInfoModal(stage) {
    if (this.stageInfoOpen) return;
    this.stageInfoOpen = true;
    // 학습 자료용 PEACE 단계 설명 (영문 약어 + 한글 + 활동)
    const PEACE_INFO = {
      1: { letter: 'P', en: 'Perceive',  ko: '인식',
           desc: '사건을 만나고 안내인의 이야기를 듣습니다.',
           act:  '안내인(!)에게 다가가 대화를 시작하세요.' },
      2: { letter: 'E·A', en: 'Explore + Analyze', ko: '관찰',
           desc: '현장의 단서를 모으고 시민을 인터뷰해 사실을 분석합니다.',
           act:  '🔍 노란 표지판으로 현장 조사 + 시민(!) 인터뷰' },
      3: { letter: 'C', en: 'Connect',   ko: '성찰',
           desc: '흩어진 사실들을 인과 사슬로 잇고 자기성찰을 합니다.',
           act:  '🪞 성찰의 의자에 앉아 [원인 → 과정 → 결과]를 만드세요.' },
      4: { letter: 'E', en: 'Enact',     ko: '실천',
           desc: '배운 것을 행동으로 옮기는 마지막 단계입니다.',
           act:  '📮 파란 우편함에 UN 조사 보고서를 송부하세요.' },
    };
    const info = PEACE_INFO[stage];
    if (!info) { this.stageInfoOpen = false; return; }
    const layer = [];

    const dim = this.add.rectangle(480, 300, 960, 600, 0x000000, 0.55)
      .setDepth(3500).setInteractive().setAlpha(0);
    layer.push(dim);
    this.tweens.add({ targets: dim, alpha: 0.55, duration: 180 });

    const cx = 480, cy = 280, cw = 520, ch = 280;
    const g = this.add.graphics().setDepth(3501);
    g.fillStyle(0x000000, 0.6); g.fillRect(cx - cw / 2 + 6, cy - ch / 2 + 6, cw, ch);
    g.fillStyle(0x10202e, 1); g.fillRect(cx - cw / 2, cy - ch / 2, cw, ch);
    g.fillStyle(0xe8b86a, 1);
    g.fillRect(cx - cw / 2, cy - ch / 2, cw, 4);
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - cw / 2, cy - ch / 2, cw, 2);
    g.fillRect(cx - cw / 2, cy + ch / 2 - 2, cw, 2);
    g.fillRect(cx - cw / 2, cy - ch / 2, 2, ch);
    g.fillRect(cx + cw / 2 - 2, cy - ch / 2, 2, ch);
    layer.push(g);

    // 상단 — 단계 큰 라벨
    const head = this.add.text(cx, cy - 96,
      stage + '단계  ·  ' + info.ko + ' (' + info.letter + ')', {
      fontFamily: FONT_TITLE, fontSize: '22px', color: '#ffe082',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3502);
    layer.push(head);

    // 영문 부제
    const sub = this.add.text(cx, cy - 65,
      info.en, {
      fontFamily: FONT, fontSize: '13px', color: '#a8c4dc',
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(3502);
    layer.push(sub);

    // 설명
    const desc = this.add.text(cx, cy - 25, info.desc, {
      fontFamily: FONT, fontSize: '13px', color: '#dfefff',
      wordWrap: { width: cw - 40 }, align: 'center', lineSpacing: 4
    }).setOrigin(0.5).setDepth(3502);
    layer.push(desc);

    // 활동 안내 (강조)
    const actBg = this.add.graphics().setDepth(3502);
    actBg.fillStyle(0x1a3a2a, 1); actBg.fillRect(cx - cw / 2 + 20, cy + 12, cw - 40, 40);
    actBg.lineStyle(1, 0x7fd07f, 1); actBg.strokeRect(cx - cw / 2 + 20, cy + 12, cw - 40, 40);
    layer.push(actBg);
    const act = this.add.text(cx, cy + 32, info.act, {
      fontFamily: FONT, fontSize: '13px', color: '#dffce0',
      wordWrap: { width: cw - 60 }, align: 'center'
    }).setOrigin(0.5).setDepth(3503);
    layer.push(act);

    // 닫기 버튼
    const closeBtn = fancyButton(this, cx, cy + 96, 140, 32, '← 닫기',
      () => {
        layer.forEach(o => { if (o && o.destroy) o.destroy(); });
        // 버튼도 정리
        if (closeBtn.g) closeBtn.g.destroy();
        if (closeBtn.t) closeBtn.t.destroy();
        if (closeBtn.zone) closeBtn.zone.destroy();
        this.stageInfoOpen = false;
      },
      { base: 0x2b3a52, hover: 0x3c5170, edge: 0x6fb7d6, text: '#dff1ff' });
    if (closeBtn.g)    closeBtn.g.setDepth(3503);
    if (closeBtn.t)    closeBtn.t.setDepth(3504);
    if (closeBtn.zone) closeBtn.zone.setDepth(3505);

    // dim 클릭으로도 닫힘
    dim.on('pointerdown', () => {
      layer.forEach(o => { if (o && o.destroy) o.destroy(); });
      if (closeBtn.g) closeBtn.g.destroy();
      if (closeBtn.t) closeBtn.t.destroy();
      if (closeBtn.zone) closeBtn.zone.destroy();
      this.stageInfoOpen = false;
    });
  }

  showStageTransition(stage) {
    // 데이터는 src/stages.js의 STAGE_TRANSITIONS_BY_CASE에서 사건별 분기
    // (editor.html에서 사건별로 편집). caseId 누락 시 aralsea 폴백.
    const caseId = this.registry.get('caseId') || 'aralsea';
    const byCase = (typeof STAGE_TRANSITIONS_BY_CASE !== 'undefined')
      ? STAGE_TRANSITIONS_BY_CASE[caseId] : null;
    const d = (byCase && byCase[stage])
      || (typeof STAGE_TRANSITIONS !== 'undefined' ? STAGE_TRANSITIONS[stage] : null);
    if (!d) return;
    if (window.SFX) window.SFX.play('stage');   // 단계 전환 팡파레

    const layer = [];
    const dim = this.add.rectangle(480, 300, 960, 600, 0x000000, 0.65)
      .setDepth(3000).setInteractive().setAlpha(0);
    layer.push(dim);
    // 부드러운 페이드인
    this.tweens.add({ targets: dim, alpha: 0.65, duration: 220, ease: 'Sine.out' });

    const cx = 480, cy = 290, cw = 640, ch = 320;
    const cg = this.add.graphics().setDepth(3001);
    cg.fillStyle(0x000000, 0.6); cg.fillRect(cx - cw / 2 + 8, cy - ch / 2 + 8, cw, ch);
    cg.fillStyle(0x10202e, 1); cg.fillRect(cx - cw / 2, cy - ch / 2, cw, ch);
    cg.fillStyle(0x000000, 1);
    cg.fillRect(cx - cw / 2, cy - ch / 2, cw, 4);
    cg.fillRect(cx - cw / 2, cy + ch / 2 - 4, cw, 4);
    cg.fillRect(cx - cw / 2, cy - ch / 2, 4, ch);
    cg.fillRect(cx + cw / 2 - 4, cy - ch / 2, 4, ch);
    cg.fillStyle(0xe8b86a, 1);
    cg.fillRect(cx - cw / 2 + 4, cy - ch / 2 + 4, cw - 8, 4);
    cg.fillRect(cx - cw / 2 + 4, cy + ch / 2 - 8, cw - 8, 4);
    cg.fillRect(cx - cw / 2 + 4, cy - ch / 2 + 4, 4, ch - 8);
    cg.fillRect(cx + cw / 2 - 8, cy - ch / 2 + 4, 4, ch - 8);
    layer.push(cg);

    const t1 = this.add.text(cx, cy - 110, d.title, {
      fontFamily: FONT_TITLE, fontSize: '28px', color: '#ffe9b8',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3002);
    const t2 = this.add.text(cx, cy - 65, d.sub, {
      fontFamily: FONT, fontSize: '17px', color: '#f3ece0'
    }).setOrigin(0.5).setDepth(3002);

    // 메타인지 발문(reflection prompt) — 단계별 깊이 있는 한 문장
    const reflectBox = this.add.graphics().setDepth(3001.5);
    reflectBox.fillStyle(0x1a2a3a, 1);
    reflectBox.fillRect(cx - 280, cy - 38, 560, 70);
    reflectBox.fillStyle(0x6fb7d6, 1);
    reflectBox.fillRect(cx - 280, cy - 38, 4, 70);
    layer.push(reflectBox);
    const tReflect = this.add.text(cx, cy - 3, d.reflect, {
      fontFamily: FONT, fontSize: '14px', color: '#cfe9ff',
      align: 'center', lineSpacing: 4
    }).setOrigin(0.5).setDepth(3002);

    const t3 = this.add.text(cx, cy + 65, '➔  ' + d.hint, {
      fontFamily: FONT, fontSize: '15px', color: '#ffd96a'
    }).setOrigin(0.5).setDepth(3002);
    const t4 = this.add.text(cx, cy + 115, '클릭하여 계속', {
      fontFamily: FONT, fontSize: '13px', color: '#9aa6ad'
    }).setOrigin(0.5).setDepth(3002);
    layer.push(t1, t2, tReflect, t3, t4);

    // 카드 본체·텍스트 페이드인 + 살짝 솟아오르는 연출
    [cg, t1, t2, reflectBox, tReflect, t3, t4].forEach(o => o.setAlpha(0));
    this.tweens.add({
      targets: [cg, t1, t2, reflectBox, tReflect, t3, t4],
      alpha: 1, duration: 280, ease: 'Sine.out', delay: 80
    });
    [t1, t2, tReflect, t3, t4].forEach(o => { o.y += 12; });
    this.tweens.add({
      targets: [t1, t2, tReflect, t3, t4],
      y: '-=12', duration: 320, ease: 'Sine.out', delay: 80
    });

    // 카드 표시 동안 플레이어 이동 잠금
    this.cardOpen = true;
    if (this.player && this.player.body) this.player.body.setVelocity(0);

    let closed = false;
    const close = () => {
      if (closed) return; closed = true;
      this.tweens.add({
        targets: layer, alpha: 0, duration: 200, ease: 'Sine.in',
        onComplete: () => {
          layer.forEach(o => { if (o && o.destroy) o.destroy(); });
          this.cardOpen = false;
        }
      });
    };
    dim.once('pointerdown', close);
    this.time.delayedCall(7000, () => { if (dim && dim.scene) close(); });
  }

  // 단계가 부족한 경우 토스트로 안내 (트리거 게이팅용)
  showLockToast(message) {
    if (this.lockToast && this.lockToast.active) return;
    this.lockToast = this.add.text(480, 530, message, {
      fontFamily: FONT, fontSize: '13px', color: '#ffdcdc',
      backgroundColor: '#000000cc', padding: { x: 8, y: 6 },
      align: 'center'
    }).setOrigin(0.5).setDepth(2500);
    this.time.delayedCall(1800, () => {
      if (this.lockToast) { this.lockToast.destroy(); this.lockToast = null; }
    });
  }

  // 시민 머리 위 마커를 "다음 차례" 안내용으로 한 곳에서 일괄 갱신.
  //   • CITIZENS 배열의 첫 번째 미해결 시민 1명 → ▼ (떠다님)
  //   • 그 외 미해결 시민 → 마커 숨김 (학생 시선 분산 방지)
  //   • 풀이 완료 시민 → ✓ (고정)
  // WorldScene create 끝, 그리고 매 onResume(QuizScene 종료 직후)마다 호출.
  updateCitizenMarkers() {
    if (!this.citizenObjs || this.citizenObjs.length === 0) return;
    const solved = this.registry.get('quizSolved') || {};
    // 인터뷰 잠금 중에는 시민 마커를 전부 숨김 — 안내인 ! 와 겹쳐 보이는 "꼬임" 방지.
    //   잠금 해제: 안내인 대화 완료(enemyDefeated) + (튜토리얼이거나 현장 단서 3개+)
    const introCase = (this.registry.get('caseId') === 'intro');
    const defeated = !!this.registry.get('enemyDefeated');
    const ev = (this.registry.get('evidence') || []).length;
    const unlocked = defeated && (introCase || ev >= 3);
    if (!unlocked) {
      this.citizenObjs.forEach(co => {
        if (co.marker && co.marker.scene) {
          this.tweens.killTweensOf(co.marker);
          co.marker.setVisible(false);
        }
      });
      return;
    }
    // 다음에 가야 할 시민(배열 순서상 첫 미해결) 찾기
    let nextIdx = -1;
    for (let i = 0; i < this.citizenObjs.length; i++) {
      if (!solved[this.citizenObjs[i].cz.id]) { nextIdx = i; break; }
    }
    this.citizenObjs.forEach((co, i) => {
      if (!co.marker || !co.marker.scene) return;
      const isSolved = !!solved[co.cz.id];
      const hasArt = !!co.art;
      const markerY0 = hasArt ? (co.cz.y - 80) : (co.cz.y - 50);
      this.tweens.killTweensOf(co.marker);
      if (isSolved) {
        // 완료 — ✓ 고정
        co.marker.setText('✓').setColor('#7fd07f').setFontSize(16);
        co.marker.setY(markerY0).setVisible(true);
      } else if (i === nextIdx) {
        // 다음 차례 — ▼ 떠다님
        co.marker.setText('▼').setColor('#ffe082').setFontSize(18);
        co.marker.setY(markerY0).setVisible(true);
        this.tweens.add({
          targets: co.marker, y: markerY0 - 8, duration: 500,
          yoyo: true, repeat: -1, ease: 'Sine.inOut'
        });
      } else {
        // 그 외 미해결 — 시선 분산 방지 위해 숨김
        co.marker.setVisible(false);
      }
    });
  }

  // 오버레이(대화/퀴즈/조사)가 닫힌 직후 호출됨
  onResume() {
    this.talking = false;
    this.entering = false;
    this.leaving = false;     // 🏠 사건선택 모달 재사용 위해 리셋
    this.cooldown = true;
    this.time.delayedCall(700, () => { this.cooldown = false; });

    // 맵 BGM 재개 — 대화·퀴즈는 pause로 멈춰있어 이어듣기,
    // 조사 화면에서 복귀 시엔 조사 BGM이 재생 중이므로 src 전환 → 처음부터
    if (window.SFX) {
      const cid = this.registry.get('caseId') || 'aralsea';
      const bgmSrc = BGM_BY_CASE[cid];
      if (bgmSrc) window.SFX.playBGM(bgmSrc);
    }

    // 안내인 친구 됨 처리 — 도트·일러스트·마커·라벨 모두 제거 (tween 먼저 정리)
    if (this.registry.get('enemyDefeated')) {
      if (this.enemy && this.enemy.scene) {
        this.tweens.killTweensOf(this.enemy);
        this.enemy.destroy(); this.enemy = null;
      }
      if (this.enemyArt && this.enemyArt.scene) {
        this.tweens.killTweensOf(this.enemyArt);
        this.enemyArt.destroy(); this.enemyArt = null;
      }
      if (this.enemyMarker && this.enemyMarker.scene) {
        this.tweens.killTweensOf(this.enemyMarker);
        this.enemyMarker.destroy(); this.enemyMarker = null;
      }
      if (this.enemyLabel && this.enemyLabel.scene) {
        this.enemyLabel.destroy(); this.enemyLabel = null;
      }
    }

    // 시민 마커 갱신 — 다음 차례 1명만 ▼, 그 외 미해결은 숨김, 풀이 완료는 ✓
    //   (이문호 교사 피드백: "안내인 순서대로 가야할 안내인에게 마커가 찍혀야할거같아요")
    this.updateCitizenMarkers();

    this.refreshCoreHud();
    this.refreshChairMarker();   // 성찰 의자 ! 마커도 즉시 갱신
    // 단계 자동 진입 (전환 카드 포함)
    this.checkStageAdvance();
    // 교사 대시보드로 진행도 발행
    reportProgress(this);
  }
}

// ── 미연시 스타일 대화 장면 ─────────────────────────────────────
class DialogueScene extends Phaser.Scene {
  constructor() { super('DialogueScene'); }

  create() {
    this.love = this.registry.get('slimeLove') || 0;
    if (window.SFX) {
      window.SFX.play('talk');   // 대화 시작 신호음
      window.SFX.pauseBGM();     // 맵 BGM 일시정지 (대화 후 이어듣기)
    }

    // 배경 없음 — 월드 위에 오버레이. 살짝 어둡게 깔아 가독성↑
    this.add.rectangle(480, 300, 960, 600, 0x000000, 0.45);

    // 좌측 큰 캐릭터 — 사건별 안내인 일러스트 (있으면 상반신 컷, 없으면 도트)
    //  intro     → portrait_hansen
    //  aralsea   → portrait_aijoli
    //  ukraine   → portrait_kateryna
    //  palestine → portrait_karim
    const caseId = this.registry.get('caseId') || 'aralsea';
    const guidePortraitKey =
      caseId === 'intro'     ? 'portrait_hansen'   :
      caseId === 'ukraine'   ? 'portrait_kateryna' :
      caseId === 'palestine' ? 'portrait_karim'    :
      'portrait_aijoli';
    if (this.textures.exists(guidePortraitKey)) {
      this.portrait = this.add.image(140, 20, guidePortraitKey)
        .setOrigin(0.5, 0).setDepth(5);
      const tex = this.textures.get(guidePortraitKey).getSourceImage();
      this.portrait.setScale(720 / tex.height);
      const maskShape = this.make.graphics({ add: false });
      maskShape.fillStyle(0xffffff);
      maskShape.fillRect(0, 0, 960, 420);
      this.portrait.setMask(maskShape.createGeometryMask());
      this.tweens.add({
        targets: this.portrait, y: 18, duration: 900,
        yoyo: true, repeat: -1, ease: 'Sine.inOut'
      });
    } else {
      this.portrait = this.add.sprite(160, 410, 'kid_0')
        .setOrigin(0.5, 1).setScale(10).setDepth(5);
      this.portrait.play('kid_idle');
      this.tweens.add({
        targets: this.portrait, y: 405, duration: 900,
        yoyo: true, repeat: -1, ease: 'Sine.inOut'
      });
    }

    // 우상단 이해도 칩 — 텍스트는 패널 가운데와 일치 (cx=712)
    panel(this, 712, 30, 160, 40, 0x12283a, 0x6fb7d6);
    this.loveText = this.add.text(712, 30, '', {
      fontFamily: FONT, fontSize: '16px', color: '#bfe6ff'
    }).setOrigin(0.5);

    // 우상단 — 대화 도중 빠져나가기 (월드로 복귀)
    fancyButton(this, 880, 30, 130, 36, '← 닫기',
      () => this.bailOut(),
      { base: 0x3a2410, hover: 0x5c4718, edge: 0xe8b86a, text: '#ffe9b8' });

    // 하단 대사 박스 (전체 너비)
    panel(this, 480, 510, 940, 170, 0x0c1620, 0xe8b86a);

    // 이름표 [아이졸리] - 박스 상단 좌측
    this.nameText = this.add.text(54, 438, '', {
      fontFamily: FONT_TITLE, fontSize: '20px', color: '#ffd96a',
      fontStyle: 'bold'
    }).setOrigin(0, 0);

    // 본문
    this.bodyText = this.add.text(54, 472, '', {
      fontFamily: FONT, fontSize: '20px', color: '#f3ece0',
      wordWrap: { width: 860 }, lineSpacing: 8
    });

    // 하단 ▼ 진행 안내
    this.hint = this.add.text(910, 578, '▼', {
      fontFamily: FONT, fontSize: '18px', color: '#e8b86a'
    }).setOrigin(1, 1);
    this.tweens.add({
      targets: this.hint, alpha: 0.3, duration: 600,
      yoyo: true, repeat: -1
    });

    this.choiceBtns = [];
    // 진입 직후 잠시 입력 잠금 — 트리거 시점의 클릭/키가 새 씬으로 흘러드는 것 방지
    this.inputLocked = true;
    this.time.delayedCall(350, () => { this.inputLocked = false; });

    this.show('start');

    this.input.on('pointerdown', () => this.onClick());
    this.input.keyboard.on('keydown-SPACE', () => this.onClick());
  }

  updateLove() {
    // 공감 점수 시각화 — 누적 love(0~12+)를 5단 별로 표시
    const filled = Math.max(0, Math.min(5, Math.floor(this.love / 2)));
    const stars = '★'.repeat(filled) + '☆'.repeat(5 - filled);
    this.loveText.setText('🤝 공감  ' + stars);
  }

  show(nodeId) {
    const node = STORY[nodeId];
    if (!node) { return this.finish({}); }
    this.node = node;
    this.clearChoices();

    // 이름: [아이졸리] 형식 (말하는 사람 없으면 비움)
    this.nameText.setText(node.speaker ? '[' + node.speaker + ']' : '');
    this.full = node.text;
    this.bodyText.setText('');
    this.typing = true;
    this.hint.setVisible(false);
    this.updateLove();

    // 타자기 효과
    let i = 0;
    this.timer = this.time.addEvent({
      delay: 28,
      repeat: this.full.length - 1,
      callback: () => {
        i++;
        this.bodyText.setText(this.full.slice(0, i));
        if (i >= this.full.length) this.finishTyping();
      }
    });
  }

  finishTyping() {
    this.typing = false;
    if (this.node.choices) {
      this.showChoices(this.node.choices);
    } else {
      this.hint.setVisible(true);
    }
    // 같은 클릭이 곧장 다음 대사로 넘어가는 것 방지
    this.inputLocked = true;
    this.time.delayedCall(180, () => { this.inputLocked = false; });
  }

  onClick() {
    if (this.inputLocked) return;
    if (this.typing) {
      if (this.timer) this.timer.remove();
      this.bodyText.setText(this.full);
      this.finishTyping();
      return;
    }
    if (this.node.choices) return;
    if (this.node.end) return this.finish(this.node);
    if (this.node.next) this.show(this.node.next);
  }

  showChoices(choices) {
    const theme = {
      base: 0x1c3344, hover: 0x2c5066,
      edge: 0x6fb7d6, text: '#dff1ff'
    };
    // 본문은 박스 안에 그대로 유지 — 사용자가 다 읽을 수 있도록
    // 선택지는 본문 박스 위쪽 (portrait 우측 영역)에 별도 표시
    const n = choices.length;
    const blockH = n * 36;
    const startY = 410 - blockH;   // 박스(425~) 위에 쌓아 올림
    choices.forEach((ch, idx) => {
      const y = startY + idx * 36;
      const b = fancyButton(this, 620, y, 580, 32, ch.label,
        () => this.pick(ch), theme);
      this.choiceBtns.push(b.g, b.zone, b.t);
    });
  }

  clearChoices() {
    this.choiceBtns.forEach(o => o.destroy());
    this.choiceBtns = [];
  }

  pick(ch) {
    if (ch.love) {
      this.love += ch.love;
      this.registry.set('slimeLove', this.love);
      this.floatLove(ch.love);
    }
    this.clearChoices();
    // 같은 클릭이 전역 onClick으로도 들어와 다음 대사 타자기를
    // 즉시 스킵하는 것 방지
    this.inputLocked = true;
    this.time.delayedCall(200, () => { this.inputLocked = false; });
    if (ch.next) {
      this.show(ch.next);
    }
  }

  floatLove(amount) {
    const t = this.add.text(160, 280, (amount > 0 ? '+' : '') + amount + ' 📘', {
      fontFamily: FONT_TITLE, fontSize: '26px', color: '#7ad0ff',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({
      targets: t, y: 230, alpha: 0, duration: 1000,
      onComplete: () => t.destroy()
    });
  }

  finish(node) {
    if (node.befriend) {
      this.registry.set('enemyDefeated', true);
    }
    // 오버레이 종료 후 월드 재개 (intro 포함 모든 사건이 WorldScene 사용)
    this.scene.stop();
    this.scene.resume('WorldScene');
  }

  // 사용자가 대화 중간에 닫기 버튼 누름 — 상태 변경 없이 월드 복귀
  bailOut() {
    if (this.timer) this.timer.remove();
    this.scene.stop();
    this.scene.resume('WorldScene');
  }
}

// ── 역전재판식 현장 조사 장면 ───────────────────────────────────
class InvestigationScene extends Phaser.Scene {
  constructor() { super('InvestigationScene'); }

  create() {
    setCfgBarVisible(false);
    this.cameras.main.fadeIn(220, 0, 0, 0);  // 부드러운 진입
    // 조사 전용 BGM (모든 사건 공통) — 잔잔·집중. 종료 시 WorldScene
    // onResume이 맵 BGM으로 자동 전환.
    if (window.SFX) window.SFX.playBGM(BGM_INVESTIGATION);
    this.locId = this.registry.get('invLoc') || CASE.start;
    this.collected = this.registry.get('evidence') || [];
    this.examine = false;
    this.overlay = [];

    const loc = CASE.locations[this.locId];

    // 배경
    // 사진이 있으면 사진 사용, 없으면 코드로 그린 배경 사용
    const photoMap = {
      // 인트로 (튜토리얼)
      bg_un_hq:      'photo_un_hq',
      // 아랄해
      bg_port:       'photo_port',
      bg_strait:     'photo_strait',
      bg_market:     'photo_market',
      // 우크라이나
      bg_school:     'photo_school',
      bg_grain_port: 'photo_grain_port',
      bg_shelter:    'photo_shelter',
      // 팔레스타인
      bg_olive:      'photo_olive',
      bg_oldcity:    'photo_oldcity',
      bg_unrwa:      'photo_unrwa',
    };
    const photoKey = photoMap[loc.bg];
    if (photoKey && this.textures.exists(photoKey)) {
      // Flow로 생성된 사진은 이미 픽셀 아트로 그려져 있으므로
      // 추가 픽셀화 필터를 적용하지 않고 원본 해상도 그대로 표시
      this.add.image(480, BG_H / 2, photoKey).setDisplaySize(BG_W, BG_H);
    } else if (loc.bg === 'bg_un_hq') {
      // intro: UN 본부 사무실 — graphics로 사무실 풍 배경 그림 (사진 자산 없음)
      this.drawHQOfficeBg();
    } else if (this.textures.exists(loc.bg)) {
      this.add.image(480, BG_H / 2, loc.bg);
    } else {
      // 텍스처 없는 사건 — 검은 배경 + 안내
      const fb = this.add.graphics();
      fb.fillStyle(0x1a2030, 1); fb.fillRect(0, 0, BG_W, BG_H);
      this.add.text(480, BG_H / 2, '(' + loc.bg + ' 배경 없음)', {
        fontFamily: FONT, fontSize: '14px', color: '#7a8a98'
      }).setOrigin(0.5);
    }
    // 장소 이름 칩
    const np = this.add.graphics().setDepth(5);
    const nw = loc.name.length * 22 + 60;
    np.fillStyle(0x000000, 0.35); np.fillRoundedRect(17, 15, nw, 38, 10);
    np.fillStyle(0x101a26, 0.92); np.fillRoundedRect(14, 12, nw, 38, 10);
    np.lineStyle(2, 0xe8b86a, 1); np.strokeRoundedRect(14, 12, nw, 38, 10);
    this.add.text(30, 31, '🔍 ' + loc.name, {
      fontFamily: FONT_TITLE, fontSize: '20px', color: '#ffe9b8',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(6);

    // 우상단 단서 카운터 — 이 장소 + 전체 동시 표시
    const tot = this.totalEvidence();
    const locEvIds = loc.spots.filter(s => s.evidence).map(s => s.evidence.id);
    const locTot = locEvIds.length;
    this._locDoneShown = false;
    this.evHud = this.add.text(940, 20, '', {
      fontFamily: FONT, fontSize: '14px', color: '#ffe082',
      backgroundColor: '#00000088', padding: { x: 8, y: 4 },
      align: 'right'
    }).setOrigin(1, 0).setDepth(6);
    this.refreshEvHud = () => {
      const locDone = locEvIds.filter(id =>
        this.collected.find(c => c.id === id)).length;
      const locDoneAll = (locTot > 0 && locDone >= locTot);
      const locTxt = (locTot > 0)
        ? '📍 이 장소  ' + locDone + ' / ' + locTot + (locDoneAll ? '  ✓' : '')
        : '';
      const allTxt = '📋 전체  ' + this.collected.length + ' / ' + tot;
      this.evHud.setText(locTxt + (locTxt ? '\n' : '') + allTxt);
      // 이 장소 완료 시 한 번만 배너 알림
      if (locDoneAll && !this._locDoneShown) {
        this._locDoneShown = true;
        this.showLocCompleteBanner();
      }
    };
    this.refreshEvHud();

    // 조사 지점
    this.zones = [];
    loc.spots.forEach(spot => {
      const z = this.add.rectangle(
        spot.x + spot.w / 2, spot.y + spot.h / 2,
        spot.w, spot.h, 0xffe082, 0
      ).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => { if (this.examine) this.inspect(spot); });
      this.zones.push(z);
    });

    // ── 🛠 DEBUG 모드 (?debug=1) — spot 영역 시각화 + 좌표 picker ──
    // 사용법: URL ?debug=1 → spot 영역이 노란 박스로 표시 + 사진 어디 클릭해도
    //        화면 우상단에 좌표(x, y) 표시. 정확한 단서 위치를 클릭해 좌표 알려주면
    //        cases.js spot 좌표를 정확히 보정 가능.
    if (/[?&]debug=1\b/.test(location.search || '')) {
      // 각 spot 영역을 노란 박스로 그림 + 라벨
      loc.spots.forEach((spot, i) => {
        const box = this.add.graphics().setDepth(50);
        box.lineStyle(2, 0xffe082, 0.9);
        box.strokeRect(spot.x, spot.y, spot.w, spot.h);
        box.fillStyle(0xffe082, 0.12);
        box.fillRect(spot.x, spot.y, spot.w, spot.h);
        this.add.text(spot.x + 4, spot.y + 4,
          (i + 1) + '. ' + spot.name + ' (' + spot.x + ',' + spot.y + ' ' + spot.w + 'x' + spot.h + ')',
          {
            fontFamily: FONT, fontSize: '10px', color: '#ffe082',
            backgroundColor: '#000000bb', padding: { x: 4, y: 2 }
          }).setDepth(51);
      });
      // 사진 위 클릭 → 좌표 표시
      const dbgInfo = this.add.text(940, 60,
        '🛠 DEBUG · click photo to log coordinates',
        {
          fontFamily: FONT, fontSize: '11px', color: '#ffe082',
          backgroundColor: '#000000bb', padding: { x: 6, y: 3 },
          align: 'right'
        }).setOrigin(1, 0).setDepth(60);
      const dbgZone = this.add.zone(0, 0, 960, BG_H)
        .setOrigin(0, 0).setInteractive().setDepth(45);
      dbgZone.on('pointerdown', (pointer) => {
        const px = Math.round(pointer.x), py = Math.round(pointer.y);
        dbgInfo.setText('🛠 DEBUG · Click: x=' + px + ', y=' + py);
        console.log('[DEBUG][spot] x:', px, '  y:', py);
        const dot = this.add.circle(px, py, 4, 0xff4040, 1).setDepth(55);
        this.tweens.add({
          targets: dot, alpha: 0, duration: 1500, ease: 'Sine.in',
          onComplete: () => dot.destroy()
        });
      });
    }

    // 하단 명령 바 — 16:10(960폭) 기준
    const bar = this.add.graphics().setDepth(4);
    bar.fillStyle(0x000000, 0.4); bar.fillRect(0, 480, 960, 120);
    bar.fillGradientStyle(0x14202c, 0x14202c, 0x0c141c, 0x0c141c, 1);
    bar.fillRect(6, 446, 948, 148);
    bar.lineStyle(2, 0xe8b86a, 1); bar.strokeRect(6, 446, 948, 148);
    bar.lineStyle(1, 0xe8b86a, 0.25); bar.strokeRect(11, 451, 938, 138);
    this.msg = this.add.text(36, 462, '명령을 선택하세요.', {
      fontFamily: FONT, fontSize: '14px', color: '#f3ece0',
      wordWrap: { width: 888 }, lineSpacing: 4
    }).setDepth(5);

    // 버튼 4개 균등 분포 (x 가운데 기준): 120, 360, 600, 840
    this.btnExamine = this.makeBtn(120, 565, 150, '조사한다',
      () => this.toggleExamine());
    this.btnMove = this.makeBtn(360, 565, 150, '이동한다',
      () => this.showMoves(loc));
    this.makeBtn(600, 565, 150, '단서 기록', () => this.showRecord());
    this.makeBtn(840, 565, 150, '나가기', () => this.leave());

    // 돋보기 커서
    this.glass = this.add.image(0, 0, 'magnifier')
      .setDepth(20).setVisible(false);

    this.input.keyboard.on('keydown-ESC', () => {
      if (this.examine) this.toggleExamine();
    });
  }

  makeBtn(x, y, w, label, cb) {
    const h = 46;
    const g = this.add.graphics().setDepth(5);
    const draw = (c) => {
      g.clear();
      g.fillStyle(0x000000, 0.35);
      g.fillRoundedRect(x - w / 2 + 3, y - h / 2 + 4, w, h, 10);
      g.fillStyle(c, 1);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
      g.lineStyle(2, 0xe8b86a, 1);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    };
    draw(0x352910);
    // 모바일 hit area 살짝 확장 (시각은 그대로)
    const pad = window.IS_MOBILE ? 8 : 0;
    const zone = this.add.zone(x, y, w + pad * 2, h + pad * 2)
      .setInteractive({ useHandCursor: true }).setDepth(6);
    const t = this.add.text(x, y, label, {
      fontFamily: FONT, fontSize: '18px', color: '#ffe9b8'
    }).setOrigin(0.5).setDepth(6);
    zone.on('pointerover', () => draw(0x5c4718));
    zone.on('pointerout', () => draw(0x352910));
    zone.on('pointerdown', () => cb());
    return { r: zone, t };
  }

  toggleExamine() {
    this.examine = !this.examine;
    this.clearOverlay();
    this.glass.setVisible(this.examine);
    // spot 시각화 강화 — 이문호 교사 피드백: "네모박스가 너무 연해서 잘 안 보임".
    //   alpha 0.14 → 0.32, 외곽선 추가, 깜빡이는 펄스 트윈으로 학생 시선 유도.
    //   조사 종료 시 트윈 정리 + 외곽선 제거.
    this.zones.forEach(z => {
      this.tweens.killTweensOf(z);
      if (this.examine) {
        z.setFillStyle(0xffe082, 0.32);
        z.setStrokeStyle(3, 0xffd54a, 1);
        // 펄스 — fillAlpha 트윈
        this.tweens.add({
          targets: z, fillAlpha: 0.58, duration: 700,
          yoyo: true, repeat: -1, ease: 'Sine.inOut'
        });
      } else {
        z.setFillStyle(0xffe082, 0);
        z.setStrokeStyle(0);
      }
    });
    this.btnExamine.t.setText(this.examine ? '조사 종료' : '조사한다');
    this.msg.setText(this.examine
      ? '🟡 노란 박스 안을 돋보기로 클릭하세요. (ESC: 취소)'
      : '명령을 선택하세요.');
  }

  inspect(spot) {
    // 새 단서 입수 처리
    let newlyFound = null;
    if (spot.evidence && !this.collected.find(e => e.id === spot.evidence.id)) {
      this.collected.push(spot.evidence);
      this.registry.set('evidence', this.collected);
      this.flash('단서 입수!');
      if (window.SFX) window.SFX.play('evidence');
      if (this.refreshEvHud) this.refreshEvHud();
      newlyFound = spot.evidence;
    }
    // 결과는 팝업 모달에 — 하단 명령 박스는 안내문 유지
    this.showInspectPopup(spot, newlyFound);
  }

  // 돋보기로 spot 클릭 시 — 가운데 팝업에 장소·단서 정보 즉시 표시
  showInspectPopup(spot, newlyFound) {
    if (this.inspectOpen) return;
    this.inspectOpen = true;
    this.inspectLayer = [];
    this.inspectNewlyFound = newlyFound;

    const px = 130, py = 100, pw = 700, ph = 360;

    // 어두운 배경
    const dim = this.add.rectangle(480, 300, 960, 600, 0x000000, 0.7)
      .setDepth(3400).setInteractive();
    this.inspectLayer.push(dim);

    // 본 패널
    const pg = this.add.graphics().setDepth(3401);
    pg.fillStyle(0x10202e, 1); pg.fillRect(px, py, pw, ph);
    pg.lineStyle(3, 0xc9a36b, 1); pg.strokeRect(px, py, pw, ph);
    pg.fillStyle(0xc9a36b, 1); pg.fillRect(px, py, 6, ph);   // 좌측 강조
    this.inspectLayer.push(pg);

    // 헤더 — 장소명
    this.inspectLayer.push(this.add.text(px + 24, py + 22,
      '🔍  ' + spot.name, {
      fontFamily: FONT_TITLE, fontSize: '20px', color: '#ffe9b8',
      fontStyle: 'bold'
    }).setDepth(3402));

    // 본문
    this.inspectLayer.push(this.add.text(px + 24, py + 60, spot.text, {
      fontFamily: FONT, fontSize: '14px', color: '#e6efff',
      wordWrap: { width: pw - 48 }, lineSpacing: 5
    }).setDepth(3402));

    // 단서 영역
    let y = py + 60 + 84;
    if (spot.evidence) {
      const ev = spot.evidence;
      // 구분선
      const div = this.add.graphics().setDepth(3402);
      div.lineStyle(1, 0x2a5a82, 0.6);
      div.lineBetween(px + 24, y, px + pw - 24, y);
      this.inspectLayer.push(div);
      y += 14;

      // 단서명 + 상태
      const evHeader = newlyFound
        ? ('★ 단서 입수 — ' + ev.name)
        : ('✓ 이미 수집한 단서 — ' + ev.name);
      this.inspectLayer.push(this.add.text(px + 24, y, evHeader, {
        fontFamily: FONT_TITLE, fontSize: '15px',
        color: newlyFound ? '#ffd96a' : '#7fd07f', fontStyle: 'bold'
      }).setDepth(3402));
      y += 26;

      // 영역 배지 (인지/정서/행동)
      const area = (typeof getArea === 'function') ? getArea(ev) : null;
      if (area) {
        const aG = this.add.graphics().setDepth(3402);
        aG.fillStyle(area.color, 0.9); aG.fillRect(px + 24, y, 54, 20);
        this.inspectLayer.push(aG);
        this.inspectLayer.push(this.add.text(px + 51, y + 10, area.label, {
          fontFamily: FONT, fontSize: '11px', color: '#0a1828'
        }).setOrigin(0.5).setDepth(3403));
        y += 26;
      }

      // 단서 설명
      this.inspectLayer.push(this.add.text(px + 24, y, ev.desc, {
        fontFamily: FONT, fontSize: '13px', color: '#cfe9ff',
        wordWrap: { width: pw - 48 }, lineSpacing: 5, fontStyle: 'italic'
      }).setDepth(3402));
    }

    // 확인 버튼
    const bnX = px + pw / 2, bnY = py + ph - 32;
    const bnW = 140, bnH = 38;
    const bg = this.add.graphics().setDepth(3402);
    const drawBn = (h) => {
      bg.clear();
      bg.fillStyle(h ? 0x5c4718 : 0x352910, 1);
      bg.fillRoundedRect(bnX - bnW/2, bnY - bnH/2, bnW, bnH, 8);
      bg.lineStyle(2, 0xe8b86a, 1);
      bg.strokeRoundedRect(bnX - bnW/2, bnY - bnH/2, bnW, bnH, 8);
    };
    drawBn(false);
    const bnTxt = this.add.text(bnX, bnY, '확인', {
      fontFamily: FONT, fontSize: '15px', color: '#ffe9b8'
    }).setOrigin(0.5).setDepth(3403);
    const bnZone = this.add.zone(bnX, bnY, bnW, bnH)
      .setInteractive({ useHandCursor: true }).setDepth(3404);
    bnZone.on('pointerover', () => drawBn(true));
    bnZone.on('pointerout',  () => drawBn(false));
    bnZone.on('pointerdown', () => this.closeInspectPopup());
    this.inspectLayer.push(bg, bnTxt, bnZone);

    // dim 클릭 닫기는 제거 -- 학생이 부주의 클릭으로 단서를 못 읽고 넘어가는
    // 문제 방지(이문호 교사 피드백). 반드시 [확인] 버튼만으로 닫음.
    dim.on('pointerdown', () => { /* no-op: 단서 패널 클릭 방어 */ });
    // ESC 단축키
    this.inspectEscHandler = () => {
      if (this.inspectOpen) this.closeInspectPopup();
    };
    this.input.keyboard.once('keydown-ESC', this.inspectEscHandler);
  }

  // 이 장소의 단서를 모두 찾았을 때 화면 가운데 큰 배너 (학생이 이동 결심하도록)
  // intro 전용 — UN 본부 사무실 배경 (사진 자산이 없을 때 graphics로 직접 그림)
  // spot 좌표(cases.js intro.office): 책상 80~300, 지도 340~580, 서류함 620~840 (y 120~340)
  drawHQOfficeBg() {
    const g = this.add.graphics().setDepth(0);
    // 뒷벽 (UN 블루) + 마룻바닥
    g.fillStyle(0x1a3a5c, 1); g.fillRect(0, 0, BG_W, 200);
    g.fillStyle(0x5a3f22, 1); g.fillRect(0, 200, BG_W, BG_H - 200);
    // 마룻바닥 결
    g.lineStyle(1, 0x3a2410, 0.6);
    for (let i = 0; i < 6; i++) g.lineBetween(0, 200 + i * 45, BG_W, 200 + i * 45);
    // 걸레받이
    g.fillStyle(0x3a2410, 1); g.fillRect(0, 195, BG_W, 8);

    // 큰 창문 (가운데 위)
    g.fillStyle(0x0a1828, 1); g.fillRect(BG_W / 2 - 70, 30, 140, 130);
    g.lineStyle(4, 0xc9a36b, 1); g.strokeRect(BG_W / 2 - 70, 30, 140, 130);
    g.lineStyle(2, 0xc9a36b, 1);
    g.lineBetween(BG_W / 2, 30, BG_W / 2, 160);
    g.lineBetween(BG_W / 2 - 70, 95, BG_W / 2 + 70, 95);
    // 도시 실루엣
    g.fillStyle(0x122842, 1);
    for (let i = 0; i < 10; i++) {
      const sw = 6 + (i * 7) % 12, sh = 22 + (i * 19) % 60;
      g.fillRect(BG_W / 2 - 66 + i * 13, 160 - sh, sw, sh);
    }
    g.fillStyle(0xffe082, 0.75);
    for (let i = 0; i < 14; i++) {
      g.fillRect(BG_W / 2 - 64 + (i * 13) % 124, 55 + (i * 17) % 90, 2, 2);
    }

    // 디렉터 책상 (좌측, 책상 위에 종이·노트북 — spot: 80~300, y 120~340)
    g.fillStyle(0x6a4f2a, 1); g.fillRect(80, 220, 220, 100);
    g.lineStyle(4, 0x3a2410, 1); g.strokeRect(80, 220, 220, 100);
    g.fillStyle(0x4a3a22, 1); g.fillRect(90, 310, 18, 30); g.fillRect(272, 310, 18, 30);
    // 책상 위 — 노트북·서류 더미·머그
    g.fillStyle(0x1a1a2e, 1); g.fillRect(100, 240, 70, 44);
    g.fillStyle(0x5b92e5, 1); g.fillRect(104, 244, 62, 36);
    g.fillStyle(0xfff8d0, 1); g.fillRect(180, 244, 78, 36);
    g.lineStyle(2, 0x3a2410, 1); g.strokeRect(180, 244, 78, 36);
    g.fillStyle(0xa0282e, 1); g.fillRect(266, 250, 22, 28);
    // 빨간 봉인 도장이 찍힌 종이 (책상 위 임무서)
    g.fillStyle(0xff3a3a, 1); g.fillCircle(218, 262, 5);
    this.add.text(190, 200, '📋 한센의 책상', {
      fontFamily: FONT, fontSize: '11px', color: '#ffe082',
      backgroundColor: '#00000088', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(1);

    // 세계지도 (가운데, 벽에 걸린 보드 — spot: 340~580, y 120~340)
    g.fillStyle(0x3a2410, 1); g.fillRect(340, 220, 240, 130);
    g.lineStyle(4, 0x1a1008, 1); g.strokeRect(340, 220, 240, 130);
    g.fillStyle(0xefe6cc, 1); g.fillRect(350, 230, 220, 110);
    // 대륙 추상
    g.fillStyle(0x6a8a6a, 1);
    g.fillRect(362, 246, 36, 18); g.fillRect(402, 240, 32, 28);
    g.fillRect(442, 252, 26, 14); g.fillRect(476, 246, 36, 22);
    g.fillRect(520, 252, 30, 22);
    g.fillRect(362, 282, 28, 22); g.fillRect(398, 290, 36, 16);
    g.fillRect(442, 282, 30, 22); g.fillRect(480, 286, 32, 18);
    g.fillRect(520, 290, 32, 14);
    // 빨간 핀 (3분쟁)
    g.fillStyle(0xff3a3a, 1);
    g.fillCircle(450, 250, 4); g.fillCircle(488, 258, 4); g.fillCircle(522, 264, 4);
    this.add.text(460, 200, '🗺 세계 분쟁 지도', {
      fontFamily: FONT, fontSize: '11px', color: '#ffe082',
      backgroundColor: '#00000088', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(1);

    // 서류함 (우측 — spot: 620~840, y 120~340)
    g.fillStyle(0x3a4a5a, 1); g.fillRect(620, 220, 220, 200);
    g.lineStyle(4, 0x1a2a3a, 1); g.strokeRect(620, 220, 220, 200);
    // 4단 서랍
    for (let i = 0; i < 4; i++) {
      const dy = 232 + i * 46;
      g.lineStyle(2, 0x1a2a3a, 1);
      g.strokeRect(632, dy, 196, 38);
      g.fillStyle(0xc9a36b, 1);
      g.fillCircle(730, dy + 19, 4);
      // 라벨 자리 (작은 흰 띠)
      g.fillStyle(0xefefef, 0.8);
      g.fillRect(648, dy + 12, 50, 14);
    }
    this.add.text(730, 200, '🗄 과거 사건 파일함', {
      fontFamily: FONT, fontSize: '11px', color: '#ffe082',
      backgroundColor: '#00000088', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(1);
  }

  showLocCompleteBanner() {
    const dim = this.add.graphics().setDepth(28);
    dim.fillStyle(0x0c3528, 0.85);
    dim.fillRoundedRect(180, 380, 600, 70, 12);
    dim.lineStyle(2, 0x7fd07f, 1);
    dim.strokeRoundedRect(180, 380, 600, 70, 12);
    dim.setAlpha(0);
    const t = this.add.text(480, 415,
      '✓  이 장소의 단서를 모두 찾았어요!\n[이동한다] 버튼으로 다음 장소로 이동해 보세요.', {
      fontFamily: FONT_TITLE, fontSize: '15px', color: '#dfffe0',
      align: 'center', lineSpacing: 4
    }).setOrigin(0.5).setDepth(29).setAlpha(0);
    if (window.SFX) window.SFX.play('evidence');
    this.tweens.add({
      targets: [dim, t], alpha: 1, duration: 320, ease: 'Sine.out',
      onComplete: () => {
        this.time.delayedCall(2800, () => {
          this.tweens.add({
            targets: [dim, t], alpha: 0, duration: 320,
            onComplete: () => { dim.destroy(); t.destroy(); }
          });
        });
      }
    });
    // 이동 버튼 라벨에 ✓ 표시 + 살짝 펄스
    if (this.btnMove && this.btnMove.t) {
      this.btnMove.t.setText('이동한다  ✓');
      this.btnMove.t.setColor('#7fd07f');
    }
  }

  closeInspectPopup() {
    if (!this.inspectOpen) return;
    this.inspectLayer.forEach(o => { if (o && o.destroy) o.destroy(); });
    this.inspectLayer = null;
    this.inspectOpen = false;
    const nf = this.inspectNewlyFound;
    this.inspectNewlyFound = null;
    // 감정 입력 모달 호출 정책 변경(이문호 교사 피드백):
    //   "단서마다 표현하면 10개. 맵마다 표현하면 3개" → 장소별 1회로 통합.
    //   이 장소(locId)의 모든 단서를 다 모았을 때만 종합 감정 입력 모달.
    if (nf) {
      const loc = CASE.locations[this.locId];
      const locEvs = loc.spots.filter(s => s.evidence).map(s => s.evidence);
      const allLocCollected = locEvs.length > 0 &&
        locEvs.every(ev => this.collected.find(c => c.id === ev.id));
      const locTags = this.registry.get('locationTags') || {};
      const alreadyWrote = !!locTags[this.locId];
      if (allLocCollected && !alreadyWrote) {
        this.time.delayedCall(320, () =>
          this.askLocationThoughtTag(this.locId, locEvs));
      }
    }
    // 모든 단서 수집 완료 시 하단 안내 갱신
    if (this.collected.length >= this.totalEvidence()) {
      this.msg.setText('★ 모든 단서를 모았습니다! (총 ' + this.collected.length + '개)');
    }
  }

  // 장소별 종합 감정 입력 — 이문호 교사 피드백 반영(단서별 10회 → 장소별 3회).
  //   좌측에 그 장소에서 모은 단서 목록 표시 + 우측 안내 → HTML 입력 모달.
  //   저장 키: locationTags[locId] + evidenceTags 에도 복제(보고서·기록 모달 호환).
  askLocationThoughtTag(locId, evs) {
    if (this.thoughtOpen) return;
    this.thoughtOpen = true;
    const loc = CASE.locations[locId];
    const close = () => { this.thoughtOpen = false; };
    const proceed = (text) => {
      const trimmed = (text || '').trim().slice(0, 150);
      if (trimmed.length > 0) {
        // 장소별 + 단서별 모두 저장(보고서·단서 기록 모달 호환)
        const locTags = this.registry.get('locationTags') || {};
        locTags[locId] = { id: 'custom', label: trimmed };
        this.registry.set('locationTags', locTags);
        const evTags = this.registry.get('evidenceTags') || {};
        evs.forEach(ev => {
          if (!evTags[ev.id]) evTags[ev.id] = { id: 'custom', label: trimmed };
        });
        this.registry.set('evidenceTags', evTags);
        if (typeof reportProgress === 'function') reportProgress(this);
      }
      close();
    };
    if (window.PEACE && typeof window.PEACE.openTextInputModal === 'function') {
      // 노트형 모달 — 왼쪽 "모아둔 단서 종이" + 오른쪽 "든 생각 메모" (이문호 교사 피드백)
      const clues = evs.map(ev => {
        const ai = (typeof getArea === 'function') ? getArea(ev) : null;
        return {
          name: ev.name, desc: ev.desc,
          areaLabel: ai ? ai.label : '',
          areaColor: ai ? ('#' + ai.color.toString(16).padStart(6, '0')) : ''
        };
      });
      window.PEACE.openTextInputModal({
        title: '📓 ' + loc.name + ' — 조사 노트',
        subtitle: '왼쪽 단서들을 보고, 오른쪽에 든 생각을 적어보세요 (선택 입력)',
        placeholder: '예: 면화 한 송이를 위해 큰 바다가 사라졌다는 게 충격적이다.',
        maxLength: 150,
        initial: '',
        clues: clues,
        onCancel: close
      }, proceed);
    } else {
      close();
    }
  }

  // 자기조절학습의 "자기 모니터링" — 단서별 학생 자유 입력 생각·소감
  // (이전엔 5지선다 감정 태그였으나 학생이 자유롭게 타이핑하는 방식으로 전환)
  // [현재 직접 호출되지 않음 — askLocationThoughtTag로 통합. 코드 보존만.]
  askThoughtTag(evidence) {
    if (this.thoughtOpen) return;
    this.thoughtOpen = true;

    const layer = [];
    const dim = this.add.rectangle(480, 300, 960, 600, 0x000000, 0.65)
      .setDepth(3500).setInteractive();
    layer.push(dim);

    const px = 180, py = 210, pw = 600, ph = 180;
    const pg = this.add.graphics().setDepth(3501);
    pg.fillStyle(0x10202e, 1); pg.fillRect(px, py, pw, ph);
    pg.lineStyle(3, 0xc9a36b, 1); pg.strokeRect(px, py, pw, ph);
    layer.push(pg);

    layer.push(this.add.text(480, py + 26, '💭  이 단서에 대한 내 생각', {
      fontFamily: FONT_TITLE, fontSize: '17px', color: '#ffe9b8',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3502));
    layer.push(this.add.text(480, py + 60, '【 ' + evidence.name + ' 】', {
      fontFamily: FONT, fontSize: '13px', color: '#cfe9ff'
    }).setOrigin(0.5).setDepth(3502));
    layer.push(this.add.text(480, py + 100,
      '잠시 후 입력창이 뜹니다 —\n한 문장으로 자유롭게 적어주세요 (선택 입력)', {
      fontFamily: FONT, fontSize: '12px', color: '#a8c4dc',
      align: 'center', lineSpacing: 4
    }).setOrigin(0.5).setDepth(3502));

    const close = () => {
      layer.forEach(o => { if (o && o.destroy) o.destroy(); });
      this.thoughtOpen = false;
    };

    // 약간의 안내 시간 후 HTML 모달 — 모바일 prompt 차단 문제 회피
    this.time.delayedCall(400, () => {
      const proceed = (text) => {
        const trimmed = (text || '').trim().slice(0, 100);
        if (trimmed.length > 0) {
          const tags = this.registry.get('evidenceTags') || {};
          tags[evidence.id] = { id: 'custom', label: trimmed };
          this.registry.set('evidenceTags', tags);
        }
        close();
      };
      if (window.PEACE && typeof window.PEACE.openTextInputModal === 'function') {
        window.PEACE.openTextInputModal({
          title: '💭 이 단서에 대한 내 생각',
          subtitle: '【 ' + evidence.name + ' 】<br>한 문장으로 자유롭게 (선택 입력)',
          placeholder: '예: 충격적이다 — 면화 한 송이에 이렇게 많은 물이…',
          maxLength: 100,
          initial: ''
        }, proceed);
      } else {
        // 폴백 — 모달 없으면 그냥 닫음 (멈춤 방지)
        close();
      }
    });
  }

  totalEvidence() {
    let n = 0;
    Object.values(CASE.locations).forEach(l =>
      l.spots.forEach(s => { if (s.evidence) n++; }));
    return n;
  }

  flash(label) {
    const t = this.add.text(480, 230, label, {
      fontFamily: FONT_TITLE, fontSize: '34px', color: '#ffe082',
      stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: t, scale: 1.4, alpha: 0, duration: 1100,
      onComplete: () => t.destroy()
    });
  }

  showMoves(loc) {
    if (this.examine) this.toggleExamine();
    this.clearOverlay();
    this.msg.setText('어디로 이동할까?');
    const theme = {
      base: 0x1c3344, hover: 0x2c5066,
      edge: 0x6fb7d6, text: '#dff1ff'
    };
    loc.moves.forEach((m, i) => {
      const y = 478 + i * 48;
      const b = fancyButton(this, 480, y, 380, 40, '▶  ' + m.label, () => {
        this.registry.set('invLoc', m.to);
        this.scene.restart();
      }, theme);
      b.g.setDepth(7); b.zone.setDepth(8); b.t.setDepth(8);
      this.overlay.push(b.g, b.zone, b.t);
    });
  }

  showRecord() {
    if (this.examine) this.toggleExamine();
    this.clearOverlay();
    // 화면 전체 어둡게 — 명령 바·맵까지 비활성화 효과
    const bg = this.add.rectangle(480, 300, 960, 600, 0x000000, 0.78)
      .setDepth(30).setInteractive();
    this.overlay.push(bg);
    // 가운데 패널 — 모달 콘텐츠 영역(명령 바 위에 깔끔히 얹힘)
    const PX = 60, PY = 36, PW = 840, PH = 528;
    const panel = this.add.graphics().setDepth(31);
    panel.fillStyle(0x0e1626, 1);
    panel.fillRoundedRect(PX, PY, PW, PH, 16);
    panel.lineStyle(2, 0xe8b86a, 1);
    panel.strokeRoundedRect(PX, PY, PW, PH, 16);
    this.overlay.push(panel);
    // 타이틀 박스 — 패널 상단 가운데
    const tp = this.add.graphics().setDepth(32);
    tp.fillStyle(0x101a26, 1); tp.fillRoundedRect(330, 60, 300, 46, 12);
    tp.lineStyle(2, 0xe8b86a, 1); tp.strokeRoundedRect(330, 60, 300, 46, 12);
    const title = this.add.text(480, 83, '📘  수집한 단서', {
      fontFamily: FONT_TITLE, fontSize: '23px', color: '#ffe9b8',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(33);
    this.overlay.push(tp, title);

    if (this.collected.length === 0) {
      // 빈 상태 — 안내 아이콘 + 두 줄 안내
      this.overlay.push(this.add.text(480, 260, '🔎', {
        fontFamily: FONT, fontSize: '64px'
      }).setOrigin(0.5).setDepth(32));
      this.overlay.push(this.add.text(480, 340,
        '아직 모은 단서가 없습니다.', {
          fontFamily: FONT_TITLE, fontSize: '22px', color: '#ffe9b8'
        }).setOrigin(0.5).setDepth(32));
      this.overlay.push(this.add.text(480, 380,
        '명령 바의 [조사한다]를 눌러 돋보기로 노란 표지판을 조사하세요.', {
          fontFamily: FONT, fontSize: '14px', color: '#9fb5d2'
        }).setOrigin(0.5).setDepth(32));
    } else {
      // 장소(맵)별 그룹화 — 이문호 교사 피드백 반영
      //   각 장소 헤더 + 그 장소 종합 감정(있을 때) + 단서 한 줄당 하나(●)
      const locTags = this.registry.get('locationTags') || {};
      let curY = 128;
      Object.entries(CASE.locations).forEach(([lid, loc]) => {
        const locEvs = loc.spots
          .filter(s => s.evidence &&
            this.collected.find(c => c.id === s.evidence.id))
          .map(s => s.evidence);
        if (locEvs.length === 0) return;
        // 장소 헤더
        this.overlay.push(this.add.text(80, curY,
          '📍  ' + loc.name + '   (' + locEvs.length + '개)', {
          fontFamily: FONT_TITLE, fontSize: '15px', color: '#ffd96a',
          fontStyle: 'bold'
        }).setDepth(32));
        curY += 22;
        // 장소 종합 감정 (있을 때)
        if (locTags[lid]) {
          this.overlay.push(this.add.text(98, curY,
            '💭 ' + locTags[lid].label, {
            fontFamily: FONT, fontSize: '12px', color: '#9fb5d2',
            wordWrap: { width: 720 }, lineSpacing: 3, fontStyle: 'italic'
          }).setDepth(32));
          curY += 22;
        }
        // 단서 1열 한 줄당 — ● 이름 — 짧은 설명
        locEvs.forEach(e => {
          const ai = getArea(e);
          // 영역 배지 (없으면 ● 만)
          if (ai) {
            const tg = this.add.graphics().setDepth(32);
            tg.fillStyle(ai.color, 1); tg.fillRect(98, curY + 2, 36, 16);
            this.overlay.push(tg);
            this.overlay.push(this.add.text(116, curY + 10, ai.label, {
              fontFamily: FONT, fontSize: '10px', color: '#0a1828',
              fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(33));
          }
          // 단서명 + 한 줄 설명
          this.overlay.push(this.add.text(ai ? 144 : 98, curY,
            '● ' + e.name + '  —  ' + e.desc, {
            fontFamily: FONT, fontSize: '12px', color: '#cfe9ff',
            wordWrap: { width: ai ? 720 : 760 }, lineSpacing: 2
          }).setDepth(32));
          curY += 22;
        });
        curY += 10;   // 장소 간 여백
      });
    }
    // 닫기 버튼 — 패널 안 하단 가운데, fancyButton 스타일로 통일
    const done = () => this.clearOverlay();
    const closeBtn = fancyButton(this, 480, 530, 200, 46, '✕  닫기', done, {
      base: 0x352910, hover: 0x5c4718, edge: 0xe8b86a, text: '#ffe9b8'
    });
    closeBtn.g.setDepth(33); closeBtn.zone.setDepth(34); closeBtn.t.setDepth(34);
    this.overlay.push(closeBtn.g, closeBtn.zone, closeBtn.t);
    // 배경 클릭으로도 닫기 (단, 패널 내부는 닫지 않음)
    bg.on('pointerdown', done);
  }

  clearOverlay() {
    this.overlay.forEach(o => o.destroy());
    this.overlay = [];
  }

  leave() {
    this.scene.start('WorldScene');
  }

  update() {
    if (this.examine) {
      const p = this.input.activePointer;
      this.glass.setPosition(p.x + 14, p.y + 14);
      this.glass.setVisible(p.y < BG_H);
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  시민 퀴즈 (QuizScene)
//  — 게임 루프 [3·4단계]: 시민 대화 → 문제 풀이 → 핵심 단서
// ══════════════════════════════════════════════════════════════
class QuizScene extends Phaser.Scene {
  constructor() { super('QuizScene'); }

  create() {
    if (window.SFX) {
      window.SFX.play('talk');   // 시민 인터뷰 시작
      window.SFX.pauseBGM();     // 맵 BGM 일시정지 (대화 후 이어듣기)
    }
    const id = this.registry.get('quizCitizenId');
    this.citizen = CITIZENS.find(c => c.id === id);
    if (!this.citizen) {
      this.scene.stop();
      this.scene.resume('WorldScene');
      return;
    }
    this.mode = 'intro';
    this.lineIdx = 0;
    this.locked = false;

    // 월드 위 오버레이 (배경 없음)
    this.add.rectangle(480, 300, 960, 600, 0x000000, 0.5);

    // 좌측 큰 NPC 초상 — portrait 일러스트 우선, 없으면 도트 스프라이트 확대
    const hasPortrait = this.citizen.portrait && this.textures.exists(this.citizen.portrait);
    if (hasPortrait) {
      // 캐릭터를 크게 그려 머리·어깨가 화면 위에 보이도록, 하단은 마스크로 가려 상반신 컷
      this.portrait = this.add.image(140, 20, this.citizen.portrait)
        .setOrigin(0.5, 0).setDepth(5);
      const tex = this.textures.get(this.citizen.portrait).getSourceImage();
      // 전신 표시 높이 ~ 720px. 위 ~55% 가 보이고 나머지는 마스크로 잘림
      this.portrait.setScale(720 / tex.height);
      // 대화창(상단 y≈425) 위쪽까지만 보이게 마스크
      const maskShape = this.make.graphics({ add: false });
      maskShape.fillStyle(0xffffff);
      maskShape.fillRect(0, 0, 960, 420);
      this.portrait.setMask(maskShape.createGeometryMask());
      this.tweens.add({
        targets: this.portrait, y: 18, duration: 900,
        yoyo: true, repeat: -1, ease: 'Sine.inOut'
      });
    } else {
      this.portrait = this.add.sprite(160, 410, this.citizen.sprite, this.citizen.frame)
        .setOrigin(0.5, 1).setScale(12).setDepth(5);
      this.tweens.add({
        targets: this.portrait, y: 405, duration: 900,
        yoyo: true, repeat: -1, ease: 'Sine.inOut'
      });
    }

    // 우상단 — 인터뷰 도중 빠져나가기 (월드로 복귀)
    fancyButton(this, 880, 30, 130, 36, '← 닫기',
      () => this.bailOut(),
      { base: 0x3a2410, hover: 0x5c4718, edge: 0xe8b86a, text: '#ffe9b8' });
    // 단서 확인 — 이문호 교사 피드백: 퀴즈 힌트가 단서를 가리키니
    // 모은 단서를 다시 열람할 수 있어야 교육적. 좌측 닫기 옆에 배치.
    fancyButton(this, 730, 30, 150, 36, '📘 단서 확인',
      () => this.showCluesPanel(),
      { base: 0x14304a, hover: 0x1f4868, edge: 0x6fb7d6, text: '#dff1ff' });

    // 하단 대사 박스
    panel(this, 480, 510, 940, 170, 0x0c1620, 0xe8b86a);
    this.nameText = this.add.text(54, 438, '[' + this.citizen.name + ']', {
      fontFamily: FONT_TITLE, fontSize: '20px', color: '#ffd96a',
      fontStyle: 'bold'
    }).setOrigin(0, 0);

    this.bodyText = this.add.text(54, 472, '', {
      fontFamily: FONT, fontSize: '18px', color: '#f3ece0',
      wordWrap: { width: 860 }, lineSpacing: 6
    });

    this.hint = this.add.text(910, 578, '▼', {
      fontFamily: FONT, fontSize: '18px', color: '#e8b86a'
    }).setOrigin(1, 1);
    this.tweens.add({
      targets: this.hint, alpha: 0.3, duration: 600,
      yoyo: true, repeat: -1
    });

    this.choiceObjs = [];
    // 진입 직후 입력 잠금 (트리거 클릭/키 흘러듦 방지)
    this.inputLocked = true;
    this.time.delayedCall(350, () => { this.inputLocked = false; });

    this.input.on('pointerdown', () => this.onClick());
    this.input.keyboard.on('keydown-SPACE', () => this.onClick());

    this.showIntroLine();
  }

  // 타자기 효과 헬퍼 — 한 글자씩 출력, 클릭 시 즉시 완료
  typeText(text, onComplete) {
    if (this.typeTimer) { this.typeTimer.remove(); this.typeTimer = null; }
    this.fullText = text;
    this.onTypeComplete = onComplete || null;   // skip 시에도 호출되도록 보관
    this.bodyText.setText('');
    this.typing = true;
    this.hint.setVisible(false);
    let i = 0;
    this.typeTimer = this.time.addEvent({
      delay: 28,
      repeat: text.length - 1,
      callback: () => {
        i++;
        this.bodyText.setText(text.slice(0, i));
        if (i >= text.length) this.finishTyping();
      }
    });
  }

  // 타자기 종료 처리 — 자연 완료/건너뛰기 공통. onComplete 보장 호출
  finishTyping() {
    if (this.typeTimer) { this.typeTimer.remove(); this.typeTimer = null; }
    this.typing = false;
    this.hint.setVisible(true);
    const cb = this.onTypeComplete;
    this.onTypeComplete = null;
    if (cb) cb();
  }

  // 타자기 즉시 완료 (클릭 건너뛰기)
  skipTyping() {
    if (!this.typing) return false;
    this.bodyText.setText(this.fullText);
    // 같은 클릭으로 다음 줄까지 넘어가지 않도록 짧은 락
    this.inputLocked = true;
    this.time.delayedCall(180, () => { this.inputLocked = false; });
    this.finishTyping();   // ← 보기 버튼 생성 등 콜백 보장
    return true;
  }

  showIntroLine() {
    const lines = this.citizen.intro;
    this.typeText(lines[this.lineIdx]);
  }

  onClick() {
    if (this.inputLocked) return;
    if (this.cluesOpen) return;   // 단서 열람 모달 중에는 글로벌 클릭 무시
    // 타자기 중이면 건너뛰기 (오답 피드백도 즉시 표시 후 클릭 대기)
    if (this.skipTyping()) return;
    // 오답 피드백 후 클릭 → 문제 재출제 (학생 자율 진행)
    if (this.mode === 'wrong') {
      this.mode = 'question';
      this.showQuestion();
      return;
    }
    if (this.locked) return;
    if (this.mode === 'intro') {
      this.lineIdx++;
      if (this.lineIdx < this.citizen.intro.length) {
        this.showIntroLine();
      } else {
        this.mode = 'question';
        this.showQuestion();
      }
    }
  }

  showQuestion() {
    const q = this.citizen.quiz;
    // 문제·힌트 타자기로 출력 후, 끝나면 보기 버튼 표시
    this.clearChoices();
    this.typeText('【문제】 ' + q.question + '\n\n💡 힌트: ' + q.hint, () => {
      q.choices.forEach((ch, i) => {
        const y = 130 + i * 60;
        const b = fancyButton(this, 580, y, 600, 48,
          String.fromCharCode(65 + i) + ') ' + ch.text,
          () => this.pickAnswer(i),
          { base: 0x1c3344, hover: 0x2c5066, edge: 0x6fb7d6, text: '#dff1ff' });
        this.choiceObjs.push(b.g, b.zone, b.t);
      });
    });
  }

  clearChoices() {
    this.choiceObjs.forEach(o => o.destroy());
    this.choiceObjs = [];
  }

  pickAnswer(idx) {
    if (this.locked || this.typing) return;
    const ch = this.citizen.quiz.choices[idx];
    if (ch.correct) this.handleCorrect(ch);
    else this.handleWrong(ch);
  }

  handleWrong(ch) {
    this.clearChoices();
    this.mode = 'wrong';   // 클릭 대기 모드 (학생 자율 진행)
    if (window.SFX) window.SFX.play('fail');
    // 타자기 출력 후 학생이 클릭(또는 SPACE)할 때까지 대기 → 문제 재출제
    this.typeText(
      '【오답】 ' + ch.feedback +
      '\n\n다시 한 번 생각해 봐요...\n\n(클릭하여 계속)'
    );
  }

  handleCorrect(ch) {
    this.locked = true;
    this.clearChoices();
    if (window.SFX) window.SFX.play('success');
    const reward = this.citizen.quiz.reward;

    const core = this.registry.get('coreClues') || [];
    if (!core.find(c => c.id === reward.id)) {
      core.push(reward);
      this.registry.set('coreClues', core);
    }
    const solved = this.registry.get('quizSolved') || {};
    solved[this.citizen.id] = true;
    this.registry.set('quizSolved', solved);

    const flash = this.add.text(480, 230, '★ 핵심 단서 ★', {
      fontFamily: FONT_TITLE, fontSize: '36px', color: '#ffe082',
      stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({
      targets: flash, scale: 1.5, alpha: 0, duration: 1400,
      onComplete: () => flash.destroy()
    });

    const have = (this.registry.get('coreClues') || []).length;
    const caseId = this.registry.get('caseId') || 'aralsea';
    const isIntroCase = (caseId === 'intro');

    // 타자기 완료 후 → 진행도 표시 → 잠시 후 마을 복귀
    this.typeText('【정답!】 ' + ch.feedback +
      '\n\n★ 핵심 단서 획득: ' + reward.name +
      '\n   "' + reward.desc + '"', () => {
      this.time.delayedCall(900, () => {
        // intro(튜토리얼)는 단순화 흐름 — 제임스 정답 시 자동 완료
        if (isIntroCase) {
          this.bodyText.setText('🎓  신입 교육 완료!\n' +
            '   P.E.A.C.E. 5단계를 모두 익혔습니다.\n' +
            '   본 임무 세 가지가 잠금 해제되었어요.');
          // 자동 완료 처리 — completedCases에 intro 추가
          const completed = this.registry.get('completedCases') || [];
          if (!completed.includes('intro')) {
            completed.push('intro');
            this.registry.set('completedCases', completed);
          }
          this.registry.set('reflectionDone', true);
          this.registry.set('reportSent', true);
          this.registry.set('stage', 4);
          if (typeof reportProgress === 'function') reportProgress(this);
          this.time.delayedCall(2200, () => {
            // QuizScene 자체 camera로 fadeOut (활성 상태라 작동 확실)
            // → fade 완료 후 WorldScene 정리 + CaseSelectScene 진입
            const finish = () => {
              try { this.scene.stop('WorldScene'); } catch (e) {}
              this.scene.start('CaseSelectScene');
            };
            if (this.cameras && this.cameras.main) {
              this.cameras.main.fadeOut(320, 0, 0, 0);
              this.cameras.main.once('camerafadeoutcomplete', finish);
              // 안전 폴백 — fade 이벤트 못 받아도 600ms 후 강제 전환
              this.time.delayedCall(600, () => {
                if (this.scene && this.scene.isActive && this.scene.isActive('QuizScene')) {
                  finish();
                }
              });
            } else {
              finish();
            }
          });
          return;
        }
        // 본 사건 — 기존 흐름
        this.bodyText.setText('핵심 단서 ' + have + '/' + TOTAL_CITIZENS +
          (have >= TOTAL_CITIZENS ?
            '   모두 모았어요! 우편함으로 가보세요.' :
            '   아직 시민이 더 있어요.'));
        this.time.delayedCall(1400, () => {
          this.scene.stop();
          this.scene.resume('WorldScene');
        });
      });
    });
  }

  // 단서 열람 모달 — 이문호 교사 피드백: 퀴즈 힌트가 단서를 가리키므로
  // 인터뷰 중 모은 단서를 다시 볼 수 있어야 교육적. 장소별 그룹화 표시.
  showCluesPanel() {
    if (this.cluesOpen) return;
    this.cluesOpen = true;
    const collected = this.registry.get('evidence') || [];
    const locTags = this.registry.get('locationTags') || {};
    const layer = [];

    // 화면 전체 어둡게
    const dim = this.add.rectangle(480, 300, 960, 600, 0x000000, 0.82)
      .setDepth(3500).setInteractive();
    layer.push(dim);
    // 가운데 패널
    const PX = 60, PY = 36, PW = 840, PH = 528;
    const pg = this.add.graphics().setDepth(3501);
    pg.fillStyle(0x0e1626, 1); pg.fillRoundedRect(PX, PY, PW, PH, 16);
    pg.lineStyle(2, 0xe8b86a, 1); pg.strokeRoundedRect(PX, PY, PW, PH, 16);
    layer.push(pg);
    // 타이틀 박스
    const tp = this.add.graphics().setDepth(3502);
    tp.fillStyle(0x101a26, 1); tp.fillRoundedRect(310, 60, 340, 46, 12);
    tp.lineStyle(2, 0xe8b86a, 1); tp.strokeRoundedRect(310, 60, 340, 46, 12);
    layer.push(tp);
    layer.push(this.add.text(480, 83, '📘  지금까지 모은 단서', {
      fontFamily: FONT_TITLE, fontSize: '22px', color: '#ffe9b8',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3503));

    if (collected.length === 0) {
      layer.push(this.add.text(480, 260, '🔎', {
        fontFamily: FONT, fontSize: '64px'
      }).setOrigin(0.5).setDepth(3502));
      layer.push(this.add.text(480, 340, '아직 모은 단서가 없습니다.', {
        fontFamily: FONT_TITLE, fontSize: '20px', color: '#ffe9b8'
      }).setOrigin(0.5).setDepth(3502));
      layer.push(this.add.text(480, 380,
        '먼저 현장 조사로 단서를 모은 뒤 다시 와 주세요.', {
        fontFamily: FONT, fontSize: '13px', color: '#9fb5d2'
      }).setOrigin(0.5).setDepth(3502));
    } else {
      // 장소별 그룹화 — showRecord와 동일 로직(콤팩트)
      let curY = 128;
      Object.entries(CASE.locations).forEach(([lid, loc]) => {
        const locEvs = loc.spots
          .filter(s => s.evidence &&
            collected.find(c => c.id === s.evidence.id))
          .map(s => s.evidence);
        if (locEvs.length === 0) return;
        layer.push(this.add.text(80, curY,
          '📍  ' + loc.name + '   (' + locEvs.length + '개)', {
          fontFamily: FONT_TITLE, fontSize: '15px', color: '#ffd96a',
          fontStyle: 'bold'
        }).setDepth(3502));
        curY += 22;
        if (locTags[lid]) {
          layer.push(this.add.text(98, curY,
            '💭 ' + locTags[lid].label, {
            fontFamily: FONT, fontSize: '12px', color: '#9fb5d2',
            wordWrap: { width: 720 }, lineSpacing: 3, fontStyle: 'italic'
          }).setDepth(3502));
          curY += 22;
        }
        locEvs.forEach(e => {
          const ai = (typeof getArea === 'function') ? getArea(e) : null;
          if (ai) {
            const tg = this.add.graphics().setDepth(3502);
            tg.fillStyle(ai.color, 1); tg.fillRect(98, curY + 2, 36, 16);
            layer.push(tg);
            layer.push(this.add.text(116, curY + 10, ai.label, {
              fontFamily: FONT, fontSize: '10px', color: '#0a1828',
              fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(3503));
          }
          layer.push(this.add.text(ai ? 144 : 98, curY,
            '● ' + e.name + '  —  ' + e.desc, {
            fontFamily: FONT, fontSize: '12px', color: '#cfe9ff',
            wordWrap: { width: ai ? 720 : 760 }, lineSpacing: 2
          }).setDepth(3502));
          curY += 22;
        });
        curY += 10;
      });
    }

    // 닫기 — 패널 안 하단 가운데, fancyButton
    const close = () => {
      layer.forEach(o => { if (o && o.destroy) o.destroy(); });
      this.cluesOpen = false;
      // 같은 클릭이 글로벌 onClick으로 흐르지 않도록 짧은 락
      this.inputLocked = true;
      this.time.delayedCall(220, () => { this.inputLocked = false; });
    };
    const closeBtn = fancyButton(this, 480, 530, 220, 46,
      '✕  닫고 문제 풀기', close, {
        base: 0x352910, hover: 0x5c4718, edge: 0xe8b86a, text: '#ffe9b8'
      });
    closeBtn.g.setDepth(3503); closeBtn.zone.setDepth(3504); closeBtn.t.setDepth(3504);
    layer.push(closeBtn.g, closeBtn.zone, closeBtn.t);
    // dim 클릭으로는 닫지 않음(부주의 클릭 방어)
    dim.on('pointerdown', () => { /* no-op */ });
  }

  // 사용자가 인터뷰 중간에 닫기 버튼 누름 — 상태 변경 없이 월드 복귀
  bailOut() {
    if (this.typeTimer) this.typeTimer.remove();
    this.scene.stop();
    this.scene.resume('WorldScene');
  }
}

// ══════════════════════════════════════════════════════════════
//  UN 조사 보고서 (LetterScene)
//  — UNESCO 세계시민교육 "행동적 역량" 단계
//  — 조사로 모은 단서 + 학생의 다짐을 모아 편지로 출력
// ══════════════════════════════════════════════════════════════
class LetterScene extends Phaser.Scene {
  constructor() { super('LetterScene'); }

  create() {
    setCfgBarVisible(false);
    this.cameras.main.fadeIn(220, 0, 0, 0);  // 부드러운 진입
    this.collected = this.registry.get('evidence') || [];
    this.mode = 'compose'; // compose | preview | sent

    // 선택 상태
    this.recipient = 0; // 0=UN환경계획, 1=유네스코, 2=환경부
    this.factPicks = new Set(); // 증거 id (최대 3개)
    this.pledgePicks = new Set(); // 다짐 인덱스 (최대 3개)

    // 사건별 보낼 곳·다짐 — 통합 LETTER_TEMPLATES에서 가져옴 (헤더·권고도 같이 사용)
    this.tmpl = getLetterTemplate(this.registry);
    this.RECIPIENTS = this.tmpl.recipients;
    this.PLEDGES = this.tmpl.pledges;

    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.buildCompose();
  }

  // 모든 자식 객체 정리
  clearAll() {
    this.children.removeAll(true);
  }

  // ── 작성 화면 ─────────────────────────────────────────────
  buildCompose() {
    this.mode = 'compose';
    this.clearAll();

    // 배경: 양피지 패널
    panel(this, 480, 300, 940, 580, 0xefe6cc, 0x6a4f2a);
    // 헤더 띠
    const hdr = this.add.graphics().setDepth(2);
    hdr.fillStyle(0x6a4f2a, 1); hdr.fillRect(20, 24, 920, 50);
    this.add.text(480, 49, '📋  UN 조사 보고서 작성', {
      fontFamily: FONT_TITLE, fontSize: '24px', color: '#ffe9b8', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // 단계 progress 표시 — 1.단서 → 2.다짐 → 3.검토 (3단계)
    // (받는 곳 선택은 제거됨 — 사건별 기본 수신처 자동 사용)
    const stages = [
      { n: 1, label: '단서', done: this.factPicks.size > 0 },
      { n: 2, label: '다짐', done: this.pledgePicks.size > 0 },
      { n: 3, label: '검토', done: false },
    ];
    const stepY = 84;
    // 3개 progress 가운데 정렬: 가운데 480, 간격 180 → 300, 480, 660
    stages.forEach((s, i) => {
      const x = 300 + i * 180;
      const colorBg = s.done ? 0x2e6b58 : 0x4a3a22;
      const colorText = s.done ? '#ffffff' : '#c9a36b';
      const cg = this.add.graphics().setDepth(3);
      cg.fillStyle(colorBg, 0.92); cg.fillRoundedRect(x - 70, stepY - 12, 140, 24, 12);
      cg.lineStyle(2, s.done ? 0xffd96a : 0x6a4f2a, 1);
      cg.strokeRoundedRect(x - 70, stepY - 12, 140, 24, 12);
      this.add.text(x, stepY, s.n + '. ' + s.label + (s.done ? '  ✓' : ''), {
        fontFamily: FONT, fontSize: '12px', color: colorText, fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(4);
      if (i < stages.length - 1) {
        this.add.text(x + 90, stepY, '→', {
          fontFamily: FONT_TITLE, fontSize: '16px',
          color: s.done ? '#ffd96a' : '#6a4f2a'
        }).setOrigin(0.5).setDepth(4);
      }
    });

    // ── 단서·다짐 좌우 분할 (받는 곳 섹션 제거로 위로 이동) ──
    // 1) 알게 된 사실 — 좌측 칼럼 (40~460)
    const FACT_X = 40, FACT_LIST_X = 70, FACT_W = 380, FACT_Y0 = 168, ROW_H = 26;
    this.sectionLabel(FACT_X, 138, '1. 내가 알게 된 사실 (최대 3개 선택)');
    if (this.collected.length === 0) {
      this.add.text(FACT_LIST_X, FACT_Y0, '먼저 조사를 통해 단서를 모아 주세요.', {
        fontFamily: FONT, fontSize: '13px', color: '#7a3a3a'
      }).setDepth(3);
    } else {
      this.collected.forEach((ev, i) => {
        const y = FACT_Y0 + i * ROW_H;
        // UNESCO 영역 색상 스트라이프 (체크박스 왼쪽)
        const ai = getArea(ev);
        if (ai) {
          const g = this.add.graphics().setDepth(3);
          g.fillStyle(ai.color, 1); g.fillRect(FACT_LIST_X - 12, y, 4, 18);
        }
        this.checkRow(FACT_LIST_X, y, FACT_W, ev.name,
          this.factPicks.has(ev.id), () => {
            if (this.factPicks.has(ev.id)) this.factPicks.delete(ev.id);
            else if (this.factPicks.size < 3) this.factPicks.add(ev.id);
            this.buildCompose();
          });
      });
    }

    // 좌우 사이 세로 구분선 (받는 곳 제거로 위로 이동)
    const divider = this.add.graphics().setDepth(2);
    divider.lineStyle(1, 0xc9a36b, 0.4);
    divider.lineBetween(470, 140, 470, 540);

    // 2) 나의 다짐 — 우측 칼럼 (480~920)
    const PL_X = 480, PL_LIST_X = 510, PL_W = 410, PL_Y0 = 168;
    this.sectionLabel(PL_X, 138, '2. 나의 다짐 (최대 3개 선택)');
    this.PLEDGES.forEach((p, i) => {
      const y = PL_Y0 + i * ROW_H;
      this.checkRow(PL_LIST_X, y, PL_W, p, this.pledgePicks.has(i), () => {
        if (this.pledgePicks.has(i)) this.pledgePicks.delete(i);
        else if (this.pledgePicks.size < 3) this.pledgePicks.add(i);
        this.buildCompose();
      });
    });

    // ✍ 내 다짐 한 줄 (선택) — 학생 자기 글 입력
    if (!this.userPledge) {
      this.userPledge = this.registry.get('userPledge') || '';
    }
    const upLabel = () => this.userPledge
      ? '✍ 내 다짐: "' + this.userPledge.slice(0, 50) + (this.userPledge.length > 50 ? '…' : '') + '"  (수정)'
      : '✍ 내 다짐 한 줄 직접 적기 (선택)';
    // userPledgeBtn은 하단 버튼들과 같은 y=578 줄에 가로 분할로 배치
    this.userPledgeBtn = fancyButton(this, 480, 578, 380, 42, upLabel(),
      () => {
        const cur = this.userPledge || '';
        const apply = (text) => {
          this.userPledge = (text || '').trim().slice(0, 200);
          this.registry.set('userPledge', this.userPledge);
          this.userPledgeBtn.t.setText(upLabel());
          this.buildCompose();
        };
        if (window.PEACE && typeof window.PEACE.openTextInputModal === 'function') {
          window.PEACE.openTextInputModal({
            title: '✍ UN에 전할 내 다짐',
            subtitle: '한 문장으로 자유롭게 적어주세요 (선택 입력)',
            placeholder: '예: 관심·연대·실천 — 셋 다 마음에 새기겠습니다',
            maxLength: 200,
            initial: cur
          }, apply);
        }
      },
      { base: 0x2b3a52, hover: 0x3c5170, edge: 0xc9a36b, text: '#ffe9b8' });

    // 하단 버튼 — userPledgeBtn(가운데, 290~670) 좌·우로 배치
    // 좌: 돌아가기 (← 표준 UI: 뒤로는 왼쪽)
    // 우: 미리보기 → (다음 단계 진행은 오른쪽)
    const ready = this.factPicks.size > 0 && this.pledgePicks.size > 0;
    fancyButton(this, 140, 578, 180, 42, "← 돌아가기",
      () => this.scene.start('WorldScene'),
      { base: 0x4a3a22, hover: 0x6a5a3a, edge: 0xc9a36b, text: '#ffe9b8' });
    fancyButton(this, 820, 578, 180, 42,
      ready ? '미리보기 →' : '단서·다짐 먼저', () => {
        if (ready) {
          this.buildPreview();
        } else {
          // 비활성 안내 — 무엇이 부족한지 명확히
          const needFact   = this.factPicks.size   === 0;
          const needPledge = this.pledgePicks.size === 0;
          let msg = '⚠ ';
          if (needFact && needPledge) msg += '체크할 단서와 다짐을 먼저 선택하세요';
          else if (needFact)          msg += '체크할 단서를 먼저 선택하세요';
          else                        msg += '다짐을 먼저 선택하세요';
          this.flashToast(msg);
        }
      },
      ready
        ? { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' }
        : { base: 0x4a4a4a, hover: 0x5a5a5a, edge: 0x888888, text: '#bbbbbb' });
  }

  sectionLabel(x, y, txt) {
    this.add.text(x, y, txt, {
      fontFamily: FONT, fontSize: '17px', color: '#3a2410', fontStyle: 'bold'
    }).setDepth(3);
  }

  // 체크박스 행
  checkRow(x, y, w, label, checked, cb) {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0xffffff, 1); g.fillRect(x, y, 18, 18);
    g.fillStyle(0x3a2410, 1);
    g.fillRect(x, y, 18, 2); g.fillRect(x, y + 16, 18, 2);
    g.fillRect(x, y, 2, 18); g.fillRect(x + 16, y, 2, 18);
    if (checked) {
      g.fillStyle(0x2e8b58, 1);
      g.fillRect(x + 4, y + 8, 4, 4); g.fillRect(x + 6, y + 10, 4, 4);
      g.fillRect(x + 8, y + 8, 6, 2); g.fillRect(x + 10, y + 6, 4, 2);
      g.fillRect(x + 12, y + 4, 2, 2);
    }
    this.add.text(x + 26, y + 9, label, {
      fontFamily: FONT, fontSize: '15px', color: '#1a1a2e'
    }).setOrigin(0, 0.5).setDepth(3);
    // 손가락 친화: 모바일에서 hit zone 높이 22 → 36으로 확장
    const zoneH = window.IS_MOBILE ? 36 : 22;
    const zone = this.add.zone(x + w / 2, y + 9, w, zoneH)
      .setInteractive({ useHandCursor: true }).setDepth(4);
    zone.on('pointerdown', () => cb());
  }

  // ── 미리보기 화면 ─────────────────────────────────────────
  buildPreview() {
    this.mode = 'preview';
    this.clearAll();

    panel(this, 480, 300, 940, 580, 0xfff8e7, 0x6a4f2a);
    // 헤더 띠
    const hdr = this.add.graphics().setDepth(2);
    hdr.fillStyle(0x6a4f2a, 1); hdr.fillRect(20, 24, 920, 40);
    this.add.text(480, 44, '👁  보고서 미리보기', {
      fontFamily: FONT_TITLE, fontSize: '20px', color: '#ffe9b8', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // 편지 본문 조립
    const r = this.RECIPIENTS[this.recipient];
    const date = new Date().toISOString().slice(0, 10);
    const facts = this.collected
      .filter(ev => this.factPicks.has(ev.id))
      .map(ev => '  · ' + ev.name + ' — ' + ev.desc);
    const pledges = [...this.pledgePicks].sort()
      .map(i => '  □ ' + this.PLEDGES[i]);

    // 성찰(C) 결과 — ReflectionScene에서 저장된 인과 사슬·자기성찰을 인용
    const refl = this.registry.get('reflection') || null;
    let reflBlock = '';
    if (refl && refl.chainNames && refl.chainNames.length === 3) {
      reflBlock =
`\n[ 사실의 연결 — 인과 사슬 ]
  ${refl.chainNames[0]}
   → ${refl.chainNames[1]}
   → ${refl.chainNames[2]}

[ 조사관의 자기성찰 ]
  "${refl.statementText || ''}"`;
      // ✍ 학생 본인이 쓴 한 문장 (선택 입력) — 인쇄 보고서/학습 트리와 동일 표시
      const userStmt = (this.registry.get('userReflection') || '').trim();
      if (userStmt) {
        reflBlock += `\n\n[ ✍ 조사관의 한 문장 ]\n  "${userStmt}"`;
      }
      reflBlock += '\n';
    }

    // ✍ 학생 본인이 쓴 다짐 (선택 입력) — 인쇄 보고서/학습 트리와 동일 표시
    const userPledge = (this.userPledge || this.registry.get('userPledge') || '').trim();
    const userPledgeBlock = userPledge
      ? `\n\n[ ✍ 조사관의 다짐 ]\n  "${userPledge}"`
      : '';

    const tmpl = this.tmpl || getLetterTemplate(this.registry);
    const body =
`${tmpl.header}
보고일 ${date}   ·   수신처: ${r.short}

[ 현장에서 확인한 사실 ]
${facts.join('\n')}
${reflBlock}
[ 권고와 시민의 다짐 ]
${pledges.join('\n')}${userPledgeBlock}

${tmpl.footer}

${tmpl.signature}`;

    // 본문 — 미리보기 영역(버튼 위)으로 마스크 클립. 내용이 길면 스크롤
    //  → 하단 버튼과 글씨가 겹치던 문제 해결 (이문호 교사 피드백)
    const PV_TOP = 80, PV_BOTTOM = 544, PV_H = PV_BOTTOM - PV_TOP;
    const bodyTxt = this.add.text(42, PV_TOP, body, {
      fontFamily: FONT, fontSize: '13px', color: '#1a1a2e',
      wordWrap: { width: 876 }, lineSpacing: 4
    }).setDepth(3);
    const maskG = this.make.graphics({ add: false });
    maskG.fillRect(20, PV_TOP - 4, 920, PV_H + 8);
    bodyTxt.setMask(maskG.createGeometryMask());

    const overflow = Math.max(0, Math.ceil(bodyTxt.height) - PV_H);
    if (overflow > 0) {
      this._pvScroll = 0;
      const apply = () => {
        this._pvScroll = Phaser.Math.Clamp(this._pvScroll, -overflow, 0);
        bodyTxt.y = PV_TOP + this._pvScroll;
      };
      // 휠 스크롤 (preview 모드에서만, 중복 등록 방지)
      this.input.off('wheel');
      this.input.on('wheel', (p, go, dx, dy) => {
        if (this.mode !== 'preview') return;
        this._pvScroll -= dy * 0.4; apply();
      });
      // 드래그 스크롤 (터치) — 영역 위 투명 zone (오브젝트 스코프라 누수 없음)
      const dz = this.add.zone(480, (PV_TOP + PV_BOTTOM) / 2, 920, PV_H)
        .setInteractive({ draggable: true }).setDepth(2);
      let dragBase = 0, dragFromY = 0;
      dz.on('pointerdown', (p) => { dragBase = this._pvScroll; dragFromY = p.y; });
      dz.on('drag', (p) => { this._pvScroll = dragBase + (p.y - dragFromY); apply(); });
      // 스크롤 힌트
      this.add.text(905, PV_BOTTOM - 2, '↕ 끌거나 휠로 스크롤', {
        fontFamily: FONT, fontSize: '11px', color: '#8a6a3a',
        backgroundColor: '#efe6cccc', padding: { x: 4, y: 1 }
      }).setOrigin(1, 1).setDepth(5);
    }

    // 하단 버튼 — 송부 전 자기평가 루브릭을 거치도록 변경
    // 통일된 표현: '← 작성으로' (뒤) / '자기평가 →' (다음)
    fancyButton(this, 250, 572, 200, 40, '← 작성으로',
      () => this.buildCompose(),
      { base: 0x4a3a22, hover: 0x6a5a3a, edge: 0xc9a36b, text: '#ffe9b8' });
    fancyButton(this, 550, 572, 200, 40, '자기평가 →',
      () => this.buildReview(body),
      { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' });
  }

  // ── 자기 평가 (임무 회고 루브릭) ──────────────────────────
  // 자기조절학습(SRL)의 "자기 평가" 단계 — 학생이 스스로 자기 학습을
  // 점수화하고, 다음에 더 알고 싶은 것을 선택한다.
  buildReview(body) {
    this.mode = 'review';
    this.clearAll();

    // 배경
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x10202e, 0x10202e, 0x1a2a3a, 0x152033, 1);
    bg.fillRect(0, 0, 960, 600);

    // 타이틀
    panel(this, 480, 40, 920, 56, 0x1a2a3a, 0xc9a36b);
    this.add.text(480, 28, '📊  자기평가  ·  Self-Evaluation', {
      fontFamily: FONT_TITLE, fontSize: '18px', color: '#ffe9b8',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(480, 52, '내가 이번 임무에서 얼마나 배웠는지 스스로 평가해 보세요', {
      fontFamily: FONT, fontSize: '12px', color: '#cfe9ff'
    }).setOrigin(0.5);

    // 3개 슬라이더(별점) 행
    this.reviewScores = { goalMet: 3, factConf: 3, actionConf: 3 };
    const sliderRows = [
      { key: 'goalMet',    label: '내 목표 달성도',      desc: '이번 임무에서 알고 싶었던 것을 얼마나 알게 됐나요?' },
      { key: 'factConf',   label: '사실 이해 자신감',    desc: getCaseShortName(this.registry) + ' 사건의 원인·결과를 다른 사람에게 설명할 수 있나요?' },
      { key: 'actionConf', label: '실천 다짐 자신감',    desc: '오늘 적은 다짐을 실제로 지킬 수 있을 것 같나요?' },
    ];
    sliderRows.forEach((row, i) => {
      const y = 110 + i * 86;
      // 패널 — 채움·외곽 폭 880 통일 (이전엔 외곽 720라 우측 160px가 떠있었음)
      const p = this.add.graphics();
      p.fillStyle(0x0a1828, 0.85); p.fillRect(40, y, 880, 74);
      p.lineStyle(2, 0x2a5a82, 1); p.strokeRect(40, y, 880, 74);
      // 라벨·설명
      this.add.text(54, y + 10, row.label, {
        fontFamily: FONT_TITLE, fontSize: '14px', color: '#ffd96a',
        fontStyle: 'bold'
      });
      this.add.text(54, y + 30, row.desc, {
        fontFamily: FONT, fontSize: '11px', color: '#a8c4dc'
      });
      // 5개 별 버튼 (1~5점)
      const scoreText = this.add.text(880, y + 12, '★ 3 / 5', {
        fontFamily: FONT_TITLE, fontSize: '13px', color: '#ffd96a'
      }).setOrigin(1, 0);
      const stars = [];
      for (let s = 1; s <= 5; s++) {
        const sx = 110 + (s - 1) * 90;
        const sy = y + 56;
        const star = this.add.text(sx, sy, '★', {
          fontFamily: FONT_TITLE, fontSize: '22px',
          color: s <= 3 ? '#ffd96a' : '#3a4a5a'
        }).setOrigin(0.5);
        // 손가락 친화 hit zone — 별 위에 큰 투명 zone (모바일은 더 크게)
        const hitW = window.IS_MOBILE ? 80 : 50;
        const hitH = window.IS_MOBILE ? 60 : 40;
        const zone = this.add.zone(sx, sy, hitW, hitH)
          .setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
          this.reviewScores[row.key] = s;
          stars.forEach((st, idx) => {
            st.setColor(idx < s ? '#ffd96a' : '#3a4a5a');
          });
          scoreText.setText('★ ' + s + ' / 5');
          if (window.SFX) window.SFX.play('click');
        });
        stars.push(star);
      }
    });

    // "더 알고 싶은 것" 선택 (단일 선택)
    const wY = 372;
    const wp = this.add.graphics();
    wp.fillStyle(0x0a1828, 0.85); wp.fillRect(40, wY, 880, 142);
    wp.lineStyle(2, 0x2a5a82, 1); wp.strokeRect(40, wY, 720, 142);
    this.add.text(54, wY + 10, '🔍  다음에 더 알아보고 싶은 것 (선택사항)', {
      fontFamily: FONT_TITLE, fontSize: '14px', color: '#ffd96a',
      fontStyle: 'bold'
    });
    const wantOptions = [
      { id: 'more_disaster',  label: '다른 환경 재앙 사례' },
      { id: 'more_un',        label: 'UN·국제기구 활동' },
      { id: 'more_consume',   label: '내가 할 수 있는 소비' },
      { id: 'more_future',    label: '카라칼팍의 미래' },
    ];
    this.wantNext = null;
    const wantBtns = [];
    wantOptions.forEach((opt, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const wx = 54 + col * 354, wyy = wY + 38 + row * 46;
      const ww = 340, wh = 38;
      const gg = this.add.graphics();
      const draw = (sel) => {
        gg.clear();
        gg.fillStyle(sel ? 0x2e4a36 : 0x102238, 1);
        gg.fillRect(wx, wyy, ww, wh);
        gg.lineStyle(2, sel ? 0x7fd07f : 0x2a5a82, 1);
        gg.strokeRect(wx, wyy, ww, wh);
      };
      draw(false);
      this.add.text(wx + 14, wyy + wh / 2, opt.label, {
        fontFamily: FONT, fontSize: '12px', color: '#e6efff'
      }).setOrigin(0, 0.5);
      const zone = this.add.zone(wx + ww / 2, wyy + wh / 2, ww, wh)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.wantNext = (this.wantNext === opt.id) ? null : opt.id;
        wantBtns.forEach(b => b.draw(b.id === this.wantNext));
      });
      wantBtns.push({ id: opt.id, draw });
    });

    // 하단 버튼 — 통일된 표현: '← 미리보기로' (뒤) / '📤 송부하기' (최종 액션)
    fancyButton(this, 250, 566, 220, 42, '← 미리보기로',
      () => this.buildPreview(),
      { base: 0x4a3a22, hover: 0x6a5a3a, edge: 0xc9a36b, text: '#ffe9b8' });
    fancyButton(this, 550, 566, 220, 42, '📤  송부하기',
      () => {
        // registry에 자기 평가 저장 (사건별 누적용으로 caseId 키와 함께)
        const review = {
          ...this.reviewScores,
          wantNext: this.wantNext,
          wantNextLabel: (wantOptions.find(o => o.id === this.wantNext) || {}).label || '',
        };
        this.registry.set('learningReview', review);
        // 사건별 누적 회고(LearningTreeScene용)
        const allReviews = this.registry.get('caseReviews') || {};
        const caseId = this.registry.get('caseId') || 'aralsea';
        allReviews[caseId] = review;
        this.registry.set('caseReviews', allReviews);
        // 자기 평가 점수를 대시보드에 즉시 반영
        reportProgress(this);
        this.buildSent(body);
      },
      { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' });
  }

  // ── 발송 완료 / 엔딩 ──────────────────────────────────────
  buildSent(body) {
    this.mode = 'sent';
    this.clearAll();
    if (window.SFX) window.SFX.play('send');   // 송부 팡파레

    // 보고서 송부 완료 — 교사 대시보드에 반영
    this.registry.set('reportSent', true);
    // 완료 사건 목록에 등록 (중복 방지) — 사건 선택 화면에서 ✓ 배지로 표시됨
    const caseId = this.registry.get('caseId') || 'aralsea';
    const completed = this.registry.get('completedCases') || [];
    if (!completed.includes(caseId)) {
      completed.push(caseId);
      this.registry.set('completedCases', completed);
    }
    // 뱃지 계산 — 학생의 학습 성취 시각화 (학습 트리에 표시됨)
    const badges = this.computeBadges();
    const allBadges = this.registry.get('caseBadges') || {};
    allBadges[caseId] = badges;
    this.registry.set('caseBadges', allBadges);

    reportProgress(this, { reportSent: true, badges });

    // 어두운 배경 + 상단 빛
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0e1a, 1); bg.fillRect(0, 0, 960, 600);
    bg.fillStyle(0xf6d79b, 0.10); bg.fillRect(0, 0, 960, 92);

    // 제목 + 안내 (패널 없이 텍스트만)
    this.add.text(480, 30, '✨  조사 보고서가 UN으로 전송되었습니다  ✨', {
      fontFamily: FONT_TITLE, fontSize: '21px', color: '#ffe9b8',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(480, 62,
      '💡 아래 🖨 버튼으로 인쇄·PDF 저장 가능 (또는 이 화면 캡처)', {
      fontFamily: FONT, fontSize: '13px', color: '#ffe082'
    }).setOrigin(0.5);

    // 보고서 본문에 자기 평가 결과 덧붙이기 (있을 때만)
    const review = this.registry.get('learningReview') || null;
    let finalBody = body;
    if (review) {
      const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
      finalBody = body +
        '\n\n────────────────────────────────────────\n' +
        '[ 조사관의 임무 회고 (자기 평가) ]\n' +
        '  · 내 목표 달성도   ' + stars(review.goalMet)    + '  ' + review.goalMet    + '/5\n' +
        '  · 사실 이해 자신감 ' + stars(review.factConf)   + '  ' + review.factConf   + '/5\n' +
        '  · 실천 다짐 자신감 ' + stars(review.actionConf) + '  ' + review.actionConf + '/5' +
        (review.wantNextLabel
          ? '\n  · 다음에 알고 싶은 것: ' + review.wantNextLabel
          : '');
    }

    // 완성 보고서 패널 (넉넉히)
    panel(this, 480, 330, 920, 456, 0xfff8e7, 0x6a4f2a);
    this.add.text(44, 120, finalBody, {
      fontFamily: FONT, fontSize: '14px', color: '#0a0a14',
      wordWrap: { width: 872 }, lineSpacing: 6, resolution: 2
    });

    // 게임 루프 마무리 — 4 버튼 (강조: 🖨 인쇄 + 다른 사건 선택) + fade
    const leaveTo = (sceneKey) => {
      if (this.leavingEnd) return;
      this.leavingEnd = true;
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete',
        () => this.scene.start(sceneKey));
    };
    // 🖨 인쇄 — 보고서를 #printReport 에 채우고 window.print() 호출
    fancyButton(this, 130, 578, 180, 40, '🖨  보고서 인쇄',
      () => this.printReport(),
      { base: 0x4a3a22, hover: 0x6a5a3a, edge: 0xffd96a, text: '#ffe9b8' });
    // UN 연설은 사건마다 하지 않고 학습 트리에서 마지막에 한 번 (이문호 교사 피드백)
    fancyButton(this, 320, 578, 180, 40, '🌳  나의 조사 기록',
      () => leaveTo('LearningTreeScene'),
      { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' });
    fancyButton(this, 510, 578, 160, 40, '에셋·라이선스',
      () => leaveTo('CreditsScene'),
      { base: 0x4a3a22, hover: 0x6a5a3a, edge: 0xc9a36b, text: '#ffe9b8' });
    fancyButton(this, 680, 578, 140, 40, '🏠  처음으로',
      () => leaveTo('TitleScene'),
      { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' });
  }

  // ── 보고서 인쇄 (#printReport 채우고 window.print()) ──────
  printReport() {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('printReport');
    if (!el) return;
    const r = this.registry;
    const date = new Date().toISOString().slice(0, 10);
    const name = (typeof document !== 'undefined' &&
                  document.getElementById('cfgName') &&
                  document.getElementById('cfgName').value.trim()) ||
                 '학생';
    const caseId = r.get('caseId') || 'aralsea';
    const curCase = (typeof CASE_LIST !== 'undefined')
      ? CASE_LIST.find(c => c.id === caseId) : null;
    const caseTitle = curCase ? curCase.title : getCaseShortName(this.registry);
    // 사건별 권고·서명 — buildSent 본문과 동일 템플릿 사용
    const tmpl = this.tmpl || getLetterTemplate(this.registry);
    const recipient = this.RECIPIENTS[this.recipient];
    const facts = this.collected
      .filter(ev => this.factPicks.has(ev.id));
    const pledges = [...this.pledgePicks].sort()
      .map(i => this.PLEDGES[i]);
    const refl = r.get('reflection') || null;
    const review = r.get('learningReview') || null;
    const tags = r.get('evidenceTags') || {};
    const tagsCount = Object.keys(tags).length;
    const userPledge = (r.get('userPledge') || '').trim();

    // HTML 이스케이프
    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const stars = (n) => {
      n = Math.max(0, Math.min(5, n || 0));
      return '<span class="stars">' + '★'.repeat(n) + '☆'.repeat(5 - n) + '</span>';
    };

    // 인과 사슬 HTML
    let chainHtml = '';
    if (refl && refl.chainNames && refl.chainNames.length === 3) {
      chainHtml = '<h2>🔗 사실의 연결 — 인과 사슬</h2>' +
        '<p class="chain">' +
        esc(refl.chainNames[0]) + '  →  ' +
        esc(refl.chainNames[1]) + '  →  ' +
        esc(refl.chainNames[2]) + '</p>';
    }
    // 자기성찰 인용문 (선택 카드 + 자기 작성 둘 다)
    let stmtHtml = '';
    if (refl && (refl.statementText || refl.userStatement)) {
      stmtHtml = '<h2>💭 조사관의 자기성찰</h2>';
      if (refl.statementText) {
        stmtHtml += '<blockquote>"' + esc(refl.statementText) + '"</blockquote>';
      }
      if (refl.userStatement) {
        stmtHtml += '<blockquote class="user-quote">' +
          '<span class="user-quote-label">✍ 조사관 본인의 한 문장:</span><br>' +
          '"' + esc(refl.userStatement) + '"</blockquote>';
      }
    }
    // 자기 평가 표
    let reviewHtml = '';
    if (review) {
      const avg = ((review.goalMet + review.factConf + review.actionConf) / 3).toFixed(1);
      reviewHtml = '<h2>📊 조사관의 임무 회고 (자기 평가)</h2>' +
        '<table>' +
        '<tr><th style="width:40%">평가 항목</th><th>점수</th><th style="width:15%">/ 5</th></tr>' +
        '<tr><td>내 목표 달성도</td><td>' + stars(review.goalMet) + '</td><td>' + review.goalMet + '</td></tr>' +
        '<tr><td>사실 이해 자신감</td><td>' + stars(review.factConf) + '</td><td>' + review.factConf + '</td></tr>' +
        '<tr><td>실천 다짐 자신감</td><td>' + stars(review.actionConf) + '</td><td>' + review.actionConf + '</td></tr>' +
        '<tr><td><strong>평균</strong></td><td colspan="2"><strong>★ ' + avg + ' / 5.0</strong></td></tr>' +
        '</table>' +
        (review.wantNextLabel
          ? '<p>🔍 다음에 더 알고 싶은 것: <strong>' + esc(review.wantNextLabel) + '</strong></p>'
          : '');
    }

    // 본문 조립
    el.innerHTML =
      '<div class="pr-doc">' +
        '<h1><span class="un-logo">UN</span>《 ' + esc(caseTitle) + ' · 현지 조사 보고서 》</h1>' +
        '<div class="pr-meta">' +
          '<strong>P.E.A.C.E. Agency · UN 분쟁 분석관 임무 보고</strong><br>' +
          '보고일 ' + esc(date) +
          '  ·  수신처: ' + esc(recipient.short) +
          '  ·  조사관: ' + esc(name) +
        '</div>' +

        '<h2>📋 현장에서 확인한 사실</h2>' +
        '<ul>' +
          facts.map(f => '<li><strong>' + esc(f.name) + '</strong> — ' + esc(f.desc) + '</li>').join('') +
        '</ul>' +

        chainHtml +
        stmtHtml +

        '<h2>🤝 권고와 시민의 다짐</h2>' +
        '<ul>' +
          pledges.map(p => '<li>' + esc(p) + '</li>').join('') +
        '</ul>' +
        // 학생 본인이 쓴 한 줄 다짐 (선택 입력)
        (userPledge
          ? '<blockquote class="user-quote">' +
            '<span class="user-quote-label">✍ 조사관 본인의 다짐 한 줄:</span><br>' +
            '"' + esc(userPledge) + '"</blockquote>'
          : '') +

        reviewHtml +

        // 🆕 P.E.A.C.E. 종합 평가 — UN 블루 톤 강조
        (() => {
          const sc = computePeaceScores(this.registry);
          const starsHtml = (n) => '<span class="stars">' + '★'.repeat(n) + '☆'.repeat(3 - n) + '</span>';
          const dimRows = PEACE_DIMS.map(d => {
            const v = sc.dims[d.key];
            return '<tr><td>' + d.icon + ' ' + d.label +
                   ' <span style="color:#888">(' + d.en + ')</span></td>' +
                   '<td>' + starsHtml(v) + '</td>' +
                   '<td>' + v + '</td></tr>';
          }).join('');
          return '<h2 class="peace-eval">🏛 P.E.A.C.E. 종합 평가' +
              '<span class="peace-grade-badge peace-grade-' + sc.grade + '">' +
              sc.grade + ' · ' + sc.total + '/' + sc.max + '</span></h2>' +
            '<p style="margin:4px 0 8px">계획서 평가 루브릭(5항목 × 3점 = 15점)에 따라 ' +
            '게임 데이터로부터 자동 산출된 점수입니다.</p>' +
            '<table>' +
              '<tr><th style="width:55%">평가 차원</th><th>점수</th><th style="width:12%">/ 3</th></tr>' +
              dimRows +
              '<tr><td><strong>합계</strong></td>' +
                '<td colspan="2"><strong>등급 [' + sc.grade + ']  ·  ' +
                sc.total + ' / ' + sc.max + '</strong></td></tr>' +
            '</table>' +
            // 채점 기준표 — 학생·교사·평가단이 등급 의미를 즉시 확인
            '<table class="grade-key" style="margin-top:8px; font-size:11px">' +
              '<tr><th style="width:18%">등급</th><th style="width:22%">점수 범위</th><th>해석</th></tr>' +
              '<tr><td><span class="peace-grade-badge peace-grade-S">S</span></td>' +
                '<td>13 ~ 15</td><td>탁월 — 5차원 모두 깊이 있게 학습</td></tr>' +
              '<tr><td><span class="peace-grade-badge peace-grade-A">A</span></td>' +
                '<td>10 ~ 12</td><td>우수 — 핵심 학습 완성</td></tr>' +
              '<tr><td><span class="peace-grade-badge peace-grade-B">B</span></td>' +
                '<td>&nbsp;7 ~ &nbsp;9</td><td>보통 — 주요 활동 참여</td></tr>' +
              '<tr><td><span class="peace-grade-badge peace-grade-C">C</span></td>' +
                '<td>&nbsp;0 ~ &nbsp;6</td><td>시작 — 추가 활동 권장</td></tr>' +
            '</table>';
        })() +

        (tagsCount > 0
          ? '<h2>💭 단서별 감정 태그</h2>' +
            '<p>총 ' + tagsCount + '개 단서에 자기 감정 태그를 부착함 ' +
            '(자기 모니터링).</p>'
          : '') +

        (() => {
          const badges = this.computeBadges();
          const badgeDefs = [
            { key: 'collector', label: '★ 단서 마스터 — 모든 현장 단서 수집' },
            { key: 'sage',      label: '🎯 인터뷰 통달 — 모든 시민 인터뷰 완료' },
            { key: 'empath',    label: '💭 공감 기록자 — 5개+ 단서에 감정 태그' },
            { key: 'thinker',   label: '🔗 인과 분석가 — 인과 사슬 3단 완성' },
            { key: 'reflector', label: '📊 자기 성찰 — 임무 회고 제출' },
            { key: 'balanced',  label: '🌐 균형 시민 — 인지·정서·행동 모두 학습' },
          ];
          const got = badgeDefs.filter(bd => badges[bd.key]);
          if (got.length === 0) return '';
          return '<h2>🏆 획득 뱃지</h2><ul>' +
            got.map(bd => '<li>' + esc(bd.label) + '</li>').join('') +
            '</ul>';
        })() +

        // 🕊 UN 연설문 — SpeechScene에서 학생이 직접 만든 연설을 보고서에 인용
        (() => {
          const speech = this.registry.get('speech');
          if (!speech || !speech.fullText) return '';
          const phraseList = (speech.phrases || []).map(p =>
            '<li>' + esc(p) + '</li>').join('');
          return '<h2>🕊 UN 연설문 (조사관 발표)</h2>' +
            '<blockquote class="user-quote">' +
              '<span class="user-quote-label">조사관의 호소:</span><br>' +
              '"' + esc(speech.fullText) + '"' +
            '</blockquote>' +
            (phraseList
              ? '<details style="margin-top:6px"><summary>본문 문장 분해</summary>' +
                '<ul>' + phraseList +
                (speech.closing ? '<li><em>(마무리)</em> ' + esc(speech.closing) + '</li>' : '') +
                '</ul></details>'
              : '');
        })() +

        '<p style="margin-top:16px">' + esc(tmpl.footer).replace(/\n/g, '<br>') + '</p>' +

        '<div class="sign">' + esc(tmpl.signature) + '</div>' +
      '</div>';

    // 인쇄 다이얼로그 호출 — Electron/브라우저 모두 동작
    // (사용자가 PDF 저장 또는 종이 인쇄 선택)
    setTimeout(() => window.print(), 80);
  }

  // ── 뱃지 계산 ─────────────────────────────────────────────
  //  사건을 완료한 학생의 학습 성취 패턴을 뱃지 6종으로 표현.
  //  보고서 송부 시점의 registry 데이터로 자동 산정.
  computeBadges() {
    const r = this.registry;
    const ev = r.get('evidence') || [];
    const cores = r.get('coreClues') || [];
    const tags = r.get('evidenceTags') || {};
    const refl = r.get('reflection') || null;
    const review = r.get('learningReview') || null;
    // 단서 area별 분포 (균형 뱃지 계산용)
    const areas = { cognitive: 0, emotional: 0, behavioral: 0 };
    ev.forEach(e => { if (e.area && areas[e.area] != null) areas[e.area]++; });

    return {
      collector: ev.length >= 10,                                    // ★ 모든 현장 단서
      sage:      cores.length >= TOTAL_CITIZENS,                     // 🎯 모든 시민 인터뷰
      empath:    Object.keys(tags).length >= 5,                      // 💭 단서 5개+ 감정 태그
      thinker:   !!(refl && refl.chainNames && refl.chainNames.length === 3),  // 🔗 인과 사슬
      reflector: !!review,                                           // 📊 자기 평가
      balanced:  areas.cognitive >= 1 && areas.emotional >= 1 && areas.behavioral >= 1,  // 🌐 영역 균형
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  성찰 (ReflectionScene) — PEACE의 C(Connecting)
//  · 인과 사슬: 단서 3개를 [원인]→[과정]→[결과] 슬롯에 배치
//  · 자기성찰: 5개 카드 중 1개 선택 ("가장 마음에 남은 단서는?")
//  · 두 활동 모두 마치면 reflectionDone=true → 4단계 잠금 해제
// ══════════════════════════════════════════════════════════════
// 사건별 자기성찰 5장 풀 — 학생이 '가장 마음에 남은 단서/생각' 1장 선택
const REFLECTION_STATEMENTS_BY_CASE = {
  intro: [
    { id: 's_p5',      text: 'P.E.A.C.E. 다섯 단계 — 인식·탐색·분석·연결·실천 — 이 머릿속에 새겨졌다.' },
    { id: 's_link',    text: '내가 입는 옷·먹는 음식이 누군가의 분쟁과 닿아 있다는 사실이 충격이었다.' },
    { id: 's_hansen',  text: '한센 디렉터의 30년 경험에서 평화 활동의 무게가 느껴졌다.' },
    { id: 's_james',   text: '동기 제임스와 함께 시작한다는 사실이 든든했다.' },
    { id: 's_three',   text: '아랄해·우크라이나·팔레스타인 — 세 현장이 모두 나를 기다린다는 게 가슴 뛴다.' },
  ],
  aralsea: [
    { id: 's_shrink',  text: '한 인간의 일생 안에 호수의 90%가 사라졌다는 사실이 충격이었다.' },
    { id: 's_people',  text: '4만 명의 어부가 바다와 함께 일자리를 잃었다는 점이 마음에 남았다.' },
    { id: 's_dust',    text: '아이들이 매일 마시는 소금·농약 먼지가 가장 마음 아팠다.' },
    { id: 's_connect', text: '내가 입는 옷 한 벌이 이 호수와 연결돼 있다는 사실을 처음 알았다.' },
    { id: 's_action',  text: '코카랄 댐처럼 작은 협력이 큰 변화를 만들 수 있다는 점이 인상적이었다.' },
  ],
  ukraine: [
    { id: 's_school',   text: '수천 개의 학교가 부서지고 1년 넘게 교실에 못 간 아이들이 있다는 사실이 충격이었다.' },
    { id: 's_civilian', text: '전쟁에서 가장 많이 다치는 사람이 아이와 평범한 시민이라는 점이 마음에 남았다.' },
    { id: 's_food',     text: '먼 나라의 항구가 멈추자 다른 대륙의 빵 값이 두 배가 됐다는 연결이 놀라웠다.' },
    { id: 's_alarm',    text: '매일 공습 사이렌 소리에 두려움을 일상으로 살아야 한다는 점이 가장 마음 아팠다.' },
    { id: 's_peace_ed', text: '평화 교육이 아이들의 그림에서 시작된다는 카테리나의 말이 인상적이었다.' },
  ],
  palestine: [
    { id: 's_olive',     text: '천 년 된 올리브 한 그루가 한 가족 4대의 기억을 품고 있다는 점이 깊이 다가왔다.' },
    { id: 's_check',     text: '5분 거리 학교를 가는 데 검문소 때문에 두 시간이 걸린다는 일상이 충격이었다.' },
    { id: 's_three',     text: '한 골목 안에 세 종교가 천 년 넘게 함께 살아왔다는 사실이 놀라웠다.' },
    { id: 's_aid_stamp', text: '아이들 백신 한 상자가 통과에 며칠씩 걸린다는 점이 마음 아팠다.' },
    { id: 's_kids_dove', text: '양쪽 아이들이 똑같이 평화의 비둘기를 그린다는 사실이 가장 인상적이었다.' },
  ],
};
function getReflectionStatements(registry) {
  const id = (registry && registry.get && registry.get('caseId')) || 'aralsea';
  return REFLECTION_STATEMENTS_BY_CASE[id] || REFLECTION_STATEMENTS_BY_CASE.aralsea;
}
// 하위 호환 — 옛 이름 참조 (한 곳이라도 남아있을 가능성)
const REFLECTION_STATEMENTS = REFLECTION_STATEMENTS_BY_CASE.aralsea;

class ReflectionScene extends Phaser.Scene {
  constructor() { super('ReflectionScene'); }

  create() {
    setCfgBarVisible(false);
    this.cameras.main.fadeIn(260, 0, 0, 0);

    // 사용 가능한 단서 — 현장 단서(evidence)
    this.allClues = this.registry.get('evidence') || [];
    // 인과 사슬 3슬롯: 0=원인, 1=과정, 2=결과
    this.slots = [null, null, null];
    this.slotLabels = ['원인', '과정', '결과'];
    this.activeSlot = null;       // 현재 단서를 채우려는 슬롯 인덱스
    this.statementId = null;      // 선택된 자기성찰 카드 id
    this.leaving = false;

    // 배경
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x10202e, 0x10202e, 0x1a2a3a, 0x152033, 1);
    bg.fillRect(0, 0, 960, 600);

    // 상단 타이틀
    panel(this, 480, 38, 920, 56, 0x1a2a3a, 0xc9a36b);
    this.add.text(480, 28, '🪞  성찰  ·  Connecting', {
      fontFamily: FONT_TITLE, fontSize: '20px', color: '#ffe9b8',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(480, 50, '흩어진 사실을 하나의 그림으로 잇기', {
      fontFamily: FONT, fontSize: '12px', color: '#cfe9ff'
    }).setOrigin(0.5);

    // ── 영역 ❶ 인과 사슬 ─────────────────────────────────────
    this.add.text(40, 80, '❶  인과 사슬 만들기', {
      fontFamily: FONT_TITLE, fontSize: '15px', color: '#ffd96a',
      fontStyle: 'bold'
    });
    this.add.text(40, 102, '아래에서 단서 3개를 골라  [원인 → 과정 → 결과]  순서로 배치하세요.', {
      fontFamily: FONT, fontSize: '12px', color: '#cfe9ff'
    });

    // 3 슬롯 가로 배치 (가운데 화살표)
    this.slotObjs = [];
    const slotY = 158;
    [0, 1, 2].forEach((i) => {
      const x = 240 + i * 240;
      const g = this.add.graphics();
      const t1 = this.add.text(x, slotY - 38, this.slotLabels[i], {
        fontFamily: FONT_TITLE, fontSize: '13px', color: '#ffd96a',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      const t2 = this.add.text(x, slotY, '클릭하여 단서 선택', {
        fontFamily: FONT, fontSize: '12px', color: '#7c8c98',
        align: 'center', wordWrap: { width: 200 }
      }).setOrigin(0.5);
      const zone = this.add.zone(x, slotY, 220, 70).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.openCluePicker(i));
      this.slotObjs.push({ g, t1, t2, zone, x, y: slotY });
      this.drawSlot(i);

      // 화살표 (마지막은 제외) — 슬롯 채워질수록 활성화
      if (i < 2) {
        const ax = x + 110;
        const arrow = this.add.text(ax + 10, slotY, '➔', {
          fontFamily: FONT_TITLE, fontSize: '22px', color: '#3a4a5a'
        }).setOrigin(0.5);
        if (!this._arrowObjs) this._arrowObjs = [];
        this._arrowObjs.push({ arrow, idx: i });
      }
    });

    // ── 구분선 ──────────────────────────────────────────────
    const div = this.add.graphics();
    div.lineStyle(1, 0x2a5a82, 0.7);
    div.lineBetween(40, 232, 920, 232);

    // ── 영역 ❷ 자기성찰 ─────────────────────────────────────
    this.add.text(40, 246, '❷  자기성찰  ·  한 문장만 골라보세요', {
      fontFamily: FONT_TITLE, fontSize: '15px', color: '#ffd96a',
      fontStyle: 'bold'
    });
    this.add.text(40, 268, '"가장 마음에 남은 단서는 무엇이며, 왜인가요?"', {
      fontFamily: FONT, fontSize: '12px', color: '#cfe9ff', fontStyle: 'italic'
    });

    // 5개 카드 — 한 줄에 가로 배치 (5장이라 좀 작게)
    // 16:10(960폭) 가운데 정렬: 카드 폭 144 + gap 10 → 시작 x = 100
    // 사건별 STATEMENTS 풀에서 가져옴 (아랄해/우크라/팔레 각각 다른 5장)
    this.stmtPool = getReflectionStatements(this.registry);
    this.stmtObjs = [];
    this.stmtPool.forEach((s, i) => {
      const x = 100 + i * 154;
      const y = 296;
      const w = 144, h = 200;
      const g = this.add.graphics();
      const t = this.add.text(x + w / 2, y + h / 2, s.text, {
        fontFamily: FONT, fontSize: '11px', color: '#e6efff',
        align: 'center', wordWrap: { width: w - 14 }, lineSpacing: 3
      }).setOrigin(0.5);
      const zone = this.add.zone(x + w / 2, y + h / 2, w, h)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.pickStatement(s.id));
      this.stmtObjs.push({ id: s.id, g, t, zone, x, y, w, h });
    });
    this.drawAllStatements();

    // ── ✍ 자기 작성 (선택) — 학생 본인 한 문장 ─────────────────
    this.userStmt = this.registry.get('userReflection') || '';
    const userBtnLabel = () => this.userStmt
      ? '✍  내 생각: "' + this.userStmt.slice(0, 38) + (this.userStmt.length > 38 ? '…' : '') + '"  (수정)'
      : '✍  내 생각도 직접 한 문장 적어보기 (선택)';
    this.userStmtBtn = fancyButton(this, 480, 510, 700, 30, userBtnLabel(),
      () => {
        const cur = this.userStmt || '';
        const apply = (text) => {
          this.userStmt = (text || '').trim().slice(0, 200);
          // 입력 즉시 저장 — "닫기"로 나가도 본인 작성 보존
          this.registry.set('userReflection', this.userStmt);
          this.userStmtBtn.t.setText(userBtnLabel());
        };
        if (window.PEACE && typeof window.PEACE.openTextInputModal === 'function') {
          // 왼쪽 노트에 내가 만든 인과 사슬 + 고른 자기성찰을 띄움 (이문호 교사 피드백)
          const chainTxt = this.slots
            .map((s, i) => s ? (this.slotLabels[i] + ': ' + s.name) : null)
            .filter(Boolean).join('  →  ');
          const stmtText = ((this.stmtPool || REFLECTION_STATEMENTS)
            .find(s => s.id === this.statementId) || {}).text || '';
          const note = [];
          if (chainTxt) note.push({ name: '🔗 내가 만든 인과 사슬', desc: chainTxt });
          if (stmtText) note.push({ name: '💭 내가 고른 자기성찰', desc: stmtText });
          window.PEACE.openTextInputModal({
            title: '✍ 내 생각 한 문장',
            subtitle: '왼쪽 내 성찰을 보고, 가장 마음에 남은 생각을 한 문장으로 (선택 입력)',
            placeholder: '예: 환경 문제는 결국 사람의 문제다',
            maxLength: 200,
            initial: cur,
            clues: note,
            cluesTitle: '📒 내 성찰 기록'
          }, apply);
          return;
        }
        // 폴백 — 모달 없으면 기존 prompt
        const txt = window.prompt(
          '가장 마음에 남은 단서나 생각을 한 문장으로 적어주세요\n(최대 200자, 선택 입력)',
          cur);
        if (txt !== null) {
          this.userStmt = txt.trim().slice(0, 200);
          this.registry.set('userReflection', this.userStmt);
          this.userStmtBtn.t.setText(userBtnLabel());
        }
      },
      { base: 0x2b3a52, hover: 0x3c5170, edge: 0xc9a36b, text: '#ffe9b8' });

    // ── 하단 진행 안내 + 완료 버튼 ────────────────────────────
    this.statusText = this.add.text(480, 540,
      '인과 사슬 0/3   ·   자기성찰 미선택', {
      fontFamily: FONT, fontSize: '12px', color: '#cfe9ff'
    }).setOrigin(0.5);
    this.refreshStatus();

    this.finishBtn = fancyButton(this, 480, 568, 280, 42, '✓  성찰 마치기',
      () => this.tryFinish(),
      { base: 0x4a3a22, hover: 0x6a5a3a, edge: 0xc9a36b, text: '#ffe9b8' });

    // 우상단 — 월드로 돌아가기 (취소). 16:10 우측 끝(960)에 맞춰 870.
    fancyButton(this, 870, 38, 130, 32, '↩ 닫기',
      () => this.leaveBack(),
      { base: 0x2b3a52, hover: 0x3c5170, edge: 0x6fb7d6, text: '#dff1ff' });
  }

  // 인과 사슬 화살표 활성화 상태 갱신
  refreshArrows() {
    if (!this._arrowObjs) return;
    this._arrowObjs.forEach(({ arrow, idx }) => {
      const active = !!this.slots[idx];
      arrow.setColor(active ? '#ffd96a' : '#3a4a5a');
      // 활성화 시 살짝 펄스
      if (active && !arrow._pulseTween) {
        arrow._pulseTween = this.tweens.add({
          targets: arrow, scale: 1.15, duration: 600,
          yoyo: true, repeat: -1, ease: 'Sine.inOut'
        });
      } else if (!active && arrow._pulseTween) {
        arrow._pulseTween.stop(); arrow._pulseTween = null;
        arrow.setScale(1);
      }
    });
  }

  // 슬롯 한 칸 그리기
  drawSlot(i) {
    const o = this.slotObjs[i];
    const w = 220, h = 70;
    o.g.clear();
    const filled = !!this.slots[i];
    o.g.fillStyle(filled ? 0x2e4a36 : 0x101a26, 1);
    o.g.fillRect(o.x - w / 2, o.y - h / 2, w, h);
    o.g.lineStyle(2, filled ? 0x7fd07f : 0x2a5a82, 1);
    o.g.strokeRect(o.x - w / 2, o.y - h / 2, w, h);
    if (filled) {
      o.t2.setText(this.slots[i].name);
      o.t2.setColor('#ffffff');
      o.t2.setStyle({ fontSize: '12px' });
    } else {
      o.t2.setText('클릭하여 단서 선택');
      o.t2.setColor('#7c8c98');
    }
  }

  // 자기성찰 5장 그리기 (선택된 것은 강조)
  drawAllStatements() {
    this.stmtObjs.forEach(s => {
      const selected = (this.statementId === s.id);
      s.g.clear();
      s.g.fillStyle(selected ? 0x2e4a36 : 0x101a26, 1);
      s.g.fillRect(s.x, s.y, s.w, s.h);
      s.g.lineStyle(2, selected ? 0x7fd07f : 0x2a5a82, 1);
      s.g.strokeRect(s.x, s.y, s.w, s.h);
      // 상단 작은 체크/원 표시
      s.g.fillStyle(selected ? 0x7fd07f : 0x2a5a82, 1);
      s.g.fillRect(s.x + 8, s.y + 8, 14, 14);
      if (selected) {
        s.g.lineStyle(2, 0xffffff, 1);
        s.g.lineBetween(s.x + 11, s.y + 15, s.x + 14, s.y + 18);
        s.g.lineBetween(s.x + 14, s.y + 18, s.x + 19, s.y + 11);
      }
      s.t.setColor(selected ? '#ffffff' : '#e6efff');
    });
  }

  // 자기성찰 카드 선택
  pickStatement(id) {
    this.statementId = (this.statementId === id) ? null : id;
    this.drawAllStatements();
    this.refreshStatus();
  }

  // 단서 선택 오버레이 열기 — 사용 가능한 단서 목록 표시
  openCluePicker(slotIndex) {
    if (this.pickerOpen) return;
    this.pickerOpen = true;
    this.activeSlot = slotIndex;

    // 이미 다른 슬롯에 사용된 단서는 제외
    const usedIds = this.slots.filter(s => s).map(s => s.id);
    const available = this.allClues.filter(c => !usedIds.includes(c.id));

    const overlay = [];
    const dim = this.add.rectangle(480, 300, 960, 600, 0x000000, 0.78)
      .setDepth(3000).setInteractive();
    overlay.push(dim);

    const panelW = 860, panelH = 460;
    const px = 480 - panelW / 2, py = 300 - panelH / 2;   // 16:10 캔버스 가운데
    const pg = this.add.graphics().setDepth(3001);
    pg.fillStyle(0x10202e, 1); pg.fillRect(px, py, panelW, panelH);
    pg.lineStyle(3, 0xc9a36b, 1); pg.strokeRect(px, py, panelW, panelH);
    overlay.push(pg);

    overlay.push(this.add.text(480, py + 22,
      '[ ' + this.slotLabels[slotIndex] + ' ]  슬롯에 넣을 단서를 골라요', {
      fontFamily: FONT_TITLE, fontSize: '16px', color: '#ffe9b8',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3002));

    if (available.length === 0) {
      overlay.push(this.add.text(480, 300,
        '사용할 수 있는 단서가 더 이상 없어요.\n다른 슬롯의 선택을 바꿔보세요.', {
        fontFamily: FONT, fontSize: '13px', color: '#cfe9ff',
        align: 'center', lineSpacing: 6
      }).setOrigin(0.5).setDepth(3002));
    } else {
      // 3단 컬럼 카드 리스트 — 단서가 많아도(사건당 최대 12개) 패널 안에 들어오게
      const cols = 3, cardW = 262, cardH = 60, gapX = 11, gapY = 8;
      available.forEach((clue, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = px + 14 + col * (cardW + gapX);
        const cy = py + 52 + row * (cardH + gapY);
        const cg = this.add.graphics().setDepth(3002);
        const draw = (hover) => {
          cg.clear();
          cg.fillStyle(hover ? 0x1a3a5c : 0x0e2238, 1);
          cg.fillRect(cx, cy, cardW, cardH);
          cg.lineStyle(2, hover ? 0xc9a36b : 0x2a5a82, 1);
          cg.strokeRect(cx, cy, cardW, cardH);
          // area 컬러 스트라이프
          const a = (typeof getArea === 'function') ? getArea(clue) : null;
          if (a) { cg.fillStyle(a.color, 1); cg.fillRect(cx, cy, 4, cardH); }
        };
        draw(false);
        overlay.push(cg);
        overlay.push(this.add.text(cx + 12, cy + 8, clue.name, {
          fontFamily: FONT, fontSize: '12px', color: '#ffe9b8',
          fontStyle: 'bold', wordWrap: { width: cardW - 20 }
        }).setDepth(3003));
        overlay.push(this.add.text(cx + 12, cy + 30,
          (clue.desc || '').slice(0, 38) + ((clue.desc || '').length > 38 ? '…' : ''), {
          fontFamily: FONT, fontSize: '10px', color: '#a8c4dc',
          wordWrap: { width: cardW - 20 }
        }).setDepth(3003));
        const zone = this.add.zone(cx + cardW / 2, cy + cardH / 2, cardW, cardH)
          .setInteractive({ useHandCursor: true }).setDepth(3004);
        zone.on('pointerover', () => draw(true));
        zone.on('pointerout', () => draw(false));
        zone.on('pointerdown', () => {
          this.slots[slotIndex] = clue;
          this.drawSlot(slotIndex);
          this.refreshStatus();
          closePicker();
        });
        overlay.push(zone);
      });
    }

    // 슬롯 비우기 버튼
    const clearBtn = fancyButton(this, 480, py + panelH - 32, 200, 32,
      '이 슬롯 비우기',
      () => {
        this.slots[slotIndex] = null;
        this.drawSlot(slotIndex);
        this.refreshStatus();
        closePicker();
      },
      { base: 0x2b3a52, hover: 0x3c5170, edge: 0x6fb7d6, text: '#dff1ff' });
    [clearBtn.g, clearBtn.zone, clearBtn.t].forEach(o => {
      o.setDepth(3005);
      overlay.push(o);
    });

    const closePicker = () => {
      overlay.forEach(o => { if (o && o.destroy) o.destroy(); });
      this.pickerOpen = false;
    };
    dim.on('pointerdown', closePicker);
  }

  // 진행 상태 표시 + 완료 버튼 활성화
  refreshStatus() {
    const filled = this.slots.filter(s => s).length;
    const stmtOk = !!this.statementId;
    if (this.statusText) {
      this.statusText.setText(
        '인과 사슬 ' + filled + '/3   ·   자기성찰 ' +
        (stmtOk ? '선택됨' : '미선택'));
      this.statusText.setColor(
        (filled === 3 && stmtOk) ? '#7fd07f' : '#cfe9ff');
    }
    // 인과 사슬 화살표 활성화 갱신
    this.refreshArrows();
  }

  // 완료 시도
  tryFinish() {
    if (this.leaving) return;
    const filled = this.slots.filter(s => s).length;
    const stmtOk = !!this.statementId;
    if (filled < 3 || !stmtOk) {
      this.flashToast(
        (filled < 3 ? '인과 사슬을 3개 모두 채워주세요. ' : '') +
        (!stmtOk ? '자기성찰 카드 1개를 선택해주세요.' : '')
      );
      return;
    }
    this.leaving = true;
    // registry에 저장 — 자기 작성 문장 포함
    this.registry.set('reflection', {
      chain: this.slots.map(s => s.id),
      chainNames: this.slots.map(s => s.name),
      statement: this.statementId,
      statementText: ((this.stmtPool || REFLECTION_STATEMENTS).find(s => s.id === this.statementId) || {}).text || '',
      userStatement: this.userStmt || '',   // 학생이 직접 쓴 한 문장 (선택)
    });
    this.registry.set('userReflection', this.userStmt || '');
    this.registry.set('reflectionDone', true);
    reportProgress(this, { reflectionDone: true, userReflection: this.userStmt || '' });

    // 부드러운 페이드아웃 → 월드로 복귀
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('WorldScene');
    });
  }

  // 취소(중도 종료)
  leaveBack() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('WorldScene');
    });
  }

  // 짧은 안내 토스트
  flashToast(msg) {
    if (this.toast && this.toast.active) this.toast.destroy();
    this.toast = this.add.text(480, 480, msg, {
      fontFamily: FONT, fontSize: '13px', color: '#ffdcdc',
      backgroundColor: '#000000cc', padding: { x: 10, y: 6 },
      align: 'center'
    }).setOrigin(0.5).setDepth(5000);
    this.time.delayedCall(2000, () => {
      if (this.toast) { this.toast.destroy(); this.toast = null; }
    });
  }
}

// ══════════════════════════════════════════════════════════════
//  UN 연설문 작성 (SpeechScene) — PEACE 마지막 E(Enacting) 확장
//  · 보고서 송부 후 진입. 세계 평화를 호소하는 짧은 연설문 조립.
//  · 학생이 카드 6장 중 3장 선택 → 자기 언어로 짧게 마무리 한 문장.
//  · 연설문은 인쇄 보고서·학습 트리에도 인용됨.
// ══════════════════════════════════════════════════════════════
const SPEECH_PHRASES = [
  { id: 'attention',  text: '저는 멀리서 이 분쟁을 지켜본 한 명의 학생입니다.' },
  { id: 'witness',    text: '제 두 눈으로 그 현장과 그곳 사람들의 삶을 보았습니다.' },
  { id: 'connect',    text: '이 일은 멀리 있는 사람의 이야기가 아니라 우리 모두의 일입니다.' },
  { id: 'demand',     text: '국제 사회의 협력으로 무너진 삶을 회복하고 사람들의 일상을 지켜야 합니다.' },
  { id: 'youth',      text: '학생인 저도 일상의 소비와 관심으로 함께 노력하겠습니다.' },
  { id: 'hope',       text: '평화는 멀리 있지 않습니다. 작은 관심에서 시작됩니다.' },
];
const SPEECH_CLOSINGS = [
  { id: 'thank',  text: '경청해 주셔서 감사합니다.' },
  { id: 'unite',  text: '함께 행동해 주십시오.' },
  { id: 'peace',  text: '평화를 위하여.' },
];

class SpeechScene extends Phaser.Scene {
  constructor() { super('SpeechScene'); }

  create() {
    setCfgBarVisible(false);
    this.cameras.main.fadeIn(280, 0, 0, 0);
    this.leaving = false;
    this.picked = new Set();        // 본문 문장 3개
    this.closing = null;             // 마무리 문장 1개

    // 배경 — UN 연단 톤
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x10202e, 0x10202e, 0x1a3a52, 0x152e44, 1);
    bg.fillRect(0, 0, GAME_W, GAME_H);

    // 상단 헤더
    panel(this, 480, 40, 880, 60, 0x1a2a3a, 0xc9a36b);
    this.add.text(480, 30, '🕊  UN 연설문 작성  ·  Enacting (E)', {
      fontFamily: FONT_TITLE, fontSize: '20px', color: '#ffe9b8',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(480, 54, 'PEACE 마지막 단계 — 세계 평화를 호소하는 짧은 연설문', {
      fontFamily: FONT, fontSize: '12px', color: '#cfe9ff'
    }).setOrigin(0.5);

    // ── 본문 문장 6장 (3개 선택) ───────────────────────────────
    this.add.text(40, 84, '①  연설문에 담을 문장 3개를 선택하세요', {
      fontFamily: FONT_TITLE, fontSize: '15px', color: '#ffd96a',
      fontStyle: 'bold'
    });

    this.phraseObjs = [];
    const cardW = 440, cardH = 56, gap = 8;
    SPEECH_PHRASES.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 40 + col * (cardW + 20);
      const y = 108 + row * (cardH + gap);
      const g = this.add.graphics();
      const draw = (sel) => {
        g.clear();
        g.fillStyle(sel ? 0x2e4a36 : 0x0e2238, 1);
        g.fillRect(x, y, cardW, cardH);
        g.lineStyle(2, sel ? 0x7fd07f : 0x2a5a82, 1);
        g.strokeRect(x, y, cardW, cardH);
        g.fillStyle(sel ? 0x7fd07f : 0x2a5a82, 1);
        g.fillRect(x, y, 4, cardH);
      };
      draw(false);
      const t = this.add.text(x + 16, y + cardH / 2, p.text, {
        fontFamily: FONT, fontSize: '12px', color: '#e6efff',
        wordWrap: { width: cardW - 30 }, lineSpacing: 2
      }).setOrigin(0, 0.5);
      const zone = this.add.zone(x + cardW / 2, y + cardH / 2, cardW, cardH)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        if (this.picked.has(p.id)) {
          this.picked.delete(p.id);
        } else if (this.picked.size < 3) {
          this.picked.add(p.id);
        }
        this.phraseObjs.forEach(po => po.draw(this.picked.has(po.id)));
        this.refreshStatus();
        if (window.SFX) window.SFX.play('click');
      });
      this.phraseObjs.push({ id: p.id, draw });
    });

    // ── 마무리 문장 3장 (1개 선택) ─────────────────────────────
    this.add.text(40, 320, '②  연설문 마무리 한 문장', {
      fontFamily: FONT_TITLE, fontSize: '15px', color: '#ffd96a',
      fontStyle: 'bold'
    });

    this.closingObjs = [];
    const cW = 280, cH = 50, cGap = 14;
    const totalCW = cW * 3 + cGap * 2;
    const startCX = (GAME_W - totalCW) / 2;
    SPEECH_CLOSINGS.forEach((c, i) => {
      const x = startCX + i * (cW + cGap);
      const y = 348;
      const g = this.add.graphics();
      const draw = (sel) => {
        g.clear();
        g.fillStyle(sel ? 0x4a3a22 : 0x0e2238, 1);
        g.fillRect(x, y, cW, cH);
        g.lineStyle(2, sel ? 0xffd96a : 0x2a5a82, 1);
        g.strokeRect(x, y, cW, cH);
      };
      draw(false);
      this.add.text(x + cW / 2, y + cH / 2, c.text, {
        fontFamily: FONT_TITLE, fontSize: '14px', color: '#ffe9b8',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      const zone = this.add.zone(x + cW / 2, y + cH / 2, cW, cH)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.closing = (this.closing === c.id) ? null : c.id;
        this.closingObjs.forEach(co => co.draw(this.closing === co.id));
        this.refreshStatus();
        if (window.SFX) window.SFX.play('click');
      });
      this.closingObjs.push({ id: c.id, draw });
    });

    // ── 미리보기 영역 ─────────────────────────────────────────
    const pvY = 412;
    const pvg = this.add.graphics();
    pvg.fillStyle(0x0a1828, 0.9); pvg.fillRect(40, pvY, 880, 100);
    pvg.lineStyle(2, 0xc9a36b, 0.8); pvg.strokeRect(40, pvY, 880, 100);
    pvg.fillStyle(0xc9a36b, 1); pvg.fillRect(40, pvY, 4, 100);

    this.add.text(54, pvY + 8, '📜 연설문 미리보기', {
      fontFamily: FONT, fontSize: '11px', color: '#c9a36b'
    });
    this.previewText = this.add.text(54, pvY + 28,
      '(아직 비어 있음 — 위 카드를 선택하면 채워집니다)', {
      fontFamily: FONT, fontSize: '13px', color: '#a8c4dc', fontStyle: 'italic',
      wordWrap: { width: 850 }, lineSpacing: 4
    });

    // ── 하단 상태 + 버튼 ──────────────────────────────────────
    this.statusText = this.add.text(480, 532, '', {
      fontFamily: FONT, fontSize: '12px', color: '#cfe9ff'
    }).setOrigin(0.5);
    this.refreshStatus();

    fancyButton(this, 280, 568, 220, 42, '🕊  연설 마치기',
      () => this.tryFinish(),
      { base: 0x4a3a22, hover: 0x6a5a3a, edge: 0xc9a36b, text: '#ffe9b8' });
    fancyButton(this, 680, 568, 220, 42, '← 나중에',
      () => this.leaveBack(),
      { base: 0x2b3a52, hover: 0x3c5170, edge: 0x6fb7d6, text: '#dff1ff' });
  }

  refreshStatus() {
    const filled = this.picked.size;
    const closingOk = !!this.closing;
    if (this.statusText) {
      this.statusText.setText(
        '본문 문장 ' + filled + '/3   ·   마무리 ' +
        (closingOk ? '선택됨' : '미선택'));
      this.statusText.setColor(
        (filled === 3 && closingOk) ? '#7fd07f' : '#cfe9ff');
    }
    // 미리보기 갱신
    if (this.previewText) {
      const pickedTexts = SPEECH_PHRASES
        .filter(p => this.picked.has(p.id))
        .map(p => p.text);
      const closingText = this.closing
        ? (SPEECH_CLOSINGS.find(c => c.id === this.closing) || {}).text
        : '';
      if (pickedTexts.length === 0 && !closingText) {
        this.previewText.setText('(아직 비어 있음 — 위 카드를 선택하면 채워집니다)');
        this.previewText.setColor('#a8c4dc');
        this.previewText.setStyle({ fontStyle: 'italic' });
      } else {
        this.previewText.setText(
          pickedTexts.join('  ') + (closingText ? '  ' + closingText : '')
        );
        this.previewText.setColor('#ffe9b8');
        this.previewText.setStyle({ fontStyle: 'normal' });
      }
    }
  }

  tryFinish() {
    if (this.leaving) return;
    if (this.picked.size < 3 || !this.closing) {
      this.flashToast('본문 3문장 + 마무리 1문장을 모두 선택해주세요.');
      return;
    }
    this.leaving = true;
    // registry에 저장 — 인쇄 보고서·학습 트리에 인용됨
    const pickedTexts = SPEECH_PHRASES
      .filter(p => this.picked.has(p.id))
      .map(p => p.text);
    const closingText = (SPEECH_CLOSINGS.find(c => c.id === this.closing) || {}).text;
    this.registry.set('speech', {
      phrases: pickedTexts,
      closing: closingText,
      fullText: pickedTexts.join(' ') + ' ' + closingText,
    });
    if (window.SFX) window.SFX.play('send');
    reportProgress(this, { speechDone: true });

    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('LearningTreeScene');
    });
  }

  leaveBack() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('LearningTreeScene');
    });
  }

  flashToast(msg) {
    if (this.toast && this.toast.active) this.toast.destroy();
    this.toast = this.add.text(480, 510, msg, {
      fontFamily: FONT, fontSize: '13px', color: '#ffdcdc',
      backgroundColor: '#000000cc', padding: { x: 10, y: 6 },
      align: 'center'
    }).setOrigin(0.5).setDepth(5000);
    this.time.delayedCall(2000, () => {
      if (this.toast) { this.toast.destroy(); this.toast = null; }
    });
  }
}


// 모바일/터치 환경 감지 (가상 D-Pad 표시 여부 등에 사용)
// — pointer가 'coarse'면 손가락 입력 환경 (폰·태블릿)
// — 너비가 800 미만이거나 세로형이면 모바일로 간주
// — URL에 ?mobile=1 가 있으면 PC에서도 강제 모바일 모드 (디버그·시연용)
window.IS_MOBILE = (function () {
  try {
    const ua  = (navigator.userAgent || '').toLowerCase();
    const uaMobile = /android|iphone|ipad|ipod|mobile|opera mini|iemobile/.test(ua);
    const coarse  = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const small   = window.innerWidth < 800 || window.innerHeight < 600;
    const forced  = /[?&]mobile=1\b/.test(location.search || '');
    return forced || uaMobile || coarse || small;
  } catch (e) { return false; }
})();

// Phaser 설정 — 모바일에서만 FIT 스케일 활성화
// PC(Electron)에서는 기존처럼 800x600 고정 — pixelArt + FIT 조합이
// 일부 환경에서 텍스처 렌더링을 깨뜨릴 수 있어 안전하게 분기.
const phaserConfig = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'game',
  backgroundColor: '#3a2f1f',
  pixelArt: true,
  input: { activePointers: 3 },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [BootScene, TitleScene, CreditsScene, CaseSelectScene, LearningTreeScene, BriefingScene, WorldScene, DialogueScene, InvestigationScene, QuizScene, ReflectionScene, LetterScene, SpeechScene]
};
if (window.IS_MOBILE) {
  phaserConfig.scale = {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game',
    width: GAME_W,
    height: GAME_H,
  };
}
const game = new Phaser.Game(phaserConfig);

// HTML cfgBar의 🔊 버튼에서 음향 설정 패널(음소거+음량)을 열 수 있도록 전역 훅
window.PEACE = window.PEACE || {};
window.PEACE.openSound = function (onClose) {
  try {
    const actives = game.scene.getScenes(true);
    const sc = actives[actives.length - 1];
    if (sc) openSoundSettings(sc, onClose);
  } catch (e) { /* 무시 */ }
};

// 모바일 — 가로/세로 회전·주소창 변동 시 캔버스 재계산
if (window.IS_MOBILE) {
  const refresh = () => { try { game.scale.refresh(); } catch (e) {} };
  window.addEventListener('resize', refresh);
  window.addEventListener('orientationchange', () => setTimeout(refresh, 200));
}
