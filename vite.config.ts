import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relativo: funciona no GitHub Pages (subpasta) e em qualquer host estático.
export default defineConfig({
  base: './',
  plugins: [react()],
})
