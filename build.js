// Inlines the Geist fonts so the prototype is one self-contained file.
const fs = require('fs');
const path = require('path');
const b64 = (p) => fs.readFileSync(path.join(__dirname, 'node_modules/geist/dist/fonts', p)).toString('base64');
const fonts = `
@font-face{font-family:"Geist";src:url(data:font/woff2;base64,${b64('geist-sans/Geist-Variable.woff2')}) format("woff2");font-weight:100 900;font-display:swap}
@font-face{font-family:"Geist Mono";src:url(data:font/woff2;base64,${b64('geist-mono/GeistMono-Variable.woff2')}) format("woff2");font-weight:100 900;font-display:swap}`;
const src = fs.readFileSync(path.join(__dirname, 'src/index.html'), 'utf8');
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
const out = path.join(__dirname, 'dist/replai-redesign.html');
fs.writeFileSync(out, src.replace('/*__FONTS__*/', fonts));
console.log(out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
