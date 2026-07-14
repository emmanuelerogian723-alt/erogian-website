/* ===== Config ===== */
var SKILLFORGE_URL = 'https://superagent-55bc0d3a.base44.app/functions/erogianSkillForge';
var UPLOAD_URL = 'https://superagent-55bc0d3a.base44.app/functions/erogianUpload';
var VIDEO_UPLOAD_URL = 'https://superagent-55bc0d3a.base44.app/functions/erogianVideoUpload';
var ADMIN_KEY = 'erogian_skillforge_admin_2026';
var UPLOAD_ADMIN_KEY = 'erogian_blog_admin_2026'; // shared upload utility uses the blog admin key
var WHATSAPP_NUMBER = '2347045560291';
var CERTIFICATE_TEMPLATE = 'https://media.base44.com/images/public/6a37c01bd442f2d055bc0d3a/a13447e10_generated_image.png';
var allCourses = [];
var currentFilter = 'all';
var uploadedThumbUrl = '';
var uploadedVideoFileUrl = '';
var cfQuizData = [];
var cfLessons = [];
var activeLessonIndex = 0;
var currentEnrollment = null; // {id, name, email, course}

function esc(s) { return (s||'').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }




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
  } catch (e) {
    grid.innerHTML = '<div class="glass rounded-2xl p-6 card-float col-span-3"><div class="text-sm text-gray-500">Could not load classes right now. Try refreshing.</div></div>';
  }
}

function renderChips() {
  var cats = ['all'].concat(Array.from(new Set(allCourses.map(function(c){ return c.category; }))));
  var el = document.getElementById('filter-chips');
  el.innerHTML = cats.map(function(c) {
    return '<button class="chip ' + (c === currentFilter ? 'chip-active' : '') + '" onclick="filterCourses(\'' + c + '\')">' + (c === 'all' ? 'All Classes' : esc(c)) + '</button>';
  }).join('');
}

function filterCourses(cat) { currentFilter = cat; renderChips(); renderGrid(); }

function renderGrid() {
  var grid = document.getElementById('course-grid');
  var list = currentFilter === 'all' ? allCourses : allCourses.filter(function(c){ return c.category === currentFilter; });
  if (!list.length) { grid.innerHTML = '<div class="glass rounded-2xl p-6 card-float col-span-3"><div class="text-sm text-gray-500">New classes coming soon.</div></div>'; return; }
  grid.innerHTML = list.map(function(c) {
    var thumb = c.thumbnail ? '<img src="'+esc(c.thumbnail)+'" class="course-thumb" loading="lazy" style="width:100%;aspect-ratio:16/9;object-fit:cover;object-position:center;display:block;">' : '<div class="course-thumb-placeholder" style="width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,rgba(139,92,246,.25),rgba(59,130,246,.2));display:flex;align-items:center;justify-content:center;font-size:3rem;">🎬</div>';
    var badge = c.is_free ? '<span class="badge-free text-xs px-3 py-1 rounded-full font-semibold">FREE</span>' : '<span class="badge-pro text-xs px-3 py-1 rounded-full font-semibold">₦'+Number(c.price_ngn||0).toLocaleString()+'</span>';
    var lock = c.is_free ? '' : '<div class="lock-overlay"><div class="text-3xl">🔒</div><div class="text-xs text-gray-300">Premium Class</div></div>';
    var hasQuiz = (function(){ try { return JSON.parse(c.quiz||'[]').length > 0; } catch(e){ return false; } })();
    return '<div class="glass rounded-2xl overflow-hidden card-float cursor-pointer group" onclick="openCourse(\''+esc(c.slug)+'\')">' +
      '<div class="relative">' + thumb + lock + '</div>' +
      '<div class="p-5">' +
      '<div class="flex items-center justify-between mb-2"><span class="text-xs text-purple-300">'+esc(c.category)+' · '+esc(c.level)+'</span>'+badge+'</div>' +
      '<div class="font-semibold mb-2">'+esc(c.title)+'</div>' +
      '<div class="text-xs text-gray-500 mb-3">'+esc((c.description||'').slice(0,90))+'...</div>' +
      '<div class="text-xs text-gray-600">⏱ '+esc(c.duration||'')+' · '+ (c.enrolled_count||0) +' enrolled'+(hasQuiz?' · 🧠 Quiz + 🎓 Certificate':'')+'</div>' +
      '</div></div>';
  }).join('');
}

