/* ==========================================================================
   ফাইল লোকেশন: babussalam-website/admission/apply.js
   বিবরণ: অনলাইন ভর্তি আবেদন ফর্ম — যাচাই, Firestore-এ জমা ও ট্র্যাকিং নম্বর।

   • Firebase SDK শুধু ফর্ম সাবমিটের সময় লোড হয় (পেজের গতি অটুট থাকে)।
   • অ্যাপ্লিকেশন জমা হয় site-এর নিজের Firestore-এ, কালেকশন:
     admission_applications (শুধু অ্যাডমিন পড়তে পারে)।
   ========================================================================== */
(function () {
    'use strict';

    var SDK = 'https://www.gstatic.com/firebasejs/10.8.0/';
    var firebaseConfig = {
        apiKey: "AIzaSyBU3qlE4NbLWaTdCdF9jmIRzxPnn3rWCI8",
        authDomain: "babussalam-accounts.firebaseapp.com",
        projectId: "babussalam-accounts",
        storageBucket: "babussalam-accounts.firebasestorage.app",
        messagingSenderId: "724003282043",
        appId: "1:724003282043:web:94db559e38f06f8a8c56de"
    };

    var form = document.getElementById('applyForm');
    if (!form) return;

    var btn = document.getElementById('afSubmit');
    var statusEl = document.getElementById('afStatus');
    var successBox = document.getElementById('afSuccess');
    var refEl = document.getElementById('afRef');
    var db = null;
    var loadingPromise = null;
    var SENT_KEY = 'bs_adm_sent_at';

    var bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

    function bn(value) {
        return String(value).replace(/\d/g, function (d) { return bnDigits[d]; });
    }

    function enDigits(str) {
        return String(str || '').replace(/[০-৯]/g, function (d) { return '০১২৩৪৫৬৭৮৯'.indexOf(d); });
    }

    function showStatus(msg, isError) {
        if (!statusEl) return;
        statusEl.textContent = msg || '';
        statusEl.className = 'af-status' + (msg ? (isError ? ' is-error' : ' is-ok') : '');
    }

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = resolve;
            s.onerror = function () { reject(new Error('স্ক্রিপ্ট লোড হয়নি')); };
            document.head.appendChild(s);
        });
    }

    function ensureFirebase() {
        if (db) return Promise.resolve(db);
        if (loadingPromise) return loadingPromise;
        loadingPromise = loadScript(SDK + 'firebase-app-compat.js')
            .then(function () { return loadScript(SDK + 'firebase-firestore-compat.js'); })
            .then(function () {
                if (!window.firebase) throw new Error('Firebase পাওয়া যায়নি');
                if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
                db = firebase.firestore();
                return db;
            });
        return loadingPromise;
    }

    /* ---------- জামাত ও শিক্ষাবর্ষের অপশন ---------- */
    var JAMAT_LIST = [
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
        "ফযীলত ১ম বর্ষ (শরেহ বেকায়া)",
        "ফযীলত ২য় বর্ষ (মেশকাত)",
        "দাওরায়ে হাদিস (তাকমীল)",
        "ইফতা বিভাগ"
    ];

    function buildOptions() {
        var jamatSel = document.getElementById('afJamat');
        if (jamatSel && jamatSel.options.length <= 1) {
            JAMAT_LIST.forEach(function (name) {
                var o = document.createElement('option');
                o.value = name;
                o.textContent = name;
                jamatSel.appendChild(o);
            });
        }

        var sessionSel = document.getElementById('afSession');
        if (sessionSel && sessionSel.options.length <= 1) {
            var year = new Date().getFullYear();
            [year, year + 1].forEach(function (start) {
                var label = bn(start) + '-' + bn(String(start + 1).slice(-2));
                var o = document.createElement('option');
                o.value = label;
                o.textContent = label;
                sessionSel.appendChild(o);
            });
        }
    }

    /* ---------- ফর্ম পড়া ও যাচাই ---------- */
    function val(id) { return (document.getElementById(id).value || '').trim(); }

    function collect() {
        return {
            name: val('afName').replace(/\s+/g, ' '),
            fatherName: val('afFather').replace(/\s+/g, ' '),
            motherName: val('afMother').replace(/\s+/g, ' '),
            dob: val('afDob'),
            jamat: val('afJamat'),
            session: val('afSession'),
            guardianPhone: enDigits(val('afPhone')).replace(/[^0-9]/g, ''),
            address: val('afAddress').replace(/\s+/g, ' '),
            previousMadrasa: val('afPrev').replace(/\s+/g, ' '),
            notes: val('afNote')
        };
    }

    function ageFrom(dob) {
        var d = new Date(dob + 'T00:00:00');
        if (isNaN(d.getTime())) return -1;
        var today = new Date();
        var age = today.getFullYear() - d.getFullYear();
        var m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
        return age;
    }

    function validate(data) {
        if (data.name.length < 3 || data.name.length > 60) return 'ছাত্রের নাম সঠিকভাবে লিখুন (৩–৬০ অক্ষর)।';
        if (data.fatherName.length < 3 || data.fatherName.length > 60) return 'পিতার নাম সঠিকভাবে লিখুন (৩–৬০ অক্ষর)।';
        if (data.motherName.length > 60) return 'মাতার নাম ৬০ অক্ষরের মধ্যে লিখুন।';
        if (!data.dob) return 'জন্মতারিখ নির্বাচন করুন।';
        var age = ageFrom(data.dob);
        if (age < 4 || age > 45) return 'জন্মতারিখ সঠিক নয় (বয়স ৪–৪৫ বছরের মধ্যে হতে হবে)।';
        if (!data.jamat) return 'কোন জামাতে ভর্তি হতে চান তা নির্বাচন করুন।';
        if (!/^01[3-9][0-9]{8}$/.test(data.guardianPhone)) return 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন 01816183488)।';
        if (data.address.length < 8) return 'সম্পূর্ণ ঠিকানা লিখুন (কমপক্ষে ৮ অক্ষর)।';
        if (data.address.length > 160) return 'ঠিকানা ১৬০ অক্ষরের মধ্যে লিখুন।';
        if (data.previousMadrasa.length > 80) return 'পূর্ববর্তী মাদ্রাসার নাম ৮০ অক্ষরের মধ্যে লিখুন।';
        if (data.notes.length > 300) return 'অতিরিক্ত তথ্য ৩০০ অক্ষরের মধ্যে লিখুন।';
        var consent = document.getElementById('afConsent');
        if (!consent || !consent.checked) return 'তথ্য সঠিক থাকার বিষয়টি টিক দিয়ে নিশ্চিত করুন।';
        return '';
    }

    /* ---------- জমা দেওয়া ---------- */
    async function submit(event) {
        event.preventDefault();
        showStatus('');

        var data = collect();
        var problem = validate(data);
        if (problem) { showStatus(problem, true); return; }

        try {
            var last = Number(localStorage.getItem(SENT_KEY) || 0);
            if (last && Date.now() - last < 3 * 60 * 1000) {
                showStatus('কিছুক্ষণ আগেই একটি আবেদন জমা হয়েছে। অনুগ্রহ করে ৩ মিনিট পর আবার চেষ্টা করুন।', true);
                return;
            }
        } catch (e) { /* privacy mode — চেক বাদ */ }

        if (navigator.onLine === false) {
            showStatus('ইন্টারনেট সংযোগ নেই। সংযোগ দিয়ে আবার চেষ্টা করুন, অথবা ০১৮১৬-১৮৩৪৬৯ নম্বরে ফোন করুন।', true);
            return;
        }

        btn.disabled = true;
        var original = btn.textContent;
        btn.textContent = '⏳ আবেদন পাঠানো হচ্ছে...';

        try {
            var store = await ensureFirebase();
            var docId = 'APP_' + Date.now().toString(36).toUpperCase() +
                Math.random().toString(36).toUpperCase().slice(2, 6);
            var trackingRef = 'ADM-' + Date.now().toString(36).toUpperCase().slice(-5) +
                Math.random().toString(36).toUpperCase().slice(2, 6);

            await store.collection('admission_applications').doc(docId).set({
                trackingRef: trackingRef,
                name: data.name,
                fatherName: data.fatherName,
                motherName: data.motherName,
                dob: data.dob,
                jamat: data.jamat,
                session: data.session,
                guardianPhone: data.guardianPhone,
                address: data.address,
                previousMadrasa: data.previousMadrasa,
                notes: data.notes,
                status: 'pending',
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                dateString: new Date().toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })
            });

            try { localStorage.setItem(SENT_KEY, String(Date.now())); } catch (e) { /* ignore */ }

            refEl.textContent = trackingRef;
            form.hidden = true;
            successBox.hidden = false;
            successBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } catch (err) {
            var msg = 'আবেদন জমা দেওয়া যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন';
            if (err && err.code === 'permission-denied') {
                msg = 'আবেদন জমা নেওয়ার অনুমতি এখনো চালু হয়নি। অনুগ্রহ করে ০১৮১৬-১৮৩৪৬৯ নম্বরে ফোন করুন';
            }
            showStatus(msg + '।', true);
            if (window.console && console.warn) console.warn('admission apply:', err && (err.code || err.message));
        } finally {
            btn.disabled = false;
            btn.textContent = original;
        }
    }

    window.resetApplyForm = function () {
        form.reset();
        form.hidden = false;
        successBox.hidden = true;
        showStatus('');
        buildOptions();
        document.getElementById('afName').focus();
        form.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };

    buildOptions();
    form.addEventListener('submit', submit);
})();
