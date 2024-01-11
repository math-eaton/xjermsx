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

    // Function to place words in the grid
    function placeWordsInGrid() {
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
                        if (grid[row][col] !== '' && grid[row][col] !== word[i]) {
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
                        placed = true;
                    }
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

    const fontLoader = new FontLoader();
    fontLoader.load('font/optimer_regular.typeface.json', (font) => {
        const fontSize = 1;
        const geometrySpacing = 1.5;  // Spacing between characters

        placeWordsInGrid();
        fillGridWithRandomChars();

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
            }
        }

        animate();
    });

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
}
