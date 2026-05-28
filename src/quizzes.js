// 사건별 시민 NPC + 퀴즈 — P.E.A.C.E. 3·4단계 (분석·핵심 단서)
//
// 게임 흐름
//   1) 안내자와 대화 — 역사·문화 배경
//   2) 3개 장소 조사 — 단서 수집
//   3) 시민 NPC 3명과 대화 → 문제 받기                ← 여기
//   4) 단서로 문제 풀어 "핵심 단서" 획득                ← 여기
//   5) 핵심 단서 3개 모이면 UN 보고서·연설 잠금 해제
//
// 다중 사건 지원:
//   CITIZENS_BY_CASE.aralsea = [...]
//   CITIZENS_BY_CASE.ukraine = [...]
// CaseSelectScene 에서 setCitizens(id) 호출 시 활성 사건 전환.
//
//   id      : 시민 고유 키
//   name    : 화면에 표시될 이름
//   sprite  : 텍스처 키 (tiny_dungeon 등)
//   frame   : 스프라이트시트 프레임 번호
//   x, y    : 월드맵 배치 좌표
//   intro   : NPC가 처음 말 걸 때 보여줄 대사 배열 (한 줄씩)
//   quiz    : { question, hint, choices: [{ text, correct }], reward }
//   reward  : 정답 시 획득할 핵심 단서 { id, name, desc }

