import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  build: {
    outDir: process.env.VITE_OUT_DIR || '../Backend/VBaceEnglish.Api/wwwroot',
    emptyOutDir: false,
    sourcemap: false,
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
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
