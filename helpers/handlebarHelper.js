const moment = require('moment'),
  bigNumber = require('bignumber.js'),
  web3 = require('web3');

const rootPrefix = '..',
  erc20Tokens = require(rootPrefix + '/lib/contractInteract/contractDecoder'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const feReplace = function(str) {
  return str.replace(/\{\{/g, '[[').replace(/\}\}/g, ']]');
};

let Helper = null;

module.exports = Helper = {
  decodeMethodFromInputData: function(inputData) {
    return erc20Tokens.decodeMethodFromInputData(inputData);
  },

  toJSON: function(object, replacer) {
    if (object) {
      return JSON.stringify(object, null, replacer);
    } else {
      return '';
    }
  },

  ifNotEmptyObject: function(object, options) {
    if (object && Object.keys(object).length > 0) {
      return options.fn(this);
    }
    return options.inverse(this);
  },

  toDate: function(timestamp) {
    if (timestamp) {
      const formattedDate = moment(timestamp * 1000)
        .utc()
        .format('MM/DD/YYYY h:mm:ss a z')
        .toUpperCase();
      return formattedDate;
    } else {
      return '';
    }
  },

  toTimeAgo: function(timestamp) {
    const formattedDate = moment(timestamp * 1000).fromNow();

    return formattedDate;
  },

  // math: function (lvalue, operator, rvalue) {
  //
  //   if (!rvalue || !lvalue) {
  //     return '';
  //   }
  //
  //   lvalue = new bigNumber(lvalue.toString());
  //   rvalue = new bigNumber(rvalue.toString());
  //
  //   var value =  {
  //     "+": lvalue.plus(rvalue),
  //     "-": lvalue.minus(rvalue),
  //     "*": lvalue.times(rvalue),
  //     "/": lvalue.dividedBy(rvalue),
  //     "%": lvalue.modulo(rvalue)
  //   }[operator];
  //
  //   if (isNaN(value)){
  //     return '0';
  //   }else{
  //     return new bigNumber(value.toString()).toFormat(5);
  //   }
  // },

  randomStr: function() {
    return Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '');
  },

  block: function(name) {
    var blocks = this._blocks,
      content = blocks && blocks[name];

    return content ? content.join('\n') : null;
  },

  contentFor: function(name, options) {
    var blocks = this._blocks || (this._blocks = {}),
      block = blocks[name] || (blocks[name] = []);

    block.push(options.fn(this));
  },

  bigNumber_toFromat: function(number_string, precision) {
    if (!number_string) {
      return '';
    } else {
      if (!precision || typeof precision == 'object') {
        precision = 0;
      }
      return new bigNumber(number_string.toString()).toFormat(precision);
    }
  },

  displayToFixed: function(number, precision) {
    if (number) {
      if (!precision || typeof precision == 'object') {
        precision = 0;
      }
      let sNumber = number.toString();
      let bn = new bigNumber(sNumber);
      let val = bn.toFixed(precision);

      return Helper.bigNumber_toFromat(val, precision);
    } else {
      return '';
    }
  },

  dictionary_dataValue: function(hashKey, hash, requiredValueKey) {
    if (hash) {
      const hashData = hash[hashKey];
      if (hashData) {
        return hashData[requiredValueKey];
      }
    }

    return '';
  },

  getOstBalance: function(tokens, addresssContract, contractArray) {
    var precision = Number(precision);
    if (isNaN(precision) || !precision) {
      precision = 5;
    }

    if (contractArray[addresssContract]) {
      var price = contractArray[addresssContract].conversion_rate,
        ostValue = new bigNumber(tokens).div(new bigNumber(price)),
        bigNumberDivisor = new bigNumber(10).toPower(18),
        ostValueToEth = ostValue.dividedBy(bigNumberDivisor),
        bigNumberValue = ostValueToEth.toFormat(precision);
      return bigNumberValue;
    } else {
      return '';
    }
  },

  /**
   * OST Currency Symbol
   *
   * @return {String}
   */
  ostCurrencySymbol: function(withoutFormatting) {
    if (coreConstants.VIEW_SUB_ENVIRONMENT == coreConstants.VIEW_SUB_ENVIRONMENT_MAIN) {
      return 'OST';
    } else {
      if (withoutFormatting) {
        return 'OST ⍺';
      } else {
        return 'OST <span class="text-lowercase">⍺</span>';
      }
    }
  },

  getBtBalance: function(amount, precision) {
    precision = Number(precision);
    if (isNaN(precision) || !precision) {
      precision = 5;
    }
    if (amount) {
      var bigNumberAmount = new bigNumber(amount),
        bigNumberDivisor = new bigNumber(10).toPower(18);
      return bigNumberAmount
        .div(bigNumberDivisor)
        .toFormat(precision)
        .toString(10);
    } else {
      return new bigNumber(0).toFormat(precision).toString(10);
    }
  },

  toOSTAlpha: function(amount, precision) {
    precision = Number(precision);
    if (isNaN(precision) || !precision) {
      precision = 5;
    }
    if (amount) {
      var bigNumberAmount = new bigNumber(amount),
        bigNumberDivisor = new bigNumber(10).toPower(18);
      return bigNumberAmount
        .div(bigNumberDivisor)
        .toFormat(precision)
        .toString(10);
    } else {
      return new bigNumber(0).toFormat(precision).toString(10);
    }
  },

  toOstGasPrice: function(amount) {
    if (amount) {
      var bigNumberAmount = new bigNumber(amount);
      var bigNumberDivisor = new bigNumber(10).toPower(18);
      return bigNumberAmount.div(bigNumberDivisor).toString(10);
    } else {
      return new bigNumber(0).toString(10);
    }
  },

  toGWei: function(amount) {
    if (amount) {
      var bigNumberAmount = new bigNumber(amount);
      var bigNumberDivisor = new bigNumber(10).toPower(9);
      return bigNumberAmount.div(bigNumberDivisor).toString(10);
    } else {
      return new bigNumber(0).toString(10);
    }
  },

  getFEURLTemplate: function(str, options) {
    if (str) {
      return feReplace(str);
    }
    return '';
  },

  getFEAddress: function(str, fromTo) {
    if (str) {
      var address = 'address';
      str = feReplace(str);
      return str.replace('[[address]]', '[[' + fromTo + 'Address]]');
    }
    return '';
  },

  getFETransactionToAddress: function(str) {
    if (str) {
      var address = 'address';
      str = feReplace(str);
      return str.replace('[[address]]', '[[getTransactionToAddress contractAddress toAddress]]');
    }
    return '';
  },

  fromWei: function(amount, precision, format) {
    if (amount) {
      var precision = precision || 10;
      return web3.utils.fromWei(amount, format).toString(precision);
    } else {
      return 0;
    }
  },

  when: function(operand_1, operator, operand_2, options) {
    var operators = {
        '==': function(l, r) {
          return l == r;
        },
        '!=': function(l, r) {
          return l != r;
        },
        '>': function(l, r) {
          return Number(l) > Number(r);
        },
        '<': function(l, r) {
          return Number(l) < Number(r);
        },
        '||': function(l, r) {
          return l || r;
        },
        '&&': function(l, r) {
          return l && r;
        },
        '%': function(l, r) {
          return l % r === 0;
        }
      },
      result = operators[operator](operand_1, operand_2);

    if (result) return options.fn(this);
    else return options.inverse(this);
  },

  viewSubEnvMain: function() {
    return coreConstants.VIEW_SUB_ENVIRONMENT_MAIN;
  },

  viewSubEnvSandbox: function() {
    return coreConstants.VIEW_SUB_ENVIRONMENT_SANDBOX;
  },

  viewSubEnv: function() {
    return coreConstants.VIEW_SUB_ENVIRONMENT;
  },

  isViewSubEnvMain: function() {
    return coreConstants.IS_VIEW_SUB_ENVIRONMENT_MAIN;
  },

  isViewSubEnvSandbox: function() {
    return coreConstants.IS_VIEW_SUB_ENVIRONMENT_SANDBOX;
  },

  viewEnvProduction: function() {
    return coreConstants.VIEW_ENVIRONMENT_PRODUCTION;
  },

  viewEnvStaging: function() {
    return coreConstants.VIEW_ENVIRONMENT_STAGING;
  },

  viewEnvDevelopment: function() {
    return coreConstants.VIEW_ENVIRONMENT_DEVELOPMENT;
  },

  isViewEnvProduction: function() {
    return coreConstants.IS_VIEW_ENVIRONMENT_PRODUCTION;
  },

  isViewEnvStaging: function() {
    return coreConstants.IS_VIEW_ENVIRONMENT_STAGING;
  },

  isViewEnvDevelopment: function() {
    return coreConstants.IS_VIEW_ENVIRONMENT_DEVELOPMENT;
  },

  mainnetBaseURL: function() {
    return coreConstants.MAINNET_BASE_URL_PREFIX;
  },

  testnetBaseURL: function() {
    return coreConstants.TESTNET_BASE_URL_PREFIX;
  },

  isMainNetUrlPrefix: function(env, options) {
    if (!env || env == coreConstants.MAINNET_BASE_URL_PREFIX) {
      return options.fn(this);
    }
    return options.inverse(this);
  },

  isTestNetUrlPrefix: function(env, options) {
    if (env && env == coreConstants.TESTNET_BASE_URL_PREFIX) {
      return options.fn(this);
    }
    return options.inverse(this);
  },

  etherscanEndpoint: function() {
    if (coreConstants.IS_VIEW_SUB_ENVIRONMENT_MAIN && coreConstants.IS_VIEW_ENVIRONMENT_PRODUCTION) {
      return 'etherscan.io';
    } else {
      return 'ropsten.etherscan.io';
    }
  },

  ostBadge: function(badge) {
    if (badge && badge.toLowerCase() == 'ost') {
      return 'ost-badge';
    } else {
      return 'ost-alpha-badge';
    }
  },

  toBaseValue: function(value, conversionFactor, decimal) {
    if (!value) return 0;
    var valueBigNumber = new bigNumber(value.toString()),
      conversionFactor = conversionFactor || 1,
      ostValue = valueBigNumber.dividedBy(conversionFactor.toString()),
      decimal = decimal || 18,
      divider = new bigNumber(10).pow(decimal.toString());

    return ostValue.dividedBy(divider).toString(10);
  },

  toDecimalValue: function(value, decimal) {
    if (!value) return 0;
    decimal = Number(decimal);
    if (isNaN(decimal)) {
      decimal = 18;
    }
    var valueBigNumber = new bigNumber(value.toString()),
      divider = new bigNumber(10).pow(decimal);
    return valueBigNumber.dividedBy(divider).toString(10);
  },

  toDecimalValueToFixed: function(value, decimal, precision) {
    let val = Helper.toDecimalValue(value, decimal);
    return Helper.displayToFixed(val, precision);
  },

  inverseDisplayBtToOst: function(conversionFactor, precesion, options) {
    if (conversionFactor) {
      let val = new bigNumber(1).dividedBy(conversionFactor);
      return Helper.displayToFixed(val, precesion);
    }
    return '';
  },

  getTXFee: function(gasUsed, gasPrice) {
    if (!gasUsed) return 0;
    var oThis = this,
      txFeeBn = new bigNumber(gasPrice).mul(gasUsed);
    if (txFeeBn) {
      return web3.utils.fromWei(txFeeBn.toString()).toString(10);
    }
    return 0;
  }
};
