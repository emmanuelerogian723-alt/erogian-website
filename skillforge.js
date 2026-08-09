/* ===== Config ===== */
var SKILLFORGE_URL = 'https://superagent-55bc0d3a.base44.app/functions/erogianSkillForge';
var ERGIO_ENGINES_URL = 'https://ergio-engines.onrender.com';
var ENGINES_PROXY = '/api/engines-proxy';
var _uploadedFiles = []; // track uploaded files
var UPLOAD_URL = 'https://superagent-55bc0d3a.base44.app/functions/erogianUpload';
var VIDEO_UPLOAD_URL = 'https://superagent-55bc0d3a.base44.app/functions/erogianVideoUpload';
var ADMIN_KEY = 'erogian_skillforge_admin_2026';
var UPLOAD_ADMIN_KEY = 'erogian_blog_admin_2026';
var WHATSAPP_NUMBER = '2347045560291';
var CERTIFICATE_TEMPLATE = 'https://media.base44.com/images/public/6a37c01bd442f2d055bc0d3a/a13447e10_generated_image.png';
var allCourses = [];
var currentFilter = 'all';
var uploadedThumbUrl = '';
var uploadedVideoFileUrl = '';
var cfQuizData = [];
var cfLessons = [];
var activeLessonIndex = 0;
var currentEnrollment = null;

function esc(s) { return (s||'').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ===== Progress Tracking (localStorage) ===== */
function getProgress() {
  try { return JSON.parse(localStorage.getItem('sf_progress') || '{}'); } catch(e) { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem('sf_progress', JSON.stringify(p)); } catch(e) {}
}
function getCourseProgress(slug) {
  var p = getProgress();
  return p[slug] || { completedLessons: [], quizPassed: false, xp: 0 };
}
function markLessonComplete(slug, lessonIndex) {
  var p = getProgress();
  if (!p[slug]) p[slug] = { completedLessons: [], quizPassed: false, xp: 0 };
  if (p[slug].completedLessons.indexOf(lessonIndex) === -1) {
    p[slug].completedLessons.push(lessonIndex);
    p[slug].xp = (p[slug].xp || 0) + 50;
    saveProgress(p);
    updateStreak();
  }
  return p[slug];
}
function getTotalXP() {
  var p = getProgress();
  var total = 0;
  for (var slug in p) total += (p[slug].xp || 0);
  return total;
}
function getCompletedCourses() {
  var p = getProgress();
  var count = 0;
  for (var slug in p) {
    if (p[slug].quizPassed) count++;
  }
  return count;
}

/* ===== Streak Tracking ===== */
function updateStreak() {
  var today = new Date().toDateString();
  var streak = JSON.parse(localStorage.getItem('sf_streak') || '{"days":0,"lastDay":""}');
  if (streak.lastDay !== today) {
    var yesterday = new Date(Date.now() - 86400000).toDateString();
    if (streak.lastDay === yesterday) streak.days++;
    else streak.days = 1;
    streak.lastDay = today;
    localStorage.setItem('sf_streak', JSON.stringify(streak));
  }
  return streak.days;
}
function getStreak() {
  return JSON.parse(localStorage.getItem('sf_streak') || '{"days":0,"lastDay":""}').days;
}

/* ===== Achievement System ===== */
function getAchievements() {
  var xp = getTotalXP();
  var completed = getCompletedCourses();
  var streak = getStreak();
  var achievements = [];
  if (xp >= 50) achievements.push({ icon: '🌱', title: 'First Steps', desc: 'Completed your first lesson' });
  if (streak >= 3) achievements.push({ icon: '🔥', title: '3-Day Streak', desc: 'Learned 3 days in a row' });
  if (streak >= 7) achievements.push({ icon: '⚡', title: 'Week Warrior', desc: '7-day learning streak' });
  if (completed >= 1) achievements.push({ icon: '🎓', title: 'Certified', desc: 'Passed your first quiz' });
  if (completed >= 3) achievements.push({ icon: '🏆', title: 'Overachiever', desc: 'Completed 3 courses' });
  if (xp >= 500) achievements.push({ icon: '💎', title: 'Diamond Mind', desc: 'Earned 500+ XP' });
  if (xp >= 1000) achievements.push({ icon: '👑', title: 'Scholar', desc: 'Earned 1000+ XP' });
  return achievements;
}

/* ===== Level System ===== */
function getLevel() {
  var xp = getTotalXP();
  var level = Math.floor(xp / 200) + 1;
  var nextLevelXP = level * 200;
  var progress = (xp % 200) / 200 * 100;
  return { level: level, xp: xp, nextXP: nextLevelXP, progress: progress, remaining: nextLevelXP - xp };
}

function toEmbedUrl(url) {
  if (!url) return '';
  var yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtube\.com\/v\/|youtube\.com\/user\/[^/]+\/[^/]+\/|youtube\.com\/c\/[^/]+\/[^/]+\/)([\w-]+)/);
  if (yt) return 'https://www.youtube.com/embed/' + yt[1] + '?rel=0&modestbranding=1';
  var vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return 'https://player.vimeo.com/video/' + vimeo[1];
  return url;
}
function getLessonPreviewHTML(url, idx) {
  if (!url || url.trim() === '') return '';
  var embed = toEmbedUrl(url);
  if (!embed || embed === url) return '<div style="padding:8px;background:rgba(255,255,255,.04);border-radius:8px;font-size:12px;color:#9ca3af;">ℹ️ Preview only available for YouTube / Vimeo links</div>';
  return '<div style="position:relative;padding-bottom:56.25%;height:0;border-radius:10px;overflow:hidden;background:#000;"><iframe src="'+embed+'" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div><div style="font-size:11px;color:#34d399;padding:4px 0;">✅ Preview loaded — looks good!</div>';
}
function updateLessonPreview(idx, url) {
  var el = document.getElementById('lesson-url-preview-'+idx);
  if (el) el.innerHTML = getLessonPreviewHTML(url, idx);
}

async function loadCourses() {
  var grid = document.getElementById('course-grid');
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'list' }) });
    var data = await res.json();
    allCourses = data.courses || [];
    renderChips();
    renderGrid();
    updateStats();
  } catch (e) {
    grid.innerHTML = '<div class="glass rounded-2xl p-6 card-float col-span-3"><div class="text-sm text-gray-500">Could not load classes right now. Try refreshing.</div></div>';
  }
}

