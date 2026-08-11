/* Browse collection UI backed exclusively by archive-engine.js. */
(function () {
  'use strict';
  var grid = document.getElementById('grid');
  var count = document.getElementById('count');
  var more = document.getElementById('more');
  var input = document.getElementById('bq');
  var wingSelect = document.getElementById('wingDropdown');
  if (!grid || !count || !more || !input || !window.OMNI_CARD) return;

  var pageSize = 60, shown = 0, results = [], wing = 'all', culture = 'all', timer = 0, archive = null;

  function setPressed(nodes, attribute, value) {
    for (var index = 0; index < nodes.length; index++) {
      var selected = nodes[index].dataset[attribute] === value;
      nodes[index].classList.toggle('on', selected);
      nodes[index].setAttribute('aria-pressed', String(selected));
    }
  }

  function updateHash() {
    var value = culture !== 'all' ? 'c=' + culture : (wing !== 'all' ? wing : '');
    if (history.replaceState) history.replaceState(null, '', value ? '#' + encodeURIComponent(value) : location.pathname + location.search);
  }

  function draw(reset) {
    if (reset) { shown = 0; grid.innerHTML = ''; }
    var slice = results.slice(shown, shown + pageSize);
    grid.insertAdjacentHTML('beforeend', slice.map(function (result) {
      return window.OMNI_CARD.card(result.entity, 'entity/');
    }).join(''));
    shown += slice.length;
    count.textContent = results.length.toLocaleString() + ' entities found';
    count.setAttribute('aria-live', 'polite');
    more.hidden = shown >= results.length;
    more.style.display = more.hidden ? 'none' : 'block';
    more.dataset.offset = String(shown);
  }

  function apply(reset) {
    results = archive.search(input.value.trim(), { wing: wing, culture: culture });
    draw(reset !== false);
  }

  function chooseWing(value) {
    wing = value || 'all';
    culture = 'all';
    if (wingSelect) wingSelect.value = wing;
    setPressed(document.querySelectorAll('.f-btn'), 'k', wing);
    setPressed(document.querySelectorAll('.c-btn'), 'c', culture);
    updateHash();
    apply(true);
  }

  function chooseCulture(value) {
    culture = value || 'all';
    wing = 'all';
    if (wingSelect) wingSelect.value = wing;
    setPressed(document.querySelectorAll('.f-btn'), 'k', wing);
    setPressed(document.querySelectorAll('.c-btn'), 'c', culture);
    updateHash();
    apply(true);
  }

  function start() {
    archive = window.OmniloreArchive.createArchiveEngine(window.OMNILORE_INDEX, location.pathname);
    var hash = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (hash.indexOf('c=') === 0) culture = hash.slice(2);
    else if (hash) wing = hash;

    var wingButtons = document.querySelectorAll('.f-btn');
    for (var index = 0; index < wingButtons.length; index++) wingButtons[index].addEventListener('click', function () { chooseWing(this.dataset.k); });
    var cultureButtons = document.querySelectorAll('.c-btn');
    for (var cultureIndex = 0; cultureIndex < cultureButtons.length; cultureIndex++) cultureButtons[cultureIndex].addEventListener('click', function () { chooseCulture(this.dataset.c); });
    if (wingSelect) wingSelect.addEventListener('change', function () { chooseWing(this.value); });
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { apply(true); }, 80); });
    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' || !results.length) return;
      var url = archive.entityUrl(results[0].entity.s);
      if (url) { event.preventDefault(); location.href = url; }
    });
    more.addEventListener('click', function () { draw(false); });
    setPressed(wingButtons, 'k', wing);
    setPressed(cultureButtons, 'c', culture);
    if (wingSelect) wingSelect.value = wing;
    document.documentElement.dataset.searchReady = 'true';
    apply(true);
  }

  function load() {
    if (window.OmniloreArchive && window.OMNILORE_INDEX) { start(); return; }
    window.setTimeout(load, 30);
  }
  load();
}());

