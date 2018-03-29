"use strict";

const rootPrefix = '..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const routeMethods = {

  performer: function(req, res, next, CallerKlass, errorCode) {

    try{

      const decodedParams = req.params;

      const callerObject = new CallerKlass(decodedParams);

      return callerObject.perform();

    } catch(err) {
      logger.notify(errorCode, 'Something went wrong', err);
      Promise.resolve(responseHelper.error(errorCode, 'Something went wrong'));
    }

  }

};

module.exports = routeMethods;