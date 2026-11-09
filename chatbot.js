/* ═══════════════════════════════════════════════════════════════
   🤖 জামিয়া বাবুস সালাম — AI চ্যাটবট (ক্লায়েন্ট)
   ✅ এই ফাইলে কোনো API key বা গোপন তথ্য নেই
   ✅ সব প্রসেসিং Cloudflare Worker-এ হয় (worker.js)
   ═══════════════════════════════════════════════════════════════ */

// 👇 Worker ডেপ্লয়ের পর যে লিংক পাবেন সেটা এখানে বসান
const CHAT_API_URL = "https://babussalam-chat.babussalam.workers.dev/";

// 👇 চ্যাটবট কাজ না করলে এই নম্বর দেখানো হবে (ফুটারের অফিস নম্বর — যাচাই করে নিন)
const FALLBACK_PHONE = "০১৮১৬-১৮৩৪৮৮";

const MAX_HISTORY = 8;
const REQUEST_TIMEOUT_MS = 40000;

let chatHistory = [];
let isSending = false;

/* ═══════════════════════════════════════════════════════════════
   🧠 সাইট-জ্ঞান (নলেজ-বেস)
   ai/knowledge.json — সাইটের সব পেজের তথ্য। প্রতিটি প্রশ্নে
   সবচেয়ে প্রাসঙ্গিক অংশগুলো মডেলের কাছে পাঠানো হয়, যাতে চ্যাটবট
   মাদ্রাসার নিজের তথ্য দিয়েই উত্তর দিতে পারে।
   ═══════════════════════════════════════════════════════════════ */

const KB_URL = (function () {
    const src = (document.currentScript && document.currentScript.src) || "";
    return src ? src.replace(/[^\/]*$/, "") + "ai/knowledge.json" : "ai/knowledge.json";
})();

const KB_TOP = 4;          // সর্বোচ্চ কতটি চাংক পাঠানো হবে
const KB_PER_PAGE = 2;     // একটি পেজ থেকে সর্বোচ্চ কতটি চাংক
const KB_BUDGET = 2000;    // সহায়ক তথ্যের সর্বোচ্চ অক্ষর

let kbPromise = null;

function loadKnowledge() {
    if (!kbPromise) {
        kbPromise = fetch(KB_URL, { cache: "force-cache" })
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (data) {
                return (data && Array.isArray(data.chunks)) ? data.chunks : [];
            })
            .catch(function () { return []; });
    }
    return kbPromise;
}

// বাংলা প্রশ্নে ব্যবহৃত সাধারণ শব্দ (স্কোরিংয়ে বাদ যায়)
const BN_STOPWORDS = new Set([
    "এবং", "কিন্তু", "অথবা", "বা", "ও", "এর", "এই", "সেই", "যে", "যা", "কি", "কী",
    "কত", "কবে", "কোথায়", "কেন", "কিভাবে", "কীভাবে", "কোন", "কোনটি", "আছে", "আছেন",
    "হয়", "হয়েছে", "হবে", "করা", "করতে", "করব", "জন্য", "থেকে", "সাথে", "দিয়ে",
    "আমি", "আমার", "আমরা", "আমাদের", "আপনি", "আপনার", "একটা", "একটি", "এক", "দয়া",
    "বলুন", "জানতে", "চাই", "চাইছি", "সম্পর্কে", "ব্যাপারে", "নাকি", "টাকা", "কোনো"
]);

function tokenizeQuestion(text) {
    return String(text)
        .toLowerCase()
        .split(/[^\u0980-\u09FFa-z0-9]+/)
        .filter(function (w) { return w.length > 1 && !BN_STOPWORDS.has(w); });
}

function scoreChunk(chunk, terms) {
    const hay = String((chunk.t || "") + " " + (chunk.h || "") + " " + (chunk.x || "")).toLowerCase();
    let score = 0;

    for (let i = 0; i < terms.length; i++) {
        const term = terms[i];

        // বাংলা বিভক্তি/প্রত্যয় সহ শব্দের জন্য কয়েকটি রূপ চেষ্টা করা
        // (শিক্ষকদের → শিক্ষক, মাদ্রাসার → মাদ্রাসা)
        const variants = [term];
        if (term.length >= 6) variants.push(term.slice(0, -2));
        if (term.length >= 8) variants.push(term.slice(0, -3));

        let best = 0;
        for (let v = 0; v < variants.length; v++) {
            const variant = variants[v];
            if (hay.indexOf(variant) === -1) continue;

            let s = 1;
            if (chunk.h && String(chunk.h).toLowerCase().indexOf(variant) !== -1) s += 2;
            if (chunk.t && String(chunk.t).toLowerCase().indexOf(variant) !== -1) s += 1;
            const count = hay.split(variant).length - 1;
            if (count > 1) s += Math.min(count - 1, 3) * 0.3;
            if (s > best) best = s;
        }
        score += best;
    }

    if (chunk.p) score += 2; // হাতে যাচাই করা গুরুত্বপূর্ণ তথ্য অগ্রাধিকার পায়
    return score;
}

