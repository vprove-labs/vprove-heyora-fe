import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Herb-dye palette used across the fabric shader and particles.
const TURMERIC = new THREE.Color('#f0b429');
const MADDER = new THREE.Color('#c2414b');
const INDIGO = new THREE.Color('#3b47b8');
const GOLD = new THREE.Color('#e3a63b');

const fabricVertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  varying vec2 vUv;
  varying float vWave;
  varying vec3 vNormalW;

  float wave(vec2 p) {
    return sin(p.x * 1.6 + uTime * 0.9) * 0.35
         + sin(p.y * 2.3 + uTime * 0.7 + p.x) * 0.22
         + sin((p.x + p.y) * 3.1 - uTime * 1.1) * 0.08;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    float w = wave(pos.xy);
    // Gentle bulge toward the cursor, like breath moving through cloth.
    float d = distance(uv, uMouse * 0.5 + 0.5);
    w += smoothstep(0.45, 0.0, d) * 0.45;
    pos.z += w;
    vWave = w;

    // Approximate normal from neighbouring samples.
    float e = 0.05;
    float wx = wave(pos.xy + vec2(e, 0.0));
    float wy = wave(pos.xy + vec2(0.0, e));
    vNormalW = normalize(vec3(w - wx, w - wy, e));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fabricFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  uniform vec3 uGold;
  varying vec2 vUv;
  varying float vWave;
  varying vec3 vNormalW;

  void main() {
    // Ikat-style diagonal dye bleed across three herb colours.
    float t = vUv.x * 0.8 + vUv.y * 0.4 + sin(vUv.y * 6.0 + uTime * 0.2) * 0.06;
    vec3 col = mix(uA, uB, smoothstep(0.15, 0.55, t));
    col = mix(col, uC, smoothstep(0.55, 1.05, t));

    // Handloom warp and weft threads.
    float warp = smoothstep(0.35, 0.5, abs(fract(vUv.x * 140.0) - 0.5));
    float weft = smoothstep(0.35, 0.5, abs(fract(vUv.y * 90.0) - 0.5));
    col *= 0.86 + 0.14 * max(warp, weft);

    // Zari border bands in gold.
    float band = smoothstep(0.012, 0.0, abs(vUv.y - 0.12)) + smoothstep(0.012, 0.0, abs(vUv.y - 0.88));
    float motif = step(0.6, sin(vUv.x * 120.0) * sin(vUv.y * 120.0));
    float border = clamp(band + motif * (step(vUv.y, 0.1) + step(0.9, vUv.y)) * 0.6, 0.0, 1.0);
    col = mix(col, uGold, border * 0.85);

    // Soft lighting so folds read as silk.
    vec3 light = normalize(vec3(-0.4, 0.6, 0.8));
    float diff = clamp(dot(vNormalW, light), 0.0, 1.0);
    float sheen = pow(clamp(dot(reflect(-light, vNormalW), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 12.0);
    col = col * (0.45 + 0.75 * diff) + uGold * sheen * 0.35;

    // Fade edges into the night background.
    float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x)
               * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
    gl_FragColor = vec4(col, edge * 0.92);
  }
`;

function createFabric() {
  const geo = new THREE.PlaneGeometry(14, 8, 220, 130);
  const mat = new THREE.ShaderMaterial({
    vertexShader: fabricVertex,
    fragmentShader: fabricFragment,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uA: { value: TURMERIC },
      uB: { value: MADDER },
      uC: { value: INDIGO },
      uGold: { value: GOLD },
    },
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -0.55;
  mesh.rotation.z = 0.12;
  mesh.position.set(0, -2.6, -3);
  return mesh;
}

// A slowly turning golden lotus chakra: petals, rings and a bead mala.
function createChakra() {
  const group = new THREE.Group();

  const gold = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.22 });
  const rose = new THREE.MeshStandardMaterial({
    color: '#d9706a',
    metalness: 0.55,
    roughness: 0.3,
    emissive: '#3a0d12',
  });

  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, 0);
  petalShape.bezierCurveTo(0.35, 0.35, 0.3, 0.95, 0, 1.35);
  petalShape.bezierCurveTo(-0.3, 0.95, -0.35, 0.35, 0, 0);
  const petalGeo = new THREE.ExtrudeGeometry(petalShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
    curveSegments: 24,
  });
  petalGeo.translate(0, 0.25, 0);

  const layers = [
    { count: 8, scale: 1.0, tilt: 0.35, mat: rose, offset: 0 },
    { count: 8, scale: 0.78, tilt: 0.6, mat: gold, offset: Math.PI / 8 },
    { count: 6, scale: 0.55, tilt: 0.9, mat: rose, offset: 0 },
  ];
  const lotus = new THREE.Group();
  for (const layer of layers) {
    for (let i = 0; i < layer.count; i++) {
      const pivot = new THREE.Group();
      pivot.rotation.z = (i / layer.count) * Math.PI * 2 + layer.offset;
      const petal = new THREE.Mesh(petalGeo, layer.mat);
      petal.scale.setScalar(layer.scale);
      petal.rotation.x = layer.tilt;
      pivot.add(petal);
      lotus.add(pivot);
    }
  }
  const bindu = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 32), gold);
  bindu.position.z = 0.25;
  lotus.add(bindu);
  group.add(lotus);

  const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.018, 16, 200), gold);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.01, 16, 200), gold);
  ringB.rotation.x = Math.PI / 2.4;
  group.add(ringA, ringB);

  // Rudraksha-style bead mala on an outer orbit.
  const beadCount = 54;
  const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 16, 16), gold, beadCount);
  const m = new THREE.Matrix4();
  for (let i = 0; i < beadCount; i++) {
    const a = (i / beadCount) * Math.PI * 2;
    m.makeTranslation(Math.cos(a) * 2.8, Math.sin(a) * 2.8, 0);
    beads.setMatrixAt(i, m);
  }
  const mala = new THREE.Group();
  mala.add(beads);
  mala.rotation.x = -Math.PI / 3;
  group.add(mala);

  group.userData = { lotus, ringA, ringB, mala };
  return group;
}

function createPollen(count) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const palette = [TURMERIC, GOLD, MADDER, new THREE.Color('#ffe7b0')];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 22;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    const c = palette[i % palette.length];
    col.set([c.r, c.g, c.b], i * 3);
    seed[i] = Math.random() * 100;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uPixelRatio;
      attribute float aSeed;
      varying vec3 vColor;
      varying float vTwinkle;
      void main() {
        vColor = color;
        vec3 p = position;
        p.y += mod(uTime * 0.15 + aSeed, 14.0) - 7.0;
        p.x += sin(uTime * 0.3 + aSeed) * 0.4;
        vTwinkle = 0.5 + 0.5 * sin(uTime * 2.0 + aSeed * 3.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (18.0 + 14.0 * fract(aSeed)) * uPixelRatio / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vTwinkle;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, a * (0.35 + 0.65 * vTwinkle));
      }
    `,
  });
  return new THREE.Points(geo, mat);
}

