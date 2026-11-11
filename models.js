// Lightweight, photo-guided exhibit studies. Geometry is real volume; no photo billboards.
export const PHOTO_MODELS = ["starys", "cyberbuddy", "esp32-mini-radar", "glove-mouse", "smartsprout", "pixie", "esp32-rc-car"];

// Bake static parts by material, keeping spatial chunks for frustum culling.
export function batchMeshes(THREE, root, chunkSize = 12) {
  root.updateMatrixWorld(true);
  const groups = new Map(), inverse = root.matrixWorld.clone().invert();
  root.traverse(o => {
    if (!o.isMesh || Array.isArray(o.material) || o.material.transparent) return;
    const key = `${o.material.uuid}:${Math.floor(o.getWorldPosition(new THREE.Vector3()).z / chunkSize)}:${o.castShadow}:${o.receiveShadow}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  });
  for (const parts of groups.values()) {
    if (parts.length < 2) continue;
    const sources = parts.map(o => {
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, o.matrixWorld));
      return g;
    });
    const geo = new THREE.BufferGeometry();
    for (const name of ["position", "normal", "uv"]) {
      if (!sources.every(g => g.getAttribute(name))) continue;
      const attrs = sources.map(g => g.getAttribute(name));
      const data = new Float32Array(attrs.reduce((n, a) => n + a.array.length, 0));
      let offset = 0;
      for (const a of attrs) { data.set(a.array, offset); offset += a.array.length; }
      geo.setAttribute(name, new THREE.BufferAttribute(data, attrs[0].itemSize));
    }
    geo.computeBoundingSphere();
    const combined = new THREE.Mesh(geo, parts[0].material);
    combined.castShadow = parts[0].castShadow; combined.receiveShadow = parts[0].receiveShadow;
    root.add(combined);
    parts.forEach(o => o.removeFromParent());
    sources.forEach(g => g.dispose());
  }
}

export function photoModel(THREE, id) {
  if (!PHOTO_MODELS.includes(id)) return null;
  const g = new THREE.Group(); g.name = `exhibit:${id}`;
  const mat = (color, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness });
  const dark = mat("#15191e"), white = mat("#ede7da"), silver = mat("#b1bcc6", 0.65);
  const green = mat("#167d39"), gold = mat("#f5c52f"), wood = mat("#805333");
  const led = new THREE.MeshBasicMaterial({ color: "#59f5c0" });
  const part = (geo, material, x, y, z) => {
    const o = new THREE.Mesh(geo, material); o.position.set(x, y, z); g.add(o); return o;
  };
  const box = (w, h, d, m, x = 0, y = h / 2, z = 0) => part(new THREE.BoxGeometry(w, h, d), m, x, y, z);
  const cylinder = (r, h, m, x, y, z) => part(new THREE.CylinderGeometry(r, r, h, 16), m, x, y, z);
  const ball = (r, m, x, y, z) => part(new THREE.SphereGeometry(r, 12, 8), m, x, y, z);
  const wire = (points, color) => part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 12, 0.009, 4, false), mat(color), 0, 0, 0);
  const board = (x, y, z, w = 0.4) => { box(w, 0.035, 0.25, green, x, y, z); box(w * 0.45, 0.04, 0.14, silver, x, y + 0.035, z); };
  const screen = (w, h, x, y, z) => {
    box(w, h, 0.025, dark, x, y, z);
    for (const s of [-1, 1]) ball(0.035, led, x + s * w * 0.22, y + 0.025, z + 0.025);
    const smile = part(new THREE.TorusGeometry(w * 0.2, 0.012, 4, 12, Math.PI), led, x, y - 0.015, z + 0.025); smile.rotation.z = Math.PI;
  };
  if (id === "starys") {
    box(0.95, 0.95, 0.95, white, 0, 0.83);
    for (const s of [-1, 1]) {
      box(0.2, 0.25, 1.05, dark, s * 0.4, 0.17);
      for (let k = 0; k < 4; k++) { const w = cylinder(0.12, 0.23, wood, s * 0.4, 0.17, -0.35 + k * 0.23); w.rotation.z = Math.PI / 2; }
      for (const y of [0.55, 1.1]) for (const x of [-0.3, 0.3]) ball(0.033, silver, x, y, s * 0.48);
    }
    box(0.8, 0.025, 0.8, silver, 0, 1.32);
    for (let k = 0; k < 7; k++) box(0.012, 0.01, 0.77, dark, -0.33 + k * 0.11, 1.34);
  }
  if (id === "cyberbuddy") {
    box(1.25, 0.65, 0.7, green, 0, 0.36);
    box(1.3, 0.035, 0.74, green, 0, 0.71);
    screen(0.49, 0.27, -0.23, 0.39, 0.363);
    ball(0.16, white, 0.36, 0.4, 0.36);
    box(0.17, 0.2, 0.04, silver, 0.64, 0.3);
  }
  if (id === "esp32-mini-radar") {
    box(1.15, 0.4, 0.72, dark, 0, 0.23);
    box(0.7, 0.28, 0.025, dark, -0.06, 0.25, 0.373);
    for (const r of [0.08, 0.15, 0.23]) part(new THREE.TorusGeometry(r, 0.005, 4, 20, Math.PI), led, -0.06, 0.13, 0.392);
    box(0.47, 0.008, 0.008, led, -0.06, 0.13, 0.392);
    const sweep = box(0.008, 0.23, 0.008, led, 0.02, 0.21, 0.392); sweep.rotation.z = -0.7;
    ball(0.018, led, 0.1, 0.28, 0.395);
    cylinder(0.23, 0.08, dark, 0, 0.48, 0);
    box(0.18, 0.3, 0.18, dark, 0, 0.64);
    box(0.76, 0.24, 0.12, green, 0, 0.88);
    for (const s of [-1, 1]) {
      const o = cylinder(0.14, 0.16, silver, s * 0.21, 0.88, 0.13); o.rotation.x = Math.PI / 2;
      const face = cylinder(0.116, 0.012, dark, s * 0.21, 0.88, 0.216); face.rotation.x = Math.PI / 2;
    }
    ball(0.035, led, 0.46, 0.28, 0.37);
  }
  if (id === "glove-mouse") {
    const palm = box(0.5, 0.63, 0.15, dark, 0, 0.48); palm.rotation.z = -0.1;
    box(0.43, 0.19, 0.18, dark, 0, 0.1);
    for (let k = 0; k < 4; k++) {
      const finger = part(new THREE.CapsuleGeometry(0.062, 0.28 + (k === 1 ? 0.14 : k === 2 ? 0.1 : 0), 3, 8), dark, -0.19 + k * 0.13, 0.93, 0);
      finger.rotation.z = 0.18 - k * 0.1;
    }
    const thumb = part(new THREE.CapsuleGeometry(0.08, 0.23, 3, 8), dark, 0.32, 0.53, 0); thumb.rotation.z = -0.65;
    board(-0.12, 0.25, 0.14, 0.2);
    for (const y of [0.45, 0.6]) ball(0.038, silver, 0.17, y, 0.1);
    for (let k = 0; k < 3; k++) wire([[-0.12, 0.24, 0.16], [-0.28 + k * 0.08, 0.45, 0.18], [0.15, 0.57, 0.14]], ["#e15744", "#ecc444", "#47bdd7"][k]);
  }
  if (id === "smartsprout") {
    box(1.3, 0.08, 0.85, wood);
    for (const s of [-1, 1]) { box(1.3, 0.38, 0.065, wood, 0, 0.23, s * 0.42); box(0.065, 0.38, 0.85, wood, s * 0.65, 0.23); }
    box(0.45, 0.38, 0.47, white, -0.32, 0.3);
    box(0.48, 0.035, 0.5, silver, -0.32, 0.51);
    cylinder(0.23, 0.4, wood, 0.33, 0.29, 0);
    cylinder(0.21, 0.02, dark, 0.33, 0.5, 0);
    const leaf = mat("#55a54a");
    for (let k = 0; k < 9; k++) {
      const a = k * Math.PI * 2 / 9;
      const o = ball(1, leaf, 0.33 + Math.cos(a) * 0.13, 0.77, Math.sin(a) * 0.13);
      o.scale.set(0.035, 0.35, 0.055); o.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
    }
    board(0, 0.44, -0.3, 0.4);
    wire([[-0.32, 0.5, 0], [-0.1, 0.64, 0.13], [0.33, 0.53, 0]], "#8cb3c9");
    ball(0.03, led, -0.4, 0.24, 0.46);
  }
  if (id === "pixie") {
    cylinder(0.35, 0.13, dark, 0, 0.065, 0);
    cylinder(0.025, 0.38, silver, 0, 0.3, 0);
    const amber = new THREE.MeshBasicMaterial({ color: "#ffd94e" });
    const cream = new THREE.MeshBasicMaterial({ color: "#fff3be" });
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
      if (x * x + y * y <= 10) box(0.078, 0.078, 0.12, x * x + y * y < 4 ? cream : amber, x * 0.08, 0.76 + y * 0.08);
    }
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) {
      box(0.09, 0.12, 0.09, k % 2 ? cream : amber, s * (0.18 + k * 0.055), 0.91 + k * 0.07);
    }
  }
  if (id === "esp32-rc-car") {
    box(0.85, 0.07, 1.1, green, 0, 0.33);
    box(0.65, 0.08, 0.65, green, 0, 0.59);
    for (const s of [-1, 1]) for (const z of [-0.36, 0.36]) {
      const tire = cylinder(0.24, 0.17, dark, s * 0.5, 0.25, z); tire.rotation.z = Math.PI / 2;
      const hub = cylinder(0.15, 0.18, gold, s * 0.51, 0.25, z); hub.rotation.z = Math.PI / 2;
      box(0.07, 0.23, 0.07, silver, s * 0.25, 0.46, z * 0.6);
    }
    box(0.5, 0.07, 0.37, white, 0, 0.67); board(0, 0.73, 0, 0.4);
    box(0.45, 0.15, 0.18, dark, 0, 0.76, -0.3);
    for (let k = 0; k < 4; k++) wire([[-0.25 + k * 0.15, 0.39, 0.3], [-0.35 + k * 0.2, 1.12, 0], [0.2 - k * 0.1, 0.78, -0.2]], ["#e75242", "#e9ce49", "#4399da", "#a95bca"][k]);
  }
  batchMeshes(THREE, g);
  return g;
}
