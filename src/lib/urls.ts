const FALLBACK_ORIGIN = 'https://naijoug.github.io';

export function origin(): string {
  const site = import.meta.env.SITE || FALLBACK_ORIGIN;
  return site.replace(/\/$/, '');
}

/** Root-relative URL, including the Pages base path. */
export function href(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  if (path === '' || path === '/') return base;
  return `${base}${path.replace(/^\//, '')}`;
}

export function absolute(path: string): string {
  return new URL(href(path), `${origin()}/`).toString();
}
