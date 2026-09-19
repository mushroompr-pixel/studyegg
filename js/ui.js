/* ============================================================
   공부알 탐험대 - 공통 UI (모달 / 토스트 / 사운드 / 퀴즈창)
   ============================================================ */
(function (root) {
  'use strict';

  var D = root.DATA;
  var modalRoot = null;
  var toastRoot = null;

  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ---------------- 사운드 ---------------- */
  var ac = null;
  function actx() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = false; }
    }
    return ac || null;
  }
  function beep(freq, dur, type, vol) {
    if (!root.GS || !root.GS.s || !root.GS.s.sound) return;
    var c = actx(); if (!c) return;
    if (c.state === 'suspended') c.resume();
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.value = (vol == null ? 0.05 : vol);
    o.connect(g); g.connect(c.destination);
    var t = c.currentTime;
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  }
  var SFX = {
    tap: function () { beep(660, 0.05); },
    ok: function () { beep(880, 0.08); setTimeout(function () { beep(1320, 0.12); }, 80); },
    no: function () { beep(220, 0.18, 'sawtooth', 0.04); },
    kick: function () { beep(180, 0.1, 'square', 0.06); setTimeout(function () { beep(520, 0.12); }, 60); },
    coin: function () { beep(1046, 0.06); setTimeout(function () { beep(1568, 0.1); }, 55); },
    hatch: function () {
      [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { beep(f, 0.12); }, i * 90); });
    },
    rare: function () {
      [784, 988, 1174, 1568, 2093].forEach(function (f, i) { setTimeout(function () { beep(f, 0.16, 'triangle', 0.07); }, i * 100); });
    }
  };

  /* ---------------- 토스트 ---------------- */
  function toast(msg, ms) {
    if (!toastRoot) toastRoot = document.getElementById('toast-root');
    var t = el('div', 'toast', msg);
    toastRoot.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .3s';
      t.style.opacity = '0';
      setTimeout(function () { t.remove(); }, 320);
    }, ms || 1800);
  }

  /* ---------------- 모달 ---------------- */
  var modalStack = 0;
  function openModal(node, opts) {
    opts = opts || {};
    if (!modalRoot) modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = '';
    var box = el('div', 'modal');
    box.appendChild(node);
    modalRoot.appendChild(box);
    modalRoot.classList.remove('hidden');
    modalStack = 1;
    modalRoot.onclick = function (e) {
      if (e.target === modalRoot && opts.dismissible !== false) closeModal();
    };
    return box;
  }
  function closeModal() {
    if (!modalRoot) modalRoot = document.getElementById('modal-root');
    modalRoot.classList.add('hidden');
    modalRoot.innerHTML = '';
    modalStack = 0;
  }
  function isModalOpen() { return modalStack > 0; }

  function dialog(title, bodyHTML, buttons) {
    var wrap = el('div');
    wrap.appendChild(el('h3', null, title));
    var body = el('div', 'm-body');
    if (typeof bodyHTML === 'string') body.innerHTML = bodyHTML; else body.appendChild(bodyHTML);
    wrap.appendChild(body);
    if (buttons && buttons.length) {
      var acts = el('div', 'm-actions');
      buttons.forEach(function (b) {
        var btn = el('button', b.pri ? 'pri' : null, b.label);
        btn.onclick = function () { SFX.tap(); if (b.onClick) b.onClick(); else closeModal(); };
        acts.appendChild(btn);
      });
      wrap.appendChild(acts);
    }
    return openModal(wrap, { dismissible: !(buttons && buttons.length) ? true : false });
  }

  function confirmBox(title, msg, onYes, yesLabel) {
    dialog(title, '<p style="text-align:center;line-height:1.7">' + msg + '</p>', [
      { label: '취소', onClick: closeModal },
      { label: yesLabel || '확인', pri: true, onClick: function () { closeModal(); onYes && onYes(); } }
    ]);
  }

  /* ---------------- 퀴즈 창 ---------------- */
  // opts: { title, iconCanvas, rewardText, onResult(correct) }
  function openQuiz(opts) {
    var GS = root.GS;
    var q = root.QUIZ.make(GS.s.level);
    var wrap = el('div');
    wrap.appendChild(el('h3', null, opts.title || '퀴즈!'));

    if (opts.iconCanvas) {
      var head = el('div', 'qz-head');
      var img = new Image();
      img.src = opts.iconCanvas.toDataURL();
      head.appendChild(img);
      wrap.appendChild(head);
    }
    if (opts.rewardText) wrap.appendChild(el('div', 'qz-reward', opts.rewardText));

    var timerWrap = el('div', 'qz-timer');
    var timerBar = el('i');
    timerWrap.appendChild(timerBar);
    wrap.appendChild(timerWrap);

    wrap.appendChild(el('div', 'qz-q', q.text));

    var opts_ = el('div', 'qz-opts');
    var buttons = [];
    var answered = false;
    q.options.forEach(function (v) {
      var b = el('button', 'qz-opt', String(v));
      b.onclick = function () { choose(v, b); };
      opts_.appendChild(b);
      buttons.push(b);
    });
    wrap.appendChild(opts_);
    var res = el('div', 'qz-res', '');
    wrap.appendChild(res);

    openModal(wrap, { dismissible: false });

    // 타이머
    var total = q.time * 1000;
    var start = Date.now();
    var tid = setInterval(function () {
      var left = Math.max(0, total - (Date.now() - start));
      timerBar.style.width = (left / total * 100) + '%';
      if (left <= 0) { clearInterval(tid); if (!answered) choose(null, null); }
    }, 100);

    function choose(v, btn) {
      if (answered) return;
      answered = true;
      clearInterval(tid);
      var correct = (v === q.answer);
      buttons.forEach(function (b) {
        b.disabled = true;
        if (Number(b.textContent) === q.answer) b.classList.add('ok');
        else if (btn && b === btn) b.classList.add('no');
      });
      if (correct) { SFX.ok(); res.className = 'qz-res ok'; res.textContent = '정답! 🎉'; }
      else { SFX.no(); res.className = 'qz-res no'; res.textContent = (v === null ? '시간 초과…' : '아쉬워요…') + ' 정답은 ' + q.answer; }

      GS.s.quizCount++;
      if (correct) GS.s.quizRight++;

      setTimeout(function () {
        closeModal();
        opts.onResult && opts.onResult(correct, q);
      }, correct ? 750 : 1200);
    }
  }

  root.UI = {
    $: $, $$: $$, el: el,
    toast: toast,
    openModal: openModal, closeModal: closeModal, isModalOpen: isModalOpen,
    dialog: dialog, confirmBox: confirmBox,
    openQuiz: openQuiz,
    SFX: SFX
  };
})(window);
