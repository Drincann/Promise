type Fulfill<T> = (value: T) => any;
type Reject<T> = (err: T) => any;
type Task<T> = (fulfill: Fulfill<T>, reject: Reject<any>) => any;
interface PromiseCallback<T> {
  onFulFilled: Fulfill<T>;
  onRejected: Reject<any>;
}

export class MyPromise<T = any> {
  constructor(task: Task<T | any>) {
    if (typeof task !== 'function') throw TypeError('resolver must be a function')
    this.execTask(task, this.resolve.bind(this), this.reject.bind(this))
  }

  private state: 'pending' | 'rejected' | 'fulfilled' = 'pending';
  private value?: T | any;
  private callbacks: PromiseCallback<T>[] = [];

  private reject(err: any): void {
    this.value = err;
    this.state = 'rejected'
    this.callbacks?.forEach(callback => callback.onRejected(this.value))
    this.callbacks = null;
  }

  private fulfill(value: T): void {
    this.value = value;
    this.state = 'fulfilled';
    this.callbacks?.forEach(callback => callback.onFulFilled(this.value))
    this.callbacks = null;
  }

  private execCallback(onFulFilled: Fulfill<T>, onRejected: Reject<any>) {
    if (this.state == 'pending') {
      this.callbacks.push({
        onFulFilled,
        onRejected,
      });
    } else if (this.state == 'fulfilled') {
      onFulFilled(this.value);
    } else if (this.state == 'rejected') {
      onRejected(this.value);
    }
  }

  private execTask(task: Task<T>, onFulfilled: Fulfill<T>, onRejected: Reject<any>): void {
    let called = false;
    try {
      task((value: T) => {
        if (called) return;
        called = true;
        onFulfilled(value);
      }, (reason: any) => {
        if (called) return;
        called = true;
        onRejected(reason);
      })
    } catch (error) {
      if (called) return;
      onRejected(error)
    }
  }

  private resolve(result: T | any): void {
    try {
      if (typeof result?.then == 'function') {
        this.execTask(result.then.bind(result), this.resolve.bind(this), this.reject.bind(this));
        return;
      }
      this.fulfill(result as T);
    } catch (error) {
      this.reject(error);
    }
  }

  public then<R = any>(onFulfilled?: Fulfill<T>, onRejected?: Reject<any>) {
    const outerPromise = this;
    return new MyPromise<R>((resolve, reject) => {
      outerPromise.execCallback((value) => {
        if (typeof onRejected === 'function') {
          resolve(onFulfilled?.(value));
        } else {
          resolve(value);
        }
      }, (err) => {
        resolve(typeof onRejected === 'function' ? onRejected(err) : err);
      });

    });
  }

  public nodeify(callback: Function | any, ctx: any) {
    if (typeof callback != 'function') return this;

    this.then(function (value) {
      callback.call(ctx, null, value);
    }, function (err) {
      callback.call(ctx, err);
    });
  }

  public static all(promises: Iterable<MyPromise>) {
    const promisesList = Array.from(promises);
    if (promisesList.length === 0) return MyPromise.resolve([]);

    const results: Array<any> = new Array(promisesList.length).fill(undefined);
    let rest = promisesList.length;
    return new MyPromise<Array<any>>((fulfill, reject) => {
      promisesList.forEach((promise, index) => {
        if (promise.then !== MyPromise.prototype.then) {
          var then = promise.then;
          if (typeof then === 'function') {
            promise = new MyPromise(then.bind(promise))
          }
        }
        promise.then(value => {
          results[index] = value;
          if (--rest === 0) {
            fulfill(rest);
          }
        }, err => reject(err))
      })
    });
  }

  public static resolve(value: any) {
    return new MyPromise((resolve, _) => resolve(value));
  }
}