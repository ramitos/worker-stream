var Duplex = require('readable-stream').Duplex
var isPlainObject = require('lodash.isplainobject');
var isFunction = require('lodash.isfunction');
var inherits = require('inherits');
var bind = require('lodash.bind');


var WorkerStream = module.exports = function(worker) {
  if (!(this instanceof WorkerStream)) {
    return new WorkerStream(worker);
  }

  Duplex.call(this, {
    objectMode: true
  });

  this._worker = worker || self;
  this._holding = [];

  this._worker.onmessage = bind(this._write, this);
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

WorkerStream.prototype._write = function(chunk, enc, fn) {
  if (isPlainObject(chunk)) {
    this._worker.postMessage(chunk);
  }

  if (this._readableState.pipesCount) {
    this._holding.push(chunk);
  }

  this._read(this._readableState.highWaterMark, true);

  if (isFunction(fn)) {
    fn();
  }
};
