import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';

export function isometricCube3D(containerId) {
    let containerDiv = document.getElementById(containerId);
    console.log("Container dimensions:", containerDiv.offsetWidth, containerDiv.offsetHeight);

    // Scene, camera, and renderer setup
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(75, containerDiv.offsetWidth / containerDiv.offsetHeight, 0.1, 1000);
    let renderer = new THREE.WebGLRenderer();
    renderer.setSize(containerDiv.offsetWidth, containerDiv.offsetHeight);
    containerDiv.appendChild(renderer.domElement);

    const normalRenderer = new THREE.WebGLRenderer();
    normalRenderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('cubeNormalContainer').appendChild(normalRenderer.domElement);


    // Setup for the ASCII renderer and scene
    const asciiRenderer = new THREE.WebGLRenderer();
    const customCharSet = ' ♡❣♥®x6☹%&*⛆@#❤☺☻  '
    const asciiOptions = {
        invert: true,
        resolution: 0.3, // Adjust for more or less detail
        // resolution: 0.3,
        scale: 1.0,       // Adjust based on your display requirements
        color: false,     // Set to true if you want colored ASCII characters
        block: false,
    };  
    const asciiEffect = new AsciiEffect(asciiRenderer, customCharSet, asciiOptions);
    asciiEffect.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('cubeAsciiContainer').appendChild(asciiEffect.domElement);
    const asciiScene = new THREE.Scene();
    // asciiRenderer.setClearColor(0x000000, 0); // Transparent background

    // Orbit controls setup
    let controls = new OrbitControls(camera, asciiRenderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.1;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 100;
    controls.maxDistance = 500;

    // lighting

    // Add a static light with high intensity and distance
    const light = new THREE.PointLight(0xffffff, 3, 500);
    light.position.set(0,0,10);
    light.color.set(0x0000ff); // Blue color
    asciiScene.add(light);

    //  ambient light for softer overall scene illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    asciiScene.add(ambientLight);

    // Directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 15, 5);
    asciiScene.add(dirLight);
    console.log("added ", dirLight)
    

    // Colors
    let cyanColor = new THREE.Color(0x00ffff);
    let magentaColor = new THREE.Color(0xff00ff);
    let yellowColor = new THREE.Color(0xffff00);

    // Cube and grid parameters
    const cubeSize = 250;
    const gridSize = 8;
    const pointCloudDensity = 20;

    // Add isometric cube
    let isoCube = createIsometricCube(cubeSize, gridSize);
    let voxelCube = createVoxels(cubeSize, gridSize)
    scene.add(isoCube);
    // scene.add(voxelCube);


    // Create voxel group for ASCII scene
    let voxelGroup = createVoxels(cubeSize, gridSize);
    asciiScene.add(voxelGroup);
    

    // Create point clouds
    let cyanPointCloud = createPointCloud(pointCloudDensity, cyanColor);
    let magentaPointCloud = createPointCloud(pointCloudDensity, magentaColor);
    let yellowPointCloud = createPointCloud(pointCloudDensity, yellowColor);
    // scene.add(cyanPointCloud);
    // scene.add(magentaPointCloud);
    // scene.add(yellowPointCloud);

    // Camera positioning
    camera.position.z = 500;
    camera.up.set(0,1,0);

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        // Update controls
        controls.update();

        // Render the ASCII scene
        asciiEffect.render(asciiScene, camera);

        // Render the normal scene
        renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        let width = containerDiv.offsetWidth;
        let height = containerDiv.offsetHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    
        renderer.setSize(width, height);
        asciiRenderer.setSize(width, height);
        asciiEffect.setSize(width, height);
    });
}

