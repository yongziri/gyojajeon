// 기초 Phaser RPG 데모 (캐릭터 그래픽 버전)
// - 코드로 픽셀 캐릭터 / 타일 / 몬스터 텍스처를 생성
// - 4방향 걷기 애니메이션
// - 벽 충돌, 적과 부딪히면 턴제 전투

const TILE = 40;

// ── 폰트 (대회 출품용 픽셀 한글) ───────────────────────────────
//  본문은 NeoDunggeunmo, 타이틀·강조는 PFStardust
const FONT = 'NeoDunggeunmo, "Malgun Gothic", sans-serif';
const FONT_TITLE = 'PFStardust, "Malgun Gothic", sans-serif';

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

// ── 라일라(아이) 픽셀 데이터 ────────────────────────────────────
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

// 현장 배경 (800 x 440)
const BG_W = 800, BG_H = 440;

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

// ── 돋보기 커서 (40x40) ─────────────────────────────────────────
const MAGNIFIER_PAL = {
  '.': null, k: 0x1a1228, w: 0xffffff, g: 0xa6c5d8,
};
const MAGNIFIER_MAP = [
  '....kkkkkkkk........',
  '...kggggggggk.......',
  '..kgwwggggggggk.....',
  '..kwwggggggggggk....',
  '.kgwggggggggggggk...',
  '.kgggggggggggggggk..',
  '.kggggggggggggggggk.',
  '..kggggggggggggggk..',
  '..kggggggggggggkk...',
  '...kkkkkkkkkkkk.....',
  '..............kk....',
  '...............kk...',
  '................kk..',
  '.................kk.',
  '..................kk',
  '...................k',
  '....................',
  '....................',
  '....................',
  '....................',
];
function drawMagnifier(g) {
  g.clear();
  pxMap(g, MAGNIFIER_MAP, MAGNIFIER_PAL, 2);
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
    // 선택 사항: assets/ 폴더에 사진이 있으면 자동으로 사용. 없으면 무시.
    this.load.image('photo_port',   'assets/port.png');
    this.load.image('photo_strait', 'assets/strait.jpg');
    this.load.image('photo_market', 'assets/market.jpg');
    // Kenney CC0 스프라이트시트 (16x16, 1px 간격)
    this.load.spritesheet('tiny_town',
      'assets/sprites/kenney_tiny_town/Tilemap/tilemap.png',
      { frameWidth: 16, frameHeight: 16, spacing: 1 });
    this.load.spritesheet('tiny_dungeon',
      'assets/sprites/kenney_tiny_dungeon/Tilemap/tilemap.png',
      { frameWidth: 16, frameHeight: 16, spacing: 1 });
    this.load.on('loaderror', () => { /* 누락 파일은 그냥 건너뜀 */ });
  }

  create() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    ['down', 'up', 'side'].forEach(dir => {
      for (let f = 0; f < 2; f++) {
        drawHero(g, dir, f);
        g.generateTexture(`hero_${dir}_${f}`, 32, 40);
      }
    });

    for (let f = 0; f < 2; f++) {
      drawChild(g, f);
      g.generateTexture(`kid_${f}`, 32, 32);
    }

    const MW = MAP[0].length * TILE, MH = MAP.length * TILE;
    drawGround(g, MW, MH);
    g.generateTexture('ground', MW, MH);
    drawWall(g);
    g.generateTexture('wall', TILE, TILE);

    drawPort(g);   g.generateTexture('bg_port', BG_W, BG_H);
    drawStrait(g); g.generateTexture('bg_strait', BG_W, BG_H);
    drawMarket(g); g.generateTexture('bg_market', BG_W, BG_H);
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

    // 폰트가 로드된 뒤에 첫 씬을 시작 (한글 글리프 누락 방지)
    const startNext = () => this.scene.start('TitleScene');
    if (document.fonts && document.fonts.ready) {
      Promise.all([
        document.fonts.load('20px NeoDunggeunmo'),
        document.fonts.load('bold 32px PFStardust'),
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
    const W = 800, H = 600;
    // 노을 그라데이션 하늘
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x1b2a4a, 0x1b2a4a, 0xe8915a, 0xf2b56b, 1);
    sky.fillRect(0, 0, W, 360);
    sky.fillStyle(0xf6d79b, 1); sky.fillCircle(400, 320, 70);
    sky.fillStyle(0xf2b56b, 0.5); sky.fillCircle(400, 320, 110);
    // 바다 + 반짝임
    sky.fillStyle(0x214b63, 1); sky.fillRect(0, 360, W, 240);
    sky.fillStyle(0xf6d79b, 0.25);
    for (let i = 0; i < 26; i++)
      sky.fillRect((i * 71) % W, 380 + (i * 53 % 200), 36, 3);
    // 도시·미너렛 실루엣
    sky.fillStyle(0x141d33, 1);
    for (let i = 0; i < 11; i++)
      sky.fillRect(i * 76, 300 - (i * 47 % 90), 64, 130);
    sky.fillRect(150, 180, 14, 180);
    sky.fillCircle(157, 178, 12);
    sky.fillRect(640, 200, 70, 160);
    sky.fillCircle(675, 200, 38);

    // 유조선 실루엣
    sky.fillStyle(0x0e1626, 1);
    sky.fillRect(470, 430, 200, 34);
    sky.fillRect(560, 408, 36, 22);

    // 타이틀 패널
    panel(this, 400, 150, 560, 150, 0x10202e, 0xe8b86a);
    this.add.text(400, 120, '사라진 바다', {
      fontFamily: FONT_TITLE, fontSize: '54px', color: '#ffe9b8', fontStyle: 'bold',
      stroke: '#3a2410', strokeThickness: 8
    }).setOrigin(0.5);
    this.add.text(400, 178, '— 아랄해, 그리고 우리들의 이야기 —', {
      fontFamily: FONT, fontSize: '20px', color: '#f0c98a'
    }).setOrigin(0.5);

    // 라일라 등장
    const kid = this.add.sprite(400, 470, 'kid_0').setScale(7);
    kid.play('kid_idle');
    this.tweens.add({
      targets: kid, y: 458, duration: 900,
      yoyo: true, repeat: -1, ease: 'Sine.inOut'
    });

    const start = this.add.text(400, 560, '▶  클릭하여 시작', {
      fontFamily: FONT, fontSize: '24px', color: '#ffffff',
      backgroundColor: '#0008', padding: { x: 16, y: 8 }
    }).setOrigin(0.5);
    this.tweens.add({
      targets: start, alpha: 0.35, duration: 700,
      yoyo: true, repeat: -1
    });

    // 시작 버튼 + 출처(Credits) 버튼
    fancyButton(this, 320, 560, 220, 44, '▶  시작하기',
      () => this.scene.start('WorldScene'),
      { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' });
    fancyButton(this, 560, 560, 200, 44, '에셋·라이선스',
      () => this.scene.start('CreditsScene'),
      { base: 0x4a3a22, hover: 0x6a5a3a, edge: 0xc9a36b, text: '#ffe9b8' });

    this.input.keyboard.once('keydown', () => this.scene.start('WorldScene'));
    start.setVisible(false); // 버튼이 생겼으니 안내 텍스트는 가림
  }
}

// ══════════════════════════════════════════════════════════════
//  Credits / 라이선스 출처 화면 — 대회 출품 필수
// ══════════════════════════════════════════════════════════════
class CreditsScene extends Phaser.Scene {
  constructor() { super('CreditsScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#10202e');

    panel(this, 400, 60, 720, 80, 0x1a2a3a, 0xe8b86a);
    this.add.text(400, 60, '에셋·라이선스 출처', {
      fontFamily: FONT_TITLE, fontSize: '28px', color: '#ffe9b8',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    panel(this, 400, 320, 720, 420, 0x101a26, 0xc9a36b);

    const txt = [
      '【게임】 사라진 바다 — 아랄해, 그리고 우리들의 이야기',
      '   ・ 교육 주제: UNESCO 세계시민교육(인지·정서·행동) 3대 영역',
      '',
      '【폰트】',
      '   ・ Neo Dunggeunmo Pro — 본문',
      '   ・ PF Stardust (Regular / Bold / ExtraBold) — 제목·강조',
      '',
      '【스프라이트 (Kenney.nl, CC0 / Public Domain)】',
      '   ・ Tiny Town — 환경 데코(트리·덤불)',
      '   ・ Tiny Dungeon — 마을 주민 NPC',
      '   ・ 1-Bit Pack — 8비트 톤 보조 에셋',
      '   ・ Pixel Platformer — 보조 캐릭터·블록',
      '   ・ 출처: https://kenney.nl  (CC0 — 표기 의무 없으나 매너상 명기)',
      '',
      '【사진】',
      '   ・ 옛 항구 무이낙(Moynaq) 픽셀아트 이미지 (학습자료용)',
      '',
      '【게임 엔진】',
      '   ・ Phaser 3 (MIT License)',
      '   ・ Electron (MIT License)',
      '',
      '【교육 이론 참고】',
      '   ・ UNESCO, Global Citizenship Education: Topics and Learning',
      '     Objectives (2015)',
      '   ・ 박미정 (2022), 「다문화사회의 세계시민교육 방안 연구」,',
      '     한국이민정책학보 5(2): 87-105',
      '',
      '【제작】',
      '   ・ 공도중학교 이용빈 교사',
      '   ・ 디지털교육연구회(디교연) · 교육자료전 출품작',
    ].join('\n');

    this.add.text(60, 140, txt, {
      fontFamily: FONT, fontSize: '14px', color: '#f3ece0',
      lineSpacing: 4
    });

    fancyButton(this, 400, 568, 240, 44, '← 처음으로',
      () => this.scene.start('TitleScene'),
      { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' });
  }
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
  const zone = scene.add.zone(x, y, w, h)
    .setInteractive({ useHandCursor: true });
  const t = scene.add.text(x, y, label, {
    fontFamily: FONT, fontSize: '18px', color: theme.text
  }).setOrigin(0.5);
  zone.on('pointerover', () => draw(theme.hover));
  zone.on('pointerout', () => draw(theme.base));
  zone.on('pointerdown', () => cb());
  return { g, zone, t };
}

class WorldScene extends Phaser.Scene {
  constructor() { super('WorldScene'); }

  create() {
    // 바닥(이음새 없는 한 장) + 벽만 타일
    this.add.image(0, 0, 'ground').setOrigin(0, 0);
    this.walls = this.physics.add.staticGroup();
    for (let r = 0; r < MAP.length; r++) {
      for (let c = 0; c < MAP[r].length; c++) {
        if (MAP[r][c] === 1) {
          const wall = this.add.image(
            c * TILE + TILE / 2, r * TILE + TILE / 2, 'wall');
          this.walls.add(wall);
        }
      }
    }

    // 플레이어
    this.player = this.physics.add.sprite(3 * TILE, 2 * TILE, 'hero_down_0');
    this.player.body.setSize(16, 14).setOffset(8, 22);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);
    this.facing = 'down';

    // 아이 (말 걸 수 있는 NPC)
    if (!this.registry.get('enemyDefeated')) {
      this.enemy = this.physics.add.sprite(15 * TILE, 9 * TILE, 'kid_0');
      this.enemy.body.setSize(20, 16).setOffset(6, 14);
      this.enemy.play('kid_idle');
      this.enemy.setDepth(this.enemy.y);
      this.physics.add.overlap(this.player, this.enemy, () => {
        if (this.talking || this.cooldown) return;
        this.talking = true;
        this.scene.pause();
        this.scene.launch('DialogueScene');
      });
    }

    // 옛 항구 조사 입구 (노란 표지판)
    this.portal = this.physics.add.staticImage(4 * TILE, 11 * TILE, 'portal');
    this.tweens.add({
      targets: this.portal, scale: 1.15, duration: 600,
      yoyo: true, repeat: -1, ease: 'Sine.inOut'
    });
    this.portal.setDepth(this.portal.y);
    this.add.text(4 * TILE, 11 * TILE - 30, '아랄해 조사', {
      fontFamily: FONT, fontSize: '12px', color: '#ffe082',
      backgroundColor: '#00000088', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(2000);
    this.physics.add.overlap(this.player, this.portal, () => {
      if (this.entering) return;
      this.entering = true;
      this.scene.start('InvestigationScene');
    });

    // UN 우편함 (편지 쓰기 입구)
    this.mailbox = this.physics.add.staticImage(12 * TILE, 11 * TILE, 'mailbox');
    this.tweens.add({
      targets: this.mailbox, scale: 1.08, duration: 700,
      yoyo: true, repeat: -1, ease: 'Sine.inOut'
    });
    this.mailbox.setDepth(this.mailbox.y);
    this.add.text(12 * TILE, 11 * TILE - 36, 'UN 편지', {
      fontFamily: FONT, fontSize: '12px', color: '#cfe9ff',
      backgroundColor: '#00000088', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(2000);
    this.physics.add.overlap(this.player, this.mailbox, () => {
      if (this.entering) return;
      const cores = (this.registry.get('coreClues') || []).length;
      const need = (typeof TOTAL_CITIZENS !== 'undefined') ? TOTAL_CITIZENS : 3;
      if (cores < need) {
        // 게이팅: 부족하면 안내 토스트만 띄우고 입장 막음
        if (this.gateToast && this.gateToast.active) return;
        this.gateToast = this.add.text(12 * TILE, 11 * TILE - 70,
          '시민들의 문제를 모두 풀어야 편지를 보낼 수 있어요\n( 핵심 단서 ' + cores + ' / ' + need + ' )', {
          fontFamily: FONT, fontSize: '13px', color: '#ffdcdc',
          backgroundColor: '#000000cc', padding: { x: 8, y: 6 },
          align: 'center'
        }).setOrigin(0.5).setDepth(2500);
        this.time.delayedCall(2200, () => {
          if (this.gateToast) { this.gateToast.destroy(); this.gateToast = null; }
        });
        return;
      }
      this.entering = true;
      this.scene.start('LetterScene');
    });

    // 테헤란풍 건물/조경
    this.solids = [];
    const building = (key, x, baseY, bw, bh) => {
      this.add.image(x, baseY, key).setOrigin(0.5, 1).setDepth(baseY);
      const body = this.add.rectangle(x, baseY - bh / 2, bw, bh, 0, 0);
      this.physics.add.existing(body, true);
      this.solids.push(body);
    };
    const prop = (key, x, baseY) =>
      this.add.image(x, baseY, key).setOrigin(0.5, 1).setDepth(baseY);

    building('mosque', 690, 132, 86, 26);
    building('minaret', 610, 132, 18, 24);
    building('house', 560, 470, 74, 24);
    building('fountain', 300, 360, 62, 16);
    prop('palm', 300, 196);
    prop('palm', 470, 478);

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
    // 침엽수 (단단·통과 불가)
    tinyProp(4, 400, 100, true, 16, 10);
    tinyProp(4, 520, 240, true, 16, 10);
    tinyProp(16, 700, 290, true, 16, 10);
    tinyProp(16, 60,  220, true, 16, 10);
    // 덤불 (통과 가능 데코)
    tinyProp(5, 440, 140, false);
    tinyProp(17, 220, 440, false);
    tinyProp(17, 160, 380, false);
    tinyProp(5,  660, 460, false);

    // 시민 NPC (Kenney Tiny Dungeon CC0) — 상호작용 + 퀴즈
    const solved = this.registry.get('quizSolved') || {};
    this.citizenObjs = [];
    CITIZENS.forEach(cz => {
      const npc = this.add.image(cz.x, cz.y, cz.sprite, cz.frame)
        .setOrigin(0.5, 1).setDepth(cz.y).setScale(2);
      this.tweens.add({
        targets: npc, y: cz.y - 2, duration: 800 + Math.random() * 400,
        yoyo: true, repeat: -1, ease: 'Sine.inOut'
      });

      // 머리 위 상태 표시: ! (미완료) 또는 ✓ (완료)
      const marker = this.add.text(cz.x, cz.y - 50,
        solved[cz.id] ? '✓' : '!', {
          fontFamily: FONT_TITLE,
          fontSize: solved[cz.id] ? '20px' : '24px',
          color: solved[cz.id] ? '#7fd07f' : '#ffe082',
          stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(cz.y + 1);
      if (!solved[cz.id]) {
        this.tweens.add({
          targets: marker, y: cz.y - 56, duration: 500,
          yoyo: true, repeat: -1, ease: 'Sine.inOut'
        });
      }

      // overlap 트리거 — QuizScene 으로
      const trigger = this.add.rectangle(cz.x, cz.y - 16, 36, 36, 0, 0);
      this.physics.add.existing(trigger, true);
      this.physics.add.overlap(this.player, trigger, () => {
        if (this.entering || this.cooldown) return;
        // 이미 풀었으면 다시 안 열리도록
        const sv = this.registry.get('quizSolved') || {};
        if (sv[cz.id]) return;
        this.entering = true;
        this.registry.set('quizCitizenId', cz.id);
        this.scene.pause();
        this.scene.launch('QuizScene');
      });
      this.citizenObjs.push({ npc, marker, trigger, cz });
    });

    this.physics.add.collider(this.player, this.solids);

    // 분위기: 따뜻한 빛 + 비네트
    const W = MAP[0].length * TILE, H = MAP.length * TILE;
    const mood = this.add.graphics().setDepth(1500);
    mood.fillStyle(0xffd9a0, 0.10); mood.fillRect(0, 0, W, H);
    mood.fillStyle(0x1a1430, 0.30);
    mood.fillRect(0, 0, W, 24); mood.fillRect(0, H - 24, W, 24);
    mood.fillRect(0, 0, 24, H); mood.fillRect(W - 24, 0, 24, H);
    mood.fillStyle(0x1a1430, 0.18);
    mood.fillRect(0, 24, W, 14); mood.fillRect(0, H - 38, W, 14);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.add.text(10, 8,
      '아랄해 마을 · 아이졸리=대화 · 표지판=조사 · 시민(!)=문제 · 우편함=UN편지', {
      fontFamily: FONT, fontSize: '12px', color: '#ffffff',
      backgroundColor: '#00000066', padding: { x: 6, y: 3 }
    }).setDepth(2000);

    // 핵심 단서 HUD (우상단) — resume에서 갱신
    this.coreHud = this.add.text(790, 8, '', {
      fontFamily: FONT, fontSize: '13px', color: '#ffe082',
      backgroundColor: '#00000088', padding: { x: 6, y: 3 }
    }).setOrigin(1, 0).setDepth(2000);
    this.refreshCoreHud();

    // 다른 씬(오버레이)에서 돌아올 때 상태 동기화
    this.events.on('resume', () => this.onResume());

    this.add.text(400, 580,
      '주제: 사라진 아랄해 — 아이졸리·시민들과 대화하고 옛 바다를 조사하세요', {
      fontFamily: FONT, fontSize: '13px', color: '#ffe082',
      backgroundColor: '#000000aa', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(2000);
  }

  update() {
    const p = this.player;
    if (!p || !p.body) return;
    const speed = 150;
    p.body.setVelocity(0);

    let moving = false;
    let dir = this.facing;

    if (this.cursors.left.isDown) {
      p.body.setVelocityX(-speed); dir = 'side'; p.setFlipX(true); moving = true;
    } else if (this.cursors.right.isDown) {
      p.body.setVelocityX(speed); dir = 'side'; p.setFlipX(false); moving = true;
    }
    if (this.cursors.up.isDown) {
      p.body.setVelocityY(-speed); dir = 'up'; moving = true;
    } else if (this.cursors.down.isDown) {
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
  }

  refreshCoreHud() {
    if (!this.coreHud) return;
    const cores = (this.registry.get('coreClues') || []).length;
    const total = (typeof TOTAL_CITIZENS !== 'undefined') ? TOTAL_CITIZENS : 3;
    this.coreHud.setText('🔑 핵심 단서 ' + cores + ' / ' + total);
  }

  // 오버레이(대화/퀴즈)가 닫힌 직후 호출됨
  onResume() {
    this.talking = false;
    this.entering = false;
    // 잠시 cooldown — 같은 NPC와 다시 즉시 트리거되는 것 방지
    this.cooldown = true;
    this.time.delayedCall(700, () => { this.cooldown = false; });

    // 아이졸리 친구 됨 처리
    if (this.registry.get('enemyDefeated') && this.enemy && this.enemy.scene) {
      this.enemy.destroy();
      this.enemy = null;
    }

    // 시민 풀이 완료 마커 갱신 (! → ✓)
    const solved = this.registry.get('quizSolved') || {};
    if (this.citizenObjs) {
      this.citizenObjs.forEach(co => {
        if (solved[co.cz.id] && co.marker && co.marker.text === '!') {
          co.marker.setText('✓').setFontSize(20).setColor('#7fd07f');
          this.tweens.killTweensOf(co.marker);
          co.marker.setY(co.cz.y - 50);
        }
      });
    }

    this.refreshCoreHud();
  }
}

// ── 미연시 스타일 대화 장면 ─────────────────────────────────────
class DialogueScene extends Phaser.Scene {
  constructor() { super('DialogueScene'); }

  create() {
    this.love = this.registry.get('slimeLove') || 0;

    // 배경 없음 — 월드 위에 오버레이. 살짝 어둡게 깔아 가독성↑
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.45);

    // 좌측 큰 캐릭터 (RPG Maker 스타일)
    this.portrait = this.add.sprite(160, 410, 'kid_0')
      .setOrigin(0.5, 1).setScale(10).setDepth(5);
    this.portrait.play('kid_idle');
    this.tweens.add({
      targets: this.portrait, y: 405, duration: 900,
      yoyo: true, repeat: -1, ease: 'Sine.inOut'
    });

    // 우상단 이해도 칩
    panel(this, 712, 30, 160, 40, 0x12283a, 0x6fb7d6);
    this.loveText = this.add.text(712, 30, '', {
      fontFamily: FONT, fontSize: '16px', color: '#bfe6ff'
    }).setOrigin(0.5);

    // 하단 대사 박스 (전체 너비)
    panel(this, 400, 510, 780, 170, 0x0c1620, 0xe8b86a);

    // 이름표 [아이졸리] - 박스 상단 좌측
    this.nameText = this.add.text(54, 438, '', {
      fontFamily: FONT_TITLE, fontSize: '20px', color: '#ffd96a',
      fontStyle: 'bold'
    }).setOrigin(0, 0);

    // 본문
    this.bodyText = this.add.text(54, 472, '', {
      fontFamily: FONT, fontSize: '20px', color: '#f3ece0',
      wordWrap: { width: 700 }, lineSpacing: 8
    });

    // 하단 ▼ 진행 안내
    this.hint = this.add.text(750, 578, '▼', {
      fontFamily: FONT, fontSize: '18px', color: '#e8b86a'
    }).setOrigin(1, 1);
    this.tweens.add({
      targets: this.hint, alpha: 0.3, duration: 600,
      yoyo: true, repeat: -1
    });

    this.choiceBtns = [];
    this.show('start');

    this.input.on('pointerdown', () => this.onClick());
    this.input.keyboard.on('keydown-SPACE', () => this.onClick());
  }

  updateLove() {
    this.loveText.setText('📘 이해도: ' + this.love);
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
  }

  onClick() {
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
    // 본문 위에 선택지 — 본문 영역을 보조 문구로 비우고
    this.bodyText.setText('');
    choices.forEach((ch, idx) => {
      const y = 478 + idx * 36;
      const b = fancyButton(this, 460, y, 560, 30, ch.label,
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
    if (ch.battle) {
      this.scene.start('BattleScene');
    } else if (ch.next) {
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
    // 오버레이 종료 후 월드 재개
    this.scene.stop();
    this.scene.resume('WorldScene');
  }
}

// ── 역전재판식 현장 조사 장면 ───────────────────────────────────
class InvestigationScene extends Phaser.Scene {
  constructor() { super('InvestigationScene'); }

  create() {
    this.locId = this.registry.get('invLoc') || CASE.start;
    this.collected = this.registry.get('evidence') || [];
    this.examine = false;
    this.overlay = [];

    const loc = CASE.locations[this.locId];

    // 배경
    // 사진이 있으면 사진 사용, 없으면 코드로 그린 배경 사용
    const photoMap = {
      bg_port: 'photo_port',
      bg_strait: 'photo_strait',
      bg_market: 'photo_market'
    };
    const photoKey = photoMap[loc.bg];
    if (photoKey && this.textures.exists(photoKey)) {
      const photo = this.add.image(400, BG_H / 2, photoKey).setDisplaySize(800, BG_H);
      // 사진도 도트 풍으로 픽셀화
      // 8비트 청크감 — 픽셀 블록 크기 ↑
      if (photo.postFX && photo.postFX.addPixelate) photo.postFX.addPixelate(8);
    } else {
      this.add.image(400, BG_H / 2, loc.bg);
    }
    // 장소 이름 칩
    const np = this.add.graphics().setDepth(5);
    const nw = loc.name.length * 22 + 60;
    np.fillStyle(0x000000, 0.35); np.fillRoundedRect(17, 15, nw, 38, 10);
    np.fillStyle(0x101a26, 0.92); np.fillRoundedRect(14, 12, nw, 38, 10);
    np.lineStyle(2, 0xe8b86a, 1); np.strokeRoundedRect(14, 12, nw, 38, 10);
    this.add.text(30, 31, '🔍 ' + loc.name, {
      fontFamily: FONT, fontSize: '20px', color: '#ffe9b8'
    }).setOrigin(0, 0.5).setDepth(6);

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

    // 하단 명령 바
    const bar = this.add.graphics().setDepth(4);
    bar.fillStyle(0x000000, 0.4); bar.fillRect(0, 440, 800, 160);
    bar.fillGradientStyle(0x14202c, 0x14202c, 0x0c141c, 0x0c141c, 1);
    bar.fillRect(6, 446, 788, 148);
    bar.lineStyle(2, 0xe8b86a, 1); bar.strokeRect(6, 446, 788, 148);
    bar.lineStyle(1, 0xe8b86a, 0.25); bar.strokeRect(11, 451, 778, 138);
    this.msg = this.add.text(36, 462, '명령을 선택하세요.', {
      fontFamily: FONT, fontSize: '19px', color: '#f3ece0',
      wordWrap: { width: 728 }, lineSpacing: 6
    }).setDepth(5);

    this.btnExamine = this.makeBtn(120, 565, 150, '조사한다',
      () => this.toggleExamine());
    this.makeBtn(290, 565, 150, '이동한다', () => this.showMoves(loc));
    this.makeBtn(470, 565, 150, '법정 기록', () => this.showRecord());
    this.makeBtn(650, 565, 130, '나가기', () => this.leave());

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
    const zone = this.add.zone(x, y, w, h)
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
    this.zones.forEach(z => z.setFillStyle(0xffe082, this.examine ? 0.14 : 0));
    this.btnExamine.t.setText(this.examine ? '조사 종료' : '조사한다');
    this.msg.setText(this.examine
      ? '돋보기로 살펴볼 곳을 클릭하세요. (ESC: 취소)'
      : '명령을 선택하세요.');
  }

  inspect(spot) {
    let text = '【' + spot.name + '】\n' + spot.text;
    if (spot.evidence && !this.collected.find(e => e.id === spot.evidence.id)) {
      this.collected.push(spot.evidence);
      this.registry.set('evidence', this.collected);
      text += '\n\n★ 증거 입수: ' + spot.evidence.name;
      this.flash('증거 입수!');
      if (this.collected.length >= this.totalEvidence()) {
        text += '\n\n(모든 증거를 모았습니다! 총 '
          + this.collected.length + '개)';
      }
    }
    this.msg.setText(text);
  }

  totalEvidence() {
    let n = 0;
    Object.values(CASE.locations).forEach(l =>
      l.spots.forEach(s => { if (s.evidence) n++; }));
    return n;
  }

  flash(label) {
    const t = this.add.text(400, 230, label, {
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
      const b = fancyButton(this, 400, y, 380, 40, '▶  ' + m.label, () => {
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
    const bg = this.add.rectangle(400, 300, 800, 600, 0x070b12, 0.88)
      .setDepth(30).setInteractive();
    const tp = this.add.graphics().setDepth(31);
    tp.fillStyle(0x101a26, 0.95); tp.fillRoundedRect(250, 36, 300, 46, 12);
    tp.lineStyle(2, 0xe8b86a, 1); tp.strokeRoundedRect(250, 36, 300, 46, 12);
    const title = this.add.text(400, 59, '📘  수집한 단서', {
      fontFamily: FONT, fontSize: '23px', color: '#ffe9b8'
    }).setOrigin(0.5).setDepth(32);
    this.overlay.push(bg, tp, title);

    if (this.collected.length === 0) {
      this.overlay.push(this.add.text(400, 280,
        '아직 모은 증거가 없습니다.', {
          fontFamily: FONT, fontSize: '20px', color: '#ffffff'
        }).setOrigin(0.5).setDepth(31));
    } else {
      this.collected.forEach((e, i) => {
        const y = 120 + i * 90;
        this.overlay.push(this.add.text(70, y,
          '● ' + e.name + '\n   ' + e.desc, {
            fontFamily: FONT, fontSize: '18px', color: '#ffffff',
            wordWrap: { width: 660 }, lineSpacing: 4
          }).setDepth(31));
      });
    }
    const close = this.add.text(400, 545, '[ 닫기 ]', {
      fontFamily: FONT, fontSize: '20px', color: '#ffe082'
    }).setOrigin(0.5).setDepth(31);
    close.setInteractive({ useHandCursor: true });
    const done = () => this.clearOverlay();
    close.on('pointerdown', done);
    bg.on('pointerdown', done);
    this.overlay.push(close);
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
    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.5);

    // 좌측 큰 NPC 초상
    this.portrait = this.add.sprite(160, 410, this.citizen.sprite, this.citizen.frame)
      .setOrigin(0.5, 1).setScale(12).setDepth(5);
    this.tweens.add({
      targets: this.portrait, y: 405, duration: 900,
      yoyo: true, repeat: -1, ease: 'Sine.inOut'
    });

    // 하단 대사 박스
    panel(this, 400, 510, 780, 170, 0x0c1620, 0xe8b86a);
    this.nameText = this.add.text(54, 438, '[' + this.citizen.name + ']', {
      fontFamily: FONT_TITLE, fontSize: '20px', color: '#ffd96a',
      fontStyle: 'bold'
    }).setOrigin(0, 0);

    this.bodyText = this.add.text(54, 472, '', {
      fontFamily: FONT, fontSize: '18px', color: '#f3ece0',
      wordWrap: { width: 700 }, lineSpacing: 6
    });

    this.hint = this.add.text(750, 578, '▼', {
      fontFamily: FONT, fontSize: '18px', color: '#e8b86a'
    }).setOrigin(1, 1);
    this.tweens.add({
      targets: this.hint, alpha: 0.3, duration: 600,
      yoyo: true, repeat: -1
    });

    this.choiceObjs = [];

    this.input.on('pointerdown', () => this.onClick());
    this.input.keyboard.on('keydown-SPACE', () => this.onClick());

    this.showIntroLine();
  }

  showIntroLine() {
    const lines = this.citizen.intro;
    this.bodyText.setText(lines[this.lineIdx]);
    this.hint.setVisible(true);
  }

  onClick() {
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
    this.hint.setVisible(false);
    const q = this.citizen.quiz;
    this.bodyText.setText('【문제】 ' + q.question +
      '\n\n💡 힌트: ' + q.hint);

    // 보기 버튼 — 화면 우측에 세로 배치 (캐릭터 가리지 않도록)
    this.clearChoices();
    q.choices.forEach((ch, i) => {
      const y = 130 + i * 60;
      const b = fancyButton(this, 540, y, 460, 48,
        String.fromCharCode(65 + i) + ') ' + ch.text,
        () => this.pickAnswer(i),
        { base: 0x1c3344, hover: 0x2c5066, edge: 0x6fb7d6, text: '#dff1ff' });
      this.choiceObjs.push(b.g, b.zone, b.t);
    });
  }

  clearChoices() {
    this.choiceObjs.forEach(o => o.destroy());
    this.choiceObjs = [];
  }

  pickAnswer(idx) {
    if (this.locked) return;
    const ch = this.citizen.quiz.choices[idx];
    if (ch.correct) this.handleCorrect(ch);
    else this.handleWrong(ch);
  }

  handleWrong(ch) {
    this.locked = true;
    this.clearChoices();
    this.bodyText.setText('【오답】 ' + ch.feedback +
      '\n\n다시 한 번 생각해 봐요...');
    this.time.delayedCall(1600, () => {
      this.locked = false;
      this.showQuestion();
    });
  }

  handleCorrect(ch) {
    this.locked = true;
    this.clearChoices();
    const reward = this.citizen.quiz.reward;

    const core = this.registry.get('coreClues') || [];
    if (!core.find(c => c.id === reward.id)) {
      core.push(reward);
      this.registry.set('coreClues', core);
    }
    const solved = this.registry.get('quizSolved') || {};
    solved[this.citizen.id] = true;
    this.registry.set('quizSolved', solved);

    this.bodyText.setText('【정답!】 ' + ch.feedback +
      '\n\n★ 핵심 단서 획득: ' + reward.name +
      '\n   "' + reward.desc + '"');

    const flash = this.add.text(400, 230, '★ 핵심 단서 ★', {
      fontFamily: FONT_TITLE, fontSize: '36px', color: '#ffe082',
      stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({
      targets: flash, scale: 1.5, alpha: 0, duration: 1400,
      onComplete: () => flash.destroy()
    });

    const have = (this.registry.get('coreClues') || []).length;
    this.time.delayedCall(2200, () => {
      this.bodyText.setText('핵심 단서 ' + have + '/' + TOTAL_CITIZENS +
        (have >= TOTAL_CITIZENS ?
          '   모두 모았어요! 우편함으로 가보세요.' :
          '   아직 시민이 더 있어요.'));
    });

    this.time.delayedCall(2900, () => {
      this.scene.stop();
      this.scene.resume('WorldScene');
    });
  }
}

// ══════════════════════════════════════════════════════════════
//  UN 편지 쓰기 (LetterScene)
//  — UNESCO 세계시민교육 "행동적 역량" 단계
//  — 조사로 모은 단서 + 학생의 다짐을 모아 편지로 출력
// ══════════════════════════════════════════════════════════════
class LetterScene extends Phaser.Scene {
  constructor() { super('LetterScene'); }

  create() {
    this.collected = this.registry.get('evidence') || [];
    this.mode = 'compose'; // compose | preview | sent

    // 선택 상태
    this.recipient = 0; // 0=UN환경계획, 1=유네스코, 2=환경부
    this.factPicks = new Set(); // 증거 id (최대 3개)
    this.pledgePicks = new Set(); // 다짐 인덱스 (최대 3개)

    // 보낼 곳 후보
    this.RECIPIENTS = [
      { short: 'UN 환경계획(UNEP)', long: 'UN 환경계획(UNEP) 귀하에게' },
      { short: '유네스코(UNESCO)',  long: '유네스코(UNESCO) 귀하에게' },
      { short: '대한민국 환경부',    long: '대한민국 환경부 귀하에게' },
    ];

    // 학생이 고르는 다짐 카드
    this.PLEDGES = [
      '옷을 오래 입고 꼭 필요한 것만 사겠습니다.',
      '환경·물 관련 뉴스에 꾸준히 관심을 갖겠습니다.',
      '친구들과 가족에게 이 이야기를 알리겠습니다.',
      '학교에서 환경 동아리·캠페인에 참여하겠습니다.',
      '물을 아껴 쓰고, 한 번 더 생각하고 소비하겠습니다.',
    ];

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
    panel(this, 400, 300, 780, 580, 0xefe6cc, 0x6a4f2a);
    // 헤더 띠
    const hdr = this.add.graphics().setDepth(2);
    hdr.fillStyle(0x6a4f2a, 1); hdr.fillRect(20, 24, 760, 50);
    this.add.text(400, 49, '🕊  UN에 보내는 편지', {
      fontFamily: FONT_TITLE, fontSize: '24px', color: '#ffe9b8', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // 1) 받는 곳
    this.sectionLabel(40, 96, '1. 누구에게 보낼까요?');
    this.RECIPIENTS.forEach((r, i) => {
      const x = 50 + i * 240, y = 124;
      const btn = fancyButton(this, x + 110, y + 18, 220, 38, r.short,
        () => { this.recipient = i; this.buildCompose(); },
        i === this.recipient
          ? { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' }
          : { base: 0x4a3a22, hover: 0x6a5a3a, edge: 0xc9a36b, text: '#ffe9b8' });
    });

    // 2) 알게 된 사실 (수집한 단서 중 최대 3개)
    this.sectionLabel(40, 176, '2. 내가 알게 된 사실 (최대 3개 선택)');
    if (this.collected.length === 0) {
      this.add.text(50, 206, '  먼저 조사를 통해 단서를 모아 주세요.', {
        fontFamily: FONT, fontSize: '16px', color: '#7a3a3a'
      }).setDepth(3);
    } else {
      this.collected.forEach((ev, i) => {
        const y = 206 + i * 30;
        if (y > 380) return; // 영역 초과 방지
        this.checkRow(50, y, 700, ev.name, this.factPicks.has(ev.id), () => {
          if (this.factPicks.has(ev.id)) this.factPicks.delete(ev.id);
          else if (this.factPicks.size < 3) this.factPicks.add(ev.id);
          this.buildCompose();
        });
      });
    }

    // 3) 나의 다짐 (최대 3개)
    this.sectionLabel(40, 396, '3. 나의 다짐 (최대 3개 선택)');
    this.PLEDGES.forEach((p, i) => {
      const y = 426 + i * 28;
      this.checkRow(50, y, 700, p, this.pledgePicks.has(i), () => {
        if (this.pledgePicks.has(i)) this.pledgePicks.delete(i);
        else if (this.pledgePicks.size < 3) this.pledgePicks.add(i);
        this.buildCompose();
      });
    });

    // 하단 버튼
    const ready = this.factPicks.size > 0 && this.pledgePicks.size > 0;
    fancyButton(this, 250, 575, 200, 44,
      ready ? '미리보기 →' : '단서·다짐 선택', () => {
        if (ready) this.buildPreview();
      },
      ready
        ? { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' }
        : { base: 0x555555, hover: 0x555555, edge: 0x999999, text: '#cccccc' });
    fancyButton(this, 550, 575, 200, 44, '← 마을로 돌아가기',
      () => this.scene.start('WorldScene'),
      { base: 0x4a3a22, hover: 0x6a5a3a, edge: 0xc9a36b, text: '#ffe9b8' });
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
    const zone = this.add.zone(x + w / 2, y + 9, w, 22)
      .setInteractive({ useHandCursor: true }).setDepth(4);
    zone.on('pointerdown', () => cb());
  }

  // ── 미리보기 화면 ─────────────────────────────────────────
  buildPreview() {
    this.mode = 'preview';
    this.clearAll();

    panel(this, 400, 300, 780, 580, 0xfff8e7, 0x6a4f2a);
    // 헤더 띠
    const hdr = this.add.graphics().setDepth(2);
    hdr.fillStyle(0x6a4f2a, 1); hdr.fillRect(20, 24, 760, 40);
    this.add.text(400, 44, '🕊  편지 미리보기', {
      fontFamily: FONT, fontSize: '20px', color: '#ffe9b8', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // 편지 본문 조립
    const r = this.RECIPIENTS[this.recipient];
    const date = new Date().toISOString().slice(0, 10);
    const facts = this.collected
      .filter(ev => this.factPicks.has(ev.id))
      .map(ev => '  · ' + ev.name + ' — ' + ev.desc);
    const pledges = [...this.pledgePicks].sort()
      .map(i => '  □ ' + this.PLEDGES[i]);

    const body =
`${date}

${r.long}

저는 한국에서 살고 있는 한 학생입니다.

저는 카라칼팍 마을의 아이졸리를 만나고,
사라진 아랄해의 옛 항구를 직접 조사하며
다음과 같은 사실을 알게 되었습니다.

${facts.join('\n')}

이 일은 그곳 사람들만의 일이 아니라,
멀리 떨어진 우리들의 삶과도 연결되어 있다는 점을
잊지 않겠습니다.

저는 이 문제를 위해 다음을 다짐합니다.

${pledges.join('\n')}

국제사회와 우리나라가 함께 협력하여,
다시는 이런 비극이 반복되지 않기를 진심으로 바랍니다.
작은 관심이 모여 사라진 바다도 되살릴 수 있다고 믿습니다.

한국에서, 작은 시민이 드림.`;

    this.add.text(40, 78, body, {
      fontFamily: FONT, fontSize: '14px', color: '#1a1a2e',
      wordWrap: { width: 720 }, lineSpacing: 4
    }).setDepth(3);

    // 하단 버튼
    fancyButton(this, 250, 575, 200, 44, '← 다시 고치기',
      () => this.buildCompose(),
      { base: 0x4a3a22, hover: 0x6a5a3a, edge: 0xc9a36b, text: '#ffe9b8' });
    fancyButton(this, 550, 575, 200, 44, '✉  편지 보내기',
      () => this.buildSent(body),
      { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' });
  }

  // ── 발송 완료 / 엔딩 ──────────────────────────────────────
  buildSent(body) {
    this.mode = 'sent';
    this.clearAll();

    // 어두운 배경 + 빛 한 줄기
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0e1a, 1); bg.fillRect(0, 0, 800, 600);
    bg.fillStyle(0xf6d79b, 0.10);
    bg.fillRect(0, 0, 800, 100);

    panel(this, 400, 110, 700, 130, 0x1a2a3a, 0xffe9b8);
    this.add.text(400, 92, '✨  편지가 세상으로 전해졌습니다  ✨', {
      fontFamily: FONT, fontSize: '22px', color: '#ffe9b8', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(400, 132,
      '여러분의 한 통의 편지가 사라진 바다를 향한 작은 빛이 됩니다.', {
      fontFamily: FONT, fontSize: '15px', color: '#f0c98a'
    }).setOrigin(0.5);

    // 완성 편지 패널
    panel(this, 400, 360, 760, 420, 0xfff8e7, 0x6a4f2a);
    this.add.text(40, 170, body, {
      fontFamily: FONT, fontSize: '13px', color: '#1a1a2e',
      wordWrap: { width: 720 }, lineSpacing: 3
    });

    this.add.text(400, 552, '💡 이 화면을 캡처해 저장하면 편지 결과물로 사용할 수 있어요',
      { fontFamily: FONT, fontSize: '13px', color: '#ffe082' }).setOrigin(0.5);
    fancyButton(this, 280, 580, 200, 36, '에셋·라이선스 보기',
      () => this.scene.start('CreditsScene'),
      { base: 0x4a3a22, hover: 0x6a5a3a, edge: 0xc9a36b, text: '#ffe9b8' });
    fancyButton(this, 520, 580, 200, 36, '처음으로',
      () => this.scene.start('TitleScene'),
      { base: 0x2e6b58, hover: 0x3e8b73, edge: 0xffe9b8, text: '#ffffff' });
  }
}

class BattleScene extends Phaser.Scene {
  constructor() { super('BattleScene'); }

  create() {
    this.playerHp = this.registry.get('playerHp') || 30;
    this.enemyHp = 20;
    this.over = false;

    this.cameras.main.setBackgroundColor('#15152b');
    this.add.text(400, 45, '⚔  전  투  ⚔', {
      fontFamily: FONT, fontSize: '28px', color: '#ffd54f'
    }).setOrigin(0.5);

    // 적
    const slime = this.add.sprite(400, 170, 'kid_0').setScale(3);
    slime.play('kid_idle');
    this.tweens.add({
      targets: slime, y: 160, duration: 600,
      yoyo: true, repeat: -1, ease: 'Sine.inOut'
    });
    this.enemyHpText = this.add.text(400, 240, '', {
      fontFamily: FONT, fontSize: '20px', color: '#ce93d8'
    }).setOrigin(0.5);

    // 아군
    const hero = this.add.sprite(400, 330, 'hero_up_0').setScale(3);
    this.tweens.add({
      targets: hero, scaleY: 3.1, duration: 500,
      yoyo: true, repeat: -1, ease: 'Sine.inOut'
    });
    this.playerHpText = this.add.text(400, 385, '', {
      fontFamily: FONT, fontSize: '20px', color: '#a5d6a7'
    }).setOrigin(0.5);

    this.log = this.add.text(400, 425, '명령을 선택하세요', {
      fontFamily: FONT, fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5);

    this.makeButton(300, 500, '공격', () => this.attack());
    this.makeButton(500, 500, '도망', () => this.flee());

    this.refresh();
  }

  makeButton(x, y, label, onClick) {
    const btn = this.add.rectangle(x, y, 140, 50, 0x3949ab)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: FONT, fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0x5c6bc0));
    btn.on('pointerout', () => btn.setFillStyle(0x3949ab));
    btn.on('pointerdown', () => { if (!this.over) onClick(); });
  }

  refresh() {
    this.enemyHpText.setText('상대 HP: ' + Math.max(0, this.enemyHp));
    this.playerHpText.setText('내 HP: ' + Math.max(0, this.playerHp));
  }

  attack() {
    const dmg = Phaser.Math.Between(4, 9);
    this.enemyHp -= dmg;
    if (this.enemyHp <= 0) { this.refresh(); return this.win(); }
    const back = Phaser.Math.Between(3, 7);
    this.playerHp -= back;
    this.log.setText(`${dmg} 피해! 상대의 반격 ${back} 피해.`);
    this.refresh();
    if (this.playerHp <= 0) this.lose();
  }

  flee() {
    this.registry.set('playerHp', this.playerHp);
    this.scene.start('WorldScene');
  }

  win() {
    this.over = true;
    this.registry.set('enemyDefeated', true);
    this.registry.set('playerHp', 30);
    this.log.setText('승리! 클릭하면 계속');
    this.input.once('pointerdown', () => this.scene.start('WorldScene'));
  }

  lose() {
    this.over = true;
    this.log.setText('패배... 클릭하면 처음부터');
    this.input.once('pointerdown', () => {
      this.registry.set('enemyDefeated', false);
      this.registry.set('playerHp', 30);
      this.scene.start('WorldScene');
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  backgroundColor: '#3a2f1f',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [BootScene, TitleScene, CreditsScene, WorldScene, DialogueScene, InvestigationScene, QuizScene, LetterScene, BattleScene]
});
