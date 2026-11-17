import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Moon, Sun } from "lucide-react";
import { posts } from "virtual:blog";
import { hackathons, jobs, links } from "./data/profile";
import Timeline from "./components/Timeline";
import Interests from "./components/Interests";
import SoleSpaceDemo from "./components/SoleSpaceDemo";

const HOME_URL = import.meta.env.BASE_URL;
const BLOG_URL = `${HOME_URL}blog/`;
const THEME_KEY = "theme";
const t = { copyCode: "Copy", copied: "Copied" };

const postUrl = (slug) => `${HOME_URL}${slug}/`;
const trim = (path) => path.replace(/\/+$/, "");

function getCurrentRoute() {
  const path = trim(window.location.pathname);
  if (path === trim(BLOG_URL)) return { page: "blog" };
  const post = posts.find((p) => path === trim(postUrl(p.slug)));
  if (post) return { page: "post", post };
  const hash = window.location.hash || "#home";
  if (hash === "#solespace") return { page: "solespace" };
  const legacy = posts.find((p) => hash === `#${p.slug}`);
  if (legacy) {
    // Old links to /#slug land on the post's own path.
    window.history.replaceState(null, "", postUrl(legacy.slug));
    return { page: "post", post: legacy };
  }
  return { page: "home" };
}

function readTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    // Storage blocked: fall back to the system.
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function useTheme() {
  const [theme, setTheme] = useState(readTheme);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode: preference just won't persist.
    }
    setTheme(next);
  };
  return [theme, toggle];
}

// Posts are written in Spanish and English; the site is English, so prefer that.
const tr = (post) => post.translations.en ?? Object.values(post.translations)[0];
const postLang = (post) => (post.translations.en ? "en" : Object.keys(post.translations)[0]);

const formatDate = (iso) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function TopBar({ page, theme, onThemeToggle }) {
  const Icon = theme === "dark" ? Sun : Moon;
  const label = theme === "dark" ? "Light mode" : "Dark mode";
  return (
    <header className="top-bar">
      <nav className="top-nav">
        <a href={HOME_URL} aria-current={page === "home" ? "page" : undefined}>
          home
        </a>
        <a href={BLOG_URL} aria-current={page === "blog" || page === "post" ? "page" : undefined}>
          blog
        </a>
      </nav>
      <button type="button" className="theme-toggle" onClick={onThemeToggle} aria-label={label} title={label}>
        <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </header>
  );
}

function PostList({ items }) {
  return (
    <ul className="post-list">
      {items.map((post) => (
        <li key={post.slug}>
          <a className="post-link" href={postUrl(post.slug)}>
            <span className="post-link__title">
              {tr(post).title}
              {tr(post).draft && <span className="draft-badge">draft</span>}
            </span>
            <span className="post-link__date">{formatDate(tr(post).date)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Footer() {
  const items = [
    { label: "GitHub", href: links.github },
    { label: "LinkedIn", href: links.linkedin },
    { label: "Email", href: links.email },
  ];
  return (
    <footer className="footer">
      {items.map((l) => (
        <a key={l.label} href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
          <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden="true" />
          {l.label}
        </a>
      ))}
      <a href={links.resume} download="Nicolas Rosales Resume.pdf">
        <ArrowDown size={13} strokeWidth={1.75} aria-hidden="true" />
        Resume
      </a>
    </footer>
  );
}

function HomePage() {
  useReveal();
  const latest = posts.slice(0, 3);
  return (
    <>
      <section className="intro">
        <h1 className="intro__title">Nicolas Rosales</h1>
        <div className="intro__body">
          <p>
            I'm Nicolas, an Artificial Intelligence student at UPC in Barcelona. I was a Software Engineer at Quality
            Chemicals, building Kora, their operations platform for regulated industries, and spent two summers as an AI
            Engineer intern at Accenture working on agents and GraphRAG. In January I join Mango's product team as a data
            science intern.
          </p>
          <p>
            In my free time I study whatever catches my interest in maths and machine learning, go to the gym, and also
            enjoy wrestling, BJJ and racket sports. Right now I'm most interested in audio models.
          </p>
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Experience</h2>
        <Timeline items={jobs} />
      </section>

      <section className="section">
        <h2 className="section__title">Interests</h2>
        <Interests />
      </section>

      <section className="section">
        <h2 className="section__title">Hackathons</h2>
        <Timeline items={hackathons} />
      </section>

      {latest.length > 0 && (
        <section className="section">
          <h2 className="section__title">Latest blog posts</h2>
          <PostList items={latest} />
          <a className="go-link" href={BLOG_URL}>
            Go to blog →
          </a>
        </section>
      )}
    </>
  );
}

function BlogPage() {
  useEffect(() => {
    document.title = "Blog · Nicolas Rosales";
  }, []);
  return (
    <section>
      <h1 className="intro__title">Blog</h1>
      <PostList items={posts} />
    </section>
  );
}

function SoleSpacePage() {
  return (
    <div>
      <h1 className="post-title">SoleSpace</h1>
      <SoleSpaceDemo />
    </div>
  );
}

function Post({ post }) {
  const text = tr(post);
  const bodyRef = useRef(null);

  useEffect(() => {
    document.title = `${text.title} · Nicolas Rosales`;
  }, [text.title]);

  useEffect(() => {
    const body = bodyRef.current;
    async function onClick(event) {
      const button = event.target.closest("[data-copy]");
      if (!button) return;
      const code = button.closest(".code")?.querySelector("pre")?.innerText ?? "";
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = t.copied;
      } catch {
        button.textContent = "×";
      }
      setTimeout(() => (button.textContent = t.copyCode), 1400);
    }
    body.querySelectorAll("[data-copy]").forEach((b) => (b.textContent = t.copyCode));
    body.addEventListener("click", onClick);
    return () => body.removeEventListener("click", onClick);
  }, [text.html]);

  return (
    <article lang={postLang(post)}>
      <p className="post-meta">
        {formatDate(text.date)} · {text.minutes} min read
        {text.draft && <span className="draft-badge">draft</span>}
      </p>
      <h1 className="post-title">{text.title}</h1>
      <div className="prose" ref={bodyRef} dangerouslySetInnerHTML={{ __html: text.html }} />
    </article>
  );
}

export default function App() {
  const [route, setRoute] = useState(getCurrentRoute);
  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    function handleHashChange() {
      setRoute(getCurrentRoute());
      window.scrollTo(0, 0);
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  let page;
  if (route.page === "solespace") page = <SoleSpacePage />;
  else if (route.page === "post") page = <Post post={route.post} />;
  else if (route.page === "blog") page = <BlogPage />;
  else page = <HomePage />;

  return (
    <div className="site">
      <main className={`site-shell site-shell--${route.page}`}>
        <TopBar page={route.page} theme={theme} onThemeToggle={toggleTheme} />
        {page}
        <Footer />
      </main>
    </div>
  );
}
