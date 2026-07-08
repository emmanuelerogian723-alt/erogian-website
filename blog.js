/* ===== Config ===== */
var BLOG_URL = 'https://superagent-55bc0d3a.base44.app/functions/erogianBlog';
var UPLOAD_URL = 'https://superagent-55bc0d3a.base44.app/functions/erogianUpload';
var ADMIN_KEY = 'erogian_blog_admin_2026';
var editingPostId = null;
var allPosts = [];
var currentFilter = 'all';

/* ===== Markdown Parser with image support ===== */
function parseMD(md) {
  if (!md) return '';
  var html = md;
  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, function(m, lang, code) {
    return '<pre><code>' + escHTML(code.trim()) + '</code></pre>';
  });
  // Images — must come before links
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function(m, alt, url) {
    return '<img src="' + url + '" alt="' + escAttr(alt) + '" class="rounded-xl my-6 w-full" loading="lazy" onerror="this.style.display=\'none\'">';
  });
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  // Lists
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, function(m) { return '<ul>' + m + '</ul>'; });
  // Paragraphs
  html = html.split('\n\n').map(function(block) {
    if (block.startsWith('<')) return block;
    return '<p>' + block.trim().replace(/\n/g, '<br>') + '</p>';
  }).join('\n');
  return html;
}

