

(function () {
  const canvas = document.getElementById('dithering-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
   
    canvas.style.background = 'radial-gradient(ellipse at center, rgba(233,69,96,0.15) 0%, transparent 70%)';
    return;
  }

  const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    varying vec2 v_uv;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform float u_speed;

    // ...existing code...
    float bayer4x4(vec2 pos) {
      int x = int(mod(pos.x, 4.0));
      int y = int(mod(pos.y, 4.0));
      int index = x + y * 4;
      // ...existing code...
      if (index == 0) return 0.0 / 16.0;
      if (index == 1) return 8.0 / 16.0;
      if (index == 2) return 2.0 / 16.0;
      if (index == 3) return 10.0 / 16.0;
      if (index == 4) return 12.0 / 16.0;
      if (index == 5) return 4.0 / 16.0;
      if (index == 6) return 14.0 / 16.0;
      if (index == 7) return 6.0 / 16.0;
      if (index == 8) return 3.0 / 16.0;
      if (index == 9) return 11.0 / 16.0;
      if (index == 10) return 1.0 / 16.0;
      if (index == 11) return 9.0 / 16.0;
      if (index == 12) return 15.0 / 16.0;
      if (index == 13) return 7.0 / 16.0;
      if (index == 14) return 13.0 / 16.0;
      if (index == 15) return 5.0 / 16.0;
      return 0.0;
    }

    // ...existing code...
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = rot * p * 2.0 + shift;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = v_uv;
      vec2 pixelPos = gl_FragCoord.xy;
      float t = u_time * u_speed;

      // Warp distortion
      vec2 warpUV = uv * 3.0;
      float warp1 = fbm(warpUV + t * 0.3);
      float warp2 = fbm(warpUV + warp1 * 1.5 + t * 0.2);
      vec2 warpedUV = uv + vec2(warp1, warp2) * 0.15;

      // Radial gradient base
      vec2 center = vec2(0.5, 0.5);
      float dist = length(warpedUV - center);
      float gradient = smoothstep(0.0, 1.2, dist);
      float intensity = 1.0 - gradient;

      // Add flowing organic shapes
      float flow = fbm(warpedUV * 4.0 + t * 0.15);
      intensity *= flow * 1.8;
      intensity = clamp(intensity, 0.0, 1.0);

      // Apply Bayer dithering
      float bayerVal = bayer4x4(pixelPos);
      float dithered = step(bayerVal, intensity);

      // Color: teal/cyan emerald green
      vec3 color = vec3(0.0, 0.65, 0.55); // teal
      
      // Secondary color accent for depth
      vec3 color2 = vec3(0.1, 0.85, 0.70); // bright cyan-green
      float colorMix = fbm(warpedUV * 2.0 - t * 0.1);
      vec3 finalColor = mix(color, color2, colorMix * 0.5);

      gl_FragColor = vec4(finalColor * dithered, dithered * 0.45);
    }
  `;


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

 
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1,  -1, 1,
    -1,  1,  1, -1,   1, 1,
  ]), gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(program, 'a_position');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uSpeed = gl.getUniformLocation(program, 'u_speed');

  let speed = 0.2;
  let startTime = performance.now();

  
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

  
  function render() {
    const elapsed = (performance.now() - startTime) / 1000;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1f(uTime, elapsed);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uSpeed, speed);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }

  render();
})();
