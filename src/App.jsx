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

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  if (hash === "#projects") return { page: "projects" };
  return { page: "home" };
}

function isExternalUrl(url) {
  return /^https?:\/\//.test(url);
}

function Topbar({ page }) {
  return (
    <header className="topbar">
      <a className="topbar__name" href="#home">
        Nicolas Rosales
      </a>
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
      </nav>
    </header>
  );
}

function PostList({ posts }) {
  if (!posts.length) {
    return <p className="empty-state">No posts yet.</p>;
  }

  return (
    <div className="post-list">
      {posts.map((post) => (
        <article key={post.slug} className="post-item">
          <p className="post-item__date">{formatDate(post.date)}</p>
          <h3 className="post-item__title">
            <a href={`#blog/${post.slug}`}>{post.title}</a>
          </h3>
        </article>
      ))}
    </div>
  );
}

function HomePage({ posts }) {
  return (
    <main className="site-shell">
      <Topbar page="home" />

      <section className="intro">
        <h1>My Portfolio</h1>
        <p>{siteContent.intro}</p>
      </section>

      <section>
        <h2 className="section-title">Writing</h2>
        <PostList posts={posts} />
      </section>
    </main>
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

function ProjectItem({ project }) {
  const external = isExternalUrl(project.url);
  const lang = project.primaryLanguage?.name || project.language || "Project";

  return (
    <article className="project-item">
      <div className="project-item__head">
        <h3>
          <a
            href={project.url}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
          >
            {project.name}
          </a>
        </h3>
        <span className="project-item__lang">{lang}</span>
      </div>
      <p>{project.description || "Repository in active development."}</p>
      <div className="project-item__links">
        <a
          href={project.url}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
        >
          {external ? "Repository" : "Open"}
        </a>
        {project.homepage ? (
          <a href={project.homepage} target="_blank" rel="noreferrer">
            Website
          </a>
        ) : null}
      </div>
    </article>
  );
}

function ProjectsPage() {
  const { pinnedProjects, allProjects } = githubData;
  const [activeFilter, setActiveFilter] = useState(null);

  const getCategory = (name) => PROJECT_CATEGORIES[name] || "other";

  const archiveProjects = allProjects.filter(
    (project) => !pinnedProjects.some((pinned) => pinned.name === project.name),
  );

  const projects = [...pinnedProjects, ...archiveProjects];
  const filtered = activeFilter
    ? projects.filter((p) => getCategory(p.name) === activeFilter)
    : projects;

  return (
    <main className="site-shell">
      <Topbar page="projects" />

      <section className="intro">
        <h1>Projects</h1>
        <p>Selected work across machine learning, apps, and experiments.</p>
      </section>

      <section>
        <FilterBar active={activeFilter} onChange={setActiveFilter} />
        <div className="project-list">
          {filtered.map((project) => (
            <ProjectItem key={project.name} project={project} />
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

      <section className="intro">
        <h1>SoleSpace</h1>
        <p>
          An interactive latent-space demo I built to explore decoded output,
          grid density, and nearest-class rankings.
        </p>
      </section>

      <SoleSpaceDemo />
    </main>
  );
}

function BlogPostPage({ post }) {
  return (
    <main className="site-shell">
      <Topbar page="post" />

      <p className="post-back-link">
        <a href="#home">← Back</a>
      </p>

      <article className="blog-post">
        <p className="blog-post__date">{formatDate(post.date)}</p>
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
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

  if (route.page === "post") {
    const post = posts.find((entry) => entry.slug === route.slug);
    if (post) return <BlogPostPage post={post} />;
  }

  return <HomePage posts={posts} />;
}
