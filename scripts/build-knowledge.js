/* ═══════════════════════════════════════════════════════════════
   🧠 জামিয়া বাবুস সালাম — নলেজ-বেস বিল্ডার
   সাইটের সব পাবলিক HTML পেজের টেক্সট নিয়ে ai/knowledge.json বানায়।
   এআই চ্যাটবট প্রতিটি প্রশ্নের সাথে এর সংশ্লিষ্ট অংশ মডেলকে পাঠায়।

   চালান:  node scripts/build-knowledge.js
   ═══════════════════════════════════════════════════════════════ */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "ai");
const OUT_FILE = path.join(OUT_DIR, "knowledge.json");

// বাদ দেওয়া ফোল্ডার (স্টাফ পোর্টাল, স্ট্যাটিক অ্যাসেট, বিল্ড স্ক্রিপ্ট)
const SKIP_DIRS = new Set([
  ".git", ".freebuff", ".tmp", ".vscode", "ai", "css", "fonts",
  "images", "includes", "portal", "scripts"
]);
const SKIP_FILES = new Set(["404.html", "admin.html"]);

const MAX_CHUNK = 900;   // প্রতি চাংকের সর্বোচ্চ অক্ষর
const MIN_LINE = 12;     // এর চেয়ে ছোট লাইন বাদ (মেনু লেবেল ইত্যাদি)

/* ── HTML → পাঠ্য ─────────────────────────────────────────────── */

function decodeEntities(str) {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&zwj;/g, "")
    .replace(/&shy;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)));
}

function cleanCssGarbage(str) {
  // ইনলাইন <style> রয়ে গেলে তার রুল বাদ যায় না — নিশ্চিত হতে ব্লক রিমুভ করা হয়
  return str.replace(/\{[^{}]*(?:;[^{}]*)*\}/g, " ");
}

function htmlToLines(html) {
  let body = html;
  body = body.replace(/<!--[\s\S]*?-->/g, " ");
  body = body.replace(/<(script|style|noscript|svg|iframe|template|canvas)\b[\s\S]*?<\/\1>/gi, " ");
  body = body.replace(/<(header|nav|footer)\b[\s\S]*?<\/\1>/gi, " ");

  // শিরোনাম আলাদা করে ধরা
  body = body.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, "\n@@H@@ $2\n");

  // ব্লক ট্যাগ → নতুন লাইন
  body = body.replace(/<\/?(p|div|li|ul|ol|tr|td|th|table|section|article|main|aside|br|figure|figcaption|blockquote|dd|dt|dl)\b[^>]*>/gi, "\n");
  body = body.replace(/<[^>]+>/g, " ");

  body = cleanCssGarbage(body);
  body = decodeEntities(body);

  return body
    .split(/\n+/)
    .map((line) => line.replace(/[\s\u00a0]+/g, " ").trim())
    .filter(Boolean);
}

/* ── ফাইল সংগ্রহ ─────────────────────────────────────────────── */

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(full, acc);
    } else if (name.toLowerCase().endsWith(".html") && !SKIP_FILES.has(name)) {
      acc.push(full);
    }
  }
  return acc;
}

/* ── চাংক তৈরি ───────────────────────────────────────────────── */

function buildChunks(file) {
  const html = fs.readFileSync(file, "utf8");
  const rel = "/" + path.relative(ROOT, file).split(path.sep).join("/");
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? decodeEntities(titleMatch[1]).replace(/\s+/g, " ").replace(/\s*[|–—-]\s*জামিয়া.*$/, "").trim()
    : path.basename(file, ".html");

  const lines = htmlToLines(html);
  const chunks = [];
  let heading = "";
  let buf = "";

  const flush = () => {
    const text = buf.replace(/\s+/g, " ").trim();
    if (text.length >= 40) chunks.push({ u: rel, t: title, h: heading, x: text });
    buf = "";
  };

  for (const line of lines) {
    if (line.startsWith("@@H@@")) {
      flush();
      heading = line.replace("@@H@@", "").replace(/\s+/g, " ").trim();
      continue;
    }
    if (line.length < MIN_LINE) continue;
    if (heading && line === heading) continue;

    if (buf.length + line.length + 1 > MAX_CHUNK) flush();
    buf += (buf ? " " : "") + line;
  }
  flush();

  return chunks;
}

/* ── হাতে লেখা গুরুত্বপূর্ণ তথ্য (ফুটার/সাধারণ) ───────────────── */

const CURATED = [
  {
    u: "/index.html",
    t: "যোগাযোগ ও ঠিকানা",
    h: "জামিয়া বাবুস সালাম — যোগাযোগ",
    p: 1,
    x: "ঠিকানা: হজ ক্যাম্প ও র‍্যাব হেডকোয়ার্টার সংলগ্ন, বিমানবন্দর, ঢাকা-১২৩০। " +
      "অফিস ফোন: ০১৯৭৩-৮২৭৮৮১ (01973827881)। তালিমাত (শিক্ষা) বিভাগ: ০১৮১৬-১৮৩৪৮৮ (01816183488)। " +
      "ইমেইল: bsoffice1979@gmail.com। অফিসিয়াল হোয়াটসঅ্যাপ: https://wa.me/8801816183488। " +
      "মন্তব্য, পরামর্শ ও অভিযোগ জানানোর পেজ: /donate/feedback.html। " +
      "স্টাফ ও হিসাব পোর্টাল (শুধু কর্মীদের জন্য): /portal/login.html।"
  },
  {
    u: "/admission/admission.html",
    t: "অনলাইন ভর্তি আবেদন",
    h: "ওয়েবসাইট থেকে ভর্তি আবেদন",
    p: 1,
    x: "ভর্তি আবেদনের পেজ: /admission/admission.html — পেজের নিচে 'অনলাইন ভর্তি আবেদন' সেকশনে ফর্ম পূরণ করে সরাসরি আবেদন করা যায়। " +
      "ফর্মে নাম, পিতার নাম, জন্মতারিখ, জামাত, শিক্ষাবর্ষ, অভিভাবকের মোবাইল ও ঠিকানা দিতে হয়; জমা দিলে ADM- দিয়ে শুরু হওয়া একটি ট্র্যাকিং নম্বর দেখানো হয়। " +
      "একই মোবাইল থেকে ৩ মিনিটের মধ্যে দ্বিতীয় আবেদন জমা দেওয়া যায় না। " +
      "আবেদনের অবস্থা (অপেক্ষমাণ, নির্বাচিত, অপেক্ষমাণ তালিকা, বাতিল) মাদ্রাসা অফিসে জানতে পারবেন।"
  }
];

/* ── মূল কাজ ─────────────────────────────────────────────────── */

function main() {
  const files = walk(ROOT, []).sort();
  const all = [];
  const seen = new Set();

  for (const item of CURATED) {
    all.push(item);
  }

  for (const file of files) {
    let chunks = [];
    try {
      chunks = buildChunks(file);
    } catch (err) {
      console.warn("⚠️  পড়া যায়নি:", file, err.message);
      continue;
    }
    for (const chunk of chunks) {
      const key = chunk.u + "|" + chunk.x.slice(0, 80);
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(chunk);
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const payload = {
    generated: new Date().toISOString(),
    site: "জামিয়া বাবুস সালাম",
    pages: files.length,
    chunks: all
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload), "utf8");

  const bytes = fs.statSync(OUT_FILE).size;
  console.log("✅ তৈরি:", path.relative(ROOT, OUT_FILE));
  console.log("   পেজ:", files.length, "| চাংক:", all.length, "| আকার:", (bytes / 1024).toFixed(1), "KB");
}

main();
