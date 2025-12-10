const TITLE = document.getElementById("title");
TITLE.innerText = prompt("Enter the title you want: ")
// Initialize Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

// Initialize camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(20, 20, 20);
camera.lookAt(0, 0, 0);

// Initialize renderer using existing canvas in the HTML
const canvas = document.getElementById("gameCanvas");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// Add orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = true; // Enable panning with middle mouse button
controls.minDistance = 10;
controls.maxDistance = 300; // Allow zooming out further
controls.maxPolarAngle = Math.PI / 2.1; // Prevent going below ground
controls.autoRotate = false;

// Allow right-click rotate and middle mouse zoom by remapping mouse buttons
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.ROTATE,
};

controls.enableZoom = true;
controls.zoomSpeed = 1.2;
controls.panSpeed = 1.0;

// Game state
const gameState = {
  money: 10000,
  population: 0,
  happiness: 80,
  buildings: [],
  buildMode: null,
  selectedBuilding: null,
  gameTime: 0,
  lastTaxCollection: 0,
  lastHappinessUpdate: 0,
  lastPopulationUpdate: 0,
  weather: "sunny",
  lastWeatherChange: 0,
  upgrades: {
    taxCollection: 1,
    buildingEfficiency: 1,
    happinessBoost: 1,
    roads: 1,
    parks: 1,
    publicTransport: 0,
  },
  researchPoints: 0,
  researchUnlocked: {
    gasStation: false,
    house: false,
    skyscraper: false,
  },
  lastResearchUpdate: 0,
  cameraKeys: {
    w: false,
    a: false,
    s: false,
    d: false,
  },
  vehicles: [],
  people: []
};

// Building types
const buildingTypes = {
  residential: {
    cost: (level) => level * 1000, // Dynamic cost
    income: 50,
    color: 0x66ccff,
  },
  commercial: {
    cost: (level) => level * 2000, // Dynamic cost
    income: 100,
    color: 0xffcc66,
  },
  industrial: {
    cost: (level) => level * 3000, // Dynamic cost
    income: 200,
    color: 0xff6666,
  },
  road: {
    cost: (level) => 500, // Fixed cost for roads
    color: 0x444444,
  },
  park: {
    cost: (level) => 2000, // Fixed cost for parks
    color: 0x33aa33,
  },
  researchCenter: {
    cost: (level) => 3000,
    color: 0x7744ff,
  },
  gasStation: {
    cost: (level) => 1500,
    color: 0x4444aa,
  },
  house: {
    cost: (level) => 1200,
    income: 60,
    color: 0x77dd88,
  },
  skyscraper: {
    cost: (level) => 20000,
    income: 1000,
    color: 0x9999ff,
  },
  hospital: {
    cost: (level) => 8000,
    income: 0,
    color: 0xff9999,
  },
  police: {
    cost: (level) => 4000,
    income: 0,
    color: 0x999999,
  },
  school: {
    cost: (level) => 5000,
    income: 0,
    color: 0x99ccff,
  },
  stadium: {
    cost: (level) => 15000,
    income: 200,
    color: 0xffcc99,
  },
  mall: {
    cost: (level) => 12000,
    income: 300,
    color: 0xffdd66,
  },
  factory: {
    cost: (level) => 7000,
    income: 250,
    color: 0x996633,
  },
  powerPlant: {
    cost: (level) => 25000,
    income: 0,
    color: 0x3333aa,
  },
  airport: {
    cost: (level) => 40000,
    income: 1000,
    color: 0x66aaff,
  },
};
// Initialize game
init();
animate();

// Initialize game
function init() {
  // Show loading screen
  const loadingScreen = document.getElementById("loadingScreen");

  // Add event listeners
  window.addEventListener("resize", onWindowResize);
  // Attach click handler to renderer's canvas
  renderer.domElement.addEventListener("click", function (e) {
    onMouseClick(e);
  });

  // Add UI event listeners
  document
    .getElementById("buildResidential")
    .addEventListener("click", () => setBuildMode("residential"));
  document
    .getElementById("buildCommercial")
    .addEventListener("click", () => setBuildMode("commercial"));
  document
    .getElementById("buildIndustrial")
    .addEventListener("click", () => setBuildMode("industrial"));
  document
    .getElementById("buildRoad")
    .addEventListener("click", () => setBuildMode("road"));
  document
    .getElementById("buildPark")
    .addEventListener("click", () => setBuildMode("park"));
  document
    .getElementById("buildResearchCenter")
    .addEventListener("click", () => setBuildMode("researchCenter"));
  document
    .getElementById("buildGasStation")
    .addEventListener("click", () => setBuildMode("gasStation"));
  document
    .getElementById("buildHouse")
    .addEventListener("click", () => setBuildMode("house"));
  document
    .getElementById("buildSkyscraper")
    .addEventListener("click", () => setBuildMode("skyscraper"));
  document
    .getElementById("buildHospital")
    .addEventListener("click", () => setBuildMode("hospital"));
  document
    .getElementById("buildPolice")
    .addEventListener("click", () => setBuildMode("police"));
  document
    .getElementById("buildSchool")
    .addEventListener("click", () => setBuildMode("school"));
  document
    .getElementById("buildStadium")
    .addEventListener("click", () => setBuildMode("stadium"));
  document
    .getElementById("buildMall")
    .addEventListener("click", () => setBuildMode("mall"));
  document
    .getElementById("buildFactory")
    .addEventListener("click", () => setBuildMode("factory"));
  document
    .getElementById("buildPowerPlant")
    .addEventListener("click", () => setBuildMode("powerPlant"));
  document
    .getElementById("buildAirport")
    .addEventListener("click", () => setBuildMode("airport"));
  document
    .getElementById("cancelBuild")
    .addEventListener("click", cancelBuildMode);

  document
    .getElementById("upgradeTaxCollection")
    .addEventListener("click", () => upgradeCity("taxCollection"));
  document
    .getElementById("upgradeBuildingEfficiency")
    .addEventListener("click", () => upgradeCity("buildingEfficiency"));
  document
    .getElementById("upgradeHappinessBoost")
    .addEventListener("click", () => upgradeCity("happinessBoost"));
  document
    .getElementById("upgradeRoads")
    .addEventListener("click", () => upgradeCity("roads"));
  document
    .getElementById("upgradeParks")
    .addEventListener("click", () => upgradeCity("parks"));
  document
    .getElementById("upgradePublicTransport")
    .addEventListener("click", () => upgradeCity("publicTransport"));

  document
    .getElementById("upgradeBuildingButton")
    .addEventListener("click", upgradeSelectedBuilding);
  document
    .getElementById("closeBuildingInfo")
    .addEventListener("click", hideBuildingInfo);

  window.addEventListener("keydown", handleKeyPress);
  window.addEventListener("keyup", handleKeyUp);

  // Research panel actions
  const researchGasBtn = document.getElementById("researchUnlockGas");
  const researchHouseBtn = document.getElementById("researchUnlockHouse");
  const researchSkyscraperBtn = document.getElementById("researchUnlockSkyscraper");

  if (researchGasBtn) researchGasBtn.addEventListener("click", () => unlockResearch("gasStation", 50));
  if (researchHouseBtn) researchHouseBtn.addEventListener("click", () => unlockResearch("house", 30));
  if (researchSkyscraperBtn) researchSkyscraperBtn.addEventListener("click", () => unlockResearch("skyscraper", 200));
  
  // Research modal open/close
  const openResearchBtn = document.getElementById("openResearch");
  const researchModal = document.getElementById("researchModal");
  const closeResearchModal = document.getElementById("closeResearchModal");
  if (openResearchBtn) openResearchBtn.addEventListener("click", () => {
    populateResearchTree();
    if (researchModal) researchModal.style.display = 'block';
  });
  if (closeResearchModal) closeResearchModal.addEventListener("click", () => {
    if (researchModal) researchModal.style.display = 'none';
  });

  // Settings modal wiring
  const openSettingsBtn = document.getElementById('openSettings');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettings');
  const moveInput = document.getElementById('settingMoveSpeed');
  const rotateInput = document.getElementById('settingRotateSpeed');
  const zoomInput = document.getElementById('settingZoomSpeed');
  if (!gameState.settings) gameState.settings = { moveSpeed: 0.5, rotateSpeed: 0.02, zoomSpeed: 1.2 };
  // initialize inputs
  if (moveInput) moveInput.value = gameState.settings.moveSpeed;
  if (rotateInput) rotateInput.value = gameState.settings.rotateSpeed;
  if (zoomInput) zoomInput.value = gameState.settings.zoomSpeed;

  if (openSettingsBtn) openSettingsBtn.addEventListener('click', () => { if (settingsModal) settingsModal.style.display = 'block'; });
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => { if (settingsModal) settingsModal.style.display = 'none'; persistGameState(); });

  if (moveInput) moveInput.addEventListener('input', (e) => { gameState.settings.moveSpeed = parseFloat(e.target.value); persistGameState(); });
  if (rotateInput) rotateInput.addEventListener('input', (e) => { gameState.settings.rotateSpeed = parseFloat(e.target.value); persistGameState(); });
  if (zoomInput) zoomInput.addEventListener('input', (e) => { gameState.settings.zoomSpeed = parseFloat(e.target.value); controls.zoomSpeed = gameState.settings.zoomSpeed; persistGameState(); });

  // Buildings modal wiring
  const openBuildingsBtn = document.getElementById('openBuildings');
  const buildingModal = document.getElementById('buildingModal');
  const closeBuildingModal = document.getElementById('closeBuildingModal');
  if (openBuildingsBtn) openBuildingsBtn.addEventListener('click', () => { populateBuildingLists(); if (buildingModal) buildingModal.style.display = 'block'; });
  if (closeBuildingModal) closeBuildingModal.addEventListener('click', () => { if (buildingModal) buildingModal.style.display = 'none'; });

  // Enable horizontal scroll with mouse wheel on the build menu
  const buildMenuEl = document.getElementById('buildMenu');
  if (buildMenuEl) {
    buildMenuEl.style.pointerEvents = 'auto';
    buildMenuEl.addEventListener('wheel', (e) => {
      // Scroll horizontally
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        buildMenuEl.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
  }

  // Add lights
  addLights();

  // Add initial terrain
  addInitialTerrain();

  // Load saved settings/state
  loadGameState();

  // Update UI
  updateMoneyDisplay();
  updatePopulationDisplay();
  updateHappinessDisplay();
  updateUpgradeButtons();
  updateResearchDisplay();

  // Add metro station if public transport is upgraded
  if (gameState.upgrades.publicTransport > 0) {
    createMetroStation(0, 0, true); // Central station

    if (gameState.upgrades.publicTransport > 1) {
      createMetroStation(30, 30, false);
      createMetroStation(-30, -30, false);
    }

    if (gameState.upgrades.publicTransport > 2) {
      createMetroStation(30, -30, false);
      createMetroStation(-30, 30, false);

      // Add buses for level 3
      spawnBusOnRoad();
      spawnBusOnRoad();
    }
  }

  // Hide loading screen after a short delay to ensure everything is loaded
  setTimeout(() => {
    loadingScreen.style.opacity = 0;
    setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 500);
  }, 1500);
}

//handle key presses
function handleKeyPress(event) {
  // Cancel build mode when Escape key is pressed
  if (event.key === "Escape") {
    cancelBuildMode();
  }
  
  // Camera movement with WASD keys
  const key = event.key.toLowerCase();
  if (key === 'w') gameState.cameraKeys.w = true;
  if (key === 'a') gameState.cameraKeys.a = true;
  if (key === 's') gameState.cameraKeys.s = true;
  if (key === 'd') gameState.cameraKeys.d = true;
  // Arrow keys for rotation
  if (key === 'arrowleft') gameState.cameraRotate = gameState.cameraRotate || {}, gameState.cameraRotate.left = true;
  if (key === 'arrowright') gameState.cameraRotate = gameState.cameraRotate || {}, gameState.cameraRotate.right = true;
  if (key === 'arrowup') gameState.cameraRotate = gameState.cameraRotate || {}, gameState.cameraRotate.up = true;
  if (key === 'arrowdown') gameState.cameraRotate = gameState.cameraRotate || {}, gameState.cameraRotate.down = true;
}

//handle key releases
function handleKeyUp(event) {
  const key = event.key.toLowerCase();
  if (key === 'w') gameState.cameraKeys.w = false;
  if (key === 'a') gameState.cameraKeys.a = false;
  if (key === 's') gameState.cameraKeys.s = false;
  if (key === 'd') gameState.cameraKeys.d = false;
  if (key === 'arrowleft') gameState.cameraRotate = gameState.cameraRotate || {}, gameState.cameraRotate.left = false;
  if (key === 'arrowright') gameState.cameraRotate = gameState.cameraRotate || {}, gameState.cameraRotate.right = false;
  if (key === 'arrowup') gameState.cameraRotate = gameState.cameraRotate || {}, gameState.cameraRotate.up = false;
  if (key === 'arrowdown') gameState.cameraRotate = gameState.cameraRotate || {}, gameState.cameraRotate.down = false;
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update controls
  controls.update();

  // Handle WASD camera movement
  const cameraSpeed = gameState.settings?.moveSpeed || 0.5;
  if (gameState.cameraKeys.w) {
    controls.target.z -= cameraSpeed;
  }
  if (gameState.cameraKeys.s) {
    controls.target.z += cameraSpeed;
  }
  if (gameState.cameraKeys.a) {
    controls.target.x -= cameraSpeed;
  }
  if (gameState.cameraKeys.d) {
    controls.target.x += cameraSpeed;
  }

  // Handle arrow key camera rotation (use spherical math instead of OrbitControls helpers)
  const rotateSpeed = gameState.settings?.rotateSpeed || 0.02;
  if (gameState.cameraRotate && (gameState.cameraRotate.left || gameState.cameraRotate.right || gameState.cameraRotate.up || gameState.cameraRotate.down)) {
    // rotate camera around controls.target using spherical coordinates
    const offset = new THREE.Vector3();
    offset.copy(camera.position).sub(controls.target);

    const spherical = new THREE.Spherical();
    spherical.setFromVector3(offset);

    if (gameState.cameraRotate.left) spherical.theta += rotateSpeed;
    if (gameState.cameraRotate.right) spherical.theta -= rotateSpeed;
    if (gameState.cameraRotate.up) spherical.phi -= rotateSpeed;
    if (gameState.cameraRotate.down) spherical.phi += rotateSpeed;

    // limit phi
    const EPS = 0.000001;
    spherical.phi = Math.max(EPS, Math.min(Math.PI - EPS, spherical.phi));

    offset.setFromSpherical(spherical);
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
  }

  // Update game time
  gameState.gameTime += 1 / 30; // Assuming 30 FPS

  // Collect taxes every 60 seconds
  if (gameState.gameTime - gameState.lastTaxCollection >= 60) {
    collectTaxes();
    gameState.lastTaxCollection = gameState.gameTime;
  }

  // Update happiness every 30 seconds
  if (gameState.gameTime - gameState.lastHappinessUpdate >= 30) {
    updateHappiness();
    gameState.lastHappinessUpdate = gameState.gameTime;
  }

  // Update population every 45 seconds
  if (gameState.gameTime - gameState.lastPopulationUpdate >= 45) {
    updatePopulation();
    gameState.lastPopulationUpdate = gameState.gameTime;
  }

  // Update research every 30 seconds
  if (gameState.gameTime - gameState.lastResearchUpdate >= 30) {
    updateResearch();
    gameState.lastResearchUpdate = gameState.gameTime;
  }

  // Update day/night cycle
  updateDayNightCycle();

  // Update building animations
  updateBuildingAnimations();

  // Update traffic lights
  updateTrafficLights();

  // Update vehicles (cars on roads)
  updateVehicles();

  // Update people (pedestrians)
  updatePeople();

  // Render scene
  renderer.render(scene, camera);
}

