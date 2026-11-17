import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configura `process.env` en el archivo de configuración. Se declara aquí
// para no depender de @types/node en un proyecto que solo necesita navegador.
declare const process: { env: Record<string, string | undefined> };

/**
 * `VITE_BASE` permite compilar para un subdirectorio (por ejemplo GitHub Pages):
 *
 *   VITE_BASE=/agenda-empresarial-demo/ npm run build
 *
 * Sin variable, la app funciona en la raíz del dominio y en local (`npm run dev`).
 */
const base = process.env.VITE_BASE?.trim() || '/';

export default defineConfig({
  base,
  plugins: [react()],
});
