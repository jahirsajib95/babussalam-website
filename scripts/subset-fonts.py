#!/usr/bin/env python3
"""
ফন্ট সাবসেটিং
===============
সাইটে যত গ্লিফ আসলে ব্যবহৃত হয়, শুধু সেগুলোই ফন্টে রাখা হয়:

- fa-solid-900.woff2   → css/fontawesome-subset.css-এ ব্যবহৃত আইকন কোডপয়েন্ট
- fa-regular-400.woff2 → একই
- fa-brands-400.woff2  → শুধু whatsapp / github / android
- amiri-arabic-*.woff2 → পেজে ব্যবহৃত আরবি অক্ষর

দরকার: fonttools + brotli
    python -m venv .venv && .venv/Scripts/pip install fonttools brotli
    .venv/Scripts/python scripts/subset-fonts.py

চালানো:  python scripts/subset-fonts.py
"""
import glob
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "fonts")


def codepoints_from_css(path):
    css = open(path, encoding="utf-8").read()
    cps = set()
    for m in re.finditer(r'content:"\\([0-9a-fA-F]{4,6})"', css):
        cps.add(int(m.group(1), 16))
    return cps


def arabic_chars():
    chars = set()
    for pattern in ("*.html", "*/*.html", "*.js"):
        for path in glob.glob(os.path.join(ROOT, pattern)):
            if os.path.basename(os.path.dirname(path)) in ("includes", ".tmp"):
                continue
            text = open(path, encoding="utf-8", errors="ignore").read()
            chars.update(ch for ch in text if "\u0600" <= ch <= "\u06FF" or
                         "\u0750" <= ch <= "\u077F" or "\uFB50" <= ch <= "\uFEFF")
    return chars


def subset(src, dst, unicodes, keep_features="*"):
    if not unicodes:
        print("  ⚠ কোনো ইউনিকোড নেই:", src)
        return
    args = [
        sys.executable, "-m", "fontTools.subset", src,
        "--unicodes=" + ",".join("U+%04X" % cp for cp in sorted(unicodes)),
        "--layout-features=" + keep_features,
        "--flavor=woff2",
        "--output-file=" + dst,
        "--no-hinting" if False else "--hinting",
    ]
    subprocess.run(args, check=True)
    before, after = os.path.getsize(src), os.path.getsize(dst)
    print("  %-30s %6.1f KB → %5.1f KB  (-%.0f%%)"
          % (os.path.basename(dst), before / 1024, after / 1024, 100 - after / before * 100))


def main():
    icons = codepoints_from_css(os.path.join(ROOT, "css", "fontawesome-subset.css"))
    print("আইকন কোডপয়েন্ট:", len(icons))

    print("\n═══ FontAwesome ═══")
    subset(os.path.join(FONTS, "fa-solid-900.woff2"),
           os.path.join(FONTS, "fa-solid-900.subset.woff2"), icons)
    subset(os.path.join(FONTS, "fa-regular-400.woff2"),
           os.path.join(FONTS, "fa-regular-400.subset.woff2"), icons)

    # ব্র্যান্ড আইকন — ফুটারে শুধু whatsapp, বাকিগুলো admin/links পেজে
    brands = codepoints_from_css(os.path.join(ROOT, "css", "fontawesome-subset.css"))
    brand_src = os.path.join(FONTS, "fa-brands-400.woff2")
    brand_cps = {0xF232, 0xF09B, 0xF17B}  # whatsapp, github, android
    subset(brand_src, os.path.join(FONTS, "fa-brands-400.subset.woff2"), brand_cps & (brands | brand_cps))

    chars = {ord(ch) for ch in arabic_chars()}
    print("\n═══ Amiri (আরবি) — %d অক্ষর ═══" % len(chars))
    for weight in ("400", "700"):
        src = os.path.join(FONTS, "amiri-arabic-%s.woff2" % weight)
        if os.path.exists(src):
            subset(src, os.path.join(FONTS, "amiri-arabic-%s.subset.woff2" % weight), chars)


if __name__ == "__main__":
    main()