// Update traffic lights
function updateTrafficLights() {
  scene.traverse((object) => {
    if (object._isTrafficLight) {
      const data = object.userData;
      data.timer = (data.timer || 0) + 1;

      // Change light every 90 frames (about 3 seconds)
      if (data.timer >= 90) {
        data.timer = 0;

        // Cycle through states: red -> green -> yellow -> red
        if (data.state === "red") data.state = "green";
        else if (data.state === "green") data.state = "yellow";
        else data.state = "red";
      }

      // Apply visual emissive intensity for each approach light
      if (Array.isArray(data.lights)) {
        for (const entry of data.lights) {
          if (data.state === 'red') {
            entry.red.emissiveIntensity = 0.8;
            entry.yellow.emissiveIntensity = 0.1;
            entry.green.emissiveIntensity = 0.05;
          } else if (data.state === 'green') {
            entry.red.emissiveIntensity = 0.05;
            entry.yellow.emissiveIntensity = 0.1;
            entry.green.emissiveIntensity = 0.8;
          } else {
            entry.red.emissiveIntensity = 0.05;
            entry.yellow.emissiveIntensity = 0.8;
            entry.green.emissiveIntensity = 0.05;
          }
        }
      }
    }

    // Update street lamps based on time of day
    if (object._isStreetLamp) {
      const data = object.userData;
      const timeOfDay = (gameState.gameTime % 300) / 300;

      // Turn on at night
      if (timeOfDay > 0.25 && timeOfDay < 0.75) {
        data.light.intensity = 1;
        data.bulbMaterial.emissiveIntensity = 1;
      } else {
        data.light.intensity = 0;
        data.bulbMaterial.emissiveIntensity = 0.1;
      }
    }
  });
}

// Create a bus
function createBus(route) {
  const busGroup = new THREE.Group();

  // Create main body - larger and more detailed
  const bodyGeometry = new THREE.BoxGeometry(2.2, 2.5, 5);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff6600,
    metalness: 0.3,
    roughness: 0.7
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 1.25;
  body.castShadow = true;
  busGroup.add(body);

  // Create roof
  const roofGeometry = new THREE.BoxGeometry(2.2, 0.3, 5);
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xff8800 });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = 2.65;
  roof.castShadow = true;
  busGroup.add(roof);

  // Create front bumper/grille
  const bumperGeometry = new THREE.BoxGeometry(2.2, 0.4, 0.3);
  const bumperMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const bumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
  bumper.position.set(0, 0.5, 2.65);
  busGroup.add(bumper);

  // Create headlights
  const lightGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
  const lightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffff99,
    emissive: 0xffff00,
    emissiveIntensity: 0.6
  });
  const leftHeadlight = new THREE.Mesh(lightGeometry, lightMaterial);
  leftHeadlight.position.set(-0.6, 1.2, 2.7);
  leftHeadlight.rotation.x = Math.PI / 2;
  busGroup.add(leftHeadlight);
  
  const rightHeadlight = new THREE.Mesh(lightGeometry, lightMaterial);
  rightHeadlight.position.set(0.6, 1.2, 2.7);
  rightHeadlight.rotation.x = Math.PI / 2;
  busGroup.add(rightHeadlight);

  // Create wheels - improved
  const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.25, 32);
  const wheelMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x222222,
    metalness: 0.8,
    roughness: 0.3
  });
  const rimMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x666666,
    metalness: 0.9,
    roughness: 0.2
  });

  const wheelPositions = [
    [-0.9, 0.4, -1.2],
    [0.9, 0.4, -1.2],
    [-0.9, 0.4, 1.2],
    [0.9, 0.4, 1.2],
  ];

  wheelPositions.forEach((pos) => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(pos[0], pos[1], pos[2]);
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    busGroup.add(wheel);
    
    // Add rim
    const rimGeometry = new THREE.TorusGeometry(0.35, 0.08, 8, 16);
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(pos[0], pos[1], pos[2]);
    rim.rotation.y = Math.PI / 2;
    busGroup.add(rim);
  });

  // Create windows - better positioned
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x4488dd,
    transparent: true,
    opacity: 0.6,
    metalness: 0.1,
    roughness: 0.2
  });

  // Front window
  const frontWindowGeometry = new THREE.PlaneGeometry(1.8, 1.2);
  const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
  frontWindow.position.set(0, 1.5, 2.4);
  busGroup.add(frontWindow);

  // Side windows - multiple for better look
  const sideWindowGeometry = new THREE.PlaneGeometry(1.5, 1);
  
  // Left side windows
  for (let i = 0; i < 2; i++) {
    const window = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    window.position.set(-1.11, 1.5, -0.5 + i * 1.5);
    window.rotation.y = Math.PI / 2;
    busGroup.add(window);
  }
  
  // Right side windows
  for (let i = 0; i < 2; i++) {
    const window = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    window.position.set(1.11, 1.5, -0.5 + i * 1.5);
    window.rotation.y = -Math.PI / 2;
    busGroup.add(window);
  }

  // Back window
  const backWindowGeometry = new THREE.PlaneGeometry(1.8, 1.2);
  const backWindow = new THREE.Mesh(backWindowGeometry, windowMaterial);
  backWindow.position.set(0, 1.5, -2.4);
  backWindow.rotation.y = Math.PI;
  busGroup.add(backWindow);

  // Door
  const doorGeometry = new THREE.PlaneGeometry(0.8, 1.8);
  const doorMaterial = new THREE.MeshStandardMaterial({ color: 0xcc5500 });
  const door = new THREE.Mesh(doorGeometry, doorMaterial);
  door.position.set(-1.11, 1.4, 0.8);
  door.rotation.y = Math.PI / 2;
  busGroup.add(door);

  // Door handle
  const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8);
  const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.set(-1.12, 1.4, 0.8);
  handle.rotation.z = Math.PI / 2;
  busGroup.add(handle);

  // Set initial position based on route
  if (route === "eastWest") {
    busGroup.position.set(-50, 0, 0);
    busGroup.rotation.y = Math.PI / 2;
  } else {
    busGroup.position.set(0, 0, -50);
  }

  // Store bus data
  busGroup.userData = {
    route: route,
    speed: 0.2,
    atStop: false,
    stopDuration: 0,
  };

  scene.add(busGroup);
}

// Vehicle system: cars follow roads with linear interpolation and stop at gas stations

function getRoadNetwork() {
  const roads = [];
  scene.traverse((obj) => {
    if (obj && obj._isRoad) roads.push({ pos: obj.position.clone(), obj });
  });
  return roads;
}

function buildRoadPath(startRoad) {
  // Walk the road network from startRoad and return an ordered sequence of road nodes.
  const path = [];
  const roads = getRoadNetwork();
  if (!startRoad) return path;

  let current = startRoad;
  let prev = null;
  const MAXLEN = 20;
  while (current && path.length < MAXLEN) {
    path.push(current);

    // find cardinal neighbors of current
    const neighbors = [];
    roads.forEach((r) => {
      if (r.obj === current) return;
      const dx = r.pos.x - current.position.x;
      const dz = r.pos.z - current.position.z;
      const EPS = 0.2;
      // cardinal neighbors are ~6 units away on grid
      if (Math.abs(dx) < EPS && Math.abs(Math.abs(dz) - 6) < 0.5) neighbors.push(r.obj);
      if (Math.abs(dz) < EPS && Math.abs(Math.abs(dx) - 6) < 0.5) neighbors.push(r.obj);
    });

    // remove the previous node so we don't go backward unless forced
    const choices = neighbors.filter(n => n !== prev);
    if (choices.length === 0) break;

    // pick the neighbor that continues straight if possible
    let next = choices[Math.floor(Math.random() * choices.length)];
    if (prev) {
      const vPrev = new THREE.Vector3(current.position.x - prev.position.x, 0, current.position.z - prev.position.z).normalize();
      let bestDot = -Infinity;
      choices.forEach(c => {
        const vCur = new THREE.Vector3(c.position.x - current.position.x, 0, c.position.z - current.position.z).normalize();
        const dot = vPrev.dot(vCur);
        if (dot > bestDot) { bestDot = dot; next = c; }
      });
    }

    prev = current;
    current = next;
  }
  return path;
}

// Determine turn type: 0 = straight, 1 = right, 2 = left
function getTurnType(prevNode, curNode, nextNode) {
  if (!prevNode || !curNode || !nextNode) return 0;
  const v1 = new THREE.Vector3(curNode.position.x - prevNode.position.x, 0, curNode.position.z - prevNode.position.z).normalize();
  const v2 = new THREE.Vector3(nextNode.position.x - curNode.position.x, 0, nextNode.position.z - curNode.position.z).normalize();
  const angle = Math.atan2(v2.x * v1.z - v2.z * v1.x, v1.x * v2.x + v1.z * v2.z); // signed angle from v1 to v2
  const absA = Math.abs(angle);
  if (absA < 0.4) return 0; // straight
  return angle < 0 ? 1 : 2; // right if negative, left if positive
}

function tryReserveIntersectionForCar(car, fromNode, intersectionNode, turnType) {
  if (!intersectionNode || !intersectionNode.userData || !intersectionNode.userData.intersection) return true;
  const inter = intersectionNode.userData.intersection;
  const capacity = 2; // how many vehicles can occupy intersection simultaneously

  // If already reserved, allow
  if (car.userData.intersectionReserved === intersectionNode) return true;

  // If there is space and no higher-priority waiting car, grant reservation
  // compute if any waiting car has higher priority (lower numeric value)
  const hasHigherWaiting = inter.waiting.some(w => w.turnPriority < turnType && w.car !== car);
  if (inter.occupants.length < capacity && !hasHigherWaiting) {
    inter.occupants.push(car);
    car.userData.intersectionReserved = intersectionNode;
    // remove from waiting list if present
    inter.waiting = inter.waiting.filter(w => w.car !== car);
    if (car.userData) car.userData.waitTimer = 0;
    return true;
  }

  // Otherwise add to waiting list (if not already present)
  if (!inter.waiting.some(w => w.car === car)) {
    inter.waiting.push({ car: car, turnPriority: turnType, ts: Date.now() });
  }
  return false;
}

function releaseIntersectionForCar(car, intersectionNode) {
  if (!intersectionNode || !intersectionNode.userData || !intersectionNode.userData.intersection) return;
  const inter = intersectionNode.userData.intersection;
  const idx = inter.occupants.indexOf(car);
  if (idx >= 0) inter.occupants.splice(idx, 1);

  // Try to admit next waiting car(s) based on priority and capacity
  if (inter.waiting.length > 0) {
    // sort waiting by priority then FIFO
    inter.waiting.sort((a, b) => (a.turnPriority - b.turnPriority) || (a.ts - b.ts));
    while (inter.occupants.length < 2 && inter.waiting.length > 0) {
      const next = inter.waiting.shift();
      if (next && next.car) {
        inter.occupants.push(next.car);
        next.car.userData.intersectionReserved = intersectionNode;
        if (next.car.userData) next.car.userData.waitTimer = 0;
      }
    }
  }
}

function findNearestGasStation(pos) {
  let nearest = null;
  let minDist = Infinity;
  scene.traverse((obj) => {
    if (obj.userData && obj.userData.type === 'gasStation') {
      const d = Math.hypot(obj.userData.x - pos.x, obj.userData.z - pos.z);
      if (d < minDist && d < 12) {
        minDist = d;
        nearest = obj;
      }
    }
  });
  return nearest;
}

function spawnCarOnRoad() {
  const roads = getRoadNetwork();
  if (roads.length === 0) return null;

  // Try multiple random start roads to find a multi-node path
  let path = [];
  const shuffled = roads.slice();
  for (let attempt = 0; attempt < shuffled.length; attempt++) {
    const idx = Math.floor(Math.random() * shuffled.length);
    const startRoad = shuffled[idx].obj;
    path = buildRoadPath(startRoad);
    if (path.length >= 2) break;
    // remove tried element to avoid infinite loop
    shuffled.splice(idx, 1);
    if (shuffled.length === 0) break;
  }
  if (!path || path.length < 2) return null;
  
  const car = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.5, 1.5),
    new THREE.MeshStandardMaterial({ color: Math.random() < 0.5 ? 0x2222ff : 0xff2222 })
  );
  body.position.y = 0.25;
  body.castShadow = true;
  car.add(body);
  
  // Add simple wheels
  const wheelGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  [-0.3, 0.3].forEach(x => {
    [-0.4, 0.4].forEach(z => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.15, z);
      car.add(wheel);
    });
  });
  
  car.position.set(path[0].position.x, 0.1, path[0].position.z);
  car.castShadow = true;
  // assign lane side (-1 or +1) so cars pick a lane and keep it
  const laneSide = Math.random() < 0.5 ? -1 : 1;
  car.userData = {
    speed: 0.15 + Math.random() * 0.15,
    path: path,
    pathIndex: 0,
    progress: 0,
    waitTimer: 0,
    spawnTime: gameState.gameTime,
    rotationVelocity: 0,
    laneSide: laneSide
  };
  // add to start node queue
  if (!path[0].userData) path[0].userData = {};
  path[0].userData.queue = path[0].userData.queue || [];
  path[0].userData.queue.push(car);
  scene.add(car);
  return car;
}

