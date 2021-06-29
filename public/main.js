'use strict';
//Defining some global variables
let isChannelReady=false;
let isInitiator=false;
let isStarted=false;
let localStream;
let pc;
let remoteStream;
let turnReady;
//import { connect } from "socket.io-client";

//Initializing turn/stun server here
//turnconfig is defined in config.js
let pcConfig=turnConfig;  //since config.js and main.js both are part of index.ejs ,
                          // both js file will share (or access ) global  variable

 const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});                         

//let room=prompt("Enter Room Name");


const user = prompt("Enter your name");
let room=prompt("Enter a RoomID");
//let socket=connect();   // or don't import 'connect' and directly write socket=io.connrct(), since module is already imported in index.ejs
let socket=io.connect(); //calls on coonection
if(room!=="")
{
    socket.emit("create or join",room);
    console.log('Attempted to create or  join room', room);
}

//Defining socket events

//Event - If the current member is the one who created the room
socket.on("created",(room,socketID)=>{
    isInitiator=true;
    console.log('Created room ' + room + 'his current socketID is: '+ socketID);

});

socket.on("full",function(room){ 
    console(room+' is full')
});

//Event - Another client tries to join room

socket.on('join',(room)=>{
    console.log('Another peer made a request to join room ' + room);
     console.log('This peer is the initiator of room ' + room + '!');
    isChannelReady=true;
});

socket.on("joined",(room)=>{
    console.log('A new Client has joined the room' + room);
    isChannelReady = true;
});

//Event - server asks to log a message
socket.on('log', function(array) {
    console.log.apply(console, array);
  });

  const localvideo = document.createElement("video");
  const remotevideo = document.createElement("video");

  console.log("Going to find Local media");
  navigator.mediaDevices.getUserMedia({audio:true,video:true}).then((stream)=>{
      //adding stream
  
      localStream=stream;
      localvideo.srcObject = stream;
      localvideo.addEventListener("loadedmetadata", () => {
      localvideo.play();
      videoGrid.append(localvideo);
  });
      sendMessage("got user media",room);
      if (isInitiator) {
        maybeStart();
      }

  }).catch((e)=>{
      alert("Error:"+e.name);
  });




  socket.on("message",(message,room)=>{
    console.log('Client received message:', message,  room);
    if(message==='got user media')
    {
        maybeStart();
    }
    else if(message.type==="offer")
    {
        if(!isInitiator && !isStarted)
        {
            maybeStart();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
    }
    else if(message.type==='answer' && isStarted)
    {pc.setRemoteDescription(new RTCSessionDescription(message));}
    else if(message.type==='candidate' && isStarted)
    {
        let candidate=new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
    }
    else if (message === 'bye' && isStarted) {
        handleRemoteHangup();
      }
  });


    //If initiator, create the peer connection
function maybeStart() {
    console.log('>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
    if(!isStarted && typeof localStream!=='undefined' && isChannelReady)
    {
        //creating peer connection
        createPeerConnection();
        pc.addStream(localStream);
        isStarted=true;
        if(isInitiator)
        {Call();}
    }

}

//Creating Peer Connection
function createPeerConnection() {
    try {
       pc=new RTCPeerConnection(pcConfig);
       pc.onicecandidate=handleIceCandidate; //same
       pc.onaddstream=handleRemoteStreamAdded; //pc.onaddstream is a defined in webRTC  and it takes a event as para
       pc.onremovestream=handleRemoteStreamRemoved; //same
       //created RTCPeerConnection

    } catch(e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}


//Function to send message in a room
function sendMessage(message, room) {
    console.log('Client sending message: ', message, room);
    socket.emit('message', message, room);
  }
  
//Sending bye if user closes the window
window.onbeforeunload = function() {
    sendMessage('bye', room);
  };

function handleIceCandidate(event){
    console.log('icecandidate event: ', event);
    if(event.candidate){
        sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        },room);
    }else {
        console.log('End of candidates.');
    }
};

function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}

function setLocalAndSendMessage(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription, room);
}

//Function to create offer
function Call() {
    console.log('Sending offer to peer');
    pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
  }

  //Function to create answer for the received offer
function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then((answer)=>{
    setLocalAndSendMessage(answer);
  }
   
  
  ).catch((error)=>{
    trace('Failed to create session description: ' + error.toString());
  });
}


//Function to play remote stream as soon as this client receives it
function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteStream = event.stream;
    remotevideo.srcObject = remoteStream;
    remotevideo.addEventListener("loadedmetadata", () => {
      remotevideo.play();
      videoGrid.append(remotevideo);
    });
    
   
  }
  
  function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
  }


function hangup() {
    console.log('Hanging up.');
    stop();
    sendMessage('bye',room);
  }
  
  function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
  }
  
  function stop() {
    isStarted = false;
    pc.close();
    pc = null;
  }



  let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("chatmessage", text.value,user,room);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("chatmessage", text.value,user,room);
    text.value = "";
  }
});

  const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
muteButton.addEventListener("click", () => {
  const enabled = localStream.getAudioTracks()[0].enabled;
  if (enabled) {
    localStream.getAudioTracks()[0].enabled = false;
    muteButton.classList.toggle("background__red");
   
  } else {
    localStream.getAudioTracks()[0].enabled = true;
  
    muteButton.classList.toggle("background__red");
    
    muteButton.appendChild(node);
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = localStream.getVideoTracks()[0].enabled;
  const node = document.createTextNode("Video");
    stopVideo.textContent="";
    stopVideo.appendChild(node);
  if (enabled) {
    
    localStream.getVideoTracks()[0].enabled = false;
    stopVideo.classList.toggle("background__red");
    
  } else {
    localStream.getVideoTracks()[0].enabled = true;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});


inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy roomId and send it to people you want to meet with",
    room
  );
});

socket.on("createMessage", (message,username) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          username === user ? "me" : username
        }</span> </b>
        <span>${message}</span>
    </div>`;
});

  

