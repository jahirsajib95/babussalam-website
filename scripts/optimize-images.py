#!/usr/bin/env python3
"""
ছবি অপটিমাইজেশন
=================
সাইটে যে ছবিগুলো আসলে দেখানো হয়, শুধু সেগুলোই ছোট করা হয়:

- গ্যালারি  : সর্বোচ্চ ৯৬০px — JPEG (fallback, q78) + WebP ৯৬০w (q70) ও ৪৮০w (q72)
- শিক্ষক    : সর্বোচ্চ ৪২০px — JPEG (q80)
- লোগো      : ৯৬px WebP + ৬৪px ফেভিকন + ১৮০px অ্যাপল-আইকন
- হিরো ব্যানার: ১৪০০px WebP (q74) ও JPEG (q72)

নতুন ফাইল মূলটির চেয়ে বড় হলে সেটা লেখা হয় না — তাই স্ক্রিপ্ট বারবার
চালালেও কোয়ালিটি নষ্ট হয় না।

চালানো:  python scripts/optimize-images.py
"""
import os
import tempfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "images")

GALLERY = [
    "01-campus", "02-mosque", "03-classroom", "04-front-view", "05-south-building",
    "06-main-gate", "07-street-view", "08-monument", "09-aerial", "10-night", "11-poster",
]
TEACHERS = [
    "muhtamim", "tanvir", "najem", "basar", "jahir", "sorif", "rafiqul-islam",
    "shafiqul-islam", "muhammad-tarek", "johirul-islam", "ibrahim-khalil", "abdullah-mamun",
    "anowar-hosen",
]


def kb(path):
    return os.path.getsize(path) / 1024 if os.path.exists(path) else 0


def report(label, before, after):
    save = 100 - (after / before * 100) if before else 0
    note = "" if after < before else "  (আগেরটাই রাখা হয়েছে)"
    print("  %-34s %7.1f KB → %6.1f KB  (-%.0f%%)%s" % (label, before, after, save, note))


def resize_to(path, max_width):
    im = Image.open(path)
    im = im.convert("RGB")
    if im.width > max_width:
        height = round(im.height * max_width / im.width)
        im = im.resize((max_width, height), Image.LANCZOS)
    return im


def write_smaller(im, path, fmt, **kwargs):
    """ফলাফল আগের ফাইলের চেয়ে ছোট হলেই লিখে দেয়।"""
    before = kb(path)
    fd, tmp = tempfile.mkstemp(suffix="." + fmt.lower())
    os.close(fd)
    im.save(tmp, fmt, **kwargs)
    if before == 0 or os.path.getsize(tmp) < os.path.getsize(path):
        os.replace(tmp, path)
    else:
        os.remove(tmp)
    return before, kb(path)


def save_jpeg(im, path, quality):
    return write_smaller(im, path, "JPEG", quality=quality, optimize=True, progressive=True)


def save_webp(im, path, quality):
    return write_smaller(im, path, "WEBP", quality=quality, method=6)


def do_gallery():
    print("\n═══ গ্যালারি (৯৬০px, WebP + JPEG) ═══")
    for name in GALLERY:
        jpg = os.path.join(IMG, "gallery", name + ".jpg")
        if not os.path.exists(jpg):
            print("  ⚠ নেই:", jpg)
            continue
        im = resize_to(jpg, 960)
        before = kb(jpg)
        save_jpeg(im, jpg, quality=78)
        save_webp(im, os.path.join(IMG, "gallery", name + ".webp"), quality=70)

        small = im.copy()
        small.thumbnail((480, 480), Image.LANCZOS)
        save_webp(small, os.path.join(IMG, "gallery", name + "-480.webp"), quality=72)

        webp = kb(os.path.join(IMG, "gallery", name + ".webp"))
        print("  %-20s jpg %6.1f→%5.1f KB | webp %5.1f KB | 480w %5.1f KB"
              % (name, before, kb(jpg), webp, kb(os.path.join(IMG, "gallery", name + "-480.webp"))))


def do_teachers():
    print("\n═══ শিক্ষক (৪২০px) ═══")
    total_before = total_after = 0
    for name in TEACHERS:
        for ext in (".jpg", ".jpeg"):
            src = os.path.join(IMG, "teachers", name + ext)
            if not os.path.exists(src):
                continue
            im = resize_to(src, 420)
            before, after = save_jpeg(im, src, quality=80)
            total_before += before
            total_after += after
            report(name, before, after)
    print("  মোট: %.1f KB → %.1f KB" % (total_before, total_after))


def do_logo():
    print("\n═══ লোগো ও ফেভিকন ═══")
    logo = os.path.join(IMG, "logo.png")
    im = Image.open(logo).convert("RGBA")

    save_webp(im.resize((96, 99), Image.LANCZOS), os.path.join(IMG, "logo.webp"), quality=88)
    report("logo.webp (96px)", kb(logo), kb(os.path.join(IMG, "logo.webp")))

    fav = im.resize((64, 66), Image.LANCZOS).convert("RGB")
    fav = fav.quantize(colors=128, method=Image.MEDIANCUT)
    before, after = write_smaller(fav, os.path.join(IMG, "favicon.png"), "PNG", optimize=True)
    report("favicon.png (64px)", kb(logo), after)

    touch = im.resize((180, 186), Image.LANCZOS).convert("RGB").quantize(colors=256,
                                                                        method=Image.MEDIANCUT)
    before, after = write_smaller(touch, os.path.join(IMG, "apple-touch-icon.png"), "PNG",
                                 optimize=True)
    report("apple-touch-icon.png (180px)", kb(logo), after)


def do_banner():
    print("\n═══ হিরো ব্যানার (১৪০০px) ═══")
    banner = os.path.join(IMG, "banner.jpg")
    im = resize_to(banner, 1400)
    before = kb(banner)
    save_webp(im, os.path.join(IMG, "banner.webp"), quality=74)
    report("banner.webp", before, kb(os.path.join(IMG, "banner.webp")))
    save_jpeg(im, banner, quality=72)
    report("banner.jpg", before, kb(banner))


if __name__ == "__main__":
    do_gallery()
    do_teachers()
    do_logo()
    do_banner()
    print("\nসম্পন্ন।")
