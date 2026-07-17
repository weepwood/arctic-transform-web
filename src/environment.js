import * as THREE from 'three';
import { mulberry32 } from './shapes.js';

export function createAurora() {
  const group = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(18, 6, 96, 28);
  const vertexShader = `
    uniform float uTime;
    uniform float uProgress;
    uniform float uPhase;
    varying vec2 vUv;
    varying float vWave;

    void main() {
      vUv = uv;
      vec3 p = position;
      float waveA = sin(p.x * 0.52 + uTime * 0.25 + uPhase) * 0.72;
      float waveB = sin(p.x * 1.08 - uTime * 0.18 + uPhase * 1.7) * 0.24;
      float curtain = sin(uv.y * 9.0 + p.x * 0.2 + uTime * 0.3) * 0.12;
      p.y += (waveA + waveB) * (0.25 + uv.y * 0.9) * uProgress;
      p.z += curtain * uProgress;
      vWave = waveA + waveB;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `;
  const fragmentShader = `
    uniform float uProgress;
    uniform float uPhase;
    varying vec2 vUv;
    varying float vWave;

    vec3 palette(float t) {
      vec3 cyan = vec3(0.24, 0.80, 0.87);
      vec3 green = vec3(0.32, 0.90, 0.62);
      vec3 violet = vec3(0.42, 0.43, 0.92);
      vec3 a = mix(cyan, green, smoothstep(0.0, 0.6, t));
      return mix(a, violet, smoothstep(0.55, 1.0, t));
    }

    void main() {
      float vertical = sin(3.14159265 * vUv.y);
      float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
      float bands = 0.45 + 0.55 * sin(vUv.x * 22.0 + vWave * 3.2 + uPhase);
      float alpha = vertical * edge * (0.12 + bands * 0.18) * uProgress;
      vec3 color = palette(fract(vUv.x * 0.78 + uPhase * 0.08));
      gl_FragColor = vec4(color, alpha);
    }
  `;

  for (let i = 0; i < 3; i += 1) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uPhase: { value: i * 1.77 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((i - 1) * 1.2, 4.4 + i * 0.42, -5.7 - i * 1.25);
    mesh.rotation.z = (i - 1) * 0.08;
    mesh.scale.set(1.12 - i * 0.08, 1, 1);
    group.add(mesh);
  }

  group.visible = false;
  return group;
}

export function createSnow(count = 900, seed = 105) {
  const rng = mulberry32(seed);
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const p = i * 3;
    positions[p] = (rng() - 0.5) * 22;
    positions[p + 1] = rng() * 14 - 4;
    positions[p + 2] = (rng() - 0.5) * 18;
    speeds[i] = 0.32 + rng() * 0.65;
    phases[i] = rng() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xd9efff,
    size: 0.035,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.userData = { speeds, phases, count };
  return points;
}

export function updateSnow(points, time, delta) {
  const positions = points.geometry.attributes.position.array;
  const { speeds, phases, count } = points.userData;
  for (let i = 0; i < count; i += 1) {
    const p = i * 3;
    positions[p + 1] -= speeds[i] * delta;
    positions[p] += Math.sin(time * 0.32 + phases[i]) * delta * 0.05;
    if (positions[p + 1] < -3.8) positions[p + 1] = 9.5;
  }
  points.geometry.attributes.position.needsUpdate = true;
}

export function createStars(count = 700, seed = 115) {
  const rng = mulberry32(seed);
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const p = i * 3;
    const radius = 18 + rng() * 24;
    const theta = rng() * Math.PI * 2;
    const phi = rng() * Math.PI * 0.48;
    positions[p] = Math.cos(theta) * Math.sin(phi) * radius;
    positions[p + 1] = Math.cos(phi) * radius + 2;
    positions[p + 2] = Math.sin(theta) * Math.sin(phi) * radius - 8;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xbcdcf7,
    size: 0.045,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  return new THREE.Points(geometry, material);
}

export function createMountains(seed = 125) {
  const rng = mulberry32(seed);
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x101d32,
    roughness: 0.95,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
  });

  for (let i = 0; i < 14; i += 1) {
    const radius = 2.2 + rng() * 3.2;
    const height = 2.6 + rng() * 4.8;
    const geometry = new THREE.ConeGeometry(radius, height, 24, 4);
    const mountain = new THREE.Mesh(geometry, material);
    mountain.position.set((i - 6.5) * 4.6 + (rng() - 0.5) * 2, -2.2 + height * 0.5, -13 - rng() * 8);
    mountain.rotation.y = rng() * Math.PI;
    mountain.scale.z = 0.45 + rng() * 0.35;
    group.add(mountain);
  }
  return group;
}

export function createGlowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(186, 226, 255, 0.95)');
  gradient.addColorStop(0.18, 'rgba(139, 202, 255, 0.46)');
  gradient.addColorStop(0.52, 'rgba(94, 153, 231, 0.14)');
  gradient.addColorStop(1, 'rgba(49, 94, 170, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
