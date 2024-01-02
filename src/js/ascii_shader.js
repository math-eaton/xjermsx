import * as THREE from 'three';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';

export function asciiShader(containerId) {
  let scene, camera, renderer, effect, sphere;
  let animationFrameId;

  function init() {
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // AsciiEffect
    effect = new AsciiEffect(renderer, ' .:-+*=%@XJERMSX', { invert: true });
    effect.setSize(window.innerWidth, window.innerHeight);
    effect.domElement.style.color = 'white';
    effect.domElement.style.backgroundColor = 'white';

    // Add AsciiEffect DOM element to the container
    document.getElementById(containerId).appendChild(effect.domElement);

    // Sphere
    const geometry = new THREE.SphereGeometry(3, 4, 20);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    // Animation: Rotate the sphere
    sphere.rotation.x += 0.01;
    sphere.rotation.y += 0.01;

    // Render scene with AsciiEffect
    effect.render(scene, camera);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    effect.setSize(window.innerWidth, window.innerHeight);
  }

  function dispose() {
    // Clean up resources
    window.removeEventListener('resize', onWindowResize);
    cancelAnimationFrame(animationFrameId);

    if (sphere) {
      scene.remove(sphere);
      sphere.geometry.dispose();
      sphere.material.dispose();
    }

    // Clear the container
    const container = document.getElementById(containerId);
    if (container && effect.domElement) {
      container.removeChild(effect.domElement);
    }
  }

  // Initialize and start the animation
  init();
  animate();

  // Expose the dispose function to allow clean up from outside
  return { dispose };
}

// Usage example:
// const asciiSphere = createAsciiSphere('containerId');
// Later, to stop and clean up:
// asciiSphere.dispose();
