/* ===== Config ===== */
var APP_BASE = 'https://superagent-55bc0d3a.base44.app/functions/';
var WA_URL = 'https://wa.me/2347045560291';

/* ===== Session ID ===== */
function getSessionId(){
  var k = 'erogian_sid';
  var id = sessionStorage.getItem(k);
  if(!id){ id = 'sess_' + Math.random().toString(36).slice(2); sessionStorage.setItem(k, id); }
  return id;
}

/* ===== Booking flash ===== */
(function(){
  var msgs = [
    'Someone from Lagos just booked a Website — 2 hrs ago',
    'A startup in Abuja requested an AI Agent — 4 hrs ago',
    'Brand Identity project booked from Enugu — 1 hr ago',
    'New SaaS project inquiry from Port Harcourt — 30 min ago'
  ];
  var i = 0;
  function show(){
    var b = document.createElement('div');
    b.style.cssText = 'position:fixed;bottom:90px;left:16px;z-index:9999;background:rgba(10,12,16,.95);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px 14px;font-size:12px;color:#d1d5db;max-width:240px;box-shadow:0 4px 20px rgba(0,0,0,.5)';
    b.innerHTML = '🔔 ' + msgs[i % msgs.length];
    document.body.appendChild(b);
    setTimeout(function(){ b.style.transition='opacity .5s'; b.style.opacity='0'; setTimeout(function(){ b.remove(); }, 600); }, 5000);
    i++;
    setTimeout(show, 18000);
  }
  setTimeout(show, 6000);
})();

