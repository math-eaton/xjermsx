import * as THREE from 'three';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function asciiShader(containerId) {
  let scene, camera, renderer, movingLight, effect, sphere, heart;
  let animationFrameId;
  let scaleDirection = 1;
  let scaleSpeed = 0.0025;
  let maxScale = 2;
  let minScale = 0.5;

  function init() {
    // Scene
    scene = new THREE.Scene();

    // Create a moving light source
    movingLight = new THREE.PointLight(0xffffff, 2, 100);
    movingLight.position.set(5, 10, 5);
    scene.add(movingLight);

    // Add a static ambient light for overall scene illumination
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);    
    
    // Camera
    camera = new THREE.PerspectiveCamera(120, window.innerWidth / window.innerHeight, 0.75, 5);
    camera.position.z = 2.5;

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // AsciiEffect
    effect = new AsciiEffect(renderer, ' XJERMSX!~|666', { invert: true });
    effect.setSize(window.innerWidth, window.innerHeight);
    effect.domElement.style.color = 'white';
    effect.domElement.style.backgroundColor = 'white';

    // Add AsciiEffect DOM element to the container
    document.getElementById(containerId).appendChild(effect.domElement);

    // Heart Shape
    const x = 0, y = 0;
    const heartShape = new THREE.Shape();

    heartShape.moveTo(x + 0.5, y + 0.5);
    heartShape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y);
    heartShape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7);
    heartShape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9);
    heartShape.bezierCurveTo(x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7);
    heartShape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1, y);
    heartShape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5);

    const geometry = new THREE.ExtrudeGeometry(heartShape, {
      steps: 1,
      depth: 0.15,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.2,
      bevelOffset: 0,
      bevelSegments: 10
    });
    
    geometry.center();

    // Use a solid material instead of wireframe
    const material = new THREE.MeshPhongMaterial({
        color: 0xff00ff, // Red color
        specular: 0xab22ff,
        shininess: 100000
    });

    heart = new THREE.Mesh(geometry, material);
    heart.rotation.x = Math.PI; // Rotate by 90 degrees

    // Add a light source to bring out the shininess of the material
    const light = new THREE.PointLight(0xaabbcc, 50, 25);
    light.position.set(0, 5, 5);
    scene.add(light);

    scene.add(heart);


    // OrbitControls
    const controls = new OrbitControls(camera, effect.domElement);
    controls.enableDamping = true; // Optional, but makes the controls smoother
    controls.dampingFactor = 0.1;
    controls.enableZoom = true;
    

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    // Rotate the heart around its horizontal axis (X-axis)
    // heart.rotation.y += 0.0005;

    // Scale the heart
    if ((heart.scale.x >= maxScale && scaleDirection > 0) || (heart.scale.x <= minScale && scaleDirection < 0)) {
        scaleDirection *= -1; // Reverse the scaling direction
    }
    heart.scale.x += scaleSpeed * scaleDirection;
    heart.scale.y += scaleSpeed * scaleDirection;
    heart.scale.z += scaleSpeed * scaleDirection;

    // Update the position of the moving light to simulate a swinging lightbulb
    const time = Date.now() * 0.001;
    movingLight.position.x = Math.sin(time) * 10; // Swing amplitude on the x-axis
    movingLight.position.y = Math.abs(Math.cos(time)) * 5 + 5; // Swing amplitude and offset on the y-axis
    movingLight.position.z = Math.cos(time) * 10; // Swing amplitude on the z-axis

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

    if (heart) {
      scene.remove(heart);
      heart.geometry.dispose();
      heart.material.dispose();
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
