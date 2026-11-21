// Inlines the fonts and the hero still so the prototype is one self-contained file.
const fs = require('fs');
const path = require('path');
const b64 = (p) => fs.readFileSync(path.join(__dirname, p)).toString('base64');
const face = (family, file, weight) => `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${b64(file)}) format("woff2");font-weight:${weight};font-style:normal;font-display:swap}`;
// Type system: Poppins 600 for headings, DM Sans for everything else, DM Mono for code.
const fonts = '\n' + [
  face('Poppins', 'node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2', 600),
  face('DM Sans', 'node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2', '100 1000'),
  face('DM Mono', 'node_modules/@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2', 400),
  face('DM Mono', 'node_modules/@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2', 500),
  face('Replai Logo', 'src/geist-logo.woff2', '100 900'), // six glyphs, wordmark only
].join('\n');
const src = fs.readFileSync(path.join(__dirname, 'src/index.html'), 'utf8');
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
const out = path.join(__dirname, 'dist/replai-redesign.html');
const still = 'data:image/webp;base64,' + fs.readFileSync(path.join(__dirname, 'src/scene-still.webp')).toString('base64');
fs.writeFileSync(out, src.replace('/*__FONTS__*/', fonts).replace('__SCENE_STILL__', still));
console.log(out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
