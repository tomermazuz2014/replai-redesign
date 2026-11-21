# Replai redesign prototype

Round 1 of a redesign prototype for replaitech.ai: hero, proof strip and the search demo, desktop and mobile.
This is a design prototype for review, not the live site.

- `index.html` is the built, self-contained page (fonts inlined). Open it directly or serve it with GitHub Pages.
- `src/index.html` is the source. `node build.js` inlines the Geist fonts and writes `dist/replai-redesign.html`.
- The mascot in the page is a vector placeholder; the final character art is being produced separately.

## Build

```
npm install
node build.js && cp dist/replai-redesign.html index.html
```
