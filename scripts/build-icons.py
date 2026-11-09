#!/usr/bin/env python3
"""
FontAwesome সাবসেট CSS জেনারেটর
=================================
সাইটের HTML/JS ফাইলে যে আইকন ক্লাসগুলো আসলে ব্যবহার হয়েছে, শুধু সেগুলোর
CSS নিয়ে css/fontawesome-subset.css বানায়। ফলে ১০০ KB-এর বদলে ~৫ KB CSS
লোড হয় এবং ওয়েবফন্টও লোকাল থেকে আসে (কোনো CDN রিকোয়েস্ট নেই)।
আইকন ফন্টগুলো CSS-এর ভেতরেই base64 data URI হিসেবে বসে, তাই file:// থেকেও
খুললে আইকন দেখা যায়।

চালানো:  python scripts/build-icons.py
নতুন আইকন যোগ করলে এই স্ক্রিপ্ট আবার চালালেই হবে।
"""
import base64
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_URL = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
CACHE = os.path.join(ROOT, ".tmp", "fa.css")
OUT = os.path.join(ROOT, "css", "fontawesome-subset.css")
FONT_DIR = "../fonts/"  # css/ থেকে আপেক্ষিক পাথ

# সবসময় দরকারি বেস ও ইউটিলিটি ক্লাস
BASE_CSS = """/* ═══════════════════════════════════════════════════════════
   Font Awesome 6.5 — সাবসেট (শুধু সাইটে ব্যবহৃত আইকন)
   জেনারেট করা ফাইল — হাতে এডিট করবেন না।
   নতুন আইকন যোগ করলে: python scripts/build-icons.py
   ═══════════════════════════════════════════════════════════ */
@font-face{font-family:"Font Awesome 6 Free";font-style:normal;font-weight:400;font-display:block;src:__FA_REGULAR__}
@font-face{font-family:"Font Awesome 6 Free";font-style:normal;font-weight:900;font-display:block;src:__FA_SOLID__}
@font-face{font-family:"Font Awesome 6 Brands";font-style:normal;font-weight:400;font-display:block;src:__FA_BRANDS__}
.fa{font-family:var(--fa-style-family,"Font Awesome 6 Free");font-weight:var(--fa-style,900)}
.fa,.fa-brands,.fa-regular,.fa-solid,.fab,.far,.fas{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;display:var(--fa-display,inline-block);font-style:normal;font-variant:normal;line-height:1;text-rendering:auto}
.fa-solid,.fas{font-family:"Font Awesome 6 Free";font-weight:900}
.fa-regular,.far{font-family:"Font Awesome 6 Free";font-weight:400}
.fa-brands,.fab{font-family:"Font Awesome 6 Brands";font-weight:400}
/* ---- ইউটিলিটি ---- */
.fa-fw{text-align:center;width:1.25em}
.fa-lg{font-size:1.25em;line-height:.05em;vertical-align:-.075em}
.fa-xl{font-size:1.5em;line-height:.04167em;vertical-align:-.125em}
.fa-2xl{font-size:2em;line-height:.03125em;vertical-align:-.15625em}
.fa-sm{font-size:.875em;line-height:.07143em;vertical-align:.05357em}
.fa-xs{font-size:.75em;line-height:.08333em;vertical-align:.125em}
.fa-inverse{color:var(--fa-inverse,#fff)}
.fa-spin{-webkit-animation-delay:var(--fa-animation-delay,0s);animation-delay:var(--fa-animation-delay,0s);-webkit-animation-direction:var(--fa-animation-direction,normal);animation-direction:var(--fa-animation-direction,normal);-webkit-animation-name:fa-spin;animation-name:fa-spin;-webkit-animation-duration:var(--fa-animation-duration,2s);animation-duration:var(--fa-animation-duration,2s);-webkit-animation-iteration-count:var(--fa-animation-iteration-count,infinite);animation-iteration-count:var(--fa-animation-iteration-count,infinite);-webkit-animation-timing-function:var(--fa-animation-timing,linear);animation-timing-function:var(--fa-animation-timing,linear)}
@-webkit-keyframes fa-spin{0%{-webkit-transform:rotate(0deg);transform:rotate(0deg)}to{-webkit-transform:rotate(1turn);transform:rotate(1turn)}}
@keyframes fa-spin{0%{-webkit-transform:rotate(0deg);transform:rotate(0deg)}to{-webkit-transform:rotate(1turn);transform:rotate(1turn)}}
.sr-only,.fa-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}
"""


