import * as THREE from 'three';

export function mulberry32(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function createState(count) {
  return {
    positions: new Float32Array(count * 3),
    quaternions: new Float32Array(count * 4),
    scales: new Float32Array(count * 3),
  };
}

function setTransform(state, index, position, rotation, scale) {
  const p = index * 3;
  const q = index * 4;
  const quaternion = new THREE.Quaternion().setFromEuler(rotation);
  state.positions[p] = position.x;
  state.positions[p + 1] = position.y;
  state.positions[p + 2] = position.z;
  state.quaternions[q] = quaternion.x;
  state.quaternions[q + 1] = quaternion.y;
  state.quaternions[q + 2] = quaternion.z;
  state.quaternions[q + 3] = quaternion.w;
  state.scales[p] = scale.x;
  state.scales[p + 1] = scale.y;
  state.scales[p + 2] = scale.z;
}

function randomRotation(rng, intensity = 1) {
  return new THREE.Euler(
    (rng() - 0.5) * intensity,
    (rng() - 0.5) * intensity,
    (rng() - 0.5) * intensity,
  );
}

function randomScale(rng, base = 1, variance = 0.18) {
  const value = base + (rng() - 0.5) * variance;
  return new THREE.Vector3(value, value * (0.9 + rng() * 0.16), value * (0.92 + rng() * 0.12));
}

export function createIglooState(count, seed = 11) {
  const rng = mulberry32(seed);
  const state = createState(count);
  const points = [];
  const radius = 3.05;
  const centerY = -1.65;
  const rows = 18;

  for (let row = 0; row < rows; row += 1) {
    const phi = (row / (rows - 1)) * (Math.PI * 0.5);
    const ringRadius = Math.max(0.18, Math.sin(phi) * radius);
    const y = centerY + Math.cos(phi) * radius;
    const pieces = Math.max(5, Math.round((ringRadius / radius) * 46));

    for (let column = 0; column < pieces; column += 1) {
      const stagger = row % 2 ? 0.5 : 0;
      const angle = ((column + stagger) / pieces) * Math.PI * 2;
      const x = Math.cos(angle) * ringRadius;
      const z = Math.sin(angle) * ringRadius;
      const isDoor = z > 2.45 && Math.abs(x) < 0.78 && y < -0.25;
      if (!isDoor) points.push(new THREE.Vector3(x, y, z));
    }
  }

  for (let i = 0; i < count; i += 1) {
    const point = points[i % points.length].clone();
    const normal = new THREE.Vector3(point.x, point.y - centerY, point.z).normalize();
    point.addScaledVector(normal, (rng() - 0.5) * 0.11);
    const rotation = new THREE.Euler(
      Math.atan2(normal.z, normal.y) * 0.14,
      Math.atan2(point.x, point.z),
      (rng() - 0.5) * 0.06,
    );
    const scale = new THREE.Vector3(
      0.9 + rng() * 0.24,
      0.72 + rng() * 0.18,
      0.86 + rng() * 0.2,
    );
    setTransform(state, i, point, rotation, scale);
  }

  return state;
}

function roundedBoxPoint(rng, size, roundness = 0.25) {
  const face = Math.floor(rng() * 6);
  const point = new THREE.Vector3(
    (rng() - 0.5) * size.x,
    (rng() - 0.5) * size.y,
    (rng() - 0.5) * size.z,
  );
  const half = size.clone().multiplyScalar(0.5);
  if (face === 0) point.x = half.x;
  if (face === 1) point.x = -half.x;
  if (face === 2) point.y = half.y;
  if (face === 3) point.y = -half.y;
  if (face === 4) point.z = half.z;
  if (face === 5) point.z = -half.z;
  point.x = THREE.MathUtils.clamp(point.x, -half.x + roundness, half.x - roundness);
  point.y = THREE.MathUtils.clamp(point.y, -half.y + roundness, half.y - roundness);
  point.z = THREE.MathUtils.clamp(point.z, -half.z + roundness, half.z - roundness);
  return point;
}

export function createSpeakerState(count, seed = 21) {
  const rng = mulberry32(seed);
  const state = createState(count);

  for (let i = 0; i < count; i += 1) {
    let position;
    if (i < count * 0.77) {
      const angle = rng() * Math.PI * 2;
      const y = -1.75 + rng() * 3.5;
      const radius = 1.55 + Math.sin((y + 1.75) / 3.5 * Math.PI) * 0.12;
      position = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    } else {
      const ring = i < count * 0.9 ? 0.78 : 0.36;
      const angle = rng() * Math.PI * 2;
      position = new THREE.Vector3(Math.cos(angle) * ring, (rng() - 0.5) * 1.8, 1.68 + rng() * 0.18);
    }
    const rotation = new THREE.Euler(rng() * 0.25, Math.atan2(position.x, position.z), rng() * 0.18);
    setTransform(state, i, position, rotation, randomScale(rng, 0.82, 0.16));
  }
  return state;
}

export function createLampState(count, seed = 31) {
  const rng = mulberry32(seed);
  const state = createState(count);

  for (let i = 0; i < count; i += 1) {
    const ratio = i / count;
    let position;
    if (ratio < 0.28) {
      const angle = rng() * Math.PI * 2;
      const radius = Math.sqrt(rng()) * 1.85;
      position = new THREE.Vector3(Math.cos(angle) * radius, -1.75 + rng() * 0.22, Math.sin(angle) * radius);
    } else if (ratio < 0.47) {
      const angle = rng() * Math.PI * 2;
      const radius = 0.26 + rng() * 0.15;
      position = new THREE.Vector3(Math.cos(angle) * radius, -1.55 + rng() * 2.5, Math.sin(angle) * radius);
    } else {
      const y = 0.72 + rng() * 1.8;
      const local = (y - 0.72) / 1.8;
      const radius = 2.15 - local * 1.55;
      const angle = rng() * Math.PI * 2;
      position = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    }
    setTransform(state, i, position, randomRotation(rng, 0.55), randomScale(rng, 0.74, 0.2));
  }
  return state;
}

export function createCameraState(count, seed = 41) {
  const rng = mulberry32(seed);
  const state = createState(count);

  for (let i = 0; i < count; i += 1) {
    const ratio = i / count;
    let position;
    if (ratio < 0.7) {
      position = roundedBoxPoint(rng, new THREE.Vector3(4.4, 2.55, 1.6), 0.3);
    } else if (ratio < 0.94) {
      const angle = rng() * Math.PI * 2;
      const radius = 0.65 + rng() * 0.92;
      const z = 1.0 + rng() * 1.2;
      position = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
    } else {
      position = new THREE.Vector3(1.15 + rng() * 0.65, 1.22 + rng() * 0.4, 0.55 + rng() * 0.4);
    }
    setTransform(state, i, position, randomRotation(rng, 0.48), randomScale(rng, 0.76, 0.2));
  }
  return state;
}

export function createMoonState(count, seed = 51) {
  const rng = mulberry32(seed);
  const state = createState(count);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const craterNoise = Math.sin(theta * 2.1) * Math.sin(y * 8.4) * 0.09;
    const radius = 3.15 + craterNoise + (rng() - 0.5) * 0.12;
    const position = new THREE.Vector3(
      Math.cos(theta) * radiusAtY * radius,
      y * radius + 1.0,
      Math.sin(theta) * radiusAtY * radius - 0.55,
    );
    const normal = position.clone().sub(new THREE.Vector3(0, 1, -0.55)).normalize();
    const rotation = new THREE.Euler(
      Math.atan2(normal.z, normal.y),
      Math.atan2(normal.x, normal.z),
      theta * 0.04,
    );
    setTransform(state, i, position, rotation, randomScale(rng, 0.68, 0.25));
  }
  return state;
}