// // fully filled cube voxel style
function createVoxels(cubeSize, gridSize) {
    let group = new THREE.Group();
    let voxelSize = cubeSize / gridSize;
    let halfCubeSize = cubeSize / 2;
    let halfVoxelSize = voxelSize / 2;

    let material = new THREE.MeshBasicMaterial({
        color: 0xF00FFF,
        wireframe: false,
        transparent: false,
        opacity: 0.85,
        alphaHash: false,
    });
    let geometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
    let voxels = [];  // Array to store all voxels

    for (let x = -halfCubeSize; x < halfCubeSize; x += voxelSize) {
        for (let y = -halfCubeSize; y < halfCubeSize; y += voxelSize) {
            for (let z = -halfCubeSize; z < halfCubeSize; z += voxelSize) {
                let voxel = new THREE.Mesh(geometry, material);
                voxel.position.set(x + halfVoxelSize, y + halfVoxelSize, z + halfVoxelSize);
                voxel.visible = false; // Initially set all voxels to be invisible
                group.add(voxel);
                voxels.push(voxel); // Store voxel in the array
            }
        }
    }

    // Function to randomly display one voxel
    let currentVisibleVoxels = 0; // Initialize outside the function

    function displayRandomVoxel() {
        // Hide all voxels
        voxels.forEach(v => v.visible = false);
    
        // Randomly decide to add, subtract, or maintain the number of voxels
        let change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        currentVisibleVoxels = Math.max(1, Math.min(8, currentVisibleVoxels + change));
    
        // Create a set to store indices of voxels to be shown
        let indicesToShow = new Set();
    
        // Randomly choose distinct voxels to display
        while (indicesToShow.size < currentVisibleVoxels) {
            let randomIndex = Math.floor(Math.random() * voxels.length);
            indicesToShow.add(randomIndex);
        }
    
        // Make the selected voxels visible
        indicesToShow.forEach(index => {
            voxels[index].visible = true;
        });
    }
            
    // Set an interval to update the displayed voxel
    setInterval(displayRandomVoxel, 500);

    return group;
}

function createIsometricCube(size, grid) {
    let group = new THREE.Group();

    let halfSize = size / 2;
    let step = size / grid;

    // Helper function to add lines with face name
    function addLineWithFaceName(group, start, end, faceName) {
        let line = addLine(group, start, end);
        line.faceName = faceName;  // Assign a face name to the line
        return line;
    }

    // Draw grid lines for each face of the cube
    for (let i = -halfSize; i <= halfSize; i += step) {
        // Bottom face grid lines keep
        addLineWithFaceName(group, [-halfSize, -halfSize, i], [halfSize, -halfSize, i], 'bottom'); // Parallel to X
        addLineWithFaceName(group, [i, -halfSize, -halfSize], [i, -halfSize, halfSize], 'bottom'); // Parallel to Z

        // Top face grid lines maybe keep
        addLineWithFaceName(group, [-halfSize, halfSize, i], [halfSize, halfSize, i], 'top'); // Parallel to X
        addLineWithFaceName(group, [i, halfSize, -halfSize], [i, halfSize, halfSize], 'top'); // Parallel to Z

        // Left side face grid lines keep
        addLineWithFaceName(group, [-halfSize, i, -halfSize], [-halfSize, i, halfSize], 'left'); // Parallel to Z
        addLineWithFaceName(group, [-halfSize, -halfSize, i], [-halfSize, halfSize, i], 'left'); // Parallel to Y

        // Back face grid lines
        addLineWithFaceName(group, [-halfSize, i, -halfSize], [halfSize, i, -halfSize], 'back'); // Parallel to X
        addLineWithFaceName(group, [i, -halfSize, -halfSize], [i, halfSize, -halfSize], 'back'); // Parallel to Z
    }

    return group;
}

function addLine(group, start, end) {
    let material = new THREE.LineBasicMaterial({ color: 0xffffff });
    let geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...start),
        new THREE.Vector3(...end)
    ]);
    let line = new THREE.Line(geometry, material);
    group.add(line);
    return line;
}


function createPointCloud(density, color) {
    let points = [];
    let positions = [];

    for (let i = 0; i < density; i++) {
        // Randomly position points within a cube
        let x = Math.random() * 200 - 100;
        let y = Math.random() * 200 - 100;
        let z = Math.random() * 200 - 100;
        points.push(new THREE.Vector3(x, y, z));
        positions.push(x, y, z); // Add positions as flat array
    }

    let pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    let pointsMaterial = new THREE.PointsMaterial({ color: color, size: 1 });
    let pointCloud = new THREE.Points(pointsGeometry, pointsMaterial);

    // Create the convex hull geometry
    let hullGeometry = new ConvexGeometry(points);
    let hullMaterial = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5, wireframe: true });
    let convexHull = new THREE.Mesh(hullGeometry, hullMaterial);

    // Group the point cloud and its convex hull
    let group = new THREE.Group();
    group.add(pointCloud);
    group.add(convexHull);

    return group;
}