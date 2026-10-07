import { copyFile, mkdir } from 'node:fs/promises'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages has no rewrites: /maps/ needs its own copy of the app shell.
function appShellAt(paths) {
  return {
    name: 'app-shell-at',
    apply: 'build',
    async closeBundle() {
      for (const path of paths) {
        await mkdir(`dist/${path}`, { recursive: true })
        await copyFile('dist/index.html', `dist/${path}/index.html`)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), appShellAt(['maps'])],
})
