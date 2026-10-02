// Gate for verify.mjs: real signatures pass, five ways of being wrong fail,
// and the mobile wallet's substrate-context signature is accepted.
import { spawnSync } from 'node:child_process';
import { cryptoWaitReady } from '@pezkuwi/util-crypto';
import { Keyring } from '@pezkuwi/keyring';
import { u8aToHex, u8aWrapBytes, stringToU8a } from '@pezkuwi/util';
import { sign as substrateSign, secretFromSeed, getPublicKey } from '@scure/sr25519';
import { encodeAddress } from '@pezkuwi/util-crypto';

await cryptoWaitReady();
const msg = 'KurdishTTS\nnonce:deadbeef\ndem:1789000000';
const kr = new Keyring({ type: 'sr25519', ss58Format: 42 });
const me = kr.addFromUri('//KurdishTtsTest');
const other = kr.addFromUri('//SomeoneElse');
const seed = new Uint8Array(32).fill(7);
const sec = secretFromSeed(seed);
const mobileAddr = encodeAddress(getPublicKey(sec), 42);

const run = (address, message, signature) => JSON.parse(spawnSync('node', [new URL('./verify.mjs', import.meta.url).pathname],
  { input: JSON.stringify({ address, message, signature }) }).stdout.toString()).ok;

const cases = [
  ['extension-wrapped (bizinikiwi)  PASS', run(me.address, msg, u8aToHex(me.sign(u8aWrapBytes(msg)))), true],
  ['native raw (bizinikiwi)         PASS', run(me.address, msg, u8aToHex(me.sign(stringToU8a(msg)))), true],
  ['mobile wallet (substrate ctx)   PASS', run(mobileAddr, msg, u8aToHex(substrateSign(sec, stringToU8a(msg)))), true],
  ['tampered message                FAIL', run(me.address, msg + ' ', u8aToHex(me.sign(u8aWrapBytes(msg)))), false],
  ['other address                   FAIL', run(other.address, msg, u8aToHex(me.sign(u8aWrapBytes(msg)))), false],
  ['garbage signature               FAIL', run(me.address, msg, '0x' + '11'.repeat(64)), false],
  ['broken address checksum         FAIL', run(me.address.slice(0, -1) + '1', msg, u8aToHex(me.sign(u8aWrapBytes(msg)))), false],
  ['empty signature                 FAIL', run(me.address, msg, ''), false],
];
let bad = 0;
for (const [name, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'OK ' : 'XX '} ${name}`); }
console.log(`\n${cases.length - bad} passed, ${bad} failed`);
process.exit(bad ? 1 : 0);
