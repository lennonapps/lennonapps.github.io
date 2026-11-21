/* Lemon Timer. Made by Benjamin Lennon (lennonapps@outlook.com), author and project lead, with Hillary Lennon. */
/* Lemon Timer: settings, the clock, controls and the animation loop. */
(function (root) {
  'use strict';
  var LT = root.LT, SC = LT.scene, TL = LT.timeline, SND = LT.sound, C = LT.character;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'lemonTimer.v1';

  // ---------- settings (browser storage only; the app works without it) ----------
  var settings = {
    teacher: JSON.parse(JSON.stringify(C.DEFAULT_TEACHER)),
    message: 'Time is up!\nPack up please.', hours: 0, minutes: 10,
    showCount: true, muted: false, presets: []
  };
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && typeof s === 'object') Object.keys(settings).forEach(function (k) { if (s[k] !== undefined) settings[k] = s[k]; });
    } catch (e) { /* private window or blocked storage */ }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ } }

  // ---------- test hooks: index.html#test=minute&M=12&m=1&t=12  |  #test=end&e=6 ----------
  var params = {};
  location.hash.replace(/^#/, '').split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) params[p[0]] = decodeURIComponent(p[1] || ''); });
  var speed = +params.speed || 1;

  // ---------- run state ----------
  var run = { phase: 'idle', M: 10, acc: 0, since: 0, eAcc: 0, eSince: 0, E: null, lastM: -1, lastT: 0, lastE: 0 };
  var now = function () { return performance.now(); };

  function totalMinutes() {
    var h = Math.max(0, Math.min(3, parseInt($('hrs').value, 10) || 0)), m = Math.max(0, Math.min(59, parseInt($('mins').value, 10) || 0));
    return Math.max(1, h * 60 + m);
  }
  function elapsedMs() { return run.acc + (run.phase === 'running' ? (now() - run.since) * speed : 0); }
  function endSecs() { return run.eAcc + ((run.phase === 'ending' || run.phase === 'done') ? (now() - run.eSince) / 1000 * Math.min(speed, 4) : 0); }

  function start() {
    SND.init();
    if (run.phase === 'idle' || run.phase === 'done') {
      if (run.phase === 'done') resetRun();
      run.M = totalMinutes(); run.acc = 0; run.lastM = -1; run.lastT = 0;
      settings.message = $('msg').value; save();
    }
    if (run.phase === 'paused') {
      if (run.E) { run.phase = 'ending'; run.eSince = now(); }
      else { run.phase = 'running'; run.since = now(); }
    } else if (run.phase === 'idle') { run.phase = 'running'; run.since = now(); }
    updateButtons();
  }
  function pause() {
    if (run.phase === 'running') { run.acc = elapsedMs(); run.phase = 'paused'; }
    else if (run.phase === 'ending') { run.eAcc = endSecs(); run.phase = 'paused'; SND.chalk(false); }
    updateButtons();
  }
  function resetRun() {
    run.phase = 'idle'; run.acc = 0; run.eAcc = 0; run.E = null; run.lastM = -1;
    SC.clearWriting(); SND.chalk(false);
    updateButtons();
  }
  function addMinute() {
    if (run.phase === 'running' || run.phase === 'paused') {
      if (run.E) return;
      run.M += 1; SND.init(); SND.play('pop');
    } else {
      var m = (parseInt($('mins').value, 10) || 0) + 1, h = parseInt($('hrs').value, 10) || 0;
      if (m > 59) { m = 0; h = Math.min(3, h + 1); }
      $('mins').value = m; $('hrs').value = h; storeTime();
    }
  }
  function beginEnding() {
    run.acc = run.M * 60000;
    var plan = SC.planWriting($('msg').value);
    run.E = TL.planEnding(plan);
    run.phase = 'ending'; run.eAcc = 0; run.eSince = now(); run.lastE = 0;
    SND.play('ding');
    updateButtons();
  }

  function updateButtons() {
    var ph = run.phase;
    $('start').textContent = ph === 'running' || ph === 'ending' ? 'Pause' : ph === 'paused' ? 'Resume' : ph === 'done' ? 'Again' : 'Start';
    $('plus').disabled = !!run.E;
    $('hrs').disabled = $('mins').disabled = ph !== 'idle';
    $('presets').disabled = ph !== 'idle';
  }

  // ---------- frame ----------
  function fmt(s) {
    s = Math.max(0, Math.ceil(s));
    var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(sec).padStart(2, '0');
  }

  function fireMinuteEvents(m, t) {
    if (m !== run.lastM) { run.lastT = -0.01; run.lastM = m; }
    TL.minuteEvents(run.M, m).forEach(function (ev) { if (ev[0] > run.lastT && ev[0] <= t && t - ev[0] < 0.6) SND.play(ev[1]); });
    run.lastT = t;
  }
  function fireEndEvents(e) {
    var E = run.E, last = run.lastE;
    E.steps.forEach(function (s) { if ((s.kind === 'walk' || s.kind === 'drag' || s.kind === 'exit') && s.a > last && s.a <= e) SND.play('scurry'); if ((s.kind === 'hopUp' || s.kind === 'hopDown') && s.a > last && s.a <= e) SND.play('step'); });
    if (E.done > last && E.done <= e) SND.play('finish');
    run.lastE = e;
  }

  function frame() {
    var pose, remain;
    if (run.phase === 'idle') {
      pose = TL.idlePose(totalMinutes());
      remain = totalMinutes() * 60;
    } else if (!run.E) {
      var ms = elapsedMs();
      if (ms >= run.M * 60000) { beginEnding(); return frame(); }
      var m = Math.floor(ms / 60000), t = (ms - m * 60000) / 1000;
      pose = TL.minutePose(run.M, m, t);
      if (run.phase === 'running') fireMinuteEvents(m, t);
      remain = run.M * 60 - ms / 1000;
    } else {
      var e = endSecs();
      pose = TL.endPose(run.E, e);
      if (run.phase === 'ending') {
        fireEndEvents(e);
        SND.chalk(!!pose.penDown);
        if (pose.finished) { run.phase = 'done'; SND.chalk(false); updateButtons(); showBar(); }
      }
      remain = 0;
    }
    SC.render(pose);
    var c = $('count');
    c.textContent = fmt(remain);
  }

  function loop() { try { frame(); } catch (err) { console.error(err); } requestAnimationFrame(loop); }

  // ---------- bar auto-hide while running ----------
  var hideTimer = null;
  function showBar() {
    $('bar').classList.remove('hide'); document.body.classList.remove('hide-cursor');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      if ((run.phase === 'running' || run.phase === 'ending') && !$('bar').matches(':hover') && !$('bar').contains(document.activeElement)) {
        $('bar').classList.add('hide'); document.body.classList.add('hide-cursor');
      }
    }, 3000);
  }

  // ---------- presets ----------
  function presetLabel(p) {
    var first = String(p.message).split('\n')[0];
    var mins = p.hours * 60 + p.minutes;
    return (first.length > 22 ? first.slice(0, 21) + '…' : first) + ' · ' + mins + ' min';
  }
  function fillPresets() {
    $('presets').innerHTML = '<option value="">Saved timers…</option>' + settings.presets.map(function (p, i) { return '<option value="' + i + '">' + presetLabel(p).replace(/</g, '&lt;') + '</option>'; }).join('');
  }
  function storeTime() { settings.hours = parseInt($('hrs').value, 10) || 0; settings.minutes = parseInt($('mins').value, 10) || 0; save(); }

  // ---------- wiring ----------
  function wire() {
    $('msg').value = settings.message;
    $('hrs').value = settings.hours; $('mins').value = settings.minutes;
    $('msg').addEventListener('input', function () { settings.message = this.value; save(); });
    ['hrs', 'mins'].forEach(function (id) { $(id).addEventListener('input', storeTime); });
    $('start').onclick = function () { if (run.phase === 'running' || run.phase === 'ending') pause(); else start(); showBar(); };
    $('reset').onclick = function () { resetRun(); showBar(); };
    $('plus').onclick = function () { addMinute(); showBar(); };
    $('presets').onchange = function () {
      var p = settings.presets[this.value];
      if (p) { $('msg').value = settings.message = p.message; $('hrs').value = p.hours; $('mins').value = p.minutes; storeTime(); }
    };
    $('savePreset').onclick = function () {
      settings.presets.push({ message: $('msg').value, hours: parseInt($('hrs').value, 10) || 0, minutes: parseInt($('mins').value, 10) || 0 });
      save(); fillPresets(); $('presets').value = String(settings.presets.length - 1);
    };
    $('delPreset').onclick = function () {
      var i = $('presets').value; if (i === '') return;
      settings.presets.splice(+i, 1); save(); fillPresets();
    };
    $('teacherBtn').onclick = function () {
      LT.chooser.open(settings.teacher, function (t) { settings.teacher = t; save(); SC.setTeacher(t); });
    };
    $('countBtn').onclick = function () { settings.showCount = !settings.showCount; save(); applyToggles(); };
    $('soundBtn').onclick = function () { settings.muted = !settings.muted; save(); SND.init(); applyToggles(); };
    // In a Canvas page (a frame) the browser never allows full screen, so the button opens the timer in its own tab
    // instead, set up with this message and time; full screen works there. Elsewhere it is the usual Full screen.
    var canFull = !!(document.fullscreenEnabled && document.documentElement.requestFullscreen);
    if (!canFull) { $('fullBtn').textContent = 'Pop out'; $('fullBtn').title = 'Open in its own tab, where full screen works'; }
    $('aboutBtn').onclick = function () {
      AppCredit.about({ app: 'Lemon Timer', version: LT.VERSION, notices: [{ what: 'The cursive writing on the board', who: 'pen paths derived from the font Edu NSW ACT Cursive, copyright 2023 The NSW ACT School Hand Australia Project Authors', licence: 'SIL Open Font License 1.1', file: 'licenses/NOTICE.txt and licenses/OFL.txt' }] });
    };
    $('fullBtn').onclick = function () {
      if (!canFull) {
        settings.message = $('msg').value; storeTime(); save();
        var setup = 'pop=1&msg=' + encodeURIComponent($('msg').value) + '&h=' + (parseInt($('hrs').value, 10) || 0) + '&min=' + (parseInt($('mins').value, 10) || 0);
        window.open(location.href.split('#')[0] + '#' + setup, '_blank');
        return;
      }
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    };
    document.addEventListener('mousemove', showBar);
    document.addEventListener('touchstart', showBar);
    document.addEventListener('keydown', function (e) {
      showBar();
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'textarea' || tag === 'input' || tag === 'select' || LT.chooser.isOpen()) return;
      if (e.code === 'Space') { e.preventDefault(); $('start').click(); }
    });
    fillPresets();
    applyToggles();
    updateButtons();
  }
  function applyToggles() {
    $('count').classList.toggle('hidden', !settings.showCount);
    $('countBtn').classList.toggle('on', settings.showCount);
    $('soundBtn').classList.toggle('on', !settings.muted);
    $('soundBtn').textContent = settings.muted ? 'Sound off' : 'Sound';
    SND.setMuted(settings.muted);
  }

  // ---------- go ----------
  load();
  SC.create($('scene'));
  SC.setTeacher(settings.teacher);
  wire();
  document.title = 'Lemon Timer ' + LT.VERSION;

  // opened by Pop out: the message and time it was set up with
  if (params.pop) {
    if (params.msg != null) $('msg').value = settings.message = params.msg;
    if (params.h != null) $('hrs').value = Math.max(0, Math.min(3, parseInt(params.h, 10) || 0));
    if (params.min != null) $('mins').value = Math.max(0, Math.min(59, parseInt(params.min, 10) || 0));
    storeTime(); save();
  }

  if (params.test) {               // fixed moments for screenshots
    $('bar').classList.toggle('hide', params.bar === '0');
    if (params.msg) $('msg').value = params.msg;
    if (params.outfit) { settings.teacher = Object.assign({}, settings.teacher, { outfit: params.outfit }); SC.setTeacher(settings.teacher); }
    if (params.chooser) LT.chooser.open(settings.teacher, function () {});
    if (params.mood) { SC.render(Object.assign(TL.idlePose(+params.M || 12), { mood: params.mood })); }
    if (params.test === 'minute') {
      SC.render(TL.minutePose(+params.M || 12, +params.m || 0, +params.t || 0));
    } else if (params.test === 'end') {
      var E = TL.planEnding(SC.planWriting($('msg').value));
      SC.render(TL.endPose(E, params.e === 'done' ? E.done + 1 : +params.e || 0));
    } else if (params.test === 'sim') {   // step through a whole run and report problems
      var Ms = (params.M || '1,3,12,31,45').split(',').map(Number), report = [];
      Ms.forEach(function (MM) {
        var errs = 0, firstErr = '', bad = 0;
        for (var tt = 0; tt < MM * 60; tt += 0.25) {
          var mm = Math.floor(tt / 60);
          try {
            var ps = TL.minutePose(MM, mm, tt - mm * 60); SC.render(ps);
            if (!isFinite(ps.X) || !isFinite(ps.base) || ps.deskCount < 0 || ps.deskCount > 30) bad++;
          } catch (er) { errs++; firstErr = firstErr || (er.message + ' @' + tt); }
        }
        var EE = TL.planEnding(SC.planWriting($('msg').value)), fin = false;
        for (var ee = 0; ee < EE.done + 2; ee += 1 / 30) {
          try { var pe = TL.endPose(EE, ee); SC.render(pe); fin = pe.finished; if (!isFinite(pe.X)) bad++; }
          catch (er2) { errs++; firstErr = firstErr || (er2.message + ' end@' + ee.toFixed(2)); }
        }
        report.push(MM + 'min: errors ' + errs + ', bad ' + bad + ', finished ' + fin + ', end ' + EE.done.toFixed(1) + 's' + (firstErr ? ' first: ' + firstErr : ''));
      });
      document.body.dataset.sim = report.join(' | ');
    } else if (params.test === 'idle') {
      SC.render(TL.idlePose(+params.M || 12));
    }
    return;
  }
  loop();
  if (params.autostart) { if (params.M) { $('hrs').value = 0; $('mins').value = params.M; } start(); }
})(typeof globalThis !== 'undefined' ? globalThis : this);
