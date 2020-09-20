import {OrbitControls} from 'https://threejs.org/examples/jsm/controls/OrbitControls.js'
import * as THREE from 'https://threejs.org/build/three.module.js'
import {GUI} from 'https://threejs.org/examples/jsm/libs/dat.gui.module.js'
import { GLTFExporter } from 'https://threejs.org/examples/jsm/exporters/GLTFExporter.js';
import {GLTFLoader } from 'https://threejs.org/examples/jsm/loaders/GLTFLoader.js';



// Set our main variables
const canvas = document.querySelector('#c');
const backgroundColor = 0xfff1f1;
let scene,
  fbuser, //our firebase user
  renderer,
  camera,
  controls,
  sprite,
  raycaster = new THREE.Raycaster(),  // Used to detect the click on our character
  gui = new GUI(),
  xbones =[],
  ybones =[],
  uiSetup = false,
  xbotLoaded = false,
  annotationList =[],
  wrapper = document.getElementById("wrapper"),
  irrelevantBoneNames = ["mixamorigHeadTop_End", "mixamorigLeftEye", "mixamorigRightEye", "mixamorigLeftToe_End", "mixamorigRightToe_End"];




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
    // wrapper.appendChild(renderer.domElement);
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
    sprite.scale.set(10, 10, 1);
    
    scene.add(sprite);


    var annotation = document.querySelector(".annotation");
    annotation = annotation.cloneNode(true);
    annotation.id = `annotation${annotationList.length+1}`
    wrapper.appendChild(annotation);
    annotation.style.opacity = 1;
    annotationList.push({vector:position,element:annotation});    
}


window.bjjInit= function(user) {
    fbuser = user;
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

    importGLTF('models/scene/closed_guard3.gltf');

  } );
  importGLTF('models/scene/scene2.gltf');
  update();
  onWindowResize();
  
  window.addEventListener('click', e => raycast(e));
  window.addEventListener('touchend', e => raycast(e, true));
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

function showDebugControls(){
    var debugControls = document.querySelector(".debugControls");
    debugControls.style.display = "block";
}

function logout(){
    window.bjjSignout(()=>{
        window.location.reload()});
}

function setupDatGui() {
  if(!uiSetup && xbotLoaded){
    uiSetup = true;
    xbotLoaded = false;
    gui.destroy();
    gui = new GUI();
    addBoneUi(gui.addFolder( "Blue Bot" ), ybones);
    addBoneUi(gui.addFolder( "Red Bot" ), xbones);
    var options = {debug: showDebugControls,
               logout: logout
              }
    gui.add(options, "debug").name("Show Debug");
    gui.add(options, "logout").name("Logout");

  }
}


function update() {
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

function getMousePos(e) {
  return { x: e.clientX, y: e.clientY };
}