function openCourse(slug) {
  var course = allCourses.find(function(c){ return c.slug === slug; });
  if (!course) return;
  document.getElementById('enroll-title').textContent = course.title;
  var body = document.getElementById('enroll-body');
  body.innerHTML =
    '<p class="text-sm text-gray-400 mb-4">'+esc(course.description)+'</p>' +
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
    '<div class="glass rounded-xl p-4 mb-4 text-center"><div class="text-2xl font-bold grad-text">₦'+Number(course.price_ngn||0).toLocaleString()+'</div><div class="text-xs text-gray-500">One-time payment · Lifetime access + Certificate on completion</div></div>' +
    '<a href="https://wa.me/'+WHATSAPP_NUMBER+'?text='+msg+'" target="_blank" class="block text-center w-full py-3 rounded-full font-semibold" style="background:linear-gradient(90deg,#8b5cf6,#3b82f6)">Unlock on WhatsApp →</a>';
}

async function startFreeClass(slug) {
  var info = validateEnrollForm();
  if (!info) return;
  var course = allCourses.find(function(c){ return c.slug === slug; });
  var enrollmentId = null;
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'enroll', name:info.name, email:info.email, phone:info.phone, course_slug:slug, is_free:true }) });
    var data = await res.json();
    if (data.enrollment) enrollmentId = data.enrollment.id;
  } catch(e) {}
  currentEnrollment = { id: enrollmentId, name: info.name, email: info.email, course: course };
  renderVideoStep(course);
}

function getLessons(course) {
  var lessons = [];
  try { lessons = JSON.parse(course.lessons || '[]'); } catch(e) {}
  if (!lessons.length && (course.video_url || course.video_file_url)) {
    lessons = [{ title: course.title, video_url: course.video_url, video_file_url: course.video_file_url }];
  }
  return lessons;
}

function renderVideoStep(course, lessonIdx) {
  activeLessonIndex = lessonIdx || 0;
  var body = document.getElementById('enroll-body');
  var lessons = getLessons(course);
  if (!lessons.length) {
    body.innerHTML = '<div class="glass rounded-xl p-6 text-center text-sm text-gray-400">This class video is being added soon! We\'ll notify you on WhatsApp the moment it\'s live. <a href="https://wa.me/'+WHATSAPP_NUMBER+'" target="_blank" class="text-purple-300 underline block mt-2">Message us</a></div>';
    return;
  }
  var lesson = lessons[activeLessonIndex] || lessons[0];
  var player = '';
  if (lesson.video_file_url) {
    player = '<div class="rounded-xl overflow-hidden mb-3"><video src="'+esc(lesson.video_file_url)+'" controls class="w-full"></video></div>';
  } else {
    var embed = toEmbedUrl(lesson.video_url);
    if (embed) player = '<div class="aspect-video rounded-xl overflow-hidden mb-3"><iframe src="'+esc(embed)+'" class="w-full h-full" allowfullscreen frameborder="0"></iframe></div>';
  }
  var lessonNav = '';
  if (lessons.length > 1) {
    lessonNav = '<div class="flex flex-wrap gap-2 mb-3">' + lessons.map(function(l, i) {
      return '<button onclick="renderVideoStep(currentEnrollment.course, ' + i + ')" class="chip ' + (i === activeLessonIndex ? 'chip-active' : '') + '">' + (i+1) + '. ' + esc(l.title || ('Lesson ' + (i+1))) + '</button>';
    }).join('') + '</div>';
  }
  var quiz = []; try { quiz = JSON.parse(course.quiz || '[]'); } catch(e) {}
  var quizBtn = quiz.length ? '<button onclick="showQuiz()" class="w-full py-3 rounded-full font-semibold" style="background:linear-gradient(90deg,#8b5cf6,#3b82f6)">✅ I\'ve watched ' + (lessons.length > 1 ? 'these lessons' : 'it') + ' — Take the Quiz (' + quiz.length + ' questions)</button>' :
    '<div class="text-center text-xs text-gray-500">Enjoy the class! Have questions? <a href="https://wa.me/'+WHATSAPP_NUMBER+'" target="_blank" class="text-purple-300 underline">Message us on WhatsApp</a>.</div>';
  body.innerHTML = lessonNav + player + quizBtn;
}

