#!/usr/bin/env node
/**
 * Inline UI Build Script
 *
 * Creates a single self-contained HTML file with inlined CSS and JS.
 * This is necessary because the node-arweave-wallet library only serves
 * the HTML template, not external CSS/JS files.
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = join(__dirname, '../src/ui');
const distDir = join(__dirname, '../dist/ui');

console.log('📦 Inlining UI assets...');

// Read source files
const htmlPath = join(srcDir, 'wallet-connect.html');
const cssPath = join(srcDir, 'wallet-connect.css');
const jsPath = join(srcDir, 'wallet-connect.js');

let html = readFileSync(htmlPath, 'utf-8');
const css = readFileSync(cssPath, 'utf-8');
const js = readFileSync(jsPath, 'utf-8');

// Replace CSS link with inline style tag
html = html.replace(
  /<link rel="stylesheet" href="wallet-connect\.css" \/>/,
  `<style>${css}</style>`
);

// Replace JS script tag with inline script
html = html.replace(
  /<script src="wallet-connect\.js"><\/script>/,
  `<script>${js}</script>`
);

// Write inlined HTML to dist
const outputPath = join(distDir, 'wallet-connect.html');
writeFileSync(outputPath, html, 'utf-8');

console.log('✅ Inlined HTML created at:', outputPath);
console.log('   - CSS inlined:',  css.length, 'bytes');
console.log('   - JS inlined:', js.length, 'bytes');
console.log('   - Total size:', html.length, 'bytes');
