// ╔══════════════════════════════════════════════════════╗
// ║  🕌 জামিয়া বাবুস সালাম ওয়েবসাইট — মেইন স্ক্রিপ্ট   ║
// ║  এই ফাইলে কোনো পরিবর্তন করার প্রয়োজন নেই          ║
// ╚══════════════════════════════════════════════════════╝

document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initBackToTop();
    initScrollAnimations();
    loadPageContent();
});

// ===== ১. মেনু সিস্টেম =====
function initMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');
    const navClose = document.getElementById('navClose');

    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            navMenu.classList.add('active');
            navOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    function closeMenu() {
        navMenu.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (navClose) navClose.addEventListener('click', closeMenu);
    if (navOverlay) navOverlay.addEventListener('click', closeMenu);

    // সাবমেনু টগল
    document.querySelectorAll('.nav-section-title').forEach(function (title) {
        title.addEventListener('click', function () {
            const submenu = this.nextElementSibling;
            const isOpen = this.classList.contains('open');

            // সব বন্ধ করে এটি খুলুন
            document.querySelectorAll('.nav-section-title').forEach(function (t) {
                t.classList.remove('open');
            });
            document.querySelectorAll('.nav-submenu').forEach(function (s) {
                s.classList.remove('open');
            });

            if (!isOpen && submenu) {
                this.classList.add('open');
                submenu.classList.add('open');
            }
        });
    });

    // সাবমেনু লিংকে ক্লিক করলে মেনু বন্ধ
    document.querySelectorAll('.nav-submenu a, .nav-link-single').forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });
}

// ===== ২. ব্যাক টু টপ বাটন =====
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', function () {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== ৩. স্ক্রল অ্যানিমেশন =====
function initScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(function (el) {
        observer.observe(el);
    });
}

// ===== ৪. পেজ কন্টেন্ট লোডার =====
function loadPageContent() {
    const pageId = document.body.getAttribute('data-page');
    if (!pageId || typeof SITE_DATA === 'undefined') return;

    switch (pageId) {
        case 'home':
            loadHomePage();
            break;
        case 'notice':
            loadNotices();
            break;
        case 'biggopti':
            loadBiggoptis();
            break;
        case 'teachers':
            loadTeachers();
            break;
        case 'branches':
            loadBranches();
            break;
        case 'departments':
            loadDepartments();
            break;
        case 'management':
            loadManagement();
            break;
        case 'admission':
            loadAdmission();
            break;
        case 'admission-subjects':
            loadAdmissionSubjects();
            break;
        case 'admission-fee':
            loadAdmissionFee();
            break;
        case 'admission-rules':
            loadAdmissionRules();
            break;
        case 'syllabus':
            loadSyllabus();
            break;
        case 'class-schedule':
            loadClassSchedule();
            break;
        case 'calendar':
            loadCalendar();
            break;
        case 'rules':
            loadRules();
            break;
        case 'about':
            loadAbout();
            break;
        case 'history':
            loadHistory();
            break;
        case 'mission':
            loadMission();
            break;
        case 'foundation':
            loadFoundation();
            break;
        case 'kafela':
            loadKafela();
            break;
        case 'hawarian':
            loadHawarian();
            break;
        case 'kafela-form':
            loadKafelaForm();
            break;
        case 'result':
            loadResults();
            break;
        case 'links':
            loadLinks();
            break;
        case 'donate':
            loadDonate();
            break;
        case 'download':
            loadDownloads();
            break;
    }
}

