// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// If you deploy as GitHub Pages project site, set base to '/divine-detailing-frontend/'
// If you deploy to a custom path or root, adjust/remove base accordingly.
export default defineConfig({
  plugins: [react()],
  base: '/divine-detailing-frontend/'
});
