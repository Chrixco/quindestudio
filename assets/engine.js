/* Word Laddered demo engine: a simplified version of the game's board rules.
   Pure functions, no DOM. Tiles are { id, v, r, c } where v is 1..26 (A..Z). */
(function (root) {
  'use strict';

  var N = 5;
  var MAX = 26;
  var DIRS = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] };

  /* Rows or columns of cells, each ordered from the edge the tiles slide toward. */
  function lines(dir) {
    var d = DIRS[dir];
    var out = [];
    for (var i = 0; i < N; i++) {
      var line = [];
      for (var j = 0; j < N; j++) {
        var k = (d[0] === 0 ? d[1] : d[0]) < 0 ? j : N - 1 - j;
        line.push(d[0] === 0 ? [i, k] : [k, i]);
      }
      out.push(line);
    }
    return out;
  }

  function index(tiles) {
    var map = {};
    tiles.forEach(function (t) { map[t.r * N + t.c] = t; });
    return map;
  }

  /* Neighbours in the alphabet merge, and the result is one past the higher letter. */
  function mergeOk(a, b) {
    return Math.abs(a.v - b.v) === 1 && Math.max(a.v, b.v) + 1 <= MAX;
  }

  /* Slide every tile as far as it will go. Returns true if any tile moved. */
  function compress(tiles, dir) {
    var map = index(tiles);
    var moved = false;
    lines(dir).forEach(function (line) {
      var k = 0;
      line.forEach(function (cell) {
        var t = map[cell[0] * N + cell[1]];
        if (!t) return;
        var dest = line[k++];
        if (t.r !== dest[0] || t.c !== dest[1]) {
          t.r = dest[0];
          t.c = dest[1];
          moved = true;
        }
      });
    });
    return moved;
  }

  /* Pairs that merge on this move, scanning from the leading edge. `a` is the
     tile nearer the edge; the merged tile appears where `a` is. */
  function findMerges(tiles, dir) {
    var map = index(tiles);
    var merges = [];
    lines(dir).forEach(function (line) {
      var list = [];
      line.forEach(function (cell) {
        var t = map[cell[0] * N + cell[1]];
        if (t) list.push(t);
      });
      for (var k = 0; k < list.length - 1;) {
        var a = list[k];
        var b = list[k + 1];
        if (mergeOk(a, b)) {
          merges.push({ a: a, b: b, v: Math.max(a.v, b.v) + 1, r: a.r, c: a.c });
          k += 2;
        } else {
          k += 1;
        }
      }
    });
    return merges;
  }

  /* Tiles in any full row or column that holds a single letter. */
  function findVanishes(tiles) {
    var map = index(tiles);
    var gone = {};
    function check(cells) {
      var first = null;
      for (var i = 0; i < cells.length; i++) {
        var t = map[cells[i][0] * N + cells[i][1]];
        if (!t) return;
        if (first === null) first = t.v;
        else if (t.v !== first) return;
      }
      cells.forEach(function (cell) { gone[map[cell[0] * N + cell[1]].id] = map[cell[0] * N + cell[1]]; });
    }
    for (var i = 0; i < N; i++) {
      var row = [];
      var col = [];
      for (var j = 0; j < N; j++) { row.push([i, j]); col.push([j, i]); }
      check(row);
      check(col);
    }
    return Object.keys(gone).map(function (id) { return gone[id]; });
  }

  function canMove(tiles) {
    if (tiles.length < N * N) return true;
    var map = index(tiles);
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        var t = map[r * N + c];
        if (c + 1 < N && mergeOk(t, map[r * N + c + 1])) return true;
        if (r + 1 < N && mergeOk(t, map[(r + 1) * N + c])) return true;
      }
    }
    return false;
  }

  /* New tiles are small letters, as in the game (A to E there, A to D here). */
  function spawnValue(x) {
    if (x < 0.4) return 1;
    if (x < 0.7) return 2;
    if (x < 0.9) return 3;
    return 4;
  }

  root.LadderEngine = {
    N: N, MAX: MAX, DIRS: DIRS,
    compress: compress, findMerges: findMerges, findVanishes: findVanishes,
    canMove: canMove, mergeOk: mergeOk, spawnValue: spawnValue
  };
})(typeof window !== 'undefined' ? window : globalThis);
