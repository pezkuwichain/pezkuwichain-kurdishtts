/* Browser polyfills WalletConnect's deps assume (Buffer, process). Imported
   FIRST by wc-web.js so globals exist before sign-client runs. */
import { Buffer } from 'buffer';
import process from 'process';
if (typeof globalThis.Buffer === 'undefined') globalThis.Buffer = Buffer;
if (typeof globalThis.process === 'undefined') globalThis.process = process;
if (globalThis.process && !globalThis.process.version) globalThis.process.version = 'v18.0.0';
