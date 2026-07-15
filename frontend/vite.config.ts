import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 优化打包配置
    rollupOptions: {
      output: {
        // 代码分割策略：Vite 8/Rolldown 需要函数形式的 manualChunks
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/axios')) {
            return 'axios-vendor';
          }
        },
      },
    },
    // 压缩配置 (使用 esbuild，比 terser 更快)
    minify: 'esbuild',
    // chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios'],
  },
});
