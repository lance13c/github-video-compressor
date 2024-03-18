import topLevelAwait from ' '
import react from '@vitejs/plugin-react'
import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import addHmr from './utils/plugins/add-hmr'
import customDynamicImport from './utils/plugins/custom-dynamic-import'
import makeManifest from './utils/plugins/make-manifest'
import watchRebuild from './utils/plugins/watch-rebuild'

const rootDir = resolve(__dirname)
const srcDir = resolve(rootDir, 'src')
const utilsDir = resolve(srcDir, 'utils')
const sharedDir = resolve(srcDir, 'shared')
const pagesDir = resolve(srcDir, 'pages')
const assetsDir = resolve(srcDir, 'assets')
const outDir = resolve(rootDir, 'dist')
const publicDir = resolve(rootDir, 'public')

const isDev = process.env.__DEV__ === 'true'
const isProduction = !isDev

// ENABLE HMR IN BACKGROUND SCRIPT
const enableHmrInBackgroundScript = true

export default defineConfig({
  resolve: {
    alias: {
      '@root': rootDir,
      '@utils': utilsDir,
      '@shared': sharedDir,
      '@src': srcDir,
      '@assets': assetsDir,
      '@pages': pagesDir,
    },
  },
  plugins: [
    topLevelAwait(),
    makeManifest({
      contentScriptCssKey: regenerateCacheInvalidationKey(),
    }),
    react(),
    customDynamicImport(),
    addHmr({ background: enableHmrInBackgroundScript, view: true }),
    isDev && watchRebuild(),
  ],
  publicDir,
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', '@syntect/wasm'],
  },
  build: {
    outDir,
    /** Can slowDown build speed. */
    // sourcemap: isDev,
    minify: isProduction,
    modulePreload: false,
    reportCompressedSize: isProduction,
    emptyOutDir: !isDev,
    target: 'esnext',
    rollupOptions: {
      input: {
        devtools: resolve(pagesDir, 'devtools', 'index.html'),
        panel: resolve(pagesDir, 'panel', 'index.html'),
        content: resolve(pagesDir, 'content', 'index.ts'),
        background: resolve(pagesDir, 'background', 'index.ts'),
        contentStyle: resolve(pagesDir, 'content', 'style.scss'),
        popup: resolve(pagesDir, 'popup', 'index.html'),
        newtab: resolve(pagesDir, 'newtab', 'index.html'),
        options: resolve(pagesDir, 'options', 'index.html'),
      },
      output: {
        entryFileNames: 'src/pages/[name]/index.js',
        chunkFileNames: isDev ? 'assets/js/[name].js' : 'assets/js/[name].[hash].js',
        assetFileNames: assetInfo => {
          const { dir, name: _name } = path.parse(assetInfo.name)
          const assetFolder = dir.split('/').at(-1)
          const name = assetFolder + firstUpperCase(_name)
          if (name === 'contentStyle') {
            return `assets/css/contentStyle${cacheInvalidationKey}.chunk.css`
          }
          return `assets/[ext]/${name}.chunk.[ext]`
        },
      },
    },
  },
})

function firstUpperCase(str: string) {
  const firstAlphabet = new RegExp(/( |^)[a-z]/, 'g')
  return str.toLowerCase().replace(firstAlphabet, L => L.toUpperCase())
}

let cacheInvalidationKey: string = generateKey()
function regenerateCacheInvalidationKey() {
  cacheInvalidationKey = generateKey()
  return cacheInvalidationKey
}

function generateKey(): string {
  return `${(Date.now() / 100).toFixed()}`
}
