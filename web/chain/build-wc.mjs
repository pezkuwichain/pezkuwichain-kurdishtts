/* Bundle the WalletConnect surface (src/wc-web.js) → static/kt-wc.js (IIFE,
   exposes window.DknWC). LAZY-loaded only when a reader picks the wallet-app
   route, which is why it is kept out of dkn-chain.js: sign-client is heavy and
   a reader who never signs in should not pay for it.
   Run: npm run build:wc  */
import { build } from 'esbuild';

const out = await build({
  entryPoints: ['src/wc-web.js'],
  bundle: true,
  format: 'iife',
  globalName: 'DknWCBundle',
  platform: 'browser',
  target: 'es2020',
  outfile: '../../static/kt-wc.js',
  minify: true,
  legalComments: 'none',
  metafile: true,
  define: { 'process.env.NODE_ENV': '"production"', global: 'globalThis' },
});
const bytes = Object.values(out.metafile.outputs)[0].bytes;
console.log(`built static/kt-wc.js — ${(bytes / 1024).toFixed(0)} kB`);