/* ===== Particle canvas ===== */
(function(){
  var canvas = document.getElementById('particle-canvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H, particles = [];
  function resize(){ W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  for(var i=0;i<70;i++){
    particles.push({x:Math.random()*2000, y:Math.random()*900, vx:(Math.random()-.5)*.4, vy:(Math.random()-.5)*.4, r:Math.random()*2+1});
  }
  function loop(){
    ctx.clearRect(0,0,W,H);
    particles.forEach(function(p){
      p.x += p.vx; p.y += p.vy;
      if(p.x<0)p.x=W; if(p.x>W)p.x=0;
      if(p.y<0)p.y=H; if(p.y>H)p.y=0;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle='rgba(139,92,246,0.5)'; ctx.fill();
    });
    for(var a=0;a<particles.length;a++){
      for(var b=a+1;b<particles.length;b++){
        var dx=particles[a].x-particles[b].x, dy=particles[a].y-particles[b].y;
        var d=Math.sqrt(dx*dx+dy*dy);
        if(d<120){
          ctx.beginPath(); ctx.moveTo(particles[a].x,particles[a].y); ctx.lineTo(particles[b].x,particles[b].y);
          ctx.strokeStyle='rgba(59,130,246,'+(1-d/120)*.15+')'; ctx.lineWidth=1; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ===== Hero reveal (pure JS — no GSAP dependency) ===== */
(function(){
  var heroEls = document.querySelectorAll('[data-hero-tag],[data-hero-title],[data-hero-sub],[data-hero-cta]');
  heroEls.forEach(function(el){ el.style.transform = 'translateY(24px)'; el.style.opacity = '0'; });
  function reveal(){
    heroEls.forEach(function(el, i){
      setTimeout(function(){
        el.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * 220);
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(reveal, 200); });
  } else {
    setTimeout(reveal, 200);
  }
  window.addEventListener('load', reveal);
})();

/* ===== Float animation ===== */
(function(){
  document.querySelectorAll('[data-float]').forEach(function(el, i){
    var angle = Math.random() * Math.PI * 2;
    var speed = 0.025 + i * 0.008;
    var amp = 10 + i * 3;
    (function tick(){ angle += speed; el.style.transform = 'translateY(' + (Math.sin(angle)*amp) + 'px)'; requestAnimationFrame(tick); })();
  });
})();

/* ===== Nav scroll ===== */
var nav = document.getElementById('mainnav');
window.addEventListener('scroll', function(){
  if(window.scrollY > 60){ nav.classList.add('glass'); nav.style.paddingTop='8px'; nav.style.paddingBottom='8px'; }
  else { nav.classList.remove('glass'); nav.style.paddingTop=''; nav.style.paddingBottom=''; }
}, {passive:true});

/* ===== Counters ===== */
(function(){
  var done = false;
  function runCounters(){
    if(done) return; done = true;
    document.querySelectorAll('.counter').forEach(function(el){
      var target = parseInt(el.dataset.count, 10);
      var suffix = target === 98 ? '%' : '+';
      var current = 0;
      var step = Math.max(1, Math.ceil(target / 80));
      var timer = setInterval(function(){
        current = Math.min(current + step, target);
        el.textContent = current + suffix;
        if(current >= target) clearInterval(timer);
      }, 20);
    });
  }
  var observer = new IntersectionObserver(function(entries){
    if(entries.some(function(e){ return e.isIntersecting; })) runCounters();
  }, {threshold: 0.2});
  document.querySelectorAll('.counter').forEach(function(el){ observer.observe(el); });
  // Fallback: run after 3s if not triggered
  setTimeout(runCounters, 3000);
})();

/* ===== Services — 20 Flip Cards ===== */
(function(){
  var services = [
    ['🌐','Website Development','Responsive, SEO-ready, with WhatsApp integration. Delivered in 3–7 days.'],
    ['📱','Mobile Apps','Cross-platform apps using React Native with auth, payments & push notifications.'],
    ['🤖','AI Automation','Custom automations that save hours daily — lead capture to client follow-ups.'],
    ['🧠','AI Agents','Smart agents that handle queries, bookings, or internal tasks 24/7.'],
    ['✈️','Telegram Bots','Sell, manage, engage — all inside Telegram. Paystack & subscriptions included.'],
    ['💬','WhatsApp Bots','Auto-reply bots, order flow, payment links and lead capture for WhatsApp.'],
    ['🛠️','Custom Software','Internal tools, dashboards, CRMs — built exactly for how your team works.'],
    ['🎨','Brand Identity','Logo, colours, typography, brand guide — everything for a consistent look.'],
    ['🖋️','Logo Design','Premium logos with unlimited revisions in AI, PNG, and SVG formats.'],
    ['🎬','Video Editing','Reels, YouTube, promos — edited with captions & motion graphics.'],
    ['✨','Motion Graphics','Animated logos, intros, explainers and social content that stops the scroll.'],
    ['🧩','UI/UX Design','Figma prototypes, user flows, wireframes — designed for conversion.'],
    ['🏢','Business Systems','Admin panels, inventory, booking managers for your exact operations.'],
    ['☁️','Cloud Deployment','Deploy on Vercel, Render, AWS or DigitalOcean with CI/CD pipelines.'],
    ['🔌','API Development','RESTful APIs, webhooks, third-party integrations — built for speed.'],
    ['🛒','E-commerce','Product pages, cart, Paystack checkout — fully optimised to sell.'],
    ['📄','Landing Pages','Single-page sites built to turn visitors into paying clients.'],
    ['🚀','SaaS Development','Full-stack SaaS: auth, billing, dashboard, user management — production ready.'],
    ['🎓','Educational Platforms','Course platforms with video, quizzes, certificates & student dashboards.'],
    ['💳','Payment Integration','Paystack, Stripe & Flutterwave — seamless checkout for any business model.']
  ];
  var sgrid = document.getElementById('services-grid');
  if(!sgrid) return;
  sgrid.innerHTML = '';
  sgrid.className = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';
  services.forEach(function(s){
    var waLink = 'https://wa.me/2347045560291?text=' + encodeURIComponent('Hi Erogian! I need ' + s[1]);
    var card = document.createElement('div');
    card.className = 'flip-container';
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-label', s[1]);
    card.innerHTML =
      '<div class="flip-card">' +
        '<div class="flip-front">' +
          '<div style="font-size:2rem;margin-bottom:0.5rem">' + s[0] + '</div>' +
          '<div style="font-weight:600;font-size:0.8rem;line-height:1.3">' + s[1] + '</div>' +
          '<div style="font-size:0.65rem;color:#6b7280;margin-top:0.4rem">tap to learn more</div>' +
        '</div>' +
        '<div class="flip-back">' +
          '<div style="font-size:1.4rem;margin-bottom:0.4rem">' + s[0] + '</div>' +
          '<div style="font-size:0.65rem;color:#a78bfa;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem">' + s[1] + '</div>' +
          '<p style="font-size:0.7rem;color:#d1d5db;line-height:1.45;margin-bottom:0.7rem">' + s[2] + '</p>' +
          '<a href="' + waLink + '" target="_blank" onclick="event.stopPropagation()" style="display:inline-block;padding:0.3rem 0.9rem;border-radius:9999px;font-size:0.7rem;font-weight:600;background:linear-gradient(90deg,#8b5cf6,#3b82f6);color:#fff;text-decoration:none">Get This →</a>' +
        '</div>' +
      '</div>';
    card.addEventListener('click', function(){ this.classList.toggle('flipped'); });
    card.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); this.classList.toggle('flipped'); }});
    sgrid.appendChild(card);
  });
})();

/* ===== Portfolio ===== */
(function(){
  var PB = 'https://base44.app/api/apps/6a3e59929cb482183c6b0370/files/mp/public/6a3e59929cb482183c6b0370/';
  var portfolio = [
    [PB+'81409901a_b866a7493_whatsapp_image_989662273880892.jpg','WDS Nigeria — Youth Conference 2026','Full event branding & flyer design'],
    [PB+'85f617b52_f534707b2_whatsapp_image_1530346825404106.jpg','Spice Kitchen Book','Complete book cover design, front & back'],
    [PB+'d97c54327_6e42a3586_whatsapp_image_1773590597336939.jpg','Rainbow Palm Oil','Product packaging & promotional design'],
    [PB+'404f5f9b9_3698b4fa8_whatsapp_image_1716239642906492.jpg','WDS Arts & Culture Exhibition','Exhibition promo campaign design'],
    [PB+'566a9369d_e9085c280_whatsapp_image_1600780008312807.jpg','Velora AI Agent','Full brand & logo design for AI startup'],
    [PB+'983f78b55_9b0b12657_whatsapp_image_1728823008155812.jpg','Arts & Culture Campaign v1','Alternate campaign concept design']
  ];
  var pgrid = document.getElementById('portfolio-grid');
  if(!pgrid) return;
  portfolio.forEach(function(p){
    pgrid.innerHTML += '<div class="glass rounded-2xl overflow-hidden card-float group"><div class="aspect-[4/5] overflow-hidden"><img src="'+p[0]+'" alt="'+p[1]+'" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition duration-500"></div><div class="p-4"><div class="font-semibold text-sm mb-1">'+p[1]+'</div><div class="text-xs text-gray-500">'+p[2]+'</div></div></div>';
  });
})();

/* ===== Testimonials ===== */
(function(){
  var testimonials = [
    ["It's beautiful — exactly what we needed for the announcement.",'WDS Nigeria GTA Team','Youth Conference Organizers'],
    ['"Rainbow Palm Oil finally looks like the premium brand it is."','Gladys Chekwube','Rainbow Palm Oil, Enugu'],
    ['"The book cover captured exactly the warmth I wanted readers to feel."','Ebere Ugwu','Author, Spice Kitchen Book'],
    ['"Fast, professional, and genuinely creative. Erogian gets the brief right."','Event Committee','WDS Arts & Culture Exhibition']
  ];
  var track = document.getElementById('testimonial-track');
  if(!track) return;
  testimonials.concat(testimonials).forEach(function(t){
    track.innerHTML += '<div class="glass rounded-2xl p-6 w-80 shrink-0"><div class="text-yellow-400 text-sm mb-3">★★★★★</div><div class="text-sm text-gray-300 mb-4">'+t[0]+'</div><div class="font-semibold text-sm">'+t[1]+'</div><div class="text-xs text-gray-500">'+t[2]+'</div></div>';
  });
})();

/* ===== Pricing ===== */
(function(){
  var pricing = [
    ['Starter Graphics','2,000',2000,['Simple flyer','Social media post','Basic edits','48-hour delivery'],false],
    ['Creative Pack','5,000',5000,['Logo','Business flyer','Social media kit'],false],
    ['Brand Starter','10,000',10000,['Professional logo','Brand colors & typography','Brand guide','Social graphics'],false],
    ['Business Website','25,000',25000,['Responsive website','SEO','Contact form','WhatsApp integration','Analytics'],true],
    ['Business Pro','50,000',50000,['Premium website','Dashboard & CMS','Blog','Payment integration','SEO & animations'],false],
    ['AI Business','75,000',75000,['Everything in Pro','AI chatbot','Automation','Booking system','CRM & analytics'],false],
    ['Enterprise','100,000+',100000,['Everything','AI automation','Custom software','Admin dashboard','Dedicated support'],false]
  ];
  var pricegrid = document.getElementById('pricing-grid');
  if(!pricegrid) return;
  pricing.forEach(function(p){
    var title=p[0], dp=p[1], np=p[2], feats=p[3], highlight=p[4];
    var isEnt = title === 'Enterprise';
    var html = '<div class="rounded-2xl p-6 card-float '+(highlight?'glow-border bg-gradient-to-b from-purple-500/10 to-blue-500/10 border border-purple-400/30':'glass')+'">';
    if(highlight) html += '<div class="text-xs font-semibold text-purple-300 mb-2">MOST POPULAR</div>';
    html += '<div class="font-semibold mb-1">'+title+'</div><div class="display text-3xl font-bold mb-4">₦'+dp+'</div><ul class="space-y-2 text-sm text-gray-400 mb-6">';
    feats.forEach(function(f){ html += '<li>✓ '+f+'</li>'; });
    html += '</ul>';
    if(isEnt){
      html += '<a href="https://wa.me/2347045560291" target="_blank" class="block text-center py-2.5 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/20 transition">Contact Us</a>';
    } else {
      html += '<button type="button" onclick="openPaymentModal(\''+title+'\','+np+')" class="pay-btn block w-full text-center py-2.5 rounded-full text-sm font-semibold transition">Pay Now with Paystack</button>';
    }
    html += '</div>';
    pricegrid.innerHTML += html;
  });
})();

/* ===== Estimator ===== */
var estSel = {}, estCx = 3, estSp = 1.0;
var cxLabels = ['','Basic','Simple','Standard','Advanced','Complex'];
function updEst(){
  var base = 0;
  Object.keys(estSel).forEach(function(k){ base += estSel[k]; });
  var mult = (0.6 + estCx * 0.2) * estSp;
  var total = Math.round(base * mult);
  var el = document.getElementById('est-total');
  if(el) el.textContent = '₦' + total.toLocaleString();
  var svc = Object.keys(estSel).join(', ') || 'No services selected';
  var msg = 'Hi Erogian! I used your estimator. Services: '+svc+'. Complexity: '+cxLabels[estCx]+'. Estimated: ₦'+total.toLocaleString()+'. I would like to discuss my project.';
  var wa = document.getElementById('est-whatsapp');
  if(wa) wa.href = 'https://wa.me/2347045560291?text=' + encodeURIComponent(msg);
}
document.querySelectorAll('#est-services .est-chip').forEach(function(btn){
  btn.addEventListener('click', function(){
    var s = btn.dataset.svc, p = +btn.dataset.price;
    if(estSel[s]){ delete estSel[s]; btn.classList.remove('chip-active'); }
    else { estSel[s] = p; btn.classList.add('chip-active'); }
    updEst();
  });
});
document.querySelectorAll('#est-timeline .est-chip').forEach(function(btn){
  btn.addEventListener('click', function(){
    estSp = +btn.dataset.speed;
    document.querySelectorAll('#est-timeline .est-chip').forEach(function(b){ b.classList.remove('chip-active'); });
    btn.classList.add('chip-active');
    updEst();
  });
});
var estCplx = document.getElementById('est-complexity');
if(estCplx) estCplx.addEventListener('input', function(e){
  estCx = +e.target.value;
  var lbl = document.getElementById('est-complexity-label');
  if(lbl) lbl.textContent = cxLabels[estCx] + ' project';
  updEst();
});
var firstChip = document.querySelector('#est-timeline .est-chip');
if(firstChip) firstChip.click();
updEst();

/* ===== Payment Modal ===== */
function openPaymentModal(plan, amount){
  document.getElementById('modal-plan').textContent = plan;
  document.getElementById('modal-amount').textContent = '₦' + amount.toLocaleString();
  document.getElementById('modal-amount-val').value = amount;
  document.getElementById('modal-plan-val').value = plan;
  var overlay = document.getElementById('payment-modal-overlay');
  if(overlay){ overlay.classList.remove('hidden'); overlay.classList.add('flex'); }
}
var pmClose = document.getElementById('pm-close');
if(pmClose) pmClose.addEventListener('click', function(){
  var overlay = document.getElementById('payment-modal-overlay');
  if(overlay){ overlay.classList.add('hidden'); overlay.classList.remove('flex'); }
});
var payForm = document.getElementById('payment-form');
if(payForm) payForm.addEventListener('submit', function(e){
  e.preventDefault();
  var email = document.getElementById('pay-email').value;
  var amount = +document.getElementById('modal-amount-val').value * 100;
  var plan = document.getElementById('modal-plan-val').value;
  if(typeof PaystackPop !== 'undefined'){
    var handler = PaystackPop.setup({
      key: 'pk_live_your_paystack_key',
      email: email, amount: amount, currency: 'NGN',
      metadata: { plan: plan },
      callback: function(res){
        alert('Payment successful! Reference: ' + res.reference + '\nWe will confirm your project within 2 hours.');
        var overlay = document.getElementById('payment-modal-overlay');
        if(overlay){ overlay.classList.add('hidden'); overlay.classList.remove('flex'); }
      },
      onClose: function(){}
    });
    handler.openIframe();
  } else {
    window.open('https://wa.me/2347045560291?text=' + encodeURIComponent('I want to pay ₦' + (amount/100).toLocaleString() + ' for ' + plan), '_blank');
  }
});

/* ===== Chatbot ===== */
var chatBody = document.getElementById('chat-body');
var chatInput = document.getElementById('chat-input');
var mode = 'ai', step = 0, lead = {};
var flow = [
  {q:"Great — let's get your project details. What's your name?", key:'name'},
  {q:"Nice to meet you! What's your email address?", key:'email'},
  {q:"And a phone number (WhatsApp preferred) so we can reach you?", key:'phone'},
  {q:"What's your business or brand name?", key:'business_name'},
  {q:"Which service are you interested in? (e.g. Website, AI Agent, Branding, Logo, Automation)", key:'service'},
  {q:"What's your budget range in Naira?", key:'budget'},
  {q:"Tell me briefly about your project.", key:'project_description'},
  {q:"Last one — what's your preferred day/time for a quick call?", key:'preferred_meeting_time'}
];
function linkify(text){
  return text.replace(/(https?:\/\/[^\s]+)/g, function(u){ return '<a href="'+u+'" target="_blank" class="chat-link">'+u+'</a>'; });
}
function addBot(msg){
  if(!chatBody) return;
  chatBody.innerHTML += '<div class="chat-bubble-enter glass rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">'+linkify(msg).replace(/\n/g,'<br>')+'</div>';
  chatBody.scrollTop = chatBody.scrollHeight;
}
function addUser(msg){
  if(!chatBody) return;
  chatBody.innerHTML += '<div class="chat-bubble-enter bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] ml-auto text-right">'+msg+'</div>';
  chatBody.scrollTop = chatBody.scrollHeight;
}
function addQuickActions(actions){
  if(!actions || !actions.length || !chatBody) return;
  var wrap = document.createElement('div');
  wrap.className = 'chat-bubble-enter flex flex-wrap gap-2';
  actions.forEach(function(a){
    if(a.type==='pay'){
      var btn = document.createElement('button'); btn.type='button';
      btn.className='text-xs px-3 py-2 rounded-full pay-btn font-semibold';
      btn.textContent='💳 '+a.label;
      btn.addEventListener('click', function(){ openPaymentModal(a.plan, a.amount); });
      wrap.appendChild(btn);
    } else if(a.type==='link'){
      var link = document.createElement('a'); link.href=a.url; link.target='_blank';
      link.className='text-xs px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition font-semibold inline-block';
      link.textContent=a.label; wrap.appendChild(link);
    } else if(a.type==='scroll'){
      var sbtn = document.createElement('button'); sbtn.type='button';
      sbtn.className='text-xs px-3 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 font-semibold';
      sbtn.textContent=a.label;
      sbtn.addEventListener('click', function(){
        var el = document.querySelector(a.target);
        if(el) el.scrollIntoView({behavior:'smooth'});
        var cw = document.getElementById('chat-window');
        if(cw){ cw.classList.add('hidden'); cw.classList.remove('flex'); }
      });
      wrap.appendChild(sbtn);
    }
  });
  chatBody.appendChild(wrap); chatBody.scrollTop = chatBody.scrollHeight;
}
function addStandardQR(){
  if(!chatBody) return;
  var qr = document.createElement('div');
  qr.className = 'chat-bubble-enter flex flex-wrap gap-2';
  qr.innerHTML = '<button type="button" class="qr-pricing text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition">💰 Pricing</button><button type="button" class="qr-payment text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition">💳 Pay Now</button><button type="button" class="qr-whatsapp text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition">💬 WhatsApp</button><button type="button" class="qr-services text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition">🛠️ Services</button>';
  chatBody.appendChild(qr); chatBody.scrollTop = chatBody.scrollHeight;
  qr.querySelector('.qr-pricing').addEventListener('click', function(){ addUser('How much do your services cost?'); sendToAI('How much do your services cost?'); });
  qr.querySelector('.qr-payment').addEventListener('click', function(){ addUser('I want to pay now'); sendToAI('I want to pay now'); });
  qr.querySelector('.qr-whatsapp').addEventListener('click', function(){ addUser('What is your WhatsApp number?'); sendToAI('What is your WhatsApp number?'); });
  qr.querySelector('.qr-services').addEventListener('click', function(){ addUser('What services do you offer?'); sendToAI('What services do you offer?'); });
}
function addQuoteButton(){
  if(!chatBody) return;
  var wrap = document.createElement('div'); wrap.className = 'chat-bubble-enter';
  wrap.innerHTML = '<button type="button" id="quote-btn" class="text-xs px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 font-semibold">📋 Get a Project Quote</button>';
  chatBody.appendChild(wrap); chatBody.scrollTop = chatBody.scrollHeight;
  document.getElementById('quote-btn').addEventListener('click', function(){ mode='lead'; step=0; lead={}; addBot(flow[0].q); });
}
function startChat(){
  if(!chatBody || chatBody.children.length > 0) return;
  setTimeout(function(){ addBot("Hey! 👋 I'm the Erogian AI assistant. I can help with pricing, payments, services, or connect you with the team."); }, 300);
  setTimeout(addStandardQR, 800);
  setTimeout(addQuoteButton, 1200);
}
async function sendToAI(msg){
  if(!chatBody) return;
  var tid = 't' + Date.now();
  var typingDiv = document.createElement('div');
  typingDiv.className = 'chat-bubble-enter glass rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-gray-400';
  typingDiv.id = tid; typingDiv.textContent = 'typing…';
  chatBody.appendChild(typingDiv); chatBody.scrollTop = chatBody.scrollHeight;
  try{
    var res = await fetch(APP_BASE + 'erogianChat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message:msg, session_id:getSessionId()}) });
    var data = await res.json();
    var t = document.getElementById(tid); if(t) t.remove();
    addBot(data.reply || "Sorry, could you rephrase?");
    if(data.quickActions && data.quickActions.length) addQuickActions(data.quickActions);
    else setTimeout(addStandardQR, 400);
  } catch(e){
    var t2 = document.getElementById(tid); if(t2) t2.remove();
    addBot("I'm having trouble connecting. Reach Emmanuel directly: " + WA_URL);
  }
}
async function submitLead(){
  try{ await fetch(APP_BASE + 'submitErogianLead', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(lead)}); } catch(e){}
}
var chatLauncher = document.getElementById('chat-launcher');
if(chatLauncher) chatLauncher.addEventListener('click', function(){
  var win = document.getElementById('chat-window');
  if(!win) return;
  var hidden = win.classList.contains('hidden');
  win.classList.toggle('hidden'); win.classList.toggle('flex');
  if(hidden) startChat();
});
var chatClose = document.getElementById('chat-close');
if(chatClose) chatClose.addEventListener('click', function(){
  var win = document.getElementById('chat-window');
  if(win){ win.classList.add('hidden'); win.classList.remove('flex'); }
});
function handleSend(){
  if(!chatInput) return;
  var v = chatInput.value.trim(); if(!v) return;
  addUser(v); chatInput.value = '';
  if(mode === 'lead'){
    lead[flow[step].key] = v; step++;
    if(step < flow.length){ setTimeout(function(){ addBot(flow[step].q); }, 500); }
    else {
      setTimeout(function(){
        addBot("Perfect — got everything! 🙌 Sending to the team now. You'll hear back on WhatsApp shortly."); submitLead(); mode = 'ai';
        setTimeout(function(){ addBot("Need anything else?\n\nWhatsApp: " + WA_URL); addStandardQR(); }, 1500);
      }, 500);
    }
  } else { sendToAI(v); }
}
// Alias for inline onclick in index.html
function sendChat(){ handleSend(); }
var chatSend = document.getElementById('chat-send');
if(chatSend) chatSend.addEventListener('click', handleSend);
if(chatInput) chatInput.addEventListener('keydown', function(e){ if(e.key==='Enter') handleSend(); });

/* ===== Appointment form ===== */
var apptForm = document.getElementById('appt-form');
var apptDateInput = document.getElementById('appt-date');
if(apptDateInput){ apptDateInput.min = new Date().toISOString().split('T')[0]; }
if(apptForm) apptForm.addEventListener('submit', async function(e){
  e.preventDefault();
  var btn = document.getElementById('appt-submit');
  btn.textContent = 'Booking...'; btn.disabled = true;
  var data = {
    name: document.getElementById('appt-name').value,
    phone: document.getElementById('appt-phone').value,
    email: document.getElementById('appt-email').value,
    service: document.getElementById('appt-service').value,
    date: document.getElementById('appt-date').value,
    time_slot: document.getElementById('appt-time').value,
    notes: document.getElementById('appt-notes').value
  };
  try{
    var res = await fetch(APP_BASE + 'bookAppointment', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
    var r = await res.json();
    if(r.status === 'ok'){
      var resultDiv = document.getElementById('appt-result');
      resultDiv.classList.remove('hidden');
      var waMsg = 'Hi! I just booked an appointment for '+data.service+' on '+data.date+' at '+data.time_slot+'. My name is '+data.name;
      resultDiv.innerHTML = '<div class="text-green-400 font-semibold text-lg">✅ Appointment Booked!</div><div class="text-sm text-gray-400 mt-2">We will confirm on WhatsApp shortly.</div><a href="https://wa.me/2347045560291?text='+encodeURIComponent(waMsg)+'" target="_blank" class="inline-block mt-4 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-sm font-semibold">💬 Confirm on WhatsApp</a>';
      apptForm.querySelectorAll('input,textarea,select,button').forEach(function(el){ el.disabled = true; });
    } else {
      alert(r.message || 'Something went wrong. Please WhatsApp us: wa.me/2347045560291');
      btn.textContent = 'Book My Appointment'; btn.disabled = false;
    }
  } catch(err){
    alert('Connection error. WhatsApp: wa.me/2347045560291');
    btn.textContent = 'Book My Appointment'; btn.disabled = false;
  }
});

// Auto-start inline chat if chat-body exists and no launcher
document.addEventListener('DOMContentLoaded', function(){
  var body = document.getElementById('chat-body');
  var launcher = document.getElementById('chat-launcher');
  if(body && !launcher){ startChat(); }
});
