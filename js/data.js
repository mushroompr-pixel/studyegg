/* ============================================================
   공부알 탐험대 - 게임 데이터
   ============================================================ */
(function (root) {
  'use strict';

  /* ---------------- 등급 ---------------- */
  // need : 부화에 필요한 진행도 (시간 +1 / 4초, 퀴즈 +10)
  var GRADES = [
    { key: 'common', name: '일반',    color: '#f2f2f2', dark: '#a9a9b8', coin: 1,   need: 40,  weight: 1000 },
    { key: 'rare',   name: '희귀',    color: '#5ae08a', dark: '#1f9d55', coin: 3,   need: 70,  weight: 300 },
    { key: 'epic',   name: '영웅',    color: '#6aa8ff', dark: '#2758c4', coin: 5,   need: 105, weight: 90 },
    { key: 'legend', name: '전설',    color: '#c084fc', dark: '#6d28d9', coin: 10,  need: 150, weight: 26 },
    { key: 'myth',   name: '신화',    color: '#ffd34d', dark: '#b3781a', coin: 20,  need: 210, weight: 6.5 },
    { key: 'ultra',  name: '초신화',  color: '#ff8fd0', dark: '#7c3aed', coin: 50,  need: 290, weight: 1.3, rainbow: true },
    { key: 'god',    name: '신의 알', color: '#efc45a', dark: '#1b1330', coin: 100, need: 400, weight: 0.16, holy: true }
  ];

  /* ---------------- 지역 ---------------- */
  var REGIONS = [
    { key: 'forest',  name: '초록숲',      dist: 0,    sky: ['#8ed6ff', '#d8f4c4'], ground: '#5fb34a', deco: '#2f7d3a', tint: '#9be07a' },
    { key: 'lake',    name: '호수',        dist: 320,  sky: ['#a8e6ff', '#cdefff'], ground: '#4aa3c9', deco: '#2c6f96', tint: '#7fd3f0' },
    { key: 'sea',     name: '바다',        dist: 760,  sky: ['#6fc8ef', '#bff0ff'], ground: '#1f6fa8', deco: '#0f4874', tint: '#3fa9dc' },
    { key: 'volcano', name: '화산',        dist: 1300, sky: ['#ff9d5c', '#5b2318'], ground: '#5a2b20', deco: '#ff5a2b', tint: '#ff7a3c' },
    { key: 'snow',    name: '눈의 왕국',   dist: 1950, sky: ['#cfe9ff', '#f4fbff'], ground: '#e6f2fb', deco: '#9dc7e8', tint: '#bfe3ff' },
    { key: 'sky',     name: '하늘섬',      dist: 2700, sky: ['#7fb8ff', '#e6f2ff'], ground: '#b8d4f5', deco: '#7a9fd6', tint: '#a8ccff' },
    { key: 'moon',    name: '달빛숲',      dist: 3550, sky: ['#2b2456', '#5b4b96'], ground: '#3a3070', deco: '#8f7bd9', tint: '#a08cf0' },
    { key: 'rainbow', name: '무지개 왕국', dist: 4500, sky: ['#ffb3e6', '#fff3b0'], ground: '#ff9ad5', deco: '#8ef0d8', tint: '#ffb0e0' },
    { key: 'crystal', name: '수정 동굴',   dist: 5550, sky: ['#1e2a4a', '#3d5a8f'], ground: '#2c3a63', deco: '#7fe8ff', tint: '#7fe8ff' },
    { key: 'cosmos',  name: '우주 평원',   dist: 6700, sky: ['#0d0a26', '#2a1f5c'], ground: '#241a4d', deco: '#b98cff', tint: '#c9a8ff' },
    { key: 'legend',  name: '전설의 땅',   dist: 8000, sky: ['#3b1f5c', '#ffd98a'], ground: '#6b4a1f', deco: '#ffd34d', tint: '#ffdf8f' }
  ];

  /* ---------------- 펫 (지역 x 등급 = 11 x 7 = 77) ---------------- */
  // s: 스프라이트 모양, c: 기본 색
  var PETS_BY_REGION = {
    forest: [
      { n: '도토리다람',   s: 'beast',  c: '#c98c4a' },
      { n: '잎사귀토끼',   s: 'beast',  c: '#8ed36a' },
      { n: '숲의 여우',    s: 'beast',  c: '#f08a3c' },
      { n: '고대나무정령', s: 'spirit', c: '#6fae5a' },
      { n: '초록 드래곤',  s: 'dragon', c: '#3fa35a' },
      { n: '세계수 수호자',s: 'golem',  c: '#7ad07a' },
      { n: '숲의 창조주',  s: 'spirit', c: '#d7f3a0' }
    ],
    lake: [
      { n: '물방울 개구리',s: 'slime',  c: '#6fd3a8' },
      { n: '수련 거북',    s: 'beast',  c: '#5fae8f' },
      { n: '호수 백조',    s: 'bird',   c: '#eaf4ff' },
      { n: '물의 요정',    s: 'spirit', c: '#7fd9f0' },
      { n: '레이크 서펀트',s: 'dragon', c: '#3f8fc9' },
      { n: '호수의 여신',  s: 'spirit', c: '#bfeaff' },
      { n: '태초의 물결',  s: 'slime',  c: '#8ff0ff' }
    ],
    sea: [
      { n: '아기 해파리',  s: 'slime',  c: '#b79dff' },
      { n: '산호 게',      s: 'golem',  c: '#ff7a6e' },
      { n: '돌고래 기사',  s: 'fish',   c: '#5fb8e8' },
      { n: '심해 아귀왕',  s: 'fish',   c: '#2a5a7a' },
      { n: '크라켄',       s: 'slime',  c: '#8a4fbf' },
      { n: '바다의 군주',  s: 'dragon', c: '#1f7fb8' },
      { n: '대양 창조신',  s: 'spirit', c: '#7fffe0' }
    ],
    volcano: [
      { n: '불씨 도마뱀',  s: 'beast',  c: '#ff8a3c' },
      { n: '용암 두꺼비',  s: 'slime',  c: '#e0532b' },
      { n: '마그마 늑대',  s: 'beast',  c: '#c93a1f' },
      { n: '화산룡',       s: 'dragon', c: '#ff5a2b' },
      { n: '용암 군주',    s: 'golem',  c: '#ff3d1f' },
      { n: '피닉스',       s: 'bird',   c: '#ffb03c' },
      { n: '불멸의 화신',  s: 'spirit', c: '#ffd76e' }
    ],
    snow: [
      { n: '눈토끼',       s: 'beast',  c: '#f2fbff' },
      { n: '얼음 여우',    s: 'beast',  c: '#bfe6ff' },
      { n: '서리 곰',      s: 'beast',  c: '#dceeff' },
      { n: '빙하 타이탄',  s: 'golem',  c: '#8fd4f0' },
      { n: '눈보라 늑대왕',s: 'beast',  c: '#a8cfe8' },
      { n: '예티',         s: 'golem',  c: '#eaf6ff' },
      { n: '영원한 겨울신',s: 'spirit', c: '#cfefff' }
    ],
    sky: [
      { n: '구름양',       s: 'slime',  c: '#f4f8ff' },
      { n: '바람 참새',    s: 'bird',   c: '#bfe0ff' },
      { n: '폭풍 매',      s: 'bird',   c: '#7f9fd6' },
      { n: '천둥 독수리',  s: 'bird',   c: '#ffe066' },
      { n: '뇌신 그리핀',  s: 'bird',   c: '#ffd34d' },
      { n: '하늘의 지배자',s: 'dragon', c: '#9fd0ff' },
      { n: '천공 창조신',  s: 'spirit', c: '#e8f4ff' }
    ],
    moon: [
      { n: '반딧불 나방',  s: 'bird',   c: '#dff07a' },
      { n: '달빛 사슴',    s: 'beast',  c: '#c9bfff' },
      { n: '그림자 고양이',s: 'beast',  c: '#5a4f8f' },
      { n: '월광 늑대',    s: 'beast',  c: '#9f8fe0' },
      { n: '밤하늘 올빼미',s: 'bird',   c: '#6f5fb8' },
      { n: '달의 수호자',  s: 'spirit', c: '#e8e0ff' },
      { n: '초승달 신',    s: 'spirit', c: '#fff0b0' }
    ],
    rainbow: [
      { n: '색동새',       s: 'bird',   c: '#ff9ad5' },
      { n: '프리즘 토끼',  s: 'beast',  c: '#a8f0e0' },
      { n: '무지개 사슴',  s: 'beast',  c: '#ffb3e6' },
      { n: '빛의 나비여왕',s: 'bird',   c: '#ffe08a' },
      { n: '오로라 페가수스', s: 'beast', c: '#8ff0d8' },
      { n: '레인보우 유니콘', s: 'beast', c: '#ffd0f0' },
      { n: '빛의 창조주',  s: 'spirit', c: '#ffffff' }
    ],
    crystal: [
      { n: '수정 딱정벌레',s: 'golem',  c: '#7fe8ff' },
      { n: '원석 골렘',    s: 'golem',  c: '#8f9fb8' },
      { n: '크리스탈 박쥐',s: 'bird',   c: '#b08fff' },
      { n: '보석 드래곤',  s: 'dragon', c: '#5fd9c9' },
      { n: '다이아 골렘왕',s: 'golem',  c: '#cfefff' },
      { n: '수정의 현자',  s: 'spirit', c: '#a8e0ff' },
      { n: '태초의 보석신',s: 'golem',  c: '#ffb3f0' }
    ],
    cosmos: [
      { n: '별먼지 슬라임',s: 'slime',  c: '#9f8fff' },
      { n: '운석 토끼',    s: 'beast',  c: '#8f7fb8' },
      { n: '혜성 여우',    s: 'beast',  c: '#7fc9ff' },
      { n: '스타 드래곤',  s: 'dragon', c: '#b98cff' },
      { n: '은하 고래',    s: 'fish',   c: '#5f6fd6' },
      { n: '코스모스 가디언', s: 'golem', c: '#c9a8ff' },
      { n: '우주왕 코스모스', s: 'spirit', c: '#e0d0ff' }
    ],
    legend: [
      { n: '전설의 병아리',s: 'bird',   c: '#ffe066' },
      { n: '신화 기린',    s: 'beast',  c: '#ffcf7a' },
      { n: '황금 사자',    s: 'beast',  c: '#ffb93c' },
      { n: '에이션트 드래곤', s: 'dragon', c: '#d6a33c' },
      { n: '세계의 뱀',    s: 'slime',  c: '#8fbf5a' },
      { n: '창조신의 정령',s: 'spirit', c: '#fff4c9' },
      { n: '신성한 사자',  s: 'beast',  c: '#fff0a8' }
    ]
  };

  // 평탄화된 펫 목록 (id = region:gradeIndex)
  var PETS = [];
  for (var ri = 0; ri < REGIONS.length; ri++) {
    var rk = REGIONS[ri].key;
    var arr = PETS_BY_REGION[rk];
    for (var gi = 0; gi < arr.length; gi++) {
      PETS.push({
        id: rk + ':' + gi,
        name: arr[gi].n,
        shape: arr[gi].s,
        color: arr[gi].c,
        region: rk,
        regionName: REGIONS[ri].name,
        regionIdx: ri,
        grade: gi
      });
    }
  }
  var PET_BY_ID = {};
  PETS.forEach(function (p) { PET_BY_ID[p.id] = p; });

  /* ---------------- 스킨 ---------------- */
  var SKINS = [
    { key: 'base',    name: '기본',   tier: 0, w: 1000 },
    { key: 'red',     name: '빨강',   tier: 1, w: 52, col: '#ef4444' },
    { key: 'blue',    name: '파랑',   tier: 1, w: 52, col: '#3b82f6' },
    { key: 'green',   name: '초록',   tier: 1, w: 52, col: '#22c55e' },
    { key: 'gold',    name: '황금',   tier: 2, w: 16, col: '#fbbf24' },
    { key: 'crystal', name: '수정',   tier: 2, w: 16, col: '#7dd3fc' },
    { key: 'rainbow', name: '무지개', tier: 3, w: 3.4, anim: 'rainbow' },
    { key: 'aurora',  name: '오로라', tier: 3, w: 3.4, anim: 'aurora' },
    { key: 'divine',  name: '신성',   tier: 4, w: 0.7, col: '#fff3c4', glow: '#ffe066' },
    { key: 'creator', name: '창조신', tier: 4, w: 0.22, col: '#2a1a4d', glow: '#c084fc' }
  ];
  var SKIN_BY_KEY = {};
  SKINS.forEach(function (s) { SKIN_BY_KEY[s.key] = s; });

  /* ---------------- 과일 ---------------- */
  var FRUITS = [
    { key: 'apple',  name: '사과',   stat: 'leg',  statName: '다리 힘',   color: '#e8453c', leaf: '#4caf50', coin: [6, 14] },
    { key: 'banana', name: '바나나', stat: 'kick', statName: '발차기 힘', color: '#ffd93b', leaf: '#8d6e3a', coin: [6, 14] },
    { key: 'grape',  name: '포도',   stat: 'acc',  statName: '정확도',    color: '#8b5cf6', leaf: '#4caf50', coin: [6, 14] },
    { key: 'orange', name: '오렌지', stat: 'luck', statName: '행운',      color: '#ff9f2e', leaf: '#4caf50', coin: [6, 14] }
  ];
  var FRUIT_BY_KEY = {};
  FRUITS.forEach(function (f) { FRUIT_BY_KEY[f.key] = f; });

  var STATS = [
    { key: 'leg',  name: '다리 힘',   icon: '🦵', color: '#6ee7a8', desc: '알이 날아가는 거리 증가' },
    { key: 'kick', name: '발차기 힘', icon: '👟', color: '#ff8fd0', desc: '알의 속도 증가' },
    { key: 'acc',  name: '정확도',    icon: '🎯', color: '#6aa8ff', desc: '좋은 판정 구간이 넓어짐' },
    { key: 'luck', name: '행운',      icon: '🍀', color: '#ffd34d', desc: '높은 등급 알과 특별 스킨 확률 증가' }
  ];

  /* ---------------- 날씨 ---------------- */
  var WEATHERS = [
    { key: 'sun',     name: '맑음',   icon: '☀️', eff: '알이 15% 더 멀리 날아가요', distMul: 1.15 },
    { key: 'rain',    name: '비',     icon: '🌧️', eff: '바다 지역에 도착할 확률이 올라가요', favor: 'sea' },
    { key: 'snow',    name: '눈',     icon: '❄️', eff: '눈의 왕국에 도착할 확률이 올라가요', favor: 'snow' },
    { key: 'thunder', name: '번개',   icon: '⚡', eff: '알 등급이 오를 확률이 30% 올라가요', gradeMul: 1.3 },
    { key: 'rainbow', name: '무지개', icon: '🌈', eff: '특별 스킨이 나올 확률이 2배!', skinMul: 2 },
    { key: 'meteor',  name: '유성우', icon: '☄️', eff: '우주 평원에 도착할 확률이 올라가요', favor: 'cosmos' }
  ];

  /* ---------------- 상점 ---------------- */
  var SHOP = [
    { id: 'shoe1', slot: 'shoes', icon: '👟', name: '행운 축구화',   price: 400,   stat: { luck: 6 } },
    { id: 'shoe2', slot: 'shoes', icon: '👟', name: '질풍 축구화',   price: 1800,  stat: { kick: 14, leg: 6 } },
    { id: 'shoe3', slot: 'shoes', icon: '👟', name: '무지개 축구화', price: 9000,  stat: { kick: 30, leg: 24, luck: 12 } },
    { id: 'hat1',  slot: 'hat',   icon: '🎓', name: '학자의 모자',   price: 500,   stat: { acc: 10 } },
    { id: 'hat2',  slot: 'hat',   icon: '🍀', name: '행운의 모자',   price: 2200,  stat: { luck: 16, acc: 6 } },
    { id: 'hat3',  slot: 'hat',   icon: '👑', name: '왕관',          price: 12000, stat: { acc: 26, luck: 22 } },
    { id: 'suit1', slot: 'suit',  icon: '🧭', name: '탐험가 의상',   price: 1000,  stat: { leg: 14 } },
    { id: 'suit2', slot: 'suit',  icon: '✨', name: '황금 의상',     price: 6500,  stat: { leg: 26, luck: 12, acc: 10 } },
    { id: 'suit3', slot: 'suit',  icon: '🌟', name: '신의 의상',     price: 28000, stat: { leg: 45, kick: 35, acc: 25, luck: 30 } }
  ];
  var SHOP_BY_ID = {};
  SHOP.forEach(function (s) { SHOP_BY_ID[s.id] = s; });

  var SLOT_NAMES = { shoes: '축구화', hat: '모자', suit: '의상' };

  /* ---------------- 성장 테이블 ---------------- */
  var GARDEN_LEVELS = [
    { cap: 10, cost: 0 },
    { cap: 20, cost: 1500 },
    { cap: 35, cost: 6000 },
    { cap: 50, cost: 20000 },
    { cap: 75, cost: 60000 }
  ];
  var HATCH_SLOT_COST = [0, 0, 0, 0, 800, 2500, 7000, 18000, 45000, 100000, 220000, 500000];
  var MAX_HATCH_SLOTS = 12;

  /* ---------------- 랜덤 이벤트 ---------------- */
  // dur: 지속 시간(초)
  var EVENTS = [
    { key: 'fruit',    name: '과일 축제',   icon: '🍎', desc: '과일이 두 배로 쏟아져요!',        dur: 180, w: 20 },
    { key: 'eggstorm', name: '알 폭풍',     icon: '🌪', desc: '알을 찰 때마다 알을 하나 더 주워와요!', dur: 180, w: 16 },
    { key: 'skinfest', name: '무지개 축제', icon: '🎪', desc: '특별 스킨 확률이 3배!',          dur: 180, w: 14 },
    { key: 'hatchfest',name: '부화 축제',   icon: '🔥', desc: '부화 속도가 3배!',               dur: 180, w: 18 },
    { key: 'lucky',    name: '행운의 날',   icon: '🍀', desc: '받는 코인이 두 배!',             dur: 240, w: 18 },
    { key: 'bless',    name: '신의 축복',   icon: '👑', desc: '높은 등급 알이 나올 확률이 크게 올라가요!', dur: 120, w: 7 },
    { key: 'gate',     name: '우주의 문',   icon: '🌌', desc: '우주 평원에 도착할 확률이 올라가요!', dur: 180, w: 7 }
  ];
  var EVENT_BY_KEY = {};
  EVENTS.forEach(function (e) { EVENT_BY_KEY[e.key] = e; });

  var EVENT_GAP_MIN = 5 * 60 * 1000;    // 이벤트 사이 최소 간격
  var EVENT_GAP_MAX = 11 * 60 * 1000;

  /* ---------------- 원소 제단 ---------------- */
  // region 지역의 알을 바치면 그 지역의 높은 등급 알을 돌려준다
  var ALTARS = [
    { key: 'volcano', name: '화산 제단',   icon: '🌋', region: 'volcano', eggName: '화산의 알',   color: '#ff5a2b' },
    { key: 'sea',     name: '바다 제단',   icon: '🌊', region: 'sea',     eggName: '바다의 알',   color: '#3fa9dc' },
    { key: 'snow',    name: '얼음 제단',   icon: '🧊', region: 'snow',    eggName: '얼음의 알',   color: '#bfe3ff' },
    { key: 'forest',  name: '숲 제단',     icon: '🌳', region: 'forest',  eggName: '숲의 알',     color: '#5fb34a' },
    { key: 'sky',     name: '천둥 제단',   icon: '⚡', region: 'sky',     eggName: '천둥의 알',   color: '#ffd34d' },
    { key: 'moon',    name: '달빛 제단',   icon: '🌙', region: 'moon',    eggName: '달빛의 알',   color: '#a08cf0' },
    { key: 'rainbow', name: '무지개 제단', icon: '🌈', region: 'rainbow', eggName: '무지개의 알', color: '#ffb0e0' },
    { key: 'cosmos',  name: '우주 제단',   icon: '🌌', region: 'cosmos',  eggName: '우주의 알',   color: '#c9a8ff' }
  ];
  var ALTAR_BY_KEY = {};
  ALTARS.forEach(function (a) { ALTAR_BY_KEY[a.key] = a; });

  var ALTAR_BASE_NEED = 8;   // 1단계에 필요한 알 개수
  var ALTAR_STEP_NEED = 6;   // 단계마다 늘어나는 개수
  var ALTAR_MAX_LV = 10;
  // 제단 알 등급 가중치 (전설 이상만) — 제단 단계가 오를수록 위쪽으로 쏠린다
  var ALTAR_GRADE_W = [0, 0, 0, 60, 24, 7, 1.2];

  /* ---------------- 정원 꾸미기 ---------------- */
  var DECOS = [
    { id: 'fence',    name: '울타리',       icon: '🧱', price: 900,    bonus: 0.05 },
    { id: 'flower',   name: '꽃밭',         icon: '🌷', price: 2200,   bonus: 0.07 },
    { id: 'pond',     name: '연못',         icon: '💧', price: 5500,   bonus: 0.10 },
    { id: 'tree',     name: '큰 나무',      icon: '🌳', price: 13000,  bonus: 0.13 },
    { id: 'fountain', name: '분수',         icon: '⛲', price: 35000,  bonus: 0.18 },
    { id: 'bridge',   name: '무지개 다리',  icon: '🌈', price: 90000,  bonus: 0.25 },
    { id: 'statue',   name: '황금 조각상',  icon: '🗿', price: 220000, bonus: 0.35 }
  ];
  var DECO_BY_ID = {};
  DECOS.forEach(function (d) { DECO_BY_ID[d.id] = d; });

  /* ---------------- 먹이 ---------------- */
  var FOODS = [
    { id: 'berry', name: '산딸기', icon: '🍓', price: 60,   heart: 1 },
    { id: 'cake',  name: '케이크', icon: '🍰', price: 380,  heart: 7 },
    { id: 'star',  name: '별사탕', icon: '🍬', price: 2400, heart: 50 }
  ];
  var FOOD_BY_ID = {};
  FOODS.forEach(function (f) { FOOD_BY_ID[f.id] = f; });

  var BOND_MAX_LV = 10;        // 친밀도 최대 단계
  var BOND_PER_LV = 12;        // 한 단계에 필요한 하트
  var BOND_COIN_PER_LV = 0.1;  // 단계당 코인 생산 +10%

  var DEX_REWARDS = [
    { need: 5,  coin: 500 },
    { need: 15, coin: 2000 },
    { need: 30, coin: 6000 },
    { need: 50, coin: 20000 },
    { need: 77, coin: 100000 }
  ];

  root.DATA = {
    GRADES: GRADES,
    REGIONS: REGIONS,
    PETS: PETS,
    PET_BY_ID: PET_BY_ID,
    PETS_BY_REGION: PETS_BY_REGION,
    SKINS: SKINS,
    SKIN_BY_KEY: SKIN_BY_KEY,
    FRUITS: FRUITS,
    FRUIT_BY_KEY: FRUIT_BY_KEY,
    STATS: STATS,
    WEATHERS: WEATHERS,
    SHOP: SHOP,
    SHOP_BY_ID: SHOP_BY_ID,
    SLOT_NAMES: SLOT_NAMES,
    EVENTS: EVENTS,
    EVENT_BY_KEY: EVENT_BY_KEY,
    EVENT_GAP_MIN: EVENT_GAP_MIN,
    EVENT_GAP_MAX: EVENT_GAP_MAX,
    ALTARS: ALTARS,
    ALTAR_BY_KEY: ALTAR_BY_KEY,
    ALTAR_BASE_NEED: ALTAR_BASE_NEED,
    ALTAR_STEP_NEED: ALTAR_STEP_NEED,
    ALTAR_MAX_LV: ALTAR_MAX_LV,
    ALTAR_GRADE_W: ALTAR_GRADE_W,
    DECOS: DECOS,
    DECO_BY_ID: DECO_BY_ID,
    FOODS: FOODS,
    FOOD_BY_ID: FOOD_BY_ID,
    BOND_MAX_LV: BOND_MAX_LV,
    BOND_PER_LV: BOND_PER_LV,
    BOND_COIN_PER_LV: BOND_COIN_PER_LV,
    GARDEN_LEVELS: GARDEN_LEVELS,
    HATCH_SLOT_COST: HATCH_SLOT_COST,
    MAX_HATCH_SLOTS: MAX_HATCH_SLOTS,
    DEX_REWARDS: DEX_REWARDS
  };
})(window);
