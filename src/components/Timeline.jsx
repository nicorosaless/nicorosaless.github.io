import { useState } from "react";
import { FileText } from "lucide-react";

// Logos come in every shape, from wide wordmarks to square marks. Sizing each one to the same
// area (not the same height) makes them read as equally heavy. `scale` corrects marks with a lot
// of internal whitespace, like a symbol next to small text.
const LOGO_AREA = 2400;
const MAX_W = 128;
const MAX_H = 44;

function Logo({ src, alt, scale = 1 }) {
  const [size, setSize] = useState(null);
  const onLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (!w || !h) return;
    const ratio = w / h;
    let width = Math.sqrt(LOGO_AREA * ratio) * scale;
    let height = width / ratio;
    if (width > MAX_W * scale) [width, height] = [MAX_W * scale, (MAX_W * scale) / ratio];
    if (height > MAX_H) [width, height] = [MAX_H * ratio, MAX_H];
    setSize({ width: Math.round(width), height: Math.round(height) });
  };
  return <img src={src} alt={alt} title={alt} onLoad={onLoad} style={size ?? { height: 28, opacity: 0 }} />;
}

const ICONS = {
  devpost: { label: "Devpost", className: "icon-mask icon-mask--devpost" },
  github: { label: "GitHub", className: "icon-mask icon-mask--github" },
  blog: { label: "Write-up", lucide: FileText },
};

function ResourceLinks({ links, title }) {
  return (
    <span className="xp__links">
      {Object.entries(links).map(([key, href]) => {
        const icon = ICONS[key];
        const Lucide = icon.lucide;
        const external = !href.startsWith("/");
        return (
          <a
            key={key}
            href={href}
            aria-label={`${title} on ${icon.label}`}
            title={icon.label}
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {Lucide ? <Lucide size={19} strokeWidth={1.75} aria-hidden="true" /> : <span className={icon.className} aria-hidden="true" />}
          </a>
        );
      })}
    </span>
  );
}

// Rail · logos · text. Used for both jobs and hackathons.
export default function Timeline({ items }) {
  return (
    <ol className="xp">
      {items.map((item) => (
        <li key={`${item.title}-${item.date}`} className={`xp__item${item.upcoming ? " xp__item--upcoming" : ""} reveal`}>
          <div className="xp__rail" aria-hidden="true">
            <span className="xp__dot" />
          </div>
          <div className={`xp__logo${item.logos.length > 1 ? " xp__logo--stack" : ""}`}>
            {item.logos.map((l) => (
              <Logo key={l.src} {...l} />
            ))}
          </div>
          <div className="xp__body">
            <div className="xp__head">
              <h3 className="xp__role">{item.title}</h3>
              <span className="xp__date">{item.date}</span>
            </div>
            {(item.result || item.links) && (
              <div className="xp__meta">
                {item.result && <span className="xp__result">{item.result}</span>}
                {item.links && <ResourceLinks links={item.links} title={item.title} />}
              </div>
            )}
            {item.body?.split("\n\n").map((para) => (
              <p key={para.slice(0, 24)} className="xp__text">
                {para}
              </p>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