function updateStats() {
  var statsEl = document.getElementById('sf-stats');
  if (!statsEl) return;
  var totalCourses = allCourses.length;
  var totalEnrolled = allCourses.reduce(function(sum, c) { return sum + (c.enrolled_count || 0); }, 0);
  var freeCount = allCourses.filter(function(c) { return c.is_free; }).length;
  var paidCount = totalCourses - freeCount;
  if (statsEl) {
    statsEl.innerHTML =
      '<div style="text-align:center;"><div style="font-size:1.8rem;font-weight:800;font-family:\'Space Grotesk\',sans-serif;" class="grad-text">'+totalCourses+'</div><div style="font-size:12px;color:#6b7280;margin-top:4px;">Courses available</div></div>' +
      '<div style="text-align:center;"><div style="font-size:1.8rem;font-weight:800;font-family:\'Space Grotesk\',sans-serif;color:#a78bfa;">'+totalEnrolled+'+</div><div style="font-size:12px;color:#6b7280;margin-top:4px;">Students enrolled</div></div>' +
      '<div style="text-align:center;"><div style="font-size:1.8rem;font-weight:800;font-family:\'Space Grotesk\',sans-serif;color:#34d399;">'+freeCount+' Free</div><div style="font-size:12px;color:#6b7280;margin-top:4px;">'+paidCount+' premium tracks</div></div>' +
      '<div style="text-align:center;"><div style="font-size:1.8rem;font-weight:800;font-family:\'Space Grotesk\',sans-serif;color:#60a5fa;">🎓</div><div style="font-size:12px;color:#6b7280;margin-top:4px;">Certificates on completion</div></div>';
  }
  // Update streak/level display
  var streakEl = document.getElementById('sf-streak-display');
  if (streakEl) {
    var streak = getStreak();
    var lvl = getLevel();
    streakEl.innerHTML = '<div style="display:flex;align-items:center;gap:8px;justify-content:center;flex-wrap:wrap;">' +
      '<span style="background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.25);padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;color:#fbbf24;">🔥 '+streak+'-day streak</span>' +
      '<span style="background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.25);padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;color:#a78bfa;">⭐ Level '+lvl.level+' · '+lvl.xp+' XP</span>' +
      '</div>';
  }
}

function renderChips() {
  var cats = ['all'].concat(Array.from(new Set(allCourses.map(function(c){ return c.category; }))));
  var el = document.getElementById('filter-chips');
  if (!el) return;
  el.innerHTML = cats.map(function(c) {
    return '<button class="chip ' + (c === currentFilter ? 'chip-active' : '') + '" onclick="filterCourses(\'' + esc(c) + '\')">' + (c === 'all' ? 'All Classes' : esc(c)) + '</button>';
  }).join('');
}

function filterCourses(cat) { currentFilter = cat; renderChips(); renderGrid(); }

function renderGrid() {
  var grid = document.getElementById('course-grid');
  if (!grid) return;
  var list = currentFilter === 'all' ? allCourses : allCourses.filter(function(c){ return c.category === currentFilter; });
  if (!list.length) { grid.innerHTML = '<div class="glass rounded-2xl p-6 card-float col-span-3"><div class="text-sm text-gray-500">New classes coming soon.</div></div>'; return; }
  grid.innerHTML = list.map(function(c) {
    var thumb = c.thumbnail ? '<img src="'+esc(c.thumbnail)+'" class="course-thumb" loading="lazy" style="width:100%;aspect-ratio:16/9;object-fit:cover;object-position:center;display:block;">' : '<div class="course-thumb-placeholder" style="width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,rgba(139,92,246,.25),rgba(59,130,246,.2));display:flex;align-items:center;justify-content:center;font-size:3rem;">🎬</div>';
    var badge = c.is_free ? '<span class="badge-free text-xs px-3 py-1 rounded-full font-semibold">FREE</span>' : '<span class="badge-pro text-xs px-3 py-1 rounded-full font-semibold">₦'+Number(c.price_ngn||0).toLocaleString()+'</span>';
    var lock = c.is_free ? '' : '<div class="lock-overlay"><div class="text-3xl">🔒</div><div class="text-xs text-gray-300">Premium Class</div></div>';
    var hasQuiz = (function(){ try { return JSON.parse(c.quiz||'[]').length > 0; } catch(e){ return false; } })();
    var lessons = getLessons(c);
    var lessonCount = lessons.length;
    var progress = getCourseProgress(c.slug);
    var progressPct = lessons.length ? Math.round(progress.completedLessons.length / lessons.length * 100) : 0;
    var progressBar = progressPct > 0 ? '<div class="progress-bar mt-2"><div class="progress-fill" style="width:'+progressPct+'%"></div></div><div style="font-size:10px;color:#6b7280;margin-top:3px;">'+progressPct+'% complete</div>' : '';
    var stars = '<span style="color:#fbbf24;font-size:11px;">★★★★★</span>';
    return '<div class="glass rounded-2xl overflow-hidden card-float cursor-pointer group" onclick="openCourse(\''+esc(c.slug)+'\')">' +
      '<div class="relative">' + thumb + lock + '</div>' +
      '<div class="p-5">' +
      '<div class="flex items-center justify-between mb-2"><span class="text-xs text-purple-300">'+esc(c.category)+' · '+esc(c.level)+'</span>'+badge+'</div>' +
      '<div class="font-semibold mb-2" style="font-size:14px;line-height:1.4;">'+esc(c.title)+'</div>' +
      '<div class="text-xs text-gray-500 mb-2" style="line-height:1.5;">'+esc((c.description||'').slice(0,100))+'...</div>' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">' +
        '<span style="font-size:11px;color:#9ca3af;">👨‍🏫 '+esc(c.instructor||'EROGIAN')+'</span>' +
        '<span style="font-size:11px;color:#6b7280;">·</span>' +
        '<span style="font-size:11px;color:#9ca3af;">⏱ '+esc(c.duration||'')+'</span>' +
        '<span style="font-size:11px;color:#6b7280;">·</span>' +
        '<span style="font-size:11px;color:#9ca3af;">📖 '+lessonCount+' lesson'+(lessonCount>1?'s':'')+'</span>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
        stars +
        '<span style="font-size:11px;color:#6b7280;">'+(c.enrolled_count||0)+' enrolled</span>' +
        (hasQuiz ? '<span style="font-size:11px;color:#8b5cf6;">· 🧠 Quiz · 🎓 Certificate</span>' : '') +
      '</div>' +
      progressBar +
      '</div></div>';
  }).join('');
}

function openCourse(slug) {
  var course = allCourses.find(function(c){ return c.slug === slug; });
  if (!course) return;
  document.getElementById('enroll-title').textContent = course.title;
  var body = document.getElementById('enroll-body');
  var lessons = getLessons(course);
  var hasQuiz = (function(){ try { return JSON.parse(course.quiz||'[]').length > 0; } catch(e){ return false; } })();
  var outcomes = course.outcomes ? course.outcomes : '';
  var outcomesHTML = outcomes ? '<div class="glass rounded-xl p-4 mb-4"><div style="font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:8px;">🎯 What You\'ll Learn</div><div style="font-size:12px;color:#9ca3af;line-height:1.6;">'+esc(outcomes)+'</div></div>' : '';
  body.innerHTML =
    '<p class="text-sm text-gray-400 mb-3">'+esc(course.description)+'</p>' +
    outcomesHTML +
    '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">' +
      '<span style="font-size:11px;color:#9ca3af;">👨‍🏫 '+esc(course.instructor||'EROGIAN')+'</span>' +
      '<span style="font-size:11px;color:#9ca3af;">⏱ '+esc(course.duration||'')+'</span>' +
      '<span style="font-size:11px;color:#9ca3af;">📖 '+lessons.length+' lessons</span>' +
      (hasQuiz ? '<span style="font-size:11px;color:#a78bfa;">🧠 Quiz + 🎓 Certificate</span>' : '') +
    '</div>' +
    (course.is_free ? '' : '<div class="glass rounded-xl p-4 mb-4 text-center"><div class="text-2xl font-bold grad-text">₦'+Number(course.price_ngn||0).toLocaleString()+'</div><div class="text-xs text-gray-500">One-time payment · Lifetime access + Certificate</div></div>') +
    '<div class="space-y-3 mb-4">' +
    '<input id="ef-name" placeholder="Your full name (for your certificate)" class="w-full rounded-xl px-4 py-3 text-sm">' +
    '<input id="ef-email" type="email" placeholder="Your email address" class="w-full rounded-xl px-4 py-3 text-sm">' +
    '<input id="ef-phone" placeholder="WhatsApp number" class="w-full rounded-xl px-4 py-3 text-sm">' +
    '</div>' +
    '<button onclick="'+(course.is_free ? 'startFreeClass' : 'startPaidClass')+'(\''+esc(slug)+'\')" class="w-full py-3 rounded-full font-semibold" style="background:linear-gradient(90deg,#8b5cf6,#3b82f6)">'+(course.is_free ? 'Start Free Class →' : 'Continue →')+'</button>';
  document.getElementById('enroll-modal').classList.add('active');
}

