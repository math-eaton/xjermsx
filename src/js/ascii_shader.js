import * as THREE from 'three';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { createNoise3D } from 'simplex-noise';
const noise3D = createNoise3D();


export function asciiShader(containerId) {
  let scene, camera, renderer, movingLight, effect, sphere, heart, currentShape;
  let animationFrameId;
  let scaleDirection = 1;
  let scaleSpeed = 0;
  let maxScale = 1.9;
  let minScale = 1.55;
  let heartCentroid = new THREE.Vector3(0, 1.25, 5); // Define heartCentroid here
  let simplexNoise;
  

  function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 255, 255, 0 );

    // Create a moving light source at the heart's centroid
    movingLight = new THREE.PointLight(0xf00fff, 3, 100); // Higher intensity
    movingLight.position.set(heartCentroid.x, heartCentroid.y + 500, heartCentroid.z + 500);
    movingLight.color.set(0xff0000); // Red color
    scene.add(movingLight);

    // Add a static light with high intensity and distance
    const light = new THREE.PointLight(0xffffff, 3, 500);
    light.position.set(heartCentroid.x - 500, heartCentroid.y - 500, heartCentroid.z - 500);
    light.color.set(0x0000ff); // Blue color
    scene.add(light);

    //  ambient light for softer overall scene illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // Directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // Spot light
    // const spotLight = new THREE.SpotLight(0xffffff, 0.5);
    // spotLight.position.set(5, 5, 5);
    // spotLight.angle = Math.PI / 4;
    // spotLight.penumbra = 0.1;
    // scene.add(spotLight);
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.z = 2.5;

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // AsciiEffect
    // Custom CharSet and Options
    // const customCharSet = 'x♡♥☦*⭒♥'
    const customCharSet = '░♡❣♥®x6☹%&*⛆@#❤☺☻  '
    const asciiOptions = {
        invert: true,
        resolution: 0.175, // Adjust for more or less detail
        scale: 1.0,       // Adjust based on your display requirements
        color: false,     // Set to true if you want colored ASCII characters
        block: false,
    };  

    // AsciiEffect with custom parameters
    effect = new AsciiEffect(renderer, customCharSet, asciiOptions);
    effect.setSize(window.innerWidth, window.innerHeight);

    // Adjust text color and background color
    effect.domElement.style.color = 'cyan'; // Change text color here
    effect.domElement.style.backgroundColor = 'black'; // Change background color here


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

  let swarmData = createSwarm();
  
// Add or subtract a point every 2 seconds
let lastUpdateTime = Date.now();

function animate() {
    requestAnimationFrame(animate);
    
    let currentTime = Date.now();
    if (currentTime - lastUpdateTime > 2000) { // Every 2 seconds
        lastUpdateTime = currentTime;
        if (Math.random() < 0.5 && swarmData.points.length > 5) {
            // Remove a point
            swarmData.points.pop();
        } else {
            // Add a point
            const randomPoint = swarmData.points[Math.floor(Math.random() * swarmData.points.length)];
            swarmData.points.push(new THREE.Vector3().copy(randomPoint));
        }
        swarmData.shape.geometry.dispose(); // Dispose old geometry
        swarmData.shape.geometry = new ConvexGeometry(swarmData.points);
    }

    // Update points positions using noise
    let time = Date.now() * 0.0001;
    swarmData.points.forEach((point, i) => {
        point.x += noise3D(i, time, 0) * 0.1;
        point.y += noise3D(time, i, 1) * 0.1;
        point.z += noise3D(i, time, 2) * 0.1;
    });

    // Update Convex Hull Geometry
    swarmData.shape.geometry.dispose(); // Dispose old geometry
    swarmData.shape.geometry = new ConvexGeometry(swarmData.points);

    // Ensure movingLight and its position are defined before accessing
    if (movingLight && movingLight.position) {
        // Animate the Z position of the moving light to create a bouncing effect
        const time = Date.now() * 0.00025; // Control the speed of the bounce
        movingLight.position.z = movingLight.position.z + Math.sin(time) * 0.01; // Adjust the multiplier to control the bounce amplitude

        // Create a swinging effect for the moving light
        movingLight.position.x = Math.sin(time) * 500;
        movingLight.position.y = 250 + Math.sin(time * 1.5) * 250;
        movingLight.position.z = 250 + Math.cos(time * 1.5) * 250;
    
    }

    // Only animate the current shape if it exists
    if (currentShape) {
        // Scale the current shape
        if ((currentShape.scale.x >= maxScale && scaleDirection > 0) || (currentShape.scale.x <= minScale && scaleDirection < 0)) {
            scaleDirection *= -1; // Reverse the scaling direction
        }
        currentShape.scale.x += scaleSpeed * scaleDirection;
        currentShape.scale.y += scaleSpeed * scaleDirection;
        currentShape.scale.z += scaleSpeed * scaleDirection;

        // Continuous rotation
        currentShape.rotation.x += 0.008; // Rotates the shape around the x-axis
        currentShape.rotation.y += 0.009; // Rotates the shape around the y-axis
        currentShape.rotation.z += 0.007; // Rotates the shape around the z-axis
        
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

  function switchShape({ shape, centroid }) {
    if (!shape || !centroid) {
        console.error("Invalid shape or centroid provided to switchShape");
        return;
    }
    if (shape && centroid) {
        if (currentShape) {
            scene.remove(currentShape);
            if (currentShape.geometry) currentShape.geometry.dispose();
            if (currentShape.material) currentShape.material.dispose();
        }
        currentShape = shape;
        scene.add(currentShape); // Add only the shape

        // Update the position of the moving light to the centroid of the current shape
        if (movingLight) {
            movingLight.position.set(centroid.x, centroid.y, centroid.z);
        }
    } else {
        console.error("Invalid shape or centroid provided to switchShape");
    }
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
      color: 0xffffff,
      specular: 0xff00ff,
      shininess: 10,
      side: THREE.FrontSide,
  });

  const heart = new THREE.Mesh(geometry, material);
  const heartCentroid = new THREE.Vector3(0, 1.25, 0); // Define the heart's centroid
  heart.rotation.x = Math.PI;
  return { shape: heart, centroid: heartCentroid };
}

