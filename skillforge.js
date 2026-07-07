/* ===== Config ===== */
var SKILLFORGE_URL = 'https://superagent-55bc0d3a.base44.app/functions/erogianSkillForge';
var UPLOAD_URL = 'https://superagent-55bc0d3a.base44.app/functions/erogianUpload';
var ADMIN_KEY = 'erogian_skillforge_admin_2026';
var UPLOAD_ADMIN_KEY = 'erogian_blog_admin_2026'; // shared upload utility uses the blog admin key
var WHATSAPP_NUMBER = '2347045560291';
var allCourses = [];
var currentFilter = 'all';
var uploadedThumbUrl = '';

function esc(s) { return (s||'').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function toEmbedUrl(url) {
  if (!url) return '';
  var yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return 'https://www.youtube.com/embed/' + yt[1];
  var vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return 'https://player.vimeo.com/video/' + vimeo[1];
  return url;
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
    var thumb = c.thumbnail ? '<img src="'+esc(c.thumbnail)+'" class="w-full h-40 object-cover" loading="lazy">' : '<div class="w-full h-40 bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center text-4xl">🎬</div>';
    var badge = c.is_free ? '<span class="badge-free text-xs px-3 py-1 rounded-full font-semibold">FREE</span>' : '<span class="badge-pro text-xs px-3 py-1 rounded-full font-semibold">₦'+Number(c.price_ngn||0).toLocaleString()+'</span>';
    var lock = c.is_free ? '' : '<div class="lock-overlay"><div class="text-3xl">🔒</div><div class="text-xs text-gray-300">Premium Class</div></div>';
    return '<div class="glass rounded-2xl overflow-hidden card-float cursor-pointer group" onclick="openCourse(\''+esc(c.slug)+'\')">' +
      '<div class="relative">' + thumb + lock + '</div>' +
      '<div class="p-5">' +
      '<div class="flex items-center justify-between mb-2"><span class="text-xs text-purple-300">'+esc(c.category)+' · '+esc(c.level)+'</span>'+badge+'</div>' +
      '<div class="font-semibold mb-2">'+esc(c.title)+'</div>' +
      '<div class="text-xs text-gray-500 mb-3">'+esc((c.description||'').slice(0,90))+'...</div>' +
      '<div class="text-xs text-gray-600">⏱ '+esc(c.duration||'')+' · '+ (c.enrolled_count||0) +' enrolled</div>' +
      '</div></div>';
  }).join('');
}

function openCourse(slug) {
  var course = allCourses.find(function(c){ return c.slug === slug; });
  if (!course) return;
  document.getElementById('enroll-title').textContent = course.title;
  var body = document.getElementById('enroll-body');
  if (course.is_free) {
    body.innerHTML =
      '<p class="text-sm text-gray-400 mb-4">'+esc(course.description)+'</p>' +
      '<div class="space-y-3 mb-4">' +
      '<input id="ef-name" placeholder="Your name" class="w-full rounded-xl px-4 py-3 text-sm">' +
      '<input id="ef-phone" placeholder="WhatsApp number" class="w-full rounded-xl px-4 py-3 text-sm">' +
      '</div>' +
      '<button onclick="startFreeClass(\''+esc(slug)+'\')" class="w-full py-3 rounded-full font-semibold" style="background:linear-gradient(90deg,#8b5cf6,#3b82f6)">Start Free Class →</button>';
  } else {
    var msg = encodeURIComponent('Hi! I want to enroll in "'+course.title+'" (₦'+Number(course.price_ngn||0).toLocaleString()+') on SkillForge.');
    body.innerHTML =
      '<p class="text-sm text-gray-400 mb-4">'+esc(course.description)+'</p>' +
      '<div class="glass rounded-xl p-4 mb-4 text-center"><div class="text-2xl font-bold grad-text">₦'+Number(course.price_ngn||0).toLocaleString()+'</div><div class="text-xs text-gray-500">One-time payment · Lifetime access</div></div>' +
      '<a href="https://wa.me/'+WHATSAPP_NUMBER+'?text='+msg+'" target="_blank" class="block text-center w-full py-3 rounded-full font-semibold" style="background:linear-gradient(90deg,#8b5cf6,#3b82f6)">Unlock on WhatsApp →</a>';
  }
  document.getElementById('enroll-modal').classList.add('active');
}

