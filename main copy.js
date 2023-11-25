// Import modules
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import proj4 from 'proj4';
import '/style.css'; 
import hull from 'convex-hull';
import Graph from 'graphology';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// Define global geographic layer groups
let fmTransmitterPoints = new THREE.Group();
let fmMSTLines = new THREE.Group();
let cellTransmitterPoints = new THREE.Group();
let cellMSTLines = new THREE.Group();
let contourLines = new THREE.Group();
let fmPropagationPolygons = new THREE.Group();

// Define color scheme variables
const colorScheme = {
  graticuleColor: "#2f2f2f0b", // Bright green
  ambientLightColor: "#404040", // Dark gray
  directionalLightColor: "#ffffff", // White
  backgroundColor: "#000000", // Black
  polygonColor: "#FF1493", // Pink
  pyramidColorFM: "#FFFF00", // Yellow
  pyramidColorCellular: "#FF5F1F", // neon orange
  // lowestElevationColor: "#0000ff", // Blue
  // middleElevationColor: "#00ff00", // Green
  // highestElevationColor: "#ff0000", // Red
  mstFmColor: "#FFFF00", // yellow
  mstCellColor: "#FF5F1F" // neon orange
};

// Alternate color scheme
// const colorScheme = {
//   graticuleColor: "#6F70A7",
//   ambientLightColor: "#4e4c4c",
//   directionalLightColor: "#ddddff",
//   backgroundColor: "#021424",
//   polygonColor: "#14743c",
//   pyramidColorFM: "#FC5553",
//   pyramidColorCellular: "#53FC86",
//   lowestElevationColor: "#0f2df2",
//   middleElevationColor: "#B260FC",
//   highestElevationColor: "#ad99f9",
// };


// Define the custom projection with its PROJ string
const statePlaneProjString = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
proj4.defs("EPSG:32118", statePlaneProjString);

// Use this function to convert lon/lat to State Plane coordinates
function toStatePlane(lon, lat) {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    throw new Error(`Invalid coordinates: longitude (${lon}), latitude (${lat})`);
  }
  return proj4("EPSG:32118").forward([lon, lat]);
}



//////////////////////////////////////
// loading screen! //////////////////

let itemsToLoad = 4; // Update this with the number of assets you are loading
let itemsLoaded = 0;
let bufferDuration = 600;
const spinnerCharacters = ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'];
let currentSpinnerIndex = 0;
let lastSpinnerUpdateTime = 0;
const spinnerUpdateRate = 75; // Update spinner every 75 ms
// Create a material for the ray line
const rayMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red color for visibility
// Create a geometry for the ray line
const rayGeometry = new THREE.BufferGeometry();
const rayLine = new THREE.Line(rayGeometry, rayMaterial);

// Call this function to update the spinner using requestAnimationFrame
function animateSpinner(timestamp) {
  // Check if it's time to update the spinner character
  if (timestamp - lastSpinnerUpdateTime > spinnerUpdateRate) {
    lastSpinnerUpdateTime = timestamp;
    const progressBar = document.getElementById('progress-bar');
    progressBar.textContent = spinnerCharacters[currentSpinnerIndex];
    currentSpinnerIndex = (currentSpinnerIndex + 1) % spinnerCharacters.length;
  }

  // Continue the spinner animation
  requestAnimationFrame(animateSpinner);
}

// Start the spinner animation
requestAnimationFrame(animateSpinner);

// Initialize the progress bar to start at 0%
let progressBar = document.getElementById('progress-bar');
progressBar.style.width = '0%';

// Define your steps and their durations
const loadingSteps = [
  // { progress: 25, duration: 150 },  // 25% in 750ms
  // { progress: 50, duration: 450 },  // 50% in 750ms
  // { progress: 75, duration: 750 },  // 75% in 750ms
  { progress: 100, duration: bufferDuration }  // 100% in 750ms
];

let currentStep = 0;
let startTime = null;
let lastProgress = 0;

// Function to update the progress bar smoothly
function animateProgressBar(timestamp) {
  if (startTime === null) startTime = timestamp;
  const step = loadingSteps[currentStep];

  // Calculate progress based on time elapsed
  const elapsedTime = timestamp - startTime;
  const progress = lastProgress + (step.progress - lastProgress) * (elapsedTime / step.duration);

  // Set the width of the progress bar
  // progressBar.style.width = `${progress}%`;

  // Check if we should move to the next step
  if (elapsedTime < step.duration) {
    // Continue the animation
    requestAnimationFrame(animateProgressBar);
  } else {
    // Move to the next step
    startTime = timestamp;
    lastProgress = step.progress;
    currentStep++;

    if (currentStep < loadingSteps.length) {
      requestAnimationFrame(animateProgressBar);
    } else {
      // Animation complete
      // progressBar.textContent = "lfg";
      // Transition to your visualization
      setTimeout(() => {
        progressBar.style.display = 'none'; // Optionally hide the progress bar
        const visualizationContainer = document.getElementById('three-container');
        visualizationContainer.style.visibility = 'visible'; // Make the three.js container visible
      }, 500); // Short delay for the transition, can be adjusted or removed as needed
    }
  }
}

// Three.js - Initialize the Scene
let scene, camera, renderer, controls;
let infoVisible = false;
let isCameraLocked = false;
let globalBoundingBox
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let polygons = [];



