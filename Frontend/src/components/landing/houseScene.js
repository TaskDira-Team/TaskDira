import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { gsap } from "gsap";
import { createFrameScheduler } from "../../utils/frameScheduler";

// A real, locally generated model. No remote model service or texture downloads.
export function createHouseScene(
  host,
  { onProject = () => {}, onInteract = () => {}, worldMode = false } = {},
) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 80);
  camera.position.set(8, 7.4, 10);
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = worldMode ? 1.05 : 1.35;
  renderer.domElement.setAttribute("aria-label", "Interactive miniature home");
  renderer.domElement.style.touchAction = "pan-y";
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
  const hotspotPositions = {
    kitchen: new THREE.Vector3(-1.65, 1.8, 0.65),
    living: new THREE.Vector3(1.15, 1.5, 0.8),
    bedroom: new THREE.Vector3(1.2, 3.85, 0.3),
  };
  let explodedAmount = 0;
  const frames = createFrameScheduler(() => {
    renderer.render(scene, camera);
    const points = {};
    for (const [id, original] of Object.entries(hotspotPositions)) {
      const position = original.clone();
      if (id === "bedroom") position.y += explodedAmount;
      position.project(camera);
      points[id] = {
        x: ((position.x + 1) * host.clientWidth) / 2,
        y: ((1 - position.y) * host.clientHeight) / 2,
        visible:
          position.z > -1 &&
          position.z < 1 &&
          Math.abs(position.x) < 0.9 &&
          Math.abs(position.y) < 0.82,
      };
    }
    onProject(points);
  });
  const render = frames.request;
  controls.addEventListener("change", render);
  const ambient = new THREE.HemisphereLight("#fff5df", "#b3b8a1", 2.5);
  scene.add(ambient);
  const sunlight = new THREE.DirectionalLight("#fff0db", 4);
  sunlight.position.set(-3, 10, 8);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunlight.shadow.camera, {
    left: -9,
    right: 9,
    top: 10,
    bottom: -7,
    near: 0.1,
    far: 35,
  });
  sunlight.shadow.normalBias = 0.04;
  scene.add(sunlight);
  const fill = new THREE.DirectionalLight("#e1ecf5", 1.4);
  fill.position.set(7, 5, -3);
  scene.add(fill);
  const geometries = new Set(),
    materials = new Set();
  const material = (color, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.52,
      ...extra,
    });
    materials.add(m);
    return m;
  };
  const palette = {
    wall: material("#eee3ca"),
    wood: material("#b8895b"),
    lightwood: material("#d4ac7d"),
    cream: material("#fff2d5"),
    orange: material("#ef836c"),
    sage: material("#37b498"),
    lilac: material("#b084e4"),
    green: material("#567648"),
    gold: material("#e9b657"),
    dark: material("#3b4a3c"),
    metal: material("#b5b5a1", { metalness: 0.45, roughness: 0.4 }),
  };
  function mesh(geometry, mat, parent, x, y, z) {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(w, h, d, mat, parent, x, y, z, radius = 0.035) {
    return mesh(
      new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)),
      mat,
      parent,
      x,
      y,
      z,
    );
  }
  function cylinder(rt, rb, h, mat, parent, x, y, z) {
    return mesh(
      new THREE.CylinderGeometry(rt, rb, h, 20),
      mat,
      parent,
      x,
      y,
      z,
    );
  }
  function sphere(r, mat, parent, x, y, z, scale = [1, 1, 1]) {
    const o = mesh(new THREE.SphereGeometry(r, 16, 12), mat, parent, x, y, z);
    o.scale.set(...scale);
    return o;
  }
  const house = new THREE.Group();
  scene.add(house);
  box(6.9, 0.35, 5, palette.orange, house, 0, 0, 0, 0.16);
  box(6.5, 0.14, 4.6, palette.lightwood, house, 0, 0.24, 0, 0.1);
  for (let x = -3; x < 3.3; x += 0.3)
    box(0.012, 0.008, 4.3, palette.wood, house, x, 0.318, 0);
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
  for (const x of [-0.55, -0.25])
    for (const z of [-1.59, -1.34])
      cylinder(0.07, 0.07, 0.012, palette.metal, house, x, 1.25, z);
  box(0.55, 0.035, 0.46, palette.metal, house, -1.56, 1.24, -1.44);
  const faucet = mesh(
    new THREE.TorusGeometry(0.13, 0.022, 7, 16, Math.PI),
    palette.metal,
    house,
    -1.56,
    1.45,
    -1.68,
  );
  box(1.7, 0.8, 0.72, palette.orange, house, -1.63, 0.74, 0.82, 0.08);
  box(1.95, 0.12, 0.92, palette.cream, house, -1.63, 1.2, 0.82, 0.07);
  for (const x of [-2.05, -1.23]) {
    cylinder(0.22, 0.22, 0.1, palette.sage, house, x, 0.85, 1.73);
    cylinder(0.045, 0.06, 0.5, palette.wood, house, x, 0.57, 1.73);
  }
  box(1.6, 0.1, 0.34, palette.lightwood, house, -1.2, 2.1, -1.88);
  // Window, dishes, recipe books and cupboard details bring the kitchen to life.
  const glass = material("#bfd4c2", {
    emissive: "#ffc978",
    emissiveIntensity: 0,
  });
  box(1.7, 1.22, 0.08, palette.wood, house, -1.55, 3.5, -2.02);
  box(1.55, 1.08, 0.08, glass, house, -1.55, 3.5, -1.96);
  box(0.055, 1.15, 0.1, palette.cream, house, -1.55, 3.5, -1.88);
  box(1.6, 0.055, 0.1, palette.cream, house, -1.55, 3.5, -1.88);
  box(1.9, 0.1, 0.24, palette.lightwood, house, -1.55, 2.88, -1.91);
  const bookColors = [palette.sage, palette.gold, palette.lilac, palette.cream];
  for (let i = 0; i < 4; i++)
    box(
      0.09,
      0.28 + (i % 2) * 0.06,
      0.18,
      bookColors[i],
      house,
      -1.8 + i * 0.13,
      2.28,
      -1.85,
    );
  for (const x of [-1.85, -1.14, -0.42])
    box(0.58, 0.62, 0.04, palette.orange, house, x, 0.75, -1.08);
  const dishes = new THREE.Group();
  dishes.position.set(-2.05, 1.3, 0.85);
  house.add(dishes);
  for (let i = 0; i < 4; i++) {
    cylinder(0.24, 0.2, 0.04, palette.cream, dishes, 0, i * 0.055, 0);
    const rim = mesh(
      new THREE.TorusGeometry(0.2, 0.014, 7, 24),
      palette.lightwood,
      dishes,
      0,
      i * 0.055 + 0.022,
      0,
    );
    rim.rotation.x = -Math.PI / 2;
  }
  // Living room.
  const rug = cylinder(
    1.25,
    1.25,
    0.025,
    palette.cream,
    house,
    1.5,
    0.34,
    0.55,
  );
  rug.scale.z = 0.78;
  box(1.95, 0.38, 0.85, palette.sage, house, 1.45, 0.76, -1.21, 0.14);
  box(2, 0.65, 0.27, palette.sage, house, 1.45, 1.09, -1.6, 0.12);
  for (const x of [0.42, 2.48])
    box(0.24, 0.57, 0.95, palette.sage, house, x, 0.94, -1.18, 0.08);
  for (const x of [0.84, 1.65])
    box(
      0.5,
      0.46,
      0.2,
      x < 1 ? palette.gold : palette.cream,
      house,
      x,
      1.22,
      -1.3,
      0.08,
    ).rotation.z = 0.13;
  cylinder(0.57, 0.57, 0.09, palette.lightwood, house, 1.45, 0.85, 0.5);
  for (const [x, z] of [
    [1.16, 0.35],
    [1.77, 0.35],
    [1.5, 0.84],
  ])
    cylinder(0.04, 0.04, 0.5, palette.wood, house, x, 0.57, z);
  cylinder(0.1, 0.08, 0.14, palette.cream, house, 1.62, 0.98, 0.54);
  // Bedroom upstairs, books, pillows and a woven-style basket.
  box(1.65, 0.25, 2.5, palette.wood, house, 1.25, 3.02, -0.25, 0.06);
  box(1.59, 0.24, 2.44, palette.cream, house, 1.25, 3.22, -0.25, 0.1);
  const bedroomPaint = material("#b084e4");
  box(1.61, 0.15, 1.52, bedroomPaint, house, 1.25, 3.4, 0.2, 0.09);
  box(1.68, 0.8, 0.16, palette.wood, house, 1.25, 3.37, -1.47, 0.08);
  for (const x of [0.82, 1.63])
    box(0.61, 0.16, 0.47, palette.cream, house, x, 3.41, -1.07, 0.1);
  box(0.53, 0.62, 0.5, palette.lightwood, house, 2.45, 3.13, -1.22);
  cylinder(0.035, 0.05, 0.33, palette.wood, house, 2.45, 3.59, -1.22);
  cylinder(0.14, 0.27, 0.2, palette.orange, house, 2.45, 3.82, -1.22);
  box(0.8, 0.65, 0.08, palette.wood, house, 1.2, 4.33, -2.03);
  box(0.68, 0.53, 0.08, palette.cream, house, 1.2, 4.33, -1.97);
  sphere(0.16, palette.gold, house, 1.13, 4.39, -1.91, [1, 1, 0.1]);
  cylinder(0.29, 0.23, 0.47, palette.lightwood, house, 0.12, 3.09, 1.26);
  const laundry = [];
  for (let i = 0; i < 3; i++) {
    const cloth = box(
      0.49,
      0.09,
      0.35,
      i % 2 ? palette.sage : palette.cream,
      house,
      0.12 + (i - 1) * 0.12,
      3.35 + i * 0.095,
      1.26 + i * 0.09,
      0.035,
    );
    cloth.rotation.y = (i - 1) * 0.55;
    laundry.push(cloth);
  }
  // Stairs, with real depth and a handrail.
  for (let i = 0; i < 9; i++)
    box(
      0.57,
      0.15 + i * 0.27,
      0.29,
      palette.wood,
      house,
      2.79,
      0.37 + i * 0.135,
      1.86 - i * 0.29,
    );
  function plant(x, y, z, size = 1) {
    const plantGroup = new THREE.Group();
    plantGroup.position.set(x, y, z);
    house.add(plantGroup);
    cylinder(
      0.2 * size,
      0.15 * size,
      0.33 * size,
      palette.cream,
      plantGroup,
      0,
      0.16 * size,
      0,
    );
    cylinder(
      0.027 * size,
      0.035 * size,
      0.45 * size,
      palette.wood,
      plantGroup,
      0,
      0.45 * size,
      0,
    );
    for (let i = 0; i < 5; i++) {
      const a = i * 2.4;
      sphere(
        0.2 * size,
        palette.green,
        plantGroup,
        Math.cos(a) * 0.16 * size,
        (0.6 + i * 0.04) * size,
        Math.sin(a) * 0.15 * size,
        [0.65, 1.3, 0.8],
      );
    }
    return plantGroup;
  }
  plant(-2.65, 0.34, 1.55, 1.15);
  plant(2.6, 2.84, 1.32, 1.3);
  plant(-1.15, 2.16, -1.85, 0.65);
  plant(-1.35, 1.27, 0.84, 0.55);
  const heroPlant = plant(0.3, 0.34, 1.25, 1.15);
  const waterMaterial = material("#82bfd4", {
    transparent: true,
    opacity: 0.75,
    roughness: 0.2,
  });
  const water = new THREE.Group();
  house.add(water);
  water.visible = false;
  for (let i = 0; i < 14; i++)
    sphere(
      0.027,
      waterMaterial,
      water,
      0.3 + Math.sin(i * 2.4) * 0.24,
      1.2 + i * 0.09,
      1.25 + Math.cos(i * 2.4) * 0.2,
      [0.65, 1.7, 0.65],
    );
  const bulbMaterial = material("#fff0cf", {
    emissive: "#ffb654",
    emissiveIntensity: 0.12,
  });
  sphere(0.09, bulbMaterial, house, 2.45, 3.77, -1.22);
  cylinder(0.028, 0.028, 0.67, palette.wood, house, -1.2, 4.1, 0.2);
  cylinder(0.28, 0.46, 0.18, palette.orange, house, -1.2, 3.75, 0.2);
  sphere(0.13, bulbMaterial, house, -1.2, 3.65, 0.2);
  const roomLights = [
    [-1.25, 2, 0.2],
    [1.35, 1.85, -0.7],
    [2.35, 3.7, -0.6],
  ].map(([x, y, z]) => {
    const light = new THREE.PointLight("#ffbb69", 0, 7, 2);
    light.position.set(x, y, z);
    house.add(light);
    return light;
  });
  // A hinged front door. Room visits open it with the roof.
  const door = new THREE.Group();
  door.position.set(-0.48, 0.34, 2.12);
  house.add(door);
  box(0.09, 1.96, 0.16, palette.cream, house, -0.53, 1.3, 2.12);
  box(0.09, 1.96, 0.16, palette.cream, house, 0.32, 1.3, 2.12);
  box(0.94, 0.1, 0.16, palette.cream, house, -0.1, 2.23, 2.12);
  box(0.76, 1.82, 0.1, palette.sage, door, 0.38, 0.91, 0, 0.05);
  sphere(0.045, palette.gold, door, 0.63, 0.9, 0.09);
  const roofMaterial = material("#d77154", { transparent: true });
  const roof = new THREE.Group();
  roof.position.y = 5.03;
  house.add(roof);
  for (const side of [-1, 1]) {
    const panel = box(
      3.5,
      0.16,
      4.8,
      roofMaterial,
      roof,
      side * 1.58,
      0.39,
      0,
      0.05,
    );
    panel.rotation.z = side * -0.24;
  }
  box(0.46, 0.86, 0.47, palette.wall, roof, -1.6, 0.83, -0.85);
  const ground = mesh(
    new THREE.PlaneGeometry(70, 70),
    new THREE.ShadowMaterial({ opacity: 0.15 }),
    scene,
    0,
    -0.19,
    0,
  );
  materials.add(ground.material);
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  const upperFloor = new THREE.Group();
  house.add(upperFloor);
  for (const object of [...house.children]) {
    if (object !== roof && object !== upperFloor && object.position.y >= 2.6)
      upperFloor.attach(object);
  }
  let currentRoom = "home";
  let initializedView = false;
  const positions = {
    home: { eye: [8, 7.4, 10], target: [0, 2, 0] },
    clubhouse: { eye: [-7, 5.5, 8], target: [-4.1, 1.5, 1.5] },
    kitchen: { eye: [-4.5, 3.3, 6.2], target: [-1.4, 1.45, -0.15] },
    living: { eye: [4.2, 2.15, 6.4], target: [1.25, 1.05, -0.2] },
    bedroom: { eye: [4.5, 5.6, 6.6], target: [1.2, 3.6, 0] },
  };
  const personalDecor = {};
  for (const id of ["cushion", "lamp", "plant", "cup", "moon"]) {
    personalDecor[id] = new THREE.Group();
    personalDecor[id].visible = false;
    house.add(personalDecor[id]);
  }
  sphere(
    0.3,
    palette.cream,
    personalDecor.cushion,
    1.2,
    3.57,
    0.65,
    [1.5, 0.4, 1],
  );
  sphere(
    0.19,
    palette.cream,
    personalDecor.cushion,
    1.02,
    3.6,
    0.63,
    [1, 0.5, 1],
  );
  cylinder(0.12, 0.2, 0.08, palette.gold, personalDecor.lamp, 0.25, 2.91, -1.2);
  cylinder(
    0.025,
    0.025,
    0.58,
    palette.gold,
    personalDecor.lamp,
    0.25,
    3.23,
    -1.2,
  );
  sphere(0.24, palette.cream, personalDecor.lamp, 0.25, 3.6, -1.2, [1, 0.9, 1]);
  const roomPlant = plant(2.5, 2.85, 1.15, 0.9);
  personalDecor.plant.add(roomPlant);
  box(0.42, 0.09, 0.4, palette.wood, personalDecor.cup, 2.52, 3.0, 0.05);
  cylinder(0.15, 0.1, 0.24, palette.gold, personalDecor.cup, 2.52, 3.2, 0.05);
  mesh(
    new THREE.TorusGeometry(0.14, 0.028, 8, 18),
    palette.gold,
    personalDecor.cup,
    2.36,
    3.25,
    0.05,
  );
  cylinder(
    0.012,
    0.012,
    0.45,
    palette.wood,
    personalDecor.moon,
    1.1,
    4.65,
    -1.5,
  );
  const roomMoon = mesh(
    new THREE.TorusGeometry(0.27, 0.09, 12, 24, Math.PI * 1.55),
    palette.gold,
    personalDecor.moon,
    1.1,
    4.2,
    -1.5,
  );
  roomMoon.rotation.z = 0.75;
  function setPersonalRoom(room) {
    bedroomPaint.color.set(
      { mint: "#72c7ae", peach: "#efa98c", lilac: "#b397dc", sky: "#89bddf" }[
        room.color
      ] || "#b397dc",
    );
    for (const [id, group] of Object.entries(personalDecor))
      group.visible = room.items?.includes(id) || false;
    render();
  }
  const worldDecor = new THREE.Group();
  scene.add(worldDecor);
  worldDecor.visible = false;
  const lawn = cylinder(
    6.8,
    7,
    0.22,
    material("#86c65c"),
    worldDecor,
    0,
    -0.34,
    0,
  );
  lawn.scale.z = 0.85;
  // A thick toy island, rather than a flat disc beneath the house.
  const island = cylinder(
    6.85,
    6.3,
    0.65,
    material("#c89c68"),
    worldDecor,
    0,
    -0.75,
    0,
  );
  island.scale.z = 0.85;
  const islandLip = cylinder(
    7,
    6.85,
    0.15,
    material("#5da43f"),
    worldDecor,
    0,
    -0.49,
    0,
  );
  islandLip.scale.z = 0.85;
  const pathStone = material("#f6ddb2");
  for (let i = 0; i < 6; i++) {
    const stone = cylinder(
      0.29,
      0.32,
      0.07,
      pathStone,
      worldDecor,
      0.25 + Math.sin(i * 0.9) * 0.25,
      -0.16,
      2.6 + i * 0.4,
    );
    stone.scale.x = 1.5;
  }
  // Trees and a white garden fence give the model a readable silhouette.
  const foliage = [
    material("#4a9d62"),
    material("#72bd54"),
    material("#badb65"),
  ];
  for (const [x, z, height] of [
    [-5, -2.6, 1.7],
    [4.9, -1.8, 2.1],
    [2.8, -3.4, 1.5],
  ]) {
    cylinder(
      0.12,
      0.19,
      height,
      palette.wood,
      worldDecor,
      x,
      height / 2 - 0.15,
      z,
    );
    for (const [dx, dy, dz, r] of [
      [0, 0, 0, 0.75],
      [-0.38, -0.35, 0.2, 0.5],
      [0.4, -0.22, 0.15, 0.55],
    ])
      sphere(
        r,
        foliage[Math.abs(Math.round(x + dy)) % 3],
        worldDecor,
        x + dx,
        height + dy,
        z + dz,
        [1, 1.2, 1],
      );
  }
  for (let i = 0; i < 10; i++)
    box(
      0.13,
      0.72,
      0.12,
      palette.cream,
      worldDecor,
      -3.4 + i * 0.55,
      0.15,
      -3.45,
    );
  for (const y of [0.05, 0.4])
    box(5.25, 0.1, 0.12, palette.cream, worldDecor, -0.95, y, -3.42);
  // A small pond, stepping stones and a mailbox are permanent world details.
  const pondRim = cylinder(
    0.88,
    0.98,
    0.12,
    pathStone,
    worldDecor,
    3.8,
    -0.13,
    3.35,
  );
  pondRim.scale.z = 0.7;
  const pondWater = cylinder(
    0.8,
    0.8,
    0.025,
    material("#49bada", { roughness: 0.22 }),
    worldDecor,
    3.8,
    -0.055,
    3.35,
  );
  pondWater.scale.z = 0.7;
  sphere(0.13, palette.gold, worldDecor, 3.6, 0.05, 3.35, [1.2, 0.75, 0.75]);
  sphere(0.085, palette.gold, worldDecor, 3.72, 0.17, 3.35);
  box(0.09, 0.04, 0.07, palette.orange, worldDecor, 3.81, 0.16, 3.35);
  cylinder(0.07, 0.09, 0.85, palette.wood, worldDecor, -1.3, 0.2, 3.65);
  box(0.56, 0.4, 0.42, palette.sage, worldDecor, -1.3, 0.72, 3.65, 0.1);
  box(0.3, 0.035, 0.03, palette.dark, worldDecor, -1.3, 0.75, 3.88);
  box(0.04, 0.3, 0.04, palette.cream, worldDecor, -0.97, 0.83, 3.65);
  box(0.2, 0.13, 0.04, palette.orange, worldDecor, -0.89, 0.95, 3.65);
  for (const [x, z] of [
    [-2.3, 3.9],
    [2.2, 3.3],
    [-5.3, 0.8],
    [5.1, 0.4],
    [-3.6, -2.5],
  ]) {
    for (let i = 0; i < 3; i++)
      sphere(
        0.1,
        [palette.orange, palette.gold, palette.lilac][i],
        worldDecor,
        x + i * 0.14,
        -0.1,
        z + Math.sin(i) * 0.2,
      );
  }

  const clubhouse = new THREE.Group();
  worldDecor.add(clubhouse);
  clubhouse.position.set(-4.1, 0, 1.5);
  const clubhouseStages = [
    new THREE.Group(),
    new THREE.Group(),
    new THREE.Group(),
  ];
  clubhouseStages.forEach((group) => clubhouse.add(group));
  for (const x of [-0.6, 0.6])
    for (const z of [-0.6, 0.6])
      cylinder(0.1, 0.13, 1.7, palette.wood, clubhouseStages[0], x, 0.7, z);
  box(1.7, 0.16, 1.7, palette.lightwood, clubhouseStages[0], 0, 1.45, 0);
  box(1.6, 1.2, 0.14, palette.sage, clubhouseStages[1], 0, 2.1, -0.7);
  box(0.14, 1.2, 1.5, palette.sage, clubhouseStages[1], -0.73, 2.1, 0);
  for (let i = 0; i < 5; i++)
    box(
      0.5,
      0.08,
      0.17,
      palette.wood,
      clubhouseStages[0],
      0.45,
      i * 0.28,
      0.98,
    );
  for (const side of [-1, 1]) {
    const roof = box(
      1.05,
      0.13,
      1.85,
      palette.lilac,
      clubhouseStages[2],
      side * 0.42,
      2.86,
      0,
    );
    roof.rotation.z = -side * 0.4;
  }
  cylinder(0.035, 0.035, 0.75, palette.cream, clubhouseStages[2], 0, 3.35, 0);
  box(0.5, 0.3, 0.035, palette.orange, clubhouseStages[2], 0.23, 3.6, 0);
  for (const z of [-0.63, 0.63])
    box(1.5, 0.07, 0.07, palette.cream, clubhouseStages[1], 0, 1.95, z);
  for (const x of [-0.65, 0.65])
    cylinder(
      0.045,
      0.045,
      0.55,
      palette.cream,
      clubhouseStages[1],
      x,
      1.73,
      0.65,
    );
  const decorationGroups = {};
  for (const name of ["garden", "picnic", "observatory"]) {
    const group = new THREE.Group();
    worldDecor.add(group);
    decorationGroups[name] = group;
  }
  const garden = decorationGroups.garden;
  box(1.65, 0.23, 1.05, palette.wood, garden, 0, 0, 0);
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 0.3,
      z = i % 2 ? 0.2 : -0.2;
    cylinder(0.025, 0.03, 0.5, palette.green, garden, x, 0.34, z);
    sphere(
      0.17,
      [palette.orange, palette.gold, palette.lilac][i % 3],
      garden,
      x,
      0.64,
      z,
    );
  }
  const picnic = decorationGroups.picnic;
  box(1.6, 0.12, 0.85, palette.orange, picnic, 0, 0.6, 0);
  for (const x of [-0.5, 0.5])
    box(0.13, 0.65, 0.7, palette.wood, picnic, x, 0.25, 0);
  for (const z of [-0.66, 0.66])
    box(1.75, 0.12, 0.3, palette.gold, picnic, 0, 0.28, z);
  sphere(0.16, palette.lilac, picnic, 0.35, 0.8, 0);
  const telescope = decorationGroups.observatory;
  cylinder(0.72, 0.8, 0.15, palette.lilac, telescope, 0, 0, 0);
  cylinder(0.07, 0.12, 0.9, palette.metal, telescope, 0, 0.5, 0);
  const tube = cylinder(0.18, 0.22, 1.1, palette.sage, telescope, 0, 1.1, 0);
  tube.rotation.z = Math.PI / 3;
  sphere(0.15, palette.gold, telescope, -0.49, 1.39, 0);
  function setWorld(world) {
    const firstWorld = !worldDecor.visible;
    worldDecor.visible = true;
    const count = Number(world.completed) || 0;
    clubhouseStages.forEach((group, index) => {
      const wasVisible = group.visible;
      group.visible = count >= [1, 4, 8][index];
      if (group.visible && !wasVisible && !firstWorld) {
        group.scale.setScalar(0.6);
        animate(group.scale, { x: 1, y: 1, z: 1, ease: "back.out(1.4)" });
      }
    });
    const slots = {
      left: [-4.2, 0, 3.65],
      right: [4.5, 0, 1],
      back: [-4.3, 0, -1.2],
    };
    const occupied = {};
    for (const [name, group] of Object.entries(decorationGroups)) {
      const slot = world.placements?.[name];
      const wasVisible = group.visible;
      group.visible =
        !!slots[slot] &&
        count >= { garden: 3, picnic: 8, observatory: 15 }[name];
      if (group.visible) {
        const offset = occupied[slot] ?? 0;
        group.position.set(...slots[slot]);
        group.position.z += offset * 0.8;
        group.position.x += offset * 0.2;
        group.scale.setScalar(0.85);
        if (!wasVisible && !firstWorld) {
          group.scale.setScalar(0.3);
          animate(group.scale, {
            x: 0.85,
            y: 0.85,
            z: 0.85,
            ease: "back.out(1.4)",
          });
        }
        occupied[slot] = offset + 1;
      }
    }
    fitWorldCamera();
    if (firstWorld && currentRoom === "home") {
      initializedView = false;
      setRoom("home");
    }
    render();
  }
  let disposed = false,
    opened = false,
    previousCompleted = new Set(),
    flightTween;
  const animations = new Set();
  const duration = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("a11y-stop-animations")
      ? 0
      : 0.5;
  const track = (tween) => {
    animations.add(tween);
    const finish = tween.eventCallback("onComplete");
    tween.eventCallback("onComplete", () => {
      animations.delete(tween);
      finish?.();
    });
    return tween;
  };
  const animate = (object, vars) =>
    track(
      gsap.to(object, {
        duration: duration(),
        ease: "power3.inOut",
        overwrite: true,
        onUpdate: render,
        ...vars,
      }),
    );
  const interruptFlight = () => {
    flightTween?.kill();
    onInteract();
  };
  controls.addEventListener("start", interruptFlight);
  function setOpen(value) {
    opened = value;
    roof.visible = true;
    animate(door.rotation, { y: value ? -1.8 : 0 });
    animate(roof.position, { y: value ? 7.6 : 5.03 });
    animate(roofMaterial, {
      opacity: value ? 0 : 1,
      onComplete: () => {
        roof.visible = !value;
        render();
      },
    });
  }
  function moveCamera(eye, target) {
    flightTween?.kill();
    if (!initializedView) {
      camera.position.set(...eye);
      controls.target.set(...target);
      controls.update();
      initializedView = true;
      render();
      return;
    }
    const flight = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      tx: controls.target.x,
      ty: controls.target.y,
      tz: controls.target.z,
    };
    flightTween = animate(flight, {
      x: eye[0],
      y: eye[1],
      z: eye[2],
      tx: target[0],
      ty: target[1],
      tz: target[2],
      onUpdate: () => {
        camera.position.set(flight.x, flight.y, flight.z);
        controls.target.set(flight.tx, flight.ty, flight.tz);
        controls.update();
        render();
      },
    });
  }
  function setRoom(id) {
    currentRoom = id;
    const view = positions[id] || positions.home;
    if (id !== "home" && !opened) setOpen(true);
    moveCamera(view.eye, view.target);
  }
  function zoomBy(factor) {
    flightTween?.kill();
    const offset = camera.position.clone().sub(controls.target);
    const distance = THREE.MathUtils.clamp(
      offset.length() * factor,
      3.5,
      worldMode ? 48 : 30,
    );
    camera.position.copy(controls.target).add(offset.setLength(distance));
    controls.update();
    onInteract();
    render();
  }
  function setNight(value) {
    animate(ambient, { intensity: value ? 0.55 : worldMode ? 1.8 : 2.5 });
    animate(sunlight, { intensity: value ? 0.38 : worldMode ? 2.8 : 4 });
    animate(fill, { intensity: value ? 0.75 : 1.4 });
    animate(
      sunlight.color,
      value ? { r: 0.54, g: 0.65, b: 1 } : { r: 1, g: 0.87, b: 0.71 },
    );
    animate(glass, { emissiveIntensity: value ? 1.2 : 0 });
    animate(bulbMaterial, { emissiveIntensity: value ? 3 : 0.12 });
    roomLights.forEach((light) =>
      animate(light, { intensity: value ? 10 : 0 }),
    );
  }
  function setExploded(value) {
    animate(upperFloor.position, {
      y: value ? 1.6 : 0,
      onUpdate: () => {
        explodedAmount = upperFloor.position.y;
        render();
      },
    });
    if (value) {
      setOpen(true);
      moveCamera([8.8, 8.6, 11.4], [0, 2.55, 0]);
    }
  }
  function setCompleted(ids, instant = false) {
    const done = new Set(ids);
    const transition = (object, vars) =>
      animate(object, { ...vars, duration: instant ? 0 : duration() });
    if (done.has("dishes") !== previousCompleted.has("dishes") || instant) {
      if (done.has("dishes") && !instant && duration()) {
        const timeline = gsap.timeline({ onUpdate: render });
        timeline
          .to(dishes.position, { y: 1.65, duration: 0.35, ease: "power2.out" })
          .to(dishes.position, {
            x: -1.4,
            y: 0.8,
            z: -1.4,
            duration: 0.85,
            ease: "power2.inOut",
          })
          .to(
            dishes.scale,
            { x: 0.01, y: 0.01, z: 0.01, duration: 0.2 },
            "-=0.2",
          );
        track(timeline);
      } else {
        gsap.killTweensOf(dishes.position);
        gsap.killTweensOf(dishes.scale);
        dishes.position.set(-2.05, 1.3, 0.85);
        dishes.scale.setScalar(done.has("dishes") ? 0.01 : 1);
      }
    }
    if (done.has("plants") !== previousCompleted.has("plants") || instant) {
      const grown = done.has("plants");
      transition(heroPlant.scale, {
        x: grown ? 1.18 : 1,
        y: grown ? 1.24 : 1,
        z: grown ? 1.18 : 1,
        ease: "back.out(1.6)",
      });
      if (grown && !instant && duration()) {
        water.visible = true;
        water.position.y = 0.3;
        animate(water.position, {
          y: -0.55,
          duration: 1,
          repeat: 1,
          ease: "power1.in",
          onComplete: () => {
            water.visible = false;
            render();
          },
        });
      } else water.visible = false;
    }
    if (done.has("laundry") !== previousCompleted.has("laundry") || instant) {
      const folded = done.has("laundry");
      laundry.forEach((cloth, i) => {
        transition(cloth.position, {
          x: folded ? 0.12 : 0.12 + (i - 1) * 0.12,
          z: folded ? 1.26 : 1.26 + i * 0.09,
          y: folded ? 3.32 + i * 0.095 : 3.35 + i * 0.095,
          delay: instant ? 0 : i * 0.12,
        });
        transition(cloth.rotation, {
          y: folded ? 0 : (i - 1) * 0.55,
          delay: instant ? 0 : i * 0.12,
        });
      });
    }
    previousCompleted = done;
    render();
  }
  function fitWorldCamera() {
    if (!worldMode) return;
    const ratio = host.clientWidth / Math.max(1, host.clientHeight);
    const distance = Math.max(1, 1.15 / ratio);
    positions.home.eye = [10 * distance, 10 * distance, 15 * distance];
    positions.home.target = [0, 1, 0];
  }
  const resize = () => {
    if (disposed || !host.clientWidth || !host.clientHeight) return;
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.fov = camera.aspect < 0.95 ? 44 : 37;
    camera.updateProjectionMatrix();
    fitWorldCamera();
    if (worldMode && currentRoom === "home") {
      flightTween?.kill();
      camera.position.set(...positions.home.eye);
      controls.target.set(...positions.home.target);
      controls.update();
    }
    render();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  return {
    zoomBy,
    resetView() {
      fitWorldCamera();
      setRoom("home");
    },
    setWorld,
    setPersonalRoom,
    setRoom,
    setOpen,
    setNight,
    setExploded,
    setCompleted,
    replayQuest(id) {
      const current = [...previousCompleted];
      if (!current.includes(id)) return;
      setCompleted(
        current.filter((quest) => quest !== id),
        true,
      );
      setCompleted(current);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      frames.dispose();
      observer.disconnect();
      animations.forEach((animation) => animation.kill());
      animations.clear();
      controls.removeEventListener("change", render);
      controls.removeEventListener("start", interruptFlight);
      controls.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