function escHTML(s) { return (s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function esc(s) { return (s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s) { return (s||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

/* ===== AI Cover Image URL (Pollinations.ai — free, no key) ===== */
function generateCoverURL(prompt) {
  var enhanced = 'professional tech blog cover image, ' + prompt + ', modern, digital art, high quality, dark theme with purple and blue accents';
  return 'https://image.pollinations.ai/prompt/' + encodeURIComponent(enhanced) + '?width=1200&height=630&nologo=true&model=flux';
}

/* ===== Reading Progress Bar + Nav ===== */
window.addEventListener('scroll', function() {
  var h = document.documentElement;
  var scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  document.getElementById('progress-bar').style.width = scrolled + '%';
  var nav = document.getElementById('mainnav');
  if (window.scrollY > 60) { nav.classList.add('glass'); nav.style.paddingTop='8px'; nav.style.paddingBottom='8px'; }
  else { nav.classList.remove('glass'); nav.style.paddingTop=''; nav.style.paddingBottom=''; }
});

/* ===== Load Posts ===== */
async function loadPosts() {
  try {
    var res = await fetch(BLOG_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'list' }) });
    var data = await res.json();
    if (data.status === 'ok') {
      allPosts = data.posts;
      renderCategories(); renderFeatured(); renderGrid();
      document.getElementById('loading').classList.add('hidden');
      var hash = window.location.hash;
      if (hash.startsWith('#/post/')) openPost(hash.replace('#/post/',''));
    }
  } catch(e) { document.getElementById('loading').textContent = 'Failed to load. Please refresh.'; }
}

/* ===== Render Categories ===== */
function renderCategories() {
  var cats = ['all'];
  allPosts.forEach(function(p) { if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category); });
  document.getElementById('category-chips').innerHTML = cats.map(function(c) {
    return '<button class="chip ' + (c === currentFilter ? 'chip-active' : '') + '" onclick="filterPosts(\'' + c + '\')">' + (c === 'all' ? 'All Posts' : c) + '</button>';
  }).join('');
}

/* ===== Render Featured ===== */
function renderFeatured() {
  var featured = allPosts.find(function(p) { return p.featured; }) || allPosts[0];
  if (!featured) return;
  var d = new Date(featured.created_date).toLocaleDateString('en', { month:'short', day:'numeric', year:'numeric' });
  var coverHTML = featured.cover_image
    ? '<div class="aspect-[16/10] md:aspect-auto overflow-hidden"><img src="' + escAttr(featured.cover_image) + '" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="' + escAttr(featured.title) + '" onerror="this.parentElement.innerHTML=\'<div class=\\\"w-full h-full bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center\\\"><div class=\\\"text-6xl opacity-50\\\">✍️</div></div>\'"></div>'
    : '<div class="aspect-[16/10] md:aspect-auto bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center"><div class="text-6xl opacity-50">✍️</div></div>';
  document.getElementById('featured-post').innerHTML =
    '<div class="glass glow-border rounded-3xl overflow-hidden card-float cursor-pointer group" onclick="openPost(\'' + featured.slug + '\')">' +
    '<div class="grid md:grid-cols-2 gap-0">' + coverHTML +
    '<div class="p-8 md:p-10">' +
    '<div class="flex items-center gap-3 mb-4"><span class="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300">Featured</span><span class="text-xs text-gray-500">' + esc(featured.category) + '</span></div>' +
    '<h2 class="display text-2xl md:text-3xl font-bold mb-4 group-hover:grad-text transition">' + esc(featured.title) + '</h2>' +
    '<p class="text-gray-400 text-sm leading-relaxed mb-6">' + esc(featured.excerpt) + '</p>' +
    '<div class="flex items-center gap-4 text-xs text-gray-500"><span>By ' + esc(featured.author) + '</span><span>·</span><span>' + d + '</span><span>·</span><span>' + esc(featured.read_time) + '</span></div>' +
    '<div class="mt-6 text-sm font-semibold text-purple-400">Read article →</div></div></div></div>';
}

/* ===== Render Grid ===== */
function renderGrid() {
  var filtered = currentFilter === 'all' ? allPosts : allPosts.filter(function(p) { return p.category === currentFilter; });
  var featuredSlug = (allPosts.find(function(p) { return p.featured; }) || allPosts[0] || {}).slug;
  var gridPosts = filtered.filter(function(p) { return p.slug !== featuredSlug; });
  if (gridPosts.length === 0) { document.getElementById('no-results').classList.remove('hidden'); document.getElementById('posts-grid').innerHTML=''; return; }
  document.getElementById('no-results').classList.add('hidden');
  document.getElementById('posts-grid').innerHTML = gridPosts.map(function(p) {
    var d = new Date(p.created_date).toLocaleDateString('en', { month:'short', day:'numeric' });
    var coverHTML = p.cover_image
      ? '<div class="aspect-[16/9] overflow-hidden"><img src="' + escAttr(p.cover_image) + '" class="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt="' + escAttr(p.title) + '" loading="lazy" onerror="this.parentElement.innerHTML=\'<div class=\\\"w-full h-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center\\\"><div class=\\\"text-4xl opacity-40\\\">📄</div></div>\'"></div>'
      : '<div class="aspect-[16/9] bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center"><div class="text-4xl opacity-40">📄</div></div>';
    return '<div class="glass rounded-2xl overflow-hidden card-float cursor-pointer group" onclick="openPost(\'' + p.slug + '\')">' + coverHTML +
      '<div class="p-6"><div class="flex items-center gap-2 mb-3"><span class="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300">' + esc(p.category) + '</span><span class="text-xs text-gray-600">' + esc(p.read_time) + '</span></div>' +
      '<h3 class="font-semibold text-lg mb-2 group-hover:text-purple-300 transition">' + esc(p.title) + '</h3>' +
      '<p class="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">' + esc(p.excerpt) + '</p>' +
      '<div class="flex items-center justify-between text-xs text-gray-600"><span>' + d + '</span><span class="text-purple-400">Read →</span></div></div></div>';
  }).join('');
}

function filterPosts(cat) { currentFilter = cat; renderCategories(); renderFeatured(); renderGrid(); }

function searchPosts() {
  var q = document.getElementById('search-input').value.toLowerCase().trim();
  if (!q) { renderGrid(); return; }
  var results = allPosts.filter(function(p) {
    return (p.title||'').toLowerCase().includes(q) || (p.excerpt||'').toLowerCase().includes(q) || (p.tags||'').toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q);
  });
  document.getElementById('featured-post').innerHTML = '';
  if (results.length === 0) { document.getElementById('no-results').classList.remove('hidden'); document.getElementById('posts-grid').innerHTML=''; }
  else {
    document.getElementById('no-results').classList.add('hidden');
    document.getElementById('posts-grid').innerHTML = results.map(function(p) {
      var d = new Date(p.created_date).toLocaleDateString('en', { month:'short', day:'numeric' });
      var coverHTML = p.cover_image
        ? '<div class="aspect-[16/9] overflow-hidden"><img src="' + escAttr(p.cover_image) + '" class="w-full h-full object-cover" loading="lazy" alt="' + escAttr(p.title) + '"></div>'
        : '';
      return '<div class="glass rounded-2xl overflow-hidden card-float cursor-pointer group" onclick="openPost(\'' + p.slug + '\')">' + coverHTML +
        '<div class="p-6"><div class="flex items-center gap-2 mb-3"><span class="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300">' + esc(p.category) + '</span></div>' +
        '<h3 class="font-semibold text-lg mb-2 group-hover:text-purple-300 transition">' + esc(p.title) + '</h3>' +
        '<p class="text-sm text-gray-500 mb-3">' + esc(p.excerpt) + '</p>' +
        '<div class="text-xs text-gray-600">' + d + ' · ' + esc(p.read_time) + '</div></div></div>';
    }).join('');
  }
}
document.addEventListener('DOMContentLoaded', function() {
  var si = document.getElementById('search-input');
  if (si) si.addEventListener('keydown', function(e) { if (e.key === 'Enter') searchPosts(); });
});

