class MyPromise {
  _state = 'pending'; // fulfilled rejected
  _value = null;      // value error 
  _callbacks = []     // { onResolved: (value) => void, onRejected: (error) => void }[]
  constructor(resolver) {
    if (typeof resolver !== 'function') throw TypeError();
    this._runResolver(resolver);
  }

  _fulfill(value) {
    this._state = 'fulfilled';
    this._value = value;
    this._callbacks?.forEach(callback => callback.onFulfilled?.(this._value));
    this._callbacks = null;
  }

  _reject(error) {
    this._state = 'rejected';
    this._value = error;
    this._callbacks?.forEach(callback => callback.onRejected?.(this._value));
    this._callbacks = null;
  }

  _runResolver(resolver) {
    let called = false;
    try {
      resolver(value => {
        if (called) return;
        called = true;
        this._resolveRec(value);
      }, err => {
        if (called) return;
        called = true;
        this._reject(err);
      });
    } catch (error) {
      this._reject(error);
    }

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
      const callback = {
        onFulfilled: () => resolve(typeof onFulfilled === 'function' ? onFulfilled(this._value) : this._value),
        onRejected: () => resolve(typeof onRejected === 'function' ? onRejected(this._value) : this._value),
      }
      if (this._state == 'pending') {
        this._callbacks.push(callback);
      } else if (this._state == 'fulfilled') {
        callback.onFulfilled();
      } else if (this._state == 'rejected') {
        callback.onRejected();
      }
    });

  }
}
module.exports = MyPromise;
