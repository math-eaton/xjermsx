import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

let isUpdating = true;

function preloadObjModels(objUrls, onLoadComplete) {
    let loader = new OBJLoader();
    let models = [];
    let loadedCount = 0;

    objUrls.forEach(url => {
        loader.load(url, (obj) => {
            models.push(obj);
            loadedCount++;
            if (loadedCount === objUrls.length) {
                onLoadComplete(models);
            }
        });
    });
}

function createAsciiVoxels(cubeSize, gridSize, characters, font, scaleFactor) {
    let group = new THREE.Group();
    let voxelSize = cubeSize / gridSize;
    let halfCubeSize = cubeSize / 2;
    let voxels = [];
    let visiblePoints = [];
    let currentVisibleVoxels = 0; // Initialize visible voxel counter

    let material = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        wireframe: false,
        transparent: true,
        opacity: 0.8,
        alphaHash: true,
    });


    for (let x = -halfCubeSize; x < halfCubeSize; x += voxelSize) {
        for (let y = -halfCubeSize; y < halfCubeSize; y += voxelSize) {
            for (let z = -halfCubeSize; z < halfCubeSize; z += voxelSize) {
                let geometry = new TextGeometry('', {
                    font: font,
                    size: voxelSize * 0.8,
                    height: voxelSize / 8,
                    curveSegments: 4,
                    bevelEnabled: true,
                    bevelThickness: 2,
                    bevelSize: 1,
                    bevelOffset: 0,
                    bevelSegments: 3
                });
                let voxel = new THREE.Mesh(geometry, material);
                voxel.position.set(x, y, z);
                voxel.visible = false; // Initially set all voxels to be invisible
                voxel.scale.set(scaleFactor, scaleFactor, scaleFactor)
                group.add(voxel);
                voxels.push(voxel); // Store voxel in the array
            }
        }
    }

    // Create a material for the convex hull
    let hullMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFFFFF,
        transparent: true,
        alphaHash: true,
        opacity: 0.6,
        wireframe: true
    });

    let hullGeometry = new ConvexGeometry([]);
    let convexHull = new THREE.Mesh(hullGeometry, hullMaterial);
    group.add(convexHull);

    function updateConvexHull() {
        // Only update if there are visible points
        if (visiblePoints.length > 0) {
            hullGeometry.dispose(); // Dispose of the old geometry
            hullGeometry = new ConvexGeometry(visiblePoints);
            convexHull.geometry = hullGeometry;
            // console.log(hullGeometry)

        }
    }

    function displayRandomVoxel() {

        // Check if updates are enabled
        if (!updateEnabled) return;

        // Clear visiblePoints array
        visiblePoints = [];

        // Hide all voxels and update visiblePoints
        voxels.forEach(v => {
            v.visible = false;
            v.geometry = new TextGeometry('', {
                font: font,
                size: voxelSize,
                height: voxelSize / 2,
            });
            if (v.visible) {
                visiblePoints.push(v.position.clone());
            }
        });

        // Randomly decide to add, subtract, or maintain the number of voxels
        let change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        currentVisibleVoxels = Math.max(7, Math.min(7, currentVisibleVoxels + change));

        // Randomly choose distinct voxels to display with random character
        while (currentVisibleVoxels > 0) {
            let randomIndex = Math.floor(Math.random() * voxels.length);
            let randomChar = characters[Math.floor(Math.random() * characters.length)];
            let voxel = voxels[randomIndex];
            voxel.geometry.dispose(); // Dispose of the old geometry
            voxel.geometry = new TextGeometry(randomChar, {
                font: font,
                size: voxelSize * 0.8,
                height: voxelSize / 8,
                curveSegments: 4,
                bevelEnabled: true,
                bevelThickness: 2,
                bevelSize: 1,
                bevelOffset: 0,
                bevelSegments: 3
            });
            voxel.visible = true;
            visiblePoints.push(voxel.position.clone());
            currentVisibleVoxels--;
        }

        // Update visiblePoints array with positions of visible voxels
        visiblePoints = voxels.filter(v => v.visible).map(v => v.position.clone());

        // Update the convex hull
        updateConvexHull();
    }

    // Start the interval for continuous updates
    function startUpdateInterval() {
        if (!isUpdating) {
            updateInterval = setInterval(displayRandomVoxel, 100); // Adjust the interval as needed
            isUpdating = true;
        }
    }

    // Stop the interval
    function stopUpdateInterval() {
        if (isUpdating) {
            clearInterval(updateInterval);
            isUpdating = false;
        }
    }

    // Event listener for key press
    window.addEventListener('keydown', function(event) {
        if (event.key === 't' || event.key === 'T') {
            displayRandomVoxel(); // Randomize once without toggling the interval
        } else if (event.key === 'r' || event.key === 'R') {
            if (isUpdating) {
                stopUpdateInterval(); // Stop the continuous update
            } else {
                startUpdateInterval(); // Start the continuous update
            }
        }
    });

    // Start the interval initially
    startUpdateInterval();

    // Set an interval to update the displayed voxel
    setInterval(displayRandomVoxel, 100);

    return group;
}

