(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.OmniloreArchive = api;
  root.Omnilore = root.Omnilore || {};
  root.Omnilore.archive = api;
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ')
      .trim().replace(/\s+/g, ' ');
  }

  function skeleton(value) {
    return normalize(value).replace(/[^a-z]/g, '').replace(/[aeiou]/g, '')
      .split('').filter(function (letter, index, letters) { return letter !== letters[index - 1]; }).join('');
  }

  function distance(left, right) {
    if (left === right) return 0;
    if (!left) return right.length;
    if (!right) return left.length;
    var previous = [], current = [], row, column;
    for (column = 0; column <= right.length; column++) previous[column] = column;
    for (row = 1; row <= left.length; row++) {
      current[0] = row;
      for (column = 1; column <= right.length; column++) {
        current[column] = Math.min(previous[column] + 1, current[column - 1] + 1, previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1));
      }
      previous = current;
      current = [];
    }
    return previous[right.length];
  }

  function score(entity, query) {
    var name = normalize(entity.n), aliases = entity.a || [], culture = normalize(entity.c), epithet = normalize(entity.e), description = normalize(entity.d);
    if (!query) return { score: 99, matchedBy: 'browse' };
    if (name === query) return { score: 0, matchedBy: 'name' };
    if (name.indexOf(query) === 0) return { score: 1, matchedBy: 'name' };
    if (name.indexOf(query) >= 0) return { score: 2, matchedBy: 'name' };
    for (var i = 0; i < aliases.length; i++) {
      var alias = normalize(aliases[i]);
      if (alias === query) return { score: 3, matchedBy: String(aliases[i]) };
      if (alias.indexOf(query) === 0) return { score: 3.2, matchedBy: String(aliases[i]) };
      if (alias.indexOf(query) >= 0) return { score: 3.5, matchedBy: String(aliases[i]) };
    }
    if (culture.indexOf(query) >= 0) return { score: 4, matchedBy: 'culture' };
    if (epithet.indexOf(query) >= 0 || description.indexOf(query) >= 0) return { score: 4.2, matchedBy: 'description' };
    var tokens = query.split(' '), blob = name + ' ' + aliases.map(normalize).join(' '), allTokens = tokens.length > 1;
    for (var tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) if (blob.indexOf(tokens[tokenIndex]) < 0) allTokens = false;
    if (allTokens) return { score: 5, matchedBy: 'tokens' };
    var best = 99, nameTokens = name.split(' ');
    for (var nameIndex = 0; nameIndex < nameTokens.length; nameIndex++) best = Math.min(best, distance(nameTokens[nameIndex], query));
    if (best <= 2) return { score: 6 + best / 10, matchedBy: 'close match' };
    var querySkeleton = skeleton(query);
    if (querySkeleton.length > 2 && skeleton(name).indexOf(querySkeleton) >= 0) return { score: 7, matchedBy: 'close match' };
    return null;
  }

  function entityPrefix(locationPath) {
    var pathname = String(locationPath || '/').replace(/\\/g, '/');
    if (pathname.indexOf('/entity/') >= 0) return '';
    if (pathname.indexOf('/wings/') >= 0) return '../entity/';
    return 'entity/';
  }

  function createArchiveEngine(index, locationPath) {
    var entities = Array.isArray(index) ? index.filter(function (entity) { return entity && entity.s && entity.n; }) : [];
    var knownSlugs = {};
    entities.forEach(function (entity) { knownSlugs[entity.s] = true; });
    return {
      search: function (rawQuery, options) {
        options = options || {};
        var query = normalize(rawQuery), wing = options.wing || 'all', culture = options.culture || 'all', results = [];
        entities.forEach(function (entity) {
          if (wing !== 'all' && entity.k !== wing) return;
          if (culture !== 'all' && entity.c !== culture) return;
          var ranked = score(entity, query);
          if (ranked) results.push({ entity: entity, score: ranked.score, matchedBy: ranked.matchedBy });
        });
        results.sort(function (left, right) {
          return left.score - right.score || (left.entity._finished === right.entity._finished ? left.entity.n.localeCompare(right.entity.n) : (left.entity._finished ? -1 : 1));
        });
        return typeof options.limit === 'number' ? results.slice(0, options.limit) : results;
      },
      entityUrl: function (slug) {
        return knownSlugs[slug] ? entityPrefix(locationPath) + slug + '.html' : null;
      },
      resolveResultUrl: function (results, selectedIndex) {
        var result = results[selectedIndex >= 0 ? selectedIndex : 0];
        return result ? this.entityUrl(result.entity.s) : null;
      }
    };
  }

  return { createArchiveEngine: createArchiveEngine, normalize: normalize, escape: function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]; }); } };
}));
