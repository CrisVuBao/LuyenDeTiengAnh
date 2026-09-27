import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

// Tự động dọn dẹp các file build cũ trong wwwroot/assets (giữ nguyên wwwroot/tts-cache, ebooks, images)
function cleanStaleAssetsPlugin(outDir) {
  return {
    name: 'clean-stale-assets',
    apply: 'build',
    buildStart() {
      try {
        const assetsDir = path.resolve(outDir, 'assets');
        if (fs.existsSync(assetsDir)) {
          fs.rmSync(assetsDir, { recursive: true, force: true });
        }
      } catch {
        // ignore cleanup errors
      }
    }
  };
}

const targetOutDir = process.env.VITE_OUT_DIR || '../Backend/VBaceEnglish.Api/wwwroot';

export default defineConfig({
  plugins: [tailwindcss(), react(), cleanStaleAssetsPlugin(targetOutDir)],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  build: {
    outDir: targetOutDir,
    emptyOutDir: false,
    sourcemap: false,
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('reflex50Data.json')) {
            return 'data-reflex50';
          }
          if (id.includes('node_modules')) {
            if (id.includes('epubjs') || id.includes('jszip') || id.includes('@xmldom'))
              return 'vendor-epub';
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor'))
              return 'vendor-charts';
            if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils'))
              return 'vendor-motion';
            if (id.includes('lucide-react'))
              return 'vendor-icons';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler'))
              return 'vendor-react';
            return 'vendor-core';
          }
        }
      }
    }
  },
  server: {
    port: 4100,
    proxy: {
      '/api': { target: 'http://localhost:5199', changeOrigin: true, secure: false },
      '/notificationHub': { target: 'http://localhost:5199', changeOrigin: true, secure: false, ws: true }
    }
  }
})
