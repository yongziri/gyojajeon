// 사건별 현지 안내자(가이드)와의 첫 만남 대화
// (대화 에디터 editor.html 로 갱신됨)
//
//   speaker : 말하는 사람 ('' 이면 나레이션)
//   text    : 대사
//   next    : 다음 칸
//   choices : [{ label, love(이해도 증감), next }]
//   end     : true 면 대화 끝
//   befriend: true 면 친구가 되어 자리를 떠남

const STORIES = {
  intro: {
    start: {
      speaker: "한센",
      text: "...오, 자네가 새 조사관이군. 어서 오게. 나는 디렉터 한센일세.",
      next: "q1"
    },
    q1: {
      speaker: "한센",
      text: "여기는 UN 본부 분쟁 조사실이야. 세계 곳곳의 분쟁 현장을 조사하고 평화의 길을 찾는 곳일세.",
      next: "meaning"
    },
    meaning: {
      speaker: "한센",
      text: "우리는 P.E.A.C.E. — 다섯 단계로 사고하고, 인식-관찰-성찰-실천 네 단계로 재구성할거야.",
      next: "peace_p"
    },
    peace_p: {
      speaker: "한센",
      text: "P — Perceive (인식). 사건의 안내인을 만나 상황을 듣는 단계일세. 사람의 얼굴부터 보는 일이지.",
      next: "peace_e"
    },
    peace_e: {
      speaker: "한센",
      text: "E — Explore (탐색). ▼ 표시된 🔍 조사 지점을 눌러, 사진 속 단서들을 관찰하는 단계라네.",
      next: "peace_a"
    },
    peace_a: {
      speaker: "한센",
      text: "A — Analyze (분석). 머리 위에 (!)가 뜬 시민을 만나 인터뷰하며, 객관식 문제로 핵심 단서를 얻어. 마찬가지로 관찰하는 거지.",
      next: "peace_c"
    },
    peace_c: {
      speaker: "한센",
      text: "C — Connect (연결). 🪞 성찰의 의자에 앉아, 모은 단서들을 [원인 → 과정 → 결과] 인과 사슬로 이어 성찰하는 단계일세.",
      next: "peace_e2"
    },
    peace_e2: {
      speaker: "한센",
      text: "E — Enact (실천). 📮 파란 우편함에 UN 보고서를 송부하고, 연설을 통해 배운 것을 행동으로 옮기는 실천하는 단계라네.",
      next: "mission"
    },
    mission: {
      speaker: "한센",
      text: "자네 임무는 세 가지일세 — ① 사라진 바다(아랄해), ② 깨어진 평화(우크라이나), ③ 오래된 갈등(팔레스타인). 각 현장에서 인식-관찰-성찰-실천 4단계를 적용하게.",
      next: "encourage"
    },
    encourage: {
      speaker: "한센",
      text: "한 사람이 모든 걸 바꿀 순 없지. 하지만 한 사람의 관심이 시작이라네. 내가 입는 옷·먹는 음식이 누군가의 분쟁과 닿아 있다는 사실 — 그것이 세계시민의 출발이야.",
      next: "james"
    },
    james: {
      speaker: "한센",
      text: "이제 동기 제임스가 자네에게 짧은 시험을 준비했네. 가서 한 문제를 풀어보게 — 그게 자네의 첫 단서가 될 걸세. 잘 부탁하네, 조사관.",
      end: true,
      befriend: true
    },
    flee: {
      speaker: "한센",
      text: "천천히 둘러보게. 동기 제임스가 자네를 기다리고 있을 걸세.",
      end: true
    }
  },
  aralsea: {
    start: {
      speaker: "아이졸리",
      text: "어...? 혹시 UN에서 오신 조사관님이세요? 저는 아이졸리예요. 여기 카라칼팍에서 태어났어요. 꼭 들려드리고 싶은 이야기가 있어요.",
      next: "q1"
    },
    q1: {
      speaker: "아이졸리",
      text: "여기는 한때 세계에서 네 번째로 큰 호수, 아랄해의 옛 항구 무이낙이에요. 지금은 아랄해의 90%가 사라졌어요.",
      next: "narrow"
    },
    narrow: {
      speaker: "아이졸리",
      text: "남한보다 조금 작은 크기였어요. 사람의 손으로 그 큰 바다가 사라진 거예요.",
      next: "why"
    },
    why: {
      speaker: "아이졸리",
      text: "바다로 흘러들던 두 강을 면화 농사에 쓰려고 우회시켰어요. 옷 한 벌을 만드는 데 그렇게 많은 물이 필요했거든요.",
      next: "impact"
    },
    impact: {
      speaker: "아이졸리",
      text: "할아버지는 옛 어부였어요. 마을 대부분 사람들이 매일 물고기를 잡았대요. 지금 바다는 100km 넘게 멀어졌고, 마을엔 일자리가 없어요.",
      next: "conflict"
    },
    conflict: {
      speaker: "아이졸리",
      text: "말라버린 호수 바닥에서 소금과 농약 가루가 바람에 날려요. 아이들 폐가 약해요. 그리고 그 가루는... 멀리, 멀리까지 날아가요.",
      next: "q3"
    },
    q3: {
      speaker: "아이졸리",
      text: "조사관님 나라에도 미세먼지와 가루가 있나요? 혹시 그것도 우리 호수에서 날아간 걸까요?",
      choices: [
        {
          label: "진짜라면, 나도 무관하지 않군",
          love: 3,
          next: "law"
        },
        {
          label: "거리가 너무 멀지 않을까?",
          next: "law"
        }
      ]
    },
    law: {
      speaker: "아이졸리",
      text: "북쪽 카자흐스탄은 작은 댐을 짓고 강물을 다시 보내서, 우리 바다의 한쪽을 일부 되살렸어요. 세계 여러 나라가 함께 도왔대요.",
      next: "q4"
    },
    q4: {
      speaker: "아이졸리",
      text: "조사관님, UN에 무엇을 보고해 주실 건가요? 멀리 사는 사람들이, 우리 바다를 위해 무엇을 할 수 있을까요?",
      choices: [
        {
          label: "관심을 가지고 절약하고 모두 연대하는거야.",
          love: 5,
          next: "peaceEnd"
        },
        {
          label: "한 사람이 뭘 바꿀 수 있을까?",
          next: "forceEnd"
        }
      ]
    },
    peaceEnd: {
      speaker: "아이졸리",
      text: "맞아요. 작은 관심과 행동이 모여 바다도 사람도 살릴 수 있어요. 조사관님이 그 첫 걸음을 보고서에 담아주세요.",
      next: "outro"
    },
    forceEnd: {
      speaker: "아이졸리",
      text: "북쪽 바다도 한 사람 한 사람의 관심에서 시작됐어요. 조사관님 보고서가 또 하나의 시작이 될 거예요.",
      next: "outro"
    },
    outro: {
      speaker: "",
      text: "아이졸리가 사라진 바닷가를 가리키며 환하게 웃었다. \"조사를 시작해 주세요. 옛 항구, 그리고 마을 사람들과 이야기해 보세요.\"",
      end: true,
      befriend: true
    },
    flee: {
      speaker: "아이졸리",
      text: "네, 조사관님. 천천히 둘러보세요. 저는 여기서 계속 기다리고 있을게요.",
      end: true
    }
  },
  ukraine: {
    start: {
      speaker: "카테리나",
      text: "...UN 조사관님이시군요! 저는 카테리나예요. 키이우에서 왔어요. 지금은 여기, 지하철역 대피소에서 지내요.",
      next: "q1"
    },
    q1: {
      speaker: "카테리나",
      text: "평화는 어느 날 갑자기 무너졌어요. 학교 가던 길에 공습 경보가 울렸고, 그 후로 교실에는 못 돌아갔어요.",
      next: "school"
    },
    school: {
      speaker: "카테리나",
      text: "우크라이나에서 이미 수천 개의 학교가 부서졌어요. 친구들 중엔 1년 넘게 교실 한 번 못 가본 아이도 있어요.",
      next: "food"
    },
    food: {
      speaker: "카테리나",
      text: "또 우리나라는 \"유럽의 빵 바구니\"라고 불렸어요. 세계 밀의 약 10분의 1을 길러서 세계에 수출을 했죠. 그런데 흑해 항구가 막히면서 곡물 배가 멈췄어요.",
      next: "globalFood"
    },
    globalFood: {
      speaker: "카테리나",
      text: "다른 나라 사람들의 사람들이 빵 값이 두 배가 됐다고 해요. 우리 강도 멀고, 우리 항구도 먼데... 모두의 식사가 이렇게 연결되어 있었어요.",
      next: "q3"
    },
    q3: {
      speaker: "카테리나",
      text: "조사관님 나라에서도 빵·기름값이 올랐다고 들었어요. 전쟁은 정말 멀리 있는 일일까요?",
      choices: [
        {
          label: "그런 걸 보니 우리도 무관하지 않구나.",
          love: 3,
          next: "energy"
        },
        {
          label: "거리가 너무 멀지 않을까?",
          next: "energy"
        }
      ]
    },
    energy: {
      speaker: "카테리나",
      text: "에너지도 마찬가지예요. 러시아 가스에 의존했던 것을 후회헤요. 한국도 LNG 가격이 출렁였다죠.",
      next: "peaceEd"
    },
    peaceEd: {
      speaker: "카테리나",
      text: "제 꿈은 도덕 선생님이 되는 거예요. 어릴 때부터 다른 사람을과 대화하고 협력하는 법을 가르치고 싶어요. 그게 전쟁을 막는 진짜 무기래요.",
      next: "q4"
    },
    q4: {
      speaker: "카테리나",
      text: "조사관님, UN에 무엇을 보고하실 건가요? 멀리 사는 사람들이, 우리를 위해 무엇을 할 수 있을까요?",
      choices: [
        {
          label: "우크라이나의 현실과 평화를 알리겠다",
          love: 5,
          next: "peaceEnd"
        },
        {
          label: "한 사람이 뭘 바꿀 수 있을까..?",
          next: "forceEnd"
        }
      ]
    },
    peaceEnd: {
      speaker: "카테리나",
      text: "맞아요. 우리 나라는 지금 고통받고 있어요. 조사관님이 그 간절함을 보고서에 담아주세요.",
      next: "outro"
    },
    forceEnd: {
      speaker: "카테리나",
      text: "저도 어릴 땐 그렇게 생각했지만 관심이 모이면 학교도 다시 짓고, 곡물선도 다시 뜰 수 있어요.",
      next: "outro"
    },
    outro: {
      speaker: "",
      text: "카테리나가 어린이가 그린 평화의 비둘기 그림을 가리키며 말했다. \"조사를 시작해 주세요. 폭격받은 학교, 흑해 곡물 항구, 그리고 이 대피소의 이야기를 들어 주세요.\"",
      end: true,
      befriend: true
    },
    flee: {
      speaker: "카테리나",
      text: "네, 조사관님. 천천히 둘러보세요. 우리는 이곳에서 기다리고 있어요.",
      end: true
    }
  },
  palestine: {
    start: {
      speaker: "카림",
      text: "...UN 조사관님이시군요. 저는 카림이라고 해요. 가자에서 태어났고, 지금은 친척 집에 와 있어요.",
      next: "q1"
    },
    q1: {
      speaker: "카림",
      text: "여기 사람들은 오랫동안 폭격 소리와 함께 살아왔어요. 우리 학교도 작년에 무너졌고, 친구 몇 명은 다시 못 만났어요.",
      next: "school"
    },
    school: {
      speaker: "카림",
      text: "UN이 운영하는 학교(UNRWA)에서 천막을 치고 수업해요. 칠판도 없지만, 선생님은 흙바닥에 분필로 글자를 써요. 그래도 우린 매일 가요.",
      next: "origin"
    },
    origin: {
      speaker: "카림",
      text: "이 땅에는 유대인·기독교인·무슬림이 천 년 넘게 같이 살았어요. 어떤 시절엔 평화로웠고, 어떤 시절엔 충돌했어요. 한 사람의 잘못이라고 말하기 어려운 갈등이에요.",
      next: "olive"
    },
    olive: {
      speaker: "카림",
      text: "할아버지 농장엔 천 년 된 올리브 나무가 있었어요. 작년에 잘려 나갔죠. 할아버지는 그 나무를 보며 \"이 땅의 시간이 잘려 나갔다\"고 우셨어요.",
      next: "q3"
    },
    q3: {
      speaker: "카림",
      text: "조사관님, 멀리 사는 사람들에게는 이게 그냥 뉴스 한 줄이겠죠. 그래도 묻고 싶어요. 우리는 멀리 있는 사람과 어떻게 연결될 수 있을까요?",
      choices: [
        {
          label: "관심·연대도 한 가지 행동이다",
          love: 3,
          next: "aid"
        },
        {
          label: "거리가 너무 멀지 않을까",
          next: "aid"
        }
      ]
    },
    aid: {
      speaker: "카림",
      text: "UN 트럭은 매일 빵과 약을 가져와요. 그런데 그 트럭 한 대가 통과하려면 수십 개 도장이 필요해요. 한 끼 식사가 외교 문서 위에 놓여요.",
      next: "peaceEd"
    },
    peaceEd: {
      speaker: "카림",
      text: "제 친구 중엔 유대인도 있어요. SNS로 만났죠. 같은 노래를 듣고, 같은 만화를 봐요. 어른들이 모르는 다리가 우리한텐 이미 있어요.",
      next: "q4"
    },
    q4: {
      speaker: "카림",
      text: "조사관님, UN에 무엇을 보고해 주실 건가요? 우리에게 무엇이 가장 필요할까요?",
      choices: [
        {
          label: "인도주의 지원·평화 교육·아동 보호를 알리겠다",
          love: 5,
          next: "peaceEnd"
        },
        {
          label: "한 사람의 보고서로 무엇이 바뀔까",
          next: "forceEnd"
        }
      ]
    },
    peaceEnd: {
      speaker: "카림",
      text: "맞아요. 빵 한 조각·약 한 알·교실 한 시간도 모두 평화의 씨앗이에요. 조사관님의 한 줄이 또 하나의 씨앗이 될 거예요.",
      next: "outro"
    },
    forceEnd: {
      speaker: "카림",
      text: "그래도, 누가 우리를 봐 줬다는 사실 하나만으로도 아이들은 다시 그림을 그려요. 조사관님 보고서가 그 시작이에요.",
      next: "outro"
    },
    outro: {
      speaker: "",
      text: "카림이 작은 올리브 가지를 손에 쥐고 말했다. \"조사를 시작해 주세요. 농장, 옛 예루살렘 골목, 그리고 UN 캠프 — 그곳들의 이야기를 들어 주세요.\"",
      end: true,
      befriend: true
    },
    flee: {
      speaker: "카림",
      text: "네, 조사관님. 천천히 둘러보세요. 우리는 늘 이곳에 있어요.",
      end: true
    }
  }
};

// ── 활성 사건 (기본: 아랄해). CaseSelectScene 에서 setStory()로 전환. ──
let STORY = STORIES.aralsea;
function setStory(id) { STORY = STORIES[id] || STORIES.aralsea; }
