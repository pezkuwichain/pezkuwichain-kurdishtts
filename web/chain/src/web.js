/* =============================================================================
   DknChain — the browser chain surface for dks.news (bundled to
   site/dkn-chain.js by build-web.mjs, loaded lazily).

   LANGUAGE-AGNOSTIC by design: every function returns structured data or a
   short error code. All reader-facing text is rendered by news.js in the six
   site languages. Copying loto-pex's discipline, which is in production.

   NON-CUSTODIAL, and the same wallet system as app.pezkuwichain.io: the reader
   connects their existing Pezkuwi wallet through the injected provider
   (window.injectedWeb3 — see signingSources). No password, no site-managed
   keystore. The key never leaves the wallet; we only ask for signatures.

   This bundle is large (it carries @pezkuwi/api), so news.js must load it on
   demand — when someone opens the wallet sheet — never on first paint.
   ========================================================================== */
import './wc-polyfill.js';   // MUST be first — Buffer/process globals for deps
import { ApiPromise, WsProvider } from '@pezkuwi/api';
import { decodeAddress } from '@pezkuwi/util-crypto';
import { u8aEq } from '@pezkuwi/util';

const APP_NAME = 'Dijital Kurdistan News';

/* Subscription payment. Measured against the live chain on 2026-09-10, not
   taken from a document:
     chain    Pezkuwichain Asset Hub, wss://asset-hub-rpc.pezkuwichain.io
     asset    1000 — symbol wUSDT, name "Wrapped USDT", 6 decimals
     call     assets.transferKeepAlive(1000, dest, amount)
   Re-measure with the same query before changing any of these. */
const AH_WS = (typeof window !== 'undefined' && window.DKN_AH_WS) || 'wss://asset-hub-rpc.pezkuwichain.io';
const USDT_ASSET = 1000;
const USDT_DECIMALS = 6;
const TREASURY = '5HTU5xskxgx9HM2X8ssBCNkuQ4XECQXpfn85VkQEY6AE9YbT';
// Whole USDT. The planck amount is derived, never written out by hand — a
// hand-typed 10_000_000 is one zero away from a tenfold overcharge.
const PLANS = { month: 10, year: 80 };

let _api = null;

async function api() {
  if (_api && _api.isConnected) return _api;
  _api = await ApiPromise.create({ provider: new WsProvider(AH_WS) });
  return _api;
}

function planck(whole) {
  return BigInt(whole) * 10n ** BigInt(USDT_DECIMALS);
}

/** Whole-unit string for a planck amount, trailing zeros trimmed. */
function fmtUsdt(amount) {
  const p = BigInt(amount);
  const unit = 10n ** BigInt(USDT_DECIMALS);
  const w = p / unit;
  const f = (p % unit).toString().padStart(USDT_DECIMALS, '0').replace(/0+$/, '');
  return f ? `${w}.${f}` : `${w}`;
}

// ── which routes exist on this device ────────────────────────────────────
/* Ported from loto.pex.mom's platform matrix, which is in production. The
   point of it: THERE IS NO BROWSER EXTENSION ON A PHONE. An extension-only
   sheet asks a reader on Android or iPhone to install something they cannot
   install, which is what this site was doing.

     in-app   the wallet's own browser  -> its native bridge, no prompt
     desktop  extension, or a QR to a wallet on a phone
     android  deep-link: open the wallet app on this device and approve
     ios      QR to a wallet on another device (the wallet app is Android-only)
*/
function detectPlatform() {
  if (typeof window !== 'undefined' && (window.PEZKUWI_MOBILE === true ||
      (window.PezkuwiNativeBridge && typeof window.PezkuwiNativeBridge.signTransaction === 'function'))) {
    return 'inapp';
  }
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  const iOS = /iPad|iPhone|iPod/.test(ua) ||
    (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (iOS) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

/* Which routes a device has is decided in dkn-wallet.js, not here: it needs
   only `navigator` and `window.injectedWeb3`, and the sheet must be able to
   draw its two buttons without first fetching this 843 kB bundle. Asking this
   file meant the sheet had no answer yet and fell back to "install a browser
   extension" — on a phone, where none can be installed. */

const WC_SRC = (typeof window !== 'undefined' && window.DKN_WC_SRC) || '/dkn-wc.js';
let wcP = null;
/** The WalletConnect bundle, fetched only when someone chooses that route. */
function wc() {
  if (typeof window !== 'undefined' && window.DknWC) return Promise.resolve(window.DknWC);
  if (wcP) return wcP;
  wcP = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = WC_SRC;
    s.onload = () => (window.DknWC ? resolve(window.DknWC) : reject(new Error('WC_BUNDLE')));
    s.onerror = () => { wcP = null; reject(new Error('WC_BUNDLE')); };
    document.head.appendChild(s);
  });
  return wcP;
}