/* ===== Open Single Post ===== */
async function openPost(slug) {
  window.location.hash = '#/post/' + slug;
  document.getElementById('blog-list-view').classList.add('hidden');
  document.getElementById('blog-article-view').classList.remove('hidden');
  document.getElementById('article-container').innerHTML = '<div class="text-center py-20 text-gray-500">Loading article...</div>';
  window.scrollTo(0, 0);
  try {
    var res = await fetch(BLOG_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'get', slug: slug }) });
    var data = await res.json();
    if (data.status !== 'ok') { document.getElementById('article-container').innerHTML = '<div class="text-center py-20 text-gray-500">Article not found. <a href="blog.html" class="text-purple-400">Back to blog</a></div>'; return; }
    var p = data.post;
    var d = new Date(p.created_date).toLocaleDateString('en', { month:'long', day:'numeric', year:'numeric' });
    var tagArr = (p.tags || '').split(',').filter(function(t) { return t.trim(); });
    var coverHTML = p.cover_image
      ? '<div class="aspect-[21/9] rounded-2xl overflow-hidden mb-10"><img src="' + escAttr(p.cover_image) + '" class="w-full h-full object-cover" alt="' + escAttr(p.title) + '"></div>'
      : '<div class="aspect-[21/9] rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center mb-10"><div class="text-5xl opacity-30">✍️</div></div>';
    var html = '<div class="fade-in">';
    html += '<a href="blog.html" onclick="backToList();return false;" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-8 transition">← Back to Blog</a>';
    html += '<div class="flex items-center gap-3 mb-4"><span class="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300">' + esc(p.category) + '</span><span class="text-xs text-gray-600">' + esc(p.read_time) + '</span></div>';
    html += '<h1 class="display text-3xl md:text-5xl font-bold leading-tight mb-6">' + esc(p.title) + '</h1>';
    html += '<div class="flex items-center gap-4 mb-8 pb-8 border-b border-white/10"><div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-lg">E</div><div><div class="font-semibold text-sm">' + esc(p.author) + '</div><div class="text-xs text-gray-500">' + d + ' · ' + (p.views||0) + ' views</div></div></div>';
    html += coverHTML;
    html += '<div class="article-content">' + parseMD(p.content) + '</div>';
    if (tagArr.length > 0) html += '<div class="flex flex-wrap gap-2 mt-10 pt-8 border-t border-white/10">' + tagArr.map(function(t) { return '<span class="px-3 py-1 rounded-full text-xs bg-white/5 text-gray-400">' + esc(t.trim()) + '</span>'; }).join('') + '</div>';
    html += '<div class="flex items-center gap-4 mt-8"><span class="text-sm text-gray-500">Share:</span>';
    html += '<a href="https://wa.me/?text=' + encodeURIComponent(p.title + ' — https://erogian.vercel.app/blog.html#/post/' + p.slug) + '" target="_blank" class="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition">💬</a>';
    html += '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(p.title) + '&url=' + encodeURIComponent('https://erogian.vercel.app/blog.html#/post/' + p.slug) + '" target="_blank" class="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition">𝕏</a>';
    html += '<button onclick="copyLink(\'' + p.slug + '\')" class="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition">🔗</button></div>';
    if (data.related && data.related.length > 0) {
      html += '<div class="mt-16 pt-10 border-t border-white/10"><h3 class="display text-xl font-bold mb-6">Related Articles</h3><div class="grid sm:grid-cols-3 gap-4">';
      data.related.forEach(function(r) {
        var rCover = r.cover_image ? '<div class="aspect-[16/9] overflow-hidden mb-3 rounded-lg"><img src="' + escAttr(r.cover_image) + '" class="w-full h-full object-cover" loading="lazy"></div>' : '';
        html += '<div class="glass rounded-xl p-4 card-float cursor-pointer" onclick="openPost(\'' + r.slug + '\')">' + rCover + '<div class="text-xs text-blue-300 mb-2">' + esc(r.category) + '</div><div class="font-semibold text-sm mb-2">' + esc(r.title) + '</div><div class="text-xs text-gray-600">Read →</div></div>';
      });
      html += '</div></div>';
    }
    html += '<div class="glass glow-border rounded-2xl p-8 mt-12 text-center"><div class="text-2xl mb-3">🚀</div><h3 class="display text-xl font-bold mb-2">Need Help Building Your Project?</h3><p class="text-gray-400 text-sm mb-5">From AI agents to full websites — we make it happen.</p><a href="index.html#book" class="inline-block px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transition">Book a Free Consultation</a></div></div>';
    document.getElementById('article-container').innerHTML = html;
    window.scrollTo(0, 0);
  } catch(e) { document.getElementById('article-container').innerHTML = '<div class="text-center py-20 text-gray-500">Failed to load. <a href="blog.html" class="text-purple-400">Back</a></div>'; }
}

