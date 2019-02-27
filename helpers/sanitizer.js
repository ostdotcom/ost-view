'use strict';
/**
 * Sanitize request parameters
 *
 * @module helpers/sanitizer
 */

const sanitizeHtml = require('sanitize-html');

class SanitizeRecursively {
  constructor() {}

  /**
   * Recursively sanitize
   *
   * @param params
   *
   * @returns {*}
   *
   * @private
   */
  sanitize_params_recursively(params) {
    const oThis = this;

    if (typeof params === 'string') {
      params = oThis._sanitizeString(params);
    } else if (params instanceof Array) {
      for (let i in params) {
        params[i] = oThis.sanitize_params_recursively(params[i]);
      }
    } else if (params instanceof Object) {
      Object.keys(params).forEach(function(key) {
        params[key] = oThis.sanitize_params_recursively(params[key]);
      });
    } else if (!params) {
      params = oThis._sanitizeString(params);
    } else {
      console.log('Invalid params type: ', typeof params);
      params = '';
    }
    return params;
  }

  /**
   * Sanitize string
   *
   * @param str
   *
   * @private
   */
  _sanitizeString(str) {
    return sanitizeHtml(str, { allowedTags: [] });
  }
}

const sanitizeRecursively = new SanitizeRecursively();

class Sanitizer {
  constructor() {}

  /**
   * Sanitize Request body and request query params
   *
   * @param req
   * @param res
   * @param next
   *
   * @returns {*}
   */
  sanitizeBodyAndQuery(req, res, next) {
    req.body = sanitizeRecursively.sanitize_params_recursively(req.body);
    req.query = sanitizeRecursively.sanitize_params_recursively(req.query);
    return next();
  }

  /**
   * Sanitize dynamic params in URL
   *
   * @param req
   * @param res
   * @param next
   * @returns {*}
   */
  sanitizeDynamicUrlParams(req, res, next) {
    req.params = sanitizeRecursively.sanitize_params_recursively(req.params);
    return next();
  }
}

module.exports = new Sanitizer();
