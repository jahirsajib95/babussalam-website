/* ═══════════════════════════════════════════
   জামিয়া বাবুস সালাম — মেইন স্ক্রিপ্ট (আপডেটেড)
   ⚠️ এই ফাইলে কোনো পরিবর্তন করবেন না
   ═══════════════════════════════════════════ */

// পেজটি pages/ ফোল্ডারে আছে কিনা বের করা
function getBasePath() {
    return window.location.pathname.indexOf('/pages/') !== -1 ? '../' : './';
}

var BASE = getBasePath();

document.addEventListener('DOMContentLoaded', function () {
    // ১. সব পেজে অটোমেটিক ফেভিকন (ট্যাবের লোগো) সেট করা
    setAutoFavicon();

    // ২. হেডার ও ফুটার লোড করা
    loadPart('header-placeholder', BASE + 'includes/header.html', initMenu);
    loadPart('footer-placeholder', BASE + 'includes/footer.html', initBackToTop);
});

// 🌟 অটো-ফেভিকন সেট করার ফাংশন
function setAutoFavicon() {
    var favicon = document.querySelector("link[rel*='icon']");
    if (!favicon) {
        favicon = document.createElement('link');
        favicon.setAttribute('rel', 'shortcut icon');
        document.head.appendChild(favicon);
    }
    favicon.setAttribute('type', 'image/png');
    // BASE পাথ অনুযায়ী অটোমেটিক সঠিক লোগো নিয়ে নেবে (যেমন: ./images/logo.png বা ../images/logo.png)
    favicon.setAttribute('href', BASE + 'images/logo.png'); 
}

// হেডার/ফুটার লোড করার ফাংশন
function loadPart(id, file, callback) {
    var box = document.getElementById(id);
    if (!box) return;

    fetch(file)
        .then(function (res) {
            if (!res.ok) throw new Error('not found');
            return res.text();
        })
        .then(function (html) {
            box.innerHTML = html.split('{{BASE}}').join(BASE);
            if (callback) callback();
        })
        .catch(function () {
            box.innerHTML =
                '<div style="background:#FFF3CD;color:#856404;padding:14px;text-align:center;font-size:14px;">' +
                '⚠️ মেনু লোড হয়নি। ফাইলটি <b>Live Server</b> দিয়ে চালান।' +
                '</div>';
        });
}

// মেনু সিস্টেম
function initMenu() {
    var toggle = document.getElementById('menuToggle');
    var menu = document.getElementById('navMenu');
    var overlay = document.getElementById('navOverlay');
    var close = document.getElementById('navClose');

    function openMenu() {
        if (menu) menu.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        if (menu) menu.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (toggle) toggle.addEventListener('click', openMenu);
    if (close) close.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    // সাবমেনু খোলা-বন্ধ
    var titles = document.querySelectorAll('.nav-section-title');
    for (var i = 0; i < titles.length; i++) {
        titles[i].addEventListener('click', function () {
            var sub = this.nextElementSibling;
            var wasOpen = this.classList.contains('open');

            var allTitles = document.querySelectorAll('.nav-section-title');
            var allSubs = document.querySelectorAll('.nav-submenu');
            for (var j = 0; j < allTitles.length; j++) allTitles[j].classList.remove('open');
            for (var k = 0; k < allSubs.length; k++) allSubs[k].classList.remove('open');

            if (!wasOpen && sub) {
                this.classList.add('open');
                sub.classList.add('open');
            }
        });
    }

    // লিংকে ক্লিক করলে মেনু বন্ধ
    var links = document.querySelectorAll('.nav-submenu a, .nav-link-single');
    for (var m = 0; m < links.length; m++) {
        links[m].addEventListener('click', closeMenu);
    }

    highlightActive();
}

// বর্তমান পেজ হাইলাইট
function highlightActive() {
    var current = window.location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.nav-menu a');

    for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href') || '';
        if (href.split('/').pop() === current) {
            links[i].style.background = '#C8E6C9';
            links[i].style.color = '#0F5132';
            links[i].style.fontWeight = '700';

            var sub = links[i].closest ? links[i].closest('.nav-submenu') : null;
            if (sub) {
                sub.classList.add('open');
                if (sub.previousElementSibling) {
                    sub.previousElementSibling.classList.add('open');
                }
            }
        }
    }
}

// ব্যাক টু টপ
function initBackToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', function () {
        if (window.scrollY > 300) btn.classList.add('visible');
        else btn.classList.remove('visible');
    });

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// একাউন্ট নম্বর কপি (অনুদান পেজে ব্যবহৃত)
function copyText(text, btn) {
    var done = function () {
        var old = btn.innerHTML;
        btn.innerHTML = '✅ কপি হয়েছে!';
        btn.style.background = '#198754';
        setTimeout(function () {
            btn.innerHTML = old;
            btn.style.background = '';
        }, 2000);
    };

    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallback(); });
    } else {
        fallback();
    }

    function fallback() {
        var inp = document.createElement('input');
        inp.value = text;
        document.body.appendChild(inp);
        inp.select();
        document.execCommand('copy');
        document.body.removeChild(inp);
        done();
    }
}

// নোটিশ ফিল্টার (নোটিশ পেজে ব্যবহৃত)
function filterNotice(type, btn) {
    var tabs = document.querySelectorAll('.notice-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
    btn.classList.add('active');

    var cards = document.querySelectorAll('[data-notice-type]');
    for (var j = 0; j < cards.length; j++) {
        if (type === 'all' || cards[j].getAttribute('data-notice-type') === type) {
            cards[j].style.display = 'block';
        } else {
            cards[j].style.display = 'none';
        }
    }
}

// চ্যাটবট স্ক্রিপ্ট অটোমেটিক ইনজেক্ট করা
const chatbotScript = document.createElement("script");
chatbotScript.src = BASE + "chatbot.js";
document.body.appendChild(chatbotScript);