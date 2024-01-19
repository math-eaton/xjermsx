import * as THREE from 'three';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

export function createAsciiText(containerId, text) {
    let scene, camera, renderer, effect, textMesh, font, helperCube;
    let animationFrameId;
    let isRotationEnabled = true;

  // Initialize the scene
  function init() {
    scene = new THREE.Scene();

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Load font and create text
    const loader = new FontLoader();
    loader.load('font/Xanh Mono_Regular.json', function(loadedFont) {
        font = loadedFont;
        create3DText(text);
    });

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.z = 50;

    // Renderer setup
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // AsciiEffect setup
    const customCharSet = '░♡❣♥®x6☹%&*⛆@#❤☺☻  '
    const asciiOptions = {
        invert: true,
        resolution: 0.175, // Adjust for more or less detail
        // resolution: 0.3,
        scale: 1.0,       // Adjust based on your display requirements
        color: false,     // Set to true if you want colored ASCII characters
        block: false,
    };  
    effect = new AsciiEffect(renderer, customCharSet, asciiOptions);
    effect.setSize(window.innerWidth, window.innerHeight);
    document.getElementById(containerId).appendChild(effect.domElement);

    // OrbitControls setup
    new OrbitControls(camera, effect.domElement);

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Create and add the helper cube
    const cubeGeometry = new THREE.BoxGeometry(10, 10, 10);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    helperCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(helperCube);

    // Position the helper cube at the same location as the text
    if (textMesh) {
        helperCube.position.copy(textMesh.position);
    }
  }

  // Create 3D text
  function create3DText(text) {
    const textGeometry = new TextGeometry(text, {
      font: font,
      size: 100,
      height: 0.2,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelOffset: 0,
      bevelSegments: 5
    });
    textGeometry.center();

    const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    textMesh = new THREE.Mesh(textGeometry, material);
    scene.add(textMesh);

    // Position the helper cube at the same location as the text
    if (textMesh) {
        helperCube.position.copy(textMesh.position);
    }

  }

  // Animation loop
  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    if (isRotationEnabled && textMesh) {
      textMesh.rotation.y += 0.01;
    }
    effect.render(scene, camera);
  }

  // Handle window resize
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    effect.setSize(window.innerWidth, window.innerHeight);
  }

  // Public function to toggle rotation
  function toggleRotation() {
    isRotationEnabled = !isRotationEnabled;
  }

  // Public function to dispose of the scene
  function dispose() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', onWindowResize);
    if (textMesh) {
      scene.remove(textMesh);
      textMesh.geometry.dispose();
      textMesh.material.dispose();
    }
    const container = document.getElementById(containerId);
    if (container && effect.domElement) {
      container.removeChild(effect.domElement);
    }
  }

  // Initialize and start the animation
  init();
  animate();

  return {
    toggleRotation,
    dispose
  };
}
