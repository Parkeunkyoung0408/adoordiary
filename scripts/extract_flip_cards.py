"""PDF에서 flip 카드 16종 앞·뒷면 이미지 추출."""
from __future__ import annotations

import io
from pathlib import Path

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT.parent / "final" / "수정"
FRONT_PDF = SOURCE_DIR / "260609_컬러폰트_긍정뷔페_폰트수정.pdf"
BACK_PDF = SOURCE_DIR / "260609_postcard_긍정뷔페.pdf"
A4_PDF = SOURCE_DIR / "260609_a4_긍정뷔페.pdf"
CARDS_DIR = ROOT / "public" / "assets" / "flip" / "cards"

TARGET_WIDTH = 3119
TARGET_HEIGHT = 4615
BACK_ZOOM = 11
# 폰트수정 PDF(167pt) → postcard 추출 해상도(3119px)에 맞춤
FRONT_ZOOM = TARGET_WIDTH / 167
# 몹시겁시(card 03) → A4 PDF 3페이지(최신 3D)
# 긍정뷔페(card 16) → postcard PDF(빨간 긍정 + 흰 뷔페, 폰트수정 PDF는 색상 다름)
CARD_03_A4_PAGE = 2
POSTCARD_FRONT_CARDS = {16}


def crop_and_resize(image: Image.Image) -> Image.Image:
    width, height = image.size
    target_aspect = TARGET_WIDTH / TARGET_HEIGHT
    current_aspect = width / height

    if current_aspect > target_aspect:
        next_width = int(height * target_aspect)
        left = (width - next_width) // 2
        image = image.crop((left, 0, left + next_width, height))
    else:
        next_height = int(width / target_aspect)
        top = (height - next_height) // 2
        image = image.crop((0, top, width, top + next_height))

    return image.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.Resampling.LANCZOS)


def render_page(pdf_path: Path, page_idx: int, zoom: float) -> Image.Image:
    doc = fitz.open(pdf_path)
    page = doc[page_idx]
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    image = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    doc.close()
    return crop_and_resize(image)


def save_jpg(image: Image.Image, dest: Path) -> tuple[int, int]:
    image.save(dest, "JPEG", quality=96, optimize=True, subsampling=0)
    return image.size


def main() -> None:
    CARDS_DIR.mkdir(parents=True, exist_ok=True)

    for card_id in range(1, 17):
        pad = f"{card_id:02d}"
        front_idx = (card_id - 1) * 2
        back_idx = front_idx + 1

        if card_id == 3:
            front_image = render_page(A4_PDF, CARD_03_A4_PAGE, BACK_ZOOM)
            front_source = f"{A4_PDF.name} p{CARD_03_A4_PAGE + 1}"
        elif card_id in POSTCARD_FRONT_CARDS:
            front_image = render_page(BACK_PDF, front_idx, BACK_ZOOM)
            front_source = f"{BACK_PDF.name} p{front_idx + 1}"
        else:
            front_image = render_page(FRONT_PDF, front_idx, FRONT_ZOOM)
            front_source = f"{FRONT_PDF.name} p{front_idx + 1}"

        back_image = render_page(BACK_PDF, back_idx, BACK_ZOOM)
        front_size = save_jpg(front_image, CARDS_DIR / f"card_{pad}_front.jpg")
        back_size = save_jpg(back_image, CARDS_DIR / f"card_{pad}_back.jpg")
        print(f"card {pad}: front {front_size} ({front_source}), back {back_size}")


if __name__ == "__main__":
    main()
