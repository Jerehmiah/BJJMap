import {OrbitControls} from 'https://threejs.org/examples/jsm/controls/OrbitControls.js'
import * as THREE from 'https://threejs.org/build/three.module.js'
import {GLTFLoader } from 'https://threejs.org/examples/jsm/loaders/GLTFLoader.js';
import * as BJJANNOTATIONS from '/js/annotations.js'
import {Requestor} from '/js/bjjrequests.js'
import { TransformControls } from '/js/TransformControls.js';
import * as BJJGRAPH from '/js/bjjgraph.js';


// Set our main variables
const canvas = document.querySelector('#c');
const backgroundColor = 0xfff1f1;
let scene,
  renderer,
  camera,
  controls,
  currentPosition,
  xbones =[],
  ybones =[],
  overLayBoneMap={},
  boneNameMap ={mixamorigHips:"hips",
    mixamorigSpine: "18512287255",
    mixamorigSpine1: "195195195255",
    mixamorigSpine2: "25512739255",
    mixamorigNeck: "16373164255",
    mixamorigHead: "200191231255",
    mixamorigRightShoulder: "2372836255",
    mixamorigRightArm: "136021255",
    mixamorigRightForeArm: "127127127255",
    mixamorigLeftHand: "18123029255",
    mixamorigLeftHandRing1: "2552420255",
    mixamorigLeftHandRing2: "25512739255",
    mixamorigLeftHandRing3: "2372836255",
    mixamorigLeftHandIndex1: "18512287255",
    mixamorigLeftHandIndex2: "195195195255",
    mixamorigLeftHandIndex3: "16373164255",
    mixamorigLeftHandThumb1: "l239228176255",
    mixamorigLeftHandThumb2: "l25520114255",
    mixamorigLeftHandThumb3: "l255174201255",
    mixamorigLeftHandMiddle1: "6372204255",
    mixamorigLeftHandMiddle2: "0162232255",
    mixamorigLeftHandMiddle3: "3417776255",
    mixamorigLeftHandPinky1: "136021255",
    mixamorigLeftHandPinky2: "127127127255",
    mixamorigLeftHandPinky3: "000255",
    mixamorigLeftShoulder: "2552420255",
    mixamorigLeftArm: "3417776255",
    mixamorigLeftForeArm: "0162232255",
    mixamorigRightHand: "18123029255",
    mixamorigRightHandPinky1: "136021255",
    mixamorigRightHandPinky2: "127127127255",
    mixamorigRightHandPinky3: "000255",
    mixamorigRightHandRing1: "2552420255",
    mixamorigRightHandRing2: "25512739255",
    mixamorigRightHandRing3: "2372836255",
    mixamorigRightHandMiddle1: "6372204255",
    mixamorigRightHandMiddle2: "0162232255",
    mixamorigRightHandMiddle3: "3417776255",
    mixamorigRightHandIndex1: "18512287255",
    mixamorigRightHandIndex2: "195195195255",
    mixamorigRightHandIndex3: "16373164255",
    mixamorigRightHandThumb1: "l239228176255",
    mixamorigRightHandThumb2: "l25520114255",
    mixamorigRightHandThumb3: "l255174201255",
    mixamorigLeftUpLeg: "239228176255",
    mixamorigLeftLeg: "18123029255",
    mixamorigLeftFoot: "112146190255",
    mixamorigLeftToeBase: "unset",
    mixamorigRightUpLeg: "255174201255",
    mixamorigRightLeg: "25520114255",
    mixamorigRightFoot: "25520114255",
    mixamorigRightToeBase: "unset"},
  corePoses ={},
  wrapper = document.getElementById("wrapper"),
  coreGallery = document.getElementById("core-gallery"),
  transitionGallery = document.getElementById("transitionGallery"),
  galleryHeader = document.getElementById("gallery-header"),
  existingGallery= document.getElementById("existing-gallery"),
  positionDescriptionEntry= document.getElementById("positionDescriptionEntry"),
  authDiv = document.getElementById("firebaseui-auth-container"),
  viewPort = document.getElementById("viewingArea"),
  menuAdd = document.getElementById("menuAdd"),
  menuMove = document.getElementById("menuMove"), 
  menuNote = document.getElementById("menuNote"),
  menuGraph = document.getElementById("menuGraph"),
  menuLogout = document.getElementById("menuLogout"),
  galleryUse,
  touchListener ={},
  irrelevantBoneNames = ["mixamorigHeadTop_End", "mixamorigLeftEye", "mixamorigRightEye", "mixamorigLeftToe_End", "mixamorigRightToe_End"],
  refInfo={scene:scene,renderer:renderer, camera:camera, currentPosition:currentPosition},
  requestor,
  transControl,
  raycaster = new THREE.Raycaster(),
  moveBotButton = document.getElementById("closeModelMovement"),
  overlayCanvas = document.getElementById("overlayCanvas"),
  activeBotControl,
  moveControlsPane = document.getElementById("modelMovementControls"),
  blueBotRadio = document.getElementById("blueRadio"),
  redBotRadio = document.getElementById("redRadio");
  



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
  authDiv.style.visibility = "hidden";
  wrapper.style.visibility = "visible";
  viewPort.style.visibility = "visible";
    requestor = new Requestor(user);
    refInfo.requestor = requestor;
  setupMenu();
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
  refInfo.wrapper = wrapper;
  refInfo.coreGallery = coreGallery;
  refInfo.setCurrentPosition = setCurrentPosition;
  camera.position.z = 300
  camera.position.x = 100;
  camera.position.y = 75;

  //Add orbit controls to camera
  controls = new OrbitControls( camera, renderer.domElement );
  controls.target.set( 100, 75, 0 );
  controls.update();

  transControl = new TransformControls(camera, renderer.domElement);
  transControl.addEventListener('dragging-changed', (event)=>{controls.enabled = ! event.value});
  scene.add(transControl);

  document.getElementById( 'save_scene' ).addEventListener( 'click', function () {
    exportGLTF( scene );
  } );
  BJJANNOTATIONS.init(refInfo, touchListener);
  BJJGRAPH.setupGraph(refInfo);
  document.getElementById( 'load_scene' ).addEventListener( 'click', function () {
    loadStandardPose('halfguard');
    //importGLTF('models/scene/closed_guard.gltf', false);


  } );

  document.getElementById( 'addTransition').addEventListener('click', function () {
    addNewTransition();
  });

  document.getElementById('save_description').addEventListener('click', updateDescription);
  document.getElementById('gallery-cancel').addEventListener('click', hideGallery)
  addMenuListeners();

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



  importGLTF('models/scene/scene2.gltf', true);  
  update();
  onWindowResize();
  
  wrapper.addEventListener('click', e => handleScreenTouches(e));
  wrapper.addEventListener('touchend', e => handleScreenTouches(e, true));

  
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
  poseThumb.style.visibility = null;
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
  positionItem.children[1].innerHTML = position.description;
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
}

