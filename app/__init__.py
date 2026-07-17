from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_APP_DIR = ROOT.parent / "backend" / "app"

__path__ = [str(ROOT), str(BACKEND_APP_DIR)]

__all__ = ["main"]
