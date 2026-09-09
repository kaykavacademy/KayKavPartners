/* =========================================================
   KayKav — proposal topography
   A single fullscreen fragment shader in raw WebGL.
   (The hero no longer uses WebGL, so Three.js is not loaded.)
   ========================================================= */
window.KKGL = (function () {
  'use strict';

  var canvas = document.getElementById('gl2');
  if (!canvas) return { ok: false };

  var gl = null;
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, premultipliedAlpha: true })
      || canvas.getContext('experimental-webgl', { alpha: true, antialias: false, depth: false });
  } catch (e) { gl = null; }
  if (!gl) return { ok: false };

  var VERT = [
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    'varying vec2 vUv;',
    'uniform float uTime;',
    'uniform vec2 uRes;',
    'vec2 hash(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));',
    '  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123); }',
    'float noise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(dot(hash(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),',
    '                 dot(hash(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),',
    '             mix(dot(hash(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),',
    '                 dot(hash(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x), u.y);',
    '}',
    'float fbm(vec2 p){ float v = 0.0, a = 0.5;',
    '  for (int k = 0; k < 5; k++){ v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }',
    'void main(){',
    '  vec2 uv = vUv; uv.x *= uRes.x / max(uRes.y, 1.0);',
    '  float t = uTime * 0.045;',
    '  float n = fbm(uv * 2.1 + vec2(t, -t * 0.6));',
    '  n += 0.35 * fbm(uv * 4.6 - vec2(t * 0.8, t * 0.3));',
    '  float bands = fract(n * 7.0);',
    '  float line = smoothstep(0.46, 0.5, bands) - smoothstep(0.5, 0.54, bands);',
    '  float ridge = smoothstep(0.35, 0.62, n);',
    '  vec3 col = mix(vec3(0.72, 0.82, 0.95), vec3(0.89, 0.72, 0.48), ridge);',
    '  float vig = smoothstep(1.15, 0.15, length(vUv - 0.5));',
    '  float a = line * 0.30 * vig + ridge * 0.045 * vig;',
    '  gl_FragColor = vec4(col * a, a);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('shader', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return { ok: false };

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('link', gl.getProgramInfoLog(prog));
    return { ok: false };
  }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uTime = gl.getUniformLocation(prog, 'uTime');
  var uRes = gl.getUniformLocation(prog, 'uRes');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    var W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W; canvas.height = H;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  resize();

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = false, running = true, t = 0, last = performance.now();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { rootMargin: '150px' }).observe(canvas);
  } else { visible = true; }

  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!running || !visible) return;
    t += reduced ? dt * 0.25 : dt;
    gl.uniform1f(uTime, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(frame);

  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 140); });
  document.addEventListener('visibilitychange', function () { running = !document.hidden; last = performance.now(); });

  return { ok: true };
})();