// ===== হোম পেজ =====
function loadHomePage() {
    // ব্রেকিং নিউজ
    const marquee = document.getElementById('marqueeContent');
    if (marquee && SITE_DATA.breakingNews) {
        marquee.innerHTML = SITE_DATA.breakingNews.join(' &nbsp; ◆ &nbsp; ');
    }

    // পরিসংখ্যান
    const statsContainer = document.getElementById('statsContainer');
    if (statsContainer && SITE_DATA.stats) {
        statsContainer.innerHTML = `
            <div class="stat-item animate-on-scroll">
                <h3>${SITE_DATA.stats.students}</h3>
                <p>মোট ছাত্র</p>
            </div>
            <div class="stat-item animate-on-scroll">
                <h3>${SITE_DATA.stats.teachers}</h3>
                <p>শিক্ষকমণ্ডলী</p>
            </div>
            <div class="stat-item animate-on-scroll">
                <h3>${SITE_DATA.stats.branches}</h3>
                <p>শাখা মাদ্রাসা</p>
            </div>
            <div class="stat-item animate-on-scroll">
                <h3>${SITE_DATA.stats.years}</h3>
                <p>বছরের ঐতিহ্য</p>
            </div>
        `;
        initScrollAnimations();
    }

    // সাম্প্রতিক নোটিশ (হোম পেজে ৩টি)
    const noticePreview = document.getElementById('noticePreview');
    if (noticePreview && SITE_DATA.notices) {
        const recentNotices = SITE_DATA.notices.slice(0, 3);
        noticePreview.innerHTML = recentNotices.map(function (n) {
            return `
                <div class="notice-card ${n.type} animate-on-scroll">
                    <span class="notice-badge ${n.type}">
                        ${n.type === 'urgent' ? '🔴 জরুরি' : n.type === 'exam' ? '🟡 পরীক্ষা' : '🟢 সাধারণ'}
                    </span>
                    <h4>${n.title}</h4>
                    <p class="notice-date">📅 ${n.date}</p>
                    <p class="notice-excerpt">${n.excerpt}</p>
                </div>
            `;
        }).join('');
        initScrollAnimations();
    }
}

// ===== নোটিশ পেজ =====
function loadNotices() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.notices) return;

    container.innerHTML = SITE_DATA.notices.map(function (n, i) {
        return `
            <div class="notice-card ${n.type} animate-on-scroll" onclick="toggleNoticeDetails(${i}, 'notice')">
                <span class="notice-badge ${n.type}">
                    ${n.type === 'urgent' ? '🔴 জরুরি' : n.type === 'exam' ? '🟡 পরীক্ষা' : '🟢 সাধারণ'}
                </span>
                <h4>${n.title}</h4>
                <p class="notice-date">📅 ${n.date}</p>
                <p class="notice-excerpt">${n.excerpt}</p>
                <div id="notice-detail-${i}" style="display:none; margin-top:10px; padding-top:10px; border-top:1px dashed #ccc;">
                    <p>${n.details}</p>
                </div>
            </div>
        `;
    }).join('');
    initScrollAnimations();
}

// ===== বিজ্ঞপ্তি পেজ =====
function loadBiggoptis() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.biggoptis) return;

    container.innerHTML = SITE_DATA.biggoptis.map(function (n, i) {
        return `
            <div class="notice-card ${n.type} animate-on-scroll" onclick="toggleNoticeDetails(${i}, 'biggopti')">
                <span class="notice-badge ${n.type}">
                    ${n.type === 'urgent' ? '🔴 জরুরি' : '🟢 সাধারণ'}
                </span>
                <h4>${n.title}</h4>
                <p class="notice-date">📅 ${n.date}</p>
                <p class="notice-excerpt">${n.excerpt}</p>
                <div id="biggopti-detail-${i}" style="display:none; margin-top:10px; padding-top:10px; border-top:1px dashed #ccc;">
                    <p>${n.details}</p>
                </div>
            </div>
        `;
    }).join('');
    initScrollAnimations();
}

// নোটিশ বিস্তারিত টগল
function toggleNoticeDetails(index, type) {
    const el = document.getElementById(type + '-detail-' + index);
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
}

// ===== শিক্ষক =====
function loadTeachers() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.teachers) return;

    container.innerHTML = '<div class="card-grid">' + SITE_DATA.teachers.map(function (t) {
        return `
            <div class="info-card animate-on-scroll">
                <h4>👤 ${t.name}</h4>
                <p><strong>পদবি:</strong> ${t.designation}</p>
                <p><strong>বিভাগ:</strong> ${t.department}</p>
                <p><strong>যোগ্যতা:</strong> ${t.qualification}</p>
                <p><strong>📱</strong> ${t.phone}</p>
            </div>
        `;
    }).join('') + '</div>';
    initScrollAnimations();
}

