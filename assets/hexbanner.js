(function () {
  'use strict';
  /* A drafting-table banner: white linework on blueprint blue. Hexagons are "drawn" as a climber walks up the sheet,
     leaving construction lines (circumcircle, diagonals, centre cross) that slowly fade, like a plan being inked. */
  var root = document.querySelector('[data-banner]');
  var cv = root && root.querySelector('canvas');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PHI = 1.618, SQ3 = Math.sqrt(3);
  var FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  var W = 0, H = 0, dpr = 1, R = 0, cols = 0, rows = 0, cells = [], climbers = [], ptr = null;
  var running = false, visible = true, t0 = performance.now(), last = t0, acc = 0, sp = null;

  function layout() {
    var r = cv.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    R = Math.max(26, Math.min(52, W / 22));
    var dx = SQ3 * R, dy = 1.5 * R;
    cols = Math.ceil(W / dx) + 2; rows = Math.ceil(H / dy) + 2;
    cells = [];
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      cells.push({ i: i, j: j, x: i * dx + (j % 2 ? dx / 2 : 0) - dx / 2, y: j * dy - dy / 2, v: 0, g: 0, hold: 0, label: '', ph: Math.random() * 6.283, sp: 0.25 + Math.random() * 0.5, ph2: Math.random() * 6.283 });
    }
    climbers = [];
    for (var k = 0; k < 3; k++) spawn(true);
  }
  function at(i, j) { return (i < 0 || j < 0 || i >= cols || j >= rows) ? null : cells[j * cols + i]; }
  function spawn(early) {
    climbers.push({ i: Math.floor(Math.random() * cols), j: rows - 1 - (early ? Math.floor(Math.random() * rows * 0.6) : 0), wait: early ? Math.random() * 3 : 0, n: 0, prev: null });
  }
  function around(c) {
    var odd = c.j % 2;
    return [[odd ? c.i : c.i - 1, c.j - 1], [odd ? c.i + 1 : c.i, c.j - 1], [c.i - 1, c.j], [c.i + 1, c.j]];
  }
  function step(dt) {
    climbers.forEach(function (m) {
      if ((m.wait -= dt) > 0) return;
      m.wait = 1.6 + Math.random() * 1.4;
      var c = at(m.i, m.j);
      if (c) { c.g = 1; c.hold = 3.5; c.from = m.prev; c.label = String.fromCharCode(65 + (m.n % 26)) + (1 + Math.floor(Math.random() * 9)); m.prev = c; }
      var opts = around(m).filter(function (p) { return at(p[0], p[1]); });
      var up = opts.filter(function (p) { return p[1] < m.j; });
      var pool = (up.length && Math.random() < 0.8) ? up : opts;
      var pick = pool[Math.floor(Math.random() * pool.length)];
      if (!pick) return;
      m.i = pick[0]; m.j = pick[1]; m.n++;
      if (m.j <= 0) { m.i = Math.floor(Math.random() * cols); m.j = rows - 1; m.wait = 3 + Math.random() * 4; m.prev = null; }
    });
  }

  function line(x1, y1, x2, y2) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
  function hex(c, r) {
    for (var k = 0; k < 6; k++) {
      var a = Math.PI / 180 * (60 * k - 30), px = c.x + r * Math.cos(a), py = c.y + r * Math.sin(a);
      if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  }
  var dashShift = 0;
  function stroke(alpha, w, dash) {
    ctx.lineDashOffset = dash ? dashShift : 0;
    ctx.strokeStyle = 'rgba(255,255,255,' + alpha.toFixed(3) + ')'; ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.stroke();
  }
  function text(s, x, y, size, alpha, align) {
    ctx.font = '500 ' + size + 'px ' + FONT; ctx.textAlign = align || 'left'; ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')'; ctx.fillText(s, x, y);
  }
  function arrow(x1, y, x2, label) {
    ctx.beginPath(); line(x1, y, x2, y); line(x1, y - 5, x1, y + 5); line(x2, y - 5, x2, y + 5);
    line(x1, y, x1 + 7, y - 3); line(x1, y, x1 + 7, y + 3); line(x2, y, x2 - 7, y - 3); line(x2, y, x2 - 7, y + 3);
    stroke(0.7, 1);
    var mx = (x1 + x2) / 2, w = ctx.measureText(label).width + 12;
    ctx.fillStyle = '#1030ff'; ctx.fillRect(mx - w / 2, y - 8, w, 16);
    text(label, mx, y + 4, 11, 0.9, 'center');
  }

  function draw(now, dt) {
    var s = (now - t0) / 1000;
    dashShift = -s * 5;                                                    // dashes crawl along their lines
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // graph paper: minor squares every 1/φ² of the major
    var maj = Math.round(R * 3.236), mn = maj / 5, x, y;
    ctx.beginPath(); for (x = 0; x <= W; x += mn) line(x, 0, x, H); for (y = 0; y <= H; y += mn) line(0, y, W, y); stroke(0.07, 1);
    ctx.beginPath(); for (x = 0; x <= W; x += maj) line(x, 0, x, H); for (y = 0; y <= H; y += maj) line(0, y, W, y); stroke(0.15, 1);

    // the hex plan: thin outlines everywhere, drafted detail where a climber has been
    for (var n = 0; n < cells.length; n++) {
      var c = cells[n];
      var br = 0.5 + 0.5 * Math.sin(s * c.sp + c.ph);                        // each hex breathes on its own rhythm
      ctx.beginPath(); hex(c, R); stroke(0.07 + 0.2 * br * br, 1);
      if (!still) {
        if (c.g > 0) { c.v += (1 - c.v) * Math.min(1, dt * 1.6); c.hold -= dt; if (c.hold <= 0) c.g = 0; }   // ink in slowly, hold, then let go
        else c.v *= Math.pow(0.5, dt / 3.2);
      }
      var v = c.v;
      if (v > 0.03) {
        var o1 = 0.5 + 0.5 * Math.sin(s * 0.7 + c.ph), o2 = 0.5 + 0.5 * Math.sin(s * 0.45 + c.ph2), o3 = 0.5 + 0.5 * Math.sin(s * 0.9 + c.ph + c.ph2);
        ctx.beginPath(); hex(c, R); stroke(0.3 + v * 0.55 + 0.15 * o1 * v, 1.6);
        ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, 6.2832); stroke(v * (0.2 + 0.4 * o2), 0.8, [3, 3]);                 // circumcircle
        ctx.beginPath(); ctx.arc(c.x, c.y, R * SQ3 / 2, 0, 6.2832); stroke(v * (0.12 + 0.4 * o3), 0.8);              // incircle
        ctx.beginPath();
        for (var k = 0; k < 3; k++) { var a = Math.PI / 180 * (60 * k - 30); line(c.x - R * Math.cos(a), c.y - R * Math.sin(a), c.x + R * Math.cos(a), c.y + R * Math.sin(a)); }
        stroke(v * (0.15 + 0.45 * o1), 0.8, [6, 3, 1, 3]);                                                           // axes, chain line
        ctx.beginPath(); line(c.x - 5, c.y, c.x + 5, c.y); line(c.x, c.y - 5, c.x, c.y + 5); stroke(v * (0.5 + 0.5 * o3), 1);
        if (c.from && c.from.v > 0.03) { ctx.beginPath(); line(c.from.x, c.from.y, c.x, c.y); stroke(Math.min(v, c.from.v) * (0.3 + 0.5 * o2), 1, [2, 4]); }
        if (R > 30) text(c.label, c.x + R * 0.18, c.y - R * 0.18, 10, (v * (0.4 + 0.5 * o1)).toFixed(2));
      }
    }

    // pencil: crosshair, radius and coordinates under the pointer
    if (ptr) {
      sp = ptr;
      ctx.beginPath(); line(sp.x - 14, sp.y, sp.x + 14, sp.y); line(sp.x, sp.y - 14, sp.x, sp.y + 14); stroke(0.9, 1);
      ctx.beginPath(); ctx.arc(sp.x, sp.y, R * PHI, 0, 6.2832); stroke(0.35, 1, [4, 4]);
      text('x ' + Math.round(sp.x) + '  y ' + Math.round(sp.y), sp.x + 12, sp.y - 10, 10, 0.85);
    }

    // sheet furniture: border, crop marks, dimension, title block
    var m = 14;
    ctx.beginPath(); ctx.rect(m, m, W - 2 * m, H - 2 * m); stroke(0.55, 1);
    ctx.beginPath(); ctx.rect(m + 5, m + 5, W - 2 * m - 10, H - 2 * m - 10); stroke(0.25, 1);
    if (W > 700) {
      arrow(W - m - 5 - R * PHI * 2 - 22, m + 34, W - m - 5 - 22, '1 : 1');
      var tw = 300, th = 86, tx = W - m - 5 - tw, ty = H - m - 5 - th;
      ctx.fillStyle = '#1030ff'; ctx.fillRect(tx, ty, tw, th);
      ctx.beginPath(); ctx.rect(tx, ty, tw, th); line(tx, ty + 44, tx + tw, ty + 44); line(tx + 200, ty + 44, tx + 200, ty + th); stroke(0.8, 1);
      text('QUINDE STUDIO', tx + 12, ty + 20, 13, 1);
      text('Plan for games and apps', tx + 12, ty + 36, 10, 0.8);
      text('SHEET', tx + 12, ty + 60, 9, 0.7); text('01 / 01', tx + 12, ty + 76, 12, 1);
      text('SCALE', tx + 212, ty + 60, 9, 0.7); text('1 : 1', tx + 212, ty + 76, 12, 1);
    }
  }

  function loop(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    step(dt);
    draw(now, dt);
    requestAnimationFrame(loop);
  }
  function start() { if (!running && !still && visible && !document.hidden) { running = true; last = performance.now(); requestAnimationFrame(loop); } }
  function stop() { running = false; }

  layout();
  var w; for (w = 0; w < (still ? 60 : 40); w++) step(1.2);
  if (still) { cells.forEach(function (c) { if (c.g > 0) c.v = 0.7; }); draw(performance.now(), 0); } else { cells.forEach(function (c) { c.v = c.g > 0 ? 0.8 : 0; }); start(); }
  root.classList.add('is-live');

  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { layout(); if (still) draw(performance.now(), 0); }, 120); });
  root.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); ptr = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  root.addEventListener('pointerleave', function () { ptr = null; });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); else stop(); }).observe(root);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else { cells.forEach(function (c) { c.v = c.g > 0 ? 0.8 : 0; }); start(); } });
})();
