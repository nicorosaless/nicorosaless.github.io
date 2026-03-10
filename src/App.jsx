import { useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import githubData from './data/github.generated.json'
import { siteContent } from './data/siteContent'

const blogModules = import.meta.glob('./content/blog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/)

  if (!match) {
    return { meta: {}, body: raw }
  }

  const meta = {}
  match[1].split('\n').forEach((line) => {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) return

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim().replace(/^"|"$/g, '')
    meta[key] = value
  })

  return {
    meta,
    body: raw.slice(match[0].length),
  }
}

function getBlogPosts() {
  return Object.entries(blogModules)
    .map(([path, raw]) => {
      const { meta, body } = parseFrontmatter(raw)
      const fileName = path.split('/').pop()?.replace('.md', '') || 'post'
      const slug = meta.slug || slugify(fileName)
      const normalizedBody = body.replace(/^#\s+.+\n+/, '')

      return {
        slug,
        title: meta.title || fileName,
        date: meta.date || '',
        excerpt: meta.excerpt || '',
        body: normalizedBody,
        html: marked.parse(normalizedBody),
      }
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

function getCurrentRoute() {
  const hash = window.location.hash || '#home'

  if (hash.startsWith('#blog/')) {
    return { page: 'post', slug: hash.replace('#blog/', '') }
  }

  if (hash === '#blog') return { page: 'blog' }
  if (hash === '#projects') return { page: 'projects' }
  return { page: 'home' }
}

function TextLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

function ProjectFeature({ project }) {
  return (
    <article className="project-feature">
      <div className="project-feature__meta">
        <span>Pinned project</span>
        <span>{project.primaryLanguage?.name || 'Project'}</span>
      </div>

      <h2>
        <a href={project.url} target="_blank" rel="noreferrer">
          {project.name}
        </a>
      </h2>

      <p>{project.description}</p>

      <div className="project-feature__links">
        <a href={project.url} target="_blank" rel="noreferrer">
          Repository
        </a>
        <span>{project.stargazerCount} stars</span>
      </div>
    </article>
  )
}

function ArchiveProject({ project }) {
  return (
    <article className="archive-project">
      <div>
        <h3>
          <a href={project.url} target="_blank" rel="noreferrer">
            {project.name}
          </a>
        </h3>
        <p>{project.description || 'Repository in active development.'}</p>
      </div>
      <span>{project.language || 'Project'}</span>
    </article>
  )
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
  )
}

function Topbar({ page }) {
  return (
    <header className="topbar">
      <p className="topbar__name">Nicolas Rosales</p>
      <nav className="topbar__links" aria-label="Primary">
        <a href="#home" aria-current={page === 'home' ? 'page' : undefined}>
          Home
        </a>
        <a href="#projects" aria-current={page === 'projects' ? 'page' : undefined}>
          Projects
        </a>
        <a href="#blog" aria-current={page === 'blog' || page === 'post' ? 'page' : undefined}>
          Blog
        </a>
      </nav>
    </header>
  )
}

function HomePage() {
  const { profile } = githubData

  return (
    <main className="site-shell">
      <Topbar page="home" />

      <section className="masthead masthead--home">
        <div className="masthead__image-wrap">
          <div className="masthead__image-frame">
            <img className="masthead__image" src={profile.avatarUrl} alt={profile.name} />
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
            <strong>Links:</strong> <TextLink href="https://www.linkedin.com/in/nicolas-rosales-gomez">LinkedIn</TextLink>,{' '}
            <TextLink href="https://github.com/nicorosaless">GitHub</TextLink>,{' '}
            <TextLink href="https://devpost.com/nirogo06">Devpost</TextLink>, <a href="/Nicolas Rosales Resume.pdf" target="_blank" rel="noreferrer">Resume</a>
          </p>
        </div>
      </section>
    </main>
  )
}

function ProjectsPage() {
  const { pinnedProjects, allProjects, stats } = githubData
  const archiveProjects = allProjects.filter(
    (project) => !pinnedProjects.some((pinned) => pinned.name === project.name),
  )

  return (
    <main className="site-shell">
      <Topbar page="projects" />

      <section className="page-intro">
        <div className="section-block__heading section-block__heading--no-border">
          <h1>Projects</h1>
          <p>{stats.pinnedCount} featured repositories and a wider public archive.</p>
        </div>

        <div className="project-feature-list">
          {pinnedProjects.map((project) => (
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
          {archiveProjects.map((project) => (
            <ArchiveProject key={project.name} project={project} />
          ))}
        </div>
      </section>
    </main>
  )
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
  )
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
  )
}

export default function App() {
  const posts = useMemo(() => getBlogPosts(), [])
  const [route, setRoute] = useState(getCurrentRoute)

  useEffect(() => {
    function handleHashChange() {
      setRoute(getCurrentRoute())
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  if (route.page === 'projects') return <ProjectsPage />
  if (route.page === 'blog') return <BlogPage posts={posts} />

  if (route.page === 'post') {
    const post = posts.find((entry) => entry.slug === route.slug)

    if (post) return <BlogPostPage post={post} />

    return <BlogPage posts={posts} />
  }

  return <HomePage />
}
