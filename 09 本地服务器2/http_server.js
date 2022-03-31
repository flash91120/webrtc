"use strict";
var http = require("http");
var express = require("express");
//将文件夹中文件列表显示到浏览器中
var serveIndex = require("serve-index");
var socketIo = require('socket.io');
var USERCOUNT = 3; //房间人数限制
//引入socket.io
var app = express();
app.use(serveIndex("./public"));
//可以访问public下的所有资源
app.use(express.static("./public"));
//http server
var http_server = http.createServer(app);
http_server.listen(80, "0.0.0.0");
var sockio = socketIo.listen(http_server);
//http程序编写
//当有用户发送连接消息
sockio.sockets.on("connection", (socket) => {
  //用户发送消息
  socket.on("message", (room, data) => {
    socket.to(room).emit("message", room, data);
  });
  //用户发送的消息是"加入"消息
  socket.on("join", (room) => {
    socket.join(room); //用户加入房间
    var myRoom = sockio.sockets.adapter.rooms[room]; //获取加入房间的信息对象
    var users = myRoom ? Object.keys(myRoom.sockets).length : 0; //获取房间中的所有人数
    console.log("the number of user in room is :" + users);
    if (users < USERCOUNT) {
      socket.emit("joined", room, socket.id); //向用户本人回消息
      if (users > 1) {
        socket.to(room).emit("otherjoin", room, socket.id); //向房间中除自己以外的所有人回消息
      }
    } else {
      //超出人数限制,踢出房间
      socket.leave(room);
      socket.emit("full", room, socket.id);
    }
    //socket.to(room).emit("joined", room, socket.id);//向房间中除自己以外的所有人回消息
    //sockio.in(room).emit("joined", room, socket.id);//向房间中所有人回消息
    //socket.broadcast.emit("joined", room, socket.id); //给除自己外的全部站点的人发
  });
  //用户发送的消息是"离开"消息
  socket.on("leave", (room) => {
    var myRoom = sockio.sockets.adapter.rooms[room]; //获取加入房间的信息对象
    var users = Object.keys(myRoom.sockets).length; //获取房间中的所有人数
    console.log("the number of user in room is :" + (users - 1));
    socket.leave(room); //用户离开房间
    socket.emit("leaved", room, socket.id); //向用户本人回消息
    socket.to(room).emit("bye", room, socket.id); //向房间中除自己以外的所有人回消息
    //socket.to(room).emit("joined", room, socket.id);//向房间中除自己以外的所有人回消息
    //sockio.in(room).emit("joined", room, socket.id);//向房间中所有人回消息
    //socket.broadcast.emit("joined", room, socket.id); //给除自己外的全部站点的人发
  });
});
