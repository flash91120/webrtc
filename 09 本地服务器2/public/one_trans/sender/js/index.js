"use strict";

//const { type } = require("express/lib/response");

var localVideo = document.querySelector("video#localvideo");

var btnConn = document.querySelector("button#connserver");

var state = "init"
var localStream = null;
var roomid = "111111"
var socket = null;
var pc = null;

var pcConfig = {
  iceServers: [
    {
      urls: "turn:124.70.204.64:3478",
      username: "flash91120",
      credential: "xjj510.5",
    },
  ],
};
function sendMessage(roomid, data) {
  console.log("send p2p message", roomid, data);
  if (socket) {
    socket.emit("message", roomid, data);
  }
}
function getOffer(desc) {
  pc.setLocalDescription(desc); //设置本地端去收集candidate
  sendMessage(roomid, desc); //将消息发送给对端
}
function handleOfferError(err) {
  console.log("Failed to get offer", err);
}

function call() {
  if (state === "joined_conn") {
    if (pc) {
      var options = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
      };
      pc.createOffer(options).then(getOffer).catch(handleOfferError);
    }
  }
}

function createPeerConnection() {
  console.log("create RTCpeerConnection!");
  if (!pc) {
    pc = new RTCPeerConnection(pcConfig);
    //收到候选者列表后
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log("find a new candidate:", e.candidate);
        sendMessage(roomid, {
          type: "candidate",
          label: e.candidate.sdpMLineIndex,
          id: e.candidate.sdpMid,
          candidate: e.candidate.candidate,
        });
      } else {
        console.log("this is the end candidate");
      }
    };
    //连接成功后不需要获取对端的流，因为这里是发送端
    // pc.ontrack = (e) => {
    //   console.log("link successful");
    //   remoteVideo.srcObject = e.streams[0];
    // };
  }
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      //先加入流,后面的代码再进行媒体协商
      pc.addTrack(track, localStream);
    });
  }
}

function closePeerConnection() {
  console.log("close RTCPeerConnection");
  if (pc) {
    pc.close();
    pc = null;
  }
}

function conn() {
  socket = io.connect(); //与信令服务器进行连接
  //注册函数
  socket.on("joined", (roomid, id) => {
    console.log("receive joined meeage:", roomid, id);
    state = "joined"; //修改客户端状态
    createPeerConnection(); //创建PeerConnection
    btnConn.disabled = true;
    console.log("receive joined meeage:state=", state);
  });
  socket.on("otherjoin", (roomid, id) => {
    console.log("receive otherjoin meeage:", roomid, id);
    if (state === "joined_unbind") {
      createPeerConnection(); //创建PeerConnection
    }
    state = "joined_conn"; //修改客户端状态，正在进行连接
    console.log("receive otherjoin meeage:state=", state);
    //媒体协商...
    call();
  });
  socket.on("bye", (roomid, id) => {
    console.log("receive bye meeage:", roomid, id);
    state = "joined_unbind";
    closePeerConnection();
    console.log("receive bye meeage:state", state);
  });
  socket.on("message", (roomid, data) => {
    console.log("receive client meeage:", roomid, data);
    //媒体协商
    if (data) {
      if (data.type === "answer") {
        pc.setRemoteDescription(new RTCSessionDescription(data));
      } else if (data.type === "candidate") {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: data.label,
          candidate: data.candidate,
        });
        pc.addIceCandidate(candidate);
      } else {
        console.error("the message is invalid", data);
      }
    }
  });
  socket.emit("join", "111111"); //写死房间号,加入111111房间
  return;
}

function getMediaStream(stream) {
  //在页面展示本地视频
  localVideo.srcObject = stream;
  localStream = stream;
  conn(); //用于socket.io进行连接,并且接受服务端的消息
}

function handleError(err) {
  console.log("Failed to get Media Stream", err);
}

function start() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log("mediaDevices is not support");
    return;
  } else {
    var constraints = {
      video: {
        width: 640,
        height: 480,
        frameRate: 30,
      },
      audio: true,
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(getMediaStream)
      .catch(handleError);
  }
}

function connSignalServer() {
  //开启本地视频
  start();
  return true;
}

btnConn.onclick = connSignalServer;
