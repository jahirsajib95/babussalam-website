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

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(CHAT_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [...chatHistory, { role: "user", content: messageText }]
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
