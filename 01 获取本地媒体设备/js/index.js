"use strict";

var audioSource = document.querySelector("select#audioSource");
var audioOutput = document.querySelector("select#audioOutput");
var videoSource = document.querySelector("select#videoSource");

if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
  console.log("mediaDevices is not support");
} else {
  navigator.mediaDevices.enumerateDevices().then(gotDevice).catch(handleError);
}
function gotDevice(deviceInfos) {
  deviceInfos.forEach(function (deviceInfo) {
    console.log(
      deviceInfo.kind +
        ": label = " +
        deviceInfo.label +
        ": deviceId = " +
        deviceInfo.deviceId +
        ": groupId = " +
        deviceInfo.groupId
    );
    var option = document.createElement("option");
    option.text = deviceInfo.label;
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "audioinput") {
      audioSource.appendChild(option);
    } else if (deviceInfo.kind === "audiooutput") {
      audioOutput.appendChild(option);
    } else if (deviceInfo.kind === "videoinput") {
      videoSource.appendChild(option);
    }
  });
}

function handleError(err) {
  console.error(err.name + ":" + err.message);
}
