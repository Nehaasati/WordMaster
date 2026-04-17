import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "../backend/wwwroot"),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    fs: {allow: ['..']},
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5024",
        changeOrigin: true,
        secure: false,
        ws: false,
        rewrite: (path) => path,
      },
      "/lobbyHub": {
        target: "http://127.0.0.1:5024",
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path,
      },
    },
  },
});

