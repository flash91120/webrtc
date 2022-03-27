"use strict";

//const { type } = require("express/lib/response");

var remoteVideo = document.querySelector("video#remotevideo"); //用于显示远端传来的数据

var btnConn = document.querySelector("button#connserver");
var btnLeave = document.querySelector("button#leave");

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
function getAnswer(desc) {
  pc.setLocalDescription(desc);
  console.log("Send Answer");
  sendMessage(roomid, desc);
}
function handleAnswerError(err) {
  console.log("Failed to get answer", err);
}

function closePeerConnection() {
  console.log("close RTCPeerConnection");
  if (pc) {
    pc.close();
    pc = null;
  }
}
function leave() {
  if (socket) {
    socket.emit("leave", "111111");
  }
  //释放资源
  closePeerConnection();
  btnConn.disabled = false;
  btnLeave.disabled = true;
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
    //连接成功后不需要获取对端的流
    pc.ontrack = (e) => {
      console.log("link successful");
      remoteVideo.srcObject = e.streams[0];
    };
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
    btnLeave.disabled = false;
    console.log("receive joined meeage:state=", state);
  });
  socket.on("message", (roomid, data) => {
    console.log("receive client meeage:", roomid, data);
    //媒体协商
    if (data) {
      if (data.type === "offer") {
        //这里传过来之后desc就不是一个对象了,
        //需要通过RTCSessionDescription()将其转换为对象
        pc.setRemoteDescription(new RTCSessionDescription(data));
        pc.createAnswer().then(getAnswer).catch(handleAnswerError);
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
  socket.on("leaved", (roomid, id) => {
    console.log("receive leaved meeage:", roomid, id);
    state = "leaved";
    console.log("receive leaved meeage:state=", state);
    socket.disconnect();
    btnConn.disabled = false;
    btnLeave.disabled = true;
  });
  socket.emit("join", "111111"); //写死房间号,加入111111房间
  return;
}

function handleError(err) {
  console.log("Failed to get Media Stream", err);
}

function connSignalServer() {
  conn();
  return true;
}

btnConn.onclick = connSignalServer;
btnLeave.onclick = leave;
