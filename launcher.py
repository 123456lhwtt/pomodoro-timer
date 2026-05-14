#!/usr/bin/env python3
"""Pomodoro Timer - Start a local server and open in browser."""
import http.server
import webbrowser
import os
import sys
import threading
import time

PORT = 8765
DIR = os.path.dirname(os.path.abspath(__file__))

os.chdir(DIR)


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress log output


def open_browser():
    time.sleep(0.5)
    webbrowser.open(f'http://localhost:{PORT}')


if __name__ == '__main__':
    threading.Thread(target=open_browser, daemon=True).start()
    print(f'番茄钟已启动：http://localhost:{PORT}')
    print('按 Ctrl+C 停止')
    try:
        http.server.HTTPServer(('', PORT), Handler).serve_forever()
    except KeyboardInterrupt:
        print('\n再见！')
        sys.exit(0)