function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.up.set(0, 0, 1); // Set Z as up-direction 
    camera.position.z = 20; // Adjust as necessary

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('three-container').appendChild(renderer.domElement);

    rayGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));

    // Create the line and add it to the scene
    scene.add(rayLine);
    rayLine.scale.set(1, 1, 1); // Make sure the scale is appropriate
    rayLine.material.linewidth = 2; // Increase the line width for visibility

    // Initialize MapControls
    controls = new MapControls(camera, renderer.domElement);

    // Set up the control parameters as needed for a mapping interface
    controls.screenSpacePanning = false;
    controls.enableRotate = false; // typically map interfaces don't use rotation
    controls.enableDamping = true; // an optional setting to give a smoother control feeling
    controls.dampingFactor = 0.05; // amount of damping (drag)

    // Set the minimum and maximum polar angles (in radians) to prevent the camera from going over the vertical
    controls.minPolarAngle = 0; // 0 radians (0 degrees) - directly above the target
    controls.maxPolarAngle = (Math.PI / 2) - 0.05; // π/2 radians (90 degrees) - on the horizon
    // Set the maximum distance the camera can dolly out
    controls.maxDistance = 4.5;
    controls.minDistance = 0.2; 

    const audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    
    let ambientLight = new THREE.AmbientLight(colorScheme.ambientLightColor);
    scene.add(ambientLight);
    let directionalLight = new THREE.DirectionalLight(colorScheme.directionalLightColor, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);
    renderer.setClearColor(colorScheme.backgroundColor);
    window.addEventListener('resize', onWindowResize, false);
    adjustCameraZoom();
}

///////////////////////////////////////////////////// 
// DOM MODS AND EVENT LISTENERS ////////////////////

// Resize function
function onWindowResize() {
  if (camera && renderer) {
    // Update camera aspect
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Adjust zoom based on window size
    adjustCameraZoom();
  }
}


function adjustCameraZoom() {
  if (camera) {
    // Example of dynamic FOV scaling:
    // - If the window width is 600px or less, use a FOV of 90
    // - If the window width is 1200px or more, use a FOV of 60
    // - Scale linearly between those values for window widths in between
    const minWidth = 600;
    const maxWidth = 1200;
    const minFov = 90;
    const maxFov = 60;

    // Map the window width to the FOV range
    const scale = (window.innerWidth - minWidth) / (maxWidth - minWidth);
    const fov = minFov + (maxFov - minFov) * Math.max(0, Math.min(1, scale));

    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
}

// Initial call to set up the zoom level
adjustCameraZoom();



// check if mouseover is intersecting polygons
// function checkIntersection() {
//   raycaster.setFromCamera(mouse, camera);
  
//   // Update the ray line geometry
//   const rayDirection = new THREE.Vector3();
//   raycaster.ray.direction.normalize();

//   const startPoint = raycaster.ray.origin.clone();
//   const endPoint = startPoint.clone().add(rayDirection.clone().multiplyScalar(1000)); // Adjust length as needed

//   const positions = rayLine.geometry.attributes.position.array;
//   positions[0] = startPoint.x;
//   positions[1] = startPoint.y;
//   positions[2] = startPoint.z;
//   positions[3] = endPoint.x;
//   positions[4] = endPoint.y;
//   positions[5] = endPoint.z;
//   rayLine.geometry.attributes.position.needsUpdate = true;


//   raycaster.setFromCamera(mouse, camera);
//   const intersects = raycaster.intersectObjects(polygons, true); // Only check polygons

//   // console.log("Intersected Objects:", intersects.length); // Log the number of intersections

//   if (intersects.length > 0) {
//     let intersected = intersects[0].object;
//     if (intersected.name.startsWith('polygon-')) {
//       intersected.material.opacity = 1.0; // Full opacity when hovered
//     }
//   } else if (intersectedObject) {
//     intersectedObject.material.opacity = 0.2; // Lower opacity when not hovered
//     intersectedObject = null;
//   }
// }



// Function to animate your scene
function animate() {
    requestAnimationFrame(animate);
    checkIntersection(); // Check for mouse-polygon intersection
    controls.update();
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', (event) => {
  const startButton = document.getElementById('start-button');
  const progressBar = document.getElementById('progress-bar');
  const threeContainer = document.getElementById('three-container');
  const infoButton = document.getElementById('info-button');

  // Initially hide the progress bar
  progressBar.style.visibility = 'hidden';
  infoButton.style.visibility = 'hidden'; 

  // Function to initialize the scene and other components
  function initialize() {
    // initAudio(); // Initialize audio if necessary
    loadGeoJSONData(); // Load your GeoJSON or other data
    initThreeJS(); // Initialize Three.js
    hideInfoBox(); // Hide the information box if it should be hidden initially
  }

  // Function to enable the interactive elements
  function enableInteraction() {
    threeContainer.style.pointerEvents = 'auto';
    threeContainer.style.opacity = '1';
    infoButton.style.pointerEvents = 'auto';
    infoButton.style.opacity = '1';
    progressBar.style.visibility = 'visible'; 
    requestAnimationFrame(animateProgressBar)

    // Start button event listener
    startButton.addEventListener('click', () => {
      enableInteraction(); // Call this function on start button click
      // initAudio(); // Uncomment this if you need to initialize audio here
    });
    
    // Remove the start button after it's clicked
    startButton.remove();

    // Hide the progress bar with a delay
    setTimeout(() => {
      const progressBar = document.getElementById('progress-bar');
      infoButton.style.visibility = 'visible'; 
      // console.log(bufferDuration)
    }, bufferDuration); // Delay hiding the progress bar for N ms

    // Call the functions to initialize the audio and start the visualization
    // initAudio();
    animate();
    lockCameraTopDown(false); // Ensure this is called after controls are initialized
    document.addEventListener('keydown', onDocumentKeyDown, false); // Attach the keydown event handler

  }

  // Start button event listener
  startButton.addEventListener('click', enableInteraction);

  // Call initialize immediately on page load
  initialize();

});


/////////////////////////////////////
///////// MAP LEGEND ///////////////


// Function to hide the information container and show the info button
function hideInfoBox() {
  const infoContainer = document.getElementById('info-container');
  const infoButton = document.getElementById('info-button');
  // Check if the info container is already hidden to prevent unnecessary style changes
  if (infoContainer.style.opacity !== '0') {
    infoContainer.style.opacity = '0'; // Start the fade out
    infoContainer.style.pointerEvents = 'none'; // Make it non-interactive immediately
    infoButton.style.display = 'block'; // Show the info button
    infoVisible = false;
  }
}

