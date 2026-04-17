import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, '')
  const backendPort = env.BACKEND_PORT || process.env.BACKEND_PORT || '8000'
  const frontendPort = Number(
    env.FRONTEND_PORT || process.env.FRONTEND_PORT || '5173',
  )
  const noLiveReload =
    env.VITE_DISABLE_HMR === '1' || process.env.VITE_DISABLE_HMR === '1'

  // Do not watch the Vite config itself: otherwise saving vite.config.* triggers a full
  // dev-server restart ("vite.config.ts changed, restarting server..."). Restart manually
  // after you edit this file.
  const ignoreViteConfigInWatcher = {
    watch: {
      ignored: [
        path.resolve(__dirname, 'vite.config.ts'),
        path.resolve(__dirname, 'vite.config.js'),
        path.resolve(__dirname, 'vite.config.mjs'),
        path.resolve(__dirname, 'vite.config.mts'),
      ],
    },
  }

  return {
    plugins: [tailwindcss(), react()],
    server: {
      port: frontendPort,
      strictPort: true,
      ...(noLiveReload
        ? { hmr: false, watch: null }
        : ignoreViteConfigInWatcher),
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: frontendPort,
      strictPort: true,
    },
  }
})