function showQuiz() {
  var course = currentEnrollment.course;
  var quiz = []; try { quiz = JSON.parse(course.quiz || '[]'); } catch(e) {}
  var body = document.getElementById('enroll-body');
  body.innerHTML = '<div class="text-sm text-gray-400 mb-4">Answer these to confirm you understood the lesson. You need 70% to pass and unlock your certificate.</div>' +
    quiz.map(function(q, i) {
      return '<div class="glass rounded-xl p-4 mb-3"><div class="font-semibold text-sm mb-2">'+(i+1)+'. '+esc(q.question)+'</div>' +
        q.options.map(function(opt, oi) {
          return '<label class="flex items-center gap-2 text-sm text-gray-300 mb-1 cursor-pointer"><input type="radio" name="quiz-q'+i+'" value="'+oi+'"> '+esc(opt)+'</label>';
        }).join('') + '</div>';
    }).join('') +
    '<button onclick="submitQuiz()" class="w-full py-3 rounded-full font-semibold mt-2" style="background:linear-gradient(90deg,#8b5cf6,#3b82f6)">Submit Answers</button>';
}

async function submitQuiz() {
  var course = currentEnrollment.course;
  var quiz = []; try { quiz = JSON.parse(course.quiz || '[]'); } catch(e) {}
  var answers = quiz.map(function(q, i) {
    var checked = document.querySelector('input[name="quiz-q'+i+'"]:checked');
    return checked ? parseInt(checked.value) : -1;
  });
  if (answers.indexOf(-1) !== -1) { alert('Please answer every question.'); return; }
  var body = document.getElementById('enroll-body');
  body.innerHTML = '<div class="text-center py-8 text-sm text-gray-400">Grading your answers...</div>';
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'submit_quiz', course_slug: course.slug, answers: answers, enrollment_id: currentEnrollment.id }) });
    var data = await res.json();
    if (data.passed) {
      body.innerHTML = '<div class="text-center py-6">' +
        '<div class="text-4xl mb-3">🎉</div>' +
        '<div class="font-bold text-lg mb-1">You passed! '+data.correct+'/'+data.total+'</div>' +
        '<div class="text-sm text-gray-400 mb-5">Great job, '+esc(currentEnrollment.name)+'! Your certificate is ready.</div>' +
        '<button onclick="downloadCertificate()" class="w-full py-3 rounded-full font-semibold" style="background:linear-gradient(90deg,#d4af37,#8b5cf6)">🎓 Download Your Certificate</button>' +
        '</div>';
    } else {
      body.innerHTML = '<div class="text-center py-6">' +
        '<div class="text-4xl mb-3">📚</div>' +
        '<div class="font-bold text-lg mb-1">'+data.correct+'/'+data.total+' — Almost there!</div>' +
        '<div class="text-sm text-gray-400 mb-5">Rewatch the video and try the quiz again to unlock your certificate.</div>' +
        '<button onclick="renderVideoStep(currentEnrollment.course)" class="w-full py-3 rounded-full font-semibold glass">Rewatch & Retry</button>' +
        '</div>';
    }
  } catch (e) {
    body.innerHTML = '<div class="text-center py-8 text-sm text-red-400">Something went wrong grading your quiz. Please try again.</div>';
  }
}

