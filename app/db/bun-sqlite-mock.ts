export class Database {
  constructor() {}
  exec() {}
  prepare() {
    return {
      get: () => undefined,
      all: () => [],
      run: () => ({ success: true }),
      values: () => [],
    };
  }
}
