import { useEffect, useMemo, useState } from "react";
import { marked } from "marked";
import githubData from "./data/github.generated.json";
import { siteContent } from "./data/siteContent";
import SoleSpaceDemo from "./components/SoleSpaceDemo";

const blogModules = import.meta.glob("./content/blog/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) {
    return { meta: {}, body: raw };
  }

  const meta = {};
  match[1].split("\n").forEach((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) return;

    const key = line.slice(0, separatorIndex).trim();
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"|"$/g, "");
    meta[key] = value;
  });

  return {
    meta,
    body: raw.slice(match[0].length),
  };
}

function getBlogPosts() {
  return Object.entries(blogModules)
    .map(([path, raw]) => {
      const { meta, body } = parseFrontmatter(raw);
      const fileName = path.split("/").pop()?.replace(".md", "") || "post";
      const slug = meta.slug || slugify(fileName);
      const normalizedBody = body.replace(/^#\s+.+\n+/, "");

      return {
        slug,
        title: meta.title || fileName,
        date: meta.date || "",
        excerpt: meta.excerpt || "",
        body: normalizedBody,
        html: marked.parse(normalizedBody),
      };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function getCurrentRoute() {
  const hash = window.location.hash || "#home";

  if (hash.startsWith("#blog/")) {
    return { page: "post", slug: hash.replace("#blog/", "") };
  }

  if (hash === "#solespace") return { page: "solespace" };
  if (hash === "#blog") return { page: "blog" };
  if (hash === "#projects") return { page: "projects" };
  return { page: "home" };
}

function isExternalUrl(url) {
  return /^https?:\/\//.test(url);
}

function TextLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function ProjectFeature({ project }) {
  const external = isExternalUrl(project.url);
  const badge = project.badge || project.primaryLanguage?.name || project.language || "Project";
  const ctaLabel = project.ctaLabel || (external ? "Repository" : "Open");

  return (
    <article className={`project-feature${project.variant ? ` project-feature--${project.variant}` : ""}`}>
      <div className="project-feature__meta">
        <span>{project.metaLabel || "Pinned project"}</span>
        <span>{badge}</span>
      </div>

      <h2>
        <a
          href={project.url}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
        >
          {project.name}
        </a>
      </h2>

      <p>{project.description}</p>

      <div className="project-feature__links">
        <a
          href={project.url}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
        >
          {ctaLabel}
        </a>
        {typeof project.stargazerCount === "number" ? (
          <span>{project.stargazerCount} stars</span>
        ) : (
          <span>{project.footerLabel || "Interactive demo"}</span>
        )}
      </div>
    </article>
  );
}

function ArchiveProject({ project }) {
  const external = isExternalUrl(project.url);
  const hasHomepage = Boolean(project.homepage);

  return (
    <article className="archive-project">
      <div>
        <h3>
          <a
            href={project.url}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
          >
            {project.name}
          </a>
        </h3>
        <p>{project.description || "Repository in active development."}</p>
        {hasHomepage ? (
          <p className="archive-project__homepage">
            <a href={project.homepage} target="_blank" rel="noreferrer">
              Website
            </a>
          </p>
        ) : null}
      </div>
      <span>{project.language || "Project"}</span>
    </article>
  );
}

function BlogListItem({ post }) {
  return (
    <article className="blog-list-item">
      <p className="blog-list-item__date">{post.date}</p>
      <h2>
        <a href={`#blog/${post.slug}`}>{post.title}</a>
      </h2>
      {post.excerpt ? <p>{post.excerpt}</p> : null}
    </article>
  );
}

function Topbar({ page }) {
  return (
    <header className="topbar">
      <p className="topbar__name">Nicolas Rosales</p>
      <nav className="topbar__links" aria-label="Primary">
        <a href="#home" aria-current={page === "home" ? "page" : undefined}>
          Home
        </a>
        <a
          href="#projects"
          aria-current={page === "projects" ? "page" : undefined}
        >
          Projects
        </a>
        <a
          href="#solespace"
          aria-current={page === "solespace" ? "page" : undefined}
        >
          SoleSpace
        </a>
        <a
          href="#blog"
          aria-current={page === "blog" || page === "post" ? "page" : undefined}
        >
          Blog
        </a>
      </nav>
    </header>
  );
}

const PROJECT_CATEGORIES = siteContent.projectCategories || {};

function FilterBar({ active, onChange }) {
  const filters = [
    { value: null, label: "All" },
    { value: "machine-learning", label: "Machine Learning" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="filter-bar">
      {filters.map((f) => (
        <button
          key={f.label}
          className={`filter-btn${active === f.value ? " filter-btn--active" : ""}`}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function HomePage() {
  const { profile, pinnedProjects } = githubData;
  const featuredProjects = [
    {
      name: "SoleSpace",
      description:
        "Interactive latent-space explorer and decoding demo with a custom atlas, grid projection, and live class ranking.",
      url: "#solespace",
      badge: "Interactive demo",
      metaLabel: "Spotlight",
      footerLabel: "Open demo",
      variant: "demo",
    },
    ...pinnedProjects.slice(0, 3),
  ];

  return (
    <main className="site-shell">
      <Topbar page="home" />

      <section className="masthead">
        <div className="masthead__image-wrap">
          <div className="masthead__image-frame">
            <img
              className="masthead__image"
              src={profile.avatarUrl}
              alt={profile.name}
            />
          </div>
        </div>

        <div className="masthead__content">
          <h1>{profile.name}</h1>
          <p className="masthead__lede">{siteContent.title}</p>
          <p>{siteContent.intro}</p>
          <p>
            <strong>Current:</strong> {siteContent.focus}
          </p>
          <p>
            <strong>Links:</strong>{" "}
            <TextLink href="https://www.linkedin.com/in/nicolas-rosales-gomez">
              LinkedIn
            </TextLink>
            , <TextLink href="https://github.com/nicorosaless">GitHub</TextLink>
            , <TextLink href="https://devpost.com/nirogo06">Devpost</TextLink>,{" "}
            <a
              href="/Nicolas Rosales Resume.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Resume
            </a>
          </p>
        </div>
      </section>

      <section className="section-block">
        <div className="section-block__heading">
          <h2>Awards</h2>
        </div>
        <ul className="achievements-list">
          {siteContent.achievements.map((achievement, i) => (
            <li key={i} className="achievement-item">
              <span className="achievement-icon">★</span>
              <span>{achievement}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section-block">
        <div className="section-block__heading">
          <h2>Selected Work</h2>
          <p>
            <a href="#projects">All projects →</a>
          </p>
        </div>
        <div className="project-feature-list">
          {featuredProjects.map((project) => (
            <ProjectFeature key={project.name} project={project} />
          ))}
        </div>
      </section>
    </main>
  );
}

function ProjectsPage() {
  const { pinnedProjects, allProjects, stats } = githubData;
  const [activeFilter, setActiveFilter] = useState(null);

  const getCategory = (name) => PROJECT_CATEGORIES[name] || "other";

  const filteredPinned = activeFilter
    ? pinnedProjects.filter((p) => getCategory(p.name) === activeFilter)
    : pinnedProjects;

  const archiveProjects = allProjects.filter(
    (project) => !pinnedProjects.some((pinned) => pinned.name === project.name),
  );

  const filteredArchive = activeFilter
    ? archiveProjects.filter((p) => getCategory(p.name) === activeFilter)
    : archiveProjects;

  return (
    <main className="site-shell">
      <Topbar page="projects" />

      <section className="page-intro">
        <div className="section-block__heading section-block__heading--no-border">
          <h1>Projects</h1>
          <p>
            {stats.pinnedCount} featured repositories and {stats.projectCount} public
            repositories in the archive.
          </p>
        </div>

        <FilterBar active={activeFilter} onChange={setActiveFilter} />

        <div className="project-feature-list">
          {filteredPinned.map((project) => (
            <ProjectFeature key={project.name} project={project} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-block__heading">
          <h2>Archive</h2>
          <p>Additional public work across experiments, apps, and notebooks.</p>
        </div>

        <div className="archive-project-list">
          {filteredArchive.map((project) => (
            <ArchiveProject key={project.name} project={project} />
          ))}
        </div>
      </section>
    </main>
  );
}

function SoleSpacePage() {
  return (
    <main className="site-shell">
      <Topbar page="solespace" />

      <section className="page-intro">
        <div className="section-block__heading section-block__heading--no-border">
          <div>
            <h1>SoleSpace</h1>
            <p>
              An interactive latent-space demo I built to explore decoded output,
              grid density, and nearest-class rankings.
            </p>
          </div>
          <p>
            <a href="#projects">Back to projects →</a>
          </p>
        </div>
      </section>

      <SoleSpaceDemo />
    </main>
  );
}

function BlogPage({ posts }) {
  return (
    <main className="site-shell">
      <Topbar page="blog" />

      <section className="page-intro">
        <div className="section-block__heading section-block__heading--no-border">
          <h1>Blog</h1>
          <p>Notes on AI engineering, experiments, and product work.</p>
        </div>

        <div className="blog-list">
          {posts.map((post) => (
            <BlogListItem key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </main>
  );
}

function BlogPostPage({ post }) {
  return (
    <main className="site-shell">
      <Topbar page="post" />

      <section className="page-intro">
        <p className="post-back-link">
          <a href="#blog">Back to blog</a>
        </p>

        <article className="blog-post">
          <p className="blog-post__date">{post.date}</p>
          <h1>{post.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: post.html }} />
        </article>
      </section>
    </main>
  );
}

export default function App() {
  const posts = useMemo(() => getBlogPosts(), []);
  const [route, setRoute] = useState(getCurrentRoute);

  useEffect(() => {
    function handleHashChange() {
      setRoute(getCurrentRoute());
    }

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  if (route.page === "projects") return <ProjectsPage />;
  if (route.page === "solespace") return <SoleSpacePage />;
  if (route.page === "blog") return <BlogPage posts={posts} />;

  if (route.page === "post") {
    const post = posts.find((entry) => entry.slug === route.slug);

    if (post) return <BlogPostPage post={post} />;

    return <BlogPage posts={posts} />;
  }

  return <HomePage />;
}
