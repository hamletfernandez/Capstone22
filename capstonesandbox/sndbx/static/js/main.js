//import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';
let h1 = document.getElementById("first");
h1.style.color = "red";

let b = document.createElement('div');
b.style.background = "pink";
document.body.appendChild(b);

console.log("hey!");

let entity = document.querySelector("a-scene").sceneEl.object3D;
console.log(entity);

let sceneElem = document.getElementsByTagName("a-scene")[0].sceneEl;
console.log(sceneElem);
let scene = sceneElem.object3D;
console.log(scene);
let renderer = sceneElem.renderer;
console.log(renderer);
let camera = sceneElem.camera;
console.log(camera);

    //controls.enabled = false;
    //controls.enableRotate = false;
    //controls.minDistance = 0.5;
    //controls.maxDistance = 25;

console.log(scene.children[1].name);

function render() {
    //controls.enabled = true;
    
}

let flag = 0;
let kc = 0;
document.addEventListener('keydown', function(event) {
    if(event.keyCode != 0) {
        kc = event.keyCode;
        console.log(kc);
        flag = 1;
    }
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);


    if(flag){
        genBalls();
    }
}
animate();

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

for(let i = 1; i < scene.children.length; i++) {
    scene.children[i].name = "notnull";
}


function genBalls() {
    //controls.update();
  
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
            ball.position.y += (kc / 1000);
        
            if(ball.position.z < -5) {
                scene.remove(ball);
            }
        }
    }
    /*
    for(const ball of artworks[8].scene.children) {
      ball.position.z -= 0.035;
  
      if(ball.position.z < -5) {
        artworks[8].scene.remove(ball);
      }
    }
    */
    
  
  }
