
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ESM context to resolve path errors
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [react()],
    // Base public path
    base: '/',
    root: '.', 
    server: {
      port: 3000,
      host: true,
    },
    resolve: {
        alias: {
            'react': path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
            '@': path.resolve(__dirname, './src'),
        }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true, // Xóa sạch folder dist trước khi build
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return
          }
          warn(warning)
        },
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['lucide-react', 'recharts']
          }
        }
      }
    }
  };
});
