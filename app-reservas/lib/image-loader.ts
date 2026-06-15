// lib/image-loader.ts
const getOrigin = () => {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_API_URL || 'https://merakitravelsbackend.prome.works';
};

export default function merakiImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith('http') && !src.includes(process.env.NEXT_PUBLIC_API_URL || '')) {
    return src;
  }

  if (!src.includes('/api/media')) {
    return src;
  }

  const url = new URL(src, getOrigin());
  url.searchParams.set('w', width.toString());
  if (quality) {
    url.searchParams.set('q', quality.toString());
  }

  return url.toString();
}
