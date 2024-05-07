// 事件发布与订阅 统一管理中心 用于跨组件通信

/** 需要监听的事件 */
interface IEventListeners {
  scroll: (scrollTop: number) => void;
  scrollend: () => void;
  scrolldisable: () => void;
  scrollenable: () => void;
  /** 单独刷新弹窗数据 */
  refreshpopup: () => void;
  /** 下拉刷新开始 */
  pulldownrefreshstart: () => void;
  /** 刷新开始（被动刷新、下拉刷新均会触发） */
  refreshstart: () => void;
  /** 全局曝光事件 */
  exposure: (id: string) => void;
  /** 首屏渲染完成 */
  mounted: () => void;
  /** 页面根组件实例构造完成 */
  constructed: () => void;
  beforenativeclose: () => void;
  beforepageclose: () => boolean;
}

/** 事件回调的配置项 */
interface IEventListenerOptions {
  immediate?: boolean;
}

/** 事件的格式 约定事件名和通信的数据 */
interface IEvent {
  name: string;
  payload: unknown[];
}

/** 核心实现 */
class EventEmitter {
  // 注意这里定义成 map 的结构，以及类型定义的写法
  private listeners = new Map<
    keyof IEventListeners,
    Set<IEventListeners[keyof IEventListeners]>
  >();
  private latestEvents: IEvent[] = [];

  // 注册监听
  public on<K extends keyof IEventListeners>(
    name: K,
    listener: IEventListeners[K],
    { immediate }: IEventListenerOptions = {}
  ) {
    const listeners = this.getListeners(name);
    listeners.add(listener);

    // 立即触发最近一次事件，此时返回值无效
    if (immediate) {
      this.emitLatestEvent(name, listener);
    }

    return () => listeners.delete(listener);
  }

  // 注册监听 只监听一次
  public once<K extends keyof IEventListeners>(
    name: K,
    listener: IEventListeners[K],
    { immediate }: IEventListenerOptions = {}
  ) {
    const listeners = this.getListeners(name);
    const wrapper = (...payload: Parameters<typeof listener>) => {
      listeners.delete(wrapper);
      // @ts-expect-error: hack arguments type
      return listener(...payload);
    };
    listeners.add(wrapper);

    // 立即触发最近一次事件，此时返回值无效
    if (immediate) {
      this.emitLatestEvent(name, listener);
    }

    return () => listeners.delete(wrapper);
  }

  // 发送事件，把对应事件的所有 listener 都执行一遍，并返回结果数组
  public emit<K extends keyof IEventListeners>(
    name: K,
    ...payload: Parameters<IEventListeners[K]>
  ) {
    const listeners = this.getListeners(name);
    const results: ReturnType<IEventListeners[K]>[] = [];

    // console.log('[runtime-event-emitter] emit ' + name + ', listeners.length=' + listeners.size);

    listeners.forEach((listener) => {
      // @ts-expect-error: hack arguments type
      const result = run(() => listener(...payload));

      if (result.success) {
        results.push(result.data);
      }
    });

    const latestEvent = this.latestEvents.find((it) => it.name === name);
    if (latestEvent) {
      latestEvent.payload = payload;
    } else {
      this.latestEvents.push({ name, payload });
    }

    return results;
  }

  // 执行一次指定的事件，用最近一次触发的 payload 参数，执行指定传入的回调
  private emitLatestEvent<K extends keyof IEventListeners>(
    name: K,
    listener: IEventListeners[K]
  ) {
    const latestEvent = this.latestEvents.find((it) => it.name === name);

    if (latestEvent) {
      // @ts-expect-error: hack arguments type
      run(() => listener(...latestEvent.payload));
    }
  }

  // 查询当前事件有哪些监听回调
  private getListeners<K extends keyof IEventListeners>(name: K) {
    let listeners = this.listeners.get(name);
    if (!listeners) {
      listeners = new Set<IEventListeners[K]>();
      this.listeners.set(name, listeners);
    }
    return listeners;
  }
}