function updateVehicles() {
  if (!gameState.vehicles) gameState.vehicles = [];
  
  const MAX_VEHICLES = 6;
  const DESPAWN_LIFETIME = 180;
  
  // Spawn occasional cars
  if ((gameState.gameTime % 45) < 0.05 && gameState.vehicles.length < MAX_VEHICLES) {
    const car = spawnCarOnRoad();
    if (car) gameState.vehicles.push(car);
  }
  
  // Update vehicles
  for (let i = gameState.vehicles.length - 1; i >= 0; i--) {
    const car = gameState.vehicles[i];
    if (!car.userData) {
      gameState.vehicles.splice(i, 1);
      scene.remove(car);
      continue;
    }
    
    // Despawn old vehicles
    if (gameState.gameTime - car.userData.spawnTime > DESPAWN_LIFETIME) {
      gameState.vehicles.splice(i, 1);
      scene.remove(car);
      continue;
    }
    
    // Wait at gas station
    if (car.userData.waitTimer > 0) {
      car.userData.waitTimer--;
      continue;
    }
    
    const path = car.userData.path;
    let idx = car.userData.pathIndex;
    if (!path || idx >= path.length - 1) {
      const newPath = buildRoadPath(path?.[path.length - 1] || getRoadNetwork()[0]?.obj);
      if (newPath.length >= 2) {
        car.userData.path = newPath;
        car.userData.pathIndex = 0;
        car.userData.progress = 0;
      } else {
        gameState.vehicles.splice(i, 1);
        scene.remove(car);
        continue;
      }
      idx = 0;
    }
    
    const currentNode = path[idx];
    const nextNode = path[idx + 1];
    // compute lane offset per segment axis
    const LANE_OFFSET = 0.6;
    const dxSeg = nextNode.position.x - currentNode.position.x;
    const dzSeg = nextNode.position.z - currentNode.position.z;
    const isEW = Math.abs(dxSeg) > Math.abs(dzSeg);
    const laneSide = car.userData.laneSide || 1;
    const startPos = new THREE.Vector3(currentNode.position.x, 0.1, currentNode.position.z);
    const endPos = new THREE.Vector3(nextNode.position.x, 0.1, nextNode.position.z);
    if (isEW) {
      startPos.z += laneSide * LANE_OFFSET;
      endPos.z += laneSide * LANE_OFFSET;
    } else {
      startPos.x += laneSide * LANE_OFFSET;
      endPos.x += laneSide * LANE_OFFSET;
    }
    const distance = startPos.distanceTo(endPos);
    
    // intersection reservation / queuing logic
    if (car.userData.progress > 0.65) {
      // approaching decision point — try to reserve intersection if next is an intersection
      if (nextNode.userData && nextNode.userData.isIntersection) {
        const prevNode = idx > 0 ? path[idx - 1] : currentNode;
        const turnType = getTurnType(prevNode, currentNode, nextNode);
        const reserved = tryReserveIntersectionForCar(car, currentNode, nextNode, turnType);
        if (!reserved) {
          car.userData.waitTimer = 6;
          continue;
        }
      } else {
        // non-intersection congestion: simple per-node capacity
        const queueAtNext = nextNode.userData && Array.isArray(nextNode.userData.queue) ? nextNode.userData.queue.length : 0;
        const MAX_PER_NODE = 2;
        if (queueAtNext >= MAX_PER_NODE) {
          car.userData.waitTimer = 6;
          continue;
        }
      }
    }

    car.userData.progress += car.userData.speed / distance;
    
    if (car.userData.progress >= 1.0) {
      // leaving currentNode -> remove from its queue
      if (currentNode.userData && Array.isArray(currentNode.userData.queue)) {
        const idxq = currentNode.userData.queue.indexOf(car);
        if (idxq >= 0) currentNode.userData.queue.splice(idxq, 1);
      }

      // if we are leaving an intersection, release our reservation there
      if (currentNode.userData && currentNode.userData.isIntersection) {
        releaseIntersectionForCar(car, currentNode);
        if (car.userData && car.userData.intersectionReserved === currentNode) delete car.userData.intersectionReserved;
      }

      car.userData.pathIndex++;
      car.userData.progress = 0;

      const arrivedNode = nextNode;
      arrivedNode.userData = arrivedNode.userData || {};
      arrivedNode.userData.queue = arrivedNode.userData.queue || [];
      arrivedNode.userData.queue.push(car);

      // If we arrived into an intersection and we had a reservation, ensure we are tracked
      if (arrivedNode.userData.isIntersection && arrivedNode.userData.intersection) {
        const inter = arrivedNode.userData.intersection;
        if (!inter.occupants.includes(car) && car.userData && car.userData.intersectionReserved === arrivedNode) {
          inter.occupants.push(car);
        }
      }

      // Check for gas station at this road node
      const gasStation = findNearestGasStation(new THREE.Vector3(arrivedNode.position.x, 0, arrivedNode.position.z));
      if (gasStation && Math.random() < 0.4) {
        car.userData.waitTimer = 60 + Math.floor(Math.random() * 80);
      }
    } else {
      // Linear interpolation along current segment
      car.position.lerpVectors(startPos, endPos, car.userData.progress);
      
      // Smooth turning animation and stop for traffic lights
      const targetDir = new THREE.Vector3().subVectors(endPos, startPos).normalize();
      const dx = endPos.x - startPos.x;
      const dz = endPos.z - startPos.z;
      const angle = Math.atan2(dx, dz); // rotation around Y axis
      const currentAngle = car.rotation.y;

      // Stop at traffic lights if present near the end of this segment
      let stopForLight = false;
      scene.traverse((obj) => {
        if (obj._isTrafficLight) {
          const lightPos = obj.position;
          const dToLight = Math.hypot(lightPos.x - endPos.x, lightPos.z - endPos.z);
          if (dToLight < 3) {
            const state = obj.userData.state || 'green';
            if (state === 'red' || state === 'yellow') stopForLight = true;
          }
        }
      });
      if (stopForLight) {
        car.userData.waitTimer = 30; // wait until light cycles
        continue;
      }
      
      let diff = angle - currentAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      car.userData.rotationVelocity += diff * 0.1;
      car.userData.rotationVelocity *= 0.85;
      car.rotation.y += car.userData.rotationVelocity;
    }
  }
}

// Buses spawning (public transport) reuse road paths but are larger/slower
function spawnBusOnRoad() {
  const roads = getRoadNetwork();
  if (roads.length === 0) return null;
  const startRoad = roads[Math.floor(Math.random() * roads.length)].obj;
  const path = buildRoadPath(startRoad);
  if (path.length < 2) return null;
  const bus = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 4), new THREE.MeshStandardMaterial({ color: 0xff8800 }));
  body.position.y = 0.6;
  bus.add(body);
  bus.position.set(path[0].position.x, 0.1, path[0].position.z);
  const laneSide = Math.random() < 0.5 ? -1 : 1;
  bus.userData = {
    speed: 0.08,
    path: path,
    pathIndex: 0,
    progress: 0,
    waitTimer: 0,
    spawnTime: gameState.gameTime,
    rotationVelocity: 0,
    laneSide: laneSide
  };
  // add to start node queue
  if (!path[0].userData) path[0].userData = {};
  path[0].userData.queue = path[0].userData.queue || [];
  path[0].userData.queue.push(bus);
  scene.add(bus);
  gameState.vehicles.push(bus);
  return bus;
}

// --- Pedestrian system ---
function spawnPersonAtBuilding(buildingObj) {
  const person = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffddaa })
  );
  const x = buildingObj.position.x + (Math.random() - 0.5) * 4;
  const z = buildingObj.position.z + (Math.random() - 0.5) * 4;
  person.position.set(x, 0.2, z);
  person.userData = {
    homeX: buildingObj.position.x,
    homeZ: buildingObj.position.z,
    target: null,
    speed: 0.02 + Math.random() * 0.03,
    wanderRadius: 4 + Math.random() * 6,
    lifespan: gameState.gameTime
  };
  scene.add(person);
  gameState.people.push(person);
  return person;
}

function updatePeople() {
  if (!gameState.people) gameState.people = [];
  // spawn a few people near residential buildings if under cap
  const MAX_PEOPLE = 40;
  if (gameState.people.length < MAX_PEOPLE && Math.random() < 0.02) {
    // pick a residential building
    const res = [];
    scene.traverse((obj) => { if (obj.userData && (obj.userData.type === 'residential' || obj.userData.type === 'house')) res.push(obj); });
    if (res.length > 0) spawnPersonAtBuilding(res[Math.floor(Math.random() * res.length)]);
  }

  for (let i = gameState.people.length -1; i >=0; i--) {
    const p = gameState.people[i];
    if (!p.userData) { gameState.people.splice(i,1); scene.remove(p); continue; }
    // choose new target occasionally
    if (!p.userData.target || Math.random() < 0.01) {
      const angle = Math.random() * Math.PI * 2;
      const r = p.userData.wanderRadius;
      const tx = p.userData.homeX + Math.cos(angle) * r;
      const tz = p.userData.homeZ + Math.sin(angle) * r;
      p.userData.target = new THREE.Vector3(tx, 0.2, tz);
    }
    // move toward target
    const tgt = p.userData.target;
    const dir = new THREE.Vector3().subVectors(tgt, p.position);
    const dist = dir.length();
    if (dist < 0.2) {
      if (Math.random() < 0.02) p.userData.target = null; // pick new point later
      continue;
    }
    dir.normalize();
    p.position.add(dir.multiplyScalar(p.userData.speed));
    // simple despawn if very far or old
    if (gameState.gameTime - p.userData.lifespan > 600) { scene.remove(p); gameState.people.splice(i,1); }
  }
}