// Addresses that arrived over WalletConnect sign through it, not through an
// extension that is not there.
const WC_ADDRS = new Set();

/** The chain we pair against. The wallet signs for exactly this genesis, so it
 *  is read from the chain rather than written down. */
/* Asset Hub's genesis hash: what WalletConnect names the chain by. It never
   changes, so it is written here rather than read from the node. Reading it
   meant opening the RPC connection and fetching 479 kB of metadata before a QR
   code could appear -- about two seconds of a sign-in sheet that said it was
   waiting for the wallet, when nothing had been sent to the wallet yet
   (measured 2026-10-06: open 0.7 s, metadata 0.8 s, then decoding).
   tests/test_chain.py checks it against the live node. */
const AH_GENESIS = '0xe7c15092dcbe3f320260ddbbc685bfceed9125a3b3d8436db2766201dec3b949';

async function genesis() {
  return (typeof window !== 'undefined' && window.DKN_AH_GENESIS) || AH_GENESIS;
}

// ── wallet ───────────────────────────────────────────────────────────────
/* Which injected providers are asked. The server checks an sr25519 signature
   under the `bizinikiwi` signing context only (comments/server.mjs,
   admin/verify_sig.mjs), so a provider built on the upstream `substrate` context
   can never produce one that verifies. On a desktop that leaves the Pezkuwi
   extension. Asking every injected extension — what web3Enable does — also
   asked Polkadot{.js}, and an empty Polkadot{.js} answers with a window ("You do
   not have any account") that held the whole sign-in until the reader found and
   closed it; measured with both real extensions. Inside Pezkuwi Wallet's own
   browser the provider is the wallet's, under whichever name it is injected. */
function signingSources() {
  if (typeof window === 'undefined' || !window.injectedWeb3) return [];
  const inApp = window.PEZKUWI_MOBILE === true ||
    !!(window.PezkuwiNativeBridge && typeof window.PezkuwiNativeBridge.signTransaction === 'function');
  return Object.keys(window.injectedWeb3).filter((k) => inApp || /^pezkuwi/i.test(k));
}

/* The extension refuses a second authorisation request from the same site
   within five seconds, and a second signing request within three ("Too many
   authorization requests", "Rate limit exceeded"). Those refusals mean "wait",
   not "no", so each is waited out once instead of reaching the reader. */
const AUTH_WAIT_MS = 5500;
const SIGN_WAIT_MS = 3500;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const saysWait = (e, re) => re.test(String((e && e.message) || ''));

const enabled = new Map();   // provider name -> what its enable() returned, once per page
async function enableSource(key) {
  if (enabled.has(key)) return enabled.get(key);
  const provider = window.injectedWeb3[key];
  const ask = () => (provider.connect ? provider.connect(APP_NAME) : provider.enable(APP_NAME));
  let injected;
  try {
    injected = await ask();
  } catch (e) {
    if (!saysWait(e, /too many authori[sz]ation requests/i)) throw e;
    await sleep(AUTH_WAIT_MS);
    injected = await ask();
  }
  enabled.set(key, injected);
  return injected;
}

const sameKey = (a, b) => {
  try { return u8aEq(decodeAddress(a), decodeAddress(b)); } catch (e) { return false; }
};

/** Returns { accounts: [{ address, name, source }] } or { error: CODE }.
 *  Codes: NO_EXTENSION (no provider that can sign here) · NO_ACCOUNTS (it gave
 *  this site no account, or would not let the site in) · REJECTED (the reader
 *  turned the request down). dkn-wallet.js maps codes to text in six languages. */
