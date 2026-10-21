/* ==========================================================================
   ফাইল লোকেশন: babussalam-website/portal/firebase-config.js
   বিবরণ: ফায়ারবেস সংযোগ, ফন্ট, সাধারণ হেল্পার, পিন (হ্যাশড + লক), অটো-লগআউট,
          তারিখ-সীমা (দিন/সপ্তাহ/মাস/কাস্টম) হেল্পার
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

// সোলায়মান লিপি ফন্ট (বন্ধ থাকলে CSS-এর fallback ফন্ট কাজ করবে)
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

/* ---------------- সাধারণ হেল্পার ---------------- */
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

// ইনপুট ফিল্ড থেকে সংখ্যা (বাংলা/ইংরেজি দুই অঙ্কই চলবে)
function nv(id) {
    return Number(normDigits(document.getElementById(id).value).replace(/,/g, '').trim()) || 0;
}

// শিক্ষাবর্ষ সবসময় বাংলা অঙ্কে (যেমন: ২০২৬-২৭)
function normSession(s) {
    return toBengaliNumber(normDigits(s).trim().replace(/\s+/g, '').replace(/[–—]/g, '-'));
}

function makeTrackingRef() {
    return "ONL-" + Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).toUpperCase().slice(2, 6);
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

/* ---------------- তারিখ-সীমা হেল্পার (সপ্তাহ শনিবার থেকে শুরু) ---------------- */
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

// রিটার্ন: { start, end } — end বাদ (exclusive); null মানে সীমাহীন
function getDateRange(preset, fromStr, toStr) {
    const today = startOfDay(new Date());
    const weekStart = addDays(today, -((today.getDay() + 1) % 7)); // শনিবার
    const y = today.getFullYear(), m = today.getMonth();
    switch (preset) {
        case 'today':     return { start: today, end: addDays(today, 1) };
        case 'yesterday': return { start: addDays(today, -1), end: today };
        case 'week':      return { start: weekStart, end: addDays(weekStart, 7) };
        case 'lastweek':  return { start: addDays(weekStart, -7), end: weekStart };
        case 'month':     return { start: new Date(y, m, 1), end: new Date(y, m + 1, 1) };
        case 'lastmonth': return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
        case 'custom': {
            const f = fromStr ? new Date(normDigits(fromStr) + 'T00:00:00') : null;
            const t = toStr ? new Date(normDigits(toStr) + 'T00:00:00') : null;
            return { start: f, end: t ? addDays(t, 1) : null };
        }
        default:          return { start: null, end: null };
    }
}

function fmtDate(d) {
    const p = n => String(n).padStart(2, '0');
    return toBengaliNumber(`${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`);
}

function rangeLabel(r) {
    if (!r || (!r.start && !r.end)) return 'সর্বমোট (শুরু থেকে)';
    const a = r.start ? fmtDate(r.start) : 'শুরু';
    const b = r.end ? fmtDate(addDays(r.end, -1)) : 'আজ পর্যন্ত';
    return a === b ? a : `${a} — ${b}`;
}

/* ---------------- লগইন গার্ড ---------------- */
let currentStaffUser = null;
const _staffReadyCbs = [];

// স্টাফ তথ্য লোড হওয়ার পর কাজ চালাতে
function onStaffReady(fn) {
    if (currentStaffUser) fn(currentStaffUser);
    else _staffReadyCbs.push(fn);
}

function cashierName() {
    if (currentStaffUser) return currentStaffUser.name || currentStaffUser.phone || 'কর্মকর্তা';
    return auth.currentUser ? auth.currentUser.email : 'অজানা';
}
function cashierUid() { return auth.currentUser ? auth.currentUser.uid : ''; }

function _setupStaffHeader() {
    const staffDisplay = document.getElementById('activeStaffDisplay');
    if (!staffDisplay) return;
    staffDisplay.innerText = cashierName();
    staffDisplay.title = "নিজের সিকিউরিটি পিন পরিবর্তন করতে ক্লিক করুন";
    staffDisplay.style.cursor = "pointer";
    staffDisplay.onclick = openChangePinDialog;
}

