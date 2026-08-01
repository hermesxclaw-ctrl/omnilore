(() => {
  'use strict';

  const root = document.documentElement;
  const status = document.querySelector('#status');
  const layers = [...document.querySelectorAll('[data-layer]')];
  const sourceDrawer = document.querySelector('#source-drawer');
  const sourceTrigger = document.querySelector('[aria-controls="source-drawer"]');
  const sourceClose = document.querySelector('#source-close');
  const advisory = document.querySelector('#content-advisory');
  const advisoryAccept = document.querySelector('#advisory-accept');
  const advisoryLeave = document.querySelector('#advisory-leave');
  let lastFocused = null;

  function announce(message) {
    if (!status) return;
    status.textContent = message;
    status.dataset.show = 'true';
    window.setTimeout(() => {
      status.dataset.show = 'false';
    }, 2400);
  }

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // The advisory remains usable when file:// storage is unavailable.
    }
  }

  function focusableWithin(container) {
    return [...container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hidden);
  }

  function trapDrawerFocus(event) {
    if (event.key !== 'Tab' || sourceDrawer.dataset.open !== 'true') return;
    const focusable = focusableWithin(sourceDrawer);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openSources(sourceId) {
    lastFocused = document.activeElement;
    sourceDrawer.dataset.open = 'true';
    sourceDrawer.setAttribute('aria-hidden', 'false');
    sourceTrigger.setAttribute('aria-expanded', 'true');
    document.querySelector('main')?.setAttribute('inert', '');
    document.querySelector('.archive-rail')?.setAttribute('inert', '');
    sourceClose.focus();
    if (sourceId) {
      const source = document.querySelector(`#${CSS.escape(sourceId)}`);
      if (source) {
        source.scrollIntoView({ block: 'center' });
        source.classList.add('is-targeted');
        window.setTimeout(() => source.classList.remove('is-targeted'), 1600);
      }
    }
  }

  function closeSources() {
    sourceDrawer.dataset.open = 'false';
    sourceDrawer.setAttribute('aria-hidden', 'true');
    sourceTrigger.setAttribute('aria-expanded', 'false');
    document.querySelector('main')?.removeAttribute('inert');
    document.querySelector('.archive-rail')?.removeAttribute('inert');
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  }

  sourceTrigger?.addEventListener('click', () => openSources());
  sourceClose?.addEventListener('click', closeSources);
  sourceDrawer?.addEventListener('keydown', trapDrawerFocus);
  document.querySelectorAll('[data-source-target]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openSources(link.dataset.sourceTarget);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sourceDrawer?.dataset.open === 'true') closeSources();
  });

  if (advisory && !storageGet('omnilore-lilith-advisory-v1')) {
    advisory.showModal();
  }
  advisoryAccept?.addEventListener('click', () => {
    storageSet('omnilore-lilith-advisory-v1', 'accepted');
    advisory.close();
    document.querySelector('#main')?.focus({ preventScroll: true });
  });
  advisoryLeave?.addEventListener('click', () => {
    window.location.href = '../index.html';
  });

  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((item) => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      let visible = 0;
      document.querySelectorAll('[data-medium]').forEach((card) => {
        const show = filter === 'all' || card.dataset.medium === filter;
        card.hidden = !show;
        if (show) visible += 1;
      });
      announce(`${visible} adaptation${visible === 1 ? '' : 's'} shown`);
    });
  });

  const contradictionTabs = [...document.querySelectorAll('[role="tab"][data-contradiction]')];
  function selectContradiction(tab, moveFocus = false) {
    contradictionTabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = document.querySelector(`#${item.getAttribute('aria-controls')}`);
      if (panel) panel.hidden = !selected;
    });
    if (moveFocus) tab.focus();
  }
  contradictionTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectContradiction(tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowLeft') next = (index - 1 + contradictionTabs.length) % contradictionTabs.length;
      if (event.key === 'ArrowRight') next = (index + 1) % contradictionTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = contradictionTabs.length - 1;
      selectContradiction(contradictionTabs[next], true);
    });
  });

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const index = layers.indexOf(visible.target);
    const progress = layers.length > 1 ? ((index + 1) / layers.length) * 100 : 100;
    root.style.setProperty('--progress', `${progress}%`);
    root.dataset.epoch = visible.target.id;
  }, { rootMargin: '-25% 0px -55%', threshold: [0, 0.25, 0.5, 0.75] });
  layers.forEach((layer) => observer.observe(layer));

  document.querySelector('[data-back]')?.addEventListener('click', (event) => {
    if (window.history.length <= 1) return;
    event.preventDefault();
    window.history.back();
  });
})();
