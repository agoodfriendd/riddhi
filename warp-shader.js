// Warp Shader Background Effect
// Recreated from @paper-design/shaders-react Warp component in vanilla WebGL
// Teal/cyan color palette with checks pattern, swirl distortion

(function () {
  const canvas = document.getElementById('warp-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    canvas.style.background = 'linear-gradient(135deg, #003366 0%, #33ccaa 50%, #004d40 100%)';
    return;
  }

  // Enable derivatives extension for edge detection
  gl.getExtension('OES_standard_derivatives');

  // --- Shader Sources ---
  const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    #extension GL_OES_standard_derivatives : enable
    precision highp float;
    varying vec2 v_uv;
    uniform float u_time;
    uniform vec2 u_resolution;

    // Color palette - teal/cyan liquid marble
    const vec3 darkTeal   = vec3(0.0, 0.12, 0.16);
    const vec3 midTeal    = vec3(0.0, 0.35, 0.40);
    const vec3 brightCyan = vec3(0.30, 0.85, 0.75);
    const vec3 mintLight  = vec3(0.55, 1.0, 0.85);

    // Smooth noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0); // quintic interpolation
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < 6; i++) {
        v += a * noise(p);
        p = rot * p * 2.0 + vec2(100.0);
        a *= 0.5;
      }
      return v;
    }

    // Domain warping - creates the liquid marble look
    float warpedFbm(vec2 p, float t) {
      // First warp layer
      vec2 q = vec2(
        fbm(p + vec2(0.0, 0.0) + t * 0.15),
        fbm(p + vec2(5.2, 1.3) + t * 0.12)
      );

      // Second warp layer
      vec2 r = vec2(
        fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.08),
        fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.10)
      );

      return fbm(p + 4.0 * r);
    }

    void main() {
      vec2 uv = v_uv;
      float aspect = u_resolution.x / u_resolution.y;
      uv.x *= aspect;
      float t = u_time * 0.4;

      // Scale for the marble pattern
      vec2 p = uv * 2.5;

      // Multi-layer domain warping for liquid marble
      float f1 = warpedFbm(p, t);
      float f2 = warpedFbm(p + vec2(3.0, -2.0), t * 0.8);
      float f3 = warpedFbm(p * 0.8 + vec2(-1.0, 4.0), t * 1.2);

      // Swirl distortion
      vec2 center = vec2(aspect * 0.5, 0.5);
      vec2 d = v_uv * vec2(aspect, 1.0) - center;
      float angle = 0.8 * sin(t * 0.15);
      float dist = length(d);
      float swirlFactor = exp(-dist * 1.5) * angle;
      vec2 swirlUV = p + vec2(
        cos(swirlFactor) * d.x - sin(swirlFactor) * d.y,
        sin(swirlFactor) * d.x + cos(swirlFactor) * d.y
      ) * 0.3;
      float f4 = warpedFbm(swirlUV, t * 0.6);

      // Combine warped layers
      float combined = f1 * 0.4 + f2 * 0.25 + f3 * 0.2 + f4 * 0.15;

      // Create deep contrast curves (liquid look)
      float dark = smoothstep(0.2, 0.5, combined);
      float bright = smoothstep(0.45, 0.75, combined);
      float highlight = smoothstep(0.65, 0.85, combined);

      // Build color from layers
      vec3 col = darkTeal;
      col = mix(col, midTeal, dark);
      col = mix(col, brightCyan, bright);
      col = mix(col, mintLight, highlight * 0.8);

      // Add subtle specular-like highlights
      float spec = smoothstep(0.78, 0.95, combined);
      col += vec3(0.15, 0.35, 0.25) * spec;

      // Edge glow / rim light effect
      float edge = abs(dFdx(combined)) + abs(dFdy(combined));
      edge = smoothstep(0.0, 0.08, edge);
      col = mix(col, mintLight * 1.1, edge * 0.3);

      // Subtle vignette
      vec2 vc = v_uv - 0.5;
      float vignette = 1.0 - dot(vc, vc) * 0.3;
      col *= vignette;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // --- Compile Shaders ---
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vs, fs) {
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vs || !fs) return;

  const program = createProgram(gl, vs, fs);
  if (!program) return;

  // --- Geometry (fullscreen quad) ---
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1,  -1, 1,
    -1,  1,  1, -1,   1, 1,
  ]), gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(program, 'a_position');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uResolution = gl.getUniformLocation(program, 'u_resolution');

  let startTime = performance.now();

  // --- Resize ---
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener('resize', resize);
  resize();

  // --- Render Loop ---
  function render() {
    const elapsed = (performance.now() - startTime) / 1000;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1f(uTime, elapsed);
    gl.uniform2f(uResolution, canvas.width, canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }

  render();
})();
