"use strict";
var createoffer = document.querySelector("button#createOffer");

var pc = new RTCPeerConnection();
var pc2 = new RTCPeerConnection();
function getAnswer(desc) {
  console.log("answer" + desc.sdp);
  pc2.setLocalDescription(desc);
  pc.setRemoteDescription(desc);
}

function getOffer(desc) {
  console.log("offer" + desc.sdp);
  pc.setLocalDescription(desc);
  //这里应该有一步信令传输,但是是本机模拟,就直接当作传输到了
  pc2.setRemoteDescription(desc);
  pc2.createAnswer().then(getAnswer).catch(handleError);
}
function getMediaStream(stream) {
  stream.getTracks().forEach((track) => {
    //把流中的轨,全部添加到pc中去
    pc.addTrack(track);
  });
  //进行媒体协商
  var options = {
    offerToReceiveAudio: 0, //请求接受音频(未开启)
    offerToReceiveVideo: 1, //请求接受视频(开启)
    iceRestart: false,
  };
  pc.createOffer(options).then(getOffer).catch(handleError);
}

function handleError(err) {
  console.log("Failed to get Media Stream", err);
}

function getStream() {
  var constraints = {
    audio: false,
    video: true,
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(getMediaStream)
    .catch(handleError);
}

function test() {
  if (!pc) {
    console.log("pc is null");
    return;
  }
  getStream();
  return;
}

createoffer.onclick = test;
