if (process.platform === 'linux') {
  var rpio = require('rpio');
}

const init = function() {
  if (process.platform === 'linux') {
    rpio.open(29, rpio.OUTPUT, rpio.LOW);
    rpio.open(31, rpio.OUTPUT, rpio.LOW);
    rpio.open(38, rpio.OUTPUT, rpio.LOW);
    rpio.open(40, rpio.OUTPUT, rpio.LOW);
  }
};

// TODO:modify the background(motor) here
const forward = function() {
  if (process.platform === 'linux') {
    rpio.write(29, rpio.LOW);
    rpio.write(31, rpio.HIGH);
    rpio.write(38, rpio.LOW);
    rpio.write(40, rpio.HIGH);
  }
};

const backward = function() {
  if (process.platform === 'linux') {
    rpio.write(29, rpio.HIGH);
    rpio.write(31, rpio.LOW);
    rpio.write(38, rpio.HIGH);
    rpio.write(40, rpio.LOW);
  }
};

const left = function() {
  if (process.platform === 'linux') {
    rpio.write(29, rpio.LOW);
    rpio.write(31, rpio.LOW);
    rpio.write(38, rpio.LOW);
    rpio.write(40, rpio.HIGH);
  }
};

const right = function() {
  if (process.platform === 'linux') {
    rpio.write(29, rpio.LOW);
    rpio.write(31, rpio.HIGH);
    rpio.write(38, rpio.LOW);
    rpio.write(40, rpio.LOW);
  }
};

const stop = function() {
  if (process.platform === 'linux') {
    rpio.write(29, rpio.LOW);
    rpio.write(31, rpio.LOW);
    rpio.write(38, rpio.LOW);
    rpio.write(40, rpio.LOW);
  }
};

module.exports = {
  init,
  forward,
  backward,
  left,
  right,
  stop,
};
