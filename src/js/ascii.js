import * as THREE from 'three';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

export function asciiArt(containerId) {
  let scene, camera, renderer, effect, controls;
  let hearts = []; // Array to store multiple hearts
  let textMesh; // Variable to store the 3D text
  let animationFrameId;
  let animateObjects = true;

  // Toggles for rendering hearts and text
  const renderHearts = true; // Set to false to not render hearts
  const renderText = false; // Set to false to not render text
  

  function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0, 0, 0);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // AsciiEffect
    const customCharSet = ' ♡❣♥☺x6☹%&*⛆@#❤☺☻'
    const asciiOptions = {
        invert: true,
        resolution: 0.25, // Adjust for more or less detail
        scale: 1.0,       // Adjust based on your display requirements
        color: false,     // Set to true if you want colored ASCII characters
        block: false,
    };  

    // AsciiEffect with custom parameters
    effect = new AsciiEffect(renderer, customCharSet, asciiOptions);
    effect.setSize(window.innerWidth, window.innerHeight);

    document.getElementById(containerId).appendChild(effect.domElement);

    // Controls
    controls = new OrbitControls(camera, effect.domElement);
    controls.autoRotate = false;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    // Call createHearts if rendering hearts is true
    if (renderHearts) {
      createHearts(); // This function now handles creating and positioning hearts
    }

    if (renderText) {
      createText(() => {
        // Only create hearts after the text has been created and its bounding box calculated
        if (renderHearts) {
          createHearts();
        }
      });
    } else if (renderHearts) {
      createHearts();
    }
  
    // Additional lights
    const numberOfLights = 20; // You can adjust the number of lights
    for (let i = 0; i < numberOfLights; i++) {
      const intensity = Math.random() * 50; // Random intensity between 0 and 1.5
      const lightColor = 0xffffff; // White light, you can change to different colors if needed
  
      const light = new THREE.PointLight(lightColor, intensity, 50); // Adjust the last parameter for the light's influence range
  
      // Random position within scene bounds
      light.position.set(
        Math.random() * 40 - 20, // Random x between -20 and 20
        Math.random() * 40 - 20, // Random y between -20 and 20
        Math.random() * 40 - 20  // Random z between -20 and 20
      );
  
      scene.add(light);
    }  

    function resetRotations() {
      // Reset rotation for all hearts
      if (renderHearts) {
        hearts.forEach(heart => {
          heart.rotation.set(0, 0, 0); // Reset to default rotation
        });
      }
    
      // Reset rotation for text
      if (renderText && textMesh) {
        textMesh.rotation.set(0, 0, 0); // Reset to default rotation
      }
    
      // Reset the camera to its default position and rotation
      camera.position.set(0, 0, 30);
      camera.rotation.set(0, 0, 0);
      camera.lookAt(scene.position); // Assuming you want the camera to look at the center of the scene
    
      // Update and enable OrbitControls
      controls.enabled = true; // Ensure controls are enabled
      controls.update(); // Update the controls to reflect the new camera state
    }
            
    window.addEventListener('keydown', (event) => {
      if (event.key === '1') {
        resetRotations();
        console.log("All objects reset to default orientation");
      } else if (event.key === 'r') {
        animateObjects = !animateObjects; // Toggle the state of animateObjects
        // controls.autoRotate = animateObjects; // Also toggle the autoRotate feature of the OrbitControls
        console.log(animateObjects);
      } else if (event.key === 't') {
          if (hearts.length > 0) {
            const heartToRemove = hearts.pop(); // Remove the last heart from the array
            scene.remove(heartToRemove); // Remove it from the scene
            if (heartToRemove.geometry) heartToRemove.geometry.dispose();
            if (heartToRemove.material) heartToRemove.material.dispose();
          }
      } else if (event.key === 'y') {
        // Create and add a single new heart
        const newHeart = createHeartShape();
        let validPosition = false;
    
        // Check if textMesh has been created and calculate its bounding box
        let textBoundingBox;
        if (renderText && textMesh) {
          textMesh.geometry.computeBoundingBox();
          textBoundingBox = textMesh.geometry.boundingBox.clone();
          textBoundingBox.expandByScalar(5); // Buffer zone
        }
    
        // Find a valid position for the new heart
        while (!validPosition) {
          newHeart.position.set(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10);
          if (!textBoundingBox || !textBoundingBox.containsPoint(newHeart.position)) {
            validPosition = true;
          }
        }
    
        newHeart.scale.setScalar(Math.random() * 1.0 + 1.0);
        newHeart.rotationSpeed = new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.02);
        hearts.push(newHeart);
        scene.add(newHeart);
      }      
    });
    
    
    window.addEventListener('resize', onWindowResize, false);

    // Create hearts and text based on toggles
    if (renderHearts) {
      createHearts();
    }
    if (renderText) {
      createText();
    }
  }


  function createText() {
    const loader = new FontLoader();
    loader.load('font/Bank Script D_Regular.json', function (font) {
      const textGeometry = new TextGeometry('xJermsx', {
        font: font,
        size: 8.5,
        height: 1,
        curveSegments: 5,
        bevelEnabled: true,
        bevelThickness: .1,
        bevelSize: .05,
        bevelOffset: 0,
        bevelSegments: 5
      });
      textGeometry.center();

      const material = new THREE.MeshPhongMaterial({
        color: 0xFFFF00,
        specular: 0xffffff,
        shininess: 25,
        side: THREE.FrontSide,
        wireframe: false,
      });

      textMesh = new THREE.Mesh(textGeometry, material);
      scene.add(textMesh);
    });

      // After adding textMesh to the scene
    // textMesh.geometry.computeBoundingBox();
    // callback(); // Call the callback function to indicate text is ready

  }



  function createHeartShape() {
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
        bevelThickness: 0.25,
        bevelSize: 0.4,
        bevelOffset: 0,
        bevelSegments: 10
      });
    
    geometry.center();

    const material = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        specular: 0xffffff,
        shininess: 200,
        side: THREE.DoubleSide,
        wireframe: false,
    });
  
    const heart = new THREE.Mesh(geometry, material);
    heart.rotation.x = Math.PI;

    return heart; // Return the created heart mesh
}

