// Builds lennonapps.com from _tools/apps.json and the release records (the SHA256SUMS lists app-release.js wrote):
//   node _tools/build.js [release records folder]
// Writes the home page, a page per live app, Check a copy, Terms and privacy, 404, sums.json (every published
// fingerprint, for Check a copy) and downloads/<record>-SHA256SUMS.txt. The zips in downloads/ and the unzipped copies
// in run/ are put there by hand from the releases and checked against the records here, so a page can't offer a file
// that isn't the one released. Underscore folders are not published (GitHub Pages runs Jekyll, which skips them).
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SITE = path.join(__dirname, '..');
const RECORDS = process.argv[2] || path.join(process.env.USERPROFILE || '', 'OneDrive', 'Documents', 'Lennon Apps', 'Release records');
const CONTACT = 'contact@lennonapps.com';
const apps = JSON.parse(fs.readFileSync(path.join(__dirname, 'apps.json'), 'utf8'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write = (rel, text) => { const f = path.join(SITE, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const mb = (file) => (fs.statSync(file).size / 1048576).toFixed(2).replace(/\.?0+$/, '') + ' MB';

// A release record: the zip's fingerprint and every file's.
function readRecord(name) {
  const text = fs.readFileSync(path.join(RECORDS, name + '-SHA256SUMS.txt'), 'utf8'), lines = text.split(/\r?\n/);
  const row = (l) => { const m = l.match(/^([0-9a-f]{64})\s+(.+)$/); return m && { sha: m[1], path: m[2].trim() }; };
  const start = lines.findIndex((l) => /^Every file/.test(l));
  const zip = lines.slice(0, start).map(row).find(Boolean), files = lines.slice(start + 1).map(row).filter(Boolean);
  if (!zip || !files.length) throw new Error(name + ': no zip or file fingerprints in its record.');
  return { text, zip, files };
}

// Every live app's zip and unzipped copy must be exactly what was released.
const live = apps.filter((a) => a.status === 'live');
for (const a of live) {
  a.rec = readRecord(a.record);
  const zipFile = path.join(SITE, 'downloads', a.rec.zip.path);
  if (!fs.existsSync(zipFile)) throw new Error('Missing ' + zipFile);
  if (sha(zipFile) !== a.rec.zip.sha) throw new Error(a.rec.zip.path + ' is not the released zip.');
  a.size = mb(zipFile);
  for (const f of a.rec.files) {
    const got = path.join(SITE, 'run', a.id, a.folder, f.path);
    if (!fs.existsSync(got) || sha(got) !== f.sha) throw new Error('run/' + a.id + '/' + a.folder + '/' + f.path + ' is not the released file.');
  }
  fs.copyFileSync(path.join(RECORDS, a.record + '-SHA256SUMS.txt'), path.join(SITE, 'downloads', a.record + '-SHA256SUMS.txt'));
}

// ---------- the page frame ----------

const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="8" fill="#1f6f78"/>' +
  '<circle cx="11" cy="12" r="4.2" fill="#f2c230"/><circle cx="21.5" cy="12" r="4.2" fill="#8fb6ff"/><circle cx="16.2" cy="21.5" r="4.2" fill="#f29ac9"/></svg>';
function page({ depth, title, description, current, body, script }) {
  const up = '../'.repeat(depth), nav = [['', 'Apps'], ['check/', 'Check a copy'], ['terms/', 'Terms and privacy']];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="${up}img/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${up}site.css">
</head>
<body>
<header class="top"><div class="wrap">
<a class="brand" href="${up || './'}">${LOGO}<span>Lennon Apps</span></a>
<nav>${nav.map(([href, words]) => `<a href="${up}${href || ''}"${current === href ? ' aria-current="page"' : ''}>${words}</a>`).join('')}</nav>
</div></header>
<main>
${body}
</main>
<footer><div class="wrap">
<span>Made by Benjamin and Hillary Lennon in our own time. Free for education. Please keep the credit.</span>
<span><a href="mailto:${CONTACT}">${CONTACT}</a> · <a href="${up}terms/">Terms and privacy</a></span>
</div></footer>
${[].concat(script || []).map((s) => `<script src="${up}${s}"></script>\n`).join('')}</body>
</html>
`;
}

// ---------- home ----------

const card = (a) => a.status === 'live'
  ? `<a class="card" href="${a.id}/" style="--accent:${a.accent}"><div class="shot"><img src="${a.image}" alt="${esc(a.name)}" width="1280" height="760" loading="lazy"></div><div class="body"><h3>${esc(a.name)}</h3><p>${esc(a.tagline)}</p></div></a>`
  : `<div class="card" style="--accent:${a.accent}"><div class="shot empty">Coming soon</div><div class="body"><span class="tag">Coming soon</span><h3>${esc(a.name)}</h3><p>${esc(a.tagline)}</p></div></div>`;
write('index.html', page({ depth: 0, current: '', title: 'Lennon Apps: little classroom apps', description: 'Free little classroom apps for teachers: run from a flash drive, no install, no internet, nothing tracked.',
  body: `<section class="hero"><div class="wrap">
<h1>Little classroom apps</h1>
<p class="lead">Hi! We're Benjamin and Hillary Lennon. These little classroom apps are a hobby project we made in our own time, and we'd love you to use them.</p>
<p class="sign">Free for education. Please keep the credit. Questions: <a href="mailto:${CONTACT}">${CONTACT}</a></p>
<ul class="pills"><li>Runs from a flash drive</li><li>Nothing to install</li><li>Works offline</li><li>No accounts, no tracking</li><li>Open code you can read</li></ul>
</div></section>
<section class="wrap">
<div class="grid">
${apps.map(card).join('\n')}
</div>
<div class="band three">
<div><h3>Copy the folder, double-click, teach</h3><p>Each app is one folder. Put it on a flash drive, a network drive or your Documents. It runs in Edge or Chrome with no admin rights and no internet.</p></div>
<div><h3>Nothing leaves your computer</h3><p>No accounts, no sign-ins, no analytics. Settings stay in your own browser on your own computer.</p></div>
<div><h3>Open for anyone to read</h3><p>Every app is plain HTML and JavaScript, nothing hidden or compiled. Open the folder and read it, or ask your IT team to. We'd encourage it.</p></div>
</div>
<div class="band">
<h3>Is my copy the real one?</h3>
<p class="muted" style="margin:0">Only copies that match the fingerprints published here are ours. If someone passed you a copy, <a href="check/">check it here</a> in a few seconds. Nothing is uploaded.</p>
</div>
</section>`
}));

// ---------- an app's page ----------

for (const a of live) {
  const run = `../run/${a.id}/${encodeURI(a.folder)}/System/app/index.html`, guide = `../run/${a.id}/${encodeURI(a.folder)}/Teacher%20guide.html`;
  const rows = a.rec.files.map((f) => `<tr><td>${esc(f.path)}</td><td class="hash">${f.sha}</td></tr>`).join('');
  write(a.id + '/index.html', page({ depth: 1, title: a.name + ' · Lennon Apps', description: a.tagline, current: null,
    body: `<div class="wrap narrow" style="--accent:${a.accent}">
<section class="app-head"><div>
<h1>${esc(a.name)}</h1>
<p class="tagline">${esc(a.tagline)}</p>
<div class="actions">
<a class="btn primary" href="../downloads/${encodeURI(a.rec.zip.path)}" download>Download for Windows <small>(${a.version}, ${a.size} zip)</small></a>
<a class="btn" href="${run}" target="_blank" rel="noopener">Try it in your browser</a>
</div>
<p class="version">Version ${a.version} · <a href="${guide}" target="_blank" rel="noopener">Teacher guide</a></p>
</div></section>
<div class="figure"><img src="../${a.image}" alt="${esc(a.name)}" width="1280" height="760"></div>
${a.about.map((p) => `<p>${esc(p)}</p>`).join('\n')}
<ul class="ticks">${a.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>

<h2>Getting started</h2>
<ol class="steps">
<li>Download the zip, then right-click it and choose <strong>Extract All</strong>. It won't run from inside the zip.</li>
<li>Copy the <strong>${esc(a.folder)}</strong> folder wherever you like: a flash drive, a network drive or your Documents.</li>
<li>Double-click <strong>${esc(a.start)}</strong>. If Windows says the file is blocked, open <strong>Start in browser.html</strong> instead: it's the same app in a browser tab.</li>
</ol>
<p class="note">Made for Windows with Microsoft Edge or Google Chrome. Nothing is installed, no admin rights are needed, and it works without internet. Settings are kept in your browser on that computer only.</p>

<h2>Is my copy the real one?</h2>
<p>Every released file has a fingerprint (its SHA-256 checksum). Change one letter of a file and its fingerprint changes completely. Only copies that match the fingerprints below are ours; anything else isn't the file we released, so please download a fresh copy from here.</p>
<p>The quickest way: drop the zip or the folder on <a href="../check/">Check a copy</a>. Or in PowerShell: <code>Get-FileHash "${esc(a.rec.zip.path)}"</code></p>
<details class="sums" open><summary>The zip</summary>
<p class="hash">${a.rec.zip.sha}<button class="copy" data-copy="${a.rec.zip.sha}">Copy</button><br><span class="muted">${esc(a.rec.zip.path)}</span></p>
</details>
<details class="sums"><summary>Every file inside it (${a.rec.files.length})</summary>
<table class="files">${rows}</table>
<p><a href="../downloads/${encodeURI(a.record)}-SHA256SUMS.txt">The full list as a text file</a></p>
</details>

<h2>Open code</h2>
<p>${esc(a.name)} is plain HTML and JavaScript: open the <strong>System</strong> folder and every line is there to read. Nothing is compiled or hidden, and it makes no calls to the internet. You're welcome to have your IT team look it over.</p>
</div>`, script: 'copy.js' }));
}

// ---------- check a copy ----------

write('check/index.html', page({ depth: 1, current: 'check/', title: 'Check a copy · Lennon Apps', description: 'Check that a copy of a Lennon Apps app is exactly the one released.',
  body: `<div class="wrap narrow">
<section class="hero" style="padding-bottom:0">
<h1>Check a copy</h1>
<p class="lead">Drop a zip, an app folder or any file from one, and this page tells you whether it is exactly what we released.</p>
<p class="muted">Your browser works out each file's fingerprint on your own computer and compares it with the published list. Nothing is uploaded.</p>
</section>
<div class="drop" id="drop">
<h3>Drop it here</h3>
<p>A downloaded zip, a whole app folder, or single files</p>
<div class="pick">
<label class="btn primary">Choose a zip or files<input type="file" id="files" multiple></label>
<label class="btn">Choose a folder<input type="file" id="folder" webkitdirectory multiple></label>
</div>
</div>
<div id="out" aria-live="polite"></div>
<h2>Prefer to check it yourself?</h2>
<p>In PowerShell: <code>Get-FileHash "the file"</code>. In Command Prompt: <code>certutil -hashfile "the file" SHA256</code>. Then compare the result with the list on the app's page.</p>
</div>`, script: ['sums.js', 'check.js'] }));

// ---------- terms and privacy ----------

write('terms/index.html', page({ depth: 1, current: 'terms/', title: 'Terms and privacy · Lennon Apps', description: 'How the apps may be used, what we promise, and what this site collects (nothing).',
  body: `<div class="wrap narrow">
<section class="hero" style="padding-bottom:0"><h1>Terms and privacy</h1>
<p class="lead">Short and plain, because the apps are.</p></section>

<h2>Using the apps</h2>
<p>The apps are free to use in classrooms and for education. Please keep the credit: the About box and CREDITS.txt in each app say who made it. We are not a company and we don't sell anything.</p>

<h2>No warranty</h2>
<p>The apps are provided as they are, without any warranty. We have tried hard to make them reliable, but we can't promise they will suit every purpose or never go wrong, and we aren't responsible for any loss that comes from using them.</p>

<h2>Official copies</h2>
<p>Only copies that match the fingerprints (SHA-256 checksums) published on lennonapps.com are ours. A copy that doesn't match has been changed by someone else, and we can't vouch for it. You can <a href="../check/">check a copy here</a>.</p>

<h2>Open code</h2>
<p>Each app is plain HTML and JavaScript that anyone can open and read. We encourage schools and IT teams to look before they use them.</p>

<h2>Privacy: the apps</h2>
<p>The apps run entirely on your computer. They have no accounts, no sign-ins, no analytics and no tracking, and they don't send anything over the internet. Settings you save stay in your browser on that computer.</p>

<h2>Privacy: this website</h2>
<p>This site has no cookies, no analytics, no advertising and no forms. It loads nothing from other websites. Check a copy works out fingerprints inside your browser; your files are never uploaded.</p>
<p>The site is hosted by GitHub Pages. Like any web host, GitHub may keep ordinary server logs, such as IP addresses, for security; see GitHub's privacy statement. We don't receive or look at them.</p>

<h2>Questions</h2>
<p>Email <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
</div>` }));

// ---------- 404, the fingerprints, the domain ----------

write('404.html', page({ depth: 0, title: 'Not found · Lennon Apps', description: 'Page not found.', current: null,
  body: `<div class="wrap narrow"><section class="hero"><h1>That page isn't here</h1><p class="lead"><a href="/">Back to the apps</a></p></section></div>` }).replace(/href="(?!\/|https?:|mailto:|#)/g, 'href="/').replace(/src="(?!\/|https?:)/g, 'src="/'));
// sums.json for anyone who wants the list as data; sums.js is the same list as a script, so Check a copy also works from
// a page opened straight from disk, where a browser won't fetch a file
const sums = { about: 'Every fingerprint published on lennonapps.com, for Check a copy. Built by _tools/build.js from the release records.',
  apps: live.map((a) => ({ id: a.id, name: a.name, version: a.version, folder: a.folder, page: a.id + '/', zip: a.rec.zip, files: a.rec.files })) };
write('sums.json', JSON.stringify(sums, null, 1) + '\n');
write('sums.js', 'window.LENNON_SUMS = ' + JSON.stringify(sums) + ';\n');
write('CNAME', 'lennonapps.com\n');
write('img/icon.svg', LOGO.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ') + '\n');
console.log('Built ' + (live.length + 4) + ' pages for ' + live.map((a) => a.name + ' ' + a.version).join(', ') + '.');
