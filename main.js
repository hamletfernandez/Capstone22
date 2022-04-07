import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {ImprovedNoise} from 'three/examples/jsm/math/ImprovedNoise.js';
import {TWEEN} from 'three/examples/jsm/libs/tween.module.min'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {AfterimagePass} from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module'


//Assets!////////



//Constants
let mainScene, mainCamera, renderer, canvas, stats;
let mainComposer;
  

const rtWidth = 1024;
const rtHeight = 1024;
let rtParameters = { 
  minFilter: THREE.LinearFilter, 
  magFilter: THREE.LinearFilter, 
  format: THREE.RGBAFormat, 
  stencilBuffer: false 
};

/* Array of Gallery Pieces
 * artworks will be passed into the raycaster so that 
 * the raycaster does not need to check if everything is being selected
 * just artworks
 */
let artworks = [];
let balls = [];

//main camera parameters
let fov, aspectRatio, near, far, mainControls; 
//loader
let loader;

let CLICK;
let points = [], line, newGeo, newMat, newLine;

let numKeys = 0, numKeysHeld = 0;
let keysHeld = [];

class Art { 

  constructor() {
    this.scene = makeScene();
    this.camera = makeCamera();
    this.composer = makeComposer(this.scene, this.camera);
  }

  makeFrame(width, height) {

    const geometry = new THREE.PlaneGeometry(width, height);
    
    let material = new THREE.MeshBasicMaterial({
      map: this.composer.renderTarget2.texture,
    });
    
    this.frame = new THREE.Mesh(geometry, material);

  }

  makeControls(canvas) {
    let controls = new OrbitControls(this.camera, canvas);
    controls.enabled = false;
    //controls.enableRotate = false;
    //controls.minDistance = 0.5;
    //controls.maxDistance = 25;

    this.controls = controls;
  }

}

init();
animate();

function init() {

  //render targets!
  const mainRenderTarget = new THREE.WebGLRenderTarget(innerWidth, innerHeight, rtParameters);

  //Scene init
  mainScene = new THREE.Scene();
  mainScene.fog = new THREE.FogExp2(0x000000, 0.015);
  
  //Camera init
  fov = 75;
  aspectRatio = innerWidth/innerHeight;
  near = 0.1; 
  far = 1000;
  mainCamera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
  mainCamera.position.set(1,5,0);


  //Renderer init
  renderer = new THREE.WebGLRenderer({
    preserveDrawingBuffer: true
  });
  renderer.autoClearColor = false;
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  canvas = renderer.domElement;
  document.body.appendChild(canvas);
  window.addEventListener( 'resize', onWindowResize );

  stats = Stats()
  document.body.appendChild(stats.dom)

  //Orbit Controls
  mainControls = new OrbitControls(mainCamera, canvas);
  mainControls.enabled = false;
  mainControls.maxPolarAngle = -Math.PI / 2;
  mainControls.maxAzimuthAngle = Math.PI/2;
  mainControls.enableDamping = true;
  mainControls.dampingFactor = 0.15;

  //Loader init
  loader = new THREE.TextureLoader();

  const skyBoxtexture = loader.load(
    './images/space1.jpg',
    () => {
      const rt = new THREE.WebGLCubeRenderTarget(skyBoxtexture.image.height);
      rt.fromEquirectangularTexture(renderer, skyBoxtexture);
      mainScene.background = rt.texture;
    });

  //Light
  const ambientLight = new THREE.AmbientLight( 0xffffff, 0.7); // soft white light
  //mainScene.add( ambientLight );

  makeRoom();

  //Spotlight
  const mainSpot = new THREE.SpotLight( 0xcfcfcf );
  mainSpot.position.set( -(2 * 7) + 14, 10, 25 - (1 * 25));
  //mainScene.add( mainSpot );
  mainSpot.castShadow = true;
  mainSpot.intensity = 0.5;
  mainSpot.decay = 0;
  mainSpot.angle = 0.8;
  //mainSpot.penumbra = 0.5;



  //2d art
  {
    const Gen = new Art();

    artworks.push(Gen);
      const art = artworks[0];

      art.makeFrame(10, 10);
      art.frame.position.set( -(2 * 7) + 0.05, 5, 25 - (1 * 25));
      art.frame.rotation.y = Math.PI/2;
      mainScene.add(art.frame);

      mainSpot.target = mainCamera;

      art.makeControls(canvas);

      const spotLight = new THREE.SpotLight( 0xcfcfcf );
      spotLight.position.set( -(2 * 7) + 10, 20, 25 - (1 * 25));
      mainScene.add( spotLight );
      spotLight.target = art.frame;
      spotLight.castShadow = true;
      spotLight.intensity = 1;
      spotLight.decay = 0;
      spotLight.angle = 0.5;
      spotLight.penumbra = 0.6;


   
      art.makeControls(canvas);
      art.controls.enabled = false;
      //art.controls.target.set(0,0,0);
      //artworks[i].controls.autoRotate = true;
      //artworks[i].controls.autoRotateSpeed = 2;

      
  }


  mainComposer = new EffectComposer(renderer, mainRenderTarget);
  mainComposer.addPass(new RenderPass(mainScene, mainCamera));
  mainComposer.setSize(canvas.width, canvas.height);

  loadCarpet();
  //loadFrame();

}

