import { useEffect, useState } from "react";
import { siteContent } from "./data/siteContent";
import { copy } from "./data/copy";
import SoleSpaceDemo from "./components/SoleSpaceDemo";

const RESUME_URL = `${import.meta.env.BASE_URL}${encodeURI("Nicolas Rosales Resume.pdf")}`;
const GITHUB_URL = siteContent.socialLinks.find((l) => l.label === "GitHub").url;
const LANG_KEY = "lang";
const HOME_URL = import.meta.env.BASE_URL;
const MAPS_POST_URL = `${HOME_URL}maps/`;
const MAPS_SLIDES_URL = `${MAPS_POST_URL}slides/`;
const MAPS_CODE_URL = "https://github.com/nicorosaless/respirahackathon2026";

function getCurrentRoute() {
  if (window.location.pathname === MAPS_POST_URL) return { page: "maps" };
  const hash = window.location.hash || "#home";
  if (hash === "#solespace") return { page: "solespace" };
  if (hash === "#maps") {
    // Old links to /#maps land on the post's own path.
    window.history.replaceState(null, "", MAPS_POST_URL);
    return { page: "maps" };
  }
  return { page: "home" };
}

function getInitialLang() {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === "es" || stored === "en") return stored;
  return "es";
}

function LangToggle({ lang, onChange, label }) {
  return (
    <div className="lang-toggle" role="group" aria-label={label}>
      <button type="button" aria-pressed={lang === "es"} onClick={() => onChange("es")}>
        ES
      </button>
      <span aria-hidden="true">/</span>
      <button type="button" aria-pressed={lang === "en"} onClick={() => onChange("en")}>
        EN
      </button>
    </div>
  );
}

function HomePage({ t, lang, onLangChange }) {
  return (
    <div>
      <header className="home-header">
        <span className="home-header__name">Nicolas Rosales</span>
        <LangToggle lang={lang} onChange={onLangChange} label={t.langLabel} />
      </header>

      <p className="intro-body">{t.intro}</p>

      <section className="projects">
        <h2 className="projects__title">{t.blog}</h2>
        <a className="post-link" href={MAPS_POST_URL}>
          <span className="post-link__title">{t.mapsTitle}</span>
          <span className="post-link__date">{t.mapsDate}</span>
        </a>
      </section>

      <section className="contact">
        <a className="underline-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <span className="contact__email">{siteContent.email}</span>
        <a className="underline-link" href={RESUME_URL} target="_blank" rel="noreferrer">
          {t.cv}
        </a>
      </section>
    </div>
  );
}

function SoleSpacePage({ t }) {
  return (
    <div>
      <a className="back-link" href="#home">
        ← {t.back}
      </a>
      <h1 className="post-title">SoleSpace</h1>
      <SoleSpaceDemo />
    </div>
  );
}

function MapsPost({ t }) {
  return (
    <article>
      <a className="back-link" href={HOME_URL}>
        ← {t.back}
      </a>
      <p className="post-date">{t.mapsDate}</p>
      <h1 className="post-title">{t.mapsTitle}</h1>
      {t.mapsBody.map((paragraph) => (
        <p className="post-body" key={paragraph}>
          {paragraph}
        </p>
      ))}
      <p className="post-actions">
        <a className="underline-link" href={MAPS_SLIDES_URL}>
          {t.mapsSlides}
        </a>
        <a className="underline-link" href={MAPS_CODE_URL} target="_blank" rel="noreferrer">
          {t.mapsCode}
        </a>
      </p>
    </article>
  );
}

export default function App() {
  const [route, setRoute] = useState(getCurrentRoute);
  const [lang, setLang] = useState(getInitialLang);
  const t = copy[lang];

  useEffect(() => {
    function handleHashChange() {
      setRoute(getCurrentRoute());
      window.scrollTo(0, 0);
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  let page;
  if (route.page === "solespace") page = <SoleSpacePage t={t} />;
  else if (route.page === "maps") page = <MapsPost t={t} />;
  else page = <HomePage t={t} lang={lang} onLangChange={setLang} />;

  return (
    <div className="site">
      <main className="site-shell">{page}</main>
    </div>
  );
}