// Function to show the information container and hide the info button
function showInfoBox() {
  const infoContainer = document.getElementById('info-container');
  const infoButton = document.getElementById('info-button');
  infoContainer.style.opacity = '1'; // Start the fade in
  infoContainer.style.visibility = 'visible'; // Make it visible immediately
  infoContainer.style.pointerEvents = 'auto'; // Make it interactive again
  infoButton.style.display = 'none'; // Hide the info button
  infoVisible = true;
}

// Add the transitionend event listener
document.getElementById('info-container').addEventListener('transitionend', function(event) {
  if (event.propertyName === 'opacity' && getComputedStyle(this).opacity == 0) {
    this.style.visibility = 'hidden'; // Hide the container after transition
  }
});

// Call this initially if you want the info box to start visible
showInfoBox();

// Set up event listeners for mousedown and keypress events to hide the info box
// Existing event listeners
document.addEventListener('mousedown', (event) => {
  // Check if the target is not the checkbox or its label
  if (event.target.id !== 'camera-lock' && event.target.htmlFor !== 'camera-lock') {
    hideInfoBox();
  }
});

document.addEventListener('keypress', hideInfoBox);


// Event listener for the info button to unhide the info box
document.getElementById('info-button').addEventListener('click', function () {
    showInfoBox();
});


// Function to add checkboxes for layer visibility control
function addLayerVisibilityControls() {
  const infoContainer = document.getElementById('info-container');
  const layers = [
    { name: 'fm transmitter points', color: colorScheme.pyramidColorFM },
    { name: 'fm minimum spanning tree lines', color: colorScheme.mstFmColor },
    { name: 'cell transmitter points', color: colorScheme.pyramidColorCellular },
    { name: 'cell MST lines', color: colorScheme.mstCellColor },
    { name: 'contour lines', color: colorScheme.lowestElevationColor },
    { name: 'fm propagation polygons', color: colorScheme.polygonColor }
  ];

  layers.forEach(layer => {
    const container = document.createElement('div');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = layer.name;
    checkbox.name = layer.name;
    checkbox.checked = true;  // Set to true if you want the layers to be visible by default

    const label = document.createElement('label');
    label.htmlFor = layer.name;
    label.textContent = layer.name;
    label.style.color = layer.color;  // Set the label text color based on the layer color

    container.appendChild(checkbox);
    container.appendChild(label);
    infoContainer.appendChild(container);

    // Add event listener to toggle layer visibility
    checkbox.addEventListener('change', function() {
      toggleLayerVisibility(layer.name, this.checked);
    });
  });
}

// You can then map these to the names used in the checkboxes
const layerObjects = {
  'fm transmitter points': fmTransmitterPoints,
  'fm minimum spanning tree lines': fmMSTLines,
  'cell transmitter points': cellTransmitterPoints,
  'cell MST lines': cellMSTLines,
  'contour lines': contourLines,
  'fm propagation polygons': fmPropagationPolygons
};

// Function to toggle layer visibility
function toggleLayerVisibility(layerName, isVisible) {
  // Check if the layer object exists
  if (layerObjects[layerName]) {
    // Set the visibility of the layer
    layerObjects[layerName].visible = isVisible;
  } else {
    console.warn(`Layer "${layerName}" not found in the scene.`);
  }

  // Update the renderer if needed
  // renderer.render(scene, camera);
}

///////////////////////////////////////////////////////
// AUDIO LISTENERS ///////////////////////////////////

// Declare the audioListener at the top level so it's accessible everywhere
let audioListener;

// Add a user gesture event listener to resume the audio context
document.addEventListener('click', function initAudio() {
  // Check if audioListener is already initialized to avoid multiple initializations
  if (!audioListener) {
    audioListener = new THREE.AudioListener();
    camera.add(audioListener);
    // Resume the audio context if it's not in the running state
    if (audioListener.context.state === 'suspended') {
      audioListener.context.resume();
    }
  }
  // Remove the event listener after the initial interaction
  document.removeEventListener('click', initAudio);
});

///////////////////////////////////////////////////
// MOUSEOVER TRANSITIONS /////////////////////////

// add mouseover polygon opacity shifts &
// reduce mouseover event listener transactions
let debounceTimer;
const debounceInterval = 100; // milliseconds

let intersectedObject = null;

function onMouseMove(event) {
  // Update the mouse position
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  // console.log("Mouse moved:", mouse.x, mouse.y); // Log mouse position

  // Perform raycasting less frequently
  if (!intersectedObject) {
    checkIntersection();
  }
}

window.addEventListener('mousemove', onMouseMove, false);

///////////////////////////////////////////////////// 
// CAMERA SETTINGS AND CONTROLS ////////////////////

// Define pan speed
const panSpeed = .05;

// Function to handle keyboard events for panning
function onDocumentKeyDown(event) {

  // Toggle camera lock on 'L' key press
  if (event.key === 'l' || event.key === 'L') {
    lockCameraTopDown(!isCameraLocked);
    event.preventDefault(); // Prevent default action for 'L' key
    return; // Exit the function after toggling the lock
}
  
  if (isCameraLocked) {
    // Ignore R and F keys when camera is locked
    if (event.key === 'r' || event.key === 'f') {
      return;
    }
  event.preventDefault();

  const rotationSpeed = 0.025; // Speed of rotation
  const vector = new THREE.Vector3(); // Create once and reuse it to avoid garbage collection
  const axis = new THREE.Vector3(1, 0, 0); // X axis for world space rotation
  

  console.log(`Key pressed: ${event.key}`); // Log which key was pressed


  switch (event.key) {
      // WASD keys for panning
      case 'w':
          camera.position.y += panSpeed;
          controls.target.y += panSpeed;
          break;
      case 's':
          camera.position.y -= panSpeed;
          controls.target.y -= panSpeed;
          break;
      case 'a':
          camera.position.x -= panSpeed;
          controls.target.x -= panSpeed;
          break;
      case 'd':
          camera.position.x += panSpeed;
          controls.target.x += panSpeed;
          break;
      case 'f': // Rotate counter-clockwise
      case 'r': // Rotate clockwise
          const angle = (event.key === 'f' ? 1 : -1) * rotationSpeed;
          vector.copy(camera.position).sub(controls.target);
          const currentPolarAngle = vector.angleTo(new THREE.Vector3(0, 0, 1));
          const newPolarAngle = currentPolarAngle + angle;
      
          // Check if the new angle is within the bounds
          if (newPolarAngle >= 0 && newPolarAngle <= Math.PI / 2) {
              const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
              vector.applyQuaternion(quaternion);
              camera.position.copy(controls.target).add(vector);
              camera.lookAt(controls.target); // Keep the camera looking at the target
          }
          break;
      }
  
      controls.update();
  }}
  
  document.addEventListener('keydown', onDocumentKeyDown, false);
  