// প্রশ্নের সাথে প্রাসঙ্গিক সাইট-তথ্য জোগাড় করে (না পেলে খালি স্ট্রিং)
async function buildSiteContext(question) {
    const terms = Array.from(new Set(tokenizeQuestion(question))).slice(0, 12);
    if (!terms.length) return "";

    const chunks = await loadKnowledge();
    if (!chunks.length) return "";

    const scored = [];
    for (let i = 0; i < chunks.length; i++) {
        const s = scoreChunk(chunks[i], terms);
        if (s > 0) scored.push({ chunk: chunks[i], score: s });
    }
    if (!scored.length) return "";

    scored.sort(function (a, b) { return b.score - a.score; });

    // একই পেজের অনেকগুলো চাংক যাতে বাকি পেজকে চাপা না দেয়
    let out = "";
    let used = 0;
    const perPage = {};
    for (let i = 0; i < scored.length && used < KB_TOP; i++) {
        const c = scored[i].chunk;
        const page = c.u || c.t;
        if ((perPage[page] || 0) >= KB_PER_PAGE) continue;

        const block = "• [" + c.t + (c.h ? " — " + c.h : "") + "] " + c.x;
        if (out && out.length + block.length > KB_BUDGET) continue;

        perPage[page] = (perPage[page] || 0) + 1;
        out += (out ? "\n" : "") + block;
        used++;
    }
    if (!out) return "";

    return "[জামিয়া বাবুস সালামের অফিসিয়াল ওয়েবসাইট থেকে সহায়ক তথ্য — প্রশ্নের সাথে প্রাসঙ্গিক হলে ব্যবহার করুন]\n" + out;
}

// নলেজ-বেস আগেভাগে লোড করে রাখা (প্রথম উত্তর দ্রুত পেতে)
if (typeof requestIdleCallback === "function") {
    requestIdleCallback(loadKnowledge, { timeout: 5000 });
} else {
    setTimeout(loadKnowledge, 3000);
}

// চ্যাটবক্স খোলা ও বন্ধ করার ফাংশন
function toggleAIChat() {
    const chatBox = document.getElementById("aiChatBox");
    const chatBtn = document.getElementById("aiChatBtn");
    if (!chatBox) return;

    if (chatBox.classList.contains("active")) {
        chatBox.classList.remove("active");
        if (chatBtn) chatBtn.style.display = "flex";
    } else {
        chatBox.classList.add("active");
        if (chatBtn) chatBtn.style.display = "none";
        const inputField = document.getElementById("aiChatInput");
        if (inputField) inputField.focus();
    }
}

// মেসেজ পাঠানোর মূল ফাংশন
async function sendAIMessage() {
    if (isSending) return;

    const inputField = document.getElementById("aiChatInput");
    if (!inputField) return;

    const messageText = inputField.value.trim().slice(0, 500);
    if (!messageText) return;

    isSending = true;
    setSendButtonState(true);

    appendChatMessage("user", messageText);
    inputField.value = "";
    const loadingId = appendLoadingIndicator();

    // প্রশ্নের সাথে সাইটের প্রাসঙ্গিক তথ্য যোগ করা
    let outgoingContent = messageText;
    try {
        const siteContext = await buildSiteContext(messageText);
        if (siteContext) outgoingContent = messageText + "\n\n" + siteContext;
    } catch (err) {
        console.warn("Knowledge lookup skipped:", err);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(CHAT_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [...chatHistory, { role: "user", content: outgoingContent }]
            }),
            signal: controller.signal
        });

        const data = await response.json();
        if (!response.ok || !data.reply) {
            throw new Error(data.error || "server_error");
        }

        if (data.model) console.log("AI model used:", data.model);

        chatHistory.push({ role: "user", content: messageText });
        chatHistory.push({ role: "assistant", content: data.reply });
        if (chatHistory.length > MAX_HISTORY) {
            chatHistory = chatHistory.slice(-MAX_HISTORY);
        }

        removeLoadingIndicator(loadingId);
        appendChatMessage("bot", data.reply);

    } catch (error) {
        removeLoadingIndicator(loadingId);
        console.error("AI Connection Error:", error);
        appendChatMessage(
            "bot",
            "দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন, " +
            "অথবা সরাসরি অফিসে যোগাযোগ করুন: " + FALLBACK_PHONE
        );
    } finally {
        clearTimeout(timer);
        isSending = false;
        setSendButtonState(false);
    }
}

function setSendButtonState(disabled) {
    const btn = document.getElementById("aiSendBtn");
    if (btn) btn.disabled = disabled;
}

// HTML এস্কেপ (নিরাপত্তার জন্য)
function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// চ্যাট মেসেজ স্ক্রিনে যোগ করার হেল্পার
function appendChatMessage(sender, text) {
    const messagesContainer = document.getElementById("aiChatMessages");
    if (!messagesContainer) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = `ai-msg ${sender}-msg`;

    const formattedText = escapeHTML(text)
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/\n/g, "<br>");

    msgDiv.innerHTML = `<div class="msg-bubble">${formattedText}</div>`;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// লোডিং ইন্ডিকেটর
function appendLoadingIndicator() {
    const messagesContainer = document.getElementById("aiChatMessages");
    if (!messagesContainer) return null;

    const loadingDiv = document.createElement("div");
    const id = "loading_" + Date.now();
    loadingDiv.id = id;
    loadingDiv.className = "ai-msg bot-msg";
    loadingDiv.innerHTML = `
        <div class="msg-bubble loading-dots">
            <span>.</span><span>.</span><span>.</span>
        </div>
    `;
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return id;
}

function removeLoadingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
}

// কীবোর্ডের Enter চাপলে মেসেজ পাঠানো
function handleChatKeyPress(event) {
    if (event.key === "Enter") {
        sendAIMessage();
    }
}

// কুইক বাটনে ক্লিক হ্যান্ডলার
function askQuickQuestion(questionText) {
    const inputField = document.getElementById("aiChatInput");
    if (inputField) {
        inputField.value = questionText;
        sendAIMessage();
    }
}