/* ===== Certificate generation (client-side canvas) ===== */
function downloadCertificate() {
  var name = currentEnrollment.name;
  var courseTitle = currentEnrollment.course.title;
  var img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function() {
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var cx = canvas.width / 2;
    ctx.textAlign = 'center';

    // Student name — bold, dark navy, high contrast against the cream certificate background
    ctx.fillStyle = '#12213f';
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 2;
    ctx.font = '900 ' + Math.round(canvas.width * 0.042) + 'px Georgia, serif';
    ctx.fillText(name, cx, canvas.height * 0.54);
    ctx.shadowBlur = 0;

    // Course title — deep bold gold, unique from name color
    ctx.fillStyle = '#8a6a00';
    ctx.font = 'bold ' + Math.round(canvas.width * 0.024) + 'px Georgia, serif';
    wrapText(ctx, courseTitle, cx, canvas.height * 0.665, canvas.width * 0.7, canvas.width * 0.028);

    // Date — placed on the dedicated "DATE" line near the signature/seal row, bold + dark for clarity
    var today = new Date().toLocaleDateString('en-GB', { year:'numeric', month:'long', day:'numeric' });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#12213f';
    ctx.font = 'bold ' + Math.round(canvas.width * 0.016) + 'px Georgia, serif';
    ctx.fillText(today, canvas.width * 0.745, canvas.height * 0.718);

    try {
      var link = document.createElement('a');
      link.download = 'SkillForge-Certificate-' + name.replace(/\s+/g,'-') + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('Your browser blocked the certificate download. Please screenshot this page instead, or message us on WhatsApp and we\'ll send your certificate directly.');
    }
  };
  img.onerror = function() {
    alert('Could not load the certificate template. Please message us on WhatsApp and we\'ll send your certificate directly.');
  };
  img.src = CERTIFICATE_TEMPLATE;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  var words = text.split(' ');
  var line = '';
  var lines = [];
  for (var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  var startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach(function(l, i) { ctx.fillText(l.trim(), x, startY + i * lineHeight); });
}

function closeEnroll() { document.getElementById('enroll-modal').classList.remove('active'); }

/* ===== Admin ===== */
function openAdmin() { document.getElementById('admin-login-modal').classList.add('active'); }
function closeAdminLogin() { document.getElementById('admin-login-modal').classList.remove('active'); }
function checkAdminKey() {
  var key = document.getElementById('admin-key-input').value;
  if (key === ADMIN_KEY) {
    closeAdminLogin();
    document.getElementById('admin-studio-modal').classList.add('active');
    cfLessons = [];
    renderLessonsEditor();
    loadAdminCourses();
    loadAdminEnrollments();
  } else {
    alert('Incorrect key.');
  }
}
function closeAdminStudio() { document.getElementById('admin-studio-modal').classList.remove('active'); }

document.addEventListener('change', function(e) {
  if (e.target && e.target.id === 'cf-thumb-file') {
    var file = e.target.files[0];
    if (!file) return;
    var preview = document.getElementById('cf-thumb-preview');
    preview.innerHTML = '<img src="'+URL.createObjectURL(file)+'" class="h-20 rounded-lg mb-1">';
    var reader = new FileReader();
    reader.onload = async function() {
      try {
        var base64 = reader.result.split(',')[1];
        if (file.size > 5000000) { preview.innerHTML += '<div class="text-red-400">Image too large (max 5MB)</div>'; return; }
        preview.innerHTML += '<div>Uploading...</div>';
        var res = await fetch(UPLOAD_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ admin_key:UPLOAD_ADMIN_KEY, image:base64, filename:file.name, mime:file.type }) });
        var data = await res.json();
        if (data.status === 'ok') { uploadedThumbUrl = data.url; preview.innerHTML = '<img src="'+esc(data.url)+'" class="h-20 rounded-lg mb-1"><div class="text-green-400">Uploaded ✓</div>'; }
        else { preview.innerHTML += '<div class="text-red-400">Upload failed: ' + (data.message||'') + '</div>'; }
      } catch (err) {
        preview.innerHTML += '<div class="text-red-400">Upload failed</div>';
      }
    };
    reader.readAsDataURL(file);
  }

  if (e.target && e.target.id === 'cf-video-file') {
    var vfile = e.target.files[0];
    if (!vfile) return;
    var vpreview = document.getElementById('cf-video-preview');
    if (vfile.size > 20 * 1024 * 1024) { vpreview.innerHTML = '<div class="text-red-400">Video too large (max 20MB). For longer lessons, upload as Unlisted on YouTube and paste the link above instead.</div>'; return; }
    vpreview.innerHTML = '<div>Uploading video... this may take a moment</div>';
    var vreader = new FileReader();
    vreader.onload = async function() {
      try {
        var vbase64 = vreader.result.split(',')[1];
        var vres = await fetch(VIDEO_UPLOAD_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ admin_key:UPLOAD_ADMIN_KEY, video:vbase64, filename:vfile.name, mime:vfile.type }) });
        var vdata = await vres.json();
        if (vdata.status === 'ok') { uploadedVideoFileUrl = vdata.url; vpreview.innerHTML = '<div class="text-green-400">Video uploaded ✓ — will be used instead of the URL above</div>'; }
        else { vpreview.innerHTML = '<div class="text-red-400">Upload failed: ' + (vdata.message||'') + '</div>'; }
      } catch (err) {
        vpreview.innerHTML = '<div class="text-red-400">Upload failed</div>';
      }
    };
    vreader.readAsDataURL(vfile);
  }
});

