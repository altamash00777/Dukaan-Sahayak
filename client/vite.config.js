import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React core into its own chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Split charting library separately (largest dependency)
          'vendor-recharts': ['recharts'],
          // Split icon library separately
          'vendor-lucide': ['lucide-react'],
          // Split axios separately
          'vendor-axios': ['axios'],
        },
      },
    },
  },
});
