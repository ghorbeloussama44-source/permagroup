/* Perma.doctor — interactions du design (multi-pages).
 * Chaque bloc ne s'active que si la page contient les éléments concernés.
 * Données (pôles, coordonnées) : window.PERMA, généré par tools/build_pages.py. */
(() => {
"use strict";
const D = window.PERMA || { poles: [], site: {} };
const POLES = D.poles, SITE = D.site;
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE = matchMedia("(pointer:fine)").matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 8h12M9 3l5 5-5 5"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const P = id => POLES.find(p => p.id === id);
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const store = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} } };

/* ——— défilement fluide ——— */
let lenis = null;
if (!RM && window.Lenis) { try { lenis = new Lenis({ lerp: .085, smoothWheel: true }); const lr = t => { lenis.raf(t); requestAnimationFrame(lr); }; requestAnimationFrame(lr); } catch (e) { lenis = null; } }
function scrollToEl(el, off) { off = off == null ? -80 : off; if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.35 }); else { const y = el.getBoundingClientRect().top + scrollY + off; scrollTo({ top: Math.max(0, y), behavior: RM ? "auto" : "smooth" }); } }
let startIntro; const intro = new Promise(r => startIntro = r);
const PLON = !RM && !!$("#pl") && !store.get("pd_seen");
store.set("pd_seen", "1");
if (!PLON) { const p = $("#pl"); p && p.remove(); document.documentElement.classList.remove("is-loading"); startIntro(); }

/* ——— curseur ——— */
if (FINE && !RM && $("#curDot")) {
  const H = document.documentElement, dot = $("#curDot"), ring = $("#curRing"), lbl = $("#curRing em"); H.classList.add("has-cur");
  let x = -100, y = -100, rx = -100, ry = -100;
  addEventListener("pointermove", e => { x = e.clientX; y = e.clientY; H.classList.add("cur-on"); dot.style.transform = `translate3d(${x}px,${y}px,0)`; }, { passive: true });
  H.addEventListener("pointerleave", () => H.classList.remove("cur-on"));
  const cl = () => { rx += (x - rx) * .16; ry += (y - ry) * .16; ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`; requestAnimationFrame(cl); }; cl();
  document.addEventListener("pointerover", e => {
    const t = e.target.closest("[data-cursor]"), txt = e.target.closest("input,textarea,select"), a = !t && !txt && e.target.closest("a,button,label");
    const lab = t && !e.target.closest("button:not([data-cursor]),a:not([data-cursor]),input,textarea,select");
    H.classList.toggle("cur-lab", !!lab); if (lab) lbl.textContent = t.dataset.cursor;
    H.classList.toggle("cur-hov", !lab && !!(a || (t && !txt))); H.classList.toggle("cur-txt", !!txt);
  });
  addEventListener("pointerdown", () => H.classList.add("cur-down")); addEventListener("pointerup", () => H.classList.remove("cur-down"));
}

/* ——— listes des pôles (menu, tiroir, pied de page) ——— */
const mega = $("#mega"); if (mega) mega.innerHTML = POLES.map(p => `<a href="${p.page}"><img src="${p.img}" alt=""><div><strong>${p.name}</strong><span>${p.sub}</span></div></a>`).join("");
const dp = $("#drawerPoles"); if (dp) dp.innerHTML = POLES.map(p => `<a href="${p.page}">${p.name}</a>`).join("");
const fp = $("#ftPoles"); if (fp) fp.innerHTML = POLES.map(p => `<li><a href="${p.page}">${p.name} · ${p.sub}</a></li>`).join("");

/* ——— témoignages : uniquement de vrais avis présents dans la page ——— */
const track = $("#tTrack");
if (track) {
  const cards = $$(".t-card", track), sec = track.closest("section");
  if (!cards.length) sec.hidden = true;
  else {
    const tstep = () => cards[0].getBoundingClientRect().width + 20;
    $("#tPrev").onclick = () => track.scrollBy({ left: -tstep(), behavior: RM ? "auto" : "smooth" });
    $("#tNext").onclick = () => track.scrollBy({ left: tstep(), behavior: RM ? "auto" : "smooth" });
    let drag = null;
    track.addEventListener("pointerdown", e => { if (e.pointerType === "mouse") drag = { x: e.clientX, s: track.scrollLeft }; });
    addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 4) track.classList.add("drag"); track.scrollLeft = drag.s - dx; });
    addEventListener("pointerup", () => { if (!drag) return; drag = null; setTimeout(() => track.classList.remove("drag"), 30); });
  }
}

/* ——— texte cinétique ——— */
const star = '<svg class="st" viewBox="0 0 20 20" fill="currentColor"><path d="M10 0c.6 5.4 4 8.8 10 10-6 1.2-9.4 4.6-10 10-.6-5.4-4-8.8-10-10C6 8.8 9.4 5.4 10 0z"/></svg>';
if ($("#k1")) {
  $("#k1").innerHTML = `<span>Élégance ${star}</span><span class="o">Confiance</span><span>${star} Méditerranée ${star}</span>`.repeat(4);
  $("#k2").innerHTML = `<span class="o">Renaissance</span><span>${star} Sérénité ${star}</span><span class="o">Harmonie</span><span>${star}</span>`.repeat(4);
}

/* ——— rameaux ——— */
function branch(svg, seed) {
  let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  let h = `<path d="M10 290 C 80 220, 120 150, 250 30" stroke="currentColor" stroke-width="1.6" fill="none"/>`;
  for (let i = 1; i < 10; i++) { const t = i / 10; const x = 10 + 240 * t + Math.sin(t * 3) * 30, y = 290 - 260 * t - Math.sin(t * 2.6) * 20;
    const a = (i % 2 ? -1 : 1) * (35 + r() * 25) - 40, len = 34 + r() * 26;
    h += `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)})" d="M0 0 C ${len * .3} ${-len * .32}, ${len * .75} ${-len * .3}, ${len} 0 C ${len * .75} ${len * .3}, ${len * .3} ${len * .32}, 0 0z" fill="currentColor" opacity="${(.35 + r() * .5).toFixed(2)}"/>`; }
  svg.innerHTML = h;
}
$$(".leaves").forEach((l, i) => branch(l, i ? 19 : 7));

