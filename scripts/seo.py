#!/usr/bin/env python3
"""
SEO হেড নরমালাইজার
===================
প্রতিটি HTML পেজের <head>-এ এক জায়গা থেকে স্ট্যান্ডার্ড SEO ব্লক বসায়:

  • canonical (absolute) + hreflang
  • robots (noindex পেজের সেটিং Respect করে)
  • meta description (বর্তমান লেখাটাই রাখে, দরকার হলে লম্বা করে)
  • Open Graph (title, description, image + size/alt, locale, site_name)
  • Twitter card (summary_large_image)
  • JSON-LD: মূলপাতায় School + WebSite, বাকি পেজে WebPage + BreadcrumbList

সাথে sitemap.xml নতুন করে তৈরি করে (noindex পেজ বাদ দিয়ে)।

চালানো:  python scripts/seo.py
আবার চালালে ডাবল হয় না — নিজের বসানো ব্লকটা বদলে দেয়।
"""
import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://jamiababussalam.com"
SITE_NAME = "জামিয়া বাবুস সালাম"
OG_IMAGE = SITE + "/images/og-cover.jpg"
LOGO = SITE + "/images/logo.png"
SKIP_DIRS = ("portal", "includes", "scripts", "node_modules", ".git", ".tmp", "fonts")
SKIP_FILES = ("admin.html", "404.html", "fatwa/ifta-admin.html")

SECTION = {
    "academic": "একাডেমিক",
    "admission": "ভর্তি",
    "donate": "অনুদান ও সেবা",
    "download": "ডাউনলোড",
    "fatwa": "ফতোয়া",
    "foundation": "ফাউন্ডেশন",
    "gallery": "গ্যালারি",
    "institutional": "প্রতিষ্ঠান পরিচিতি",
    "kafela": "বাবুস সালাম কাফেলা",
    "links": "দরকারি লিংক",
    "notice": "নোটিশ ও বিজ্ঞপ্তি",
    "result": "ফলাফল",
}

# পুরোনো/নিজের বসানো ট্যাগ — নতুন ব্লক বসানোর আগে সরানো হয়
STRIP = [
    r"<!-- seo:start -->.*?<!-- seo:end -->\s*",
    r'<meta\s+name="description"[^>]*>\s*',
    r'<meta\s+name="robots"[^>]*>\s*',
    r'<meta\s+property="og:[^"]*"[^>]*>\s*',
    r'<meta\s+name="twitter:[^"]*"[^>]*>\s*',
    r'<link\s+rel="canonical"[^>]*>\s*',
    r'<link\s+rel="alternate"[^>]*hreflang[^>]*>\s*',
    r'<script\s+type="application/ld\+json">.*?</script>\s*',
]


def pages():
    out = []
    for path in glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True):
        rel = os.path.relpath(path, ROOT).replace("\\", "/")
        if rel.split("/")[0] in SKIP_DIRS or rel in SKIP_FILES:
            continue
        out.append(rel)
    return sorted(out)


def canon(rel):
    return SITE + ("/" if rel == "index.html" else "/" + rel)


def one(pattern, text, default=""):
    m = re.search(pattern, text, re.S)
    return m.group(1).strip() if m else default


def text_of(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html)).strip()


def build_block(rel, info, body):
    url = canon(rel)
    title = info["title"]
    desc = info["desc"]
    noindex = info["noindex"]
    if len(desc) < 80:
        desc = (desc.rstrip("। ") + "। জামিয়া বাবুস সালাম, বিমানবন্দর, ঢাকা।").strip()
    if len(desc) > 165:
        desc = desc[:162].rstrip("। ") + "…"

    lines = ["<!-- seo:start -->"]
    lines.append('    <meta name="description" content="%s">' % esc(desc))
    lines.append('    <meta name="robots" content="%s">'
                 % ("noindex, follow" if noindex else "index, follow, max-image-preview:large, max-snippet:-1"))
    lines.append('    <link rel="canonical" href="%s">' % url)
    lines.append('    <link rel="alternate" hreflang="bn-BD" href="%s">' % url)
    lines.append('    <link rel="alternate" hreflang="x-default" href="%s">' % url)

    lines.append('    <meta property="og:type" content="website">')
    lines.append('    <meta property="og:site_name" content="%s">' % SITE_NAME)
    lines.append('    <meta property="og:locale" content="bn_BD">')
    lines.append('    <meta property="og:url" content="%s">' % url)
    lines.append('    <meta property="og:title" content="%s">' % esc(title))
    lines.append('    <meta property="og:description" content="%s">' % esc(desc))
    lines.append('    <meta property="og:image" content="%s">' % OG_IMAGE)
    lines.append('    <meta property="og:image:width" content="1200">')
    lines.append('    <meta property="og:image:height" content="630">')
    lines.append('    <meta property="og:image:alt" content="%s — ক্যাম্পাস">' % SITE_NAME)

    lines.append('    <meta name="twitter:card" content="summary_large_image">')
    lines.append('    <meta name="twitter:title" content="%s">' % esc(title))
    lines.append('    <meta name="twitter:description" content="%s">' % esc(desc))
    lines.append('    <meta name="twitter:image" content="%s">' % OG_IMAGE)
    lines.append('    <meta name="twitter:image:alt" content="%s — ক্যাম্পাস">' % SITE_NAME)

    lines.append('    <script type="application/ld+json">')
    lines.append(ld_json(rel, url, title, desc, body))
    lines.append('    </script>')
    lines.append('    <!-- seo:end -->')
    return "\n".join(lines) + "\n"


