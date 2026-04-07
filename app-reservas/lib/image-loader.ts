// lib/image-loader.ts
export default function merakiImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // Si la URL ya es absoluta y no es de nuestro backend, no la procesamos (ej: externas)
  if (src.startsWith('http') && !src.includes(process.env.NEXT_PUBLIC_API_URL || '')) {
    return src;
  }
  
  // Si no tiene el path de media, lo retornamos tal cual
  if (!src.includes('/api/media')) {
    return src;
  }

  // Agregamos el parámetro de ancho 'w' que espera nuestro PublicMediaController
  const url = new URL(src, window.location.origin);
  url.searchParams.set('w', width.toString());
  if (quality) {
    url.searchParams.set('q', quality.toString()); // El backend por ahora no usa q, pero es buena práctica
  }
  
  return url.toString();
}