function render() {

  renderer.autoClearColor = false;
  mainCamera.lookAt(new THREE.Vector3(-(5 * 7) + 0.05, 5, 25 - (1 * 25)))

  let art = artworks[0];
 
  if(art.controls != undefined) {
    art.controls.enabled = false;
  }
  art.camera.updateProjectionMatrix();
  art.composer.render();
  
  mainComposer.render();
  CLICK = false;

}

function animate() {
  requestAnimationFrame(animate);
  mainControls.update();
  artworks[0].controls.update();
  TWEEN.update();
  stats.update();
  //render();

  genBalls();
   
  if(!CLICK) {
    render();
  } else {
    artworks[0].composer.render();
    artworks[0].camera.rotation.y += 1;
    console.log(artworks[0].camera.rotation)
  }
    
    
}

function onWindowResize() {

  mainCamera.aspect = window.innerWidth / window.innerHeight;
  mainCamera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}


addEventListener('keypress', (e) => {

  if(keysHeld.indexOf(e.key) == -1) {
    keysHeld.push(e.key);
    //console.log('DOWN')
    //console.log(e.key)
    numKeys++;
  }


  switch(e.keyCode) {
    case 27: // 'ESC'
      render();
      break;
    default: 
    break;
  }
})

// https://stackoverflow.com/questions/5203407/how-to-detect-if-multiple-keys-are-pressed-at-once-using-javascript
let count = 0; 
var map = {}; // You could also use an array
onkeydown = onkeyup = function(e){
    e = e || event; // to deal with IE
    map[e.keyCode] = e.type == 'keydown';

    if(map[e.keyCode] == true) {
      count++;
    } else {
      count--;
    }
}


addEventListener('keyup', (e) => {
  if(numKeys > 0) {
    numKeys--;
    keysHeld.pop()
  }

  switch(e.keyCode) {
    case 27: // 'ESC'
      render();
      break;
    default: 
    break;
  }
})

addEventListener('click', () => {
  if(!CLICK) {
    CLICK = true;
    console.log(CLICK)
  }
})

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function genBalls() {
  const art = artworks[0];
  art.controls.update();

  const loader = new THREE.TextureLoader();

  
  const color = new THREE.Color(Math.random(), Math.random(), Math.random());
  while(balls.length < 5) {
    
    
    let perlin = new ImprovedNoise();
    const geometry = new THREE.SphereGeometry( 0.1, 20, 10 );
    const material = new THREE.MeshBasicMaterial({
       color: 0xffffff,
       //map: starTexture,
    });
    let sphere = new THREE.Mesh( geometry, material );
    sphere.position.set(
      getRandomIntInclusive(-5, 5), 
      getRandomIntInclusive(-5, 5), 
      getRandomIntInclusive(-5, 5));

    balls.push(sphere);
    
  }
  

  for(const ball of balls) {
    if(numKeys == 4) {
      ball.position.set(
        getRandomIntInclusive(-20, 20), 
        getRandomIntInclusive(-20, 20), 
        getRandomIntInclusive(-20, 20));
      
      ball.material.color = color;
    }

    if(numKeys == 7) {
      console.log(numKeys)
      art.camera.up.set(1, 2, 3);
      art.controls.autoRotateSpeed = 5;
    } 

    art.scene.add(ball);
  }

  for(let i = 2; i < art.scene.children.length; i++) {
    let ball = art.scene.children[i];

     
    new TWEEN.Tween(ball.position)
      .to(
          {
              x: ball.position.x -getRandomIntInclusive(-2, 2),
              y: ball.position.y -getRandomIntInclusive(-2, 2),
              z: ball.position.z -getRandomIntInclusive(-2, 2)
          },
          500
      )
      //.easing(TWEEN.Easing.Quadratic.Out)
      //.start()

      //ball.position.z -= 0.035

    if(ball.position.z < -5) {
      disposeHierarchy(ball, disposeNode);
    }
  }

  if(numKeys == 1) {
    art.makeControls(canvas);
    art.controls.enabled = false;
    //art.controls.target.set(0, 0, 0);
    art.controls.autoRotate = true;
    art.controls.autoRotateSpeed = 7;
  }

  if(numKeys == 2) {
    art.controls.target.set(0, 2, 0);
    art.camera.up.set(0, 1, 0);
      art.controls.autoRotateSpeed = 3;
  }

  if(numKeys == 3) {
    art.controls.target.set(0, -4, -10);
    art.camera.up.set(1, 1, 0);
    art.camera.rotation.z++;
    art.controls.autoRotateSpeed = -3;
  }

  if(numKeys == 4) {
    art.controls.target.set(getRandomIntInclusive(-7, 7), 0, 7);
    art.controls.autoRotateSpeed = 5;

    
  }
  
  //console.log(numKeys);

  if(numKeys >= 15) {
    art.camera.up.set(0,0,-3)
  }

  if(numKeys >= 20) {
    //numKeys = 0;
  }

  

}


