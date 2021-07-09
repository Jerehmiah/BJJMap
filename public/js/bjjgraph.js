let refInfo;
function setupGraph(ref){
    refInfo = ref;
}

function getElementsForGraph(positions){
    var nodes=[],edges=[];
    positions.forEach((position,index)=>{
      nodes.push({data:{id:position.id, description: position.description, position: position, weight:index}});
      if(position.transitions){
        position.transitions.forEach((transition)=>{
          edges.push({data:{source:position.id,target:transition.id,directed:'true'}});
        });
      }
    });
    return {nodes:nodes, edges:edges};
}
  
function updateGraph(){
    refInfo.requestor.doGet('/api/positions/1/', {
      '200': (positions) => {
        var bjjgraph = window.bjjgraph = cytoscape({
          container: document.getElementById('bjjgraph'),
      
          layout: {
            name: 'avsdf',
            nodeSeparation: 120
          },
      
          style: [
            {
              selector: 'node',
              style: {
                'label': 'data(description)',
                'text-valign': 'center',
                'color': '#000000',
                'background-color': '#3a7ecf'
              }
            },
      
            {
              selector: 'edge',
              style: {
                'width': 2,
                'curve-style': 'bezier',
                'line-color': '#3a7ecf',
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#3a7ecf',
                'opacity': 0.5
              }
            }
          ],
          elements: getElementsForGraph(positions)
        });
        bjjgraph.on('select', 'node', (event)=>{
          refInfo.setCurrentPosition(event.target.data().position);
          hideGraph();
        });
      }
    });
  }
  
  function showGraph(){
    refInfo.wrapper.style.visibility = "hidden";
    refInfo.coreGallery.style.visibility = "hidden";
    document.getElementById('bjjgraph').style.visibility = "visible";
    
  }
  
  function hideGraph(){
    refInfo.wrapper.style.visibility = "visible";
    refInfo.coreGallery.style.visibility = "hidden";
    document.getElementById('bjjgraph').style.visibility = "hidden";
  }

  export {showGraph, updateGraph, setupGraph}
  