async function generateQuizFromVideo() {
  var video = (cfLessons[0] && cfLessons[0].video_url) || '';
  var title = document.getElementById('cf-title').value.trim();
  if (!video) { alert('Add a YouTube video link to Lesson 1 first.'); return; }
  var out = document.getElementById('cf-quiz-editor');
  out.innerHTML = '<div class="text-sm text-gray-400">🧠 Watching & analyzing the video, generating questions...</div>';
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'generate_quiz', admin_key:ADMIN_KEY, video_url:video, course_title:title }) });
    var data = await res.json();
    cfQuizData = data.quiz || [];
    renderQuizEditor();
  } catch (e) {
    out.innerHTML = '<div class="text-sm text-red-400">Could not generate quiz. Try again.</div>';
  }
}

function renderQuizEditor() {
  var out = document.getElementById('cf-quiz-editor');
  if (!cfQuizData.length) { out.innerHTML = '<div class="text-sm text-gray-500">No quiz yet — generate one from the video above.</div>'; return; }
  out.innerHTML = '<div class="text-xs text-gray-400 mb-2">Review the auto-generated quiz (correct answer highlighted). Regenerate if needed.</div>' +
    cfQuizData.map(function(q, i) {
      return '<div class="glass rounded-lg p-3 mb-2 text-sm"><div class="font-semibold mb-1">'+(i+1)+'. '+esc(q.question)+'</div>' +
        q.options.map(function(opt, oi) {
          return '<div class="'+(oi === q.correct_index ? 'text-green-400' : 'text-gray-400')+'">'+(oi === q.correct_index ? '✓ ' : '· ')+esc(opt)+'</div>';
        }).join('') + '</div>';
    }).join('');
}

function addLessonRow(title, video_url, video_file_url) {
  cfLessons.push({ title: title || ('Lesson ' + (cfLessons.length + 1)), video_url: video_url || '', video_file_url: video_file_url || '' });
  renderLessonsEditor();
}

function removeLessonRow(idx) {
  cfLessons.splice(idx, 1);
  renderLessonsEditor();
}

function updateLessonField(idx, field, value) {
  if (!cfLessons[idx]) return;
  cfLessons[idx][field] = value;
}

function renderLessonsEditor() {
  var el = document.getElementById('cf-lessons-list');
  if (!cfLessons.length) addLessonRow();
  el.innerHTML = cfLessons.map(function(l, i) {
    return '<div class="glass rounded-lg p-3">' +
      '<div class="flex justify-between items-center mb-2"><span class="text-xs font-semibold text-purple-300">Lesson ' + (i+1) + (i===0 ? ' (main preview)' : '') + '</span>' + (cfLessons.length > 1 ? '<button type="button" onclick="removeLessonRow(' + i + ')" class="text-red-400 text-xs">Remove</button>' : '') + '</div>' +
      '<input value="' + esc(l.title) + '" oninput="updateLessonField(' + i + ',\'title\',this.value)" placeholder="Lesson title" class="w-full rounded-lg px-3 py-2 text-xs mb-2">' +
      '<input value="' + esc(l.video_url) + '" oninput="updateLessonField(' + i + ',\'video_url\',this.value)" placeholder="YouTube URL" class="w-full rounded-lg px-3 py-2 text-xs mb-2">' +
      '<input type="file" accept="video/*" onchange="uploadLessonVideo(' + i + ', this)" class="w-full rounded-lg px-3 py-2 text-xs">' +
      '<div class="mt-1 text-xs text-gray-500" id="lesson-video-status-' + i + '">' + (l.video_file_url ? 'Video file uploaded ✓' : '') + '</div>' +
      '</div>';
  }).join('');
}

async function uploadLessonVideo(idx, inputEl) {
  var file = inputEl.files[0];
  if (!file) return;
  var statusEl = document.getElementById('lesson-video-status-' + idx);
  if (file.size > 20 * 1024 * 1024) { statusEl.textContent = 'Too large (max 20MB) — use a YouTube link instead.'; return; }
  statusEl.textContent = 'Uploading...';
  var reader = new FileReader();
  reader.onload = async function() {
    try {
      var base64 = reader.result.split(',')[1];
      var res = await fetch(VIDEO_UPLOAD_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ admin_key:UPLOAD_ADMIN_KEY, video:base64, filename:file.name, mime:file.type }) });
      var data = await res.json();
      if (data.status === 'ok') { cfLessons[idx].video_file_url = data.url; statusEl.textContent = 'Video uploaded ✓'; }
      else { statusEl.textContent = 'Upload failed: ' + (data.message||''); }
    } catch (err) { statusEl.textContent = 'Upload failed'; }
  };
  reader.readAsDataURL(file);
}

