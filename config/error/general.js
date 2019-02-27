'use strict';
/**
 * This file has the general error config.
 *
 * @module config/error/general
 */
const generalErrorConfig = {
  something_went_wrong: {
    http_code: '500',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong.'
  }
};

module.exports = generalErrorConfig;
