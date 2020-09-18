import {OrbitControls} from 'https://threejs.org/examples/jsm/controls/OrbitControls.js'
import * as THREE from 'https://threejs.org/build/three.module.js'
import {GUI} from 'https://threejs.org/examples/jsm/libs/dat.gui.module.js'
import { GLTFExporter } from 'https://threejs.org/examples/jsm/exporters/GLTFExporter.js';
import {GLTFLoader } from 'https://threejs.org/examples/jsm/loaders/GLTFLoader.js';


(function () {
// Set our main variables
const canvas = document.querySelector('#c');
const backgroundColor = 0xfff1f1;
let scene,
  renderer,
  camera,
  controls,
  possibleAnims,                      // Animations found in our file
  mixer,                              // THREE.js animations mixer
  idle,                               // Idle, the default state our character returns to
  sprite,
  clock = new THREE.Clock(),          // Used for anims, which run to a clock instead of frame rate 
  raycaster = new THREE.Raycaster(),  // Used to detect the click on our character
  gui = new GUI(),
  xbones =[],
  ybones =[],
  uiSetup = false,
  xbotLoaded = false,
  annotationList =[],
  irrelevantBoneNames = ["mixamorigHeadTop_End", "mixamorigLeftEye", "mixamorigRightEye", "mixamorigLeftToe_End", "mixamorigRightToe_End"];

init();
importGLTF('models/scene/scene2.gltf');

function newScene(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
      // Add lights
    scene.add(newHemiLight());
    // Add directional Light to scene
    scene.add(newDirectedLight());
    xbones = [];
    ybones = [];
}

function newRenderer(){
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
}

function newHemiLight(){
    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
    hemiLight.position.set(100, 50, 0);
    return hemiLight;
}

function newDirectedLight(){
    let d = 8.25;
    let dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
    dirLight.position.set(-8, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 1500;
    dirLight.shadow.camera.left = d * -1;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = d * -1;
    return dirLight;
}

function makeNumberSprite(){
    var numCanvas = document.getElementById("number");
    const ctx = numCanvas.getContext('2d');
    const x = 32;
    const y = 32;
    const radius = 30;
    const startAngle = 0;
    const endAngle = Math.PI * 2;

    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.fill();

    ctx.strokeStyle = 'rgb(255, 255, 255)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.stroke();

    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${annotationList.length + 1}`, x, y);

    const numberTexture = new THREE.CanvasTexture(
        document.querySelector('#number')
    );
    
    const spriteMaterial = new THREE.SpriteMaterial({
        map: numberTexture,
        alphaTest: 0.5,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });
    
    return new THREE.Sprite(spriteMaterial);
}

function newAnnotation(position){
    sprite = makeNumberSprite();
    sprite.position.set(position.x, position.y, position.z);
    sprite.scale.set(35, 35, 1);
    
    scene.add(sprite);


    var annotation = document.querySelector(".annotation");
    annotation = annotation.cloneNode(true);
    annotation.id = `annotation${annotationList.length+1}`
    document.body.appendChild(annotation);
    annotation.style.opacity = 1;
    annotationList.push({vector:position,element:annotation});    
}


function init() {
  // Init the scene
  newScene();
  // Init the renderer
  newRenderer();
  // Add a camera
  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 300
  camera.position.x = 100;
  camera.position.y = 75;



  //Add orbit controls to camera
  controls = new OrbitControls( camera, renderer.domElement );
  controls.target.set( 100, 75, 0 );
  controls.update();

  document.getElementById( 'save_scene' ).addEventListener( 'click', function () {
    exportGLTF( scene );
  } );

  document.getElementById( 'load_scene' ).addEventListener( 'click', function () {

    importGLTF('models/scene/closed_guard.gltf');

  } );

}

function exportGLTF(scene){
  var gltfExporter = new GLTFExporter();
  var options = {};
  gltfExporter.parse(scene, function(result){
    var output = JSON.stringify( result, null, 2 );
    console.log( output );
    saveString( output, 'scene.gltf' );
  }, options);
}

function isXbotBone(o){
  let isXBot = false;
   o.traverseAncestors(obj=>{
     if (isXBot || obj.userData.name=="xbot"){
       isXBot = true;
     }
   });
   return isXBot;
 }

function importGLTF(fileLocation){
  // Instantiate a loader
  var loader = new GLTFLoader();

  // Load a glTF resource
  loader.load(
    // resource URL
    fileLocation,
    // called when the resource is loaded
    function ( gltf ) {
        newScene();
        gltf.scene.traverse( o=>{
        if (o.isBone && o.userData.transformData && !irrelevantBoneNames.includes(o.name)){
         
          if (isXbotBone(o) ){
            xbones.push(o)
          }
          else{
            
            ybones.push(o)
          }
        }
      });
      scene.add( gltf.scene );
      gltf.animations; // Array<THREE.AnimationClip>
      gltf.scene; // THREE.Group
      gltf.scenes; // Array<THREE.Group>
      gltf.cameras; // Array<THREE.Camera>
      gltf.asset; // Object
      uiSetup = false;
      xbotLoaded = true;
    },
    // called while loading is progressing
    function ( xhr ) {

      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

    },
    // called when loading has errors
    function ( error ) {

      console.log( 'An error happened' );

    }
  );

}
var link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link ); // Firefox workaround, see #6594

function save( blob, filename ) {

  link.href = URL.createObjectURL( blob );
  link.download = filename;
  link.click();

// URL.revokeObjectURL( url ); breaks Firefox...

}

function saveString( text, filename ) {

save( new Blob( [ text ], { type: 'text/plain' } ), filename );

}

function addBoneUi(container, bones){
  var movement = container.addFolder("Move model");
  movement.add(bones[0].position, 'x', -200 + bones[0].position.x, 200 + bones[0].position.x);
  movement.add(bones[0].position, 'y', -100 + bones[0].position.y, 100 + bones[0].position.y);
  movement.add(bones[0].position, 'z', -200 + bones[0].position.z, 200 + bones[0].position.z);
  
  movement.__controllers[ 0 ].name( "Position.x" );
  movement.__controllers[ 1 ].name( "Position.y" );
  movement.__controllers[ 2 ].name( "Position.z" );
  movement.add( bones[0].rotation, 'x', - Math.PI * 0.5, Math.PI * 0.5 );
  movement.add( bones[0].rotation, 'y', - Math.PI * 0.5, Math.PI * 0.5 );
  movement.add( bones[0].rotation, 'z', - Math.PI * 0.5, Math.PI * 0.5 );

  movement.__controllers[ 3 ].name( "rotation.x" );
  movement.__controllers[ 4 ].name( "rotation.y" );
  movement.__controllers[ 5 ].name( "rotation.z" );

  var trunkFolder = container.addFolder("Trunk");
  var armFolder = container.addFolder("Arms");
  var legFolder = container.addFolder("Legs");
  var handFolder = armFolder.addFolder("Hands");


  //using 1 index, since hips are special
  for ( var i = 1; i < bones.length; i ++ ) {

    var bone = bones[ i ];
    var groupFolder;
    if(bone.name.includes("Arm") || bone.name.includes("Shoulder")){
      groupFolder = armFolder;
    } else if(bone.name.includes("Hand")){
      groupFolder = handFolder;
    } else if(bone.name.includes("Leg") || bone.name.includes("Foot")|| bone.name.includes("Toe")){
      groupFolder = legFolder;
    } else {
      groupFolder = trunkFolder;
    }
    
    var folder = groupFolder.addFolder( bone.name.substring(9) );

    folder.add( bone.rotation, 'x', - Math.PI * 0.5, Math.PI * 0.5 );
    folder.add( bone.rotation, 'y', - Math.PI * 0.5, Math.PI * 0.5 );
    folder.add( bone.rotation, 'z', - Math.PI * 0.5, Math.PI * 0.5 );

    folder.__controllers[ 0 ].name( "rotation.x" );
    folder.__controllers[ 1 ].name( "rotation.y" );
    folder.__controllers[ 2 ].name( "rotation.z" );



  }
}  

function setupDatGui() {
  if(!uiSetup && xbotLoaded){
    uiSetup = true;
    xbotLoaded = false;
    gui.destroy();
    gui = new GUI();
    addBoneUi(gui.addFolder( "Blue Bot" ), ybones);
    addBoneUi(gui.addFolder( "Red Bot" ), xbones);

  }
}


function update() {
  if (mixer) {
    mixer.update(clock.getDelta());
  }
  positionAnnotations();
  renderer.render(scene, camera);
  requestAnimationFrame(update);
  setupDatGui();
}

window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

update();
onWindowResize();



window.addEventListener('click', e => raycast(e));
window.addEventListener('touchend', e => raycast(e, true));

function raycast(e, touch = false) {
  var mouse = {};
  if (touch) {
    mouse.x = 2 * (e.changedTouches[0].clientX / window.innerWidth) - 1;
    mouse.y = 1 - 2 * (e.changedTouches[0].clientY / window.innerHeight);
  } else {
    mouse.x = 2 * (e.clientX / window.innerWidth) - 1;
    mouse.y = 1 - 2 * (e.clientY / window.innerHeight);
  }
  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  var intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects[0] && intersects[0].object.name.includes("Surface")) {
    var position = intersects[0].point;
    console.log("click:"+getMousePos(e).x+","+getMousePos(e).y);
    newAnnotation(position);
  }
}

function positionAnnotations(){
    const canvas = renderer.domElement;
    annotationList.forEach(annotationObj =>{
        const position = annotationObj.vector;
        var vector = new THREE.Vector3(position.x, position.y, position.z);
        
        const annotation = annotationObj.element;
        vector.project(camera);

        vector.x = Math.round((0.5 + vector.x / 2) * (canvas.width / window.devicePixelRatio));
        vector.y = Math.round((0.5 - vector.y / 2) * (canvas.height / window.devicePixelRatio));
    
        annotation.style.top = `${vector.y}px`;
        annotation.style.left = `${vector.x}px`;
    
        
    });
    
    

    
}


// function positionText(pos){
//     const canvas = renderer.domElement; // `renderer` is a THREE.WebGLRenderer
    
//     pos.project(camera); // `camera` is a THREE.PerspectiveCamera
    
//     pos.x = Math.round((0.5 + pos.x / 2) * (canvas.width / window.devicePixelRatio));
//     pos.y = Math.round((0.5 - pos.y / 2) * (canvas.height / window.devicePixelRatio));
    
//     const annotation = document.querySelector('.annotation');
//     annotation.style.top = `${pos.y}px`;
//     annotation.style.left = `${pos.x}px`;
// }

// function positionText(pos){
//     var v = pos.project(camera);
//     var left = window.innerWidth * (v.x + 1) / 2;
//     var top = window.innerHeight * (-v.y + 1) / 2;
//     console.log("left:"+left);
//     console.log("top:"+top);
//     var popup = document.getElementById( 'tip' );
//     popup.style.left = left+"px";
//     popup.style.top = top+"px";
//     popup.style.display = "block";
//   }

// Get a random animation, and play it 
function playOnClick() {
  let anim = Math.floor(Math.random() * possibleAnims.length) + 0;
  playModifierAnimation(idle, 0.25, possibleAnims[anim], 0.25);
}

function playModifierAnimation(from, fSpeed, to, tSpeed) {
  to.setLoop(THREE.LoopOnce);
  to.reset();
  to.play();
  from.crossFadeTo(to, fSpeed, true);
  setTimeout(function() {
    from.enabled = true;
    to.crossFadeTo(from, tSpeed, true);
    currentlyAnimating = false;
  }, to._clip.duration * 1000 - ((tSpeed + fSpeed) * 1000));
}

// document.addEventListener('mousemove', function (e) {
//   var mousecoords = getMousePos(e);
//   if (neck && waist) {

//     moveJoint(mousecoords, neck, 50);
//     moveJoint(mousecoords, waist, 30);
//   }
// });

function getMousePos(e) {
  return { x: e.clientX, y: e.clientY };
}

function moveJoint(mouse, joint, degreeLimit) {
  let degrees = getMouseDegrees(mouse.x, mouse.y, degreeLimit);
  joint.rotation.y = THREE.Math.degToRad(degrees.x);
  joint.rotation.x = THREE.Math.degToRad(degrees.y);
  console.log(joint.rotation.x);
}

function getMouseDegrees(x, y, degreeLimit) {
  let dx = 0,
    dy = 0,
    xdiff,
    xPercentage,
    ydiff,
    yPercentage;

  let w = { x: window.innerWidth, y: window.innerHeight };

  // Left (Rotates neck left between 0 and -degreeLimit)
  // 1. If cursor is in the left half of screen
  if (x <= w.x / 2) {
    // 2. Get the difference between middle of screen and cursor position
    xdiff = w.x / 2 - x;
    // 3. Find the percentage of that difference (percentage toward edge of screen)
    xPercentage = (xdiff / (w.x / 2)) * 100;
    // 4. Convert that to a percentage of the maximum rotation we allow for the neck
    dx = ((degreeLimit * xPercentage) / 100) * -1;
  }

  // Right (Rotates neck right between 0 and degreeLimit)
  if (x >= w.x / 2) {
    xdiff = x - w.x / 2;
    xPercentage = (xdiff / (w.x / 2)) * 100;
    dx = (degreeLimit * xPercentage) / 100;
  }
  // Up (Rotates neck up between 0 and -degreeLimit)
  if (y <= w.y / 2) {
    ydiff = w.y / 2 - y;
    yPercentage = (ydiff / (w.y / 2)) * 100;
    // Note that I cut degreeLimit in half when she looks up
    dy = (((degreeLimit * 0.5) * yPercentage) / 100) * -1;
  }
  // Down (Rotates neck down between 0 and degreeLimit)
  if (y >= w.y / 2) {
    ydiff = y - w.y / 2;
    yPercentage = (ydiff / (w.y / 2)) * 100;
    dy = (degreeLimit * yPercentage) / 100;
  }
  return { x: dx, y: dy };
}

})();