## React v17.0.1 版本

> 本次使用的 React 版本为 v17 版本，
> 一、React 更新的方式有三种：
> （1）ReactDOM.render() || hydrate（ReactDOMServer 渲染）
> （2）setState
> （3）forceUpdate

### ReactDOM.render

> 在提供的 container 里渲染一个 React 元素，并返回对该组件的引用（或者针对无状态组件返回 null）。如果提供了可选的回调函数，该回调将在组件被渲染或更新之后被执行。

```javascript
// ReactDOM.render(element, container[, callback])
ReactDOM.render(<App />, document.getElementById('root'));
```

### render 方法

> 位于 packages/react-dom/src/client/ReactDOMLegacy.js 中

```javascript
export function render(element: React$Element<any>, container: Container, callback: ?Function) {
	// 判断container是否为有效的DOM节点。
	invariant(isValidContainer(container), 'Target container is not a DOM element.');
	// 返回legacyRenderSubtreeIntoContainer方法
	// 第一个参数为parentComponent，父组件因为是初次创建所以为null
	// 第二个参数为children，传入的ReactElement
	// 第三个参数为container，渲染React的DOM容器
	// 第四个参数为forceHydrate， 判断是否需要协调，在服务端渲染的情况下已渲染的DOM结构是类似的因此可以在对比后进行复用。在服务端渲染的情况下使用ReactDOM.hydrate()与 render() 相同只是forceHydrate会标记为true。
	// 第五个参数为callback，渲染完成后的回调函数
	return legacyRenderSubtreeIntoContainer(null, element, container, false, callback);
}
```

### legacyRenderSubtreeIntoContainer 方法

> 位于 packages/react-dom/src/client/ReactDOMLegacy.js 中

```javascript
function legacyRenderSubtreeIntoContainer(
	parentComponent: ?React$Component<any, any>,
	children: ReactNodeList,
	container: Container,
	forceHydrate: boolean,
	callback: ?Function
) {
	// TODO: Without `any` type, Flow says "Property cannot be accessed on any
	// member of intersection type." Whyyyyyy.
	let root: RootType = (container._reactRootContainer: any);
	let fiberRoot;
	// 判断是否为初次渲染，如果是就创建root并将root._internalRoot赋值给fiberRoot同时封装callback回调，然后调用unbatchedUpdates立即更新子节点。
	if (!root) {
		// Initial mount, 初次渲染创建FiberRoot
		root = container._reactRootContainer = legacyCreateRootFromDOMContainer(container, forceHydrate);
		fiberRoot = root._internalRoot; // 控制台输入 document.querySelector('#root')._reactRootContainer 查看
		if (typeof callback === 'function') {
			const originalCallback = callback;
			callback = function () {
				const instance = getPublicRootInstance(fiberRoot);
				originalCallback.call(instance);
			};
		}
		// Initial mount should not be batched.
		unbatchedUpdates(() => {
			updateContainer(children, fiberRoot, parentComponent, callback);
		});
	} else {
		// 如果不是第一次渲染则进入正常的updateContainer流程。
		fiberRoot = root._internalRoot;
		if (typeof callback === 'function') {
			const originalCallback = callback;
			callback = function () {
				const instance = getPublicRootInstance(fiberRoot);
				originalCallback.call(instance);
			};
		}
		// Update
		updateContainer(children, fiberRoot, parentComponent, callback);
	}
	// 最后getPublicRootInstance(fiberRoot)返回公开的 Root 实例对象。
	return getPublicRootInstance(fiberRoot);
}
```

### legacyCreateRootFromDOMContainer 方法

> 位于 packages/react-dom/src/client/ReactDOMLegacy.js 中