const CITIZENS_BY_CASE = {

  // ══════════════════════════════════════════════════════════
  //  사건 1 — 아랄해
  // ══════════════════════════════════════════════════════════
  aralsea: [

  // ── 1) 어부 할아버지 — "공동체의 기억" ───────────────────
  {
    id: 'fisher',
    name: '옛 어부 할아버지',
    sprite: 'tiny_dungeon',
    frame: 96,
    // 대화창에서 보여줄 큰 일러스트 (있으면 우선 사용)
    portrait: 'portrait_fisher',
    x: 170, y: 240,    // 좌상단 — 분수 위쪽, 옛 어부가 마을 풍경 보는 자리
    intro: [
      '오, 조사관님. UN에서 정말 오셨군.',
      '내 젊었을 적엔 이 마을 절반이 어부였다네.',
      '아침마다 부두에 배가 가득 묶여 있었지... 보고서엔 그것도 적어주게.',
      '한 가지만 자네에게 물어봐도 되겠나?',
    ],
    quiz: {
      question: '내가 젊었던 시절, 우리 마을이 한 해 잡던 물고기 양은 얼마쯤이었을까?',
      hint: '옛 항구를 조사하다 보면 "4만 톤의 기억"이라는 단서가 보였을걸세.',
      choices: [
        { text: '한 해 약 4천 톤',  correct: false,
          feedback: '음, 그 정도였다면 마을이 그렇게 크지도 않았을 거란다.' },
        { text: '한 해 약 4만 톤',  correct: true,
          feedback: '맞아. 그게 옛날 우리 마을의 풍요였지.' },
        { text: '한 해 약 40만 톤', correct: false,
          feedback: '하하, 그 정도면 세계 최대 어장이지. 우리 마을은 그 정도는 아니었어.' },
      ],
      reward: {
        id: 'community', area: 'emotional',
        name: '공동체의 기억',
        desc: '한 마을 약 4만 명이 어업으로 함께 살았다. 바다가 떠나자 사람들도 흩어졌다.'
      }
    }
  },

  // ── 2) 시장 옷가게 상인 — "끊긴 강물" ─────────────────────
  {
    id: 'merchant',
    name: '옷가게 상인',
    sprite: 'tiny_dungeon',
    frame: 84,
    // 대화창에서 보여줄 큰 일러스트 (있으면 우선 사용)
    portrait: 'portrait_merchant',
    x: 440, y: 200,    // 가운데 위 — 모스크 옆 시장
    intro: [
      '어서 오세요. 이 옷, 면화 100%예요.',
      '이 면화가 어디서 왔는지 아세요?',
      '저 사라진 바다로 흘러들던 강 — 그 물을 마시며 자라요.',
      '한 가지 알려드릴게요. 맞춰보실래요?',
    ],
    quiz: {
      question: '면화 한 송이를 키우려면 이 지역의 강물을 얼마나 써야 할까요?',
      hint: '지도실에서 본 "재앙의 원인 — 강물 우회" 단서가 힌트예요.',
      choices: [
        { text: '비가 오면 충분해요',                       correct: false,
          feedback: '안타깝게도 이 사막 지역은 비가 거의 안 와요.' },
        { text: '호수까지 흘러갈 만큼만 쓰면 돼요',        correct: false,
          feedback: '그 정도였다면 호수가 안 말랐겠죠.' },
        { text: '호수로 가던 강물을 거의 다 끌어 써요',   correct: true,
          feedback: '맞아요. 그래서 두 강이 바다에 닿지 못하게 됐어요.' },
      ],
      reward: {
        id: 'river', area: 'cognitive',
        name: '끊긴 강물',
        desc: '아무다리야·시르다리야 두 강이 면화 농장으로 끌려가, 호수에 닿지 못하게 됐다.'
      }
    }
  },

  // ── 3) 마을 의사 — "건강의 상처" ───────────────────────
  {
    id: 'doctor',
    name: '마을 의사',
    sprite: 'tiny_dungeon',
    frame: 85,
    // 대화창에서 보여줄 큰 일러스트 (있으면 우선 사용)
    portrait: 'portrait_doctor',
    x: 820, y: 320,    // 우중 — 진료소, 안내인과 적당 거리
    intro: [
      '안녕하세요, 조사관님. 진료소를 잠깐 비웠어요.',
      '여기선 다른 지역보다 유독 많은 환자가 있어요.',
      '소금과 농약이 섞인 가루가 매일 바람에 날려와서요.',
      '조사관님, 한 가지만 여쭤도 될까요?',
    ],
    quiz: {
      question: '우리 마을 아이들이 다른 지역보다 유독 많이 앓는 병은 무엇일까요?',
      hint: '시장 진료소 게시판 단서 "주민들의 건강 피해"를 보면 알 수 있어요.',
      choices: [
        { text: '발열·감기',     correct: false,
          feedback: '추운 곳도 아닌데 그건 아니에요.' },
        { text: '호흡기 질환',   correct: true,
          feedback: '맞아요. 매일 들이마시는 소금·농약 먼지 때문이에요.' },
        { text: '골절·뼈 부상',  correct: false,
          feedback: '몸을 쓰는 일이 줄어 그런 문제는 적어요.' },
      ],
      reward: {
        id: 'health', area: 'emotional',
        name: '건강의 상처',
        desc: '소금·농약 먼지가 폐 깊숙이 박힌다. 가장 약한 아이와 노인부터 무너졌다.'
      }
    }
  }

  ],

  // ══════════════════════════════════════════════════════════
  //  사건 2 — 우크라이나 (시민 NPC 3명)
  //  강조: 식량·에너지 영향 + 평화 교육
  // ══════════════════════════════════════════════════════════
  ukraine: [

    // ── 1) 선생님 이리나 — "교실 없는 미래" ──────────────
    {
      id: 'teacher',
      name: '선생님 이리나',
      sprite: 'tiny_dungeon',
      frame: 84,
      portrait: 'portrait_teacher',
      x: 170, y: 240,    // 좌상단 — UN 텐트 옆에서 가르치는 자리
      intro: [
        '안녕하세요, 조사관님. 저는 이리나, 키이우 초등학교 교사예요.',
        '제 학교는 작년에 폭격으로 절반이 무너졌어요.',
        '그래도 우리는 지하철역에서, 화면으로라도 수업을 이어갑니다.',
        '한 가지만 여쭤봐도 될까요?',
      ],
      quiz: {
        question: '전쟁이 시작된 후 학교에 제대로 다니지 못하는 우크라이나 아동은 몇 명 정도일까요?',
        hint: '폐허 학교의 "끊긴 학습권" 단서를 떠올려 보세요. 수백만 단위입니다.',
        choices: [
          { text: '약 5천 명',  correct: false,
            feedback: '안타깝게도 그보다 훨씬 많아요. 한 학교 규모도 안 되는 숫자네요.' },
          { text: '약 5만 명',  correct: false,
            feedback: '한 도시 정도일 텐데, 영향은 그보다 훨씬 넓어요.' },
          { text: '약 5백만 명', correct: true,
            feedback: '맞아요. 유니세프는 우크라이나 아동 거의 모두가 학습 손실을 겪었다고 봐요.' },
        ],
        reward: {
          id: 'futureClass', area: 'emotional',
          name: '교실 없는 미래',
          desc: '전쟁의 가장 깊은 상처는 한 세대의 교육이 통째로 흔들리는 것이다. 평화 교육은 곧 미래에 대한 투자다.'
        }
      }
    },

    // ── 2) 농부 페트로 — "세계의 식탁" ───────────────────
    {
      id: 'farmer',
      name: '농부 페트로',
      sprite: 'tiny_dungeon',
      frame: 96,
      x: 440, y: 200,    // 가운데 위 — 평화 비둘기 옆 광장
      intro: [
        '어서 오세요, 조사관님. 페트로라고 합니다. 오데사 근처 밀밭에서 일했죠.',
        '제가 길러낸 곡식이 작년부터 항구 창고에 그대로 쌓여 있어요.',
        '저 멀리 아프리카·중동에서 우리 빵을 기다리던 사람들이 있는데...',
        '조사관님께 한 가지 여쭤봐도 될까요?',
      ],
      quiz: {
        question: '전쟁 전, 우크라이나가 세계 밀 수출 시장에서 차지하던 비중은?',
        hint: '곡물 항구의 "세계의 빵 바구니" 단서를 떠올려 보세요.',
        choices: [
          { text: '약 1%',  correct: false,
            feedback: '그 정도였다면 "유럽의 빵 바구니"라고 부르지도 않았을 거예요.' },
          { text: '약 10%', correct: true,
            feedback: '맞아요. 해바라기씨유는 더 커서 세계의 절반 가까이 책임졌어요.' },
          { text: '약 50%', correct: false,
            feedback: '거기까진 아니에요. 그래도 한 나라가 멈췄을 때 세계가 흔들릴 만큼은 됐죠.' },
        ],
        reward: {
          id: 'globalTable', area: 'cognitive',
          name: '세계의 식탁',
          desc: '한 나라의 곡물선이 멈추자 아프리카·중동의 빵 값이 두 배가 됐다. 식량 안보는 국경을 넘는 인권의 문제다.'
        }
      }
    },

    // ── 3) 자원봉사 마리아 — "보이지 않는 상처" ─────────
    {
      id: 'volunteer',
      name: '자원봉사 마리아',
      sprite: 'tiny_dungeon',
      frame: 85,
      x: 820, y: 320,    // 우중 — 부서진 차량 옆, 의료 봉사 자리
      intro: [
        '반갑습니다, 조사관님. 마리아예요. NGO에서 의료 자원봉사를 해요.',
        '대피소 사람들의 몸뿐 아니라 마음도 매일 살펴요.',
        '아이들 그림 한 장에서도 전쟁의 흔적이 보이거든요.',
        '한 가지만 여쭤도 될까요?',
      ],
      quiz: {
        question: '전쟁 지역의 민간인이 안전하게 빠져나가도록 국제 사회가 합의한 통로를 무엇이라 부를까요?',
        hint: '대피소의 "국제 사회의 손길" 단서에서 비슷한 개념이 있었어요.',
        choices: [
          { text: '무역 회랑',           correct: false,
            feedback: '비슷하지만 그건 곡물·물자 같은 무역품을 위한 통로예요.' },
          { text: '인도주의 회랑',       correct: true,
            feedback: '맞아요. 민간인의 생명과 의료품이 지나가는 약속된 통로예요.' },
          { text: '군사 비무장 지대',    correct: false,
            feedback: '그건 다른 개념이에요. 사람을 위한 길은 좀 더 부드러운 이름을 가져요.' },
        ],
        reward: {
          id: 'invisible', area: 'behavioral',
          name: '보이지 않는 상처',
          desc: '몸의 상처는 시간이 지나면 흐릿해지지만, 마음의 상처는 평화 교육과 공동체의 돌봄으로 함께 치유해야 한다.'
        }
      }
    }

  ]

};

// ── 활성 사건 (기본: 아랄해). CaseSelectScene 에서 setCitizens()로 전환. ──
let CITIZENS = CITIZENS_BY_CASE.aralsea;
let TOTAL_CITIZENS = CITIZENS.length;
function setCitizens(id) {
  CITIZENS = CITIZENS_BY_CASE[id] || CITIZENS_BY_CASE.aralsea;
  TOTAL_CITIZENS = CITIZENS.length;
}
