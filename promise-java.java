import java.util.ArrayList;
import java.util.List;

interface Callback<T, R> {
  R call(T value);
}

interface Resolver<T> {
  void call(Callback<T, Void> resolve, Callback<Exception, Void> reject);
}

enum State {
  PENDING,
  FULFILLED,
  REJECTED
}

public class Promise<T> {
  private State state = State.PENDING;
  private List<Callback<T, Object>> callbacksOnFulfilled = new ArrayList<>();
  private List<Callback<Exception, Object>> callbacksOnRejected = new ArrayList<>();

  private T value = null;
  private Exception reason = null;

  public Promise(Resolver<T> resolver) {
    resolver.call((T value) -> {
      this.resolve(value);
      return null;
    }, (Exception reason) -> {
      this.reject(reason);
      return null;
    });
  }

  private void reject(Exception e) {
    if (this.state != State.PENDING) {
      return;
    }
    this.reason = e;
    this.state = State.REJECTED;
    this.callbacksOnRejected.forEach(callback -> callback.call(this.reason));
  }

  private void fulfill(T value) {
    if (this.state != State.PENDING) {
      return;
    }
    this.value = value;
    this.state = State.FULFILLED;
    this.callbacksOnFulfilled.forEach(callback -> callback.call(this.value));
  }

  private void resolve(T value) {
    if (value instanceof Promise) {
      ((Promise<T>) value).then((T nextValue) -> {
        this.resolve(nextValue);
        return null;
      }, (Exception reason) -> {
        this.reject(reason);
        return null;
      });
      return;
    }
    this.fulfill(value);
  }

  public Promise<Object> then(Callback<T, Object> onFulfilled, Callback<Exception, Object> onRejected) {
    return new Promise<>((resolve, reject) -> {
      if (this.state == State.PENDING) {
        this.callbacksOnFulfilled.add(value -> resolve.call(onFulfilled.call(value)));
        this.callbacksOnRejected.add(reason -> resolve.call(onRejected.call(reason)));
      } else if (this.state == State.FULFILLED) {
        if (onFulfilled instanceof Callback) {
          resolve.call(onFulfilled.call(this.value));
        } else {
          resolve.call(this.value);
        }
      } else {
        if (onRejected instanceof Callback) {
          resolve.call(onRejected.call(this.reason));
        }
      }
    });
  }
}
