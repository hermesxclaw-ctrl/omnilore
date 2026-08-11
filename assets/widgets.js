'use strict';

(function () {
  function initAccordions() {
    document.querySelectorAll('.acc-head').forEach(function (button) {
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', function () {
        var group = button.closest('.acc');
        var open = group.classList.toggle('open');
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  function initTabs() {
    document.querySelectorAll('.tabbar').forEach(function (tablist, groupIndex) {
      var tabs = Array.from(tablist.querySelectorAll('.tab-btn'));
      if (!tabs.length) return;
      tablist.setAttribute('role', 'tablist');
      function selectTab(selected, moveFocus) {
        tabs.forEach(function (tab, tabIndex) {
          var target = document.getElementById(tab.getAttribute('aria-controls'));
          var active = tab === selected;
          tab.classList.toggle('active', active);
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
          if (target) {
            target.classList.toggle('active', active);
            target.hidden = !active;
          }
        });
        if (moveFocus) selected.focus();
      }
      tabs.forEach(function (button, tabIndex) {
        var targetId = 'tab-' + button.getAttribute('data-tab');
        var panel = document.getElementById(targetId);
        var buttonId = button.id || 'archive-tab-' + groupIndex + '-' + tabIndex;
        button.id = buttonId;
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-controls', targetId);
        if (panel) {
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('aria-labelledby', buttonId);
        }
        button.addEventListener('click', function () { selectTab(button, false); });
        button.addEventListener('keydown', function (event) {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) < 0) return;
          event.preventDefault();
          var next = tabIndex;
          if (event.key === 'ArrowLeft') next = (tabIndex - 1 + tabs.length) % tabs.length;
          if (event.key === 'ArrowRight') next = (tabIndex + 1) % tabs.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = tabs.length - 1;
          selectTab(tabs[next], true);
        });
      });
      selectTab(tabs.find(function (tab) { return tab.classList.contains('active'); }) || tabs[0], false);
    });
  }

  function initReveals() {
    document.querySelectorAll('.redacted').forEach(function (node) {
      node.setAttribute('role', 'button');
      node.setAttribute('tabindex', '0');
      var reveal = function () { node.classList.toggle('revealed'); };
      node.addEventListener('click', reveal);
      node.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); reveal(); } });
    });
    document.querySelectorAll('.play-btn').forEach(function (button) {
      button.addEventListener('click', function () {
        var entry = button.closest('.tape-entry');
        entry.classList.toggle('playing');
        entry.classList.toggle('revealed');
      });
    });
  }

  function initEffects() {
    document.querySelectorAll('.sig-action').forEach(function (button) {
      button.addEventListener('click', function () {
        var fx = document.getElementById('fx');
        var kind = button.getAttribute('data-fx');
        if (fx && kind) {
          fx.className = 'fx-layer fx-' + kind;
          window.setTimeout(function () { fx.className = 'fx-layer'; }, 1200);
        }
        button.textContent = button.getAttribute('data-done') || 'The seal is broken';
        button.disabled = true;
      });
    });
    var oracleButton = document.getElementById('oracleBtn');
    var oracleText = document.getElementById('oracleText');
    var oracleData = document.getElementById('oracleData');
    if (oracleButton && oracleText && oracleData) {
      var entries = JSON.parse(oracleData.textContent || '[]');
      oracleButton.addEventListener('click', function () { oracleText.textContent = entries[Math.floor(Math.random() * entries.length)] || 'The oracle remains silent.'; });
    }
    var seal = document.getElementById('sealed');
    document.querySelectorAll('[data-seal]').forEach(function (button) { button.addEventListener('click', function () { if (seal) seal.classList.toggle('open'); }); });
  }

  initAccordions();
  initTabs();
  initReveals();
  initEffects();
}());
