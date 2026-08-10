/* Shared global search binding. Loads the single archive engine at any site depth. */
(function () {
  'use strict';
  var input = document.getElementById('q'), dropdown = document.getElementById('dd');
  if (!input || !dropdown || input.dataset.archiveBound) return;
  input.dataset.archiveBound = 'true';

  function engineScriptUrl() {
    var scripts = document.scripts;
    for (var i = 0; i < scripts.length; i++) if (/nav-search\.js(?:\?|$)/.test(scripts[i].src)) return scripts[i].src.replace(/nav-search\.js(?:\?.*)?$/, 'archive-engine.js');
    return 'assets/archive-engine.js';
  }

  function bind() {
    if (!window.OmniloreArchive || !window.OMNILORE_INDEX) return;
    var engine = window.OmniloreArchive.createArchiveEngine(window.OMNILORE_INDEX, location.pathname), selected = -1, results = [];
    function close() { dropdown.className = ''; selected = -1; }
    function render() {
      var raw = input.value.trim();
      if (raw.length < 2) { close(); results = []; return; }
      results = engine.search(raw, { limit: 9 });
      dropdown.innerHTML = results.map(function (result, index) {
        var href = engine.entityUrl(result.entity.s), via = result.matchedBy !== 'name' ? ' <span class="via">← ' + window.OmniloreArchive.escape(result.matchedBy) + '</span>' : '';
        return '<a href="' + href + '" data-index="' + index + '">' + window.OmniloreArchive.escape(result.entity.n) + via + '<small>' + window.OmniloreArchive.escape(result.entity.c || result.entity.k || '') + '</small></a>';
      }).join('') || '<span class="search-empty">No matches in the Archive.</span>';
      dropdown.className = 'on';
    }
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (event) {
      var links = dropdown.querySelectorAll('a[href]');
      if (event.key === 'ArrowDown') { event.preventDefault(); selected = Math.min(selected + 1, links.length - 1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); selected = Math.max(selected - 1, -1); }
      else if (event.key === 'Escape') { close(); return; }
      else if (event.key === 'Enter') { var url = engine.resolveResultUrl(results, selected); if (url) { event.preventDefault(); location.href = url; } return; }
      else return;
      for (var index = 0; index < links.length; index++) links[index].classList.toggle('sel', index === selected);
      if (selected >= 0) links[selected].scrollIntoView({ block: 'nearest' });
    });
    document.addEventListener('click', function (event) { if (!dropdown.contains(event.target) && event.target !== input) close(); });
  }

  if (window.OmniloreArchive) { bind(); return; }
  var script = document.createElement('script');
  script.src = engineScriptUrl();
  script.onload = bind;
  script.onerror = function () { dropdown.innerHTML = '<span class="search-empty">Search is unavailable on this page.</span>'; };
  document.head.appendChild(script);
}());
