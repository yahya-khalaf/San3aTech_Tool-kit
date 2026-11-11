import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
// Set BASE_PATH (for example BASE_PATH=/pcb/) when hosting under a sub-path.
export default defineConfig(() => ({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
}))
