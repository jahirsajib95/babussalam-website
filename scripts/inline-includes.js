#!/usr/bin/env node
/**
 * হেডার/ফুটার ইনলাইন + হেড পরিষ্কার
 * =================================
 * আগে main.js প্রতিবার পেজ লোডে includes/header.html ও includes/footer.html
 * fetch করত (২টা বাড়তি রাউন্ড ট্রিপ, প্রতি নেভিগেশনে)। এখন হেডার/ফুটার
 * HTML সরাসরি প্রতিটি পেজে বসিয়ে দেওয়া হয়।
 *
 * স্ক্রিপ্ট যা করে (সব ধাপ idempotent — বারবার চালালেও সমস্যা নেই):
 *  ১. includes/header.html + footer.html প্রতিটি পেজে ইনলাইন ({{BASE}} প্রতিস্থাপনসহ)
 *  ২. Google Fonts / maateen / FontAwesome CDN লিংক সরিয়ে লোকাল ফাইল
 *  ৩. css/fonts.css + ফন্ট preload + css/footer.css হেডে যোগ
 *  ৪. ফেভিকন/অ্যাপল-আইকন ছোট ভার্সনে বদল
 *
 * ⚠ হেডার বা ফুটার এডিট করার পর অবশ্যই চালাতে হবে:  node scripts/inline-includes.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', '.tmp', 'includes', 'scripts', 'fonts', '.freebuff']);

const headerSrc = fs.readFileSync(path.join(ROOT, 'includes', 'header.html'), 'utf8');
const footerSrc = fs.readFileSync(path.join(ROOT, 'includes', 'footer.html'), 'utf8');

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) walk(full, out);
        } else if (entry.name.endsWith('.html')) {
            out.push(full);
        }
    }
    return out;
}

function baseFor(file) {
    const rel = path.relative(ROOT, path.dirname(file));
    if (!rel) return './';
    const depth = rel.split(path.sep).filter(Boolean).length;
    return '../'.repeat(depth);
}

function insertInHead(html, tag) {
    const headEnd = html.indexOf('</head>');
    if (headEnd === -1) return html;
    const firstCss = html.search(/<link[^>]*rel="stylesheet"[^>]*>/);
    if (firstCss === -1 || firstCss > headEnd) {
        return html.slice(0, headEnd) + '    ' + tag + '\n' + html.slice(headEnd);
    }
    return html.slice(0, firstCss) + '    ' + tag + '\n' + html.slice(firstCss);
}

function inject(html, id, content) {
    const start = `<!-- inc:start ${id} -->`;
    const end = `<!-- inc:end ${id} -->`;
    const block = `${start}\n${content}\n${end}`;
    if (html.includes(start)) {
        const re = new RegExp(start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
            '[\\s\\S]*?' + end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        return html.replace(re, block);
    }
    const re = new RegExp(`<div id="${id}">\\s*</div>`);
    if (re.test(html)) return html.replace(re, `<div id="${id}">\n${block}\n</div>`);
    return html;
}

const stats = { pages: 0, inlined: 0, fa: 0, fonts: 0 };

for (const file of walk(ROOT)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const base = baseFor(file);
    let html = fs.readFileSync(file, 'utf8');
    const before = html;

    // ── ১. এক্সটার্নাল ফন্ট/আইকন CDN সরানো ─────────────────────────
    html = html.replace(/[ \t]*<link[^>]*rel="preconnect"[^>]*(fonts\.googleapis|fonts\.gstatic)\.com[^>]*>\r?\n/gi, '');
    html = html.replace(/[ \t]*<link[^>]*href="https:\/\/fonts\.googleapis\.com\/css2\?family=Amiri[^"]*"[^>]*>\r?\n/gi, '');
    html = html.replace(/[ \t]*<link[^>]*href="https:\/\/fonts\.maateen\.me\/[^"]*"[^>]*>\r?\n/gi, '');

    const faRe = /<link[^>]*href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/[^"]*"[^>]*>/gi;
    if (faRe.test(html)) {
        html = html.replace(faRe, `<link rel="stylesheet" href="${base}css/fontawesome-subset.css">`);
        stats.fa++;
    }

    // ── ২. লোকাল ফন্ট CSS + preload ────────────────────────────────
    if (!html.includes('css/fonts.css')) {
        html = insertInHead(html, `<link rel="stylesheet" href="${base}css/fonts.css">`);
        stats.fonts++;
    }

    // SolaimanLipi আসলে যে পেজে ব্যবহৃত হয় (style.css) শুধু সেখানেই preload।
    // পোর্টাল পেজে দিলে ৮৩ KB ফন্ট অকারণে নামত (Chrome ওয়ার্নিং দিত)।
    if (html.includes('style.css') && !html.includes('solaimanlipi-normal-v1.0.woff2')) {
        html = insertInHead(html,
            `<link rel="preload" href="${base}fonts/solaimanlipi-normal-v1.0.woff2" ` +
            `as="font" type="font/woff2" crossorigin>`);
    } else if (!html.includes('style.css')) {
        html = html.replace(/[ \t]*<link[^>]*solaimanlipi-normal-v1\.0\.woff2"[^>]*>\r?\n/g, '');
    }

    // ── ৩. ফুটার CSS হেডে (ইনলাইন করা ফুটার থেকে সরানো হচ্ছে) ───────
    if (html.includes('footer-placeholder') && !html.includes('css/footer.css')) {
        html = insertInHead(html, `<link rel="stylesheet" href="${base}css/footer.css">`);
    }

    // ── ৪. ফেভিকন হালকা করা ────────────────────────────────────────
    html = html.replace(/<link[^>]*rel="icon"[^>]*>/gi, (tag) =>
        tag.replace(/images\/logo\.png/, 'images/favicon.png'));
    html = html.replace(/<link[^>]*rel="apple-touch-icon"[^>]*>/gi, (tag) =>
        tag.replace(/images\/logo\.png/, 'images/apple-touch-icon.png'));

    // ── ৫. হেডার/ফুটার ইনলাইন ──────────────────────────────────────
    if (html.includes('header-placeholder')) {
        html = inject(html, 'header-placeholder', headerSrc.split('{{BASE}}').join(base));
        stats.inlined++;
    }
    if (html.includes('footer-placeholder')) {
        let footer = footerSrc.split('{{BASE}}').join(base);
        footer = footer.replace(/[ \t]*<link[^>]*css\/footer\.css"[^>]*>\r?\n/, '');
        html = inject(html, 'footer-placeholder', footer);
    }

    // ── ৬. 404 পেজের বড় PNG লোগো ───────────────────────────────────
    html = html.replace(/<img src="\/images\/logo\.png" alt="লোগো">/,
        '<img src="/images/logo.webp" alt="লোগো" width="45" height="45" decoding="async">');

    stats.pages++;
    if (html !== before) fs.writeFileSync(file, html);
    console.log('  ✓', rel);
}

console.log('\nপেজ: %d | হেডার ইনলাইন: %d | FontAwesome: %d | ফন্ট CSS: %d',
    stats.pages, stats.inlined, stats.fa, stats.fonts);
