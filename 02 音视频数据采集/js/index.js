"usr strict";

var videoplay = document.querySelector("video#player");

//这个流中包含了音频轨和视频轨
function gotMediaStream(stream) {
  videoplay.srcObject = stream;
}

function handleError(err) {
  console.error("getUserMedia error", err);
}

if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  console.log("mediaDevices is not support");
} else {
  var constraints = {
    video: true,
    audio: true,
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotMediaStream)
    .catch(handleError);
}