function createSphere() {
  const geometry = new THREE.SphereGeometry(1.25, 20, 20);
  const material = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    wireframe: true,
    alphaHash: true,
   });
  const sphere = new THREE.Mesh(geometry, material);
  const sphereCentroid = new THREE.Vector3(0, 0, 0); // Sphere's centroid is at its origin
  return { shape: sphere, centroid: sphereCentroid };
}

function createTorus() {
  let radius = 0.85; // Reduced radius
  let tube = 0.12;   // Reduced tube size
  let tubularSegments = 100;
  let radialSegments = 160;
  let p = 4;
  let q = 2;

  const geometry = new THREE.TorusKnotGeometry(
    radius, 
    tube, 
    tubularSegments, 
    radialSegments, 
    p, 
    q
  );

  const material = new THREE.MeshPhongMaterial({ 
    color: 0xff0000,
    wireframe: true,
   });
  const torus = new THREE.Mesh(geometry, material);
  const torusCentroid = new THREE.Vector3(0, 0, 0); // Torus's centroid is at its origin
  return { shape: torus, centroid: torusCentroid };
}

function createSwarm() {
  const points = [];
  for (let i = 0; i < 20; i++) {
      points.push(new THREE.Vector3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
      ));
  }

  const geometry = new ConvexGeometry(points);
  const material = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      wireframe: true,
  });

  const swarm = new THREE.Mesh(geometry, material);
  const swarmCentroid = new THREE.Vector3(0, 0, 0); // Initial centroid

  return { shape: swarm, centroid: swarmCentroid, points };
}



// function changeAsciiEffectColors(newTextColor, newBackgroundColor) {
//   if (effect && effect.domElement) {
//       effect.domElement.style.color = newTextColor;
//       effect.domElement.style.backgroundColor = newBackgroundColor;
//   }
// }

// changeAsciiEffectColors('red', 'blue'); // Change to red text on a blue background


// Event listener for shape switching
window.addEventListener('keydown', (event) => {
  if (event.key === '1') {
      switchShape(createHeart());
  } else if (event.key === '2') {
      switchShape(createSphere());
  } else if (event.key === '3') {
      switchShape(createTorus());
  } else if (event.key === '4') { 
      const swarm = createSwarm(); 
      switchShape(swarm);
  }
});

    // Initialize and start the animation
    init();
    animate();

    // Return an object with all functions you want to expose
    return {
        dispose,
        switchShape
    };
}


// Usage example:
// const asciiSphere = createAsciiSphere('containerId');
// Later, to stop and clean up:
// asciiSphere.dispose();
