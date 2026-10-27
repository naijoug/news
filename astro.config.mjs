import { defineConfig } from 'astro/config';

// Project Pages for naijoug/news are served from /news/.
// CI passes BASE_PATH from actions/configure-pages. An empty value means the site root.
function siteBase() {
  if (process.env.BASE_PATH === undefined) return '/news';
  const raw = process.env.BASE_PATH.trim();
  if (raw === '' || raw === '/') return '/';
  return `/${raw.replace(/^\/+|\/+$/g, '')}`;
}

export default defineConfig({
  site: 'https://naijoug.github.io',
  base: siteBase(),
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  compressHTML: true,
});