function validateEnrollForm() {
  var name = document.getElementById('ef-name').value.trim();
  var email = document.getElementById('ef-email').value.trim();
  var phone = document.getElementById('ef-phone').value.trim();
  if (!name || !email) { alert('Please enter your name and email to continue.'); return null; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { alert('Please enter a valid email address.'); return null; }
  return { name: name, email: email, phone: phone };
}

async function startPaidClass(slug) {
  var info = validateEnrollForm();
  if (!info) return;
  var course = allCourses.find(function(c){ return c.slug === slug; });
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'enroll', name:info.name, email:info.email, phone:info.phone, course_slug:slug, is_free:false, amount_ngn: course.price_ngn }) });
    var data = await res.json();
    currentEnrollment = { id: data.enrollment ? data.enrollment.id : null, name: info.name, email: info.email, course: course };
  } catch(e) {}
  var msg = encodeURIComponent('Hi! I want to enroll in "'+course.title+'" (₦'+Number(course.price_ngn||0).toLocaleString()+') on SkillForge. My name: '+info.name+', email: '+info.email);
  var body = document.getElementById('enroll-body');
  body.innerHTML =
    '<div class="text-center py-6">' +
    '<div style="font-size:3rem;margin-bottom:12px;">💰</div>' +
    '<h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px;">Complete Your Payment</h3>' +
    '<div class="glass rounded-xl p-4 mb-4 text-center"><div class="text-2xl font-bold grad-text">₦'+Number(course.price_ngn||0).toLocaleString()+'</div><div class="text-xs text-gray-500">One-time payment · Lifetime access + Certificate</div></div>' +
    '<a href="https://wa.me/'+WHATSAPP_NUMBER+'?text='+msg+'" target="_blank" class="w-full py-3 rounded-full font-semibold inline-block text-center" style="background:#25D366;color:#fff;text-decoration:none;margin-bottom:8px;">💬 Pay via WhatsApp →</a>' +
    '<div style="font-size:11px;color:#6b7280;">Send the WhatsApp message and we\'ll confirm your payment and unlock the class immediately.</div>' +
    '<button onclick="startFreeClass(\''+esc(slug)+'\')" style="width:100%;padding:10px;margin-top:12px;background:none;border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#9ca3af;font-size:12px;cursor:pointer;">Preview first lesson free →</button>' +
    '</div>';
}

function startFreeClass(slug) {
  var info = validateEnrollForm();
  if (!info) return;
  var course = allCourses.find(function(c){ return c.slug === slug; });
  fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'enroll', name:info.name, email:info.email, phone:info.phone, course_slug:slug, is_free:true }) })
    .then(function(r){ return r.json(); })
    .then(function(data){ var enrollmentId = data.enrollment ? data.enrollment.id : 'guest'; })
    .catch(function(e){});
  currentEnrollment = { id: 'guest', name: info.name, email: info.email, course: course };
  document.getElementById('enroll-modal').classList.remove('active');
  renderVideoStep(course);
}

function getLessons(course) {
  var lessons = [];
  try { lessons = JSON.parse(course.lessons || '[]'); } catch(e) {}
  if (lessons.length === 1 && typeof lessons[0] === 'string') {
    // lessons field is a number string — generate placeholder lessons
    try { var count = parseInt(course.lessons) || 1; } catch(e) { var count = 1; }
    // Actually check if it's a number or array
    if (typeof course.lessons === 'string' && !course.lessons.startsWith('[')) {
      var num = parseInt(course.lessons) || 1;
      lessons = [];
      for (var i = 0; i < Math.min(num, 1); i++) {
        lessons.push({ title: course.title, video_url: course.video_url, video_file_url: course.video_file_url });
      }
    }
  }
  if (!lessons.length && (course.video_url || course.video_file_url)) {
    lessons = [{ title: course.title, video_url: course.video_url, video_file_url: course.video_file_url }];
  }
  return lessons;
}

