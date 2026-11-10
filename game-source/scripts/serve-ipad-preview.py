#!/usr/bin/env python3
"""Serve only a dedicated test bundle on the user's LAN; never serve the repo."""
import argparse
import functools
import http.server
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('directory', nargs='?', default=str(Path(__file__).resolve().parent))
parser.add_argument('--port', type=int, default=8765)
args = parser.parse_args()
root = Path(args.directory).resolve()
if not (root / 'battle-ui-pr4-ipad.html').is_file():
    parser.error('Place battle-ui-pr4-ipad.html in this directory or specify its directory.')

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

handler = functools.partial(Handler, directory=str(root))
print(f'Serving {root}\nOn iPad Safari: http://<this-computer-LAN-IP>:{args.port}/battle-ui-pr4-ipad.html\nSame Wi-Fi required. Stop with Ctrl+C. Do not configure router port forwarding.', flush=True)
http.server.ThreadingHTTPServer(('0.0.0.0', args.port), handler).serve_forever()
