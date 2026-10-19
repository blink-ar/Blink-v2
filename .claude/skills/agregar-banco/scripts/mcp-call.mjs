// Minimal stdio client for the REA MCP server (`rea mcp`).
// Usage: node mcp-call.mjs tools/list
//        node mcp-call.mjs tools/call '{"name":"capture_browser_scenario","arguments":{...}}'
import { spawn } from 'node:child_process';

const [, , method = 'tools/list', paramsJson = '{}'] = process.argv;
const server = spawn('rea', ['mcp'], { stdio: ['pipe', 'pipe', 'inherit'] });
let buffer = '';
let nextId = 0;
const pending = new Map();

server.stdout.on('data', (chunk) => {
  buffer += chunk;
  let newline;
  while ((newline = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, newline);
    buffer = buffer.slice(newline + 1);
    if (!line.trim()) continue;
    const message = JSON.parse(line);
    if (message.id != null && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  }
});

const send = (rpcMethod, params) => new Promise((resolve) => {
  const id = ++nextId;
  pending.set(id, resolve);
  server.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method: rpcMethod, params }) + '\n');
});

await send('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'cli', version: '0' } });
server.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
const response = await send(method, JSON.parse(paramsJson));
console.log(JSON.stringify(response.result ?? response.error, null, 1));
server.kill();
