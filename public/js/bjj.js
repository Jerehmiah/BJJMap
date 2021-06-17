import {OrbitControls} from 'https://threejs.org/examples/jsm/controls/OrbitControls.js'
import * as THREE from 'https://threejs.org/build/three.module.js'
import {GUI} from 'https://threejs.org/examples/jsm/libs/dat.gui.module.js'
import {GLTFLoader } from 'https://threejs.org/examples/jsm/loaders/GLTFLoader.js';
import * as BJJANNOTATIONS from '/js/annotations.js'
import {Requestor} from '/js/bjjrequests.js'

// Set our main variables
const canvas = document.querySelector('#c');
const backgroundColor = 0xfff1f1;
let scene,
  renderer,
  camera,
  controls,
  currentPosition,
  gui = new GUI(),
  xbones =[],
  ybones =[],
  uiSetup = false,
  xbotLoaded = false,
  corePoses ={},
  wrapper = document.getElementById("wrapper"),
  coreGallery = document.getElementById("core-gallery"),
  transitionGallery = document.getElementById("transitionGallery"),
  galleryHeader = document.getElementById("gallery-header"),
  existingGallery= document.getElementById("existing-gallery"),
  galleryUse,
  touchListener ={},
  
  irrelevantBoneNames = ["mixamorigHeadTop_End", "mixamorigLeftEye", "mixamorigRightEye", "mixamorigLeftToe_End", "mixamorigRightToe_End"],
  refInfo={scene:scene,renderer:renderer, camera:camera, currentPosition:currentPosition},
  requestor;


