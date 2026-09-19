/* ============================================================
   공부알 탐험대 - 상태 / 저장 / 규칙
   ============================================================ */
(function (root) {
  'use strict';

  var D = root.DATA;
  var SAVE_KEY = 'studyEgg.save.v1';
  var TICK_PER_POINT = 4000;   // 부화 진행도 +1 에 필요한 시간(ms)
  var OFFLINE_CAP_MS = 8 * 3600 * 1000;

  var S = null;

  function freshState() {
    return {
      v: 1,
      coin: 0,
      level: 1,
      exp: 0,
      stats: { leg: 10, kick: 10, acc: 10, luck: 10 },
      gear: { shoes: null, hat: null, suit: null },
      owned: {},                 // 상점 아이템 보유
      hatchSlots: 4,
      slots: [],                 // 부화 중인 알 [{grade, region, prog, need}]
      bag: [],                   // 대기 중인 알 [{grade, region}]
      garden: [],                // 정원 배치 펫 [{pet, skin, id}]
      storage: [],               // 대기 중인 펫
      gardenLv: 0,
      dex: {},                   // petId -> { skins: {skinKey:true} }
      dexRewards: [],            // 받은 도감 보상 index
      weather: 'sun',
      weatherAt: Date.now(),
      event: null,               // { key, until }
      nextEventAt: Date.now() + 90 * 1000,
      altars: {},                // altarKey -> { lv, cur }
      decos: {},                 // decoId -> true
      lastTick: Date.now(),
      coinPool: 0,
      quizCount: 0,
      quizRight: 0,
      kicks: 0,
      bestDist: 0,
      bestRegion: -1,
      unlockedRegion: 0,
      sound: true,
      nextPetId: 1
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        var base = freshState();
        for (var k in base) if (!(k in o)) o[k] = base[k];
        S = o;
      } else {
        S = freshState();
      }
    } catch (e) {
      S = freshState();
    }
    return S;
  }

  var saveTimer = null;
  function save(now) {
    if (now) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
      return;
    }
    if (saveTimer) return;
    saveTimer = setTimeout(function () {
      saveTimer = null;
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
    }, 600);
  }

  function reset() {
    S = freshState();
    save(true);
  }

  /* ---------------- 능력치 ---------------- */
  function gearBonus() {
    var b = { leg: 0, kick: 0, acc: 0, luck: 0 };
    ['shoes', 'hat', 'suit'].forEach(function (slot) {
      var id = S.gear[slot];
      if (!id) return;
      var it = D.SHOP_BY_ID[id];
      if (!it) return;
      for (var k in it.stat) b[k] += it.stat[k];
    });
    return b;
  }
  function totalStat(key) {
    return S.stats[key] + gearBonus()[key];
  }
  function totalStats() {
    var b = gearBonus();
    return { leg: S.stats.leg + b.leg, kick: S.stats.kick + b.kick, acc: S.stats.acc + b.acc, luck: S.stats.luck + b.luck };
  }

  function expNeed(lv) { return 40 + (lv - 1) * 28; }

  function addExp(n) {
    S.exp += n;
    var ups = 0;
    while (S.exp >= expNeed(S.level)) {
      S.exp -= expNeed(S.level);
      S.level++;
      ups++;
    }
    return ups;
  }

  function addCoin(n) { S.coin = Math.max(0, Math.round(S.coin + n)); }

  /* ---------------- 랜덤 이벤트 ---------------- */
  function activeEvent() {
    if (!S.event) return null;
    if (Date.now() >= S.event.until) return null;
    return D.EVENT_BY_KEY[S.event.key] || null;
  }
  function isEvent(key) {
    var e = activeEvent();
    return !!e && e.key === key;
  }
  function eventLeftMs() {
    return S.event ? Math.max(0, S.event.until - Date.now()) : 0;
  }
  function tickEvent() {
    var now = Date.now();
    if (S.event && now >= S.event.until) {
      S.event = null;
      S.nextEventAt = now + D.EVENT_GAP_MIN + Math.random() * (D.EVENT_GAP_MAX - D.EVENT_GAP_MIN);
      return { ended: true };
    }
    if (!S.event && now >= (S.nextEventAt || 0)) {
      var total = D.EVENTS.reduce(function (a, e) { return a + e.w; }, 0);
      var r = Math.random() * total, picked = D.EVENTS[0];
      for (var i = 0; i < D.EVENTS.length; i++) {
        r -= D.EVENTS[i].w;
        if (r <= 0) { picked = D.EVENTS[i]; break; }
      }
      S.event = { key: picked.key, until: now + picked.dur * 1000 };
      return { started: picked };
    }
    return null;
  }

  // 코인 획득 배수 (구매에는 적용하지 않는다)
  function coinMul() { return isEvent('lucky') ? 2 : 1; }
  function gainCoin(n) {
    var got = Math.round(n * coinMul());
    addCoin(got);
    return got;
  }

  /* ---------------- 알 차기 계산 ---------------- */
  // 판정 구간 폭 (0~1 게이지 기준)
  function goodWidth() {
    var acc = totalStat('acc');
    return Math.min(0.60, 0.20 + acc * 0.0016);
  }
  function perfectWidth() { return goodWidth() * 0.34; }

  function kickDistance(power) {
    var st = totalStats();
    var w = weather();
    var base = 120 + st.leg * 7;
    var speed = 1 + st.kick * 0.03;
    var wm = w.distMul || 1;
    var jitter = 0.94 + Math.random() * 0.12;
    return Math.max(10, Math.round(base * speed * power * wm * jitter));
  }

  function regionOf(dist) {
    var idx = 0;
    for (var i = 0; i < D.REGIONS.length; i++) if (dist >= D.REGIONS[i].dist) idx = i;
    return idx;
  }

  // 날씨 · 이벤트 선호 지역 보정: 한 단계까지 끌어올림
  function applyWeatherFavor(idx) {
    var favors = [];
    var w = weather();
    if (w.favor) favors.push(w.favor);
    if (isEvent('gate')) favors.push('cosmos');
    for (var f = 0; f < favors.length; f++) {
      var target = -1;
      for (var i = 0; i < D.REGIONS.length; i++) if (D.REGIONS[i].key === favors[f]) target = i;
      if (target > idx && Math.random() < 0.4) idx = Math.min(idx + 1, target);
    }
    return idx;
  }

  function rollGrade(regionIdx, bonus) {
    var luck = totalStats().luck;
    var w = weather();
    var gm = (w.gradeMul || 1) * (bonus || 1) * (isEvent('bless') ? 1.7 : 1);
    var step = 1 + regionIdx * 0.3 + luck * 0.009;
    var weights = D.GRADES.map(function (g, i) {
      return g.weight * Math.pow(step * gm, i);
    });
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return 0;
  }

  function rollSkin() {
    var luck = totalStats().luck;
    var w = weather();
    var mul = (w.skinMul || 1) * (isEvent('skinfest') ? 3 : 1) * (1 + luck * 0.014);
    var weights = D.SKINS.map(function (s) {
      return s.tier === 0 ? s.w : s.w * Math.pow(mul, s.tier * 0.85);
    });
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return D.SKINS[i].key;
    }
    return 'base';
  }

  /* ---------------- 날씨 ---------------- */
  var WEATHER_MS = 5 * 60 * 1000;
  function weather() {
    var w = D.WEATHERS.filter(function (x) { return x.key === S.weather; })[0];
    return w || D.WEATHERS[0];
  }
  function tickWeather() {
    if (Date.now() - S.weatherAt >= WEATHER_MS) {
      var next = D.WEATHERS[Math.floor(Math.random() * D.WEATHERS.length)];
      S.weather = next.key;
      S.weatherAt = Date.now();
      return next;
    }
    return null;
  }
  function weatherLeftMs() { return Math.max(0, WEATHER_MS - (Date.now() - S.weatherAt)); }

  /* ---------------- 부화장 ---------------- */
  function bagAdd(gradeIdx, regionIdx) {
    S.bag.push({ grade: gradeIdx, region: regionIdx });
  }
  function slotPut(bagIndex, slotIndex) {
    var e = S.bag[bagIndex];
    if (!e) return false;
    if (slotIndex >= S.hatchSlots) return false;
    if (S.slots[slotIndex]) return false;
    S.bag.splice(bagIndex, 1);
    S.slots[slotIndex] = { grade: e.grade, region: e.region, prog: 0, need: D.GRADES[e.grade].need, alt: e.alt };
    return true;
  }
  function firstEmptySlot() {
    for (var i = 0; i < S.hatchSlots; i++) if (!S.slots[i]) return i;
    return -1;
  }
  function slotAddProgress(slotIndex, amount) {
    var s = S.slots[slotIndex];
    if (!s) return;
    s.prog = Math.min(s.need, s.prog + amount);
  }
  function addProgressAll(amount) {
    var n = 0;
    for (var i = 0; i < S.hatchSlots; i++) {
      if (S.slots[i] && S.slots[i].prog < S.slots[i].need) { slotAddProgress(i, amount); n++; }
    }
    return n;
  }
  function readyCount() {
    var n = 0;
    for (var i = 0; i < S.hatchSlots; i++) if (S.slots[i] && S.slots[i].prog >= S.slots[i].need) n++;
    return n;
  }

  // 부화 -> 펫 획득
  function hatch(slotIndex) {
    var s = S.slots[slotIndex];
    if (!s || s.prog < s.need) return null;
    var regionKey = D.REGIONS[s.region].key;
    var pet = D.PET_BY_ID[regionKey + ':' + s.grade];
    var skin = rollSkin();
    S.slots[slotIndex] = null;

    var entry = { uid: S.nextPetId++, pet: pet.id, skin: skin };
    var isNewPet = !S.dex[pet.id];
    if (!S.dex[pet.id]) S.dex[pet.id] = { skins: {} };
    var isNewSkin = !S.dex[pet.id].skins[skin];
    S.dex[pet.id].skins[skin] = true;

    if (gardenSpace() > 0) S.garden.push(entry);
    else S.storage.push(entry);

    return { entry: entry, pet: pet, skin: skin, newPet: isNewPet, newSkin: isNewSkin };
  }

  /* ---------------- 원소 제단 ---------------- */
  function altar(key) {
    if (!S.altars[key]) S.altars[key] = { lv: 0, cur: 0 };
    return S.altars[key];
  }
  function altarNeed(key) {
    return D.ALTAR_BASE_NEED + altar(key).lv * D.ALTAR_STEP_NEED;
  }
  function altarRegionIdx(key) {
    var a = D.ALTAR_BY_KEY[key];
    for (var i = 0; i < D.REGIONS.length; i++) if (D.REGIONS[i].key === a.region) return i;
    return -1;
  }
  // 바칠 수 있는 알의 보관함 index 목록 (제단이 준 알은 제외, 낮은 등급부터)
  function altarCandidates(key) {
    var ri = altarRegionIdx(key);
    var idx = [];
    S.bag.forEach(function (e, i) { if (e.region === ri && !e.alt) idx.push(i); });
    idx.sort(function (a, b) { return S.bag[a].grade - S.bag[b].grade; });
    return idx;
  }
  function altarStock(key) { return altarCandidates(key).length; }
  // 이번에 실제로 바쳐질 알들의 등급 목록
  function altarPreview(key) {
    var a = altar(key);
    if (a.lv >= D.ALTAR_MAX_LV) return [];
    var room = altarNeed(key) - a.cur;
    return altarCandidates(key).slice(0, room).map(function (i) { return S.bag[i].grade; });
  }
  function rollAltarGrade(lv) {
    var weights = D.ALTAR_GRADE_W.map(function (w, i) {
      return w <= 0 ? 0 : w * Math.pow(1 + lv * 0.28, i - 3);
    });
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0 && weights[i] > 0) return i;
    }
    return 3;
  }
  // 보관함의 해당 지역 알을 제단에 바친다
  function offerToAltar(key) {
    var a = altar(key);
    if (a.lv >= D.ALTAR_MAX_LV) return { offered: 0, maxed: true };
    var meta = D.ALTAR_BY_KEY[key];
    var ri = altarRegionIdx(key);

    var room = altarNeed(key) - a.cur;
    var take = altarCandidates(key).slice(0, room);
    if (!take.length) return { offered: 0 };
    // 큰 index 부터 지워야 앞쪽 index 가 밀리지 않는다
    take.slice().sort(function (x, y) { return y - x; })
      .forEach(function (i) { S.bag.splice(i, 1); });
    var offered = take.length;
    a.cur += offered;

    if (a.cur >= altarNeed(key)) {
      a.cur -= altarNeed(key);
      var grade = rollAltarGrade(a.lv);
      a.lv = Math.min(D.ALTAR_MAX_LV, a.lv + 1);
      var egg = { grade: grade, region: ri, alt: key };
      S.bag.push(egg);
      return { offered: offered, completed: true, egg: egg, altarName: meta.name, eggName: meta.eggName };
    }
    return { offered: offered };
  }

  /* ---------------- 정원 / 코인 ---------------- */
  function gardenCap() { return D.GARDEN_LEVELS[S.gardenLv].cap; }
  function gardenSpace() { return gardenCap() - S.garden.length; }

  function bondLevel(entry) {
    return Math.min(D.BOND_MAX_LV, Math.floor((entry.heart || 0) / D.BOND_PER_LV));
  }
  function bondNext(entry) {
    var lv = bondLevel(entry);
    if (lv >= D.BOND_MAX_LV) return null;
    return (lv + 1) * D.BOND_PER_LV - (entry.heart || 0);
  }
  function petCoin(entry) {
    var p = D.PET_BY_ID[entry.pet];
    if (!p) return 0;
    var sk = D.SKIN_BY_KEY[entry.skin];
    var mul = 1 + (sk ? sk.tier * 0.25 : 0) + bondLevel(entry) * D.BOND_COIN_PER_LV;
    return D.GRADES[p.grade].coin * mul;
  }
  function decoBonus() {
    var b = 0;
    D.DECOS.forEach(function (d) { if (S.decos[d.id]) b += d.bonus; });
    return b;
  }
  function coinRate() { // 분당
    var r = 0;
    S.garden.forEach(function (e) { r += petCoin(e); });
    r *= (1 + decoBonus());
    return Math.round(r * 10) / 10;
  }
  function collect() {
    var got = Math.floor(S.coinPool);
    if (got <= 0) return 0;
    S.coinPool -= got;
    return gainCoin(got);
  }

  function buyDeco(id) {
    var d = D.DECO_BY_ID[id];
    if (!d || S.decos[id]) return false;
    if (S.coin < d.price) return false;
    addCoin(-d.price);
    S.decos[id] = true;
    return true;
  }

  function feedPet(entry, foodId) {
    var f = D.FOOD_BY_ID[foodId];
    if (!f || !entry) return false;
    if (bondLevel(entry) >= D.BOND_MAX_LV) return false;
    if (S.coin < f.price) return false;
    addCoin(-f.price);
    entry.heart = (entry.heart || 0) + f.heart;
    return true;
  }
  // 정원의 모든 펫에게 한 번씩
  function feedAll(foodId) {
    var f = D.FOOD_BY_ID[foodId];
    if (!f) return 0;
    var targets = S.garden.filter(function (e) { return bondLevel(e) < D.BOND_MAX_LV; });
    if (!targets.length) return 0;
    var cost = f.price * targets.length;
    if (S.coin < cost) return -cost;   // 음수 = 부족한 상황, 필요한 금액 전달
    addCoin(-cost);
    targets.forEach(function (e) { e.heart = (e.heart || 0) + f.heart; });
    return targets.length;
  }

  /* ---------------- 시간 진행 ---------------- */
  function advanceTime() {
    var now = Date.now();
    var dt = now - (S.lastTick || now);
    if (dt < 0) dt = 0;
    if (dt > OFFLINE_CAP_MS) dt = OFFLINE_CAP_MS;
    S.lastTick = now;

    // 부화 진행 (부화 축제 중에는 3배)
    var pts = dt / TICK_PER_POINT * (isEvent('hatchfest') ? 3 : 1);
    if (pts > 0) {
      for (var i = 0; i < S.hatchSlots; i++) {
        if (S.slots[i]) S.slots[i].prog = Math.min(S.slots[i].need, S.slots[i].prog + pts);
      }
    }
    // 코인 적립
    S.coinPool += coinRate() * (dt / 60000);
    return dt;
  }

  /* ---------------- 도감 ---------------- */
  function dexCount() { return Object.keys(S.dex).length; }
  function dexSkinCount() {
    var n = 0;
    for (var k in S.dex) n += Object.keys(S.dex[k].skins).length;
    return n;
  }
  function dexRewardState() {
    return D.DEX_REWARDS.map(function (r, i) {
      return {
        idx: i, need: r.need, coin: r.coin,
        got: S.dexRewards.indexOf(i) !== -1,
        ready: S.dexRewards.indexOf(i) === -1 && dexCount() >= r.need
      };
    });
  }
  function claimDexReward(i) {
    var r = D.DEX_REWARDS[i];
    if (!r) return 0;
    if (S.dexRewards.indexOf(i) !== -1) return 0;
    if (dexCount() < r.need) return 0;
    S.dexRewards.push(i);
    return gainCoin(r.coin);
  }

  /* ---------------- 상점 ---------------- */
  function buy(itemId) {
    var it = D.SHOP_BY_ID[itemId];
    if (!it || S.owned[itemId]) return false;
    if (S.coin < it.price) return false;
    addCoin(-it.price);
    S.owned[itemId] = true;
    // 자동 장착 (같은 슬롯에서 능력치 합이 더 크면)
    var cur = S.gear[it.slot] ? D.SHOP_BY_ID[S.gear[it.slot]] : null;
    var sum = function (o) { var t = 0; for (var k in o.stat) t += o.stat[k]; return t; };
    if (!cur || sum(it) > sum(cur)) S.gear[it.slot] = itemId;
    return true;
  }
  function equip(itemId) {
    var it = D.SHOP_BY_ID[itemId];
    if (!it || !S.owned[itemId]) return false;
    S.gear[it.slot] = (S.gear[it.slot] === itemId) ? null : itemId;
    return true;
  }
  function buySlot() {
    if (S.hatchSlots >= D.MAX_HATCH_SLOTS) return false;
    var cost = D.HATCH_SLOT_COST[S.hatchSlots];
    if (S.coin < cost) return false;
    addCoin(-cost);
    S.hatchSlots++;
    return true;
  }
  function upgradeGarden() {
    if (S.gardenLv >= D.GARDEN_LEVELS.length - 1) return false;
    var cost = D.GARDEN_LEVELS[S.gardenLv + 1].cost;
    if (S.coin < cost) return false;
    addCoin(-cost);
    S.gardenLv++;
    return true;
  }

  function petToGarden(storageIndex) {
    if (gardenSpace() <= 0) return false;
    var e = S.storage.splice(storageIndex, 1)[0];
    if (!e) return false;
    S.garden.push(e);
    return true;
  }
  function petToStorage(gardenIndex) {
    var e = S.garden.splice(gardenIndex, 1)[0];
    if (!e) return false;
    S.storage.push(e);
    return true;
  }

  root.GS = {
    get s() { return S; },
    load: load, save: save, reset: reset, freshState: freshState,
    gearBonus: gearBonus, totalStat: totalStat, totalStats: totalStats,
    expNeed: expNeed, addExp: addExp, addCoin: addCoin, gainCoin: gainCoin, coinMul: coinMul,
    activeEvent: activeEvent, isEvent: isEvent, eventLeftMs: eventLeftMs, tickEvent: tickEvent,
    altar: altar, altarNeed: altarNeed, altarStock: altarStock,
    altarPreview: altarPreview, offerToAltar: offerToAltar,
    bondLevel: bondLevel, bondNext: bondNext, petCoin: petCoin, decoBonus: decoBonus,
    buyDeco: buyDeco, feedPet: feedPet, feedAll: feedAll,
    goodWidth: goodWidth, perfectWidth: perfectWidth,
    kickDistance: kickDistance, regionOf: regionOf, applyWeatherFavor: applyWeatherFavor,
    rollGrade: rollGrade, rollSkin: rollSkin,
    weather: weather, tickWeather: tickWeather, weatherLeftMs: weatherLeftMs,
    bagAdd: bagAdd, slotPut: slotPut, firstEmptySlot: firstEmptySlot,
    slotAddProgress: slotAddProgress, addProgressAll: addProgressAll,
    readyCount: readyCount, hatch: hatch,
    gardenCap: gardenCap, gardenSpace: gardenSpace, coinRate: coinRate, collect: collect,
    advanceTime: advanceTime,
    dexCount: dexCount, dexSkinCount: dexSkinCount,
    dexRewardState: dexRewardState, claimDexReward: claimDexReward,
    buy: buy, equip: equip, buySlot: buySlot, upgradeGarden: upgradeGarden,
    petToGarden: petToGarden, petToStorage: petToStorage,
    TICK_PER_POINT: TICK_PER_POINT
  };
})(window);
