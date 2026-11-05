import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

// Камера в браузере работает только по HTTPS. Режим `phone` (npm run dev:phone) поднимает
// dev-сервер в локальной сети с самоподписанным сертификатом, чтобы открыть прототип на телефоне.
export default defineConfig(({ mode }) => ({
  plugins: [vue(), ...(mode === 'phone' ? [basicSsl()] : [])],
  server: {
    // Vite по умолчанию отклоняет запросы с чужим Host; адреса туннеля Cloudflare вида xxx.trycloudflare.com разрешаем.
    allowedHosts: ['.trycloudflare.com'],
    ...(mode === 'phone' ? { host: true } : {}),
  },
  // Сборка через `vite preview` — самый быстрый способ показать прототип на телефоне через туннель.
  preview: { allowedHosts: ['.trycloudflare.com'] },
  build: {
    rollupOptions: {
      // Главная и страница паспорта объекта бронирования собираются как отдельные входы.
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
      },
    },
  },
}))
