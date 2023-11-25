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
let rotationSpeed = 0.015; // Adjust rotation speed as needed
let globalBoundingBox;

// Define color scheme variables
const colorScheme = {
  ambientLightColor: "#404040", // Dark gray
  directionalLightColor: "#ffffff", // White
  backgroundColor: "#000000", // Black
  polygonColor: "#FF1493", // Pink
};

function initThreeJS() {
  scene = new THREE.Scene();

  
  // Set initial camera position - Note: You will update this with actual geojson centroid
  camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 1000);

  // const [cameraX, cameraY] = toStatePlane(-75.5268, 42.9538);
  const cameraX = 0;
  const cameraY = 0;
  const cameraZ = 10; // Adjust this based on the scale of your scene

  camera.position.set(cameraX, cameraY, cameraZ);

  // Orient the camera to look directly downwards
  camera.lookAt(new THREE.Vector3(cameraX, cameraY, 0));
  camera.up.set(0, 0, 1); // Ensuring Z-axis is up

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Initialize MapControls
  controls = new MapControls(camera, renderer.domElement);

  // Control settings for top-down view
  controls.screenSpacePanning = true;
  controls.enableRotate = true; // Enable rotation if you want to allow the user to rotate the view
  controls.enableDamping = true;
  controls.dampingFactor = 0.2;

  // Lighting
  let ambientLight = new THREE.AmbientLight(colorScheme.ambientLightColor);
  scene.add(ambientLight);
  let directionalLight = new THREE.DirectionalLight(colorScheme.directionalLightColor, 0.5);
  directionalLight.position.set(0, 1, 0);
  scene.add(directionalLight);

  renderer.setClearColor(colorScheme.backgroundColor);

  window.addEventListener('resize', onWindowResize, false);

  // Initialize fmPropagationPolygons group
  fmPropagationPolygons = new THREE.Group();
  scene.add(fmPropagationPolygons);
}


function addPolygons(geojson, stride = 10) {
  fmPropagationPolygons = new THREE.Group(); // Create a new group for polygons

  for (let i = 0; i < geojson.features.length; i += stride) {
    const feature = geojson.features[i];

    // Material for the polygon
    const material = new THREE.MeshBasicMaterial({
      color: colorScheme.polygonColor,
      transparent: true,
      wireframe: true,
      dithering: true,
      opacity: 0.4,
      side: THREE.FrontSide
    });

    try {
      const shapeCoords = feature.geometry.coordinates[0];
      const vertices = [];
      let centroid = new THREE.Vector3(0, 0, 0);

      shapeCoords.forEach(coord => {
        const [x, y] = toStatePlane(coord[0], coord[1]);
        const vertex = new THREE.Vector3(x, y, 0); // Edges at Z=0
        vertices.push(vertex);
        centroid.add(vertex);
      });

      centroid.divideScalar(shapeCoords.length);
      centroid.z = Math.random() * 0.12 + 0.0075; // Random height between 1 and 100

      const shapeGeometry = new THREE.BufferGeometry();
      const positions = [];

      for (let j = 0; j < shapeCoords.length; j++) {
        positions.push(0, 0, centroid.z); // Centroid (peak of the tent) at origin
        positions.push(vertices[j].x - centroid.x, vertices[j].y - centroid.y, 0); // First edge vertex relative to centroid
        positions.push(vertices[(j + 1) % shapeCoords.length].x - centroid.x, vertices[(j + 1) % shapeCoords.length].y - centroid.y, 0); // Second edge vertex relative to centroid
      }

      shapeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      shapeGeometry.computeVertexNormals();

      const mesh = new THREE.Mesh(shapeGeometry, material);
      mesh.userData = { centroid: centroid, rotationRate: Math.random() * rotationSpeed };
      mesh.position.copy(centroid); // Set the position of the mesh to the centroid

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
    mesh.rotation.z += mesh.userData.rotationRate; // Rotate around the local Z-axis
  });
}


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

// Function to calculate the bounding box from the polygons group
function calculateBoundingBoxFromGroup(group) {
  const bbox = new THREE.Box3().setFromObject(group);
  let size = new THREE.Vector3();
  bbox.getSize(size);
  let buffer = size.clone().multiplyScalar(0.25);
  bbox.expandByVector(buffer);
  return bbox;
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  updatePolygonsRotation();
  controls.update();
  renderer.render(scene, camera);
}

// On page load
window.onload = function() {
  initThreeJS();

  const strideRate = 10 + Math.floor(Math.random() * 6) - 3;
  fetch('data/FM_contours_NYS_clip_20231101.geojson')
    .then(response => response.json())
    .then(polygonGeojson => {
      addPolygons(polygonGeojson, strideRate);

      const boundingBox = getBoundingBoxOfGeoJSON(polygonGeojson);
      globalBoundingBox = boundingBox;

      // Move the camera and set controls target
      const center = getCenterOfBoundingBox(boundingBox);
      const size = getSizeOfBoundingBox(boundingBox);
      const maxDim = Math.max(size.x, size.y);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 0.1; // Adjust as needed
      camera.position.set(center.x, center.y, cameraZ);
      controls.target.set(center.x, center.y, 0);

      // Now, add the constraints to the camera and controls
      constrainCamera(controls, boundingBox);

      // Call this after setting the position and target
      controls.update();

      // Start the animation loop
      animate();
    })
    .catch(error => {
      console.error('Error loading GeoJSON:', error);
    });
}