// ===== শাখা মাদ্রাসা =====
function loadBranches() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.branches) return;

    container.innerHTML = '<div class="card-grid">' + SITE_DATA.branches.map(function (b) {
        return `
            <div class="info-card animate-on-scroll">
                <h4>🕌 ${b.name}</h4>
                <p><strong>📍 ঠিকানা:</strong> ${b.address}</p>
                <p><strong>📅 প্রতিষ্ঠাকাল:</strong> ${b.established}</p>
                <p><strong>👥 ছাত্রসংখ্যা:</strong> ${b.students}</p>
                <p><strong>👤 প্রধান:</strong> ${b.head}</p>
            </div>
        `;
    }).join('') + '</div>';
    initScrollAnimations();
}

// ===== বিভাগসমূহ =====
function loadDepartments() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.departments) return;

    container.innerHTML = '<div class="card-grid">' + SITE_DATA.departments.map(function (d) {
        return `
            <div class="info-card animate-on-scroll">
                <h4>${d.icon} ${d.name}</h4>
                <p>${d.description}</p>
                <p><strong>👥 ছাত্রসংখ্যা:</strong> ${d.students}</p>
            </div>
        `;
    }).join('') + '</div>';
    initScrollAnimations();
}

// ===== পরিচালনা পর্ষদ =====
function loadManagement() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.management) return;

    container.innerHTML = '<div class="card-grid">' + SITE_DATA.management.map(function (m) {
        return `
            <div class="info-card animate-on-scroll">
                <h4>👤 ${m.name}</h4>
                <p><strong>পদবি:</strong> ${m.designation}</p>
                <p><strong>ভূমিকা:</strong> ${m.role}</p>
            </div>
        `;
    }).join('') + '</div>';
    initScrollAnimations();
}

// ===== ভর্তি তথ্য =====
function loadAdmission() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.admission) return;

    let html = `
        <h3>📅 ভর্তির সময়কাল</h3>
        <p><strong>${SITE_DATA.admission.session}</strong></p>
        
        <h3>📋 প্রয়োজনীয় কাগজপত্র</h3>
        <ul>
            ${SITE_DATA.admission.documents.map(function(d) { return '<li>' + d + '</li>'; }).join('')}
        </ul>
        
        <h3>📞 যোগাযোগ</h3>
        <p>ভর্তি সংক্রান্ত যেকোনো তথ্যের জন্য যোগাযোগ করুন: <strong>${SITE_DATA.phone}</strong></p>
    `;
    container.innerHTML = html;
}