def esc(value):
    return value.replace('"', "&quot;")


def crumb(rel, body):
    items = [("মূলপাতা", SITE + "/")]
    parts = rel.split("/")
    if len(parts) > 1:
        h1 = text_of(one(r"<h1[^>]*>(.*?)</h1>", body))
        h1 = re.sub(r"^[^\wঀ-৿]+", "", h1).strip()
        items.append((h1 or SECTION.get(parts[0], parts[0]), SITE + "/" + rel))
    return items


def ld_json(rel, url, title, desc, body):
    graph = []

    if rel == "index.html":
        graph.append({
            "@type": "School",
            "@id": SITE + "/#school",
            "name": SITE_NAME,
            "alternateName": ["Jamia Babus Salam", "Babus Salam",
                              "Babus Salam Foundation", "বাবুস সালাম মাদ্রাসা",
                              "Babus Salam Madrasah", "বাবুস সালাম বিমানবন্দর"],
            "url": SITE + "/",
            "logo": {"@type": "ImageObject", "url": LOGO, "width": 512, "height": 512},
            "image": OG_IMAGE,
            "description": desc,
            "foundingDate": "1996",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "হজ ক্যাম্প ও র‍্যাব হেডকোয়ার্টার সংলগ্ন, বিমানবন্দর",
                "addressLocality": "ঢাকা",
                "postalCode": "1230",
                "addressCountry": "BD",
            },
            "telephone": "+8801973827881",
            "email": "bsoffice1979@gmail.com",
            "sameAs": ["https://wa.me/8801816183488"],
            "areaServed": {"@type": "Country", "name": "Bangladesh"},
            "knowsLanguage": ["bn", "ar", "en"],
        })
        graph.append({
            "@type": "WebSite",
            "@id": SITE + "/#website",
            "url": SITE + "/",
            "name": SITE_NAME,
            "description": desc,
            "publisher": {"@id": SITE + "/#school"},
            "inLanguage": "bn-BD",
        })

    else:
        graph.append({"@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/",
                      "name": SITE_NAME, "inLanguage": "bn-BD"})
        graph.append({"@type": "School", "@id": SITE + "/#school", "name": SITE_NAME,
                      "url": SITE + "/"})

    graph.append({
        "@type": "WebPage",
        "@id": url + "#webpage",
        "url": url,
        "name": title,
        "description": desc,
        "isPartOf": {"@id": SITE + "/#website"},
        "about": {"@id": SITE + "/#school"},
        "inLanguage": "bn-BD",
        "primaryImageOfPage": {"@type": "ImageObject", "url": OG_IMAGE,
                               "width": 1200, "height": 630},
    })

    items = crumb(rel, body)
    if len(items) > 1:
        graph.append({
            "@type": "BreadcrumbList",
            "@id": url + "#breadcrumb",
            "itemListElement": [
                {"@type": "ListItem", "position": i + 1, "name": name, "item": link}
                for i, (name, link) in enumerate(items)
            ],
        })

    return json.dumps({"@context": "https://schema.org", "@graph": graph},
                      ensure_ascii=False, indent=2)


def inspect_head(head):
    """মেটা তথ্য আগে পড়া হয়, তারপর ট্যাগগুলো সরানো হয়।"""
    desc = one(r'<meta\s+name="description"\s+content="([^"]*)"', head)
    if not desc:
        desc = one(r'<meta\s+property="og:description"\s+content="([^"]*)"', head)
    return {
        "title": one(r"<title>(.*?)</title>", head),
        "desc": desc,
        "noindex": "noindex" in one(r'<meta\s+name="robots"\s+content="([^"]*)"', head).lower(),
    }


def process(rel):
    path = os.path.join(ROOT, rel)
    html = open(path, encoding="utf-8").read()
    head = html.split("</head>")[0]
    info = inspect_head(head)
    for pattern in STRIP:
        head = re.sub(pattern, "", head, flags=re.S)
    block = build_block(rel, info, html)
    new_head = head.rstrip() + "\n" + block
    if "</head>" not in html:
        raise SystemExit("</head> নেই: " + rel)
    new_html = new_head + "\n</head>" + html.split("</head>", 1)[1]
    if new_html != html:
        open(path, "w", encoding="utf-8", newline="\n").write(new_html)
    return rel


def sitemap(rels):
    rank = {"index.html": ("1.0", "daily")}
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ""]
    for rel in sorted(rels, key=lambda r: (r != "index.html", r)):
        path = os.path.join(ROOT, rel)
        head = open(path, encoding="utf-8").read().split("</head>")[0]
        if inspect_head(head)["noindex"]:
            continue
        pr, freq = rank.get(rel, ("0.8", "weekly") if rel.startswith(("notice/", "result/")) else ("0.7", "monthly"))
        modified = "2026-11-09"
        out += ["    <url>",
                "        <loc>%s</loc>" % canon(rel),
                "        <lastmod>%s</lastmod>" % modified,
                "        <changefreq>%s</changefreq>" % freq,
                "        <priority>%s</priority>" % pr,
                "    </url>"]
    out += ["", "</urlset>", ""]
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="\n").write("\n".join(out))


def main():
    rels = pages()
    for rel in rels:
        process(rel)
    sitemap(rels)
    print("পেজ প্রসেসড: %d" % len(rels))
    print("sitemap.xml আপডেট হয়েছে")


if __name__ == "__main__":
    main()
