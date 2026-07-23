import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  resolve: {
    // Path aliases enable clean imports like @/components/Button
    // instead of ../../components/Button
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5180,
    // Proxy API calls to backend to avoid CORS in dev
    proxy: {
      '/api': {
        target: 'http://localhost:8095',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Target modern browsers — no IE11 polyfills
    target: 'esnext',
    // Generate separate CSS file for production
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Manual chunk splitting to keep vendor bundles small
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-motion': ['framer-motion'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
})
