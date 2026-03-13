# Search Service

This folder contains the web search client wrapper for the new `GET /api/search` endpoint.

## Runtime Flow

1. UI calls `fetchBusinessesPaginated` in `src/services/api.ts`.
2. When `search` is present, it delegates to `fetchSearch`.
3. `fetchSearch` calls `GET /api/search`.
4. The API returns grouped `intents`, `merchants`, `products`.
5. Web/mobile map the merchant section back to `Business[]` for existing UI components.

## Local Setup

1. Start Meilisearch (self-hosted single node).
2. Set environment variables:
   - `MEILISEARCH_HOST`
   - `MEILISEARCH_API_KEY` (optional for local)
   - `MEILISEARCH_INDEX`
3. Build index:
   - `npm run search:index`
4. Keep index in sync:
   - `npm run search:watch`
