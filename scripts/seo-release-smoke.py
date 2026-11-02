#!/usr/bin/env python3
"""Read-only HTTP SEO evidence. Does not execute JS or submit analytics events."""
import concurrent.futures
import datetime
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.request

origin = (sys.argv[1] if len(sys.argv) > 1 else 'https://www.blinkapp.com.ar').rstrip('/')
paths = ['/', '/search', '/map', '/map/', '/profile', '/saved/', '/login', '/signup',
         '/notifications', '/auth/callback', '/seo-recovery-nonexistent-20261102',
         '/categorias/no-existe-20261102', '/categorias/gastronomia',
         '/comercios/coto--merchant_69a6ed2cb7ff0ecb9e33b0ee',
         '/robots.txt', '/sitemap.xml']

def inspect(path):
    start = time.monotonic()
    request = urllib.request.Request(origin + path, headers={'User-Agent': 'Blink-SEO-Release-Check/1.0'})
    try:
        response = urllib.request.urlopen(request, timeout=35)
    except urllib.error.HTTPError as error:
        response = error
    except Exception as error:
        return {'path': path, 'error': str(error), 'elapsed_ms': round((time.monotonic() - start) * 1000)}
    with response:
        raw = response.read()
        body = raw.decode('utf-8', errors='replace')
        tags = re.findall(r'<(?:meta|link)\b[^>]+>', body, flags=re.I)
        return {'path': path, 'status': response.code, 'url': response.url,
                'observed_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'elapsed_ms': round((time.monotonic() - start) * 1000),
                'headers': {k.lower(): v for k, v in response.headers.items() if k.lower() in
                    ['cache-control', 'x-vercel-cache', 'age', 'x-robots-tag', 'content-type', 'etag', 'x-vercel-id']},
                'seo_tags': [tag for tag in tags if re.search(r'canonical|name=["\']robots', tag, re.I)],
                'title': re.findall(r'<title>(.*?)</title>', body, flags=re.I | re.S),
                'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw),
                'sitemap_url_count': body.count('<url>') if 'sitemap' in path else None,
                'map_in_sitemap': bool(re.search(r'<loc>[^<]*/map/?</loc>', body)) if 'sitemap' in path else None,
                'child_sitemaps': re.findall(r'<sitemap>\s*<loc>(.*?)</loc>', body),
                'bootstrap_present': 'blink-merchant-bootstrap' in body}

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    results = list(pool.map(inspect, paths))
print(json.dumps({'origin': origin, 'captured_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  'method': 'GET without JS; not Googlebot; warm/cold cache not forced', 'results': results}, indent=2))
