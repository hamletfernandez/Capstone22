import './style.css'
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {FilmPass} from 'three/examples/jsm/postprocessing/FilmPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {PixelShader} from 'three/examples/jsm/shaders/PixelShader.js';
import {HalftonePass} from 'three/examples/jsm/postprocessing/HalftonePass.js';


//Constants
let mainScene, mainCamera, renderer, canvas;
let mainComposer, filmRenderTarget;
let raycaster;
let mouse = {
  x: undefined,
  y: undefined
}


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
let loader, objLoader, mtlLoader;

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
    
    let material = new THREE.MeshPhongMaterial({
      map: this.composer.renderTarget2.texture,
      side: THREE.DoubleSide
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

  loadTexture(string) {
    const loader = new THREE.TextureLoader();
    this.texture = loader.load(string);
  }

  loadObject(mesh) {
    this.mesh = mesh;
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

  //Renderer init
  renderer = new THREE.WebGLRenderer({
    preserveDrawingBuffer: true
  });
  renderer.autoClearColor = false;
  canvas = renderer.domElement;
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  document.body.appendChild(canvas);
  window.addEventListener( 'resize', onWindowResize );

  //Raycaster init
  raycaster = new THREE.Raycaster();

  //Orbit Controls
  mainControls = new OrbitControls(mainCamera, canvas);
  mainControls.maxPolarAngle = Math.PI / 2;
  mainControls.enableDamping = true;
  mainControls.dampingFactor = 0.15;
  mainCamera.position.set(1,0,0);
  //mainCamera.lookAt(-(1 * 7), 4, 0)
  mainCamera.rotateX(Math.PI / 2);

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
  const light = new THREE.AmbientLight( 0xffffff, 0.7); // soft white light
  mainScene.add( light );

  //Planes
  const planeWidth = 2;
  const planeHeight = 2;
  const scale = 7;

  //floor
  const floorGeo = new THREE.PlaneGeometry(planeWidth * scale * 2, planeHeight * scale * 500);
  const floorMat = new THREE.MeshBasicMaterial({
    color: 0xcfcfcfcf,
    side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -planeHeight/2, 0);
  floor.rotation.x = Math.PI/2;
  mainScene.add(floor);

  //Front Wall
  const frontGeometry = new THREE.PlaneGeometry(planeHeight * scale * 500, planeHeight * 5);
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


  //2d art
  {
    const Gen = new Art();

    artworks.push(Gen);
      const art = artworks[0];

      //simple lighting
      //add spotlights source to scene
      {
        const spotLight = new THREE.SpotLight( 0xffffff );
        spotLight.position.set( 0, 14, 10 );

        spotLight.castShadow = true;

        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;

        spotLight.shadow.camera.near = 500;
        spotLight.shadow.camera.far = 4000;
        spotLight.shadow.camera.fov = 30;

        art.scene.add( spotLight );

       
          const light = new THREE.AmbientLight( 0xffffff, 1); // soft white light
          //art.scene.add( light );
        
      }

      const geometry = new THREE.PlaneGeometry(20, 20);
      const material = new THREE.MeshPhongMaterial({
        map: art.texture,
        side: THREE.DoubleSide
      });


      art.makeFrame(8, 8);
      art.frame.position.set( -(planeWidth * scale) + 0.05, 3.5, 25 - (1 * 25));
      art.frame.rotation.y = Math.PI/2;
      mainScene.add(art.frame);

      art.makeControls(canvas);

      const spotLight = new THREE.SpotLight( 0xcfcfcf );
      spotLight.position.set( -(planeWidth * scale) + 10, 3.5, 25 - (1 * 25));
      mainScene.add( spotLight );
      spotLight.target = art.frame;
      spotLight.castShadow = true;
      spotLight.intensity = 0.5;
      spotLight.decay = 0;
      spotLight.angle = 0.7;
      spotLight.penumbra = 0.5;

      
      if(art.scene.children.length < 2) {
        for(let i = 0; i < 5; i++) {
          const color = new THREE.Color(Math.random(), Math.random(), Math.random());
          const geometry = new THREE.SphereGeometry( 2, 16 );
          const material = new THREE.MeshBasicMaterial( { color: color } );
          const circle = new THREE.Mesh( geometry, material );
          circle.position.set(
            getRandomIntInclusive(-10, 10),
            getRandomIntInclusive(-10, 10),
            getRandomIntInclusive(-10, 10)
          )
  
          //art.scene.add( circle );
        }
      }

   
        artworks[0].makeControls(canvas);
        artworks[0].controls.enabled = false;
        artworks[0].controls.target.set(0,0,0);
        //artworks[i].controls.autoRotate = true;
        //artworks[i].controls.autoRotateSpeed = 2;

      
  }


  mainComposer = new EffectComposer(renderer, mainRenderTarget);
  mainComposer.addPass(new RenderPass(mainScene, mainCamera));
  mainComposer.setSize(canvas.width, canvas.height);
  
  points.push(new THREE.Vector3(
    getRandomIntInclusive(-4, 4),
    getRandomIntInclusive(-4, 4),
    getRandomIntInclusive(-4, 4)
  ));
  points.push(new THREE.Vector3(
    getRandomIntInclusive(-4, 4),
    getRandomIntInclusive(-4, 4),
    getRandomIntInclusive(-4, 4)
  ));

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color('white')
  });
  line = new THREE.Line(geometry, material);
  line.geometry.verticesNeedUpdate = true;

}

function render() {

  mainControls.enabled = true;
  renderer.autoClearColor = false;

  
  for(const art of artworks) {
    if(art.controls != undefined) {
      art.controls.enabled = false;
    }
    art.camera.aspect = rtWidth / rtHeight;
    art.camera.updateProjectionMatrix();
    art.composer.passes[3].enabled = true;
    art.composer.render();
  }

  mainComposer.render();
  CLICK = false;

}

function animate() {
  requestAnimationFrame(animate);
  mainControls.update();
  artworks[0].controls.update();
  TWEEN.update();
  render();

  

  //genLines();
  genBalls();
  //genCircles(numKeys);

  if(!CLICK) {
    render();
  } else {
    mainControls.enabled = false;
    artworks[1].composer.render();

  }
    
    
}

function onWindowResize() {

  mainCamera.aspect = window.innerWidth / window.innerHeight;
  mainCamera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / innerHeight) * 2 + 1;
})


