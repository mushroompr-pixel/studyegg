/* ============================================================
   공부알 탐험대 - 픽셀 스프라이트 렌더러
   16x16 도트맵을 색 팔레트로 칠해서 그린다.
   기호: . 투명 / O 외곽선 / B 기본색 / L 밝은색 / S 그림자
         A 포인트색 / W 날개 / H 뿔 / E 눈 흰자 / P 눈동자
   ============================================================ */
(function (root) {
  'use strict';

  var T = {};

  T.slime = [
    '................',
    '................',
    '.....OOOOOO.....',
    '...OOLLLLLLOO...',
    '..OLLLLLLLLLLO..',
    '..OLLBBBBBBLLO..',
    '.OLLBBBBBBBBLLO.',
    '.OLBBEEBBEEBBLO.',
    '.OLBBEPBBEPBBLO.',
    '.OLBBBBBBBBBBLO.',
    '.OLBBBAABBBBBLO.',
    '.OLBBBBBBBBBBLO.',
    '.OSBBBBBBBBBBSO.',
    '.OSSBBBBBBBBSSO.',
    '..OSSSSSSSSSSO..',
    '...OOOOOOOOOO...'
  ];

  T.beast = [
    '................',
    '..OO........OO..',
    '.OLLO......OLLO.',
    '.OLLLOOOOOOLLLO.',
    '.OLLLLLLLLLLLLO.',
    '.OLLLLLLLLLLLLO.',
    '.OLEPLLLLLLPELO.',
    '.OLLLLLLLLLLLLO.',
    '.OLLLLAAAALLLLO.',
    '.OSLLLLAALLLLSO.',
    '..OSLLLLLLLLSO..',
    '..OSSLLLLLLSSO..',
    '..OSSSSSSSSSSO..',
    '..OSO.OOOO.OSO..',
    '..OO...OO...OO..',
    '................'
  ];

  T.bird = [
    '.......OO.......',
    '......OAAO......',
    '.....OLLLLO.....',
    '....OLLLLLLO....',
    '...OLEPLLPELO...',
    '...OLLLLLLLLO...',
    '..OWOLLAALLOWO..',
    '.OWWOLLLLLLOWWO.',
    '.OWWOLLLLLLOWWO.',
    '..OWOSLLLLSOWO..',
    '...OSSLLLLSSO...',
    '....OSSSSSSO....',
    '.....OSSSSO.....',
    '......OAAO......',
    '.....OA..AO.....',
    '................'
  ];

  T.dragon = [
    '..H..........H..',
    '..HO........OH..',
    '.OHLOOOOOOOOLHO.',
    '.OLLLLLLLLLLLLO.',
    'OWLLEPLLLLPELLWO',
    'OWWLLLLLLLLLLWWO',
    'OWWWLLLAALLLWWWO',
    'OWWLLLLAALLLLWWO',
    '.OWLLLLLLLLLLWO.',
    '.OLLLLLLLLLLLLO.',
    '.OSLLLLLLLLLLSO.',
    '..OSSLLLLLLSSO..',
    '..OSSSSSSSSSSO..',
    '..OSO.OOOO.OSO..',
    '...O..OOOO..O...',
    '................'
  ];

  T.spirit = [
    '.......AA.......',
    '......AOOA......',
    '.....OLLLLO.....',
    '....OLLLLLLO....',
    '...OLLLLLLLLO...',
    '...OLEPLLPELO...',
    '...OLLLLLLLLO...',
    '...OLLLAALLLO...',
    '..OLLLLLLLLLLO..',
    '..OLLLLLLLLLLO..',
    '..OLLLLLLLLLLO..',
    '..OSLLLLLLLLSO..',
    '..OSSLLSSLLSSO..',
    '..OSOOSSSSOOSO..',
    '...OO.OOOO.OO...',
    '................'
  ];

  T.golem = [
    '................',
    '...OOO....OOO...',
    '..OAAAOOOOAAAO..',
    '..OLLLLLLLLLLO..',
    '.OLLEPLLLLPELLO.',
    '.OLLLLLLLLLLLLO.',
    '.OLLLLLAALLLLLO.',
    '.OSLLLLLLLLLLSO.',
    'OOSSLLLLLLLLSSOO',
    'OAOSSLLLLLLSSOAO',
    'OAOSSSSSSSSSSOAO',
    'OOOSSSSSSSSSSOOO',
    '..OSSSSSSSSSSO..',
    '..OSSO....OSSO..',
    '..OOO......OOO..',
    '................'
  ];

  T.fish = [
    '................',
    '................',
    '......OOOOO.....',
    '....OOLLLLLOO...',
    'A..OLLLLLLLLLO..',
    'AA.OLLLLEPLLLLO.',
    'AAAOLLLLEPLLLLO.',
    'AAAOLLLLLLLLLLO.',
    'AAAOSLLLLLLLLLO.',
    'AA.OSSLLAALLLLO.',
    'A..OSSSLLLLLLO..',
    '....OSSSLLLLO...',
    '......OSSSSO....',
    '.......OOOO.....',
    '................',
    '................'
  ];

  T.egg = [
    '................',
    '......OOOO......',
    '.....OLLLLO.....',
    '....OLLLLLLO....',
    '...OLLLLLLLLO...',
    '...OLLLLLLBBO...',
    '..OLLLLBBBBBBO..',
    '..OLLBBBBBBBBO..',
    '..OLBBBBBBBBBO..',
    '..OBBBBBBBBBSO..',
    '..OBBBBBBBBSSO..',
    '..OBBBBBBBSSSO..',
    '...OBBBBBSSSO...',
    '...OSBBBSSSSO...',
    '....OSSSSSSO....',
    '.....OOOOOO.....'
  ];

  T.player = [
    '................',
    '....OOOOOO......',
    '...OAAAAAAOO....',
    '...OLLLLLLAO....',
    '...OLLEPLLO.....',
    '...OLLLLLLO.....',
    '....OLLLLO......',
    '..OOOBBBBOOO....',
    '.OBBBBBBBBBBO...',
    '.OBBOBBBBOBBO...',
    '..OOOBBBBOOO....',
    '....OBBBBO......',
    '....OBBOBO......',
    '....OSSOSO......',
    '...OSSO.OSSO....',
    '...OOO...OOO....'
  ];

  T.apple = [
    '................',
    '................',
    '........O.......',
    '.......OA.......',
    '....OOOOAOOO....',
    '...OLLBBBBBBO...',
    '..OLLBBBBBBBBO..',
    '..OLBBBBBBBBBO..',
    '..OBBBBBBBBBBO..',
    '..OBBBBBBBBBSO..',
    '..OBBBBBBBBSSO..',
    '...OBBBBBBBSO...',
    '....OBBBBBSO....',
    '.....OBSSSO.....',
    '......OOOO......',
    '................'
  ];

  T.banana = [
    '................',
    '................',
    '................',
    '..........OO....',
    '.........OAAO...',
    '........OBBBO...',
    '.......OBBBBO...',
    '..O...OBBBBO....',
    '.OLO.OBBBBO.....',
    '.OLLOOBBBBO.....',
    '.OLLBBBBBBO.....',
    '..OLBBBBBO......',
    '..OSBBBBO.......',
    '...OSSSO........',
    '....OOO.........',
    '................'
  ];

  T.grape = [
    '................',
    '................',
    '......OO.A......',
    '.....OAAOA......',
    '...OOBBOOO......',
    '..OBBBBBBBO.....',
    '..OBBOBBOBBO....',
    '..OBBBBBBBBO....',
    '...OBBOBBOBO....',
    '...OBBBBBBBO....',
    '....OBBOBBO.....',
    '....OBBBBBO.....',
    '.....OBBBO......',
    '......OBO.......',
    '.......O........',
    '................'
  ];

  T.orange = [
    '................',
    '................',
    '................',
    '.......AA.......',
    '....OOOOOOO.....',
    '...OLLBBBBBO....',
    '..OLLBBBBBBBO...',
    '..OLBBBBBBBBO...',
    '.OLBBBBBBBBBBO..',
    '.OBBBBBBBBBBBO..',
    '.OBBBBBBBBBBSO..',
    '..OBBBBBBBBSO...',
    '..OSBBBBBBSO....',
    '...OSSBBSSO.....',
    '....OOOOOO......',
    '................'
  ];

  /* ---------- 색 계산 ---------- */
  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgb2hex(r, g, b) {
    function c(v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }
    return '#' + c(r) + c(g) + c(b);
  }
  function shade(hex, amt) { // amt -1..1
    var c = hex2rgb(hex);
    if (amt >= 0) return rgb2hex(c[0] + (255 - c[0]) * amt, c[1] + (255 - c[1]) * amt, c[2] + (255 - c[2]) * amt);
    return rgb2hex(c[0] * (1 + amt), c[1] * (1 + amt), c[2] * (1 + amt));
  }
  function mix(a, b, t) {
    var x = hex2rgb(a), y = hex2rgb(b);
    return rgb2hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
  }
  function hsl(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return rgb2hex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }

  /* ---------- 팔레트 ---------- */
  function bodyPalette(base, accent, opts) {
    opts = opts || {};
    return {
      O: opts.outline || mix(shade(base, -0.72), '#140d22', 0.55),
      B: base,
      L: shade(base, 0.26),
      S: shade(base, -0.28),
      A: accent,
      W: mix(shade(base, 0.12), accent, 0.5),
      H: '#f3e7c4',
      E: '#ffffff',
      P: '#221c33'
    };
  }

  // 스킨 적용된 펫 색
  function petColors(pet, skinKey, phase) {
    var D = root.DATA;
    var grade = D.GRADES[pet.grade];
    var skin = D.SKIN_BY_KEY[skinKey] || D.SKIN_BY_KEY.base;
    var base = pet.color;
    var accent = grade.color;
    var glow = null;

    if (skin.anim === 'rainbow') {
      base = hsl((phase || 0) * 360, 78, 62);
      accent = hsl((phase || 0) * 360 + 140, 85, 70);
      glow = base;
    } else if (skin.anim === 'aurora') {
      base = hsl(150 + Math.sin((phase || 0) * Math.PI * 2) * 90, 62, 66);
      accent = hsl(280 + Math.cos((phase || 0) * Math.PI * 2) * 50, 70, 74);
      glow = accent;
    } else if (skin.key === 'gold') {
      base = '#fbbf24'; accent = '#fff2b0'; glow = '#ffd34d';
    } else if (skin.key === 'crystal') {
      base = '#8fd9f5'; accent = '#e6fbff'; glow = '#7dd3fc';
    } else if (skin.key === 'divine') {
      base = '#fff6d6'; accent = '#ffd34d'; glow = '#ffe066';
    } else if (skin.key === 'creator') {
      base = '#2e1c56'; accent = '#c084fc'; glow = '#a855f7';
    } else if (skin.col) {
      base = skin.col;
    }

    if (!glow && grade.rainbow) glow = hsl((phase || 0) * 360, 80, 65);
    if (!glow && grade.holy) glow = '#ffd34d';
    return { base: base, accent: accent, glow: glow };
  }

  /* ---------- 그리기 ---------- */
  function drawMap(ctx, map, pal, x, y, px) {
    for (var r = 0; r < map.length; r++) {
      var row = map[r];
      for (var c = 0; c < row.length; c++) {
        var ch = row[c];
        if (ch === '.') continue;
        var col = pal[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x + c * px, y + r * px, px, px);
      }
    }
  }

  /* ---------- 캐시 ---------- */
  var cache = {};
  function makeCanvas(size) {
    var cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    return cv;
  }

  // 펫 스프라이트 캔버스 (size px 정사각)
  function petCanvas(pet, skinKey, size, phase) {
    var skin = root.DATA.SKIN_BY_KEY[skinKey] || root.DATA.SKIN_BY_KEY.base;
    var grade = root.DATA.GRADES[pet.grade];
    var animated = !!(skin.anim || grade.rainbow);
    var pkey = animated ? Math.floor(((phase || 0) % 1) * 12) : 0;
    var key = 'p|' + pet.id + '|' + skinKey + '|' + size + '|' + pkey;
    if (cache[key]) return cache[key];

    var cv = makeCanvas(size);
    var ctx = cv.getContext('2d');
    var px = Math.max(1, Math.floor(size / 16));
    var off = Math.floor((size - px * 16) / 2);
    var cols = petColors(pet, skinKey, pkey / 12);

    if (cols.glow) {
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = cols.glow;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.46, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    var pal = bodyPalette(cols.base, cols.accent);
    drawMap(ctx, T[pet.shape] || T.slime, pal, off, off, px);
    cache[key] = cv;
    return cv;
  }

  // 알 스프라이트
  function eggCanvas(gradeIdx, size, phase) {
    var g = root.DATA.GRADES[gradeIdx];
    var animated = !!g.rainbow;
    var pkey = animated ? Math.floor(((phase || 0) % 1) * 12) : 0;
    var key = 'e|' + gradeIdx + '|' + size + '|' + pkey;
    if (cache[key]) return cache[key];

    var cv = makeCanvas(size);
    var ctx = cv.getContext('2d');
    var px = Math.max(1, Math.floor(size / 16));
    var off = Math.floor((size - px * 16) / 2);

    var base = g.color, accent = '#ffffff', glow = null;
    if (g.rainbow) { base = hsl((pkey / 12) * 360, 80, 68); accent = hsl((pkey / 12) * 360 + 180, 85, 78); glow = base; }
    if (g.holy) { base = '#241a3d'; accent = '#ffd34d'; glow = '#ffd34d'; }
    if (gradeIdx === 4) glow = '#ffd34d';

    if (glow) {
      ctx.globalAlpha = 0.3; ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(size / 2, size / 2, size * 0.45, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    var pal = bodyPalette(base, accent, { outline: mix(shade(base, -0.6), '#120b20', 0.5) });
    pal.A = accent;
    drawMap(ctx, T.egg, pal, off, off, px);
    cache[key] = cv;
    return cv;
  }

  // 과일 스프라이트
  function fruitCanvas(fruitKey, size) {
    var key = 'f|' + fruitKey + '|' + size;
    if (cache[key]) return cache[key];
    var f = root.DATA.FRUIT_BY_KEY[fruitKey];
    var cv = makeCanvas(size);
    var ctx = cv.getContext('2d');
    var px = Math.max(1, Math.floor(size / 16));
    var off = Math.floor((size - px * 16) / 2);
    var pal = bodyPalette(f.color, f.leaf);
    pal.A = f.leaf;
    drawMap(ctx, T[fruitKey], pal, off, off, px);
    cache[key] = cv;
    return cv;
  }

  // 플레이어 스프라이트
  function playerCanvas(size, gear) {
    gear = gear || {};
    var key = 'pl|' + size + '|' + (gear.hat || '-') + '|' + (gear.suit || '-') + '|' + (gear.shoes || '-');
    if (cache[key]) return cache[key];
    var cv = makeCanvas(size);
    var ctx = cv.getContext('2d');
    var px = Math.max(1, Math.floor(size / 16));
    var off = Math.floor((size - px * 16) / 2);

    var hatCol = { hat1: '#3b4a8f', hat2: '#4caf50', hat3: '#ffd34d' }[gear.hat] || '#e8453c';
    var suitCol = { suit1: '#7a9f5a', suit2: '#ffd34d', suit3: '#e8e0ff' }[gear.suit] || '#4a7fd6';
    var shoeCol = { shoe1: '#4caf50', shoe2: '#ff7a3c', shoe3: '#ff8fd0' }[gear.shoes] || '#2b2440';

    var pal = bodyPalette(suitCol, hatCol);
    pal.L = '#ffd9b0';      // 피부
    pal.A = hatCol;         // 모자
    pal.B = suitCol;        // 옷
    pal.S = shoeCol;        // 신발
    pal.O = '#241a3d';
    drawMap(ctx, T.player, pal, off, off, px);
    cache[key] = cv;
    return cv;
  }

  function toURL(cv) { return cv.toDataURL(); }

  root.SPR = {
    T: T,
    petCanvas: petCanvas,
    eggCanvas: eggCanvas,
    fruitCanvas: fruitCanvas,
    playerCanvas: playerCanvas,
    petColors: petColors,
    bodyPalette: bodyPalette,
    drawMap: drawMap,
    toURL: toURL,
    shade: shade,
    mix: mix,
    hsl: hsl
  };
})(window);
