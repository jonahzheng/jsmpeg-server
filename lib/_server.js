"use strict";


const WebSocketServer = require('ws').Server;
const Splitter        = require('stream-split');
const merge           = require('mout/object/merge');

const NALseparator    = new Buffer([0,0,0,1]);//NAL break

var buffer = [];

class _Server {

  //array of stream in memory

  constructor(server, options) {
    this.options = merge({
        width : 960,
        height: 540,
    }, options);

    this.wss = new WebSocketServer({ server });

    this.new_client = this.new_client.bind(this);
    this.start_feed = this.start_feed.bind(this);
    this.broadcast  = this.broadcast.bind(this);

    this.wss.on('connection', this.new_client);
  }


  start_feed(streamName, socket) {
    //check if the streamName already exsists
    /*if(!(streamName in buffer)){
        var self = this;
       buffer[streamName] = this.get_feed(streamName);
       buffer[streamName].pipe(new Splitter(NALseparator));
       buffer[streamName].on("data", this.broadcast);
    } else {

    }*/
    var self =this;
    socket.streamName =streamName;
    if(!(streamName in buffer)){
      var readStream = this.get_feed(streamName);
      buffer[streamName] = readStream;

      readStream.on("exit", function(code){
        console.log("Broadcast exit: ", code);
        self.broadcast("exit", streamName);
      })

      readStream = readStream.stdout;
      readStream.on("data", function(data){
        self.broadcast(data, streamName);
      });


    } else {
      //do nothing just broadcast

      readStream = buffer[streamName];

      readStream.on("exit", function(code){
        console.log("Broadcast exit: ", code);
        self.broadcast("exit", streamName);
      });

      readStream.on("data", function(data){
        self.broadcast(data, streamName);
      });
    }
  }

  get_feed(streamName) {
    throw new Error("to be implemented");
  }

  has_clients(streamName){
    var ret = false;
    this.wss.clients.forEach(function(socket) {

      if(socket.streamName == streamName){
         ret = true;
      }
    });

    return ret;
  }

  broadcast(data, streamName) {

  /*  if(socket){
      console.log("got socket");
      if(socket.buzy)
        return;

      socket.buzy = true;
      socket.buzy = false;

      socket.send(Buffer.concat([NALseparator, data]), { binary: true}, function ack(error) {
        socket.buzy = false;
      });
    } else {*/

      this.wss.clients.forEach(function(socket) {


        if(socket.buzy)
          return;

        if(socket.streamName != streamName){
           return;
        }
        socket.buzy = true;
        socket.buzy = false;
        if(data === 'exit'){
           //console.log("exit player");
           socket.close();
           return;
        }

        socket.send(Buffer.concat([NALseparator, data]), { binary: true}, function ack(error) {
          socket.buzy = false;
        });
      });
    //}

  }

  new_client(socket) {

    var self = this;


    socket.send(JSON.stringify({
      action : "init",
      width  : this.options.width,
      height : this.options.height,
    }));
    var streamName;
    socket.on("message", function(data){
      var cmd = "" + data, action = data.split(' ')[0];

      if(data.split(' ').length > 1){
         streamName = data.split(' ')[1];
      }

      console.log("Incomming action '%s' '%s'", action, streamName);

      if(action == "REQUESTSTREAM"){
        self.start_feed(streamName, socket);
      }

      if(action == "STOPSTREAM"){
        if((streamName in buffer)){
            buffer[streamName].stdout.pause();
        }
      }

    });

    socket.on('close', function() {
      //self.readStream.end();
      if((streamName in buffer)){
        //check if there are no more clients
        //console.log("has clients", self.has_clients(streamName));
        if(!self.has_clients(streamName)){
          buffer[streamName].kill();
          delete buffer[streamName];
        }

      }
      console.log('stopping client interval');
    });
  }


};


module.exports = _Server;
