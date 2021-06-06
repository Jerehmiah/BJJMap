
class Requestor{
    constructor(user){
        this.fbuser = user;
    }

    doPost(uri, body, statusMap){
        this.makeRequest(uri, "POST", body, statusMap);
    }

    doGet(uri, statusMap){
        this.makeRequest(uri, "GET", null, statusMap);
    }

    makeRequest(uri, method, body, statusMap){
        this.fbuser.getIdToken().then(function(accessToken) {
            var xhttp = new XMLHttpRequest();
            
            xhttp.open(method, uri, true);
            xhttp.setRequestHeader("token", accessToken);
            if(body) {
                xhttp.setRequestHeader("Content-Type", "application/json");
            }    
        
            xhttp.onreadystatechange = ()=>{
                if (xhttp.readyState == 4){
                    console.log(xhttp.status);
                    Requestor.sendResponse(xhttp.status, statusMap, xhttp.responseText);
                }
            };
        
            if(body) {
                console.log(body);
            }
            xhttp.send(body);
        });
    }

    static sendResponse(status, statusMap, responseBody){
        if(statusMap[status.toString()]){
            statusMap[status.toString()](JSON.parse(responseBody));
        }
        else if(statusMap.default){
            statusMap.default(JSON.parse(responseBody));
        } else {
            console.log(responseBody);
        }
    }
}

export {Requestor};