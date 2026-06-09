"""notext_img → public/assets/artworks (mix/artwork용 텍스트 없는 배경)."""
from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOTEXT_DIR = ROOT.parent / "final" / "notext_img"
ARTWORKS_DIR = ROOT / "public" / "assets" / "artworks"

PAGE_NUMBERS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31]


def find_source(page: int) -> Path:
    matches = sorted(NOTEXT_DIR.glob(f"*_notext_Page_{page:02d}.jpg"))
    if not matches:
        raise FileNotFoundError(f"notext Page_{page:02d} not found in {NOTEXT_DIR}")
    return matches[-1]


def main() -> None:
    ARTWORKS_DIR.mkdir(parents=True, exist_ok=True)
    for idx, page in enumerate(PAGE_NUMBERS, start=1):
        src = find_source(page)
        dest = ARTWORKS_DIR / f"artwork_{idx:02d}.jpg"
        shutil.copy2(src, dest)
        print(f"artwork_{idx:02d}.jpg <= {src.name}")

    print(f"done: {len(PAGE_NUMBERS)} artworks synced from notext_img")


if __name__ == "__main__":
    main()
