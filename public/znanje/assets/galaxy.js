// Brain galaxy: a spiral of stars that assembles into a brain. Topic clusters sit in its regions as
// tinted nebulae, connected by filaments that carry beads of light. Scroll flies the camera cluster
// to cluster; drag rotates. Plain WebGL, no dependencies. The brain shape is a point cloud rebuilt
// from three reference views (concierge/znanje/brain-points.py). Without WebGL or with reduced
// motion the section becomes a static grid.
(() => {
  const section = document.querySelector('[data-galaxy]');
  const dataNode = document.getElementById('galaxy-data');
  if (!section || !dataNode) return;
  const canvas = section.querySelector('.g-canvas');
  const sticky = section.querySelector('.g-sticky');
  const labelLayer = section.querySelector('.g-labels');
  const panels = [...section.querySelectorAll('.g-panel')];
  const railLinks = [...section.querySelectorAll('.g-rail a')];
  const clusters = JSON.parse(dataNode.textContent).clusters;
  const staticMode = () => section.classList.add('is-static');
  const ASSETS = '/media/znanje/';

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return staticMode();
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, powerPreference: 'high-performance' });
  if (!gl) return staticMode();

  const small = matchMedia('(max-width: 760px)').matches;
  const BRAIN_POINTS = small ? 6500 : 13600;
  const STARS = small ? 500 : 1100;
  const AXONS = small ? 60 : 130;
  const SEGMENTS = 18;

  // Deterministic randomness so the galaxy looks the same on every visit.
  let seed = 20261113;
  const rand = () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const gauss = () => (rand() + rand() + rand() + rand() - 2) / 2;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mulS = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  const norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const mix = (a, b, t) => a + (b - a) * t;
  const sphereDir = () => { const z = rand() * 2 - 1, a = rand() * Math.PI * 2, r = Math.sqrt(1 - z * z); return [r * Math.cos(a), z, r * Math.sin(a)]; };

  const cores = clusters.map(c => c.pos);
  const colors = clusters.map(c => hex(c.color));
  const SILVER = [0.74, 0.8, 0.92];

  // Procedural stand-in, used only when the reconstructed point cloud cannot be fetched.
  function proceduralBrainPoint() {
    const d = sphereDir(), side = rand() < 0.5 ? -1 : 1;
    const fold = 1 + 0.05 * Math.sin(d[1] * 15 + Math.sin(d[2] * 9) * 2.2) + 0.03 * Math.sin(d[2] * 23 + d[1] * 6);
    let x = (Math.abs(d[0]) * 0.66 + 0.035) * fold, y = d[1] * 0.6 * fold;
    x *= 1 - 0.2 * Math.max(0, d[2]) ** 2;
    if (y < -0.3) y = -0.3 + (y + 0.3) * 0.4;
    return [side * x, y + 0.05, d[2] * 0.95 * fold, 0.3 + rand() * 0.7];
  }
  function galaxyPoint() {
    const r = 0.25 + 2.9 * rand() ** 0.62, arm = Math.floor(rand() * 3);
    const a = r * 2.1 + arm * (Math.PI * 2 / 3) + gauss() * 0.42;
    return [Math.cos(a) * r, gauss() * 0.3 * Math.exp(-r * 0.5), Math.sin(a) * r];
  }
  function nearest(p) {
    let best = -1, bd = 9;
    cores.forEach((c, i) => { const d = len(sub(p, c)); if (d < bd) { bd = d; best = i; } });
    return [best, bd];
  }

  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const program = (vs, fs) => { const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
  const buffer = data => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); return b; };
  const uniforms = (prog, names) => Object.fromEntries(names.map(n => [n, gl.getUniformLocation(prog, n)]));
  function bind(prog, buf, layout) {
    const stride = layout.reduce((n, l) => n + l[1], 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    let offset = 0;
    for (const [name, size] of layout) {
      const loc = gl.getAttribLocation(prog, name);
      if (loc >= 0) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride * 4, offset * 4); }
      offset += size;
    }
  }
  // Textures start as one black pixel: under additive blending that is invisible until the image arrives.
  function texture(file, repeat) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([0]));
    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    img.src = ASSETS + file;
    return tex;
  }

  const FOCUS = 'float f=(uFocus<-.5||aK<-.5)?1.:(abs(aK-uFocus)<.5?1.5:.4);';
  let pointProgram, lineProgram, ribbonProgram, spriteProgram;
  try {
    pointProgram = program(`attribute vec3 a0,a1,aC;attribute float aS,aP,aK;uniform mat4 uM;uniform float uT,uMix,uScale,uFocus;varying vec3 vC;varying float vA;
void main(){float m=clamp(uMix*1.35-aP*0.35,0.,1.);m=m*m*(3.-2.*m);vec3 p=mix(a0,a1,m);p+=0.005*vec3(sin(uT*.7+aP*40.),cos(uT*.6+aP*31.),sin(uT*.5+aP*23.));
gl_Position=uM*vec4(p,1.);float tw=.74+.26*sin(uT*1.4+aP*6.283);${FOCUS}
gl_PointSize=clamp(aS*uScale*tw*2.3/max(gl_Position.w,.2),1.6,10.*uScale+5.);vC=aC;vA=tw*f*mix(.6,1.25,m);}`,
      `precision mediump float;varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);a=(a*a*1.15+pow(a,7.)*1.1)*vA;gl_FragColor=vec4(vC*a,a);}`);
    lineProgram = program(`attribute vec3 aP,aC;attribute float aU,aO,aA;uniform mat4 uM;varying vec3 vC;varying float vU,vO,vA;
void main(){gl_Position=uM*vec4(aP,1.);vC=aC;vU=aU;vO=aO;vA=aA;}`,
      `precision mediump float;uniform float uT,uMix,uFocus;varying vec3 vC;varying float vU,vO,vA;
void main(){float sp=.16+.22*fract(vO*7.);float x=fract(vU-uT*sp+vO)-.5;float pulse=exp(-x*x*90.);float a=vA*(uFocus<-.5?1.:.55)*(.3+1.9*pulse)*uMix*uMix;gl_FragColor=vec4(vC*a,a);}`);
    // Filaments are camera-facing ribbons; the texture slides along them, so its beads read as signals.
    ribbonProgram = program(`attribute vec3 aP,aQ,aC;attribute float aSide,aV,aU,aO,aK,aA;uniform mat4 uM;uniform float uAspect,uWidth,uFocus;varying vec3 vC;varying float vU,vV,vO,vA;
void main(){vec4 a=uM*vec4(aP,1.),b=uM*vec4(aQ,1.);vec2 d=(b.xy/max(b.w,.01)-a.xy/max(a.w,.01))*vec2(uAspect,1.);d=normalize(d+vec2(1e-5,0.));
a.xy+=vec2(-d.y,d.x)*aSide*uWidth*vec2(1./uAspect,1.);gl_Position=a;float f=aK<-1.5?.8:(uFocus<-.5?1.:(abs(aK-uFocus)<.5?1.7:.28));vC=aC;vU=aU;vV=aV;vO=aO;vA=aA*f;}`,
      `precision mediump float;uniform sampler2D uTex;uniform float uT,uMix;varying vec3 vC;varying float vU,vV,vO,vA;
void main(){float sp=.035+.05*fract(vO*7.);float t=texture2D(uTex,vec2(vU*.28-uT*sp+vO,vV)).r;float edge=smoothstep(0.,.08,vU)*smoothstep(1.,.92,vU);float a=vA*t*(.55+.45*edge)*1.5*uMix*uMix;gl_FragColor=vec4(mix(vC,vec3(1.),t*t*.6)*a,a);}`);
    spriteProgram = program(`attribute vec3 aP,aC;attribute vec2 aCorner;attribute float aS,aK,aR,aI;uniform mat4 uM;uniform float uT,uAspect,uFocus;varying vec3 vC;varying vec2 vUv;varying float vA;
void main(){vec4 c=uM*vec4(aP,1.);float g=aR*uT+aR*40.;float cs=cos(g),sn=sin(g);vec2 o=vec2(aCorner.x*cs-aCorner.y*sn,aCorner.x*sn+aCorner.y*cs);
c.xy+=o*aS*vec2(1./uAspect,1.);gl_Position=c;${FOCUS}f=min(f,1.12);vUv=aCorner*.5+.5;vC=aC;vA=aI*f*(.88+.12*sin(uT*.9+aR*90.));}`,
      `precision mediump float;uniform sampler2D uTex;uniform float uMix;varying vec3 vC;varying vec2 vUv;varying float vA;
void main(){float t=texture2D(uTex,vUv).r;float a=t*vA*uMix*uMix;gl_FragColor=vec4(mix(vC,vec3(1.),t*t*.7)*a,a);}`);
  } catch (error) { console.warn('Galaxy shaders unavailable', error); return staticMode(); }

  fetch(ASSETS + 'brain-points.bin').then(r => r.ok ? r.arrayBuffer() : null).catch(() => null).then(start);

  function start(cloud) {
    const data = cloud ? new Int16Array(cloud) : null;
    const brainCount = data ? Math.min(data.length / 4, BRAIN_POINTS) : BRAIN_POINTS;

    // ---- points: start(3) end(3) size colour(3) phase cluster
    const pts = [], surface = [];
    const pushPoint = (from, to, size, col, k) => pts.push(from[0], from[1], from[2], to[0], to[1], to[2], size, col[0], col[1], col[2], rand(), k);
    for (let i = 0; i < brainCount; i++) {
      const b = data ? [data[i * 4] / 20000, data[i * 4 + 1] / 20000, data[i * 4 + 2] / 20000, data[i * 4 + 3] / 32767] : proceduralBrainPoint();
      const p = [b[0], b[1], b[2]], [k, d] = nearest(p), tint = Math.max(0, 1 - d / 0.5) * 0.85;
      const c = colors[k], col = [mix(SILVER[0], c[0], tint), mix(SILVER[1], c[1], tint), mix(SILVER[2], c[2], tint)];
      // Brighter reference pixels are the ridges of the folds, so they get larger, hotter stars.
      pushPoint(galaxyPoint(), p, 1.8 + b[3] * 4.6, mulS(col, 0.28 + b[3] * 0.85), d < 0.4 ? k : -1);
      if (i % 6 === 0 && p[1] > -0.5) surface.push(p);
    }
    for (let i = 0; i < STARS; i++) {
      const p = mulS(sphereDir(), 5 + rand() * 5);
      pushPoint(p, p, 1.6 + rand() * 2.4, mulS(SILVER, 0.25 + rand() * 0.4), -1);
    }
    const nodes = []; // {p, k, t, h}
    clusters.forEach((c, k) => {
      const core = cores[k], out = norm(len(core) < 0.3 ? [0, 0.35, 1] : core), n = c.nodes.length;
      for (let i = 0; i < 60; i++) pushPoint(galaxyPoint(), add(core, mulS([gauss(), gauss(), gauss()], 0.08)), 3 + rand() * 4, colors[k], k);
      c.nodes.forEach((node, j) => {
        const y = 1 - (j + 0.5) / n * 2, r = Math.sqrt(1 - y * y), a = j * 2.39996;
        const dir = norm(add([Math.cos(a) * r, y, Math.sin(a) * r], mulS(out, 0.75)));
        const p = add(core, mulS(dir, 0.2 + (j % 3) * 0.035));
        nodes.push({ p, k, t: node.t, h: node.h });
        for (let i = 0; i < 8; i++) pushPoint(galaxyPoint(), add(p, mulS([gauss(), gauss(), gauss()], 0.022)), 2.5 + rand() * 2.5, colors[k], k);
      });
    });
    const pointCount = pts.length / 12;

    // ---- threads: thin lines for ambient axons, textured ribbons for the cluster filaments
    const lines = [], ribbons = [];
    function thread(a, b, bend, col, alpha, k, ribbon) {
      const mid = mulS(add(a, b), 0.5), side = norm(cross(sub(b, a), [gauss(), 1, gauss()]));
      const ctrl = add(add(mid, mulS(norm(mid), bend)), mulS(side, bend * 0.6)), off = rand();
      let prev = a;
      for (let i = 1; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS, s = 1 - t, u0 = (i - 1) / SEGMENTS;
        const p = [0, 1, 2].map(n => s * s * a[n] + 2 * s * t * ctrl[n] + t * t * b[n]);
        if (ribbon) {
          // Two triangles per segment. The end vertices look back along the segment, so their side flips.
          const v = (P, Q, sideSign, vTex, u) => ribbons.push(P[0], P[1], P[2], Q[0], Q[1], Q[2], sideSign, vTex, u, off, k, col[0], col[1], col[2], alpha);
          v(prev, p, 1, 1, u0); v(prev, p, -1, 0, u0); v(p, prev, -1, 1, t);
          v(prev, p, -1, 0, u0); v(p, prev, 1, 0, t); v(p, prev, -1, 1, t);
        } else {
          lines.push(prev[0], prev[1], prev[2], u0, off, col[0], col[1], col[2], alpha);
          lines.push(p[0], p[1], p[2], t, off, col[0], col[1], col[2], alpha);
        }
        prev = p;
      }
    }
    nodes.forEach(n => thread(cores[n.k], n.p, 0.05, colors[n.k], 0.9, n.k, true));
    for (let k = 1; k < cores.length; k++) thread(cores[0], cores[k], 0.12, [0.86, 0.9, 1], 0.6, -2, true);
    [[1, 2], [1, 3], [2, 4], [3, 4], [3, 7], [4, 7], [1, 5], [2, 6], [5, 3], [6, 4], [5, 7], [6, 7]].forEach(([a, b]) => thread(cores[a], cores[b], 0.2, mulS(add(colors[a], colors[b]), 0.5), 0.45, -2, true));
    for (let i = 0, guard = 0; i < AXONS && guard < 20000 && surface.length; guard++) {
      const a = surface[Math.floor(rand() * surface.length)], b = surface[Math.floor(rand() * surface.length)], d = len(sub(a, b));
      if (d < 0.22 || d > 0.62) continue;
      thread(a, b, 0.07, SILVER, 0.14, -1, false); i++;
    }

    // ---- sprites: centre(3) corner(2) size colour(3) cluster spin intensity
    const quad = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
    const sprite = (list, p, size, col, k, spin, intensity) => quad.forEach(c => list.push(p[0], p[1], p[2], c[0], c[1], size, col[0], col[1], col[2], k, spin, intensity));
    const nebulaA = [], nebulaB = [], stars = [];
    clusters.forEach((c, k) => {
      const dir = k % 2 ? 1 : -1;
      sprite(nebulaA, cores[k], 0.74, colors[k], k, 0.035 * dir, 0.5);
      sprite(nebulaB, cores[k], 0.5, colors[k], k, -0.06 * dir, 0.42);
      sprite(stars, cores[k], 0.2, add(mulS(colors[k], 0.45), [0.55, 0.55, 0.55]), k, 0, 0.9);
    });
    nodes.forEach(n => sprite(stars, n.p, 0.11, add(mulS(colors[n.k], 0.5), [0.5, 0.5, 0.5]), n.k, 0, 1));

    const pointBuffer = buffer(pts), lineBuffer = buffer(lines), ribbonBuffer = buffer(ribbons);
    const nebulaABuffer = buffer(nebulaA), nebulaBBuffer = buffer(nebulaB), starBuffer = buffer(stars);
    const POINT_LAYOUT = [['a0', 3], ['a1', 3], ['aS', 1], ['aC', 3], ['aP', 1], ['aK', 1]];
    const LINE_LAYOUT = [['aP', 3], ['aU', 1], ['aO', 1], ['aC', 3], ['aA', 1]];
    const RIBBON_LAYOUT = [['aP', 3], ['aQ', 3], ['aSide', 1], ['aV', 1], ['aU', 1], ['aO', 1], ['aK', 1], ['aC', 3], ['aA', 1]];
    const SPRITE_LAYOUT = [['aP', 3], ['aCorner', 2], ['aS', 1], ['aC', 3], ['aK', 1], ['aR', 1], ['aI', 1]];
    const pu = uniforms(pointProgram, ['uM', 'uT', 'uMix', 'uScale', 'uFocus']);
    const lu = uniforms(lineProgram, ['uM', 'uT', 'uMix', 'uFocus']);
    const ru = uniforms(ribbonProgram, ['uM', 'uT', 'uMix', 'uFocus', 'uAspect', 'uWidth', 'uTex']);
    const su = uniforms(spriteProgram, ['uM', 'uT', 'uMix', 'uFocus', 'uAspect', 'uTex']);
    const texStar = texture('star.webp'), texNebulaA = texture('nebula-a.webp'), texNebulaB = texture('nebula-b.webp'), texFilament = texture('filament.webp', true);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    // ---- labels (real links; the same destinations are also in the panels for keyboard and screen readers)
    const makeLabel = (text, href, cls, color) => { const el = document.createElement('a'); el.className = 'g-label ' + cls; el.textContent = text; el.href = href; el.tabIndex = -1; el.style.setProperty('--accent', color); labelLayer.append(el); return el; };
    const coreLabels = clusters.map((c, k) => { const el = makeLabel(c.name, '#' + c.id, 'is-core', c.color); el.addEventListener('click', e => { e.preventDefault(); goTo(k + 1); }); return el; });
    const nodeLabels = nodes.map(n => makeLabel(n.t, n.h, '', clusters[n.k].color));

    // ---- camera
    const perspective = (fov, aspect, near, far) => { const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far); return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]; };
    const lookAt = (eye, target) => { const z = norm(sub(eye, target)), x = norm(cross([0, 1, 0], z)), y = cross(z, x); return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]), -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]), -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]), 1]; };
    const multiply = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; };
    const stops = [{ target: [0, -0.05, 0], dist: 3.3, yaw: 0.9, pitch: 0.14 }, ...cores.map(c => {
      const centre = len(c) < 0.3;
      return { target: mulS(c, 0.92), dist: centre ? 1.7 : 1.32, yaw: centre ? 0 : Math.atan2(c[0], c[2]), pitch: centre ? 0.3 : Math.max(-0.1, Math.min(0.7, Math.asin(c[1] / len(c)) * 0.7)) };
    })];
    const cam = { target: [0, 0, 0], dist: 6.5, yaw: -0.9, pitch: 0.5 };
    const user = { yaw: 0, pitch: 0 };
    let stop = 0, frac = 0, mixValue = 0, started = 0, visible = false, width = 1, height = 1, dpr = 1, matrix = [], spin = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
      width = sticky.clientWidth; height = sticky.clientHeight;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    function readScroll() {
      const rect = section.getBoundingClientRect(), range = Math.max(1, rect.height - innerHeight);
      const p = Math.min(0.9999, Math.max(0, -rect.top / range)) * stops.length;
      const next = Math.floor(p);
      frac = p - next;
      if (next !== stop) { stop = next; user.yaw *= 0.3; user.pitch *= 0.3; syncPanels(); }
    }
    function syncPanels() {
      panels.forEach(p => p.classList.toggle('is-active', Number(p.dataset.stop) === stop));
      railLinks.forEach(a => a.classList.toggle('is-active', Number(a.dataset.go) === stop));
    }
    function goTo(index) {
      const rect = section.getBoundingClientRect(), range = rect.height - innerHeight;
      scrollTo({ top: scrollY + rect.top + range * (index + 0.45) / stops.length, behavior: 'smooth' });
    }
    railLinks.forEach(a => a.addEventListener('click', e => { e.preventDefault(); goTo(Number(a.dataset.go)); }));

    // Deep links such as /znanje/#seo land on the matching stop instead of the hidden panel.
    const fromHash = () => { const k = clusters.findIndex(c => '#' + c.id === location.hash); if (k >= 0) requestAnimationFrame(() => goTo(k + 1)); };
    addEventListener('hashchange', fromHash);

    let drag = null;
    canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' }; canvas.classList.add('is-dragging'); });
    addEventListener('pointermove', e => {
      if (!drag) return;
      user.yaw -= (e.clientX - drag.x) * 0.006;
      if (!drag.touch) user.pitch = Math.max(-0.9, Math.min(0.9, user.pitch + (e.clientY - drag.y) * 0.004));
      drag.x = e.clientX; drag.y = e.clientY;
    });
    const endDrag = () => { drag = null; canvas.classList.remove('is-dragging'); };
    addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);

    const angleLerp = (a, b, t) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };
    function project(p) {
      const x = matrix[0] * p[0] + matrix[4] * p[1] + matrix[8] * p[2] + matrix[12];
      const y = matrix[1] * p[0] + matrix[5] * p[1] + matrix[9] * p[2] + matrix[13];
      const w = matrix[3] * p[0] + matrix[7] * p[1] + matrix[11] * p[2] + matrix[15];
      return { x: ((x / w) * 0.5 + 0.5) * width, y: (1 - ((y / w) * 0.5 + 0.5)) * height, w };
    }
    // Nearest labels claim their space first; any label that would cover one already placed stays hidden.
    function placeLabels(items, on) {
      const placed = [];
      items.map(([el, p]) => ({ el, s: project(p) })).sort((a, b) => a.s.w - b.s.w).forEach(({ el, s }) => {
        const w = (el.offsetWidth || 120) / 2 + 6, h = (el.offsetHeight || 28) / 2 + 4;
        const show = on && s.w > 0.15 && s.x > w && s.x < width - w && !placed.some(r => Math.abs(r.x - s.x) < r.w + w && Math.abs(r.y - s.y) < r.h + h);
        el.classList.toggle('is-on', show);
        if (show) { placed.push({ x: s.x, y: s.y, w, h }); el.style.transform = `translate(-50%,-50%) translate(${s.x}px,${s.y}px)`; }
      });
    }

    function drawSprites(buf, tex, count, t, focus) {
      bind(spriteProgram, buf, SPRITE_LAYOUT);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.drawArrays(gl.TRIANGLES, 0, count);
    }

    let last = 0, raf = 0;
    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
      if (!started) started = now;
      const t = now / 1000;
      mixValue = Math.min(1, (now - started) / 2800);
      const goal = stops[stop], ease = 1 - Math.exp(-dt * 2.6);
      if (stop === 0 && !drag) spin += dt * 0.07;
      cam.target = [0, 1, 2].map(i => mix(cam.target[i], goal.target[i], ease));
      // Phones are narrow: the overview backs off far enough to keep the whole brain in frame.
      cam.dist = mix(cam.dist, goal.dist + (small ? (stop === 0 ? 2.0 : 0.5) : 0), ease);
      cam.yaw = angleLerp(cam.yaw, goal.yaw + (stop === 0 ? spin : (frac - 0.5) * 0.5) + user.yaw, ease);
      cam.pitch = mix(cam.pitch, goal.pitch + user.pitch, ease);
      const cp = Math.cos(cam.pitch), eye = add(cam.target, [Math.sin(cam.yaw) * cp * cam.dist, Math.sin(cam.pitch) * cam.dist, Math.cos(cam.yaw) * cp * cam.dist]);
      const aspect = width / height;
      matrix = multiply(perspective(0.85, aspect, 0.05, 40), lookAt(eye, cam.target));
      // Shift the view so the subject clears the text panel: right on desktop, up on phones.
      const sx = small ? 0 : 0.2, sy = small ? 0.24 : 0;
      for (const c of [0, 4, 8, 12]) { matrix[c] += sx * matrix[c + 3]; matrix[c + 1] += sy * matrix[c + 3]; }
      // The photographic backdrop drifts against the camera, the near dust faster than the far field.
      sticky.style.setProperty('--gx', (-Math.sin(cam.yaw) * 30).toFixed(1) + 'px');
      sticky.style.setProperty('--gy', (cam.pitch * 26 + (stop + frac) * -6).toFixed(1) + 'px');

      gl.clear(gl.COLOR_BUFFER_BIT);
      const focus = stop === 0 ? -1 : stop - 1;
      gl.activeTexture(gl.TEXTURE0);

      gl.useProgram(spriteProgram);
      gl.uniformMatrix4fv(su.uM, false, matrix); gl.uniform1f(su.uT, t); gl.uniform1f(su.uMix, mixValue); gl.uniform1f(su.uFocus, focus); gl.uniform1f(su.uAspect, aspect); gl.uniform1i(su.uTex, 0);
      drawSprites(nebulaABuffer, texNebulaA, nebulaA.length / 12);
      drawSprites(nebulaBBuffer, texNebulaB, nebulaB.length / 12);

      gl.useProgram(lineProgram);
      bind(lineProgram, lineBuffer, LINE_LAYOUT);
      gl.uniformMatrix4fv(lu.uM, false, matrix); gl.uniform1f(lu.uT, t); gl.uniform1f(lu.uMix, mixValue); gl.uniform1f(lu.uFocus, focus);
      gl.drawArrays(gl.LINES, 0, lines.length / 9);

      gl.useProgram(ribbonProgram);
      bind(ribbonProgram, ribbonBuffer, RIBBON_LAYOUT);
      gl.bindTexture(gl.TEXTURE_2D, texFilament);
      gl.uniformMatrix4fv(ru.uM, false, matrix); gl.uniform1f(ru.uT, t); gl.uniform1f(ru.uMix, mixValue); gl.uniform1f(ru.uFocus, focus); gl.uniform1f(ru.uAspect, aspect); gl.uniform1f(ru.uWidth, small ? 0.03 : 0.024); gl.uniform1i(ru.uTex, 0);
      gl.drawArrays(gl.TRIANGLES, 0, ribbons.length / 15);

      gl.useProgram(pointProgram);
      bind(pointProgram, pointBuffer, POINT_LAYOUT);
      gl.uniformMatrix4fv(pu.uM, false, matrix); gl.uniform1f(pu.uT, t); gl.uniform1f(pu.uMix, mixValue); gl.uniform1f(pu.uScale, dpr * height / 900); gl.uniform1f(pu.uFocus, focus);
      gl.drawArrays(gl.POINTS, 0, pointCount);

      gl.useProgram(spriteProgram);
      drawSprites(starBuffer, texStar, stars.length / 12);

      const ready = mixValue > 0.92;
      placeLabels(coreLabels.map((el, k) => [el, cores[k]]), ready && stop === 0);
      placeLabels(nodeLabels.map((el, i) => [el, nodes[i].p]).filter((_, i) => nodes[i].k === focus), ready);
      nodeLabels.forEach((el, i) => { if (nodes[i].k !== focus) el.classList.remove('is-on'); });
      raf = requestAnimationFrame(frame);
    }
    const wake = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    resize(); readScroll(); syncPanels();
    addEventListener('resize', resize);
    addEventListener('scroll', readScroll, { passive: true });
    document.addEventListener('visibilitychange', wake);
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); staticMode(); visible = false; });
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; wake(); }, { rootMargin: '200px' }).observe(section);
    section.classList.add('is-live');
    if (location.hash) fromHash();
  }
})();
