// Check a copy: fingerprints every dropped or chosen file in the browser (SHA-256, Web Crypto) and compares them with
// the published list in sums.js. Nothing is uploaded or sent anywhere.
(function () {
  'use strict';
  var SUMS = window.LENNON_SUMS, out = document.getElementById('out'), drop = document.getElementById('drop');
  if (!SUMS || !window.crypto || !crypto.subtle) {
    out.innerHTML = '<div class="result bad"><h3>This browser can\'t check files here</h3><p>Use PowerShell instead: <code>Get-FileHash "the file"</code>, and compare it with the list on the app\'s page.</p></div>';
    return;
  }
  var byZip = {}, byFile = {};
  SUMS.apps.forEach(function (a) {
    byZip[a.zip.sha] = a;
    a.files.forEach(function (f) { (byFile[f.sha] = byFile[f.sha] || []).push({ app: a, path: f.path }); });
  });
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var hex = function (buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); };
  var hash = function (file) { return file.arrayBuffer().then(function (b) { return crypto.subtle.digest('SHA-256', b); }).then(hex); };
  var IGNORE = /(^|\/)(desktop\.ini|thumbs\.db|\.ds_store)$/i;

  function show(kind, title, lines) {
    var d = document.createElement('div');
    d.className = 'result ' + kind;
    d.innerHTML = '<h3>' + esc(title) + '</h3>' + (lines && lines.length ? '<ul>' + lines.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>' : '');
    out.insertBefore(d, out.firstChild);
  }
  var appLink = function (a) { return '<a href="../' + a.page + '">' + esc(a.name) + ' ' + esc(a.version) + '</a>'; };

  // Single files: a released zip, or one file from inside one.
  function checkFile(file) {
    return hash(file).then(function (h) {
      if (byZip[h]) return show('ok', '✓ ' + file.name + ' is ' + byZip[h].name + ' ' + byZip[h].version + ', exactly as released.', ['Fingerprint ' + h]);
      if (byFile[h]) return show('ok', '✓ ' + file.name + ' is a released file.', byFile[h].map(function (m) { return esc(m.path) + ' in ' + appLink(m.app); }));
      var zip = /\.zip$/i.test(file.name);
      show('bad', '✗ ' + file.name + ' doesn\'t match anything we released.', [
        'Fingerprint ' + h,
        zip ? 'If it\'s one of our apps, it has been changed or repackaged. Extract it and drop the folder here to see which file differs, or download a fresh copy.' : 'It may be from another version, or it has been changed. Download a fresh copy from the app\'s page.'
      ]);
    });
  }

  // A folder: work out which app it is, then compare every file by its path.
  function checkFolder(list) {   // list: [{ path: 'Lemon Timer/System/app/js/app.js', file }]
    var top = list[0].path.split('/')[0], rel = function (p) { return p.split('/').slice(1).join('/'); };
    var files = list.filter(function (x) { return !IGNORE.test(x.path); });
    return Promise.all(files.map(function (x) { return hash(x.file).then(function (h) { return { path: rel(x.path), sha: h }; }); })).then(function (got) {
      // the app whose list shares most fingerprints with the folder
      var best = null, bestN = -1;
      SUMS.apps.forEach(function (a) {
        var shas = {}; a.files.forEach(function (f) { shas[f.sha] = 1; });
        var n = got.filter(function (g) { return shas[g.sha]; }).length + (a.folder === top ? 0.5 : 0);
        if (n > bestN) { best = a; bestN = n; }
      });
      if (!best || bestN < 1) return show('bad', '✗ The folder "' + top + '" doesn\'t match any app we released.', ['None of its ' + got.length + ' files is one of ours.']);
      var have = {}; got.forEach(function (g) { have[g.path] = g.sha; });
      var changed = [], missing = [], extra = [];
      best.files.forEach(function (f) { if (!(f.path in have)) missing.push(f.path); else if (have[f.path] !== f.sha) changed.push(f.path); });
      var listed = {}; best.files.forEach(function (f) { listed[f.path] = 1; });
      got.forEach(function (g) { if (!listed[g.path]) extra.push(g.path); });
      if (!changed.length && !missing.length && !extra.length) return show('ok', '✓ "' + top + '" is ' + best.name + ' ' + best.version + ', every file exactly as released.', [best.files.length + ' files checked.']);
      var lines = [];
      changed.forEach(function (p) { lines.push('<strong>Changed:</strong> ' + esc(p)); });
      missing.forEach(function (p) { lines.push('<strong>Missing:</strong> ' + esc(p)); });
      extra.forEach(function (p) { lines.push('<strong>Not ours:</strong> ' + esc(p)); });
      lines.push('Download a fresh copy from the ' + appLink(best) + ' page.');
      show('bad', '✗ "' + top + '" is not ' + best.name + ' ' + best.version + ' as released.', lines);
    });
  }

  // Dropped folders arrive as entries to walk.
  function walk(entry, prefix) {
    return new Promise(function (done) {
      if (entry.isFile) return entry.file(function (f) { done([{ path: prefix + entry.name, file: f }]); }, function () { done([]); });
      var reader = entry.createReader(), all = [];
      (function more() {
        reader.readEntries(function (ents) {
          if (!ents.length) return Promise.all(all).then(function (r) { done([].concat.apply([], r)); });
          ents.forEach(function (e) { all.push(walk(e, prefix + entry.name + '/')); });
          more();
        }, function () { done([]); });
      })();
    });
  }

  function busy(p) { drop.style.opacity = '.6'; return p.then(function () { drop.style.opacity = ''; }, function (e) { drop.style.opacity = ''; show('bad', 'Something went wrong reading that.', [esc(e && e.message || e)]); }); }

  document.getElementById('files').addEventListener('change', function (e) { busy(Promise.all([].map.call(e.target.files, checkFile))); e.target.value = ''; });
  document.getElementById('folder').addEventListener('change', function (e) {
    var list = [].map.call(e.target.files, function (f) { return { path: f.webkitRelativePath || f.name, file: f }; });
    if (list.length) busy(checkFolder(list));
    e.target.value = '';
  });
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) {
    var items = [].slice.call(e.dataTransfer.items || []), jobs = [];
    items.forEach(function (it) {
      var entry = it.webkitGetAsEntry && it.webkitGetAsEntry();
      if (entry && entry.isDirectory) jobs.push(walk(entry, '').then(function (list) { return list.length ? checkFolder(list) : null; }));
      else if (it.kind === 'file') jobs.push(checkFile(it.getAsFile()));
    });
    busy(Promise.all(jobs));
  });
})();