function createHearts() {
  // Define the buffer zone around the text
  let bufferZone = 15000; // Adjust the size of the buffer zone as needed

  // Check if textMesh has been created and calculate its bounding box
  let textBoundingBox;
  if (renderText && textMesh) {
      textMesh.geometry.computeBoundingBox();
      textBoundingBox = textMesh.geometry.boundingBox.clone();
      textBoundingBox.expandByScalar(bufferZone);
  }

  // Create and position hearts
    // Create and position hearts
    for (let i = 0; i < 7; i++) {
      let heartMesh = createHeartShape();
      let validPosition = false;

      // Attempt to find a valid position that doesn't overlap with the text
      while (!validPosition) {
          heartMesh.position.set(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10);
          if (!textBoundingBox || !textBoundingBox.containsPoint(heartMesh.position)) {
              validPosition = true;
          }
      }

      heartMesh.scale.setScalar(Math.random() * 1.0 + 1.0);
      heartMesh.rotationSpeed = new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.02);
      hearts.push(heartMesh);
      scene.add(heartMesh);
  }
}

  
  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    if (animateObjects) {
      // Animate hearts if enabled
      if (renderHearts) {
        hearts.forEach(heart => {
          heart.rotation.x += heart.rotationSpeed.x;
          heart.rotation.y += heart.rotationSpeed.y;
          // heart.rotation.z += heart.rotationSpeed.z;
        });
      }

      // Animate text if enabled
      if (renderText && textMesh) {
        // textMesh.rotation.x += 0.01;
        // textMesh.rotation.y += 0.01;
      }
    }

    controls.update();
    effect.render(scene, camera);
  }
  
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    effect.setSize(window.innerWidth, window.innerHeight);
  }

  init();
  animate();

  return {
    dispose: () => {
      window.removeEventListener('keydown', onKeyPress);
      window.removeEventListener('resize', onWindowResize);
      cancelAnimationFrame(animationFrameId);
      if (renderHearts) {
        hearts.forEach(heart => {
          scene.remove(heart);
          heart.geometry.dispose();
          heart.material.dispose();
        });
      }
      if (renderText && textMesh) {
        scene.remove(textMesh);
        textMesh.geometry.dispose();
        textMesh.material.dispose();
      }
    }
  };
}