function renderVideoStep(course, lessonIdx) {
  activeLessonIndex = lessonIdx || 0;
  var modal = document.getElementById('enroll-modal');
  if (modal) modal.classList.remove('active');
  var lessons = getLessons(course);
  if (!lessons.length) {
    var body = document.getElementById('enroll-body') || document.getElementById('course-modal-body');
    if (body) body.innerHTML = '<div class="glass rounded-xl p-6 text-center text-sm text-gray-400">This class video is being added soon! We\'ll notify you on WhatsApp the moment it\'s live. <a href="https://wa.me/'+WHATSAPP_NUMBER+'" target="_blank" class="text-purple-300 underline block mt-2">Message us</a></div>';
    return;
  }
  var lesson = lessons[activeLessonIndex] || lessons[0];

  // Build player
  var player = '';
  if (lesson.video_file_url) {
    player = '<div class="rounded-xl overflow-hidden mb-3"><video src="'+esc(lesson.video_file_url)+'" controls class="w-full"></video></div>';
  } else {
    var embed = toEmbedUrl(lesson.video_url);
    if (embed) player = '<div class="aspect-video rounded-xl overflow-hidden mb-3"><iframe src="'+esc(embed)+'" class="w-full h-full" allowfullscreen frameborder="0"></iframe></div>';
    else player = '<div class="glass rounded-xl p-6 text-center text-sm text-gray-400">Video coming soon.</div>';
  }

  // Lesson navigation — Coursera style sidebar
  var lessonNav = '';
  if (lessons.length > 1) {
    var progress = getCourseProgress(course.slug);
    var completedHTML = lessons.map(function(l, i) {
      var isCompleted = progress.completedLessons.indexOf(i) !== -1;
      var isActive = i === activeLessonIndex;
      var icon = isCompleted ? '✅' : (isActive ? '▶️' : '⭕');
      var cls = isActive ? 'chip-active' : '';
      return '<button onclick="renderVideoStep(currentEnrollment.course, ' + i + ')" class="chip ' + cls + '" style="text-align:left;display:flex;align-items:center;gap:8px;width:100%;justify-content:flex-start;">' + icon + ' ' + (i+1) + '. ' + esc((l.title || ('Lesson ' + (i+1))).slice(0, 35)) + '</button>';
    }).join('');
    
    var progressPct = Math.round(progress.completedLessons.length / lessons.length * 100);
    lessonNav = '<div class="glass rounded-xl p-4 mb-4">' +
      '<div style="font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:10px;">📚 Course Content ('+lessons.length+' lessons)</div>' +
      '<div class="progress-bar mb-2"><div class="progress-fill" style="width:'+progressPct+'%"></div></div>' +
      '<div style="font-size:10px;color:#6b7280;margin-bottom:12px;">'+progressPct+'% complete · '+progress.completedLessons.length+' of '+lessons.length+' done</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto;">' + completedHTML + '</div>' +
      '</div>';
  }

  // Quiz button or completion
  var quiz = []; try { quiz = JSON.parse(course.quiz || '[]'); } catch(e) {}
  var progress = getCourseProgress(course.slug);
  var isLessonCompleted = progress.completedLessons.indexOf(activeLessonIndex) !== -1;
  var markCompleteBtn = lessons.length > 1 ?
    '<button onclick="markCompleteAndNext(\''+esc(course.slug)+'\','+activeLessonIndex+','+lessons.length+')" class="w-full py-3 rounded-full font-semibold mb-3" style="background:'+(isLessonCompleted ? 'rgba(34,197,94,.15);color:#4ade80;border:1px solid rgba(34,197,94,.3);' : 'linear-gradient(90deg,#8b5cf6,#3b82f6);')+'">'+(isLessonCompleted ? '✅ Completed — Next Lesson →' : 'Mark as Complete & Continue →')+'</button>' : '';
  
  var quizBtn = quiz.length ? '<button onclick="showQuiz()" class="w-full py-3 rounded-full font-semibold" style="background:linear-gradient(90deg,#8b5cf6,#3b82f6)">✅ Take the Final Quiz (' + quiz.length + ' questions) →</button>' :
    '<div class="text-center text-xs text-gray-500">Enjoy the class! Have questions? <a href="https://wa.me/'+WHATSAPP_NUMBER+'" target="_blank" class="text-purple-300 underline">Message us on WhatsApp</a>.</div>';

  // What you'll learn in this lesson
  var lessonInfo = '<div class="glass rounded-xl p-4 mb-3"><div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:6px;">📖 '+esc(lesson.title || ('Lesson ' + (activeLessonIndex+1)))+'</div>' +
    '<div style="font-size:11px;color:#6b7280;">Lesson '+(activeLessonIndex+1)+' of '+lessons.length+' · '+esc(course.instructor||'EROGIAN')+'</div></div>';

  var body = document.getElementById('enroll-body');
  if (!body) return;
  body.innerHTML = lessonInfo + lessonNav + player + markCompleteBtn + quizBtn;
  document.getElementById('enroll-modal').classList.add('active');
  
  // Scroll to top
  document.getElementById('enroll-modal').scrollTop = 0;
}

function markCompleteAndNext(slug, lessonIdx, totalLessons) {
  var progress = markLessonComplete(slug, lessonIdx);
  if (lessonIdx < totalLessons - 1) {
    renderVideoStep(currentEnrollment.course, lessonIdx + 1);
  } else {
    // All lessons done — prompt quiz
    var body = document.getElementById('enroll-body');
    body.innerHTML = '<div class="text-center py-8">' +
      '<div style="font-size:3rem;margin-bottom:12px;">🎉</div>' +
      '<h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px;">All Lessons Complete!</h3>' +
      '<div style="font-size:13px;color:#9ca3af;margin-bottom:16px;">You\'ve finished all '+totalLessons+' lessons. +'+(totalLessons*50)+' XP earned!</div>' +
      '<button onclick="showQuiz()" class="w-full py-3 rounded-full font-semibold" style="background:linear-gradient(90deg,#8b5cf6,#3b82f6)">🧠 Take the Final Quiz to Get Your Certificate →</button>' +
      '</div>';
    updateStats();
  }
}

function showQuiz() {
  var course = currentEnrollment.course;
  var quiz = []; try { quiz = JSON.parse(course.quiz || '[]'); } catch(e) {}
  if (!quiz.length) { alert('No quiz available for this course.'); return; }
  var body = document.getElementById('enroll-body');
  body.innerHTML = '<div style="font-size:14px;font-weight:700;margin-bottom:8px;">🧠 Final Quiz — '+esc(course.title)+'</div>' +
    '<div class="text-sm text-gray-400 mb-4">Answer these to confirm you understood the lessons. You need 70% to pass and unlock your certificate.</div>' +
    quiz.map(function(q, i) {
      var qText = q.question || q.q || '';
      var opts = q.options || [];
      return '<div class="glass rounded-xl p-4 mb-3">' +
        '<div style="font-size:13px;font-weight:600;margin-bottom:10px;">' + (i+1) + '. ' + esc(qText) + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:6px;">' +
        opts.map(function(opt, oi) {
          return '<label class="flex items-center gap-2 text-sm text-gray-300 mb-1 cursor-pointer" style="padding:8px 12px;border-radius:8px;background:rgba(255,255,255,.03);transition:background .2s;" onmouseover="this.style.background=\'rgba(139,92,246,.08)\'" onmouseout="this.style.background=\'rgba(255,255,255,.03)\'"><input type="radio" name="quiz-q'+i+'" value="'+oi+'" style="accent-color:#8b5cf6;"> '+esc(opt)+'</label>';
        }).join('') +
        '</div></div>';
    }).join('') +
    '<button onclick="submitQuiz()" class="w-full py-3 rounded-full font-semibold mt-3" style="background:linear-gradient(90deg,#8b5cf6,#3b82f6)">Submit Quiz →</button>';
  document.getElementById('enroll-modal').scrollTop = 0;
}

