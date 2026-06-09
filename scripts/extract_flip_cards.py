"""PDF에서 flip 카드 16종 앞·뒷면 이미지 추출."""
from __future__ import annotations

import io
from pathlib import Path

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT.parent / "final" / "수정"
POSTCARD_PDF = SOURCE_DIR / "260609_postcard_긍정뷔페.pdf"
CARDS_DIR = ROOT / "public" / "assets" / "flip" / "cards"
ARTWORKS_DIR = ROOT / "public" / "assets" / "artworks"

# 앞·뒷면 모두 최신 postcard PDF(홀수=앞, 짝수=뒤)에서 동일 배율로 추출
ZOOM = 11


def save_jpg(pix: fitz.Pixmap, dest: Path) -> tuple[int, int]:
    image = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    image.save(dest, "JPEG", quality=96, optimize=True, subsampling=0)
    return image.size


def main() -> None:
    post_doc = fitz.open(POSTCARD_PDF)
    CARDS_DIR.mkdir(parents=True, exist_ok=True)
    ARTWORKS_DIR.mkdir(parents=True, exist_ok=True)
    matrix = fitz.Matrix(ZOOM, ZOOM)

    for card_id in range(1, 17):
        pad = f"{card_id:02d}"
        front_idx = (card_id - 1) * 2
        back_idx = front_idx + 1

        front_pix = post_doc[front_idx].get_pixmap(matrix=matrix, alpha=False)
        back_pix = post_doc[back_idx].get_pixmap(matrix=matrix, alpha=False)

        front_size = save_jpg(front_pix, CARDS_DIR / f"card_{pad}_front.jpg")
        back_size = save_jpg(back_pix, CARDS_DIR / f"card_{pad}_back.jpg")
        save_jpg(front_pix, ARTWORKS_DIR / f"artwork_{pad}.jpg")
        print(f"card {pad}: front {front_size}, back {back_size}")

    post_doc.close()


if __name__ == "__main__":
    main()
