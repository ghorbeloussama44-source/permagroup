/* Permagroup — moteur WebGL (WebGL1, sans dépendance)
 * - Diaporama « liquide » : dissolution par bruit + ondulation suivant la souris
 *   + aberration chromatique liée à la vitesse du curseur + parallaxe au scroll.
 * - Si une image est introuvable ou « tainted » (file://), la couche bascule sur
 *   une soie procédurale (domain-warped fbm) : le rendu reste toujours abouti.
 */
(function (global) {
  'use strict';

  var VERT = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'varying vec2 vUv;',
    'uniform sampler2D t0,t1;',
    'uniform vec2 uRes,uR0,uR1,uMouse;',
    'uniform float uP,uT,uVel,uScroll,uK0,uK1,uV0,uV1,uDark,uIn;',

    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    '  return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',

    'vec2 cover(vec2 uv,vec2 r){',
    '  float ca=uRes.x/uRes.y,ia=r.x/r.y;',
    '  vec2 s=ca>ia?vec2(1.,ia/ca):vec2(ca/ia,1.);',
    '  return (uv-.5)*s+.5;}',

    /* soie procédurale : variantes de palette via v */
    'vec3 silk(vec2 uv,float v){',
    '  vec2 q=uv*vec2(uRes.x/uRes.y,1.)*1.6;',
    '  float t=uT*.045+v*3.7;',
    '  vec2 a=vec2(fbm(q+t),fbm(q+vec2(5.2,1.3)-t));',
    '  vec2 b=vec2(fbm(q+3.2*a+vec2(1.7,9.2)+.35*t),fbm(q+3.2*a+vec2(8.3,2.8)-.3*t));',
    '  float f=fbm(q+3.4*b);',
    '  vec3 deep=mix(vec3(.93,.91,.87),vec3(.90,.92,.92),fract(v*.37));',
    '  vec3 mid=mix(vec3(.55,.80,.79),vec3(.78,.74,.88),fract(v*.37+.12));',
    '  vec3 hi=mix(vec3(.99,.98,.96),vec3(.93,.84,.68),fract(v*.5));',
    '  vec3 c=mix(deep,mid,clamp(f*f*3.4,0.,1.));',
    '  c=mix(c,hi,smoothstep(.52,1.,f)*.55);',
    '  c=mix(c,vec3(.79,.66,.42),clamp(length(a)-.5,0.,1.)*.32);',
    '  return c;}',

    'vec3 layer(sampler2D t,vec2 uv,vec2 r,float k,float v,float ca){',
    '  if(k>.5){vec2 u=cover(uv,r);',
    '    return vec3(texture2D(t,u+vec2(ca,0.)).r,texture2D(t,u).g,texture2D(t,u-vec2(ca,0.)).b);}',
    '  return silk(uv,v);}',

    'void main(){',
    '  vec2 uv=vUv;',
    '  vec2 asp=vec2(uRes.x/uRes.y,1.);',
    '  vec2 d=(uv-uMouse)*asp; float r=length(d);',
    '  float ring=sin(r*34.-uT*2.6)*exp(-r*5.);',
    '  vec2 disp=normalize(d+1e-4)*ring*(.004+uVel*.05);',
    '  disp+=(vec2(fbm(uv*3.+uT*.05),fbm(uv*3.+7.-uT*.05))-.5)*.006;',
    /* parallaxe scroll + léger zoom d’entrée */
    '  uv.y-=uScroll*.10;',
    '  uv=(uv-.5)*(1.-.05*uScroll-.06*(1.-uIn))+.5;',
    '  float nz=fbm(vUv*2.6+uT*.03);',
    '  float p=uP;',
    '  float ca=uVel*.014+sin(p*3.14159)*.012;',
    '  vec3 c0=layer(t0,uv+disp+(nz-.5)*p*.32,uR0,uK0,uV0,ca);',
    '  vec3 c1=layer(t1,uv+disp-(nz-.5)*(1.-p)*.32,uR1,uK1,uV1,ca);',
    '  float m=smoothstep(nz-.09,nz+.09,p*1.18-.09);',
    '  vec3 col=mix(c0,c1,m);',
    /* étalonnage clair : voile crème à gauche (paysage) ou en bas (portrait) */
    '  vec3 cream=vec3(.965,.949,.918);',
    '  float port=step(uRes.x,uRes.y);',
    '  float left=(1.-smoothstep(.16,.6,vUv.x))*(1.-port);',
    '  float bot=(1.-smoothstep(.0,.2,vUv.y))*port;',
    '  col=mix(col,cream,clamp(left*.97+bot,0.,1.));',
    '  float vg=smoothstep(1.25,.3,length((vUv-.5)*vec2(1.,.8)));',
    '  col=mix(cream,col,.84+.16*vg);',
    '  col+=vec3(.06,.35,.36)*exp(-r*r*16.)*.07*(1.+uVel*4.);',
    '  col+=(h(vUv*uRes+fract(uT))-.5)*.03;',
    '  gl_FragColor=vec4(mix(cream,col,uIn),1.);',
    '}'
  ].join('\n');

  var DPR_CAP = (window.matchMedia && matchMedia('(pointer:coarse)').matches) ? 1.25 : 1.75;
  var instances = [];
  var rafId = 0;

  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s));
    }
    return s;
  }

  function FX(canvas, urls, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.urls = urls && urls.length ? urls : [null];
    this.dark = opts.dark || 0;
    this.host = opts.host || canvas.parentNode;
    this.cur = 0; this.next = 0; this.p = 0; this.tween = null;
    this.mouse = { x: .5, y: .5, tx: .5, ty: .5, vel: 0 };
    this.scroll = 0; this.intro = 0; this.visible = true; this.t0 = performance.now();
    this.ok = false;
    this.onLost = this.onLost.bind(this);
    this.onRestore = this.onRestore.bind(this);
    canvas.addEventListener('webglcontextlost', this.onLost, false);
    canvas.addEventListener('webglcontextrestored', this.onRestore, false);
    if (!this.init()) return;
    this.bind();
    instances.push(this);
    this.ok = true;
    start();
  }

  FX.prototype.init = function () {
    var gl = this.canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }) ||
             this.canvas.getContext('experimental-webgl');
    if (!gl) return false;
    this.gl = gl;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    try {
      var pr = gl.createProgram();
      gl.attachShader(pr, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(pr, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.bindAttribLocation(pr, 0, 'p');
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      gl.useProgram(pr);
      this.pr = pr;
    } catch (e) {
      if (global.console) console.warn('[perma-webgl]', e.message);
      return false;
    }
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    var u = {}, names = ['t0', 't1', 'uRes', 'uR0', 'uR1', 'uMouse', 'uP', 'uT', 'uVel', 'uScroll', 'uK0', 'uK1', 'uV0', 'uV1', 'uDark', 'uIn'];
    for (var i = 0; i < names.length; i++) u[names[i]] = gl.getUniformLocation(this.pr, names[i]);
    this.u = u;
    gl.uniform1i(u.t0, 0); gl.uniform1i(u.t1, 1);
    this.loadTextures();
    this.resize();
    return true;
  };

  FX.prototype.loadTextures = function () {
    var gl = this.gl, self = this;
    this.tex = [];
    this.urls.forEach(function (url, i) {
      var t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([7, 25, 29, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      var rec = { t: t, k: 0, w: 1, h: 1, v: i + 1 };
      self.tex.push(rec);
      if (!url) return;
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        try {
          gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          rec.w = img.naturalWidth; rec.h = img.naturalHeight; rec.k = 1;
        } catch (e) { rec.k = 0; }   /* SecurityError (file://) → soie */
      };
      img.onerror = function () { rec.k = 0; };
      img.src = url;
    });
  };

  FX.prototype.onLost = function (e) { e.preventDefault(); this.lost = true; };
  FX.prototype.onRestore = function () { this.lost = false; this.init(); };

  FX.prototype.resize = function () {
    var dpr = Math.min(global.devicePixelRatio || 1, DPR_CAP);
    var r = this.host.getBoundingClientRect();
    var w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
    this.gl.uniform2f(this.u.uRes, w, h);
  };

  FX.prototype.bind = function () {
    var self = this;
    this.onMove = function (e) {
      var r = self.host.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
      self.mouse.tx = Math.min(1, Math.max(0, x));
      self.mouse.ty = Math.min(1, Math.max(0, y));
    };
    global.addEventListener('pointermove', this.onMove, { passive: true });
    this.onResize = function () { self.resize(); };
    global.addEventListener('resize', this.onResize);
    if ('IntersectionObserver' in global) {
      this.io = new IntersectionObserver(function (en) { self.visible = en[0].isIntersecting; }, { threshold: 0 });
      this.io.observe(this.host);
    }
  };

  FX.prototype.go = function (i, dur) {
    var n = this.urls.length;
    i = ((i % n) + n) % n;
    if (this.tween || i === this.cur) return false;
    this.next = i;
    this.tween = { s: performance.now(), d: dur || 1700 };
    return true;
  };

  FX.prototype.setScroll = function (v) { this.scroll = Math.min(1, Math.max(0, v)); };

  FX.prototype.draw = function (now) {
    if (this.lost) return;
    var gl = this.gl, u = this.u, m = this.mouse;
    var px = m.x, py = m.y;
    m.x += (m.tx - m.x) * .07; m.y += (m.ty - m.y) * .07;
    var sp = Math.hypot(m.x - px, m.y - py) * 14;
    m.vel += (Math.min(1, sp) - m.vel) * .12;

    if (this.tween) {
      var k = (now - this.tween.s) / this.tween.d;
      if (k >= 1) { this.cur = this.next; this.p = 0; this.tween = null; }
      else this.p = ease(k);
    }
    if (this.intro < 1) this.intro = Math.min(1, (now - this.t0) / 2200);

    var a = this.tex[this.cur], b = this.tex[this.tween ? this.next : this.cur];
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, a.t);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, b.t);
    gl.uniform2f(u.uR0, a.w, a.h); gl.uniform2f(u.uR1, b.w, b.h);
    gl.uniform1f(u.uK0, a.k); gl.uniform1f(u.uK1, b.k);
    gl.uniform1f(u.uV0, a.v); gl.uniform1f(u.uV1, b.v);
    gl.uniform2f(u.uMouse, m.x, m.y);
    gl.uniform1f(u.uP, this.p);
    gl.uniform1f(u.uT, (now - this.t0) / 1000);
    gl.uniform1f(u.uVel, m.vel);
    gl.uniform1f(u.uScroll, this.scroll);
    gl.uniform1f(u.uDark, this.dark);
    gl.uniform1f(u.uIn, ease(this.intro));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  FX.prototype.destroy = function () {
    global.removeEventListener('pointermove', this.onMove);
    global.removeEventListener('resize', this.onResize);
    if (this.io) this.io.disconnect();
    var i = instances.indexOf(this); if (i > -1) instances.splice(i, 1);
  };

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    if (document.hidden) return;
    for (var i = 0; i < instances.length; i++) {
      if (instances[i].visible) instances[i].draw(now);
    }
  }
  function start() { if (!rafId) rafId = requestAnimationFrame(loop); }

  global.PermaGL = { FX: FX, instances: instances };
})(window);