function requireAuth() {
    document.documentElement.style.visibility = 'hidden';
    auth.onAuthStateChanged(async user => {
        if (!user) { location.replace('login.html'); return; }

        let snap;
        try {
            snap = await db.collection('admins').doc(user.uid).get();
        } catch (e) {
            if (e.code === 'permission-denied') {
                await auth.signOut();
                location.replace('login.html');
                return;
            }
            // ইন্টারনেট/সার্ভারের সাময়িক সমস্যায় জোর করে লগআউট করা হবে না
            if (confirm('সার্ভারের সাথে সংযোগ হচ্ছে না।\nআবার চেষ্টা করবেন?')) location.reload();
            else { await auth.signOut(); location.replace('login.html'); }
            return;
        }

        if (!snap.exists) {
            await auth.signOut();
            location.replace('login.html');
            return;
        }

        currentStaffUser = { uid: user.uid, ...snap.data() };
        document.documentElement.style.visibility = 'visible';

        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _setupStaffHeader);
        else _setupStaffHeader();

        _startIdleTimer();
        _staffReadyCbs.splice(0).forEach(fn => { try { fn(currentStaffUser); } catch (e) { console.error(e); } });
    });
}

// ৩০ মিনিট নিষ্ক্রিয় থাকলে অটো লগআউট
let _idleTimer = null;
function _startIdleTimer() {
    const LIMIT = 30 * 60 * 1000;
    const reset = () => {
        clearTimeout(_idleTimer);
        _idleTimer = setTimeout(async () => {
            await auth.signOut();
            alert('দীর্ঘক্ষণ নিষ্ক্রিয় থাকায় নিরাপত্তার জন্য লগআউট করা হয়েছে।');
            location.replace('login.html');
        }, LIMIT);
    };
    ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(ev =>
        document.addEventListener(ev, reset, { passive: true }));
    reset();
}

/* ---------------- সিকিউরিটি পিন ---------------- */
function askPin(title, desc) {
    return new Promise(resolve => {
        const ov = document.createElement('div');
        ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:100000;display:flex;align-items:center;justify-content:center;padding:15px;font-family:'SolaimanLipi','Noto Sans Bengali',Arial,sans-serif;";
        ov.innerHTML = `
          <div style="background:#fff;border-radius:12px;max-width:340px;width:100%;padding:22px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.3);">
            <div style="font-size:2rem;">🔒</div>
            <h3 style="margin:6px 0;color:#0F5132;font-size:1.1rem;">${esc(title)}</h3>
            <p style="margin:0 0 12px;color:#555;font-size:.9rem;">${esc(desc || '')}</p>
            <input type="password" inputmode="numeric" maxlength="4" autocomplete="off"
                   style="width:100%;box-sizing:border-box;padding:12px;font-size:1.6rem;letter-spacing:.5rem;text-align:center;border:1px solid #DEE2E6;border-radius:8px;">
            <div style="display:flex;gap:8px;margin-top:14px;">
              <button type="button" data-r="cancel" style="flex:1;padding:10px;border:none;border-radius:6px;background:#6c757d;color:#fff;font-family:inherit;font-weight:bold;cursor:pointer;">বাতিল</button>
              <button type="button" data-r="ok" style="flex:1;padding:10px;border:none;border-radius:6px;background:#0F5132;color:#fff;font-family:inherit;font-weight:bold;cursor:pointer;">নিশ্চিত করুন</button>
            </div>
          </div>`;
        document.body.appendChild(ov);
        const inp = ov.querySelector('input');
        inp.focus();
        const done = v => { ov.remove(); resolve(v); };
        const submit = () => done(normDigits(inp.value.trim()));
        ov.querySelector('[data-r=ok]').onclick = submit;
        ov.querySelector('[data-r=cancel]').onclick = () => done(null);
        inp.addEventListener('keydown', e => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') done(null);
        });
    });
}

async function hashPin(pin, uid) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(uid + ':' + pin));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function _lockKey() { return 'pinLock:' + (currentStaffUser ? currentStaffUser.uid : ''); }
function _getLock() {
    try { return JSON.parse(localStorage.getItem(_lockKey())) || { n: 0, until: 0 }; }
    catch (e) { return { n: 0, until: 0 }; }
}
function _setLock(o) { try { localStorage.setItem(_lockKey(), JSON.stringify(o)); } catch (e) {} }