function backToList() { window.location.hash=''; document.getElementById('blog-article-view').classList.add('hidden'); document.getElementById('blog-list-view').classList.remove('hidden'); window.scrollTo(0,0); }
function copyLink(slug) { navigator.clipboard.writeText('https://erogian.vercel.app/blog.html#/post/' + slug).then(function(){ alert('Link copied!'); }); }

/* ===== Admin / Writer Studio ===== */
function openAdmin() { document.getElementById('modal-admin').classList.add('active'); if (localStorage.getItem('erogian_blog_key')) showAdminPanel(); }
function closeAdmin() { document.getElementById('modal-admin').classList.remove('active'); }
document.getElementById('modal-admin')?.addEventListener('click', function(e) { if (e.target === this) closeAdmin(); });

function adminLogin() {
  var key = document.getElementById('admin-key-input').value.trim();
  if (key === ADMIN_KEY) { localStorage.setItem('erogian_blog_key', key); showAdminPanel(); }
  else alert('Wrong key. Hint: erogian_blog_admin_2026');
}
function showAdminPanel() { document.getElementById('admin-login-view').classList.add('hidden'); document.getElementById('admin-panel-view').classList.remove('hidden'); }
function showNewPost() {
  editingPostId = null;
  document.getElementById('admin-new-post').classList.remove('hidden');
  document.getElementById('admin-posts-list').classList.add('hidden');
  document.getElementById('edit-area').classList.add('hidden');
  document.getElementById('ai-topic').value = '';
  var pb = document.getElementById('publish-btn'); if (pb) pb.textContent = 'Publish';
}

/* ===== AI Generate ===== */
async function generateAI() {
  var topic = document.getElementById('ai-topic').value.trim();
  if (!topic) { alert('Please enter a topic'); return; }
  var cat = document.getElementById('ai-category').value;
  var style = document.getElementById('ai-style').value;
  var btn = document.getElementById('gen-btn');
  var status = document.getElementById('gen-status');
  btn.disabled = true; btn.textContent = '🤖 AI is writing...';
  status.classList.remove('hidden'); status.textContent = 'Generating article with Groq AI... ~10 seconds.';
  try {
    var res = await fetch(BLOG_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'ai_generate', admin_key:ADMIN_KEY, topic:topic, category:cat, style:style }) });
    var data = await res.json();
    if (data.status === 'ok') {
      status.classList.add('hidden'); btn.disabled = false; btn.textContent = '🤖 Regenerate';
      document.getElementById('edit-area').classList.remove('hidden');
      document.getElementById('edit-title').value = data.title || topic;
      document.getElementById('edit-excerpt').value = data.excerpt || '';
      document.getElementById('edit-category').value = data.category || cat;
      document.getElementById('edit-tags').value = data.tags || '';
      document.getElementById('edit-content').value = data.content || '';
      // Auto-generate AI cover image URL
      var coverURL = generateCoverURL(topic);
      document.getElementById('edit-cover').value = coverURL;
      previewCover(coverURL);
    } else { status.textContent = 'Error: ' + (data.message||'unknown'); btn.disabled=false; btn.textContent='🤖 Generate with AI'; }
  } catch(e) { status.textContent = 'Connection error'; btn.disabled=false; btn.textContent='🤖 Generate with AI'; }
}

