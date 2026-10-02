/* Bundle the browser chain surface (src/web.js) → static/kt-chain.js (IIFE,
   exposes window.DknChain). Run: npm run build
   The bundle is committed, like loto-pex's: the site itself has no build step,
   and a reader must never be asked to run one. */
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';

/* Stamp the bundle with a hash of the sources it was built from. A committed
   build artefact goes stale silently — you edit the source, forget the build,
   and production keeps running last week's code while the diff looks right.
   scripts/check_site.py recomputes this and fails when they disagree. */
function sourceHash() {
  const h = createHash('sha256');
  for (const f of readdirSync('src').sort()) h.update(f).update(readFileSync(`src/${f}`));
  return h.digest('hex').slice(0, 12);
}
const stamp = sourceHash();

const out = await build({
  entryPoints: ['src/web.js'],
  bundle: true,
  format: 'iife',
  globalName: 'DknChainBundle',
  platform: 'browser',
  target: 'es2020',
  outfile: '../../static/kt-chain.js',
  minify: true,
  legalComments: 'none',
  metafile: true,
  define: { 'process.env.NODE_ENV': '"production"', global: 'globalThis' },
  banner: { js: `/*! dkn-chain src:${stamp} */` },
});
const bytes = Object.values(out.metafile.outputs)[0].bytes;
console.log(`built static/kt-chain.js — ${(bytes / 1024).toFixed(0)} kB, src:${stamp}`);
console.log('NOTE: news.js must load this on demand, never on first paint.');
