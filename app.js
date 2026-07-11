/* ===== Config ===== */
var APP_BASE = 'https://superagent-55bc0d3a.base44.app/functions/';
var WA_URL = 'https://wa.me/2347045560291';

/* ===== Session ID ===== */
function getSessionId(){
  var sid = localStorage.getItem('erogian_session_id');
  if(!sid){
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2,10);
    localStorage.setItem('erogian_session_id', sid);
  }
  return sid;
}

/* ===== Modal helpers ===== */
function openModal(n){ document.getElementById('modal-'+n).classList.remove('hidden'); }
function closeModal(n){ document.getElementById('modal-'+n).classList.add('hidden'); }
document.querySelectorAll('.modal-overlay').forEach(function(m){
  m.addEventListener('click', function(e){ if(e.target===m) m.classList.add('hidden'); });
});

/* ===== Payment ===== */
var curPlan = '', curAmt = 0;
function openPaymentModal(name, amt){
  curPlan = name; curAmt = amt;
  document.getElementById('pay-plan-name').textContent = name;
  document.getElementById('pay-amount-display').textContent = '₦' + amt.toLocaleString();
  document.getElementById('pay-email').value = '';
  openModal('pay');
}
async function initiatePayment(){
  var email = document.getElementById('pay-email').value.trim();
  if(!email || !email.includes('@')){ alert('Please enter a valid email address'); return; }
  var btn = document.getElementById('pay-confirm-btn');
  btn.textContent = 'Redirecting to Paystack...';
  btn.disabled = true;
  try{
    var res = await fetch(APP_BASE + 'erogianPay', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ plan: curPlan, amount: curAmt, email: email })
    });
    var data = await res.json();
    if(data.status === 'ok' && data.authorization_url){
      window.location.href = data.authorization_url;
    } else {
      alert(data.message || 'Payment failed to initialize. Try WhatsApp instead: wa.me/2347045560291');
      btn.textContent = 'Pay Securely with Paystack →';
      btn.disabled = false;
    }
  } catch(e){
    alert('Connection error. You can pay via WhatsApp: wa.me/2347045560291');
    btn.textContent = 'Pay Securely with Paystack →';
    btn.disabled = false;
  }
}

/* Payment success banner */
(function(){
  var params = new URLSearchParams(window.location.search);
  if(params.get('payment') === 'success'){
    setTimeout(function(){
      var b = document.createElement('div');
      b.className = 'fixed top-20 left-1/2 -translate-x-1/2 z-[60] glass rounded-2xl px-6 py-4 text-center';
      b.innerHTML = '<div class="text-green-400 font-semibold">✅ Payment Successful!</div><div class="text-sm text-gray-400 mt-1">We will reach out to you on WhatsApp shortly.</div>';
      document.body.appendChild(b);
      setTimeout(function(){ b.remove(); }, 6000);
    }, 1000);
  }
})();

