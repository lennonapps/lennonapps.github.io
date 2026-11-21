/* Lemon Timer. Made by Benjamin Lennon (lennonapps@outlook.com), author and project lead, with Hillary Lennon. */
/*
 * The teacher: an anime-style ("cat face") cartoon drawn from a few settings.
 * build() draws everything except the arms, in a 200 x 300 box with her feet at (100, 294),
 * and returns anchor points so the scene can put her hands anywhere (desk, mouth, board).
 */
(function (root) {
  'use strict';
  var LT = root.LT = root.LT || {};

  var STYLES = {
    A: { name: 'A. Chibi sensei', note: 'Big head, tiny body. Super cute and easy to see from the back of the room.',
      headR: 50, neck: 0.92, bodyH: 84, legH: 36, sw: 50, hw: 70, hair: 'straight', outfit: 'blouse' },
    B: { name: 'B. Classic anime', note: 'Normal anime proportions. Swept bangs, cardigan and pleated skirt.',
      headR: 37, neck: 1.06, bodyH: 110, legH: 68, sw: 48, hw: 66, hair: 'swept', outfit: 'cardigan' },
    C: { name: 'C. Soft and sweet', note: 'In between. Curtain bangs and a dress with a bow at the waist.',
      headR: 43, neck: 1.0, bodyH: 98, legH: 50, sw: 52, hw: 74, hair: 'curtain', outfit: 'dress' },
    D: { name: 'D. Speedy sensei', note: 'Long legs for the fastest scurry. Wispy bangs, soft jumper, wide trousers.',
      headR: 35, neck: 1.06, bodyH: 108, legH: 80, sw: 46, hw: 60, hair: 'wispy', outfit: 'trousers' }
  };
  var HAIRS = { straight: 'Straight bangs', swept: 'Swept bangs', curtain: 'Curtain bangs', wispy: 'Wispy bangs' };
  var OUTFITS = { blouse: 'Bow blouse and skirt', cardigan: 'Cardigan and pleated skirt', dress: 'Dress with waist bow', trousers: 'Jumper and wide trousers', shirt: 'Shirt and trousers' };
  var hasTrousers = function (o) { return o === 'trousers' || o === 'shirt'; };
  var SWATCHES = {
    skin: ['#f8e0cc', '#f3d2b8', '#e9bf9f', '#d9a682', '#b98160'],
    hair: ['#17151c', '#1d1a1a', '#221714', '#2c1e17'],
    outfit: ['#a99bd1', '#8fae9b', '#d49a9f', '#34446b', '#c49a6c', '#efe5d2', '#d8a945', '#8a3d4f'],
    outfit2: ['#2f3a56', '#3b3b44', '#b58b5e', '#e9dfcc', '#7a2f42', '#5d7d6a'],
    shirt: ['#fffaf0', '#f1ece2', '#dfe8f3', '#f6e1e1']
  };
  var HAIR_HI = { '#17151c': '#4a4660', '#1d1a1a': '#4d4545', '#221714': '#5a4036', '#2c1e17': '#66493a' };
  var SKIN_SHADE = { '#f8e0cc': '#ebc4a8', '#f3d2b8': '#e2b296', '#e9bf9f': '#d6a27f', '#d9a682': '#c38b66', '#b98160': '#9f6a4a' };
  var BANGS = {
    straight: [[-0.62, -0.08], [-0.48, -0.3], [-0.32, -0.06], [-0.16, -0.28], [0, -0.05], [0.16, -0.28], [0.32, -0.06], [0.48, -0.3], [0.62, -0.08]],
    swept: [[-0.62, -0.02], [-0.46, -0.28], [-0.24, -0.08], [-0.1, -0.34], [0.14, -0.14], [0.26, -0.4], [0.46, -0.22], [0.56, -0.44], [0.72, -0.2]],
    curtain: [[-0.6, 0.02], [-0.42, -0.28], [-0.2, -0.46], [0, -0.58], [0.2, -0.46], [0.42, -0.28], [0.6, 0.02]],
    wispy: [[-0.66, -0.1], [-0.56, -0.3], [-0.44, -0.04], [-0.32, -0.3], [-0.2, -0.12], [-0.06, -0.32], [0.06, -0.05], [0.2, -0.32], [0.32, -0.1], [0.44, -0.3], [0.56, -0.02], [0.64, -0.28]]
  };

  // The teacher's own choice (chosen 2026-11-04) is the default.
  var DEFAULT_TEACHER = {
    style: 'C', hair: 'curtain', outfit: 'blouse',
    round: 0.9, head: 1.2, eyes: 1.05, mouth: 'small', extra: 'none',
    colours: { skin: '#f8e0cc', hair: '#17151c', outfit: '#d49a9f', outfit2: '#e9dfcc', shirt: '#f6e1e1' }
  };

  function cssVars(t) {
    var c = t.colours;
    return '--skin:' + c.skin + ';--skinShade:' + (SKIN_SHADE[c.skin] || c.skin) + ';--hair:' + c.hair + ';--hairHi:' + (HAIR_HI[c.hair] || '#555') +
      ';--outfit:' + c.outfit + ';--outfit2:' + c.outfit2 + ';--shirt:' + c.shirt;
  }

  var n = function (v) { return Math.round(v * 10) / 10; };
  var LN = ' stroke="var(--line)" stroke-width="2" stroke-linejoin="round"';
  var HL = ' stroke="var(--hairLine)" stroke-width="2" stroke-linejoin="round"';

  function clump(p0, p1) {
    var c = p1[1] > p0[1] ? [p1[0], p0[1]] : [p0[0], p1[1]];
    return ' Q' + n(c[0]) + ' ' + n(c[1]) + ' ' + n(p1[0]) + ' ' + n(p1[1]);
  }

  function backHair(cx, hy, R, end) {
    var hx = R * 1.08, L = cx - hx - R * 0.14, Rr = cx + hx + R * 0.14, count = 6, step = (Rr - L) / count, vy = end - R * 0.16;
    var d = 'M' + n(cx - hx) + ' ' + n(hy) + ' Q' + n(L - R * 0.04) + ' ' + n((hy + vy) / 2) + ' ' + n(L) + ' ' + n(vy);
    for (var i = 0; i < count; i++) {
      var tx = L + step * (i + 0.5) + (i < count / 2 ? -step * 0.2 : step * 0.2);
      d += ' L' + n(tx) + ' ' + n(end + (i === 0 || i === count - 1 ? R * 0.04 : 0)) + ' L' + n(L + step * (i + 1)) + ' ' + n(vy);
    }
    d += ' Q' + n(Rr + R * 0.04) + ' ' + n((hy + vy) / 2) + ' ' + n(cx + hx) + ' ' + n(hy);
    d += ' A' + n(hx) + ' ' + n(R * 1.14) + ' 0 0 0 ' + n(cx - hx) + ' ' + n(hy) + 'Z';
    return '<path class="hair" d="' + d + '"' + HL + '/>';
  }

  function frontHair(cx, hy, R, style) {
    var P = function (x, y) { return [cx + x * R, hy + y * R]; };
    var d = 'M' + n(cx + R * 1.06) + ' ' + n(hy + R * 0.12) + ' A' + n(R * 1.08) + ' ' + n(R * 1.12) + ' 0 1 0 ' + n(cx - R * 1.06) + ' ' + n(hy + R * 0.12);
    var tipL = P(-0.9, 0.98), inL = P(-0.8, -0.05);
    d += ' Q' + n(cx - R * 1.08) + ' ' + n(hy + R * 0.6) + ' ' + n(tipL[0]) + ' ' + n(tipL[1]);
    d += ' Q' + n(cx - R * 0.84) + ' ' + n(hy + R * 0.45) + ' ' + n(inL[0]) + ' ' + n(inL[1]);
    var prev = inL;
    (BANGS[style] || BANGS.curtain).concat([[0.8, -0.05]]).forEach(function (b) { var p = P(b[0], b[1]); d += clump(prev, p); prev = p; });
    var tipR = P(0.9, 0.98);
    d += ' Q' + n(cx + R * 0.84) + ' ' + n(hy + R * 0.45) + ' ' + n(tipR[0]) + ' ' + n(tipR[1]);
    d += ' Q' + n(cx + R * 1.08) + ' ' + n(hy + R * 0.6) + ' ' + n(cx + R * 1.06) + ' ' + n(hy + R * 0.12) + 'Z';
    var s = '<path class="hair" d="' + d + '"' + HL + '/>';
    var rr = R * 0.82, a0 = -0.95, a1 = 0.95, oy = hy - R * 0.02;
    s += '<path d="M' + n(cx + rr * Math.sin(a0)) + ' ' + n(oy - rr * Math.cos(a0)) + ' A' + n(rr) + ' ' + n(rr) + ' 0 0 1 ' + n(cx + rr * Math.sin(a1)) + ' ' + n(oy - rr * Math.cos(a1)) +
      '" fill="none" stroke="var(--hairHi)" stroke-width="' + n(R * 0.06) + '" stroke-linecap="round" stroke-dasharray="' + n(R * 0.32) + ' ' + n(R * 0.1) + '"/>';
    return s;
  }

  // eye kinds: open, squeeze (> <), closed (happy ^ ^)
  function eye(x, ey, ew, eh, d, id, kind, R) {
    var dark = '#1a1214';
    if (kind === 'squeeze') {
      return '<path d="M' + n(x + d * ew * 0.45) + ' ' + n(ey - eh * 0.3) + ' L' + n(x - d * ew * 0.35) + ' ' + n(ey) + ' L' + n(x + d * ew * 0.45) + ' ' + n(ey + eh * 0.3) +
        '" fill="none" stroke="' + dark + '" stroke-width="' + n(R * 0.075) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    if (kind === 'closed') {
      return '<path d="M' + n(x - ew * 0.48) + ' ' + n(ey + eh * 0.12) + ' Q' + n(x) + ' ' + n(ey - eh * 0.5) + ' ' + n(x + ew * 0.48) + ' ' + n(ey + eh * 0.12) +
        '" fill="none" stroke="' + dark + '" stroke-width="' + n(R * 0.07) + '" stroke-linecap="round"/>';
    }
    var cid = id + (d < 0 ? 'L' : 'R');
    var s = '<clipPath id="' + cid + '"><ellipse cx="' + n(x) + '" cy="' + n(ey) + '" rx="' + n(ew / 2) + '" ry="' + n(eh / 2) + '"/></clipPath>';
    s += '<ellipse cx="' + n(x) + '" cy="' + n(ey) + '" rx="' + n(ew / 2) + '" ry="' + n(eh / 2) + '" fill="#fff"/>';
    s += '<g clip-path="url(#' + cid + ')">' +
      '<ellipse cx="' + n(x) + '" cy="' + n(ey + eh * 0.06) + '" rx="' + n(ew * 0.36) + '" ry="' + n(eh * 0.44) + '" fill="url(#iris' + id + ')"/>' +
      '<ellipse cx="' + n(x) + '" cy="' + n(ey + eh * 0.08) + '" rx="' + n(ew * 0.17) + '" ry="' + n(eh * 0.24) + '" fill="#160d09"/>' +
      '<rect x="' + n(x - ew / 2) + '" y="' + n(ey - eh / 2) + '" width="' + n(ew) + '" height="' + n(eh * 0.16) + '" fill="#000" opacity=".12"/></g>';
    s += '<circle cx="' + n(x - ew * 0.12) + '" cy="' + n(ey - eh * 0.1) + '" r="' + n(ew * 0.13) + '" fill="#fff"/>' +
      '<circle cx="' + n(x + ew * 0.13) + '" cy="' + n(ey + eh * 0.2) + '" r="' + n(ew * 0.055) + '" fill="#fff"/>';
    s += '<path d="M' + n(x - ew * 0.58) + ' ' + n(ey - eh * 0.04) + ' Q' + n(x) + ' ' + n(ey - eh * 1.04) + ' ' + n(x + ew * 0.58) + ' ' + n(ey - eh * 0.04) +
      '" fill="none" stroke="' + dark + '" stroke-width="' + n(R * 0.07) + '" stroke-linecap="round"/>';
    s += '<path d="M' + n(x + d * ew * 0.56) + ' ' + n(ey - eh * 0.08) + ' l' + n(d * ew * 0.16) + ' ' + n(-eh * 0.14) + '" stroke="' + dark + '" stroke-width="' + n(R * 0.045) + '" stroke-linecap="round"/>';
    s += '<path d="M' + n(x - ew * 0.22) + ' ' + n(ey + eh * 0.52) + ' Q' + n(x) + ' ' + n(ey + eh * 0.58) + ' ' + n(x + ew * 0.26) + ' ' + n(ey + eh * 0.5) +
      '" fill="none" stroke="#5a3a30" stroke-width="' + n(R * 0.025) + '" stroke-linecap="round"/>';
    return s;
  }

  /* moods: happy, sour (lemon face), chew (munching), joy (big smile, eyes closed), look (eyes open, small "o") */
  function face(cx, hy, R, mood, id, t) {
    var s = '', sour = mood === 'sour';
    var ey = hy + R * 0.24, ex = R * 0.42, ew = R * 0.36 * t.eyes, eh = R * 0.42 * t.eyes;
    [-1, 1].forEach(function (d) {
      var bx = cx + d * R * 0.56, by = hy + R * 0.54;
      s += '<ellipse cx="' + n(bx) + '" cy="' + n(by) + '" rx="' + n(R * 0.16) + '" ry="' + n(R * 0.07) + '" fill="var(--cheek)" opacity="' + (sour || mood === 'chew' ? 0.7 : 0.4) + '"/>';
      for (var i = -1; i <= 1; i++) s += '<path d="M' + n(bx + i * R * 0.07 + R * 0.02) + ' ' + n(by - R * 0.04) + ' l' + n(-R * 0.04) + ' ' + n(R * 0.08) + '" stroke="#e46d6d" stroke-width="' + n(R * 0.018) + '" stroke-linecap="round" opacity=".8"/>';
    });
    var kind = sour ? 'squeeze' : (mood === 'chew' || mood === 'joy') ? 'closed' : 'open';
    s += eye(cx - ex, ey, ew, eh, -1, id, kind, R) + eye(cx + ex, ey, ew, eh, 1, id, kind, R);
    s += '<path d="M' + n(cx + R * 0.02) + ' ' + n(hy + R * 0.5) + ' l' + n(-R * 0.025) + ' ' + n(R * 0.04) + '" stroke="#8a5a48" stroke-width="' + n(R * 0.025) + '" stroke-linecap="round"/>';
    var my = hy + R * 0.68, k = R * 0.03, ink = '#5a2a2a';
    if (sour) {
      s += '<path d="M' + n(cx - R * 0.13) + ' ' + n(my) + ' q' + n(R * 0.032) + ' ' + n(-R * 0.05) + ' ' + n(R * 0.065) + ' 0 q' + n(R * 0.032) + ' ' + n(R * 0.05) + ' ' + n(R * 0.065) + ' 0 q' + n(R * 0.032) + ' ' + n(-R * 0.05) + ' ' + n(R * 0.065) + ' 0 q' + n(R * 0.032) + ' ' + n(R * 0.05) + ' ' + n(R * 0.065) + ' 0' +
        '" fill="none" stroke="' + ink + '" stroke-width="' + n(k) + '" stroke-linecap="round"/>';
      s += '<path d="M' + n(cx + R * 0.95) + ' ' + n(hy - R * 0.2) + ' q' + n(R * 0.09) + ' ' + n(R * 0.14) + ' 0 ' + n(R * 0.2) + ' q' + n(-R * 0.09) + ' ' + n(-R * 0.06) + ' 0 ' + n(-R * 0.2) + 'Z" fill="#bfe3f7" stroke="#5a8fb0" stroke-width="1.2"/>';
      s += '<path class="shiver" d="M' + n(cx - R * 1.32) + ' ' + n(hy - R * 0.2) + ' q-5 6 0 12 q5 6 0 12 M' + n(cx + R * 1.32) + ' ' + n(hy + R * 0.1) + ' q5 6 0 12 q-5 6 0 12" fill="none" stroke="var(--line)" stroke-width="1.8" stroke-linecap="round" opacity=".5"/>';
    } else if (mood === 'chew') {
      s += '<ellipse class="munch" cx="' + n(cx) + '" cy="' + n(my + R * 0.02) + '" rx="' + n(R * 0.08) + '" ry="' + n(R * 0.06) + '" fill="#b5484f" stroke="' + ink + '" stroke-width="' + n(R * 0.022) + '"/>';
    } else if (mood === 'look') {
      s += '<ellipse cx="' + n(cx) + '" cy="' + n(my + R * 0.02) + '" rx="' + n(R * 0.045) + '" ry="' + n(R * 0.06) + '" fill="#b5484f" stroke="' + ink + '" stroke-width="' + n(R * 0.022) + '"/>';
    } else if (mood === 'joy') {
      s += '<path d="M' + n(cx - R * 0.14) + ' ' + n(my - R * 0.02) + ' Q' + n(cx) + ' ' + n(my + R * 0.2) + ' ' + n(cx + R * 0.14) + ' ' + n(my - R * 0.02) + 'Z" fill="#b5484f" stroke="' + ink + '" stroke-width="' + n(R * 0.022) + '" stroke-linejoin="round"/>';
    } else if (t.mouth === 'cat') {
      s += '<path d="M' + n(cx - R * 0.12) + ' ' + n(my) + ' Q' + n(cx - R * 0.06) + ' ' + n(my + R * 0.08) + ' ' + n(cx) + ' ' + n(my) + ' Q' + n(cx + R * 0.06) + ' ' + n(my + R * 0.08) + ' ' + n(cx + R * 0.12) + ' ' + n(my) +
        '" fill="none" stroke="' + ink + '" stroke-width="' + n(k) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    } else if (t.mouth === 'small') {
      s += '<path d="M' + n(cx - R * 0.08) + ' ' + n(my) + ' Q' + n(cx) + ' ' + n(my + R * 0.06) + ' ' + n(cx + R * 0.08) + ' ' + n(my) + '" fill="none" stroke="' + ink + '" stroke-width="' + n(k) + '" stroke-linecap="round"/>';
    } else {
      s += '<path d="M' + n(cx - R * 0.11) + ' ' + n(my - R * 0.01) + ' Q' + n(cx) + ' ' + n(my + R * 0.16) + ' ' + n(cx + R * 0.11) + ' ' + n(my - R * 0.01) + 'Z" fill="#b5484f" stroke="' + ink + '" stroke-width="' + n(R * 0.022) + '" stroke-linejoin="round"/>';
    }
    return { s: s, ey: ey, ex: ex, ew: ew, eh: eh, my: my };
  }

  function browsAndGlasses(cx, R, f, mood) {
    var sour = mood === 'sour', s = '', gw = f.ew * 1.45, gh = f.eh * 1.18, gy = f.ey + f.eh * 0.02;
    [-1, 1].forEach(function (d) {
      var x = cx + d * f.ex, by = gy - gh / 2 - R * 0.08;
      s += sour
        ? '<path d="M' + n(x - d * R * 0.16) + ' ' + n(by - R * 0.05) + ' L' + n(x + d * R * 0.14) + ' ' + n(by + R * 0.04) + '" stroke="var(--hair)" stroke-width="' + n(R * 0.035) + '" stroke-linecap="round"/>'
        : '<path d="M' + n(x - R * 0.15) + ' ' + n(by + R * 0.01) + ' Q' + n(x) + ' ' + n(by - R * 0.05) + ' ' + n(x + R * 0.15) + ' ' + n(by + R * 0.01) + '" fill="none" stroke="var(--hair)" stroke-width="' + n(R * 0.035) + '" stroke-linecap="round"/>';
    });
    var g = '', fw = n(R * 0.035);
    [-1, 1].forEach(function (d) {
      var x = cx + d * f.ex, x0 = x - gw / 2, y0 = gy - gh / 2;
      g += '<rect x="' + n(x0) + '" y="' + n(y0) + '" width="' + n(gw) + '" height="' + n(gh) + '" rx="' + n(gh * 0.36) + '" fill="#fff" fill-opacity=".12" stroke="#151515" stroke-width="' + fw + '"/>';
      g += '<path d="M' + n(x0 + gw * 0.66) + ' ' + n(y0 + gh * 0.16) + ' l' + n(gw * 0.12) + ' ' + n(gh * 0.16) + '" stroke="#fff" stroke-opacity=".75" stroke-width="' + n(R * 0.03) + '" stroke-linecap="round"/>';
      g += '<path d="M' + n(cx + d * (f.ex + gw / 2)) + ' ' + n(gy - gh * 0.22) + ' L' + n(cx + d * R * 0.97) + ' ' + n(gy - gh * 0.3) + '" stroke="#151515" stroke-width="' + fw + '" stroke-linecap="round"/>';
    });
    g += '<path d="M' + n(cx - f.ex + gw / 2) + ' ' + n(gy - gh * 0.12) + ' Q' + n(cx) + ' ' + n(gy - gh * 0.34) + ' ' + n(cx + f.ex - gw / 2) + ' ' + n(gy - gh * 0.12) + '" fill="none" stroke="#151515" stroke-width="' + fw + '"/>';
    return s + '<g class="' + (sour ? 'shiver' : '') + '">' + g + '</g>';
  }

  function bow(x, y, s, cls) {
    return '<path class="' + cls + '" d="M' + n(x) + ' ' + n(y) + ' L' + n(x - 9 * s) + ' ' + n(y - 6 * s) + ' L' + n(x - 9 * s) + ' ' + n(y + 6 * s) + 'Z M' + n(x) + ' ' + n(y) + ' L' + n(x + 9 * s) + ' ' + n(y - 6 * s) + ' L' + n(x + 9 * s) + ' ' + n(y + 6 * s) + 'Z"' + LN + '/>' +
      '<circle class="' + cls + '" cx="' + n(x) + '" cy="' + n(y) + '" r="' + n(2.8 * s) + '"' + LN + '/>';
  }

  function clothes(p, cx, bodyTop, legTop, G, sw, ww, hw, back) {
    var H = p.bodyH, o = p.outfit, s = '';
    var waistY = bodyTop + H * (o === 'blouse' ? 0.36 : 0.44);
    var topEnd = waistY + (o === 'cardigan' ? 7 : hasTrousers(o) ? 4 : 0);
    var cxs = cx - (sw / 2 * 0.65 + ww / 2 * 0.35);
    var top = 'M' + n(cx - sw / 2 + 7) + ' ' + n(bodyTop) + ' Q' + n(cx - sw / 2) + ' ' + n(bodyTop) + ' ' + n(cx - sw / 2) + ' ' + n(bodyTop + 9) +
      ' Q' + n(cxs) + ' ' + n(topEnd - H * 0.12) + ' ' + n(cx - ww / 2) + ' ' + n(topEnd) + ' L' + n(cx + ww / 2) + ' ' + n(topEnd) +
      ' Q' + n(2 * cx - cxs) + ' ' + n(topEnd - H * 0.12) + ' ' + n(cx + sw / 2) + ' ' + n(bodyTop + 9) + ' Q' + n(cx + sw / 2) + ' ' + n(bodyTop) + ' ' + n(cx + sw / 2 - 7) + ' ' + n(bodyTop) + 'Z';
    var mid = waistY + (legTop - waistY) * 0.35;
    var skirt = 'M' + n(cx - ww / 2) + ' ' + n(waistY) + ' Q' + n(cx - hw / 2 + 3) + ' ' + n(mid) + ' ' + n(cx - hw / 2) + ' ' + n(legTop) +
      ' Q' + cx + ' ' + n(legTop + 7) + ' ' + n(cx + hw / 2) + ' ' + n(legTop) + ' Q' + n(cx + hw / 2 - 3) + ' ' + n(mid) + ' ' + n(cx + ww / 2) + ' ' + n(waistY) + 'Z';
    var fold = function (k) { return '<path d="M' + n(cx + k * ww * 0.22) + ' ' + n(waistY + 8) + ' Q' + n(cx + k * hw * 0.22) + ' ' + n(mid + 10) + ' ' + n(cx + k * hw * 0.27) + ' ' + n(legTop + 2) + '" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="1.6" stroke-linecap="round"/>'; };

    if (hasTrousers(o)) {
      var crotch = waistY + (G - waistY) * 0.3;
      s += '<path class="outfit2" d="M' + n(cx - ww / 2) + ' ' + n(waistY) + ' L' + n(cx - ww / 2 - 3) + ' ' + n(crotch + 2) + ' L' + n(cx + ww / 2 + 3) + ' ' + n(crotch + 2) + ' L' + n(cx + ww / 2) + ' ' + n(waistY) + 'Z"' + LN + '/>';
    } else {
      s += '<path class="' + (o === 'cardigan' ? 'outfit2' : 'outfit') + '" d="' + skirt + '"' + LN + '/>';
      if (o === 'cardigan') {
        for (var i = -2; i <= 2; i++) s += '<path d="M' + n(cx + i * ww * 0.18) + ' ' + n(waistY + 4) + ' L' + n(cx + i * hw * 0.2) + ' ' + n(legTop + 3) + '" stroke="#000" stroke-opacity=".22" stroke-width="1.5"/>';
      } else { s += fold(-1) + fold(1); }
    }
    s += '<path class="' + (o === 'blouse' ? 'shirt' : 'outfit') + '" d="' + top + '"' + LN + '/>';

    if (back) {   // seen from behind: plain back, waistband, a collar line
      if (o === 'shirt') s += '<rect x="' + n(cx - ww / 2) + '" y="' + n(waistY + 1) + '" width="' + n(ww) + '" height="5" fill="#3a2a22"/>';
      else if (o === 'dress') s += '<rect class="outfit2" x="' + n(cx - ww / 2) + '" y="' + n(waistY - 3) + '" width="' + n(ww) + '" height="6"' + LN + '/>';
      else s += '<path d="M' + n(cx - ww / 2 + 1) + ' ' + n(topEnd - 3) + ' H' + n(cx + ww / 2 - 1) + '" stroke="#000" stroke-opacity=".22" stroke-width="1.8"/>';
      if (o === 'shirt' || o === 'cardigan' || o === 'blouse') s += '<path class="' + (o === 'shirt' ? 'outfit' : 'shirt') + '" d="M' + n(cx - 12) + ' ' + n(bodyTop + 1) + ' Q' + cx + ' ' + n(bodyTop - 4) + ' ' + n(cx + 12) + ' ' + n(bodyTop + 1) + ' L' + n(cx + 10) + ' ' + n(bodyTop + 7) + ' Q' + cx + ' ' + n(bodyTop + 3) + ' ' + n(cx - 10) + ' ' + n(bodyTop + 7) + 'Z"' + LN + '/>';
      s += '<path d="M' + cx + ' ' + n(bodyTop + 12) + ' V' + n(topEnd - 8) + '" stroke="#000" stroke-opacity=".08" stroke-width="2"/>';
      return s;
    }

    if (o === 'shirt') {
      s += '<rect x="' + n(cx - ww / 2) + '" y="' + n(waistY + 1) + '" width="' + n(ww) + '" height="5" fill="#3a2a22"/><rect x="' + n(cx - 4) + '" y="' + n(waistY) + '" width="8" height="7" rx="1" fill="none" stroke="#c9a54a" stroke-width="1.6"/>';
      s += '<path d="M' + cx + ' ' + n(bodyTop + 8) + ' V' + n(waistY) + '" stroke="#000" stroke-opacity=".25" stroke-width="1.4"/>';
      for (var sb = 0; sb < 3; sb++) s += '<circle cx="' + n(cx + 2.5) + '" cy="' + n(bodyTop + 16 + sb * (waistY - bodyTop - 20) / 3) + '" r="1.6" fill="#fff" stroke="var(--line)" stroke-width=".8"/>';
      s += '<rect x="' + n(cx - ww / 2 + 5) + '" y="' + n(bodyTop + H * 0.14) + '" width="11" height="10" rx="1.5" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.4"/>';
      [-1, 1].forEach(function (d) { s += '<path class="outfit" d="M' + n(cx + d * 0.5) + ' ' + n(bodyTop + 9) + ' L' + n(cx + d * 13) + ' ' + n(bodyTop - 2) + ' L' + n(cx + d * 11) + ' ' + n(bodyTop + 11) + 'Z"' + LN + '/>'; });
    } else if (o === 'blouse') {
      s += '<path d="M' + n(cx - ww / 2 + 1) + ' ' + n(waistY) + ' H' + n(cx + ww / 2 - 1) + '" stroke="#000" stroke-opacity=".25" stroke-width="2"/>';
      [-1, 1].forEach(function (d) {
        s += '<path class="shirt" d="M' + cx + ' ' + n(bodyTop + 2) + ' Q' + n(cx + d * 12) + ' ' + n(bodyTop - 3) + ' ' + n(cx + d * 16) + ' ' + n(bodyTop + 5) + ' Q' + n(cx + d * 11) + ' ' + n(bodyTop + 14) + ' ' + cx + ' ' + n(bodyTop + 8) + 'Z"' + LN + '/>';
      });
      s += bow(cx, bodyTop + 8, 0.9, 'outfit');
      s += '<path d="M' + n(cx - 10) + ' ' + n(waistY - 2) + ' q2 -10 4 -14 M' + n(cx + 10) + ' ' + n(waistY - 2) + ' q-2 -10 -4 -14" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="1.4"/>';
    } else if (o === 'cardigan') {
      s += '<path class="shirt" d="M' + n(cx - 10) + ' ' + n(bodyTop) + ' L' + cx + ' ' + n(bodyTop + H * 0.3) + ' L' + n(cx + 10) + ' ' + n(bodyTop) + 'Z"' + LN + '/>';
      [-1, 1].forEach(function (d) { s += '<path class="shirt" d="M' + n(cx + d) + ' ' + n(bodyTop + 3) + ' L' + n(cx + d * 12) + ' ' + n(bodyTop - 1) + ' L' + n(cx + d * 7) + ' ' + n(bodyTop + 10) + 'Z"' + LN + '/>'; });
      for (var b = 0; b < 3; b++) s += '<circle cx="' + cx + '" cy="' + n(bodyTop + H * 0.34 + b * (topEnd - bodyTop - H * 0.34) / 3) + '" r="1.9" fill="var(--shirt)" stroke="var(--line)" stroke-width="1"/>';
      s += '<path d="M' + n(cx - ww / 2 + 1) + ' ' + n(topEnd - 4) + ' H' + n(cx + ww / 2 - 1) + '" stroke="#000" stroke-opacity=".22" stroke-width="1.6"/>';
    } else if (o === 'dress') {
      s += '<path class="shirt" d="M' + n(cx - 12) + ' ' + n(bodyTop + 1) + ' L' + cx + ' ' + n(bodyTop + H * 0.2) + ' L' + n(cx + 12) + ' ' + n(bodyTop + 1) + ' L' + n(cx + 6) + ' ' + n(bodyTop + 1) + ' L' + cx + ' ' + n(bodyTop + H * 0.12) + ' L' + n(cx - 6) + ' ' + n(bodyTop + 1) + 'Z"' + LN + '/>';
      s += '<path d="M' + n(cx - 6) + ' ' + n(bodyTop + 1) + ' L' + cx + ' ' + n(bodyTop + H * 0.12) + ' L' + n(cx + 6) + ' ' + n(bodyTop + 1) + '" fill="var(--skin)"/>';
      s += '<rect class="outfit2" x="' + n(cx - ww / 2) + '" y="' + n(waistY - 3) + '" width="' + n(ww) + '" height="6"' + LN + '/>';
      s += bow(cx + ww * 0.28, waistY, 0.85, 'outfit2');
      s += '<path d="M' + n(cx + ww * 0.28 - 2) + ' ' + n(waistY + 2) + ' l-3 14 M' + n(cx + ww * 0.28 + 2) + ' ' + n(waistY + 2) + ' l4 12" stroke="var(--outfit2)" stroke-width="3" stroke-linecap="round"/>';
    } else {
      s += '<path d="M' + n(cx - 9) + ' ' + n(bodyTop + 1) + ' Q' + cx + ' ' + n(bodyTop + 9) + ' ' + n(cx + 9) + ' ' + n(bodyTop + 1) + '" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="2.5"/>';
      [-1, 1].forEach(function (d) { s += '<path class="shirt" d="M' + n(cx + d) + ' ' + n(bodyTop + 4) + ' L' + n(cx + d * 10) + ' ' + n(bodyTop + 1) + ' L' + n(cx + d * 6) + ' ' + n(bodyTop + 9) + 'Z"' + LN + '/>'; });
      s += '<path d="M' + n(cx - ww / 2 + 1) + ' ' + n(topEnd - 4) + ' H' + n(cx + ww / 2 - 1) + '" stroke="#000" stroke-opacity=".22" stroke-width="1.6"/>';
      s += '<path d="M' + n(cx - 5) + ' ' + n(bodyTop + 14) + ' V' + n(topEnd - 6) + ' M' + n(cx + 5) + ' ' + n(bodyTop + 14) + ' V' + n(topEnd - 6) + '" stroke="#000" stroke-opacity=".1" stroke-width="2" stroke-dasharray="3 2"/>';
    }
    return s;
  }

  /* Geometry shared by build() and the arms. t = teacher settings. */
  function rig(t) {
    var st = STYLES[t.style] || STYLES.C;
    var p = { headR: st.headR, neck: st.neck, bodyH: st.bodyH, legH: st.legH, sw: st.sw, hw: st.hw, hair: t.hair, outfit: t.outfit };
    var cx = 100, G = 294, R = p.headR * t.head;
    var sw = p.sw * (1 + (t.round - 1) * 0.6), ww = p.sw * 0.72 * t.round, hw = p.hw * t.round;
    var legTop = G - p.legH, bodyTop = legTop - p.bodyH, hy = bodyTop - R * p.neck;
    return {
      p: p, cx: cx, G: G, R: R, sw: sw, ww: ww, hw: hw, legTop: legTop, bodyTop: bodyTop, hy: hy,
      top: hy - R * 1.14,
      sleeve: p.outfit === 'blouse' ? 'var(--shirt)' : 'var(--outfit)',
      seg: p.bodyH * 0.34,
      L: p.bodyH * 0.5,          // arm length: short, stiff, cut-out style
      shoulderL: [cx - sw / 2 + 5, bodyTop + 8],
      shoulderR: [cx + sw / 2 - 5, bodyTop + 8],
      anchors: {
        restL: [cx - sw / 2 - 5, bodyTop + p.bodyH * 0.66],
        restR: [cx + sw / 2 + 5, bodyTop + p.bodyH * 0.66],
        chestR: [cx + sw / 2 + 15, bodyTop + p.bodyH * 0.06],
        chestL: [cx - sw / 2 - 15, bodyTop + p.bodyH * 0.2],
        mouth: [cx + R * 0.22, hy + R * 0.86],
        overL: [cx - 24, hy - R * 1.3],
        overR: [cx + 24, hy - R * 1.3],
        hipL: [cx - sw / 2 - 2, bodyTop + p.bodyH * 0.5],
        waveR: [cx + R * 1.25, hy - R * 0.15]
      }
    };
  }

  function build(t, mood, id, view) {
    var g = rig(t), p = g.p, cx = g.cx, G = g.G, R = g.R, legTop = g.legTop, bodyTop = g.bodyTop, hy = g.hy, ww = g.ww;
    var trousers = hasTrousers(p.outfit), back = view === 'back';
    var s = '<defs><linearGradient id="iris' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22130c"/><stop offset=".55" stop-color="#4a2c1c"/><stop offset="1" stop-color="#9a6a44"/></linearGradient></defs>';
    if (!back) s += backHair(cx, hy, R, bodyTop + 10);
    var lx = Math.min(ww * 0.2, 10);
    var waistGuess = bodyTop + p.bodyH * 0.44, crotch = waistGuess + (G - waistGuess) * 0.3;
    var flare = p.outfit === 'shirt' ? 3 : 6;
    [-1, 1].forEach(function (d) {
      var l = '';
      if (trousers) {
        l += '<path class="outfit2" d="M' + n(cx + d * (ww / 2 + 3)) + ' ' + n(crotch - 4) + ' L' + n(cx + d * (ww / 2 + flare)) + ' ' + n(G - 6) + ' L' + n(cx + d * 1) + ' ' + n(G - 6) + ' L' + n(cx + d * 1) + ' ' + n(crotch - 4) + 'Z"' + LN + '/>';
      } else {
        l += '<rect class="skin" x="' + n(cx + d * lx - 4.5) + '" y="' + n(legTop - 10) + '" width="9" height="' + n(G - 4 - legTop + 10) + '" rx="4"' + LN + '/>';
      }
      l += '<path class="shoe" d="M' + n(cx + d * lx - 7) + ' ' + n(G - 2) + ' Q' + n(cx + d * lx - 7) + ' ' + n(G - 10) + ' ' + n(cx + d * (lx + 2)) + ' ' + n(G - 9) + ' Q' + n(cx + d * (lx + 10)) + ' ' + n(G - 8) + ' ' + n(cx + d * (lx + 10)) + ' ' + n(G - 2) + 'Z"' + LN + '/>';
      if (!trousers) l += '<path d="M' + n(cx + d * lx - 4.5) + ' ' + n(G - 8) + ' h9" stroke="var(--shoe)" stroke-width="2"/>';
      s += '<g class="leg ' + (d < 0 ? 'l' : 'r') + '">' + l + '</g>';
    });
    s += '<rect class="skin" x="' + n(cx - R * 0.13) + '" y="' + n(hy + R * 0.7) + '" width="' + n(R * 0.26) + '" height="' + n(bodyTop + 6 - hy - R * 0.7) + '"' + LN + '/>';
    s += '<ellipse cx="' + cx + '" cy="' + n(hy + R * 0.86) + '" rx="' + n(R * 0.14) + '" ry="' + n(R * 0.06) + '" fill="var(--skinShade)"/>';
    s += clothes(p, cx, bodyTop, legTop, G, g.sw, g.ww, g.hw, back);
    if (back) {   // the back of her head: all hair
      s += '<ellipse class="skin" cx="' + n(cx - R * 1.02) + '" cy="' + n(hy + R * 0.3) + '" rx="' + n(R * 0.14) + '" ry="' + n(R * 0.2) + '"' + LN + '/>';
      s += '<ellipse class="skin" cx="' + n(cx + R * 1.02) + '" cy="' + n(hy + R * 0.3) + '" rx="' + n(R * 0.14) + '" ry="' + n(R * 0.2) + '"' + LN + '/>';
      s += backHair(cx, hy, R, bodyTop + 10);
      s += '<path d="M' + n(cx - R * 1.02) + ' ' + n(hy + R * 0.12) + ' l' + n(R * 0.1) + ' ' + n(-R * 0.03) + ' M' + n(cx + R * 1.02) + ' ' + n(hy + R * 0.12) + ' l' + n(-R * 0.1) + ' ' + n(-R * 0.03) + '" stroke="#151515" stroke-width="' + n(R * 0.04) + '" stroke-linecap="round"/>';
      s += '<path d="M' + n(cx - R * 0.08) + ' ' + n(hy - R * 0.62) + ' q' + n(R * 0.12) + ' ' + n(-R * 0.1) + ' ' + n(R * 0.18) + ' ' + n(R * 0.04) + '" fill="none" stroke="var(--hairHi)" stroke-width="' + n(R * 0.04) + '" stroke-linecap="round"/>';
      var rr = R * 0.82, oy = hy - R * 0.02;
      s += '<path d="M' + n(cx + rr * Math.sin(-0.95)) + ' ' + n(oy - rr * Math.cos(-0.95)) + ' A' + n(rr) + ' ' + n(rr) + ' 0 0 1 ' + n(cx + rr * Math.sin(0.95)) + ' ' + n(oy - rr * Math.cos(0.95)) +
        '" fill="none" stroke="var(--hairHi)" stroke-width="' + n(R * 0.06) + '" stroke-linecap="round" stroke-dasharray="' + n(R * 0.32) + ' ' + n(R * 0.1) + '"/>';
      if (t.extra === 'bow') s += bow(cx - R * 0.62, hy - R * 0.62, 1.1, 'outfit');
      if (t.extra === 'clip') s += '<rect x="' + n(cx - R * 0.78) + '" y="' + n(hy - R * 0.5) + '" width="' + n(R * 0.36) + '" height="' + n(R * 0.09) + '" rx="2" fill="#e0b84a" stroke="#8a6a1a" stroke-width="1" transform="rotate(28 ' + n(cx - R * 0.6) + ' ' + n(hy - R * 0.45) + ')"/>';
      return { svg: s, rig: g };
    }
    s += '<path class="skin" d="M' + n(cx - R) + ' ' + n(hy) + ' A' + R + ' ' + R + ' 0 0 1 ' + n(cx + R) + ' ' + n(hy) +
      ' C' + n(cx + R) + ' ' + n(hy + R * 0.5) + ' ' + n(cx + R * 0.55) + ' ' + n(hy + R * 0.88) + ' ' + cx + ' ' + n(hy + R) +
      ' C' + n(cx - R * 0.55) + ' ' + n(hy + R * 0.88) + ' ' + n(cx - R) + ' ' + n(hy + R * 0.5) + ' ' + n(cx - R) + ' ' + n(hy) + 'Z"' + LN + '/>';
    var f = face(cx, hy, R, mood, id, t);
    s += f.s;
    s += frontHair(cx, hy, R, p.hair);
    s += browsAndGlasses(cx, R, f, mood);
    if (t.extra === 'bow') s += bow(cx + R * 0.62, hy - R * 0.62, 1.1, 'outfit');
    if (t.extra === 'clip') s += '<rect x="' + n(cx + R * 0.42) + '" y="' + n(hy - R * 0.5) + '" width="' + n(R * 0.36) + '" height="' + n(R * 0.09) + '" rx="2" fill="#e0b84a" stroke="#8a6a1a" stroke-width="1" transform="rotate(-28 ' + n(cx + R * 0.6) + ' ' + n(hy - R * 0.45) + ')"/>';
    if (t.extra === 'pearls') [-1, 1].forEach(function (d) { s += '<circle cx="' + n(cx + d * R * 0.84) + '" cy="' + n(hy + R * 0.62) + '" r="' + n(R * 0.06) + '" fill="#fbf6ee" stroke="#9a8f80" stroke-width="1"/>'; });
    if (t.extra === 'lanyard') {
      s += '<path d="M' + n(cx - 7) + ' ' + n(bodyTop + 2) + ' L' + cx + ' ' + n(bodyTop + p.bodyH * 0.34) + ' L' + n(cx + 7) + ' ' + n(bodyTop + 2) + '" fill="none" stroke="#c0392b" stroke-width="2.5"/>' +
        '<rect x="' + n(cx - 7) + '" y="' + n(bodyTop + p.bodyH * 0.34) + '" width="14" height="17" rx="2" fill="#fff"' + LN + '/><rect x="' + n(cx - 7) + '" y="' + n(bodyTop + p.bodyH * 0.34) + '" width="14" height="5" fill="#c0392b"/>';
    }
    return { svg: s, rig: g, mouthY: f.my };
  }

  /* Cut-out arms: a short stiff sleeve that swings from the shoulder toward a target.
     It never bends or stretches; the hand stops where the arm runs out. */
  function reach(S, target, L, maxF) {
    var dx = target[0] - S[0], dy = target[1] - S[1], d = Math.sqrt(dx * dx + dy * dy) || 1;
    var len = Math.max(L * 0.3, Math.min(d, L * (maxF || 1)));
    return [S[0] + dx / d * len, S[1] + dy / d * len];
  }
  function armPath(S, H) { return 'M' + n(S[0]) + ' ' + n(S[1]) + ' L' + n(H[0]) + ' ' + n(H[1]); }
  var ARM_OUT = 17, ARM_IN = 12, HAND_R = 7.5;
  function armSvg(S, H, sleeve) {
    var d = armPath(S, H);
    return '<path d="' + d + '" fill="none" stroke="var(--line)" stroke-width="' + ARM_OUT + '" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + sleeve + '" stroke-width="' + ARM_IN + '" stroke-linecap="round"/>' +
      '<circle class="skin" cx="' + n(H[0]) + '" cy="' + n(H[1]) + '" r="' + HAND_R + '"' + LN + '/>';
  }

  /* Whole figure with arms as one SVG string (used by the chooser previews). */
  function preview(t, mood, id, item) {
    var b = build(t, mood, id), g = b.rig;
    var hL = reach(g.shoulderL, g.anchors.restL, g.L), hR = reach(g.shoulderR, g.anchors.chestR, g.L);
    return b.svg + armSvg(g.shoulderL, hL, g.sleeve) + (item ? item(hR[0], hR[1]) : '') + armSvg(g.shoulderR, hR, g.sleeve);
  }

  LT.character = {
    STYLES: STYLES, HAIRS: HAIRS, OUTFITS: OUTFITS, SWATCHES: SWATCHES, DEFAULT_TEACHER: DEFAULT_TEACHER,
    cssVars: cssVars, rig: rig, build: build, armPath: armPath, reach: reach, preview: preview, n: n, LN: LN,
    ARM_OUT: ARM_OUT, ARM_IN: ARM_IN, HAND_R: HAND_R
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
