var Duplex = require('readable-stream').Duplex
var inherits = require('inherits');

var WorkerStream = function(worker) {
  if (!(this instanceof WorkerStream)) {
    return new WorkerStream(worker);
  }

  Duplex.call(this);

  this.worker = worker || self;
  this._holding = [];

  this.worker.onmessage = this._write;
};

inherits(WorkerStream, Duplex);

WorkerStream.prototype._read = function(size, tryit) {
  if (!this._holding.length) {
    this._waiting = true;
    return;
  }

  if ((this._holding.length > this._readableState.highWaterMark) && tryit) {
    return;
  }

  this._waiting = false;

  if (!this.push(this._holding.shift())) {
    this._read();
  }
};

WorkerStream.prototype._write = function(chunk) {
  this.worker.postMessage(chunk);

  if (this.state.pipesCount) {
    this._holding.push(chunk);
  }

  this._read(this._readableState.highWaterMark, true);
};