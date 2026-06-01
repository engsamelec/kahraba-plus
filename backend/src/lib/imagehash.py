"""Lightweight perceptual image hashing (dHash) using Pillow only.

Used for visual product search: a customer can send a photo — even a blurry
one or a screenshot from a video — and we match it to a catalog product.

A difference hash (dHash) is robust to blur, scaling, compression and minor
color shifts because it reduces the image to a tiny grayscale gradient
signature. Two images are considered similar when the Hamming distance between
their 64-bit hashes is small.

No numpy / ML dependencies — works fully offline.
"""

from __future__ import annotations

from PIL import Image, ImageFilter

# Guard against decompression-bomb images: a small file that decodes to an
# enormous bitmap. PIL raises DecompressionBombError above this pixel count.
Image.MAX_IMAGE_PIXELS = 24_000_000  # ~24 MP

HASH_SIZE = 8  # produces a 64-bit hash (HASH_SIZE x HASH_SIZE)


def dhash(image: Image.Image, hash_size: int = HASH_SIZE) -> int:
    """Compute a horizontal difference hash. Returns an int (hash_size**2 bits)."""
    # Grayscale, slight blur to suppress noise/compression artifacts, then
    # downscale to (hash_size+1) x hash_size so we can compare adjacent pixels.
    img = (
        image.convert("L")
        .filter(ImageFilter.GaussianBlur(radius=1))
        .resize((hash_size + 1, hash_size), Image.LANCZOS)
    )
    pixels = list(img.getdata())
    width = hash_size + 1
    bits = 0
    pos = 0
    for row in range(hash_size):
        for col in range(hash_size):
            left = pixels[row * width + col]
            right = pixels[row * width + col + 1]
            bits = (bits << 1) | (1 if left > right else 0)
            pos += 1
    return bits


def hamming(a: int, b: int) -> int:
    """Number of differing bits between two hashes (0 = identical)."""
    return bin(a ^ b).count("1")


def similarity(a: int, b: int, bits: int = HASH_SIZE * HASH_SIZE) -> float:
    """Similarity in 0..1 (1 = identical)."""
    return 1.0 - hamming(a, b) / bits


def hash_from_bytes(data: bytes) -> int | None:
    """Compute a dHash from raw image bytes; None if it can't be decoded."""
    from io import BytesIO

    try:
        with Image.open(BytesIO(data)) as img:
            img.load()
            return dhash(img)
    except Exception:
        return None
