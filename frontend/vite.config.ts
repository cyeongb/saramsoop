import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5277', // ✅ 현재 나의 백엔드 주소
        changeOrigin: true,
        secure: false,
      },
    },
  },
  envPrefix: 'VITE_',
});
