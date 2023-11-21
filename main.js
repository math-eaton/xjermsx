import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

let renderer, scene, camera, gui, guiData;
let svgMeshes = []; 


init();

//

function init() {

  const container = document.getElementById( 'container' );

  //

  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.set( 0, 0, 200 );

  //

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  //

  const controls = new OrbitControls( camera, renderer.domElement );
  controls.addEventListener( 'change', render );
  controls.screenSpacePanning = true;

  // Reverse the control scheme
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE
  }

  //

  window.addEventListener( 'resize', onWindowResize );

  guiData = {
    currentURL: '/skyline_outline.svg',
    drawFillShapes: true,
    drawStrokes: true,
    customFillColor: '#ff0000', // Default red fill color
    customStrokeColor: '#0000ff', // Default blue stroke color
    useCustomFillColor: true, // Toggle for using custom fill color
    useCustomStrokeColor: true, // Toggle for using custom stroke color      
    fillShapesWireframe: true,
    strokesWireframe: true,
    extrudeSVG: true, // Control for extruding SVG
    extrusionDepth: 20, // Depth of extrusion      
  };

  loadSVG( guiData.currentURL );

  createGUI();

}

function createGUI() {

  if ( gui ) gui.destroy();

  gui = new GUI();

  gui.add( guiData, 'currentURL', {

    'skyline outline': '/skyline_outline.svg',
    'skyline fill': '/skyline_fill.svg',
    'moon': '/moonpixels.svg',
    'cityscape': '/cityscape.svg',
    'emptyPath': 'models/svg/emptyPath.svg',

  } ).name( 'SVG File' ).onChange( update );

  gui.add( guiData, 'drawStrokes' ).name( 'Draw strokes' ).onChange( update );

  gui.add( guiData, 'drawFillShapes' ).name( 'Draw fill shapes' ).onChange( update );

  // gui.addColor( guiData, 'customFillColor' ).name( 'Custom Fill Color' ).onChange( update );
  gui.addColor(guiData, 'customFillColor').name('Custom Fill Color').onFinishChange(update);

  // gui.addColor( guiData, 'customStrokeColor' ).name( 'Custom Stroke Color' ).onChange( update );
  gui.addColor(guiData, 'customStrokeColor').name('Custom Stroke Color').onFinishChange(update);

  gui.add( guiData, 'strokesWireframe' ).name( 'Wireframe strokes' ).onChange( update );

  gui.add( guiData, 'fillShapesWireframe' ).name( 'Wireframe fill shapes' ).onChange( update );

  gui.add( guiData, 'extrudeSVG' ).name( 'Extrude SVG' ).onChange( update );

  gui.add(guiData, 'extrusionDepth', 1, 100).name('Extrusion depth').onFinishChange(update);

  function update() {
    loadSVG(guiData.currentURL); 

    svgMeshes.forEach(mesh => {
      updateCombinedMaterial(mesh, 'phong', {
        color: '#FFFFFF', // Default white fill color
        specular: 0xFFFFFF,
        shininess: 25
    }, strokeColor); // Use stroke color for wireframe
});
}

function updateFillColor(value) {
  guiData.customFillColor = enforceHexFormat(value);
  update();
}

function updateStrokeColor(value) {
  guiData.customStrokeColor = enforceHexFormat(value);
  update();
}

function enforceHexFormat(value) {
  let hex = value;
  if (!hex.startsWith('#')) {
      hex = '#' + hex;
  }
  return hex.substring(0, 7); // Limit to 7 characters
}

function validateHexInput(value) {
  const validHex = /^#[0-9A-Fa-f]{6}$/;
  if (!validHex.test(value)) {
      console.warn('Invalid hex color code:', value);
      // Optional: Reset to a default value if invalid
  }
}

}

function updateCombinedMaterial(mesh, solidMaterialType, solidMaterialOptions, wireframeColor = 0x000000) {
  let solidMaterial;

  switch (solidMaterialType) {
      case 'phong':
          solidMaterial = new THREE.MeshPhongMaterial(solidMaterialOptions);
          break;
      case 'lambert':
          solidMaterial = new THREE.MeshLambertMaterial(solidMaterialOptions);
          break;
      // Add more cases as needed
      default:
          solidMaterial = new THREE.MeshBasicMaterial(solidMaterialOptions);
  }

  const wireframeMaterial = new THREE.MeshBasicMaterial({ 
      color: wireframeColor, 
      wireframe: true 
  });

  // Create a multi-material array
  mesh.material = [solidMaterial, wireframeMaterial];
}

function loadSVG(url) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#000000");

  const loader = new SVGLoader();
  loader.load(url, function (data) {
      const group = new THREE.Group();
      group.scale.multiplyScalar(0.25);
      group.position.x = -70;
      group.position.y = 70;
      group.scale.y *= -1;

      for (const path of data.paths) {
          const shapes = SVGLoader.createShapes(path);

          for (const shape of shapes) {
              let geometry;

              // Determine if we should extrude
              if (guiData.extrudeSVG) {
                  geometry = new THREE.ExtrudeGeometry(shape, {
                      depth: guiData.extrusionDepth,
                      bevelEnabled: false
                  });
              } else {
                  geometry = new THREE.ShapeGeometry(shape);
              }

              // Determine fill and stroke colors
              let fillColor = guiData.useCustomFillColor ? guiData.customFillColor : path.userData.style.fill;
              let strokeColor = guiData.useCustomStrokeColor ? guiData.customStrokeColor : path.userData.style.stroke;

              fillColor = fillColor !== 'none' ? fillColor : '#ffffff'; // Default white
              strokeColor = strokeColor !== 'none' ? strokeColor : '#000000'; // Default black

              // Create solid and wireframe materials
              const solidMaterial = new THREE.MeshBasicMaterial({ 
                  color: new THREE.Color(fillColor),
                  wireframe: guiData.fillShapesWireframe 
              });

              const wireframeMaterial = new THREE.MeshBasicMaterial({ 
                  color: new THREE.Color(strokeColor),
                  wireframe: guiData.strokesWireframe 
              });

              // Create a multi-material mesh
              const materials = [solidMaterial, wireframeMaterial];
              const mesh = new THREE.Mesh(geometry, materials);
              group.add(mesh);
          }
      }

      scene.add(group);
      render();
  });
}


function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
  render();

}

function render() {

  renderer.render( scene, camera );

}
