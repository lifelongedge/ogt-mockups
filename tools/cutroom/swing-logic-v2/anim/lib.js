/* lib.js — shared drawing primitives for the swing-logic v2 overdub animations.
 *
 * Every anim-*.html loads this, then defines window.renderFrame(t) in terms of
 * it. Pure canvas, no DOM, no timers, no randomness: renderFrame(t) must draw
 * the identical frame for the same t every time or the frame-stepped renderer
 * in scripts/build_v2.py produces judder.
 *
 * Draft durations are ~40s. The real cut lengths (258s-798s) are not known
 * until the cutroom pass trims them, and the beat timings then re-anchor to the
 * VO/source SRT. Keep BEATS as data so that re-anchoring is an edit, not a
 * rewrite.
 */
(function (global) {
  'use strict';

  var W = 1280, H = 720;

  var C = {
    bg: '#0d0d0b',
    panel: '#15140e',
    panel2: '#1d1b13',
    border: '#302c22',
    fg: '#ece7d9',
    dim: '#9c9481',
    faint: '#6b6555',
    amber: '#e0a441',
    amberDim: '#a8752b',
    green: '#6fae6b',
    red: '#c0554a',
    blue: '#5b8fb9',
    violet: '#8f7bb5'
  };

  var F = {
    title: '300 40px Georgia, serif',
    sub: '300 21px Georgia, serif',
    label: '600 13px "SF Mono", Menlo, Consolas, monospace',
    num: '500 17px "SF Mono", Menlo, Consolas, monospace',
    small: '500 12px "SF Mono", Menlo, Consolas, monospace',
    body: '300 19px Georgia, serif'
  };

  /* ---------- timing ---------- */

  // eased 0..1 progress of a beat starting at `start` running `dur` seconds
  function beat(t, start, dur) {
    if (dur <= 0) return t >= start ? 1 : 0;
    var p = (t - start) / dur;
    return p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p);
  }
  // linear equivalent, for anything that must not ease (scrubs, sweeps)
  function lin(t, start, dur) {
    if (dur <= 0) return t >= start ? 1 : 0;
    var p = (t - start) / dur;
    return p <= 0 ? 0 : p >= 1 ? 1 : p;
  }
  // 0 -> 1 -> 0, for things that appear and leave
  function pulse(t, start, dur) {
    var p = lin(t, start, dur);
    return Math.sin(p * Math.PI);
  }
  function lerp(a, b, p) { return a + (b - a) * p; }

  /* ---------- canvas basics ---------- */

  function clear(x) {
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.fillStyle = C.bg;
    x.fillRect(0, 0, W, H);
  }

  function rr(x, a, b, w, h, r) {
    x.beginPath();
    x.moveTo(a + r, b);
    x.arcTo(a + w, b, a + w, b + h, r);
    x.arcTo(a + w, b + h, a, b + h, r);
    x.arcTo(a, b + h, a, b, r);
    x.arcTo(a, b, a + w, b, r);
    x.closePath();
  }

  function text(x, s, px, py, font, color, align, alpha) {
    x.save();
    x.globalAlpha = alpha === undefined ? 1 : alpha;
    x.font = font;
    x.fillStyle = color;
    x.textAlign = align || 'left';
    x.textBaseline = 'alphabetic';
    x.fillText(s, px, py);
    x.restore();
  }

  // word-wrapped body copy; returns the y after the last line
  function para(x, s, px, py, maxW, lh, font, color, alpha) {
    x.save();
    x.font = font; x.fillStyle = color;
    x.globalAlpha = alpha === undefined ? 1 : alpha;
    var words = s.split(' '), line = '', y = py;
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (x.measureText(test).width > maxW && line) {
        x.fillText(line, px, y); y += lh; line = words[i];
      } else line = test;
    }
    if (line) { x.fillText(line, px, y); y += lh; }
    x.restore();
    return y;
  }

  // draw a path progressively: 0..p of the polyline
  function polyline(x, pts, p, color, width, alpha) {
    if (pts.length < 2) return;
    var n = Math.max(2, Math.floor(pts.length * p));
    x.save();
    x.globalAlpha = alpha === undefined ? 1 : alpha;
    x.strokeStyle = color; x.lineWidth = width || 2;
    x.lineJoin = 'round'; x.lineCap = 'round';
    x.beginPath();
    x.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < n; i++) x.lineTo(pts[i][0], pts[i][1]);
    x.stroke();
    x.restore();
  }

  function hline(x, y, x0, x1, color, width, dash, alpha) {
    x.save();
    x.globalAlpha = alpha === undefined ? 1 : alpha;
    x.strokeStyle = color; x.lineWidth = width || 1;
    if (dash) x.setLineDash(dash);
    x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y); x.stroke();
    x.restore();
  }

  /* ---------- frame chrome ---------- */

  // Top-left segment tag + optional illustrative marker. Every conceptual
  // diagram must carry the marker: this program does not let a drawn shape
  // pass as market history.
  function chrome(x, o) {
    x.save();
    x.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    x.font = F.label;
    text(x, o.seg, 46, 52, F.label, C.amberDim);
    if (o.label) text(x, o.label, 46 + x.measureText(o.seg).width + 18, 52, F.label, C.faint);
    // Top-right, not bottom-right: the closing line of every scene lands at the
    // bottom centre and was overlapping this.
    if (o.illustrative) {
      text(x, 'ILLUSTRATIVE — NOT MARKET DATA', W - 46, 52, F.small, C.faint, 'right');
    } else if (o.sourceNote) {
      text(x, o.sourceNote, W - 46, 52, F.small, C.faint, 'right');
    }
    x.restore();
  }

  // Centred title card that fades up then out
  function titleCard(x, title, sub, t, start, hold) {
    var a = beat(t, start, 0.9) * (1 - beat(t, start + hold, 0.7));
    if (a <= 0.01) return 0;
    text(x, title, W / 2, H / 2 - 6, F.title, C.fg, 'center', a);
    if (sub) text(x, sub, W / 2, H / 2 + 34, F.sub, C.dim, 'center', a * 0.9);
    return a;
  }

  /* ---------- charts ---------- */

  // box = {x,y,w,h}; bars = [[date,o,h,l,c], ...]
  function scaleFor(bars, box, pad) {
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < bars.length; i++) {
      if (bars[i][3] < lo) lo = bars[i][3];
      if (bars[i][2] > hi) hi = bars[i][2];
    }
    var m = (hi - lo) * (pad === undefined ? 0.08 : pad);
    lo -= m; hi += m;
    return {
      lo: lo, hi: hi,
      y: function (p) { return box.y + box.h - (p - lo) / (hi - lo) * box.h; },
      x: function (i) { return box.x + (i + 0.5) / bars.length * box.w; },
      bw: Math.max(2, box.w / bars.length * 0.62)
    };
  }

  // progressive candles: draws floor(p * n) of them
  function candles(x, bars, box, s, p, o) {
    o = o || {};
    var n = Math.max(0, Math.min(bars.length, Math.floor(bars.length * p)));
    x.save();
    x.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    for (var i = 0; i < n; i++) {
      var b = bars[i], up = b[4] >= b[1];
      var col = o.mono ? C.dim : (up ? C.green : C.red);
      var cx = s.x(i), bw = s.bw;
      x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 1;
      x.beginPath();
      x.moveTo(cx, s.y(b[2])); x.lineTo(cx, s.y(b[3]));
      x.stroke();
      var y0 = s.y(Math.max(b[1], b[4])), y1 = s.y(Math.min(b[1], b[4]));
      x.fillRect(cx - bw / 2, y0, bw, Math.max(1, y1 - y0));
    }
    x.restore();
  }

  // Labelled horizontal price level. The label sits INSIDE the pane, above the
  // line — hanging it off the right edge pushed it into the neighbouring pane.
  function level(x, s, box, price, label, color, p, o) {
    o = o || {};
    if (p <= 0) return;
    var y = s.y(price);
    hline(x, y, box.x, box.x + box.w * p, color, o.width || 1.5,
          o.dash === undefined ? [5, 4] : o.dash, o.alpha);
    if (p > 0.55 && label) {
      var a = (o.alpha === undefined ? 1 : o.alpha) * beat(p, 0.55, 0.25);
      var lx = o.labelRight ? box.x + box.w - 8 : box.x + 8;
      text(x, label, lx, y - 8, F.small, color, o.labelRight ? 'right' : 'left', a);
    }
  }

  // faint frame + grid for a chart pane
  function pane(x, box, title, alpha) {
    x.save();
    x.globalAlpha = alpha === undefined ? 1 : alpha;
    x.fillStyle = C.panel;
    rr(x, box.x - 14, box.y - 14, box.w + 28, box.h + 40, 8); x.fill();
    x.strokeStyle = C.border; x.lineWidth = 1; x.stroke();
    if (title) text(x, title, box.x, box.y - 22, F.label, C.faint);
    x.restore();
  }

  global.A = {
    W: W, H: H, C: C, F: F,
    beat: beat, lin: lin, pulse: pulse, lerp: lerp,
    clear: clear, rr: rr, text: text, para: para,
    polyline: polyline, hline: hline,
    chrome: chrome, titleCard: titleCard,
    scaleFor: scaleFor, candles: candles, level: level, pane: pane
  };
})(window);
