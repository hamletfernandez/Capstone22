//import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

//import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';
import { ImprovedNoise } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples//jsm/math/ImprovedNoise.js';

let mesh, texture;

const worldWidth = 1000, worldDepth = 1000;
const clock = new THREE.Clock();


let flag = 0;
let keypressed_code = 0;



let h1 = document.getElementById("first");
h1.style.color = "red";

let b = document.createElement('div');
b.style.background = "pink";
document.body.appendChild(b);


let entity = document.querySelector("a-scene").sceneEl;
console.log(entity);

//let sceneElem = document.getElementsByTagName("a-scene")[0].sceneEl;
let scene = entity.object3D;
let renderer = entity.renderer;
let camera = entity.camera;
camera.el.components["wasd-controls"].data.acceleration = 1000;
console.log(camera.el.components["wasd-controls"].data.acceleration);
console.log(camera);
let canvas = entity.canvas;


init();
animate();

function render() {
  renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    render();


    if(flag){
        //genBalls();
    }

}

function init() {

  //container = document.getElementById( 'container' );

  scene.background = new THREE.Color( 0xefd1b5 );
  scene.fog = new THREE.FogExp2( 0xefd1b5, 0.0025 );

  const data = generateHeight( worldWidth, worldDepth );

  //camera.position.set( 100, 800, - 800 );
  //camera.lookAt( - 100, 810, - 800 );

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

  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

  //entity.look.handleResize();

}

function generateHeight( width, height ) {

  let seed = Math.PI / 4;
  window.Math.random = function () {

    const x = Math.sin( seed ++ ) * 10000;
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

  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  context = canvas.getContext( '2d' );
  console.log(context);
  context.fillStyle = '#000';
  context.fillRect( 0, 0, width, height );

  image = context.getImageData( 0, 0, canvas.width, canvas.height );
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
  console.log(canvasScaled);
  canvasScaled.width = width * 4;
  canvasScaled.height = height * 4;

  context = canvasScaled.getContext("2d");
  console.log(context);
  context.scale( 4, 4 );
  context.drawImage( canvas, 0, 0 );

  image = context.getImageData( 0, 0, canvasScaled.width, canvasScaled.height );
  imageData = image.data;

  for ( let i = 0, l = imageData.length; i < l; i += 4 ) {

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

for(let i = 1; i < scene.children.length; i++) {
    scene.children[i].name = "notnull";
}


function genBalls() {
  
    let balls = [];
  
    while(balls.length < 10) {
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
  
    for(let i = 1; i < scene.children.length; i++) {
        if(scene.children[i].name == '') {
            let ball = scene.children[i];
            
            ball.position.z -= 0.035;
            ball.position.y += (keypressed_code / 1000);
        
            if(ball.position.z < -5) {
                scene.remove(ball);
            }
        }
    }
  
}

/* DOCUMENT EVENT LISTENERS */


/* 'keydown' Event Listener */
document.addEventListener('keydown', function(event) {
  if(event.keyCode != 0) {
      keypressed_code = event.keyCode;
      console.log(keypressed_code);
      flag = 1;
  }
});
