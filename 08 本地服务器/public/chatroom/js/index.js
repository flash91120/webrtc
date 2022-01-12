"use strict";
var userName = document.querySelector("input#username");
var inputRoom = document.querySelector("input#room");
var btnConnect = document.querySelector("button#connect");
var outputArea = document.querySelector("textarea#output");
var inputArea = document.querySelector("textarea#input");
var btnSend = document.querySelector("button#send");
var btnLeave = document.querySelector("button#leave");

var socket;
var room;
btnConnect.onclick = () => {
  //连接服务器
  socket = io.connect();
  //接收消息
  //接收到服务端发送的joined消息
  socket.on("joined", (room, id) => {
    btnConnect.disabled = true;
    inputArea.disabled = false;
    btnSend.disabled = false;
    btnLeave.disabled = false;
  });
  socket.on("leaved", (room, id) => {
    btnConnect.disabled = false;
    inputArea.disabled = true;
    btnSend.disabled = true;
    btnLeave.disabled = true;
  });
  socket.on("message", (room, id, data) => {
    outputArea.value = outputArea.value + data + "\r";
  });
  //发送房间消息,进行连接
  room = inputRoom.value;
  socket.emit("join", room);
};

btnSend.onclick = () => {
  var data = inputArea.value;
  data = userName.value + ":" + data;
  socket.emit("message", room, data);
  inputArea.value = "";
};

btnLeave.onclick = () => {
  socket.emit("leave", room);
  outputArea.value = ""; //离开后将输出数据清除
};