async function saveCourse() {
  var title = document.getElementById('cf-title').value.trim();
  if (!title) { alert('Please enter a title.'); return; }
  var slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  var btn = document.getElementById('cf-save-btn');
  var isEditing = !!cfEditingId;
  btn.textContent = isEditing ? 'Updating...' : 'Publishing...'; btn.disabled = true;
  var validLessons = cfLessons.filter(function(l){ return l.video_url || l.video_file_url; });
  var payload = {
    action: isEditing ? 'update' : 'save',
    admin_key: ADMIN_KEY,
    title: title, slug: slug,
    description: document.getElementById('cf-description').value.trim(),
    category: document.getElementById('cf-category').value.trim() || 'General',
    level: document.getElementById('cf-level').value,
    lessons: JSON.stringify(validLessons),
    thumbnail: uploadedThumbUrl,
    level: (document.getElementById('cf-level')||{value:''}).value,
    duration: (document.getElementById('cf-duration')||{value:''}).value,
    outcomes: (document.getElementById('cf-outcomes')||{value:''}).value,
    requirements: (document.getElementById('cf-requirements')||{value:''}).value,
    duration: document.getElementById('cf-duration').value.trim(),
    is_free: document.getElementById('cf-is-free').checked,
    price_ngn: parseInt(document.getElementById('cf-price').value) || 0,
    quiz: JSON.stringify(cfQuizData),
    status: 'published'
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
    list.innerHTML = (data.courses||[]).map(function(c) {
      return '<div class="flex justify-between items-center glass rounded-lg px-3 py-2"><span>'+esc(c.title)+' <span class="text-gray-600">('+(c.is_free?'Free':'₦'+c.price_ngn)+' · '+(c.enrolled_count||0)+' students)</span></span><button onclick="deleteCourse(\''+c.id+'\')" class="text-red-400 text-xs">Delete</button></div>';
    }).join('') || '<div class="text-gray-600 text-xs">No classes yet.</div>';
  } catch (e) {}
}

async function loadAdminEnrollments() {
  var el = document.getElementById('admin-enrollments-list');
  if (!el) return;
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'admin_enrollments', admin_key:ADMIN_KEY }) });
    var data = await res.json();
    el.innerHTML = (data.enrollments||[]).slice(0,30).map(function(e) {
      return '<div class="flex justify-between items-center glass rounded-lg px-3 py-2 text-xs"><span>'+esc(e.name)+' · '+esc(e.email)+' · '+esc(e.course_title)+'</span><span>'+(e.completed?'🎓 Completed':(e.quiz_total?e.quiz_score+'/'+e.quiz_total:'In progress'))+'</span></div>';
    }).join('') || '<div class="text-gray-600 text-xs">No students yet.</div>';
  } catch (e) {}
}

var cfEditingId = null;

function resetCourseForm() {
  cfEditingId = null;
  document.getElementById('cf-title').value = '';
  document.getElementById('cf-category').value = '';
  document.getElementById('cf-level').value = 'Beginner';
  document.getElementById('cf-duration').value = '';
  document.getElementById('cf-description').value = '';
  document.getElementById('cf-price').value = '';
  document.getElementById('cf-is-free').checked = false;
  cfLessons = []; cfQuizData = []; uploadedThumbUrl = '';
  var lvl2 = document.getElementById('cf-level'); if(lvl2) lvl2.value='';
  var dur2 = document.getElementById('cf-duration'); if(dur2) dur2.value='';
  var out2 = document.getElementById('cf-outcomes'); if(out2) out2.value='';
  var req2 = document.getElementById('cf-requirements'); if(req2) req2.value='';
  renderLessonsEditor();
  document.getElementById('cf-quiz-editor').innerHTML = 'No quiz yet.';
  var btn = document.getElementById('cf-save-btn');
  btn.textContent = 'Publish Class';
  var banner = document.getElementById('cf-editing-banner');
  if (banner) banner.classList.add('hidden');
}

