// Exposes content/posts/*.md as `virtual:blog` and, on build, writes one HTML shell per post
// (GitHub Pages has no rewrites, and each shell gets its own <title>/description for previews).
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadPosts, POSTS_DIR } from "./render.js";

const VIRTUAL_ID = "virtual:blog";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

const attr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export default function blog() {
  let isBuild = false;
  let posts = [];

  return {
    name: "blog",
    enforce: "post",
    configResolved(config) {
      isBuild = config.command === "build";
    },
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    async load(id) {
      if (id !== RESOLVED_ID) return;
      posts = await loadPosts({ includeDrafts: !isBuild });
      for (const p of posts) {
        if (p.slug === "blog") throw new Error('blog: "blog" is reserved for the post index');
        if (existsSync(resolve("public", p.slug, "index.html"))) {
          throw new Error(`blog: slug "${p.slug}" collides with public/${p.slug}/index.html`);
        }
      }
      return `export const posts = ${JSON.stringify(posts)};`;
    },
    configureServer(server) {
      const dir = resolve(POSTS_DIR);
      server.watcher.add(dir);
      const reload = (file) => {
        if (!file.startsWith(dir)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("change", reload).on("add", reload).on("unlink", reload);
    },
    generateBundle(_, bundle) {
      const shell = bundle["index.html"]?.source;
      if (typeof shell !== "string") return;
      const page = (title, description) =>
        shell
          .replace(/<title>[^<]*<\/title>/, `<title>${attr(title)}</title>`)
          .replace(/<meta\s+name="description"[^>]*>/, `<meta name="description" content="${attr(description)}" />`);
      this.emitFile({ type: "asset", fileName: "blog/index.html", source: page("Blog · Nicolas Rosales", "Notes on what I build.") });
      for (const post of posts) {
        const t = post.translations.en ?? Object.values(post.translations)[0];
        const description = t.description || t.title;
        const html = shell
          .replace(/<title>[^<]*<\/title>/, `<title>${attr(t.title)} · Nicolas Rosales</title>`)
          .replace(/<meta\s+name="description"[^>]*>/, `<meta name="description" content="${attr(description)}" />`)
          .replace(
            "</head>",
            `  <meta property="og:title" content="${attr(t.title)}" />\n    <meta property="og:description" content="${attr(description)}" />\n    <meta property="og:type" content="article" />\n  </head>`,
          );
        this.emitFile({ type: "asset", fileName: `${post.slug}/index.html`, source: html });
      }
    },
  };
}