function makeScene() {

  return new THREE.Scene();
}

function makeCamera() {
  const fov = 75; 

  /* We use let for aspect so we can change its value depending 
   * on image. Some images are narrower than they are wide, and others 
   * vice versa, so changing the aspect ratio for different images
   * gives us flexibility
   */
  let aspect = rtWidth / rtHeight;
  const near = 0.1;
  const far = 500;

  let camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0,0,14);

  return camera;

}

function makeComposer(scene, camera) {

  const renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, rtParameters);

  let composer = new EffectComposer(renderer, renderTarget);

  //Pass 0- RenderPass
  let renderPass = new RenderPass(scene, camera);
  let afterImagePass = new AfterimagePass();

  //List of passes in order
  composer.addPass(renderPass);
  composer.addPass(afterImagePass);

  return composer;

}



function introScene() {

  let scene, camera;


}


function loadCarpet() {
  
  const gltfLoader = new GLTFLoader();

  gltfLoader.load('models/Carpet/scene.gltf', (gltf) => {
    const root = gltf.scene;
    root.children[0].children[0].children[0].children[2].scale.set(0.2, 0.2, 0.2)
    let carpet = root.children[0].children[0].children[0].children[2].children[1];
    //console.log(root.children[0].children[0].children[0].children[2].children[1].children[0].children[0]);
    root.children[0].children[0].children[0].children[2].children[1].children[0].children[0].material.opacity = 0;
    //console.log(carpet);
    carpet.position.set(-31, -0.85, -16);
    carpet.rotation.set(Math.PI/2, 0, 0);
    carpet.scale.set(0.2, 0.2, 0.2);
    mainScene.add(carpet);
  });
  
}

function loadFrame() {

  const gltfLoader = new GLTFLoader();
  
  gltfLoader.load('models/Frame3/scene.gltf', (gltf) => {
    const root = gltf.scene;
    console.log(root);
    let frame = root.children[0].children[0];
    console.log(frame);
    //frame.material.roughness = 0.1;
    //frame.material.metalness = 0.5;
    frame.position.set( -(5 * 3), 5, 25 - (1 * 29));
    frame.rotation.set(0, 0, Math.PI/2);
    frame.scale.set(0.85, 0.5, 0.85);
    //mainScene.add(frame);
  });

}


function loadSkyBox() {
  const skyBoxtexture = loader.load(
    './images/space1.jpg',
    () => {
      const rt = new THREE.WebGLCubeRenderTarget(skyBoxtexture.image.height);
      rt.fromEquirectangularTexture(renderer, skyBoxtexture);
      mainScene.background = rt.texture;
    });
}


