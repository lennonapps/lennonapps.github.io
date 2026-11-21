/* Lemon Timer. Made by Benjamin Lennon (lennonapps@outlook.com), author and project lead, with Hillary Lennon. */
/* Sound effects made with WebAudio (no files). Started on the first click, as browsers require. */
(function (root) {
  'use strict';
  var LT = root.LT = root.LT || {};
  var ctx = null, master = null, noiseBuf = null, muted = false, chalkSrc = null, chalkGain = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(type, f0, f1, dur, peak, delay) {
    if (!ctx) return;
    var t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.01, peak, dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(freq, q, dur, peak, delay) {
    if (!ctx) return;
    var t = ctx.currentTime + (delay || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    env(g, t, 0.005, peak, dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  var fx = {
    pop: function () { tone('sine', 500, 900, 0.12, 0.25); },
    chomp: function () { noise(900, 1.2, 0.09, 0.5); noise(700, 1.2, 0.09, 0.45, 0.13); tone('square', 140, 90, 0.08, 0.06, 0.02); },
    sour: function () { tone('triangle', 620, 260, 0.45, 0.18); tone('sine', 30, 24, 0.5, 0.0001); for (var i = 0; i < 6; i++) tone('sine', 880 + (i % 2) * 60, null, 0.05, 0.05, i * 0.06); },
    scurry: function () { for (var i = 0; i < 7; i++) noise(2400, 3, 0.04, 0.22, i * 0.09); },
    sip: function () { noise(1800, 6, 0.35, 0.12); tone('sine', 300, 600, 0.25, 0.06, 0.1); },
    tumble: function () { for (var i = 0; i < 10; i++) tone('sine', 300 + Math.random() * 300, null, 0.07, 0.12, i * 0.04); },
    step: function () { tone('sine', 200, 120, 0.08, 0.15); },
    ding: function () { tone('sine', 1320, null, 0.6, 0.18); tone('sine', 1980, null, 0.4, 0.06); },
    finish: function () { [784, 988, 1175, 1568].forEach(function (f, i) { tone('triangle', f, null, 0.5, 0.2, i * 0.14); }); }
  };

  function play(name) { if (!ctx || muted || !fx[name]) return; try { fx[name](); } catch (e) { /* ignore */ } }

  /* chalk scratching: a looping filtered noise, turned up while the chalk touches the board */
  function chalk(down) {
    if (!ctx) return;
    if (!chalkSrc) {
      chalkSrc = ctx.createBufferSource(); chalkSrc.buffer = noiseBuf; chalkSrc.loop = true;
      var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 2.5;
      chalkGain = ctx.createGain(); chalkGain.gain.value = 0;
      chalkSrc.connect(f); f.connect(chalkGain); chalkGain.connect(master); chalkSrc.start();
    }
    chalkGain.gain.setTargetAtTime(down && !muted ? 0.07 : 0, ctx.currentTime, 0.02);
  }

  function setMuted(m) {
    muted = !!m;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.6, ctx.currentTime, 0.02);
    if (muted) chalk(false);
  }

  LT.sound = { init: init, play: play, chalk: chalk, setMuted: setMuted, isMuted: function () { return muted; } };
})(typeof globalThis !== 'undefined' ? globalThis : this);
