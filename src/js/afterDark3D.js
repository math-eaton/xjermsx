import * as THREE from 'three';

export function afterDark3D(containerId) {
  let scene, camera, renderer;
  let buildings = [];
  let stars = [];
  let panSpeed = 0.05;
  let depth = 10; 




  class Building {
    constructor(x, width, height, z) {
        const geometry = new THREE.BoxGeometry(width, height, 10);

        // Solid Mesh
        this.solidMesh = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({ 
                color: 0x029392,
                transparent: true,
                alphaHash: true,
                opacity: 0.8,
             })
        );
        this.solidMesh.position.set(x, height / 2, z);
        scene.add(this.solidMesh);

        // Wireframe Mesh
        this.wireframeMesh = new THREE.Mesh(
            geometry,
            new THREE.MeshDepthMaterial({ color: 0x000000, wireframe: true })
        );
        this.wireframeMesh.position.set(x, height / 2, z);
        scene.add(this.wireframeMesh);

        // Points Geometry
        // Create points for each face
        const frontPoints = this.createFacePoints(width, height, depth, 'front');
        const backPoints = this.createFacePoints(width, height, depth, 'back');
        const leftPoints = this.createFacePoints(width, height, depth, 'left');
        const rightPoints = this.createFacePoints(width, height, depth, 'right');
        const topPoints = this.createFacePoints(width, height, depth, 'top');
        const bottomPoints = this.createFacePoints(width, height, depth, 'bottom');

        const allPoints = [...frontPoints, ...backPoints, ...leftPoints, ...rightPoints, ...topPoints, ...bottomPoints];

        const pointsGeometry = new THREE.BufferGeometry();
        pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(allPoints, 3));

        // Points Material
        const pointsMaterial = new THREE.PointsMaterial({
            color: 0x00FF00, // Bright green for visibility
            size: 5,
            opacity: 0.5,
            transparent: true
        });
        
        // Points Mesh
        // Points Mesh
        this.pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial);
        this.pointsMesh.position.set(x, height / 2, z);
        scene.add(this.pointsMesh);
    }

    createFacePoints(width, height, depth, face) {
        const points = [];
        const gridX = 10; // Adjust as needed
        const gridY = 10; // Adjust as needed
        const stepX = width / gridX;
        const stepY = height / gridY;
        const stepZ = depth / gridX; // Assuming depth uses the same grid as width for simplicity
    
        for (let i = 0; i <= gridX; i++) {
            for (let j = 0; j <= gridY; j++) {
                let posX, posY, posZ;
                switch (face) {
                    case 'front':
                        posX = (i * stepX) - width / 2;
                        posY = (j * stepY) - height / 2;
                        posZ = depth / 2 + 0.1;
                        break;
                    case 'back':
                        posX = (i * stepX) - width / 2;
                        posY = (j * stepY) - height / 2;
                        posZ = -depth / 2;
                        break;
                    case 'left':
                        posX = -width / 2;
                        posY = (j * stepY) - height / 2;
                        posZ = (i * stepZ) - depth / 2;
                        break;
                    case 'right':
                        posX = width / 2;
                        posY = (j * stepY) - height / 2;
                        posZ = (i * stepZ) - depth / 2;
                        break;
                    case 'top':
                        posX = (i * stepX) - width / 2;
                        posY = height / 2;
                        posZ = (j * stepZ) - depth / 2;
                        break;
                    case 'bottom':
                        posX = (i * stepX) - width / 2;
                        posY = -height / 2;
                        posZ = (j * stepZ) - depth / 2;
                        break;
                }
                points.push(posX, posY, posZ);
            }
        }
        return points;
    }
    
    pan(delta) {
        // Update position for all meshes including points
        this.solidMesh.position.x -= delta;
        this.wireframeMesh.position.x -= delta;
        this.pointsMesh.position.x -= delta;

        // Reuse buildings logic
        if (this.solidMesh.position.x < -100) {
            this.solidMesh.position.x += 200;
            this.wireframeMesh.position.x += 200;
            this.pointsMesh.position.x += 200;
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
    zoomOrthographicCamera(0.15); // Example: zoom in by a factor of 0.5
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById(containerId).appendChild(renderer.domElement);
  }

  function addBuildings() {
    let xStart = -150;
    let xEnd = 100; // Define the end limit for x
    let zPositions = [-200, -180, -160, -140, -120, -100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100, 120];
    let minWidth = 5;
    let maxWidth = 15;
    let minGap = 1;
    let maxGap = 15;
    let depthIncrement = 5; // Increment value for depth

    zPositions.forEach((z, index) => {
        let x = xStart;
        let depth = 10 + index * depthIncrement; // Calculate depth based on row index

        while (x < xEnd) {
            let width = minWidth + Math.random() * (maxWidth - minWidth);
            let height = Math.random() * 50 + 20;
            let building = new Building(x, width, height, depth, z);
            buildings.push(building);

            let gap = minGap + Math.random() * (maxGap - minGap);
            x += width + gap; // Move x for the next building
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
