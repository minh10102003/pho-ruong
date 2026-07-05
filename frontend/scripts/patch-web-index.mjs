import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const distDir = join(process.cwd(), 'dist');
const publicDir = join(process.cwd(), 'public');
const indexPath = join(distDir, 'index.html');

// Luôn đồng bộ icon/PWA từ public/ → dist/ sau mỗi lần export
const publicAssets = [
  'apple-touch-icon.png',
  'favicon.png',
  'icon-192.png',
  'manifest.webmanifest',
  '_redirects',
];

for (const file of publicAssets) {
  copyFileSync(join(publicDir, file), join(distDir, file));
}
console.log('Synced PWA assets from public/ to dist/');

let html = readFileSync(indexPath, 'utf8');

const tags = [
  '<meta name="theme-color" content="#468432" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<meta name="apple-mobile-web-app-title" content="PHỞ RUỘNG" />',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
  '<link rel="icon" type="image/png" href="/favicon.png" />',
  '<link rel="manifest" href="/manifest.webmanifest" />',
]
  .map((tag) => `    ${tag}`)
  .join('\n');

if (!html.includes('apple-touch-icon')) {
  html = html.replace('</head>', `${tags}\n  </head>`);
  html = html.replace('<html lang="en">', '<html lang="vi">');
  writeFileSync(indexPath, html, 'utf8');
  console.log('Patched dist/index.html with PWA icon tags');
}

// SPA fallback: Render/custom domain reload on /reports, /orders, ...
writeFileSync(join(distDir, '_redirects'), '/* /index.html 200\n', 'utf8');
copyFileSync(indexPath, join(distDir, '404.html'));
console.log('Added SPA fallback files (_redirects, 404.html)');
