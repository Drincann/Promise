class MyPromise {
  _state = 'pending'; // 'fulfilled' 'rejected'
  _value = null;
  _callbacks = []; // { onFulfilled: (value: any) => void, onRejected: (error: any) => void}[]
  constructor(resolver) {
    if (typeof resolver !== 'function') throw TypeError();
    this._callResolver(resolver, this._resolveDFS.bind(this), this._reject.bind(this))
  }

  _fulfill(value) {
    this._value = value;
    this._state = 'fulfilled';
    this._callbacks?.forEach(callback => callback.onFulfilled?.(this._value));
    this._callbacks = null; // callback only called once
  }

  _reject(error) {
    this._value = error;
    this._state = 'rejected';
    this._callbacks?.forEach(callback => callback.onRejected?.(this._value));
    this._callbacks = null; // callback only called once
  }

  // only called once
  _callResolver(resolver, onFulfilled, onRejected) {
    let called = false;
    try {
      resolver((value) => {
        if (called) return;
        called = true;
        onFulfilled(value);
      }, (error) => {
        if (called) return;
        called = true;
        onRejected(error);
      });
    } catch (error) {
      onRejected(error);
    }
  }

  _resolveDFS(value) {
    if (typeof value?.then === 'function') {
      // thenable
      this._callResolver(value.then.bind(value), this._resolveDFS.bind(this), this._reject.bind(this));
      return;
    }
    this._fulfill(value)
  }


  static resolve(value) {
    return new Promise((resolve, _) => resolve(value));
  }


  static all(promises /* any iterable */) {
    promises = Array.from(promises);
    if (promises.length === 0) return MyPromise.resolve([]);
    let rest = promises.length;
    const results = new Array(rest).fill(undefined);
    return new MyPromise((resolve, reject) => {
      promises.forEach((promise, index) => {
        if (promise?.then !== MyPromise.prototype.then) {
          if (typeof promise?.then !== 'function') {
            throw new Error('不是有效的 thenable');
          }
          promise = new MyPromise(promise.then);
        }
        promise.then(promise.then(value => {
          results[index] = value;
          if (--rest == 0) {
            resolve(results);
          }
        }, err => {
          reject(err);
        }));
      });
    });
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((fulfill, reject) => {
      // wait current promise fulfilled
      if (this._state == 'pending') {
        this._callbacks.push({
          onFulfilled: () => {
            fulfill(typeof onFulfilled == 'function' ? onFulfilled(this._value) : this._value);
          },
          onRejected: () => {
            fulfill(typeof onRejected == 'function' ? onRejected(this._value) : this._value);
          }
        });
      } else if (this._state == 'fulfilled') {
        fulfill(typeof onFulfilled == 'function' ? onFulfilled(this._value) : this._value);
      } else if (this._state == 'rejected') {
        fulfill(typeof onRejected == 'function' ? onRejected(this._value) : this._value);
      }
    });
  }
}
module.exports = MyPromise;