"usr strict";

var audioSource = document.querySelector("select#audioSource");
var audioOutput = document.querySelector("select#audioOutput");
var videoSource = document.querySelector("select#videoSource");

var videoplay = document.querySelector("video#player");
function gotDevices(deviceInfos) {
  deviceInfos.forEach(function (deviceInfo) {
    var option = document.createElement("option");
    option.text = deviceInfo.label; //在页面中显示的名称
    option.value = deviceInfo.deviceId; //每一项的值
    if (deviceInfo.kind === "audioinput") {
      audioSource.appendChild(option);
    } else if (deviceInfo.kind === "audiooutput") {
      audioOutput.appendChild(option);
    } else if (deviceInfo.kind === "videoinput") {
      videoSource.appendChild(option);
    }
  });
}
//这个流中包含了音频轨和视频轨
function gotMediaStream(stream) {
  videoplay.srcObject = stream;
  //获取了流之后,为了显示一下媒体设备,因此需要返回一个promise对象
  return navigator.mediaDevices.enumerateDevices();
}

function handleError(err) {
  console.error("getUserMedia error", err);
}

function start() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log("mediaDevices is not support");
  } else {
    var deviceId = videoSource.value;
    //设置媒体约束
    var constraints = {
      //设置视频宽度、高度、帧率(设置在15-30帧之间)
      video: {
        width: 320,
        height: 240,
        frameRate: { min: 15, max: 30 },
        /**
         * deviceId用于设置从哪个设备中获取媒体流
         * 第一次进入,deviceId为undefined,第二次进入,deviceId有值了,就会将旧的deviceId更新
         */
        deviceId: deviceId ? deviceId : undefined,
      },
      //设置音频打开降噪、回声消除
      audio: { noiseSuppression: true, echoCancellation: true },
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(gotMediaStream)
      .then(gotDevices) //和第22行的return对应
      .catch(handleError);
  }
}

start();
videoSource.onchange = start; //当视频输入设备改变之后,重新调用start
