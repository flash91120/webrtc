"use strict";

//const { type } = require("express/lib/response");

var localVideo = document.querySelector("video#localvideo");
var remoteVideo = document.querySelector("video#remotevideo"); //用于显示远端传来的数据

var btnConn = document.querySelector("button#connserver");
var btnLeave = document.querySelector("button#leave");

var chat = document.querySelector("textarea#chat");
var chat_delay = document.querySelector("input#chat_delay");
var video_delay = document.querySelector("input#video_delay");
var send_txt = document.querySelector("textarea#sendtxt");
var btnSend = document.querySelector("button#send");

var pcConfig = {
  iceServers: [
    {
      urls: "turn:124.70.204.64:3478",
      username: "flash91120",
      credential: "xjj510.5",
    },
  ],
};

var text_relay;
var relayState = "receive";

var localStream = null;

var roomid = "111111";
var socket = null;

var state = "init";

var pc = null;
var dc = null;
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
function receivemsg(e) {
  var msg = e.data;
  //1644906815110@aaaa
  if (msg) {
    var dater = new Date();
    var rec = msg.split("@");
    chat_delay.value = dater.getTime() - parseInt(rec[0], 10);
    if (chat_delay.value < 0) {
      chat_delay.value = -chat_delay.value;
    }
    chat.value += "receive:" + rec[1] + "\r\n";
    dater = null;
  } else {
    console.error("received msg is null");
  }
}
function dataChannelStateChange() {
  var readyState = dc.readyState;
  if (readyState === "open") {
    send_txt.disabled = false;
    btnSend.disabled = false;
  } else {
    send_txt.disabled = true;
    btnSend.disabled = true;
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
  socket.on("otherjoin", (roomid, id) => {
    console.log("receive otherjoin meeage:", roomid, id);
    if (state === "joined_unbind") {
      createPeerConnection(); //创建PeerConnection
    }
    //创建datachannel
    dc = pc.createDataChannel("chat");
    //当收到消息的时候
    dc.onmessage = receivemsg;
    //当datachannel打开的时候
    dc.onopen = dataChannelStateChange;
    dc.onclose = dataChannelStateChange;

    state = "joined_conn"; //修改客户端状态
    console.log("receive otherjoin meeage:state=", state);
    //媒体协商...
    call();
  });
  socket.on("full", (roomid, id) => {
    console.log("receive full meeage:", roomid, id);
    state = "leaved";
    console.log("receive full meeage:state=", state);
    socket.disconnect(); //断开与服务端的连接
    alert("the room is full");
    btnConn.disabled = false;
    btnLeave.disabled = true;
  });
  socket.on("leaved", (roomid, id) => {
    console.log("receive leaved meeage:", roomid, id);
    state = "leaved";
    console.log("receive leaved meeage:state=", state);
    socket.disconnect();
    btnConn.disabled = false;
    btnLeave.disabled = true;
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
      if (data.type === "offer") {
        //这里传过来之后desc就不是一个对象了,
        //需要通过RTCSessionDescription()将其转换为对象
        pc.setRemoteDescription(new RTCSessionDescription(data));
        pc.createAnswer().then(getAnswer).catch(handleAnswerError);
      } else if (data.type === "answer") {
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
        width: 320,
        height: 240,
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
//关闭本地数据流
function closeLocalMedia() {
  if (localStream && localStream.getTracks()) {
    localStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  localStream = null;
}

function leave() {
  if (socket) {
    socket.emit("leave", "111111");
  }
  //释放资源
  closePeerConnection();
  closeLocalMedia();
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
    //当发现对端创建了datachannel后触发
    pc.ondatachannel = (e) => {
      //判断是否为未创建dc的端
      if (!dc) {
        dc = e.channel;
        dc.onmessage = receivemsg;
        dc.onopen = dataChannelStateChange;
        dc.onclose = dataChannelStateChange;
      }
    };
    //连接成功后获取对端的流
    pc.ontrack = (e) => {
      console.log("link successful");
      remoteVideo.srcObject = e.streams[0];
    };
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

function sendText() {
  var dater = new Date();
  console.log(dater.getTime());
  var data = dater.getTime() + "@" + send_txt.value;
  if (data) {
    dc.send(data);
    //text_relay = dater.getTime(); //发送后开始计时

    //dc.send("@#t" + text_relay);
  }
  send_txt.value = "";
  chat.value += "send:" + data + "\r\n";
}

window.setInterval(() => {
  if (!pc) {
    return;
  }
  var receiver = pc.getReceivers()[1]; //获取视频的receiver
  if (!receiver) {
    return;
  }
  receiver
    .getStats()
    .then((reports) => {
      console.log("reciver's reports:")
      reports.forEach((report) => {
        console.log(report);
        if (report.type == "candidate-pair"){
          video_delay.value = report.currentRoundTripTime * 1000;
        }
      });
    })
    .catch((err) => {
      console.error(err);
    });
  var sender = pc.getReceivers()[1];
  if (!sender) {
    return;
  }
  receiver.getStats().then((reports) => {
    console.log("sender's reports:")
    reports.forEach((report) => {
      console.log(report);
    });
  });
}, 1000);

btnConn.onclick = connSignalServer;
btnLeave.onclick = leave;
btnSend.onclick = sendText;
