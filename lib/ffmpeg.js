"use strict";


const spawn  = require('child_process').spawn;
const merge  = require('mout/object/merge');

const Server = require('./_server');


class FFMpegServer extends Server {

  constructor(server, opts) {
    console.log('Create ffmpeg server');
    super(server, merge({
      fps : 15,
    }, opts));
  }

  get_feed(streamName) {
    console.log('get feed ffmpeg', streamName);
    var args = [
        "-f", "gdigrab",
        "-framerate", this.options.fps,
        "-offset_x", 10,
        "-offset_y", 20,
        "-video_size", this.options.width + 'x' + this.options.height,
        '-i',  'desktop',
        '-pix_fmt',  'yuv420p',
        '-c:v',  'libx264',
        '-vprofile', 'baseline',
        '-tune', 'zerolatency',
        '-f' ,'rawvideo',
        '-'
    ];

      //https://trac.ffmpeg.org/wiki/Limiting%20the%20output%20bitrate
    var args = [
        "-f", "dshow",
        "-i",  "video=Integrated Webcam" ,
        "-framerate", this.options.fps,
        "-video_size", this.options.width + 'x' + this.options.height,
        '-pix_fmt',  'yuv420p',
        '-c:v',  'libx264',
        '-b:v', '600k',
        '-bufsize', '600k',
        '-vprofile', 'baseline',
        '-tune', 'zerolatency',
        '-f' ,'rawvideo',
        '-'
    ];

    var args = [
        "-re",
        "-i",  "rtmp://10.2.254.116:554/webrtc?live=1/cad3df86dfce77c135866d26009f7951" ,
        "-framerate", this.options.fps,
        "-video_size", this.options.width + 'x' + this.options.height,
        '-pix_fmt',  'yuv420p',
        '-c:v',  'libx264',
        '-b:v', '300k',
        '-bufsize', '300k',
        '-vprofile', 'baseline',
        '-tune', 'zerolatency',
        '-f' ,'rawvideo',
        '-'
    ];

    var args = [
        "-re",
        "-i",  "rtmp://wow01.thuis.nl:1935/webrtc?live=1/" + streamName , //cad3df86dfce77c135866d26009f7951
        "-f", "mpegts",
        "-codec:v", "mpeg1video",
        "-s", "320x240",
        "-b:v", "512k",
        "-r", "30",
        //"-bf", "0",
        //"-codec:a", "mp2",
        //"-ar", "44100",
        //"-ac", "1",
        //"-b:a", "128k",
        "-muxdelay", "0.001",
        "-"
    ];



    //ffmpeg -re -i "rtmp://10.2.254.116:554/webrtc?live=1/cad3df86dfce77c135866d26009f7951"


    console.log("ffmpeg " + args.join(' '));
    var streamer = spawn('ffmpeg', args);
    //streamer.stderr.pipe(process.stderr);

    /*streamer.on("exit", function(code){
      console.log("Failure", code);
    });*/

    return streamer;//.stdout;
  }

};


module.exports = FFMpegServer;
