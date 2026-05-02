import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('VAPID keys generated. Add these to your .env file:\n');
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:your-email@example.com`);
console.log(`\n# Optional: secret to protect the /api/notifications/send endpoint`);
console.log(`NOTIFICATIONS_SECRET=your-random-secret-here`);
console.log(`\n# Optional: writable MongoDB URI (falls back to MONGODB_URI_READ_ONLY)`);
console.log(`MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority`);
