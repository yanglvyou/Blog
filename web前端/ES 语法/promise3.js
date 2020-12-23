class MyPromise {
    constructor(executor) {
        this.status = "pending";
        this.value = null;
        this.reason = null;
        this.onResolvedCallbacks = [];
        this.onRejectedCallbacks = [];

        let resolve = (value) => {
            if (this.status === 'pending') {
                this.status = 'fulfilled';
                this.value = value;
                this.onResolvedCallbacks.forEach(cb => cb());
            }
        }

        let reject = (reason) => {
            if (this.status === 'pending') {
                this.status = 'rejected';
                this.reason = reason;
                this.onRejectedCallbacks.forEach(cb => cb());
            }
        }

        try {
            executor(resolve, reject)
        } catch (error) {
            reject(error);
        }
    }

    then(onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
        onRejected = typeof onRejected === 'function' ? onRejected : err => {
            throw err
        };

        let promise2 = new MyPromise((resolve, reject) => {
            if (this.status === 'fulfilled') {
                setTimeout(() => {
                    try {
                        let x = onFulfilled(this.value);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (error) {
                        reject(error);
                    }
                }, 0)
            }
            if (this.status === 'rejected') {
                setTimeout(() => {
                    try {
                        let x = onRejected(this.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (error) {
                        reject(error);
                    }
                }, 0)
            }

            if (this.status === 'pending') {
                this.onResolvedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            let x = onFulfilled(this.value);
                            resolvePromise(promise2, x, resolve, reject);
                        } catch (error) {
                            reject(error);
                        }
                    }, 0)
                })

                this.onRejectedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            let x = onRejected(this.reason);
                            resolvePromise(promise2, x, resolve, reject);
                        } catch (error) {
                            reject(error);
                        }
                    }, 0)
                })
            }
        })

        return promise2;
    }
}

function resolvePromise(promise2, x, resolve, reject) {
    if (promise2 === x) {
        return reject(new TypeError('循环引用'));
    }

    let used = false;

    if (x !== null && (typeof x === 'function' || typeof x === 'object')) {
        try {
            let then = x.then;
            if (typeof then === 'function') {
                then.call(x, y => {
                    if (used) return;
                    used = true;
                    resolvePromise(promise2, y, resolve, reject);
                }, err => {
                    if (used) return;
                    used = true;
                    reject(err);
                })
            } else {
                resolve(x);
            }
        } catch (error) {
            if (used) return;
            used = true;
            reject(error)
        }
    } else {
        resolve(x);
    }

}
// resolve方法
MyPromise.resolve = value => {
    return new MyPromise((resolve, reject) => {
        resolve(value)
    })
}
//reject方法
MyPromise.reject = reason => {
    return new MyPromise((resolve, reject) => {
        reject(reason)
    })
}

// finally方法

MyPromise.prototype.finally = (callback) => {
    let p = this.constructor;

    return this.then((value) => p.resolve(callback()).then(() => {
        value
    }), (reason) => p.resolve(callback()).then(() => {
        throw reason
    }))
}

//race方法 

MyPromise.race = function (promises) {
    promises = Array.from(promises);
    return new MyPromise((resolve, reject) => {
        if (promises.length === 0) {
            return;
        }
        for (let i = 0; i < promises.length; i++) {
            resolve(promises[i]).then(data => {
                resolve(data);
                return;
            }, err => {
                reject(err);
                return;
            })
        }
    })
}


MyPromise.race([
    new MyPromise((resolve, reject) => {
        setTimeout(() => {
            resolve(100)
        }, 1000)
    }),
    new MyPromise((resolve, reject) => {
        setTimeout(() => {
            resolve(200)
        }, 200)
    }),
    new MyPromise((resolve, reject) => {
        setTimeout(() => {
            reject(100)
        }, 100)
    })
]).then((data) => {
    console.log(data);
}, (err) => {
    console.log(err);
});

// all 方法
MyPromise.all = function (promises) {
    promises = Array.from(promises); //将可迭代对象转换为数组
    return new MyPromise((resolve, reject) => {
        let index = 0;
        let result = [];
        if (promises.length === 0) {
            resolve(result);
        } else {
            function processValue(i, data) {
                result[i] = data;
                if (++index === promises.length) {
                    resolve(result);
                }
            }
            for (let i = 0; i < promises.length; i++) {
                //promises[i] 可能是普通值
                Promise.resolve(promises[i]).then((data) => {
                    processValue(i, data);
                }, (err) => {
                    reject(err);
                    return;
                });
            }
        }
    });
}

MyPromise.all = function (promises) {
    promises = Array.from(promises);
    return new MyPromise((resolve, reject) => {
        let index = 0;
        let result = [];
        if (promises.length === 0) {
            resolve(result);
            return;
        }

        function proccessValue(i, data) {
            result[i] = data;
            if (++index === promises.length) {
                resolve(result);
            }
        }

        for (let i = 0; i < promises.length; i++) {
            MyPromise.resolve(promises[i]).then(data => {
                proccessValue(i, data)
            }, err => {
                reject(err);
                return;
            })
        }
    })
}




MyPromise.defer = MyPromise.deferred = function () {
    let dfd = {}
    dfd.promise = new MyPromise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });
    return dfd;
}
module.exports = MyPromise;