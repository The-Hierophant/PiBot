const async = require('async');
const bodyParser = require('body-parser');
const cors = require('cors');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const spawn = require('child_process').spawn;
const express = require('express');
const fs = require('fs');
const multer = require('multer');
const config = require('./config');
const motor = require('./motor');

console.log('Current platform: ' + process.platform);

if (process.platform === 'linux') {
  var videDir = config.picamDir + 'rec/archive';
  var musicDir = config.musicDir;
} else {
  var videDir = './archive';
  var musicDir = './archive/music';
}

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/videos', express.static(videDir));

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, '/tmp/');
  },
  filename: function(req, file, cb) {
    cb(null, 'audio');
  },
});

const upload = multer({storage: storage});

const server = app.listen(config.PORT, function() {
  console.log('Running on HTTP port: ' + config.PORT);
});

app.post('/audio', upload.any(), function(req, res) {
  const cmd = 'avplay /tmp/audio';
  _execute(cmd);
  res.send('OK');
});

app.get('*', function(req, res) {
  res.sendFile('public/index.html', {root: __dirname});
});

// Servo
const max = 11.5; const min = 2.5;
let dutyCycle = 7;
let dutyCycle2 = 7;

let music; let musicProcess; let recording;

// Websocket
const io = require('socket.io')(server);

io.on('connection', function(socket) {
  socket.on('disconnect', function() {
    if (recording) {
      _stopRecording();
    }
  });

  socket.on('ac', (msg) => {
    if (msg === true) {
      var cmd = config.baseDir + 'bin/on.out';
    } else {
      var cmd = config.baseDir + 'bin/off.out';
    }
    _execute(cmd);
  });

  socket.on('fan', (msg) => {
    const cmd = config.baseDir + 'bin/on.out';
    _execute(cmd);
  });

  socket.on('speaker', (msg) => {
    const cmd = 'amixer set \'Speaker\',0 ' + msg + '%';
    _execute(cmd);
  });

  socket.on('camera', (msg) => {
    dutyCycle = (msg + max - min) / 2 + min;
    _moveCam(dutyCycle);
  });

  socket.on('camera2', (msg) => {
    dutyCycle2 = (msg + max - min) / 2 + min;
    _moveCam(dutyCycle2);
  });
  socket.on('music', (msg) => {
    _stopMusic();
    if (music !== msg) {
      _playMusic(msg);
    } else {
      music = undefined;
    }
  });

  socket.on('recordedVideos', () => {
    _refreshVideos();
  });

  socket.on('refreshMusicFiles', () => {
    _refreshMusicFiles();
  });

  socket.on('roomTemp', () => {
    let res = '';
    if (process.platform === 'linux') {
      while (res.length === 0) {
        res = execSync('python ' + config.baseDir + 'bin/temp_hum/getTemp.py').toString().trim();
      }
    } else {
      res = '20';
    }
    socket.emit('roomTemp', res);
  });

  socket.on('roomHumidity', () => {
    let res = '';
    if (process.platform === 'linux') {
      while (res.length === 0) {
        res = execSync('python ' + config.baseDir + 'bin/temp_hum/getHum.py').toString().trim();
      }
    } else {
      res = '50';
    }
    socket.emit('roomHumidity', res);
  });

  socket.on('direction', (msg) => {
    console.log(msg);
    switch (msg) {
      case 'forward':
        motor.forward();
        break;
      case 'backward':
        motor.backward();
        break;
      case 'left':
        motor.left();
        break;
      case 'right':
        motor.right();
        break;
      case 'camleft':
        dutyCycle = dutyCycle + 1.5 > max ? dutyCycle: dutyCycle + 1.5;// TODO:modify the background here
        _moveCam(dutyCycle);
        break;
      case 'camright':
        dutyCycle = dutyCycle - 1.5 < min ? dutyCycle: dutyCycle - 1.5;
        _moveCam(dutyCycle);
        break;
      case 'camup':
        dutyCycle2 = dutyCycle2 + 1.5 < min ? dutyCycle2: dutyCycle2 + 1.5;
        _moveCam2(dutyCycle2);
        break;
      case 'camdown':
        dutyCycle2 = dutyCycle2 - 1.5 < min ? dutyCycle2: dutyCycle2 - 1.5;
        _moveCam2(dutyCycle2);
        break;
      default:
        motor.stop();
    }
  });

  socket.on('record', (msg) => {
    if (msg) {
      _startRecording();
    } else {
      _stopRecording();
    }
  });
});

var _execute = function(cmd) {
  console.log('Execute command: ' + cmd);
  exec(cmd,
      (error, stdout, stderr) => {
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        if (error !== null) {
          console.log(`exec error: ${error}`);
        }
      });
};

var _moveCam = (dutyCycle) => {
  const cmd = 'python ' + config.baseDir + 'bin/direct.py ' + dutyCycle;
  _execute(cmd);
};

var _moveCam2 = (dutyCycle2) => {
  const cmd = 'python ' + config.baseDir + 'bin/direct_2.py ' + dutyCycle2;
  _execute(cmd);
};

// Initialize servo to middle position
if (process.platform == 'linux') {
  _moveCam(7);
  _moveCam2(7);
}

// Initialize motor output
motor.init();

var _startRecording = function() {
  recording = true;
  let cmd = 'rm -rf ' + config.picamDir + 'hooks/*; rm -rf ' + config.picamDir + 'rec/archive/*.ts; rm -rf ' + config.picamDir + 'rec/*.ts';
  _execute(cmd);
  cmd = 'touch ' + config.picamDir + 'hooks/start_record';
  _execute(cmd);
};

var _stopRecording = function() {
  recording = false;
  let cmd = 'touch ' + config.picamDir + 'hooks/stop_record';
  _execute(cmd);
  cmd = 'cd ' + videDir + '; VIDEO=`ls -r | grep .ts | head -n 1`; OUTFILE=`echo $VIDEO | cut -f1 -d\'.\'`; avconv -i $VIDEO -c:v copy -c:a copy -bsf:a aac_adtstoasc $OUTFILE.mp4';
  _execute(cmd);
  setTimeout(function() {
    _refreshVideos();
  }, 5*1000);
};

var _stopMusic = () => {
  if (musicProcess) {
    const cmd = 'kill ' + musicProcess.pid;
    _execute(cmd);
  }
};

var _playMusic = (msg) => {
  const filename = musicDir + msg;
  musicProcess = spawn('mpg123', [filename], {detached: true});
  music = msg;
  console.log('mpg123 Process ID:' + musicProcess.pid);
};


var _refreshVideos = function() {
  console.log(videDir);
  fs.readdir(videDir, function(err, files) {
    console.log(files);
    const videos = [];
    if (files) {
      for (let i=0; i<files.length; i++) {
        if (files[i].indexOf('.mp4') !== -1) {
          videos.push(files[i]);
        }
      }
    }
    io.emit('recordedVideos', videos);
  });
};

var _refreshMusicFiles = function() {
  console.log(musicDir);
  fs.readdir(musicDir, function(err, files) {
    console.log(files);
    const music = [];
    if (files) {
      for (let i=0; i<files.length; i++) {
        if (files[i].indexOf('.mp3') !== -1) {
          music.push(files[i]);
        }
      }
    }
    io.emit('refreshMusicFiles', music);
  });
};
