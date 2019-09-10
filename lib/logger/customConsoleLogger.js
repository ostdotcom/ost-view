/**
 * Custom console logger.
 *
 * @module logger/customConsoleLogger
 */

const getNamespace = require('continuation-local-storage').getNamespace,
  requestNamespace = getNamespace('ostViewNameSpace');

/**
 * Method to convert process hrTime to milliseconds.
 *
 * @param {number} hrTime: this is the time in hours
 *
 * @return {number}: returns time in milli seconds
 */
const timeInMilli = function(hrTime) {
  return hrTime[0] * 1000 + hrTime[1] / 1000000;
};

/**
 * Method to append request in each log line.
 *
 * @param {string} message
 */
const appendRequest = function(message) {
  let newMessage = '';
  if (requestNamespace) {
    if (requestNamespace.get('reqId')) {
      newMessage += '[' + requestNamespace.get('reqId') + ']';
    }
    if (requestNamespace.get('workerId')) {
      newMessage += '[Worker - ' + requestNamespace.get('workerId') + ']';
    }
    const hrTime = process.hrtime();
    newMessage += '[' + timeInMilli(hrTime) + ']';
  }
  newMessage += message;

  return newMessage;
};

/**
 * Class for custom console logger.
 *
 * @class CustomConsoleLoggerKlass
 */
class CustomConsoleLoggerKlass {
  /**
   * @ignore
   *
   * @constant {string}
   */
  static get STEP_PRE() {
    return '\n\x1b[34m';
  }

  /**
   * @ignore
   *
   * @constant {string}
   */
  static get WIN_PRE() {
    return '\x1b[32m';
  }

  /**
   * @ignore
   *
   * @constant {string}
   */
  static get WARN_PRE() {
    return '\x1b[43m';
  }

  /**
   * @ignore
   *
   * @constant {string}
   */
  static get INFO_PRE() {
    return '\x1b[33m';
  }

  /**
   * @ignore
   *
   * @constant {string}
   */
  static get ERR_PRE() {
    return '\x1b[31m';
  }

  /**
   * @ignore
   *
   * @constant {string}
   */
  static get NOTE_PRE() {
    return '\x1b[91m';
  }

  /**
   * @ignore
   *
   * @constant {string}
   */
  static get CONSOLE_RESET() {
    return '\x1b[0m';
  }

  /**
   * Log step.
   */
  step() {
    let args = [appendRequest(CustomConsoleLoggerKlass.STEP_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(CustomConsoleLoggerKlass.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  /**
   * Log info
   */
  info() {
    let args = [appendRequest(CustomConsoleLoggerKlass.INFO_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(CustomConsoleLoggerKlass.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  /**
   * Log error
   */
  error() {
    let args = [appendRequest(CustomConsoleLoggerKlass.ERR_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(CustomConsoleLoggerKlass.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  /**
   * Notify error through email
   */
  notify(code, msg, data, backtrace) {
    let args = [appendRequest(CustomConsoleLoggerKlass.NOTE_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(CustomConsoleLoggerKlass.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  /**
   * Log warn
   */
  warn() {
    let args = [appendRequest(CustomConsoleLoggerKlass.WARN_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(CustomConsoleLoggerKlass.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  /**
   * Log win - on done
   */
  win() {
    let args = [appendRequest(CustomConsoleLoggerKlass.WIN_PRE)];
    args = args.concat(Array.prototype.slice.call(arguments));
    args.push(CustomConsoleLoggerKlass.CONSOLE_RESET);
    console.log.apply(console, args);
  }

  /**
   * Log normal level
   */
  log() {
    console.log.apply(console, arguments);
  }

  // Method to log request started.
  requestStartLog(requestUrl, requestType) {
    const oThis = this;

    const date = new Date(),
      dateTime =
        date.getFullYear() +
        '-' +
        (date.getMonth() + 1) +
        '-' +
        date.getDate() +
        ' ' +
        date.getHours() +
        ':' +
        date.getMinutes() +
        ':' +
        date.getSeconds() +
        '.' +
        date.getMilliseconds(),
      message = "Started '" + requestType + "'  '" + requestUrl + "' at " + dateTime;

    oThis.info(message);
  }
}

module.exports = new CustomConsoleLoggerKlass();
