/* ============================================================
   공부알 탐험대 - 알 차기 미니게임
   상태: idle -> gauge -> kick -> fly -> land
   ============================================================ */
(function (root) {
  'use strict';

  var D = root.DATA;
  var GS = root.GS;
  var SPR = root.SPR;

  var W = 480, H = 300, GROUND = 252;
  var GAUGE_CENTER = 0.78;
  var PX_PER_M = 0.55;    // 월드 m -> 화면 px
  var WORLD_OFF = 150;    // 출발 지점의 월드 px 좌표
  var FOLLOW_X = 200;     // 카메라가 따라붙기 시작하는 화면 x

  var cv, ctx, raf = null, running = false;
  var cb = {};
  var st = null;
  var time = 0;

  function reset() {
    st = {
      mode: 'idle',
      gauge: 0, gdir: 1, gspeed: 1.15,
      judge: '', power: 0,
      kickT: 0,
      camX: 0,
      dist: 0, distNow: 0,
      flyT: 0, flyDur: 1,
      apex: 150,
      grade: 0, shownGrade: 0, gradeSteps: [],
      regionIdx: 0,
      flash: 0, flashText: '',
      landT: 0,
      eggAngle: 0,
      particles: []
    };
  }

  function init(canvas, callbacks) {
    cv = canvas;
    ctx = cv.getContext('2d');
    cb = callbacks || {};
    reset();
    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); tap(); });
  }

  function start() {
    running = true;
    if (!raf) loop(performance.now());
  }
  function stop() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  function say(t) { if (cb.onState) cb.onState(t); }

  /* ---------------- 입력 ---------------- */
  function begin() {
    if (st.mode !== 'idle') return;
    reset();
    st.mode = 'gauge';
    st.gspeed = 0.80 + Math.min(0.35, GS.s.kicks * 0.0025);
    say('타이밍에 맞춰 눌러!');
    if (cb.onMode) cb.onMode('gauge');
  }

  function tap() {
    if (st.mode === 'idle') { begin(); return; }
    if (st.mode !== 'gauge') return;
    judge();
  }

  function judge() {
    var g = st.gauge;
    var gw = GS.goodWidth(), pw = GS.perfectWidth();
    var d = Math.abs(g - GAUGE_CENTER);
    var power, label;
    if (d <= pw / 2) { power = 1.35; label = 'PERFECT!'; }
    else if (d <= gw / 2) { power = 1.0 + 0.15 * (1 - d / (gw / 2)); label = 'GOOD!'; }
    else { power = 0.35 + 0.35 * g; label = '아깝다…'; }

    st.judge = label;
    st.power = power;
    st.mode = 'kick';
    st.kickT = 0;
    root.UI.SFX.kick();
    say(label);
    if (cb.onMode) cb.onMode('kick');
  }

  /* ---------------- 발사 ---------------- */
  function launch() {
    var dist = GS.kickDistance(st.power);
    var regionIdx = GS.applyWeatherFavor(GS.regionOf(dist));
    if (regionIdx > GS.regionOf(dist)) dist = D.REGIONS[regionIdx].dist + 20;

    var bonus = st.judge === 'PERFECT!' ? 1.18 : (st.judge === 'GOOD!' ? 1.05 : 1);
    var grade = GS.rollGrade(regionIdx, bonus);

    st.dist = dist;
    st.regionIdx = regionIdx;
    st.grade = grade;
    st.shownGrade = 0;
    st.flyDur = Math.min(5.2, 1.5 + dist / 2200);
    st.apex = Math.min(186, 90 + Math.pow(dist, 0.52) * 2.2);
    st.flyT = 0;
    st.mode = 'fly';

    // 등급 상승 연출 시점
    st.gradeSteps = [];
    for (var i = 1; i <= grade; i++) {
      st.gradeSteps.push({ t: 0.16 + (0.62 * i) / (grade + 1), g: i, done: false });
    }
    if (cb.onMode) cb.onMode('fly');
  }

  function land() {
    st.mode = 'land';
    st.landT = 0;
    puff(eggScreenX(), GROUND - 6, D.GRADES[st.grade].color, 18);
    root.UI.SFX.tap();
    if (cb.onLand) cb.onLand({ dist: st.dist, regionIdx: st.regionIdx, gradeIdx: st.grade, judge: st.judge });
  }

  function finish() {
    reset();
    say('준비!');
    if (cb.onMode) cb.onMode('idle');
  }

  /* ---------------- 파티클 ---------------- */
  function puff(x, y, color, n) {
    for (var i = 0; i < n; i++) {
      st.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 170,
        vy: -Math.random() * 150 - 25,
        life: 0.5 + Math.random() * 0.5, t: 0,
        c: color, s: 2 + Math.random() * 3
      });
    }
  }

  /* ---------------- 좌표 ---------------- */
  function eggWorldPx() { return WORLD_OFF + st.distNow * PX_PER_M; }
  function eggScreenX() {
    if (st.mode === 'fly' || st.mode === 'land') return eggWorldPx() - st.camX;
    return WORLD_OFF;
  }
  // 화면 x -> 월드 거리(m)
  function metersAt(screenX) {
    return Math.max(0, (st.camX + screenX - WORLD_OFF) / PX_PER_M);
  }
  function eggScreenY() {
    if (st.mode === 'fly') {
      var p = st.flyT / st.flyDur;
      return GROUND - 18 - 4 * st.apex * p * (1 - p);
    }
    if (st.mode === 'land') return GROUND - 18;
    if (st.mode === 'kick') {
      var k = st.kickT;
      return GROUND - 18 - (k > 0.22 ? (k - 0.22) * 110 : 0);
    }
    return GROUND - 18;
  }

  /* ---------------- 업데이트 ---------------- */
  function update(dt) {
    time += dt;
    st.particles.forEach(function (p) {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt;
    });
    st.particles = st.particles.filter(function (p) { return p.t < p.life; });

    if (st.flash > 0) st.flash -= dt;

    if (st.mode === 'gauge') {
      st.gauge += st.gdir * st.gspeed * dt;
      if (st.gauge >= 1) { st.gauge = 1; st.gdir = -1; }
      if (st.gauge <= 0) { st.gauge = 0; st.gdir = 1; }
    } else if (st.mode === 'kick') {
      st.kickT += dt;
      if (st.kickT > 0.34) launch();
    } else if (st.mode === 'fly') {
      st.flyT += dt;
      var p = Math.min(1, st.flyT / st.flyDur);
      st.distNow = st.dist * p;
      st.eggAngle += dt * 9;
      st.camX = Math.max(0, eggWorldPx() - FOLLOW_X);

      st.gradeSteps.forEach(function (s) {
        if (!s.done && p >= s.t) {
          s.done = true;
          st.shownGrade = s.g;
          st.flash = 0.5;
          st.flashText = D.GRADES[s.g].name + ' 등급!';
          puff(eggScreenX(), eggScreenY(), D.GRADES[s.g].color, 12);
          if (s.g >= 4) root.UI.SFX.rare(); else root.UI.SFX.ok();
        }
      });

      if (p >= 1) { st.shownGrade = st.grade; land(); }
    } else if (st.mode === 'land') {
      st.landT += dt;
    }
  }

  /* ---------------- 배경 ---------------- */
  function regionAt(worldM) {
    var idx = 0;
    for (var i = 0; i < D.REGIONS.length; i++) if (worldM >= D.REGIONS[i].dist) idx = i;
    return idx;
  }

  function drawSky() {
    var centerM = metersAt(W / 2);
    var i = regionAt(centerM);
    var cur = D.REGIONS[i];
    var nxt = D.REGIONS[Math.min(D.REGIONS.length - 1, i + 1)];
    var span = nxt.dist - cur.dist;
    var t = span > 0 ? Math.max(0, Math.min(1, (centerM - cur.dist) / span)) : 0;
    t = Math.max(0, (t - 0.65) / 0.35);

    var g1 = ctx.createLinearGradient(0, 0, 0, GROUND);
    g1.addColorStop(0, cur.sky[0]);
    g1.addColorStop(1, cur.sky[1]);
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, GROUND);

    if (t > 0) {
      var g2 = ctx.createLinearGradient(0, 0, 0, GROUND);
      g2.addColorStop(0, nxt.sky[0]);
      g2.addColorStop(1, nxt.sky[1]);
      ctx.globalAlpha = t;
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, GROUND);
      ctx.globalAlpha = 1;
    }
  }

  function hash(n) {
    var x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  }

  function drawGround() {
    var step = 8;
    for (var x = 0; x < W; x += step) {
      var r = D.REGIONS[regionAt(metersAt(x))];
      ctx.fillStyle = r.ground;
      ctx.fillRect(x, GROUND, step, H - GROUND);
      ctx.fillStyle = SPR.shade(r.ground, -0.25);
      ctx.fillRect(x, GROUND + 14, step, H - GROUND - 14);
    }
  }

  function drawDeco() {
    // 60px 간격 월드 좌표에 장식
    var startIdx = Math.floor(st.camX / 60) - 1;
    for (var k = startIdx; k < startIdx + 11; k++) {
      var wx = k * 60 + hash(k) * 40;
      var sx = wx - st.camX;
      if (sx < -40 || sx > W + 40) continue;
      var ridx = regionAt(metersAt(sx));
      var r = D.REGIONS[ridx];
      var h = hash(k * 3.3);
      var size = 14 + h * 16;
      ctx.fillStyle = r.deco;
      if (ridx === 0 || ridx === 6) {            // 나무
        ctx.fillRect(sx + size * 0.4, GROUND - size * 0.6, size * 0.2, size * 0.6);
        ctx.beginPath();
        ctx.arc(sx + size * 0.5, GROUND - size * 0.8, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (ridx === 3) {                   // 화산 바위
        ctx.beginPath();
        ctx.moveTo(sx, GROUND);
        ctx.lineTo(sx + size * 0.5, GROUND - size);
        ctx.lineTo(sx + size, GROUND);
        ctx.fill();
      } else if (ridx === 9 || ridx === 8) {     // 결정 / 별
        ctx.beginPath();
        ctx.moveTo(sx + size * 0.5, GROUND - size);
        ctx.lineTo(sx + size, GROUND - size * 0.3);
        ctx.lineTo(sx + size * 0.5, GROUND);
        ctx.lineTo(sx, GROUND - size * 0.3);
        ctx.fill();
      } else {                                   // 덤불 / 언덕
        ctx.beginPath();
        ctx.arc(sx + size * 0.5, GROUND, size * 0.55, Math.PI, 0);
        ctx.fill();
      }
    }
  }

  function drawFlags() {
    D.REGIONS.forEach(function (r, i) {
      if (i === 0) return;
      var sx = WORLD_OFF + r.dist * PX_PER_M - st.camX;
      if (sx < -70 || sx > W + 70) return;
      ctx.fillStyle = '#2b2440';
      ctx.fillRect(sx, GROUND - 44, 3, 44);
      ctx.fillStyle = r.tint;
      ctx.fillRect(sx + 3, GROUND - 44, 30, 14);
      ctx.fillStyle = '#1b1430';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(r.name.slice(0, 4), sx + 5, GROUND - 34);
    });
  }

  /* ---------------- 그리기 ---------------- */
  function drawPlayer() {
    var sx = 90 - st.camX;
    if (sx < -60 || sx > W + 60) return;
    var pc = SPR.playerCanvas(64, GS.s.gear);
    var bob = st.mode === 'kick' ? Math.sin(st.kickT * 22) * 3 : 0;
    ctx.save();
    if (st.mode === 'kick') {
      ctx.translate(sx + 32, GROUND);
      ctx.rotate(-Math.min(0.5, st.kickT * 2.2));
      ctx.drawImage(pc, -32, -64 + bob);
    } else {
      ctx.drawImage(pc, sx, GROUND - 64 + bob);
    }
    ctx.restore();
  }

  function drawEgg() {
    var gIdx = (st.mode === 'fly' || st.mode === 'land') ? st.shownGrade : 0;
    var img = SPR.eggCanvas(gIdx, 40, time * 0.5);
    var x = eggScreenX(), y = eggScreenY();
    ctx.save();
    ctx.translate(x + 20, y + 20);
    if (st.mode === 'fly') ctx.rotate(st.eggAngle);
    ctx.drawImage(img, -20, -20);
    ctx.restore();

    if (st.mode === 'fly' && gIdx >= 4) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = D.GRADES[gIdx].color;
      for (var i = 1; i <= 5; i++) {
        var p = Math.max(0, st.flyT - i * 0.045) / st.flyDur;
        var tx = WORLD_OFF + st.dist * p * PX_PER_M - st.camX + 20;
        var ty = GROUND - 18 - 4 * st.apex * p * (1 - p) + 20;
        ctx.fillRect(tx - 2, ty - 2, 4, 4);
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawGauge() {
    if (st.mode !== 'gauge' && st.mode !== 'kick') return;
    var bx = 40, by = H - 34, bw = W - 80, bh = 18;
    ctx.fillStyle = '#0f0a1fcc';
    ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
    ctx.fillStyle = '#2a2050';
    ctx.fillRect(bx, by, bw, bh);

    var gw = GS.goodWidth(), pw = GS.perfectWidth();
    ctx.fillStyle = '#6ee7a8';
    ctx.fillRect(bx + (GAUGE_CENTER - gw / 2) * bw, by, gw * bw, bh);
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(bx + (GAUGE_CENTER - pw / 2) * bw, by, pw * bw, bh);

    ctx.fillStyle = '#fff';
    ctx.fillRect(bx + st.gauge * bw - 2, by - 5, 4, bh + 10);

    ctx.fillStyle = '#f4f0ff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('탭!', W / 2, by - 10);
  }

  function drawHud() {
    if (st.mode === 'fly' || st.mode === 'land') {
      var m = Math.round(st.distNow);
      ctx.fillStyle = '#0f0a1fcc';
      ctx.fillRect(8, 8, 128, 42);
      ctx.fillStyle = '#ffd34d';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(m + ' m', 16, 28);
      ctx.fillStyle = '#f4f0ff';
      ctx.font = '11px sans-serif';
      ctx.fillText(D.REGIONS[regionAt(st.distNow)].name, 16, 44);
    }
    if (st.flash > 0) {
      ctx.globalAlpha = Math.min(1, st.flash * 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#1b1430';
      ctx.lineWidth = 4;
      ctx.strokeText(st.flashText, W / 2, 80);
      ctx.fillText(st.flashText, W / 2, 80);
      ctx.globalAlpha = 1;
    }
    if (st.mode === 'idle') {
      ctx.fillStyle = '#0f0a1fcc';
      ctx.fillRect(0, GROUND - 76, W, 34);
      ctx.fillStyle = '#f4f0ff';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('아래 버튼을 눌러 알을 놓고 힘껏 차자!', W / 2, GROUND - 54);
    }
  }

  function drawParticles() {
    st.particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, p.s, p.s);
    });
    ctx.globalAlpha = 1;
  }

  function draw() {
    drawSky();
    drawGround();
    drawDeco();
    drawFlags();
    drawPlayer();
    drawEgg();
    drawParticles();
    drawGauge();
    drawHud();
  }

  var last = 0;
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (!running) return;
    var dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    update(dt);
    draw();
  }

  root.KICK = {
    init: init, start: start, stop: stop,
    begin: begin, tap: tap, finish: finish,
    get mode() { return st ? st.mode : 'idle'; }
  };
})(window);