/* ——— en-tête, progression, menu ——— */
const hdr = $("#hdr"), prog = $("#progress");
function onScrollUI() {
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  if (prog) prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  if (hdr) hdr.classList.toggle("dark", y > 40 || document.body.classList.contains("menu-open"));
}
const burger = $("#burger"), drawer = $("#drawer");
function setMenu(open) { if (!burger) return; if (lenis) open ? lenis.stop() : lenis.start(); document.body.classList.toggle("menu-open", open); burger.setAttribute("aria-expanded", open); burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu"); drawer.setAttribute("aria-hidden", !open); document.body.style.overflow = open ? "hidden" : ""; onScrollUI(); }
if (burger) { burger.onclick = () => setMenu(!document.body.classList.contains("menu-open")); drawer.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); }); addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); }); }

/* ——— découpe des titres ——— */
$$(".split").forEach(el => {
  const walk = n => { [...n.childNodes].forEach(c => {
    if (c.nodeType === 3) { const parts = c.textContent.split(/(\s+)/); const f = document.createDocumentFragment();
      parts.forEach(p => { if (!p) return; if (/^\s+$/.test(p)) { f.append(" "); return; } const w = document.createElement("span"); w.className = "w"; const i = document.createElement("span"); i.textContent = p; w.append(i); f.append(w); }); c.replaceWith(f); }
    else if (c.nodeType === 1 && c.classList.contains("nw")) { const w = document.createElement("span"); w.className = "w"; const i = document.createElement("span"); c.replaceWith(w); i.append(c); w.append(i); }
    else if (c.nodeType === 1 && c.tagName !== "BR" && !c.classList.contains("w")) { if (c.children.length === 0 && c.textContent.length < 3) return; walk(c); }
  }); };
  walk(el);
  $$(".w>span", el).forEach((s, i) => s.style.transitionDelay = (i * 0.06) + "s");
});

/* ——— révélations ——— */
const heroTitle = $("#heroTitle"), heroRule = $("#heroRule");
if (!RM && "IntersectionObserver" in window) {
  const vh = innerHeight;
  const targets = $$(".rv,.split,.ci").filter(el => el !== heroTitle);
  targets.forEach(el => { const r = el.getBoundingClientRect(); if (r.top > vh * 0.92) { if (el.classList.contains("split")) el.classList.add("split-wait"); if (el.classList.contains("rv")) el.classList.add("rv-wait"); if (el.classList.contains("ci")) el.classList.add("ci-wait"); } });
  // clip-path hides .ci from IntersectionObserver, so watch its parent instead
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { (watch.get(e.target) || [e.target]).forEach(el => el.classList.remove("rv-wait", "split-wait", "ci-wait")); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: .12 });
  const watch = new Map();
  targets.forEach(el => { const t = el.classList.contains("ci") && el.parentElement || el; if (t !== el) watch.set(t, [...(watch.get(t) || (targets.includes(t) ? [t] : [])), el]); io.observe(t); });
  addEventListener("scroll", () => { if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) $$(".rv-wait,.split-wait,.ci-wait").forEach(el => el.classList.remove("rv-wait", "split-wait", "ci-wait")); }, { passive: true });
  if (heroTitle) {
    heroTitle.classList.add("split-wait");
    if (heroRule) heroRule.style.transform = "scaleX(0)";
    intro.then(() => {
      heroTitle.classList.remove("split-wait");
      $$(".hero-copy .crumbs,.hero-copy .eyebrow,.hero-copy .lead,.hero-ctas,.media-tag,.trust-card").forEach((el, i) => el.animate([{ opacity: 0, transform: "translateY(26px)" }, { opacity: 1, transform: "none" }], { duration: 1100, easing: "cubic-bezier(.22,.8,.2,1)", delay: 260 + i * 110, fill: "backwards" }));
      if (heroRule) heroRule.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 1200, easing: "cubic-bezier(.22,.8,.2,1)", delay: 300, fill: "forwards" }).onfinish = () => heroRule.style.transform = "";
    });
  }
}

