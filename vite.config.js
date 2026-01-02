import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
      react({
            babel: {
              plugins: [["babel-plugin-react-compiler"]],
            },
          }
      )],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  test: {
    globals: true,           // Чтобы не писать import { describe, it, expect } в каждом файле
    environment: 'jsdom',    // Эмуляция браузера для тестов
    setupFiles: './src/setupTests.js', // Файл с настройками (создадим его ниже)
  },
})