// Define pan speed
const minPanSpeed = 0.05; // Minimum panning speed (when zoomed out)
const maxPanSpeed = 0.2;  // Maximum panning speed (when zoomed in)

// Function to handle panning with dynamic speed
// function panCamera(dx, dy) {
//   // Calculate dynamic pan speed based on camera's distance from the target
//   const distance = camera.position.distanceTo(controls.target);
//   const panSpeed = THREE.MathUtils.lerp(maxPanSpeed, minPanSpeed, distance / controls.maxDistance);

//   // Apply the calculated pan speed
//   const deltaX = dx * panSpeed;
//   const deltaY = dy * panSpeed;

//   camera.position.x += deltaX;
//   camera.position.y += deltaY;
//   controls.target.x += deltaX;
//   controls.target.y += deltaY;

//   controls.update();
// }

function getBoundingBoxOfGeoJSON(geojson) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  // Function to process each coordinate pair
  const processCoordinates = (coords) => {
    coords.forEach(coord => {
      // If it's a MultiLineString, coord will be an array of coordinate pairs
      if (Array.isArray(coord[0])) {
        processCoordinates(coord); // Recursive call for arrays of coordinates
      } else {
        // Assuming coord is [longitude, latitude]
        const [lon, lat] = coord;

        // Transform the coordinates
        const [x, y] = toStatePlane(lon, lat);

        // Update the min and max values
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    });
  };

  // Iterate over each feature
  geojson.features.forEach(feature => {
    processCoordinates(feature.geometry.coordinates);
  });

  // Return bounding box with min and max as THREE.Vector3 objects
  return {
    min: new THREE.Vector3(minX - 2, minY - 2, -Infinity),
    max: new THREE.Vector3(maxX + 2, maxY + 2, Infinity)
  };
}


function constrainCamera(controls, boundingBox) {
  controls.addEventListener('change', () => {
    // Clamp the camera position within the bounding box
    camera.position.x = Math.max(boundingBox.min.x, Math.min(boundingBox.max.x, camera.position.x));
    camera.position.y = Math.max(boundingBox.min.y + 0.25, Math.min(boundingBox.max.y, camera.position.y));
    camera.position.z = Math.max(boundingBox.min.z, Math.min(boundingBox.max.z, camera.position.z));
    
    // Clamp the controls target within the bounding box
    controls.target.x = Math.max(boundingBox.min.x, Math.min(boundingBox.max.x, controls.target.x));
    controls.target.y = Math.max(boundingBox.min.y, Math.min(boundingBox.max.y, controls.target.y));
    controls.target.z = Math.max(boundingBox.min.z, Math.min(boundingBox.max.z, controls.target.z));

  });
}


// Function to get the center of the bounding box
// This function is correct but make sure it's called after the lines are added to the scene
function getCenterOfBoundingBox(boundingBox) {
  return new THREE.Vector3(
    (boundingBox.min.x + boundingBox.max.x) / 2,
    (boundingBox.min.y + boundingBox.max.y) / 2,
    0 // Assuming Z is not important for centering in this case
  );
}

// Ensure that you get the size correctly
function getSizeOfBoundingBox(boundingBox) {
  return new THREE.Vector3(
    boundingBox.max.x - boundingBox.min.x,
    boundingBox.max.y - boundingBox.min.y,
    boundingBox.max.z - boundingBox.min.z
  );
}

// Adjust the camera to view the entire extent of the GeoJSON features
// function adjustCameraToBoundingBox(camera, controls, boundingBox) {
//   const center = getCenterOfBoundingBox(boundingBox);
//   const size = getSizeOfBoundingBox(boundingBox);
//   const maxDim = Math.max(size.x, size.y);
//   const fov = camera.fov * (Math.PI / 180);
//   let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)); // Adjust the 2 to frame the scene

//   cameraZ *= 1.1; // Slight adjustment to ensure the features are fully visible
//   camera.position.set(center.x, center.y, cameraZ);
//   controls.target.set(center.x, center.y, 0);
//   controls.update();
// }

// Function to lock the camera to a top-down view
// Function to calculate the camera Z position to view the entire bounding box
function calculateCameraZToFitBoundingBox(boundingBox) {
  const center = getCenterOfBoundingBox(boundingBox);
  const size = getSizeOfBoundingBox(boundingBox);
  const maxDim = Math.max(size.x, size.y);
  const fov = camera.fov * (Math.PI / 100);
  
  // Calculate the Z position where the entire bounding box is in view
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  cameraZ *= 1.1; // Scale factor to ensure everything is within view, adjust as needed
  return cameraZ;
}

function lockCameraTopDown(isLocked) {
  isCameraLocked = isLocked;
  if (!controls || !camera) return; // Ensure controls and camera are initialized

  if (isLocked) {
    if (!globalBoundingBox) {
      console.error('globalBoundingBox is not set');
      return;
    }
    const center = getCenterOfBoundingBox(globalBoundingBox);
    const cameraZ = calculateCameraZToFitBoundingBox(globalBoundingBox);

    // Position the camera at the center of the bounding box at the appropriate Z height
    camera.position.set(center.x, center.y, cameraZ);

    // Point the camera straight down by looking at the center of the bounding box
    camera.lookAt(center.x, center.y, 0);

    // Calculate north direction in the State Plane coordinate system
    // Adjust this vector if your north direction is different
    const northDirection = new THREE.Vector3(0, 1, 0);

    // Rotate the camera to face north by setting the up vector
    camera.up.copy(northDirection);
    camera.up.set(0, 1, 0); 
    camera.lookAt(center); // Look at the center again to apply the up vector

    // With MapControls, the camera.up is typically (0, 1, 0) and should not need changing
    controls.enablePan = true; // Enable panning
    controls.enableRotate = false; // Disable rotation
    controls.update();
  } else {
    // Restore interactive rotation if desired when not locked
    camera.up.set(0, 0, 1); 
    controls.enableRotate = true;
    controls.update();
  }
}



