/* Lemon Timer. Made by Benjamin Lennon (lennonapps@outlook.com), author and project lead, with Hillary Lennon. */
/* "Choose your teacher" window: style, hair, outfit, sliders and colours, with a live preview. */
(function (root) {
  'use strict';
  var LT = root.LT = root.LT || {};
  var C = LT.character, n = C.n, LN = C.LN;
  var $ = function (id) { return document.getElementById(id); };

  function bubbleTea(x, y) {
    var top = y - 30;
    return '<g><path d="M' + n(x + 3) + ' ' + n(top - 16) + ' L' + n(x + 9) + ' ' + n(top + 4) + '" stroke="#e0566b" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M' + n(x - 12) + ' ' + top + ' L' + n(x + 12) + ' ' + top + ' L' + n(x + 8) + ' ' + n(y + 6) + ' L' + n(x - 8) + ' ' + n(y + 6) + 'Z" fill="#dcb991"' + LN + '/>' +
      '<circle cx="' + n(x - 4) + '" cy="' + n(y + 1) + '" r="2.4" fill="#2e1c14"/><circle cx="' + n(x + 2) + '" cy="' + n(y + 2) + '" r="2.4" fill="#2e1c14"/><circle cx="' + n(x - 1) + '" cy="' + n(y - 3) + '" r="2.4" fill="#2e1c14"/>' +
      '<path d="M' + n(x - 13) + ' ' + top + ' Q' + x + ' ' + n(top - 12) + ' ' + n(x + 13) + ' ' + top + 'Z" fill="#fff" fill-opacity=".85"' + LN + '/></g>';
  }
  function lemon(x, y) {
    return '<g transform="rotate(-20 ' + x + ' ' + y + ')"><ellipse cx="' + x + '" cy="' + n(y - 6) + '" rx="13" ry="9.5" fill="#f7d916"' + LN + '/>' +
      '<path d="M' + n(x - 13) + ' ' + n(y - 6) + ' l-4 0 M' + n(x + 13) + ' ' + n(y - 6) + ' l4 0" stroke="var(--line)" stroke-width="2.4" stroke-linecap="round"/></g>';
  }

  var work = null, mood = 'happy', onUse = null;

  function clone(t) { return JSON.parse(JSON.stringify(t)); }

  function draw() {
    var prev = $('chprev');
    prev.setAttribute('style', C.cssVars(work));
    prev.innerHTML = '<svg viewBox="0 0 200 300">' + C.preview(work, mood, 'ch', mood === 'sour' ? lemon : bubbleTea) + '</svg>';
    syncControls();
  }

  function syncControls() {
    $('chStyles').querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.s === work.style); });
    $('chHair').value = work.hair; $('chOutfit').value = work.outfit;
    $('chRound').value = work.round; $('chHead').value = work.head; $('chEyes').value = work.eyes;
    $('chMouth').value = work.mouth; $('chExtra').value = work.extra;
    document.querySelectorAll('#ctl .sw').forEach(function (box) {
      box.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === work.colours[box.dataset.c]); });
    });
  }

  function build() {
    var styles = $('chStyles');
    Object.keys(C.STYLES).forEach(function (k) {
      var b = document.createElement('button');
      b.textContent = C.STYLES[k].name; b.dataset.s = k; b.title = C.STYLES[k].note;
      b.onclick = function () { work.style = k; draw(); };
      styles.appendChild(b);
    });
    var fill = function (sel, map) { sel.innerHTML = Object.keys(map).map(function (k) { return '<option value="' + k + '">' + map[k] + '</option>'; }).join(''); };
    fill($('chHair'), C.HAIRS); fill($('chOutfit'), C.OUTFITS);
    $('chHair').onchange = function () { work.hair = this.value; draw(); };
    $('chOutfit').onchange = function () { work.outfit = this.value; draw(); };
    $('chMouth').onchange = function () { work.mouth = this.value; draw(); };
    $('chExtra').onchange = function () { work.extra = this.value; draw(); };
    ['chRound', 'chHead', 'chEyes'].forEach(function (id) {
      $(id).oninput = function () { work[this.dataset.k] = +this.value; draw(); };
    });
    document.querySelectorAll('#ctl .sw').forEach(function (box) {
      C.SWATCHES[box.dataset.c].forEach(function (c) {
        var b = document.createElement('button');
        b.style.background = c; b.title = c; b.dataset.v = c;
        b.onclick = function () { work.colours[box.dataset.c] = c; draw(); };
        box.appendChild(b);
      });
    });
    document.querySelectorAll('#chooser [data-m]').forEach(function (b) {
      b.onclick = function () {
        mood = b.dataset.m;
        document.querySelectorAll('#chooser [data-m]').forEach(function (x) { x.classList.toggle('on', x === b); });
        draw();
      };
    });
    var prev = $('chprev');
    document.querySelector('#chooser [data-act=scurry]').onclick = function () { prev.classList.remove('scurry'); void prev.offsetWidth; prev.classList.add('scurry'); };
    prev.addEventListener('animationend', function (e) { if (e.animationName === 'zip') prev.classList.remove('scurry'); });
    $('chCancel').onclick = close;
    $('chDefault').onclick = function () { work = clone(C.DEFAULT_TEACHER); draw(); };
    $('chUse').onclick = function () { var t = clone(work); close(); if (onUse) onUse(t); };
    $('chooser').addEventListener('click', function (e) { if (e.target.id === 'chooser') close(); });
  }

  function open(current, use) {
    work = clone(current);
    onUse = use;
    $('chooser').hidden = false;
    draw();
  }
  function close() { $('chooser').hidden = true; }

  var built = false;
  LT.chooser = { open: function (t, use) { if (!built) { build(); built = true; } open(t, use); }, close: close, isOpen: function () { return !$('chooser').hidden; } };
})(typeof globalThis !== 'undefined' ? globalThis : this);
