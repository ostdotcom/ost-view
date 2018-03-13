"use strict";
/*
 * Custom Middleware for Express:
 *
 * Sets requests id to each request. This request id is later used for logging/debugging purpose.
 *
 */

const uuid = require('uuid');

module.exports = function(options) {
  return function(req, res, next) {
    req.id = options.worker_id + ":" + uuid.v4();
    next()
  }
};