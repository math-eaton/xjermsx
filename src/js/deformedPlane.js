import * as THREE from 'three';

export function deformedPlane(containerId) {
    // Get the container element
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container element not found');
        return;
    }

    // Set up the scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    // Function to create a grid of points
    function createGridPoints(rows, columns, spacing) {
        const points = [];
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
                points.push(new THREE.Vector3(j * spacing, i * spacing, 0));
            }
        }
        return points;
    }

    // Define the grid
    const rows = 6; // 2:3 ratio, so if columns are 9, rows should be 6
    const columns = 9;
    const spacing = 1; // Spacing between points
    const points = createGridPoints(rows, columns, spacing);

    // Create the plane geometry
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Convert points to faces for the geometry
    const indices = [];
    for (let i = 0; i < rows - 1; i++) {
        for (let j = 0; j < columns - 1; j++) {
            const a = i * columns + j;
            const b = i * columns + j + 1;
            const c = (i + 1) * columns + j + 1;
            const d = (i + 1) * columns + j;

            // Two triangles per square
            indices.push(a, b, d); // Triangle 1
            indices.push(b, c, d); // Triangle 2
        }
    }

    // Update geometry with indices
    geometry.setIndex(indices);

    // Create a basic material
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });

    // Create the mesh and add it to the scene
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Camera position
    camera.position.z = 5;

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();
}