async function submitQuiz() {
  var course = currentEnrollment.course;
  var quiz = []; try { quiz = JSON.parse(course.quiz || '[]'); } catch(e) {}
  var answers = quiz.map(function(q, i) {
    var checked = document.querySelector('input[name="quiz-q'+i+'"]:checked');
    return checked ? parseInt(checked.value) : -1;
  });
  if (answers.indexOf(-1) !== -1) { alert('Please answer all questions before submitting.'); return; }
  var correct = 0;
  quiz.forEach(function(q, i) {
    var correctIdx = q.correct_index !== undefined ? q.correct_index : q.answer;
    if (answers[i] === correctIdx) correct++;
  });
  var pct = Math.round(correct / quiz.length * 100);
  var passed = pct >= 70;
  
  if (passed) {
    var p = getProgress();
    if (!p[course.slug]) p[course.slug] = { completedLessons: [], quizPassed: false, xp: 0 };
    p[course.slug].quizPassed = true;
    p[course.slug].xp = (p[course.slug].xp || 0) + 100;
    saveProgress(p);
    updateStreak();
  }
  
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'submit_quiz', course_slug: course.slug, answers: answers, enrollment_id: currentEnrollment.id }) });
    var data = await res.json();
  } catch(e) {}

  var body = document.getElementById('enroll-body');
  if (passed) {
    var achievements = getAchievements();
    var newAchievement = achievements.length > 0 ? achievements[achievements.length - 1] : null;
    body.innerHTML = '<div class="text-center py-6">' +
      '<div style="font-size:3rem;margin-bottom:8px;">🎉</div>' +
      '<h3 style="font-size:1.2rem;font-weight:800;margin-bottom:6px;" class="grad-text">Quiz Passed! '+pct+'%</h3>' +
      '<div style="font-size:13px;color:#9ca3af;margin-bottom:16px;">'+correct+' of '+quiz.length+' correct · +100 XP earned!</div>' +
      (newAchievement ? '<div style="background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.25);border-radius:12px;padding:12px;margin-bottom:16px;">' +
        '<div style="font-size:24px;">'+newAchievement.icon+'</div>' +
        '<div style="font-size:13px;font-weight:700;color:#a78bfa;margin-top:4px;">Achievement Unlocked: '+esc(newAchievement.title)+'</div>' +
        '<div style="font-size:11px;color:#6b7280;">'+esc(newAchievement.desc)+'</div></div>' : '') +
      '<button onclick="showCertificate()" class="w-full py-3 rounded-full font-semibold mb-2" style="background:linear-gradient(90deg,#8b5cf6,#3b82f6)">🎓 Download Your Certificate →</button>' +
      '<button onclick="showPostCourse()" class="w-full py-2 rounded-full font-semibold" style="background:none;border:1px solid rgba(255,255,255,.1);color:#9ca3af;">What\'s Next? →</button>' +
      '</div>';
    updateStats();
  } else {
    body.innerHTML = '<div class="text-center py-6">' +
      '<div style="font-size:3rem;margin-bottom:8px;">📚</div>' +
      '<h3 style="font-size:1.1rem;font-weight:700;margin-bottom:6px;">Almost There! '+pct+'%</h3>' +
      '<div style="font-size:13px;color:#9ca3af;margin-bottom:16px;">You need 70% to pass. You got '+correct+' of '+quiz.length+' correct.</div>' +
      '<button onclick="renderVideoStep(currentEnrollment.course, 0)" class="w-full py-3 rounded-full font-semibold mb-2" style="background:linear-gradient(90deg,#8b5cf6,#3b82f6)">🔄 Rewatch Lessons & Retry →</button>' +
      '<button onclick="showQuiz()" class="w-full py-2 rounded-full font-semibold" style="background:none;border:1px solid rgba(255,255,255,.1);color:#9ca3af;">Try Quiz Again →</button>' +
      '</div>';
  }
}

/* ===== Post-Course Experience (Coursera-style "What's Next") ===== */
function showPostCourse() {
  var course = currentEnrollment.course;
  var completedCount = getCompletedCourses();
  var xp = getTotalXP();
  var level = getLevel();
  
  // Suggest next courses in same category
  var nextCourses = allCourses.filter(function(c) {
    return c.slug !== course.slug && c.category === course.category;
  }).slice(0, 3);
  
  var nextHTML = nextCourses.length ? nextCourses.map(function(c) {
    return '<div class="glass rounded-xl p-3 cursor-pointer" onclick="openCourse(\''+esc(c.slug)+'\')" style="transition:all .3s;" onmouseover="this.style.borderColor=\'rgba(139,92,246,.4)\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,.07)\'">' +
      '<div style="font-size:12px;font-weight:600;margin-bottom:4px;">'+esc(c.title)+'</div>' +
      '<div style="font-size:10px;color:#6b7280;">'+esc(c.category)+' · '+(c.is_free ? 'FREE' : '₦'+Number(c.price_ngn||0).toLocaleString())+'</div>' +
      '</div>';
  }).join('') : '<div style="font-size:12px;color:#6b7280;">More courses coming soon!</div>';
  
  var body = document.getElementById('enroll-body');
  body.innerHTML = '<div style="padding:20px 0;">' +
    '<div style="text-align:center;margin-bottom:24px;">' +
      '<div style="font-size:2.5rem;margin-bottom:8px;">🚀</div>' +
      '<h3 style="font-size:1.1rem;font-weight:800;margin-bottom:6px;">Congratulations, '+esc(currentEnrollment.name)+'!</h3>' +
      '<div style="font-size:13px;color:#9ca3af;">You completed <strong style="color:#a78bfa;">'+esc(course.title)+'</strong></div>' +
    '</div>' +
    
    '<div class="glass rounded-xl p-4 mb-4">' +
      '<div style="font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:12px;">📊 Your Progress</div>' +
      '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">' +
        '<div><div style="font-size:1.2rem;font-weight:800;color:#fbbf24;">⭐ Level '+level.level+'</div><div style="font-size:10px;color:#6b7280;">'+xp+' total XP</div></div>' +
        '<div><div style="font-size:1.2rem;font-weight:800;color:#34d399;">🎓 '+completedCount+'</div><div style="font-size:10px;color:#6b7280;">Courses completed</div></div>' +
        '<div><div style="font-size:1.2rem;font-weight:800;color:#f97316;">🔥 '+getStreak()+'</div><div style="font-size:10px;color:#6b7280;">Day streak</div></div>' +
      '</div>' +
      '<div class="progress-bar mt-3"><div class="progress-fill" style="width:'+level.progress+'%"></div></div>' +
      '<div style="font-size:10px;color:#6b7280;margin-top:4px;">'+level.remaining+' XP to Level '+(level.level+1)+'</div>' +
    '</div>' +
    
    '<div class="glass rounded-xl p-4 mb-4">' +
      '<div style="font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:10px;">🎓 What You Learned</div>' +
      '<div style="font-size:12px;color:#9ca3af;line-height:1.6;">'+esc(course.description)+'</div>' +
    '</div>' +
    
    '<div style="margin-bottom:16px;">' +
      '<div style="font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:10px;">🎯 Recommended Next Steps</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' + nextHTML + '</div>' +
    '</div>' +
    
    '<div class="glass rounded-xl p-4 mb-4">' +
      '<div style="font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:8px;">💪 Take Action</div>' +
      '<div style="font-size:11px;color:#9ca3af;line-height:1.6;margin-bottom:10px;">Now that you\'ve completed this course, put your skills to work:</div>' +
      '<a href="https://wa.me/'+WHATSAPP_NUMBER+'?text=I%20just%20completed%20'+encodeURIComponent(course.title)+'%20on%20SkillForge!%20I%20want%20to%20start%20earning%20with%20my%20new%20skills." target="_blank" style="display:block;padding:10px;background:#25D366;color:#fff;border-radius:10px;text-align:center;text-decoration:none;font-size:12px;font-weight:600;margin-bottom:6px;">💬 Join the Erogian Freelance Network →</a>' +
      '<a href="https://wa.me/'+WHATSAPP_NUMBER+'?text=I%20just%20completed%20'+encodeURIComponent(course.title)+'%20and%20want%20to%20showcase%20my%20work" target="_blank" style="display:block;padding:10px;background:rgba(139,92,246,.15);color:#a78bfa;border:1px solid rgba(139,92,246,.3);border-radius:10px;text-align:center;text-decoration:none;font-size:12px;font-weight:600;">🌐 Get Your Project Featured →</a>' +
    '</div>' +
    
    '<button onclick="showCertificate()" class="w-full py-3 rounded-full font-semibold mb-2" style="background:linear-gradient(90deg,#8b5cf6,#3b82f6)">🎓 View Certificate Again →</button>' +
    '<button onclick="document.getElementById(\'enroll-modal\').classList.remove(\'active\'); window.location.reload();" class="w-full py-2 rounded-full font-semibold" style="background:none;border:1px solid rgba(255,255,255,.1);color:#9ca3af;">Back to All Courses →</button>' +
    '</div>';
}

