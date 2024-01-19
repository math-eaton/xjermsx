import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

export function wordSearch(containerId) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio / 2);
    document.body.appendChild(renderer.domElement);

    camera.position.z = 30;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enableZoom = true;

    // Function to update controls
    function updateControls() {
        controls.update();
    }

    // Add event listeners for user interactions
    renderer.domElement.addEventListener('mousemove', updateControls);
    renderer.domElement.addEventListener('touchmove', updateControls);
    renderer.domElement.addEventListener('wheel', updateControls);

    const gridSize = 18;
    let grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
    const wordList = ["XJERMSX", "DRUGSINTHEBATHROOM", "SKYLINE", "BOSSA", "MOODRING", "WHATEVER", "ASS"];

    let wordPositions = []; // Array to store the positions and directions of the words

    // Initialize word positions and directions
    function initializeWordPositions() {
        wordList.forEach(word => {
            let placed = false;
            while (!placed) {
                const direction = Math.floor(Math.random() * 3); // 0: horizontal, 1: vertical, 2: diagonal
                const startRow = Math.floor(Math.random() * gridSize);
                const startCol = Math.floor(Math.random() * gridSize);
                const endRow = startRow + (direction === 1 ? word.length : (direction === 2 ? word.length - 1 : 0));
                const endCol = startCol + (direction === 0 ? word.length : (direction === 2 ? word.length - 1 : 0));
    
                if (endRow < gridSize && endCol < gridSize) {
                    let canPlace = true;
                    for (let i = 0; i < word.length; i++) {
                        const row = startRow + (direction === 1 || direction === 2 ? i : 0);
                        const col = startCol + (direction === 0 || direction === 2 ? i : 0);
                        if (grid[row][col] !== '') {
                            canPlace = false;
                            break;
                        }
                    }
    
                    if (canPlace) {
                        for (let i = 0; i < word.length; i++) {
                            const row = startRow + (direction === 1 || direction === 2 ? i : 0);
                            const col = startCol + (direction === 0 || direction === 2 ? i : 0);
                            grid[row][col] = word[i];
                        }
                        wordPositions.push({
                            word: word,
                            startRow: startRow,
                            startCol: startCol,
                            direction: direction,
                            length: word.length,
                            velocity: 1
                        });
                        placed = true;
                    }
                }
            }
        });
    }
        
    function moveWords() {
        wordPositions.forEach(wordInfo => {
            // Clear current word position
            for (let i = 0; i < wordInfo.length; i++) {
                const row = wordInfo.startRow + (wordInfo.direction === 1 || wordInfo.direction === 2 ? i : 0);
                const col = wordInfo.startCol + (wordInfo.direction === 0 || wordInfo.direction === 2 ? i : 0);
                if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
                    grid[row][col] = String.fromCharCode(0x30A0 + Math.random() * (0x30FF - 0x30A0));
                }
            }

            // Update position and check for boundary collision
            let newStartRow = wordInfo.startRow + (wordInfo.direction === 1 || wordInfo.direction === 2 ? wordInfo.velocity : 0);
            let newStartCol = wordInfo.startCol + (wordInfo.direction === 0 || wordInfo.direction === 2 ? wordInfo.velocity : 0);
    
            // Check collision for leading edge of the word
            let leadingEdgeRow = wordInfo.direction === 1 || wordInfo.direction === 2 ? newStartRow + wordInfo.length - 1 : newStartRow;
            let leadingEdgeCol = wordInfo.direction === 0 || wordInfo.direction === 2 ? newStartCol + wordInfo.length - 1 : newStartCol;
    
            // Boundary collision check
            if (leadingEdgeRow >= gridSize || leadingEdgeRow < 0 || leadingEdgeCol >= gridSize || leadingEdgeCol < 0) {
                wordInfo.velocity *= -1; // Reverse the velocity
            } else {
                // Update the word's position
                wordInfo.startRow = newStartRow;
                wordInfo.startCol = newStartCol;
            }
        
            // Place word at new position
            for (let i = 0; i < wordInfo.length; i++) {
                const row = wordInfo.startRow + (wordInfo.direction === 1 || wordInfo.direction === 2 ? i : 0);
                const col = wordInfo.startCol + (wordInfo.direction === 0 || wordInfo.direction === 2 ? i : 0);

                // Check if the new position is within the grid boundaries
                if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
                    grid[row][col] = wordInfo.word[i];
                } else {
                    // Handle the case where the new position is outside the grid
                    // This could involve reversing the direction, resetting the position, etc.
                    // For now, let's simply log an error message
                    console.error(`Word position out of bounds: row=${row}, col=${col}`);
                }
            }
        });
    }
                
    // Function to fill the grid with random characters
    function fillGridWithRandomChars() {
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] === '') {
                    grid[i][j] = String.fromCharCode(0x30A0 + Math.random() * (0x30FF - 0x30A0));
                }
            }
        }
    }

    let textMeshes = []; // Declare textMeshes here, outside the fontLoader.load
    let font; // Declare font here to make it accessible in the animate function
    let fontSize = 1.25; // Declare fontSize here and set a default value

    const fontLoader = new FontLoader();
    fontLoader.load('font/VT323_Regular.json', (loadedFont) => {
        font = loadedFont; // Assign the loaded font to the font variable
    
        const fontSize = 1.25;
        const geometrySpacing = 2.5; // Spacing between characters
    
        initializeWordPositions();
        fillGridWithRandomChars();
    
        textMeshes = []; // Initialize textMeshes inside the callback
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                const char = grid[x][y];
                const geometry = new TextGeometry(char, {
                    font: font,
                    size: fontSize,
                    height: 0.1,
                });
        
                const material = new THREE.MeshBasicMaterial({ 
                    color: 0xffffff,
                    wireframe: true,
                    transparent: true,
                    alphaHash: true,
                    opacity: 0.85,
                 });
                const mesh = new THREE.Mesh(geometry, material);
        
                mesh.position.set(x * geometrySpacing - (gridSize * geometrySpacing) / 2, y * geometrySpacing - (gridSize * geometrySpacing) / 2, 0);
        
                scene.add(mesh);
                textMeshes.push({ mesh, x, y, geometry }); // Store the mesh with its grid coordinates and geometry
            }
        }

        
        animate();
    });

function updateTextMeshes() {
    for (const item of textMeshes) {
        const newChar = grid[item.x][item.y];
        if (newChar !== item.mesh.geometry.parameters.text) {
            item.geometry.dispose(); // Dispose old geometry
            item.mesh.geometry = new TextGeometry(newChar, {
                font: font,
                size: fontSize,
                height: 0.1,
            });
        }
    }
}        

    let lastMoveTime = 0;
    const moveInterval = 200; // Adjust this value to control speed (in milliseconds)
    
    function animate(currentTime) {
        requestAnimationFrame(animate);
    
        // Ensure currentTime is a number
        if (typeof currentTime !== 'number') {
            currentTime = performance.now();
        }
    
        // Check if enough time has passed to move the words
        if (currentTime - lastMoveTime > moveInterval) {
            moveWords(); // Update the positions of the words
            updateTextMeshes(); // Update the text geometries
            lastMoveTime = currentTime;
        }
    
        
        renderer.render(scene, camera);
    }
    
    animate(0); // Start the animation loop
}
