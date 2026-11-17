// Renders ```chart blocks (YAML spec) to static SVG at build time.
// Colors come from CSS custom properties, so charts follow the site theme.
import YAML from "yaml";

const W = 640;
const H = 320;
const PAD = { top: 16, right: 16, bottom: 36, left: 48 };
const SERIES_VARS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4"];

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function niceTicks(min, max, count = 5) {
  if (min === max) max = min + 1;
  const span = max - min;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? 10 * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
  return ticks;
}

const fmt = (v) => (Math.abs(v) >= 1000 ? v.toLocaleString("en-US") : String(+v.toFixed(3)));

function normalize(spec) {
  const type = spec.type ?? "line";
  if (!["line", "bar"].includes(type)) throw new Error(`chart: unknown type "${type}" (use line | bar)`);
  const series = spec.series ?? (spec.data ? [{ name: spec.name ?? "", data: spec.data }] : null);
  if (!series?.length) throw new Error("chart: needs `series` (or `data`)");
  const n = Math.max(...series.map((s) => s.data.length));
  const x = spec.x ?? Array.from({ length: n }, (_, i) => i + 1);
  return { ...spec, type, series, x };
}

export function renderChart(source) {
  const spec = normalize(YAML.parse(source));
  const { type, series, x } = spec;
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;

  const values = series.flatMap((s) => s.data).filter((v) => v != null);
  const yMin = spec.y_min ?? Math.min(type === "bar" ? 0 : Infinity, ...values);
  const yMax = spec.y_max ?? Math.max(...values);
  const ticks = niceTicks(yMin, yMax);
  const t0 = ticks[0];
  const t1 = ticks.at(-1);
  const sy = (v) => PAD.top + ih - ((v - t0) / (t1 - t0)) * ih;

  const parts = [];

  for (const t of ticks) {
    const y = sy(t).toFixed(1);
    parts.push(`<line class="chart__grid" x1="${PAD.left}" x2="${W - PAD.right}" y1="${y}" y2="${y}"/>`);
    parts.push(`<text class="chart__tick" x="${PAD.left - 8}" y="${y}" text-anchor="end" dominant-baseline="middle">${fmt(t)}</text>`);
  }

  const band = iw / x.length;
  const sx = (i) => (type === "bar" ? PAD.left + band * (i + 0.5) : PAD.left + (x.length === 1 ? iw / 2 : (i / (x.length - 1)) * iw));
  const labelEvery = Math.ceil(x.length / 10);
  x.forEach((label, i) => {
    if (i % labelEvery) return;
    parts.push(`<text class="chart__tick" x="${sx(i).toFixed(1)}" y="${H - PAD.bottom + 18}" text-anchor="middle">${esc(label)}</text>`);
  });

  series.forEach((s, si) => {
    const color = `var(${SERIES_VARS[si % SERIES_VARS.length]})`;
    if (type === "line") {
      const pts = s.data.map((v, i) => (v == null ? null : [sx(i), sy(v)]));
      const d = pts.reduce((acc, p, i) => (p ? acc + `${acc && pts[i - 1] ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}` : acc), "");
      parts.push(`<path class="chart__line" d="${d}" style="stroke:${color}"/>`);
      pts.forEach((p, i) => {
        if (!p) return;
        parts.push(`<circle class="chart__dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" style="fill:${color}"><title>${esc(s.name ? `${s.name} · ` : "")}${esc(x[i])}: ${fmt(s.data[i])}</title></circle>`);
      });
    } else {
      const gap = band * 0.2;
      const bw = (band - gap) / series.length;
      s.data.forEach((v, i) => {
        if (v == null) return;
        const bx = PAD.left + band * i + gap / 2 + bw * si;
        const top = sy(Math.max(v, 0));
        const h = Math.abs(sy(v) - sy(0));
        parts.push(`<rect class="chart__bar" x="${bx.toFixed(1)}" y="${top.toFixed(1)}" width="${Math.max(bw - 1, 1).toFixed(1)}" height="${h.toFixed(1)}" style="fill:${color}"><title>${esc(s.name ? `${s.name} · ` : "")}${esc(x[i])}: ${fmt(v)}</title></rect>`);
      });
    }
  });

  const label = spec.title ?? series.map((s) => s.name).filter(Boolean).join(", ");
  const legend =
    series.length > 1 || series[0].name
      ? `<ul class="chart__legend">${series
          .map((s, si) => `<li><span style="background:var(${SERIES_VARS[si % SERIES_VARS.length]})"></span>${esc(s.name ?? "")}</li>`)
          .join("")}</ul>`
      : "";

  return `<figure class="chart">${spec.title ? `<figcaption class="chart__title">${esc(spec.title)}</figcaption>` : ""}${legend}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${parts.join("")}</svg>${
    spec.y_label || spec.x_label
      ? `<p class="chart__axes">${[spec.y_label && `↑ ${esc(spec.y_label)}`, spec.x_label && `→ ${esc(spec.x_label)}`].filter(Boolean).join(" · ")}</p>`
      : ""
  }${spec.caption ? `<p class="chart__caption">${esc(spec.caption)}</p>` : ""}</figure>`;
}
