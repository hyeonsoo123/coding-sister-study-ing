import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 개발 서버는 localhost:5173 고정 (요청 사항)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
})