export function initScene(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    // No WebGL: the CSS gradient background carries the page on its own.
    canvas.remove();
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.innerWidth < 720;
  // Wide screens put the chakra beside the hero copy; narrow ones float it above.
  let wide = window.innerWidth / window.innerHeight > 1.1 && window.innerWidth > 1024;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x140b18, 0.045);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  scene.add(new THREE.AmbientLight(0xffe2c0, 0.4));
  const key = new THREE.PointLight(0xffc874, 30, 30);
  key.position.set(3, 4, 6);
  const rim = new THREE.PointLight(0x6a5cff, 18, 30);
  rim.position.set(-5, -2, 3);
  scene.add(key, rim);

  const fabric = createFabric();
  const chakra = createChakra();
  const pollen = createPollen(isSmall ? 260 : 600);
  pollen.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
  scene.add(fabric, chakra, pollen);

  const pointer = new THREE.Vector2();
  const pointerSmooth = new THREE.Vector2();
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    },
    { passive: true },
  );

  let scrollProgress = 0;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? window.scrollY / max : 0;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the chakra framed on portrait phones.
    camera.position.z = w / h < 0.8 ? 12.5 : 9;
    wide = w / h > 1.1 && w > 1024;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) {
      clock.getDelta();
      requestAnimationFrame(tick);
    }
  });

  const { lotus, ringA, ringB, mala } = chakra.userData;

  function render(t) {
    pointerSmooth.lerp(pointer, 0.05);

    fabric.material.uniforms.uTime.value = t;
    fabric.material.uniforms.uMouse.value.copy(pointerSmooth);
    pollen.material.uniforms.uTime.value = t;

    lotus.rotation.z = t * 0.12;
    ringA.rotation.y = t * 0.25;
    ringB.rotation.z = -t * 0.18;
    mala.rotation.z = t * 0.08;

    // Chakra rises and drifts back as the visitor scrolls the story.
    const s = scrollProgress;
    const baseX = wide ? 3.3 : 0;
    const baseY = wide ? 0.2 : 2.9;
    // On scroll it recedes behind the content rather than crossing the copy.
    chakra.position.x = baseX + s * (wide ? 2.2 : 0);
    chakra.position.y = baseY + s * (wide ? 1.2 : 2.5) + Math.sin(t * 0.8) * 0.12;
    chakra.position.z = -s * 9;
    chakra.rotation.x = pointerSmooth.y * 0.35 + s * 0.8;
    chakra.rotation.y = pointerSmooth.x * 0.5 + s * 1.2;
    const scale = (wide ? 1.05 : 0.62) * (1 - s * 0.35);
    chakra.scale.setScalar(scale);

    fabric.position.y = -2.6 + s * 1.8;

    camera.position.x = pointerSmooth.x * 0.4;
    camera.position.y = pointerSmooth.y * 0.25;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  let elapsed = 0;
  function tick() {
    if (!running) return;
    elapsed += Math.min(clock.getDelta(), 0.05);
    render(elapsed);
    requestAnimationFrame(tick);
  }

  if (reduceMotion) {
    render(2);
    window.addEventListener('scroll', () => render(2), { passive: true });
    window.addEventListener('resize', () => render(2));
  } else {
    tick();
  }
}
