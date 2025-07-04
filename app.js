// app.js (Node.js Express + Socket.IO + LowDB server for MorphDash)

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

// Set default DB structure if empty
db.defaults({ dht22: [], ultrasonic: [], raindrop: [], gas: [], light: [], flame: [], sound: [], hall: [] }).write();

app.use(express.static('src'));
app.set('port', process.env.PORT || 3000);

http.listen(app.get('port'), () => {
  console.log("=======================");
  console.log("    MorphDash v0.11     ");
  console.log("=======================");
  console.log(" Running server         ");
  console.log("------------------------");
  console.log("listening on port: " + app.get('port'));
});

function guid() {
  let d = new Date().getTime();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function nDate() {
  const date = new Date();
  return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
}

function nTime() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
}

// Slow sensors API
app.get('/slowData', (req, res) => {
  const { hum, temp, ultrasonic, raindrop, gas, touch } = req.query;

  db.get('dht22').push({ id: guid(), humidity: hum, temperature: temp, date: nDate(), time: nTime() }).write();
  db.get('ultrasonic').push({ id: guid(), reading: ultrasonic, date: nDate(), time: nTime() }).write();
  db.get('raindrop').push({ id: guid(), reading: raindrop, date: nDate(), time: nTime() }).write();
  db.get('gas').push({ id: guid(), reading: gas, date: nDate(), time: nTime() }).write();

  io.emit("s1", { temperature: temp, humidity: hum, ultrasonic, raindrop, gas, touch });
  res.send("sensor set 1: OK");
});

// Fast sensors API
app.get('/fastSensors', (req, res) => {
  const { flame, light, sound, hall } = req.query;

  io.emit("s2", { flame, light, sound, hall });
  res.send("sensor set 2: OK");
});

// Logs endpoint
app.get('/datalogs', (req, res) => {
  res.send(db.value());
});

// Welcome socket event
io.on('connection', socket => {
  console.log("New socket connection");
  socket.broadcast.emit('welcome', { message: 'Welcome!' });
});
