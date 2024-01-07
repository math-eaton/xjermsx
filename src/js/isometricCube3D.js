import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';

export function isometricCube3D(containerId) {
    let containerDiv = document.getElementById(containerId);
    console.log("Container dimensions:", containerDiv.offsetWidth, containerDiv.offsetHeight);

    // Scene, camera, and renderer setup
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(75, containerDiv.offsetWidth / containerDiv.offsetHeight, 0.1, 1000);
    let renderer = new THREE.WebGLRenderer();
    renderer.setSize(containerDiv.offsetWidth, containerDiv.offsetHeight);
    containerDiv.appendChild(renderer.domElement);

    // Orbit controls setup
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.1;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 100;
    controls.maxDistance = 500;

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
    scene.add(isoCube);

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

        // Render the scene
        renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = containerDiv.offsetWidth / containerDiv.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerDiv.offsetWidth, containerDiv.offsetHeight);
    });
}

// // fully filled cube voxel style
// function createIsometricCube(size, grid) {
//     let group = new THREE.Group();

//     // Create box geometry and material
//     let geometry = new THREE.BoxGeometry(size, size, size);
//     let edges = new THREE.EdgesGeometry(geometry);
//     let material = new THREE.LineBasicMaterial({ color: 0xffffff });
//     let cube = new THREE.LineSegments(edges, material);
//     group.add(cube);

//     // Create grid lines on each face of the cube
//     let step = size / grid;
//     let halfSize = size / 2;
//     for (let i = -halfSize; i <= halfSize; i += step) {
//         for (let j = -halfSize; j <= halfSize; j += step) {
//             // Lines parallel to X-axis
//             addLine(group, [-halfSize, i, j], [halfSize, i, j]);

//             // Lines parallel to Y-axis
//             addLine(group, [i, -halfSize, j], [i, halfSize, j]);

//             // Lines parallel to Z-axis
//             addLine(group, [i, j, -halfSize], [i, j, halfSize]);
//         }
//     }

//     return group;
// }

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