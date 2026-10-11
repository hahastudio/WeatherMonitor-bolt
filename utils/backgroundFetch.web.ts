// Web stub for react-native-background-fetch

export default class BackgroundFetch {
  static get STATUS_RESTRICTED() {
    return 0;
  }
  static get STATUS_DENIED() {
    return 1;
  }
  static get STATUS_AVAILABLE() {
    return 2;
  }

  static get NETWORK_TYPE_NONE() {
    return 0;
  }
  static get NETWORK_TYPE_ANY() {
    return 1;
  }
  static get NETWORK_TYPE_UNMETERED() {
    return 2;
  }
  static get NETWORK_TYPE_NOT_ROAMING() {
    return 3;
  }
  static get NETWORK_TYPE_CELLULAR() {
    return 4;
  }

  static configure(
    _config?: unknown,
    _onEvent?: (taskId: string) => void,
    _onTimeout?: (taskId: string) => void,
  ): Promise<number> {
    return Promise.resolve(0);
  }

  static scheduleTask(_config?: unknown): Promise<boolean> {
    return Promise.resolve(true);
  }

  static registerHeadlessTask(_task: (event: unknown) => Promise<void>): void {}

  static start(): Promise<number> {
    return Promise.resolve(0);
  }

  static stop(_taskId?: string | null): Promise<boolean> {
    return Promise.resolve(true);
  }

  static finish(_taskId: string): void {}

  static status(callback?: (status: number) => void): Promise<number> {
    if (typeof callback === 'function') {
      callback(0);
    }
    return Promise.resolve(0);
  }
}
