#!/usr/bin/env python3
import http.server, socketserver, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
ROOT = sys.argv[2] if len(sys.argv) > 2 else "."
os.chdir(ROOT)

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not self.path.startswith('/_expo/static/'):
            # SPA fallback: serve index.html for non-file routes
            self.path = '/index.html'
        super().do_GET()

    def log_message(self, format, *args):
        pass

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
