const OSTBase = require('@ostdotcom/base');

const rootPrefix = '..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const InstanceComposer = OSTBase.InstanceComposer;

const routeMethods = {
  performer: function(req, res, next, GetterMethodName, errorCode) {
    try {
      Object.assign(req.params, req.query);

      const decodedParams = req.params;

      const configStrategy = coreConstants.CONFIG_STRATEGY,
        instanceComposer = new InstanceComposer(configStrategy),
        getterMethod = instanceComposer.getShadowedClassFor(coreConstants.icNameSpace, GetterMethodName);

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