// Call this function initially to set up the default state
lockCameraTopDown(false);


// Update the checkbox event listener to pass the boundingBox
// In your event listeners
document.getElementById('camera-lock').addEventListener('change', (event) => {
  lockCameraTopDown(event.target.checked);
});


// Add this event listener to stop the propagation of the click event
document.getElementById('camera-lock').addEventListener('click', (event) => {
  event.stopPropagation(); // This will prevent the click from reaching the document level
});

///////////////////////////////////////////////////// 
// GEOGRAPHIC DATA VIS /////////////////////////////

// Define a scaling factor for the Z values (elevation)
const zScale = 0.0004; // Change this value to scale the elevation up or down

// Function to get color based on elevation
function getColorForElevation(elevation, minElevation, maxElevation) {
  const gradient = [
    { stop: 0.0, color: new THREE.Color("#0000ff") }, // Blue at the lowest
    { stop: 0.2, color: new THREE.Color("#007fff") }, // Lighter blue
    { stop: 0.4, color: new THREE.Color("#00ff95") }, // Cyan-ish blue
    { stop: 0.5, color: new THREE.Color("#00ff00") }, // Green at the middle
    { stop: 0.6, color: new THREE.Color("#bfff00") }, // Yellow-green
    { stop: 0.8, color: new THREE.Color("#ffbf00") }, // Orange
    { stop: 1.0, color: new THREE.Color("#ff0000") }  // Red at the highest
  ];

  const t = (elevation - minElevation) / (maxElevation - minElevation);

  let lowerStop = gradient[0], upperStop = gradient[gradient.length - 1];
  for (let i = 0; i < gradient.length - 1; i++) {
    if (t >= gradient[i].stop && t <= gradient[i + 1].stop) {
      lowerStop = gradient[i];
      upperStop = gradient[i + 1];
      break;
    }
  }

  const color = lowerStop.color.clone().lerp(upperStop.color, (t - lowerStop.stop) / (upperStop.stop - lowerStop.stop));
  return color;
}


// Define a variable to store the minimum elevation
// This should be determined from the addContourLines function
let globalMinElevation = Infinity;

// Updated addContourLines function to update globalMinElevation
function addContourLines(geojson) {
  if (!geojson || !geojson.features) {
    console.error('Invalid GeoJSON data');
    return;
  }

  let contourLines = new THREE.Group(); // Create a new group for contour lines

  // Determine min and max elevation from the geojson
  const elevations = geojson.features.map(f => f.properties.contour);
  const minElevation = Math.min(...elevations);
  globalMinElevation = Math.min(globalMinElevation, minElevation); // Update the global minimum elevation
  const maxElevation = Math.max(...elevations);

  geojson.features.forEach((feature, index) => {
    const contour = feature.properties.contour; // Elevation value
    const coordinates = feature.geometry.coordinates; // Array of [lon, lat] pairs

    const color = getColorForElevation(contour, minElevation, maxElevation);
    let material = new THREE.LineBasicMaterial({ color: color });

    // Function to process a single line
    const processLine = (lineCoords, contourValue) => {
      let vertices = [];
      lineCoords.forEach((pair) => {
        if (!Array.isArray(pair) || pair.length !== 2 || pair.some(c => isNaN(c))) {
          console.error(`Feature ${index} has invalid coordinates`, pair);
          return;
        }
        const [lon, lat] = pair;
        try {
          const [x, y] = toStatePlane(lon, lat);
          const z = contourValue * zScale; // Scale the elevation for visibility
          vertices.push(x, y, z);
        } catch (error) {
          console.error(`Feature ${index} error in toStatePlane:`, error.message);
        }
      });

      if (vertices.length > 0) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const line = new THREE.Line(geometry, material);
        contourLines.add(line);
      }
    };

    // Check geometry type and process accordingly
    if (feature.geometry.type === 'LineString') {
      processLine(coordinates, contour);
    } else if (feature.geometry.type === 'MultiLineString') {
      coordinates.forEach(lineCoords => {
        processLine(lineCoords, contour);
      });
    } else {
      console.error(`Unsupported geometry type: ${feature.geometry.type}`);
    }
  });

  scene.add(contourLines); // Add the group to the scene
}


function addPolygons(geojson, stride = 10) {
  fmPropagationPolygons = new THREE.Group(); // Create a new group for polygons
  // let polygons = []; // This array will store references to your polygon meshes

  for (let i = 0; i < geojson.features.length; i += stride) {
    const feature = geojson.features[i];

    // Create a new material for each polygon
    const material = new THREE.MeshBasicMaterial({
      color: colorScheme.polygonColor,
      transparent: true,
      wireframe: true,
      dithering: true,
      opacity: 0.8, // Start with lower opacity
      side: THREE.FrontSide
    });

    try {
      const shapeCoords = feature.geometry.coordinates[0]; // Assuming no holes in the polygon for simplicity
      const vertices = [];
      let centroid = new THREE.Vector3(0, 0, 0);

      // Convert coordinates to vertices and calculate centroid
      shapeCoords.forEach(coord => {
        const [x, y] = toStatePlane(coord[0], coord[1]);
        const z = globalMinElevation * zScale; // Set Z to the lowest contour elevation
        vertices.push(new THREE.Vector3(x, y, z));
        centroid.add(new THREE.Vector3(x, y, z));
      });

      centroid.divideScalar(shapeCoords.length); // Average to find centroid
      vertices.unshift(centroid); // Add centroid as the first vertex

      const shapeGeometry = new THREE.BufferGeometry();
      const positions = [];

      // The centroid is the first vertex, and it's connected to every other vertex
      for (let j = 1; j <= shapeCoords.length; j++) {
        // Add centroid
        positions.push(centroid.x, centroid.y, centroid.z);

        // Add current vertex
        positions.push(vertices[j % shapeCoords.length].x, vertices[j % shapeCoords.length].y, vertices[j % shapeCoords.length].z);

        // Add next vertex
        positions.push(vertices[(j + 1) % shapeCoords.length].x, vertices[(j + 1) % shapeCoords.length].y, vertices[(j + 1) % shapeCoords.length].z);
      }

      shapeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      shapeGeometry.computeVertexNormals();

      const mesh = new THREE.Mesh(shapeGeometry, material);
      mesh.name = 'polygon-' + i;
      scene.add(mesh);
      fmPropagationPolygons.add(mesh);
    } catch (error) {
      console.error(`Error processing feature at index ${i}:`, error);
    }
  }
  // Add the fmPropagationPolygons group to the scene
  scene.add(fmPropagationPolygons);
}