// // fully filled cube voxel style
function createCubes(cubeSize, gridSize, scaleFactor) {
    let group = new THREE.Group();
    let voxelSize = cubeSize / gridSize;
    let halfCubeSize = cubeSize / 2;
    let halfVoxelSize = voxelSize / 2;

    let material = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
        alphaHash: true,
    });
    let geometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
    let voxels = [];  // Array to store all voxels

    for (let x = -halfCubeSize; x < halfCubeSize; x += voxelSize) {
        for (let y = -halfCubeSize; y < halfCubeSize; y += voxelSize) {
            for (let z = -halfCubeSize; z < halfCubeSize; z += voxelSize) {
                let voxel = new THREE.Mesh(geometry, material);
                voxel.position.set(x + halfVoxelSize, y + halfVoxelSize, z + halfVoxelSize);
                voxel.visible = false; // Initially set all voxels to be invisible
                voxel.scale.set(scaleFactor, scaleFactor, scaleFactor)
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
        currentVisibleVoxels = Math.max(0, Math.min(4, currentVisibleVoxels + change));
    
        // Create a set to store indices of voxels to be shown
        let indicesToShow = new Set();
    
        // Randomly choose distinct voxels to display
        while (indicesToShow.size < currentVisibleVoxels) {
            let randomIndex = Math.floor(Math.random() * voxels.length);
            indicesToShow.add(randomIndex);
        }
    
        // Make the selected voxels visible
        
        (index => {
            voxels[index].visible = true;
        });
    }
            
    // Set an interval to update the displayed voxel
    setInterval(displayRandomVoxel, 100);

    return group;
}

function createSpheres(cubeSize, gridSize, scaleFactor) {
    let group = new THREE.Group();
    let voxelSize = cubeSize / gridSize;
    let halfCubeSize = cubeSize / 2;
    let halfVoxelSize = voxelSize / 2;

    let material = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        wireframe: true,
        transparent: false,
        opacity: 0.5,
        alphaHash: true,
    });
    
    // Using SphereGeometry instead of BoxGeometry
    let geometry = new THREE.SphereGeometry(halfVoxelSize, 4, 4); // Adjust the 2nd and 3rd args for more detail
    let spheres = [];  // Array to store all spheres

    for (let x = -halfCubeSize; x < halfCubeSize; x += voxelSize) {
        for (let y = -halfCubeSize; y < halfCubeSize; y += voxelSize) {
            for (let z = -halfCubeSize; z < halfCubeSize; z += voxelSize) {
                let sphere = new THREE.Mesh(geometry, material);
                sphere.position.set(x + halfVoxelSize, y + halfVoxelSize, z + halfVoxelSize);
                sphere.visible = false; // Initially set all spheres to be invisible

                sphere.scale.set(scaleFactor, scaleFactor, scaleFactor);

                group.add(sphere);
                spheres.push(sphere); // Store sphere in the array
            }
        }
    }

    // Function to randomly display one sphere
    let currentVisibleSpheres = 0; // Initialize outside the function

    function displayRandomSphere() {
        // Hide all spheres
        spheres.forEach(s => s.visible = false);
    
        // Randomly decide to add, subtract, or maintain the number of spheres
        let change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        currentVisibleSpheres = Math.max(0, Math.min(4, currentVisibleSpheres + change));
    
        // Create a set to store indices of spheres to be shown
        let indicesToShow = new Set();
    
        // Randomly choose distinct spheres to display
        while (indicesToShow.size < currentVisibleSpheres) {
            let randomIndex = Math.floor(Math.random() * spheres.length);
            indicesToShow.add(randomIndex);
        }
    
        // Make the selected spheres visible
        indicesToShow.forEach(index => {
            spheres[index].visible = true;
        });
    }
            
    // Set an interval to update the displayed sphere
    setInterval(displayRandomSphere, 100);

    return group;
}


