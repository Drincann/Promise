
class MyPromise {
  _state = 'pending';
  _value = null;
  _callbacks = [];
  constructor(resolver) {
    resolver(this._resolve.bind(this), this._reject.bind(this));
  }

  _fulfill(value) {
    this._state = 'fulfilled';
    this._value = value;
    this._callbacks.forEach(callback => callback?.onFulfilled?.(value));
  }

  _reject(err) {
    this._state = 'rejected';
    this._value = err;
    this._callbacks.forEach(callback => callback?.onRejected?.(err))
  }

  _resolve(thenable) {// recurve
    if (typeof thenable?.then === 'function') {
      let called = false;
      thenable.then(value => {
        if (called) return;
        called = true;
        this._resolve(value);
      }, err => {
        if (called) return;
        called = true;
        this._reject(err);
      });
      return;
    }
    this._fulfill(thenable);
  }


  whenDone(onFulfilled, onRejected) {
    if (this._state === 'pending') {
      this._callbacks.push({
        onFulfilled,
        onRejected
      });
    } else if (this._state === 'fulfilled') {
      onFulfilled?.(this._value);
    } else if (this._state === 'rejected') {
      onRejected?.(this._value);
    }
  }

  then(onFulfilled, onRejected) {
    const self = this;
    return new MyPromise((resolve, reject) => {
      self.whenDone(value => {
        try {
          resolve(onFulfilled?.(value));
        } catch (error) {
          reject(error);
        }
      }, error => {
        try {
          resolve(onRejected?.(error))
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }
}

module.exports = MyPromise;
