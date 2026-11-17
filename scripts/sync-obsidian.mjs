#!/usr/bin/env node
// Mirrors the Obsidian blog folder into content/posts and its embedded media into public/posts-media.
//   npm run sync              copy only
//   npm run publish           copy, commit and push (GitHub Actions deploys)
// Override the source folder with BLOG_VAULT_DIR=/path/to/folder.
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { homedir } from "node:os";

const BLOG_DIR = resolve(
  process.env.BLOG_VAULT_DIR ??
    join(homedir(), "Library/Mobile Documents/iCloud~md~obsidian/Documents/nico/personalwebblogs"),
);
const VAULT_DIR = dirname(BLOG_DIR);
const POSTS_OUT = resolve("content/posts");
const MEDIA_OUT = resolve("public/posts-media");
const SKIP_DIRS = new Set([".obsidian", ".git", ".trash", ".smart-env", "node_modules"]);
const publish = process.argv.includes("--publish");

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) await walk(full, out);
    } else out.push(full);
  }
  return out;
}

const isPost = (name) => name.endsWith(".md") && !name.startsWith("_") && name !== "README.md";

async function main() {
  try {
    await stat(BLOG_DIR);
  } catch {
    console.error(`Blog folder not found: ${BLOG_DIR}\nSet BLOG_VAULT_DIR to override.`);
    process.exit(1);
  }

  const postFiles = (await readdir(BLOG_DIR)).filter(isPost);

  // Obsidian resolves embeds by file name anywhere in the vault; prefer the blog folder.
  const index = new Map();
  for (const file of [...(await walk(VAULT_DIR)), ...(await walk(BLOG_DIR))]) index.set(basename(file), file);

  const media = new Set();
  const missing = [];
  for (const name of postFiles) {
    const text = (await readFile(join(BLOG_DIR, name), "utf8")).replace(/```[\s\S]*?```|`[^`\n]+`/g, "");
    const refs = [
      ...[...text.matchAll(/!\[\[([^\]|#]+)/g)].map((m) => m[1]),
      ...[...text.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map((m) => decodeURIComponent(m[1])).filter((s) => !/^(https?:|\/|data:)/.test(s)),
    ];
    for (const ref of refs) {
      const found = index.get(basename(ref.trim()));
      if (found) media.add(found);
      else missing.push(`${name}: ${ref}`);
    }
  }

  await rm(POSTS_OUT, { recursive: true, force: true });
  await rm(MEDIA_OUT, { recursive: true, force: true });
  await mkdir(POSTS_OUT, { recursive: true });
  await mkdir(MEDIA_OUT, { recursive: true });
  for (const name of postFiles) await copyFile(join(BLOG_DIR, name), join(POSTS_OUT, name));
  for (const file of media) await copyFile(file, join(MEDIA_OUT, basename(file)));

  console.log(`Synced ${postFiles.length} post file(s) and ${media.size} media file(s) from ${BLOG_DIR}`);
  if (missing.length) {
    console.error(`Missing embeds:\n  ${missing.join("\n  ")}`);
    process.exit(1);
  }

  if (!publish) return;
  // Fail here, not in CI, if a post doesn't build.
  execFileSync("npm", ["run", "build"], { stdio: "inherit" });
  const git = (...args) => execFileSync("git", args, { stdio: "inherit" });
  git("add", "--all", "content/posts", "public/posts-media");
  try {
    execFileSync("git", ["diff", "--cached", "--quiet"]);
    console.log("Nothing changed, nothing to publish.");
    return;
  } catch {
    // Non-zero exit means there are staged changes.
  }
  git("commit", "-m", "blog: sync from Obsidian");
  git("push");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
