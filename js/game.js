/* ============================================================
   공부알 탐험대 - 메인 컨트롤러
   ============================================================ */
(function (root) {
  'use strict';

  var D = root.DATA, GS = root.GS, SPR = root.SPR, UI = root.UI;
  var $ = UI.$, el = UI.el;
  var SFX = UI.SFX;

  var current = 's-home';
  var dexTab = 'all';

  /* ============================================================
     헬퍼
     ============================================================ */
  function num(n) { return Math.round(n).toLocaleString('ko-KR'); }

  // 같은 캔버스를 여러 번 <img> 로 쓸 때 data URL 을 재사용한다
  var urlCache = new WeakMap();
  function img(canvas, cls) {
    var url = urlCache.get(canvas);
    if (!url) { url = canvas.toDataURL(); urlCache.set(canvas, url); }
    var i = new Image();
    i.src = url;
    if (cls) i.className = cls;
    return i;
  }
  function gradeTag(gi) {
    var g = D.GRADES[gi];
    return '<span style="color:' + g.color + '">' + g.name + '</span>';
  }
  function canvasPos(cv, e) {
    var r = cv.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (cv.width / r.width),
      y: (e.clientY - r.top) * (cv.height / r.height)
    };
  }

  /* ============================================================
     화면 전환
     ============================================================ */
  function go(id) {
    if (current === id) return;
    current = id;
    UI.$$('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id); });
    UI.$$('.nav-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.go === id); });
    document.getElementById('screens').scrollTop = 0;
    if (id === 's-kick') root.KICK.start(); else root.KICK.stop();
    if (id === 's-home') homeLoop.start(); else homeLoop.stop();
    if (id === 's-garden') gardenLoop.start(); else gardenLoop.stop();
    renderScreen(id);
  }

  function renderScreen(id) {
    if (id === 's-home') { renderStats(); renderGear(); renderWeather(); renderRegionTrack(); }
    if (id === 's-kick') renderRecords();
    if (id === 's-hatch') renderHatch();
    if (id === 's-garden') renderGarden();
    if (id === 's-altar') renderAltar();
    if (id === 's-dex') renderDex();
    if (id === 's-shop') renderShop();
  }

  function renderAll() {
    renderTop();
    renderScreen(current);
    renderBadges();
  }

  /* ============================================================
     상단바
     ============================================================ */
  function renderTop() {
    $('#ui-coin').textContent = num(GS.s.coin);
    $('#ui-lv').textContent = GS.s.level;
    $('#ui-exp').style.width = Math.min(100, GS.s.exp / GS.expNeed(GS.s.level) * 100) + '%';
    var w = GS.weather();
    $('#ui-weather').textContent = w.name;
    $('#ui-weather-ico').textContent = w.icon;
    renderEventBar();
  }

  /* ---------------- 이벤트 배너 ---------------- */
  function renderEventBar() {
    var bar = $('#event-bar');
    var ev = GS.activeEvent();
    if (!ev) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    $('#ev-ico').textContent = ev.icon;
    $('#ev-name').textContent = ev.name;
    $('#ev-desc').textContent = ev.desc;
    var left = Math.ceil(GS.eventLeftMs() / 1000);
    $('#ev-time').textContent = Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2);
  }

  function renderBadges() {
    var b1 = $('#badge-hatch'), n1 = GS.readyCount();
    b1.textContent = n1; b1.classList.toggle('on', n1 > 0);
    var b2 = $('#badge-garden'), n2 = Math.floor(GS.s.coinPool);
    b2.textContent = n2 > 99 ? '99+' : n2; b2.classList.toggle('on', n2 >= 10);
    var b3 = $('#badge-altar'), n3 = 0;
    D.ALTARS.forEach(function (a) {
      if (GS.altar(a.key).lv < D.ALTAR_MAX_LV && GS.altarStock(a.key) > 0) n3++;
    });
    b3.textContent = n3; b3.classList.toggle('on', n3 > 0);
  }

  /* ============================================================
     홈 - 능력치 / 장비 / 날씨 / 지역
     ============================================================ */
  function renderStats() {
    var wrap = $('#stat-list');
    wrap.innerHTML = '';
    var bonus = GS.gearBonus();
    D.STATS.forEach(function (s) {
      var base = GS.s.stats[s.key], bn = bonus[s.key];
      var row = el('div', 'stat');
      row.innerHTML =
        '<div class="nm">' + s.icon + ' ' + s.name + '</div>' +
        '<div class="bar"><i style="width:' + Math.min(100, (base + bn) / 400 * 100) + '%;background:' + s.color + '"></i></div>' +
        '<div class="vl">' + (base + bn) + (bn ? ' <small>+' + bn + '</small>' : '') + '</div>';
      row.title = s.desc;
      wrap.appendChild(row);
    });
  }

  function renderGear() {
    var wrap = $('#gear-list');
    wrap.innerHTML = '';
    ['shoes', 'hat', 'suit'].forEach(function (slot) {
      var id = GS.s.gear[slot];
      var it = id ? D.SHOP_BY_ID[id] : null;
      var c = el('div', 'gear' + (it ? '' : ' empty'));
      c.innerHTML = '<div style="font-size:20px">' + (it ? it.icon : '➕') + '</div>' +
        '<div class="g-nm">' + (it ? it.name : D.SLOT_NAMES[slot] + ' 없음') + '</div>';
      c.onclick = function () { SFX.tap(); go('s-shop'); };
      wrap.appendChild(c);
    });
  }

  function renderWeather() {
    var w = GS.weather();
    var left = Math.ceil(GS.weatherLeftMs() / 1000);
    $('#weather-box').innerHTML =
      '<div class="wi">' + w.icon + '</div>' +
      '<div><div>' + w.name + '</div><div class="we">' + w.eff + '</div>' +
      '<div class="wt">' + Math.floor(left / 60) + '분 ' + (left % 60) + '초 뒤 바뀜</div></div>';
  }

  function renderRegionTrack() {
    var wrap = $('#region-track');
    wrap.innerHTML = '';
    D.REGIONS.forEach(function (r, i) {
      var t = el('div', 'rg' + (GS.s.unlockedRegion >= i ? ' on' : ''));
      t.textContent = r.name + (i === 0 ? '' : ' ' + num(r.dist) + 'm');
      wrap.appendChild(t);
    });
  }

  /* ============================================================
     홈 캔버스 - 과일
     ============================================================ */
  var homeCv, homeCtx, fruits = [], fruitTimer = 0, homeTime = 0;

  function spawnFruit() {
    if (fruits.length >= (GS.isEvent('fruit') ? 7 : 4)) return;
    var f = D.FRUITS[Math.floor(Math.random() * D.FRUITS.length)];
    fruits.push({
      key: f.key,
      x: 480 + 20,
      y: 34 + Math.random() * 84,
      vx: -(28 + Math.random() * 26),
      bob: Math.random() * Math.PI * 2,
      size: 44,
      pop: 0
    });
  }

  function homeUpdate(dt) {
    homeTime += dt;
    fruitTimer -= dt;
    if (fruitTimer <= 0) {
      spawnFruit();
      fruitTimer = (2.2 + Math.random() * 2.6) * (GS.isEvent('fruit') ? 0.4 : 1);
    }
    fruits.forEach(function (f) {
      f.x += f.vx * dt;
      f.bob += dt * 2.2;
      if (f.pop > 0) f.pop -= dt;
    });
    fruits = fruits.filter(function (f) { return f.x > -60; });
  }

  function homeDraw() {
    var ctx = homeCtx, W = 480, H = 300, GROUND = 250;
    var r = D.REGIONS[Math.min(GS.s.unlockedRegion, D.REGIONS.length - 1)];
    var g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, r.sky[0]); g.addColorStop(1, r.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND);
    ctx.fillStyle = r.ground; ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = SPR.shade(r.ground, -0.25); ctx.fillRect(0, GROUND + 16, W, H - GROUND - 16);

    // 장식
    ctx.fillStyle = r.deco;
    for (var i = 0; i < 5; i++) {
      var x = 30 + i * 100;
      ctx.beginPath(); ctx.arc(x, GROUND, 16, Math.PI, 0); ctx.fill();
    }

    // 플레이어
    var pc = SPR.playerCanvas(72, GS.s.gear);
    ctx.drawImage(pc, 40, GROUND - 72 + Math.sin(homeTime * 2) * 2);

    // 정원 펫 미리보기 (최대 4마리)
    GS.s.garden.slice(0, 4).forEach(function (e, i) {
      var p = D.PET_BY_ID[e.pet];
      if (!p) return;
      var c = SPR.petCanvas(p, e.skin, 48, homeTime * 0.35);
      ctx.drawImage(c, 150 + i * 56, GROUND - 48 + Math.sin(homeTime * 2 + i) * 3);
    });

    // 과일
    fruits.forEach(function (f) {
      var c = SPR.fruitCanvas(f.key, f.size);
      ctx.save();
      ctx.translate(f.x, f.y + Math.sin(f.bob) * 6);
      ctx.drawImage(c, -f.size / 2, -f.size / 2);
      ctx.restore();
    });

    if (!fruits.length) {
      ctx.fillStyle = 'rgba(15,10,31,.55)';
      ctx.fillRect(0, 6, W, 26);
      ctx.fillStyle = '#f4f0ff';
      ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('과일이 곧 나타나요…', W / 2, 24);
    }
  }

  function homeClick(e) {
    var p = canvasPos(homeCv, e);
    for (var i = fruits.length - 1; i >= 0; i--) {
      var f = fruits[i];
      var dy = f.y + Math.sin(f.bob) * 6;
      if (Math.abs(p.x - f.x) < f.size * 0.6 && Math.abs(p.y - dy) < f.size * 0.6) {
        openFruitQuiz(f, i);
        return;
      }
    }
  }

  function openFruitQuiz(f, index) {
    var fruit = D.FRUIT_BY_KEY[f.key];
    var stat = D.STATS.filter(function (s) { return s.key === fruit.stat; })[0];
    SFX.tap();
    UI.openQuiz({
      title: fruit.name + ' 퀴즈',
      iconCanvas: SPR.fruitCanvas(f.key, 48),
      rewardText: '정답 → ' + stat.icon + ' ' + stat.name + ' 상승 + 코인',
      onResult: function (correct) {
        var idx = fruits.indexOf(f);
        if (idx >= 0) fruits.splice(idx, 1);
        if (!correct) { UI.toast('다음엔 꼭 맞힐 수 있어요!'); return; }
        var up = 1 + Math.floor(Math.random() * 3);
        var coin = fruit.coin[0] + Math.floor(Math.random() * (fruit.coin[1] - fruit.coin[0] + 1)) + GS.s.level * 2;
        GS.s.stats[fruit.stat] += up;
        coin = GS.gainCoin(coin);
        var ups = GS.addExp(10 + GS.s.level);
        var hatched = GS.addProgressAll(4);
        SFX.coin();
        var msg = stat.icon + ' ' + stat.name + ' +' + up + ' · 💰 +' + coin;
        if (hatched) msg += ' · 알 +4';
        UI.toast(msg);
        if (ups) { SFX.rare(); UI.toast('🎉 레벨 업! Lv.' + GS.s.level + ' (문제가 조금 어려워져요)'); }
        GS.save();
        renderAll();
      }
    });
  }

  /* ============================================================
     알 차기
     ============================================================ */
  function renderRecords() {
    $('#ui-best-dist').textContent = num(GS.s.bestDist) + ' m';
    $('#ui-best-region').textContent = GS.s.bestRegion >= 0 ? D.REGIONS[GS.s.bestRegion].name : '-';
    $('#ui-kicks').textContent = num(GS.s.kicks);
  }

  function setupKick() {
    root.KICK.init($('#kick-canvas'), {
      onState: function (t) { $('#kick-readout').textContent = t; },
      onMode: function (m) {
        var btn = $('#btn-kick');
        if (m === 'idle') { btn.disabled = false; btn.textContent = '알 놓기'; }
        else if (m === 'gauge') { btn.disabled = false; btn.textContent = '지금 차기!'; }
        else { btn.disabled = true; btn.textContent = '날아가는 중…'; }
      },
      onLand: onEggLand
    });
    $('#btn-kick').onclick = function () {
      if (root.KICK.mode === 'idle') root.KICK.begin();
      else root.KICK.tap();
    };
  }

  function onEggLand(res) {
    GS.s.kicks++;
    if (res.dist > GS.s.bestDist) GS.s.bestDist = res.dist;
    if (res.regionIdx > GS.s.bestRegion) GS.s.bestRegion = res.regionIdx;
    var newRegion = res.regionIdx > GS.s.unlockedRegion;
    if (newRegion) GS.s.unlockedRegion = res.regionIdx;
    GS.addExp(6);

    var region = D.REGIONS[res.regionIdx];
    var grade = D.GRADES[res.gradeIdx];

    // 알 폭풍: 알을 하나 더 주워온다
    var bonusEgg = null;
    if (GS.isEvent('eggstorm')) {
      var bg = GS.rollGrade(res.regionIdx, 1);
      GS.bagAdd(bg, res.regionIdx);
      bonusEgg = bg;
    }

    // 알 보관
    var slot = GS.firstEmptySlot();
    var placed = false;
    if (slot >= 0) {
      GS.s.slots[slot] = { grade: res.gradeIdx, region: res.regionIdx, prog: 0, need: grade.need };
      placed = true;
    } else {
      GS.bagAdd(res.gradeIdx, res.regionIdx);
    }
    GS.save();

    if (res.gradeIdx >= 4) SFX.rare(); else SFX.hatch();

    var body = el('div', 'res-center');
    body.appendChild(img(SPR.eggCanvas(res.gradeIdx, 128)));
    body.appendChild(el('div', 'res-grade', gradeTag(res.gradeIdx) + ' 알'));
    body.appendChild(el('div', 'res-name', region.name + ' 도착!'));
    body.appendChild(el('div', 'res-sub', num(res.dist) + ' m · ' + res.judge));
    if (newRegion) body.appendChild(el('div', 'res-skin', '🎊 새로운 지역을 발견했어요!'));
    if (bonusEgg !== null) {
      body.appendChild(el('div', 'res-skin',
        '🌪 알 폭풍! ' + D.GRADES[bonusEgg].name + ' 알을 하나 더 주웠어요'));
    }
    body.appendChild(el('div', 'res-sub',
      placed ? '부화장에 바로 들어갔어요' : '부화장이 꽉 차서 보관함에 넣었어요'));

    UI.dialog('알 획득!', body, [
      { label: '한 번 더', onClick: function () { UI.closeModal(); root.KICK.finish(); renderAll(); } },
      { label: '부화장으로', pri: true, onClick: function () { UI.closeModal(); root.KICK.finish(); go('s-hatch'); renderAll(); } }
    ]);
    renderAll();
  }

  /* ============================================================
     부화장
     ============================================================ */
  function renderHatch() {
    var wrap = $('#egg-grid');
    wrap.innerHTML = '';
    $('#hatch-count').textContent = GS.s.hatchSlots + '칸 · 대기 ' + GS.s.bag.length + '개';

    for (var i = 0; i < D.MAX_HATCH_SLOTS; i++) {
      if (i >= GS.s.hatchSlots) continue;
      (function (i) {
        var s = GS.s.slots[i];
        var cell = el('div', 'egg-cell' + (s ? (s.prog >= s.need ? ' done' : '') : ' empty') +
          (s && s.alt ? ' altar' : ''));
        if (!s) {
          cell.innerHTML = '<div style="font-size:26px;padding:10px 0">🥚</div><div class="eg-nm">빈 칸</div>' +
            '<div style="font-size:9px">보관함에서 알을 넣어요</div>';
          cell.onclick = function () { SFX.tap(); UI.toast('아래 보관함에서 알을 눌러 넣어주세요'); };
        } else {
          var g = D.GRADES[s.grade];
          var pct = Math.min(100, s.prog / s.need * 100);
          cell.appendChild(img(SPR.eggCanvas(s.grade, 64)));
          cell.appendChild(el('div', 'eg-nm', (s.alt ? '✦ ' : '') +
            '<span style="color:' + g.color + '">' + g.name + '</span> · ' + D.REGIONS[s.region].name));
          var bar = el('div', 'pbar');
          var fill = el('i'); fill.style.width = pct + '%';
          if (s.prog >= s.need) fill.style.background = '#ffd34d';
          bar.appendChild(fill);
          cell.appendChild(bar);
          cell.appendChild(el('div', null, Math.floor(s.prog) + ' / ' + s.need +
            (s.prog >= s.need ? ' · 부화 준비!' : '')));
          cell.onclick = function () { onSlotClick(i); };
        }
        wrap.appendChild(cell);
      })(i);
    }

    // 칸 추가 버튼
    var btn = $('#btn-slot-buy');
    if (GS.s.hatchSlots >= D.MAX_HATCH_SLOTS) {
      btn.textContent = '부화장 최대 확장 완료 (' + D.MAX_HATCH_SLOTS + '칸)';
      btn.disabled = true;
    } else {
      var cost = D.HATCH_SLOT_COST[GS.s.hatchSlots];
      btn.textContent = '부화장 칸 늘리기 (💰 ' + num(cost) + ')';
      btn.disabled = GS.s.coin < cost;
      btn.onclick = function () {
        if (GS.buySlot()) { SFX.coin(); UI.toast('부화장이 넓어졌어요!'); GS.save(); renderAll(); }
      };
    }

    // 보관함
    var bag = $('#bag-grid');
    bag.innerHTML = '';
    if (!GS.s.bag.length) {
      bag.appendChild(el('div', 'bag-empty', '보관 중인 알이 없어요. 알을 차러 가볼까요?'));
    } else {
      GS.s.bag.forEach(function (e, i) {
        var c = el('div', 'bag-cell');
        if (e.alt) c.style.borderColor = '#ffd34d';
        c.appendChild(img(SPR.eggCanvas(e.grade, 48)));
        c.appendChild(el('div', null, (e.alt ? '✦' : '') +
          '<span style="color:' + D.GRADES[e.grade].color + '">' + D.GRADES[e.grade].name + '</span>'));
        c.appendChild(el('div', null, '<span style="color:#b3a6dd">' + D.REGIONS[e.region].name + '</span>'));
        c.onclick = function () {
          var slot = GS.firstEmptySlot();
          if (slot < 0) { UI.toast('부화장에 빈 칸이 없어요'); return; }
          GS.slotPut(i, slot);
          SFX.tap(); GS.save(); renderHatch(); renderBadges();
        };
        bag.appendChild(c);
      });
    }
  }

  function onSlotClick(i) {
    var s = GS.s.slots[i];
    if (!s) return;
    if (s.prog >= s.need) { doHatch(i); return; }

    var g = D.GRADES[s.grade];
    var body = el('div');
    body.appendChild(el('div', 'res-center', '')).appendChild(img(SPR.eggCanvas(s.grade, 96)));
    var info = el('div');
    info.innerHTML =
      '<div class="detail-row"><span>등급</span><b>' + g.name + '</b></div>' +
      '<div class="detail-row"><span>지역</span><b>' + D.REGIONS[s.region].name + '</b></div>' +
      '<div class="detail-row"><span>진행도</span><b>' + Math.floor(s.prog) + ' / ' + s.need + '</b></div>' +
      '<div class="detail-row"><span>남은 시간</span><b>' + fmtTime((s.need - s.prog) * GS.TICK_PER_POINT) + '</b></div>';
    body.appendChild(info);

    UI.dialog('부화 중인 알', body, [
      { label: '닫기', onClick: UI.closeModal },
      {
        label: '퀴즈 풀기 (+10)', pri: true, onClick: function () {
          UI.closeModal();
          UI.openQuiz({
            title: '부화 퀴즈',
            iconCanvas: SPR.eggCanvas(s.grade, 48),
            rewardText: '정답 → 부화 진행도 +10',
            onResult: function (correct) {
              if (correct) {
                GS.slotAddProgress(i, 10);
                GS.addExp(8);
                GS.gainCoin(3 + GS.s.level);
                UI.toast('부화 진행도 +10!');
              } else UI.toast('진행도는 그대로예요');
              GS.save(); renderAll();
            }
          });
        }
      }
    ]);
  }

  function doHatch(i) {
    var r = GS.hatch(i);
    if (!r) return;
    SFX.hatch();
    setTimeout(function () { if (r.pet.grade >= 4 || (D.SKIN_BY_KEY[r.skin].tier >= 3)) SFX.rare(); }, 400);

    var skin = D.SKIN_BY_KEY[r.skin];
    var body = el('div', 'res-center');
    body.appendChild(img(SPR.petCanvas(r.pet, r.skin, 128, 0.2)));
    body.appendChild(el('div', 'res-grade', gradeTag(r.pet.grade) + ' 펫'));
    body.appendChild(el('div', 'res-name', r.pet.name + (r.newPet ? '<span class="res-new">NEW</span>' : '')));
    body.appendChild(el('div', 'res-sub', r.pet.regionName + ' · 분당 💰 ' + D.GRADES[r.pet.grade].coin));
    if (skin.key !== 'base') {
      body.appendChild(el('div', 'res-skin', '✨ ' + skin.name + ' 스킨!' + (r.newSkin ? '<span class="res-new">NEW</span>' : '')));
    }
    body.appendChild(el('div', 'res-sub', GS.gardenSpace() >= 0 && GS.s.garden.indexOf(r.entry) >= 0
      ? '정원에 배치했어요' : '정원이 꽉 차서 대기 목록에 넣었어요'));

    GS.save();
    UI.dialog('부화 성공!', body, [
      { label: '확인', pri: true, onClick: function () { UI.closeModal(); renderAll(); } }
    ]);
    renderAll();
  }

  function fmtTime(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    if (s < 60) return s + '초';
    var m = Math.floor(s / 60);
    if (m < 60) return m + '분 ' + (s % 60) + '초';
    return Math.floor(m / 60) + '시간 ' + (m % 60) + '분';
  }

  /* ============================================================
     펫 정원
     ============================================================ */
  var gardenCv, gardenCtx, gardenTime = 0;

  function gardenDraw() {
    var ctx = gardenCtx, W = 480, H = 300, GROUND = 250;
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#9fdcff'); g.addColorStop(1, '#dff3c4');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#6cc44f'; ctx.fillRect(0, 96, W, H - 96);
    ctx.fillStyle = '#5bb041'; ctx.fillRect(0, 158, W, H - 158);
    ctx.fillStyle = '#4c9a38'; ctx.fillRect(0, 220, W, H - 220);

    // 꽃 장식
    ctx.fillStyle = '#ffd34d';
    for (var i = 0; i < 14; i++) {
      var fx = (i * 73) % W, fy = 104 + ((i * 37) % 180);
      ctx.fillRect(fx, fy, 3, 3);
    }

    drawGardenDecos(ctx, W, H);

    var list = GS.s.garden;
    if (!list.length) {
      ctx.fillStyle = 'rgba(15,10,31,.5)';
      ctx.fillRect(0, 130, W, 30);
      ctx.fillStyle = '#fff';
      ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('아직 펫이 없어요. 알을 부화시켜 보세요!', W / 2, 150);
      return;
    }

    var show = list.slice(0, 18);
    show.forEach(function (e, i) {
      var p = D.PET_BY_ID[e.pet];
      if (!p) return;
      var row = Math.floor(i / 6);
      var col = i % 6;
      var size = 44 + p.grade * 3;
      var x = 18 + col * 76 + (row % 2) * 16;
      var y = 152 + row * 62;
      var c = SPR.petCanvas(p, e.skin, size, gardenTime * 0.3 + i * 0.05);
      ctx.drawImage(c, x - size / 2, y - size + Math.sin(gardenTime * 2 + i * 0.7) * 3);
    });
    if (list.length > 18) {
      ctx.fillStyle = 'rgba(15,10,31,.6)';
      ctx.fillRect(W - 92, 8, 84, 22);
      ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('외 ' + (list.length - 18) + '마리', W - 50, 23);
    }
  }

  function drawGardenDecos(ctx, W, H) {
    var has = GS.s.decos;

    if (has.bridge) {            // 무지개 다리 (하늘)
      var cols = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'];
      cols.forEach(function (c, i) {
        ctx.strokeStyle = c; ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(W / 2, 128, 128 - i * 5, Math.PI * 1.08, Math.PI * 1.92);
        ctx.stroke();
      });
    }
    if (has.pond) {              // 연못
      ctx.fillStyle = '#3fa9dc';
      ctx.beginPath(); ctx.ellipse(62, 272, 54, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7fd3f0';
      ctx.beginPath(); ctx.ellipse(52, 268, 30, 10, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (has.tree) {              // 큰 나무
      ctx.fillStyle = '#6b4423'; ctx.fillRect(432, 170, 14, 74);
      ctx.fillStyle = '#2f7d3a';
      ctx.beginPath(); ctx.arc(439, 158, 40, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4caf50';
      ctx.beginPath(); ctx.arc(428, 148, 26, 0, Math.PI * 2); ctx.fill();
    }
    if (has.statue) {            // 황금 조각상
      ctx.fillStyle = '#b3892a'; ctx.fillRect(12, 232, 34, 10);
      ctx.fillStyle = '#ffd34d'; ctx.fillRect(20, 190, 18, 44);
      ctx.beginPath(); ctx.arc(29, 184, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff2b0'; ctx.fillRect(24, 196, 4, 30);
    }
    if (has.fountain) {          // 분수
      ctx.fillStyle = '#9aa7bd';
      ctx.beginPath(); ctx.ellipse(400, 288, 40, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7fd3f0';
      ctx.beginPath(); ctx.ellipse(400, 285, 31, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9aa7bd'; ctx.fillRect(396, 252, 8, 34);
      ctx.fillStyle = '#bfeaff';
      for (var i = 0; i < 9; i++) {
        var a = (i / 9) * Math.PI * 2 + gardenTime;
        ctx.fillRect(400 + Math.cos(a) * 20, 252 + Math.abs(Math.sin(a)) * 12, 3, 3);
      }
    }
    if (has.flower) {            // 꽃밭
      var fc = ['#ff6b9d', '#ffd43b', '#ff9ad5', '#9775fa'];
      for (var k = 0; k < 26; k++) {
        ctx.fillStyle = fc[k % fc.length];
        var fx = 20 + ((k * 97) % (W - 40));
        var fy = 112 + ((k * 53) % 170);
        ctx.fillRect(fx, fy, 4, 4);
        ctx.fillStyle = '#2f7d3a';
        ctx.fillRect(fx + 1, fy + 4, 2, 5);
      }
    }
    if (has.fence) {             // 울타리
      ctx.fillStyle = '#8d6e3a';
      for (var x = 4; x < W; x += 26) ctx.fillRect(x, 282, 6, 18);
      ctx.fillRect(0, 288, W, 5);
    }
  }

  function renderGarden() {
    $('#ui-rate').textContent = GS.coinRate();
    $('#ui-pool').textContent = num(Math.floor(GS.s.coinPool));
    $('#garden-count').textContent = GS.s.garden.length + ' / ' + GS.gardenCap() + '마리';

    var up = $('#btn-garden-up');
    if (GS.s.gardenLv >= D.GARDEN_LEVELS.length - 1) {
      up.textContent = '정원 최대 확장 완료 (' + GS.gardenCap() + '마리)';
      up.disabled = true;
    } else {
      var cost = D.GARDEN_LEVELS[GS.s.gardenLv + 1].cost;
      up.textContent = '정원 넓히기 → ' + D.GARDEN_LEVELS[GS.s.gardenLv + 1].cap + '마리 (💰 ' + num(cost) + ')';
      up.disabled = GS.s.coin < cost;
      up.onclick = function () {
        if (GS.upgradeGarden()) { SFX.coin(); UI.toast('정원이 넓어졌어요!'); GS.save(); renderAll(); }
      };
    }

    renderFood();
    renderDeco();

    petGrid($('#garden-grid'), GS.s.garden, '정원이 비어 있어요', function (e, i) {
      petDetail(e, '대기시키기', function () { GS.petToStorage(i); GS.save(); renderGarden(); });
    });
    petGrid($('#storage-grid'), GS.s.storage, '대기 중인 펫이 없어요', function (e, i) {
      petDetail(e, '정원에 넣기', function () {
        if (!GS.petToGarden(i)) { UI.toast('정원이 꽉 찼어요'); return; }
        GS.save(); renderGarden();
      });
    });
  }

  function renderFood() {
    var wrap = $('#food-row');
    wrap.innerHTML = '';
    var feedable = GS.s.garden.filter(function (e) { return GS.bondLevel(e) < D.BOND_MAX_LV; });
    var maxed = GS.s.garden.length - feedable.length;
    $('#bond-sum').textContent = GS.s.garden.length
      ? ('최고 친밀도 ' + maxed + '마리 · 더 줄 수 있는 펫 ' + feedable.length + '마리')
      : '';

    D.FOODS.forEach(function (f) {
      var cost = f.price * feedable.length;
      var ok = feedable.length > 0 && GS.s.coin >= cost;
      var c = el('div', 'food-cell' + (ok ? '' : ' off'));
      c.innerHTML =
        '<div class="fd-ico">' + f.icon + '</div>' +
        '<div class="fd-nm">' + f.name + '</div>' +
        '<div class="fd-pr">한 마리 💰' + num(f.price) + '</div>' +
        '<div class="fd-all">' + (feedable.length
          ? ('전체 ' + feedable.length + '마리 💰' + num(cost)) : '줄 펫이 없어요') + '</div>';
      if (ok) c.onclick = function () {
        SFX.tap();
        UI.confirmBox('먹이 주기',
          feedable.length + '마리에게 ' + f.icon + ' ' + f.name + '을(를) 줄까요?<br>💰 ' + num(cost) + ' 소모',
          function () {
            var n = GS.feedAll(f.id);
            if (n > 0) { SFX.ok(); UI.toast('🍽 ' + n + '마리에게 먹이를 줬어요! 친밀도 +' + f.heart); }
            else UI.toast('코인이 모자라요');
            GS.save(); renderAll();
          }, '주기');
      };
      wrap.appendChild(c);
    });
  }

  function renderDeco() {
    var wrap = $('#deco-list');
    wrap.innerHTML = '';
    var bonus = Math.round(GS.decoBonus() * 100);
    $('#deco-sum').textContent = '코인 생산 +' + bonus + '%';
    D.DECOS.forEach(function (d) {
      var owned = !!GS.s.decos[d.id];
      var c = el('div', 'deco-cell' + (owned ? ' owned' : ''));
      c.innerHTML =
        '<div class="dk-ico">' + d.icon + '</div>' +
        '<div class="dk-body"><div class="dk-nm">' + d.name + '</div>' +
        '<div class="dk-bn">코인 +' + Math.round(d.bonus * 100) + '%</div></div>';
      if (owned) {
        c.appendChild(el('div', 'dk-own', '설치됨'));
      } else {
        var b = el('button', null, '💰 ' + num(d.price));
        b.disabled = GS.s.coin < d.price;
        b.onclick = function () {
          if (GS.buyDeco(d.id)) { SFX.coin(); UI.toast(d.name + '을(를) 설치했어요!'); GS.save(); renderAll(); }
        };
        c.appendChild(b);
      }
      wrap.appendChild(c);
    });
  }

  /* ============================================================
     원소 제단
     ============================================================ */
  function renderAltar() {
    var wrap = $('#altar-grid');
    wrap.innerHTML = '';
    D.ALTARS.forEach(function (a) {
      var st = GS.altar(a.key);
      var need = GS.altarNeed(a.key);
      var stock = GS.altarStock(a.key);
      var maxed = st.lv >= D.ALTAR_MAX_LV;
      var c = el('div', 'altar-cell' + (maxed ? ' maxed' : ''));

      var top = el('div', 'al-top');
      top.innerHTML = '<span class="al-ico">' + a.icon + '</span>' +
        '<span class="al-nm">' + a.name + '</span>' +
        '<span class="al-lv">' + (maxed ? 'MAX' : st.lv + '단계') + '</span>';
      c.appendChild(top);

      if (maxed) {
        c.appendChild(el('div', 'al-stock', '제단이 완전히 깨어났어요!'));
      } else {
        var bar = el('div', 'pbar');
        var fill = el('i');
        fill.style.width = (st.cur / need * 100) + '%';
        fill.style.background = a.color;
        bar.appendChild(fill);
        c.appendChild(bar);
        c.appendChild(el('div', 'al-stock',
          D.REGIONS.filter(function (r) { return r.key === a.region; })[0].name + ' 알 ' +
          st.cur + ' / ' + need + ' · 보관함 <b>' + stock + '개</b>'));
      }

      var prev = maxed ? [] : GS.altarPreview(a.key);
      var btn = el('button', null, maxed ? '완료' : (prev.length ? prev.length + '개 바치기' : '바칠 알 없음'));
      btn.disabled = maxed || !prev.length;
      btn.onclick = function () { askOffer(a, prev); };
      c.appendChild(btn);
      wrap.appendChild(c);
    });
  }

  function askOffer(a, prev) {
    SFX.tap();
    var count = {};
    prev.forEach(function (g) { count[g] = (count[g] || 0) + 1; });
    var lines = Object.keys(count).sort().map(function (g) {
      return gradeTag(+g) + ' × ' + count[g];
    }).join('<br>');
    var st = GS.altar(a.key);
    var after = st.cur + prev.length;
    var need = GS.altarNeed(a.key);
    UI.confirmBox(a.icon + ' ' + a.name,
      '아래 알을 바칠까요?<br><br>' + lines +
      '<br><br>제단 ' + after + ' / ' + need +
      (after >= need ? '<br><b style="color:#ffd34d">바치면 ' + a.eggName + '을 받아요!</b>' : ''),
      function () { doOffer(a.key); }, '바치기');
  }

  function doOffer(key) {
    var r = GS.offerToAltar(key);
    if (!r.offered) { UI.toast('바칠 알이 없어요'); return; }
    GS.save();

    if (r.completed) {
      SFX.rare();
      var body = el('div', 'res-center');
      body.appendChild(img(SPR.eggCanvas(r.egg.grade, 128)));
      body.appendChild(el('div', 'res-grade', gradeTag(r.egg.grade) + ' 알'));
      body.appendChild(el('div', 'res-name', '✦ ' + r.eggName));
      body.appendChild(el('div', 'res-sub', r.altarName + '이(가) 한 단계 깨어났어요!'));
      body.appendChild(el('div', 'res-sub', '보관함에서 부화장으로 옮겨주세요'));
      UI.dialog('제단의 보답', body, [
        { label: '확인', pri: true, onClick: function () { UI.closeModal(); renderAll(); } },
        { label: '부화장으로', onClick: function () { UI.closeModal(); go('s-hatch'); renderAll(); } }
      ]);
    } else {
      SFX.coin();
      UI.toast('알 ' + r.offered + '개를 바쳤어요');
    }
    renderAll();
  }

  function petGrid(wrap, list, emptyMsg, onClick) {
    wrap.innerHTML = '';
    if (!list.length) { wrap.appendChild(el('div', 'pet-empty', emptyMsg)); return; }
    list.forEach(function (e, i) {
      var p = D.PET_BY_ID[e.pet];
      if (!p) return;
      var skin = D.SKIN_BY_KEY[e.skin];
      var c = el('div', 'pet-cell');
      c.style.borderColor = D.GRADES[p.grade].color;
      c.appendChild(img(SPR.petCanvas(p, e.skin, 56, 0.2)));
      c.appendChild(el('div', 'pc-nm', p.name));
      if (skin && skin.key !== 'base') c.appendChild(el('i', 'pc-sk', '✨'));
      var bl = GS.bondLevel(e);
      if (bl > 0) c.appendChild(el('i', 'pc-hp', '♥' + bl));
      c.onclick = function () { SFX.tap(); onClick(e, i); };
      wrap.appendChild(c);
    });
  }

  function petDetail(e, actionLabel, action) {
    var p = D.PET_BY_ID[e.pet];
    var skin = D.SKIN_BY_KEY[e.skin];
    var body = el('div', 'res-center');
    body.appendChild(img(SPR.petCanvas(p, e.skin, 128, 0.2)));
    body.appendChild(el('div', 'res-grade', gradeTag(p.grade)));
    body.appendChild(el('div', 'res-name', p.name));
    if (skin.key !== 'base') body.appendChild(el('div', 'res-skin', '✨ ' + skin.name + ' 스킨'));
    var bl = GS.bondLevel(e);
    var nx = GS.bondNext(e);
    var info = el('div');
    info.innerHTML =
      '<div class="detail-row"><span>고향</span><b>' + p.regionName + '</b></div>' +
      '<div class="detail-row"><span>친밀도</span><b class="hearts">' +
        (bl ? new Array(bl + 1).join('♥') : '-') + ' ' + bl + '단계</b></div>' +
      '<div class="detail-row"><span>다음 단계까지</span><b>' +
        (nx === null ? '최고 단계!' : '하트 ' + nx + '개') + '</b></div>' +
      '<div class="detail-row"><span>분당 코인</span><b>💰 ' +
        (Math.round(GS.petCoin(e) * 10) / 10) + '</b></div>';
    body.appendChild(info);

    if (nx !== null) {
      var foods = el('div', 'food-row');
      foods.style.marginTop = '10px';
      D.FOODS.forEach(function (f) {
        var ok = GS.s.coin >= f.price;
        var fc = el('div', 'food-cell' + (ok ? '' : ' off'));
        fc.innerHTML = '<div class="fd-ico">' + f.icon + '</div>' +
          '<div class="fd-nm">' + f.name + '</div>' +
          '<div class="fd-pr">💰' + num(f.price) + '</div>' +
          '<div class="fd-all">♥ +' + f.heart + '</div>';
        if (ok) fc.onclick = function () {
          if (GS.feedPet(e, f.id)) {
            SFX.ok();
            UI.toast(p.name + '이(가) 기뻐해요! 친밀도 +' + f.heart);
            GS.save();
            UI.closeModal();
            renderAll();
          }
        };
        foods.appendChild(fc);
      });
      body.appendChild(el('div', 'res-sub', '먹이 주기'));
      body.appendChild(foods);
    }

    UI.dialog('펫 정보', body, [
      { label: '닫기', onClick: UI.closeModal },
      { label: actionLabel, pri: true, onClick: function () { UI.closeModal(); action(); } }
    ]);
  }

  /* ============================================================
     도감
     ============================================================ */
  function renderDex() {
    var total = D.PETS.length;
    var got = GS.dexCount();
    $('#dex-rate').textContent = got + ' / ' + total + ' · 스킨 ' + GS.dexSkinCount() + '종';
    $('#dex-fill').style.width = (got / total * 100) + '%';

    var rw = $('#dex-rewards');
    rw.innerHTML = '';
    GS.dexRewardState().forEach(function (r) {
      var t = el('div', 'dex-rw' + (r.got ? ' got' : (r.ready ? ' ready' : '')));
      t.textContent = r.need + '종 → 💰' + num(r.coin) + (r.got ? ' ✓' : (r.ready ? ' 받기!' : ''));
      if (r.ready) t.onclick = function () {
        var c = GS.claimDexReward(r.idx);
        if (c) { SFX.coin(); UI.toast('도감 보상 💰 ' + num(c) + ' 획득!'); GS.save(); renderAll(); }
      };
      rw.appendChild(t);
    });

    var tabs = $('#dex-tabs');
    tabs.innerHTML = '';
    var tabList = [{ k: 'all', n: '전체' }].concat(D.REGIONS.map(function (r) { return { k: r.key, n: r.name }; }));
    tabList.forEach(function (t) {
      var b = el('button', 'tab' + (dexTab === t.k ? ' on' : ''), t.n);
      b.onclick = function () { SFX.tap(); dexTab = t.k; renderDex(); };
      tabs.appendChild(b);
    });

    var grid = $('#dex-grid');
    grid.innerHTML = '';
    D.PETS.filter(function (p) { return dexTab === 'all' || p.region === dexTab; })
      .forEach(function (p) {
        var entry = GS.s.dex[p.id];
        var c = el('div', 'dex-cell' + (entry ? '' : ' un'));
        c.style.borderColor = entry ? D.GRADES[p.grade].color : '';
        var skinKeys = entry ? Object.keys(entry.skins) : [];
        var best = 'base';
        skinKeys.forEach(function (k) {
          if (D.SKIN_BY_KEY[k].tier > D.SKIN_BY_KEY[best].tier) best = k;
        });
        c.appendChild(img(SPR.petCanvas(p, entry ? best : 'base', 52, 0.2)));
        c.appendChild(el('div', 'dc-nm', entry ? p.name : '???'));
        c.appendChild(el('div', 'dc-sk', entry ? '스킨 ' + skinKeys.length + '/' + D.SKINS.length : D.GRADES[p.grade].name));
        if (entry) c.onclick = function () { SFX.tap(); dexDetail(p, entry); };
        grid.appendChild(c);
      });
  }

  function dexDetail(p, entry) {
    var body = el('div', 'res-center');
    body.appendChild(img(SPR.petCanvas(p, 'base', 110, 0.2)));
    body.appendChild(el('div', 'res-grade', gradeTag(p.grade)));
    body.appendChild(el('div', 'res-name', p.name));
    body.appendChild(el('div', 'res-sub', p.regionName + ' · 분당 💰 ' + D.GRADES[p.grade].coin));

    var sk = el('div');
    sk.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-top:12px';
    D.SKINS.forEach(function (s) {
      var has = !!entry.skins[s.key];
      var cell = el('div');
      cell.style.cssText = 'text-align:center;font-size:9px;padding:3px;border:2px solid ' +
        (has ? '#6ee7a8' : '#3a2d70') + ';color:' + (has ? '#f4f0ff' : '#5c4f94');
      var im = img(SPR.petCanvas(p, s.key, 40, 0.2));
      im.style.cssText = 'width:36px;height:36px;display:block;margin:0 auto' + (has ? '' : ';filter:brightness(.35)');
      cell.appendChild(im);
      cell.appendChild(el('div', null, s.name));
      sk.appendChild(cell);
    });
    body.appendChild(el('div', 'res-sub', '스킨 도감'));
    body.appendChild(sk);

    UI.dialog('도감', body, [{ label: '닫기', pri: true, onClick: UI.closeModal }]);
  }

  /* ============================================================
     상점
     ============================================================ */
  function renderShop() {
    var wrap = $('#shop-list');
    wrap.innerHTML = '';
    D.SHOP.forEach(function (it) {
      var owned = !!GS.s.owned[it.id];
      var equipped = GS.s.gear[it.slot] === it.id;
      var row = el('div', 'shop-item' + (owned ? ' owned' : ''));
      var desc = Object.keys(it.stat).map(function (k) {
        var s = D.STATS.filter(function (x) { return x.key === k; })[0];
        return s.name + ' +' + it.stat[k];
      }).join(' · ');
      row.innerHTML =
        '<div class="si-ico">' + it.icon + '</div>' +
        '<div class="si-body"><div class="si-nm">' + it.name +
        ' <span style="color:#b3a6dd;font-size:10px">(' + D.SLOT_NAMES[it.slot] + ')</span></div>' +
        '<div class="si-ds">' + desc + '</div></div>';
      var btn = el('button', 'si-buy');
      if (owned) {
        btn.textContent = equipped ? '착용 중' : '착용하기';
        btn.onclick = function () { GS.equip(it.id); SFX.tap(); GS.save(); renderAll(); };
      } else {
        btn.textContent = '💰 ' + num(it.price);
        btn.disabled = GS.s.coin < it.price;
        btn.onclick = function () {
          if (GS.buy(it.id)) { SFX.coin(); UI.toast(it.name + ' 구매 완료!'); GS.save(); renderAll(); }
        };
      }
      row.appendChild(btn);
      wrap.appendChild(row);
    });
  }

  /* ============================================================
     설정
     ============================================================ */
  function openSettings() {
    var s = GS.s;
    var acc = s.quizCount ? Math.round(s.quizRight / s.quizCount * 100) : 0;
    var body = el('div');
    body.innerHTML =
      '<div class="detail-row"><span>레벨</span><b>Lv.' + s.level + '</b></div>' +
      '<div class="detail-row"><span>푼 문제</span><b>' + num(s.quizCount) + '문제 (정답률 ' + acc + '%)</b></div>' +
      '<div class="detail-row"><span>찬 알</span><b>' + num(s.kicks) + '개</b></div>' +
      '<div class="detail-row"><span>최고 기록</span><b>' + num(s.bestDist) + ' m</b></div>' +
      '<div class="detail-row"><span>모은 펫</span><b>' + (s.garden.length + s.storage.length) + '마리</b></div>' +
      '<div class="detail-row"><span>도감</span><b>' + GS.dexCount() + ' / ' + D.PETS.length + '</b></div>' +
      '<div class="detail-row"><span>제단 단계 합</span><b>' +
        D.ALTARS.reduce(function (a, x) { return a + GS.altar(x.key).lv; }, 0) +
        ' / ' + (D.ALTARS.length * D.ALTAR_MAX_LV) + '</b></div>' +
      '<div class="detail-row"><span>정원 장식</span><b>' +
        Object.keys(s.decos).length + ' / ' + D.DECOS.length +
        ' (코인 +' + Math.round(GS.decoBonus() * 100) + '%)</b></div>';

    var soundBtn = el('button', 'sub-btn', '🔊 소리 ' + (s.sound ? '켜짐' : '꺼짐'));
    soundBtn.style.marginTop = '12px';
    soundBtn.onclick = function () {
      s.sound = !s.sound;
      soundBtn.textContent = '🔊 소리 ' + (s.sound ? '켜짐' : '꺼짐');
      GS.save();
    };
    body.appendChild(soundBtn);

    var resetBtn = el('button', 'sub-btn', '⚠ 처음부터 다시 시작');
    resetBtn.onclick = function () {
      UI.confirmBox('정말 초기화할까요?', '모든 펫과 도감이 사라져요.<br>되돌릴 수 없어요!', function () {
        GS.reset();
        fruits = [];
        dexTab = 'all';
        renderAll();
        go('s-home');
        UI.toast('처음부터 다시 시작합니다');
      }, '초기화');
    };
    body.appendChild(resetBtn);

    UI.dialog('설정 · 내 기록', body, [{ label: '닫기', pri: true, onClick: UI.closeModal }]);
  }

  /* ============================================================
     루프
     ============================================================ */
  function makeLoop(update, draw) {
    var raf = null, on = false, last = 0;
    function step(ts) {
      raf = requestAnimationFrame(step);
      if (!on) return;
      var dt = Math.min(0.05, (ts - last) / 1000 || 0);
      last = ts;
      update && update(dt);
      draw && draw();
    }
    return {
      start: function () { on = true; last = performance.now(); if (!raf) raf = requestAnimationFrame(step); },
      stop: function () { on = false; }
    };
  }

  var homeLoop = makeLoop(homeUpdate, homeDraw);
  var gardenLoop = makeLoop(function (dt) { gardenTime += dt; }, gardenDraw);

  /* ============================================================
     시작
     ============================================================ */
  function boot() {
    GS.load();
    var dt = GS.advanceTime();

    homeCv = $('#home-canvas'); homeCtx = homeCv.getContext('2d');
    gardenCv = $('#garden-canvas'); gardenCtx = gardenCv.getContext('2d');
    homeCv.addEventListener('click', function (e) { homeClick(e); });

    setupKick();

    UI.$$('.nav-btn').forEach(function (b) {
      b.onclick = function () { SFX.tap(); go(b.dataset.go); };
    });
    $('#btn-settings').onclick = function () { SFX.tap(); openSettings(); };
    $('#btn-collect').onclick = function () {
      var got = GS.collect();
      if (got > 0) { SFX.coin(); UI.toast('💰 ' + num(got) + ' 코인 수확!'); GS.save(); renderAll(); }
      else UI.toast('아직 모인 코인이 없어요');
    };

    // 오프라인 보상 안내
    if (dt > 60000) {
      var mins = Math.floor(dt / 60000);
      setTimeout(function () {
        UI.toast('자리를 비운 ' + mins + '분 동안 알이 자라고 코인이 모였어요!', 3000);
      }, 400);
    }

    // 초기 알 하나 선물
    if (!GS.s.kicks && !GS.s.slots.filter(Boolean).length && !GS.s.bag.length && !GS.s.garden.length) {
      GS.s.slots[0] = { grade: 0, region: 0, prog: 0, need: D.GRADES[0].need };
      GS.save();
    }

    renderAll();
    homeLoop.start();

    // 1초 틱
    var tickN = 0;
    setInterval(function () {
      tickN++;
      GS.advanceTime();
      var w = GS.tickWeather();
      if (w) UI.toast('날씨가 ' + w.icon + ' ' + w.name + '(으)로 바뀌었어요!');

      var ev = GS.tickEvent();
      if (ev && ev.started) {
        SFX.rare();
        UI.toast(ev.started.icon + ' ' + ev.started.name + ' 시작! ' + ev.started.desc, 3500);
        renderAll();
      }
      if (ev && ev.ended) UI.toast('이벤트가 끝났어요');

      renderTop();
      renderBadges();
      if (current === 's-home') renderWeather();
      if (current === 's-altar' && !UI.isModalOpen()) renderAltar();
      if (current === 's-hatch' && !UI.isModalOpen()) renderHatch();
      if (current === 's-garden' && !UI.isModalOpen()) {
        $('#ui-pool').textContent = num(Math.floor(GS.s.coinPool));
        $('#ui-rate').textContent = GS.coinRate();
      }
      if (tickN % 5 === 0) GS.save();
    }, 1000);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) GS.save(true);
      else { GS.advanceTime(); renderAll(); }
    });
    window.addEventListener('beforeunload', function () { GS.save(true); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
