'use strict';

/**
 * Restful API response formatter
 *
 * @module lib/formatter/response
 */

const rootPrefix = '../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  baseRoutes = require(rootPrefix + '/lib/globalConstant/baseRoutes'),
  path = require('path');

function Result(data, errCode, errMsg) {
  this.success = typeof errCode === 'undefined';

  this.data = data || {};

  if (!this.success) {
    this.err = {
      code: errCode,
      msg: errMsg
    };
  }

  // Check if response has success
  this.isSuccess = function() {
    return this.success;
  };

  // Check if response is not success. More often not success is checked, so adding a method.
  this.isFailure = function() {
    return !this.isSuccess();
  };

  // Format data to hash
  this.toHash = function() {
    var s = {};
    if (this.success) {
      s.success = true;
      s.data = this.data;
    } else {
      s.success = false;
      if (this.data instanceof Object && Object.keys(this.data).length > 0) {
        //Error with data case.
        s.data = this.data;
      }
      s.err = this.err;
    }

    return s;
  };

  // Render final error or success response
  this.renderResponse = function(res, status, contentType) {
    status = status || 200;
    res.status(status);

    if (contentType != 'application/json') {
      //logger.log("#renderResponse resultType", status, constants[this.data.result_type], this.data);
      if (this.err) {
        let meta = {
          baseUrlPrefix: coreConstants.BASE_URL_PREFIX,
          urlTemplates: baseRoutes.getAllUrls()
        };

        this.err.layout = 'errorPage';
        this.err.meta = meta;
        logger.log('#Error Response', this.err);
        return res.render('layouts/errorPage', this.err);
      }
      return res.render(this.data.template, this.data);
    }

    return res.json(this.toHash());
  };
}

/**
 * Response helper
 *
 * @constructor
 */
const ResponseHelper = function() {};

ResponseHelper.prototype = {
  /**
   * Generate success response object
   *
   * @param {Object} data - data to be formatted
   *
   * @returns {Object<Result>} - formatted success result
   */
  successWithData: function(data) {
    return new Result(data);
  },

  /**
   * Generate error response object
   *
   * @param {String} errCode - Error Code
   * @param {String} errMsg  - Error Message
   * @param {String} errPrefix - Error Prefix
   *
   * @returns {Object<Result>} - formatted error result
   */
  error: function(errCode, errMsg, errPrefix) {
    errCode = 'ostView(' + errCode + ')';

    console.error('### Error ### ' + errCode + ' ###');
    console.error('### Error MSG ### ' + errMsg + ' ###');
    console.error('### Error Details ### ' + errPrefix + ' ###');

    return new Result({}, errCode, errMsg);
  },

  /**
   * return true if the object passed is of Result class
   *
   * @param {object} obj - object to check instanceof
   *
   * @return {boolean}
   */
  isCustomResult: function(obj) {
    return obj instanceof Result;
  }
};

module.exports = new ResponseHelper();
