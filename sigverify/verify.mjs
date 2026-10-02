#!/usr/bin/env node
// Verify one Pezkuwi wallet signature.
//
//   stdin:  {"address": "...", "message": "...", "signature": "0x..."}
//   stdout: {"ok": true|false}
//
// Node, not Python: PezkuwiChain signs sr25519 in the `bizinikiwi` context,
// and py-sr25519 hardcodes `substrate`, so it would refuse every genuine
// Pezkuwi signature. The Pezkuwi Wallet mobile app, signing a message, picks
// the network from the address prefix and prefix 42 falls back to the
// standard `substrate` context; that signature is the same proof (the
// account's own key over our one-time challenge), so both contexts are
// accepted. Extensions wrap raw text in <Bytes>…</Bytes> and native signers
// do not, so both encodings are tried. This is the check dks.news makes at
// sign-in (comments/server.mjs), kept byte-for-byte equivalent.
import { cryptoWaitReady, decodeAddress, signatureVerify } from '@pezkuwi/util-crypto';
import { hexToU8a, stringToU8a, u8aWrapBytes } from '@pezkuwi/util';
import { verify as sr25519VerifySubstrateContext } from '@scure/sr25519';

let input = '';
for await (const chunk of process.stdin) input += chunk;

function verify(message, signature, address) {
  const payloads = [stringToU8a(message), u8aWrapBytes(message)];
  for (const payload of payloads) {
    try { if (signatureVerify(payload, signature, address).isValid) return true; } catch { /* failed proof */ }
  }
  try {
    const publicKey = decodeAddress(address);
    const sig = hexToU8a(signature);
    if (publicKey.length !== 32 || sig.length !== 64) return false;
    return payloads.some((p) => sr25519VerifySubstrateContext(p, sig, publicKey));
  } catch { return false; }
}

let ok = false;
try {
  const { address, message, signature } = JSON.parse(input);
  if (typeof address === 'string' && typeof message === 'string' && /^0x[0-9a-fA-F]{128}$/.test(signature || '')) {
    await cryptoWaitReady();
    ok = verify(message, signature, address);
  }
} catch { /* unreadable input is a failed proof */ }
process.stdout.write(JSON.stringify({ ok }) + '\n');
