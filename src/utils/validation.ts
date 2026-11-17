export const MAX_IMAGE_MB = 5;
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
export function validateImage(f: File): string | null {
  if (!f.type.startsWith('image/')) return `«${f.name}» no es una imagen.`;
  if (f.size > MAX_IMAGE_MB * 1024 * 1024) return `«${f.name}» supera ${MAX_IMAGE_MB} MB.`;
  return null;
}
