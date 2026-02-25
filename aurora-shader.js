

(function () {
  const canvas = document.getElementById('aurora-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    canvas.style.background = 'radial-gradient(ellipse at center, rgba(30,80,120,0.4) 0%, black 70%)';
    return;
  }


  const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    uniform float iTime;
    uniform vec2 iResolution;

    #define NUM_OCTAVES 3

    float rand(vec2 n) {
      return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 ip = floor(p);
      vec2 u = fract(p);
      u = u * u * (3.0 - 2.0 * u);
      float res = mix(
        mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
        mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
      return res * res;
    }

    float fbm(vec2 x) {
      float v = 0.0;
      float a = 0.3;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(x);
        x = rot * x * 2.0 + shift;
        a *= 0.4;
      }
      return v;
    }

    // tanh polyfill for WebGL 1.0
    vec4 tanh_approx(vec4 x) {
      vec4 x2 = x * x;
      return x * (27.0 + x2) / (27.0 + 9.0 * x2);
    }

    void main() {
      vec2 shake = vec2(sin(iTime * 1.2) * 0.005, cos(iTime * 2.1) * 0.005);
      vec2 p = ((gl_FragCoord.xy + shake * iResolution.xy) - iResolution.xy * 0.5) / iResolution.y * mat2(6.0, -4.0, 4.0, 6.0);
      vec2 v;
      vec4 o = vec4(0.0);

      float f = 2.0 + fbm(p + vec2(iTime * 5.0, 0.0)) * 0.5;

      for (float i = 0.0; i < 35.0; i++) {
        v = p + cos(i * i + (iTime + p.x * 0.08) * 0.025 + i * vec2(13.0, 11.0)) * 3.5 +
          vec2(sin(iTime * 3.0 + i) * 0.003, cos(iTime * 3.5 - i) * 0.003);
        float tailNoise = fbm(v + vec2(iTime * 0.5, i)) * 0.3 * (1.0 - (i / 35.0));
        vec4 auroraColors = vec4(
          0.1 + 0.3 * sin(i * 0.2 + iTime * 0.4),
          0.3 + 0.5 * cos(i * 0.3 + iTime * 0.5),
          0.7 + 0.3 * sin(i * 0.4 + iTime * 0.3),
          1.0
        );
        vec4 currentContribution = auroraColors * exp(sin(i * i + iTime * 0.8)) /
          length(max(v, vec2(v.x * f * 0.015, v.y * 1.5)));
        float thinnessFactor = smoothstep(0.0, 1.0, i / 35.0) * 0.6;
        o += currentContribution * (1.0 + tailNoise * 0.8) * thinnessFactor;
      }

      o = tanh_approx(pow(o / 100.0, vec4(1.6)));
      gl_FragColor = o * 1.5;
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
  const uTime = gl.getUniformLocation(program, 'iTime');
  const uResolution = gl.getUniformLocation(program, 'iResolution');

  let time = 0;

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
    time += 0.016;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1f(uTime, time);
    gl.uniform2f(uResolution, canvas.width, canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }

  render();
})();
