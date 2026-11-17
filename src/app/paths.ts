/**
 * Rutas de la aplicación.
 *
 * `BASE_URL` lo define Vite a partir de su opción `base`:
 * - `/` para ejecución local y despliegue en la raíz del dominio.
 * - `/nombre-repo/` si se compila con `VITE_BASE=/nombre-repo/`.
 *
 * React Router usa el mismo valor como `basename`, de modo que las rutas
 * internas siguen funcionando tanto en la raíz como en un subdirectorio.
 */
const rawBase = import.meta.env.BASE_URL || '/';

export const basename = rawBase === '/' ? '/' : rawBase.replace(/\/+$/, '');

/** Construye la URL de un archivo estático de `public/`. */
export function assetUrl(file: string): string {
  return `${rawBase}${file.replace(/^\/+/, '')}`;
}
