// Markdown (Obsidian flavour) → HTML for blog posts.
import { readdir, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import { createHighlighter, createCssVariablesTheme } from "shiki";
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationFocus,
} from "@shikijs/transformers";
import { renderChart } from "./charts.js";

export const POSTS_DIR = "content/posts";
export const MEDIA_URL = "/posts-media/";
const LANGS = ["es", "en"];

const theme = createCssVariablesTheme({ name: "blog-code", variablePrefix: "--code-", fontStyle: true });
const CODE_LANGS = [
  "bash", "shell", "python", "javascript", "typescript", "jsx", "tsx", "json", "yaml", "toml",
  "html", "css", "sql", "rust", "go", "c", "cpp", "java", "diff", "markdown", "dockerfile", "r", "latex",
];
let highlighterPromise;
const getHighlighter = () => (highlighterPromise ??= createHighlighter({ themes: [theme], langs: CODE_LANGS }));

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const mediaUrl = (file) => MEDIA_URL + encodeURIComponent(basename(file.trim()));

// Obsidian-only syntax that markdown-it doesn't know. Code spans and fences are left untouched.
function preprocess(src, resolveLink) {
  return src
    .split(/(```[\s\S]*?```|`[^`\n]+`)/g)
    .map((chunk, i) => {
      if (i % 2) return chunk;
      return chunk
        .replace(/%%[\s\S]*?%%/g, "")
        .replace(/!\[\[([^\]|]+)(?:\|(\d+)(?:x(\d+))?)?\]\]/g, (_, file, w) =>
          `<img src="${mediaUrl(file)}" alt=""${w ? ` width="${w}"` : ""} loading="lazy">`,
        )
        .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, target, label) => {
          const href = resolveLink(target.trim());
          const text = escapeHtml(label ?? target.trim());
          return href ? `<a href="${href}">${text}</a>` : text;
        })
        .replace(/==([^=\n]+)==/g, "<mark>$1</mark>");
    })
    .join("");
}

function calloutPlugin(md) {
  md.core.ruler.after("block", "callouts", (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== "blockquote_open") continue;
      const inline = tokens[i + 2];
      if (tokens[i + 1]?.type !== "paragraph_open" || inline?.type !== "inline") continue;
      const m = inline.content.match(/^\[!(\w+)\][+-]?[ \t]*([^\n]*)\n?/);
      if (!m) continue;
      const kind = m[1].toLowerCase();
      tokens[i].attrSet("class", `callout callout--${kind}`);
      const title = new state.Token("html_block", "", 0);
      title.content = `<p class="callout__title">${escapeHtml(m[2] || kind[0].toUpperCase() + kind.slice(1))}</p>\n`;
      tokens.splice(i + 1, 0, title);
      inline.content = inline.content.slice(m[0].length);
      if (!inline.content.trim()) {
        // Title-only first paragraph: drop the now empty <p></p>.
        tokens.splice(i + 2, 3);
      }
    }
  });
}

function createMarkdown(highlighter) {
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
  md.use(calloutPlugin);

  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx];
    const [rawLang = "", ...rest] = token.info.trim().split(/\s+/);
    const meta = rest.join(" ");
    const code = token.content.replace(/\n$/, "");

    if (rawLang === "chart") {
      try {
        return renderChart(code);
      } catch (err) {
        throw new Error(`${err.message}\n--- in chart block:\n${code}`);
      }
    }

    const loaded = highlighter.getLoadedLanguages();
    const lang = loaded.includes(rawLang) ? rawLang : "text";
    const title = meta.match(/title="([^"]+)"/)?.[1];
    const html = highlighter.codeToHtml(code, {
      lang,
      theme: "blog-code",
      meta: { __raw: meta },
      transformers: [
        transformerMetaHighlight(),
        transformerNotationHighlight({ matchAlgorithm: "v3" }),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
        transformerNotationFocus({ matchAlgorithm: "v3" }),
      ],
    });
    const label = title ?? (rawLang && rawLang !== "text" ? rawLang : "");
    return `<figure class="code"><figcaption class="code__bar"><span class="code__label">${escapeHtml(label)}</span><button type="button" class="code__copy" data-copy>Copy</button></figcaption>${html}</figure>\n`;
  };

  const ids = new Map();
  md.core.ruler.push("heading_ids", (state) => {
    ids.clear();
    state.tokens.forEach((t, i) => {
      if (t.type !== "heading_open") return;
      const base = slugify(state.tokens[i + 1].content) || "section";
      const n = ids.get(base) ?? 0;
      ids.set(base, n + 1);
      t.attrSet("id", n ? `${base}-${n}` : base);
    });
  });

  const defaultImage = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, idx, opts, env, self) => {
    const src = tokens[idx].attrGet("src");
    if (src && !/^(https?:|\/|data:)/.test(src)) tokens[idx].attrSet("src", mediaUrl(decodeURIComponent(src)));
    tokens[idx].attrSet("loading", "lazy");
    return defaultImage(tokens, idx, opts, env, self);
  };

  const defaultLink = md.renderer.rules.link_open ?? ((t, i, o, e, s) => s.renderToken(t, i, o));
  md.renderer.rules.link_open = (tokens, idx, opts, env, self) => {
    if (/^https?:/.test(tokens[idx].attrGet("href") ?? "")) {
      tokens[idx].attrSet("target", "_blank");
      tokens[idx].attrSet("rel", "noreferrer");
    }
    return defaultLink(tokens, idx, opts, env, self);
  };

  return md;
}

function toDateString(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "");
}

// Reads every post. Files: `<name>.md` (default lang) and optional `<name>.en.md` / `<name>.es.md` translations.
export async function loadPosts({ includeDrafts = false } = {}) {
  let files;
  try {
    files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".md") && !f.startsWith("_") && f !== "README.md");
  } catch {
    return [];
  }

  const raw = await Promise.all(
    files.map(async (file) => {
      const { data, content } = matter(await readFile(join(POSTS_DIR, file), "utf8"));
      const stem = file.slice(0, -3);
      const langSuffix = LANGS.find((l) => stem.endsWith(`.${l}`));
      const baseName = langSuffix ? stem.slice(0, -langSuffix.length - 1) : stem;
      return { file, data, content, baseName, lang: data.lang ?? langSuffix ?? "es" };
    }),
  );

  // A post's slug is shared by all its translations; the untranslated file wins.
  const slugByBase = new Map();
  for (const r of raw.sort((a, b) => a.file.length - b.file.length)) {
    if (!slugByBase.has(r.baseName)) slugByBase.set(r.baseName, r.data.slug ? String(r.data.slug) : slugify(r.baseName));
  }
  const resolveLink = (target) => {
    const slug = slugByBase.get(target) ?? [...slugByBase.values()].find((s) => s === slugify(target));
    return slug ? `/${slug}/` : null;
  };

  const md = createMarkdown(await getHighlighter());
  const bySlug = new Map();

  for (const r of raw) {
    if (r.data.draft && !includeDrafts) continue;
    if (!r.data.title) throw new Error(`${r.file}: frontmatter needs a \`title\``);
    if (!r.data.date) throw new Error(`${r.file}: frontmatter needs a \`date\` (YYYY-MM-DD)`);
    const slug = slugByBase.get(r.baseName);
    const words = r.content.split(/\s+/).filter(Boolean).length;
    const html = md.render(preprocess(r.content, resolveLink));
    const post = bySlug.get(slug) ?? { slug, date: toDateString(r.data.date), translations: {} };
    post.translations[r.lang] = {
      title: String(r.data.title),
      description: r.data.description ? String(r.data.description) : "",
      date: toDateString(r.data.date),
      draft: Boolean(r.data.draft),
      minutes: Math.max(1, Math.round(words / 220)),
      html,
    };
    if (!r.file.match(/\.(es|en)\.md$/)) post.date = toDateString(r.data.date);
    bySlug.set(slug, post);
  }

  return [...bySlug.values()].sort((a, b) => b.date.localeCompare(a.date));
}
