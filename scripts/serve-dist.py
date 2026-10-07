#!/usr/bin/env python3
"""ビルドした dist/ を、本番と同じ CSP ヘッダーをつけて配信する（ローカル確認用）。

CSP のハッシュがずれていると本番で画面が動かなくなるので、デプロイ前にこれで開いて確かめる。
  bash scripts/build.sh && python3 scripts/serve-dist.py 8766
"""
import functools
import http.server
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist")

with open(os.path.join(ROOT, ".htaccess"), encoding="utf-8") as f:
    CSP = re.search(r'Content-Security-Policy "([^"]+)"', f.read()).group(1)


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Content-Security-Policy", CSP)
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
print(f"http://127.0.0.1:{port}/ で dist/ を配信します（CSP つき）", flush=True)
http.server.ThreadingHTTPServer(("127.0.0.1", port), functools.partial(Handler, directory=ROOT)).serve_forever()
