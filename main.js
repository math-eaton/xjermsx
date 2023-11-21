import * as THREE from 'three';
			import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
			import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
			import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

			let renderer, scene, camera, gui, guiData;

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
					'emptyPath': 'models/svg/emptyPath.svg',

				} ).name( 'SVG File' ).onChange( update );

				gui.add( guiData, 'drawStrokes' ).name( 'Draw strokes' ).onChange( update );

				gui.add( guiData, 'drawFillShapes' ).name( 'Draw fill shapes' ).onChange( update );

        gui.addColor( guiData, 'customFillColor' ).name( 'Custom Fill Color' ).onChange( update );
        gui.add( guiData, 'useCustomFillColor' ).name( 'Use Custom Fill Color' ).onChange( update );
    
        gui.addColor( guiData, 'customStrokeColor' ).name( 'Custom Stroke Color' ).onChange( update );
        gui.add( guiData, 'useCustomStrokeColor' ).name( 'Use Custom Stroke Color' ).onChange( update );    

				gui.add( guiData, 'strokesWireframe' ).name( 'Wireframe strokes' ).onChange( update );

				gui.add( guiData, 'fillShapesWireframe' ).name( 'Wireframe fill shapes' ).onChange( update );

        gui.add( guiData, 'extrudeSVG' ).name( 'Extrude SVG' ).onChange( update );

        gui.add( guiData, 'extrusionDepth', 1, 100 ).name( 'Extrusion depth' ).onChange( update );

				function update() {

					loadSVG( guiData.currentURL );

				}

			}

      function updateMaterial(mesh, materialType, materialOptions) {
        let material;
    
        switch (materialType) {
            case 'phong':
                material = new THREE.MeshPhongMaterial(materialOptions);
                break;
            case 'lambert':
                material = new THREE.MeshLambertMaterial(materialOptions);
                break;
            // Add more cases for different material types
            default:
                material = new THREE.MeshBasicMaterial(materialOptions);
        }
    
        mesh.material = material;
    }
    

			function loadSVG( url ) {

				//

				scene = new THREE.Scene();
				scene.background = new THREE.Color( "#000000" );

				//

				const helper = new THREE.GridHelper( 160, 10, 0x8d8d8d, 0xc1c1c1 );
				helper.rotation.x = Math.PI / 2;
				// scene.add( helper );

				//

				const loader = new SVGLoader();
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('path/to/texture.jpg');


				loader.load( url, function ( data ) {

					const group = new THREE.Group();
					group.scale.multiplyScalar( 0.25 );
					group.position.x = - 70;
					group.position.y = 70;
					group.scale.y *= - 1;

					let renderOrder = 0;

          for ( const path of data.paths ) {
            let fillColor = path.userData.style.fill;
            let strokeColor = path.userData.style.stroke;

            if (guiData.useCustomFillColor) {
                fillColor = guiData.customFillColor; // Use custom fill color
            }

            if (guiData.useCustomStrokeColor) {
                strokeColor = guiData.customStrokeColor; // Use custom stroke color
            }

						if ( guiData.drawFillShapes && fillColor !== undefined && fillColor !== 'none' ) {

							const material = new THREE.MeshBasicMaterial( {
								color: new THREE.Color().setStyle( fillColor ),
								opacity: path.userData.style.fillOpacity,
								transparent: true,
								side: THREE.DoubleSide,
								depthWrite: false,
								wireframe: guiData.fillShapesWireframe
							} );

              const shapes = SVGLoader.createShapes( path );

              for ( const shape of shapes ) {
                  let geometry;

                  if (guiData.extrudeSVG) {
                      // Extrude geometry if the option is checked
                      geometry = new THREE.ExtrudeGeometry(shape, {
                          depth: guiData.extrusionDepth,
                          bevelEnabled: false
                      });
                  } else {
                      // Regular flat shape geometry
                      geometry = new THREE.ShapeGeometry(shape);
                  }

                  const mesh = new THREE.Mesh(geometry, material);
                  mesh.renderOrder = renderOrder++;

                  group.add(mesh);
                  // Update the material
                  updateMaterial(mesh, 'phong', {
                    map: texture,
                    specular: 0x222222,
                    shininess: 25
                  });
                  
							}

						}

						if ( guiData.drawStrokes && strokeColor !== undefined && strokeColor !== 'none' ) {

							const material = new THREE.MeshBasicMaterial( {
								color: new THREE.Color().setStyle( strokeColor ),
								opacity: path.userData.style.strokeOpacity,
								transparent: true,
								side: THREE.DoubleSide,
								depthWrite: false,
								wireframe: guiData.strokesWireframe
							} );

							for ( const subPath of path.subPaths ) {

								const geometry = SVGLoader.pointsToStroke( subPath.getPoints(), path.userData.style );

								if ( geometry ) {

									const mesh = new THREE.Mesh( geometry, material );
									mesh.renderOrder = renderOrder ++;

									group.add( mesh );

								}

							}

						}

					}

					scene.add( group );

					render();

				} );

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