async function checkPinValue(pin) {
    if (!currentStaffUser) return false;
    const uid = currentStaffUser.uid;
    if (currentStaffUser.pinHash) {
        return (await hashPin(pin, uid)) === currentStaffUser.pinHash;
    }
    // পুরনো প্লেইন-টেক্সট পিন: সঠিক হলে স্বয়ংক্রিয়ভাবে হ্যাশে রূপান্তর
    if (currentStaffUser.pin !== undefined && String(currentStaffUser.pin) === pin) {
        try {
            const h = await hashPin(pin, uid);
            await db.collection('admins').doc(uid).update({
                pinHash: h,
                pin: firebase.firestore.FieldValue.delete()
            });
            currentStaffUser.pinHash = h;
            delete currentStaffUser.pin;
        } catch (e) { /* রূপান্তর ব্যর্থ হলেও পিন সঠিক */ }
        return true;
    }
    return false;
}

// ৪ ডিজিট সিকিউরিটি পিন ভেরিফিকেশন (মাস্কড, ৫ বার ভুলে ৫ মিনিট লক)
async function verifyUserPin(actionName = "এই কাজটি সম্পন্ন") {
    const lock = _getLock();
    if (lock.until > Date.now()) {
        const mins = Math.ceil((lock.until - Date.now()) / 60000);
        alert(`⚠️ অনেকবার ভুল পিন দেওয়া হয়েছে! ${toBengaliNumber(mins)} মিনিট পরে চেষ্টা করুন।`);
        return false;
    }

    const pin = await askPin('সিকিউরিটি পিন দিন', `${actionName} করতে আপনার ৪-ডিজিটের পিন লিখুন`);
    if (pin === null) return false;
    if (!/^\d{4}$/.test(pin)) {
        alert("⚠️ পিন অবশ্যই ঠিক ৪ ডিজিটের সংখ্যা হতে হবে!");
        return false;
    }

    if (await checkPinValue(pin)) {
        _setLock({ n: 0, until: 0 });
        return true;
    }

    const n = (lock.n || 0) + 1;
    if (n >= 5) {
        _setLock({ n: 0, until: Date.now() + 5 * 60000 });
        alert("🚫 ৫ বার ভুল পিন দেওয়া হয়েছে! নিরাপত্তার জন্য ৫ মিনিট লক করা হলো।");
    } else {
        _setLock({ n, until: 0 });
        alert(`⚠️ ভুল সিকিউরিটি পিন! আর ${toBengaliNumber(5 - n)} বার সুযোগ আছে।`);
    }
    return false;
}

// ইউজার নিজের পিন নিজে পরিবর্তন
async function openChangePinDialog() {
    if (!currentStaffUser) return;

    const old = await askPin('বর্তমান পিন', 'আপনার বর্তমান ৪-ডিজিটের পিন লিখুন');
    if (old === null) return;
    if (!(await checkPinValue(old))) {
        alert("⚠️ বর্তমান পিন ভুল হয়েছে! পিন পরিবর্তন করা সম্ভব নয়।");
        return;
    }

    const np = await askPin('নতুন পিন', 'নতুন ৪-ডিজিটের পিন লিখুন');
    if (np === null) return;
    if (!/^\d{4}$/.test(np)) {
        alert("⚠️ পিন অবশ্যই ঠিক ৪ ডিজিটের সংখ্যা হতে হবে!");
        return;
    }
    if (np === old) {
        alert("⚠️ নতুন পিন আগের পিনের মতো হতে পারবে না!");
        return;
    }

    const cp = await askPin('পিন নিশ্চিত করুন', 'নতুন পিনটি আবার লিখুন');
    if (cp !== np) {
        alert("⚠️ নতুন পিন দুটি মিলেনি! আবার চেষ্টা করুন।");
        return;
    }

    try {
        const h = await hashPin(np, currentStaffUser.uid);
        await db.collection("admins").doc(currentStaffUser.uid).update({
            pinHash: h,
            pin: firebase.firestore.FieldValue.delete(),
            pinUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        currentStaffUser.pinHash = h;
        delete currentStaffUser.pin;
        alert("🎉 আলহামদুলিল্লাহ! আপনার সিকিউরিটি পিন সফলভাবে পরিবর্তন হয়েছে।");
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