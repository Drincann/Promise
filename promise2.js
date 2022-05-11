class MyPromise {
  _state = 'pending'; // fulfilled rejected
  _value = null;      // value error 
  _callbacks = []     // { onResolved: (value) => void, onRejected: (error) => void }[]
  constructor(resolver) {
    this._runResolver(resolver);
  }

  _runResolver(resolver) {
    let called = false;
    resolver(value => {
      if (called) return;
      called = true;
      this._resolveRec(value);
    }, err => {
      if (called) return;
      called = true;
      this._reject(err);
    });
  }

  _fulfill(value) {
    this._state = 'fulfilled';
    this._value = value;
    this._callbacks.forEach(callback => callback.onFulfilled(this._value));
  }

  _reject(error) {
    this._state = 'rejected';
    this._value = error;
    this._callbacks.forEach(callback => callback.onRejected(this._value));
  }

  _resolveRec(thenable) {
    if (typeof thenable?.then === 'function') {
      this._runResolver(thenable.then.bind(thenable));
      return;
    }
    this._fulfill(thenable);
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      // 等待当前 promise 完成，调 on*
      if (this._state == 'pending') {
        this._callbacks.push({ onFulfilled, onRejected });
      } else if (this._state == 'fulfilled') {
        resolve(onFulfilled(this._value));
      } else if (this._state == 'rejected') {
        resolve(onRejected(this._value));
      }
    });

  }
}

// Obj.prototype.bind = function (self) {
//   const method = new Symbol('method');
//   self[method] = this;
//   return () => self[method]();
// }





const fs = require('fs');

new MyPromise((resolve, reject) => {
  console.log(1);
  resolve('first promise value');
}).then(value => {
  console.log(value);

  return new MyPromise((resolve, reject) => {
    fs.readFile('./index.js', (err, data) => {
      if (err) reject('file io error'); else resolve('file readed')
    });
  });

}).then(value => {
  console.log(value);
})