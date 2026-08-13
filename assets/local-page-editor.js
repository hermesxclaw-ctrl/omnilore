/* Private local authoring mode. Loads only when ?local-edit=1 is present. */
(function () {
  'use strict';
  if (!new URLSearchParams(location.search).has('local-edit')) return;
  var handle, baseline = '', key = '', timer;
  var bar = document.createElement('div');
  var style = document.createElement('style');
  style.id = 'omnilore-local-edit-style';
  style.textContent = '#omnilore-local-edit-bar{position:fixed;z-index:99999;left:12px;right:12px;bottom:12px;display:flex;align-items:center;gap:8px;padding:10px 12px;background:#180a0b;color:#e8d9d4;border:1px solid #ff6a54;box-shadow:0 10px 30px rgba(0,0,0,.5);font:12px/1.2 system-ui,sans-serif}#omnilore-local-edit-bar b{color:#ff6a54;letter-spacing:.08em}#omnilore-local-edit-status{color:#bd9a90;margin-right:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#omnilore-local-edit-bar button{font:inherit;color:#e8d9d4;background:#261011;border:1px solid #4d2024;padding:7px 9px;cursor:pointer}#omnilore-local-edit-bar button:not(:disabled):hover{border-color:#ff6a54}#omnilore-local-edit-bar button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:700px){#omnilore-local-edit-bar{flex-wrap:wrap;left:6px;right:6px;bottom:6px}#omnilore-local-edit-status{order:2;width:100%}}';
  bar.id = 'omnilore-local-edit-bar';
  bar.contentEditable = 'false';
  bar.innerHTML = '<b>LOCAL EDIT MODE</b><span id="omnilore-local-edit-status">Attach this page file to unlock saving.</span><button data-action="attach">Attach this page</button><button data-action="save" disabled>Save</button><button data-action="backup" disabled>Download backup</button><button data-action="restore" disabled>Restore draft</button>';
  document.head.append(style); document.body.append(bar);
  var buttons = {};
  [].forEach.call(bar.querySelectorAll('button'), function (button) { buttons[button.dataset.action] = button; });
  var status = bar.querySelector('#omnilore-local-edit-status');
  function say(message) { status.textContent = message; }
  function pageSource() {
    var mode = document.body.contentEditable;
    document.body.contentEditable = 'false'; style.remove(); bar.remove();
    var html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    document.head.append(style); document.body.append(bar); document.body.contentEditable = mode;
    return html;
  }
  function download(html, name) {
    var url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    var link = document.createElement('a'); link.href = url; link.download = name; link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }
  function scheduleDraft() {
    clearTimeout(timer); timer = setTimeout(function () {
      var html = pageSource();
      if (html !== baseline) { localStorage.setItem(key, html); say('Unsaved draft stored privately in this browser.'); }
    }, 500);
  }
  async function attach() {
    try {
      if (!window.showOpenFilePicker) throw new Error('Brave needs File System Access enabled for direct saving.');
      var picks = await window.showOpenFilePicker({ multiple: false, types: [{ description: 'Archive HTML page', accept: { 'text/html': ['.html', '.htm'] } }] });
      handle = picks[0];
      var file = await handle.getFile(); baseline = await file.text(); key = 'omnilore-local-edit:' + file.name + ':' + file.lastModified;
      document.body.contentEditable = 'true'; bar.contentEditable = 'false';
      document.addEventListener('input', scheduleDraft, true);
      buttons.save.disabled = buttons.backup.disabled = false; buttons.restore.disabled = !localStorage.getItem(key);
      say('Editing ' + file.name + '. Click text, type, then press Save or Ctrl+S.');
    } catch (error) { if (error.name !== 'AbortError') say('Could not attach: ' + error.message); }
  }
  async function save() {
    if (!handle) return;
    var html = pageSource();
    if (html === baseline) { say('Nothing has changed.'); return; }
    download(baseline, handle.name.replace(/\.html?$/i, '') + '-before-edit.html');
    var permission = await handle.requestPermission({ mode: 'readwrite' });
    if (permission !== 'granted') { say('Save permission was not granted; a backup was downloaded.'); return; }
    var writer = await handle.createWritable(); await writer.write(html); await writer.close();
    baseline = html; localStorage.removeItem(key); buttons.restore.disabled = true;
    say('Saved ' + handle.name + '. A before-edit backup was downloaded first.');
  }
  function restore() { var html = localStorage.getItem(key); if (html) { document.open(); document.write(html); document.close(); } else say('No saved draft found.'); }
  buttons.attach.addEventListener('click', attach);
  buttons.save.addEventListener('click', function () { save().catch(function (error) { say('Could not save: ' + error.message); }); });
  buttons.backup.addEventListener('click', function () { download(pageSource(), handle.name.replace(/\.html?$/i, '') + '-manual-backup.html'); });
  buttons.restore.addEventListener('click', restore);
  document.addEventListener('keydown', function (event) { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && handle) { event.preventDefault(); save().catch(function (error) { say('Could not save: ' + error.message); }); } });
  addEventListener('beforeunload', function (event) { if (handle && pageSource() !== baseline) { event.preventDefault(); event.returnValue = ''; } });
}());