/* ===== Particle canvas ===== */
(function(){
  var canvas = document.getElementById('particle-canvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var w, h, particles = [];
  function resize(){ w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  for(var i=0;i<80;i++) particles.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-0.5)*0.3,vy:(Math.random()-0.5)*0.3,r:Math.random()*2+0.5});
  function loop(){
    ctx.clearRect(0,0,w,h);
    particles.forEach(function(p){
      p.x += p.vx; p.y += p.vy;
      if(p.x<0||p.x>w) p.vx*=-1;
      if(p.y<0||p.y>h) p.vy*=-1;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = 'rgba(139,92,246,' + (0.3+Math.random()*0.3) + ')'; ctx.fill();
    });
    for(var a=0;a<particles.length;a++){
      for(var b2=a+1;b2<particles.length;b2++){
        var dx = particles[a].x-particles[b2].x, dy = particles[a].y-particles[b2].y;
        var d = Math.sqrt(dx*dx+dy*dy);
        if(d<120){
          ctx.beginPath(); ctx.moveTo(particles[a].x,particles[a].y); ctx.lineTo(particles[b2].x,particles[b2].y);
          ctx.strokeStyle = 'rgba(59,130,246,' + ((1-d/120)*0.15) + ')'; ctx.lineWidth=1; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(loop);
  }
  loop();

/* ===== Hero + nav animations (bulletproof - no GSAP dependency) ===== */
(function initHero(){
  function revealHero(){
    var els = document.querySelectorAll('[data-hero-tag],[data-hero-title],[data-hero-sub],[data-hero-cta]');
    els.forEach(function(el, i){
      setTimeout(function(){
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        el.style.transform = 'translateY(0)';
        el.style.opacity = '1';
      }, i * 200);
    });
  }
  // Set initial transform
  document.querySelectorAll('[data-hero-tag],[data-hero-title],[data-hero-sub],[data-hero-cta]').forEach(function(el){
    el.style.transform = 'translateY(20px)';
  });
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(revealHero, 100);
  } else {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(revealHero, 100); });
  }
  window.addEventListener('load', revealHero);
})();

/* ===== Float animation ===== */
(function(){
  var floats = document.querySelectorAll('[data-float]');
  floats.forEach(function(el, i){
    var dir = 1;
    var y = 0;
    var speed = 0.03 + i * 0.01;
    var amp = 8 + i * 2;
    var angle = Math.random() * Math.PI * 2;
    function animate(){
      angle += speed;
      y = Math.sin(angle) * amp;
      el.style.transform = 'translateY(' + y + 'px)';
      requestAnimationFrame(animate);
    }
    animate();
  });
})();

/* ===== Nav scroll effect ===== */
var nav = document.getElementById('mainnav');
window.addEventListener('scroll', function(){
  if(window.scrollY > 60){
    nav.classList.add('glass'); nav.style.paddingTop='8px'; nav.style.paddingBottom='8px';
  } else {
    nav.classList.remove('glass'); nav.style.paddingTop=''; nav.style.paddingBottom='';
  }
});

/* ===== Counters (pure IntersectionObserver, no GSAP) ===== */
(function(){
  var counters = document.querySelectorAll('.counter');
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        var el = entry.target;
        var target = parseInt(el.dataset.count, 10);
        var suffix = target === 98 ? '%' : '+';
        var start = 0;
        var duration = 1800;
        var step = Math.ceil(target / (duration / 16));
        el.innerText = '0' + suffix;
        var interval = setInterval(function(){
          start += step;
          if(start >= target){
            start = target;
            clearInterval(interval);
          }
          el.innerText = start + suffix;
        }, 16);
        observer.unobserve(el);
      }
    });
  }, {threshold: 0.3, rootMargin: '0px 0px -50px 0px'});
  counters.forEach(function(c){ observer.observe(c); });
})();

/* ===== Services — FLIP CARDS ===== */
var services = [
 ['🌐','Website Development','Modern, blazing-fast websites that convert.','Responsive, SEO-ready, with contact forms & WhatsApp integration. Delivered in 3–7 days.'],
 ['📱','Mobile Apps','iOS & Android apps built for scale.','Cross-platform apps using React Native. Auth, payments, push notifications included.'],
 ['🤖','AI Automation','Automate repetitive work with custom AI.','Custom automations that save hours daily — from lead capture to customer follow-ups.'],
 ['🧠','AI Agents','Custom AI agents for your business.','Smart agents that handle queries, bookings, or internal tasks 24/7.'],
 ['✈️','Telegram Bots','Full-featured bots for community & commerce.','Sell, manage, engage — all inside Telegram. Paystack & subscriptions included.'],
 ['💬','WhatsApp Bots','Automated sales & support on WhatsApp.','Auto-reply bots, order flow, payment links and lead capture for WhatsApp.'],
 ['🛠️','Custom Software','Bespoke systems built around your workflow.','Internal tools, dashboards, CRMs — built exactly for how your team works.'],
 ['🎨','Brand Identity','Complete visual identity systems.','Logo, colour palette, typography, brand guide — everything for a consistent look.'],
 ['🖋️','Logo Design','Memorable marks that scale across media.','Premium logos with unlimited revisions. Delivered in AI, PNG, and SVG.'],
 ['🎬','Video Editing','Polished edits for social & ads.','Reels, YouTube, promos — edited with captions & motion graphics.'],
 ['✨','Motion Graphics','Animated visuals that grab attention.','Animated logos, intros, explainers and social content that stops the scroll.'],
 ['🧩','UI/UX Design','Interfaces people actually enjoy using.','Figma prototypes, user flows, wireframes — designed for conversion.'],
 ['🏢','Business Systems','Internal tools & dashboards.','Admin panels, inventory, booking managers for your exact operations.'],
 ['☁️','Cloud Deployment','Reliable, scalable infrastructure.','Deploy on Vercel, Render, AWS or DigitalOcean with CI/CD pipelines.'],
 ['🔌','API Development','Robust APIs connecting your stack.','RESTful APIs, webhooks, third-party integrations — built for speed.'],
 ['🛒','E-commerce','Stores built to sell, not just look good.','Product pages, cart, Paystack checkout — fully optimised.'],
 ['📄','Landing Pages','High-converting single pages for campaigns.','Single-page sites built to turn visitors into buyers.'],
 ['🚀','SaaS Development','Full SaaS products, start to scale.','Full-stack SaaS: auth, billing, dashboard, user management.'],
 ['🎓','Educational Platforms','LMS & course platforms.','Course platforms with video, quizzes, certificates & dashboards.'],
 ['💳','Payment Integration','Paystack, Stripe & Flutterwave, done right.','Seamless flows for subscriptions, one-time purchases & in-app transactions.']
];

