import { ImprovedNoise } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples//jsm/math/ImprovedNoise.js';


let scene, camera, renderer, canvas;
let A_Scene;

let mesh, texture;

const worldWidth = 500, worldDepth = 500;
const clock = new THREE.Clock();


let flag = 0;
let keypressed_code = 0;


init();
animate();

function init() {

  A_Scene = document.querySelector("a-scene").sceneEl;
  console.log(A_Scene);
  scene = A_Scene.object3D;
  camera = A_Scene.camera;
  renderer = A_Scene.renderer;
  canvas = A_Scene.canvas;

  //Scene Initialization
  {
    scene.background = new THREE.Color( 0xefd1b5 );
    scene.fog = new THREE.FogExp2( 0xefd1b5, 0.001 );
  }

  //Camera Initialization 
  {
   //console.log(camera);
    camera.position.set(0, 0, 0);
    let wasd =  camera.el.components["wasd-controls"];
    //wasd.data.acceleration = 1000;
  }

  //Renderer Initialization
  {
    renderer.setPixelRatio(window.devicePixelRatio );
    renderer.setSize(window.innerWidth, window.innerHeight );
    renderer.antialias = true;
    renderer.autoClear = false;
    renderer.autoClearColor = false;
    renderer.preserveDrawingBuffer = true;
    console.log(A_Scene.systems.renderer);
    document.body.appendChild(renderer.domElement);
  }

  /* Mountain Gen
  {
    const data = generateHeight( worldWidth, worldDepth );

    const geometry = new THREE.PlaneGeometry( 7500, 7500, worldWidth - 1, worldDepth - 1 );
    geometry.rotateX( - Math.PI / 2 );

    const vertices = geometry.attributes.position.array;

    for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {

      vertices[ j + 1 ] = data[ i ] * 10;

    }

    texture = new THREE.CanvasTexture( generateTexture( data, worldWidth, worldDepth ) );
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { map: texture } ) );
    scene.add( mesh );
    console.log("MESH! a frame")
    console.log(scene);
  }
  */


  window.addEventListener('resize', onWindowResize);

  for(let i = 1; i < scene.children.length; i++) {
    scene.children[i].name = "notnull";
}

}

function render(scene, camera) {
  try {
    renderer.render(scene, camera);
  } catch (error) {
    console.error(error);
  }
}

function animate() {
    requestAnimationFrame(animate);
    render(scene, camera);


    genBalls();
}

function generateHeight( width, height ) {

  let seed = Math.PI / 2;
  window.Math.random = function () {

    const x = Math.sin( seed ++ ) * 100;
    return x - Math.floor( x );

  };

  const size = width * height, data = new Uint8Array( size );
  const perlin = new ImprovedNoise(), z = Math.random() * 100;

  let quality = 1;

  for ( let j = 0; j < 4; j ++ ) {

    for ( let i = 0; i < size; i ++ ) {

      const x = i % width, y = ~ ~ ( i / width );
      data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality * 1.75 );

    }

    quality *= 5;

  }

  return data;

}

function generateTexture( data, width, height ) {

  let context, image, imageData, shade;

  const vector3 = new THREE.Vector3( 0, 0, 0 );

  const sun = new THREE.Vector3( 1, 1, 1 );
  sun.normalize();

  let newcanvas = document.createElement('canvas');
  newcanvas.width = width;
  newcanvas.height = height;

  context = newcanvas.getContext( '2d' );
  context.fillStyle = '#000';
  context.fillRect( 0, 0, width, height );

  image = context.getImageData( 0, 0, newcanvas.width, newcanvas.height );
  imageData = image.data;

  for ( let i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {

    vector3.x = data[ j - 2 ] - data[ j + 2 ];
    vector3.y = 2;
    vector3.z = data[ j - width * 2 ] - data[ j + width * 2 ];
    vector3.normalize();

    shade = vector3.dot( sun );

    imageData[ i ] = ( 96 + shade * 128 ) * ( 0.5 + data[ j ] * 0.007 );
    imageData[ i + 1 ] = ( 32 + shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
    imageData[ i + 2 ] = ( shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );

  }

  context.putImageData( image, 0, 0 );

  // Scaled 4x

  const canvasScaled = document.createElement('canvas');
  canvasScaled.width = width * 2;
  canvasScaled.height = height * 2;

  context = canvasScaled.getContext("2d");
  context.scale( 2, 2 );
  context.drawImage( newcanvas, 0, 0 );

  image = context.getImageData( 0, 0, canvasScaled.width, canvasScaled.height );
  imageData = image.data;

  for ( let i = 0, l = imageData.length; i < l; i += 2 ) {

    const v = ~ ~ ( Math.random() * 5 );

    imageData[ i ] += v;
    imageData[ i + 1 ] += v;
    imageData[ i + 2 ] += v;

  }

  context.putImageData( image, 0, 0 );

  return canvasScaled;

}


function getRandomIntInclusive(min, max) {

    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1) + min);
}


function genBalls() {
  
    let balls = [];
    const perlin = new ImprovedNoise();
  
    while(balls.length < 5) {
      const color = new THREE.Color(Math.random(), Math.random(), Math.random());
  
      const geometry = new THREE.SphereGeometry( 0.1, 16, 16 );
      const material = new THREE.MeshBasicMaterial( { color: color} );
      let sphere = new THREE.Mesh( geometry, material );
      sphere.position.set(getRandomIntInclusive(-5, 5), getRandomIntInclusive(-5, 5), getRandomIntInclusive(-5, 5));
  
      balls.push(sphere);
      
    }
  
    for(const ball of balls) {
      scene.add(ball);
    }

    //console.log(Math.abs( perlin.noise( 300, 3, 3 ) * 1.75))
  
    for(let i = 1; i < scene.children.length; i++) {
        if(scene.children[i].name == '') {
            let ball = scene.children[i];
            

            ball.position.x += Math.abs( perlin.noise( 3, 3, 3 ));
            ball.position.y += (keypressed_code / 1000);
            ball.position.z -= 0.05;
        
            if(ball.position.z < -5) {
                scene.remove(ball);
            }
        }
    }
  
}





/* EVENT LISTENERS */

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );

}


document.addEventListener('keydown', (event) => {
  if(event.keyCode != 0) {
      keypressed_code = event.keyCode;
      //console.log(keypressed_code);
      flag = 1;
  }
});

