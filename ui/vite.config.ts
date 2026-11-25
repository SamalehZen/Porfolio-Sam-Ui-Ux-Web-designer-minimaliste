import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

/** Replaced by the hashed asset list in `public/sw.js` at build time. */
const PRECACHE_TOKEN = '/* __PRECACHE_MANIFEST__ */ []'
/** Replaced by a per-deploy cache version, derived from the asset list. */
const BUILD_ID_TOKEN = "/* __BUILD_ID__ */ 'v1'"

/**
 * Fills `sw.js` with the list of hashed build assets.
 *
 * The service worker uses it to pre-cache the whole bundle on install, so the
 * first visit is enough to use the portfolio offline. The list cannot be written
 * by hand — the file names carry a content hash — so it is injected once Vite has
 * finished emitting `assets/`. The same pass derives a cache version from that
 * list, so a deploy with new assets starts a fresh cache and the previous one is
 * dropped on activate.
 */
function precacheManifest(): Plugin {
  let base = '/'
  let outDir = 'dist'
  let root = process.cwd()

  return {
    name: 'oxira-precache-manifest',
    apply: 'build',
    configResolved(config) {
      base = config.base
      outDir = config.build.outDir
      root = config.root
    },
    async closeBundle() {
      const dir = resolve(root, outDir)
      const files = await readdir(join(dir, 'assets'))
      const list = JSON.stringify(files.map((file) => `${base}assets/${file}`).sort())
      const buildId = createHash('sha256').update(list).digest('hex').slice(0, 8)

      const swPath = join(dir, 'sw.js')
      const source = await readFile(swPath, 'utf8')
      if (!source.includes(PRECACHE_TOKEN) || !source.includes(BUILD_ID_TOKEN)) {
        throw new Error(`${outDir}/sw.js is missing the precache placeholders`)
      }
      await writeFile(
        swPath,
        source.replace(PRECACHE_TOKEN, list).replace(BUILD_ID_TOKEN, `'${buildId}'`),
      )
    },
  }
}

export default defineConfig({
  base: process.env.BASE ?? '/',
  plugins: [react(), precacheManifest()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 3000,
  },
})
