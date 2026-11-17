import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import blog from './scripts/blog/vite-plugin-blog.js'

export default defineConfig({
  plugins: [react(), blog()],
})