function addFMTowerPts(geojson) {

  let fmTransmitterPoints = new THREE.Group();
  let fmMSTLines = new THREE.Group();

  // Define the base size and height for the pyramids
  const baseSize = 0.003; // Size of one side of the pyramid's base
  const pyramidHeight = .015; // Height of the pyramid from the base to the tip

  // Material for the wireframe pyramids
  let pyramidMaterialFM = new THREE.MeshBasicMaterial({
    color: colorScheme.pyramidColorFM,
    wireframe: true,
    transparent: true,
    opacity: 0.5
  });

  const points = []; // Array to store points for the convex hull

  // Parse the POINT data from the GeoJSON
  geojson.features.forEach(feature => {
    if (feature.geometry.type === 'Point') {
      const [lon, lat] = feature.geometry.coordinates;
      const elevation = feature.properties.Elevation;

      try {
        // Convert the lon/lat to State Plane coordinates
        const [x, y] = toStatePlane(lon, lat);
        const z = elevation * zScale; // Apply the scaling factor to the elevation

        // Create a cone geometry for the pyramid
        const pyramidGeometry = new THREE.ConeGeometry(baseSize, pyramidHeight, 5);
        pyramidGeometry.rotateX(Math.PI / 2); // Rotate the pyramid to point up along the Z-axis

        const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterialFM);
        pyramid.position.set(x, y, z);
        fmTransmitterPoints.add(pyramid);

        // Add the position to the points array for convex hull calculation
        points.push(new THREE.Vector3(x, y, z));
      } catch (error) {
        console.error(`Error projecting point:`, error.message);
      }
    } else {
      console.error(`Unsupported geometry type for points: ${feature.geometry.type}`);
    }
  });

  scene.add(fmTransmitterPoints);

  // Create and add the convex hull to the scene
  if (points.length > 0) {
    // createConvexHullLines(points);
    // console.log("creating convex hull with " + points)

    // Construct the MST
    const fmMstEdges = primsAlgorithm(points);

    // Draw the MST
    drawMSTEdges(fmMstEdges, '#FFFFFF', colorScheme.mstFmColor, 0.00025, 0.00075, fmMSTLines);

  }

  scene.add(fmMSTLines);
  console.log('adding mstlines')

}


// Function to add wireframe pyramids and text labels for POINT data from GeoJSON
function addCellTowerPts(geojson, audioListener, buffer) {

  cellTransmitterPoints = new THREE.Group();
  cellMSTLines = new THREE.Group();

  // Define the base size and height for the pyramids
  const baseSize = 0.003; // This would be the size of one side of the pyramid's base
  const pyramidHeight = .015; // This would be the height of the pyramid from the base to the tip

  // Material for the wireframe pyramids
  let pyramidMaterialCellular = new THREE.MeshBasicMaterial({
    color: colorScheme.pyramidColorCellular,
    wireframe: true,
    transparent: true,
    opacity: 0.4
  });

  const points = []; // Array to store points for the convex hull

  // Parse the POINT data from the GeoJSON
// Parse the POINT data from the GeoJSON
geojson.features.forEach((feature, index) => {
  if (feature.geometry.type === 'Point') {
    // Directly use the coordinates array
    const [lon, lat] = feature.geometry.coordinates;
    const elevation = feature.properties.Elevation;

      try {
        // Convert the lon/lat to State Plane coordinates
        const [x, y] = toStatePlane(lon, lat);
        const z = elevation * zScale; // Apply the scaling factor to the elevation

        // Create a cone geometry for the pyramid with the defined base size and height
        const pyramidGeometry = new THREE.ConeGeometry(baseSize, pyramidHeight, 4);
        pyramidGeometry.rotateX(Math.PI / 2); // Rotate the pyramid to point up along the Z-axis

        const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterialCellular);
        pyramid.position.set(x, y, z);
  
        // Add the pyramid to the cellTransmitterPoints group
        cellTransmitterPoints.add(pyramid);
  
        // // Positional audio
        // const sound = new THREE.PositionalAudio(audioListener);
        // sound.setBuffer(buffer);
        // sound.setRefDistance(1);
        // sound.setLoop(true);
        // sound.setVolume(0.5);
        // pyramid.add(sound); // Attach the sound to the pyramid mesh
        // sound.play(); // Start playing the sound

        // Check for coincident points and get a z-offset
        const label = feature.properties.Callsign || `Tower ${index}`;
        // const zOffset = getCoincidentPointOffset(lon, lat, 8, 0.00001);
        const zOffset = getCoincidentPointOffset(lon, lat, label, 4, 0.0001);


        // Ensure Callsign or another property is correctly referenced
        // const label = feature.properties.Callsign || `Tower ${index}`;

        const textSprite = makeTextSprite(` ${label} `, {
        
          fontsize: 24,
          strokeColor: "rgba(255, 255, 255, 0.9)",
          strokeWidth: 1,

          // borderColor: { r: 255, g: 0, b: 0, a: 1.0 },
          // backgroundColor: { r: 255, g: 100, b: 100, a: 0.8 }
        });
    
        // Position the sprite above the pyramid
        const pyramidHeightScaled = pyramidHeight * zScale;

        // Position the sprite above the pyramid, applying the offset for coincident points
        textSprite.position.set(x, y, z + pyramidHeightScaled + zOffset + 0.009);
        textSprite.scale.set(0.05, 0.025, 1.0);
    

        scene.add(textSprite);
        // console.log(`creating label for ${label}`);

        // Add the position to the points array for convex hull calculation
        points.push(new THREE.Vector3(x, y, z));

      } catch (error) {
        console.error(`Error projecting point:`, error.message);
      }
    } else {
      console.error(`Unsupported geometry type for points: ${feature.geometry.type}`);
    }
  });


  // Create and add the convex hull to the scene
  if (points.length > 0) {
    // createConvexHullLines(points);
    // console.log("creating convex hull with " + points)

    const cellMstEdges = primsAlgorithm(points);
    drawMSTEdges(cellMstEdges, '#FFFFFF', colorScheme.mstCellColor, 0.00025, 0.00075, cellMSTLines);
  }
  // add groups to scene
  scene.add(cellTransmitterPoints);
  scene.add(cellMSTLines);
}


