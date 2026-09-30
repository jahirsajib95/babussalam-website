/* ═══════════════════════════════════════════════════════════════
   🤖 জামিয়া বাবুস সালাম — Gemini AI চ্যাটবট ইঞ্জিন (আপডেটেড)
   ═══════════════════════════════════════════════════════════════ */

// ✅ আপনার দেওয়া সক্রিয় Gemini API Key
const GEMINI_API_KEY = "AQ.Ab8RN6LYjinK0UxrnEjpUpPQeej7aRf9Jd5MHwy8vYtdv_EeJw";

// ════ জামিয়ার সকল তথ্যের ডাটাবেজ (AI-এর ব্রেন) ════
const JAMIA_KNOWLEDGE_BASE = `
তুমি "জামিয়া দারুল উলুম বাবুস সালাম"-এর অফিসিয়াল এআই সহকারী (AI Assistant)।
তোমার নাম "বাবুস সালাম এআই"। তুমি অত্যন্ত ভদ্র, বিনয়ী, আন্তরিক ও দ্বীনি মেজাজে ব্যবহারকারীদের প্রশ্নের উত্তর দেবে।
সবসময় সুন্দর ও বিশুদ্ধ বাংলা ভাষায় কথা বলবে। অভিবাদন হিসেবে "আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহ" এবং প্রাসঙ্গিক ক্ষেত্রে "ইনশাআল্লাহ", "আলহামদুলিল্লাহ", "জাযাকাল্লাহু খাইরান" ব্যবহার করবে।

জামিয়া সম্পর্কিত মৌলিক তথ্যসমূহ:
১. প্রতিষ্ঠানের নাম: জামিয়া দারুল উলুম বাবুস সালাম (Jamia Darul Ulum Babus Salam)।
২. প্রতিষ্ঠাকাল: ১২ মার্চ ১৯৯৬ ঈসায়ী (২৮ বছরেরও বেশি সময়ের ঐতিহ্য)।
৩. প্রতিষ্ঠাতা ও বর্তমান মুহতামিম (প্রিন্সিপাল): হযরত মাওলানা আনিসুর রহমান সাহেব।
৪. ভৌগোলিক অবস্থান ও ঠিকানা: রাজধানী ঢাকার প্রবেশদ্বার হযরত শাহজালাল (রহ.) আন্তর্জাতিক বিমানবন্দর সংলগ্ন। পূর্ব পাশে র‍্যাব হেডকোয়ার্টার (নির্মাণাধীন) ও সরকারি হজ ক্যাম্প। উত্তর-পূর্বে বিমানবন্দর রেলওয়ে স্টেশন ও ঢাকা-আশুলিয়া এলিভেটেড এক্সপ্রেসওয়ে। 
৫. নামকরণের তাৎপর্য: ঐতিহাসিক মসজিদে নববীর বরকতময় প্রধান প্রবেশদ্বার "বাবূস সালাম" (শান্তির তোরণ)-এর নামানুসারে বরকত ও শান্তির প্রত্যাশায় এই নামকরণ করা হয়েছে।
৬. শিক্ষা আদর্শ: দারুল উলুম দেওবন্দের মহান আদর্শ ও সিলেবাসের আলোকে পরিচালিত কওমি মাদ্রাসা।
৭. বিভাগসমূহ:
   - নূরানী ও নাযেরা বিভাগ (সহীহ কুরআন ও বুনিয়াদি দ্বীনিয়াত শিক্ষা)
   - হিফজুল কুরআন বিভাগ (অভিজ্ঞ হাফেজদের নিবিড় তত্ত্বাবধান)
   - কিতাব বিভাগ (ইবতিদাইয়্যাহ, মুতাওয়াসসিতা, সানাবিয়্যাহ, ফযীলত)
   - দাওরায়ে হাদিস (মাস্টার্স সমমান — সর্বোচ্চ স্তর)
   - ইফতা বিভাগ (উচ্চতর ইসলামী আইন ও ফতোয়া গবেষণা)
৮. ভর্তি তথ্য ও ফি:
   - প্রতি বছর রমযানের পর এবং শিক্ষাবর্ষের শুরুতে (শাওয়াল/জানুয়ারিতে) ভর্তি কার্যক্রম চলে।
   - ভর্তি হতে প্রয়োজনীয় কাগজপত্র: জন্ম নিবন্ধন, পূর্ববর্তী সনদ, পাসপোর্ট সাইজ ৪ কপি ছবি।
   - বিভাগ অনুযায়ী মাসিক খোরাকী ও টিউশন ফি অত্যন্ত সুলভ এবং এতিম-গরিবদের জন্য বিশেষ বৃত্তির ব্যবস্থা আছে।
৯. অন্যান্য শাখা ও প্রকল্প:
   - কেন্দ্রীয় দারুল উলুম বাবুস সালাম কমপ্লেক্স ও ফাউন্ডেশন।
   - বিভিন্ন জেলা ও উপজেলায় অধীনস্থ একাধিক শাখা মাদ্রাসা।
   - দাওয়াহ ও সমাজসেবায় "বাবুস সালাম কাফেলা" এবং অগ্রগামী "হাওয়ারিয়ান কাফেলা"।
১০. যোগাযোগ ও অনুদান:
   - মোবাইল/হেল্পলাইন: ০১৭XXXXXXXX
   - অনুদান পদ্ধতি: বিকাশ, নগদ এবং ইসলামী ব্যাংক একাউন্টের মাধ্যমে সাদকায়ে জারিয়ার উদ্দেশ্যে অনুদান পাঠানো যায়।

উত্তর দেওয়ার নীতিমালা:
- ব্যবহারকারীর প্রশ্নের সরাসরি ও প্রাসঙ্গিক উত্তর দেবে।
- যদি এমন কোনো প্রশ্ন করা হয় যার উত্তর তোমার তথ্যে নেই, তবে বলবে: "সম্মানিত দ্বীনি ভাই/বোন, এই বিষয়ে বিস্তারিত তথ্যের জন্য অনুগ্রহ করে আমাদের জামিয়ার অফিসে সরাসরি যোগাযোগ করুন অথবা ওয়েবসাইট দেখুন।"
- উত্তরের আকার খুব বেশি লম্বা করবে না, যাতে মোবাইলে পড়তে সুবিধা হয়।
`;