(function renderServices(){
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
          '<div style="font-weight:600;font-size:0.8rem;line-height:1.2">' + s[1] + '</div>' +
          '<div style="font-size:0.65rem;color:#6b7280;margin-top:0.35rem">tap to see more</div>' +
        '</div>' +
        '<div class="flip-back">' +
          '<div style="font-size:0.65rem;color:#a78bfa;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.4rem">' + s[1] + '</div>' +
          '<p style="font-size:0.7rem;color:#d1d5db;line-height:1.4;margin-bottom:0.6rem">' + s[3] + '</p>' +
          '<a href="' + waLink + '" target="_blank" onclick="event.stopPropagation()" style="display:inline-block;padding:0.3rem 0.8rem;border-radius:9999px;font-size:0.7rem;font-weight:600;background:linear-gradient(90deg,#8b5cf6,#3b82f6);color:#fff;text-decoration:none">Get This →</a>' +
        '</div>' +
      '</div>';
    card.addEventListener('click', function(){ this.classList.toggle('flipped'); });
    card.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); this.classList.toggle('flipped'); } });
    sgrid.appendChild(card);
  });
})();

  pgrid.innerHTML += '<div class="glass rounded-2xl overflow-hidden card-float group"><div class="aspect-[4/5] overflow-hidden"><img src="'+p[0]+'" alt="'+p[1]+'" class="w-full h-full object-cover group-hover:scale-110 transition duration-500"></div><div class="p-4"><div class="font-semibold text-sm mb-1">'+p[1]+'</div><div class="text-xs text-gray-500">'+p[2]+'</div></div></div>';
});

/* ===== Testimonials ===== */
var testimonials = [
  ["It's beautiful — exactly what we needed for the announcement.",'WDS Nigeria GTA Team','Youth Conference Organizers'],
  ['"Rainbow Palm Oil finally looks like the premium brand it is."','Gladys Chekwube','Rainbow Palm Oil, Enugu'],
  ['"The book cover captured exactly the warmth I wanted readers to feel."','Ebere Ugwu','Author, Spice Kitchen Book'],
  ['"Fast, professional, and genuinely creative. Erogian gets the brief right."','Event Committee','WDS Arts & Culture Exhibition']
];
var track = document.getElementById('testimonial-track');
testimonials.concat(testimonials).forEach(function(t){
  track.innerHTML += '<div class="glass rounded-2xl p-6 w-80 shrink-0"><div class="text-yellow-400 text-sm mb-3">★★★★★</div><div class="text-sm text-gray-300 mb-4">'+t[0]+'</div><div class="font-semibold text-sm">'+t[1]+'</div><div class="text-xs text-gray-500">'+t[2]+'</div></div>';
});

/* ===== Pricing ===== */
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