def embedded_font(name):
    """ফন্ট ফাইল base64 data URI হিসেবে CSS-এ বসানো হয়।

    কারণ: কেউ index.html সরাসরি ডাবল-ক্লিক করে (file://) খুললে ব্রাউজার লোকাল
    woff2 লোড করতে দেয় না, তখন সব আইকন অদৃশ্য হয়ে যায়। data URI সব
    পরিবেশে (file://, যেকোনো সার্ভার, ভুল MIME) কাজ করে — আলাদা রিকোয়েস্টও লাগে না।
    """
    path = os.path.join(ROOT, "fonts", name)
    if not os.path.exists(path):
        return 'url(%s%s) format("woff2")' % (FONT_DIR, name)
    with open(path, "rb") as fh:
        encoded = base64.b64encode(fh.read()).decode("ascii")
    return ('url(data:font/woff2;base64,%s) format("woff2"),'
            'url(%s%s) format("woff2")') % (encoded, FONT_DIR, name)


def read_source():
    if os.path.exists(CACHE):
        return open(CACHE, encoding="utf-8").read()
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    with urllib.request.urlopen(SOURCE_URL) as res:
        css = res.read().decode("utf-8")
    open(CACHE, "w", encoding="utf-8").write(css)
    return css


def used_class_tokens():
    """সব HTML/JS ফাইলের class অ্যাট্রিবিউট থেকে ক্লাস টোকেন সংগ্রহ।"""
    tokens = set()
    files = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules", ".tmp", "fonts")]
        for name in filenames:
            if name.endswith((".html", ".js")):
                files.append(os.path.join(dirpath, name))
    for path in files:
        text = open(path, encoding="utf-8", errors="ignore").read()
        for match in re.finditer(r'class\s*=\s*(["\'])(.*?)\1', text, re.S):
            for token in match.group(2).split():
                tokens.add(token)
        # JS-এ ক্লাস টগল করার সময়ও যেন ধরা পড়ে
        for match in re.finditer(r'classList\.(?:add|toggle|remove)\(\s*[\'"]([^\'"]+)', text):
            tokens.add(match.group(1))
    return tokens


def build():
    css = read_source()
    used = used_class_tokens()

    icon_rules = []
    emitted = set()
    for match in re.finditer(r"([^{}]+)\{([^{}]*content:[^{}]*)\}", css):
        selectors, decls = match.group(1), match.group(2)
        keep = []
        for sel in selectors.split(","):
            sel = sel.strip()
            if not sel.endswith(":before"):
                continue
            name = sel[:-len(":before")].lstrip(".")
            if name in used and name not in emitted:
                keep.append(sel)
                emitted.add(name)
        if keep:
            icon_rules.append(",".join(keep) + "{" + decls + "}")

    base = BASE_CSS.replace("__FONT_DIR__", FONT_DIR)
    for token, name in (("__FA_REGULAR__", "fa-regular-400.subset.woff2"),
                        ("__FA_SOLID__", "fa-solid-900.subset.woff2"),
                        ("__FA_BRANDS__", "fa-brands-400.subset.woff2")):
        base = base.replace(token, embedded_font(name))

    out = [base, "\n/* ---- আইকন (%d টি) ---- */\n" % len(emitted)]
    out.extend(rule + "\n" for rule in icon_rules)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "w", encoding="utf-8").write("".join(out))

    print("আইকন ক্লাস পাওয়া গেছে: %d" % len(emitted))
    missing = sorted(t for t in used if t.startswith("fa-") and t not in emitted)
    if missing:
        print("⚠ সাবসেটে বসানো যায়নি:", ", ".join(missing))
    print("লেখা হয়েছে: %s (%.1f KB)" % (OUT, os.path.getsize(OUT) / 1024))


if __name__ == "__main__":
    sys.exit(build())