// চ্যাট হিস্ট্রি ধরে রাখার জন্য
let chatHistory = [];

// চ্যাটবক্স খোলা ও বন্ধ করার ফাংশন
function toggleAIChat() {
    const chatBox = document.getElementById("aiChatBox");
    const chatBtn = document.getElementById("aiChatBtn");
    
    if (chatBox.classList.contains("active")) {
        chatBox.classList.remove("active");
        chatBtn.style.display = "flex";
    } else {
        chatBox.classList.add("active");
        chatBtn.style.display = "none";
        document.getElementById("aiChatInput").focus();
    }
}

// মেসেজ পাঠানোর ফাংশন
async function sendAIMessage() {
    const inputField = document.getElementById("aiChatInput");
    const messageText = inputField.value.trim();
    if (!messageText) return;

    // ইউজার মেসেজ স্ক্রিনে দেখানো
    appendChatMessage("user", messageText);
    inputField.value = "";
    
    // লোডিং অ্যানিমেশন দেখানো
    const loadingId = appendLoadingIndicator();

    try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

        // রিকোয়েস্ট তৈরি
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: JAMIA_KNOWLEDGE_BASE }]
                },
                contents: [
                    ...chatHistory,
                    {
                        role: "user",
                        parts: [{ text: messageText }]
                    }
                ],
                generationConfig: {
                    temperature: 0.6,
                    maxOutputTokens: 600
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error("Gemini API Server Error:", errData);
            throw new Error(errData.error?.message || "HTTP_ERROR_" + response.status);
        }

        const data = await response.json();
        const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "দুঃখিত, কোনো উত্তর পাওয়া যায়নি।";

        // চ্যাট হিস্ট্রি আপডেট
        chatHistory.push({ role: "user", parts: [{ text: messageText }] });
        chatHistory.push({ role: "model", parts: [{ text: botReply }] });

        // লোডিং মুছে বটের উত্তর বসানো
        removeLoadingIndicator(loadingId);
        appendChatMessage("bot", botReply);

    } catch (error) {
        removeLoadingIndicator(loadingId);
        console.error("AI Error:", error);
        
        let errorMsg = "দুঃখিত, বর্তমানে সংযোগে সমস্যা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।";
        if (error.message && error.message.includes("API key not valid")) {
            errorMsg = "⚠️ API Key ভ্যালিডেশন ব্যর্থ হয়েছে। অনুগ্রহ করে কি সঠিক আছে কিনা চেক করুন।";
        }
        appendChatMessage("bot", errorMsg);
    }
}

// চ্যাট মেসেজ স্ক্রিনে যোগ করার হেল্পার
function appendChatMessage(sender, text) {
    const messagesContainer = document.getElementById("aiChatMessages");
    const msgDiv = document.createElement("div");
    msgDiv.className = `ai-msg ${sender}-msg`;
    
    // টেক্সট ফরম্যাটিং (বোল্ড ও লাইনব্রেক)
    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\n/g, '<br>');

    msgDiv.innerHTML = `
        <div class="msg-bubble">${formattedText}</div>
    `;
    
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// লোডিং ইন্ডিকেটর
function appendLoadingIndicator() {
    const messagesContainer = document.getElementById("aiChatMessages");
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
    const el = document.getElementById(id);
    if (el) el.remove();
}

// কীবোর্ডের Enter চাপলে মেসেজ পাঠানো
function handleChatKeyPress(event) {
    if (event.key === "Enter") {
        sendAIMessage();
    }
}

// দ্রুত প্রশ্ন করার বাটন ক্লিক হ্যান্ডলার
function askQuickQuestion(questionText) {
    document.getElementById("aiChatInput").value = questionText;
    sendAIMessage();
}