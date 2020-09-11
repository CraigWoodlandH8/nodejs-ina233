// https://github.com/brettmarl/node-ina219/blob/master/ina219.js
// https://github.com/scottvr/pi-ina233/blob/master/ina233.py

const i2c = require('i2c-bus');
const calculateCurrent = require('./calculateCurrent.js');

var _twos_compliment_to_int = (val, bits) => {
  if(val && (1 << (bits - 1)) != 0) {
    return val - (1 << bits);
  }

  return val;
};

class ina233 {
  init(address, bus) {
    return new Promise((resolve, reject) => {
      this.address = (address === undefined ? 0x41 : address);
      this.bus = (bus === undefined ? 1 : bus);

      this.wire = i2c.open(this.bus, (err) => {
        if(err) {
          throw new Exception(err);
        } else {
          resolve();
        }
      });
    });
  }

  writeRegisterBlock(register, value) {
    return new Promise((resolve, reject) => {
      var bytes = Buffer.alloc(2);

      bytes[0] = (value >> 8) & 0xFF;
      bytes[1] = value & 0xFF;

      this.wire.writeI2cBlock(this.address, register, 2, bytes, (err, bytesWritten, buffer) => {
        if(err) {
          throw new Exception(err);
        } else {
          resolve();
        }
      });
    });
  }

  writeRegisterWord(register, value) {
    return new Promise((resolve, reject) => {
      this.wire.writeWord(this.address, register, value, (err) => {
        if(err) {
          throw new Exception(err);
        } else {
          resolve();
        }
      });
    });
  }

  readRegisterBlock(register) {
    return new Promise((resolve, reject) => {
      var res = Buffer.alloc(2);

      this.wire.readI2cBlock(this.address, register, 2, res, (err, bytesRead, buffer) => {
        if(err) {
          throw new Exception(err);
        } else {
          resolve(buffer);
        }
      });
    });
  }

  readRegisterWord(register) {
    return new Promise((resolve, reject) => {
      this.wire.readWord(this.address, register, (err, word) => {
        if(err) {
          throw new Exception(err);
        } else {
          resolve(word);
        }
      });
    });
  }

  calibrate(shuntOhms, maxAmps) {
    return new Promise((resolve, reject) => {
      this.shuntOhms = shuntOhms;
      this.maxAmps = maxAmps;

      var currentLSB = maxAmps / (Math.pow(2, 15));
      var powerLSB = 25 * currentLSB;
      var calibration = parseInt(0.00512 / (shuntOhms * currentLSB));

      this.currentLSB = currentLSB;

      this._b_c = 0;

      var calculations = calculateCurrent(currentLSB);

      this._R_c = calculations._R_c;
      this._m_c = calculations._m_c;

      // Calibration Register = 0xD4
      this.writeRegisterWord(0xD4, calibration).then(() => {
        resolve();
      });
    });
  }

  busVoltageIn() {
    return new Promise((resolve, reject) => {
      // Bus Voltage In (raw) Register = 0x88
      this.readRegisterWord(0x88).then((value) => {
        // Bus Voltage LSB = 0.00125
        resolve({
          raw: value,
          V: value * 0.00125
        });
      });
    });
  }

  busVoltageOut() {
    return new Promise((resolve, reject) => {
      // Bus Voltage Out (raw) Register = 0x8B
      this.readRegisterWord(0x8B).then((value) => {
        // Bus Voltage LSB = 0.00125
        resolve({
          raw: value,
          V: value * 0.00125
        });
      });
    });
  }

  currentIn() {
    return new Promise((resolve, reject) => {
      // Current In (raw) Register = 0x89
      this.readRegisterWord(0x89).then((value) => {
        var current = (value * (Math.pow(10, -this._R_c)) - this._b_c) / this._m_c;
        current = current * 1000;

        resolve({
          raw: value,
          mA: current
        });
      });
    });
  }

  currentOut() {
    return new Promise((resolve, reject) => {
      // Current Out (raw) Register = 0x8C
      this.readRegisterWord(0x8C).then((value) => {
        var current = (value * (Math.pow(10, -this._R_c)) - this._b_c) / this._m_c;
        current = current * 1000;

        resolve({
          raw: value,
          mA: current
        });
      });
    });
  }
}

module.exports = ina233;
