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
    document.querySelectorAll('.tab-btn').forEach(function (button) {
      button.addEventListener('click', function () {
        var target = button.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(function (item) { item.classList.toggle('active', item === button); });
        document.querySelectorAll('.tab-panel').forEach(function (panel) { panel.classList.toggle('active', panel.id === 'tab-' + target); });
      });
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
