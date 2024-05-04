export type RunResult<T> =
  | {
      success: true;
      data: T;
    }
  | { success: false };

export function run<T>(func: () => T): RunResult<T> {
  try {
    return { success: true, data: func() };
  } catch (error) {
    console.error(error);
    // 上报监控
    // monitorSDK.reportJsError(error as Error);
    return { success: false };
  }
}
