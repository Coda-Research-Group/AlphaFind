#!/usr/bin/env python3
"""
Jednoduchý HTTP server pro náhled Mol* stránky v Replitu nebo lokálně.

V Replitu přepni Run na:  python molstar_demo/serve.py
Pak Webview / Open in new tab. Když Webview hlásí „app is not running“, proces tady
nesmí spadnout – čti výpis URL a PORT níže.
"""
from __future__ import annotations

import http.server
import os
import socketserver


def main() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    os.chdir(here)
    port = int(os.environ.get("PORT", 8080))
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("0.0.0.0", port), handler) as httpd:
        print(f"Serving Mol* demo from {here}")
        print(f"Lokální náhled: http://127.0.0.1:{port}/")
        print(f"PORT={port} – na Replitu otevři Webview (Open in new tab). Když Webview hlásí „app is not running“,")
        print("zkontroluj, že tento proces běží a v konzoli není traceback.")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
