import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const indexPath = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(indexPath, 'utf8');

const tags = [
  '<meta name="theme-color" content="#468432" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<meta name="apple-mobile-web-app-title" content="Phở Ruộng" />',
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