function showCertificate() {
  var course = currentEnrollment.course;
  var name = currentEnrollment.name || 'Student';
  var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  var body = document.getElementById('enroll-body');
  body.innerHTML = '<div style="text-align:center;">' +
    '<div style="background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(212,175,55,.05));border:2px solid rgba(139,92,246,.2);border-radius:20px;padding:32px;margin-bottom:16px;">' +
    '<div style="font-size:11px;color:#6b7280;letter-spacing:.2em;text-transform:uppercase;margin-bottom:16px;">Certificate of Completion</div>' +
    '<div style="font-size:1.8rem;font-weight:800;margin-bottom:8px;" class="grad-text">'+esc(name)+'</div>' +
    '<div style="font-size:12px;color:#9ca3af;margin-bottom:16px;">has successfully completed</div>' +
    '<div style="font-size:1rem;font-weight:700;margin-bottom:16px;color:#e2e8f0;">'+esc(course.title)+'</div>' +
    '<div style="font-size:11px;color:#6b7280;margin-bottom:20px;">'+date+' · SkillForge by EROGIAN</div>' +
    '<div style="display:flex;justify-content:center;gap:6px;margin-bottom:12px;">' +
      '<span style="font-size:24px;">🏅</span>' +
    '</div>' +
    '<canvas id="cert-canvas" style="display:none;width:1200px;height:850px;"></canvas>' +
    '</div>' +
    '<button onclick="downloadCertificate()" class="w-full py-3 rounded-full font-semibold mb-2" style="background:linear-gradient(90deg,#8b5cf6,#3b82f6)">⬇ Download Certificate (PNG) →</button>' +
    '<button onclick="showPostCourse()" class="w-full py-2 rounded-full font-semibold" style="background:none;border:1px solid rgba(255,255,255,.1);color:#9ca3af;">What\'s Next? →</button>' +
    '</div>';
}

function downloadCertificate() {
  var course = currentEnrollment.course;
  var name = currentEnrollment.name || 'Student';
  var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  var canvas = document.getElementById('cert-canvas');
  if (!canvas) return;
  canvas.width = 1200; canvas.height = 850;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, 1200, 850);
  var grad = ctx.createLinearGradient(0, 0, 1200, 850);
  grad.addColorStop(0, '#1a1030'); grad.addColorStop(1, '#0a0a14');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 850);
  ctx.strokeStyle = 'rgba(139,92,246,.3)'; ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, 1120, 770);
  ctx.strokeStyle = 'rgba(212,175,55,.15)'; ctx.lineWidth = 1;
  ctx.strokeRect(60, 60, 1080, 730);
  ctx.fillStyle = '#6b7280'; ctx.font = 'bold 14px Inter, sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('CERTIFICATE OF COMPLETION', 600, 180);
  ctx.fillStyle = '#f0f0f8'; ctx.font = 'bold 48px "Space Grotesk", sans-serif';
  ctx.fillText(name, 600, 300);
  ctx.fillStyle = '#9ca3af'; ctx.font = '16px Inter, sans-serif';
  ctx.fillText('has successfully completed', 600, 360);
  ctx.fillStyle = '#a78bfa'; ctx.font = 'bold 28px "Space Grotesk", sans-serif';
  ctx.fillText(course.title, 600, 420);
  ctx.fillStyle = '#6b7280'; ctx.font = '14px Inter, sans-serif';
  ctx.fillText(date + ' · SkillForge by EROGIAN', 600, 520);
  ctx.font = '40px serif'; ctx.fillText('🏅', 600, 620);
  var link = document.createElement('a');
  link.download = 'Erogian-' + course.slug + '-Certificate.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/* ===== Dashboard ===== */
function openDashboard() {
  var body = document.getElementById('enroll-body');
  document.getElementById('enroll-title').textContent = '🎓 My Learning Dashboard';
  var xp = getTotalXP();
  var level = getLevel();
  var streak = getStreak();
  var completed = getCompletedCourses();
  var achievements = getAchievements();
  var progress = getProgress();
  var inProgress = [];
  for (var slug in progress) {
    var c = allCourses.find(function(c){ return c.slug === slug; });
    if (c && !progress[slug].quizPassed) {
      var lessons = getLessons(c);
      var pct = lessons.length ? Math.round(progress[slug].completedLessons.length / lessons.length * 100) : 0;
      inProgress.push({ course: c, pct: pct });
    }
  }
  
  var achHTML = achievements.length ? achievements.map(function(a) {
    return '<div style="display:flex;align-items:center;gap:10px;background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.15);border-radius:12px;padding:10px 14px;"><div style="font-size:24px;">'+a.icon+'</div><div><div style="font-size:12px;font-weight:700;color:#a78bfa;">'+esc(a.title)+'</div><div style="font-size:10px;color:#6b7280;">'+esc(a.desc)+'</div></div></div>';
  }).join('') : '<div style="font-size:12px;color:#6b7280;">Complete lessons and quizzes to unlock achievements!</div>';
  
  var inProgressHTML = inProgress.length ? inProgress.map(function(item) {
    return '<div class="glass rounded-xl p-3 cursor-pointer" onclick="openCourse(\''+esc(item.course.slug)+'\')" style="margin-bottom:8px;">' +
      '<div style="font-size:12px;font-weight:600;margin-bottom:4px;">'+esc(item.course.title)+'</div>' +
      '<div class="progress-bar"><div class="progress-fill" style="width:'+item.pct+'%"></div></div>' +
      '<div style="font-size:10px;color:#6b7280;margin-top:4px;">'+item.pct+'% complete</div>' +
      '</div>';
  }).join('') : '<div style="font-size:12px;color:#6b7280;">No courses in progress yet. Start one above!</div>';
  
  body.innerHTML = 
    '<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:20px;">' +
      '<div style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);border-radius:16px;padding:16px 24px;text-align:center;">' +
        '<div style="font-size:1.5rem;font-weight:800;color:#fbbf24;">🔥 '+streak+'</div>' +
        '<div style="font-size:10px;color:#6b7280;">Day Streak</div>' +
      '</div>' +
      '<div style="background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.2);border-radius:16px;padding:16px 24px;text-align:center;">' +
        '<div style="font-size:1.5rem;font-weight:800;color:#a78bfa;">⭐ '+level.level+'</div>' +
        '<div style="font-size:10px;color:#6b7280;">Level · '+xp+' XP</div>' +
      '</div>' +
      '<div style="background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);border-radius:16px;padding:16px 24px;text-align:center;">' +
        '<div style="font-size:1.5rem;font-weight:800;color:#34d399;">🎓 '+completed+'</div>' +
        '<div style="font-size:10px;color:#6b7280;">Courses Completed</div>' +
      '</div>' +
    '</div>' +
    
    '<div style="margin-bottom:20px;">' +
      '<div style="font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:10px;">📈 Continue Learning</div>' +
      inProgressHTML +
    '</div>' +
    
    '<div style="margin-bottom:20px;">' +
      '<div style="font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:10px;">🏆 Achievements ('+achievements.length+')</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' + achHTML + '</div>' +
    '</div>' +
    
    '<div class="glass rounded-xl p-4">' +
      '<div style="font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:8px;">⚡ Level '+level.level+' Progress</div>' +
      '<div class="progress-bar"><div class="progress-fill" style="width:'+level.progress+'%"></div></div>' +
      '<div style="font-size:10px;color:#6b7280;margin-top:6px;">'+level.remaining+' XP until Level '+(level.level+1)+'</div>' +
    '</div>';
  
  document.getElementById('enroll-modal').classList.add('active');
}

