/* Categorized wing filters and index-derived counts. */
(function () {
  'use strict';
  var taxonomy = window.OMNILORE_WINGS || [];
  var entities = window.OMNILORE_INDEX || [];
  var controls = document.getElementById('wing-filters');
  var doors = document.querySelectorAll('.wing-door');
  if (!taxonomy.length || !controls || !doors.length) return;

  var counts = {};
  for (var entityIndex = 0; entityIndex < entities.length; entityIndex++) {
    var key = entities[entityIndex].k;
    counts[key] = (counts[key] || 0) + 1;
  }

  var byRoute = {};
  for (var taxIndex = 0; taxIndex < taxonomy.length; taxIndex++) byRoute[taxonomy[taxIndex].route.replace(/^wings\//, '')] = taxonomy[taxIndex];
  for (var doorIndex = 0; doorIndex < doors.length; doorIndex++) {
    var route = doors[doorIndex].getAttribute('href').replace(/^wings\//, '');
    var wing = byRoute[route];
    if (!wing) continue;
    doors[doorIndex].dataset.wing = wing.key;
    doors[doorIndex].dataset.group = wing.group;
    doors[doorIndex].dataset.count = String(counts[wing.key] || 0);
    var countNode = doors[doorIndex].querySelector('.arch-count');
    if (countNode) countNode.textContent = (counts[wing.key] || 0).toLocaleString() + ' entities';
  }

  var filters = [
    { value: 'all', label: 'All doors' },
    { value: 'active', label: 'With records' },
    { value: 'sacred', label: 'Sacred' },
    { value: 'folklore', label: 'Folklore' },
    { value: 'legend', label: 'Legend' },
    { value: 'horror', label: 'Horror' },
    { value: 'occult', label: 'Occult' },
    { value: 'modern', label: 'Modern' },
    { value: 'cosmic', label: 'Cosmic' },
    { value: 'material', label: 'Objects & art' }
  ];
  controls.innerHTML = filters.map(function (filter, index) {
    return '<button type="button" data-wing-filter="' + filter.value + '" aria-pressed="' + String(index === 0) + '">' + filter.label + '</button>';
  }).join('');
  var status = document.getElementById('wing-filter-status');

  controls.addEventListener('click', function (event) {
    var button = event.target.closest('[data-wing-filter]');
    if (!button) return;
    var value = button.dataset.wingFilter, visible = 0;
    var buttons = controls.querySelectorAll('[data-wing-filter]');
    for (var buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++) buttons[buttonIndex].setAttribute('aria-pressed', String(buttons[buttonIndex] === button));
    for (var index = 0; index < doors.length; index++) {
      var show = value === 'all' || (value === 'active' ? Number(doors[index].dataset.count) > 0 : doors[index].dataset.group === value);
      doors[index].hidden = !show;
      if (show) visible += 1;
    }
    if (status) status.textContent = visible + ' wing' + (visible === 1 ? '' : 's') + ' shown';
  });
}());

