import { useEffect, useRef, useState } from "react";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function latentToCell(x, y, bounds, columns, rows) {
  const xRatio = clamp((x - bounds.x[0]) / Math.max(bounds.x[1] - bounds.x[0], 1e-6), 0, 1);
  const yRatio = clamp((y - bounds.y[0]) / Math.max(bounds.y[1] - bounds.y[0], 1e-6), 0, 1);
  return {
    col: Math.round(xRatio * (columns - 1)),
    row: Math.round(yRatio * (rows - 1)),
  };
}

function latentToGridIndex(x, y, bounds, width, height) {
  const { col, row } = latentToCell(x, y, bounds, width, height);
  return row * width + col;
}

function topClasses(points, selection, labelNames) {
  const nearest = [];
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const dx = point[0] - selection.x;
    const dy = point[1] - selection.y;
    const distance = dx * dx + dy * dy;
    if (nearest.length < 36) {
      nearest.push([distance, point]);
      nearest.sort((a, b) => a[0] - b[0]);
      continue;
    }
    if (distance >= nearest[nearest.length - 1][0]) continue;
    nearest.pop();
    nearest.push([distance, point]);
    nearest.sort((a, b) => a[0] - b[0]);
  }

  const scores = new Array(labelNames.length).fill(0);
  nearest.forEach(([distance, point]) => {
    const weight = 1 / (Math.sqrt(distance) + 0.02);
    scores[point[2]] += weight;
  });

  const total = scores.reduce((sum, value) => sum + value, 0) || 1;
  return scores
    .map((score, index) => ({ label: labelNames[index], score: score / total, index }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function drawSprite(canvas, image, sheetConfig, spriteIndex) {
  if (!canvas || !image) return;
  const context = canvas.getContext("2d");
  const { tileSize, columns } = sheetConfig;
  const sourceX = (spriteIndex % columns) * tileSize;
  const sourceY = Math.floor(spriteIndex / columns) * tileSize;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, sourceX, sourceY, tileSize, tileSize, 0, 0, canvas.width, canvas.height);
}

function drawOverlay(canvas, points, manifest, selection) {
  if (!canvas || !manifest) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const xRatio = (point[0] - manifest.xBounds[0]) / (manifest.xBounds[1] - manifest.xBounds[0]);
    const yRatio = 1 - (point[1] - manifest.yBounds[0]) / (manifest.yBounds[1] - manifest.yBounds[0]);
    ctx.beginPath();
    ctx.arc(xRatio * width, yRatio * height, 1.6 * dpr, 0, Math.PI * 2);
    ctx.fill();
  }

  const cursorX =
    ((selection.x - manifest.xBounds[0]) / (manifest.xBounds[1] - manifest.xBounds[0])) * width;
  const cursorY =
    (1 - (selection.y - manifest.yBounds[0]) / (manifest.yBounds[1] - manifest.yBounds[0])) * height;

  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath();
  ctx.arc(cursorX, cursorY, 7 * dpr, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  ctx.moveTo(0, cursorY);
  ctx.lineTo(cursorX - 10 * dpr, cursorY);
  ctx.moveTo(cursorX + 10 * dpr, cursorY);
  ctx.lineTo(width, cursorY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cursorX, 0);
  ctx.lineTo(cursorX, cursorY - 10 * dpr);
  ctx.moveTo(cursorX, cursorY + 10 * dpr);
  ctx.lineTo(cursorX, height);
  ctx.stroke();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export default function SoleSpaceDemo() {
  const atlasContainerRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const decodedCanvasRef = useRef(null);

  const [bundle, setBundle] = useState(null);
  const [selection, setSelection] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBundle() {
      try {
        const manifest = await fetch("/web/manifest.json").then((response) => response.json());
        const [gridData, pointsData, atlasImage, decodedImage] = await Promise.all([
          fetch(manifest.gridData).then((response) => response.json()),
          fetch(manifest.pointsData).then((response) => response.json()),
          loadImage(manifest.atlasImage),
          loadImage(manifest.decodedSprites.src),
        ]);

        if (!isMounted) return;
        const initialPreset = manifest.presets[0] ?? {
          x: (manifest.xBounds[0] + manifest.xBounds[1]) / 2,
          y: (manifest.yBounds[0] + manifest.yBounds[1]) / 2,
          label: "Center",
        };
        setBundle({ manifest, gridData, points: pointsData.points, atlasImage, decodedImage });
        setSelection({ x: initialPreset.x, y: initialPreset.y });
      } catch {
        if (!isMounted) return;
        setError("Missing `/web` assets. Run the export script and copy the bundle into `public/web`.");
      }
    }

    loadBundle();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!bundle || !selection) return;
    drawOverlay(overlayCanvasRef.current, bundle.points, bundle.manifest, selection);

    const { col, row } = latentToCell(
      selection.x,
      selection.y,
      { x: bundle.manifest.xBounds, y: bundle.manifest.yBounds },
      bundle.manifest.decodedSprites.columns,
      bundle.manifest.decodedSprites.rows,
    );
    const decodedIndex = row * bundle.manifest.decodedSprites.columns + col;
    drawSprite(decodedCanvasRef.current, bundle.decodedImage, bundle.manifest.decodedSprites, decodedIndex);
  }, [bundle, selection]);

  useEffect(() => {
    if (!bundle || !selection) return;
    const handleResize = () => {
      drawOverlay(overlayCanvasRef.current, bundle.points, bundle.manifest, selection);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [bundle, selection]);

  function setSelectionFromPointer(clientX, clientY) {
    if (!bundle || !atlasContainerRef.current) return;
    const rect = atlasContainerRef.current.getBoundingClientRect();
    const xRatio = clamp((clientX - rect.left) / rect.width, 0, 1);
    const yRatio = clamp((clientY - rect.top) / rect.height, 0, 1);
    const x = bundle.manifest.xBounds[0] + xRatio * (bundle.manifest.xBounds[1] - bundle.manifest.xBounds[0]);
    const y = bundle.manifest.yBounds[1] - yRatio * (bundle.manifest.yBounds[1] - bundle.manifest.yBounds[0]);
    setSelection({ x, y });
  }

  if (error) {
    return (
      <section className="solespace-state">
        <p>{error}</p>
      </section>
    );
  }

  if (!bundle || !selection) {
    return (
      <section className="solespace-state">
        <p>Loading latent atlas…</p>
      </section>
    );
  }

  const bounds = { x: bundle.manifest.xBounds, y: bundle.manifest.yBounds };
  const gridIndex = latentToGridIndex(selection.x, selection.y, bounds, bundle.gridData.width, bundle.gridData.height);
  const density = bundle.gridData.densityGrid[gridIndex] / 255;
  const confidence = bundle.gridData.confidenceGrid[gridIndex] / 255;
  const regionLabelIndex = bundle.gridData.regionGrid[gridIndex];
  const rankedClasses = topClasses(bundle.points, selection, bundle.manifest.labelNames);

  return (
    <section className="solespace-shell">
      <div className="solespace-layout">
        <div className="solespace-panel">
          <div className="solespace-panel-head">
            <p className="solespace-kicker">Latent atlas</p>
          </div>

          <div
            ref={atlasContainerRef}
            className="solespace-atlas"
            onPointerDown={(event) => {
              setDragging(true);
              setSelectionFromPointer(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (!dragging) return;
              setSelectionFromPointer(event.clientX, event.clientY);
            }}
            onPointerUp={() => setDragging(false)}
            onPointerLeave={() => setDragging(false)}
          >
            <img className="solespace-atlas-image" src="/web/atlas.png" alt="" />
            <canvas ref={overlayCanvasRef} className="solespace-atlas-overlay" />
          </div>
        </div>

        <div className="solespace-panel solespace-panel--right">
          <div className="solespace-panel-head">
            <p className="solespace-kicker">Decoded output</p>
            <span className="solespace-coords">
              x {selection.x.toFixed(2)} y {selection.y.toFixed(2)}
            </span>
          </div>

          <div className="solespace-decode-card">
            <div className="solespace-decode-stage">
              <canvas ref={decodedCanvasRef} width="280" height="280" className="solespace-decoded-canvas" />
            </div>

            <div className="solespace-decode-meta">
              <div className="solespace-meta-grid">
                <article>
                  <span>Region label</span>
                  <strong>{bundle.manifest.labelNames[regionLabelIndex]}</strong>
                </article>
                <article>
                  <span>Density</span>
                  <strong>{density.toFixed(2)}</strong>
                </article>
                <article>
                  <span>Confidence</span>
                  <strong>{confidence.toFixed(2)}</strong>
                </article>
              </div>

              <div className="solespace-rank-list">
                <p>Top nearby classes</p>
                {rankedClasses.map((entry) => (
                  <div key={entry.label} className="solespace-rank-row">
                    <span>{entry.label}</span>
                    <strong>{(entry.score * 100).toFixed(1)}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
