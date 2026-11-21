/* Made by Benjamin Lennon (lennonapps@outlook.com), author and project lead,
   with Hillary Lennon.
   The credit and the About box. The same file in each of the Lennon apps; the About box reads its words from
   here, so they live inside the program itself. Text only: nothing here sends anything anywhere. */
(function () {
  'use strict';
  var CREDIT = Object.freeze({
    author: 'Benjamin Lennon',
    authorEmail: 'lennonapps@outlook.com',
    authorRole: 'Author and project lead.',
    collaborator: 'Hillary Lennon',
    collaboratorEmail: '',
    thanks: 'Hillary helped conceive the idea, shaped and directed what the app needed to achieve, and tested it throughout. ' +
      'Thank you, Hillary: this app is what it is because of your ideas and care.',
  });
  // The tamper check: a fingerprint of the credit's exact words, recorded when the release was made. If the words are
  // changed, the fingerprint no longer matches and the About box says this copy has been changed. It only looks;
  // it sends nothing anywhere. (FNV-1a, 32-bit: a fingerprint, not a lock.)
  var FINGERPRINT = '50b36047';
  function fingerprint(c) {
    var s = [c.author, c.authorEmail, c.authorRole, c.collaborator, c.collaboratorEmail, c.thanks].join('|'), h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  var INTACT = fingerprint(CREDIT) === FINGERPRINT;
  var LINE = 'Made by ' + CREDIT.author + ' (' + CREDIT.authorEmail + '), author and project lead, with ' +
    CREDIT.collaborator + '.';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // The About box. opts: { app: 'Lemon Timer', version: '0.4.0', notices: [{ what, who, licence, file }] }
  function about(opts) {
    opts = opts || {};
    var old = document.getElementById('lennon-about');
    if (old) old.parentNode.removeChild(old);
    var notices = (opts.notices || []).map(function (n) {
      return '<li>' + esc(n.what) + ': ' + esc(n.who) + '. ' + esc(n.licence) + (n.file ? ' (see ' + esc(n.file) + ')' : '') + '.</li>';
    }).join('');
    var box = document.createElement('div');
    box.id = 'lennon-about';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'About ' + (opts.app || 'this app'));
    box.setAttribute('style', 'position:fixed;inset:0;z-index:2147483000;background:rgba(15,20,28,.55);display:flex;align-items:center;justify-content:center;padding:16px;');
    box.innerHTML =
      '<div style="background:#fff;color:#1d2733;max-width:520px;width:100%;border-radius:12px;padding:22px 24px;' +
      'font:15px/1.55 \'Segoe UI\',system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.35);max-height:90vh;overflow:auto;text-align:left;">' +
      '<h2 style="margin:0 0 4px;font-size:20px;">' + esc(opts.app || 'About') + '</h2>' +
      (opts.version ? '<p style="margin:0 0 14px;color:#5b6b7c;">Version ' + esc(opts.version) + '</p>' : '') +
      '<p style="margin:0;"><strong>Made by ' + esc(CREDIT.author) + '</strong> &middot; ' + esc(CREDIT.authorEmail) + '</p>' +
      '<p style="margin:0 0 12px;">' + esc(CREDIT.authorRole) + '</p>' +
      '<p style="margin:0;"><strong>With ' + esc(CREDIT.collaborator) + '</strong>' + (CREDIT.collaboratorEmail ? ' &middot; ' + esc(CREDIT.collaboratorEmail) : '') + '</p>' +
      '<p style="margin:0 0 12px;">' + esc(CREDIT.thanks) + '</p>' +
      (INTACT ? '' : '<p style="margin:12px 0;padding:8px 10px;border-radius:8px;background:#fdecea;color:#8a1c12;"><strong>This copy has been changed from the original.</strong> ' +
        'The credit above is not the one it was released with.</p>') +
      (notices ? '<p style="margin:12px 0 4px;"><strong>Open-source parts</strong></p><ul style="margin:0 0 12px;padding-left:20px;">' + notices + '</ul>' : '') +
      '<p style="margin:16px 0 0;text-align:right;"><button type="button" id="lennon-about-close" ' +
      'style="font:inherit;padding:6px 18px;border-radius:8px;border:1px solid #9aa7b4;background:#eef2f7;cursor:pointer;">Close</button></p>' +
      '</div>';
    function close() { if (box.parentNode) box.parentNode.removeChild(box); document.removeEventListener('keydown', onKey, true); }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(box);
    var b = document.getElementById('lennon-about-close');
    b.addEventListener('click', close);
    b.focus();
  }

  window.AppCredit = Object.freeze({ CREDIT: CREDIT, LINE: LINE, about: about, intact: INTACT, fingerprint: FINGERPRINT });
  // the credit on the page itself too (right-click, Inspect)
  function mark() { if (document.body && !document.body.getAttribute('data-author')) document.body.setAttribute('data-author', LINE); }
  if (document.body) mark(); else document.addEventListener('DOMContentLoaded', mark);
})();