// ===== ভর্তি পরীক্ষার বিষয় =====
function loadAdmissionSubjects() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.admission) return;

    let html = '<table class="data-table"><thead><tr><th>বিভাগ</th><th>পরীক্ষার বিষয়সমূহ</th></tr></thead><tbody>';
    SITE_DATA.admission.examSubjects.forEach(function (s) {
        html += `<tr><td><strong>${s.department}</strong></td><td>${s.subjects}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ===== ভর্তি ফি =====
function loadAdmissionFee() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.admission) return;

    let html = '<div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>বিভাগ</th><th>ভর্তি ফি</th><th>মাসিক ফি</th><th>খোরাকী (মাসিক)</th></tr></thead><tbody>';
    SITE_DATA.admission.fees.forEach(function (f) {
        html += `<tr><td><strong>${f.department}</strong></td><td>${f.admissionFee}৳</td><td>${f.monthlyFee}৳</td><td>${f.boardingFee}৳</td></tr>`;
    });
    html += '</tbody></table></div>';
    html += '<p style="margin-top:12px; font-size:13px; color:#6C757D;">* উপরের ফি পরিবর্তনশীল। সর্বশেষ তথ্যের জন্য অফিসে যোগাযোগ করুন।</p>';
    container.innerHTML = html;
}

// ===== বিধি ও অঙ্গীকারনামা =====
function loadAdmissionRules() {
    const container = document.getElementById('contentArea');
    if (!container) return;

    let html = '<h3>📜 অঙ্গীকারনামা</h3><p>ভর্তির সময় ছাত্র ও অভিভাবককে নিম্নলিখিত অঙ্গীকার করতে হবে:</p><ol>';
    SITE_DATA.ongikar.forEach(function (r) {
        html += '<li>' + r + '</li>';
    });
    html += '</ol>';
    container.innerHTML = html;
}

// ===== সিলেবাস =====
function loadSyllabus() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.syllabus) return;

    let html = '<table class="data-table"><thead><tr><th>শ্রেণি</th><th>বিষয়সমূহ</th></tr></thead><tbody>';
    SITE_DATA.syllabus.forEach(function (s) {
        html += `<tr><td><strong>${s.className}</strong></td><td>${s.subjects}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ===== শ্রেণিসূচি =====
function loadClassSchedule() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.classSchedule) return;

    let html = '<table class="data-table"><thead><tr><th>সময়</th><th>কার্যক্রম</th></tr></thead><tbody>';
    SITE_DATA.classSchedule.forEach(function (s) {
        html += `<tr><td><strong>${s.time}</strong></td><td>${s.activity}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ===== একাডেমিক বর্ষপঞ্জি =====
function loadCalendar() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.academicCalendar) return;

    let html = '<table class="data-table"><thead><tr><th>মাস</th><th>কার্যক্রম ও ইভেন্ট</th></tr></thead><tbody>';
    SITE_DATA.academicCalendar.forEach(function (c) {
        html += `<tr><td><strong>${c.month}</strong></td><td>${c.events}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ===== বিধি ও আইন =====
function loadRules() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.rules) return;

    let html = '<h3>⚖️ মাদ্রাসার নিয়মাবলী</h3><ol>';
    SITE_DATA.rules.forEach(function (r) {
        html += '<li style="margin-bottom:10px;">' + r + '</li>';
    });
    html += '</ol>';
    container.innerHTML = html;
}

// ===== আমাদের পরিচিতি =====
function loadAbout() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.about) return;

    let html = `
        <p>${SITE_DATA.about.intro}</p>
        <h3>🌟 আমাদের বৈশিষ্ট্য</h3>
        <ul>
            ${SITE_DATA.about.features.map(function(f) { return '<li>' + f + '</li>'; }).join('')}
        </ul>
    `;
    container.innerHTML = html;
}

// ===== ইতিহাস =====
function loadHistory() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.history) return;

    const paragraphs = SITE_DATA.history.content.split('\n\n');
    container.innerHTML = paragraphs.map(function (p) {
        return '<p>' + p.trim() + '</p>';
    }).join('');
}

// ===== আদর্শ, লক্ষ্য ও উদ্দেশ্য =====
function loadMission() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.mission) return;

    let html = `
        <h3>🕌 আমাদের আদর্শ</h3>
        <p>${SITE_DATA.mission.adarsha}</p>
        
        <h3>🎯 আমাদের লক্ষ্য</h3>
        <ul>
            ${SITE_DATA.mission.lokkho.map(function(l) { return '<li>' + l + '</li>'; }).join('')}
        </ul>
        
        <h3>📌 আমাদের উদ্দেশ্য</h3>
        <ul>
            ${SITE_DATA.mission.uddeshyo.map(function(u) { return '<li>' + u + '</li>'; }).join('')}
        </ul>
    `;
    container.innerHTML = html;
}

// ===== ফাউন্ডেশন =====
function loadFoundation() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.foundation) return;

    let html = `
        <h3>🌿 ${SITE_DATA.foundation.name}</h3>
        <p>${SITE_DATA.foundation.description}</p>
        <h3>📋 কার্যক্রমসমূহ</h3>
        <ul>
            ${SITE_DATA.foundation.activities.map(function(a) { return '<li>' + a + '</li>'; }).join('')}
        </ul>
    `;
    container.innerHTML = html;
}

