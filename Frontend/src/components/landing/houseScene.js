import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap';

// A real, locally generated model. No remote model service or texture downloads.
export function createHouseScene(host) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 80);
  camera.position.set(8, 7.4, 10);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.domElement.setAttribute('aria-label', 'Interactive miniature home');
  renderer.domElement.style.touchAction = 'pan-y';
  host.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.8, 0);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = Math.PI / 2.08;
  controls.minAzimuthAngle = -Math.PI / 2.8;
  controls.maxAzimuthAngle = Math.PI / 2.1;
  controls.touches.ONE = null; // Vertical page scrolling stays native on phones.
  controls.touches.TWO = THREE.TOUCH.ROTATE;
  controls.update();
  const render = () => renderer.render(scene, camera);
  controls.addEventListener('change', render);
  scene.add(new THREE.HemisphereLight('#fff5df', '#b3b8a1', 2.5));
  const sunlight = new THREE.DirectionalLight('#fff0db', 4);
  sunlight.position.set(-3, 10, 8);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunlight.shadow.camera, { left: -9, right: 9, top: 10, bottom: -7, near: 0.1, far: 35 });
  sunlight.shadow.normalBias = 0.04;
  scene.add(sunlight);
  const fill = new THREE.DirectionalLight('#e1ecf5', 1.4);
  fill.position.set(7, 5, -3); scene.add(fill);
  const geometries = new Set(), materials = new Set();
  const material = (color, extra = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.72, ...extra }); materials.add(m); return m; };
  const palette = { wall: material('#eee3ca'), wood: material('#b8895b'), lightwood: material('#d4ac7d'), cream: material('#fff2d5'), orange: material('#c96437'), sage: material('#92a477'), green: material('#567648'), gold: material('#e9b657'), dark: material('#3b4a3c'), metal: material('#b5b5a1', { metalness: 0.45, roughness: 0.4 }) };
  function mesh(geometry, mat, parent, x, y, z) {
    geometries.add(geometry); const object = new THREE.Mesh(geometry, mat); object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  }
  function box(w, h, d, mat, parent, x, y, z, radius = 0.035) { return mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)), mat, parent, x, y, z); }
  function cylinder(rt, rb, h, mat, parent, x, y, z) { return mesh(new THREE.CylinderGeometry(rt, rb, h, 20), mat, parent, x, y, z); }
  function sphere(r, mat, parent, x, y, z, scale = [1, 1, 1]) { const o = mesh(new THREE.SphereGeometry(r, 16, 12), mat, parent, x, y, z); o.scale.set(...scale); return o; }
  const house = new THREE.Group(); scene.add(house);
  box(6.9, 0.35, 5, palette.orange, house, 0, 0, 0, 0.16);
  box(6.5, 0.14, 4.6, palette.lightwood, house, 0, 0.24, 0, 0.1);
  for (let x = -3; x < 3.3; x += 0.3) box(0.012, 0.008, 4.3, palette.wood, house, x, 0.318, 0);
  box(6.3, 4.7, 0.16, palette.wall, house, 0, 2.65, -2.15);
  box(0.15, 2.5, 1.4, palette.wall, house, -3.12, 1.57, -1.5);
  box(0.14, 4.7, 1.4, palette.wall, house, 3.12, 2.65, -1.5);
  box(3.1, 0.2, 4.35, palette.wood, house, 1.55, 2.65, 0);
  box(3.12, 0.07, 4.35, palette.lightwood, house, 1.55, 2.79, 0);
  box(0.13, 2.18, 1.4, palette.wall, house, 0, 3.9, -1.45);
  // Kitchen: fridge, cabinetry, stove, sink and an island.
  box(0.9, 1.75, 0.8, palette.orange, house, -2.5, 1.18, -1.5, 0.09);
  box(0.035, 0.55, 0.035, palette.metal, house, -2.14, 1.2, -1.065);
  box(1.95, 0.78, 0.78, palette.orange, house, -1, 0.73, -1.5);
  box(2.05, 0.1, 0.87, palette.cream, house, -1, 1.17, -1.45);
  box(0.52, 0.02, 0.47, palette.dark, house, -0.4, 1.235, -1.46);
  for (const x of [-0.55, -0.25]) for (const z of [-1.59, -1.34]) cylinder(0.07, 0.07, 0.012, palette.metal, house, x, 1.25, z);
  box(0.55, 0.035, 0.46, palette.metal, house, -1.56, 1.24, -1.44);
  const faucet = mesh(new THREE.TorusGeometry(0.13, 0.022, 7, 16, Math.PI), palette.metal, house, -1.56, 1.45, -1.68);
  box(1.7, 0.8, 0.72, palette.orange, house, -1.63, 0.74, 0.82, 0.08);
  box(1.95, 0.12, 0.92, palette.cream, house, -1.63, 1.2, 0.82, 0.07);
  for (const x of [-2.05, -1.23]) { cylinder(0.22, 0.22, 0.1, palette.sage, house, x, 0.85, 1.73); cylinder(0.045, 0.06, 0.5, palette.wood, house, x, 0.57, 1.73); }
  box(1.6, 0.1, 0.34, palette.lightwood, house, -1.2, 2.1, -1.88);
  // Living room.
  const rug = cylinder(1.25, 1.25, 0.025, palette.cream, house, 1.5, 0.34, 0.55); rug.scale.z = 0.78;
  box(1.95, 0.38, 0.85, palette.sage, house, 1.45, 0.76, -1.21, 0.14);
  box(2, 0.65, 0.27, palette.sage, house, 1.45, 1.09, -1.6, 0.12);
  for (const x of [0.42, 2.48]) box(0.24, 0.57, 0.95, palette.sage, house, x, 0.94, -1.18, 0.08);
  for (const x of [0.84, 1.65]) box(0.5, 0.46, 0.2, x < 1 ? palette.gold : palette.cream, house, x, 1.22, -1.3, 0.08).rotation.z = 0.13;
  cylinder(0.57, 0.57, 0.09, palette.lightwood, house, 1.45, 0.85, 0.5);
  for (const [x, z] of [[1.16, 0.35], [1.77, 0.35], [1.5, 0.84]]) cylinder(0.04, 0.04, 0.5, palette.wood, house, x, 0.57, z);
  cylinder(0.1, 0.08, 0.14, palette.cream, house, 1.62, 0.98, 0.54);
  // Bedroom upstairs, books, pillows and a woven-style basket.
  box(1.65, 0.25, 2.5, palette.wood, house, 1.25, 3.02, -0.25, 0.06);
  box(1.59, 0.24, 2.44, palette.cream, house, 1.25, 3.22, -0.25, 0.1);
  box(1.61, 0.15, 1.52, palette.gold, house, 1.25, 3.4, 0.2, 0.09);
  box(1.68, 0.8, 0.16, palette.wood, house, 1.25, 3.37, -1.47, 0.08);
  for (const x of [0.82, 1.63]) box(0.61, 0.16, 0.47, palette.cream, house, x, 3.41, -1.07, 0.1);
  box(0.53, 0.62, 0.5, palette.lightwood, house, 2.45, 3.13, -1.22);
  cylinder(0.035, 0.05, 0.33, palette.wood, house, 2.45, 3.59, -1.22);
  cylinder(0.14, 0.27, 0.2, palette.orange, house, 2.45, 3.82, -1.22);
  box(0.8, 0.65, 0.08, palette.wood, house, 1.2, 4.33, -2.03);
  box(0.68, 0.53, 0.08, palette.cream, house, 1.2, 4.33, -1.97);
  sphere(0.16, palette.gold, house, 1.13, 4.39, -1.91, [1, 1, 0.1]);
  cylinder(0.29, 0.23, 0.47, palette.lightwood, house, -2.5, 0.57, 0);
  for (let i = 0; i < 3; i++) box(0.42, 0.09, 0.34, i % 2 ? palette.sage : palette.cream, house, -2.5, 0.85 + i * 0.085, 0, 0.035);
  // Stairs, with real depth and a handrail.
  for (let i = 0; i < 9; i++) box(0.57, 0.15 + i * 0.27, 0.29, palette.wood, house, 2.79, 0.37 + i * 0.135, 1.86 - i * 0.29);
  function plant(x, y, z, size = 1) {
    cylinder(0.2 * size, 0.15 * size, 0.33 * size, palette.cream, house, x, y + 0.16 * size, z);
    cylinder(0.027 * size, 0.035 * size, 0.45 * size, palette.wood, house, x, y + 0.45 * size, z);
    for (let i = 0; i < 5; i++) { const a = i * 2.4; sphere(0.2 * size, palette.green, house, x + Math.cos(a) * 0.16 * size, y + (0.6 + i * 0.04) * size, z + Math.sin(a) * 0.15 * size, [0.65, 1.3, 0.8]); }
  }
  plant(-2.65, 0.34, 1.55, 1.15); plant(2.6, 2.84, 1.32, 1.3); plant(-1.15, 2.16, -1.85, 0.65); plant(-1.95, 1.27, 0.84, 0.55); plant(0.18, 0.34, 1.82, 0.85);
  // A hinged front door. Room visits open it with the roof.
  const door = new THREE.Group(); door.position.set(-0.48, 0.34, 2.12); house.add(door);
  box(0.09, 1.96, 0.16, palette.cream, house, -0.53, 1.3, 2.12);
  box(0.09, 1.96, 0.16, palette.cream, house, 0.32, 1.3, 2.12);
  box(0.94, 0.1, 0.16, palette.cream, house, -0.1, 2.23, 2.12);
  box(0.76, 1.82, 0.1, palette.sage, door, 0.38, 0.91, 0, 0.05);
  sphere(0.045, palette.gold, door, 0.63, 0.9, 0.09);
  const roofMaterial = material('#bb5c39', { transparent: true });
  const roof = new THREE.Group(); roof.position.y = 5.03; house.add(roof);
  for (const side of [-1, 1]) { const panel = box(3.5, 0.16, 4.8, roofMaterial, roof, side * 1.58, 0.39, 0, 0.05); panel.rotation.z = side * -0.24; }
  box(0.46, 0.86, 0.47, palette.wall, roof, -1.6, 0.83, -0.85);
  const ground = mesh(new THREE.PlaneGeometry(70, 70), new THREE.ShadowMaterial({ opacity: 0.15 }), scene, 0, -0.19, 0);
  materials.add(ground.material); ground.rotation.x = -Math.PI / 2; ground.castShadow = false;
  const positions = {
    home: { eye: [8, 7.4, 10], target: [0, 1.8, 0] },
    kitchen: { eye: [-4.8, 3.5, 6.8], target: [-1.3, 1.05, 0] },
    living: { eye: [5.2, 2.35, 6.8], target: [1.3, 1.05, -0.15] },
    bedroom: { eye: [4.8, 5.7, 6.9], target: [1.2, 3.35, -0.1] },
  };
  let disposed = false, opened = false;
  const duration = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-stop-animations') ? 0 : 1.3;
  const animate = (object, vars) => gsap.to(object, { ...vars, duration: duration(), ease: 'power3.inOut', overwrite: true, onUpdate: () => { controls.update(); render(); } });
  function setOpen(value) {
    opened = value; roof.visible = true;
    animate(door.rotation, { y: value ? -1.8 : 0 });
    animate(roof.position, { y: value ? 7.6 : 5.03 });
    gsap.to(roofMaterial, { opacity: value ? 0 : 1, duration: duration(), overwrite: true, onUpdate: render, onComplete: () => { roof.visible = !value; render(); } });
  }
  function setRoom(id) {
    const view = positions[id] || positions.home;
    if (id !== 'home' && !opened) setOpen(true);
    const [x, y, z] = view.eye;
    animate(camera.position, { x, y, z });
    const [tx, ty, tz] = view.target;
    animate(controls.target, { x: tx, y: ty, z: tz });
  }
  const resize = () => {
    if (disposed || !host.clientWidth || !host.clientHeight) return;
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); render();
  };
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  return {
    setRoom, setOpen,
    dispose() {
      disposed = true; observer.disconnect();
      [camera.position, controls.target, door.rotation, roof.position, roofMaterial].forEach(target => gsap.killTweensOf(target));
      controls.removeEventListener('change', render); controls.dispose();
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}
