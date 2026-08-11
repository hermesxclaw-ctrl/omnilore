(function (root, factory) {
  var taxonomy = factory();
  if (typeof module === 'object' && module.exports) module.exports = taxonomy;
  root.OMNILORE_WINGS = taxonomy;
}(typeof window !== 'undefined' ? window : globalThis, function () {
  return [
    { key: 'divine', route: 'wings/pantheon-halls.html', group: 'sacred', label: 'Pantheon Halls' },
    { key: 'demonic', route: 'wings/locked-wing.html', group: 'occult', label: 'Locked Wing' },
    { key: 'eldritch', route: 'wings/sealed-vault.html', group: 'horror', label: 'Sealed Vault' },
    { key: 'yokai', route: 'wings/night-parade.html', group: 'folklore', label: 'Night Parade' },
    { key: 'cryptid', route: 'wings/evidence-room.html', group: 'folklore', label: 'Evidence Room' },
    { key: 'fae', route: 'wings/twilight-garden.html', group: 'folklore', label: 'Twilight Garden' },
    { key: 'internet-horror', route: 'wings/server-vault.html', group: 'modern', label: 'Server Vault' },
    { key: 'analog-horror', route: 'wings/tape-library.html', group: 'modern', label: 'Tape Library' },
    { key: 'spirit', route: 'wings/veiled-gallery.html', group: 'folklore', label: 'Veiled Gallery' },
    { key: 'undead', route: 'wings/cold-crypt.html', group: 'horror', label: 'Cold Crypt' },
    { key: 'trickster', route: 'wings/crooked-hall.html', group: 'legend', label: 'Crooked Hall' },
    { key: 'heroic-legend', route: 'wings/bronze-gallery.html', group: 'legend', label: 'Bronze Gallery' },
    { key: 'beast', route: 'wings/great-menagerie.html', group: 'folklore', label: 'Great Menagerie' },
    { key: 'cosmic', route: 'wings/observatory.html', group: 'cosmic', label: 'Observatory' },
    { key: 'construct', route: 'wings/workshop-vault.html', group: 'material', label: 'Workshop Vault' },
    { key: 'relic', route: 'wings/reliquary.html', group: 'material', label: 'Reliquary' },
    { key: 'fine-art', route: 'wings/painted-wing.html', group: 'material', label: 'Painted Wing' }
  ];
}));

