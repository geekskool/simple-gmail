var CLIENT_ID = '956956950540-qkifems6t6ie5sp47vs9hfmi94par1bc.apps.googleusercontent.com';
var apiKey = 'AIzaSyBOHcY998qIe5lY_w3iwAcothkBCLUO1To';
var SCOPES = ['https://mail.google.com/', 'https://www.googleapis.com/auth/gmail.readonly'];

function showContentDiv() {
    var element = document.getElementById("contentDiv");
    if (element.style.display === "none") {
        element.style.display = "block";
    } else
        element.style.display = "none";
}

function onSignIn() {
    document.getElementById("signInDiv").style.display = "none";
    document.getElementById("signOutDiv").style.display = "block";
}

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        console.log('User signed out.');
    });
    document.getElementById("main").style.display = "none";
    document.getElementById("signInDiv").style.display = "block";
    document.getElementById("signOutDiv").style.display = "none";
}

function checkAuth() {
    gapi.auth.authorize({
        'client_id': CLIENT_ID,
        'scope': SCOPES.join(' '),
        'immediate': true
    }, handleAuthResult);
}

function handleAuthResult(authResult) {
    if (authResult && !authResult.error) {
        loadGmailApi();
    } 
}

function handleAuthClick(event) {
    gapi.auth.authorize({
        client_id: CLIENT_ID, scope: SCOPES, immediate: false },
        handleAuthResult);
    return false;
}

function loadGmailApi() {
    gapi.client.load('gmail', 'v1', displayMessages);
}

function checkLabel() {
    listLabels('Done');
    listLabels('Respond');
    listLabels('Delegate');
    listLabels('Defer');
}

function listLabels(labelName) {
    var found = false;
    var request = gapi.client.gmail.users.labels.list({
      'userId': 'me'
    });
    var arr = [];
    request.execute(function(resp) {
        var labels = resp.labels;
        if (labels && labels.length > 0) {
            for (i = 0; i < labels.length; i++) {
              var label = labels[i];         
              arr[i] = label.name;
            }
        }
        for (var j = 0; j < arr.length; j++) {
            if (arr[j] === labelName) {
                found = true;
                break;
            }
        }
        if (!found) {
            console.log(labelName);
            createLabel(labelName);          
        }
    });
}

function createLabel(newLabelName) {
    var request = gapi.client.gmail.users.labels.create({
        'userId': 'me', 
        'resource': {
            'name': newLabelName,
            'messageListVisibility': 'show',
            'labelListVisibility': 'labelShow'
        }
    });
    request.execute(function(resp){
        console.log("label created");
    });
}

function displayMessages() {
    checkLabel();
    var request = gapi.client.gmail.users.messages.list({
      'userId': 'me',
      'labelIds': 'UNREAD',
      'maxResults': 10
    });
    request.execute(function(response){
        response.messages.forEach(function(message) {
            var msgReq = gapi.client.gmail.users.messages.get({
                'userId': 'me',
                'id': message.id
            });
            msgReq.execute(addMessageRow);
        });
    });
}

function addMessageRow(message) { 
    var main = document.getElementById("main");
    var template = document.querySelector(".mainDiv");
    var messageNode = template.cloneNode(true);
    messageNode.style.display = "block";
    messageNode.querySelector(".fromDiv").textContent = getHeader(message.payload.headers, 'From');
    messageNode.querySelector(".subjectDiv").textContent = getHeader(message.payload.headers, 'Subject');
    var day = getHeader(message.payload.headers, 'Date');
    messageNode.querySelector(".dateDiv").textContent = getDateTime(day);
    messageNode.querySelector(".messageDiv").innerHTML = getMessageBody(message.payload);
    main.appendChild(messageNode);
}

function getDateTime(timeStamp) {
    var arr = timeStamp.split(' ');
    var date1 = arr[1] + arr[2];
    return date1;
}

function getHeader(headers, index) {
    var header = '';   
    headers.forEach(function(item) {
        if(item.name.toLowerCase() === index.toLowerCase()) {
            header = item.value;
        }
    });
    return header;
}

function getMessageBody(message) {
    var encodedBody = '';
    if(typeof message.parts === 'undefined') {
      encodedBody = message.body.data;
    } else {
      encodedBody = getHTMLPart(message.parts);
    }
    encodedBody = encodedBody.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    return decodeURIComponent(escape(window.atob(encodedBody)));
}

function getHTMLPart(arr) {
    for(var x = 0; x <= arr.length; x++) {
        if(typeof arr[x].parts === 'undefined') {
            if(arr[x].mimeType === 'text/html') {
              return arr[x].body.data;
            }
        } else {
            return getHTMLPart(arr[x].parts);
        }
    }
    return '';
}