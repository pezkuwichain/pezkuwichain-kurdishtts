/* =============================================================================
   DknWC — WalletConnect v2 (browser entry, bundled to site/dkn-wc.js).

   PORTED FROM loto.pex.mom, which runs it in production, rather than written
   again here. It is what lets a reader on a phone sign in at all: there is no
   browser extension on a phone, so an extension-only sheet asks someone on an
   Android or an iPhone to install something they cannot install.

   LAZY-LOADED only when a reader picks the wallet-app route. Heavy
   (sign-client), so it is kept OUT of the main dkn-chain.js bundle.

   This mirrors app.pezkuwichain.io's own pezWallet flow EXACTLY (same CAIP-2
   `polkadot` namespace + `polkadot_signTransaction`/`polkadot_signMessage` the
   pezWallet speaks). The signer signs the payload @pezkuwi/api builds — the
   wallet displays and approves it; nothing is altered here. The CAIP-2 chainId
   is derived from the payload's genesisHash, so the wallet always signs for the
   exact chain the transaction targets (Zagros relay in dev; one config swap to
   Pezkuwi mainnet for production). No @polkadot/* imports — only the `polkadot`
   protocol namespace string the wallet ecosystem mandates.
   ========================================================================== */
import './wc-polyfill.js';   // MUST be first — sets globalThis.Buffer/process for sign-client
import { SignClient } from '@walletconnect/sign-client';   // NAMED — the default export is the module object (no .init)
import QRCode from 'qrcode';

// WalletConnect Cloud client id. Set window.DKN_WC_PROJECT_ID in config.js to a
// news-specific project (cloud.reown.com) whose Allowed Domains include
// dks.news — required, or the relay/Verify rejects the origin. Falls back to
// the shared pezkuwichain id (works only on its allowed domains).
const PROJECT_ID = (typeof window !== 'undefined' && window.DKN_WC_PROJECT_ID) || '8292a793b7640e8364c378e331e76d04';
const SESSION_KEY = 'dkn_wc_session';
const METHODS = ['polkadot_signTransaction', 'polkadot_signMessage'];
const EVENTS = ['chainChanged', 'accountsChanged'];
// The chains app.pezkuwichain.io proposes, the flow the wallet is tested with
// (pwap web/src/lib/walletconnect-service.ts, REQUIRED_CHAIN_IDS). Proposing
// the same set means the wallet sees exactly the request it already answers.
const PEZKUWI_CHAINS = [
  'polkadot:1aa94987791a5544e9667ec249d2cef1', // Relay
  'polkadot:e7c15092dcbe3f320260ddbbc685bfce', // Asset Hub
  'polkadot:69a8d025ab7b63363935d7d9397e0f65', // People Chain
];

let client = null, initP = null, session = null, activeChainId = null, reqId = 0;

function chainIdFromGenesis(genesisHash) {
  const h = genesisHash.startsWith('0x') ? genesisHash.slice(2) : genesisHash;
  return 'polkadot:' + h.slice(0, 32);          // CAIP-2: first 16 bytes
}

async function init() {
  if (client) return client;
  if (initP) return initP;
  initP = SignClient.init({
    projectId: PROJECT_ID,
    // No usage events to WalletConnect's telemetry endpoint (pulse): the
    // privacy policy says this site sends no analytics, and it means it.
    telemetryEnabled: false,
    metadata: {
      name: 'KurdAi Voice',
      description: 'Dengê Kurdî — bexşa deng',
      url: 'https://kurdishtts.dks.news',
      icons: ['https://kurdishtts.dks.news/static/icon-192.png'],
      // lets pezWallet return to the browser after approving (mobile)
      redirect: { native: '', universal: 'https://kurdishtts.dks.news/bexsh' },
    },
  }).then((c) => {
    client = c;
    const drop = () => { session = null; try { localStorage.removeItem(SESSION_KEY); } catch (e) {} window.dispatchEvent(new Event('dknwc_disconnected')); };
    c.on('session_delete', drop);
    c.on('session_expire', drop);
    c.on('session_update', ({ params }) => { if (session) session = { ...session, namespaces: params.namespaces }; });
    return c;
  }).catch((e) => { initP = null; throw e; });
  return initP;
}

function sessionAccounts() {
  if (!session) return [];
  const ns = session.namespaces['polkadot'];
  if (!ns || !ns.accounts) return [];
  return [...new Set(ns.accounts.map((a) => a.split(':').pop()))];   // dedupe SS58
}