function addGraticule(scene, boundingBox, gridSize, crossSize, scaleFactor = 2) {
  const material = new THREE.LineBasicMaterial({
    color: colorScheme.graticuleColor, 
    opacity: 0.2, 
    transparent: true 
  });
  const gridGroup = new THREE.Group();

  // Calculate center of bounding box
  const centerX = (boundingBox.min.x + boundingBox.max.x) / 2;
  const centerY = (boundingBox.min.y + boundingBox.max.y) / 2;

  // Calculate scaled bounding box
  const scaledMinX = centerX + (boundingBox.min.x - centerX) * scaleFactor;
  const scaledMaxX = centerX + (boundingBox.max.x - centerX) * scaleFactor;
  const scaledMinY = centerY + (boundingBox.min.y - centerY) * scaleFactor;
  const scaledMaxY = centerY + (boundingBox.max.y - centerY) * scaleFactor;

  // Loop over the scaled grid and create the plus signs
  for (let x = scaledMinX; x <= scaledMaxX; x += gridSize) {
      for (let y = scaledMinY; y <= scaledMaxY; y += gridSize) {
          // Horizontal line of the plus sign
          const horizontalVertices = [
              new THREE.Vector3(x - crossSize, y, 0),
              new THREE.Vector3(x + crossSize, y, 0)
          ];
          const horizontalGeometry = new THREE.BufferGeometry().setFromPoints(horizontalVertices);
          const horizontalLine = new THREE.Line(horizontalGeometry, material);
          gridGroup.add(horizontalLine);

          // Vertical line of the plus sign
          const verticalVertices = [
              new THREE.Vector3(x, y - crossSize, 0),
              new THREE.Vector3(x, y + crossSize, 0)
          ];
          const verticalGeometry = new THREE.BufferGeometry().setFromPoints(verticalVertices);
          const verticalLine = new THREE.Line(verticalGeometry, material);
          gridGroup.add(verticalLine);
      }
  }

  scene.add(gridGroup);
}

// Function to create a convex hull geometry from a set of points
function createConvexHullLines(points) {
  // Map points to the format expected by the convex hull library
  const formattedPoints = points.map(p => [p.x, p.y]);

  // Compute the convex hull indices
  const hullIndices = hull(formattedPoints);

  // Extract vertices from the hull indices
  const hullVertices = hullIndices.map(([i]) => points[i]);

  // Create line segments for each pair of successive vertices
  hullVertices.forEach((v, i) => {
    const nextV = hullVertices[(i + 1) % hullVertices.length]; // Wrap around to the first vertex

    // Create a buffer geometry for the line segment
    const geometry = new THREE.BufferGeometry().setFromPoints([v, nextV]);

    // Create the line and add it to the scene
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red color for the hull
    const line = new THREE.Line(geometry, material);
    scene.add(line);
  });
}

function primsAlgorithm(points) {
  const numPoints = points.length;
  const edges = new Array(numPoints);
  const visited = new Array(numPoints).fill(false);
  const minEdge = new Array(numPoints).fill(Infinity);

  // Arbitrary starting point
  minEdge[0] = 0;
  const parent = new Array(numPoints).fill(-1);

  for (let i = 0; i < numPoints - 1; i++) {
    let u = -1;

    for (let j = 0; j < numPoints; j++) {
      if (!visited[j] && (u === -1 || minEdge[j] < minEdge[u])) {
        u = j;
      }
    }

    visited[u] = true;

    for (let v = 0; v < numPoints; v++) {
      const dist = points[u].distanceTo(points[v]);

      if (!visited[v] && dist < minEdge[v]) {
        parent[v] = u;
        minEdge[v] = dist;
      }
    }
  }

  for (let i = 1; i < numPoints; i++) {
    edges[i - 1] = { from: points[parent[i]], to: points[i] };
  }

  return edges;
}

// Function to create and add MST lines with glow effect
function drawMSTEdges(mstEdges, coreColor, glowColor, coreRadius, glowRadius, targetGroup) {
  mstEdges.forEach(edge => {
    // Create a path for the edge
    const path = new THREE.CurvePath();
    path.add(new THREE.LineCurve3(edge.from, edge.to));

    // Core tube
    const coreGeometry = new THREE.TubeGeometry(path, 1, coreRadius, 8, false);
    const coreMaterial = new THREE.MeshBasicMaterial({ color: coreColor });
    const coreTube = new THREE.Mesh(coreGeometry, coreMaterial);
    targetGroup.add(coreTube);

    // Glow tube
    const glowGeometry = new THREE.TubeGeometry(path, 1, glowRadius, 8, false);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: glowColor, 
      transparent: true, 
      opacity: 0.5 
    });
    const glowTube = new THREE.Mesh(glowGeometry, glowMaterial);
    targetGroup.add(glowTube);
  });
}


///////////////////////////////////////////////////// 
// AUDIO INIT //////////////////////////////////////


