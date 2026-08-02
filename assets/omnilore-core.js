/* ============================================================
   OMNILORE CORE — data layer, event pipeline, and local store.
   ------------------------------------------------------------
   Backend-ready architecture:

   1. DATA (Omnilore.data)
      Today the Archive ships as a static index (search-index.js).
      Tomorrow a backend can take over by setting
        Omnilore.config.apiBase = 'https://api.example.com'
      before this file loads — Omnilore.data.init() will then
      fetch `${apiBase}/entities` instead of using the bundle.
      Every consumer talks to the same async interface either way.

   2. PIPELINE (Omnilore.bus)
      A tiny pub/sub. Every meaningful interaction emits an event:
        search, navigate, random, pathway, save, unsave, share,
        showcase, eotd, advisory
      Events are also appended to a capped in-memory journal
      (bus.journal) that a future analytics/collector endpoint
      can drain and flush — bus.on('*', shipToBackend).

   3. STORE (Omnilore.store)
      Namespaced, JSON-safe localStorage for visitor state:
      recent entities ("passage") and saved entities ("reliquary").
   ============================================================ */
(function () {
  'use strict';

  var Omnilore = (window.Omnilore = window.Omnilore || {});

  /* ---------- config ---------- */
  var config = (Omnilore.config = Omnilore.config || {
    apiBase: null, // set to enable remote data source
    version: '2.0.0',
    features: {
      pathways: true,
      reliquary: true,
      passage: true,
      pwa: true,
      countUp: true
    },
    limits: { recent: 12, reliquary: 200, journal: 100 }
  });

  /* ---------- event bus / pipeline ---------- */
  var bus = (function () {
    var listeners = {};
    var journal = [];
    function emit(type, payload) {
      var event = { type: type, payload: payload || {}, at: new Date().toISOString() };
      journal.push(event);
      if (journal.length > config.limits.journal) journal.shift();
      var fns = (listeners[type] || []).concat(listeners['*'] || []);
      for (var i = 0; i < fns.length; i++) {
        try { fns[i](event); } catch (err) { /* listeners must never break the page */ }
      }
      // DOM mirror so other scripts / future backend collectors can subscribe
      try {
        document.dispatchEvent(new CustomEvent('omnilore:' + type, { detail: event }));
      } catch (err) { /* older browsers without CustomEvent ctor */ }
      return event;
    }
    function on(type, fn) {
      (listeners[type] = listeners[type] || []).push(fn);
      return function () { off(type, fn); };
    }
    function off(type, fn) {
      var fns = listeners[type];
      if (!fns) return;
      var i = fns.indexOf(fn);
      if (i >= 0) fns.splice(i, 1);
    }
    return { emit: emit, on: on, off: off, journal: journal };
  })();
  Omnilore.bus = bus;

  /* ---------- persistent store ---------- */
  var store = (function () {
    var PREFIX = 'omnilore:';
    function read(key, fallback) {
      try {
        var raw = localStorage.getItem(PREFIX + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (err) { return fallback; }
    }
    function write(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (err) {}
    }
    function unique(list) {
      var seen = {}, out = [];
      for (var i = 0; i < list.length; i++) {
        if (!seen[list[i].s]) { seen[list[i].s] = 1; out.push(list[i]); }
      }
      return out;
    }
    return {
      /* Passage: the visitor's recent trail through the Archive. */
      getRecent: function () { return read('passage', []); },
      pushRecent: function (entity) {
        if (!entity || !entity.s) return;
        var item = { s: entity.s, n: entity.n, k: entity.k, c: entity.c || '', at: Date.now() };
        var list = read('passage', []).filter(function (e) { return e.s !== entity.s; });
        list.unshift(item);
        write('passage', unique(list).slice(0, config.limits.recent));
      },
      /* Reliquary: entities the visitor has chosen to keep. */
      getReliquary: function () { return read('reliquary', []); },
      inReliquary: function (slug) {
        var list = read('reliquary', []);
        for (var i = 0; i < list.length; i++) if (list[i].s === slug) return true;
        return false;
      },
      toggleReliquary: function (entity) {
        if (!entity || !entity.s) return false;
        var list = read('reliquary', []);
        var kept = true;
        var next = list.filter(function (e) { return e.s !== entity.s; });
        if (next.length === list.length) {
          next.unshift({ s: entity.s, n: entity.n, k: entity.k, c: entity.c || '', at: Date.now() });
          next = next.slice(0, config.limits.reliquary);
        } else {
          kept = false;
        }
        write('reliquary', next);
        bus.emit(kept ? 'save' : 'unsave', { slug: entity.s, name: entity.n });
        return kept;
      }
    };
  })();
  Omnilore.store = store;

  /* ---------- data layer ---------- */
  var data = (function () {
    var index = null;
    var slugMap = null;
    var readyPromise = null;

    function hydrate(list) {
      index = Array.isArray(list) ? list : [];
      slugMap = {};
      for (var i = 0; i < index.length; i++) {
        if (index[i] && index[i].s) slugMap[index[i].s] = index[i];
      }
      return index;
    }

    function init() {
      if (readyPromise) return readyPromise;
      readyPromise = new Promise(function (resolve) {
        // 1) Static bundle (current architecture)
        if (window.OMNILORE_INDEX && window.OMNILORE_INDEX.length) {
          return resolve(hydrate(window.OMNILORE_INDEX));
        }
        // 2) Remote backend (future architecture)
        if (config.apiBase) {
          return fetch(config.apiBase.replace(/\/$/, '') + '/entities')
            .then(function (r) { return r.ok ? r.json() : []; })
            .then(function (list) { resolve(hydrate(list)); })
            .catch(function () { resolve(hydrate([])); });
        }
        // 3) Nothing available — resolve empty, page degrades gracefully
        resolve(hydrate([]));
      });
      return readyPromise;
    }

    function hashStr(s) {
      var h = 2166136261;
      for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
      return h >>> 0;
    }

    function skel(v) {
      return String(v || '').toLowerCase().normalize('NFD')
        .replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '')
        .replace(/[aeiou]/g, '')
        .split('').filter(function (ch, i, a) { return ch !== a[i - 1]; }).join('');
    }

    return {
      init: init,
      all: function () { return index || []; },
      count: function () { return (index || []).length; },
      bySlug: function (slug) { return slugMap ? slugMap[slug] || null : null; },
      withImages: function () { return (index || []).filter(function (e) { return e.i; }); },
      finished: function () { return (index || []).filter(function (e) { return e._finished; }); },
      cultures: function () {
        var set = {};
        (index || []).forEach(function (e) { if (e.c) set[e.c] = 1; });
        return Object.keys(set);
      },
      random: function () {
        var list = index || [];
        return list.length ? list[Math.floor(Math.random() * list.length)] : null;
      },
      /* Deterministic pick per seed string (used for "entity of the night"). */
      bySeed: function (seed, pool) {
        pool = pool || index || [];
        return pool.length ? pool[hashStr(seed) % pool.length] : null;
      },
      /* Fuzzy search: substring on name/culture/aliases, then skeleton match.
         Tolerant of missing fields and diacritics. Returns max `limit`. */
      search: function (query, limit) {
        var v = String(query || '').trim().toLowerCase();
        if (v.length < 2) return [];
        var vs = skel(v);
        var out = [];
        var list = index || [];
        for (var i = 0; i < list.length && out.length < (limit || 9); i++) {
          var e = list[i];
          if (!e || !e.n) continue;
          var nm = e.n.toLowerCase();
          if (nm.indexOf(v) >= 0) {
            out.push({ e: e, via: null, score: nm.indexOf(v) === 0 ? 0 : 1 });
            continue;
          }
          var aliases = e.a || [];
          var hit = false;
          for (var a = 0; a < aliases.length; a++) {
            if (String(aliases[a]).toLowerCase().indexOf(v) >= 0) {
              out.push({ e: e, via: aliases[a], score: 2 });
              hit = true;
              break;
            }
          }
          if (!hit && vs.length > 2 && skel(e.n).indexOf(vs) >= 0) {
            out.push({ e: e, via: 'close match', score: 3 });
          }
        }
        out.sort(function (x, y) { return x.score - y.score; });
        return out;
      },
      entityUrl: function (entity) { return 'entity/' + entity.s + '.html'; }
    };
  })();
  Omnilore.data = data;

  /* ---------- helpers ---------- */
  Omnilore.esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  Omnilore.el = function (tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
})();