function createRandomObjVoxels(cubeSize, gridSize, models, objScaleFactor) {
    let group = new THREE.Group();
    let voxelSize = cubeSize / gridSize;
    let halfCubeSize = cubeSize / 2;
    let halfVoxelSize = voxelSize / 2;
    let objVoxels = [];

    for (let x = -halfCubeSize; x < halfCubeSize; x += voxelSize) {
        for (let y = -halfCubeSize; y < halfCubeSize; y += voxelSize) {
            for (let z = -halfCubeSize; z < halfCubeSize; z += voxelSize) {
                let placeholder = new THREE.Object3D();
                placeholder.position.set(x + halfVoxelSize, y + halfVoxelSize, z + halfVoxelSize);
                placeholder.visible = false;
                group.add(placeholder);
                objVoxels.push(placeholder);
            }
        }
    }

    function displayRandomObjVoxel() {
        objVoxels.forEach(v => v.visible = false);
    
        let change = Math.floor(Math.random() * 3) - 1;
        let currentVisibleObjVoxels = Math.max(0, Math.min(4, change));
        let indicesToShow = new Set();
    
        while (indicesToShow.size < currentVisibleObjVoxels) {
            let randomIndex = Math.floor(Math.random() * objVoxels.length);
            indicesToShow.add(randomIndex);
        }
    
        indicesToShow.forEach(index => {
            let objVoxel = objVoxels[index];
            let randomModelIndex = Math.floor(Math.random() * models.length);
            let model = models[randomModelIndex].clone(); // Clone the preloaded model
    
            // Random rotation angles
            let randomRotationX = Math.random() * Math.PI; // 0 to π
            let randomRotationY = Math.random() * Math.PI; // 0 to π
            let randomRotationZ = Math.random() * Math.PI; // 0 to π
    
            model.rotation.set(randomRotationX, randomRotationY, randomRotationZ);
        
            // Calculate bounding box to normalize size
            let boundingBox = new THREE.Box3().setFromObject(model);
            let size = new THREE.Vector3();
            boundingBox.getSize(size);
    
            // Calculate scale to fit the model within a voxel
            let maxDimension = Math.max(size.x, size.y, size.z);
            let scaleToFit = voxelSize / maxDimension;
    
            // Apply custom material and scale
            model.traverse(function (child) {
                if (child.isMesh) {
                    child.material = new THREE.MeshBasicMaterial({
                        color: 0xffffff, // Magenta
                        wireframe: true,
                        alphaHash: true,
                        opacity: 0.8,
                    });
                    child.scale.set(scaleToFit, scaleToFit, scaleToFit); // Normalize scale
                }
            });
    
            // Reset position and apply additional scale factor
            model.position.set(0, 0, 0);
            model.scale.multiplyScalar(objScaleFactor); // Apply additional scaling
    
            objVoxel.add(model);
            objVoxel.visible = true;
        });
    }
    
    setInterval(displayRandomObjVoxel, 100);
        
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
    controls.minDistance = 50;
    controls.maxDistance = 500;

    // Colors
    let cyanColor = new THREE.Color(0x00ffff);
    let magentaColor = new THREE.Color(0xff00ff);
    let yellowColor = new THREE.Color(0xffff00);

    // Cube and grid parameters
    const cubeSize = 250;
    const gridSize = 8;
    const pointCloudDensity = 20;
    const scaleFactor = 0.8;
    const objScaleFactor = 2;

    // Define ASCII characters to be used
    const asciiCharacters = "XJERMSX";
    
    // Load the font and then create the scene
    loadFont('font/optimer_regular.typeface.json', (font) => {
        // Now the font is loaded, you can safely create ASCII voxels
        let asciiVoxelGroup = createAsciiVoxels(cubeSize, gridSize, asciiCharacters, font, scaleFactor);
        scene.add(asciiVoxelGroup);

    let objUrls = ['3D/horse2.obj', '3D/cow.obj', '3D/head.OBJ', '3D/hammer.obj' ];
    preloadObjModels(objUrls, (models) => {
        let objVoxelGroup = createRandomObjVoxels(cubeSize, gridSize, models, objScaleFactor);
        console.log(objVoxelGroup)
        scene.add(objVoxelGroup);
    });       
        
    // Add isometric cube
    let isoCube = createIsometricCube(cubeSize, gridSize, scaleFactor);
    let voxelCube = createCubes(cubeSize, gridSize, scaleFactor)
    let sphere = createSpheres(cubeSize, gridSize, scaleFactor)
    scene.add(isoCube);
    // scene.add(voxelCube);
    // scene.add(sphere);

    // Camera positioning
    camera.position.z = 500;
    camera.up.set(0,1,0);

    let updateInterval;
    isUpdating = true; // Flag to track the update state

    function toggleUpdate() {
        updateEnabled = !updateEnabled; // Toggle the update state
    }

    // Start the interval initially
    startUpdateInterval();

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
})
}

function loadFont(url, callback) {
    let loader = new FontLoader();
    loader.load(url, function (loadedFont) {
        callback(loadedFont);
    }, undefined, function (error) {
        console.error('An error occurred while loading the font:', error);
    });
}