```javascript
// 主要是判断是否为服务端渲染，如果是的话就会复用存在的dom节点进行协调（reconciliation）提高性能，如果不是则会清空container中的子元素，最后传入container和shouldHydrate返回createLegacyRoot函数。
function legacyCreateRootFromDOMContainer(container: Container, forceHydrate: boolean): RootType {
	const shouldHydrate = forceHydrate || shouldHydrateDueToLegacyHeuristic(container);
	// First clear any existing content.
	if (!shouldHydrate) {
		let warned = false;
		let rootSibling;
		while ((rootSibling = container.lastChild)) {
			container.removeChild(rootSibling);
		}
	}

	return createLegacyRoot(
		container,
		shouldHydrate
			? {
					hydrate: true,
			  }
			: undefined
	);
}
```

### createLegacyRoot 方法

> 位于 packages/react-dom/src/client/ReactDOMRoot.js 中

```javascript
// 返回了一个ReactDOMBlockingRoot实例，这里传入了LegacyRoot = 0 代表着现在使用的同步渲染模式，是为了后续的Concurrent可中断渲染模式做准备。
export function createLegacyRoot(container: Container, options?: RootOptions): RootType {
	return new ReactDOMBlockingRoot(container, LegacyRoot, options);
}
```

### ReactDOMBlockingRoot 方法

> 位于 packages/react-dom/src/client/ReactDOMRoot.js 中

```javascript
// 将createRootImpl函数的返回（FiberRoot）挂载到实例的_internalRoot上
function ReactDOMBlockingRoot(container: Container, tag: RootTag, options: void | RootOptions) {
	this._internalRoot = createRootImpl(container, tag, options);
}
```

### createRootImpl 方法

> 位于 packages/react-dom/src/client/ReactDOMRoot.js 中

```javascript
// 执行createContainer拿到FiberRootNode并赋值给root，再通过markContainerAsRoot将RootFiber挂载到container上。
function createRootImpl(container: Container, tag: RootTag, options: void | RootOptions) {
	// Tag is either LegacyRoot or Concurrent Root
	const hydrate = options != null && options.hydrate === true;
	const hydrationCallbacks = (options != null && options.hydrationOptions) || null;
	const mutableSources =
		(options != null && options.hydrationOptions != null && options.hydrationOptions.mutableSources) || null;
	// 拿到FiberRootNode
	const root = createContainer(container, tag, hydrate, hydrationCallbacks);
	// 将FiberRootNode挂载到container
	markContainerAsRoot(root.current, container);

	const rootContainerElement = container.nodeType === COMMENT_NODE ? container.parentNode : container;
	listenToAllSupportedEvents(rootContainerElement);

	if (mutableSources) {
		for (let i = 0; i < mutableSources.length; i++) {
			const mutableSource = mutableSources[i];
			registerMutableSourceForHydration(root, mutableSource);
		}
	}

	return root;
}
```

### createContainer 方法

> 位于 packages/react-reconciler/src/ReactFiberReconciler.new.js 中

```javascript
export function createContainer(
	containerInfo: Container,
	tag: RootTag,
	hydrate: boolean,
	hydrationCallbacks: null | SuspenseHydrationCallbacks
): OpaqueRoot {
	return createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks);
}
```

### createFiberRoot 方法

> 位于 packages/react-reconciler/src/ReactFiberRoot.new.js 中

```javascript
// 新建FiberRoot对象并赋值给root，初始化Fiber(通常叫做RootFiber)通过root.current = uninitializedFiber和uninitializedFiber.stateNode = root将两者联系起来。
//执行initializeUpdateQueue(uninitializedFiber)创建一个更新队列，挂载fiber.updateQueue下面,最后将root返回

export function createFiberRoot(
	containerInfo: any,
	tag: RootTag,
	hydrate: boolean,
	hydrationCallbacks: null | SuspenseHydrationCallbacks
): FiberRoot {
	// FiberRootNode内部创建了许多属性
	const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
	if (enableSuspenseCallback) {
		root.hydrationCallbacks = hydrationCallbacks;
	}

	// Cyclic construction. This cheats the type system right now because
	// stateNode is any.
	// RootFiber初始化
	const uninitializedFiber = createHostRootFiber(tag);
	root.current = uninitializedFiber;
	uninitializedFiber.stateNode = root;

	initializeUpdateQueue(uninitializedFiber);

	return root;
}
```

## FiberRoot RootFiber 和 updateQueue

