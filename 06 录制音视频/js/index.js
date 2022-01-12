"usr strict";
//设备对象
var audioSource = document.querySelector("select#audioSource");
var audioOutput = document.querySelector("select#audioOutput");
var videoSource = document.querySelector("select#videoSource");
//播放视频的盒子对象
var videoplay = document.querySelector("video#player");
//显示照片的盒子对象
var snapshot = document.querySelector("button#snapshot");
var picture = document.querySelector("canvas#picture");
picture.width = 320;
picture.height = 240;

var divConstraints = document.querySelector("div#constraints");
//record
var recvideo = document.querySelector("video#recplayer");
var btnRecord = document.querySelector("button#record");
var btnPlay = document.querySelector("button#play");
var btnDownload = document.querySelector("button#download");
var buffer;
var mediaRecorder;
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
  //将数据流放入html中进行显示
  videoplay.srcObject = stream;
  //用于保存流
  window.stream = stream;
  //获取视频流
  var videoTrack = stream.getVideoTracks()[0];
  //获取视频流的约束,是一个对象
  var videoConstraints = videoTrack.getSettings();
  //将视频约束对象转化为json字符串,在html中显示
  divConstraints.textContent = JSON.stringify(videoConstraints, null, 2);
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
      //   audio: { noiseSuppression: true, echoCancellation: true },
      audio: false,
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(gotMediaStream)
      .then(gotDevices)
      .catch(handleError);
  }
}

start();
videoSource.onchange = start; //当视频输入设备改变之后,重新调用start
snapshot.onclick = function () {
  picture
    .getContext("2d")
    .drawImage(videoplay, 0, 0, picture.width, picture.height);
};
function handleDataAvailable(e) {
  if (e && e.data && e.data.size > 0) {
    buffer.push(e.data);
  }
}
function startRecord() {
  buffer = [];
  //设置视频格式
  var options = {
    miniType: "video/webm;codecs=vp8",
  };
  //判断浏览器是否支持这个视频格式
  if (!MediaRecorder.isTypeSupported(options.miniType)) {
    console.error(`${options.miniType} is not support`);
    return;
  }
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error("Failed to create MediaRecorder", e);
    return;
  }
  //当媒体获取到有效数据后,对事件进行处理
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10);
}
function stopRecord() {
  mediaRecorder.stop();
}
btnRecord.onclick = () => {
  if (btnRecord.textContent === "Start Record") {
    startRecord();
    btnRecord.textContent = "Stop Record";
    btnPlay.disabled = true;
    btnDownload.disabled = true;
  } else {
    stopRecord();
    btnRecord.textContent = "Start Record";
    btnPlay.disabled = false;
    btnDownload.disabled = false;
  }
};
btnPlay.onclick = () => {
  var blob = new Blob(buffer, { type: "video/webm" });
  //recvideo.src只能传入url网址,因此需要通过window.URL.createObjectURL()函数,将bolb转为url
  recvideo.src = window.URL.createObjectURL(blob);
  recvideo.srcObject = null;
  //打开video元素的控件
  recvideo.controls = true;
  recvideo.play();
};
btnDownload.onclick = () => {
  var blob = new Blob(buffer, { type: "video/webm" });
  //创建url用于下载
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement("a");
  //设置a的下载链接
  a.href = url;
  //让a标签隐藏
  //a.style.display = "none";
  a.download = "aaa.webm";
  //用代码点击a标签,生成下载
  a.click();
};
