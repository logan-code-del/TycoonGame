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

// Initialize renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Add orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 10;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI / 2.1; // Prevent going below ground

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
  renderer.domElement = document.getElementById("gameCanvas");
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

  // Add lights
  addLights();

  // Add initial terrain
  addInitialTerrain();

  // Update UI
  updateMoneyDisplay();
  updatePopulationDisplay();
  updateHappinessDisplay();
  updateUpgradeButtons();

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
      createBus("eastWest");
      createBus("northSouth");
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

  // Update day/night cycle
  updateDayNightCycle();

  // Update building animations
  updateBuildingAnimations();

  // Update traffic lights
  updateTrafficLights();

  // Render scene
  renderer.render(scene, camera);
}

// Update traffic lights
function updateTrafficLights() {
  scene.traverse((object) => {
    if (object._isTrafficLight) {
      const data = object.userData;
      data.timer += 1;

      // Change light every 90 frames (about 3 seconds)
      if (data.timer >= 90) {
        data.timer = 0;

        // Cycle through states: red -> green -> yellow -> red
        if (data.state === "red") {
          data.redLight.emissiveIntensity = 0.2;
          data.greenLight.emissiveIntensity = 0.8;
          data.state = "green";
        } else if (data.state === "green") {
          data.greenLight.emissiveIntensity = 0.2;
          data.yellowLight.emissiveIntensity = 0.8;
          data.state = "yellow";
        } else {
          data.yellowLight.emissiveIntensity = 0.2;
          data.redLight.emissiveIntensity = 0.8;
          data.state = "red";
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

  // Create bus body
  const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.8;
  busGroup.add(body);

  // Create wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

  const wheelPositions = [
    [-0.8, 0.3, -1.5],
    [0.8, 0.3, -1.5],
    [-0.8, 0.3, 1.5],
    [0.8, 0.3, 1.5],
  ];

  wheelPositions.forEach((pos) => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(pos[0], pos[1], pos[2]);
    wheel.rotation.z = Math.PI / 2;
    busGroup.add(wheel);
  });

  // Create windows
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.7,
  });

  // Side windows
  const sideWindowGeometry = new THREE.PlaneGeometry(1.8, 0.6);

  const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
  leftWindow.position.set(-1.01, 1, 0);
  leftWindow.rotation.y = Math.PI / 2;
  busGroup.add(leftWindow);

  const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
  rightWindow.position.set(1.01, 1, 0);
  rightWindow.rotation.y = -Math.PI / 2;
  busGroup.add(rightWindow);

  // Front and back windows
  const frontBackWindowGeometry = new THREE.PlaneGeometry(1.8, 0.6);

  const frontWindow = new THREE.Mesh(frontBackWindowGeometry, windowMaterial);
  frontWindow.position.set(0, 1, -2.01);
  busGroup.add(frontWindow);

  const backWindow = new THREE.Mesh(frontBackWindowGeometry, windowMaterial);
  backWindow.position.set(0, 1, 2.01);
  backWindow.rotation.y = Math.PI;
  busGroup.add(backWindow);

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

// Create a building
function createBuilding(x, z, type) {
  const buildingGroup = new THREE.Group();
  buildingGroup.position.set(x, 0, z);
  buildingGroup.userData = {
    type: type,
    level: 1,
    income: buildingTypes[type].income,
    isBuilding: true,
  };

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

  scene.add(buildingGroup);

  // Add building to game state
  gameState.buildings.push(buildingGroup.userData);

  return buildingGroup;
}
// Update building income based on surroundings and level
function updateBuildingIncome(buildingData) {
  const baseIncome = buildingTypes[buildingData.type].income;
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
  document.getElementById(
    `build${type.charAt(0).toUpperCase() + type.slice(1)}`
  ).textContent = `${capitalizeFirstLetter(type)} ($${cost.toLocaleString()})`;
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

        // Add buses for level 3
        createBus("eastWest");
        createBus("northSouth");
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
    totalIncome += building.income;
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
  const populationDensity =
    gameState.population /
    gameState.buildings.filter((b) => b.type === "residential").length;
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
    if (gameState.buildMode === 'residential' || 
        gameState.buildMode === 'commercial' || 
        gameState.buildMode === 'industrial') {
        
        // Find intersection with ground plane
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(groundPlane, target)) {
            // Round to grid
            const x = Math.round(target.x / 5) * 5;
            const z = Math.round(target.z / 5) * 5;
            
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

                showNotification(`Built ${gameState.buildMode} building for ${buildingCost.toLocaleString()}`);
                
                // Keep build mode active for multiple placements
                // Update placement indicator position
                if (gameState.placementIndicator) {
                    gameState.placementIndicator.position.set(x, 0, z);
                }
            } else {
                showNotification(`Not enough money to build ${gameState.buildMode} building`);
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

  // Check if we should add a traffic light
  if (Math.random() < 0.2) {
    createTrafficLight(x, z);
  }

  // Check if we should add a street lamp
  if (Math.random() < 0.3) {
    createStreetLamp(x + 2, z);
  }
}

// Create a traffic light
function createTrafficLight(x, z) {
  const trafficLightGroup = new THREE.Group();
  trafficLightGroup.position.set(x + 2, 0, z + 2);

  // Create pole
  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.y = 1.5;
  trafficLightGroup.add(pole);

  // Create light housing
  const housingGeometry = new THREE.BoxGeometry(0.4, 1, 0.4);
  const housingMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const housing = new THREE.Mesh(housingGeometry, housingMaterial);
  housing.position.y = 2.5;
  trafficLightGroup.add(housing);

  // Create lights
  const lightGeometry = new THREE.CircleGeometry(0.1, 16);

  // Red light
  const redLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.8,
  });
  const redLight = new THREE.Mesh(lightGeometry, redLightMaterial);
  redLight.position.set(0, 2.8, 0.21);
  redLight.rotation.x = -Math.PI / 2;
  trafficLightGroup.add(redLight);

  // Yellow light
  const yellowLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 0.5,
  });
  const yellowLight = new THREE.Mesh(lightGeometry, yellowLightMaterial);
  yellowLight.position.set(0, 2.5, 0.21);
  yellowLight.rotation.x = -Math.PI / 2;
  trafficLightGroup.add(yellowLight);

  // Green light
  const greenLightMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    emissive: 0x00ff00,
    emissiveIntensity: 0.5,
  });
  const greenLight = new THREE.Mesh(lightGeometry, greenLightMaterial);
  greenLight.position.set(0, 2.2, 0.21);
  greenLight.rotation.x = -Math.PI / 2;
  trafficLightGroup.add(greenLight);

  // Store materials for animation
  trafficLightGroup.userData = {
    redLight: redLightMaterial,
    yellowLight: yellowLightMaterial,
    greenLight: greenLightMaterial,
    state: "red",
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
  const upgradeCost = (buildingData.level || 1) * buildingTypes[buildingData.type].cost;
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
  const upgradeCost = currentLevel * buildingTypes[buildingData.type].cost;

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
