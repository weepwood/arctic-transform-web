import './styles.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import {
  createArcField,
  createCameraState,
  createIglooState,
  createLampState,
  createMoonState,
  createScatterState,
  createSpeakerState,
  mulberry32,
} from './shapes.js';
import {
  createAurora,
  createGlowTexture,
  createMountains,
  createSnow,
  createStars,
  updateSnow,
} from './environment.js';

gsap.registerPlugin(ScrollTrigger);

document.body.classList.add('is-loading');

const dom = {
  mount: document.querySelector('#webgl'),
  loading: document.querySelector('#loading'),
  loadingProgress: document.querySelector('#loading-progress'),
  loadingValue: document.querySelector('#loading-value'),
  copy: document.querySelector('.copy'),
  eyebrow: document.querySelector('#eyebrow'),
  headline: document.querySelector('#headline'),
  description: document.querySelector('#description'),
  chapterIndex: document.querySelector('#chapter-index'),
  chapterName: document.querySelector('#chapter-name'),
  progress: document.querySelector('#progress-fill'),
  scrollCue: document.querySelector('.scroll-cue'),
  track: document.querySelector('.scroll-track'),
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const compact = window.matchMedia('(max-width: 760px)').matches;
const lowPower = compact || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
const ICE_COUNT = reducedMotion ? 260 : lowPower ? 420 : 720;
const SNOW_COUNT = lowPower ? 420 : 1050;

const chapters = [
  {
    threshold: 0,
    index: '01 / 05',
    name: 'SHELTER',
    eyebrow: 'A SINGLE BLOCK',
    headline: 'Every idea begins<br />with a single block.',
    description: '一座由独立冰晶模块构成的庇护所，正等待被重新想象。',
  },
  {
    threshold: 0.16,
    index: '02 / 05',
    name: 'RELEASE',
    eyebrow: 'ORDER IN MOTION',
    headline: 'Structure becomes<br />imagination.',
    description: '冰屋逐层松动。每一块冰晶沿确定轨迹脱离，并保留返回原位的可能。',
  },
  {
    threshold: 0.31,
    index: '03 / 05',
    name: 'POSSIBILITY',
    eyebrow: 'REARRANGE THE POSSIBLE',
    headline: 'Every block holds<br />a possibility.',
    description: '同一组模块依次构成音箱、灯具与相机。形态改变，材料与记忆保持不变。',
  },
  {
    threshold: 0.69,
    index: '04 / 05',
    name: 'ORBIT',
    eyebrow: 'ONE SHARED GRAVITY',
    headline: 'Ideas are not created.<br />They are rearranged.',
    description: '产品再次解构，在螺旋轨道中汇聚，成为一颗由无数冰块共同构成的月亮。',
  },
  {
    threshold: 0.9,
    index: '05 / 05',
    name: 'ILLUMINATE',
    eyebrow: 'INFINITE POSSIBILITIES',
    headline: 'Build. Transform.<br />Illuminate.',
    description: 'From one shelter, infinite possibilities. 月光与极光在冰原上完成最后一次呠吸。',
  },
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050b17);
scene.fog = new THREE.FogExp2(0x071225, 0.026);

const camera = new THREE.PerspectiveCamera(43, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(compact ? 0.3 : 1.3, 0.3, compact ? 12.8 : 11.6);

const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.4 : 1.9));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !lowPower;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
dom.mount.appendChild(renderer.domElement);

const composer = !lowPower ? new EffectComposer(renderer) : null;
if (composer) {
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.56, 0.76, 0.58);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
}

const ambient = new THREE.HemisphereLight(0xa9ddff, 0x07101e, 1.65);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xc7ebff, 3.3);
keyLight.position.set(-5, 8, 7);
keyLight.castShadow = !lowPower;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x6c8cff, 2.2);
rimLight.position.set(6, 4, -8);
scene.add(rimLight);

const innerLight = new THREE.PointLight(0x86cfff, 12, 12, 2);
innerLight.position.set(0, -0.4, 1.2);
scene.add(innerLight);

const moonLight = new THREE.PointLight(0xb8e3ff, 0, 28, 1.7);
moonLight.position.set(0, 1, 1.5);
scene.add(moonLight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80, 1, 1),
  new THREE.MeshPhysicalMaterial({
    color: 0x9db6c9,
    roughness: 0.48,
    metalness: 0.06,
    clearcoat: 0.42,
    clearcoatRoughness: 0.25,
  }),
);
ground.rotation.x = -Math.PI * 0.5;
ground.position.y = -1.78;
ground.receiveShadow = !lowPower;
scene.add(ground);