/* ——— parallaxe et mouvements liés au défilement ——— */
const par = $$("[data-speed]"), k1 = $("#k1"), k2 = $("#k2"), kSec = $(".kinetic"), badge = $("#kBadge"), orb = $(".k-orb img"), svcs = $("#services"), svcItems = $$(".svc");
let ticking = false, heroScroll = 0; const footEl = $(".site-footer"), mainEl = $("main"), giantIn = $(".ft-giant-in");
function frame() {
  ticking = false; const vh = innerHeight; onScrollUI();
  heroScroll = Math.max(0, Math.min(1, scrollY / vh));
  if (RM) return;
  par.forEach(el => { const r = el.parentElement.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return; const c = r.top + r.height / 2 - vh / 2; el.style.transform = `translate3d(0,${(c * parseFloat(el.dataset.speed) - r.height * 0.08).toFixed(1)}px,0)`; });
  if (kSec) { const kr = kSec.getBoundingClientRect(); if (kr.bottom > 0 && kr.top < vh) { const p = (vh - kr.top) / (vh + kr.height); k1.style.transform = `translate3d(${(-p * 40).toFixed(2)}%,0,0)`; k2.style.transform = `translate3d(${(-30 + p * 30).toFixed(2)}%,0,0)`; if (badge) badge.style.transform = `translate(-50%,-50%) rotate(${(p * 220).toFixed(1)}deg)`; if (orb) orb.style.transform = `scale(1.25) rotate(${(-p * 25).toFixed(1)}deg)`; } }
  if (svcs) { const sr = svcs.getBoundingClientRect(); const sp = Math.min(1, Math.max(0, (vh * 0.85 - sr.top) / sr.height)); svcs.style.setProperty("--p", sp.toFixed(3)); svcItems.forEach((it, i) => it.classList.toggle("lit", sp > i / svcItems.length + .02)); }
  if (footEl && mainEl && giantIn) { const fr = footEl.getBoundingClientRect(), edge = Math.max(mainEl.getBoundingClientRect().bottom, fr.top), fpp = Math.min(1, Math.max(0, (vh - edge) / fr.height)); giantIn.style.transform = `translate3d(0,${((1 - fpp) * 60).toFixed(2)}%,0)`; }
}
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
addEventListener("resize", () => requestAnimationFrame(frame));
frame();
if (RM && svcs) { svcs.style.setProperty("--p", 1); svcItems.forEach(i => i.classList.add("lit")); }