/* ===== ADMIN ===== */
function openAdmin() { document.getElementById('admin-modal').classList.add('active'); }
function closeAdminLogin() { document.getElementById('admin-modal').classList.remove('active'); }

function checkAdminKey() {
  var key = document.getElementById('admin-key-input').value;
  if (key === ADMIN_KEY) {
    document.getElementById('admin-login').style.display='none'; document.getElementById('admin-panel').style.display='block';
    loadAdminCourses();
  } else { alert('Invalid admin key.'); }
}
function closeAdminStudio() { document.getElementById('admin-modal').classList.remove('active'); }
function adminLogin() { checkAdminKey(); }

function addLessonField() {
  var idx = cfLessons.length;
  cfLessons.push({ title: '', video_url: '', video_file_url: '' });
  renderLessonFields();
}
function renderLessonFields() {
  var el = document.getElementById('cf-lessons-list');
  if (!el) return;
  el.innerHTML = cfLessons.map(function(l, i) {
    return '<div style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:12px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><span style="font-size:12px;font-weight:600;color:#9ca3af;">Lesson '+(i+1)+'</span>' +
      (cfLessons.length > 1 ? '<button onclick="cfLessons.splice('+i+',1);renderLessonFields()" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;">✕</button>' : '') +
      '</div>' +
      '<input id="cf-lesson-title-'+i+'" placeholder="Lesson title (e.g. Introduction to HTML)" class="w-full rounded-lg px-3 py-2 text-xs mb-2" value="'+esc(l.title||'')+'" oninput="cfLessons['+i+'].title=this.value">' +
      '<input id="cf-lesson-url-'+i+'" placeholder="YouTube URL" class="w-full rounded-lg px-3 py-2 text-xs mb-1" value="'+esc(l.video_url||'')+'" oninput="cfLessons['+i+'].video_url=this.value;updateLessonPreview('+i+',this.value)">' +
      '<div id="lesson-url-preview-'+i+'">'+getLessonPreviewHTML(l.video_url, i)+'</div>' +
      '<input id="cf-lesson-file-'+i+'" type="file" accept="video/*" style="font-size:11px;margin-top:4px;" onchange="handleVideoUpload(event,'+i+')">' +
      '</div>';
  }).join('');
}
function handleVideoUpload(e, idx) {
  var file = e.target && e.target.files && e.target.files[0];
  if (!file) return;
  if (file.size > 100 * 1024 * 1024) { alert('Max 100MB.'); return; }
  var reader = new FileReader();
  reader.onload = function(ev) {
    cfLessons[idx].video_file_url = ev.target.result.substring(ev.target.result.indexOf(',') + 1);
  };
  reader.readAsDataURL(file);
}

function handleThumbUpload(e) {
  var file = e.target && e.target.files && e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('Max 5MB.'); return; }
  var reader = new FileReader();
  reader.onload = function(ev) {
    var base64 = ev.target.result;
    uploadedThumbUrl = base64;
    var preview = document.getElementById('cf-thumb-preview');
    if (preview) { preview.innerHTML = '<img src="'+base64+'" style="max-width:200px;border-radius:8px;">'; }
  };
  reader.readAsDataURL(file);
}

async function generateQuiz() {
  var title = document.getElementById('cf-title').value.trim();
  var video = (cfLessons[0] && cfLessons[0].video_url) || '';
  if (!video) { alert('Add a YouTube video link to Lesson 1 first.'); return; }
  var out = document.getElementById('cf-quiz-editor');
  out.innerHTML = '<div class="text-sm text-gray-400">🧠 Watching & analyzing the video, generating questions...</div>';
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'generate_quiz', admin_key:ADMIN_KEY, video_url:video, course_title:title }) });
    var data = await res.json();
    cfQuizData = data.quiz || [];
    out.innerHTML = '<div style="color:#34d399;font-size:12px;margin-bottom:8px;">✅ '+cfQuizData.length+' questions generated!</div>' +
      cfQuizData.map(function(q,i) {
        return '<div style="background:rgba(255,255,255,.03);border-radius:8px;padding:8px;margin-bottom:6px;">' +
          '<div style="font-size:11px;font-weight:600;color:#d1d5db;">Q'+(i+1)+': '+esc(q.question||q.q)+'</div>' +
          '<div style="font-size:10px;color:#6b7280;margin-top:4px;">'+(q.options||[]).length+' options · Answer: '+(q.correct_index!==undefined?q.correct_index:q.answer)+'</div>' +
          '</div>';
      }).join('');
  } catch(e) {
    out.innerHTML = '<div class="text-sm text-red-400">Could not generate quiz. Try again.</div>';
  }
}

function resetCourseForm() {
  cfLessons = [{ title: '', video_url: '', video_file_url: '' }];
  cfQuizData = [];
  uploadedThumbUrl = '';
  var f = document.getElementById('cf-title'); if (f) f.value = '';
  var d = document.getElementById('cf-description'); if (d) d.value = '';
  var cat = document.getElementById('cf-category'); if (cat) cat.value = '';
  var lvl = document.getElementById('cf-level'); if (lvl) lvl.value = 'Beginner';
  var dur = document.getElementById('cf-duration'); if (dur) dur.value = '';
  var isf = document.getElementById('cf-is-free'); if (isf) isf.checked = true;
  var pr = document.getElementById('cf-price'); if (pr) pr.value = '0';
  var out = document.getElementById('cf-quiz-editor'); if (out) out.innerHTML = 'No quiz yet.';
  var prev = document.getElementById('cf-thumb-preview'); if (prev) prev.innerHTML = '';
  var banner = document.getElementById('cf-editing-banner'); if (banner) banner.style.display = 'none';
  renderLessonFields();
}

