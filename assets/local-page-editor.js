/* Private local authoring mode. It runs only at ?local-edit=1 on localhost. */
(function () {
  'use strict';
  if (!new URLSearchParams(location.search).has('local-edit')) return;
  if (!document.body) {
    var pendingSrc = document.currentScript && document.currentScript.src;
    document.addEventListener('DOMContentLoaded', function () {
      var retry = document.createElement('script');
      retry.src = pendingSrc || 'assets/local-page-editor.js?v=local-save-v3';
      document.head.appendChild(retry);
    }, { once: true });
    return;
  }
  if (window.__omniloreLocalEditor) return;
  window.__omniloreLocalEditor = true;
  var local = /^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
  if (!local) return;
  var path = location.pathname.replace(/^\//, '');
  var baseline = '', timer, saving = false, dirty = false;
  document.querySelectorAll('#omnilore-local-edit-bar, #omnilore-local-edit-style, script[src*="local-page-editor.js"]').forEach(function (node) { node.remove(); });
  var bar = document.createElement('div');
  var style = document.createElement('style');
  style.id = 'omnilore-local-edit-style';
  style.textContent = '#omnilore-local-edit-bar{position:fixed;z-index:99999;left:12px;right:12px;bottom:12px;display:flex;align-items:center;gap:10px;padding:10px 12px;background:#180a0b;color:#e8d9d4;border:1px solid #ff6a54;box-shadow:0 10px 30px rgba(0,0,0,.5);font:12px/1.2 system-ui,sans-serif}#omnilore-local-edit-bar b{color:#ff6a54;letter-spacing:.08em}#omnilore-local-edit-status{color:#bd9a90;margin-right:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#omnilore-local-edit-bar button{font:inherit;color:#e8d9d4;background:#261011;border:1px solid #4d2024;padding:7px 12px;cursor:pointer}#omnilore-local-edit-bar button:hover{border-color:#ff6a54}@media(max-width:700px){#omnilore-local-edit-bar{flex-wrap:wrap;left:6px;right:6px;bottom:6px}#omnilore-local-edit-status{order:2;width:100%}}';
  bar.id = 'omnilore-local-edit-bar';
  bar.contentEditable = 'false';
  bar.innerHTML = '<b>EDITING</b><span id="omnilore-local-edit-status">Click any text to edit. Press Save when you are done.</span><button type="button">Save</button>';
  document.head.append(style); document.body.append(bar);
  var status = bar.querySelector('#omnilore-local-edit-status');
  var saveButton = bar.querySelector('button');
  function say(message) { status.textContent = message; }
  function pageSource() {
    var mode = document.body.contentEditable;
    document.body.contentEditable = 'false'; style.remove(); bar.remove();
    var html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    document.head.append(style); document.body.append(bar); document.body.contentEditable = mode;
    return html;
  }
  function schedule() {
    dirty = true;
    clearTimeout(timer);
    timer = setTimeout(function () { say('Unsaved changes. Press Save when you are ready.'); }, 350);
  }
  async function save() {
    if (saving) return;
    var html = pageSource();
    if (!dirty) { say('Nothing has changed.'); return; }
    saving = true; saveButton.disabled = true; say('Saving…');
    try {
      var response = await fetch('/__omnilore_local_save', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({path:path, html:html}) });
      var result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Save failed.');
      baseline = html; dirty = false; say('Saved. Backup created automatically.');
    } catch (error) { say('Could not save: ' + error.message); }
    saving = false; saveButton.disabled = false;
  }
  baseline = pageSource();
  document.body.contentEditable = 'true'; bar.contentEditable = 'false';
  document.addEventListener('input', schedule, true);
  saveButton.addEventListener('click', save);
  document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(); return; }
    if (event.key === ' ' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('#omnilore-local-edit-bar')) {
      event.preventDefault();
      document.execCommand('insertText', false, ' ');
      schedule();
    }
  }, true);
  addEventListener('beforeunload', function (event) { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
}());