/* ——— boutons magnétiques et cartes inclinées ——— */
if (FINE && !RM) {
  $$(".mag").forEach(b => { b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .18).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * .28).toFixed(1)}px)`; }); b.addEventListener("pointerleave", () => b.style.transform = ""); });
  $$(".tilt").forEach(c => { const ph = c.querySelector(".ph"); c.addEventListener("pointermove", e => { const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; c.style.transform = `perspective(900px) rotateX(${((.5 - y) * 6).toFixed(2)}deg) rotateY(${((x - .5) * 8).toFixed(2)}deg) translateY(-6px)`; if (ph) { ph.style.setProperty("--mx", x * 100 + "%"); ph.style.setProperty("--my", y * 100 + "%"); } }); c.addEventListener("pointerleave", () => c.style.transform = ""); });
}

/* ——— accordéons ——— */
$$(".acc").forEach(acc => acc.addEventListener("click", e => {
  const b = e.target.closest(".acc-it>button"); if (!b) return;
  const it = b.parentElement, open = !it.classList.contains("open");
  $$(".acc-it", acc).forEach(x => { x.classList.remove("open"); $("button", x).setAttribute("aria-expanded", "false"); });
  if (open) { it.classList.add("open"); b.setAttribute("aria-expanded", "true"); }
}));

/* ——— 10 bonnes raisons : numéro épinglé ——— */
const rList = $(".r-list");
if (rList && "IntersectionObserver" in window) {
  const items = $$("li", rList), box = $(".r-big"); let cur = -1;
  const set = k => {
    if (k === cur) return; const up = k > cur; cur = k;
    items.forEach((it, j) => { it.classList.toggle("on", j === k); it.classList.toggle("past", j < k); });
    const old = $("span", box), nx = document.createElement("span"); nx.textContent = String(k + 1).padStart(2, "0");
    nx.className = up ? "out-down" : "out-up"; box.appendChild(nx);
    requestAnimationFrame(() => requestAnimationFrame(() => nx.className = ""));
    if (old) { old.className = up ? "out-up" : "out-down"; setTimeout(() => old.remove(), 700); }
  };
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(items.indexOf(e.target)); }), { rootMargin: "-48% 0px -48% 0px" });
  items.forEach(i => rio.observe(i)); set(0);
}

/* ——— calques WebGL sur les images ——— */
const VS = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
const FS = `precision highp float;varying vec2 v;uniform sampler2D T;uniform vec2 R,I,M;uniform float t,S,RV,MODE,SC;
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}vec3 perm(vec3 x){return mod289(((x*34.)+1.)*x);}
float sn(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);vec3 p=perm(perm(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;m*=1.79284291400159-.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.*dot(m,g);}
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float pollen(vec2 uv){float a=0.;vec2 asp=vec2(R.x/R.y,1.);for(int L=0;L<3;L++){float fl=float(L);vec2 p=uv*asp*(5.+fl*4.);p.y-=t*(.06+.04*fl);p.x+=sin(t*.15+fl*2.)*.4;vec2 id=floor(p);vec2 f=fract(p)-.5;float r=hs(id);vec2 o=vec2(hs(id+3.)-.5,hs(id+7.)-.5)*.6;float sz=.025+.05*hs(id+11.);float on=step(.74,r);float tw=.55+.45*sin(t*1.3+r*40.);a+=on*smoothstep(sz,sz*.15,length(f-o))*tw*(.7-.2*fl);}return a;}
void main(){
 float rs=R.x/R.y,ri=I.x/I.y;vec2 sc=rs>ri?vec2(1.,ri/rs):vec2(rs/ri,1.);
 vec2 an=vec2(.5,mix(.5,.86,1.-MODE));vec2 st=(v-an)*sc+an;
 float z=1.05+.02*sin(t*.12)+SC*.06;st=(st-an)/z+an;st.y+=SC*.04;
 vec2 asp=vec2(rs,1.);float d=distance(v*asp,M*asp);
 float hov=smoothstep(.42,0.,d)*S;
 vec2 flow=vec2(sn(v*3.5+vec2(t*.25,0.)),sn(v*3.5+vec2(7.,t*.25)));
 st+=flow*hov*.03+vec2(sn(v*1.4+t*.05),sn(v*1.4-t*.05))*.0035;
 vec3 base=texture2D(T,st).rgb;
 float water=MODE*smoothstep(.05,.18,base.b-base.r)*smoothstep(.7,.55,v.y);
 st+=vec2(sin(v.y*140.+t*1.8)*.0016,sin(v.x*70.+t*1.2)*.0011)*water;
 float k=hov*.0032+.0003;
 vec3 col=vec3(texture2D(T,st+vec2(k,0.)).r,texture2D(T,st).g,texture2D(T,st-vec2(k,0.)).b);
 float leak=sin(v.x*2.1-v.y*1.3+t*.16)*.5+.5;col+=vec3(1.,.86,.66)*pow(leak,7.)*.09*(1.-MODE);
 col+=vec3(1.,.95,.86)*pollen(v)*.32*(1.-MODE);
 float spk=pow(max(sn(v*vec2(110.,34.)+vec2(t*.5,t*.2)),0.),14.)*water;col+=spk*.9;
 col+=hov*.035;
 float n0=sn(v*2.2+3.)*.5+.5;float mask=smoothstep(n0-.08,n0+.08,RV*1.35-.2);
 vec3 cream=vec3(.965,.949,.918);
 gl_FragColor=vec4(mix(cream,col,mask),1.);
}`;
class GLImg {
  constructor(canvas, img, mode) {
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) throw new Error("no webgl");
    this.gl = gl; this.c = canvas; this.mode = mode; this.m = [.6, .5]; this.mt = [.6, .5]; this.s = 0; this.rv = RM ? 1 : 0; this.vis = true; this.t0 = performance.now(); this.lastMove = 0;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error("link"); gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {}; ["T", "R", "I", "M", "t", "S", "RV", "MODE", "SC"].forEach(n => this.u[n] = gl.getUniformLocation(pr, n));
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]].forEach(([k, val]) => gl.texParameteri(gl.TEXTURE_2D, k, val));
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.uniform2f(this.u.I, img.naturalWidth, img.naturalHeight); gl.uniform1f(this.u.MODE, mode); gl.uniform1i(this.u.T, 0);
    this.revealStart = 0; if (!RM && !mode) { if (PLON) this.rv = 1; else intro.then(() => { this.revealStart = performance.now() - 150; }); }
    this.resize(); new ResizeObserver(() => this.resize()).observe(canvas);
    const host = canvas.parentElement;
    host.addEventListener("pointermove", e => { const r = canvas.getBoundingClientRect(); const nx = (e.clientX - r.left) / r.width, ny = 1 - (e.clientY - r.top) / r.height; const dx = nx - this.mt[0], dy = ny - this.mt[1]; this.s = Math.min(1.4, this.s + Math.hypot(dx, dy) * 9); this.mt = [nx, ny]; this.lastMove = performance.now(); });
    new IntersectionObserver(es => { this.vis = es[0].isIntersecting; if (this.vis && this.mode && !this.seen && !RM) { this.seen = true; this.revealStart = performance.now(); } }, { rootMargin: "60px" }).observe(canvas);
  }
  resize() { const d = Math.min(devicePixelRatio || 1, 1.6); const w = Math.max(1, Math.round(this.c.clientWidth * d)), h = Math.max(1, Math.round(this.c.clientHeight * d)); if (this.c.width !== w || this.c.height !== h) { this.c.width = w; this.c.height = h; this.gl.viewport(0, 0, w, h); } this.gl.uniform2f(this.u.R, w, h); this.draw(performance.now()); }
  draw(now) {
    const gl = this.gl, t = (now - this.t0) / 1000;
    if (now - this.lastMove > 1600) { const a = t * .35; this.mt = [.62 + Math.cos(a) * .16, .55 + Math.sin(a * 1.3) * .14]; this.s = Math.max(this.s, .32); }
    this.m[0] += (this.mt[0] - this.m[0]) * .07; this.m[1] += (this.mt[1] - this.m[1]) * .07; this.s *= .965;
    if (this.revealStart) { const x = Math.min(1, Math.max(0, (now - this.revealStart) / 2200)); this.rv = 1 - Math.pow(1 - x, 3); }
    gl.uniform1f(this.u.t, RM ? 0 : t); gl.uniform2f(this.u.M, this.m[0], this.m[1]); gl.uniform1f(this.u.S, RM ? 0 : Math.min(1, this.s)); gl.uniform1f(this.u.RV, this.rv); gl.uniform1f(this.u.SC, this.mode ? 0 : heroScroll);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
const layers = [];
$$("canvas[data-gl]").forEach(c => {
  const img = c.parentElement.querySelector("img"), mode = +c.dataset.gl;
  const go = () => { try { layers.push(new GLImg(c, img, mode)); } catch (e) { c.remove(); } };
  img.complete && img.naturalWidth ? go() : img.addEventListener("load", go, { once: true });
});
if (!RM) { const loop = now => { layers.forEach(l => { if (l.vis && !document.hidden) l.draw(now); }); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }

/* ——— prise de rendez-vous ——— */
const flow = $("#flow");
if (flow) {
  const fBody = $("#fBody"), q = new URLSearchParams(location.search);
  const S = { step: 1, pole: null, item: null, mode: "Visio", day: null, time: null, info: { prenom: "", nom: "", tel: "", email: "", pays: "France", msg: "" }, consent: false, tried: false, done: false };
  if (q.get("pole") && P(q.get("pole"))) { S.pole = q.get("pole"); const it = q.get("i"); if (it && P(S.pole).items.includes(it)) S.item = it; }
  const STEPS = [
    { t: "Quel pôle vous intéresse ?", s: "Sélectionnez un pôle, puis l’intervention souhaitée.", side: "Votre demande", sd: "Choisissez votre pôle et votre intervention." },
    { t: "Votre consultation offerte", s: "Un conseiller vous appelle pour échanger sur votre projet, sans engagement.", side: "Rendez-vous", sd: "Sélectionnez le mode, la date et l’heure." },
    { t: "Vos coordonnées", s: "Pour que votre conseiller puisse vous joindre au créneau choisi.", side: "Informations", sd: "Complétez vos coordonnées." },
    { t: "Plus qu’un clic", s: "Envoyez votre demande : elle s’ouvre préremplie dans WhatsApp ou dans votre messagerie. Réponse sous 24 h.", side: "Envoi", sd: "Envoyez votre demande à un conseiller." }
  ];
  const DAYS = (() => { const out = [], d = new Date(); d.setHours(12, 0, 0, 0); while (out.length < 8) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) out.push(new Date(d)); } return out; })();
  const fmtD = d => ({ wd: d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""), n: d.getDate(), m: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""), full: d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) });
  const TIMES = ["09:30", "11:00", "12:30", "14:30", "16:00", "17:30"];
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), telOk = v => v.replace(/\D/g, "").length >= 8;
  const valid = n => n === 1 ? !!(S.pole && S.item) : n === 2 ? !!(S.day !== null && S.time) : n === 3 ? !!(S.info.prenom.trim() && S.info.nom.trim() && telOk(S.info.tel) && emailOk(S.info.email) && S.consent) : true;
  const pct = () => { if (S.done) return 100; let p = 0; if (S.pole) p = 16; if (S.item) p = 33; if (S.step >= 2) p = 50; if (S.step >= 2 && S.day !== null) p = 58; if (S.step >= 2 && S.time) p = 66; if (S.step >= 3) p = 75; if (S.step >= 3 && valid(3)) p = 90; return p; };
  const setPoleColor = () => document.documentElement.style.setProperty("--pole", S.pole ? P(S.pole).color : "#0F8F93");
  function message() {
    const pl = P(S.pole), f = fmtD(DAYS[S.day]);
    const L = ["Bonjour Perma.doctor, je souhaite une consultation offerte.", "",
      "• Pôle : " + pl.name + " (" + pl.sub + ")", "• Intervention : " + S.item,
      "• Échange : " + S.mode + ", le " + f.full + " à " + S.time + " (heure de Tunis)", "",
      "• Nom : " + S.info.prenom.trim() + " " + S.info.nom.trim(), "• Téléphone : " + S.info.tel.trim(), "• E-mail : " + S.info.email.trim(), "• Pays : " + S.info.pays];
    if (S.info.msg.trim()) L.push("", S.info.msg.trim());
    return L.join("\n");
  }
  function updateChrome() {
    const p = pct(); $("#sumPct").textContent = p + " %"; $("#sumBar").style.width = p + "%";
    const pl = S.pole && P(S.pole);
    $("#sumName").textContent = pl ? pl.name : "Votre projet";
    $("#sumSub").textContent = pl ? (S.item || pl.sub) : "Choisissez un pôle pour commencer";
    const im = $("#sumImg"), src = pl ? pl.img : D.detail;
    if (im.dataset.k !== (pl ? pl.id : "detail")) { im.dataset.k = pl ? pl.id : "detail"; im.style.opacity = 0; setTimeout(() => { im.src = src; im.style.opacity = 1; }, 220); }
    $("#bubbles").innerHTML = [1, 2, 3, 4].map(n => { const ok = n < S.step || (S.done && n === 4), cur = n === S.step && !S.done, back = ok && !S.done && n < S.step; return `<button type="button" class="bub ${ok ? "ok" : ""} ${cur ? "cur" : ""}" ${back ? "" : "disabled"} data-go="${n}" aria-label="Étape ${n}${ok ? ", terminée" : ""}${cur ? ", en cours" : ""}">${ok ? CHECK : n}</button>`; }).join("");
    $("#sLine").style.width = (S.done ? 100 : Math.min(100, (S.step - 1) / 3 * 100 + (valid(S.step) ? 22 : 6))) + "%";
    const tl = $("#timeline"); if (tl) tl.innerHTML = STEPS.map((s, i) => { const n = i + 1, ok = n < S.step || S.done, cur = n === S.step && !S.done; return `<div class="tl ${ok ? "ok" : ""} ${cur ? "cur" : ""}"><span class="n">${ok ? CHECK : n}</span><div><strong>${s.side}</strong><span>${s.sd}</span></div></div>`; }).join("");
    $("#fBack").hidden = S.step === 1;
    $("#fFoot").hidden = S.done;
    const nx = $("#fNext"); nx.innerHTML = (S.step === 3 ? "Vérifier ma demande " : "Continuer ") + ARROW;
    nx.disabled = S.step !== 3 && !valid(S.step);
    $("#fHint").textContent = S.step === 1 && !S.pole ? "Choisissez un pôle" : S.step === 1 && !S.item ? "Choisissez une intervention" : S.step === 2 && S.day === null ? "Choisissez un jour" : S.step === 2 && !S.time ? "Choisissez un créneau" : "";
  }
  const itemsHTML = () => { if (!S.pole) return `<p class="f-label" style="margin-top:32px;color:var(--muted)">Choisissez une intervention</p><p class="tz">Les interventions s’affichent dès que vous choisissez un pôle.</p>`;
    return `<p class="f-label" style="margin-top:32px">Choisissez une intervention</p><div class="chips" role="radiogroup" aria-label="Interventions">${P(S.pole).items.map(it => `<button type="button" class="chip ${S.item === it ? "sel" : ""}" role="radio" aria-checked="${S.item === it}" data-i="${esc(it)}">${esc(it)}</button>`).join("")}</div>`; };
  const body1 = () => `<div class="f-grid" role="radiogroup" aria-label="Pôles">${POLES.map(p => `<button type="button" class="fp ${S.pole === p.id ? "sel" : ""}" role="radio" aria-checked="${S.pole === p.id}" data-p="${p.id}" style="--c:${p.color}"><div class="im"><img src="${p.img}" alt=""></div><span class="ck" style="color:${p.color}">${CHECK}</span><div class="tx"><b>${p.name}</b><small>${p.sub}</small></div></button>`).join("")}</div><div id="items">${itemsHTML()}</div>`;
  const body2 = () => `<p class="f-label">Comment préférez-vous échanger ?</p><div class="chips" role="radiogroup" aria-label="Mode d’échange">${["Visio", "WhatsApp", "Téléphone"].map(m => `<button type="button" class="chip ${S.mode === m ? "sel" : ""}" data-m="${m}" role="radio" aria-checked="${S.mode === m}">${m}</button>`).join("")}</div>
  <p class="f-label">Choisissez un jour</p><div class="days" role="radiogroup" aria-label="Jour">${DAYS.map((d, i) => { const f = fmtD(d); return `<button type="button" class="day ${S.day === i ? "sel" : ""}" data-d="${i}" role="radio" aria-checked="${S.day === i}" aria-label="${f.full}"><small>${f.wd}</small><b>${f.n}</b><small>${f.m}</small></button>`; }).join("")}</div>
  <p class="f-label">Choisissez un créneau</p><div class="chips" role="radiogroup" aria-label="Créneau">${TIMES.map(t => `<button type="button" class="chip ${S.time === t ? "sel" : ""}" data-t="${t}" role="radio" aria-checked="${S.time === t}" style="font-variant-numeric:tabular-nums">${t}</button>`).join("")}</div><p class="tz">Heure de Tunis (UTC+1). La consultation dure environ 20 minutes.</p>`;
  const body3 = () => { const I = S.info; const f = (id, lab, type, ph, ac) => `<div class="fld" id="w-${id}"><label for="f-${id}">${lab}</label><input id="f-${id}" name="${id}" type="${type}" value="${esc(I[id])}" placeholder="${ph}" autocomplete="${ac}"><span class="msg" id="m-${id}"></span></div>`;
    return `<form id="infoForm" novalidate><div class="fields">${f("prenom", "Prénom", "text", "Camille", "given-name")}${f("nom", "Nom", "text", "Martin", "family-name")}${f("tel", S.mode === "WhatsApp" ? "Numéro WhatsApp" : "Téléphone", "tel", "+33 6 12 34 56 78", "tel")}${f("email", "E-mail", "email", "camille@exemple.fr", "email")}
  <div class="fld full"><label for="f-pays">Pays de résidence</label><select id="f-pays" name="pays">${["France", "Belgique", "Suisse", "Canada", "Allemagne", "États-Unis", "Luxembourg", "Algérie", "Maroc", "Tunisie", "Autre"].map(c => `<option ${I.pays === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
  <div class="fld full"><label for="f-msg">Votre projet en quelques mots <span style="font-weight:400;color:var(--muted)">(facultatif)</span></label><textarea id="f-msg" name="msg" placeholder="Vos attentes, vos questions, vos dates de disponibilité…">${esc(I.msg)}</textarea></div></div>
  <label class="consent" id="w-consent"><input type="checkbox" id="f-consent" ${S.consent ? "checked" : ""}><span>J’accepte d’être recontacté·e par un conseiller Perma.doctor au sujet de ma demande. Mes données sont traitées de façon confidentielle.</span></label></form>`; };
  const body4 = () => { const pl = P(S.pole), f = fmtD(DAYS[S.day]), msg = message();
    const wa = "https://wa.me/" + SITE.whatsapp + "?text=" + encodeURIComponent(msg);
    const ml = "mailto:" + SITE.email + "?subject=" + encodeURIComponent("Consultation offerte — " + pl.name + " · " + S.item) + "&body=" + encodeURIComponent(msg);
    return `<div class="done"><svg class="big" viewBox="0 0 80 80" fill="none" stroke="var(--pole)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="40" cy="40" r="36"/><path d="m26 41 9 9 19-19"/></svg>
  <p style="font-size:1.05rem">Merci ${esc(S.info.prenom.trim())}. Envoyez votre demande : un conseiller vous contactera par <b>${S.mode === "Visio" ? "visio" : S.mode}</b> le <b>${f.full} à ${S.time}</b>, heure de Tunis.</p>
  <dl class="recap"><div><dt>Pôle</dt><dd>${pl.name}</dd></div><div><dt>Intervention</dt><dd>${esc(S.item)}</dd></div><div><dt>Échange</dt><dd>${S.mode}</dd></div><div><dt>E-mail</dt><dd>${esc(S.info.email.trim())}</dd></div></dl>
  <div class="send"><a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">Envoyer via WhatsApp ${ARROW}</a><a class="btn btn-ghost" href="${ml}">Envoyer par e-mail</a></div>
  <button type="button" class="link-arrow" id="restart" style="background:none;border:0;padding:0">Modifier ma demande</button></div>`; };
  function pick(btn, key, val) { S[key] = val; [...btn.parentElement.children].forEach(b => { const on = b === btn; b.classList.toggle("sel", on); b.setAttribute("aria-checked", on); }); }
  function bind() {
    fBody.onclick = e => {
      const p = e.target.closest("[data-p]"), it = e.target.closest("[data-i]"), m = e.target.closest("[data-m]"), d = e.target.closest("[data-d]"), t = e.target.closest("[data-t]");
      if (p) { if (S.pole !== p.dataset.p) { S.pole = p.dataset.p; S.item = null; } pick(p, "pole", p.dataset.p); $("#items").innerHTML = itemsHTML(); setPoleColor(); if (innerWidth < 900) setTimeout(() => scrollToEl($("#items"), -innerHeight * .3), 120); }
      if (it) pick(it, "item", it.dataset.i);
      if (m) pick(m, "mode", m.dataset.m);
      if (d) pick(d, "day", +d.dataset.d);
      if (t) pick(t, "time", t.dataset.t);
      if (e.target.closest("#restart")) { S.done = false; go(1, true); return; }
      updateChrome();
    };
    const onIn = e => { const n = e.target.name; if (n && n in S.info) { S.info[n] = e.target.value; if (S.tried) check3(); } if (e.target.id === "f-consent") { S.consent = e.target.checked; if (S.tried) check3(); } updateChrome(); };
    fBody.oninput = onIn; fBody.onchange = onIn;
    const form = $("#infoForm"); if (form) form.onsubmit = e => { e.preventDefault(); next(); };
  }
  function check3() { const I = S.info, rules = { prenom: [I.prenom.trim(), "Indiquez votre prénom."], nom: [I.nom.trim(), "Indiquez votre nom."], tel: [telOk(I.tel), "Indiquez un numéro d’au moins 8 chiffres, avec l’indicatif du pays."], email: [emailOk(I.email), "Indiquez une adresse e-mail valide, par exemple nom@exemple.fr."] };
    let first = null; Object.entries(rules).forEach(([k, [ok, msg]]) => { $("#w-" + k).classList.toggle("err", !ok); $("#m-" + k).textContent = ok ? "" : msg; if (!ok && !first) first = $("#f-" + k); });
    $("#w-consent").classList.toggle("err", !S.consent); if (!S.consent && !first) first = $("#f-consent"); return first; }
  function go(n, focus) {
    fBody.classList.add("out");
    setTimeout(() => { S.step = n; const s = STEPS[n - 1]; $("#fTitle").textContent = s.t; $("#fSub").textContent = s.s; fBody.innerHTML = [body1, body2, body3, body4][n - 1](); bind(); updateChrome();
      requestAnimationFrame(() => fBody.classList.remove("out"));
      if (focus) { const top = flow.getBoundingClientRect().top; if (top < 0 || top > innerHeight * .5) scrollToEl(flow, -90); $("#fTitle").focus({ preventScroll: true }); } }, RM ? 0 : 260);
  }
  function next() {
    if (S.step === 3) { S.tried = true; const bad = check3(); if (bad) { bad.focus(); return; } S.done = true; go(4, true); return; }
    if (valid(S.step)) go(S.step + 1, true);
  }
  $("#fNext").onclick = next;
  $("#fBack").onclick = () => { if (S.step > 1) go(S.step - 1, true); };
  $("#bubbles").addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b && !b.disabled) go(+b.dataset.go, true); });
  /* liens « réserver ce pôle » présents dans la même page */
  document.addEventListener("click", e => { const a = e.target.closest("[data-book]"); if (!a) return; e.preventDefault(); setMenu(false); Object.assign(S, { done: false, pole: a.dataset.book, item: a.dataset.item || null }); setPoleColor(); go(1); scrollToEl($("#rdv"), -40); });
  setPoleColor();
  $("#fTitle").textContent = STEPS[0].t; $("#fSub").textContent = STEPS[0].s; fBody.innerHTML = body1(); bind(); updateChrome();
}