// Create a building
function createBuilding(x, z, type) {
  const buildingGroup = new THREE.Group();
  buildingGroup.position.set(x, 0, z);
  buildingGroup.userData = {
    type: type,
    level: 1,
    income: Number(buildingTypes[type].income) || 0,
    isBuilding: true,
  };

  // Store coordinates in building data for distance checks (important for parks/roads/transport)
  buildingGroup.userData.x = x;
  buildingGroup.userData.z = z;

  // Create base
  const height = type === "industrial" ? 3 : type === "commercial" ? 5 : 4;
  const baseGeometry = new THREE.BoxGeometry(5, height, 5);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: buildingTypes[type].color,
    roughness: 0.7,
  });

  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = height / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  base.isBase = true;
  buildingGroup.add(base);

  // Create windows
  const windowGeometry = new THREE.PlaneGeometry(0.5, 0.5);
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0.9,
  });

  // Store window material for day/night cycle
  buildingGroup.userData.windowMaterial = windowMaterial;

  // Add windows to each side
  for (let side = 0; side < 4; side++) {
    const direction = (side * Math.PI) / 2;

    for (let floor = 0; floor < height - 1; floor++) {
      for (let i = 0; i < 3; i++) {
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(
          Math.sin(direction) * 2.51,
          floor + 0.5,
          Math.cos(direction) * 2.51
        );
        window.rotation.y = direction;
        buildingGroup.add(window);
      }
    }
  }

  // Add type-specific details
  if (type === "residential") {
    // Add door
    const doorGeometry = new THREE.PlaneGeometry(0.8, 1.5);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0.75, 2.51);
    buildingGroup.add(door);

    // Add roof
    const roofGeometry = new THREE.ConeGeometry(3.5, 2, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x994433 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = height + 1;
    roof.rotation.y = Math.PI / 4;
    buildingGroup.add(roof);
  } else if (type === "commercial") {
    // Add sign
    const signGeometry = new THREE.BoxGeometry(3, 0.8, 0.2);
    const signMaterial = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      emissive: 0x00aaff,
      emissiveIntensity: 0.5,
    });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, height - 1, 2.6);
    buildingGroup.add(sign);

    // Add entrance
    const entranceGeometry = new THREE.BoxGeometry(2, 2, 0.1);
    const entranceMaterial = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.7,
    });
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(0, 1, 2.55);
    buildingGroup.add(entrance);
  } else if (type === "industrial") {
    // Add smokestack
    const stackGeometry = new THREE.CylinderGeometry(0.5, 0.7, 3, 8);
    const stackMaterial = new THREE.MeshStandardMaterial({ color: 0x993333 });
    const stack = new THREE.Mesh(stackGeometry, stackMaterial);
    stack.position.set(1.5, height + 1.5, 1.5);
    buildingGroup.add(stack);

    // Add warehouse door
    const doorGeometry = new THREE.PlaneGeometry(2, 2);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1, 2.51);
    buildingGroup.add(door);
  }

  else if (type === "researchCenter") {
    // Simple research center look
    const labGeometry = new THREE.BoxGeometry(6, 2, 6);
    const labMaterial = new THREE.MeshStandardMaterial({ color: buildingTypes.researchCenter.color });
    const lab = new THREE.Mesh(labGeometry, labMaterial);
    lab.position.y = 1;
    buildingGroup.add(lab);

    // Antenna
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(2, 2.5, 0);
    buildingGroup.add(pole);

    buildingGroup.userData.isResearchCenter = true;
  } else if (type === "gasStation") {
    // Gas station base and store
    const gsBase = new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 6), new THREE.MeshStandardMaterial({ color: buildingTypes.gasStation.color }));
    gsBase.position.y = 0.4;
    buildingGroup.add(gsBase);

    // Canopy / cover
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.4, 3.6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    canopy.position.set(0, 1.6, -0.2);
    buildingGroup.add(canopy);

    // Canopy supports
    for (let i = 0; i < 4; i++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0x999999 }));
      col.position.set(i < 2 ? -2.8 : 2.8, 0.8, i % 2 === 0 ? -1 : 1);
      buildingGroup.add(col);
    }

    // Pumps under canopy
    for (let i = 0; i < 2; i++) {
      const pump = new THREE.Group();
      pump.position.set((i - 0.5) * 2, 0.6, 0);
      const pumpPole = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), new THREE.MeshStandardMaterial({ color: 0xff6600 }));
      pumpPole.position.y = 0.4;
      pump.add(pumpPole);
      const pumpTop = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0xffaa00 }));
      pumpTop.position.y = 0.9;
      pump.add(pumpTop);
      buildingGroup.add(pump);
    }

    // Small convenience store at the back
    const store = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 2.6), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    store.position.set(0, 0.8, 2);
    buildingGroup.add(store);

    buildingGroup.userData.isGasStation = true;
  } else if (type === "house") {
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3, 1.5, 4), new THREE.MeshStandardMaterial({ color: buildingTypes.house.color }));
    roof.position.y = 2.5;
    buildingGroup.add(roof);
  } else if (type === "skyscraper") {
    const skGeo = new THREE.BoxGeometry(6, 20, 6);
    const skMat = new THREE.MeshStandardMaterial({ color: buildingTypes.skyscraper.color });
    const sk = new THREE.Mesh(skGeo, skMat);
    sk.position.y = 10;
    buildingGroup.add(sk);
    buildingGroup.userData.level = 1;
    buildingGroup.userData.income = buildingTypes.skyscraper.income;
  } else if (type === 'hospital') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 6), new THREE.MeshStandardMaterial({ color: buildingTypes.hospital.color }));
    base.position.y = 1.5;
    buildingGroup.add(base);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
    cross.position.set(0, 2.2, 0);
    buildingGroup.add(cross);
    buildingGroup.userData.income = buildingTypes.hospital.income;
  } else if (type === 'police') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(5, 2.5, 5), new THREE.MeshStandardMaterial({ color: buildingTypes.police.color }));
    base.position.y = 1.25;
    buildingGroup.add(base);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.5), new THREE.MeshStandardMaterial({ color: 0x2222ff }));
    flag.position.set(2, 2, 0);
    buildingGroup.add(flag);
    buildingGroup.userData.income = buildingTypes.police.income;
  } else if (type === 'school') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 5), new THREE.MeshStandardMaterial({ color: buildingTypes.school.color }));
    base.position.y = 1;
    buildingGroup.add(base);
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0xffff00 }));
    bell.position.set(0, 2, 0);
    buildingGroup.add(bell);
    buildingGroup.userData.income = buildingTypes.school.income;
  } else if (type === 'stadium') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 8), new THREE.MeshStandardMaterial({ color: buildingTypes.stadium.color }));
    base.position.y = 1;
    buildingGroup.add(base);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    roof.position.y = 2;
    buildingGroup.add(roof);
    buildingGroup.userData.income = buildingTypes.stadium.income;
  } else if (type === 'mall') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 7), new THREE.MeshStandardMaterial({ color: buildingTypes.mall.color }));
    base.position.y = 1.5;
    buildingGroup.add(base);
    buildingGroup.userData.income = buildingTypes.mall.income;
  } else if (type === 'factory') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 6), new THREE.MeshStandardMaterial({ color: buildingTypes.factory.color }));
    base.position.y = 1.5;
    buildingGroup.add(base);
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 3, 8), new THREE.MeshStandardMaterial({ color: 0x553322 }));
    stack.position.set(1.5, 3, 1.5);
    buildingGroup.add(stack);
    buildingGroup.userData.income = buildingTypes.factory.income;
  } else if (type === 'powerPlant') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 8), new THREE.MeshStandardMaterial({ color: buildingTypes.powerPlant.color }));
    base.position.y = 1.5;
    buildingGroup.add(base);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1, 6, 8), new THREE.MeshStandardMaterial({ color: 0x666666 }));
    tower.position.set(2, 4, 0);
    buildingGroup.add(tower);
    buildingGroup.userData.income = buildingTypes.powerPlant.income;
  } else if (type === 'airport') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 12), new THREE.MeshStandardMaterial({ color: buildingTypes.airport.color }));
    base.position.y = 1;
    buildingGroup.add(base);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 1), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    tower.position.set(4, 4, 4);
    buildingGroup.add(tower);
    buildingGroup.userData.income = buildingTypes.airport.income;
  }

  scene.add(buildingGroup);

  // Add building to game state
  gameState.buildings.push(buildingGroup.userData);

  return buildingGroup;
}
// Update building income based on surroundings and level
function updateBuildingIncome(buildingData) {
  const baseIncome = Number(buildingTypes[buildingData.type].income) || 0;
  const level = buildingData.level || 1;

  // Level multiplier
  let income = baseIncome * level;

  // Apply building efficiency upgrade
  income *= 1 + (gameState.upgrades.buildingEfficiency - 1) * 0.2;

  // Check for nearby roads (connectivity bonus)
  let hasRoadNearby = false;
  scene.traverse((object) => {
    if (object._isRoad) {
      const distance = Math.sqrt(
        Math.pow(object.position.x - buildingData.x, 2) +
          Math.pow(object.position.z - buildingData.z, 2)
      );

      if (distance < 10) {
        hasRoadNearby = true;
      }
    }
  });

  if (hasRoadNearby) {
    income *= 1.2; // 20% bonus for road connectivity
  }

  // Check for nearby parks (residential and commercial bonus)
  if (
    buildingData.type === "residential" ||
    buildingData.type === "commercial"
  ) {
    let parkBonus = 0;
    scene.traverse((object) => {
      if (object._isPark) {
        const distance = Math.sqrt(
          Math.pow(object.position.x - buildingData.x, 2) +
            Math.pow(object.position.z - buildingData.z, 2)
        );

        if (distance < 20) {
          parkBonus += 0.05; // 5% bonus per nearby park
        }
      }
    });

    income *= 1 + Math.min(0.3, parkBonus); // Cap at 30% bonus
  }

  // Check for public transport (all buildings bonus)
  if (gameState.upgrades.publicTransport > 0) {
    let transportBonus = 0;

    // Check for metro stations
    scene.traverse((object) => {
      if (object._isMetroStation) {
        const distance = Math.sqrt(
          Math.pow(object.position.x - buildingData.x, 2) +
            Math.pow(object.position.z - buildingData.z, 2)
        );

        if (distance < 30) {
          transportBonus += 0.1; // 10% bonus per nearby station
        }
      }
    });

    income *= 1 + Math.min(0.3, transportBonus); // Cap at 30% bonus
  }

  // Round to whole number
  buildingData.income = Math.round(income);
}

// Create a metro station
function createMetroStation(x, z, isCentral = false) {
  const stationGroup = new THREE.Group();
  stationGroup.position.set(x, 0, z);
  stationGroup._isMetroStation = true;
  stationGroup.userData = stationGroup.userData || {};
  stationGroup.userData.x = x;
  stationGroup.userData.z = z;

  // Create station base
  const baseGeometry = new THREE.BoxGeometry(8, 1, 8);
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 0.5;
  stationGroup.add(base);

  // Create entrance
  const entranceGeometry = new THREE.BoxGeometry(4, 2, 4);
  const entranceMaterial = new THREE.MeshStandardMaterial({ color: 0x3366cc });
  const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
  entrance.position.y = 2;
  stationGroup.add(entrance);

  // Create roof
  const roofGeometry = new THREE.BoxGeometry(5, 0.5, 5);
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = 3.25;
  stationGroup.add(roof);

  // Create sign
  const signGeometry = new THREE.BoxGeometry(3, 1, 0.2);
  const signMaterial = new THREE.MeshStandardMaterial({
    color: 0x0033aa,
    emissive: 0x0033aa,
    emissiveIntensity: 0.5,
  });
  const sign = new THREE.Mesh(signGeometry, signMaterial);
  sign.position.set(0, 4, 0);
  stationGroup.add(sign);

  // Add "M" letter
  if (isCentral) {
    // Add central station details
    const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
    const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(Math.sin(angle) * 3, 3, Math.cos(angle) * 3);
      stationGroup.add(pillar);
    }

    const domeMaterial = new THREE.MeshStandardMaterial({
      color: 0x3366cc,
      transparent: true,
      opacity: 0.7,
    });
    const domeGeometry = new THREE.SphereGeometry(
      5,
      16,
      12,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 6;
    stationGroup.add(dome);
  }

  scene.add(stationGroup);
  return stationGroup;
}

// Set build mode
function setBuildMode(mode) {
  // Set the build mode in game state
  gameState.buildMode = mode;

  // Update UI to show active build button
  const buildButtons = document.querySelectorAll(".build-button");
  buildButtons.forEach((button) => {
    button.classList.remove("active");
  });

  // Add active class to the selected build button
  if (mode) {
    const button = document.getElementById(
      `build${mode.charAt(0).toUpperCase() + mode.slice(1)}`
    );
    button.classList.add("active");
    showNotification(`Click on the map to place a ${mode} building`);
    showPlacementIndicator(mode);
    updateBuildButtonText(mode, 1); // Show initial cost
  }
}

function updateBuildButtonText(type, level) {
  const cost = buildingTypes[type].cost(level);
  const buttonId = type === 'road' ? 'buildRoad' : type === 'park' ? 'buildPark' : `build${type.charAt(0).toUpperCase() + type.slice(1)}`;
  const buttonElement = document.getElementById(buttonId);
  if (buttonElement) {
    buttonElement.textContent = `${capitalizeFirstLetter(type)} ($${cost.toLocaleString()})`;
  }
}
// Cancel build mode
function cancelBuildMode() {
  gameState.buildMode = null;

  // Remove active class from all build buttons
  const buildButtons = document.querySelectorAll(".build-button");
  buildButtons.forEach((button) => {
    button.classList.remove("active");
  });

  // Remove placement indicator
  removePlacementIndicator();

  showNotification("Building mode canceled");
}

