import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import handler from '../api/[...path].js';

function loadEnvFile(fileName) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

const port = Number.parseInt(process.env.PORT || process.env.API_PORT || '3000', 10);

function createResponseAdapter(nodeRes) {
  let statusCode = 200;

  return {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader(name, value) {
      nodeRes.setHeader(name, value);
      return this;
    },
    getHeader(name) {
      return nodeRes.getHeader(name);
    },
    send(payload) {
      nodeRes.statusCode = statusCode;

      if (payload == null) {
        nodeRes.end();
        return;
      }

      if (Buffer.isBuffer(payload) || typeof payload === 'string') {
        nodeRes.end(payload);
        return;
      }

      if (!nodeRes.getHeader('content-type')) {
        nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      nodeRes.end(JSON.stringify(payload));
    },
    json(payload) {
      this.setHeader('Content-Type', 'application/json; charset=utf-8');
      this.send(payload);
    }
  };
}

function parseRequestBody(rawBody, contentType) {
  if (!rawBody.length) {
    return undefined;
  }

  const bodyText = rawBody.toString('utf8');
  if (!bodyText.trim()) {
    return undefined;
  }

  if (contentType?.includes('application/json')) {
    try {
      return JSON.parse(bodyText);
    } catch {
      return bodyText;
    }
  }

  return bodyText;
}

const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));

    req.on('end', async () => {
      const rawBody = Buffer.concat(chunks);
      req.body = parseRequestBody(rawBody, req.headers['content-type']);

      const responseAdapter = createResponseAdapter(res);
      await handler(req, responseAdapter);
    });
  } catch (error) {
    console.error('[dev:api] Request failed:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    );
  }
});

server.listen(port, () => {
  console.log(`[dev:api] Local API functions listening on http://localhost:${port}`);
});