/* ——— ancres internes en défilement fluide ——— */
document.addEventListener("click", e => { const a = e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented) return; const id = a.getAttribute("href"); const t = id === "#top" ? document.body : (id.length > 1 && document.querySelector(id)); if (!t) return; e.preventDefault(); setMenu(false); scrollToEl(t, id === "#top" ? 0 : -40); });
if (location.hash && $(location.hash)) setTimeout(() => scrollToEl($(location.hash), -40), 400);

/* ——— signature géante du pied de page ——— */
const giant = $(".ft-giant");
if (giant && giantIn) { const fitGiant = () => { giant.style.fontSize = "100px"; const w = giantIn.getBoundingClientRect().width, cw = giant.clientWidth; if (w > 0) giant.style.fontSize = (100 * cw / w * .99).toFixed(2) + "px"; }; fitGiant(); addEventListener("resize", fitGiant); if (document.fonts) document.fonts.ready.then(fitGiant); }

/* ——— préchargeur (première visite) ——— */
function runPreloader() {
  const pl = $("#pl"), mark = $("#plMark"), strokes = $$(".pl-stroke", pl), fill = $("#plFill"), word = $(".pl-word", pl), meta = $(".pl-meta", pl), num = $("#plNum"), cnt = $(".pl-count", pl), zoom = $("#plZoom"), cp = $("#plClipPath"), img = $("#plImg"), skipB = $("#plSkip");
  const hm = $(".hero-media img"); if (hm) img.setAttribute("href", hm.getAttribute("src"));
  document.documentElement.classList.add("is-loading"); if (lenis) lenis.stop();
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, expo = t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2, cl = (a, b, t) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  const AX = 48, AY = 55.4, AR = 11.7; let G, T0 = performance.now(), skip = 0, done = false;
  function layout() { const r = mark.getBoundingClientRect(), W = innerWidth, H = innerHeight, u = r.height / 100, ax = r.left + AX * u, ay = r.top + AY * u;
    zoom.setAttribute("viewBox", `0 0 ${W} ${H}`); img.setAttribute("width", W); img.setAttribute("height", H);
    const far = Math.max(Math.hypot(ax, ay), Math.hypot(W - ax, ay), Math.hypot(ax, H - ay), Math.hypot(W - ax, H - ay)); G = { u, ax, ay, kEnd: far / (AR * u) * 1.15 }; }
  layout(); addEventListener("resize", layout);
  skipB.onclick = pl.onclick = () => { const t = (performance.now() - T0) / 1000 + skip; if (t < 2.15) skip += 2.15 - t; };
  function finish() { if (done) return; done = true; removeEventListener("resize", layout); pl.remove(); document.documentElement.classList.remove("is-loading"); if (lenis) lenis.start(); startIntro(); frame(); }
  function tick(now) { if (done) return; const t = (now - T0) / 1000 + skip;
    strokes.forEach((p, i) => { p.style.strokeDashoffset = (1 - ease(cl(.05 + i * .14, 1 + i * .14, t))).toFixed(4); p.style.opacity = (1 - cl(1.4, 1.75, t)).toFixed(3); });
    fill.style.opacity = (cl(1, 1.55, t) * (1 - cl(2, 2.4, t))).toFixed(3);
    const wi = ease(cl(.75, 1.4, t)), wo = ease(cl(1.8, 2.15, t)); word.style.opacity = (wi * (1 - wo)).toFixed(3); word.style.transform = `translateY(${((1 - wi) * 26 - wo * 18).toFixed(1)}px)`;
    meta.style.opacity = (cl(.35, .9, t) * (1 - cl(1.85, 2.15, t))).toFixed(3); skipB.style.opacity = (.8 * (1 - cl(1.85, 2.15, t))).toFixed(3);
    num.textContent = Math.round(ease(cl(0, 2.1, t)) * 100); cnt.style.opacity = (1 - cl(2.1, 2.4, t)).toFixed(3);
    zoom.style.opacity = cl(1.95, 2.35, t).toFixed(3);
    const k = 1 + (G.kEnd - 1) * expo(cl(2.35, 3.45, t));
    cp.setAttribute("transform", `translate(${G.ax.toFixed(2)} ${G.ay.toFixed(2)}) scale(${(G.u * k).toFixed(4)}) translate(${-AX} ${-AY})`);
    pl.style.opacity = (1 - cl(3.35, 3.85, t)).toFixed(3);
    if (t >= 3.85) return finish(); requestAnimationFrame(tick); }
  setTimeout(finish, 6500); requestAnimationFrame(tick);
}
if (PLON) { const run = () => { try { runPreloader(); } catch (e) { const p = $("#pl"); p && p.remove(); document.documentElement.classList.remove("is-loading"); if (lenis) lenis.start(); startIntro(); } };
  (document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 800))]) : Promise.resolve()).then(run); }
})();