function showPlacementIndicator(buildType) {
  // Remove any existing placement indicator
  removePlacementIndicator();

  // Create a new placement indicator
  const indicator = new THREE.Group();
  indicator.name = "placementIndicator";

  // Create a transparent building model based on type
  let geometry, material;

  if (buildType === "road") {
    geometry = new THREE.PlaneGeometry(6, 6);
    material = new THREE.MeshBasicMaterial({
      color: buildingTypes[buildType]?.color || 0x444444,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.02;
    indicator.add(mesh);
  } else if (buildType === "park") {
    geometry = new THREE.PlaneGeometry(5, 5);
    material = new THREE.MeshBasicMaterial({
      color: 0x33aa33,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.02;
    indicator.add(mesh);
  } else {
    // For buildings
    geometry = new THREE.BoxGeometry(5, 4, 5);
    material = new THREE.MeshBasicMaterial({
      color: buildingTypes[buildType]?.color || 0x888888,
      transparent: true,
      opacity: 0.5,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 2;
    indicator.add(mesh);
  }

  // Add indicator to scene
  scene.add(indicator);

  // Store reference to indicator
  gameState.placementIndicator = indicator;

  // Add mouse move event listener to update indicator position
  window.addEventListener("mousemove", updatePlacementIndicator);
}

function updatePlacementIndicator(event) {
    if (!gameState.placementIndicator) return;
    
    // Calculate mouse position in normalized device coordinates
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Create a raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Find intersection with ground plane
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    
    if (raycaster.ray.intersectPlane(groundPlane, target)) {
        // Round to grid
        const x = Math.round(target.x / 5) * 5;
        const z = Math.round(target.z / 5) * 5;
        
        // Update indicator position
        gameState.placementIndicator.position.set(x, 0, z);
        
        // Check if position is valid (not occupied)
        let isOccupied = false;
        scene.traverse(object => {
            if (object.position.x === x && object.position.z === z && 
                object !== gameState.placementIndicator) {
                isOccupied = true;
            }
        });
        
        // Update indicator color based on validity
        gameState.placementIndicator.children.forEach(child => {
            if (child.material) {
                if (isOccupied) {
                    child.material.color.set(0xFF0000); // Red for invalid
                } else {
                    // Reset to original color
                    if (gameState.buildMode === 'road') {
                        child.material.color.set(0x444444);
                    } else if (gameState.buildMode === 'park') {
                        child.material.color.set(0x33AA33);
                    } else {
                        child.material.color.set(buildingTypes[gameState.buildMode]?.color || 0x888888);
                    }
                }
            }
        });
    }
}


function removePlacementIndicator() {
  if (gameState.placementIndicator) {
    scene.remove(gameState.placementIndicator);
    gameState.placementIndicator = null;
    window.removeEventListener("mousemove", updatePlacementIndicator);
  }
}
// Upgrade city infrastructure
function upgradeCity(upgradeType) {
  const currentLevel = gameState.upgrades[upgradeType];
  const upgradeCost = (currentLevel + 1) * 5000;

  if (gameState.money >= upgradeCost && currentLevel < 3) {
    // Deduct cost
    gameState.money -= upgradeCost;
    updateMoneyDisplay();

    // Upgrade
    gameState.upgrades[upgradeType]++;

    // Apply upgrade effects
    applyUpgradeEffects(upgradeType);

    // Update UI
    updateUpgradeButtons();

    showNotification(
      `Upgraded ${formatUpgradeName(upgradeType)} to level ${
        gameState.upgrades[upgradeType]
      }`
    );
  } else if (currentLevel >= 3) {
    showNotification(
      `${formatUpgradeName(upgradeType)} is already at maximum level`
    );
  } else {
    showNotification(
      `Not enough money to upgrade ${formatUpgradeName(upgradeType)}`
    );
  }
}

// Format upgrade name for display
function formatUpgradeName(upgradeType) {
  return upgradeType
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
}

// Apply effects of upgrades
function applyUpgradeEffects(upgradeType) {
  switch (upgradeType) {
    case "taxCollection":
      // Effect applied during tax collection
      break;

    case "buildingEfficiency":
      // Update all building incomes
      gameState.buildings.forEach((building) => {
        updateBuildingIncome(building);
      });
      break;

    case "happinessBoost":
      // Add immediate happiness boost
      gameState.happiness += 10;
      gameState.happiness = Math.min(100, gameState.happiness);
      updateHappinessDisplay();
      break;

    case "roads":
      // Upgrade all roads
      scene.traverse((object) => {
        if (object._isRoad) {
          // Upgrade road appearance
          object.material.color.set(0x555555);

          // Add more details based on level
          const level = gameState.upgrades.roads;
          if (level >= 2 && !object.userData.upgraded) {
            // Add sidewalks for level 2+
            const sidewalkGeometry = new THREE.PlaneGeometry(6, 1);
            const sidewalkMaterial = new THREE.MeshStandardMaterial({
              color: 0xcccccc,
            });

            const sidewalk1 = new THREE.Mesh(
              sidewalkGeometry,
              sidewalkMaterial
            );
            sidewalk1.rotation.x = -Math.PI / 2;
            sidewalk1.position.set(0, 0.02, 3);
            object.add(sidewalk1);

            const sidewalk2 = new THREE.Mesh(
              sidewalkGeometry,
              sidewalkMaterial
            );
            sidewalk2.rotation.x = -Math.PI / 2;
            sidewalk2.position.set(0, 0.02, -3);
            object.add(sidewalk2);

            object.userData.upgraded = true;
          }

          if (level >= 3 && !object.userData.trafficLines) {
            // Add traffic lines for level 3+
            const lineGeometry = new THREE.PlaneGeometry(0.2, 4);
            const lineMaterial = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              emissive: 0xffffff,
              emissiveIntensity: 0.5,
            });

            for (let i = -2; i <= 2; i++) {
              const line = new THREE.Mesh(lineGeometry, lineMaterial);
              line.rotation.x = -Math.PI / 2;
              line.position.set(i, 0.03, 0);
              object.add(line);
            }

            object.userData.trafficLines = true;
          }
        }
      });
      break;

    case "parks":
      // Upgrade all parks
      scene.traverse((object) => {
        if (object._isPark) {
          // Add more details to parks based on level
          const level = gameState.upgrades.parks;

          if (level >= 2 && !object.userData.hasFountain) {
            // Add fountain for level 2+
            const fountain = createFountain();
            object.add(fountain);
            object.userData.hasFountain = true;
          }

          if (level >= 3 && !object.userData.hasPlayground) {
            // Add playground for level 3+
            const playground = new THREE.Group();

            // Swing set
            const swingBarGeometry = new THREE.BoxGeometry(3, 0.1, 0.1);
            const swingBarMaterial = new THREE.MeshStandardMaterial({
              color: 0x666666,
            });
            const swingBar = new THREE.Mesh(swingBarGeometry, swingBarMaterial);
            swingBar.position.y = 2;
            playground.add(swingBar);

            // Swing legs
            const legGeometry = new THREE.BoxGeometry(0.1, 2, 0.1);

            const leg1 = new THREE.Mesh(legGeometry, swingBarMaterial);
            leg1.position.set(-1.4, 1, 0);
            playground.add(leg1);

            const leg2 = new THREE.Mesh(legGeometry, swingBarMaterial);
            leg2.position.set(1.4, 1, 0);
            playground.add(leg2);

            // Swing seats
            const seatGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.3);
            const seatMaterial = new THREE.MeshStandardMaterial({
              color: 0x0000ff,
            });

            const seat1 = new THREE.Mesh(seatGeometry, seatMaterial);
            seat1.position.set(-0.7, 1, 0);
            playground.add(seat1);

            const seat2 = new THREE.Mesh(seatGeometry, seatMaterial);
            seat2.position.set(0.7, 1, 0);
            playground.add(seat2);

            playground.position.set(-2, 0, 2);
            object.add(playground);
            object.userData.hasPlayground = true;
          }
        }
      });
      break;

    case "publicTransport":
      // Add metro stations based on level
      if (gameState.upgrades.publicTransport === 1) {
        createMetroStation(0, 0, true); // Central station
      } else if (gameState.upgrades.publicTransport === 2) {
        createMetroStation(30, 30, false);
        createMetroStation(-30, -30, false);
      } else if (gameState.upgrades.publicTransport === 3) {
        createMetroStation(30, -30, false);
        createMetroStation(-30, 30, false);

        // Add buses for level 3 (road-following buses)
        spawnBusOnRoad();
        spawnBusOnRoad();
      }
      break;
  }
}

// Update UI elements
// Update UI elements
function updateMoneyDisplay() {
  document.getElementById(
    "money"
  ).textContent = `$${gameState.money.toLocaleString()}`;
}

function updateResearchDisplay() {
  const el = document.getElementById("researchPoints");
  const panel = document.getElementById("researchPointsPanel");
  if (el) el.textContent = gameState.researchPoints.toLocaleString();
  if (panel) panel.textContent = gameState.researchPoints.toLocaleString();
  // Update research unlock buttons enabled state
  const gasBtn = document.getElementById("researchUnlockGas");
  const houseBtn = document.getElementById("researchUnlockHouse");
  const skyBtn = document.getElementById("researchUnlockSkyscraper");
  if (gasBtn) gasBtn.disabled = gameState.researchPoints < 50 || gameState.researchUnlocked.gasStation;
  if (houseBtn) houseBtn.disabled = gameState.researchPoints < 30 || gameState.researchUnlocked.house;
  if (skyBtn) skyBtn.disabled = gameState.researchPoints < 200 || gameState.researchUnlocked.skyscraper;
  // Update build menu lock states
  const buildGas = document.getElementById("buildGasStation");
  const buildHouse = document.getElementById("buildHouse");
  const buildSky = document.getElementById("buildSkyscraper");
  if (buildGas) {
    buildGas.disabled = !gameState.researchUnlocked.gasStation;
    buildGas.textContent = gameState.researchUnlocked.gasStation ? "Gas Station ($1,500)" : "Gas Station (Locked)";
  }
  if (buildHouse) {
    buildHouse.disabled = !gameState.researchUnlocked.house;
    buildHouse.textContent = gameState.researchUnlocked.house ? "House ($1,200)" : "House (Locked)";
  }
  if (buildSky) {
    buildSky.disabled = !gameState.researchUnlocked.skyscraper;
    buildSky.textContent = gameState.researchUnlocked.skyscraper ? "Skyscraper ($20,000)" : "Skyscraper (Locked)";
  }
  const buildHospital = document.getElementById('buildHospital');
  const buildPolice = document.getElementById('buildPolice');
  const buildSchool = document.getElementById('buildSchool');
  const buildStadium = document.getElementById('buildStadium');
  const buildMall = document.getElementById('buildMall');
  const buildFactory = document.getElementById('buildFactory');
  const buildPower = document.getElementById('buildPowerPlant');
  const buildAirportEl = document.getElementById('buildAirport');
  if (buildHospital) { buildHospital.disabled = !gameState.researchUnlocked.hospital; buildHospital.textContent = gameState.researchUnlocked.hospital ? 'Hospital ($8,000)' : 'Hospital (Locked)'; }
  if (buildPolice) { buildPolice.disabled = !gameState.researchUnlocked.police; buildPolice.textContent = gameState.researchUnlocked.police ? 'Police Station ($4,000)' : 'Police Station (Locked)'; }
  if (buildSchool) { buildSchool.disabled = !gameState.researchUnlocked.school; buildSchool.textContent = gameState.researchUnlocked.school ? 'School ($5,000)' : 'School (Locked)'; }
  if (buildStadium) { buildStadium.disabled = !gameState.researchUnlocked.stadium; buildStadium.textContent = gameState.researchUnlocked.stadium ? 'Stadium ($15,000)' : 'Stadium (Locked)'; }
  if (buildMall) { buildMall.disabled = !gameState.researchUnlocked.mall; buildMall.textContent = gameState.researchUnlocked.mall ? 'Mall ($12,000)' : 'Mall (Locked)'; }
  if (buildFactory) { buildFactory.disabled = !gameState.researchUnlocked.factory; buildFactory.textContent = gameState.researchUnlocked.factory ? 'Factory ($7,000)' : 'Factory (Locked)'; }
  if (buildPower) { buildPower.disabled = !gameState.researchUnlocked.powerPlant; buildPower.textContent = gameState.researchUnlocked.powerPlant ? 'Power Plant ($25,000)' : 'Power Plant (Locked)'; }
  if (buildAirportEl) { buildAirportEl.disabled = !gameState.researchUnlocked.airport; buildAirportEl.textContent = gameState.researchUnlocked.airport ? 'Airport ($40,000)' : 'Airport (Locked)'; }
}

// Populate research modal tree
function populateResearchTree() {
  const tree = document.getElementById('researchTree');
  if (!tree) return;
  tree.innerHTML = '';

  // Tech-tree with prerequisites
  const techs = [
    // Tier 1 - foundational techs
    { id: 'basicHousing', name: 'Basic Housing', cost: 20, desc: 'Unlock Houses', prereqs: [], unlock: 'house' },
    { id: 'transport', name: 'Transport Network', cost: 30, desc: 'Unlock Gas Stations', prereqs: [], unlock: 'gasStation' },
    { id: 'solar', name: 'Solar Technology', cost: 25, desc: '+1 Happiness tier', prereqs: [], effect: 'happinessBoost' },
    
    // Tier 2 - require at least one tier 1
    { id: 'urbanPlanning', name: 'Urban Planning', cost: 50, desc: 'Unlock Skyscrapers', prereqs: ['basicHousing'], unlock: 'skyscraper' },
    { id: 'healthcare', name: 'Healthcare Systems', cost: 45, desc: 'Unlock Hospitals', prereqs: ['basicHousing'], unlock: 'hospital' },
    { id: 'publicSafety', name: 'Public Safety', cost: 40, desc: 'Unlock Police Stations', prereqs: [], unlock: 'police' },
    { id: 'education', name: 'Education Reform', cost: 50, desc: 'Unlock Schools', prereqs: [], unlock: 'school' },
    
    // Tier 3 - commercial and industrial
    { id: 'commerce', name: 'Commercial Systems', cost: 80, desc: 'Unlock Malls', prereqs: ['urbanPlanning'], unlock: 'mall' },
    { id: 'industry', name: 'Industrial Tech', cost: 85, desc: 'Unlock Factories', prereqs: ['transport'], unlock: 'factory' },
    { id: 'sports', name: 'Sports Infrastructure', cost: 70, desc: 'Unlock Stadiums', prereqs: ['education'], unlock: 'stadium' },
    
    // Tier 4 - advanced
    { id: 'powerGrid', name: 'Power Grid Systems', cost: 150, desc: 'Unlock Power Plants', prereqs: ['industry'], unlock: 'powerPlant' },
    { id: 'advTransit', name: 'Advanced Transit', cost: 100, desc: '+1 Public Transport tier', prereqs: ['transport'], effect: 'publicTransport' },
    
    // Tier 5 - endgame
    { id: 'aviation', name: 'Aviation Technology', cost: 350, desc: 'Unlock Airports', prereqs: ['powerGrid', 'advTransit'], unlock: 'airport' },
  ];

  // Helper: check if a tech can be purchased
  function canAffordTech(tech) {
    return gameState.researchPoints >= tech.cost;
  }

  // Helper: check if prerequisites are met
  function prereqsMet(tech) {
    return tech.prereqs.length === 0 || tech.prereqs.every(prereq => gameState.researchUnlocked[prereq] === true);
  }

  // Helper: check if already purchased
  function alreadyUnlocked(tech) {
    if (tech.unlock) {
      return gameState.researchUnlocked[tech.unlock] === true;
    }
    if (tech.effect === 'happinessBoost') {
      return (gameState.upgrades.happinessBoost || 1) > 1;
    }
    if (tech.effect === 'publicTransport') {
      return (gameState.upgrades.publicTransport || 0) > 0;
    }
    // Check if we've purchased this specific tech
    return gameState.researchUnlocked[tech.id] === true;
  }

  techs.forEach(tech => {
    const locked = !prereqsMet(tech);
    const purchased = alreadyUnlocked(tech);
    const affordable = canAffordTech(tech);

    const card = document.createElement('div');
    card.style.minWidth = '170px';
    card.style.padding = '10px';
    card.style.border = '2px solid #444';
    card.style.borderRadius = '8px';
    card.style.background = purchased ? '#1a3a1a' : locked ? '#2a1a1a' : '#111';
    card.style.cursor = locked || purchased ? 'not-allowed' : 'pointer';
    card.style.flex = '0 0 45%';
    card.style.opacity = purchased ? '0.6' : '1';
    card.id = `research_${tech.id}`;

    // Title
    const title = document.createElement('div');
    title.style.fontWeight = '700';
    title.style.fontSize = '14px';
    title.textContent = tech.name;
    if (purchased) title.textContent += ' ✓';
    if (locked) title.style.opacity = '0.7';

    // Description
    const desc = document.createElement('div');
    desc.style.fontSize = '12px';
    desc.style.marginTop = '4px';
    desc.style.color = locked ? '#888' : '#ccc';
    desc.textContent = tech.desc;

    // Prerequisites display
    let prereqText = '';
    if (tech.prereqs.length > 0) {
      prereqText = 'Requires: ' + tech.prereqs.map(p => {
        const met = gameState.researchUnlocked[p] === true;
        return met ? `✓${p}` : p;
      }).join(', ');
    }
    const prereqDisplay = document.createElement('div');
    prereqDisplay.style.fontSize = '11px';
    prereqDisplay.style.marginTop = '4px';
    prereqDisplay.style.color = '#666';
    prereqDisplay.textContent = prereqText;

    // Cost
    const costDiv = document.createElement('div');
    costDiv.style.marginTop = '8px';
    costDiv.style.fontWeight = '600';
    costDiv.style.color = affordable && !locked && !purchased ? '#4caf50' : '#aaa';
    costDiv.textContent = purchased ? 'PURCHASED' : `Cost: ${tech.cost} RP`;

    card.appendChild(title);
    card.appendChild(desc);
    if (prereqText) card.appendChild(prereqDisplay);
    card.appendChild(costDiv);

    // Highlight affordable items
    if (affordable && !locked && !purchased) {
      card.style.borderColor = '#4caf50';
      card.style.boxShadow = '0 0 10px rgba(76,175,80,0.3)';
    }

    // Highlight locked items
    if (locked) {
      card.style.borderColor = '#666';
      card.style.opacity = '0.5';
    }

    // Purchase handler
    card.addEventListener('click', () => {
      if (purchased) {
        showNotification('Already purchased');
        return;
      }
      if (locked) {
        showNotification('Prerequisites not met');
        return;
      }
      if (!canAffordTech(tech)) {
        showNotification('Not enough research points');
        return;
      }

      // Purchase the tech
      gameState.researchPoints -= tech.cost;
      
      // Mark as purchased
      if (tech.unlock) {
        gameState.researchUnlocked[tech.unlock] = true;
      }
      if (tech.effect === 'happinessBoost') {
        gameState.upgrades.happinessBoost = Math.min(3, (gameState.upgrades.happinessBoost || 1) + 1);
      }
      if (tech.effect === 'publicTransport') {
        gameState.upgrades.publicTransport = Math.min(3, (gameState.upgrades.publicTransport || 0) + 1);
      }
      gameState.researchUnlocked[tech.id] = true;

      updateResearchDisplay();
      populateResearchTree();
      persistGameState();
      showNotification(`Researched: ${tech.name}`);
    });

    tree.appendChild(card);
  });

  const modalPoints = document.getElementById('researchPointsModal');
  if (modalPoints) modalPoints.textContent = gameState.researchPoints.toLocaleString();
}

// Populate building lists grouped by type
function populateBuildingLists() {
  const rec = document.getElementById('buildListRecreational');
  const res = document.getElementById('buildListResidential');
  const ind = document.getElementById('buildListIndustrial');
  if (rec) rec.innerHTML = '';
  if (res) res.innerHTML = '';
  if (ind) ind.innerHTML = '';

  scene.traverse((obj) => {
    if (obj.userData && obj.userData.isBuilding) {
      const item = document.createElement('div');
      item.style.border = '1px solid #444';
      item.style.padding = '6px';
      item.style.marginBottom = '6px';
      item.style.cursor = 'pointer';
      item.textContent = `${capitalizeFirstLetter(obj.userData.type)} (L${obj.userData.level || 1}) @ ${obj.position.x},${obj.position.z}`;
      item.addEventListener('click', () => {
        // center camera on building and show info
        controls.target.set(obj.position.x, 0, obj.position.z);
        camera.position.set(obj.position.x + 10, obj.position.y + 10, obj.position.z + 10);
        showBuildingInfo(obj);
      });

      // classify
      if (obj.userData.type === 'park' || obj.userData.type === 'researchCenter') {
        if (rec) rec.appendChild(item);
      } else if (obj.userData.type === 'residential' || obj.userData.type === 'house') {
        if (res) res.appendChild(item);
      } else {
        if (ind) ind.appendChild(item);
      }
    }
  });
}

function updatePopulationDisplay() {
  document.getElementById("population").textContent =
    gameState.population.toLocaleString();
}

function updateHappinessDisplay() {
  document.getElementById("happiness").textContent = `${gameState.happiness}%`;

  // Update happiness bar
  const happinessBar = document.getElementById("happinessBar");
  happinessBar.style.width = `${gameState.happiness}%`;

  // Update color based on happiness level
  if (gameState.happiness < 30) {
    happinessBar.style.backgroundColor = "#FF4444";
  } else if (gameState.happiness < 70) {
    happinessBar.style.backgroundColor = "#FFAA44";
  } else {
    happinessBar.style.backgroundColor = "#44AA44";
  }
}

function updateUpgradeButtons() {
  // Update upgrade buttons with current levels and costs
  Object.keys(gameState.upgrades).forEach((upgradeType) => {
    const currentLevel = gameState.upgrades[upgradeType];
    const upgradeCost = (currentLevel + 1) * 5000;
    const button = document.getElementById(
      `upgrade${upgradeType.charAt(0).toUpperCase() + upgradeType.slice(1)}`
    );

    button.textContent = `${formatUpgradeName(
      upgradeType
    )} (Level ${currentLevel}) - $${upgradeCost.toLocaleString()}`;
    button.disabled = gameState.money < upgradeCost || currentLevel >= 3;

    if (currentLevel >= 3) {
      button.textContent = `${formatUpgradeName(upgradeType)} (MAX)`;
    }
  });
}

// Show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;

  document.getElementById("notifications").appendChild(notification);

  // Remove notification after 5 seconds
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 5000);
}

// Add lights to the scene
function addLights() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Directional light (sun)
  const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
  sunLight.position.set(50, 100, 50);
  sunLight.castShadow = true;

  // Configure shadow properties
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 500;
  sunLight.shadow.camera.left = -100;
  sunLight.shadow.camera.right = 100;
  sunLight.shadow.camera.top = 100;
  sunLight.shadow.camera.bottom = -100;

  scene.add(sunLight);

  // Store reference for day/night cycle
  scene.userData.sunLight = sunLight;
  scene.userData.ambientLight = ambientLight;
}

