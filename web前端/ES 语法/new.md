### 描述一下 new 的过程

1. 在内存中新建一个对象；
2. 这个对象内部__proto__特性被赋值为构造函数的 prototype 属性；
3. 构造函数内部 this 被赋值为这个新对象；
4. 执行构造函数内部的代码；
5. 如果构造函数返回非空对象，则返回这个对象；否则返回创建的新对象；

```javascript
function myNew(func, ...args) {
	// 新建一个对象
	let obj = {};

	// 给这个对象指定原型链，不要用obj.__proto = func.prototype，__proto__这种写法并不是很好
	Object.setPrototypeOf(obj, func.prototype);

	// 构造函数内部this赋值这个新对象，并执行构造函数中的代码
	let result = func.apply(obj, args);

	// 如果构造函数返回非空对象，则返回该对象；否则返回新创建的对象；
	return result instanceof Object ? result : obj;
}

function Person(name) {
	this.name = name;
	return 1;
	// return {
	// 	age: 27
	// }
}

const person = myNew(Person, 'Tom');
console.log('person: ', person);
```