async function connect() {
  const keys = signingSources();
  if (keys.length === 0) return { error: 'NO_EXTENSION' };
  const accounts = [];
  let refusal = null;
  for (const key of keys) {
    try {
      const injected = await enableSource(key);
      for (const a of await injected.accounts.get()) {
        accounts.push({ address: a.address, name: a.name || '', source: key });
      }
    } catch (e) {
      // The provider's own words, kept where a developer looks, since the
      // reader's message can only name the kind of failure.
      console.warn(`DknChain: ${key} refused: ${(e && e.message) || e}`);
      refusal = e;
    }
  }
  if (accounts.length === 0) {
    return { error: saysWait(refusal, /reject|cancel/i) ? 'REJECTED' : 'NO_ACCOUNTS' };
  }
  return { accounts };
}

/** The signer for an address, whichever way it got here. An address that
 *  arrived over WalletConnect signs through the session. Otherwise the provider
 *  holding that key is asked on THIS page: a reader signed in on another page,
 *  or before a reload, has a session but no provider enabled here, and the
 *  author desk used to drop them back to the ways in instead of signing. Keys
 *  are compared, not address strings, since one key prints differently under
 *  another network prefix. */
async function signerFor(address) {
  if (WC_ADDRS.has(address)) {
    const W = await wc();
    return W.getSigner(address);
  }
  for (const key of signingSources()) {
    const injected = await enableSource(key);
    const held = await injected.accounts.get();
    if (held.some((a) => sameKey(a.address, address))) return injected.signer;
  }
  throw new Error('NO_SIGNER');
}

/** Sign an arbitrary message (the sign-in challenge, an author's act). The
 *  wallet shows it and signs; we never see the key. Returns { signature } or
 *  { error }. */
async function signMessage(address, message) {
  try {
    const signer = await signerFor(address);
    if (!signer.signRaw) return { error: 'NO_SIGNER' };
    const raw = { address, data: message, type: 'bytes' };
    let result;
    try {
      result = await signer.signRaw(raw);
    } catch (e) {
      if (!saysWait(e, /rate limit exceeded/i)) throw e;
      await sleep(SIGN_WAIT_MS);
      result = await signer.signRaw(raw);
    }
    return { signature: result.signature };
  } catch (e) {
    return { error: saysWait(e, /reject|cancel|denied/i) ? 'REJECTED' : 'SIGN_FAILED' };
  }
}

// ── WalletConnect: the route a phone actually has ────────────────────────
/** Start a pairing. Returns { qrDataUrl, deepLink, approval } — the sheet shows
 *  the QR on a desktop and follows the deep-link on a phone, because on the
 *  phone the wallet is on the same device and there is nothing to scan. */
async function wcStart() {
  try {
    const W = await wc();
    // A cap, so a refused relay does not leave a spinner for ever -- but a
    // generous one. Fifteen seconds cut off phones on slow networks mid-handshake
    // and showed "something went wrong" (2026-10-06); app.pezkuwichain.io, whose
    // flow works on the same wallet, sets no limit on this step at all.
    const pr = await Promise.race([
      W.startPairing(await genesis()),
      new Promise((_, rej) => setTimeout(() => rej(new Error('WC_TIMEOUT')), 60000)),
    ]);
    return {
      qrDataUrl: pr.qrDataUrl,
      deepLink: pr.deepLink,
      approval: async () => {
        const accounts = await pr.approval();
        accounts.forEach((a) => WC_ADDRS.add(a));
        return accounts.map((address) => ({ address, name: '', source: 'pezWallet', wc: true }));
      },
    };
  } catch (e) {
    var msg = String((e && e.message) || '');
    if (msg === 'WC_BUNDLE') return { error: 'WC_UNAVAILABLE' };
    /* Deliberately NOT trying to name which failure this is.
       Two attempts were made and both were measured to fail: the relay's
       "origin not allowed" never reaches a window-level listener on this page
       (zero events observed over a full pairing on production), and a bare
       probe socket to the relay closes with 1006 from EVERY origin, including
       ones the relay does allow — so it cannot tell a refused domain from an
       unreachable relay. Reporting a guess would send whoever reads it to fix
       the wrong thing, so the message below names both possibilities instead,
       and scripts/check_wallet_live.mjs carries the precise diagnosis for
       whoever can act on it. */
    if (msg === 'WC_TIMEOUT') return { error: 'WC_TIMEOUT' };
    return { error: 'WC_FAILED', reason: msg.slice(0, 160) };
  }
}

