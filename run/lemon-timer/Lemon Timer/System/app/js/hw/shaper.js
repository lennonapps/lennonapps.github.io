/* Lemon Timer. Made by Benjamin Lennon (lennonapps@outlook.com), author and project lead, with Hillary Lennon. */
/*
 * Minimal OpenType contextual-alternates shaper.
 * Applies the stroke library's exported 'calt' lookups (single substitution and chained context
 * format 3) to pick each letter's joining variant, exactly as the source font does.
 */
(function (root) {
  'use strict';
  var HW = root.HW = root.HW || {};

  var prepared = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  function prepare(lib) {
    if (prepared && prepared.has(lib)) return prepared.get(lib);
    var lookups = {};
    Object.keys(lib.calt.lookups).forEach(function (key) {
      var lk = lib.calt.lookups[key];
      lookups[key] = lk.subtables.map(function (st) {
        if (st.type === 'single') return { type: 'single', map: st.map };
        return {
          type: 'chain',
          back: st.back.map(toSet),
          input: st.input.map(toSet),
          ahead: st.ahead.map(toSet),
          apply: st.apply
        };
      });
    });
    var p = { order: lib.calt.lookups_in_order, lookups: lookups };
    if (prepared) prepared.set(lib, p);
    return p;
  }

  function toSet(list) {
    var s = Object.create(null);
    for (var i = 0; i < list.length; i++) s[list[i]] = true;
    return s;
  }

  function applySingleAt(subtables, buf, i) {
    for (var t = 0; t < subtables.length; t++) {
      var st = subtables[t];
      if (st.type === 'single' && Object.prototype.hasOwnProperty.call(st.map, buf[i])) {
        buf[i] = st.map[buf[i]];
        return true;
      }
    }
    return false;
  }

  function matchChain(st, buf, i) {
    var k;
    for (k = 0; k < st.input.length; k++) {
      if (i + k >= buf.length || !st.input[k][buf[i + k]]) return false;
    }
    for (k = 0; k < st.back.length; k++) {
      var b = i - 1 - k;
      if (b < 0 || !st.back[k][buf[b]]) return false;
    }
    for (k = 0; k < st.ahead.length; k++) {
      var a = i + st.input.length + k;
      if (a >= buf.length || !st.ahead[k][buf[a]]) return false;
    }
    return true;
  }

  function applyLookup(p, key, buf) {
    var subtables = p.lookups[key];
    var i = 0;
    while (i < buf.length) {
      var advance = 1;
      for (var t = 0; t < subtables.length; t++) {
        var st = subtables[t];
        if (st.type === 'single') {
          if (applySingleAt([st], buf, i)) break;
          continue;
        }
        if (matchChain(st, buf, i)) {
          for (var r = 0; r < st.apply.length; r++) {
            applySingleAt(p.lookups[String(st.apply[r][1])], buf, i + st.apply[r][0]);
          }
          advance = st.input.length;
          break;
        }
      }
      i += advance;
    }
  }

  var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

  /*
   * Shape a run of text. Returns { glyphs: [{ name, char, marks?, baseTc? }], missing: [chars] }.
   * Accented letters are shaped as their base letter (so joins continue through them) and carry
   * their accent glyphs in `marks`. Characters not in the library keep name null so the caller
   * can warn visibly.
   */
  function shape(lib, text) {
    var p = prepare(lib);
    var chars = Array.from(text.normalize ? text.normalize('NFC') : text);
    var decomp = lib.decompose || {};
    var buf = chars.map(function (ch) {
      if (has(decomp, ch)) return lib.cmap[decomp[ch].base];
      return has(lib.cmap, ch) ? lib.cmap[ch] : '.missing';
    });
    for (var k = 0; k < p.order.length; k++) applyLookup(p, String(p.order[k]), buf);
    var missing = [];
    var glyphs = chars.map(function (ch, i) {
      if (buf[i] === '.missing') {
        if (missing.indexOf(ch) < 0) missing.push(ch);
        return { name: null, char: ch };
      }
      var g = { name: buf[i], char: ch };
      if (has(decomp, ch)) {
        g.marks = decomp[ch].marks;
        g.baseTc = decomp[ch].tc;
        if (decomp[ch].dotless) g.dotless = true;
      }
      return g;
    });
    return { glyphs: glyphs, missing: missing };
  }

  HW.shaper = { shape: shape };
})(typeof globalThis !== 'undefined' ? globalThis : this);
