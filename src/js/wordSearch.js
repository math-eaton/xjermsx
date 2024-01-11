import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

export function wordSearch(containerId) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera.position.z = 50;

    const gridSize = 30;
    let grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
    const wordList = ["THREE", "JAVASCRIPT", "GRID", "TEXT", "SEARCH"];

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
                if (row < gridSize && col < gridSize) {
                    grid[row][col] = wordInfo.word[i];
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
    let fontSize = 1; // Declare fontSize here and set a default value

    const fontLoader = new FontLoader();
    fontLoader.load('font/optimer_regular.typeface.json', (loadedFont) => {
        font = loadedFont; // Assign the loaded font to the font variable
    
        const fontSize = 1;
        const geometrySpacing = 1.5; // Spacing between characters
    
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

                const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const mesh = new THREE.Mesh(geometry, material);

                mesh.position.set(x * geometrySpacing - (gridSize * geometrySpacing) / 2, y * geometrySpacing - (gridSize * geometrySpacing) / 2, 0);

                scene.add(mesh);
                textMeshes.push({ mesh, x, y }); // Store the mesh with its grid coordinates
            }
        }

        animate();
    });

    function animate() {
        requestAnimationFrame(animate);
    
        moveWords(); // Update the positions of the words
    
        // Check if both textMeshes and font are defined before updating
        if (textMeshes && font) {
            textMeshes.forEach(item => {
                const newChar = grid[item.x][item.y];
                item.mesh.geometry = new TextGeometry(newChar, {
                    font: font,
                    size: fontSize,
                    height: 0.1,
                });
            });
        }
    
        renderer.render(scene, camera);
    }
        
}