> ReactDOM.render 主要创建了三个对象 FiberRooat、RootFiber 和 Updatequeue 下面我们这对这三个对象进行分析

### FiberRoot

> FiberRoot 方法位于 packages/react-reconciler/src/ReactFiberRoot.new.js

```javascript
// 作用:整个应用的起点,包含应用挂载的目标节点,记录整个应用更新过程的各种信息
function FiberRootNode(containerInfo, tag, hydrate) {
	this.tag = tag;
	// root节点，render方法接收的第二个参数 document.querySelector('#root')
	this.containerInfo = containerInfo;
	this.pendingChildren = null;
	// 当前应用对应的Fiber对象，是Root Fiber
	// current:Fiber对象 对应的是 root 节点，即整个应用根对象
	this.current = null;
	this.pingCache = null;
	this.finishedWork = null;
	this.timeoutHandle = noTimeout;
	// 顶层context对象，只有主动调用renderSubTreeIntoContainer时才会被调用
	this.context = null;
	this.pendingContext = null;
	this.hydrate = hydrate;
	this.callbackNode = null;
	this.callbackPriority = NoLanePriority;
	this.eventTimes = createLaneMap(NoLanes);
	this.expirationTimes = createLaneMap(NoTimestamp);

	this.pendingLanes = NoLanes;
	this.suspendedLanes = NoLanes;
	this.pingedLanes = NoLanes;
	this.expiredLanes = NoLanes;
	this.mutableReadLanes = NoLanes;
	this.finishedLanes = NoLanes;

	this.entangledLanes = NoLanes;
	this.entanglements = createLaneMap(NoLanes);

	if (supportsHydration) {
		this.mutableSourceEagerHydrationData = null;
	}

	if (enableSchedulerTracing) {
		this.interactionThreadID = unstable_getThreadID();
		this.memoizedInteractions = new Set();
		this.pendingInteractionMap = new Map();
	}
	if (enableSuspenseCallback) {
		this.hydrationCallbacks = null;
	}
}
```

### RootFiber

> RootFiber 初始化于 const uninitializedFiber = createHostRootFiber(tag) 通过 createFiber 返回 FiberNode 的实例