// Add initial terrain
function addInitialTerrain() {
  // Create ground
  const groundGeometry = new THREE.PlaneGeometry(200, 200, 32, 32);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x88aa55,
    roughness: 0.8,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Create main roads
  for (let i = -100; i <= 100; i += 5) {
    // East-West road
    if (Math.abs(i) < 3) {
      createRoad(i, 0);
    }

    // North-South road
    if (Math.abs(i) < 3) {
      createRoad(0, i);
    }
  }

  // Add initial buildings
  createBuilding(-10, -10, "residential");
  createBuilding(-10, 10, "commercial");
  createBuilding(10, -10, "industrial");
  createBuilding(10, 10, "residential");

  // Add initial park
  createPark(-20, -20, 5, 1);
}

// Update day/night cycle
function updateDayNightCycle() {
  const dayDuration = 300; // 5 minutes per day
  const timeOfDay = (gameState.gameTime % dayDuration) / dayDuration;

  // Update sun position
  const sunAngle = timeOfDay * Math.PI * 2;
  const sunRadius = 100;
  scene.userData.sunLight.position.set(
    Math.cos(sunAngle) * sunRadius,
    Math.sin(sunAngle) * sunRadius,
    0
  );

  // Update light intensity based on time of day
  let sunIntensity, ambientIntensity;

  if (timeOfDay > 0.25 && timeOfDay < 0.75) {
    // Night time
    sunIntensity = 0.1;
    ambientIntensity = 0.2;
    scene.background = new THREE.Color(0x111133); // Dark blue night sky
  } else {
    // Day time
    const dayProgress =
      timeOfDay < 0.25
        ? timeOfDay * 4 // Sunrise
        : (1 - timeOfDay) * 4; // Sunset

    sunIntensity = 0.1 + dayProgress * 0.7;
    ambientIntensity = 0.2 + dayProgress * 0.3;

    // Sky color
    const skyColor = new THREE.Color(0x87ceeb); // Day sky
    const sunsetColor = new THREE.Color(0xff7f50); // Sunset/sunrise color

    if (dayProgress < 0.5) {
      // Transition to/from sunset colors
      scene.background = new THREE.Color().lerpColors(
        sunsetColor,
        skyColor,
        dayProgress * 2
      );
    } else {
      scene.background = skyColor;
    }
  }

  scene.userData.sunLight.intensity = sunIntensity;
  scene.userData.ambientLight.intensity = ambientIntensity;

  // Update building windows at night
  scene.traverse((object) => {
    if (object.userData && object.userData.windowMaterial) {
      if (timeOfDay > 0.25 && timeOfDay < 0.75) {
        // Night time - windows emit light
        object.userData.windowMaterial.emissiveIntensity =
          0.5 + Math.random() * 0.3;
      } else {
        // Day time - windows don't emit light
        object.userData.windowMaterial.emissiveIntensity = 0;
      }
    }
  });
}

// Collect taxes from buildings
function collectTaxes() {
  let totalIncome = 0;

  // Collect from each building
  gameState.buildings.forEach((building) => {
    totalIncome += Number(building.income) || 0;
  });

  // Apply tax collection upgrade
  totalIncome *= 1 + (gameState.upgrades.taxCollection - 1) * 0.2;

  // Round to whole number
  totalIncome = Math.round(totalIncome);

  // Add to money
  gameState.money += totalIncome;

  // Update UI
  updateMoneyDisplay();

  showNotification(`Collected $${totalIncome.toLocaleString()} in taxes`);
}

// Update happiness based on city conditions
function updateHappiness() {
  let targetHappiness = 50; // Base happiness

  // Population density factor
  const residentialCount = gameState.buildings.filter((b) => b.type === "residential").length || 0;
  const populationDensity = residentialCount > 0 ? gameState.population / residentialCount : 0;
  if (populationDensity > 100) {
    targetHappiness -= 10; // Overcrowding penalty
  } else if (populationDensity < 50) {
    targetHappiness += 5; // Low density bonus
  }

  // Parks factor
  let parkCount = 0;
  scene.traverse((object) => {
    if (object._isPark) {
      parkCount++;
    }
  });

  targetHappiness += Math.min(20, parkCount * 2); // Up to +20 for parks

  // Public transport factor
  if (gameState.upgrades.publicTransport > 0) {
    targetHappiness += gameState.upgrades.publicTransport * 5; // +5 per level
  }

  // Apply happiness boost upgrade
  targetHappiness += (gameState.upgrades.happinessBoost - 1) * 10;

  // Cap happiness
  targetHappiness = Math.max(0, Math.min(100, targetHappiness));

  // Gradually move current happiness toward target
  if (gameState.happiness < targetHappiness) {
    gameState.happiness += Math.min(5, targetHappiness - gameState.happiness);
  } else if (gameState.happiness > targetHappiness) {
    gameState.happiness -= Math.min(5, gameState.happiness - targetHappiness);
  }

  // Update UI
  updateHappinessDisplay();
}

// Update population based on city conditions
function updatePopulation() {
  // Calculate target population based on residential capacity and happiness
  const residentialBuildings = gameState.buildings.filter(
    (b) => b.type === "residential"
  );
  const residentialCapacity = residentialBuildings.reduce((sum, building) => {
    return sum + (building.level || 1) * 100;
  }, 0);

  // Adjust target based on happiness
  const happinessMultiplier = gameState.happiness / 50; // 1.0 at 50% happiness
  const targetPopulation = Math.round(
    residentialCapacity * happinessMultiplier
  );

  // Gradually adjust population toward target
  if (gameState.population < targetPopulation) {
    // Population growth
    const growth = Math.min(
      Math.ceil((targetPopulation - gameState.population) * 0.05),
      Math.ceil(gameState.population * 0.02) // Max 2% growth per update
    );
    gameState.population += growth;

    if (growth > 0) {
      showNotification(`Population increased by ${growth}`);
    }
  } else if (gameState.population > targetPopulation) {
    // Population decline
    const decline = Math.min(
      Math.ceil((gameState.population - targetPopulation) * 0.05),
      Math.ceil(gameState.population * 0.02) // Max 2% decline per update
    );
    gameState.population -= decline;

    if (decline > 0) {
      showNotification(`Population decreased by ${decline}`);
    }
  }

  // Update UI
  updatePopulationDisplay();
}

// Update research points generated by research centers
function updateResearch() {
  // Count research centers
  let centers = 0;
  scene.traverse((object) => {
    if (object.userData && object.userData.type === "researchCenter") centers++;
  });

  if (centers <= 0) return;

  // Each center generates 10 RP per interval, scale with upgrades
  const perCenter = 10;
  const gained = centers * perCenter;
  gameState.researchPoints += gained;
  updateResearchDisplay();
  showNotification(`Generated ${gained} research points from ${centers} research center(s)`);
}

function unlockResearch(key, cost) {
  if (gameState.researchPoints >= cost) {
    gameState.researchPoints -= cost;
    gameState.researchUnlocked[key] = true;
    updateResearchDisplay();
    showNotification(`Unlocked ${capitalizeFirstLetter(key)}`);
  } else {
    showNotification("Not enough research points");
  }
}

// Persist/load game small state to localStorage
function persistGameState() {
  try {
    const state = {
      fullSave: true,
      money: gameState.money,
      population: gameState.population,
      happiness: gameState.happiness,
      upgrades: gameState.upgrades,
      researchPoints: gameState.researchPoints,
      researchUnlocked: gameState.researchUnlocked,
      settings: gameState.settings || {},
      buildings: [],
      parks: [],
      roads: [],
      metroStations: [],
    };

    scene.traverse((obj) => {
      if (obj.userData && obj.userData.isBuilding) {
        state.buildings.push({
          type: obj.userData.type,
          x: obj.userData.x ?? obj.position.x,
          z: obj.userData.z ?? obj.position.z,
          level: obj.userData.level || 1,
          income: obj.userData.income || 0,
        });
      }

      if (obj._isPark) {
        state.parks.push({
          x: obj.userData.x ?? obj.position.x,
          z: obj.userData.z ?? obj.position.z,
          size: obj.userData.size || 5,
          level: obj.userData.level || 1,
        });
      }

      if (obj._isRoad) {
        state.roads.push({ x: obj.userData.x ?? obj.position.x, z: obj.userData.z ?? obj.position.z });
      }

      if (obj._isMetroStation) {
        state.metroStations.push({ x: obj.userData.x ?? obj.position.x, z: obj.userData.z ?? obj.position.z, isCentral: !!obj.userData.isCentral });
      }
    });

    localStorage.setItem('tycoon_game_state', JSON.stringify(state));
  } catch (e) {
    console.warn('Could not persist game state', e);
  }
}

function loadGameState() {
  try {
    const raw = localStorage.getItem('tycoon_game_state');
    if (!raw) return;
    const state = JSON.parse(raw);

    // Backwards-compatible small state
    if (!state.fullSave) {
      if (state.researchPoints) gameState.researchPoints = state.researchPoints;
      if (state.researchUnlocked) gameState.researchUnlocked = state.researchUnlocked;
      if (state.settings) gameState.settings = state.settings;
      return;
    }

    // Clear current city objects (buildings, parks, roads, stations)
    const toRemove = [];
    scene.traverse((obj) => {
      if (obj.userData && obj.userData.isBuilding) toRemove.push(obj);
      if (obj._isPark) toRemove.push(obj);
      if (obj._isRoad) toRemove.push(obj);
      if (obj._isMetroStation) toRemove.push(obj);
    });
    toRemove.forEach(o => { scene.remove(o); });

    // Restore basic fields
    if (typeof state.money === 'number') gameState.money = state.money;
    if (typeof state.population === 'number') gameState.population = state.population;
    if (typeof state.happiness === 'number') gameState.happiness = state.happiness;
    if (state.upgrades) gameState.upgrades = state.upgrades;
    if (state.researchPoints) gameState.researchPoints = state.researchPoints;
    if (state.researchUnlocked) gameState.researchUnlocked = state.researchUnlocked;
    if (state.settings) gameState.settings = state.settings;

    // Recreate roads
    if (Array.isArray(state.roads)) {
      state.roads.forEach(r => createRoad(r.x, r.z));
    }

    // Recreate parks
    if (Array.isArray(state.parks)) {
      state.parks.forEach(p => createPark(p.x, p.z, p.size || 5, p.level || 1));
    }

    // Recreate buildings
    if (Array.isArray(state.buildings)) {
      state.buildings.forEach(b => {
        const grp = createBuilding(b.x, b.z, b.type);
        if (grp && grp.userData) {
          grp.userData.level = b.level || 1;
          grp.userData.income = b.income || buildingTypes[b.type]?.income || 0;
          grp.userData.x = b.x;
          grp.userData.z = b.z;
        }
      });
    }

    // Recreate metro stations
    if (Array.isArray(state.metroStations)) {
      state.metroStations.forEach(s => createMetroStation(s.x, s.z, !!s.isCentral));
    }

    // Update UI
    updateMoneyDisplay();
    updatePopulationDisplay();
    updateHappinessDisplay();
    updateResearchDisplay();
    updateUpgradeButtons();

  } catch (e) {
    console.warn('Could not load saved state', e);
  }
}

