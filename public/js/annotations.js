import * as THREE from 'https://threejs.org/build/three.module.js'

let   sprite,
raycaster = new THREE.Raycaster(),  // Used to detect the click on our character
annotationList =[],
annotationModal = document.getElementById("annotationModal"),
annotationClose = document.getElementsByClassName("modal-close")[0],
annotationEntry = document.getElementById("annotationEntry"),
annotationFolder,
refInfo,
touchListener;

annotationClose.onclick = function() {
    annotationModal.style.display = none;
}

function init(reference, touchList){
    refInfo = reference;
    touchListener = touchList;
}

function setAnnotationFolder(folder){
    annotationFolder = folder;
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
    touchListener.state = touchListener.state == "addAnnotation" ? "": "addAnnotation";
    annotationEntry.value = "";
}

function newAnnotation(position){
    annotationModal.style.display ="block";
    touchListener.state = "annotationModalEntry"
    document.getElementById("save_annotation").onclick = function(event){
        annotationModal.style.display = "none";
        touchListener.state = "";
        var newAnnotation = {text:annotationEntry.value, vertex:position};
        addAnnotationToScene(newAnnotation);
            
        if(!refInfo.currentPosition.annotations){
            refInfo.currentPosition.annotations = [];
        }
        refInfo.currentPosition.annotations.push(newAnnotation);
        updateAnnotationsForPosition(refInfo.currentPosition);
    }

}

function addAnnotationToScene(annotation){
    sprite = makeNumberSprite();
    var spriteNumber = annotationList.length+1;
    sprite.position.set(annotation.vertex.x, annotation.vertex.y, annotation.vertex.z);
    sprite.scale.set(10, 10, 1);

    refInfo.scene.add(sprite); 
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

function clearAnnotations(){
    annotationList.forEach(annotation=>{
        removeAnnotationFromScene(annotation);
    });
}

function removeAnnotationFromScene(annotationPtr){
    refInfo.scene.remove(annotationPtr.sprite);
    annotationList.splice(annotationPtr.index,1);
    annotationPtr.element.parentNode.removeChild(annotationPtr.element);
}

function removeAnnotation(annotationPtr){
    removeAnnotationFromScene(annotationPtr);
    refInfo.currentPosition.annotations.splice(annotationPtr.index,1);
    updateAnnotationsForPosition(refInfo.currentPosition);
    //annotationFolder.remove(annotationPtr.guiFolder);
}

function updatePositionsAnnotation(annotationPtr){
    annotationPtr.element.innerHTML = annotationPtr.base.text;
    updateAnnotationsForPosition(refInfo.currentPosition);
}

function updateAnnotationsForPosition(position){
    refInfo.requestor.doPost(`/api/positions/1/${position.id}/annotations`, JSON.stringify(position.annotations),
        {
            '200': response =>{
                console.log(response);
            },
            default: ()=>{
                console.log("Problem setting annotations")
            }
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
    raycaster.setFromCamera(mouse, refInfo.camera);

    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects(refInfo.scene.children, true);

    if (intersects[0] && intersects[0].object.name.includes("Surface")) {
        var position = intersects[0].point;
        console.log("click:"+getMousePos(e).x+","+getMousePos(e).y);
        newAnnotation(position);
    }

}

function toggleAnnotations(){
    annotationList.forEach(annotation => {
    annotation.element.style.opacity = 1 - annotation.element.style.opacity;
    if(annotation.sprite.parent === refInfo.scene){
        refInfo.scene.remove(annotation.sprite);
    }
    else {
        refInfo.scene.add(annotation.sprite);
    }

});
}

function positionAnnotations(){
    const canvas = refInfo.renderer.domElement;
    annotationList.forEach(annotationObj =>{
        const position = annotationObj.vector;
        var vector = new THREE.Vector3(position.x, position.y, position.z);
        
        const annotation = annotationObj.element;
        vector.project(refInfo.camera);

        vector.x = Math.round((0.5 + vector.x / 2) * (canvas.width / window.devicePixelRatio));
        vector.y = Math.round((0.5 - vector.y / 2) * (canvas.height / window.devicePixelRatio));
    
        annotation.style.top = `${vector.y}px`;
        annotation.style.left = `${vector.x}px`;
    
        
    });
    
}

function getMousePos(e) {
    return { x: e.clientX, y: e.clientY };
}

export {positionAnnotations, toggleAddingAnnotation, toggleAnnotations, raycast, init, setAnnotationFolder, addAnnotationToScene,clearAnnotations};