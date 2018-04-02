"use strict";

const rootPrefix = '..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

const routeMethods = {

  performer: function(req, res, next, CallerKlass, errorCode) {

    try{

      if (req.query.next_page_payload){
        req.params.page_payload = req.query.next_page_payload;
      }else if (req.query.prev_page_payload){
        req.params.page_payload = req.query.prev_page_payload;
      }
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