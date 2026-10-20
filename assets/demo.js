/* Playable demo board for the Word Laddered section. Progressive enhancement:
   the page ships a static board; this script makes it respond to input. */
(function () {
  'use strict';

  var E = window.LadderEngine;
  var board = document.getElementById('board');
  if (!E || !board) return;

  var N = E.N;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var noteEl = document.getElementById('note');
  var bestEl = document.getElementById('best');
  var movesEl = document.getElementById('moves');
  var descEl = document.getElementById('board-desc');
  var bar = document.getElementById('demo-bar');

  /* Opening board as [letter, row, col]: A and B side by side, a lone C, and B ... A on the bottom row. */
  var SEED = [[1, 1, 0], [2, 1, 1], [3, 2, 3], [2, 4, 2], [1, 4, 4]];

  var tiles = [];
  var nextId = 1;
  var busy = false;
  var touched = false;
  var moves = 0;
  var best = 0;

  function letter(v) { return String.fromCharCode(64 + v); }
  function step() { return reduce.matches ? 0 : 150; }
  function wait(ms) { return new Promise(function (done) { setTimeout(done, ms); }); }
  function say(text) { noteEl.textContent = text; }

  function place(t) {
    t.el.style.setProperty('--r', t.r);
    t.el.style.setProperty('--c', t.c);
  }

  function addTile(v, r, c, cls) {
    var t = { id: nextId++, v: v, r: r, c: c };
    t.el = document.createElement('div');
    t.el.className = 'tile' + (cls ? ' ' + cls : '');
    t.el.setAttribute('aria-hidden', 'true');
    t.el.textContent = letter(v);
    t.el.style.setProperty('--mix', (72 + 28 * Math.min(1, (v - 1) / 9)) + '%');
    place(t);
    board.appendChild(t.el);
    tiles.push(t);
    if (v > best) best = v;
    return t;
  }

  function removeTile(t) {
    t.el.remove();
    var i = tiles.indexOf(t);
    if (i > -1) tiles.splice(i, 1);
  }

  function render() { tiles.forEach(place); }

  function describe() {
    var grid = [];
    for (var r = 0; r < N; r++) grid.push([]);
    tiles.forEach(function (t) { grid[t.r][t.c] = letter(t.v); });
    descEl.textContent = grid.map(function (row, r) {
      var cells = [];
      for (var c = 0; c < N; c++) cells.push(row[c] || 'empty');
      return 'Row ' + (r + 1) + ': ' + cells.join(', ') + '.';
    }).join(' ');
  }

  function stats() {
    bestEl.textContent = best ? letter(best) : '-';
    movesEl.textContent = moves;
    describe();
  }

  function build() {
    board.textContent = '';
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        var cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('aria-hidden', 'true');
        cell.style.setProperty('--r', r);
        cell.style.setProperty('--c', c);
        board.appendChild(cell);
      }
    }
    tiles = [];
    best = 0;
    moves = 0;
    SEED.forEach(function (s) { addTile(s[0], s[1], s[2]); });
    stats();
  }

  function spawn() {
    var taken = {};
    tiles.forEach(function (t) { taken[t.r * N + t.c] = true; });
    var free = [];
    for (var i = 0; i < N * N; i++) if (!taken[i]) free.push(i);
    if (!free.length) return;
    var pick = free[Math.floor(Math.random() * free.length)];
    addTile(E.spawnValue(Math.random()), Math.floor(pick / N), pick % N, 'new');
  }

  function move(dir) {
    if (busy) return Promise.resolve();
    busy = true;
    var moved = E.compress(tiles, dir);
    var merged = false;
    var lastMerge = null;
    var vanished = null;

    return (async function () {
      if (moved) { render(); await wait(step()); }

      for (;;) {
        var found = E.findMerges(tiles, dir);
        if (!found.length) break;
        merged = true;
        found.forEach(function (m) { m.b.r = m.a.r; m.b.c = m.a.c; });
        render();
        await wait(step());
        found.forEach(function (m) {
          removeTile(m.a);
          removeTile(m.b);
          addTile(m.v, m.r, m.c, 'pop');
          lastMerge = m;
        });
        if (E.compress(tiles, dir)) { render(); await wait(step()); }
      }

      var gone = E.findVanishes(tiles);
      if (gone.length) {
        vanished = gone[0].v;
        gone.forEach(function (t) { t.el.classList.add('vanish'); });
        await wait(step() + 60);
        gone.forEach(removeTile);
      }

      if (moved || merged) {
        moves += 1;
        spawn();
      }
      stats();

      if (vanished) say('A full line of ' + letter(vanished) + ' vanished.');
      else if (lastMerge) say(letter(Math.min(lastMerge.a.v, lastMerge.b.v)) + ' and ' + letter(Math.max(lastMerge.a.v, lastMerge.b.v)) + ' made ' + letter(lastMerge.v) + '.');
      else if (!moved) say('Nothing to slide that way.');
      else say('Slid ' + dir + '.');

      if (!E.canMove(tiles)) say('No moves left. Start a new board.');
      busy = false;
    })();
  }

  /* Input */
  function touch() { touched = true; }

  board.addEventListener('keydown', function (e) {
    var map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (!map[e.key]) return;
    e.preventDefault();
    touch();
    move(map[e.key]);
  });

  var start = null;
  board.addEventListener('pointerdown', function (e) { start = { x: e.clientX, y: e.clientY }; });
  board.addEventListener('pointerup', function (e) {
    if (!start) return;
    var dx = e.clientX - start.x;
    var dy = e.clientY - start.y;
    start = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    touch();
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  board.addEventListener('pointercancel', function () { start = null; });

  Array.prototype.forEach.call(document.querySelectorAll('[data-dir]'), function (button) {
    button.addEventListener('click', function () { touch(); move(button.getAttribute('data-dir')); });
  });

  var reset = document.getElementById('reset');
  if (reset) {
    reset.addEventListener('click', function () {
      touch();
      if (busy) return;
      build();
      say('New board. Swipe, tap an arrow, or press an arrow key.');
    });
  }

  /* Setup, then play one opening move so the rule is visible without any input. */
  build();
  bar.hidden = false;
  say('Swipe the board, press an arrow key, or tap an arrow.');

  function intro() {
    if (touched || reduce.matches) return;
    move('right').then(function () {
      if (!touched) say('A and B made C. Your turn.');
    });
  }

  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        seen.disconnect();
        setTimeout(intro, 700);
      }
    }, { threshold: 0.6 });
    seen.observe(board);
  } else {
    setTimeout(intro, 900);
  }
})();
