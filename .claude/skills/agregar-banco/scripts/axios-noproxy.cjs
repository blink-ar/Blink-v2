// Cloud sandbox only (never commit this to a repo): axios 1.13 sends absolute-form requests
// to the agent proxy, which answers 405. Disable axios' own proxy handling so Node's
// built-in env proxy (NODE_USE_ENV_PROXY=1) tunnels HTTPS with CONNECT instead.
// Usage: NODE_USE_ENV_PROXY=1 node -r <this file> <script>
// FETCHER_V1_DIR overrides where axios is resolved from (default /home/user/fetcher-v1).
const fetcherDir = process.env.FETCHER_V1_DIR || '/home/user/fetcher-v1';
require(require.resolve('axios', { paths: [fetcherDir] })).defaults.proxy = false;
