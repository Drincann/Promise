class MyPromise {

  _state = 'pending'; // 'fulfilled' 'rejected'
  _value = null;
  _callbacks = []; // { onFulfilled: (value: any) => void, onRejected: (error: any) => void}[]
  _fulfill(value) {
    this._value = value;
    this._state = 'fulfilled';
    this._callbacks.forEach(callback => callback.onFulfilled?.(this._value));
    this._callbacks = null; // callback only called once
  }
  _reject(error) {
    this._value = error;
    this._state = 'rejected';
    this._callbacks.forEach(callback => callback.onRejected?.(this._value));
    this._callbacks = null; // callback only called once
  }

  constructor(resolver) {
    this._callResolver(resolver, this._resolveDFS.bind(this), this._reject.bind(this))
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
