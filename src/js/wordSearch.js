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

    const fontLoader = new FontLoader();
    fontLoader.load('font/optimer_regular.typeface.json', (font) => {
        const fontSize = 1;
        const geometrySpacing = 1.5;  // Spacing between characters

        for (let x = 0; x < 30; x++) {
            for (let y = 0; y < 30; y++) {
                const randomChar = String.fromCharCode(0x30A0 + Math.random() * (0x30FF - 0x30A0));
                const geometry = new TextGeometry(randomChar, {
                    font: font,
                    size: fontSize,
                    height: 0.1,
                });

                const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const mesh = new THREE.Mesh(geometry, material);

                mesh.position.set(x * geometrySpacing - (30 * geometrySpacing) / 2, y * geometrySpacing - (30 * geometrySpacing) / 2, 0);

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