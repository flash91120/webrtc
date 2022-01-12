"use strict";

var localVideo = document.querySelector("video#localvideo");
var remoteVideo = document.querySelector("video#remotevideo"); //用于显示远端传来的数据

var btnStart = document.querySelector("button#start");
var btnCall = document.querySelector("button#call");
var btnHangup = document.querySelector("button#hangup");

var offer = document.querySelector("textarea#offer");
var answer = document.querySelector("textarea#answer");

var localStream;
var pc1;//图片中的A端
var pc2;//图片中的B端
function getMediaStream(stream) {
  localVideo.srcObject = stream;
  localStream = stream;
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
      audio: false,
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(getMediaStream)
      .catch(handleError);
  }
}
//将远端数据流传输给remoteVideo
function getRemoteStream(e) {
  remoteVideo.srcObject = e.streams[0];
}

function handleOfferError(err) {
  console.error("Failed to create offer:", err);
}

function getAnswer(desc) {
  pc2.setLocalDescription(desc);
  answer.value = desc.sdp; //获取answer的sdp,显示到界面
  pc1.setRemoteDescription(desc);
}

function handleAnswerError() {
  console.error("Failed to create answer:", err);
}

function getOffer(desc) {
  pc1.setLocalDescription(desc);
  offer.value = desc.sdp; //获取offer的sdp,显示到界面
  //发送desc给信令服务器
  //从信令服务器接受desc

  pc2.setRemoteDescription(desc);

  pc2.createAnswer().then(getAnswer).catch(handleAnswerError);
}

function call() {
  pc1 = new RTCPeerConnection();//本机中传输,可以不设置参数
  pc2 = new RTCPeerConnection();
  //pc1获取candidate后,将其添加到pc2中
  pc1.onicecandidate = (e) => {
    pc2.addIceCandidate(e.candidate);
  };
  //pc2获取candidate后,将其添加到pc1中
  pc2.onicecandidate = (e) => {
    pc1.addIceCandidate(e.candidate);
  };
  pc2.ontrack = getRemoteStream; //ontrack代表数据通了
  //先添加媒体数据
  localStream.getTracks().forEach((track) => {
    pc1.addTrack(track, localStream); //将本地采集的视频流添加到pc1的轨中
  });
  //再创建媒体协商
  var offerOptions = {
    offerToRecieveAudio: 0,
    offerToRecieveVideo: 1,
  };
  pc1.createOffer(offerOptions).then(getOffer).catch(handleOfferError);
}

function hangup() {
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
}

btnStart.onclick = start;
btnCall.onclick = call;
btnHangup.onclick = hangup;