function newScene(){
    scene = new THREE.Scene();
    refInfo.scene = scene;
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
    refInfo.renderer = renderer;
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

window.bjjInit= function(user) {
    requestor = new Requestor(user);
    refInfo.requestor = requestor;
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
  refInfo.camera = camera;
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
  BJJANNOTATIONS.init(refInfo, touchListener);
  document.getElementById( 'load_scene' ).addEventListener( 'click', function () {
    loadStandardPose('halfguard');
    //importGLTF('models/scene/closed_guard.gltf', false);


  } );

  document.getElementById( 'addTransition').addEventListener('click', function () {
    addNewTransition();
  });

  requestor.doGet("/api/positions/1/core", {
    '200':poses =>{
      poses.forEach(pose => {
        addPoseToGallery(pose);
      });
      requestor.doGet("/api/positions/1/", {
        '200': existing=>{
          existing.forEach(existPose=> {
            addPositionToExistingGallery(existPose);
          })
        }
      });
    
    }});



  importGLTF('models/scene/closed_guard.gltf', true);  
  update();
  onWindowResize();
  
  window.addEventListener('click', e => handleScreenTouches(e));
  window.addEventListener('touchend', e => handleScreenTouches(e, true));
}

function handleScreenTouches(event, touch){
  switch(touchListener.state){
    case 'addAnnotation':
      BJJANNOTATIONS.raycast(event, touch);
      break;
    case 'annotationModalEntry':
      if(event.target == annotationModal){
        annotationModal.style.display = "none";
        touchListener.state = "";
      }
      break;
    default:
  }
}

function addPoseToGallery(pose){
  corePoses[pose.name] = {
    "gltf": JSON.parse(pose.gltf),
    "thumb":pose.thumb,
    "botcolor":pose.botcolor,
    "description":pose.description
  };
  var poseThumb = document.querySelector(".gallery");
  poseThumb = poseThumb.cloneNode(true);
  poseThumb.style.visibility = "visible";
  poseThumb.id = `thumb_${pose.name}`;

  var thumbImg = poseThumb.children[0];
  thumbImg.src = pose.thumb;
  thumbImg.alt = pose.description;

  poseThumb.children[1].innerHTML= pose.description;

  poseThumb.onclick = () => {galleryItemSelection(pose);}

  coreGallery.insertBefore(poseThumb, existingGallery);
}

function addPositionToExistingGallery(position){
  var positionItem = document.getElementById("addTransition").cloneNode(true);

  positionItem.children[0].src = corePoses[position.origin].thumb;
  positionItem.addEventListener('click', ()=> {
    addExistingPositionToCurrent(position);
  });
  positionItem.id = `position${existingGallery.children.length}`;
  existingGallery.appendChild(positionItem);
}

function addExistingPositionToCurrent(position){
  if(!currentPosition.transitions){
    currentPosition.transitions = [];
  }
  currentPosition.transitions.push(position);
  setTransitionsForPosition(currentPosition);
  addTransitionToGallery(position);
  hideGallery();
  galleryUse = "";
}

function addTransitionToGallery(transition){
  var transGalItem = document.getElementById("addTransition").cloneNode(true);

  transGalItem.children[0].src = corePoses[transition.origin].thumb;
  transGalItem.addEventListener('click', ()=> {
    loadPositionFromServer(transition);
  });
  transGalItem.id = `transition${transitionGallery.children.length}`;
  transitionGallery.appendChild(transGalItem);
}

function clearTransitionGallery(){
  Array.from(transitionGallery.children).forEach((transitionNode)=>{
    if(transitionNode.id != 'addTransition'){
      transitionNode.parentNode.removeChild(transitionNode);
    }
  });
}


function showGallery(){
  wrapper.style.visibility = "hidden";
  coreGallery.style.visibility = "visible";
  switch(galleryUse){
    case 'setBase':
      galleryHeader.innerHTML = "You don't have a base position.  Choose one to start.";
      existingGallery.style.visibility = "hidden";
      break;
    case 'addTransition':
      galleryHeader.innerHTML = "Choose a base position to add for your transition.";
      existingGallery.style.visibility = "visible";
      break;
    default:

  }
}

function hideGallery(){
  wrapper.style.visibility = "visible";
  coreGallery.style.visibility = "hidden";
}

function galleryItemSelection(pose){
  switch(galleryUse){
    case 'setBase':
      createPositionForBase(pose);
      break;
    case 'addTransition':
      addTransition(pose);
      break;
    default:

  }
  hideGallery();
  galleryUse = "";
}

function addTransition(pose){
  createPositionWithPose(pose, (responseBody)=>{
    if(!currentPosition.transitions){
      currentPosition.transitions = [];
    }
    currentPosition.transitions.push(responseBody);
    setTransitionsForPosition(currentPosition);
    addTransitionToGallery(responseBody)
  });
}

function setTransitionsForPosition(position){
  requestor.doPost(`/api/positions/1/${position.id}/transitions`, JSON.stringify(position.transitions), {
    '200':()=>{
      console.log("OK");
    },
    default: ()=>{
      console.log('Problem setting transitions');
    }
  });
}

function createPositionForBase(pose){
    createPositionWithPose(pose, (responseBody)=>{
      setCurrentPosition(responseBody);
      setBasePosition(responseBody.id);
             
  });
}

function createPositionWithPose(pose, onFinish){
  requestor.doPost('/api/positions/1/', JSON.stringify({botColor: pose.botcolor,origin: pose.name}),{
    '201':onFinish,
    default: ()=>{
      console.log("Problem adding position");
    }
  });
}


function setBasePosition(positionId){
  requestor.doPost('/api/positions/1/base/', JSON.stringify({Id: positionId}), {
    '200': ()=>{
      console.log("OK");
    },
    default: ()=>{
      console.log("Problem adding position");
    }
  } );
}

function doneLoading( gltf ){
  doLoadInit(gltf);
}

function setCurrentPosition(position){
  currentPosition = position;
  refInfo.currentPosition = currentPosition;
  if(position.gltf){
    parseGLTF(JSON.parse(position.gltf));
  } else {
    parseGLTF(corePoses[position.origin].gltf);
  }
  if(position.annotations){
    position.annotations.forEach(annotation => {
      BJJANNOTATIONS.addAnnotationToScene(annotation);
    });
  }
  clearTransitionGallery();
  if(position.transitions){
    position.transitions.forEach(transition => {
      addTransitionToGallery(transition);
    })
  }
}

function doneLoadingAndGetBase(gltf){
  doLoadInit(gltf);
  requestor.doGet('/api/positions/1/base', {
    '200': base => {
        console.log(base);
        setCurrentPosition(base);
    },
    default: () => {
      galleryUse = "setBase";
      showGallery();
    }
  });
}

function doLoadInit(gltf){
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
}

function loadStandardPose(name){
  parseGLTF(corePoses[name].gltf);
}


function exportGLTF(scene){
  requestor.doPost('/api/positions/1/core', JSON.stringify({
    id: "",
    name: document.getElementById( "posName").value,
    thumb: document.getElementById( "thumb" ).value,
    description: document.getElementById("description").value,
    botcolor: "blue",
    gltf: JSON.stringify(figureOutDeltas())
  }), {'200':()=>{
        console.log('OK');
  }});
}

function swapBots(boneCollection){
  var newXbones = [];
  var newYbones = [];

  boneCollection.xbones.forEach((bone, index) => {
    var tmpName = bone.name;
    var tmpBone = boneCollection.ybones[index];
    bone.name = tmpBone.name;
    newYbones.push(bone);
    tmpBone.name = tmpName;
    newXbones.push(tmpBone);
  });
  boneCollection.xbones = newXbones;
  boneCollection.ybones = newYbones;
}

function figureOutDeltas(){
  var xBotBones = [];
  xbones.forEach(bone=>{
    xBotBones.push(boneInfo(bone));
  });
  var yBotBones = [];
  ybones.forEach(bone=>{
    yBotBones.push(boneInfo(bone))
  });
  
  return {xbones:xBotBones, ybones:yBotBones};
}

function boneInfo(bone){
  var boneData = {
    name:bone.name
  }
  if(bone.name.includes("mixamorigHips")){
    boneData.x=bone.position.x,
    boneData.y=bone.position.y,
    boneData.z=bone.position.z
  }
  if(bone.rotation.x != 0){
    boneData.xrot=bone.rotation.x
  }
  if(bone.rotation.y != 0){
    boneData.yrot=bone.rotation.y
  }
  if(bone.rotation.z != 0){
    boneData.zrot=bone.rotation.z
  }

  return boneData;
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

function loadPositionFromServer(position){
  requestor.doGet(`/api/positions/1/${position.id}`, {
    '200': (pos) => {
      setCurrentPosition(pos);
    }
  });
}

function importGLTF(fileLocation, andLoadPosition){
  // Instantiate a loader
  var loader = new GLTFLoader();

  // Load a glTF resource
  loader.load(
    // resource URL
    fileLocation,
    // called when the resource is loaded
    andLoadPosition ? doneLoadingAndGetBase : doneLoading,
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

function loadBonePosition(bones, gltBones){
  bones[0].position.x = gltBones[0].x;
  bones[0].position.y = gltBones[0].y;
  bones[0].position.z = gltBones[0].z;
  gltBones.forEach((bone, index)=> {
    if(bone.name != bones[index].name){
      console.log("Bone names did not match: "+bone.name + " / " + bones[index].name);
    }
    if ('xrot' in bone){
      bones[index].rotation.x = bone.xrot;
    } else {
      bones[index].rotation.x = 0;
    }
    if('yrot' in bone){
      bones[index].rotation.y = bone.yrot;
    } else {
      bones[index].rotation.y = 0;
    }
    if('zrot' in bone){
      bones[index].rotation.z = bone.zrot;
    } else {
      bones[index].rotation.z = 0;
    }
  });
}

function parseGLTF(gltf){
  loadBonePosition(xbones, gltf.xbones);
  loadBonePosition(ybones, gltf.ybones);
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

function savePosition(){
  currentPosition.gltf = JSON.stringify(figureOutDeltas());
  requestor.doPost(`/api/positions/1/${currentPosition.id}` ,JSON.stringify(currentPosition), {
    '200': ()=>{
      console.log('OK');
    }
  } );
}

function setupDatGui() {
  if(!uiSetup && xbotLoaded){
    uiSetup = true;
    xbotLoaded = false;
    gui.destroy();
    gui = new GUI();
    addBoneUi(gui.addFolder( "Blue Bot" ), ybones);
    addBoneUi(gui.addFolder( "Red Bot" ), xbones);

    BJJANNOTATIONS.setAnnotationFolder(gui.addFolder("Annotations"));

    var options = {
      annotations: BJJANNOTATIONS.toggleAnnotations,
      debug: showDebugControls,
      logout: logout,
      addannotation: BJJANNOTATIONS.toggleAddingAnnotation,
      saveposition: savePosition
    }
    gui.add(options, "annotations").name("Toggle Annotations");
    gui.add(options, "addannotation").name("Add an annotation");
    gui.add(options, "saveposition").name("Save position");
    gui.add(options, "debug").name("Show Debug");
    gui.add(options, "logout").name("Logout");

  }
}

function addNewTransition(){
  galleryUse = "addTransition";
  showGallery();
}

function update() {
  BJJANNOTATIONS.positionAnnotations();
  renderer.render(scene, camera);
  requestAnimationFrame(update);
  setupDatGui();
}

window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, .8*window.innerHeight );
}