// Update building animations
function updateBuildingAnimations() {
  scene.traverse((object) => {
    if (object.userData && object.userData.isBuilding) {
      // Animate windows for commercial buildings at night
      if (object.userData.type === "commercial") {
        // Randomly toggle some windows
        if (Math.random() < 0.05) {
          if (object.userData.windowMaterial) {
            const emissiveIntensity =
              object.userData.windowMaterial.emissiveIntensity;
            object.userData.windowMaterial.emissiveIntensity =
              emissiveIntensity > 0.4 ? 0.2 : 0.8;
          }
        }
      }
    }
  });

  // Animate fountains
  scene.traverse((object) => {
    if (object.userData && object.userData.particles) {
      const positions =
        object.userData.particles.geometry.attributes.position.array;
      const particleData = object.userData.particleData;

      for (let i = 0; i < particleData.length; i++) {
        const i3 = i * 3;

        // Apply velocity
        positions[i3] += particleData[i].velocity.x;
        positions[i3 + 1] += particleData[i].velocity.y;
        positions[i3 + 2] += particleData[i].velocity.z;

        // Apply gravity
        particleData[i].velocity.y -= 0.003;

        // Reset particle if it falls below initial height
        if (positions[i3 + 1] < particleData[i].initialY - 1) {
          positions[i3] = (Math.random() - 0.5) * 0.5;
          positions[i3 + 1] = particleData[i].initialY;
          positions[i3 + 2] = (Math.random() - 0.5) * 0.5;

          particleData[i].velocity.set(
            (Math.random() - 0.5) * 0.05,
            Math.random() * 0.1 + 0.05,
            (Math.random() - 0.5) * 0.05
          );
        }
      }

      object.userData.particles.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Animate buses
  scene.traverse((object) => {
    if (object.userData && object.userData.route) {
      const busData = object.userData;

      // Check if bus is at a stop
      if (busData.atStop) {
        busData.stopDuration -= 1;

        if (busData.stopDuration <= 0) {
          busData.atStop = false;
        }
        return;
      }

      // Move bus based on route
      if (busData.route === "eastWest") {
        object.position.x += busData.speed;

        // Check if bus should stop
        if (
          Math.abs(object.position.x % 20) < busData.speed &&
          Math.random() < 0.3
        ) {
          busData.atStop = true;
          busData.stopDuration = 60; // Stop for 60 frames (about 2 seconds)
        }

        // Wrap around when reaching edge
        if (object.position.x > 80) {
          object.position.x = -80;
        }
      } else {
        object.position.z += busData.speed;

        // Check if bus should stop
        if (
          Math.abs(object.position.z % 20) < busData.speed &&
          Math.random() < 0.3
        ) {
          busData.atStop = true;
          busData.stopDuration = 60; // Stop for 60 frames (about 2 seconds)
        }

        // Wrap around when reaching edge
        if (object.position.z > 80) {
          object.position.z = -80;
        }
      }
    }
  });
}

// Handle mouse click on the canvas
function onMouseClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Create a raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Check if we're in build mode
    if (gameState.buildMode) {
        // Find intersection with ground plane
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(groundPlane, target)) {
            // Round to grid
            const x = Math.round(target.x / 5) * 5;
            const z = Math.round(target.z / 5) * 5;
            
            if (gameState.buildMode === 'residential' || 
                gameState.buildMode === 'commercial' || 
                gameState.buildMode === 'industrial') {
                
                // Check if we have enough money
                const buildingCost = buildingTypes[gameState.buildMode].cost(1); // Cost for level 1
                
                if (gameState.money >= buildingCost) {
                    // Deduct cost
                    gameState.money -= buildingCost;
                    updateMoneyDisplay();
                    
                    // Create building
                    const newBuilding = createBuilding(x, z, gameState.buildMode);
                    newBuilding.userData.level = 1; // Set initial level
                    
                    // Store the exact coordinates in the building data
                    newBuilding.userData.x = x;
                    newBuilding.userData.z = z;

                    showNotification(`Built ${gameState.buildMode} building for $${buildingCost.toLocaleString()}`);
                } else {
                    showNotification(`Not enough money to build ${gameState.buildMode} building`);
                }
            } else if (gameState.buildMode === 'road') {
                // Handle road placement
                const roadCost = buildingTypes.road.cost();
                
                if (gameState.money >= roadCost) {
                    // Check if road already exists at this location
                    let roadExists = false;
                    scene.traverse((object) => {
                        if (object._isRoad && 
                            Math.abs(object.position.x - x) < 1 && 
                            Math.abs(object.position.z - z) < 1) {
                            roadExists = true;
                        }
                    });
                    
                    if (!roadExists) {
                        gameState.money -= roadCost;
                        updateMoneyDisplay();
                        
                        createRoad(x, z);
                        showNotification(`Built road for $${roadCost.toLocaleString()}`);
                    } else {
                        showNotification("Road already exists at this location");
                    }
                } else {
                    showNotification(`Not enough money to build road (cost: $${roadCost.toLocaleString()})`);
                }
            } else if (gameState.buildMode === 'park') {
                // Handle park placement
                const parkCost = buildingTypes.park.cost();
                
                if (gameState.money >= parkCost) {
                    // Check if park already exists at this location
                    let parkExists = false;
                    scene.traverse((object) => {
                        if (object._isPark && 
                            Math.abs(object.position.x - x) < 2.5 && 
                            Math.abs(object.position.z - z) < 2.5) {
                            parkExists = true;
                        }
                    });
                    
                    if (!parkExists) {
                        gameState.money -= parkCost;
                        updateMoneyDisplay();
                        
                        createPark(x, z, 5, 1);
                        showNotification(`Built park for $${parkCost.toLocaleString()}`);
                    } else {
                        showNotification("Park already exists at this location");
                    }
                } else {
                    showNotification(`Not enough money to build park (cost: $${parkCost.toLocaleString()})`);
                }
            } else {
                // Generic handler for all other building types (house, gasStation, researchCenter, hospital, police, school, stadium, mall, factory, powerPlant, airport)
                const buildingCost = buildingTypes[gameState.buildMode].cost(1);
                
                if (gameState.money >= buildingCost) {
                    gameState.money -= buildingCost;
                    updateMoneyDisplay();
                    
                    const newBuilding = createBuilding(x, z, gameState.buildMode);
                    newBuilding.userData.level = 1;
                    newBuilding.userData.x = x;
                    newBuilding.userData.z = z;
                    
                    showNotification(`Built ${gameState.buildMode} for $${buildingCost.toLocaleString()}`);
                } else {
                    showNotification(`Not enough money to build ${gameState.buildMode} (cost: $${buildingCost.toLocaleString()})`);
                }
            }
        }
    } else {
        // Not in build mode, check for intersections with objects in the scene
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        if (intersects.length > 0) {
            // Get the first intersected object
            const intersect = intersects[0];
            
            // Not in build mode, check if we clicked on a building
            let clickedBuilding = null;
            let clickedObject = intersect.object;
            
            // Traverse up the parent hierarchy to find the building group
            while (clickedObject && !clickedBuilding) {
                if (clickedObject.userData && clickedObject.userData.isBuilding) {
                    clickedBuilding = clickedObject;
                }
                clickedObject = clickedObject.parent;
            }
            
            if (clickedBuilding) {
                // Show building info
                showBuildingInfo(clickedBuilding);
                gameState.selectedBuilding = clickedBuilding;
            } else {
                // Hide building info if we clicked elsewhere
                hideBuildingInfo();
                gameState.selectedBuilding = null;
            }
        }
    }
}
// Create a road
function createRoad(x, z) {
  // Create road mesh
  const roadGeometry = new THREE.PlaneGeometry(6, 6);
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.8,
  });

  const road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.position.set(x, 0.01, z); // Slightly above ground to prevent z-fighting
  road.receiveShadow = true;
  scene.add(road);

  // Add road markings
  const markingGeometry = new THREE.PlaneGeometry(0.5, 2);
  const markingMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.2,
  });

  const marking = new THREE.Mesh(markingGeometry, markingMaterial);
  marking.rotation.x = -Math.PI / 2;
  marking.position.y = 0.02; // Slightly above road
  road.add(marking);

  // Add road to game state
  road._isRoad = true;
  road.userData = { x: x, z: z, queue: [] };

  // Detect neighboring roads (cardinal directions, grid spacing = 6)
  const neighbors = { north: false, south: false, east: false, west: false };
  scene.traverse((obj) => {
    if (!obj._isRoad) return;
    const rx = obj.userData && obj.userData.x;
    const rz = obj.userData && obj.userData.z;
    if (typeof rx !== 'number' || typeof rz !== 'number') return;
    if (Math.abs(rx - x) < 0.1 && Math.abs(rz - (z - 6)) < 0.1) neighbors.north = true;
    if (Math.abs(rx - x) < 0.1 && Math.abs(rz - (z + 6)) < 0.1) neighbors.south = true;
    if (Math.abs(rz - z) < 0.1 && Math.abs(rx - (x + 6)) < 0.1) neighbors.east = true;
    if (Math.abs(rz - z) < 0.1 && Math.abs(rx - (x - 6)) < 0.1) neighbors.west = true;
  });

  // Mark intersection when roads exist in both axes
  if ((neighbors.north || neighbors.south) && (neighbors.east || neighbors.west)) {
    road.userData.isIntersection = true;
    road.userData.intersection = { occupants: [], waiting: [] };
  }

  // Determine lane orientation for this road (ns, ew, or both)
  road.userData.hasNS = neighbors.north || neighbors.south;
  road.userData.hasEW = neighbors.east || neighbors.west;

  // Create traffic light only at intersections (with higher chance)
  if (road.userData.isIntersection && Math.random() < 0.8) {
    createTrafficLight(x, z, neighbors);
  }

  // Re-evaluate neighbor roads: they might have become intersections now
  scene.traverse((obj) => {
    if (!obj._isRoad) return;
    const rx = obj.userData && obj.userData.x;
    const rz = obj.userData && obj.userData.z;
    if (typeof rx !== 'number' || typeof rz !== 'number') return;
    const n = { north: false, south: false, east: false, west: false };
    scene.traverse((o2) => {
      if (!o2._isRoad) return;
      const r2x = o2.userData && o2.userData.x;
      const r2z = o2.userData && o2.userData.z;
      if (typeof r2x !== 'number' || typeof r2z !== 'number') return;
      if (Math.abs(r2x - rx) < 0.1 && Math.abs(r2z - (rz - 6)) < 0.1) n.north = true;
      if (Math.abs(r2x - rx) < 0.1 && Math.abs(r2z - (rz + 6)) < 0.1) n.south = true;
      if (Math.abs(r2z - rz) < 0.1 && Math.abs(r2x - (rx + 6)) < 0.1) n.east = true;
      if (Math.abs(r2z - rz) < 0.1 && Math.abs(r2x - (rx - 6)) < 0.1) n.west = true;
    });
    const becameIntersection = (n.north || n.south) && (n.east || n.west);
    if (becameIntersection && !obj.userData.isIntersection) {
      obj.userData.isIntersection = true;
      obj.userData.intersection = obj.userData.intersection || { occupants: [], waiting: [] };
      if (Math.random() < 0.8) createTrafficLight(rx, rz, n);
    }
  });

  // Check if we should add a street lamp
  if (Math.random() < 0.3) {
    createStreetLamp(x + 2, z);
  }
}

// Create a traffic light
function createTrafficLight(x, z, neighbors = { north: false, south: false, east: false, west: false }) {
  const trafficLightGroup = new THREE.Group();
  trafficLightGroup.position.set(x, 0, z);

  const poleGeometry = new THREE.CylinderGeometry(0.12, 0.12, 3, 8);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const armGeometry = new THREE.CylinderGeometry(0.06, 0.06, 3, 8);
  const housingGeometry = new THREE.BoxGeometry(0.5, 1, 0.4);

  // We'll collect the light materials so the traffic system can update them
  const lights = [];

  function addApproach(offsetX, offsetZ, armRotationAxis) {
    const approach = new THREE.Group();
    approach.position.set(offsetX, 0, offsetZ);

    // pole
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 1.5;
    approach.add(pole);

    // arm reaching toward the center of the intersection
    const arm = new THREE.Mesh(armGeometry, poleMaterial);
    arm.position.y = 2.5;
    if (armRotationAxis === 'x') {
      arm.rotation.x = Math.PI / 2; // along Z axis
      arm.position.z += (offsetZ < 0 ? 1.5 : -1.5);
    } else {
      arm.rotation.z = Math.PI / 2; // along X axis
      arm.position.x += (offsetX < 0 ? 1.5 : -1.5);
    }
    approach.add(arm);

    // housing at the end of the arm (near the center)
    const housing = new THREE.Mesh(housingGeometry, new THREE.MeshStandardMaterial({ color: 0x222222 }));
    housing.position.y = 2.5;
    if (armRotationAxis === 'x') housing.position.z += (offsetZ < 0 ? 3 : -3);
    else housing.position.x += (offsetX < 0 ? 3 : -3);
    approach.add(housing);

    // three small lights (spheres) stacked vertically on the housing
    const redMat = new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0x550000, emissiveIntensity: 0.2 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0x555500, emissive: 0x555500, emissiveIntensity: 0.1 });
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x005500, emissive: 0x005500, emissiveIntensity: 0.1 });

    const sGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const r = new THREE.Mesh(sGeo, redMat);
    const y = new THREE.Mesh(sGeo, yellowMat);
    const g = new THREE.Mesh(sGeo, greenMat);

    r.position.set(housing.position.x, housing.position.y + 0.25, housing.position.z + 0.25);
    y.position.set(housing.position.x, housing.position.y, housing.position.z + 0.25);
    g.position.set(housing.position.x, housing.position.y - 0.25, housing.position.z + 0.25);

    approach.add(r);
    approach.add(y);
    approach.add(g);

    lights.push({ red: r.material, yellow: y.material, green: g.material });

    trafficLightGroup.add(approach);
  }

  // Add approaches based on neighbor roads so lights overhang toward the center
  if (neighbors.north) addApproach(0, -3, 'x');
  if (neighbors.south) addApproach(0, 3, 'x');
  if (neighbors.east) addApproach(3, 0, 'z');
  if (neighbors.west) addApproach(-3, 0, 'z');

  trafficLightGroup.userData = {
    lights: lights,
    state: 'red',
    timer: 0,
  };

  trafficLightGroup._isTrafficLight = true;
  scene.add(trafficLightGroup);
}