export function createScatterState(source, seed = 71, spread = 4.6, lift = 0) {
  const count = source.positions.length / 3;
  const rng = mulberry32(seed);
  const state = createState(count);

  for (let i = 0; i < count; i += 1) {
    const p = i * 3;
    const angle = i * 0.19 + rng() * Math.PI * 2;
    const radius = 1.2 + rng() * spread;
    const sourcePosition = new THREE.Vector3(
      source.positions[p],
      source.positions[p + 1],
      source.positions[p + 2],
    );
    const drift = new THREE.Vector3(
      Math.cos(angle) * radius,
      (rng() - 0.45) * spread * 0.7 + lift,
      Math.sin(angle) * radius * 0.72 + (rng() - 0.5) * 2.2,
    );
    const position = sourcePosition.multiplyScalar(0.28).add(drift);
    setTransform(state, i, position, randomRotation(rng, Math.PI * 2), randomScale(rng, 0.58, 0.34));
  }
  return state;
}

export function createArcField(count, seed = 91) {
  const rng = mulberry32(seed);
  const values = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const p = i * 3;
    const vector = new THREE.Vector3(rng() - 0.5, rng() * 0.85 + 0.2, rng() - 0.5).normalize();
    values[p] = vector.x * (0.45 + rng() * 1.4);
    values[p + 1] = vector.y * (0.45 + rng() * 1.4);
    values[p + 2] = vector.z * (0.45 + rng() * 1.4);
  }
  return values;
}
