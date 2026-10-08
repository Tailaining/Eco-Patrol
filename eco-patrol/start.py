"""Запуск полного Eco-Patrol одной командой, без сторонних Python-пакетов."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import errno
import threading
import webbrowser


def main():
    """Обслуживает папку проекта и открывает её в стандартном браузере."""
    root = Path(__file__).resolve().parent
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    # Постоянный origin сохраняет доступ к тем же меткам после перезапуска.
    try:
        server = ThreadingHTTPServer(("127.0.0.1", 4173), handler)
    except OSError as error:
        if error.errno != errno.EADDRINUSE:
            raise
        print("Порт 4173 занят. Используется временный порт; у него отдельное хранилище.", flush=True)
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    with server:
        address = f"http://127.0.0.1:{server.server_port}/"
        print(f"Eco-Patrol: {address}", flush=True)
        print("Для остановки нажмите Ctrl+C.", flush=True)
        threading.Thread(target=webbrowser.open, args=(address,), daemon=True).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