function valid() {
  if (!session) return false;
  return session.expiry > Math.floor(Date.now() / 1000);
}

function isMobile() {
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
}
// MOBILE: a signing request sits unseen in the wallet unless we bring it to the
// foreground. Deep-link to pezWallet (its session redirect, else the scheme) so
// the user is taken straight to the approval prompt.
function wakeWallet() {
  if (!isMobile()) return;
  const rd = session && session.peer && session.peer.metadata && session.peer.metadata.redirect;
  const link = (rd && (rd.native || rd.universal)) || 'pezkuwiwallet://';
  try { window.location.href = link; } catch (e) {}
}

// the @pezkuwi/api-compatible signer — routes signing through the live session
function makeSigner(address) {
  const ensure = () => {
    if (!client || !session) throw new Error('WC_NO_SESSION');
    if (!valid()) { session = null; try { localStorage.removeItem(SESSION_KEY); } catch (e) {} window.dispatchEvent(new Event('dknwc_disconnected')); throw new Error('WC_EXPIRED'); }
  };
  return {
    signPayload: async (payload) => {
      ensure();
      // derive chainId from THE PAYLOAD's genesisHash — the wallet rejects a
      // mismatch, so the user always signs for exactly the targeted chain.
      const chainId = payload.genesisHash ? chainIdFromGenesis(payload.genesisHash) : activeChainId;
      const reqP = client.request({
        topic: session.topic, chainId,
        request: { method: 'polkadot_signTransaction', params: { address, transactionPayload: payload } },
      });
      wakeWallet();                       // bring pezWallet up to approve (mobile)
      const { signature } = await reqP;
      return { id: ++reqId, signature };
    },
    signRaw: async (raw) => {
      ensure();
      const reqP = client.request({
        topic: session.topic, chainId: activeChainId,
        request: { method: 'polkadot_signMessage', params: { address, message: raw.data } },
      });
      wakeWallet();                       // bring pezWallet up to approve (mobile)
      const { signature } = await reqP;
      return { id: ++reqId, signature };
    },
  };
}

const DknWC = {
  // begin a pairing for `genesisHash`. Returns { uri, qrDataUrl, deepLink, approval }.
  // approval() resolves to the SS58 accounts once the wallet approves.
  async startPairing(genesisHash) {
    const c = await init();
    activeChainId = chainIdFromGenesis(genesisHash);
    const { uri, approval } = await c.connect({
      requiredNamespaces: { polkadot: { methods: METHODS, chains: [...new Set([activeChainId, ...PEZKUWI_CHAINS])], events: EVENTS } },
    });
    if (!uri) throw new Error('WC_NO_URI');
    const qrDataUrl = await QRCode.toDataURL(uri, { width: 300, margin: 2, color: { dark: '#04060E', light: '#ffffff' } });
    const deepLink = 'pezkuwiwallet://wc?uri=' + encodeURIComponent(uri);
    return {
      uri, qrDataUrl, deepLink,
      approval: async () => {
        const s = await approval();
        session = s;
        try { localStorage.setItem(SESSION_KEY, s.topic); } catch (e) {}
        window.dispatchEvent(new Event('dknwc_connected'));
        return sessionAccounts();
      },
    };
  },

  // restore a prior session (so a returning user need not re-pair)
  async restore(genesisHash) {
    const c = await init();
    activeChainId = chainIdFromGenesis(genesisHash);
    let topic = null; try { topic = localStorage.getItem(SESSION_KEY); } catch (e) {}
    if (!topic) return [];
    const s = c.session.getAll().find((x) => x.topic === topic);
    if (s && s.expiry > Math.floor(Date.now() / 1000)) { session = s; return sessionAccounts(); }
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    return [];
  },

  accounts: sessionAccounts,
  isConnected: () => session !== null && valid(),
  peerName: () => (session && session.peer && session.peer.metadata && session.peer.metadata.name) || null,
  getSigner: (address) => makeSigner(address),
  async disconnect() {
    if (client && session) { try { await client.disconnect({ topic: session.topic, reason: { code: 6000, message: 'User disconnected' } }); } catch (e) {} }
    session = null; try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    window.dispatchEvent(new Event('dknwc_disconnected'));
  },
};

if (typeof window !== 'undefined') window.DknWC = DknWC;
export default DknWC;