/* ===== Estimator ===== */
var estSel = {}, estCx = 3, estSp = 1.0;
var cxLabels = ['','Basic','Simple','Standard','Advanced','Complex'];
function updEst(){
  var base = 0;
  Object.keys(estSel).forEach(function(k){ base += estSel[k]; });
  var mult = (0.6 + estCx*0.2) * estSp;
  var total = Math.round(base * mult);
  document.getElementById('est-total').textContent = '₦' + total.toLocaleString();
  var svc = Object.keys(estSel).join(', ') || 'No services selected';
  var msg = 'Hi Erogian! I used your estimator. Services: '+svc+'. Complexity: '+cxLabels[estCx]+'. Estimated: ₦'+total.toLocaleString()+'. I would like to discuss my project.';
  document.getElementById('est-whatsapp').href = 'https://wa.me/2347045560291?text=' + encodeURIComponent(msg);
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
document.getElementById('est-complexity').addEventListener('input', function(e){
  estCx = +e.target.value;
  document.getElementById('est-complexity-label').textContent = cxLabels[estCx] + ' project';
  updEst();
});
document.querySelector('#est-timeline .est-chip').click();
updEst();

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
  var urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, function(url){
    return '<a href="'+url+'" target="_blank" class="chat-link">'+url+'</a>';
  });
}

function addBot(msg){
  chatBody.innerHTML += '<div class="chat-bubble-enter glass rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">'+linkify(msg).replace(/\n/g,'<br>')+'</div>';
  chatBody.scrollTop = chatBody.scrollHeight;
}
function addUser(msg){
  chatBody.innerHTML += '<div class="chat-bubble-enter bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] ml-auto text-right">'+msg+'</div>';
  chatBody.scrollTop = chatBody.scrollHeight;
}
function addQuickActions(actions){
  if(!actions || actions.length===0) return;
  var wrap = document.createElement('div');
  wrap.className = 'chat-bubble-enter flex flex-wrap gap-2';
  actions.forEach(function(a){
    if(a.type === 'pay'){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'text-xs px-3 py-2 rounded-full pay-btn font-semibold';
      btn.textContent = '💳 ' + a.label;
      btn.addEventListener('click', function(){ openPaymentModal(a.plan, a.amount); });
      wrap.appendChild(btn);
    } else if(a.type === 'link'){
      var link = document.createElement('a');
      link.href = a.url; link.target = '_blank';
      link.className = 'text-xs px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition font-semibold inline-block';
      link.textContent = a.label;
      wrap.appendChild(link);
    } else if(a.type === 'scroll'){
      var sbtn = document.createElement('button');
      sbtn.type = 'button';
      sbtn.className = 'text-xs px-3 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 font-semibold';
      sbtn.textContent = a.label;
      sbtn.addEventListener('click', function(){
        var el = document.querySelector(a.target);
        if(el) el.scrollIntoView({behavior:'smooth'});
        document.getElementById('chat-window').classList.add('hidden');
        document.getElementById('chat-window').classList.remove('flex');
      });
      wrap.appendChild(sbtn);
    }
  });
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
}
function addStandardQR(){
  var qr = document.createElement('div');
  qr.className = 'chat-bubble-enter flex flex-wrap gap-2';
  qr.innerHTML = '<button type="button" class="qr-pricing text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition">💰 Pricing</button><button type="button" class="qr-payment text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition">💳 Pay Now</button><button type="button" class="qr-whatsapp text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition">💬 WhatsApp</button><button type="button" class="qr-services text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition">🛠️ Services</button>';
  chatBody.appendChild(qr);
  qr.querySelector('.qr-pricing').addEventListener('click', function(){ addUser('How much do your services cost?'); sendToAI('How much do your services cost?'); });
  qr.querySelector('.qr-payment').addEventListener('click', function(){ addUser('I want to pay now'); sendToAI('I want to pay now'); });
  qr.querySelector('.qr-whatsapp').addEventListener('click', function(){ addUser('What is your WhatsApp number?'); sendToAI('What is your WhatsApp number?'); });
  qr.querySelector('.qr-services').addEventListener('click', function(){ addUser('What services do you offer?'); sendToAI('What services do you offer?'); });
  chatBody.scrollTop = chatBody.scrollHeight;
}
function addQuoteButton(){
  var wrap = document.createElement('div');
  wrap.className = 'chat-bubble-enter';
  wrap.innerHTML = '<button type="button" id="quote-btn" class="text-xs px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 font-semibold">📋 Get a Project Quote</button>';
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
  document.getElementById('quote-btn').addEventListener('click', function(){
    mode = 'lead'; step = 0; lead = {};
    addBot(flow[0].q);
  });
}
function startChat(){
  if(chatBody.children.length === 0){
    setTimeout(function(){ addBot("Hey! 👋 I'm the Erogian AI assistant. I can help with pricing, payments, services, or connect you with the team."); }, 300);
    setTimeout(addStandardQR, 800);
    setTimeout(addQuoteButton, 1200);
  }
}
async function sendToAI(msg){
  var tid = 't' + Date.now();
  var typingDiv = document.createElement('div');
  typingDiv.className = 'chat-bubble-enter glass rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-gray-400';
  typingDiv.id = tid;
  typingDiv.textContent = 'typing…';
  chatBody.appendChild(typingDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
  try{
    var res = await fetch(APP_BASE + 'erogianChat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ message: msg, session_id: getSessionId() })
    });
    var data = await res.json();
    var t = document.getElementById(tid);
    if(t) t.remove();
    addBot(data.reply || "Sorry, could you rephrase?");
    if(data.quickActions && data.quickActions.length > 0){
      addQuickActions(data.quickActions);
    } else {
      setTimeout(addStandardQR, 400);
    }
  } catch(e){
    var t2 = document.getElementById(tid);
    if(t2) t2.remove();
    addBot("I'm having trouble connecting. Reach Emmanuel directly: " + WA_URL);
  }
}
async function submitLead(){
  try{
    await fetch(APP_BASE + 'submitErogianLead', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(lead)
    });
  } catch(e){}
}
document.getElementById('chat-launcher').addEventListener('click', function(){
  var win = document.getElementById('chat-window');
  var isHidden = win.classList.contains('hidden');
  win.classList.toggle('hidden');
  win.classList.toggle('flex');
  if(isHidden) startChat();
});
document.getElementById('chat-close').addEventListener('click', function(){
  var win = document.getElementById('chat-window');
  win.classList.add('hidden');
  win.classList.remove('flex');
});
function handleSend(){
  var v = chatInput.value.trim();
  if(!v) return;
  addUser(v);
  chatInput.value = '';
  if(mode === 'lead'){
    lead[flow[step].key] = v;
    step++;
    if(step < flow.length){
      setTimeout(function(){ addBot(flow[step].q); }, 500);
    } else {
      setTimeout(function(){
        addBot("Perfect — got everything I need! 🙌 Sending this to the team now. You'll hear back on WhatsApp shortly.");
        submitLead();
        mode = 'ai';
        setTimeout(function(){
          addBot("Need anything else? I can help with pricing, payments, or you can reach Emmanuel directly on WhatsApp: " + WA_URL);
          addStandardQR();
        }, 1500);
      }, 500);
    }
  } else {
    sendToAI(v);
  }
}
document.getElementById('chat-send').addEventListener('click', handleSend);
chatInput.addEventListener('keydown', function(e){ if(e.key === 'Enter') handleSend(); });