// Create a street lamp
function createStreetLamp(x, z) {
  const lampGroup = new THREE.Group();
  lampGroup.position.set(x, 0, z);

  // Create pole
  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.y = 2;
  lampGroup.add(pole);

  // Create arm
  const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
  const arm = new THREE.Mesh(armGeometry, poleMaterial);
  arm.position.y = 3.5;
  arm.rotation.z = Math.PI / 2;
  arm.position.x = 0.5;
  lampGroup.add(arm);

  // Create lamp head
  const headGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.4, 8);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(1, 3.5, 0);
  lampGroup.add(head);

  // Create light bulb
  const bulbGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffcc,
    emissive: 0xffffcc,
    emissiveIntensity: 0.5,
  });
  const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
  bulb.position.set(1, 3.3, 0);
  lampGroup.add(bulb);

  // Add point light
  const light = new THREE.PointLight(0xffffcc, 0.5, 10);
  light.position.set(1, 3.3, 0);
  lampGroup.add(light);

  // Store light reference for day/night cycle
  lampGroup.userData = {
    light: light,
    bulbMaterial: bulbMaterial,
  };

  lampGroup._isStreetLamp = true;

  scene.add(lampGroup);
}

// Create a bench
function createBench() {
  const benchGroup = new THREE.Group();

  // Create seat
  const seatGeometry = new THREE.BoxGeometry(2, 0.1, 0.5);
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8,
  });
  const seat = new THREE.Mesh(seatGeometry, woodMaterial);
  seat.position.y = 0.4;
  benchGroup.add(seat);

  // Create backrest
  const backrestGeometry = new THREE.BoxGeometry(2, 0.5, 0.1);
  const backrest = new THREE.Mesh(backrestGeometry, woodMaterial);
  backrest.position.set(0, 0.7, -0.2);
  benchGroup.add(backrest);

  // Create legs
  const legGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.5);
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.8,
    roughness: 0.2,
  });

  const legLeft = new THREE.Mesh(legGeometry, metalMaterial);
  legLeft.position.set(0.8, 0.2, 0);
  benchGroup.add(legLeft);

  const legRight = new THREE.Mesh(legGeometry, metalMaterial);
  legRight.position.set(-0.8, 0.2, 0);
  benchGroup.add(legRight);

  return benchGroup;
}

// Show building info panel
function showBuildingInfo(building) {
  const buildingData = building.userData;
  const infoPanel = document.getElementById("buildingInfo");

  // Update info panel content
  document.getElementById("buildingType").textContent = capitalizeFirstLetter(
    buildingData.type
  );
  document.getElementById("buildingLevel").textContent =
    buildingData.level || 1;
  document.getElementById(
    "buildingIncome"
  ).textContent = `$${buildingData.income.toLocaleString()}`;

  // Calculate upgrade cost
  const upgradeCost = (buildingData.level || 1) * buildingTypes[buildingData.type].cost(buildingData.level || 1);
  document.getElementById(
    "upgradeCostBB"
   ).textContent = `$ ${upgradeCost.toLocaleString()}`;

  // Enable/disable upgrade button based on available money
  document.getElementById("upgradeBuildingButton").disabled =gameState.money < upgradeCost;

  // Show panel
  infoPanel.style.display = "block";
}

// Hide building info panel
function hideBuildingInfo() {
  document.getElementById("buildingInfo").style.display = "none";
}

// Upgrade selected building
function upgradeSelectedBuilding() {
  if (!gameState.selectedBuilding) return;

  const buildingData = gameState.selectedBuilding.userData;
  const currentLevel = buildingData.level || 1;
  const upgradeCost = currentLevel * buildingTypes[buildingData.type].cost(currentLevel);

  if (gameState.money >= upgradeCost) {
    // Deduct cost
    gameState.money -= upgradeCost;
    updateMoneyDisplay();

    // Upgrade building
    buildingData.level = currentLevel + 1;

    // Update income
    updateBuildingIncome(buildingData);

    // Update building appearance
    upgradeBuilding3DModel(gameState.selectedBuilding);

    // Update info panel
    showBuildingInfo(gameState.selectedBuilding);

    showNotification(
      `Upgraded ${buildingData.type} building to level ${buildingData.level}`
    );
  } else {
    showNotification("Not enough money to upgrade building");
  }
}

// Upgrade building 3D model
function upgradeBuilding3DModel(building) {
  const buildingData = building.userData;
  const level = buildingData.level;
  const type = buildingData.type;

  // Remove all children except the base
  for (let i = building.children.length - 1; i >= 0; i--) {
    const child = building.children[i];
    if (!child.isBase) {
      building.remove(child);
    }
  }

  // Get the base
  const base = building.children[0];

  // Increase height based on level
  const baseHeight = type === "industrial" ? 3 : type === "commercial" ? 5 : 4;
  const newHeight = baseHeight + (level - 1) * 2;

  base.geometry = new THREE.BoxGeometry(5, newHeight, 5);
  base.position.y = newHeight / 2;

  // Add windows for each level
  const windowGeometry = new THREE.PlaneGeometry(0.5, 0.5);
  const windowMaterial = building.userData.windowMaterial;

  // Add windows to each side
  for (let side = 0; side < 4; side++) {
    const direction = (side * Math.PI) / 2;

    for (let floor = 0; floor < newHeight - 1; floor++) {
      for (let i = 0; i < 3; i++) {
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(
          Math.sin(direction) * 2.51,
          floor + 0.5,
          Math.cos(direction) * 2.51
        );
        window.rotation.y = direction;
        building.add(window);
      }
    }
  }

  // Add level-specific details
  if (level >= 2) {
    if (type === "residential") {
      // Add balconies
      const balconyGeometry = new THREE.BoxGeometry(1, 0.1, 0.5);
      const balconyMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
      });

      for (let side = 0; side < 4; side++) {
        const direction = (side * Math.PI) / 2;

        for (let floor = 1; floor < newHeight - 1; floor += 2) {
          const balcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
          balcony.position.set(
            Math.sin(direction) * 3,
            floor + 0.5,
            Math.cos(direction) * 3
          );
          balcony.rotation.y = direction;
          building.add(balcony);

          // Add railing
          const railingGeometry = new THREE.BoxGeometry(1, 0.3, 0.05);
          const railing = new THREE.Mesh(railingGeometry, balconyMaterial);
          railing.position.set(
            Math.sin(direction) * 3,
            floor + 0.7,
            Math.cos(direction) * 3 +
              (direction === 0 || direction === Math.PI ? 0.225 : 0)
          );
          railing.rotation.y = direction;
          building.add(railing);
        }
      }
    } else if (type === "commercial") {
      // Add signage
      const signGeometry = new THREE.BoxGeometry(2, 0.5, 0.1);
      const signMaterial = new THREE.MeshStandardMaterial({
        color: 0x00aaff,
        emissive: 0x00aaff,
        emissiveIntensity: 0.5,
      });

      for (let side = 0; side < 4; side++) {
        const direction = (side * Math.PI) / 2;
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(
          Math.sin(direction) * 2.55,
          newHeight - 1,
          Math.cos(direction) * 2.55
        );
        sign.rotation.y = direction;
        building.add(sign);
      }
    } else if (type === "industrial") {
      // Add more smokestacks
      const stackGeometry = new THREE.CylinderGeometry(0.5, 0.7, 3, 8);
      const stackMaterial = new THREE.MeshStandardMaterial({ color: 0x993333 });

      for (let i = 0; i < level; i++) {
        const stack = new THREE.Mesh(stackGeometry, stackMaterial);
        stack.position.set(1.5 - i, newHeight + 1.5, 1.5 - i);
        building.add(stack);
      }
    }
  }

  // Add level 3 special features
  if (level >= 3) {
    if (type === "residential") {
      // Add rooftop garden
      const gardenGeometry = new THREE.BoxGeometry(4, 0.2, 4);
      const gardenMaterial = new THREE.MeshStandardMaterial({
        color: 0x77aa44,
      });
      const garden = new THREE.Mesh(gardenGeometry, gardenMaterial);
      garden.position.y = newHeight + 0.1;
      building.add(garden);

      // Add garden furniture
      const tableGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8);
      const tableMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const table = new THREE.Mesh(tableGeometry, tableMaterial);
      table.position.set(1, newHeight + 0.25, 1);
      building.add(table);
    } else if (type === "commercial") {
      // Add rooftop helipad
      const padGeometry = new THREE.CylinderGeometry(2, 2, 0.1, 16);
      const padMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const pad = new THREE.Mesh(padGeometry, padMaterial);
      pad.position.y = newHeight + 0.05;
      building.add(pad);

      // Add helipad markings
      const markingGeometry = new THREE.PlaneGeometry(3, 3);
      const markingMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      });
      const marking = new THREE.Mesh(markingGeometry, markingMaterial);
      marking.rotation.x = -Math.PI / 2;
      marking.position.y = newHeight + 0.11;
      building.add(marking);

      // Add "H" text
      const hGeometry = new THREE.PlaneGeometry(1, 1);
      const hMaterial = new THREE.MeshStandardMaterial({
        color: 0x0000ff,
        transparent: true,
        opacity: 0.9,
      });
      const h = new THREE.Mesh(hGeometry, hMaterial);
      h.rotation.x = -Math.PI / 2;
      h.position.y = newHeight + 0.12;
      building.add(h);
    } else if (type === "industrial") {
      // Add storage tanks
      const tankGeometry = new THREE.CylinderGeometry(1, 1, 2, 16);
      const tankMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });

      for (let i = 0; i < 2; i++) {
        const tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.position.set(-1.5, newHeight / 2, i * 3 - 1.5);
        building.add(tank);
      }
    }
  }
}

// Create a park
function createPark(x, z, size, level) {
  const parkGroup = new THREE.Group();
  parkGroup.position.set(x, 0, z);
  parkGroup._isPark = true;

  // Create grass base
  const grassGeometry = new THREE.PlaneGeometry(size, size);
  const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x33aa33,
    roughness: 0.8,
  });
  const grass = new THREE.Mesh(grassGeometry, grassMaterial);
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = 0.01; // Slightly above ground
  parkGroup.add(grass);

  // Add trees
  const treeCount = Math.min(5, level * 2);
  for (let i = 0; i < treeCount; i++) {
    const tree = createTree();
    const angle = (i / treeCount) * Math.PI * 2;
    const radius = size * 0.4;
    tree.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    parkGroup.add(tree);
  }

  // Add benches
  const benchCount = Math.min(4, level * 2);
  for (let i = 0; i < benchCount; i++) {
    const bench = createBench();
    const angle = (i / benchCount) * Math.PI * 2;
    const radius = size * 0.3;
    bench.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    bench.rotation.y = angle + Math.PI / 2;
    parkGroup.add(bench);
  }

  // Add path
  const pathGeometry = new THREE.RingGeometry(size * 0.2, size * 0.25, 32);
  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0xccbb99 });
  const path = new THREE.Mesh(pathGeometry, pathMaterial);
  path.rotation.x = -Math.PI / 2;
  path.position.y = 0.02; // Slightly above grass
  parkGroup.add(path);

  // Store park data
  parkGroup.userData = {
    level: level,
    size: size,
    x: x,
    z: z,
  };

  scene.add(parkGroup);
  return parkGroup;
}

// Create a tree
function createTree() {
  const treeGroup = new THREE.Group();

  // Create trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 0.75;
  treeGroup.add(trunk);

  // Create foliage
  const foliageGeometry = new THREE.ConeGeometry(1, 2, 8);
  const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228822 });
  const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
  foliage.position.y = 2.5;
  treeGroup.add(foliage);

  return treeGroup;
}

// Create a fountain
function createFountain() {
  const fountainGroup = new THREE.Group();

  // Create base
  const baseGeometry = new THREE.CylinderGeometry(1.5, 1.7, 0.5, 16);
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 0.25;
  fountainGroup.add(base);

  // Create water pool
  const poolGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.2, 16);
  const poolMaterial = new THREE.MeshStandardMaterial({
    color: 0x3399ff,
    transparent: true,
    opacity: 0.7,
  });
  const pool = new THREE.Mesh(poolGeometry, poolMaterial);
  pool.position.y = 0.5;
  fountainGroup.add(pool);

  // Create center column
  const columnGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8);
  const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const column = new THREE.Mesh(columnGeometry, columnMaterial);
  column.position.y = 0.9;
  fountainGroup.add(column);

  // Create water particles
  const particleCount = 100;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleData = [];

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const x = (Math.random() - 0.5) * 0.5;
    const y = 1.3; // Start at top of column
    const z = (Math.random() - 0.5) * 0.5;

    particlePositions[i3] = x;
    particlePositions[i3 + 1] = y;
    particlePositions[i3 + 2] = z;

    particleData.push({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        Math.random() * 0.1 + 0.05,
        (Math.random() - 0.5) * 0.05
      ),
      initialY: y,
    });
  }

  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3)
  );

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x66ccff,
    size: 0.1,
    transparent: true,
    opacity: 0.7,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  fountainGroup.add(particles);

  // Store particle data for animation
  fountainGroup.userData = {
    particles: particles,
    particleData: particleData,
  };

  return fountainGroup;
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
