import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'; // Import OBJLoader
import { STLLoader } from 'three/addons/loaders/STLLoader.js'; // Uncomment if using STL files
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

let renderer, scene, camera, gui, guiData;
let objMesh; // Replace svgMeshes with objMesh

init();

function init() {
  const container = document.getElementById('container');

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(0, 0, 200);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', render);
  controls.screenSpacePanning = true;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE
  };

  window.addEventListener('resize', onWindowResize);

  guiData = {
    // currentURL: 'path/to/your.obj', // Default OBJ file
    // Uncomment if using STL files
    currentURL: '/Users/matthewheaton/Documents/GitHub/xjermsx/output/empire-state-building-by-miniworld-3d.stl', // Default STL file
    projectionPlane: 'XY' // Default projection plane
  };

  loadOBJ(guiData.currentURL); // Load OBJ file

  createGUI();
}

function createGUI() {
  if (gui) gui.destroy();

  gui = new GUI();

  gui.add(guiData, 'currentURL').name('OBJ/STL File').onChange(update);
  gui.add(guiData, 'projectionPlane', ['XY', 'XZ', 'YZ']).name('Projection Plane').onChange(update);

  function update() {
    loadOBJ(guiData.currentURL);
  }
}

function loadOBJ(url) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#000000');

//   const loader = new OBJLoader(); // Use OBJLoader
  // Uncomment if using STL files
  const loader = new STLLoader(); // Use STLLoader

  loader.load(url, function (object) {
    scene.add(object);
    objMesh = object;

    // Project the object onto the specified plane
    projectOntoPlane(objMesh, guiData.projectionPlane);
    render();
  });
}

function projectOntoPlane(mesh, plane) {
  mesh.geometry.vertices.forEach(vertex => {
    switch (plane) {
      case 'XY':
        vertex.z = 0;
        break;
      case 'XZ':
        vertex.y = 0;
        break;
      case 'YZ':
        vertex.x = 0;
        break;
    }
  });
  mesh.geometry.verticesNeedUpdate = true;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function render() {
  renderer.render(scene, camera);
}
