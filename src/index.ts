export function throttle(func: Function, waitTime: number) {
  let timeout: ReturnType<typeof setTimeout> | null;

  return function (this: any) {
    const context = this;
    const args = arguments;
    if (!timeout) {
      timeout = setTimeout(function () {
        timeout = null;
        func.apply(context, args);
      }, waitTime);
    }
  }
}