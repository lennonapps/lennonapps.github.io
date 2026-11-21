/* Lemon Timer. Made by Benjamin Lennon (lennonapps@outlook.com), author and project lead, with Hillary Lennon. */
/*
 * The classroom scene (1600 x 900 SVG): wall, chalkboard, desk with lemons, crates of ten,
 * the step stool and the teacher. render(pose) moves everything for one frame; the chalk
 * writing is planned once from the message and revealed stroke by stroke.
 */
(function (root) {
  'use strict';
  var LT = root.LT = root.LT || {};
  var C = LT.character, n = C.n;

  var K = {
    S: 1.8,                // teacher scale
    FLOOR: 860,            // her feet when standing
    SEAT_X: 1235, SEAT_DROP: 70,
    STOOL_H: 120, STOOL_PARK: 1000,
    CRATE_X: 1445, CRATE_W: 140, CRATE_H: 62, CRATES_SHOWN: 5,
    TEA: [1080, 734],
    BOARD: { x: 146, y: 266, w: 838, h: 358 },
    PEN_OFFSET: 88,       // she stands this far right of the chalk
    REST_X: 1090           // where she stands when finished
  };
  K.BOARD_CX = K.BOARD.x + K.BOARD.w / 2;

  function slot(k) { var r = Math.floor(k / 10), i = k % 10; return [1122 + i * 29 + (r % 2) * 14, 717 + r * 8]; }
  K.slot = slot;

  var LINE = '#2a1f1d';
  var BITES = [[15, -5], [16, 6], [6, -12], [-6, -12], [-16, -4], [-14, 7]];

  function staticSvg() {
    var s = '';
    s += '<defs>' +
      '<g id="lemonSym"><ellipse rx="13" ry="9.5" fill="#f7d916" stroke="' + LINE + '" stroke-width="2"/>' +
      '<path d="M-13 0 l-4 0 M13 0 l4 0" stroke="' + LINE + '" stroke-width="2.4" stroke-linecap="round"/>' +
      '<ellipse cx="-4" cy="-3" rx="4" ry="2" fill="#fff" opacity=".6"/></g>' +
      '<g id="crateSym">' +
      '<use href="#lemonSym" x="28" y="-62"/><use href="#lemonSym" x="56" y="-65"/><use href="#lemonSym" x="86" y="-63"/><use href="#lemonSym" x="114" y="-64"/>' +
      '<rect x="0" y="-62" width="140" height="62" rx="4" fill="#c99a5c" stroke="#6e4a22" stroke-width="3"/>' +
      '<path d="M3 -41 H137 M3 -21 H137" stroke="#6e4a22" stroke-width="2" opacity=".45"/>' +
      '<rect x="30" y="-49" width="80" height="34" rx="6" fill="#fffaf0" stroke="#6e4a22" stroke-width="2"/>' +
      '<text x="58" y="-25" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#3a2a1a" text-anchor="middle">10 ×</text>' +
      '<use href="#lemonSym" transform="translate(92 -32) scale(.7)"/></g>' +
      '<g id="teaSym"><path d="M3 -62 L10 -36" stroke="#e0566b" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M-17 -42 L17 -42 L12 0 L-12 0Z" fill="#dcb991" stroke="' + LINE + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<circle cx="-5" cy="-6" r="3.2" fill="#2e1c14"/><circle cx="3" cy="-5" r="3.2" fill="#2e1c14"/><circle cx="-1" cy="-12" r="3.2" fill="#2e1c14"/><circle cx="7" cy="-11" r="3.2" fill="#2e1c14"/><circle cx="-7" cy="-14" r="3.2" fill="#2e1c14"/>' +
      '<path d="M-18 -42 Q0 -58 18 -42Z" fill="#fff" fill-opacity=".85" stroke="' + LINE + '" stroke-width="2.4" stroke-linejoin="round"/></g>' +
      '<mask id="biteMask" maskUnits="userSpaceOnUse" x="-40" y="-40" width="80" height="80"><rect x="-40" y="-40" width="80" height="80" fill="#fff"/><g id="biteHoles"></g></mask>' +
      '</defs>';
    // wall and floor
    s += '<rect x="-2000" y="-2000" width="5600" height="2700" fill="#f2e8d5"/>';
    s += '<rect x="-2000" y="700" width="5600" height="2000" fill="#d6b68a"/>';
    for (var i = 0; i < 6; i++) s += '<path d="M-2000 ' + (730 + i * 32 + i * i * 3) + ' H3600" stroke="#000" stroke-opacity=".05" stroke-width="2"/>';
    s += '<rect x="-2000" y="688" width="5600" height="14" fill="#c19a6b"/>';
    // poster above the desk: a happy lemon
    s += '<g transform="translate(1250 330)"><rect x="-70" y="-90" width="140" height="170" rx="6" fill="#fffaf0" stroke="#d9c9a8" stroke-width="3" transform="rotate(2)"/>' +
      '<circle cx="0" cy="-90" r="5" fill="#d94a4a" transform="rotate(2)"/>' +
      '<g transform="rotate(-8) scale(3.4)"><use href="#lemonSym"/></g>' +
      '<circle cx="-12" cy="-2" r="3.2" fill="' + LINE + '"/><circle cx="12" cy="-4" r="3.2" fill="' + LINE + '"/>' +
      '<path d="M-10 10 Q2 18 12 8" fill="none" stroke="' + LINE + '" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M-30 52 h60" stroke="#e0b400" stroke-width="5" stroke-linecap="round"/></g>';
    // chalkboard
    var B = K.BOARD;
    s += '<rect x="' + (B.x - 16) + '" y="' + (B.y - 16) + '" width="' + (B.w + 32) + '" height="' + (B.h + 32) + '" rx="10" fill="#a8763e" stroke="#7a5328" stroke-width="3"/>';
    s += '<rect x="' + B.x + '" y="' + B.y + '" width="' + B.w + '" height="' + B.h + '" fill="#2f4f3e"/>';
    s += '<ellipse cx="330" cy="360" rx="120" ry="40" fill="#fff" opacity=".035"/><ellipse cx="760" cy="520" rx="160" ry="50" fill="#fff" opacity=".03"/>';
    s += '<rect x="' + (B.x - 8) + '" y="' + (B.y + B.h + 8) + '" width="' + (B.w + 16) + '" height="14" rx="3" fill="#8e6232"/>';
    s += '<rect x="800" y="' + (B.y + B.h - 2) + '" width="56" height="12" rx="2" fill="#3d3d3d"/><rect x="800" y="' + (B.y + B.h + 6) + '" width="56" height="4" fill="#d8d0c0"/>';
    s += '<rect x="890" y="' + (B.y + B.h + 2) + '" width="26" height="6" rx="3" fill="#f4f1e8"/><rect x="922" y="' + (B.y + B.h + 2) + '" width="22" height="6" rx="3" fill="#f2df6b"/>';
    s += '<g id="chalk"></g>';
    s += '<g id="stool"><path d="M-40 0 L-30 -100 M40 0 L30 -100" stroke="#7a5328" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M-36 -45 H36" stroke="#7a5328" stroke-width="7" stroke-linecap="round"/>' +
      '<rect x="-46" y="-' + K.STOOL_H + '" width="92" height="14" rx="4" fill="#c08a52" stroke="#6e4a22" stroke-width="2.5"/></g>';
    s += '<ellipse id="shadow" cx="0" cy="' + K.FLOOR + '" rx="44" ry="8" fill="#000" opacity=".13"/>';
    // chair back (behind her)
    s += '<rect x="' + (K.SEAT_X - 62) + '" y="600" width="124" height="130" rx="18" fill="#56607a" stroke="#353c4f" stroke-width="3"/>';
    s += '<g id="tch"><g id="tchBody"></g>' +
      '<path id="armLo" fill="none" stroke="var(--line)" stroke-width="17" stroke-linecap="round"/>' +
      '<path id="armLf" fill="none" stroke-width="12" stroke-linecap="round"/>' +
      '<circle id="handL" class="skin" r="7.5" stroke="var(--line)" stroke-width="2"/>' +
      '<path id="armRo" fill="none" stroke="var(--line)" stroke-width="17" stroke-linecap="round"/>' +
      '<path id="armRf" fill="none" stroke-width="12" stroke-linecap="round"/>' +
      '<circle id="handR" class="skin" r="7.5" stroke="var(--line)" stroke-width="2"/></g>';
    // desk
    s += '<path d="M1040 712 L1430 712 L1442 744 L1028 744Z" fill="#d39b60" stroke="#7a5328" stroke-width="3" stroke-linejoin="round"/>';
    s += '<rect x="1034" y="744" width="402" height="116" fill="#a8743f" stroke="#7a5328" stroke-width="3"/>';
    s += '<rect x="1060" y="764" width="150" height="40" rx="4" fill="none" stroke="#7a5328" stroke-width="2.5" opacity=".7"/><rect x="1260" y="764" width="150" height="40" rx="4" fill="none" stroke="#7a5328" stroke-width="2.5" opacity=".7"/>';
    s += '<circle cx="1135" cy="784" r="4" fill="#7a5328"/><circle cx="1335" cy="784" r="4" fill="#7a5328"/>';
    s += '<g id="deskLemons">';
    for (var k = 0; k < 30; k++) { var p = slot(k); s += '<use href="#lemonSym" x="' + p[0] + '" y="' + p[1] + '"/>'; }
    s += '</g>';
    s += '<g id="crates">';
    for (var c = 0; c < K.CRATES_SHOWN; c++) s += '<use href="#crateSym" x="' + K.CRATE_X + '" y="' + (K.FLOOR - c * K.CRATE_H) + '"/>';
    s += '<g id="crateBadge"><circle r="24" fill="#d94a4a" stroke="#fff" stroke-width="3"/><text y="7" font-family="Segoe UI, Arial, sans-serif" font-size="19" font-weight="700" fill="#fff" text-anchor="middle"></text></g>';
    s += '</g>';
    // things in her hands (drawn in front of the desk)
    s += '<g id="tea"><use href="#teaSym"/></g>';
    s += '<g id="heldLemon"><g mask="url(#biteMask)"><use href="#lemonSym" transform="rotate(-18) scale(1.3)"/></g></g>';
    s += '<rect id="chalkPiece" x="-3" y="-9" width="6" height="14" rx="2" fill="#f4f1e8" stroke="#888" stroke-width="1"/>';
    s += '<g id="carryCrate"><use href="#crateSym" x="-70" y="0"/></g>';
    return s;
  }

  var el = {}, teacher = null, bodyCache = {}, curMood = null, rigG = null;

  function create(svg) {
    svg.innerHTML = staticSvg();
    ['chalk', 'stool', 'shadow', 'tch', 'tchBody', 'armLo', 'armLf', 'handL', 'armRo', 'armRf', 'handR', 'deskLemons', 'crates', 'crateBadge',
      'tea', 'heldLemon', 'biteHoles', 'chalkPiece', 'carryCrate'].forEach(function (id) { el[id] = svg.querySelector('#' + id); });
    el.lemons = Array.prototype.slice.call(el.deskLemons.children);
    el.crateUses = Array.prototype.slice.call(el.crates.querySelectorAll(':scope > use'));
    el.svg = svg;
  }

  function setTeacher(t) {
    teacher = t;
    bodyCache = {};
    curMood = null;
    rigG = C.rig(t);
    el.svg.setAttribute('style', C.cssVars(t));
    el.armLf.setAttribute('stroke', rigG.sleeve);
    el.armRf.setAttribute('stroke', rigG.sleeve);
  }

  /* local (200 x 300 figure units) <-> scene */
  function toScene(X, base, p) { return [X + (p[0] - 100) * K.S, base + (p[1] - 294) * K.S]; }
  function toLocal(X, base, p) { return [100 + (p[0] - X) / K.S, 294 + (p[1] - base) / K.S]; }
  function anchor(name, X, base) {
    if (name === 'shoulderL') return toScene(X, base, rigG.shoulderL);
    if (name === 'shoulderR') return toScene(X, base, rigG.shoulderR);
    return toScene(X, base, rigG.anchors[name]);
  }

  /* Where a hand ends up when the arm swings toward a scene point (cut-out arms don't stretch). */
  function reach(X, base, side, target, maxF) {
    var S = rigG['shoulder' + side], t = toLocal(X, base, target);
    return toScene(X, base, C.reach(S, t, rigG.L, maxF));
  }
  function shoulder(X, base, side) { return toScene(X, base, rigG['shoulder' + side]); }
  function armLen() { return rigG.L * K.S; }

  var lastBites = -1, lastDesk = -1, lastCrates = -1, walking = null;

  function render(pose) {
    var X = pose.X, base = pose.base;
    var key = pose.back ? 'back' : pose.mood;
    if (key !== curMood) {
      if (!bodyCache[key]) bodyCache[key] = C.build(teacher, pose.mood, 'm' + key, pose.back ? 'back' : 'front').svg;
      el.tchBody.innerHTML = bodyCache[key];
      curMood = key;
    }
    el.tch.setAttribute('transform', 'translate(' + n(X - 100 * K.S) + ' ' + n(base - 294 * K.S) + ') scale(' + K.S + ')');
    if (walking !== !!pose.walk) { walking = !!pose.walk; el.tch.classList.toggle('walk', walking); }
    el.tch.classList.toggle('seated', pose.base > K.FLOOR + 10);
    el.shadow.setAttribute('cx', n(X));
    el.shadow.setAttribute('cy', n(base));
    el.shadow.style.opacity = pose.seated || (X > 1010 && X < 1460) ? 0 : 1;

    var hl = toLocal(X, base, pose.handL), hr = toLocal(X, base, pose.handR);
    var dl = C.armPath(rigG.shoulderL, hl), dr = C.armPath(rigG.shoulderR, hr);
    el.armLo.setAttribute('d', dl); el.armLf.setAttribute('d', dl);
    el.armRo.setAttribute('d', dr); el.armRf.setAttribute('d', dr);
    el.handL.setAttribute('cx', n(hl[0])); el.handL.setAttribute('cy', n(hl[1]));
    el.handR.setAttribute('cx', n(hr[0])); el.handR.setAttribute('cy', n(hr[1]));

    // desk lemons and crates
    if (pose.deskCount !== lastDesk) {
      el.lemons.forEach(function (u, i) {
        var show = i < pose.deskCount;
        u.style.display = show ? '' : 'none';
        if (show && lastDesk >= 0 && i >= lastDesk) { u.classList.remove('pop'); u.getBoundingClientRect(); u.classList.add('pop'); }
      });
      lastDesk = pose.deskCount;
    }
    if (pose.crates !== lastCrates) {
      el.crateUses.forEach(function (u, i) { u.style.display = i < pose.crates ? '' : 'none'; });
      var extra = pose.crates - K.CRATES_SHOWN;
      el.crateBadge.style.display = extra > 0 ? '' : 'none';
      if (extra > 0) {
        el.crateBadge.setAttribute('transform', 'translate(' + (K.CRATE_X + K.CRATE_W - 6) + ' ' + (K.FLOOR - K.CRATES_SHOWN * K.CRATE_H - 6) + ')');
        el.crateBadge.querySelector('text').textContent = '+' + extra;
      }
      lastCrates = pose.crates;
    }

    // lemon in hand (with bites)
    if (pose.lemon) {
      el.heldLemon.style.display = '';
      el.heldLemon.setAttribute('transform', 'translate(' + n(pose.lemon[0]) + ' ' + n(pose.lemon[1]) + ')');
      if (pose.bites !== lastBites) {
        el.biteHoles.innerHTML = BITES.slice(0, pose.bites).map(function (b) { return '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="8.5" fill="#000"/>'; }).join('');
        lastBites = pose.bites;
      }
    } else el.heldLemon.style.display = 'none';

    el.tea.setAttribute('transform', 'translate(' + n(pose.tea[0]) + ' ' + n(pose.tea[1]) + ')');
    if (pose.chalk) {
      el.chalkPiece.style.display = '';
      el.chalkPiece.setAttribute('transform', 'translate(' + n(pose.chalk[0]) + ' ' + n(pose.chalk[1]) + ') rotate(-30)');
    } else el.chalkPiece.style.display = 'none';
    if (pose.crate) {
      el.carryCrate.style.display = '';
      el.carryCrate.style.opacity = pose.crate.op;
      el.carryCrate.setAttribute('transform', 'translate(' + n(pose.crate.x) + ' ' + n(pose.crate.y) + ') rotate(' + n(pose.crate.rot) + ')');
    } else el.carryCrate.style.display = 'none';
    el.stool.setAttribute('transform', 'translate(' + n(pose.stool[0]) + ' ' + n(pose.stool[1]) + ')');
  }

  // ---------------- chalk writing ----------------
  var GUIDE = { ascender_height_mm: 20, x_height_mm: 10, descender_depth_mm: 10, slant_degrees: null };
  var KMAX = { 1: 3.6, 2: 3.0, 3: 2.4 };
  var BASELINES = { 1: [575], 2: [420, 540], 3: [360, 455, 550] };
  var MAXW = 790;

  function lib() { return root.HW && root.HW.libraries && root.HW.libraries['nsw-foundation-cursive-ofl']; }
  function measure(text) { return root.HW.typeset.measure(lib(), text, GUIDE); }

  function balance(text, parts) {
    var words = text.split(/\s+/).filter(Boolean);
    if (words.length < parts) return null;
    var best = null, bestW = Infinity;
    function tryCut(cuts) {
      var lines = [], prev = 0;
      cuts.concat([words.length]).forEach(function (c) { lines.push(words.slice(prev, c).join(' ')); prev = c; });
      var w = Math.max.apply(null, lines.map(measure));
      if (w < bestW) { bestW = w; best = lines; }
    }
    for (var a = 1; a < words.length; a++) {
      if (parts === 2) tryCut([a]);
      else for (var b = a + 1; b < words.length; b++) tryCut([a, b]);
    }
    return best;
  }

  function fitLines(message) {
    var raw = String(message || '').split(/\r?\n/).map(function (s) { return s.replace(/\s+/g, ' ').trim(); }).filter(Boolean).slice(0, 3);
    if (!raw.length) raw = ['Time is up!'];
    var fit = function (lines) { return Math.min(KMAX[lines.length], MAXW / Math.max.apply(null, lines.map(measure))); };
    var lines = raw, k = fit(lines);
    if (raw.length === 1 && k < 2.6) {
      var two = balance(raw[0], 2);
      if (two) { lines = two; k = fit(lines); }
      if (k < 2.1) { var three = balance(raw[0], 3); if (three && fit(three) > k) { lines = three; k = fit(three); } }
    }
    return { lines: lines, k: k };
  }

  function polyLen(pts) {
    var cum = [0];
    for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return cum;
  }

  /* Plan the writing: strokes in scene px with start/end times (seconds from the first touch). */
  function planWriting(message) {
    clearWriting();
    var f = fitLines(message), k = f.k, base = BASELINES[f.lines.length], strokes = [], t = 0, prevEnd = null;
    var speed = 430, coreW = n(1.15 * k), haloW = n(2.4 * k), lines = [];
    f.lines.forEach(function (text, li) {
      var set = root.HW.typeset.setLine(lib(), text, GUIDE);
      var x0 = K.BOARD_CX - set.width * k / 2, y0 = base[li];
      var P = function (p) { return [x0 + p[0] * k, y0 - p[1] * k]; };
      lines.push({ x0: x0, x1: x0 + set.width * k, baseline: y0 });
      var list = set.strokes.map(function (s) { var pts = s.points.map(P); if (s.closed) pts.push(pts[0]); return { pts: pts }; });
      set.dots.forEach(function (d) { var c = P(d); list.push({ pts: [c, [c[0] + 0.01, c[1]]], dot: true }); });
      list.forEach(function (s, si) {
        if (prevEnd) {
          var travel = Math.hypot(s.pts[0][0] - prevEnd[0], s.pts[0][1] - prevEnd[1]);
          t += si === 0 ? 0.75 : 0.06 + travel / 1800;   // a new line: she scoots back to the left
        }
        s.cum = polyLen(s.pts);
        s.L = s.cum[s.cum.length - 1];
        s.t0 = t;
        s.t1 = t + (s.dot ? 0.12 : Math.max(0.08, s.L / speed));
        s.newLine = si === 0;
        s.line = li;
        t = s.t1;
        prevEnd = s.pts[s.pts.length - 1];
        strokes.push(s);
      });
    });
    var frag = '';
    strokes.forEach(function (s, i) {
      if (s.dot) {
        frag += '<circle id="ck' + i + '" cx="' + n(s.pts[0][0]) + '" cy="' + n(s.pts[0][1]) + '" r="' + n(1.0 * k) + '" fill="#f4f1e8" style="display:none"/>';
      } else {
        var pts = s.pts.map(function (p) { return n(p[0]) + ',' + n(p[1]); }).join(' '), L = n(s.L + 1);
        frag += '<g id="ck' + i + '" style="display:none"><polyline points="' + pts + '" fill="none" stroke="#f4f1e8" stroke-opacity=".16" stroke-width="' + haloW + '" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="' + L + ' ' + L + '" stroke-dashoffset="' + L + '"/>' +
          '<polyline points="' + pts + '" fill="none" stroke="#f4f1e8" stroke-opacity=".93" stroke-width="' + coreW + '" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="' + L + ' ' + L + '" stroke-dashoffset="' + L + '"/></g>';
      }
    });
    el.chalk.innerHTML = frag;
    strokes.forEach(function (s, i) { s.el = el.chalk.querySelector('#ck' + i); s.state = 0; });
    return { strokes: strokes, duration: t, lines: lines, multi: f.lines.length > 1, k: k, first: strokes[0].pts[0], asc: GUIDE.ascender_height_mm * k };
  }

  function pointAt(s, d) {
    var c = s.cum, i = 1;
    while (i < c.length - 1 && c[i] < d) i++;
    var seg = c[i] - c[i - 1] || 1, u = Math.max(0, Math.min(1, (d - c[i - 1]) / seg));
    return [s.pts[i - 1][0] + (s.pts[i][0] - s.pts[i - 1][0]) * u, s.pts[i - 1][1] + (s.pts[i][1] - s.pts[i - 1][1]) * u];
  }

  /* Where the chalk is at time tw (no drawing). */
  function penAt(plan, tw) {
    var ss = plan.strokes;
    if (tw <= ss[0].t0) return { pen: ss[0].pts[0], line: 0, down: false };
    for (var i = 0; i < ss.length; i++) {
      var s = ss[i];
      if (tw <= s.t1) {
        if (tw >= s.t0) return { pen: s.dot ? s.pts[0] : pointAt(s, (tw - s.t0) / (s.t1 - s.t0) * s.L), line: s.line, down: true };
        var a = ss[i - 1].pts[ss[i - 1].pts.length - 1], b = s.pts[0], u = (tw - ss[i - 1].t1) / (s.t0 - ss[i - 1].t1);
        return { pen: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * 14], line: u < 0.5 ? ss[i - 1].line : s.line, down: false };
      }
    }
    var last = ss[ss.length - 1];
    return { pen: last.pts[last.pts.length - 1], line: last.line, down: false };
  }

  /* Reveal the writing up to time tw. Returns the chalk point and whether it touches the board. */
  function drawWriting(plan, tw) {
    var pen = plan.first, down = false, ss = plan.strokes;
    for (var i = 0; i < ss.length; i++) {
      var s = ss[i];
      var prog = tw <= s.t0 ? 0 : tw >= s.t1 ? 1 : (tw - s.t0) / (s.t1 - s.t0);
      var state = prog <= 0 ? 0 : prog >= 1 ? 2 : 1;
      if (state !== s.state || state === 1) {
        if (s.dot) s.el.style.display = state ? '' : 'none';
        else {
          s.el.style.display = state ? '' : 'none';
          var off = n((s.L + 1) * (1 - prog));
          s.el.firstChild.setAttribute('stroke-dashoffset', off);
          s.el.lastChild.setAttribute('stroke-dashoffset', off);
        }
        s.state = state;
      }
      if (tw >= s.t0 && tw <= s.t1) { pen = s.dot ? s.pts[0] : pointAt(s, prog * s.L); down = true; }
      else if (tw > s.t1) {
        pen = s.pts[s.pts.length - 1];
        var next = ss[i + 1];
        if (next && tw < next.t0) {
          var u = (tw - s.t1) / (next.t0 - s.t1), a = pen, b = next.pts[0];
          pen = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * 14];
        }
      }
    }
    return { pen: pen, down: down };
  }

  function clearWriting() { if (el.chalk) el.chalk.innerHTML = ''; }

  LT.scene = { K: K, create: create, setTeacher: setTeacher, render: render, anchor: anchor, toScene: toScene, reach: reach, shoulder: shoulder, armLen: armLen, penAt: penAt, BASELINES: BASELINES,
    planWriting: planWriting, drawWriting: drawWriting, clearWriting: clearWriting, fitLines: fitLines };
})(typeof globalThis !== 'undefined' ? globalThis : this);
