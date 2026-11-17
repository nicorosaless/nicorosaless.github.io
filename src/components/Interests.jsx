import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { interests } from "../data/profile";

const countLeaves = (node) => (node.children ? node.children.reduce((n, c) => n + countLeaves(c), 0) : 1);

// Threads drop as the section scrolls: each one is uncovered down to a line 75% into the
// viewport, offset a little per index so they fall as a wave from left to right.
function useDrop(ref) {
  useEffect(() => {
    const root = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const threads = [...root.querySelectorAll(".thread")];
    let boxes = [];
    let raf = 0;

    const measure = () => {
      const base = root.getBoundingClientRect().top;
      boxes = threads.map((el, i) => {
        const r = el.getBoundingClientRect();
        return { el, top: r.top - base, height: r.height, lag: i * 10 };
      });
    };

    const paint = () => {
      raf = 0;
      const drawn = reduced ? Infinity : window.innerHeight * 0.75 - root.getBoundingClientRect().top;
      root.classList.toggle("is-started", drawn > 0);
      root.classList.toggle("is-split", drawn > 60);
      for (const b of boxes) {
        const shown = Math.max(0, Math.min(b.height, drawn - b.top - b.lag));
        b.el.style.clipPath = shown >= b.height ? "" : `inset(0 0 ${b.height - shown}px 0)`;
        b.el.classList.toggle("is-falling", shown > 0 && shown < b.height);
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const onResize = () => {
      threads.forEach((el) => (el.style.clipPath = ""));
      measure();
      paint();
    };

    measure();
    paint();
    window.addEventListener("scroll", schedule, { passive: true });
    const ro = new ResizeObserver(onResize);
    ro.observe(root);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
    };
  }, [ref]);
}

function Thread({ leaf, onFocus }) {
  const Tag = leaf.href ? "a" : "span";
  const linkProps = leaf.href ? { href: leaf.href, target: "_blank", rel: "noreferrer" } : { tabIndex: 0 };
  return (
    <li className="thread">
      <Tag
        className="thread__hit"
        {...linkProps}
        onMouseEnter={() => onFocus(leaf)}
        onFocus={() => onFocus(leaf)}
        onClick={leaf.href ? undefined : () => onFocus(leaf)}
      >
        <span className="thread__text">{leaf.label}</span>
      </Tag>
    </li>
  );
}

export default function Interests() {
  const ref = useRef(null);
  const [active, setActive] = useState(null);
  useDrop(ref);

  return (
    <div className="interests" ref={ref} onMouseLeave={() => setActive(null)}>
      <ul className="fields">
        {interests.map((field, f) => (
          <li key={field.id} className="field" style={{ flexGrow: countLeaves(field), "--i": f }}>
            <span className="field__line" aria-hidden="true" />
            <span className="field__label">{field.label}</span>
            <ul className="topics">
              {field.children.map((topic) => (
                <li key={topic.label} className="topic" style={{ flexGrow: topic.children.length }}>
                  <span className="topic__line" aria-hidden="true" />
                  <span className="topic__label">{topic.label}</span>
                  <ul className="threads">
                    {topic.children.map((leaf) => (
                      <Thread key={leaf.label} leaf={leaf} onFocus={setActive} />
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="interests__caption" aria-live="polite">
        {active && (
          <>
            <span className="interests__caption-label">
              {active.label}
              {active.href && <ArrowUpRight size={12} strokeWidth={1.75} aria-hidden="true" />}
            </span>
            <span className="interests__caption-note">{active.note}</span>
          </>
        )}
      </p>
    </div>
  );
}
