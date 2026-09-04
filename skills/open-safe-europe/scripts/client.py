#!/usr/bin/env python3
"""Open SAFE Europe API client. No external dependencies."""
import argparse
import json
import pathlib
import sys
import urllib.request
import urllib.error

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('action', choices=['schema', 'validate', 'draft', 'export'])
parser.add_argument('--input', type=pathlib.Path)
parser.add_argument('--output', type=pathlib.Path)
parser.add_argument('--format', choices=['txt', 'docx', 'pdf'])
parser.add_argument('--base-url', default='https://open-safe-europe.pages.dev')
args = parser.parse_args()
body = None
if args.action != 'schema':
    if not args.input:
        parser.error('--input is required')
    body = json.loads(args.input.read_text())
    if args.action == 'export':
        if not args.output or not args.format:
            parser.error('export requires --format and --output')
        body['format'] = args.format
request = urllib.request.Request(args.base_url.rstrip('/') + '/api/' + args.action,
    data=json.dumps(body).encode() if body is not None else None,
    headers={'Content-Type': 'application/json', 'User-Agent': 'Open-SAFE-Europe/0.1'})
try:
    with urllib.request.urlopen(request, timeout=60) as response:
        result = response.read()
except urllib.error.HTTPError as error:
    print(error.read().decode(), file=sys.stderr)
    sys.exit(1)
except urllib.error.URLError as error:
    print(f'Connection failed: {error.reason}. Check connectivity and your Python certificate store.', file=sys.stderr)
    sys.exit(1)
if args.output:
    args.output.write_bytes(result)
else:
    print(result.decode())
