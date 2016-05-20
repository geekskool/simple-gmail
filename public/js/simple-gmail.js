var CLIENT_ID = '956956950540-qkifems6t6ie5sp47vs9hfmi94par1bc.apps.googleusercontent.com';
var apiKey = 'AIzaSyBOHcY998qIe5lY_w3iwAcothkBCLUO1To';
var SCOPES = ['https://mail.google.com/', 'https://www.googleapis.com/auth/gmail.readonly'];

function onSignIn() {
    // document.getElementById("signInDiv").style.display = "none";
    var node = document.getElementById("signIn");
    node.parentNode.removeChild(node);
    // document.getElementById("signOutDiv").style.display = "block";
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

function loadGmailApi() {
    gapi.client.load('gmail', 'v1', displayMessages);
}

function checkLabels() {
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
        if (arr.indexOf("Done") === -1)
            createLabel("Done"); 
        if (arr.indexOf("Respond") === -1)
            createLabel("Respond"); 
        if (arr.indexOf("Delegate") === -1)
            createLabel("Delegate"); 
        if (arr.indexOf("Defer") === -1)
            createLabel("Defer");          
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
    });
}

function displayMessages() {
    checkLabels();
    var request = gapi.client.gmail.users.messages.list({
      'userId': 'me',
      'labelIds': 'UNREAD',
      'maxResults': 8
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

function addMessageRow(message) { //console.log(JSON.stringify(message, null, 4));
    var main = document.getElementById("main");
    var template = document.querySelector(".mainDiv");
    var messageNode = template.cloneNode(true);
    messageNode.style.display = "block";
    messageNode.querySelector(".fromDiv").textContent = getHeader(message.payload.headers, 'From');
    messageNode.querySelector(".subjectDiv").textContent = getHeader(message.payload.headers, 'Subject');
    var day = getHeader(message.payload.headers, 'Date');
    messageNode.querySelector(".dateDiv").textContent = getDateTime(day);
    messageNode.querySelector(".messageDiv").innerHTML = getMessageBody(message.payload);
    addButtonListeners(messageNode, message);
    main.appendChild(messageNode);
}

function addButtonListeners(messageNode, message) {
    var nodeList = messageNode.querySelectorAll(".button");
    nodeList[0].addEventListener("click", function() {
        getLabelId("Done", message.id);
        messageNode.style.transition = "opacity 0.5s ease 0s";
        messageNode.style.opacity = 0;
        setTimeout(function() {
            messageNode.style.display = "none";
        }, 300);
    });
    nodeList[1].addEventListener("click", function() {
        var replyTo = getHeader(message.payload.headers, 'From');
        var replySubject = "Re: " + getHeader(message.payload.headers, 'Subject');
        var replyBody = "message body";
        var mailTo = "mailto:" + replyTo + "?Subject=" + replySubject + "&body=" + replyBody;
        var aTag = document.createElement("a"); 
        aTag.setAttribute('href', mailTo);   
        nodeList[1].appendChild(aTag);    
        var event = new Event('click');
        aTag.dispatchEvent(event);
    });
    nodeList[2].addEventListener("click", function() {
        var forwardSubject = "Fwd: " + getHeader(message.payload.headers, 'Subject');
        var forwardBody = "message body";
        var mailTo = "mailto:?Subject=" + forwardSubject + "&body=" + forwardBody;
        var aTag = document.createElement("a"); 
        aTag.setAttribute('href', mailTo);   
        nodeList[2].appendChild(aTag);    
        var event = new Event('click');
        aTag.dispatchEvent(event);   
    });
    nodeList[3].addEventListener("click", function() {
        getLabelId("Defer", message.id);
        messageNode.style.transition = "opacity 0.5s ease 0s";
        messageNode.style.opacity = 0;
        setTimeout(function() {
            messageNode.style.display = "none";
        }, 300);
    });
}

function getLabelId(labelName, messageId) {
    var labelId;
    var request = gapi.client.gmail.users.labels.list({
      'userId': 'me'
    });
    request.execute(function(resp) {
        var labels = resp.labels;
        if (labels && labels.length > 0) {
            for (i = 0; i < labels.length; i++) {
                var label = labels[i];
                if (label.name === labelName) {
                    labelId = label.id;
                    modifyLabel(labelId, messageId);
                }              
            }
        } 
    });
}

function modifyLabel(labelId, messageId) {
    var addLabelId = [labelId];
    var request = gapi.client.gmail.users.messages.modify({
        'userId': 'me',
        'id': messageId,
        'addLabelIds': addLabelId
    });
    request.execute(function(resp) {  
      //alert("Message added successfully!");
    });
}

function getDateTime(timeStamp) {
    var currentTime = new Date();//console.log(currentTime + " " + timeStamp)
    var currentday = currentTime.getDate();
    var currentMonthIndex = currentTime.getMonth();
    var currentMonthArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var currentMonth = currentMonthArray[currentMonthIndex];
    var currentDate = currentday + currentMonth;
    var arr = timeStamp.split(' ');
    var date1 = arr[1] + arr[2];
    var time1 = arr[4];
    var timeArray = time1.split(':');
    var time2 = [];
    time2[0] = currentTime.getHours();
    time2[1] = currentTime.getMinutes();
    var hourDiff = Math.abs(timeArray[0] - time2[0]);
    var minDiff = Math.abs(timeArray[1] - time2[1]);
    if (currentDate === date1) {
        if (hourDiff < 24 && hourDiff >= 1) {  
            if (hourDiff === 1) {
                return "an hr ago";
            } else {
                return hourDiff + "hrs ago";
            }
        } else {
            if (minDiff < 1) {
                return "just now";
            }
            if (minDiff === 1) {
                return "a min ago";
            } else {
                return minDiff + "mins ago";
            }
        }
    }
    if (Math.abs(arr[1] - currentday) === 1) {
        return "Yesterday";
    }
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