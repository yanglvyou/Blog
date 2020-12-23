// Promise 源码实现

const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

function Promise(executor) {
    let self = this;
    self.status = PENDING;
    self.onFulfilled = []; // 成功的回调
    self.onRejected = []; // 失败的回调

    function resolve(value) {
        if (self.status === PENDING) {
            self.status = FULFILLED;
            self.value = value;
            self.onFulfilled.forEach(fn => fn());
        }
    }

    function reject(reason) {
        if (self.status === PENDING) {
            self.status = REJECTED;
            self.reason = reason;
            self.onRejected.forEach(fn => fn());
        }
    }

    try {
        executor(resolve, reject)
    } catch (error) {
        reject(error)
    }


}

Promise.prototype.then = function (onFulfilled, onRejected) {
    // onFulfilled或onRejected不能同步被调用，必须异步调用。我们就用setTimeout解决异步问题
    //PromiseA+ 2.2.1 / PromiseA+ 2.2.5 / PromiseA+ 2.2.7.3 / PromiseA+ 2.2.7.4
    // onFulfilled如果不是函数，就忽略onFulfilled，直接返回value
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => {
        throw reason
    };
    let self = this;
    //PromiseA+ 2.2.7
    let promise2 = new Promise((resolve, reject) => {
        if (self.status === FULFILLED) {
            //PromiseA+ 2.2.2
            //PromiseA+ 2.2.4 --- setTimeout,异步
            setTimeout(() => {
                try {
                    //PromiseA+ 2.2.7.1
                    let x = onFulfilled(self.value);
                    resolvePromise(promise2, x, resolve, reject);
                } catch (e) {
                    //PromiseA+ 2.2.7.2
                    reject(e);
                }
            });
        } else if (self.status === REJECTED) {
            //PromiseA+ 2.2.3
            setTimeout(() => {
                try {
                    let x = onRejected(self.reason);
                    resolvePromise(promise2, x, resolve, reject);
                } catch (e) {
                    reject(e);
                }
            });
        } else if (self.status === PENDING) {
            self.onFulfilled.push(() => {
                setTimeout(() => {
                    try {
                        let x = onFulfilled(self.value);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            self.onRejected.push(() => {
                setTimeout(() => {
                    try {
                        let x = onRejected(self.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }
    });
    return promise2;
}

function resolvePromise(promise2, x, resolve, reject) {
    let self = this;
    //     •如果 x === promise2，则是会造成循环引用，自己等待自己完成，则报“循环引用”错误

    // let p = new Promise(resolve => {
    //   resolve(0);
    // });
    // var p2 = p.then(data => {
    //   // 循环引用，自己等待自己完成，一辈子完不成
    //   return p2;
    // })
    if (promise2 === x) {
        reject(new TypeError('Chaining cycle'))
    }

    if (x && typeof x === 'object' || typeof x === 'function') {
        // 成功和失败只能调用一个 所以设定一个called来防止多次调用,防止多次调用
        let used;
        try {
            // x 是对象或者函数（包括promise）， let then = x.then 2、当x是对象或者函数（默认promise）
            let then = x.then;
            if (typeof then === 'function') {
                // 如果then是个函数，则用call执行then，第一个参数是this，后面是成功的回调和失败的回调
                then.call(x, y => {
                    if (used) return;
                    used = true;
                    resolvePromise(promise2, y, resolve, reject)
                }, r => {
                    //PromiseA+2.3.3.2
                    if (used) return;
                    used = true;
                    reject(r);
                })
            } else {
                //PromiseA+2.3.3.4
                if (used) return;
                used = true;
                resolve(x);
            }
        } catch (error) {
            //PromiseA+ 2.3.3.2
            if (used) return;
            used = true;
            reject(error);
        }
    } else {
        // x 是普通值 直接resolve(x)
        //PromiseA+ 2.3.3.4
        resolve(x);
    }
}

Promise.defer = Promise.deferred = function () {
    let dfd = {};
    dfd.promise = new Promise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });
    return dfd;
}



module.exports = Promise;