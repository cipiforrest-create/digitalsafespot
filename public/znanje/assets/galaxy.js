// Brain galaxy: a spiral of stars that assembles into a brain. Topic clusters sit in its regions,
// connected by threads that carry pulses. Scroll flies the camera cluster to cluster; drag rotates.
// Plain WebGL, no dependencies. Without WebGL or with reduced motion the section becomes a static grid.
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

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return staticMode();
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return staticMode();

  const small = matchMedia('(max-width: 760px)').matches;
  const BRAIN_POINTS = small ? 4200 : 9000;
  const STARS = small ? 700 : 1500;
  const AXONS = small ? 70 : 150;
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
  const SILVER = [0.74, 0.79, 0.9];

  function brainPoint() {
    const roll = rand();
    if (roll < 0.02) { // brain stem
      const t = rand(), a = rand() * Math.PI * 2, r = 0.06 * Math.sqrt(rand());
      return [Math.cos(a) * r, mix(-0.36, -0.95, t), mix(-0.3, -0.44, t) + Math.sin(a) * r];
    }
    if (roll < 0.11) { // cerebellum, finely striated
      const d = sphereDir(), side = rand() < 0.5 ? -1 : 1, f = 1 + 0.05 * Math.sin(d[1] * 46);
      return [side * (0.2 + Math.abs(d[0]) * 0.24 * f), -0.44 + d[1] * 0.17 * f, -0.64 + d[2] * 0.24 * f];
    }
    const d = sphereDir(), side = rand() < 0.5 ? -1 : 1;
    // Folded cortex: two interfering waves read as gyri without needing a mesh.
    const fold = 1 + 0.05 * Math.sin(d[1] * 15 + Math.sin(d[2] * 9) * 2.2) + 0.03 * Math.sin(d[2] * 23 + d[1] * 6);
    const depth = rand() < 0.2 ? Math.cbrt(rand()) * 0.9 : 1;
    let x = (Math.abs(d[0]) * 0.66 + 0.035) * fold * depth;
    let y = d[1] * 0.6 * fold * depth;
    const z = d[2] * 0.95 * fold * depth;
    x *= 1 - 0.2 * Math.max(0, d[2]) ** 2; // narrower frontal lobe
    if (y < -0.3) y = -0.3 + (y + 0.3) * 0.4; // flat underside
    return [side * x, y + 0.05, z];
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

  // ---- points: start(3) end(3) size colour(3) phase cluster
  const pts = [];
  const pushPoint = (from, to, size, col, k) => pts.push(from[0], from[1], from[2], to[0], to[1], to[2], size, col[0], col[1], col[2], rand(), k);
  const surface = [];
  for (let i = 0; i < BRAIN_POINTS; i++) {
    const p = brainPoint(), [k, d] = nearest(p), tint = Math.max(0, 1 - d / 0.5) * 0.8;
    const c = colors[k], col = [mix(SILVER[0], c[0], tint), mix(SILVER[1], c[1], tint), mix(SILVER[2], c[2], tint)];
    pushPoint(galaxyPoint(), p, 2.2 + rand() * 3.4, mulS(col, 0.5 + rand() * 0.5), d < 0.4 ? k : -1);
    if (i % 6 === 0) surface.push(p);
  }
  for (let i = 0; i < STARS; i++) {
    const p = mulS(sphereDir(), 5 + rand() * 5);
    pushPoint(p, p, 1.6 + rand() * 2.4, mulS(SILVER, 0.25 + rand() * 0.4), -1);
  }
  const nodes = []; // {p, k, t, h}
  clusters.forEach((c, k) => {
    const core = cores[k], out = norm(len(core) < 0.3 ? [0, 0.35, 1] : core), n = c.nodes.length;
    for (let i = 0; i < 70; i++) pushPoint(galaxyPoint(), add(core, mulS([gauss(), gauss(), gauss()], 0.075)), 3 + rand() * 4, colors[k], k);
    pushPoint(mulS(core, 4), core, 46, [1, 1, 1], k);
    c.nodes.forEach((node, j) => {
      const y = 1 - (j + 0.5) / n * 2, r = Math.sqrt(1 - y * y), a = j * 2.39996;
      const dir = norm(add([Math.cos(a) * r, y, Math.sin(a) * r], mulS(out, 0.75)));
      const p = add(core, mulS(dir, 0.2 + (j % 3) * 0.035));
      nodes.push({ p, k, t: node.t, h: node.h });
      pushPoint(mulS(p, 5), p, 22, mulS(add(colors[k], [0.5, 0.5, 0.5]), 0.7), k);
      for (let i = 0; i < 10; i++) pushPoint(galaxyPoint(), add(p, mulS([gauss(), gauss(), gauss()], 0.022)), 2.5 + rand() * 2.5, colors[k], k);
    });
  });
  const POINT_STRIDE = 12, pointCount = pts.length / POINT_STRIDE;

  // ---- threads: pos(3) u offset cluster colour(3) alpha
  const lines = [];
  function thread(a, b, bend, col, alpha, k) {
    const mid = mulS(add(a, b), 0.5), side = norm(cross(sub(b, a), [gauss(), 1, gauss()]));
    const ctrl = add(add(mid, mulS(norm(mid), bend)), mulS(side, bend * 0.6)), off = rand();
    let prev = a;
    for (let i = 1; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS, s = 1 - t;
      const p = [0, 1, 2].map(n => s * s * a[n] + 2 * s * t * ctrl[n] + t * t * b[n]);
      lines.push(prev[0], prev[1], prev[2], (i - 1) / SEGMENTS, off, k, col[0], col[1], col[2], alpha);
      lines.push(p[0], p[1], p[2], t, off, k, col[0], col[1], col[2], alpha);
      prev = p;
    }
  }
  nodes.forEach(n => thread(cores[n.k], n.p, 0.05, colors[n.k], 0.55, n.k));
  for (let k = 1; k < cores.length; k++) thread(cores[0], cores[k], 0.12, [0.9, 0.93, 1], 0.42, -2);
  [[1, 2], [1, 3], [2, 4], [3, 4], [3, 7], [4, 7], [1, 5], [2, 6], [5, 3], [6, 4], [5, 7], [6, 7]].forEach(([a, b]) => thread(cores[a], cores[b], 0.2, mulS(add(colors[a], colors[b]), 0.5), 0.3, -2));
  for (let i = 0, guard = 0; i < AXONS && guard < 20000; guard++) {
    const a = surface[Math.floor(rand() * surface.length)], b = surface[Math.floor(rand() * surface.length)], d = len(sub(a, b));
    if (d < 0.22 || d > 0.62) continue;
    thread(a, b, 0.07, SILVER, 0.12, -1); i++;
  }
  const LINE_STRIDE = 10, lineCount = lines.length / LINE_STRIDE;

  // ---- shaders
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const program = (vs, fs) => { const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
  let pointProgram, lineProgram;
  try {
    pointProgram = program(`attribute vec3 a0,a1,aC;attribute float aS,aP,aK;uniform mat4 uM;uniform float uT,uMix,uScale,uFocus;varying vec3 vC;varying float vA;
void main(){float m=clamp(uMix*1.35-aP*0.35,0.,1.);m=m*m*(3.-2.*m);vec3 p=mix(a0,a1,m);p+=0.006*vec3(sin(uT*.7+aP*40.),cos(uT*.6+aP*31.),sin(uT*.5+aP*23.));
gl_Position=uM*vec4(p,1.);float tw=.72+.28*sin(uT*1.4+aP*6.283);float f=(uFocus<-.5||aK<-.5)?1.:(abs(aK-uFocus)<.5?1.5:.42);
gl_PointSize=min(aS*uScale*tw*1.9/max(gl_Position.w,.2),130.);vC=aC;vA=tw*f*mix(.55,1.,m);}`,
      `precision mediump float;varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);a=(a*a*1.15+pow(a,7.)*1.1)*vA;gl_FragColor=vec4(vC*a,a);}`);
    lineProgram = program(`attribute vec3 aP,aC;attribute float aU,aO,aK,aA;uniform mat4 uM;uniform float uFocus;varying vec3 vC;varying float vU,vO,vA;
void main(){gl_Position=uM*vec4(aP,1.);float f=aK<-1.5?.85:(uFocus<-.5?1.:(aK<-.5?.5:(abs(aK-uFocus)<.5?1.7:.3)));vC=aC;vU=aU;vO=aO;vA=aA*f;}`,
      `precision mediump float;uniform float uT,uMix;varying vec3 vC;varying float vU,vO,vA;
void main(){float sp=.16+.22*fract(vO*7.);float x=fract(vU-uT*sp+vO)-.5;float pulse=exp(-x*x*90.);float a=vA*(.3+1.9*pulse)*uMix*uMix;gl_FragColor=vec4(vC*a,a);}`);
  } catch (error) { console.warn('Galaxy shaders unavailable', error); return staticMode(); }

  const buffer = data => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); return b; };
  const pointBuffer = buffer(pts), lineBuffer = buffer(lines);
  const bind = (prog, buf, stride, layout) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    let offset = 0;
    for (const [name, size] of layout) {
      const loc = gl.getAttribLocation(prog, name);
      if (loc >= 0) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride * 4, offset * 4); }
      offset += size;
    }
  };
  const uniforms = (prog, names) => Object.fromEntries(names.map(n => [n, gl.getUniformLocation(prog, n)]));
  const pu = uniforms(pointProgram, ['uM', 'uT', 'uMix', 'uScale', 'uFocus']);
  const lu = uniforms(lineProgram, ['uM', 'uT', 'uMix', 'uFocus']);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0.012, 0.016, 0.027, 1);

  // ---- labels (real links; the same destinations are also in the panels for keyboard and screen readers)
  const makeLabel = (text, href, cls, color) => { const el = document.createElement('a'); el.className = 'g-label ' + cls; el.textContent = text; el.href = href; el.tabIndex = -1; el.style.setProperty('--accent', color); labelLayer.append(el); return el; };
  const coreLabels = clusters.map((c, k) => { const el = makeLabel(c.name, '#' + c.id, 'is-core', c.color); el.addEventListener('click', e => { e.preventDefault(); goTo(k + 1); }); return el; });
  const nodeLabels = nodes.map(n => makeLabel(n.t, n.h, '', clusters[n.k].color));

  // ---- camera
  const perspective = (fov, aspect, near, far) => { const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far); return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]; };
  const lookAt = (eye, target) => { const z = norm(sub(eye, target)), x = norm(cross([0, 1, 0], z)), y = cross(z, x); return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]), -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]), -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]), 1]; };
  const multiply = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; };
  const stops = [{ target: [0, 0, 0], dist: 3.3, yaw: 0.65, pitch: 0.16 }, ...cores.map(c => {
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
  function place(el, p, on, maxDepth = Infinity) {
    const x = matrix[0] * p[0] + matrix[4] * p[1] + matrix[8] * p[2] + matrix[12];
    const y = matrix[1] * p[0] + matrix[5] * p[1] + matrix[9] * p[2] + matrix[13];
    const w = matrix[3] * p[0] + matrix[7] * p[1] + matrix[11] * p[2] + matrix[15];
    const show = on && w > 0.15 && w < maxDepth;
    el.classList.toggle('is-on', show);
    if (show) el.style.transform = `translate(-50%,-50%) translate(${((x / w) * 0.5 + 0.5) * width}px,${(1 - ((y / w) * 0.5 + 0.5)) * height}px)`;
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
    cam.dist = mix(cam.dist, goal.dist + (small ? 0.5 : 0), ease);
    cam.yaw = angleLerp(cam.yaw, goal.yaw + (stop === 0 ? spin : (frac - 0.5) * 0.5) + user.yaw, ease);
    cam.pitch = mix(cam.pitch, goal.pitch + user.pitch, ease);
    const cp = Math.cos(cam.pitch), eye = add(cam.target, [Math.sin(cam.yaw) * cp * cam.dist, Math.sin(cam.pitch) * cam.dist, Math.cos(cam.yaw) * cp * cam.dist]);
    matrix = multiply(perspective(0.85, width / height, 0.05, 40), lookAt(eye, cam.target));
    // Shift the view so the subject clears the text panel: right on desktop, up on phones.
    const sx = small ? 0 : 0.2, sy = small ? 0.24 : 0;
    for (const c of [0, 4, 8, 12]) { matrix[c] += sx * matrix[c + 3]; matrix[c + 1] += sy * matrix[c + 3]; }

    gl.clear(gl.COLOR_BUFFER_BIT);
    const focus = stop === 0 ? -1 : stop - 1;
    gl.useProgram(lineProgram);
    bind(lineProgram, lineBuffer, LINE_STRIDE, [['aP', 3], ['aU', 1], ['aO', 1], ['aK', 1], ['aC', 3], ['aA', 1]]);
    gl.uniformMatrix4fv(lu.uM, false, matrix); gl.uniform1f(lu.uT, t); gl.uniform1f(lu.uMix, mixValue); gl.uniform1f(lu.uFocus, focus);
    gl.drawArrays(gl.LINES, 0, lineCount);
    gl.useProgram(pointProgram);
    bind(pointProgram, pointBuffer, POINT_STRIDE, [['a0', 3], ['a1', 3], ['aS', 1], ['aC', 3], ['aP', 1], ['aK', 1]]);
    gl.uniformMatrix4fv(pu.uM, false, matrix); gl.uniform1f(pu.uT, t); gl.uniform1f(pu.uMix, mixValue); gl.uniform1f(pu.uScale, dpr * height / 900); gl.uniform1f(pu.uFocus, focus);
    gl.drawArrays(gl.POINTS, 0, pointCount);

    const ready = mixValue > 0.92;
    // In the overview only the near side is labelled, so names never stack through the brain.
    coreLabels.forEach((el, k) => place(el, cores[k], ready && stop === 0, cam.dist + 0.12));
    nodeLabels.forEach((el, i) => place(el, nodes[i].p, ready && nodes[i].k === focus));
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
})();
