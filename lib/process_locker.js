"use strict";

/**
 *
 * Check If Cron task is already running for the process. <br><br>
 *
 * @module lib/process_locker
 *
 */

// Load Shell Library
const shell = require('shelljs');
shell.config.silent = true;

//All Module Requires.
const rootPrefix = '..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
;

/**
 * constructor
 *
 * @constructor
 */
const ProcessLockerKlass = function () {
  const oThis = this;
};

ProcessLockerKlass.prototype = {

  /**
   * Check If process is already running
   *
   * @param {Object} params - parameters
   * @param {String} params.process_title - Title of the running process
   *
   * @return {Promise<Result>} - On success, data.value has value. On failure, error details returned.
   */
  canStartProcess: function (params) {

    const oThis = this
      , processTitle = params.process_title
    ;

    var processID = (shell.exec("ps -ef | grep '" + processTitle + "' | grep -v grep | awk '{print $2}'") || {}).stdout;
    if (processID == "") {
      // Title for Process
      process.title = processTitle;
      // Not other process with this name
      return Promise.resolve(responseHelper.successWithData({}));
    }

    logger.info("* Process stopped:", processTitle, " Process already running with id ", processID);
    process.exit(0);
  },

  /**
   * Time Interval after which process has to be stopped
   *
   * @param {Object} params - parameters
   * @param {String} params.time_in_minutes - Time Interval after which process has to be terminated
   *
   */
  endAfterTime: function (params) {
    const oThis = this
      , timeInMinutes = params.time_in_minutes * 60
    ;

    setInterval(function () {
        logger.info('ending the process');
        process.emit('SIGINT');
      }, timeInMinutes * 1000);
  }

}

module.exports = ProcessLockerKlass;