addEventListener('keypress', (e) => {

  if(keysHeld.indexOf(e.key) == -1) {
    keysHeld.push(e.key);
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

addEventListener('keyup', (e) => {
  if(numKeys > 0) {
    numKeys--;
    keysHeld.pop()
    console.log("UP");
    
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


function genLines() {
  if (points.length < 3) {
    points.push(new THREE.Vector3(
      getRandomIntInclusive(-3, 3),
      getRandomIntInclusive(-2, 2),
      getRandomIntInclusive(-10, 20)
    ));
    

    //console.log(points);
    let newGeo = new THREE.BufferGeometry().setFromPoints([
      points[points.length - 2],
      points[points.length - 1]
    ]);

    let newMat = new THREE.LineBasicMaterial();

    newLine = new THREE.Line(newGeo, newMat);
    //newLine.lookAt(new THREE.Vector3(0,0,0));
    newLine.rotation.x += 0.5;
    artworks[0].scene.add(newLine);
  }

  newLine.rotation.z += 2;
  newLine.rotation.y += 3;
  newLine.rotation.x += 3;

}

function genBalls() {
  const art = artworks[0];
  art.controls.update();


  
  const color = new THREE.Color(Math.random(), Math.random(), Math.random());
  while(balls.length < 5) {
    
    
    let perlin = new ImprovedNoise();
    const geometry = new THREE.SphereGeometry( 0.1, 20, 10 );
    const material = new THREE.MeshBasicMaterial( { color: 0xffffff} );
    let sphere = new THREE.Mesh( geometry, material );
    sphere.position.set(
      getRandomIntInclusive(-5, 5), 
      getRandomIntInclusive(-5, 5), 
      getRandomIntInclusive(-5, 5));

    balls.push(sphere);
    
  }
  

  for(const ball of balls) {
    if(numKeys >= 4) {
      ball.position.set(
        getRandomIntInclusive(-10, 10), 
        getRandomIntInclusive(-10, 10), 
        getRandomIntInclusive(-10, 10));
      
      ball.material.color = color;
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
      art.scene.remove(ball);
    }
  }

  if(numKeys >= 1) {
    art.makeControls(canvas);
    art.controls.enabled = false;
    art.controls.target.set(0, 0, 0);
    art.controls.autoRotate = true;
    art.controls.autoRotateSpeed = 2;
    //art.controls.screenSpacePanning = true;
    
  }

  if(numKeys == 2) {
    art.controls.target.set(0, 2, 0);
      art.controls.autoRotateSpeed = 3;
  }

  if(numKeys == 4) {
    art.controls.target.set(0, 0, 0);
    art.controls.autoRotateSpeed = 5;
    
  }
  
  if(numKeys == 8) {
    
    art.controls.target.set(
      3, 0, 0);
      art.controls.autoRotateSpeed = 5;
  }

  if(numKeys >= 20) {
    //numKeys = 0;
  }

  

}


function genCircles(numKeys) {


  const art = artworks[1];

  art.controls.update();
    if(art.scene.children.length - 5 < numKeys + 1) {
      
      const color = new THREE.Color(Math.random(), Math.random(), Math.random());

      const geometry = new THREE.SphereGeometry( 2, 16 );
      const material = new THREE.MeshPhongMaterial( { 
        color: color, 
        side: THREE.DoubleSide
      } );

      const circle = new THREE.Mesh( geometry, material );
      if(numKeys == 1) {
        circle.position.set(0, 0, 0);
      } else {
        circle.position.set(
          getRandomIntInclusive(-5, 5),
          getRandomIntInclusive(-5, 5),
          getRandomIntInclusive(-5, 5)
        )
      }

      //art.scene.add( circle );
      
    }
    console.log(numKeys)

    /*
    if(numKeys >= 10) {
      art.makeControls(canvas);
      art.controls.enabled = false;
      art.controls.target.set(0,0,0);
      art.controls.autoRotate = true;
      art.controls.autoRotateSpeed = 1;
      
      let perlin = new ImprovedNoise();

      new TWEEN.Tween(art.scene.children[10].position)
      .to(
          {
              x: perlin.noise(0.5, 0.5, 0.5) * x,
              y: perlin.noise(0.5, 0.5, 0.5) * y,
              z: perlin.noise(0.5, 0.5, 0.5) * z,
          },
          1000
      )
      .easing( TWEEN.Easing.Cubic.Out )
      .start()

      
      
    }
    */
  
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
  //renderPass.enabled = true;

  //Pass 1- FilmPass
  let filmPass = new FilmPass(
      1, //noise intensity
      0.025, //scanline intensity
      648, //scanline count
      true, //grayscale
  );
  filmPass.enabled = false;

  //Pass 2 -Pixelpass
  let pixelPass = new ShaderPass( PixelShader );
  pixelPass.uniforms[ "resolution" ].value = new THREE.Vector2( window.innerWidth, window.innerHeight );
	pixelPass.uniforms[ "resolution" ].value.multiplyScalar( window.devicePixelRatio );
  pixelPass.enabled = false;

  //Pass 3- HalftonePass
  const params = {
    shape: 1,
    radius: 4,
    rotateR: Math.PI / 12,
    rotateB: Math.PI / 12 * 2,
    rotateG: Math.PI / 12 * 3,
    scatter: 0,
    blending: 0,
    blendingMode: 0,
    greyscale: false,
    disable: false
  };

  let halftonePass = new HalftonePass(params);
  //halftonePass.enabled = false;

  //List of passes in order
  composer.addPass(renderPass);
  composer.addPass(filmPass);
  composer.addPass(pixelPass);
  composer.addPass(halftonePass);
  //composer.addPass(renderPass);


  return composer;

}



function introScene() {



}


function scene1() {

}

function scene2() {

}