// // Define the audio loader and load the audio file
// const audioLoader = new THREE.AudioLoader();
let audioBuffer; // This will hold the loaded audio buffer

// // Then, inside the audio loader callback
// audioLoader.load('AKWF_0001.wav', function(buffer) {
//   // Store the loaded audio buffer for later use
//   audioBuffer = buffer;
//   // Once the audio is loaded, fetch the GeoJSON data
//   loadGeoJSONData();
// }, undefined, function(err) {
//   console.error('An error occurred while loading the audio file:', err);
// });


///////////////////////////////////////////////////// 
// CHECK FOR COINCIDENT POINTS IN GEOJSON //////////

const pointTracker = {};

// Helper function to generate a unique key for each point based on its coordinates and label content
function getPointKey(lon, lat, labelContent) {
  return `${lon.toFixed(4)}:${lat.toFixed(4)}:${labelContent}`;
}

// Function to check for coincident points and return an offset
function getCoincidentPointOffset(lon, lat, labelContent, precision = 4, tolerance = 0.0001) {
  const key = getPointKey(lon, lat, labelContent);
  if (!pointTracker[key]) {
    pointTracker[key] = { count: 1, labelContent }; // Initialize the tracker for this point
  } else {
    // Check if the label content is the same before incrementing the count
    if (pointTracker[key].labelContent === labelContent) {
      // If the label content is the same, do not apply an offset
      return 0;
    } else {
      pointTracker[key].count += 1; // Increment the counter if the point exists but with different content
    }
  }
  // Apply an offset only if the label contents are different
  return (pointTracker[key].count - 1) * tolerance; // The offset
}

///////////////////////////////////////////////////// 
// TEXT VISUALIZATION //////////////////////////////

function makeTextSprite(message, parameters) {
  if (parameters === undefined) parameters = {};
  
  var fontface = parameters.hasOwnProperty("fontface") ? 
    parameters["fontface"] : "Arial";
  
  var fontsize = parameters.hasOwnProperty("fontsize") ? 
    parameters["fontsize"] : 18;

  var strokeColor = parameters.hasOwnProperty("strokeColor") ? 
    parameters["strokeColor"] : "rgba(0, 0, 0, 0.8)";

  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');

  // Scale the canvas size up to increase the resolution of the text
  var scale = window.devicePixelRatio; // Adjust to your needs
  canvas.width = 256 * scale;
  canvas.height = 128 * scale;
  context.scale(scale, scale);

  context.font = "Bold " + fontsize + "px " + fontface;
  
  // Set text fill style to transparent
  context.fillStyle = "rgba(255, 255, 255, 0.0)";

  // Set stroke style to the provided color or default black
  context.strokeStyle = strokeColor;
  context.lineWidth = parameters.hasOwnProperty("strokeWidth") ? 
    parameters["strokeWidth"] : 1; // Default to a width of N if not specified

  // Align text for centering
  context.textAlign = "center";
  context.textBaseline = "middle";

  // First stroke the text and then fill it to create the outline effect
  var x = canvas.width / (2 * scale);
  var y = canvas.height / (2 * scale);
  context.strokeText(message, x, y);
  context.fillText(message, x, y);

  var texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  var spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false // Set to false to prevent the sprite from being occluded by other objects in the scene
  });
  
  var sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(0.5 * scale, 0.25 * scale, 1.0); // Scale the sprite to your preference
  
  return sprite;
}


///////////////////////////////////////////////////// 
// FETCH EXTERNAL DATA /////////////////////////////



// Fetching the contour lines GeoJSON and adding to the scene
function loadGeoJSONData(){
  fetch('data/stanford_contours_simplified1000m_20231124.geojson')
    .then(response => response.json())
    .then(geojson => {
      addContourLines(geojson); // Existing call to add contour lines
      // updateProgressBar();


      // Fetch and add POINT data here after adding contour lines
      fetch('data/Cellular_Tower_HIFLD_NYSclip_20231101_simplified.geojson')
        .then(response => response.json())
        .then(pointGeojson => {
          // Call the addCellTowerPts function with the loaded buffer
          addCellTowerPts(pointGeojson, audioListener, audioBuffer);
          // console.log("adding points");
          // updateProgressBar();
        })
          .catch(error => {
          console.error('Error loading points GeoJSON:', error);
        });

      // Fetch and add the polygon data
      fetch('data/FM_contours_NYS_clip_20231101.geojson')
      .then(response => response.json())
      .then(polygonGeojson => {
        addPolygons(polygonGeojson);
        // console.log("Polygons added");
        // updateProgressBar();
      })
      .catch(error => {
        console.error('Error loading polygon GeoJSON:', error);
      });

      // Fetch and add the points data
      fetch('data/FM_TransTowers_PairwiseClip_NYS_20231101_simplified.geojson')
      .then(response => response.json())
      .then(pointGeojson => {
        addFMTowerPts(pointGeojson);
        // console.log("Yellow points added");
        // updateProgressBar();
      })
      .catch(error => {
        console.error('Error loading points GeoJSON:', error);
      });


      const boundingBox = getBoundingBoxOfGeoJSON(geojson);
      const gridSize = 0.5; // This represents your grid cell size
      const crossSize = gridSize * 0.05; // X% of the grid size, adjust as needed

      // addGraticule(scene, boundingBox, gridSize, crossSize);

      globalBoundingBox = getBoundingBoxOfGeoJSON(geojson);
      
          
      // Move the camera and set controls target
      const center = getCenterOfBoundingBox(boundingBox);
      const size = getSizeOfBoundingBox(boundingBox);
      const maxDim = Math.max(size.x, size.y);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 0.7; // adjust Z magic number
      const initialCameraZ = calculateCameraZToFitBoundingBox(globalBoundingBox);
      camera.position.set(center.x, center.y, initialCameraZ);
      controls.target.set(center.x, center.y, 0);

      // Now, add the constraints to the camera and controls
      constrainCamera(controls, boundingBox);

      // Call this after setting the position and target
      controls.update();
    })
    .catch(error => {
      console.error('Error loading GeoJSON:', error);
    });
}

