### Promise 异步加载图片

```javascript
function loadImageAsync(url) {
	return new Promise(function (resolve, reject) {
		const image = new Image();

		image.onload = function () {
			resolve(image);
		};

		image.onerror = function () {
			reject(new Error('Could not load image at ' + url));
		};

		image.src = url;
	});
}
```

### Promise 对象实现的 Ajax 操作

```javascript
const getJSON = function (url) {
	const promise = new Promise(function (resolve, reject) {
		const handler = function () {
			if (this.readyState !== 4) {
				return;
			}
			if (this.status === 200) {
				resolve(this.response);
			} else {
				reject(new Error(this.statusText));
			}
		};
		const client = new XMLHttpRequest();
		client.open('GET', url);
		client.onreadystatechange = handler;
		client.responseType = 'json';
		client.setRequestHeader('Accept', 'application/json');
		client.send();
	});

	return promise;
};

getJSON('/posts.json').then(
	function (json) {
		console.log('Contents: ' + json);
	},
	function (error) {
		console.error('出错了', error);
	}
);
```

### Promise.prototype.finally()

> Promise 实例具有 then 方法，也就是说，finally 方法是定义在原型对象 Promise.prototype 上的。

```javascript
promise.finally(() => {
	// 语句
});

// 等同于
promise.then(
	(result) => {
		// 语句
		return result;
	},
	(error) => {
		// 语句
		throw error;
	}
);

// 实现finally方法

Promise.prototype.finally = function (callback) {
	let p = this.constructor;
	return this.then(
		(value) => P.resolve(callback()).then(() => value),
		(reason) =>
			P.resolve(callback()).then(() => {
				throw reason;
			})
	);
};
```