function editCourse(c) {
  cfEditingId = c.id;
  document.getElementById('cf-title').value = c.title || '';
  document.getElementById('cf-category').value = c.category || '';
  document.getElementById('cf-level').value = c.level || 'Beginner';
  document.getElementById('cf-duration').value = c.duration || '';
  document.getElementById('cf-description').value = c.description || '';
  document.getElementById('cf-price').value = c.price_ngn || '';
  document.getElementById('cf-is-free').checked = !!c.is_free;
  uploadedThumbUrl = c.thumbnail || '';
  var lvl = document.getElementById('cf-level'); if(lvl) lvl.value = c.level||'';
  var dur = document.getElementById('cf-duration'); if(dur) dur.value = c.duration||'';
  var out = document.getElementById('cf-outcomes'); if(out) out.value = c.outcomes||'';
  var req = document.getElementById('cf-requirements'); if(req) req.value = c.requirements||'';
  try { cfLessons = JSON.parse(c.lessons||'[]'); } catch(e){ cfLessons = []; }
  try { cfQuizData = JSON.parse(c.quiz||'[]'); } catch(e){ cfQuizData = []; }
  renderLessonsEditor();
  if (cfQuizData.length) renderQuizEditor(); else document.getElementById('cf-quiz-editor').innerHTML = 'No quiz yet.';
  var btn = document.getElementById('cf-save-btn');
  btn.textContent = 'Update Class';
  var banner = document.getElementById('cf-editing-banner');
  if (banner) banner.classList.remove('hidden');
  document.getElementById('cf-title').scrollIntoView({behavior:'smooth'});
}


async function editCourseFromAdmin(id) {
  // Load full course data by id, then switch to create tab and populate form
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'admin_list', admin_key:ADMIN_KEY }) });
    var data = await res.json();
    var c = (data.courses||[]).find(function(x){ return x.id === id; });
    if (!c) { alert('Course not found.'); return; }
    editCourse(c);
    switchAdminTab('create');
  } catch(e) { alert('Could not load course data.'); }
}

async function togglePublish(id, currentStatus) {
  var newStatus = currentStatus === 'draft' ? 'published' : 'draft';
  if (!confirm('Change status to ' + newStatus + '?')) return;
  try {
    await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'update_status', admin_key:ADMIN_KEY, id:id, status:newStatus })
    });
    loadAdminCourses();
  } catch(e) { alert('Error updating status'); }
}

async function deleteCourse(id) {
  if (!confirm('Delete this class?')) return;
  try { await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'delete', admin_key:ADMIN_KEY, id:id }) }); loadAdminCourses(); } catch(e){}
}

/* ===== Student Dashboard ===== */
function openDashboard() {
  document.getElementById('dashboard-modal').classList.add('active');
  var saved = localStorage.getItem('sf_student_email');
  if (saved) { document.getElementById('dash-email').value = saved; loadDashboard(); }
}
function closeDashboard() { document.getElementById('dashboard-modal').classList.remove('active'); }

async function loadDashboard() {
  var email = document.getElementById('dash-email').value.trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) { alert('Please enter a valid email.'); return; }
  localStorage.setItem('sf_student_email', email);
  var body = document.getElementById('dashboard-body');
  document.getElementById('dashboard-login').classList.add('hidden');
  body.classList.remove('hidden');
  body.innerHTML = '<div class="text-center py-8 text-sm text-gray-400">Loading your dashboard...</div>';
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'student_dashboard', email:email }) });
    var data = await res.json();
    renderDashboard(data, email);
  } catch (e) {
    body.innerHTML = '<div class="text-center py-8 text-sm text-red-400">Could not load your dashboard. Try again.</div>';
  }
}

