import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 确保生产环境相对路径正确
  server: {
    port: 5173,
    strictPort: true, // 端口被占用时直接报错，不自动切换，配合 electron 等待逻辑
  }
})
