(function () {
  'use strict';

  function decode(value) {
    return String(value == null ? '' : value)
      .replace(/&#(\d+);/g, function (_match, decimal) { return String.fromCodePoint(Number(decimal)); })
      .replace(/&#x([0-9a-f]+);/gi, function (_match, hexadecimal) { return String.fromCodePoint(parseInt(hexadecimal, 16)); })
      .replace(/&(amp|lt|gt|quot|apos);/gi, function (_match, name) { return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[name.toLowerCase()]; });
  }

  function esc(value) {
    return decode(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function profile(entity) {
    var type = (entity.t || '').toLowerCase(), culture = (entity.c || '').toLowerCase(), epithet = (entity.e || '').toLowerCase();
    if (/internet|scp|backrooms|creepypasta|analog/.test(culture) || /internet|analog/.test(type)) return 'signal';
    if (/literary|fictional/.test(type) || /novel|novella|short story|film|television/.test(culture)) return 'narrative';
    if (/fine art|painting|sculpture|artwork/.test(type) || /fine art|museum|renaissance/.test(culture)) return 'atelier';
    if (/artifact|object|relic|magic|weapon|tool/.test(type) || entity.k === 'relic' || entity.k === 'construct') return 'reliquary';
    if (/deity|god|goddess|demon|spirit|angel|titan|primordial/.test(type) || /deity|demon|spirit/.test(epithet)) return 'numinous';
    if (/monster|creature|cryptid|beast|animal|shapeshifter/.test(type) || entity.k === 'beast' || entity.k === 'cryptid') return 'bestiary';
    return 'archive';
  }

  function year(entity) {
    var match = ((entity.c || '') + ' ' + (entity.e || '')).match(/\b(?:1[5-9]\d{2}|20\d{2})\b/);
    return match ? match[0] : '';
  }

  function source(entity) {
    var value = entity.c || 'Unclassified — research pending';
    return value.length > 66 ? value.slice(0, 63).replace(/\s+\S*$/, '') + '…' : value;
  }

  function statusLabel(entity) {
    return { reviewed: 'Reviewed dossier', researched: 'Research draft', draft: 'Draft', stub: 'Stub' }[entity.status] || (entity._finished ? 'Reviewed dossier' : 'Draft');
  }

  function card(entity, prefix) {
    if (!entity || entity.status === 'quarantined') return '';
    var cardProfile = profile(entity), sourceYear = year(entity), featured = !!entity.i;
    var reference = entity.d || 'unaccessioned';
    var date = sourceYear ? 'Source year · ' + sourceYear : 'Archive ref · ' + reference;
    var status = entity.status || (entity._finished ? 'reviewed' : 'draft');
    return '<a class="card entity-card status-' + esc(status) + '" data-profile="' + cardProfile + '" data-featured="' + featured + '" href="' + prefix + esc(entity.s) + '.html">' +
      '<span class="entity-ornament" aria-hidden="true"></span><small>' + esc(statusLabel(entity)) + '</small>' +
      '<span class="record-source">' + esc(entity.t || 'Archive record') + ' · ' + esc(source(entity)) + '</span>' +
      '<b>' + esc(entity.n) + '</b>' + (entity.e ? '<i>' + esc(entity.e) + '</i>' : '') +
      '<span class="record-date">' + esc(date) + '</span></a>';
  }

  window.OMNI_CARD = { card: card, profile: profile, sourceYear: year };
}());
