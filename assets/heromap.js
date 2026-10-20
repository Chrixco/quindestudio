/* The Magic Mountain living map: a mountain of hexagonal frames inks itself in, then fills with real tiles.
   Ported from the Magic Mountain website (heroMap.ts and board.ts). The first map is seeded; later ones are random. */
(function () {
  'use strict';

  var roots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-map]'));
  var layoutCards = Array.prototype.slice.call(document.querySelectorAll('[data-layout]'));
  if (!roots.length && !layoutCards.length) return;

  var PHI = 1.618, S = 40, SQ3 = Math.sqrt(3), BASE = '/assets/img/tiles/';

  /* elevation, id, copies, camera copies, lava */
  var TERRAIN = [
    [1, 'clear-meadow', 11, 1, 0], [1, 'clear-stream', 9, 1, 0], [1, 'snow', 4, 0, 0], [1, 'water', 6, 1, 0], [1, 'lava', 2, 0, 1],
    [2, 'snow', 10, 1, 0], [2, 'snow-slope', 5, 0, 0], [2, 'rock', 4, 1, 0], [2, 'clear', 4, 0, 0], [2, 'water', 5, 0, 0], [2, 'snowy-rock', 2, 1, 0], [2, 'lava', 2, 0, 1],
    [3, 'snowfield', 8, 0, 0], [3, 'icy-rock', 5, 1, 0], [3, 'ridge', 5, 0, 0], [3, 'deep-water', 3, 1, 0], [3, 'snow-shore', 3, 0, 0], [3, 'icy-shore', 3, 0, 0], [3, 'snow-patch', 3, 0, 0], [3, 'lava', 3, 0, 1],
    [4, 'ice-wall', 17, 1, 0], [4, 'ice-field', 9, 0, 0], [4, 'water', 4, 1, 0], [4, 'lava', 3, 0, 1]
  ].map(function (a) { return { elevation: a[0], id: a[1], copies: a[2], viewpoint: a[3], lava: !!a[4] }; });

  /* every printed design: "elevation:terrain" -> [file, camera version] */
  var DESIGNS = {"1:clear-meadow":[["e1_clear-meadow_a.webp",0],["e1_clear-meadow_f.webp",0],["e1_clear-meadow_j.webp",0],["e1_clear-meadow_n_vp.webp",1],["e1_clear-meadow_n.webp",0]],"1:clear-stream":[["e1_clear-stream_b.webp",0],["e1_clear-stream_d.webp",0],["e1_clear-stream_g_vp.webp",1],["e1_clear-stream_g.webp",0],["e1_clear-stream_h.webp",0],["e1_clear-stream_k.webp",0],["e1_clear-stream_l.webp",0],["e1_clear-stream_o.webp",0],["e1_clear-stream_p.webp",0]],"1:lava":[["e1_lava_e.webp",0]],"1:snow":[["e1_snow_r.webp",0]],"1:water":[["e1_water_c.webp",0],["e1_water_i_vp.webp",1],["e1_water_m.webp",0],["e1_water_q.webp",0]],"2:clear":[["e2_clear_a.webp",0],["e2_clear_g.webp",0],["e2_clear_k.webp",0]],"2:lava":[["e2_lava_l.webp",0]],"2:rock":[["e2_rock_d_vp.webp",1],["e2_rock_h.webp",0],["e2_rock_j.webp",0],["e2_rock_m.webp",0],["e2_rock_n.webp",0]],"2:snow-slope":[["e2_snow-slope_c.webp",0]],"2:snow":[["e2_snow_b.webp",0],["e2_snow_i_vp.webp",1],["e2_snow_i.webp",0],["e2_snow_o.webp",0]],"2:snowy-rock":[["e2_snowy-rock_e_vp.webp",1],["e2_snowy-rock_e.webp",0]],"2:water":[["e2_water_f.webp",0]],"3:deep-water":[["e3_deep-water_m_vp.webp",1],["e3_deep-water_m.webp",0]],"3:icy-rock":[["e3_icy-rock_b.webp",0],["e3_icy-rock_h_vp.webp",1]],"3:icy-shore":[["e3_icy-shore_n.webp",0],["e3_icy-shore_p.webp",0]],"3:lava":[["e3_lava_e.webp",0],["e3_lava_i.webp",0]],"3:ridge":[["e3_ridge_d.webp",0],["e3_ridge_l.webp",0]],"3:snow-patch":[["e3_snow-patch_a.webp",0],["e3_snow-patch_f.webp",0]],"3:snow-shore":[["e3_snow-shore_c.webp",0]],"3:snowfield":[["e3_snowfield_g.webp",0],["e3_snowfield_j.webp",0],["e3_snowfield_k.webp",0],["e3_snowfield_o.webp",0]],"4:ice-field":[["e4_ice-field_c.webp",0],["e4_ice-field_d.webp",0],["e4_ice-field_e.webp",0],["e4_ice-field_j.webp",0],["e4_ice-field_n.webp",0]],"4:ice-wall":[["e4_ice-wall_a.webp",0],["e4_ice-wall_f.webp",0],["e4_ice-wall_g_vp.webp",1],["e4_ice-wall_g.webp",0],["e4_ice-wall_h.webp",0],["e4_ice-wall_i.webp",0],["e4_ice-wall_k.webp",0],["e4_ice-wall_l.webp",0]],"4:lava":[["e4_lava_m.webp",0]],"4:water":[["e4_water_b_vp.webp",1],["e4_water_b.webp",0]]};

  var START_TILES = ['start_1_red.webp', 'start_2_blue.webp', 'start_3_yellow.webp', 'start_4_purple.webp'];
  var BOX = { 1: 5, 2: 4, 3: 3, 4: 2 };
  var ENTER_COST = { 1: 2, 2: 2, 3: 4, 4: 8 };
  var SUMMIT_NAME = { 1: 'short', 2: 'short', 3: 'standard', 4: 'expedition' };
  var RING = [[0, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1], [1, 0]];
  var NEIGHBOURS = [[1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1], [1, 0]];
  var FLAVOUR = { lava: 0.9, water: 1.8, 'deep-water': 2, 'clear-stream': 1.4, rock: 1.6, ridge: 1.7, 'snowy-rock': 1.6, 'icy-rock': 1.6, 'ice-wall': 1.5, 'ice-field': 1.3, 'icy-shore': 1.5, 'snow-shore': 1.4 };
  var PEAK = { rows: [[[1, 0, 5]], [[2, 0, 4]], [[3, 1.5, 3]], [[4, -3, 1]], [[4, -3, 1]]], rotate: 0 };

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexDistQR(q1, r1, q2, r2) { return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(q1 + r1 - q2 - r2)) / 2; }
  function hexDist(a, b) { return hexDistQR(a.q, a.r, b.q, b.r); }

  /* ---- board geometry (frames of seven tiles on a lattice) ---- */
  function frames(l) {
    var out = [];
    l.rows.forEach(function (segs, n) {
      segs.forEach(function (seg) {
        var e = seg[0], cx = seg[1], count = seg[2], best = 0, err = Infinity;
        for (var a0 = -30; a0 <= 30; a0++) {
          var d = Math.abs(4.5 * (a0 + (count - 1) / 2) + 1.5 * n - cx);
          if (d < err) { err = d; best = a0; }
        }
        for (var i = 0; i < count; i++) {
          var a = best + i, b = -n - a, k, t;
          for (k = 0; k < (((l.rotate || 0) % 6) + 6) % 6; k++) { t = a; a = -b; b = t + b; }
          out.push({ a: a, b: b, e: e, row: n });
        }
      });
    });
    return out;
  }

  function neighbourIds(slots) {
    var at = {};
    slots.forEach(function (s) { at[s.q + ',' + s.r] = s.id; });
    return slots.map(function (s) {
      var res = [];
      NEIGHBOURS.forEach(function (d) { var v = at[(s.q + d[0]) + ',' + (s.r + d[1])]; if (v !== undefined) res.push(v); });
      return res;
    });
  }

  function summitFrames(fs) {
    var top = Math.max.apply(null, fs.map(function (f) { return f.e; }));
    var topRow = Math.max.apply(null, fs.filter(function (f) { return f.e === top; }).map(function (f) { return f.row; }));
    var crown = fs.filter(function (f) { return f.e === top && f.row === topRow; });
    var f = crown[Math.floor((crown.length - 1) / 2)];
    return [[2 * f.a - f.b, f.a + 3 * f.b]];
  }

  function buildBoard(l, rand) {
    var fs = frames(l), best;
    function rank(st) { return st.count * 4 + (st.same ? 2 : 0) + (st.equalWidth ? 1 : 0); }
    summitFrames(fs).forEach(function (top) {
      var board = seatBoard(fs, top, rand);
      if (!best || rank(board.start) > rank(best.start)) best = board;
    });
    return best;
  }

  function seatBoard(fs, top, rand) {
    var sq = top[0], sr = top[1], slots = [];
    fs.forEach(function (f, fi) {
      var q0 = 2 * f.a - f.b, r0 = f.a + 3 * f.b;
      RING.forEach(function (d) {
        var q = q0 + d[0], r = r0 + d[1];
        slots.push({ id: slots.length, q: q, r: r, frame: fi, x: 1.5 * S * q, y: SQ3 * S * (r + q / 2), e: f.e, kind: q === sq && r === sr ? 'summit' : 'slot', nearSummit: hexDistQR(q, r, sq, sr) === 1 });
      });
    });
    var nb = neighbourIds(slots);
    var summit = slots.filter(function (s) { return s.kind === 'summit'; })[0];
    function cost(id) { return id === summit.id ? 0 : ENTER_COST[slots[id].e]; }

    var steps = slots.map(function () { return Infinity; });
    steps[summit.id] = 0;
    var queue = [summit.id], u;
    while (queue.length) {
      u = queue.shift();
      nb[u].forEach(function (v) { if (steps[v] === Infinity) { steps[v] = steps[u] + 1; queue.push(v); } });
    }

    var energy = slots.map(function () { return Infinity; });
    energy[summit.id] = 0;
    queue = [summit.id];
    while (queue.length) {
      queue.sort(function (a, b) { return energy[a] - energy[b]; });
      u = queue.shift();
      nb[u].forEach(function (v) {
        var d = energy[u] + cost(u);
        if (d < energy[v]) { energy[v] = d; if (queue.indexOf(v) < 0) queue.push(v); }
      });
    }

    var route = slots.map(function () { return { e: Infinity, mix: [0, 0, 0, 0] }; });
    route[summit.id] = { e: 0, mix: [0, 0, 0, 0] };
    var outward = slots.map(function (s) { return s.id; }).filter(function (id) { return isFinite(steps[id]); }).sort(function (a, b) { return steps[a] - steps[b]; });
    outward.forEach(function (uu) {
      if (uu === summit.id) return;
      nb[uu].forEach(function (v) {
        if (steps[v] !== steps[uu] - 1) return;
        var mix = route[v].mix.slice();
        if (v !== summit.id) mix[slots[v].e - 1]++;
        var e = route[v].e + cost(v), cur = route[uu];
        var better = e < cur.e || (e === cur.e && (mix[0] - cur.mix[0] || mix[1] - cur.mix[1] || mix[2] - cur.mix[2]) > 0);
        if (better) route[uu] = { e: e, mix: mix };
      });
    });

    function width(src) {
      var front = [src], w = Infinity, seen = {};
      seen[src] = true;
      while (front.length) {
        var next = [];
        front.forEach(function (uu) {
          nb[uu].forEach(function (v) { if (steps[v] === steps[uu] - 1 && v !== summit.id && !seen[v]) { seen[v] = true; next.push(v); } });
        });
        if (next.length) w = Math.min(w, next.length);
        front = next;
      }
      return isFinite(w) ? w : 0;
    }

    var outerFrame = {};
    slots.forEach(function (s) { if (nb[s.id].length < 6) outerFrame[s.frame] = true; });
    var candidates = slots.filter(function (s) { return s.e === 1 && s.kind === 'slot' && outerFrame[s.frame] && isFinite(steps[s.id]); });
    var far = Math.max.apply(null, [0].concat(candidates.map(function (s) { return energy[s.id]; })));
    function pickOf(xs) { return rand ? xs[Math.floor(rand() * xs.length)] : xs[0]; }

    function seat(group) {
      var byFrame = {}, keys = [];
      group.forEach(function (s) { if (!byFrame[s.frame]) { byFrame[s.frame] = []; keys.push(s.frame); } byFrame[s.frame].push(s); });
      var best = { slots: [], equalWidth: false, spread: 0 };
      for (var attempt = 0; attempt < (rand ? 40 : 1); attempt++) {
        var order = keys.map(function (k) { return byFrame[k]; });
        if (rand) order.sort(function () { return rand() - 0.5; });
        var chosen = [];
        for (var i = 0; i < order.length; i++) {
          if (chosen.length === 4) break;
          var f = order[i];
          var apart = f.filter(function (s) { return chosen.every(function (o) { return hexDist(s, o) >= 2; }); });
          if (!apart.length) continue;
          var same = chosen.length ? apart.filter(function (s) { return width(s.id) === width(chosen[0].id); }) : apart;
          chosen.push(pickOf(same.length ? same : apart));
        }
        var widths = {};
        chosen.forEach(function (s) { widths[width(s.id)] = true; });
        var equalWidth = Object.keys(widths).length <= 1;
        var spread = 0;
        if (chosen.length > 1) {
          var m = Infinity;
          chosen.forEach(function (a, ia) { chosen.slice(ia + 1).forEach(function (b) { m = Math.min(m, hexDist(a, b)); }); });
          spread = m;
        }
        var better = chosen.length - best.slots.length || +equalWidth - +best.equalWidth || Math.min(spread, 6) - Math.min(best.spread, 6);
        if (better > 0) best = { slots: chosen, equalWidth: equalWidth, spread: spread };
        if (best.slots.length === Math.min(4, keys.length) && best.equalWidth && best.spread >= 6) break;
      }
      return best;
    }

    function choose(key) {
      var groups = {}, gk = [];
      candidates.forEach(function (s) {
        if (energy[s.id] < far * 0.55) return;
        var k = key(s);
        if (!groups[k]) { groups[k] = []; gk.push(k); }
        groups[k].push(s);
      });
      var options = gk.map(function (k) { return seat(groups[k]); }).filter(function (c) { return c.slots.length >= 2; });
      var most = Math.max.apply(null, [0].concat(options.map(function (c) { return c.slots.length; })));
      var fair = options.filter(function (c) { return c.slots.length === most; })
        .sort(function (x, y) { return (+y.equalWidth - +x.equalWidth) || (energy[y.slots[0].id] - energy[x.slots[0].id]); });
      var topc = fair.filter(function (c) { return c.equalWidth === fair[0].equalWidth; });
      return rand ? topc[Math.floor(Math.pow(rand(), 1.6) * topc.length)] : topc[0];
    }

    function sameClimb(s) { return steps[s.id] + '|' + route[s.id].mix.join(',') + '|' + energy[s.id]; }
    var pick = choose(sameClimb);
    var strictSeats = pick ? pick.slots.length : 0;
    var loose = strictSeats < 4 ? choose(function (s) { return steps[s.id] + '|' + energy[s.id]; }) : undefined;
    var same = !(loose && loose.slots.length > strictSeats);
    if (!same) pick = loose;
    var chosenSlots = pick ? pick.slots : [];
    chosenSlots.forEach(function (s) { s.kind = 'start'; });
    var first = chosenSlots[0];
    var info = first ? { count: chosenSlots.length, same: same, equalWidth: pick.equalWidth, steps: steps[first.id], energy: energy[first.id] } : { count: 0, same: true, equalWidth: true, steps: 0, energy: 0 };
    return { slots: slots, start: info };
  }

  function rowXs(n, cx, count) {
    var best = 0, err = Infinity, out = [];
    for (var a0 = -30; a0 <= 30; a0++) {
      var d = Math.abs(4.5 * (a0 + (count - 1) / 2) + 1.5 * n - cx);
      if (d < err) { err = d; best = a0; }
    }
    for (var i = 0; i < count; i++) out.push(4.5 * (best + i) + 1.5 * n);
    return out;
  }

  function randomLayout(rand) {
    function pick(xs) { return xs[Math.floor(rand() * xs.length)]; }
    for (var attempt = 0; attempt < 400; attempt++) {
      var top = pick([4, 4, 4, 3, 3]), rows = [], cx = 0, prev = [], ok = true;
      for (var e = 1; e <= top; e++) {
        var left = 2 + Math.floor(rand() * (BOX[e] - 1));
        var twoRows = left >= 3 && rand() < 0.55;
        var sizes = twoRows ? [Math.max(2, left - 1 - Math.floor(rand() * (left - 2))), 0] : [left];
        if (twoRows) sizes[1] = left - sizes[0];
        for (var si = 0; si < sizes.length; si++) {
          var size = sizes[si];
          if (size <= 0) continue;
          var placed = false, shifts = [pick([-6, -4.5, -3, 0, 3, 4.5, 6]), 0, 3, -3];
          for (var hi = 0; hi < shifts.length; hi++) {
            var n = rows.length, c = cx + shifts[hi], xs = rowXs(n, c, size);
            var touches = xs.some(function (x) { return prev.some(function (p) { return Math.abs(x - p - 1.5) < 0.01 || Math.abs(x - p + 3) < 0.01; }); });
            if (n === 0 || touches) { rows.push([[e, c, size]]); prev = xs; cx = c; placed = true; break; }
          }
          if (!placed) { ok = false; break; }
        }
        if (!ok) break;
      }
      if (ok) {
        var st = buildBoard({ rows: rows, rotate: 0 }).start;
        if (st.count < (attempt < 150 ? 4 : attempt < 185 ? 3 : 2) || (attempt < 120 && !(st.same && st.equalWidth)) || (attempt < 185 && !st.same)) continue;
        return { rows: rows, rotate: pick([0, 0, 1, 5]) };
      }
    }
    return PEAK;
  }

  /* ---- composing the map ---- */
  function designFile(t, viewpoint, pick) {
    var all = DESIGNS[t.elevation + ':' + t.id] || [];
    var pool = all.filter(function (d) { return !!d[1] === viewpoint; });
    var list = pool.length ? pool : all;
    return list[((pick % list.length) + list.length) % list.length][0];
  }

  function goldenRotation(l) {
    var best = l, err = Infinity;
    for (var k = 0; k < 6; k++) {
      var cand = { rows: l.rows, rotate: k };
      var slots = buildBoard(cand).slots;
      var xs = slots.map(function (s) { return s.x; }), ys = slots.map(function (s) { return s.y; });
      var ratio = (Math.max.apply(null, xs) - Math.min.apply(null, xs)) / (Math.max.apply(null, ys) - Math.min.apply(null, ys));
      var summit = slots.filter(function (s) { return s.kind === 'summit'; })[0];
      var up = (summit.y - Math.min.apply(null, ys)) / (Math.max.apply(null, ys) - Math.min.apply(null, ys));
      var e = Math.abs(Math.log(ratio / PHI)) + (up > 0.5 ? 1 : 0);
      if (e < err) { err = e; best = cand; }
    }
    return best;
  }

  function hexPts(r) {
    var out = [];
    for (var k = 0; k < 6; k++) out.push((r * Math.cos(Math.PI / 3 * k)).toFixed(1) + ',' + (r * Math.sin(Math.PI / 3 * k)).toFixed(1));
    return out.join(' ');
  }

  function composeMap(seed, full) {
    var rand = rng(seed);
    var layout = randomLayout(rand), i;
    for (i = 0; i < 40; i++) {
      var b = buildBoard(layout);
      if (b.slots.length >= 70 && b.slots.some(function (s) { return s.e === 4; })) break;
      layout = randomLayout(rand);
    }
    layout = goldenRotation(layout);
    var slots = buildBoard(layout, rand).slots;
    var nb = neighbourIds(slots);
    var summit = slots.filter(function (s) { return s.kind === 'summit'; })[0];

    var open = slots.filter(function (s) { return s.kind === 'slot'; });
    var target = full ? open.length : Math.round(open.length / PHI);
    var placed = [], has = {};
    slots.forEach(function (s) { if (s.kind !== 'slot') has[s.id] = true; });
    function put(s) { if (!has[s.id] && s.kind === 'slot') { placed.push(s); has[s.id] = true; } }
    function weightedPick(pool, w) {
      var r = rand() * w.reduce(function (a, c) { return a + c; }, 0);
      for (var j = 0; j < pool.length; j++) { r -= w[j]; if (r <= 0) return pool[j]; }
      return pool[pool.length - 1];
    }

    slots.filter(function (s) { return s.kind === 'start'; }).forEach(function (start) {
      var cur = start;
      for (var guard = 0; guard < 160 && hexDist(cur, summit) > 1; guard++) {
        var next = nb[cur.id].map(function (n) { return slots[n]; }).filter(function (n) { return n.kind === 'slot' || n.kind === 'summit'; });
        if (!next.length) break;
        var d0 = hexDist(cur, summit);
        var w = next.map(function (n) {
          var dd = hexDist(n, summit) - d0;
          return (dd < 0 ? 3 : dd === 0 ? 1.1 : 0.15) * (has[n.id] ? 0.5 : 1) * (0.4 + rand());
        });
        cur = weightedPick(next, w);
        if (cur.kind === 'summit') break;
        put(cur);
        if (placed.length >= target) break;
      }
    });
    while (placed.length < target) {
      var pool = open.filter(function (s) { return !has[s.id] && nb[s.id].some(function (n) { return has[n]; }); });
      if (!pool.length) break;
      var w2 = pool.map(function (s) {
        var around = nb[s.id].filter(function (n) { return has[n]; }).length;
        return (around <= 2 ? 1.6 : around === 3 ? 0.7 : 0.25) * (0.3 + rand());
      });
      put(weightedPick(pool, w2));
    }

    var lavaAt = {}, lavaCount = 0;
    function chooseTerrain(s) {
      var noLava = s.nearSummit || nb[s.id].some(function (n) { return lavaAt[n]; }) || lavaCount >= Math.ceil(placed.length * 0.09);
      var pl = TERRAIN.filter(function (t) { return t.elevation === s.e && !(t.lava && noLava); });
      var w = pl.map(function (t) { return Math.sqrt(t.copies + t.viewpoint) * (FLAVOUR[t.id] || 1); });
      var r = rand() * w.reduce(function (a, c) { return a + c; }, 0), t = pl[pl.length - 1];
      for (var j = 0; j < pl.length; j++) { r -= w[j]; if (r <= 0) { t = pl[j]; break; } }
      if (t.lava) { lavaAt[s.id] = true; lavaCount++; }
      return { t: t, vp: t.viewpoint > 0 && rand() < 0.18 };
    }

    var elevs = [];
    slots.forEach(function (s) { if (elevs.indexOf(s.e) < 0) elevs.push(s.e); });
    elevs.sort();
    var INK_START = 0.3, PER_ELEV = 0.618, TILE_START = INK_START + elevs.length * PER_ELEV + 0.4, TILE_STEP = full ? 0.03 : 0.07;

    function key(x, y) { return Math.round(x) + ',' + Math.round(y); }
    var edges = {};
    slots.forEach(function (s) {
      for (var k = 0; k < 6; k++) {
        var a = Math.PI / 3 * k, bb = Math.PI / 3 * (k + 1);
        var x1 = s.x + S * Math.cos(a), y1 = s.y + S * Math.sin(a), x2 = s.x + S * Math.cos(bb), y2 = s.y + S * Math.sin(bb);
        var id = [key(x1, y1), key(x2, y2)].sort().join('|');
        var hit = edges[id];
        if (hit) { hit.n++; hit.frames[s.frame] = true; hit.e = Math.min(hit.e, s.e); }
        else { var fr = {}; fr[s.frame] = true; edges[id] = { d: 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1), frames: fr, n: 1, e: s.e }; }
      }
    });
    var edgeList = Object.keys(edges).map(function (k) { return edges[k]; });
    var ink = '';
    elevs.forEach(function (e, idx) {
      var fine = edgeList.filter(function (g) { return g.e === e && g.n === 2 && Object.keys(g.frames).length === 1; }).map(function (g) { return g.d; }).join('');
      var bold = edgeList.filter(function (g) { return g.e === e && !(g.n === 2 && Object.keys(g.frames).length === 1); }).map(function (g) { return g.d; }).join('');
      var d = (INK_START + idx * PER_ELEV).toFixed(2);
      ink += '<path class="ink fine" pathLength="1" data-d="' + d + '" d="' + fine + '"/><path class="ink bold" pathLength="1" data-d="' + d + '" d="' + bold + '"/>';
    });

    var centres = slots.filter(function (_, n) { return n % 7 === 0; });
    var guides = '';
    centres.forEach(function (a, ia) {
      centres.slice(ia + 1).forEach(function (b) {
        if (Math.hypot(a.x - b.x, a.y - b.y) < Math.sqrt(21) * S * 1.05) guides += 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + 'L' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
      });
    });
    var dots = centres.map(function (c) { return '<circle class="dot" cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="3"/>'; }).join('');

    var W = 2 * S, H = SQ3 * S;
    var tiles = placed.map(function (s, n) {
      var ct = chooseTerrain(s), d = (TILE_START + n * TILE_STEP).toFixed(2);
      return '<image class="mm-tile" data-d="' + d + '" href="' + BASE + designFile(ct.t, ct.vp, Math.floor(rand() * 99)) + '" x="' + (s.x - W / 2).toFixed(1) + '" y="' + (s.y - H / 2).toFixed(1) + '" width="' + W + '" height="' + H.toFixed(1) + '"/>';
    }).join('');

    var end = TILE_START + placed.length * TILE_STEP, seatIx = 0;
    var fixed = slots.filter(function (s) { return s.kind !== 'slot'; }).map(function (s) {
      var tr = 'translate(' + s.x.toFixed(1) + ' ' + s.y.toFixed(1) + ')';
      if (s.kind === 'summit') {
        return '<g transform="' + tr + '"><g class="mm-mark summit" data-d="' + (end + 0.2).toFixed(2) + '"><image href="' + BASE + 'summit_' + SUMMIT_NAME[s.e] + '.webp" x="' + (-S) + '" y="' + (-H / 2).toFixed(1) + '" width="' + W + '" height="' + H.toFixed(1) + '"/><polygon points="' + hexPts(S) + '"/></g></g>';
      }
      return '<g transform="' + tr + '"><g class="mm-mark start" data-d="' + (TILE_START - 0.3).toFixed(2) + '"><image href="' + BASE + START_TILES[seatIx++ % 4] + '" x="' + (-S) + '" y="' + (-H / 2).toFixed(1) + '" width="' + W + '" height="' + H.toFixed(1) + '"/></g></g>';
    }).join('');

    var xs = slots.map(function (s) { return s.x; }), ys = slots.map(function (s) { return s.y; });
    var x0 = Math.min.apply(null, xs) - S * 1.6, x1 = Math.max.apply(null, xs) + S * 1.6, y0 = Math.min.apply(null, ys) - S * 1.6, y1 = Math.max.apply(null, ys) + S * 1.6;
    var w = x1 - x0, h = y1 - y0;
    if (w / h < PHI) { var nw = h * PHI; x0 -= (nw - w) / 2; w = nw; } else { var nh = w / PHI; y0 -= (nh - h) / 2; h = nh; }

    return {
      svg: '<path class="guides" pathLength="1" d="' + guides + '"/>' + dots + '<g class="inks">' + ink + '</g><g class="tiles">' + tiles + '</g><g class="marks">' + fixed + '</g>',
      viewBox: [x0, y0, w, h].map(function (v) { return v.toFixed(1); }).join(' '),
      duration: end + 1.5
    };
  }

  /* ---- ready-made layouts ---- */
  var LAYOUTS = {
    peak: { rows: [[[1, 0, 5]], [[2, 0, 4]], [[3, 1.5, 3]], [[4, -3, 1]], [[4, -3, 1]]], rotate: 0 },
    traverse: { rows: [[[1, 3, 3]], [[1, 1.5, 2]], [[2, 5, 2]], [[2, 9, 2]], [[3, 12, 2]], [[3, 15, 1]], [[4, 15, 2]]], rotate: 1 },
    valleys: { rows: [[[1, -7.5, 2], [1, 7.5, 2]], [[2, 0, 4]], [[3, 0, 3]]], rotate: 0 },
    pass: { rows: [[[1, 6, 4]], [[1, 4, 1]], [[2, 8, 2]], [[2, 3, 2]], [[3, -2, 3]], [[4, -4, 1]], [[4, -4, 1]]], rotate: 0 },
    first: { rows: [[[1, 0, 3]], [[1, 0, 2]], [[2, -4.5, 1]], [[2, -3, 1]]], rotate: 0 }
  };
  var ELEV_NAME = ['green', 'teal', 'blue', 'white'];

  function drawLayout(card) {
    var layout = LAYOUTS[card.getAttribute('data-layout')];
    if (!layout) return;
    var board = buildBoard(layout), slots = board.slots, info = board.start;
    var xs = slots.map(function (s) { return s.x; }), ys = slots.map(function (s) { return s.y; });
    var pad = S * 1.3, x0 = Math.min.apply(null, xs) - pad, x1 = Math.max.apply(null, xs) + pad, y0 = Math.min.apply(null, ys) - pad, y1 = Math.max.apply(null, ys) + pad;
    var w = x1 - x0, h = y1 - y0;
    if (w / h < PHI) { var nw = h * PHI; x0 -= (nw - w) / 2; w = nw; } else { var nh = w / PHI; y0 -= (nh - h) / 2; h = nh; }
    var pts = hexPts(S * 0.94), out = '';
    slots.forEach(function (s) {
      var cls = 'hx e' + s.e + (s.kind === 'summit' ? ' sm' : '') + (s.kind === 'start' ? ' st' : '');
      out += '<polygon class="' + cls + '" points="' + pts + '" transform="translate(' + s.x.toFixed(1) + ' ' + s.y.toFixed(1) + ')"/>';
    });
    var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('viewBox', [x0, y0, w, h].map(function (v) { return v.toFixed(1); }).join(' '));
    svgEl.setAttribute('role', 'img');
    var top = Math.max.apply(null, slots.map(function (s) { return s.e; }));
    svgEl.setAttribute('aria-label', 'The ' + card.querySelector('h3').textContent + ' layout: ' + (slots.length / 7) + ' frames, with the Summit on a ' + ELEV_NAME[top - 1] + ' frame.');
    svgEl.innerHTML = out;
    card.querySelector('[data-lay-map]').appendChild(svgEl);
    card.querySelector('[data-lay-stats]').textContent = (slots.length / 7) + ' frames. Summit at elevation ' + top + '. ' +
      (info.count ? 'Up to ' + info.count + ' players. Every seat climbs ' + info.steps + ' steps and ' + info.energy + ' Energy.' : '');
  }
  layoutCards.forEach(drawLayout);

  /* ---- living maps ---- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var HOLD = 9;

  function initMap(root) {
    var svg = root.querySelector('[data-hero-svg]');
    var living = root.getAttribute('data-mode') !== 'build';
    var timer = 0, visible = true, due = false;
    function draw(seed) {
      var map = composeMap(seed, !living);
      svg.setAttribute('viewBox', map.viewBox);
      svg.innerHTML = map.svg;
      Array.prototype.forEach.call(svg.querySelectorAll('[data-d]'), function (el) { el.style.setProperty('--d', el.getAttribute('data-d') + 's'); });
      if (living) schedule(map.duration + HOLD);
    }
    function schedule(seconds) {
      clearTimeout(timer);
      if (reduce.matches) return;
      timer = window.setTimeout(function () { if (visible) redraw(); else due = true; }, seconds * 1000);
    }
    function redraw() {
      due = false;
      svg.classList.add('out');
      window.setTimeout(function () { draw(Math.floor(Math.random() * Math.pow(2, 31))); svg.classList.remove('out'); }, reduce.matches ? 0 : 900);
    }
    var button = root.querySelector('[data-redraw]');
    if (button) { button.hidden = false; button.addEventListener('click', redraw); }
    if (living && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; if (visible && due) redraw(); }).observe(root);
    }
    if (living) { draw(1618); }
    else if ('IntersectionObserver' in window) {
      var once = new IntersectionObserver(function (entries) { if (entries[0].isIntersecting) { once.disconnect(); draw(618); } }, { threshold: 0.3 });
      once.observe(root);
    } else { draw(618); }
  }
  roots.forEach(initMap);
})();
