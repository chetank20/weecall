const socket = io("/");

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");


const chatInputBox = document.getElementById("send");
const chat_message = document.getElementById("chat_message");
const main__chat__window = document.getElementById("main__chat__window");

const inviteButton = document.querySelector("#inviteButton");
const leaveButton = document.querySelector("#leave-meeting");

let currentPeer=[];

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

const user = prompt("Enter your name");

myVideo.muted = true;

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

const peers={}

let myVideoStream;

var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    peer.on("call", (call) => {

      

       
         console.log("answered");
      call.answer(stream);
      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
        
      });
      currentPeer.push(call.peerConnection);
    call.on("close", function () {
          video.remove();
          
        });  
   
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
      
    });   
  });


peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id,user);
});


socket.on("user-disconnect", userId=>{
  if(peers[userId])peers[userId].close()
})


const connectToNewUser = (userId, streams) => {
  var call = peer.call(userId, streams);
  console.log(call);
  var video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log(userVideoStream);
    
    addVideoStream(video, userVideoStream);
     
    });
   call.on('close',()=>{
    video.remove()
  })

  peers[userId]=call
  currentPeer.push(call.peerConnection);
};



const addVideoStream = (videoEl, stream) => {
  videoEl.srcObject = stream;
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });

  videoGrid.append(videoEl);
  let totalUsers = document.getElementsByTagName("video").length;
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName("video")[index].style.width =
        100 / totalUsers + "%";
    }
  }
};





  send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});


socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="fa fa-user-circle"></i> <span> ${
           userName
        }</span> </b>
        <span>${message}</span>
    </div>`;
});


inviteButton.addEventListener("click", (e) => {
  share();
});

const share = () => {
  var share = document.createElement("input"),
    text = window.location.href;

  console.log(text);
  document.body.appendChild(share);
  share.value = text;
  share.select();
  document.execCommand("copy");
  document.body.removeChild(share);
  alert("Link Copied ");
};

peer.on("call", function (call) {
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      call.answer(stream); 
      const video = document.createElement("video");
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream);
       
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

leaveButton.addEventListener("click", (e) => {
  
  alert("Thank you for join")
  window.location = "http://localhost:3000/";

})

screenShareButton.addEventListener("click", (e) => {
  screenshare();
})

const screenshare = () => {
  navigator.mediaDevices
    .getDisplayMedia({
      video: {
        cursor: "always",
      },
      audio: {
        echoCancellation: true,
        noiseSupprission: true,
      },
    })
    .then((stream) => {
      let videoTrack = stream.getVideoTracks()[0];
      videoTrack.onended = function () {
        stopScreenShare();
      };
      
       for (let x = 0; x < currentPeer.length; x++) {
        let sender = currentPeer[x].getSenders().find(function (s) {
          return s.track.kind == videoTrack.kind;
        });

        sender.replaceTrack(videoTrack);
      }
        
      
    });
};

function stopScreenShare() {
  let videoTrack = myVideoStream.getVideoTracks()[0];
  for (let x = 0; x < currentPeer.length; x++) {
    let sender = currentPeer[x].getSenders().find(function (s) {
      return s.track.kind == videoTrack.kind;
    });
    sender.replaceTrack(videoTrack);
  }
}

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setPlayVideo = () => {
  const html = `<i class="unmute fa fa-pause-circle"></i>
  <span class="unmute">Resume Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
  const html = `<i class=" fa fa-video-camera"></i>
  <span class="">Pause Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `<i class="unmute fa fa-microphone-slash"></i>
  <span class="unmute">Unmute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
  const html = `<i class="fa fa-microphone"></i>
  <span>Mute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};