/** A session survives a reload; a returning reader should not pair again. */
async function wcRestore() {
  try {
    const W = await wc();
    const accounts = await W.restore(await genesis());
    accounts.forEach((a) => WC_ADDRS.add(a));
    return accounts.map((address) => ({ address, name: '', source: 'pezWallet', wc: true }));
  } catch (e) {
    return [];
  }
}

async function wcDisconnect() {
  if (typeof window !== 'undefined' && window.DknWC) {
    try { await window.DknWC.disconnect(); } catch (e) { /* already gone */ }
  }
  WC_ADDRS.clear();
}

// ── balances ─────────────────────────────────────────────────────────────
/** wUSDT balance as a planck string, '0' when the account holds none. */
async function usdtBalance(address) {
  const a = await api();
  const row = await a.query.assets.account(USDT_ASSET, address);
  if (row.isNone) return '0';
  return row.unwrap().balance.toString();
}

/** Native balance on Asset Hub — the fee currency. A reader with wUSDT but no
 *  native balance cannot pay, and the failure is otherwise cryptic. */
async function feeBalance(address) {
  const a = await api();
  const { data } = await a.query.system.account(address);
  return data.free.toString();
}

// ── the subscription payment ─────────────────────────────────────────────
/** Build, sign and submit the subscription transfer.
 *
 *  onStatus is called with structured stages so the sheet can narrate without
 *  this file knowing any language: 'signing' · 'broadcast' · 'inBlock'.
 *
 *  Resolves { txHash, blockHash } only once the transfer is IN A BLOCK and the
 *  dispatch did not error. Being in a block is not finality — the backend
 *  re-checks the transfer on chain before it grants anything, so a reorg can
 *  only delay a subscription, never fabricate one.
 */
async function paySubscription(address, plan, onStatus) {
  const whole = PLANS[plan];
  if (!whole) return { error: 'BAD_PLAN' };
  const amount = planck(whole);

  const a = await api();
  const have = BigInt(await usdtBalance(address));
  if (have < amount) {
    return { error: 'LOW_USDT', need: amount.toString(), have: have.toString() };
  }
  if (BigInt(await feeBalance(address)) === 0n) return { error: 'NO_FEE_BALANCE' };

  let signer;
  try {
    signer = await signerFor(address);
  } catch (e) {
    return { error: 'NO_SIGNER' };
  }

  const tx = a.tx.assets.transferKeepAlive(USDT_ASSET, TREASURY, amount);
  if (onStatus) onStatus('signing');

  return new Promise((resolve) => {
    let unsub = null;
    tx.signAndSend(address, { signer: signer, nonce: -1 }, (res) => {
      const { status, dispatchError, txHash } = res;
      if (status.isBroadcast && onStatus) onStatus('broadcast');
      if (dispatchError) {
        let reason = dispatchError.toString();
        if (dispatchError.isModule) {
          try {
            const d = a.registry.findMetaError(dispatchError.asModule);
            reason = `${d.section}.${d.name}`;
          } catch (e) { /* keep the raw string */ }
        }
        if (unsub) unsub();
        resolve({ error: 'DISPATCH_FAILED', reason });
        return;
      }
      if (status.isInBlock) {
        if (onStatus) onStatus('inBlock');
        if (unsub) unsub();
        resolve({
          txHash: txHash.toHex(),
          blockHash: status.asInBlock.toHex(),
          amount: amount.toString(),
          plan,
        });
      }
    }).then((u) => { unsub = u; })
      .catch((e) => {
        resolve({ error: /reject|cancel|denied/i.test(String(e && e.message)) ? 'REJECTED' : 'SEND_FAILED' });
      });
  });
}

const DknChain = {
  connect, signMessage, usdtBalance, feeBalance, paySubscription,
  platform: detectPlatform,
  wcStart, wcRestore, wcDisconnect,
  fmtUsdt,
  plans: () => ({ ...PLANS }),
  info: () => ({ ws: AH_WS, asset: USDT_ASSET, decimals: USDT_DECIMALS, treasury: TREASURY }),
  disconnect: async () => { if (_api) { try { await _api.disconnect(); } catch (e) {} _api = null; } },
};

if (typeof window !== 'undefined') window.DknChain = DknChain;
export default DknChain;
