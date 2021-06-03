import {OrbitControls} from 'https://threejs.org/examples/jsm/controls/OrbitControls.js'
import * as THREE from 'https://threejs.org/build/three.module.js'
import {GUI} from 'https://threejs.org/examples/jsm/libs/dat.gui.module.js'
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
  currentPosition,
  raycaster = new THREE.Raycaster(),  // Used to detect the click on our character
  gui = new GUI(),
  xbones =[],
  ybones =[],
  uiSetup = false,
  xbotLoaded = false,
  annotationList =[],
  galleryUse,
  corePoses ={},
  wrapper = document.getElementById("wrapper"),
  gallery = document.getElementById("core-gallery"),
  annotationModal = document.getElementById("annotationModal"),
  annotationClose = document.getElementsByClassName("modal-close")[0],
  annotationEntry = document.getElementById("annotationEntry"),
  annotationFolder,
  touchListenerState,
  irrelevantBoneNames = ["mixamorigHeadTop_End", "mixamorigLeftEye", "mixamorigRightEye", "mixamorigLeftToe_End", "mixamorigRightToe_End"];

annotationClose.onclick = function() {
  annotationModal.style.display = none;
}


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
    loadStandardPose('halfguard');
    //importGLTF('models/scene/closed_guard.gltf', false);


  } );

  fbuser.getIdToken().then(function(accessToken) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = ()=>{
      if (xhttp.readyState == 4 && xhttp.status === 200){
          console.log(xhttp.responseText);
          var poses = JSON.parse(xhttp.responseText);
          poses.forEach(pose => {
            addPoseToGallery(pose);
          });
      } 
    };

    xhttp.open("GET", "/api/positions/1/core", true);
    xhttp.setRequestHeader("token", accessToken);
    xhttp.send();
  });

  importGLTF('models/scene/closed_guard.gltf', true);  
  update();
  onWindowResize();
  
  window.addEventListener('click', e => handleScreenTouches(e));
  window.addEventListener('touchend', e => handleScreenTouches(e, true));
}

function handleScreenTouches(event, touch){
  switch(touchListenerState){
    case 'addAnnotation':
      raycast(event, touch);
      break;
    case 'annotationModalEntry':
      if(event.target == annotationModal){
        annotationModal.style.display = "none";
        touchListenerState = "";
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
  
  var anchor = poseThumb.children[0];
  anchor.target ="blank";
  anchor.href = pose.thumb;
  
  var thumbImg = anchor.children[0];
  thumbImg.src = pose.thumb;
  thumbImg.alt = pose.description;

  poseThumb.children[1].innerHTML= pose.description;

  poseThumb.onclick = () => {galleryItemSelection(pose);}

  gallery.appendChild(poseThumb);
}

function showGallery(){
  wrapper.style.visibility = "hidden";
  gallery.style.visibility = "visible";
}

function hideGallery(){
  wrapper.style.visibility = "visible";
  gallery.style.visibility = "hidden";
}

function galleryItemSelection(pose){
  switch(galleryUse){
    case 'setBase':
      createPositionForBase(pose);
      break;
    default:

  }
  hideGallery();
  galleryUse = "";
}

function createPositionForBase(pose){
  fbuser.getIdToken().then(function(accessToken) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = ()=>{
        if (xhttp.readyState == 4){
          if(xhttp.status === 201){
            console.log(xhttp.responseText);
            var responseBody = JSON.parse(xhttp.responseText);
            setCurrentPosition(responseBody);
            setBasePosition(responseBody.id);
          } else {
            console.log("Problem adding position");
          }
        }   
    };
    xhttp.open("POST", "/api/positions/1/", true);
    xhttp.setRequestHeader("token", accessToken);
    xhttp.setRequestHeader("Content-Type", "application/json");
    var httpBody = {
      botColor: pose.botcolor,
      origin: pose.name
    }

    xhttp.send(JSON.stringify(httpBody));
    });
}

function setBasePosition(positionId){
  fbuser.getIdToken().then(function(accessToken) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = ()=>{
        if (xhttp.readyState == 4){
          if(xhttp.status === 200){
            console.log(xhttp.responseText);
            var responseBody = JSON.parse(xhttp.responseText);
            
          } else {
            console.log("Problem adding position");
          }
        }   
    };
    xhttp.open("POST", "/api/positions/1/base/", true);
    xhttp.setRequestHeader("token", accessToken);
    xhttp.setRequestHeader("Content-Type", "application/json");
    var httpBody = {
      Id: positionId
    }

    xhttp.send(JSON.stringify(httpBody));
    });
}

function doneLoading( gltf ){
  doLoadInit(gltf);
}

function setCurrentPosition(position){
  currentPosition = position;
  if(position.gltf){
    parseGLTF(JSON.parse(position.gltf));
  } else {
    parseGLTF(corePoses[position.origin].gltf);
  }
  if(position.annotations){
    position.annotations.forEach(annotation => {
      addAnnotationToScene(annotation);
    });
  }
}

