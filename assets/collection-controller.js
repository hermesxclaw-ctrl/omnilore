/* Shared controller for browse-style wing grids. */
(function () {
  'use strict';
  var wing = document.body && document.body.dataset.wing;
  var grid = document.getElementById('wing-grid');
  var query = document.getElementById('query');
  var count = document.getElementById('count');
  var heroCount = document.getElementById('hero-count');
  var more = document.getElementById('more');
  if (!wing || !grid || !query || !more || !window.OMNI_CARD) return;

  var pageSize = 60, shown = 0, matches = [], timer = 0;
  function engine() {
    return window.OmniloreArchive && window.OmniloreArchive.createArchiveEngine(window.OMNILORE_INDEX || [], location.pathname);
  }
  function draw(reset) {
    if (reset) { shown = 0; grid.innerHTML = ''; }
    var next = matches.slice(shown, shown + pageSize).map(function (result) { return window.OMNI_CARD.card(result.entity, '../entity/'); }).join('');
    grid.insertAdjacentHTML('beforeend', next);
    shown += Math.min(pageSize, matches.length - shown);
    count.textContent = matches.length.toLocaleString() + ' records in this wing';
    heroCount.textContent = matches.length.toLocaleString() + ' entities awake';
    more.hidden = shown >= matches.length;
  }
  function apply() {
    var archive = engine();
    if (!archive) return;
    matches = archive.search(query.value, { wing: wing });
    draw(true);
  }
  function start() {
    if (!engine()) return;
    query.addEventListener('input', function (event) {
      event.stopImmediatePropagation();
      clearTimeout(timer);
      timer = setTimeout(apply, 80);
    }, true);
    more.addEventListener('click', function (event) { event.stopImmediatePropagation(); draw(false); }, true);
    apply();
  }
  function load() {
    if (window.OmniloreArchive && window.OMNILORE_INDEX) { start(); return; }
    window.setTimeout(load, 30);
  }
  load();
}());