/* ===== Appointment form ===== */
var apptForm = document.getElementById('appt-form');
var apptDateInput = document.getElementById('appt-date');
if(apptDateInput){
  var today = new Date().toISOString().split('T')[0];
  apptDateInput.min = today;
}
apptForm.addEventListener('submit', async function(e){
  e.preventDefault();
  var btn = document.getElementById('appt-submit');
  btn.textContent = 'Booking...';
  btn.disabled = true;
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
    var res = await fetch(APP_BASE + 'bookAppointment', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    var r = await res.json();
    if(r.status === 'ok'){
      var resultDiv = document.getElementById('appt-result');
      resultDiv.classList.remove('hidden');
      var waMsg = 'Hi! I just booked an appointment for ' + data.service + ' on ' + data.date + ' at ' + data.time_slot + '. My name is ' + data.name;
      resultDiv.innerHTML = '<div class="text-green-400 font-semibold text-lg">✅ Appointment Booked!</div><div class="text-sm text-gray-400 mt-2">We will confirm on WhatsApp shortly.</div><a href="https://wa.me/2347045560291?text=' + encodeURIComponent(waMsg) + '" target="_blank" class="inline-block mt-4 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-sm font-semibold">💬 Confirm on WhatsApp</a>';
      apptForm.querySelectorAll('input,textarea,select,button').forEach(function(el){ el.disabled = true; });
    } else {
      alert(r.message || 'Something went wrong. Please WhatsApp us: wa.me/2347045560291');
      btn.textContent = 'Book My Appointment';
      btn.disabled = false;
    }
  } catch(err){
    alert('Connection error. WhatsApp: wa.me/2347045560291');
    btn.textContent = 'Book My Appointment';
    btn.disabled = false;
  }
});
