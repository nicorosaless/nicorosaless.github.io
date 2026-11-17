import { useEffect, useRef } from "react";

// A fine triangular mesh that only exists around the cursor's recent path and bulges outward
// under the pointer like a lens. Anything near readable content is faded out, so
// the pattern lives in the margins and gaps, never under text.

const SPACING = 30; // lattice pitch, px
const ROW = (SPACING * Math.sqrt(3)) / 2;
const RADIUS = 190; // reach of one trail point
const LIFE_MS = 1400; // how long a trail point lingers
const MAX_ALPHA = 0.2;
const LENS = 150; // radius of the cursor lens
const BULGE = 0.2; // how far the lens pushes nodes, as a share of its radius
const FADE = 56; // distance over which the pattern fades in next to content
const PAD = 10; // content boxes are grown by this before measuring
const CONTENT =
  ".top-bar, .intro__title, .intro__body p, .section__title, .xp__item, .interests, .post-list li, .go-link, .footer, .post-meta, .post-title, .prose > *, .site-shell canvas";

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

export default function GeoField() {
  const ref = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || still) return;

    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let dpr = 1;
    let rects = [];
    let rectsAt = 0;
    let trail = []; // { x, y, t } in document coordinates
    let frame = 0;
    let last = null;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      rectsAt = 0;
      schedule();
    };

    // Content boxes in document coordinates; re-measured at most twice a second.
    const measure = (now) => {
      if (now - rectsAt < 500) return;
      rectsAt = now;
      const sx = window.scrollX;
      const sy = window.scrollY;
      rects = [...document.querySelectorAll(CONTENT)].map((el) => {
        const r = el.getBoundingClientRect();
        return [r.left + sx - PAD, r.top + sy - PAD, r.right + sx + PAD, r.bottom + sy + PAD];
      });
    };

    const clearance = (x, y) => {
      let best = Infinity;
      for (const [l, t, r, b] of rects) {
        const dx = x < l ? l - x : x > r ? x - r : 0;
        const dy = y < t ? t - y : y > b ? y - b : 0;
        if (dx === 0 && dy === 0) return 0;
        const d = Math.hypot(dx, dy);
        if (d < best) best = d;
      }
      return best;
    };

    const draw = (now) => {
      frame = 0;
      measure(now);
      trail = trail.filter((p) => now - p.t < LIFE_MS);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!trail.length) return;

      const sx = window.scrollX;
      const sy = window.scrollY;
      const rgb = getComputedStyle(document.documentElement).getPropertyValue("--fg-rgb").trim() || "128,128,128";
      const live = trail.map((p) => ({ x: p.x, y: p.y, k: 1 - (now - p.t) / LIFE_MS }));

      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const p of live) {
        x0 = Math.min(x0, p.x - RADIUS);
        y0 = Math.min(y0, p.y - RADIUS);
        x1 = Math.max(x1, p.x + RADIUS);
        y1 = Math.max(y1, p.y + RADIUS);
      }
      const j0 = Math.floor(y0 / ROW) - 1;
      const j1 = Math.ceil(y1 / ROW) + 1;
      const i0 = Math.floor(x0 / SPACING) - 1;
      const i1 = Math.ceil(x1 / SPACING) + 1;

      const field = (x, y) => {
        let v = 0;
        for (const p of live) {
          const d = Math.hypot(x - p.x, y - p.y);
          if (d < RADIUS) v = Math.max(v, p.k * smooth(1 - d / RADIUS));
        }
        return v;
      };

      // Node strengths, measured on the undistorted lattice.
      const cols = i1 - i0 + 1;
      const amp = new Float32Array(cols * (j1 - j0 + 1));
      const base = (i, j) => [i * SPACING + (j & 1 ? SPACING / 2 : 0), j * ROW];
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const [x, y] = base(i, j);
          const f = field(x, y);
          amp[(j - j0) * cols + (i - i0)] = f > 0.01 ? f * smooth(clearance(x, y) / FADE) : 0;
        }
      }
      const at = (i, j) => (i < i0 || i > i1 || j < j0 || j > j1 ? 0 : amp[(j - j0) * cols + (i - i0)]);

      // The newest trail point bends the mesh outward like a lens.
      const head = live[live.length - 1];
      const node = (i, j) => {
        const [x, y] = base(i, j);
        const dx = x - head.x;
        const dy = y - head.y;
        const d = Math.hypot(dx, dy);
        if (d >= LENS || d === 0) return [x, y];
        const push = (LENS * BULGE * head.k * smooth(1 - d / LENS)) / d;
        return [x + dx * push, y + dy * push];
      };

      ctx.translate(-sx, -sy);
      ctx.lineWidth = 0.6;
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const a = at(i, j);
          if (a < 0.02) continue;
          const [x, y] = node(i, j);
          const down = j & 1 ? i : i - 1;
          for (const [ni, nj] of [[i + 1, j], [down, j + 1], [down + 1, j + 1]]) {
            const b = Math.min(a, at(ni, nj));
            if (b < 0.02) continue;
            const [nx, ny] = node(ni, nj);
            ctx.strokeStyle = `rgba(${rgb}, ${(b * MAX_ALPHA).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(nx, ny);
            ctx.stroke();
          }
          ctx.fillStyle = `rgba(${rgb}, ${Math.min(1, a * MAX_ALPHA * 2).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      schedule();
    };

    function schedule() {
      if (!frame) frame = requestAnimationFrame(draw);
    }

    const onMove = (e) => {
      const x = e.clientX + window.scrollX;
      const y = e.clientY + window.scrollY;
      // Drop points closer than a few px to the last one; the trail stays short.
      if (!last || !trail.includes(last) || Math.hypot(x - last.x, y - last.y) > 14) {
        last = { x, y, t: performance.now() };
        trail.push(last);
        if (trail.length > 28) trail.shift();
      } else {
        last.t = performance.now();
      }
      schedule();
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", schedule);
    };
  }, []);

  return <canvas ref={ref} className="geo-field" aria-hidden="true" />;
}
