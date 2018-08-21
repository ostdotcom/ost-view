'use strict';


const rootPrefix = '..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
;

const Base = function () {
  
};

Base.prototype = {
  isMainSubEnvironment: function () {
    return coreConstants.VIEW_SUB_ENVIRONMENT == 'main' ? true : false;
  },

  isProductionEnvironment: function () {
    return coreConstants.VIEW_ENVIRONMENT == 'production' ? true : false;
  }
};

module.exports = new Base();