const groundHalo = new THREE.Mesh(
  new THREE.CircleGeometry(8, 96),
  new THREE.MeshBasicMaterial({ color: 0x6ca8d9, transparent: true, opacity: 0.06, depthWrite: false }),
);
groundHalo.rotation.x = -Math.PI * 0.5;
groundHalo.position.set(0, -1.765, 0);
scene.add(groundHalo);

const mountains = createMountains();
scene.add(mountains);
const stars = createStars(lowPower ? 430 : 850);
scene.add(stars);
const snow = createSnow(SNOW_COUNT);
scene.add(snow);

const aurora = createAurora();
scene.add(aurora);

const moonCore = new THREE.Mesh(
  new THREE.SphereGeometry(2.74, lowPower ? 32 : 64, lowPower ? 24 : 48),
  new THREE.MeshBasicMaterial({ color: 0xaedcff, transparent: true, opacity: 0, depthWrite: false }),
);
moonCore.position.set(0, 1, -0.55);
scene.add(moonCore);

const moonGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({ map: createGlowTexture(), color: 0xbce8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
);
moonGlow.position.copy(moonCore.position);
moonGlow.scale.set(12, 12, 1);
scene.add(moonGlow);

const cubeGeometry = new THREE.BoxGeometry(0.34, 0.25, 0.31, 1, 1, 1);
const iceMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xb9e5ff,
  roughness: 0.16,
  metalness: 0.03,
  transmission: lowPower ? 0.18 : 0.36,
  transparent: true,
  opacity: 0.82,
  thickness: 0.28,
  ior: 1.31,
  clearcoat: 0.82,
  clearcoatRoughness: 0.13,
  emissive: new THREE.Color(0x153e62),
  emissiveIntensity: 0.22,
});

