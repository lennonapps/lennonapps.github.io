/* Lemon Timer. Made by Benjamin Lennon (lennonapps@outlook.com), author and project lead, with Hillary Lennon. */
/*
 * Where everything is at a given moment. Poses are pure functions of time, so pause, resume and
 * "add a minute" never get out of step. Each minute: take a lemon, eat it in six bites with sour
 * faces; sometimes a sip of bubble tea or a quick dash to check the board; when the desk runs
 * low she fetches a crate of ten. At the end she goes to the board and writes the message
 * (seen from behind).
 *
 * Arms are cut-out style: a pose says where each hand is trying to go; finalize() swings the
 * stiff arm that way and things she holds follow the hand. Out-of-reach things hop to her hand.
 */
(function (root) {
  'use strict';
  var LT = root.LT = root.LT || {};
  var SC = LT.scene, K = SC.K;

  var BITES = [10, 19, 28, 37, 46, 55];
  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return v < a ? a : v > b ? b : v; };
  var ease = function (v) { v = clamp(v); return v * v * (3 - 2 * v); };
  var seg = function (t, a, b) { return ease((t - a) / (b - a)); };
  var mix = function (a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; };
  var hop = function (a, b, u, h) { var p = mix(a, b, u); p[1] -= Math.sin(u * Math.PI) * (h || 40); return p; };
  var within = function (t, a, b) { return t >= a && t < b; };

  function crates(n) { return Math.max(0, Math.ceil((n - 30) / 10)); }
  function layout(n) { var c = crates(n); return { desk: n - 10 * c, crates: c }; }

  var SEATED = K.FLOOR + K.SEAT_DROP;
  function A(name, X, base) { return SC.anchor(name, X, base); }
  function deskHand(X, side) { return [X + side * 60, 712]; }

  function basePose(X, base, seated) {
    return {
      X: X, base: base, seated: seated, mood: 'happy', walk: false, back: false,
      handL: seated ? deskHand(X, -1) : A('restL', X, base),
      handR: seated ? deskHand(X, 1) : A('restR', X, base),
      reachL: 1, reachR: 1,
      lemon: null, lemonAt: null, bites: 0, tea: K.TEA.slice(), teaAt: null, chalk: null, chalkOn: false, crate: null,
      stool: [K.STOOL_PARK, K.FLOOR], deskCount: 0, crates: 0
    };
  }

  /* Swing the arms toward their targets and hang things on the hands. */
  function finalize(p) {
    p.handL = SC.reach(p.X, p.base, 'L', p.handL, p.reachL);
    p.handR = SC.reach(p.X, p.base, 'R', p.handR, p.reachR);
    if (p.lemonAt === 'R') p.lemon = [p.handR[0] + 2, p.handR[1] - 12];
    if (p.teaAt === 'L') p.tea = [p.handL[0] - 2, p.handL[1] + 26];
    if (p.chalkOn) p.chalk = [p.handL[0] - 4, p.handL[1] - 8];
    return p;
  }

  /* Before Start (and after Reset): seated, the whole timer laid out on the desk. */
  function idlePose(M) {
    var p = basePose(K.SEAT_X, SEATED, true), l = layout(M);
    p.deskCount = l.desk; p.crates = l.crates;
    return finalize(p);
  }

  /* Minute m (0-based) of an M-minute timer, t seconds into it. */
  function minutePose(M, m, t) {
    var n = M - m - 1;                         // lemons not yet started once this one is taken
    var before = layout(n + 1), after = layout(n);
    var refill = after.crates < before.crates;
    var X = K.SEAT_X;
    var p = basePose(X, SEATED, true);
    var slotPos = K.slot(Math.max(0, before.desk - 1));
    var chest = function () { return A('chestR', p.X, p.base); };
    var heldR = function () { return SC.reach(p.X, p.base, 'R', chest()); };

    // --- take the lemon: reach toward it, it hops into her hand (0 - 1.3 s)
    p.deskCount = before.desk; p.crates = before.crates;
    if (t < 1.3) {
      if (t < 0.5) { p.handR = mix(deskHand(X, 1), slotPos, seg(t, 0, 0.5)); }
      else {
        p.handR = slotPos;
        p.deskCount = before.desk - 1;
        if (t < 0.9) { p.lemon = hop(slotPos, heldR(), seg(t, 0.5, 0.9), 50); p.handR = mix(slotPos, chest(), seg(t, 0.6, 0.9)); }
        else { p.handR = chest(); p.lemonAt = 'R'; }
        p.mood = 'look';
      }
      return finalize(p);
    }
    p.deskCount = before.desk - 1;
    p.handR = chest();
    p.lemonAt = 'R';
    p.bites = BITES.filter(function (b) { return t >= b; }).length;

    // --- fetch a crate of ten (1.6 - 5.2 s); the lemon goes in her mouth
    if (refill && t < 5.2) {
      var stackX = K.CRATE_X + K.CRATE_W / 2, stackTop = [stackX, K.FLOOR - (before.crates - 1) * K.CRATE_H];
      var standX = stackX - 30;
      var rise = seg(t, 1.6, 1.9), sit = seg(t, 4.8, 5.2);
      p.base = SEATED - (SEATED - K.FLOOR) * (rise - sit);
      p.seated = p.base > K.FLOOR + 20;
      if (t < 2.7) p.X = X + (standX - X) * seg(t, 1.9, 2.7);
      else if (t < 3.2) p.X = standX;
      else p.X = standX + (X - standX) * seg(t, 3.2, 4.0);
      p.walk = within(t, 1.9, 2.7) || within(t, 3.2, 4.0);
      p.mood = 'look';
      var mouth = A('mouth', p.X, p.base);
      p.lemonAt = null;
      p.lemon = t < 4.8 ? mix(heldR(), [mouth[0] - 4, mouth[1] - 2], seg(t, 1.6, 1.9)) : mix([mouth[0] - 4, mouth[1] - 2], heldR(), seg(t, 4.8, 5.2));
      if (t >= 4.8) p.lemonAt = t >= 5.15 ? 'R' : null;
      var shY = SC.shoulder(p.X, p.base, 'L')[1];
      var carry = [p.X, shY + 78];
      p.crates = before.crates;
      p.handL = p.seated ? deskHand(p.X, -1) : A('restL', p.X, p.base);
      p.handR = p.seated ? deskHand(p.X, 1) : A('restR', p.X, p.base);
      if (t >= 2.7) {
        p.crates = before.crates - 1;
        var c = mix(stackTop, carry, seg(t, 2.7, 3.2)), rot = 0, op = 1;
        if (t >= 4.0) { var tip = seg(t, 4.0, 4.6); c = mix(carry, [1255, 700], tip); rot = -115 * tip; op = 1 - seg(t, 4.5, 4.8); }
        p.crate = { x: c[0], y: c[1], rot: rot, op: op };
        if (t < 4.6) { p.handL = [c[0] - 66, c[1] - 34]; p.handR = [c[0] + 66, c[1] - 34]; }
        if (t >= 4.35) p.deskCount = after.desk;
      } else if (t >= 2.4) {
        p.handL = [stackTop[0] - 66, stackTop[1] - 34]; p.handR = [stackTop[0] + 66, stackTop[1] - 34];
      }
      if (t >= 4.8) p.handR = chest();
      return finalize(p);
    }
    if (refill) { p.deskCount = after.desk; p.crates = after.crates; }

    // --- quick dash to the board and back, every third minute
    if (m % 3 === 1 && !refill && within(t, 40.8, 44.2)) {
      var up = seg(t, 40.8, 41.1) - seg(t, 43.8, 44.2);
      p.base = SEATED - (SEATED - K.FLOOR) * up;
      p.seated = up < 0.5;
      var peekX = 640;
      p.X = t < 43 ? X + (peekX - X) * seg(t, 41.1, 41.9) : peekX + (X - peekX) * seg(t, 43.0, 43.8);
      p.walk = within(t, 41.1, 41.9) || within(t, 43.0, 43.8);
      p.mood = within(t, 41.9, 43.0) ? 'look' : 'happy';
      p.handL = p.seated ? deskHand(p.X, -1) : A('restL', p.X, p.base);
      p.handR = A('chestR', p.X, p.base);
      return finalize(p);
    }

    // --- a sip of bubble tea, every second minute: the cup hops to her hand and back
    if (m % 2 === 1 && within(t, 31.8, 35.4)) {
      var rest = deskHand(X, -1), toward = [K.TEA[0], K.TEA[1] - 20];
      var sipAt = [A('mouth', X, p.base)[0] - 40, A('mouth', X, p.base)[1] + 10];
      var heldL = SC.reach(X, p.base, 'L', sipAt);
      if (t < 32.2) p.handL = mix(rest, toward, seg(t, 31.8, 32.2));
      else if (t < 32.6) { p.handL = sipAt; p.tea = hop(K.TEA, [heldL[0] - 2, heldL[1] + 26], seg(t, 32.2, 32.6), 40); }
      else if (t < 34.4) { p.handL = sipAt; p.teaAt = 'L'; p.mood = within(t, 32.8, 34.2) ? 'joy' : 'happy'; }
      else if (t < 34.8) { p.handL = sipAt; p.tea = hop([heldL[0] - 2, heldL[1] + 26], K.TEA, seg(t, 34.4, 34.8), 30); }
      else p.handL = mix(toward, rest, seg(t, 34.8, 35.4));
      return finalize(p);
    }

    // --- bites
    var mouthP = A('mouth', X, p.base);
    for (var i = 0; i < BITES.length; i++) {
      var b = BITES[i];
      if (within(t, b - 0.4, b + 3.6)) {
        if (t < b) p.handR = mix(chest(), mouthP, seg(t, b - 0.4, b));
        else if (t < b + 0.6) { p.handR = mouthP; p.mood = 'chew'; }
        else if (t < b + 1.0) { p.handR = mix(mouthP, chest(), seg(t, b + 0.6, b + 1.0)); p.mood = 'chew'; }
        else p.mood = 'sour';
        if (i === BITES.length - 1 && t >= b + 0.6) p.handR = mix(mouthP, deskHand(X, 1), seg(t, b + 0.6, b + 1.2));
      }
    }
    if (p.bites >= BITES.length) { p.lemonAt = null; p.lemon = null; }
    if (p.bites >= BITES.length && t > BITES[BITES.length - 1] + 3.6) { p.handR = deskHand(X, 1); p.mood = 'happy'; }
    return finalize(p);
  }

  /* Sound cues for a minute: [time, name] */
  function minuteEvents(M, m) {
    var n = M - m - 1, refill = layout(n).crates < layout(n + 1).crates, ev = [[0.5, 'pop']];
    if (refill) ev.push([1.9, 'scurry'], [3.2, 'scurry'], [4.35, 'tumble']);
    if (m % 3 === 1 && !refill) ev.push([41.1, 'scurry'], [43.0, 'scurry']);
    if (m % 2 === 1) ev.push([33.0, 'sip']);
    BITES.forEach(function (b) { ev.push([b, 'chomp'], [b + 1.0, 'sour']); });
    return ev;
  }

  // ---------------- the ending ----------------
  function walkTime(dx) { return Math.max(0.35, Math.abs(dx) / 1100); }

  /* Where she stands to write: her left hand on the chalk, a stiff arm's length away. */
  function writerAt(E, tw) {
    var sum = 0, sumB = 0, N = 5;
    for (var k = 0; k < N; k++) {                  // average a little window so she glides
      var pw = SC.penAt(E.plan, tw - k * 0.08), base = E.lineBase[pw.line];
      var sh = SC.shoulder(0, base, 'L');            // shoulder offset from her centre
      var dy = pw.pen[1] - sh[1], Lp = SC.armLen() * 0.95;
      var dx = Math.max(Math.sqrt(Math.max(0, Lp * Lp - dy * dy)), Lp * 0.3);
      sum += pw.pen[0] + dx - sh[0];
      sumB += base;
    }
    return { X: sum / N, base: sumB / N };
  }

  /* Build the ending once: walk to the board (and the stool), write, step aside. */
  function planEnding(plan) {
    var E = { plan: plan };
    var floorTop = plan.multi ? K.FLOOR - K.STOOL_H : K.FLOOR;
    var shOff = SC.shoulder(0, 0, 'L')[1];           // shoulder height above her feet (negative)
    E.lineBase = plan.lines.map(function (ln) {
      var mid = ln.baseline - plan.asc * 0.35;
      var want = mid + SC.armLen() * 0.5 - shOff;     // feet position that puts the line in easy reach
      return floorTop - clamp(floorTop - want, 0, 10); // tiptoes, just a little
    });
    var startX = K.SEAT_X, firstX = writerAt(E, 0).X, t = 0.5, steps = [];
    if (plan.multi) {
      var w1 = walkTime(K.STOOL_PARK - startX);
      steps.push({ kind: 'walk', a: t, b: t + w1, from: startX, to: K.STOOL_PARK }); t += w1;
      steps.push({ kind: 'grab', a: t, b: t + 0.25 }); t += 0.25;
      var w2 = walkTime(firstX - K.STOOL_PARK);
      steps.push({ kind: 'drag', a: t, b: t + w2, from: K.STOOL_PARK, to: firstX }); t += w2;
      steps.push({ kind: 'hopUp', a: t, b: t + 0.3 }); t += 0.3;
    } else {
      var w = walkTime(firstX - startX);
      steps.push({ kind: 'walk', a: t, b: t + w, from: startX, to: firstX }); t += w;
    }
    E.write0 = t + 0.35;
    E.write1 = E.write0 + plan.duration;
    t = E.write1 + 0.4;
    E.lastX = writerAt(E, plan.duration + 1).X;
    if (plan.multi) { steps.push({ kind: 'hopDown', a: t, b: t + 0.3 }); t += 0.3; }
    var w3 = walkTime(K.REST_X - E.lastX);
    steps.push({ kind: 'exit', a: t, b: t + w3, from: E.lastX, to: K.REST_X }); t += w3;
    E.steps = steps;
    E.done = t + 0.4;
    E.floorTop = floorTop;
    return E;
  }

  function endPose(E, e) {
    var plan = E.plan, multi = plan.multi;
    var p = basePose(K.SEAT_X, SEATED, true);
    p.deskCount = 0; p.crates = 0;
    var up = seg(e, 0, 0.5);
    p.base = SEATED - (SEATED - K.FLOOR) * up;
    p.seated = up < 0.5;
    p.mood = 'joy';
    var lift = 0, stoolX = K.STOOL_PARK, X = K.SEAT_X, carrying = false;
    E.steps.forEach(function (s) {
      if (e < s.a) return;
      var u = seg(e, s.a, s.b);
      if (s.kind === 'walk' || s.kind === 'exit') { X = s.from + (s.to - s.from) * u; if (e < s.b) p.walk = true; }
      if (s.kind === 'grab') { X = K.STOOL_PARK; carrying = true; }
      if (s.kind === 'drag') { X = s.from + (s.to - s.from) * u; stoolX = X; carrying = true; if (e < s.b) p.walk = true; }
      if (s.kind === 'hopUp') { lift = u; carrying = false; }
      if (s.kind === 'hopDown') { lift = 1 - u; stoolX = E.lastX; }
    });
    p.X = X;
    if (!p.seated) p.base = K.FLOOR - lift * K.STOOL_H;
    if (p.walk) p.base -= Math.abs(Math.sin(e * 22)) * 5;

    var atBoard = e >= E.write0 - 0.25 && e < E.write1 + 0.4;
    if (atBoard) {
      var tw = e - E.write0, w = writerAt(E, tw);
      p.X = w.X;
      p.base = Math.min(p.base, w.base);
      if (multi) stoolX = p.X;
      var pw = SC.penAt(plan, tw);
      SC.drawWriting(plan, tw);
      p.back = true;
      p.handL = pw.pen; p.reachL = 1.4; p.chalkOn = true;
      p.handR = A('restR', p.X, p.base);
      p.penDown = pw.down && tw >= 0;
    } else if (e >= E.write1 + 0.4) {
      SC.drawWriting(plan, plan.duration + 1);
      if (multi) stoolX = E.lastX;
      p.handL = A('restL', p.X, p.base); p.handR = A('restR', p.X, p.base);
    } else if (!p.seated) {
      var swing = p.walk ? Math.sin(e * 22) * 14 : 0;
      p.handL = A('restL', p.X, p.base); p.handR = A('restR', p.X, p.base);
      p.handL[0] += swing; p.handR[0] -= swing;
    }
    if (carrying) p.handR = [stoolX + 40, K.FLOOR - K.STOOL_H + 4];
    p.stool = [stoolX, K.FLOOR];
    if (e >= E.done) {
      p.mood = 'joy';
      var wv = A('waveR', p.X, p.base), wave = Math.sin(e * 7) * 18;
      p.handR = [wv[0] + wave, wv[1] - 30];
    }
    p.finished = e >= E.done;
    return finalize(p);
  }

  LT.timeline = { layout: layout, idlePose: idlePose, minutePose: minutePose, minuteEvents: minuteEvents, planEnding: planEnding, endPose: endPose, BITES: BITES };
})(typeof globalThis !== 'undefined' ? globalThis : this);