/* ===== Cover Image Preview ===== */
function previewCover(url) {
  var preview = document.getElementById('cover-preview');
  if (!url) { preview.innerHTML = '<div class="text-gray-600 text-xs">No cover image set</div>'; return; }
  preview.innerHTML = '<img src="' + escAttr(url) + '" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML=\'<div class=\\\"text-red-400 text-xs p-4\\\">Failed to load image</div>\'">';
}

/* ===== AI Cover Generation ===== */
function generateAICover() {
  var title = document.getElementById('edit-title').value.trim() || document.getElementById('ai-topic').value.trim();
  if (!title) { alert('Enter a title or topic first'); return; }
  var url = generateCoverURL(title);
  document.getElementById('edit-cover').value = url;
  previewCover(url);
  alert('AI cover image generated! It will load in a few seconds (Pollinations.ai is processing it).');
}

/* ===== Image Upload from Device ===== */
async function uploadImageFile(inputEl) {
  var file = inputEl.files[0];
  if (!file) return;
  if (file.size > 500000) { alert('Image too large. Max 500KB. Please resize or compress your image.'); return; }
  var status = document.getElementById('upload-status');
  status.classList.remove('hidden'); status.textContent = 'Uploading ' + file.name + '...';
  try {
    var reader = new FileReader();
    reader.onload = async function(e) {
      var base64 = e.target.result.split(',')[1];
      var res = await fetch(UPLOAD_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ admin_key:ADMIN_KEY, image:base64, filename:file.name, mime:file.type }) });
      var data = await res.json();
      if (data.status === 'ok') {
        status.textContent = '✅ Uploaded!';
        status.classList.add('text-green-400');
        document.getElementById('edit-cover').value = data.url;
        previewCover(data.url);
        setTimeout(function(){ status.classList.add('hidden'); status.classList.remove('text-green-400'); }, 2000);
      } else {
        status.textContent = '❌ ' + (data.message || 'Upload failed');
        status.classList.add('text-red-400');
      }
    };
    reader.readAsDataURL(file);
  } catch(e) { status.textContent = '❌ Error: ' + e; }
}

/* ===== Insert Image into Content ===== */
async function insertImageIntoContent(inputEl) {
  var file = inputEl.files[0];
  if (!file) return;
  if (file.size > 500000) { alert('Image too large. Max 500KB.'); return; }
  var textarea = document.getElementById('edit-content');
  var status = document.getElementById('upload-status');
  status.classList.remove('hidden'); status.textContent = 'Uploading image for content...';
  try {
    var reader = new FileReader();
    reader.onload = async function(e) {
      var base64 = e.target.result.split(',')[1];
      var res = await fetch(UPLOAD_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ admin_key:ADMIN_KEY, image:base64, filename:file.name, mime:file.type }) });
      var data = await res.json();
      if (data.status === 'ok') {
        var markdown = '\n\n![' + file.name.replace(/\.[^.]+$/, '') + '](' + data.url + ')\n\n';
        var pos = textarea.selectionStart || textarea.value.length;
        textarea.value = textarea.value.substring(0, pos) + markdown + textarea.value.substring(pos);
        status.textContent = '✅ Image inserted into content!';
        status.classList.add('text-green-400');
        setTimeout(function(){ status.classList.add('hidden'); status.classList.remove('text-green-400'); }, 2000);
      } else {
        status.textContent = '❌ ' + (data.message || 'Upload failed');
        status.classList.add('text-red-400');
      }
    };
    reader.readAsDataURL(file);
  } catch(e) { status.textContent = '❌ Error'; }
}

/* ===== Publish / Save Draft ===== */
async function publishPost() { var t=document.getElementById('edit-title').value.trim(); if(!t){alert('Title required');return;} await savePost('published'); }
async function saveDraft() { var t=document.getElementById('edit-title').value.trim(); if(!t){alert('Title required');return;} await savePost('draft'); }

