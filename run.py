#!/usr/bin/env python3
"""
AcquireFlow – one-command startup
Works on Python 3.9+ including 3.14
"""
import os, sys, subprocess, webbrowser, threading, time


def banner():
    print("\n" + "═"*50)
    print("  AcquireFlow – UK Acquisition Target Finder")
    print("═"*50 + "\n")


def check_python():
    if sys.version_info < (3, 9):
        print(f"ERROR: Python 3.9+ required. You have {sys.version}")
        sys.exit(1)
    print(f"✓ Python {sys.version.split()[0]}")


def check_env():
    env_file = os.path.join(os.path.dirname(__file__), ".env")
    example  = os.path.join(os.path.dirname(__file__), ".env.example")
    if not os.path.exists(env_file):
        if os.path.exists(example):
            import shutil
            shutil.copy(example, env_file)
            print("\n⚠  Created .env from .env.example.")
        print("  Please open .env and replace 'your_api_key_here' with your real key.")
        print("  Get a free key: https://developer.company-information.service.gov.uk\n")
    else:
        content = open(env_file).read()
        if "your_api_key_here" in content:
            print("\n⚠  .env exists but still has the placeholder key.")
            print("  Edit .env and paste your real Companies House API key.\n")
        else:
            print("✓ .env found")


def install_deps():
    req = os.path.join(os.path.dirname(__file__), "requirements.txt")
    print("  Installing / verifying dependencies…")
    r = subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", req, "-q"],
        capture_output=True, text=True
    )
    if r.returncode != 0:
        print("ERROR installing dependencies:\n" + r.stderr)
        sys.exit(1)
    print("✓ Dependencies ready")


def ensure_dirs():
    base = os.path.dirname(__file__)
    for d in ("data", "exports"):
        os.makedirs(os.path.join(base, d), exist_ok=True)
    print("✓ Directories ready")


def open_browser():
    time.sleep(2.5)
    try:
        webbrowser.open("http://localhost:8000")
    except Exception:
        pass


def main():
    banner()
    check_python()
    check_env()
    install_deps()
    ensure_dirs()

    from dotenv import load_dotenv
    load_dotenv()

    print("\n🚀 Starting AcquireFlow on http://127.0.0.1:8000")
    print("   Opening browser automatically…")
    print("   Press Ctrl+C to stop.\n")

    threading.Thread(target=open_browser, daemon=True).start()

    # Import and run Flask app
    sys.path.insert(0, os.path.dirname(__file__))
    from app.main import app, init_db
    init_db()
    app.run(host="127.0.0.1", port=8000, debug=False, threaded=True)


if __name__ == "__main__":
    main()
