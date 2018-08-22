'use strict';


const rootPrefix = '..'
    ,  bigNumber = require('bignumber.js')
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
  },

  math: function (lvalue, operator, rvalue) {

    if (!rvalue || !lvalue) {
      return '';
    }

    lvalue = new bigNumber(lvalue.toString());
    rvalue = new bigNumber(rvalue.toString());

    var value =  {
      "+": lvalue.plus(rvalue),
      "-": lvalue.minus(rvalue),
      "*": lvalue.times(rvalue),
      "/": lvalue.dividedBy(rvalue),
      "%": lvalue.modulo(rvalue)
    }[operator];

    if (isNaN(value)){
      return '0';
    }else{
      return new bigNumber(value.toString()).toFormat(5);
    }
  }
};

module.exports = new Base();