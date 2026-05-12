# Notification History Local Testing

Notification history reads from MongoDB through `GET /api/notifications/history`.
The endpoint is implemented in `api/[...path].js`, so it only exists when the
local Vercel functions server or a deployed preview for this PR is running.

## Required Environment

Use a local env file with a write-capable MongoDB URI:

```sh
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
DATABASE_NAME=benefitsV3
```

`MONGODB_URI_READ_ONLY` is not enough for subscription writes or notification
history writes. Push sending also needs `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
and optionally `NOTIFICATIONS_SECRET`, but history rendering can be tested by
seeding `notification_history` directly.

## Recreate Locally

1. Start the API functions server:

```sh
pnpm dev:vercel:functions
```

2. Start the app with the local API proxy target:

```sh
VITE_API_BASE_URL=http://localhost:3000 pnpm dev
```

3. Seed a notification history row in the same database:

```sh
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority" \
DATABASE_NAME="benefitsV3" \
node -e '
  const { MongoClient } = require("mongodb");
  (async () => {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    await client.db(process.env.DATABASE_NAME).collection("notification_history").insertOne({
      title: "PR smoke notification",
      body: "History entry seeded locally",
      url: "/search",
      sentAt: new Date(),
      sent: 0,
      total: 0
    });
    await client.close();
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
'
```

4. Confirm the endpoint returns the seeded row:

```sh
curl http://localhost:3000/api/notifications/history
```

5. Open `/notifications` in the local app. The seeded item should appear under
the current day and navigate to `/search` when selected.

## Send Endpoint Example

Use this only against local or preview environments with test subscriptions:

```sh
curl -X POST http://localhost:3000/api/notifications/send \
  -H "content-type: application/json" \
  -d '{"secret":"<NOTIFICATIONS_SECRET>","title":"PR smoke notification","body":"Sent from local API","url":"/search"}'
```

If `push_subscriptions` is empty, the send endpoint returns success with
`sent: 0` and does not create history. For UI testing, seed
`notification_history` directly as shown above.

## Current PR Caveat

The production live proxy returns `404` for this route until this PR is deployed,
because production does not have the new notification history endpoint yet.
Do not test push subscription or send flows against production while validating
this PR.