// ===== কাফেলা =====
function loadKafela() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.kafela) return;

    let html = `
        <h3>📖 ভূমিকা</h3>
        <p>${SITE_DATA.kafela.bhumika}</p>
        
        <h3>🤝 কাফেলা পরিচিতি</h3>
        <p>${SITE_DATA.kafela.porichiti}</p>
        
        <h3>📌 কাফেলা গঠনের প্রাসঙ্গিকতা</h3>
        <p>${SITE_DATA.kafela.prashongikota}</p>
        
        <h3>🏗️ গঠনের পদ্ধতি</h3>
        <ol>
            ${SITE_DATA.kafela.gothonPoddhoti.map(function(g) { return '<li>' + g + '</li>'; }).join('')}
        </ol>
        
        <h3>👤 আমীরগণের যোগ্যতা</h3>
        <ul>
            ${SITE_DATA.kafela.amirJoggota.map(function(a) { return '<li>' + a + '</li>'; }).join('')}
        </ul>
        
        <h3>🤲 সাথী হওয়ার যোগ্যতা</h3>
        <ul>
            ${SITE_DATA.kafela.sathiJoggota.map(function(s) { return '<li>' + s + '</li>'; }).join('')}
        </ul>
        
        <h3>⭐ কাফেলার সাথীদের বৈশিষ্ট্যসমূহ</h3>
        <ul>
            ${SITE_DATA.kafela.boishishtho.map(function(b) { return '<li>' + b + '</li>'; }).join('')}
        </ul>
    `;
    container.innerHTML = html;
}

// ===== হাওয়ারিয়ান কাফেলা =====
function loadHawarian() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.hawarian) return;

    let html = `
        <h3>🌟 ${SITE_DATA.hawarian.title}</h3>
        <p>${SITE_DATA.hawarian.description}</p>
        <h3>📋 কার্যক্রমসমূহ</h3>
        <ul>
            ${SITE_DATA.hawarian.activities.map(function(a) { return '<li>' + a + '</li>'; }).join('')}
        </ul>
    `;
    container.innerHTML = html;
}

// ===== কাফেলা সদস্য ফরম =====
function loadKafelaForm() {
    const container = document.getElementById('contentArea');
    if (!container) return;

    container.innerHTML = `
        <form id="kafelaForm" onsubmit="submitKafelaForm(event)">
            <div class="form-group">
                <label>পূর্ণ নাম *</label>
                <input type="text" name="name" required placeholder="আপনার পূর্ণ নাম লিখুন">
            </div>
            <div class="form-group">
                <label>পিতার নাম *</label>
                <input type="text" name="fatherName" required placeholder="পিতার নাম">
            </div>
            <div class="form-group">
                <label>মোবাইল নম্বর *</label>
                <input type="tel" name="phone" required placeholder="০১XXXXXXXXX">
            </div>
            <div class="form-group">
                <label>ঠিকানা *</label>
                <textarea name="address" required placeholder="গ্রাম, উপজেলা, জেলা"></textarea>
            </div>
            <div class="form-group">
                <label>শিক্ষাগত যোগ্যতা *</label>
                <input type="text" name="education" required placeholder="সর্বশেষ শিক্ষাগত যোগ্যতা">
            </div>
            <div class="form-group">
                <label>পেশা</label>
                <input type="text" name="profession" placeholder="বর্তমান পেশা">
            </div>
            <div class="form-group">
                <label>কেন কাফেলায় যোগ দিতে চান?</label>
                <textarea name="reason" placeholder="সংক্ষেপে লিখুন..."></textarea>
            </div>
            <button type="submit" class="btn-submit">📤 আবেদন জমা দিন</button>
        </form>
    `;
}

function submitKafelaForm(event) {
    event.preventDefault();
    alert('✅ আপনার আবেদন সফলভাবে জমা হয়েছে! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব ইনশাআল্লাহ।');
    event.target.reset();
}

