/* Project pages: lightbox, in-page navigation and the small interactive previews. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Reveal what needs JavaScript */
  $$('[data-needs-js]').forEach(function (el) { el.hidden = false; });

  /* In-page navigation: mark the section being read */
  (function () {
    var links = $$('.subnav a');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) map[s.id] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id]) {
          links.forEach(function (a) { a.removeAttribute('aria-current'); });
          map[e.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  })();

  /* Lightbox for screenshots */
  (function () {
    var zooms = $$('a.zoom');
    if (!zooms.length || typeof HTMLDialogElement === 'undefined') return;
    var dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.setAttribute('aria-label', 'Screenshot viewer');
    dlg.innerHTML = '<figure class="lb-fig"><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="lb-btn lb-close" aria-label="Close">×</button>' +
      '<button type="button" class="lb-btn lb-prev" aria-label="Previous screenshot">‹</button>' +
      '<button type="button" class="lb-btn lb-next" aria-label="Next screenshot">›</button>';
    document.body.appendChild(dlg);
    var im = $('img', dlg), cap = $('figcaption', dlg), cur = 0, opener = null;
    function show(i) {
      cur = (i + zooms.length) % zooms.length;
      var a = zooms[cur], t = $('img', a);
      im.src = a.getAttribute('href'); im.alt = t ? t.alt : '';
      cap.textContent = a.getAttribute('data-caption') || '';
    }
    zooms.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); opener = a; show(i); dlg.showModal(); });
    });
    $('.lb-close', dlg).addEventListener('click', function () { dlg.close(); });
    $('.lb-prev', dlg).addEventListener('click', function () { show(cur - 1); });
    $('.lb-next', dlg).addEventListener('click', function () { show(cur + 1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
    dlg.addEventListener('close', function () { if (opener) opener.focus(); });
  })();

  /* Dusk: warmth preview */
  function dusk(root) {
    var k = $('#dusk-k', root), d = $('#dusk-d', root), tint = $('.w-tint', root), dim = $('.w-dim', root);
    function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
    function kelvin(K) {
      var t = K / 100, r, g, b;
      if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307; }
      else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); b = 255; }
      return [clamp(r), clamp(g), clamp(b)];
    }
    function update() {
      var c = kelvin(+k.value);
      tint.style.background = 'rgb(' + c.join(',') + ')';
      dim.style.opacity = (+d.value) / 100;
      $('#dusk-k-out', root).textContent = k.value + ' K';
      $('#dusk-d-out', root).textContent = d.value + ' %';
    }
    k.addEventListener('input', update); d.addEventListener('input', update);
    $$('[data-k]', root).forEach(function (b) { b.addEventListener('click', function () { k.value = b.getAttribute('data-k'); update(); }); });
    update();
  }

  /* RepoSync: would it ask? */
  function reposync(root) {
    var ids = ['files', 'lines', 'ahead', 'mb'];
    function update() {
      var v = {}; ids.forEach(function (i) { v[i] = +$('#rs-' + i, root).value; $('#rs-' + i + '-out', root).textContent = v[i]; });
      var why = [];
      if (v.files > 10) why.push(v.files + ' files is more than 10.');
      if (v.lines > 300) why.push(v.lines + ' changed lines is more than 300.');
      if (v.ahead > 5) why.push(v.ahead + ' unpushed commits is more than 5.');
      if (v.mb > 50) why.push('A file over 50 MB.');
      if ($('#rs-del', root).checked) why.push('A deleted file always needs your approval.');
      if ($('#rs-secret', root).checked) why.push('A secret-like file always needs your approval.');
      var box = $('#rs-result', root);
      box.setAttribute('data-state', why.length ? 'ask' : 'push');
      $('#rs-title', root).textContent = why.length ? 'Waits for your OK' : 'Pushes silently';
      $('#rs-body', root).textContent = why.length
        ? 'RepoSync holds this change and shows an approval card. You can push it, skip it, or decide later.'
        : 'This is small and ordinary, so RepoSync commits and pushes it on its own at the next check.';
      var ul = $('#rs-reasons', root); ul.textContent = '';
      why.forEach(function (w) { var li = document.createElement('li'); li.textContent = w; ul.appendChild(li); });
    }
    $$('input', root).forEach(function (i) { i.addEventListener('input', update); i.addEventListener('change', update); });
    update();
  }

  /* GameInventor: live card */
  function card(root) {
    var stage = $('#gc-stage', root);
    function set(id, text) { $('#' + id, root).textContent = text; }
    function update() {
      set('gc-name-out', $('#gc-name', root).value || 'Untitled');
      set('gc-type-out', $('#gc-type', root).value);
      set('gc-text-out', $('#gc-text', root).value);
      set('gc-cost-out', $('#gc-cost', root).value);
      set('gc-atk-out', 'ATK ' + $('#gc-atk', root).value);
      set('gc-def-out', 'DEF ' + $('#gc-def', root).value);
      set('gc-rng-out', 'RNG ' + $('#gc-rng', root).value);
      stage.setAttribute('data-guides', $('#gc-guides', root).checked ? 'on' : 'off');
      stage.setAttribute('data-marks', $('#gc-marks', root).checked ? 'on' : 'off');
    }
    $$('input, select, textarea', root).forEach(function (i) { i.addEventListener('input', update); i.addEventListener('change', update); });
    update();
  }

  /* Magic Mountain: choose a mountain */
  function mountain(root) {
    var data = {
      short: { frames: 5, slots: 35, summit: 6, time: 'About 30 minutes', start: '3 START tiles. A fourth player shares a frame.' },
      standard: { frames: 9, slots: 63, summit: 8, time: 'About 45 minutes', start: '4 START tiles on the outer frames.' },
      expedition: { frames: 14, slots: 98, summit: 10, time: '60 minutes or more', start: '4 START tiles on the outer frames.' }
    };
    function update() {
      var key = $('input[name="mt"]:checked', root).value, d = data[key];
      $$('.mt-svg', root).forEach(function (s) { if (s.getAttribute('data-mountain') === key) s.removeAttribute('hidden'); else s.setAttribute('hidden', ''); });
      $('#mt-frames', root).textContent = d.frames; $('#mt-slots', root).textContent = d.slots;
      $('#mt-summit', root).textContent = d.summit; $('#mt-time', root).textContent = d.time;
      $('#mt-start', root).textContent = d.start + ' Each frame holds 7 tiles, and its number is its elevation.';
    }
    $$('input[name="mt"]', root).forEach(function (i) { i.addEventListener('change', update); });
    update();
  }

  /* Automata Dungeon: a Game of Life sandbox */
  function life(root) {
    var N = 12, cells = $$('.lf-cell', root), s = new Array(N * N).fill(0), gen = 0, timer = null;
    var runBtn = $('#lf-run', root);
    function paint() {
      var alive = 0;
      cells.forEach(function (c, i) { c.setAttribute('aria-pressed', s[i] ? 'true' : 'false'); alive += s[i]; });
      $('#lf-gen', root).textContent = gen; $('#lf-alive', root).textContent = alive;
      return alive;
    }
    function step() {
      var n = new Array(N * N).fill(0), changed = false;
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
        var k = 0;
        for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          var rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < N && cc >= 0 && cc < N) k += s[rr * N + cc];
        }
        var i = r * N + c; n[i] = s[i] ? (k === 2 || k === 3 ? 1 : 0) : (k === 3 ? 1 : 0);
        if (n[i] !== s[i]) changed = true;
      }
      s = n; gen += 1;
      var alive = paint();
      if (!changed || !alive) stop();
    }
    function stop() { clearInterval(timer); timer = null; runBtn.textContent = 'Run'; }
    function run() { if (timer) { stop(); return; } runBtn.textContent = 'Pause'; timer = setInterval(step, 450); }
    function load(list) { stop(); s = new Array(N * N).fill(0); list.forEach(function (p) { s[p[0] * N + p[1]] = 1; }); gen = 0; paint(); }
    cells.forEach(function (c, i) { c.addEventListener('click', function () { s[i] = s[i] ? 0 : 1; paint(); }); });
    runBtn.addEventListener('click', run);
    $('#lf-step', root).addEventListener('click', function () { stop(); step(); });
    $('#lf-clear', root).addEventListener('click', function () { load([]); });
    var presets = { blinker: [[5, 4], [5, 5], [5, 6]], block: [[5, 5], [5, 6], [6, 5], [6, 6]], glider: [[1, 2], [2, 3], [3, 1], [3, 2], [3, 3]] };
    $$('[data-preset]', root).forEach(function (b) { b.addEventListener('click', function () { load(presets[b.getAttribute('data-preset')]); }); });
    load(presets.glider);
  }

  /* Magic Mountain: tile explorer */
  function tiles(root) {
    function update() {
      var key = $('input[name="tl"]:checked', root).value;
      $$('.tl-panel', root).forEach(function (p) { if (p.getAttribute('data-tl') === key) p.removeAttribute('hidden'); else p.setAttribute('hidden', ''); });
    }
    $$('input[name="tl"]', root).forEach(function (i) { i.addEventListener('change', update); });
    update();
  }

  /* Magic Mountain: flip cards, and the shine on the Golden Tickets */
  (function () {
    var btns = $$('.fc-btn');
    if (!btns.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function flip(b, on) { b.setAttribute('aria-pressed', on === undefined ? (b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true') : (on ? 'true' : 'false')); }
    btns.forEach(function (b) {
      flip(b, false);
      b.addEventListener('click', function () { flip(b); });
      if (b.closest('.fc--gold') && !reduce) {
        b.addEventListener('pointermove', function (e) {
          if (e.pointerType === 'touch') return;
          var r = b.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          b.style.setProperty('--mx', (x * 100) + '%'); b.style.setProperty('--my', (y * 100) + '%');
          b.style.setProperty('--ry', ((x - 0.5) * 14) + 'deg'); b.style.setProperty('--rx', ((0.5 - y) * 14) + 'deg');
          b.style.setProperty('--sx', (130 - x * 170) + '%');
        });
        b.addEventListener('pointerleave', function () { ['--rx', '--ry', '--mx', '--my', '--sx'].forEach(function (k) { b.style.removeProperty(k); }); });
      }
    });
    $$('[data-fc-all]').forEach(function (all) {
      all.addEventListener('click', function () {
        var row = all.closest('.row'), cards = $$('.fc-btn', row);
        var anyFront = cards.some(function (c) { return c.getAttribute('aria-pressed') !== 'true'; });
        cards.forEach(function (c) { flip(c, anyFront); });
      });
    });
    var golds = $$('.fc--gold');
    if (golds.length && 'IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          golds.forEach(function (g, i) { g.style.setProperty('--sd', (i * 0.18) + 's'); g.classList.add('shine'); });
          io.disconnect();
        });
      }, { threshold: 0.6 });
      io.observe(golds[0]);
    }
  })();

  /* Magic Mountain: tabs, rulebook book, chart widths */
  $$('[data-js-hide]').forEach(function (el) { el.hidden = true; });
  $$('[data-w]').forEach(function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
  $$('[data-flex]').forEach(function (el) { el.style.flex = el.getAttribute('data-flex') + ' 1 0'; });

  $$('[data-tabs]').forEach(function (box) {
    var tabs = $$('[role="tab"]', box), panels = $$('[role="tabpanel"]', box);
    if (!tabs.length) return;
    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
        if (on) panels[k].removeAttribute('hidden'); else panels[k].setAttribute('hidden', '');
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length;
        if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % n, true); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); select((i + n - 1) % n, true); }
        else if (e.key === 'Home') { e.preventDefault(); select(0, true); }
        else if (e.key === 'End') { e.preventDefault(); select(n - 1, true); }
      });
    });
    select(0);
  });

  (function () {
    var book = $('[data-book]');
    if (!book) return;
    var N = +book.getAttribute('data-pages'), last = Math.floor(N / 2) + 1;
    var left = $('.pg-l img', book), right = $('.pg-r img', book), leaf = $('.leaf', book);
    var lf = $('.leaf-f img', book), lb = $('.leaf-b img', book), where = $('[data-where]', book);
    var prev = $('[data-prev]', book), next = $('[data-next]', book);
    var narrow = window.matchMedia('(max-width: 52rem)'), reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var s = 0, p = 1, busy = false;
    function src(n) { return '/assets/rulebook/page-' + (n < 10 ? '0' : '') + n + '.webp'; }
    function setImg(img, n) {
      if (n >= 1 && n <= N) { if (img.getAttribute('src') !== src(n)) img.src = src(n); img.alt = 'Rulebook page ' + n; img.parentNode.classList.remove('blank'); }
      else { img.removeAttribute('src'); img.alt = ''; img.parentNode.classList.add('blank'); }
    }
    function preload(n) { if (n >= 1 && n <= N) { var i = new Image(); i.src = src(n); } }
    function render() {
      if (narrow.matches) {
        setImg(right, p); setImg(left, 0);
        where.textContent = p === 1 ? 'Cover' : 'Page ' + p + ' of ' + N;
        prev.disabled = p <= 1; next.disabled = p >= N; preload(p + 1); preload(p - 1);
      } else {
        var L = s === 0 ? 0 : 2 * s, R = 2 * s + 1;
        setImg(left, L); setImg(right, R <= N ? R : 0);
        where.textContent = s === 0 ? 'Cover' : (R <= N ? 'Pages ' + L + '\u2013' + R + ' of ' + N : 'Page ' + L + ' of ' + N);
        prev.disabled = s <= 0; next.disabled = s >= last; preload(2 * s + 2); preload(2 * s + 3); preload(2 * s - 2);
      }
    }
    function go(dir) {
      if (busy) return;
      if (narrow.matches) { var np = p + dir; if (np < 1 || np > N) return; p = np; render(); return; }
      var ns = s + dir;
      if (ns < 0 || ns > last) return;
      if (reduce.matches) { s = ns; render(); return; }
      busy = true;
      var curL = s === 0 ? 0 : 2 * s, curR = 2 * s + 1, nL = 2 * ns, nR = 2 * ns + 1;
      leaf.hidden = false;
      if (dir > 0) {
        setImg(lf, curR <= N ? curR : 0); setImg(lb, nL);
        setImg(right, nR <= N ? nR : 0);
        leaf.className = 'leaf next';
      } else {
        setImg(lf, curL); setImg(lb, ns === 0 ? 0 : (2 * ns + 1 <= N ? 2 * ns + 1 : 0));
        setImg(left, ns === 0 ? 0 : nL);
        leaf.className = 'leaf prev';
      }
      var done = function () {
        leaf.removeEventListener('animationend', done); leaf.hidden = true; leaf.className = 'leaf';
        s = ns; busy = false; render();
      };
      leaf.addEventListener('animationend', done);
    }
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    book.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
    if (narrow.addEventListener) narrow.addEventListener('change', render);
    render();
  })();

  /* Video with a big play button */
  $$('.vid').forEach(function (box) {
    var v = $('video', box), b = $('.vid-play', box);
    if (!v || !b) return;
    v.removeAttribute('controls');
    b.addEventListener('click', function () { v.setAttribute('controls', ''); b.hidden = true; v.play(); v.focus(); });
    v.addEventListener('ended', function () { v.removeAttribute('controls'); b.hidden = false; });
  });

  var widgets = { tiles: tiles, dusk: dusk, reposync: reposync, card: card, mountain: mountain, life: life };
  $$('[data-widget]').forEach(function (w) { var f = widgets[w.getAttribute('data-widget')]; if (f) f(w); });
})();
