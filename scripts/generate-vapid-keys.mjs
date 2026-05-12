import { generateKeyPairSync } from 'node:crypto';

const { publicKey: pubJwk } = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
  publicKeyEncoding: { format: 'jwk' },
  privateKeyEncoding: { format: 'jwk' },
});

function fromBase64Url(b64) {
  return Buffer.from(b64.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function toBase64Url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// VAPID public key must be the uncompressed EC point: 04 || x || y
const pubRaw = Buffer.concat([Buffer.from([0x04]), fromBase64Url(pubJwk.x), fromBase64Url(pubJwk.y)]);

const publicKey = toBase64Url(pubRaw);
console.log('Add these to your .env file:\n');
console.log(`VITE_VAPID_PUBLIC_KEY=${publicKey}`);
