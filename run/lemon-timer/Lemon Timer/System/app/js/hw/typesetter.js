/* Lemon Timer. Made by Benjamin Lennon (lennonapps@outlook.com), author and project lead, with Hillary Lennon. */
/*
 * Typesetter: text -> pen strokes in millimetres, relative to a row baseline (x right, y UP).
 *
 * Zone mapping: the library's measured pen-centre lines (baseline, x-height, ascender, descender)
 * are mapped piecewise-linearly onto the requested guide heights, so the pen path always meets
 * the printed guide lines. The mapping is done in a de-slanted frame and the slant re-applied,
 * which keeps sloped stems straight across zone boundaries.
 */
(function (root) {
  'use strict';
  var HW = root.HW = root.HW || {};

  function makeMapping(lib, guide) {
    var m = lib.pen_metrics;
    var b = m.baseline, xh = m.x_height, asc = m.ascender, desc = m.descender;
    var A = guide.ascender_height_mm, X = guide.x_height_mm, D = guide.descender_depth_mm;
    var slant = guide.slant_degrees === null || guide.slant_degrees === undefined ? lib.slant_degrees : guide.slant_degrees;
    var t = Math.tan(slant * Math.PI / 180);
    var sx = X / (xh - b);
    var upper = (A - X) / (asc - xh);
    var lower = D > 0 ? D / (b - desc) : sx;
    function mapY(y) {
      if (y >= xh) return X + (y - xh) * upper;
      if (y >= b) return (y - b) * sx;
      return (y - b) * lower;
    }
    return {
      sx: sx,
      tan: t,
      slant: slant,
      mapY: mapY,
      map: function (x, y) {
        var Y = mapY(y);
        return [(x - (y - b) * t) * sx + Y * t, Y];
      }
    };
  }

  var wordCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  function shapeWord(lib, word) {
    var cache = null;
    if (wordCache) {
      cache = wordCache.get(lib);
      if (!cache) { cache = Object.create(null); wordCache.set(lib, cache); }
      if (cache[word]) return cache[word];
    }
    var res = HW.shaper.shape(lib, word);
    if (cache) cache[word] = res;
    return res;
  }

  var kernPrepared = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  /* GPOS pair kerning, applied like a shaping engine: per lookup, the first subtable that
     covers the pair supplies the value; lookups add up. */
  function kern(lib, left, right) {
    if (!left || !right || !lib.kern || !lib.kern.length) return 0;
    var lookups = kernPrepared && kernPrepared.get(lib);
    if (!lookups) {
      lookups = lib.kern.map(function (subs) {
        return subs.map(function (st) {
          if (st.f !== 2) return st;
          var cov = Object.create(null);
          st.cov.forEach(function (g) { cov[g] = true; });
          return { f: 2, covSet: cov, c1: st.c1, c2: st.c2, v: st.v };
        });
      });
      if (kernPrepared) kernPrepared.set(lib, lookups);
    }
    var total = 0;
    for (var i = 0; i < lookups.length; i++) {
      var subs = lookups[i];
      for (var j = 0; j < subs.length; j++) {
        var st = subs[j];
        if (st.f === 1) {
          var row = st.pairs[left];
          if (row && Object.prototype.hasOwnProperty.call(row, right)) { total += row[right]; break; }
        } else if (st.covSet[left]) {
          var r = st.v[st.c1[left] || 0];
          total += (r && r[st.c2[right] || 0]) || 0;
          break;
        }
      }
    }
    return total;
  }

  /* Split text into words and the spaces between them (spaces kept so they can be measured). */
  function tokenize(text) {
    var out = [];
    var re = /(\s+)|([^\s]+)/g, m;
    while ((m = re.exec(text)) !== null) out.push({ text: m[0], space: !!m[1] });
    return out;
  }

  var joinCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var LETTER = /[A-Za-zÀ-ɏ]/;

  /*
   * Join repair for joined scripts.
   *  - shift: the source font occasionally places a joining variant too far right, so a letter's
   *    exit stroke stops short of the next letter (e.g. "riders": the e's exit never reaches the r
   *    that is shaped to join an s). Those pairs were found from the font's own ink at build time
   *    (tools/extract/joins.py) and are listed in lib.join_fixes; the next letter moves left.
   *  - bridge: a centreline exit can end a fraction of a stroke width short of the next letter even
   *    where the ink overlaps; a small gap (0.3 to 1.6 stroke widths, straight ahead, at joining
   *    height) is bridged by extending the exit stroke.
   * Letters designed not to join (after g, j, q, y) have no rightward exit at joining height and
   * are left alone. Returns { shift, bridge, exit } in font units; bridge is in next-glyph units.
   */
  function joinRepair(lib, prevName, nextName, offset) {
    var cache = null, key = prevName + '|' + nextName + '|' + offset;
    if (joinCache) {
      cache = joinCache.get(lib);
      if (!cache) { cache = Object.create(null); joinCache.set(lib, cache); }
      if (cache[key]) return cache[key];
    }
    var fix = lib.join_fixes && lib.join_fixes[prevName + '|' + nextName];
    var res = { shift: fix ? -fix : 0, bridge: null, exit: null };
    var w = lib.stem_width, xh = lib.pen_metrics.x_height - lib.pen_metrics.baseline;
    var lo = lib.pen_metrics.baseline - 0.25 * xh, hi = lib.pen_metrics.x_height + 0.35 * xh;
    var A = lib.glyphs[prevName].strokes, B = lib.glyphs[nextName].strokes;
    var exit = null, tan = null;
    A.forEach(function (st) {
      if (st.c || st.p.length < 4) return;
      var pts = [];
      for (var i = 0; i < st.p.length; i += 2) pts.push([st.p[i], st.p[i + 1]]);
      [pts, pts.slice().reverse()].forEach(function (run) {     // each end, walking inwards
        var e = run[run.length - 1];
        if (e[1] < lo || e[1] > hi) return;                       // joins happen at joining height
        if (exit && e[0] <= exit[0]) return;
        // direction over the last two stroke widths, so a tiny curl at the very end is ignored
        var back = e, walked = 0;
        for (var k = run.length - 2; k >= 0 && walked < 2 * w; k--) {
          walked += HW.geom.dist(run[k], run[k + 1]);
          back = run[k];
        }
        var dx = e[0] - back[0], dy = e[1] - back[1], L = Math.hypot(dx, dy) || 1;
        exit = [e[0], e[1]];
        tan = [dx / L, dy / L];
      });
    });
    if (exit && tan[0] > 0.35) {
      // after any shift, bridge a small remaining gap to the nearest ink ahead of the exit
      var ey = exit[1], ex = exit[0] - offset;   // exit end in next-glyph coordinates
      var e2 = [ex - res.shift, ey], best = null;
      B.forEach(function (st) {
        var pts = [];
        for (var i = 0; i < st.p.length; i += 2) pts.push([st.p[i], st.p[i + 1]]);
        if (st.c) pts.push(pts[0]);
        for (var k = 1; k < pts.length; k++) {
          var a = pts[k - 1], b = pts[k], abx = b[0] - a[0], aby = b[1] - a[1];
          var L2 = abx * abx + aby * aby, u = L2 ? Math.max(0, Math.min(1, ((e2[0] - a[0]) * abx + (e2[1] - a[1]) * aby) / L2)) : 0;
          var p = [a[0] + u * abx, a[1] + u * aby], d = Math.hypot(p[0] - e2[0], p[1] - e2[1]);
          if (!best || d < best.d) best = { d: d, p: p };
        }
      });
      if (best && best.d > 0.3 * w && best.d < 1.6 * w && Math.abs(best.p[1] - ey) < 0.35 * xh) {
        var cos = ((best.p[0] - e2[0]) * tan[0] + (best.p[1] - e2[1]) * tan[1]) / best.d;
        if (cos > 0.3) res.bridge = best.p;
      }
      res.exit = exit;
    }
    if (cache) cache[key] = res;
    return res;
  }

  /*
   * Lay out one line of text. Returns positioned strokes and dots in mm (y up from baseline),
   * the total advance width, missing characters and placeholder boxes for them.
   */
  function setLine(lib, text, guide) {
    var map = makeMapping(lib, guide);
    var strokesU = [];     // font-unit strokes (after translation), merged across joins
    var dotsU = [];
    var placeholders = [];
    var missing = [];
    var penX = 0;
    var prev = null;
    var tokens = tokenize(text);
    var joinTol = lib.stem_width * 0.45;
    var spaceAdv = lib.glyphs[lib.cmap[' ']].adv;

    var spaceName = lib.cmap[' '];
    tokens.forEach(function (tok) {
      if (tok.space) {
        Array.from(tok.text).forEach(function () {
          penX += kern(lib, prev, spaceName) + spaceAdv;
          prev = spaceName;
        });
        return;
      }
      var shaped = shapeWord(lib, tok.text);
      var wordStrokes = [];
      var prevG = null, prevX = 0;
      shaped.glyphs.forEach(function (g, gi) {
        if (!g.name) {
          if (missing.indexOf(g.char) < 0) missing.push(g.char);
          var w = (lib.pen_metrics.x_height - lib.pen_metrics.baseline) * 0.7;
          placeholders.push({ x0: penX, x1: penX + w, char: g.char });
          penX += w + lib.stem_width * 2;
          prev = null;
          prevG = null;
          return;
        }
        penX += kern(lib, prev, g.name);
        if (lib.joined && prevG && LETTER.test(prevG.char) && LETTER.test(g.char)) {
          var repair = joinRepair(lib, prevG.name, g.name, penX - prevX);
          penX += repair.shift;
          if (repair.bridge) {
            extendExit(wordStrokes, [prevX + repair.exit[0], repair.exit[1]], [penX + repair.bridge[0], repair.bridge[1]]);
          }
        }
        prevG = g;
        prevX = penX;
        var rec = lib.glyphs[g.name];
        rec.strokes.forEach(function (st) {
          var pts = [];
          for (var i = 0; i < st.p.length; i += 2) pts.push([st.p[i] + penX, st.p[i + 1]]);
          var s = { points: pts, closed: !!st.c, glyphIndex: gi };
          if (!s.closed && gi > 0 && mergeInto(wordStrokes, s, gi, joinTol)) return;
          wordStrokes.push(s);
        });
        if (!g.dotless) rec.dots.forEach(function (d) { dotsU.push([d[0] + penX, d[1]]); });
        if (g.marks) addMarks(lib, g, penX, wordStrokes, dotsU);
        penX += rec.adv;
        prev = g.name;
      });
      strokesU.push.apply(strokesU, wordStrokes);
    });

    var q = HW.geom.q;
    return {
      width: penX * map.sx,
      mapping: map,
      strokes: strokesU.map(function (s) {
        return {
          closed: s.closed,
          points: s.points.map(function (p) { var r = map.map(p[0], p[1]); return [q(r[0]), q(r[1])]; })
        };
      }),
      dots: dotsU.map(function (p) { var r = map.map(p[0], p[1]); return [q(r[0]), q(r[1])]; }),
      placeholders: placeholders.map(function (ph) {
        return { x0: q(ph.x0 * map.sx), x1: q(ph.x1 * map.sx), char: ph.char };
      }),
      missing: missing
    };
  }

  /* Accents of a decomposed letter, placed as in the font's composite and shifted with the
     letter body when the joining variant moved it. */
  function addMarks(lib, g, penX, strokes, dots) {
    var rec = lib.glyphs[g.name];
    var shift = rec.tc !== undefined && g.baseTc !== undefined ? rec.tc - g.baseTc : 0;
    g.marks.forEach(function (m) {
      var mark = lib.glyphs[m[0]];
      if (!mark) return;
      var dx = penX + m[1] + shift, dy = m[2];
      mark.strokes.forEach(function (st) {
        var pts = [];
        for (var i = 0; i < st.p.length; i += 2) pts.push([st.p[i] + dx, st.p[i + 1] + dy]);
        strokes.push({ points: pts, closed: !!st.c, glyphIndex: -1 });
      });
      mark.dots.forEach(function (d) { dots.push([d[0] + dx, d[1] + dy]); });
    });
  }

  /* Extend the stroke that ends at `end` (a letter's exit) to `to` (ink of the next letter). */
  function extendExit(list, end, to) {
    for (var k = list.length - 1; k >= 0; k--) {
      var p = list[k].points;
      if (list[k].closed) continue;
      if (HW.geom.dist(p[p.length - 1], end) < 2) { p.push(to); return; }
      if (HW.geom.dist(p[0], end) < 2) { p.unshift(to); return; }
    }
  }

  /* Join a stroke of glyph gi onto an open stroke of the previous glyph if their ends meet. */
  function mergeInto(list, s, gi, tol) {
    var d = HW.geom.dist;
    var a = s.points[0], z = s.points[s.points.length - 1];
    for (var k = list.length - 1; k >= 0; k--) {
      var p = list[k];
      if (p.closed || p.glyphIndex !== gi - 1) continue;
      var pa = p.points[0], pz = p.points[p.points.length - 1];
      if (d(pz, a) < tol) {
        p.points = p.points.concat(s.points.slice(1));
      } else if (d(pz, z) < tol) {
        p.points = p.points.concat(s.points.slice().reverse().slice(1));
      } else if (d(pa, z) < tol) {
        p.points = s.points.concat(p.points.slice(1));
      } else if (d(pa, a) < tol) {
        p.points = s.points.slice().reverse().concat(p.points.slice(1));
      } else {
        continue;
      }
      p.glyphIndex = gi;
      return true;
    }
    return false;
  }

  /* Advance width of a piece of text in mm (used for wrapping). */
  function measure(lib, text, guide) {
    var map = makeMapping(lib, guide);
    var spaceName = lib.cmap[' '];
    var spaceAdv = lib.glyphs[spaceName].adv;
    var w = 0, prev = null;
    tokenize(text).forEach(function (tok) {
      if (tok.space) {
        Array.from(tok.text).forEach(function () { w += kern(lib, prev, spaceName) + spaceAdv; prev = spaceName; });
        return;
      }
      var prevG = null, prevX = 0;
      shapeWord(lib, tok.text).glyphs.forEach(function (g) {
        if (!g.name) { w += (lib.pen_metrics.x_height - lib.pen_metrics.baseline) * 0.7 + lib.stem_width * 2; prev = null; prevG = null; return; }
        w += kern(lib, prev, g.name);
        if (lib.joined && prevG && LETTER.test(prevG.char) && LETTER.test(g.char)) w += joinRepair(lib, prevG.name, g.name, w - prevX).shift;
        prevG = g;
        prevX = w;
        w += lib.glyphs[g.name].adv;
        prev = g.name;
      });
    });
    return w * map.sx;
  }

  HW.typeset = {
    makeMapping: makeMapping,
    setLine: setLine,
    measure: measure,
    tokenize: tokenize,
    kern: kern,
    joinRepair: joinRepair
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
