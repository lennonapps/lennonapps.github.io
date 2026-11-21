/* Lemon Timer. Made by Benjamin Lennon (lennonapps@outlook.com), author and project lead, with Hillary Lennon. */
/* Polyline geometry and arc-length dot sampling. Units are whatever the caller uses (mm on the page). */
(function (root) {
  'use strict';
  var HW = root.HW = root.HW || {};

  function dist(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }

  function length(points, closed) {
    var total = 0;
    for (var i = 1; i < points.length; i++) total += dist(points[i - 1], points[i]);
    if (closed && points.length > 1) total += dist(points[points.length - 1], points[0]);
    return total;
  }

  /* Point at arc length s along the polyline (s clamped to [0, length]). */
  function pointAt(points, closed, s) {
    var pts = closed ? points.concat([points[0]]) : points;
    if (s <= 0) return pts[0].slice();
    for (var i = 1; i < pts.length; i++) {
      var d = dist(pts[i - 1], pts[i]);
      if (s <= d && d > 0) {
        var u = s / d;
        return [pts[i - 1][0] + u * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + u * (pts[i][1] - pts[i - 1][1])];
      }
      s -= d;
    }
    return pts[pts.length - 1].slice();
  }

  /*
   * Dot centres at equal arc-length intervals along a pen stroke.
   * Open strokes get a dot on both ends, so the pitch is adjusted to the nearest value that
   * divides the stroke length exactly (it stays within half a pitch of the target over the stroke).
   * Closed strokes are divided into whole intervals around the loop.
   */
  function sampleDots(points, closed, pitch) {
    var L = length(points, closed);
    if (points.length === 1 || L === 0) return [points[0].slice()];
    var n = Math.max(closed ? 3 : 1, Math.round(L / pitch));
    var out = [];
    var count = closed ? n : n + 1;
    for (var k = 0; k < count; k++) out.push(pointAt(points, closed, (L * k) / n));
    return out;
  }

  /* Distance from p to the nearest point on a polyline. */
  function distanceToPolyline(p, points, closed) {
    var pts = closed ? points.concat([points[0]]) : points;
    var best = Infinity;
    if (pts.length === 1) return dist(p, pts[0]);
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var L2 = dx * dx + dy * dy;
      var u = L2 === 0 ? 0 : ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2;
      u = Math.max(0, Math.min(1, u));
      var d = Math.hypot(p[0] - (a[0] + u * dx), p[1] - (a[1] + u * dy));
      if (d < best) best = d;
    }
    return best;
  }

  /* Round to a fixed number of decimals so geometry is reproducible across engines. */
  function q(v, places) {
    var m = Math.pow(10, places === undefined ? 4 : places);
    var r = Math.round(v * m) / m;
    return r === 0 ? 0 : r;   // avoid -0
  }

  HW.geom = {
    dist: dist,
    length: length,
    pointAt: pointAt,
    sampleDots: sampleDots,
    distanceToPolyline: distanceToPolyline,
    q: q
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