async function startFreeClass(slug) {
  var name = document.getElementById('ef-name').value.trim();
  var phone = document.getElementById('ef-phone').value.trim();
  if (!name || !phone) { alert('Please enter your name and WhatsApp number.'); return; }
  var course = allCourses.find(function(c){ return c.slug === slug; });
  try {
    await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'enroll', name:name, phone:phone, course_slug:slug, is_free:true }) });
  } catch(e) {}
  var embed = toEmbedUrl(course.video_url);
  var body = document.getElementById('enroll-body');
  if (embed) {
    body.innerHTML = '<div class="aspect-video rounded-xl overflow-hidden mb-4"><iframe src="'+esc(embed)+'" class="w-full h-full" allowfullscreen frameborder="0"></iframe></div><p class="text-sm text-gray-400">Enjoy the class! Have questions? <a href="https://wa.me/'+WHATSAPP_NUMBER+'" target="_blank" class="text-purple-300 underline">Message us on WhatsApp</a>.</p>';
  } else {
    body.innerHTML = '<div class="glass rounded-xl p-6 text-center text-sm text-gray-400">This class video is being added soon! We\'ll notify you on WhatsApp the moment it\'s live. <a href="https://wa.me/'+WHATSAPP_NUMBER+'" target="_blank" class="text-purple-300 underline block mt-2">Message us</a></div>';
  }
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
    loadAdminCourses();
  } else {
    alert('Incorrect key.');
  }
}
function closeAdminStudio() { document.getElementById('admin-studio-modal').classList.remove('active'); }

document.addEventListener('change', function(e) {
  if (e.target && e.target.id === 'cf-thumb-file') {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = async function() {
      document.getElementById('cf-thumb-preview').textContent = 'Uploading...';
      try {
        var base64 = reader.result.split(',')[1];
        if (file.size > 500000) { document.getElementById('cf-thumb-preview').textContent = 'Image too large (max 500KB)'; return; }
        var res = await fetch(UPLOAD_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ admin_key:UPLOAD_ADMIN_KEY, image:base64, filename:file.name, mime:file.type }) });
        var data = await res.json();
        if (data.status === 'ok') { uploadedThumbUrl = data.url; document.getElementById('cf-thumb-preview').textContent = 'Uploaded ✓'; }
        else { document.getElementById('cf-thumb-preview').textContent = 'Upload failed: ' + (data.message||''); }
      } catch (err) {
        document.getElementById('cf-thumb-preview').textContent = 'Upload failed';
      }
    };
    reader.readAsDataURL(file);
  }
});

async function saveCourse() {
  var title = document.getElementById('cf-title').value.trim();
  var video = document.getElementById('cf-video').value.trim();
  if (!title) { alert('Please enter a title.'); return; }
  var slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  var btn = document.getElementById('cf-save-btn');
  btn.textContent = 'Publishing...'; btn.disabled = true;
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
      action:'save', admin_key:ADMIN_KEY, title:title, slug:slug,
      description: document.getElementById('cf-description').value.trim(),
      category: document.getElementById('cf-category').value.trim() || 'General',
      level: document.getElementById('cf-level').value,
      video_url: video,
      thumbnail: uploadedThumbUrl,
      duration: document.getElementById('cf-duration').value.trim(),
      is_free: document.getElementById('cf-is-free').checked,
      price_ngn: parseInt(document.getElementById('cf-price').value) || 0,
      status: 'published'
    })});
    var data = await res.json();
    if (data.status === 'ok') { alert('Class published! 🎉'); closeAdminStudio(); window.location.reload(); }
    else { alert('Error: ' + (data.message||'unknown')); btn.textContent='Publish Class'; btn.disabled=false; }
  } catch (e) { alert('Network error'); btn.textContent='Publish Class'; btn.disabled=false; }
}

async function loadAdminCourses() {
  try {
    var res = await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'admin_list', admin_key:ADMIN_KEY }) });
    var data = await res.json();
    var list = document.getElementById('admin-course-list');
    list.innerHTML = (data.courses||[]).map(function(c) {
      return '<div class="flex justify-between items-center glass rounded-lg px-3 py-2"><span>'+esc(c.title)+' <span class="text-gray-600">('+(c.is_free?'Free':'₦'+c.price_ngn)+')</span></span><button onclick="deleteCourse(\''+c.id+'\')" class="text-red-400 text-xs">Delete</button></div>';
    }).join('') || '<div class="text-gray-600 text-xs">No classes yet.</div>';
  } catch (e) {}
}

async function deleteCourse(id) {
  if (!confirm('Delete this class?')) return;
  try { await fetch(SKILLFORGE_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'delete', admin_key:ADMIN_KEY, id:id }) }); loadAdminCourses(); } catch(e){}
}

loadCourses();
