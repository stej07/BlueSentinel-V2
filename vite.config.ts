import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    watch: { ignored: ['**/.venv/**', '**/ai/**', '**/data/**'] }
  },
  plugins: [react()],
})
