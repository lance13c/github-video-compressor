import alias from '@rollup/plugin-alias'
import reactPlugin from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { dirname, normalize, resolve } from 'path'
import injectProcessEnvPlugin from 'rollup-plugin-inject-process-env'
import tsconfigPathsPlugin from 'vite-tsconfig-paths'
import { main, resources } from './package.json'

const [nodeModules, devFolder] = normalize(dirname(main)).split(/\/|\\/g)
const devPath = [nodeModules, devFolder].join('/')
console.log('devPath:', devPath)

const tsconfigPaths = tsconfigPathsPlugin({
  projects: [resolve('tsconfig.json')],
})

// https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/573#issuecomment-1288358850 - thx
const rollupFluentPluginFix = alias({
  entries: [{ find: './lib-cov/fluent-ffmpeg', replacement: './lib/fluent-ffmpeg' }],
})

console.log('tsconfigPaths:', tsconfigPaths)

export default defineConfig({
  main: {
    define: {
      'process.env.FLUENTFFMPEG_COV': 0,
    },

    plugins: [tsconfigPaths],

    build: {
      rollupOptions: {
        plugins: [rollupFluentPluginFix],

        input: {
          index: resolve('src/main/index.ts'),
        },

        output: {
          dir: resolve(devPath, 'main'),
        },

        external: ['ws'],
      },
    },
  },

  preload: {
    define: {
      'process.env.FLUENTFFMPEG_COV': 0,
    },

    plugins: [tsconfigPaths, externalizeDepsPlugin()],

    build: {
      outDir: resolve(devPath, 'preload'),
    },
  },

  renderer: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.platform': JSON.stringify(process.platform),
      'process.env.FLUENTFFMPEG_COV': 0,
    },

    server: {
      port: 4927,
    },

    plugins: [tsconfigPaths, reactPlugin()],
    publicDir: resolve(resources, 'public'),

    build: {
      outDir: resolve(devPath, 'renderer'),

      rollupOptions: {
        plugins: [
          injectProcessEnvPlugin({
            NODE_ENV: 'production',
            platform: process.platform,
          }),
        ],

        input: {
          index: resolve('src/renderer/index.html'),
        },

        output: {
          dir: resolve(devPath, 'renderer'),
        },
      },
    },
  },
})
