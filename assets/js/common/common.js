// Namespace
var ns =
  window.ns ||
  function ns(ns_string) {
    var parts = ns_string.split('.'),
      parent = this,
      pl,
      i;

    pl = parts.length;
    for (i = 0; i < pl; i++) {
      //create a property if it doesn't exist
      if (typeof parent[parts[i]] == 'undefined') {
        parent[parts[i]] = {};
      }

      parent = parent[parts[i]];
    }

    return parent;
  };

var stakeCurrencies = {
  OST: {
    sandbox: 'OSTT',
    mainnet: 'OST'
  },
  USDC: {
    sandbox: 'USDCT',
    mainnet: 'USDC'
  }
};

// Handlebar compile for front-end
if (Handlebars) {
  Handlebars.compile_fe = function(str) {
    return Handlebars.compile(str.replace(/\[\[/g, '{{').replace(/\]\]/g, '}}'));
  };

  Handlebars.registerHelper('fromWei', function(data, options) {
    return PriceOracle.toEtherFromWei(data).toString(10);
  });

  Handlebars.registerHelper('toDate', function(timestamp, options) {
    if (!timestamp) return '';

    var timeInMilli = timestamp * 1000,
      currentTimeInMilli = new Date().getTime(),
      timeInMilliDiff = currentTimeInMilli - timeInMilli,
      milliSecIn2Days = 86400000 * 2;

    if (timeInMilliDiff < milliSecIn2Days) {
      return moment(timeInMilli).fromNow();
    } else {
      return moment(timeInMilli)
        .utc()
        .format('Do MMM YYYY');
    }
  });

  Handlebars.registerHelper('toNumeral', function(number, options) {
    if (!number) return '';

    var bigNumber = convertToBigNumber(number);

    if (bigNumber.isLessThan(convertToBigNumber(10000000000))) {
      return numeral(bigNumber.toString(10)).format('0,0');
    } else {
      return numeral(bigNumber.toString(10)).format('0,0.00a');
    }
  });

  Handlebars.registerHelper('fromWeitoNumeral', function(number, options) {
    return Handlebars.helpers.toNumeral(Handlebars.helpers.fromWei(number));
  });

  Handlebars.registerHelper('getTXFee', function(gasUsed, gasPrice) {
    return PriceOracle.getDisplayTransactionFee(gasUsed, gasPrice);
  });

  Handlebars.registerHelper('baseCurrencySymbol', function(token, baseCurrencies, env, options) {
    if (!token || !baseCurrencies) return;
    env = env || 'mainnet';
    var baseContractAddress = token && token['baseCurrencyContractAddress'],
      addressDetails = baseCurrencies && baseCurrencies[baseContractAddress],
      baseCurrencySymbol = (addressDetails && addressDetails['symbol']) || 'OST',
      baseCurrencyConfig = stakeCurrencies[baseCurrencySymbol],
      symbol = baseCurrencyConfig[env];
    return symbol;
  });

  Handlebars.registerHelper('getTransactionToAddress', function(contractAddress, toAddress, options) {
    if (contractAddress) {
      return contractAddress;
    }
    return toAddress;
  });

  Handlebars.registerHelper('getDisplayTransactionToAddress', function(contractAddress, toAddress, options) {
    if (contractAddress) {
      return 'Contract Deployed';
    }
    return toAddress;
  });

  Handlebars.registerHelper('inverseDisplayBtToOst', function(conversionFactor, options) {
    if (conversionFactor) {
      return PriceOracle.inverseBtToOst(conversionFactor).toString();
    }
    return '';
  });

  Handlebars.registerHelper('toBaseValue', function(value, conversionFactor, decimal) {
    return Handlebars.helpers.toNumeral(PriceOracle.toBaseValue(value, conversionFactor, decimal));
  });

  Handlebars.registerHelper('toDecimalValue', function(value, decimal) {
    return PriceOracle.toDecimalValue(value, decimal);
  });

  Handlebars.registerHelper('toDecimalValueDisplayPrecision', function(value, decimal, precision) {
    var val = PriceOracle.toDecimalValue(value, decimal);
    return PriceOracle.toDisplayPrecision(val, precision);
  });

  Handlebars.registerHelper('getIndex', function(pageStartIndex, index) {
    pageStartIndex = pageStartIndex || 0;
    index = index || 0;
    return parseInt(pageStartIndex) + parseInt(index) + 1;
  });

  Handlebars.registerHelper('when', function(operand_1, operator, operand_2, options) {
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
  });
}

function convertToBigNumber(number) {
  return number instanceof BigNumber ? number : new BigNumber(number);
}

// Global locales customizations
moment.updateLocale('en', {
  relativeTime: {
    s: 'few sec',
    ss: '%d sec',
    m: 'a min',
    mm: '%d mins'
  }
});
numeral.locales.en.abbreviations = {
  thousand: ' k',
  million: ' M',
  billion: ' Bn',
  trillion: ' Tn'
};