async function savePost(status) {
  var title = document.getElementById('edit-title').value.trim();
  var slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  var payload = {
    action:'save', admin_key:ADMIN_KEY, title:title, slug:slug,
    excerpt:document.getElementById('edit-excerpt').value,
    content:document.getElementById('edit-content').value,
    category:document.getElementById('edit-category').value,
    tags:document.getElementById('edit-tags').value,
    cover_image:document.getElementById('edit-cover').value,
    meta_description: document.getElementById('edit-meta-desc').value || document.getElementById('edit-excerpt').value,
    read_time:'5 min read', status:status,
    featured: document.getElementById('edit-featured').checked,
    author:'Emmanuel Ene Rejoice'
  };
  if (editingPostId) payload.id = editingPostId;
  try {
    var res = await fetch(BLOG_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    var data = await res.json();
    if (data.status === 'ok') { alert(status==='published' ? 'Published! 🎉' : 'Draft saved!'); closeAdmin(); window.location.reload(); }
    else alert('Error: ' + data.message);
  } catch(e) { alert('Connection error'); }
}

function cancelEdit() {
  editingPostId = null;
  document.getElementById('edit-area').classList.add('hidden');
  document.getElementById('admin-new-post').classList.add('hidden');
  loadAdminPosts();
}

async function editPost(id) {
  try {
    var res = await fetch(BLOG_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'admin_list', admin_key:ADMIN_KEY }) });
    var data = await res.json();
    var p = (data.posts||[]).find(function(x){ return x.id === id; });
    if (!p) { alert('Could not load post'); return; }
    editingPostId = id;
    document.getElementById('admin-posts-list').classList.add('hidden');
    document.getElementById('admin-new-post').classList.remove('hidden');
    document.getElementById('gen-status').classList.add('hidden');
    document.getElementById('edit-area').classList.remove('hidden');
    document.getElementById('edit-title').value = p.title || '';
    document.getElementById('edit-excerpt').value = p.excerpt || '';
    document.getElementById('edit-category').value = p.category || '';
    document.getElementById('edit-tags').value = p.tags || '';
    document.getElementById('edit-cover').value = p.cover_image || '';
    document.getElementById('edit-meta-desc').value = p.meta_description || '';
    document.getElementById('edit-featured').checked = !!p.featured;
    document.getElementById('edit-content').value = p.content || '';
    previewCover(p.cover_image || '');
    var pb = document.getElementById('publish-btn'); if (pb) pb.textContent = 'Save Changes';
  } catch (e) { alert('Could not load post for editing'); }
}

/* ===== Admin Posts List ===== */
async function loadAdminPosts() {
  document.getElementById('admin-new-post').classList.add('hidden');
  document.getElementById('admin-posts-list').classList.remove('hidden');
  var c = document.getElementById('admin-posts-list'); c.innerHTML = '<div class="text-gray-400 text-sm">Loading...</div>';
  try {
    var res = await fetch(BLOG_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'admin_list', admin_key:ADMIN_KEY }) });
    var data = await res.json();
    if (data.status === 'ok') {
      c.innerHTML = data.posts.map(function(p) {
        var cover = p.cover_image ? '<img src="'+escAttr(p.cover_image)+'" class="w-12 h-12 rounded-lg object-cover">' : '<div class="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">📄</div>';
        return '<div class="glass rounded-xl p-4 flex items-center gap-4"><div>'+cover+'</div><div class="flex-1"><div class="font-semibold text-sm">'+(p.featured?'⭐ ':'')+esc(p.title)+'</div><div class="text-xs text-gray-500 mt-1">'+esc(p.category)+' · '+esc(p.status)+' · '+(p.views||0)+' views</div></div><div class="flex gap-2"><button onclick="editPost(\''+p.id+'\')" class="px-3 py-1.5 rounded-lg text-xs bg-blue-500/20 text-blue-300">Edit</button><button onclick="deletePost(\''+p.id+'\',\''+esc(p.title)+'\')" class="px-3 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-300">Delete</button></div></div>';
      }).join('');
    }
  } catch(e) { c.innerHTML = '<div class="text-red-400 text-sm">Failed to load</div>'; }
}

async function deletePost(id, title) {
  if (!confirm('Delete "'+title+'"?')) return;
  try { await fetch(BLOG_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'delete', admin_key:ADMIN_KEY, id:id }) }); loadAdminPosts(); } catch(e){}
}

/* ===== Init ===== */
loadPosts();
