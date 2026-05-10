export class Logger {
  static info(message) {
    console.log(`\x1b[36m[INFO]\x1b[0m ${message}`);
  }

  static success(message) {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`);
  }

  static error(message) {
    console.log(`\x1b[31m[ERROR]\x1b[0m ${message}`);
  }

  static warning(message) {
    console.log(`\x1b[33m[WARNING]\x1b[0m ${message}`);
  }

  static module(name, message) {
    console.log(`\x1b[35m[${name}]\x1b[0m ${message}`);
  }

  static separator() {
    console.log('\x1b[90m' + '='.repeat(60) + '\x1b[0m');
  }
}