function doneLoadingAndGetBase(gltf){
  doLoadInit(gltf);
  fbuser.getIdToken().then(function(accessToken) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = ()=>{
        if (xhttp.readyState == 4){
          if(xhttp.status === 200){
            console.log(xhttp.responseText);
            var responseBody = JSON.parse(xhttp.responseText);
            setCurrentPosition(responseBody);
          } else {
            galleryUse = "setBase";
            showGallery();
          } 
        }   
    };

    xhttp.open("GET", "/api/positions/1/base", true);
    xhttp.setRequestHeader("token", accessToken);
    xhttp.send();
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
  fbuser.getIdToken().then(function(accessToken) {
    var xhttp = new XMLHttpRequest();
    

    xhttp.open("POST", "/api/positions/1/core", true);
    xhttp.setRequestHeader("token", accessToken);
    xhttp.setRequestHeader("Content-Type", "application/json");

    var name = document.getElementById( "posName").value;
    var thumb = document.getElementById( "thumb" ).value;
    var boneCollection = figureOutDeltas();


    xhttp.onreadystatechange = ()=>{
      if (xhttp.readyState == 4){
        console.log(xhttp.status);
        xhttp.onreadystatechange = ()=>{
          if (xhttp.readyState == 4){
              console.log(xhttp.status);
          }  
        };

      }
    };
    var xbody = JSON.stringify({
        id: "",
        name: name,
        thumb: thumb,
        botcolor: "blue",
        gltf: JSON.stringify(boneCollection)
    });
    console.log(xbody);
    xhttp.send(xbody);
  });
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
    } 
    if('yrot' in bone){
      bones[index].rotation.y = bone.yrot;
    }
    if('zrot' in bone){
      bones[index].rotation.z = bone.zrot;
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
  fbuser.getIdToken().then(function(accessToken) {
    var xhttp = new XMLHttpRequest();
    
    xhttp.open("POST", `/api/positions/1/${currentPosition.id}`, true);
    xhttp.setRequestHeader("token", accessToken);
    xhttp.setRequestHeader("Content-Type", "application/json");

    currentPosition.gltf = JSON.stringify(figureOutDeltas());

    xhttp.onreadystatechange = ()=>{
      if (xhttp.readyState == 4){
        console.log(xhttp.status);
        

      }
    };
    var xbody = JSON.stringify(currentPosition);
    console.log(xbody);
    xhttp.send(xbody);
  });
}

function setupDatGui() {
  if(!uiSetup && xbotLoaded){
    uiSetup = true;
    xbotLoaded = false;
    gui.destroy();
    gui = new GUI();
    addBoneUi(gui.addFolder( "Blue Bot" ), ybones);
    addBoneUi(gui.addFolder( "Red Bot" ), xbones);
    
    annotationFolder = gui.addFolder("Annotations");

    var options = {
      annotations: toggleAnnotations,
      debug: showDebugControls,
      logout: logout,
      addannotation: toggleAddingAnnotation,
      saveposition: savePosition,
    }
    gui.add(options, "annotations").name("Toggle Annotations");
    gui.add(options, "addannotation").name("Add an annotation");
    gui.add(options, "saveposition").name("Save position");
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

function makeNumberSprite(){
  var numCanvas = document.getElementById("number").cloneNode(true);
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
      numCanvas
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

function toggleAddingAnnotation(){
  touchListenerState = touchListenerState == "addAnnotation" ? "": "addAnnotation";
  annotationEntry.value = "";
}

function newAnnotation(position){
  annotationModal.style.display ="block";
  touchListenerState = "annotationModalEntry"
  document.getElementById("save_annotation").onclick = function(event){
      annotationModal.style.display = "none";
      touchListenerState = "";
      var newAnnotation = {text:annotationEntry.value, vertex:position};
      addAnnotationToScene(newAnnotation);
        
      if(!currentPosition.annotations){
        currentPosition.annotations = [];
      }
      currentPosition.annotations.push(newAnnotation);
      updateAnnotationsForPosition(currentPosition);
  }

}

function addAnnotationToScene(annotation){
  sprite = makeNumberSprite();
  var spriteNumber = annotationList.length+1;
  sprite.position.set(annotation.vertex.x, annotation.vertex.y, annotation.vertex.z);
  sprite.scale.set(10, 10, 1);
  
  scene.add(sprite); 
  var annotationElement = document.querySelector(".annotation");
  annotationElement = annotationElement.cloneNode(true);
  annotationElement.innerHTML = annotation.text;
  annotationElement.id = `annotation${spriteNumber}`
  wrapper.appendChild(annotationElement);
  annotationElement.style.opacity = 1;
  var annotationPtr = {base:annotation, vector:annotation.vertex,element:annotationElement,sprite:sprite, index:spriteNumber-1};
  annotationList.push(annotationPtr); 

  annotationPtr.guiFolder = annotationFolder.addFolder(`Annotation ${spriteNumber}`);
  annotationPtr.guiFolder.add(annotation, "text").onChange(()=>{updatePositionsAnnotation(annotationPtr)});
  annotationPtr.guiFolder.add({x:()=>{ removeAnnotation(annotationPtr)}},"x").name("Remove");
}

function removeAnnotation(annotationPtr){
  currentPosition.annotations.splice(annotationPtr.index,1);
  updateAnnotationsForPosition(currentPosition);
  scene.remove(annotationPtr.sprite);
  annotationPtr.element.parentNode.removeChild(annotationPtr.element);
  annotationFolder.remove(annotationPtr.guiFolder);
}

function updatePositionsAnnotation(annotationPtr){
  annotationPtr.element.innerHTML = annotationPtr.base.text;
  updateAnnotationsForPosition(currentPosition);
}



function updateAnnotationsForPosition(position){
  fbuser.getIdToken().then(function(accessToken) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = ()=>{
        if (xhttp.readyState == 4){
          if(xhttp.status === 200){
            console.log(xhttp.responseText);
            var responseBody = JSON.parse(xhttp.responseText);
            
          } else {
            console.log("Problem setting annotations");
          }
        }   
    };
    xhttp.open("POST", `/api/positions/1/${position.id}/annotations`, true);
    xhttp.setRequestHeader("token", accessToken);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(JSON.stringify(position.annotations));
    });
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

function toggleAnnotations(){
  annotationList.forEach(annotation => {
    annotation.element.style.opacity = 1 - annotation.element.style.opacity;
    if(annotation.sprite.parent === scene){
      scene.remove(annotation.sprite);
    }
    else {
      scene.add(annotation.sprite);
    }

  });
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


