/* Shared global search binding. Loads the single archive engine at any site depth. */
(function () {
  'use strict';
  if (new URLSearchParams(location.search).has('local-edit') && !/\/entity\/lilith\.html$/i.test(location.pathname)) {
    var localEditor = document.createElement('script');
    localEditor.src = (document.currentScript && document.currentScript.src ? document.currentScript.src : 'assets/nav-search.js').replace(/nav-search\.js(?:\?.*)?$/, 'local-page-editor.js');
    document.head.appendChild(localEditor);
  }
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    var scripts = document.scripts;
    for (var index = 0; index < scripts.length; index++) {
      if (!/nav-search\.js(?:\?|$)/.test(scripts[index].src)) continue;
      var workerUrl = new URL('../sw.js', scripts[index].src);
      navigator.serviceWorker.register(workerUrl.href, { scope: new URL('./', workerUrl).pathname })
        .catch(function () { /* Search remains usable when offline support is unavailable. */ });
      return;
    }
  }

  function bindNavToggle() {
    var button = document.getElementById('navToggle');
    var menu = document.getElementById('navLinks');
    if (!button || !menu || button.dataset.navBound) return;
    button.dataset.navBound = 'true';
    button.setAttribute('aria-controls', menu.id);
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? '✕' : '☰';
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !menu.classList.contains('open')) return;
      menu.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
      button.textContent = '☰';
      button.focus();
    });
  }

  registerServiceWorker();
  bindNavToggle();
  var input = document.getElementById('q'), dropdown = document.getElementById('dd');
  var randomControls = document.querySelectorAll('.js-rand, #rand, #rand2');
  if ((!input || !dropdown) && !randomControls.length) return;
  if (input && dropdown) {
    input.dataset.archiveBound = 'true';
    if (!dropdown.id) dropdown.id = 'archive-search-results';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', dropdown.id);
    input.setAttribute('aria-expanded', 'false');
    dropdown.setAttribute('role', 'listbox');
  }

  function siblingScriptUrl(filename) {
    var scripts = document.scripts;
    for (var i = 0; i < scripts.length; i++) if (/nav-search\.js(?:\?|$)/.test(scripts[i].src)) return scripts[i].src.replace(/nav-search\.js(?:\?.*)?$/, filename);
    return 'assets/' + filename;
  }

  function loadScript(url, done) {
    var existing = document.querySelector('script[src="' + url + '"]');
    if (existing) { existing.addEventListener('load', done, { once: true }); return; }
    var script = document.createElement('script');
    script.src = url;
    script.onload = done;
    script.onerror = function () { if (dropdown) dropdown.innerHTML = '<span class="search-empty" role="status">Search is unavailable on this page.</span>'; };
    document.head.appendChild(script);
  }

  function ensureIndex(done) {
    if (window.OMNILORE_INDEX) { done(); return; }
    loadScript(siblingScriptUrl('search-index.js'), done);
  }

  function ensureEngine(done) {
    if (window.OmniloreArchive) { done(); return; }
    loadScript(siblingScriptUrl('archive-engine.js'), done);
  }

  function bind() {
    if (!window.OmniloreArchive || !window.OMNILORE_INDEX) return;
    var engine = window.OmniloreArchive.createArchiveEngine(window.OMNILORE_INDEX, location.pathname), selected = -1, results = [];
    for (var randomIndex = 0; randomIndex < randomControls.length; randomIndex++) {
      (function (control) {
        if (control.dataset.archiveRandomBound) return;
        control.dataset.archiveRandomBound = 'true';
        control.addEventListener('click', function (event) {
          var entity = engine.random();
          var url = entity && engine.entityUrl(entity.s);
          if (!url) return;
          event.preventDefault();
          location.href = url;
        });
      }(randomControls[randomIndex]));
    }
    if (!input || !dropdown) return;
    function close() {
      dropdown.className = '';
      selected = -1;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }
    function render() {
      var raw = input.value.trim();
      if (raw.length < 2) { close(); results = []; return; }
      results = engine.search(raw, { limit: 9 });
      dropdown.innerHTML = results.map(function (result, index) {
        var href = engine.entityUrl(result.entity.s), via = result.matchedBy !== 'name' ? ' <span class="via">← ' + window.OmniloreArchive.escape(result.matchedBy) + '</span>' : '';
        return '<a id="archive-result-' + index + '" role="option" aria-selected="false" href="' + href + '" data-index="' + index + '">' + window.OmniloreArchive.escape(result.entity.n) + via + '<small>' + window.OmniloreArchive.escape(result.entity.c || result.entity.k || '') + '</small></a>';
      }).join('') || '<span class="search-empty" role="status">No matches in the Archive.</span>';
      dropdown.className = 'on';
      input.setAttribute('aria-expanded', 'true');
    }
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (event) {
      var links = dropdown.querySelectorAll('a[href]');
      if (event.key === 'ArrowDown') { event.preventDefault(); selected = Math.min(selected + 1, links.length - 1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); selected = Math.max(selected - 1, -1); }
      else if (event.key === 'Escape') { close(); return; }
      else if (event.key === 'Enter') { var url = engine.resolveResultUrl(results, selected); if (url) { event.preventDefault(); location.href = url; } return; }
      else return;
      for (var index = 0; index < links.length; index++) {
        links[index].classList.toggle('sel', index === selected);
        links[index].setAttribute('aria-selected', String(index === selected));
      }
      if (selected >= 0) {
        input.setAttribute('aria-activedescendant', links[selected].id);
        links[selected].scrollIntoView({ block: 'nearest' });
      } else input.removeAttribute('aria-activedescendant');
    });
    document.addEventListener('click', function (event) { if (!dropdown.contains(event.target) && event.target !== input) close(); });
  }

  ensureIndex(function () { ensureEngine(bind); });
}());
