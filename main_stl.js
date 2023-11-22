import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

let renderer, scene, camera, gui, guiData, controls;

init();

function init() {
    const container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 0, 200);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render);
    controls.screenSpacePanning = true;

    controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
    };

    window.addEventListener('resize', onWindowResize);

    guiData = {
        currentURL: '/example_model.stl',
        wireframe: true,
        wireframeColor: '#ff0000'
    };

    scene = new THREE.Scene();
    scene.background = new THREE.Color("#000000");

    loadSTL(guiData.currentURL);

    createGUI();
}

function createGUI() {
    if (gui) gui.destroy();

    gui = new GUI();

    gui.add(guiData, 'currentURL').name('STL File').onChange(loadSTL);
    gui.add(guiData, 'wireframe').name('Wireframe').onChange(loadSTL);
    gui.addColor(guiData, 'wireframeColor').name('Wireframe Color').onChange(loadSTL);
}

function loadSTL(url) {
    scene.clear(); // Clear the existing scene

    const loader = new STLLoader();
    loader.load(url, function (geometry) {
        const material = new THREE.MeshBasicMaterial({ color: 0x555555, visible: !guiData.wireframe });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        if (guiData.wireframe) {
            const wireframeMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(guiData.wireframeColor), wireframe: true });
            const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
            scene.add(wireframeMesh);
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function render() {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}