function renderDashboard(data, email) {
  var body = document.getElementById('dashboard-body');
  var my = data.myCourses || [];
  var more = (data.moreCourses || []).slice(0, 6);
  var completedCount = my.filter(function(c){ return c.completed; }).length;

  var myHTML = !my.length
    ? '<div class="glass rounded-xl p-6 text-center text-sm text-gray-500">No classes yet. Browse the classes below to get started 👇</div>'
    : my.map(function(c) {
        var progressPct = c.completed ? 100 : (c.quiz_total ? Math.round((c.quiz_score/c.quiz_total)*100) : 0);
        var statusChip = c.completed
          ? '<span class="badge-free text-xs px-3 py-1 rounded-full font-semibold">🎓 Completed</span>'
          : (c.payment_status === 'pending' ? '<span class="badge-pro text-xs px-3 py-1 rounded-full font-semibold">Payment Pending</span>' : '<span class="text-xs px-3 py-1 rounded-full font-semibold" style="background:rgba(59,130,246,.15);color:#93c5fd">In Progress</span>');
        return '<div class="glass rounded-xl p-4 mb-3">' +
          '<div class="flex justify-between items-center mb-2"><span class="font-semibold text-sm">'+esc(c.course_title)+'</span>'+statusChip+'</div>' +
          '<div class="w-full h-2 rounded-full bg-white/10 mb-2 overflow-hidden"><div class="h-full rounded-full" style="width:'+progressPct+'%;background:linear-gradient(90deg,#8b5cf6,#3b82f6)"></div></div>' +
          '<div class="flex justify-between items-center">' +
          '<span class="text-xs text-gray-500">' + (c.quiz_total ? 'Quiz: ' + c.quiz_score + '/' + c.quiz_total : 'Not started yet') + '</span>' +
          '<div class="flex gap-2">' +
          (c.course ? '<button onclick="resumeCourse(\''+esc(c.course_slug)+'\',\''+esc(c.name)+'\',\''+esc(email)+'\')" class="px-3 py-1.5 rounded-lg text-xs glass">Resume</button>' : '') +
          (c.completed ? '<button onclick="redownloadCertificate(\''+esc(c.name)+'\',\''+esc(c.course_title)+'\')" class="px-3 py-1.5 rounded-lg text-xs font-semibold" style="background:linear-gradient(90deg,#d4af37,#8b5cf6)">🎓 Certificate</button>' : '') +
          '</div></div></div>';
      }).join('');

  var moreHTML = !more.length ? '' : '<div class="grid md:grid-cols-3 gap-3 mt-2">' + more.map(function(c) {
    return '<div class="glass rounded-xl overflow-hidden cursor-pointer card-float" onclick="closeDashboard();openCourse(\''+esc(c.slug)+'\')">' +
      (c.thumbnail ? '<img src="'+esc(c.thumbnail)+'" class="w-full h-24 object-cover">' : '<div class="w-full h-24 bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center text-2xl">🎬</div>') +
      '<div class="p-3"><div class="text-xs font-semibold mb-1">'+esc(c.title)+'</div><div class="text-xs text-gray-500">'+(c.is_free?'Free':'₦'+Number(c.price_ngn||0).toLocaleString())+'</div></div></div>';
  }).join('') + '</div>';

  body.innerHTML =
    '<div class="grid grid-cols-3 gap-3 mb-5 text-center">' +
    '<div class="glass rounded-xl p-3"><div class="text-xl font-bold grad-text">'+my.length+'</div><div class="text-xs text-gray-500">Enrolled</div></div>' +
    '<div class="glass rounded-xl p-3"><div class="text-xl font-bold grad-text">'+completedCount+'</div><div class="text-xs text-gray-500">Completed</div></div>' +
    '<div class="glass rounded-xl p-3"><div class="text-xl font-bold grad-text">'+completedCount+'</div><div class="text-xs text-gray-500">Certificates</div></div>' +
    '</div>' +
    '<h4 class="font-semibold text-sm mb-2 text-gray-300">My Classes</h4>' + myHTML +
    (more.length ? '<h4 class="font-semibold text-sm mb-2 mt-5 text-gray-300">🔥 Explore More Classes</h4>' + moreHTML : '') +
    '<button onclick="document.getElementById(\'dashboard-login\').classList.remove(\'hidden\');document.getElementById(\'dashboard-body\').classList.add(\'hidden\')" class="w-full py-2 mt-5 text-xs text-gray-500">Switch email</button>';
}

function resumeCourse(slug, name, email) {
  closeDashboard();
  var course = allCourses.find(function(c){ return c.slug === slug; });
  if (!course) { alert('Class not found — it may have been removed.'); return; }
  currentEnrollment = { id: null, name: name, email: email, course: course };
  document.getElementById('enroll-title').textContent = course.title;
  document.getElementById('enroll-modal').classList.add('active');
  renderVideoStep(course);
}

function redownloadCertificate(name, courseTitle) {
  currentEnrollment = { name: name, course: { title: courseTitle } };
  downloadCertificate();
}

loadCourses();