async function publishCourse() {
  var title = document.getElementById('cf-title').value.trim();
  if (!title) { alert('Please enter a title.'); return; }
  var slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  var btn = document.getElementById('cf-save-btn');
  var isEditing = !!cfEditingId;
  btn.textContent = isEditing ? 'Updating...' : 'Publishing...'; btn.disabled = true;
  var validLessons = cfLessons.filter(function(l){ return l.video_url || l.video_file_url; });
  var payload = {
    action: 'save', admin_key: ADMIN_KEY, title: title, slug: slug,
    description: document.getElementById('cf-description').value.trim(),
    category: document.getElementById('cf-category').value.trim() || 'General',
    lessons: JSON.stringify(validLessons),
    thumbnail: uploadedThumbUrl,
    level: (document.getElementById('cf-level')||{value:''}).value,
    duration: document.getElementById('cf-duration').value.trim(),
    is_free: document.getElementById('cf-is-free').checked,
    price_ngn: parseInt(document.getElementById('cf-price').value) || 0,
    quiz: JSON.stringify(cfQuizData),
    status: 'published',
    instructor: (document.getElementById('cf-instructor')||{value:'EROGIAN'}).value,
    outcomes: (document.getElementById('cf-outcomes')||{value:''}).value,
    requirements: (document.getElementById('cf-requirements')||{value:''}).value,
    tags: (document.getElementById('cf-tags')||{value:''}).value
  };
  if (isEditing) payload.id = cfEditingId;
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    var data = await res.json();
    if (data.status === 'ok') {
      alert(isEditing ? 'Class updated! ✅' : 'Class published! 🎉');
      resetCourseForm();
      closeAdminStudio();
      window.location.reload();
    } else { alert('Error: ' + (data.message||'unknown')); btn.textContent = isEditing ? 'Update Class' : 'Publish Class'; btn.disabled=false; }
  } catch (e) { alert('Network error'); btn.textContent = isEditing ? 'Update Class' : 'Publish Class'; btn.disabled=false; }
}

async function loadAdminCourses() {
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'admin_list', admin_key:ADMIN_KEY }) });
    var data = await res.json();
    var list = document.getElementById('admin-course-list');
    var courses = data.courses || [];
    list.innerHTML = courses.map(function(c) {
      var status = c.status || 'published';
      var statusBadge = status === 'published'
        ? '<span style="color:#4ade80;font-size:10px;">● Published</span>'
        : '<span style="color:#fbbf24;font-size:10px;">● Draft</span>';
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:rgba(255,255,255,.02);border-radius:10px;margin-bottom:8px;">' +
        '<div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:600;color:#d1d5db;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(c.title)+'</div><div style="font-size:10px;color:#6b7280;">'+esc(c.category)+' · '+(c.is_free?'Free':'₦'+Number(c.price_ngn||0).toLocaleString())+' · '+(c.enrolled_count||0)+' enrolled</div></div>' +
        '<div style="display:flex;gap:4px;align-items:center;flex-shrink:0;">' +
        statusBadge +
        '<button onclick="editCourse(\''+c.id+'\')" style="padding:4px 10px;font-size:11px;background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);color:#a78bfa;border-radius:6px;cursor:pointer;">Edit</button>' +
        '<button onclick="toggleStatus(\''+c.id+'\',\''+status+'\')" style="padding:4px 10px;font-size:11px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#9ca3af;border-radius:6px;cursor:pointer;">'+(status==='published'?'Unpublish':'Publish')+'</button>' +
        '</div></div>';
    }).join('');
  } catch(e) { document.getElementById('admin-course-list').innerHTML = '<div style="font-size:12px;color:#ef4444;">Failed to load courses.</div>'; }
}

async function editCourse(id) {
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'admin_list', admin_key:ADMIN_KEY }) });
    var data = await res.json();
    var c = (data.courses || []).find(function(x){ return x.id === id; });
    if (!c) return;
    cfEditingId = id;
    document.getElementById('cf-title').value = c.title || '';
    document.getElementById('cf-description').value = c.description || '';
    document.getElementById('cf-category').value = c.category || '';
    if (document.getElementById('cf-level')) document.getElementById('cf-level').value = c.level || 'Beginner';
    if (document.getElementById('cf-duration')) document.getElementById('cf-duration').value = c.duration || '';
    if (document.getElementById('cf-is-free')) document.getElementById('cf-is-free').checked = c.is_free;
    if (document.getElementById('cf-price')) document.getElementById('cf-price').value = c.price_ngn || 0;
    if (document.getElementById('cf-instructor')) document.getElementById('cf-instructor').value = c.instructor || 'EROGIAN';
    if (document.getElementById('cf-outcomes')) document.getElementById('cf-outcomes').value = c.outcomes || '';
    if (document.getElementById('cf-requirements')) document.getElementById('cf-requirements').value = c.requirements || '';
    if (document.getElementById('cf-tags')) document.getElementById('cf-tags').value = c.tags || '';
    uploadedThumbUrl = c.thumbnail || '';
    if (c.thumbnail) { var p = document.getElementById('cf-thumb-preview'); if (p) p.innerHTML = '<img src="'+c.thumbnail+'" style="max-width:200px;border-radius:8px;">'; }
    try { cfLessons = JSON.parse(c.lessons || '[]'); } catch(e) { cfLessons = [{title: c.title, video_url: c.video_url, video_file_url: c.video_file_url}]; }
    if (!cfLessons.length && (c.video_url || c.video_file_url)) cfLessons = [{title: c.title, video_url: c.video_url, video_file_url: c.video_file_url}];
    try { cfQuizData = JSON.parse(c.quiz || '[]'); } catch(e) { cfQuizData = []; }
    renderLessonFields();
    var out = document.getElementById('cf-quiz-editor');
    if (out && cfQuizData.length) out.innerHTML = '<div style="color:#34d399;font-size:12px;margin-bottom:8px;">✅ '+cfQuizData.length+' questions loaded</div>';
    var banner = document.getElementById('cf-editing-banner'); if (banner) banner.style.display = 'block';
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('course-form').style.display = 'block';
  } catch(e) { alert('Error loading course.'); }
}

function toggleStatus(id, currentStatus) {
  var newStatus = currentStatus === 'draft' ? 'published' : 'draft';
  fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'update_status', admin_key:ADMIN_KEY, id:id, status:newStatus }) })
    .then(function(){ loadAdminCourses(); })
    .catch(function(){ alert('Failed to update status.'); });
}

function loadEnrollments() {
  fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'admin_enrollments', admin_key:ADMIN_KEY }) })
    .then(function(r){ return r.json(); })
    .then(function(data) {
      var el = document.getElementById('admin-enrollments-list');
      var enrs = data.enrollments || [];
      if (!enrs.length) { el.innerHTML = '<div style="font-size:12px;color:#6b7280;">No enrollments yet.</div>'; return; }
      el.innerHTML = enrs.map(function(e) {
        return '<div style="padding:8px;background:rgba(255,255,255,.02);border-radius:8px;margin-bottom:6px;font-size:12px;"><span style="color:#d1d5db;font-weight:600;">'+esc(e.name||'')+'</span> <span style="color:#6b7280;">— '+esc(e.course_title||e.course_slug||'')+'</span> <span style="color:'+(e.is_free?'#4ade80':'#fbbf24')+';">'+(e.is_free?'Free':'₦'+Number(e.amount_ngn||0).toLocaleString())+'</span></div>';
      }).join('');
    })
    .catch(function(){ document.getElementById('admin-enrollments-list').innerHTML = '<div style="font-size:12px;color:#ef4444;">Failed to load.</div>'; });
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', function() {
  loadCourses();
  updateStreak();
  
  // Reveal animations
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    reveals.forEach(function(r) { io.observe(r); });
  }
});
