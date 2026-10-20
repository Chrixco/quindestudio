(function () {
  'use strict';
  var root = document.querySelector('[data-carousel]');
  if (!root) return;
  var track = root.querySelector('[data-track]');
  var tabs = Array.prototype.slice.call(root.querySelectorAll('.car-tab'));
  var n = tabs.length;
  root.querySelector('.car-tabs').hidden = false;
  var idx = function () { return Math.round(track.scrollLeft / track.clientWidth); };
  var go = function (i) { track.scrollTo({ left: ((i + n) % n) * track.clientWidth }); };
  var mark = function () {
    var c = Math.min(n - 1, idx());
    tabs.forEach(function (t, i) { if (i === c) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
  };
  tabs.forEach(function (t) { t.addEventListener('click', function () { go(Number(t.getAttribute('data-i'))); }); });
  track.addEventListener('scroll', mark, { passive: true });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(idx() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx() - 1); }
  });
})();