// ===== ফলাফল =====
function loadResults() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.results) return;

    container.innerHTML = SITE_DATA.results.map(function (r) {
        return `
            <div class="notice-card animate-on-scroll">
                <h4>📊 ${r.exam}</h4>
                <p class="notice-date">📅 প্রকাশের তারিখ: ${r.publishDate}</p>
                <p><strong>স্ট্যাটাস:</strong> <span style="color: var(--primary); font-weight:600;">${r.status}</span></p>
                <a href="${r.url}" class="btn btn-green" style="display:inline-flex; margin-top:8px; font-size:13px; padding:8px 16px;">📥 ফলাফল দেখুন</a>
            </div>
        `;
    }).join('');
    initScrollAnimations();
}

// ===== প্রয়োজনীয় লিংক =====
function loadLinks() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.usefulLinks) return;

    container.innerHTML = '<div class="link-list">' + SITE_DATA.usefulLinks.map(function (l) {
        return `
            <a href="${l.url}" target="_blank" class="link-item animate-on-scroll">
                <span class="link-icon">${l.icon}</span>
                <span class="link-text">${l.title}</span>
                <span style="margin-left:auto; color:var(--gray);">↗</span>
            </a>
        `;
    }).join('') + '</div>';
    initScrollAnimations();
}

// ===== অনুদান =====
function loadDonate() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.donationMethods) return;

    let html = `
        <p style="text-align:center; margin-bottom:20px;">জামিয়ার উন্নয়নে আপনার অনুদান আল্লাহর কাছে সাদকায়ে জারিয়াহ হিসেবে গৃহীত হবে ইনশাআল্লাহ।</p>
        <div class="donate-methods">
            ${SITE_DATA.donationMethods.map(function(d) {
                return `
                    <div class="donate-card animate-on-scroll">
                        <span class="method-icon">${d.icon}</span>
                        <h4>${d.method}</h4>
                        <div class="account-no" id="acc-${d.method.replace(/\s/g, '')}">${d.accountNo}</div>
                        <p style="font-size:13px; color:var(--gray);">${d.accountType}</p>
                        <p style="font-size:12px; color:var(--gray);">${d.instruction}</p>
                        <button class="copy-btn" onclick="copyAccount('${d.accountNo}', this)">📋 কপি করুন</button>
                    </div>
                `;
            }).join('')}
        </div>
        
        <h3 style="margin-top:30px;">📞 যোগাযোগ</h3>
        <div class="info-card">
            <p><strong>📍 ঠিকানা:</strong> ${SITE_DATA.address}</p>
            <p><strong>📱 মোবাইল:</strong> <a href="tel:${SITE_DATA.phone}">${SITE_DATA.phone}</a></p>
            <p><strong>📧 ইমেইল:</strong> <a href="mailto:${SITE_DATA.email}">${SITE_DATA.email}</a></p>
            <p><strong>📘 ফেসবুক:</strong> <a href="${SITE_DATA.facebook}" target="_blank">ফেসবুক পেজ</a></p>
        </div>
    `;
    container.innerHTML = html;
    initScrollAnimations();
}

function copyAccount(text, btn) {
    navigator.clipboard.writeText(text).then(function () {
        const original = btn.innerHTML;
        btn.innerHTML = '✅ কপি হয়েছে!';
        btn.style.background = '#198754';
        setTimeout(function () {
            btn.innerHTML = original;
            btn.style.background = '';
        }, 2000);
    }).catch(function () {
        // ফলব্যাক
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        btn.innerHTML = '✅ কপি হয়েছে!';
        setTimeout(function () { btn.innerHTML = '📋 কপি করুন'; }, 2000);
    });
}

// ===== ডাউনলোড =====
function loadDownloads() {
    const container = document.getElementById('contentArea');
    if (!container || !SITE_DATA.downloads) return;

    container.innerHTML = SITE_DATA.downloads.map(function (d) {
        return `
            <div class="download-card animate-on-scroll">
                <span class="file-icon">${d.type === 'PDF' ? '📄' : '📁'}</span>
                <div class="file-info">
                    <h4>${d.name}</h4>
                    <p>${d.type} • ${d.size}</p>
                </div>
                <a href="${d.url}" class="btn-download" download>📥 ডাউনলোড</a>
            </div>
        `;
    }).join('');
    initScrollAnimations();
}