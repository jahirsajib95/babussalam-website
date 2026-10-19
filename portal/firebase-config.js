/* ==========================================================================
   ফাইল লোকেশন: babussalam-website/portal/firebase-config.js
   বিবরণ: ফায়ারবেস সংযোগ, সোলায়মান লিপি ফন্ট, ডুপ্লিকেট চেকার ও সেলফ-পিন চেঞ্জ ইঞ্জিন
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBU3qlE4NbLWaTdCdF9jmIRzxPnn3rWCI8",
  authDomain: "babussalam-accounts.firebaseapp.com",
  projectId: "babussalam-accounts",
  storageBucket: "babussalam-accounts.firebasestorage.app",
  messagingSenderId: "724003282043",
  appId: "1:724003282043:web:94db559e38f06f8a8c56de",
  measurementId: "G-ETZZP80KZX"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// সোলায়মান লিপি ফন্ট সিডিএন লোড
(function loadSolaimanLipiFont() {
    const fontId = 'solaiman-lipi-font-loader';
    if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.maateen.me/solaiman-lipi/font.css';
        document.head.appendChild(link);
    }
})();

function toBengaliNumber(num) {
    if (num === null || num === undefined) return '০';
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, d => bnDigits[d]);
}

function normDigits(str) {
    return String(str ?? '').replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
}

function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

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

const MONTHS_LIST = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

// ইউনিক ডক আইডি ফরম্যাট: session_dakhela
function stdId(session, dakhelaNum) {
    return normDigits(session) + '_' + parseInt(normDigits(dakhelaNum), 10);
}

let currentStaffUser = null;

function requireAuth() {
    document.documentElement.style.visibility = 'hidden';
    auth.onAuthStateChanged(async user => {
        if (!user) {
            location.replace('login.html');
            return;
        }
        try {
            const snap = await db.collection('admins').doc(user.uid).get();
            if (!snap.exists) throw new Error('অননুমোদিত ইউজার');
            
            currentStaffUser = { uid: user.uid, ...snap.data() };
            document.documentElement.style.visibility = 'visible';
            
            // হেডার ইউজারের নাম প্রদর্শন এবং ক্লিক করলে পিন চেঞ্জ ডায়ালগ
            const staffDisplay = document.getElementById('activeStaffDisplay');
            if (staffDisplay) {
                staffDisplay.innerText = currentStaffUser.name || currentStaffUser.phone || 'হিসাবরক্ষক';
                staffDisplay.title = "নিজের সিকিউরিটি পিন পরিবর্তন করতে ক্লিক করুন";
                staffDisplay.style.cursor = "pointer";
                staffDisplay.onclick = openChangePinDialog;
            }
        } catch (e) {
            await auth.signOut();
            location.replace('login.html');
        }
    });
}

// ৪ ডিজিট সিকিউরিটি পিন ভেরিফিকেশন ইঞ্জিন
async function verifyUserPin(actionName = "এই কাজটি সম্পন্ন") {
    return new Promise((resolve) => {
        const inputPin = prompt(`🔒 সিকিউরিটি পিন (Transaction PIN) দিন:\n${actionName} করতে আপনার ৪-ডিজিটের পিন লিখুন:`);
        if (!inputPin) {
            alert("পিন দেওয়া হয়নি! কার্যক্রম বাতিল।");
            resolve(false);
            return;
        }
        
        const cleanPin = normDigits(inputPin.trim());
        if (!currentStaffUser || String(currentStaffUser.pin) !== cleanPin) {
            alert("⚠️ ভুল সিকিউরিটি পিন! কার্যক্রম বাতিল করা হলো।");
            resolve(false);
            return;
        }
        resolve(true);
    });
}

// 👤 ইউজার নিজের পিন নিজে পরিবর্তন করার মেকানিজম
async function openChangePinDialog() {
    if (!currentStaffUser) return;

    const oldPin = prompt("🔑 আপনার বর্তমান ৪-ডিজিটের সিকিউরিটি পিন লিখুন:");
    if (!oldPin) return;

    if (normDigits(oldPin.trim()) !== String(currentStaffUser.pin)) {
        alert("⚠️ বর্তমান পিন ভুল হয়েছে! পিন পরিবর্তন করা সম্ভব নয়।");
        return;
    }

    const newPin = prompt("🆕 নতুন ৪-ডিজিটের সিকিউরিটি পিন লিখুন (যেমন: 1234):");
    if (!newPin) return;

    const cleanNewPin = normDigits(newPin.trim());
    if (!/^\d{4}$/.test(cleanNewPin)) {
        alert("⚠️ পিন অবশ্যই ঠিক ৪ ডিজিটের সংখ্যা হতে হবে!");
        return;
    }

    const confirmPin = prompt("🔁 নতুন পিনটি পুনরায় নিশ্চিত করুন:");
    if (cleanNewPin !== normDigits(confirmPin ? confirmPin.trim() : '')) {
        alert("⚠️ নতুন পিন দুটি মিলেনি! আবার চেষ্টা করুন।");
        return;
    }

    try {
        await db.collection("admins").doc(currentStaffUser.uid).update({
            pin: cleanNewPin,
            pinUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        currentStaffUser.pin = cleanNewPin;
        alert("🎉 আলহামদুলিল্লাহ! আপনার লেনদেন সিকিউরিটি পিন সফলভাবে পরিবর্তন হয়েছে।");
    } catch (e) {
        alert("পিন পরিবর্তন করতে সমস্যা: " + e.message);
    }
}

async function logoutPortal() {
    if (confirm("আপনি কি নিশ্চিত লগআউট করতে চান?")) {
        await auth.signOut();
        location.href = "login.html";
    }
}