function addTransitionToGallery(transition){
  var transGalItem = document.getElementById("addTransition").cloneNode(true);

  transGalItem.children[0].src = corePoses[transition.origin].thumb;
  transGalItem.children[1].innerHTML = transition.description;
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
  existingGallery.style.visibility = "hidden";
  coreGallery.style.visibility = "hidden";
  galleryUse = "";
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
  requestor.doPost('/api/positions/1/', JSON.stringify({botColor: pose.botcolor,origin: pose.name, description:`New ${pose.name}`}),{
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
  BJJANNOTATIONS.clearAnnotations();
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
  positionDescriptionEntry.value = position.description;
  BJJGRAPH.updateGraph();
}

function updateDescription(){
  currentPosition.description = positionDescriptionEntry.value;
  savePosition();
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
      var prefix;
      if (isXbotBone(o) ){
        xbones.push(o);
        if(o.name.includes("LeftHand")){
          prefix = "rl";
        } else if(o.name.includes("RightHand")){
          prefix = "rr";
        } else {
          prefix = "r";
        }
        overLayBoneMap[`${prefix}${boneNameMap[o.name]}`] = o;
      }
      else{
        ybones.push(o);
        if(o.name.includes("LeftHand")){
          prefix = "bl";
        } else if(o.name.includes("RightHand")){
          prefix = "br";
        } else {
          prefix = "b";
        }
        overLayBoneMap[`${prefix}${boneNameMap[o.name.slice(0,-2)]}`] = o;
      }
    }
    });
    scene.add( gltf.scene );
    gltf.animations; // Array<THREE.AnimationClip>
    gltf.scene; // THREE.Group
    gltf.scenes; // Array<THREE.Group>
    gltf.cameras; // Array<THREE.Camera>
    gltf.asset; // Object
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

  movement.add({clicky:()=>{
    transControl.detach();
    transControl.attach(bones[0]);
    transControl.setMode("translate");
    scene.add(transControl);
    }}, 'clicky').name("Move Model");
  movement.add({clicky:()=>{
    transControl.detach();
    transControl.attach(bones[0]);
    transControl.setMode("rotate");
    scene.add(transControl);
  }}, 'clicky').name( "Rotate model");


  var trunkFolder = container.addFolder("Trunk");
  var armFolder = container.addFolder("Arms");
  var legFolder = container.addFolder("Legs");
  var handFolder = armFolder.addFolder("Hands");

  //using 1 index, since hips are special
  for ( var i = 1; i < bones.length; i ++ ) {

    var bone = bones[ i ];
    var groupFolder;
    var rotateControl = {bone:bone,clicky:function(){transControl.detach();
      transControl.attach(this.bone);
      transControl.setMode("rotate");
      scene.add(transControl);}};
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

    folder.add(rotateControl, 'clicky').name( "rotate" );
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

function setupMoveControls(){
  menuMove.addEventListener('click', showMoveControls);
  menuMove.addEventListener('touchend', showMoveControls);
  blueBotRadio.addEventListener("change", ()=>{if(blueBotRadio.checked){setMoveControlsToBlueBot();}else{setMoveControlsToRedBot();}});
  redBotRadio.addEventListener("change", ()=>{if(blueBotRadio.checked){setMoveControlsToBlueBot();}else{setMoveControlsToRedBot();}});
  moveBotButton.addEventListener('click', closeMoveControls);
}

function setMoveControlsToBlueBot(){
  setMoveControls('blueBot');
}

function setMoveControlsToRedBot(){
  setMoveControls('redBot');
}

function setMoveControlsToBlueLeftHand(){
  setMoveControls('blueHand');
  activeBotControl.handed = 'left';
}

function setMoveControlsToBlueRightHand(){
  setMoveControls('blueHand');
  activeBotControl.handed = 'right';
}

function setMoveControlsToRedLeftHand(){
  setMoveControls('redHand');
  activeBotControl.handed = 'left';
}

function setMoveControlsToRedRightHand(){
  setMoveControls('redHand');
  activeBotControl.handed = 'right';
}


function closeMoveControls(){
  if(activeBotControl){
    activeBotControl.style.visibility = "hidden";
    overlayCanvas.style.visibility = "hidden";
    overlayCanvas.getContext('2d').clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  }
  moveControlsPane.style.visibility = "hidden";
  activeBotControl = null;
  transControl.detach();
}

function setMoveControls(type){
  closeMoveControls();
  var overlay;
  moveControlsPane.style.visibility = "visible";
  activeBotControl = document.getElementById(type);
  activeBotControl.addEventListener("click", getPixelColorForOverlay);
  overlay = document.getElementById(`${type}Overlay`);
  
  activeBotControl.style.visibility = "visible";
  overlayCanvas.width = overlay.width;
  overlayCanvas.height = overlay.height;
  overlayCanvas.getContext('2d').drawImage(overlay, 0, 0, overlay.width, overlay.height);

}

function getPixelColorForOverlay(event){
  var mapping = getMappingForEvent(event);
  switch(mapping){
    case "b000255":
      setMoveControlsToBlueRightHand();
      break;
    case "r000255":
      setMoveControlsToRedRightHand();
      break;
    case "b6372204255":
      setMoveControlsToBlueLeftHand();
      break;
    case "r6372204255":
      setMoveControlsToRedLeftHand();
      break;
    default:
      addMoveListenerForBone(overLayBoneMap[mapping]);
  }
}

function addMoveListenerForBone(bone){
  transControl.detach();
  transControl.attach(bone);
  transControl.setMode("rotate");
  scene.add(transControl);
}

function getMappingForEvent(event){
  var pixelData = overlayCanvas.getContext('2d').getImageData(event.offsetX, event.offsetY, 1, 1).data;
  var prefix;
  switch(activeBotControl.id){
    case 'blueBot':
      prefix = 'b';
      break;
    case 'redBot':
      prefix = 'r';
      break;
    case 'blueHand':
      prefix = activeBotControl.handed === 'left' ? 'bl' : 'br';
      break;
    case 'redHand':
      prefix = activeBotControl.handed === 'left' ? 'rl' : 'rr';
      break;  
  }
  return `${prefix}${pixelData[0]}${pixelData[1]}${pixelData[2]}${pixelData[3]}`
}

function showMoveControls(){
  //closeNav();
  setMoveControlsToBlueBot();
  
  
}

function showAnnotationMenu(){
  closeNav();
}

function addMenuListeners() {
  setupMoveControls();
  menuAdd.addEventListener('click', addNewTransition);
  menuNote.addEventListener('click', showAnnotationMenu);
  menuGraph.addEventListener('click', BJJGRAPH.showGraph);
  menuLogout.addEventListener('click', logout);
  menuAdd.addEventListener('touchend', addNewTransition);
  menuNote.addEventListener('touchend', showAnnotationMenu);
  menuGraph.addEventListener('touchend', BJJGRAPH.showGraph);
  menuLogout.addEventListener('touchend', logout);

}

function addNewTransition(){
  //closeNav();
  galleryUse = "addTransition";
  showGallery();
}

function update() {
  BJJANNOTATIONS.positionAnnotations();
  renderer.render(scene, camera);
  requestAnimationFrame(update);
}

window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, .8*window.innerHeight );
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
  raycaster.setFromCamera(mouse, refInfo.camera);

  // calculate objects intersecting the picking ray
  var intersects = raycaster.intersectObjects(refInfo.scene.children, true);

  intersects.forEach((obj)=>{
    if(obj.name.includes("bone")){
      transControl.detach();
      transControl.attach(obj);
      scene.add(transControl);
    }
  });

}

function setupMenu(){
  var button = document.getElementById('cn-button'),
    cnwrapper = document.getElementById('cn-wrapper'),
    overlay = document.getElementById('cn-overlay');

  //open and close menu when the button is clicked
  var open = false;
  button.addEventListener('click', handler, false);
  button.addEventListener('focus', handler, false);
  cnwrapper.addEventListener('click', cnhandle, false);

  function cnhandle(e){
    e.stopPropagation();
  }

  function handler(e){
    if (!e) var e = window.event;
    e.stopPropagation();//so that it doesn't trigger click event on document

      if(!open){
        openNav();
      }
    else{
        closeNav();
      }
  }
  function openNav(){
    open = true;
    button.innerHTML = "-";
    overlay.classList.add('on-overlay');
    cnwrapper.classList.add('opened-nav');
  }
  function closeNav(){
    open = false;
    button.innerHTML = "+";
    overlay.classList.remove('on-overlay');
    cnwrapper.classList.remove('opened-nav');
  }
  document.addEventListener('click', closeNav);
}