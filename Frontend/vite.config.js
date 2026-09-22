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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom'))
              return 'vendor-react';
            if (id.includes('recharts') || id.includes('d3-'))
              return 'vendor-charts';
            if (id.includes('framer-motion') || id.includes('lucide-react'))
              return 'vendor-ui';
            return 'vendor';
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
