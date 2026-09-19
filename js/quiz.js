/* ============================================================
   공부알 탐험대 - 퀴즈 생성기
   레벨에 따라 난이도가 올라가는 사지선다 문제를 만든다.
   ============================================================ */
(function (root) {
  'use strict';

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* 난이도 단계 계산 (레벨 1~ ) */
  function tierOf(level) {
    if (level < 3) return 0;   // 20 이내 덧셈/뺄셈
    if (level < 6) return 1;   // 100 이내 덧셈/뺄셈, 2~5단
    if (level < 10) return 2;  // 구구단 전체, 간단한 나눗셈
    if (level < 16) return 3;  // 두 자리 계산, 빈칸 채우기
    return 4;                  // 혼합 계산
  }

  /* 오답 보기 만들기 */
  function makeOptions(answer) {
    var set = [answer];
    var guard = 0;
    while (set.length < 4 && guard++ < 200) {
      var d;
      var span = Math.max(3, Math.round(Math.abs(answer) * 0.35));
      d = answer + ri(-span, span);
      if (Math.random() < 0.35) d = answer + pick([1, -1, 2, -2, 10, -10]);
      if (d < 0) d = Math.abs(d) + 1;
      if (set.indexOf(d) === -1) set.push(d);
    }
    while (set.length < 4) set.push(answer + set.length * 3 + 1);
    // 섞기
    for (var i = set.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = set[i]; set[i] = set[j]; set[j] = t;
    }
    return set;
  }

  function build(text, answer) {
    return { text: text, answer: answer, options: makeOptions(answer) };
  }

  var MAKERS = [
    // tier 0
    [
      function () { var a = ri(1, 12), b = ri(1, 9); return build(a + ' + ' + b + ' = ?', a + b); },
      function () { var a = ri(5, 20), b = ri(1, 5); return build(a + ' - ' + b + ' = ?', a - b); },
      function () { var a = ri(1, 9), b = ri(1, 9), c = ri(1, 5); return build(a + ' + ' + b + ' + ' + c + ' = ?', a + b + c); }
    ],
    // tier 1
    [
      function () { var a = ri(12, 60), b = ri(8, 39); return build(a + ' + ' + b + ' = ?', a + b); },
      function () { var a = ri(30, 99), b = ri(5, 29); return build(a + ' - ' + b + ' = ?', a - b); },
      function () { var a = ri(2, 5), b = ri(2, 9); return build(a + ' × ' + b + ' = ?', a * b); },
      function () { var b = ri(2, 5), q = ri(2, 9); return build((b * q) + ' ÷ ' + b + ' = ?', q); }
    ],
    // tier 2
    [
      function () { var a = ri(2, 9), b = ri(2, 9); return build(a + ' × ' + b + ' = ?', a * b); },
      function () { var b = ri(2, 9), q = ri(2, 9); return build((b * q) + ' ÷ ' + b + ' = ?', q); },
      function () { var a = ri(40, 150), b = ri(20, 90); return build(a + ' + ' + b + ' = ?', a + b); },
      function () { var a = ri(50, 150), b = ri(10, 49); return build(a + ' - ' + b + ' = ?', a - b); },
      function () { var a = ri(2, 9), b = ri(1, 9); return build('□ × ' + a + ' = ' + (a * b) + '  →  □ = ?', b); }
    ],
    // tier 3
    [
      function () { var a = ri(11, 40), b = ri(2, 9); return build(a + ' × ' + b + ' = ?', a * b); },
      function () { var b = ri(3, 9), q = ri(11, 30); return build((b * q) + ' ÷ ' + b + ' = ?', q); },
      function () { var a = ri(100, 480), b = ri(50, 320); return build(a + ' + ' + b + ' = ?', a + b); },
      function () { var a = ri(200, 700), b = ri(50, 190); return build(a + ' - ' + b + ' = ?', a - b); },
      function () { var a = ri(5, 30), b = ri(3, 20); return build('□ + ' + a + ' = ' + (a + b) + '  →  □ = ?', b); },
      function () { var a = ri(2, 9), b = ri(2, 9), c = ri(1, 20); return build(a + ' × ' + b + ' + ' + c + ' = ?', a * b + c); }
    ],
    // tier 4
    [
      function () { var a = ri(12, 60), b = ri(11, 30); return build(a + ' × ' + b + ' = ?', a * b); },
      function () { var b = ri(4, 12), q = ri(12, 60); return build((b * q) + ' ÷ ' + b + ' = ?', q); },
      function () { var a = ri(3, 12), b = ri(3, 12), c = ri(2, 9); return build(a + ' × ' + b + ' - ' + c + ' = ?', a * b - c); },
      function () { var a = ri(500, 2000), b = ri(200, 1500); return build(a + ' + ' + b + ' = ?', a + b); },
      function () { var a = ri(4, 12), b = ri(4, 12); return build('□ × ' + a + ' = ' + (a * b) + '  →  □ = ?', b); },
      function () { var a = ri(2, 9), b = ri(2, 9), c = ri(2, 6); return build('(' + a + ' + ' + b + ') × ' + c + ' = ?', (a + b) * c); }
    ]
  ];

  function make(level) {
    var t = tierOf(level || 1);
    var q = pick(MAKERS[t])();
    q.tier = t;
    q.time = [14, 14, 16, 18, 22][t];
    return q;
  }

  root.QUIZ = { make: make, tierOf: tierOf };
})(window);