const edgeMaterial = new THREE.MeshBasicMaterial({
  color: 0xd8f3ff,
  wireframe: true,
  transparent: true,
  opacity: 0.1,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const ice = new THREE.InstancedMesh(cubeGeometry, iceMaterial, ICE_COUNT);
ice.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
ice.castShadow = !lowPower;
ice.receiveShadow = !lowPower;
scene.add(ice);

const edges = new THREE.InstancedMesh(cubeGeometry, edgeMaterial, ICE_COUNT);
edges.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(edges);

const rng = mulberry32(151);
const colors = [new THREE.Color(0xa7dfff), new THREE.Color(0xd6f2ff), new THREE.Color(0x8fc9f3)];
for (let i = 0; i < ICE_COUNT; i += 1) {
  const color = colors[Math.floor(rng() * colors.length)].clone();
  color.offsetHSL((rng() - 0.5) * 0.025, (rng() - 0.5) * 0.08, (rng() - 0.5) * 0.07);
  ice.setColorAt(i, color);
}
if (ice.instanceColor) ice.instanceColor.needsUpdate = true;

const states = {};
const loaderSteps = [
  ['冰屋结构', () => { states.igloo = createIglooState(ICE_COUNT); }],
  ['释放轨迹', () => { states.scatterA = createScatterState(states.igloo, 71, 4.9, 0.2); }],
  ['智能音箱', () => { states.speaker = createSpeakerState(ICE_COUNT); }],
  ['产品过渡', () => { states.scatterB = createScatterState(states.speaker, 73, 5.4, 0.5); }],
  ['未来灯具', () => { states.lamp = createLampState(ICE_COUNT); }],
  ['产品过渡', () => { states.scatterC = createScatterState(states.lamp, 75, 5.5, 0.7); }],
  ['冰晶相机', () => { states.camera = createCameraState(ICE_COUNT); }],
  ['引力轨道', () => { states.scatterD = createScatterState(states.camera, 77, 6.4, 1.3); }],
  ['冰晶月亮', () => { states.moon = createMoonState(ICE_COUNT); }],
];

for (let i = 0; i < loaderSteps.length; i += 1) {
  loaderSteps[i][1]();
  const percent = Math.round(((i + 1) / loaderSteps.length) * 94);
  dom.loadingProgress.style.width = `${percent}%`;
  dom.loadingValue.value = `${percent}%`;
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

const keyframes = [
  { at: 0, state: states.igloo },
  { at: 0.14, state: states.igloo },
  { at: 0.285, state: states.scatterA },
  { at: 0.365, state: states.speaker },
  { at: 0.425, state: states.scatterB },
  { at: 0.505, state: states.lamp },
  { at: 0.565, state: states.scatterC },
  { at: 0.635, state: states.camera },
  { at: 0.73, state: states.scatterD },
  { at: 0.895, state: states.moon },
  { at: 1, state: states.moon },
];

const arcField = createArcField(ICE_COUNT);
const dummy = new THREE.Object3D();
const qa = new THREE.Quaternion();
const qb = new THREE.Quaternion();
const q = new THREE.Quaternion();
const baseScale = new THREE.Vector3();
let scrollProgress = 0;
let currentChapter = -1;
let lastTime = performance.now();
let pointerX = 0;
let pointerY = 0;
let smoothedPointerX = 0;
let smoothedPointerY = 0;

function easeInOut(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function getSegment(progress) {
  for (let i = 0; i < keyframes.length - 1; i += 1) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (progress >= a.at && progress <= b.at) {
      return { a, b, t: (progress - a.at) / Math.max(0.0001, b.at - a.at), segment: i };
    }
  }
  return { a: keyframes.at(-2), b: keyframes.at(-1), t: 1, segment: keyframes.length - 2 };
}

function updateInstances(progress, time) {
  const { a, b, t, segment } = getSegment(progress);
  const eased = easeInOut(THREE.MathUtils.clamp(t, 0, 1));
  const arcStrength = Math.sin(Math.PI * eased) * (segment === 0 || segment === keyframes.length - 2 ? 0 : 1);
  const breathe = 1 + Math.sin(time * 0.75) * 0.012 * (1 - Math.min(1, progress * 5));

  for (let i = 0; i < ICE_COUNT; i += 1) {
    const p = i * 3;
    const qi = i * 4;
    const ax = a.state.positions[p];
    const ay = a.state.positions[p + 1];
    const az = a.state.positions[p + 2];
    const bx = b.state.positions[p];
    const by = b.state.positions[p + 1];
    const bz = b.state.positions[p + 2];
    const phase = i * 0.073;
    const float = Math.sin(time * 0.55 + phase) * 0.022;

    dummy.position.set(
      THREE.MathUtils.lerp(ax, bx, eased) + arcField[p] * arcStrength,
      THREE.MathUtils.lerp(ay, by, eased) + arcField[p + 1] * arcStrength + float,
      THREE.MathUtils.lerp(az, bz, eased) + arcField[p + 2] * arcStrength,
    );

    qa.fromArray(a.state.quaternions, qi);
    qb.fromArray(b.state.quaternions, qi);
    q.copy(qa).slerp(qb, eased);
    dummy.quaternion.copy(q);

    baseScale.set(
      THREE.MathUtils.lerp(a.state.scales[p], b.state.scales[p], eased),
      THREE.MathUtils.lerp(a.state.scales[p + 1], b.state.scales[p + 1], eased),
      THREE.MathUtils.lerp(a.state.scales[p + 2], b.state.scales[p + 2], eased),
    ).multiplyScalar(breathe);
    dummy.scale.copy(baseScale);
    dummy.updateMatrix();
    ice.setMatrixAt(i, dummy.matrix);
    edges.setMatrixAt(i, dummy.matrix);
  }
  ice.instanceMatrix.needsUpdate = true;
  edges.instanceMatrix.needsUpdate = true;
}

function updateCamera(progress, time) {
  let targetPosition;
  let targetLook;

  if (progress < 0.3) {
    const t = progress / 0.3;
    targetPosition = new THREE.Vector3(
      THREE.MathUtils.lerp(compact ? 0.2 : 1.5, compact ? 0 : 0.2, t),
      THREE.MathUtils.lerp(0.5, 0.2, t),
      THREE.MathUtils.lerp(compact ? 13.3 : 12.2, 10.7, t),
    );
    targetLook = new THREE.Vector3(0, -0.1, 0);
  } else if (progress < 0.69) {
    const t = (progress - 0.3) / 0.39;
    targetPosition = new THREE.Vector3(
      Math.sin(t * Math.PI * 2) * (compact ? 0.35 : 1.15),
      0.35 + Math.sin(t * Math.PI) * 0.4,
      10.3 + Math.cos(t * Math.PI * 2) * 0.45,
    );
    targetLook = new THREE.Vector3(0, 0.15, 0);
  } else {
    const t = (progress - 0.69) / 0.31;
    targetPosition = new THREE.Vector3(
      THREE.MathUtils.lerp(0.6, compact ? 0 : 0.25, t),
      THREE.MathUtils.lerp(0.6, 1.3, t),
      THREE.MathUtils.lerp(11.0, compact ? 15.2 : 14.0, t),
    );
    targetLook = new THREE.Vector3(0, THREE.MathUtils.lerp(0.4, 1.0, t), -0.55);
  }

  smoothedPointerX += (pointerX - smoothedPointerX) * 0.04;
  smoothedPointerY += (pointerY - smoothedPointerY) * 0.04;
  const pointerInfluence = reducedMotion ? 0 : 1 - Math.max(0, (progress - 0.86) / 0.14);
  targetPosition.x += smoothedPointerX * (compact ? 0.18 : 0.5) * pointerInfluence;
  targetPosition.y += smoothedPointerY * 0.24 * pointerInfluence;
  targetPosition.y += Math.sin(time * 0.16) * 0.035;

  camera.position.lerp(targetPosition, reducedMotion ? 0.14 : 0.065);
  camera.lookAt(targetLook);
}

function updateEnvironment(progress, time) {
  const moonProgress = THREE.MathUtils.smoothstep(progress, 0.76, 0.93);
  const auroraProgress = THREE.MathUtils.smoothstep(progress, 0.89, 0.985);
  moonCore.material.opacity = moonProgress * 0.18;
  moonGlow.material.opacity = moonProgress * 0.42;
  moonGlow.scale.setScalar(10.5 + Math.sin(time * 0.32) * 0.25);
  moonLight.intensity = moonProgress * 19;
  innerLight.intensity = THREE.MathUtils.lerp(12, 0.8, THREE.MathUtils.smoothstep(progress, 0.1, 0.34));
  groundHalo.material.opacity = THREE.MathUtils.lerp(0.065, 0.18, moonProgress);
  groundHalo.scale.setScalar(1 + moonProgress * 1.4);
  aurora.visible = auroraProgress > 0.001;
  aurora.children.forEach((mesh, index) => {
    mesh.material.uniforms.uTime.value = time;
    mesh.material.uniforms.uProgress.value = auroraProgress;
    mesh.position.x = (index - 1) * 1.2 + Math.sin(time * 0.12 + index) * 0.22;
  });
  mountains.position.y = -moonProgress * 0.1;
  stars.material.opacity = 0.42 + moonProgress * 0.2;
}

function updateChapter(progress) {
  let next = 0;
  for (let i = 0; i < chapters.length; i += 1) {
    if (progress >= chapters[i].threshold) next = i;
  }
  if (next === currentChapter) return;
  currentChapter = next;
  const chapter = chapters[next];
  dom.copy.classList.add('is-changing');
  window.setTimeout(() => {
    dom.eyebrow.textContent = chapter.eyebrow;
    dom.headline.innerHTML = chapter.headline;
    dom.description.textContent = chapter.description;
    dom.chapterIndex.textContent = chapter.index;
    dom.chapterName.textContent = chapter.name;
    dom.copy.classList.remove('is-changing');
  }, reducedMotion ? 0 : 220);
}

function onPointerMove(event) {
  pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
  pointerY = -(event.clientY / window.innerHeight - 0.5) * 2;
}
window.addEventListener('pointermove', onPointerMove, { passive: true });

let lenis = null;
if (!reducedMotion) {
  lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    wheelMultiplier: 0.82,
    touchMultiplier: 1.15,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

ScrollTrigger.create({
  trigger: dom.track,
  start: 'top top',
  end: 'bottom bottom',
  scrub: true,
  onUpdate: (self) => {
    scrollProgress = self.progress;
    dom.progress.style.width = `${self.progress * 100}%`;
    dom.scrollCue.style.opacity = String(THREE.MathUtils.clamp(1 - self.progress * 5, 0, 1));
    updateChapter(self.progress);
  },
});

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer?.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.4 : 1.9));
}
window.addEventListener('resize', resize, { passive: true });

let isVisible = true;
document.addEventListener('visibilitychange', () => {
  isVisible = !document.hidden;
  if (isVisible) lastTime = performance.now();
});

function animate(now) {
  requestAnimationFrame(animate);
  if (!isVisible) return;
  const delta = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  const time = now / 1000;
  updateInstances(scrollProgress, time);
  updateCamera(scrollProgress, time);
  updateEnvironment(scrollProgress, time);
  updateSnow(snow, time, delta);
  iceMaterial.emissiveIntensity = 0.2 + Math.sin(time * 0.6) * 0.035 + scrollProgress * 0.08;
  edgeMaterial.opacity = 0.08 + Math.sin(time * 0.7) * 0.018 + scrollProgress * 0.045;
  stars.rotation.y = time * 0.0025;
  if (composer) composer.render();
  else renderer.render(scene, camera);
}

updateInstances(0, 0);
updateChapter(0);
requestAnimationFrame(animate);

dom.loadingProgress.style.width = '100%';
dom.loadingValue.value = '100%';
window.setTimeout(() => {
  dom.loading.classList.add('is-hidden');
  document.body.classList.remove('is-loading');
  ScrollTrigger.refresh();
}, 360);