function makeRoom() {
  //Planes
  const planeWidth = 2;
  const planeHeight = 2;
  const scale = 7;

  //floor
  const floorGeo = new THREE.PlaneGeometry(planeWidth * scale * 2, planeHeight * scale * 500);
  const floorMat = new THREE.MeshPhongMaterial({
    color: 0xcfcfcfcf,
    side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -planeHeight/2, 0);
  floor.rotation.x = Math.PI/2;
  mainScene.add(floor);

  //Front Wall
  const frontGeometry = new THREE.PlaneGeometry(planeHeight * scale * 500, planeHeight * 20);
  const frontMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
  });
  const frontWall = new THREE.Mesh(frontGeometry, frontMaterial);
  frontWall.position.set( -(planeWidth * scale), 4, 0);
  frontWall.rotation.y = Math.PI/2;
  mainScene.add(frontWall);

  //Left Wall
  const leftGeometry = new THREE.PlaneGeometry(planeHeight * scale * 5, planeHeight * 5);
  const leftMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
  });
  const left = new THREE.Mesh(leftGeometry, leftMaterial);
  left.position.set( -(planeWidth * scale), 4, 500);
  left.rotation.y = -Math.PI;
  mainScene.add(left);

  //Right Wall
  const rightGeometry = new THREE.PlaneGeometry(planeHeight * scale * 5, planeHeight * 5);
  const rightMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
  });
  const rightWall = new THREE.Mesh(rightGeometry, rightMaterial);
  rightWall.position.set( -(planeWidth * scale), 4, -500);
  rightWall.rotation.y = Math.PI;
  mainScene.add(rightWall);

  //Back Wall
  const backGeometry = new THREE.PlaneGeometry(planeHeight * scale * 500, planeHeight * 5);
  const backMaterial = new THREE.MeshPhongMaterial({
    color: 0xcfcfcf,
    side: THREE.DoubleSide
  });
  const backWall = new THREE.Mesh(backGeometry, backMaterial);
  backWall.position.set( planeWidth * scale, 4, 0 );
  backWall.rotation.y = -Math.PI/2;
  mainScene.add(backWall);
}


function scene1() {

}

function scene2() {

}


/// GARBAGE COLLECTION /////
// https://stackoverflow.com/questions/33152132/three-js-collada-whats-the-proper-way-to-dispose-and-release-memory-garbag
function disposeNode (node)
{
    if (node instanceof THREE.Mesh)
    {
        if (node.geometry)
        {
            node.geometry.dispose ();
        }

        if (node.material)
        {
            if (node.material instanceof THREE.MeshFaceMaterial)
            {
                $.each (node.material.materials, function (idx, mtrl)
                {
                    if (mtrl.map)               mtrl.map.dispose ();
                    if (mtrl.lightMap)          mtrl.lightMap.dispose ();
                    if (mtrl.bumpMap)           mtrl.bumpMap.dispose ();
                    if (mtrl.normalMap)         mtrl.normalMap.dispose ();
                    if (mtrl.specularMap)       mtrl.specularMap.dispose ();
                    if (mtrl.envMap)            mtrl.envMap.dispose ();
                    if (mtrl.alphaMap)          mtrl.alphaMap.dispose();
                    if (mtrl.aoMap)             mtrl.aoMap.dispose();
                    if (mtrl.displacementMap)   mtrl.displacementMap.dispose();
                    if (mtrl.emissiveMap)       mtrl.emissiveMap.dispose();
                    if (mtrl.gradientMap)       mtrl.gradientMap.dispose();
                    if (mtrl.metalnessMap)      mtrl.metalnessMap.dispose();
                    if (mtrl.roughnessMap)      mtrl.roughnessMap.dispose();

                    mtrl.dispose ();    // disposes any programs associated with the material
                });
            }
            else
            {
                if (node.material.map)              node.material.map.dispose ();
                if (node.material.lightMap)         node.material.lightMap.dispose ();
                if (node.material.bumpMap)          node.material.bumpMap.dispose ();
                if (node.material.normalMap)        node.material.normalMap.dispose ();
                if (node.material.specularMap)      node.material.specularMap.dispose ();
                if (node.material.envMap)           node.material.envMap.dispose ();
                if (node.material.alphaMap)         node.material.alphaMap.dispose();
                if (node.material.aoMap)            node.material.aoMap.dispose();
                if (node.material.displacementMap)  node.material.displacementMap.dispose();
                if (node.material.emissiveMap)      node.material.emissiveMap.dispose();
                if (node.material.gradientMap)      node.material.gradientMap.dispose();
                if (node.material.metalnessMap)     node.material.metalnessMap.dispose();
                if (node.material.roughnessMap)     node.material.roughnessMap.dispose();

                node.material.dispose ();   // disposes any programs associated with the material
            }
        }
    }
}   // disposeNode

function disposeHierarchy (node, callback)
{
    for (var i = node.children.length - 1; i >= 0; i--)
    {
        var child = node.children[i];
        disposeHierarchy (child, callback);
        callback (child);
    }
}
