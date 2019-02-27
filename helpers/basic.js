'use strict';
/**
 * Basic helper functions
 *
 * @module helpers/basic
 */
const rootPrefix = '..',
  paramErrorConfig = require(rootPrefix + '/config/error/param'),
  bigNumber = require('bignumber.js'),
  generalErrorConfig = require(rootPrefix + '/config/error/general');

/**
 * Basic helper methods class
 *
 * @class
 */
class BasicHelperKlass {
  constructor() {}

  /**
   * Deep duplicate
   *
   * @param {Object} object: object to deep duplicate
   * @returns {Object}: returns deep duplicated object
   */
  deepDup(object) {
    return JSON.parse(JSON.stringify(object));
  }

  /**
   * Invert
   *
   * @param {Object} object: object to invert
   * @returns {Object}: returns the inverted object
   */
  invert(object) {
    let ret = {};
    for (let key in object) {
      ret[object[key]] = key;
    }
    return ret;
  }

  /**
   * Convert number to big number. Make sure it's a valid number
   *
   * @param {Number} number: number to be formatted
   *
   * @returns {BigNumber}
   */
  convertToBigNumber(number) {
    return number instanceof bigNumber ? number : new bigNumber(number);
  }

  /**
   * Get error config
   *
   * @returns {Object}
   */
  getErrorConfig() {
    return {
      param_error_config: paramErrorConfig,
      api_error_config: generalErrorConfig
    };
  }

  /**
   * Math library
   *
   * @param lvalue
   * @param operator
   * @param rvalue
   * @return {string}
   */
  math(lvalue, operator, rvalue) {
    if (!rvalue || !lvalue) {
      return '';
    }

    lvalue = new bigNumber(lvalue.toString());
    rvalue = new bigNumber(rvalue.toString());

    var value = {
      '+': lvalue.plus(rvalue),
      '-': lvalue.minus(rvalue),
      '*': lvalue.times(rvalue),
      '/': lvalue.dividedBy(rvalue),
      '%': lvalue.modulo(rvalue)
    }[operator];

    if (isNaN(value)) {
      return '0';
    } else {
      return new bigNumber(value.toString()).toFormat(5);
    }
  }
}

module.exports = new BasicHelperKlass();
