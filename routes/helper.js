'use strict';

const rootPrefix = '..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const InstanceComposer = OSTBase.InstanceComposer;

const routeMethods = {
  performer: function(req, res, next, GetterMethodName, errorCode) {
    try {
      Object.assign(req.params, req.query);

      const decodedParams = req.params;

      let configStrategy = coreConstants.CONFIG_STRATEGY,
        instanceComposer = new InstanceComposer(configStrategy),
        getterMethod = instanceComposer.getShadowedClassFor(coreConstants.icNameSpace, GetterMethodName);
        //Klass = getterMethod.apply(instanceComposer);

      const callerObject = new getterMethod(decodedParams);

      return callerObject.perform();
    } catch (err) {
      logger.notify(errorCode, 'Something went wrong', err);
      Promise.resolve(responseHelper.error(errorCode, 'Something went wrong'));
    }
  },

  validateXhrRequest: function(req, res) {
    if (!req.xhr) {
      responseHelper.error('NOT_FOUND', 'Resource not found').renderResponse(res, 404);
      return true;
    }
    return false;
  }
};

module.exports = routeMethods;