```javascript
export function createFiberRoot(
	containerInfo: any,
	tag: RootTag,
	hydrate: boolean,
	hydrationCallbacks: null | SuspenseHydrationCallbacks
): FiberRoot {
	const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
	if (enableSuspenseCallback) {
		root.hydrationCallbacks = hydrationCallbacks;
	}

	// Cyclic construction. This cheats the type system right now because
	// stateNode is any.
	const uninitializedFiber = createHostRootFiber(tag);
	root.current = uninitializedFiber;
	uninitializedFiber.stateNode = root;

	initializeUpdateQueue(uninitializedFiber);

	return root;
}

export function createHostRootFiber(tag: RootTag): Fiber {
	let mode;
	if (tag === ConcurrentRoot) {
		mode = ConcurrentMode | BlockingMode | StrictMode;
	} else if (tag === BlockingRoot) {
		mode = BlockingMode | StrictMode;
	} else {
		mode = NoMode;
	}

	if (enableProfilerTimer && isDevToolsPresent) {
		// Always collect profile timings when DevTools are present.
		// This enables DevTools to start capturing timing at any point–
		// Without some nodes in the tree having empty base times.
		mode |= ProfileMode;
	}

	return createFiber(HostRoot, null, null, mode);
}

const createFiber = function (tag: WorkTag, pendingProps: mixed, key: null | string, mode: TypeOfMode): Fiber {
	// $FlowFixMe: the shapes are exact here but Flow doesn't like constructors
	return new FiberNode(tag, pendingProps, key, mode);
};

function FiberNode(tag: WorkTag, pendingProps: mixed, key: null | string, mode: TypeOfMode) {
	// Instance
	// 标记不同的组件类型
	this.tag = tag;
	// ReactElement里面的key
	this.key = key;
	// ReactElement.type，也就是我们调用`createElement`的第一个参数
	this.elementType = null;
	// 异步组件lazy component resolved之后返回的内容，一般是`function`或者`class`组件
	this.type = null;
	// 对应节点的实例，比如类组件就是class的实例，如果是dom组件就是dom实例，如果是function component就没有实例这里为空
	this.stateNode = null;

	// Fiber
	// Fiber Fiber是个链表通过child和Sibling连接，遍历的时候先遍历child如果没有子元素了则访问return回到上级查询是否有sibling
	// 指向他在Fiber节点树中的‘parent’，用来在处理完这个节点之后向上返回
	this.return = null;
	// 指向第一个子节点
	this.child = null;
	// 指向自己的兄弟节点，兄弟节点的return指向同一个副节点
	this.sibling = null;
	this.index = 0;

	this.ref = null;
	// 新的变动带来的新的props
	this.pendingProps = pendingProps;
	// 上次渲染完成后的props
	this.memoizedProps = null;
	// 该Fiber对应的组件产生的update会存放在这个队列（比如setState和forceUpdate创建的更新）
	this.updateQueue = null;
	// 上一次的state
	this.memoizedState = null;
	this.dependencies = null;

	this.mode = mode;

	// Effects
	// 用来记录副作用
	this.flags = NoFlags;
	// 单链表用来快速查找下一个side effect
	this.nextEffect = null;

	// 子树中第一个side effect
	this.firstEffect = null;
	// 子树中最后一个side effect
	this.lastEffect = null;
	this.subtreeFlags = NoFlags;
	this.deletions = null;

	this.lanes = NoLanes;
	this.childLanes = NoLanes;

	this.alternate = null;

	if (enableProfilerTimer) {
		// Note: The following is done to avoid a v8 performance cliff.
		//
		// Initializing the fields below to smis and later updating them with
		// double values will cause Fibers to end up having separate shapes.
		// This behavior/bug has something to do with Object.preventExtension().
		// Fortunately this only impacts DEV builds.
		// Unfortunately it makes React unusably slow for some applications.
		// To work around this, initialize the fields below with doubles.
		//
		// Learn more about this here:
		// https://github.com/facebook/react/issues/14365
		// https://bugs.chromium.org/p/v8/issues/detail?id=8538
		this.actualDuration = Number.NaN;
		this.actualStartTime = Number.NaN;
		this.selfBaseDuration = Number.NaN;
		this.treeBaseDuration = Number.NaN;

		// It's okay to replace the initial doubles with smis after initialization.
		// This won't trigger the performance cliff mentioned above,
		// and it simplifies other profiler code (including DevTools).
		this.actualDuration = 0;
		this.actualStartTime = -1;
		this.selfBaseDuration = 0;
		this.treeBaseDuration = 0;
	}
}
```

### updateQueue

```javascript
export function createFiberRoot(
	containerInfo: any,
	tag: RootTag,
	hydrate: boolean,
	hydrationCallbacks: null | SuspenseHydrationCallbacks
): FiberRoot {
	const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
	if (enableSuspenseCallback) {
		root.hydrationCallbacks = hydrationCallbacks;
	}

	// Cyclic construction. This cheats the type system right now because
	// stateNode is any.
	const uninitializedFiber = createHostRootFiber(tag);
	root.current = uninitializedFiber;
	uninitializedFiber.stateNode = root;

	initializeUpdateQueue(uninitializedFiber);

	return root;
}

export function initializeUpdateQueue<State>(fiber: Fiber): void {
	const queue: UpdateQueue<State> = {
		// 每次操作完更新阿之后的state
		baseState: fiber.memoizedState,
		// 队列中的第一个`Update`
		firstBaseUpdate: null,
		// 队列中的最后一个`Update`
		lastBaseUpdate: null,
		shared: {
			pending: null,
		},
		effects: null,
	};
	fiber.updateQueue = queue;
}
```
### 流程图
![图片]("https://user-gold-cdn.xitu.io/2020/5/28/1725bc4421ad0df2?imageslim")



#### 参考文献
> https://juejin.cn/post/6844904174002372616#heading-7
