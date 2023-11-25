// Import modules
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import proj4 from 'proj4';
import '/style.css'; 

// Define the custom projection with its PROJ string
const statePlaneProjString = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
proj4.defs("EPSG:32118", statePlaneProjString);

// Convert lon/lat to State Plane coordinates
function toStatePlane(lon, lat) {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    throw new Error(`Invalid coordinates: longitude (${lon}), latitude (${lat})`);
  }
  return proj4("EPSG:32118").forward([lon, lat]);
}

// Three.js - Initialize the Scene
let scene, camera, renderer, controls, fmPropagationPolygons;
let rotationSpeed = 0.05; // Adjust rotation speed as needed

// Define color scheme variables
const colorScheme = {
  ambientLightColor: "#404040", // Dark gray
  directionalLightColor: "#ffffff", // White
  backgroundColor: "#000000", // Black
  polygonColor: "#FF1493", // Pink
};

function initThreeJS() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.up.set(0, 0, 1); // Set Z as up-direction 
  camera.position.z = 200; // Adjust as necessary

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Initialize MapControls
  controls = new MapControls(camera, renderer.domElement);

  // Set up the control parameters as needed for a mapping interface
  controls.screenSpacePanning = false;
  controls.enableRotate = false; // typically map interfaces don't use rotation
  controls.enableDamping = true; // an optional setting to give a smoother control feeling
  controls.dampingFactor = 0.05; // amount of damping (drag)

  // Set the minimum and maximum polar angles (in radians) to prevent the camera from going over the vertical
  // controls.minPolarAngle = 0; // 0 radians (0 degrees) - directly above the target
  // controls.maxPolarAngle = (Math.PI / 2) - 0.05; // π/2 radians (90 degrees) - on the horizon
  // // Set the maximum distance the camera can dolly out
  // controls.maxDistance = 4.5;
  // controls.minDistance = 0.2; 

  
  // Lighting
  let ambientLight = new THREE.AmbientLight(colorScheme.ambientLightColor);
  scene.add(ambientLight);
  let directionalLight = new THREE.DirectionalLight(colorScheme.directionalLightColor, 0.5);
  directionalLight.position.set(0, 1, 0);
  scene.add(directionalLight);

  renderer.setClearColor(colorScheme.backgroundColor);

  const bbox = new THREE.BoxHelper(fmPropagationPolygons, 0xff0000);
  // scene.add(bbox);

  // Initialize fmPropagationPolygons group
  fmPropagationPolygons = new THREE.Group();
  scene.add(fmPropagationPolygons);
}

function addTestCube() {
  const geometry = new THREE.BoxGeometry(100, 100, 100); // Create a 1x1x1 cube
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green cube
  const cube = new THREE.Mesh(geometry, material);

  // Position the cube in front of the camera
  cube.position.set(0, 0, 5); // Adjust the position as needed

  scene.add(cube); // Add the cube to the scene
}


function addPolygons(geojson, stride = 10) {
  fmPropagationPolygons = new THREE.Group(); // Create a new group for polygons

  for (let i = 0; i < geojson.features.length; i += stride) {
    const feature = geojson.features[i];

    // Create a new material for each polygon
    const material = new THREE.MeshBasicMaterial({
      color: colorScheme.polygonColor,
      transparent: true,
      wireframe: true,
      dithering: true,
      opacity: 0.8,
      side: THREE.FrontSide
    });

    try {
      const shapeCoords = feature.geometry.coordinates[0];
      const vertices = [];
      let centroid = new THREE.Vector3(0, 0, 0);

      shapeCoords.forEach(coord => {
        const [x, y] = toStatePlane(coord[0], coord[1]);
        const z = 1;
        const vertex = new THREE.Vector3(x, y, z);
        vertices.push(vertex);
        centroid.add(vertex);
      });

      centroid.divideScalar(shapeCoords.length);

      const shapeGeometry = new THREE.BufferGeometry();
      const positions = [];

      for (let j = 0; j < shapeCoords.length; j++) {
        positions.push(centroid.x, centroid.y, centroid.z);
        positions.push(vertices[j].x, vertices[j].y, vertices[j].z);
        positions.push(vertices[(j + 1) % shapeCoords.length].x, vertices[(j + 1) % shapeCoords.length].y, vertices[(j + 1) % shapeCoords.length].z);
      }

      shapeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      shapeGeometry.computeVertexNormals();

      const mesh = new THREE.Mesh(shapeGeometry, material);
      mesh.userData = { centroid: centroid, rotationRate: Math.random() * rotationSpeed };
      fmPropagationPolygons.add(mesh);
    } catch (error) {
      console.error(`Error processing feature at index ${i}:`, error);
    }
  }

  scene.add(fmPropagationPolygons);
}

  
// Function to update rotation of polygons
function updatePolygonsRotation() {
  fmPropagationPolygons.children.forEach(mesh => {
    // Translate to origin, rotate, translate back
    mesh.position.sub(mesh.userData.centroid);
    mesh.rotation.z += mesh.userData.rotationRate; // Rotate around Z-axis
    mesh.position.add(mesh.userData.centroid);
  });
}
  
// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update polygon rotations
  updatePolygonsRotation();

  controls.update();
  renderer.render(scene, camera);
}
  
// On page load
window.onload = function() {
  initThreeJS(); // Initialize Three.js
  // addTestCube(); // Add the test cube to the scene

  const strideRate = 10 + Math.floor(Math.random() * 6) - 3; // Random stride rate +/- 3
  fetch('data/FM_contours_NYS_clip_20231101.geojson')
    .then(response => response.json())
    .then(polygonGeojson => {
      addPolygons(polygonGeojson, strideRate);
    })
    .catch(error => {
      console.error('Error loading polygon GeoJSON:', error);
    });

  animate();
};
