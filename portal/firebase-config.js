// ═══════════════════════════════════════════════════════════════
// 🕌 জামিয়া দারুল উলুম বাবুস সালাম — ফায়ারবেস সংযোগ ফাইল
// ═══════════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey: "AIzaSyBU3qlE4NbLWaTdCdF9jmIRzxPnn3rWCI8",
  authDomain: "babussalam-accounts.firebaseapp.com",
  projectId: "babussalam-accounts",
  storageBucket: "babussalam-accounts.firebasestorage.app",
  messagingSenderId: "724003282043",
  appId: "1:724003282043:web:94db559e38f06f8a8c56de",
  measurementId: "G-ETZZP80KZX"
};

// ফায়ারবেস ইনিশিয়ালাইজ করা
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// ফায়ারস্টোর ডাটাবেজ অবজেক্ট
const db = firebase.firestore();

// সংখ্যা বাংলায় রূপান্তর করার কমন ফাংশন
function toBengaliNumber(num) {
    if (num === null || num === undefined) return '০';
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, d => bnDigits[d]);
}

// জামাতসমূহের সার্বজনীন তালিকা
const JAMAT_LIST = [
    "নূরানী ও মক্তব",
    "নাযেরা বিভাগ",
    "হিফজুল কুরআন বিভাগ",
    "ইবতেদায়ী (১ম বর্ষ)",
    "ইবতেদায়ী (২য় বর্ষ)",
    "ইবতেদায়ী (৩য় বর্ষ)",
    "ইবতেদায়ী (৪র্থ বর্ষ)",
    "ইবতেদায়ী (৫ম বর্ষ)",
    "মুতাওয়াসসিতাহ ১ম বর্ষ (তাইসীর)",
    "মুতাওয়াসসিতাহ ২য় বর্ষ (মিযান)",
    "মুতাওয়াসসিতাহ ৩য় বর্ষ (নাহবেমীর)",
    "সানাবিয়া (হেদায়াতুন্নাহু)",
    "সানাবিয়া উলইয়া ১ম বর্ষ (কাফিয়া)",
    "সানাবিয়া উলইয়া ২য় বর্ষ (শরহে জামী)",
    "ফযীলত ১ম বর্ষ (শরহে বেকায়া)",
    "ফযীলত ২য় বর্ষ (মেশকাত)",
    "দাওরায়ে হাদিস (তাকমীল)",
    "ইফতা বিভাগ"
];

// ════ Firebase Authentication (সার্ভার-ভেরিফাইড লগইন) ════
const auth = (firebase.auth ? firebase.auth() : null);

// XSS প্রতিরোধ: ডাটাবেজের লেখা HTML-এ বসানোর আগে এটি ব্যবহার করুন
function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
// বাংলা অঙ্ক -> ইংরেজি অঙ্ক (সার্চ/ইমপোর্টের জন্য)
function normDigits(s) {
    return String(s ?? '').replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
}
// ছাত্রের ইউনিক ডক আইডি: শিক্ষাবর্ষ + দাখেলা (এক দাখেলা নম্বর ভিন্ন বছরে একে অপরকে মুছবে না)
function stdId(session, dakhelaNum) {
    return normDigits(session) + '_' + dakhelaNum;
}
// পেজ গার্ড: লগইন না থাকলে বা admins কালেকশনে না থাকলে ঢুকতে দেবে না
function requireAuth() {
    document.documentElement.style.visibility = 'hidden';
    auth.onAuthStateChanged(async user => {
        if (!user) { location.replace('login.html'); return; }
        try {
            const a = await db.collection('admins').doc(user.uid).get();
            if (!a.exists) throw new Error('not admin');
            document.documentElement.style.visibility = 'visible';
        } catch (e) {
            await auth.signOut();
            location.replace('login.html');
        }
    });
}
async function logoutPortal() {
    if (confirm("আপনি কি নিশ্চিত লগআউট করতে চান?")) {
        await auth.signOut();
        location.href = "login.html";
    }
}