import * as THREE from 'three';

export function afterDark3D(containerId) {
  let scene, camera, renderer;
  let buildings = [];
  let stars = [];
  let panSpeed = 0.1;

  // Define a Building class for 3D buildings
  class Building {
    constructor(x, width, height, z) {
      // Solid Mesh (Opaque Black Fill)
      const solidMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const solidMesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 10), 
        solidMaterial
      );
      solidMesh.position.set(x, height / 2, z);
  
      // Wireframe Mesh
      const wireframeMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x992222, 
          wireframe: true 
      });
      const wireframeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(width * 1.01, height * 1.01, 10.1), // Slightly larger
        wireframeMaterial
      );
      wireframeMesh.position.set(x, height / 2, z);
  
      this.mesh = new THREE.Group(); // Group to hold both solid and wireframe meshes
      this.mesh.add(solidMesh);
      this.mesh.add(wireframeMesh);
  
      scene.add(this.mesh);
    }
    
    pan(delta) {
        this.mesh.position.x -= delta;
        if (this.mesh.position.x < -100) { // Reuse buildings
          this.mesh.position.x += 200;
        }
      }
    }
    
  function setupThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(
      window.innerWidth / -2, window.innerWidth / 2,
      window.innerHeight / 2, window.innerHeight / -2,
      1, 1000
    );
    camera.position.set(200, 200, 200);
    camera.lookAt(scene.position);
    zoomOrthographicCamera(0.5); // Example: zoom in by a factor of 0.5
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById(containerId).appendChild(renderer.domElement);
  }

  function addBuildings() {
    let xStart = -100;
    let zPositions = [-20, 0, 20]; // Z positions for different rows
  
    zPositions.forEach(z => {
      let x = xStart;
      while (x < 100) {
        let width = Math.random() * 10 + 5;
        let height = Math.random() * 50 + 20;
        let building = new Building(x, width, height, z);
        buildings.push(building);
  
        if (Math.random() < 0.2) { // 20% chance for a gap
          let gapSize = Math.random() * 15 + 10;
          x += width + gapSize;
        } else {
          x += width;
        }
      }
    });
  }
    
  function zoomOrthographicCamera(scaleFactor) {
    camera.left *= scaleFactor;
    camera.right *= scaleFactor;
    camera.top *= scaleFactor;
    camera.bottom *= scaleFactor;
  
    camera.updateProjectionMatrix();
  }  

  function animate() {
    requestAnimationFrame(animate);
    buildings.forEach(building => building.pan(panSpeed));
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setupThreeJS();
  addBuildings();
  animate();

  window.addEventListener('resize', onWindowResize, false);
}
