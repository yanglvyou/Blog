### 类的数据类型就是函数，类本身指向构造函数

```javascript
class Point {
	//...
}

typeof Point; // function
Point === Point.prototype.constructor; // true
```

### 类的所有方法都定义在类的 prototype 属性上面

```javascript
class Point {
	constructor() {
		// ...
	}

	toString() {
		// ...
	}

	toValue() {
		// ...
	}
}

// 等同于

Point.prototype = {
	constructor() {},
	toString() {},
	toValue() {},
};
```

### 类的内部所有定义的方法，都是不可枚举的（non-enumerable）

```javascript
class Point {
	constructor(x, y) {
		// ...
	}

	toString() {
		// ...
	}
}

Object.keys(Point.prototype);
// []

// ES5可以枚举
var Point = function (x, y) {
	// ...
};

Point.prototype.toString = function () {
	// ...
};

Object.keys(Point.prototype);
// ["toString"]
```

### constructor 方法

> constructor 方法是类的默认方法，通过 new 命令生成对象实例时，自动调用该方法。constructor 方法默认返回实例对象（即 this），完全可以指定返回另外一个对象。

```javascript
class Foo {
	constructor() {
		return Object.create(null);
	}
}

new Foo() instanceof Foo;
// false
```

### 静态方法

> 静态方法也是可以从 super 对象上调用的。

```javascript
class Foo {
	static classMethod() {
		return 'hello';
	}
}

class Bar extends Foo {
	static classMethod() {
		return super.classMethod() + ', too';
	}
}

Bar.classMethod(); // "hello, too"
```

### 实例属性的新写法

> 实例属性除了定义在 constructor()方法里面的 this 上面，也可以定义在类的最顶层。

```javascript
class IncreasingCounter {
	constructor() {
		this._count = 0;
	}
	get value() {
		console.log('Getting the current value!');
		return this._count;
	}
	increment() {
		this._count++;
	}
}

// 定义在顶层
class IncreasingCounter {
	_count = 0;
	get value() {
		console.log('Getting the current value!');
		return this._count;
	}
	increment() {
		this._count++;
	}
}
```

### Object.getPrototypeOf()

> Object.getPrototypeOf() 方法返回指定对象的原型（内部[[Prototype]]属性的值，Object.getPrototypeOf 方法可以用来从子类上获取父类。

```javascript
Object.getPrototypeOf(ColorPoint) === Point;
// true,因此，可以使用这个方法判断，一个类是否继承了另一个类。
```

### super 关键字

> super 这个关键字，既可以当作函数使用，也可以当作对象使用。在这两种情况下，它的用法完全不同。

-   super 作为函数调用，代表父类的构造函数。注意，super 虽然代表了父类 A 的构造函数，但是返回的是子类 B 的实例，即 super 内部的 this 指的是 B 的实例，因此 super()在这里相当于 A.prototype.constructor.call(this)。

```javascript
class A {
	constructor() {
		console.log(new.target.name);
	}
}
class B extends A {
	constructor() {
		super();
	}
}
new A(); // A
new B(); // B
```

-   第二种情况，super 作为对象时，在普通方法中，指向父类的原型对象；在静态方法中，指向父类。

```javascript
class A {
	p() {
		return 2;
	}
}

class B extends A {
	constructor() {
		super();
		console.log(super.p()); // 2
	}
}

let b = new B();

// 这里需要注意，由于super指向父类的原型对象，所以定义在父类实例上的方法或属性，是无法通过super调用的。
class A {
	constructor() {
		this.p = 2;
	}
}

class B extends A {
	get m() {
		return super.p;
	}
}

let b = new B();
b.m; // undefined

// ES6 规定，在子类普通方法中通过super调用父类的方法时，方法内部的this指向当前的子类实例。
class A {
	constructor() {
		this.x = 1;
	}
	print() {
		console.log(this.x);
	}
}

class B extends A {
	constructor() {
		super();
		this.x = 2;
	}
	m() {
		super.print(); // 实际上执行的是super.print.call(this)
	}
}

let b = new B();
b.m(); // 2

// 由于this指向子类实例，所以如果通过super对某个属性赋值，这时super就是this，赋值的属性会变成子类实例的属性。

class A {
	constructor() {
		this.x = 1;
	}
}

class B extends A {
	constructor() {
		super();
		this.x = 2;
		super.x = 3;
		console.log(super.x); // undefined
		console.log(this.x); // 3
	}
}

let b = new B();

// 如果super作为对象，用在静态方法之中，这时super将指向父类，而不是父类的原型对象。

class Parent {
	static myMethod(msg) {
		console.log('static', msg);
	}

	myMethod(msg) {
		console.log('instance', msg);
	}
}

class Child extends Parent {
	static myMethod(msg) {
		super.myMethod(msg);
	}

	myMethod(msg) {
		super.myMethod(msg);
	}
}

Child.myMethod(1); // static 1

var child = new Child();
child.myMethod(2); // instance 2

// 另外，在子类的静态方法中通过super调用父类的方法时，方法内部的this指向当前的子类，而不是子类的实例。

class A {
	constructor() {
		this.x = 1;
	}
	static print() {
		console.log(this.x);
	}
}

class B extends A {
	constructor() {
		super();
		this.x = 2;
	}
	static m() {
		super.print();
	}
}

B.x = 3;
B.m(); // 3
```

### 类的 prototype 属性和**proto**属性

> 大多数浏览器的 ES5 实现之中，每一个对象都有**proto**属性，指向对应的构造函数的 prototype 属性。Class 作为构造函数的语法糖，同时有 prototype 属性和**proto**属性，因此同时存在两条继承链。

-   子类的**proto**属性，表示构造函数的继承，总是指向父类。
-   子类 prototype 属性的**proto**属性，表示方法的继承，总是指向父类的 prototype 属性。

```javascript
class A {}

class B extends A {}

B.__proto__ === A; // true
B.prototype.__proto__ === A.prototype; // true

// 类的继承是按照下面的模式实现的。
class A {}

class B {}

// B 的实例继承 A 的实例
Object.setPrototypeOf(B.prototype, A.prototype);

// B 继承 A 的静态属性
Object.setPrototypeOf(B, A);

const b = new B();

// Object.setPrototypeOf方法的实现

Object.setPrototypeOf = function (obj, proto) {
	obj.__proto__ = proto;
	return obj;
};


B.prototype = Object.create(A.prototype);
// 等同于
B.prototype.__proto__ = A.prototype;


```
