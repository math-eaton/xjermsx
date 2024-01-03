import * as THREE from 'three';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function asciiShader(containerId) {
  let scene, camera, renderer, movingLight, effect, sphere, heart, currentShape;
  let animationFrameId;
  let scaleDirection = 1;
  let scaleSpeed = 0;
  let maxScale = 1.9;
  let minScale = 1.55;
  let heartCentroid = new THREE.Vector3(0, 1.25, 5); // Define heartCentroid here
  

  function init() {
    // Scene
    scene = new THREE.Scene();

    let lightColor = new THREE.Color("rgba(255, 0, 0, 0.9")

    // Create a moving light source at the heart's centroid
    movingLight = new THREE.PointLight(lightColor, 5, 10);
    movingLight.position.copy(heartCentroid);
    scene.add(movingLight);

    // Static light at the heart's centroid
    const light = new THREE.PointLight(lightColor, 50, 25);
    light.position.copy(heartCentroid);
    scene.add(light);
  
    // Add a static ambient light for overall scene illumination
    const ambientLight = new THREE.AmbientLight(0xffffff); // Soft white light
    scene.add(ambientLight);    
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.z = 2.5;

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // AsciiEffect
    // Custom CharSet and Options
    // const customCharSet = 'x♡♥☦*⭒♥'
    const customCharSet = '♡❣♥❤ '
    const asciiOptions = {
        invert: true,
        resolution: 0.1, // Adjust for more or less detail
        scale: 1.0,       // Adjust based on your display requirements
        color: false,     // Set to true if you want colored ASCII characters
        block: false,
    };  

    // AsciiEffect with custom parameters
    effect = new AsciiEffect(renderer, customCharSet, asciiOptions);
    effect.setSize(window.innerWidth, window.innerHeight);
    effect.domElement.style.color = 'white'; // Adjust text color as needed
    effect.domElement.style.backgroundColor = 'white'; // Adjust background color as needed

    // Add AsciiEffect DOM element to the container
    document.getElementById(containerId).appendChild(effect.domElement);

    // Heart Shape
    const x = 0, y = 0;
    const heartShape = new THREE.Shape();

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

    // OrbitControls
    const controls = new OrbitControls(camera, effect.domElement);
    controls.enableDamping = true; // Optional, but makes the controls smoother
    controls.dampingFactor = 0.1;
    controls.enableZoom = true;
    

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    switchShape(createHeart()); // Initialize with the heart shape
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    // Only animate the current shape if it exists
    if (currentShape) {
        // Animate the Z position of the moving light to create a bouncing effect
        const time = Date.now() * 0.0025; // Control the speed of the bounce
        movingLight.position.z = heartCentroid.z + Math.sin(time) * 1; // Adjust the multiplier to control the bounce amplitude

        // Scale the current shape
        if ((currentShape.scale.x >= maxScale && scaleDirection > 0) || (currentShape.scale.x <= minScale && scaleDirection < 0)) {
            scaleDirection *= -1; // Reverse the scaling direction
        }
        currentShape.scale.x += scaleSpeed * scaleDirection;
        currentShape.scale.y += scaleSpeed * scaleDirection;
        currentShape.scale.z += scaleSpeed * scaleDirection;
    }

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

  function switchShape(shape) {
    if (currentShape) {
        scene.remove(currentShape);
        if (currentShape.geometry) currentShape.geometry.dispose();
        if (currentShape.material) currentShape.material.dispose();
    }
    currentShape = shape;
    scene.add(currentShape);
}

function createHeart() {
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

  const material = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      specular: 0xffffff,
      shininess: 10,
      side: THREE.FrontSide,
  });

  const heart = new THREE.Mesh(geometry, material);
  heart.rotation.x = Math.PI;
  return heart;
}

function createSphere() {
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
}

function createTorus() {
  let radius = 1.5; // Reduced radius
  let tube = 0.4;   // Reduced tube size
  let tubularSegments = 100;
  let radialSegments = 16;
  let p = 2;
  let q = 2;

  const geometry = new THREE.TorusKnotGeometry(
    radius, 
    tube, 
    tubularSegments, 
    radialSegments, 
    p, 
    q
  );

  const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
  const torus = new THREE.Mesh(geometry, material);
  return torus;
}


// Event listener or other mechanism to switch shapes
window.addEventListener('keydown', (event) => {
  if (event.key === '1') {
      switchShape(createHeart());
  } else if (event.key === '2') {
      switchShape(createSphere());
  } else if (event.key === '3'){
    switchShape(createTorus());
  }
});

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
