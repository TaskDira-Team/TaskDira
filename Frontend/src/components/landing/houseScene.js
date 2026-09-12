import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap';

// A real, locally generated model. No remote model service or texture downloads.
export function createHouseScene(host, { onProject = () => { }, onInteract = () => { } } = {}) {
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
  const hotspotPositions = { kitchen: new THREE.Vector3(-1.65, 1.8, 0.65), living: new THREE.Vector3(1.15, 1.5, 0.8), bedroom: new THREE.Vector3(1.2, 3.85, 0.3) };
  let explodedAmount = 0;
  const render = () => {
    renderer.render(scene, camera);
    const points = {};
    for (const [id, original] of Object.entries(hotspotPositions)) {
      const position = original.clone();
      if (id === 'bedroom') position.y += explodedAmount;
      position.project(camera);
      points[id] = { x: (position.x + 1) * host.clientWidth / 2, y: (1 - position.y) * host.clientHeight / 2, visible: position.z > -1 && position.z < 1 && Math.abs(position.x) < 0.9 && Math.abs(position.y) < 0.82 };
    }
    onProject(points);
  };
  controls.addEventListener('change', render);
  const ambient = new THREE.HemisphereLight('#fff5df', '#b3b8a1', 2.5); scene.add(ambient);
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
  box(6.3, 2.3, 0.16, palette.wall, house, 0, 1.45, -2.15);
  box(6.3, 2.25, 0.16, palette.wall, house, 0, 3.91, -2.15);
  box(0.15, 2.5, 1.4, palette.wall, house, -3.12, 1.57, -1.5);
  box(0.14, 2.3, 1.4, palette.wall, house, 3.12, 1.45, -1.5);
  box(0.14, 2.25, 1.4, palette.wall, house, 3.12, 3.91, -1.5);
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
  // Window, dishes, recipe books and cupboard details bring the kitchen to life.
  const glass = material('#bfd4c2', { emissive: '#ffc978', emissiveIntensity: 0 });
  box(1.7, 1.22, 0.08, palette.wood, house, -1.55, 3.5, -2.02);
  box(1.55, 1.08, 0.08, glass, house, -1.55, 3.5, -1.96);
  box(0.055, 1.15, 0.1, palette.cream, house, -1.55, 3.5, -1.88);
  box(1.6, 0.055, 0.1, palette.cream, house, -1.55, 3.5, -1.88);
  box(1.9, 0.1, 0.24, palette.lightwood, house, -1.55, 2.88, -1.91);
  const bookColors = [palette.sage, palette.gold, palette.orange, palette.cream];
  for (let i = 0; i < 4; i++) box(0.09, 0.28 + i % 2 * 0.06, 0.18, bookColors[i], house, -1.8 + i * 0.13, 2.28, -1.85);
  for (const x of [-1.85, -1.14, -0.42]) box(0.58, 0.62, 0.04, palette.orange, house, x, 0.75, -1.08);
  const dishes = new THREE.Group(); dishes.position.set(-2.05, 1.3, 0.85); house.add(dishes);
  for (let i = 0; i < 4; i++) {
    cylinder(0.24, 0.2, 0.04, palette.cream, dishes, 0, i * 0.055, 0);
    const rim = mesh(new THREE.TorusGeometry(0.2, 0.014, 7, 24), palette.lightwood, dishes, 0, i * 0.055 + 0.022, 0); rim.rotation.x = -Math.PI / 2;
  }
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
  cylinder(0.29, 0.23, 0.47, palette.lightwood, house, 0.12, 3.09, 1.26);
  const laundry = [];
  for (let i = 0; i < 3; i++) {
    const cloth = box(0.49, 0.09, 0.35, i % 2 ? palette.sage : palette.cream, house, 0.12 + (i - 1) * 0.12, 3.35 + i * 0.095, 1.26 + i * 0.09, 0.035);
    cloth.rotation.y = (i - 1) * 0.55; laundry.push(cloth);
  }
  // Stairs, with real depth and a handrail.
  for (let i = 0; i < 9; i++) box(0.57, 0.15 + i * 0.27, 0.29, palette.wood, house, 2.79, 0.37 + i * 0.135, 1.86 - i * 0.29);
  function plant(x, y, z, size = 1) {
    const plantGroup = new THREE.Group(); plantGroup.position.set(x, y, z); house.add(plantGroup);
    cylinder(0.2 * size, 0.15 * size, 0.33 * size, palette.cream, plantGroup, 0, 0.16 * size, 0);
    cylinder(0.027 * size, 0.035 * size, 0.45 * size, palette.wood, plantGroup, 0, 0.45 * size, 0);
    for (let i = 0; i < 5; i++) { const a = i * 2.4; sphere(0.2 * size, palette.green, plantGroup, Math.cos(a) * 0.16 * size, (0.6 + i * 0.04) * size, Math.sin(a) * 0.15 * size, [0.65, 1.3, 0.8]); }
    return plantGroup;
  }
  plant(-2.65, 0.34, 1.55, 1.15); plant(2.6, 2.84, 1.32, 1.3); plant(-1.15, 2.16, -1.85, 0.65); plant(-1.35, 1.27, 0.84, 0.55);
  const heroPlant = plant(0.3, 0.34, 1.25, 1.15);
  const waterMaterial = material('#82bfd4', { transparent: true, opacity: 0.75, roughness: 0.2 });
  const water = new THREE.Group(); house.add(water); water.visible = false;
  for (let i = 0; i < 14; i++) sphere(0.027, waterMaterial, water, 0.3 + Math.sin(i * 2.4) * 0.24, 1.2 + i * 0.09, 1.25 + Math.cos(i * 2.4) * 0.2, [0.65, 1.7, 0.65]);
  const bulbMaterial = material('#fff0cf', { emissive: '#ffb654', emissiveIntensity: 0.12 });
  sphere(0.09, bulbMaterial, house, 2.45, 3.77, -1.22);
  cylinder(0.028, 0.028, 0.67, palette.wood, house, -1.2, 4.1, 0.2);
  cylinder(0.28, 0.46, 0.18, palette.orange, house, -1.2, 3.75, 0.2);
  sphere(0.13, bulbMaterial, house, -1.2, 3.65, 0.2);
  const roomLights = [[-1.25, 2, 0.2], [1.35, 1.85, -0.7], [2.35, 3.7, -0.6]].map(([x, y, z]) => {
    const light = new THREE.PointLight('#ffbb69', 0, 7, 2); light.position.set(x, y, z); house.add(light); return light;
  });
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
  const upperFloor = new THREE.Group(); house.add(upperFloor);
  for (const object of [...house.children]) {
    if (object !== roof && object !== upperFloor && object.position.y >= 2.6) upperFloor.attach(object);
  }
  const positions = {
    home: { eye: [8, 7.4, 10], target: [0, 2, 0] },
    kitchen: { eye: [-4.5, 3.3, 6.2], target: [-1.4, 1.45, -0.15] },
    living: { eye: [4.2, 2.15, 6.4], target: [1.25, 1.05, -0.2] },
    bedroom: { eye: [4.5, 5.6, 6.6], target: [1.2, 3.6, 0] },
  };
  let disposed = false, opened = false, previousCompleted = new Set(), flightTween;
  const animations = new Set();
  const duration = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-stop-animations') ? 0 : 1.45;
  const track = tween => {
    animations.add(tween);
    const finish = tween.eventCallback('onComplete');
    tween.eventCallback('onComplete', () => { animations.delete(tween); finish?.(); });
    return tween;
  };
  const animate = (object, vars) => track(gsap.to(object, { duration: duration(), ease: 'power3.inOut', overwrite: true, onUpdate: render, ...vars }));
  const interruptFlight = () => { flightTween?.kill(); onInteract(); };
  controls.addEventListener('start', interruptFlight);
  function setOpen(value) {
    opened = value; roof.visible = true;
    animate(door.rotation, { y: value ? -1.8 : 0 });
    animate(roof.position, { y: value ? 7.6 : 5.03 });
    animate(roofMaterial, { opacity: value ? 0 : 1, onComplete: () => { roof.visible = !value; render(); } });
  }
  function moveCamera(eye, target) {
    flightTween?.kill();
    const flight = { x: camera.position.x, y: camera.position.y, z: camera.position.z, tx: controls.target.x, ty: controls.target.y, tz: controls.target.z };
    flightTween = animate(flight, {
      x: eye[0], y: eye[1], z: eye[2], tx: target[0], ty: target[1], tz: target[2], onUpdate: () => {
        camera.position.set(flight.x, flight.y, flight.z);
        controls.target.set(flight.tx, flight.ty, flight.tz);
        controls.update(); render();
      }
    });
  }
  function setRoom(id) {
    const view = positions[id] || positions.home;
    if (id !== 'home' && !opened) setOpen(true);
    moveCamera(view.eye, view.target);
  }
  function setNight(value) {
    animate(ambient, { intensity: value ? 0.55 : 2.5 });
    animate(sunlight, { intensity: value ? 0.38 : 4 });
    animate(fill, { intensity: value ? 0.75 : 1.4 });
    animate(sunlight.color, value ? { r: 0.54, g: 0.65, b: 1 } : { r: 1, g: 0.87, b: 0.71 });
    animate(glass, { emissiveIntensity: value ? 1.2 : 0 });
    animate(bulbMaterial, { emissiveIntensity: value ? 3 : 0.12 });
    roomLights.forEach(light => animate(light, { intensity: value ? 10 : 0 }));
  }
  function setExploded(value) {
    animate(upperFloor.position, { y: value ? 1.6 : 0, onUpdate: () => { explodedAmount = upperFloor.position.y; render(); } });
    if (value) {
      setOpen(true);
      moveCamera([8.8, 8.6, 11.4], [0, 2.55, 0]);
    }
  }
  function setCompleted(ids, instant = false) {
    const done = new Set(ids);
    const transition = (object, vars) => animate(object, { ...vars, duration: instant ? 0 : duration() });
    if (done.has('dishes') !== previousCompleted.has('dishes') || instant) {
      if (done.has('dishes') && !instant && duration()) {
        const timeline = gsap.timeline({ onUpdate: render });
        timeline.to(dishes.position, { y: 1.65, duration: 0.35, ease: 'power2.out' })
          .to(dishes.position, { x: -1.4, y: 0.8, z: -1.4, duration: 0.85, ease: 'power2.inOut' })
          .to(dishes.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.2 }, '-=0.2');
        track(timeline);
      } else {
        gsap.killTweensOf(dishes.position); gsap.killTweensOf(dishes.scale);
        dishes.position.set(-2.05, 1.3, 0.85); dishes.scale.setScalar(done.has('dishes') ? 0.01 : 1);
      }
    }
    if (done.has('plants') !== previousCompleted.has('plants') || instant) {
      const grown = done.has('plants');
      transition(heroPlant.scale, { x: grown ? 1.18 : 1, y: grown ? 1.24 : 1, z: grown ? 1.18 : 1, ease: 'back.out(1.6)' });
      if (grown && !instant && duration()) {
        water.visible = true; water.position.y = 0.3;
        animate(water.position, { y: -0.55, duration: 1, repeat: 1, ease: 'power1.in', onComplete: () => { water.visible = false; render(); } });
      } else water.visible = false;
    }
    if (done.has('laundry') !== previousCompleted.has('laundry') || instant) {
      const folded = done.has('laundry');
      laundry.forEach((cloth, i) => {
        transition(cloth.position, { x: folded ? 0.12 : 0.12 + (i - 1) * 0.12, z: folded ? 1.26 : 1.26 + i * 0.09, y: folded ? 3.32 + i * 0.095 : 3.35 + i * 0.095, delay: instant ? 0 : i * 0.12 });
        transition(cloth.rotation, { y: folded ? 0 : (i - 1) * 0.55, delay: instant ? 0 : i * 0.12 });
      });
    }
    previousCompleted = done; render();
  }
  const resize = () => {
    if (disposed || !host.clientWidth || !host.clientHeight) return;
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.fov = camera.aspect < 0.95 ? 44 : 37;
    camera.updateProjectionMatrix(); render();
  };
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  return {
    setRoom, setOpen, setNight, setExploded, setCompleted,
    replayQuest(id) {
      const current = [...previousCompleted];
      if (!current.includes(id)) return;
      setCompleted(current.filter(quest => quest !== id), true);
      setCompleted(current);
    },
    dispose() {
      if (disposed) return;
      disposed = true; observer.disconnect();
      animations.forEach(animation => animation.kill()); animations.clear();
      controls.removeEventListener('change', render); controls.removeEventListener('start', interruptFlight); controls.dispose();
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      renderer.dispose();
      if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
