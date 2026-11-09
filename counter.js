/* ==========================================================================
   ফাইল লোকেশন: babussalam-website/counter.js
   বিবরণ: হোমপেজের ভিজিটর কাউন্টার — আজকের ও সর্বমোট দর্শনার্থীর সংখ্যা।

   • হালকা রাখতে Firebase SDK পেজ লোড শেষ হওয়ার পরে চালু হয় (প্রথম রেন্ডার
     ধীর হয় না)।
   • প্রতিটি ব্রাউজার দিনে একবার গণনা হয় (localStorage-এ দিনের চিহ্ন রাখা হয়)।
   • ইন্টারনেট/নিয়মের সমস্যা হলে ভুয়া সংখ্যা দেখায় না — ড্যাশ দেখিয়ে চুপচাপ
     থেমে যায়।
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

    var todayEl = document.getElementById('vsToday');
    var totalEl = document.getElementById('vsTotal');
    var noteEl = document.getElementById('vsNote');
    var section = document.getElementById('visitorStats');
    if (!todayEl || !totalEl || !section) return;

    var bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

    function toBn(value) {
        return String(value).replace(/\d/g, function (d) { return bnDigits[d]; });
    }

    function dayKey() {
        var d = new Date();
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var dd = String(d.getDate()).padStart(2, '0');
        return d.getFullYear() + '-' + mm + '-' + dd;
    }

    function showNumbers(today, total) {
        todayEl.textContent = toBn(Number(today).toLocaleString('en-US'));
        totalEl.textContent = toBn(Number(total).toLocaleString('en-US'));
        section.classList.add('is-ready');
    }

    function giveUp() {
        todayEl.textContent = '—';
        totalEl.textContent = '—';
        if (noteEl) noteEl.textContent = 'পরিসংখ্যান এখন লোড করা যাচ্ছে না।';
    }

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = resolve;
            s.onerror = function () { reject(new Error('load failed')); };
            document.head.appendChild(s);
        });
    }

    async function start() {
        if (navigator.onLine === false) { giveUp(); return; }

        await loadScript(SDK + 'firebase-app-compat.js');
        await loadScript(SDK + 'firebase-firestore-compat.js');
        if (!window.firebase) throw new Error('firebase unavailable');
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

        var db = firebase.firestore();
        var inc = firebase.firestore.FieldValue.increment(1);
        var totalRef = db.collection('site_stats').doc('total');
        var dayRef = db.collection('site_stats').doc('daily_' + dayKey());

        var alreadyCounted = false;
        try { alreadyCounted = localStorage.getItem('bs_visit_day') === dayKey(); } catch (e) { /* privacy mode */ }

        if (!alreadyCounted) {
            await Promise.all([
                totalRef.set({ count: inc, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }),
                dayRef.set({ count: inc, day: dayKey() }, { merge: true })
            ]);
            try { localStorage.setItem('bs_visit_day', dayKey()); } catch (e) { /* ignore */ }
        }

        var snaps = await Promise.all([totalRef.get(), dayRef.get()]);
        var total = (snaps[0].data() || {}).count || 0;
        var today = (snaps[1].data() || {}).count || 0;
        showNumbers(today, total);
    }

    function schedule() {
        var run = function () {
            start().catch(function (err) {
                if (window.console && console.warn) console.warn('visitor counter:', err && err.message);
                giveUp();
            });
        };
        if ('requestIdleCallback' in window) {
            requestIdleCallback(run, { timeout: 2500 });
        } else {
            setTimeout(run, 1200);
        }
    }

    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
})();
