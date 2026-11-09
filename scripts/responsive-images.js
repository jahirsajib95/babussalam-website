#!/usr/bin/env node
/**
 * রেসপন্সিভ ছবি — <picture> + srcset
 * ==================================
 * gallery/gallery.html ও index.html-এর গ্যালারি ছবিগুলো এখন:
 *   - WebP (৪৮০w / ৯৬০w) srcset সহ → মোবাইলে ~২০-৩০ KB, ডেস্কটপে ~৪০-১০০ KB
 *   - পুরোনো ব্রাউজারের জন্য JPEG ফলব্যাক <img src>
 *   - width/height দেওয়া → লেআউট শিফট (CLS) নেই
 * css/style.css-এ `picture { display: contents; }` থাকায় লেআউট আগের মতোই থাকে।
 *
 * চালানো:  node scripts/responsive-images.js   (আগে scripts/optimize-images.py চালান)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// resize করা JPEG-গুলোর প্রকৃত মাপ (CLS এড়াতে width/height)
const DIMS = {
    '01-campus': 757, '02-mosque': 690, '03-classroom': 720, '04-front-view': 690,
    '05-south-building': 690, '06-main-gate': 720, '07-street-view': 720,
    '08-monument': 720, '09-aerial': 540, '10-night': 640, '11-poster': 540,
};

const PAGES = [
    {
        file: 'gallery/gallery.html',
        prefix: '../',
        indent: '            ',
        sizes: '(max-width: 640px) 92vw, (max-width: 1100px) 44vw, 350px',
    },
    {
        file: 'index.html',
        prefix: '',
        indent: '                ',
        sizes: '(max-width: 640px) 46vw, 250px',
    },
];

function block(prefix, name, alt, sizes, indent) {
    const h = DIMS[name];
    const i2 = indent + '    ';
    return [
        '<picture>',
        `${i2}<source type="image/webp"`,
        `${i2}    srcset="${prefix}images/gallery/${name}-480.webp 480w, ${prefix}images/gallery/${name}.webp 960w"`,
        `${i2}    sizes="${sizes}">`,
        `${i2}<img src="${prefix}images/gallery/${name}.jpg" alt="${alt}" loading="lazy" decoding="async"`,
        `${i2}    width="960" height="${h}">`,
        `${indent}</picture>`,
    ].join('\n');
}

let changed = 0;
for (const page of PAGES) {
    const full = path.join(ROOT, page.file);
    let html = fs.readFileSync(full, 'utf8');
    const before = html;

    const re = new RegExp(
        `<img src="${page.prefix}images/gallery/([a-z0-9-]+)\\.jpg" alt="([^"]*)" loading="lazy">`, 'g');

    html = html.replace(re, (match, name, alt) => {
        if (!DIMS[name]) return match;
        return block(page.prefix, name, alt, page.sizes, page.indent);
    });

    // হোমপেজের পরিচিতি ছবি (onerror ফলব্যাকসহ, দুই লাইনে লেখা)
    html = html.replace(
        /<img src="images\/gallery\/01-campus\.jpg" alt="([^"]*)" loading="lazy"\r?\n\s*onerror="([^"]*)">/,
        (match, alt, onerror) => [
            '<picture>',
            '                    <source type="image/webp"',
            '                        srcset="images/gallery/01-campus-480.webp 480w, images/gallery/01-campus.webp 960w"',
            '                        sizes="(max-width: 900px) 92vw, 45vw">',
            `                    <img src="images/gallery/01-campus.jpg" alt="${alt}" loading="lazy"`,
            `                        decoding="async" width="960" height="757" onerror="${onerror}">`,
            '                </picture>',
        ].join('\n'));

    if (html !== before) {
        fs.writeFileSync(full, html);
        changed++;
        console.log('  ✓', page.file);
    } else {
        console.log('  · আপডেট হয়নি:', page.file);
    }
}
console.log('\n%d পেজ আপডেট হয়েছে।', changed);
