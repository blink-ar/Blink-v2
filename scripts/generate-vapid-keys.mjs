import { generateKeyPairSync } from 'node:crypto';

const { publicKey: pubJwk, privateKey: privJwk } = generateKeyPairSync('ec', {
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
const privRaw = fromBase64Url(privJwk.d);

const publicKey = toBase64Url(pubRaw);
const privateKey = toBase64Url(privRaw);

console.log('Add these to your .env file:\n');
console.log(`VITE_VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log(`VAPID_SUBJECT=mailto:your-email@example.com`);
console.log(`\n# Optional: secret to protect POST /api/notifications/send`);
console.log(`NOTIFICATIONS_SECRET=your-random-secret-here`);
console.log(`\n# Optional: writable MongoDB URI (falls back to MONGODB_URI_READ_ONLY)`);
console.log(`MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority`);
